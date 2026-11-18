import React from "react";

import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CircleAlert,
    Flag,
    Loader2,
    Send,
    X,
} from "lucide-react";

import type { TopicDto } from "../../services/topicService";

import {
    practiceService,
    type PracticeQuestionDto,
    type SubmitPracticeAnswer,
} from "../../services/practiceService";

import PracticeResultView from "./PracticeResultView";

interface TopicPracticeViewProps {
    topic: TopicDto;
    onBack: () => void;
}

export default function TopicPracticeView({
    topic,
    onBack,
}: TopicPracticeViewProps) {
    const [questions, setQuestions] =
        React.useState<PracticeQuestionDto[]>([]);

    const [answers, setAnswers] =
        React.useState<Record<string, string>>({});

    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
    const [showExitConfirm, setShowExitConfirm] = React.useState(false);
    const [completedAttemptId, setCompletedAttemptId] =
        React.useState<string | null>(null);

    const [flaggedQuestions, setFlaggedQuestions] = React.useState<
        Set<string>
    >(() => new Set());

    React.useEffect(() => {
        const loadQuestions = async () => {
            try {
                setLoading(true);
                setError(null);
                setCompletedAttemptId(null);

                const data = await practiceService.getPracticeQuestions(
                    topic.id,
                );

                setQuestions(data);
                setAnswers({});
                setCurrentIndex(0);
                setFlaggedQuestions(new Set());
            } catch (err) {
                console.error("LOAD PRACTICE QUESTIONS ERROR:", err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Không thể tải câu hỏi luyện tập.",
                );
            } finally {
                setLoading(false);
            }
        };

        void loadQuestions();
    }, [topic.id]);

    const currentQuestion = questions[currentIndex];

    const answeredCount = Object.keys(answers).length;
    const unansweredCount = Math.max(
        questions.length - answeredCount,
        0,
    );

    const progress =
        questions.length > 0
            ? Math.round((answeredCount / questions.length) * 100)
            : 0;

    const selectAnswer = (question: PracticeQuestionDto, answer: string) => {
        setAnswers((previous) => {
            if (question.type !== "multiple_choice") {
                return { ...previous, [question.id]: answer };
            }

            const selected = new Set((previous[question.id] ?? "").split(",").filter(Boolean));
            if (selected.has(answer)) selected.delete(answer);
            else selected.add(answer);

            const nextAnswer = ["A", "B", "C", "D"]
                .filter((item) => selected.has(item))
                .join(",");
            const next = { ...previous };
            if (nextAnswer) next[question.id] = nextAnswer;
            else delete next[question.id];
            return next;
        });
    };

    const toggleFlag = (questionId: string) => {
        setFlaggedQuestions((previous) => {
            const next = new Set(previous);

            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }

            return next;
        });
    };

    const goToQuestion = (index: number) => {
        if (index < 0 || index >= questions.length) {
            return;
        }

        setCurrentIndex(index);
    };

    const submitPractice = async () => {
        if (questions.length === 0) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const requestAnswers: SubmitPracticeAnswer[] =
                Object.entries(answers).map(
                    ([questionId, answer]) => ({
                        questionId,
                        answer: String(answer),
                    }),
                );

            const response = await practiceService.submitPractice(
                topic.id,
                requestAnswers,
            );

            setShowSubmitConfirm(false);
            setCompletedAttemptId(response.attemptId);
        } catch (err) {
            console.error("SUBMIT PRACTICE ERROR:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể nộp bài luyện tập.",
            );

            setShowSubmitConfirm(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setCompletedAttemptId(null);
        setAnswers({});
        setCurrentIndex(0);
        setFlaggedQuestions(new Set());
        setError(null);
    };

    const handleExit = () => {
        if (answeredCount > 0) {
            setShowExitConfirm(true);
            return;
        }

        onBack();
    };

    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                    <div className="font-bold text-slate-600">
                        Đang tải đề luyện tập...
                    </div>
                </div>
            </div>
        );
    }

    if (completedAttemptId) {
        return (
            <div className="app-scrollbar h-full min-h-0 overflow-y-auto">
                <PracticeResultView
                    attemptId={completedAttemptId}
                    onBack={onBack}
                    onRetry={handleRetry}
                />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="app-scrollbar h-full min-h-0 overflow-y-auto bg-slate-50 p-5">
                <div className="mx-auto max-w-3xl">
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </button>

                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                        <h2 className="mt-4 text-xl font-black text-slate-800">
                            Topic chưa có câu hỏi
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Giáo viên chưa thêm câu hỏi luyện tập cho chủ đề này.
                        </p>
                        {error && (
                            <div className="mt-4 text-sm font-semibold text-red-500">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const selectedAnswer = currentQuestion
        ? answers[currentQuestion.id]
        : undefined;

    const options = currentQuestion
        ? [
              { key: "A", text: currentQuestion.optionA },
              { key: "B", text: currentQuestion.optionB },
              { key: "C", text: currentQuestion.optionC },
              { key: "D", text: currentQuestion.optionD },
          ]
        : [];

    return (
        <div className="app-scrollbar h-full min-h-0 overflow-y-auto bg-[#f5f7fa]">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
                <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExit}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        <div className="min-w-0">
                            <div className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-blue-600">
                                Luyện tập
                            </div>
                            <h1 className="truncate text-base font-black text-slate-900 md:text-lg">
                                {topic.name}
                            </h1>
                        </div>
                    </div>

                    <div className="hidden items-center gap-6 md:flex">
                        <HeaderStat label="Tổng số câu" value={questions.length} />
                        <div className="h-8 w-px bg-slate-200" />
                        <HeaderStat
                            label="Đã làm"
                            value={answeredCount}
                            valueClassName="text-blue-600"
                        />
                        <div className="h-8 w-px bg-slate-200" />
                        <HeaderStat
                            label="Còn lại"
                            value={unansweredCount}
                            valueClassName="text-orange-500"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowSubmitConfirm(true)}
                        disabled={submitting}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        Nộp bài
                    </button>
                </div>

                <div className="h-1 bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-4 py-5 pb-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_330px]">
                <main className="min-w-0">
                    {error && (
                        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {currentQuestion && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-7">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                                        {currentIndex + 1}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900">
                                            Câu {currentIndex + 1}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-400">
                                            {currentQuestion.type === "multiple_choice"
                                                ? "Chọn tất cả đáp án đúng"
                                                : "Chọn 1 đáp án đúng"}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => toggleFlag(currentQuestion.id)}
                                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                        flaggedQuestions.has(currentQuestion.id)
                                            ? "border-orange-200 bg-orange-50 text-orange-600"
                                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    <Flag
                                        className="h-4 w-4"
                                        fill={
                                            flaggedQuestions.has(
                                                currentQuestion.id,
                                            )
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                    Đánh dấu
                                </button>
                            </div>

                            <div className="p-5 md:p-7">
                                <div className="mb-7 whitespace-pre-line text-[16px] font-bold leading-8 text-slate-900 md:text-[17px]">
                                    {currentQuestion.noiDung}
                                </div>

                                <div className="space-y-3">
                                    {options.map((option) => {
                                        const selected = (selectedAnswer ?? "")
                                            .split(",")
                                            .includes(option.key);

                                        return (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() =>
                                                    selectAnswer(currentQuestion, option.key)
                                                }
                                                className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
                                                    selected
                                                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                                                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition ${
                                                        selected
                                                            ? "border-blue-600 bg-blue-600 text-white"
                                                            : "border-slate-300 bg-white text-slate-700"
                                                    }`}
                                                >
                                                    {option.key}
                                                </span>
                                                <span className="flex-1 text-sm font-semibold leading-6 text-slate-700 md:text-[15px]">
                                                    {option.text}
                                                </span>
                                                {selected && (
                                                    <Check className="h-5 w-5 shrink-0 text-blue-600" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 md:px-7">
                                <button
                                    type="button"
                                    onClick={() =>
                                        goToQuestion(currentIndex - 1)
                                    }
                                    disabled={currentIndex === 0}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Câu trước
                                </button>

                                <div className="hidden text-sm font-semibold text-slate-400 sm:block">
                                    {currentIndex + 1}/{questions.length}
                                </div>

                                {currentIndex < questions.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToQuestion(currentIndex + 1)
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
                                    >
                                        Câu tiếp
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowSubmitConfirm(true)
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-600"
                                    >
                                        <Send className="h-4 w-4" />
                                        Nộp bài
                                    </button>
                                )}
                            </div>
                        </section>
                    )}
                </main>

                <aside className="lg:sticky lg:top-[93px] lg:self-start">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <h2 className="font-black text-slate-900">
                                Phiếu trả lời
                            </h2>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                                Chọn số câu để di chuyển nhanh
                            </p>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-5 gap-2.5">
                                {questions.map((question, index) => {
                                    const answered = Boolean(
                                        answers[question.id],
                                    );
                                    const flagged = flaggedQuestions.has(
                                        question.id,
                                    );
                                    const active = currentIndex === index;

                                    let buttonClass = answered
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-blue-300";

                                    if (active) {
                                        buttonClass +=
                                            " ring-2 ring-blue-300 ring-offset-2";
                                    }

                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => goToQuestion(index)}
                                            className={`relative aspect-square rounded-lg border text-xs font-black transition ${buttonClass}`}
                                        >
                                            {index + 1}
                                            {flagged && (
                                                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 space-y-2.5">
                                <Legend
                                    className="border-slate-300 bg-white"
                                    label="Chưa trả lời"
                                />
                                <Legend
                                    className="border-blue-600 bg-blue-600"
                                    label="Đã trả lời"
                                />
                                <Legend
                                    className="border-orange-500 bg-orange-500"
                                    label="Đánh dấu xem lại"
                                />
                            </div>

                            <div className="my-5 h-px bg-slate-100" />

                            <div className="grid grid-cols-2 gap-3">
                                <MiniStat
                                    value={answeredCount}
                                    label="Đã làm"
                                    className="bg-blue-50 text-blue-600"
                                />
                                <MiniStat
                                    value={unansweredCount}
                                    label="Chưa làm"
                                    className="bg-orange-50 text-orange-500"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowSubmitConfirm(true)}
                                disabled={submitting}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Nộp bài
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {showSubmitConfirm && (
                <ModalBackdrop>
                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowSubmitConfirm(false)
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <h2 className="mt-5 text-xl font-black text-slate-900">
                                Xác nhận nộp bài
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Bạn đã trả lời{" "}
                                <strong className="text-slate-800">
                                    {answeredCount}/{questions.length}
                                </strong>{" "}
                                câu hỏi.
                            </p>

                            {unansweredCount > 0 ? (
                                <div className="mt-4 flex gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                                    <p className="text-sm font-semibold leading-6 text-orange-700">
                                        Bạn còn {unansweredCount} câu chưa trả lời.
                                        Các câu bỏ trống sẽ được lưu vào lịch sử và
                                        tính là chưa đúng.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                                    Bạn đã hoàn thành tất cả câu hỏi.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-5">
                            <button
                                type="button"
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                            >
                                Tiếp tục làm
                            </button>
                            <button
                                type="button"
                                onClick={() => void submitPractice()}
                                disabled={submitting}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Nộp bài
                            </button>
                        </div>
                    </div>
                </ModalBackdrop>
            )}

            {showExitConfirm && (
                <ModalBackdrop>
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h2 className="mt-5 text-xl font-black text-slate-900">
                            Thoát khỏi bài luyện tập?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Bài chưa nộp nên các câu trả lời hiện tại chưa được
                            lưu vào lịch sử.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowExitConfirm(false)}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Ở lại
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
                            >
                                Thoát
                            </button>
                        </div>
                    </div>
                </ModalBackdrop>
            )}
        </div>
    );
}

function HeaderStat({
    label,
    value,
    valueClassName = "text-slate-800",
}: {
    label: string;
    value: number;
    valueClassName?: string;
}) {
    return (
        <div className="text-center">
            <div className="text-xs font-semibold text-slate-400">
                {label}
            </div>
            <div className={`font-black ${valueClassName}`}>{value}</div>
        </div>
    );
}

function MiniStat({
    value,
    label,
    className,
}: {
    value: number;
    label: string;
    className: string;
}) {
    return (
        <div className={`rounded-xl p-3 text-center ${className}`}>
            <div className="text-xl font-black">{value}</div>
            <div className="mt-1 text-[11px] font-bold text-slate-500">
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
        <div className="flex items-center gap-2.5">
            <div className={`h-4 w-4 rounded border ${className}`} />
            <span className="text-xs font-semibold text-slate-500">
                {label}
            </span>
        </div>
    );
}

function ModalBackdrop({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            {children}
        </div>
    );
}
