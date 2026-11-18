import React from "react";
import { AlertTriangle, GraduationCap } from "lucide-react";
import TeacherCommonWrongQuestionsView from "./TeacherCommonWrongQuestionsView";
import TeacherExamWrongQuestionsView from "./TeacherExamWrongQuestionsView";
import TeacherPracticeResultsView from "./TeacherPracticeResultsView";
import TeacherStudentResultsView from "./TeacherStudentResultsView";
import { PillTabs, type ResultTone } from "./teacherResults/ui";

interface TeacherResultsSectionProps {
  /** exam = bài thi, practice = luyện tập. Hai phần có cấu trúc giống hệt nhau. */
  kind: "exam" | "practice";
  gradeName?: string;
  subjectName?: string;
}

type SectionTab = "scores" | "wrong";

export default function TeacherResultsSection({
  kind,
  gradeName,
  subjectName,
}: TeacherResultsSectionProps) {
  const [activeTab, setActiveTab] = React.useState<SectionTab>("scores");
  const scoresTone: ResultTone = kind === "exam" ? "indigo" : "violet";
  const viewProps = { gradeName, subjectName };

  return (
    <div className="space-y-5">
      <PillTabs<SectionTab>
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: "scores",
            label: "Điểm học sinh",
            icon: <GraduationCap className="h-4 w-4" />,
            tone: scoresTone,
          },
          {
            id: "wrong",
            label: "Câu thường làm sai",
            icon: <AlertTriangle className="h-4 w-4" />,
            tone: "rose",
          },
        ]}
      />

      {kind === "exam" ? (
        activeTab === "scores" ? (
          <TeacherStudentResultsView {...viewProps} />
        ) : (
          <TeacherExamWrongQuestionsView {...viewProps} />
        )
      ) : activeTab === "scores" ? (
        <TeacherPracticeResultsView {...viewProps} />
      ) : (
        <TeacherCommonWrongQuestionsView {...viewProps} />
      )}
    </div>
  );
}
