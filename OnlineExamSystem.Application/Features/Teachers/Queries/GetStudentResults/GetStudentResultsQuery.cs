using MediatR;
using OnlineExamSystem.Application.DTOs.Students;
using OnlineExamSystem.Application.DTOs.Teachers;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetStudentResults
{
    public class GetStudentResultsQuery
    : IRequest<List<TeacherStudentResultDto>>
    {
    }
}
