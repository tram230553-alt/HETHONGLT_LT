import React from "react";
import { AlertCircle, Bell, CheckCircle2, X } from "lucide-react";
import { dismissToast, subscribeToasts, type ToastItem } from "../services/toast";

const STYLES = {
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2, icon: "text-emerald-600" },
  error: { box: "border-rose-200 bg-rose-50 text-rose-800", Icon: AlertCircle, icon: "text-rose-600" },
  info: { box: "border-indigo-200 bg-indigo-50 text-indigo-800", Icon: Bell, icon: "text-indigo-600" },
} as const;

// Đặt một lần ở gốc ứng dụng. Cố định góc trên bên phải, nằm trên mọi hộp thoại.
export default function ToastHost() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => subscribeToasts(setItems), []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[1100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map((item) => {
        const style = STYLES[item.type];

        return (
          <div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${style.box}`}
          >
            <style.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} />
            <p className="min-w-0 flex-1 whitespace-pre-line leading-5">{item.message}</p>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => dismissToast(item.id)}
              className="shrink-0 rounded-lg p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
