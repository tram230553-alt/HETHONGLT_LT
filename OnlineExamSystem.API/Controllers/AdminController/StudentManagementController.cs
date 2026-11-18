using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Admin.StudentManagement.Commands.LockStudent;
using OnlineExamSystem.Application.Features.Admin.StudentManagement.Commands.UnlockStudent;


namespace OnlineExamSystem.API.Controllers.AdminController
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin/students")]
    public class StudentManagementController
    : ControllerBase
    {
        private readonly IMediator _mediator;

        public StudentManagementController(
            IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _mediator.Send(new OnlineExamSystem.Application.Features.Admin.StudentManagement.Queries.GetAllStudents.GetAllStudentsQuery()));
        }


        [HttpPut("{studentId}/lock")]
        public async Task<IActionResult> LockStudent(Guid studentId)
        {
            return Ok(await _mediator.Send(
                new LockStudentCommand
                {
                    StudentId = studentId
                }));
        }

        [HttpPut("{studentId}/unlock")]
        public async Task<IActionResult> UnlockStudent(Guid studentId)
        {
            return Ok(await _mediator.Send(
                new UnlockStudentCommand
                {
                    StudentId = studentId
                }));
        }
    }
}
