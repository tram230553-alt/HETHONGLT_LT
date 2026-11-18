using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Exams.Commands.UpdateExam;

public class UpdateExamHandler : IRequestHandler<UpdateExamCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateExamHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(UpdateExamCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacherId = await _context.Teachers.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!teacherId.HasValue)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        var exam = await _context.Exams.FirstOrDefaultAsync(
            x => x.Id == request.Id && x.TeacherId == teacherId.Value,
            cancellationToken);

        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi hoặc đề thi không thuộc giáo viên đang đăng nhập.");
        if (exam.IsPublished)
            throw new InvalidOperationException("Đề đã phát hành nên không thể chỉnh sửa.");
        if (exam.IsSubmittedForApproval)
            throw new InvalidOperationException("Đề đang chờ Admin duyệt nên không thể chỉnh sửa.");

        var tenBaiKT = request.TenBaiKT?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenBaiKT))
            throw new ArgumentException("Tên bài kiểm tra không được để trống.");
        if (tenBaiKT.Length > 255)
            throw new ArgumentException("Tên bài kiểm tra không được vượt quá 255 ký tự.");

        // Cấu hình của Admin áp dụng bắt buộc cho mọi lần lưu đề.
        var config = await ExamConfigPolicy.LoadAsync(_context, cancellationToken);
        ExamConfigPolicy.EnsureDuration(config, request.ThoiLuong);

        var currentLinks = await _context.ExamQuestions
            .Where(x => x.ExamId == exam.Id)
            .ToListAsync(cancellationToken);

        var targetIds = request.QuestionIds != null
            ? request.QuestionIds.Distinct().ToList()
            : currentLinks.Select(x => x.QuestionId).ToList();

        ExamConfigPolicy.EnsureQuestionCount(config, targetIds.Count);

        if (request.QuestionIds != null)
        {
            var questions = await _context.Questions
                .AsNoTracking()
                .Where(x => targetIds.Contains(x.Id) && x.TeacherId == teacherId.Value)
                .Select(x => new { x.Id, x.SubjectId, x.GradeId })
                .ToListAsync(cancellationToken);

            if (questions.Count != targetIds.Count)
                throw new KeyNotFoundException(
                    "Có câu hỏi không tồn tại hoặc không thuộc giáo viên đang đăng nhập.");

            if (questions.Any(x => x.SubjectId != exam.SubjectId || x.GradeId != exam.GradeId))
                throw new InvalidOperationException("Có câu hỏi không cùng môn và khối với đề thi.");

            var keep = new HashSet<Guid>(targetIds);
            var existing = currentLinks.Select(x => x.QuestionId).ToHashSet();

            _context.ExamQuestions.RemoveRange(
                currentLinks.Where(x => !keep.Contains(x.QuestionId)));

            foreach (var questionId in targetIds.Where(x => !existing.Contains(x)))
            {
                _context.ExamQuestions.Add(new ExamQuestion
                {
                    ExamId = exam.Id,
                    QuestionId = questionId
                });
            }
        }

        exam.TenBaiKT = tenBaiKT;
        exam.ThoiLuong = request.ThoiLuong;
        await _context.SaveChangesAsync(cancellationToken);
        return "Cập nhật đề thi thành công.";
    }
}
