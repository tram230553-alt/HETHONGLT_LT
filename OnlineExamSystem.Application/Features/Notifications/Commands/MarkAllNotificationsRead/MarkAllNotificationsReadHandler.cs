using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Notifications.Commands.MarkAllNotificationsRead;

public class MarkAllNotificationsReadHandler : IRequestHandler<MarkAllNotificationsReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public MarkAllNotificationsReadHandler(IApplicationDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    public async Task Handle(MarkAllNotificationsReadCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId)) throw new UnauthorizedAccessException();
        var role = _currentUser.Role;
        var unreadIds = await _context.Notifications.AsNoTracking()
            .Where(x => x.Status == "Sent" &&
                ((x.TargetUserId == null && (x.TargetRole == "All" || x.TargetRole == role))
                 || x.TargetUserId == userId))
            .Where(x => !x.ReadReceipts.Any(r => r.UserId == userId))
            .Select(x => x.Id).ToListAsync(cancellationToken);
        if (unreadIds.Count == 0) return;
        var now = DateTime.UtcNow;
        _context.NotificationReads.AddRange(unreadIds.Select(id => new NotificationReadReceipt { NotificationId = id, UserId = userId, ReadAt = now }));
        await _context.SaveChangesAsync(cancellationToken);
    }
}
