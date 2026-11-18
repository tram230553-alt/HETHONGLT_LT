using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.DTOs.Students;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Students.Commands.SubmitExam;

public class SubmitExamHandler
    : IRequestHandler<SubmitExamCommand, SubmitExamResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SubmitExamHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SubmitExamResponseDto> Handle(
        SubmitExamCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được học sinh đang đăng nhập.");
        }

        var student = await _context.Students
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (student == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy hồ sơ học sinh.");
        }

        var exam = await _context.Exams
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.ExamId,
                cancellationToken);

        if (exam == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy đề thi.");
        }

        if (!exam.IsPublished)
        {
            throw new InvalidOperationException(
                "Đề thi chưa được phát hành.");
        }

        if (exam.GradeId != student.GradeId)
        {
            throw new UnauthorizedAccessException(
                "Bạn không được phép làm đề thi của khối khác.");
        }

        var previousAttemptCount = await _context.ExamResults
            .CountAsync(
                x => x.StudentId == student.Id &&
                     x.ExamId == request.ExamId,
                cancellationToken);

        if (!request.IsRetake && previousAttemptCount > 0)
        {
            throw new InvalidOperationException(
                "Bạn đã nộp bài thi này rồi. Hãy dùng chức năng Làm lại trong trang Kết quả.");
        }

        if (request.IsRetake && previousAttemptCount == 0)
        {
            throw new InvalidOperationException(
                "Bạn chưa có lượt thi trước đó để làm lại.");
        }

        var examQuestions = await _context.ExamQuestions
            .AsNoTracking()
            .Include(x => x.Question)
            .Where(x => x.ExamId == request.ExamId)
            .ToListAsync(cancellationToken);

        if (examQuestions.Count == 0)
        {
            throw new InvalidOperationException(
                "Đề thi chưa có câu hỏi.");
        }

        var answers = request.Answers ?? new List<StudentAnswerDto>();

        var duplicateQuestion = answers
            .GroupBy(x => x.QuestionId)
            .Any(x => x.Count() > 1);

        if (duplicateQuestion)
        {
            throw new InvalidOperationException(
                "Không được gửi nhiều đáp án cho cùng một câu hỏi.");
        }

        var examQuestionIds = examQuestions
            .Select(x => x.QuestionId)
            .ToHashSet();

        if (answers.Any(x => !examQuestionIds.Contains(x.QuestionId)))
        {
            throw new InvalidOperationException(
                "Bài nộp chứa câu hỏi không thuộc đề thi.");
        }

        foreach (var answer in answers)
        {
            if (!QuestionAnswerHelper.IsValidSubmittedAnswer(answer.SelectedAnswer))
            {
                throw new InvalidOperationException(
                    "Đáp án chỉ được gồm các giá trị A, B, C, D và không được lặp.");
            }

            answer.SelectedAnswer = QuestionAnswerHelper.NormalizeAnswerSet(answer.SelectedAnswer);

            var question = examQuestions.First(x => x.QuestionId == answer.QuestionId).Question;
            if (QuestionAnswerHelper.NormalizeType(question.Type) == "single_choice" &&
                answer.SelectedAnswer.Contains(','))
            {
                throw new InvalidOperationException("Câu hỏi một đáp án chỉ được chọn một phương án.");
            }
        }

        var answersByQuestion = answers
            .ToDictionary(x => x.QuestionId, x => x.SelectedAnswer);

        var total = examQuestions.Count;
        var correct = 0;

        var examResult = new ExamResult
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            ExamId = request.ExamId,
            SubmittedAt = DateTime.UtcNow,
            StudentAnswers = new List<StudentAnswer>()
        };

        foreach (var item in examQuestions)
        {
            answersByQuestion.TryGetValue(
                item.QuestionId,
                out var selectedAnswer);

            selectedAnswer ??= string.Empty;

            var isCorrect =
                !string.IsNullOrWhiteSpace(selectedAnswer) &&
                string.Equals(
                    selectedAnswer,
                    QuestionAnswerHelper.NormalizeAnswerSet(item.Question.CorrectAnswer),
                    StringComparison.OrdinalIgnoreCase);

            if (isCorrect)
            {
                correct++;
            }

            examResult.StudentAnswers.Add(
                new StudentAnswer
                {
                    Id = Guid.NewGuid(),
                    ExamResultId = examResult.Id,
                    QuestionId = item.QuestionId,
                    SelectedAnswer = selectedAnswer,
                    IsCorrect = isCorrect
                });
        }

        var score = Math.Round(
            (double)correct / total * 10,
            2,
            MidpointRounding.AwayFromZero);

        examResult.Diem = score;

        _context.ExamResults.Add(examResult);

        await _context.SaveChangesAsync(cancellationToken);

        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

        return new SubmitExamResponseDto
        {
            ExamResultId = examResult.Id,
            Diem = score,
            TotalQuestion = total,
            CorrectQuestion = correct,
            AttemptNumber = previousAttemptCount + 1,
            ShowResultAfterSubmit = settings?.ShowExamResultAfterSubmit ?? true
        };
    }

}
