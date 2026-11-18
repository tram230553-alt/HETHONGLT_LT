using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OnlineExamSystem.Application.Features.AI;

namespace OnlineExamSystem.API.Controllers;

[ApiController, Route("api/ai"), Authorize, EnableRateLimiting("ai")]
public class AiController : ControllerBase
{
    private readonly IMediator _mediator;
    public AiController(IMediator mediator) => _mediator = mediator;
    [HttpGet("topics"), Authorize(Roles = "Student,Teacher")]
    public async Task<IActionResult> Topics(CancellationToken ct) => Ok(await _mediator.Send(new GetAiTopicsQuery(), ct));
    [HttpPost("ask"), Authorize(Roles = "Student")]
    public async Task<IActionResult> Ask(AskAiCommand command, CancellationToken ct)
        => Ok(new { text = await _mediator.Send(command, ct) });
    [HttpPost("generate-questions"), Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Generate(GenerateAiQuestionsCommand command, CancellationToken ct)
        => Ok(new { questions = await _mediator.Send(command, ct), requiresReview = true });
}
