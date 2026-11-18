using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Notifications;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Notifications.Commands.SaveNotification;

public class SaveNotificationHandler : IRequestHandler<SaveNotificationCommand, NotificationDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SaveNotificationHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<NotificationDto> Handle(SaveNotificationCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được Admin đang đăng nhập.");

        var title = request.Title.Trim();
        var content = request.Content.Trim();
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(content))
            throw new InvalidOperationException("Tiêu đề và nội dung thông báo không được để trống.");
        if (title.Length > 250 || content.Length > 4000)
            throw new InvalidOperationException("Thông báo vượt quá độ dài cho phép.");

        var targetRole = Normalize(request.TargetRole, new[] { "All", "Teacher", "Student" }, "đối tượng nhận");
        var priority = Normalize(request.Priority, new[] { "Normal", "Important", "Urgent" }, "mức ưu tiên");
        var status = Normalize(request.Status, new[] { "Draft", "Sent" }, "trạng thái");

        NotificationMessage entity;
        if (request.Id.HasValue)
        {
            entity = await _context.Notifications.Include(x => x.ReadReceipts)
                .FirstOrDefaultAsync(x => x.Id == request.Id.Value, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy thông báo.");

            if (entity.TargetRole != targetRole || entity.Status != status)
            {
                _context.NotificationReads.RemoveRange(entity.ReadReceipts);
            }
        }
        else
        {
            entity = new NotificationMessage
            {
                Id = Guid.NewGuid(),
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(entity);
        }

        entity.Title = title;
        entity.Content = content;
        entity.TargetRole = targetRole;
        entity.Priority = priority;
        entity.Status = status;
        entity.SentAt = status == "Sent" ? entity.SentAt ?? DateTime.UtcNow : null;

        await _context.SaveChangesAsync(cancellationToken);

        var recipientCount = await _context.Users.AsNoTracking().CountAsync(
            x => x.Role == "Teacher" || x.Role == "Student", cancellationToken);
        if (targetRole != "All")
            recipientCount = await _context.Users.AsNoTracking().CountAsync(x => x.Role == targetRole, cancellationToken);

        return new NotificationDto
        {
            Id = entity.Id, Title = entity.Title, Content = entity.Content,
            TargetRole = entity.TargetRole, Priority = entity.Priority, Status = entity.Status,
            CreatedAt = entity.CreatedAt, SentAt = entity.SentAt,
            ReadCount = entity.ReadReceipts.Count, RecipientCount = recipientCount
        };
    }

    private static string Normalize(string value, string[] allowed, string field)
        => allowed.FirstOrDefault(x => x.Equals(value?.Trim(), StringComparison.OrdinalIgnoreCase))
           ?? throw new InvalidOperationException($"{field} không hợp lệ.");
}
