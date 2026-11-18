using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Users.Commands.ChangePassword;

using OnlineExamSystem.Domain.Entities;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
    ChangePasswordCommand command)
    {
        return Ok(await _mediator.Send(command));
    }
}