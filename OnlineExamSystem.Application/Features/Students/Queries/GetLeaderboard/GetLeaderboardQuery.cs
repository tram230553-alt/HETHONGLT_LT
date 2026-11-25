using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students
    .Queries.GetLeaderboard;

public class GetLeaderboardQuery
    : IRequest<List<StudentLeaderboardDto>>
{
    public Guid? GradeId { get; set; }

    public Guid? SubjectId { get; set; }

    /// <summary>
    /// "all" (Tổng hợp), "practice" (Luyện tập), "exam" (Luyện thi)
    /// </summary>
    public string? Mode { get; set; } = "all";

    public int Limit { get; set; } = 50;
}
