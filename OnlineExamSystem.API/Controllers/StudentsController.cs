using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Students.Commands.RemoveSavedQuestion;
using OnlineExamSystem.Application.Features.Students.Commands.SaveQuestion;
using OnlineExamSystem.Application.Features.Students.Commands.SubmitExam;
using OnlineExamSystem.Application.Features.Students.Queries.GetExamDetail;
using OnlineExamSystem.Application.Features.Students.Queries.GetLeaderboard;
using OnlineExamSystem.Application.Features.Students.Queries.GetMyProfile;
using OnlineExamSystem.Application.Features.Students.Queries.GetMyResults;
using OnlineExamSystem.Application.Features.Students.Queries.GetMyPracticeAttempts;
using OnlineExamSystem.Application.Features.Students.Queries.GetPracticeAttemptDetail;
using OnlineExamSystem.Application.Features.Students.Queries.ExplainPracticeAnswer;
using OnlineExamSystem.Application.Features.Students.Queries.GetResultDetail;
using OnlineExamSystem.Application.Features.Students.Queries.GetSavedQuestions;
using OnlineExamSystem.Application.Features.Students.Queries.GetStudentTopics;
using OnlineExamSystem.Application.Features.Students.Queries.GetWrongQuestions;
using OnlineExamSystem.Application.Features.Students.Queries.GetDashboard;
using OnlineExamSystem.Application.Features.Students.Queries.GetLoginSessions;
using OnlineExamSystem.Application.StudentTopics.Queries.GetPracticeQuestionsByTopic;
using OnlineExamSystem.Application.Features.Students.Commands.SubmitPractice;
using OnlineExamSystem.Application.Features.Students.Queries.GetWordPuzzleQuestionsByTopic;
namespace OnlineExamSystem.API.Controllers
{
    [ApiController]
    [Route("api/students")]
    [Authorize(Roles = "Student")]
    public class StudentsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public StudentsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("exams/{id}")]
        public async Task<IActionResult> GetExamDetail(Guid id)
        {
            var result = await _mediator.Send(
                new GetExamDetailQuery
                {
                    Id = id
                });

            return Ok(result);
        }

        [HttpGet("results")]
        public async Task<IActionResult> GetMyResults()
        {
            var result = await _mediator.Send(
                new GetMyResultsQuery());

            return Ok(result);
        }

        // Chi tiết lượt làm gần nhất của một đề - giữ để tương thích client cũ.
        [HttpGet("results/{examId}")]
        public async Task<IActionResult> GetResultDetail(Guid examId)
        {
            var result = await _mediator.Send(
                new GetResultDetailQuery
                {
                    ExamId = examId
                });

            return Ok(result);
        }

        // Chi tiết chính xác một lượt thi, cần thiết khi học sinh làm lại nhiều lần.
        [HttpGet("results/attempt/{examResultId}")]
        public async Task<IActionResult> GetResultAttemptDetail(Guid examResultId)
        {
            var result = await _mediator.Send(
                new GetResultDetailQuery
                {
                    ExamResultId = examResultId
                });

            return Ok(result);
        }

        [HttpGet("questions/wrong")]
        public async Task<IActionResult> GetWrongQuestions()
        {
            var result = await _mediator.Send(
                new GetWrongQuestionsQuery());

            return Ok(result);
        }
        [HttpPost("exams/{examId}/submit")]
        public async Task<IActionResult> SubmitExam(
            Guid examId,
            [FromBody] SubmitExamCommand command)
        {
            command.ExamId = examId;
            command.IsRetake = false;

            var result = await _mediator.Send(command);

            return Ok(result);
        }

        // Học sinh chỉ dùng endpoint này sau khi đã có ít nhất một kết quả của đề.
        [HttpPost("exams/{examId}/retake")]
        public async Task<IActionResult> RetakeExam(
            Guid examId,
            [FromBody] SubmitExamCommand command)
        {
            command.ExamId = examId;
            command.IsRetake = true;

            var result = await _mediator.Send(command);

            return Ok(result);
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitExamLegacy(
            [FromBody] SubmitExamCommand command)
        {
            command.IsRetake = false;
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var result = await _mediator.Send(
                new GetMyProfileQuery());

            return Ok(result);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            return Ok(await _mediator.Send(new GetStudentDashboardQuery()));
        }

        [HttpGet("login-sessions")]
        public async Task<IActionResult> GetLoginSessions()
        {
            return Ok(await _mediator.Send(new GetStudentLoginSessionsQuery()));
        }

        [HttpGet("questions/saved")]
        public async Task<IActionResult> GetSavedQuestions()
        {
            var result = await _mediator.Send(
                new GetSavedQuestionsQuery());

            return Ok(result);
        }


        [HttpPost("questions/{questionId}/save")]
        public async Task<IActionResult> SaveQuestion(
            Guid questionId)
        {
            var result = await _mediator.Send(
                new SaveQuestionCommand
                {
                    QuestionId = questionId
                });

            return Ok(result);
        }


        [HttpDelete("questions/{questionId}/save")]
        public async Task<IActionResult> RemoveSavedQuestion(
            Guid questionId)
        {
            var result = await _mediator.Send(
                new RemoveSavedQuestionCommand
                {
                    QuestionId = questionId
                });

            return Ok(result);
        }

        [HttpGet("topics")]
        public async Task<IActionResult> GetMyTopics(
    [FromQuery] Guid? subjectId)
        {
            var result = await _mediator.Send(
                new GetStudentTopicsQuery(subjectId));

            return Ok(result);
        }


        [HttpGet("practice-attempts")]
        public async Task<IActionResult> GetMyPracticeAttempts()
        {
            var result = await _mediator.Send(
                new GetMyPracticeAttemptsQuery());

            return Ok(result);
        }

        [HttpGet("practice-attempts/{attemptId:guid}")]
        public async Task<IActionResult> GetPracticeAttemptDetail(
            Guid attemptId)
        {
            var result = await _mediator.Send(
                new GetPracticeAttemptDetailQuery(attemptId));

            return Ok(result);
        }

        [HttpPost("practice-attempts/{attemptId:guid}/questions/{questionId:guid}/explain")]
        public async Task<IActionResult> ExplainPracticeAnswer(
            Guid attemptId, Guid questionId, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(
                new ExplainPracticeAnswerQuery(attemptId, questionId), cancellationToken);
            return Ok(result);
        }

        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard(
    [FromQuery] Guid? gradeId,
    [FromQuery] Guid? subjectId,
    [FromQuery] int limit = 10)
        {
            var result = await _mediator.Send(
                new GetLeaderboardQuery
                {
                    GradeId = gradeId,

                    SubjectId = subjectId,

                    Limit = limit
                });

            return Ok(result);
        }

        [HttpGet("topics/{topicId}/questions")]
        public async Task<IActionResult> GetPracticeQuestionsByTopic(
    Guid topicId)
        {
            var result = await _mediator.Send(
                new GetPracticeQuestionsByTopicQuery(topicId));

            return Ok(result);
        }

        [HttpGet("topics/{topicId}/word-puzzle-questions")]
        public async Task<IActionResult> GetWordPuzzleQuestionsByTopic(Guid topicId)
        {
            var result = await _mediator.Send(
                new GetWordPuzzleQuestionsByTopicQuery(topicId));

            return Ok(result);
        }


        [HttpPost("topics/{topicId}/practice/submit")]
        public async Task<IActionResult> SubmitPractice(
            Guid topicId,
            [FromBody] List<SubmitPracticeAnswerDto> answers)
        {
            var result = await _mediator.Send(
                new SubmitPracticeCommand(
                    topicId,
                    answers));

            return Ok(result);
        }
    }
}
