namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentWordPuzzleQuestionDto
{
    public Guid Id { get; set; }
    public string NoiDung { get; set; } = string.Empty;
    public string QuestionText => NoiDung;
    public string WordAnswer { get; set; } = string.Empty;
    public string DisplayAnswer { get; set; } = string.Empty;
    public string Hint { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
}
