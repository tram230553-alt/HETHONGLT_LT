import React from "react";
import { GraduationCap } from "lucide-react";
import { getMyTeacherExams, type TeacherExamDto } from "../services/teacherExamService";
import {
  getTeacherExamResultDetail,
  getTeacherStudentResults,
  type TeacherStudentResultDto,
} from "../services/teacherStudentResultService";
import StudentScoresBoard, {
  type ScoreStudent,
  type ScoresBoardLabels,
} from "./teacherResults/StudentScoresBoard";
import type { AttemptReviewData } from "./teacherResults/AttemptReview";

interface TeacherStudentResultsViewProps {
  gradeName?: string;
  subjectName?: string;
}

const LABELS: ScoresBoardLabels = {
  headerTitle: "Báo cáo Học lực Học sinh Phân công",
  headerDescription:
    "Dữ liệu lấy trực tiếp từ kết quả các đề thi do bạn tạo. Giáo viên chỉ xem học sinh thuộc đúng khối được phân công và kết quả của chính các đề mình phụ trách.",
  headerIcon: <GraduationCap className="h-5 w-5" />,
  attemptNoun: "lượt thi",
  unitNoun: "đề",
  unitStatLabel: "Số đề làm",
  sourceAllLabel: "Tất cả đề thi",
  notAttemptedShort: "Chưa thi",
  notAttemptedFilter: "Chưa làm bài",
  modalEyebrow: "Kết quả học sinh",
  historyTitle: "Lịch sử bài thi của học sinh",
  emptyHistory: "Học sinh chưa nộp bài thi nào của giáo viên.",
  lastResultLabel: "Kết quả gần nhất:",
};

function toScoreStudent(student: TeacherStudentResultDto): ScoreStudent {
  return {
    studentId: student.studentId,
    maHS: student.maHS,
    studentName: student.studentName,
    email: student.email,
    gradeName: student.gradeName,
    isLocked: student.isLocked,
    completedUnits: student.completedExams,
    attemptCount: student.results.length,
    averageScore: student.averageScore,
    correct: student.correctQuestion,
    total: student.totalQuestion,
    lastSubmittedAt: student.lastSubmittedAt,
    attempts: student.results.map((result) => ({
      id: result.examResultId,
      sourceId: result.examId,
      title: result.examName,
      subtitle: "",
      score: result.score,
      correct: result.correctQuestion,
      total: result.totalQuestion,
      submittedAt: result.submittedAt,
    })),
  };
}

async function loadExamDetail(examResultId: string): Promise<AttemptReviewData> {
  const detail = await getTeacherExamResultDetail(examResultId);
  return {
    score: detail.score,
    correct: detail.correctQuestion,
    total: detail.totalQuestion,
    blank: detail.blankQuestion,
    submittedAt: detail.submittedAt,
    questions: detail.questions,
  };
}

export default function TeacherStudentResultsView({
  gradeName,
  subjectName,
}: TeacherStudentResultsViewProps) {
  const [rawStudents, setRawStudents] = React.useState<TeacherStudentResultDto[]>([]);
  const [exams, setExams] = React.useState<TeacherExamDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentData, examData] = await Promise.all([
        getTeacherStudentResults(),
        getMyTeacherExams(),
      ]);

      setRawStudents(studentData);
      setExams(examData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được kết quả học sinh.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const students = React.useMemo(() => rawStudents.map(toScoreStudent), [rawStudents]);
  const publishedCount = React.useMemo(
    () => exams.filter((exam) => exam.isPublished).length,
    [exams],
  );
  const sourceOptions = React.useMemo(
    () => exams.map((exam) => ({ value: exam.id, label: exam.tenBaiKT })),
    [exams],
  );

  return (
    <StudentScoresBoard
      tone="indigo"
      gradeName={gradeName}
      subjectName={subjectName}
      labels={LABELS}
      students={students}
      sourceOptions={sourceOptions}
      progressTotal={publishedCount}
      loading={loading}
      error={error}
      onReload={() => void loadData()}
      loadDetail={loadExamDetail}
    />
  );
}
