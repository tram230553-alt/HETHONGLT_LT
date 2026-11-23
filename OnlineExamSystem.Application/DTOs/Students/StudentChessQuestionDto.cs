namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentChessQuestionDto
{
    public Guid Id { get; set; }
    public string NoiDung { get; set; } = string.Empty;
    public string QuestionText => NoiDung;
    public bool IsTrue { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
}
