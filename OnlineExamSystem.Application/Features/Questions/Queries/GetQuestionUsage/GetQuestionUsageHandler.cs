using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Questions;

namespace OnlineExamSystem.Application.Features.Questions.Queries.GetQuestionUsage;

public class GetQuestionUsageHandler
    : IRequestHandler<GetQuestionUsageQuery, QuestionUsageDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetQuestionUsageHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<QuestionUsageDto> Handle(
        GetQuestionUsageQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException(
                "Không xác định được giáo viên đang đăng nhập.");

        var teacherId = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!teacherId.HasValue)
            throw new UnauthorizedAccessException(
                "Không tìm thấy hồ sơ giáo viên.");

        var owns = await _context.Questions
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.Id && x.TeacherId == teacherId.Value,
                cancellationToken);

        if (!owns)
            throw new KeyNotFoundException(
                "Không tìm thấy câu hỏi hoặc bạn không có quyền với câu hỏi này.");

        return await QuestionUsageChecker.CheckAsync(
            _context, request.Id, cancellationToken);
    }
}
