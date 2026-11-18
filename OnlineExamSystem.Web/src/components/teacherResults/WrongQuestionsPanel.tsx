import React from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Users,
} from "lucide-react";
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
  downloadCsv,
  eyebrowText,
  formatDateTime,
  rateTone,
} from "./ui";
import Pagination from "../Pagination";
import { usePagination } from "../../hooks/usePagination";

/* Dữ liệu câu sai đã chuẩn hoá cho cả đề thi lẫn luyện tập. */

export interface WrongOptionStat {
  option: string;
  text: string;
  isCorrect: boolean;
  selectedCount: number;
}

export interface WrongStudentRow {
  studentId: string;
  maHS: string;
  studentName: string;
  selectedAnswer: string;
  /** Tên đề thi hoặc topic. */
  sourceName: string;
  submittedAt: string;
}

export interface WrongQuestionStat {
  questionId: string;
  questionText: string;
  topicName: string;
  chapterName: string;
  correctAnswer: string;
  explanation?: string | null;
  totalAttempts: number;
  wrongCount: number;
  blankCount: number;
  studentCount: number;
  wrongRate: number;
  mostChosenWrongAnswer?: string | null;
  mostChosenWrongAnswerCount: number;
  options: WrongOptionStat[];
  wrongStudents: WrongStudentRow[];
}

export interface SourceFilterConfig {
  ariaLabel: string;
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface WrongQuestionsPanelProps {
  gradeName?: string;
  subjectName?: string;
  title: string;
  description: string;
  summary: { label: string; value: string }[];
  questions: WrongQuestionStat[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
  sourceFilter?: SourceFilterConfig;
  /** Tiêu đề cột cuối của bảng học sinh sai: "Đề / thời gian" hoặc "Topic / thời gian". */
  sourceColumnLabel: string;
  /** Đề thi chấm bỏ trống là sai nên hiện thêm số lượt bỏ trống; luyện tập thì không. */
  showBlank: boolean;
  exportName: string;
  emptyTitle: string;
  emptyHint: string;
}

export default function WrongQuestionsPanel({
  gradeName,
  subjectName,
  title,
  description,
  summary,
  questions,
  loading,
  error,
  onReload,
  sourceFilter,
  sourceColumnLabel,
  showBlank,
  exportName,
  emptyTitle,
  emptyHint,
}: WrongQuestionsPanelProps) {
  const [search, setSearch] = React.useState("");
  const [rateFilter, setRateFilter] = React.useState("all");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const filteredQuestions = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesSearch =
        !keyword ||
        question.questionText.toLowerCase().includes(keyword) ||
        question.topicName.toLowerCase().includes(keyword) ||
        question.chapterName.toLowerCase().includes(keyword);
      if (!matchesSearch) return false;

      if (rateFilter === "high" && question.wrongRate < 70) return false;
      if (rateFilter === "medium" && (question.wrongRate < 40 || question.wrongRate >= 70))
        return false;
      if (rateFilter === "low" && question.wrongRate >= 40) return false;

      return true;
    });
  }, [questions, search, rateFilter]);

  // Phân trang danh sách câu hỏi (về trang 1 khi đổi từ khóa/bộ lọc).
  const questionPagination = usePagination(
    filteredQuestions,
    10,
    `${search}|${rateFilter}`,
  );

  const exportCsv = () => {
    if (filteredQuestions.length === 0) return;

    downloadCsv(
      `${exportName.replace(/[^\p{L}\p{N}]+/gu, "-")}.csv`,
      [
        "STT",
        "Câu hỏi",
        "Chủ đề",
        "Chương",
        "Đáp án đúng",
        "Lượt làm",
        "Lượt sai",
        "Trong đó bỏ trống",
        "Số học sinh sai",
        "Tỷ lệ sai (%)",
        "Đáp án sai chọn nhiều nhất",
      ],
      filteredQuestions.map((q, index) => [
        index + 1,
        q.questionText,
        q.topicName,
        q.chapterName,
        q.correctAnswer,
        q.totalAttempts,
        q.wrongCount,
        q.blankCount,
        q.studentCount,
        q.wrongRate.toFixed(2),
        q.mostChosenWrongAnswer ?? "",
      ]),
    );
  };

  return (
    <div className="space-y-5">
      <ResultsHeader
        tone="rose"
        eyebrow={eyebrowText(gradeName, subjectName)}
        title={title}
        icon={<AlertTriangle className="h-5 w-5" />}
        description={description}
        actions={
          <>
            <HeaderButton
              tone="rose"
              onClick={exportCsv}
              disabled={loading || filteredQuestions.length === 0}
              icon={<Download className="h-4 w-4" />}
            >
              Xuất CSV
            </HeaderButton>
            <HeaderButton
              tone="rose"
              onClick={onReload}
              disabled={loading}
              icon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Tải lại
            </HeaderButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <SummaryCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <FilterBar>
        {sourceFilter && (
          <FilterSelect
            ariaLabel={sourceFilter.ariaLabel}
            value={sourceFilter.value}
            onChange={sourceFilter.onChange}
          >
            <option value="">{sourceFilter.allLabel}</option>
            {sourceFilter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
        )}

        <SearchBox
          tone="rose"
          value={search}
          onChange={setSearch}
          placeholder="Tìm nội dung câu hỏi, chương hoặc Topic..."
        />

        <FilterSelect ariaLabel="Lọc theo tỷ lệ sai" value={rateFilter} onChange={setRateFilter}>
          <option value="all">Mọi tỷ lệ sai</option>
          <option value="high">Cao (≥ 70%)</option>
          <option value="medium">Trung bình (40% - 69%)</option>
          <option value="low">Thấp (&lt; 40%)</option>
        </FilterSelect>
      </FilterBar>

      {error ? (
        <ErrorBlock tone="rose" message={error} onRetry={onReload} />
      ) : loading && questions.length === 0 ? (
        <LoadingBlock tone="rose" />
      ) : filteredQuestions.length === 0 ? (
        <EmptyBlock
          icon={<BookOpen className="h-9 w-9" />}
          title={questions.length === 0 ? emptyTitle : "Không có câu hỏi phù hợp bộ lọc"}
          hint={questions.length === 0 ? emptyHint : "Thử đổi từ khóa hoặc mức tỷ lệ sai."}
        />
      ) : (
        <div className="space-y-3">
          {questionPagination.pageItems.map((question, index) => (
            <QuestionCard
              key={question.questionId}
              index={(questionPagination.page - 1) * questionPagination.pageSize + index + 1}
              question={question}
              showBlank={showBlank}
              sourceColumnLabel={sourceColumnLabel}
              open={expanded === question.questionId}
              onToggle={() =>
                setExpanded((current) =>
                  current === question.questionId ? null : question.questionId,
                )
              }
            />
          ))}

          <Pagination
            page={questionPagination.page}
            pageSize={questionPagination.pageSize}
            total={questionPagination.total}
            onPageChange={questionPagination.setPage}
            itemLabel="câu hỏi"
          />
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  question,
  showBlank,
  sourceColumnLabel,
  open,
  onToggle,
}: {
  index: number;
  question: WrongQuestionStat;
  showBlank: boolean;
  sourceColumnLabel: string;
  open: boolean;
  onToggle: () => void;
}) {
  const tone = rateTone(question.wrongRate);
  const maxSelected = Math.max(1, ...question.options.map((o) => o.selectedCount));

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-slate-50/70 md:flex-row md:items-center"
      >
        <div className="flex flex-1 gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
            {index}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-5 text-slate-700">{question.questionText}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-400">
              {[question.chapterName, question.topicName].filter(Boolean).join(" • ") ||
                "Chưa gắn chủ đề"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">
            <Users className="h-3.5 w-3.5" />
            {question.studentCount}
          </span>
          <span className="text-xs font-black text-slate-700">
            {question.wrongCount}/{question.totalAttempts}
          </span>
          <div className="flex items-center gap-3">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${tone.bar}`}
                style={{ width: `${Math.min(question.wrongRate, 100)}%` }}
              />
            </div>
            <span className={`min-w-14 text-sm font-black ${tone.text}`}>
              {question.wrongRate.toFixed(1)}%
            </span>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="grid gap-5 border-t border-slate-100 bg-slate-50/50 p-5 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Phân bố đáp án học sinh chọn
            </p>
            <div className="mt-3 space-y-2">
              {question.options.map((option) => (
                <div key={option.option}>
                  <div className="flex items-start gap-2 text-xs">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${
                        option.isCorrect
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {option.option}
                    </span>
                    <span className="flex-1 leading-5 text-slate-600">{option.text}</span>
                    <span className="font-black text-slate-700">{option.selectedCount}</span>
                  </div>
                  <div className="ml-7 mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        option.isCorrect ? "bg-emerald-500" : "bg-rose-400"
                      }`}
                      style={{ width: `${(option.selectedCount / maxSelected) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p>
                Đáp án đúng:{" "}
                <span className="font-black text-emerald-600">{question.correctAnswer || "—"}</span>
              </p>
              {showBlank && (
                <p>
                  Bỏ trống: <span className="font-black text-slate-700">{question.blankCount}</span>{" "}
                  lượt
                </p>
              )}
              {question.mostChosenWrongAnswer && (
                <p>
                  Đáp án sai chọn nhiều nhất:{" "}
                  <span className="font-black text-rose-600">{question.mostChosenWrongAnswer}</span>{" "}
                  ({question.mostChosenWrongAnswerCount} lượt)
                </p>
              )}
            </div>

            {question.explanation && (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-5 text-slate-600">
                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
                  Lời giải
                </p>
                {question.explanation}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Học sinh làm sai ({question.studentCount})
            </p>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Học sinh</th>
                    <th className="px-3 py-2 text-center">Đã chọn</th>
                    <th className="px-3 py-2">{sourceColumnLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {question.wrongStudents.map((student) => (
                    <tr key={student.studentId}>
                      <td className="px-3 py-2">
                        <p className="font-bold text-slate-700">
                          {student.studentName || "Không rõ tên"}
                        </p>
                        <p className="text-[10px] text-slate-400">{student.maHS}</p>
                      </td>
                      <td className="px-3 py-2 text-center font-black text-rose-600">
                        {student.selectedAnswer || "Bỏ trống"}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500">
                        <p className="font-bold">{student.sourceName}</p>
                        {formatDateTime(student.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {question.studentCount > question.wrongStudents.length && (
              <p className="mt-2 text-[10px] text-slate-400">
                Hiển thị {question.wrongStudents.length} học sinh gần nhất.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
