import { useState, type FormEvent } from "react";
import { Target, X } from "lucide-react";
import type { UserStats } from "../types";

type Goals = Pick<UserStats, "dailyGoalMinutes" | "targetScore" | "targetUniversity">;
export default function LearningGoalsModal({ stats, onClose, onSave }: { stats: UserStats; onClose: () => void; onSave: (goals: Goals) => void }) {
  const [minutes, setMinutes] = useState(stats.dailyGoalMinutes);
  const [score, setScore] = useState(stats.targetScore);
  const [university, setUniversity] = useState(stats.targetUniversity);
  const [error, setError] = useState("");
  const save = (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 300) { setError("Thời gian học phải từ 5 đến 300 phút mỗi ngày."); return; }
    if (!Number.isFinite(score) || score < 0 || score > 30) { setError("Tổng điểm mục tiêu phải từ 0 đến 30."); return; }
    try { onSave({ dailyGoalMinutes: minutes, targetScore: Math.round(score * 10) / 10, targetUniversity: university.trim() }); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể lưu mục tiêu. Vui lòng thử lại."); }
  };
  const field = "mt-2 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-4 py-3 text-sm text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-indigo-300";
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
    <form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="goals-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-[var(--theme-surface)] p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between"><h2 id="goals-title" className="flex items-center gap-2 text-lg font-bold text-[var(--theme-text)]"><Target className="h-5 w-5 text-indigo-500" /> Mục tiêu học tập</h2><button type="button" onClick={onClose} aria-label="Đóng" className="p-2"><X className="h-5 w-5" /></button></div>
      <label className="block text-sm font-semibold text-[var(--theme-text)]">Thời gian học mỗi ngày (phút)<input type="number" min={5} max={300} required value={minutes} onChange={e => setMinutes(Number(e.target.value))} className={field} /></label>
      <div className="my-3 flex gap-2">{[15, 30, 60, 90].map(value => <button type="button" key={value} onClick={() => setMinutes(value)} className={`rounded-xl px-3 py-2 text-xs font-bold ${minutes === value ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"}`}>{value} phút</button>)}</div>
      <label className="mt-4 block text-sm font-semibold text-[var(--theme-text)]">Tổng điểm mục tiêu của 3 môn<input type="number" min={0} max={30} step={0.1} required value={score} onChange={e => setScore(Number(e.target.value))} className={field} /></label>
      <label className="mt-4 block text-sm font-semibold text-[var(--theme-text)]">Trường đại học mong muốn<input maxLength={200} value={university} onChange={e => setUniversity(e.target.value)} placeholder="Không bắt buộc" className={field} /></label>
      <p className="mt-4 text-xs text-[var(--theme-text-muted)]">Mục tiêu được lưu cho tài khoản này trên trình duyệt đang sử dụng.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Hủy</button><button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Lưu mục tiêu</button></div>
    </form>
  </div>;
}
