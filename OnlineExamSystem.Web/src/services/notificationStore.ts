import React from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "./notificationService";
import { toast } from "./toast";

// Kho thông báo dùng chung: thanh bên, chuông, hộp thư cùng một nguồn nên số "chưa đọc" luôn khớp.
const POLL_MS = 30000;

interface State {
  items: NotificationDto[];
  loading: boolean;
  loaded: boolean;
  error: string;
}

let state: State = { items: [], loading: false, loaded: false, error: "" };
let knownIds = new Set<string>();
let timer: number | undefined;
let subscribers = 0;
const listeners = new Set<() => void>();

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export async function refreshNotifications(silent = false) {
  if (!silent && !state.loaded) setState({ loading: true });

  try {
    const items = await getNotifications();

    // Thông báo mới chưa đọc xuất hiện sau lần tải đầu: báo ngay cho người dùng.
    if (state.loaded) {
      const fresh = items.filter((item) => !item.isRead && !knownIds.has(item.id));

      if (fresh.length === 1) {
        toast.info(`Thông báo mới: ${fresh[0].title}`, 8000);
      } else if (fresh.length > 1) {
        toast.info(`Bạn có ${fresh.length} thông báo mới chưa đọc.`, 8000);
      }
    }

    knownIds = new Set(items.map((item) => item.id));
    setState({ items, loading: false, loaded: true, error: "" });
  } catch (err) {
    setState({
      loading: false,
      error: err instanceof Error ? err.message : "Không thể tải thông báo.",
    });
  }
}

export async function markNotificationAsRead(id: string) {
  const target = state.items.find((item) => item.id === id);
  if (!target || target.isRead) return;

  await markNotificationRead(id);

  setState({
    items: state.items.map((item) =>
      item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item,
    ),
  });
}

export async function markAllAsRead() {
  await markAllNotificationsRead();

  const now = new Date().toISOString();
  setState({
    items: state.items.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? now })),
  });
}

function start() {
  void refreshNotifications();
  timer = window.setInterval(() => void refreshNotifications(true), POLL_MS);
  window.addEventListener("focus", onFocus);
}

function stop() {
  if (timer) window.clearInterval(timer);
  timer = undefined;
  window.removeEventListener("focus", onFocus);
  // Đăng xuất / đổi tài khoản: không giữ thông báo của người trước.
  knownIds = new Set();
  state = { items: [], loading: false, loaded: false, error: "" };
}

function onFocus() {
  void refreshNotifications(true);
}

export function useNotifications() {
  const [, setTick] = React.useState(0);
  const force = React.useCallback(() => setTick((n) => n + 1), []);

  React.useEffect(() => {
    listeners.add(force);
    subscribers += 1;
    if (subscribers === 1) start();

    return () => {
      listeners.delete(force);
      subscribers -= 1;
      if (subscribers === 0) stop();
    };
  }, [force]);

  return {
    ...state,
    unreadCount: state.items.filter((item) => !item.isRead).length,
    reload: () => refreshNotifications(),
    markRead: markNotificationAsRead,
    markAll: markAllAsRead,
  };
}
