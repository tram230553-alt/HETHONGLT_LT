using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetMyExams;

public class GetMyExamsHandler
    : IRequestHandler<GetMyExamsQuery, List<TeacherExamDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyExamsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<TeacherExamDto>> Handle(
        GetMyExamsQuery request,
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

        var exams = await _context.Exams
            .AsNoTracking()
            .Where(x => x.TeacherId == teacherId.Value)
            .OrderByDescending(x => x.IsPublished)
            .ThenByDescending(x => x.IsSubmittedForApproval)
            .ThenByDescending(x => x.IsRejected)
            .ThenBy(x => x.TenBaiKT)
            .Select(x => new TeacherExamDto
            {
                Id = x.Id,
                TenBaiKT = x.TenBaiKT,
                ThoiLuong = x.ThoiLuong,
                IsSubmittedForApproval = x.IsSubmittedForApproval,
                IsPublished = x.IsPublished,
                IsRejected = x.IsRejected,
                RejectionReasonCodes = x.RejectionReasonCodes,
                RejectionNote = x.RejectionNote,
                RejectedAt = x.RejectedAt,
                TotalQuestions = x.ExamQuestions.Count
            })
            .ToListAsync(cancellationToken);

        foreach (var exam in exams)
            exam.RejectionReasons = ExamRejectionReasons.ToLabels(exam.RejectionReasonCodes);

        return exams;
    }
}
