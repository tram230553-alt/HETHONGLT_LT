using MediatR;

namespace OnlineExamSystem.Application.Features.Topics.Commands.CreateTopic
{
    public record CreateTopicCommand(
        string Name,
        string? Description,
        Guid SubjectId,
        Guid GradeId,
        Guid ChapterId,
        int OrderNum,
        bool IsActive
    ) : IRequest<Guid>;
}
