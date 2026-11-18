import { apiRequest } from './apiClient';

export interface StudentDashboardMonthlyDto { label: string; examAttempts: number; practiceAttempts: number; averageScore: number; }
export interface StudentDashboardSubjectDto { subjectId: string; subjectName: string; examAttempts: number; practiceAttempts: number; averageScore: number; }
export interface StudentDashboardExamDto { examId: string; subjectId: string; examName: string; subjectName: string; teacherName: string; durationMinutes: number; totalQuestions: number; }
export interface StudentDashboardActivityDto { type: 'exam' | 'practice'; title: string; subjectName: string; score: number; submittedAt: string; }
export interface StudentDashboardDto {
  studentName: string; studentCode: string; gradeName: string;
  totalExamAttempts: number; totalPracticeAttempts: number;
  averageExamScore: number; averagePracticeScore: number;
  currentStreak: number; activeDaysLast7: number;
  availableExamCount: number; activeTopicCount: number;
  monthlyActivity: StudentDashboardMonthlyDto[];
  subjects: StudentDashboardSubjectDto[];
  availableExams: StudentDashboardExamDto[];
  recentActivities: StudentDashboardActivityDto[];
}

export const getStudentDashboard = () => apiRequest<StudentDashboardDto>('/api/students/dashboard');
