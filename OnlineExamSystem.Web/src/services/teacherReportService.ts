import { apiRequest } from './apiClient';

export interface TeacherReportMonthlyActivityDto {
  year: number;
  month: number;
  label: string;
  questionsCreated: number;
  examAttempts: number;
  practiceAttempts: number;
  averageExamScore: number;
  averagePracticeScore: number;
}

export interface TeacherReportQuestionDto {
  questionId: string;
  questionText: string;
  difficulty: string;
  topicName: string;
  chapterName: string;
  answeredCount: number;
  correctCount: number;
  correctRate: number;
}

export interface TeacherReportExamDto {
  examId: string;
  examName: string;
  durationMinutes: number;
  isPublished: boolean;
  isSubmittedForApproval: boolean;
  totalQuestions: number;
  attemptCount: number;
  participatingStudentCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
}

export interface TeacherRecentSubmissionDto {
  examResultId: string;
  studentCode: string;
  studentName: string;
  examName: string;
  score: number;
  submittedAt: string;
}

export interface TeacherReportDto {
  totalQuestions: number;
  totalExams: number;
  publishedExams: number;
  examAttemptCount: number;
  practiceAttemptCount: number;
  participatingStudentCount: number;
  averageExamScore: number;
  examPassRate: number;
  monthlyActivity: TeacherReportMonthlyActivityDto[];
  questions: TeacherReportQuestionDto[];
  exams: TeacherReportExamDto[];
  recentSubmissions: TeacherRecentSubmissionDto[];
}

export const getTeacherReport = () =>
  apiRequest<TeacherReportDto>('/api/teachers/reports');
