using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.CreateTeacher;
using OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.DeleteTeacher;
using OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.LockTeacher;
using OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.UnlockTeacher;
using OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.UpdateTeacher;
using OnlineExamSystem.Application.Features.Admin.TeacherManagement.Queries.GetAllTeachers;
using OnlineExamSystem.Application.Features.Admin.TeacherManagement.Queries.GetTeacherDetail;

namespace OnlineExamSystem.API.Controllers.AdminController
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin/teachers")]
    public class TeacherManagementController
    : ControllerBase
    {
        private readonly IMediator _mediator;

        public TeacherManagementController(
            IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(new GetAllTeachersQuery());
            return Ok(result);
        }

        // Chi tiết giáo viên: câu hỏi, đề thi, luyện tập của học sinh (dữ liệu thật từ DB).
        [HttpGet("{teacherId:guid}/detail")]
        public async Task<IActionResult> GetDetail(Guid teacherId)
        {
            var result = await _mediator.Send(
                new GetTeacherDetailQuery
                {
                    TeacherId = teacherId
                });

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateTeacherCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(new
            {
                message = "Tạo giáo viên thành công",
                teacherId = result
            });
        }

        [HttpPut("{teacherId}")]
        public async Task<IActionResult> Update(
    Guid teacherId,
    UpdateTeacherCommand command)
        {
            command.TeacherId =
                teacherId;

            var result =
                await _mediator.Send(command);

            return Ok(result);
        }

        [HttpDelete("{teacherId}")]
        public async Task<IActionResult> Delete(
            Guid teacherId)
        {
            return Ok(
                await _mediator.Send(
                    new DeleteTeacherCommand
                    {
                        TeacherId = teacherId
                    }));
        }

        [HttpPut("{teacherId}/lock")]
        public async Task<IActionResult> LockTeacher(Guid teacherId)
        {
            return Ok(await _mediator.Send(
                new LockTeacherCommand
                {
                    TeacherId = teacherId
                }));
        }

        [HttpPut("{teacherId}/unlock")]
        public async Task<IActionResult> UnlockTeacher(Guid teacherId)
        {
            return Ok(await _mediator.Send(
                new UnlockTeacherCommand
                {
                    TeacherId = teacherId
                }));
        }
    }
}
