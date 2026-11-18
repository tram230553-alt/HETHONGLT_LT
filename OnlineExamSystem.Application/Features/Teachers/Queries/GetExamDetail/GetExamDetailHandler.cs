using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Exams;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetExamDetail;

public class GetExamDetailHandler
    : IRequestHandler<GetExamDetailQuery, ExamDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetExamDetailHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ExamDetailDto> Handle(
        GetExamDetailQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacherId = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!teacherId.HasValue)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        var exam = await _context.Exams
            .AsNoTracking()
            .Include(x => x.ExamQuestions)
                .ThenInclude(x => x.Question)
            .FirstOrDefaultAsync(
                x => x.Id == request.Id && x.TeacherId == teacherId.Value,
                cancellationToken);

        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi hoặc đề thi không thuộc giáo viên đang đăng nhập.");

        return new ExamDetailDto
        {
            Id = exam.Id,
            TenBaiKT = exam.TenBaiKT,
            ThoiLuong = exam.ThoiLuong,
            IsSubmittedForApproval = exam.IsSubmittedForApproval,
            IsPublished = exam.IsPublished,
            IsRejected = exam.IsRejected,
            RejectionReasonCodes = exam.RejectionReasonCodes,
            RejectionReasons = ExamRejectionReasons.ToLabels(exam.RejectionReasonCodes),
            RejectionNote = exam.RejectionNote,
            RejectedAt = exam.RejectedAt,
            Questions = exam.ExamQuestions
                .Select(x => new TeacherQuestionDto
                {
                    Id = x.Question.Id,
                    NoiDung = x.Question.NoiDung,
                    OptionA = x.Question.OptionA,
                    OptionB = x.Question.OptionB,
                    OptionC = x.Question.OptionC,
                    OptionD = x.Question.OptionD,
                    CorrectAnswer = x.Question.CorrectAnswer,
                    Type = x.Question.Type,
                    Difficulty = x.Question.Difficulty
                })
                .OrderBy(x => x.NoiDung)
                .ToList()
        };
    }
}
