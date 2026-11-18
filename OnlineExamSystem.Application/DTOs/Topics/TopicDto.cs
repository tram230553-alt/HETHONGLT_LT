public class TopicDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid SubjectId { get; set; }

    public string SubjectName { get; set; } = string.Empty;

    public Guid GradeId { get; set; }

    public string GradeName { get; set; } = string.Empty;

    public Guid ChapterId { get; set; }

    public string ChapterName { get; set; } = string.Empty;

    public int ChapterOrder { get; set; }

    public int OrderNum { get; set; }

    public bool IsActive { get; set; }

    public int QuestionCount { get; set; }
}