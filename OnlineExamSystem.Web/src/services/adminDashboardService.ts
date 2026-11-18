import { apiRequest } from './apiClient';

export interface AdminExamSubmissionLogDto {
  examResultId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  gradeName: string;
  examId: string;
  examName: string;
  subjectName: string;
  submittedAt: string;
  score: number;
  isPassed: boolean;
}

export const getRecentExamSubmissions = (limit = 10) =>
  apiRequest<AdminExamSubmissionLogDto[]>(
    `/api/admin/dashboard/recent-exam-submissions?limit=${limit}`,
  );
