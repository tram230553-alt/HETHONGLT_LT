/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Flame,
  Sparkles,
  BookOpen,
  GraduationCap,
  Play,
  CheckCircle2,
  TrendingUp,
  Award,
  RefreshCw
} from "lucide-react";
import { UserStats, SubjectId } from "../types";
import { getStudentDashboard, type StudentDashboardDto } from "../../services/studentDashboardService";
import { topicService, type TopicDto } from "../../services/topicService";
import {
  syncDailyMissionPlan,
  startNewMissionCycle,
  type SyncedMissionPlan,
} from "../utils/dailyMissionPlan";
import StudentNotificationBell from "./StudentNotificationBell";

interface HomeTabProps {
  stats: UserStats;
  onIncrementTime: () => void;
  onOpenFlashcards: () => void;
  onOpenAIChat: (initialPrompt?: string) => void;
  onSwitchTab?: (tabIndex: number) => void;
  onSelectSubjectForPractice?: (subjectId: SubjectId) => void;
  onNavigateToExam?: (subjectId: SubjectId, examId: string) => void;
  onSelectMissionTopic?: (topic: TopicDto) => void;
}

export default function HomeTab({
  stats,
  onIncrementTime,
  onOpenFlashcards,
  onOpenAIChat,
  onSwitchTab,
  onSelectSubjectForPractice,
  onNavigateToExam,
  onSelectMissionTopic
}: HomeTabProps) {
  const [dashboard, setDashboard] = useState<StudentDashboardDto | null>(null);
  const [allTopics, setAllTopics] = useState<TopicDto[]>([]);
  const [missionPlan, setMissionPlan] = useState<SyncedMissionPlan | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [data, studentTopics] = await Promise.all([
          getStudentDashboard(),
          topicService.getStudentTopics().catch(() => [] as TopicDto[]),
        ]);
        if (active) {
          setDashboard(data);
          setAllTopics(studentTopics);
          setMissionPlan(syncDailyMissionPlan(studentTopics));
          setDashboardError('');
        }
      } catch (error) {
        if (active) setDashboardError(error instanceof Error ? error.message : 'Không tải được dữ liệu trang chủ.');
      } finally {
        if (active) setDashboardLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (allTopics.length === 0) return;
    const handleMissionUpdate = () => {
      setMissionPlan(syncDailyMissionPlan(allTopics));
    };
    window.addEventListener("smartexam_daily_mission_updated", handleMissionUpdate);
    return () => {
      window.removeEventListener("smartexam_daily_mission_updated", handleMissionUpdate);
    };
  }, [allTopics]);

  const effectiveProgressDays = missionPlan
    ? missionPlan.state.progressDays
    : Math.min(7, dashboard?.activeDaysLast7 ?? 0);
  const effectiveStreak = missionPlan
    ? missionPlan.state.streakDays
    : (dashboard?.currentStreak ?? 0);
  const progressPercent = Math.min(
    100,
    Math.round((effectiveProgressDays / 7) * 100)
  );
  const todayStudiedCount = missionPlan?.state.todayStudiedCount ?? 0;
  const combinedAverage = useMemo(() => {
    if (!dashboard) return 0;
    const count = dashboard.totalExamAttempts + dashboard.totalPracticeAttempts;
    return count === 0 ? 0 : Math.round(((dashboard.averageExamScore * dashboard.totalExamAttempts + dashboard.averagePracticeScore * dashboard.totalPracticeAttempts) / count) * 100) / 100;
  }, [dashboard]);

  // Bí quyết học hôm nay từ Trợ lý AI
  const weakestSubject = dashboard?.subjects.filter(x => x.examAttempts + x.practiceAttempts > 0).sort((a, b) => a.averageScore - b.averageScore)[0];
  const dailyTip = weakestSubject
    ? `Điểm trung bình môn ${weakestSubject.subjectName} hiện là ${weakestSubject.averageScore}/10. Hãy ưu tiên luyện thêm các chủ đề của môn này.`
    : "Bạn chưa có kết quả học tập. Hãy chọn một chủ đề hoặc đề thi đang mở để bắt đầu.";

  return (
    <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 py-4 md:py-7 space-y-5 md:space-y-6 no-scrollbar scroll-smooth">
      {dashboardLoading && <div className="flex items-center justify-center rounded-2xl border border-[#E9EDF7] bg-[var(--theme-surface)] p-3 text-xs font-bold text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải dữ liệu học tập...</div>}
      {dashboardError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{dashboardError}</div>}

      {/* 1. HEADER (Avatar, Student Name, Rank & Bell Icon) */}
      <div className="flex items-center justify-between bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] shadow-soft relative">
        <div className="flex items-center gap-3">
          {/* Avatar với vòng hào quang cấp độ */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-full flex items-center justify-center text-white font-bold font-display text-lg shadow-sm border-2 border-white ring-4 ring-[var(--theme-primary)]/10">
              {(dashboard?.studentName || stats.fullName)[0]}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 p-0.5 rounded-full border border-white text-[8px] flex items-center justify-center shadow-xs">
              👑
            </span>
          </div>

          {/* Sĩ tử Name & Rank */}
          <div>
            <div className="flex items-center gap-1.5">
              <h4 id="student-display-name" className="font-display font-extrabold text-[var(--theme-text)] text-sm tracking-tight leading-none">
                {dashboard?.studentName || stats.fullName}
              </h4>
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-xs">
                {dashboard?.gradeName || 'Học sinh'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1 inline-flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span className="truncate max-w-[140px]">{dashboard?.studentCode || 'Đang tải hồ sơ'}</span>
            </p>
          </div>
        </div>

        {/* Cột Công Cụ: Bell & Flame Status */}
        <div className="flex items-center gap-2">
          <StudentNotificationBell />
          {/* Chỉ số Streak nhanh của Duolingo */}
          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-200/40 shadow-sm">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-xs font-extrabold font-mono">{effectiveStreak}d</span>
          </div>
        </div>
      </div>

      {/* 2. DAILY MOTIVATION BANNER (Display: "Hôm nay bạn muốn chinh phục mục tiêu nào?") */}
      <div className="relative bg-gradient-to-br from-[var(--theme-primary)] via-[#6F90EF] to-[#5D81E8] text-white p-5 rounded-3xl shadow-pastel-blue overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--theme-surface)]/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[var(--theme-surface)]/10 rounded-full blur-xl"></div>

        <div className="relative z-10 space-y-3.5">
          <div className="space-y-1">
            <span className="bg-[var(--theme-surface)]/20 text-[8px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
              Lời Khuyên Động Lực Hàng Ngày
            </span>
            <h2 className="font-display font-extrabold text-[15px] sm:text-base leading-snug text-blue-50">
              💡 “Hôm nay bạn muốn chinh phục mục tiêu nào?”
            </h2>
            <p className="text-[11px] text-blue-100 font-sans leading-relaxed">
              Bạn đang có {dashboard?.availableExamCount ?? 0} đề thi và {dashboard?.activeTopicCount ?? 0} chủ đề phù hợp với {dashboard?.gradeName || 'khối học'}.
            </p>
          </div>

          {/* Bộ điều khiển mục tiêu trong banner */}
          <div className="bg-[var(--theme-surface)]/10 p-3 rounded-2xl border border-white/15 flex items-center justify-between backdrop-blur-xs">
            <div className="space-y-0.5">
              <span className="text-[9px] text-blue-200 uppercase font-mono font-bold">Mục tiêu 7 ngày</span>
              <p className="text-xs font-bold font-display">{effectiveProgressDays} / 7 ngày hoàn thành</p>
            </div>

            <button
              id="btn-add-study-minutes-home"
              onClick={() => {
                const firstPlanned = missionPlan?.plannedTopics?.[0];
                if (firstPlanned && onSelectMissionTopic) {
                  onSelectMissionTopic(firstPlanned);
                } else if (onSwitchTab) {
                  onSwitchTab(1);
                }
              }}
              className="bg-[var(--theme-surface)] text-[var(--theme-primary)] hover:bg-blue-50 active:scale-95 transition-all font-extrabold text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" /> Học ngay 🚀
            </button>
          </div>

          {/* Thanh Tiến trình trực quan (mục tiêu 7 ngày) */}
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-[var(--theme-surface)]/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-300 to-teal-300 transition-all duration-700 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-blue-100 font-mono">
              <span>Đạt {progressPercent}% mục tiêu 7 ngày ({effectiveProgressDays}/7)</span>
              <span>
                Đã học {missionPlan?.completedTopicsCount ?? 0}/{missionPlan?.totalTopicsCount ?? (dashboard?.activeTopicCount ?? 0)} chủ đề
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROGRESS SUMMARY (Study Streak, Active Topics, Avg Score, Weekly Progress) */}
      <div>
        <div className="px-1 mb-3">
          <h5 className="font-display font-bold text-[var(--theme-text)] text-sm mb-0.5">Hiệu Suất Tuần Này</h5>
          <p className="text-[10px] text-slate-400 font-sans">Báo cáo bứt phá tự động được phân tích theo thời gian thực</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Card 1: Study Streak */}
          <div className="bg-[var(--theme-surface)] p-3.5 rounded-2xl border border-[#E9EDF7] flex items-center gap-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <Flame className="w-5.5 h-5.5 fill-current" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Chuỗi Học Tập</span>
              <p className="text-xs font-bold text-[var(--theme-text)] truncate font-display">{effectiveStreak} ngày liên tục</p>
            </div>
          </div>

          {/* Card 2: Active Topics */}
          <div className="bg-[var(--theme-surface)] p-3.5 rounded-2xl border border-[#E9EDF7] flex items-center gap-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--theme-primary)] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Chủ Đề Đang Mở</span>
              <p className="text-xs font-bold text-[var(--theme-text)] truncate font-display">{dashboard?.activeTopicCount ?? 0} chủ đề học</p>
            </div>
          </div>

          {/* Card 3: Average Score */}
          <div className="bg-[var(--theme-surface)] p-3.5 rounded-2xl border border-[#E9EDF7] flex items-center gap-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Điểm Trung Bình</span>
              <p className="text-xs font-bold text-[var(--theme-text)] truncate font-display">{combinedAverage} / 10 Thang điểm</p>
            </div>
          </div>

          {/* Card 4: Weekly Progress */}
          <div className="bg-[var(--theme-surface)] p-3.5 rounded-2xl border border-[#E9EDF7] flex items-center gap-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Tiến Độ 7 Ngày</span>
              <p className="text-xs font-bold text-[var(--theme-text)] truncate font-display">{effectiveProgressDays} / 7 ngày học tập</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S TASKS TIMELINE (3 Topics of 3 distinct Subjects, only rotated when studied) */}
      <div className="bg-[var(--theme-surface)] p-4.5 rounded-3xl border border-[#E9EDF7] space-y-4 shadow-soft">
        <div className="flex items-center justify-between px-1 gap-2">
          <div>
            <h5 className="font-display font-bold text-[var(--theme-text)] text-sm">Lịch Nhiệm Vụ Hôm Nay</h5>

          </div>
          {missionPlan?.allTopicsCompleted ? (
            <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
              Hoàn tất tất cả các môn 🎉
            </span>
          ) : todayStudiedCount >= 3 ? (
            <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
              Hoàn Thành ({todayStudiedCount}/3) ✓
            </span>
          ) : todayStudiedCount > 0 ? (
            <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
              Đã học {todayStudiedCount}/3 chủ đề
            </span>
          ) : (
            <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
              Chưa Hoàn Thành (0/3)
            </span>
          )}
        </div>

        <div className="relative pl-6 space-y-5">
          <div className="absolute left-[9px] top-1.5 bottom-1.5 w-0.5 bg-[#E9EDF7]"></div>
          {(missionPlan?.plannedTopics ?? []).map((topic, index) => {
            const styles = [
              { marker: 'bg-blue-500', label: 'text-blue-500', button: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200' },
              { marker: 'bg-emerald-500', label: 'text-emerald-500', button: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200' },
              { marker: 'bg-amber-500', label: 'text-amber-500', button: 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200' },
            ];
            const style = styles[index] ?? styles[0];
            return (
              <div key={topic.id} className="relative group">
                <div className={`absolute -left-[23px] top-1.5 w-4 h-4 ${style.marker} border-2 border-white rounded-full flex items-center justify-center shadow-sm`}>
                  <div className="w-1.5 h-1.5 bg-[var(--theme-surface)] rounded-full"></div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className={`text-[9px] uppercase font-extrabold ${style.label} font-mono tracking-wider`}>
                      Môn {topic.subjectName} · {topic.questionCount} câu hỏi
                    </span>
                    <p className="text-xs font-bold text-[var(--theme-text)] leading-snug">
                      {topic.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      {topic.chapterName ? `${topic.chapterName} · ` : ''}Học xong sẽ lấp đầy thanh tiến độ 7 ngày & tăng chuỗi học tập
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectMissionTopic) {
                        onSelectMissionTopic(topic);
                      } else {
                        onSwitchTab?.(1);
                      }
                    }}
                    className={`${style.button} font-extrabold text-[10px] py-1.5 px-3 rounded-lg border transition whitespace-nowrap cursor-pointer active:scale-95`}
                  >
                    Học ngay
                  </button>
                </div>
              </div>
            );
          })}

          {missionPlan?.allTopicsCompleted && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center space-y-2.5">
              <p className="text-xs font-bold text-emerald-800">
                🎉 Chúc mừng! Bạn đã học hoàn thành toàn bộ {missionPlan.totalTopicsCount} chủ đề của tất cả {missionPlan.totalSubjectsCount} môn học!
              </p>
              <button
                type="button"
                onClick={() => {
                  startNewMissionCycle();
                  setMissionPlan(syncDailyMissionPlan(allTopics));
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-[11px] font-extrabold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Bắt đầu chu kỳ ôn tập mới
              </button>
            </div>
          )}

          {!dashboardLoading && !missionPlan?.allTopicsCompleted && (missionPlan?.plannedTopics.length ?? 0) === 0 && (
            <p className="py-4 text-center text-xs italic text-slate-400">
              Hiện chưa có chủ đề học tập nào cho khối của bạn.
            </p>
          )}
        </div>
      </div>

      {/* 6. RECENT LEARNING ACTIVITIES */}
      <div className="bg-[var(--theme-surface)] p-4.5 rounded-3xl border border-[#E9EDF7] space-y-3.5 shadow-sm">
        <h5 className="font-display font-bold text-[var(--theme-text)] text-sm px-0.5">Nhật Ký Học Tập Có Kết Quả</h5>
        <div className="space-y-3">
          {(dashboard?.recentActivities.length ?? 0) === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">Chưa có hoạt động học tập nào gần đây. Bắt đầu rèn luyện ngay!</p>
          ) : (
            (dashboard?.recentActivities ?? []).map((act, index) => {
              const bgClass = act.type === 'exam' ? "bg-blue-50" : "bg-emerald-50";
              const iconClass = act.type === 'exam' ? "text-[var(--theme-primary)] fill-[#EBF2FF]" : "text-emerald-500 fill-emerald-100";
              return (
                <div key={`${act.submittedAt}-${index}`} className="flex gap-2.5 items-start text-xs font-sans">
                  <div className={`w-5 h-5 ${bgClass} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${iconClass}`} />
                  </div>
                  <div className="flex-1 text-[var(--theme-text-muted)]">
                    <p className="leading-snug">
                      Đã hoàn thành {act.type === 'exam' ? 'đề thi' : 'bài luyện tập'} <b>{act.title}</b> môn {act.subjectName}, đạt <b>{act.score}/10</b>.
                    </p>
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                      {new Date(act.submittedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DANH SÁCH MÔN HỌC BỔ SUNG */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="space-y-0.5">
            <h5 className="font-display font-bold text-[var(--theme-text)] text-sm">Các Bộ Môn Luyện Thi Quốc Gia</h5>
            <span className="text-[10px] text-slate-400 block font-sans">Vuốt ngang để xem thêm môn học khác</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{dashboard?.subjects.length ?? 0} Môn học</span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-1 px-1">
          {(dashboard?.subjects ?? []).map((sub, index) => {
            const progress = Math.round(sub.averageScore * 10);
            const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];
            const color = colors[index % colors.length];
            return (
              <div
                key={sub.subjectId}
                id={`subject-card-home-${sub.subjectId}`}
                className="bg-[var(--theme-surface)] p-4 rounded-3xl border border-[#E9EDF7] hover:border-[var(--theme-primary)]/30 hover:shadow-soft transition-all duration-300 flex flex-col justify-between h-[115px] min-w-[155px] w-[155px] shrink-0 snap-start cursor-pointer group shadow-soft"
                onClick={() => {
                  onSwitchTab?.(2);
                }}
              >
                <div className="flex justify-between items-start">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm"
                    style={{ backgroundColor: `${color}25`, color }}
                  >
                    {sub.subjectName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold font-mono text-slate-400">
                    {sub.examAttempts + sub.practiceAttempts} lượt
                  </span>
                </div>

                <div className="mt-2.5">
                  <h6 className="font-display font-bold text-[var(--theme-text)] text-xs tracking-tight group-hover:text-[var(--theme-primary)] transition">
                    Môn {sub.subjectName}
                  </h6>
                  {/* Slider tiến độ từng môn */}
                  <div className="w-full bg-[#E9EDF7] h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%`, backgroundColor: color }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-1 font-mono">
                    <span>Đã học</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
          {!dashboardLoading && (dashboard?.subjects.length ?? 0) === 0 && <div className="min-w-full rounded-2xl border border-dashed border-[#E9EDF7] p-6 text-center text-xs text-slate-400">Chưa có dữ liệu môn học.</div>}
        </div>
      </div>

      {/* LỐI TẮT HỌC THUẬT (Thư mục thẻ nhớ, gia sư) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Thẻ ghi nhớ */}
        <button
          id="btn-shortcut-flashcard-home"
          onClick={onOpenFlashcards}
          className="bg-[#F4FFFB] hover:bg-[#EAFAF3] p-4 rounded-3xl border border-[#B5EAD7]/50 transition text-left flex flex-col justify-between h-[110px]"
        >
          <div className="w-8 h-8 rounded-lg bg-[#B5EAD7]/30 flex items-center justify-center">
            <BookOpen className="w-4.5 h-4.5 text-[#42B883]" />
          </div>
          <div>
            <h6 className="font-display font-medium text-[var(--theme-text)] text-xs tracking-tight leading-none">
              Thẻ Ghi Nhớ Quizlet
            </h6>
            <p className="text-[9px] text-emerald-600 font-sans mt-1">
              Active Recall (+15 Ngọc)
            </p>
          </div>
        </button>

        {/* Trò chuyện AI */}
        <button
          id="btn-shortcut-ai-tutor-home"
          onClick={() => onOpenAIChat()}
          className="bg-[#EFF4FF] hover:bg-[#E2EBFF] p-4 rounded-3xl border border-[var(--theme-secondary)]/50 transition text-left flex flex-col justify-between h-[110px]"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary)]/20 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-[#5D84EB] animate-pulse" />
          </div>
          <div>
            <h6 className="font-display font-medium text-[var(--theme-text)] text-xs tracking-tight leading-none">
              Trợ Lý Siêu Trí Tuệ
            </h6>
            <p className="text-[9px] text-indigo-500 font-sans mt-1">
              Hỏi đáp toán lý hóa anh 24/7
            </p>
          </div>
        </button>
      </div>

      {/* MẸO AI HỌC THUẬT QUÝ GIÁ */}
      <div className="bg-amber-50/50 rounded-3xl border border-amber-200/50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-display font-extrabold tracking-wide uppercase">
            Bí Quyết Hôm Nay (AI Suggestion)
          </span>
        </div>
        <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed font-sans">{dailyTip}</p>
        <button
          id="btn-ask-ai-tip-home"
          onClick={() => onOpenAIChat(`Giải thích cụ thể hơn và đưa ra ví dụ về bí quyết này: "${dailyTip}"`)}
          className="w-full bg-[#FFF9EB] hover:bg-[#FFF2D4] text-amber-800 font-bold text-[10px] py-1.5 rounded-lg border border-amber-200 transition text-center"
        >
          🧠 Hãy phân tích sâu hơn bài toán thực tế này
        </button>
      </div>

    </div>
  );
}
