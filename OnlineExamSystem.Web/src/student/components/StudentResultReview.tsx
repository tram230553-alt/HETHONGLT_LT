import React from "react";
import {
  CheckCircle2,
  CircleX,
  ClipboardCheck,
} from "lucide-react";
import type {
  StudentResultDetailDto,
  StudentResultQuestionDetailDto,
} from "../../services/studentService";

type AnswerLetter = "A" | "B" | "C" | "D";

const answerLetters: AnswerLetter[] = ["A", "B", "C", "D"];

function getOptionText(
  question: StudentResultQuestionDetailDto,
  letter: string,
) {
  switch (letter) {
    case "A":
      return question.optionA;
    case "B":
      return question.optionB;
    case "C":
      return question.optionC;
    case "D":
      return question.optionD;
    default:
      return "";
  }
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

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

interface StudentResultReviewProps {
  detail: StudentResultDetailDto;
  showTitle?: boolean;
}

export default function StudentResultReview({
  detail,
  showTitle = true,
}: StudentResultReviewProps) {
  return (
    <div className="space-y-5">
      {showTitle && (
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[var(--theme-primary)]">
            Kết quả bài thi
          </p>
          <h2 className="mt-1 text-xl md:text-2xl font-black text-[var(--theme-text)]">
            {detail.tenBaiKT}
          </h2>
          <p className="mt-1 text-xs text-[var(--theme-text-light)]">
            Nộp lúc {formatDate(detail.submittedAt)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 md:p-5">
        <div className="text-center md:border-r md:border-[var(--theme-border)]">
          <p className="text-[11px] font-black uppercase tracking-wide text-[var(--theme-text-light)]">
            Kết quả đúng
          </p>
          <p className="mt-1 text-xl md:text-2xl font-black text-[var(--theme-text)]">
            {detail.correctQuestion} / {detail.totalQuestion} câu
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-wide text-[var(--theme-text-light)]">
            Điểm thang 10
          </p>
          <p className="mt-1 text-xl md:text-2xl font-black text-emerald-600">
            {detail.diem.toFixed(2)} đ
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--theme-border)] pb-3">
        <ClipboardCheck className="h-5 w-5 text-[var(--theme-primary)]" />
        <h3 className="font-black text-[var(--theme-text)]">
          Phân tích chi tiết câu hỏi
        </h3>
      </div>

      <div className="space-y-4">
        {detail.questions.map((question, index) => {
          const selected = question.selectedAnswer || "";
          const correct = question.correctAnswer;
          const selectedSet = new Set(selected.split(",").filter(Boolean));
          const correctSet = new Set(correct.split(",").filter(Boolean));

          return (
            <article
              key={question.questionId}
              className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 md:p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-black leading-relaxed text-[var(--theme-text)]">
                    Câu {index + 1}: {question.noiDung}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--theme-text-light)]">
                    Lựa chọn của bạn: {selected || "Không chọn"}
                    {selected
                      ? ` - ${selected
                          .split(",")
                          .map((letter) => getOptionText(question, letter))
                          .filter(Boolean)
                          .join("; ")}`
                      : ""}
                  </p>
                </div>

                <div
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
                    question.isCorrect
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {question.isCorrect ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <CircleX className="h-4 w-4" />
                  )}
                  {question.isCorrect ? "Chính xác" : "Chưa chính xác"}
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {answerLetters.map((letter) => {
                  const isCorrectAnswer = correctSet.has(letter);
                  const isSelected = selectedSet.has(letter);

                  let className =
                    "border-[var(--theme-border)] bg-white text-[var(--theme-text)]";

                  if (isCorrectAnswer) {
                    className =
                      "border-emerald-200 bg-emerald-50 text-emerald-800";
                  } else if (isSelected) {
                    className = "border-rose-200 bg-rose-50 text-rose-700";
                  }

                  return (
                    <div
                      key={letter}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${className}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                          isCorrectAnswer
                            ? "bg-emerald-600 text-white"
                            : isSelected
                              ? "bg-rose-500 text-white"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 pt-0.5 text-sm font-semibold leading-relaxed">
                        {getOptionText(question, letter)}
                      </span>
                      {isCorrectAnswer && (
                        <span className="shrink-0 text-xs font-black text-emerald-600">
                          Đáp án đúng
                        </span>
                      )}
                      {!isCorrectAnswer && isSelected && (
                        <span className="shrink-0 text-xs font-black text-rose-500">
                          Bạn chọn
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!question.isCorrect && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <span className="font-black">Đáp án đúng: {correct}</span>
                  {correct && ` - ${getOptionText(question, correct)}`}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
