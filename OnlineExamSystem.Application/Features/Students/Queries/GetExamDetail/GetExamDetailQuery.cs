using MediatR;
using OnlineExamSystem.Application.DTOs.Exams;
using OnlineExamSystem.Application.DTOs.Students;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetExamDetail
{
    public class GetExamDetailQuery
    : IRequest<StudentExamDto>
    {
        public Guid Id { get; set; }
    }
}
