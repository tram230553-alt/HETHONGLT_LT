using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetChessQuestionsByTopic;

public class GetChessQuestionsByTopicHandler
    : IRequestHandler<GetChessQuestionsByTopicQuery, List<StudentChessQuestionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetChessQuestionsByTopicHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<StudentChessQuestionDto>> Handle(
        GetChessQuestionsByTopicQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
        {
            throw new UnauthorizedAccessException("Không xác định được học sinh đang đăng nhập.");
        }

        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (student == null)
        {
            throw new KeyNotFoundException("Không tìm thấy hồ sơ học sinh.");
        }

        var topic = await _context.Topics
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TopicId && t.IsActive, cancellationToken);

        if (topic == null)
        {
            throw new KeyNotFoundException("Topic không tồn tại hoặc đã bị khóa.");
        }

        // Lấy tất cả câu hỏi Đúng / Sai (true_false) của chủ đề, không phân biệt độ khó
        var tfQuestions = await _context.Questions
            .AsNoTracking()
            .Where(q => q.TopicId == request.TopicId && q.Type == "true_false")
            .OrderBy(q => q.CreatedAt)
            .ThenBy(q => q.Id)
            .ToListAsync(cancellationToken);

        var result = new List<StudentChessQuestionDto>();

        foreach (var q in tfQuestions)
        {
            var normalized = QuestionAnswerHelper.NormalizeTrueFalseAnswer(q.CorrectAnswer);
            if (normalized != "T" && normalized != "F") continue;

            result.Add(new StudentChessQuestionDto
            {
                Id = q.Id,
                NoiDung = q.NoiDung,
                IsTrue = normalized == "T",
                CorrectAnswer = normalized,
                Explanation = q.Explanation,
                TopicId = topic.Id,
                TopicName = topic.Name
            });
        }

        return result;
    }
}
