import React, { useState, useEffect, useCallback } from "react";
import {
    X,
    Clock,
    Star,
    RotateCcw,
    Trophy,
    CheckCircle2,
    XCircle,
    Volume2,
    VolumeX,
    Sparkles,
    ArrowRight,
    HelpCircle,
    Send,
} from "lucide-react";
import type { ChessQuestionDto } from "../../services/practiceService";

/* =========================================================
   PROPS
========================================================= */

interface GamifiedQuizViewProps {
    mode: "mc" | "tf" | "essay";
    title: string;
    questions: ChessQuestionDto[];
    onBack: () => void;
    onEarnGems?: (amount: number) => void;
    userStars?: number;
    onUseStars?: (amount: number) => boolean;
}

interface QuestionHistoryItem {
    id: string;
    questionText: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation?: string | null;
}

/* =========================================================
   SOUND SYNTHESIZER
========================================================= */

const playSound = (type: "correct" | "wrong" | "finish") => {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (type === "correct") {
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.15, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.2);
            });
        } else if (type === "wrong") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.setValueAtTime(140, now + 0.1);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === "finish") {
            const chord = [523.25, 659.25, 783.99, 1046.5];
            chord.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                gain.gain.setValueAtTime(0.2, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.5);
            });
        }
    } catch {
        // Ignore audio errors
    }
};

/* =========================================================
   COMPONENT: GAMIFIED QUIZ VIEW
========================================================= */

export default function GamifiedQuizView({
    mode,
    title,
    questions,
    onBack,
    onEarnGems,
    userStars = 0,
    onUseStars,
}: GamifiedQuizViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [soundOn, setSoundOn] = useState(true);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [history, setHistory] = useState<QuestionHistoryItem[]>([]);

    // State của câu hiện tại
    const [selectedAnswer, setSelectedAnswer] = useState<string | boolean | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
    const [essayInput, setEssayInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(25);
    const [showHint, setShowHint] = useState(false);
    const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "star" } | null>(null);

    // Màn hình kết thúc
    const [isFinished, setIsFinished] = useState(false);

    const currentQ = questions[currentIndex] || null;

    const showToast = useCallback((text: string, type: "success" | "error" | "star" = "success") => {
        setToastMsg({ text, type });
        setTimeout(() => {
            setToastMsg((prev) => (prev?.text === text ? null : prev));
        }, 2500);
    }, []);

    // Reset khi sang câu mới
    const initQuestion = useCallback(() => {
        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsCurrentCorrect(false);
        setEssayInput("");
        setTimeLeft(25);
        setShowHint(false);
    }, []);

    // Countdown timer cho câu hỏi hiện tại
    useEffect(() => {
        if (isAnswered || isFinished || !currentQ) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Hết giờ
                    handleSelectAnswer(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isAnswered, isFinished, currentQ]);

    // Xử lý nộp câu trả lời
    const handleSelectAnswer = (ans: string | boolean | null) => {
        if (isAnswered || !currentQ) return;

        let correct = false;
        const qType = currentQ.type || (mode === "tf" ? "true_false" : mode === "essay" ? "essay" : "single_choice");

        if (ans === null) {
            correct = false;
        } else if (qType === "true_false" || typeof ans === "boolean") {
            const expected = currentQ.isTrue ?? (String(currentQ.correctAnswer).toLowerCase() === "true");
            correct = ans === expected;
        } else if (qType === "essay") {
            const normUser = String(ans).trim().toLowerCase();
            const normAns = (currentQ.correctAnswer || "").trim().toLowerCase();
            correct = normUser.length > 0 && (normUser === normAns || normAns.includes(normUser));
        } else {
            // Trắc nghiệm
            const chosen = String(ans).trim().toUpperCase();
            const correctAns = (currentQ.correctAnswer || "").trim().toUpperCase();
            correct = chosen === correctAns || chosen.includes(correctAns);
        }

        setSelectedAnswer(ans);
        setIsAnswered(true);
        setIsCurrentCorrect(correct);

        if (correct) {
            setScore((s) => s + 10);
            setCorrectCount((c) => c + 1);
            if (soundOn) playSound("correct");
            showToast("+10 điểm! Chính xác 🎉", "success");
            onEarnGems?.(3);
        } else {
            setWrongCount((w) => w + 1);
            if (soundOn) playSound("wrong");
            showToast("Chưa chính xác rồi 😢", "error");
        }

        setHistory((prev) => [
            {
                id: currentQ.id,
                questionText: currentQ.noiDung || currentQ.questionText || "Câu hỏi",
                userAnswer: String(ans ?? "Hết giờ"),
                isCorrect: correct,
                explanation: currentQ.explanation,
            },
            ...prev,
        ]);
    };

    // Chuyển sang câu tiếp theo
    const handleNextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1);
            initQuestion();
        } else {
            setIsFinished(true);
            if (soundOn) playSound("finish");
        }
    };

    // Chơi lại
    const handleRestart = () => {
        setCurrentIndex(0);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setHistory([]);
        setIsFinished(false);
        initQuestion();
    };

    // Dùng sao mua gợi ý
    const handleUseStarHint = () => {
        if (userStars < 1) {
            showToast("Bạn không đủ sao! Hãy hoàn thành bài học để nhận thêm ⭐", "error");
            return;
        }
        if (onUseStars && !onUseStars(1)) {
            showToast("Không thể trừ sao!", "error");
            return;
        }
        setShowHint(true);
        showToast("Đã dùng 1 ⭐ để mở gợi ý!", "star");
    };

    const modeLabels: Record<string, { name: string; icon: string; bg: string }> = {
        mc: { name: "Trắc nghiệm", icon: "🎯", bg: "bg-purple-100 text-purple-800" },
        tf: { name: "Đúng / Sai", icon: "⚡", bg: "bg-emerald-100 text-emerald-800" },
        essay: { name: "Tự luận", icon: "✍️", bg: "bg-orange-100 text-orange-800" },
    };
    const currentMeta = modeLabels[mode] || modeLabels.mc;

    return (
        <div className="flex h-full flex-col bg-[var(--theme-bg)] p-3 md:p-6 select-none overflow-y-auto no-scrollbar">
            {/* Top Toolbar */}
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-sm border border-slate-100 mb-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95"
                        title="Quay lại danh sách game"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-1.5">
                            <span>{currentMeta.icon}</span>
                            <span>{currentMeta.name}</span>
                        </h1>
                        <p className="text-[11px] font-bold text-slate-500 truncate max-w-[200px] md:max-w-xs">
                            {title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Stars */}
                    <div
                        className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 border border-amber-200 text-amber-800 text-xs font-black shadow-xs cursor-pointer hover:bg-amber-100 transition"
                        title={`Bạn có ${userStars} Sao. Dùng 1 Sao trong câu hỏi để nhận gợi ý!`}
                        onClick={handleUseStarHint}
                    >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span>{userStars}</span>
                    </div>

                    {/* Progress */}
                    <span className="text-xs font-black text-slate-500">
                        {currentIndex + 1} / {questions.length}
                    </span>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 border border-purple-200 text-xs font-black text-purple-700">
                        <Trophy className="h-3.5 w-3.5 text-purple-600" />
                        <span>{score}đ</span>
                    </div>

                    {/* Sound */}
                    <button
                        type="button"
                        onClick={() => setSoundOn(!soundOn)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition"
                    >
                        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mx-auto w-full max-w-2xl mb-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Main Question Card - Matches image format exactly */}
            {currentQ && !isFinished && (
                <div className="mx-auto w-full max-w-2xl flex-1 flex flex-col justify-center">
                    <div className="rounded-[32px] bg-white p-6 md:p-8 shadow-md border border-slate-100 transition-all">
                        {/* Question Badge & Timer */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-black text-purple-700">
                                <span>Câu {currentIndex + 1}</span>
                                <span>·</span>
                                <span>{currentMeta.name}</span>
                            </span>

                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                                    {timeLeft}s
                                </span>
                                {userStars > 0 && !showHint && !isAnswered && (
                                    <button
                                        type="button"
                                        onClick={handleUseStarHint}
                                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 hover:bg-amber-200 transition"
                                        title="Dùng 1 sao xem gợi ý"
                                    >
                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                        Gợi ý (-1⭐)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Question Content */}
                        <h2 className="text-lg md:text-xl font-black text-slate-800 leading-snug">
                            {currentQ.noiDung || currentQ.questionText}
                        </h2>

                        {/* Hint container if unlocked */}
                        {showHint && (
                            <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 animate-fade-in flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Gợi ý từ sao:</p>
                                    <p className="mt-0.5">{currentQ.explanation || `Đáp án đúng là: ${currentQ.correctAnswer || (currentQ.isTrue ? "Đúng" : "Sai")}`}</p>
                                </div>
                            </div>
                        )}

                        {/* Interactive Answers */}
                        <div className="mt-6">
                            {/* DẠNG 1: ĐÚNG / SAI (2 nút to pastel đẹp mắt) */}
                            {(mode === "tf" || currentQ.type === "true_false" || (!currentQ.optionA && !currentQ.optionB && currentQ.type !== "essay")) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAnswer(true)}
                                        disabled={isAnswered}
                                        className={`py-5 rounded-2xl font-black text-lg md:text-xl transition shadow-sm active:scale-95 ${
                                            isAnswered
                                                ? currentQ.isTrue
                                                    ? "bg-emerald-500 text-white ring-4 ring-emerald-200"
                                                    : selectedAnswer === true
                                                      ? "bg-rose-500 text-white"
                                                      : "bg-emerald-100 text-emerald-800 opacity-60"
                                                : "bg-[#dcfce7] text-[#166534] hover:bg-[#bbf7d0] border border-[#86efac]"
                                        }`}
                                    >
                                        ĐÚNG
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAnswer(false)}
                                        disabled={isAnswered}
                                        className={`py-5 rounded-2xl font-black text-lg md:text-xl transition shadow-sm active:scale-95 ${
                                            isAnswered
                                                ? !currentQ.isTrue
                                                    ? "bg-emerald-500 text-white ring-4 ring-emerald-200"
                                                    : selectedAnswer === false
                                                      ? "bg-rose-500 text-white"
                                                      : "bg-rose-100 text-rose-800 opacity-60"
                                                : "bg-[#ffe4e6] text-[#9f1239] hover:bg-[#fecdd3] border border-[#fda4af]"
                                        }`}
                                    >
                                        SAI
                                    </button>
                                </div>
                            )}

                            {/* DẠNG 2: TRẮC NGHIỆM ABCD */}
                            {(mode === "mc" || (!currentQ.isTrue && (currentQ.optionA || currentQ.optionB))) && currentQ.type !== "essay" && currentQ.type !== "true_false" && (
                                <div className="space-y-3">
                                    {[
                                        { key: "A", text: currentQ.optionA },
                                        { key: "B", text: currentQ.optionB },
                                        { key: "C", text: currentQ.optionC },
                                        { key: "D", text: currentQ.optionD },
                                    ]
                                        .filter((opt) => opt.text && opt.text.trim())
                                        .map((opt) => {
                                            const isChosen = selectedAnswer === opt.key;
                                            const isCorrectOption = (currentQ.correctAnswer || "").trim().toUpperCase() === opt.key;

                                            let btnStyle = "border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/50";
                                            if (isAnswered) {
                                                if (isCorrectOption) {
                                                    btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200";
                                                } else if (isChosen) {
                                                    btnStyle = "border-rose-500 bg-rose-50 text-rose-900";
                                                } else {
                                                    btnStyle = "border-slate-200 bg-slate-50 opacity-50";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={opt.key}
                                                    type="button"
                                                    onClick={() => handleSelectAnswer(opt.key)}
                                                    disabled={isAnswered}
                                                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition text-left active:scale-[0.99] ${btnStyle}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white font-black text-xs text-slate-800 shadow-xs border border-slate-200 shrink-0">
                                                            {opt.key}
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {opt.text}
                                                        </span>
                                                    </div>
                                                    {isAnswered && isCorrectOption && (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                                    )}
                                                    {isAnswered && isChosen && !isCorrectOption && (
                                                        <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>
                            )}

                            {/* DẠNG 3: TỰ LUẬN */}
                            {(mode === "essay" || currentQ.type === "essay") && (
                                <div className="space-y-3">
                                    <textarea
                                        rows={3}
                                        value={essayInput}
                                        onChange={(e) => setEssayInput(e.target.value)}
                                        disabled={isAnswered}
                                        placeholder="Nhập câu trả lời của bạn vào đây..."
                                        className="w-full rounded-2xl border-2 border-slate-200 p-3.5 text-sm font-medium focus:border-orange-400 focus:outline-hidden disabled:bg-slate-50"
                                    />
                                    {!isAnswered ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAnswer(essayInput)}
                                            disabled={!essayInput.trim()}
                                            className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-md transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                        >
                                            <Send className="h-4 w-4" />
                                            Xác nhận câu trả lời
                                        </button>
                                    ) : (
                                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700">
                                            <span className="font-bold text-slate-500 block mb-1">Đáp án mẫu:</span>
                                            <p className="font-semibold text-slate-900">{currentQ.correctAnswer || "Không có đáp án mẫu"}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Explanation & Next Button after answering */}
                        {isAnswered && (
                            <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
                                <div className="text-xs text-slate-600">
                                    {isCurrentCorrect ? (
                                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-4 w-4" /> Chính xác! Rất xuất sắc.
                                        </span>
                                    ) : (
                                        <span className="font-bold text-rose-600 flex items-center gap-1">
                                            <XCircle className="h-4 w-4" /> Chưa đúng. Hãy chú ý câu sau nhé!
                                        </span>
                                    )}
                                    {currentQ.explanation && (
                                        <p className="mt-1 text-slate-500 text-[11px] leading-relaxed">
                                            Giải thích: {currentQ.explanation}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNextQuestion}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs md:text-sm font-black text-white hover:bg-indigo-700 active:scale-95 transition shadow-md shrink-0"
                                >
                                    {currentIndex < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* End Summary Screen */}
            {isFinished && (
                <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center animate-fade-in">
                    <div className="rounded-[32px] bg-white p-6 md:p-8 text-center shadow-lg border border-slate-100">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md mb-4 animate-bounce">
                            <Trophy className="h-10 w-10" />
                        </div>

                        <span className="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-purple-700">
                            Kết Quả Luyện Tập
                        </span>

                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                            {correctCount === questions.length ? "Xuất Sắc! Hoàn Hảo!" : "Hoàn Thành Luyện Tập!"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500 truncate font-bold">
                            Chủ đề: <strong className="text-purple-700">{title}</strong>
                        </p>

                        {/* Stats */}
                        <div className="my-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-center">
                                <span className="block text-lg font-black text-emerald-600">{correctCount}</span>
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Trả lời đúng</span>
                            </div>
                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-center">
                                <span className="block text-lg font-black text-rose-600">{wrongCount}</span>
                                <span className="text-[10px] font-bold text-rose-700 uppercase">Trả lời sai</span>
                            </div>
                            <div className="rounded-xl bg-purple-50 border border-purple-200 p-2 text-center">
                                <span className="block text-lg font-black text-purple-600">{score}</span>
                                <span className="text-[10px] font-bold text-purple-700 uppercase">Điểm số</span>
                            </div>
                        </div>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="mb-5 max-h-36 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 text-left text-xs space-y-1.5 no-scrollbar">
                                <div className="text-[11px] font-black text-slate-500 px-1">Chi tiết câu hỏi:</div>
                                {history.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 border border-slate-100">
                                        <div className="flex items-center gap-1.5 truncate">
                                            {it.isCorrect ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                            )}
                                            <span className="truncate text-slate-700 font-bold">{it.questionText}</span>
                                        </div>
                                        <span className={`text-[11px] font-black shrink-0 ${it.isCorrect ? "text-emerald-600" : "text-slate-400"}`}>
                                            {it.isCorrect ? "+10đ" : "0đ"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleRestart}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 active:scale-95 transition shadow-md"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Luyện lại
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                            >
                                Chọn game khác
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
