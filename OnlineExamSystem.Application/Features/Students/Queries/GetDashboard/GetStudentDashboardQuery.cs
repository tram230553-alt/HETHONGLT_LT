using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetDashboard;

public class GetStudentDashboardQuery : IRequest<StudentDashboardDto> { }
