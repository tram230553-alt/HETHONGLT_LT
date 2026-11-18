using MediatR;

public record GetTopicsQuery(
    Guid? SubjectId,
    Guid? GradeId
) : IRequest<List<TopicDto>>;