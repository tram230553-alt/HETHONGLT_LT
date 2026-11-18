import TeacherAiQuestionsView from './TeacherAiQuestionsView';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getAppTheme, setAppTheme, appendSystemLog } from '../utils';
import {
    getTeacherProfile,
    updateTeacherProfile,
    changeTeacherPassword,
    updateTeacherSettings,
    type TeacherAccountActivityDto,
} from '../services/teacherProfileService';
import { questionService } from '../services/questionService';
import { isValidPhone, sanitizePhoneInput, PHONE_ERROR_MESSAGE } from '../utils/phone';
import TeacherQuestionManagementView, { mapQuestionDtoToQuestion } from './TeacherQuestionManagementView';
import TeacherExamManagementView from './TeacherExamManagementView';
import TeacherResultsTabs from './TeacherResultsTabs';
import TeacherReportsView from './TeacherReportsView';
import { getTeacherReport, type TeacherReportDto } from '../services/teacherReportService';
import NotificationInboxView from './NotificationInboxView';
import { useNotifications } from '../services/notificationStore';
import { toast } from '../services/toast';
import { 
  LayoutDashboard, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  GraduationCap, 
  BarChart3, 
  Bell, 
  User, 
  LogOut, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowRight, 
  Edit2, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  FolderPlus, 
  BookOpenCheck,
  Award,
  Bookmark,
  ExternalLink,
  RefreshCw,
  Send,
  Sliders,
  Settings,
  Copy,
  ChevronDown,
  Check,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Subject, 
  Topic, 
  Teacher, 
  Student, 
  Question, 
  Exam, 
  ExamAttempt,
  QuestionDifficulty,
  QuestionType,
  QuestionStatus,
  SystemNotification
} from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';


interface TeacherPortalViewProps {
  // Shared & Synchronized databases with App.tsx
  subjects: Subject[];
  topics: Topic[];
  setTopics?: React.Dispatch<React.SetStateAction<Topic[]>>;
  teachers: Teacher[];
  students: Student[];
  questions: Question[];
  onUpdateQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  exams: Exam[];
  onUpdateExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  attempts: ExamAttempt[];
  onLogout?: () => void;
  notifications: SystemNotification[];
  onNotificationsChange: (notifs: SystemNotification[]) => void;
}

export default function TeacherPortalView({
  subjects,
  topics,
  setTopics,
  teachers,
  students,
  questions,
  onUpdateQuestions,
  exams,
  onUpdateExams,
  attempts,
  onLogout,
  notifications,
  onNotificationsChange
}: TeacherPortalViewProps) {

  // Select which teacher we are acting as (Forced to math teacher Nguyễn Văn Minh)
  const actingTeacherId = 'tch-1';

  // Sidebar navigation state
  const [activeTab, setActiveTab] = useState<
    'AI Questions' | 'Dashboard' | 'Question Bank' | 'Exam Management'  | 'Students' | 'Reports' | 'Notifications' | 'Settings'
  >('Dashboard');
  const [dashboardReport, setDashboardReport] = useState<TeacherReportDto | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getTeacherReport();
        if (active) {
          setDashboardReport(data);
          setDashboardError('');
        }
      } catch (error) {
        if (active) setDashboardError(error instanceof Error ? error.message : 'Không tải được dữ liệu tổng quan.');
      } finally {
        if (active) setDashboardLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);


  // -------------------------
  // STUDENT MONITORING & ADVANCED FILTERS STATES
  // -------------------------
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentProgressFilter, setStudentProgressFilter] = useState('all'); // all, advanced, intermediate, needing_support
  const [studentScoreFilter, setStudentScoreFilter] = useState('all'); // all, excellent, average, low
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // -------------------------
  // NOTIFICATIONS & DATA SYNC STATES
  // -------------------------
  const [notificationCategory, setNotificationCategory] = useState<'all' | 'approval' | 'exam' | 'activity' | 'system'>('all');
  const [notificationSearch, setNotificationSearch] = useState('');
  const [syncedPendingOnly, setSyncedPendingOnly] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [examFilterStatus, setExamFilterStatus] = useState<string>('all');
  const [notificationChannel, setNotificationChannel] = useState<'admin' | 'system'>('admin');
  const [expandedSystemNotifId, setExpandedSystemNotifId] = useState<string | null>(null);

  // -------------------------
  // TEACHER SETTINGS MODULAR STATES
  // -------------------------
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  
  const [teacherProfileForm, setTeacherProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    grade: ''
  });

  const [teacherProfileId, setTeacherProfileId] = useState('');
  // Môn/khối thật của giáo viên, lấy thẳng từ hồ sơ API. Không phụ thuộc danh sách
  // môn học/giáo viên của Admin (chỉ được nạp khi đăng nhập bằng tài khoản Admin).
  const [teacherProfileSubjectId, setTeacherProfileSubjectId] = useState('');
  const [teacherProfileGradeId, setTeacherProfileGradeId] = useState('');
  const [isTeacherProfileLoading, setIsTeacherProfileLoading] = useState(true);
  const [isTeacherProfileSaving, setIsTeacherProfileSaving] = useState(false);
  const [isTeacherSettingsSaving, setIsTeacherSettingsSaving] = useState(false);
  const [teacherAccountActivities, setTeacherAccountActivities] = useState<TeacherAccountActivityDto[]>([]);

  const currentTeacher = useMemo(() => {
    const matchedTeacher =
      teachers.find(t => t.id === teacherProfileId) ||
      teachers.find(t => t.email === teacherProfileForm.email);

    const matchedSubject =
      subjects.find(s => s.id === matchedTeacher?.subjectId) ||
      subjects.find(
        s => s.name.trim().toLowerCase() === teacherProfileForm.subject.trim().toLowerCase()
      );

    return {
      id: teacherProfileId || matchedTeacher?.id || actingTeacherId,
      name: teacherProfileForm.name,
      email: teacherProfileForm.email,
      phone: teacherProfileForm.phone,
      subjectId: teacherProfileSubjectId || matchedTeacher?.subjectId || matchedSubject?.id || '',
      subjectName: teacherProfileForm.subject || matchedTeacher?.subjectName || 'Chưa phân môn',
      gradeId: teacherProfileGradeId || matchedTeacher?.gradeId,
      gradeName: teacherProfileForm.grade || matchedTeacher?.gradeName || 'Chưa phân khối',
      status: matchedTeacher?.status || 'active',
      joinedDate: matchedTeacher?.joinedDate || '',
      questionsContributed: matchedTeacher?.questionsContributed || 0,
      examsCreated: matchedTeacher?.examsCreated || 0
    } as Teacher;
  }, [
    teacherProfileId,
    teacherProfileSubjectId,
    teacherProfileGradeId,
    teacherProfileForm.name,
    teacherProfileForm.email,
    teacherProfileForm.phone,
    teacherProfileForm.subject,
    teacherProfileForm.grade,
    teachers,
    subjects
  ]);

  const [passwordFields, setPasswordFields] = useState({
    current: '',
    new: '',
    confirm: ''
  });
    const [
        isChangingPassword,
        setIsChangingPassword,
    ] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    receiveAdmin: true,
    approveExam: true,
    approveQuestion: true,
    studentMiniTest: true,
    viaEmail: true,
    viaSystem: true
  });

  const [appearanceTheme, setAppearanceTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    const theme = getAppTheme();
    return theme === 'auto' ? 'auto' : theme;
  });

  // Hot dynamic theme subscription across modules & tabs
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setAppearanceTheme(e.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartexam_theme_trigger') {
        setAppearanceTheme(getAppTheme());
      }
    };

    window.addEventListener('smartexam_theme_changed', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('smartexam_theme_changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [quickAutoSave, setQuickAutoSave] = useState(true);
  const [quickStudentPreview, setQuickStudentPreview] = useState(false);

  // Filter global database so teacher ONLY views assigned subjects & self-created content
  const teacherSubject = useMemo(() => {
    return subjects.find(s => s.id === currentTeacher.subjectId) || subjects[0];
  }, [subjects, currentTeacher]);

  const teacherQuestions = useMemo(() => {
    return questions.filter(q => q.createdBy === currentTeacher.id || q.creatorName === currentTeacher.name);
  }, [questions, currentTeacher]);

  const teacherExams = useMemo(() => {
    return exams.filter(e => e.creatorId === currentTeacher.id || e.creatorName === currentTeacher.name);
  }, [exams, currentTeacher]);

  const filteredTeacherExams = useMemo(() => {
    return teacherExams.filter(e => {
      if (examFilterStatus === 'all') return true;
      if (examFilterStatus === 'draft') return e.status === 'draft';
      if (examFilterStatus === 'pending') return e.status === 'pending';
      if (examFilterStatus === 'approved') return e.status === 'approved' || e.status === 'official' || e.status === 'published';
      if (examFilterStatus === 'rejected') return e.status === 'rejected';
      return true;
    });
  }, [teacherExams, examFilterStatus]);

  const relevantAttempts = useMemo(() => {
    // Attempts on exams belonging to this teacher's subject
    const teacherExamIds = exams.filter(e => e.subjectId === currentTeacher.subjectId).map(e => e.id);
    return attempts.filter(att => teacherExamIds.includes(att.examId));
  }, [attempts, exams, currentTeacher]);

  // Stat computations for Dashboard UI
  const stats = useMemo(() => {
    const reportExams = dashboardReport?.exams ?? [];
    return {
      created: dashboardReport?.totalQuestions ?? 0,
      examsCreated: dashboardReport?.totalExams ?? 0,
      pending: reportExams.filter(exam => exam.isSubmittedForApproval && !exam.isPublished).length,
      approved: dashboardReport?.publishedExams ?? 0,
      draft: reportExams.filter(exam => !exam.isSubmittedForApproval && !exam.isPublished).length,
      studentsCount: dashboardReport?.participatingStudentCount ?? 0,
    };
  }, [dashboardReport]);

  // 1. SELECT ONLY ASSIGNED STUDENTS
  const assignedStudents = useMemo(() => {
    // Return students mapped to this teacher's subject.
    // Math (sub-1): std-1, std-2, std-3, std-5
    return students.filter(s => ['std-1', 'std-2', 'std-3', 'std-5'].includes(s.id));
  }, [students]);

  // 2. DETAILED METRICS FOR EACH ASSIGNED STUDENT
  const studentDetailsMap = useMemo(() => {
    const map: Record<string, { progress: number, avgScore: number, completedExams: number, weak: string[], strong: string[] }> = {};
    
    assignedStudents.forEach(std => {
      const stdAtts = relevantAttempts.filter(att => att.studentId === std.id);
      const completedExams = stdAtts.length || (std.id === 'std-1' ? 4 : std.id === 'std-2' ? 2 : 1);
      
      // Compute actual average score if they have attempts, else use standard average
      const avgScore = stdAtts.length > 0 
        ? Math.round(stdAtts.reduce((sum, a) => sum + a.score, 0) / stdAtts.length)
        : Math.round(std.averageScore);
        
      // Dynamic Progress score
      const progress = std.progress || (avgScore >= 90 ? 92 : avgScore >= 80 ? 80 : avgScore >= 70 ? 71 : 58);
      
      // Fetch topics of teacher's subject
      const teacherSubjectTopics = topics.filter(t => t.subjectId === currentTeacher.subjectId);
      
      // Extract topics
      const topicNames = teacherSubjectTopics.map(t => t.name);
      
      const mathMockTopics = ['Sự đồng biến, nghịch biến', 'Cực trị của hàm số', 'Lũy thừa và lôgarit', 'Phương trình mũ', 'Giá trị lớn nhất & GTLN', 'Khối đa diện & Thể tích'];
      const engMockTopics = ['Perfect and Continuous Tenses', 'Passive Voice with Modals', 'Relative Clauses', 'Mixed Conditionals', 'Vocabulary & Idioms'];
      const fallbackList = topicNames.length > 0 ? topicNames : (currentTeacher.subjectId === 'sub-1' ? mathMockTopics : engMockTopics);
      
      let weak: string[] = [];
      let strong: string[] = [];
      
      if (avgScore >= 85) {
        strong = [fallbackList[0] || 'Lý thuyết', fallbackList[1] || 'Kỹ năng làm bài'];
        weak = fallbackList.length > 2 ? [fallbackList[fallbackList.length - 1]] : ['Kiểm tra thời gian'];
      } else if (avgScore >= 72) {
        strong = [fallbackList[0] || 'Lý thuyết'];
        weak = fallbackList.length > 2 ? [fallbackList[1], fallbackList[2]] : ['Bài tập nâng cao'];
      } else {
        strong = [fallbackList[0] || 'Lý thuyết cơ bản'];
        weak = [fallbackList[1] || 'Bài nâng cao', fallbackList[2] || 'Giải nhanh bằng máy tính'];
      }
      
      map[std.id] = {
        progress,
        avgScore,
        completedExams,
        weak,
        strong
      };
    });
    
    return map;
  }, [assignedStudents, relevantAttempts, topics, currentTeacher]);

  // 3. APPLY FILTER & SEARCH ON ASSIGNED STUDENTS
  const filteredAssignedStudents = useMemo(() => {
    return assignedStudents.filter(std => {
      const details = studentDetailsMap[std.id];
      if (!details) return false;

      // Filter by Search text
      const matchesSearch = std.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                            (std.email && std.email.toLowerCase().includes(studentSearch.toLowerCase())) ||
                            (std.className && std.className.toLowerCase().includes(studentSearch.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Filter by Class
      if (studentClassFilter !== 'all' && std.className !== studentClassFilter) {
        return false;
      }

      // Filter by Progress
      if (studentProgressFilter !== 'all') {
        if (studentProgressFilter === 'advanced' && details.progress < 80) return false;
        if (studentProgressFilter === 'intermediate' && (details.progress < 50 || details.progress >= 80)) return false;
        if (studentProgressFilter === 'needing_support' && details.progress >= 50) return false;
      }

      // Filter by Average Score
      if (studentScoreFilter !== 'all') {
        if (studentScoreFilter === 'excellent' && details.avgScore < 80) return false;
        if (studentScoreFilter === 'average' && (details.avgScore < 50 || details.avgScore >= 80)) return false;
        if (studentScoreFilter === 'low' && details.avgScore >= 50) return false;
      }

      return true;
    });
  }, [assignedStudents, studentDetailsMap, studentSearch, studentClassFilter, studentProgressFilter, studentScoreFilter]);

  // 7. REAL-TIME SYNCHRONIZED NOTIFICATIONS SELECTOR
  const dynamicNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      desc: string;
      time: string;
      type: 'approved' | 'rejected' | 'pending' | 'exam_completion' | 'activity' | 'system';
      targetId?: string;
      meta?: any;
    }> = [];

    // Translate questions into notifications:
    // Approved questions
    teacherQuestions.forEach(q => {
      const qShort = q.id.toUpperCase();
      const textTrunc = q.text.length > 50 ? q.text.substring(0, 50) + '...' : q.text;

      if (q.status === 'approved') {
        list.push({
          id: `not-app-${q.id}`,
          title: `Đã phê duyệt câu hỏi ${qShort}`,
          desc: `Câu hỏi trắc nghiệm của bạn: "${textTrunc}" đã được Quản lý duyệt và công bố thành công.`,
          time: '5 phút trước',
          type: 'approved',
          targetId: q.id,
          meta: q
        });
      } else if (q.status === 'rejected') {
        list.push({
          id: `not-rej-${q.id}`,
          title: `Yêu cầu hiệu chỉnh câu hỏi ${qShort}`,
          desc: `${q.explanation || 'Vui lòng kiểm tra lại cấu trúc đáp án hoặc nội dung bài học học liệu và nộp phê duyệt lại.'}`,
          time: '1 giờ trước',
          type: 'rejected',
          targetId: q.id,
          meta: q
        });
      } else if (q.status === 'pending') {
        list.push({
          id: `not-pen-${q.id}`,
          title: `Câu hỏi ${qShort} đang chờ duyệt`,
          desc: `Đã gửi câu hỏi lên Hội Đồng Học Thuật. Admin đã nhận được thông báo yêu cầu kiểm duyệt.`,
          time: 'Vừa xong',
          type: 'pending',
          targetId: q.id,
          meta: q
        });
      }
    });

    // Translate Exam efforts into notification completions
    relevantAttempts.forEach(att => {
      list.push({
        id: `not-att-${att.id}`,
        title: `Học sinh hoàn thành bài kiểm tra`,
        desc: `Em ${att.studentName} đã nộp bài "${att.examTitle}" với kết quả: ${att.score}% điểm, thời gian làm bài ${att.timeSpent} phút.`,
        time: 'Hôm nay',
        type: 'exam_completion',
        targetId: att.examId,
        meta: att
      });
    });

    // Seed student active indicators
    assignedStudents.slice(0, 2).forEach((std, sidx) => {
      list.push({
        id: `not-act-${std.id}-${sidx}`,
        title: `Hoạt động tự học của học sinh`,
        desc: `Học sinh ${std.name} vừa truy cập hệ thống và học bài lý thuyết trong chuyên đề giảng dạy của bạn.`,
        time: sidx === 0 ? '12 phút trước' : 'Mới đây',
        type: 'activity',
        targetId: std.id
      });
    });

    // Standard system welcomes
    list.push({
      id: 'not-sys-welcome',
      title: 'Hệ thống luyện thi trực tuyến EduPrep chào mừng giáo viên',
      desc: `Chào mừng thầy/cô ${currentTeacher.name} đến với cổng thông tin Workspace học liệu dành riêng cho giáo viên.`,
      time: 'Hôm qua',
      type: 'system'
    });

    // Apply filtering by search and type
    return list.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(notificationSearch.toLowerCase()) || 
                          n.desc.toLowerCase().includes(notificationSearch.toLowerCase());
      if (!matchSearch) return false;

      if (notificationCategory !== 'all') {
        if (notificationCategory === 'approval' && !['approved', 'rejected', 'pending'].includes(n.type)) return false;
        if (notificationCategory === 'exam' && n.type !== 'exam_completion') return false;
        if (notificationCategory === 'activity' && n.type !== 'activity') return false;
        if (notificationCategory === 'system' && n.type !== 'system') return false;
      }

      return true;
    });
  }, [teacherQuestions, relevantAttempts, assignedStudents, currentTeacher, notificationSearch, notificationCategory]);

  // Selector for official system notifications targeted to this teacher
  const targetedNotifications = useMemo(() => {
    if (!notifications) return [];
    
    return notifications.filter(n => {
      if (n.status !== 'sent') return false;
      
      // Target matching logic
      if (n.recipientType === 'all') {
        return true;
      }
      if (n.recipientType === 'subject' && n.recipientValue === currentTeacher.subjectId) {
        return true;
      }
      if (n.recipientType === 'group') {
        if (n.recipientValue === 'tu_nhien' && ['sub-1', 'sub-3', 'sub-4', 'sub-5'].includes(currentTeacher.subjectId)) {
          return true;
        }
        if (n.recipientValue === 'xa_hoi' && ['sub-2', 'sub-6'].includes(currentTeacher.subjectId)) {
          return true;
        }
        return false;
      }
      if (n.recipientType === 'specific') {
        const ids = n.recipientValue ? n.recipientValue.split(',') : [];
        return ids.includes(currentTeacher.id);
      }
      
      return false;
    });
  }, [notifications, currentTeacher]);

  // Số thông báo chưa đọc lấy từ API thật, đồng bộ với hộp thư và thông báo Admin vừa gửi.
  const { unreadCount: teacherUnreadCount } = useNotifications();

  const handleMarkNotificationRead = (notifId: string) => {
    const updated = notifications.map(n => {
      if (n.id !== notifId) return n;
      
      // Update the read receipt for currentTeacher
      const receiptIndex = n.readReceipts.findIndex(r => r.teacherId === currentTeacher.id);
      let updatedReceipts = [...n.readReceipts];
      
      const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
      
      if (receiptIndex >= 0) {
        if (updatedReceipts[receiptIndex].read) return n; // Already read, nothing changes
        updatedReceipts[receiptIndex] = {
          ...updatedReceipts[receiptIndex],
          read: true,
          readAt: nowStr
        };
      } else {
        // If not found (e.g. somehow receipt was missing for specific selection), register them as read
        updatedReceipts.push({
          teacherId: currentTeacher.id,
          teacherName: currentTeacher.name,
          read: true,
          readAt: nowStr
        });
      }
      
      return {
        ...n,
        readReceipts: updatedReceipts
      };
    });
    
    onNotificationsChange(updated);
    localStorage.setItem('smartexam_system_notifications', JSON.stringify(updated));
  };

  // Toast notifier
  // Toast toàn cục: cố định góc trên bên phải và nằm trên mọi hộp thoại.
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    toast[type](message);
  }, []);


  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsTeacherProfileLoading(true);

      // Gọi song song nhưng xử lý riêng: hồ sơ lỗi/đến chậm không được làm mất danh sách câu hỏi
      // và ngược lại.
      const questionsPromise = questionService.getMyQuestions();
      questionsPromise.catch(() => undefined);

      try {
        const profile = await getTeacherProfile();

        if (!isMounted) return;

        setTeacherProfileId(profile.id);
        setTeacherProfileSubjectId(profile.subjectId ?? '');
        setTeacherProfileGradeId(profile.gradeId ?? '');
        setTeacherProfileForm(prev => ({
          ...prev,
          name: profile.hoTen ?? '',
          email: profile.email ?? '',
          phone: profile.sdt ?? '',
          subject: profile.tenMH ?? '',
          grade: profile.tenKhoi ?? ''
        }));
        setNotificationSettings(prev => ({
          ...prev,
          receiveAdmin: profile.receiveAdminNotifications,
          approveExam: profile.examApprovalNotifications,
          studentMiniTest: profile.studentSubmissionNotifications,
          viaEmail: profile.emailNotifications,
          viaSystem: profile.systemNotifications,
        }));
        setAppearanceTheme(profile.themePreference || 'light');
        setAppTheme(profile.themePreference || 'light');
        setQuickAutoSave(profile.autoSaveEnabled);
        setTeacherAccountActivities(profile.recentAccountActivities ?? []);

        try {
          const questionData = await questionsPromise;

          if (isMounted) {
            onUpdateQuestions(questionData.map(mapQuestionDtoToQuestion));
          }
        } catch (error) {
          if (isMounted) {
            showToast(
              error instanceof Error
                ? error.message
                : 'Không tải được danh sách câu hỏi.',
              'error'
            );
          }
        }
      } catch (error) {
        if (!isMounted) return;

        showToast(
          error instanceof Error
            ? error.message
            : 'Không tải được hồ sơ giáo viên.',
          'error'
        );
      } finally {
        if (isMounted) {
          setIsTeacherProfileLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveTeacherProfile = async () => {
    const phone = teacherProfileForm.phone.trim();

    // SĐT là tùy chọn, nhưng nếu nhập thì phải đúng 10 chữ số.
    if (phone && !isValidPhone(phone)) {
      showToast(PHONE_ERROR_MESSAGE, 'error');
      return;
    }

    setIsTeacherProfileSaving(true);

    try {
      await updateTeacherProfile({
        sdt: phone
      });

      const refreshed = await getTeacherProfile();

      setTeacherProfileId(refreshed.id);
      setTeacherProfileForm(prev => ({
        ...prev,
        name: refreshed.hoTen ?? '',
        email: refreshed.email ?? '',
        phone: refreshed.sdt ?? '',
        subject: refreshed.tenMH ?? '',
        grade: refreshed.tenKhoi ?? ''
      }));

      showToast('Đã cập nhật số điện thoại thành công!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Cập nhật số điện thoại thất bại.',
        'error'
      );
    } finally {
      setIsTeacherProfileSaving(false);
    }
  };

  const saveTeacherPreferences = async (
    overrides: Partial<{
      themePreference: 'light' | 'dark' | 'auto';
      autoSaveEnabled: boolean;
      systemNotifications: boolean;
    }> = {},
  ) => {
    setIsTeacherSettingsSaving(true);
    try {
      await updateTeacherSettings({
        receiveAdminNotifications: notificationSettings.receiveAdmin,
        examApprovalNotifications: notificationSettings.approveExam,
        studentSubmissionNotifications: notificationSettings.studentMiniTest,
        emailNotifications: notificationSettings.viaEmail,
        systemNotifications: overrides.systemNotifications ?? notificationSettings.viaSystem,
        themePreference: overrides.themePreference ?? appearanceTheme,
        autoSaveEnabled: overrides.autoSaveEnabled ?? quickAutoSave,
      });
      showToast('Đã lưu cài đặt vào hệ thống.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không lưu được cài đặt.', 'error');
    } finally {
      setIsTeacherSettingsSaving(false);
    }
  };

    const handleChangeTeacherPassword =
        async () => {
            const oldPassword =
                passwordFields.current;

            const newPassword =
                passwordFields.new;

            const confirmPassword =
                passwordFields.confirm;

            // 1. Kiểm tra nhập đủ
            if (
                !oldPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                showToast(
                    'Vui lòng nhập đầy đủ thông tin mật khẩu.',
                    'error',
                );

                return;
            }

            // 2. Password mới và xác nhận phải giống nhau
            if (
                newPassword !==
                confirmPassword
            ) {
                showToast(
                    'Mật khẩu mới và mật khẩu xác nhận không trùng khớp.',
                    'error',
                );

                return;
            }

            // 3. Kiểm tra độ dài
            if (
                newPassword.length < 6
            ) {
                showToast(
                    'Mật khẩu mới phải có ít nhất 6 ký tự.',
                    'error',
                );

                return;
            }

            // 4. Không cho dùng lại password đang nhập làm password mới
            if (
                oldPassword ===
                newPassword
            ) {
                showToast(
                    'Mật khẩu mới phải khác mật khẩu hiện tại.',
                    'error',
                );

                return;
            }

            try {
                setIsChangingPassword(
                    true,
                );

                await changeTeacherPassword({
                    oldPassword,
                    newPassword,
                    confirmPassword,
                });

                // Xóa form sau khi thành công
                setPasswordFields({
                    current: '',
                    new: '',
                    confirm: '',
                });

                showToast(
                    'Đổi mật khẩu thành công.',
                    'success',
                );
            } catch (error) {
                console.error(
                    'Teacher change password error:',
                    error,
                );

                showToast(
                    error instanceof Error
                        ? error.message
                        : 'Đổi mật khẩu thất bại.',
                    'error',
                );
            } finally {
                setIsChangingPassword(
                    false,
                );
            }
        };
  // -------------------------
  // ACTION MODAL & PAGE CONTROL STATES
  // -------------------------
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'add' | 'edit' | 'clone'>('add');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Custom non-blocking confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Question Form Fields
  const [editorText, setEditorText] = useState('');
  const [editorType, setEditorType] = useState<QuestionType>('single_choice');
  const [editorDifficulty, setEditorDifficulty] = useState<QuestionDifficulty>('medium');
  const [editorChapterId, setEditorChapterId] = useState('');
  const [editorTopicId, setEditorTopicId] = useState('');
  const [editorOptions, setEditorOptions] = useState<string[]>(['', '', '', '']);
  const [editorCorrectAnswer, setEditorCorrectAnswer] = useState('A');
  const [editorExplanation, setEditorExplanation] = useState('');
  const [editorImageUrl, setEditorImageUrl] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>(['Trọng tâm', 'Luyện thi']);
  const [editorTagInput, setEditorTagInput] = useState('');
  const [editorEstimatedTime, setEditorEstimatedTime] = useState(120); // in seconds
  const [editorStatus, setEditorStatus] = useState<QuestionStatus>('draft');

  // Preview interactive mock choice state
  const [selectedPreviewChoice, setSelectedPreviewChoice] = useState<string | null>(null);

  // Question Details Drawer Slider
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerQuestion, setDrawerQuestion] = useState<Question | null>(null);

  // Question Bank Toggles: Own Questions vs Shared Reference library
  const [activeSubBank, setActiveSubBank] = useState<'own' | 'shared'>('own');

  // Exam Modal fields
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examModalType, setExamModalType] = useState<'add' | 'edit'>('add');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const [eTitle, setETitle] = useState('');
  const [eCode, setECode] = useState('');
  const [eDuration, setEDuration] = useState(60);
  const [ePassingScore, setEPassingScore] = useState(50);
  const [eDifficulty, setEDifficulty] = useState<QuestionDifficulty>('medium');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);


  // Search and Filter controls for My Question Bank
  const [qSearch, setQSearch] = useState('');
  const [qFilterType, setQFilterType] = useState<string>('all');
  const [qFilterDifficulty, setQFilterDifficulty] = useState<string>('all');
  const [qFilterStatus, setQFilterStatus] = useState<string>('all');

  // Note: relocated filter states to the top of the component to satisfy block-scoping rules.

  // Math formatting helper
  const formatMath = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\\Delta/gi, 'Δ')
      .replace(/\\delta/gi, 'δ')
      .replace(/\\alpha/gi, 'α')
      .replace(/\\beta/gi, 'β')
      .replace(/\\gamma/gi, 'γ')
      .replace(/\\theta/gi, 'θ')
      .replace(/\\pi/gi, 'π')
      .replace(/\\int/gi, '∫')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\ne/g, '≠')
      .replace(/\\infty/g, '∞')
      .replace(/\\times/g, '×')
      .replace(/\\pm/g, '±')
      .replace(/\\approx/g, '≈')
      .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\^n/g, 'ⁿ');
  };

  // Helper mock statistics for questions based on state/ID
  const getQuestionStats = (q: Question) => {
    // Generate organic stable statistics based on text length / character codes
    const baseCode = q.text.charCodeAt(0) || 72;
    const usageCount = (baseCode % 12) + 2;
    const correctRate = 50 + (baseCode % 44);
    const avgResponseTime = 30 + (baseCode % 60);
    
    // Custom timeline matching status
    let timeline = [
      { date: '12/06/2026', title: 'Tạo bản nháp thành công', desc: `Biên soạn bởi Giáo viên: ${q.creatorName}` }
    ];
    let feedback = 'Học liệu tự chọn chưa gửi kiểm duyệt.';

    if (q.status === 'draft') {
      feedback = 'Bản nháp lưu dưới tài khoản cá nhân của thầy/cô. Chưa gửi lên Ban giám hiệu.';
    } else if (q.status === 'pending') {
      timeline.push({ date: '13/06/2026', title: 'Gửi yêu cầu kiểm duyệt', desc: 'Hệ thống đã phân phối về ban tổ chức THPT Chuyên EduPrep' });
      feedback = 'Mã câu hỏi đang nằm trong hàng đợi kiểm duyệt học thuật. Vui lòng đợi Ban giám hiệu đối soát nội dung.';
    } else if (q.status === 'approved') {
      timeline.push({ date: '13/06/2026', title: 'Gửi yêu cầu kiểm duyệt', desc: 'Trình duyệt lên hệ thống thư viện chính' });
      timeline.push({ date: '14/06/2026', title: 'Admin thông qua chính thức', desc: 'Duyệt bởi Admin ban học thuật Nguyễn Hoàng Anh' });
      feedback = 'Nội dung câu hỏi giàu tính trực quan, cấu trúc công thức LaTeX chuẩn chỉ, đáp án đúng đắn. Đồng ý phân phối lên hệ thống.';
    } else if (q.status === 'rejected') {
      timeline.push({ date: '13/06/2026', title: 'Gửi yêu cầu kiểm duyệt', desc: 'Trình duyệt ban học thuật quốc gia' });
      timeline.push({ date: '14/06/2026', title: 'Ban giám hiệu từ chối', desc: 'Phản hồi chi tiết bởi Admin' });
      feedback = 'Phương án nhiễu C và D bị trùng mặt ý nghĩa hoặc có lỗi ký tự toán học. Vui lòng kiểm tra lại điều kiện x khác 0.';
    }

    return { usageCount, correctRate, avgResponseTime, timeline, feedback };
  };

  // Filtered Questions list: Handles own vs shared logic
  const filteredTeacherQuestions = useMemo(() => {
    return questions.filter(q => {
      // Core subject lock
      if (q.subjectId !== currentTeacher.subjectId) return false;
      
      // Ownership filter
      const isOwn = q.createdBy === currentTeacher.id || q.creatorName === currentTeacher.name;
      if (activeSubBank === 'own' && !isOwn) return false;
      if (activeSubBank === 'shared' && isOwn) return false;

      const matchSearch = q.text.toLowerCase().includes(qSearch.toLowerCase());
      const matchType = qFilterType === 'all' || q.type === qFilterType;
      const matchDifficulty = qFilterDifficulty === 'all' || q.difficulty === qFilterDifficulty;
      const matchStatus = qFilterStatus === 'all' || q.status === qFilterStatus;
      
      return matchSearch && matchType && matchDifficulty && matchStatus;
    });
  }, [questions, currentTeacher, activeSubBank, qSearch, qFilterType, qFilterDifficulty, qFilterStatus]);

  // Auto populate chapter dropdown on subject update
  const teacherChapters = useMemo(() => {
    return topics.filter(c => c.subjectId === currentTeacher.subjectId);
  }, [topics, currentTeacher]);

  const filteredTopics = useMemo(() => {
    if (!editorChapterId) return [];
    return topics.filter(t => t.id === editorChapterId);
  }, [topics, editorChapterId]);

  // -------------------------
  // PORTAL LOGICS
  // -------------------------

  // 1. Question creators
  const handleOpenAddQuestion = () => {
    setEditorMode('add');
    setEditingQuestionId(null);
    setEditorText('');
    setEditorType('single_choice');
    setEditorDifficulty('medium');
    setEditorChapterId(teacherChapters[0]?.id || '');
    setEditorTopicId('');
    setEditorOptions(['', '', '', '']);
    setEditorCorrectAnswer('A');
    setEditorExplanation('');
    setEditorImageUrl('');
    setEditorTags(['Trọng tâm', 'Luyện thi']);
    setEditorEstimatedTime(120);
    setEditorStatus('draft');
    setSelectedPreviewChoice(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditorMode('edit');
    setEditingQuestionId(q.id);
    setEditorText(q.text);
    setEditorType(q.type);
    setEditorDifficulty(q.difficulty);
    setEditorTopicId(q.id);
    setEditorOptions(q.options || ['', '', '', '']);
    setEditorCorrectAnswer(typeof q.correctAnswer === 'string' ? q.correctAnswer : q.correctAnswer[0] || 'A');
    setEditorExplanation(q.explanation || '');
    setEditorImageUrl((q as any).imageUrl || '');
    setEditorTags((q as any).tags || ['Trọng tâm']);
    setEditorEstimatedTime((q as any).estimatedTime || 120);
    setEditorStatus(q.status);
    setSelectedPreviewChoice(null);
    setIsEditorOpen(true);
  };

  const handleCloneQuestion = (q: Question) => {
    const cloneText = q.text.endsWith('(Bản sao)') ? q.text : `${q.text} (Bản sao)`;
    const clonedQ: Question = {
      ...q,
      id: `que-${Date.now()}`,
      text: cloneText,
      status: 'draft',
      createdBy: currentTeacher.id,
      creatorName: currentTeacher.name,
      createdAt: new Date().toISOString()
    };
    onUpdateQuestions(prev => [clonedQ, ...prev]);
    showToast('Đã nhân bản câu hỏi thành bản nháp thành công!', 'success');
  };

  const handleSaveQuestion = (e: React.FormEvent, customStatus?: QuestionStatus) => {
    if (e) e.preventDefault();
    if (!editorText.trim()) {
      showToast('Nội dung câu hỏi không thể bỏ trống', 'error');
      return;
    }

    const targetStatus = customStatus || editorStatus;

    if (editorMode === 'add') {
        const newQ: Question = {
            id: `que-${Date.now()}`,
            text: editorText.trim(),
            type: editorType,
            difficulty: editorDifficulty,

            subjectId: currentTeacher.subjectId,
            topicId: editorTopicId,

            createdBy: currentTeacher.id,
            creatorName: currentTeacher.name,

            options: editorOptions,
            correctAnswer: editorCorrectAnswer,

            explanation: editorExplanation,

            status: editorStatus,
            createdAt: new Date().toISOString(),
        };
      // Attach metadata for mockup fidelity representation
      (newQ as any).imageUrl = editorImageUrl;
      (newQ as any).tags = editorTags;
      (newQ as any).estimatedTime = editorEstimatedTime;

      onUpdateQuestions(prev => [newQ, ...prev]);
      appendSystemLog(currentTeacher.name, targetStatus === 'pending' ? `Biên soạn câu hỏi mới & gửi kiểm duyệt: "${editorText.trim().substring(0, 40)}..."` : `Lưu nháp câu hỏi trắc nghiệm mới: "${editorText.trim().substring(0, 40)}..."`);
      showToast(targetStatus === 'pending' ? 'Tạo câu hỏi & đã nộp trình duyệt Ban giám hiệu!' : 'Đã lưu bản nháp học liệu thành công!', 'success');
    } else if (editingQuestionId) {
      onUpdateQuestions(prev => prev.map(q => q.id === editingQuestionId ? {
        ...q,
        text: editorText.trim(),
        type: editorType,
        difficulty: editorDifficulty,
        chapterId: editorChapterId,
        id: editorTopicId,
        options: editorType === 'single_choice' || editorType === 'multiple_choice' ? editorOptions.map(o => o.trim()).filter(Boolean) : undefined,
        correctAnswer: editorCorrectAnswer,
        explanation: editorExplanation.trim() || undefined,
        status: targetStatus,
        imageUrl: editorImageUrl,
        tags: editorTags,
        estimatedTime: editorEstimatedTime
      } as any : q));
      appendSystemLog(currentTeacher.name, targetStatus === 'pending' ? `Cập nhật câu hỏi ID ${editingQuestionId} & trình duyệt lại` : `Cập nhật chỉnh sửa nội dung câu hỏi ID ${editingQuestionId}`);
      showToast(targetStatus === 'pending' ? 'Cập nhật câu hỏi và đã nộp trình duyệt Ban giám hiệu!' : 'Đã cập nhật câu hỏi thành công!', 'success');
    }

    setIsEditorOpen(false);
  };

  const handleDirectSubmitForReview = (q: Question) => {
    onUpdateQuestions(prev => prev.map(item => item.id === q.id ? { ...item, status: 'pending' } : item));
    appendSystemLog(currentTeacher.name, `Trình duyệt nhanh câu hỏi kiểm tra ID ${q.id} lên Ban Giám Hiệu`);
    showToast('Đã chuyển trạng thái sang CHỜ DUYỆT và trình lên BGH', 'success');
  };

  const handleDeleteQuestion = (qId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa câu hỏi',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi tài khoản của mình?',
      onConfirm: () => {
        onUpdateQuestions(prev => prev.filter(q => q.id !== qId));
        appendSystemLog(currentTeacher.name, `Xóa câu hỏi kiểm tra ID ${qId} khỏi danh sách biên soạn`);
        showToast('Đã xóa câu hỏi.', 'info');
        if (isDrawerOpen && drawerQuestion?.id === qId) {
          setIsDrawerOpen(false);
        }
        setConfirmModal(null);
      }
    });
  };

  // 2. Exam creators
  const handleOpenAddExam = () => {
    setExamModalType('add');
    setETitle('Đề Kiểm Tra Định Kỳ ' + (teacherSubject?.name || 'Môn học'));
    setECode('EX' + Math.floor(Math.random() * 9000 + 1000));
    setEDuration(45);
    setEPassingScore(50);
    setEDifficulty('medium');
    setSelectedQuestionIds([]);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam: Exam) => {
    setExamModalType('edit');
    setSelectedExam(exam);
    setETitle(exam.title);
    setECode(exam.code);
    setEDuration(exam.duration);
    setEPassingScore(exam.passingScore);
    setEDifficulty(exam.difficulty);
    setSelectedQuestionIds(exam.questionsList || []);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (status: 'draft' | 'pending') => {
    if (!eTitle.trim() || !eCode.trim()) {
      showToast('Vui lòng điền đủ Tiêu Đề và Mã Đề Thi!', 'error');
      return;
    }
    if (selectedQuestionIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một câu hỏi từ ngân hàng cho đề thi', 'error');
      return;
    }

    if (examModalType === 'add') {
      const newExam: Exam = {
        id: `exm-${Date.now()}`,
        title: eTitle.trim(),
        code: eCode.trim().toUpperCase(),
        subjectId: currentTeacher.subjectId,
        subjectName: currentTeacher.subjectName,
        creatorId: currentTeacher.id,
        creatorName: currentTeacher.name,
        duration: Number(eDuration),
        totalQuestions: selectedQuestionIds.length,
        totalMarks: selectedQuestionIds.length * 10,
        status: status, // submits to pending or draft
        difficulty: eDifficulty,
        createdAt: new Date().toISOString().split('T')[0],
        attemptsCount: 0,
        passingScore: Number(ePassingScore),
        questionsList: selectedQuestionIds
      };

      onUpdateExams(prev => [newExam, ...prev]);
      if (status === 'draft') {
        showToast('Lưu bản nháp đề thi thành công!', 'success');
      } else {
        showToast('Tạo đề thi mới thành công! Đề thi đã kích hoạt trạng thái CHỜ DUYỆT.', 'success');
      }
    } else if (selectedExam) {
      onUpdateExams(prev => prev.map(em => em.id === selectedExam.id ? {
        ...em,
        title: eTitle.trim(),
        code: eCode.trim().toUpperCase(),
        duration: Number(eDuration),
        totalQuestions: selectedQuestionIds.length,
        totalMarks: selectedQuestionIds.length * 10,
        passingScore: Number(ePassingScore),
        difficulty: eDifficulty,
        questionsList: selectedQuestionIds,
        status: status // submits back
      } : em));
      if (status === 'draft') {
        showToast('Lưu bản nháp đề thi thành công!', 'success');
      } else {
        showToast('Gửi phê duyệt bản sửa đổi đề thi thành công!', 'success');
      }
    }

    setIsExamModalOpen(false);
  };

  const handleDeleteExam = (examId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận hủy đề thi',
      message: 'Bạn muốn hủy bỏ đề kiểm tra này?',
      onConfirm: () => {
        onUpdateExams(prev => prev.filter(e => e.id !== examId));
        showToast('Hủy đề kiểm tra thành công!', 'info');
        setConfirmModal(null);
      }
    });
  };

  const toggleQuestionSelection = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(prev => prev.filter(id => id !== qId));
    } else {
      setSelectedQuestionIds(prev => [...prev, qId]);
    }
  };

    
  // Dashboard data comes only from the teacher report API.
  const activityData = useMemo(() => {
    return (dashboardReport?.monthlyActivity ?? []).map(month => ({
      name: month.label,
      questions: month.questionsCreated,
      examAttempts: month.examAttempts,
      practiceAttempts: month.practiceAttempts,
    }));
  }, [dashboardReport]);

  const approvalPieData = useMemo(() => {
    return [
      { name: 'Đã phát hành', value: stats.approved, color: '#B5EAD7' },
      { name: 'Chờ Admin duyệt', value: stats.pending, color: '#FFD6A5' },
      { name: 'Bản nháp', value: stats.draft, color: '#A5D8FF' }
    ];
  }, [stats]);

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFF] font-sans flex text-[#2D3748] selection:bg-[#7C9CF5]/30" id="teacher-portal-base">
      
      {/* TEACHER SIDEBAR (Fitted with requested colors & layout) */}
      <aside className="w-68 hidden md:flex flex-col shrink-0 bg-white border-r border-[#E2E8F0] relative z-30 shadow-sm">
        {/* Portal Header */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-[#F1F5F9] bg-gradient-to-r from-[#F8FAFF] to-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#7C9CF5] tracking-tight text-sm uppercase">SmartExam</span>
              <span className="text-[10px] font-black text-[#2D3748] tracking-widest uppercase">CỔNG GIÁO VIÊN</span>
            </div>
          </div>
        </div>



        {/* Sidebar Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 py-1" id="teacher-sidebar-nav">
          {[
            { name: 'Dashboard', title: 'Tổng quan', icon: LayoutDashboard },
            { name: 'Question Bank', title: 'Ngân hàng câu hỏi', icon: HelpCircle },
            { name: 'Exam Management', title: 'Quản lý Đề thi', icon: FileText },
            { name: 'AI Questions', title: 'AI gợi ý đề', icon: Sparkles },
    
            { name: 'Students', title: 'Học sinh', icon: GraduationCap },
            { name: 'Reports', title: 'Báo cáo', icon: BarChart3 },
            { name: 'Notifications', title: 'Thông báo', icon: Bell },
            { name: 'Settings', title: 'Cài đặt', icon: Settings }
          ].map(lnk => {
            const Icon = lnk.icon;
            const isSel = activeTab === lnk.name;
            return (
              <button
                key={lnk.name}
                onClick={() => setActiveTab(lnk.name as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer ${
                  isSel 
                    ? 'bg-[#7C9CF5]/10 text-[#7C9CF5] shadow-xs border-l-4 border-[#7C9CF5]' 
                    : 'text-[#4A5568] hover:bg-[#F8FAFF] hover:text-[#2D3748]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSel ? 'text-[#7C9CF5]' : 'text-[#A0AEC0]'}`} />
                <span>{lnk.title}</span>
                {lnk.name === 'Notifications' && teacherUnreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-[#FF9AA2] text-white rounded-full font-black text-[9px] flex items-center justify-center animate-pulse shrink-0">
                    {teacherUnreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Portal Switch block bottom */}
        <div className="p-4 border-t border-[#F1F5F9] space-y-3 bg-[#F8FAFF]">
          <button
            type="button"
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Đăng xuất',
                message: 'Đăng xuất phiên giáo viên?',
                onConfirm: () => {
                  if (onLogout) {
                    onLogout();
                  }
                  setConfirmModal(null);
                }
              });
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-[#FF9AA2] hover:bg-[#FF9AA2]/10 text-red-500 font-bold rounded-xl text-[11px] transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full min-h-0">
        
        {/* UPPER BANNER / TOPBAR */}
        <header className="h-20 shrink-0 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <span className="text-[#7C9CF5]">SMARTEXAM</span>
            <span>/</span>
            <span className="text-[#2D3748]">
              {{
                'Dashboard': 'Tổng quan',
                'Question Bank': 'Ngân hàng câu hỏi',
                'Exam Management': 'Quản lý Đề thi',
                'AI Questions': 'AI gợi ý đề',
                'Students': 'Học sinh',
                'Reports': 'Báo cáo',
                'Notifications': 'Thông báo',
                'Settings': 'Cài đặt'
              }[activeTab as string]}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Đăng xuất',
                  message: 'Đăng xuất phiên giáo viên?',
                  onConfirm: () => {
                    onLogout?.();
                    setConfirmModal(null);
                  }
                });
              }}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Notifications')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
              title={teacherUnreadCount > 0 ? `${teacherUnreadCount} thông báo chưa đọc` : 'Thông báo'}
              aria-label={teacherUnreadCount > 0 ? `${teacherUnreadCount} thông báo chưa đọc` : 'Thông báo'}
            >
              <Bell className="w-4.5 h-4.5" />
              {teacherUnreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                  {teacherUnreadCount > 99 ? '99+' : teacherUnreadCount}
                </span>
              )}
            </button>
            <span className="text-xs font-mono font-medium text-slate-400 tracking-wider hidden sm:block">
              🕒 {new Date().toLocaleString('vi-VN')}
            </span>

            <div className="w-px h-6 bg-slate-200"></div>

            {/* Profile banner info with static teacher indicator */}
            <div className="flex items-center gap-3 bg-[#FAF8FC] p-1.5 px-3 rounded-2xl border border-purple-100">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-lg px-2.5 py-1 shadow-3xs">
                  <span className="text-[11px] font-black text-[#2D3748]">GV. {currentTeacher.name}</span>
                </div>
                <div className="text-[9px] text-[#7C9CF5] font-black flex items-center gap-0.5 justify-end uppercase mt-0.5">
                  <span>✨ Môn {currentTeacher.subjectName.split(' ')[0]}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#A5D8FF] border border-white shadow-2xs flex items-center justify-center text-indigo-850 font-bold text-sm select-none uppercase shrink-0">
                {currentTeacher.name.split(' ').pop()?.substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* CORE WORKSPACE SCREEN */}
        <main className="app-scrollbar flex-1 min-h-0 overflow-y-auto p-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + actingTeacherId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              
              {/* =======================
                  TAB 1: DASHBOARD
                  ======================= */}
              {activeTab === 'Dashboard' && (
                <div className="space-y-6">
                  {dashboardLoading && <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 text-xs font-bold text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin text-indigo-500" /> Đang tải dữ liệu tổng quan thật...</div>}
                  {dashboardError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">{dashboardError}</div>}
                  
                  {/* Glassmorphic Beautiful EdTech Intro card */}
                  <div className="bg-gradient-to-r from-[#7C9CF5]/10 to-[#A5D8FF]/10 border border-[#7C9CF5]/20 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 text-xs font-bold">✨ Hiệu suất cá nhân của bạn</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-[#2D3748] tracking-tight">
                        Chào thầy/cô {currentTeacher.name}!
                      </h2>
                      <p className="text-xs text-slate-500 max-w-2xl font-medium leading-relaxed">
                        Chào mừng đến với **Bảng điều khiển học tập SmartExam**. Hệ thống đồng bộ thời gian thực với ban quản trị và học sinh. Mọi bài thi bạn biên tập sẽ sẵn sàng để phê duyệt, các câu học liệu mới sẽ lưu trữ trực tiếp vào kho đề môn **{currentTeacher.subjectName}**.
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={handleOpenAddQuestion}
                        className="py-2.5 px-4 bg-white border border-[#7C9CF5]/40 hover:bg-[#7C9CF5]/5 text-[#7C9CF5] font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-3xs cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Biên soạn Câu Hỏi</span>
                      </button>

                      <button 
                        onClick={handleOpenAddExam}
                        className="py-2.5 px-4 bg-[#7C9CF5] hover:bg-[#7C9CF5]/90 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Tạo Đề Thi</span>
                      </button>
                    </div>
                  </div>

                  {/* SIX STAT CARDS */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    
                    {[
                      { label: 'CÂU HỎI ĐÃ TẠO', value: stats.created, color: 'border-l-[#7C9CF5]', bg: 'bg-[#7C9CF5]/5', sub: 'Lưu trong hệ thống' },
                      { label: 'ĐỀ THI ĐÃ SOẠN', value: stats.examsCreated, color: 'border-l-[#A5D8FF]', bg: 'bg-[#A5D8FF]/5', sub: 'Tất cả trạng thái' },
                      { label: 'CHỜ PHÊ DUYỆT', value: stats.pending, color: 'border-l-[#FFD6A5]', bg: 'bg-[#FFD6A5]/5', sub: 'Đang chờ Admin' },
                      { label: 'ĐÃ PHÁT HÀNH', value: stats.approved, color: 'border-l-[#B5EAD7]', bg: 'bg-[#B5EAD7]/5', sub: 'Admin đã duyệt' },
                      { label: 'BẢN NHÁP', value: stats.draft, color: 'border-l-[#A5D8FF]', bg: 'bg-blue-50/40', sub: 'Chưa gửi duyệt' },
                      { label: 'HỌC SINH THAM GIA', value: stats.studentsCount, color: 'border-l-indigo-400', bg: 'bg-indigo-50/30', sub: 'Không trùng học sinh' }
                    ].map((stat, i) => (
                      <div key={i} className={`bg-white p-4 rounded-2xl border border-slate-105 border-l-4 ${stat.color} ${stat.bg} shadow-2xs space-y-1`}>
                        <p className="text-[9px] font-black text-slate-400 tracking-wider uppercase">{stat.label}</p>
                        <h4 className="text-2xl font-black text-[#2D3748]">{stat.value}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{stat.sub}</p>
                      </div>
                    ))}

                  </div>

                  {/* CHARTS SECTIONS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* AREA CHART - CONTENT TIMELINE PRODUCTION (recharts) */}
                    <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Biểu đồ Đào tạo</h3>
                          <h4 className="text-sm font-bold text-[#2D3748]">Câu hỏi mới, lượt thi và lượt luyện tập (6 tháng qua)</h4>
                        </div>
                      </div>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7C9CF5" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#7C9CF5" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#B5EAD7" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#B5EAD7" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPractice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#A5D8FF" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#A5D8FF" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" stroke="#A0AEC0"fontSize={10} tickLine={false} />
                            <YAxis stroke="#A0AEC0" fontSize={10} tickLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="questions" name="Câu hỏi mới" stroke="#7C9CF5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQuestions)" />
                            <Area type="monotone" dataKey="examAttempts" name="Lượt thi" stroke="#4FD1C5" strokeWidth={2} fillOpacity={1} fill="url(#colorAttempts)" />
                            <Area type="monotone" dataKey="practiceAttempts" name="Lượt luyện tập" stroke="#60A5FA" strokeWidth={2} fillOpacity={1} fill="url(#colorPractice)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* PIE CHART - APPROVAL RATE (recharts) */}
                    <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs flex flex-col justify-between space-y-4">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tỉ lệ Kiểm Duyệt</h3>
                        <h4 className="text-sm font-bold text-[#2D3748]">Trạng thái đề thi của giáo viên</h4>
                      </div>

                      <div className="h-44 flex items-center justify-center">
                        {stats.examsCreated === 0 ? (
                          <div className="text-center text-xs text-slate-400 py-6">Chưa có đề thi để phân tích trạng thái</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={approvalPieData.filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={68}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {approvalPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {approvalPieData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                              <span className="text-slate-500">{d.name}</span>
                            </div>
                            <span className="text-[#2D3748]">{d.value} ({stats.examsCreated > 0 ? Math.round(d.value / stats.examsCreated * 100) : 0}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM: RECENT CONTENT ACTIVITIES & QUICK ACTIONS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* RECENT ACTIVITIES LOGS */}
                    <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-black text-[#2D3748] uppercase tracking-wider flex items-center gap-1.5"><span>🔔</span> BÀI NỘP GẦN ĐÂY</h3>
                        <span className="text-[10px] bg-[#A5D8FF]/30 text-[#7C9CF5] px-2 py-0.5 rounded-md font-bold">Thời gian thực</span>
                      </div>

                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                        
                        {(dashboardReport?.recentSubmissions ?? []).map((submission) => (
                          <div key={submission.examResultId} className="p-3 bg-slate-50/50 rounded-xl border border-slate-105 flex items-start gap-3">
                            <span className="p-1 px-1.5 bg-[#A5D8FF]/50 text-blue-600 font-extrabold text-[10px] rounded shrink-0">THI</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-[#2D3748] font-bold">Học sinh <b>{submission.studentName}</b> đã nộp đề &ldquo;{submission.examName}&rdquo;</p>
                              <p className="text-[10px] text-slate-400 font-bold">Mã học sinh: {submission.studentCode} • Điểm: <b className={submission.score >= 5 ? 'text-emerald-600' : 'text-rose-500'}>{submission.score}/10</b></p>
                            </div>
                            <span className="text-[10px] text-slate-450 font-mono shrink-0">{new Date(submission.submittedAt).toLocaleString('vi-VN')}</span>
                          </div>
                        ))}
                        {!dashboardLoading && (dashboardReport?.recentSubmissions.length ?? 0) === 0 && <div className="py-8 text-center text-xs text-slate-400">Chưa có học sinh nộp đề của giáo viên.</div>}

                      </div>
                    </div>

                    {/* RIGHT COLUMN WRAPPER FOR ACTIONS & QUICK SETTINGS */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col">
                      
                      {/* QUICK ACTIONS PANEL */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thao Tác Nhanh</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Bấm để điều hướng đến trình tạo nội dung chuyên sâu</p>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={handleOpenAddQuestion}
                            className="w-full p-3.5 bg-[#7C9CF5]/10 text-left hover:bg-[#7C9CF5]/15 rounded-2xl flex items-center justify-between transition-all group border border-[#7C9CF5]/20 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base p-1 bg-white rounded-lg border border-[#7C9CF5]/30">📝</span>
                              <div>
                                <p className="text-xs font-black text-[#2D3748]">Soạn câu hỏi mới</p>
                                <p className="text-[10px] text-slate-500">Thêm câu hỏi Trắc nghiệm / Tự luận cho môn học</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#7C9CF5] group-hover:translate-x-1 transition-transform" />
                          </button>

                          <button
                            onClick={handleOpenAddExam}
                            className="w-full p-3.5 bg-amber-500/10 text-left hover:bg-amber-500/15 rounded-2xl flex items-center justify-between transition-all group border border-amber-500/20 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base p-1 bg-white rounded-lg border border-amber-500/30">📜</span>
                              <div>
                                <p className="text-xs font-black text-slate-750">Thiết lập đề thi mới</p>
                                <p className="text-[10px] text-slate-500">Sắp xếp các câu hỏi thành bài kiểm tra định kỳ</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>

                        <div className="pt-2">
                          <p className="text-[10px] text-slate-400 italic text-center leading-relaxed">SmartExam Assist. Môn dạy: {currentTeacher.subjectName}</p>
                        </div>
                      </div>

                      {/* QUICK SETTINGS PANEL */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span>⚙️</span> Cài đặt nhanh
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium font-semibold">Bật tắt các tùy chọn nhanh cho tài khoản</p>
                        </div>

                        <div className="space-y-3 pt-1">
                          {/* 1. Nhận thông báo */}
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs">🔔</span>
                              <span className="text-[11px] text-[#2D3748] font-black group-hover:text-[#7C9CF5] transition-colors">Nhận thông báo</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.viaSystem}
                              onChange={(e) => {
                                setNotificationSettings({ ...notificationSettings, viaSystem: e.target.checked });
                                void saveTeacherPreferences({ systemNotifications: e.target.checked });
                              }}
                              className="w-4.5 h-4.5 text-[#7C9CF5] rounded-md border-slate-300 focus:ring-[#7C9CF5] cursor-pointer"
                            />
                          </label>

                          {/* 2. Dark Mode */}
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs">🌙</span>
                              <span className="text-[11px] text-[#2D3748] font-black group-hover:text-[#7C9CF5] transition-colors">Dark Mode</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={appearanceTheme === 'dark'}
                              onChange={(e) => {
                                const newTheme = e.target.checked ? 'dark' : 'light';
                                setAppearanceTheme(newTheme);
                                showToast(`Đã đổi sang giao diện ${newTheme === 'dark' ? 'Tối' : 'Sáng'}!`, 'success');
                              }}
                              className="w-4.5 h-4.5 text-[#7C9CF5] rounded-md border-slate-300 focus:ring-[#7C9CF5] cursor-pointer"
                            />
                          </label>

                          {/* 3. Auto Save */}
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs">💾</span>
                              <span className="text-[11px] text-[#2D3748] font-black group-hover:text-[#7C9CF5] transition-colors">Auto Save</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={quickAutoSave}
                              onChange={(e) => {
                                setQuickAutoSave(e.target.checked);
                                void saveTeacherPreferences({ autoSaveEnabled: e.target.checked });
                              }}
                              className="w-4.5 h-4.5 text-[#7C9CF5] rounded-md border-slate-300 focus:ring-[#7C9CF5] cursor-pointer"
                            />
                          </label>

                          {/* 4. Xem trước học sinh */}
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs">👁️</span>
                              <span className="text-[11px] text-[#2D3748] font-black group-hover:text-[#7C9CF5] transition-colors">Xem trước học sinh</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={quickStudentPreview}
                              onChange={(e) => {
                                setQuickStudentPreview(e.target.checked);
                                showToast(e.target.checked ? 'Đang kích hoạt chế độ xem trước Học sinh' : 'Đã quay về chế độ giảng viên chính thức', 'info');
                              }}
                              className="w-4.5 h-4.5 text-[#7C9CF5] rounded-md border-slate-300 focus:ring-[#7C9CF5] cursor-pointer"
                            />
                          </label>
                        </div>

                        <div className="pt-2 border-t border-slate-105 text-[9.5px] text-slate-400 text-center font-bold">
                          Trạng thái: Đồng bộ hai chiều 🤝
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* =======================
                  TAB 3: QUESTION BANK
                  ======================= */}
              {activeTab === 'Question Bank' && (
                isTeacherProfileLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-slate-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    Đang tải hồ sơ giáo viên...
                  </div>
                ) : (
                  <TeacherQuestionManagementView
                      questions={questions}
                      topics={topics}
                      currentTeacher={currentTeacher}
                      onUpdateQuestions={onUpdateQuestions}
                      showToast={showToast}
                  />
                )
              )}

              {/* =======================
                  TAB 4: EXAM MANAGEMENT
                  ======================= */}
              {activeTab === 'AI Questions' && <TeacherAiQuestionsView />}
              {activeTab === 'Exam Management' && (
                <TeacherExamManagementView
                  onUpdateExams={onUpdateExams}
                />
              )}

           

              {/* =======================
                  TAB 6: STUDENTS
                  ======================= */}
              {activeTab === 'Students' && (
                <TeacherResultsTabs
                  gradeName={currentTeacher.gradeName}
                  subjectName={currentTeacher.subjectName}
                />
              )}

              {/* =======================
                  TAB 7: REPORTS
                  ======================= */}
              {activeTab === 'Reports' && (
                <TeacherReportsView
                  gradeName={currentTeacher.gradeName}
                  subjectName={currentTeacher.subjectName}
                />
              )}

              {/* =======================
                  TAB 8: NOTIFICATIONS & SYNC PANEL
                  ======================= */}
              {activeTab === 'Notifications' && (
                <NotificationInboxView />
              )}

              {/* Giao diện thông báo local cũ đã ngừng sử dụng. */}
              {false && (
                <div className="space-y-6" id="active-notifications-center">
                  
                  {/* Full-Width Column: Notification Feed (Dual sub-channel toggling in pastel purple style) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-105 shadow-2xs space-y-6">
                    
                    {/* Channel selection / Toggle tabs */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-black text-[#2D3748]">Trung Tâm Thông Báo Giáo Viên</h2>
                        <p className="text-xs text-slate-400 font-semibold font-sans">Theo dõi chỉ thị chính thức từ Ban Quản Trị và kiểm soát hoạt động học liệu.</p>
                      </div>

                      {/* Pill toggle controller in pastel purple theme */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setNotificationChannel('admin')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black select-none cursor-pointer transition-all flex items-center gap-2 ${
                            notificationChannel === 'admin' 
                              ? 'bg-[#7C9CF5] text-white shadow-xs' 
                              : 'text-slate-605 hover:text-slate-805'
                          }`}
                        >
                          📢 Chỉ thị Ban Giám Hiệu
                          {teacherUnreadCount > 0 && (
                            <span className="w-4.5 h-4.5 bg-[#FF9AA2] text-white rounded-full text-[9px] flex items-center justify-center font-black animate-pulse">
                              {teacherUnreadCount}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setNotificationChannel('system')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black select-none cursor-pointer transition-all ${
                            notificationChannel === 'system' 
                              ? 'bg-[#7C9CF5] text-white shadow-xs' 
                              : 'text-slate-605 hover:text-slate-805'
                          }`}
                        >
                          ⚡ Nhật ký Hệ thống
                        </button>
                      </div>
                    </div>

                    {/* CHANNEL A: MAIN OFFICIAL NOTIFICATIONS FROM ADMIN */}
                    {notificationChannel === 'admin' && (
                      <div className="space-y-4">
                        
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <span className="text-[10.5px] font-black text-indigo-700 uppercase bg-indigo-50 px-2.5 py-0.5 rounded-md">
                            Đang xem: {currentTeacher.name} ({currentTeacher.subjectName})
                          </span>
                          <span className="font-semibold text-slate-400">Có {targetedNotifications.length} thông báo trong hộp thư</span>
                        </div>

                        {/* Announcements Feed list */}
                        {targetedNotifications.length === 0 ? (
                          <div className="p-12 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border-2 border-dashed">
                            Tuyệt vời thầy/cô! Hiện chưa có chỉ thị hay công văn liên quan nào từ Admin dành cho tài khoản bộ môn giáo viên của thầy/cô.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {targetedNotifications.map((noti) => {
                              const isRead = noti.readReceipts.find(r => r.teacherId === currentTeacher.id)?.read === true;
                              const isExpanded = expandedSystemNotifId === noti.id;
                              
                              // Helper priority colors
                              const getPriorityStyles = (p: 'normal' | 'important' | 'urgent') => {
                                switch(p) {
                                  case 'urgent': return 'bg-red-50 text-red-650 border-red-200';
                                  case 'important': return 'bg-amber-50 text-amber-700 border-amber-200';
                                  default: return 'bg-[#FAF8FC] text-purple-700 border-purple-200';
                                }
                              };

                              const handleToggle = () => {
                                if (isExpanded) {
                                  setExpandedSystemNotifId(null);
                                } else {
                                  setExpandedSystemNotifId(noti.id);
                                  // Live sync: mark as read immediately!
                                  handleMarkNotificationRead(noti.id);
                                }
                              };

                              return (
                                <div 
                                  key={noti.id}
                                  className={`rounded-2xl border transition-all overflow-hidden ${
                                    isExpanded 
                                      ? 'border-[#7C9CF5] bg-slate-50/70 shadow-sm' 
                                      : 'border-slate-100 bg-[#FAF8FC]/50 hover:bg-[#FAF8FC] hover:border-slate-350'
                                  }`}
                                >
                                  {/* Notification Header Card info */}
                                  <div 
                                    onClick={handleToggle}
                                    className="p-4 flex items-start gap-4 cursor-pointer select-none animate-fadeIn"
                                  >
                                    <div className="shrink-0 pt-1">
                                      {isRead ? (
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" title="Đã xem" />
                                      ) : (
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" title="Tin mới chưa đọc" />
                                      )}
                                    </div>

                                    <div className="flex-1 space-y-1.5 min-w-0 pr-1">
                                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                        <span className={`px-2 py-0.5 rounded-md font-black uppercase border shrink-0 ${getPriorityStyles(noti.priority)}`}>
                                          {noti.priority === 'urgent' ? '🔴 Khẩn' : noti.priority === 'important' ? '🟡 Quan trọng' : '🟢 Thường'}
                                        </span>
                                        <span className="text-slate-400 font-extrabold uppercase shrink-0">{noti.senderName}</span>
                                        <span className="text-slate-400 font-bold shrink-0">•</span>
                                        <span className="text-slate-400 font-mono shrink-0">Ngày gửi: {new Date(noti.createdAt).toLocaleDateString('vi-VN')}</span>
                                      </div>

                                      <h3 className={`text-xs font-black leading-snug truncate ${isRead ? 'text-slate-705' : 'text-[#2D3748] font-black'}`}>
                                        {noti.title}
                                      </h3>
                                      <p className="text-[10.5px] text-slate-500 line-clamp-1 italic text-slate-400" dangerouslySetInnerHTML={{ __html: noti.content.replace(/<[^>]*>/g, '') }}></p>
                                    </div>

                                    <button className="text-[11px] font-black text-[#7C9CF5] hover:underline self-center shrink-0 cursor-pointer">
                                      {isExpanded ? 'Bản thu gọn ▴' : 'Xem chi tiết ▾'}
                                    </button>
                                  </div>

                                  {/* Notification Body full rendering */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-105 bg-white"
                                      >
                                        <div className="p-5 space-y-4">
                                          
                                          {/* HTML Body detailed */}
                                          <div 
                                            className="text-xs text-slate-600 space-y-2.5 leading-relaxed overflow-x-auto select-text font-sans" 
                                            dangerouslySetInnerHTML={{ __html: noti.content }}
                                          />

                                          {/* Attachments within expanded announcement block */}
                                          {noti.attachments.length > 0 && (
                                            <div className="pt-3 border-t border-dashed border-slate-150 space-y-2">
                                              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Tải tập tài liệu hướng dẫn đính kèm ({noti.attachments.length}):</span>
                                              
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {noti.attachments.map((file, fidx) => (
                                                  <div key={fidx} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8FC] border border-slate-100 text-xs">
                                                    <div className="flex items-center gap-2 truncate pr-1">
                                                      <span className="text-sm select-none">
                                                        {file.type === 'pdf' ? '📕' : file.type === 'xlsx' ? '📗' : '📘'}
                                                      </span>
                                                      <div className="truncate text-[11px] leading-tight">
                                                        <span className="block font-bold text-slate-700 truncate leading-none mb-0.5">{file.name}</span>
                                                        <span className="text-[8.5px] font-mono text-slate-400 block leading-none">{file.size}</span>
                                                      </div>
                                                    </div>

                                                    <button
                                                      type="button"
                                                      onClick={() => toast.info(`Đang tiến hành tải xuống chỉ thị: ${file.name}`)}
                                                      className="p-1 px-1.5 bg-white hover:bg-[#7C9CF5]/10 text-[#7C9CF5] rounded-lg border border-slate-205 font-extrabold text-[9px] flex items-center gap-0.5 shadow-3xs cursor-pointer"
                                                    >
                                                      Tải file ↓
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Read confirmation tag */}
                                          <div className="pt-2 flex justify-end">
                                            <span className="text-[10px] text-emerald-650 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-sm">
                                              ✔ Thầy/Cô đã xem thông báo này, lượt đọc đã được đồng bộ với Ban Giám Hiệu.
                                            </span>
                                          </div>

                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    )}

                    {/* CHANNEL B: ORIGINAL SYSTEM LOGS AND ACTIVITY FEED */}
                    {notificationChannel === 'system' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 pb-2 flex-wrap">
                          {/* Search Field inside dynamic list */}
                          <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={notificationSearch}
                              onChange={(e) => setNotificationSearch(e.target.value)}
                              placeholder="Tìm nội dung thông báo hệ thống..."
                              className="w-full pl-8.5 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-[#7C9CF5] focus:outline focus:outline-1"
                            />
                          </div>

                          {/* Filter selection tab list */}
                          <select
                            value={notificationCategory}
                            onChange={(e) => setNotificationCategory(e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-extrabold focus:outline-hidden"
                          >
                            <option value="all">Tất cả Nhóm tin</option>
                            <option value="approval">Kiểm duyệt học liệu</option>
                            <option value="exam">Kết quả Kỳ thi</option>
                            <option value="activity">Học sinh tự học</option>
                            <option value="system">Hệ thống</option>
                          </select>
                        </div>

                        {/* Notification Feed List */}
                        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                          {dynamicNotifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed">
                              Không có thông báo hệ thống nào khớp với bộ lọc tìm kiếm của thầy/cô.
                            </div>
                          ) : (
                            dynamicNotifications.map((not, idx) => {
                              let iconClass = 'bg-blue-105 text-blue-700 border-blue-200';
                              let iconText = 'ℹ';
                              let hoverBorder = '';

                              if (not.type === 'approved') {
                                iconClass = 'bg-emerald-100 text-emerald-800 border-emerald-250';
                                iconText = '✓';
                              } else if (not.type === 'rejected') {
                                iconClass = 'bg-rose-105 text-rose-800 border-rose-250';
                                iconText = '✕';
                                hoverBorder = 'border-rose-100';
                              } else if (not.type === 'pending') {
                                iconClass = 'bg-amber-105 text-amber-800 border-amber-250';
                                iconText = '⌛';
                              } else if (not.type === 'exam_completion') {
                                iconClass = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                iconText = '📝';
                              } else if (not.type === 'activity') {
                                iconClass = 'bg-violet-100 text-violet-700 border-violet-200';
                                iconText = '🏃';
                              }

                              return (
                                <div
                                  key={idx}
                                  onClick={() => setSelectedNotificationId(selectedNotificationId === not.id ? null : not.id)}
                                  className={`p-4 rounded-2xl border border-slate-105 bg-slate-50/35 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-start gap-3.5 cursor-pointer relative ${hoverBorder}`}
                                >
                                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border shrink-0 text-xs shadow-3xs ${iconClass}`}>
                                    {iconText}
                                  </span>
                                  
                                  <div className="space-y-1.5 flex-1 pr-1">
                                    <div className="flex items-start justify-between gap-2 flex-col sm:flex-row">
                                      <h4 className="text-xs font-black text-slate-805 leading-snug">{not.title}</h4>
                                      <span className="text-[10px] text-slate-400 font-mono shrink-0 select-none">{not.time}</span>
                                    </div>
                                    
                                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{not.desc}</p>

                                    {/* Active REVISE & RESUBMIT feature implementation */}
                                    {not.type === 'rejected' && not.meta && (
                                      <div className="pt-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditQuestion(not.meta);
                                          }}
                                          className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                        >
                                          <Edit2 className="w-3 h-3" /> Hiệu chỉnh & Nộp lại ngay
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}
              {/* =======================
                  TAB 9: SETTINGS & PREFERENCES
                  ======================= */}
              {activeTab === 'Settings' && (
                <div className="space-y-6" id="teacher-settings-dashboard">
                  {/* Page header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <h2 className="text-xl font-black text-[#2D3748] tracking-tight flex items-center gap-2">
                        <span>⚙️</span> Cài đặt
                      </h2>
                      <p className="text-xs text-slate-500 font-medium font-semibold">Quản lý tài khoản cá nhân, mật khẩu bảo mật và cấu hình nhận thông báo hệ thống</p>
                    </div>
                  </div>

                  {/* Settings Main grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left submenu links */}
                    <div className="lg:col-span-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-3xs space-y-1">
                      {[
                        { id: 'profile', label: 'Hồ sơ cá nhân', icon: '👤' },
                        { id: 'security', label: 'Bảo mật', icon: '🔐' },
                        { id: 'notifications', label: 'Thông báo', icon: '🔔' },
                        { id: 'appearance', label: 'Giao diện & Chủ đề', icon: '🎨' }
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setSettingsSubTab(sub.id as any)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11.5px] font-black transition-all cursor-pointer ${
                            settingsSubTab === sub.id
                              ? 'bg-purple-50 text-[#7C9CF5]'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-sm shrink-0">{sub.icon}</span>
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Right core sub-view panels */}
                    <div className="lg:col-span-9 bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs">
                      
                      {/* SUBTAB 1: HỒ SƠ CÁ NHÂN */}
                      {settingsSubTab === 'profile' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-[#2D3748] uppercase tracking-wider">Thông tin giáo viên</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Thông tin tài khoản do hệ thống quản lý; giáo viên chỉ tự cập nhật số điện thoại cá nhân</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Họ và tên</label>
                              <input 
                                type="text"
                                value={teacherProfileForm.name}
                                disabled
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold cursor-not-allowed"
                              />
                              <p className="text-[10px] text-slate-400 font-medium">Họ tên được xác lập khi tạo tài khoản và không thể tự thay đổi.</p>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Địa chỉ Email</label>
                              <input 
                                type="email"
                                value={teacherProfileForm.email}
                                disabled
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold cursor-not-allowed"
                              />
                              <p className="text-[10px] text-slate-400 font-medium">Email do Admin quản lý.</p>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Số điện thoại</label>
                              <input 
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={teacherProfileForm.phone}
                                disabled={isTeacherProfileLoading || isTeacherProfileSaving}
                                onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, phone: sanitizePhoneInput(e.target.value) })}
                                placeholder="Nhập số điện thoại (10 chữ số)"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-[#2D3748] font-semibold focus:outline-hidden focus:border-[#7C9CF5]/80 transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                              />
                              <p className="text-[10px] text-slate-400 font-medium">Đây là thông tin cá nhân giáo viên được phép tự cập nhật.</p>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Môn học phụ trách</label>
                              <input 
                                type="text"
                                disabled
                                value={teacherProfileForm.subject}
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-extrabold cursor-not-allowed"
                              />
                              <p className="text-[10px] text-slate-400 font-medium">Môn phụ trách do Admin phân công.</p>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Khối phụ trách</label>
                              <input
                                type="text"
                                disabled
                                value={teacherProfileForm.grade}
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-extrabold cursor-not-allowed"
                              />
                              <p className="text-[10px] text-slate-400 font-medium">Khối phụ trách do Admin phân công.</p>
                            </div>

                          </div>

                          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                            <button
                              onClick={() => void handleSaveTeacherProfile()}
                              disabled={isTeacherProfileLoading || isTeacherProfileSaving}
                              className="py-2.5 px-6 bg-[#7C9CF5] hover:bg-[#7C9CF5]/90 text-white font-black text-xs rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isTeacherProfileSaving ? 'Đang lưu...' : 'Lưu số điện thoại'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 2: BẢO MẬT */}
                      {settingsSubTab === 'security' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-[#2D3748] uppercase tracking-wider">Đổi mật khẩu</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt nhất</p>
                          </div>

                          <div className="grid grid-cols-1 gap-4 max-w-lg">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase block">Mật khẩu hiện tại</label>
                              <input 
                                type="password" 
                                value={passwordFields.current}
                                onChange={(e) => setPasswordFields({ ...passwordFields, current: e.target.value })}
                                placeholder="••••••••"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-[#2D3748] focus:outline-hidden focus:border-[#7C9CF5]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase block">Mật khẩu mới</label>
                              <input 
                                type="password" 
                                value={passwordFields.new}
                                onChange={(e) => setPasswordFields({ ...passwordFields, new: e.target.value })}
                                placeholder="Tối thiểu 8 ký tự kèm chữ số"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-[#2D3748] focus:outline-hidden focus:border-[#7C9CF5]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase block">Xác nhận mật khẩu</label>
                              <input 
                                type="password" 
                                value={passwordFields.confirm}
                                onChange={(e) => setPasswordFields({ ...passwordFields, confirm: e.target.value })}
                                placeholder="Xác nhận lại mật khẩu mới"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-[#2D3748] focus:outline-hidden focus:border-[#7C9CF5]"
                              />
                            </div>

                            <div className="pt-2">
                                                          <button
                                                              type="button"
                                                              onClick={() =>
                                                                  void handleChangeTeacherPassword()
                                                              }
                                                              disabled={isChangingPassword}
                                                              className="
    py-2.5
    px-5
    bg-[#7C9CF5]
    hover:bg-[#7C9CF5]/90
    text-white
    font-black
    text-xs
    rounded-2xl
    cursor-pointer
    transition-all
    shadow-3xs
    disabled:opacity-50
    disabled:cursor-not-allowed
    flex
    items-center
    justify-center
    gap-2
  "
                                                          >
                                                              {isChangingPassword ? (
                                                                  <>
                                                                      <RefreshCw
                                                                          className="
          w-4
          h-4
          animate-spin
        "
                                                                      />

                                                                      Đang đổi...
                                                                  </>
                                                              ) : (
                                                                  'Đổi mật khẩu'
                                                              )}
                                                          </button>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-black text-[#2D3748] uppercase tracking-wider">Hoạt động tài khoản gần đây</h4>
                                <p className="text-[10.5px] text-slate-500 font-medium">Chỉ hiển thị các thao tác quan trọng của tài khoản</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {teacherAccountActivities.map((activity, index) => (
                                <div key={`${activity.createdAt}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-[#2D3748]">{activity.description}</p>
                                    <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                      <Clock className="h-3 w-3" />
                                      {new Date(activity.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {teacherAccountActivities.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                                  Chưa có thao tác quan trọng nào được ghi nhận.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 3: THÔNG BÁO */}
                      {settingsSubTab === 'notifications' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-[#2D3748] uppercase tracking-wider">Cấu hình thông báo</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Tùy biến các loại thông báo gửi về tài khoản và hòm thư cá nhân của Thầy/Cô</p>
                          </div>

                          <div className="space-y-4">
                            {[
                              { key: 'receiveAdmin', title: 'Nhận thông báo từ Admin', desc: 'Nhận quyết định chính thức, thông tin tuyển sinh từ Ban giám hiệu.' },
                              { key: 'approveExam', title: 'Thông báo duyệt đề thi', desc: 'Có phản hồi phê duyệt, bổ sung hoặc từ chối đề thi từ Phòng chuyên môn.' },
                              { key: 'studentMiniTest', title: 'Thông báo học sinh làm Mini Test', desc: 'Nhận báo cáo nhanh kết quả điểm số luyện tập ngay sau khi học sinh nộp bài.' },
                              { key: 'viaEmail', title: 'Thông báo qua Email', desc: 'Sao gửi song song nội dung thông báo quan trọng vào hòm thư điện tử cá nhân của bạn.' },
                              { key: 'viaSystem', title: 'Thông báo trong hệ thống', desc: 'Cho phép đẩy tin nhắn cảnh báo đỏ/xanh trực tiếp lên thanh tiêu đề chuông.' }
                            ].map((item) => (
                              <label key={item.key} className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  className="mt-1 w-4.5 h-4.5 text-[#7C9CF5] rounded-lg border-slate-300 focus:ring-[#7C9CF5] cursor-pointer shrink-0"
                                  checked={(notificationSettings as any)[item.key]}
                                  onChange={(e) => setNotificationSettings({
                                    ...notificationSettings,
                                    [item.key]: e.target.checked
                                  })}
                                />
                                <div className="space-y-0.5">
                                  <span className="text-xs font-black text-[#2D3748]">{item.title}</span>
                                  <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                            <button
                              onClick={() => void saveTeacherPreferences()}
                              disabled={isTeacherSettingsSaving}
                              className="py-2.5 px-6 bg-[#7C9CF5] hover:bg-[#7C9CF5]/90 text-white font-black text-xs rounded-2xl cursor-pointer shadow-3xs disabled:opacity-50"
                            >
                              {isTeacherSettingsSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 4: GIAO DIỆN & CHỦ ĐỀ */}
                      {settingsSubTab === 'appearance' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-[#2D3748] uppercase tracking-wider">Giao diện (Theme Preference)</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Chọn chế độ màu sắc hiển thị phù hợp nhất với trải nghiệm giảng dạy của Thầy/Cô</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { id: 'light', title: 'Chế độ Sáng (Light Mode)', desc: 'Giao diện nền trắng cổ điển, tương phản chữ cao, khuyên dùng cho ban ngày.', icon: '☀️' },
                              { id: 'dark', title: 'Chế độ Tối (Dark Mode)', desc: 'Xoa dịu mắt khi biên soạn đề hoặc chấm thi vào ban đêm hoặc phòng tối.', icon: '🌙' },
                              { id: 'system', title: 'Đồng bộ hệ thống (System)', desc: 'Tự động luân chuyển buổi sáng/tối theo cài đặt thiết bị cá nhân.', icon: '💻' }
                            ].map((theme) => {
                              const actualId = theme.id === 'system' ? 'auto' : theme.id;
                              const isSel = appearanceTheme === actualId;
                              return (
                                <button
                                  key={theme.id}
                                  onClick={() => {
                                    setAppearanceTheme(actualId as any);
                                    setAppTheme(actualId as any);
                                    void saveTeacherPreferences({ themePreference: actualId as 'light' | 'dark' | 'auto' });
                                  }}
                                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                                    isSel
                                      ? 'bg-purple-50/50 border-[#7C9CF5] shadow-xs'
                                      : 'bg-white border-slate-105 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-xl">{theme.icon}</span>
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSel ? 'border-[#7C9CF5] bg-[#7C9CF5]' : 'border-slate-300 bg-white'
                                    }`}>
                                      {isSel && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-xs font-black text-[#2D3748]">{theme.title}</h4>
                                    <p className="text-[10px] text-slate-550 font-medium leading-relaxed">{theme.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                            <div><p className="text-xs font-black text-[#2D3748]">Tự động lưu bản nháp</p><p className="text-[10px] text-slate-500">Lưu tùy chọn này vào tài khoản giáo viên.</p></div>
                            <input type="checkbox" checked={quickAutoSave} onChange={(event) => { setQuickAutoSave(event.target.checked); void saveTeacherPreferences({ autoSaveEnabled: event.target.checked }); }} className="h-4.5 w-4.5 rounded border-slate-300 text-[#7C9CF5]" />
                          </label>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

            {/* ==================================================
          MODAL 2: CREATE EXAM MODAL
          ================================================== */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200/80 overflow-y-auto max-h-[90vh] space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-[#2D3748] flex items-center gap-1.5">
                <span>📜</span>
                <span>{examModalType === 'add' ? 'SOẠN ĐỀ THI TRẮC NGHIỆM MÔN ' + (teacherSubject?.name || 'Môn học') : 'CHỈNH SỬA CHI TIẾT ĐỀ THI'}</span>
              </h3>
              <button 
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 hover:bg-slate-50 rounded-lg text-slate-450"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              
              {examModalType === 'edit' && selectedExam?.status === 'rejected' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <p className="font-black text-rose-800 uppercase tracking-wide mb-0.5 text-[10px]">Đề thi này đã bị Quản Trị Viên từ chối</p>
                    <p className="font-semibold text-slate-800">
                      <b>Phản hồi / Lý do từ chối:</b> {selectedExam.rejectionReason || "Chưa có phản hồi chi tiết. Vui lòng kiểm tra lại chất lượng hoặc nội dung câu hỏi."}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500 font-bold">
                      * Vui lòng hiệu chỉnh thông tin / danh sách câu hỏi phù hợp bên dưới rồi click <b>"Cập Nhật & Gửi Duyệt"</b> để gửi lại.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase block">Tiêu đề đề khi</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đề kiểm tra học kỳ 1 môn Toán học 12..."
                    value={eTitle}
                    onChange={(e) => setETitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs text-[#2D3748]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase block">Mã Đích Xác Đề Thi</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: TOAN12A"
                    value={eCode}
                    onChange={(e) => setECode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs text-[#2D3748] uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">Thời lượng làm bài (Phút)</label>
                  <input
                    type="number"
                    required
                    value={eDuration}
                    onChange={(e) => setEDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-655"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">Điểm tối thiểu đạt bài (%)</label>
                  <input
                    type="number"
                    required
                    value={ePassingScore}
                    onChange={(e) => setEPassingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-655"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">Mức độ phân loại đề</label>
                  <select
                    value={eDifficulty}
                    onChange={(e) => setEDifficulty(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-655"
                  >
                    <option value="easy">Nhận biết & Thông hiểu</option>
                    <option value="medium">Khảo sát Trung bình khá</option>
                    <option value="hard">Học sinh giỏi và Vận dụng cao</option>
                  </select>
                </div>
              </div>

              {/* Questionnaire picking checklist */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase block">CHỌN CÂU HỎI TỪ NGÂN HÀNG ({selectedQuestionIds.length} câu đã chọn)</label>
                  <span className="text-[10px] text-indigo-505 font-bold">Chỉ hiển thị câu hỏi thuộc {currentTeacher.subjectName.split(' ')[0]}</span>
                </div>

                {/* Filterable picker space */}
                <div className="max-h-[180px] overflow-y-auto border border-slate-150 rounded-xl p-3 space-y-2 bg-slate-50/50">
                  {questions.filter(q => q.subjectId === currentTeacher.subjectId || q.subjectId === 'sub-1').map((q, cIdx) => {
                    const isSel = selectedQuestionIds.includes(q.id);
                    return (
                      <div 
                        key={q.id}
                        onClick={() => toggleQuestionSelection(q.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                          isSel 
                            ? 'bg-[#7C9CF5]/10 border-[#7C9CF5]/40 text-[#2D3748] font-bold' 
                            : 'bg-white border-slate-150 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSel}
                          onChange={() => {}} // handled via onClick on outer box
                          className="mt-0.5" 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 leading-relaxed text-left"><b>Câu {cIdx+1}.</b> {q.text}</p>
                          <span className="text-[9px] text-left font-mono text-slate-400 uppercase block mt-1">ĐỘ KHÓ: {q.difficulty.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="py-2 px-3 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveExam('draft')}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Lưu Bản Nháp
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveExam('pending')}
                  className="py-2.5 px-4 bg-[#7C9CF5] hover:bg-[#7C9CF5]/90 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
                >
                  {examModalType === 'add' ? 'Khởi Tạo & Nộp Trình Duyệt' : 'Cập Nhật & Gửi Duyệt'}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

       

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-black text-slate-805">{confirmModal.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{confirmModal.message}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs font-bold pt-2.5 border-t border-slate-100">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer shadow-sm transition-colors"
                >
                  Đồng ý
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}6
