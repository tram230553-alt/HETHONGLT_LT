export interface LearningActivity {
  id: string;
  type: "quiz" | "flashcard" | "ai_tutor";
  title: string;
  detail: string;
  subjectId?: string;
  timestamp: string; // ISO String
}

const STORAGE_KEY = "smartexam_recent_activities";

export function getRecentActivities(): LearningActivity[] {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached) {
    // Initialize with default mockup activities
    const now = Date.now();
    const defaults: LearningActivity[] = [
      {
        id: "default_act_1",
        type: "flashcard",
        title: "Tiếng Anh",
        detail: "Môn Tiếng Anh: Hoàn thành 5 thẻ ghi nhớ chuyên sâu",
        subjectId: "english",
        timestamp: new Date(now - 10 * 60 * 1000).toISOString() // 10 mins ago
      },
      {
        id: "default_act_2",
        type: "quiz",
        title: "Giải Tích Hàm Số",
        detail: "Môn Toán: Đã luyện xong đề lý thuyết đạt 4/5 câu đúng",
        subjectId: "math",
        timestamp: new Date(now - 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        id: "default_act_3",
        type: "ai_tutor",
        title: "Gia Sư AI 24/7",
        detail: "Kích hoạt Trợ lý AI nhận chiến thuật ôn tập bứt phá 2 tuần tới",
        timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    return JSON.parse(cached);
  } catch (e) {
    return [];
  }
}

export function addLearningActivity(
  type: "quiz" | "flashcard" | "ai_tutor",
  title: string,
  detail: string,
  subjectId?: string
): LearningActivity[] {
  const activities = getRecentActivities();
  
  const newActivity: LearningActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    title,
    detail,
    subjectId,
    timestamp: new Date().toISOString()
  };

  const updated = [newActivity, ...activities].slice(0, 20); // Keep last 20 activities
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Trigger custom window event to notify other components (real-time reactive sync)
  window.dispatchEvent(new Event("smartexam_activities_updated"));

  return updated;
}

export function clearActivities() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("smartexam_activities_updated"));
}

export function formatActivityTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Vừa xong";
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return `${diffHours} giờ trước`;
      }
      return "Hôm qua";
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return "Gần đây";
  }
}
