namespace OnlineExamSystem.Application.DTOs.Admin;

public class AdminAnalyticsReportDto
{
    public int TotalUsers { get; set; }
    public int LockedUsers { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalExams { get; set; }
    public int PublishedExams { get; set; }
    public int ExamAttemptCount { get; set; }
    public int PracticeAttemptCount { get; set; }
    public double AverageExamScore { get; set; }
    public decimal AveragePracticeScore { get; set; }
    public double ExamPassRate { get; set; }
    public List<AdminMonthlyActivityDto> MonthlyActivity { get; set; } = new();
    public List<AdminSubjectReportDto> Subjects { get; set; } = new();
    public List<AdminTeacherReportDto> Teachers { get; set; } = new();
    public List<AdminStudentReportDto> Students { get; set; } = new();
    public List<AdminExamReportDto> Exams { get; set; } = new();
}

public class AdminMonthlyActivityDto
{
    public string Label { get; set; } = string.Empty;
    public int NewUsers { get; set; }
    public int ExamAttempts { get; set; }
    public int PracticeAttempts { get; set; }
    public double AverageExamScore { get; set; }
    public decimal AveragePracticeScore { get; set; }
}

public class AdminSubjectReportDto
{
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public int ExamCount { get; set; }
    public int PublishedExamCount { get; set; }
    public int ExamAttemptCount { get; set; }
    public int PracticeAttemptCount { get; set; }
    public double AverageExamScore { get; set; }
}

public class AdminTeacherReportDto
{
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public int ExamCount { get; set; }
    public int PublishedExamCount { get; set; }
    public int ExamAttemptCount { get; set; }
    public double AverageStudentScore { get; set; }
}

public class AdminStudentReportDto
{
    public Guid StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public int ExamAttemptCount { get; set; }
    public int PracticeAttemptCount { get; set; }
    public double AverageExamScore { get; set; }
    public decimal AveragePracticeScore { get; set; }
    public DateTime? LastActivityAt { get; set; }
}

public class AdminExamReportDto
{
    public Guid ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public bool IsPublished { get; set; }
    public int TotalQuestions { get; set; }
    public int AttemptCount { get; set; }
    public int StudentCount { get; set; }
    public double AverageScore { get; set; }
    public double HighestScore { get; set; }
    public double LowestScore { get; set; }
    public double PassRate { get; set; }
}
