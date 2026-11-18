using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Students
    .Commands.SaveQuestion;

public class SaveQuestionHandler
    : IRequestHandler<SaveQuestionCommand, bool>
{
    private readonly IApplicationDbContext _context;

    private readonly ICurrentUserService _currentUser;

    public SaveQuestionHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }


    public async Task<bool> Handle(
        SaveQuestionCommand request,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // 1. USER ID
        // ==========================================

        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được tài khoản đang đăng nhập.");
        }


        // ==========================================
        // 2. STUDENT
        // ==========================================

        var student = await _context.Students
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (student == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy hồ sơ học sinh.");
        }


        // ==========================================
        // 3. KIỂM TRA QUESTION TỒN TẠI
        // ==========================================

        var questionExists =
            await _context.Questions
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == request.QuestionId,
                    cancellationToken);

        if (!questionExists)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy câu hỏi.");
        }


        // ==========================================
        // 4. STUDENT ĐÃ TỪNG LÀM CÂU NÀY CHƯA?
        // ==========================================

        var hasAttemptedQuestion =
            await (
                from answer in
                    _context.StudentAnswers.AsNoTracking()

                join result in
                    _context.ExamResults.AsNoTracking()
                    on answer.ExamResultId equals result.Id

                where
                    result.StudentId == student.Id
                    &&
                    answer.QuestionId == request.QuestionId

                select answer.Id
            )
            .AnyAsync(cancellationToken);


        if (!hasAttemptedQuestion)
        {
            throw new InvalidOperationException(
                "Bạn chỉ có thể lưu câu hỏi đã từng làm.");
        }


        // ==========================================
        // 5. KIỂM TRA ĐÃ BOOKMARK CHƯA
        // ==========================================

        var alreadySaved =
            await _context.StudentSavedQuestions
                .AnyAsync(
                    x =>
                        x.StudentId == student.Id
                        &&
                        x.QuestionId == request.QuestionId,
                    cancellationToken);


        // POST idempotent:
        // đã lưu rồi thì vẫn coi là thành công.
        if (alreadySaved)
        {
            return true;
        }


        // ==========================================
        // 6. LƯU
        // ==========================================

        var savedQuestion =
            new StudentSavedQuestion
            {
                Id = Guid.NewGuid(),

                StudentId = student.Id,

                QuestionId =
                    request.QuestionId,

                CreatedAt =
                    DateTime.UtcNow
            };


        _context.StudentSavedQuestions
            .Add(savedQuestion);


        await _context.SaveChangesAsync(
            cancellationToken);


        return true;
    }
}