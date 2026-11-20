using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetResultDetail;

public class GetResultDetailHandler
    : IRequestHandler<GetResultDetailQuery, ResultDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetResultDetailHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ResultDetailDto> Handle(
        GetResultDetailQuery request,
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

        var query = _context.ExamResults
            .AsNoTracking()
            .Include(x => x.Exam)
            .Include(x => x.StudentAnswers)
                .ThenInclude(x => x.Question)
            .Where(x => x.StudentId == student.Id);

        var result = request.ExamResultId.HasValue
            ? await query.FirstOrDefaultAsync(
                x => x.Id == request.ExamResultId.Value,
                cancellationToken)
            : await query
                .Where(x => x.ExamId == request.ExamId)
                .OrderByDescending(x => x.SubmittedAt)
                .FirstOrDefaultAsync(cancellationToken);

        if (result == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy kết quả bài thi. Bạn chỉ có thể xem đáp án sau khi đã nộp bài.");
        }

        var questionDetails = result.StudentAnswers
            .Select(answer => new ResultQuestionDetailDto
            {
                QuestionId = answer.QuestionId,
                NoiDung = answer.Question.NoiDung,
                OptionA = answer.Question.OptionA,
                OptionB = answer.Question.OptionB,
                OptionC = answer.Question.OptionC,
                OptionD = answer.Question.OptionD,
                SelectedAnswer = NormalizeAnswer(answer.SelectedAnswer, answer.Question.Type),
                CorrectAnswer = NormalizeAnswer(answer.Question.CorrectAnswer, answer.Question.Type),
                Type = answer.Question.Type,
                IsCorrect = answer.IsCorrect
            })
            .ToList();

        return new ResultDetailDto
        {
            ExamId = result.ExamId,
            TenBaiKT = result.Exam.TenBaiKT,
            Diem = result.Diem,
            TotalQuestion = questionDetails.Count,
            CorrectQuestion = questionDetails.Count(x => x.IsCorrect),
            SubmittedAt = result.SubmittedAt,
            Questions = questionDetails
        };
    }

    private static string NormalizeAnswer(string? value, string? type)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var normType = QuestionAnswerHelper.NormalizeType(type);
        if (normType == "essay") return value.Trim();
        if (normType == "true_false") return QuestionAnswerHelper.NormalizeTrueFalseAnswer(value);
        return value.Trim().ToUpperInvariant();
    }
}
