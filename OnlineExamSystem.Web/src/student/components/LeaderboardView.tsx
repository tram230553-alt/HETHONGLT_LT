import React, {
    useEffect,
    useState,
} from "react";

import {
    ChevronLeft,
    Trophy,
    Medal,
    Star,
    User,
} from "lucide-react";

import {
    getStudentLeaderboard,
    type StudentLeaderboardDto,
} from "../../services/studentService";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";


export default function LeaderboardView({
    onClose,
}: {
    onClose: () => void;
}) {

    // ==========================================
    // LEADERBOARD
    // ==========================================

    const [leaderboard, setLeaderboard] =
        useState<StudentLeaderboardDto[]>([]);

    const [
        isLoadingLeaderboard,
        setIsLoadingLeaderboard,
    ] = useState(false);

    const [
        leaderboardError,
        setLeaderboardError,
    ] = useState<string | null>(null);


    // ==========================================
    // LOAD LEADERBOARD
    // ==========================================

    const loadLeaderboard = async () => {
        try {
            setIsLoadingLeaderboard(true);
            setLeaderboardError(null);

            const data =
                await getStudentLeaderboard({
                    limit: 50,
                });

            setLeaderboard(data);

        } catch (error) {

            console.error(
                "Không thể tải leaderboard:",
                error
            );

            setLeaderboardError(
                error instanceof Error
                    ? error.message
                    : "Không thể tải bảng xếp hạng."
            );

        } finally {

            setIsLoadingLeaderboard(false);

        }
    };


    // ==========================================
    // LOAD KHI MỞ TRANG
    // ==========================================

    useEffect(() => {
        void loadLeaderboard();
    }, []);


    // ==========================================
    // MAP BACKEND DATA → UI
    // ==========================================

    const rankings = leaderboard.map(
        (student) => ({
            rank: student.rank,
            name: student.studentName,
            score: student.averageScore,
            points: student.totalCorrectAnswers,

            studentId: student.studentId,

            totalExams:
                student.totalExams,

            totalQuestions:
                student.totalQuestions,

            totalCorrectAnswers:
                student.totalCorrectAnswers,
        })
    );


    // Phân trang bảng xếp hạng (giữ nguyên hạng thật của từng học sinh).
    const rankingPagination = usePagination(rankings, 10);

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="absolute inset-0 bg-[var(--theme-surface-soft)] z-50 flex flex-col animate-fade-in overflow-hidden sm:rounded-[32px]">

            {/* ==================================
                HEADER
            ================================== */}

            <div className="h-14 border-b border-[var(--theme-border)] flex items-center px-4 shrink-0 bg-[var(--theme-surface)] z-10 relative">

                <button
                    onClick={onClose}
                    className="p-2 -ml-2 text-slate-400 hover:text-[var(--theme-text-muted)] transition"
                    type="button"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="font-display font-bold text-[var(--theme-text)] text-sm flex-1 text-center pr-6">
                    Bảng Xếp Hạng
                </span>

            </div>


            {/* ==================================
                CONTENT
            ================================== */}

            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">

                {/* ==================================
                    BANNER
                ================================== */}

                <div className="bg-gradient-to-r from-blue-600 to-[var(--theme-primary)] p-6 text-white text-center pb-10 rounded-b-[40px] shadow-sm">

                    <div className="relative inline-flex items-center justify-center">

                        <Trophy className="w-12 h-12 text-yellow-300 drop-shadow-md" />

                        <Star className="absolute -top-1 -right-3 w-4 h-4 text-yellow-200 fill-yellow-200" />

                    </div>

                    <h2 className="font-display font-extrabold text-xl mt-2">
                        Đấu Trường Trí Tuệ
                    </h2>

                    <p className="text-xs font-sans text-blue-100 mt-1 opacity-90">
                        Cố gắng hết mình để đạt vị trí cao nhất!
                    </p>

                </div>


                {/* ==================================
                    TITLE
                ================================== */}

                <div className="px-5 -mt-6">

                    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl shadow-sm px-4 py-3">

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">

                                <Trophy
                                    className="w-5 h-5 text-blue-600"
                                />

                            </div>

                            <div>

                                <p className="font-display font-extrabold text-sm text-[var(--theme-text)]">
                                    Xếp hạng học sinh
                                </p>

                                <p className="text-[11px] text-[var(--theme-text-light)] mt-0.5">
                                    Dựa trên điểm trung bình các bài thi
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ==================================
                    LOADING
                ================================== */}

                {isLoadingLeaderboard && (

                    <div className="py-12 text-center">

                        <div className="animate-spin mx-auto w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full" />

                        <p className="mt-3 text-sm text-slate-500">
                            Đang tải bảng xếp hạng...
                        </p>

                    </div>

                )}


                {/* ==================================
                    ERROR
                ================================== */}

                {leaderboardError && (

                    <div className="px-5 py-8">

                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">

                            <p className="text-sm font-semibold text-red-500">
                                {leaderboardError}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    void loadLeaderboard()
                                }
                                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
                            >
                                Thử lại
                            </button>

                        </div>

                    </div>

                )}


                {/* ==================================
                    EMPTY
                ================================== */}

                {!isLoadingLeaderboard &&
                    !leaderboardError &&
                    rankings.length === 0 && (

                        <div className="px-5 py-10 text-center">

                            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">

                                <Medal className="w-7 h-7 text-slate-400" />

                            </div>

                            <p className="mt-4 font-semibold text-[var(--theme-text)]">
                                Chưa có dữ liệu xếp hạng
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Hãy hoàn thành bài thi để xuất hiện trên bảng xếp hạng.
                            </p>

                        </div>

                    )}


                {/* ==================================
                    LEADERBOARD LIST
                ================================== */}

                {!isLoadingLeaderboard &&
                    !leaderboardError &&
                    rankings.length > 0 && (

                        <div className="px-5 mt-5 space-y-3">

                            {rankingPagination.pageItems.map((player) => {

                                const isTopThree =
                                    player.rank <= 3;

                                return (
                                    <div
                                        key={player.studentId}
                                        className={`relative rounded-2xl p-4 border transition ${isTopThree
                                                ? "bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-sm"
                                                : "bg-[var(--theme-surface)] border-[var(--theme-border)]"
                                            }`}
                                    >

                                        <div className="flex items-center gap-3">

                                            {/* RANK */}

                                            <div className="w-9 shrink-0 text-center">

                                                {player.rank === 1 && (
                                                    <div className="flex flex-col items-center">
                                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                                        <span className="text-[10px] font-black text-yellow-600 mt-0.5">
                                                            #1
                                                        </span>
                                                    </div>
                                                )}

                                                {player.rank === 2 && (
                                                    <div className="flex flex-col items-center">
                                                        <Medal className="w-5 h-5 text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-500 mt-0.5">
                                                            #2
                                                        </span>
                                                    </div>
                                                )}

                                                {player.rank === 3 && (
                                                    <div className="flex flex-col items-center">
                                                        <Medal className="w-5 h-5 text-orange-400" />
                                                        <span className="text-[10px] font-black text-orange-500 mt-0.5">
                                                            #3
                                                        </span>
                                                    </div>
                                                )}

                                                {player.rank > 3 && (
                                                    <span className="text-sm font-black text-slate-400">
                                                        #{player.rank}
                                                    </span>
                                                )}

                                            </div>


                                            {/* AVATAR */}

                                            <div
                                                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${player.rank === 1
                                                        ? "bg-yellow-100 text-yellow-600"
                                                        : player.rank === 2
                                                            ? "bg-slate-100 text-slate-500"
                                                            : player.rank === 3
                                                                ? "bg-orange-100 text-orange-500"
                                                                : "bg-blue-50 text-blue-500"
                                                    }`}
                                            >

                                                <User className="w-5 h-5" />

                                            </div>


                                            {/* STUDENT */}

                                            <div className="flex-1 min-w-0">

                                                <p className="font-bold text-sm text-[var(--theme-text)] truncate">
                                                    {player.name}
                                                </p>

                                                <p className="text-[11px] text-[var(--theme-text-light)] mt-1">
                                                    {player.totalExams} bài thi
                                                </p>

                                            </div>


                                            {/* SCORE */}

                                            <div className="text-right shrink-0">

                                                <p className="font-display font-extrabold text-lg text-[var(--theme-text)]">
                                                    {player.score.toFixed(2)}
                                                </p>

                                                <p className="text-[10px] text-[var(--theme-text-light)]">
                                                    điểm TB
                                                </p>

                                            </div>

                                        </div>


                                        {/* STATS */}

                                        <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between">

                                            <div className="text-[10px] text-slate-400">
                                                <span className="font-semibold text-slate-500">
                                                    {player.totalQuestions}
                                                </span>{" "}
                                                câu hỏi
                                            </div>

                                            <div className="text-[10px] text-slate-400">
                                                <span className="font-semibold text-slate-500">
                                                    {player.totalCorrectAnswers}
                                                </span>{" "}
                                                câu đúng
                                            </div>

                                            <div className="text-[10px] text-slate-400">
                                                <span className="font-semibold text-slate-500">
                                                    {player.points}
                                                </span>{" "}
                                                điểm tích lũy
                                            </div>

                                        </div>

                                    </div>
                                );
                            })}

                            <Pagination
                                page={rankingPagination.page}
                                pageSize={rankingPagination.pageSize}
                                total={rankingPagination.total}
                                onPageChange={rankingPagination.setPage}
                                itemLabel="học sinh"
                            />

                        </div>

                    )}

            </div>

        </div>
    );
}