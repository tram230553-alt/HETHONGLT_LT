using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Exams.Commands.DeleteExam;

public class DeleteExamHandler : IRequestHandler<DeleteExamCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteExamHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(DeleteExamCommand request, CancellationToken cancellationToken)
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
            x => x.Id == request.Id && x.TeacherId == teacherId.Value,
            cancellationToken);
        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi hoặc đề thi không thuộc giáo viên đang đăng nhập.");
        if (exam.IsPublished)
            throw new InvalidOperationException("Đề đã phát hành nên không thể xóa.");
        if (exam.IsSubmittedForApproval)
            throw new InvalidOperationException("Đề đang chờ Admin duyệt nên không thể xóa.");

        var hasResults = await _context.ExamResults.AnyAsync(x => x.ExamId == request.Id, cancellationToken);
        if (hasResults)
            throw new InvalidOperationException("Không thể xóa đề đã có kết quả làm bài.");

        var examQuestions = await _context.ExamQuestions
            .Where(x => x.ExamId == request.Id)
            .ToListAsync(cancellationToken);
        foreach (var item in examQuestions)
            _context.ExamQuestions.Remove(item);

        _context.Exams.Remove(exam);
        await _context.SaveChangesAsync(cancellationToken);
        return "Xóa đề thi thành công.";
    }
}
