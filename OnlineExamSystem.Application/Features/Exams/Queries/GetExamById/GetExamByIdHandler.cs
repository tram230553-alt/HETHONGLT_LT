using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Exams;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Exams.Queries.GetExamDetail;

public class GetExamByIdHandler
    : IRequestHandler<GetExamByIdQuery, ExamDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetExamByIdHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ExamDetailDto> Handle(
        GetExamByIdQuery request,
        CancellationToken cancellationToken)
    {
        var exam = await _context.Exams
            .AsNoTracking()
            .Include(x => x.ExamQuestions)
                .ThenInclude(x => x.Question)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (exam == null)
            throw new KeyNotFoundException("Không tìm thấy đề thi.");

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
