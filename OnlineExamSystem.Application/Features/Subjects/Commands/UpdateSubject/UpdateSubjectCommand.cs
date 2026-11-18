using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Commands.UpdateSubject
{
    public class UpdateSubjectCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }

        public string TenMH { get; set; }
    }
}
