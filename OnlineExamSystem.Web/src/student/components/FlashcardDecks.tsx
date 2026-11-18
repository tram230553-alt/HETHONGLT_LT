import { confirmDialog } from "../../services/confirm";
import { toast } from "../../services/toast";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  RotateCw, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Trash2, 
  Layers, 
  X, 
  Award, 
  Check, 
  HelpCircle, 
  Lightbulb,
  AlertCircle,
  FileText,
  BadgeAlert,
  FolderPlus,
  RefreshCw
} from "lucide-react";
import { Flashcard, SubjectId } from "../types";
import { INITIAL_FLASHCARDS } from "../data";
import { addLearningActivity } from "../utils/activityLogger";

interface FlashcardDecksProps {
  onEarnGems: (amount: number) => void;
  selectedSubjectId?: SubjectId;
  onClose: () => void;
}

// Cấu trúc bộ thẻ (Deck)
interface Deck {
  id: string;
  title: string;
  description: string;
  subjectId: SubjectId;
  isCustom?: boolean;
}

// 2 Hộp Leitner tương ứng mức độ ghi nhớ riêng biệt
const LEITNER_BOXES = [
  { id: 1, label: "Hộp 1: Cần ôn lại", desc: "Các khái niệm cần tiếp tục rèn luyện thêm", color: "bg-rose-50 text-rose-600 border-rose-200" },
  { id: 2, label: "Hộp 2: Đã thuộc", desc: "Đã nắm chắc lý thuyết và ghi nhớ vững vàng", color: "bg-emerald-50 text-emerald-600 border-emerald-200" }
];

export default function FlashcardDecks({ onEarnGems, selectedSubjectId = "english", onClose }: FlashcardDecksProps) {
  // Trạng thái môn học active ở màn hình Dashboard
  const [activeSubject, setActiveSubject] = useState<SubjectId>(selectedSubjectId);
  
  // Danh sách các bộ thẻ (Decks) mặc định kết hợp custom
  const [decks, setDecks] = useState<Deck[]>(() => {
    const cached = localStorage.getItem("smartexam_decks_catalog");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    
    // Khởi tạo các bộ đề mặc định dựa theo môn học
    return [
      { id: "pre_eng", title: "Tiếng Anh: Từ Vựng Chuyên Sâu THPT", description: "Bộ từ vựng then chốt thường bắt gặp trong kỳ thi Đại học Quốc gia.", subjectId: "english" },
      { id: "pre_math", title: "Toán Học: Đạo Hàm & Tích Phân", description: "Các công thức đạo hàm, tích phân và thể tích khối đa diện then chốt.", subjectId: "math" },
      { id: "pre_phy", title: "Vật Lý: Dao Động Cơ & Từ Trường", description: "Công thức và mẹo ghi nhớ lý thuyết con lắc và dòng điện xoay chiều.", subjectId: "physics" },
      { id: "pre_chem", title: "Hóa Học: Cacbohidrat & Este", description: "Ôn tập phản ứng hóa học đặc trưng, nhận biết glucozo và saccarozo.", subjectId: "chemistry" }
    ];
  });

  // Lưu Decks vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem("smartexam_decks_catalog", JSON.stringify(decks));
  }, [decks]);

  // Bộ dữ liệu Flashcards toàn diện: Load từ localStorage hoặc initialize từ INITIAL_FLASHCARDS
  const [allCards, setAllCards] = useState<Flashcard[]>(() => {
    const defaultCards = INITIAL_FLASHCARDS.map(c => ({
      ...c,
      box: c.isMastered ? 2 : undefined, // Thẻ đã thuộc ở Hộp 2, thẻ khác chưa ở hộp nào (Thẻ mới tinh)
      isCustom: false,
      customDeckId: c.subjectId === "english" ? "pre_eng" : 
                    c.subjectId === "math" ? "pre_math" : 
                    c.subjectId === "physics" ? "pre_phy" : "pre_chem"
    }));

    const cached = localStorage.getItem("smartexam_flashcards_db_v2");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const parsedCards = parsed.map((c: any) => {
            // Đảm bảo có customDeckId chính xác cho từng thẻ mẫu cũ và mới
            const correctDeckId = c.customDeckId || (
              c.subjectId === "english" ? "pre_eng" : 
              c.subjectId === "math" ? "pre_math" : 
              c.subjectId === "physics" ? "pre_phy" : "pre_chem"
            );
            
            // Chuẩn hóa Leitner Box: gộp các hộp 3, 4 cũ thành Hộp 2 "Đã thuộc" để đồng bộ tuyệt đối ngoài và trong
            let normalizedBox = c.box;
            if (c.box !== undefined && c.box !== null && c.box !== 0) {
              if (c.box === 1) {
                normalizedBox = 1;
              } else {
                normalizedBox = 2; // Gộp các hộp cũ 2, 3, 4 thành hộp 2 duy nhất cho mô hình 2 hộp
              }
            } else if (c.isMastered) {
              normalizedBox = 2;
            }

            return {
              ...c,
              customDeckId: correctDeckId,
              box: normalizedBox,
              isMastered: normalizedBox === 2
            };
          });

          // Tải bổ sung các thẻ mặc định mới chưa có trong cache
          const existingIds = new Set(parsedCards.map(c => c.id));
          const missingDefaultCards = defaultCards.filter(c => !existingIds.has(c.id));
          
          return [...parsedCards, ...missingDefaultCards];
        }
      } catch (e) {}
    }

    return defaultCards;
  });

  // Đồng bộ Flashcards xuống localStorage
  useEffect(() => {
    localStorage.setItem("smartexam_flashcards_db_v2", JSON.stringify(allCards));
  }, [allCards]);

  // Trạng thái cho Hộp thoại xác nhận tùy chỉnh (Custom React Confirm Dialog)
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Trạng thái cho Hộp thoại cảnh báo tùy chỉnh (Custom React Alert Modal)
  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  const showPromptConfirm = (title: string, message: string, onConfirmAction: () => void) => {
    setCustomConfirm({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setCustomConfirm(null);
      }
    });
  };

  const showPromptAlert = (title: string, message: string) => {
    setCustomAlert({
      isOpen: true,
      title,
      message
    });
  };

  // Bộ thẻ đang được chọn để học hoặc kiểm tra
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  
  // Chế độ thao tác: "decks" (Dashboard), "study" (Học flashcards), "quiz" (Kiểm tra trắc nghiệm/tự luận)
  const [mode, setMode] = useState<"decks" | "study" | "quiz">("decks");

  // Trạng thái modal Thêm Bộ Thẻ & Thêm Thẻ Ghi Nhớ
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [newDeckSubject, setNewDeckSubject] = useState<SubjectId>("english");

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");
  const [newCardExample, setNewCardExample] = useState("");

  // ===================== TRẠNG THÁI ÔN TẬP FLASHCARDS =====================
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [studySource, setStudySource] = useState<"all" | "unassigned" | "box1" | "box2" | "unmastered">("all");
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [vibrateEffect, setVibrateEffect] = useState(false);
  const [sparkleNotice, setSparkleNotice] = useState<string | null>(null);

  // ===================== TRẠNG THÁI QUIZ (KIỂM TRA) =====================
  interface QuizQuestion {
    id: string;
    cardId: string;
    type: "mc" | "tf" | "sa"; // Multiple Choice, True/False, Short Answer
    prompt: string;
    correctAnswer: string;
    options?: string[]; // Dành cho multiple choice
    cardFront: string;
    cardBack: string;
    example?: string;
  }

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [tfSelected, setTfSelected] = useState<boolean | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswersHistory, setQuizAnswersHistory] = useState<Array<{ qIndex: number; isCorrect: boolean; userAnswer: string; correctAns: string }>>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Lọc bộ thẻ thuộc môn học active ở màn hình Dashboard
  const filteredDecks = useMemo(() => {
    return decks.filter(d => d.subjectId === activeSubject);
  }, [decks, activeSubject]);

  // Bộ môn học labels
  const subjectLabels: Record<SubjectId, string> = {
    english: "Tiếng Anh",
    math: "Toán Học",
    physics: "Vật Lý",
    chemistry: "Hóa Học",
  };

  const subjectPredefinedColors: Record<SubjectId, string> = {
    english: "from-teal-100 to-emerald-50 text-emerald-800 border-emerald-200",
    math: "from-blue-100 to-[#EBF2FF] text-[#5577D5] border-blue-200",
    physics: "from-orange-100 to-amber-50 text-amber-800 border-amber-200",
    chemistry: "from-sky-100 to-blue-50 text-sky-800 border-sky-200",
  };

  // Tính số lượng thẻ cho từng Bộ thẻ (Deck) và phân loại Leitner (2 Hộp)
  const deckStats = useMemo(() => {
    const stats: Record<string, { total: number; mastered: number; boxes: number[] }> = {};
    decks.forEach(d => {
      const cardsInDeck = allCards.filter(c => c.customDeckId === d.id);
      const mastered = cardsInDeck.filter(c => c.box === 2).length; // Hộp 2 đại diện cho "Đã thuộc"
      const boxDistribution = [0, 0]; // Box 1: Cần ôn lại, Box 2: Đã thuộc
      cardsInDeck.forEach(c => {
        if (c.box === 1) {
          boxDistribution[0] += 1;
        } else if (c.box === 2) {
          boxDistribution[1] += 1;
        }
      });
      stats[d.id] = {
        total: cardsInDeck.length,
        mastered,
        boxes: boxDistribution
      };
    });
    return stats;
  }, [decks, allCards]);

  // Thêm bộ thẻ tự tạo mới
  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    const newDeck: Deck = {
      id: `custom_deck_${Date.now()}`,
      title: newDeckTitle.trim(),
      description: newDeckDesc.trim() || "Bộ thẻ từ vựng/công thức học tập tự phát triển.",
      subjectId: newDeckSubject,
      isCustom: true
    };

    setDecks(prev => [newDeck, ...prev]);
    setActiveSubject(newDeckSubject);
    setNewDeckTitle("");
    setNewDeckDesc("");
    setShowAddDeckModal(false);
    
    // Thưởng nhẹ 10 ngọc thưởng thiết lập mục tiêu
    onEarnGems(10);
    triggerNotification("🚀 Đã tạo bộ thẻ mới! Thưởng +10 Ngọc.");
  };

  // Xóa bộ thẻ tự chọn
  const handleDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showPromptConfirm(
      "Xóa bộ thẻ học liệu?",
      "Bạn có chắc chắn muốn xóa bộ thẻ này? Tất cả các thẻ ghi nhớ bên trong cũng sẽ bị xóa vĩnh viễn khỏi thiết bị!",
      () => {
        setDecks(prev => prev.filter(d => d.id !== deckId));
        setAllCards(prev => prev.filter(c => c.customDeckId !== deckId));
        if (selectedDeck?.id === deckId) {
          setSelectedDeck(null);
          setMode("decks");
        }
        triggerNotification("🗑️ Đã xóa bộ thẻ học tập thành công.");
      }
    );
  };

  // Thêm Flashcard thủ công mới vào bộ thẻ đang chọn
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim() || !selectedDeck) return;

    const newCard: Flashcard = {
      id: `custom_card_${Date.now()}`,
      subjectId: selectedDeck.subjectId,
      front: newCardFront.trim(),
      back: newCardBack.trim(),
      example: newCardExample.trim() || undefined,
      isMastered: false,
      box: undefined, // Bắt đầu ở trạng thái chưa phân hộp để lật thẻ học mới
      isCustom: true,
      customDeckId: selectedDeck.id
    };

    setAllCards(prev => [...prev, newCard]);
    setNewCardFront("");
    setNewCardBack("");
    setNewCardExample("");
    setShowAddCardModal(false);
    
    // Cập nhật lại list học liệu tức thì nếu đang học
    if (mode === "study" || mode === "quiz") {
      setStudyCards(prev => [...prev, newCard]);
    }

    onEarnGems(5);
    triggerNotification("✍️ Thêm thẻ thành công! Bạn nhận được +5 Ngọc.");
  };

  // Xóa một thẻ khỏi bộ hiện tại
  const handleDeleteCard = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showPromptConfirm(
      "Xóa thẻ ghi nhớ?",
      "Bạn có chắc muốn xóa thẻ ghi nhớ này khỏi hệ thống không?",
      () => {
        setAllCards(prev => prev.filter(c => c.id !== cardId));
        setStudyCards(prev => {
          const filtered = prev.filter(c => c.id !== cardId);
          // Tránh lỗi index vượt biên
          if (currentStudyIndex >= filtered.length && filtered.length > 0) {
            setCurrentStudyIndex(filtered.length - 1);
          }
          return filtered;
        });
        triggerNotification("🗑️ Đã xóa thẻ ghi nhớ thành công.");
      }
    );
  };

  // Kích hoạt mồi nhử thông báo nhỏ dạng Toast
  const triggerNotification = (msg: string) => {
    setSparkleNotice(msg);
    setTimeout(() => setSparkleNotice(null), 3000);
  };

  // ===================== XỬ LÝ HỌC FLASHCARD =====================
  const handleStartStudy = (deck: Deck, source: "all" | "unassigned" | "box1" | "box2" | "unmastered" = "all") => {
    const cardsInDeck = allCards.filter(c => c.customDeckId === deck.id);
    if (cardsInDeck.length === 0) {
      setSelectedDeck(deck);
      setStudyCards([]);
      setMode("study");
      setShowAddCardModal(true); // Gợi ý thêm thẻ
      return;
    }

    // Lọc thẻ theo phân loại nguồn học riêng biệt (hoặc học toàn bộ thẻ)
    let filtered: Flashcard[] = [];
    if (source === "all") {
      filtered = cardsInDeck;
    } else if (source === "unassigned") {
      filtered = cardsInDeck.filter(c => c.box === undefined || c.box === null || c.box === 0);
    } else if (source === "box1" || source === "unmastered") {
      filtered = cardsInDeck.filter(c => c.box === 1);
    } else if (source === "box2") {
      filtered = cardsInDeck.filter(c => c.box === 2);
    }

    setSelectedDeck(deck);
    setStudySource(source);
    setStudyCards(filtered);
    setCurrentStudyIndex(0);
    setIsFlipped(false);
    setMode("study");
  };

  // Quyết định lật thẻ
  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Chuyển card Leitner: Thích ứng Spaced Repetition (2 Hộp: Cần ôn lại / Đã thuộc)
  // isKnown: true => Đưa vào Hộp 2 "Đã thuộc" (Nếu đã là Hộp 2 thì duy trì ở Hộp 2)
  // isKnown: false => Đưa về Hộp 1 "Cần ôn lại" (Nếu là Hộp 1 thì tiếp tục giữ ở Hộp 1)
  const handleLeitnerAnswer = (isKnown: boolean) => {
    if (studyCards.length === 0) return;
    const activeCard = studyCards[currentStudyIndex];
    
    let nextBox = 1;
    let gemReward = 0;
    let feedbackMsg = "";

    if (isKnown) {
      nextBox = 2; // Đặt hoặc duy trì ở Hộp 2 "Đã thuộc"
      gemReward = 10;
      feedbackMsg = "🎉 Xuất sắc! Thẻ ghi nhớ đã được đưa vào Hộp 2: Đã thuộc (+10 Ngọc)";
      
      const VietnameseSub = activeCard.subjectId === "math" ? "Toán" : activeCard.subjectId === "english" ? "Tiếng Anh" : activeCard.subjectId === "physics" ? "Vật Lý" : activeCard.subjectId === "chemistry" ? "Hóa Học" : activeCard.subjectId === "biology" ? "Sinh Học" : "Môn học";
      addLearningActivity(
        "flashcard",
        activeCard.front,
        `Môn ${VietnameseSub}: Đã ôn luyện thành thạo thẻ ghi nhớ "${activeCard.front}" (+10 Ngọc)`,
        activeCard.subjectId
      );
    } else {
      nextBox = 1; // Quay lùi / duy trì ở Hộp 1: Cần ôn lại
      gemReward = 2; // Cộng ngọc khích lệ
      feedbackMsg = "🔴 Cần cố gắng hơn nữa! Thẻ đã chuyển vào Hộp 1: Cần ôn lại (+2 Ngọc)";
      setVibrateEffect(true);
      setTimeout(() => setVibrateEffect(false), 500);
    }

    // Cập nhật thẻ ghi nhớ trong database tổng
    const updatedTotalCards = allCards.map(c => {
      if (c.id === activeCard.id) {
        return {
          ...c,
          box: nextBox,
          isMastered: nextBox === 2
        };
      }
      return c;
    });
    setAllCards(updatedTotalCards);

    // Cập nhật bộ thẻ của phiên học hiện tại
    const updatedStudyCards = studyCards.map((c, i) => {
      if (i === currentStudyIndex) {
        return {
          ...c,
          box: nextBox,
          isMastered: nextBox === 2
        };
      }
      return c;
    });
    setStudyCards(updatedStudyCards);

    // Thưởng ngọc nếu có
    if (gemReward > 0) {
      onEarnGems(gemReward);
    }
    triggerNotification(feedbackMsg);

    // Chuyển sang thẻ tiếp theo sau 450ms
    setTimeout(() => {
      if (currentStudyIndex < studyCards.length - 1) {
        setCurrentStudyIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Hoàn thành bộ thẻ
        triggerNotification("🌟 Tuyệt đỉnh! Bạn đã lật xem và rèn luyện thành công toàn bộ thẻ học.");
        setMode("decks");
      }
    }, 450);
  };


  // ===================== DÀNH CHO TRẮC NGHIỆM ĐA DẠNG QUIZ =====================
  const handleStartQuiz = (deck: Deck) => {
    const cardsInDeck = allCards.filter(c => c.customDeckId === deck.id);
    if (cardsInDeck.length < 2) {
      toast.error("Hệ thống trắc nghiệm yêu cầu tối thiểu 2 thẻ ghi nhớ trong bộ này để tạo ngân hàng câu hỏi đầy đủ!");
      return;
    }

    setSelectedDeck(deck);
    
    // Tự động sinh ra 5-10 câu hỏi ngẫu nhiên với định dạng đa dạng: Multiple-Choice, True/False, Short Answer
    const generatedQuestions: QuizQuestion[] = [];
    const targetLength = Math.min(8, cardsInDeck.length);
    
    // Xáo trộn ngẫu nhiên cards
    const shuffledCards = [...cardsInDeck].sort(() => 0.5 - Math.random());

    for (let i = 0; i < targetLength; i++) {
      const card = shuffledCards[i];
      const randType = Math.random();
      
      if (randType < 0.40 && cardsInDeck.length >= 4) {
        // 1. Sinh câu hỏi Multiple Choice (3 phương án sai từ cards khác)
        const distractors = cardsInDeck
          .filter(c => c.id !== card.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(c => c.back);

        const options = [card.back, ...distractors].sort(() => 0.5 - Math.random());

        generatedQuestions.push({
          id: `q_mc_${Date.now()}_${i}`,
          cardId: card.id,
          type: "mc",
          prompt: `Khái niệm/Từ vựng sau đây mang ý nghĩa nào chính xác? \n\n 👉 "${card.front}"`,
          correctAnswer: card.back,
          options,
          cardFront: card.front,
          cardBack: card.back,
          example: card.example
        });
      } else if (randType < 0.70) {
        // 2. Sinh câu hỏi True / False
        const isTrueMatch = Math.random() > 0.5;
        let showBack = card.back;
        let promptText = "";

        if (isTrueMatch) {
          promptText = `Thông tin sau đây Đúng hay Sai? \n\n Thuật ngữ "${card.front}" mang ý nghĩa là: "${card.back}"`;
        } else {
          // Lấy sai nghĩa
          const randomOtherCard = cardsInDeck.find(c => c.id !== card.id) || card;
          showBack = randomOtherCard.back;
          promptText = `Thông tin sau đây Đúng hay Sai? \n\n Thuật ngữ "${card.front}" mang ý nghĩa là: "${showBack}"`;
        }

        generatedQuestions.push({
          id: `q_tf_${Date.now()}_${i}`,
          cardId: card.id,
          type: "tf",
          prompt: promptText,
          correctAnswer: isTrueMatch ? "Đúng" : "Sai",
          cardFront: card.front,
          cardBack: card.back,
          example: card.example
        });
      } else {
        // 3. Sinh câu hỏi Short Answer
        generatedQuestions.push({
          id: `q_sa_${Date.now()}_${i}`,
          cardId: card.id,
          type: "sa",
          prompt: `Ghi lại thuật ngữ / khái niệm chuẩn xác tương ứng với giải thích học thuật sau: \n\n 📝 "${card.back}"`,
          correctAnswer: card.front,
          cardFront: card.front,
          cardBack: card.back,
          example: card.example
        });
      }
    }

    setQuizQuestions(generatedQuestions);
    setCurrentQuizIndex(0);
    setSelectedQuizOption(null);
    setShortAnswerInput("");
    setTfSelected(null);
    setQuizSubmitted(false);
    setQuizIsCorrect(null);
    setQuizScore(0);
    setQuizAnswersHistory([]);
    setQuizCompleted(false);
    setMode("quiz");
  };

  // Nộp câu trả lời cho câu hiện tại của bài thi thử
  const handleSubmitQuizAnswer = () => {
    if (quizSubmitted) return;

    const currentQ = quizQuestions[currentQuizIndex];
    let isCorrect = false;
    let userAns = "";

    if (currentQ.type === "mc") {
      if (!selectedQuizOption) {
        showPromptAlert("Lựa chọn phương án", "Vui lòng lựa chọn một đáp án phù hợp trước khi nộp kết quả!");
        return;
      }
      userAns = selectedQuizOption;
      isCorrect = (selectedQuizOption === currentQ.correctAnswer);
    } else if (currentQ.type === "tf") {
      if (tfSelected === null) {
        showPromptAlert("Xác định ĐÚNG/SAI", "Vui lòng lựa chọn Đúng hoặc Sai trước khi nộp câu trả lời!");
        return;
      }
      const answerString = tfSelected ? "Đúng" : "Sai";
      userAns = answerString;
      isCorrect = (answerString === currentQ.correctAnswer);
    } else if (currentQ.type === "sa") {
      if (!shortAnswerInput.trim()) {
        showPromptAlert("Nội dung trống", "Vui lòng điền nội dung câu trả lời tự luận trước khi nộp!");
        return;
      }
      userAns = shortAnswerInput.trim();
      
      // So khớp thông minh không sợ dấu, không sợ viết hoa/thường hoặc ngoặc phụ (Mẹo cho tiếng Anh)
      const cleanString = (str: string) => {
        return str.toLowerCase()
          .replace(/\(adj\)|\(v\)|\(n\)|\(adj\)|\(v\)|\(n\)/gi, "")
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          .replace(/\s+/g, " ")
          .trim();
      };
      isCorrect = cleanString(userAns) === cleanString(currentQ.correctAnswer);
    }

    setQuizIsCorrect(isCorrect);
    setQuizSubmitted(true);
    
    // Lưu lịch sử câu hỏi
    setQuizAnswersHistory(prev => [
      ...prev,
      {
        qIndex: currentQuizIndex,
        isCorrect,
        userAnswer: userAns,
        correctAns: currentQ.correctAnswer
      }
    ]);

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      // Khi trả lời đúng, thẻ liên kết sẽ tự động gia tăng Leitner Box một điểm
      upgradeAssociatedCardBox(currentQ.cardId, true);
    } else {
      // Khi trả lời sai, phạt thẻ liên kết lùi về Hộp 1
      upgradeAssociatedCardBox(currentQ.cardId, false);
      setVibrateEffect(true);
      setTimeout(() => setVibrateEffect(false), 500);
    }
  };

  // Tăng/Hạ mức độ nắm bắt thẻ khi làm bài trắc nghiệm liên quan (Hóa giải theo mô hình 2 hộp Leitner)
  const upgradeAssociatedCardBox = (cardId: string, improve: boolean) => {
    setAllCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const currentBox = c.box || 1;
        let nextB = mejorarBox(currentBox, improve);
        return {
          ...c,
          box: nextB,
          isMastered: nextB === 2
        };
      }
      return c;
    }));
  };

  const mejorarBox = (currBox: number, improve: boolean): number => {
    if (improve) {
      return 2; // Hộp 2: Đã thuộc
    }
    return 1; // RESET về Hộp 1: Cần ôn tập hàng ngày
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedQuizOption(null);
      setShortAnswerInput("");
      setTfSelected(null);
      setQuizSubmitted(false);
      setQuizIsCorrect(null);
    } else {
      // Hoàn thiện toàn bộ bài kiểm tra trắc nghiệm
      setQuizCompleted(true);
      // Tính ngọc thưởng thích kích (Ví dụ: 15 ngọc cho mỗi câu đúng và +30 ngọc hoàn thành xuất sắc)
      const totalAwarded = (quizScore * 15) + 30;
      onEarnGems(totalAwarded);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#F8FAFF] flex flex-col pt-0 rounded-t-[32px] overflow-hidden">
      {/* KHUNG TIÊU ĐỀ HEADER CHÍNH */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#E9EDF7] bg-[var(--theme-surface)] text-[var(--theme-text)] shrink-0">
        <button 
          onClick={() => {
            if (mode !== "decks") {
              setMode("decks");
            } else {
              onClose();
            }
          }}
          id="btn-back-decks"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--theme-surface-soft)] hover:bg-[var(--theme-surface-soft)] transition cursor-pointer"
          title={mode === "decks" ? "Thoát" : "Quay lại"}
        >
          <ChevronLeft className="w-5 h-5 text-[var(--theme-text-muted)]" /> 
        </button>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-5 h-5 text-[var(--theme-primary)]" />
          <span className="font-display font-black text-[var(--theme-text)] text-base">
            {mode === "decks" ? "Trạm Ghi Nhớ" : mode === "study" ? "Học Thẻ Leitner" : "Kiểm Tra Trí Nhớ"}
          </span>
        </div>
        <div className="w-10"></div> {/* Spacer để giữ cân bằng */}
      </div>

      {/* THÔNG BÁO POPUP TOAST CÓ HIỆU ỨNG NHẤP NHÁY */}
      {sparkleNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/90 text-white text-xs px-4 py-2.5 rounded-full shadow-lg font-sans font-medium flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{sparkleNotice}</span>
        </div>
      )}

      {/* PHẦN THÂN SCROLLABLE CHỨA NỘI DUNG CHÍNH */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col">
        
        {/* ================================================================= */}
        {/* CHẾ ĐỘ 1: VIEW DANH SÁCH BỘ THẺ (DASHBOARD)                     */}
        {/* ================================================================= */}
        {mode === "decks" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* TABS LỌC MÔN HỌC CHỦ ĐẠO MÀU PASTEL */}
              <div className="flex gap-1.5 p-1 bg-[var(--theme-surface-soft)] rounded-2xl overflow-x-auto no-scrollbar">
                {(["english", "math", "physics", "chemistry"] as SubjectId[]).map((subId) => {
                  const isActive = activeSubject === subId;
                  return (
                    <button
                      key={subId}
                      id={`tab-decks-subject-${subId}`}
                      onClick={() => setActiveSubject(subId)}
                      className={`flex-1 min-w-[85px] py-2.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? "bg-[var(--theme-surface)] text-[var(--theme-primary)] shadow-sm scale-[1.02]" 
                          : "text-[var(--theme-text-light)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-soft)]"
                      }`}
                    >
                      {subjectLabels[subId]}
                    </button>
                  );
                })}
              </div>

              {/* THÔNG SỐ TỔNG QUAN HỌC TẬP THUỘC MÔN HỌC */}
              <div className="bg-gradient-to-br from-[#EFF4FF] to-white p-4.5 rounded-3xl border border-[var(--theme-primary)]/10 flex justify-between items-center shadow-soft">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--theme-primary)]">Môn {subjectLabels[activeSubject]}</span>
                  <h4 className="font-display font-extrabold text-[var(--theme-text)] text-base leading-snug">Spaced Repetition</h4>
                  <p className="text-[11px] text-[var(--theme-text-light)] max-w-[200px]">Nắm vững học phần thông qua lặp lại ngắt quãng thích ứng thông minh.</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-500">
                    <Layers className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase mt-1">
                    {decks.filter(d => d.subjectId === activeSubject).length} Bộ thẻ tổng
                  </span>
                </div>
              </div>

              {/* BẢNG CHỈ DẪN VỀ HỆ THỐNG GHI NHỚ LEITNER */}
              <div className="bg-amber-50/50 rounded-2xl border border-amber-200/40 p-4 shrink-0">
                <div className="flex gap-2 items-start text-xs text-amber-800">
                  <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold">Phương pháp ôn luyện Leitner:</span>
                    <p className="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
                      Ghi nhớ thông qua 2 hộp chứa thẻ tách biệt. Thẻ trả lời đúng được chuyển lên <strong>Hộp 2 (Đã thuộc)</strong>, trả lời chưa chính xác được chuyển về <strong>Hộp 1 (Cần ôn lại)</strong> để tiếp tục cải thiện triệt để.
                    </p>
                  </div>
                </div>
              </div>

              {/* TIÊU ĐỀ KHU VỰC BỘ THẺ */}
              <div className="flex justify-between items-center px-1">
                <h5 className="font-display font-extrabold text-[var(--theme-text)] text-sm">Các Bộ Thẻ Đang Ôn Tập</h5>
                <button
                  id="btn-open-add-deck"
                  onClick={() => {
                    setNewDeckSubject(activeSubject);
                    setShowAddDeckModal(true);
                  }}
                  className="text-xs text-[var(--theme-primary)] font-bold flex items-center gap-1 cursor-pointer bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 px-2.5 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" /> Tạo Bộ Mới
                </button>
              </div>

              {/* DANH SÁCH BỘ THẺ GRID MÀU PASTEL SẮC NÉT */}
              <div className="space-y-4">
                {filteredDecks.length === 0 ? (
                  <div className="text-center py-10 bg-[var(--theme-surface)] rounded-3xl border border-[#E9EDF7]">
                    <span className="text-4xl">📚</span>
                    <p className="text-[var(--theme-text-light)] text-xs font-semibold mt-2">Chưa có bộ thẻ ghi nhớ nào ở môn học này.</p>
                    <button 
                      onClick={() => {
                        setNewDeckSubject(activeSubject);
                        setShowAddDeckModal(true);
                      }}
                      className="mt-3 text-xs bg-[var(--theme-primary)] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#6384DF] transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Tạo bộ thẻ đầu tiên
                    </button>
                  </div>
                ) : (
                  filteredDecks.map((deck) => {
                    const stats = deckStats[deck.id] || { total: 0, mastered: 0, boxes: [0,0] };
                    const progressPercent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
                    const unassignedCount = stats.total - (stats.boxes[0] + stats.boxes[1]);
                    const unmasteredCount = stats.boxes[0];
                    return (
                      <div
                        key={deck.id}
                        id={`deck-card-${deck.id}`}
                        onClick={() => handleStartStudy(deck, "all")}
                        className="bg-[var(--theme-surface)] p-5 rounded-3xl border border-[#E9EDF7] hover:border-[var(--theme-primary)]/40 transition duration-300 shadow-soft cursor-pointer flex flex-col justify-between relative group"
                      >
                        {/* Nhãn bộ tự tạo */}
                        {deck.isCustom && (
                          <span className="absolute top-4 right-18 bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] font-bold px-2 py-0.5 rounded-md">
                            Tự thiết lập
                          </span>
                        )}

                        {/* Nút Thêm Thẻ mới nhanh */}
                        <button
                          id={`btn-add-card-quick-${deck.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeck(deck);
                            setShowAddCardModal(true);
                          }}
                          className="absolute top-3.5 right-10 p-1 rounded-lg text-[var(--theme-primary)] hover:text-[#6384DF] hover:bg-indigo-50 transition cursor-pointer"
                          title="Thêm thẻ học nhanh vào bộ này"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        {/* Nút Xóa bộ học (Cho phép xóa mọi bộ thẻ không thích) */}
                        <button
                          id={`btn-delete-deck-${deck.id}`}
                          onClick={(e) => handleDeleteDeck(deck.id, e)}
                          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa bộ thẻ học liệu này"
                        >
                          <Trash2 className="w-4 h-4 animate-pulse-once" />
                        </button>

                        <div className="space-y-2">
                          <h4 className="font-display font-extrabold text-[#2D3748] text-base tracking-tight leading-snug group-hover:text-[var(--theme-primary)] transition duration-300 pr-10">
                            {deck.title}
                          </h4>
                          <p className="text-[11px] text-[var(--theme-text-light)] font-sans leading-relaxed">
                            {deck.description}
                          </p>
                        </div>

                        {/* Chi tiết phân bố Leitner Hộp và Tiến độ thanh trượt */}
                        <div className="mt-5 pt-4 border-t border-slate-50 space-y-3.5">
                          
                          {/* Tổng số thẻ và mức độ Mastered */}
                          <div className="flex justify-between items-center text-[11px] text-[var(--theme-text-light)]">
                            <span className="font-semibold text-[var(--theme-text-muted)]">⚡ Quy mô: {stats.total} thẻ</span>
                            <span className="font-bold text-emerald-600">Đã thuộc lòng {progressPercent}%</span>
                          </div>

                          {/* Trực quan phân bổ Leitner Box */}
                          <div className="grid grid-cols-2 gap-2">
                            {stats.boxes.map((cardCount, bIdx) => {
                              const boxColors = [
                                "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200", 
                                "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"
                              ];
                              const sourceMap = ["box1", "box2"] as const;
                              
                              return (
                                <div 
                                  key={bIdx} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (cardCount === 0) {
                                      showPromptAlert("Mục này hiện trống", `${LEITNER_BOXES[bIdx].label} hiện tại chưa có dữ liệu. Hãy thêm thẻ học mới hoặc ôn tập các hộp khác.`);
                                      return;
                                    }
                                    handleStartStudy(deck, sourceMap[bIdx]);
                                  }}
                                  className="text-center bg-[var(--theme-surface-soft)] rounded-xl p-2 border border-[var(--theme-border)] transition duration-200 hover:border-[var(--theme-primary)]/40 hover:shadow-sm cursor-pointer"
                                  title={`Bấm để ôn tập riêng các thẻ ${LEITNER_BOXES[bIdx].label}`}
                                >
                                  <span className="text-[10px] text-[var(--theme-text-light)] block font-bold leading-none mb-1">
                                    {bIdx === 0 ? "⚠️ Cần ôn lại" : "✅ Đã thuộc"}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block min-w-[24px] ${cardCount > 0 ? boxColors[bIdx] : "text-slate-300 bg-[var(--theme-surface-soft)]/50"}`}>
                                    {cardCount} Thẻ
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Bộ kích hoạt học tập phân loại khoa học */}
                          <div className="space-y-2 pt-1.5">
                            <div className="grid grid-cols-2 gap-2 shrink-0">
                              <button
                                id={`btn-deck-study-${deck.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (unassignedCount === 0) {
                                    showPromptAlert("Hết thẻ mới", "Bạn đã lướt hết thẻ mới tinh! Hãy chọn 'Ôn hộp chưa thuộc' để luyện tập tiếp nhé.");
                                    return;
                                  }
                                  handleStartStudy(deck, "unassigned");
                                }}
                                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${
                                  unassignedCount === 0 
                                    ? "bg-[var(--theme-surface-soft)] text-slate-400 border border-[var(--theme-border)] cursor-not-allowed" 
                                    : "bg-[var(--theme-primary)] text-white hover:bg-[#6384DF] cursor-pointer"
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5" /> Thẻ mới ({unassignedCount})
                              </button>

                              <button
                                id={`btn-deck-review-unmastered-${deck.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (unmasteredCount === 0) {
                                    showPromptAlert("Hoàn thành ôn tập", "Tuyệt hảo! Tất cả các thẻ trong hộp ôn tập của bạn đều đã thuộc lòng tinh thông rồi!");
                                    return;
                                  }
                                  handleStartStudy(deck, "unmastered");
                                }}
                                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${
                                  unmasteredCount === 0 
                                    ? "bg-[var(--theme-surface-soft)] text-slate-400 border border-[var(--theme-border)] cursor-not-allowed" 
                                    : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                                }`}
                              >
                                <RotateCw className="w-3.5 h-3.5 animate-spin-slow" /> Ôn hộp chưa thuộc ({unmasteredCount})
                              </button>
                            </div>

                            <button
                              id={`btn-deck-quiz-${deck.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (stats.total < 2) {
                                  showPromptAlert("Thiếu thẻ ghi nhớ", "Cần tối thiểu 2 thẻ trong bộ học liệu này để có thể chạy mô-đun thi thử trắc nghiệm lựa chọn từ vựng.");
                                  return;
                                }
                                handleStartQuiz(deck);
                              }}
                              disabled={stats.total < 2}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                                stats.total < 2 
                                  ? "bg-[var(--theme-surface-soft)] text-slate-400 cursor-not-allowed border-transparent" 
                                  : "bg-[#B5EAD7] text-teal-800 hover:bg-[#97D7B9] border border-[#B5EAD7] cursor-pointer"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Thử sức trắc nghiệm (Quiz)
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Mẹo học thuật ở chân màn hình Dashboard */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100/60 p-4 rounded-3xl mt-6 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="space-y-1">
                <h6 className="font-display font-extrabold text-indigo-900 text-xs">Phản hồi nghiên cứu tâm lý:</h6>
                <p className="text-[11px] text-indigo-700/80 leading-relaxed font-mono">
                  Lặp lại ngắt quãng (Spaced Repetion) dựa trên nghiên cứu của Hermann Ebbinghaus giúp ngăn chặn đường cong quên lãng, bảo toàn 95% tri thức sâu khi ôn thi Đại Học.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* CHẾ ĐỘ 2: PHIÊN HỌC THẺ LẬT FLASHCARDS (STUDY MODE)              */}
        {/* ================================================================= */}
        {mode === "study" && selectedDeck && (
          <div className="flex-1 flex flex-col justify-between my-2">
            
            {/* Header phiên học con */}
            <div className="flex items-center justify-between mb-4 bg-[var(--theme-surface-soft)] p-2.5 rounded-2xl border border-[var(--theme-border)] shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Bộ đang học</span>
                <span className="text-[var(--theme-text)] text-xs font-bold block truncate max-w-[170px]">{selectedDeck.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-add-card-to-deck"
                  onClick={() => setShowAddCardModal(true)}
                  className="bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Thẻ
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-[var(--theme-surface)] px-2 py-1 rounded-md border border-[var(--theme-border)]">
                  Thẻ {studyCards.length > 0 ? currentStudyIndex + 1 : 0} / {studyCards.length}
                </span>
              </div>
            </div>

            {studyCards.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--theme-surface)] my-6 rounded-3xl border border-[#E9EDF7]">
                <span className="text-4xl mb-3">📭</span>
                <p className="text-[var(--theme-text-light)] text-sm font-semibold">Chưa có thẻ ghi nhớ nào trong bộ học tập này.</p>
                <p className="text-slate-400 text-xs mt-1">Bấm nút "Thêm Thẻ" phía trên để điền từ vựng hoặc công thức học tốt của bạn!</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                
                {/* Thanh tiến độ học tập trên cùng */}
                <div className="w-full h-2 bg-[#E9EDF7] rounded-full overflow-hidden mb-6 shrink-0 border border-[var(--theme-border)]">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] transition-all duration-300"
                    style={{ width: `${((currentStudyIndex + 1) / studyCards.length) * 100}%` }}
                  ></div>
                </div>

                {/* Hộp chỉ số Leitner hiên tại của Card */}
                <div className="flex items-center justify-between px-1 mb-3 text-xs z-10 shrink-0">
                  <div className="flex items-center gap-1 text-[var(--theme-text-light)]">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Thuộc nhóm:</span>
                    {studyCards[currentStudyIndex]?.box === undefined || studyCards[currentStudyIndex]?.box === null ? (
                      <span className="font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                        🆕 Thẻ mới (Chưa học)
                      </span>
                    ) : (
                      <span className={`font-extrabold px-2 py-0.5 rounded ${LEITNER_BOXES[(studyCards[currentStudyIndex]?.box || 1) - 1]?.color || "bg-rose-50 text-rose-600 border-rose-200"}`}>
                        {LEITNER_BOXES[(studyCards[currentStudyIndex]?.box || 1) - 1]?.label || "Hộp 1: Cần ôn lại"}
                      </span>
                    )}
                  </div>
                  {studyCards[currentStudyIndex] && (
                    <button 
                      onClick={(e) => handleDeleteCard(studyCards[currentStudyIndex].id, e)}
                      className="text-xs text-rose-500 flex items-center gap-0.5 hover:underline cursor-pointer font-bold transition hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa thẻ
                    </button>
                  )}
                </div>

                {/* BOX THỂ LẬT 3D ĐỘC ĐÁO CHUẨN UX MOBILE */}
                <div 
                  className={`w-full h-[310px] perspective-1000 cursor-pointer select-none relative ${vibrateEffect ? "animate-bounce" : ""}`}
                  onClick={handleFlipCard}
                >
                  <div 
                    className={`relative w-full h-full duration-500 transform-style-3d ${
                      isFlipped ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* MẶT TRƯỚC (Front: Question/Formula) */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white to-[#F8FAFF] rounded-[28px] border-2 border-[#E9EDF7] shadow-pastel-blue p-6 flex flex-col justify-between backface-hidden">
                      <div className="flex justify-between items-start">
                        <span className="bg-[#EBF2FF] text-[var(--theme-primary)] text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-md">
                          MẶT TRƯỚC (HỎI)
                        </span>
                        <div className="flex items-center gap-1 text-slate-300 hover:text-[var(--theme-primary)]">
                          <RotateCw className="w-4 h-4 animate-spin-slow" />
                        </div>
                      </div>
                      
                      <div className="text-center px-4 my-auto">
                        <h3 className="font-display font-black text-2xl text-[var(--theme-text)] tracking-tight leading-relaxed">
                          {studyCards[currentStudyIndex]?.front}
                        </h3>
                      </div>

                      <div className="text-center text-[11px] text-slate-400 font-bold bg-[var(--theme-surface-soft)] py-1.5 rounded-xl border border-dashed border-[var(--theme-border)] flex items-center justify-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Chạm nhẹ để lật xem đáp án lý thuyết
                      </div>
                    </div>

                    {/* MẶT SAU (Back: Detail Explanation & Example) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F6FFFB] rounded-[28px] border-2 border-[#B5EAD7]/60 shadow-pastel-success p-6 flex flex-col justify-between backface-hidden rotate-y-180">
                      <div className="flex justify-between items-start">
                        <span className="bg-[#EAFDF8] text-emerald-600 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-md">
                          MẶT SAU (ĐÁP)
                        </span>
                        <RotateCw className="w-4 h-4 text-emerald-400" />
                      </div>
                      
                      <div className="px-2 text-center my-auto space-y-3">
                        <p className="font-display font-bold text-lg text-[var(--theme-text)] leading-snug">
                          {studyCards[currentStudyIndex]?.back}
                        </p>
                        {studyCards[currentStudyIndex]?.example && (
                          <div className="text-left text-[11px] text-[var(--theme-text-light)] italic bg-[var(--theme-surface-soft)]/80 p-3 rounded-2xl border border-dashed border-[#E9EDF7] space-y-1">
                            <span className="font-bold text-[var(--theme-primary)] not-italic text-[10px] uppercase block">Ví dụ minh họa:</span>
                            <span className="leading-relaxed">💡 {studyCards[currentStudyIndex].example}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center text-[11px] text-slate-400 font-bold bg-[var(--theme-surface-soft)] py-1.5 rounded-xl border border-[var(--theme-border)] flex items-center justify-center gap-1">
                        Chạm nhẹ để hiển thị câu hỏi ban đầu
                      </div>
                    </div>
                  </div>
                </div>

                {/* ĐIỀU HƯỚNG VÀ PHẢN HỒI KIỂU SPACED REPETITION LEITNER */}
                <div className="mt-6 space-y-4 shrink-0">
                  <div className="text-center text-xs text-slate-400 font-semibold mb-1">
                    Hãy đánh giá mức độ ghi nhớ của bạn đối với thẻ này:
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* NÚT CHƯA THUỘC (RED) - DI CHUYỂN VỀ HỘP 1 */}
                    <button
                      id="btn-leitner-easy-fail"
                      onClick={() => handleLeitnerAnswer(false)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 py-3.5 px-4 rounded-2xl font-bold text-xs flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
                    >
                      <X className="w-5 h-5 mb-1 text-rose-500" />
                      <span>Chưa thuộc 🔴</span>
                      <span className="text-[9px] text-rose-400 font-normal mt-0.5">Xếp vào Hộp 1: Cần ôn lại</span>
                    </button>

                    {/* NÚT ĐÃ THUỘC (GREEN) - DI CHUYỂN LÊN HỘP 2 */}
                    <button
                      id="btn-leitner-easy-pass"
                      onClick={() => handleLeitnerAnswer(true)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 py-3.5 px-4 rounded-2xl font-bold text-xs flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
                    >
                      <Check className="w-5 h-5 mb-1 text-emerald-600" />
                      <span>Đã thuộc 🟢</span>
                      <span className="text-[9px] text-emerald-500 font-normal mt-0.5">Xếp vào Hộp 2: Đã thuộc</span>
                    </button>
                  </div>

                  {/* NÚT TIẾP / QUAY LẠI TRUNG GIAN */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        if (currentStudyIndex > 0) {
                          setCurrentStudyIndex(prev => prev - 1);
                          setIsFlipped(false);
                        }
                      }}
                      disabled={currentStudyIndex === 0}
                      className="px-4 py-2 bg-[var(--theme-surface)] text-[var(--theme-text-light)] border border-[#E9EDF7] font-bold text-xs rounded-xl hover:bg-[var(--theme-surface-soft)] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Thẻ trước
                    </button>

                    <button
                      onClick={() => {
                        if (currentStudyIndex < studyCards.length - 1) {
                          setCurrentStudyIndex(prev => prev + 1);
                          setIsFlipped(false);
                        }
                      }}
                      disabled={currentStudyIndex === studyCards.length - 1}
                      className="px-4 py-2 bg-[var(--theme-surface)] text-[var(--theme-text-light)] border border-[#E9EDF7] font-bold text-xs rounded-xl hover:bg-[var(--theme-surface-soft)] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Thẻ tiếp <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* CHẾ ĐỘ 3: PHÒNG THI THỬ TRẮC NGHIỆM CHI TIẾT (QUIZ MODE)         */}
        {/* ================================================================= */}
        {mode === "quiz" && selectedDeck && quizQuestions.length > 0 && (
          <div className="flex-1 flex flex-col justify-between my-2">
            
            {/* Header phòng thi */}
            <div className="flex items-center justify-between mb-4 bg-[var(--theme-surface-soft)] p-2.5 rounded-2xl border border-[var(--theme-border)] shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400">Trắc nghiệm tư duy</span>
                <span className="text-[var(--theme-text)] text-xs font-bold block truncate max-w-[170px]">{selectedDeck.title}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                Câu {currentQuizIndex + 1}/{quizQuestions.length}
              </span>
            </div>

            {!quizCompleted && (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* Thanh trạng thái làm bài */}
                <div className="w-full h-2 bg-[#E9EDF7] rounded-full overflow-hidden mb-6 shrink-0">
                  <div 
                    className="h-full bg-[var(--theme-primary)] transition-all duration-300"
                    style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
                  ></div>
                </div>

                {/* Nội dung Câu hỏi */}
                <div className="space-y-4 flex-1">
                  
                  {/* Nhãn định dạng câu hỏi */}
                  <span className="inline-block bg-[#EBF2FF] text-[var(--theme-primary)] text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md">
                    {quizQuestions[currentQuizIndex].type === "mc" ? "📝 Câu hỏi chọn đáp án" : 
                     quizQuestions[currentQuizIndex].type === "tf" ? "💡 Thử thách Đúng / Sai" : "✍️ Viết đáp án ngắn"}
                  </span>

                  {/* Đề bài */}
                  <div className="bg-[#F8FAFF] p-5 rounded-[22px] border border-[#E9EDF7] shadow-soft">
                    <p className="text-[var(--theme-text)] text-sm font-semibold leading-relaxed whitespace-pre-wrap font-sans">
                      {quizQuestions[currentQuizIndex].prompt}
                    </p>
                  </div>

                  {/* CÁC PHƯƠNG ÁN TRẢ LỜI ĐA DẠNG NẰM Ở TRUNG TÂM */}
                  <div className="pt-2">
                    
                    {/* THỂ LOẠI 1: MULTIPLE CHOICE */}
                    {quizQuestions[currentQuizIndex].type === "mc" && quizQuestions[currentQuizIndex].options && (
                      <div className="space-y-2.5">
                        {quizQuestions[currentQuizIndex].options.map((option, idx) => {
                          const isSelected = selectedQuizOption === option;
                          const showCorrect = quizSubmitted && option === quizQuestions[currentQuizIndex].correctAnswer;
                          const showWrong = quizSubmitted && isSelected && option !== quizQuestions[currentQuizIndex].correctAnswer;
                          
                          let optBg = "bg-[var(--theme-surface)] border-[#E9EDF7] hover:bg-[var(--theme-surface-soft)]";
                          if (isSelected) optBg = "bg-[#EBF2FF] border-[var(--theme-primary)] text-[var(--theme-primary)]";
                          if (showCorrect) optBg = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold animate-pulse";
                          if (showWrong) optBg = "bg-rose-50 border-rose-500 text-rose-800 font-bold";

                          return (
                            <button
                              key={idx}
                              id={`quiz-opt-${idx}`}
                              disabled={quizSubmitted}
                              onClick={() => setSelectedQuizOption(option)}
                              className={`w-full text-left p-4 rounded-2xl border text-xs font-semibold cursor-pointer transition flex items-center gap-3 ${optBg}`}
                            >
                              <div className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border shrink-0 ${
                                isSelected ? "bg-[var(--theme-primary)] text-white border-transparent" : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-light)] border-[var(--theme-border)]"
                              }`}>
                                {["A", "B", "C", "D"][idx]}
                              </div>
                              <span className="font-sans flex-1 leading-snug">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* THỂ LOẠI 2: TRUE / FALSE */}
                    {quizQuestions[currentQuizIndex].type === "tf" && (
                      <div className="grid grid-cols-2 gap-4">
                        {[true, false].map((tfVal) => {
                          const isSelected = tfSelected === tfVal;
                          const tfString = tfVal ? "Đúng" : "Sai";
                          const showCorrect = quizSubmitted && tfString === quizQuestions[currentQuizIndex].correctAnswer;
                          const showWrong = quizSubmitted && isSelected && tfString !== quizQuestions[currentQuizIndex].correctAnswer;

                          let tfBg = "bg-[var(--theme-surface)] border-[#E9EDF7] hover:bg-[var(--theme-surface-soft)]";
                          if (isSelected) tfBg = tfVal ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-rose-50 border-rose-400 text-rose-700";
                          if (showCorrect) tfBg = "bg-emerald-500 border-emerald-600 text-white font-extrabold animate-pulse";
                          if (showWrong) tfBg = "bg-rose-500 border-rose-600 text-white font-extrabold";

                          return (
                            <button
                              key={tfString}
                              id={`quiz-tf-btn-${tfString}`}
                              disabled={quizSubmitted}
                              onClick={() => setTfSelected(tfVal)}
                              className={`py-6 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition text-sm font-extrabold ${tfBg}`}
                            >
                              <span className="text-lg">{tfVal ? "🟢" : "🔴"}</span>
                              <span className="font-display tracking-tight">{tfString}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* THỂ LOẠI 3: SHORT ANSWER */}
                    {quizQuestions[currentQuizIndex].type === "sa" && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          id="quiz-short-ans-input"
                          value={shortAnswerInput}
                          disabled={quizSubmitted}
                          onChange={(e) => setShortAnswerInput(e.target.value)}
                          placeholder="Nhập phần giải đáp chính xác vào đây..."
                          className="w-full bg-[var(--theme-surface)] border border-[#E9EDF7] focus:border-[var(--theme-primary)] outline-none rounded-2xl p-4 text-xs font-semibold placeholder:text-slate-400 shadow-soft font-sans"
                        />
                        {quizSubmitted && (
                          <div className={`p-4 rounded-2xl border text-xs font-medium space-y-1.5 leading-relaxed ${
                            quizIsCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}>
                            <span className="font-bold uppercase tracking-wider block text-[10px]">Giải đáp lý thuyết:</span>
                            <p>🎯 Nội dung chính xác: <strong>{quizQuestions[currentQuizIndex].correctAnswer}</strong></p>
                            <p className="font-normal text-[var(--theme-text-light)] mt-1">Câu trả lời của bạn: <span className="underline">{shortAnswerInput}</span></p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* KẾT QUẢ PHẢN HỒI NỔI BẬT KHÔNG GIÁN ĐOẠN */}
                  {quizSubmitted && (
                    <div className={`p-4 rounded-[20px] transition-all duration-300 font-sans border mt-4 ${
                      quizIsCorrect 
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-800" 
                        : "bg-rose-50/70 border-rose-200 text-rose-800"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                        {quizIsCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Vượt qua xuất sắc! (+15 ngọc)</span>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>Chưa chính xác rồi! Đã chuyển về Hộp 1</span>
                          </>
                        )}
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        {quizQuestions[currentQuizIndex].example && (
                          <p className="text-[11px] text-[var(--theme-text-light)] bg-[var(--theme-surface)]/70 p-2.5 rounded-xl border border-[var(--theme-border)] leading-relaxed italic">
                            💡 {quizQuestions[currentQuizIndex].example}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
                          Nhận xét: Mỗi sai lầm là cơ hội ghi khắc sâu hơn. Thẻ này đã được điều phối vào Hộp 1 trong Spaced Repetition để bạn ôn tập liên tục hàng ngày!
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* BẢNG ĐIỀU KHIỂN CHÂN QUYẾT TRẮC NGHIỆM */}
                <div className="pt-4 border-t border-[var(--theme-border)] flex justify-between items-center shrink-0 mt-6 bg-[var(--theme-surface)]">
                  <button
                    onClick={async () => {
                      if (await confirmDialog({
                        title: "Dừng làm bài",
                        message: "Bạn muốn hủy phiên kiểm tra đề này giữa chừng? Kết quả chưa lưu sẽ mất.",
                        confirmText: "Dừng làm bài",
                        cancelText: "Tiếp tục làm",
                        tone: "danger",
                      })) {
                        setMode("decks");
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 bg-[var(--theme-surface-soft)] px-4 py-2.5 rounded-xl border border-[var(--theme-border)] transition text-xs font-bold cursor-pointer"
                  >
                    Dừng làm bài
                  </button>

                  {!quizSubmitted ? (
                    <button
                      id="btn-quiz-submit-action"
                      onClick={handleSubmitQuizAnswer}
                      className="px-6 py-2.5 bg-[var(--theme-primary)] text-white rounded-xl text-xs font-black hover:bg-[#6384DF] transition shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      Nộp câu trả lời <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="btn-quiz-next-action"
                      onClick={handleNextQuizQuestion}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black transition shadow-md flex items-center gap-1 cursor-pointer ${
                        quizIsCorrect ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-800 text-white hover:bg-slate-900"
                      }`}
                    >
                      {currentQuizIndex < quizQuestions.length - 1 ? "Câu tiếp theo" : "Xem Tổng Kết"} <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* BẢNG KẾT QUẢ BÀI THI KHOA HỌC */}
            {quizCompleted && (
              <div className="space-y-6 text-center py-4 animate-fade-in flex-1 flex flex-col justify-center">
                
                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center stroke-[2] mx-auto">
                  <Award className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-black text-[#2D3748] text-lg">Hoàn Thành Đề Ôn Tập Trắc Nghiệm</h3>
                  <p className="text-[11px] text-slate-400 font-sans tracking-tight">Kỹ thuật kiểm chứng trí nhớ tích hợp Leitner Spaced Repetion.</p>
                </div>

                {/* Kết quả chung */}
                <div className="grid grid-cols-2 gap-3.5 p-4 bg-[var(--theme-surface-soft)] rounded-2xl border border-[var(--theme-border)]">
                  <div className="text-center py-1.5 border-r border-[var(--theme-border)]">
                    <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">Làm đúng</span>
                    <span className="font-display font-extrabold text-[#2D3748] text-base">
                      {quizScore} / {quizQuestions.length} câu
                    </span>
                  </div>
                  <div className="text-center py-1.5">
                    <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">Ngọc thưởng (+30 bonus)</span>
                    <span className="font-display font-extrabold text-[var(--theme-primary)] text-base">
                      +{(quizScore * 15) + 30} 💎
                    </span>
                  </div>
                </div>

                {/* Danh sách câu hỏi và ghi nhận đúng sai để học sinh xem lại */}
                <div className="text-left space-y-3.5 flex-1 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                  <h4 className="font-display font-extrabold text-[var(--theme-text)] text-xs px-1">Lịch sử làm bài thi của bạn:</h4>
                  <div className="space-y-2">
                    {quizQuestions.map((q, qIndex) => {
                      const hist = quizAnswersHistory.find(h => h.qIndex === qIndex);
                      return (
                        <div key={q.id} className="p-3 bg-[var(--theme-surface)] border border-[var(--theme-border)]/60 rounded-xl text-xs space-y-1.5 shadow-sm">
                          <p className="font-semibold text-[var(--theme-text-muted)] leading-snug">Câu {qIndex + 1}: {q.cardFront}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans">
                            <span>Đáp án của bạn: <strong className="text-[var(--theme-text-muted)] underline">{hist?.userAnswer || "Để trống"}</strong></span>
                            {hist?.isCorrect ? (
                              <span className="text-emerald-600 font-extrabold">✓ Chính xác</span>
                            ) : (
                              <span className="text-rose-500 font-extrabold">✗ Chưa đúng (Đúng: {q.cardBack})</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nút thoát */}
                <button
                  id="btn-quit-quiz-com"
                  onClick={() => setMode("decks")}
                  className="w-full bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-pastel-blue transition cursor-pointer shrink-0 mt-3"
                >
                  Kết thúc bài thi thử nghiệm
                </button>

              </div>
            )}

          </div>
        )}

      </div>

      {/* ================================================================= */}
      {/* MODAL DIALOG: THÊM BỘ THẺ TỰ CHỌN MỚI                           */}
      {/* ================================================================= */}
      {showAddDeckModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in rounded-t-[32px]">
          <div className="bg-[var(--theme-surface)] rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-zoom-in space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-border)]">
              <h4 className="font-display font-black text-[#2D3748] text-base flex items-center gap-1.5">
                <FolderPlus className="w-5 h-5 text-[var(--theme-primary)]" /> Tạo bộ học tập mới
              </h4>
              <button 
                onClick={() => setShowAddDeckModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--theme-surface-soft)] text-slate-400 hover:text-[var(--theme-text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDeck} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--theme-text-muted)] block">Tên bộ thẻ học lực:</label>
                <input
                  type="text"
                  required
                  id="input-deck-title"
                  placeholder="Ví dụ: Từ vựng IELTS nâng cao, Công thức sóng âm Vật Lý..."
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  className="w-full bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] outline-none rounded-xl p-3 text-xs shadow-soft font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--theme-text-muted)] block">Mô tả chủ đề ngắn:</label>
                <textarea
                  id="input-deck-desc"
                  placeholder="Ghi chú về nguồn đề, mục tiêu, hoặc ngày thi học kỳ..."
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  className="w-full bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] outline-none rounded-xl p-3 h-20 text-xs shadow-soft resize-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--theme-text-muted)] block">Bộ môn ứng tuyển:</label>
                <select
                  id="input-deck-subject"
                  value={newDeckSubject}
                  onChange={(e) => setNewDeckSubject(e.target.value as SubjectId)}
                  className="w-full bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] outline-none rounded-xl p-3 text-xs font-bold"
                >
                  <option value="english">Tiếng Anh</option>
                  <option value="math">Toán Học</option>
                  <option value="physics">Vật Lý</option>
                  <option value="chemistry">Hóa Học</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddDeckModal(false)}
                  className="flex-1 py-3 bg-[var(--theme-surface-soft)] hover:bg-slate-200 text-[var(--theme-text-muted)] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  id="btn-submit-add-deck"
                  className="flex-1 py-3 bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  Tạo Bộ Học Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL DIALOG: THÊM THẺ GHI NHỚ FLASHCARD MỚI CHO DECK           */}
      {/* ================================================================= */}
      {showAddCardModal && selectedDeck && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in rounded-t-[32px]">
          <div className="bg-[var(--theme-surface)] rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-zoom-in space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-border)]">
              <h4 className="font-display font-black text-[#2D3748] text-base flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-[var(--theme-primary)]" /> Thêm thẻ học vào bộ
              </h4>
              <button 
                onClick={() => setShowAddCardModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--theme-surface-soft)] text-slate-400 hover:text-[var(--theme-text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#EFF4FF] p-3 rounded-2xl border border-blue-100/50">
              <p className="text-[11px] text-[var(--theme-primary)] font-sans font-medium">
                ⚡ Đang soạn thảo thẻ cho: <strong>{selectedDeck.title}</strong>
              </p>
            </div>
            
            <form onSubmit={handleCreateCard} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--theme-text-muted)] block">Mặt Trước (Thuật ngữ/Khái niệm/Công thức):</label>
                <input
                  type="text"
                  required
                  id="input-card-front"
                  placeholder="Ví dụ: Đạo hàm log x, Ubiquitous, Con lắc đơn..."
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  className="w-full bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] outline-none rounded-xl p-3 text-xs shadow-soft font-sans font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--theme-text-muted)] block">Mặt Sau (Nghĩa/Giải đáp/Lời khuyên chính xác):</label>
                <textarea
                  required
                  id="input-card-back"
                  placeholder="Ví dụ: 1/(x * ln 10), Có mặt ở khắp mọi nơi, w = căn(g/l)..."
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  className="w-full bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] outline-none rounded-xl p-3 h-20 text-xs shadow-soft resize-none font-sans font-bold text-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--theme-text-muted)] block">Ví dụ thực tế / Mẹo ghi nhớ (Tùy chọn):</label>
                <input
                  type="text"
                  id="input-card-example"
                  placeholder="Ví dụ: Giúp liên hệ thực tế, mẹo nhớ con lắc đơn..."
                  value={newCardExample}
                  onChange={(e) => setNewCardExample(e.target.value)}
                  className="w-full bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] outline-none rounded-xl p-3 text-xs shadow-soft font-sans italic text-[var(--theme-text-light)]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 py-3 bg-[var(--theme-surface-soft)] hover:bg-slate-200 text-[var(--theme-text-muted)] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  id="btn-submit-add-card"
                  className="flex-1 py-3 bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  Lưu Thẻ Ghi Nhớ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CUSTOM CONFIRMATION DIALOG INTERACTIVE MODAL                     */}
      {/* ================================================================= */}
      {customConfirm && customConfirm.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-fade-in rounded-t-[32px]">
          <div className="bg-[var(--theme-surface)] rounded-3xl p-5 shadow-2xl max-w-[280px] w-full animate-zoom-in space-y-3.5 border border-[var(--theme-border)] text-center">
            <div className="w-11 h-11 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h5 className="font-display font-bold text-[#2D3748] text-sm tracking-tight">{customConfirm.title}</h5>
              <p className="text-[11px] text-[var(--theme-text-light)] leading-relaxed font-sans">{customConfirm.message}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button 
                type="button"
                onClick={() => setCustomConfirm(null)}
                className="flex-1 py-2 bg-[var(--theme-surface-soft)] hover:bg-slate-200 text-[var(--theme-text-muted)] font-bold text-[11px] rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={customConfirm.onConfirm}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[11px] rounded-xl transition shadow-md cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CUSTOM ALERT MESSAGE DIALOG INTERACTIVE MODAL                   */}
      {/* ================================================================= */}
      {customAlert && customAlert.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-fade-in rounded-t-[32px]">
          <div className="bg-[var(--theme-surface)] rounded-3xl p-5 shadow-2xl max-w-[280px] w-full animate-zoom-in space-y-3.5 border border-[var(--theme-border)] text-center">
            <div className="w-11 h-11 bg-indigo-50 text-[var(--theme-primary)] rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-[var(--theme-primary)]" />
            </div>
            <div className="space-y-1">
              <h5 className="font-display font-bold text-[#2D3748] text-sm tracking-tight">{customAlert.title}</h5>
              <p className="text-[11px] text-[var(--theme-text-light)] leading-relaxed font-sans">{customAlert.message}</p>
            </div>
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setCustomAlert(null)}
                className="w-full py-2 bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white font-extrabold text-[11px] rounded-xl transition shadow-md cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
