import { confirmDialog } from "../services/confirm";
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, Edit3, Plus, RefreshCw, Search, Send, Trash2, X } from 'lucide-react';
import { toast } from '../services/toast';
import { createNotification, deleteNotification, getNotifications, NotificationDto, NotificationPriority, NotificationStatus, NotificationTargetRole, SaveNotificationRequest, updateNotification } from '../services/notificationService';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

const emptyForm: SaveNotificationRequest = { title: '', content: '', targetRole: 'All', priority: 'Normal', status: 'Draft' };

export default function AdminSynchronizedNotificationsView() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [form, setForm] = useState<SaveNotificationRequest>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => { setLoading(true); setError(''); try { setItems(await getNotifications()); } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tải thông báo.'); } finally { setLoading(false); } };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void getNotifications().then(setItems).catch(() => undefined); }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => { const key = search.toLocaleLowerCase('vi'); return items.filter(x => `${x.title} ${x.content}`.toLocaleLowerCase('vi').includes(key)); }, [items, search]);
  const pagination = usePagination(filtered, 10, search);
  const startCreate = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };
  const startEdit = (item: NotificationDto) => { setEditingId(item.id); setForm({ title: item.title, content: item.content, targetRole: item.targetRole, priority: item.priority, status: item.status }); setOpen(true); };
  const save = async (status: NotificationStatus) => {
    if (!form.title.trim() || !form.content.trim()) { setError('Vui lòng nhập tiêu đề và nội dung.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, status };
      if (editingId) await updateNotification(editingId, payload); else await createNotification(payload);
      setOpen(false); await load();
      toast.success(status === 'Sent'
        ? `Đã gửi thông báo tới ${roleLabel(form.targetRole)}. Người nhận sẽ thấy dấu “chưa đọc” cho đến khi mở thông báo.`
        : 'Đã lưu bản nháp thông báo.');
    }
    catch (err) { const msg = err instanceof Error ? err.message : 'Không thể lưu thông báo.'; setError(msg); toast.error(msg); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => { if (!(await confirmDialog({ title: 'Xóa thông báo', message: 'Xóa thông báo này?', confirmText: 'Xóa', tone: 'danger' }))) return; try { await deleteNotification(id); setItems(old => old.filter(x => x.id !== id)); toast.success('Đã xóa thông báo.'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Không thể xóa thông báo.'); } };

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 md:flex-row md:items-center"><div><h1 className="flex items-center gap-2 text-xl font-black text-slate-800"><Bell className="h-5 w-5 text-indigo-500" />Thông báo hệ thống</h1><p className="mt-1 text-xs text-slate-500">Gửi thông báo đến Teacher, Student hoặc cả hai và theo dõi lượt đọc.</p></div><button onClick={startCreate} className="flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white"><Plus className="h-4 w-4" />Tạo thông báo</button></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Card label="Tổng thông báo" value={items.length} /><Card label="Đã gửi" value={items.filter(x => x.status === 'Sent').length} /><Card label="Bản nháp" value={items.filter(x => x.status === 'Draft').length} /><Card label="Tổng lượt đọc" value={items.reduce((sum, x) => sum + x.readCount, 0)} /></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white"><div className="flex items-center gap-3 border-b border-slate-100 p-4"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm thông báo..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none" /></div><button onClick={() => void load()} className="rounded-xl border border-slate-200 p-2 text-slate-500"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-210 text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Thông báo</th><th className="p-3 text-center">Đối tượng</th><th className="p-3 text-center">Ưu tiên</th><th className="p-3 text-center">Đã đọc</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{pagination.pageItems.map(item => <tr key={item.id} className="hover:bg-slate-50"><td className="max-w-lg p-3"><p className="font-black text-slate-800">{item.title}</p><p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{item.content}</p><time className="mt-1 block text-[9px] text-slate-400">{new Date(item.sentAt ?? item.createdAt).toLocaleString('vi-VN')}</time></td><td className="p-3 text-center font-bold">{roleLabel(item.targetRole)}</td><td className="p-3 text-center"><Priority value={item.priority} /></td><td className="p-3 text-center font-black text-indigo-600">{item.status === 'Sent' ? <><span>{item.readCount}/{item.recipientCount}</span>{item.recipientCount - item.readCount > 0 && <span className="mt-1 block text-[10px] font-bold text-rose-500">{item.recipientCount - item.readCount} chưa đọc</span>}</> : '—'}</td><td className="p-3 text-center"><span className={`rounded-lg px-2 py-1 text-[10px] font-black ${item.status === 'Sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status === 'Sent' ? 'Đã gửi' : 'Bản nháp'}</span></td><td className="p-3 text-right"><button onClick={() => startEdit(item)} className="mr-2 rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Edit3 className="h-4 w-4" /></button><button onClick={() => void remove(item.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></td></tr>)}{!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-400">Chưa có thông báo.</td></tr>}</tbody></table></div>
      <Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onPageChange={pagination.setPage} itemLabel="thông báo" className="border-t border-slate-100 px-4 pb-3" />
    </div>

    {open && <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-base font-black text-slate-800">{editingId ? 'Sửa thông báo' : 'Tạo thông báo mới'}</h2><button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><Field label="Tiêu đề"><input maxLength={250} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400" /></Field><Field label="Nội dung"><textarea maxLength={4000} rows={7} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Đối tượng nhận"><select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value as NotificationTargetRole })} className="w-full rounded-xl border border-slate-200 p-3 text-sm"><option value="All">Teacher và Student</option><option value="Teacher">Chỉ Teacher</option><option value="Student">Chỉ Student</option></select></Field><Field label="Mức ưu tiên"><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as NotificationPriority })} className="w-full rounded-xl border border-slate-200 p-3 text-sm"><option value="Normal">Thông thường</option><option value="Important">Quan trọng</option><option value="Urgent">Khẩn cấp</option></select></Field></div></div><div className="mt-6 flex justify-end gap-3"><button disabled={saving} onClick={() => void save('Draft')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Lưu bản nháp</button><button disabled={saving} onClick={() => void save('Sent')} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white"><Send className="h-4 w-4" />Gửi ngay</button></div></div></div>}
  </div>;
}

function Card({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-slate-800">{value}</p></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-600">{label}</span>{children}</label>; }
function roleLabel(role: NotificationTargetRole) { return role === 'All' ? 'Teacher + Student' : role; }
function Priority({ value }: { value: NotificationPriority }) { const css = value === 'Urgent' ? 'bg-rose-50 text-rose-700' : value === 'Important' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'; return <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${css}`}>{value === 'Urgent' ? 'Khẩn cấp' : value === 'Important' ? 'Quan trọng' : 'Thường'}</span>; }
