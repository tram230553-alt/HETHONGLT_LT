using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Command.DeleteGrade
{
    public class DeleteGradeCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }
    }
}
