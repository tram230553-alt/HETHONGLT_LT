/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Định nghĩa môn học có sẵn trong ứng dụng
export type SubjectId = "math" | "physics" | "chemistry" | "english";

export interface Subject {
  id: SubjectId;
  name: string;
  icon: string;
  color: string;
  progress: number; // Mức độ hoàn thành (%)
  countTopics: number;
}

// Câu hỏi trong đề luyện tập hoặc kiểm tra
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string; // Giải thích chi tiết đáp án
  subjectId: SubjectId;
}

// Một bộ đề luyện thi (Exam)
export interface ExamPaper {
  id: string;
  title: string;
  subjectId: SubjectId;
  durationMinutes: number;
  questions: Question[];
  difficulty: "Dễ" | "Trung bình" | "Khó";
  participantsCount: number; // Số học sinh đã làm đề này
}

// Thẻ ghi nhớ (Flashcard - phong cách Quizlet/StudySmarter)
export interface Flashcard {
  id: string;
  subjectId: SubjectId;
  front: string; // Từ vựng / Khái niệm / Công thức (Mặt trước)
  back: string; // Nghĩa / Định nghĩa / Giải nghĩa (Mặt sau)
  example?: string; // Ví dụ minh họa
  isMastered?: boolean; // Đã vững kiến thức hay chưa
  box?: number; // Hộp ghi nhớ Leitner: 1 (Học lại), 2 (Xem lại 2 ngày), 3 (Xem lại 5 ngày), 4 (Đã thuộc lòng)
  nextReviewDate?: string; // Thời gian ôn tập tiếp theo (ISO string)
  isCustom?: boolean; // Thẻ tự tạo
  customDeckId?: string; // ID của bộ thẻ tự tạo (nếu có)
}

// Lịch sử làm bài tập/đề thi của học sinh
export interface CleanHistoryItem {
  id: string;
  examId: string;
  examTitle: string;
  subjectId: SubjectId;
  score: number; // Số câu đúng
  totalQuestions: number;
  date: string;
  timeSpentSeconds: number;
  selectedAnswers?: Record<string, number>; // Bản ghi questionId -> optionIndex đã khoanh
}

// Trạng thái tiến độ học tập và thông tin người dùng
export interface UserStats {
  fullName: string;
  targetUniversity: string;
  targetScore: number; // Điểm mong muốn (e.g. 27 điểm)
  currentStreak: number; // Chuỗi ngày học liên tục (Streak)
  gems: number; // Điểm kinh nghiệm tích lũy (phong cách Duolingo)
  dailyGoalMinutes: number;
  todayMinutesStudied: number;
  subjectProgress: Record<SubjectId, number>; // Phần trăm tiến độ của từng môn
}

// Đối thoại Gia sư AI
export interface AIChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isFinished?: boolean;
}
