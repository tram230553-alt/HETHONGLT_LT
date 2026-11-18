import { toast } from "../services/toast";
import { confirmDialog } from "../services/confirm";
import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  AlertTriangle, 
  FileText, 
  Check, 
  FileSpreadsheet, 
  Users, 
  AlertCircle,
  X,
  Calendar,
  Layers,
  ArrowRight,
  Send,
  Save,
  Bold,
  Italic,
  List,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemNotification, Teacher, Subject, NotificationAttachment, ReadReceipt } from '../types';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

interface AdminNotificationViewProps {
  notifications: SystemNotification[];
  onNotificationsChange: (notifs: SystemNotification[]) => void;
  teachers: Teacher[];
  subjects: Subject[];
}

export default function AdminNotificationView({
  notifications,
  onNotificationsChange,
  teachers,
  subjects
}: AdminNotificationViewProps) {
  // UI views / modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState<SystemNotification | null>(null);
  const [viewingNotif, setViewingNotif] = useState<SystemNotification | null>(null);
  const [trackingNotif, setTrackingNotif] = useState<SystemNotification | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'draft'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'normal' | 'important' | 'urgent'>('all');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'subject' | 'group' | 'specific'>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('tu_nhien'); // tu_nhien | xa_hoi | ban_giam_hieu
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [formPriority, setFormPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [formAttachments, setFormAttachments] = useState<NotificationAttachment[]>([]);

  // Simulation support
  const [mockFiles, setMockFiles] = useState<{name: string, size: string, type: string}[]>([
    { name: 'ma_tran_de_thi_2026_chinh_thuc.pdf', size: '1.8 MB', type: 'pdf' },
    { name: 'quy_che_thi_tot_nghiep_moi_nhat.pdf', size: '3.2 MB', type: 'pdf' },
    { name: 'bieu_mau_bao_cao_giao_vien.xlsx', size: '210 KB', type: 'xlsx' },
    { name: 'tieng_anh_12_chuyen_de_on_tap.docx', size: '890 KB', type: 'docx' },
    { name: 'ke_hoach_hoc_tap_toan_khoi_12.pdf', size: '1.4 MB', type: 'pdf' }
  ]);

  // Compute stats
  const stats = useMemo(() => {
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'sent').length;
    
    // Find unique teachers who have read at least one notification
    const readReceiptsList = notifications
      .filter(n => n.status === 'sent')
      .flatMap(n => n.readReceipts);
    
    const readCount = readReceiptsList.filter(r => r.read).length;
    const totalReceipts = readReceiptsList.length;
    const unreadCount = totalReceipts - readCount;

    return {
      total,
      sent,
      readReceiptsCount: readCount,
      unreadReceiptsCount: unreadCount,
      totalReceipts
    };
  }, [notifications]);

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || n.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [notifications, searchTerm, statusFilter, priorityFilter]);

  // Phân trang danh sách thông báo (về trang 1 khi đổi từ khóa/bộ lọc).
  const notificationPagination = usePagination(
    filteredNotifications,
    10,
    `${searchTerm}|${statusFilter}|${priorityFilter}`,
  );

  // Groups definitions
  const TEACHER_GROUPS = [
    { id: 'tu_nhien', name: 'Tổ Tự Nhiên (Toán, Lý, Hóa, Sinh)' },
    { id: 'xa_hoi', name: 'Tổ Xã Hội (Văn, Sử, Địa, Anh)' },
    { id: 'academic_board', name: 'Hội Đồng Khảo Thí & Học Thuật' }
  ];

  // Helper to open creation screen
  const handleOpenCreate = () => {
    setEditingNotif(null);
    setFormTitle('');
    setFormContent('');
    setRecipientType('all');
    setSelectedSubjectId(subjects[0]?.id || '');
    setSelectedGroupId('tu_nhien');
    setSelectedTeacherIds([]);
    setFormPriority('normal');
    setFormAttachments([]);
    setIsFormOpen(true);
  };

  // Helper to open edit screen
  const handleOpenEdit = (notif: SystemNotification) => {
    setEditingNotif(notif);
    setFormTitle(notif.title);
    setFormContent(notif.content);
    setRecipientType(notif.recipientType);
    if (notif.recipientType === 'subject') {
      setSelectedSubjectId(notif.recipientValue || '');
    } else if (notif.recipientType === 'group') {
      setSelectedGroupId(notif.recipientValue || 'tu_nhien');
    } else if (notif.recipientType === 'specific') {
      setSelectedTeacherIds(notif.recipientValue ? notif.recipientValue.split(',') : []);
    }
    setFormPriority(notif.priority);
    setFormAttachments(notif.attachments);
    setIsFormOpen(true);
  };

  // Rich-text editor mockup functions
  const insertMockTag = (tag: string) => {
    const textarea = document.getElementById('notif-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    if (tag === 'bold') replacement = `<strong>${selected || 'Văn bản đậm'}</strong>`;
    if (tag === 'italic') replacement = `<em>${selected || 'Văn bản nghiêng'}</em>`;
    if (tag === 'list') replacement = `\n<ul>\n  <li>${selected || 'Dòng 1'}</li>\n  <li>Dòng 2</li>\n</ul>\n`;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setFormContent(newContent);
    
    // Reset focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 3, start + 3 + replacement.length);
    }, 50);
  };

  const handleSimulatedFileUpload = () => {
    // Choose one file randomly for simulation
    const randFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    if (formAttachments.some(a => a.name === randFile.name)) {
      toast.error('Tài liệu đính kèm này đã được tải lên trước đó.');
      return;
    }
    const newAttachments: NotificationAttachment = {
      name: randFile.name,
      size: randFile.size,
      type: randFile.type
    };
    setFormAttachments([...formAttachments, newAttachments]);
  };

  const handleRemoveAttachment = (name: string) => {
    setFormAttachments(formAttachments.filter(a => a.name !== name));
  };

  // Delete notification
  const handleDeleteNotif = async (id: string) => {
    if (await confirmDialog({
      title: 'Xóa thông báo',
      message: 'Bạn có chắc chắn muốn xóa thông báo này? Dữ liệu thống kê lượt đọc liên quan cũng sẽ không thể khôi phục.',
      confirmText: 'Xóa',
      tone: 'danger',
    })) {
      const updated = notifications.filter(n => n.id !== id);
      onNotificationsChange(updated);
      if (viewingNotif?.id === id) setViewingNotif(null);
      if (trackingNotif?.id === id) setTrackingNotif(null);
    }
  };

  // Submit / save notification (Draft or Immediate Sent)
  const handleSubmitForm = (status: 'draft' | 'sent') => {
    if (!formTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    if (!formContent.trim()) {
      toast.error('Vui lòng nhập nội dung chi tiết thông báo.');
      return;
    }

    // Determine targeted teachers list and recipientLabel
    let targetTeachers: Teacher[] = [];
    let recipientLabel = 'Toàn bộ giáo viên';
    let recipientValue = '';

    if (recipientType === 'all') {
      targetTeachers = teachers;
      recipientLabel = 'Toàn bộ giáo viên';
    } else if (recipientType === 'subject') {
      const targetSub = subjects.find(s => s.id === selectedSubjectId);
      targetTeachers = teachers.filter(t => t.subjectId === selectedSubjectId);
      recipientLabel = `Giáo viên bộ môn ${targetSub ? targetSub.name : 'Chuyên đề'}`;
      recipientValue = selectedSubjectId;
    } else if (recipientType === 'group') {
      const groupObj = TEACHER_GROUPS.find(g => g.id === selectedGroupId);
      recipientLabel = groupObj ? groupObj.name : 'Nhóm giáo viên đặc thù';
      recipientValue = selectedGroupId;
      
      // Categorize teacher groups
      if (selectedGroupId === 'tu_nhien') {
        // Math, Phys, Chem, Biol
        targetTeachers = teachers.filter(t => ['sub-1', 'sub-3', 'sub-4', 'sub-5'].includes(t.subjectId));
      } else if (selectedGroupId === 'xa_hoi') {
        // English, Lit
        targetTeachers = teachers.filter(t => ['sub-2', 'sub-6'].includes(t.subjectId));
      } else {
        // default all
        targetTeachers = teachers;
      }
    } else if (recipientType === 'specific') {
      targetTeachers = teachers.filter(t => selectedTeacherIds.includes(t.id));
      recipientLabel = targetTeachers.map(t => t.name).join(', ');
      recipientValue = selectedTeacherIds.join(',');
      if (targetTeachers.length === 0) {
        toast.error('Vui lòng chọn ít nhất một giáo viên cụ thể để gửi tin.');
        return;
      }
    }

    // Prepare read receipts list
    const readReceipts: ReadReceipt[] = targetTeachers.map(t => {
      // If editing an existing notification that was already sent, preserve existing read state
      if (editingNotif && editingNotif.status === 'sent') {
        const existingReceipt = editingNotif.readReceipts.find(r => r.teacherId === t.id);
        if (existingReceipt) return existingReceipt;
      }
      return {
        teacherId: t.id,
        teacherName: t.name,
        read: false
      };
    });

    const nowStr = new Date().toISOString();

    const notifEntity: SystemNotification = {
      id: editingNotif ? editingNotif.id : `notif-${Date.now()}`,
      title: formTitle,
      content: formContent,
      senderId: 'admin-1',
      senderName: 'Ban Quản Trị Hệ Thống',
      recipientType,
      recipientValue,
      recipientLabel,
      priority: formPriority,
      status: status,
      createdAt: editingNotif ? editingNotif.createdAt : nowStr,
      sentAt: status === 'sent' ? nowStr : (editingNotif ? editingNotif.sentAt : undefined),
      attachments: formAttachments,
      readReceipts: readReceipts
    };

    let updatedList: SystemNotification[] = [];
    if (editingNotif) {
      updatedList = notifications.map(n => n.id === editingNotif.id ? notifEntity : n);
    } else {
      updatedList = [notifEntity, ...notifications];
    }

    onNotificationsChange(updatedList);
    localStorage.setItem('smartexam_system_notifications', JSON.stringify(updatedList));
    
    // Save confirmation
    setIsFormOpen(false);
    setEditingNotif(null);
  };

  // Specific functions to change priority classes background
  const getPriorityClasses = (p: 'normal' | 'important' | 'urgent') => {
    switch (p) {
      case 'urgent':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'important':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getPriorityName = (p: 'normal' | 'important' | 'urgent') => {
    switch (p) {
      case 'urgent': return 'Khẩn cấp';
      case 'important': return 'Quan trọng';
      default: return 'Thông thường';
    }
  };

  return (
    <div className="space-y-6" id="notification-admin-stage">
      
      {/* Header section with Material design flair */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs">

  <div>
    <div className="flex items-center gap-2 mb-1.5">
      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
        Hệ thống
      </span>

      <span className="text-slate-300">•</span>

      <span className="text-xs text-emerald-600 font-bold">
        Live
      </span>
    </div>

    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
      🔔 Thông báo hệ thống
    </h1>

    <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
      Thiết kế và quản lý các thông báo học tập, sự kiện, cập nhật quy chế
      và các thông tin quan trọng gửi đến giáo viên trong hệ thống.
    </p>
  </div>

  <button
    onClick={handleOpenCreate}
    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all self-start md:self-center shrink-0 cursor-pointer text-sm"
  >
    <Plus className="w-4 h-4" />
    <span>Tạo thông báo</span>
  </button>

</div>

      {/* Modern SaaS Grid Statistics Cards (Pastel Purple Palette Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

  {/* Tổng thông báo */}
  <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 shrink-0 font-bold">
      📢
    </div>
    <div>
      <span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase block">
        Tổng thông báo
      </span>
      <h4 className="text-2xl font-black text-blue-800">
        {stats.total} tin
      </h4>
    </div>
  </div>

  {/* Đã gửi */}
  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shrink-0 font-bold">
      📨
    </div>
    <div>
      <span className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase block">
        Đã gửi thành công
      </span>
      <h4 className="text-2xl font-black text-emerald-800">
        {stats.sent} đã phát
      </h4>
    </div>
  </div>

  {/* Đã đọc */}
  <div className="bg-violet-50 border border-violet-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
    <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-700 shrink-0 font-bold">
      👨‍🏫
    </div>
    <div>
      <span className="text-[10px] text-violet-600 font-bold tracking-wider uppercase block">
        Giáo viên đã đọc
      </span>
      <h4 className="text-2xl font-black text-violet-800">
        {stats.readReceiptsCount} lượt
      </h4>
    </div>
  </div>

  {/* Chưa đọc */}
  <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shrink-0 font-bold">
      ⏳
    </div>
    <div>
      <span className="text-[10px] text-amber-600 font-bold tracking-wider uppercase block">
        Lượt chưa đọc
      </span>
      <h4 className="text-2xl font-black text-amber-800">
        {stats.unreadReceiptsCount} lượt
      </h4>
    </div>
  </div>

</div>

      {/* Filtering and list section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-6">
        
        {/* Controls, Search and Categorization Filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tiêu đề, nội dung thư tín hoặc người nhận..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#ECE6F0] rounded-2xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#6750A4]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status categorization select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-[#ECE6F0] rounded-xl px-3 py-2 text-xs text-slate-700 font-extrabold focus:outline-hidden focus:ring-1 focus:ring-[#6750A4]"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="sent">Đã gửi tin</option>
              <option value="draft">Bản nháp</option>
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-slate-50 border border-[#ECE6F0] rounded-xl px-3 py-2 text-xs text-slate-700 font-extrabold focus:outline-hidden focus:ring-1 focus:ring-[#6750A4]"
            >
              <option value="all">Mọi mức độ ưu tiên</option>
              <option value="normal">🟢 Thông thường</option>
              <option value="important">🟡 Quan trọng</option>
              <option value="urgent">🔴 Khẩn cấp</option>
            </select>
          </div>
        </div>

        {/* Notifications list Table design */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-4">Mức độ</th>
                <th className="px-5 py-4">Tiêu đề thông báo</th>
                <th className="px-5 py-4">Người nhận</th>
                <th className="px-5 py-4">Ngày gửi / cập nhật</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Đã đọc (Tỷ lệ)</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-400 italic font-medium bg-slate-50/30">
                    Không tìm thấy thông báo nào phù hợp với bộ lọc tìm kiếm của bạn. Hãy click "Tạo thông báo" để bắt đầu!
                  </td>
                </tr>
              ) : (
                notificationPagination.pageItems.map((noti) => {
                  const readCount = noti.readReceipts.filter(r => r.read).length;
                  const totalRecipient = noti.readReceipts.length;
                  const readPercent = totalRecipient > 0 ? Math.round((readCount / totalRecipient) * 100) : 0;

                  return (
                    <tr 
                      key={noti.id} 
                      className={`hover:bg-slate-50/55 transition-colors cursor-default ${noti.status === 'draft' ? 'opacity-85' : ''}`}
                    >
                      {/* Priority Dot */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase border ${getPriorityClasses(noti.priority)}`}>
                          {getPriorityName(noti.priority)}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-5 py-4 max-w-xs md:max-w-md">
                        <div className="space-y-0.5">
                          <h3 className="font-extrabold text-slate-800 leading-tight block hover:text-[#6750A4] cursor-pointer" onClick={() => setViewingNotif(noti)}>
                            {noti.title}
                          </h3>
                          <p className="text-[10px] text-slate-455 line-clamp-1 italic" dangerouslySetInnerHTML={{ __html: noti.content.replace(/<[^>]*>/g, '') }}></p>
                        </div>
                      </td>

                      {/* Recipients */}
                      <td className="px-5 py-4 font-bold text-slate-600 block max-w-xs truncate">
                        {noti.recipientLabel}
                      </td>

                      {/* Sent Time */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-[10px] text-slate-500">
                        {noti.status === 'sent' && noti.sentAt ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-700 block">{new Date(noti.sentAt).toLocaleDateString('vi-VN')}</span>
                            <span className="text-slate-400">{new Date(noti.sentAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Nháp (cập nhật {new Date(noti.createdAt).toLocaleDateString('vi-VN')})</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-4">
                        {noti.status === 'sent' ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]">
  Đã gửi
</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-505 font-bold text-[10px]">Nháp</span>
                        )}
                      </td>

                      {/* Read rate progress */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {noti.status === 'sent' ? (
                          <div className="space-y-1.5 w-24">
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                              <span>{readCount}/{totalRecipient} đọc</span>
                              <span className={readPercent === 100 ? 'text-emerald-600' : 'text-indigo-600'}>{readPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${readPercent === 100 ? 'bg-emerald-500' : 'bg-[#6750A4]'}`} 
                                style={{ width: `${readPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View details */}
                          <button
                            onClick={() => setViewingNotif(noti)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit details */}
                          <button
                            onClick={() => handleOpenEdit(noti)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete details */}
                          <button
                            onClick={() => handleDeleteNotif(noti.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Show Read Tracking stats for sent ones */}
                          {noti.status === 'sent' && (
                            <button
                              onClick={() => setTrackingNotif(noti)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer font-bold text-[10.5px] px-2"
                              title="Báo cáo người đọc"
                            >
                              📊 Thống kê
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={notificationPagination.page}
          pageSize={notificationPagination.pageSize}
          total={notificationPagination.total}
          onPageChange={notificationPagination.setPage}
          itemLabel="thông báo"
          className="border-t border-slate-100 px-5 pb-3"
        />

      </div>

      {/* ==============================================
          DRAWER / FORM CREATION MODAL
          ============================================== */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-white w-full max-w-2xl h-screen shadow-2xl flex flex-col focus:outline-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8DEF8] flex items-center justify-center text-[#21005D]">
                    <Bell className="w-5 h-5 text-[#21005D]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#21005D]">
                      {editingNotif ? 'Chỉnh sửa Thông báo' : 'Soạn thảo Thông báo Mới'}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-semibold">Tự động cấu hình ma trận nhận tin cho Giáo Viên</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-slate-50 text-[#21005D] rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">Tiêu đề thông báo *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Nhập tiêu đề cô đọng, rõ ý..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-[#6750A4] focus:outline-hidden"
                  />
                </div>

                {/* Rich text mock block inside form */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">Nội dung chi tiết thông báo *</label>
                  
                  {/* Text editor toolbar */}
                  <div className="bg-slate-100 border border-slate-200 border-b-0 rounded-t-xl px-2.5 py-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertMockTag('bold')}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                      title="Chữ Đậm (HTML Source)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMockTag('italic')}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 italic"
                      title="Chữ Nghiêng (HTML Source)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMockTag('list')}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700"
                      title="Danh sách có chấm (HTML Source)"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-slate-250 mx-1.5"></div>
                    <span className="text-[10px] text-slate-455 font-semibold italic">Mẹo: Quét chọn bôi đen từ khóa rồi ấn để đóng thẻ</span>
                  </div>

                  <textarea
                    id="notif-content-textarea"
                    rows={7}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Soạn nội dung chỉ thị... Bạn có thể nhập mã HTML hoặc văn bản thường."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-b-xl text-xs font-mono focus:ring-1 focus:ring-[#6750A4] focus:outline-hidden"
                  />

                  {/* HTML live preview box inside form */}
                  {formContent && (
                    <div className="border border-purple-100 bg-purple-50/20 p-3 rounded-lg">
                      <span className="text-[9px] font-black text-[#6750A4] uppercase tracking-wider block mb-1">Live HTML Preview:</span>
                      <div className="text-xs text-slate-655 space-y-1.5 px-1 py-1 font-sans" dangerouslySetInnerHTML={{ __html: formContent }}></div>
                    </div>
                  )}
                </div>

                {/* Recipient Selection block */}
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">Đối tượng nhận thông báo (Recipient Selection)</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* All Teachers */}
                    <div 
                      onClick={() => setRecipientType('all')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col gap-1.5 transition-all ${
                        recipientType === 'all' 
                          ? 'border-[#6750A4] bg-purple-50/25' 
                          : 'border-slate-105 bg-slate-50/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={recipientType === 'all'}
                          onChange={() => {}}
                          className="text-[#6750A4] focus:ring-[#6750A4]"
                        />
                        <span className="text-xs font-extrabold text-slate-700">Tất cả giáo viên</span>
                      </div>
                      <p className="text-[10px] text-slate-455">Toàn bộ cán bộ giáo viên trên hệ thống</p>
                    </div>

                    {/* By Subject */}
                    <div 
                      onClick={() => setRecipientType('subject')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col gap-1.5 transition-all ${
                        recipientType === 'subject' 
                          ? 'border-[#6750A4] bg-purple-50/25' 
                          : 'border-slate-105 bg-slate-50/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={recipientType === 'subject'}
                          onChange={() => {}}
                          className="text-[#6750A4] focus:ring-[#6750A4]"
                        />
                        <span className="text-xs font-extrabold text-slate-700">Theo môn học</span>
                      </div>
                      <p className="text-[10px] text-slate-455">Gửi riêng đến những giáo viên dạy một bộ môn</p>
                    </div>

                    {/* By Team / group */}
                    <div 
                      onClick={() => setRecipientType('group')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col gap-1.5 transition-all ${
                        recipientType === 'group' 
                          ? 'border-[#6750A4] bg-purple-50/25' 
                          : 'border-slate-105 bg-slate-50/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={recipientType === 'group'}
                          onChange={() => {}}
                          className="text-[#6750A4] focus:ring-[#6750A4]"
                        />
                        <span className="text-xs font-extrabold text-slate-700">Theo nhóm giáo viên</span>
                      </div>
                      <p className="text-[10px] text-slate-455">Phân chia theo tổ chuyên môn, ban học thuật</p>
                    </div>

                    {/* Specific list */}
                    <div 
                      onClick={() => setRecipientType('specific')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col gap-1.5 transition-all ${
                        recipientType === 'specific' 
                          ? 'border-[#6750A4] bg-purple-50/25' 
                          : 'border-slate-105 bg-slate-50/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={recipientType === 'specific'}
                          onChange={() => {}}
                          className="text-[#6750A4] focus:ring-[#6750A4]"
                        />
                        <span className="text-xs font-extrabold text-slate-700">Giáo viên cụ thể</span>
                      </div>
                      <p className="text-[10px] text-slate-455">Chỉ định đích danh một vài cá nhân giáo viên</p>
                    </div>

                  </div>

                  {/* Sub Form based on Selection */}
                  {recipientType === 'subject' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 bg-slate-50 rounded-xl space-y-1.5"
                    >
                      <span className="text-[10px] font-black text-indigo-700 uppercase">Chọn bộ môn giảng dạy:</span>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-extrabold focus:outline-hidden"
                      >
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {recipientType === 'group' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 bg-slate-50 rounded-xl space-y-1.5"
                    >
                      <span className="text-[10px] font-black text-indigo-700 uppercase">Chọn tổ công tác giáo viên:</span>
                      <div className="space-y-1.5">
                        {TEACHER_GROUPS.map(grp => (
                          <label key={grp.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="teacher-group-select"
                              checked={selectedGroupId === grp.id}
                              onChange={() => setSelectedGroupId(grp.id)}
                              className="text-[#6750A4] focus:ring-[#6750A4]"
                            />
                            <span>{grp.name}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {recipientType === 'specific' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 bg-slate-50 rounded-xl space-y-2"
                    >
                      <span className="text-[10px] font-black text-indigo-700 uppercase block">Đánh dấu những giáo viên nhận tin:</span>
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                        {teachers.map(tch => {
                          const isChecked = selectedTeacherIds.includes(tch.id);
                          return (
                            <label 
                              key={tch.id} 
                              className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                isChecked ? 'bg-indigo-50 border-indigo-200 font-bold text-indigo-700' : 'bg-white border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedTeacherIds(selectedTeacherIds.filter(id => id !== tch.id));
                                  } else {
                                    setSelectedTeacherIds([...selectedTeacherIds, tch.id]);
                                  }
                                }}
                                className="rounded text-[#6750A4] focus:ring-[#6750A4] text-[10px]"
                              />
                              <div className="truncate">
                                <span className="block truncate">{tch.name}</span>
                                <span className="text-[8.5px] text-slate-400 block truncate leading-none">{tch.subjectName}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide block">Mức độ cảnh báo (Priority Class)</span>
                  <div className="grid grid-cols-3 gap-3">
                    
                    {/* Normal */}
                    <button
                      type="button"
                      onClick={() => setFormPriority('normal')}
                      className={`py-2 pt-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        formPriority === 'normal' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-100' 
                          : 'bg-white border-slate-105 text-slate-605 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>🟢 Thông thường</span>
                    </button>

                    {/* Important */}
                    <button
                      type="button"
                      onClick={() => setFormPriority('important')}
                      className={`py-2 pt-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        formPriority === 'important' 
                          ? 'bg-amber-50 text-amber-800 border-amber-400 ring-2 ring-amber-100' 
                          : 'bg-white border-slate-105 text-slate-605 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>🟡 Quan trọng</span>
                    </button>

                    {/* Urgent */}
                    <button
                      type="button"
                      onClick={() => setFormPriority('urgent')}
                      className={`py-2 pt-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        formPriority === 'urgent' 
                          ? 'bg-red-50 text-red-800 border-red-400 ring-2 ring-red-100' 
                          : 'bg-white border-slate-105 text-slate-605 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span>🔴 Khẩn cấp</span>
                    </button>

                  </div>
                </div>

                {/* Attachments Section */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-[#ECE6F0]  bg-slate-50space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#21005D]">Tài liệu & Học liệu đính kèm</h4>
                      <p className="text-[10px] text-slate-455">Đính kèm giáo trình PDF, DOCX, bám sát đề cương ôn tập</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulatedFileUpload}
                      className="py-1.5 px-3 bg-[#E8DEF8] hover:bg-[#DED2F3] text-[#21005D] text-[10.5px] font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Nhập tệp đính kèm
                    </button>
                  </div>

                  {formAttachments.length === 0 ? (
                    <div className="text-center p-3 text-[11px] text-slate-400 italic">
                      Chưa có học liệu đính kèm nào được tải lên. Click nút bên phải để mô phỏng tải nhanh một tệp văn bản.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formAttachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E1DBE5] text-xs">
                          <div className="flex items-center gap-2 truncate pr-1">
                            <span className="text-sm select-none">
                              {file.type === 'pdf' ? '📕' : file.type === 'xlsx' ? '📗' : '📘'}
                            </span>
                            <div className="truncate min-w-0">
                              <span className="block font-semibold text-slate-700 truncate leading-none mb-0.5">{file.name}</span>
                              <span className="text-[8.5px] font-mono text-slate-400 block leading-none">{file.size}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.name)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-md cursor-pointer shrink-0"
                            title="Xóa tài liệu đính kèm"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-[#E1DBE5]bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer transition-all"
                >
                  Hủy bỏ
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubmitForm('draft')}
                    className="px-5 py-2.5 rounded-full border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lưu nháp
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmitForm('sent')}
                    className="px-6 py-2.5 rounded-full bg-[#6750A4] hover:bg-[#5C4594] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all border border-purple-300"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    Gửi thông báo ngay
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
          MODAL: SHOW READ TRACKING DETAILS (Thống kê đọc)
          ============================================== */}
      <AnimatePresence>
        {trackingNotif && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative border-2 border-purple-100 focus:outline-hidden"
            >
              <button 
                onClick={() => setTrackingNotif(null)}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="p-1 px-2 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border-2 border-emerald-200">
                  Real-time receipts
                </span>
                <span className="text-xs text-slate-400 font-medium">•</span>
                <span className="text-xs text-slate-400 font-bold uppercase">{trackingNotif.recipientLabel}</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-800 leading-tight">
                  Báo cáo độc giả: "{trackingNotif.title}"
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  Dưới đây là chi tiết phân khúc xem tin của các giáo viên nằm trong diện tiếp cận. Dữ liệu thay đổi thời gian thực khi giáo viên bấm đọc.
                </p>
              </div>

              {/* Stats overview breakdown */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/20 rounded-2xl border border-purple-100">
                <div className="text-center py-2.5">
                  <span className="text-[10px] text-slate-455 block font-bold uppercase leading-none mb-1">Đã xem tin</span>
                  <p className="text-xl font-black text-emerald-600">
                    {trackingNotif.readReceipts.filter(r => r.read).length} / {trackingNotif.readReceipts.length} GV
                  </p>
                </div>
                <div className="text-center py-2.5 border-l border-slate-100">
                  <span className="text-[10px] text-slate-455 block font-bold uppercase leading-none mb-1">Tỷ lệ xem</span>
                  <p className="text-xl font-black text-indigo-700">
                    {trackingNotif.readReceipts.length > 0 
                      ? Math.round((trackingNotif.readReceipts.filter(r => r.read).length / trackingNotif.readReceipts.length) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Receipt checklist group */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Trạng thái đọc cụ thể</span>
                {trackingNotif.readReceipts.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center italic py-4">Có lỗi xảy ra, không tìm thấy đối tượng nào.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {trackingNotif.readReceipts.map((rc, index) => {
                      // Lookup teacher subject
                      const matchedTeacher = teachers.find(t => t.id === rc.teacherId);
                      return (
                        <div key={index} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 mini-label pr-2 truncate">
                            <div className="w-7 h-7 rounded-full bg-slate-100 font-black text-[10px] text-slate-550 flex items-center justify-center shrink-0">
                              {rc.teacherName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-slate-700 block truncate leading-none mb-0.5">{rc.teacherName}</span>
                              <span className="text-[8.5px] text-slate-400 block truncate leading-none">
                                {matchedTeacher ? matchedTeacher.subjectName : 'Giáo viên bộ môn'}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
                            {rc.read ? (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-extrabold text-[10px] uppercase bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                                  ✔ Đã đọc
                                </span>
                                <span className="block text-[8px] text-slate-400 font-mono select-none">
                                  {rc.readAt ? rc.readAt.substring(5, 16) : 'Vừa xong'}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-slate-400 font-bold text-[10px] uppercase bg-slate-105 px-1.5 py-0.5 rounded-sm">
                                ❌ Chưa đọc
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTrackingNotif(null)}
                  className="px-5 py-2.5 rounded-full bg-[#E5E1E6] hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Đóng thống kê
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
          MODAL: VIEW FULL ANNOUNCEMENT PREVIEW
          ============================================== */}
      <AnimatePresence>
        {viewingNotif && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative border-2 border-purple-150 focus:outline-hidden"
            >
              <button 
                onClick={() => setViewingNotif(null)}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getPriorityClasses(viewingNotif.priority)}`}>
                  {getPriorityName(viewingNotif.priority)} {viewingNotif.priority === 'urgent' && '🔕 khẩn'}
                </span>
                <span className="text-xs text-slate-401 font-medium">•</span>
                <span className="text-[10px] font-black text-indigo-750 font-mono bg-indigo-50 px-2 py-0.5 rounded-sm">
                  Trạng thái: {viewingNotif.status === 'sent' ? 'Phát hành chính thức' : 'Bản nháp lưu trữ'}
                </span>
              </div>

              <h2 className="text-lg font-black text-slate-900 leading-snug">
                {viewingNotif.title}
              </h2>

              <div className="flex items-center gap-2.5 text-xs text-slate-500 py-1.5 border-y border-dashed border-slate-100">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 select-none shrink-0">
                  AD
                </div>
                <div>
                  <span className="font-extrabold text-slate-700 leading-none block mb-0.5">{viewingNotif.senderName}</span>
                  <span className="text-[9.5px] font-semibold text-slate-400 block leading-none">
                    Gửi tới {viewingNotif.recipientLabel} • {viewingNotif.sentAt ? new Date(viewingNotif.sentAt).toLocaleString('vi-VN') : 'Dự thảo'}
                  </span>
                </div>
              </div>

              {/* Rich contents */}
              <div 
                className="text-xs text-slate-600 space-y-2.5 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-purple-50 max-h-[220px] overflow-y-auto" 
                dangerouslySetInnerHTML={{ __html: viewingNotif.content }}
              />

              {/* Attachments preview */}
              {viewingNotif.attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Học liệu đính kèm ({viewingNotif.attachments.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingNotif.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 truncate pr-1">
                          <span className="text-base">
                            {file.type === 'pdf' ? '📕' : file.type === 'xlsx' ? '📗' : '📘'}
                          </span>
                          <div className="truncate">
                            <span className="block font-bold text-slate-700 truncate leading-none mb-0.5">{file.name}</span>
                            <span className="text-[8.5px] font-mono text-slate-400 block leading-none">{file.size}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="p-1 bg-white hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 rounded-lg border border-slate-150 cursor-pointer shadow-3xs"
                          title="Tải về tượng trưng"
                          onClick={() => toast.info(`Bắt đầu tải xuống tệp tin mẫu: ${file.name}`)}
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs">
                {viewingNotif.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingNotif(null);
                      handleOpenEdit(viewingNotif);
                    }}
                    className="px-5 py-2.5 rounded-full border border-purple-200 text-purple-700 font-extrabold hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    Chỉnh sửa dự thảo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingNotif(null)}
                  className="px-5 py-2.5 rounded-full bg-[#ECE6F0] hover:bg-slate-200 text-[#21005D] font-extrabold cursor-pointer"
                >
                  Đóng xem trước
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
