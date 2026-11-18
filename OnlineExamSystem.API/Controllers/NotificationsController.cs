using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Notifications.Commands.DeleteNotification;
using OnlineExamSystem.Application.Features.Notifications.Commands.MarkAllNotificationsRead;
using OnlineExamSystem.Application.Features.Notifications.Commands.MarkNotificationRead;
using OnlineExamSystem.Application.Features.Notifications.Commands.SaveNotification;
using OnlineExamSystem.Application.Features.Notifications.Queries.GetMyNotifications;

namespace OnlineExamSystem.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    public NotificationsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetMine() => Ok(await _mediator.Send(new GetMyNotificationsQuery()));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(SaveNotificationCommand command)
    {
        command.Id = null;
        return Ok(await _mediator.Send(command));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, SaveNotificationCommand command)
    {
        command.Id = id;
        return Ok(await _mediator.Send(command));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteNotificationCommand(id));
        return NoContent();
    }

    [HttpPut("{id:guid}/read")]
    [Authorize(Roles = "Teacher,Student")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        await _mediator.Send(new MarkNotificationReadCommand(id));
        return NoContent();
    }

    [HttpPut("read-all")]
    [Authorize(Roles = "Teacher,Student")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _mediator.Send(new MarkAllNotificationsReadCommand());
        return NoContent();
    }
}
