using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetWordPuzzleQuestionsByTopic;

public record GetWordPuzzleQuestionsByTopicQuery(Guid TopicId)
    : IRequest<List<StudentWordPuzzleQuestionDto>>;
