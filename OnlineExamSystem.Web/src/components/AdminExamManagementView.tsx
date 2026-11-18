import { confirmDialog } from "../services/confirm";
import { toast } from "../services/toast";
import React from "react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  getAdminExamDetail,
  getAdminExams,
  publishAdminExam,
  rejectAdminExam,
  type AdminExamDetailDto,
  type AdminExamDto,
} from "../services/adminExamService";
import ExamRejectionNotice from "./ExamRejectionNotice";
import RejectExamDialog from "./RejectExamDialog";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";

type StatusFilter = "all" | "draft" | "pending" | "rejected" | "published";

function getStatus(exam: AdminExamDto) {
  if (exam.isPublished) {
    return {
      key: "published" as const,
      label: "Đã duyệt & phát hành",
      className: "bg-emerald-50 text-emerald-700",
      Icon: CheckCircle2,
    };
  }

  if (exam.isSubmittedForApproval) {
    return {
      key: "pending" as const,
      label: "Chờ Admin duyệt",
      className: "bg-amber-50 text-amber-700",
      Icon: Clock3,
    };
  }

  if (exam.isRejected) {
    return {
      key: "rejected" as const,
      label: "Bị từ chối",
      className: "bg-rose-50 text-rose-700",
      Icon: XCircle,
    };
  }

  return {
    key: "draft" as const,
    label: "Giáo viên chưa gửi duyệt",
    className: "bg-slate-100 text-slate-600",
    Icon: FileText,
  };
}

export default function AdminExamManagementView() {
  const [exams, setExams] = React.useState<AdminExamDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [workingId, setWorkingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<AdminExamDto | null>(null);
  const [rejectError, setRejectError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<{
    exam: AdminExamDto;
    detail: AdminExamDetailDto;
  } | null>(null);

  // Thông báo hiển thị dạng toast cố định phía trên, không bị che bởi hộp thoại chi tiết đề.
  React.useEffect(() => {
    if (message) toast.success(message);
  }, [message]);

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setExams(await getAdminExams());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không tải được danh sách đề thi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = React.useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return exams.filter((exam) => {
      const examStatus = getStatus(exam).key;
      const matchStatus = status === "all" || examStatus === status;

      if (!matchStatus) return false;
      if (!keyword) return true;

      return [
        exam.tenBaiKT,
        exam.monHoc,
        exam.khoi,
        exam.giaoVien,
        exam.id,
      ].some((value) => value.toLocaleLowerCase("vi").includes(keyword));
    });
  }, [exams, search, status]);

  // Phân trang danh sách đề (về trang 1 khi đổi từ khóa/bộ lọc).
  const examPagination = usePagination(filtered, 8, `${search}|${status}`);

  const draftCount = exams.filter(
    (x) => !x.isPublished && !x.isSubmittedForApproval && !x.isRejected,
  ).length;
  const rejectedCount = exams.filter(
    (x) => !x.isPublished && !x.isSubmittedForApproval && x.isRejected,
  ).length;
  const pendingCount = exams.filter(
    (x) => !x.isPublished && x.isSubmittedForApproval,
  ).length;
  const publishedCount = exams.filter((x) => x.isPublished).length;

  const openDetail = async (exam: AdminExamDto) => {
    setWorkingId(exam.id);
    setError(null);

    try {
      const detailResult = await getAdminExamDetail(exam.id);
      setDetail({ exam, detail: detailResult });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được chi tiết đề.");
    } finally {
      setWorkingId(null);
    }
  };

  const approve = async (exam: AdminExamDto) => {
    if (!exam.isSubmittedForApproval) {
      setError("Giáo viên chưa gửi đề này để Admin duyệt.");
      return;
    }

    if (exam.totalQuestions === 0) {
      setError("Đề chưa có câu hỏi nên Admin không thể duyệt.");
      return;
    }

    if (
      !(await confirmDialog({
        title: "Duyệt đề thi",
        message: `Duyệt và phát hành đề "${exam.tenBaiKT}" cho học sinh đúng khối?`,
        confirmText: "Duyệt & phát hành",
      }))
    ) {
      return;
    }

    setWorkingId(exam.id);
    setError(null);
    setMessage(null);

    try {
      const result = await publishAdminExam(exam.id);
      setMessage(result || "Đã duyệt và phát hành đề thi.");
      setDetail(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể duyệt đề thi.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  // Mở form chọn lý do. Admin bắt buộc phải nhập lý do trước khi từ chối.
  const openReject = (exam: AdminExamDto) => {
    if (!exam.isSubmittedForApproval || exam.isPublished) {
      setError("Chỉ có thể từ chối đề đang chờ duyệt.");
      return;
    }

    setError(null);
    setMessage(null);
    setRejectError(null);
    setRejecting(exam);
  };

  const confirmReject = async (reasonCodes: string[], note: string) => {
    if (!rejecting) return;

    setWorkingId(rejecting.id);
    setRejectError(null);

    try {
      const result = await rejectAdminExam(rejecting.id, {
        reasonCodes,
        note: note || undefined,
      });
      setMessage(result || "Đã từ chối đề thi và thông báo cho giáo viên.");
      setRejecting(null);
      setDetail(null);
      await loadData();
    } catch (err) {
      setRejectError(
        err instanceof Error ? err.message : "Không thể từ chối đề thi.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Duyệt đề thi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Giáo viên hoàn thiện và gửi đề. Admin xem nội dung, sau đó duyệt phát
            hành hoặc từ chối kèm lý do để giáo viên chỉnh sửa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading || workingId !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Tải lại
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-400">TỔNG ĐỀ</p>
          <p className="text-2xl font-black text-slate-800">{exams.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">CHƯA GỬI DUYỆT</p>
          <p className="text-2xl font-black text-slate-700">{draftCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-600">CHỜ DUYỆT</p>
          <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-bold text-rose-600">BỊ TỪ CHỐI</p>
          <p className="text-2xl font-black text-rose-700">{rejectedCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold text-emerald-600">ĐÃ PHÁT HÀNH</p>
          <p className="text-2xl font-black text-emerald-700">
            {publishedCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên đề, giáo viên, môn, khối..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-300"
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="draft">Giáo viên chưa gửi duyệt</option>
          <option value="pending">Chờ Admin duyệt</option>
          <option value="rejected">Bị từ chối (chờ giáo viên sửa)</option>
          <option value="published">Đã phát hành</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}


      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-500">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          Đang tải danh sách đề thi...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="mt-2 font-bold">Không có đề thi phù hợp</p>
        </div>
      ) : (
        <div className="space-y-3">
          {examPagination.pageItems.map((exam) => {
            const examStatus = getStatus(exam);
            const StatusIcon = examStatus.Icon;
            const busy = workingId === exam.id;

            return (
              <article
                key={exam.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${examStatus.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {examStatus.label}
                      </span>

                    </div>

                    <h3 className="mt-2 text-base font-black text-slate-800">
                      {exam.tenBaiKT}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                      <span>📚 {exam.monHoc}</span>
                      <span>🎓 {exam.khoi}</span>
                      <span>👨‍🏫 {exam.giaoVien}</span>
                      <span>⏱ {exam.thoiLuong} phút</span>
                      <span>🧩 {exam.totalQuestions} câu</span>
                    </div>

                    {exam.isRejected && !exam.isPublished && (
                      <div className="mt-3">
                        <ExamRejectionNotice
                          reasons={exam.rejectionReasons}
                          note={exam.rejectionNote}
                          rejectedAt={exam.rejectedAt}
                          title="Lý do từ chối"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void openDetail(exam)}
                      disabled={busy || workingId !== null}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-50"
                    >
                      {busy ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Xem đề
                    </button>

                    {exam.isSubmittedForApproval && !exam.isPublished && (
                      <>
                        <button
                          type="button"
                          onClick={() => openReject(exam)}
                          disabled={busy || workingId !== null}
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Từ chối
                        </button>

                        <button
                          type="button"
                          onClick={() => void approve(exam)}
                          disabled={
                            busy ||
                            workingId !== null ||
                            exam.totalQuestions === 0
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Duyệt & phát hành
                        </button>
                      </>
                    )}

                    {exam.isPublished && (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Đã công bố
                      </span>
                    )}

                    {!exam.isPublished && !exam.isSubmittedForApproval && (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500">
                        <Send className="h-4 w-4" />
                        {exam.isRejected
                          ? "Chờ giáo viên chỉnh sửa"
                          : "Chờ giáo viên gửi"}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          <Pagination
            page={examPagination.page}
            pageSize={examPagination.pageSize}
            total={examPagination.total}
            onPageChange={examPagination.setPage}
            itemLabel="đề thi"
          />
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Duyệt đề: {detail.exam.tenBaiKT}
                </h3>
                <p className="text-xs text-slate-500">
                  {detail.exam.giaoVien} • {detail.exam.monHoc} • {detail.exam.khoi} • {detail.detail.thoiLuong} phút
                </p>
              </div>
              <button type="button" onClick={() => setDetail(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6">
              {detail.detail.rejectionReasons.length > 0 &&
                (detail.detail.isRejected ||
                  detail.detail.isSubmittedForApproval) &&
                !detail.detail.isPublished && (
                  <ExamRejectionNotice
                    reasons={detail.detail.rejectionReasons}
                    note={detail.detail.rejectionNote}
                    rejectedAt={detail.detail.rejectedAt}
                    variant={detail.detail.isRejected ? "current" : "previous"}
                    title={
                      detail.detail.isRejected
                        ? "Lý do từ chối"
                        : "Lần từ chối trước (giáo viên đã chỉnh sửa và gửi lại)"
                    }
                  />
                )}

              {detail.detail.questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
                  Đề chưa có câu hỏi.
                </div>
              ) : (
                detail.detail.questions.map((question, index) => (
                  <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-400">Câu {index + 1}</p>
                    <p className="mt-1 text-sm font-black text-slate-800">
                      {question.noiDung}
                    </p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {[
                        ["A", question.optionA],
                        ["B", question.optionB],
                        ["C", question.optionC],
                        ["D", question.optionD],
                      ].map(([key, value]) => (
                        <div
                          key={key}
                          className={`rounded-lg border px-3 py-2 text-xs ${
                            question.correctAnswer.toUpperCase() === key
                              ? "border-emerald-300 bg-emerald-50 font-bold text-emerald-800"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <b>{key}.</b> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {detail.exam.isSubmittedForApproval && !detail.exam.isPublished && (
              <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={() => openReject(detail.exam)}
                  disabled={workingId !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => void approve(detail.exam)}
                  disabled={workingId !== null || detail.exam.totalQuestions === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Duyệt & phát hành
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {rejecting && (
        <RejectExamDialog
          examTitle={rejecting.tenBaiKT}
          teacherName={rejecting.giaoVien}
          submitting={workingId === rejecting.id}
          serverError={rejectError}
          onCancel={() => {
            setRejecting(null);
            setRejectError(null);
          }}
          onSubmit={confirmReject}
        />
      )}
    </div>
  );
}
