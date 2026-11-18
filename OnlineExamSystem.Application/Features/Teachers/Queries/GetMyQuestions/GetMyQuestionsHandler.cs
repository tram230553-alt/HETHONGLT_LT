using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetMyQuestions;

public class GetMyQuestionsHandler
    : IRequestHandler<GetMyQuestionsQuery, List<TeacherQuestionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyQuestionsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<TeacherQuestionDto>> Handle(
        GetMyQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được giáo viên đang đăng nhập.");
        }

        var teacherId = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!teacherId.HasValue)
        {
            throw new UnauthorizedAccessException(
                "Không tìm thấy hồ sơ giáo viên.");
        }

        return await _context.Questions
            .AsNoTracking()
            .Where(x => x.TeacherId == teacherId.Value)
            .OrderBy(x => x.NoiDung)
            .Select(x => new TeacherQuestionDto
            {
                Id = x.Id,

                NoiDung = x.NoiDung ?? string.Empty,

                OptionA = x.OptionA ?? string.Empty,
                OptionB = x.OptionB ?? string.Empty,
                OptionC = x.OptionC ?? string.Empty,
                OptionD = x.OptionD ?? string.Empty,

                CorrectAnswer = x.CorrectAnswer ?? string.Empty,
                Type = x.Type,
                Difficulty = x.Difficulty,

                SubjectId = x.SubjectId,

                TopicId = x.TopicId,

                CreatedBy = x.TeacherId,

                CreatorName =
                    ((x.Teacher.User.Ho ?? "") + " " +
                     (x.Teacher.User.TenDem ?? "") + " " +
                     (x.Teacher.User.Ten ?? ""))
                    .Trim(),

                Status = "approved",

                CreatedAt = x.CreatedAt,

                Explanation = x.Explanation
            })
            .ToListAsync(cancellationToken);
    }
}
