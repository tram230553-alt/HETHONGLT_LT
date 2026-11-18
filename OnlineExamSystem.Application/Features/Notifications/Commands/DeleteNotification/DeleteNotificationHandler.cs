using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
namespace OnlineExamSystem.Application.Features.Notifications.Commands.DeleteNotification;
public class DeleteNotificationHandler : IRequestHandler<DeleteNotificationCommand>
{
    private readonly IApplicationDbContext _context;
    public DeleteNotificationHandler(IApplicationDbContext context) => _context = context;
    public async Task Handle(DeleteNotificationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thông báo.");
        _context.Notifications.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
