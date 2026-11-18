namespace OnlineExamSystem.Application.DTOs.Teachers;

public class TeacherDto
{
    public Guid Id { get; set; }

    public string HoTen { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string SDT { get; set; } = string.Empty;

    public Guid SubjectId { get; set; }

    public string? TenMH { get; set; }

    public Guid GradeId { get; set; }

    public string? TenKhoi { get; set; }

    public bool IsLocked { get; set; }

    public DateTime CreatedAt { get; set; }

    public int QuestionsCount { get; set; }

    public int ExamsCount { get; set; }
}