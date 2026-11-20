import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    ArrowLeft,
    Sparkles,
    Trophy,
    RotateCcw,
    HelpCircle,
    Volume2,
    VolumeX,
    Shuffle,
    ChevronRight,
    CheckCircle2,
    Lightbulb,
    Award,
    Gamepad2,
    AlertCircle,
    PartyPopper,
} from "lucide-react";
import type { TopicDto } from "../../services/topicService";
import {
    practiceService,
    type WordPuzzleQuestionDto,
} from "../../services/practiceService";

/* =========================================================
   PROPS
========================================================= */

interface WordPuzzleGameViewProps {
    topic: TopicDto;
    onBack: () => void;
    onEarnGems?: (amount: number) => void;
}

/* =========================================================
   GRID CELL TYPE
========================================================= */

interface Cell {
    id: string;
    row: number;
    col: number;
    letter: string;
    points: number;
    isTargetWord?: boolean;
}

/* =========================================================
   SOUND SYNTHESIZER (WEB AUDIO API)
========================================================= */

class SoundEffects {
    private ctx: AudioContext | null = null;
    public enabled = true;

    private getContext(): AudioContext | null {
        if (!this.enabled) return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    playSelect(step: number = 0) {
        const ctx = this.getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        // Tần số tăng dần khi nối được nhiều chữ liên tiếp
        const baseFreq = 340;
        osc.frequency.setValueAtTime(baseFreq * Math.pow(1.08, Math.min(step, 12)), ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    }

    playCorrect() {
        const ctx = this.getContext();
        if (!ctx) return;
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
    }

    playWrong() {
        const ctx = this.getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    }

    playVictory() {
        const ctx = this.getContext();
        if (!ctx) return;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
            gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.4);
        });
    }
}

const sounds = new SoundEffects();

/* =========================================================
   LETTER POINTS (Scrabble style point system)
========================================================= */

const LETTER_POINTS: Record<string, number> = {
    A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
    D: 2, G: 2,
    B: 3, C: 3, M: 3, P: 3,
    F: 4, H: 4, V: 4, W: 4, Y: 4,
    K: 5,
    J: 8, X: 8,
    Q: 10, Z: 10,
};

function getLetterPoint(char: string): number {
    const upper = char.toUpperCase();
    return LETTER_POINTS[upper] || 1;
}

/* =========================================================
   GRID GENERATOR (AlphaBetty Saga style 8-direction path)
========================================================= */

const DIRECTIONS = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
];

const FILLER_POOL = "AABCDEEEGHIKLMNNNOOPPQRSTTUUVXY";

function generatePuzzleGrid(word: string, targetSize?: number): { grid: Cell[][]; path: [number, number][] } {
    const cleanedWord = (word || "").toUpperCase().replace(/[^A-Z0-9À-Ỹ]/g, "");
    const wordLen = cleanedWord.length || 3;
    const size = targetSize || (wordLen > 8 ? 6 : 5);

    // Thử tạo đường đi cho từ
    for (let attempt = 0; attempt < 100; attempt++) {
        const matrix: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
        const visited = new Set<string>();
        const path: [number, number][] = [];

        // Bắt đầu từ 1 ô ngẫu nhiên
        const startR = Math.floor(Math.random() * size);
        const startC = Math.floor(Math.random() * size);

        let currR = startR;
        let currC = startC;
        matrix[currR][currC] = cleanedWord[0] || "A";
        visited.add(`${currR},${currC}`);
        path.push([currR, currC]);

        let success = true;
        for (let i = 1; i < wordLen; i++) {
            // Lấy các hướng hợp lệ chưa thăm
            const shuffledDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);
            let nextR = -1;
            let nextC = -1;

            for (const [dr, dc] of shuffledDirs) {
                const nr = currR + dr;
                const nc = currC + dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(`${nr},${nc}`)) {
                    nextR = nr;
                    nextC = nc;
                    break;
                }
            }

            if (nextR === -1) {
                success = false;
                break;
            }

            currR = nextR;
            currC = nextC;
            matrix[currR][currC] = cleanedWord[i];
            visited.add(`${currR},${currC}`);
            path.push([currR, currC]);
        }

        if (success) {
            // Lấp đầy các ô còn lại
            const targetSet = new Set(path.map(([r, c]) => `${r},${c}`));
            const grid: Cell[][] = [];

            for (let r = 0; r < size; r++) {
                const rowCells: Cell[] = [];
                for (let c = 0; c < size; c++) {
                    const isTarget = targetSet.has(`${r},${c}`);
                    let char = matrix[r][c];
                    if (!char) {
                        // Lấy ngẫu nhiên từ filler pool
                        char = FILLER_POOL[Math.floor(Math.random() * FILLER_POOL.length)];
                    }
                    rowCells.push({
                        id: `cell-${r}-${c}`,
                        row: r,
                        col: c,
                        letter: char,
                        points: getLetterPoint(char),
                        isTargetWord: isTarget,
                    });
                }
                grid.push(rowCells);
            }

            return { grid, path };
        }
    }

    // Fallback nếu không xếp được (rất hiếm): xếp thẳng hàng
    const grid: Cell[][] = [];
    const path: [number, number][] = [];
    for (let r = 0; r < size; r++) {
        const rowCells: Cell[] = [];
        for (let c = 0; c < size; c++) {
            const idx = r * size + c;
            const char = idx < wordLen ? cleanedWord[idx] : FILLER_POOL[Math.floor(Math.random() * FILLER_POOL.length)];
            const isTarget = idx < wordLen;
            if (isTarget) path.push([r, c]);
            rowCells.push({
                id: `cell-${r}-${c}`,
                row: r,
                col: c,
                letter: char,
                points: getLetterPoint(char),
                isTargetWord: isTarget,
            });
        }
        grid.push(rowCells);
    }
    return { grid, path };
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function WordPuzzleGameView({
    topic,
    onBack,
    onEarnGems,
}: WordPuzzleGameViewProps) {
    const [questions, setQuestions] = useState<WordPuzzleQuestionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Trạng thái chơi
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [soundOn, setSoundOn] = useState(true);

    // Lưới & đường đi
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [targetPath, setTargetPath] = useState<[number, number][]>([]);
    const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Trạng thái câu hiện tại
    const [solvedCurrent, setSolvedCurrent] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [shakeWrong, setShakeWrong] = useState(false);
    const [plusScoreAnim, setPlusScoreAnim] = useState<number | null>(null);

    // Kết thúc vòng
    const [isFinished, setIsFinished] = useState(false);

    // Load danh sách câu hỏi
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await practiceService.getWordPuzzleQuestions(topic.id);
                if (mounted) {
                    setQuestions(data);
                    if (data.length > 0) {
                        initQuestion(0, data[0]);
                    }
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Không thể tải câu hỏi nối từ.");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, [topic.id]);

    // Khởi tạo bàn cờ cho câu hỏi
    const initQuestion = (index: number, q: WordPuzzleQuestionDto) => {
        const { grid: newGrid, path } = generatePuzzleGrid(q.wordAnswer);
        setGrid(newGrid);
        setTargetPath(path);
        setSelectedCells([]);
        setSolvedCurrent(false);
        setShowHint(false);
        setShakeWrong(false);
        setCurrentIndex(index);
    };

    const currentQuestion = questions[currentIndex];

    // Toggle âm thanh
    const toggleSound = () => {
        sounds.enabled = !soundOn;
        setSoundOn(!soundOn);
    };

    // Kiểm tra tính liền kề (8 hướng)
    const isAdjacent = (c1: Cell, c2: Cell) => {
        return Math.abs(c1.row - c2.row) <= 1 && Math.abs(c1.col - c2.col) <= 1;
    };

    // Bắt đầu chọn ô
    const handleCellPointerDown = (cell: Cell) => {
        if (solvedCurrent) return;
        setIsDragging(true);
        setSelectedCells([cell]);
        sounds.playSelect(0);
    };

    // Di chuyển qua các ô liền kề
    const handleCellPointerEnter = (cell: Cell) => {
        if (!isDragging || solvedCurrent) return;

        // Nếu ô này đã là ô cuối cùng thì bỏ qua
        if (selectedCells.length > 0 && selectedCells[selectedCells.length - 1].id === cell.id) {
            return;
        }

        // Nếu người chơi quay lui (chạm lại ô áp chót), cho phép undo ô cuối
        if (selectedCells.length >= 2 && selectedCells[selectedCells.length - 2].id === cell.id) {
            setSelectedCells((prev) => prev.slice(0, prev.length - 1));
            sounds.playSelect(selectedCells.length - 2);
            return;
        }

        // Kiểm tra xem ô đã có trong danh sách chọn chưa (tránh chu trình)
        if (selectedCells.some((c) => c.id === cell.id)) {
            return;
        }

        // Kiểm tra xem có liền kề với ô cuối cùng không
        const lastCell = selectedCells[selectedCells.length - 1];
        if (lastCell && isAdjacent(lastCell, cell)) {
            const nextList = [...selectedCells, cell];
            setSelectedCells(nextList);
            sounds.playSelect(nextList.length);
        }
    };

    // Kết thúc việc kéo/nối ô
    const handlePointerUp = useCallback(() => {
        if (!isDragging || solvedCurrent || selectedCells.length === 0) {
            setIsDragging(false);
            return;
        }
        setIsDragging(false);

        const currentWord = selectedCells.map((c) => c.letter).join("").toUpperCase();
        const targetWord = (currentQuestion?.wordAnswer || "").toUpperCase();

        if (currentWord === targetWord) {
            // Đúng đáp án!
            setSolvedCurrent(true);
            sounds.playCorrect();

            const earned = 500 + streak * 50;
            setScore((s) => s + earned);
            setStreak((st) => st + 1);
            setPlusScoreAnim(earned);

            if (onEarnGems) {
                onEarnGems(10);
            }

            setTimeout(() => {
                setPlusScoreAnim(null);
            }, 1200);

            // Tự động chuyển câu tiếp theo sau 1.6 giây
            setTimeout(() => {
                if (currentIndex + 1 < questions.length) {
                    initQuestion(currentIndex + 1, questions[currentIndex + 1]);
                } else {
                    // Đã hoàn thành tất cả câu!
                    setIsFinished(true);
                    sounds.playVictory();
                }
            }, 1600);
        } else {
            // Sai từ khóa
            sounds.playWrong();
            setStreak(0);
            setShakeWrong(true);
            setTimeout(() => {
                setShakeWrong(false);
                setSelectedCells([]);
            }, 450);
        }
    }, [isDragging, solvedCurrent, selectedCells, currentQuestion, streak, onEarnGems, currentIndex, questions]);

    // Lắng nghe sự kiện thả chuột trên toàn window
    useEffect(() => {
        const onGlobalPointerUp = () => {
            if (isDragging) {
                handlePointerUp();
            }
        };
        window.addEventListener("pointerup", onGlobalPointerUp);
        return () => {
            window.removeEventListener("pointerup", onGlobalPointerUp);
        };
    }, [isDragging, handlePointerUp]);

    // Xáo lại bảng (Shuffle)
    const handleShuffle = () => {
        if (currentQuestion && !solvedCurrent) {
            initQuestion(currentIndex, currentQuestion);
        }
    };

    // Bật gợi ý (Hint): làm sáng 2 ô đầu tiên của đường đi đáp án
    const handleHint = () => {
        setShowHint(true);
        sounds.playSelect(4);
    };

    // Chơi lại toàn bộ
    const handleRestart = () => {
        setScore(0);
        setStreak(0);
        setIsFinished(false);
        if (questions.length > 0) {
            initQuestion(0, questions[0]);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-slate-900 p-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
                        <Gamepad2 className="absolute inset-0 m-auto h-7 w-7 text-amber-300 animate-pulse" />
                    </div>
                    <p className="font-extrabold text-amber-100 text-lg">Đang tạo màn chơi Game Nối Chữ...</p>
                    <p className="text-xs text-amber-200/70">Lấy câu hỏi tự luận & tạo ma trận từ ngữ AlphaBetty</p>
                </div>
            </div>
        );
    }

    // Error or No Questions State
    if (error || questions.length === 0) {
        return (
            <div className="flex h-full min-h-0 flex-col items-center justify-center bg-slate-900 p-6 text-white">
                <div className="max-w-md w-full rounded-3xl bg-slate-800/90 border border-slate-700 p-8 text-center shadow-2xl backdrop-blur">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-4">
                        <AlertCircle className="h-9 w-9" />
                    </div>
                    <h2 className="text-xl font-black text-amber-300">Chưa có câu hỏi nối chữ</h2>
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                        {error ||
                            "Chủ đề này chưa có câu hỏi tự luận với câu trả lời ngắn để tạo trò chơi nối chữ. Bạn hãy luyện tập trắc nghiệm thông thường hoặc thêm câu hỏi tự luận mới!"}
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 transition shadow-lg active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Quay lại danh sách chủ đề
                    </button>
                </div>
            </div>
        );
    }

    // Current word being formed
    const currentSpelled = selectedCells.map((c) => c.letter).join("");

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col select-none overflow-hidden bg-gradient-to-b from-[#1b1e36] via-[#161a2e] to-[#0f111e] text-white">
            {/* AMBIENT LIGHTING BACKGROUND */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/15 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />

            {/* TOP HEADER / BAR */}
            <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 md:px-8 bg-slate-950/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition active:scale-95"
                        title="Quay lại"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                                AlphaBetty Saga
                            </span>
                            <span className="text-xs font-semibold text-slate-400 truncate max-w-[140px] md:max-w-[220px]">
                                {topic.name}
                            </span>
                        </div>
                        <h1 className="text-sm md:text-base font-black text-amber-100 flex items-center gap-1.5">
                            <Gamepad2 className="h-4 w-4 text-amber-400" />
                            Game Nối Chữ Ôn Tập
                        </h1>
                    </div>
                </div>

                {/* SCORES & STATS */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Cheese / Progress count */}
                    <div className="flex items-center gap-2 rounded-2xl bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 shadow-inner">
                        <span className="text-lg">🧀</span>
                        <div className="text-left">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">Tiến trình</p>
                            <p className="text-xs md:text-sm font-black text-amber-200">
                                {currentIndex + 1} / {questions.length}
                            </p>
                        </div>
                    </div>

                    {/* Total Score */}
                    <div className="relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 px-3.5 py-1.5 shadow-md">
                        <Trophy className="h-4 w-4 text-amber-100" />
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-100/90">Điểm</p>
                            <p className="text-xs md:text-sm font-black text-white">{score}</p>
                        </div>

                        {/* Floating +500 Animation */}
                        {plusScoreAnim && (
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-black text-white shadow-lg">
                                +{plusScoreAnim}
                            </span>
                        )}
                    </div>

                    {/* Mute / Unmute */}
                    <button
                        type="button"
                        onClick={toggleSound}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
                        title={soundOn ? "Tắt âm" : "Bật âm"}
                    >
                        {soundOn ? <Volume2 className="h-5 w-5 text-emerald-400" /> : <VolumeX className="h-5 w-5 text-slate-400" />}
                    </button>
                </div>
            </header>

            {/* MAIN PLAYING WORKSPACE */}
            <main className="relative z-10 flex flex-1 flex-col items-center justify-between p-3 md:p-6 overflow-y-auto no-scrollbar">
                {/* 1. QUESTION BANNER CARD */}
                <div className="w-full max-w-xl rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-amber-500/20 p-4 md:p-5 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300">
                            <Sparkles className="h-3.5 w-3.5" />
                            Câu hỏi {currentIndex + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                            Đáp án: {currentQuestion?.wordAnswer?.length || 0} chữ cái
                        </span>
                    </div>

                    <p className="text-sm md:text-base font-bold text-slate-100 leading-snug">
                        {currentQuestion?.questionText}
                    </p>

                    {/* SOLVED ALERT / EXPLANATION */}
                    {solvedCurrent && (
                        <div className="mt-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-emerald-300 text-xs md:text-sm font-semibold animate-fade-in flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                            <div>
                                <span className="font-black text-white">Chính xác! </span>
                                <span>Đáp án là: <strong className="text-amber-300 font-extrabold">{currentQuestion.displayAnswer}</strong></span>
                                {currentQuestion.explanation && (
                                    <p className="mt-1 text-slate-300 font-normal italic">
                                        {currentQuestion.explanation}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. SPELLED WORD RIBBON (Like AlphaBetty Saga wooden board) */}
                <div className="my-3 flex flex-col items-center">
                    <div
                        className={`min-w-[220px] max-w-md px-6 py-2.5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-center gap-2 shadow-2xl ${
                            solvedCurrent
                                ? "bg-emerald-600 border-emerald-300 scale-105"
                                : shakeWrong
                                ? "bg-rose-900/80 border-rose-400 animate-shake"
                                : "bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 border-yellow-300/60 shadow-amber-900/50"
                        }`}
                    >
                        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-200/70 mr-1">
                            Từ nối:
                        </span>
                        <span className="text-xl md:text-2xl font-black tracking-widest text-white drop-shadow-md min-h-[32px] flex items-center">
                            {currentSpelled || (
                                <span className="text-amber-300/40 font-mono tracking-widest text-base">
                                    {"_ ".repeat(currentQuestion?.wordAnswer?.length || 4)}
                                </span>
                            )}
                        </span>
                        {solvedCurrent && <PartyPopper className="h-5 w-5 text-yellow-300 ml-1 animate-spin" />}
                    </div>
                </div>

                {/* 3. ALPHABETTY SAGA GRID TILES */}
                <div className="relative my-auto flex flex-col items-center">
                    <div
                        className="grid gap-2 md:gap-3 p-3 md:p-4 rounded-3xl bg-slate-900/80 border-2 border-indigo-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                        style={{
                            gridTemplateColumns: `repeat(${grid.length || 5}, minmax(0, 1fr))`,
                        }}
                    >
                        {grid.map((row) =>
                            row.map((cell) => {
                                const isSelected = selectedCells.some((c) => c.id === cell.id);
                                const isHead = selectedCells.length > 0 && selectedCells[selectedCells.length - 1].id === cell.id;
                                const isHinted =
                                    showHint &&
                                    targetPath.slice(0, 2).some(([r, c]) => r === cell.row && c === cell.col);

                                return (
                                    <div
                                        key={cell.id}
                                        onPointerDown={() => handleCellPointerDown(cell)}
                                        onPointerEnter={() => handleCellPointerEnter(cell)}
                                        className={`relative flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 cursor-pointer items-center justify-center rounded-2xl font-black transition-transform duration-150 select-none shadow-md ${
                                            isSelected
                                                ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 scale-105 border-2 border-emerald-200 shadow-emerald-500/50 shadow-lg"
                                                : isHinted
                                                ? "bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 animate-pulse border-2 border-white shadow-amber-400/60 shadow-lg"
                                                : "bg-gradient-to-b from-[#f3f0e6] to-[#ded6c3] text-[#3e3428] border-b-4 border-[#b5a990] hover:bg-[#fffdf8] hover:scale-105 active:scale-95"
                                        }`}
                                    >
                                        {/* Big Letter */}
                                        <span className="text-xl sm:text-2xl md:text-3xl font-black drop-shadow-sm">
                                            {cell.letter}
                                        </span>

                                        {/* Small Scrabble Point on Bottom Right */}
                                        <span
                                            className={`absolute bottom-1 right-1.5 text-[9px] font-bold ${
                                                isSelected ? "text-slate-900/80" : "text-amber-900/60"
                                            }`}
                                        >
                                            {cell.points}
                                        </span>

                                        {/* Head indicator (current selection pointer) */}
                                        {isHead && (
                                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-300 border border-slate-900 text-[8px] text-slate-900 font-extrabold animate-ping" />
                                        )}
                                    </div>
                                );
                            }),
                        )}
                    </div>
                </div>

                {/* 4. BOTTOM ACTION TOOLBAR / POWER-UPS */}
                <div className="mt-3 flex items-center justify-center gap-3 w-full max-w-md">
                    {/* Clear selection */}
                    <button
                        type="button"
                        onClick={() => setSelectedCells([])}
                        disabled={selectedCells.length === 0 || solvedCurrent}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none py-3 px-4 font-bold text-xs text-slate-200 transition active:scale-95 border border-white/5"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Xóa chọn
                    </button>

                    {/* Hint Button */}
                    <button
                        type="button"
                        onClick={handleHint}
                        disabled={showHint || solvedCurrent}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-30 disabled:pointer-events-none py-3 px-4 font-bold text-xs text-amber-300 transition active:scale-95 border border-amber-500/30"
                    >
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                        Gợi ý
                    </button>

                    {/* Shuffle Grid */}
                    <button
                        type="button"
                        onClick={handleShuffle}
                        disabled={solvedCurrent}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-30 disabled:pointer-events-none py-3 px-4 font-bold text-xs text-indigo-300 transition active:scale-95 border border-indigo-500/30"
                    >
                        <Shuffle className="h-4 w-4 text-indigo-400" />
                        Xáo bảng
                    </button>
                </div>
            </main>

            {/* 5. VICTORY CELEBRATION MODAL */}
            {isFinished && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 border-2 border-amber-400/50 p-6 md:p-8 text-center shadow-[0_25px_60px_rgba(251,191,36,0.3)]">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-xl mb-4 animate-bounce">
                            <Trophy className="h-10 w-10" />
                        </div>

                        <span className="rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                            Hoàn Thành Xuất Sắc!
                        </span>

                        <h2 className="mt-2 text-2xl font-black text-white">
                            Chúc Mừng Bạn!
                        </h2>

                        <p className="mt-2 text-sm text-slate-300">
                            Bạn đã vượt qua toàn bộ thử thách nối chữ của chủ đề <strong className="text-amber-300">{topic.name}</strong>!
                        </p>

                        <div className="my-6 grid grid-cols-2 gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Tổng điểm</p>
                                <p className="text-2xl font-black text-amber-300">{score}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Câu trả lời</p>
                                <p className="text-2xl font-black text-emerald-400">{questions.length} / {questions.length}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleRestart}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 transition shadow-lg active:scale-95"
                            >
                                <RotateCcw className="h-5 w-5" />
                                Chơi lại từ đầu
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-3 transition active:scale-95"
                            >
                                Quay về chủ đề
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
