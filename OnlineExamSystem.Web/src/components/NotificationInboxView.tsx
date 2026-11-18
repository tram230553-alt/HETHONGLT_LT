import { AlertCircle, Bell, BellRing, CheckCheck, RefreshCw } from 'lucide-react';
import type { NotificationDto } from '../services/notificationService';
import { useNotifications } from '../services/notificationStore';
import { toast } from '../services/toast';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

export default function NotificationInboxView() {
  const { items, loading, loaded, error, unreadCount: unread, reload, markRead, markAll } = useNotifications();

  // Phân trang danh sách thông báo (đặt trước các return sớm bên dưới).
  const pagination = usePagination(items, 10);

  const markOne = async (item: NotificationDto) => {
    if (item.isRead) return;
    try { await markRead(item.id); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Không thể đánh dấu đã đọc.'); }
  };

  const readAll = async () => {
    try { await markAll(); toast.success('Đã đánh dấu tất cả thông báo là đã đọc.'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Không thể đánh dấu đã đọc.'); }
  };

  if (loading && !loaded) return <div className="flex min-h-72 items-center justify-center rounded-3xl bg-white"><RefreshCw className="mr-2 h-5 w-5 animate-spin text-indigo-500" />Đang tải thông báo...</div>;
  if (error && !loaded) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-bold text-rose-700"><AlertCircle className="mx-auto mb-2 h-7 w-7" />{error}<button onClick={() => void reload()} className="mx-auto mt-3 block rounded-lg bg-rose-600 px-3 py-2 text-white">Tải lại</button></div>;

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-6 sm:flex-row sm:items-center">
      <div>
        <h2 className="flex items-center gap-2 text-base font-black text-slate-800"><Bell className="h-5 w-5 text-indigo-500" />Thông báo</h2>
        <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
          {unread > 0
            ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-black text-white"><BellRing className="h-3 w-3" />{unread} chưa đọc</span>
            : <span>Bạn đã đọc tất cả thông báo</span>}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => void reload()} aria-label="Tải lại" className="rounded-xl border border-slate-200 p-2 text-slate-500"><RefreshCw className="h-4 w-4" /></button>
        <button disabled={unread === 0} onClick={() => void readAll()} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-40"><CheckCheck className="h-4 w-4" />Đọc tất cả</button>
      </div>
    </div>

    <div className="space-y-3">
      {pagination.pageItems.map(item => <button key={item.id} onClick={() => void markOne(item)} className={`relative w-full rounded-2xl border p-5 pl-6 text-left transition ${item.isRead ? 'border-slate-100 bg-white' : 'border-indigo-300 bg-indigo-50/70 shadow-sm'}`}>
        {!item.isRead && <span className="absolute bottom-3 left-0 top-3 w-1.5 rounded-r-full bg-indigo-500" />}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {!item.isRead && <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[9px] font-black uppercase text-white">Mới</span>}
              <h3 className={`text-sm text-slate-800 ${item.isRead ? 'font-bold' : 'font-black'}`}>{item.title}</h3>
              <Priority value={item.priority} />
            </div>
            <p className="mt-2 whitespace-pre-line text-xs leading-6 text-slate-600">{item.content}</p>
          </div>
          <time className="shrink-0 text-[10px] text-slate-400">{new Date(item.sentAt ?? item.createdAt).toLocaleString('vi-VN')}</time>
        </div>
      </button>)}
      {items.length === 0 && <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">Chưa có thông báo nào được gửi đến bạn.</div>}
      <Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onPageChange={pagination.setPage} itemLabel="thông báo" />
    </div>
  </div>;
}

function Priority({ value }: { value: NotificationDto['priority'] }) {
  const css = value === 'Urgent' ? 'bg-rose-100 text-rose-700' : value === 'Important' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
  return <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${css}`}>{value === 'Urgent' ? 'Khẩn cấp' : value === 'Important' ? 'Quan trọng' : 'Thông thường'}</span>;
}
