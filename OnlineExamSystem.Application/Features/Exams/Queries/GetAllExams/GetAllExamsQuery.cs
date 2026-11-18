using MediatR;
using OnlineExamSystem.Application.DTOs.Exams;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Exams.Queries.GetAllExams;

public class GetAllExamsQuery
    : IRequest<List<ExamDto>>
{
}
