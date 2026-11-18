using MediatR;

public record GetTopicByIdQuery(Guid Id)
    : IRequest<TopicDto>;