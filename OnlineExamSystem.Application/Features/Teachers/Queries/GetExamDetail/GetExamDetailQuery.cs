using MediatR;
using OnlineExamSystem.Application.DTOs.Exams;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetExamDetail
{
    public class GetExamDetailQuery
    : IRequest<ExamDetailDto>
    {
        public Guid Id { get; set; }
    }
}
