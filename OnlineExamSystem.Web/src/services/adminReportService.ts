import { apiRequest } from './apiClient';

export interface AdminMonthlyActivityDto { label: string; newUsers: number; examAttempts: number; practiceAttempts: number; averageExamScore: number; averagePracticeScore: number; }
export interface AdminSubjectReportDto { subjectId: string; subjectName: string; questionCount: number; examCount: number; publishedExamCount: number; examAttemptCount: number; practiceAttemptCount: number; averageExamScore: number; }
export interface AdminTeacherReportDto { teacherId: string; teacherName: string; subjectName: string; gradeName: string; questionCount: number; examCount: number; publishedExamCount: number; examAttemptCount: number; averageStudentScore: number; }
export interface AdminStudentReportDto { studentId: string; studentCode: string; studentName: string; gradeName: string; examAttemptCount: number; practiceAttemptCount: number; averageExamScore: number; averagePracticeScore: number; lastActivityAt: string | null; }
export interface AdminExamReportDto { examId: string; examName: string; subjectName: string; teacherName: string; durationMinutes: number; isPublished: boolean; totalQuestions: number; attemptCount: number; studentCount: number; averageScore: number; highestScore: number; lowestScore: number; passRate: number; }

export interface AdminAnalyticsReportDto {
  totalUsers: number;
  lockedUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalQuestions: number;
  totalExams: number;
  publishedExams: number;
  examAttemptCount: number;
  practiceAttemptCount: number;
  averageExamScore: number;
  averagePracticeScore: number;
  examPassRate: number;
  monthlyActivity: AdminMonthlyActivityDto[];
  subjects: AdminSubjectReportDto[];
  teachers: AdminTeacherReportDto[];
  students: AdminStudentReportDto[];
  exams: AdminExamReportDto[];
}

export const getAdminAnalyticsReport = () =>
  apiRequest<AdminAnalyticsReportDto>('/api/admin/reports/analytics');
