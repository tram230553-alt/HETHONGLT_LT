import React from "react";
import { BookOpenCheck } from "lucide-react";
import {
  getTeacherPracticeAttemptDetail,
  getTeacherStudentPracticeResults,
  type TeacherStudentPracticeResultDto,
} from "../services/teacherStudentResultService";
import StudentScoresBoard, {
  type ScoreStudent,
  type ScoresBoardLabels,
} from "./teacherResults/StudentScoresBoard";
import type { AttemptReviewData } from "./teacherResults/AttemptReview";

interface TeacherPracticeResultsViewProps {
  gradeName?: string;
  subjectName?: string;
}

const LABELS: ScoresBoardLabels = {
  headerTitle: "Kết quả luyện tập theo Topic",
  headerDescription:
    "Chỉ hiển thị Practice thuộc đúng môn và khối giáo viên phụ trách. Bấm vào từng lượt luyện để xem học sinh chọn gì ở từng câu.",
  headerIcon: <BookOpenCheck className="h-5 w-5" />,
  attemptNoun: "lượt luyện",
  unitNoun: "topic",
  unitStatLabel: "Số topic",
  sourceAllLabel: "Tất cả topic",
  notAttemptedShort: "Chưa luyện",
  notAttemptedFilter: "Chưa luyện tập",
  modalEyebrow: "Lịch sử Practice",
  historyTitle: "Lịch sử luyện tập của học sinh",
  emptyHistory: "Học sinh chưa có lượt luyện tập.",
  lastResultLabel: "Lượt luyện gần nhất:",
};

const chapterLabel = (chapterOrder: number, orderNum: number) =>
  `Chương ${chapterOrder} • Bài ${String(orderNum).padStart(2, "0")}`;

function toScoreStudent(student: TeacherStudentPracticeResultDto): ScoreStudent {
  return {
    studentId: student.studentId,
    maHS: student.maHS,
    studentName: student.studentName,
    email: student.email,
    gradeName: student.gradeName,
    isLocked: student.isLocked,
    completedUnits: student.completedTopics,
    attemptCount: student.attemptCount,
    averageScore: student.averageScore,
    correct: student.correctAnswers,
    total: student.totalQuestions,
    lastSubmittedAt: student.lastSubmittedAt,
    attempts: student.attempts.map((attempt) => ({
      id: attempt.attemptId,
      sourceId: attempt.topicId,
      title: attempt.topicName,
      subtitle: chapterLabel(attempt.chapterOrder, attempt.orderNum),
      score: attempt.score,
      correct: attempt.correctAnswers,
      total: attempt.totalQuestions,
      submittedAt: attempt.submittedAt,
    })),
  };
}

async function loadPracticeDetail(attemptId: string): Promise<AttemptReviewData> {
  const detail = await getTeacherPracticeAttemptDetail(attemptId);
  return {
    score: detail.score,
    correct: detail.correctAnswers,
    total: detail.totalQuestions,
    blank: detail.blankQuestions,
    submittedAt: detail.submittedAt,
    questions: detail.questions,
  };
}

export default function TeacherPracticeResultsView({
  gradeName,
  subjectName,
}: TeacherPracticeResultsViewProps) {
  const [rawStudents, setRawStudents] = React.useState<TeacherStudentPracticeResultDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRawStudents(await getTeacherStudentPracticeResults());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được kết quả luyện tập.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const students = React.useMemo(() => rawStudents.map(toScoreStudent), [rawStudents]);

  // Danh sách topic để lọc: lấy từ chính các lượt luyện đã có.
  const sourceOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    rawStudents.forEach((student) =>
      student.attempts.forEach((attempt) => map.set(attempt.topicId, attempt.topicName)),
    );
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "vi"),
    );
  }, [rawStudents]);

  const progressTotal = React.useMemo(
    () => rawStudents.reduce((max, student) => Math.max(max, student.totalTopics ?? 0), 0),
    [rawStudents],
  );

  return (
    <StudentScoresBoard
      tone="violet"
      gradeName={gradeName}
      subjectName={subjectName}
      labels={LABELS}
      students={students}
      sourceOptions={sourceOptions}
      progressTotal={progressTotal}
      loading={loading}
      error={error}
      onReload={() => void loadData()}
      loadDetail={loadPracticeDetail}
    />
  );
}
