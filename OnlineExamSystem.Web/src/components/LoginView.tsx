import {
    login,
    registerStudent,
} from "../services/authService";

import {
    saveSession,
    type UserRole,
} from "../auth";

import ForgotPasswordForm from "./ForgotPasswordForm";

import React, {
    useEffect,
    useState,
} from "react";

import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Users,
    GraduationCap,
    ShieldCheck,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import {
    motion,
    AnimatePresence,
} from "motion/react";

interface LoginViewProps {
    onLoginSuccess: (
        email: string,
        role: UserRole,
    ) => void;
}

export default function LoginView({
    onLoginSuccess,
}: LoginViewProps) {
    const [isDarkMode, setIsDarkMode] =
        useState<boolean>(() => {
            return localStorage.getItem(
                "smartexam_dark_mode",
            ) === "true";
        });

    const [devicePreview, setDevicePreview] =
        useState<
            "responsive" |
            "desktop" |
            "tablet" |
            "mobile"
        >("responsive");

    // Student đăng nhập bằng MaHS.
    // Admin/Teacher vẫn đăng nhập bằng email.
    const [loginIdentifier, setLoginIdentifier] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [authMode, setAuthMode] =
        useState<"login" | "register" | "forgot">(
            "login",
        );

    const [registerForm, setRegisterForm] =
        useState({
            maHS: "",
            ho: "",
            tenDem: "",
            ten: "",
            ngaySinh: "",
            email: "",
            password: "",
            confirmPassword: "",
        });

    const [isLoading, setIsLoading] =
        useState(false);

    const [loadingStep, setLoadingStep] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    useEffect(() => {
        localStorage.setItem(
            "smartexam_dark_mode",
            String(isDarkMode),
        );
    }, [isDarkMode]);

    const handleFormSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        const identifier =
            loginIdentifier.trim();

        if (!identifier) {
            setErrorMessage(
                "Vui lòng nhập mã học sinh hoặc email.",
            );
            return;
        }

        if (!password) {
            setErrorMessage(
                "Mật khẩu không được để trống.",
            );
            return;
        }

        setIsLoading(true);
        setLoadingStep(
            "Đang xác thực tài khoản...",
        );

        try {
            const result = await login({
                identifier,
                password,
            });

            saveSession(
                result.email,
                result.role,
                result.token,
                result.userId,
            );

            setSuccessMessage(
                "Đăng nhập thành công.",
            );

            onLoginSuccess(
                result.email,
                result.role,
            );
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Không thể đăng nhập.",
            );
        } finally {
            setIsLoading(false);
            setLoadingStep("");
        }
    };

    const handleRegisterSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (
            !registerForm.maHS.trim() ||
            !registerForm.ho.trim() ||
            !registerForm.ten.trim() ||
            !registerForm.ngaySinh ||
 
            !registerForm.email.trim() ||
            !registerForm.password
        ) {
            setErrorMessage(
                "Vui lòng nhập đầy đủ thông tin bắt buộc.",
            );
            return;
        }

        if (
            registerForm.password !==
            registerForm.confirmPassword
        ) {
            setErrorMessage(
                "Mật khẩu xác nhận không khớp.",
            );
            return;
        }

        setIsLoading(true);
        setLoadingStep(
            "Đang đối chiếu mã học sinh và họ tên...",
        );

        try {
            await registerStudent({
                maHS:
                    registerForm.maHS
                        .trim()
                        .toUpperCase(),
                ho:
                    registerForm.ho.trim(),
                tenDem:
                    registerForm.tenDem.trim(),
                ten:
                    registerForm.ten.trim(),
                ngaySinh:
                    registerForm.ngaySinh,
                email:
                    registerForm.email
                        .trim()
                        .toLowerCase(),
                password:
                    registerForm.password,
            });

            const studentCode =
                registerForm.maHS
                    .trim()
                    .toUpperCase();

            setSuccessMessage(
                "Đăng ký thành công. Hãy đăng nhập bằng mã học sinh.",
            );

            // Sau đăng ký điền sẵn MaHS vào ô đăng nhập.
            setLoginIdentifier(studentCode);
            setPassword("");
            setAuthMode("login");

            setRegisterForm({
                maHS: "",
                ho: "",
                tenDem: "",
                ten: "",
                ngaySinh: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Đăng ký tài khoản thất bại.",
            );
        } finally {
            setIsLoading(false);
            setLoadingStep("");
        }
    };

        // Get active container classes based on simulated device preview
        const getContainerStyles = () => {
            switch (devicePreview) {
                case 'desktop':
                    return 'max-w-7xl h-[780px] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden';
                case 'tablet':
                    return 'max-w-3xl h-[850px] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden';
                case 'mobile':
                    return 'max-w-sm h-[740px] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden';
                default:
                    return 'w-full min-h-screen';
            }
        };

        return (
            <div className={`min-h-screen font-sans transition-all duration-300 select-none ${isDarkMode ? 'bg-[#0B0F19] text-[#E2E8F0]' : 'bg-[#F4F7FC] text-[#2D3748]'}`}>

                {/* Control Floating bar with premium action items */}

                {/* Main Wrapper Box to handle PC/Tablet/Mobile layout configurations */}
                <div className="min-h-screen bg-[#F6F8FD] flex items-center justify-center p-3 sm:p-6 md:p-8">

                    <div className={`transition-all duration-300 w-full max-w-[1600px] overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(38,51,77,0.12)] flex flex-col md:flex-row ${getContainerStyles()} ${isDarkMode ? 'bg-[#111827]' : 'bg-white'}`}>

                        {/* Left Side: Educational Illustration (hidden when simulated Device is Mobile or screen is actual Mobile) */}
                        {(devicePreview !== 'mobile') && (
                            <div className={`w-full md:w-[46%] p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden select-none ${isDarkMode ? 'bg-radial from-[#1E293B] to-[#0F172A]' : 'bg-gradient-to-br from-[#F4F7FC] via-[#EAF2FF] to-[#F1F5F9]'}`}>
                                {/* Abs decorative background elements */}
                                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#A5D8FF]/20 dark:bg-purple-900/10 blur-3xl -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#7C9CF5]/10 dark:bg-[#7C9CF5]/5 blur-3xl -ml-20 -mb-20"></div>

                                {/* Logo section */}
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-2xl bg-[#7C9CF5] flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-[#7C9CF5]/30">
                                        SE
                                    </div>
                                    <div>
                                        <span className="font-sans font-black tracking-tight text-xl text-slate-800 dark:text-white uppercase">Smart<span className="text-[#7C9CF5]">Exam</span></span>
                                        <div className="text-[9px] text-[#7C9CF5] font-bold tracking-widest uppercase">Admin Ecosystem</div>
                                    </div>
                                </div>

                                {/* Central Premium Graphic Illustration */}
                                <div className="my-auto py-8 relative Stage-Art z-10 flex flex-col items-center">
                                    <div className="relative w-full max-w-[340px] aspect-square rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-xl flex flex-col justify-between">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7C9CF5] bg-[#7C9CF5]/10 px-2.5 py-1 rounded-full">REALTIME EXAM MATRIX</span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-[#7C9CF5] font-bold">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Tracker
                                            </span>
                                        </div>

                                        {/* Interactive Micro Graphic components portraying students, charts, books, etc. */}
                                        <div className="space-y-3.5 my-4">
                                            {/* Glowing Student Active Badge */}
                                            <motion.div
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="flex items-center gap-2.5 p-2 bg-white/90 dark:bg-slate-950/95 border border-[#E9EDF7] dark:border-slate-800 rounded-2xl shadow-sm"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-500 shrink-0">
                                                    <Users className="w-4.5 h-4.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">Học sinh trực tuyến</div>
                                                    <div className="text-[10px] text-[#7C9CF5] font-extrabold">1,540 thí sinh đang làm bài</div>
                                                </div>
                                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-emerald-250 dark:border-emerald-800">+16.5%</span>
                                            </motion.div>

                                            {/* Miniature Chart bar animation */}
                                            <div className="p-3 bg-white/80 dark:bg-slate-950/80 border border-[#E9EDF7] dark:border-slate-800 rounded-2xl shadow-xs">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hiệu suất học tập</span>
                                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-extrabold">Avg: 81.2%</span>
                                                </div>
                                                <div className="flex items-end gap-3 h-14 pt-2 justify-center">
                                                    <div className="w-4 bg-[#7C9CF5]/40 dark:bg-slate-800 rounded-t-sm h-[50%]" title="Toán"></div>
                                                    <div className="w-4 bg-[#7C9CF5]/70 dark:bg-slate-700 rounded-t-sm h-[65%]" title="Vật lý"></div>
                                                    <div className="w-4 bg-[#7C9CF5] rounded-t-sm h-[90%] relative" title="Hóa">
                                                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#7C9CF5]">Max</span>
                                                    </div>
                                                    <div className="w-4 bg-[#7C9CF5]/30 dark:bg-slate-800/80 rounded-t-sm h-[40%]" title="Anh"></div>
                                                    <div className="w-4 bg-[#7C9CF5]/65 dark:bg-slate-700/50 rounded-t-sm h-[75%]" title="Văn"></div>
                                                    <div className="w-4 bg-[#7C9CF5]/90 dark:bg-[#7C9CF5]/80 rounded-t-sm h-[82%]" title="Sinh"></div>
                                                </div>
                                            </div>

                                            {/* Book & cap status card */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-2.5 bg-white/90 dark:bg-slate-950/95 border border-[#E9EDF7] dark:border-slate-800 rounded-2xl flex items-center gap-2">
                                                    <span className="text-lg">📚</span>
                                                    <div>
                                                        <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">Kho Học Liệu</div>
                                                        <div className="text-[9px] text-slate-400">18 Chương • 120 Bài</div>
                                                    </div>
                                                </div>
                                                <div className="p-2.5 bg-white/90 dark:bg-slate-950/95 border border-[#E9EDF7] dark:border-slate-800 rounded-2xl flex items-center gap-2">
                                                    <GraduationCap className="w-5 h-5 text-indigo-500 shrink-0" />
                                                    <div>
                                                        <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">Đề Khảo Thí</div>
                                                        <div className="text-[9px] text-slate-400">7 Đề chính thức</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Cơ sở dữ liệu an toàn 256-bit</span>
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Title & Subtitles footer */}
                                <div className="space-y-2 mt-auto relative z-10">
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-tight">
                                        SmartExam Learning Management System
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                                        Nền tảng quản lý học liệu cấu trúc, biên soạn ngân hàng câu hỏi môn học và tự động sinh đề thi trực tuyến chất lượng cao theo chuẩn cấu trúc Bộ GD&ĐT 2026.
                                    </p>

                                    <div className="flex flex-wrap gap-2.5 pt-3">
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-[#A5D8FF] bg-[#7C9CF5]/10 dark:bg-[#7C9CF5]/10 px-2.5 py-1 rounded-md border border-indigo-250 dark:border-indigo-850">MATH12 OK</span>
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-[#A5D8FF] bg-[#7C9CF5]/10 dark:bg-[#7C9CF5]/10 px-2.5 py-1 rounded-md border border-indigo-250 dark:border-indigo-850">LIT12 OK</span>
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-[#A5D8FF] bg-[#7C9CF5]/10 dark:bg-[#7C9CF5]/10 px-2.5 py-1 rounded-md border border-indigo-250 dark:border-indigo-850">ENG12 OK</span>
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-[#A5D8FF] bg-[#7C9CF5]/10 dark:bg-[#7C9CF5]/10 px-2.5 py-1 rounded-md border border-indigo-250 dark:border-indigo-850">PHYS12 OK</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Right Side: Login Card Form */}
                        <div className={`min-w-0 w-full ${devicePreview === 'mobile' ? 'w-full' : 'md:w-[54%]'} p-6 sm:p-10 lg:p-14 flex flex-col scrollbar-none overflow-y-auto`}>

                            {/* Compact authentication header */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                                {/* Show logo on dark mobile mode if left sidebar hidden */}
                                <div className="md:hidden flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#7C9CF5] flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                                        SE
                                    </div>
                                    <span className="font-sans font-black tracking-tight text-base text-slate-800 dark:text-white uppercase">Smart<span className="text-[#7C9CF5]">Exam</span></span>
                                </div>


                            </div>

                            {/* Dynamic title: replace the old static login title with this block */}
                            <div className="mb-8">
                                <span className="inline-flex text-[10px] bg-[#7C9CF5]/10 text-[#6D63F6] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                                    {authMode === "login"
                                        ? "Portal Login"
                                        : authMode === "forgot"
                                            ? "Password Recovery"
                                            : "Student Register"}
                                </span>

                                <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {authMode === "login"
                                        ? "Đăng nhập "
                                        : authMode === "forgot"
                                            ? "Quên mật khẩu"
                                            : "Đăng ký tài khoản học sinh"}
                                </h2>

                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {authMode === "login"
                                        ? "Dành cho Quản trị viên, Giáo viên và Học sinh"
                                        : authMode === "forgot"
                                            ? "Đặt lại mật khẩu bằng mã xác nhận gửi qua email. Dành cho Học sinh và Giáo viên"
                                            : "Tạo tài khoản để bắt đầu học tập và luyện thi"}
                                </p>
                            </div>



                            {/* Error notifications */}
                            <AnimatePresence mode="wait">
                                {errorMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400"
                                    >
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-relaxed">{errorMessage}</span>
                                    </motion.div>
                                )}

                                {successMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900 rounded-xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400"
                                    >
                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-relaxed">{successMessage}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Đăng nhập: Student dùng MaHS; Admin/Teacher dùng Email */}
                            {authMode === "login" && (
                                <form
                                    onSubmit={handleFormSubmit}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-2xs font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500 block">
                                            Mã học sinh / Email
                                        </label>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Users className="w-4 h-4" />
                                            </div>

                                            <input
                                                type="text"
                                                required
                                                autoComplete="username"
                                                placeholder="Học sinh: HS001 • Admin/GV: email@example.com"
                                                value={loginIdentifier}
                                                onChange={(e) => {
                                                    setLoginIdentifier(e.target.value);
                                                    if (errorMessage) {
                                                        setErrorMessage("");
                                                    }
                                                }}
                                                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900/40 border ${isDarkMode ? 'border-slate-800 focus:border-[#7C9CF5] text-white' : 'border-[#E9EDF7] focus:border-[#7C9CF5] text-slate-800'} rounded-2xl text-xs sm:text-xs transition-all focus:ring-4 focus:ring-[#7C9CF5]/10 focus:outline-none`}
                                            />
                                        </div>

                                        <p className="text-[10px] text-slate-400">
                                            Học sinh đăng nhập bằng mã học sinh. Quản trị viên và giáo viên đăng nhập bằng email.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-2xs font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500 block">
                                                Mật khẩu bảo mật
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAuthMode("forgot");
                                                    setErrorMessage("");
                                                    setSuccessMessage("");
                                                }}
                                                className="text-[10px] font-extrabold text-[#6D63F6] hover:text-[#554AE8] transition-colors"
                                            >
                                                Quên mật khẩu?
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="w-4 h-4" />
                                            </div>

                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (errorMessage) {
                                                        setErrorMessage("");
                                                    }
                                                }}
                                                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/50 dark:bg-slate-900/40 border ${isDarkMode ? 'border-slate-800 focus:border-[#7C9CF5] text-white' : 'border-[#E9EDF7] focus:border-[#7C9CF5] text-slate-800'} rounded-2xl text-xs transition-all focus:ring-4 focus:ring-[#7C9CF5]/10 focus:outline-none`}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((value) => !value)}
                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#7C9CF5]"
                                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                            >
                                                {showPassword
                                                    ? <EyeOff className="w-4 h-4" />
                                                    : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#7C9CF5] hover:bg-[#6888E0] disabled:opacity-60 text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span>{loadingStep || "Đang xử lý đăng nhập..."}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Đăng nhập hệ thống</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Quên mật khẩu: gửi mã qua email rồi đặt lại mật khẩu (Student/Teacher) */}
                            {authMode === "forgot" && (
                                <ForgotPasswordForm
                                    initialIdentifier={loginIdentifier}
                                    onBackToLogin={() => {
                                        setAuthMode("login");
                                        setErrorMessage("");
                                        setSuccessMessage("");
                                    }}
                                    onDone={(identifier, message) => {
                                        setLoginIdentifier(identifier);
                                        setPassword("");
                                        setErrorMessage("");
                                        setSuccessMessage(message);
                                        setAuthMode("login");
                                    }}
                                />
                            )}

                            {/* Đăng ký Student: email cá nhân + xác minh MaHS và họ tên với danh sách trường */}
                            {authMode === "register" && (
                                <form
                                    onSubmit={handleRegisterSubmit}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                            Mã học sinh *
                                        </label>

                                        <input
                                            required
                                            value={registerForm.maHS}
                                            onChange={(e) =>
                                                setRegisterForm({
                                                    ...registerForm,
                                                    maHS: e.target.value.toUpperCase(),
                                                })
                                            }
                                            placeholder="Ví dụ: HS001"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5] uppercase"
                                        />

                                        <p className="text-[10px] text-slate-400">
                                            Hệ thống đối chiếu mã học sinh và họ tên với danh sách học sinh do trường cung cấp.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                                Họ *
                                            </label>
                                            <input
                                                required
                                                value={registerForm.ho}
                                                onChange={(e) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        ho: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                                Tên đệm
                                            </label>
                                            <input
                                                value={registerForm.tenDem}
                                                onChange={(e) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        tenDem: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                                Tên *
                                            </label>
                                            <input
                                                required
                                                value={registerForm.ten}
                                                onChange={(e) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        ten: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                                Ngày sinh *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={registerForm.ngaySinh}
                                                onChange={(e) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        ngaySinh: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5]"
                                            />
                                        </div>

                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                            Email cá nhân *
                                        </label>

                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email"
                                                required
                                                value={registerForm.email}
                                                onChange={(e) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        email: e.target.value,
                                                    })
                                                }
                                                placeholder="Có thể dùng Gmail, Outlook hoặc email cá nhân khác"
                                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5]"
                                            />
                                        </div>

                                        <p className="text-[10px] text-slate-400">
                                            Không yêu cầu email theo tên miền của trường.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                                Mật khẩu *
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={registerForm.password}
                                                onChange={(e) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        password: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                                Xác nhận mật khẩu *
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={registerForm.confirmPassword}
                                                onChange={(e) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        confirmPassword: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#7C9CF5]"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#7C9CF5] hover:bg-[#6888E0] disabled:opacity-60 text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2"
                                    >
                                        {isLoading
                                            ? (loadingStep || "Đang đăng ký...")
                                            : "Xác minh mã, họ tên và tạo tài khoản"}
                                    </button>
                                </form>
                            )}

                            {authMode !== "forgot" && (
                            <div className="mt-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                {authMode === "login" ? (
                                    <>
                                        <span>Chưa có tài khoản? </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAuthMode("register");
                                                setErrorMessage("");
                                                setSuccessMessage("");
                                            }}
                                            className="font-extrabold text-[#6D63F6] hover:text-[#554AE8] transition-colors"
                                        >
                                            Đăng ký ngay
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span>Đã có tài khoản? </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAuthMode("login");
                                                setErrorMessage("");
                                                setSuccessMessage("");
                                            }}
                                            className="font-extrabold text-[#6D63F6] hover:text-[#554AE8] transition-colors"
                                        >
                                            Đăng nhập
                                        </button>
                                    </>
                                )}
                            </div>
                            )}
                          

                            {/* Footer with Version & copywrite */}
                            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center text-2xs text-slate-400 font-bold tracking-wider">
                                <span>VERSION 1.0</span>
                                <span>© 2026 SMARTEXAM LMS</span>
                            </div>

                        </div>


                    </div>

                </div>

            </div>
        );
    }

