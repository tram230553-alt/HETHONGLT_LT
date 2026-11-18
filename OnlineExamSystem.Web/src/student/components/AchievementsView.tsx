/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronLeft, Trophy, Flame, Zap, Target, Lock } from "lucide-react";
import { UserStats } from "../types";

export default function AchievementsView({ stats, onClose }: { stats: UserStats; onClose: () => void }) {
  
  const badges = [
    {
      id: "top_scorer",
      title: "Top Scorer",
      description: "Đạt điểm 9+ trong 3 bài thi thử liên tiếp",
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      progress: 1,
      total: 3,
      isUnlocked: false
    },
    {
      id: "study_streak",
      title: "Study Streak",
      description: "Học liên tục 7 ngày không ngắt quãng",
      icon: <Flame className="w-8 h-8 text-orange-500" />,
      progress: stats.currentStreak,
      total: 7,
      isUnlocked: stats.currentStreak >= 7
    },
    {
      id: "fast_learner",
      title: "Fast Learner",
      description: "Hoàn thành 1 bài thi dưới 50% thời gian cho phép",
      icon: <Zap className="w-8 h-8 text-amber-400" />,
      progress: 0,
      total: 1,
      isUnlocked: false
    },
    {
      id: "perfect_score",
      title: "Perfect Score",
      description: "Đạt điểm tuyệt đối trong bài thi",
      icon: <Target className="w-8 h-8 text-red-500" />,
      progress: 0,
      total: 1,
      isUnlocked: false
    }
  ];

  return (
    <div className="absolute inset-0 bg-[var(--theme-surface-soft)] z-50 flex flex-col animate-fade-in overflow-hidden sm:rounded-[32px]">
      {/* Header */}
      <div className="h-14 border-b border-[var(--theme-border)] flex items-center px-4 shrink-0 bg-[var(--theme-surface)] z-10 relative">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-[var(--theme-text-muted)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-[var(--theme-text)] text-sm flex-1 text-center pr-6">Thành Tựu Của Bạn</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 p-4 space-y-4">
        
        <div className="bg-[var(--theme-surface)] p-5 rounded-3xl border border-[var(--theme-border)] shadow-sm text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="font-display font-extrabold text-[var(--theme-text)]">Cấp độ: Nỗ Lực Không Ngừng</h3>
          <p className="text-xs text-[var(--theme-text-light)] mt-1">Đã mở khóa: {badges.filter(b => b.isUnlocked).length} / {badges.length} huy hiệu</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {badges.map(badge => (
            <div 
              key={badge.id}
              className={`p-4 rounded-2xl border transition flex items-center gap-4 ${
                badge.isUnlocked ? "bg-[var(--theme-surface)] border-[var(--theme-primary)]/30 shadow-pastel-blue" : "bg-[var(--theme-surface-soft)] border-[var(--theme-border)] opacity-80"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${badge.isUnlocked ? "bg-[var(--theme-surface-soft)] shadow-inner" : "bg-[var(--theme-surface)] border border-[var(--theme-border)] grayscale"}`}>
                {badge.icon}
              </div>
              
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 justify-between">
                  <h4 className="font-bold text-[var(--theme-text)] text-sm">{badge.title}</h4>
                  {badge.isUnlocked && <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Đã đạt</span>}
                  {!badge.isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <p className="text-[10px] text-[var(--theme-text-light)] font-sans mt-0.5 leading-relaxed">
                  {badge.description}
                </p>

                {/* Tiền trình */}
                {!badge.isUnlocked && (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Tiến độ</span>
                      <span>{Math.min(badge.progress, badge.total)} / {badge.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 transition-all rounded-full"
                        style={{ width: `${(Math.min(badge.progress, badge.total) / badge.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
