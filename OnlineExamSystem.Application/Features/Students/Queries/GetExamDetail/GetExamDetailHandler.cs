using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Questions;
using OnlineExamSystem.Application.DTOs.Students;
using System;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetExamDetail;

public class GetExamDetailHandler
    : IRequestHandler<GetExamDetailQuery, StudentExamDto>
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

    public async Task<StudentExamDto> Handle(
        GetExamDetailQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Lấy UserId đang đăng nhập
        var userId = Guid.Parse(
            _currentUser.UserId);

        // 2. Tìm Student
        var student = await _context.Students
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (student == null)
            throw new Exception(
                "Student not found");

        // 3. Lấy đề thi
        var exam = await _context.Exams
            .Include(x => x.ExamQuestions)
                .ThenInclude(x => x.Question)
            .FirstOrDefaultAsync(
                x =>
                    x.Id == request.Id &&
                    x.IsPublished,
                cancellationToken);

        if (exam == null)
            throw new Exception(
                "Exam not found");

        // 4. Kiểm tra đề có đúng khối của Student không
        if (exam.GradeId != student.GradeId)
            throw new Exception(
                "You cannot access this exam");

        // 5. Kiểm tra đề có câu hỏi hay không
        if (!exam.ExamQuestions.Any())
            throw new Exception(
                "Exam has no questions");

        // 6. Trả dữ liệu đề cho Student
        return new StudentExamDto
        {
            Id = exam.Id,

            TenBaiKT = exam.TenBaiKT,

            ThoiLuong = exam.ThoiLuong,

            Questions = exam.ExamQuestions
                .Select(x => new StudentQuestionDto
                {
                    Id = x.Question.Id,

                    NoiDung = x.Question.NoiDung,

                    OptionA = x.Question.OptionA,

                    OptionB = x.Question.OptionB,

                    OptionC = x.Question.OptionC,

                    OptionD = x.Question.OptionD,
                    Type = x.Question.Type

                })
                .ToList()
        };
    }
}
