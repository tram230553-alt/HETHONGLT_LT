using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetStudentResults;

public class GetStudentResultsHandler
    : IRequestHandler<GetStudentResultsQuery, List<TeacherStudentResultDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetStudentResultsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<TeacherStudentResultDto>> Handle(
        GetStudentResultsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacher = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new
            {
                x.Id,
                x.GradeId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (teacher == null)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        // Với mô hình hiện tại, giáo viên được phân công theo Khối + Môn.
        // Vì hệ thống không quản lý Lớp, danh sách bên dưới là học sinh thuộc đúng khối giáo viên phụ trách.
        var students = await _context.Students
            .AsNoTracking()
            .Where(x => x.GradeId == teacher.GradeId)
            .OrderBy(x => x.User.Ho)
            .ThenBy(x => x.User.TenDem)
            .ThenBy(x => x.User.Ten)
            .Select(x => new TeacherStudentResultDto
            {
                StudentId = x.Id,
                MaHS = x.MaHS,
                StudentName = x.User.Ho + " " + x.User.TenDem + " " + x.User.Ten,
                Email = x.User.Email,
                GradeName = x.Grade.TenKhoi,
                IsLocked = x.User.IsLocked,

                Results = x.ExamResults
                    .Where(r => r.Exam.TeacherId == teacher.Id)
                    .OrderByDescending(r => r.SubmittedAt)
                    .Select(r => new TeacherStudentExamResultDto
                    {
                        ExamResultId = r.Id,
                        ExamId = r.ExamId,
                        ExamName = r.Exam.TenBaiKT,
                        Score = r.Diem,
                        CorrectQuestion = r.StudentAnswers.Count(a => a.IsCorrect),
                        TotalQuestion = r.Exam.ExamQuestions.Count,
                        SubmittedAt = r.SubmittedAt
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        foreach (var student in students)
        {
            student.StudentName = string.Join(
                " ",
                student.StudentName
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries));

            student.CompletedExams = student.Results
                .Select(x => x.ExamId)
                .Distinct()
                .Count();

            student.AverageScore = student.Results.Count == 0
                ? 0
                : Math.Round(student.Results.Average(x => x.Score), 2);

            student.CorrectQuestion = student.Results.Sum(x => x.CorrectQuestion);
            student.TotalQuestion = student.Results.Sum(x => x.TotalQuestion);
            student.LastSubmittedAt = student.Results.FirstOrDefault()?.SubmittedAt;
        }

        return students;
    }
}
