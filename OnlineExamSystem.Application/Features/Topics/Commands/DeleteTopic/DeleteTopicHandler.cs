using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Topics.Commands.DeleteTopic;

public class DeleteTopicHandler
    : IRequestHandler<DeleteTopicCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteTopicHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(
        DeleteTopicCommand request,
        CancellationToken cancellationToken)
    {
        var topic = await _context.Topics
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (topic == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy Topic.");
        }

        // Không xóa Topic đang có câu hỏi
        var hasQuestions =
            await _context.Questions
                .AsNoTracking()
                .AnyAsync(
                    x => x.TopicId == topic.Id,
                    cancellationToken);

        if (hasQuestions)
        {
            throw new InvalidOperationException(
                "Không thể xóa Topic vì Topic đang có câu hỏi.");
        }

        // Không xóa Topic đã có lịch sử luyện tập
        var hasPracticeHistory =
            await _context.PracticeAttempts
                .AsNoTracking()
                .AnyAsync(
                    x => x.TopicId == topic.Id,
                    cancellationToken);

        if (hasPracticeHistory)
        {
            throw new InvalidOperationException(
                "Không thể xóa Topic vì học sinh đã luyện tập Topic này. " +
                "Bạn có thể chuyển Topic sang trạng thái ngừng hoạt động.");
        }

        _context.Topics.Remove(topic);

        await _context.SaveChangesAsync(
            cancellationToken);
    }
}