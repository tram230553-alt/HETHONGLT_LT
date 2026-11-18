namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentDashboardDto
{
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public int TotalExamAttempts { get; set; }
    public int TotalPracticeAttempts { get; set; }
    public double AverageExamScore { get; set; }
    public decimal AveragePracticeScore { get; set; }
    public int CurrentStreak { get; set; }
    public int ActiveDaysLast7 { get; set; }
    public int AvailableExamCount { get; set; }
    public int ActiveTopicCount { get; set; }
    public List<StudentDashboardMonthlyDto> MonthlyActivity { get; set; } = new();
    public List<StudentDashboardSubjectDto> Subjects { get; set; } = new();
    public List<StudentDashboardExamDto> AvailableExams { get; set; } = new();
    public List<StudentDashboardActivityDto> RecentActivities { get; set; } = new();
}

public class StudentDashboardMonthlyDto
{
    public string Label { get; set; } = string.Empty;
    public int ExamAttempts { get; set; }
    public int PracticeAttempts { get; set; }
    public double AverageScore { get; set; }
}

public class StudentDashboardSubjectDto
{
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public int ExamAttempts { get; set; }
    public int PracticeAttempts { get; set; }
    public double AverageScore { get; set; }
}

public class StudentDashboardExamDto
{
    public Guid ExamId { get; set; }
    public Guid SubjectId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int TotalQuestions { get; set; }
}

public class StudentDashboardActivityDto
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public double Score { get; set; }
    public DateTime SubmittedAt { get; set; }
}
