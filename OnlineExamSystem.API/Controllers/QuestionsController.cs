using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Questions.Commands.CreateQuestion;
using OnlineExamSystem.Application.Features.Questions.Commands.DeleteQuestion;
using OnlineExamSystem.Application.Features.Questions.Commands.UpdateQuestion;
using OnlineExamSystem.Application.Features.Questions.Queries.GetAllQuestions;
using OnlineExamSystem.Application.Features.Questions.Queries.GetQuestionById;
using OnlineExamSystem.Application.Features.Questions.Queries.GetQuestionUsage;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetMyQuestions;
[ApiController]
[Route("api/questions")]

public class QuestionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public QuestionsController(
        IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetQuestions(
    [FromQuery] Guid? subjectId,
    [FromQuery] Guid? gradeId,
    [FromQuery] Guid? topicId)
    {
        var result = await _mediator.Send(
            new GetQuestionsQuery(
                subjectId,
                gradeId,
                topicId));

        return Ok(result);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetMyQuestions()
    {
        return Ok(
            await _mediator.Send(
                new GetMyQuestionsQuery()));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetById(
        Guid id)
    {
        return Ok(
            await _mediator.Send(
                new GetQuestionByIdQuery
                {
                    Id = id
                }));
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Create(
        CreateQuestionCommand command)
    {
        return Ok(
            await _mediator.Send(command));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateQuestionCommand command)
    {
        command.Id = id;

        return Ok(
            await _mediator.Send(command));
    }

    /// <summary>
    /// Xem câu hỏi đang được dùng trong đề thi nào trước khi xóa.
    /// </summary>
    [HttpGet("{id}/usage")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetUsage(
        Guid id)
    {
        return Ok(
            await _mediator.Send(
                new GetQuestionUsageQuery
                {
                    Id = id
                }));
    }

    /// <summary>
    /// Xóa câu hỏi. Đề đã công bố → bị chặn. Đề chưa công bố → cần confirm=true.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromQuery] bool confirm = false)
    {
        return Ok(
            await _mediator.Send(
                new DeleteQuestionCommand
                {
                    Id = id,
                    ConfirmRemoveFromExams = confirm
                }));
    }

    [HttpGet("topic/{topicId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetQuestionsByTopic(
    Guid topicId)
    {
        var result = await _mediator.Send(
            new GetQuestionsQuery(
                null,
                null,
                topicId));

        return Ok(result);
    }
}
