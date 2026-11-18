import { AlertTriangle, History } from "lucide-react";

interface Props {
  reasons: string[];
  note?: string | null;
  rejectedAt?: string | null;
  // "current": đề đang ở trạng thái Bị từ chối. "previous": đề đã gửi lại, hiển thị lần từ chối trước để đối chiếu.
  variant?: "current" | "previous";
  title?: string;
}

// Backend trả datetime UTC có thể không kèm "Z"; thêm vào để hiển thị đúng giờ địa phương.
function formatUtc(value: string): string {
  const iso = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("vi-VN");
}

export default function ExamRejectionNotice({
  reasons,
  note,
  rejectedAt,
  variant = "current",
  title,
}: Props) {
  if (reasons.length === 0 && !note) return null;

  const current = variant === "current";
  const Icon = current ? AlertTriangle : History;
  const heading =
    title ?? (current ? "Đề bị Admin từ chối" : "Lần từ chối trước");
  const time = rejectedAt ? formatUtc(rejectedAt) : "";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs ${
        current
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 font-black">
        <Icon className="h-4 w-4" />
        <span>{heading}</span>
        {time && <span className="font-semibold opacity-70">• {time}</span>}
      </div>

      {reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 font-semibold">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {note && (
        <p className="mt-2 whitespace-pre-line font-medium leading-5">
          <b>Chi tiết:</b> {note}
        </p>
      )}
    </div>
  );
}
