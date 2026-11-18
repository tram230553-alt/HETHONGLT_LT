using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.StudentManagement.Commands.UnlockStudent
{
    public class UnlockStudentCommand : IRequest<bool>
    {
        public Guid StudentId { get; set; }
    }
}
