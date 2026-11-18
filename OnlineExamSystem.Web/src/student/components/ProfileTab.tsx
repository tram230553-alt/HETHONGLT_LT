import React, {
    useState,
    useEffect,
} from "react";

import {
  Award,
  AlertCircle,
  BarChart2,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
  FileText,
  GraduationCap,
  Hash,
  Info,
  Key,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Target,
  Trophy,
  MonitorSmartphone,
  Star,
  User,
  X,
} from "lucide-react";
import type {
  StudentApiDto,
  StudentResultDto,
  StudentLoginSessionDto,
} from "../../services/studentService";
import {
  changeMyPassword,
  getMyLoginSessions,
  getMyStudentResults,
} from "../../services/studentService";
import {
  getPracticeAttempts,
  type PracticeAttemptDto,
} from "../../services/practiceService";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "../../services/notificationService";
import LeaderboardView from "./LeaderboardView";
import LearningGoalsModal from "./LearningGoalsModal";
import type { UserStats } from "../types";
interface ProfileTabProps {
  profile: StudentApiDto | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  onLogout?: () => void;
  stats: UserStats;
  onSaveGoals: (goals: Pick<UserStats, "dailyGoalMinutes" | "targetScore" | "targetUniversity">) => void;
}

type ModalType = "none" | "password" | "logout" | "achievements" | "devices" | "notifications";

function formatDate(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function scoreText(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

export default function ProfileTab({
  profile,
  loading,
  error,
  onReload,
  onLogout,
  stats,
  onSaveGoals,
}: ProfileTabProps) {
  const [showGoals, setShowGoals] = React.useState(false);
  const [results, setResults] = React.useState<StudentResultDto[]>([]);
  const [practiceAttempts, setPracticeAttempts] = React.useState<PracticeAttemptDto[]>([]);
  const [loginSessions, setLoginSessions] = React.useState<StudentLoginSessionDto[]>([]);
  const [notifications, setNotifications] = React.useState<NotificationDto[]>([]);
  const [panelLoading, setPanelLoading] = React.useState(false);
  const [panelError, setPanelError] = React.useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = React.useState(true);
  const [resultsError, setResultsError] = React.useState<string | null>(null);
  const [modal, setModal] = React.useState<ModalType>("none");
  const [toast, setToast] = React.useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("student-dark-mode") === "true";
    });

    const [themeColor, setThemeColor] = useState(() => {
        return localStorage.getItem("student-theme-color") || "#6366f1";
    });

    const [showThemePicker, setShowThemePicker] = useState(false);
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
    const [showLeaderboard, setShowLeaderboard] =
        React.useState(false);
  const notifyLater = (feature: string) => {
    setToast(`${feature}: chức năng sẽ hoàn thiện sau.`);
    window.setTimeout(() => setToast(null), 2400);
  };

  const loadResultSummary = React.useCallback(async () => {
    try {
      setResultsLoading(true);
      setResultsError(null);
      const [examData, practiceData] = await Promise.all([
        getMyStudentResults(),
        getPracticeAttempts(),
      ]);
      setResults(examData);
      setPracticeAttempts(practiceData);
    } catch (err) {
      setResultsError(
        err instanceof Error ? err.message : "Không tải được thống kê bài thi.",
      );
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const openRealDataPanel = async (
    target: Extract<ModalType, "devices" | "notifications">,
  ) => {
    setModal(target);
    setPanelLoading(true);
    setPanelError(null);
    try {
      if (target === "devices") {
        setLoginSessions(await getMyLoginSessions());
      } else {
        setNotifications(await getNotifications());
      }
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setPanelLoading(false);
    }
  };

  const readNotification = async (item: NotificationDto) => {
    if (item.isRead) return;
    await markNotificationRead(item.id);
    setNotifications((current) => current.map((value) =>
      value.id === item.id ? { ...value, isRead: true, readAt: new Date().toISOString() } : value));
  };

  const readAllNotifications = async () => {
    await markAllNotificationsRead();
    const now = new Date().toISOString();
    setNotifications((current) => current.map((value) => ({
      ...value,
      isRead: true,
      readAt: value.readAt ?? now,
    })));
  };

  React.useEffect(() => {
    void loadResultSummary();
  }, [loadResultSummary]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("student-dark-mode", "true");
      localStorage.setItem("smartexam_theme_mode", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("student-dark-mode", "false");
      localStorage.setItem("smartexam_theme_mode", "light");
    }
    localStorage.setItem("smartexam_theme_trigger", Date.now().toString());
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.setAttribute("data-color", themeColor);
    localStorage.setItem("student-theme-color", themeColor);
    localStorage.setItem("smartexam_theme_color", themeColor);
    localStorage.setItem("smartexam_theme_trigger", Date.now().toString());
  }, [themeColor]);

  const uniqueExamCount = React.useMemo(
    () => new Set(results.map((item) => item.examId)).size,
    [results],
  );

  const averageScore = React.useMemo(() => {
    if (results.length === 0) return 0;
    return results.reduce((sum, item) => sum + item.diem, 0) / results.length;
  }, [results]);

  const highestScore = React.useMemo(() => {
    if (results.length === 0) return 0;
    return Math.max(...results.map((item) => item.diem));
  }, [results]);

  const latestResult = React.useMemo(() => {
    return [...results].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )[0];
  }, [results]);

  const achievements = React.useMemo(() => {
    const totalActivities = results.length + practiceAttempts.length;
    const bestPracticeScore = practiceAttempts.length
      ? Math.max(...practiceAttempts.map((item) => item.score))
      : 0;
    const bestScore = Math.max(highestScore, bestPracticeScore);
    return [
      { title: "Bước khởi đầu", description: "Hoàn thành bài thi hoặc bài luyện tập đầu tiên", unlocked: totalActivities >= 1, progress: Math.min(totalActivities, 1), target: 1 },
      { title: "Học tập chăm chỉ", description: "Hoàn thành 10 lượt học tập", unlocked: totalActivities >= 10, progress: Math.min(totalActivities, 10), target: 10 },
      { title: "Điểm số nổi bật", description: "Đạt từ 8 điểm trong một lượt làm bài", unlocked: bestScore >= 8, progress: Math.min(bestScore, 8), target: 8 },
      { title: "Chinh phục tuyệt đối", description: "Đạt điểm 10 trong một lượt làm bài", unlocked: bestScore >= 10, progress: Math.min(bestScore, 10), target: 10 },
    ];
  }, [highestScore, practiceAttempts, results.length]);

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setPasswordLoading(true);
      await changeMyPassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setModal("none");
      setToast("Đổi mật khẩu thành công.");
      window.setTimeout(() => setToast(null), 2400);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Đổi mật khẩu thất bại.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--theme-bg)]">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải hồ sơ học sinh...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--theme-bg)]">
        <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-3xl border border-[var(--theme-border)] p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-rose-500">
            {error || "Không tìm thấy hồ sơ học sinh."}
          </p>
          <button
            type="button"
            onClick={onReload}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--theme-primary)] text-white text-xs font-black"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--theme-bg)]">
      {showGoals && <LearningGoalsModal stats={stats} onClose={() => setShowGoals(false)} onSave={onSaveGoals} />}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[120] max-w-sm bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex-none px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[var(--theme-text)]">
            Trang Cá Nhân
          </h2>
          <p className="text-[10px] text-[var(--theme-text-light)] mt-0.5">
            Hồ sơ xác minh và thống kê lấy từ dữ liệu hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onReload();
            void loadResultSummary();
          }}
          className="w-9 h-9 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-light)] hover:text-[var(--theme-primary)] shadow-sm"
          title="Tải lại"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 pb-24 pt-5 md:pt-7 space-y-6 md:space-y-8 no-scrollbar scroll-smooth">
        {/* THÔNG TIN HỌC SINH */}
        <section className="bg-[var(--theme-surface)] p-6 rounded-[20px] shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--theme-primary)]/5 to-transparent rounded-bl-[100px] pointer-events-none" />
          <div className="w-20 h-20 bg-[#F0EDFF] rounded-[24px] flex items-center justify-center shadow-sm">
            <User className="w-9 h-9 text-[var(--theme-primary)]" />
          </div>

          <h3 className="font-extrabold text-[var(--theme-text)] text-[16px] mt-4 tracking-tight">
            {profile.hoTen}
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="text-[10px] font-black uppercase text-[var(--theme-primary)] bg-[#F0EDFF] px-2.5 py-1 rounded-full">
              {profile.maHS}
            </span>
            <span className="text-[10px] font-bold text-[var(--theme-text-light)] bg-[var(--theme-surface-soft)] px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              {profile.tenKhoi || "Chưa có khối"}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Đã xác minh
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-5 border-t border-slate-50/80">
            <div className="bg-[#E6F4FF] rounded-xl py-2.5 flex flex-col items-center justify-center">
              <span className="text-[9px] text-[#0D62C2] font-black uppercase tracking-wider mb-1">Đề đã thi</span>
              <span className="text-xs font-black text-[#0B4FA1]">{uniqueExamCount} đề</span>
            </div>
            <div className="bg-[#F0EDFF] rounded-xl py-2.5 flex flex-col items-center justify-center">
              <span className="text-[9px] text-[#5C45D6] font-black uppercase tracking-wider mb-1">Điểm TB</span>
              <span className="text-xs font-black text-[var(--theme-primary)]">{scoreText(averageScore)}</span>
            </div>
            <div className="bg-[#E6FCF5] rounded-xl py-2.5 flex flex-col items-center justify-center">
              <span className="text-[9px] text-[#0F8A5D] font-black uppercase tracking-wider mb-1">Cao nhất</span>
              <span className="text-xs font-black text-[#0F9F6E]">{scoreText(highestScore)}</span>
            </div>
          </div>

         
        </section>

        {/* THÔNG TIN TÀI KHOẢN */}
        <section className="space-y-3.5">
          <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase px-1">
            Thông Tin Học Sinh
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[
              { icon: Hash, label: "Mã học sinh", value: profile.maHS },
              { icon: Mail, label: "Email cá nhân", value: profile.email },
              { icon: GraduationCap, label: "Khối", value: profile.tenKhoi },
              { icon: CalendarDays, label: "Ngày sinh", value: formatDate(profile.ngaySinh) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[var(--theme-surface)] p-4 rounded-[20px] shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[12px] bg-[var(--theme-surface-soft)] flex items-center justify-center text-[var(--theme-primary)] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
                  <p className="text-xs font-extrabold text-[var(--theme-text-muted)] mt-0.5 break-all">
                    {value || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-[11px] font-bold text-amber-800">
            Mã học sinh, họ tên và khối là thông tin đã đối chiếu với danh sách trường. Học sinh không tự thay đổi các trường này.
          </div>
        </section>

        {/* THỐNG KÊ HỌC TẬP */}
        <section className="space-y-3.5">
          <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase px-1">
            Thống Kê Bài Thi
          </p>
          {resultsError && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-600">
              {resultsError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#F0EDFF]/80 p-4.5 rounded-[20px] flex flex-col justify-between h-28">
              <div className="w-8 h-8 rounded-[12px] bg-[var(--theme-surface)]/70 flex items-center justify-center text-[var(--theme-primary)]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-[#6D53EE] opacity-80">Số đề đã làm</p>
                <h4 className="text-[15px] font-black text-[#4B32C7] mt-0.5">
                  {resultsLoading ? "..." : `${uniqueExamCount} đề`}
                </h4>
              </div>
            </div>

            <div className="bg-[#E6F4FF]/80 p-4.5 rounded-[20px] flex flex-col justify-between h-28">
              <div className="w-8 h-8 rounded-[12px] bg-[var(--theme-surface)]/70 flex items-center justify-center text-[#0F79F3]">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-[#0D62C2] opacity-80">Tổng lượt thi</p>
                <h4 className="text-[15px] font-black text-[#0B4FA1] mt-0.5">
                  {resultsLoading ? "..." : `${results.length} lượt`}
                </h4>
              </div>
            </div>

            <div className="bg-[#FFF9E6]/80 p-4.5 rounded-[20px] flex flex-col justify-between h-28">
              <div className="w-8 h-8 rounded-[12px] bg-[var(--theme-surface)]/70 flex items-center justify-center text-[#D48F00]">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-[#A67000] opacity-80">Điểm cao nhất</p>
                <h4 className="text-[15px] font-black text-[#855A00] mt-0.5">{scoreText(highestScore)}</h4>
              </div>
            </div>

            <div className="bg-[#E6FCF5]/80 p-4.5 rounded-[20px] flex flex-col justify-between h-28">
              <div className="w-8 h-8 rounded-[12px] bg-[var(--theme-surface)]/70 flex items-center justify-center text-[#0F9F6E]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-[#0B7A54] opacity-80">Bài gần nhất</p>
                <h4 className="text-[12px] font-black text-[#085E40] mt-0.5 line-clamp-1">
                  {latestResult?.tenBaiKT || "Chưa có kết quả"}
                </h4>
              </div>
            </div>
          </div>
        </section>

        {/* HỌC TẬP & RÈN LUYỆN - BACKEND CHƯA CÓ */}
              <section className="space-y-3.5">
                  <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase px-1">
                      📚 Học Tập & Rèn Luyện
                  </p>

                  <div className="bg-[var(--theme-surface)] rounded-[20px] shadow-sm overflow-hidden flex flex-col px-2 py-2 divide-y divide-slate-50">

                      {[
                          {
                              icon: Target,
                              label: "Mục tiêu học tập hàng ngày",
                              action: () => setShowGoals(true),
                              later: false,
                          },
                          {
                              icon: Award,
                              label: "Thành tựu học tập",
                              action: () => setModal("achievements"),
                              later: false,
                          },
                          {
                              icon: Trophy,
                              label: "Bảng xếp hạng",
                              action: () => setShowLeaderboard(true),
                              later: false,
                          },
                      ].map(
                          ({
                              icon: Icon,
                              label,
                              action,
                              later,
                          }) => (
                              <button
                                  key={label}
                                  type="button"
                                  onClick={action}
                                  className="w-full p-3.5 flex items-center justify-between hover:bg-[var(--theme-surface-soft)] transition-colors rounded-[16px] text-left"
                              >
                                  <div className="flex items-center gap-3.5">
                                      <div className="w-10 h-10 rounded-[12px] bg-[var(--theme-surface-soft)] flex items-center justify-center text-[var(--theme-primary)]">
                                          <Icon className="w-5 h-5" />
                                      </div>

                                      <span className="font-extrabold text-[var(--theme-text-muted)] text-xs">
                                          {label}
                                      </span>
                                  </div>

                                  {later ? (
                                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 rounded-full px-2 py-1">
                                          Làm sau
                                      </span>
                                  ) : (
                                      <span className="text-[9px] font-black text-[var(--theme-primary)] bg-[var(--theme-surface-soft)] rounded-full px-2 py-1">
                                          Xem
                                      </span>
                                  )}

                              </button>

                          )
                      )}

                  </div>
                  {showLeaderboard && (
                      <LeaderboardView
                          onClose={() => setShowLeaderboard(false)}
                      />
                  )}
              </section>

        {/* GIAO DIỆN - BACKEND/SETTING ĐỒNG BỘ CHƯA CÓ */}
              {/* GIAO DIỆN */}
              <section className="space-y-3.5">
                  <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase px-1">
                      🎨 Giao Diện
                  </p>

                  <div className="bg-[var(--theme-surface)] rounded-[20px] shadow-sm overflow-hidden flex flex-col px-2 py-2 divide-y divide-slate-50">

                      {/* CHẾ ĐỘ TỐI */}
                      <button
                          type="button"
                          onClick={() => setDarkMode((prev) => !prev)}
                          className="w-full p-3.5 flex items-center justify-between hover:bg-[var(--theme-surface-soft)] transition-colors rounded-[16px] text-left"
                      >
                          <div className="flex items-center gap-3.5">

                              <div
                                  className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors ${darkMode
                                          ? "bg-indigo-100 text-indigo-600"
                                          : "bg-slate-100 text-slate-500"
                                      }`}
                              >
                                  {darkMode ? "🌙" : "☀️"}
                              </div>

                              <div>
                                  <span className="font-extrabold text-[var(--theme-text-muted)] text-xs block">
                                      Chế độ tối
                                  </span>

                                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                                      {darkMode
                                          ? "Đang bật chế độ tối"
                                          : "Đang sử dụng chế độ sáng"}
                                  </span>
                              </div>

                          </div>


                          {/* TOGGLE */}

                          <div
                              className={`relative w-11 h-6 rounded-full transition-colors ${darkMode
                                      ? "bg-[var(--theme-primary)]"
                                      : "bg-slate-300"
                                  }`}
                          >

                              <div
                                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkMode
                                          ? "translate-x-6"
                                          : "translate-x-1"
                                      }`}
                              />

                          </div>

                      </button>
                      {/* MÀU CHỦ ĐỀ */}
                      <button
                          type="button"
                          onClick={() => setShowThemePicker((prev) => !prev)}
                          className="w-full p-3.5 flex items-center justify-between hover:bg-[var(--theme-surface-soft)] transition-colors rounded-[16px] text-left"
                      >
                          <div className="flex items-center gap-3.5">

                              <div className="w-10 h-10 rounded-[12px] bg-[var(--theme-surface-soft)] flex items-center justify-center text-[var(--theme-primary)]">
                                  🎨
                              </div>

                              <div>
                                  <span className="font-extrabold text-[var(--theme-text-muted)] text-xs block">
                                      Màu chủ đề
                                  </span>

                                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                                      Chọn màu giao diện
                                  </span>
                              </div>

                          </div>

                          <div className="flex items-center gap-2">

                              {/* MÀU ĐANG CHỌN */}
                              <span
                                  className="w-5 h-5 rounded-full border-2 border-white shadow"
                                  style={{
                                      backgroundColor: themeColor,
                                  }}
                              />

                              <ChevronRight
                                  className={`w-4 h-4 text-slate-300 transition-transform ${showThemePicker ? "rotate-90" : ""
                                      }`}
                              />

                          </div>
                      </button>

                  </div>


                  {/* BẢNG CHỌN MÀU */}

                  {showThemePicker && (
                      <div className="bg-[var(--theme-surface)] rounded-[20px] shadow-sm border border-[var(--theme-border)] p-4 animate-fade-in">

                          <p className="text-xs font-black text-[var(--theme-text)] mb-3">
                              Chọn màu chủ đề
                          </p>

                          <div className="flex flex-wrap gap-3">

                              {[
                                  "#6366f1",
                                  "#3b82f6",
                                  "#06b6d4",
                                  "#10b981",
                                  "#f59e0b",
                                  "#f97316",
                                  "#ef4444",
                                  "#ec4899",
                                  "#8b5cf6",
                              ].map((color) => (

                                  <button
                                      key={color}
                                      type="button"
                                      onClick={() => {
                                          setThemeColor(color);
                                          setShowThemePicker(false);
                                      }}
                                      className={`w-9 h-9 rounded-full border-2 border-white shadow transition-transform hover:scale-110 ${themeColor === color
                                              ? "ring-2 ring-offset-2 ring-slate-400"
                                              : ""
                                          }`}
                                      style={{
                                          backgroundColor: color,
                                      }}
                                      aria-label={`Chọn màu ${color}`}
                                  />

                              ))}

                          </div>

                      </div>
                  )}

              </section>

        {/* BẢO MẬT */}
        <section className="space-y-3.5">
          <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase px-1">
            🔒 Bảo Mật
          </p>
          <div className="bg-[var(--theme-surface)] rounded-[20px] shadow-sm overflow-hidden flex flex-col px-2 py-2 divide-y divide-slate-50">
            <button
              type="button"
              onClick={() => setModal("password")}
              className="w-full p-3.5 flex items-center justify-between hover:bg-[var(--theme-surface-soft)] transition-colors rounded-[16px] text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[12px] bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-[var(--theme-text-muted)] text-xs block">Đổi mật khẩu</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>

            <button
              type="button"
              onClick={() => void openRealDataPanel("devices")}
              className="w-full p-3.5 flex items-center justify-between hover:bg-[var(--theme-surface-soft)] transition-colors rounded-[16px] text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[12px] bg-[var(--theme-surface-soft)] flex items-center justify-center text-[var(--theme-text-muted)]">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-[var(--theme-text-muted)] text-xs">Thiết bị đăng nhập</span>
              </div>
              <span className="text-[9px] font-black text-[var(--theme-primary)] bg-[var(--theme-surface-soft)] rounded-full px-2 py-1">Xem</span>
            </button>
          </div>
        </section>

        {/* THÔNG BÁO */}
        <section className="space-y-3.5">
          <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase px-1">🔔 Thông Báo</p>
          <div className="bg-[var(--theme-surface)] rounded-[20px] shadow-sm overflow-hidden px-2 py-2">
            <button
              type="button"
              onClick={() => void openRealDataPanel("notifications")}
              className="w-full p-3.5 flex items-center justify-between hover:bg-[var(--theme-surface-soft)] transition-colors rounded-[16px] text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[12px] bg-[#E6F4FF] flex items-center justify-center text-[#0F79F3]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-[var(--theme-text-muted)] text-xs block">Thông báo học tập</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Thông báo do quản trị viên gửi và trạng thái đã đọc.</span>
                </div>
              </div>
              <span className="text-[9px] font-black text-[var(--theme-primary)] bg-[var(--theme-surface-soft)] rounded-full px-2 py-1">Xem</span>
            </button>
          </div>
        </section>

        {/* APP / LOGOUT */}
        <section className="space-y-3.5 pt-2">
          <div className="bg-[var(--theme-surface)] rounded-[20px] shadow-sm overflow-hidden flex flex-col px-2 py-2">
            <div className="w-full p-3.5 flex items-center justify-between text-left rounded-[16px]">
              <div className="flex items-center gap-3.5 opacity-60">
                <div className="w-10 h-10 rounded-[12px] bg-[var(--theme-surface-soft)] flex items-center justify-center text-[var(--theme-text-light)]">
                  <Info className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-[var(--theme-text-light)] text-xs">Phiên bản ứng dụng</span>
              </div>
              <span className="text-[11px] font-black font-mono text-slate-400">SmartExam MVP</span>
            </div>

            <button
              type="button"
              onClick={() => setModal("logout")}
              className="w-full p-3.5 flex items-center justify-between hover:bg-rose-50 transition-colors rounded-[16px] text-left group mt-2 border-t border-slate-50"
            >
              <div className="flex items-center gap-3.5 w-full">
                <div className="w-10 h-10 rounded-[12px] bg-[#FFF5F5] flex items-center justify-center text-rose-500">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-rose-600 text-xs">Đăng xuất</span>
              </div>
            </button>
          </div>
        </section>
      </div>

      {/* THÀNH TỰU TỪ KẾT QUẢ THẬT */}
      {modal === "achievements" && (
        <ProfileDataModal title="Thành tựu học tập" subtitle="Tính từ lịch sử thi và luyện tập của bạn" onClose={() => setModal("none")}>
          {resultsLoading ? (
            <PanelLoading />
          ) : resultsError ? (
            <PanelError message={resultsError} />
          ) : (
            <div className="space-y-3">
              {achievements.map((item) => (
                <div key={item.title} className={`rounded-2xl border p-4 ${item.unlocked ? "border-amber-200 bg-amber-50" : "border-[var(--theme-border)] bg-[var(--theme-surface-soft)]"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.unlocked ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>
                      {item.unlocked ? <Star className="h-5 w-5 fill-current" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-[var(--theme-text)]">{item.title}</h4>
                        <span className={`text-[9px] font-black ${item.unlocked ? "text-amber-700" : "text-slate-400"}`}>{item.unlocked ? "Đã đạt" : `${scoreText(item.progress)}/${item.target}`}</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-4 text-[var(--theme-text-light)]">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-center text-[9px] font-bold text-slate-400">Dữ liệu được cập nhật từ {results.length} lượt thi và {practiceAttempts.length} lượt luyện tập.</p>
            </div>
          )}
        </ProfileDataModal>
      )}

      {/* LỊCH SỬ THIẾT BỊ ĐĂNG NHẬP */}
      {modal === "devices" && (
        <ProfileDataModal title="Thiết bị đăng nhập" subtitle="20 lần đăng nhập thành công gần nhất" onClose={() => setModal("none")}>
          {panelLoading ? <PanelLoading /> : panelError ? <PanelError message={panelError} /> : (
            <div className="space-y-3">
              {loginSessions.map((session, index) => (
                <div key={session.id} className="flex items-start gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500"><MonitorSmartphone className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-[var(--theme-text)]">{session.deviceName}</h4>
                      {index === 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-black text-emerald-700">Gần nhất</span>}
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-[var(--theme-text-muted)]">{session.browserName} · IP {session.ipAddress || "Không xác định"}</p>
                    <time className="mt-1 block text-[9px] text-slate-400">{new Date(session.loggedInAt).toLocaleString("vi-VN")}</time>
                  </div>
                </div>
              ))}
              {loginSessions.length === 0 && <EmptyPanel text="Chưa có lịch sử thiết bị. Hãy đăng xuất rồi đăng nhập lại sau khi chạy migration." />}
            </div>
          )}
        </ProfileDataModal>
      )}

      {/* HỘP THÔNG BÁO THẬT */}
      {modal === "notifications" && (
        <ProfileDataModal title="Thông báo học tập" subtitle={`${notifications.filter((item) => !item.isRead).length} thông báo chưa đọc`} onClose={() => setModal("none")}>
          {panelLoading ? <PanelLoading /> : panelError ? <PanelError message={panelError} /> : (
            <div className="space-y-3">
              {notifications.some((item) => !item.isRead) && (
                <button type="button" onClick={() => void readAllNotifications()} className="ml-auto flex items-center gap-1.5 rounded-xl bg-[var(--theme-primary)] px-3 py-2 text-[10px] font-black text-white"><CheckCheck className="h-3.5 w-3.5" />Đọc tất cả</button>
              )}
              {notifications.map((item) => (
                <button key={item.id} type="button" onClick={() => void readNotification(item)} className={`w-full rounded-2xl border p-4 text-left ${item.isRead ? "border-[var(--theme-border)] bg-[var(--theme-surface)]" : "border-indigo-200 bg-indigo-50/70"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><h4 className="text-xs font-black text-[var(--theme-text)]">{item.title}</h4>{!item.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}</div>
                      <p className="mt-1.5 whitespace-pre-line text-[10px] leading-5 text-[var(--theme-text-muted)]">{item.content}</p>
                    </div>
                    <time className="shrink-0 text-[8px] text-slate-400">{new Date(item.sentAt ?? item.createdAt).toLocaleDateString("vi-VN")}</time>
                  </div>
                </button>
              ))}
              {notifications.length === 0 && <EmptyPanel text="Chưa có thông báo nào được gửi đến bạn." />}
            </div>
          )}
        </ProfileDataModal>
      )}

      {/* MODAL ĐỔI MẬT KHẨU */}
      {modal === "password" && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl bg-[var(--theme-surface)] p-6 shadow-2xl border border-[var(--theme-border)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-[var(--theme-text)]">Đổi mật khẩu</h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">PUT /api/users/change-password</p>
              </div>
              <button
                type="button"
                onClick={() => setModal("none")}
                className="w-8 h-8 rounded-full bg-[var(--theme-surface-soft)] flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Mật khẩu hiện tại"
                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-3 text-xs outline-none focus:border-[var(--theme-primary)]"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới"
                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-3 text-xs outline-none focus:border-[var(--theme-primary)]"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-3 text-xs outline-none focus:border-[var(--theme-primary)]"
              />

              {passwordError && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-[11px] font-bold text-rose-600">
                  {passwordError}
                </div>
              )}

              <button
                type="button"
                disabled={passwordLoading}
                onClick={() => void handleChangePassword()}
                className="w-full rounded-xl bg-[var(--theme-primary)] py-3 text-xs font-black text-white flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Cập nhật mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGOUT */}
      {modal === "logout" && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--theme-surface)] p-6 shadow-2xl text-center">
            <LogOut className="w-9 h-9 text-rose-500 mx-auto" />
            <h3 className="font-black text-[var(--theme-text)] mt-3">Xác nhận đăng xuất</h3>
            <p className="text-xs text-[var(--theme-text-light)] mt-2">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản học sinh?</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setModal("none")}
                className="rounded-xl bg-[var(--theme-surface-soft)] py-3 text-xs font-black text-[var(--theme-text-light)]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setModal("none");
                  onLogout?.();
                }}
                className="rounded-xl bg-rose-500 py-3 text-xs font-black text-white"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDataModal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
    <div className="flex max-h-[82vh] w-full max-w-lg flex-col rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--theme-border)] p-5">
        <div><h3 className="font-black text-[var(--theme-text)]">{title}</h3><p className="mt-1 text-[10px] font-bold text-[var(--theme-text-light)]">{subtitle}</p></div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--theme-surface-soft)] text-slate-400"><X className="h-4 w-4" /></button>
      </div>
      <div className="overflow-y-auto p-5">{children}</div>
    </div>
  </div>;
}

function PanelLoading() {
  return <div className="flex min-h-40 items-center justify-center gap-2 text-xs font-bold text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Đang tải dữ liệu...</div>;
}

function PanelError({ message }: { message: string }) {
  return <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center text-xs font-bold text-rose-600"><AlertCircle className="mx-auto mb-2 h-6 w-6" />{message}</div>;
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-8 text-center text-xs font-bold text-slate-400">{text}</div>;
}
