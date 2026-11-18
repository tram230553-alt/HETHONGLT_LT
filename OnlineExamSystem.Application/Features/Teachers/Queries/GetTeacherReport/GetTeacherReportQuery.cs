using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetTeacherReport;

public class GetTeacherReportQuery : IRequest<TeacherReportDto>
{
}
