namespace OnlineExamSystem.Application.DTOs.Teachers;

public class TeacherReportDto
{
    public int TotalQuestions { get; set; }
    public int TotalExams { get; set; }
    public int PublishedExams { get; set; }
    public int ExamAttemptCount { get; set; }
    public int PracticeAttemptCount { get; set; }
    public int ParticipatingStudentCount { get; set; }
    public double AverageExamScore { get; set; }
    public double ExamPassRate { get; set; }
    public List<TeacherReportMonthlyActivityDto> MonthlyActivity { get; set; } = new();
    public List<TeacherReportQuestionDto> Questions { get; set; } = new();
    public List<TeacherReportExamDto> Exams { get; set; } = new();
    public List<TeacherRecentSubmissionDto> RecentSubmissions { get; set; } = new();
}

public class TeacherReportMonthlyActivityDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Label { get; set; } = string.Empty;
    public int QuestionsCreated { get; set; }
    public int ExamAttempts { get; set; }
    public int PracticeAttempts { get; set; }
    public double AverageExamScore { get; set; }
    public decimal AveragePracticeScore { get; set; }
}

public class TeacherReportQuestionDto
{
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public string ChapterName { get; set; } = string.Empty;
    public int AnsweredCount { get; set; }
    public int CorrectCount { get; set; }
    public double CorrectRate { get; set; }
}

public class TeacherReportExamDto
{
    public Guid ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public bool IsPublished { get; set; }
    public bool IsSubmittedForApproval { get; set; }
    public int TotalQuestions { get; set; }
    public int AttemptCount { get; set; }
    public int ParticipatingStudentCount { get; set; }
    public double AverageScore { get; set; }
    public double HighestScore { get; set; }
    public double LowestScore { get; set; }
    public double PassRate { get; set; }
}

public class TeacherRecentSubmissionDto
{
    public Guid ExamResultId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public double Score { get; set; }
    public DateTime SubmittedAt { get; set; }
}
