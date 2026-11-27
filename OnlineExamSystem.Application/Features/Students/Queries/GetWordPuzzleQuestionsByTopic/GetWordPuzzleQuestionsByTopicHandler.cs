using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;
using System.Text.RegularExpressions;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetWordPuzzleQuestionsByTopic;

public class GetWordPuzzleQuestionsByTopicHandler
    : IRequestHandler<GetWordPuzzleQuestionsByTopicQuery, List<StudentWordPuzzleQuestionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetWordPuzzleQuestionsByTopicHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<StudentWordPuzzleQuestionDto>> Handle(
        GetWordPuzzleQuestionsByTopicQuery request,
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

        // Lấy tất cả câu hỏi dạng điền/tự luận (essay, short_answer, fill_blank) của chủ đề
        var textQuestions = await _context.Questions
            .AsNoTracking()
            .Where(q =>
                q.TopicId == request.TopicId &&
                (q.Type == "essay" || q.Type == "short_answer" || q.Type == "fill_blank") &&
                q.CorrectAnswer != null &&
                q.CorrectAnswer != "")
            .OrderBy(q => q.CreatedAt)
            .ThenBy(q => q.Id)
            .ToListAsync(cancellationToken);

        var result = new List<StudentWordPuzzleQuestionDto>();

        foreach (var q in textQuestions)
        {
            var wordAnswer = ExtractEssayWordAnswer(q.CorrectAnswer);
            if (string.IsNullOrWhiteSpace(wordAnswer)) continue;

            result.Add(new StudentWordPuzzleQuestionDto
            {
                Id = q.Id,
                NoiDung = q.NoiDung,
                WordAnswer = wordAnswer,
                DisplayAnswer = !string.IsNullOrWhiteSpace(q.CorrectAnswer) ? q.CorrectAnswer.Trim() : wordAnswer,
                Hint = !string.IsNullOrWhiteSpace(q.OptionA) ? q.OptionA : "Tìm từ khóa đáp án trong bảng chữ",
                Explanation = q.Explanation,
                TopicId = topic.Id,
                TopicName = topic.Name
            });
        }

        return result;
    }

    private static string ExtractEssayWordAnswer(string? rawAnswer)
    {
        if (string.IsNullOrWhiteSpace(rawAnswer)) return string.Empty;

        const int MaxGridCells = 30; // Lưới 6x6 (36 ô) hỗ trợ mượt đáp án tới 30 ký tự

        // Nếu câu hỏi có nhiều phương án chấp nhận (ngăn cách bởi /, ;, |, ,)
        var options = rawAnswer.Split(new[] { '/', ';', '|', ',' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var opt in options)
        {
            var cleaned = CleanWord(opt);
            if (cleaned.Length >= 1 && cleaned.Length <= MaxGridCells)
            {
                return cleaned;
            }
        }

        // Fallback 1: làm sạch toàn bộ chuỗi đáp án
        var fallbackCleaned = CleanWord(rawAnswer);
        if (fallbackCleaned.Length >= 1 && fallbackCleaned.Length <= MaxGridCells)
        {
            return fallbackCleaned;
        }

        // Fallback 2: nếu đáp án là câu dài > 30 ký tự, lấy cụm từ đầu tiên vừa khít lưới 6x6 để không bỏ sót câu hỏi
        var words = rawAnswer.Trim().Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var built = string.Empty;
        foreach (var w in words)
        {
            var cw = CleanWord(w);
            if (string.IsNullOrEmpty(cw)) continue;
            if (built.Length + cw.Length <= 24)
            {
                built += cw;
            }
            else
            {
                break;
            }
        }

        if (built.Length >= 1) return built;
        return fallbackCleaned.Length > MaxGridCells ? fallbackCleaned.Substring(0, MaxGridCells) : fallbackCleaned;
    }

    private static string CleanWord(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        // Giữ lại ký tự chữ (bao gồm cả tiếng Việt có dấu) và số, bỏ dấu cách và dấu câu
        var stripped = Regex.Replace(raw.Trim(), @"[^\p{L}\p{N}]", "").ToUpperInvariant();
        return stripped;
    }
}
