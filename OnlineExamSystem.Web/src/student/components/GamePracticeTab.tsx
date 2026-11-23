import React, { useState, useEffect, useMemo } from "react";
import {
    ArrowLeft,
    Gamepad2,
    Sparkles,
    Search,
    BookOpen,
    Trophy,
    ChevronRight,
    Star,
    Layers,
    Atom,
    FlaskConical,
    Landmark,
    Sigma,
    GraduationCap,
    Lightbulb,
    HelpCircle,
    Play,
    Flame,
} from "lucide-react";
import { topicService, type TopicDto } from "../../services/topicService";
import { getSubjects } from "../../services/subjectService";

/* =========================================================
   PROPS
========================================================= */

interface GamePracticeTabProps {
    onSelectWordGame: (topic: TopicDto) => void;
}

/* =========================================================
   TYPES & HELPERS
========================================================= */

interface SubjectOption {
    id: string;
    name: string;
    topicCount: number;
    icon: typeof GraduationCap;
    gradient: string;
    badgeColor: string;
}

const getSubjectIconAndStyle = (subjectName: string, index: number) => {
    const name = (subjectName || "").toLowerCase();
    if (name.includes("toán") || name.includes("math")) {
        return {
            icon: Sigma,
            gradient: "from-blue-500/10 via-cyan-500/5 to-white border-blue-200/80 hover:border-blue-400",
            badgeColor: "bg-blue-100 text-blue-700",
            iconBg: "bg-blue-500 text-white",
        };
    }
    if (name.includes("hóa") || name.includes("hoá") || name.includes("sinh")) {
        return {
            icon: FlaskConical,
            gradient: "from-emerald-500/10 via-teal-500/5 to-white border-emerald-200/80 hover:border-emerald-400",
            badgeColor: "bg-emerald-100 text-emerald-700",
            iconBg: "bg-emerald-500 text-white",
        };
    }
    if (name.includes("lý") || name.includes("lí") || name.includes("vật")) {
        return {
            icon: Atom,
            gradient: "from-purple-500/10 via-indigo-500/5 to-white border-purple-200/80 hover:border-purple-400",
            badgeColor: "bg-purple-100 text-purple-700",
            iconBg: "bg-purple-500 text-white",
        };
    }
    if (name.includes("sử") || name.includes("địa")) {
        return {
            icon: Landmark,
            gradient: "from-amber-500/10 via-orange-500/5 to-white border-amber-200/80 hover:border-amber-400",
            badgeColor: "bg-amber-100 text-amber-700",
            iconBg: "bg-amber-500 text-white",
        };
    }
    const defaultStyles = [
        {
            gradient: "from-rose-500/10 via-pink-500/5 to-white border-rose-200/80 hover:border-rose-400",
            badgeColor: "bg-rose-100 text-rose-700",
            iconBg: "bg-rose-500 text-white",
        },
        {
            gradient: "from-indigo-500/10 via-blue-500/5 to-white border-indigo-200/80 hover:border-indigo-400",
            badgeColor: "bg-indigo-100 text-indigo-700",
            iconBg: "bg-indigo-500 text-white",
        },
    ];
    const picked = defaultStyles[index % defaultStyles.length];
    return {
        icon: GraduationCap,
        ...picked,
    };
};

/* =========================================================
   COMPONENT
========================================================= */

export default function GamePracticeTab({ onSelectWordGame }: GamePracticeTabProps) {
    const [topics, setTopics] = useState<TopicDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                const data = await topicService.getStudentTopics();
                if (mounted) {
                    setTopics(data);
                }
            } catch (err) {
                console.error("LOAD GAME TOPICS ERROR:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, []);

    // Nhóm danh sách các môn học
    const subjects = useMemo<SubjectOption[]>(() => {
        const map = new Map<string, { id: string; name: string; count: number }>();
        topics.forEach((t) => {
            if (!t.subjectId) return;
            const existing = map.get(t.subjectId);
            if (existing) {
                existing.count += 1;
            } else {
                map.set(t.subjectId, {
                    id: t.subjectId,
                    name: t.subjectName || "Môn học",
                    count: 1,
                });
            }
        });

        return Array.from(map.values()).map((item, index) => {
            const style = getSubjectIconAndStyle(item.name, index);
            return {
                id: item.id,
                name: item.name,
                topicCount: item.count,
                icon: style.icon,
                gradient: style.gradient,
                badgeColor: style.badgeColor,
            };
        });
    }, [topics]);

    // Các chủ đề của môn học đang chọn
    const activeSubject = useMemo(() => {
        return subjects.find((s) => s.id === selectedSubjectId);
    }, [subjects, selectedSubjectId]);

    const activeTopics = useMemo(() => {
        if (!selectedSubjectId) return [];
        return topics.filter((t) => t.subjectId === selectedSubjectId);
    }, [topics, selectedSubjectId]);

    const filteredTopics = useMemo(() => {
        if (!search.trim()) return activeTopics;
        const q = search.toLowerCase();
        return activeTopics.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                (t.chapterName && t.chapterName.toLowerCase().includes(q)),
        );
    }, [activeTopics, search]);

    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center p-6 bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                    <p className="text-sm font-bold text-slate-600">Đang tải danh sách game luyện tập...</p>
                </div>
            </div>
        );
    }

    /* =========================================================
       PAGE 1: CHỌN MÔN HỌC LUYỆN TẬP
    ========================================================= */
    if (!selectedSubjectId) {
        return (
            <div className="h-full min-h-0 overflow-y-auto no-scrollbar bg-gradient-to-b from-amber-50/40 via-white to-slate-50/60 p-4 md:p-8">
                <div className="mx-auto max-w-5xl">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-6 md:p-8 text-white shadow-lg mb-8">
                        <div className="relative z-10 max-w-xl">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-100 backdrop-blur-sm mb-3">
                                <Sparkles className="h-3.5 w-3.5" />
                                Game Luyện Tập Vui Nhộn
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                                Ôn Tập Kiến Thức Qua Các Trò Chơi
                            </h1>
                            <p className="mt-2 text-xs md:text-sm text-amber-100/90 leading-relaxed font-medium">
                                Hãy chọn một môn học dưới đây để bắt đầu trải nghiệm các minigame như nối chữ, thử thách câu hỏi tự luận thú vị!
                            </p>
                        </div>
                        <Gamepad2 className="pointer-events-none absolute -right-6 -bottom-6 h-48 w-48 text-white/15 rotate-12" />
                    </div>

                    {/* Tiêu đề danh sách môn */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Layers className="h-5 w-5 text-amber-600" />
                                Danh Sách Môn Học
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Chọn môn bạn muốn luyện tập game</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                            {subjects.length} môn học
                        </span>
                    </div>

                    {/* Grid các môn học */}
                    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {subjects.map((sub, idx) => {
                            const Icon = sub.icon;
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setSelectedSubjectId(sub.id)}
                                    className={`group text-left relative flex flex-col justify-between p-3.5 rounded-2xl border-2 bg-gradient-to-br ${sub.gradient} shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.99]`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-100 group-hover:scale-105 transition duration-200 shrink-0">
                                            <Icon className="h-5 w-5 text-slate-800" />
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${sub.badgeColor}`}>
                                            {sub.topicCount} bài
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition truncate" title={sub.name}>
                                            {sub.name}
                                        </h3>
                                        <p className="mt-1 text-[11px] text-slate-500 truncate">
                                            Game nối từ & câu hỏi ngắn
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2 text-xs font-extrabold text-amber-600">
                                        <span>Chọn game</span>
                                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {subjects.length === 0 && (
                        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-3 font-bold text-slate-600">Chưa có môn học nào có dữ liệu.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* =========================================================
       PAGE 2: SAU MÔN HỌC LÀ CÁC GAME ĐỂ ÔN TẬP
    ========================================================= */
    return (
        <div className="h-full min-h-0 overflow-y-auto no-scrollbar bg-slate-50/70 p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                {/* Back button */}
                <button
                    type="button"
                    onClick={() => {
                        setSelectedSubjectId(null);
                        setSearch("");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs md:text-sm font-bold text-slate-600 shadow-sm border border-slate-100 hover:text-amber-600 transition mb-5 active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại chọn môn học
                </button>

                {/* Subject Title Banner */}
                <div className="rounded-3xl bg-white border border-slate-100 p-5 md:p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-sm shrink-0">
                            <Gamepad2 className="h-7 w-7" />
                        </div>
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                                Game Ôn Tập Môn Học
                            </span>
                            <h1 className="text-xl md:text-2xl font-black text-slate-900">
                                {activeSubject?.name}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Khám phá các trò chơi nối chữ tự luận theo từng chủ đề bài học
                            </p>
                        </div>
                    </div>

                    {/* Search box */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm chủ đề ôn tập..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs md:text-sm font-medium focus:outline-none focus:border-amber-400 focus:bg-white transition"
                        />
                    </div>
                </div>

                {/* GAME CATEGORIES BANNER */}
                <div className="mb-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-5 md:p-6 text-white shadow-md flex items-center justify-between gap-4">
                    <div className="max-w-lg">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-200">
                                Minigame chính
                            </span>
                            <span className="text-xs font-bold text-purple-200">
                                Phong cách AlphaBetty Saga
                            </span>
                        </div>
                        <h2 className="text-lg md:text-xl font-black text-white">
                            Game Nối Chữ (Word Puzzle)
                        </h2>
                        <p className="text-xs text-purple-100 mt-1 leading-relaxed">
                            Vuốt qua các chữ cái liền kề để giải mã đáp án tự luận. Chọn chủ đề bên dưới để vào màn chơi ngay!
                        </p>
                    </div>
                    <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                        🧩
                    </div>
                </div>

                {/* DANH SÁCH CÁC CHỦ ĐỀ ĐỂ CHƠI GAME NỐI CHỮ */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Flame className="h-4 w-4 text-amber-500" />
                            Chọn Chủ Đề Để Bắt Đầu Chơi
                        </h3>
                        <span className="text-xs font-bold text-slate-400">
                            {filteredTopics.length} chủ đề có sẵn
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredTopics.map((topic, idx) => {
                            const num = String(topic.orderNum || idx + 1).padStart(2, "0");
                            return (
                                <div
                                    key={topic.id}
                                    className="group relative flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-200"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 font-black text-sm group-hover:bg-amber-500 group-hover:text-white transition duration-200">
                                            {num}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-slate-800 truncate group-hover:text-amber-600 transition">
                                                {topic.name}
                                            </h4>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                                {topic.chapterName || "Chương học"} • {topic.questionCount} câu hỏi
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action button to launch game */}
                                    <button
                                        type="button"
                                        onClick={() => onSelectWordGame(topic)}
                                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-xs hover:from-amber-400 hover:to-yellow-400 transition active:scale-95"
                                        title="Chơi Game Nối Chữ chủ đề này"
                                    >
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                        Chơi Game
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {filteredTopics.length === 0 && (
                        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                            <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-3 font-bold text-slate-600">Không tìm thấy chủ đề nào phù hợp.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
