import React from "react";
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { CleanHistoryItem, SubjectId } from "../types";
import {
  getAvailableStudentExams,
  getMyStudentResults,
  getStudentExamDetail,
  getStudentResultAttemptDetail,
  submitStudentExam,
  type StudentAnswerRequest,
  type StudentAvailableExamDto,
  type StudentExamDetailDto,
  type StudentResultDetailDto,
  type SubmitStudentExamResponse,
} from "../../services/studentService";
import StudentResultReview from "./StudentResultReview";

interface PracticeTabProps {
  onEarnGems: (amount: number) => void;
  onAddHistory: (item: CleanHistoryItem) => void;
  onOpenAIChat: (initialPrompt?: string) => void;
  initialSubjectId?: SubjectId | null;
  initialExamId?: string | null;
  onClearNavigation?: () => void;
}

type AnswerLetter = "A" | "B" | "C" | "D";
const answerLetters: AnswerLetter[] = ["A", "B", "C", "D"];

export default function PracticeTab({
  onEarnGems,
  initialExamId,
  onClearNavigation,
}: PracticeTabProps) {
  const [exams, setExams] = React.useState<StudentAvailableExamDto[]>([]);
  const [completedExamIds, setCompletedExamIds] = React.useState<Set<string>>(new Set());
  const [loadingList, setLoadingList] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [activeSubject, setActiveSubject] = React.useState<string>("all");

  const [activeExam, setActiveExam] = React.useState<StudentExamDetailDto | null>(null);
  const [loadingExam, setLoadingExam] = React.useState(false);
  const [examError, setExamError] = React.useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = React.useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitResult, setSubmitResult] = React.useState<SubmitStudentExamResponse | null>(null);
  const [reviewDetail, setReviewDetail] = React.useState<StudentResultDetailDto | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = React.useState(false);

  const loadExamList = React.useCallback(async () => {
    try {
      setLoadingList(true);
      setListError(null);

      const [available, results] = await Promise.all([
        getAvailableStudentExams(),
        getMyStudentResults(),
      ]);

      setExams(available);
      setCompletedExamIds(new Set(results.map((item) => item.examId)));
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Không tải được danh sách đề thi.",
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    void loadExamList();
  }, [loadExamList]);

  const subjects = React.useMemo(() => {
    return Array.from(
      new Set(
        exams
          .map((exam) => exam.monHoc?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    );
  }, [exams]);

  const filteredExams = React.useMemo(() => {
    if (activeSubject === "all") return exams;
    return exams.filter((exam) => exam.monHoc === activeSubject);
  }, [activeSubject, exams]);

  const openExam = React.useCallback(
    async (examId: string) => {
      if (completedExamIds.has(examId)) return;

      try {
        setLoadingExam(true);
        setExamError(null);
        setSubmitError(null);
        setSubmitResult(null);
        setReviewDetail(null);
        setReviewError(null);
        setSelectedAnswers({});
        setFlaggedQuestions({});
        setCurrentQuestionIndex(0);
        setShowSubmitConfirm(false);
        setShowQuitConfirm(false);

        const detail = await getStudentExamDetail(examId);
        setActiveExam(detail);
        setTimeLeftSeconds(Math.max(1, detail.thoiLuong) * 60);
      } catch (err) {
        setExamError(err instanceof Error ? err.message : "Không mở được đề thi.");
      } finally {
        setLoadingExam(false);
      }
    },
    [completedExamIds],
  );

  React.useEffect(() => {
    if (!initialExamId) return;

    const isGuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        initialExamId,
      );

    if (isGuid) void openExam(initialExamId);
    onClearNavigation?.();
  }, [initialExamId, onClearNavigation, openExam]);

  const submitCurrentExam = React.useCallback(async () => {
    if (!activeExam || isSubmitting || submitResult) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setShowSubmitConfirm(false);

      const answers: StudentAnswerRequest[] = (Object.entries(selectedAnswers) as Array<[string, string]>).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const result = await submitStudentExam(activeExam.id, answers);
      setSubmitResult(result);
      setCompletedExamIds((previous) => new Set([...previous, activeExam.id]));

      if (result.showResultAfterSubmit) {
        setReviewLoading(true);
        setReviewError(null);
        try {
          setReviewDetail(await getStudentResultAttemptDetail(result.examResultId));
        } catch (reviewErr) {
          setReviewError(
            reviewErr instanceof Error
              ? reviewErr.message
              : "Đã nộp bài nhưng chưa tải được đáp án chi tiết.",
          );
        } finally {
          setReviewLoading(false);
        }
      }

      // Chỉ là phần thưởng giao diện. Điểm chính thức do backend chấm và lưu SQL.
      if (result.showResultAfterSubmit) {
        onEarnGems(result.correctQuestion * 10);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nộp bài thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeExam, isSubmitting, onEarnGems, selectedAnswers, submitResult]);

  React.useEffect(() => {
    if (!activeExam || submitResult || isSubmitting) return;

    const timer = window.setInterval(() => {
      setTimeLeftSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeExam, isSubmitting, submitResult]);

  React.useEffect(() => {
    if (activeExam && timeLeftSeconds === 0 && !submitResult && !isSubmitting) {
      void submitCurrentExam();
    }
  }, [activeExam, isSubmitting, submitCurrentExam, submitResult, timeLeftSeconds]);

  const closeExam = () => {
    setActiveExam(null);
    setSubmitResult(null);
    setReviewDetail(null);
    setReviewLoading(false);
    setReviewError(null);
    setSubmitError(null);
    setExamError(null);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeLeftSeconds(0);
    setShowSubmitConfirm(false);
    setShowQuitConfirm(false);
    void loadExamList();
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loadingExam) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--theme-bg)]">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang mở đề thi...
        </div>
      </div>
    );
  }

  if (!activeExam) {
    return (
      <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 py-4 md:py-7 space-y-4 md:space-y-6 no-scrollbar scroll-smooth bg-[var(--theme-bg)]">
        {/* FILTER MÔN TỪ BACKEND */}
        <div className="flex gap-2 p-1 bg-[var(--theme-surface-soft)] rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setActiveSubject("all")}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 min-w-[95px] ${
              activeSubject === "all"
                ? "bg-[var(--theme-surface)] text-[var(--theme-primary)] shadow-soft"
                : "text-[var(--theme-text-light)] hover:bg-[var(--theme-surface)]/30"
            }`}
          >
            Tất cả
          </button>
          {subjects.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => setActiveSubject(subject)}
              className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 min-w-[95px] ${
                activeSubject === subject
                  ? "bg-[var(--theme-surface)] text-[var(--theme-primary)] shadow-soft"
                  : "text-[var(--theme-text-light)] hover:bg-[var(--theme-surface)]/30"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        <div className="bg-amber-50/60 p-4 rounded-3xl border border-amber-200/40 text-xs text-amber-800 space-y-1">
          <span className="font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Đề thi đã được kiểm duyệt
          </span>
          <p className="font-sans leading-relaxed text-[var(--theme-text-muted)]">
            Danh sách bên dưới chỉ gồm các đề đã được giáo viên gửi duyệt và Admin phát hành, đồng thời phù hợp với khối của tài khoản học sinh.
          </p>
        </div>

        <div className="flex items-center justify-between px-1">
          <h5 className="font-display font-bold text-[var(--theme-text)] text-sm">Danh Sách Đề Thi Sẵn Có</h5>
          <button
            type="button"
            onClick={() => void loadExamList()}
            className="flex items-center gap-1 text-[10px] font-black text-[var(--theme-primary)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} /> Tải lại
          </button>
        </div>

        {listError && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs font-bold text-rose-600">
            {listError}
          </div>
        )}

        {examError && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs font-bold text-rose-600">
            {examError}
          </div>
        )}

        {loadingList ? (
          <div className="min-h-[240px] bg-[var(--theme-surface)] rounded-3xl border border-[var(--theme-border)] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-primary)]" />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-[var(--theme-surface)] p-8 rounded-3xl border border-[#E9EDF7] text-center">
            <BookOpen className="w-9 h-9 mx-auto text-slate-300" />
            <p className="text-sm font-black text-[var(--theme-text)] mt-3">Chưa có đề thi phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">Đề sẽ xuất hiện sau khi được Admin duyệt và phát hành.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => {
              const completed = completedExamIds.has(exam.id);
              return (
                <article
                  key={exam.id}
                  className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] hover:border-[var(--theme-primary)]/30 shadow-soft transition duration-300 space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          ✓ Admin đã duyệt
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-[#EBF2FF] text-[var(--theme-primary)]">
                          {exam.monHoc}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-[var(--theme-surface-soft)] text-[var(--theme-text-light)]">
                          {exam.khoi}
                        </span>
                      </div>
                      {completed && (
                        <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Đã làm</span>
                      )}
                    </div>

                    <h4 className="font-display font-extrabold text-[#2D3748] text-sm tracking-tight leading-snug">
                      {exam.tenBaiKT}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                      <UserRound className="w-3.5 h-3.5" /> Giáo viên: {exam.giaoVien || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--theme-text-light)] font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Thời gian: {exam.thoiLuong} phút</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>Số câu: {exam.totalQuestions} câu</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={completed}
                    onClick={() => void openExam(exam.id)}
                    className={`w-full font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      completed
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-[#EBF2FF] hover:bg-[#D7E4FB] text-[var(--theme-primary)]"
                    }`}
                  >
                    {completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành — làm lại trong tab Kết quả
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Bắt đầu giải đề
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const activeQuestion = activeExam.questions[currentQuestionIndex];

  if (submitResult) {
    return (
      <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 py-4 md:py-7 bg-[var(--theme-bg)] no-scrollbar">
        <div className="max-w-6xl mx-auto bg-[var(--theme-surface)] rounded-3xl border border-[#E9EDF7] p-5 md:p-6 space-y-5 shadow-soft">
          <div className="text-center space-y-2 py-2">
            <div className="inline-flex w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display font-extrabold text-[#2D3748] text-xl">Đã nộp bài thành công!</h3>
          </div>

          {submitResult.showResultAfterSubmit ? <div className="grid grid-cols-2 gap-3 p-4 bg-[var(--theme-surface-soft)] rounded-2xl border border-[#E9EDF7]">
            <div className="text-center py-2 border-r border-[var(--theme-border)]">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Kết Quả Đúng</span>
              <span className="font-display font-extrabold text-[var(--theme-text)] text-lg">
                {submitResult.correctQuestion} / {submitResult.totalQuestion} câu
              </span>
            </div>
            <div className="text-center py-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Điểm Thang 10</span>
              <span className="font-display font-extrabold text-[var(--theme-primary)] text-lg">
                {submitResult.diem.toFixed(2)} đ
              </span>
            </div>
          </div> : <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center text-xs font-bold text-amber-700">Admin đã cấu hình không hiển thị điểm ngay sau khi nộp. Bạn có thể xem khi kết quả được công bố.</div>}

          {reviewLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Đang tải đáp án chi tiết...
            </div>
          ) : reviewDetail ? (
            <StudentResultReview detail={reviewDetail} />
          ) : reviewError ? (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs font-bold text-rose-600">{reviewError}</div>
          ) : null}

          <button
            type="button"
            onClick={closeExam}
            className="w-full bg-[var(--theme-primary)] hover:bg-[#6384DF] text-white font-extrabold text-xs py-3 rounded-xl shadow-pastel-blue transition"
          >
            Hoàn thành phiên thi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 py-4 md:py-7 bg-[var(--theme-bg)] no-scrollbar scroll-smooth">
      <div className="max-w-6xl mx-auto bg-[var(--theme-surface)] rounded-3xl border border-[#E9EDF7] p-5 space-y-5 animate-fade-in relative shadow-soft">
        {/* HEADER */}
        <div className="flex justify-between items-center gap-3 pb-3 border-b border-[var(--theme-border)]">
          <button
            type="button"
            onClick={() => setShowQuitConfirm(true)}
            className="text-slate-400 hover:text-rose-500 transition text-xs font-semibold flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Thoát
          </button>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
            timeLeftSeconds < 60 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-[#F8FAFF] text-[var(--theme-primary)]"
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <span className="text-slate-400 text-xs font-mono font-bold">
            Câu {currentQuestionIndex + 1}/{activeExam.questions.length}
          </span>
        </div>

        <div className="w-full h-1 bg-[#E9EDF7] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--theme-primary)] transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / activeExam.questions.length) * 100}%` }}
          />
        </div>

        {activeQuestion && (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--theme-primary)]">
                  Câu hỏi #{currentQuestionIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFlaggedQuestions((previous) => ({
                      ...previous,
                      [activeQuestion.id]: !previous[activeQuestion.id],
                    }))
                  }
                  className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md font-bold transition ${
                    flaggedQuestions[activeQuestion.id]
                      ? "bg-amber-100 text-amber-600"
                      : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-light)]"
                  }`}
                >
                  <Bookmark className="w-3 h-3" /> Đánh dấu xem lại
                </button>
              </div>

              <p className="text-sm font-sans font-medium text-[var(--theme-text)] leading-relaxed bg-[#F8FAFF] p-4 rounded-2xl border border-[var(--theme-border)]">
                {activeQuestion.noiDung}
              </p>
              <p className="text-[11px] font-bold text-[var(--theme-text-light)]">
                {activeQuestion.type === "multiple_choice"
                  ? "Chọn tất cả đáp án đúng. Chọn thiếu hoặc thừa đều không được tính điểm."
                  : "Chọn một đáp án đúng."}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {[
                activeQuestion.optionA,
                activeQuestion.optionB,
                activeQuestion.optionC,
                activeQuestion.optionD,
              ].map((option, index) => {
                const letter = answerLetters[index];
                const selected = (selectedAnswers[activeQuestion.id] ?? "")
                  .split(",")
                  .includes(letter);
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setSelectedAnswers((previous) => {
                      if (activeQuestion.type !== "multiple_choice") {
                        return { ...previous, [activeQuestion.id]: letter };
                      }

                      const selectedSet = new Set(
                        (previous[activeQuestion.id] ?? "").split(",").filter(Boolean),
                      );
                      if (selectedSet.has(letter)) selectedSet.delete(letter);
                      else selectedSet.add(letter);

                      const value = answerLetters.filter((item) => selectedSet.has(item)).join(",");
                      const next = { ...previous };
                      if (value) next[activeQuestion.id] = value;
                      else delete next[activeQuestion.id];
                      return next;
                    })}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs font-semibold transition-all duration-300 flex items-center gap-3 ${
                      selected
                        ? "bg-[#EBF2FF] border-[var(--theme-primary)] text-[var(--theme-primary)] shadow-sm"
                        : "bg-[var(--theme-surface)] border-[#E9EDF7] text-[#2D3748] hover:bg-[var(--theme-surface-soft)]"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border shrink-0 ${
                      selected
                        ? "bg-[var(--theme-primary)] text-white border-transparent"
                        : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-light)] border-[var(--theme-border)]"
                    }`}>
                      {letter}
                    </div>
                    <span className="flex-1 font-sans">{option}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* NAVIGATOR */}
        <div className="pt-4 border-t border-[var(--theme-border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400">Điều hướng câu hỏi:</span>
            <div className="flex gap-2 text-[9px] text-slate-400 font-sans">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-50 border border-amber-300" /> Đánh dấu</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#EFF4FF] border border-[var(--theme-primary)]/40" /> Đã trả lời</span>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {activeExam.questions.map((question, index) => {
              const answered = selectedAnswers[question.id] !== undefined;
              const flagged = flaggedQuestions[question.id];
              const current = index === currentQuestionIndex;

              let className = "bg-[var(--theme-surface-soft)] border-[var(--theme-border)] text-[var(--theme-text-light)]";
              if (current) className = "bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-soft";
              else if (flagged) className = "bg-amber-50 border-amber-300 text-amber-600";
              else if (answered) className = "bg-[#EFF4FF] border-[var(--theme-primary)]/40 text-[var(--theme-primary)]";

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-full aspect-square flex items-center justify-center rounded-xl border text-[11px] font-bold transition hover:scale-105 active:scale-95 ${className}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {submitError && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs font-bold text-rose-600">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-4 border-t border-[var(--theme-border)]">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((previous) => Math.max(0, previous - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-xs font-bold text-[var(--theme-text-light)] border border-[#E9EDF7] rounded-xl hover:bg-[var(--theme-surface-soft)] transition disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white font-extrabold text-xs rounded-xl shadow-pastel-blue transition flex items-center gap-1.5 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Nộp bài
          </button>

          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((previous) => Math.min(activeExam.questions.length - 1, previous + 1))}
            disabled={currentQuestionIndex === activeExam.questions.length - 1}
            className="px-4 py-2 text-xs font-bold text-white bg-[var(--theme-primary)] rounded-xl transition flex items-center gap-1 disabled:opacity-30"
          >
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* SUBMIT CONFIRM */}
        {showSubmitConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-fade-in rounded-[32px]">
            <div className="bg-[var(--theme-surface)] rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-zoom-in space-y-4">
              <h4 className="font-display font-extrabold text-[#2D3748] text-lg">Xác nhận nộp bài</h4>
              <p className="text-xs font-sans text-[var(--theme-text-light)] leading-relaxed">
                Bạn đã hoàn thành <strong>{Object.keys(selectedAnswers).length}</strong>/{activeExam.questions.length} câu hỏi.
                {Object.values(flaggedQuestions).some(Boolean) ? " Bạn còn câu đang đánh dấu để xem lại." : ""}
                <br /><br />Các câu chưa chọn sẽ được tính là sai. Bạn có chắc muốn nộp bài?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-3 bg-[var(--theme-surface-soft)] text-[var(--theme-text-muted)] font-bold text-xs rounded-xl"
                >
                  Kiểm tra lại
                </button>
                <button
                  type="button"
                  onClick={() => void submitCurrentExam()}
                  className="flex-1 py-3 bg-[var(--theme-primary)] text-white font-bold text-xs rounded-xl shadow-pastel-blue"
                >
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUIT CONFIRM */}
        {showQuitConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-fade-in rounded-[32px]">
            <div className="bg-[var(--theme-surface)] rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-zoom-in space-y-4">
              <h4 className="font-display font-extrabold text-[#2D3748] text-lg">Thoát khỏi bài thi</h4>
              <p className="text-xs font-sans text-[var(--theme-text-light)] leading-relaxed font-medium">
                Phiên làm bài hiện tại chưa được nộp và sẽ không được lưu nếu bạn thoát.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 py-3 bg-[var(--theme-surface-soft)] text-[var(--theme-text-muted)] font-bold text-xs rounded-xl"
                >
                  Làm tiếp
                </button>
                <button
                  type="button"
                  onClick={closeExam}
                  className="flex-1 py-3 bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Thoát ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
