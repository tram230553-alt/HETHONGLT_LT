using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Exams.Commands.CreateExam;

public class CreateExamHandler : IRequestHandler<CreateExamCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateExamHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateExamCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacher = await _context.Teachers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (teacher == null)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        var tenBaiKT = request.TenBaiKT?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenBaiKT))
            throw new ArgumentException("Tên bài kiểm tra không được để trống.");
        if (tenBaiKT.Length > 255)
            throw new ArgumentException("Tên bài kiểm tra không được vượt quá 255 ký tự.");

        // Cấu hình của Admin áp dụng bắt buộc: sai thời gian hoặc sai số câu thì không được tạo đề.
        var config = await ExamConfigPolicy.LoadAsync(_context, cancellationToken);

        var duration = request.ThoiLuong > 0
            ? request.ThoiLuong
            : config.DurationMinutes;

        ExamConfigPolicy.EnsureDuration(config, duration);

        var questionIds = (request.QuestionIds ?? new List<Guid>())
            .Distinct()
            .ToList();

        ExamConfigPolicy.EnsureQuestionCount(config, questionIds.Count);

        var questions = await _context.Questions
            .AsNoTracking()
            .Where(x => questionIds.Contains(x.Id) && x.TeacherId == teacher.Id)
            .Select(x => new { x.Id, x.SubjectId, x.GradeId })
            .ToListAsync(cancellationToken);

        if (questions.Count != questionIds.Count)
            throw new KeyNotFoundException(
                "Có câu hỏi không tồn tại hoặc không thuộc giáo viên đang đăng nhập.");

        if (questions.Any(x => x.SubjectId != teacher.SubjectId || x.GradeId != teacher.GradeId))
            throw new InvalidOperationException("Có câu hỏi không cùng môn và khối với đề thi.");

        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            SubjectId = teacher.SubjectId,
            GradeId = teacher.GradeId,
            TeacherId = teacher.Id,
            TenBaiKT = tenBaiKT,
            ThoiLuong = duration,
            IsSubmittedForApproval = false,
            IsPublished = false
        };

        _context.Exams.Add(exam);

        // Tạo đề và các câu hỏi trong cùng một lần lưu: hoặc đủ hoặc không tạo gì.
        foreach (var questionId in questionIds)
        {
            _context.ExamQuestions.Add(new ExamQuestion
            {
                ExamId = exam.Id,
                QuestionId = questionId
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return exam.Id;
    }
}
