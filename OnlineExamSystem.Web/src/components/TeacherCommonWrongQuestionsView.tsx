import React from "react";
import {
  getCommonWrongPracticeQuestions,
  type CommonWrongPracticeQuestionDto,
} from "../services/teacherStudentResultService";
import WrongQuestionsPanel, {
  type WrongQuestionStat,
} from "./teacherResults/WrongQuestionsPanel";

interface TeacherCommonWrongQuestionsViewProps {
  gradeName?: string;
  subjectName?: string;
}

function toStat(question: CommonWrongPracticeQuestionDto): WrongQuestionStat {
  return {
    questionId: question.questionId,
    questionText: question.questionText,
    topicName: question.topicName,
    chapterName: question.chapterName,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    totalAttempts: question.answeredCount,
    wrongCount: question.wrongCount,
    blankCount: 0,
    studentCount: question.studentCount,
    wrongRate: question.wrongRate,
    mostChosenWrongAnswer: question.mostChosenWrongAnswer,
    mostChosenWrongAnswerCount: question.mostChosenWrongAnswerCount,
    options: question.options,
    wrongStudents: question.wrongStudents.map((student) => ({
      studentId: student.studentId,
      maHS: student.maHS,
      studentName: student.studentName,
      selectedAnswer: student.selectedAnswer,
      sourceName: student.topicName,
      submittedAt: student.submittedAt,
    })),
  };
}

export default function TeacherCommonWrongQuestionsView({
  gradeName,
  subjectName,
}: TeacherCommonWrongQuestionsViewProps) {
  const [rawQuestions, setRawQuestions] = React.useState<CommonWrongPracticeQuestionDto[]>([]);
  const [topicId, setTopicId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRawQuestions(await getCommonWrongPracticeQuestions(200));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách câu thường làm sai.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  // Cùng bộ lọc "chọn nguồn" như màn câu sai đề thi; ở đây nguồn là Topic.
  const topicOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    rawQuestions.forEach((q) => map.set(q.topicId, q.topicName));
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "vi"),
    );
  }, [rawQuestions]);

  const scoped = React.useMemo(
    () => (topicId ? rawQuestions.filter((q) => q.topicId === topicId) : rawQuestions),
    [rawQuestions, topicId],
  );
  const questions = React.useMemo(() => scoped.map(toStat), [scoped]);

  const totalWrong = questions.reduce((sum, q) => sum + q.wrongCount, 0);
  const totalAnswered = questions.reduce((sum, q) => sum + q.totalAttempts, 0);
  const averageWrongRate = questions.length
    ? questions.reduce((sum, q) => sum + q.wrongRate, 0) / questions.length
    : 0;
  const highRiskCount = questions.filter((q) => q.wrongRate >= 70).length;

  return (
    <WrongQuestionsPanel
      gradeName={gradeName}
      subjectName={subjectName}
      title="Câu học sinh thường làm sai"
      description="Không tính câu bỏ trống và chỉ hiển thị câu có ít nhất hai lượt trả lời."
      summary={[
        { label: "Lượt trả lời", value: String(totalAnswered) },
        { label: "Tổng lượt trả lời sai", value: String(totalWrong) },
        { label: "Câu có học sinh sai", value: String(questions.length) },
        {
          label: "Câu sai từ 70%",
          value: `${highRiskCount} • TB ${averageWrongRate.toFixed(1)}%`,
        },
      ]}
      questions={questions}
      loading={loading}
      error={error}
      onReload={() => void loadData()}
      sourceFilter={{
        ariaLabel: "Chọn topic",
        allLabel: "Tất cả topic",
        value: topicId,
        onChange: setTopicId,
        options: topicOptions,
      }}
      sourceColumnLabel="Topic / thời gian"
      showBlank={false}
      exportName="cau-sai-luyen-tap"
      emptyTitle="Chưa có câu hỏi phù hợp"
      emptyHint="Cần ít nhất hai lượt trả lời để hệ thống thống kê."
    />
  );
}
