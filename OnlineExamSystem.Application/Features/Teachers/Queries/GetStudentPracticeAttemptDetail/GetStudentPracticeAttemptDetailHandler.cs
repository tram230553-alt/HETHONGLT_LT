using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetStudentPracticeAttemptDetail;

public class GetStudentPracticeAttemptDetailHandler
    : IRequestHandler<GetStudentPracticeAttemptDetailQuery, TeacherPracticeAttemptDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetStudentPracticeAttemptDetailHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<TeacherPracticeAttemptDetailDto> Handle(
        GetStudentPracticeAttemptDetailQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacher = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new { x.SubjectId, x.GradeId })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        // Cùng quy tắc với danh sách "Kết quả luyện tập": đúng môn + đúng khối giáo viên phụ trách.
        var attempt = await _context.PracticeAttempts
            .AsNoTracking()
            .Where(x =>
                x.Id == request.AttemptId &&
                x.Topic.SubjectId == teacher.SubjectId &&
                x.Topic.GradeId == teacher.GradeId &&
                x.Student.GradeId == teacher.GradeId)
            .Select(x => new
            {
                x.Id,
                x.TopicId,
                TopicName = x.Topic.Name,
                ChapterName = x.Topic.Chapter.Name,
                ChapterOrder = x.Topic.Chapter.Order,
                x.Topic.OrderNum,
                x.StudentId,
                x.Student.MaHS,
                x.Student.User.Ho,
                x.Student.User.TenDem,
                x.Student.User.Ten,
                x.Score,
                x.SubmittedAt
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt luyện tập của học sinh.");

        // PracticeAnswer lưu snapshot nội dung câu hỏi lúc học sinh nộp bài,
        // nên giáo viên thấy đúng những gì học sinh đã thấy.
        var rows = await _context.PracticeAnswers
            .AsNoTracking()
            .Where(x => x.PracticeAttemptId == request.AttemptId)
            .OrderBy(x => x.QuestionOrder)
            .Select(x => new
            {
                x.QuestionId,
                x.QuestionOrder,
                x.QuestionText,
                QuestionType = x.Question.Type,
                x.OptionA,
                x.OptionB,
                x.OptionC,
                x.OptionD,
                x.StudentAnswer,
                x.CorrectAnswer,
                x.IsCorrect,
                x.Explanation
            })
            .ToListAsync(cancellationToken);

        var questions = rows
            .Select((x, index) =>
            {
                var selected = QuestionAnswerHelper.NormalizeAnswerSet(x.StudentAnswer);

                return new TeacherAttemptQuestionDetailDto
                {
                    QuestionId = x.QuestionId,
                    Order = index + 1,
                    QuestionText = x.QuestionText,
                    QuestionType = QuestionAnswerHelper.NormalizeType(x.QuestionType),
                    OptionA = x.OptionA,
                    OptionB = x.OptionB,
                    OptionC = x.OptionC,
                    OptionD = x.OptionD,
                    SelectedAnswer = selected,
                    CorrectAnswer = QuestionAnswerHelper.NormalizeAnswerSet(x.CorrectAnswer),
                    IsCorrect = x.IsCorrect,
                    IsBlank = selected.Length == 0,
                    Explanation = x.Explanation
                };
            })
            .ToList();

        return new TeacherPracticeAttemptDetailDto
        {
            AttemptId = attempt.Id,
            TopicId = attempt.TopicId,
            TopicName = attempt.TopicName,
            ChapterName = attempt.ChapterName,
            ChapterOrder = attempt.ChapterOrder,
            OrderNum = attempt.OrderNum,
            StudentId = attempt.StudentId,
            MaHS = attempt.MaHS,
            StudentName = string.Join(
                " ",
                new[] { attempt.Ho, attempt.TenDem, attempt.Ten }
                    .Where(x => !string.IsNullOrWhiteSpace(x))),
            Score = attempt.Score,
            TotalQuestions = questions.Count,
            CorrectAnswers = questions.Count(x => x.IsCorrect),
            WrongAnswers = questions.Count(x => !x.IsCorrect),
            BlankQuestions = questions.Count(x => x.IsBlank),
            SubmittedAt = attempt.SubmittedAt,
            Questions = questions
        };
    }
}
