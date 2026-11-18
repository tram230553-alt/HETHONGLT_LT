using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetTeacherReport;

public class GetTeacherReportHandler
    : IRequestHandler<GetTeacherReportQuery, TeacherReportDto>
{
    private const double PassingScore = 5d;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetTeacherReportHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<TeacherReportDto> Handle(
        GetTeacherReportQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacher = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new { x.Id, x.SubjectId, x.GradeId })
            .FirstOrDefaultAsync(cancellationToken);

        if (teacher == null)
            throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        var questions = await _context.Questions
            .AsNoTracking()
            .Where(x => x.TeacherId == teacher.Id)
            .Select(x => new
            {
                x.Id,
                x.NoiDung,
                x.Difficulty,
                x.CreatedAt,
                TopicName = x.Topic != null ? x.Topic.Name : string.Empty,
                ChapterName = x.Topic != null ? x.Topic.Chapter.Name : string.Empty
            })
            .ToListAsync(cancellationToken);

        var exams = await _context.Exams
            .AsNoTracking()
            .Where(x => x.TeacherId == teacher.Id)
            .Select(x => new
            {
                x.Id,
                x.TenBaiKT,
                x.ThoiLuong,
                x.IsSubmittedForApproval,
                x.IsPublished,
                TotalQuestions = x.ExamQuestions.Count
            })
            .ToListAsync(cancellationToken);

        var examResults = await _context.ExamResults
            .AsNoTracking()
            .Where(x => x.Exam.TeacherId == teacher.Id)
            .Select(x => new
            {
                x.Id,
                x.ExamId,
                x.StudentId,
                x.Diem,
                x.SubmittedAt,
                ExamName = x.Exam.TenBaiKT,
                StudentCode = x.Student.MaHS,
                StudentName = ((x.Student.User.Ho ?? "") + " " +
                    (x.Student.User.TenDem ?? "") + " " +
                    (x.Student.User.Ten ?? "")).Trim()
            })
            .ToListAsync(cancellationToken);

        var practiceAttempts = await _context.PracticeAttempts
            .AsNoTracking()
            .Where(x =>
                x.Topic.SubjectId == teacher.SubjectId &&
                x.Topic.GradeId == teacher.GradeId &&
                x.Student.GradeId == teacher.GradeId)
            .Select(x => new { x.StudentId, x.Score, x.SubmittedAt })
            .ToListAsync(cancellationToken);

        var examAnswers = await _context.StudentAnswers
            .AsNoTracking()
            .Where(x =>
                x.Question.TeacherId == teacher.Id &&
                x.SelectedAnswer != null &&
                x.SelectedAnswer != string.Empty)
            .Select(x => new { x.QuestionId, x.IsCorrect })
            .ToListAsync(cancellationToken);

        var practiceAnswers = await _context.PracticeAnswers
            .AsNoTracking()
            .Where(x =>
                x.Question.TeacherId == teacher.Id &&
                x.StudentAnswer != null &&
                x.StudentAnswer != string.Empty)
            .Select(x => new { x.QuestionId, x.IsCorrect })
            .ToListAsync(cancellationToken);

        var answerStats = examAnswers
            .Concat(practiceAnswers)
            .GroupBy(x => x.QuestionId)
            .ToDictionary(
                x => x.Key,
                x => new { Answered = x.Count(), Correct = x.Count(a => a.IsCorrect) });

        var questionRows = questions
            .Select(x =>
            {
                answerStats.TryGetValue(x.Id, out var stats);
                var answered = stats?.Answered ?? 0;
                var correct = stats?.Correct ?? 0;

                return new TeacherReportQuestionDto
                {
                    QuestionId = x.Id,
                    QuestionText = x.NoiDung,
                    Difficulty = x.Difficulty,
                    TopicName = x.TopicName,
                    ChapterName = x.ChapterName,
                    AnsweredCount = answered,
                    CorrectCount = correct,
                    CorrectRate = answered == 0
                        ? 0
                        : Math.Round((double)correct / answered * 100, 2)
                };
            })
            .OrderByDescending(x => x.AnsweredCount)
            .ThenBy(x => x.QuestionText)
            .ToList();

        var examRows = exams
            .Select(x =>
            {
                var results = examResults.Where(r => r.ExamId == x.Id).ToList();
                return new TeacherReportExamDto
                {
                    ExamId = x.Id,
                    ExamName = x.TenBaiKT,
                    DurationMinutes = x.ThoiLuong,
                    IsPublished = x.IsPublished,
                    IsSubmittedForApproval = x.IsSubmittedForApproval,
                    TotalQuestions = x.TotalQuestions,
                    AttemptCount = results.Count,
                    ParticipatingStudentCount = results.Select(r => r.StudentId).Distinct().Count(),
                    AverageScore = results.Count == 0 ? 0 : Math.Round(results.Average(r => r.Diem), 2),
                    HighestScore = results.Count == 0 ? 0 : Math.Round(results.Max(r => r.Diem), 2),
                    LowestScore = results.Count == 0 ? 0 : Math.Round(results.Min(r => r.Diem), 2),
                    PassRate = results.Count == 0
                        ? 0
                        : Math.Round((double)results.Count(r => r.Diem >= PassingScore) / results.Count * 100, 2)
                };
            })
            .OrderByDescending(x => x.AttemptCount)
            .ThenBy(x => x.ExamName)
            .ToList();

        var firstMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5);
        var monthly = Enumerable.Range(0, 6)
            .Select(offset => firstMonth.AddMonths(offset))
            .Select(month =>
            {
                var nextMonth = month.AddMonths(1);
                var monthlyExamResults = examResults
                    .Where(x => x.SubmittedAt >= month && x.SubmittedAt < nextMonth)
                    .ToList();
                var monthlyPracticeAttempts = practiceAttempts
                    .Where(x => x.SubmittedAt >= month && x.SubmittedAt < nextMonth)
                    .ToList();
                return new TeacherReportMonthlyActivityDto
                {
                    Year = month.Year,
                    Month = month.Month,
                    Label = $"Thg {month.Month}/{month.Year}",
                    QuestionsCreated = questions.Count(x => x.CreatedAt >= month && x.CreatedAt < nextMonth),
                    ExamAttempts = monthlyExamResults.Count,
                    PracticeAttempts = monthlyPracticeAttempts.Count,
                    AverageExamScore = monthlyExamResults.Count == 0
                        ? 0
                        : Math.Round(monthlyExamResults.Average(x => x.Diem), 2),
                    AveragePracticeScore = monthlyPracticeAttempts.Count == 0
                        ? 0
                        : Math.Round(monthlyPracticeAttempts.Average(x => x.Score), 2)
                };
            })
            .ToList();

        var participatingStudents = examResults.Select(x => x.StudentId)
            .Concat(practiceAttempts.Select(x => x.StudentId))
            .Distinct()
            .Count();

        return new TeacherReportDto
        {
            TotalQuestions = questions.Count,
            TotalExams = exams.Count,
            PublishedExams = exams.Count(x => x.IsPublished),
            ExamAttemptCount = examResults.Count,
            PracticeAttemptCount = practiceAttempts.Count,
            ParticipatingStudentCount = participatingStudents,
            AverageExamScore = examResults.Count == 0 ? 0 : Math.Round(examResults.Average(x => x.Diem), 2),
            ExamPassRate = examResults.Count == 0
                ? 0
                : Math.Round((double)examResults.Count(x => x.Diem >= PassingScore) / examResults.Count * 100, 2),
            MonthlyActivity = monthly,
            Questions = questionRows,
            Exams = examRows,
            RecentSubmissions = examResults
                .OrderByDescending(x => x.SubmittedAt)
                .Take(10)
                .Select(x => new TeacherRecentSubmissionDto
                {
                    ExamResultId = x.Id,
                    StudentCode = x.StudentCode,
                    StudentName = x.StudentName,
                    ExamName = x.ExamName,
                    Score = Math.Round(x.Diem, 2),
                    SubmittedAt = x.SubmittedAt
                })
                .ToList()
        };
    }
}
