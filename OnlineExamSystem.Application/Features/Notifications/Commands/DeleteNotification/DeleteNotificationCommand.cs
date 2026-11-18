using MediatR;
namespace OnlineExamSystem.Application.Features.Notifications.Commands.DeleteNotification;
public record DeleteNotificationCommand(Guid Id) : IRequest;
