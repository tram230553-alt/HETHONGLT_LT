import { confirmDialog } from "../services/confirm";
import React from "react";
import {
  CheckCircle2,
  Edit2,
  Eye,
  FileText,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { Exam } from "../types";
import ExamRejectionNotice from "./ExamRejectionNotice";
import ExamQuestionPicker from "./ExamQuestionPicker";
import {
  getTeacherProfile,
  type TeacherProfileDto,
} from "../services/teacherProfileService";
import {
  getMyTeacherQuestions,
  type TeacherQuestionDto,
} from "../services/teacherQuestionService";
import {
  createTeacherExam,
  deleteTeacherExam,
  getMyTeacherExams,
  getTeacherExamDetail,
  submitTeacherExamForApproval,
  type TeacherExamDto,
  updateTeacherExam,
} from "../services/teacherExamService";
import { toast } from "../services/toast";
import { chapterService, type ChapterDto } from "../services/chapterService";
import { getTopics, type TopicDto } from "../services/topicService";
import {
  getClientSystemSettings,
  type ClientSystemSettings,
} from "../services/systemSettingsService";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";

interface Props {
  onUpdateExams: React.Dispatch<React.SetStateAction<Exam[]>>;
}

type ExamSection = "draft" | "rejected" | "pending" | "published" | "all";

type Editor = {
  id?: string;
  tenBaiKT: string;
  thoiLuong: number;
  selectedQuestionIds: string[];
  originalQuestionIds: string[];
};

const EMPTY: Editor = {
  tenBaiKT: "",
  thoiLuong: 45,
  selectedQuestionIds: [],
  originalQuestionIds: [],
};

function toLegacyExam(item: TeacherExamDto, profile: TeacherProfileDto): Exam {
  return {
    id: item.id,
    title: item.tenBaiKT,
    code: item.id.slice(0, 8).toUpperCase(),
    subjectId: profile.subjectId,
    subjectName: profile.tenMH,
    creatorId: profile.id,
    creatorName: profile.hoTen,
    duration: item.thoiLuong,
    totalQuestions: item.totalQuestions,
    totalMarks: item.totalQuestions * 10,
    status: item.isPublished ? "official" : "draft",
    difficulty: "medium",
    createdAt: "",
    attemptsCount: 0,
    passingScore: 50,
    questionsList: [],
  };
}

function getStatus(exam: TeacherExamDto) {
  if (exam.isPublished) {
    return {
      label: "Đã được Admin phát hành",
      className: "bg-emerald-50 text-emerald-700",
      Icon: CheckCircle2,
    };
  }

  if (exam.isSubmittedForApproval) {
    return {
      label: "Đang chờ Admin duyệt",
      className: "bg-amber-50 text-amber-700",
      Icon: Send,
    };
  }

  if (exam.isRejected) {
    return {
      label: "Bị từ chối",
      className: "bg-rose-50 text-rose-700",
      Icon: XCircle,
    };
  }

  return {
    label: "Bản nháp",
    className: "bg-slate-100 text-slate-600",
    Icon: FileText,
  };
}

export default function TeacherExamManagementView({ onUpdateExams }: Props) {
  const [profile, setProfile] = React.useState<TeacherProfileDto | null>(null);
  const [exams, setExams] = React.useState<TeacherExamDto[]>([]);
  const [questions, setQuestions] = React.useState<TeacherQuestionDto[]>([]);
  // Dùng để nhóm câu hỏi theo Chương → Topic khi chọn câu hỏi cho đề.
  const [chapters, setChapters] = React.useState<ChapterDto[]>([]);
  const [topics, setTopics] = React.useState<TopicDto[]>([]);
  const [systemSettings, setSystemSettings] = React.useState<ClientSystemSettings | null>(null);

  // Cấu hình đề thi của Admin (áp dụng bắt buộc). null khi chưa tải được.
  const requiredDuration = systemSettings?.defaultExamDurationMinutes ?? null;
  const requiredCount = systemSettings?.defaultExamQuestionCount ?? null;
  const [search, setSearch] = React.useState("");
  // Giáo viên làm việc chủ yếu với đề chưa gửi, nên mở trang ở Bản nháp.
  const [section, setSection] = React.useState<ExamSection>("draft");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [workingId, setWorkingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const [detail, setDetail] = React.useState<{
    exam: TeacherExamDto;
    questions: TeacherQuestionDto[];
  } | null>(null);

  // Thông báo hiển thị dạng toast cố định phía trên, không bị che bởi hộp thoại.
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
      const [p, e, q, configuration] = await Promise.all([
        getTeacherProfile(),
        getMyTeacherExams(),
        getMyTeacherQuestions(),
        getClientSystemSettings(),
      ]);

      // Chương/Topic chỉ phục vụ việc nhóm; nếu lỗi vẫn chọn được câu hỏi (nhóm "Chưa phân loại").
      const [chapterList, topicList] = await Promise.all([
        chapterService.get(p.subjectId, p.gradeId).catch(() => [] as ChapterDto[]),
        getTopics(p.subjectId, p.gradeId).catch(() => [] as TopicDto[]),
      ]);

      setChapters(chapterList);
      setTopics(topicList);
      setProfile(p);
      setExams(e);
      setQuestions(q);
      setSystemSettings(configuration);
      onUpdateExams(e.map((item) => toLegacyExam(item, p)));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không tải được danh sách đề thi.",
      );
    } finally {
      setLoading(false);
    }
  }, [onUpdateExams]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = React.useMemo(() => {
    const key = search.trim().toLocaleLowerCase("vi");

    return exams.filter((exam) => {
      const matchesSection =
        section === "all" ||
        (section === "draft" && !exam.isPublished && !exam.isSubmittedForApproval && !exam.isRejected) ||
        (section === "rejected" && !exam.isPublished && !exam.isSubmittedForApproval && exam.isRejected) ||
        (section === "pending" && exam.isSubmittedForApproval && !exam.isPublished) ||
        (section === "published" && exam.isPublished);

      if (!matchesSection) return false;
      if (!key) return true;

      return (
        exam.tenBaiKT.toLocaleLowerCase("vi").includes(key) ||
        exam.id.toLowerCase().includes(key)
      );
    });
  }, [exams, search, section]);

  // Phân trang danh sách đề (về trang 1 khi đổi từ khóa/bộ lọc).
  const examPagination = usePagination(filtered, 8, `${search}|${section}`);

  const openEdit = async (exam: TeacherExamDto) => {
    if (exam.isPublished || exam.isSubmittedForApproval) {
      setError(
        exam.isSubmittedForApproval
          ? "Đề đang chờ Admin duyệt nên không thể chỉnh sửa."
          : "Đề đã được Admin phát hành nên không thể chỉnh sửa.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const detailResult = await getTeacherExamDetail(exam.id);
      const ids = detailResult.questions.map((question) => question.id);

      setEditor({
        id: detailResult.id,
        tenBaiKT: detailResult.tenBaiKT,
        thoiLuong: detailResult.thoiLuong,
        selectedQuestionIds: ids,
        originalQuestionIds: ids,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được chi tiết đề.");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (exam: TeacherExamDto) => {
    setSaving(true);
    setError(null);

    try {
      const detailResult = await getTeacherExamDetail(exam.id);
      setDetail({
        exam: {
          ...exam,
          tenBaiKT: detailResult.tenBaiKT,
          thoiLuong: detailResult.thoiLuong,
          isSubmittedForApproval: detailResult.isSubmittedForApproval,
          isPublished: detailResult.isPublished,
          isRejected: detailResult.isRejected,
          rejectionReasonCodes: detailResult.rejectionReasonCodes,
          rejectionReasons: detailResult.rejectionReasons,
          rejectionNote: detailResult.rejectionNote,
          rejectedAt: detailResult.rejectedAt,
          totalQuestions: detailResult.questions.length,
        },
        questions: detailResult.questions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được chi tiết đề.");
    } finally {
      setSaving(false);
    }
  };

  const saveExam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;

    if (!editor.tenBaiKT.trim()) {
      setError("Vui lòng nhập tên bài kiểm tra.");
      return;
    }

    // Cấu hình của Admin áp dụng bắt buộc: thời lượng luôn theo cấu hình, số câu phải đúng.
    const duration = requiredDuration ?? Number(editor.thoiLuong);

    if (requiredDuration === null && (duration < 1 || duration > 300)) {
      setError("Thời lượng phải từ 1 đến 300 phút.");
      return;
    }

    if (editor.selectedQuestionIds.length === 0) {
      setError("Vui lòng chọn câu hỏi cho đề thi.");
      return;
    }

    if (requiredCount !== null && editor.selectedQuestionIds.length !== requiredCount) {
      setError(
        `Đề thi phải có đúng ${requiredCount} câu hỏi theo cấu hình của Admin ` +
          `(bạn đang chọn ${editor.selectedQuestionIds.length} câu).`,
      );
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = {
        tenBaiKT: editor.tenBaiKT.trim(),
        thoiLuong: duration,
        // Đề và danh sách câu hỏi được lưu cùng lúc: hoặc đủ hoặc không lưu gì.
        questionIds: editor.selectedQuestionIds,
      };

      if (!editor.id) {
        await createTeacherExam(data);

        setMessage(
          `Đã tạo đề thi “${data.tenBaiKT}” (${data.questionIds.length} câu, ${data.thoiLuong} phút). ` +
            "Hãy kiểm tra lại rồi bấm “Gửi Admin duyệt”.",
        );
        setSection("draft");
      } else {
        await updateTeacherExam(editor.id, data);

        const wasRejected = exams.some(
          (item) => item.id === editor.id && item.isRejected,
        );

        setMessage(
          wasRejected
            ? "Đã cập nhật đề thi. Bấm “Gửi lại Admin duyệt” để Admin xem xét lại."
            : "Đã cập nhật đề thi thành công.",
        );
        setSection(wasRejected ? "rejected" : "draft");
      }

      setEditor(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu đề thi.");
    } finally {
      setSaving(false);
    }
  };

  const submitForApproval = async (exam: TeacherExamDto) => {
    if (requiredCount !== null && exam.totalQuestions !== requiredCount) {
      setError(
        `Đề thi phải có đúng ${requiredCount} câu hỏi theo cấu hình của Admin ` +
          `(hiện có ${exam.totalQuestions} câu). Hãy bấm “Sửa” để chỉnh lại trước khi gửi duyệt.`,
      );
      return;
    }

    if (requiredDuration !== null && exam.thoiLuong !== requiredDuration) {
      setError(
        `Thời lượng đề thi phải đúng ${requiredDuration} phút theo cấu hình của Admin ` +
          `(hiện là ${exam.thoiLuong} phút). Hãy bấm “Sửa” và lưu lại để cập nhật.`,
      );
      return;
    }

    if (exam.totalQuestions === 0) {
      setError("Đề phải có ít nhất một câu hỏi trước khi gửi duyệt.");
      return;
    }

    if (
      !(await confirmDialog({
        title: "Gửi duyệt đề thi",
        message: exam.isRejected
          ? `Gửi lại đề "${exam.tenBaiKT}" cho Admin duyệt? Hãy chắc chắn bạn đã chỉnh sửa theo lý do bị từ chối.`
          : `Gửi đề "${exam.tenBaiKT}" cho Admin duyệt?`,
        confirmText: "Gửi duyệt",
      }))
    ) {
      return;
    }

    setWorkingId(exam.id);
    setError(null);
    setMessage(null);

    try {
      const result = await submitTeacherExamForApproval(exam.id);
      setMessage(result || "Đã gửi đề thi cho Admin duyệt.");
      setSection("pending");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi đề cho Admin duyệt.");
    } finally {
      setWorkingId(null);
    }
  };

  const remove = async (exam: TeacherExamDto) => {
    if (exam.isPublished || exam.isSubmittedForApproval) {
      setError(
        exam.isSubmittedForApproval
          ? "Đề đang chờ Admin duyệt nên không thể xóa."
          : "Đề đã được Admin phát hành nên không thể xóa.",
      );
      return;
    }

    if (
      !(await confirmDialog({
        title: "Xóa đề thi",
        message: `Xóa đề "${exam.tenBaiKT}"?`,
        confirmText: "Xóa",
        tone: "danger",
      }))
    ) {
      return;
    }

    setWorkingId(exam.id);
    setError(null);
    setMessage(null);

    try {
      await deleteTeacherExam(exam.id);
      setMessage("Đã xóa đề thi.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa đề.");
    } finally {
      setWorkingId(null);
    }
  };

  const draftCount = exams.filter(
    (x) => !x.isPublished && !x.isSubmittedForApproval && !x.isRejected,
  ).length;
  const rejectedCount = exams.filter(
    (x) => !x.isPublished && !x.isSubmittedForApproval && x.isRejected,
  ).length;
  const pendingCount = exams.filter(
    (x) => x.isSubmittedForApproval && !x.isPublished,
  ).length;
  const publishedCount = exams.filter((x) => x.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Quản lý đề thi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tạo đề → chọn câu hỏi → gửi Admin duyệt → Admin phát hành hoặc từ chối kèm lý do để bạn chỉnh sửa và gửi lại.
          </p>
          {profile && (
            <p className="mt-1 text-xs font-bold text-indigo-600">
              {profile.tenMH} • {profile.tenKhoi}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading || saving || workingId !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => {
              setEditor({
                ...EMPTY,
                thoiLuong: systemSettings?.defaultExamDurationMinutes ?? EMPTY.thoiLuong,
                selectedQuestionIds: [],
              });
              setError(null);
              setMessage(null);
            }}
            disabled={saving || workingId !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Tạo đề mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => setSection("draft")}
          className={`rounded-2xl border p-4 text-left transition ${
            section === "draft"
              ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
              : "border-slate-200 bg-slate-50 hover:border-indigo-200"
          }`}
        >
          <p className="text-xs font-bold text-slate-500">BẢN NHÁP</p>
          <p className="text-2xl font-black text-slate-700">{draftCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            Được phép sửa, xóa và gửi duyệt
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSection("rejected")}
          className={`rounded-2xl border p-4 text-left transition ${
            section === "rejected"
              ? "border-rose-300 bg-rose-50 ring-2 ring-rose-100"
              : "border-rose-200 bg-rose-50/60 hover:border-rose-300"
          }`}
        >
          <p className="text-xs font-bold text-rose-600">BỊ TỪ CHỐI</p>
          <p className="text-2xl font-black text-rose-700">{rejectedCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-rose-600/70">
            Xem lý do, chỉnh sửa và gửi lại
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSection("pending")}
          className={`rounded-2xl border p-4 text-left transition ${
            section === "pending"
              ? "border-amber-300 bg-amber-50 ring-2 ring-amber-100"
              : "border-amber-200 bg-amber-50/60 hover:border-amber-300"
          }`}
        >
          <p className="text-xs font-bold text-amber-600">CHỜ ADMIN DUYỆT</p>
          <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-amber-600/70">
            Tạm khóa sửa và xóa
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSection("published")}
          className={`rounded-2xl border p-4 text-left transition ${
            section === "published"
              ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
              : "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
          }`}
        >
          <p className="text-xs font-bold text-emerald-600">ĐÃ PHÁT HÀNH</p>
          <p className="text-2xl font-black text-emerald-700">{publishedCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-600/70">
            Học sinh có thể làm bài
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSection("all")}
          className={`rounded-2xl border p-4 text-left transition ${
            section === "all"
              ? "border-slate-400 bg-white ring-2 ring-slate-100"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-xs font-bold text-slate-400">TẤT CẢ</p>
          <p className="text-2xl font-black text-slate-800">{exams.length}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            Toàn bộ đề của giáo viên
          </p>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-black text-slate-800">
            {section === "draft" && "Bản nháp"}
            {section === "rejected" && "Đề bị Admin từ chối"}
            {section === "pending" && "Đang chờ Admin duyệt"}
            {section === "published" && "Đề đã phát hành"}
            {section === "all" && "Tất cả đề thi"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {section === "draft" &&
              "Giáo viên có thể sửa, thêm/bớt câu hỏi, xóa hoặc gửi Admin duyệt."}
            {section === "rejected" &&
              "Xem lý do từ chối, chỉnh sửa đề rồi gửi lại Admin phê duyệt."}
            {section === "pending" &&
              "Đề đã gửi Admin và tạm thời không thể chỉnh sửa hoặc xóa."}
            {section === "published" &&
              "Các đề đang hiển thị cho học sinh đúng khối."}
            {section === "all" && "Xem toàn bộ trạng thái đề thi của bạn."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {filtered.length} đề
        </span>
      </div>

      <div className="relative rounded-2xl border border-slate-200 bg-white p-4">
        <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên đề hoặc mã đề..."
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-300"
        />
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
          <p className="mt-2 font-bold">
            {section === "draft"
              ? "Chưa có bản nháp"
              : section === "rejected"
                ? "Không có đề nào bị từ chối"
                : section === "pending"
                ? "Chưa có đề đang chờ duyệt"
              : section === "published"
                  ? "Chưa có đề đã phát hành"
                  : "Chưa có đề thi phù hợp"}
          </p>
          {section === "draft" && (
            <p className="mt-1 text-xs text-slate-400">
              Nhấn “Tạo đề mới” để tạo và lưu một bản nháp.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {examPagination.pageItems.map((exam) => {
            const status = getStatus(exam);
            const StatusIcon = status.Icon;
            const editable = !exam.isPublished && !exam.isSubmittedForApproval;
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
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-black text-slate-800">
                      {exam.tenBaiKT}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                      <span>⏱ {exam.thoiLuong} phút</span>
                      <span>🧩 {exam.totalQuestions} câu</span>
                    </div>

                    {editable &&
                      requiredCount !== null &&
                      requiredDuration !== null &&
                      (exam.totalQuestions !== requiredCount || exam.thoiLuong !== requiredDuration) && (
                        <p className="mt-2 text-xs font-bold text-amber-700">
                          ⚠ Chưa đúng cấu hình của Admin ({requiredCount} câu, {requiredDuration} phút).
                          Bấm “Sửa” để chỉnh lại trước khi gửi duyệt.
                        </p>
                      )}

                    {exam.isRejected && editable && (
                      <div className="mt-3">
                        <ExamRejectionNotice
                          reasons={exam.rejectionReasons}
                          note={exam.rejectionNote}
                          rejectedAt={exam.rejectedAt}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void openDetail(exam)}
                      disabled={saving || workingId !== null}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                    >
                      <Eye className="h-4 w-4" />
                      Xem
                    </button>

                    {editable && (
                      <button
                        type="button"
                        onClick={() => void openEdit(exam)}
                        disabled={saving || workingId !== null}
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-50"
                      >
                        <Edit2 className="h-4 w-4" />
                        Sửa
                      </button>
                    )}

                    {editable && (
                      <button
                        type="button"
                        onClick={() => void submitForApproval(exam)}
                        disabled={
                          busy ||
                          workingId !== null ||
                          exam.totalQuestions === 0
                        }
                        title={
                          exam.totalQuestions === 0
                            ? "Đề chưa có câu hỏi"
                            : "Gửi đề cho Admin duyệt"
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {exam.isRejected ? "Gửi lại Admin duyệt" : "Gửi Admin duyệt"}
                      </button>
                    )}

                    {editable && (
                      <button
                        type="button"
                        onClick={() => void remove(exam)}
                        disabled={busy || workingId !== null}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                {editable && exam.totalQuestions === 0 && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                    <HelpCircle className="h-4 w-4" />
                    Hãy thêm ít nhất một câu hỏi trước khi gửi Admin duyệt.
                  </div>
                )}
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

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={saveExam}
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {editor.id ? "Sửa đề thi" : "Tạo đề thi"}
                </h3>
                <p className="text-xs text-slate-500">
                  Chọn câu hỏi rồi lưu. Sau đó gửi đề cho Admin duyệt.
                </p>
              </div>
              <button type="button" onClick={() => setEditor(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {requiredCount !== null && requiredDuration !== null && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-semibold leading-5 text-indigo-800">
                  Theo cấu hình của Admin, mỗi đề thi phải có thời lượng{" "}
                  <b>{requiredDuration} phút</b> và đúng <b>{requiredCount} câu hỏi</b>.
                  Đề không đúng cấu hình sẽ không được lưu.
                  {questions.length < requiredCount && (
                    <span className="mt-1 block text-rose-700">
                      Ngân hàng của bạn mới có {questions.length} câu, cần thêm{" "}
                      {requiredCount - questions.length} câu hỏi nữa mới tạo được đề.
                    </span>
                  )}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                >
                  {error}
                </div>
              )}

              {editor.id &&
                (() => {
                  const rejected = exams.find(
                    (item) => item.id === editor.id && item.isRejected,
                  );

                  return rejected ? (
                    <ExamRejectionNotice
                      reasons={rejected.rejectionReasons}
                      note={rejected.rejectionNote}
                      rejectedAt={rejected.rejectedAt}
                    />
                  ) : null;
                })()}

              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-600">Tên bài kiểm tra</span>
                  <input
                    value={editor.tenBaiKT}
                    onChange={(event) =>
                      setEditor({ ...editor, tenBaiKT: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-600">
                    Thời lượng (phút)
                    {requiredDuration !== null && (
                      <span className="ml-1 font-semibold text-slate-400">• cố định theo cấu hình</span>
                    )}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={requiredDuration ?? editor.thoiLuong}
                    readOnly={requiredDuration !== null}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        thoiLuong: Number(event.target.value),
                      })
                    }
                    className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 ${
                      requiredDuration !== null ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""
                    }`}
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-800">
                      Chọn câu hỏi
                      {(() => {
                        const picked = editor.selectedQuestionIds.length;
                        const ok = requiredCount === null ? picked > 0 : picked === requiredCount;
                        const diff = requiredCount === null ? 0 : requiredCount - picked;

                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                              ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            Đã chọn {picked}
                            {requiredCount !== null ? `/${requiredCount}` : ""} câu
                            {requiredCount !== null && diff > 0 ? ` • cần thêm ${diff}` : ""}
                            {requiredCount !== null && diff < 0 ? ` • dư ${-diff}` : ""}
                          </span>
                        );
                      })()}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Chọn theo Chương → Topic hoặc tick cả nhóm.
                    </p>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
                    Ngân hàng câu hỏi đang trống. Hãy tạo câu hỏi trước.
                  </div>
                ) : (
                  <ExamQuestionPicker
                    khoiName={profile?.tenKhoi ?? ""}
                    monName={profile?.tenMH ?? ""}
                    chapters={chapters}
                    topics={topics}
                    questions={questions}
                    selectedIds={editor.selectedQuestionIds}
                    onChange={(ids) =>
                      setEditor({ ...editor, selectedQuestionIds: ids })
                    }
                  />
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={
                  saving ||
                  questions.length === 0 ||
                  (requiredCount !== null && editor.selectedQuestionIds.length !== requiredCount)
                }
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu đề thi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h3 className="text-lg font-black">{detail.exam.tenBaiKT}</h3>
                <p className="text-xs text-slate-500">
                  {detail.exam.thoiLuong} phút • {detail.questions.length} câu
                </p>
              </div>
              <button type="button" onClick={() => setDetail(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6">
              {detail.exam.isRejected &&
                !detail.exam.isPublished &&
                !detail.exam.isSubmittedForApproval && (
                  <ExamRejectionNotice
                    reasons={detail.exam.rejectionReasons}
                    note={detail.exam.rejectionNote}
                    rejectedAt={detail.exam.rejectedAt}
                  />
                )}

              {detail.questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border p-4">
                  <p className="text-xs font-bold text-slate-400">Câu {index + 1}</p>
                  <p className="mt-1 text-sm font-black">{question.noiDung}</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
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
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200"
                        }`}
                      >
                        <b>{key}.</b> {value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
