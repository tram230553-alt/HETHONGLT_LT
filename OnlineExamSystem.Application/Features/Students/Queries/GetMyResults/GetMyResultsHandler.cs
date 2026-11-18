using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetMyResults;

public class GetMyResultsHandler
    : IRequestHandler<GetMyResultsQuery, List<StudentResultDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyResultsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<StudentResultDto>> Handle(
        GetMyResultsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được học sinh đang đăng nhập.");
        }

        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (student == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy hồ sơ học sinh.");
        }

        var attempts = await _context.ExamResults
            .AsNoTracking()
            .Include(x => x.Exam)
            .Include(x => x.StudentAnswers)
            .Where(x => x.StudentId == student.Id)
            .OrderBy(x => x.SubmittedAt)
            .Select(x => new StudentResultDto
            {
                ExamResultId = x.Id,
                ExamId = x.ExamId,
                TenBaiKT = x.Exam.TenBaiKT,
                Diem = x.Diem,
                CorrectQuestion = x.StudentAnswers.Count(a => a.IsCorrect),
                TotalQuestion = x.StudentAnswers.Count,
                SubmittedAt = x.SubmittedAt
            })
            .ToListAsync(cancellationToken);

        foreach (var group in attempts.GroupBy(x => x.ExamId))
        {
            var number = 1;
            foreach (var item in group.OrderBy(x => x.SubmittedAt))
            {
                item.AttemptNumber = number++;
            }
        }

        return attempts
            .OrderByDescending(x => x.SubmittedAt)
            .ToList();
    }
}
