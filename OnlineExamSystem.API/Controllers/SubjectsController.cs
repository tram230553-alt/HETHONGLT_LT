using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Subjects.Commands.CreateSubject;
using OnlineExamSystem.Application.Features.Subjects.Commands.DeleteSubject;
using OnlineExamSystem.Application.Features.Subjects.Commands.UpdateSubject;
using OnlineExamSystem.Application.Features.Subjects.Queries.GetAllSubjects;
using OnlineExamSystem.Application.Features.Subjects.Queries.GetSubjectDetail;


namespace OnlineExamSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubjectsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SubjectsController(
            IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(
                new GetAllSubjectsQuery());

            return Ok(result);
        }

        // Chi tiết một môn học: chuyên đề, giáo viên, câu hỏi, đề thi, thống kê (dữ liệu thật từ DB).
        [HttpGet("{id:guid}/detail")]
        public async Task<IActionResult> GetDetail(Guid id)
        {
            var result = await _mediator.Send(
                new GetSubjectDetailQuery
                {
                    Id = id
                });

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(
            CreateSubjectCommand command)
        {
            var result = await _mediator.Send(command);

            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(
            Guid id,
            UpdateSubjectCommand command)
        {
            command.Id = id;

            var result = await _mediator.Send(command);

            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(
            Guid id)
        {
            var result = await _mediator.Send(
                new DeleteSubjectCommand
                {
                    Id = id
                });

            return Ok(result);
        }
    }
}
