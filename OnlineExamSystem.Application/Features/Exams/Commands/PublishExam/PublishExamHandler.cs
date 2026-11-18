using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Exams.Commands.PublishExam;

public class PublishExamHandler : IRequestHandler<PublishExamCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public PublishExamHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(
        PublishExamCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.Role != "Admin")
            throw new UnauthorizedAccessException(
                "Chỉ Admin mới được duyệt và phát hành đề thi.");

        var exam = await _context.Exams
            .FirstOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (exam.IsPublished)
            return "Đề thi đã được phát hành.";

        if (!exam.IsSubmittedForApproval)
            throw new InvalidOperationException(
                "Giáo viên chưa gửi đề thi này để Admin duyệt.");

        // Cấu hình có thể đã đổi sau khi giáo viên gửi duyệt: đề sai cấu hình không được phát hành.
        var config = await ExamConfigPolicy.LoadAsync(_context, cancellationToken);
        var questionCount = await _context.ExamQuestions
            .CountAsync(x => x.ExamId == request.Id, cancellationToken);

        try
        {
            ExamConfigPolicy.EnsureDuration(config, exam.ThoiLuong);
            ExamConfigPolicy.EnsureQuestionCount(config, questionCount);
        }
        catch (ArgumentException ex)
        {
            throw new InvalidOperationException(
                ex.Message + " Hãy từ chối đề để giáo viên chỉnh sửa.");
        }

        exam.IsPublished = true;
        exam.IsSubmittedForApproval = false;

        // Đề đã được duyệt: các lý do từ chối trước đó không còn hiệu lực.
        exam.IsRejected = false;
        exam.RejectionReasonCodes = null;
        exam.RejectionNote = null;
        exam.RejectedAt = null;

        await _context.SaveChangesAsync(cancellationToken);

        return "Admin đã duyệt và phát hành đề thi.";
    }
}
