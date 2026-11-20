/**
 * @license
* SPDX-License-Identifier: Apache-2.0
*/
import TopicPracticeView from "./components/TopicPracticeView";
import WordPuzzleGameView from "./components/WordPuzzleGameView";
import { apiUrl } from "../api";

import type {
    TopicDto,
} from "../services/topicService";
import {
    getMyStudentProfile,
    type StudentApiDto,
} from "../services/studentService";
import React from "react";
import "./student.css";
import {
  Home,
  BookOpenCheck,
  TrendingUp,
  User,
  Sparkles,
  Flame,
  GraduationCap,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Bell,
} from "lucide-react";

import DeviceFrame from "./components/DeviceFrame";
import HomeTab from "./components/HomeTab";
import NotificationWatcher from "../components/NotificationWatcher";
import TopicTab from "./components/TopicTab";
import PracticeTab from "./components/PracticeTab";
import ResultsTab from "./components/ResultsTab";
import ProfileTab from "./components/ProfileTab";
import FlashcardDecks from "./components/FlashcardDecks";
import AIAssistantBubble from "./components/AIAssistantBubble";

import { UserStats, CleanHistoryItem, SubjectId } from "./types";
import { DEFAULT_USER_STATS } from "./data";
import { addLearningActivity, clearActivities } from "./utils/activityLogger";

export interface StudentPortalAppProps {
  onLogout: () => void;
  loginEmail?: string;
}

export default function StudentPortalApp({ onLogout, loginEmail }: StudentPortalAppProps) {
    const [
        studentProfile,
        setStudentProfile,
    ] = React.useState<StudentApiDto | null>(
        null,
    );

    const [
        profileLoading,
        setProfileLoading,
    ] = React.useState(true);

    const [
        profileError,
        setProfileError,
    ] = React.useState<string | null>(
        null,
    );
  // 1. CHỈ SỐ NAVIGATION TAB (0 = Home, 1 = Chủ đề học, 2 = Luyện đề, 3 = Kết quả, 4 = Cá nhân)
    const [activeTab, setActiveTab] = React.useState<number>(0);
    const [
        selectedTopic,
        setSelectedTopic,
    ] = React.useState<TopicDto | null>(
        null,
    );
    const [
        selectedWordGameTopic,
        setSelectedWordGameTopic,
    ] = React.useState<TopicDto | null>(
        null,
    );
  const [sidebarExpanded, setSidebarExpanded] = React.useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [practiceSubject, setPracticeSubject] = React.useState<SubjectId | null>(null);

  // Trạng thái điều hướng sâu từ trang chủ đến đúng đề thi hôm nay
  const [navTargetExam, setNavTargetExam] = React.useState<{ subjectId: SubjectId; examId: string } | null>(null);

  const handleNavigateToExam = (subjectId: SubjectId, examId: string) => {
    setNavTargetExam({ subjectId, examId });
    setActiveTab(2); // Chuyển sang Luyện đề
  };

  // 2. KHỞI TẠO STATE NGƯỜI DÙNG & LỊCH SỬ THI (Local Persistence via LocalStorage)
  const [stats, setStats] = React.useState<UserStats>(() => {
    const cached = localStorage.getItem("smartexam_user_stats");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    if (loginEmail) {
      const localName = loginEmail.split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return { ...DEFAULT_USER_STATS, fullName: localName || DEFAULT_USER_STATS.fullName };
    }
    return DEFAULT_USER_STATS;
  });
    const loadStudentProfile =
        React.useCallback(
            async () => {
                try {
                    setProfileLoading(true);

                    setProfileError(null);

                    const data =
                        await getMyStudentProfile();

                    setStudentProfile(data);

                    // Đồng bộ tên thật vào các vị trí
                    // khác của Student Portal.
                    setStats((previous) => ({
                        ...previous,
                        fullName: data.hoTen,
                    }));
                } catch (error) {
                    console.error(
                        "Không tải được hồ sơ học sinh:",
                        error,
                    );

                    setProfileError(
                        error instanceof Error
                            ? error.message
                            : "Không tải được hồ sơ học sinh.",
                    );
                } finally {
                    setProfileLoading(false);
                }
            },
            [],
        );

    React.useEffect(() => {
        void loadStudentProfile();
    }, [loadStudentProfile]);
  React.useEffect(() => {
    if (!studentProfile?.id) return;
    const defaults = { dailyGoalMinutes: 30, targetScore: 25, targetUniversity: "" };
    try {
      const saved = JSON.parse(localStorage.getItem(`smartexam_learning_goals:${studentProfile.id}`) || "null");
      const goals = saved && Number.isInteger(saved.dailyGoalMinutes) && saved.dailyGoalMinutes >= 5 && saved.dailyGoalMinutes <= 300
        && Number.isFinite(saved.targetScore) && saved.targetScore >= 0 && saved.targetScore <= 30 && typeof saved.targetUniversity === "string"
        ? saved : defaults;
      setStats(previous => ({ ...previous, ...goals }));
    } catch { setStats(previous => ({ ...previous, ...defaults })); }
  }, [studentProfile?.id]);
  const [historyLogs, setHistoryLogs] = React.useState<CleanHistoryItem[]>(() => {
    const cached = localStorage.getItem("smartexam_history_logs");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    return [];
  });

  // 3. ĐIỀU KHIỂN CHẾ ĐỘ OVERLAY (Flashcards & Floating AI Assistant)
  const [isFlashcardsOpen, setIsFlashcardsOpen] = React.useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = React.useState<string | undefined>(undefined);

  // Trạng thái sức khỏe AI hiển thị nhanh tại header trang chủ
  const aiStatus: string = 'checking';

  // Đồng bộ hóa trạng thái học tập xuống LocalStorage định kỳ để giữ dữ liệu bền vững
  React.useEffect(() => {
    localStorage.setItem("smartexam_user_stats", JSON.stringify(stats));
  }, [stats]);

  React.useEffect(() => {
    localStorage.setItem("smartexam_history_logs", JSON.stringify(historyLogs));
  }, [historyLogs]);

  // Dọn dữ liệu lộ trình học cũ còn sót trong trình duyệt (tính năng đã được gỡ bỏ).
  React.useEffect(() => {
    localStorage.removeItem("smartexam_roadmap");
  }, []);

  // Sync theme changes
  React.useEffect(() => {
    const handleThemeChange = () => {
      const theme = localStorage.getItem('smartexam_theme_mode');
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      const color = localStorage.getItem('smartexam_theme_color') || 'purple';
      document.documentElement.setAttribute('data-color', color);
    };
    handleThemeChange();
    window.addEventListener("storage", handleThemeChange);
    const interval = setInterval(handleThemeChange, 500);
    return () => {
      window.removeEventListener("storage", handleThemeChange);
      clearInterval(interval);
    };
  }, []);

  // Bảo mật & Đồng bộ: Đồng bộ hóa toàn bộ lịch sử thi từ trình duyệt lên máy chủ khi khởi chạy ứng dụng
  React.useEffect(() => {
    const syncHistoryOnStartup = async () => {
      if (historyLogs && historyLogs.length > 0) {
        try {
          await fetch(apiUrl("/api/student/exams/history/sync"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ historyItems: historyLogs })
          });
        } catch (e) {
          console.warn("Lỗi đồng bộ lịch sử khởi chạy:", e);
        }
      }
    };
    syncHistoryOnStartup();
  }, []);

  // HÀM: Tế bào học sinh thưởng ngọc khi vượt qua thẻ nhớ hoặc trắc nghiệm
  const handleEarnGems = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      gems: prev.gems + amount,
    }));
  };

  // HÀM: Ghi nhận đề thi vừa xong vào lịch sử
  const handleAddHistoryLog = async (item: CleanHistoryItem, skipServerSync: boolean = false) => {
    setHistoryLogs((prev) => {
      // Tránh trùng trùng ID bản ghi lịch sử
      if (prev.some(x => x.id === item.id)) return prev;
      return [...prev, item];
    });

    const VietnameseSub = item.subjectId === "math" ? "Toán" : item.subjectId === "english" ? "Tiếng Anh" : item.subjectId === "physics" ? "Vật Lý" : item.subjectId === "chemistry" ? "Hóa Học" : item.subjectId === "biology" ? "Sinh Học" : "Môn học";
    addLearningActivity(
      "quiz",
      item.examTitle,
      `Môn ${VietnameseSub}: Đã làm xong đề đạt kết quả ${item.score}/${item.totalQuestions} đúng`,
      item.subjectId
    );
    
    if (!skipServerSync) {
      // Bảo mật & Đồng bộ: Gửi bản ghi thi cử trực tiếp lên Server ngay lập tức để có thể Xem lại chuẩn
      try {
        await fetch(apiUrl("/api/student/exams/history"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historyItem: item })
        });
      } catch (e) {
        console.warn("Lỗi đồng bộ bài thi mới lên Server:", e);
      }
    }
    
    // Đồng thời cập nhật mức độ bứt phá môn học tương ứng trong stats (gamified feedback)
    setStats((prev) => {
      const currentProgress = prev.subjectProgress[item.subjectId] || 0;
      // Cộng thêm 15% bứt phá tiến độ cho mỗi đề hoàn thành
      const updatedProgress = Math.min(100, currentProgress + 15);
      return {
        ...prev,
        subjectProgress: {
          ...prev.subjectProgress,
          [item.subjectId]: updatedProgress,
        }
      };
    });
  };

  // HÀM: Tăng số phút học ngày hôm nay (Bấm nút tập trung)
  const handleIncrementStudyTime = () => {
    setStats((prev) => {
      const updatedMins = prev.todayMinutesStudied + 2;
      let extraGems = 0;
      
      // Nếu vừa đạt đúng chỉ tiêu ngày (e.g. 30p), thưởng nóng 50 Ngọc Đỏ khích lệ
      if (prev.todayMinutesStudied < prev.dailyGoalMinutes && updatedMins >= prev.dailyGoalMinutes) {
        extraGems = 50;
      }
      
      return {
        ...prev,
        todayMinutesStudied: updatedMins,
        gems: prev.gems + extraGems + 5, // Mỗi lần tăng cộng 5 ngọc
      };
    });
  };

  // HÀM: Đặt lại toàn bộ lịch sử tiến trình học thành một Học Sinh Mới tinh (Chế độ Demo)
  const handleResetProgress = () => {
    localStorage.removeItem("smartexam_user_stats");
    localStorage.removeItem("smartexam_history_logs");
    clearActivities();
    
    // Tạo cấu hình một học sinh hoàn chỉnh bắt đầu từ con số 0 để ban giám khảo dễ thử nghiệm
    const freshNewStats: UserStats = {
      fullName: "Học Sinh Mới",
      targetUniversity: "Đại học Khoa học Tự nhiên",
      targetScore: 25,
      currentStreak: 0,
      gems: 0,
      dailyGoalMinutes: 30,
      todayMinutesStudied: 0,
      subjectProgress: {
        math: 0,
        english: 0,
        physics: 0,
        chemistry: 0,
      }
    };

    setStats(freshNewStats);
    setHistoryLogs([]); // Làm sạch hoàn toàn lịch sử thi thử
    setActiveTab(0);
    setIsFlashcardsOpen(false);
    setIsAIChatOpen(false);
  };

  // Kích hoạt Gia sư AI từ các màn hình con
  const handleTriggerAIChat = (prompt?: string) => {
    setAiInitialPrompt(prompt);
    setIsAIChatOpen(true);
  };

  // 4. RENDER TAB NỘI DUNG TƯƠNG ỨNG (Route view coordinator)
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <HomeTab
            stats={stats}
            onIncrementTime={handleIncrementStudyTime}
            onOpenFlashcards={() => setIsFlashcardsOpen(true)}
            onOpenAIChat={handleTriggerAIChat}
            onSwitchTab={setActiveTab}
            onSelectSubjectForPractice={(subId) => {
              setPracticeSubject(subId);
              setActiveTab(2);
            }}
            onNavigateToExam={handleNavigateToExam}
          />
        );
        case 1:
            if (selectedWordGameTopic) {
                return (
                    <WordPuzzleGameView
                        topic={selectedWordGameTopic}
                        onBack={() => {
                            setSelectedWordGameTopic(null);
                        }}
                        onEarnGems={handleEarnGems}
                    />
                );
            }

            if (selectedTopic) {
                return (
                    <TopicPracticeView
                        topic={selectedTopic}
                        onBack={() => {
                            setSelectedTopic(null);
                        }}
                        onStartWordGame={() => {
                            const topicToPlay = selectedTopic;
                            setSelectedTopic(null);
                            setSelectedWordGameTopic(topicToPlay);
                        }}
                    />
                );
            }

            return (
                <TopicTab
                    onSelectTopic={(topic) => {
                        setSelectedTopic(topic);
                    }}
                    onSelectWordGameTopic={(topic) => {
                        setSelectedWordGameTopic(topic);
                    }}
                />
            );
      case 2:
        return (
          <PracticeTab
            onEarnGems={handleEarnGems}
            onAddHistory={handleAddHistoryLog}
            onOpenAIChat={handleTriggerAIChat}
            initialSubjectId={navTargetExam ? navTargetExam.subjectId : practiceSubject}
            initialExamId={navTargetExam?.examId}
            onClearNavigation={() => {
              setNavTargetExam(null);
              setPracticeSubject(null);
            }}
          />
        );
      case 3:
        return (
          <ResultsTab
            stats={stats}
            historyLogs={historyLogs}
            onOpenAIChat={handleTriggerAIChat}
            onSwitchTab={setActiveTab}
            onAddHistory={handleAddHistoryLog}
          />
        );
        case 4:
            return (
                <ProfileTab
                    profile={studentProfile}
                    loading={profileLoading}
                    error={profileError}
                    onReload={loadStudentProfile}
                    onLogout={onLogout}
                    stats={stats}
                    onSaveGoals={(goals) => {
                        if (!studentProfile) throw new Error("Hồ sơ đang tải. Vui lòng thử lại.");
                        localStorage.setItem(`smartexam_learning_goals:${studentProfile.id}`, JSON.stringify(goals));
                        setStats(previous => ({ ...previous, ...goals }));
                    }}
                />
            );
      default:
        return null;
    }
  };

    const currentTabTitle = [
        "Trang chủ",
        "Chủ đề học",
        "Luyện đề",
        "Kết quả",
        "Cá nhân"
    ][activeTab];

    const navigationItems = [
        { label: "Trang chủ", icon: Home },
        { label: "Chủ đề học", icon: BookOpenCheck },
        { label: "Luyện đề", icon: BookOpenCheck },
        { label: "Kết quả", icon: TrendingUp },
        { label: "Cá nhân", icon: User },
    ];

  const renderNavigation = (mobile = false) => (
    <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5 no-scrollbar">
      {navigationItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeTab === idx;
        return (
          <button
            key={item.label}
            id={`nav-tab-${idx}`}
            onClick={() => {
              setActiveTab(idx);
              if (mobile) setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
              isActive
                ? "bg-[var(--theme-primary)] text-white shadow-pastel-blue"
                : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)] hover:text-[var(--theme-primary)]"
            } ${!sidebarExpanded && !mobile ? "justify-center" : ""}`}
            title={!sidebarExpanded && !mobile ? item.label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {(sidebarExpanded || mobile) && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <DeviceFrame>
      <NotificationWatcher />
      <div className="h-screen w-full flex overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text)]">
        {/* Sidebar desktop */}
        <aside
          className={`hidden md:flex flex-col shrink-0 bg-[var(--theme-surface)] border-r border-[var(--theme-border)] shadow-sm z-30 transition-[width] duration-300 ${
            sidebarExpanded ? "w-[248px]" : "w-[84px]"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--theme-border)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[var(--theme-primary)] text-white flex items-center justify-center font-black shrink-0 shadow-sm">S</div>
              {sidebarExpanded && (
                <div className="min-w-0">
                  <h1 className="font-display font-black text-sm truncate">SmartExam</h1>
                  <p className="text-[10px] text-[var(--theme-text-light)] font-bold uppercase tracking-wider">Student Portal</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarExpanded((value) => !value)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--theme-text-light)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-surface-soft)] transition"
              title={sidebarExpanded ? "Thu gọn sidebar" : "Mở rộng sidebar"}
            >
              {sidebarExpanded ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeftOpen className="w-4.5 h-4.5" />}
            </button>
          </div>

          {renderNavigation()}

          <div className="p-3 border-t border-[var(--theme-border)] space-y-2">
            <div className={`flex items-center gap-3 rounded-xl bg-[var(--theme-surface-soft)] p-3 ${!sidebarExpanded ? "justify-center" : ""}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white flex items-center justify-center font-black shrink-0">
                              {studentProfile?.hoTen?.[0] || "H"}
              </div>
              {sidebarExpanded && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black truncate">{stats.fullName}</p>
                  <p className="text-[10px] text-[var(--theme-text-light)] truncate">Học sinh</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 transition ${!sidebarExpanded ? "justify-center" : ""}`}
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              {sidebarExpanded && <span>Đăng xuất</span>}
            </button>
          </div>
        </aside>

        {/* Sidebar mobile */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-[80] md:hidden">
            <button
              aria-label="Đóng menu"
              className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="relative h-full w-[285px] bg-[var(--theme-surface)] border-r border-[var(--theme-border)] shadow-2xl flex flex-col animate-fade-in">
              <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--theme-border)]">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-primary)] text-white flex items-center justify-center font-black">S</div>
                <div>
                  <h1 className="font-display font-black text-sm">SmartExam Learning</h1>
                  <p className="text-[10px] text-[var(--theme-text-light)] uppercase font-bold tracking-wider">Student Portal</p>
                </div>
              </div>
              {renderNavigation(true)}
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          {/* Header desktop */}
          <header className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[var(--theme-border)] px-4 md:px-7 flex items-center justify-between z-20 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)]"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-[var(--theme-text-light)] font-bold uppercase tracking-wider">Không gian học sinh</p>
                <h2 className="text-sm md:text-base font-display font-black truncate">{currentTabTitle}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">

              <button className="hidden sm:flex relative w-9 h-9 rounded-xl items-center justify-center text-[var(--theme-text-light)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-surface-soft)] transition">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--theme-surface)]" />
              </button>

              <button
                id="btn-header-ai-assist"
                onClick={() => handleTriggerAIChat()}
                className="px-3 py-2 rounded-xl bg-[#EFF4FF] border border-[var(--theme-primary)]/15 hover:bg-[#E2EBFF] transition text-[var(--theme-primary)] flex items-center gap-2 active:scale-95"
              >
                <div className="relative">
                  <Sparkles className="w-4 h-4 fill-[var(--theme-primary)]" />
                  <span className={`absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full border border-white ${
                    aiStatus === "online" ? "bg-emerald-500 animate-pulse" : aiStatus === "checking" ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                  }`} />
                </div>
                <span className="hidden sm:inline text-[11px] font-black">Gia Sư AI</span>
              </button>

              <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-[var(--theme-border)]">
                <div className="text-right">
                  <p className="text-xs font-black max-w-[150px] truncate">{stats.fullName}</p>
                  <p className="text-[9px] text-[var(--theme-text-light)] uppercase font-bold tracking-wider">Học sinh</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white flex items-center justify-center font-black text-sm">
                  {stats.fullName?.[0] || "H"}
                </div>
              </div>
            </div>
          </header>

          {/* Main view */}
          <main className="relative flex-1 min-h-0 overflow-hidden bg-[var(--theme-bg)] student-main-workspace">
            <div className="h-full w-full max-w-[1500px] mx-auto flex flex-col">
              {renderTabContent()}
            </div>

            {isFlashcardsOpen && (
              <FlashcardDecks
                onEarnGems={handleEarnGems}
                onClose={() => setIsFlashcardsOpen(false)}
              />
            )}

            {isAIChatOpen && (
              <AIAssistantBubble
                isOpen={isAIChatOpen}
                onClose={() => {
                  setIsAIChatOpen(false);
                  setAiInitialPrompt(undefined);
                }}
                initialPrompt={aiInitialPrompt}
                stats={stats}
              />
            )}
          </main>

          {/* Bottom navigation only on small screens */}
          <div className="md:hidden h-[66px] bg-[var(--theme-surface)] border-t border-[var(--theme-border)] grid grid-cols-5 z-40 shrink-0 shadow-nav">
            {navigationItems.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(idx)}
                  className="flex flex-col items-center justify-center gap-1 transition active:scale-95"
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-[var(--theme-primary)] stroke-[2.5]" : "text-slate-400"}`} />
                  <span className={`text-[9px] font-bold ${isActive ? "text-[var(--theme-primary)]" : "text-slate-400"}`}>
                    {tab.label.replace(" học", "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DeviceFrame>
  );
}
