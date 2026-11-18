using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Questions;
using OnlineExamSystem.Application.Features.Exams.Queries.GetAllExams;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace OnlineExamSystem.Application.Features.Questions.Queries.GetAllQuestions;

public class GetQuestionsQueryHandler
    : IRequestHandler<GetQuestionsQuery, List<QuestionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetQuestionsQueryHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<QuestionDto>> Handle(
        GetQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Questions
            .AsNoTracking()
            .Include(x => x.Subject)
            .Include(x => x.Grade)
            .Include(x => x.Topic)
            .AsQueryable();


        if (request.SubjectId.HasValue)
        {
            query = query.Where(x =>
                x.SubjectId == request.SubjectId.Value);
        }


        if (request.GradeId.HasValue)
        {
            query = query.Where(x =>
                x.GradeId == request.GradeId.Value);
        }


        if (request.TopicId.HasValue)
        {
            query = query.Where(x =>
                x.TopicId == request.TopicId.Value);
        }


        return await query
            .OrderByDescending(x => x.Id)
            .Select(x => new QuestionDto
            {
                Id = x.Id,

                NoiDung = x.NoiDung,

                OptionA = x.OptionA,
                OptionB = x.OptionB,
                OptionC = x.OptionC,
                OptionD = x.OptionD,

                CorrectAnswer = x.CorrectAnswer,
                Type = x.Type,
                Difficulty = x.Difficulty,


                SubjectId = x.SubjectId,
                TenMH = x.Subject.TenMH,

                GradeId = x.GradeId,
                TenKhoi = x.Grade.TenKhoi,
                TopicId = x.TopicId,

                TopicName = x.Topic.Name
            })
            .ToListAsync(cancellationToken);
    }
}
