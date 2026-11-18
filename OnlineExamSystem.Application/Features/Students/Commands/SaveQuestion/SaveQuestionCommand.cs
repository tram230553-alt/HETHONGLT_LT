using MediatR;

namespace OnlineExamSystem.Application.Features.Students
    .Commands.SaveQuestion;

public class SaveQuestionCommand
    : IRequest<bool>
{
    public Guid QuestionId { get; set; }
}