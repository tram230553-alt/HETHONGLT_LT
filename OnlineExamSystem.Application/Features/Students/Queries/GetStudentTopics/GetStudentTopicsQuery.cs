using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetStudentTopics
{
    public record GetStudentTopicsQuery(
        Guid? SubjectId
    ) : IRequest<List<StudentTopicDto>>;
}