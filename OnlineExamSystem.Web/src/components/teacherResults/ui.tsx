import React from "react";
import { RefreshCw, Search } from "lucide-react";

/* =========================================================
   Giao diện dùng chung cho 4 màn hình của giáo viên:
   - Kết quả bài thi        - Câu sai trong đề thi
   - Kết quả luyện tập      - Câu sai luyện tập
   Tất cả đều dùng cùng header, thẻ tổng quan, thanh tab con...
========================================================= */

export type ResultTone = "indigo" | "violet" | "rose";

// Tailwind cần thấy nguyên chuỗi class, nên không ghép chuỗi động.
export const toneStyles: Record<
  ResultTone,
  {
    tabActive: string;
    headerBox: string;
    eyebrow: string;
    icon: string;
    headerButton: string;
    ring: string;
    spinner: string;
    soft: string;
    softText: string;
    link: string;
    bar: string;
    avatarHover: string;
  }
> = {
  indigo: {
    tabActive: "bg-indigo-600",
    headerBox: "border-indigo-100 from-indigo-50 to-blue-50",
    eyebrow: "text-indigo-600",
    icon: "text-indigo-600",
    headerButton: "border-indigo-100 text-indigo-700",
    ring: "focus:ring-indigo-500",
    spinner: "text-indigo-500",
    soft: "border-indigo-100 bg-indigo-50",
    softText: "text-indigo-700",
    link: "text-indigo-600 hover:text-indigo-700",
    bar: "bg-indigo-600",
    avatarHover: "group-hover:bg-indigo-50 group-hover:text-indigo-600",
  },
  violet: {
    tabActive: "bg-violet-600",
    headerBox: "border-violet-100 from-violet-50 to-indigo-50",
    eyebrow: "text-violet-600",
    icon: "text-violet-600",
    headerButton: "border-violet-100 text-violet-700",
    ring: "focus:ring-violet-500",
    spinner: "text-violet-500",
    soft: "border-violet-100 bg-violet-50",
    softText: "text-violet-700",
    link: "text-violet-600 hover:text-violet-700",
    bar: "bg-violet-600",
    avatarHover: "group-hover:bg-violet-50 group-hover:text-violet-600",
  },
  rose: {
    tabActive: "bg-rose-500",
    headerBox: "border-rose-100 from-rose-50 to-orange-50",
    eyebrow: "text-rose-600",
    icon: "text-rose-500",
    headerButton: "border-rose-100 text-rose-600",
    ring: "focus:ring-rose-400",
    spinner: "text-rose-500",
    soft: "border-rose-100 bg-rose-50",
    softText: "text-rose-600",
    link: "text-rose-600 hover:text-rose-700",
    bar: "bg-rose-500",
    avatarHover: "group-hover:bg-rose-50 group-hover:text-rose-600",
  },
};

/* ---------- Helpers ---------- */

export function formatDateTime(value?: string | null, fallback = "") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function scoreLabel(score: number) {
  if (score >= 8) return "Khá giỏi";
  if (score >= 6.5) return "Đạt";
  if (score > 0) return "Cần cải thiện";
  return "Chưa có điểm";
}

export function rateTone(rate: number) {
  if (rate >= 70) return { bar: "bg-rose-500", text: "text-rose-600" };
  if (rate >= 40) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-emerald-500", text: "text-emerald-600" };
}

export function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(fileName: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const lines = rows.map((row) => row.map(csvCell).join(","));
  // BOM để Excel hiển thị đúng tiếng Việt.
  const blob = new Blob(
    ["\uFEFF" + [header.map(csvCell).join(","), ...lines].join("\r\n")],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Thanh tab (dùng cho cả tab chính và tab con) ---------- */

export interface PillTab<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
  tone: ResultTone;
}

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: PillTab<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
            active === tab.id
              ? `${toneStyles[tab.tone].tabActive} text-white shadow-sm`
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Header ---------- */

export function ResultsHeader({
  tone,
  eyebrow,
  title,
  icon,
  description,
  actions,
}: {
  tone: ResultTone;
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  actions: React.ReactNode;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl border bg-gradient-to-r p-6 md:flex-row md:items-center md:justify-between ${t.headerBox}`}
    >
      <div className="space-y-1">
        <p className={`text-[10px] font-black uppercase tracking-wider ${t.eyebrow}`}>
          {eyebrow}
        </p>
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-800">
          <span className={t.icon}>{icon}</span>
          {title}
        </h2>
        <p className="max-w-2xl text-xs text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start">{actions}</div>
    </div>
  );
}

export function HeaderButton({
  tone,
  onClick,
  disabled,
  icon,
  children,
}: {
  tone: ResultTone;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-bold disabled:opacity-50 ${toneStyles[tone].headerButton}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function eyebrowText(gradeName?: string, subjectName?: string) {
  return `${gradeName || "Khối được phân công"}${subjectName ? ` • ${subjectName}` : ""}`;
}

/* ---------- Thẻ tổng quan ---------- */

export function SummaryCard({
  label,
  value,
  badge,
  hint,
  danger,
}: {
  label: string;
  value: string;
  badge?: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <span
        className={`block text-[10px] font-black uppercase tracking-wider ${
          danger ? "text-red-500" : "text-slate-400"
        }`}
      >
        {label}
      </span>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className={`text-2xl font-black ${danger ? "text-red-600" : "text-slate-800"}`}>
          {value}
        </h4>
        {badge && (
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
              danger ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      {hint && <p className="text-[10.5px] text-slate-500">{hint}</p>}
    </div>
  );
}

/* ---------- Ô tìm kiếm + select ---------- */

export function SearchBox({
  value,
  onChange,
  placeholder,
  tone,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  tone: ResultTone;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 ${toneStyles[tone].ring}`}
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
    >
      {children}
    </select>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 lg:flex-row lg:items-center">
      {children}
    </div>
  );
}

/* ---------- Trạng thái tải / lỗi / rỗng ---------- */

export function LoadingBlock({ tone, text }: { tone: ResultTone; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white px-6 py-14 text-slate-500">
      <RefreshCw className={`h-7 w-7 animate-spin ${toneStyles[tone].spinner}`} />
      {text && <span className="text-xs font-bold">{text}</span>}
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
  tone,
}: {
  message: string;
  onRetry?: () => void;
  tone: ResultTone;
}) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white px-6 py-10 text-center">
      <p className="text-sm font-bold text-rose-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-4 rounded-xl px-4 py-2 text-xs font-bold text-white ${toneStyles[tone].tabActive}`}
        >
          Thử tải lại
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="text-slate-300">{icon}</div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-700">{title}</h4>
        {hint && <p className="max-w-sm text-xs text-slate-400">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
