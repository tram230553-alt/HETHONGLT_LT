using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Students.Queries.ExplainPracticeAnswer;

public class ExplainPracticeAnswerHandler
    : IRequestHandler<ExplainPracticeAnswerQuery, PracticeAnswerExplanationDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPracticeExplanationService _explanation;

    public ExplainPracticeAnswerHandler(
        IApplicationDbContext context, ICurrentUserService currentUser,
        IPracticeExplanationService explanation)
    {
        _context = context;
        _currentUser = currentUser;
        _explanation = explanation;
    }

    public async Task<PracticeAnswerExplanationDto> Handle(
        ExplainPracticeAnswerQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được học sinh đang đăng nhập.");

        // Lọc quyền sở hữu ngay trong truy vấn, không tin dữ liệu gửi từ trình duyệt.
        var attempt = await _context.PracticeAttempts.AsNoTracking()
            .Include(a => a.Topic).ThenInclude(t => t.Subject)
            .Include(a => a.Answers)
            .Where(a => a.Id == request.AttemptId && a.Student.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);

        var answer = attempt?.Answers.FirstOrDefault(x => x.QuestionId == request.QuestionId);

        if (answer == null)
            throw new KeyNotFoundException("Không tìm thấy câu hỏi trong lượt luyện tập của bạn.");
        if (answer.IsCorrect)
            throw new ArgumentException("Chức năng này dành cho câu trả lời sai hoặc bỏ trống.");

        try
        {
            var text = await _explanation.ExplainAsync(new PracticeExplanationInput(
                attempt!.Topic.Subject.TenMH, attempt.Topic.Name, answer.QuestionText,
                answer.OptionA, answer.OptionB, answer.OptionC, answer.OptionD,
                answer.StudentAnswer, answer.CorrectAnswer, answer.Explanation), cancellationToken);

            return new PracticeAnswerExplanationDto(answer.QuestionId, text);
        }
        catch (HttpRequestException ex)
        {
            // AI không khả dụng (hết hạn mức, quá tải, chưa cấu hình...): vẫn trả lời giải của giáo viên
            // và đáp án đúng để học sinh không bị chặn. Kết quả chấm điểm không bị ảnh hưởng.
            var correct = string.IsNullOrWhiteSpace(answer.CorrectAnswer) ? "chưa có" : answer.CorrectAnswer;
            var teacherText = string.IsNullOrWhiteSpace(answer.Explanation)
                ? "Giáo viên chưa soạn lời giải chi tiết cho câu này."
                : answer.Explanation!.Trim();
            var fallback =
                $"Đáp án đúng: {correct}.\n" +
                $"Bạn đã chọn: {(string.IsNullOrWhiteSpace(answer.StudentAnswer) ? "bỏ trống" : answer.StudentAnswer)}.\n\n" +
                $"Lời giải của giáo viên: {teacherText}";
            return new PracticeAnswerExplanationDto(
                answer.QuestionId, fallback, true,
                "AI đang tạm thời không khả dụng nên hệ thống hiển thị lời giải có sẵn. Hãy thử lại sau ít phút. (" + ex.Message + ")");
        }
    }
}
