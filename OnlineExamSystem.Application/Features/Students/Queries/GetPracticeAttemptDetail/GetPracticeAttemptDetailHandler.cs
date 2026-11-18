using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetPracticeAttemptDetail;

public class GetPracticeAttemptDetailHandler
    : IRequestHandler<GetPracticeAttemptDetailQuery, PracticeAttemptDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetPracticeAttemptDetailHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<PracticeAttemptDetailDto> Handle(
        GetPracticeAttemptDetailQuery request,
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

        var attempt = await _context.PracticeAttempts
            .AsNoTracking()
            .Include(x => x.Topic)
                .ThenInclude(x => x.Subject)
            .Include(x => x.Topic)
                .ThenInclude(x => x.Chapter)
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(
                x =>
                    x.Id == request.AttemptId &&
                    x.StudentId == studentId.Value,
                cancellationToken);

        if (attempt == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy kết quả luyện tập.");
        }

        return new PracticeAttemptDetailDto
        {
            Id = attempt.Id,
            TopicId = attempt.TopicId,
            TopicName = attempt.Topic.Name,
            SubjectName = attempt.Topic.Subject.TenMH,
            ChapterName = attempt.Topic.Chapter?.Name ?? "Chưa phân chương",
            ChapterOrder = attempt.Topic.Chapter?.Order ?? 0,
            OrderNum = attempt.Topic.OrderNum,
            Score = attempt.Score,
            TotalQuestions = attempt.TotalQuestions,
            AnsweredQuestions = attempt.AnsweredQuestions,
            CorrectAnswers = attempt.CorrectAnswers,
            WrongAnswers = attempt.WrongAnswers,
            SubmittedAt = attempt.SubmittedAt,
            Answers = attempt.Answers
                .OrderBy(x => x.QuestionOrder)
                .Select(x => new PracticeAttemptAnswerDto
                {
                    QuestionId = x.QuestionId,
                    QuestionOrder = x.QuestionOrder,
                    QuestionText = x.QuestionText,
                    OptionA = x.OptionA,
                    OptionB = x.OptionB,
                    OptionC = x.OptionC,
                    OptionD = x.OptionD,
                    StudentAnswer = x.StudentAnswer,
                    CorrectAnswer = x.CorrectAnswer,
                    IsCorrect = x.IsCorrect,
                    Explanation = x.Explanation
                })
                .ToList()
        };
    }
}
