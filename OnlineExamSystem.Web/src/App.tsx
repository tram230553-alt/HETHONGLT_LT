/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Bookmark, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  User, 
  Bell, 
  Search, 
  Calendar, 
  Lock, 
  Menu, 
  Sparkles, 
  RefreshCw, 
  LogIn, 
  BadgeCheck,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Domain models and Types
import { 
  Subject, 
  Topic, 
  Teacher, 
  Student, 
  Question, 
  Exam, 
  ExamAttempt,
  QuestionStatus,
  ExamStatus,
  SystemNotification
} from './types';

import {
    getStudents,
    lockStudent,
    unlockStudent,
} from "./services/studentService";
import {
    topicService,
    type TopicDto,
    type CreateTopicRequest,
    type UpdateTopicRequest
} from "./services/topicService";


// Subviews
import DashboardView from './components/DashboardView';
import TeacherManagementView from './components/TeacherManagementView';
import StudentManagementView from './components/StudentManagementView';
import AdminCurriculumManagement  from './components/AdminCurriculumManagement';
import SubjectAdminView from './components/SubjectAdminView';
import AdminExamManagementView from './components/AdminExamManagementView';
import AnalyticsReportsView from './components/AnalyticsReportsView';
import AuditLogsView from './components/AuditLogsView';
import SettingsView from './components/SettingsView';
import TeacherPortalView from './components/TeacherPortalView';
import AdminSynchronizedNotificationsView from './components/AdminSynchronizedNotificationsView';
import LoginView from './components/LoginView';
import StudentPortalApp from './student/StudentPortalApp';
import { clearSession, getStoredRole, UserRole, hasValidSession } from './auth';
import { appendSystemLog, getAppTheme, applyThemeToDOM } from './utils';
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  lockTeacher,
  unlockTeacher,
  deleteTeacher,
} from './services/teacherService';
import { getSubjects as getSubjectsFromApi } from './services/subjectService';
import { getGrades } from "./services/gradeService";
import { getClientSystemSettings } from "./services/systemSettingsService";
interface CreateTeacherAdminInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  subjectId: string;
  gradeId: string;
}

interface UpdateTeacherAdminInput {
  id: string;
  email: string;
  subjectId: string;
    gradeId: string;
}
interface GradeOption {
    id: string;
    name: string;
}
function splitTeacherName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { ho: '', tenDem: '', ten: '' };
  }

  if (parts.length === 1) {
    return { ho: '', tenDem: '', ten: parts[0] };
  }

  return {
    ho: parts[0],
    tenDem: parts.slice(1, -1).join(' '),
    ten: parts[parts.length - 1],
  };
}

export default function App() {
  // Load and apply theme on startup and runtime change
  useEffect(() => {
    const activeTheme = getAppTheme();
    applyThemeToDOM(activeTheme);

    const handleThemeChange = (e: any) => {
      applyThemeToDOM(e.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartexam_theme_trigger') {
        applyThemeToDOM(getAppTheme());
      }
    };

    window.addEventListener('smartexam_theme_changed', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('smartexam_theme_changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Synchronously migrate or clear outdated localStorage data if corrupted
  try {
    const rawSubjects = localStorage.getItem('eduprep_subjects');
    if (rawSubjects) {
      const parsed = JSON.parse(rawSubjects);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem('eduprep_subjects');
        localStorage.removeItem('eduprep_chapters');
        localStorage.removeItem('eduprep_topics');
        localStorage.removeItem('eduprep_teachers');
        localStorage.removeItem('eduprep_students');
        localStorage.removeItem('eduprep_questions');
        localStorage.removeItem('eduprep_exams');
        localStorage.removeItem('eduprep_attempts');
      }
    }
  } catch (e) {
    console.error('Error during database validation', e);
  }

  // Sidebar expanded / collapsed layout setting state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [preSelectSubjectId, setPreSelectSubjectId] = useState<string | undefined>(undefined);
    const [grades, setGrades] = useState<GradeOption[]>([]);
  // Custom Platform Settings States
  const [platformTitle, setPlatformTitle] = useState('Hệ thống Thi Trực tuyến');

  // Simulated authentication states
    const [isLoggedIn, setIsLoggedIn] = useState(
        hasValidSession()
    );

  useEffect(() => {
    if (!isLoggedIn) return;
    void getClientSystemSettings()
      .then((configuration) => setPlatformTitle(configuration.systemName))
      .catch((error) => console.error('Không tải được nhận diện hệ thống:', error));
  }, [isLoggedIn]);
  
  const [loginEmail, setLoginEmail] = useState<string>(() => {
    return localStorage.getItem('smartexam_session_email') || 'admin@smartexam.edu.vn';
  });

  const [portalMode, setPortalMode] = useState<UserRole>(() => getStoredRole());
  
  // Platform resources states synced to localStorage
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [topics, setTopics] = useState<TopicDto[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [students, setStudents] =
        useState<Student[]>([]);

  const [questions, setQuestions] = useState<Question[]>([]);

    const [exams, setExams] = useState<Exam[]>([]);

    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);

    const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Persists resources state changes to localStorage
  useEffect(() => {
    localStorage.setItem('eduprep_subjects', JSON.stringify(subjects));
  }, [subjects]);


  useEffect(() => {
    localStorage.setItem('eduprep_topics', JSON.stringify(topics));
  }, [topics]);

    useEffect(() => {
        const loadGrades = async () => {
            try {
                const data = await getGrades();

                const mappedGrades = data.map((grade) => ({
                    id: grade.id,
                    name: grade.tenKhoi,
                }));

                setGrades(mappedGrades);
            } catch (error) {
                console.error(
                    "Không thể tải danh sách khối:",
                    error
                );

                setGrades([]);
            }
        };

        loadGrades();
    }, []);

  useEffect(() => {
    localStorage.setItem('eduprep_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('eduprep_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('smartexam_system_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Real-time synchronization listener for notifications and other states across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartexam_system_notifications' && e.newValue) {
        setNotifications(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Synchronize and migrate database so that Admin Portal has the latest full enriched subjects, topics, topics, exams, etc.
 

 

  // Teacher data is loaded from ASP.NET Core API / SQL Server.
  const loadAdminSubjects = async () => {
    const data = await getSubjectsFromApi();

    setSubjects(
      data.map((item) => ({
        id: item.id,
        name: item.tenMH,
        code: `MH-${item.id.replaceAll('-', '').slice(0, 6).toUpperCase()}`,
        chaptersCount: item.chaptersCount,
        topicsCount: item.topicsCount,
        questionsCount: item.questionsCount,
        examsCount: item.examsCount,
        studentsCount: item.studentsCount,
        status: 'active' as const,
        icon: 'BookOpen',
      })),
    );
  };

  const loadTeachers = async () => {
    const data = await getTeachers();

    setTeachers(
      data.map((item) => ({
        id: item.id,
        name: item.hoTen.trim(),
        email: item.email,
        phone: item.sdt ?? '',
        subjectId: item.subjectId,
        subjectName: item.tenMH ?? 'Chưa phân môn',
        gradeId: item.gradeId,
        gradeName: item.tenKhoi ?? 'Chưa phân khối',
        status: item.isLocked ? 'inactive' : 'active',
        joinedDate: item.createdAt?.slice(0, 10) ?? '',
        questionsContributed: item.questionsCount ?? 0,
        examsCreated: item.examsCount ?? 0,
      })),
    );
  };

  const loadStudents = async () => {
            const data =
                await getStudents();

            const mapped:
                Student[] =
                data.map(
                    (item) => ({
                        id:
                            item.id,

                        name:
                            item.hoTen.trim(),

                        email:
                            item.email,

                        // Backend chưa có.
                        phone:
                            "",

                        className:
                            item.lop ?? "",

                        grade:
                            item.tenKhoi,

                        gradeId:
                            item.gradeId,

                        gradeName:
                            item.tenKhoi,

                        studentCode:
                            item.maHS,

                        birthDate:
                            item.ngaySinh
                                ? item.ngaySinh.slice(0, 10)
                                : "",

                        status:
                            item.isLocked
                                ? "inactive"
                                : "active",

                        joinedDate:
                            item.createdAt
                                ? item.createdAt.slice(
                                    0,
                                    10,
                                )
                                : "",

                        // Không giả số liệu.
                        examsCompleted:
                            0,

                        averageScore:
                            0,

                        targetScore:
                            "",

                        progress:
                            0,
                    }),
                );

            setStudents(mapped);
        };
    useEffect(() => {
        if (
            !isLoggedIn ||
            portalMode !== "admin"
        ) {
            return;
        }

        void Promise.all([
            loadAdminSubjects(),

            loadTeachers(),

            loadStudents(),
        ]).catch(
            (error) => {
                console.error(
                    "Không tải được dữ liệu quản trị:",
                    error,
                );
            },
        );
    }, [
        isLoggedIn,
        portalMode,
    ]);

  const handleAddTeacher = async (input: CreateTeacherAdminInput) => {
    const name = splitTeacherName(input.name);

    await createTeacher({
      ho: name.ho,
      tenDem: name.tenDem,
      ten: name.ten,
      email: input.email.trim(),
      matKhau: input.password,
      sdt: input.phone.trim(),
      subjectId: input.subjectId,
      gradeId: input.gradeId,
    });

    await loadTeachers();
    appendSystemLog('Admin', `Thêm mới giáo viên: ${input.name} (${input.email})`);
  };

  const handleUpdateTeacherStatus = async (
    id: string,
    status: 'active' | 'inactive',
  ) => {
    if (status === 'inactive') {
      await lockTeacher(id);
    } else {
      await unlockTeacher(id);
    }

    await loadTeachers();
    appendSystemLog(
      'Admin',
      `Cập nhật trạng thái giáo viên ${id} thành ${status === 'active' ? 'Hoạt động' : 'Khóa'}`,
    );
  };

  const handleUpdateTeacher = async (input: UpdateTeacherAdminInput) => {
    await updateTeacher(input.id, {
      email: input.email.trim(),
      subjectId: input.subjectId,
      gradeId: input.gradeId,
    });

    await loadTeachers();
    appendSystemLog('Admin', `Cập nhật tài khoản giáo viên: ${input.id}`);
  };

  const handleDeleteTeacher = async (id: string) => {
    await deleteTeacher(id);
    await loadTeachers();
    appendSystemLog('Admin', `Xóa giáo viên: ${id}`);
  };

  // Student CRUD triggers
 

    const handleUpdateStudentStatus =
        async (
            id: string,
            status:
                | "active"
                | "inactive",
        ) => {
            if (
                status === "inactive"
            ) {
                await lockStudent(id);
            } else {
                await unlockStudent(id);
            }

            // Luôn lấy lại DB thật.
            await loadStudents();

            appendSystemLog(
                "Admin",
                `Cập nhật trạng thái học sinh ${id} thành ${status === "active"
                    ? "Hoạt động"
                    : "Khóa"
                }`,
            );
        };

  // Subject CRUD triggers
  const handleAddSubject = (newSub: Omit<Subject, 'id' | 'chaptersCount' | 'topicsCount' | 'questionsCount'>) => {
    const subjectEntity: Subject = {
      ...newSub,
      id: `sub-${Date.now()}`,
      chaptersCount: 0,
      topicsCount: 0,
      questionsCount: 0
    };
    setSubjects([...subjects, subjectEntity]);
    appendSystemLog('Admin', `Thêm môn học mới: ${newSub.name} (${newSub.code})`);
  };

  const handleUpdateSubjectStatus = (id: string, sStatus: 'active' | 'inactive') => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, status: sStatus } : s));
    const sub = subjects.find(s => s.id === id);
    appendSystemLog('Admin', `Thay đổi trạng thái môn ${sub ? sub.name : id} thành ${sStatus === 'active' ? 'Hoạt động' : 'Khóa'}`);
  };

  const handleDeleteSubject = (id: string) => {
    const sub = subjects.find(s => s.id === id);
    setSubjects(subjects.filter(s => s.id !== id));
    appendSystemLog('Admin', `Xóa môn học: ${sub ? sub.name : id}`);
  };

 
    // Topic mapping triggers
    const loadTopics = async () => {
        try {
            const data = await topicService.getTopics();
            setTopics(data);
        } catch (error) {
            console.error("Load topics failed:", error);
            setTopics([]);
        }
    };
    const handleCreateTopic = async (
        request: CreateTopicRequest
    ) => {

        try {

            await topicService.createTopic(request);

            await loadTopics();

        } catch (error) {

            console.error(
                "Create topic failed:",
                error
            );
        }
    };

    const handleDeleteTopic = async (
        id: string
    ) => {

        try {

            await topicService.deleteTopic(id);

            await loadTopics();

        } catch (error) {

            console.error(
                "Delete topic failed:",
                error
            );
        }
    };

    const handleUpdateTopic = async (
        id: string,
        request: UpdateTopicRequest
    ) => {

        try {

            await topicService.updateTopic(
                id,
                request
            );

            await loadTopics();

        } catch (error) {

            console.error(
                "Update topic failed:",
                error
            );
        }
    };




    // Question bank CRUD triggers
    const handleAddQuestion = (
        newQ: Omit<Question, 'id' | 'createdBy' | 'createdAt'>
    ) => {
        const questionEntity: Question = {
            ...newQ,
            id: `que-${Date.now()}`,
            createdBy: 'System Academic Board',
            createdAt: new Date().toISOString()
        };

        setQuestions([questionEntity, ...questions]);

        // Update counts if question is approved
        if (newQ.status === 'approved') {
            // Update subject question count
            setSubjects(
                subjects.map(s =>
                    s.id === newQ.subjectId
                        ? {
                            ...s,
                            questionsCount: s.questionsCount + 1
                        }
                        : s
                )
            );

            // Update topic question count
            if (newQ.topicId) {
                setTopics(
                    topics.map(t =>
                        t.id === newQ.topicId
                            ? {
                                ...t,
                                questionsCount: t.questionsCount + 1
                            }
                            : t
                    )
                );
            }
        }
    };


    const handleUpdateQuestionStatus = (
        id: string,
        sStatus: QuestionStatus
    ) => {
        const target = questions.find(q => q.id === id);

        if (!target) return;

        setQuestions(
            questions.map(q =>
                q.id === id
                    ? {
                        ...q,
                        status: sStatus
                    }
                    : q
            )
        );

        appendSystemLog(
            'Admin',
            `Xét duyệt câu hỏi ID ${id} chuyển sang trạng thái [${sStatus}]`
        );

        // If transitioned to approved, increment totals
        if (
            sStatus === 'approved' &&
            target.status !== 'approved'
        ) {
            // Update subject question count
            setSubjects(
                subjects.map(s =>
                    s.id === target.subjectId
                        ? {
                            ...s,
                            questionsCount: s.questionsCount + 1
                        }
                        : s
                )
            );

            // Update topic question count
            if (target.topicId) {
                setTopics(
                    topics.map(t =>
                        t.id === target.topicId
                            ? {
                                ...t,
                                questionsCount: t.questionsCount + 1
                            }
                            : t
                    )
                );
            }
        }
    };


    const handleDeleteQuestion = (id: string) => {
        const target = questions.find(q => q.id === id);

        setQuestions(
            questions.filter(q => q.id !== id)
        );

        if (target && target.status === 'approved') {
            // Update subject question count
            setSubjects(
                subjects.map(s =>
                    s.id === target.subjectId
                        ? {
                            ...s,
                            questionsCount: Math.max(
                                0,
                                s.questionsCount - 1
                            )
                        }
                        : s
                )
            );

            // Update topic question count
            if (target.topicId) {
                setTopics(
                    topics.map(t =>
                        t.id === target.topicId
                            ? {
                                ...t,
                                questionsCount: Math.max(
                                    0,
                                    t.questionsCount - 1
                                )
                            }
                            : t
                    )
                );
            }
        }
    };

  // Assessment exam CRUD triggers
  const handleAddExam = (newE: Omit<Exam, 'id' | 'attemptsCount'>) => {
    const examEntity: Exam = {
      ...newE,
      id: `exm-${Date.now()}`,
      attemptsCount: 0
    };
    setExams([examEntity, ...exams]);
  };

  const handleUpdateExamStatus = (id: string, sStatus: ExamStatus) => {
    setExams(exams.map(e => e.id === id ? { ...e, status: sStatus } : e));
  };

  const handleDeleteExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id));
  };

  // Handles deep navigation triggers from children cards to focused views
  const handleDeepNavigate = (view: string, targetSubjectId?: string) => {
    setPreSelectSubjectId(targetSubjectId);
    setCurrentView(view);
  };

  // Sidebar Menu list
  const sidebarMenu = [
    { name: 'Tổng quan', icon: LayoutDashboard, view: 'Dashboard' },
    { name: 'Quản lý môn học', icon: Library, view: 'Subject Admin' },
    { name: 'Quản lý giáo viên', icon: Users, view: 'Teacher Management' },
    { name: 'Quản lý học sinh', icon: GraduationCap, view: 'Student Management' },
      {
          name: 'Quản lý chương & chủ đề',
          icon: BookOpen,
          view: 'Topic Management'
      },
    { name: 'Quản lý đề thi', icon: FileText, view: 'Exam Management' },
    { name: 'Thông báo hệ thống', icon: Bell, view: 'Notification Management' },
    { name: 'Báo cáo & Phân tích', icon: BarChart3, view: 'Analytics & Reports' },
    { name: 'Nhật ký hệ thống', icon: ShieldAlert, view: 'Audit Logs' },
    { name: 'Cài đặt', icon: Settings, view: 'Settings' }
  ];

  const handleLoginSuccess = (email: string, role: UserRole) => {
    setLoginEmail(email);
    setPortalMode(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    clearSession();
    // Xóa dữ liệu của phiên cũ để phiên đăng nhập tiếp theo (kể cả khác vai trò)
    // luôn nạp lại từ API thay vì dùng lại dữ liệu còn tồn trong bộ nhớ.
    setSubjects([]);
    setTopics([]);
    setTeachers([]);
    setStudents([]);
    setQuestions([]);
    setExams([]);
    setAttempts([]);
    setCurrentView('Dashboard');
    setPortalMode('admin');
    setLoginEmail('');
    setIsLoggedIn(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  // Log Out screen
  if (!isLoggedIn) {
    return (
      <LoginView onLoginSuccess={handleLoginSuccess} />
    );
  }

  if (portalMode === 'student') {
    return (
      <StudentPortalApp
        onLogout={handleLogout}
        loginEmail={loginEmail}
      />
    );
  }

  if (portalMode === 'teacher') {
    return (
      <TeacherPortalView 
        subjects={subjects}
        topics={topics}
        setTopics={setTopics}
        teachers={teachers}
        students={students}
        questions={questions}
        onUpdateQuestions={setQuestions}
        exams={exams}
        onUpdateExams={setExams}
        attempts={attempts}
        onLogout={handleLogout}
        notifications={notifications}
        onNotificationsChange={setNotifications}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] font-sans flex text-slate-900 antialiased" id="admin-workspace-base">
      
      {/* Dynamic Animated Master Sidebar */}
      <motion.aside 
        id="sidebar"
        animate={{ width: sidebarExpanded ? 240 : 80 }} 
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col shrink-0 bg-white border-r border-slate-200 relative z-30 shadow-xs"
      >
        {/* Sidebar Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold select-none text-sm shadow-sm">
              EX
            </div>
            {sidebarExpanded && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="font-bold text-lg tracking-tight text-slate-800 whitespace-nowrap"
              >
                {platformTitle.split(' ').slice(0, 2).join(' ')}
              </motion.span>
            )}
          </div>

          {/* Collapse switch trigger button */}
          <button 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            title={sidebarExpanded ? 'Collapse Navigation' : 'Expand Navigation'}
          >
            {sidebarExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation lists */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200" id="sidebar-navigations-group">
          {sidebarMenu.map((item) => {
            const IconComp = item.icon;
            const isSelected = currentView === item.view;
            return (
              <button
                key={item.name}
                onClick={() => handleDeepNavigate(item.view, undefined)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-150 cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <IconComp className={`w-4.5 h-4.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {sidebarExpanded && (
                  <motion.span 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer block */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* Logout trigger button */}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-500 font-semibold hover:bg-rose-50 transition-all cursor-pointer truncate ${!sidebarExpanded && 'justify-center'}`}
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {sidebarExpanded && <span>Đăng xuất</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Container context */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full min-h-0">
        
        {/* Top Operational Header */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 relative shadow-2xs">
          
          <div className="flex items-center gap-3 md:gap-0">
            {/* Mobile menu indicator placeholder */}
            <button className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Current path tracer */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="text-slate-500 font-semibold">{platformTitle}</span>
              <span>/</span>
              <span className="text-indigo-600 font-bold">{sidebarMenu.find(item => item.view === currentView)?.name || currentView}</span>
            </div>
          </div>

          {/* Topbar Right action slots */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
            
            {/* Current Date Time label marker */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100 select-none">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>12 Thg 6, 2026</span>
            </div>

            <div className="w-px h-6 bg-slate-100"></div>

            {/* Simulated Auth Profile badge representation */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                <Bell className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              </div>
              
              <div className="w-px h-6 bg-slate-100"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-700">truongtram1801</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">QUẢN TRỊ VIÊN</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold select-none text-sm">
                  AR
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Scrollable Viewstage Context */}
              {/* Scrollable Viewstage Context */}
              <main className="app-scrollbar flex-1 min-h-0 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                  <AnimatePresence mode="wait">
                      <motion.div
                          key={currentView}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                          {currentView === "Dashboard" && (
                              <DashboardView
                                  onNavigateToView={(v) =>
                                      handleDeepNavigate(v, undefined)
                                  }
                              />
                          )}

                          {currentView === "Teacher Management" && (
                              <TeacherManagementView
                                  teachers={teachers}
                                  subjects={subjects}
                                  onAddTeacher={handleAddTeacher}
                                  onUpdateTeacher={handleUpdateTeacher}
                                  onUpdateTeacherStatus={
                                      handleUpdateTeacherStatus
                                  }
                                  onDeleteTeacher={handleDeleteTeacher}
                              />
                          )}

                          {currentView === "Student Management" && (
                              <StudentManagementView
                                  students={students}
                                  grades={grades}
                                  onUpdateStudentStatus={
                                      handleUpdateStudentStatus
                                  }
                                  onReload={loadStudents}
                              />
                          )}

                          {currentView === "Topic Management" && (
                              <AdminCurriculumManagement
                                  subjects={subjects}
                                  grades={grades}
                              />
                          )}

                          {currentView === "Subject Admin" && (
                              <SubjectAdminView
                                  subjects={subjects}
                                  setSubjects={setSubjects}
                                  topics={topics}
                                  setTopics={setTopics}
                                  questions={questions}
                                  setQuestions={setQuestions}
                                  exams={exams}
                                  setExams={setExams}
                                  teachers={teachers}
                                  students={students}
                              />
                          )}

                        

                          {currentView === "Exam Management" && (
                              <AdminExamManagementView />
                          )}

                          {currentView === "Notification Management" && (
                              <AdminSynchronizedNotificationsView />
                          )}

                          {currentView === "Analytics & Reports" && (
                              <AnalyticsReportsView />
                          )}

                          {currentView === "Audit Logs" && <AuditLogsView />}

                          {currentView === "Settings" && (
                              <SettingsView
                                  platformTitle={platformTitle}
                                  onUpdatePlatformTitle={
                                      setPlatformTitle
                                  }
                              />
                          )}
                      </motion.div>
                  </AnimatePresence>
              </main>
      </div>

    </div>
  );
}
