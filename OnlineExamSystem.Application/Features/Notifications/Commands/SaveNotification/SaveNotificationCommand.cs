using MediatR;
using OnlineExamSystem.Application.DTOs.Notifications;

namespace OnlineExamSystem.Application.Features.Notifications.Commands.SaveNotification;

public class SaveNotificationCommand : IRequest<NotificationDto>
{
    public Guid? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string TargetRole { get; set; } = "All";
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Draft";
}
