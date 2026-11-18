// Danh mục lý do Admin từ chối đề thi.
// Mã (code) phải khớp với ExamRejectionReasons ở backend.
export const OTHER_REJECTION_REASON_CODE = "OTHER";

export const EXAM_REJECTION_NOTE_MAX_LENGTH = 1000;

export interface ExamRejectionReasonOption {
  code: string;
  label: string;
}

export const EXAM_REJECTION_REASONS: ExamRejectionReasonOption[] = [
  { code: "WRONG_CONTENT", label: "Sai kiến thức hoặc đáp án" },
  { code: "MISSING_DATA", label: "Thiếu câu hỏi hoặc đáp án" },
  { code: "WRONG_STRUCTURE", label: "Sai cấu trúc hoặc thang điểm" },
  { code: "WRONG_SUBJECT_GRADE", label: "Không phù hợp khối lớp hoặc môn học" },
  { code: "DISPLAY_ERROR", label: "Lỗi hiển thị hoặc kỹ thuật" },
  { code: "POLICY_VIOLATION", label: "Vi phạm quy định nội dung" },
  { code: OTHER_REJECTION_REASON_CODE, label: "Lý do khác" },
];

export interface ExamRejectionInfo {
  isRejected: boolean;
  rejectionReasonCodes: string | null;
  rejectionReasons: string[];
  rejectionNote: string | null;
  rejectedAt: string | null;
}
