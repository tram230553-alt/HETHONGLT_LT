namespace OnlineExamSystem.Application.DTOs.Admin;

public class AdminExamSubmissionLogDto
{
    public Guid ExamResultId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public Guid ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public double Score { get; set; }
    public bool IsPassed { get; set; }
}
