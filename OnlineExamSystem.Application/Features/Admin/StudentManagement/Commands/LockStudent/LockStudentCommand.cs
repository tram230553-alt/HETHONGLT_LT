using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.StudentManagement.Commands.LockStudent
{
    public class LockStudentCommand : IRequest<bool>
    {
        public Guid StudentId { get; set; }
    }
}
