using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students
    .Queries.GetSavedQuestions;

public class GetSavedQuestionsHandler
    : IRequestHandler<
        GetSavedQuestionsQuery,
        List<StudentSavedQuestionDto>>
{
    private readonly IApplicationDbContext _context;

    private readonly ICurrentUserService _currentUser;

    public GetSavedQuestionsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }


    public async Task<List<StudentSavedQuestionDto>> Handle(
        GetSavedQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // 1. LẤY USER TỪ JWT
        // ==========================================

        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được tài khoản đang đăng nhập.");
        }


        // ==========================================
        // 2. TÌM STUDENT
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
        // 3. LẤY CÂU HỎI ĐÃ LƯU
        // ==========================================

        var data = await (
            from saved in
                _context.StudentSavedQuestions
                    .AsNoTracking()

            join question in
                _context.Questions.AsNoTracking()
                on saved.QuestionId equals question.Id

            join subject in
                _context.Subjects.AsNoTracking()
                on question.SubjectId equals subject.Id

            join grade in
                _context.Grades.AsNoTracking()
                on question.GradeId equals grade.Id

            where saved.StudentId == student.Id

            orderby saved.CreatedAt descending

            select new StudentSavedQuestionDto
            {
                Id = saved.Id,

                QuestionId = question.Id,

                SubjectId = subject.Id,

                MonHoc = subject.TenMH,

                GradeId = grade.Id,

                Khoi = grade.TenKhoi,

                NoiDung = question.NoiDung,

                OptionA = question.OptionA,

                OptionB = question.OptionB,

                OptionC = question.OptionC,

                OptionD = question.OptionD,

                CorrectAnswer =
                    question.CorrectAnswer,

                CreatedAt =
                    saved.CreatedAt
            })
            .ToListAsync(cancellationToken);


        return data;
    }
}