using MediatR;
using OnlineExamSystem.Application.DTOs.Questions;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetQuestionDetail
{
    public class GetQuestionDetailQuery
    : IRequest<QuestionDto>
    {
        public Guid Id { get; set; }
    }
}
