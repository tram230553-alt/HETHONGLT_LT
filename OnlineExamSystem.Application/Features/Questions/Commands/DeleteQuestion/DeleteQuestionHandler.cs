using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Questions.Commands.DeleteQuestion;

public class DeleteQuestionHandler
    : IRequestHandler<DeleteQuestionCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteQuestionHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(
        DeleteQuestionCommand request,
        CancellationToken cancellationToken)
    {
        // Lấy UserId từ JWT
        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được giáo viên đang đăng nhập.");
        }

        // Tìm hồ sơ giáo viên
        var teacher = await _context.Teachers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (teacher == null)
        {
            throw new UnauthorizedAccessException(
                "Không tìm thấy hồ sơ giáo viên.");
        }

        // Chỉ được xóa câu hỏi của chính giáo viên
        var question = await _context.Questions
            .FirstOrDefaultAsync(
                x =>
                    x.Id == request.Id &&
                    x.TeacherId == teacher.Id,
                cancellationToken);

        if (question == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy câu hỏi hoặc bạn không có quyền xóa câu hỏi này.");
        }

        // Kiểm tra câu hỏi đang được dùng ở đâu.
        var usage = await QuestionUsageChecker.CheckAsync(
            _context,
            question.Id,
            cancellationToken);

        // Đề đã công bố / đã có dữ liệu học sinh → không được xóa.
        if (!usage.CanDelete)
        {
            throw new InvalidOperationException(
                usage.BlockReason ?? "Không thể xóa câu hỏi này.");
        }

        // Đề chưa công bố → phải chỉ rõ đề nào và cần giáo viên xác nhận.
        if (usage.RequiresConfirmation)
        {
            if (!request.ConfirmRemoveFromExams)
            {
                var names = string.Join(", ",
                    usage.Exams.Select(x => $"\"{x.TenBaiKT}\""));

                throw new InvalidOperationException(
                    "Câu hỏi đang được sử dụng trong các đề thi chưa công bố: " +
                    names + ". Cần xác nhận để xóa câu hỏi và gỡ khỏi các đề này.");
            }

            var links = await _context.ExamQuestions
                .Where(x => x.QuestionId == question.Id)
                .ToListAsync(cancellationToken);

            _context.ExamQuestions.RemoveRange(links);
        }

        _context.Questions.Remove(question);

        await _context.SaveChangesAsync(
            cancellationToken);

        return "Xóa câu hỏi thành công.";
    }
}