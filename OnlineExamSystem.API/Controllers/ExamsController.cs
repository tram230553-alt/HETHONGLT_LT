using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Win32;
using OnlineExamSystem.Application.Features.Exams.Commands.AddQuestionToExam;
using OnlineExamSystem.Application.Features.Exams.Commands.CreateExam;
using OnlineExamSystem.Application.Features.Exams.Commands.DeleteExam;
using OnlineExamSystem.Application.Features.Exams.Commands.PublishExam;
using OnlineExamSystem.Application.Features.Exams.Commands.RemoveQuestionFromExam;
using OnlineExamSystem.Application.Features.Exams.Commands.RejectExam;
using OnlineExamSystem.Application.Features.Exams.Commands.SubmitExamForApproval;
using OnlineExamSystem.Application.Features.Exams.Commands.UpdateExam;
using OnlineExamSystem.Application.Features.Exams.Queries.GetAllExams;
using OnlineExamSystem.Application.Features.Exams.Queries.GetExamDetail;
using OnlineExamSystem.Application.Features.Students.Queries.GetAvailableExams;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetMyExams;
using OnlineExamSystem.Domain.Entities;

[ApiController]
[Route("api/exams")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ExamsController(
        IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(
            await _mediator.Send(
                new GetAllExamsQuery()));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetMy()
    {
        return Ok(
            await _mediator.Send(
                new GetMyExamsQuery()));
    }
    
    [HttpGet("{id}")]
    [Authorize(
    Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetById(
        Guid id)
    {
        return Ok(
            await _mediator.Send(
                new GetExamByIdQuery
                {
                    Id = id
                }));
    }
 
    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Create(
        CreateExamCommand command)
    {
        return Ok(
            await _mediator.Send(command));
    }

    
    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateExamCommand command)
    {
        command.Id = id;

        return Ok(
            await _mediator.Send(command));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Delete(
        Guid id)
    {
        return Ok(
            await _mediator.Send(
                new DeleteExamCommand
                {
                    Id = id
                }));
    }

    [HttpPost("add-question")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> AddQuestion(
        AddQuestionToExamCommand command)
    {
        return Ok(
            await _mediator.Send(command));
    }

    [HttpPost("{examId}/questions/{questionId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> AddQuestion(
        Guid examId,
        Guid questionId)
    {
        return Ok(await _mediator.Send(
            new AddQuestionToExamCommand
            {
                ExamId = examId,
                QuestionId = questionId
            }));
    }

    [HttpDelete("{examId}/questions/{questionId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> RemoveQuestion(
        Guid examId,
        Guid questionId)
    {
        return Ok(
            await _mediator.Send(
                new RemoveQuestionFromExamCommand
                {
                    ExamId = examId,
                    QuestionId = questionId
                }));
    }

    [HttpGet("available")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetAvailable()
    {
        var result =
            await _mediator.Send(
                new GetAvailableExamsQuery());

        return Ok(result);
    }


    [HttpPut("{id}/submit-for-approval")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> SubmitForApproval(Guid id)
    {
        var result = await _mediator.Send(
            new SubmitExamForApprovalCommand
            {
                Id = id
            });

        return Ok(result);
    }

    /// <summary>
    /// Admin từ chối đề đang chờ duyệt. Bắt buộc có lý do; đề chuyển sang
    /// trạng thái "Bị từ chối", hệ thống lưu lý do và thông báo cho giáo viên.
    /// </summary>
    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(
        Guid id,
        RejectExamRequest request)
    {
        var result = await _mediator.Send(
            new RejectExamCommand
            {
                Id = id,
                ReasonCodes = request.ReasonCodes ?? new List<string>(),
                Note = request.Note
            });

        return Ok(result);
    }

    [HttpPut("{id}/publish")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Publish(
    Guid id)
    {
        var result =
            await _mediator.Send(
                new PublishExamCommand
                {
                    Id = id
                });

        return Ok(result);
    }
}

public class RejectExamRequest
{
    public List<string>? ReasonCodes { get; set; }

    public string? Note { get; set; }
}
