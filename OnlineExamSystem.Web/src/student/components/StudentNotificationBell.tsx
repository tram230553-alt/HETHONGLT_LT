import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { NotificationDto } from '../../services/notificationService';
import { useNotifications } from '../../services/notificationStore';

export default function StudentNotificationBell() {
  const [open, setOpen] = useState(false);
  const { items, loading, unreadCount: unread, markRead, markAll } = useNotifications();
  const readOne = async (item: NotificationDto) => { if (!item.isRead) { await markRead(item.id); } };
  const readAll = async () => { await markAll(); };

  return <div className="relative"><button id="btn-home-notifications" onClick={() => setOpen(!open)} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E9EDF7] bg-[var(--theme-surface-soft)] text-[var(--theme-text-light)]"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">{unread > 99 ? '99+' : unread}</span>}</button>
    {open && <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs shadow-xl"><div className="flex items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-3"><strong>Thông báo học tập</strong><button disabled={unread === 0} onClick={() => void readAll()} className="flex items-center gap-1 text-[10px] font-bold text-[var(--theme-primary)] disabled:opacity-40"><CheckCheck className="h-3 w-3" />Đọc tất cả</button></div><div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">{loading && <div className="p-6 text-center"><RefreshCw className="mx-auto h-4 w-4 animate-spin" /></div>}{!loading && items.map(item => <button key={item.id} onClick={() => void readOne(item)} className={`block w-full p-3 text-left ${item.isRead ? '' : 'bg-[#EBF2FF]/40'}`}><div className="flex justify-between gap-2"><strong className="text-[11px] text-[var(--theme-text)]">{item.title}</strong>{!item.isRead && <span className="mt-0.5 h-fit shrink-0 rounded bg-rose-500 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">Mới</span>}</div><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--theme-text-muted)]">{item.content}</p><time className="mt-1 block text-[8px] text-slate-400">{new Date(item.sentAt ?? item.createdAt).toLocaleString('vi-VN')}</time></button>)}{!loading && items.length === 0 && <div className="p-6 text-center text-slate-400">Chưa có thông báo.</div>}</div></div>}
  </div>;
}
