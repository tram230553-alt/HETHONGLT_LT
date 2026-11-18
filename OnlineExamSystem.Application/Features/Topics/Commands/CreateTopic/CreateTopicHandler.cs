using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Topics.Commands.CreateTopic
{
    public class CreateTopicHandler
    : IRequestHandler<CreateTopicCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateTopicHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(
            CreateTopicCommand request,
            CancellationToken cancellationToken)
        {
            var subjectExists = await _context.Subjects
                .AnyAsync(
                    x => x.Id == request.SubjectId,
                    cancellationToken);

            if (!subjectExists)
            {
                throw new KeyNotFoundException(
                    "Subject không tồn tại.");
            }

            var gradeExists = await _context.Grades
                .AnyAsync(
                    x => x.Id == request.GradeId,
                    cancellationToken);

            if (!gradeExists)
            {
                throw new KeyNotFoundException(
                    "Grade không tồn tại.");
            }

            var duplicate = await _context.Topics
                .AnyAsync(x =>
                    x.Name == request.Name &&
                    x.SubjectId == request.SubjectId &&
                    x.GradeId == request.GradeId,
                    cancellationToken);

            if (duplicate)
            {
                throw new InvalidOperationException(
                    "Topic này đã tồn tại.");
            }

            var chapter = await _context.Chapters.FirstOrDefaultAsync(x => x.Id == request.ChapterId, cancellationToken);
            if (chapter == null || chapter.SubjectId != request.SubjectId || chapter.GradeId != request.GradeId)
                throw new InvalidOperationException("Chương không thuộc môn học và khối đã chọn.");
            if (request.OrderNum < 1) throw new InvalidOperationException("Thứ tự Topic phải lớn hơn 0.");

            var topic = new Topic
            {
                Id = Guid.NewGuid(),

                Name = request.Name.Trim(),

                Description = request.Description?.Trim(),

                SubjectId = request.SubjectId,

                GradeId = request.GradeId,

                ChapterId = request.ChapterId,

                OrderNum = request.OrderNum,

                IsActive = request.IsActive,

                CreatedAt = DateTime.UtcNow
            };
            _context.Topics.Add(topic);

            await _context.SaveChangesAsync(
                cancellationToken);

            return topic.Id;
        }
    }
}
