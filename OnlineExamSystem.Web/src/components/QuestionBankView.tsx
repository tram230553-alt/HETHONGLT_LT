/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Lock,
  Eye,
  Trash2,
  FileQuestion,
  MoreVertical,
  ChevronDown,
  X,
  FileText,
  Sparkles,
  Download,
  Check,
  AlertTriangle,
  RotateCcw,
  User,
  BookOpen,
  Tag,
  Calendar,
  Grid,
  List,
  Flame,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Question, Subject, Topic } from '../types';

interface QuestionBankViewProps {
  questions: Question[];
  subjects: Subject[];
  topics: Topic[];
  onUpdateQuestions?: React.Dispatch<React.SetStateAction<Question[]>>;
}

export default function QuestionBankView({
  questions,
  subjects,
  topics,
  onUpdateQuestions
}: QuestionBankViewProps) {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all'); // default all, user can filter
  const [filterStatus, setFilterStatus] = useState<string>('pending'); // default 'pending' (Chờ duyệt) as requested
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards'); // Default card grid for Q0001 styling request
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Drawer details state
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Modals state
  const [modalApprove, setModalApprove] = useState<{ isOpen: boolean; question: Question | null; bulk: boolean }>({ isOpen: false, question: null, bulk: false });
  const [modalReject, setModalReject] = useState<{ isOpen: boolean; question: Question | null }>({ isOpen: false, question: null });
  const [modalLock, setModalLock] = useState<{ isOpen: boolean; question: Question | null }>({ isOpen: false, question: null });

  // Modal input fields
  const [approveNote, setApproveNote] = useState('');
  const [approveNotifyTeacher, setApproveNotifyTeacher] = useState(true);

  const [rejectReason, setRejectReason] = useState('Sai đáp án');
  const [rejectNote, setRejectNote] = useState('');

  const [lockReason, setLockReason] = useState('Sai kiến thức');

  // Trigger toast notification
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const visibleQuestions = useMemo(() => {
    return questions.filter(q => q.status !== 'draft');
  }, [questions]);

  // Extract unique teachers from search dataset
  const availableTeachers = useMemo(() => {
    const list = new Map<string, string>();
    visibleQuestions.forEach(q => {
      if (q.createdBy && q.creatorName) {
        list.set(q.createdBy, q.creatorName);
      }
    });
    return Array.from(list.entries()).map(([id, name]) => ({ id, name }));
  }, [visibleQuestions]);

  // Statistics calculation matching mockup demands
  const stats = useMemo(() => {
    return {
      total: visibleQuestions.length,
      pending: visibleQuestions.filter(q => q.status === 'pending').length,
      approved: visibleQuestions.filter(q => q.status === 'approved').length,
      rejected: visibleQuestions.filter(q => q.status === 'rejected').length,
      locked: visibleQuestions.filter(q => q.status === 'locked').length,
    };
  }, [visibleQuestions]);

  // Question content filters
  const filteredQuestions = useMemo(() => {
    return visibleQuestions.filter(q => {
      const matchSearch = 
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSub = filterSubject === 'all' || q.subjectId === filterSubject;
      const matchStatus = filterStatus === 'all' || q.status === filterStatus;
      const matchDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
      const matchTeacher = filterTeacher === 'all' || q.createdBy === filterTeacher;
      
      return matchSearch && matchSub && matchStatus && matchDiff && matchTeacher;
    });
  }, [visibleQuestions, searchTerm, filterSubject, filterStatus, filterDifficulty, filterTeacher]);

  const selectAllFiltered = () => {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map(q => q.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Form submission: Approve
  const handleApproveConfirm = () => {
    if (onUpdateQuestions) {
      if (modalApprove.bulk) {
        onUpdateQuestions(prev => prev.map(q => {
          if (selectedIds.includes(q.id)) {
            return {
              ...q,
              status: 'approved',
              explanation: q.explanation || (approveNote ? `Ghi chú duyệt: ${approveNote}` : q.explanation)
            };
          }
          return q;
        }));
        showToast(`Đã phê duyệt hàng loạt ${selectedIds.length} câu hỏi thành công!`, 'success');
        setSelectedIds([]);
      } else if (modalApprove.question) {
        const qId = modalApprove.question.id;
        onUpdateQuestions(prev => prev.map(q => {
          if (q.id === qId) {
            return {
              ...q,
              status: 'approved',
              explanation: q.explanation || (approveNote ? `Ghi chú duyệt: ${approveNote}` : q.explanation)
            };
          }
          return q;
        }));
        showToast(`Đã duyệt thành công câu hỏi ${qId.toUpperCase()}!`, 'success');
        if (selectedQuestion?.id === qId) {
          setSelectedQuestion(prev => prev ? { ...prev, status: 'approved' } : null);
        }
      }
    } else {
      showToast('Tính năng yêu cầu State Global, đã cập nhật giao diện thành công!', 'info');
    }

    setModalApprove({ isOpen: false, question: null, bulk: false });
    setApproveNote('');
  };

  // Form submission: Reject
  const handleRejectConfirm = () => {
    if (modalReject.question) {
      const qId = modalReject.question.id;
      if (onUpdateQuestions) {
        onUpdateQuestions(prev => prev.map(q => {
          if (q.id === qId) {
            return {
              ...q,
              status: 'rejected',
              explanation: `Từ chối vì: ${rejectReason}. Chi tiết ghi chú: ${rejectNote || 'Không có'}`
            };
          }
          return q;
        }));
      }
      showToast(`Đã từ chối câu hỏi ${qId.toUpperCase()}! Lý do: ${rejectReason}`, 'error');
      if (selectedQuestion?.id === qId) {
        setSelectedQuestion(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
    }
    setModalReject({ isOpen: false, question: null });
    setRejectNote('');
  };

  // Form submission: Lock
  const handleLockConfirm = () => {
    if (modalLock.question) {
      const qId = modalLock.question.id;
      if (onUpdateQuestions) {
        onUpdateQuestions(prev => prev.map(q => {
          if (q.id === qId) {
            return {
              ...q,
              status: 'locked',
              explanation: `Bị khóa vì: ${lockReason}`
            };
          }
          return q;
        }));
      }
      showToast(`Đã khóa câu hỏi ${qId.toUpperCase()} thành công!`, 'info');
      if (selectedQuestion?.id === qId) {
        setSelectedQuestion(prev => prev ? { ...prev, status: 'locked' } : null);
      }
    }
    setModalLock({ isOpen: false, question: null });
  };

  // Bulk Actions
  const handleBulkApproveTrigger = () => {
    if (selectedIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một câu hỏi để duyệt hàng loạt!', 'error');
      return;
    }
    setModalApprove({ isOpen: true, question: null, bulk: true });
  };

  // Export questions simulation
  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredQuestions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ngan_hang_cau_hoi_kiem_duyet_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast(`Đã xuất ${filteredQuestions.length} dòng dữ liệu ra file JSON thành công!`, 'success');
  };

  const getDifficultyBadge = (diff: string) => {
    switch(diff) {
      case 'easy': return 'bg-emerald-50 text-emerald-800 border-emerald-100 uppercase text-[9px]';
      case 'medium': return 'bg-amber-50 text-amber-800 border-amber-100 uppercase text-[9px]';
      case 'hard': return 'bg-rose-50 text-rose-800 border-rose-100 uppercase text-[9px]';
      default: return 'bg-slate-50 text-slate-800 border-slate-100 uppercase text-[9px]';
    }
  };

  const getStatusLabelText = (status: string) => {
    switch(status) {
      case 'approved': return 'Đã duyệt';
      case 'official': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'draft': return 'Bản nháp';
      case 'rejected': return 'Bị từ chối';
      case 'locked': return 'Đã khóa';
      default: return status;
    }
  };

  const getStatusPill = (status: string) => {
    switch(status) {
      case 'approved':
      case 'official': 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/75 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Đã duyệt
          </span>
        );
      case 'pending': 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/70 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
            🟡 Chờ duyệt
          </span>
        );
      case 'rejected': 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/70 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            🔴 Bị từ chối
          </span>
        );
      case 'locked': 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-100 border border-slate-750">
            <Lock className="w-3 h-3 text-slate-400" />
            Đã khóa
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 flex flex-col md:flex-row gap-6 min-h-[calc(100vh-8rem)] relative" id="question-moderator-view">
      
      {/* Toast Alert Notifications Container */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-4 transition-all animate-in slide-in-from-right duration-250 ${
              t.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : t.type === 'error' 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{t.text}</span>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Main content viewport */}
      <div className={`flex-1 flex flex-col gap-6 transition-all duration-300 ${selectedQuestion ? 'lg:mr-[420px]' : ''}`}>
        
        {/* Header section with layout requirements */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-3xs">

  <div className="space-y-1">
    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
      <span>🛡️</span>
      Kiểm duyệt câu hỏi
    </h2>

    <p className="text-xs text-slate-500 font-medium leading-relaxed">
      Kiểm tra và phê duyệt câu hỏi do giáo viên tạo trước khi đưa vào ngân hàng câu hỏi.
    </p>
  </div>

  <div className="flex flex-wrap items-center gap-2.5">

    <button
      onClick={handleExportData}
      className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all shadow-3xs"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Xuất dữ liệu</span>
    </button>

    <button
      onClick={handleBulkApproveTrigger}
      disabled={selectedIds.length === 0}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shadow-md
      ${
        selectedIds.length > 0
          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
          : "bg-slate-100 text-slate-400 cursor-not-allowed"
      }`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>Duyệt hàng loạt ({selectedIds.length})</span>
    </button>

  </div>

</div>
        {/* Dashboard Thống kê widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {/* Total Questions */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500">Tổng câu hỏi</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Lưu trữ hệ thống</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white text-indigo-500 flex items-center justify-center border border-indigo-200/50 shadow-inner shrink-0">
              <FileQuestion className="w-6 h-6" />
            </div>
          </div>

          {/* Pending Approval */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 sm:p-5 rounded-2xl border border-amber-150 shadow-xs flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600">Chờ duyệt</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                {stats.pending.toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-700/80 font-bold bg-amber-100/60 inline-block px-1.5 py-0.5 rounded-md">Cần kiểm tra ⚡</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white text-amber-500 flex items-center justify-center border border-amber-200/50 shadow-inner shrink-0">
              <Flame className="w-6 h-6" />
            </div>
          </div>

          {/* Approved */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 sm:p-5 rounded-2xl border border-emerald-150 shadow-xs flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600">Đã duyệt</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                {stats.approved.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Sẵn có trong ngân hàng</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white text-emerald-500 flex items-center justify-center border border-emerald-200/50 shadow-inner shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Rejected Counter */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 sm:p-5 rounded-2xl border border-rose-150 shadow-xs flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600">Bị từ chối</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                {stats.rejected.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Bị từ chối trả về sửa</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white text-rose-500 flex items-center justify-center border border-rose-200/50 shadow-inner shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Bộ lọc options (Filters) with beautiful glassmorphism */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 animate-fade-in relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Bộ lọc tìm kiếm thông minh</span>
            </div>
            
            {/* View layout switcher card or table */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-end">
              <button 
                onClick={() => setViewLayout('cards')}
                className={`p-1.5 rounded-lg transition-all ${viewLayout === 'cards' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                title="Dạng thẻ (Card view)"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition-all ${viewLayout === 'table' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                title="Dạng bảng (Table list)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search Input bar */}
            <div className="relative md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm theo nội dung câu hỏi..." 
                  className="w-full pl-8.5 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-700 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Môn học */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Môn học</label>
              <select 
                className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <option value="all">📚 Tất cả môn học</option>
                {subjects.map(s => <option key={s.id} value={s.id}>▼ {s.name}</option>)}
              </select>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Trạng thái duyệt</label>
              <select 
                className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">👁 Tất cả trạng thái</option>
                <option value="pending">🟡 Chờ duyệt (Chờ)</option>
                <option value="approved">🟢 Đã duyệt</option>
                <option value="rejected">🔴 Bị từ chối</option>
                <option value="locked">🔒 Đã khóa</option>
              </select>
            </div>

            {/* Độ khó */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Độ khó</label>
              <select 
                className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="all">⚡ Tất cả độ khó</option>
                <option value="easy">Dễ (Easy)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="hard">Khó (Hard)</option>
              </select>
            </div>

            {/* Giáo viên */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Giáo viên tạo</label>
              <select 
                className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
              >
                <option value="all">👨‍🏫 Tất cả giáo viên</option>
                {availableTeachers.map(t => <option key={t.id} value={t.id}>▼ {t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Reset Quick filter helper */}
        {filterStatus !== 'all' || filterSubject !== 'all' || filterDifficulty !== 'all' || filterTeacher !== 'all' || searchTerm ? (
          <div className="flex items-center gap-2 justify-between px-2 text-xs">
            <span className="text-slate-500 font-medium">
              Đang lọc hiển thị <strong className="text-indigo-600 font-extrabold">{filteredQuestions.length}</strong> trên tổng số <strong>{questions.length}</strong> câu hỏi.
            </span>
            <button 
              onClick={() => {
                setFilterSubject('all');
                setFilterStatus('all');
                setFilterDifficulty('all');
                setFilterTeacher('all');
                setSearchTerm('');
              }}
              className="flex items-center gap-1 text-indigo-600 font-extrabold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Thiết lập lại bộ lọc
            </button>
          </div>
        ) : null}

        {/* Main interactive list viewport */}
        {viewLayout === 'cards' ? (
          /* Custom Display Cards Q0001 structure styled after request */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((q, idx) => {
                const subName = subjects.find(s => s.id === q.subjectId)?.name || q.subjectId;
                const isSelected = selectedIds.includes(q.id);
                
                return (
                  <div 
                    key={q.id} 
                    className={`bg-white/95 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between group ${
                      selectedQuestion?.id === q.id 
                        ? 'ring-2 ring-indigo-500 border-transparent bg-indigo-50/50' 
                        : isSelected 
                        ? 'border-indigo-300 bg-indigo-50/20' 
                        : 'border-slate-150 hover:border-slate-200'
                    }`}
                  >
                    {/* Top Tag & Selection checkbox */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        {/* Checkbox */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSelectId(q.id); }}
                          className={`p-0.5 rounded-md border transition-colors ${
                            isSelected 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'bg-white border-slate-300 hover:border-slate-400 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(q.difficulty)}`}>
                          Độ khó: {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 space-y-4 cursor-pointer" onClick={() => setSelectedQuestion(q)}>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-relaxed line-clamp-3" title="Click để xem chi tiết học liệu">
                        {q.text}
                      </p>

                      {/* Options Sneak Peak */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pb-2">
                          {q.options.slice(0, 4).map((opt, oIdx) => (
                            <div key={oIdx} className={`text-[11px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 truncate ${opt === q.correctAnswer ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 font-semibold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${opt === q.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meta lists */}
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-400">👤 Tác giả:</span>
                          <span className="text-slate-700 truncate font-bold">{q.creatorName || 'Giáo viên'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-400">📚 Môn học:</span>
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                            {subjects.find(s => s.id === q.subjectId)?.name || q.subjectId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 col-span-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Ngày tạo: {new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Display Area & Visual controls */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        {getStatusPill(q.status)}
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedQuestion(q)}
                          className="flex items-center gap-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-3xs"
                          title="Xem chi tiết nội dung giải thích"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Xem
                        </button>

                        {q.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => setModalApprove({ isOpen: true, question: q, bulk: false })}
                              className="flex items-center gap-0.5 py-1.5 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-emerald-600 shadow-3xs"
                              title="Duyệt câu hỏi vào chính thức"
                            >
                              ✔ Duyệt
                            </button>
                            <button 
                              onClick={() => setModalReject({ isOpen: true, question: q })}
                              className="flex items-center gap-0.5 py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-200 shadow-3xs"
                              title="Từ chối phê duyệt"
                            >
                              ❌ Từ chối
                            </button>
                          </>
                        )}

                        {q.status !== 'locked' && (
                          <button 
                            onClick={() => setModalLock({ isOpen: true, question: q })}
                            className="flex items-center gap-0.5 py-1.5 px-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-500 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-3xs"
                            title="Khóa/Bảo trì câu hỏi"
                          >
                            🔒 Khóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 py-16 text-center bg-white border border-dashed border-slate-200 rounded-3xl p-8">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-extrabold text-slate-700 text-sm">Không tìm thấy yêu cầu tương thích</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Vui lòng điều chỉnh lại trạng thái duyệt hoặc nhập từ khóa tìm kiếm khác để kiểm duyệt học liệu.</p>
              </div>
            )}
          </div>
        ) : (
          /* Table Layout Option */
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={filteredQuestions.length > 0 && selectedIds.length === filteredQuestions.length}
                        onChange={selectAllFiltered}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                    </th>
                    <th className="py-3.5 px-4 text-xs min-w-[240px]">Nội dung câu hỏi</th>
                    <th className="py-3.5 px-4 text-xs">Môn học</th>
                    <th className="py-3.5 px-4 text-xs">Tác giả</th>
                    <th className="py-3.5 px-4 text-xs">Độ khó</th>
                    <th className="py-3.5 px-4 text-xs">Trạng thái</th>
                    <th className="py-3.5 px-4 text-xs text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q, idx) => {
                      const isSelected = selectedIds.includes(q.id);
                      return (
                        <tr 
                          key={q.id} 
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            selectedQuestion?.id === q.id ? 'bg-indigo-50/40' : ''
                          }`}
                          onClick={() => setSelectedQuestion(q)}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectId(q.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-800 line-clamp-2">{q.text}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Ngày tạo: {new Date(q.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                              {subjects.find(s=>s.id === q.subjectId)?.name || q.subjectId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {q.creatorName || 'Giáo viên'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${getDifficultyBadge(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusLabelText(q.status)}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => setSelectedQuestion(q)}
                                className="p-1 px-2 border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> Xem
                              </button>
                              
                              {q.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => setModalApprove({ isOpen: true, question: q, bulk: false })}
                                    className="p-1 px-2 bg-emerald-500 text-white rounded text-[11px] font-bold hover:bg-emerald-600 transition-all border border-emerald-600 cursor-pointer"
                                  >
                                    Duyệt
                                  </button>
                                  <button 
                                    onClick={() => setModalReject({ isOpen: true, question: q })}
                                    className="p-1 px-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold bg-white">
                        Không tìm thấy câu hỏi tương thích với bộ lọc
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold bg-slate-50">
              <span>Đang chọn {selectedIds.length} dòng dữ liệu</span>
              <span>Đang hiển thị {filteredQuestions.length} câu hỏi</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Side Drawer for Question Details */}
      {selectedQuestion && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-200 z-40 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50">
            <div className="flex items-center gap-2 text-slate-800">
              <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700 text-sm">❓</span>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-850">Chi tiết câu hỏi</h2>
            </div>
            <button 
              onClick={() => setSelectedQuestion(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-150 bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Meta Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
               {getStatusPill(selectedQuestion.status)}
               <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${getDifficultyBadge(selectedQuestion.difficulty)}`}>
                 {selectedQuestion.difficulty === 'easy' ? 'Độ khó: Dễ' : selectedQuestion.difficulty === 'medium' ? 'Độ khó: Trung bình' : 'Độ khó: Khó'}
               </span>
               <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-slate-200 bg-slate-100 text-slate-600">
                 {selectedQuestion.type === 'single_choice' ? 'Trắc nghiệm đơn' : 'Tự luận'}
               </span>
            </div>

            {/* Q Content text */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</h3>
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs sm:text-sm font-bold text-slate-800 leading-relaxed shadow-3xs">
                {selectedQuestion.text}
              </div>
            </div>

            {/* Options choices if single_choice */}
            {selectedQuestion.options && selectedQuestion.options.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Các lựa chọn phương án</h3>
                <div className="space-y-2">
                  {selectedQuestion.options.map((opt, i) => {
                    const isCorrect = opt === selectedQuestion.correctAnswer;
                    return (
                      <div 
                        key={i} 
                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition-all ${
                          isCorrect 
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-extrabold shadow-3xs' 
                            : 'bg-white border-slate-150 text-slate-600 hover:border-slate-250'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex flex-shrink-0 items-center justify-center text-[10px] font-extrabold tracking-wider ${
                          isCorrect 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1 pt-0.5">{opt}</span>
                        {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Correct Answer Display */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đáp án đúng</h3>
              <div className="bg-emerald-100/40 text-emerald-900 border border-emerald-200/60 rounded-xl p-3 text-xs sm:text-sm font-black flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                  ✔
                </span>
                <span>{String(selectedQuestion.correctAnswer)}</span>
              </div>
            </div>

            {/* Exp detailed */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lời giải chi tiết & Giải thích</h3>
              <div className="bg-white border border-indigo-150 rounded-2xl p-4 text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed shadow-3xs">
                {selectedQuestion.explanation || 'Câu hỏi này chưa có phần giải thích.'}
              </div>
            </div>

            {/* Meta tags descriptions grouped formatted as requested */}
            <div className="bg-slate-50 rounded-2xl p-4.5 space-y-3 border border-slate-150">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1.5">Thông tin định danh & Phân loại học liệu</h4>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Tác giả biên soạn</span>
                <span className="font-extrabold text-slate-800">{selectedQuestion.creatorName || 'Nguyễn Văn Minh'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Môn học</span>
                <span className="font-extrabold text-slate-800">
                  {subjects.find(s=>s.id === selectedQuestion.subjectId)?.name || 'Toán học'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Chương học</span>
                <span className="font-bold text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded text-[10px]">
                  {topics.find(c=>c.id === selectedQuestion.chapterId)?.name || 'Chương I: Hàm số'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Chuyên đề</span>
                <span className="font-bold text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded text-[10px]">
                  {topics.find(t=>t.id === selectedQuestion.topicId)?.name || 'Cực trị của hàm số'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Ngày đăng tải</span>
                <span className="font-bold text-slate-700">{new Date(selectedQuestion.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Action Footer for Drawer */}
          {selectedQuestion.status === 'pending' && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/95 flex gap-2">
               <button 
                onClick={() => setModalReject({ isOpen: true, question: selectedQuestion })}
                className="flex-1 py-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-extrabold text-xs rounded-xl shadow-xs text-center transition-all cursor-pointer"
               >
                  ❌ Từ chối
               </button>
               <button 
                onClick={() => setModalApprove({ isOpen: true, question: selectedQuestion, bulk: false })}
                className="flex-1 py-3 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md text-center transition-all cursor-pointer"
               >
                  ✔ Duyệt câu hỏi
               </button>
            </div>
          )}
        </div>
      )}

      {/* 1. Modal Duyệt câu hỏi */}
      {modalApprove.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-180">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100/40">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">✔</span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">Duyệt câu hỏi</h3>
              </div>
              <button 
                onClick={() => setModalApprove({ isOpen: false, question: null, bulk: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-xs sm:text-sm font-semibold">
                Câu hỏi sẽ được đưa vào:
              </p>
              
              <div className="p-3 bg-emerald-100/40 text-emerald-900 border border-emerald-200/50 rounded-xl text-xs font-black flex items-center gap-2">
                ✨ Ngân hàng câu hỏi chính thức
              </div>

              {modalApprove.bulk ? (
                <div className="text-[11px] text-indigo-600 bg-indigo-50 p-2.5 rounded-lg font-bold">
                  Sẽ thực thi duyệt hàng loạt {selectedIds.length} câu hỏi đã đánh dấu.
                </div>
              ) : modalApprove.question ? (
                <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-700 font-semibold line-clamp-2">{modalApprove.question.text}</div>
                </div>
              ) : null}

              {/* Note input of approve */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Ghi chú hoặc ý kiến phê duyệt</label>
                <input 
                  type="text" 
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Ghi chú kèm theo, ví dụ: Phù hợp chương I Hàm số..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold text-slate-700 bg-white"
                />
              </div>

              {/* Checkbox notification */}
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="notify_teacher_cb" 
                  checked={approveNotifyTeacher}
                  onChange={(e) => setApproveNotifyTeacher(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="notify_teacher_cb" className="text-xs font-semibold text-slate-600 cursor-pointer">
                  ☑ Thông báo kết quả cho giáo viên tạo
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button 
                onClick={() => setModalApprove({ isOpen: false, question: null, bulk: false })}
                className="py-2 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleApproveConfirm}
                className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-emerald-600"
              >
                Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Từ chối (Reject/Decline Modal) */}
      {modalReject.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-180">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-rose-100/40">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">❌</span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">Từ chối câu hỏi</h3>
              </div>
              <button 
                onClick={() => setModalReject({ isOpen: false, question: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalReject.question && (
                <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <p className="font-medium text-slate-600 line-clamp-2">{modalReject.question.text}</p>
                </div>
              )}

              {/* Reject reasons select box dropdown as requested */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Lý do từ chối *</label>
                <select 
                  className="w-full bg-white border border-slate-200 text-slate-700 py-3 px-3.5 rounded-xl text-xs outline-none focus:border-rose-500 font-semibold cursor-pointer"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                >
                  <option value="Sai đáp án">▼ Sai đáp án</option>
                  <option value="Nội dung trùng lặp">▼ Nội dung trùng lặp</option>
                  <option value="Thiếu giải thích">▼ Thiếu giải thích</option>
                  <option value="Sai chuyên đề">▼ Sai chuyên đề</option>
                  <option value="Khác">▼ Khác</option>
                </select>
              </div>

              {/* Text note input detail */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Ghi chú cụ thể</label>
                <textarea 
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Vui lòng tả rõ chi tiết điểm sai lệch cần giáo viên tự khắc phục chỉnh sửa lại..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-semibold text-slate-700 bg-white"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button 
                onClick={() => setModalReject({ isOpen: false, question: null })}
                className="py-2 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleRejectConfirm}
                className="py-2.5 px-5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-rose-600"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Khóa câu hỏi (Lock question modal) */}
      {modalLock.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-180">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-100 to-slate-200/40">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">🔒</span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">Khóa câu hỏi</h3>
              </div>
              <button 
                onClick={() => setModalLock({ isOpen: false, question: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalLock.question && (
                <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <p className="font-medium text-slate-600 line-clamp-2">{modalLock.question.text}</p>
                </div>
              )}

              {/* Reasons select box as requested to lock question */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider text-slate-500">Lý do khóa câu hỏi</label>
                <select 
                  className="w-full bg-white border border-slate-200 text-slate-700 py-3 px-3.5 rounded-xl text-xs outline-none focus:border-slate-500 font-semibold cursor-pointer"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                >
                  <option value="Sai kiến thức">▼ Sai kiến thức</option>
                  <option value="Trùng lặp">▼ Trùng lặp</option>
                  <option value="Không còn sử dụng">▼ Không còn sử dụng</option>
                  <option value="Vi phạm quy định">▼ Vi phạm quy định</option>
                </select>
              </div>

              <p className="text-[10px] text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                ⚠️ Cảnh báo: Việc khóa câu hỏi sẽ ẩn toàn bộ nội dung khỏi các đề thi đang trong đợt phát hành và các đề kiểm tra luyện tập của học sinh.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button 
                onClick={() => setModalLock({ isOpen: false, question: null })}
                className="py-2 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleLockConfirm}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-slate-900"
              >
                Khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
