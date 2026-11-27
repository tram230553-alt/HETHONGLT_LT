import React, { useState, useEffect, useCallback } from "react";
import {
    X,
    Clock,
    Star,
    Lightbulb,
    RotateCcw,
    Trophy,
    CheckCircle2,
    XCircle,
    Volume2,
    VolumeX,
    Sparkles,
    AlertCircle,
    PartyPopper,
    Gamepad2,
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
    customQuestions?: WordPuzzleQuestionDto[];
    customTitle?: string;
    onBack: () => void;
    onEarnGems?: (amount: number) => void;
    userStars?: number;
    onUseStars?: (amount: number) => boolean;
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

interface QuestionHistoryItem {
    id: string;
    questionText: string;
    wordAnswer: string;
    isCorrect: boolean;
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
            gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
        });
    }

    playWrong() {
        const ctx = this.getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }

    playVictory() {
        const ctx = this.getContext();
        if (!ctx) return;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.35);
        });
    }
}

const sounds = new SoundEffects();

/* =========================================================
   GRID GENERATOR (Straight lines + Forward L/Z Zig-Zag, NO backward zig-zag)
========================================================= */

const STRAIGHT_DIRECTIONS: [number, number][] = [
    [0, 1],   // Ngang (trái → phải)
    [1, 0],   // Dọc (trên → dưới)
    [1, 1],   // Chéo xuống phải
    [1, -1],  // Chéo xuống trái
    [-1, 1],  // Chéo lên phải
];

const FILLER_LETTERS = "AABCDEEEGHIKLMNNNOOPPQRSTTUUVXY";

function buildForwardZigZagPath(wordLen: number): { path: [number, number][]; size: number } {
    // Tạo đường zíc-zắc tiến gồm 2-3 đoạn thẳng vuông góc (chỉ đi phải [0,1] và xuống [1,0], không bao giờ đi ngược)
    const numSegments = wordLen >= 6 ? 3 : 2;
    const lengths: number[] = [];
    let remaining = wordLen - 1; // tổng số bước di chuyển

    for (let s = 0; s < numSegments; s++) {
        const segsLeft = numSegments - s;
        if (s === numSegments - 1) {
            lengths.push(remaining);
        } else {
            const minLen = 1;
            const maxLen = Math.max(1, remaining - (segsLeft - 1));
            const ideal = Math.max(minLen, Math.min(maxLen, Math.round(remaining / segsLeft)));
            const chosen = minLen + Math.floor(Math.random() * (Math.min(maxLen, ideal + 1) - minLen + 1));
            lengths.push(chosen);
            remaining -= chosen;
        }
    }

    // Luân phiên hướng ngang [0, 1] và dọc [1, 0]
    let horizontal = Math.random() < 0.5;
    const rawPath: [number, number][] = [[0, 0]];
    let r = 0;
    let c = 0;
    for (const segLen of lengths) {
        const dr = horizontal ? 0 : 1;
        const dc = horizontal ? 1 : 0;
        for (let i = 0; i < segLen; i++) {
            r += dr;
            c += dc;
            rawPath.push([r, c]);
        }
        horizontal = !horizontal;
    }

    const spanR = r + 1;
    const spanC = c + 1;
    const size = Math.max(4, spanR, spanC);

    // Dịch chuyển ngẫu nhiên vào vị trí hợp lệ trong lưới size x size
    const offsetR = Math.floor(Math.random() * (size - spanR + 1));
    const offsetC = Math.floor(Math.random() * (size - spanC + 1));
    const path: [number, number][] = rawPath.map(([pr, pc]) => [pr + offsetR, pc + offsetC]);

    return { path, size };
}

function generatePuzzleGrid(targetWord: string): { grid: Cell[][]; path: [number, number][] } {
    const cleaned = (targetWord || "").toUpperCase().replace(/[^A-Z0-9À-Ỹ]/g, "");
    const wordLen = Math.max(cleaned.length, 2);

    // Với từ >= 4 ký tự: 50% xếp zíc-zắc tiến (đoạn thẳng bẻ góc 90°, không đi ngược), 50% xếp 1 đường thẳng (ngang, dọc, chéo)
    // Với từ dài > 7 ký tự: ưu tiên zíc-zắc tiến để bảng cờ gọn đẹp, không quá to
    const useZigZag = wordLen >= 4 && (wordLen > 7 || Math.random() < 0.5);

    let size = Math.max(4, wordLen);
    let path: [number, number][] = [];

    if (useZigZag) {
        const zz = buildForwardZigZagPath(wordLen);
        path = zz.path;
        size = zz.size;
    } else {
        const shuffledDirs = [...STRAIGHT_DIRECTIONS].sort(() => Math.random() - 0.5);
        for (const [dr, dc] of shuffledDirs) {
            const minR = dr === -1 ? wordLen - 1 : 0;
            const maxR = dr === 1 ? size - wordLen : size - 1;
            const minC = dc === -1 ? wordLen - 1 : 0;
            const maxC = dc === 1 ? size - wordLen : size - 1;

            if (minR <= maxR && minC <= maxC) {
                const startR = minR + Math.floor(Math.random() * (maxR - minR + 1));
                const startC = minC + Math.floor(Math.random() * (maxC - minC + 1));

                for (let i = 0; i < wordLen; i++) {
                    path.push([startR + dr * i, startC + dc * i]);
                }
                break;
            }
        }

        // Fallback an toàn: đặt ngang ở hàng đầu tiên
        if (path.length === 0) {
            for (let i = 0; i < wordLen; i++) {
                path.push([0, i]);
            }
        }
    }

    const matrix: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const pathMap = new Map<string, number>();
    path.forEach(([r, c], idx) => {
        matrix[r][c] = cleaned[idx] || "A";
        pathMap.set(`${r},${c}`, idx);
    });

    const grid: Cell[][] = [];
    for (let r = 0; r < size; r++) {
        const rowCells: Cell[] = [];
        for (let c = 0; c < size; c++) {
            const isTarget = pathMap.has(`${r},${c}`);
            const targetIdx = pathMap.get(`${r},${c}`);
            let char = matrix[r][c];
            if (!char) {
                char = FILLER_LETTERS[Math.floor(Math.random() * FILLER_LETTERS.length)];
            }
            const color = PASTEL_COLORS[(r * size + c) % PASTEL_COLORS.length];
            rowCells.push({
                id: `c-${r}-${c}`,
                row: r,
                col: c,
                letter: char,
                colorClass: color,
                isTarget,
                targetIndex: targetIdx,
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
    customQuestions,
    customTitle,
    onBack,
    onEarnGems,
    userStars = 0,
    onUseStars,
}: WordPuzzleGameViewProps) {
    const [questions, setQuestions] = useState<WordPuzzleQuestionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Trạng thái chơi & Thống kê đúng/sai
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120); // 2:00
    const [soundOn, setSoundOn] = useState(true);

    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [historyResults, setHistoryResults] = useState<QuestionHistoryItem[]>([]);

    // Grid và lựa chọn
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [targetPath, setTargetPath] = useState<[number, number][]>([]);
    const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Hiệu ứng trạng thái
    const [solvedCurrent, setSolvedCurrent] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [shakeWrong, setShakeWrong] = useState(false);
    const [starToast, setStarToast] = useState<string | null>(null);

    // Màn kết thúc
    const [isFinished, setIsFinished] = useState(false);

    // Tải câu hỏi từ Backend
    useEffect(() => {
        let mounted = true;
        if (customQuestions && customQuestions.length > 0) {
            setQuestions(customQuestions);
            initQuestion(0, customQuestions[0]);
            setLoading(false);
            return;
        }
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
    }, [topic.id, customQuestions]);

    // Đồng hồ đếm ngược
    useEffect(() => {
        if (loading || isFinished || questions.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Khi hết giờ, tính các câu còn lại là sai/chưa xong
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, isFinished, questions.length, currentIndex, correctCount, wrongCount]);

    const handleTimeOut = () => {
        setIsFinished(true);
        sounds.playVictory();
    };

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
    const targetWordLength = (currentQuestion?.wordAnswer || "").length;

    // Toggle âm thanh
    const toggleSound = () => {
        sounds.enabled = !soundOn;
        setSoundOn(!soundOn);
    };

    // Format thời gian 01:29
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // Bắt đầu vuốt từ 1 ô
    const handleCellPointerDown = (cell: Cell) => {
        if (solvedCurrent) return;
        setIsDragging(true);
        setSelectedCells([cell]);
        sounds.playSelect(0);
    };

    // Di chuyển qua ô kế tiếp (cho phép đường thẳng ngang/dọc/chéo và zíc-zắc tiến theo đoạn thẳng, KHÔNG cho đi ngược)
    const handleCellPointerEnter = (cell: Cell) => {
        if (!isDragging || solvedCurrent || selectedCells.length === 0) return;

        const lastCell = selectedCells[selectedCells.length - 1];
        if (lastCell.id === cell.id) return;

        // Quay lui 1 bước (undo ô vừa chọn)
        if (selectedCells.length >= 2 && selectedCells[selectedCells.length - 2].id === cell.id) {
            setSelectedCells((prev) => prev.slice(0, prev.length - 1));
            sounds.playSelect(Math.max(0, selectedCells.length - 2));
            return;
        }

        // Tránh chọn lại ô đã đi qua
        if (selectedCells.some((c) => c.id === cell.id)) return;

        // Phải liền kề với ô cuối cùng
        const dr = cell.row - lastCell.row;
        const dc = cell.col - lastCell.col;
        if (Math.abs(dr) > 1 || Math.abs(dc) > 1) return;

        // Kiểm tra không được nối zíc-zắc ngược (không đảo chiều hàng hoặc cột đã đi trước đó)
        if (selectedCells.length >= 2) {
            let lockedRowDir = 0;
            let lockedColDir = 0;
            for (let i = 1; i < selectedCells.length; i++) {
                const stepR = Math.sign(selectedCells[i].row - selectedCells[i - 1].row);
                const stepC = Math.sign(selectedCells[i].col - selectedCells[i - 1].col);
                if (stepR !== 0 && lockedRowDir === 0) lockedRowDir = stepR;
                if (stepC !== 0 && lockedColDir === 0) lockedColDir = stepC;
            }

            if (lockedRowDir !== 0 && dr !== 0 && Math.sign(dr) !== lockedRowDir) return;
            if (lockedColDir !== 0 && dc !== 0 && Math.sign(dc) !== lockedColDir) return;

            // Không cho rẽ góc nhọn ngược (> 90°) so với bước liền trước
            const prevDr = lastCell.row - selectedCells[selectedCells.length - 2].row;
            const prevDc = lastCell.col - selectedCells[selectedCells.length - 2].col;
            if (prevDr * dr + prevDc * dc < 0) return;
        }

        const nextList = [...selectedCells, cell];
        setSelectedCells(nextList);
        sounds.playSelect(nextList.length - 1);
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
            // ĐÚNG ĐÁP ÁN!
            setSolvedCurrent(true);
            sounds.playCorrect();

            const earned = 100;
            setScore((s) => s + earned);
            setCorrectCount((c) => c + 1);

            // Ghi nhận câu trả lời đúng vào lịch sử màn chơi
            setHistoryResults((prev) => [
                ...prev,
                {
                    id: currentQuestion.id,
                    questionText: currentQuestion.questionText || (currentQuestion as unknown as { noiDung?: string })?.noiDung || "",
                    wordAnswer: currentQuestion.wordAnswer,
                    isCorrect: true,
                },
            ]);

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
            // SAI TỪ
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

    // Bấm nút "Gợi ý" (Dùng 1 ⭐ tích lũy)
    const handleHint = () => {
        if (solvedCurrent || showHint) return;

        // Kiểm tra học sinh có đủ sao tích lũy không
        const currentStars = userStars ?? 0;
        if (currentStars < 1) {
            setStarToast("Bạn chưa đủ sao! Hãy hoàn thành thêm bài học để nhận sao tích lũy ⭐");
            setTimeout(() => setStarToast(null), 3200);
            return;
        }

        // Trừ 1 sao
        if (onUseStars) {
            const success = onUseStars(1);
            if (!success) {
                setStarToast("Bạn chưa đủ sao! Hãy hoàn thành thêm bài học để nhận sao tích lũy ⭐");
                setTimeout(() => setStarToast(null), 3200);
                return;
            }
        }

        setShowHint(true);
        setStarToast("Đã dùng 1 ⭐ để mở gợi ý câu hỏi!");
        setTimeout(() => setStarToast(null), 2500);
        sounds.playSelect(4);
    };

    // Bấm nút "Bỏ qua →"
    const handleSkip = () => {
        if (solvedCurrent) return;

        // Tăng số câu sai/bỏ qua
        setWrongCount((w) => w + 1);
        setHistoryResults((prev) => [
            ...prev,
            {
                id: currentQuestion.id,
                questionText: currentQuestion.questionText || (currentQuestion as unknown as { noiDung?: string })?.noiDung || "",
                wordAnswer: currentQuestion.wordAnswer,
                isCorrect: false,
            },
        ]);

        if (currentIndex + 1 < questions.length) {
            initQuestion(currentIndex + 1, questions[currentIndex + 1]);
        } else {
            setIsFinished(true);
            sounds.playVictory();
        }
    };

    // Chơi lại
    const handleRestart = () => {
        setScore(0);
        setTimeLeft(120);
        setCorrectCount(0);
        setWrongCount(0);
        setHistoryResults([]);
        setIsFinished(false);
        if (questions.length > 0) {
            initQuestion(0, questions[0]);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-[var(--theme-bg)] p-6">
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
            <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[var(--theme-bg)] p-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-purple-100">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Chưa có câu hỏi nối chữ</h2>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        {error || "Chủ đề này chưa có câu hỏi tự luận để tạo màn chơi game nối chữ."}
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

    const accuracyRate = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const finalWrongCount = questions.length - correctCount;

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col select-none overflow-y-auto no-scrollbar bg-[var(--theme-bg)] text-slate-800 px-4 py-4 md:px-8">
            {/* THÔNG BÁO SAO (TOAST) */}
            {starToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-slate-900/90 text-white px-5 py-2.5 text-xs font-bold shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{starToast}</span>
                </div>
            )}

            {/* 1. TOP HEADER (X, Progress Bar, Timer ⏱, Stars ⭐, Score) */}
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
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                        style={{
                            width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%`,
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Timer ⏱ 01:29 */}
                    <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm text-xs font-extrabold text-slate-700 border border-slate-100">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>

                    {/* Số sao tích điểm của học sinh ⭐ */}
                    <div 
                        className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 shadow-sm text-xs font-black text-amber-700 border border-amber-200"
                        title="Số sao tích điểm của bạn (học xong bài để nhận thêm, dùng 1 ⭐ cho mỗi gợi ý)"
                    >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        <span>{userStars}</span>
                    </div>

                    {/* Mute/Unmute */}
                    <button
                        type="button"
                        onClick={toggleSound}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-slate-500 hover:text-slate-800 transition"
                        title={soundOn ? "Tắt âm" : "Bật âm"}
                    >
                        {soundOn ? <Volume2 className="h-4 w-4 text-emerald-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
                    </button>
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
                        {currentQuestion?.questionText || (currentQuestion as unknown as { noiDung?: string })?.noiDung}
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
                        Vuốt theo đường ngang, dọc, chéo hoặc zíc-zắc tiến để ghép đáp án
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
                            className={`grid ${grid.length > 7 ? "gap-1.5" : "gap-2 sm:gap-2.5 md:gap-3"}`}
                            style={{
                                gridTemplateColumns: `repeat(${grid.length || 4}, minmax(0, 1fr))`,
                            }}
                        >
                            {grid.map((row) =>
                                row.map((cell) => {
                                    const isSelected = selectedCells.some((c) => c.id === cell.id);
                                    const isHinted =
                                        showHint &&
                                        targetPath.slice(0, 2).some(([r, c]) => r === cell.row && c === cell.col);
                                    const cellSizeClass =
                                        grid.length <= 5
                                            ? "h-14 w-14 sm:h-16 sm:w-16 text-2xl sm:text-3xl rounded-2xl"
                                            : grid.length <= 7
                                            ? "h-10 w-10 sm:h-12 sm:w-12 text-lg sm:text-2xl rounded-xl"
                                            : "h-8 w-8 sm:h-10 sm:w-10 text-sm sm:text-lg rounded-lg";

                                    return (
                                        <div
                                            key={cell.id}
                                            onPointerDown={() => handleCellPointerDown(cell)}
                                            onPointerEnter={() => handleCellPointerEnter(cell)}
                                            className={`relative flex cursor-pointer items-center justify-center font-black transition-all duration-150 select-none shadow-xs ${cellSizeClass} ${
                                                isSelected
                                                    ? "bg-[#a855f7] text-white scale-105 shadow-md shadow-purple-300 ring-2 ring-purple-400"
                                                    : isHinted
                                                    ? "bg-amber-300 text-amber-950 animate-pulse scale-105 ring-2 ring-amber-400 shadow-md"
                                                    : `${cell.colorClass} hover:brightness-95 active:scale-95`
                                            }`}
                                        >
                                            {cell.letter}
                                        </div>
                                    );
                                }),
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. ACTIONS: GỢI Ý (⭐ 1) & BỎ QUA */}
                <div className="mt-2 flex items-center justify-center gap-4">
                    {/* Nút Gợi ý (tốn 1 sao tích lũy) */}
                    <button
                        type="button"
                        onClick={handleHint}
                        disabled={solvedCurrent || showHint}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-amber-50 disabled:opacity-40 disabled:pointer-events-none px-6 py-2.5 text-xs md:text-sm font-black text-amber-700 shadow-sm transition active:scale-95 border border-amber-200"
                        title="Dùng 1 sao tích điểm để mở gợi ý"
                    >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        Gợi ý (1 ⭐)
                    </button>

                    {/* Nút Bỏ qua câu hỏi */}
                    <button
                        type="button"
                        onClick={handleSkip}
                        disabled={solvedCurrent}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none px-6 py-2.5 text-xs md:text-sm font-black text-slate-700 shadow-sm transition active:scale-95 border border-slate-100"
                    >
                        Bỏ qua →
                    </button>
                </div>

                <p className="mt-3 text-center text-xs font-semibold text-slate-400">
                    Khó quá? Dùng sao tích lũy để bấm &quot;Gợi ý&quot; xem đường đi của đáp án.
                </p>
            </main>

            {/* 5. VICTORY / END MODAL - BẢNG KẾT QUẢ ĐÚNG / SAI CHÍNH XÁC */}
            {isFinished && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 md:p-8 text-center shadow-2xl border border-purple-100 my-auto">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-md mb-4 animate-bounce">
                            <Trophy className="h-10 w-10 text-amber-800" />
                        </div>

                        <span className="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-purple-700">
                            Kết Quả Màn Chơi
                        </span>

                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                            {correctCount === questions.length ? "Xuất Sắc! Hoàn Hảo!" : "Hoàn Thành Màn Chơi!"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Chủ đề: <strong className="text-purple-700">{customTitle || topic.name}</strong>
                        </p>

                        {/* BẢNG THỐNG KÊ SỐ LƯỢNG ĐÚNG, SAI CHÍNH XÁC */}
                        <div className="my-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                            {/* Câu đúng */}
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-center">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">Đúng</p>
                                <p className="text-xl font-black text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {correctCount}
                                </p>
                            </div>

                            {/* Câu sai / bỏ qua */}
                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-center">
                                <p className="text-[10px] font-bold text-rose-600 uppercase">Sai / Bỏ qua</p>
                                <p className="text-xl font-black text-rose-700 flex items-center justify-center gap-1 mt-0.5">
                                    <XCircle className="h-4 w-4" />
                                    {finalWrongCount}
                                </p>
                            </div>

                            {/* Tỉ lệ chính xác */}
                            <div className="rounded-xl bg-purple-50 border border-purple-200 p-2 text-center">
                                <p className="text-[10px] font-bold text-purple-600 uppercase">Chính xác</p>
                                <p className="text-xl font-black text-purple-700 mt-0.5">
                                    {accuracyRate}%
                                </p>
                            </div>
                        </div>

                        {/* Danh sách câu hỏi chi tiết */}
                        {historyResults.length > 0 && (
                            <div className="mb-5 max-h-40 overflow-y-auto rounded-2xl bg-slate-50 border border-slate-100 p-3 text-left space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chi tiết câu hỏi</p>
                                {historyResults.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs gap-2 py-1 border-b border-slate-200/60 last:border-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {item.isCorrect ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                            )}
                                            <span className="truncate text-slate-700 font-medium">Câu {idx + 1}: {item.questionText}</span>
                                        </div>
                                        <span className={`font-black uppercase shrink-0 ${item.isCorrect ? "text-emerald-600" : "text-rose-500"}`}>
                                            {item.wordAnswer}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

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
