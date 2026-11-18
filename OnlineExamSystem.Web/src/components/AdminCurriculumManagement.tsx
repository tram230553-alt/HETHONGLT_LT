import { confirmDialog } from "../services/confirm";
import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    AlertTriangle,
    BookOpen,
    ChevronDown,
    ChevronRight,
    Edit2,
    FolderTree,
    Plus,
    Search,
    Trash2,
    X,
    Save,
    RefreshCw,
} from "lucide-react";

import {
    chapterService,
    type ChapterDto,
} from "../services/chapterService";

import {
    topicService,
    type TopicDto,
    type CreateTopicRequest,
    type UpdateTopicRequest,
} from "../services/topicService";

import TopicFormModal from "./AdminTopicFormModal";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";

type Option = { id: string; name: string };

interface Props {
    subjects: Option[];
    grades: Option[];
}

export default function AdminCurriculumManagement({
    subjects,
    grades,
}: Props) {
    const [gradeId, setGradeId] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [search, setSearch] = useState("");

    const [chapters, setChapters] = useState<ChapterDto[]>([]);
    const [topics, setTopics] = useState<TopicDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [chapterModalOpen, setChapterModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<ChapterDto | null>(null);
    const [chapterName, setChapterName] = useState("");
    const [chapterOrder, setChapterOrder] = useState(1);
    const [savingChapter, setSavingChapter] = useState(false);
    const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
    // Chương không được phép xóa vì đang có Topic: hiện cảnh báo thay vì hộp xác nhận.
    const [blockedChapter, setBlockedChapter] = useState<ChapterDto | null>(null);

    const [topicModalOpen, setTopicModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<TopicDto | null>(null);
    const [presetChapterId, setPresetChapterId] = useState("");
    const [savingTopic, setSavingTopic] = useState(false);
    const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

    const [collapsedChapterIds, setCollapsedChapterIds] =
        useState<Set<string>>(new Set());

    const selectedGrade = useMemo(
        () => grades.find(x => x.id === gradeId) ?? null,
        [grades, gradeId],
    );

    const selectedSubject = useMemo(
        () => subjects.find(x => x.id === subjectId) ?? null,
        [subjects, subjectId],
    );

    const hasContext = Boolean(gradeId && subjectId);

    const loadData = async () => {
        if (!hasContext) {
            setChapters([]);
            setTopics([]);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const [chapterData, topicData] = await Promise.all([
                chapterService.get(),
                topicService.getTopics(subjectId, gradeId),
            ]);

            setChapters(
                (Array.isArray(chapterData) ? chapterData : [])
                    .filter(
                        chapter =>
                            chapter.subjectId === subjectId &&
                            chapter.gradeId === gradeId,
                    )
                    .sort(
                        (a, b) =>
                            a.order - b.order ||
                            a.name.localeCompare(b.name, "vi"),
                    ),
            );

            setTopics(Array.isArray(topicData) ? topicData : []);
        } catch (err) {
            setChapters([]);
            setTopics([]);
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải dữ liệu Chương và Topic.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [gradeId, subjectId]);

    const visibleChapters = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return chapters;

        return chapters.filter(chapter => {
            const chapterMatched =
                chapter.name.toLowerCase().includes(keyword) ||
                `chương ${chapter.order}`.includes(keyword);

            const topicMatched = topics.some(
                topic =>
                    topic.chapterId === chapter.id &&
                    (
                        topic.name.toLowerCase().includes(keyword) ||
                        (topic.description?.toLowerCase().includes(keyword) ?? false)
                    ),
            );

            return chapterMatched || topicMatched;
        });
    }, [chapters, topics, search]);

    // Phân trang danh sách chương (mỗi chương kèm nhiều chuyên đề nên chỉ hiện 5 chương/trang).
    const chapterPagination = usePagination(
        visibleChapters,
        5,
        `${gradeId}|${subjectId}|${search}`,
    );

    const getTopicsByChapter = (chapterId: string) => {
        const keyword = search.trim().toLowerCase();

        return topics
            .filter(topic => topic.chapterId === chapterId)
            .filter(topic => {
                if (!keyword) return true;

                const chapter = chapters.find(x => x.id === chapterId);
                const chapterMatched = chapter
                    ? (
                        chapter.name.toLowerCase().includes(keyword) ||
                        `chương ${chapter.order}`.includes(keyword)
                    )
                    : false;

                if (chapterMatched) return true;

                return (
                    topic.name.toLowerCase().includes(keyword) ||
                    (topic.description?.toLowerCase().includes(keyword) ?? false)
                );
            })
            .sort(
                (a, b) =>
                    (a.orderNum ?? 9999) - (b.orderNum ?? 9999) ||
                    a.name.localeCompare(b.name, "vi"),
            );
    };

    const openCreateChapter = () => {
        if (!hasContext) {
            setError("Vui lòng chọn Khối và Môn học trước.");
            return;
        }

        setEditingChapter(null);
        setChapterName("");
        setChapterOrder(
            chapters.length > 0
                ? Math.max(...chapters.map(x => x.order)) + 1
                : 1,
        );
        setChapterModalOpen(true);
    };

    const openEditChapter = (chapter: ChapterDto) => {
        setEditingChapter(chapter);
        setChapterName(chapter.name);
        setChapterOrder(chapter.order);
        setChapterModalOpen(true);
    };

    const closeChapterModal = () => {
        if (savingChapter) return;
        setChapterModalOpen(false);
        setEditingChapter(null);
        setChapterName("");
        setChapterOrder(1);
    };

    const saveChapter = async (event: FormEvent) => {
        event.preventDefault();

        if (
            !chapterName.trim() ||
            !subjectId ||
            !gradeId ||
            !Number.isInteger(chapterOrder) ||
            chapterOrder < 1
        ) {
            setError("Vui lòng nhập đầy đủ thông tin Chương.");
            return;
        }

        try {
            setSavingChapter(true);
            setError("");

            const data = {
                name: chapterName.trim(),
                order: chapterOrder,
                subjectId,
                gradeId,
            };

            if (editingChapter) {
                await chapterService.update(editingChapter.id, data);
            } else {
                await chapterService.create(data);
            }

            closeChapterModal();
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể lưu Chương.",
            );
        } finally {
            setSavingChapter(false);
        }
    };

    const deleteChapter = async (chapter: ChapterDto) => {
        const hasTopics =
            chapter.topicCount > 0 ||
            topics.some(topic => topic.chapterId === chapter.id);

        if (hasTopics) {
            setBlockedChapter(chapter);
            return;
        }

        if (
            !(await confirmDialog({
                title: "Xóa chương",
                message: `Xóa Chương ${chapter.order}: ${chapter.name}?`,
                confirmText: "Xóa",
                tone: "danger",
            }))
        ) {
            return;
        }

        try {
            setDeletingChapterId(chapter.id);
            setError("");
            await chapterService.delete(chapter.id);
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa Chương vì đang có dữ liệu liên quan.",
            );
        } finally {
            setDeletingChapterId(null);
        }
    };

    const openCreateTopic = (chapter: ChapterDto) => {
        setEditingTopic(null);
        setPresetChapterId(chapter.id);
        setTopicModalOpen(true);
    };

    const openEditTopic = (topic: TopicDto) => {
        setEditingTopic(topic);
        setPresetChapterId(topic.chapterId ?? "");
        setTopicModalOpen(true);
    };

    const saveTopic = async (
        data: CreateTopicRequest | UpdateTopicRequest,
    ) => {
        try {
            setSavingTopic(true);
            setError("");

            if (editingTopic) {
                await topicService.updateTopic(
                    editingTopic.id,
                    data as UpdateTopicRequest,
                );
            } else {
                await topicService.createTopic(
                    data as CreateTopicRequest,
                );
            }

            setTopicModalOpen(false);
            setEditingTopic(null);
            setPresetChapterId("");
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể lưu Topic.",
            );
            throw err;
        } finally {
            setSavingTopic(false);
        }
    };

    const deleteTopic = async (topic: TopicDto) => {
        if (
            !(await confirmDialog({
                title: "Xóa chuyên đề",
                message: `Bạn có chắc muốn xóa Topic "${topic.name}"?`,
                confirmText: "Xóa",
                tone: "danger",
            }))
        ) {
            return;
        }

        try {
            setDeletingTopicId(topic.id);
            setError("");
            await topicService.deleteTopic(topic.id);
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa Topic.",
            );
        } finally {
            setDeletingTopicId(null);
        }
    };

    const toggleChapter = (id: string) => {
        setCollapsedChapterIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="min-h-full bg-slate-50 p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">
                        Quản lý chương & chủ đề
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Tổ chức nội dung theo Khối → Môn học → Chương → Topic.
                    </p>
                </div>

                {hasContext && (
                    <button
                        type="button"
                        onClick={openCreateChapter}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus size={17} />
                        Thêm chương
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                </div>
            )}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-600">
                    <FolderTree size={18} className="text-indigo-600" />
                    Chọn phạm vi quản lý
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">1</span>
                            <label className="text-sm font-bold text-slate-700">Khối lớp</label>
                        </div>
                        <select
                            value={gradeId}
                            onChange={e => {
                                setGradeId(e.target.value);
                                setSubjectId("");
                                setSearch("");
                                setError("");
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        >
                            <option value="">Chọn Khối</option>
                            {grades.map(grade => (
                                <option key={grade.id} value={grade.id}>
                                    {grade.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">2</span>
                            <label className="text-sm font-bold text-slate-700">Môn học</label>
                        </div>
                        <select
                            value={subjectId}
                            disabled={!gradeId}
                            onChange={e => {
                                setSubjectId(e.target.value);
                                setSearch("");
                                setError("");
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            <option value="">
                                {gradeId ? "Chọn Môn học" : "Chọn Khối trước"}
                            </option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {!hasContext ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <BookOpen size={26} />
                    </div>
                    <h2 className="mt-4 text-base font-black text-slate-800">
                        Chọn Khối và Môn học
                    </h2>
                    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                        Sau khi chọn đủ hai mục, hệ thống sẽ hiển thị danh sách Chương và Topic tương ứng.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-indigo-500">
                                Đang quản lý
                            </p>
                            <p className="mt-1 font-black text-slate-900">
                                {selectedGrade?.name} › {selectedSubject?.name}
                            </p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-indigo-100">
                            {chapters.length} Chương · {topics.length} Topic
                        </span>
                    </div>

                    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm Chương hoặc Topic..."
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                            <RefreshCw size={26} className="mx-auto animate-spin text-indigo-500" />
                            <p className="mt-3 text-sm font-medium text-slate-500">
                                Đang tải Chương và Topic...
                            </p>
                        </div>
                    ) : visibleChapters.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                            <BookOpen size={40} className="mx-auto text-slate-300" />
                            <p className="mt-3 font-black text-slate-700">
                                {search.trim() ? "Không tìm thấy kết quả" : "Chưa có Chương"}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                {search.trim()
                                    ? "Thử tìm bằng tên Chương hoặc Topic khác."
                                    : "Hãy tạo Chương đầu tiên cho Khối và Môn học này."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {chapterPagination.pageItems.map(chapter => {
                                const chapterTopics = getTopicsByChapter(chapter.id);
                                const collapsed = collapsedChapterIds.has(chapter.id);

                                return (
                                    <section
                                        key={chapter.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                            <button
                                                type="button"
                                                onClick={() => toggleChapter(chapter.id)}
                                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-black text-amber-600">
                                                    {chapter.order}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                                                        Chương {chapter.order}
                                                    </p>
                                                    <h2 className="mt-0.5 truncate text-base font-black text-slate-900">
                                                        {chapter.name}
                                                    </h2>
                                                </div>
                                            </button>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                                                    {chapterTopics.length} Topic
                                                </span>
                                                <button
                                                    type="button"
                                                    title="Sửa Chương"
                                                    onClick={() => openEditChapter(chapter)}
                                                    className="rounded-lg border border-slate-200 bg-white p-2 text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    title={
                                                        chapterTopics.length > 0 || chapter.topicCount > 0
                                                            ? "Chương đang có Topic nên không thể xóa"
                                                            : "Xóa Chương"
                                                    }
                                                    disabled={deletingChapterId === chapter.id}
                                                    onClick={() => void deleteChapter(chapter)}
                                                    className="rounded-lg border border-red-100 bg-white p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleChapter(chapter.id)}
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                                                >
                                                    {collapsed
                                                        ? <ChevronRight size={18} />
                                                        : <ChevronDown size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {!collapsed && (
                                            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                                                {chapterTopics.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                                                        <p className="text-sm font-semibold text-slate-500">
                                                            Chương này chưa có Topic.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                        {chapterTopics.map((topic, index) => (
                                                            <div
                                                                key={topic.id}
                                                                className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                                                                    index > 0 ? "border-t border-slate-100" : ""
                                                                }`}
                                                            >
                                                                <div className="flex min-w-0 items-start gap-3">
                                                                    <div className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 px-2 text-xs font-black text-indigo-600">
                                                                        {String(topic.orderNum ?? index + 1).padStart(2, "0")}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold text-slate-800">
                                                                            {topic.name}
                                                                        </p>
                                                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                                            {topic.description && (
                                                                                <span className="max-w-xl truncate">
                                                                                    {topic.description}
                                                                                </span>
                                                                            )}
                                                                            <span>{topic.questionCount ?? 0} câu hỏi</span>
                                                                            <span className={
                                                                                topic.isActive
                                                                                    ? "font-bold text-emerald-600"
                                                                                    : "font-bold text-slate-400"
                                                                            }>
                                                                                {topic.isActive ? "Hoạt động" : "Tạm ngưng"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditTopic(topic)}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                        Sửa
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        disabled={deletingTopicId === topic.id}
                                                                        onClick={() => void deleteTopic(topic)}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        {deletingTopicId === topic.id ? "Đang xóa..." : "Xóa"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => openCreateTopic(chapter)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
                                                    >
                                                        <Plus size={16} />
                                                        Thêm Topic
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                );
                            })}

                            <Pagination
                                page={chapterPagination.page}
                                pageSize={chapterPagination.pageSize}
                                total={chapterPagination.total}
                                onPageChange={chapterPagination.setPage}
                                itemLabel="chương"
                            />
                        </div>
                    )}
                </>
            )}

            {blockedChapter && (() => {
                const blockedTopics = topics
                    .filter(topic => topic.chapterId === blockedChapter.id)
                    .sort((a, b) => a.orderNum - b.orderNum);
                const topicTotal = Math.max(
                    blockedChapter.topicCount,
                    blockedTopics.length,
                );
                const questionTotal = blockedTopics.reduce(
                    (sum, topic) => sum + (topic.questionCount ?? 0),
                    0,
                );

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                        <div
                            role="alertdialog"
                            aria-modal="true"
                            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
                        >
                            <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                    <AlertTriangle size={22} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-black text-slate-900">
                                        Không thể xóa Chương
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Chương {blockedChapter.order}: {blockedChapter.name}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setBlockedChapter(null)}
                                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                                    aria-label="Đóng"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <p className="text-sm leading-relaxed text-slate-600">
                                    Chương này đang có{" "}
                                    <span className="font-black text-slate-900">{topicTotal} Topic</span>
                                    {questionTotal > 0 && (
                                        <>
                                            {" "}với tổng{" "}
                                            <span className="font-black text-slate-900">{questionTotal} câu hỏi</span>
                                        </>
                                    )}
                                    . Hệ thống không cho xóa Chương đang có dữ liệu liên quan để tránh mất nội dung học tập và lịch sử luyện tập của học sinh.
                                </p>

                                {blockedTopics.length > 0 && (
                                    <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200">
                                        {blockedTopics.map(topic => (
                                            <li
                                                key={topic.id}
                                                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                                            >
                                                <span className="truncate font-semibold text-slate-700">
                                                    {topic.name}
                                                </span>
                                                <span className="shrink-0 text-xs font-bold text-slate-400">
                                                    {topic.questionCount ?? 0} câu hỏi
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                                    Muốn xóa Chương, hãy chuyển các Topic sang chương khác (Sửa Topic → chọn chương) hoặc xóa các Topic trước. Topic đang có câu hỏi cũng cần được xử lý trước.
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setBlockedChapter(null)}
                                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
                                    >
                                        Đã hiểu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {chapterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">
                                    {editingChapter ? "Sửa Chương" : "Thêm Chương"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedGrade?.name} · {selectedSubject?.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeChapterModal}
                                disabled={savingChapter}
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={saveChapter} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Tên Chương <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={chapterName}
                                    onChange={e => setChapterName(e.target.value)}
                                    maxLength={200}
                                    placeholder="Ví dụ: Ứng dụng đạo hàm"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Thứ tự Chương <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={chapterOrder}
                                    onChange={e => setChapterOrder(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={closeChapterModal}
                                    disabled={savingChapter}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingChapter}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {savingChapter
                                        ? <RefreshCw size={16} className="animate-spin" />
                                        : <Save size={16} />}
                                    {savingChapter
                                        ? "Đang lưu..."
                                        : editingChapter
                                            ? "Lưu thay đổi"
                                            : "Thêm Chương"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <TopicFormModal
                open={topicModalOpen}
                topic={editingTopic}
                subjects={subjects}
                grades={grades}
                loading={savingTopic}
                presetSubjectId={subjectId}
                presetGradeId={gradeId}
                presetChapterId={presetChapterId}
                lockContext={true}
                onClose={() => {
                    if (savingTopic) return;
                    setTopicModalOpen(false);
                    setEditingTopic(null);
                    setPresetChapterId("");
                }}
                onSubmit={saveTopic}
            />
        </div>
    );
}