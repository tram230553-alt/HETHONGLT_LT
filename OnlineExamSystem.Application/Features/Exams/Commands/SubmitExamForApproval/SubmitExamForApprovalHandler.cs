using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Exams.Commands.SubmitExamForApproval;

public class SubmitExamForApprovalHandler
    : IRequestHandler<SubmitExamForApprovalCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SubmitExamForApprovalHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(
        SubmitExamForApprovalCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacherId = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!teacherId.HasValue)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        var exam = await _context.Exams
            .FirstOrDefaultAsync(
                x => x.Id == request.Id && x.TeacherId == teacherId.Value,
                cancellationToken);

        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi hoặc đề thi không thuộc giáo viên đang đăng nhập.");

        if (exam.IsPublished)
            throw new InvalidOperationException("Đề đã được Admin duyệt và phát hành.");

        if (exam.IsSubmittedForApproval)
            return "Đề thi đang chờ Admin duyệt.";

        // Chỉ gửi duyệt đề đúng cấu hình của Admin (thời gian và số câu).
        var config = await ExamConfigPolicy.LoadAsync(_context, cancellationToken);
        var questionCount = await _context.ExamQuestions
            .CountAsync(x => x.ExamId == request.Id, cancellationToken);

        ExamConfigPolicy.EnsureDuration(config, exam.ThoiLuong);
        ExamConfigPolicy.EnsureQuestionCount(config, questionCount);

        // Gửi lần đầu hoặc gửi lại sau khi bị từ chối: đề quay về trạng thái "Chờ Admin duyệt".
        // Lý do từ chối lần trước vẫn được giữ lại để Admin đối chiếu.
        var wasRejected = exam.IsRejected;

        exam.IsSubmittedForApproval = true;
        exam.IsRejected = false;

        await _context.SaveChangesAsync(cancellationToken);

        return wasRejected
            ? "Đã gửi lại đề thi cho Admin duyệt."
            : "Đã gửi đề thi cho Admin duyệt.";
    }
}
