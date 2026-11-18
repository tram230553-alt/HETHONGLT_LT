import React from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import type { ChapterDto } from "../services/chapterService";
import type { TopicDto } from "../services/topicService";
import type { TeacherQuestionDto } from "../services/teacherQuestionService";

interface Props {
  khoiName: string;
  monName: string;
  chapters: ChapterDto[];
  topics: TopicDto[];
  questions: TeacherQuestionDto[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

interface TopicNode {
  key: string;
  name: string;
  questions: TeacherQuestionDto[];
}

interface ChapterNode {
  key: string;
  name: string;
  topics: TopicNode[];
}

const UNCATEGORIZED_CHAPTER = "Chưa phân loại";
const UNCATEGORIZED_TOPIC = "Chưa gán Topic";

// Checkbox hỗ trợ trạng thái "chọn một phần".
function TriCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(element) => {
        if (element) element.indeterminate = indeterminate;
      }}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
      className="h-4 w-4 shrink-0 accent-indigo-600"
    />
  );
}

/**
 * Chọn câu hỏi cho đề thi theo cây: Khối → Môn → Chương → Topic → Câu hỏi.
 * Giáo viên chọn từng câu hoặc tick cả Topic / cả Chương.
 */
export default function ExamQuestionPicker({
  khoiName,
  monName,
  chapters,
  topics,
  questions,
  selectedIds,
  onChange,
}: Props) {
  const [search, setSearch] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => {
    // Mặc định: mở các Chương, đóng các Topic (trừ Topic đã có câu được chọn).
    const initial = new Set<string>();
    const selected = new Set(selectedIds);
    const openTopics = new Set(
      questions.filter((q) => selected.has(q.id)).map((q) => q.topicId || ""),
    );

    topics.forEach((topic) => {
      if (!openTopics.has(topic.id)) initial.add(`tp:${topic.id}`);
    });

    return initial;
  });

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const keyword = search.trim().toLowerCase();
  const searching = keyword.length > 0;

  const tree = React.useMemo<ChapterNode[]>(() => {
    const visible = searching
      ? questions.filter((q) => q.noiDung.toLowerCase().includes(keyword))
      : questions;

    const topicById = new Map(topics.map((t) => [t.id, t]));
    const chapterById = new Map(chapters.map((c) => [c.id, c]));

    // Gom câu hỏi theo Topic.
    const byTopic = new Map<string, TeacherQuestionDto[]>();
    const uncategorized: TeacherQuestionDto[] = [];

    visible.forEach((question) => {
      if (question.topicId && topicById.has(question.topicId)) {
        const list = byTopic.get(question.topicId) ?? [];
        list.push(question);
        byTopic.set(question.topicId, list);
      } else {
        uncategorized.push(question);
      }
    });

    // Gom Topic theo Chương (chỉ giữ Topic có câu hỏi).
    const byChapter = new Map<string, TopicNode[]>();

    [...byTopic.entries()]
      .map(([topicId, list]) => ({ topic: topicById.get(topicId)!, list }))
      .sort((a, b) => a.topic.orderNum - b.topic.orderNum || a.topic.name.localeCompare(b.topic.name, "vi"))
      .forEach(({ topic, list }) => {
        const nodes = byChapter.get(topic.chapterId) ?? [];
        nodes.push({ key: `tp:${topic.id}`, name: topic.name, questions: list });
        byChapter.set(topic.chapterId, nodes);
      });

    const result: ChapterNode[] = [...byChapter.entries()]
      .map(([chapterId, nodes]) => {
        const chapter = chapterById.get(chapterId);
        const fallbackName = topicById.get(nodes[0].key.slice(3))?.chapterName;

        return {
          order: chapter?.order ?? Number.MAX_SAFE_INTEGER,
          node: {
            key: `ch:${chapterId}`,
            name: chapter?.name ?? fallbackName ?? UNCATEGORIZED_CHAPTER,
            topics: nodes,
          } as ChapterNode,
        };
      })
      .sort((a, b) => a.order - b.order || a.node.name.localeCompare(b.node.name, "vi"))
      .map((x) => x.node);

    if (uncategorized.length > 0) {
      result.push({
        key: "ch:none",
        name: UNCATEGORIZED_CHAPTER,
        topics: [{ key: "tp:none", name: UNCATEGORIZED_TOPIC, questions: uncategorized }],
      });
    }

    return result;
  }, [questions, topics, chapters, keyword, searching]);

  const isOpen = (key: string) => searching || !collapsed.has(key);

  const toggleOpen = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Chọn / bỏ chọn một nhóm câu hỏi (Topic hoặc Chương).
  const toggleGroup = (ids: string[]) => {
    const allSelected = ids.every((id) => selectedSet.has(id));

    if (allSelected) {
      const remove = new Set(ids);
      onChange(selectedIds.filter((id) => !remove.has(id)));
    } else {
      const merged = new Set(selectedIds);
      ids.forEach((id) => merged.add(id));
      onChange([...merged]);
    }
  };

  const toggleQuestion = (id: string) =>
    onChange(
      selectedSet.has(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );

  const stat = (ids: string[]) => {
    const picked = ids.filter((id) => selectedSet.has(id)).length;
    return { picked, all: picked === ids.length && ids.length > 0, some: picked > 0 && picked < ids.length };
  };

  const countText = (ids: string[]) => `${ids.filter((id) => selectedSet.has(id)).length}/${ids.length}`;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm câu hỏi theo nội dung..."
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-300"
        />
      </div>

      {/* Khối → Môn */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-black text-slate-500">
        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700">{khoiName || "Khối"}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700">{monName || "Môn"}</span>
      </div>

      {tree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
          Không có câu hỏi phù hợp.
        </div>
      ) : (
        <div className="space-y-2">
          {tree.map((chapter) => {
            const chapterIds = chapter.topics.flatMap((t) => t.questions.map((q) => q.id));
            const chapterStat = stat(chapterIds);
            const chapterOpen = isOpen(chapter.key);

            return (
              <div key={chapter.key} className="overflow-hidden rounded-xl border border-slate-200">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleOpen(chapter.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleOpen(chapter.key);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 bg-slate-50 px-4 py-3"
                >
                  <TriCheckbox
                    checked={chapterStat.all}
                    indeterminate={chapterStat.some}
                    onChange={() => toggleGroup(chapterIds)}
                    label={`Chọn tất cả câu hỏi của ${chapter.name}`}
                  />
                  {chapterOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-800">
                    {chapter.name}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-slate-500">
                    {countText(chapterIds)} câu
                  </span>
                </div>

                {chapterOpen && (
                  <div className="divide-y divide-slate-100">
                    {chapter.topics.map((topic) => {
                      const topicIds = topic.questions.map((q) => q.id);
                      const topicStat = stat(topicIds);
                      const topicOpen = isOpen(topic.key);

                      return (
                        <div key={topic.key}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleOpen(topic.key)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleOpen(topic.key);
                              }
                            }}
                            className="flex cursor-pointer items-center gap-3 bg-white py-2.5 pl-8 pr-4"
                          >
                            <TriCheckbox
                              checked={topicStat.all}
                              indeterminate={topicStat.some}
                              onChange={() => toggleGroup(topicIds)}
                              label={`Chọn tất cả câu hỏi của ${topic.name}`}
                            />
                            {topicOpen ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
                              {topic.name}
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-slate-400">
                              {countText(topicIds)} câu
                            </span>
                          </div>

                          {topicOpen && (
                            <div className="space-y-1.5 bg-slate-50/60 py-2 pl-14 pr-4">
                              {topic.questions.map((question, index) => {
                                const checked = selectedSet.has(question.id);

                                return (
                                  <label
                                    key={question.id}
                                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                                      checked
                                        ? "border-indigo-300 bg-indigo-50/60"
                                        : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleQuestion(question.id)}
                                      className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-bold text-slate-400">
                                        Câu {index + 1}
                                      </p>
                                      <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                        {question.noiDung}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
