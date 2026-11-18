using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.API.Controllers;

[ApiController]
[Route("api/chapters")]
public class ChaptersController(ApplicationDbContext db) : ControllerBase
{
    public record ChapterRequest(string Name, int Order, Guid SubjectId, Guid GradeId);

    [Authorize(Roles = "Admin,Teacher")]
    [HttpGet]
    public async Task<IActionResult> Get(Guid? subjectId, Guid? gradeId) => Ok(await db.Chapters.AsNoTracking()
        .Where(x => (!subjectId.HasValue || x.SubjectId == subjectId) && (!gradeId.HasValue || x.GradeId == gradeId))
        .OrderBy(x => x.SubjectId).ThenBy(x => x.GradeId).ThenBy(x => x.Order)
        .Select(x => new { x.Id, x.Name, x.Order, x.SubjectId, x.GradeId, TopicCount = x.Topics.Count }).ToListAsync());

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(ChapterRequest request)
    {
        var error = await Validate(request);
        if (error != null) return BadRequest(error);
        var chapter = new Chapter { Id = Guid.NewGuid(), Name = request.Name.Trim(), Order = request.Order, SubjectId = request.SubjectId, GradeId = request.GradeId };
        db.Chapters.Add(chapter);
        await db.SaveChangesAsync();
        return Ok(chapter.Id);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, ChapterRequest request)
    {
        var chapter = await db.Chapters.Include(x => x.Topics).FirstOrDefaultAsync(x => x.Id == id);
        if (chapter == null) return NotFound();
        var error = await Validate(request, id);
        if (error != null) return BadRequest(error);
        if (chapter.Topics.Count > 0 && (chapter.SubjectId != request.SubjectId || chapter.GradeId != request.GradeId))
            return BadRequest("Không thể đổi môn hoặc khối khi chương đã có Topic.");
        chapter.Name = request.Name.Trim(); chapter.Order = request.Order;
        chapter.SubjectId = request.SubjectId; chapter.GradeId = request.GradeId;
        await db.SaveChangesAsync(); return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var chapter = await db.Chapters.FirstOrDefaultAsync(x => x.Id == id);
        if (chapter == null) return NotFound();

        // Chương đang có Topic (và dữ liệu đi kèm Topic) thì không được xóa.
        var topicCount = await db.Topics.CountAsync(x => x.ChapterId == id);
        if (topicCount > 0)
        {
            var questionCount = await db.Questions.CountAsync(x => x.Topic != null && x.Topic.ChapterId == id);
            var practiceAttemptCount = await db.PracticeAttempts.CountAsync(x => x.Topic.ChapterId == id);

            var related = new List<string> { $"{topicCount} Topic" };
            if (questionCount > 0) related.Add($"{questionCount} câu hỏi");
            if (practiceAttemptCount > 0) related.Add($"{practiceAttemptCount} lượt luyện tập của học sinh");

            return Conflict(new
            {
                message = $"Không thể xóa Chương {chapter.Order}: {chapter.Name} vì đang có dữ liệu liên quan ({string.Join(", ", related)}). " +
                          "Hãy xóa hoặc chuyển các Topic sang chương khác trước.",
                topicCount,
                questionCount,
                practiceAttemptCount
            });
        }

        try
        {
            db.Chapters.Remove(chapter);
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Dự phòng: CSDL vẫn chặn nếu có ràng buộc khoá ngoại khác.
            return Conflict(new { message = "Không thể xóa Chương vì đang có dữ liệu liên quan." });
        }

        return NoContent();
    }

    private async Task<string?> Validate(ChapterRequest request, Guid? excludeId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200 || request.Order < 1) return "Tên chương hoặc thứ tự không hợp lệ.";
        if (!await db.Subjects.AnyAsync(x => x.Id == request.SubjectId) || !await db.Grades.AnyAsync(x => x.Id == request.GradeId)) return "Môn học hoặc khối không tồn tại.";
        if (await db.Chapters.AnyAsync(x => x.SubjectId == request.SubjectId && x.GradeId == request.GradeId && x.Order == request.Order && x.Id != excludeId)) return "Thứ tự chương đã tồn tại trong môn và khối này.";
        return null;
    }
}
