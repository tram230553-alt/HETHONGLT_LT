namespace OnlineExamSystem.Domain.Entities;

public class Student
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid GradeId { get; set; }

    public string MaHS { get; set; } = string.Empty;
    public DateTime NgaySinh { get; set; }

    public User User { get; set; } = null!;

    public Grade Grade { get; set; } = null!;

    public ICollection<ExamResult> ExamResults { get; set; }
        = new List<ExamResult>();
}
