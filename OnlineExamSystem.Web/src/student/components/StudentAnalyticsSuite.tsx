/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  History,
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
  CheckCircle2,
  Bookmark,
  Compass,
  Clock,
  Loader2,
  XCircle,
  AlertCircle,
  Award,
} from "lucide-react";
import { CleanHistoryItem, UserStats } from "../types";
import {
    getMyStudentResults,
    getStudentExamDetail,
    getStudentResultAttemptDetail,
    retakeStudentExam,

    getMySavedQuestions,
    saveStudentQuestion,
    removeSavedStudentQuestion,

    type StudentAnswerRequest,
    type StudentExamDetailDto,
    type StudentResultDetailDto,
    type StudentResultDto,
    type StudentSavedQuestionDto,
} from "../../services/studentService";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

// Giữ nguyên 2 tab của StudentAnalyticsSuite.
// Tab saved-questions được giữ giao diện nhưng chưa gọi API vì backend hiện chưa có.
type SuiteTab =
    | "history"
    | "saved-questions";
type AnswerLetter = "A" | "B" | "C" | "D";

interface StudentAnalyticsSuiteProps {
  stats: UserStats;
  historyLogs: CleanHistoryItem[];
  onOpenAIChat: (initialPrompt?: string) => void;
  onSwitchTab?: (tabIndex: number) => void;
  onAddHistory?: (item: CleanHistoryItem, skipServerSync?: boolean) => void;

  // Dữ liệu SQL được ResultsTab truyền xuống.
  // Nếu không truyền, component vẫn có thể tự gọi API hiện có.
  sqlResults?: StudentResultDto[];
  onResultsChanged?: () => Promise<void> | void;
}

interface RetakeQuestionView {
  id: string;
  text: string;
  options: string[];
}

interface RetakeConfigView {
  examId: string;
  examTitle: string;
  durationMinutes: number;
  previousScore: number;
  previousCorrect: number;
  previousTotal: number;
  retakeQuestions: RetakeQuestionView[];
}

const answerLetters: AnswerLetter[] = ["A", "B", "C", "D"];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function answerToIndex(value?: string | null) {
  switch ((value ?? "").toUpperCase()) {
    case "A":
      return 0;
    case "B":
      return 1;
    case "C":
      return 2;
    case "D":
      return 3;
    default:
      return -1;
  }
}

function getRanking(score: number) {
  if (score >= 8) return "Xuất sắc";
  if (score >= 5) return "Đạt";
  return "Cần cố gắng";
}

export default function StudentAnalyticsSuite({
  stats: _stats,
  historyLogs: _historyLogs,
  onOpenAIChat: _onOpenAIChat,
  onSwitchTab: _onSwitchTab,
  onAddHistory: _onAddHistory,
  sqlResults,
  onResultsChanged,
}: StudentAnalyticsSuiteProps) {
  const [activeTab, setActiveTab] = React.useState<SuiteTab>("history");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("All");

  // Nếu ResultsTab không truyền sqlResults thì tự gọi API hiện có.
  const [internalResults, setInternalResults] = React.useState<StudentResultDto[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  const results = sqlResults ?? internalResults;

  // XEM LẠI BÀI THI
  const [reviewExamId, setReviewExamId] = React.useState<string | null>(null);
  const [reviewData, setReviewData] = React.useState<StudentResultDetailDto | null>(null);
  const [activeReviewQuestionIndex, setActiveReviewQuestionIndex] = React.useState(0);
  const [isLoadingReview, setIsLoadingReview] = React.useState(false);

  // LÀM LẠI BÀI THI
  const [retakeExamId, setRetakeExamId] = React.useState<string | null>(null);
  const [retakeConfig, setRetakeConfig] = React.useState<RetakeConfigView | null>(null);
  const [showRetakeConfirmDialog, setShowRetakeConfirmDialog] = React.useState(false);
  const [activeRetakeIndex, setActiveRetakeIndex] = React.useState<number | null>(null);
  const [retakeAnswers, setRetakeAnswers] = React.useState<Record<string, number>>({});
  const [isRetakeCompleted, setIsRetakeCompleted] = React.useState(false);
  const [retakeResult, setRetakeResult] = React.useState<StudentResultDetailDto | null>(null);
  const [isRetakeLoading, setIsRetakeLoading] = React.useState(false);
  const [isSubmittingRetake, setIsSubmittingRetake] = React.useState(false);
  const [retakeError, setRetakeError] = React.useState<string | null>(null);

  // Lưu lượt thi được chọn cho mỗi Exam.
  const [selectedLogIdForExam, setSelectedLogIdForExam] = React.useState<Record<string, string>>({});

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const triggerToast = React.useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2500);
  }, []);

    const [
        savedQuestions,
        setSavedQuestions,
    ] = React.useState<StudentSavedQuestionDto[]>([]);

    const [
        isLoadingSavedQuestions,
        setIsLoadingSavedQuestions,
    ] = React.useState(false);

    const [
        savedQuestionsError,
        setSavedQuestionsError,
    ] = React.useState<string | null>(null);

    const [
        savingQuestionId,
        setSavingQuestionId,
    ] = React.useState<string | null>(null);

    const savedQuestionIds = React.useMemo(
        () =>
            new Set(
                savedQuestions.map(
                    (item) => item.questionId,
                ),
            ),
        [savedQuestions],
    );
  const loadOwnResults = React.useCallback(async () => {
    // Khi ResultsTab đã truyền dữ liệu thật xuống thì không gọi trùng API.
    if (sqlResults) {
      return;
    }

    try {
      setIsLoadingHistory(true);
      setHistoryError(null);
      const data = await getMyStudentResults();
      setInternalResults(data);
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Không tải được lịch sử bài thi.",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, [sqlResults]);

  React.useEffect(() => {
    void loadOwnResults();
  }, [loadOwnResults]);

  const summaryStats = React.useMemo(() => {
    const totalQuestionsAnswered = results.reduce(
      (sum, item) => sum + item.totalQuestion,
      0,
    );

    const averageScore =
      results.length === 0
        ? 0
        : results.reduce((sum, item) => sum + item.diem, 0) /
          results.length;

    const bestScore =
      results.length === 0
        ? 0
        : Math.max(...results.map((item) => item.diem));

    return {
      totalExamsTaken: results.length,
      totalQuestionsAnswered,
      averageScore,
      bestScore,
    };
  }, [results]);

  const groupedExams = React.useMemo(() => {
    const map = new Map<string, StudentResultDto[]>();

    for (const item of results) {
      const current = map.get(item.examId) ?? [];
      current.push(item);
      map.set(item.examId, current);
    }

    return Array.from(map.entries())
      .map(([examId, attempts]) => ({
        examId,
        attempts: [...attempts].sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        ),
      }))
      .filter((group) => {
        const latest = group.attempts[0];
        if (!latest) return false;

        const matchQuery = latest.tenBaiKT
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

        if (!matchQuery) return false;

        if (selectedFilter === "Passed") return latest.diem >= 5;
        if (selectedFilter === "Failed") return latest.diem < 5;
        if (selectedFilter === "Excellent") return latest.diem >= 8;

        // Backend hiện chưa có API filter tuần/tháng riêng.
        // Ta vẫn lọc trực tiếp submittedAt thật từ SQL.
        if (selectedFilter === "This Week") {
          const submitted = new Date(latest.submittedAt);
          const now = new Date();
          const diff = now.getTime() - submitted.getTime();
          return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
        }

        if (selectedFilter === "This Month") {
          const submitted = new Date(latest.submittedAt);
          const now = new Date();
          return (
            submitted.getFullYear() === now.getFullYear() &&
            submitted.getMonth() === now.getMonth()
          );
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.attempts[0]?.submittedAt ?? 0).getTime() -
          new Date(a.attempts[0]?.submittedAt ?? 0).getTime(),
      );
  }, [results, searchQuery, selectedFilter]);

  // Phân trang danh sách đề đã làm (về trang 1 khi đổi từ khóa/bộ lọc).
  const examPagination = usePagination(
    groupedExams,
    6,
    `${searchQuery}|${selectedFilter}`,
  );

  const triggerReviewExam = async (examId: string, examResultId?: string) => {
    const selectedId =
      examResultId ??
      results.find((item) => item.examId === examId)?.examResultId;

    if (!selectedId) {
      triggerToast("Không tìm thấy lượt thi để xem lại.");
      return;
    }

    try {
      setIsLoadingReview(true);
      setReviewExamId(examId);
      setActiveReviewQuestionIndex(0);
      setReviewData(null);

      const detail = await getStudentResultAttemptDetail(selectedId);
      setReviewData(detail);
    } catch (error) {
      setReviewExamId(null);
      triggerToast(
        error instanceof Error
          ? error.message
          : "Không tải được chi tiết lượt thi.",
      );
    } finally {
      setIsLoadingReview(false);
    }
  };

  const triggerRetakeExam = async (examId: string, examResultId?: string) => {
    try {
      setIsRetakeLoading(true);
      setRetakeError(null);
      setRetakeExamId(examId);

      const selectedAttempt =
        results.find((item) => item.examResultId === examResultId) ??
        results.find((item) => item.examId === examId);

      const exam: StudentExamDetailDto = await getStudentExamDetail(examId);

      setRetakeConfig({
        examId,
        examTitle: exam.tenBaiKT,
        durationMinutes: exam.thoiLuong,
        previousScore: selectedAttempt?.diem ?? 0,
        previousCorrect: selectedAttempt?.correctQuestion ?? 0,
        previousTotal: selectedAttempt?.totalQuestion ?? exam.questions.length,
        retakeQuestions: exam.questions.map((question) => ({
          id: question.id,
          text: question.noiDung,
          options: [
            question.optionA,
            question.optionB,
            question.optionC,
            question.optionD,
          ],
        })),
      });

      setShowRetakeConfirmDialog(true);
    } catch (error) {
      setRetakeExamId(null);
      setRetakeConfig(null);
      triggerToast(
        error instanceof Error
          ? error.message
          : "Không thể mở đề để làm lại.",
      );
    } finally {
      setIsRetakeLoading(false);
    }
  };

  /**
   * Backend hiện tại KHÔNG có bước POST để "khởi tạo" lượt retake.
   * API /retake chỉ được gọi khi nộp đáp án.
   */
  const handleConfirmRetake = () => {
    if (!retakeConfig) return;

    setShowRetakeConfirmDialog(false);
    setActiveRetakeIndex(0);
    setRetakeAnswers({});
    setIsRetakeCompleted(false);
    setRetakeResult(null);
    setRetakeError(null);
  };

  const handleSubmitRetake = async () => {
    if (!retakeConfig || !retakeExamId || isSubmittingRetake) {
      return;
    }

    try {
      setIsSubmittingRetake(true);
      setRetakeError(null);

      const answers: StudentAnswerRequest[] = (
        Object.entries(retakeAnswers) as Array<[string, number]>
      ).map(([questionId, optionIndex]) => ({
          questionId,
          selectedAnswer: answerLetters[optionIndex] ?? "A",
        }),
      );

      const response = await retakeStudentExam(retakeExamId, answers);
      const detail = await getStudentResultAttemptDetail(response.examResultId);

      setRetakeResult(detail);
      setIsRetakeCompleted(true);

      if (onResultsChanged) {
        await onResultsChanged();
      } else {
        await loadOwnResults();
      }
    } catch (error) {
      setRetakeError(
        error instanceof Error
          ? error.message
          : "Không thể nộp bài làm lại.",
      );
    } finally {
      setIsSubmittingRetake(false);
    }
  };

  /**
   * Các API saved/personal/wrong/analysis chưa có trong backend hiện tại.
   * Giữ nút và file để làm sau, nhưng KHÔNG gọi endpoint 404.
   */
    const loadSavedQuestions =
        React.useCallback(async () => {
            try {
                setIsLoadingSavedQuestions(true);

                setSavedQuestionsError(null);

                const data =
                    await getMySavedQuestions();

                setSavedQuestions(data);
            } catch (error) {
                setSavedQuestionsError(
                    error instanceof Error
                        ? error.message
                        : "Không tải được câu hỏi đã lưu.",
                );
            } finally {
                setIsLoadingSavedQuestions(false);
            }
        }, []);
    React.useEffect(() => {
        void loadSavedQuestions();
    }, [loadSavedQuestions]);
    const togglePersonalQuestion = async (
        questionId: string,
    ) => {
        if (savingQuestionId) {
            return;
        }

        const isSaved =
            savedQuestionIds.has(questionId);

        try {
            setSavingQuestionId(questionId);

            if (isSaved) {
                await removeSavedStudentQuestion(
                    questionId,
                );

                triggerToast(
                    "Đã bỏ câu hỏi khỏi danh sách đã lưu.",
                );
            } else {
                await saveStudentQuestion(
                    questionId,
                );

                triggerToast(
                    "Đã lưu câu hỏi.",
                );
            }

            // Load lại SQL để UI luôn đồng bộ database.
            await loadSavedQuestions();
        } catch (error) {
            triggerToast(
                error instanceof Error
                    ? error.message
                    : "Không thể cập nhật câu hỏi đã lưu.",
            );
        } finally {
            setSavingQuestionId(null);
        }
    };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[var(--theme-bg)] relative">
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* GIỮ NGUYÊN TAB StudentAnalyticsSuite */}
      {reviewExamId === null && activeRetakeIndex === null && (
        <div className="bg-[var(--theme-surface)] border-b border-[#E9EDF7] px-4 py-2 shrink-0 z-10 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "history", name: "Lịch sử bài làm", icon: History },
            { id: "saved-questions", name: "Câu hỏi đã lưu", icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SuiteTab)}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-[var(--theme-primary)] text-white shadow-soft"
                    : "text-[var(--theme-text-light)] hover:bg-[var(--theme-surface-soft)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
        {/* =============================================================
            REVIEW MODE - API thật: /api/students/results/attempt/{id}
        ============================================================= */}
        {reviewExamId !== null && (
          <div className="space-y-5 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setReviewExamId(null);
                  setReviewData(null);
                }}
                className="flex items-center gap-1.5 text-[var(--theme-text-light)] hover:text-[var(--theme-primary)] transition text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Trở lại danh sách
              </button>

              <span className="text-[10px] bg-[#EBF2FF] text-[var(--theme-primary)] font-mono font-bold px-2 py-1 rounded-lg">
                XEM LẠI BÀI THI
              </span>
            </div>

            {isLoadingReview || !reviewData ? (
              <div className="text-center py-12 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--theme-primary)]" />
                <p className="text-xs text-slate-400">
                  Đang tải chi tiết lượt thi...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[var(--theme-surface)] p-5 rounded-3xl border border-[#E9EDF7] shadow-soft space-y-3.5">
                  <div className="space-y-1">
                    <h3 className="font-display font-extrabold text-[var(--theme-text)] text-sm tracking-tight leading-snug">
                      {reviewData.tenBaiKT}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#F1F3F9] text-center">
                    <div>
                      <span className="text-[9px] text-slate-400 block">ĐIỂM ĐẠT</span>
                      <span className="text-sm font-extrabold text-[var(--theme-primary)] font-mono">
                        {reviewData.diem.toFixed(2)}đ
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block">XẾP HẠNG</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {getRanking(reviewData.diem)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block">NỘP LÚC</span>
                      <span className="text-[10px] font-bold text-[var(--theme-text-muted)]">
                        {formatDate(reviewData.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[var(--theme-surface)] p-3 rounded-2xl border border-[var(--theme-border)] text-center shadow-soft">
                    <span className="text-[8px] font-bold text-slate-400 block">✓ ĐÚNG</span>
                    <span className="text-sm font-extrabold text-emerald-500 font-mono">
                      {reviewData.correctQuestion}
                    </span>
                  </div>

                  <div className="bg-[var(--theme-surface)] p-3 rounded-2xl border border-[var(--theme-border)] text-center shadow-soft">
                    <span className="text-[8px] font-bold text-slate-400 block">✗ SAI</span>
                    <span className="text-sm font-extrabold text-rose-500 font-mono">
                      {reviewData.questions.filter(
                        (question) => question.selectedAnswer && !question.isCorrect,
                      ).length}
                    </span>
                  </div>

                  <div className="bg-[var(--theme-surface)] p-3 rounded-2xl border border-[var(--theme-border)] text-center shadow-soft">
                    <span className="text-[8px] font-bold text-slate-400 block">? BỎ TRỐNG</span>
                    <span className="text-sm font-extrabold text-orange-500 font-mono">
                      {reviewData.questions.filter(
                        (question) => !question.selectedAnswer,
                      ).length}
                    </span>
                  </div>

                  <div className="bg-[var(--theme-surface)] p-3 rounded-2xl border border-[#EFF4FF] text-center shadow-soft">
                    <span className="text-[8px] font-bold text-[var(--theme-primary)] block">TỈ LỆ ĐÚNG</span>
                    <span className="text-sm font-extrabold text-[var(--theme-primary)] font-mono">
                      {reviewData.totalQuestion > 0
                        ? Math.round(
                            (reviewData.correctQuestion /
                              reviewData.totalQuestion) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                {/* Bản đồ câu hỏi */}
                <div className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] space-y-2.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-extrabold text-[var(--theme-text-light)] uppercase">
                      Bản đồ câu hỏi
                    </span>
                    <div className="flex gap-2 text-[8px] text-slate-400 font-mono">
                      <span>🟢 Đúng</span>
                      <span>🔴 Sai</span>
                      <span>🟠 Bỏ</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {reviewData.questions.map((question, index) => {
                      const isActive = index === activeReviewQuestionIndex;
                      const isSkipped = !question.selectedAnswer;

                      let colorClass = "bg-orange-50 border-orange-200 text-orange-600";

                      if (!isSkipped && question.isCorrect) {
                        colorClass = "bg-emerald-50 border-emerald-200 text-emerald-600";
                      } else if (!isSkipped && !question.isCorrect) {
                        colorClass = "bg-rose-50 border-rose-200 text-rose-600";
                      }

                      if (isActive) {
                        colorClass = "bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-soft";
                      }

                      return (
                        <button
                          type="button"
                          key={question.questionId}
                          onClick={() => setActiveReviewQuestionIndex(index)}
                          className={`aspect-square font-bold text-xs rounded-xl flex items-center justify-center border transition ${colorClass}`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chi tiết câu đang chọn */}
                {reviewData.questions[activeReviewQuestionIndex] && (() => {
                  const question = reviewData.questions[activeReviewQuestionIndex];
                  const options = [
                    question.optionA,
                    question.optionB,
                    question.optionC,
                    question.optionD,
                  ];
                  const studentIndex = answerToIndex(question.selectedAnswer);
                  const correctIndex = answerToIndex(question.correctAnswer);
                  const skipped = studentIndex < 0;

                  return (
                    <div className="bg-[var(--theme-surface)] p-5 rounded-3xl border border-[#E9EDF7] space-y-4 shadow-soft">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                              skipped
                                ? "bg-orange-100 text-orange-700"
                                : question.isCorrect
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {skipped
                              ? "⚠ Bỏ qua"
                              : question.isCorrect
                                ? "✓ Câu đúng"
                                : "✗ Câu sai"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            Câu {activeReviewQuestionIndex + 1}/{reviewData.questions.length}
                          </span>
                        </div>

                              <button
                                  type="button"
                                  disabled={
                                      savingQuestionId ===
                                      question.questionId
                                  }
                                  onClick={() =>
                                      void togglePersonalQuestion(
                                          question.questionId,
                                      )
                                  }
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center border transition ${savedQuestionIds.has(
                                      question.questionId,
                                  )
                                          ? "bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]"
                                          : "bg-[var(--theme-surface-soft)] text-slate-400 border-transparent hover:text-[var(--theme-primary)]"
                                      } ${savingQuestionId ===
                                          question.questionId
                                          ? "opacity-50 cursor-wait"
                                          : ""
                                      }`}
                                  title={
                                      savedQuestionIds.has(
                                          question.questionId,
                                      )
                                          ? "Bỏ lưu câu hỏi"
                                          : "Lưu câu hỏi"
                                  }
                              >
                                  {savingQuestionId ===
                                      question.questionId ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                      <Bookmark
                                          className={`w-4 h-4 ${savedQuestionIds.has(
                                              question.questionId,
                                          )
                                                  ? "fill-current"
                                                  : ""
                                              }`}
                                      />
                                  )}
                              </button>
                      </div>

                      <p className="text-xs font-medium text-[var(--theme-text)] leading-relaxed bg-[var(--theme-surface-soft)] p-4 rounded-2xl border border-[var(--theme-border)]">
                        {question.noiDung}
                      </p>

                      <div className="space-y-2">
                        {options.map((option, optionIndex) => {
                          const isStudentSelect = studentIndex === optionIndex;
                          const isCorrect = correctIndex === optionIndex;

                          let borderBg =
                            "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)]";

                          if (isStudentSelect && isCorrect) {
                            borderBg =
                              "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                          } else if (isStudentSelect && !isCorrect) {
                            borderBg =
                              "border-rose-400 bg-rose-50 text-rose-900 font-semibold";
                          } else if (isCorrect) {
                            borderBg =
                              "border-emerald-400 bg-emerald-50/60 text-emerald-900 font-semibold border-dashed";
                          }

                          return (
                            <div
                              key={optionIndex}
                              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 ${borderBg}`}
                            >
                              <span>
                                {answerLetters[optionIndex]}. {option}
                              </span>

                              <div className="flex gap-1.5 shrink-0">
                                {isStudentSelect && (
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                                      isCorrect
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : "bg-rose-100 text-rose-800 border-rose-300"
                                    }`}
                                  >
                                    {isCorrect ? "Bạn chọn - Đúng" : "Bạn chọn - Sai"}
                                  </span>
                                )}

                                {isCorrect && !isStudentSelect && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-extrabold uppercase">
                                    ✓ Đáp án đúng
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Backend Question hiện chưa có trường explanation -> không tạo lời giải giả */}
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/40 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 block">
                          👨‍🏫 LƯỢC GIẢI SƯ PHẠM
                        </span>
                        <p className="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
                          Giáo viên chưa có trường dữ liệu lời giải chi tiết cho câu hỏi này. Có thể bổ sung Question.GiaiThich sau.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => {
                    setReviewExamId(null);
                    setReviewData(null);
                  }}
                  className="w-full bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white font-extrabold text-xs py-3 rounded-2xl shadow-pastel-blue transition"
                >
                  Hoàn tất xem lại bài thi
                </button>
              </div>
            )}
          </div>
        )}

        {/* =============================================================
            RETAKE SCREEN - API thật /api/students/exams/{id}/retake
        ============================================================= */}
        {activeRetakeIndex !== null && retakeConfig && (
          <div className="bg-[var(--theme-surface)] p-5 rounded-3xl border border-[#E9EDF7] space-y-5 shadow-soft animate-fade-in pb-10">
            <div className="flex justify-between items-center pb-2 border-b border-[#F1F3F9]">
              <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                CHẾ ĐỘ LÀM LẠI: TOÀN BỘ ĐỀ
              </span>

              <span className="text-slate-400 text-xs font-mono font-bold">
                Câu {activeRetakeIndex + 1}/{retakeConfig.retakeQuestions.length}
              </span>
            </div>

            {!isRetakeCompleted ? (
              <div className="space-y-4">
                <div className="w-full h-1.5 bg-[var(--theme-surface-soft)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-emerald-400 transition-all duration-300"
                    style={{
                      width: `${((activeRetakeIndex + 1) / retakeConfig.retakeQuestions.length) * 100}%`,
                    }}
                  />
                </div>

                {(() => {
                  const question = retakeConfig.retakeQuestions[activeRetakeIndex];
                  if (!question) return null;

                  return (
                    <div className="space-y-4 animate-fade-in">
                      <p className="text-xs font-medium text-[var(--theme-text)] leading-relaxed bg-[#F8FAFF] p-4 rounded-2xl border border-[#E9EDF7]">
                        {question.text}
                      </p>

                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = retakeAnswers[question.id] === optionIndex;

                          return (
                            <button
                              type="button"
                              key={optionIndex}
                              onClick={() =>
                                setRetakeAnswers((previous) => ({
                                  ...previous,
                                  [question.id]: optionIndex,
                                }))
                              }
                              className={`w-full text-left p-3.5 rounded-2xl border text-xs font-semibold transition flex items-center gap-3 ${
                                isSelected
                                  ? "bg-[#EBF2FF] border-[var(--theme-primary)] text-[var(--theme-primary)] shadow-sm translate-x-1"
                                  : "bg-[var(--theme-surface)] border-[#E9EDF7] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)]"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border shrink-0 ${
                                  isSelected
                                    ? "bg-[var(--theme-primary)] text-white border-transparent"
                                    : "bg-[var(--theme-surface-soft)] text-slate-400 border-[var(--theme-border)]"
                                }`}
                              >
                                {answerLetters[optionIndex]}
                              </div>
                              <span className="flex-1">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {retakeError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold p-3 rounded-xl">
                    {retakeError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#F1F3F9]">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveRetakeIndex((previous) =>
                        Math.max(0, (previous ?? 0) - 1),
                      )
                    }
                    disabled={activeRetakeIndex === 0}
                    className="px-4 py-2.5 text-xs text-slate-400 font-bold border border-[#E9EDF7] rounded-xl disabled:opacity-30"
                  >
                    Quay lại
                  </button>

                  {activeRetakeIndex === retakeConfig.retakeQuestions.length - 1 ? (
                    <button
                      type="button"
                      disabled={isSubmittingRetake}
                      onClick={() => void handleSubmitRetake()}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-[var(--theme-primary)] text-white font-extrabold text-xs rounded-xl shadow-soft disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      {isSubmittingRetake && <Loader2 className="w-4 h-4 animate-spin" />}
                      Nộp bài làm lại
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveRetakeIndex((previous) =>
                          Math.min(
                            retakeConfig.retakeQuestions.length - 1,
                            (previous ?? 0) + 1,
                          ),
                        )
                      }
                      className="px-4 py-2.5 bg-[var(--theme-primary)] text-white font-bold text-xs rounded-xl"
                    >
                      Tiếp theo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-center py-6 animate-fade-in">
                <div className="inline-flex w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-display font-extrabold text-[var(--theme-text)] text-base">
                    Hoàn thành lượt làm lại
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Kết quả lượt làm lại đã được lưu.
                  </p>
                </div>

                {retakeResult && (
                  <div className="p-4 bg-[var(--theme-surface-soft)] rounded-2xl border border-[#E9EDF7] space-y-1 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      ĐIỂM LẦN LÀM LẠI
                    </span>
                    <span className="text-lg font-extrabold text-[var(--theme-primary)] font-mono">
                      {retakeResult.diem.toFixed(2)} / 10đ
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {retakeResult.correctQuestion}/{retakeResult.totalQuestion} câu đúng
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveRetakeIndex(null);
                    setRetakeExamId(null);
                    setRetakeConfig(null);
                    setRetakeResult(null);
                    setIsRetakeCompleted(false);
                  }}
                  className="w-full bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white font-extrabold text-xs py-3 rounded-2xl shadow-pastel-blue transition"
                >
                  Quay lại lịch sử bài làm
                </button>
              </div>
            )}
          </div>
        )}

        {/* =============================================================
            TAB LỊCH SỬ - dữ liệu thật StudentResultDto[]
        ============================================================= */}
        {activeTab === "history" && reviewExamId === null && activeRetakeIndex === null && (
          <div className="space-y-5 animate-fade-in pb-10">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="bg-gradient-to-tr from-white to-[#FAFCFF] p-4 rounded-3xl border border-[#E9EDF7] shadow-soft">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">📚 Lượt đã thi</span>
                <span className="text-base font-extrabold text-[var(--theme-text)] font-mono">
                  {summaryStats.totalExamsTaken}
                </span>
                <p className="text-[8px] text-slate-400 pt-0.5">Bao gồm các lần làm lại</p>
              </div>

              <div className="bg-gradient-to-tr from-white to-[#FAFCFF] p-4 rounded-3xl border border-[#E9EDF7] shadow-soft">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">📝 Số câu đã làm</span>
                <span className="text-base font-extrabold text-[var(--theme-text)] font-mono">
                  {summaryStats.totalQuestionsAnswered} câu
                </span>
                <p className="text-[8px] text-slate-400 pt-0.5">Dữ liệu ExamResult</p>
              </div>

              <div className="bg-gradient-to-tr from-white to-[#FAFCFF] p-4 rounded-3xl border border-[#E9EDF7] shadow-soft">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">🎯 Điểm trung bình</span>
                <span className="text-base font-extrabold text-[var(--theme-primary)] font-mono">
                  {summaryStats.averageScore.toFixed(2)}đ
                </span>
                <p className="text-[8px] text-slate-400 pt-0.5">Thang điểm 10</p>
              </div>

              <div className="bg-gradient-to-tr from-white to-[#FAFCFF] p-4 rounded-3xl border border-[#E9EDF7] shadow-soft">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">🏆 Điểm tốt nhất</span>
                <span className="text-base font-extrabold text-emerald-500 font-mono">
                  {summaryStats.bestScore.toFixed(2)}đ
                </span>
                <p className="text-[8px] text-slate-400 pt-0.5">Kỷ lục cá nhân</p>
              </div>
            </div>

            <div className="space-y-3 bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] shadow-soft">
              <div className="flex bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] rounded-2xl items-center px-3 py-1.5 gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm kiếm tên đề thi đã làm..."
                  className="bg-transparent outline-none text-xs flex-1 text-[var(--theme-text-muted)] placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block px-1">
                  LỌC NHANH
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {["All", "Passed", "Failed", "Excellent", "This Week", "This Month"].map(
                    (filter) => (
                      <button
                        type="button"
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`text-[9px] font-bold px-2.5 py-1.5 rounded-xl transition whitespace-nowrap border ${
                          selectedFilter === filter
                            ? "bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/20 font-extrabold"
                            : "bg-[var(--theme-surface)] text-[var(--theme-text-light)] border-[#E9EDF7]"
                        }`}
                      >
                        {filter === "All"
                          ? "Tất cả"
                          : filter === "Passed"
                            ? "Đạt (>=5)"
                            : filter === "Failed"
                              ? "Dưới 5"
                              : filter === "Excellent"
                                ? "Giỏi (>=8)"
                                : filter === "This Week"
                                  ? "Tuần này"
                                  : "Tháng này"}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {historyError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-2xl p-3">
                {historyError}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h5 className="font-display font-extrabold text-[var(--theme-text)] text-sm">
                  Các đề thi đã rèn luyện
                </h5>
                <span className="text-[10px] text-slate-400 font-mono">
                  {groupedExams.length} đề
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="bg-[var(--theme-surface)] p-10 rounded-3xl border border-[#E9EDF7] text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-primary)] mx-auto" />
                </div>
              ) : groupedExams.length === 0 ? (
                <div className="bg-[var(--theme-surface)] p-8 rounded-3xl border border-[#E9EDF7] text-center space-y-2">
                  <Award className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-400 italic">
                    Chưa có bài thi phù hợp với bộ lọc.
                  </p>
                </div>
              ) : (
                <>
                {examPagination.pageItems.map((group) => {
                  const selectedId = selectedLogIdForExam[group.examId];
                  const activeAttempt =
                    group.attempts.find((item) => item.examResultId === selectedId) ??
                    group.attempts[0];

                  const score = activeAttempt.diem;
                  let statusText = "Cần cố gắng";
                  let statusColor = "bg-rose-50 text-rose-600 border border-rose-100";

                  if (score >= 8) {
                    statusText = "🏆 Xuất sắc";
                    statusColor = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                  } else if (score >= 5) {
                    statusText = "👍 Đạt";
                    statusColor = "bg-[#EFF4FF] text-[var(--theme-primary)] border border-[var(--theme-primary)]/10";
                  }

                  return (
                    <div
                      key={group.examId}
                      className="bg-[var(--theme-surface)] p-5 rounded-[20px] border border-[#E9EDF7] shadow-soft hover:shadow-md transition-all duration-300 space-y-4 animate-fade-in"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${statusColor}`}>
                            {statusText}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(activeAttempt.submittedAt)}
                          </span>
                        </div>

                        <h4 className="font-display font-extrabold text-[#2D3748] text-sm tracking-tight leading-snug">
                          {activeAttempt.tenBaiKT}
                        </h4>

                        <div className="flex gap-2 text-[10px] text-slate-400 font-semibold">
                          <span>Lần thi: <strong>{activeAttempt.attemptNumber}</strong></span>
                          <span>•</span>
                          <span>Điểm: <strong>{activeAttempt.diem.toFixed(2)}/10</strong></span>
                        </div>
                      </div>

                      <div className="p-3 bg-[var(--theme-surface-soft)] rounded-xl grid grid-cols-2 text-center text-xs font-semibold gap-1.5">
                        <div className="border-r border-[var(--theme-border)]">
                          <span className="text-[9px] text-slate-400 block uppercase leading-none pb-0.5">
                            Kết quả đúng
                          </span>
                          <span className="text-[var(--theme-text-muted)] font-mono">
                            {activeAttempt.correctQuestion}/{activeAttempt.totalQuestion} câu
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase leading-none pb-0.5">
                            Câu sai/bỏ
                          </span>
                          <span className="text-rose-500 font-mono">
                            {activeAttempt.totalQuestion - activeAttempt.correctQuestion} câu
                          </span>
                        </div>
                      </div>

                      {group.attempts.length > 1 && (
                        <div className="pt-3 border-t border-dashed border-[#E9EDF7] space-y-2">
                          <span className="text-[9.5px] font-extrabold text-slate-400 block uppercase tracking-wider">
                            ⏱ Lịch sử nâng điểm ({group.attempts.length} lượt)
                          </span>

                          <div className="flex flex-wrap gap-1.5">
                            {[...group.attempts]
                              .sort((a, b) => a.attemptNumber - b.attemptNumber)
                              .map((attempt) => {
                                const isSelected = activeAttempt.examResultId === attempt.examResultId;

                                return (
                                  <button
                                    type="button"
                                    key={attempt.examResultId}
                                    onClick={() =>
                                      setSelectedLogIdForExam((previous) => ({
                                        ...previous,
                                        [group.examId]: attempt.examResultId,
                                      }))
                                    }
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition ${
                                      isSelected
                                        ? "bg-gradient-to-r from-[var(--theme-primary)] to-indigo-500 border-[var(--theme-primary)] text-white shadow-sm"
                                        : "text-[var(--theme-text-muted)] bg-[var(--theme-surface-soft)] border-[var(--theme-border)]"
                                    }`}
                                  >
                                    Lần {attempt.attemptNumber}: {attempt.diem.toFixed(2)}đ
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() =>
                            void triggerReviewExam(group.examId, activeAttempt.examResultId)
                          }
                          className="py-2.5 rounded-xl border border-[#E9EDF7] text-[var(--theme-text-muted)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-soft)] transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem lại
                        </button>

                        <button
                          type="button"
                          disabled={isRetakeLoading}
                          onClick={() =>
                            void triggerRetakeExam(group.examId, activeAttempt.examResultId)
                          }
                          className="py-2.5 rounded-xl border border-rose-100 text-rose-500 bg-rose-50/20 hover:bg-rose-50/50 transition flex items-center justify-center gap-1 disabled:opacity-60"
                        >
                          {isRetakeLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Làm lại
                        </button>
                      </div>
                    </div>
                  );
                })}

                <Pagination
                  page={examPagination.page}
                  pageSize={examPagination.pageSize}
                  total={examPagination.total}
                  onPageChange={examPagination.setPage}
                  itemLabel="đề thi"
                />
                </>
              )}
            </div>
          </div>
        )}

        {/* =============================================================
            DIALOG RETAKE
        ============================================================= */}
        {showRetakeConfirmDialog && retakeConfig && (
          <div className="fixed inset-0 z-[55] bg-black/45 flex items-center justify-center p-5 animate-fade-in">
            <div className="bg-[var(--theme-surface)] rounded-3xl p-6 shadow-2xl space-y-4 max-w-sm w-full">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h4 className="font-display font-extrabold text-[var(--theme-text)] text-sm">
                  Bạn có muốn làm lại đề thi này?
                </h4>
              </div>

              <div className="p-3.5 bg-[var(--theme-surface-soft)] rounded-2xl border border-[#E9EDF7] space-y-2 text-xs">
                <p className="font-semibold text-[var(--theme-text-muted)]">
                  {retakeConfig.examTitle}
                </p>
                <div className="flex justify-between gap-2 text-[10px] text-slate-400">
                  <span>
                    Điểm lượt chọn: <strong>{retakeConfig.previousScore.toFixed(2)}đ</strong>
                  </span>
                  <span>
                    {retakeConfig.previousCorrect}/{retakeConfig.previousTotal} đúng
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block px-1">
                  CHỌN PHƯƠNG THỨC
                </span>

                <button
                  type="button"
                  className="w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between border-[var(--theme-primary)] bg-[#EBF2FF] text-[var(--theme-primary)]"
                >
                  <span>🔄 Làm lại toàn bộ đề thi</span>
                  <span className="text-[9px] opacity-75">
                    {retakeConfig.retakeQuestions.length} câu
                  </span>
                </button>

                <button
                  type="button"
                  disabled
                  className="w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between border-[var(--theme-border)] bg-[var(--theme-surface-soft)] text-slate-400 opacity-70 cursor-not-allowed"
                  title="Chưa hỗ trợ"
                >
                  <span>❌ Chỉ làm câu sai</span>
                  <span className="text-[9px] font-bold">Làm sau</span>
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRetakeConfirmDialog(false);
                    setRetakeExamId(null);
                    setRetakeConfig(null);
                  }}
                  className="flex-1 py-3 text-xs bg-[var(--theme-surface-soft)] text-[var(--theme-text-light)] font-bold rounded-xl transition"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRetake}
                  className="flex-1 py-3 text-xs bg-[var(--theme-primary)] text-white hover:bg-[#6384DF] font-bold rounded-xl transition shadow-pastel-blue"
                >
                  Bắt đầu làm lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            SAVED QUESTIONS - giữ tab, chưa gọi endpoint chưa có
        ============================================================= */}
              {activeTab === "saved-questions" &&
                  reviewExamId === null &&
                  activeRetakeIndex === null && (
                      <div className="space-y-4 animate-fade-in pb-10">

                          {/* Header */}
                          <div className="bg-gradient-to-tr from-[#EFF4FF] to-white p-5 rounded-3xl border border-[var(--theme-primary)]/10 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--theme-primary)]">
                                      <Compass className="w-4 h-4" />

                                      <span>
                                          Ngân hàng câu hỏi cá nhân
                                      </span>
                                  </div>

                                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                                      {savedQuestions.length} câu
                                  </span>
                              </div>

                              <p className="text-[10px] text-[var(--theme-text-light)] leading-relaxed">
                                  Các câu hỏi bạn đã đánh dấu khi
                                  xem lại bài thi.
                              </p>
                          </div>


                          {/* Loading */}
                          {isLoadingSavedQuestions && (
                              <div className="bg-[var(--theme-surface)] p-8 rounded-3xl text-center border border-[var(--theme-border)]">
                                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-[var(--theme-primary)]" />

                                  <p className="text-xs text-slate-400 mt-3">
                                      Đang tải câu hỏi đã lưu...
                                  </p>
                              </div>
                          )}


                          {/* Error */}
                          {!isLoadingSavedQuestions &&
                              savedQuestionsError && (
                                  <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 text-center">
                                      <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />

                                      <p className="text-xs font-bold text-rose-600 mt-2">
                                          {savedQuestionsError}
                                      </p>

                                      <button
                                          type="button"
                                          onClick={() =>
                                              void loadSavedQuestions()
                                          }
                                          className="mt-3 px-4 py-2 rounded-xl bg-white border border-rose-200 text-[10px] font-bold text-rose-600"
                                      >
                                          Thử lại
                                      </button>
                                  </div>
                              )}


                          {/* Empty */}
                          {!isLoadingSavedQuestions &&
                              !savedQuestionsError &&
                              savedQuestions.length === 0 && (
                                  <div className="bg-[var(--theme-surface)] p-8 rounded-3xl text-center border border-[var(--theme-border)] space-y-2">
                                      <Bookmark className="w-9 h-9 text-slate-300 mx-auto" />

                                      <p className="text-xs font-bold text-[var(--theme-text-muted)]">
                                          Chưa có câu hỏi nào được lưu
                                      </p>

                                      <p className="text-[10px] text-slate-400">
                                          Vào lịch sử bài thi → Xem lại
                                          bài → nhấn biểu tượng Bookmark
                                          ở câu hỏi muốn ôn tập.
                                      </p>
                                  </div>
                              )}


                          {/* Danh sách thật */}
                          {!isLoadingSavedQuestions &&
                              !savedQuestionsError &&
                              savedQuestions.length > 0 && (
                                  <div className="space-y-3">
                                      {savedQuestions.map(
                                          (question, index) => {
                                              const options = [
                                                  {
                                                      key: "A",
                                                      value: question.optionA,
                                                  },
                                                  {
                                                      key: "B",
                                                      value: question.optionB,
                                                  },
                                                  {
                                                      key: "C",
                                                      value: question.optionC,
                                                  },
                                                  {
                                                      key: "D",
                                                      value: question.optionD,
                                                  },
                                              ];

                                              return (
                                                  <div
                                                      key={question.id}
                                                      className="bg-[var(--theme-surface)] rounded-3xl border border-[var(--theme-border)] shadow-soft overflow-hidden"
                                                  >
                                                      <div className="p-5 space-y-4">

                                                          {/* Metadata */}
                                                          <div className="flex items-start justify-between gap-3">
                                                              <div className="space-y-1">
                                                                  <div className="flex flex-wrap gap-1.5">
                                                                      <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-[#EFF4FF] text-[var(--theme-primary)]">
                                                                          {question.monHoc}
                                                                      </span>

                                                                      <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-50 text-slate-500">
                                                                          {question.khoi}
                                                                      </span>
                                                                  </div>

                                                                  <p className="text-[9px] text-slate-400">
                                                                      Đã lưu{" "}
                                                                      {formatDate(
                                                                          question.createdAt,
                                                                      )}
                                                                  </p>
                                                              </div>

                                                              <button
                                                                  type="button"
                                                                  disabled={
                                                                      savingQuestionId ===
                                                                      question.questionId
                                                                  }
                                                                  onClick={() =>
                                                                      void togglePersonalQuestion(
                                                                          question.questionId,
                                                                      )
                                                                  }
                                                                  className="w-8 h-8 shrink-0 rounded-xl bg-[var(--theme-primary)] text-white flex items-center justify-center disabled:opacity-50"
                                                                  title="Bỏ lưu"
                                                              >
                                                                  {savingQuestionId ===
                                                                      question.questionId ? (
                                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                                  ) : (
                                                                      <Bookmark className="w-4 h-4 fill-current" />
                                                                  )}
                                                              </button>
                                                          </div>


                                                          {/* Question */}
                                                          <div>
                                                              <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                                  Câu {index + 1}
                                                              </span>

                                                              <p className="text-xs font-semibold text-[var(--theme-text)] leading-relaxed mt-1">
                                                                  {question.noiDung}
                                                              </p>
                                                          </div>


                                                          {/* Options */}
                                                          <div className="space-y-2">
                                                              {options.map(
                                                                  (option) => {
                                                                      const isCorrect =
                                                                          option.key ===
                                                                          question.correctAnswer
                                                                              ?.trim()
                                                                              .toUpperCase();

                                                                      return (
                                                                          <div
                                                                              key={
                                                                                  option.key
                                                                              }
                                                                              className={`p-3 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${isCorrect
                                                                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                                                                                      : "border-[var(--theme-border)] bg-[var(--theme-surface-soft)] text-[var(--theme-text-muted)]"
                                                                                  }`}
                                                                          >
                                                                              <span>
                                                                                  {
                                                                                      option.key
                                                                                  }
                                                                                  .{" "}
                                                                                  {
                                                                                      option.value
                                                                                  }
                                                                              </span>

                                                                              {isCorrect && (
                                                                                  <span className="text-[8px] shrink-0 font-extrabold uppercase px-2 py-0.5 bg-emerald-100 border border-emerald-200 rounded-md">
                                                                                      Đáp án đúng
                                                                                  </span>
                                                                              )}
                                                                          </div>
                                                                      );
                                                                  },
                                                              )}
                                                          </div>
                                                      </div>
                                                  </div>
                                              );
                                          },
                                      )}
                                  </div>
                              )}
                      </div>
                  )}
      </div>
    </div>
  );
}
