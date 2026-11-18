using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Exams.Commands.RemoveQuestionFromExam;

public class RemoveQuestionFromExamHandler : IRequestHandler<RemoveQuestionFromExamCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RemoveQuestionFromExamHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(RemoveQuestionFromExamCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacherId = await _context.Teachers.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (!teacherId.HasValue)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        var exam = await _context.Exams.FirstOrDefaultAsync(
            x => x.Id == request.ExamId && x.TeacherId == teacherId.Value,
            cancellationToken);
        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi hoặc đề thi không thuộc giáo viên đang đăng nhập.");
        if (exam.IsPublished)
            throw new InvalidOperationException("Đề đã phát hành nên không thể thay đổi câu hỏi.");
        if (exam.IsSubmittedForApproval)
            throw new InvalidOperationException("Đề đang chờ Admin duyệt nên không thể thay đổi câu hỏi.");

        var examQuestion = await _context.ExamQuestions.FirstOrDefaultAsync(
            x => x.ExamId == request.ExamId && x.QuestionId == request.QuestionId,
            cancellationToken);
        if (examQuestion == null) return "Câu hỏi không còn trong đề thi.";

        _context.ExamQuestions.Remove(examQuestion);
        await _context.SaveChangesAsync(cancellationToken);
        return "Đã xóa câu hỏi khỏi đề thi.";
    }
}
