using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Exams.Commands.PublishExam
{
    public class PublishExamCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }
    }
}
