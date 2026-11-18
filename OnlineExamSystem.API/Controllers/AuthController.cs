using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OnlineExamSystem.Application.Features.Auths.ForgotPassword;
using OnlineExamSystem.Application.Features.Auths.Login;
using OnlineExamSystem.Application.Features.Auths.Register;
using OnlineExamSystem.Application.Features.Auths.ResetPassword;

namespace OnlineExamSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterCommand command)
    {
        try
        {
            var result =
                await _mediator.Send(command);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginCommand command)
    {
        try
        {
            command.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
                ?? string.Empty;
            command.UserAgent = Request.Headers.UserAgent.ToString();

            var token =
                await _mediator.Send(command);

            return Ok(token);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Bước 1: gửi mã xác nhận 6 số tới email đăng ký của học sinh/giáo viên.
    /// Luôn trả cùng một thông báo để không lộ tài khoản nào tồn tại.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting("password-reset")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordCommand command)
    {
        try
        {
            var message = await _mediator.Send(command);

            return Ok(new { message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = ex.Message });
        }
    }

    /// <summary>
    /// Bước 2: nhập mã xác nhận + mật khẩu mới để đặt lại mật khẩu.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting("password-reset")]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordCommand command)
    {
        try
        {
            var message = await _mediator.Send(command);

            return Ok(new { message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
