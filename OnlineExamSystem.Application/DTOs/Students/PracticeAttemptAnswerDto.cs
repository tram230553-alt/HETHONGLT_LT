namespace OnlineExamSystem.Application.DTOs.Students;

public class PracticeAttemptAnswerDto
{
    public Guid QuestionId { get; set; }

    public int QuestionOrder { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string? StudentAnswer { get; set; }

    public string CorrectAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public string? Explanation { get; set; }
}
