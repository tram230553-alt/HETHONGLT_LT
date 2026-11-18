using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Exams.Commands.DeleteExam
{
    public class DeleteExamCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }
    }
}
