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
  MoreVertical,
  Eye,
  Trash2,
  FileBadge,
  Award,
  FileClock,
  Settings,
  Plus,
  X,
  BookOpen,
  HelpCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  Check,
  RotateCcw,
  FileText,
  Sparkles,
  Download,
  Flame,
  ShieldAlert,
  PieChart,
  ListOrdered
} from 'lucide-react';
import { Exam, Subject, Teacher, ExamStatus, Question } from '../types';

interface ExamManagementViewProps {
  exams: Exam[];
  subjects: Subject[];
  teachers: Teacher[];
  questions: Question[];
  onUpdateExams?: React.Dispatch<React.SetStateAction<Exam[]>>;
}

export default function ExamManagementView({
  exams,
  subjects,
  teachers,
  questions,
  onUpdateExams
}: ExamManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  
  // Selection state for potential bulk management
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Selected Exam for Drawer view
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'questions' | 'answers' | 'stats'>('questions');

  // Modals state management
  const [modalApprove, setModalApprove] = useState<{ isOpen: boolean; exam: Exam | null }>({ isOpen: false, exam: null });
  const [modalOfficial, setModalOfficial] = useState<{ isOpen: boolean; exam: Exam | null }>({ isOpen: false, exam: null });
  const [modalReject, setModalReject] = useState<{ isOpen: boolean; exam: Exam | null }>({ isOpen: false, exam: null });

  // Input states inside Modals
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('Sai đáp án');
  const [rejectNote, setRejectNote] = useState('');

  // Local Toast notification helper
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const visibleExams = useMemo(() => {
    return exams.filter(e => e.status !== 'draft');
  }, [exams]);

  // Main Statistics matching user specification
  const stats = useMemo(() => {
    return {
      total: visibleExams.length,
      pending: visibleExams.filter(e => e.status === 'pending').length,
      official: visibleExams.filter(e => e.status === 'official').length,
      rejected: visibleExams.filter(e => e.status === 'rejected').length
    };
  }, [visibleExams]);

  // Filters mapping
  const filteredExams = useMemo(() => {
    return visibleExams.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSub = filterSubject === 'all' || e.subjectId === filterSubject;
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;
      const matchTch = filterTeacher === 'all' || e.creatorId === filterTeacher;
      
      return matchSearch && matchSub && matchStatus && matchTch;
    });
  }, [visibleExams, searchTerm, filterSubject, filterStatus, filterTeacher]);

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getStatusBadgeAndPill = (status: string) => {
    switch(status) {
      case 'official': 
      case 'published': // map published to official
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded flex-nowrap text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            ⭐ Chính thức
          </span>
        );
      case 'approved': 
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded flex-nowrap text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã duyệt
          </span>
        );
      case 'pending': 
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded flex-nowrap text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
            Chưa duyệt
          </span>
        );
      case 'rejected': 
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded flex-nowrap text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Từ chối
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded flex-nowrap text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Confirm Actions
  const handleApproveConfirm = () => {
    if (modalApprove.exam && onUpdateExams) {
      const exId = modalApprove.exam.id;
      onUpdateExams(prev => prev.map(e => {
        if (e.id === exId) {
          return {
            ...e,
            status: 'approved'
          };
        }
        return e;
      }));
      showToast(`Đã duyệt phê duyệt đề thi "${modalApprove.exam.title}" thành công!`, 'success');
      if (selectedExam?.id === exId) {
        setSelectedExam(prev => prev ? { ...prev, status: 'approved' } : null);
      }
    }
    setModalApprove({ isOpen: false, exam: null });
    setApproveNote('');
  };

  const handleMakeOfficialConfirm = () => {
    if (modalOfficial.exam && onUpdateExams) {
      const exId = modalOfficial.exam.id;
      onUpdateExams(prev => prev.map(e => {
        if (e.id === exId) {
          return {
            ...e,
            status: 'official'
          };
        }
        return e;
      }));
      showToast(`Đã chuyển đề thi "${modalOfficial.exam.title}" thành đề thi CHÍNH THỨC!`, 'success');
      if (selectedExam?.id === exId) {
        setSelectedExam(prev => prev ? { ...prev, status: 'official' } : null);
      }
    }
    setModalOfficial({ isOpen: false, exam: null });
  };

  const handleRejectConfirm = () => {
    if (modalReject.exam && onUpdateExams) {
      const exId = modalReject.exam.id;
      const combinedReason = `${rejectReason}${rejectNote ? `: ${rejectNote}` : ''}`;
      onUpdateExams(prev => prev.map(e => {
        if (e.id === exId) {
          return {
            ...e,
            status: 'rejected',
            rejectionReason: combinedReason
          };
        }
        return e;
      }));
      showToast(`Đã từ chối đề thi "${modalReject.exam.title}". Lý do: ${rejectReason}`, 'error');
      if (selectedExam?.id === exId) {
        setSelectedExam(prev => prev ? { ...prev, status: 'rejected', rejectionReason: combinedReason } : null);
      }
    }
    setModalReject({ isOpen: false, exam: null });
  };

  // Map actual questions for current exam view inside Drawer
  const examQuestions = useMemo(() => {
    if (!selectedExam || !selectedExam.questionsList) return [];
    
    return selectedExam.questionsList
      .map(id => questions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined)
      .map((q, i) => ({
        ...q,
        num: i + 1,
        options: q.options || ["A", "B", "C", "D"], // fallback
      }));
  }, [selectedExam, questions]);

  // Actual difficulty distribution
  const difficultyDistribution = useMemo(() => {
    return {
      easy: examQuestions.filter(q => q.difficulty === 'easy').length,
      medium: examQuestions.filter(q => q.difficulty === 'medium').length,
      hard: examQuestions.filter(q => q.difficulty === 'hard').length,
    };
  }, [examQuestions]);

  return (
    <div className="space-y-6 relative" id="exam-moderation-flow">
      
      {/* Dynamic Toast Indicators */}
      <div className="fixed top-24 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-xs font-bold flex items-center justify-between gap-4 transition-all duration-300 animate-in slide-in-from-right ${
              t.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : t.type === 'error' 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{t.type === 'success' ? '✔' : 'ℹ'}</span>
              <span>{t.text}</span>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-600">
              <X className="w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Header layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-3xs">

  <div className="space-y-1">
    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
      <span>🛡️</span>
      Kiểm duyệt đề thi
    </h2>

    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
      Quản lý và phê duyệt đề thi do giáo viên tạo. Đảm bảo cấu trúc đề thi,
      số lượng câu hỏi phù hợp và độ chính xác của đáp án trước khi phát hành.
    </p>
  </div>

  <button
    onClick={() => {
      const dataStr = JSON.stringify(filteredExams, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," +
        encodeURIComponent(dataStr);

      const exportFileDefaultName = `ngan_hang_de_thi_${
        new Date().toISOString().slice(0, 10)
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      showToast(
        `Đã xuất dữ liệu ${filteredExams.length} đề thi thành công!`,
        "success"
      );
    }}
    className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
  >
    <Download className="w-3.5 h-3.5" />
    <span>Xuất dữ liệu</span>
  </button>

</div>

      {/* Stat Dashboard widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Exam Counter */}
        <div className="bg-white/90 border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Tổng đề thi</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{stats.total.toLocaleString()}</p>
            <p className="text-[10px] text-slate-450 font-bold">Lưu trữ hệ thống</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100 shrink-0">
            <FileBadge className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Moderation */}
        <div className="bg-white/90 border border-amber-150 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black text-amber-600 tracking-wider">Chờ duyệt</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{stats.pending.toLocaleString()}</p>
            <p className="text-[10px] text-amber-700 font-extrabold bg-amber-50 rounded-md px-1 py-0.5 inline-block">Cần rà soát 🔎</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-100 shrink-0">
            <FileClock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Published/Official Exam */}
        <div className="bg-white/90 border border-emerald-150 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Chính thức</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{stats.official.toLocaleString()}</p>
            <p className="text-[10px] text-slate-450 font-bold">Đánh dấu đề chuẩn</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Rejected exam */}
        <div className="bg-white/90 border border-rose-150 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black text-rose-600 tracking-wider">Đã từ chối</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{stats.rejected.toLocaleString()}</p>
            <p className="text-[10px] text-slate-450 font-bold">Yêu cầu soạn lại</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-150 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-slate-150 flex flex-col sm:flex-row gap-3 items-center justify-between relative z-10">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search text input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm tên đề thi hoặc mã định danh..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-700 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Môn học */}
          <select 
            className="bg-white border border-slate-200 text-slate-700 py-1.5 px-3.5 rounded-xl text-xs outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="all">📚 Tất cả môn học</option>
            {subjects.map(s => <option key={s.id} value={s.id}>▼ {s.name}</option>)}
          </select>

          {/* Trạng thái */}
          <select 
            className="bg-white border border-slate-200 text-slate-700 py-1.5 px-3.5 rounded-xl text-xs outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">👁 Tất cả trạng thái</option>
            <option value="approved">🟢 Đã duyệt</option>
            <option value="pending">🟡 Chưa duyệt</option>
            <option value="rejected">🔴 Từ chối</option>
            <option value="official">⭐ Đề chính thức</option>
          </select>

          {/* Giáo viên */}
          <select 
            className="bg-white border border-slate-200 text-slate-700 py-1.5 px-3.5 rounded-xl text-xs outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
          >
            <option value="all">👨‍🏫 Tất cả giáo viên</option>
            {teachers.map(t => <option key={t.id} value={t.id}>▼ {t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main viewport area */}
      {/* TRADITIONAL COMPACT TABLE VIEW */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden animate-fade-in z-0 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <th className="py-3.5 px-5 text-xs">Mã Đề</th>
                <th className="py-3.5 px-5 text-xs min-w-[300px]">Tên Đề thi</th>
                <th className="py-3.5 px-5 text-xs">Giáo viên</th>
                <th className="py-3.5 px-5 text-xs">Môn học</th>
                <th className="py-3.5 px-5 text-xs text-center">Cấu hình</th>
                <th className="py-3.5 px-5 text-xs">Trạng thái</th>
                <th className="py-3.5 px-5 text-xs text-right">Lựa chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredExams.length > 0 ? (
                filteredExams.map(exam => {
                  const matchedSub = subjects.find(s => s.id === exam.subjectId)?.name || exam.subjectId;
                  return (
                    <tr 
                      key={exam.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedExam?.id === exam.id ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => setSelectedExam(exam)}
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-500 uppercase">
                        {exam.code}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-extrabold text-slate-800 line-clamp-2">{exam.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Ngày lập: {new Date(exam.createdAt || '').toLocaleDateString()}</p>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-600">
                        {exam.creatorName}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-black text-[10px] bg-slate-100 border border-slate-200 rounded px-2 py-0.5">
                          {matchedSub}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-indigo-700">{exam.questionsList.length} câu</span>
                          <span className="text-[10px] font-medium text-slate-400 font-mono">{exam.duration} phút</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {getStatusBadgeAndPill(exam.status)}
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button 
                            onClick={() => {
                              setSelectedExam(exam);
                              setActiveDrawerTab('questions');
                            }}
                            className="py-1 px-2 border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold text-slate-600 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Eye className="w-3 h-3" /> Xem
                          </button>

                          {(exam.status === 'pending' || exam.status === 'rejected') && (
                            <>
                              <button 
                                onClick={() => setModalApprove({ isOpen: true, exam })}
                                className="py-1 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-[10px] cursor-pointer whitespace-nowrap"
                              >
                                Duyệt
                              </button>
                              
                              {exam.status === 'pending' && (
                                <button 
                                  onClick={() => setModalReject({ isOpen: true, exam })}
                                  className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-200 rounded text-[10px] cursor-pointer whitespace-nowrap"
                                >
                                  Từ chối
                                </button>
                              )}
                            </>
                          )}

                          {exam.status === 'approved' && (
                            <button 
                              onClick={() => setModalOfficial({ isOpen: true, exam })}
                              className="py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px] cursor-pointer whitespace-nowrap"
                            >
                              ⭐ Đề chính thức
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 bg-white font-medium">
                    Không tìm thấy câu hỏi phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER FOR EXAM DETAILS */}
      {selectedExam && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-200 z-40 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
          
          {/* Header Drawer */}
          <div className="px-5 py-4.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50">
            <div className="flex items-start gap-2.5 text-slate-800">
              <span className="text-xl p-1 bg-indigo-100 text-indigo-700 rounded-lg mt-1 shrink-0">📝</span>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">{selectedExam.title}</h2>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{selectedExam.code}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedExam(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-transparent bg-white shadow-3xs shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Status indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadgeAndPill(selectedExam.status)}
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-slate-150 bg-slate-50 text-slate-500">
                Mức độ {selectedExam.difficulty === 'easy' ? 'Dễ' : selectedExam.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
              </span>
            </div>

            {/* Thông tin section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200/50 pb-1.5">Thông tin đề thi</h4>
              
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-semibold text-slate-600">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Môn học</p>
                  <p className="font-extrabold text-slate-800">{subjects.find(s=>s.id === selectedExam.subjectId)?.name || selectedExam.subjectName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Số câu</p>
                  <p className="font-extrabold text-slate-800">{examQuestions.length} câu</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Thời gian</p>
                  <p className="font-extrabold text-slate-800">{selectedExam.duration} phút</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Độ khó</p>
                  <p className="font-extrabold text-slate-800">
                    {selectedExam.difficulty === 'easy' ? 'Dễ' : selectedExam.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Giáo viên khởi tạo</p>
                  <p className="font-extrabold text-indigo-700 flex items-center gap-1.5 mt-0.5">
                    <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px]">👨‍🏫</span>
                    {selectedExam.creatorName} ({teachers.find(t=>t.name === selectedExam.creatorName)?.email || "tch-edu@prep.vn"})
                  </p>
                </div>
              </div>
            </div>

            {/* Cấu trúc đề section inside Drawer matching detailed specifications */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200/50 pb-1.5">Cấu trúc đề thi (Phân bổ kiểm tra)</h4>
              
              {/* Dynamic split of questions based on totalQuestions of specific exam */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-white border border-slate-150 rounded-xl shadow-3xs">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Dễ</p>
                  <p className="text-sm font-black text-emerald-600 mt-1">
                    {difficultyDistribution.easy} câu
                  </p>
                </div>
                <div className="p-2.5 bg-white border border-slate-150 rounded-xl shadow-3xs">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Trung bình</p>
                  <p className="text-sm font-black text-amber-600 mt-1">
                    {difficultyDistribution.medium} câu
                  </p>
                </div>
                <div className="p-2.5 bg-white border border-slate-150 rounded-xl shadow-3xs">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Khó</p>
                  <p className="text-sm font-black text-rose-600 mt-1">
                    {difficultyDistribution.hard} câu
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Tabs Layout: [Câu hỏi] [Đáp án] [Thống kê] */}
            <div className="space-y-4">
              <div className="flex border-b border-slate-200">
                <button 
                  onClick={() => setActiveDrawerTab('questions')}
                  className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeDrawerTab === 'questions' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📖 Câu hỏi
                </button>
                <button 
                  onClick={() => setActiveDrawerTab('answers')}
                  className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeDrawerTab === 'answers' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🔑 Đáp án
                </button>
                <button 
                  onClick={() => setActiveDrawerTab('stats')}
                  className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeDrawerTab === 'stats' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📈 Thống kê
                </button>
              </div>

              {/* Tab Display Content views */}
              {activeDrawerTab === 'questions' && (
                <div className="space-y-4 animate-fade-in">
                  {examQuestions.length > 0 ? examQuestions.map((q) => (
                    <div key={q.id} className="p-4 bg-white border border-slate-150 rounded-xl shadow-3xs space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-450 border-b border-slate-100 pb-1.5">
                        <span>Câu hỏi {q.num}</span>
                        <div className="flex gap-1.5">
                          <span className={`${q.difficulty === 'easy' ? 'text-emerald-600 bg-emerald-50' : q.difficulty === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'} px-1.5 py-0.5 rounded text-[10px]`}>
                            {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'medium' ? 'TB' : 'Khó'}
                          </span>
                          <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                            {q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs font-extrabold text-slate-800 leading-normal">{q.text}</p>
                      
                      {q.type !== 'essay' && (
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex items-center gap-1.5 text-slate-600">
                              <span className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[9px] font-black shrink-0">{String.fromCharCode(65 + oIdx)}</span>
                              <span className="truncate">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
                    <p className="text-center text-xs text-slate-500 italic py-4">Chưa có câu hỏi nào trong đề thi này.</p>
                  )}
                  {examQuestions.length > 0 && <p className="text-center text-[10px] text-slate-400 italic">Hiển thị toàn bộ {examQuestions.length} câu hỏi của đề thi này.</p>}
                </div>
              )}

              {activeDrawerTab === 'answers' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 animate-fade-in space-y-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold mb-2">
                    <span>🗝 Bảng đáp án chuẩn bị duyệt</span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {examQuestions.map((q) => {
                      let answerLabel = '';
                      if (q.type === 'essay') {
                        answerLabel = 'TL';
                      } else {
                        // Find which option matches correctAnswer
                        let optionIdx = q.options?.findIndex(o => o === q.correctAnswer);
                        if (typeof q.correctAnswer === 'string' && q.correctAnswer.length === 1 && /[A-Z]/.test(q.correctAnswer)) {
                          // Sometimes data just has "A" or "B"
                          answerLabel = q.correctAnswer;
                        } else if (optionIdx !== undefined && optionIdx >= 0) {
                          answerLabel = String.fromCharCode(65 + optionIdx);
                        } else {
                          answerLabel = '✔️'; // Default tick if answer structure is complex
                        }
                      }
                      
                      return (
                        <div key={q.id} className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-3xs text-center flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">{q.num}</span>
                          <span className="w-5 h-5 bg-emerald-500 text-white font-extrabold rounded-full flex items-center justify-center text-[10px]">
                            {answerLabel}
                          </span>
                        </div>
                      );
                    })}
                    {examQuestions.length === 0 && (
                      <p className="col-span-5 text-center text-xs text-slate-500 italic">Không có dữ liệu đáp án.</p>
                    )}
                  </div>
                </div>
              )}

              {activeDrawerTab === 'stats' && (
                <div className="p-4 bg-white border border-slate-150 rounded-xl shadow-xs space-y-4 animate-fade-in">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Báo cáo dự tính & Phổ điểm kiểm tra</h4>
                  
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-650 mb-1">
                        <span>Làm bài xong (Nộp đề):</span>
                        <span className="text-slate-800">{selectedExam.attemptsCount || 242} lượt</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1.5 text-center">
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Điểm Average</p>
                        <p className="text-base font-black text-slate-800">8.2 / 10</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Tập Trung Đỗ</p>
                        <p className="text-base font-black text-emerald-600">88.5%</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Phổ điểm phân bố ước lượng</p>
                      <div className="space-y-1 text-xs font-bold text-slate-600">
                        {["Điểm 9 - 10", "Điểm 7 - 8", "Điểm 5 - 6", "Điểm < 5"].map((range, k) => {
                          const val = [25, 45, 20, 10][k];
                          return (
                            <div key={k} className="flex items-center gap-3">
                              <span className="w-20 text-slate-500 text-[11px]">{range}</span>
                              <div className="flex-1 bg-slate-100 h-3 rounded-md overflow-hidden relative">
                                <div className="bg-amber-400 h-full rounded-md" style={{ width: `${val}%` }}></div>
                              </div>
                              <span className="w-10 text-right text-[10px] font-mono text-slate-500">{val}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky moderation actionable footer for Drawer details view */}
            {(selectedExam.status === 'pending' || selectedExam.status === 'rejected') && (
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 pb-6">
                <button 
                  onClick={() => setModalApprove({ isOpen: true, exam: selectedExam })}
                  className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer text-center"
                >
                  ✔ Duyệt Đề thi
                </button>
                <button 
                  onClick={() => setModalReject({ isOpen: true, exam: selectedExam })}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-605 border border-slate-205 rounded-xl text-xs font-black shadow-sm cursor-pointer text-center"
                >
                  ❌ Từ Chối Duyệt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DUYỆT ĐỀ THI */}
      {modalApprove.isOpen && modalApprove.exam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-105 space-y-4 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-sm shrink-0">✔</span>
              <h3 className="text-base font-black text-slate-850 uppercase tracking-wide">Duyệt đề thi</h3>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-705">
              <p className="font-extrabold text-slate-800 text-sm">
                Đề thi sẽ được:
              </p>
              
              <div className="space-y-3 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-extrabold mt-0.5">✓</span>
                  <p className="font-bold text-slate-700 text-xs">Công khai trong hệ thống</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-extrabold mt-0.5">✓</span>
                  <p className="font-bold text-slate-700 text-xs">Cho phép học sinh làm bài</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-extrabold mt-0.5">✓</span>
                  <p className="font-bold text-slate-705 text-xs">Xuất hiện trong ngân hàng đề</p>
                </div>
              </div>

              {/* Note input field in prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 block">Ghi chú</label>
                <textarea 
                  placeholder="Nhập ghi chú phê duyệt ở đây..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 font-medium text-slate-705 min-h-[90px]"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-150">
              <button 
                onClick={() => setModalApprove({ isOpen: false, exam: null })}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-550 rounded-xl border border-slate-200 transition-colors shadow-3xs cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleApproveConfirm}
                className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border border-emerald-600 transition-colors shadow-md cursor-pointer"
              >
                Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐÁNH DẤU ĐỀ CHÍNH THỨC */}
      {modalOfficial.isOpen && modalOfficial.exam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5 animate-in slide-in-from-bottom duration-250">
            
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm shrink-0">⭐</span>
              <h3 className="text-base font-black text-slate-850 uppercase tracking-wide">Đề thi chính thức</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black">Tên đề</p>
                <p className="font-extrabold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs sm:text-sm mt-1">{modalOfficial.exam.title}</p>
              </div>

              <div>
                <p className="font-extrabold text-slate-850 mb-2">Khi đánh dấu đề thi chính thức:</p>
                <div className="space-y-2 bg-indigo-50/50 rounded-2xl p-4 border border-indigo-150">
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 font-extrabold mt-0.5">✓</span>
                    <p className="font-semibold text-slate-650">Hiển thị ưu tiên hàng đầu tại bảng tin học tập</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 font-extrabold mt-0.5">✓</span>
                    <p className="font-semibold text-slate-650">Được đề xuất cho học sinh đạt điều kiện học bạ</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 font-extrabold mt-0.5">✓</span>
                    <p className="font-semibold text-slate-650">Xuất hiện trong danh mục Đề thi chính thức chuẩn quốc gia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setModalOfficial({ isOpen: false, exam: null })}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-extrabold transition-all border border-slate-150 shadow-3xs cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleMakeOfficialConfirm}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all border border-indigo-700 shadow-md cursor-pointer"
              >
                Đánh dấu chính thức
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI DUYỆT ĐỀ THI */}
      {modalReject.isOpen && modalReject.exam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5 animate-in slide-in-from-bottom duration-250">
            
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center text-sm shrink-0">❌</span>
              <h3 className="text-base font-black text-slate-850 uppercase tracking-wide">Từ chối đề thi</h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Reject Options */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider">Lý do từ chối *</label>
                <select 
                  className="w-full bg-white border border-slate-250 py-2 px-3 rounded-xl text-xs outline-none focus:border-rose-500 text-slate-700 font-semibold cursor-pointer"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                >
                  <option value="Sai đáp án">Sai đáp án hoàn toàn / Thiếu chính xác</option>
                  <option value="Nội dung trùng lặp">Nội dung trùng lặp với đề THPT đã ban hành</option>
                  <option value="Thiếu giải thích">Thiếu giải thích chi tiết đáp án lựa chọn</option>
                  <option value="Sai chuyên đề">Gán nhãn sai chuyên đề hoặc phân bổ sai độ khó</option>
                  <option value="Khác">Lý do khác (Nhập chi tiết bên dưới)</option>
                </select>
              </div>

              {/* Reject Note textarea */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider">Ghi chú phản hồi học liệu</label>
                <textarea 
                  placeholder="Ghi chú chi tiết lý do và hướng sửa đổi gửi cho giáo viên khởi tạo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-rose-500 font-medium text-slate-700 placeholder-slate-400 min-h-[90px]"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 animate-fade-in">
              <button 
                onClick={() => setModalReject({ isOpen: false, exam: null })}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-extrabold transition-all border border-slate-150 shadow-3xs cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleRejectConfirm}
                className="py-2.5 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold transition-all border border-rose-600 shadow-md cursor-pointer"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
