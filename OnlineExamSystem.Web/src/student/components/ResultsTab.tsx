/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChartSpline,
  Award,
  Sparkles,
  CheckSquare,
  BookOpen,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { CleanHistoryItem, UserStats } from "../types";
import StudentAnalyticsSuite from "./StudentAnalyticsSuite";
import PracticeHistoryView from "./PracticeHistoryView";
import {
  getMyStudentResults,
  type StudentResultDto,
} from "../../services/studentService";

interface ResultsTabProps {
  stats: UserStats;
  historyLogs: CleanHistoryItem[];
  onOpenAIChat: (initialPrompt?: string) => void;
  onSwitchTab?: (tabIndex: number) => void;
  onAddHistory?: (item: CleanHistoryItem, skipServerSync?: boolean) => void;
}

export default function ResultsTab({
  stats,
  historyLogs,
  onOpenAIChat,
  onSwitchTab,
  onAddHistory,
}: ResultsTabProps) {
  const [activeSubView, setActiveSubView] = React.useState<"overview" | "suite" | "practice">("overview");
  const [results, setResults] = React.useState<StudentResultDto[]>([]);
  const [isLoadingResults, setIsLoadingResults] = React.useState(true);
  const [resultError, setResultError] = React.useState<string | null>(null);

  /**
   * Kết quả thi là dữ liệu lõi đã có backend thật.
   * Vì vậy ResultsTab lấy trực tiếp từ SQL thông qua API hiện có,
   * không dùng PRE_POPULATED_HISTORY để tính điểm/thống kê.
   */
  const loadResults = React.useCallback(async () => {
    try {
      setIsLoadingResults(true);
      setResultError(null);

      const data = await getMyStudentResults();
      setResults(data);
    } catch (error) {
      setResultError(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu kết quả bài thi.",
      );
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  React.useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const totalQuestionsDone = React.useMemo(
    () => results.reduce((sum, item) => sum + item.totalQuestion, 0),
    [results],
  );

  const averageScore = React.useMemo(() => {
    if (results.length === 0) {
      return 0;
    }

    return (
      results.reduce((sum, item) => sum + item.diem, 0) /
      results.length
    );
  }, [results]);

  const highestScore = React.useMemo(() => {
    if (results.length === 0) {
      return 0;
    }

    return Math.max(...results.map((item) => item.diem));
  }, [results]);

    const subjectStats = React.useMemo(() => {
        const subjectMap = new Map<
            string,
            {
                subjectId: string;
                monHoc: string;
                correctQuestion: number;
                totalQuestion: number;
                totalScore: number;
                attemptCount: number;
            }
        >();

        results.forEach((item) => {
            const current = subjectMap.get(item.subjectId);

            if (current) {
                current.correctQuestion += item.correctQuestion;
                current.totalQuestion += item.totalQuestion;
                current.totalScore += item.diem;
                current.attemptCount += 1;
            } else {
                subjectMap.set(item.subjectId, {
                    subjectId: item.subjectId,
                    monHoc: item.monHoc,
                    correctQuestion: item.correctQuestion,
                    totalQuestion: item.totalQuestion,
                    totalScore: item.diem,
                    attemptCount: 1,
                });
            }
        });

        return Array.from(subjectMap.values())
            .map((subject) => ({
                ...subject,

                accuracy:
                    subject.totalQuestion > 0
                        ? (subject.correctQuestion /
                            subject.totalQuestion) *
                        100
                        : 0,

                averageScore:
                    subject.attemptCount > 0
                        ? subject.totalScore /
                        subject.attemptCount
                        : 0,
            }))
            .sort(
                (a, b) =>
                    b.accuracy - a.accuracy,
            );
    }, [results]);
  /**
   * Biểu đồ tiến trình điểm sử dụng các ExamResult thật.
   */
  const lineChartData = React.useMemo(
    () =>
      [...results]
        .sort(
          (a, b) =>
            new Date(a.submittedAt).getTime() -
            new Date(b.submittedAt).getTime(),
        )
        .map((item, index) => ({
          name: `L${index + 1}`,
          "Điểm Số": Math.round(item.diem * 100) / 100,
          title: item.tenBaiKT,
          attemptNumber: item.attemptNumber,
        })),
    [results],
  );

  const overallRank =
    averageScore >= 8
      ? {
          label: "Tốt",
          description: "Điểm trung bình hiện tại từ 8 trở lên.",
          className: "text-emerald-600 bg-emerald-50 border-emerald-100",
        }
      : averageScore >= 5
        ? {
            label: "Đạt",
            description: "Điểm trung bình hiện tại đạt mức yêu cầu.",
            className: "text-sky-600 bg-sky-50 border-sky-100",
          }
        : {
            label: results.length > 0 ? "Cần cải thiện" : "Chưa có dữ liệu",
            description:
              results.length > 0
                ? "Điểm trung bình hiện tại dưới 5."
                : "Hãy hoàn thành ít nhất một đề thi.",
            className: "text-rose-500 bg-rose-50 border-rose-100",
          };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[var(--theme-bg)]">
      {/* 1. GIỮ NGUYÊN CẤU TRÚC ResultsTab: Tổng quan <-> StudentAnalyticsSuite */}
      <div className="bg-[var(--theme-surface)] px-5 py-3 border-b border-[#E9EDF7] flex shrink-0 justify-between items-center z-10">
        <h4 className="font-display font-extrabold text-[var(--theme-text)] text-xs tracking-tight uppercase">
          Điểm & Phân tích
        </h4>

        <div className="flex bg-[var(--theme-surface-soft)] p-1 rounded-xl gap-0.5">
          <button
            type="button"
            onClick={() => setActiveSubView("overview")}
            className={`py-1 px-3 text-[10px] font-bold rounded-lg transition ${
              activeSubView === "overview"
                ? "bg-[var(--theme-surface)] text-[var(--theme-primary)] shadow-sm"
                : "text-slate-400"
            }`}
          >
            Tổng quan
          </button>

          <button
            id="btn-goto-deep-training"
            type="button"
            onClick={() => setActiveSubView("suite")}
            className={`py-1 px-3 text-[10px] font-bold rounded-lg transition ${
              activeSubView === "suite"
                ? "bg-[var(--theme-primary)] text-white shadow-sm"
                : "text-slate-400"
            }`}
          >
            Chuyên sâu đề thi
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView("practice")}
            className={`py-1 px-3 text-[10px] font-bold rounded-lg transition ${
              activeSubView === "practice"
                ? "bg-[var(--theme-primary)] text-white shadow-sm"
                : "text-slate-400"
            }`}
          >
            Luyện tập
          </button>
        </div>
      </div>

      {activeSubView === "suite" ? (
        <StudentAnalyticsSuite
          stats={stats}
          historyLogs={historyLogs}
          onOpenAIChat={onOpenAIChat}
          onSwitchTab={onSwitchTab}
          onAddHistory={onAddHistory}
          sqlResults={results}
          onResultsChanged={loadResults}
        />
      ) : activeSubView === "practice" ? (
        <PracticeHistoryView />
      ) : (
        <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 py-4 md:py-7 space-y-5 md:space-y-6 no-scrollbar scroll-smooth">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-extrabold text-[var(--theme-text)] text-base">
                Tổng quan kết quả
              </h3>
            </div>

            <button
              type="button"
              onClick={() => void loadResults()}
              disabled={isLoadingResults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E9EDF7] bg-[var(--theme-surface)] text-[10px] font-bold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)] disabled:opacity-60"
            >
              {isLoadingResults ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Tải lại
            </button>
          </div>

          {resultError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold p-3 rounded-2xl">
              {resultError}
            </div>
          )}

          {/* BENTO: chỉ dùng dữ liệu backend hiện có */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] space-y-1 shadow-soft">
              <div className="flex items-center gap-1 text-slate-400">
                <CheckSquare className="w-4 h-4 text-[var(--theme-primary)]" />
                <span className="text-[10px] font-bold uppercase">Số lượt thi</span>
              </div>
              <h3 className="font-display font-extrabold text-[#2D3748] text-lg tracking-tight font-mono">
                {results.length}
              </h3>
              <p className="text-[9px] text-slate-400">Bao gồm cả các lần làm lại</p>
            </div>

            <div className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] space-y-1 shadow-soft">
              <div className="flex items-center gap-1 text-slate-400">
                <CheckSquare className="w-4 h-4 text-sky-500" />
                <span className="text-[10px] font-bold uppercase">Số câu đã làm</span>
              </div>
              <h3 className="font-display font-extrabold text-[#2D3748] text-lg tracking-tight font-mono">
                {totalQuestionsDone} <span className="text-xs text-slate-400">câu</span>
              </h3>
              <p className="text-[9px] text-slate-400">Tính trên toàn bộ ExamResult</p>
            </div>

            <div className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] space-y-1 shadow-soft">
              <div className="flex items-center gap-1 text-slate-400">
                <Award className="w-4 h-4 text-[#FFD6A5]" />
                <span className="text-[10px] font-bold uppercase">Điểm trung bình</span>
              </div>
              <h3 className="font-display font-extrabold text-[var(--theme-primary)] text-lg tracking-tight font-mono">
                {averageScore.toFixed(2)} <span className="text-xs text-slate-400">/10</span>
              </h3>
              <p className="text-[9px] text-slate-400">Tính từ dữ liệu kết quả thật</p>
            </div>

            <div className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] space-y-1 shadow-soft">
              <div className="flex items-center gap-1 text-slate-400">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase">Điểm cao nhất</span>
              </div>
              <h3 className="font-display font-extrabold text-emerald-500 text-lg tracking-tight font-mono">
                {highestScore.toFixed(2)} <span className="text-xs text-slate-400">/10</span>
              </h3>
              <p className="text-[9px] text-slate-400">Kỷ lục hiện tại</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubView("suite")}
            className="w-full bg-[#EBF2FF] border border-[var(--theme-primary)]/15 hover:bg-[#EFF4FF] transition p-3.5 rounded-2xl flex items-center justify-between text-xs text-[var(--theme-primary)] font-bold"
          >
            <span className="flex items-center gap-1">
              ⏱ Xem lịch sử từng lượt, đáp án và làm lại đề
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* BIỂU ĐỒ ĐIỂM: backend đã có dữ liệu */}
          <div className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] space-y-3 shadow-soft">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <ChartSpline className="w-4.5 h-4.5 text-[var(--theme-primary)]" />
                <h5 className="font-display font-bold text-[var(--theme-text)] text-sm">
                  Tiến trình điểm thi
                </h5>
              </div>
            </div>

            {isLoadingResults ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-primary)]" />
              </div>
            ) : lineChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 italic">
                Hãy hoàn thành một đề thi để bắt đầu vẽ biểu đồ.
              </p>
            ) : (
              <div className="w-full overflow-x-auto text-[10px] py-1 font-mono">
                <LineChart width={Math.max(620, lineChartData.length * 72)} height={220} data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3fa" />
                  <XAxis dataKey="name" stroke="#a0aec0" />
                  <YAxis domain={[0, 10]} stroke="#a0aec0" />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(2)} điểm`, "Điểm"]}
                    labelFormatter={(label, payload) => {
                      const row = payload?.[0]?.payload;
                      return row?.title ? `${label} - ${row.title}` : label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Điểm Số"
                    stroke="var(--theme-primary)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </div>
            )}
          </div>

                      <div className="bg-[var(--theme-surface)] p-5 rounded-3xl border border-[#E9EDF7] shadow-soft space-y-4">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                  <BookOpen className="w-4 h-4 text-emerald-400" />

                                  <h5 className="font-display font-bold text-[var(--theme-text)] text-sm">
                                      Độ chính xác theo môn học
                                  </h5>
                              </div>

                          </div>


                          {subjectStats.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-[#DDE3F0] bg-[var(--theme-surface-soft)] p-5 text-center">
                                  <p className="text-xs font-semibold text-[var(--theme-text-muted)]">
                                      Chưa có dữ liệu theo môn.
                                  </p>

                                  <p className="text-[10px] text-slate-400 mt-1">
                                      Hãy hoàn thành ít nhất một bài thi.
                                  </p>
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  {subjectStats.map((subject) => (
                                      <div
                                          key={subject.subjectId}
                                          className="space-y-2"
                                      >
                                          <div className="flex items-center justify-between gap-3">
                                              <div>
                                                  <p className="text-xs font-extrabold text-[var(--theme-text)]">
                                                      {subject.monHoc}
                                                  </p>

                                                  <p className="text-[9px] text-slate-400 mt-0.5">
                                                      {subject.correctQuestion}/
                                                      {subject.totalQuestion} câu đúng
                                                      {" • "}
                                                      {subject.attemptCount} lượt thi
                                                  </p>
                                              </div>

                                              <div className="text-right">
                                                  <p className="text-xs font-extrabold text-[var(--theme-primary)] font-mono">
                                                      {subject.accuracy.toFixed(1)}%
                                                  </p>

                                                  <p className="text-[9px] text-slate-400">
                                                      TB {subject.averageScore.toFixed(2)}/10
                                                  </p>
                                              </div>
                                          </div>


                                          <div className="h-2.5 bg-[var(--theme-surface-soft)] rounded-full overflow-hidden">
                                              <div
                                                  className="h-full bg-[var(--theme-primary)] rounded-full transition-all duration-500"
                                                  style={{
                                                      width: `${Math.min(
                                                          100,
                                                          Math.max(
                                                              0,
                                                              subject.accuracy,
                                                          ),
                                                      )}%`,
                                                  }}
                                              />
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

          {/* Phân loại tổng thể từ dữ liệu thật, không giả môn mạnh/yếu */}
          <div className="bg-[var(--theme-surface)] p-5 rounded-3xl border border-[#E9EDF7] shadow-soft space-y-3.5">
            <h5 className="font-display font-extrabold text-[var(--theme-text)] text-xs uppercase tracking-wide">
              Đánh giá tổng thể
            </h5>
            <div className={`p-3 rounded-2xl border ${overallRank.className}`}>
              <p className="text-xs font-extrabold">{overallRank.label}</p>
              <p className="text-[10px] mt-1 opacity-80">{overallRank.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
