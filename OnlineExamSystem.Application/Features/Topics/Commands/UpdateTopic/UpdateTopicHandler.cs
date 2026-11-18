using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Topics.Commands.UpdateTopic
{
    public class UpdateTopicHandler
    : IRequestHandler<UpdateTopicCommand>
    {
        private readonly IApplicationDbContext _context;

        public UpdateTopicHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task Handle(
            UpdateTopicCommand request,
            CancellationToken cancellationToken)
        {
            var topic = await _context.Topics
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (topic == null)
            {
                throw new KeyNotFoundException(
                    "Không tìm thấy Topic.");
            }

            topic.Name = request.Name.Trim();

            topic.Description =
                request.Description?.Trim();

            topic.SubjectId =
                request.SubjectId;

            topic.GradeId =
                request.GradeId;

            var chapter = await _context.Chapters.FirstOrDefaultAsync(x => x.Id == request.ChapterId, cancellationToken);
            if (chapter == null || chapter.SubjectId != request.SubjectId || chapter.GradeId != request.GradeId)
                throw new InvalidOperationException("Chương không thuộc môn học và khối đã chọn.");
            if (request.OrderNum < 1) throw new InvalidOperationException("Thứ tự Topic phải lớn hơn 0.");
            topic.ChapterId = request.ChapterId;

            topic.OrderNum =
                request.OrderNum;

            topic.IsActive =
                request.IsActive;

            topic.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync(
                cancellationToken);
        }
    }
}
