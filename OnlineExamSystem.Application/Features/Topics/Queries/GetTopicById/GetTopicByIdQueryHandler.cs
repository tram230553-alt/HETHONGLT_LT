using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Topics.Queries.GetTopicById
{
    public class GetTopicByIdQueryHandler
    : IRequestHandler<GetTopicByIdQuery, TopicDto>
    {
        private readonly IApplicationDbContext _context;

        public GetTopicByIdQueryHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TopicDto> Handle(
            GetTopicByIdQuery request,
            CancellationToken cancellationToken)
        {
            var topic = await _context.Topics
                .AsNoTracking()
                .Include(x => x.Subject)
                .Include(x => x.Grade)
                .Where(x => x.Id == request.Id)
                .Select(x => new TopicDto
                {
                    Id = x.Id,
                    Name = x.Name,
                    Description = x.Description,

                    SubjectId = x.SubjectId,
                    SubjectName = x.Subject.TenMH,

                    GradeId = x.GradeId,
                    GradeName = x.Grade.TenKhoi,

                    IsActive = x.IsActive,
                    ChapterId = x.ChapterId,
                    ChapterName = x.Chapter.Name,
                    ChapterOrder = x.Chapter.Order,
                    OrderNum = x.OrderNum,

                    QuestionCount = x.Questions.Count()
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (topic == null)
            {
                throw new KeyNotFoundException(
                    $"Không tìm thấy Topic với Id {request.Id}");
            }

            return topic;
        }
    }
}
