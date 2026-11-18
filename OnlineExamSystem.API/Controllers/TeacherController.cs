using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetExamDetail;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetExamWrongQuestions;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetMyExams;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetMyProfileQuery;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetQuestionDetail;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetStudentResults;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetStudentExamResultDetail;
using OnlineExamSystem.Application.Features.Teachers.Queries.GetStudentPracticeAttemptDetail;
using OnlineExamSystem.Application.Features.Teachers
    .Queries.GetStudentPracticeResults;
using OnlineExamSystem.Application.Features.Teachers
    .Queries.GetCommonWrongPracticeQuestions;
using OnlineExamSystem.Application.Features.Teachers
    .Queries.GetTeacherReport;
using OnlineExamSystem.Application.Features.Teachers.Commands.UpdateSettings;
using OnlineExamSystem.Domain.Entities;

[ApiController]
[Route("api/teachers")]
[Authorize(Roles = "Teacher")]
public class TeachersController : ControllerBase
{
    private readonly IMediator _mediator;

    public TeachersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ==========================
    // Profile
    // ==========================

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        return Ok(await _mediator.Send(
            new GetMyProfileQuery()));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(OnlineExamSystem.Application.Features.Teachers.Commands.UpdateProfile.UpdateProfileCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    // ==========================
    // Question
    // ==========================

    [HttpGet("questions/{id}")]
    public async Task<IActionResult> GetQuestion(Guid id)
    {
        return Ok(await _mediator.Send(
            new GetQuestionDetailQuery
            {
                Id = id
            }));
    }

    // ==========================
    // Exam
    // ==========================

    [HttpGet("exams/{id}")]
    public async Task<IActionResult> GetExam(Guid id)
    {
        return Ok(await _mediator.Send(
            new GetExamDetailQuery
            {
                Id = id
            }));
    }

    [HttpGet("student-results")]
    public async Task<IActionResult> GetStudentResults()
    {
        return Ok(await _mediator.Send(
            new GetStudentResultsQuery()));
    }
    [HttpGet("student-practice-results")]
    public async Task<IActionResult> GetStudentPracticeResults()
    {
        var result = await _mediator.Send(
            new GetStudentPracticeResultsQuery());

        return Ok(result);
    }

    /// <summary>
    /// Chi tiết từng câu của một bài thi học sinh đã nộp
    /// (câu hỏi, đáp án học sinh chọn, đáp án đúng, lời giải).
    /// </summary>
    [HttpGet("student-results/{examResultId:guid}/detail")]
    public async Task<IActionResult> GetStudentExamResultDetail(Guid examResultId)
    {
        return Ok(await _mediator.Send(
            new GetStudentExamResultDetailQuery
            {
                ExamResultId = examResultId
            }));
    }

    /// <summary>
    /// Chi tiết từng câu của một lượt luyện tập học sinh đã nộp.
    /// </summary>
    [HttpGet("student-practice-results/{attemptId:guid}/detail")]
    public async Task<IActionResult> GetStudentPracticeAttemptDetail(Guid attemptId)
    {
        return Ok(await _mediator.Send(
            new GetStudentPracticeAttemptDetailQuery
            {
                AttemptId = attemptId
            }));
    }

    /// <summary>
    /// Thống kê câu học sinh làm sai trong các đề thi của giáo viên.
    /// examId để trống = gộp mọi đề của giáo viên.
    /// </summary>
    [HttpGet("exam-wrong-questions")]
    public async Task<IActionResult> GetExamWrongQuestions(
        [FromQuery] Guid? examId,
        [FromQuery] int limit = 100)
    {
        return Ok(await _mediator.Send(
            new GetExamWrongQuestionsQuery
            {
                ExamId = examId,
                Limit = limit
            }));
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateTeacherSettingsCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReport()
    {
        return Ok(await _mediator.Send(
            new GetTeacherReportQuery()));
    }

    [HttpGet("practice-common-wrong-questions")]
    public async Task<IActionResult> GetCommonWrongPracticeQuestions(
        [FromQuery] int limit = 20)
    {
        var result = await _mediator.Send(
            new GetCommonWrongPracticeQuestionsQuery
            {
                Limit = limit
            });

        return Ok(result);
    }



}
