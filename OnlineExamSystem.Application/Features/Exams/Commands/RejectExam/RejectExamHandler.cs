using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Exams.Commands.RejectExam;

public class RejectExamHandler : IRequestHandler<RejectExamCommand, string>
{
    private const int MaxTitleLength = 250;

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RejectExamHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(
        RejectExamCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.Role != "Admin")
            throw new UnauthorizedAccessException(
                "Chỉ Admin mới được từ chối đề thi.");

        if (!Guid.TryParse(_currentUser.UserId, out var adminUserId))
            throw new UnauthorizedAccessException(
                "Không xác định được Admin đang đăng nhập.");

        // ===== Kiểm tra lý do từ chối =====
        var codes = (request.ReasonCodes ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        if (codes.Count == 0)
            throw new ArgumentException(
                "Vui lòng chọn ít nhất một lý do từ chối đề thi.");

        var invalid = codes.FirstOrDefault(x => !ExamRejectionReasons.IsValid(x));
        if (invalid != null)
            throw new ArgumentException(
                $"Lý do từ chối không hợp lệ: {invalid}.");

        var note = request.Note?.Trim();
        if (string.IsNullOrWhiteSpace(note))
            note = null;

        if (note != null && note.Length > ExamRejectionReasons.MaxNoteLength)
            throw new ArgumentException(
                $"Ghi chú không được vượt quá {ExamRejectionReasons.MaxNoteLength} ký tự.");

        if (codes.Contains(ExamRejectionReasons.Other) && note == null)
            throw new ArgumentException(
                "Vui lòng nhập nội dung chi tiết khi chọn \"Lý do khác\".");

        // ===== Kiểm tra trạng thái đề =====
        var exam = await _context.Exams
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (exam.IsPublished)
            throw new InvalidOperationException(
                "Đề đã phát hành nên không thể từ chối.");

        if (!exam.IsSubmittedForApproval)
            throw new InvalidOperationException(
                "Chỉ có thể từ chối đề đang chờ Admin duyệt.");

        var teacherUserId = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.Id == exam.TeacherId)
            .Select(x => (Guid?)x.UserId)
            .FirstOrDefaultAsync(cancellationToken);

        // ===== Chuyển trạng thái → Bị từ chối và lưu lý do =====
        var now = DateTime.UtcNow;

        exam.IsSubmittedForApproval = false;
        exam.IsRejected = true;
        exam.RejectionReasonCodes = string.Join(",", codes);
        exam.RejectionNote = note;
        exam.RejectedAt = now;

        // ===== Thông báo riêng cho giáo viên sở hữu đề =====
        if (teacherUserId.HasValue)
        {
            var labels = codes.Select(ExamRejectionReasons.GetLabel).ToList();

            var content = $"Đề thi \"{exam.TenBaiKT}\" đã bị Admin từ chối.\n" +
                          "Lý do:\n" +
                          string.Join("\n", labels.Select(x => $"- {x}"));

            if (note != null)
                content += $"\nChi tiết: {note}";

            content += "\nVui lòng chỉnh sửa đề và gửi lại để Admin phê duyệt.";

            var title = $"Đề thi bị từ chối: {exam.TenBaiKT}";
            if (title.Length > MaxTitleLength)
                title = title[..(MaxTitleLength - 1)] + "…";

            _context.Notifications.Add(new NotificationMessage
            {
                Id = Guid.NewGuid(),
                Title = title,
                Content = content,
                TargetRole = "Teacher",
                TargetUserId = teacherUserId.Value,
                Priority = "Important",
                Status = "Sent",
                CreatedByUserId = adminUserId,
                CreatedAt = now,
                SentAt = now
            });
        }

        // Cập nhật đề và tạo thông báo trong cùng một lần lưu (atomic).
        await _context.SaveChangesAsync(cancellationToken);

        return "Đã từ chối đề thi và gửi thông báo kèm lý do cho giáo viên.";
    }
}
