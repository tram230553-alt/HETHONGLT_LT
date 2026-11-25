import React, { useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    Trophy,
    Medal,
    Star,
    User,
    BookOpen,
    FileCheck2,
    Layers,
    School,
    GraduationCap,
    Filter,
} from "lucide-react";
import {
    getStudentLeaderboard,
    getMyStudentProfile,
    type StudentLeaderboardDto,
    type StudentApiDto,
} from "../../services/studentService";
import { getGrades, type GradeDto } from "../../services/gradeService";
import { getSubjects, type SubjectDto } from "../../services/subjectService";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

export type LeaderboardMode = "all" | "practice" | "exam";

export default function LeaderboardView({
    onClose,
    isEmbeddedTab = false,
}: {
    onClose?: () => void;
    isEmbeddedTab?: boolean;
}) {
    const [leaderboard, setLeaderboard] = useState<StudentLeaderboardDto[]>([]);
    const [grades, setGrades] = useState<GradeDto[]>([]);
    const [subjects, setSubjects] = useState<SubjectDto[]>([]);
    const [myProfile, setMyProfile] = useState<StudentApiDto | null>(null);

    // Bộ lọc:
    // 1. Hình thức: "all" (Tổng hợp), "practice" (Luyện tập), "exam" (Luyện thi)
    const [mode, setMode] = useState<LeaderboardMode>("all");
    // 2. Phạm vi: "" = Toàn trường, hoặc ID của Khối (Khối 10, Khối 11, Khối 12)
    const [selectedGradeId, setSelectedGradeId] = useState<string>("");
    // 3. Môn học: "" = Tất cả môn, hoặc ID của Môn học
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
    const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

    // Tải danh mục Khối, Môn học và Hồ sơ học sinh hiện tại
    useEffect(() => {
        let active = true;
        const loadMeta = async () => {
            const [gradeList, subjectList, profile] = await Promise.all([
                getGrades().catch(() => [] as GradeDto[]),
                getSubjects().catch(() => [] as SubjectDto[]),
                getMyStudentProfile().catch(() => null),
            ]);
            if (!active) return;

            const sortedGrades = [...gradeList].sort((a, b) =>
                a.tenKhoi.localeCompare(b.tenKhoi, "vi", { numeric: true })
            );
            // Chỉ hiển thị các môn có câu hỏi hoặc đề thi (hoặc toàn bộ nếu chưa có thống kê)
            const activeSubjects = subjectList.filter(
                (s) => (s.questionsCount ?? 0) > 0 || (s.examsCount ?? 0) > 0 || (s.topicsCount ?? 0) > 0
            );
            const finalSubjects = (activeSubjects.length > 0 ? activeSubjects : subjectList).sort((a, b) =>
                a.tenMH.localeCompare(b.tenMH, "vi")
            );

            setGrades(sortedGrades);
            setSubjects(finalSubjects);
            setMyProfile(profile);
        };
        void loadMeta();
        return () => {
            active = false;
        };
    }, []);

    // Tải dữ liệu bảng xếp hạng mỗi khi bộ lọc thay đổi
    const loadLeaderboard = async () => {
        try {
            setIsLoadingLeaderboard(true);
            setLeaderboardError(null);

            const data = await getStudentLeaderboard({
                gradeId: selectedGradeId || undefined,
                subjectId: selectedSubjectId || undefined,
                mode,
                limit: 100,
            });

            setLeaderboard(data);
        } catch (error) {
            console.error("Không thể tải leaderboard:", error);
            setLeaderboardError(
                error instanceof Error
                    ? error.message
                    : "Không thể tải bảng xếp hạng."
            );
        } finally {
            setIsLoadingLeaderboard(false);
        }
    };

    useEffect(() => {
        void loadLeaderboard();
    }, [mode, selectedGradeId, selectedSubjectId]);

    const rankings = useMemo(
        () =>
            leaderboard.map((student) => {
                const totalPractices = student.totalPractices ?? 0;
                const totalExams = student.totalExams ?? 0;
                const totalAttempts =
                    student.totalAttempts ?? totalPractices + totalExams;
                const accuracy =
                    student.totalQuestions > 0
                        ? Math.round(
                              (student.totalCorrectAnswers /
                                  student.totalQuestions) *
                                  100
                          )
                        : 0;

                return {
                    rank: student.rank,
                    name: student.studentName,
                    khoi: student.khoi,
                    gradeId: student.gradeId,
                    score: student.averageScore,
                    points: student.totalCorrectAnswers,
                    studentId: student.studentId,
                    totalExams,
                    totalPractices,
                    totalAttempts,
                    totalQuestions: student.totalQuestions,
                    totalCorrectAnswers: student.totalCorrectAnswers,
                    accuracy,
                };
            }),
        [leaderboard]
    );

    const rankingPagination = usePagination(rankings, 10);

    const selectedSubjectName = useMemo(() => {
        if (!selectedSubjectId) return "Tất cả môn học";
        return (
            subjects.find((s) => s.id === selectedSubjectId)?.tenMH ||
            "Môn học"
        );
    }, [selectedSubjectId, subjects]);

    const selectedGradeName = useMemo(() => {
        if (!selectedGradeId) return "Toàn trường";
        return (
            grades.find((g) => g.id === selectedGradeId)?.tenKhoi || "Theo khối"
        );
    }, [selectedGradeId, grades]);

    const modeTitle =
        mode === "practice"
            ? "Xếp hạng Luyện tập"
            : mode === "exam"
              ? "Xếp hạng Luyện thi"
              : "Xếp hạng Tổng hợp";

    const modeSubtitle =
        mode === "practice"
            ? "Tính theo điểm trung bình và số câu đúng các bài luyện tập chủ đề"
            : mode === "exam"
              ? "Tính theo điểm trung bình và số câu đúng các đề luyện thi"
              : "Kết hợp thành tích cả Luyện tập chủ đề và Luyện thi";

    return (
        <div
            className={
                isEmbeddedTab
                    ? "flex-1 flex flex-col h-full overflow-hidden bg-[var(--theme-bg)]"
                    : "absolute inset-0 bg-[var(--theme-surface-soft)] z-50 flex flex-col animate-fade-in overflow-hidden sm:rounded-[32px]"
            }
        >
            {/* HEADER (khi mở dạng modal từ trang Cá nhân) */}
            {!isEmbeddedTab && (
                <div className="h-14 border-b border-[var(--theme-border)] flex items-center px-4 shrink-0 bg-[var(--theme-surface)] z-10 relative">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 text-slate-400 hover:text-[var(--theme-text-muted)] transition"
                            type="button"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <span className="font-display font-bold text-[var(--theme-text)] text-sm flex-1 text-center pr-6">
                        Bảng Xếp Hạng
                    </span>
                </div>
            )}

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <div className="max-w-4xl mx-auto w-full">
                    {/* BANNER */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-[var(--theme-primary)] p-6 text-white text-center pb-12 rounded-b-[36px] shadow-sm">
                        <div className="relative inline-flex items-center justify-center">
                            <Trophy className="w-11 h-11 text-yellow-300 drop-shadow-md" />
                            <Star className="absolute -top-1 -right-3 w-4 h-4 text-yellow-200 fill-yellow-200" />
                        </div>

                        <h2 className="font-display font-extrabold text-xl mt-2">
                            Đấu Trường Trí Tuệ
                        </h2>

                        <p className="text-xs font-sans text-blue-100 mt-1 opacity-90">
                            Bảng vinh danh thành tích Luyện tập & Luyện thi theo môn học, khối lớp và toàn trường
                        </p>
                    </div>

                    {/* BỘ LỌC PHÂN LOẠI BẢNG XẾP HẠNG */}
                    <div className="px-4 sm:px-6 -mt-7">
                        <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-3xl shadow-sm p-4 space-y-4">
                            {/* 1. PHÂN LOẠI HÌNH THỨC: TỔNG HỢP / LUYỆN TẬP / LUYỆN THI */}
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                    1. Phân loại theo hình thức
                                </p>
                                <div className="grid grid-cols-3 gap-2 bg-slate-100/80 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setMode("all")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                                            mode === "all"
                                                ? "bg-[var(--theme-surface)] text-[var(--theme-primary)] shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        <Trophy className="w-3.5 h-3.5" />
                                        <span>Tổng hợp</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("practice")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                                            mode === "practice"
                                                ? "bg-[var(--theme-surface)] text-emerald-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Luyện tập</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("exam")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                                            mode === "exam"
                                                ? "bg-[var(--theme-surface)] text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        <FileCheck2 className="w-3.5 h-3.5" />
                                        <span>Luyện thi</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. PHẠM VI XẾP HẠNG: TOÀN TRƯỜNG & THEO KHỐI */}
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                    <School className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                    2. Phạm vi xếp hạng (Toàn trường & Theo khối)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedGradeId("")}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                                            selectedGradeId === ""
                                                ? "bg-[var(--theme-primary)] text-white border-[var(--theme-primary)] shadow-xs"
                                                : "bg-[var(--theme-surface)] text-slate-600 border-[var(--theme-border)] hover:border-blue-300"
                                        }`}
                                    >
                                        <School className="w-3.5 h-3.5" />
                                        <span>Toàn trường</span>
                                    </button>

                                    {myProfile?.gradeId && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedGradeId(
                                                    myProfile.gradeId!
                                                )
                                            }
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                                                selectedGradeId ===
                                                myProfile.gradeId
                                                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                                                    : "bg-amber-50/70 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            }`}
                                        >
                                            <GraduationCap className="w-3.5 h-3.5" />
                                            <span>
                                                Khối của tôi (
                                                {myProfile.tenKhoi || "Khối học"}
                                                )
                                            </span>
                                        </button>
                                    )}

                                    {grades.map((grade) => {
                                        const isActive =
                                            selectedGradeId === grade.id;
                                        return (
                                            <button
                                                key={grade.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedGradeId(grade.id)
                                                }
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                                                    isActive
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                        : "bg-[var(--theme-surface)] text-slate-600 border-[var(--theme-border)] hover:border-indigo-300"
                                                }`}
                                            >
                                                {grade.tenKhoi}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. PHÂN LOẠI THEO MÔN HỌC */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <Filter className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                        3. Phân loại theo môn học
                                    </p>
                                    <span className="text-[10px] font-bold text-[var(--theme-primary)]">
                                        Đang xem: {selectedSubjectName}
                                    </span>
                                </div>

                                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSubjectId("")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border whitespace-nowrap transition cursor-pointer shrink-0 ${
                                            selectedSubjectId === ""
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                : "bg-[var(--theme-surface)] text-slate-600 border-[var(--theme-border)] hover:border-emerald-300"
                                        }`}
                                    >
                                        Tất cả môn học
                                    </button>
                                    {subjects.map((sub) => {
                                        const isActive =
                                            selectedSubjectId === sub.id;
                                        return (
                                            <button
                                                key={sub.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedSubjectId(sub.id)
                                                }
                                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border whitespace-nowrap transition cursor-pointer shrink-0 ${
                                                    isActive
                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                        : "bg-[var(--theme-surface)] text-slate-600 border-[var(--theme-border)] hover:border-emerald-300"
                                                }`}
                                            >
                                                {sub.tenMH}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TÓM TẮT BỘ LỌC ĐANG CHỌN */}
                            <div className="pt-3 border-t border-[var(--theme-border)] flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <Trophy className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-display font-extrabold text-xs sm:text-sm text-[var(--theme-text)]">
                                            {modeTitle} · {selectedGradeName} ·{" "}
                                            {selectedSubjectName}
                                        </p>
                                        <p className="text-[10px] text-[var(--theme-text-light)]">
                                            {modeSubtitle}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                                    {rankings.length} học sinh
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* LOADING */}
                    {isLoadingLeaderboard && (
                        <div className="py-12 text-center">
                            <div className="animate-spin mx-auto w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full" />
                            <p className="mt-3 text-sm text-slate-500">
                                Đang tải bảng xếp hạng...
                            </p>
                        </div>
                    )}

                    {/* ERROR */}
                    {leaderboardError && (
                        <div className="px-4 sm:px-6 py-8">
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                                <p className="text-sm font-semibold text-red-500">
                                    {leaderboardError}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => void loadLeaderboard()}
                                    className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
                                >
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    )}

                    {/* EMPTY */}
                    {!isLoadingLeaderboard &&
                        !leaderboardError &&
                        rankings.length === 0 && (
                            <div className="px-4 sm:px-6 py-10 text-center">
                                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                                    <Medal className="w-7 h-7 text-slate-400" />
                                </div>
                                <p className="mt-4 font-semibold text-[var(--theme-text)]">
                                    Chưa có dữ liệu xếp hạng cho bộ lọc này
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Hãy hoàn thành bài{" "}
                                    {mode === "practice"
                                        ? "luyện tập chủ đề"
                                        : mode === "exam"
                                          ? "luyện thi"
                                          : "luyện tập hoặc đề thi"}{" "}
                                    ở phạm vi{" "}
                                    <b>
                                        {selectedGradeName} -{" "}
                                        {selectedSubjectName}
                                    </b>{" "}
                                    để ghi danh lên bảng vàng!
                                </p>
                            </div>
                        )}

                    {/* LEADERBOARD LIST */}
                    {!isLoadingLeaderboard &&
                        !leaderboardError &&
                        rankings.length > 0 && (
                            <div className="px-4 sm:px-6 mt-5 space-y-3">
                                {rankingPagination.pageItems.map((player) => {
                                    const isTopThree = player.rank <= 3;
                                    const isMe =
                                        myProfile?.id === player.studentId;

                                    return (
                                        <div
                                            key={player.studentId}
                                            className={`relative rounded-2xl p-4 border transition ${
                                                isMe
                                                    ? "bg-blue-50/40 border-blue-400 ring-1 ring-blue-300 shadow-sm"
                                                    : isTopThree
                                                      ? "bg-[var(--theme-surface)] border-amber-200/80 shadow-sm"
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
                                                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                                                        player.rank === 1
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : player.rank === 2
                                                              ? "bg-slate-100 text-slate-600"
                                                              : player.rank ===
                                                                  3
                                                                ? "bg-orange-100 text-orange-600"
                                                                : "bg-blue-50 text-blue-600"
                                                    }`}
                                                >
                                                    {player.name?.[0]?.toUpperCase() || (
                                                        <User className="w-5 h-5" />
                                                    )}
                                                </div>

                                                {/* STUDENT INFO */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="font-bold text-sm text-[var(--theme-text)] truncate">
                                                            {player.name}
                                                        </p>
                                                        {isMe && (
                                                            <span className="text-[9px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                                                Bạn
                                                            </span>
                                                        )}
                                                        {player.khoi && (
                                                            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                                {player.khoi}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-[11px] text-[var(--theme-text-light)] mt-1">
                                                        {mode === "practice"
                                                            ? `${player.totalPractices} lượt luyện tập chủ đề`
                                                            : mode === "exam"
                                                              ? `${player.totalExams} đề luyện thi`
                                                              : `${player.totalPractices} luyện tập · ${player.totalExams} đề thi`}
                                                    </p>
                                                </div>

                                                {/* SCORE */}
                                                <div className="text-right shrink-0">
                                                    <p className="font-display font-extrabold text-lg text-[var(--theme-text)]">
                                                        {player.score.toFixed(
                                                            2
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--theme-text-light)]">
                                                        điểm TB
                                                    </p>
                                                </div>
                                            </div>

                                            {/* STATS FOOTER */}
                                            <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-slate-400">
                                                <div>
                                                    <span className="font-bold text-slate-600">
                                                        {player.totalQuestions}
                                                    </span>{" "}
                                                    câu đã làm
                                                </div>

                                                <div>
                                                    <span className="font-bold text-emerald-600">
                                                        {
                                                            player.totalCorrectAnswers
                                                        }
                                                    </span>{" "}
                                                    câu đúng ({player.accuracy}
                                                    %)
                                                </div>

                                                <div>
                                                    <span className="font-bold text-amber-600">
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
        </div>
    );
}
