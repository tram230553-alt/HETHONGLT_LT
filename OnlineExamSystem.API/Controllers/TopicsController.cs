using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Topics.Commands.CreateTopic;
using OnlineExamSystem.Application.Features.Topics.Commands.DeleteTopic;
using OnlineExamSystem.Application.Features.Topics.Commands.UpdateTopic;

namespace OnlineExamSystem.API.Controllers
{
    [ApiController]
    [Route("api/topics")]
    public class TopicsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TopicsController(IMediator mediator)
        {
            _mediator = mediator;
        }


        // Admin + Teacher đều được xem
        [Authorize(Roles = "Admin,Teacher")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] Guid? subjectId,
            [FromQuery] Guid? gradeId)
        {
            var result = await _mediator.Send(
                new GetTopicsQuery(
                    subjectId,
                    gradeId));

            return Ok(result);
        }


        // Admin tạo Topic
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(
            CreateTopicCommand command)
        {
            var id = await _mediator.Send(command);

            return Ok(id);
        }


        // Admin sửa Topic
        [Authorize(Roles = "Admin")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(
            Guid id,
            UpdateTopicRequest request)
        {
            await _mediator.Send(
                new UpdateTopicCommand(
                id,
                request.Name,
                request.Description,
                request.SubjectId,
                request.GradeId,
                request.ChapterId,
                request.OrderNum,
                request.IsActive
            ));

            return NoContent();
        }


        // Admin xóa Topic
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(
            Guid id)
        {
            await _mediator.Send(
                new DeleteTopicCommand(id));

            return NoContent();
        }
    }
}
