using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.StudentTopics.Queries.GetPracticeQuestionsByTopic
{
    public record GetPracticeQuestionsByTopicQuery(
        Guid TopicId
    ) : IRequest<List<StudentQuestionDto>>;
}