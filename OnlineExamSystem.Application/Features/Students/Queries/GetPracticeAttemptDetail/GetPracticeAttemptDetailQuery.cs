using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetPracticeAttemptDetail;

public record GetPracticeAttemptDetailQuery(Guid AttemptId)
    : IRequest<PracticeAttemptDetailDto>;
