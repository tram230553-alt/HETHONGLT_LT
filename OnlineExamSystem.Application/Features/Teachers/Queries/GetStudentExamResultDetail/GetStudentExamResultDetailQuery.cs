using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetStudentExamResultDetail;

public class GetStudentExamResultDetailQuery
    : IRequest<TeacherExamResultDetailDto>
{
    public Guid ExamResultId { get; set; }
}
