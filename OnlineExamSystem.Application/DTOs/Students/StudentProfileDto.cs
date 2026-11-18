namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentProfileDto
{
    public Guid Id { get; set; }

    public string HoTen { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string MaHS { get; set; } = string.Empty;

    public DateTime NgaySinh { get; set; }

    public string Lop { get; set; } = string.Empty;

    public Guid GradeId { get; set; }

    public string TenKhoi { get; set; } = string.Empty;

    public bool IsLocked { get; set; }

    public DateTime CreatedAt { get; set; }
}
