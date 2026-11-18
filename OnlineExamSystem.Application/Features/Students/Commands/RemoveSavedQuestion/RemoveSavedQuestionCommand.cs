using MediatR;

namespace OnlineExamSystem.Application.Features.Students
    .Commands.RemoveSavedQuestion;

public class RemoveSavedQuestionCommand
    : IRequest<bool>
{
    public Guid QuestionId { get; set; }
}