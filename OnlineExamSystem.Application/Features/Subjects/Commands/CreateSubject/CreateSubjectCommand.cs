using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Commands.CreateSubject
{
    public class CreateSubjectCommand
    : IRequest<Guid>
    {
        public string TenMH { get; set; }

    }
}
