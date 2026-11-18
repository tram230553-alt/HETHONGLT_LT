using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Students
    .Commands.RemoveSavedQuestion;

public class RemoveSavedQuestionHandler
    : IRequestHandler<
        RemoveSavedQuestionCommand,
        bool>
{
    private readonly IApplicationDbContext _context;

    private readonly ICurrentUserService _currentUser;

    public RemoveSavedQuestionHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }


    public async Task<bool> Handle(
        RemoveSavedQuestionCommand request,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // USER
        // ==========================================

        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được tài khoản đang đăng nhập.");
        }


        // ==========================================
        // STUDENT
        // ==========================================

        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (student == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy hồ sơ học sinh.");
        }


        // ==========================================
        // BOOKMARK
        // ==========================================

        var saved =
            await _context.StudentSavedQuestions
                .FirstOrDefaultAsync(
                    x =>
                        x.StudentId == student.Id
                        &&
                        x.QuestionId == request.QuestionId,
                    cancellationToken);


        // DELETE idempotent.
        if (saved == null)
        {
            return true;
        }


        _context.StudentSavedQuestions
            .Remove(saved);


        await _context.SaveChangesAsync(
            cancellationToken);


        return true;
    }
}