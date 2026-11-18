using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.DeleteTeacher
{
    public class DeleteTeacherCommand
    : IRequest<string>
    {
        public Guid TeacherId { get; set; }
    }
}
