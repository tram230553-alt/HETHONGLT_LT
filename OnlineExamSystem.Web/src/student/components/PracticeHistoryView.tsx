import React from "react";
import {
    BookOpen,
    ChevronRight,
    History,
    Loader2,
    RefreshCw,
    Target,
} from "lucide-react";

import {
    practiceService,
    type PracticeAttemptDto,
} from "../../services/practiceService";

import PracticeResultView from "./PracticeResultView";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

export default function PracticeHistoryView() {
    const [attempts, setAttempts] =
        React.useState<PracticeAttemptDto[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedAttemptId, setSelectedAttemptId] =
        React.useState<string | null>(null);

    // Phân trang lịch sử luyện tập (đặt trước return sớm bên dưới).
    const attemptPagination = usePagination(attempts, 10);

    const loadAttempts = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await practiceService.getPracticeAttempts();
            setAttempts(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không tải được lịch sử luyện tập.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadAttempts();
    }, [loadAttempts]);

    if (selectedAttemptId) {
        return (
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <PracticeResultView
                    attemptId={selectedAttemptId}
                    onBack={() => setSelectedAttemptId(null)}
                />
            </div>
        );
    }

    const averageScore =
        attempts.length > 0
            ? attempts.reduce((sum, item) => sum + item.score, 0) /
              attempts.length
            : 0;

    const totalCorrect = attempts.reduce(
        (sum, item) => sum + item.correctAnswers,
        0,
    );

    const totalQuestions = attempts.reduce(
        (sum, item) => sum + item.totalQuestions,
        0,
    );

    return (
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-7 xl:px-10 no-scrollbar">
            <div className="mx-auto max-w-6xl space-y-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-extrabold text-[var(--theme-text)]">
                            Lịch sử luyện tập
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadAttempts()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E9EDF7] bg-white px-3 py-2 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Tải lại
                    </button>
                </div>

                {error && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-600">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <SummaryCard
                        icon={<History className="h-4 w-4" />}
                        label="Số lượt luyện"
                        value={String(attempts.length)}
                    />
                    <SummaryCard
                        icon={<Target className="h-4 w-4" />}
                        label="Điểm trung bình"
                        value={`${averageScore.toFixed(2)}/10`}
                    />
                    <SummaryCard
                        icon={<BookOpen className="h-4 w-4" />}
                        label="Tổng câu đúng"
                        value={`${totalCorrect}/${totalQuestions}`}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-14">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--theme-primary)]" />
                    </div>
                ) : attempts.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                        <h4 className="mt-4 font-extrabold text-slate-700">
                            Chưa có lịch sử luyện tập
                        </h4>
                        <p className="mt-1 text-xs text-slate-400">
                            Hãy hoàn thành ít nhất một Topic Practice.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {attemptPagination.pageItems.map((attempt) => {
                            const submittedAt = new Date(
                                attempt.submittedAt,
                            );

                            const submittedText = Number.isNaN(
                                submittedAt.getTime(),
                            )
                                ? attempt.submittedAt
                                : submittedAt.toLocaleString("vi-VN");

                            const unanswered = Math.max(
                                attempt.totalQuestions -
                                    attempt.answeredQuestions,
                                0,
                            );

                            return (
                                <button
                                    key={attempt.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedAttemptId(attempt.id)
                                    }
                                    className="group w-full rounded-3xl border border-[#E9EDF7] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                                                {attempt.subjectName} • Chương {attempt.chapterOrder} • Bài {String(
                                                    attempt.orderNum,
                                                ).padStart(2, "0")}
                                            </div>
                                            <h4 className="mt-1 truncate text-base font-black text-slate-900">
                                                {attempt.topicName}
                                            </h4>
                                            <p className="mt-1 text-[11px] font-medium text-slate-400">
                                                {submittedText}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            <div className="rounded-2xl bg-blue-50 px-4 py-2 text-center">
                                                <div className="text-lg font-black text-blue-600">
                                                    {attempt.score.toFixed(2)}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400">
                                                    điểm
                                                </div>
                                            </div>

                                            <div className="hidden min-w-[130px] text-xs font-semibold text-slate-500 sm:block">
                                                <div>
                                                    Đúng: {attempt.correctAnswers}/{attempt.totalQuestions}
                                                </div>
                                                <div className="mt-1">
                                                    Sai: {attempt.wrongAnswers} • Bỏ: {unanswered}
                                                </div>
                                            </div>

                                            <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        <Pagination
                            page={attemptPagination.page}
                            pageSize={attemptPagination.pageSize}
                            total={attemptPagination.total}
                            onPageChange={attemptPagination.setPage}
                            itemLabel="lượt luyện tập"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-3xl border border-[#E9EDF7] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
                {icon}
                <span className="text-[10px] font-bold uppercase">
                    {label}
                </span>
            </div>
            <div className="mt-2 text-lg font-black text-slate-800">
                {value}
            </div>
        </div>
    );
}
