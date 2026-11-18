using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetLoginSessions;

public record GetStudentLoginSessionsQuery : IRequest<List<StudentLoginSessionDto>>;
