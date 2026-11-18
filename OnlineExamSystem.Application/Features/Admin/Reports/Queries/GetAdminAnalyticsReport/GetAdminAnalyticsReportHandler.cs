using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Admin;

namespace OnlineExamSystem.Application.Features.Admin.Reports.Queries.GetAdminAnalyticsReport;

public class GetAdminAnalyticsReportHandler
    : IRequestHandler<GetAdminAnalyticsReportQuery, AdminAnalyticsReportDto>
{
    private const double PassingScore = 5d;
    private readonly IApplicationDbContext _context;

    public GetAdminAnalyticsReportHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminAnalyticsReportDto> Handle(
        GetAdminAnalyticsReportQuery request,
        CancellationToken cancellationToken)
    {
        var users = await _context.Users.AsNoTracking()
            .Select(x => new { x.Id, x.CreatedAt, x.IsLocked })
            .ToListAsync(cancellationToken);

        var subjects = await _context.Subjects.AsNoTracking()
            .Select(x => new { x.Id, x.TenMH })
            .ToListAsync(cancellationToken);

        var questions = await _context.Questions.AsNoTracking()
            .Select(x => new { x.Id, x.SubjectId, x.TeacherId })
            .ToListAsync(cancellationToken);

        var exams = await _context.Exams.AsNoTracking()
            .Select(x => new
            {
                x.Id,
                x.SubjectId,
                x.TeacherId,
                x.TenBaiKT,
                x.ThoiLuong,
                x.IsPublished,
                TotalQuestions = x.ExamQuestions.Count
            })
            .ToListAsync(cancellationToken);

        var examResults = await _context.ExamResults.AsNoTracking()
            .Select(x => new { x.ExamId, x.StudentId, x.Diem, x.SubmittedAt })
            .ToListAsync(cancellationToken);

        var practiceAttempts = await _context.PracticeAttempts.AsNoTracking()
            .Select(x => new
            {
                x.StudentId,
                SubjectId = x.Topic.SubjectId,
                x.Score,
                x.SubmittedAt
            })
            .ToListAsync(cancellationToken);

        var teachers = await _context.Teachers.AsNoTracking()
            .Select(x => new
            {
                x.Id,
                x.SubjectId,
                TeacherName = ((x.User.Ho ?? "") + " " + (x.User.TenDem ?? "") + " " + (x.User.Ten ?? "")).Trim(),
                SubjectName = x.Subject.TenMH,
                GradeName = x.Grade.TenKhoi
            })
            .ToListAsync(cancellationToken);

        var students = await _context.Students.AsNoTracking()
            .Select(x => new
            {
                x.Id,
                x.MaHS,
                StudentName = ((x.User.Ho ?? "") + " " + (x.User.TenDem ?? "") + " " + (x.User.Ten ?? "")).Trim(),
                GradeName = x.Grade.TenKhoi
            })
            .ToListAsync(cancellationToken);

        var subjectRows = subjects.Select(subject =>
        {
            var subjectExamIds = exams.Where(x => x.SubjectId == subject.Id).Select(x => x.Id).ToHashSet();
            var results = examResults.Where(x => subjectExamIds.Contains(x.ExamId)).ToList();
            var practices = practiceAttempts.Where(x => x.SubjectId == subject.Id).ToList();

            return new AdminSubjectReportDto
            {
                SubjectId = subject.Id,
                SubjectName = subject.TenMH,
                QuestionCount = questions.Count(x => x.SubjectId == subject.Id),
                ExamCount = subjectExamIds.Count,
                PublishedExamCount = exams.Count(x => x.SubjectId == subject.Id && x.IsPublished),
                ExamAttemptCount = results.Count,
                PracticeAttemptCount = practices.Count,
                AverageExamScore = results.Count == 0 ? 0 : Math.Round(results.Average(x => x.Diem), 2)
            };
        }).OrderBy(x => x.SubjectName).ToList();

        var teacherRows = teachers.Select(teacher =>
        {
            var teacherExams = exams.Where(x => x.TeacherId == teacher.Id).ToList();
            var examIds = teacherExams.Select(x => x.Id).ToHashSet();
            var results = examResults.Where(x => examIds.Contains(x.ExamId)).ToList();

            return new AdminTeacherReportDto
            {
                TeacherId = teacher.Id,
                TeacherName = teacher.TeacherName,
                SubjectName = teacher.SubjectName,
                GradeName = teacher.GradeName,
                QuestionCount = questions.Count(x => x.TeacherId == teacher.Id),
                ExamCount = teacherExams.Count,
                PublishedExamCount = teacherExams.Count(x => x.IsPublished),
                ExamAttemptCount = results.Count,
                AverageStudentScore = results.Count == 0 ? 0 : Math.Round(results.Average(x => x.Diem), 2)
            };
        }).OrderBy(x => x.TeacherName).ToList();

        var studentRows = students.Select(student =>
        {
            var results = examResults.Where(x => x.StudentId == student.Id).ToList();
            var practices = practiceAttempts.Where(x => x.StudentId == student.Id).ToList();
            var lastExam = results.Select(x => (DateTime?)x.SubmittedAt).Max();
            var lastPractice = practices.Select(x => (DateTime?)x.SubmittedAt).Max();

            return new AdminStudentReportDto
            {
                StudentId = student.Id,
                StudentCode = student.MaHS,
                StudentName = student.StudentName,
                GradeName = student.GradeName,
                ExamAttemptCount = results.Count,
                PracticeAttemptCount = practices.Count,
                AverageExamScore = results.Count == 0 ? 0 : Math.Round(results.Average(x => x.Diem), 2),
                AveragePracticeScore = practices.Count == 0 ? 0 : Math.Round(practices.Average(x => x.Score), 2),
                LastActivityAt = lastExam > lastPractice ? lastExam : lastPractice
            };
        }).OrderByDescending(x => x.AverageExamScore).ThenBy(x => x.StudentName).ToList();

        var teacherNames = teachers.ToDictionary(x => x.Id, x => x.TeacherName);
        var subjectNames = subjects.ToDictionary(x => x.Id, x => x.TenMH);
        var examRows = exams.Select(exam =>
        {
            var results = examResults.Where(x => x.ExamId == exam.Id).ToList();
            return new AdminExamReportDto
            {
                ExamId = exam.Id,
                ExamName = exam.TenBaiKT,
                SubjectName = subjectNames.GetValueOrDefault(exam.SubjectId, "Chưa xác định"),
                TeacherName = teacherNames.GetValueOrDefault(exam.TeacherId, "Chưa xác định"),
                DurationMinutes = exam.ThoiLuong,
                IsPublished = exam.IsPublished,
                TotalQuestions = exam.TotalQuestions,
                AttemptCount = results.Count,
                StudentCount = results.Select(x => x.StudentId).Distinct().Count(),
                AverageScore = results.Count == 0 ? 0 : Math.Round(results.Average(x => x.Diem), 2),
                HighestScore = results.Count == 0 ? 0 : Math.Round(results.Max(x => x.Diem), 2),
                LowestScore = results.Count == 0 ? 0 : Math.Round(results.Min(x => x.Diem), 2),
                PassRate = results.Count == 0 ? 0 : Math.Round((double)results.Count(x => x.Diem >= PassingScore) / results.Count * 100, 2)
            };
        }).OrderByDescending(x => x.AttemptCount).ThenBy(x => x.ExamName).ToList();

        var firstMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5);
        var monthly = Enumerable.Range(0, 6).Select(offset => firstMonth.AddMonths(offset)).Select(month =>
        {
            var nextMonth = month.AddMonths(1);
            var monthlyExamResults = examResults
                .Where(x => x.SubmittedAt >= month && x.SubmittedAt < nextMonth)
                .ToList();
            var monthlyPracticeAttempts = practiceAttempts
                .Where(x => x.SubmittedAt >= month && x.SubmittedAt < nextMonth)
                .ToList();
            return new AdminMonthlyActivityDto
            {
                Label = $"Thg {month.Month}/{month.Year}",
                NewUsers = users.Count(x => x.CreatedAt >= month && x.CreatedAt < nextMonth),
                ExamAttempts = monthlyExamResults.Count,
                PracticeAttempts = monthlyPracticeAttempts.Count,
                AverageExamScore = monthlyExamResults.Count == 0
                    ? 0
                    : Math.Round(monthlyExamResults.Average(x => x.Diem), 2),
                AveragePracticeScore = monthlyPracticeAttempts.Count == 0
                    ? 0
                    : Math.Round(monthlyPracticeAttempts.Average(x => x.Score), 2)
            };
        }).ToList();

        return new AdminAnalyticsReportDto
        {
            TotalUsers = users.Count,
            LockedUsers = users.Count(x => x.IsLocked),
            TotalStudents = students.Count,
            TotalTeachers = teachers.Count,
            TotalQuestions = questions.Count,
            TotalExams = exams.Count,
            PublishedExams = exams.Count(x => x.IsPublished),
            ExamAttemptCount = examResults.Count,
            PracticeAttemptCount = practiceAttempts.Count,
            AverageExamScore = examResults.Count == 0 ? 0 : Math.Round(examResults.Average(x => x.Diem), 2),
            AveragePracticeScore = practiceAttempts.Count == 0 ? 0 : Math.Round(practiceAttempts.Average(x => x.Score), 2),
            ExamPassRate = examResults.Count == 0 ? 0 : Math.Round((double)examResults.Count(x => x.Diem >= PassingScore) / examResults.Count * 100, 2),
            MonthlyActivity = monthly,
            Subjects = subjectRows,
            Teachers = teacherRows,
            Students = studentRows,
            Exams = examRows
        };
    }
}
