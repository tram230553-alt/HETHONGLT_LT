import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Eye, EyeOff, Info, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import {
  getAiTopics,
  generateAiQuestions,
  saveAiQuestion,
  type AiTopic,
  type AiDraftQuestion,
} from '../services/learningAiService';
import {
  createTeacherExam,
  submitTeacherExamForApproval,
} from '../services/teacherExamService';
import { getClientSystemSettings, type ClientSystemSettings } from '../services/systemSettingsService';
import { confirmDialog } from '../services/confirm';
import { toast } from '../services/toast';

/* =====================================================
   MỨC ĐỘ: dùng đúng 3 mức độ khó đang có trong hệ thống
===================================================== */

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: { key: Difficulty; label: string; badge: string }[] = [
  { key: 'easy', label: 'Dễ', badge: 'bg-emerald-50 text-emerald-700' },
  { key: 'medium', label: 'Trung bình', badge: 'bg-amber-50 text-amber-700' },
  { key: 'hard', label: 'Khó', badge: 'bg-rose-50 text-rose-700' },
];

const DIFFICULTY_META = Object.fromEntries(DIFFICULTIES.map((item) => [item.key, item])) as Record<
  Difficulty,
  (typeof DIFFICULTIES)[number]
>;

// Số câu AI tạo tối đa trong một lần gọi (giới hạn của backend).
const MAX_PER_AI_CALL = 10;

// Tối đa 700 ký tự cho yêu cầu của giáo viên để còn chỗ cho phần nhắc "tạo câu khác" (backend giới hạn 1000).
const MAX_REQUIREMENT_LENGTH = 700;

function lowerFirst(text: string) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/* =====================================================
   CÂU HỎI NHÁP
===================================================== */

interface DraftItem {
  key: string;
  difficulty: Difficulty;
  question: AiDraftQuestion;
  // Id câu hỏi trong ngân hàng sau khi lưu bản nháp (giữ lại để lưu lại không bị trùng).
  savedId?: string;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

const optionOf = (question: AiDraftQuestion, key: (typeof OPTION_KEYS)[number]) =>
  ({
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  })[key];

const blankQuestion = (): AiDraftQuestion => ({
  noiDung: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: '',
});

// Câu hỏi hợp lệ: đủ nội dung, bốn lựa chọn khác nhau và đáp án A/B/C/D.
function isValidQuestion(question: AiDraftQuestion) {
  return (
    Object.values(question).every((value) => value.trim()) &&
    ['A', 'B', 'C', 'D'].includes(question.correctAnswer) &&
    new Set(
      [question.optionA, question.optionB, question.optionC, question.optionD].map((value) =>
        value.trim().toLowerCase(),
      ),
    ).size === 4
  );
}

let draftCounter = 0;
const nextKey = () => `draft-${Date.now()}-${draftCounter++}`;

const snapshot = (list: DraftItem[]) =>
  JSON.stringify(list.map((item) => [item.key, item.difficulty, item.question]));

type BusyState = null | 'generate' | 'regenerate' | 'add' | 'save' | 'submit';

export default function TeacherAiQuestionsView() {
  const [topics, setTopics] = useState<AiTopic[]>([]);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [chapterName, setChapterName] = useState('');
  const [topicId, setTopicId] = useState('');

  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Cấu hình đề thi của Admin (bắt buộc): thời lượng cố định và đúng số câu.
  const [config, setConfig] = useState<ClientSystemSettings | null>(null);
  const duration = config?.defaultExamDurationMinutes ?? 45;
  const totalQuestions = config?.defaultExamQuestionCount ?? 10;

  const [requirements, setRequirements] = useState('');
  const [requirementsTouched, setRequirementsTouched] = useState(false);

  const [items, setItems] = useState<DraftItem[]>([]);
  // Đã có đề xem trước (giữ khung xem trước kể cả khi xóa hết câu để còn thêm lại).
  const [hasDraft, setHasDraft] = useState(false);
  // Chế độ chỉnh sửa: mở tất cả câu hỏi cùng lúc, sửa xong lưu một lần.
  const [editMode, setEditMode] = useState(false);
  const [buffer, setBuffer] = useState<DraftItem[]>([]);
  const [showInvalid, setShowInvalid] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [addDifficulty, setAddDifficulty] = useState<Difficulty>('medium');
  const [scrollTarget, setScrollTarget] = useState('');

  const [busy, setBusy] = useState<BusyState>(null);
  const [reviewed, setReviewed] = useState(false);
  const [examId, setExamId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Thông tin của đề đang xem trước (chốt tại thời điểm bấm "Tạo đề bằng AI").
  const [source, setSource] = useState({ topicId: '', title: '', subject: '', grade: '' });

  useEffect(() => {
    let active = true;

    getClientSystemSettings()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch(() => undefined);

    getAiTopics()
      .then((list) => {
        if (!active) return;
        setTopics(list);
        setChapterName(list[0]?.chapterName ?? '');
        setTopicId(list[0]?.id ?? '');
      })
      .catch((error: Error) => {
        if (active) toast.error(error.message);
      })
      .finally(() => {
        if (active) setTopicsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  /* ---------- dữ liệu suy ra từ chủ đề đã chọn ---------- */

  const chapters = useMemo(
    () => Array.from(new Set(topics.map((topic) => topic.chapterName))),
    [topics],
  );

  const topicsOfChapter = useMemo(
    () => topics.filter((topic) => topic.chapterName === chapterName),
    [topics, chapterName],
  );

  const selectedTopic = topics.find((topic) => topic.id === topicId);
  const subjectName = topics[0]?.subjectName ?? '—';
  const gradeName = topics[0]?.gradeName ?? '—';
  const gradeNumber = gradeName.replace(/^Khối\s*/i, '');

  // Tên đề tự gợi ý theo chủ đề cho đến khi giáo viên tự sửa.
  useEffect(() => {
    if (!titleTouched && selectedTopic) {
      setTitle(`Ôn tập ${lowerFirst(selectedTopic.name)}`);
    }
  }, [selectedTopic, titleTouched]);

  // Yêu cầu bổ sung mặc định theo môn và khối cho đến khi giáo viên tự sửa.
  useEffect(() => {
    if (!requirementsTouched && topics.length > 0) {
      setRequirements(
        `Tạo câu hỏi trắc nghiệm bám sát chương trình ${subjectName} ${gradeNumber}, nội dung thuộc chủ đề đã chọn. ` +
          'Mỗi câu có 4 phương án, chỉ một đáp án đúng. Kèm đáp án và lời giải để giáo viên kiểm tra.',
      );
    }
  }, [requirementsTouched, topics.length, subjectName, gradeNumber]);

  // Cuộn tới câu hỏi vừa thêm.
  useEffect(() => {
    if (!scrollTarget) return;

    document
      .getElementById(`ai-question-${scrollTarget}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setScrollTarget('');
  }, [scrollTarget, items.length, buffer.length]);

  const locked = !!examId;

  // Danh sách đang hiển thị: khi chỉnh sửa thì làm việc trên bản sao, lưu xong mới áp dụng.
  const list = editMode ? buffer : items;
  const setList = (updater: (prev: DraftItem[]) => DraftItem[]) =>
    editMode ? setBuffer(updater) : setItems(updater);

  /* =====================================================
     GỌI AI
  ===================================================== */

  const buildRequirements = (avoidText?: string) => {
    const parts = [requirements.trim()];

    if (avoidText) {
      parts.push(`Hãy tạo một câu khác với câu sau: "${avoidText.slice(0, 150)}"`);
    }

    return parts.filter(Boolean).join('\n').slice(0, 1000);
  };

  const generateExam = async () => {
    if (!topicId) {
      toast.error('Vui lòng chọn chủ đề.');
      return;
    }

    if (!title.trim()) {
      toast.error('Vui lòng nhập tên đề.');
      return;
    }

    if (items.length > 0 && !locked) {
      const ok = await confirmDialog({
        title: 'Tạo lại đề',
        message: 'Đề xem trước hiện tại chưa được lưu và sẽ bị thay thế. Tiếp tục?',
        confirmText: 'Tạo lại',
        tone: 'danger',
      });

      if (!ok) return;
    }

    setBusy('generate');

    try {
      // Chia nhỏ nếu số câu vượt quá giới hạn mỗi lần gọi AI rồi ghép lại.
      const sizes: number[] = [];
      let remaining = totalQuestions;

      while (remaining > 0) {
        const size = Math.min(MAX_PER_AI_CALL, remaining);
        sizes.push(size);
        remaining -= size;
      }

      const results = await Promise.all(
        sizes.map((size) => generateAiQuestions(topicId, size, difficulty, buildRequirements())),
      );

      const generated: DraftItem[] = results.flatMap((result) =>
        result.questions.map((question) => ({ key: nextKey(), difficulty, question })),
      );

      setItems(generated);
      setHasDraft(true);
      setBuffer([]);
      setEditMode(false);
      setShowInvalid(false);
      setRevealed({});
      setAddPanelOpen(false);
      setAddDifficulty(difficulty);
      setReviewed(false);
      setExamId('');
      setSubmitted(false);
      setSource({ topicId, title: title.trim(), subject: subjectName, grade: gradeNumber });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo đề bằng AI.');
    } finally {
      setBusy(null);
    }
  };

  const regenerate = async (key: string) => {
    const target = list.find((entry) => entry.key === key);
    if (!target) return;

    setBusy('regenerate');

    try {
      const result = await generateAiQuestions(
        source.topicId,
        1,
        target.difficulty,
        buildRequirements(target.question.noiDung),
      );

      setList((prev) =>
        prev.map((entry) => (entry.key === key ? { ...entry, question: result.questions[0] } : entry)),
      );
      setRevealed((prev) => ({ ...prev, [key]: false }));
      setReviewed(false);
      toast.success('Đã tạo lại câu hỏi.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo lại câu hỏi.');
    } finally {
      setBusy(null);
    }
  };

  const addByAi = async () => {
    setBusy('add');

    try {
      const result = await generateAiQuestions(
        source.topicId,
        1,
        addDifficulty,
        buildRequirements(),
      );

      const key = nextKey();

      setList((prev) => [...prev, { key, difficulty: addDifficulty, question: result.questions[0] }]);
      setScrollTarget(key);
      setAddPanelOpen(false);
      setReviewed(false);
      toast.success('Đã thêm một câu hỏi do AI tạo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm câu hỏi.');
    } finally {
      setBusy(null);
    }
  };

  const addManually = () => {
    const key = nextKey();
    const entry: DraftItem = { key, difficulty: addDifficulty, question: blankQuestion() };

    // Câu nhập thủ công luôn cần ở chế độ chỉnh sửa.
    if (editMode) {
      setBuffer((prev) => [...prev, entry]);
    } else {
      setBuffer([...items.map((item) => ({ ...item, question: { ...item.question } })), entry]);
      setEditMode(true);
      setShowInvalid(false);
    }

    setScrollTarget(key);
    setAddPanelOpen(false);
  };

  /* =====================================================
     CHỈNH SỬA TẤT CẢ CÂU HỎI CÙNG LÚC
  ===================================================== */

  const startEdit = () => {
    setBuffer(items.map((item) => ({ ...item, question: { ...item.question } })));
    setEditMode(true);
    setShowInvalid(false);
    setAddPanelOpen(false);
  };

  const updateField = (key: string, field: keyof AiDraftQuestion, value: string) => {
    setBuffer((prev) =>
      prev.map((entry) =>
        entry.key === key ? { ...entry, question: { ...entry.question, [field]: value } } : entry,
      ),
    );
  };

  const updateDifficulty = (key: string, value: Difficulty) => {
    setBuffer((prev) => prev.map((entry) => (entry.key === key ? { ...entry, difficulty: value } : entry)));
  };

  const saveEdit = () => {
    const invalidIndex = buffer.findIndex((entry) => !isValidQuestion(entry.question));

    if (invalidIndex >= 0) {
      setShowInvalid(true);
      setScrollTarget(buffer[invalidIndex].key);
      toast.error(
        `Câu ${invalidIndex + 1} chưa hợp lệ: cần đủ nội dung, bốn phương án khác nhau, đáp án và lời giải.`,
      );
      return;
    }

    setItems(buffer);
    setBuffer([]);
    setEditMode(false);
    setShowInvalid(false);
    setReviewed(false);
    toast.success('Đã lưu các chỉnh sửa.');
  };

  const cancelEdit = async () => {
    if (snapshot(buffer) !== snapshot(items)) {
      const ok = await confirmDialog({
        title: 'Hủy chỉnh sửa',
        message: 'Các thay đổi chưa lưu sẽ bị bỏ. Tiếp tục?',
        confirmText: 'Bỏ thay đổi',
        tone: 'danger',
      });

      if (!ok) return;
    }

    setBuffer([]);
    setEditMode(false);
    setShowInvalid(false);
  };

  const deleteQuestion = async (key: string, index: number) => {
    const ok = await confirmDialog({
      title: 'Xóa câu hỏi',
      message: `Xóa câu ${index + 1} khỏi đề xem trước?`,
      confirmText: 'Xóa',
      tone: 'danger',
    });

    if (!ok) return;

    setList((prev) => prev.filter((entry) => entry.key !== key));
    setReviewed(false);
  };

  const toggleAllAnswers = () => {
    const show = !list.every((entry) => revealed[entry.key]);

    setRevealed(Object.fromEntries(list.map((entry) => [entry.key, show])));
  };

  /* =====================================================
     LƯU BẢN NHÁP / GỬI ADMIN DUYỆT
  ===================================================== */

  // Trả về id đề nháp; null nếu chưa đủ điều kiện hoặc bị hủy/lỗi.
  const saveDraft = async (): Promise<string | null> => {
    if (examId) return examId;

    if (items.length === 0) {
      toast.error('Đề chưa có câu hỏi nào.');
      return null;
    }

    if (items.length !== totalQuestions) {
      toast.error(
        `Đề thi phải có đúng ${totalQuestions} câu theo cấu hình của Admin (hiện có ${items.length} câu).`,
      );
      return null;
    }

    const invalidIndex = items.findIndex((item) => !isValidQuestion(item.question));

    if (invalidIndex >= 0) {
      setScrollTarget(items[invalidIndex].key);
      toast.error(
        `Câu ${invalidIndex + 1} chưa hợp lệ: cần đủ nội dung, bốn phương án khác nhau, đáp án và lời giải.`,
      );
      return null;
    }

    const contents = items.map((item) => item.question.noiDung.trim().toLowerCase());

    if (new Set(contents).size !== contents.length) {
      toast.error('Đề có câu hỏi trùng nội dung. Hãy xóa hoặc tạo lại câu bị trùng.');
      return null;
    }

    if (!reviewed) {
      const ok = await confirmDialog({
        title: 'Xác nhận đã rà soát',
        message:
          'Thầy/cô đã kiểm tra nội dung, đáp án và lời giải của tất cả câu hỏi do AI tạo chưa?',
        confirmText: 'Đã kiểm tra',
      });

      if (!ok) return null;

      setReviewed(true);
    }

    try {
      // Lưu từng câu vào ngân hàng; câu đã lưu (lần trước bị lỗi giữa chừng) được giữ nguyên.
      const ids: string[] = [];

      for (const item of items) {
        if (item.savedId) {
          ids.push(item.savedId);
          continue;
        }

        const id = await saveAiQuestion(item.question, source.topicId, item.difficulty);

        ids.push(id);
        setItems((prev) =>
          prev.map((entry) => (entry.key === item.key ? { ...entry, savedId: id } : entry)),
        );
      }

      // Tạo đề cùng toàn bộ câu hỏi trong một lần: hoặc đủ hoặc không tạo gì.
      const id = await createTeacherExam({
        tenBaiKT: source.title,
        thoiLuong: duration,
        questionIds: ids,
      });

      setExamId(id);
      setAddPanelOpen(false);

      return id;
    } catch (error) {
      toast.error(
        (error instanceof Error ? error.message : 'Không thể lưu bản nháp.') +
          ' Các câu đã lưu vẫn được giữ; bấm lưu lại để tiếp tục.',
      );
      return null;
    }
  };

  const handleSaveDraft = async () => {
    setBusy('save');

    try {
      const alreadySaved = !!examId;
      const id = await saveDraft();

      if (id && !alreadySaved) {
        toast.success(
          `Đã lưu bản nháp “${source.title}” (${items.length} câu, ${duration} phút). Xem trong Quản lý Đề thi.`,
        );
      }
    } finally {
      setBusy(null);
    }
  };

  const handleSubmitToAdmin = async () => {
    setBusy('submit');

    try {
      const id = await saveDraft();
      if (!id) return;

      await submitTeacherExamForApproval(id);
      setSubmitted(true);
      toast.success(`Đã gửi đề “${source.title}” cho Admin duyệt.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi Admin duyệt.');
    } finally {
      setBusy(null);
    }
  };

  const resetAll = () => {
    setItems([]);
    setHasDraft(false);
    setBuffer([]);
    setEditMode(false);
    setExamId('');
    setSubmitted(false);
    setReviewed(false);
    setRevealed({});
    setAddPanelOpen(false);
    setTitleTouched(false);
  };

  /* =====================================================
     GIAO DIỆN
  ===================================================== */

  const card = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';
  const labelClass = 'text-sm text-slate-500';
  const valueClass = 'text-[15px] font-bold text-slate-900';
  const plainField =
    'w-full appearance-none border-0 border-b border-dashed border-slate-300 bg-transparent pb-0.5 text-[15px] font-bold text-slate-900 outline-none focus:border-purple-500 disabled:opacity-60';
  const areaField =
    'mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-800 outline-none focus:border-purple-500';
  const outlineButton =
    'rounded-xl border border-slate-300 bg-white text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

  const busyAny = busy !== null;
  const showPreview = hasDraft;
  const countMismatch = list.length !== totalQuestions;
  const toolbarDisabled = busyAny || locked;

  return (
    <section className="grid w-full items-start gap-6 text-slate-800 xl:grid-cols-[minmax(380px,440px)_minmax(0,1fr)]">
      {/* ====================== CỘT TRÁI: THIẾT LẬP ====================== */}
      <div className={`${card} xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-fuchsia-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI hỗ trợ tạo đề thi</h2>
              <p className="text-sm text-slate-500">Tạo bản nháp đề thi từ yêu cầu của giáo viên</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Giáo viên
          </span>
        </div>

        {/* ---- Bước 1 ---- */}
        <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
          <h3 className="text-[15px] font-bold text-slate-900">Bước 1. Thiết lập thông tin đề</h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className={labelClass}>Môn học</p>
              <p className={valueClass}>{subjectName}</p>
            </div>
            <div>
              <p className={labelClass}>Khối lớp</p>
              <p className={valueClass}>{gradeName}</p>
            </div>

            <div>
              <p className={labelClass}>Chương</p>
              <div className="relative">
                <select
                  aria-label="Chương"
                  className={`${plainField} pr-6`}
                  value={chapterName}
                  disabled={busyAny || chapters.length === 0}
                  onChange={(event) => {
                    const name = event.target.value;
                    setChapterName(name);
                    setTopicId(topics.find((topic) => topic.chapterName === name)?.id ?? '');
                  }}
                >
                  {chapters.length === 0 && <option value="">Chưa có chương phù hợp</option>}
                  {chapters.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <p className={labelClass}>Chủ đề</p>
              <div className="relative">
                <select
                  aria-label="Chủ đề"
                  className={`${plainField} pr-6`}
                  value={topicId}
                  disabled={busyAny || topicsOfChapter.length === 0}
                  onChange={(event) => setTopicId(event.target.value)}
                >
                  {topicsOfChapter.length === 0 && <option value="">Chưa có chủ đề phù hợp</option>}
                  {topicsOfChapter.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {topicsLoaded && topics.length === 0 && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Chưa có chủ đề nào thuộc môn và khối thầy/cô phụ trách. Hãy nhờ Admin thêm chương/chủ đề trước.
            </p>
          )}
        </div>

        {/* ---- Bước 2 ---- */}
        <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
          <h3 className="text-[15px] font-bold text-slate-900">Bước 2. Cấu hình cấu trúc đề</h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className={labelClass}>Tên đề</p>
              <input
                aria-label="Tên đề"
                className={plainField}
                value={title}
                maxLength={200}
                disabled={busyAny}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setTitleTouched(true);
                }}
              />
            </div>
            <div>
              <p className={labelClass}>Thời lượng</p>
              <p className={valueClass}>{duration} phút</p>
            </div>

            <div>
              <p className={labelClass}>Số câu hỏi</p>
              <p className={valueClass}>{totalQuestions} câu</p>
            </div>
            <div>
              <p className={labelClass}>Mức độ</p>
              <div className="relative">
                <select
                  aria-label="Mức độ"
                  className={`${plainField} pr-6`}
                  value={difficulty}
                  disabled={busyAny}
                  onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                >
                  {DIFFICULTIES.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ---- Bước 3 ---- */}
        <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
          <h3 className="text-[15px] font-bold text-slate-900">Bước 3. Yêu cầu bổ sung cho AI</h3>

          <textarea
            aria-label="Yêu cầu bổ sung cho AI"
            rows={4}
            maxLength={MAX_REQUIREMENT_LENGTH}
            value={requirements}
            disabled={busyAny}
            onChange={(event) => {
              setRequirements(event.target.value);
              setRequirementsTouched(true);
            }}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-800 outline-none focus:border-purple-500 disabled:opacity-60"
          />
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          AI tạo bản nháp; giáo viên cần rà soát tính chính xác trước khi sử dụng.
        </p>

        <button
          type="button"
          onClick={generateExam}
          disabled={busyAny || !topicId || !title.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#a100ff] py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#8c00dd] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {busy === 'generate' ? 'AI đang tạo đề…' : 'Tạo đề bằng AI'}
        </button>
      </div>

      {/* ====================== CỘT PHẢI: XEM TRƯỚC ====================== */}
      <div className="min-w-0">
        {!showPreview ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            {busy === 'generate' ? (
              <>
                <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-purple-200 border-t-purple-600" />
                <p className="text-sm font-semibold text-slate-600">AI đang soạn đề, vui lòng chờ trong giây lát…</p>
              </>
            ) : (
              <>
                <Sparkles className="h-8 w-8 text-fuchsia-400" />
                <p className="max-w-sm text-sm text-slate-500">
                  Đề do AI tạo sẽ hiển thị tại đây. Hãy thiết lập thông tin ở bên trái rồi bấm “Tạo đề bằng AI”.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className={`${card} relative`}>
            {busy === 'generate' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80">
                <span className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                  <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-purple-200 border-t-purple-600" />
                  AI đang soạn đề mới…
                </span>
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Xem trước đề do AI tạo</h2>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  submitted
                    ? 'bg-sky-100 text-sky-700'
                    : locked
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-orange-100 text-orange-600'
                }`}
              >
                {submitted ? 'Đã gửi duyệt' : locked ? 'Đã lưu nháp' : 'Bản nháp'}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {source.title} · {source.subject} {source.grade} · {list.length} câu · {duration} phút
            </p>

            {/* ---- Thanh thao tác chung ---- */}
            {!editMode && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={toolbarDisabled || items.length === 0}
                  className={`${outlineButton} flex items-center gap-2 px-4 py-2 text-sm font-semibold`}
                >
                  <Pencil className="h-4 w-4" />
                  Chỉnh sửa câu hỏi
                </button>
                <button
                  type="button"
                  onClick={() => setAddPanelOpen((open) => !open)}
                  disabled={toolbarDisabled}
                  className={`${outlineButton} flex items-center gap-2 px-4 py-2 text-sm font-semibold`}
                >
                  <Plus className="h-4 w-4" />
                  Thêm câu hỏi
                </button>
                <button
                  type="button"
                  onClick={toggleAllAnswers}
                  disabled={list.length === 0}
                  className={`${outlineButton} flex items-center gap-2 px-4 py-2 text-sm font-semibold`}
                >
                  {list.length > 0 && list.every((entry) => revealed[entry.key]) ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {list.length > 0 && list.every((entry) => revealed[entry.key])
                    ? 'Ẩn tất cả đáp án'
                    : 'Xem tất cả đáp án'}
                </button>
              </div>
            )}

            {editMode && (
              <p className="mt-4 rounded-xl bg-purple-50 p-3 text-sm text-purple-800">
                Đang chỉnh sửa tất cả câu hỏi cùng lúc. Sửa xong bấm “Lưu thay đổi” ở cuối trang một lần.
                <button
                  type="button"
                  onClick={() => setAddPanelOpen((open) => !open)}
                  disabled={busyAny}
                  className="ml-2 font-bold underline disabled:opacity-50"
                >
                  Thêm câu hỏi
                </button>
              </p>
            )}

            {locked && (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                Đề nháp đã được lưu. Muốn chỉnh sửa tiếp, hãy vào Quản lý Đề thi
                {submitted ? ' (đề đã gửi Admin duyệt)' : ''}.
              </p>
            )}

            {addPanelOpen && !locked && (
              <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="block min-w-40 text-sm text-slate-500">
                  Mức độ câu hỏi mới
                  <div className="relative">
                    <select
                      className={`${plainField} pr-6`}
                      value={addDifficulty}
                      onChange={(event) => setAddDifficulty(event.target.value as Difficulty)}
                    >
                      {DIFFICULTIES.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1 h-4 w-4 text-slate-400" />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={addByAi}
                  disabled={busyAny}
                  className="flex items-center gap-1.5 rounded-xl bg-[#a100ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8c00dd] disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {busy === 'add' ? 'Đang tạo…' : 'AI tạo câu mới'}
                </button>
                <button
                  type="button"
                  onClick={addManually}
                  disabled={busyAny}
                  className={`${outlineButton} px-4 py-2.5 text-sm font-semibold`}
                >
                  Nhập thủ công
                </button>
              </div>
            )}

            {/* ---- Danh sách câu hỏi ---- */}
            <div className="mt-5 space-y-4">
              {list.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Đề chưa có câu hỏi nào. Bấm “Thêm câu hỏi” để tiếp tục.
                </p>
              )}

              {list.map((entry, index) => {
                const question = entry.question;
                const invalid = editMode && showInvalid && !isValidQuestion(question);

                return (
                  <article
                    key={entry.key}
                    id={`ai-question-${entry.key}`}
                    className={`rounded-xl border p-5 ${invalid ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-slate-900">Câu {index + 1}</h3>

                        {editMode ? (
                          <select
                            aria-label={`Mức độ câu ${index + 1}`}
                            value={entry.difficulty}
                            onChange={(event) => updateDifficulty(entry.key, event.target.value as Difficulty)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-purple-500"
                          >
                            {DIFFICULTIES.map((item) => (
                              <option key={item.key} value={item.key}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${DIFFICULTY_META[entry.difficulty].badge}`}
                          >
                            {DIFFICULTY_META[entry.difficulty].label}
                          </span>
                        )}
                      </div>

                      {!locked && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => regenerate(entry.key)}
                            disabled={busyAny}
                            className={`${outlineButton} flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold`}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${busy === 'regenerate' ? 'animate-spin' : ''}`} />
                            Tạo lại
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(entry.key, index)}
                            disabled={busyAny}
                            className={`${outlineButton} flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>

                    {editMode ? (
                      /* ---------- chế độ chỉnh sửa: tất cả câu cùng mở ---------- */
                      <div className="mt-3 space-y-3">
                        <label className="block text-sm text-slate-500">
                          Nội dung câu hỏi
                          <textarea
                            rows={3}
                            maxLength={8000}
                            value={question.noiDung}
                            onChange={(event) => updateField(entry.key, 'noiDung', event.target.value)}
                            className={areaField}
                          />
                        </label>

                        <div className="grid gap-3 md:grid-cols-2">
                          {(
                            [
                              ['optionA', 'Phương án A'],
                              ['optionB', 'Phương án B'],
                              ['optionC', 'Phương án C'],
                              ['optionD', 'Phương án D'],
                            ] as const
                          ).map(([field, label]) => (
                            <label key={field} className="block text-sm text-slate-500">
                              {label}
                              <textarea
                                rows={2}
                                maxLength={8000}
                                value={question[field]}
                                onChange={(event) => updateField(entry.key, field, event.target.value)}
                                className={areaField}
                              />
                            </label>
                          ))}
                        </div>

                        <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                          <label className="block text-sm text-slate-500">
                            Đáp án đúng
                            <select
                              value={question.correctAnswer}
                              onChange={(event) => updateField(entry.key, 'correctAnswer', event.target.value)}
                              className={areaField}
                            >
                              {OPTION_KEYS.map((key) => (
                                <option key={key} value={key}>
                                  {key}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block text-sm text-slate-500">
                            Lời giải
                            <textarea
                              rows={2}
                              maxLength={8000}
                              value={question.explanation}
                              onChange={(event) => updateField(entry.key, 'explanation', event.target.value)}
                              className={areaField}
                            />
                          </label>
                        </div>

                        {invalid && (
                          <p className="text-xs font-semibold text-rose-600">
                            Cần đủ nội dung, bốn phương án khác nhau, đáp án và lời giải.
                          </p>
                        )}
                      </div>
                    ) : (
                      /* ---------- chế độ xem ---------- */
                      <div className="mt-3 space-y-3">
                        <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
                          {question.noiDung}
                        </p>

                        <ul className="grid gap-2.5 md:grid-cols-2">
                          {OPTION_KEYS.map((key) => {
                            const isCorrect = question.correctAnswer === key;

                            return (
                              <li key={key} className="flex items-start gap-3 text-[15px] text-slate-800">
                                <span
                                  aria-hidden="true"
                                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                                    isCorrect ? 'border-slate-900' : 'border-slate-300'
                                  }`}
                                >
                                  {isCorrect && <span className="h-2 w-2 rounded-full bg-slate-900" />}
                                </span>
                                <span className="whitespace-pre-line">
                                  {key}. {optionOf(question, key)}
                                  {isCorrect && <span className="sr-only"> (đáp án đúng)</span>}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        <button
                          type="button"
                          onClick={() => setRevealed((prev) => ({ ...prev, [entry.key]: !prev[entry.key] }))}
                          className={`${outlineButton} w-full rounded-full py-2 text-sm font-semibold`}
                        >
                          {revealed[entry.key] ? 'Ẩn đáp án và lời giải' : 'Xem đáp án và lời giải'}
                        </button>

                        {revealed[entry.key] && (
                          <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-bold text-slate-900">Đáp án đúng: {question.correctAnswer}</p>
                            <p className="whitespace-pre-line leading-relaxed">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* ---- Thanh lưu cố định ở cuối ---- */}
            <div className="sticky bottom-0 -mx-6 -mb-6 mt-5 space-y-3 rounded-b-2xl border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
              {countMismatch && !locked && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  Đề thi phải có đúng {totalQuestions} câu theo cấu hình của Admin (hiện có {list.length} câu).
                </p>
              )}

              {editMode ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={busyAny}
                    className={`${outlineButton} rounded-full py-3 text-sm font-semibold`}
                  >
                    Hủy chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={busyAny}
                    className="rounded-full bg-[#a100ff] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8c00dd] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              ) : submitted ? (
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full rounded-full bg-slate-950 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Soạn đề mới
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={busyAny || locked}
                    className={`${outlineButton} rounded-full py-3 text-sm font-semibold`}
                  >
                    {busy === 'save' ? 'Đang lưu…' : locked ? 'Đã lưu bản nháp' : 'Lưu bản nháp'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitToAdmin}
                    disabled={busyAny || items.length === 0}
                    className="rounded-full bg-slate-950 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === 'submit' ? 'Đang gửi…' : 'Gửi Admin duyệt'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
