using MediatR;
namespace OnlineExamSystem.Application.Features.Notifications.Commands.MarkNotificationRead;
public record MarkNotificationReadCommand(Guid Id) : IRequest;
