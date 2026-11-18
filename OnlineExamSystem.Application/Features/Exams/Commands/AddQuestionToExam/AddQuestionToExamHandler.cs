using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Exams.Commands.AddQuestionToExam;

public class AddQuestionToExamHandler : IRequestHandler<AddQuestionToExamCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AddQuestionToExamHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(AddQuestionToExamCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacher = await _context.Teachers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (teacher == null)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        var exam = await _context.Exams.FirstOrDefaultAsync(
            x => x.Id == request.ExamId && x.TeacherId == teacher.Id,
            cancellationToken);
        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi hoặc đề thi không thuộc giáo viên đang đăng nhập.");
        if (exam.IsPublished)
            throw new InvalidOperationException("Đề đã phát hành nên không thể thay đổi câu hỏi.");
        if (exam.IsSubmittedForApproval)
            throw new InvalidOperationException("Đề đang chờ Admin duyệt nên không thể thay đổi câu hỏi.");

        var question = await _context.Questions.AsNoTracking().FirstOrDefaultAsync(
            x => x.Id == request.QuestionId && x.TeacherId == teacher.Id,
            cancellationToken);
        if (question == null)
            throw new KeyNotFoundException("Không tìm thấy câu hỏi hoặc câu hỏi không thuộc giáo viên đang đăng nhập.");
        if (question.SubjectId != exam.SubjectId || question.GradeId != exam.GradeId)
            throw new InvalidOperationException("Câu hỏi không cùng môn và khối với đề thi.");

        var exists = await _context.ExamQuestions.AnyAsync(
            x => x.ExamId == request.ExamId && x.QuestionId == request.QuestionId,
            cancellationToken);
        if (exists) return "Câu hỏi đã có trong đề thi.";

        var config = await ExamConfigPolicy.LoadAsync(_context, cancellationToken);
        var currentCount = await _context.ExamQuestions.CountAsync(
            x => x.ExamId == request.ExamId,
            cancellationToken);
        if (currentCount >= config.QuestionCount)
            throw new InvalidOperationException(
                $"Đề thi đã đủ {config.QuestionCount} câu theo cấu hình của Admin.");

        _context.ExamQuestions.Add(new ExamQuestion
        {
            ExamId = request.ExamId,
            QuestionId = request.QuestionId
        });
        await _context.SaveChangesAsync(cancellationToken);
        return "Thêm câu hỏi vào đề thành công.";
    }
}
