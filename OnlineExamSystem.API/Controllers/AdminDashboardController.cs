using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Admin.Dashboard.Queries.GetRecentExamSubmissions;

namespace OnlineExamSystem.API.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminDashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("recent-exam-submissions")]
    public async Task<IActionResult> GetRecentExamSubmissions(
        [FromQuery] int limit = 10)
    {
        var result = await _mediator.Send(
            new GetRecentExamSubmissionsQuery
            {
                Limit = limit
            });

        return Ok(result);
    }
}
