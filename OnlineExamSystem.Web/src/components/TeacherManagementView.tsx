import { toast as globalToast } from '../services/toast';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
    GradeDto,
    getGrades,
} from "../services/gradeService";
import { getTeacherDetail, TeacherDetailDto } from '../services/teacherService';
import { isValidPhone, sanitizePhoneInput, PHONE_ERROR_MESSAGE } from '../utils/phone';
import { Teacher, Subject } from '../types';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock, 
  KeyRound, 
  Eye,
  X,
  UserPlus,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Check,
  TrendingUp,
  Download,
  CheckCircle,
  Users,
  Grid,
  List,
  GraduationCap
} from 'lucide-react';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

type TeacherDetailTab = 'overview' | 'questions' | 'exams' | 'practice';

const TEACHER_DETAIL_TABS: { key: TeacherDetailTab; label: string }[] = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'questions', label: 'Câu hỏi' },
  { key: 'exams', label: 'Đề thi' },
  { key: 'practice', label: 'Luyện tập' },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};

const EXAM_STATUS_META: Record<'published' | 'pending' | 'rejected' | 'draft', { label: string; text: string }> = {
  published: { label: 'Đã phát hành', text: 'text-emerald-600' },
  pending: { label: 'Chờ duyệt', text: 'text-amber-600' },
  rejected: { label: 'Bị từ chối', text: 'text-rose-600' },
  draft: { label: 'Bản nháp', text: 'text-slate-500' },
};

interface UpdateTeacherAdminInput {
    id: string;
    email: string;
    subjectId: string;
    gradeId: string;
}

interface CreateTeacherInput {
    name: string;
    email: string;
    phone: string;
    password: string;
    subjectId: string;
    gradeId: string;
}

interface TeacherManagementViewProps {
    teachers: Teacher[];
    subjects?: Subject[];

    onAddTeacher: (
        teacher: CreateTeacherInput,
    ) => Promise<void>;

    onUpdateTeacher: (
        teacher: UpdateTeacherAdminInput,
    ) => Promise<void>;

    onUpdateTeacherStatus: (
        id: string,
        status: "active" | "inactive",
    ) => Promise<void>;

    onDeleteTeacher: (
        id: string,
    ) => Promise<void>;
}
export default function TeacherManagementView({
    teachers,
    subjects = [],
    onAddTeacher,
    onUpdateTeacher,
    onUpdateTeacherStatus,
    onDeleteTeacher,
}: TeacherManagementViewProps) {
    const safeTeachers = Array.isArray(teachers)
        ? teachers
        : [];

    const safeSubjects = Array.isArray(subjects)
        ? subjects
        : [];
  // Navigation grid vs list layout
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');

  // Interactive filters and searches
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, subjectFilter, statusFilter]);

  // Interactive Modals and Sidebars state
  const [selectedTeacherForDrawer, setSelectedTeacherForDrawer] = useState<Teacher | null>(null);
  const [teacherForAddModal, setTeacherForAddModal] = useState(false);
  const [teacherForEditModal, setTeacherForEditModal] = useState<Teacher | null>(null);
  const [teacherForLockModal, setTeacherForLockModal] = useState<Teacher | null>(null);
  const [teacherForDeleteModal, setTeacherForDeleteModal] = useState<Teacher | null>(null);

  // Chi tiết giáo viên (câu hỏi, đề thi, luyện tập) lấy từ SQL Server mỗi khi mở drawer.
  const [drawerTab, setDrawerTab] = useState<TeacherDetailTab>('overview');
  const [teacherDetail, setTeacherDetail] = useState<TeacherDetailDto | null>(null);
  const [teacherDetailLoading, setTeacherDetailLoading] = useState(false);
  const [teacherDetailError, setTeacherDetailError] = useState<string | null>(null);
  const [teacherDetailReloadKey, setTeacherDetailReloadKey] = useState(0);

  const drawerTeacherId = selectedTeacherForDrawer?.id;

  React.useEffect(() => {
    setDrawerTab('overview');
  }, [drawerTeacherId]);

  React.useEffect(() => {
    if (!drawerTeacherId) return;

    // Bỏ kết quả trả về muộn nếu người dùng đã đổi giáo viên hoặc đóng drawer.
    let cancelled = false;

    setTeacherDetail(null);
    setTeacherDetailError(null);
    setTeacherDetailLoading(true);

    getTeacherDetail(drawerTeacherId)
      .then((data) => {
        if (!cancelled) setTeacherDetail(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setTeacherDetailError(
            error instanceof Error ? error.message : 'Không thể tải chi tiết giáo viên.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setTeacherDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [drawerTeacherId, teacherDetailReloadKey]);

  const detailView = teacherDetail && teacherDetail.id === drawerTeacherId ? teacherDetail : null;

  // Phân trang các danh sách trong drawer (về trang 1 khi đổi giáo viên).
  const questionPagination = usePagination(detailView?.recentQuestions ?? [], 8, drawerTeacherId);
  const examPagination = usePagination(detailView?.exams ?? [], 8, drawerTeacherId);
  const practiceStudentPagination = usePagination(detailView?.practice.students ?? [], 8, drawerTeacherId);
  const attemptPagination = usePagination(detailView?.practice.recentAttempts ?? [], 8, drawerTeacherId);

  // Notifications State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Form Field State for ADD teacher
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
      subjectId: '',
      gradeId: "",
  });
    const [grades, setGrades] =
        useState<GradeDto[]>([]);

    React.useEffect(() => {
        const loadGrades =
            async () => {
                try {
                    const data =
                        await getGrades();

                    setGrades(data);
                } catch (error) {
                    triggerToast(
                        error instanceof Error
                            ? error.message
                            : "Không tải được danh sách khối lớp.",
                        "warning",
                    );
                }
            };

        void loadGrades();
    }, []);
  // Form Field State for EDIT teacher
    const [editForm, setEditForm] =
        useState({
            email: "",
            subjectId: "",
            gradeId: "",
        });

  // Subjects Mapping for Add/Edit Checkboxes / Selection

    const availableCheckboxes = useMemo(() => {
        return (subjects ?? []).map((subject) => ({
            key: subject.name,
            id: subject.id,
            label: subject.name,
        }));
    }, [subjects]);
  // Helper toaster triggers
  const triggerToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    // Toast toàn cục: cố định phía trên, nằm trên mọi hộp thoại.
    globalToast[type === 'warning' ? 'error' : type](message);
  };

  // Filtered teachers selector
    const filteredTeachers = useMemo(() => {
        return (teachers ?? []).filter((teacher) => {
            const keyword = searchTerm.toLowerCase();

            const matchQuery =
                teacher.name.toLowerCase().includes(keyword) ||
                teacher.email.toLowerCase().includes(keyword) ||
                (teacher.phone ?? "").toLowerCase().includes(keyword);

            const matchSubject =
                subjectFilter === "all" ||
                teacher.subjectId === subjectFilter;

            const matchStatus =
                statusFilter === "all" ||
                teacher.status === statusFilter;

            return matchQuery && matchSubject && matchStatus;
        });
    }, [
        teachers,
        searchTerm,
        subjectFilter,
        statusFilter,
    ]);

  // Paginated teachers
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeachers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeachers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  // Statistics calculation helpers
  const stats = useMemo(() => {
    return {
      total: teachers.length,
      active: teachers.filter(t => t.status === 'active').length,
      locked: teachers.filter(t => t.status === 'inactive').length,
      subjectsCount: subjects.length
    };
  }, [teachers, subjects]);

  // Handle excel export request simulation
  const handleExportExcel = () => {
    triggerToast('Đã xuất thành công danh sách giáo viên ra file Excel!', 'success');
  };

  // Form Submissions
    const handleAddSubmit =
        async (
            e: React.FormEvent,
        ) => {
            e.preventDefault();

            if (
                !addForm.name.trim() ||
                !addForm.email.trim() ||
                !addForm.password.trim() ||
                !addForm.subjectId ||
                !addForm.gradeId
            ) {
                triggerToast(
                    "Vui lòng nhập đầy đủ thông tin bắt buộc.",
                    "warning",
                );

                return;
            }

            // SĐT là tùy chọn, nhưng nếu nhập thì phải đúng 10 chữ số.
            if (addForm.phone.trim() && !isValidPhone(addForm.phone.trim())) {
                triggerToast(PHONE_ERROR_MESSAGE, "warning");

                return;
            }

            try {
                await onAddTeacher({
                    name:
                        addForm.name.trim(),

                    email:
                        addForm.email.trim(),

                    phone:
                        addForm.phone.trim(),

                    password:
                        addForm.password,

                    subjectId:
                        addForm.subjectId,

                    gradeId:
                        addForm.gradeId,
                });

                triggerToast(
                    `Đã tạo tài khoản giáo viên ${addForm.name}.`,
                    "success",
                );

                setTeacherForAddModal(
                    false,
                );

                setAddForm({
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                    subjectId: "",
                    gradeId: "",
                });
            } catch (error) {
                triggerToast(
                    error instanceof Error
                        ? error.message
                        : "Tạo giáo viên thất bại.",
                    "warning",
                );
            }
        };

    const handleOpenEditModal = (
        teacher: Teacher,
    ) => {
        setTeacherForEditModal(
            teacher,
        );

        setEditForm({
            email:
                teacher.email,

            subjectId:
                teacher.subjectId,

            gradeId:
                teacher.gradeId ?? "",
        });
    };
    const handleEditSubmit =
        async (
            e: React.FormEvent,
        ) => {
            e.preventDefault();

            if (!teacherForEditModal) {
                return;
            }

            if (
                !editForm.email.trim() ||
                !editForm.subjectId ||
                !editForm.gradeId
            ) {
                triggerToast(
                    "Vui lòng nhập đầy đủ Email, Môn phụ trách và Khối phụ trách.",
                    "warning",
                );

                return;
            }

            try {
                await onUpdateTeacher({
                    id:
                        teacherForEditModal.id,

                    email:
                        editForm.email.trim(),

                    subjectId:
                        editForm.subjectId,

                    gradeId:
                        editForm.gradeId,
                });

                triggerToast(
                    `Đã cập nhật tài khoản giáo viên ${teacherForEditModal.name}.`,
                    "success",
                );

                setTeacherForEditModal(
                    null,
                );
            } catch (error) {
                triggerToast(
                    error instanceof Error
                        ? error.message
                        : "Cập nhật giáo viên thất bại.",
                    "warning",
                );
            }
        };

    const handleConfirmLock =
        async () => {
            if (
                !teacherForLockModal
            ) {
                return;
            }

            try {
                await onUpdateTeacherStatus(
                    teacherForLockModal.id,
                    "inactive",
                );

                triggerToast(
                    `Đã khóa tài khoản giáo viên ${teacherForLockModal.name}!`,
                    "info",
                );

                if (
                    selectedTeacherForDrawer
                        ?.id ===
                    teacherForLockModal.id
                ) {
                    setSelectedTeacherForDrawer(
                        {
                            ...selectedTeacherForDrawer,
                            status:
                                "inactive",
                        },
                    );
                }

                setTeacherForLockModal(
                    null,
                );
            } catch (error) {
                triggerToast(
                    error instanceof Error
                        ? error.message
                        : "Khóa tài khoản thất bại.",
                    "warning",
                );
            }
        };


    const handleConfirmUnlock =
        async (
            teacher: Teacher,
        ) => {
            try {
                await onUpdateTeacherStatus(
                    teacher.id,
                    "active",
                );

                triggerToast(
                    `Đã mở khóa tài khoản giáo viên ${teacher.name}!`,
                    "success",
                );

                if (
                    selectedTeacherForDrawer
                        ?.id ===
                    teacher.id
                ) {
                    setSelectedTeacherForDrawer(
                        {
                            ...selectedTeacherForDrawer,
                            status:
                                "active",
                        },
                    );
                }
            } catch (error) {
                triggerToast(
                    error instanceof Error
                        ? error.message
                        : "Mở khóa thất bại.",
                    "warning",
                );
            }
        };

    const handleDeleteTrigger =
        async (
            teacher: Teacher,
        ) => {
            try {
                await onDeleteTeacher(
                    teacher.id,
                );

                triggerToast(
                    `Đã xóa tài khoản giáo viên ${teacher.name}!`,
                    "warning",
                );

                if (
                    selectedTeacherForDrawer
                        ?.id ===
                    teacher.id
                ) {
                    setSelectedTeacherForDrawer(
                        null,
                    );
                }

                setTeacherForDeleteModal(
                    null,
                );
            } catch (error) {
                triggerToast(
                    error instanceof Error
                        ? error.message
                        : "Xóa giáo viên thất bại.",
                    "warning",
                );
            }
        };

  const handleResetPasswordSimulate = (teacherName: string) => {
    triggerToast(`Đã gửi đường dẫn đặt lại mật khẩu về email của giáo viên ${teacherName}!`, 'info');
  };

  // Helper UI component to translate subject name into styled chip
  const extractSubjectTag = (_subjectId: string, fallbackName: string) => {
    const normalized = (fallbackName ?? "").trim().toLowerCase();

    let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

    if (normalized.includes("toán")) {
      colorClasses = "bg-blue-50 text-blue-700 border-blue-100";
    } else if (normalized.includes("anh")) {
      colorClasses = "bg-amber-50 text-amber-700 border-amber-100";
    } else if (normalized.includes("vật") || normalized.includes("lý")) {
      colorClasses = "bg-indigo-50 text-indigo-700 border-indigo-100";
    } else if (normalized.includes("hóa")) {
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-100";
    } else if (normalized.includes("sinh")) {
      colorClasses = "bg-rose-50 text-rose-700 border-rose-100";
    } else if (normalized.includes("văn")) {
      colorClasses = "bg-purple-50 text-purple-700 border-purple-100";
    }

    return {
      colorClasses,
      cleanName: fallbackName || "Chưa phân môn",
    };
  };

  return (
    <div className="space-y-6 select-none relative" id="teacher-management-module">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-20 right-8 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3.5 rounded-[12px] shadow-xl border flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toast.type === 'warning'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}>
            <CheckCircle className={`w-5 h-5 shrink-0 ${toast.type === 'success' ? 'text-emerald-500' : toast.type === 'warning' ? 'text-rose-500' : 'text-indigo-500'}`} />
            <span className="text-xs font-bold font-sans">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header section admin layout */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            👨‍🏫 Quản lý giáo viên
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý tài khoản, phân công môn học và theo dõi hoạt động giáo viên.
          </p>
        </div>
        
        {/* Actions bar on the right */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..."
              className="w-48 pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-[12px] text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold text-slate-750 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export button */}
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-[12px] text-xs font-bold transition-all border border-slate-200 shadow-sm cursor-pointer hover:scale-[1.01]"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          {/* Add Teacher Trigger */}
          <button 
            onClick={() => {
                          setAddForm({
                              name: "",
                              email: "",
                              phone: "",
                              password: "",
                              subjectId: "",
                              gradeId: "",
                          });
              setTeacherForAddModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-[12px] text-xs font-bold transition-all border border-indigo-700 shadow-sm hover:shadow-indigo-500/20 cursor-pointer hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm giáo viên</span>
          </button>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="accounting-stats-cards">
        
        {/* Total stats card */}
        <div className="bg-white p-5 rounded-[20px] shadow-xs border border-slate-150 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng giáo viên</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active stats card */}
        <div className="bg-white p-5 rounded-[20px] shadow-xs border border-slate-150 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Đang hoạt động</span>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">{stats.active}</div>
          </div>
          <div className="w-10 h-10 rounded-[14px] bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Locked stats card */}
        <div className="bg-white p-5 rounded-[20px] shadow-xs border border-slate-150 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Đã khóa</span>
            <div className="text-2xl font-black text-amber-600 tracking-tight">{stats.locked}</div>
          </div>
          <div className="w-10 h-10 rounded-[14px] bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* Active tracking count */}
        <div className="bg-white p-5 rounded-[20px] shadow-xs border border-slate-150 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Môn phụ trách</span>
            <div className="text-2xl font-black text-indigo-600 tracking-tight">{stats.subjectsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-[14px] bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>


      </div>

      {/* Advanced Filter and View Switch Toolbar */}
      <div className="bg-white/60 backdrop-blur-md p-3.5 rounded-[16px] shadow-xs border border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Filter by Subject */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Bộ môn:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-[10px] text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500 transition-all shadow-2xs"
            >
              <option value="all">Tất cả môn</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-[10px] text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500 transition-all shadow-2xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang hoạt động</option>
              <option value="inactive">🔴 Đã khóa</option>
            </select>
          </div>
        </div>

        {/* Toggle Grid vs Table Layout selection switches */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-[12px] shrink-0 self-end sm:self-auto">
          <button 
            type="button"
            onClick={() => setLayoutMode('grid')}
            className={`p-1.5 rounded-[8px] transition-all flex items-center gap-1.5 font-bold text-[11px] ${layoutMode === 'grid' ? 'bg-white shadow-2xs text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
            title="Dạng lưới thẻ"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Thẻ</span>
          </button>
          <button 
            type="button"
            onClick={() => setLayoutMode('table')}
            className={`p-1.5 rounded-[8px] transition-all flex items-center gap-1.5 font-bold text-[11px] ${layoutMode === 'table' ? 'bg-white shadow-2xs text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
            title="Dạng bảng sọc"
          >
            <List className="w-3.5 h-3.5" />
            <span>Bản ghi</span>
          </button>
        </div>
      </div>

      {/* Main listing canvas */}
      {filteredTeachers.length > 0 ? (
        layoutMode === 'grid' ? (
          /* Grid Card design layout matching request and aesthetic principles */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="teachers-grid-container">
            {filteredTeachers.map(teacher => {
              const { colorClasses, cleanName } = extractSubjectTag(teacher.subjectId, teacher.subjectName);
              return (
                <div 
                  key={teacher.id}
                  className="bg-white rounded-[24px] border border-slate-150 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group relative"
                >
                  {/* Decorative background circle on card top corner */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-6 -mt-6 opacity-30 group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="p-6 flex-1 space-y-4 relative z-10">
                    
                    {/* Header Avatar and Name representation */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[16px] bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-sm shadow-inner shrink-0 leading-none">
                        {teacher.name.split(' ').pop()?.charAt(0) || 'G'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                          {teacher.name}
                        </h3>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Meta info details */}
                    <div className="space-y-2.5 text-xs">
                      {/* Email representation info */}
                      <div className="flex items-center gap-3 text-slate-650">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-[10px]">📧</span>
                        <span className="truncate font-medium">{teacher.email}</span>
                      </div>

                      {/* Phone representation details */}
                      <div className="flex items-center gap-3 text-slate-650">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-[10px]">📱</span>
                        <span className="font-medium">{teacher.phone}</span>
                      </div>

                      {/* Subject assigned representation tags */}
                      <div className="flex items-center gap-3 text-slate-650">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-[10px]">📚</span>
                        <span className={`px-2 py-0.5 rounded-[6px] border text-[10px] font-bold ${colorClasses}`}>
                          {cleanName}
                        </span>
                      </div>

                      {/* Grade assigned */}
                      <div className="flex items-center gap-3 text-slate-650">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-[10px]">🎓</span>
                        <span className="text-xs font-semibold">
                          {teacher.gradeName ?? "Chưa phân khối"}
                        </span>
                      </div>

                      {/* Live status switch dot indicator */}
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-[10px]">🟢</span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          teacher.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {teacher.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Operational Footer actions button lists requested by user */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-start gap-1">
                    {/* View Drawer trigger */}
                    <button 
                      onClick={() => setSelectedTeacherForDrawer(teacher)}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer"
                      title="Xem hồ sơ giáo viên"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>

                    {/* Edit info trigger */}
                          <button
                              onClick={() =>
                                  handleOpenEditModal(
                                      teacher,
                                  )
                              }
                          >
                              <Edit2 className="w-4 h-4" />
                          </button>

                    {/* Assign mapping trigger */}
                    

                    {/* Account Status Lock / Unlock switcher trigger */}
                    {teacher.status === 'active' ? (
                      <button 
                        onClick={() => setTeacherForLockModal(teacher)}
                        className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-[10px] text-slate-500 hover:text-amber-600 flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer"
                        title="Khóa tài khoản"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Khóa</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConfirmUnlock(teacher)}
                        className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-[10px] text-slate-500 hover:text-emerald-650 flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer"
                        title="Mở khóa tài khoản"
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mở khóa</span>
                      </button>
                    )}

                    {/* Delete action trigger */}
                    <button 
                      onClick={() => setTeacherForDeleteModal(teacher)}
                      className="p-1.5 hover:bg-rose-50 hover:text-rose-600 border border-transparent rounded-[10px] text-slate-400 flex items-center gap-1 text-[11px] font-bold ml-auto transition-all cursor-pointer"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* Table listing view alternative layout */
          <div className="bg-white border border-slate-150 rounded-[20px] shadow-xs overflow-hidden" id="teachers-table-box">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Giáo viên</th>
                    <th className="py-4 px-6">Thông tin liên hệ</th>
                    <th className="py-4 px-6">Môn / Khối</th>
                    <th className="py-4 px-6">Hoạt động đóng góp</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map(teacher => {
                    const { colorClasses, cleanName } = extractSubjectTag(teacher.subjectId, teacher.subjectName);
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                        
                        {/* Profile with Initial */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-xs">
                              {teacher.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{teacher.name}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contacts */}
                        <td className="py-3.5 px-6">
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <p className="font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 inline" /> {teacher.email}</p>
                            <p className="text-slate-400 text-[11px] flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400 inline" /> {teacher.phone}</p>
                          </div>
                        </td>

                        {/* Subject + Grade */}
                        <td className="py-3.5 px-6">
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] border text-[10px] font-black uppercase ${colorClasses}`}>
                              {cleanName}
                            </span>
                            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {teacher.gradeName ?? "Chưa phân khối"}
                            </p>
                          </div>
                        </td>
                        {/* Contributed stats */}
                        <td className="py-3.5 px-6">
                          <div className="text-xs space-y-0.5">
                            <p className="text-slate-700 font-medium">📚 Câu hỏi: <span className="font-bold text-indigo-650">{teacher.questionsContributed}</span></p>
                            <p className="text-slate-400 text-[11px]">📝 Đề thi: <span className="font-bold">{teacher.examsCreated}</span></p>
                          </div>
                        </td>

                        {/* Status Label */}
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            teacher.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {teacher.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                          </span>
                        </td>

                        {/* Table Operations */}
                        <td className="py-3.5 px-6 text-right relative">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => setSelectedTeacherForDrawer(teacher)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(teacher)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cập nhật tài khoản"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                           
                            {teacher.status === 'active' ? (
                              <button 
                                onClick={() => setTeacherForLockModal(teacher)}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Khóa tài khoản"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleConfirmUnlock(teacher)}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mở khóa hoạt động"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => setTeacherForDeleteModal(teacher)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa giáo viên"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Table pagination stats footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-500">Hiển thị {filteredTeachers.length} trong tổng số {teachers.length} giáo viên</span>
              <span className="font-semibold uppercase tracking-wider text-[10px]">Hệ thống bảng quản trị</span>
            </div>
          </div>
        )
      ) : (
        /* Empty states */
        <div className="bg-white/60 border border-dashed border-slate-200 rounded-[24px] py-16 text-center shadow-2xs">
          <GraduationCap className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 tracking-tight">Không tìm thấy giáo viên nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 font-medium">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc các tiêu chí bộ lọc môn học ở trên.
          </p>
        </div>
      )}

      {/* ==================== A. DRWER VIEW MEMBER PROFILE ==================== */}
      {selectedTeacherForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="teacher-profile-drawer">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedTeacherForDrawer(null)}></div>
          
          <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-150">
              
              {/* Drawer Toolbar header panel */}
              <div className="px-6 py-5 border-b border-indigo-700/20 flex items-center justify-between bg-indigo-650 text-white shrink-0 relative overflow-hidden">
                {/* Decorative mesh circle */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                
                <div className="flex items-center gap-3 z-10 relative">
                  <div className="w-10 h-10 rounded-[12px] bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-sm border border-white/25">
                    MT
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base tracking-tight leading-none flex items-center gap-1.5">
                      👨‍🏫 Hồ sơ giáo viên
                    </h2>
                    <p className="text-[10px] text-indigo-200/90 font-medium tracking-wide mt-1 uppercase font-mono">Bản ghi quản trị</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedTeacherForDrawer(null)}
                  className="rounded-[10px] hover:bg-white/10 p-2 text-white/80 hover:text-white transition-colors cursor-pointer z-10 relative border border-white/10 bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer scrollable content stage */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/40">
                
                {/* Avatar Banner profile details card */}
                <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-2xs flex items-center gap-4 relative overflow-hidden">
                  <div className="w-14 h-14 rounded-[20px] bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-lg shrink-0 shadow-inner">
                    {selectedTeacherForDrawer.name.split(' ').pop()?.charAt(0) || 'G'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight truncate">{selectedTeacherForDrawer.name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${
                        selectedTeacherForDrawer.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedTeacherForDrawer.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {selectedTeacherForDrawer.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {extractSubjectTag(selectedTeacherForDrawer.subjectId, selectedTeacherForDrawer.subjectName).cleanName}
                        {selectedTeacherForDrawer.gradeName ? ` • ${selectedTeacherForDrawer.gradeName}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab selector */}
                <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 pb-1.5 text-xs">
                  {TEACHER_DETAIL_TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDrawerTab(tab.key)}
                      className={`px-3.5 py-2 font-bold shrink-0 rounded-lg transition-colors cursor-pointer ${
                        drawerTab === tab.key
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ---------- TAB: TỔNG QUAN ---------- */}
                {drawerTab === 'overview' && (
                  <div className="space-y-5">
                    <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-2xs space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email:</span>
                        <span className="font-bold text-slate-800 text-sm break-all flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {selectedTeacherForDrawer.email}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SĐT:</span>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {selectedTeacherForDrawer.phone || 'Chưa cập nhật'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Môn phụ trách:</span>
                          <span className="font-bold text-indigo-700 text-sm flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-555" />
                            {extractSubjectTag(selectedTeacherForDrawer.subjectId, selectedTeacherForDrawer.subjectName).cleanName}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Khối phụ trách:</span>
                          <span className="font-bold text-indigo-700 text-sm flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            {selectedTeacherForDrawer.gradeName ?? "Chưa phân khối"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ngày tham gia:</span>
                        <span className="font-bold text-slate-700 text-xs flex items-center gap-2 font-mono">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(selectedTeacherForDrawer.joinedDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-2xs space-y-4">
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        THỐNG KÊ HOẠT ĐỘNG
                      </h4>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {[
                          { icon: '📚', label: 'Câu hỏi đã tạo', value: detailView ? detailView.questionsCount : selectedTeacherForDrawer.questionsContributed, unit: 'câu', tab: 'questions' as const },
                          { icon: '📝', label: 'Đề thi đã tạo', value: detailView ? detailView.examsCount : selectedTeacherForDrawer.examsCreated, unit: 'đề', tab: 'exams' as const },
                          { icon: '🎯', label: 'Lượt luyện tập của học sinh', value: detailView ? detailView.practice.attemptsCount : null, unit: 'lượt', tab: 'practice' as const },
                          { icon: '✅', label: 'Lượt nộp bài thi', value: detailView ? detailView.examSubmissionsCount : null, unit: 'lượt', tab: 'exams' as const },
                          { icon: '🎓', label: `Học sinh ${selectedTeacherForDrawer.gradeName ?? 'cùng khối'}`, value: detailView ? detailView.studentsCount : null, unit: 'học sinh', tab: 'practice' as const },
                        ].map(card => (
                          <button
                            key={card.label}
                            type="button"
                            onClick={() => setDrawerTab(card.tab)}
                            className="text-left bg-slate-50/60 hover:bg-indigo-50/60 p-3.5 rounded-[12px] border border-slate-100 transition-colors cursor-pointer space-y-1"
                          >
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                              <span>{card.icon}</span>
                              {card.label}
                            </span>
                            <span className="font-black text-slate-800 text-sm block">
                              {card.value === null ? '…' : `${card.value.toLocaleString('en-US')} ${card.unit}`}
                            </span>
                          </button>
                        ))}
                      </div>

                      {teacherDetailError && (
                        <p className="text-[11px] font-bold text-rose-600">
                          Không tải được số liệu chi tiết: {teacherDetailError}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------- CÁC TAB DỮ LIỆU: tải từ API ---------- */}
                {drawerTab !== 'overview' && (
                  teacherDetailLoading && !detailView ? (
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 text-slate-500 text-center text-xs font-semibold flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                      Đang tải dữ liệu từ hệ thống...
                    </div>
                  ) : teacherDetailError ? (
                    <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-3">
                      <p className="text-xs font-bold text-rose-700">{teacherDetailError}</p>
                      <button
                        onClick={() => setTeacherDetailReloadKey(key => key + 1)}
                        className="px-3.5 py-1.5 bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : detailView ? (
                    <>
                      {/* ---------- TAB: CÂU HỎI ---------- */}
                      {drawerTab === 'questions' && (
                        <div className="space-y-4">
                          <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-2xs space-y-3">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                              Độ khó ({detailView.questionsCount.toLocaleString('en-US')} câu hỏi)
                            </p>
                            {detailView.questionsCount === 0 ? (
                              <p className="text-xs text-slate-500">Giáo viên chưa tạo câu hỏi nào.</p>
                            ) : (
                              <div className="space-y-2">
                                {[
                                  { label: 'Dễ', value: detailView.questionsByDifficulty.easy, bar: 'bg-emerald-500' },
                                  { label: 'Trung bình', value: detailView.questionsByDifficulty.medium, bar: 'bg-amber-500' },
                                  { label: 'Khó', value: detailView.questionsByDifficulty.hard, bar: 'bg-rose-500' },
                                  ...(detailView.questionsByDifficulty.other > 0
                                    ? [{ label: 'Khác', value: detailView.questionsByDifficulty.other, bar: 'bg-slate-400' }]
                                    : []),
                                ].map(item => (
                                  <div key={item.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                      <span>{item.label}</span>
                                      <span>{item.value.toLocaleString('en-US')} câu ({Math.round((item.value / detailView.questionsCount) * 100)}%)</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                      <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${(item.value / detailView.questionsCount) * 100}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {detailView.recentQuestions.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Câu hỏi mới nhất</p>
                              {questionPagination.pageItems.map(question => (
                                <div key={question.id} className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                                  <p className="font-bold text-slate-800 line-clamp-2">{question.noiDung}</p>
                                  <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span className="text-slate-400 font-bold truncate">
                                      {question.topicName || 'Chưa gắn chuyên đề'}
                                      {' • '}
                                      {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full font-black shrink-0 ${
                                      question.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                                      question.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                      {DIFFICULTY_LABELS[question.difficulty] ?? 'Trung bình'}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              <Pagination
                                page={questionPagination.page}
                                pageSize={questionPagination.pageSize}
                                total={questionPagination.total}
                                onPageChange={questionPagination.setPage}
                                itemLabel="câu hỏi"
                              />
                              {detailView.questionsCount > detailView.recentQuestions.length && (
                                <p className="text-[10px] text-center text-slate-400 font-bold">
                                  Hiển thị {detailView.recentQuestions.length} câu mới nhất, còn {(detailView.questionsCount - detailView.recentQuestions.length).toLocaleString('en-US')} câu hỏi khác.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ---------- TAB: ĐỀ THI ---------- */}
                      {drawerTab === 'exams' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {(['published', 'pending', 'rejected', 'draft'] as const).map(status => (
                              <div key={status} className="bg-white px-3 py-2.5 rounded-xl border border-slate-100 space-y-0.5">
                                <span className={`font-bold block ${EXAM_STATUS_META[status].text}`}>{EXAM_STATUS_META[status].label}</span>
                                <span className="font-extrabold text-slate-800 text-sm">{detailView.examsByStatus[status]}</span>
                              </div>
                            ))}
                          </div>

                          {detailView.exams.length === 0 ? (
                            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-500 text-center text-xs">
                              Giáo viên chưa tạo đề thi nào.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {examPagination.pageItems.map(exam => (
                                <div key={exam.id} className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="font-bold text-slate-800 min-w-0 break-words">{exam.tenBaiKT}</p>
                                    <span className={`shrink-0 font-black text-[10px] ${EXAM_STATUS_META[exam.status].text}`}>
                                      {EXAM_STATUS_META[exam.status].label}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-bold">
                                    {exam.thoiLuong} phút • {exam.totalQuestions} câu • {exam.submissionsCount} lượt nộp
                                    {exam.averageScore !== null && ` • ĐTB ${exam.averageScore.toFixed(1)}/10`}
                                  </p>
                                  {exam.rejectionNote && (
                                    <p className="text-[10px] text-rose-600 bg-rose-50 rounded-lg px-2.5 py-1.5 font-semibold">
                                      Lý do từ chối: {exam.rejectionNote}
                                    </p>
                                  )}
                                </div>
                              ))}

                              <Pagination
                                page={examPagination.page}
                                pageSize={examPagination.pageSize}
                                total={examPagination.total}
                                onPageChange={examPagination.setPage}
                                itemLabel="đề thi"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* ---------- TAB: LUYỆN TẬP ---------- */}
                      {drawerTab === 'practice' && (
                        <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Luyện tập theo chuyên đề của môn {detailView.tenMH ?? 'chưa phân môn'} – {detailView.tenKhoi ?? 'chưa phân khối'},
                            do học sinh cùng khối thực hiện.
                          </p>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {[
                              { label: 'Lượt luyện tập', value: detailView.practice.attemptsCount.toLocaleString('en-US') },
                              { label: 'Học sinh đã luyện', value: `${detailView.practice.studentsCount}/${detailView.studentsCount}` },
                              { label: 'Chuyên đề đã luyện', value: `${detailView.practice.practicedTopicsCount}/${detailView.practice.totalTopicsCount}` },
                              { label: 'Điểm trung bình', value: detailView.practice.averageScore === null ? 'Chưa có' : `${detailView.practice.averageScore.toFixed(1)}/10` },
                            ].map(card => (
                              <div key={card.label} className="bg-white p-3 rounded-2xl border border-slate-100 space-y-0.5">
                                <span className="text-slate-400 font-semibold block">{card.label}</span>
                                <p className="font-extrabold text-slate-800 text-sm">{card.value}</p>
                              </div>
                            ))}
                          </div>

                          {detailView.practice.attemptsCount === 0 ? (
                            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-500 text-center text-xs">
                              Chưa có học sinh nào luyện tập môn này.
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Học sinh luyện tập</p>
                                {practiceStudentPagination.pageItems.map(student => (
                                  <div key={student.studentId} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-700">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 truncate">{student.studentName || 'Chưa có tên'}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                                        {student.maHS}
                                        {student.lastSubmittedAt && ` • gần nhất ${new Date(student.lastSubmittedAt).toLocaleDateString('vi-VN')}`}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0 text-[10px] font-bold text-slate-500 space-y-0.5">
                                      <p>{student.attemptsCount} lượt • {student.practicedTopicsCount} chuyên đề</p>
                                      <p className="text-indigo-600">ĐTB {student.averageScore.toFixed(1)}/10</p>
                                    </div>
                                  </div>
                                ))}

                                <Pagination
                                  page={practiceStudentPagination.page}
                                  pageSize={practiceStudentPagination.pageSize}
                                  total={practiceStudentPagination.total}
                                  onPageChange={practiceStudentPagination.setPage}
                                  itemLabel="học sinh"
                                />
                                {detailView.practice.studentsCount > detailView.practice.students.length && (
                                  <p className="text-[10px] text-center text-slate-400 font-bold">
                                    Hiển thị {detailView.practice.students.length} học sinh luyện nhiều nhất.
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Lượt luyện tập gần đây</p>
                                {attemptPagination.pageItems.map(attempt => (
                                  <div key={attempt.attemptId} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-700">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 truncate">{attempt.topicName}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                                        {attempt.studentName || 'Học sinh'} • {new Date(attempt.submittedAt).toLocaleString('vi-VN')}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0 text-[10px] font-bold space-y-0.5">
                                      <p className="text-indigo-600">{attempt.score.toFixed(1)}/10</p>
                                      <p className="text-slate-400">{attempt.correctAnswers}/{attempt.totalQuestions} đúng</p>
                                    </div>
                                  </div>
                                ))}

                                <Pagination
                                  page={attemptPagination.page}
                                  pageSize={attemptPagination.pageSize}
                                  total={attemptPagination.total}
                                  onPageChange={attemptPagination.setPage}
                                  itemLabel="lượt luyện tập"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : null
                )}

              </div>

              {/* Drawer footer operational buttons block */}
              <div className="p-6 bg-slate-50 border-t border-slate-150 flex flex-col gap-2.5 shrink-0">
                {/* Account status lock / unlock action */}
                {selectedTeacherForDrawer.status === 'active' ? (
                  <button 
                    onClick={() => {
                      setTeacherForLockModal(selectedTeacherForDrawer);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 font-bold text-xs rounded-[14px] transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Khóa tài khoản</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConfirmUnlock(selectedTeacherForDrawer)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-[14px] transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Mở khóa tài khoản</span>
                  </button>
                )}

                {/* Reset credential trigger requested */}
                <button 
                  onClick={() => handleResetPasswordSimulate(selectedTeacherForDrawer.name)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-[14px] transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  <span>Reset mật khẩu</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================== B. MODAL: THÊM GIÁO VIÊN ==================== */}
      {teacherForAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" id="add-teacher-modal">
          <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Header branding block */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-9 h-9 rounded-[12px] bg-indigo-100 text-indigo-600 flex items-center justify-center">
                   <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">➕ Thêm giáo viên</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tạo tài khoản giáo viên mới</p>
                </div>
              </div>
              <button 
                onClick={() => setTeacherForAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[10px] hover:bg-slate-200 transition-colors cursor-pointer bg-white border border-slate-100 shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fields form submission */}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                
                {/* Full name input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên đầy đủ (VD: Nguyễn Văn A)"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-4 py-3 text-xs border border-slate-200 rounded-[12px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold bg-slate-50 text-slate-850 focus:bg-white"
                  />
                </div>

                {/* Email address input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-4 py-3 text-xs border border-slate-200 rounded-[12px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold bg-slate-50 text-slate-850 focus:bg-white"
                  />
                </div>

                {/* Phone contact input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Số điện thoại</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0901234567"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: sanitizePhoneInput(e.target.value) })}
                    className="w-full px-4 py-3 text-xs border border-slate-200 rounded-[12px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold bg-slate-50 text-slate-850 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    Số điện thoại gồm đúng 10 chữ số. Admin nhập số ban đầu; sau khi tài khoản được tạo, giáo viên tự cập nhật số điện thoại trong Hồ sơ cá nhân.
                  </p>
                </div>

                {/* Initial access temporary password requested */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu khởi tạo tài khoản"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-4 py-3 text-xs border border-slate-200 rounded-[12px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-bold tracking-widest bg-slate-50 text-slate-850 focus:bg-white"
                  />
                </div>

                {/* Subject picker selector dropdown checkable list asked in user request */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Môn học phụ trách *</label>
                  
                  {/* Select Dropdown representation containing option checkboxes */}
                  <div className="bg-slate-50 p-4 rounded-[14px] border border-slate-150 grid grid-cols-2 gap-3">
                    {availableCheckboxes.map((item) => (
                      <label 
                        key={item.id} 
                        className={`flex items-center gap-2.5 p-2 rounded-[10px] border cursor-pointer select-none transition-colors ${
                          addForm.subjectId === item.id 
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700 font-bold' 
                            : 'border-slate-150 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addSubjectAssigned"
                          checked={addForm.subjectId === item.id}
                          onChange={() => setAddForm({ ...addForm, subjectId: item.id })}
                          className="rounded-full text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span className="text-xs">{item.key}</span>
                      </label>
                    ))}
                  </div>
                </div>
                              <div className="space-y-2 border-t border-slate-100 pt-3">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                      Khối phụ trách *
                                  </label>

                                  <select
                                      required
                                      value={
                                          addForm.gradeId
                                      }
                                      onChange={(e) =>
                                          setAddForm({
                                              ...addForm,

                                              gradeId:
                                                  e.target.value,
                                          })
                                      }
                                      className="
            w-full
            px-4 py-3
            text-xs
            border border-slate-200
            rounded-xl
            bg-slate-50
            outline-none
            focus:border-indigo-500
        "
                                  >
                                      <option value="">
                                          -- Chọn khối lớp --
                                      </option>

                                      {grades.map(
                                          (grade) => (
                                              <option
                                                  key={grade.id}
                                                  value={grade.id}
                                              >
                                                  {grade.tenKhoi}
                                              </option>
                                          ),
                                      )}
                                  </select>
                              </div>
              </div>

              {/* Action operations controls footer */}
              <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-[24px]">
                <button
                  type="button"
                  onClick={() => setTeacherForAddModal(false)}
                  className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs bg-white border border-slate-200 hover:bg-slate-50 rounded-[12px] transition-colors cursor-pointer shadow-sm shadow-slate-100 active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-bold text-xs rounded-[12px] transition-colors cursor-pointer shadow-sm shadow-indigo-100 active:scale-[0.98]"
                >
                  Lưu
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==================== C. MODAL: SỬA HỒ SƠ GIÁO VIÊN ==================== */}
      {teacherForEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" id="edit-teacher-modal">
          <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-9 h-9 rounded-[12px] bg-indigo-100 text-indigo-600 flex items-center justify-center">
                   <Edit2 className="w-4 h-4" />
                </div>
                <div>
                                  <h3 className="font-extrabold text-base text-slate-800">
                                      ✏️ Cập nhật tài khoản giáo viên
                                  </h3>

                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                      Email và phân công chuyên môn
                                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTeacherForEditModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[10px] hover:bg-slate-200 transition-colors cursor-pointer bg-white border border-slate-100 shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-500">
                                      Họ và tên
                                  </label>

                                  <input
                                      type="text"
                                      value={
                                          teacherForEditModal.name
                                      }
                                      disabled
                                      className="
            w-full
            px-4 py-3
            rounded-xl
            border border-slate-200
            bg-slate-100
            text-slate-500
            cursor-not-allowed
        "
                                  />

                                  <p className="text-[10px] text-slate-400">
                                      Họ tên được xác lập khi tạo tài khoản
                                      và không thể tự thay đổi.
                                  </p>
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-600">
                                      Email *
                                  </label>

                                  <input
                                      type="email"
                                      required
                                      value={editForm.email}
                                      onChange={(e) =>
                                          setEditForm({
                                              ...editForm,
                                              email:
                                                  e.target.value,
                                          })
                                      }
                                      className="
            w-full
            px-4 py-3
            rounded-xl
            border border-slate-200
            bg-white
            outline-none
            focus:border-indigo-500
        "
                                  />
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-500">
                                      Số điện thoại
                                  </label>

                                  <input
                                      type="text"
                                      value={
                                          teacherForEditModal.phone
                                      }
                                      disabled
                                      className="
            w-full
            px-4 py-3
            rounded-xl
            border border-slate-200
            bg-slate-100
            text-slate-500
            cursor-not-allowed
        "
                                  />

                                  <p className="text-[10px] text-slate-400">
                                      Giáo viên tự cập nhật
                                      số điện thoại trong Hồ sơ cá nhân.
                                  </p>
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-600">
                                      Môn phụ trách *
                                  </label>

                                  <select
                                      required
                                      value={
                                          editForm.subjectId
                                      }
                                      onChange={(e) =>
                                          setEditForm({
                                              ...editForm,

                                              subjectId:
                                                  e.target.value,
                                          })
                                      }
                                      className="
            w-full
            px-4 py-3
            rounded-xl
            border border-slate-200
            bg-white
            outline-none
            focus:border-indigo-500
        "
                                  >
                                      <option value="">
                                          -- Chọn môn học --
                                      </option>

                                      {subjects.map(
                                          (subject) => (
                                              <option
                                                  key={
                                                      subject.id
                                                  }
                                                  value={
                                                      subject.id
                                                  }
                                              >
                                                  {
                                                      subject.name
                                                  }
                                              </option>
                                          ),
                                      )}
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-600">
                                      Khối phụ trách *
                                  </label>

                                  <select
                                      required
                                      value={
                                          editForm.gradeId
                                      }
                                      onChange={(e) =>
                                          setEditForm({
                                              ...editForm,

                                              gradeId:
                                                  e.target.value,
                                          })
                                      }
                                      className="
            w-full
            px-4 py-3
            rounded-xl
            border border-slate-200
            bg-white
            outline-none
            focus:border-indigo-500
        "
                                  >
                                      <option value="">
                                          -- Chọn khối lớp --
                                      </option>

                                      {grades.map(
                                          (grade) => (
                                              <option
                                                  key={grade.id}
                                                  value={grade.id}
                                              >
                                                  {
                                                      grade.tenKhoi
                                                  }
                                              </option>
                                          ),
                                      )}
                                  </select>
                              </div>
              </div>

              <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-[24px]">
                <button
                  type="button"
                  onClick={() => setTeacherForEditModal(null)}
                  className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs bg-white border border-slate-200 hover:bg-slate-50 rounded-[12px] transition-colors cursor-pointer shadow-sm shadow-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-bold text-xs rounded-[12px] transition-colors cursor-pointer shadow-sm shadow-indigo-100"
                >
                  Lưu
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

     

      {/* ==================== E. MODAL: LOCK ACCOUNT ==================== */}
      {teacherForLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" id="lock-teacher-modal">
          <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-200">
            
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base mb-1">🔒 Khóa tài khoản giáo viên</h3>
              <p className="text-slate-500 text-xs mb-5 font-medium leading-relaxed">
                Bạn có chắc muốn khóa tài khoản của giáo viên <strong>{teacherForLockModal.name}</strong>?
              </p>

              {/* Alert items matching specifications list */}
              <div className="text-left bg-slate-50 p-4 rounded-[16px] text-xs text-slate-600 space-y-2.5 mb-5 border border-slate-100/85">
                <p className="font-bold text-slate-700 mb-1.5 uppercase tracking-wide text-[10px]">Sau khi khóa:</p>
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 shrink-0 font-bold">✓</span>
                  <p className="font-medium">Không thể đăng nhập</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 shrink-0 font-bold">✓</span>
                  <p className="font-medium">Không thể tạo đề thi</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 shrink-0 font-bold">✓</span>
                  <p className="font-medium">Không thể tạo câu hỏi</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTeacherForLockModal(null)}
                  className="flex-1 py-3 text-slate-500 font-bold text-xs bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs rounded-[12px] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLock}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-[12px] transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  Khóa
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== F. MODAL: DELETE TEACHER ==================== */}
      {teacherForDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" id="delete-teacher-modal">
          <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl border border-red-150 animate-in zoom-in-95 duration-200">
            
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base mb-1">🗑 Xóa tài khoản giáo viên</h3>
              <p className="text-slate-500 text-xs mb-5 font-semibold">
                Xác nhận xóa tài khoản của giáo viên <span className="text-rose-600 font-black">{teacherForDeleteModal.name}</span>?
              </p>
              
              <div className="text-left bg-rose-50/40 p-4 rounded-[16px] text-xs text-rose-850 mb-5 border border-rose-100 space-y-1">
                <p className="font-bold uppercase tracking-wide text-[9px] text-rose-800">CẢNH BÁO:</p>
                <p className="font-semibold text-slate-600">Thao tác xóa là vĩnh viễn không thể khôi phục lại.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTeacherForDeleteModal(null)}
                  className="flex-1 py-3 text-slate-500 font-bold text-xs bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs rounded-[12px] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTrigger(teacherForDeleteModal)}
                  className="flex-1 py-3 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded-[12px] transition-colors cursor-pointer shadow-sm shadow-rose-650/20 bg-rose-600"
                >
                  Xóa
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
