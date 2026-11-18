using MediatR;
using OnlineExamSystem.Application.DTOs.Grades;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Queries.GetAllGrades
{
    public class GetAllGradesQuery
    : IRequest<List<GradeDto>>
    {
    }
}
