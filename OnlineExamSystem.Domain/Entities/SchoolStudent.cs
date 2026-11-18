namespace OnlineExamSystem.Domain.Entities;

public class SchoolStudent
{
    public Guid Id { get; set; }

    public string MaHS { get; set; }
        = string.Empty;

    public string HoTen { get; set; }
        = string.Empty;

    public Guid GradeId { get; set; }

    public bool IsActive { get; set; }

    public Grade Grade { get; set; } = null!;
}