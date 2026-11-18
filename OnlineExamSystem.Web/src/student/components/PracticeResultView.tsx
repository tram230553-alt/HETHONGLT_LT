import React from "react";

import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Sparkles,
    RotateCcw,
    Trophy,
    XCircle,
} from "lucide-react";

import {
    practiceService,
    type PracticeAttemptDetailDto,
} from "../../services/practiceService";

interface PracticeResultViewProps {
    attemptId: string;
    onBack: () => void;
    onRetry?: () => void;
}

export default function PracticeResultView({
    attemptId,
    onBack,
    onRetry,
}: PracticeResultViewProps) {
    const [detail, setDetail] =
        React.useState<PracticeAttemptDetailDto | null>(null);

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    // Dùng để tự cuộn nút số câu hiện tại vào vùng nhìn thấy.
    const questionButtonRefs =
        React.useRef<Array<HTMLButtonElement | null>>([]);
    const [aiExplanations, setAiExplanations] = React.useState<Record<string, string>>({});
    const [aiError, setAiError] = React.useState<Record<string, string>>({});
    const [aiNotice, setAiNotice] = React.useState<Record<string, string>>({});
    const [aiLoadingQuestion, setAiLoadingQuestion] = React.useState<string | null>(null);

    const explain = async (questionId: string) => {
        if (aiLoadingQuestion || aiExplanations[questionId]) return;
        setAiLoadingQuestion(questionId);
        setAiError((prev) => ({ ...prev, [questionId]: "" }));
        try {
            const result = await practiceService.explainPracticeAnswer(attemptId, questionId);
            setAiExplanations((prev) => ({ ...prev, [questionId]: result.text }));
            setAiNotice((prev) => ({
                ...prev,
                [questionId]: result.isFallback ? (result.notice ?? "AI tạm thời không khả dụng.") : "",
            }));
        } catch (err) {
            setAiError((prev) => ({
                ...prev,
                [questionId]: err instanceof Error ? err.message : "Không tạo được lời giải AI.",
            }));
        } finally {
            setAiLoadingQuestion(null);
        }
    };

    React.useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await practiceService.getPracticeAttemptDetail(
                        attemptId,
                    );

                setDetail(data);
                setCurrentIndex(0);
                setAiExplanations({});
                setAiError({});
                setAiNotice({});
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Không tải được kết quả luyện tập.",
                );
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [attemptId]);


    /*
     * Điều hướng nhanh bằng bàn phím:
     * ← câu trước, → câu tiếp.
     * Không can thiệp khi người dùng đang gõ trong input/textarea/select.
     */
    React.useEffect(() => {
        if (!detail?.answers?.length) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase();

            if (
                tagName === "input" ||
                tagName === "textarea" ||
                tagName === "select"
            ) {
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();

                setCurrentIndex((value) =>
                    Math.max(0, value - 1),
                );
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();

                setCurrentIndex((value) =>
                    Math.min(
                        detail.answers.length - 1,
                        value + 1,
                    ),
                );
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
    }, [detail]);


    /*
     * Khi đổi câu, tự cuộn số câu đang chọn vào giữa thanh điều hướng.
     */
    React.useEffect(() => {
        questionButtonRefs.current[
            currentIndex
        ]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    }, [currentIndex]);

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3 font-bold text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang tải kết quả...
                </div>
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="h-full min-h-0 overflow-y-auto bg-slate-50 p-6">
                <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-red-50 p-6">
                    <p className="font-bold text-red-600">
                        {error ?? "Không tìm thấy kết quả."}
                    </p>

                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (detail.answers.length === 0) {
        return (
            <div className="h-full min-h-0 overflow-y-auto bg-slate-50 p-6">
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                    <h2 className="mt-4 font-black text-slate-800">
                        Lượt luyện tập chưa có dữ liệu câu hỏi
                    </h2>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const current = detail.answers[currentIndex];
    const answered = Boolean(current.studentAnswer);

    const unanswered = Math.max(
        detail.totalQuestions - detail.answeredQuestions,
        0,
    );

    const accuracy =
        detail.totalQuestions > 0
            ? Math.round(
                  (detail.correctAnswers / detail.totalQuestions) * 100,
              )
            : 0;

    const options = [
        { key: "A", text: current.optionA },
        { key: "B", text: current.optionB },
        { key: "C", text: current.optionC },
        { key: "D", text: current.optionD },
    ];

    const submittedAt = new Date(detail.submittedAt);
    const submittedText = Number.isNaN(submittedAt.getTime())
        ? detail.submittedAt
        : submittedAt.toLocaleString("vi-VN");

    const getAnswerStateClass = (
        answer: PracticeAttemptDetailDto["answers"][number],
        index: number,
    ) => {
        let state =
            "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100";

        if (answer.studentAnswer) {
            state = answer.isCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
        }

        if (currentIndex === index) {
            state +=
                " ring-2 ring-indigo-500 ring-offset-2";
        }

        return state;
    };

    return (
        <div className="app-scrollbar h-full min-h-0 overflow-y-auto bg-[#f5f7fa]">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
                <div className="mx-auto flex min-h-[70px] max-w-[1500px] items-center justify-between gap-4 px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                                Kết quả luyện tập
                            </p>
                            <h1 className="truncate text-base font-black text-slate-900 md:text-lg">
                                {detail.topicName}
                            </h1>
                        </div>
                    </div>

                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Làm lại
                        </button>
                    )}
                </div>
            </header>

            <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-6">
                <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                    <div className="grid gap-5 p-5 md:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                                <Trophy className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-blue-100">
                                    Điểm của bạn
                                </p>

                                <div className="mt-0.5 flex items-baseline gap-2">
                                    <span className="text-4xl font-black">
                                        {detail.score.toFixed(2)}
                                    </span>

                                    <span className="font-bold text-blue-100">
                                        /10
                                    </span>
                                </div>

                                <p className="mt-1 text-xs font-semibold text-blue-100 md:text-sm">
                                    Độ chính xác {accuracy}% • {submittedText}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <Stat value={detail.totalQuestions} label="Tổng câu" />
                            <Stat value={detail.correctAnswers} label="Đúng" />
                            <Stat value={detail.wrongAnswers} label="Sai" />
                            <Stat value={unanswered} label="Bỏ trống" />
                        </div>
                    </div>
                </section>


                {/* Điều hướng nhanh trên tablet/mobile */}
                <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-black text-slate-900">
                                Chọn câu để xem
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                Vuốt ngang hoặc bấm trực tiếp vào số câu
                            </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-600">
                            {currentIndex + 1}/{detail.answers.length}
                        </span>
                    </div>

                    <div className="app-scrollbar flex gap-2 overflow-x-auto pb-2">
                        {detail.answers.map((answer, index) => (
                            <button
                                key={answer.questionId}
                                ref={(element) => {
                                    questionButtonRefs.current[index] =
                                        element;
                                }}
                                type="button"
                                onClick={() =>
                                    setCurrentIndex(index)
                                }
                                className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black transition ${getAnswerStateClass(
                                    answer,
                                    index,
                                )}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </section>


                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <main className="overflow-hidden rounded-2xl border border-slate-200 bg-white pb-2 shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-7">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-black text-slate-900">
                                            Câu {currentIndex + 1}
                                        </h2>

                                        <span className="text-xs font-bold text-slate-400">
                                            / {detail.answers.length}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs font-semibold text-slate-400">
                                        Xem lại đáp án • dùng ← → để chuyển câu
                                    </p>
                                </div>

                            {current.isCorrect ? (
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Chính xác
                                </div>
                            ) : answered ? (
                                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-600">
                                    <XCircle className="h-4 w-4" />
                                    Chưa đúng
                                </div>
                            ) : (
                                <div className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-600">
                                    Chưa trả lời
                                </div>
                            )}
                            </div>

                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                    style={{
                                        width: `${((currentIndex + 1) / detail.answers.length) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="p-5 md:p-7">
                            <p className="whitespace-pre-line text-[16px] font-bold leading-8 text-slate-900">
                                {current.questionText}
                            </p>

                            <div className="mt-6 space-y-3">
                                {options.map((option) => {
                                    const correct = current.correctAnswer
                                        .split(",")
                                        .includes(option.key);
                                    const selected = (current.studentAnswer ?? "")
                                        .split(",")
                                        .includes(option.key);

                                    let wrapper =
                                        "border-slate-200 bg-white";
                                    let badge =
                                        "border-slate-300 bg-white text-slate-700";

                                    if (correct) {
                                        wrapper =
                                            "border-emerald-400 bg-emerald-50";
                                        badge =
                                            "border-emerald-500 bg-emerald-500 text-white";
                                    }

                                    if (selected && !correct) {
                                        wrapper = "border-red-400 bg-red-50";
                                        badge =
                                            "border-red-500 bg-red-500 text-white";
                                    }

                                    return (
                                        <div
                                            key={option.key}
                                            className={`flex items-center gap-4 rounded-xl border px-4 py-4 ${wrapper}`}
                                        >
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${badge}`}
                                            >
                                                {option.key}
                                            </div>

                                            <span className="flex-1 text-sm font-semibold leading-6 text-slate-700">
                                                {option.text}
                                            </span>

                                            {correct && (
                                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                                            )}

                                            {selected && !correct && (
                                                <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {!answered && (
                                <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
                                    Bạn đã bỏ trống câu này. Đáp án đúng là {current.correctAnswer}.
                                </div>
                            )}

                            {current.explanation && (
                                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                                    <div className="flex items-center gap-2 font-black text-blue-800">
                                        <BookOpen className="h-4 w-4" />
                                        Giải thích
                                    </div>
                                    <p className="mt-2 text-sm leading-7 text-slate-700">
                                        {current.explanation}
                                    </p>
                                </div>
                            )}

                            {!current.isCorrect && (
                                <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-5">
                                    <button
                                        type="button"
                                        onClick={() => void explain(current.questionId)}
                                        disabled={aiLoadingQuestion !== null || Boolean(aiExplanations[current.questionId])}
                                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {aiLoadingQuestion === current.questionId
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Sparkles className="h-4 w-4" />}
                                        {aiLoadingQuestion === current.questionId ? "Đang giải thích..." : "Nhờ AI giải thích"}
                                    </button>
                                    {aiError[current.questionId] && (
                                        <p role="alert" className="mt-3 text-sm text-red-700">
                                            {aiError[current.questionId]}
                                            {current.explanation && " Bạn vẫn có thể xem lời giải của giáo viên ở trên."}
                                        </p>
                                    )}
                                    {aiNotice[current.questionId] && (
                                        <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                            {aiNotice[current.questionId]}
                                        </p>
                                    )}
                                    {aiExplanations[current.questionId] && (
                                        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                            {aiExplanations[current.questionId]}
                                        </div>
                                    )}
                                    <p className="mt-3 text-xs text-violet-700">
                                        Lời giải AI chỉ để tham khảo; đáp án và điểm do hệ thống chấm.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-slate-200 bg-slate-50/95 px-5 py-4 shadow-[0_-8px_20px_rgba(15,23,42,0.04)] backdrop-blur md:px-7">
                            <button
                                type="button"
                                disabled={currentIndex === 0}
                                onClick={() =>
                                    setCurrentIndex((value) => value - 1)
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Câu trước
                            </button>

                            <div className="text-center">
                                <p className="text-sm font-black text-slate-700">
                                    {currentIndex + 1}/{detail.answers.length}
                                </p>

                                <p className="hidden text-[10px] font-semibold text-slate-400 sm:block">
                                    ← → để chuyển nhanh
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    currentIndex === detail.answers.length - 1
                                }
                                onClick={() =>
                                    setCurrentIndex((value) => value + 1)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Câu tiếp
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </main>

                    <aside className="hidden lg:sticky lg:top-[86px] lg:block lg:self-start">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="font-black text-slate-900">
                                Kết quả từng câu
                            </h3>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                                Bấm vào số câu để xem chi tiết
                            </p>

                            <div className="mt-5 grid grid-cols-5 gap-2">
                                {detail.answers.map((answer, index) => (
                                    <button
                                        key={answer.questionId}
                                        ref={(element) => {
                                            questionButtonRefs.current[index] =
                                                element;
                                        }}
                                        type="button"
                                        onClick={() =>
                                            setCurrentIndex(index)
                                        }
                                        title={`Xem câu ${index + 1}`}
                                        className={`aspect-square rounded-xl border text-xs font-black transition ${getAnswerStateClass(
                                            answer,
                                            index,
                                        )}`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 space-y-3">
                                <Legend
                                    className="bg-emerald-500"
                                    label="Trả lời đúng"
                                />
                                <Legend
                                    className="bg-red-500"
                                    label="Trả lời sai"
                                />
                                <Legend
                                    className="bg-orange-400"
                                    label="Chưa trả lời"
                                />
                            </div>

                            <div className="my-5 h-px bg-slate-100" />

                            <div className="space-y-2 text-xs font-semibold text-slate-500">
                                <div className="flex justify-between gap-3">
                                    <span>Môn học</span>
                                    <span className="text-right font-black text-slate-700">
                                        {detail.subjectName}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span>Chương</span>
                                    <span className="text-right font-black text-slate-700">
                                        {detail.chapterName}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span>Bài</span>
                                    <span className="font-black text-slate-700">
                                        {String(detail.orderNum).padStart(2, "0")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function Stat({
    value,
    label,
}: {
    value: number;
    label: string;
}) {
    return (
        <div className="min-w-[72px] rounded-xl bg-white/10 px-3 py-2.5 text-center">
            <div className="text-xl font-black">{value}</div>
            <div className="mt-1 text-[11px] font-semibold text-blue-100">
                {label}
            </div>
        </div>
    );
}

function Legend({
    className,
    label,
}: {
    className: string;
    label: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className={`h-4 w-4 rounded ${className}`} />
            <span className="text-xs font-semibold text-slate-500">
                {label}
            </span>
        </div>
    );
}
