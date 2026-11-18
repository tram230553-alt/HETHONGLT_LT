public class QuestionAnswerResultDto
{
    public Guid QuestionId { get; set; }

    public string UserAnswer { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public string? Explanation { get; set; }
}