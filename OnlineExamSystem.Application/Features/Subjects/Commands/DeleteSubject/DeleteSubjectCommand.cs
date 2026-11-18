using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Commands.DeleteSubject
{
    public class DeleteSubjectCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }
    }
}
