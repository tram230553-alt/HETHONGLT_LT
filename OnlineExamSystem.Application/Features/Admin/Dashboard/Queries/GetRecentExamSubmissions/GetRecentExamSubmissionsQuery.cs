using MediatR;
using OnlineExamSystem.Application.DTOs.Admin;

namespace OnlineExamSystem.Application.Features.Admin.Dashboard.Queries.GetRecentExamSubmissions;

public class GetRecentExamSubmissionsQuery
    : IRequest<List<AdminExamSubmissionLogDto>>
{
    public int Limit { get; set; } = 10;
}
