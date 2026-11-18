using MediatR;

namespace OnlineExamSystem.Application.Features.Questions.Commands.CreateQuestion;

public class CreateQuestionCommand : IRequest<Guid>
{
    public string NoiDung { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string Difficulty { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public string Type { get; set; } = "single_choice";

    public string? Explanation { get; set; }

    // =========================
    // CHỈ NHẬN TOPIC
    // =========================

    public Guid TopicId { get; set; }
}
