import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  // Đơn vị hiển thị trong câu "Hiển thị 1–10 / 57 học sinh".
  itemLabel?: string;
  className?: string;
}

// Trả về dãy số trang kèm dấu "…" khi có quá nhiều trang.
function getPageItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);

  if (page <= 3) {
    [2, 3, 4].forEach((value) => pages.add(value));
  }

  if (page >= totalPages - 2) {
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => pages.add(value));
  }

  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];

  sorted.forEach((value, index) => {
    if (index > 0) {
      const gapSize = value - sorted[index - 1];

      // Chỉ thiếu đúng một trang thì hiện luôn số trang đó thay vì dấu "…".
      if (gapSize === 2) result.push(value - 1);
      else if (gapSize > 2) result.push("gap");
    }

    result.push(value);
  });

  return result;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = "mục",
  className = "",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Ít dữ liệu thì không cần hiện thanh phân trang.
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const buttonBase =
    "min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center";

  return (
    <nav
      aria-label="Phân trang"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 ${className}`}
    >
      <p className="text-[11px] font-semibold text-slate-500">
        Hiển thị {from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} /{" "}
        {total.toLocaleString("en-US")} {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${buttonBase} text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageItems(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-xs font-bold text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={`${buttonBase} ${
                item === page
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${buttonBase} text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
