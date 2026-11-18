using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetMyPracticeAttempts;

public record GetMyPracticeAttemptsQuery
    : IRequest<List<PracticeAttemptDto>>;
