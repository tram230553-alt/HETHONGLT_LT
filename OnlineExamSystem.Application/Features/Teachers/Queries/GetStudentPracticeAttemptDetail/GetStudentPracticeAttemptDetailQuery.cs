using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetStudentPracticeAttemptDetail;

public class GetStudentPracticeAttemptDetailQuery
    : IRequest<TeacherPracticeAttemptDetailDto>
{
    public Guid AttemptId { get; set; }
}
