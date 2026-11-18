import { apiRequest } from "./apiClient";
import type { TeacherQuestionDto } from "./teacherQuestionService";
import type { ExamRejectionInfo } from "./examRejectionReasons";

export interface TeacherExamDto extends ExamRejectionInfo {
  id: string;
  tenBaiKT: string;
  thoiLuong: number;
  isSubmittedForApproval: boolean;
  isPublished: boolean;
  totalQuestions: number;
}

export interface TeacherExamDetailDto extends ExamRejectionInfo {
  id: string;
  tenBaiKT: string;
  thoiLuong: number;
  isSubmittedForApproval: boolean;
  isPublished: boolean;
  questions: TeacherQuestionDto[];
}

export interface SaveTeacherExamRequest {
  tenBaiKT: string;
  thoiLuong: number;
  // Danh sách câu hỏi của đề; phải đúng số câu theo cấu hình của Admin.
  questionIds: string[];
}

export const getMyTeacherExams = () =>
  apiRequest<TeacherExamDto[]>("/api/exams/my");

export const getTeacherExamDetail = (id: string) =>
  apiRequest<TeacherExamDetailDto>(`/api/teachers/exams/${id}`);

export const createTeacherExam = (data: SaveTeacherExamRequest) =>
  apiRequest<string>("/api/exams", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateTeacherExam = (id: string, data: SaveTeacherExamRequest) =>
  apiRequest<string>(`/api/exams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteTeacherExam = (id: string) =>
  apiRequest<string>(`/api/exams/${id}`, { method: "DELETE" });

export const addQuestionToTeacherExam = (examId: string, questionId: string) =>
  apiRequest<string>(`/api/exams/${examId}/questions/${questionId}`, { method: "POST" });

export const removeQuestionFromTeacherExam = (examId: string, questionId: string) =>
  apiRequest<string>(`/api/exams/${examId}/questions/${questionId}`, { method: "DELETE" });

export const submitTeacherExamForApproval = (id: string) =>
  apiRequest<string>(`/api/exams/${id}/submit-for-approval`, {
    method: "PUT",
  });
