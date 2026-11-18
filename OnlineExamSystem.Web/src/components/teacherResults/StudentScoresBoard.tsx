import React from "react";
import {
  ArrowRight,
  Award,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import AttemptReview, { type AttemptReviewData } from "./AttemptReview";
import {
  EmptyBlock,
  ErrorBlock,
  FilterBar,
  FilterSelect,
  HeaderButton,
  LoadingBlock,
  ResultsHeader,
  SearchBox,
  SummaryCard,
  eyebrowText,
  formatDateTime,
  scoreLabel,
  toneStyles,
  type ResultTone,
} from "./ui";
import Pagination from "../Pagination";
import { usePagination } from "../../hooks/usePagination";

/* Dữ liệu đã chuẩn hoá: bài thi và luyện tập đều quy về cùng một dạng. */

export interface ScoreAttempt {
  id: string;
  /** examId (bài thi) hoặc topicId (luyện tập) - dùng cho bộ lọc theo đề/topic. */
  sourceId: string;
  title: string;
  /** Dòng phụ dưới tiêu đề, ví dụ "Chương 1 • Bài 03". Có thể để trống. */
  subtitle: string;
  score: number;
  correct: number;
  total: number;
  submittedAt: string;
}

export interface ScoreStudent {
  studentId: string;
  maHS: string;
  studentName: string;
  email: string;
  gradeName: string;
  isLocked: boolean;
  /** Số đề (hoặc số topic) khác nhau đã làm. */
  completedUnits: number;
  attemptCount: number;
  averageScore: number;
  correct: number;
  total: number;
  lastSubmittedAt: string | null;
  attempts: ScoreAttempt[];
}

export interface ScoresBoardLabels {
  headerTitle: string;
  headerDescription: string;
  headerIcon: React.ReactNode;
  /** "lượt thi" / "lượt luyện" */
  attemptNoun: string;
  /** "đề" / "topic" */
  unitNoun: string;
  unitStatLabel: string;
  sourceAllLabel: string;
  notAttemptedShort: string;
  notAttemptedFilter: string;
  modalEyebrow: string;
  historyTitle: string;
  emptyHistory: string;
  lastResultLabel: string;
}

interface StudentScoresBoardProps {
  tone: ResultTone;
  gradeName?: string;
  subjectName?: string;
  labels: ScoresBoardLabels;
  students: ScoreStudent[];
  sourceOptions: { value: string; label: string }[];
  /** Tổng số đề (hoặc topic) khả dụng - mẫu số của tiến độ. */
  progressTotal: number;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  loadDetail: (attemptId: string) => Promise<AttemptReviewData>;
}

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AttemptReviewData };

export default function StudentScoresBoard({
  tone,
  gradeName,
  subjectName,
  labels,
  students,
  sourceOptions,
  progressTotal,
  loading,
  error,
  onReload,
  loadDetail,
}: StudentScoresBoardProps) {
  const t = toneStyles[tone];

  const [search, setSearch] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [progressFilter, setProgressFilter] = React.useState("all");
  const [scoreFilter, setScoreFilter] = React.useState("all");
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);

  const selectedStudent = React.useMemo(
    () => students.find((x) => x.studentId === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const getProgress = React.useCallback(
    (student: ScoreStudent) => {
      if (progressTotal <= 0) return 0;
      return Math.min(100, Math.round((student.completedUnits / progressTotal) * 100));
    },
    [progressTotal],
  );

  const filteredStudents = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        keyword.length === 0 ||
        student.studentName.toLowerCase().includes(keyword) ||
        student.email.toLowerCase().includes(keyword) ||
        student.maHS.toLowerCase().includes(keyword);
      if (!matchesSearch) return false;

      if (
        sourceFilter !== "all" &&
        !student.attempts.some((attempt) => attempt.sourceId === sourceFilter)
      ) {
        return false;
      }

      const progress = getProgress(student);
      if (progressFilter === "advanced" && progress < 80) return false;
      if (progressFilter === "intermediate" && (progress < 50 || progress >= 80)) return false;
      if (progressFilter === "needing_support" && progress >= 50) return false;

      if (scoreFilter === "excellent" && student.averageScore < 8) return false;
      if (scoreFilter === "average" && (student.averageScore < 5 || student.averageScore >= 8))
        return false;
      if (scoreFilter === "low" && (student.attemptCount === 0 || student.averageScore >= 5))
        return false;
      if (scoreFilter === "not_attempted" && student.attemptCount !== 0) return false;

      return true;
    });
  }, [students, search, sourceFilter, progressFilter, scoreFilter, getProgress]);

  // Phân trang danh sách học sinh (về trang 1 khi đổi từ khóa/bộ lọc).
  const studentPagination = usePagination(
    filteredStudents,
    12,
    `${search}|${sourceFilter}|${progressFilter}|${scoreFilter}`,
  );

  const attempted = students.filter((x) => x.attemptCount > 0);
  const averageScore = attempted.length
    ? attempted.reduce((sum, x) => sum + x.averageScore, 0) / attempted.length
    : 0;
  const totalAttempts = students.reduce((sum, x) => sum + x.attemptCount, 0);
  const averageProgress = students.length
    ? Math.round(students.reduce((sum, x) => sum + getProgress(x), 0) / students.length)
    : 0;
  const attentionCount = students.filter(
    (x) => x.attemptCount > 0 && x.averageScore < 7,
  ).length;
  const activeCount = students.filter((x) => !x.isLocked).length;
  const activePercent = students.length ? Math.round((activeCount / students.length) * 100) : 0;

  const hasFilter =
    search !== "" || sourceFilter !== "all" || progressFilter !== "all" || scoreFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setSourceFilter("all");
    setProgressFilter("all");
    setScoreFilter("all");
  };

  return (
    <div className="space-y-6">
      <ResultsHeader
        tone={tone}
        eyebrow={eyebrowText(gradeName, subjectName)}
        title={`${labels.headerTitle} (${students.length})`}
        icon={labels.headerIcon}
        description={labels.headerDescription}
        actions={
          <HeaderButton
            tone={tone}
            onClick={onReload}
            disabled={loading}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
          >
            Đồng bộ dữ liệu
          </HeaderButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Sĩ số quản lý"
          value={`${students.length} học sinh`}
          badge={`${activePercent}% Active`}
          hint={`Học sinh thuộc ${gradeName || "khối giáo viên phụ trách"}`}
        />
        <SummaryCard
          label="Trung bình điểm số"
          value={`${averageScore.toFixed(1)}/10`}
          badge={scoreLabel(averageScore)}
          hint={`Tính trên tổng ${totalAttempts} ${labels.attemptNoun} đã nộp bài`}
        />
        <SummaryCard
          label="Tiến độ trung bình"
          value={`${averageProgress}%`}
          badge={`${progressTotal} ${labels.unitNoun}`}
          hint={`Tỷ lệ ${labels.unitNoun} đã làm trên tổng ${labels.unitNoun} khả dụng`}
        />
        <SummaryCard
          danger
          label="Học sinh cần lưu ý"
          value={`${attentionCount} học sinh`}
          badge="Điểm dưới 7"
          hint="Dựa trên điểm trung bình các bài đã nộp"
        />
      </div>

      <FilterBar>
        <SearchBox
          tone={tone}
          value={search}
          onChange={setSearch}
          placeholder="Tìm học sinh theo họ tên, mã học sinh hoặc email..."
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect value={sourceFilter} onChange={setSourceFilter} ariaLabel={labels.sourceAllLabel}>
            <option value="all">{labels.sourceAllLabel}</option>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect value={progressFilter} onChange={setProgressFilter} ariaLabel="Lọc theo tiến độ">
            <option value="all">Mọi tiến độ</option>
            <option value="advanced">Tốt (≥ 80%)</option>
            <option value="intermediate">Trung bình (50% - 79%)</option>
            <option value="needing_support">Chưa đạt (&lt; 50%)</option>
          </FilterSelect>

          <FilterSelect value={scoreFilter} onChange={setScoreFilter} ariaLabel="Lọc theo điểm trung bình">
            <option value="all">Mọi điểm trung bình</option>
            <option value="excellent">Khá giỏi (≥ 8)</option>
            <option value="average">Trung bình (5 - dưới 8)</option>
            <option value="low">Dưới trung bình (&lt; 5)</option>
            <option value="not_attempted">{labels.notAttemptedFilter}</option>
          </FilterSelect>

          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-xl border border-rose-100 px-3 py-2.5 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" /> Xóa lọc
            </button>
          )}
        </div>
      </FilterBar>

      {error ? (
        <ErrorBlock tone={tone} message={error} onRetry={onReload} />
      ) : loading && students.length === 0 ? (
        <LoadingBlock tone={tone} text="Đang tải dữ liệu học sinh..." />
      ) : filteredStudents.length === 0 ? (
        <EmptyBlock
          icon={<Search className="h-10 w-10" />}
          title="Không tìm thấy học sinh phù hợp"
          hint="Chưa có học sinh thuộc khối được phân công hoặc không có dữ liệu phù hợp với bộ lọc hiện tại."
          action={
            hasFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${t.soft} ${t.softText}`}
              >
                Khôi phục về mặc định
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studentPagination.pageItems.map((student) => {
            const progress = getProgress(student);
            const latest = student.attempts[0];
            const score = student.averageScore;
            const accent =
              score >= 8
                ? t.bar
                : score >= 7
                  ? "bg-emerald-500"
                  : student.attemptCount > 0
                    ? "bg-amber-500"
                    : "bg-slate-300";

            return (
              <div
                key={student.studentId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className={`h-1.5 w-full ${accent}`} />

                <div className="flex-1 space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-sm font-black text-slate-500 transition-colors ${t.avatarHover}`}
                      >
                        {student.studentName.trim().slice(-1).toUpperCase() || "H"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-black text-slate-800">
                          {student.studentName}
                        </h4>
                        <span className="block truncate text-[11px] font-bold text-slate-400">
                          {student.maHS} • {student.gradeName}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 font-mono text-[10.5px] font-black text-slate-600">
                        {student.attemptCount > 0
                          ? `${score.toFixed(1)}/10`
                          : labels.notAttemptedShort}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            student.isLocked ? "bg-slate-400" : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                          {student.isLocked ? "Đã khóa" : "Hoạt động"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500">
                      <span>Tiến độ hoàn thành {labels.unitNoun}</span>
                      <span className={`font-extrabold ${t.softText}`}>{progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${t.bar}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-2 text-center">
                    <MiniStat label="Số lượt" value={student.attemptCount} />
                    <MiniStat
                      label={labels.unitStatLabel}
                      value={`${student.completedUnits}/${progressTotal}`}
                    />
                    <MiniStat label="Câu đúng" value={`${student.correct}/${student.total}`} />
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <FileText className={`h-3.5 w-3.5 ${t.icon}`} />
                      <span className="font-bold">{labels.lastResultLabel}</span>
                      <span className="truncate">{latest ? latest.title : "Chưa có bài nộp"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {formatDateTime(student.lastSubmittedAt, "Chưa có lượt nộp bài")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        {student.attemptCount > 0
                          ? `Mức hiện tại: ${scoreLabel(student.averageScore)}`
                          : "Chưa đủ dữ liệu đánh giá"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 p-4">
                  <span className="truncate font-mono text-[10px] text-slate-400">
                    {student.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(student.studentId)}
                    className={`flex shrink-0 items-center gap-1 text-xs font-black ${t.link}`}
                  >
                    Xem kết quả <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          page={studentPagination.page}
          pageSize={studentPagination.pageSize}
          total={studentPagination.total}
          onPageChange={studentPagination.setPage}
          itemLabel="học sinh"
        />
        </>
      )}

      {selectedStudent && (
        <StudentDetailModal
          tone={tone}
          student={selectedStudent}
          labels={labels}
          progressTotal={progressTotal}
          loadDetail={loadDetail}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2">
      <span className="block text-[10px] font-bold uppercase text-slate-400">{label}</span>
      <p className="text-xs font-black text-slate-700">{value}</p>
    </div>
  );
}

/* =========================================================
   Popup chi tiết học sinh: lịch sử các lượt + xem từng câu
========================================================= */

function StudentDetailModal({
  tone,
  student,
  labels,
  progressTotal,
  loadDetail,
  onClose,
}: {
  tone: ResultTone;
  student: ScoreStudent;
  labels: ScoresBoardLabels;
  progressTotal: number;
  loadDetail: (attemptId: string) => Promise<AttemptReviewData>;
  onClose: () => void;
}) {
  const t = toneStyles[tone];

  // Phân trang lịch sử các lượt làm bài của học sinh.
  const attemptPagination = usePagination(student.attempts, 5, student.studentId);

  const [openId, setOpenId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<Record<string, DetailState>>({});

  const fetchDetail = React.useCallback(
    async (attemptId: string) => {
      setDetails((prev) => ({ ...prev, [attemptId]: { status: "loading" } }));
      try {
        const data = await loadDetail(attemptId);
        setDetails((prev) => ({ ...prev, [attemptId]: { status: "ready", data } }));
      } catch (err) {
        setDetails((prev) => ({
          ...prev,
          [attemptId]: {
            status: "error",
            message: err instanceof Error ? err.message : "Không tải được chi tiết bài làm.",
          },
        }));
      }
    },
    [loadDetail],
  );

  const toggle = (attemptId: string) => {
    if (openId === attemptId) {
      setOpenId(null);
      return;
    }
    setOpenId(attemptId);
    const current = details[attemptId];
    if (!current || current.status === "error") void fetchDetail(attemptId);
  };

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur">
          <div>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${t.eyebrow}`}>
              <ShieldCheck className="h-4 w-4" /> {labels.modalEyebrow}
            </div>
            <h3 className="mt-1 text-lg font-black text-slate-800">{student.studentName}</h3>
            <p className="text-xs text-slate-500">
              {student.maHS} • {student.gradeName} • {student.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-[10px] font-black uppercase text-indigo-500">Điểm trung bình</p>
              <p className="mt-1 text-2xl font-black text-indigo-700">
                {student.averageScore.toFixed(1)}/10
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase text-emerald-600">
                {labels.unitStatLabel}
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-700">
                {student.completedUnits}/{progressTotal}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase text-amber-600">Tổng câu đúng</p>
              <p className="mt-1 text-2xl font-black text-amber-700">
                {student.correct}/{student.total}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black text-slate-800">{labels.historyTitle}</h4>

            {student.attempts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                {labels.emptyHistory}
              </div>
            ) : (
              <div className="space-y-3">
                {attemptPagination.pageItems.map((attempt) => {
                  const open = openId === attempt.id;
                  const detail = details[attempt.id];

                  return (
                    <div
                      key={attempt.id}
                      className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60"
                    >
                      <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800">
                            {attempt.title}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {attempt.subtitle ? `${attempt.subtitle} • ` : ""}
                            Nộp lúc {formatDateTime(attempt.submittedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Đúng</p>
                            <p className="text-xs font-black text-slate-700">
                              {attempt.correct}/{attempt.total}
                            </p>
                          </div>
                          <div
                            className={`min-w-16 rounded-xl px-3 py-2 text-center font-black ${
                              attempt.score >= 7
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {attempt.score.toFixed(1)} đ
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggle(attempt.id)}
                        aria-expanded={open}
                        className={`flex w-full items-center justify-between border-t border-slate-100 bg-white px-4 py-2.5 text-xs font-black ${t.link}`}
                      >
                        {open ? "Ẩn chi tiết bài làm" : "Xem chi tiết bài làm"}
                        {open ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {open && (
                        <div className="border-t border-slate-100 bg-white p-4">
                          {!detail || detail.status === "loading" ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-500">
                              <RefreshCw className={`h-4 w-4 animate-spin ${t.spinner}`} />
                              Đang tải chi tiết bài làm...
                            </div>
                          ) : detail.status === "error" ? (
                            <div className="py-6 text-center">
                              <p className="text-xs font-bold text-rose-600">{detail.message}</p>
                              <button
                                type="button"
                                onClick={() => void fetchDetail(attempt.id)}
                                className={`mt-3 rounded-xl px-3 py-1.5 text-xs font-bold text-white ${t.tabActive}`}
                              >
                                Thử lại
                              </button>
                            </div>
                          ) : (
                            <AttemptReview data={detail.data} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Pagination
                  page={attemptPagination.page}
                  pageSize={attemptPagination.pageSize}
                  total={attemptPagination.total}
                  onPageChange={attemptPagination.setPage}
                  itemLabel="lượt làm bài"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
