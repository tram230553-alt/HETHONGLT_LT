using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Notifications.Commands.MarkNotificationRead;

public class MarkNotificationReadHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public MarkNotificationReadHandler(IApplicationDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    public async Task Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId)) throw new UnauthorizedAccessException();
        var role = _currentUser.Role;
        var exists = await _context.Notifications.AsNoTracking().AnyAsync(
            x => x.Id == request.Id && x.Status == "Sent" &&
                ((x.TargetUserId == null && (x.TargetRole == "All" || x.TargetRole == role))
                 || x.TargetUserId == userId), cancellationToken);
        if (!exists) throw new KeyNotFoundException("Không tìm thấy thông báo phù hợp.");

        if (!await _context.NotificationReads.AnyAsync(x => x.NotificationId == request.Id && x.UserId == userId, cancellationToken))
        {
            _context.NotificationReads.Add(new NotificationReadReceipt { NotificationId = request.Id, UserId = userId, ReadAt = DateTime.UtcNow });
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
