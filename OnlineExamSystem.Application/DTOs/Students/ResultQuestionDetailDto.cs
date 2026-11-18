namespace OnlineExamSystem.Application.DTOs.Students;

public class ResultQuestionDetailDto
{
    public Guid QuestionId { get; set; }

    public string NoiDung { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string SelectedAnswer { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }
}
