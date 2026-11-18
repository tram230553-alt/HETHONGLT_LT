using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Exams;

namespace OnlineExamSystem.Application.Features.Exams.Queries.GetAllExams;

public class GetAllExamsHandler
    : IRequestHandler<GetAllExamsQuery, List<ExamDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllExamsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExamDto>> Handle(
        GetAllExamsQuery request,
        CancellationToken cancellationToken)
    {
        var exams = await (
            from exam in _context.Exams.AsNoTracking()
            join subject in _context.Subjects.AsNoTracking()
                on exam.SubjectId equals subject.Id
            join grade in _context.Grades.AsNoTracking()
                on exam.GradeId equals grade.Id
            join teacher in _context.Teachers.AsNoTracking()
                on exam.TeacherId equals teacher.Id
            join user in _context.Users.AsNoTracking()
                on teacher.UserId equals user.Id
            orderby exam.IsPublished descending,
                    exam.IsSubmittedForApproval descending,
                    exam.IsRejected descending,
                    exam.TenBaiKT
            select new ExamDto
            {
                Id = exam.Id,
                MonHoc = subject.TenMH,
                Khoi = grade.TenKhoi,
                GiaoVien = (user.Ho + " " + user.TenDem + " " + user.Ten).Trim(),
                TenBaiKT = exam.TenBaiKT,
                ThoiLuong = exam.ThoiLuong,
                TotalQuestions = _context.ExamQuestions.Count(x => x.ExamId == exam.Id),
                IsSubmittedForApproval = exam.IsSubmittedForApproval,
                IsPublished = exam.IsPublished,
                IsRejected = exam.IsRejected,
                RejectionReasonCodes = exam.RejectionReasonCodes,
                RejectionNote = exam.RejectionNote,
                RejectedAt = exam.RejectedAt
            })
            .ToListAsync(cancellationToken);

        foreach (var item in exams)
            item.RejectionReasons = ExamRejectionReasons.ToLabels(item.RejectionReasonCodes);

        return exams;
    }
}
