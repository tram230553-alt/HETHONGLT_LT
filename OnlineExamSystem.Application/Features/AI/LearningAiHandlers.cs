using System.ComponentModel.DataAnnotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.AI;

public record AiTopicDto(Guid Id, string Name, string ChapterName, string SubjectName, string GradeName);
public record GetAiTopicsQuery : IRequest<List<AiTopicDto>>;
public class AskAiCommand : IRequest<string>
{
    public Guid? TopicId { get; set; }
    [Required, StringLength(2000, MinimumLength = 1)] public string Message { get; set; } = "";
    public List<AiTurn> History { get; set; } = new();
}
public class GenerateAiQuestionsCommand : IRequest<List<AiDraftQuestion>>
{
    public Guid TopicId { get; set; }
    [Range(1, 10)] public int Count { get; set; } = 5;
    [RegularExpression("^(easy|medium|hard)$")] public string Difficulty { get; set; } = "medium";
    [StringLength(1000)] public string Requirements { get; set; } = "";
}

public class LearningAiHandlers :
    IRequestHandler<GetAiTopicsQuery, List<AiTopicDto>>,
    IRequestHandler<AskAiCommand, string>,
    IRequestHandler<GenerateAiQuestionsCommand, List<AiDraftQuestion>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly ILearningAiService _ai;
    public LearningAiHandlers(IApplicationDbContext db, ICurrentUserService user, ILearningAiService ai)
        => (_db, _user, _ai) = (db, user, ai);

    private async Task<IQueryable<Topic>> Topics(CancellationToken ct)
    {
        if (!Guid.TryParse(_user.UserId, out var userId)) throw new UnauthorizedAccessException();
        var topics = _db.Topics.AsNoTracking().Where(t => t.IsActive);
        if (_user.Role == "Student")
        {
            var student = await _db.Students.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ học sinh.");
            return topics.Where(t => t.GradeId == student.GradeId);
        }
        if (_user.Role == "Teacher")
        {
            var teacher = await _db.Teachers.AsNoTracking().FirstOrDefaultAsync(t => t.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ giáo viên.");
            return topics.Where(t => t.GradeId == teacher.GradeId && t.SubjectId == teacher.SubjectId);
        }
        throw new UnauthorizedAccessException();
    }
    public async Task<List<AiTopicDto>> Handle(GetAiTopicsQuery request, CancellationToken ct)
        => await (await Topics(ct)).OrderBy(t => t.Chapter.Order).ThenBy(t => t.OrderNum)
            .Select(t => new AiTopicDto(t.Id, t.Name, t.Chapter.Name, t.Subject.TenMH, t.Grade.TenKhoi)).ToListAsync(ct);

    private async Task<string> Context(Guid topicId, CancellationToken ct)
    {
        var topic = await (await Topics(ct)).Where(t => t.Id == topicId)
            .Select(t => new { t.Name, t.Description, Chapter = t.Chapter.Name,
                Subject = t.Subject.TenMH, Grade = t.Grade.TenKhoi }).FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("Chủ đề không thuộc môn/khối của bạn hoặc đã bị khóa.");
        // Only curriculum metadata is sent: no exam questions, answers or personal records.
        return System.Text.Json.JsonSerializer.Serialize(topic);
    }
    public async Task<string> Handle(AskAiCommand request, CancellationToken ct)
    {
        if (_user.Role != "Student") throw new UnauthorizedAccessException();
        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Length > 2000)
            throw new ArgumentException("Nhập câu hỏi từ 1 đến 2000 ký tự.");
        if (request.History == null || request.History.Count > 10 || request.History.Any(t =>
            t == null || t.Role is not ("user" or "model") || string.IsNullOrWhiteSpace(t.Text) || t.Text.Length > 4000))
            throw new ArgumentException("Lịch sử hỏi đáp không hợp lệ (tối đa 10 tin nhắn).");
        var context = request.TopicId.HasValue ? await Context(request.TopicId.Value, ct) : "";
        if (!request.TopicId.HasValue) await Topics(ct); // Validate the student profile even for general questions.
        return await _ai.AskAsync(context, request.Message.Trim(), request.History, ct);
    }
    public async Task<List<AiDraftQuestion>> Handle(GenerateAiQuestionsCommand request, CancellationToken ct)
    {
        if (_user.Role != "Teacher") throw new UnauthorizedAccessException();
        if (request.Count < 1 || request.Count > 10 || request.Difficulty is not ("easy" or "medium" or "hard")
            || request.Requirements == null || request.Requirements.Length > 1000)
            throw new ArgumentException("Yêu cầu tạo câu hỏi không hợp lệ.");
        return await _ai.GenerateAsync(await Context(request.TopicId, ct), request.Count,
            request.Difficulty, request.Requirements, ct);
    }
}
