using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Admin;

namespace OnlineExamSystem.Application.Features.Admin.Dashboard.Queries.GetRecentExamSubmissions;

public class GetRecentExamSubmissionsHandler
    : IRequestHandler<GetRecentExamSubmissionsQuery, List<AdminExamSubmissionLogDto>>
{
    private const double PassingScore = 5d;
    private readonly IApplicationDbContext _context;

    public GetRecentExamSubmissionsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminExamSubmissionLogDto>> Handle(
        GetRecentExamSubmissionsQuery request,
        CancellationToken cancellationToken)
    {
        var limit = Math.Clamp(request.Limit, 1, 100);

        return await (
            from result in _context.ExamResults.AsNoTracking()
            join student in _context.Students.AsNoTracking()
                on result.StudentId equals student.Id
            join user in _context.Users.AsNoTracking()
                on student.UserId equals user.Id
            join grade in _context.Grades.AsNoTracking()
                on student.GradeId equals grade.Id
            join exam in _context.Exams.AsNoTracking()
                on result.ExamId equals exam.Id
            join subject in _context.Subjects.AsNoTracking()
                on exam.SubjectId equals subject.Id
            orderby result.SubmittedAt descending, result.Id descending
            select new AdminExamSubmissionLogDto
            {
                ExamResultId = result.Id,
                StudentId = student.Id,
                StudentCode = student.MaHS,
                StudentName = ((user.Ho ?? "") + " " +
                               (user.TenDem ?? "") + " " +
                               (user.Ten ?? "")).Trim(),
                GradeName = grade.TenKhoi,
                ExamId = exam.Id,
                ExamName = exam.TenBaiKT,
                SubjectName = subject.TenMH,
                SubmittedAt = result.SubmittedAt,
                Score = result.Diem,
                IsPassed = result.Diem >= PassingScore
            })
            .Take(limit)
            .ToListAsync(cancellationToken);
    }
}
