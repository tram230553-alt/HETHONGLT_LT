import { AlertTriangle, Ban, RefreshCw, Trash2 } from "lucide-react";
import type {
  QuestionUsageDto,
  QuestionUsageExamDto,
} from "../services/questionService";

interface Props {
  // null khi đang kiểm tra mức độ sử dụng của câu hỏi.
  usage: QuestionUsageDto | null;
  checkError?: string | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function examStatus(exam: QuestionUsageExamDto) {
  if (exam.isPublished)
    return { label: "Đã công bố", className: "bg-emerald-50 text-emerald-700" };
  if (exam.isSubmittedForApproval)
    return { label: "Chờ Admin duyệt", className: "bg-amber-50 text-amber-700" };
  if (exam.isRejected)
    return { label: "Bị từ chối", className: "bg-rose-50 text-rose-700" };
  return { label: "Bản nháp", className: "bg-slate-100 text-slate-600" };
}

function ExamList({ exams }: { exams: QuestionUsageExamDto[] }) {
  return (
    <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
      {exams.map((exam) => {
        const status = examStatus(exam);

        return (
          <li
            key={exam.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <span className="min-w-0 truncate">{exam.tenBaiKT}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${status.className}`}
            >
              {status.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function DeleteQuestionDialog({
  usage,
  checkError,
  deleting,
  onCancel,
  onConfirm,
}: Props) {
  const checking = usage === null && !checkError;
  const blocked = usage !== null && !usage.canDelete;
  const needsConfirm = usage !== null && usage.canDelete && usage.requiresConfirmation;

  const confirmLabel = needsConfirm
    ? `Vẫn xóa và gỡ khỏi ${usage!.exams.length} đề`
    : "Xóa câu hỏi";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              blocked ? "bg-rose-50 text-rose-600" : needsConfirm ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
            }`}
          >
            {blocked ? (
              <Ban size={20} />
            ) : needsConfirm ? (
              <AlertTriangle size={20} />
            ) : (
              <Trash2 size={20} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-slate-900">
              {blocked ? "Không thể xóa câu hỏi" : "Xóa câu hỏi?"}
            </h3>

            {checking && (
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang kiểm tra câu hỏi có đang được sử dụng trong đề thi...
              </p>
            )}

            {checkError && (
              <p className="mt-2 text-sm font-semibold text-rose-600">{checkError}</p>
            )}

            {blocked && usage && (
              <div className="mt-2 space-y-2">
                <p className="text-sm leading-6 text-rose-700">{usage.blockReason}</p>
                {usage.hasPublishedExam && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                    <p className="text-xs font-bold text-rose-700">
                      Đề thi đang sử dụng câu hỏi này
                    </p>
                    <ExamList exams={usage.exams} />
                  </div>
                )}
              </div>
            )}

            {needsConfirm && usage && (
              <div className="mt-2 space-y-2">
                <p className="text-sm leading-6 text-slate-600">
                  Câu hỏi này đang nằm trong {usage.exams.length} đề thi chưa công bố.
                  Nếu tiếp tục, câu hỏi sẽ bị <b>gỡ khỏi các đề này</b> rồi xóa.
                </p>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-700">
                    Các đề thi bị ảnh hưởng
                  </p>
                  <ExamList exams={usage.exams} />
                </div>
                <p className="text-xs text-red-500">Hành động này không thể hoàn tác.</p>
              </div>
            )}

            {usage && usage.canDelete && !usage.requiresConfirmation && (
              <>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Câu hỏi chưa được dùng trong đề thi nào. Bạn có chắc chắn muốn xóa không?
                </p>
                <p className="mt-1 text-xs text-red-500">Hành động này không thể hoàn tác.</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {blocked || checkError ? "Đóng" : "Hủy"}
          </button>

          {usage && usage.canDelete && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
