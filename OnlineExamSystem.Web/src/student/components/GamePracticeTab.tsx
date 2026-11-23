import React, { useState, useEffect, useMemo } from "react";
import {
    ArrowLeft,
    Gamepad2,
    Sparkles,
    Check,
    Loader2,
    BookOpen,
    Atom,
    FlaskConical,
    Landmark,
    Sigma,
    GraduationCap,
    Globe2,
    Languages,
    FileText,
    Target,
    Zap,
    PenTool,
    Pickaxe,
} from "lucide-react";
import { topicService, type TopicDto } from "../../services/topicService";
import {
    practiceService,
    type ChessQuestionDto,
    type WordPuzzleQuestionDto,
} from "../../services/practiceService";
import ChessPuzzleGameView from "./ChessPuzzleGameView";
import WordPuzzleGameView from "./WordPuzzleGameView";

/* =========================================================
   PROPS
========================================================= */

interface GamePracticeTabProps {
    onSelectWordGame?: (topic: TopicDto) => void;
    onSelectChessGame?: (topic: TopicDto) => void;
    userStars?: number;
    onEarnGems?: (amount: number) => void;
    onUseStars?: (amount: number) => boolean;
}

/* =========================================================
   GAME MODE DEFINITIONS (Exact match to uploaded image)
========================================================= */

export type GameModeId = "chess" | "word";

interface GameModeConfig {
    id: GameModeId;
    title: string;
    description: string;
    badgeText: string;
    icon: string;
    cardBg: string;
    border: string;
    iconBg: string;
    textColor: string;
    descColor: string;
    btnColor: string;
}

const GAME_MODES: GameModeConfig[] = [
    {
        id: "chess",
        title: "Cờ vua",
        description: "Mỗi nước đi một câu hỏi",
        badgeText: "🏅 0 câu",
        icon: "♟️",
        cardBg: "bg-[#e0e7ff]",
        border: "border-[#c7d2fe]",
        iconBg: "bg-indigo-200/60 text-indigo-700",
        textColor: "text-indigo-900",
        descColor: "text-indigo-700/80",
        btnColor: "text-indigo-700",
    },
    {
        id: "word",
        title: "Nối chữ",
        description: "Vuốt chữ cái ghép đáp án",
        badgeText: "🏅 0 câu",
        icon: "🔤",
        cardBg: "bg-[#ffe4e6]",
        border: "border-[#fecdd3]",
        iconBg: "bg-rose-200/60 text-rose-700",
        textColor: "text-rose-900",
        descColor: "text-rose-700/80",
        btnColor: "text-rose-700",
    },
];

/* =========================================================
   SUBJECT ICON & STYLES
========================================================= */

interface SubjectItem {
    id: string;
    name: string;
    questionCount: number;
    iconElement: React.ReactNode;
    iconBg: string;
}

const getSubjectIconMeta = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("toán") || n.includes("math")) {
        return {
            iconBg: "bg-cyan-100 text-cyan-600",
            iconElement: <span className="text-xl font-black">÷</span>,
        };
    }
    if (n.includes("văn") || n.includes("tiếng việt") || n.includes("ngữ văn")) {
        return {
            iconBg: "bg-rose-100 text-rose-500",
            iconElement: <BookOpen className="h-5 w-5" />,
        };
    }
    if (n.includes("anh") || n.includes("english") || n.includes("ngoại ngữ")) {
        return {
            iconBg: "bg-violet-100 text-violet-600",
            iconElement: <span className="text-xs font-black tracking-tighter">abc</span>,
        };
    }
    if (n.includes("khoa học") || n.includes("sinh") || n.includes("hóa") || n.includes("hoá")) {
        return {
            iconBg: "bg-emerald-100 text-emerald-600",
            iconElement: <FlaskConical className="h-5 w-5" />,
        };
    }
    if (n.includes("lý") || n.includes("lí") || n.includes("vật")) {
        return {
            iconBg: "bg-purple-100 text-purple-600",
            iconElement: <Atom className="h-5 w-5" />,
        };
    }
    if (n.includes("sử") || n.includes("lịch sử")) {
        return {
            iconBg: "bg-amber-100 text-amber-600",
            iconElement: <Landmark className="h-5 w-5" />,
        };
    }
    if (n.includes("địa") || n.includes("địa lí") || n.includes("địa lý")) {
        return {
            iconBg: "bg-blue-100 text-blue-600",
            iconElement: <Globe2 className="h-5 w-5" />,
        };
    }
    return {
        iconBg: "bg-slate-100 text-slate-600",
        iconElement: <GraduationCap className="h-5 w-5" />,
    };
};

/* =========================================================
   COMPONENT: GAME PRACTICE TAB
========================================================= */

export default function GamePracticeTab({
    onSelectWordGame,
    onSelectChessGame,
    userStars = 0,
    onEarnGems,
    onUseStars,
}: GamePracticeTabProps) {
    const [topics, setTopics] = useState<TopicDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Bước chọn:
    // selectedGame === null -> BƯỚC 1: Chọn Game
    // selectedGame !== null -> BƯỚC 2: Chọn môn học cho Game
    const [selectedGameId, setSelectedGameId] = useState<GameModeId | null>(null);

    // Danh sách subjectIds được chọn trong Bước 2 (mặc định chọn môn đầu tiên nếu có)
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

    // Trạng thái chuẩn bị game (tải và xáo trộn câu hỏi)
    const [isPreparingGame, setIsPreparingGame] = useState(false);
    const [prepareError, setPrepareError] = useState<string | null>(null);

    // Game đang chạy trực tiếp
    const [activeRunningGame, setActiveRunningGame] = useState<{
        mode: GameModeId;
        title: string;
        dummyTopic: TopicDto;
        chessQuestions?: ChessQuestionDto[];
        wordQuestions?: WordPuzzleQuestionDto[];
    } | null>(null);

    // Tải danh sách topics để tổng hợp môn học
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
                console.error("LOAD STUDENT TOPICS ERROR:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, []);

    // Nhóm danh sách các môn học kèm tổng số lượng câu hỏi (chỉ lấy các môn có câu hỏi)
    const subjects = useMemo<SubjectItem[]>(() => {
        const map = new Map<string, { id: string; name: string; questionCount: number }>();
        topics.forEach((t) => {
            if (!t.subjectId || !t.questionCount || t.questionCount <= 0) return;
            const existing = map.get(t.subjectId);
            if (existing) {
                existing.questionCount += t.questionCount;
            } else {
                map.set(t.subjectId, {
                    id: t.subjectId,
                    name: t.subjectName || "Môn học",
                    questionCount: t.questionCount,
                });
            }
        });

        return Array.from(map.values())
            .filter((sub) => sub.questionCount > 0)
            .map((sub) => {
                const meta = getSubjectIconMeta(sub.name);
                return {
                    id: sub.id,
                    name: sub.name,
                    questionCount: sub.questionCount,
                    iconElement: meta.iconElement,
                    iconBg: meta.iconBg,
                };
            });
    }, [topics]);

    // Khi chuyển sang Bước 2, tự động chọn môn đầu tiên nếu chưa có môn nào được chọn
    useEffect(() => {
        if (selectedGameId && subjects.length > 0 && selectedSubjectIds.length === 0) {
            setSelectedSubjectIds([subjects[0].id]);
        }
    }, [selectedGameId, subjects, selectedSubjectIds.length]);

    // Toggle chọn / bỏ chọn môn học
    const handleToggleSubject = (subId: string) => {
        setSelectedSubjectIds((prev) => {
            if (prev.includes(subId)) {
                return prev.filter((id) => id !== subId);
            } else {
                return [...prev, subId];
            }
        });
    };

    // Chọn tất cả môn
    const handleSelectAll = () => {
        setSelectedSubjectIds(subjects.map((s) => s.id));
    };

    // Bỏ chọn tất cả
    const handleDeselectAll = () => {
        setSelectedSubjectIds([]);
    };

    // Khởi động Game: Tải và xáo trộn câu hỏi từ tất cả các môn đã chọn
    const handleStartPractice = async () => {
        if (!selectedGameId || selectedSubjectIds.length === 0) return;

        try {
            setIsPreparingGame(true);
            setPrepareError(null);

            // Lọc ra các topic thuộc các môn học đã chọn
            const matchedTopics = topics.filter((t) => selectedSubjectIds.includes(t.subjectId));
            if (matchedTopics.length === 0) {
                setPrepareError("Không tìm thấy chủ đề nào cho các môn đã chọn.");
                return;
            }

            const selectedNames = subjects
                .filter((s) => selectedSubjectIds.includes(s.id))
                .map((s) => s.name)
                .join(", ");

            const dummyTopic: TopicDto = {
                id: matchedTopics[0].id,
                name: `Luyện tập tổng hợp: ${selectedNames}`,
                description: `Tổng hợp câu hỏi từ các môn: ${selectedNames}`,
                subjectId: matchedTopics[0].subjectId,
                subjectName: selectedNames,
                gradeId: matchedTopics[0].gradeId,
                gradeName: matchedTopics[0].gradeName,
                isActive: true,
                questionCount: 0,
                chapterId: matchedTopics[0].chapterId,
                chapterName: "",
                chapterOrder: 1,
                orderNum: 1,
            };

            // 1. Nếu là game Nối chữ:
            if (selectedGameId === "word") {
                const promises = matchedTopics.map((t) =>
                    practiceService.getWordPuzzleQuestions(t.id).catch(() => []),
                );
                const results = await Promise.all(promises);
                const allWordQuestions = results.flat();

                if (allWordQuestions.length === 0) {
                    setPrepareError("Chưa có câu hỏi nối chữ trong các môn đã chọn. Vui lòng chọn môn khác!");
                    return;
                }

                // Xáo trộn câu hỏi
                const shuffled = [...allWordQuestions].sort(() => Math.random() - 0.5);

                setActiveRunningGame({
                    mode: "word",
                    title: `Nối chữ: ${selectedNames}`,
                    dummyTopic,
                    wordQuestions: shuffled,
                });
                return;
            }

            // 2. Nếu là game Cờ vua:
            const promises = matchedTopics.map((t) =>
                practiceService.getChessQuestions(t.id).catch(() => []),
            );
            const results = await Promise.all(promises);
            const allQuestions = results.flat();

            if (allQuestions.length === 0) {
                setPrepareError("Chưa có câu hỏi phù hợp trong các môn đã chọn. Vui lòng chọn môn khác!");
                return;
            }

            // Xáo trộn câu hỏi
            const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

            setActiveRunningGame({
                mode: "chess",
                title: `Cờ vua: ${selectedNames}`,
                dummyTopic,
                chessQuestions: shuffled,
            });
        } catch (err) {
            console.error("START PRACTICE ERROR:", err);
            setPrepareError("Đã xảy ra lỗi khi tải câu hỏi. Vui lòng thử lại!");
        } finally {
            setIsPreparingGame(false);
        }
    };

    /* =========================================================
       NẾU ĐANG CHẠY MỘT GAME
    ========================================================= */
    if (activeRunningGame) {
        if (activeRunningGame.mode === "chess") {
            return (
                <ChessPuzzleGameView
                    topic={activeRunningGame.dummyTopic}
                    customQuestions={activeRunningGame.chessQuestions}
                    customTitle={activeRunningGame.title}
                    onBack={() => setActiveRunningGame(null)}
                    userStars={userStars}
                    onEarnGems={onEarnGems}
                    onUseStars={onUseStars}
                />
            );
        }

        if (activeRunningGame.mode === "word") {
            return (
                <WordPuzzleGameView
                    topic={activeRunningGame.dummyTopic}
                    customQuestions={activeRunningGame.wordQuestions}
                    customTitle={activeRunningGame.title}
                    onBack={() => setActiveRunningGame(null)}
                    userStars={userStars}
                    onEarnGems={onEarnGems}
                    onUseStars={onUseStars}
                />
            );
        }

        return (
            <ChessPuzzleGameView
                topic={activeRunningGame.dummyTopic}
                customQuestions={activeRunningGame.chessQuestions}
                customTitle={activeRunningGame.title}
                onBack={() => setActiveRunningGame(null)}
                userStars={userStars}
                onEarnGems={onEarnGems}
                onUseStars={onUseStars}
            />
        );
    }

    /* =========================================================
       LOADING
    ========================================================= */
    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center p-6 bg-[var(--theme-bg)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    <p className="text-sm font-bold text-slate-600">Đang tải danh sách game luyện tập...</p>
                </div>
            </div>
        );
    }

    const currentSelectedGame = GAME_MODES.find((g) => g.id === selectedGameId);

    /* =========================================================
       BƯỚC 2: CHỌN MÔN HỌC CHO GAME ĐÃ CHỌN
    ========================================================= */
    if (selectedGameId && currentSelectedGame) {
        return (
            <div className="h-full min-h-0 overflow-y-auto no-scrollbar bg-[var(--theme-bg)] p-4 md:p-8">
                <div className="mx-auto max-w-4xl">
                    {/* Nút quay lại chọn game khác */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedGameId(null);
                            setPrepareError(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs md:text-sm font-extrabold text-slate-700 shadow-xs border border-slate-200/80 hover:bg-slate-50 transition mb-6 active:scale-95"
                    >
                        <span>←</span>
                        <span>Chọn game khác</span>
                    </button>

                    {/* Header thông tin game đã chọn */}
                    <div className="flex items-start gap-4 mb-3">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-xs shrink-0 ${currentSelectedGame.cardBg} ${currentSelectedGame.border} border-2`}>
                            {currentSelectedGame.icon}
                        </div>
                        <div>
                            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                                BƯỚC 2 / 2
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                                Chọn môn học cho {currentSelectedGame.title}
                            </h1>
                            <p className="mt-1 text-xs md:text-sm text-slate-600 font-medium">
                                Bạn có thể chọn một hoặc nhiều môn, câu hỏi sẽ được trộn từ tất cả các môn đã chọn.
                            </p>
                        </div>
                    </div>

                    {/* Thông báo lỗi nếu có */}
                    {prepareError && (
                        <div className="my-4 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700">
                            {prepareError}
                        </div>
                    )}

                    {/* Danh sách các môn học dạng 2 cột */}
                    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {subjects.map((sub) => {
                            const isSelected = selectedSubjectIds.includes(sub.id);
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => handleToggleSubject(sub.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 active:scale-[0.99] text-left ${
                                        isSelected
                                            ? "border-2 border-indigo-600 bg-white ring-2 ring-indigo-100 shadow-sm"
                                            : "border border-slate-200/80 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        {/* Icon môn học */}
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black text-lg shrink-0 ${sub.iconBg}`}>
                                            {sub.iconElement}
                                        </div>

                                        {/* Tên & Số câu hỏi */}
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 leading-snug">
                                                {sub.name}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500 font-medium">
                                                {sub.questionCount} câu hỏi
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chỉ báo đã chọn / chưa chọn */}
                                    <div className="ml-3 shrink-0">
                                        {isSelected ? (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                                            </div>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full border-2 border-slate-300 bg-slate-100/60" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Thanh công cụ: Chọn tất cả, Bỏ chọn, Thống kê */}
                    <div className="flex items-center gap-2.5 mb-6">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 active:scale-95 transition"
                        >
                            Chọn tất cả
                        </button>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 active:scale-95 transition"
                        >
                            Bỏ chọn
                        </button>
                        <span className="ml-2 text-xs font-bold text-slate-500">
                            Đã chọn {selectedSubjectIds.length}/{subjects.length} môn
                        </span>
                    </div>

                    {/* Nút lớn Bắt đầu luyện tập */}
                    <button
                        type="button"
                        onClick={handleStartPractice}
                        disabled={selectedSubjectIds.length === 0 || isPreparingGame}
                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-indigo-600/25 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPreparingGame ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Đang tổng hợp và xáo trộn câu hỏi...</span>
                            </>
                        ) : (
                            <span>Bắt đầu luyện tập</span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    /* =========================================================
       BƯỚC 1: HIỂN THỊ CÁC GAME LUYỆN TẬP ĐẦU TIÊN
    ========================================================= */
    return (
        <div className="h-full min-h-0 overflow-y-auto no-scrollbar bg-[var(--theme-bg)] p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                {/* TIÊU ĐỀ: GAME LUYỆN TẬP (Khớp kiểu ảnh Góc Luyện tập) */}
                <div className="text-center my-6 md:my-10">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1e293b]">
                        Game <span className="text-[#ff2b98]">Luyện tập</span>
                    </h1>
                    <p className="mt-2.5 text-xs md:text-sm font-semibold text-slate-500">
                        Chọn trò chơi bạn muốn tham gia để bắt đầu ôn luyện kiến thức!
                    </p>
                </div>

                {/* Các Thẻ Game có sẵn (Cờ vua & Nối chữ) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-2xl mx-auto">
                    {GAME_MODES.map((game) => (
                        <div
                            key={game.id}
                            className={`group relative flex flex-col justify-between p-6 md:p-7 rounded-[28px] border-2 ${game.border} ${game.cardBg} shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
                        >
                            {/* Icon phía trên bên trái */}
                            <div className="mb-4">
                                <span className="text-4xl md:text-5xl block leading-none">
                                    {game.icon}
                                </span>
                            </div>

                            {/* Tên game & mô tả */}
                            <div className="flex-1">
                                <h2 className={`text-xl md:text-2xl font-black ${game.textColor} leading-tight`}>
                                    {game.title}
                                </h2>
                                <p className={`mt-2 text-xs md:text-sm font-semibold ${game.descColor}`}>
                                    {game.description}
                                </p>
                            </div>

                            {/* Footer thẻ: Badge thành tích & Nút Chọn → */}
                            <div className="mt-6 flex items-center justify-between pt-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3.5 py-1 text-xs font-black text-slate-700 shadow-xs backdrop-blur-xs">
                                    {game.badgeText}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setSelectedGameId(game.id)}
                                    className={`inline-flex items-center gap-1 rounded-full bg-white px-5 py-2 text-xs font-black ${game.btnColor} shadow-xs hover:bg-white/95 active:scale-95 transition-all`}
                                >
                                    <span>Chọn</span>
                                    <span>→</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
