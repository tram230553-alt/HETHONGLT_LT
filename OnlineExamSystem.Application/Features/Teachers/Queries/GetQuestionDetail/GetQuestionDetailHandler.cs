using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Questions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetQuestionDetail
{
    public class GetQuestionDetailHandler
    : IRequestHandler<GetQuestionDetailQuery, QuestionDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public GetQuestionDetailHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<QuestionDto> Handle(
            GetQuestionDetailQuery request,
            CancellationToken cancellationToken)
        {
            var userId = Guid.Parse(_currentUser.UserId);

            var teacher = await _context.Teachers
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

            var question = await _context.Questions

                .FirstOrDefaultAsync(
                    x =>
                        x.Id == request.Id &&
                        x.TeacherId == teacher.Id,
                    cancellationToken);

            if (question == null)
                throw new Exception("Question not found");

            return new QuestionDto
            {
                Id = question.Id,

                SubjectId = question.SubjectId,

                TeacherId = question.TeacherId,

                NoiDung = question.NoiDung,

                OptionA = question.OptionA,

                OptionB = question.OptionB,

                OptionC = question.OptionC,

                OptionD = question.OptionD,

                CorrectAnswer = question.CorrectAnswer,
                Type = question.Type,
                Difficulty = question.Difficulty
            };
        }
    }
}
