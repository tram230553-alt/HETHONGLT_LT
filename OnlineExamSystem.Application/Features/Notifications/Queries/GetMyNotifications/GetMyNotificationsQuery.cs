using MediatR;
using OnlineExamSystem.Application.DTOs.Notifications;

namespace OnlineExamSystem.Application.Features.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQuery : IRequest<List<NotificationDto>> { }
