using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Notifications;

namespace OnlineExamSystem.Application.Features.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsHandler : IRequestHandler<GetMyNotificationsQuery, List<NotificationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyNotificationsHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<NotificationDto>> Handle(GetMyNotificationsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được người dùng đang đăng nhập.");

        var role = _currentUser.Role;
        var isAdmin = role.Equals("Admin", StringComparison.OrdinalIgnoreCase);
        var recipientCounts = await _context.Users.AsNoTracking()
            .Where(x => x.Role == "Teacher" || x.Role == "Student")
            .GroupBy(x => x.Role)
            .Select(x => new { Role = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.Role, x => x.Count, cancellationToken);

        var query = _context.Notifications.AsNoTracking().AsQueryable();
        if (!isAdmin)
        {
            // Thông báo theo vai trò + thông báo riêng gửi đúng cho người dùng này.
            query = query.Where(x => x.Status == "Sent" &&
                ((x.TargetUserId == null && (x.TargetRole == "All" || x.TargetRole == role))
                 || x.TargetUserId == userId));
        }
        else
        {
            // Danh sách quản lý của Admin chỉ gồm thông báo do Admin soạn;
            // thông báo hệ thống gửi riêng cho từng người không nằm trong danh sách này.
            query = query.Where(x => x.TargetUserId == null);
        }

        var rows = await query
            .OrderByDescending(x => x.SentAt ?? x.CreatedAt)
            .Select(x => new
            {
                x.Id, x.Title, x.Content, x.TargetRole, x.Priority, x.Status,
                x.CreatedAt, x.SentAt, x.TargetUserId,
                ReadAt = x.ReadReceipts.Where(r => r.UserId == userId).Select(r => (DateTime?)r.ReadAt).FirstOrDefault(),
                ReadCount = x.ReadReceipts.Count
            })
            .ToListAsync(cancellationToken);

        var allRecipients = recipientCounts.Values.Sum();
        return rows.Select(x => new NotificationDto
        {
            Id = x.Id,
            Title = x.Title,
            Content = x.Content,
            TargetRole = x.TargetRole,
            Priority = x.Priority,
            Status = x.Status,
            CreatedAt = x.CreatedAt,
            SentAt = x.SentAt,
            IsRead = x.ReadAt.HasValue,
            ReadAt = x.ReadAt,
            ReadCount = x.ReadCount,
            RecipientCount = x.TargetUserId.HasValue
                ? 1
                : x.TargetRole == "All"
                    ? allRecipients
                    : recipientCounts.GetValueOrDefault(x.TargetRole, 0)
        }).ToList();
    }
}
