import { apiRequest } from "./apiClient";
import type { TeacherQuestionDto } from "./teacherQuestionService";
import type { ExamRejectionInfo } from "./examRejectionReasons";

export interface AdminExamDto extends ExamRejectionInfo {
  id: string;
  monHoc: string;
  khoi: string;
  giaoVien: string;
  tenBaiKT: string;
  thoiLuong: number;
  totalQuestions: number;
  isSubmittedForApproval: boolean;
  isPublished: boolean;
}

export interface AdminExamDetailDto extends ExamRejectionInfo {
  id: string;
  tenBaiKT: string;
  thoiLuong: number;
  isSubmittedForApproval: boolean;
  isPublished: boolean;
  questions: TeacherQuestionDto[];
}

export const getAdminExams = () =>
  apiRequest<AdminExamDto[]>("/api/exams");

export const getAdminExamDetail = (id: string) =>
  apiRequest<AdminExamDetailDto>(`/api/exams/${id}`);

export const publishAdminExam = (id: string) =>
  apiRequest<string>(`/api/exams/${id}/publish`, {
    method: "PUT",
  });

export interface RejectAdminExamRequest {
  reasonCodes: string[];
  note?: string;
}

// Admin từ chối đề đang chờ duyệt (bắt buộc có lý do).
export const rejectAdminExam = (id: string, data: RejectAdminExamRequest) =>
  apiRequest<string>(`/api/exams/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
