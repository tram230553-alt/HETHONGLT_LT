using MediatR;
using OnlineExamSystem.Application.DTOs.Exams;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetAvailableExams
{
    public class GetAvailableExamsQuery
    : IRequest<List<ExamDto>>
    {
    }
}
