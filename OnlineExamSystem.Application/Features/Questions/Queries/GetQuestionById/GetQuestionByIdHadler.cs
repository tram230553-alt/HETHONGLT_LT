using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Questions;
using OnlineExamSystem.Application.Features.Questions.Queries.GetQuestionById;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Questions.Queries.GetQuestionById
{
    public class GetQuestionByIdHandler
    : IRequestHandler<GetQuestionByIdQuery, QuestionDto>
    {
        private readonly IApplicationDbContext _context;

        public GetQuestionByIdHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<QuestionDto> Handle(
            GetQuestionByIdQuery request,
            CancellationToken cancellationToken)
        {
            var question = await _context.Questions
                .Include(x => x.Subject)
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (question == null)
            {
                throw new Exception("Question not found");
            }

            return new QuestionDto
            {
                Id = question.Id,
                SubjectId = question.SubjectId,
                NoiDung = question.NoiDung,
                OptionA = question.OptionA,
                OptionB = question.OptionB,
                OptionC = question.OptionC,
                OptionD = question.OptionD,
                CorrectAnswer = question.CorrectAnswer,
                Type = question.Type,
                Difficulty = question.Difficulty,

            };
        }
    }
}
