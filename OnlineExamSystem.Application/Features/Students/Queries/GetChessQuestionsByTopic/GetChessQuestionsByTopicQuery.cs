using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetChessQuestionsByTopic;

public record GetChessQuestionsByTopicQuery(Guid TopicId)
    : IRequest<List<StudentChessQuestionDto>>;
