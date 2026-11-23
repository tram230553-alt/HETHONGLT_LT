import React, { useState, useEffect, useCallback } from "react";
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
    AlertCircle,
    Flag,
} from "lucide-react";
import type { TopicDto } from "../../services/topicService";
import {
    practiceService,
    type ChessQuestionDto,
} from "../../services/practiceService";

/* =========================================================
   PROPS
========================================================= */

interface ChessPuzzleGameViewProps {
    topic: TopicDto;
    customQuestions?: ChessQuestionDto[];
    customTitle?: string;
    onBack: () => void;
    onEarnGems?: (amount: number) => void;
    userStars?: number;
    onUseStars?: (amount: number) => boolean;
}

/* =========================================================
   CHESS TYPES & HELPERS
========================================================= */

type PieceType = "p" | "r" | "n" | "b" | "q" | "k";
type PieceColor = "w" | "b";

interface Piece {
    type: PieceType;
    color: PieceColor;
}

interface Pos {
    r: number;
    c: number;
}

type Board = (Piece | null)[][];

interface PendingMove {
    from: Pos;
    to: Pos;
    piece: Piece;
    question: ChessQuestionDto;
}

interface QuestionHistoryItem {
    id: string;
    moveLabel: string;
    questionText: string;
    correctAnswerLabel: string;
    isCorrect: boolean;
}

function normalizeText(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function pickQuestionForPiece(
    piece: Piece,
    allQuestions: ChessQuestionDto[],
    currentCursor: number,
): ChessQuestionDto | null {
    if (allQuestions.length === 0) return null;

    let targetTypes: string[] = [];
    if (piece.type === "p" || piece.type === "k") {
        targetTypes = ["true_false"];
    } else if (piece.type === "n" || piece.type === "b") {
        targetTypes = ["single_choice", "multiple_choice"];
    } else if (piece.type === "r" || piece.type === "q") {
        targetTypes = ["essay"];
    }

    const matching = allQuestions.filter((q) => targetTypes.includes((q.type || "").toLowerCase()));
    if (matching.length > 0) {
        return matching[currentCursor % matching.length];
    }

    // Fallback: nếu chủ đề chưa có loại câu hỏi đó, sử dụng câu hỏi có sẵn
    return allQuestions[currentCursor % allQuestions.length];
}

const PIECE_NAMES_VI: Record<PieceType, string> = {
    p: "Tốt",
    r: "Xe",
    n: "Mã",
    b: "Tượng",
    q: "Hậu",
    k: "Vua",
};

const PIECE_VALUES: Record<PieceType, number> = {
    p: 10,
    n: 30,
    b: 32,
    r: 50,
    q: 90,
    k: 900,
};

function toAlgebraic(pos: Pos): string {
    const file = "abcdefgh"[pos.c] || "a";
    const rank = 8 - pos.r;
    return `${file}${rank}`;
}

function createInitialBoard(): Board {
    const backRank: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
    const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

    for (let c = 0; c < 8; c++) {
        board[0][c] = { type: backRank[c], color: "b" };
        board[1][c] = { type: "p", color: "b" };
        board[6][c] = { type: "p", color: "w" };
        board[7][c] = { type: backRank[c], color: "w" };
    }
    return board;
}

function cloneBoard(board: Board): Board {
    return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function inBounds(r: number, c: number): boolean {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getPseudoLegalMoves(board: Board, pos: Pos): Pos[] {
    const piece = board[pos.r][pos.c];
    if (!piece) return [];

    const moves: Pos[] = [];
    const { r, c } = pos;
    const { type, color } = piece;

    if (type === "p") {
        const dir = color === "w" ? -1 : 1;
        const startRow = color === "w" ? 6 : 1;

        // Đi thẳng 1 ô
        if (inBounds(r + dir, c) && !board[r + dir][c]) {
            moves.push({ r: r + dir, c });
            // Đi thẳng 2 ô từ vị trí xuất phát
            if (r === startRow && inBounds(r + dir * 2, c) && !board[r + dir * 2][c]) {
                moves.push({ r: r + dir * 2, c });
            }
        }

        // Ăn chéo
        for (const dc of [-1, 1]) {
            const nr = r + dir;
            const nc = c + dc;
            if (inBounds(nr, nc) && board[nr][nc] && board[nr][nc]!.color !== color) {
                moves.push({ r: nr, c: nc });
            }
        }
    } else if (type === "n") {
        const jumps = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1],
        ];
        for (const [dr, dc] of jumps) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc]!.color !== color)) {
                moves.push({ r: nr, c: nc });
            }
        }
    } else if (type === "k") {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc]!.color !== color)) {
                    moves.push({ r: nr, c: nc });
                }
            }
        }
    } else {
        const dirs: [number, number][] = [];
        if (type === "r" || type === "q") {
            dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        }
        if (type === "b" || type === "q") {
            dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        }

        for (const [dr, dc] of dirs) {
            let nr = r + dr;
            let nc = c + dc;
            while (inBounds(nr, nc)) {
                const target = board[nr][nc];
                if (!target) {
                    moves.push({ r: nr, c: nc });
                } else {
                    if (target.color !== color) {
                        moves.push({ r: nr, c: nc });
                    }
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
    }

    return moves;
}

function isKingInCheck(board: Board, kingColor: PieceColor): boolean {
    let kingPos: Pos | null = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === kingColor && p.type === "k") {
                kingPos = { r, c };
                break;
            }
        }
        if (kingPos) break;
    }

    if (!kingPos) return true;

    const enemyColor: PieceColor = kingColor === "w" ? "b" : "w";
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === enemyColor) {
                const enemyMoves = getPseudoLegalMoves(board, { r, c });
                if (enemyMoves.some((m) => m.r === kingPos!.r && m.c === kingPos!.c)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function applyMoveOnBoard(board: Board, from: Pos, to: Pos): Board {
    const next = cloneBoard(board);
    const moving = next[from.r][from.c];
    next[from.r][from.c] = null;
    if (moving) {
        // Phong hậu tự động khi tốt đi đến hàng cuối
        if (moving.type === "p" && (to.r === 0 || to.r === 7)) {
            next[to.r][to.c] = { type: "q", color: moving.color };
        } else {
            next[to.r][to.c] = moving;
        }
    }
    return next;
}

function getLegalMoves(board: Board, pos: Pos): Pos[] {
    const piece = board[pos.r][pos.c];
    if (!piece) return [];
    const pseudo = getPseudoLegalMoves(board, pos);
    return pseudo.filter((to) => {
        const nextBoard = applyMoveOnBoard(board, pos, to);
        return !isKingInCheck(nextBoard, piece.color);
    });
}

/* =========================================================
   WEB AUDIO API SOUND GENERATOR
========================================================= */

class ChessSounds {
    private ctx: AudioContext | null = null;
    public enabled = true;

    private getContext(): AudioContext | null {
        if (!this.enabled) return null;
        if (!this.ctx) {
            const AudioCtx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => { });
        }
        return this.ctx;
    }

    playMove() {
        const ctx = this.getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
    }

    playCorrect() {
        const ctx = this.getContext();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.07);
            gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.07);
            osc.stop(ctx.currentTime + idx * 0.07 + 0.2);
        });
    }

    playWrong() {
        const ctx = this.getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(170, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(95, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
    }
}

const sounds = new ChessSounds();

/* =========================================================
   CHESS PIECE SVG RENDERER (Matches uploaded screenshot)
========================================================= */

function ChessPieceSvg({ piece }: { piece: Piece }) {
    const isWhite = piece.color === "w";
    const fill = isWhite ? "#ffffff" : "#434665";
    const stroke = isWhite ? "#475569" : "#26283b";
    const innerStroke = isWhite ? "#64748b" : "#d8dcf0";

    switch (piece.type) {
        case "p":
            return (
                <svg viewBox="0 0 45 45" className="w-[74%] h-[74%] drop-shadow-[0_2px_1px_rgba(0,0,0,0.22)]">
                    <path
                        d="M 22.5,9 C 19.5,9 17,11.5 17,14.5 C 17,16.8 18.4,18.7 20.4,19.5 C 17.5,21 15.5,24 15.5,28 C 15.5,30 16.5,31.5 16.5,31.5 L 12,35.5 L 33,35.5 L 28.5,31.5 C 28.5,31.5 29.5,30 29.5,28 C 29.5,24 27.5,21 24.6,19.5 C 26.6,18.7 28,16.8 28,14.5 C 28,11.5 25.5,9 22.5,9 z"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line x1="14" y1="33" x2="31" y2="33" stroke={innerStroke} strokeWidth="1.5" />
                    <rect x="11" y="35.5" width="23" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="1.8" />
                </svg>
            );
        case "r":
            return (
                <svg viewBox="0 0 45 45" className="w-[76%] h-[76%] drop-shadow-[0_2px_1px_rgba(0,0,0,0.22)]">
                    <g fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
                        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
                        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
                        <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
                        <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
                        <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
                    </g>
                    <line x1="14" y1="17" x2="31" y2="17" stroke={innerStroke} strokeWidth="1.3" />
                    <line x1="14" y1="29.5" x2="31" y2="29.5" stroke={innerStroke} strokeWidth="1.3" />
                </svg>
            );
        case "n":
            return (
                <svg viewBox="0 0 45 45" className="w-[78%] h-[78%] drop-shadow-[0_2px_1px_rgba(0,0,0,0.22)]">
                    <path
                        d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                    />
                    <path
                        d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <circle cx="15.5" cy="14.5" r="1.3" fill={innerStroke} />
                    <rect x="11" y="36" width="25" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="1.8" />
                </svg>
            );
        case "b":
            return (
                <svg viewBox="0 0 45 45" className="w-[78%] h-[78%] drop-shadow-[0_2px_1px_rgba(0,0,0,0.22)]">
                    <g fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
                        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
                        <circle cx="22.5" cy="8" r="2.2" />
                    </g>
                    <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke={innerStroke} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case "q":
            return (
                <svg viewBox="0 0 45 45" className="w-[80%] h-[80%] drop-shadow-[0_2px_1px_rgba(0,0,0,0.22)]">
                    <g fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" />
                        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
                        <circle cx="6" cy="12" r="1.8" />
                        <circle cx="14" cy="9" r="1.8" />
                        <circle cx="22.5" cy="8" r="1.8" />
                        <circle cx="31" cy="9" r="1.8" />
                        <circle cx="39" cy="12" r="1.8" />
                    </g>
                    <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke={innerStroke} strokeWidth="1.5" fill="none" />
                </svg>
            );
        case "k":
            return (
                <svg viewBox="0 0 45 45" className="w-[80%] h-[80%] drop-shadow-[0_2px_1px_rgba(0,0,0,0.22)]">
                    <g fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M 22.5,11.63 L 22.5,6" />
                        <path d="M 20,8 L 25,8" />
                        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
                        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z" />
                    </g>
                    <path d="M 11.5,30 C 17,27 27,27 32.5,30 M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5 M 11.5,37 C 17,34 27,34 32.5,37" stroke={innerStroke} strokeWidth="1.5" fill="none" />
                </svg>
            );
    }
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ChessPuzzleGameView({
    topic,
    customQuestions,
    customTitle,
    onBack,
    onEarnGems,
    userStars = 0,
    onUseStars,
}: ChessPuzzleGameViewProps) {
    const [questions, setQuestions] = useState<ChessQuestionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Bàn cờ & trạng thái chọn nước đi
    const [board, setBoard] = useState<Board>(() => createInitialBoard());
    const [selectedPos, setSelectedPos] = useState<Pos | null>(null);
    const [legalMoves, setLegalMoves] = useState<Pos[]>([]);
    const [lastMove, setLastMove] = useState<{ from: Pos; to: Pos } | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);

    // Modal câu hỏi khi chọn 1 nước đi (hỗ trợ Đúng/Sai, Trắc nghiệm ABCD, Tự luận)
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
    const [questionCursor, setQuestionCursor] = useState(0);
    const [modalTimeLeft, setModalTimeLeft] = useState(25);
    const [showHintInModal, setShowHintInModal] = useState(false);
    const [essayInput, setEssayInput] = useState("");

    // Thống kê đúng/sai & thông báo
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [historyResults, setHistoryResults] = useState<QuestionHistoryItem[]>([]);
    const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "star" } | null>(null);
    const [soundOn, setSoundOn] = useState(true);

    // Kết thúc ván cờ
    const [isFinished, setIsFinished] = useState(false);
    const [finishReason, setFinishReason] = useState<string>("");

    const showToast = useCallback((text: string, type: "success" | "error" | "star" = "success") => {
        setToastMsg({ text, type });
        setTimeout(() => {
            setToastMsg((prev) => (prev?.text === text ? null : prev));
        }, 2600);
    }, []);

    // Load tất cả câu hỏi của chủ đề
    useEffect(() => {
        let mounted = true;
        if (customQuestions && customQuestions.length > 0) {
            setQuestions(customQuestions);
            setLoading(false);
            return;
        }
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await practiceService.getChessQuestions(topic.id);
                if (mounted) {
                    setQuestions(data);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Không thể tải câu hỏi của chủ đề.");
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

    // AI (Quân Đen) tự động đi sau khi học sinh trả lời đúng
    const triggerBlackAiMove = useCallback(
        (currentBoard: Board) => {
            setIsAiThinking(true);
            setTimeout(() => {
                // Tìm tất cả nước đi hợp lệ của quân Đen
                const allBlackMoves: { from: Pos; to: Pos; score: number }[] = [];

                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const p = currentBoard[r][c];
                        if (p && p.color === "b") {
                            const legals = getLegalMoves(currentBoard, { r, c });
                            for (const to of legals) {
                                let moveScore = Math.random() * 4;
                                const target = currentBoard[to.r][to.c];
                                if (target) {
                                    // Ưu tiên ăn quân
                                    moveScore += PIECE_VALUES[target.type] * 2;
                                }
                                // Ưu tiên kiểm soát trung tâm (hàng 3,4 cột 3,4)
                                if (to.r >= 2 && to.r <= 5 && to.c >= 2 && to.c <= 5) {
                                    moveScore += 5;
                                }
                                // Tiến quân lên phía trước
                                moveScore += to.r * 0.8;

                                allBlackMoves.push({ from: { r, c }, to, score: moveScore });
                            }
                        }
                    }
                }

                if (allBlackMoves.length === 0) {
                    // Quân Đen hết nước đi -> Học sinh thắng!
                    setIsAiThinking(false);
                    setFinishReason("Chiếu hết! Bạn đã chiến thắng ván cờ!");
                    setIsFinished(true);
                    return;
                }

                allBlackMoves.sort((a, b) => b.score - a.score);
                const chosen = allBlackMoves[0];
                const nextBoard = applyMoveOnBoard(currentBoard, chosen.from, chosen.to);

                setBoard(nextBoard);
                setLastMove({ from: chosen.from, to: chosen.to });
                setIsAiThinking(false);
                sounds.playMove();

                // Kiểm tra xem quân Trắng còn nước đi hợp lệ không
                let whiteHasMoves = false;
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (nextBoard[r][c]?.color === "w" && getLegalMoves(nextBoard, { r, c }).length > 0) {
                            whiteHasMoves = true;
                            break;
                        }
                    }
                    if (whiteHasMoves) break;
                }

                if (!whiteHasMoves) {
                    setFinishReason("Ván cờ đã kết thúc!");
                    setIsFinished(true);
                }
            }, 520);
        },
        [],
    );

    // Xử lý khi học sinh trả lời câu hỏi (Đúng/Sai, Trắc nghiệm, Tự luận)
    const handleAnswerQuestion = useCallback(
        (studentAnswer: string | null) => {
            if (!pendingMove) return;

            const currentQ = pendingMove.question;
            const qType = (currentQ.type || "true_false").toLowerCase();
            const moveLabel = `${PIECE_NAMES_VI[pendingMove.piece.type]} ${toAlgebraic(pendingMove.from)}→${toAlgebraic(pendingMove.to)}`;

            let isCorrect = false;
            let correctAnswerLabel = "";

            if (studentAnswer === null) {
                // Hết giờ
                isCorrect = false;
                correctAnswerLabel =
                    qType === "true_false"
                        ? currentQ.isTrue ? "ĐÚNG" : "SAI"
                        : currentQ.correctAnswer || "Hết giờ";
            } else if (qType === "true_false") {
                const expected = currentQ.isTrue ? "T" : "F";
                isCorrect = studentAnswer.toUpperCase() === expected;
                correctAnswerLabel = currentQ.isTrue ? "ĐÚNG" : "SAI";
            } else if (qType === "single_choice" || qType === "multiple_choice") {
                const expected = (currentQ.correctAnswer || "").trim().toUpperCase();
                isCorrect = studentAnswer.trim().toUpperCase() === expected;
                correctAnswerLabel = expected;
            } else if (qType === "essay") {
                const expected = currentQ.correctAnswer || "";
                const normUser = normalizeText(studentAnswer);
                const expectedVariants = expected
                    .split(/[,;/|]/)
                    .map((s) => normalizeText(s))
                    .filter(Boolean);

                if (expectedVariants.length > 0) {
                    isCorrect = expectedVariants.some(
                        (v) => v === normUser || (v.length >= 2 && normUser.includes(v)),
                    );
                } else {
                    isCorrect = normalizeText(expected) === normUser;
                }
                correctAnswerLabel = expected;
            }

            // Lưu vào lịch sử câu hỏi
            setHistoryResults((prev) => [
                ...prev,
                {
                    id: `${currentQ.id}-${prev.length}`,
                    moveLabel,
                    questionText: currentQ.questionText || currentQ.noiDung,
                    correctAnswerLabel,
                    isCorrect,
                },
            ]);

            setQuestionCursor((c) => c + 1);

            if (isCorrect) {
                // Trả lời đúng -> Được phép di chuyển quân cờ!
                sounds.playCorrect();
                setCorrectCount((c) => c + 1);
                if (onEarnGems) onEarnGems(10);

                const nextBoard = applyMoveOnBoard(board, pendingMove.from, pendingMove.to);
                setBoard(nextBoard);
                setLastMove({ from: pendingMove.from, to: pendingMove.to });
                setSelectedPos(null);
                setLegalMoves([]);
                setPendingMove(null);
                setShowHintInModal(false);
                setEssayInput("");

                showToast(`Chính xác! Đã đi ${moveLabel}`, "success");

                // Sau khi quân Trắng đi xong, đến lượt AI quân Đen phản hồi
                triggerBlackAiMove(nextBoard);
            } else {
                // Trả lời sai (hoặc hết giờ) -> Không được đi!
                sounds.playWrong();
                setWrongCount((w) => w + 1);
                setPendingMove(null);
                setSelectedPos(null);
                setLegalMoves([]);
                setShowHintInModal(false);
                setEssayInput("");

                showToast(
                    studentAnswer === null
                        ? `Hết giờ! Nước đi ${moveLabel} không được thực hiện.`
                        : `Trả lời sai! Quân cờ không được di chuyển.`,
                    "error",
                );
            }
        },
        [pendingMove, board, onEarnGems, showToast, triggerBlackAiMove],
    );

    // Đếm ngược thời gian 25s khi Modal câu hỏi đang mở
    useEffect(() => {
        if (!pendingMove) return;
        setModalTimeLeft(25);

        const timer = setInterval(() => {
            setModalTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAnswerQuestion(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [pendingMove, handleAnswerQuestion]);

    // Click vào 1 ô trên bàn cờ
    const handleSquareClick = (r: number, c: number) => {
        if (pendingMove || isAiThinking || isFinished) return;

        // Kiểm tra xem ô vừa click có phải là nước đi hợp lệ của quân đang chọn không
        if (selectedPos && legalMoves.some((m) => m.r === r && m.c === c)) {
            const movingPiece = board[selectedPos.r][selectedPos.c];
            if (movingPiece) {
                const targetQ = pickQuestionForPiece(movingPiece, questions, questionCursor);
                if (!targetQ) return;
                setShowHintInModal(false);
                setEssayInput("");
                setPendingMove({
                    from: selectedPos,
                    to: { r, c },
                    piece: movingPiece,
                    question: targetQ,
                });
                return;
            }
        }

        // Nếu click vào một quân Trắng của mình -> chọn quân đó
        const clickedPiece = board[r][c];
        if (clickedPiece && clickedPiece.color === "w") {
            setSelectedPos({ r, c });
            setLegalMoves(getLegalMoves(board, { r, c }));
            sounds.playMove();
        } else {
            setSelectedPos(null);
            setLegalMoves([]);
        }
    };

    // Dùng 1 Sao tích lũy để gợi ý đáp án trong Modal
    const handleUseStarHint = () => {
        if (showHintInModal || !pendingMove) return;

        if ((userStars ?? 0) < 1) {
            showToast("Bạn chưa đủ sao! Hãy học thêm bài học để tích lũy sao ⭐", "star");
            return;
        }

        if (onUseStars) {
            const ok = onUseStars(1);
            if (!ok) {
                showToast("Bạn chưa đủ sao! Hãy học thêm bài học để tích lũy sao ⭐", "star");
                return;
            }
        }

        setShowHintInModal(true);
        showToast("Đã dùng 1 ⭐ để mở gợi ý câu hỏi!", "star");
    };

    // Chơi lại ván mới
    const handleRestart = () => {
        setBoard(createInitialBoard());
        setSelectedPos(null);
        setLegalMoves([]);
        setLastMove(null);
        setPendingMove(null);
        setCorrectCount(0);
        setWrongCount(0);
        setHistoryResults([]);
        setIsFinished(false);
        setFinishReason("");
    };

    const toggleSound = () => {
        sounds.enabled = !soundOn;
        setSoundOn(!soundOn);
    };

    // Loading
    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-[var(--theme-bg)] p-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
                    <p className="font-extrabold text-slate-700">Đang chuẩn bị bàn cờ giải đố...</p>
                </div>
            </div>
        );
    }

    // Không có câu hỏi nào
    if (error || questions.length === 0) {
        return (
            <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[var(--theme-bg)] p-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-pink-100">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 mb-4">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Chưa có câu hỏi</h2>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        {error || "Chủ đề này chưa có câu hỏi để tạo màn chơi Cờ vua giải đố."}
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-3 transition shadow-md active:scale-95 text-sm"
                    >
                        Quay lại chủ đề
                    </button>
                </div>
            </div>
        );
    }

    const totalAnswered = correctCount + wrongCount;
    const accuracyRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col select-none overflow-y-auto no-scrollbar bg-[var(--theme-bg)] text-slate-800 px-3 py-3 sm:px-6 sm:py-4">
            {/* TOAST NOTIFICATION */}
            {toastMsg && (
                <div
                    className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-2.5 text-xs font-black shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-2 ${toastMsg.type === "success"
                        ? "bg-emerald-600 text-white"
                        : toastMsg.type === "error"
                            ? "bg-rose-600 text-white"
                            : "bg-slate-900 text-amber-300"
                        }`}
                >
                    {toastMsg.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    {toastMsg.type === "error" && <XCircle className="h-4 w-4 shrink-0" />}
                    {toastMsg.type === "star" && <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />}
                    <span>{toastMsg.text}</span>
                </div>
            )}

            {/* TOP BAR */}
            <header className="mx-auto flex w-full max-w-xl items-center justify-between gap-2 shrink-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-50 transition active:scale-95 text-slate-500 hover:text-slate-800"
                    title="Đóng game"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Live Correct / Wrong Counter */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Đúng: {correctCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-black text-rose-700">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Sai: {wrongCount}</span>
                    </div>
                </div>

                {/* Right Controls: Stars, Sound, Finish */}
                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 shadow-xs text-xs font-black text-amber-700 border border-amber-200"
                        title="Số sao tích điểm dùng để mở gợi ý câu hỏi"
                    >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span>{userStars}</span>
                    </div>

                    <button
                        type="button"
                        onClick={toggleSound}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs text-slate-500 hover:text-slate-800 transition"
                        title={soundOn ? "Tắt âm" : "Bật âm"}
                    >
                        {soundOn ? <Volume2 className="h-4 w-4 text-emerald-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setFinishReason("Tổng kết kết quả luyện tập");
                            setIsFinished(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white hover:bg-pink-50 border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:text-pink-600 shadow-xs transition active:scale-95"
                        title="Kết thúc và xem bảng kết quả"
                    >
                        <Flag className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Kết quả</span>
                    </button>
                </div>
            </header>

            {/* TITLE & SUBTITLE (Exact match to Screenshot 1) */}
            <div className="mt-2 mb-3 text-center shrink-0">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1e1b4b] tracking-tight">
                    Cờ vua <span className="text-[#ec4899]">giải đố</span>
                </h1>
                <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Chọn nước đi, trả lời đúng câu hỏi thì quân mới được di chuyển. Tốt/Vua: Đúng-Sai · Mã/Tượng: Trắc nghiệm · Xe/Hậu: Tự luận.
                </p>
            </div>

            {/* CHESSBOARD CONTAINER (Exact match to Screenshot 1) */}
            <main className="my-auto mx-auto flex w-full max-w-[470px] flex-col items-center">
                <div className="w-full rounded-[28px] bg-white p-3 sm:p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] border border-white">
                    <div className="grid grid-cols-8 aspect-square w-full overflow-hidden rounded-xl border border-slate-200/70">
                        {board.map((row, r) =>
                            row.map((piece, c) => {
                                const isLight = (r + c) % 2 === 0;
                                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                                const isLastMove =
                                    (lastMove?.from.r === r && lastMove?.from.c === c) ||
                                    (lastMove?.to.r === r && lastMove?.to.c === c);
                                const isLegalTarget = legalMoves.some((m) => m.r === r && m.c === c);

                                let squareBg = isLight ? "bg-[#e8ecfb]" : "bg-[#b8c5f8]";
                                if (isSelected) {
                                    squareBg = "bg-[#fde047]";
                                } else if (isLastMove) {
                                    squareBg = "bg-[#bbf7d0]";
                                }

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        onClick={() => handleSquareClick(r, c)}
                                        className={`relative flex items-center justify-center aspect-square cursor-pointer select-none transition-colors duration-100 ${squareBg}`}
                                    >
                                        {/* Rank Number (8..1) on Column a */}
                                        {c === 0 && (
                                            <span
                                                className={`pointer-events-none absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-bold leading-none ${isLight ? "text-slate-500" : "text-slate-600"
                                                    }`}
                                            >
                                                {8 - r}
                                            </span>
                                        )}

                                        {/* File Letter (a..h) on Row 1 */}
                                        {r === 7 && (
                                            <span
                                                className={`pointer-events-none absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold leading-none ${isLight ? "text-slate-500" : "text-slate-600"
                                                    }`}
                                            >
                                                {"abcdefgh"[c]}
                                            </span>
                                        )}

                                        {/* Chess Piece */}
                                        {piece && <ChessPieceSvg piece={piece} />}

                                        {/* Pink Dot for Valid Empty Target Square (Matches Screenshot 1) */}
                                        {isLegalTarget && !piece && (
                                            <span className="pointer-events-none h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-[#f472b6] shadow-xs transition-transform scale-100" />
                                        )}

                                        {/* Pink Ring for Valid Capture Square */}
                                        {isLegalTarget && piece && (
                                            <span className="pointer-events-none absolute inset-1 rounded-full ring-4 ring-[#f472b6]/85" />
                                        )}
                                    </div>
                                );
                            }),
                        )}
                    </div>
                </div>

                {/* Bottom Bar under Chessboard */}
                <div className="mt-3 flex items-center justify-between w-full px-2 text-xs font-bold text-slate-500">
                    <span>Chủ đề: <strong className="text-slate-700">{customTitle || topic.name}</strong></span>
                    <button
                        type="button"
                        onClick={handleRestart}
                        className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 font-extrabold"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Ván mới
                    </button>
                </div>
            </main>

            {/* QUESTION MODAL ON MOVE (Matches Screenshot 2 & Piece Type Rules) */}
            {pendingMove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[4px] animate-fade-in">
                    <div className="w-full max-w-[480px] rounded-[32px] bg-white p-6 sm:p-7 shadow-2xl border border-white/80">
                        {/* Top Badges: Piece & Type Label + Countdown Timer */}
                        <div className="flex items-center justify-between gap-2">
                            {(() => {
                                const pieceLabel = PIECE_NAMES_VI[pendingMove.piece.type];
                                const moveNotation = `${toAlgebraic(pendingMove.from)}→${toAlgebraic(pendingMove.to)}`;
                                const qType = (pendingMove.question.type || "true_false").toLowerCase();

                                if (qType === "single_choice" || qType === "multiple_choice") {
                                    return (
                                        <span className="inline-flex items-center rounded-full bg-[#e0f2fe] px-3.5 py-1.5 text-xs font-black text-[#0284c7]">
                                            {pieceLabel} {moveNotation} · Trắc nghiệm
                                        </span>
                                    );
                                }
                                if (qType === "essay") {
                                    return (
                                        <span className="inline-flex items-center rounded-full bg-[#fef3c7] px-3.5 py-1.5 text-xs font-black text-[#d97706]">
                                            {pieceLabel} {moveNotation} · Tự luận
                                        </span>
                                    );
                                }
                                return (
                                    <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-3.5 py-1.5 text-xs font-black text-[#9333ea]">
                                        {pieceLabel} {moveNotation} · Đúng / Sai
                                    </span>
                                );
                            })()}

                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-3 py-1.5 text-xs font-extrabold text-slate-600">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                {modalTimeLeft}s
                            </span>
                        </div>

                        {/* Question Statement */}
                        <h3 className="my-5 text-base sm:text-lg font-black text-slate-900 text-left leading-snug">
                            {pendingMove.question.questionText || pendingMove.question.noiDung}
                        </h3>

                        {/* Star Hint Display if Activated */}
                        {showHintInModal ? (
                            <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 text-left">
                                <p className="font-black">
                                    💡 Gợi ý đáp án:{" "}
                                    <span className="text-amber-700 uppercase">
                                        {(pendingMove.question.type || "true_false").toLowerCase() === "true_false"
                                            ? pendingMove.question.isTrue
                                                ? "ĐÚNG"
                                                : "SAI"
                                            : pendingMove.question.correctAnswer}
                                    </span>
                                </p>
                                {pendingMove.question.explanation && (
                                    <p className="mt-1 text-amber-800/90">{pendingMove.question.explanation}</p>
                                )}
                            </div>
                        ) : (
                            <div className="mb-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleUseStarHint}
                                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 text-[11px] font-black text-amber-700 transition active:scale-95"
                                >
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                                    Gợi ý (1 ⭐)
                                </button>
                            </div>
                        )}

                        {/* ANSWER CONTROLS BY QUESTION TYPE */}
                        {(() => {
                            const qType = (pendingMove.question.type || "true_false").toLowerCase();

                            // 1. TRUE / FALSE: Hai nút to ĐÚNG - SAI pastel 3D (Khớp ảnh 2)
                            if (qType === "true_false") {
                                return (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleAnswerQuestion("T")}
                                            className="w-full rounded-2xl bg-[#ccfbd9] hover:bg-[#bbf7cd] border-b-4 border-[#9ae6b4] py-4 text-base font-black text-[#1e4631] transition active:translate-y-0.5"
                                        >
                                            ĐÚNG
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAnswerQuestion("F")}
                                            className="w-full rounded-2xl bg-[#ffd8dc] hover:bg-[#ffc6cc] border-b-4 border-[#feb2b2] py-4 text-base font-black text-[#63252b] transition active:translate-y-0.5"
                                        >
                                            SAI
                                        </button>
                                    </div>
                                );
                            }

                            // 2. SINGLE / MULTIPLE CHOICE: 4 phương án A, B, C, D
                            if (qType === "single_choice" || qType === "multiple_choice") {
                                const options = [
                                    { key: "A", text: pendingMove.question.optionA },
                                    { key: "B", text: pendingMove.question.optionB },
                                    { key: "C", text: pendingMove.question.optionC },
                                    { key: "D", text: pendingMove.question.optionD },
                                ].filter((opt) => opt.text && opt.text.trim().length > 0);

                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {options.map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => handleAnswerQuestion(opt.key)}
                                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50 hover:border-sky-300 border-2 border-slate-200 transition text-left active:scale-[0.98]"
                                            >
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-black text-xs text-sky-700">
                                                    {opt.key}
                                                </span>
                                                <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                                                    {opt.text}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            }

                            // 3. ESSAY: Tự luận nhập câu trả lời ngắn
                            return (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (essayInput.trim()) {
                                            handleAnswerQuestion(essayInput.trim());
                                        }
                                    }}
                                    className="space-y-3"
                                >
                                    <input
                                        type="text"
                                        value={essayInput}
                                        onChange={(e) => setEssayInput(e.target.value)}
                                        placeholder="Nhập câu trả lời ngắn của bạn..."
                                        autoFocus
                                        className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!essayInput.trim()}
                                        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-b-4 border-amber-700 py-3.5 text-sm font-black text-white shadow-sm transition disabled:opacity-50 active:translate-y-0.5"
                                    >
                                        XÁC NHẬN CÂU TRẢ LỜI
                                    </button>
                                </form>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* END GAME / RESULTS MODAL */}
            {isFinished && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 md:p-8 text-center shadow-2xl border border-pink-100 my-auto">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-md mb-4">
                            <Trophy className="h-10 w-10 text-amber-800" />
                        </div>

                        <span className="rounded-full bg-pink-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-pink-700">
                            Bảng Kết Quả Cờ Vua Giải Đố
                        </span>

                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                            {finishReason || "Hoàn Thành Màn Chơi!"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Chủ đề: <strong className="text-pink-600">{customTitle || topic.name}</strong>
                        </p>

                        {/* Accurate Correct / Wrong Stats */}
                        <div className="my-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-center">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">Đúng (Đi được)</p>
                                <p className="text-xl font-black text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {correctCount}
                                </p>
                            </div>

                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-center">
                                <p className="text-[10px] font-bold text-rose-600 uppercase">Sai (Mất lượt)</p>
                                <p className="text-xl font-black text-rose-700 flex items-center justify-center gap-1 mt-0.5">
                                    <XCircle className="h-4 w-4" />
                                    {wrongCount}
                                </p>
                            </div>

                            <div className="rounded-xl bg-purple-50 border border-purple-200 p-2 text-center">
                                <p className="text-[10px] font-bold text-purple-600 uppercase">Chính xác</p>
                                <p className="text-xl font-black text-purple-700 mt-0.5">
                                    {accuracyRate}%
                                </p>
                            </div>
                        </div>

                        {/* Detailed Question & Move Log */}
                        {historyResults.length > 0 && (
                            <div className="mb-5 max-h-44 overflow-y-auto rounded-2xl bg-slate-50 border border-slate-100 p-3 text-left space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Lịch sử nước đi & câu hỏi
                                </p>
                                {historyResults.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between text-xs gap-2 py-1 border-b border-slate-200/60 last:border-0"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {item.isCorrect ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                            )}
                                            <span className="truncate text-slate-700 font-medium">
                                                <strong>{item.moveLabel}:</strong> {item.questionText}
                                            </span>
                                        </div>
                                        <span
                                            className={`font-black uppercase shrink-0 ${item.isCorrect ? "text-emerald-600" : "text-rose-500"
                                                }`}
                                        >
                                            {item.correctAnswerLabel}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsFinished(false)}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-black py-3 transition shadow-sm active:scale-95 text-sm"
                            >
                                Tiếp tục đánh ván hiện tại
                            </button>
                            <button
                                type="button"
                                onClick={handleRestart}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#fde047] hover:bg-yellow-300 text-slate-950 font-black py-3 transition shadow-sm active:scale-95 text-sm"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Chơi lại ván mới
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
