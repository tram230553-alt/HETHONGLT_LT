using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetMyPracticeAttempts;

public class GetMyPracticeAttemptsHandler
    : IRequestHandler<GetMyPracticeAttemptsQuery, List<PracticeAttemptDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyPracticeAttemptsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<PracticeAttemptDto>> Handle(
        GetMyPracticeAttemptsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được học sinh đang đăng nhập.");
        }

        var studentId = await _context.Students
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!studentId.HasValue)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy hồ sơ học sinh.");
        }

        return await _context.PracticeAttempts
            .AsNoTracking()
            .Where(x => x.StudentId == studentId.Value)
            .OrderByDescending(x => x.SubmittedAt)
            .Select(x => new PracticeAttemptDto
            {
                Id = x.Id,
                TopicId = x.TopicId,
                TopicName = x.Topic.Name,
                SubjectName = x.Topic.Subject.TenMH,
                ChapterName = x.Topic.Chapter.Name,
                ChapterOrder = x.Topic.Chapter.Order,
                OrderNum = x.Topic.OrderNum,
                Score = x.Score,
                TotalQuestions = x.TotalQuestions,
                AnsweredQuestions = x.AnsweredQuestions,
                CorrectAnswers = x.CorrectAnswers,
                WrongAnswers = x.WrongAnswers,
                SubmittedAt = x.SubmittedAt
            })
            .ToListAsync(cancellationToken);
    }
}
