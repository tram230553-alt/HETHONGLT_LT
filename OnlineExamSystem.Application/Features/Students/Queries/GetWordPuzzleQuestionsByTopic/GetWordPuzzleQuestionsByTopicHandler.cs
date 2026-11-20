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

        // Lấy các câu hỏi tự luận (essay) hoặc câu có đáp án ngắn
        var questions = await _context.Questions
            .AsNoTracking()
            .Where(q => q.TopicId == request.TopicId)
            .OrderBy(q => q.CreatedAt)
            .ThenBy(q => q.Id)
            .ToListAsync(cancellationToken);

        var result = new List<StudentWordPuzzleQuestionDto>();

        foreach (var q in questions)
        {
            // Trích xuất từ đáp án thích hợp để làm game nối chữ
            var candidateAnswer = ExtractBestWordAnswer(q);
            if (string.IsNullOrWhiteSpace(candidateAnswer)) continue;

            result.Add(new StudentWordPuzzleQuestionDto
            {
                Id = q.Id,
                NoiDung = q.NoiDung,
                WordAnswer = candidateAnswer.Trim().ToUpperInvariant(),
                Hint = !string.IsNullOrWhiteSpace(q.OptionA) ? $"{q.OptionA}" : "Tìm từ khóa đáp án trong bảng chữ",
                Explanation = q.Explanation,
                TopicId = topic.Id,
                TopicName = topic.Name
            });
        }

        return result;
    }

    private static string ExtractBestWordAnswer(Question q)
    {
        // 1. Nếu là dạng essay: lấy đáp án CorrectAnswer
        if (q.Type == "essay")
        {
            if (!string.IsNullOrWhiteSpace(q.CorrectAnswer))
            {
                var firstOption = q.CorrectAnswer.Split(new[] { '/', ';', '|' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => CleanWord(x))
                    .FirstOrDefault(x => !string.IsNullOrEmpty(x) && x.Length >= 2 && x.Length <= 15);

                if (!string.IsNullOrEmpty(firstOption)) return firstOption;
            }
        }

        // 2. Nếu là các câu hỏi khác nhưng đáp án ngắn hoặc có từ khóa
        if (!string.IsNullOrWhiteSpace(q.CorrectAnswer))
        {
            var cleaned = CleanWord(q.CorrectAnswer);
            if (cleaned.Length >= 2 && cleaned.Length <= 15) return cleaned;
        }

        // 3. Nếu là trắc nghiệm nhưng nội dung đáp án A, B, C, D là từ đơn
        if (q.Type == "single_choice" && !string.IsNullOrWhiteSpace(q.CorrectAnswer))
        {
            var letter = q.CorrectAnswer.Trim().ToUpperInvariant();
            var optText = letter switch
            {
                "A" => q.OptionA,
                "B" => q.OptionB,
                "C" => q.OptionC,
                "D" => q.OptionD,
                _ => string.Empty
            };

            var cleanedOpt = CleanWord(optText);
            if (cleanedOpt.Length >= 2 && cleanedOpt.Length <= 15 && !cleanedOpt.Contains(' '))
            {
                return cleanedOpt;
            }
        }

        return string.Empty;
    }

    private static string CleanWord(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var stripped = Regex.Replace(raw.Trim(), @"[^\p{L}\p{N}]", "").ToUpperInvariant();
        return stripped;
    }
}
