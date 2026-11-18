using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Command.CreateGrade
{
    public class CreateGradeCommand
    : IRequest<Guid>
    {
        public string TenKhoi { get; set; }
    }
}
