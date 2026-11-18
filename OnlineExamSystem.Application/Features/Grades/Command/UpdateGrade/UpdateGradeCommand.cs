using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Command.UpdateGrade
{
    public class UpdateGradeCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }

        public string TenKhoi { get; set; }
    }
}
