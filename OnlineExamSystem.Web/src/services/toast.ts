// Thông báo nổi (toast) dùng chung toàn ứng dụng. Gọi từ bất kỳ đâu: toast.success("..."), toast.error("...").
export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(items));
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(type: ToastType, message: string, duration?: number) {
  if (!message) return;

  // Không hiện lặp cùng một nội dung đang được hiển thị.
  if (items.some((item) => item.type === type && item.message === message)) return;

  const id = nextId++;
  // Lỗi hiển thị lâu hơn để người dùng kịp đọc.
  const ms = duration ?? (type === "error" ? 7000 : 4500);

  items = [...items, { id, type, message, duration: ms }].slice(-4);
  emit();
  window.setTimeout(() => dismissToast(id), ms);
}

export const toast = {
  success: (message: string, duration?: number) => push("success", message, duration),
  error: (message: string, duration?: number) => push("error", message, duration),
  info: (message: string, duration?: number) => push("info", message, duration),
};

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}
