using MediatR;
using OnlineExamSystem.Application.DTOs.Questions;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Questions.Queries.GetQuestionById
{
    public class GetQuestionByIdQuery
    : IRequest<QuestionDto>
    {
        public Guid Id { get; set; }
    }
}
