import React from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import {
  resolveConfirm,
  subscribeConfirm,
  type ConfirmRequest,
} from "../services/confirm";

// Đặt một lần ở gốc ứng dụng (cạnh ToastHost). Hiển thị hộp thoại xác nhận trong trang.
export default function ConfirmHost() {
  const [request, setRequest] = React.useState<ConfirmRequest | null>(null);
  const confirmButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => subscribeConfirm(setRequest), []);

  React.useEffect(() => {
    if (!request) return;

    confirmButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resolveConfirm(request.id, false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [request]);

  if (!request) return null;

  const danger = request.tone === "danger";
  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) resolveConfirm(request.id, false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              danger ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 id="confirm-dialog-title" className="text-base font-black text-slate-800">
              {request.title ?? "Xác nhận"}
            </h3>
            <p
              id="confirm-dialog-message"
              className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600"
            >
              {request.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5 text-sm font-bold">
          <button
            type="button"
            onClick={() => resolveConfirm(request.id, false)}
            className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-slate-600 transition-colors hover:bg-slate-200"
          >
            {request.cancelText ?? "Hủy"}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => resolveConfirm(request.id, true)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-white shadow-sm transition-colors ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {request.confirmText ?? "Đồng ý"}
          </button>
        </div>
      </div>
    </div>
  );
}
