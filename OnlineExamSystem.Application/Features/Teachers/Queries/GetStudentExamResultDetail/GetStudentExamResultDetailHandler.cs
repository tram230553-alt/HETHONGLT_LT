using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetStudentExamResultDetail;

public class GetStudentExamResultDetailHandler
    : IRequestHandler<GetStudentExamResultDetailQuery, TeacherExamResultDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetStudentExamResultDetailHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<TeacherExamResultDetailDto> Handle(
        GetStudentExamResultDetailQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacher = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new { x.Id, x.GradeId })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        // Cùng quy tắc với danh sách "Kết quả bài thi": chỉ xem bài thi của đề do
        // chính giáo viên tạo và học sinh thuộc đúng khối được phân công.
        var result = await _context.ExamResults
            .AsNoTracking()
            .Where(x =>
                x.Id == request.ExamResultId &&
                x.Exam.TeacherId == teacher.Id &&
                x.Student.GradeId == teacher.GradeId)
            .Select(x => new
            {
                x.Id,
                x.ExamId,
                ExamName = x.Exam.TenBaiKT,
                x.StudentId,
                x.Student.MaHS,
                x.Student.User.Ho,
                x.Student.User.TenDem,
                x.Student.User.Ten,
                x.Diem,
                x.SubmittedAt
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy bài thi của học sinh.");

        var rows = await _context.StudentAnswers
            .AsNoTracking()
            .Where(a => a.ExamResultId == request.ExamResultId)
            .OrderBy(a => a.Question.CreatedAt)
            .ThenBy(a => a.QuestionId)
            .Select(a => new
            {
                a.QuestionId,
                a.SelectedAnswer,
                a.IsCorrect,
                a.Question.NoiDung,
                a.Question.Type,
                a.Question.OptionA,
                a.Question.OptionB,
                a.Question.OptionC,
                a.Question.OptionD,
                a.Question.CorrectAnswer,
                a.Question.Explanation
            })
            .ToListAsync(cancellationToken);

        var questions = rows
            .Select((a, index) =>
            {
                var selected = QuestionAnswerHelper.NormalizeAnswerSet(a.SelectedAnswer);

                return new TeacherAttemptQuestionDetailDto
                {
                    QuestionId = a.QuestionId,
                    Order = index + 1,
                    QuestionText = a.NoiDung,
                    QuestionType = QuestionAnswerHelper.NormalizeType(a.Type),
                    OptionA = a.OptionA,
                    OptionB = a.OptionB,
                    OptionC = a.OptionC,
                    OptionD = a.OptionD,
                    SelectedAnswer = selected,
                    CorrectAnswer = QuestionAnswerHelper.NormalizeAnswerSet(a.CorrectAnswer),
                    IsCorrect = a.IsCorrect,
                    IsBlank = selected.Length == 0,
                    Explanation = a.Explanation
                };
            })
            .ToList();

        return new TeacherExamResultDetailDto
        {
            ExamResultId = result.Id,
            ExamId = result.ExamId,
            ExamName = result.ExamName,
            StudentId = result.StudentId,
            MaHS = result.MaHS,
            StudentName = string.Join(
                " ",
                new[] { result.Ho, result.TenDem, result.Ten }
                    .Where(x => !string.IsNullOrWhiteSpace(x))),
            Score = result.Diem,
            TotalQuestion = questions.Count,
            CorrectQuestion = questions.Count(x => x.IsCorrect),
            BlankQuestion = questions.Count(x => x.IsBlank),
            SubmittedAt = result.SubmittedAt,
            Questions = questions
        };
    }
}
