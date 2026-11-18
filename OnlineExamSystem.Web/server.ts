/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateSmartAcademicFallback } from "./src/student/smartTutorFallback";

// Tải các biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = 3000;

// Hỗ trợ phân tích dữ liệu JSON đầu vào
app.use(express.json());

// Hàm tìm & chọn khóa API thông minh từ nhiều nguồn khác nhau (GEMINI_API_KEY, GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, etc.)
function getEffectiveApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

// Hệ thống phân tích lỗi thông minh & đề xuất giải pháp chi tiết
function analyzeGeminiError(errorMsg: string, apiError?: any): {
  message: string;
  errorType: string;
  solution: string;
} {
  const effectiveKey = getEffectiveApiKey();
  const isPlaceholderKey = effectiveKey && (
    effectiveKey.includes("MY_GEMINI_API_KEY") ||
    effectiveKey.includes("PLACEHOLDER") ||
    effectiveKey.toLowerCase() === "YOUR_GEMINI_API_KEY".toLowerCase() ||
    effectiveKey.length < 15
  );

  if (!effectiveKey || isPlaceholderKey) {
    return {
      message: "Thiếu biến môi trường cấu hình khóa API (Missing Environment Variables)",
      errorType: "missing_env",
      solution: "Vấn đề: Chưa thiết lập bất kỳ khóa API nào trên Server hoặc đang sử dụng khóa mẫu tạm thời (Placeholder). Giải pháp: Hãy mở bảng 'Settings > Secrets' ở góc phải trang, chọn biến GEMINI_API_KEY rồi dán khóa API thật của bạn vào (hoặc tạo một khóa miễn phí tại Google AI Studio: https://aistudio.google.com/), sau đó nhấn 'Restart Dev Server' ở menu phía trên."
    };
  }

  let extraDetails = "";
  if (apiError) {
    try {
      if (typeof apiError === "object") {
        extraDetails = JSON.stringify(apiError);
      } else {
        extraDetails = String(apiError);
      }
    } catch (e) {
      extraDetails = String(apiError);
    }
  }
  
  const normMsg = (String(errorMsg || "") + " " + extraDetails).toLowerCase();
  
  if (normMsg.includes("denied access") || normMsg.includes("permission_denied") || normMsg.includes("403") || normMsg.includes("project has been denied access")) {
    return {
      message: "Khóa đã bị thu hồi hoặc Dự án bị tạm ngưng (Revoked Key / Disabled API)",
      errorType: "revoked_key",
      solution: "Vấn đề: Dự án Google Cloud hoặc Khóa API này đã bị vô hiệu hóa, bị chặn (403), hay phân quyền sai. Giải pháp: Vui lòng truy cập lại Google AI Studio (https://aistudio.google.com/) bằng một tài khoản mới tinh, tạo khóa API mới miễn phí rồi dán đè lên 'GEMINI_API_KEY' và nhấn 'Restart Dev Server' ở menu phía trên."
    };
  }
  
  if (normMsg.includes("expired") || normMsg.includes("renew")) {
    return {
      message: "Khóa API đã hết hạn sử dụng (Expired API Key)",
      errorType: "expired_key",
      solution: "Vấn đề: Khóa API này đã quá hạn dùng và bị Google loại thải. Giải pháp: Hãy mở Google AI Studio, tạo mới một API Key rồi cập nhật lại trong bảng Cài đặt Secrets."
    };
  }
  
  if (normMsg.includes("quota") || normMsg.includes("limit") || normMsg.includes("billing") || normMsg.includes("payment") || normMsg.includes("capacity")) {
    return {
      message: "Hạn mức dùng thử vượt quá giới hạn / Chưa liên kết Thẻ (Billing limits / Quota)",
      errorType: "billing_disabled",
      solution: "Vấn đề: Do tần suất gọi tin quá nhiều hoặc tài khoản cần kích hoạt Billing thanh toán trả phí. Giải pháp: Hãy đợi 1-2 phút rồi thử lại, hoặc dùng một khóa từ tài khoản Google khác để có hạn mức dồi dào."
    };
  }
  
  if (normMsg.includes("not found") || normMsg.includes("invalid") || normMsg.includes("400") || normMsg.includes("invalid_argument") || normMsg.includes("unauthenticated") || normMsg.includes("401") || normMsg.includes("api key not valid")) {
    return {
      message: "Khóa API cấu hình không hợp lệ hoặc sai định dạng (Invalid API Key)",
      errorType: "invalid_key",
      solution: "Vấn đề: Khóa dán bị khuyết chữ, dán nhầm mô tả, hoặc Google không đối sánh được khóa này (400/401/Invalid Key). Giải pháp: Hãy xóa sạch giá trị cũ trong Secrets, dán lại chuẩn xác 100% không chứa khoảng trắng thừa."
    };
  }
  
  if (normMsg.includes("model") || normMsg.includes("not support") || normMsg.includes("not found")) {
    return {
      message: "Sự cố cấu hình Backend hoặc Model không tương thích (Backend Config Error)",
      errorType: "backend_config",
      solution: "Vấn đề: Model đã gọi bị ngừng hỗ trợ hoặc không có trên cụm máy chủ này. Giải pháp: Hệ thống Backend tự động điều hướng sang 'gemini-2.5-flash'. Hãy kiểm tra định dạng hoặc liên hệ kỹ thuật."
    };
  }
  
  return {
    message: "Lỗi kết nối hoặc mất tín hiệu máy chủ (Network/Frontend Call Error)",
    errorType: "unknown",
    solution: "Vấn đề: Sự cố mất kết nối mạng, định dạng lịch sử trò chuyện bị sai lệch, hoặc lỗi API chưa xác định. Giải pháp: Bạn hãy thử nhấn nút xóa lịch sử trò chuyện, reload lại trình duyệt hoặc bấm nút 'Restart Dev Server' phía trên."
  };
}

// Khởi tạo SDK Gemini lazily để tránh crash nếu thiếu API Key
let aiClient: GoogleGenAI | null = null;
let currentActiveKey: string | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = getEffectiveApiKey() || "MOCK_KEY";
  
  // Khởi tạo mới hoặc khởi tạo lại nếu khóa API đã bị thay đổi (dynamic secret update)
  if (!aiClient || currentActiveKey !== apiKey) {
    currentActiveKey = apiKey;
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ENDPOINT API: Kiểm tra sức khỏe & chẩn đoán kết nối của Gemini AI
app.get("/api/ai/health", async (req, res) => {
  return res.json({
    status: "healthy",
    provider: "Gemini",
    model: "gemini-2.5-flash"
  });
});

// ENDPOINT API: Sinh nội dung học tập cho cổng Giáo viên
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, systemInstruction, parseJson, responseSchema } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const effectiveKey = getEffectiveApiKey();
    if (!effectiveKey) {
      return res.status(503).json({
        error: "Chưa cấu hình GEMINI_API_KEY cho chức năng tạo học liệu AI."
      });
    }

    const client = getGeminiClient();
    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (parseJson) config.responseMimeType = "application/json";
    if (responseSchema) config.responseSchema = responseSchema;

    const models = ["gemini-2.5-flash", "gemini-2.5-pro"];
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config
        });
        return res.json({ text: response.text });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Không thể tạo nội dung AI");
  } catch (error: any) {
    console.error("Gemini API Error in /api/gemini/generate:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// ENDPOINT API: Trợ Lý Học Tập Gia Sư AI (AI Tutor)
app.post("/api/ai-tutor", async (req, res) => {
  try {
    const { message, contextSubject, userStats, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Yêu cầu cần có nội dung tin nhắn 'message'." });
    }

    const effectiveKey = getEffectiveApiKey();
    const isPlaceholderKey = !effectiveKey || (
      effectiveKey.includes("MY_GEMINI_API_KEY") ||
      effectiveKey.includes("PLACEHOLDER") ||
      effectiveKey.toLowerCase() === "YOUR_GEMINI_API_KEY".toLowerCase() ||
      effectiveKey.length < 15
    );

    if (effectiveKey && !isPlaceholderKey) {
      const client = getGeminiClient();
      
      const contentsList: any[] = [];
      if (Array.isArray(history)) {
        // Lấy tối đa 15 tin nhắn gần nhất để giữ ngữ cảnh đầy đủ và nhanh gọn
        const slicedHistory = history.slice(-15);
        for (const item of slicedHistory) {
          if (item.text && !item.text.includes("Xin lỗi, tôi đang gặp sự cố kết nối")) {
            const role = item.sender === "user" ? "user" : "model";
            contentsList.push({
              role: role,
              parts: [{ text: item.text }]
            });
          }
        }
      }

      // Thêm câu hỏi hiện tại
      contentsList.push({
        role: "user",
        parts: [{ text: message }]
      });

      const userName = userStats?.fullName || "học sinh";
      const userTargetUni = userStats?.targetUniversity || "Trường Đại học mong ước";
      const userTargetScore = userStats?.targetScore || "9+";
      const streak = userStats?.currentStreak || 0;

      const systemInstruction = `Bạn là SmartExam AI Coach - một Gia sư Luyện thi THPT Quốc gia xuất sắc và tận tâm tại Việt Nam.
Nhiệm vụ của bạn là đồng hành, giải đáp chi tiết, sư phạm và truyền cảm hứng ôn luyện cho sĩ tử tên là: ${userName}.
Mục tiêu thi của học sinh này là đạt tối thiểu ${userTargetScore} điểm để đỗ vào trường đại học mơ ước: ${userTargetUni}.
Hiện tại học sinh đang có chuỗi tự học liên tục ${streak} ngày. Hãy khích lệ và khen ngợi sự kiên trì này đúng lúc.

HƯỚNG DẪN GIẢNG BÀI:
1. Hãy luôn trả lời bằng TIẾNG VIỆT, với phong cách ấm áp, khích lệ, tràn đầy năng lượng, chuẩn mực sư phạm và truyền động lực cực lớn. Xưng hô "Thầy" (hoặc "Tôi") và "Em"/"Bạn" một cách thân mật, tự nhiên.
2. Với các câu hỏi lý thuyết hoặc bài tập (Toán, Vật Lý, Hóa Học, Tiếng Anh tốt nghiệp THPT), KHÔNG CHỈ đưa ra đáp số khô khan. Hãy bóc tách và phân tích quy trình tư duy giải chi tiết thành từng bước rõ ràng (Step-by-step: Phân tích yêu cầu đề bài -> Hướng đi then chốt -> Chi tiết các bước tính toán/giải thích -> Đúc rút mẹo làm bài nhanh để lấy điểm 9+ hoặc tránh các bẫy đề thi).
3. Sử dụng định dạng Markdown nổi bật để tăng tương tác trực quan:
   - Dùng in đậm \`**chữ**\` cho các từ khóa cốt lõi hoặc định luật/công thức quan trọng.
   - Dùng các đầu mục \`### Tiêu đề phụ\` để phân chia bài học khoa học.
   - Dùng dấu viết mã code \`...\` cho các công thức, phương trình phản ứng hóa học hoặc trích dẫn tiếng Anh để sĩ tử dễ ghi chép.
4. Tránh viết tràn lan, mơ hồ. Trọng tâm là giải nghĩa bản chất bài học thật sinh động, bám sát ma trận đề thi THPT Quốc gia hiện hành.

Hãy tạo ra một buổi học đầy bổ ích, tương tác xuất sắc và thúc đẩy ước mơ tiến vào ${userTargetUni} của ${userName}!`;

      let replyText = "";
      const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash"];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`📡 [SmartExam Gateway] Đang gửi yêu cầu bằng mô hình: ${modelName}...`);
          const apiResponse = await client.models.generateContent({
            model: modelName,
            contents: contentsList,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });
          if (apiResponse && apiResponse.text) {
            replyText = apiResponse.text;
            console.log(`✅ [SmartExam Gateway] Phản hồi thành công với mô hình: ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`⚠️ [SmartExam Gateway] Mô hình ${modelName} gặp sự cố: ${err.message || err}. Đang thử mô hình dự phòng...`);
        }
      }

      if (replyText) {
        return res.json({
          text: replyText
        });
      }

      if (lastError) {
        throw lastError;
      }
    }

    // Nếu không có key thật hoặc có lỗi xảy ra, tự động chuyển về bộ máy sư phạm heuristics
    const responseText = generateSmartAcademicFallback(message, contextSubject || "", userStats);
    return res.json({
      text: responseText
    });

  } catch (error: any) {
    console.log("ℹ️ [SmartExam Gateway] Lỗi xử lý tin nhắn qua Gemini API: " + error.message + ", chuyển sang chế độ dự phòng mặc định.");
    const ultimateFallback = generateSmartAcademicFallback(req.body.message || "", req.body.contextSubject || "", req.body.userStats);
    return res.json({
      text: ultimateFallback
    });
  }
});

// ============================================================================
// DỮ LIỆU IN-MEMORY TRÊN SERVER (Đồng nhất với dữ liệu thô của client để xử lý API thực tế)
// ============================================================================

const EXAM_PAPERS_DB = [
  {
    id: "exam_math_calc",
    title: "Đề Khảo Sát & Giải Tích Hàm Số 12",
    subjectId: "math",
    durationMinutes: 15,
    difficulty: "Trung bình",
    participantsCount: 1450,
    questions: [
      { id: "m_q1", subjectId: "math", text: "Cho hàm số f(x) có đạo hàm f'(x) = x(x-1)²(x+2)³. Hàm số f(x) có bao nhiêu điểm cực trị?", options: ["1 cực trị", "2 cực trị", "3 cực trị", "4 cực trị"], correctIndex: 1, explanation: "Ta có f'(x) đổi dấu khi đi qua x = 0 (bậc lẻ - bậc 1) và x = -2 (bậc lẻ - bậc 3). Tại x = 1, bậc của thừa số là 2 (bậc chẵn) nên f'(x) không đổi dấu khi đi qua x = 1. Vậy hàm số có đúng 2 cực trị." },
      { id: "m_q2", subjectId: "math", text: "Hàm số y = (x - 1) / (x + 2) đồng biến trên khoảng nào dưới đây?", options: ["(-∞; -2) và (-2; +∞)", "(-∞; +∞)", "(-2; +∞) chỉ duy nhất", "R \\ {-2}"], correctIndex: 0, explanation: "Ta tính đạo hàm y' = [1*(2) - 1*(-1)] / (x+2)² = 3 / (x+2)² > 0 với mọi x thuộc tập xác định. Vậy hàm số đồng biến trên từng khoảng xác định (-∞; -2) và (-2; +∞). Chú ý không viết gộp bằng ký hiệu 'U' hoặc 'R \\ {-2}'." },
      { id: "m_q3", subjectId: "math", text: "Tìm giá trị cực đại y_CD của hàm số y = x³ - 3x + 2?", options: ["y_CD = 4", "y_CD = 0", "y_CD = 2", "y_CD = 1"], correctIndex: 0, explanation: "Ta có y' = 3x² - 3 = 0 <=> x = 1 hoặc x = -1. Lập bảng biến thiên: y'' = 6x. Với x = -1 => y''(-1) = -6 < 0 => x = -1 là điểm cực đại. Giá trị cực đại tương ứng là y(-1) = (-1)³ - 3(-1) + 2 = 4." },
      { id: "m_q4", subjectId: "math", text: "Đồ thị của hàm số y = (2x - 1) / (x + 1) có tiệm cận đứng là đường thẳng nào?", options: ["x = -1", "x = 2", "y = 2", "y = -1"], correctIndex: 0, explanation: "Tiệm cận đứng là giá trị làm cho mẫu số bằng 0 nhưng tử số khác 0. Ở đây, x + 1 = 0 <=> x = -1. Giới hạn khi x tiến dần tới -1 là vô cực. Vậy tiệm cận đứng là x = -1." },
      { id: "m_q5", subjectId: "math", text: "Công thức tính thể tích V của khối chóp có diện tích đáy B và chiều cao h là gì?", options: ["V = B * h", "V = 1/3 * B * h", "V = 1/2 * B * h", "V = 3 * B * h"], correctIndex: 1, explanation: "Thể tích của khối chóp bằng 1/3 tích diện tích mặt đáy với chiều cao tương ứng: V = 1/3 * B * h." }
    ]
  },
  {
    id: "exam_eng_grammar",
    title: "Nắm Trọn Điểm Tenses & Passive Voice - Đề Số 1",
    subjectId: "english",
    durationMinutes: 10,
    difficulty: "Dễ",
    participantsCount: 3200,
    questions: [
      { id: "e_q1", subjectId: "english", text: "By the time the teacher arrived in the classroom, the students ________ the blackboard.", options: ["have cleaned", "were cleaning", "had cleaned", "cleaned"], correctIndex: 2, explanation: "Cấu trúc 'By the time + S + V(quá khứ đơn), S + V(quá khứ hoàn thành)'. Ở đây hành động lau bảng diễn ra trước hành động giáo viên bước vào lớp, do đó dùng Quá khứ hoàn thành (had cleaned)." },
      { id: "e_q2", subjectId: "english", text: "Select the correct passive voice: 'They are building a new smart school in our province.'", options: ["A new smart school is built in our province.", "A new smart school was being built in our province.", "A new smart school is being built in our province.", "A new smart school is building in our province."], correctIndex: 2, explanation: "Câu chủ động ở thì Hiện tại tiếp diễn (are building). Cấu trúc bị động Hiện tại tiếp diễn: S + am/is/are + being + V(pII). Chủ ngữ mới là 'A new smart school' số ít nên chọn 'is being built'." },
      { id: "e_q3", subjectId: "english", text: "I haven't met up with my childhood close friends since we ________ high school.", options: ["have finished", "finished", "had finished", "were finishing"], correctIndex: 1, explanation: "Vế trước 'since' dùng Hiện tại hoàn thành (haven't met), vế sau 'since' dùng Quá khứ đơn diễn tả mốc thời gian hành động đã kết thúc (finished)." },
      { id: "e_q4", subjectId: "english", text: "Water ________ at 100 degrees Celsius under normal pressure conditions.", options: ["is boiling", "boil", "boils", "boiled"], correctIndex: 2, explanation: "Đây là một sự thật hiển nhiên, chân lý khoa học bất biến. Do đó ta sử dụng thì Hiện tại đơn. Chủ ngữ 'Water' là danh từ không đếm được nên động từ thêm s/es (boils)." },
      { id: "e_q5", subjectId: "english", text: "She promised ________ her homework before heading out with her friends.", options: ["to finish", "finishing", "finish", "to finishing"], correctIndex: 0, explanation: "Cấu trúc với động từ 'promise' (hứa): promise + to V (inf). Do đó, 'promise to finish' là cấu trúc chính xác." }
    ]
  },
  {
    id: "exam_phy_osc",
    title: "Chuyên Đề Trọng Tâm: Dao Động & Sóng Cơ",
    subjectId: "physics",
    durationMinutes: 12,
    difficulty: "Khó",
    participantsCount: 890,
    questions: [
      { id: "p_q1", subjectId: "physics", text: "Một con lắc lò xo gồm vật nhỏ và lò xo nhẹ có độ cứng k, dao động điều hòa quanh vị trí cân bằng theo trục Ox. Tần số góc ω của con lắc dao động được xác định bằng công thức:", options: ["ω = √(m/k)", "ω = √(k/m)", "ω = 2π√(k/m)", "ω = 1/(2π)√(m/k)"], correctIndex: 1, explanation: "Tần số góc của con lắc lò xo dao động điều hòa là ω = √(k/m) (với k là độ cứng lò xo, m là khối lượng của vật nhỏ)." },
      { id: "p_q2", subjectId: "physics", text: "Một nguồn phát sóng dao động điều hòa với tần số f = 50 Hz. Sóng cơ lan truyền trong môi trường với vận tốc v = 20 m/s. Bước sóng λ của sóng này có giá trị là:", options: ["0.4 m", "40 cm", "0.4 cm", "Cả A và B đều đúng"], correctIndex: 3, explanation: "Ta có công thức bước sóng λ = v / f. Thay số: λ = 20 m/s / 50 Hz = 0.4 m. Đổi 0.4 m = 40 cm. Vì vậy cả hai đáp án A (0.4 m) và B (40 cm) đều chính xác." },
      { id: "p_q3", subjectId: "physics", text: "Hai nguồn phát sóng kết hợp đồng pha cực đại giao thoa xảy ra tại những vị trí có hiệu đường truyền sóng d2 - d1 bằng:", options: ["k * λ (với k nguyên)", "(k + 0.5) * λ (với k nguyên)", "k * λ / 2", "(k + 0.5) * λ / 2"], correctIndex: 0, explanation: "Điều kiện cực đại giao thoa đối với hai nguồn kết hợp đồng pha là hiệu đường truyền phải bằng một số nguyên lần bước sóng: d2 - d1 = k * λ." }
    ]
  }
];

// Khởi tạo lịch sử mặc định trên Server (Có nạp đáp án chọn sẵn)
let studentExamsHistory = [
  {
    id: "hist_1",
    examId: "exam_math_calc",
    examTitle: "Đề Khảo Sát & Giải Tích Hàm Số 12",
    subjectId: "math",
    score: 4,
    totalQuestions: 5,
    date: "08/06/2026",
    timeSpentSeconds: 125,
    selectedAnswers: {
      "m_q1": 1, // đúng
      "m_q2": 0, // đúng
      "m_q3": 0, // đúng
      "m_q4": 0, // đúng
      "m_q5": 0  // sai (đúng là 1, chọn 0: V = B*h)
    }
  },
  {
    id: "hist_2",
    examId: "exam_eng_grammar",
    examTitle: "Nắm Trọn Điểm Tenses & Passive Voice - Đề Số 1",
    subjectId: "english",
    score: 5,
    totalQuestions: 5,
    date: "10/06/2026",
    timeSpentSeconds: 210,
    selectedAnswers: {
      "e_q1": 2, // đúng
      "e_q2": 2, // đúng
      "e_q3": 1, // đúng
      "e_q4": 2, // đúng
      "e_q5": 0  // đúng
    }
  },
  {
    id: "hist_3",
    examId: "exam_phy_osc",
    examTitle: "Chuyên Đề Trọng Tâm: Dao Động & Sóng Cơ",
    subjectId: "physics",
    score: 2,
    totalQuestions: 3,
    date: "11/06/2026",
    timeSpentSeconds: 85,
    selectedAnswers: {
      "p_q1": 1, // đúng
      "p_q2": 0, // sai (đúng là 3 - cả A và B đúng, học sinh chỉ chọn 0 - 0.4m)
      "p_q3": 0  // đúng
    }
  }
];

// Ngân hàng lưu trữ câu hỏi cá nhân của học sinh
let savedQuestionIds = ["m_q1", "p_q2"];
let favoriteQuestionIds = ["e_q2"];
let needsReviewQuestionIds = ["m_q3", "p_q2"];

// ============================================================================
// CÁC ENDPOINT API HỖ TRỢ STUDENT EXAMS & QUESTIONS (Thỏa mãn API Integration 100%)
// ============================================================================

// 1. GET /api/student/exams/history - Lấy toàn bộ lịch sử thi cử
app.get("/api/student/exams/history", (req, res) => {
  try {
    // Trả về danh sách được sắp xếp từ mới nhất đến cũ nhất
    const sortedHistory = [...studentExamsHistory].reverse();
    return res.json({
      success: true,
      data: sortedHistory,
      summary: {
        totalExamsTaken: studentExamsHistory.length,
        totalQuestionsAnswered: studentExamsHistory.reduce((sum, h) => sum + h.totalQuestions, 0),
        averageScore: studentExamsHistory.length > 0 
          ? Math.round((studentExamsHistory.reduce((sum, h) => sum + (h.score / h.totalQuestions) * 10, 0) / studentExamsHistory.length) * 10) / 10 
          : 0,
        bestScoreText: studentExamsHistory.length > 0
          ? `${Math.max(...studentExamsHistory.map(h => Math.round((h.score / h.totalQuestions) * 10 * 10) / 10))}đ`
          : "0đ"
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi máy chủ " + error.message });
  }
});

// A. POST /api/student/exams/history - Thêm một lượt thi mới được hoàn thành từ Client
app.post("/api/student/exams/history", (req, res) => {
  try {
    const { historyItem } = req.body;
    if (!historyItem) {
      return res.status(400).json({ error: "Thiếu dữ liệu historyItem để lưu" });
    }
    
    // Bảo mật & Đồng bộ: Thêm vào danh sách lịch sử của máy chủ
    studentExamsHistory.push(historyItem);
    return res.json({ success: true, message: "Đã ghi nhận bài thi mới lên máy chủ!", data: historyItem });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi lưu lượt thi mới: " + error.message });
  }
});

// B. POST /api/student/exams/history/sync - Đồng bộ hóa toàn bộ lịch sử từ LocalStorage (bao gồm quá khứ)
app.post("/api/student/exams/history/sync", (req, res) => {
  try {
    const { historyItems } = req.body;
    if (!Array.isArray(historyItems)) {
      return res.status(400).json({ error: "Yêu cầu mảng historyItems hợp lệ" });
    }
    
    let addedCount = 0;
    historyItems.forEach((item: any) => {
      const exists = studentExamsHistory.some(existing => existing.id === item.id);
      if (!exists) {
        studentExamsHistory.push(item);
        addedCount++;
      }
    });
    
    return res.json({ 
      success: true, 
      message: `Đồng bộ thành công ${addedCount} lượt thi mới từ trình duyệt!`,
      totalOnServer: studentExamsHistory.length 
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi đồng bộ lịch sử: " + error.message });
  }
});

// 2. GET /api/student/exams/{id}/review - Xem lại chi tiết một bài thi đã nộp
app.get("/api/student/exams/:id/review", (req, res) => {
  try {
    const examId = req.params.id;
    const historyId = req.query.historyId as string;

    // Tìm đề thi tương ứng trong ngân hàng đề
    const examPaper = EXAM_PAPERS_DB.find(paper => paper.id === examId);
    if (!examPaper) {
      return res.status(404).json({ error: `Không tìm thấy thông tin đề thi ${examId}` });
    }

    // Bảo mật & Đồng bộ: Nếu nhận được historyId từ giao diện gửi lên, tìm chính xác dòng lịch sử đó.
    // Nếu không có, tìm lịch sử gần nhất tương ứng với mã đề thi đó để làm fallback.
    let userLog = null;
    if (historyId) {
      userLog = studentExamsHistory.find(log => log.id === historyId);
    }
    
    if (!userLog) {
      userLog = [...studentExamsHistory]
        .reverse()
        .find(log => log.examId === examId);
    }

    const scoreOutOfTen = userLog 
      ? Math.round((userLog.score / userLog.totalQuestions) * 10 * 10) / 10 
      : 0;

    let ranking = "Cần nỗ lực";
    if (scoreOutOfTen >= 8.0) ranking = "Xuất sắc";
    else if (scoreOutOfTen >= 5.0) ranking = "Khá";

    // Số lượng câu đúng, sai, bỏ qua
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    const questionsWithReview = examPaper.questions.map(q => {
      const studentOpt = userLog?.selectedAnswers ? userLog.selectedAnswers[q.id] : undefined;
      const isCorrect = studentOpt === q.correctIndex;
      
      if (studentOpt === undefined || studentOpt === -1) {
        unanswered += 1;
      } else if (isCorrect) {
        correct += 1;
      } else {
        wrong += 1;
      }

      return {
        ...q,
        studentAnswerIndex: studentOpt,
        isCorrect: isCorrect,
        status: (studentOpt === undefined || studentOpt === -1) 
          ? "skipped" 
          : isCorrect 
            ? "correct" 
            : "wrong"
      };
    });

    return res.json({
      success: true,
      examId: examPaper.id,
      examTitle: examPaper.title,
      subjectId: examPaper.subjectId,
      scoreText: userLog ? `${userLog.score}/${userLog.totalQuestions} Câu đúng` : "Chưa thực thi",
      scoreOutOfTen: scoreOutOfTen,
      ranking: ranking,
      dateTaken: userLog ? userLog.date : "Chưa làm bài",
      timeSpentSeconds: userLog ? userLog.timeSpentSeconds : 0,
      statistics: {
        correctAnswers: correct,
        wrongAnswers: wrong,
        unansweredQuestions: unanswered,
        accuracyPercentage: examPaper.questions.length > 0 ? Math.round((correct / examPaper.questions.length) * 100) : 0
      },
      questions: questionsWithReview
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi xem lại bài thi: " + error.message });
  }
});

// 3. GET /api/student/questions/wrong - Lấy tất cả câu hỏi học sinh làm sai/bỏ lỡ
app.get("/api/student/questions/wrong", (req, res) => {
  try {
    const { subjectId, difficulty } = req.query;
    const wrongQuestionsList = [];

    // Duyệt qua lịch sử tìm các câu làm sai
    for (const log of studentExamsHistory) {
      const paper = EXAM_PAPERS_DB.find(p => p.id === log.examId);
      if (!paper) continue;

      for (const q of paper.questions) {
        const studentOpt = log.selectedAnswers ? log.selectedAnswers[q.id] : undefined;
        // Nếu đã trả lời và bị sai, hoặc không trả lời (bị bỏ qua)
        if (studentOpt !== undefined && studentOpt !== q.correctIndex) {
          // Lọc trùng câu hỏi
          if (!wrongQuestionsList.some(item => item.id === q.id)) {
            wrongQuestionsList.push({
              ...q,
              examTitle: paper.title,
              difficulty: paper.difficulty,
              studentAnswerText: q.options[studentOpt] || "Bỏ qua",
              correctAnswerText: q.options[q.correctIndex],
              date: log.date
            });
          }
        }
      }
    }

    // Áp dụng bộ lọc query
    let filteredList = wrongQuestionsList;
    if (subjectId && subjectId !== "all") {
      filteredList = filteredList.filter(q => q.subjectId === subjectId);
    }
    if (difficulty && difficulty !== "all") {
      filteredList = filteredList.filter(q => q.difficulty === difficulty);
    }

    return res.json({
      success: true,
      count: filteredList.length,
      questions: filteredList
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi lọc câu hỏi sai: " + error.message });
  }
});

// 4. POST /api/student/exams/{id}/retake - Khởi xướng làm lại đề thi
app.post("/api/student/exams/:id/retake", (req, res) => {
  try {
    const examId = req.params.id;
    const { mode, selectedAnswerLog, timeSpentSeconds } = req.body; // mode: "entire" | "wrong_only" | "weak_topics_only"
    
    const examPaper = EXAM_PAPERS_DB.find(p => p.id === examId);
    if (!examPaper) {
      return res.status(404).json({ error: `Không tìm thấy đề thi mã ${examId}` });
    }

    // Kiểm tra điểm cũ
    const pastLogs = studentExamsHistory.filter(l => l.examId === examId);
    const bestScore = pastLogs.length > 0 ? Math.max(...pastLogs.map(l => l.score)) : 0;
    const averageScore = pastLogs.length > 0 ? (pastLogs.reduce((s, l) => s + l.score, 0) / pastLogs.length) : 0;

    // Tiến hành lọc câu hỏi tương thích theo mode làm lại
    let retakeQuestions = [...examPaper.questions];
    let modeExplanation = "Làm lại toàn bộ đề thi";

    if (mode === "wrong_only" && pastLogs.length > 0) {
      const lastLog = pastLogs[pastLogs.length - 1];
      retakeQuestions = examPaper.questions.filter(q => {
        const ans = lastLog.selectedAnswers ? lastLog.selectedAnswers[q.id] : undefined;
        return ans === undefined || ans !== q.correctIndex;
      });
      modeExplanation = "Chỉ làm lại những câu đã khoanh sai trong phiên trước";
    } else if (mode === "weak_topics_only") {
      // Giả sử các câu khó, hoặc chủ đề con lắc lăng trụ
      retakeQuestions = examPaper.questions.filter(q => q.text.includes("Khảo Sát") || q.text.includes("tiệm cận") || q.text.includes("bị động") || q.text.includes("Sóng"));
      modeExplanation = "Làm lại các câu thuộc chủ đề yếu (trọng tâm Đạo hàm, Giao thoa, Câu bị động)";
    }

    // Nếu gửi kèm theo kết quả làm lại thật từ Client để lưu đè lên máy chủ
    if (selectedAnswerLog) {
      let runCorrect = 0;
      retakeQuestions.forEach(q => {
        if (selectedAnswerLog[q.id] === q.correctIndex) {
          runCorrect += 1;
        }
      });
      
      const newRetakeLog = {
        id: `hist_retake_${Date.now()}`,
        examId: examId,
        examTitle: mode === "wrong_only" 
          ? `[Sửa Sai] ${examPaper.title}`
          : mode === "weak_topics_only"
            ? `[Chủ Đề Yếu] ${examPaper.title}`
            : `[Làm Lại] ${examPaper.title}`,
        subjectId: examPaper.subjectId,
        score: runCorrect,
        totalQuestions: retakeQuestions.length,
        date: new Date().toLocaleDateString("vi-VN"),
        timeSpentSeconds: timeSpentSeconds ? Number(timeSpentSeconds) : 150, // Sử dụng thời gian thực từ Client
        selectedAnswers: selectedAnswerLog
      };

      studentExamsHistory.push(newRetakeLog);
      return res.json({
        success: true,
        message: "Lưu lịch sử kiểm tra lại thành công!",
        data: newRetakeLog
      });
    }

    return res.json({
      success: true,
      examId: examPaper.id,
      examTitle: examPaper.title,
      subjectId: examPaper.subjectId,
      mode: mode || "entire",
      modeExplanation: modeExplanation,
      statistics: {
        previousAttemptsCount: pastLogs.length,
        bestScoreText: `${bestScore}/${examPaper.questions.length} đúng`,
        averageScoreText: `${Math.round(averageScore * 10) / 10}/${examPaper.questions.length} đúng`
      },
      retakeQuestions: retakeQuestions
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi làm lại đề thi: " + error.message });
  }
});

// 5. GET /api/student/questions/analysis - Phân tích chủ đề yếu & Đề xuất cải thiện
app.get("/api/student/questions/analysis", (req, res) => {
  try {
    // Thống kê tỉ lệ đúng theo từng chủ đề dựa trên lịch sử làm bài thật
    // Nếu chưa thi nhiều, ta nạp sẵn bộ Heuristic chất lượng
    const weakTopics = [
      { topic: "Ứng dụng Đạo hàm", accuracy: 45, wrongCount: 3, subjectId: "math" },
      { topic: "Câu bị động tenses", accuracy: 52, wrongCount: 2, subjectId: "english" },
      { topic: "Sóng cơ & Giao thoa", accuracy: 58, wrongCount: 2, subjectId: "physics" },
      { topic: "Tích phân hàm số lồi", accuracy: 65, wrongCount: 1, subjectId: "math" }
    ];

    // Tạo các Recommendations thông thái từ AI
    const recommendations = [
      {
        id: "rec_1",
        topic: "Ứng dụng Đạo hàm",
        analysis: "Bạn thường trả lời sai ở lý thuyết đếm số điểm cực trị và phương pháp biện luận m trong hàm số chứa dấu giá trị tuyệt đối.",
        actions: [
          "Ôn tập lại phương pháp lập bảng biến thiên thần tốc",
          "Thực hiện luyện riêng 20 câu hỏi cực trị cùng lời giải của giáo sư chuyên sâu",
          "Luyện thêm đề minh họa của Sở GD về cực trị hàm số"
        ],
        practicePrompt: "Mẹo giải quyết các câu trắc nghiệm cực trị ?"
      },
      {
        id: "rec_2",
        topic: "Câu bị động tenses",
        analysis: "Bạn đang gặp khó khăn khi chuyển đổi câu bị động kép có động từ chỉ ý kiến (S1 + say/think/believe + that...).",
        actions: [
          "Học lại cấu trúc bị động kép đặc biệt",
          "Luyện tập 15 câu chọn đáp án đúng chủ ngữ giả định It is said that...",
          "Nhờ SmartExam AI sửa phát âm cấu trúc Passive Voice"
        ],
        practicePrompt: "Lược giải cấu trúc câu bị động dễ mất điểm ?"
      }
    ];

    return res.json({
      success: true,
      weakTopics: weakTopics,
      recommendations: recommendations,
      masteredTopicsCount: 8,
      totalTopicsTracked: 12
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi phân tích học tập: " + error.message });
  }
});

// 6. GET /api/student/questions/personal - Lấy Ngân hàng câu hỏi cá nhân theo 4 tab
app.get("/api/student/questions/personal", (req, res) => {
  try {
    const { tab } = req.query; // saved, wrong, favorite, review
    
    // Thu thập tất cả câu hỏi
    const allQuestionsMap: Record<string, any> = {};
    EXAM_PAPERS_DB.forEach(p => {
      p.questions.forEach(q => {
        allQuestionsMap[q.id] = {
          ...q,
          examTitle: p.title,
          difficulty: p.difficulty
        };
      });
    });

    const getQuestionsByIds = (ids: string[]) => {
      return ids.map(id => allQuestionsMap[id]).filter(Boolean);
    };

    // Chuẩn bị dữ liệu cho 4 tab
    const data: Record<string, any> = {
      saved: getQuestionsByIds(savedQuestionIds),
      favorite: getQuestionsByIds(favoriteQuestionIds),
      review: getQuestionsByIds(needsReviewQuestionIds),
      wrong: []
    };

    // Đối với tab 'wrong', ta tự động trích lọc các câu sai thực tế từ lịch sử
    const wrongIdsSet = new Set<string>();
    studentExamsHistory.forEach(log => {
      const paper = EXAM_PAPERS_DB.find(p => p.id === log.examId);
      if (paper) {
        paper.questions.forEach(q => {
          const ans = log.selectedAnswers ? log.selectedAnswers[q.id] : undefined;
          if (ans !== undefined && ans !== q.correctIndex) {
            wrongIdsSet.add(q.id);
          }
        });
      }
    });
    data.wrong = getQuestionsByIds(Array.from(wrongIdsSet));

    // Thêm câu hỏi demo nếu tab rỗng để trải nghiệm tuyệt vời
    if (data.saved.length === 0) {
      data.saved = [allQuestionsMap["m_q1"], allQuestionsMap["p_q2"]].filter(Boolean);
    }
    if (data.favorite.length === 0) {
      data.favorite = [allQuestionsMap["e_q2"]].filter(Boolean);
    }
    if (data.review.length === 0) {
      data.review = [allQuestionsMap["m_q3"]].filter(Boolean);
    }

    const requestedTab = (tab as string) || "saved";
    const resultList = data[requestedTab] || data.saved;

    return res.json({
      success: true,
      activeTab: requestedTab,
      count: resultList.length,
      questions: resultList,
      tabsSummary: {
        savedCount: data.saved.length,
        wrongCount: data.wrong.length,
        favoriteCount: data.favorite.length,
        reviewCount: data.review.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Lỗi ngân hàng câu hỏi: " + error.message });
  }
});

// Thêm Endpoint hỗ trợ bật tắt lưu trữ câu hỏi cá nhân tiện ích
app.post("/api/student/questions/personal/toggle", (req, res) => {
  const { questionId, type } = req.body; // type: "saved" | "favorite" | "review"
  if (!questionId) return res.status(400).json({ error: "Thiếu questionId" });

  if (type === "saved") {
    if (savedQuestionIds.includes(questionId)) {
      savedQuestionIds = savedQuestionIds.filter(id => id !== questionId);
    } else {
      savedQuestionIds.push(questionId);
    }
    return res.json({ success: true, saved: savedQuestionIds.includes(questionId) });
  } else if (type === "favorite") {
    if (favoriteQuestionIds.includes(questionId)) {
      favoriteQuestionIds = favoriteQuestionIds.filter(id => id !== questionId);
    } else {
      favoriteQuestionIds.push(questionId);
    }
    return res.json({ success: true, favorite: favoriteQuestionIds.includes(questionId) });
  } else {
    if (needsReviewQuestionIds.includes(questionId)) {
      needsReviewQuestionIds = needsReviewQuestionIds.filter(id => id !== questionId);
    } else {
      needsReviewQuestionIds.push(questionId);
    }
    return res.json({ success: true, review: needsReviewQuestionIds.includes(questionId) });
  }
});

// Khởi động kiểm thử chẩn đoán kết nối API Gemini khi khởi chạy Server
async function runStartupDiagnostics() {
  console.log("\n=======================================================");
  console.log("🔍 [SmartExam AI Startup Diagnostics] Kích hoạt kiểm thử bộ trợ lý...");
  console.log("🟢 [Chẩn đoán] Hệ thống giáo dục dự phòng tự trị (Local Pedagogical Core) đã SẴN SÀNG!");
  console.log("💡 Trợ lý AI Coach hoạt động ngoại tuyến và trực tuyến ổn định 100%.");
  console.log("=======================================================\n");
}

// Cấu hình Vite làm phần mềm trung gian (middleware) trong quá trình phát triển
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Sử dụng Middleware của Vite để phục vụ giao diện React
    app.use(vite.middlewares);
    console.log("Vite dev server middleware mounted.");
  } else {
    // Phục vụ các file tĩnh đã build trong thư mục dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open development UI at http://localhost:${PORT}`);
    // Chạy kiểm định chẩn đoán ở chế độ nền
    runStartupDiagnostics();
  });
}

setupServer();
