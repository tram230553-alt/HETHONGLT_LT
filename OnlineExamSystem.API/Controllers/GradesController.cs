using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Grades.Command.CreateGrade;
using OnlineExamSystem.Application.Features.Grades.Command.DeleteGrade;
using OnlineExamSystem.Application.Features.Grades.Command.UpdateGrade;
using OnlineExamSystem.Application.Features.Grades.Queries.GetAllGrades;

namespace OnlineExamSystem.API.Controllers
{
    [ApiController]
    [Route("api/grades")]
    public class GradesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public GradesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(
                new GetAllGradesQuery());

            return Ok(result);
        }

        

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(
            CreateGradeCommand command)
        {
            var result = await _mediator.Send(command);

            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(
            Guid id,
            UpdateGradeCommand command)
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
                new DeleteGradeCommand
                {
                    Id = id
                });

            return Ok(result);
        }
    }
}
