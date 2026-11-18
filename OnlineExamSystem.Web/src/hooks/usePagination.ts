import { useEffect, useMemo, useState } from "react";

// Phân trang phía giao diện cho một danh sách đã được lọc/sắp xếp.
// resetKey: khi giá trị này đổi (ví dụ từ khóa tìm kiếm, bộ lọc) trang sẽ quay về 1.
export function usePagination<T>(
  items: T[],
  pageSize = 10,
  resetKey: unknown = "",
) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  // Danh sách co lại (xóa phần tử, tải lại...) thì không đứng ở trang không còn tồn tại.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    setPage,
    pageItems,
    total: items.length,
    pageSize,
    totalPages,
  };
}
