import React, {
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Mail,
} from "lucide-react";

import {
    requestPasswordReset,
    resetPassword,
} from "../services/authService";

interface ForgotPasswordFormProps {
    initialIdentifier: string;
    onBackToLogin: () => void;
    onDone: (
        identifier: string,
        message: string,
    ) => void;
}

const RESEND_SECONDS = 60;

const inputClass =
    "w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900/40 border border-[#E9EDF7] dark:border-slate-800 focus:border-[#7C9CF5] text-slate-800 dark:text-white rounded-2xl text-xs transition-all focus:ring-4 focus:ring-[#7C9CF5]/10 focus:outline-none";

const labelClass =
    "text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500 block";

const primaryButtonClass =
    "w-full bg-[#7C9CF5] hover:bg-[#6888E0] disabled:opacity-60 text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2";

export default function ForgotPasswordForm({
    initialIdentifier,
    onBackToLogin,
    onDone,
}: ForgotPasswordFormProps) {
    const [step, setStep] =
        useState<1 | 2>(1);

    const [identifier, setIdentifier] =
        useState(initialIdentifier);

    const [code, setCode] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [isLoading, setIsLoading] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [infoMessage, setInfoMessage] =
        useState("");

    const [cooldown, setCooldown] =
        useState(0);

    useEffect(() => {
        if (cooldown <= 0) {
            return;
        }

        const timer = window.setTimeout(
            () => setCooldown((value) => value - 1),
            1000,
        );

        return () => window.clearTimeout(timer);
    }, [cooldown]);

    const sendCode = async () => {
        const value = identifier.trim();

        if (!value) {
            setErrorMessage(
                "Vui lòng nhập mã học sinh hoặc email.",
            );
            return;
        }

        setErrorMessage("");
        setInfoMessage("");
        setIsLoading(true);

        try {
            const message =
                await requestPasswordReset(value);

            setInfoMessage(message);
            setCooldown(RESEND_SECONDS);
            setStep(2);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Không thể gửi mã xác nhận.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        await sendCode();
    };

    const handleResetSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setErrorMessage("");

        if (!/^\d{6}$/.test(code.trim())) {
            setErrorMessage(
                "Mã xác nhận gồm đúng 6 chữ số.",
            );
            return;
        }

        if (!newPassword) {
            setErrorMessage(
                "Vui lòng nhập mật khẩu mới.",
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage(
                "Mật khẩu xác nhận không khớp.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const message =
                await resetPassword({
                    identifier: identifier.trim(),
                    code: code.trim(),
                    newPassword,
                    confirmPassword,
                });

            onDone(
                identifier.trim(),
                message ||
                "Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.",
            );
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Không thể đặt lại mật khẩu.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{errorMessage}</span>
                </div>
            )}

            {infoMessage && step === 2 && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900 rounded-xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{infoMessage}</span>
                </div>
            )}

            {step === 1 && (
                <form
                    onSubmit={handleSendSubmit}
                    className="space-y-4"
                >
                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            Mã học sinh hoặc email
                        </label>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail className="w-4 h-4" />
                            </div>

                            <input
                                type="text"
                                required
                                autoFocus
                                autoComplete="username"
                                placeholder="Học sinh: HS001 • Giáo viên: email@example.com"
                                value={identifier}
                                onChange={(e) => {
                                    setIdentifier(e.target.value);
                                    if (errorMessage) {
                                        setErrorMessage("");
                                    }
                                }}
                                className={inputClass}
                            />
                        </div>

                        <p className="text-[10px] text-slate-400">
                            Hệ thống sẽ gửi mã xác nhận 6 chữ số tới email đã đăng ký của tài khoản. Học sinh nhập mã học sinh, giáo viên nhập email.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={primaryButtonClass}
                    >
                        {isLoading ? (
                            <span>Đang gửi mã...</span>
                        ) : (
                            <>
                                <span>Gửi mã xác nhận</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form
                    onSubmit={handleResetSubmit}
                    className="space-y-4"
                >
                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            Mã xác nhận (6 chữ số)
                        </label>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <KeyRound className="w-4 h-4" />
                            </div>

                            <input
                                type="text"
                                required
                                autoFocus
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="••••••"
                                value={code}
                                onChange={(e) => {
                                    setCode(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6),
                                    );
                                    if (errorMessage) {
                                        setErrorMessage("");
                                    }
                                }}
                                className={`${inputClass} tracking-[0.5em] font-black`}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>
                                Gửi cho: <span className="font-bold text-slate-500">{identifier.trim()}</span>
                            </span>

                            <button
                                type="button"
                                disabled={cooldown > 0 || isLoading}
                                onClick={() => void sendCode()}
                                className="font-extrabold text-[#6D63F6] hover:text-[#554AE8] disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                {cooldown > 0
                                    ? `Gửi lại mã sau ${cooldown}s`
                                    : "Gửi lại mã"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            Mật khẩu mới
                        </label>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>

                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (errorMessage) {
                                        setErrorMessage("");
                                    }
                                }}
                                className={`${inputClass} pr-10`}
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

                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            Nhập lại mật khẩu mới
                        </label>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>

                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errorMessage) {
                                        setErrorMessage("");
                                    }
                                }}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={primaryButtonClass}
                    >
                        {isLoading ? (
                            <span>Đang đặt lại mật khẩu...</span>
                        ) : (
                            <>
                                <span>Đặt lại mật khẩu</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setStep(1);
                            setCode("");
                            setErrorMessage("");
                            setInfoMessage("");
                        }}
                        className="w-full text-[11px] font-bold text-slate-400 hover:text-slate-600"
                    >
                        Nhập lại mã học sinh / email
                    </button>
                </form>
            )}

            <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6D63F6] hover:text-[#554AE8] transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại đăng nhập
            </button>
        </div>
    );
}
