import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronDown, X, BookOpen } from "lucide-react";
import {
    getStudentLeaderboard,
    getMyStudentProfile,
    type StudentLeaderboardDto,
    type StudentApiDto,
} from "../../services/studentService";
import { getGrades, type GradeDto } from "../../services/gradeService";
import { getSubjects, type SubjectDto } from "../../services/subjectService";
import { topicService, type TopicDto } from "../../services/topicService";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

export type LeaderboardMode = "all" | "practice" | "exam";

function MedalRibbon({
    rank,
    size = "md",
}: {
    rank: 1 | 2 | 3;
    size?: "sm" | "md" | "lg";
}) {
    const config = {
        1: {
            circleFill: "#FACC15",
            circleStroke: "#EAB308",
            ribbonLeft: "#EAB308",
            ribbonRight: "#CA8A04",
            textFill: "#78350F",
        },
        2: {
            circleFill: "#E2E8F0",
            circleStroke: "#94A3B8",
            ribbonLeft: "#94A3B8",
            ribbonRight: "#64748B",
            textFill: "#1E293B",
        },
        3: {
            circleFill: "#FDBA74",
            circleStroke: "#EA580C",
            ribbonLeft: "#EA580C",
            ribbonRight: "#C2410C",
            textFill: "#7C2D12",
        },
    }[rank];

    const dims =
        size === "lg"
            ? { w: 38, h: 48, r: 15 }
            : size === "md"
              ? { w: 32, h: 40, r: 14 }
              : { w: 26, h: 32, r: 12 };

    return (
        <svg
            width={dims.w}
            height={dims.h}
            viewBox="0 0 36 46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
        >
            {/* Left ribbon tail */}
            <path
                d="M12 20L6 44L12 40L16 44L15 20H12Z"
                fill={config.ribbonLeft}
            />
            {/* Right ribbon tail */}
            <path
                d="M24 20L30 44L24 40L20 44L21 20H24Z"
                fill={config.ribbonRight}
            />
            {/* Main rosette circle */}
            <circle
                cx="18"
                cy="17"
                r={dims.r}
                fill={config.circleFill}
                stroke={config.circleStroke}
                strokeWidth="1.5"
            />
            {/* Decorative dashed ring */}
            <circle
                cx="18"
                cy="17"
                r={dims.r - 2.5}
                stroke={config.circleStroke}
                strokeWidth="0.8"
                strokeDasharray="2 2"
                fill="none"
                opacity="0.6"
            />
            {/* Rank number */}
            <text
                x="18"
                y="22"
                textAnchor="middle"
                fill={config.textFill}
                fontSize="14"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
            >
                {rank}
            </text>
        </svg>
    );
}

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

    const [mode, setMode] = useState<LeaderboardMode>("all");
    const [selectedGradeId, setSelectedGradeId] = useState<string>("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
    const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const loadMeta = async () => {
            const [gradeList, subjectList, topicList, profile] = await Promise.all([
                getGrades().catch(() => [] as GradeDto[]),
                getSubjects().catch(() => [] as SubjectDto[]),
                topicService.getStudentTopics().catch(() => [] as TopicDto[]),
                getMyStudentProfile().catch(() => null),
            ]);
            if (!active) return;

            const sortedGrades = [...gradeList].sort((a, b) =>
                a.tenKhoi.localeCompare(b.tenKhoi, "vi", { numeric: true })
            );

            // Hợp nhất danh sách môn học từ cả 2 nguồn (getSubjects API và Topics)
            const subjectMap = new Map<string, SubjectDto>();
            subjectList.forEach((s) => {
                if (s.id && s.tenMH) {
                    subjectMap.set(s.id, s);
                }
            });
            topicList.forEach((t) => {
                if (t.subjectId && t.subjectName && !subjectMap.has(t.subjectId)) {
                    subjectMap.set(t.subjectId, {
                        id: t.subjectId,
                        tenMH: t.subjectName,
                        chaptersCount: 0,
                        topicsCount: 0,
                        questionsCount: t.questionCount || 1,
                        examsCount: 0,
                        studentsCount: 0,
                    });
                }
            });

            const mergedSubjects = Array.from(subjectMap.values()).sort((a, b) =>
                a.tenMH.localeCompare(b.tenMH, "vi")
            );

            setGrades(sortedGrades);
            setSubjects(mergedSubjects);
            setMyProfile(profile);
        };
        void loadMeta();
        return () => {
            active = false;
        };
    }, []);

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
            subjects.find((s) => s.id === selectedSubjectId)?.tenMH || "Môn học"
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
            ? "Xếp hạng luyện tập"
            : mode === "exam"
              ? "Xếp hạng luyện thi"
              : "Xếp hạng tổng hợp";

    const modeSubtitle =
        mode === "practice"
            ? "Tính theo thành tích Luyện tập chủ đề"
            : mode === "exam"
              ? "Tính theo thành tích các đề Luyện thi"
              : "Kết hợp thành tích cả Luyện tập chủ đề và Luyện thi";

    return (
        <div
            className={
                isEmbeddedTab
                    ? "flex-1 flex flex-col h-full overflow-hidden bg-[#F6F4FB]"
                    : "absolute inset-0 bg-[#F6F4FB] z-50 flex flex-col animate-fade-in overflow-hidden sm:rounded-[32px]"
            }
        >
            {/* HEADER (khi mở dạng modal từ trang Cá nhân) */}
            {!isEmbeddedTab && (
                <div className="h-14 border-b border-[var(--theme-border)] flex items-center px-4 shrink-0 bg-[var(--theme-surface)] z-10 relative">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 text-slate-400 hover:text-[var(--theme-text-muted)] transition cursor-pointer"
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
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 md:px-8 py-6 pb-20">
                <div className="max-w-5xl mx-auto w-full space-y-5">
                    {/* TOP BREADCRUMB */}
                    <div className="text-xs text-slate-400 font-medium px-1">
                        Đấu Trường Trí Tuệ · Giao diện tinh gọn
                    </div>

                    {/* TOP BANNER CARD: BẢNG VINH DANH */}
                    <div className="bg-[#FAF7FD] border border-purple-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            {/* Left Text */}
                            <div>
                                <span className="text-[11px] font-black tracking-widest text-[#C026D3] uppercase">
                                    BẢNG VINH DANH
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-black text-[#6B21A8] mt-1 tracking-tight">
                                    Đấu Trường Trí Tuệ
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-xl leading-relaxed">
                                    Bảng vinh danh thành tích Luyện tập &amp; Luyện thi theo môn học, khối lớp và toàn trường
                                </p>
                            </div>

                            {/* Right Medals */}
                            <div className="flex items-center gap-5 sm:gap-7 self-start md:self-center shrink-0 pt-2 md:pt-0">
                                <div className="flex flex-col items-center">
                                    <MedalRibbon rank={1} size="lg" />
                                    <span className="mt-1.5 text-[11px] font-bold text-amber-900">
                                        Top 1 · Vàng
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <MedalRibbon rank={2} size="lg" />
                                    <span className="mt-1.5 text-[11px] font-bold text-slate-600">
                                        Top 2 · Bạc
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <MedalRibbon rank={3} size="lg" />
                                    <span className="mt-1.5 text-[11px] font-bold text-amber-900">
                                        Top 3 · Đồng
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 1: BỘ LỌC */}
                    <div className="bg-[var(--theme-surface)] border border-slate-200/70 rounded-3xl shadow-xs p-5 sm:p-6">
                        {/* Segmented Tabs: Tổng hợp / Luyện tập / Luyện thi */}
                        <div className="grid grid-cols-3 bg-[#F3F1F6] p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setMode("all")}
                                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm transition cursor-pointer ${
                                    mode === "all"
                                        ? "bg-white text-[#7C3AED] font-semibold shadow-xs"
                                        : "text-slate-500 hover:text-slate-800 font-medium"
                                }`}
                            >
                                Tổng hợp
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("practice")}
                                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm transition cursor-pointer ${
                                    mode === "practice"
                                        ? "bg-white text-[#7C3AED] font-semibold shadow-xs"
                                        : "text-slate-500 hover:text-slate-800 font-medium"
                                }`}
                            >
                                Luyện tập
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("exam")}
                                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm transition cursor-pointer ${
                                    mode === "exam"
                                        ? "bg-white text-[#7C3AED] font-semibold shadow-xs"
                                        : "text-slate-500 hover:text-slate-800 font-medium"
                                }`}
                            >
                                Luyện thi
                            </button>
                        </div>

                        <div className="border-t border-slate-100 my-5" />

                        {/* 2 Dropdowns: Phạm vi xếp hạng & Môn học */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Phạm vi xếp hạng */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">
                                    Phạm vi xếp hạng
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedGradeId}
                                        onChange={(e) =>
                                            setSelectedGradeId(e.target.value)
                                        }
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-800 focus:border-[#7C3AED] focus:outline-none transition cursor-pointer"
                                    >
                                        <option value="">Toàn trường</option>
                                        {grades.map((grade) => (
                                            <option
                                                key={grade.id}
                                                value={grade.id}
                                            >
                                                {grade.tenKhoi}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                                </div>

                                {myProfile?.gradeId ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedGradeId(
                                                selectedGradeId ===
                                                    myProfile.gradeId
                                                    ? ""
                                                    : myProfile.gradeId!
                                            )
                                        }
                                        className="mt-2.5 inline-block text-xs font-medium text-[#7C3AED] hover:underline cursor-pointer"
                                    >
                                        {selectedGradeId === myProfile.gradeId
                                            ? "Chọn nhanh: Xem Toàn trường"
                                            : `Chọn nhanh: Khối của tôi (${myProfile.tenKhoi || "Khối 11"})`}
                                    </button>
                                ) : (
                                    grades[0] && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedGradeId(grades[0].id)
                                            }
                                            className="mt-2.5 inline-block text-xs font-medium text-[#7C3AED] hover:underline cursor-pointer"
                                        >
                                            Chọn nhanh: Khối của tôi (
                                            {grades[0].tenKhoi})
                                        </button>
                                    )
                                )}
                            </div>

                            {/* Môn học */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">
                                    Môn học
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedSubjectId}
                                        onChange={(e) =>
                                            setSelectedSubjectId(e.target.value)
                                        }
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-800 focus:border-[#7C3AED] focus:outline-none transition cursor-pointer"
                                    >
                                        <option value="">Tất cả môn học</option>
                                        {subjects.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.tenMH}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                                </div>

                                <p className="mt-2.5 text-xs text-slate-400">
                                    {selectedSubjectId
                                        ? `Đang lọc kết quả môn ${selectedSubjectName}`
                                        : "Bao gồm tất cả các môn học"}
                                </p>
                            </div>
                        </div>

                        
                    </div>

                    {/* CARD 2: BẢNG XẾP HẠNG */}
                    <div className="bg-[var(--theme-surface)] border border-slate-200/70 rounded-3xl shadow-xs p-5 sm:p-6">
                        {/* Header Card 2 */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                        {selectedSubjectId ? `Xếp hạng môn ${selectedSubjectName}` : modeTitle}
                                    </h2>
                                    {selectedSubjectId && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSubjectId("")}
                                            className="inline-flex items-center gap-1 bg-purple-100/80 text-[#7C3AED] hover:bg-purple-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-full transition cursor-pointer"
                                            title="Bỏ lọc môn, xem tất cả môn"
                                        >
                                            <span>Môn: {selectedSubjectName}</span>
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    {selectedGradeName} &nbsp;·&nbsp;{" "}
                                    {selectedSubjectName}
                                </p>
                            </div>

                            <span className="inline-flex items-center rounded-full bg-[#F3E8FF] px-3.5 py-1.5 text-xs font-semibold text-[#7C3AED] shrink-0 self-start sm:self-auto">
                                {rankings.length} học sinh
                            </span>
                        </div>

                        {/* Loading */}
                        {isLoadingLeaderboard && (
                            <div className="py-12 text-center">
                                <div className="animate-spin mx-auto w-7 h-7 border-2 border-purple-200 border-t-[#7C3AED] rounded-full" />
                                <p className="mt-3 text-xs text-slate-500">
                                    Đang tải bảng xếp hạng {selectedSubjectId ? `môn ${selectedSubjectName}` : ""}...
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {leaderboardError && (
                            <div className="py-8">
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                                    <p className="text-sm font-semibold text-red-500">
                                        {leaderboardError}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void loadLeaderboard()}
                                        className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Empty */}
                        {!isLoadingLeaderboard &&
                            !leaderboardError &&
                            rankings.length === 0 && (
                                <div className="py-12 text-center border-y border-slate-100">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Chưa có dữ liệu xếp hạng
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Chưa có học sinh nào hoàn thành bài ở bộ
                                        lọc{" "}
                                        <b>
                                            {selectedGradeName} ·{" "}
                                            {selectedSubjectName}
                                        </b>
                                        .
                                    </p>
                                    {selectedSubjectId && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSubjectId("")}
                                            className="mt-3.5 inline-block px-4 py-2 rounded-xl bg-purple-50 text-[#7C3AED] hover:bg-purple-100 text-xs font-semibold transition cursor-pointer"
                                        >
                                            Xem bảng xếp hạng Tất cả các môn
                                        </button>
                                    )}
                                </div>
                            )}

                        {/* Table */}
                        {!isLoadingLeaderboard &&
                            !leaderboardError &&
                            rankings.length > 0 && (
                                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                                    <table className="w-full min-w-[640px] border-collapse">
                                        <thead>
                                            <tr className="bg-[#F8F6FC] text-left text-xs font-medium text-slate-500">
                                                <th className="py-3 pl-3 pr-2 w-16 font-medium">
                                                    Hạng
                                                </th>
                                                <th className="py-3 px-3 font-medium">
                                                    Học sinh
                                                </th>
                                                <th className="py-3 px-3 w-28 font-medium"></th>
                                                <th className="py-3 px-3 w-28 font-medium">
                                                    Câu đã làm
                                                </th>
                                                <th className="py-3 px-3 w-32 font-medium">
                                                    Câu đúng
                                                </th>
                                                <th className="py-3 px-3 w-32 font-medium">
                                                    Điểm tích lũy
                                                </th>
                                                <th className="py-3 pl-3 pr-3 w-24 text-right font-medium">
                                                    Điểm TB
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rankingPagination.pageItems.map(
                                                (player) => {
                                                    const isTop1 =
                                                        player.rank === 1;
                                                    const isTop2 =
                                                        player.rank === 2;
                                                    const isTop3 =
                                                        player.rank === 3;
                                                    const isMe =
                                                        myProfile?.id ===
                                                        player.studentId;

                                                    return (
                                                        <tr
                                                            key={
                                                                player.studentId
                                                            }
                                                            className={`transition-colors ${
                                                                isTop1
                                                                    ? "bg-[#FEFCE8]/50 hover:bg-[#FEFCE8]/70"
                                                                    : isMe
                                                                      ? "bg-purple-50/40 hover:bg-purple-50/60"
                                                                      : "bg-white hover:bg-slate-50/60"
                                                            }`}
                                                        >
                                                            {/* Hạng */}
                                                            <td className="py-4 pl-3 pr-2 align-middle">
                                                                {isTop1 ? (
                                                                    <MedalRibbon
                                                                        rank={1}
                                                                        size="md"
                                                                    />
                                                                ) : isTop2 ? (
                                                                    <MedalRibbon
                                                                        rank={2}
                                                                        size="md"
                                                                    />
                                                                ) : isTop3 ? (
                                                                    <MedalRibbon
                                                                        rank={3}
                                                                        size="md"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold bg-slate-100 text-slate-600">
                                                                        {
                                                                            player.rank
                                                                        }
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Học sinh */}
                                                            <td className="py-4 px-3 align-middle">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-sm text-slate-900">
                                                                        {
                                                                            player.name
                                                                        }
                                                                    </span>
                                                                    {isMe && (
                                                                        <span className="text-[10px] font-semibold bg-[#F3E8FF] text-[#7C3AED] px-2 py-0.5 rounded-md">
                                                                            Bạn
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-400 mt-0.5">
                                                                    {mode ===
                                                                    "practice"
                                                                        ? `${player.totalPractices} luyện tập`
                                                                        : mode ===
                                                                              "exam"
                                                                          ? `${player.totalExams} đề thi`
                                                                          : `${player.totalPractices} luyện tập · ${player.totalExams} đề thi`}
                                                                </p>
                                                            </td>

                                                            {/* Khối */}
                                                            <td className="py-4 px-3 align-middle">
                                                                {player.khoi && (
                                                                    <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-md">
                                                                        {
                                                                            player.khoi
                                                                        }
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Câu đã làm */}
                                                            <td className="py-4 px-3 align-middle text-sm font-medium text-slate-800">
                                                                {
                                                                    player.totalQuestions
                                                                }
                                                            </td>

                                                            {/* Câu đúng */}
                                                            <td className="py-4 px-3 align-middle text-sm font-medium text-emerald-600">
                                                                {
                                                                    player.totalCorrectAnswers
                                                                }{" "}
                                                                (
                                                                {
                                                                    player.accuracy
                                                                }
                                                                %)
                                                            </td>

                                                            {/* Điểm tích lũy */}
                                                            <td className="py-4 px-3 align-middle text-sm font-medium text-slate-800">
                                                                {player.points}
                                                            </td>

                                                            {/* Điểm TB */}
                                                            <td className="py-4 pl-3 pr-3 align-middle text-right">
                                                                <span
                                                                    className={`text-lg sm:text-xl font-bold ${
                                                                        isTop1
                                                                            ? "text-[#7C3AED]"
                                                                            : "text-slate-900"
                                                                    }`}
                                                                >
                                                                    {player.score.toFixed(
                                                                        2
                                                                    )}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        {/* Footer caption & pagination */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-xs text-slate-400">
                                {modeSubtitle}
                            </p>
                            {rankings.length > rankingPagination.pageSize && (
                                <Pagination
                                    page={rankingPagination.page}
                                    pageSize={rankingPagination.pageSize}
                                    total={rankingPagination.total}
                                    onPageChange={rankingPagination.setPage}
                                    itemLabel="học sinh"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
