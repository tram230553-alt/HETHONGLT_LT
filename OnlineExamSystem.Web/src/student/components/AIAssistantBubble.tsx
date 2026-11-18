import { toast } from "../../services/toast";
import { askAi, getAiTopics, type AiTopic } from '../../services/learningAiService';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Send, Sparkles, Bot, Volume2, VolumeX, HelpCircle, Brain, BookOpen, Clock, RefreshCw, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { AIChatMessage, UserStats } from "../types";

interface AIAssistantBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string; // Nếu mở chatbot kèm từ khóa sẵn
  stats: UserStats;
}

// Hàm loại bỏ dấu tiếng Việt để so khớp từ khóa động chuẩn xác
function removeVietnameseAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Áp dụng bảo mật cơ bản: Làm sạch dữ liệu đầu vào chống chèn mã độc (Input Sanitization)
function sanitizeInput(text: string): string {
  // React renders text safely; keep comparison symbols used in math questions.
  return (text || '').substring(0, 2000);
}

// Subcomponent để tạo hiệu ứng gõ chữ (typewriter streaming effect) giống AI thật 100%
interface StreamingTextProps {
  text: string;
  isAI: boolean;
  onComplete: () => void;
  isFinished: boolean;
  renderMessageText: (text: string) => React.ReactNode;
}

function StreamingText({ text, isAI, onComplete, isFinished, renderMessageText }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = React.useState(isFinished ? text : "");

  React.useEffect(() => {
    if (isFinished || !isAI) {
      setDisplayedText(text);
      return;
    }

    // Tốc độ gõ điều chỉnh theo độ dài của phản hồi (phản hồi dài thì gõ nhanh hơn)
    let currentIndex = 0;
    const increment = text.length > 500 ? 5 : text.length > 250 ? 3 : 2;
    
    const interval = setInterval(() => {
      currentIndex += increment;
      if (currentIndex >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
        onComplete();
      } else {
        setDisplayedText(text.substring(0, currentIndex));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text, isAI, isFinished, onComplete]);

  return <>{renderMessageText(displayedText)}</>;
}

export default function AIAssistantBubble({ isOpen, onClose, initialPrompt, stats }: AIAssistantBubbleProps) {
  const [topics, setTopics] = React.useState<AiTopic[]>([]);
  const [topicId, setTopicId] = React.useState('');
  React.useEffect(() => { let active = true; getAiTopics().then(t => { if (active) setTopics(t); })
    .catch(e => {if(active) setErrorStr(e.message);}); return () => {active = false;}; }, []);
  // Bản ghi tin nhắn cuộc thoại
  const [messages, setMessages] = React.useState<AIChatMessage[]>([
    {
      id: "ai_init_1",
      sender: "ai",
      text: `👋 Chào bạn! Tôi là SmartExam AI - Gia sư Luyện thi THPT của bạn.\n\nMục tiêu học tập bạn đã đặt: Đạt tốt thiểu **${stats.targetScore} điểm** để đỗ vào **${stats.targetUniversity}**!\n\nTôi có thể giải đáp chi tiết lý thuyết, hướng dẫn bóc tách bài thi khó môn Toán, Lý, Hóa, Anh hoặc cho lời khuyên ôn tập 9+. Bạn cần tôi trợ giúp chuyên đề nào hôm nay?`,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      isFinished: true, 
    },
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorStr, setErrorStr] = React.useState<string | null>(null);

  // States chẩn đoán kết nối API Gemini
  const [connectionStatus, setConnectionStatus] = React.useState<'checking' | 'healthy' | 'error'>('checking');
  const [connectionDiagnostic, setConnectionDiagnostic] = React.useState<{
    errorType?: string;
    message?: string;
    details?: string;
    solution?: string;
  } | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = React.useState<boolean>(false);

  // Quản lý việc đọc tiếng nói (Text-To-Speech)
  const [activeSpeakingId, setActiveSpeakingId] = React.useState<string | null>(null);

  // Quản lý các chặng suy nghĩ đa giai đoạn để AI giống thật hơn
  const [thinkingStep, setThinkingStep] = React.useState(0);

  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống đáy lịch sử trò chuyện khi tin nhắn tăng hoặc đang gõ
  React.useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Kích hoạt khi có initialPrompt từ bên ngoài truyền vào
  React.useEffect(() => {
    if (isOpen && initialPrompt) {
      const timer = setTimeout(() => {
        handleSendMessage(initialPrompt);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialPrompt]);

  // Luân chuyển chặng suy nghĩ của AI khi đang load
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setThinkingStep(0);
      interval = setInterval(() => {
        setThinkingStep((prev) => (prev + 1) % 3);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Thu hồi tiếng nói khi đóng bot
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices(); // Kích hoạt nạp voice
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Đánh dấu tin nhắn là đã hoàn thành hiệu ứng gõ để tránh re-render gõ lại từ đầu
  const handleMarkMessageFinished = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isFinished: true } : m))
    );
  };

  // Hệ thống tạo giọng nói sư phạm tiếng Việt (Vietnamese Text-to-Speech)
  const handleToggleSpeak = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Trình duyệt của bạn không hỗ trợ tính năng phát thanh.");
      return;
    }

    if (activeSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    // Tắt các luồng âm thanh đang chạy trước đó
    window.speechSynthesis.cancel();

    // Làm sạch Markdown thô để đọc xuôi tai hơn
    const plainText = text
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/[-*]/g, "")
      .replace(/\(Ví dụ.*?\)/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(plainText);
    const voices = window.speechSynthesis.getVoices();
    
    // Ưu tiên chọn giọng tiếng Việt (VN) của thiết bị
    const viVoice = voices.find(v => v.lang.includes("vi") || v.lang.includes("VI"));
    if (viVoice) {
      utterance.voice = viVoice;
    }
    
    utterance.rate = 1.05; // Tăng nhẹ tốc độ phát cho tự nhiên giống người thật giảng bài
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setActiveSpeakingId(null);
    };
    utterance.onerror = () => {
      setActiveSpeakingId(null);
    };

    setActiveSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Gửi tin nhắn lên server Proxy gọi Gemini API (Có truyền user stats)
  const handleSendMessage = async (customText?: string) => {
    const rawToSend = (customText || inputValue);
    const textToSend = sanitizeInput(rawToSend).trim(); // Áp dụng bảo vệ Input Sanitization
    if (!textToSend || isGenerating) return;

    if (!customText) {
      setInputValue("");
    }
    setErrorStr(null);

    // Thêm câu hỏi của học sinh vào khung chat
    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      isFinished: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const history = messages.filter(m => m.id !== 'ai_init_1' && !m.id.startsWith('ai_error_'))
        .slice(-10).map(m => ({role: m.sender === 'user' ? 'user' : 'model', text: m.text.slice(0, 4000)}));
      const data = await askAi(textToSend, topicId, history);
      setConnectionStatus('healthy');
      const aiMsg: AIChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.text || "Xin lỗi bạn, tôi chưa xử lý được câu học này.",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isFinished: false, // Kích hoạt hiệu ứng dập chữ
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setConnectionStatus('error');
      setErrorStr(err.message || "Lỗi kết nối máy chủ.");
      
      const errorMsg: AIChatMessage = {
        id: `ai_error_${Date.now()}`,
        sender: "ai",
        text: `Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại. Lỗi: ${err.message}`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isFinished: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Tìm nạp nhãn trạng thái suy nghĩ đa chặng của AI bám sát nghiệp vụ giáo dục
  const getThinkingLabel = () => {
    switch (thinkingStep) {
      case 0:
        return "🤖 Đang phân tích câu hỏi & đối chiếu ma trận đề thi THPT...";
      case 1:
        return "🧠 Đang tính toán quy trình giải step-by-step chi tiết...";
      default:
        return "✍️ Đang hoàn thiện lời giải sư phạm chuẩn 9+ dễ hiểu...";
    }
  };

  // Tạo đề xuất câu hỏi tiếp thị linh hoạt theo bối cảnh cuộc thoại cuối
  const getDynamicSuggestions = () => {
    if (messages.length <= 1) {
      return [
        "Mẹo giải quyết các câu trắc nghiệm cực trị ?",
        "Công thức tính nhanh thể tích khối chóp lăng trụ ?",
        "Lược giải cấu trúc câu bị động dễ mất điểm ?",
        "Bí quyết ôn thi 9+ vào trường đại học top đầu ?",
      ];
    }

    // Lấy tin nhắn cuối cùng từ AI để trích xuất từ khóa
    const lastAILog = [...messages].reverse().find((m) => m.sender === "ai");
    if (!lastAILog) {
      return [
        "Thầy cho em lời khuyên ôn tập hiệu quả?",
        "Cho em thi thử 1 câu trắc nghiệm nhanh?",
      ];
    }

    const lowerText = lastAILog.text.toLowerCase();
    const unsignText = removeVietnameseAccents(lowerText);

    // So khớp từ khóa động để đề xuất
    if (unsignText.includes("cuc tri") || unsignText.includes("dao ham") || unsignText.includes("bien thien")) {
      return [
        "Cho em ví dụ cực trị áp dụng câu này? ✍️",
        "Mẹo bấm máy tính cực trị hàm số nhanh? ⚙️",
        "Có bao nhiêu cực trị trong đề thi năm ngoái? 📊",
        "Giải thích cho em về nguyên hàm, tích phân? 📐",
      ];
    }
    if (unsignText.includes("tich phan") || unsignText.includes("nguyen ham")) {
      return [
        "Làm sao để đặt u, dv không bị nhầm lẫn? 🧠",
        "Mẹo bấm máy tính tích phân từng phần? ⚙️",
        "Cho em một câu trắc nghiệm diện tích hình phẳng? 📊",
      ];
    }
    if (unsignText.includes("logarit") || unsignText.includes("mu va log")) {
      return [
        "Công thức đổi cơ số logarit bẫy nhất? ⚠️",
        "Phương pháp giải bất phương trình logarit? 📚",
        "Thi thử 1 câu tính nhanh nghiệm logarit? 📐",
      ];
    }
    if (unsignText.includes("so phuc")) {
      return [
        "Mẹo tìm max min môđun số phức cực nhanh? ⚡",
        "Cách biểu diễn hình học số phức trong Oxy? 📐",
        "Bấm máy giải phương trình bậc hai số phức? ⚙️",
      ];
    }
    if (unsignText.includes("the tich") || unsignText.includes("chop") || unsignText.includes("lang tru")) {
      return [
        "Cách áp dụng công thức tỉ số thể tích Simson? 📐",
        "Cho em một câu ví dụ hình học nâng cao? 🏗️",
        "Mẹo nhớ nhanh công thức đa diện? 🧠",
      ];
    }
    if (unsignText.includes("thi tieng anh") || unsignText.includes("tense") || unsignText.includes("thi cua dong tu")) {
      return [
        "Cho em thêm các ví dụ phối thì hay ra đề? 🇬🇧",
        "Dấu hiệu nhận biết quá khứ hoàn thành? ⏱️",
        "Học thuộc 12 thì tiếng Anh thế nào cho nhanh? 🧠",
      ];
    }
    if (unsignText.includes("bi dong") || unsignText.includes("passive")) {
      return [
        "Bị động cấu trúc 'It is said that' giải nghĩa? 🎓",
        "Bị động của động từ tình thái (modal verb)? ⚠️",
        "Cho em một câu trắc nghiệm bị động luyện tập? 📝",
      ];
    }
    if (unsignText.includes("menh de") || unsignText.includes("who") || unsignText.includes("whom")) {
      return [
        "Mẹo rút gọn mệnh đề quan hệ dạng chủ động (V-ing)? ⚡",
        "Khi nào bắt buộc dùng That thay cho Which? ❌",
        "Phân biệt nhanh Who, Whom và Whose? 🇬🇧",
      ];
    }
    if (unsignText.includes("dao dong") || unsignText.includes("ly") || unsignText.includes("lo xo")) {
      return [
        "Mẹo dùng đường tròn lượng giác giải siêu tốc? 🌀",
        "Công thức chu kỳ con lắc lò xo dễ nhớ nhất? ⚡",
        "Khác biệt giữa sóng dọc và sóng ngang lý 12? 🏎️",
      ];
    }
    if (unsignText.includes("este") || unsignText.includes("lipit") || unsignText.includes("béo")) {
      return [
        "Mẹo viết đồng phân este cực nhanh không sót? ✍️",
        "Cách giải bài toán xà phòng hóa este chất béo? 🧪",
        "Thủ thuật đếm phát biểu este đúng sai? ⚠️",
      ];
    }
    if (unsignText.includes("cacbo") || unsignText.includes("gluco") || unsignText.includes("trang bac")) {
      return [
        "Vì sao Fructozơ vẫn tham gia phản ứng tráng bạc? 🧪",
        "Đồng phân tinh bột và xenlulozơ bẫy thế nào? ⚠️",
        "Mẹo trắc nghiệm đếm số phát biểu Glucozơ? 🧬",
      ];
    }

    return [
      "Cho em xem ví dụ thực tế liên tiếp? 💡",
      "Bí quyết tự học đạt điểm mục tiêu " + stats.targetScore + "đ? 🏆",
      "Thiết kế cho em thử 1 câu trắc nghiệm nhỏ? 📊",
      "Giải thích sâu hơn định lý trong câu vừa rồi? 🧠",
    ];
  };

  if (!isOpen) return null;

  // Phân tách chữ in đậm (**) và mã code (`) để hiển thị bóng bẩy hơn
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.flatMap((part, i) => {
      if (i % 2 === 1) {
        return [<strong key={`b-${i}`} className="font-bold text-[var(--theme-text)]">{part}</strong>];
      }
      const codeParts = part.split(/`([\s\S]*?)`/g);
      return codeParts.map((subPart, j) => {
        if (j % 2 === 1) {
          return <code key={`c-${i}-${j}`} className="bg-[var(--theme-surface-soft)] text-rose-500 font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold border border-[var(--theme-border)]/50">{subPart}</code>;
        }
        return subPart;
      });
    });
  };

  // Render định dạng tin nhắn đẹp có xuống dòng và tiêu đề khoa học
  const renderMessageText = (text: string) => {
    return text.split("\n").map((line, index) => {
      const trimmed = line.trim();
      
      // Tiêu đề dạng ###
      if (trimmed.startsWith("###")) {
        const textOnly = trimmed.replace(/^###\s*/, "");
        return (
          <h3 key={index} className="font-display font-bold text-[var(--theme-text)] text-xs mt-3 mb-1.5 flex items-center gap-1.5">
            {parseBoldText(textOnly)}
          </h3>
        );
      }

      // Tiêu đề dạng ##
      if (trimmed.startsWith("##")) {
        const textOnly = trimmed.replace(/^##\s*/, "");
        return (
          <h2 key={index} className="font-display font-extrabold text-[var(--theme-primary)] text-xs mt-4 mb-2 border-b border-[#E9EDF7] pb-1">
            {parseBoldText(textOnly)}
          </h2>
        );
      }

      // Xử lý tiêu đề phụ hoặc gạch đầu dòng dạng bullet
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const textOnly = trimmed.replace(/^[-*]\s*/, "");
        return (
          <li key={index} className="ml-4 list-disc font-sans text-xs my-0.5 leading-relaxed text-[var(--theme-text-muted)]">
            {parseBoldText(textOnly)}
          </li>
        );
      }

      if (!trimmed) {
        return <div key={index} className="h-1.5" />;
      }

      return (
        <p key={index} className="font-sans text-xs my-1 leading-relaxed text-[var(--theme-text-muted)]">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#F8FAFF] flex flex-col pt-4 animate-fade-in">
      {/* HEADER GIA SƯ AI */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-[#E9EDF7] bg-[var(--theme-surface)] shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-tr from-[var(--theme-primary)] to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md relative">
            <Bot className="w-5 h-5 animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[var(--theme-text)] text-sm">SmartExam AI Coach</span>
              <span className="text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                {connectionStatus === 'healthy' ? 'Đã kết nối AI' : connectionStatus === 'error' ? 'Kết nối lỗi' : 'Chưa kiểm tra AI'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-300" /> Luôn đồng hành với mơ ước {stats.fullName || "Đức"}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          id="btn-close-ai-chat"
          className="w-8 h-8 rounded-full bg-[var(--theme-surface-soft)] flex items-center justify-center text-slate-400 hover:text-[var(--theme-text-muted)] hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* LỊCH SỬ TIN NHẮN (Conversational Message Feed) */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
        {messages.map((m) => {
          const isAI = m.sender === "ai";
          const isSpeaking = activeSpeakingId === m.id;
          return (
            <div 
              key={m.id} 
              className={`flex gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] flex items-center justify-center text-xs shrink-0 border border-[var(--theme-primary)]/10 mt-1 shadow-sm">
                  🎓
                </div>
              )}
              <div className="max-w-[80%] space-y-1">
                <div className={`p-3.5 rounded-2xl text-[var(--theme-text)] shadow-soft relative group ${
                  isAI 
                    ? "bg-[var(--theme-surface)] border border-[#E9EDF7] rounded-tl-none text-[var(--theme-text-muted)]" 
                    : "bg-[var(--theme-primary)] text-white rounded-tr-none shadow-pastel-blue"
                }`}>
                  <StreamingText
                    text={m.text}
                    isAI={isAI}
                    isFinished={!!m.isFinished}
                    onComplete={() => handleMarkMessageFinished(m.id)}
                    renderMessageText={renderMessageText}
                  />

                  {/* NÚT THOẠI GIỌNG NÓI CHÂN THỰC CHO TIN NHẮN AI (Speech synthesis controller) */}
                  {isAI && m.isFinished && (
                    <button
                      onClick={() => handleToggleSpeak(m.text, m.id)}
                      title={isSpeaking ? "Dừng giọng nói giảng bài" : "Nghe đọc bằng giọng nói sư phạm"}
                      className={`absolute -right-3 -bottom-3 w-7 h-7 rounded-full flex items-center justify-center shadow-md border transition cursor-pointer ${
                        isSpeaking 
                          ? "bg-rose-500 text-white border-rose-400 animate-bounce" 
                          : "bg-[var(--theme-surface)] text-[var(--theme-text-light)] border-[var(--theme-border)] hover:bg-indigo-50 hover:text-[var(--theme-primary)]"
                      }`}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mt-1">
                  <span className={!isAI ? "w-full text-right block" : ""}>{m.timestamp}</span>
                  {isAI && isSpeaking && (
                    <span className="text-[var(--theme-primary)] font-bold animate-pulse">🔊 Đang giảng giải trực tiếp...</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING STATE - MÔ PHỎNG LUỒNG SUY NGHĨ NHIỀU CHẶNG (High-fidelity Thinking animation) */}
        {isGenerating && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs shrink-0 mt-1">
              🧠
            </div>
            <div className="max-w-[80%] p-3.5 rounded-2xl bg-[var(--theme-surface)] border border-indigo-100/60 rounded-tl-none shadow-sm space-y-1">
              <div className="flex flex-col gap-1 text-slate-400 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[var(--theme-primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  <span className="font-display font-bold text-[10px] text-indigo-500 ml-1 animate-pulse">SmartExam AI đang tư duy</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans italic pl-1">
                  {getThinkingLabel()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Anchor point để tự động cuộn xuống đáy */}
        <div ref={endOfMessagesRef} />
      </div>

      {/* ⚡ TÍNH NĂNG GIA SƯ CHUYÊN SÂU (6 Special Agent Tools - Goal 6) */}
      <div className="px-5 py-2.5 border-t border-[#E9EDF7]/50 bg-indigo-50/10 space-y-1.5">
        <div className="flex items-center gap-1 px-0.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">Bộ công cụ Gia Sư AI chuyên sâu:</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            {
              label: "Chat với AI",
              prompt: "Chào thầy, em muốn chat trao đổi tự do để học tập hiệu quả hơn ạ! 👋",
              icon: MessageSquare,
              color: "hover:bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300"
            },
            {
              label: "Giải thích bài",
              prompt: "Thầy ơi, thầy phân tích chi tiết quy trình tư duy giải một câu bài tập nâng cao thuộc chuyên đề ôn luyện này giúp em với ạ! ❓",
              icon: HelpCircle,
              color: "hover:bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300"
            },
            {
              label: "Tạo đề luyện",
              prompt: "Hãy thiết kế cho em 1 câu hỏi trắc nghiệm kiểm tra nhanh ngẫu nhiên có 4 phương án lựa chọn A, B, C, D thuộc môn học này để em làm thử nhé! 📝",
              icon: Brain,
              color: "hover:bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300"
            },
            {
              label: "Tránh bẫy đề",
              prompt: "Chỉ ra cho em các lỗi sai thường gặp nhất hoặc những cú lừa dễ làm mất điểm của sĩ tử ở chương học này để em tuyệt đối phòng tránh! ⚠️",
              icon: AlertCircle,
              color: "hover:bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300"
            },
            {
              label: "Tóm tắt lý thuyết",
              prompt: "Hệ thống hóa ngắn gọn bằng sơ đồ hoặc gạch đầu dòng các công thức lý thuyết tinh hoa nhất cần ghi nhớ thuộc chương học này để em ôn nhanh lý thuyết! 📖",
              icon: BookOpen,
              color: "hover:bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300"
            }
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <button
                key={idx}
                id={`ai-assistant-suite-tool-${idx}`}
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isGenerating}
                className={`py-1.5 px-2 bg-[var(--theme-surface)] border rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-extrabold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${item.color}`}
              >
                <IconComponent className="w-3 h-3 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-2">
        <label className="block text-xs">Chủ đề hỏi đáp
          <select aria-label="Chủ đề hỏi đáp" disabled={isGenerating} value={topicId} onChange={e => {setTopicId(e.target.value); setMessages(prev => prev.slice(0,1));}}
            className="w-full border rounded-xl p-2 text-slate-800 bg-white">
            <option value="">Hỏi kiến thức chung</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.subjectName} · {t.chapterName} / {t.name}</option>)}
          </select>
        </label>
        <p className="text-xs text-slate-500 mt-1">AI hỗ trợ học tập; hãy đối chiếu lời giải với tài liệu và giáo viên.</p>
      </div>
      {/* CÂU HỎI ĐỀ XUẤT ĐỘNG (Dynamic Contextual suggestion chips) */}
      {!isGenerating && (
        <div className="px-5 py-3 border-t border-[#E9EDF7]/60 bg-[var(--theme-surface-soft)]/50 space-y-2">
          <div className="flex items-center gap-1 px-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
            <span className="text-[10px] uppercase font-heavy tracking-wider text-[var(--theme-primary)] font-bold block">Gợi ý chủ đề tiếp theo bám sát lý thuyết:</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
            {getDynamicSuggestions().map((s, idx) => (
              <button
                key={idx}
                id={`dynamic-suggestion-${idx}`}
                onClick={() => handleSendMessage(s)}
                className="text-left bg-[var(--theme-surface)] border border-[#E9EDF7] hover:border-[var(--theme-primary)]/50 hover:bg-indigo-50/20 text-xs text-[var(--theme-text-muted)] font-sans px-3 py-2.5 rounded-2xl transition truncate cursor-pointer shadow-sm active:scale-98"
              >
                💡 {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER INPUT ĐỂ KHÁCH HÀNG GÕ */}
      <div className="p-4 bg-[var(--theme-surface)] border-t border-[#E9EDF7] flex items-center gap-2">
        <input
          id="chat-input-text"
          type="text"
          maxLength={2000}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          disabled={isGenerating}
          placeholder="Khúc mắc Toán, Lý, Hóa, Anh hay cần tư vấn ôn tập...?"
          className="flex-1 bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] transition disabled:opacity-50"
        />
        <button
          id="btn-send-chat"
          onClick={() => handleSendMessage()}
          disabled={isGenerating || !inputValue.trim()}
          className="w-11 h-11 bg-[var(--theme-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6384DF] text-white rounded-xl flex items-center justify-center transition shadow-pastel-blue shrink-0 active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
