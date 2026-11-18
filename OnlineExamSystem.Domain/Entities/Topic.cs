using OnlineExamSystem.Domain.Entities;

public class Topic
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;

    public bool IsActive { get; set; } = true;
    public Guid ChapterId { get; set; }
    public Chapter Chapter { get; set; } = null!;

    public int OrderNum { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Question> Questions { get; set; }
        = new List<Question>();
}