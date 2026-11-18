using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.UnlockTeacher
{
    public class UnlockTeacherCommand : IRequest<bool>
    {
        public Guid TeacherId { get; set; }
    }
}
