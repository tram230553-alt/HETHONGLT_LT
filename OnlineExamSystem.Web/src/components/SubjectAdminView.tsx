import { toast as globalToast } from '../services/toast';
import React, {
    useState,
    useMemo,
    useEffect,
} from "react";

import {
    Plus,
    Search,
    Download,
    Eye,
    Edit3,
    EyeOff,
    Trash2,
    X,
    BookOpen,
    AlertTriangle,
} from "lucide-react";

import {
    motion,
    AnimatePresence,
} from "motion/react";

import {
    Subject,
    Topic,
    Question,
    Exam,
    Teacher,
    Student,
} from "../types";

import {
    SubjectDto,
    SubjectDetailDto,
    getSubjects,
    getSubjectDetail,
    createSubject,
    updateSubject,
    deleteSubject,
} from "../services/subjectService";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from "recharts";
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

interface SubjectAdminViewProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  teachers: Teacher[];
  students: Student[];
}

const EMOJI_ICON_MAP: Record<string, string> = {
  Calculator: '📐',
  Languages: '🇬🇧',
  Atom: '⚛️',
  FlaskConical: '🧪',
  Dna: '🧬',
  BookOpen: '📖'
};

const COLOR_MAP: Record<string, string> = {
  Calculator: '#4F46E5', // indigo
  Languages: '#0EA5E9',  // sky
  Atom: '#8B5CF6',       // violet
  FlaskConical: '#F59E0B', // amber
  Dna: '#10B981',       // emerald
  BookOpen: '#EF4444'    // red
};
type DetailTab = 'chapters' | 'topics' | 'teachers' | 'questions' | 'exams' | 'stats';

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'chapters', label: 'Chương' },
  { key: 'topics', label: 'Chuyên đề' },
  { key: 'teachers', label: 'Giáo viên' },
  { key: 'questions', label: 'Câu hỏi' },
  { key: 'exams', label: 'Đề thi' },
  { key: 'stats', label: 'Thống kê' },
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

const CHART_COLORS = ['#4F46E5', '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

function mapSubjectDtoToSubject(
    dto: SubjectDto,
): Subject {
    return {
        id: dto.id,

        name: dto.tenMH,

        // Backend hiện chưa có MaMonHoc.
        // Tạm tạo mã giao diện từ Guid.
        code:
            "MH-" +
            dto.id
                .replaceAll("-", "")
                .slice(0, 6)
                .toUpperCase(),

        chaptersCount: dto.chaptersCount,
        topicsCount: dto.topicsCount,
        questionsCount: dto.questionsCount,
        examsCount: dto.examsCount,
        studentsCount: dto.studentsCount,

        status: "active",

        icon: "BookOpen",
    };
}
export default function SubjectAdminView({
  subjects,
  setSubjects,
  topics,
  setTopics,
  questions,
  setQuestions,
  exams,
  setExams,
  teachers,
  students
}: SubjectAdminViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHideModalOpen, setIsHideModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form input states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIcon, setFormIcon] = useState('Calculator');
  const [formColor, setFormColor] = useState('#4F46E5');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  
  // Selected Subject for detail or operations
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('topics');

  // Chi tiết môn học lấy từ SQL Server mỗi khi mở drawer.
  const [detail, setDetail] = useState<SubjectDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    // Toast toàn cục: cố định phía trên, nằm trên mọi hộp thoại.
    globalToast[type](message);
  };
    const loadSubjectsFromApi =
        async () => {
            try {
                const data =
                    await getSubjects();

                setSubjects((current) =>
                    data.map((dto) => {
                        const existing =
                            current.find(
                                (item) =>
                                    item.id ===
                                    dto.id,
                            );

                        const mapped =
                            mapSubjectDtoToSubject(
                                dto,
                            );

                        if (!existing) {
                            return mapped;
                        }

                        return {
                            ...mapped,

                            // Giữ metadata UI nếu đã có.
                            code:
                                existing.code ||
                                mapped.code,

                            icon:
                                existing.icon ||
                                mapped.icon,

                            status:
                                existing.status ??
                                mapped.status,

                            // Thống kê luôn lấy lại từ SQL Server, không giữ số 0 cũ.
                            chaptersCount: mapped.chaptersCount,
                            topicsCount: mapped.topicsCount,
                            questionsCount: mapped.questionsCount,
                            examsCount: mapped.examsCount,
                            studentsCount: mapped.studentsCount,
                        };
                    }),
                );
            } catch (error) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : "Không thể tải danh sách môn học.",
                    "error",
                );
            }
        };

    useEffect(() => {
        void loadSubjectsFromApi();
    }, []); 
    
   
   

  const selectedSubjectId = selectedSubject?.id;

  useEffect(() => {
    if (!isDetailOpen || !selectedSubjectId) return;

    // Bỏ kết quả trả về muộn nếu người dùng đã đổi sang môn khác hoặc đóng drawer.
    let cancelled = false;

    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    getSubjectDetail(selectedSubjectId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setDetailError(
            error instanceof Error ? error.message : 'Không thể tải chi tiết môn học.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isDetailOpen, selectedSubjectId, detailReloadKey]);

  const detailView = detail && detail.id === selectedSubjectId ? detail : null;

  // Biểu đồ: các chuyên đề có nhiều câu hỏi nhất.
  const topicChartData = useMemo(() => {
    if (!detailView) return [];

    return [...detailView.topics]
      .filter((topic) => topic.questionsCount > 0)
      .sort((a, b) => b.questionsCount - a.questionsCount)
      .slice(0, 8)
      .map((topic) => ({
        name: topic.name.length > 16 ? `${topic.name.slice(0, 16)}...` : topic.name,
        count: topic.questionsCount,
      }));
  }, [detailView]);

  // Phân trang các danh sách trong drawer chi tiết (về trang 1 khi đổi môn học).
  const chapterPagination = usePagination(detailView?.chapters ?? [], 8, selectedSubjectId);
  const topicPagination = usePagination(detailView?.topics ?? [], 8, selectedSubjectId);
  const teacherPagination = usePagination(detailView?.teachers ?? [], 8, selectedSubjectId);
  const questionPagination = usePagination(detailView?.recentQuestions ?? [], 8, selectedSubjectId);
  const examPagination = usePagination(detailView?.exams ?? [], 8, selectedSubjectId);

  // Delete modal delete text check
  const [deleteInputText, setDeleteInputText] = useState('');

  // 1. Helper to retrieve subject precise scaled stats for UI matching
    const getSubjectStats = useMemo(() => {
        return (subject: Subject) => {
            const subjectQuestions =
                questions.filter(
                    (q) =>
                        q.subjectId ===
                        subject.id,
                ).length;

            const subjectExams =
                exams.filter(
                    (e) =>
                        e.subjectId ===
                        subject.id,
                ).length;

            const subjectTeachers =
                teachers.filter(
                    (t) =>
                        t.subjectId ===
                        subject.id,
                ).length;

          

            const subjectTopics =
                topics.filter(
                    (t) =>
                        t.subjectId ===
                        subject.id,
                );

            return {
                chaptersCount: subject.chaptersCount,

                topicsCount: subject.topicsCount,

                questionsCount: subject.questionsCount,

                examsCount: subject.examsCount ?? subjectExams,

                teachersCount:
                    subjectTeachers,

                studentsCount: subject.studentsCount ?? 0,

                emoji:
                    EMOJI_ICON_MAP[
                    subject.icon
                    ] || "📚",

                color:
                    COLOR_MAP[
                    subject.icon
                    ] || "#6366F1",
            };
        };
    }, [
        questions,
        exams,
        teachers,
     
        topics,
    ]);

  // Overall quick statistics calculation
  const statsSummary = useMemo(() => {
    const total = subjects.length;
    const active = subjects.filter(s => s.status === 'active').length;
    const inactive = total - active;
    
    // Dynamic sum count of questions
    const totalQuestionsSum = subjects.reduce((sum, s) => {
      const scale = getSubjectStats(s);
      return sum + scale.questionsCount;
    }, 0);

    return {
      total,
      active,
      inactive,
      totalQuestions: totalQuestionsSum
    };
  }, [subjects, getSubjectStats]);

  // Filtered Subject List
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [subjects, searchTerm]);

  // Phân trang lưới môn học (về trang 1 khi đổi từ khóa tìm kiếm).
  const subjectPagination = usePagination(filteredSubjects, 9, searchTerm);

  // CRUD handlers
  const handleOpenAddModal = () => {
    setFormName('');
    setFormCode('');
    setFormIcon('Calculator');
    setFormColor('#4F46E5');
    setFormDesc('');
    setFormStatus('active');
    setIsAddModalOpen(true);
  };

    const handleCreateSubject =
        async (
            e: React.FormEvent,
        ) => {
            e.preventDefault();

            if (!formName.trim()) {
                showToast(
                    "Vui lòng nhập tên môn học!",
                    "error",
                );
                return;
            }

            try {
                const newId =
                    await createSubject(
                        formName.trim(),
                    );

                const newSubject: Subject = {
                    id: newId,

                    name:
                        formName.trim(),

                    code:
                        formCode
                            .trim()
                            .toUpperCase() ||
                        "MH-" +
                        newId
                            .replaceAll(
                                "-",
                                "",
                            )
                            .slice(0, 6)
                            .toUpperCase(),

                    chaptersCount: 0,
                    topicsCount: 0,
                    questionsCount: 0,

                    status: formStatus,

                    icon: formIcon,
                };

                setSubjects(
                    (prev) => [
                        ...prev,
                        newSubject,
                    ],
                );

                setIsAddModalOpen(false);

                showToast(
                    `Thêm môn học "${newSubject.name}" thành công!`,
                );
            } catch (error) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : "Không thể thêm môn học.",
                    "error",
                );
            }
        };
  const handleOpenEditModal = (sub: Subject) => {
    setSelectedSubject(sub);
    setFormName(sub.name);
    setFormCode(sub.code);
    setFormIcon(sub.icon);
    const mappedColor = COLOR_MAP[sub.icon] || '#6366F1';
    setFormColor(mappedColor);
    setFormStatus(sub.status);
    setFormDesc('Môn học trong chương trình luyện thi THPT Quốc gia trực tuyến.');
    setIsEditModalOpen(true);
  };

    const handleUpdateSubject =
        async (
            e: React.FormEvent,
        ) => {
            e.preventDefault();

            if (!selectedSubject) {
                return;
            }

            if (!formName.trim()) {
                showToast(
                    "Tên môn học không được để trống!",
                    "error",
                );
                return;
            }

            try {
                await updateSubject(
                    selectedSubject.id,
                    formName.trim(),
                );

                setSubjects(
                    (prev) =>
                        prev.map(
                            (subject) =>
                                subject.id ===
                                    selectedSubject.id
                                    ? {
                                        ...subject,

                                        name:
                                            formName.trim(),

                                        code:
                                            formCode
                                                .trim()
                                                .toUpperCase(),

                                        icon:
                                            formIcon,

                                        status:
                                            formStatus,
                                    }
                                    : subject,
                        ),
                );

                setIsEditModalOpen(
                    false,
                );

                showToast(
                    `Đã cập nhật môn học "${formName.trim()}"!`,
                );
            } catch (error) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : "Không thể cập nhật môn học.",
                    "error",
                );
            }
        };

  const handleOpenHideModal = (sub: Subject) => {
    setSelectedSubject(sub);
    setIsHideModalOpen(true);
  };

  const handleConfirmHideSubject = () => {
    if (!selectedSubject) return;
    const isCurrentlyActive = selectedSubject.status === 'active';
    const nextStatus = isCurrentlyActive ? 'inactive' : 'active';
    
    setSubjects(prev => prev.map(s => s.id === selectedSubject.id ? {
      ...s,
      status: nextStatus
    } : s));

    setIsHideModalOpen(false);
    showToast(`Đã ${isCurrentlyActive ? 'tạm ẩn' : 'bật hiển thị lại'} môn học môn "${selectedSubject.name}"!`);
  };

  const handleOpenDeleteModal = (sub: Subject) => {
    setSelectedSubject(sub);
    setDeleteInputText('');
    setIsDeleteModalOpen(true);
  };

    const handleConfirmDeleteSubject =
        async () => {
            if (!selectedSubject) {
                return;
            }

            if (
                deleteInputText !==
                "DELETE"
            ) {
                showToast(
                    'Vui lòng nhập chính xác từ khóa "DELETE"!',
                    "error",
                );
                return;
            }

            try {
                await deleteSubject(
                    selectedSubject.id,
                );

                setSubjects(
                    (prev) =>
                        prev.filter(
                            (subject) =>
                                subject.id !==
                                selectedSubject.id,
                        ),
                );

                // Các dữ liệu này hiện vẫn là frontend local/mock.
              

                setTopics(
                    (prev) =>
                        prev.filter(
                            (topic) =>
                                topic.subjectId !==
                                selectedSubject.id,
                        ),
                );

                setQuestions(
                    (prev) =>
                        prev.filter(
                            (question) =>
                                question.subjectId !==
                                selectedSubject.id,
                        ),
                );

                setExams(
                    (prev) =>
                        prev.filter(
                            (exam) =>
                                exam.subjectId !==
                                selectedSubject.id,
                        ),
                );

                setIsDeleteModalOpen(
                    false,
                );

                setIsDetailOpen(false);

                showToast(
                    `Đã xóa môn học "${selectedSubject.name}" .`,
                    "info",
                );
            } catch (error) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : "Không thể xóa môn học.",
                    "error",
                );
            }
        };
  // View Subject drawer details helper
  const handleOpenDetail = (sub: Subject) => {
    setSelectedSubject(sub);
    setIsDetailOpen(true);
    setDetailTab('topics');
  };

  // Export to simulated Excel triggers
  const handleExportExcel = () => {
    showToast('Tệp "Danh_sach_mon_hoc_EduPrep.xlsx" đã được kết xuất và tải xuống thành công!', 'success');
  };

  return (
    <div id="subject-admin-container" className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-xl border text-sm font-semibold selection:bg-transparent bg-white border-slate-150 text-slate-800"
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <p className="text-slate-700">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section admin */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-3xs">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-850 tracking-tight flex items-center gap-2">
            <span>📚</span> Quản lý môn học
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Quản lý các môn học trong hệ thống luyện thi online.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative shrink-0 w-full sm:w-64">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Tìm môn học..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-750 outline-none transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-150 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm môn học</span>
          </button>
        </div>
      </div>

      {/* QUICK STATISTICS 4 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng môn học */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tổng môn học</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.total}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Đăng ký</span>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Đang hoạt động</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.active}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Công khai</span>
          </div>
        </div>

        {/* Card 3: Đã ẩn */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Đã ẩn</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.inactive}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Tạm ẩn</span>
          </div>
        </div>

        {/* Card 4: Tổng câu hỏi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tổng câu hỏi</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.totalQuestions.toLocaleString('en-US')}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Ngân hàng</span>
          </div>
        </div>
      </div>

      {/* SUBJECTS LIST GRID CARD */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white py-12 px-4 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center text-lg">
            🔍
          </div>
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-slate-755">Không tìm thấy môn học nào</p>
            <p className="text-xs text-slate-400 max-w-sm font-medium">Thay đổi từ khóa tìm kiếm hoặc bấm nút Thêm môn học mới để cấu hình.</p>
          </div>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectPagination.pageItems.map(sub => {
            const finalStats = getSubjectStats(sub);
            
            return (
              <div 
                key={sub.id}
                className="bg-white rounded-3xl border border-slate-100 p-5.5 shadow-3xs hover:shadow-sm hover:border-slate-200 transition-all duration-200 flex flex-col justify-between space-y-5 group relative"
              >
                {/* Upper row: icon and name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-3xs border border-white/50"
                      style={{ backgroundColor: `${finalStats.color}15`, color: finalStats.color }}
                    >
                      {finalStats.emoji}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                        {sub.name}
                      </h3>
                      <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Mã: {sub.code}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0 ${
                    sub.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-150'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <span>{sub.status === 'active' ? 'Hoạt động' : 'Đã ẩn'}</span>
                  </span>
                </div>

                {/* Statistics counts in visual grid */}
                <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Chương</span>
                    <p className="text-xs font-black text-slate-700">
                      {finalStats.chaptersCount} chương
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Chuyên đề</span>
                    <p className="text-xs font-black text-slate-700">
                      {finalStats.topicsCount} chuyên đề
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Câu hỏi</span>
                    <p className="text-xs font-black text-slate-700">
                      {finalStats.questionsCount.toLocaleString('en-US')} câu hỏi
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Đề thi</span>
                    <p className="text-xs font-black text-slate-700">
                      {finalStats.examsCount} đề thi
                    </p>
                  </div>
                </div>

                {/* Inline operational toolbar buttons as requested */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-indigo-600 font-bold tracking-tight">Học viên: {finalStats.studentsCount.toLocaleString('en-US')}</span>
                  
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenDetail(sub)}
                      title="Xem chi tiết"
                      className="w-8.5 h-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-indigo-600 border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-3xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleOpenEditModal(sub)}
                      title="Chỉnh sửa môn học"
                      className="w-8.5 h-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-amber-600 border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-3xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleOpenHideModal(sub)}
                      title={sub.status === 'active' ? 'Ẩn môn học' : 'Bật hiển thị'}
                      className={`w-8.5 h-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-3xs ${
                        sub.status === 'active' ? 'text-slate-650 hover:text-indigo-600' : 'text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleOpenDeleteModal(sub)}
                      title="Xóa môn học"
                      className="w-8.5 h-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-rose-600 border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-3xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          page={subjectPagination.page}
          pageSize={subjectPagination.pageSize}
          total={subjectPagination.total}
          onPageChange={subjectPagination.setPage}
          itemLabel="môn học"
        />
        </>
      )}

      {/* DETAIL DRAWER ON THE RIGHT SIDE */}
      <AnimatePresence>
        {isDetailOpen && selectedSubject && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900 z-40"
              onClick={() => setIsDetailOpen(false)}
            />

            {/* Sliding Drawer on the Right */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-100 h-full overflow-hidden"
            >
              {/* Header Drawer */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shadow-3xs font-bold">
                    {getSubjectStats(selectedSubject).emoji}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-850">{selectedSubject.name}</h3>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Mã môn: {selectedSubject.code}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="w-8.5 h-8.5 rounded-lg hover:bg-slate-150 text-slate-450 hover:text-slate-800 transition-colors flex items-center justify-center border border-slate-200 cursor-pointer shadow-3xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content Drawer scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 divide-y divide-slate-100">

                {/* Thông tin tổng quan: lấy từ SQL Server qua /api/subjects/{id}/detail */}
                <div className="space-y-3 pb-5">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Thông tin tổng quan</p>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    {[
                      { label: 'Chuyên đề', value: detailView ? detailView.topicsCount : selectedSubject.topicsCount },
                      { label: 'Giáo viên phụ trách', value: detailView ? `${detailView.teachersCount} thầy cô` : null },
                      { label: 'Câu hỏi trong ngân hàng', value: detailView ? detailView.questionsCount : selectedSubject.questionsCount },
                      { label: 'Đề thi có sẵn', value: detailView ? detailView.examsCount : (selectedSubject.examsCount ?? 0) },
                      { label: 'Học sinh tham gia', value: detailView ? detailView.studentsCount : (selectedSubject.studentsCount ?? 0) },
                    ].map(card => (
                      <div key={card.label} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                        <span className="text-slate-400 font-semibold block">{card.label}</span>
                        <p className="font-extrabold text-slate-705 text-sm">
                          {card.value === null
                            ? '…'
                            : typeof card.value === 'number'
                              ? card.value.toLocaleString('en-US')
                              : card.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* tab selector */}
                <div className="pt-4 space-y-4">
                  <div className="flex border-b border-slate-100 gap-1.5 overflow-x-auto pb-1 text-xs">
                    {DETAIL_TABS.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setDetailTab(tab.key)}
                        className={`px-3 py-1.5 font-bold shrink-0 rounded-lg transition-colors cursor-pointer ${
                          detailTab === tab.key
                            ? 'bg-indigo-600 text-white shadow-3xs'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* tab content panels */}
                  <div className="space-y-3.5">
                    {detailLoading && !detailView ? (
                      <div className="p-6 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs font-semibold flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                        Đang tải dữ liệu từ hệ thống...
                      </div>
                    ) : detailError ? (
                      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-3">
                        <p className="text-xs font-bold text-rose-700">{detailError}</p>
                        <button
                          onClick={() => setDetailReloadKey(key => key + 1)}
                          className="px-3.5 py-1.5 bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : detailView ? (
                      <>
                        {detailTab === 'chapters' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wide">
                              <span>Tên chương</span>
                              <span>Chuyên đề | Câu hỏi</span>
                            </div>
                            {detailView.chapters.length === 0 ? (
                              <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs">
                                Môn {selectedSubject.name} chưa có chương nào.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {chapterPagination.pageItems.map((chapter, index) => (
                                  <div key={`${chapter.gradeName}-${chapter.order}-${index}`} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-700">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-850 truncate">Chương {chapter.order}: {chapter.name}</p>
                                      {chapter.gradeName && <p className="text-[10px] text-slate-400 font-semibold">{chapter.gradeName}</p>}
                                    </div>
                                    <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] shrink-0">
                                      {chapter.topicsCount} chuyên đề | {chapter.questionsCount} câu
                                    </span>
                                  </div>
                                ))}

                                <Pagination
                                  page={chapterPagination.page}
                                  pageSize={chapterPagination.pageSize}
                                  total={chapterPagination.total}
                                  onPageChange={chapterPagination.setPage}
                                  itemLabel="chương"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {detailTab === 'topics' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wide">
                              <span>Chủ đề / Chuyên đề</span>
                              <span>Số câu hỏi</span>
                            </div>
                            {detailView.topics.length === 0 ? (
                              <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs">
                                Chưa có chuyên đề nào cho môn {selectedSubject.name}.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {topicPagination.pageItems.map(topic => (
                                  <div key={topic.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-700">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-850 truncate">{topic.name}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                                        {[topic.gradeName, topic.chapterName].filter(Boolean).join(' • ')}
                                        {!topic.isActive && ' • Đang ẩn'}
                                      </p>
                                    </div>
                                    <span className="font-mono bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded text-[10px] shrink-0 font-bold">
                                      {topic.questionsCount} câu hỏi
                                    </span>
                                  </div>
                                ))}

                                <Pagination
                                  page={topicPagination.page}
                                  pageSize={topicPagination.pageSize}
                                  total={topicPagination.total}
                                  onPageChange={topicPagination.setPage}
                                  itemLabel="chuyên đề"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {detailTab === 'teachers' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wide">
                              <span>Giáo viên</span>
                              <span>Khối</span>
                            </div>
                            {detailView.teachers.length === 0 ? (
                              <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs">
                                Chưa có giáo viên nào được phân công môn {selectedSubject.name}.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {teacherPagination.pageItems.map(teacher => (
                                  <div key={teacher.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-700">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-850 truncate">{teacher.hoTen || 'Chưa có tên'}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold truncate">{teacher.email}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {teacher.gradeName && (
                                        <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">{teacher.gradeName}</span>
                                      )}
                                      {teacher.isLocked && (
                                        <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">Đã khóa</span>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                <Pagination
                                  page={teacherPagination.page}
                                  pageSize={teacherPagination.pageSize}
                                  total={teacherPagination.total}
                                  onPageChange={teacherPagination.setPage}
                                  itemLabel="giáo viên"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {detailTab === 'questions' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wide">
                              <span>Nội dung câu hỏi</span>
                              <span>Độ khó</span>
                            </div>
                            {detailView.recentQuestions.length === 0 ? (
                              <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs">
                                Ngân hàng câu hỏi của môn {selectedSubject.name} đang trống.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {questionPagination.pageItems.map(question => (
                                  <div key={question.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-700">
                                    <p className="font-bold text-slate-800 line-clamp-2">{question.noiDung}</p>
                                    <div className="flex items-center justify-between gap-2 text-[10px]">
                                      <span className="text-slate-450 font-bold truncate">
                                        {question.creatorName ? `Người tạo: ${question.creatorName}` : ''}
                                        {question.topicName ? ` • ${question.topicName}` : ''}
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
                                    Hiển thị {detailView.recentQuestions.length} câu mới nhất, còn {(detailView.questionsCount - detailView.recentQuestions.length).toLocaleString('en-US')} câu hỏi khác...
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {detailTab === 'exams' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wide">
                              <span>Đề kiểm tra</span>
                              <span>Thời lượng / Số câu</span>
                            </div>
                            {detailView.exams.length === 0 ? (
                              <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs">
                                Môn {selectedSubject.name} chưa có đề thi nào.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {examPagination.pageItems.map(exam => (
                                  <div key={exam.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-700">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-850 truncate">{exam.tenBaiKT}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                                        <span className={EXAM_STATUS_META[exam.status].text}>{EXAM_STATUS_META[exam.status].label}</span>
                                        {exam.gradeName && ` • ${exam.gradeName}`}
                                        {exam.creatorName && ` • ${exam.creatorName}`}
                                      </p>
                                    </div>
                                    <span className="font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] shrink-0 font-bold">
                                      {exam.thoiLuong}ph | {exam.totalQuestions} câu
                                    </span>
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

                        {detailTab === 'stats' && (
                          <div className="space-y-4 pt-1">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                                <span className="text-slate-400 font-semibold block">Lượt nộp bài thi</span>
                                <p className="font-extrabold text-slate-705 text-sm">{detailView.examResultsCount.toLocaleString('en-US')}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                                <span className="text-slate-400 font-semibold block">Điểm trung bình</span>
                                <p className="font-extrabold text-slate-705 text-sm">
                                  {detailView.averageScore === null ? 'Chưa có' : detailView.averageScore.toLocaleString('en-US')}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Số câu hỏi theo chuyên đề</p>
                              {topicChartData.length === 0 ? (
                                <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs">
                                  Chưa có câu hỏi nào được gắn vào chuyên đề của môn này.
                                </div>
                              ) : (
                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                                  <ResponsiveContainer width="100%" height={Math.max(150, topicChartData.length * 34)}>
                                    <BarChart data={topicChartData} layout="vertical" margin={{ left: 4, right: 16 }}>
                                      <XAxis type="number" allowDecimals={false} stroke="#888888" fontSize={10} tickLine={false} />
                                      <YAxis type="category" dataKey="name" width={110} stroke="#888888" fontSize={10} tickLine={false} />
                                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                                      <Bar dataKey="count" name="Số câu hỏi" radius={[0, 6, 6, 0]}>
                                        {topicChartData.map((_, index) => (
                                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Độ khó câu hỏi</p>
                              {detailView.questionsCount === 0 ? (
                                <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs">Chưa có câu hỏi.</div>
                              ) : (
                                <div className="space-y-2">
                                  {([
                                    { label: 'Dễ', value: detailView.questionsByDifficulty.easy, bar: 'bg-emerald-500' },
                                    { label: 'Trung bình', value: detailView.questionsByDifficulty.medium, bar: 'bg-amber-500' },
                                    { label: 'Khó', value: detailView.questionsByDifficulty.hard, bar: 'bg-rose-500' },
                                    ...(detailView.questionsByDifficulty.other > 0
                                      ? [{ label: 'Khác', value: detailView.questionsByDifficulty.other, bar: 'bg-slate-400' }]
                                      : []),
                                  ]).map(item => (
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

                            <div className="space-y-2">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Trạng thái đề thi</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {(['published', 'pending', 'rejected', 'draft'] as const).map(status => (
                                  <div key={status} className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <span className={`font-bold ${EXAM_STATUS_META[status].text}`}>{EXAM_STATUS_META[status].label}</span>
                                    <span className="font-extrabold text-slate-700">{detailView.examsByStatus[status]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

              </div>

              {/* Footer Drawer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => handleOpenDeleteModal(selectedSubject)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa môn học</span>
                </button>

                <button 
                  onClick={() => handleOpenEditModal(selectedSubject)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL THEM MON HOC */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black">➕</span>
                <h3 className="text-base font-black text-slate-850 uppercase tracking-wide">Thêm môn học</h3>
              </div>

              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 block">Tên môn học *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ví dụ: Lịch sử học, Địa lí tự nhiên..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-705"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                                      <label className="text-xs font-extrabold text-slate-600 block">Mã hiển thị</label>
                                      <input
                                          type="text"
                                          placeholder="Có thể để trống"
                                          className="..."
                                          value={formCode}
                                          onChange={(e) =>
                                              setFormCode(e.target.value)
                                          }
                                      />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 block">Chọn Icon *</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-705"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                    >
                      <option value="Calculator">📐 Toán học</option>
                      <option value="BookOpen">📖 Ngữ văn</option>
                      <option value="Languages">🇬🇧 Tiếng Anh</option>
                      <option value="Atom">⚛️ Vật lí</option>
                      <option value="FlaskConical">🧪 Hóa học</option>
                      <option value="Dna">🧬 Sinh học</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 block">Chọn màu nhận diện</label>
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span 
                      className="w-5.5 h-5.5 rounded-full shadow-3xs"
                      style={{ backgroundColor: COLOR_MAP[formIcon] || '#6366F1' }}
                    />
                    <span className="text-xs text-slate-550 font-semibold">{COLOR_MAP[formIcon] || '#6366F1'} (Tự động theo biểu tượng)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 block">Mô tả môn học</label>
                  <textarea 
                    placeholder="Mô tả tóm lược về môn học trên ứng dụng..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 font-medium text-slate-705 min-h-[70px]"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 block">Trạng thái phát hành</label>
                  <div className="flex items-center gap-5 pt-1 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="add-status" 
                        checked={formStatus === 'active'}
                        onChange={() => setFormStatus('active')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>🟢 Hoạt động</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="add-status" 
                        checked={formStatus === 'inactive'}
                        onChange={() => setFormStatus('inactive')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>🙈 Tạm ẩn</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 text-xs font-bold">
                 
                  <button 
                    type="submit"
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIT MON HOC */}
      <AnimatePresence>
        {isEditModalOpen && selectedSubject && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black">✏️</span>
                <h3 className="text-base font-black text-slate-850 uppercase tracking-wide">Chỉnh sửa môn học</h3>
              </div>

              <form onSubmit={handleUpdateSubject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 block">Tên môn học</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-705"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 block">Mã môn học</label>
                    <input 
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-705"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 block">Icon đại diện</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-705"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                    >
                      <option value="Calculator">📐 Toán học</option>
                      <option value="BookOpen">📖 Ngữ văn</option>
                      <option value="Languages">🇬🇧 Tiếng Anh</option>
                      <option value="Atom">⚛️ Vật lí</option>
                      <option value="FlaskConical">🧪 Hóa học</option>
                      <option value="Dna">🧬 Sinh học</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-400 block">Mã màu hex</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_MAP[formIcon] }} />
                    <span className="text-xs font-mono font-bold text-slate-500">{COLOR_MAP[formIcon] || '#6366F1'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 block">Mô tả môn học</label>
                  <textarea 
                    placeholder="Mô tả môn học..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 font-medium text-slate-705 min-h-[70px]"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 text-xs font-bold">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="py-2.5 px-4.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl shadow-3xs transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL AN MON HOC */}
      <AnimatePresence>
        {isHideModalOpen && selectedSubject && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-black">🙈</span>
                <h3 className="text-base font-black text-slate-850 uppercase tracking-wide">Ẩn môn học</h3>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <p className="font-extrabold text-slate-800 text-sm">
                  Bạn có chắc muốn ẩn môn học này?
                </p>

                <p className="text-slate-500 font-bold leading-relaxed">
                  Môn học sẽ:
                </p>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    <p>Không hiển thị cho học sinh</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    <p>Dữ liệu vẫn được giữ lại</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 text-xs font-bold">
                <button 
                  onClick={() => setIsHideModalOpen(false)}
                  className="py-2.5 px-5 bg-slate-550 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl shadow-3xs cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleConfirmHideSubject}
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl border border-amber-600 shadow-md cursor-pointer"
                >
                  Ẩn môn học
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL XOA MON HOC */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedSubject && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 bg-rose-50 text-rose-605 rounded-full flex items-center justify-center font-black">🗑</span>
                <h3 className="text-base font-black text-slate-850 uppercase tracking-wide">Xóa môn học</h3>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100 flex gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <p className="font-extrabold text-xs">Cảnh báo!</p>
                </div>

                <p className="font-bold text-slate-600 leading-relaxed">
                  Môn học này đang chứa:
                </p>

                <div className="space-y-1.5 pl-3 list-disc text-slate-700 font-extrabold text-xs">
                  <p>• {getSubjectStats(selectedSubject).chaptersCount} chương học liên quan</p>
                  <p>• {getSubjectStats(selectedSubject).topicsCount} chuyên đề lý thuyết & tự luyện</p>
                  <p>• {getSubjectStats(selectedSubject).questionsCount.toLocaleString('en-US')} câu hỏi trắc nghiệm</p>
                  <p>• {getSubjectStats(selectedSubject).examsCount} đề thi tổng hợp</p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-black text-rose-600 block">Nhập DELETE để xác nhận:</label>
                  <input 
                    type="text" 
                    placeholder="Nhập DELETE..."
                    className="w-full bg-slate-50 border border-slate-250 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase outline-none focus:bg-white text-slate-800"
                    value={deleteInputText}
                    onChange={(e) => setDeleteInputText(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 text-xs font-bold">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="py-2.5 px-4.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl shadow-3xs cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleConfirmDeleteSubject}
                  disabled={deleteInputText !== 'DELETE'}
                  className={`py-2.5 px-5 rounded-xl border transition-colors cursor-pointer ${
                    deleteInputText === 'DELETE' 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-md' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
  }
