import React from "react";
import { Ban, RefreshCw, X } from "lucide-react";
import {
  EXAM_REJECTION_NOTE_MAX_LENGTH,
  EXAM_REJECTION_REASONS,
  OTHER_REJECTION_REASON_CODE,
} from "../services/examRejectionReasons";

interface Props {
  examTitle: string;
  teacherName?: string;
  submitting: boolean;
  // Lỗi trả về từ server (nếu có) hiển thị ngay trong form.
  serverError?: string | null;
  onCancel: () => void;
  onSubmit: (reasonCodes: string[], note: string) => void | Promise<void>;
}

export default function RejectExamDialog({
  examTitle,
  teacherName,
  submitting,
  serverError,
  onCancel,
  onSubmit,
}: Props) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const otherSelected = selected.includes(OTHER_REJECTION_REASON_CODE);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, submitting]);

  const toggle = (code: string) => {
    setValidationError(null);
    setSelected((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selected.length === 0) {
      setValidationError("Vui lòng chọn ít nhất một lý do từ chối.");
      return;
    }

    const trimmed = note.trim();

    if (otherSelected && !trimmed) {
      setValidationError("Vui lòng nhập nội dung chi tiết cho \"Lý do khác\".");
      return;
    }

    setValidationError(null);
    // Giữ đúng thứ tự hiển thị của danh mục.
    const ordered = EXAM_REJECTION_REASONS.filter((reason) =>
      selected.includes(reason.code),
    ).map((reason) => reason.code);

    await onSubmit(ordered, trimmed);
  };

  const error = validationError ?? serverError ?? null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-exam-title"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white px-6 py-4">
          <div className="min-w-0">
            <h3
              id="reject-exam-title"
              className="flex items-center gap-2 text-lg font-black text-slate-800"
            >
              <Ban className="h-5 w-5 text-rose-600" />
              Từ chối đề thi
            </h3>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {examTitle}
              {teacherName ? ` • ${teacherName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Đóng"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <fieldset>
            <legend className="text-sm font-black text-slate-800">
              Lý do từ chối <span className="text-rose-600">*</span>
            </legend>
            <p className="mt-0.5 text-xs text-slate-500">
              Chọn một hoặc nhiều lý do. Giáo viên sẽ nhận được thông báo kèm
              các lý do này.
            </p>

            <div className="mt-3 space-y-2">
              {EXAM_REJECTION_REASONS.map((reason) => {
                const checked = selected.includes(reason.code);

                return (
                  <label
                    key={reason.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      checked
                        ? "border-rose-300 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(reason.code)}
                      disabled={submitting}
                      className="h-4 w-4 accent-rose-600"
                    />
                    {reason.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-sm font-black text-slate-800">
              Chi tiết cho giáo viên{" "}
              {otherSelected ? (
                <span className="text-rose-600">*</span>
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  (không bắt buộc)
                </span>
              )}
            </span>
            <textarea
              value={note}
              onChange={(event) => {
                setValidationError(null);
                setNote(event.target.value);
              }}
              maxLength={EXAM_REJECTION_NOTE_MAX_LENGTH}
              rows={4}
              disabled={submitting}
              placeholder={
                otherSelected
                  ? "Nhập lý do cụ thể..."
                  : "Ví dụ: Câu 3 đáp án đúng phải là C, câu 7 thiếu phương án D..."
              }
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
            />
            <span className="block text-right text-[11px] font-semibold text-slate-400">
              {note.length}/{EXAM_REJECTION_NOTE_MAX_LENGTH}
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            Xác nhận từ chối
          </button>
        </div>
      </form>
    </div>
  );
}
