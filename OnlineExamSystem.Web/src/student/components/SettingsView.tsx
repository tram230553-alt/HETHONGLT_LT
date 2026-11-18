import { isValidPhone, sanitizePhoneInput, PHONE_ERROR_MESSAGE } from "../../utils/phone";
import { confirmDialog } from "../../services/confirm";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Re-designed Elite Student Settings Interface for SmartExam.
 * Follows iPhone Settings, Duolingo, and DOL design principles:
 * - Minimalist, single-screen layouts (absolutely no form stuffing).
 * - Multi-page navigation (each function group has its own sub-page view).
 * - Rounded corners of exactly 20px (rounded-[20px]).
 * - Fluid page transitions with motion spring physics.
 * - Gentle pastel light purple background, pure white cards, and vivid mint green accents.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight,
  User, 
  Lock, 
  BookOpen, 
  Bell, 
  Palette, 
  Globe, 
  HelpCircle, 
  LogOut, 
  Check, 
  Eye, 
  EyeOff, 
  Save, 
  Target, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Smartphone, 
  Clock, 
  Bot, 
  Shield, 
  Sparkles,
  Send,
  LockKeyhole,
  Laptop,
  CheckSquare,
  MonitorSmartphone
} from "lucide-react";
import { UserStats } from "../types";

interface SettingsViewProps {
  onClose: () => void;
  onLogout?: () => void;
  stats?: UserStats;
  onUpdateStats?: (newStats: Partial<UserStats>) => void;
  defaultPage?: SubPage;
}

type SubPage = "profile" | "password" | "devices" | "learning" | "exam_goal" | "notifications" | "help";

export default function SettingsView({ onClose, onLogout, stats, onUpdateStats, defaultPage = "profile" }: SettingsViewProps) {
  // --- SUBPAGE CONTROLLER ---
  const [currentPage, setCurrentPage] = useState<SubPage>(defaultPage);
  
  // Cache page history to enable correct slide-direction animations (forward slide vs backward slide)
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");

  const navigateTo = (page: SubPage) => {
    setSlideDirection("forward");
    setCurrentPage(page);
  };

  const navigateBack = () => {
    onClose();
  };

  // --- DYNAMIC LOCAL/SYNCED STATE ---
  const [fullName, setFullName] = useState(stats?.fullName || "Nguyễn Minh Đức");
  const [targetUniv, setTargetUniv] = useState(stats?.targetUniversity || "Đại học Bách Khoa Hà Nội");
  const [targetScore, setTargetScore] = useState(stats?.targetScore || 26.5);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(stats?.dailyGoalMinutes || 30);
  
  const [email, setEmail] = useState(() => localStorage.getItem("smartexam_student_email") || "minhduc.hust@gmail.com");
  const [phone, setPhone] = useState(() => sanitizePhoneInput(localStorage.getItem("smartexam_student_phone") || "0982345678"));
  const [school, setSchool] = useState(() => localStorage.getItem("smartexam_student_school") || "THPT Chuyên Hà Nội - Amsterdam");
  const [grade, setGrade] = useState(() => localStorage.getItem("smartexam_student_grade") || "Lớp 12");

  // Sync state if stats prop changes dynamically
  useEffect(() => {
    if (stats) {
      setFullName(stats.fullName);
      setTargetUniv(stats.targetUniversity);
      setTargetScore(stats.targetScore);
      setDailyGoalMinutes(stats.dailyGoalMinutes);
    }
  }, [stats]);

  // --- AVATAR MASCOTS ---
  const presetMascots = [
    { emoji: "🦄", label: "Kỳ lân", bg: "bg-purple-100 border-[#DED4FF]" },
    { emoji: "🦊", label: "Cáo vàng", bg: "bg-orange-100 border-[#FFEDD5]" },
    { emoji: "🦉", label: "Cú con", bg: "bg-blue-100 border-[#DBEAFE]" },
    { emoji: "🐨", label: "Koala", bg: "bg-emerald-100 border-[#D1FAE5]" },
  ];
  const [avatarEmoji, setAvatarEmoji] = useState(() => localStorage.getItem("smartexam_avatar_emoji") || "🎓");
  const [avatarBgColor, setAvatarBgColor] = useState(() => localStorage.getItem("smartexam_avatar_bg") || "bg-purple-100");
  const [customAvatarUrl, setCustomAvatarUrl] = useState(() => localStorage.getItem("smartexam_custom_avatar") || "");

  // --- TOAST SYSTEM ---
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- 1. HỒ SƠ UPDATER ---
  const handleSaveProfile = () => {
    // SĐT là tùy chọn, nhưng nếu nhập thì phải đúng 10 chữ số.
    if (phone && !isValidPhone(phone)) {
      triggerToast(`${PHONE_ERROR_MESSAGE} ⚠️`);
      return;
    }

    if (onUpdateStats) {
      onUpdateStats({
        fullName: fullName,
        targetUniversity: targetUniv,
      });
    }
    localStorage.setItem("smartexam_student_email", email);
    localStorage.setItem("smartexam_student_phone", phone);
    localStorage.setItem("smartexam_student_school", school);
    localStorage.setItem("smartexam_student_grade", grade);
    localStorage.setItem("smartexam_avatar_emoji", avatarEmoji);
    localStorage.setItem("smartexam_avatar_bg", avatarBgColor);
    localStorage.setItem("smartexam_custom_avatar", customAvatarUrl);

    triggerToast("Thay đổi hồ sơ thành công! 💾");
  };

  const triggerFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setCustomAvatarUrl(reader.result);
            triggerToast("Đã tải avatar mới lên! 📸");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // --- 2. SECURITY STATES ---
  const [currentPassword, setCurrentPassword] = useState("••••••••");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(() => localStorage.getItem("smartexam_2fa") === "true");

  const [activeDevices, setActiveDevices] = useState([
    { id: 1, name: "iPhone 15 Pro Max", location: "Hà Nội, VN", active: true },
    { id: 2, name: "MacBook Pro 14\"", location: "TP. Hồ Chí Minh, VN", active: false }
  ]);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      triggerToast("Vui lòng điền đầy đủ thông tin mật khẩu mới! ⚠️");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast("Mật khẩu xác nhận không chính xác! ❌");
      return;
    }
    triggerToast("Cập nhật mật khẩu bảo mật mới thành công! 🔑");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("••••••••");
  };

  const toggle2FA = () => {
    const nextVal = !twoFactor;
    setTwoFactor(nextVal);
    localStorage.setItem("smartexam_2fa", String(nextVal));
    triggerToast(nextVal ? "Đã bật xác thực 2 lớp! 🔐" : "Đã tắt xác thực 2 lớp! 🔓");
  };

  // --- 3. LEARNING STATES ---
  const [weeklyReminder, setWeeklyReminder] = useState(() => localStorage.getItem("smartexam_weekly_reminder") !== "false");
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem("smartexam_reminder_time") || "20:00");
  const [aiTutorEnabled, setAiTutorEnabled] = useState(() => localStorage.getItem("smartexam_ai_tutor") !== "false");

  const saveLearningSettings = (newGoal?: number) => {
    const minGoal = newGoal !== undefined ? newGoal : dailyGoalMinutes;
    if (onUpdateStats) {
      onUpdateStats({
        dailyGoalMinutes: minGoal,
        targetScore: targetScore,
        targetUniversity: targetUniv
      });
    }
    localStorage.setItem("smartexam_weekly_reminder", String(weeklyReminder));
    localStorage.setItem("smartexam_reminder_time", reminderTime);
    localStorage.setItem("smartexam_ai_tutor", String(aiTutorEnabled));
    triggerToast("Đã ghi nhận cấu hình mục tiêu học tập! 📚");
  };

  // --- 4. NOTIFICATION STATES ---
  const [notifSystem, setNotifSystem] = useState(() => localStorage.getItem("notif_system") !== "false");
  const [notifExams, setNotifExams] = useState(() => localStorage.getItem("notif_exams") !== "false");
  const [notifAI, setNotifAI] = useState(() => localStorage.getItem("notif_ai") !== "false");
  const [emailNotif, setEmailNotif] = useState(() => localStorage.getItem("notif_email") === "true");

  const handleToggleNotif = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(key, String(val));
    triggerToast("Đã lưu thiết lập thông báo! 🔔");
  };

  // --- 5. INTERFACE / APPEARANCE STATES ---
  type ThemeMode = "light" | "dark" | "system";
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem("smartexam_theme_mode") as ThemeMode) || "light");
  type ThemeColor = "purple" | "mint" | "blue";
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => (localStorage.getItem("smartexam_theme_color") as ThemeColor) || "purple");

  const saveThemeSettings = (mode: ThemeMode, color: ThemeColor) => {
    setThemeMode(mode);
    setThemeColor(color);
    localStorage.setItem("smartexam_theme_mode", mode);
    localStorage.setItem("smartexam_theme_color", color);
    triggerToast("Đã cập nhật giao diện hiển thị! 🎨");
  };

  // --- 6. LANGUAGE STATES ---
  const [langCode, setLangCode] = useState(() => localStorage.getItem("smartexam_language") || "vi");

  const handleSelectLanguage = (code: string) => {
    setLangCode(code);
    localStorage.setItem("smartexam_language", code);
    triggerToast(`Đã chuyển sang ${code === "vi" ? "Tiếng Việt 🇻🇳" : "Tiếng Anh 🇬🇧"}!`);
  };

  // --- 7. HELP STATES ---
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [helpFeedback, setHelpFeedback] = useState("");
  const initialFaqs = [
    { q: "Làm thế nào để tăng tích lũy Ngọc vàng?", a: "Bạn có thể tăng tích lũy vàng bằng cách rèn luyện đề thi thử thách hoặc trả bứt phá các thẻ nhớ Flashcards từ vựng hàng ngày." },
    { q: "Gia sư AI hoạt động như thế nào?", a: "Mô hình AI siêu trí tuệ liên kết hệ thống lý thuyết THPT quốc gia, hỗ trợ phản hồi phân tích từng bước, hướng dẫn giải thích và đưa ra mẹo giải tắt tối giản, tốc độ cực đại." },
    { q: "Làm sao để liên kết nhóm học chung?", a: "Phòng rèn trực tuyến sẽ xếp đội bứt phá tuần vào mỗi thứ Hai. Học sinh đạt đủ chỉ tiêu liên tục sẽ nhận huy chương Đại Học mục tiêu cao cấp." },
  ];

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpFeedback.trim()) return;
    triggerToast("Đã gửi tin nhắn hỗ trợ! Thầy cô sẽ liên hệ sớm 💬");
    setHelpFeedback("");
  };

  // Animation variants
  const getVariants = () => {
    if (slideDirection === "forward") {
      return {
        initial: { x: "100%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "-20%", opacity: 0 }
      };
    } else {
      return {
        initial: { x: "-100%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "100%", opacity: 0 }
      };
    }
  };

  return (
    <div className="absolute inset-0 bg-[#F4F3F8] flex flex-col z-[100] font-sans overflow-hidden">
      
      {/* GLOBAL TOAST BANNER */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm glass-panel text-[var(--theme-text)] border-2 border-[#10B981]/25 border-l-4 border-l-[#10B981] rounded-2xl py-3.5 px-4.5 flex items-center justify-between gap-3 shadow-[0_15px_30px_-5px_rgba(16,185,129,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E6FCF5] flex items-center justify-center text-[#10B981]">
                <Check className="w-4.5 h-4.5 stroke-[3]" />
              </div>
              <span className="text-xs font-bold font-sans tracking-tight text-slate-900 leading-tight">
                {toast}
              </span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-[var(--theme-text-muted)] transition p-1">
              <span className="text-xs font-bold font-mono">OK</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
  

        {/* ================= PAGE: TÀI KHOẢN & HỒ SƠ ================= */}
        {currentPage === "profile" && (
          <motion.div 
            key="profile"
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* SUB HEADER */}
            <div className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[#EBE8F5]/80 px-6 flex items-center justify-between">
              <button 
                onClick={navigateBack} 
                className="w-10 h-10 rounded-full border border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--theme-text-light)]" />
              </button>
              <h2 className="text-sm font-extrabold text-[var(--theme-text)] tracking-tight">Hồ sơ cá nhân</h2>
              <div className="w-10 h-10 invisible" />
            </div>

            {/* SCROLLABLE VIEW */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-6">
              
              {/* INTERACTIVE BIG AVATAR GLASS CONTAINER */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft flex flex-col items-center">
                <div className="relative">
                  <div className={`w-24 h-24 ${avatarBgColor} rounded-[28px] flex items-center justify-center text-5xl border-3 border-white shadow-[0_12px_24px_-8px_rgba(138,127,255,0.4)] overflow-hidden`}>
                    {customAvatarUrl ? (
                      <img src={customAvatarUrl} alt="avatar-big" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{avatarEmoji}</span>
                    )}
                  </div>
                  <button 
                    onClick={triggerFileUpload}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#10B981] hover:bg-[#0E9F6E] transition text-white flex items-center justify-center shadow-md active:scale-90"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="font-extrabold text-[var(--theme-text)] text-[15px] mt-4 tracking-tight">{fullName}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">{email}</p>

                {/* Preset Fast Selectors */}
                <div className="mt-4.5 w-full border-t border-[var(--theme-border)] pt-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase text-center tracking-wider mb-2.5">
                    Chọn nhanh linh vật:
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {presetMascots.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCustomAvatarUrl(""); // Reset custom image upload
                          setAvatarEmoji(m.emoji);
                          setAvatarBgColor(m.bg.split(" ")[0]);
                        }}
                        className={`py-2 px-1 rounded-xl border text-xl flex flex-col items-center transition hover:brightness-98 active:scale-95 ${avatarEmoji === m.emoji && !customAvatarUrl ? "border-[#8A7FFF] bg-[#ECE8FF]" : "border-[var(--theme-border)] bg-[var(--theme-surface-soft)]"}`}
                      >
                        <span>{m.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* NON-STUFFED MINIMAL PROFILE FIELD CARDS */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Cá nhân: Họ và tên
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl px-4.5 py-3 text-xs font-bold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Email liên hệ
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl px-4.5 py-3 text-xs font-bold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                      className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl px-4.5 py-3 text-xs font-bold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Trường học hiện tại
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl px-4.5 py-3 text-xs font-bold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Khối lớp hiện tại
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl px-4.5 py-3 text-xs font-extrabold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition cursor-pointer"
                  >
                    <option value="Lớp 12">Lớp 12 — Ôn thi tốt nghiệp & ĐH</option>
                    <option value="Lớp 11">Lớp 11 — Tiếp nhận nền tảng</option>
                    <option value="Lớp 10">Lớp 10 — Tạo đà vững chãi</option>
                  </select>
                </div>

              </div>

              {/* SAVE BUTTON STYLED ENTIRELY WITH MINT GREEN ACCENT */}
              <button
                onClick={handleSaveProfile}
                className="w-full bg-[#10B981] hover:bg-[#0E9F6E] active:scale-[0.98] transition rounded-[20px] py-4 shadow-md text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2"
              >
                💾 Lưu thay đổi hồ sơ
              </button>

            </div>
          </motion.div>
        )}

        {/* ================= PAGE: HỌC TẬP & RÈN LUYỆN ================= */}
        {currentPage === "learning" && (
          <motion.div 
            key="learning"
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* SUB HEADER */}
            <div className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[#EBE8F5]/80 px-6 flex items-center justify-between">
              <button 
                onClick={navigateBack} 
                className="w-10 h-10 rounded-full border border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--theme-text-light)]" />
              </button>
              <h2 className="text-sm font-extrabold text-[var(--theme-text)] tracking-tight">Mục tiêu học tập</h2>
              <div className="w-10 h-10 invisible" />
            </div>

            {/* SCROLL VIEW */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-5">
              
              {/* GOAL 1: MỤC TIÊU PHÚT TRONG NGÀY */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E6FCF5] flex items-center justify-center text-[#10B981]">
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Mục tiêu học mỗi ngày</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setDailyGoalMinutes(mins);
                        saveLearningSettings(mins);
                      }}
                      className={`py-3.5 px-1 rounded-xl border-2 font-bold text-xs flex flex-col items-center transition active:scale-95 ${dailyGoalMinutes === mins ? "border-[#10B981] bg-[#E6FCF5] text-[#0E9F6E]" : "border-slate-50 bg-[#F8FAFC] text-[var(--theme-text-light)]"}`}
                    >
                      <span className="text-sm font-black">{mins}</span>
                      <span className="text-[7.5px] uppercase font-mono opacity-80 mt-0.5">phút</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GOAL 2: MỤC TIÊU ĐIỂM SỐ */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF0FE] flex items-center justify-center text-[#8A7FFF]">
                      <Target className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Mục tiêu điểm số</h3>
                  </div>
                  <div className="bg-[var(--theme-surface-soft)] px-3 py-1 rounded-full border border-[var(--theme-border)]">
                    <span className="text-xs font-black font-mono text-[#8A7FFF]">{targetScore.toFixed(1)} Điểm</span>
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="1.0"
                    max="30.0"
                    step="0.1"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[var(--theme-surface-soft)] rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#10B981' }}
                  />
                  <div className="flex justify-between text-[7.5px] font-black text-slate-400 uppercase mt-2 px-1">
                    <span>1.0 Trung bình</span>
                    <span>15.5 Khá</span>
                    <span>30.0 Thủ khoa</span>
                  </div>
                </div>
              </div>

              {/* GOAL 3: TRƯỜNG ĐH MỤC TIÊU */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏫</span>
                  <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Trường đại học mục tiêu</h3>
                </div>

                <input
                  type="text"
                  value={targetUniv}
                  onChange={(e) => setTargetUniv(e.target.value)}
                  placeholder="Nhập tên trường học mong muốn..."
                  className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl px-4 py-3 text-xs font-bold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Đại học Bách Khoa", "Đại học Quốc gia", "Ngoại Thương", "Y Hà Nội"].map((univ) => (
                    <button
                      key={univ}
                      onClick={() => setTargetUniv(univ)}
                      className="px-2.5 py-1 text-[8.5px] font-bold rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] text-[var(--theme-text-light)] hover:border-[#8A7FFF]/35 hover:text-[#8A7FFF] transition"
                    >
                      +{univ}
                    </button>
                  ))}
                </div>
              </div>

              {/* SAVE BUTTON */}
              <button
                onClick={() => {
                  saveLearningSettings(dailyGoalMinutes);
                  navigateBack();
                }}
                className="w-full bg-[#10B981] hover:bg-[#0E9F6E] active:scale-[0.98] transition rounded-[20px] py-4 shadow-md text-white font-extrabold text-xs tracking-wider mt-4"
              >
                💾 Xác nhận thay đổi
              </button>

            </div>
          </motion.div>
        )}

        {/* ================= PAGE: MỤC TIÊU LUYỆN ĐỀ ================= */}
        {currentPage === "exam_goal" && (
          <motion.div 
            key="exam_goal"
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* SUB HEADER */}
            <div className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[#EBE8F5]/80 px-6 flex items-center justify-between z-10 relative">
              <button 
                onClick={navigateBack} 
                className="w-10 h-10 rounded-full border border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--theme-text-light)]" />
              </button>
              <h2 className="text-sm font-extrabold text-[var(--theme-text)] tracking-tight">Mục tiêu luyện đề</h2>
              <div className="w-10 h-10 invisible" />
            </div>

            {/* SCROLL VIEW */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-5">
              
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E6F4FF] flex items-center justify-center text-[#0F79F3]">
                    <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Số đề mỗi tuần</h3>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[1, 2, 3, 5].map((exams) => (
                     <button
                       key={exams}
                       className="py-3.5 px-1 rounded-xl border border-slate-50 bg-[#F8FAFC] text-[var(--theme-text-light)] font-bold text-xs flex flex-col items-center hover:bg-[var(--theme-surface-soft)] transition active:scale-95"
                     >
                       <span className="text-sm font-black">{exams}</span>
                       <span className="text-[7.5px] uppercase font-mono opacity-80 mt-0.5">đề/tuần</span>
                     </button>
                  ))}
                </div>
              </div>

              {/* SAVE BUTTON */}
              <button
                onClick={() => {
                  triggerToast("Đã lưu mục tiêu luyện đề! 📝");
                  navigateBack();
                }}
                className="w-full bg-[#0F79F3] hover:bg-[#0E6CDA] active:scale-[0.98] transition rounded-[20px] py-4 shadow-md text-white font-extrabold text-xs tracking-wider mt-4"
              >
                💾 Xác nhận thay đổi
              </button>

            </div>
          </motion.div>
        )}

        {/* ================= PAGE: THÔNG BÁO ================= */}
        {currentPage === "notifications" && (
          <motion.div 
            key="notifications"
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* SUB HEADER */}
            <div className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[#EBE8F5]/80 px-6 flex items-center justify-between">
              <button 
                onClick={navigateBack} 
                className="w-10 h-10 rounded-full border border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--theme-text-light)]" />
              </button>
              <h2 className="text-sm font-extrabold text-[var(--theme-text)] tracking-tight">Kênh thông báo</h2>
              <div className="w-10 h-10 invisible" />
            </div>

            {/* MAIN LIST */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-6">
              
              <p className="text-[10px] font-black tracking-widest text-[#8A7FFF] uppercase px-1">Tần suất & Tình trạng</p>

              <div className="bg-[var(--theme-surface)] rounded-[20px] border border-[#EBE8F5]/80 shadow-soft divide-y divide-slate-50 overflow-hidden">
                
                {/* Switch Item 1 */}
                <div className="p-4.5 flex items-center justify-between">
                  <div className="flex items-start gap-4 pr-4">
                    <span className="text-xl">📢</span>
                    <div className="text-left">
                      <h4 className="font-extrabold text-[#2F2E41] text-xs">Thông báo hệ thống</h4>
                      <p className="text-[9px] text-[#A2A1B1] mt-0.5">Tin cập nhật ứng dụng học, danh hiệu và sự kiện</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleNotif("notif_system", !notifSystem, setNotifSystem)}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${notifSystem ? "bg-[#10B981]" : "bg-slate-200"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[var(--theme-surface)] absolute top-0.5 transition-transform ${notifSystem ? "translate-x-5.5" : "translate-x-0.5"}`}></div>
                  </button>
                </div>

                {/* Switch Item 3 */}
                <div className="p-4.5 flex items-center justify-between">
                  <div className="flex items-start gap-4 pr-4">
                    <span className="text-xl">📊</span>
                    <div className="text-left">
                      <h4 className="font-extrabold text-[#2F2E41] text-xs">Thông báo lịch thi</h4>
                      <p className="text-[9px] text-[#A2A1B1] mt-0.5">Nhắc thi, chấm điểm, xếp hạng trực tuyến</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleNotif("notif_exams", !notifExams, setNotifExams)}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${notifExams ? "bg-[#10B981]" : "bg-slate-200"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[var(--theme-surface)] absolute top-0.5 transition-transform ${notifExams ? "translate-x-5.5" : "translate-x-0.5"}`}></div>
                  </button>
                </div>

                {/* Switch Item 4 */}
                <div className="p-4.5 flex items-center justify-between">
                  <div className="flex items-start gap-4 pr-4">
                    <span className="text-xl">🤖</span>
                    <div className="text-left">
                      <h4 className="font-extrabold text-[#2F2E41] text-xs">Thông báo AI</h4>
                      <p className="text-[9px] text-[#A2A1B1] mt-0.5">Gợi ý từ trợ lý AI và ghi chép hành trình</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleNotif("notif_ai", !notifAI, setNotifAI)}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${notifAI ? "bg-[#10B981]" : "bg-slate-200"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[var(--theme-surface)] absolute top-0.5 transition-transform ${notifAI ? "translate-x-5.5" : "translate-x-0.5"}`}></div>
                  </button>
                </div>

                {/* Switch Item 5 */}
                <div className="p-4.5 flex items-center justify-between">
                  <div className="flex items-start gap-4 pr-4">
                    <span className="text-xl">✉️</span>
                    <div className="text-left">
                      <h4 className="font-extrabold text-[#2F2E41] text-xs">Email thông báo</h4>
                      <p className="text-[9px] text-[#A2A1B1] mt-0.5">Gửi báo cáo học tập định kỳ, điểm thi bứt phá tuần</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleNotif("notif_email", !emailNotif, setEmailNotif)}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${emailNotif ? "bg-[#10B981]" : "bg-slate-200"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[var(--theme-surface)] absolute top-0.5 transition-transform ${emailNotif ? "translate-x-5.5" : "translate-x-0.5"}`}></div>
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ================= PAGE: ĐỔI MẬT KHẨU ================= */}
        {currentPage === "password" && (
          <motion.div 
            key="password"
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* SUB HEADER */}
            <div className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[#EBE8F5]/80 px-6 flex items-center justify-between z-10 relative">
              <button 
                onClick={navigateBack} 
                className="w-10 h-10 rounded-full border border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--theme-text-light)]" />
              </button>
              <h2 className="text-sm font-extrabold text-[var(--theme-text)] tracking-tight">Đổi mật khẩu</h2>
              <div className="w-10 h-10 invisible" />
            </div>

            {/* SCROLL CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-6">
              
              {/* CHANGE PASSWORD */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#EFF0FE] flex items-center justify-center text-[#8A7FFF]">
                    <LockKeyhole className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-[#2F2E41] text-xs">Mật khẩu tài khoản</h3>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4.5">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={currentPassword}
                      readOnly
                      className="w-full bg-[#F8FAFC] border border-slate-50 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mật khẩu mới</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Có ít nhất 6 ký tự..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl pl-4 pr-10 py-3 text-xs font-bold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--theme-text-muted)] transition"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      placeholder="Trùng khớp mật khẩu trên..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl px-4 py-3 text-xs font-bold text-[var(--theme-text-muted)] focus:outline-none focus:border-[#8A7FFF] transition"
                    />
                  </div>

                  {/* Mint Green save password button */}
                  <button
                    type="submit"
                    className="w-full bg-[#10B981] hover:bg-[#0E9F6E] active:scale-[0.98] transition rounded-xl py-3 text-white font-extrabold text-[11px] tracking-wide"
                  >
                    🔑 Cập nhật mật khẩu mới
                  </button>
                </form>
              </div>

              {/* TWO FACTOR AUTH */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF0FE] flex items-center justify-center text-[#8A7FFF]">
                      <Shield className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Xác thực 2 lớp</h3>
                  </div>
                  
                  {/* Switch with Mint Green active */}
                  <button 
                    onClick={toggle2FA}
                    className={`w-11 h-6 rounded-full relative transition-colors ${twoFactor ? "bg-[#10B981]" : "bg-slate-200"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[var(--theme-surface)] absolute top-0.5 transition-transform ${twoFactor ? "translate-x-5.5" : "translate-x-0.5"}`}></div>
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed">
                  Nhận mã OTP thông báo đẩy khi bứt phá đăng nhập trên trình duyệt lạ để bảo hộ hoàn thành điểm thi vững vàng.
                </p>
              </div>

              {/* DEVICES */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <span className="text-md">💻</span>
                  <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Thiết bị đăng nhập</h3>
                </div>

                <div className="space-y-3">
                  {activeDevices.map(dev => (
                    <div key={dev.id} className="flex justify-between items-center p-3 bg-[var(--theme-surface-soft)] rounded-xl border border-[var(--theme-border)]">
                      <div className="flex items-center gap-3">
                        <div className="text-[var(--theme-text-light)]">
                          {dev.name.includes("iPhone") ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-bold text-[var(--theme-text-muted)]">{dev.name}</p>
                          <p className="text-[9px] text-slate-400">{dev.location} {dev.active && "• Hiện hành"}</p>
                        </div>
                      </div>
                      {!dev.active && (
                        <button
                          onClick={() => {
                            setActiveDevices(prev => prev.filter(d => d.id !== dev.id));
                            triggerToast("Đã buộc đăng xuất thiết bị phụ thành công! 🚪");
                          }}
                          className="px-2.5 py-1 text-[8px] font-black text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 border border-rose-100 transition active:scale-95"
                        >
                          Đăng xuất
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIVITY LOGS */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <span className="text-md">🕒</span>
                  <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Lịch sử hoạt động</h3>
                </div>

                <div className="space-y-3 font-sans text-left text-[9.5px]">
                  <div className="flex gap-2.5">
                    <span className="text-emerald-500 font-bold">Vừa xong</span>
                    <span className="text-[var(--theme-text-muted)] font-medium">Bứt phá thông tin hồ sơ học sinh</span>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-slate-400 font-mono">08:15 Hôm nay</span>
                    <span className="text-[var(--theme-text-light)] font-medium">Đăng nhập thành công từ Safari</span>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-slate-400 font-mono">Hôm qua</span>
                    <span className="text-[var(--theme-text-light)]">Thay đổi mục tiêu Học 30 phút thành 45 phút</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}





        {/* ================= PAGE: HELP / FAQ ================= */}
        {currentPage === "help" && (
          <motion.div 
            key="help"
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* SUB HEADER */}
            <div className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[#EBE8F5]/80 px-6 flex items-center justify-between">
              <button 
                onClick={navigateBack} 
                className="w-10 h-10 rounded-full border border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--theme-text-light)]" />
              </button>
              <h2 className="text-sm font-extrabold text-[var(--theme-text)] tracking-tight">Trợ giúp FAQ</h2>
              <div className="w-10 h-10 invisible" />
            </div>

            {/* SCROLL CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-5">
              
              <p className="text-[10px] font-black tracking-widest text-[#8A7FFF] uppercase px-1 text-left">Hỏi đáp thường quý</p>

              <div className="space-y-3">
                {initialFaqs.map((faq, idx) => {
                  const isOpen = faqOpenIndex === idx;
                  return (
                    <div 
                      key={idx}
                      className="bg-[var(--theme-surface)] border border-[#EBE8F5]/80 rounded-[20px] overflow-hidden shadow-soft transition"
                    >
                      <button
                        onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                        className="w-full p-4.5 flex justify-between items-center text-left"
                      >
                        <span className="font-extrabold text-[var(--theme-text)] text-[11.5px] leading-tight pr-4">
                          {faq.q}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-[#A2A1B1] shrink-0 transition-transform ${isOpen ? "rotate-90 text-[#8A7FFF]" : ""}`} />
                      </button>
                      
                      {isOpen && (
                        <div className="px-4.5 pb-4.5 pt-1.5 border-t border-slate-50">
                          <p className="text-[10px] text-[var(--theme-text-light)] leading-relaxed font-medium">
                            {faq.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* FEEDBACK SEND BOX */}
              <div className="bg-[var(--theme-surface)] p-6 rounded-[20px] border border-[#EBE8F5]/80 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <span className="text-lg">💬</span>
                  <h3 className="font-extrabold text-[var(--theme-text)] text-[12px] uppercase tracking-wide">Nhà phát triển & Đóng góp</h3>
                </div>

                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <textarea
                    rows={3}
                    placeholder="Nhập nội dung góp ý, câu hỏi kỹ thuật hằng ngày của bạn ở đây..."
                    value={helpFeedback}
                    onChange={(e) => setHelpFeedback(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#EBE8F5] rounded-xl p-4.5 text-xs font-bold text-[var(--theme-text-muted)] placeholder-slate-400 focus:outline-none focus:border-[#8A7FFF] transition text-left"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#10B981] hover:bg-[#0E9F6E] active:scale-[0.98] transition rounded-xl py-3 text-white font-extrabold text-[11px] flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi câu hỏi đóng góp
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}

        {/* ================= PAGE: THIẾT BỊ ĐĂNG NHẬP ================= */}
        {currentPage === "devices" && (
          <motion.div 
            key="devices"
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* SUB HEADER */}
            <div className="h-16 shrink-0 bg-[var(--theme-surface)] border-b border-[#EBE8F5]/80 px-6 flex items-center justify-between z-10 relative">
              <button 
                onClick={navigateBack} 
                className="w-10 h-10 rounded-full border border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--theme-text-light)]" />
              </button>
              <h2 className="text-sm font-extrabold text-[var(--theme-text)] tracking-tight">Thiết bị đăng nhập</h2>
              <div className="w-10 h-10 invisible" />
            </div>

            {/* SCROLL CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-4">
              
              <div className="bg-[var(--theme-surface)] p-5 rounded-[20px] shadow-sm border border-[var(--theme-border)] flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-[100px] pointer-events-none" />
                <div className="w-12 h-12 rounded-[14px] bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Laptop className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[var(--theme-text)] text-sm">MacBook Pro (M1)</h4>
                  <p className="text-[10px] text-[var(--theme-text-light)] mt-1">Chrome, Hà Nội - Đang hoạt động</p>
                </div>
              </div>

              <div className="bg-[var(--theme-surface)] p-5 rounded-[20px] shadow-sm border border-[var(--theme-border)] flex items-center justify-between relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-[var(--theme-surface-soft)] flex items-center justify-center text-[var(--theme-text-light)]">
                    <MonitorSmartphone className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--theme-text-muted)] text-sm">iPhone 14 Pro Max</h4>
                    <p className="text-[10px] text-[var(--theme-text-light)] mt-1">Safari, TP.HCM - 2 giờ trước</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (await confirmDialog({
                      title: "Đăng xuất",
                      message: "Đăng xuất thiết bị này?",
                      confirmText: "Đăng xuất",
                      tone: "danger",
                    })) {
                      onLogout?.();
                    }
                  }}
                  className="text-rose-500 font-bold text-xs px-3 py-1.5 bg-rose-50 rounded-lg shrink-0 hover:bg-rose-100 transition active:scale-95"
                >
                  Đăng xuất
                </button>
              </div>

              <div className="pt-6 w-full">
                <button 
                  onClick={async () => {
                    if (await confirmDialog({
                      title: "Đăng xuất tất cả thiết bị",
                      message: "Đăng xuất khỏi tất cả các thiết bị?",
                      confirmText: "Đăng xuất",
                      tone: "danger",
                    })) {
                      onLogout?.();
                    }
                  }}
                  className="w-full bg-[#FFF5F5] hover:bg-[#FFEBEB] active:bg-[#FFE5E5] active:scale-[0.98] transition-all text-rose-600 font-extrabold text-xs py-4 rounded-[16px] flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất tất cả thiết bị
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
