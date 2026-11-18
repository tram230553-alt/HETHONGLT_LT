namespace OnlineExamSystem.Application.DTOs.Teachers;

public class TeacherStudentResultDto
{
    public Guid StudentId { get; set; }
    public string MaHS { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public bool IsLocked { get; set; }

    public int CompletedExams { get; set; }
    public double AverageScore { get; set; }
    public int CorrectQuestion { get; set; }
    public int TotalQuestion { get; set; }
    public DateTime? LastSubmittedAt { get; set; }

    public List<TeacherStudentExamResultDto> Results { get; set; } = new();
}

public class TeacherStudentExamResultDto
{
    public Guid ExamResultId { get; set; }
    public Guid ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public double Score { get; set; }
    public int CorrectQuestion { get; set; }
    public int TotalQuestion { get; set; }
    public DateTime SubmittedAt { get; set; }
}
