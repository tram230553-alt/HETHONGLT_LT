using MediatR;
using OnlineExamSystem.Application.DTOs.Exams;
using OnlineExamSystem.Application.DTOs.Teachers;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetMyExams
{
    public class GetMyExamsQuery
    : IRequest<List<TeacherExamDto>>
    {
    }
}
