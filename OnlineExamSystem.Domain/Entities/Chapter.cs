namespace OnlineExamSystem.Domain.Entities;

public class Chapter
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;
    public ICollection<Topic> Topics { get; set; } = new List<Topic>();
}
