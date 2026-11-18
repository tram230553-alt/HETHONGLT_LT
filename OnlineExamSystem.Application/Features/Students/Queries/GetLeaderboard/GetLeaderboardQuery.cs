using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students
    .Queries.GetLeaderboard;

public class GetLeaderboardQuery
    : IRequest<List<StudentLeaderboardDto>>
{
    public Guid? GradeId { get; set; }

    public Guid? SubjectId { get; set; }

    public int Limit { get; set; } = 10;
}