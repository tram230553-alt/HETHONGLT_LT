// Hộp thoại xác nhận hiển thị ngay trong giao diện (thay cho window.confirm của trình duyệt).
// Dùng: if (!(await confirmDialog("Xóa thông báo này?"))) return;
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  // "danger": nút xác nhận màu đỏ (xóa, đăng xuất...). "primary": màu chính.
  tone?: "danger" | "primary";
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number;
}

type Listener = (request: ConfirmRequest | null) => void;

interface QueueItem {
  request: ConfirmRequest;
  resolve: (confirmed: boolean) => void;
}

const queue: QueueItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  const current = queue[0]?.request ?? null;
  listeners.forEach((listener) => listener(current));
}

// Gọi bởi ConfirmHost khi người dùng bấm xác nhận / hủy.
export function resolveConfirm(id: number, confirmed: boolean) {
  const index = queue.findIndex((item) => item.request.id === id);
  if (index === -1) return;

  const [item] = queue.splice(index, 1);
  item.resolve(confirmed);
  emit();
}

export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const normalized: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;

  return new Promise<boolean>((resolve) => {
    queue.push({
      request: { id: nextId++, ...normalized },
      resolve,
    });
    emit();
  });
}

export function subscribeConfirm(listener: Listener) {
  listeners.add(listener);
  listener(queue[0]?.request ?? null);

  return () => {
    listeners.delete(listener);
  };
}
