import React from "react";
import { BookOpenCheck, FileCheck2 } from "lucide-react";
import TeacherResultsSection from "./TeacherResultsSection";
import { PillTabs } from "./teacherResults/ui";

interface TeacherResultsTabsProps {
  gradeName?: string;
  subjectName?: string;
}

type ResultsTab = "exam" | "practice";

export default function TeacherResultsTabs(props: TeacherResultsTabsProps) {
  const [activeTab, setActiveTab] = React.useState<ResultsTab>("exam");

  return (
    <div className="space-y-5">
      <PillTabs<ResultsTab>
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: "exam",
            label: "Kết quả bài thi",
            icon: <FileCheck2 className="h-4 w-4" />,
            tone: "indigo",
          },
          {
            id: "practice",
            label: "Kết quả luyện tập",
            icon: <BookOpenCheck className="h-4 w-4" />,
            tone: "violet",
          },
        ]}
      />

      <TeacherResultsSection key={activeTab} kind={activeTab} {...props} />
    </div>
  );
}
