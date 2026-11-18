import { apiRequest } from "./apiClient";

export interface TeacherStudentExamResultDto {
  examResultId: string;
  examId: string;
  examName: string;
  score: number;
  correctQuestion: number;
  totalQuestion: number;
  submittedAt: string;
}

export interface TeacherStudentResultDto {
  studentId: string;
  maHS: string;
  studentName: string;
  email: string;
  gradeName: string;
  isLocked: boolean;
  completedExams: number;
  averageScore: number;
  correctQuestion: number;
  totalQuestion: number;
  lastSubmittedAt: string | null;
  results: TeacherStudentExamResultDto[];
}

export const getTeacherStudentResults = () =>
  apiRequest<TeacherStudentResultDto[]>("/api/teachers/student-results");

export interface TeacherPracticeAttemptDto {
  attemptId: string;
  topicId: string;
  topicName: string;
  chapterName: string;
  chapterOrder: number;
  orderNum: number;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  submittedAt: string;
}

export interface TeacherStudentPracticeResultDto {
  studentId: string;
  maHS: string;
  studentName: string;
  email: string;
  gradeName: string;
  isLocked: boolean;
  attemptCount: number;
  completedTopics: number;
  totalTopics: number;
  averageScore: number;
  highestScore: number;
  correctAnswers: number;
  totalQuestions: number;
  lastSubmittedAt: string | null;
  attempts: TeacherPracticeAttemptDto[];
}

export const getTeacherStudentPracticeResults = () =>
  apiRequest<TeacherStudentPracticeResultDto[]>(
    "/api/teachers/student-practice-results",
  );

export interface PracticeWrongStudentDto {
  studentId: string;
  maHS: string;
  studentName: string;
  selectedAnswer: string;
  topicName: string;
  submittedAt: string;
}

export interface CommonWrongPracticeQuestionDto {
  questionId: string;
  questionText: string;
  topicId: string;
  topicName: string;
  chapterName: string;
  chapterOrder: number;
  orderNum: number;
  wrongCount: number;
  answeredCount: number;
  studentCount: number;
  wrongRate: number;
  questionType: string;
  correctAnswer: string;
  explanation?: string | null;
  mostChosenWrongAnswer?: string | null;
  mostChosenWrongAnswerCount: number;
  options: ExamQuestionOptionStatDto[];
  wrongStudents: PracticeWrongStudentDto[];
}

export const getCommonWrongPracticeQuestions = (limit = 200) =>
  apiRequest<CommonWrongPracticeQuestionDto[]>(
    `/api/teachers/practice-common-wrong-questions?limit=${limit}`,
  );


/* =========================================================
   THỐNG KÊ CÂU SAI THEO ĐỀ THI
========================================================= */

export interface ExamWrongQuestionExamDto {
  examId: string;
  examName: string;
  totalQuestions: number;
  submissionCount: number;
}

export interface ExamQuestionOptionStatDto {
  option: string;
  text: string;
  isCorrect: boolean;
  selectedCount: number;
}

export interface ExamWrongStudentDto {
  studentId: string;
  maHS: string;
  studentName: string;
  selectedAnswer: string;
  examName: string;
  submittedAt: string;
}

export interface ExamWrongQuestionDto {
  questionId: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  topicName: string;
  chapterName: string;
  correctAnswer: string;
  explanation?: string | null;
  totalAttempts: number;
  wrongCount: number;
  blankCount: number;
  studentCount: number;
  wrongRate: number;
  mostChosenWrongAnswer?: string | null;
  mostChosenWrongAnswerCount: number;
  options: ExamQuestionOptionStatDto[];
  wrongStudents: ExamWrongStudentDto[];
}

export interface ExamWrongQuestionStatsDto {
  examId?: string | null;
  examName?: string | null;
  exams: ExamWrongQuestionExamDto[];
  submissionCount: number;
  studentCount: number;
  questionsWithWrongAnswers: number;
  questions: ExamWrongQuestionDto[];
}

export const getExamWrongQuestions = (examId?: string, limit = 200) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (examId) params.set("examId", examId);
  return apiRequest<ExamWrongQuestionStatsDto>(
    `/api/teachers/exam-wrong-questions?${params.toString()}`,
  );
};


/* =========================================================
   CHI TIẾT BÀI LÀM CỦA HỌC SINH (BÀI THI + LUYỆN TẬP)
========================================================= */

export interface TeacherAttemptQuestionDetailDto {
  questionId: string;
  order: number;
  questionText: string;
  questionType: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  /** Ví dụ "B" hoặc "A,C". Rỗng nếu học sinh bỏ trống. */
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isBlank: boolean;
  explanation?: string | null;
}

export interface TeacherExamResultDetailDto {
  examResultId: string;
  examId: string;
  examName: string;
  studentId: string;
  maHS: string;
  studentName: string;
  score: number;
  totalQuestion: number;
  correctQuestion: number;
  blankQuestion: number;
  submittedAt: string;
  questions: TeacherAttemptQuestionDetailDto[];
}

export interface TeacherPracticeAttemptDetailDto {
  attemptId: string;
  topicId: string;
  topicName: string;
  chapterName: string;
  chapterOrder: number;
  orderNum: number;
  studentId: string;
  maHS: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  blankQuestions: number;
  submittedAt: string;
  questions: TeacherAttemptQuestionDetailDto[];
}

export const getTeacherExamResultDetail = (examResultId: string) =>
  apiRequest<TeacherExamResultDetailDto>(
    `/api/teachers/student-results/${examResultId}/detail`,
  );

export const getTeacherPracticeAttemptDetail = (attemptId: string) =>
  apiRequest<TeacherPracticeAttemptDetailDto>(
    `/api/teachers/student-practice-results/${attemptId}/detail`,
  );
