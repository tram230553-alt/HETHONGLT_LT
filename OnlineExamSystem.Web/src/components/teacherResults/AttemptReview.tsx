import React from "react";
import { CheckCircle2, CircleX, MinusCircle } from "lucide-react";
import { formatDateTime } from "./ui";

export interface ReviewQuestion {
  questionId: string;
  order: number;
  questionText: string;
  questionType: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isBlank: boolean;
  explanation?: string | null;
}

/** Dữ liệu chi tiết một bài làm (bài thi hoặc lượt luyện tập) đã chuẩn hoá để hiển thị. */
export interface AttemptReviewData {
  score: number;
  correct: number;
  total: number;
  blank: number;
  submittedAt: string;
  questions: ReviewQuestion[];
}

const LETTERS = ["A", "B", "C", "D"] as const;

function optionText(question: ReviewQuestion, letter: string) {
  switch (letter) {
    case "A":
      return question.optionA;
    case "B":
      return question.optionB;
    case "C":
      return question.optionC;
    default:
      return question.optionD;
  }
}

function toSet(value: string) {
  return new Set(value.split(",").map((x) => x.trim()).filter(Boolean));
}

type ReviewFilter = "all" | "wrong";

export default function AttemptReview({ data }: { data: AttemptReviewData }) {
  const [filter, setFilter] = React.useState<ReviewFilter>("all");

  const wrongCount = data.questions.filter((q) => !q.isCorrect).length;
  const visible =
    filter === "wrong" ? data.questions.filter((q) => !q.isCorrect) : data.questions;

  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-[11px] font-black transition ${
      active ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-100"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">
            Đúng {data.correct}
          </span>
          <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700">
            Sai {data.total - data.correct}
          </span>
          {data.blank > 0 && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
              Bỏ trống {data.blank}
            </span>
          )}
          <span className="text-slate-400">• Nộp lúc {formatDateTime(data.submittedAt)}</span>
        </div>

        <div className="inline-flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
          <button type="button" onClick={() => setFilter("all")} className={chip(filter === "all")}>
            Tất cả ({data.questions.length})
          </button>
          <button type="button" onClick={() => setFilter("wrong")} className={chip(filter === "wrong")}>
            Câu sai ({wrongCount})
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
          {data.questions.length === 0
            ? "Chưa có dữ liệu chi tiết cho bài làm này."
            : "Học sinh không làm sai câu nào."}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((question) => (
            <QuestionReviewCard key={question.questionId} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionReviewCard({ question }: { question: ReviewQuestion }) {
  const selectedSet = toSet(question.selectedAnswer);
  const correctSet = toSet(question.correctAnswer);

  const status = question.isCorrect
    ? { label: "Chính xác", cls: "bg-emerald-50 text-emerald-600", icon: <CheckCircle2 className="h-4 w-4" /> }
    : question.isBlank
      ? { label: "Bỏ trống", cls: "bg-slate-100 text-slate-600", icon: <MinusCircle className="h-4 w-4" /> }
      : { label: "Chưa chính xác", cls: "bg-rose-50 text-rose-600", icon: <CircleX className="h-4 w-4" /> };

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-relaxed text-slate-800">
            Câu {question.order}: {question.questionText}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {question.questionType === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}
            {" • "}
            Học sinh chọn: {question.selectedAnswer || "Không chọn"}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${status.cls}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {LETTERS.map((letter) => {
          const isCorrectOption = correctSet.has(letter);
          const isSelected = selectedSet.has(letter);

          const rowCls = isCorrectOption
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : isSelected
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-100 bg-white text-slate-700";
          const badgeCls = isCorrectOption
            ? "bg-emerald-600 text-white"
            : isSelected
              ? "bg-rose-500 text-white"
              : "bg-slate-100 text-slate-600";

          return (
            <div key={letter} className={`flex items-start gap-3 rounded-xl border p-3 ${rowCls}`}>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${badgeCls}`}
              >
                {letter}
              </span>
              <span className="flex-1 pt-0.5 text-xs font-semibold leading-relaxed">
                {optionText(question, letter)}
              </span>
              <span className="shrink-0 text-[11px] font-black">
                {isCorrectOption && isSelected && "Học sinh chọn • Đáp án đúng"}
                {isCorrectOption && !isSelected && "Đáp án đúng"}
                {!isCorrectOption && isSelected && "Học sinh chọn"}
              </span>
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-5 text-slate-600">
          <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
            Lời giải
          </p>
          {question.explanation}
        </div>
      )}
    </article>
  );
}
