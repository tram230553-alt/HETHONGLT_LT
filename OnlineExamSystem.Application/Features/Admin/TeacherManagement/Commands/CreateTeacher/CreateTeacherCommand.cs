using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.CreateTeacher
{
    public class CreateTeacherCommand : IRequest<Guid>
    {
        // User info
        public string Ho { get; set; }
        public string TenDem { get; set; }
        public string Ten { get; set; }
        public string Email { get; set; }
        public string MatKhau { get; set; }

        // Teacher info
        public string SDT { get; set; }

        public Guid SubjectId { get; set; }
        public Guid GradeId { get; set; }
    }
}
