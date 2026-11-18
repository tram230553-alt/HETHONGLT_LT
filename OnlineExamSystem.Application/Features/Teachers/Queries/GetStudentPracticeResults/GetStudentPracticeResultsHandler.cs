using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetStudentPracticeResults;

public class GetStudentPracticeResultsHandler
    : IRequestHandler<
        GetStudentPracticeResultsQuery,
        List<TeacherStudentPracticeResultDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetStudentPracticeResultsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<TeacherStudentPracticeResultDto>> Handle(
        GetStudentPracticeResultsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được giáo viên đang đăng nhập.");
        }

        // Xác định môn và khối của giáo viên
        var teacher = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new
            {
                x.Id,
                x.SubjectId,
                x.GradeId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (teacher == null)
        {
            throw new UnauthorizedAccessException(
                "Không tìm thấy hồ sơ giáo viên.");
        }

        // Danh sách học sinh đúng khối
        var students = await _context.Students
            .AsNoTracking()
            .Where(x => x.GradeId == teacher.GradeId)
            .OrderBy(x => x.User.Ho)
            .ThenBy(x => x.User.TenDem)
            .ThenBy(x => x.User.Ten)
            .Select(x => new
            {
                x.Id,
                x.MaHS,
                x.User.Email,
                x.User.Ho,
                x.User.TenDem,
                x.User.Ten,
                x.User.IsLocked,
                GradeName = x.Grade.TenKhoi
            })
            .ToListAsync(cancellationToken);

        // Tổng số Topic đang mở của môn + khối giáo viên (mẫu số của tiến độ luyện tập)
        var totalTopics = await _context.Topics
            .AsNoTracking()
            .CountAsync(
                x => x.SubjectId == teacher.SubjectId &&
                     x.GradeId == teacher.GradeId &&
                     x.IsActive,
                cancellationToken);

        // Lấy Practice đúng môn và khối giáo viên
        var attempts = await _context.PracticeAttempts
            .AsNoTracking()
            .Where(x =>
                x.Topic.SubjectId == teacher.SubjectId &&
                x.Topic.GradeId == teacher.GradeId &&
                x.Student.GradeId == teacher.GradeId)
            .OrderByDescending(x => x.SubmittedAt)
            .Select(x => new
            {
                x.Id,
                x.StudentId,
                x.TopicId,

                TopicName = x.Topic.Name,
                ChapterName = x.Topic.Chapter.Name,
                ChapterOrder = x.Topic.Chapter.Order,
                OrderNum = x.Topic.OrderNum,

                x.Score,
                x.TotalQuestions,
                x.AnsweredQuestions,
                x.CorrectAnswers,
                x.WrongAnswers,
                x.SubmittedAt
            })
            .ToListAsync(cancellationToken);

        var result =
            new List<TeacherStudentPracticeResultDto>();

        foreach (var student in students)
        {
            var studentAttempts = attempts
                .Where(x => x.StudentId == student.Id)
                .ToList();

            var studentName = string.Join(
                " ",
                new[]
                {
                    student.Ho,
                    student.TenDem,
                    student.Ten
                }
                .Where(x => !string.IsNullOrWhiteSpace(x)));

            result.Add(
                new TeacherStudentPracticeResultDto
                {
                    StudentId = student.Id,
                    MaHS = student.MaHS,
                    StudentName = studentName,
                    Email = student.Email,
                    GradeName = student.GradeName,
                    IsLocked = student.IsLocked,

                    AttemptCount = studentAttempts.Count,

                    CompletedTopics = studentAttempts
                        .Select(x => x.TopicId)
                        .Distinct()
                        .Count(),

                    TotalTopics = totalTopics,

                    AverageScore = studentAttempts.Count == 0
                        ? 0
                        : Math.Round(
                            studentAttempts.Average(x => x.Score),
                            2),

                    HighestScore = studentAttempts.Count == 0
                        ? 0
                        : studentAttempts.Max(x => x.Score),

                    CorrectAnswers = studentAttempts
                        .Sum(x => x.CorrectAnswers),

                    TotalQuestions = studentAttempts
                        .Sum(x => x.TotalQuestions),

                    LastSubmittedAt = studentAttempts
                        .FirstOrDefault()
                        ?.SubmittedAt,

                    Attempts = studentAttempts
                        .Select(x => new TeacherPracticeAttemptDto
                        {
                            AttemptId = x.Id,
                            TopicId = x.TopicId,
                            TopicName = x.TopicName,
                            ChapterName = x.ChapterName,
                            ChapterOrder = x.ChapterOrder,
                            OrderNum = x.OrderNum,
                            Score = x.Score,
                            TotalQuestions = x.TotalQuestions,
                            AnsweredQuestions = x.AnsweredQuestions,
                            CorrectAnswers = x.CorrectAnswers,
                            WrongAnswers = x.WrongAnswers,
                            SubmittedAt = x.SubmittedAt
                        })
                        .ToList()
                });
        }

        return result;
    }
}