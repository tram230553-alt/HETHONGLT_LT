namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentChessQuestionDto
{
    public Guid Id { get; set; }
    public string NoiDung { get; set; } = string.Empty;
    public string QuestionText => NoiDung;
    public string Type { get; set; } = "true_false";
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public bool IsTrue { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
}
