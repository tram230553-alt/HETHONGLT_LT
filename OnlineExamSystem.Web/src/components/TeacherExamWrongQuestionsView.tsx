import React from "react";
import {
  getExamWrongQuestions,
  type ExamWrongQuestionDto,
  type ExamWrongQuestionStatsDto,
} from "../services/teacherStudentResultService";
import WrongQuestionsPanel, {
  type WrongQuestionStat,
} from "./teacherResults/WrongQuestionsPanel";

interface TeacherExamWrongQuestionsViewProps {
  gradeName?: string;
  subjectName?: string;
}

function toStat(question: ExamWrongQuestionDto): WrongQuestionStat {
  return {
    questionId: question.questionId,
    questionText: question.questionText,
    topicName: question.topicName,
    chapterName: question.chapterName,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    totalAttempts: question.totalAttempts,
    wrongCount: question.wrongCount,
    blankCount: question.blankCount,
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
      sourceName: student.examName,
      submittedAt: student.submittedAt,
    })),
  };
}

export default function TeacherExamWrongQuestionsView({
  gradeName,
  subjectName,
}: TeacherExamWrongQuestionsViewProps) {
  const [data, setData] = React.useState<ExamWrongQuestionStatsDto | null>(null);
  const [examId, setExamId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async (selectedExamId: string) => {
    try {
      setLoading(true);
      setError(null);
      setData(await getExamWrongQuestions(selectedExamId || undefined));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được thống kê câu sai theo đề thi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData(examId);
  }, [examId, loadData]);

  const questions = React.useMemo(() => (data?.questions ?? []).map(toStat), [data]);
  const highRiskCount = questions.filter((q) => q.wrongRate >= 70).length;

  return (
    <WrongQuestionsPanel
      gradeName={gradeName}
      subjectName={subjectName}
      title="Thống kê câu sai trong đề thi"
      description="Chỉ tính các đề do bạn tạo. Câu bỏ trống được hệ thống chấm là sai nên được tính vào lượt sai và hiển thị riêng."
      summary={[
        { label: "Lượt nộp bài", value: String(data?.submissionCount ?? 0) },
        { label: "Học sinh tham gia", value: String(data?.studentCount ?? 0) },
        { label: "Câu có học sinh sai", value: String(data?.questionsWithWrongAnswers ?? 0) },
        { label: "Câu sai từ 70%", value: String(highRiskCount) },
      ]}
      questions={questions}
      loading={loading}
      error={error}
      onReload={() => void loadData(examId)}
      sourceFilter={{
        ariaLabel: "Chọn đề thi",
        allLabel: "Tất cả đề thi của tôi",
        value: examId,
        onChange: setExamId,
        options: (data?.exams ?? []).map((exam) => ({
          value: exam.examId,
          label: `${exam.examName} (${exam.submissionCount} lượt nộp)`,
        })),
      }}
      sourceColumnLabel="Đề / thời gian"
      showBlank
      exportName={`cau-sai-${data?.examName || "tat-ca-de"}`}
      emptyTitle="Chưa có câu nào bị học sinh làm sai"
      emptyHint="Thống kê sẽ xuất hiện khi học sinh nộp bài thi của bạn."
    />
  );
}
