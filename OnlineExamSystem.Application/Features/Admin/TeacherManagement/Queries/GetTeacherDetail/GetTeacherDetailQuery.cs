using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Queries.GetTeacherDetail;

public class GetTeacherDetailQuery : IRequest<AdminTeacherDetailDto>
{
    public Guid TeacherId { get; set; }
}
