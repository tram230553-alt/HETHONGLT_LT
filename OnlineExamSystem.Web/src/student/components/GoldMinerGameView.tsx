import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    X,
    Clock,
    Star,
    RotateCcw,
    Trophy,
    CheckCircle2,
    XCircle,
    Volume2,
    VolumeX,
    Sparkles,
    AlertCircle,
    Gem,
    ArrowDown,
} from "lucide-react";
import type { TopicDto } from "../../services/topicService";
import type { ChessQuestionDto } from "../../services/practiceService";

/* =========================================================
   PROPS & TYPES
========================================================= */

interface GoldMinerGameViewProps {
    topic: TopicDto;
    customQuestions?: ChessQuestionDto[];
    customTitle?: string;
    onBack: () => void;
    onEarnGems?: (amount: number) => void;
    userStars?: number;
    onUseStars?: (amount: number) => boolean;
}

interface MineItem {
    id: number;
    x: number;
    y: number;
    type: "gold_l" | "gold_m" | "gold_s" | "diamond" | "stone" | "mystery";
    radius: number;
    points: number;
    weight: number; // Tốc độ kéo (1 = nhanh, 3 = chậm)
    color: string;
    label: string;
    icon: string;
}

interface QuestionHistoryItem {
    id: string;
    questionText: string;
    userAnswer: string;
    isCorrect: boolean;
    pointsEarned: number;
}

/* =========================================================
   SOUND SYNTHESIZER
========================================================= */

const playChime = (type: "correct" | "wrong" | "launch" | "reel" | "fanfare") => {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (type === "launch") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === "correct") {
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.15, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.22);
            });
        } else if (type === "wrong") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(160, now + 0.12);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } else if (type === "fanfare") {
            const chord = [523.25, 659.25, 783.99, 1046.5];
            chord.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
                gain.gain.setValueAtTime(0.2, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.6);
            });
        }
    } catch {
        // Ignore audio errors
    }
};

/* =========================================================
   GENERATE MINE ITEMS
========================================================= */

const generateMineItems = (width: number, height: number): MineItem[] => {
    const items: MineItem[] = [];
    let idCounter = 1;

    const templates: Omit<MineItem, "id" | "x" | "y">[] = [
        { type: "diamond", radius: 14, points: 150, weight: 0.9, color: "#38bdf8", label: "Kim Cương", icon: "💎" },
        { type: "diamond", radius: 14, points: 150, weight: 0.9, color: "#38bdf8", label: "Kim Cương", icon: "💎" },
        { type: "gold_l", radius: 28, points: 100, weight: 2.2, color: "#eab308", label: "Vàng To", icon: "🟡" },
        { type: "gold_l", radius: 28, points: 100, weight: 2.2, color: "#eab308", label: "Vàng To", icon: "🟡" },
        { type: "gold_m", radius: 20, points: 50, weight: 1.4, color: "#facc15", label: "Vàng Vừa", icon: "🪙" },
        { type: "gold_m", radius: 20, points: 50, weight: 1.4, color: "#facc15", label: "Vàng Vừa", icon: "🪙" },
        { type: "gold_s", radius: 15, points: 25, weight: 1.0, color: "#fde047", label: "Vàng Nhỏ", icon: "✨" },
        { type: "gold_s", radius: 15, points: 25, weight: 1.0, color: "#fde047", label: "Vàng Nhỏ", icon: "✨" },
        { type: "mystery", radius: 18, points: 80, weight: 1.2, color: "#ec4899", label: "Túi Bí Ẩn", icon: "🎁" },
        { type: "stone", radius: 24, points: 15, weight: 2.6, color: "#94a3b8", label: "Đá Núi", icon: "🪨" },
        { type: "stone", radius: 22, points: 15, weight: 2.5, color: "#94a3b8", label: "Đá Núi", icon: "🪨" },
    ];

    // Distribute items in the lower 70% of canvas
    const minY = 120;
    const maxY = height - 40;
    const minX = 40;
    const maxX = width - 40;

    templates.forEach((tmpl) => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 50) {
            attempts++;
            const rx = minX + Math.random() * (maxX - minX);
            const ry = minY + Math.random() * (maxY - minY);
            const collision = items.some((it) => {
                const dist = Math.hypot(it.x - rx, it.y - ry);
                return dist < it.radius + tmpl.radius + 15;
            });
            if (!collision) {
                items.push({
                    id: idCounter++,
                    x: rx,
                    y: ry,
                    ...tmpl,
                });
                placed = true;
            }
        }
    });

    return items;
};

/* =========================================================
   COMPONENT: GOLD MINER GAME VIEW
========================================================= */

export default function GoldMinerGameView({
    topic,
    customQuestions = [],
    customTitle,
    onBack,
    onEarnGems,
    userStars = 0,
    onUseStars,
}: GoldMinerGameViewProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Gameplay states
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(90); // 90 giây
    const [soundOn, setSoundOn] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "star" } | null>(null);

    // Modal câu hỏi khi kéo được đồ
    const [caughtItem, setCaughtItem] = useState<MineItem | null>(null);
    const [activeQuestion, setActiveQuestion] = useState<ChessQuestionDto | null>(null);
    const [questionCursor, setQuestionCursor] = useState(0);
    const [modalTimeLeft, setModalTimeLeft] = useState(25);
    const [showHint, setShowHint] = useState(false);
    const [essayInput, setEssayInput] = useState("");

    // Statistics
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [history, setHistory] = useState<QuestionHistoryItem[]>([]);

    // Hook physics state (tracked in ref to avoid lag in animation loop)
    const hookState = useRef<{
        status: "swinging" | "shooting" | "reeling";
        angle: number;
        angleDir: number;
        originX: number;
        originY: number;
        length: number;
        minLength: number;
        maxLength: number;
        speed: number;
        reelSpeed: number;
        grabbedItem: MineItem | null;
        items: MineItem[];
    }>({
        status: "swinging",
        angle: 0,
        angleDir: 1,
        originX: 400,
        originY: 50,
        length: 45,
        minLength: 45,
        maxLength: 550,
        speed: 12,
        reelSpeed: 8,
        grabbedItem: null,
        items: [],
    });

    const showToast = useCallback((text: string, type: "success" | "error" | "star" = "success") => {
        setToastMsg({ text, type });
        setTimeout(() => {
            setToastMsg((prev) => (prev?.text === text ? null : prev));
        }, 2500);
    }, []);

    // Khởi tạo mỏ vàng
    const initGame = useCallback(() => {
        const w = 800;
        const h = 500;
        const items = generateMineItems(w, h);
        hookState.current = {
            status: "swinging",
            angle: 0,
            angleDir: 1,
            originX: w / 2,
            originY: 50,
            length: 45,
            minLength: 45,
            maxLength: Math.hypot(w / 2, h - 50) + 20,
            speed: 12,
            reelSpeed: 8,
            grabbedItem: null,
            items: items,
        };
        setScore(0);
        setTimeLeft(90);
        setIsFinished(false);
        setCaughtItem(null);
        setActiveQuestion(null);
        setCorrectCount(0);
        setWrongCount(0);
        setHistory([]);
    }, []);

    useEffect(() => {
        initGame();
    }, [initGame]);

    // Đồng hồ đếm ngược tổng thời gian chơi
    useEffect(() => {
        if (isFinished || activeQuestion !== null) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsFinished(true);
                    if (soundOn) playChime("fanfare");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isFinished, activeQuestion, soundOn]);

    // Đồng hồ câu hỏi modal
    useEffect(() => {
        if (!activeQuestion) return;
        setModalTimeLeft(25);
        const timer = setInterval(() => {
            setModalTimeLeft((prev) => {
                if (prev <= 1) {
                    // Hết giờ trả lời
                    handleAnswer(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [activeQuestion]);

    // Thả móc
    const handleShootClaw = useCallback(() => {
        if (hookState.current.status !== "swinging" || activeQuestion || isFinished) return;
        hookState.current.status = "shooting";
        if (soundOn) playChime("launch");
    }, [activeQuestion, isFinished, soundOn]);

    // Bàn phím điều khiển (Space hoặc Mũi tên xuống để thả móc)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.code === "ArrowDown") {
                if (!activeQuestion && !isFinished) {
                    e.preventDefault();
                    handleShootClaw();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleShootClaw, activeQuestion, isFinished]);

    // Trả lời câu hỏi
    const handleAnswer = (userAns: string | boolean | null) => {
        if (!activeQuestion || !caughtItem) return;

        let isCorrect = false;
        const qType = activeQuestion.type;

        if (userAns === null) {
            isCorrect = false;
        } else if (qType === "true_false" || typeof userAns === "boolean") {
            const expected = activeQuestion.isTrue ?? (String(activeQuestion.correctAnswer).toLowerCase() === "true");
            isCorrect = userAns === expected;
        } else if (qType === "essay") {
            const normUser = String(userAns).trim().toLowerCase();
            const normAns = (activeQuestion.correctAnswer || "").trim().toLowerCase();
            isCorrect = normUser.length > 0 && (normUser === normAns || normAns.includes(normUser));
        } else {
            // Trắc nghiệm
            const chosen = String(userAns).trim().toUpperCase();
            const correct = (activeQuestion.correctAnswer || "").trim().toUpperCase();
            isCorrect = chosen === correct || chosen.includes(correct);
        }

        const pts = isCorrect ? caughtItem.points : 0;

        if (isCorrect) {
            setScore((prev) => prev + pts);
            setCorrectCount((prev) => prev + 1);
            if (soundOn) playChime("correct");
            showToast(`+${pts} điểm! Chính xác 🎉`, "success");
            onEarnGems?.(Math.max(5, Math.floor(pts / 10)));
            // Xóa item khỏi danh sách items còn lại trong mỏ
            hookState.current.items = hookState.current.items.filter((it) => it.id !== caughtItem.id);
        } else {
            setWrongCount((prev) => prev + 1);
            if (soundOn) playChime("wrong");
            showToast("Chưa đúng! Món đồ đã bị rơi mất 😢", "error");
        }

        setHistory((prev) => [
            {
                id: activeQuestion.id,
                questionText: activeQuestion.noiDung || activeQuestion.questionText || "Câu hỏi đào vàng",
                userAnswer: String(userAns ?? "Hết giờ"),
                isCorrect,
                pointsEarned: pts,
            },
            ...prev,
        ]);

        // Đóng modal và cho phép móc tiếp
        setActiveQuestion(null);
        setCaughtItem(null);
        setShowHint(false);
        setEssayInput("");
        hookState.current.status = "swinging";

        // Nếu đã đào hết đồ thì kết thúc
        if (hookState.current.items.length === 0) {
            setIsFinished(true);
            if (soundOn) playChime("fanfare");
        }
    };

    // Dùng sao mua gợi ý
    const handleUseStarHint = () => {
        if (userStars < 1) {
            showToast("Bạn không đủ sao! Hãy hoàn thành bài học để nhận thêm ⭐", "error");
            return;
        }
        if (onUseStars && !onUseStars(1)) {
            showToast("Không thể trừ sao!", "error");
            return;
        }
        setShowHint(true);
        if (soundOn) playChime("launch");
        showToast("Đã dùng 1 ⭐ để mở gợi ý!", "star");
    };

    // Animation Loop trên Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;

        const render = () => {
            const hs = hookState.current;
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            // Nền mỏ vàng pastel
            // Vùng trên mặt đất
            ctx.fillStyle = "#fef08a"; // Vàng sáng
            ctx.fillRect(0, 0, w, 70);

            // Đường ranh giới mỏ
            ctx.fillStyle = "#ca8a04";
            ctx.fillRect(0, 68, w, 4);

            // Vùng lòng đất mỏ vàng (pastel ấm áp)
            const grad = ctx.createLinearGradient(0, 70, 0, h);
            grad.addColorStop(0, "#fefce8");
            grad.addColorStop(1, "#fef3c7");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 72, w, h - 72);

            // Vẽ các đốm đất / vân khoáng sản nhỏ trang trí
            ctx.fillStyle = "#fde04733";
            ctx.beginPath();
            ctx.arc(100, 150, 40, 0, Math.PI * 2);
            ctx.arc(320, 280, 50, 0, Math.PI * 2);
            ctx.arc(650, 200, 60, 0, Math.PI * 2);
            ctx.arc(480, 400, 45, 0, Math.PI * 2);
            ctx.fill();

            // Cập nhật góc quay khi swinging
            if (hs.status === "swinging") {
                hs.angle += 0.024 * hs.angleDir;
                if (hs.angle > 1.1) hs.angleDir = -1;
                if (hs.angle < -1.1) hs.angleDir = 1;
            }

            // Tính vị trí đầu móc
            const clawX = hs.originX + Math.sin(hs.angle) * hs.length;
            const clawY = hs.originY + Math.cos(hs.angle) * hs.length;

            // Xử lý khi móc đang bay ra (shooting)
            if (hs.status === "shooting") {
                hs.length += hs.speed;

                // Kiểm tra va chạm với các item
                for (let i = 0; i < hs.items.length; i++) {
                    const item = hs.items[i];
                    const dist = Math.hypot(clawX - item.x, clawY - item.y);
                    if (dist < item.radius + 12) {
                        // Bắt trúng item!
                        hs.grabbedItem = item;
                        hs.status = "reeling";
                        hs.reelSpeed = Math.max(3, 10 / item.weight);
                        break;
                    }
                }

                // Nếu chạm mép canvas hoặc đạt độ dài tối đa mà không trúng gì
                if (
                    hs.status === "shooting" &&
                    (clawX < 10 || clawX > w - 10 || clawY > h - 10 || hs.length >= hs.maxLength)
                ) {
                    hs.status = "reeling";
                    hs.reelSpeed = 12;
                }
            }

            // Xử lý khi móc đang kéo về (reeling)
            if (hs.status === "reeling") {
                hs.length -= hs.reelSpeed;

                // Cập nhật vị trí của item bị bắt theo đầu móc
                if (hs.grabbedItem) {
                    hs.grabbedItem.x = clawX;
                    hs.grabbedItem.y = clawY;
                }

                // Khi kéo về đến nơi
                if (hs.length <= hs.minLength) {
                    hs.length = hs.minLength;
                    if (hs.grabbedItem) {
                        const caught = hs.grabbedItem;
                        hs.grabbedItem = null;

                        // Chọn câu hỏi cho item này
                        if (customQuestions.length > 0) {
                            const q = customQuestions[questionCursor % customQuestions.length];
                            setQuestionCursor((c) => c + 1);
                            setCaughtItem(caught);
                            setActiveQuestion(q);
                        } else {
                            // Dự phòng nếu không có câu hỏi: cộng điểm trực tiếp
                            setScore((s) => s + caught.points);
                            setCorrectCount((c) => c + 1);
                            hs.items = hs.items.filter((it) => it.id !== caught.id);
                            hs.status = "swinging";
                            showToast(`+${caught.points} điểm!`, "success");
                        }
                    } else {
                        hs.status = "swinging";
                    }
                }
            }

            // Vẽ các vật phẩm khoáng sản
            hs.items.forEach((item) => {
                ctx.save();
                ctx.translate(item.x, item.y);

                // Bóng đổ
                ctx.beginPath();
                ctx.arc(2, 4, item.radius, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0,0,0,0.08)";
                ctx.fill();

                // Hình tròn thân vật phẩm
                ctx.beginPath();
                ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
                ctx.fillStyle = item.color;
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();

                // Icon / Biểu tượng
                ctx.font = `${Math.round(item.radius * 1.05)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(item.icon, 0, 1);

                // Điểm số nhỏ xinh bên dưới
                ctx.font = "bold 9px sans-serif";
                ctx.fillStyle = "#713f12";
                ctx.fillText(`+${item.points}`, 0, item.radius + 10);

                ctx.restore();
            });

            // Vẽ dây móc
            ctx.beginPath();
            ctx.moveTo(hs.originX, hs.originY);
            ctx.lineTo(clawX, clawY);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#78350f";
            ctx.stroke();

            // Vẽ đầu móc / mỏ neo
            ctx.save();
            ctx.translate(clawX, clawY);
            ctx.rotate(hs.angle);

            // Thân neo
            ctx.fillStyle = "#451a03";
            ctx.fillRect(-3, -2, 6, 12);

            // Hai ngạnh móc cong
            ctx.beginPath();
            ctx.arc(-8, 8, 8, 0, Math.PI * 0.7);
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#451a03";
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(8, 8, 8, Math.PI * 0.3, Math.PI);
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#451a03";
            ctx.stroke();

            ctx.restore();

            // Vẽ cần trục / máy tời ở vị trí originX, originY
            ctx.save();
            ctx.translate(hs.originX, hs.originY - 14);

            // Bánh xe tời
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fillStyle = "#ca8a04";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#854d0e";
            ctx.stroke();

            // Tâm tời
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();

            // Người thợ mỏ hoạt hình nhỏ
            ctx.font = "24px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🤠", 0, -18);

            ctx.restore();

            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [customQuestions, questionCursor, showToast]);

    const displayName = customTitle || topic.name;

    return (
        <div className="flex h-full flex-col bg-[var(--theme-bg)] p-3 md:p-6 select-none overflow-y-auto no-scrollbar">
            {/* Header điều khiển */}
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-sm border border-yellow-200/80 mb-3 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95"
                        title="Quay lại danh sách game"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-sm md:text-base font-black text-amber-950 flex items-center gap-1.5">
                            ⛏️ Đào Vàng Kiến Thức
                        </h1>
                        <p className="text-[11px] font-bold text-amber-700 truncate max-w-[200px] md:max-w-xs">
                            {displayName}
                        </p>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Stars */}
                    <div
                        className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 border border-amber-200 text-amber-800 text-xs font-black shadow-xs cursor-pointer hover:bg-amber-100 transition"
                        title={`Bạn có ${userStars} Sao. Dùng 1 Sao trong câu hỏi để nhận gợi ý!`}
                        onClick={handleUseStarHint}
                    >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span>{userStars}</span>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>{timeLeft}s</span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 rounded-xl bg-yellow-400/20 px-3 py-1.5 border border-yellow-400/40 text-xs font-black text-yellow-900">
                        <Trophy className="h-3.5 w-3.5 text-yellow-600" />
                        <span>{score} điểm</span>
                    </div>

                    {/* Sound */}
                    <button
                        type="button"
                        onClick={() => setSoundOn(!soundOn)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition"
                    >
                        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Game Canvas Container */}
            <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-yellow-200 bg-white shadow-md">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onClick={handleShootClaw}
                    className="w-full h-auto cursor-pointer max-h-[500px] object-contain"
                />

                {/* Nút bấm thả móc to ở dưới để hỗ trợ cảm ứng và người dùng điện thoại */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button
                        type="button"
                        onClick={handleShootClaw}
                        disabled={activeQuestion !== null || isFinished}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-8 py-3 text-sm md:text-base font-black text-white shadow-lg shadow-amber-500/30 transition hover:from-amber-600 hover:to-yellow-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ArrowDown className="h-5 w-5 animate-bounce" />
                        THẢ MÓC (HOẶC NHẤN SPACE)
                    </button>
                </div>

                {/* Toast message */}
                {toastMsg && (
                    <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-bounce">
                        <div
                            className={`rounded-2xl px-4 py-2 text-xs md:text-sm font-black shadow-lg backdrop-blur-md ${
                                toastMsg.type === "success"
                                    ? "bg-emerald-500 text-white"
                                    : toastMsg.type === "error"
                                      ? "bg-rose-500 text-white"
                                      : "bg-amber-400 text-amber-950"
                            }`}
                        >
                            {toastMsg.text}
                        </div>
                    </div>
                )}
            </div>

            {/* =========================================================
               MODAL CÂU HỎI KHI KÉO ĐƯỢC ITEM
            ========================================================= */}
            {activeQuestion && caughtItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 md:p-7 shadow-2xl border-2 border-yellow-300 animate-scale-up">
                        {/* Header Item Badge */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-900 border border-yellow-200">
                                <span>{caughtItem.icon}</span>
                                <span>Kéo được {caughtItem.label} (+{caughtItem.points}đ)</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    {modalTimeLeft}s
                                </span>
                                {userStars > 0 && !showHint && (
                                    <button
                                        type="button"
                                        onClick={handleUseStarHint}
                                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800 hover:bg-amber-200 transition"
                                        title="Dùng 1 sao xem gợi ý"
                                    >
                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                        Gợi ý (-1⭐)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Question Content */}
                        <h2 className="text-base md:text-lg font-black text-slate-800 leading-snug">
                            {activeQuestion.noiDung || activeQuestion.questionText}
                        </h2>

                        {/* Hint container if unlocked */}
                        {showHint && (
                            <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 animate-fade-in flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Gợi ý từ sao:</p>
                                    <p className="mt-0.5">{activeQuestion.explanation || `Đáp án đúng là: ${activeQuestion.correctAnswer || (activeQuestion.isTrue ? "Đúng" : "Sai")}`}</p>
                                </div>
                            </div>
                        )}

                        {/* Answers depending on question type */}
                        <div className="mt-5">
                            {/* DẠNG 1: ĐÚNG / SAI */}
                            {(activeQuestion.type === "true_false" || (!activeQuestion.optionA && !activeQuestion.optionB)) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleAnswer(true)}
                                        className="py-4 rounded-2xl font-black text-base md:text-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:scale-95 transition border-2 border-emerald-300 shadow-sm"
                                    >
                                        ĐÚNG
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAnswer(false)}
                                        className="py-4 rounded-2xl font-black text-base md:text-lg bg-rose-100 text-rose-800 hover:bg-rose-200 active:scale-95 transition border-2 border-rose-300 shadow-sm"
                                    >
                                        SAI
                                    </button>
                                </div>
                            )}

                            {/* DẠNG 2: TRẮC NGHIỆM ABCD */}
                            {activeQuestion.type !== "true_false" && activeQuestion.type !== "essay" && (activeQuestion.optionA || activeQuestion.optionB) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {[
                                        { key: "A", text: activeQuestion.optionA },
                                        { key: "B", text: activeQuestion.optionB },
                                        { key: "C", text: activeQuestion.optionC },
                                        { key: "D", text: activeQuestion.optionD },
                                    ]
                                        .filter((opt) => opt.text && opt.text.trim())
                                        .map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => handleAnswer(opt.key)}
                                                className="flex items-center gap-2.5 p-3 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50 active:scale-98 transition text-left"
                                            >
                                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white font-black text-xs text-slate-800 shadow-xs border border-slate-200 shrink-0">
                                                    {opt.key}
                                                </span>
                                                <span className="text-xs md:text-sm font-bold text-slate-700">
                                                    {opt.text}
                                                </span>
                                            </button>
                                        ))}
                                </div>
                            )}

                            {/* DẠNG 3: TỰ LUẬN */}
                            {activeQuestion.type === "essay" && (
                                <div className="space-y-3">
                                    <textarea
                                        rows={3}
                                        value={essayInput}
                                        onChange={(e) => setEssayInput(e.target.value)}
                                        placeholder="Nhập câu trả lời ngắn của bạn..."
                                        className="w-full rounded-2xl border-2 border-slate-200 p-3 text-sm font-medium focus:border-amber-400 focus:outline-hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAnswer(essayInput)}
                                        disabled={!essayInput.trim()}
                                        className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition disabled:opacity-50"
                                    >
                                        Xác nhận câu trả lời
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               MÀN HÌNH KẾT THÚC CHUYẾN ĐÀO VÀNG
            ========================================================= */}
            {isFinished && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 md:p-8 text-center shadow-2xl border-2 border-yellow-300">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-md mb-4 animate-bounce">
                            <Trophy className="h-10 w-10 text-amber-800" />
                        </div>

                        <span className="rounded-full bg-yellow-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-yellow-800">
                            Kết Quả Đào Vàng
                        </span>

                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                            {score > 200 ? "Thợ Đào Vàng Siêu Đẳng!" : "Hoàn Thành Chuyến Đào Vàng!"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500 font-bold truncate">
                            Chủ đề: <strong className="text-amber-700">{displayName}</strong>
                        </p>

                        {/* Thống kê chính xác */}
                        <div className="my-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-center">
                                <span className="block text-lg font-black text-emerald-600">{correctCount}</span>
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Trả lời đúng</span>
                            </div>
                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-center">
                                <span className="block text-lg font-black text-rose-600">{wrongCount}</span>
                                <span className="text-[10px] font-bold text-rose-700 uppercase">Trả lời sai</span>
                            </div>
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-center">
                                <span className="block text-lg font-black text-amber-600">{score}</span>
                                <span className="text-[10px] font-bold text-amber-700 uppercase">Tổng điểm</span>
                            </div>
                        </div>

                        {/* Lịch sử câu hỏi đã gặp */}
                        {history.length > 0 && (
                            <div className="mb-5 max-h-36 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 text-left text-xs space-y-1.5 no-scrollbar">
                                <div className="text-[11px] font-black text-slate-500 px-1">Lịch sử câu hỏi:</div>
                                {history.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 border border-slate-100">
                                        <div className="flex items-center gap-1.5 truncate">
                                            {it.isCorrect ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                            )}
                                            <span className="truncate text-slate-700 font-bold">{it.questionText}</span>
                                        </div>
                                        <span className={`text-[11px] font-black shrink-0 ${it.isCorrect ? "text-emerald-600" : "text-slate-400"}`}>
                                            +{it.pointsEarned}đ
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={initGame}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-500 py-3 text-sm font-black text-white hover:bg-yellow-600 active:scale-95 transition shadow-md"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Chơi lại
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                            >
                                Chọn game khác
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
