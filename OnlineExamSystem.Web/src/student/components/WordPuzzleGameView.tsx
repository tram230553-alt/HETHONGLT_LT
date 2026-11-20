import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    X,
    Clock,
    Star,
    Lightbulb,
    ArrowRight,
    RotateCcw,
    Trophy,
    CheckCircle2,
    Volume2,
    VolumeX,
    Sparkles,
    AlertCircle,
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
   CELL INTERFACE
========================================================= */

interface Cell {
    id: string;
    row: number;
    col: number;
    letter: string;
    colorClass: string;
    isTarget?: boolean;
    targetIndex?: number;
}

/* =========================================================
   PASTEL COLOR PALETTE (From exact image)
========================================================= */

const PASTEL_COLORS = [
    "bg-[#fed7db] text-[#543b43]", // Pink pastel
    "bg-[#dbeefd] text-[#2c4769]", // Blue pastel
    "bg-[#fef4b8] text-[#5c522b]", // Yellow pastel
    "bg-[#d5f7dc] text-[#285737]", // Green pastel
    "bg-[#fee0c4] text-[#634224]", // Orange pastel
    "bg-[#eedeff] text-[#4d3370]", // Purple pastel
];

/* =========================================================
   WEB AUDIO API SOUND GENERATOR
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
        const baseFreq = 400;
        osc.frequency.setValueAtTime(baseFreq * Math.pow(1.08, Math.min(step, 10)), ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
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
            gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
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
        osc.frequency.setValueAtTime(190, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
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
   GRID GENERATOR (4x4 or 5x5 based on word length)
========================================================= */

const DIRECTIONS = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
];

const FILLER_POOL = "AABCDEEEGHIKLMNNNOOPPQRSTTUUVXY";

function generatePuzzleGrid(word: string): { grid: Cell[][]; path: [number, number][] } {
    const cleanedWord = (word || "").toUpperCase().replace(/[^A-Z0-9À-Ỹ]/g, "");
    const wordLen = cleanedWord.length || 3;
    const size = wordLen > 8 ? 5 : 4; // Bảng 4x4 theo mẫu nếu từ <= 8 ký tự

    for (let attempt = 0; attempt < 120; attempt++) {
        const matrix: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
        const visited = new Set<string>();
        const path: [number, number][] = [];

        const startR = Math.floor(Math.random() * size);
        const startC = Math.floor(Math.random() * size);

        let currR = startR;
        let currC = startC;
        matrix[currR][currC] = cleanedWord[0] || "A";
        visited.add(`${currR},${currC}`);
        path.push([currR, currC]);

        let success = true;
        for (let i = 1; i < wordLen; i++) {
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
            const targetMap = new Map<string, number>();
            path.forEach(([r, c], idx) => targetMap.set(`${r},${c}`, idx));

            const grid: Cell[][] = [];
            let colorIdx = Math.floor(Math.random() * PASTEL_COLORS.length);

            for (let r = 0; r < size; r++) {
                const rowCells: Cell[] = [];
                for (let c = 0; c < size; c++) {
                    const key = `${r},${c}`;
                    const isTarget = targetMap.has(key);
                    const targetIndex = targetMap.get(key);

                    let char = matrix[r][c];
                    if (!char) {
                        char = FILLER_POOL[Math.floor(Math.random() * FILLER_POOL.length)];
                    }

                    // Phân bổ màu pastel xen kẽ đẹp mắt
                    const color = PASTEL_COLORS[(colorIdx + r * size + c) % PASTEL_COLORS.length];

                    rowCells.push({
                        id: `cell-${r}-${c}`,
                        row: r,
                        col: c,
                        letter: char,
                        colorClass: color,
                        isTarget,
                        targetIndex,
                    });
                }
                grid.push(rowCells);
            }

            return { grid, path };
        }
    }

    // Fallback nếu không tìm thấy đường uốn lượn:
    const grid: Cell[][] = [];
    const path: [number, number][] = [];
    let colorIdx = 0;
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
                colorClass: PASTEL_COLORS[(colorIdx++) % PASTEL_COLORS.length],
                isTarget,
                targetIndex: isTarget ? idx : undefined,
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
    const [timeLeft, setTimeLeft] = useState(90); // 1:30
    const [soundOn, setSoundOn] = useState(true);

    // Grid và lựa chọn
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [targetPath, setTargetPath] = useState<[number, number][]>([]);
    const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Hiệu ứng trạng thái
    const [solvedCurrent, setSolvedCurrent] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [shakeWrong, setShakeWrong] = useState(false);

    // Màn kết thúc
    const [isFinished, setIsFinished] = useState(false);

    // Tải câu hỏi từ Backend
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
                    setError(err instanceof Error ? err.message : "Không thể tải câu hỏi.");
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

    // Đồng hồ đếm ngược
    useEffect(() => {
        if (loading || isFinished || questions.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsFinished(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, isFinished, questions.length]);

    // Format thời gian hiển thị: 01:29
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Khởi tạo một câu hỏi
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
    const targetWordLength = currentQuestion?.wordAnswer?.length || 5;

    // Kiểm tra ô liền kề
    const isAdjacent = (c1: Cell, c2: Cell) => {
        return Math.abs(c1.row - c2.row) <= 1 && Math.abs(c1.col - c2.col) <= 1;
    };

    // Bắt đầu vuốt / chạm
    const handleCellPointerDown = (cell: Cell) => {
        if (solvedCurrent) return;
        setIsDragging(true);
        setSelectedCells([cell]);
        sounds.playSelect(0);
    };

    // Di chuyển qua ô kế tiếp
    const handleCellPointerEnter = (cell: Cell) => {
        if (!isDragging || solvedCurrent) return;

        // Nếu ô trùng với ô cuối cùng
        if (selectedCells.length > 0 && selectedCells[selectedCells.length - 1].id === cell.id) {
            return;
        }

        // Quay lui (undo ô trước)
        if (selectedCells.length >= 2 && selectedCells[selectedCells.length - 2].id === cell.id) {
            setSelectedCells((prev) => prev.slice(0, prev.length - 1));
            sounds.playSelect(selectedCells.length - 2);
            return;
        }

        // Tránh chọn lại ô đã có
        if (selectedCells.some((c) => c.id === cell.id)) {
            return;
        }

        // Kiểm tra liền kề
        const lastCell = selectedCells[selectedCells.length - 1];
        if (lastCell && isAdjacent(lastCell, cell)) {
            const nextList = [...selectedCells, cell];
            setSelectedCells(nextList);
            sounds.playSelect(nextList.length);
        }
    };

    // Kết thúc vuốt
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

            const earned = 100;
            setScore((s) => s + earned);

            if (onEarnGems) {
                onEarnGems(10);
            }

            // Tự động chuyển câu tiếp theo sau 1.3 giây
            setTimeout(() => {
                if (currentIndex + 1 < questions.length) {
                    initQuestion(currentIndex + 1, questions[currentIndex + 1]);
                } else {
                    setIsFinished(true);
                    sounds.playVictory();
                }
            }, 1300);
        } else {
            // Sai từ
            sounds.playWrong();
            setShakeWrong(true);
            setTimeout(() => {
                setShakeWrong(false);
                setSelectedCells([]);
            }, 400);
        }
    }, [isDragging, solvedCurrent, selectedCells, currentQuestion, onEarnGems, currentIndex, questions]);

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

    // Bấm nút "Gợi ý -30"
    const handleHint = () => {
        if (solvedCurrent || showHint) return;
        setScore((s) => Math.max(0, s - 30));
        setShowHint(true);
        sounds.playSelect(4);
    };

    // Bấm nút "Bỏ qua →"
    const handleSkip = () => {
        if (currentIndex + 1 < questions.length) {
            initQuestion(currentIndex + 1, questions[currentIndex + 1]);
        } else {
            setIsFinished(true);
        }
    };

    // Chơi lại
    const handleRestart = () => {
        setScore(0);
        setTimeLeft(90);
        setIsFinished(false);
        if (questions.length > 0) {
            initQuestion(0, questions[0]);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                    <p className="font-extrabold text-slate-700">Đang chuẩn bị màn chơi...</p>
                </div>
            </div>
        );
    }

    // Error / No Questions
    if (error || questions.length === 0) {
        return (
            <div className="flex h-full min-h-0 flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-purple-100">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Chưa có câu hỏi nối chữ</h2>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        {error || "Chủ đề này chưa có câu hỏi tự luận với câu trả lời ngắn để tạo ma trận nối chữ."}
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-3 transition shadow-md active:scale-95 text-sm"
                    >
                        Quay lại chủ đề
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col select-none overflow-y-auto no-scrollbar bg-gradient-to-br from-[#f8eff8] via-[#eef3fb] to-[#eff9f6] text-slate-800 px-4 py-4 md:px-8">
            {/* 1. TOP HEADER (X, Progress Bar, Timer ⏱, Star ⭐) */}
            <header className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 shrink-0 py-2">
                {/* Close Button X */}
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-50 transition active:scale-95 text-slate-500 hover:text-slate-700"
                    title="Đóng game"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Progress Bar in Center */}
                <div className="flex-1 max-w-xs h-3 bg-white/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all duration-300"
                        style={{
                            width: `${((currentIndex + 1) / questions.length) * 100}%`,
                        }}
                    />
                </div>

                {/* Right Badges: Timer and Stars */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Timer ⏱ 01:29 */}
                    <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm text-xs font-extrabold text-slate-700 border border-slate-100">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>

                    {/* Star Badge ⭐ 0 */}
                    <div className="flex items-center gap-1.5 rounded-full bg-[#fde047] px-3.5 py-1.5 shadow-sm text-xs font-black text-slate-900 border border-yellow-300">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-600" />
                        <span>{score}</span>
                    </div>
                </div>
            </header>

            {/* 2. MAIN CARD: QUESTION & WORD ANSWER SLOTS */}
            <main className="my-auto mx-auto flex w-full max-w-lg flex-col items-center py-2">
                {/* QUESTION CARD */}
                <div className="w-full rounded-[28px] bg-white p-5 md:p-6 shadow-sm border border-slate-100/80 text-center">
                    {/* Badge "CÂU 1 / 6" */}
                    <div className="inline-block rounded-full bg-purple-100/80 px-4 py-1 text-xs font-black uppercase tracking-wider text-purple-700 mb-3">
                        CÂU {currentIndex + 1} / {questions.length}
                    </div>

                    {/* Tiêu đề câu hỏi */}
                    <h2 className="text-base md:text-lg font-black text-slate-800 leading-snug px-2">
                        {currentQuestion?.questionText}
                    </h2>

                    {/* HÀNG CÁC Ô CHỮ NÉT ĐỨT (Dashed Letter Slots) */}
                    <div className="mt-5 flex items-center justify-center gap-2 flex-wrap min-h-[46px]">
                        {Array.from({ length: targetWordLength }).map((_, idx) => {
                            const filledLetter = selectedCells[idx]?.letter;
                            const isCorrectState = solvedCurrent;

                            return (
                                <div
                                    key={idx}
                                    className={`flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl text-lg md:text-xl font-black transition-all duration-200 select-none ${
                                        filledLetter
                                            ? isCorrectState
                                                ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700 scale-105 shadow-sm"
                                                : "border-2 border-purple-500 bg-purple-50 text-purple-700 scale-105 shadow-sm"
                                            : "border-2 border-dashed border-slate-300 bg-transparent text-transparent"
                                    }`}
                                >
                                    {filledLetter || ""}
                                </div>
                            );
                        })}
                    </div>

                    {/* Hướng dẫn nhỏ */}
                    <p className="mt-3 text-[11px] md:text-xs font-medium text-slate-400">
                        Vuốt qua các chữ liền kề để ghép đáp án
                    </p>

                    {/* Giải thích sau khi trả lời đúng */}
                    {solvedCurrent && currentQuestion?.explanation && (
                        <div className="mt-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium animate-fade-in text-left">
                            <span className="font-black text-emerald-900">Giải thích: </span>
                            {currentQuestion.explanation}
                        </div>
                    )}
                </div>

                {/* 3. MATRIX GRID (4x4 or 5x5 pastel blocks) */}
                <div className="mt-5 mb-3 flex flex-col items-center">
                    <div
                        className={`rounded-[30px] bg-white/70 backdrop-blur-md p-3.5 shadow-sm border border-white transition-all ${
                            shakeWrong ? "animate-shake bg-rose-50/80 border-rose-200" : ""
                        }`}
                    >
                        <div
                            className="grid gap-2.5 md:gap-3"
                            style={{
                                gridTemplateColumns: `repeat(${grid.length || 4}, minmax(0, 1fr))`,
                            }}
                        >
                            {grid.map((row) =>
                                row.map((cell) => {
                                    const isSelected = selectedCells.some((c) => c.id === cell.id);
                                    const isHinted = showHint && cell.isTarget;

                                    return (
                                        <div
                                            key={cell.id}
                                            onPointerDown={() => handleCellPointerDown(cell)}
                                            onPointerEnter={() => handleCellPointerEnter(cell)}
                                            className={`relative flex h-14 w-14 md:h-16 md:w-16 cursor-pointer items-center justify-center rounded-2xl text-xl md:text-2xl font-black transition-all duration-150 select-none shadow-xs active:scale-95 ${
                                                isSelected
                                                    ? "bg-purple-600 text-white scale-105 shadow-md shadow-purple-300 border-2 border-purple-300 z-10"
                                                    : isHinted
                                                    ? "bg-yellow-300 text-slate-900 border-2 border-yellow-500 scale-105 animate-pulse shadow-md"
                                                    : `${cell.colorClass} hover:opacity-90`
                                            }`}
                                        >
                                            {cell.letter}

                                            {/* Hint number indicator */}
                                            {isHinted && cell.targetIndex !== undefined && (
                                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-black text-white">
                                                    {cell.targetIndex + 1}
                                                </span>
                                            )}
                                        </div>
                                    );
                                }),
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. BOTTOM ACTION BUTTONS: "💡 Gợi ý -30" & "Bỏ qua →" */}
                <div className="mt-2 flex items-center justify-center gap-3">
                    {/* Nút Gợi ý -30 */}
                    <button
                        type="button"
                        onClick={handleHint}
                        disabled={showHint || solvedCurrent}
                        className="inline-flex items-center gap-2 rounded-full bg-[#fde047] hover:bg-yellow-300 disabled:opacity-40 disabled:pointer-events-none px-6 py-2.5 text-xs md:text-sm font-black text-slate-900 shadow-sm transition active:scale-95 border border-yellow-300"
                    >
                        <Lightbulb className="h-4 w-4 text-amber-700" />
                        Gợi ý -30
                    </button>

                    {/* Nút Bỏ qua → */}
                    <button
                        type="button"
                        onClick={handleSkip}
                        disabled={solvedCurrent}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none px-6 py-2.5 text-xs md:text-sm font-black text-slate-700 shadow-sm transition active:scale-95 border border-slate-100"
                    >
                        Bỏ qua →
                    </button>
                </div>

                {/* Dòng chú thích dưới cùng */}
                <p className="mt-3 text-center text-xs font-semibold text-slate-400">
                    Khó quá? Bấm &quot;Gợi ý&quot; để thấy đường đi của đáp án.
                </p>
            </main>

            {/* 5. VICTORY / END MODAL */}
            {isFinished && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-sm rounded-[32px] bg-white p-6 md:p-8 text-center shadow-2xl border border-purple-100">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-md mb-4 animate-bounce">
                            <Trophy className="h-10 w-10 text-amber-800" />
                        </div>

                        <span className="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-purple-700">
                            Hoàn Thành Màn Chơi!
                        </span>

                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                            Chúc Mừng Bạn!
                        </h2>

                        <p className="mt-2 text-xs md:text-sm text-slate-500">
                            Bạn đã hoàn thành các câu hỏi nối từ của chủ đề <strong className="text-purple-700">{topic.name}</strong>!
                        </p>

                        <div className="my-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase">Tổng điểm</p>
                                <p className="text-2xl font-black text-amber-600">⭐ {score}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase">Câu hỏi</p>
                                <p className="text-2xl font-black text-purple-600">{questions.length} / {questions.length}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                type="button"
                                onClick={handleRestart}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#fde047] hover:bg-yellow-300 text-slate-950 font-black py-3 transition shadow-sm active:scale-95 text-sm"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Chơi lại từ đầu
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 transition active:scale-95 text-sm"
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
