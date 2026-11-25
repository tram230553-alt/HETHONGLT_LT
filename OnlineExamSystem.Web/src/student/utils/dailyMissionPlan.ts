import type { TopicDto } from "../../services/topicService";

export interface DailyMissionState {
  planTopicIds: string[];
  completedTopicIds: string[];
  usedSubjectIds: string[];
  progressDays: number;
  streakDays: number;
  todayDate: string;
  todayStudiedCount: number;
  cycleCount: number;
}

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStorageKey = (): string => {
  const userId =
    localStorage.getItem("userId") ||
    localStorage.getItem("email") ||
    "default_student";
  return `smartexam_daily_mission_v2_${userId}`;
};

const getDefaultState = (): DailyMissionState => ({
  planTopicIds: [],
  completedTopicIds: [],
  usedSubjectIds: [],
  progressDays: 0,
  streakDays: 0,
  todayDate: getTodayDateString(),
  todayStudiedCount: 0,
  cycleCount: 0,
});

export const loadDailyMissionState = (): DailyMissionState => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<DailyMissionState>;
    const today = getTodayDateString();
    const isSameDay = parsed.todayDate === today;

    return {
      planTopicIds: Array.isArray(parsed.planTopicIds) ? parsed.planTopicIds : [],
      completedTopicIds: Array.isArray(parsed.completedTopicIds)
        ? parsed.completedTopicIds
        : [],
      usedSubjectIds: Array.isArray(parsed.usedSubjectIds)
        ? parsed.usedSubjectIds
        : [],
      progressDays:
        typeof parsed.progressDays === "number"
          ? Math.max(0, Math.min(7, parsed.progressDays))
          : 0,
      streakDays:
        typeof parsed.streakDays === "number"
          ? Math.max(0, parsed.streakDays)
          : 0,
      todayDate: today,
      todayStudiedCount: isSameDay && typeof parsed.todayStudiedCount === "number"
        ? parsed.todayStudiedCount
        : 0,
      cycleCount: typeof parsed.cycleCount === "number" ? parsed.cycleCount : 0,
    };
  } catch {
    return getDefaultState();
  }
};

export const saveDailyMissionState = (state: DailyMissionState): void => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("smartexam_daily_mission_updated"));
  } catch {
    // Ignore storage quota errors
  }
};

const pickTopicFromDistinctSubject = (
  unstudied: TopicDto[],
  activePlanSubjects: Set<string>,
  usedSubjectIds: string[]
): { picked: TopicDto | null; updatedUsedSubjectIds: string[] } => {
  if (unstudied.length === 0) {
    return { picked: null, updatedUsedSubjectIds: usedSubjectIds };
  }

  let nextUsedSubjects = [...usedSubjectIds];

  // Các chủ đề thuộc các môn CHƯA có trong 3 nhiệm vụ đang hiển thị
  const distinctSubjectTopics = unstudied.filter(
    (t) => !activePlanSubjects.has(t.subjectId)
  );

  let candidatePool: TopicDto[] = [];

  if (distinctSubjectTopics.length > 0) {
    // Ưu tiên các môn học chưa xuất hiện trong vòng xoay môn học hiện tại
    const freshSubjectTopics = distinctSubjectTopics.filter(
      (t) => !nextUsedSubjects.includes(t.subjectId)
    );

    if (freshSubjectTopics.length > 0) {
      candidatePool = freshSubjectTopics;
    } else {
      // Đã đi qua hết một lượt các môn -> làm mới danh sách môn đã qua (giữ lại các môn đang nằm trên bảng nhiệm vụ)
      nextUsedSubjects = Array.from(activePlanSubjects);
      candidatePool = distinctSubjectTopics;
    }
  } else {
    // Trường hợp cuối chu kỳ khi chỉ còn đúng 1-2 môn còn chủ đề chưa học
    candidatePool = unstudied;
  }

  // Nhóm theo môn học rồi chọn ngẫu nhiên 1 môn, sau đó chọn 1 chủ đề của môn đó
  const bySubject = new Map<string, TopicDto[]>();
  for (const t of candidatePool) {
    const list = bySubject.get(t.subjectId) ?? [];
    list.push(t);
    bySubject.set(t.subjectId, list);
  }

  const subjectKeys = Array.from(bySubject.keys());
  const randomSubjectId =
    subjectKeys[Math.floor(Math.random() * subjectKeys.length)];
  const subjectTopics = bySubject.get(randomSubjectId) ?? candidatePool;
  const picked =
    subjectTopics[Math.floor(Math.random() * subjectTopics.length)];

  if (picked && !nextUsedSubjects.includes(picked.subjectId)) {
    nextUsedSubjects.push(picked.subjectId);
  }

  return { picked, updatedUsedSubjectIds: nextUsedSubjects };
};

export interface SyncedMissionPlan {
  state: DailyMissionState;
  plannedTopics: TopicDto[];
  allTopicsCompleted: boolean;
  totalTopicsCount: number;
  completedTopicsCount: number;
  totalSubjectsCount: number;
  completedSubjectsCount: number;
}

/**
 * Đồng bộ và giữ cố định 3 chủ đề của 3 môn khác nhau.
 * Chỉ thay đổi chủ đề khi chủ đề đó đã được học xong.
 */
export const syncDailyMissionPlan = (
  allTopics: TopicDto[]
): SyncedMissionPlan => {
  const activePool = allTopics.filter((t) => t.isActive !== false);
  const poolWithQuestions = activePool.filter((t) => (t.questionCount ?? 0) > 0);
  const pool = poolWithQuestions.length > 0 ? poolWithQuestions : activePool;

  const topicMap = new Map<string, TopicDto>(pool.map((t) => [t.id, t]));
  const state = loadDailyMissionState();

  // Giữ lại các completedTopicIds hợp lệ trong pool hiện tại
  const validCompletedIds = state.completedTopicIds.filter((id) =>
    topicMap.has(id)
  );
  const completedSet = new Set(validCompletedIds);

  // Giữ nguyên các chủ đề đã lên kế hoạch mà CHƯA học và không trùng môn học
  const validPlanIds: string[] = [];
  const activePlanSubjects = new Set<string>();

  for (const id of state.planTopicIds) {
    const topic = topicMap.get(id);
    if (!topic) continue;
    if (completedSet.has(id)) continue;
    if (activePlanSubjects.has(topic.subjectId)) continue;

    validPlanIds.push(id);
    activePlanSubjects.add(topic.subjectId);
  }

  let usedSubjectIds = [...state.usedSubjectIds];
  for (const subId of activePlanSubjects) {
    if (!usedSubjectIds.includes(subId)) {
      usedSubjectIds.push(subId);
    }
  }

  // Nếu chưa đủ 3 chủ đề (do mới khởi tạo hoặc vừa học xong 1 chủ đề), chọn bù chủ đề từ môn khác chưa học
  while (validPlanIds.length < 3) {
    const unstudied = pool.filter(
      (t) => !completedSet.has(t.id) && !validPlanIds.includes(t.id)
    );
    if (unstudied.length === 0) break;

    const { picked, updatedUsedSubjectIds } = pickTopicFromDistinctSubject(
      unstudied,
      activePlanSubjects,
      usedSubjectIds
    );
    usedSubjectIds = updatedUsedSubjectIds;

    if (!picked) break;
    validPlanIds.push(picked.id);
    activePlanSubjects.add(picked.subjectId);
  }

  const nextState: DailyMissionState = {
    ...state,
    planTopicIds: validPlanIds,
    completedTopicIds: validCompletedIds,
    usedSubjectIds,
  };

  saveDailyMissionState(nextState);

  const plannedTopics = validPlanIds
    .map((id) => topicMap.get(id))
    .filter((t): t is TopicDto => Boolean(t));

  // Thống kê số môn đã học hết hoặc đã học ít nhất 1 chủ đề
  const allSubjectIds = Array.from(new Set(pool.map((t) => t.subjectId)));
  const studiedSubjectIds = new Set(
    validCompletedIds
      .map((id) => topicMap.get(id)?.subjectId)
      .filter((s): s is string => Boolean(s))
  );

  return {
    state: nextState,
    plannedTopics,
    allTopicsCompleted: pool.length > 0 && validPlanIds.length === 0,
    totalTopicsCount: pool.length,
    completedTopicsCount: validCompletedIds.length,
    totalSubjectsCount: allSubjectIds.length,
    completedSubjectsCount: studiedSubjectIds.size,
  };
};

/**
 * Gọi ngay sau khi học sinh nộp bài hoàn thành 1 chủ đề.
 * - Đánh dấu chủ đề đã học (để đổi sang chủ đề của môn khác).
 * - Lấp đầy thanh tiến độ mục tiêu 7 ngày (+1 mốc, tối đa 7/7 = 100%).
 * - Tăng chuỗi học tập (+1 ngày liên tục).
 */
export const recordStudiedMissionTopic = (
  topicId: string
): DailyMissionState => {
  const state = loadDailyMissionState();
  const alreadyCompleted = state.completedTopicIds.includes(topicId);
  const wasInPlan = state.planTopicIds.includes(topicId);

  const nextCompleted = alreadyCompleted
    ? state.completedTopicIds
    : [...state.completedTopicIds, topicId];

  // Xóa chủ đề vừa học khỏi danh sách 3 nhiệm vụ đang hiển thị để thay bằng chủ đề môn khác
  const nextPlan = state.planTopicIds.filter((id) => id !== topicId);

  // Mỗi khi hoàn thành bài học: lấp đầy thanh tiến độ (mục tiêu 7 ngày) và tăng chuỗi học tập
  const shouldAdvanceProgress = !alreadyCompleted || wasInPlan;
  const nextProgressDays = shouldAdvanceProgress
    ? Math.min(7, state.progressDays + 1)
    : state.progressDays;
  const nextStreakDays = shouldAdvanceProgress
    ? state.streakDays + 1
    : state.streakDays;
  const nextTodayCount = shouldAdvanceProgress
    ? state.todayStudiedCount + 1
    : state.todayStudiedCount;

  const updated: DailyMissionState = {
    ...state,
    planTopicIds: nextPlan,
    completedTopicIds: nextCompleted,
    progressDays: nextProgressDays,
    streakDays: nextStreakDays,
    todayStudiedCount: nextTodayCount,
  };

  saveDailyMissionState(updated);
  return updated;
};

/**
 * Khi đã học hết toàn bộ các chủ đề của tất cả các môn, cho phép bắt đầu chu kỳ mới
 * (vẫn giữ nguyên chuỗi học tập đã tích lũy).
 */
export const startNewMissionCycle = (): DailyMissionState => {
  const state = loadDailyMissionState();
  const next: DailyMissionState = {
    ...state,
    planTopicIds: [],
    completedTopicIds: [],
    usedSubjectIds: [],
    cycleCount: state.cycleCount + 1,
  };
  saveDailyMissionState(next);
  return next;
};
