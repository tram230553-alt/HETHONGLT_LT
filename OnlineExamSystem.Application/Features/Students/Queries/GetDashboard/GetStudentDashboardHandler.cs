using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetDashboard;

public class GetStudentDashboardHandler : IRequestHandler<GetStudentDashboardQuery, StudentDashboardDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetStudentDashboardHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<StudentDashboardDto> Handle(GetStudentDashboardQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được học sinh đang đăng nhập.");

        var student = await _context.Students.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new
            {
                x.Id, x.GradeId, x.MaHS,
                GradeName = x.Grade.TenKhoi,
                Name = ((x.User.Ho ?? "") + " " + (x.User.TenDem ?? "") + " " + (x.User.Ten ?? "")).Trim()
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ học sinh.");

        var rawExamResults = await _context.ExamResults.AsNoTracking()
            .Where(x => x.StudentId == student.Id)
            .Select(x => new { x.Diem, x.SubmittedAt, x.ExamId })
            .ToListAsync(cancellationToken);
        var rawPracticeAttempts = await _context.PracticeAttempts.AsNoTracking()
            .Where(x => x.StudentId == student.Id)
            .Select(x => new { x.Score, x.SubmittedAt, TopicName = x.Topic.Name, x.Topic.SubjectId })
            .ToListAsync(cancellationToken);
        var examDefinitions = await _context.Exams.AsNoTracking()
            .Select(x => new { x.Id, x.SubjectId, x.GradeId, x.TeacherId, x.TenBaiKT, x.ThoiLuong, x.IsPublished, TotalQuestions = x.ExamQuestions.Count })
            .ToListAsync(cancellationToken);
        var subjects = await _context.Subjects.AsNoTracking()
            .Select(x => new { x.Id, x.TenMH }).ToListAsync(cancellationToken);
        var teachers = await _context.Teachers.AsNoTracking()
            .Select(x => new { x.Id, Name = ((x.User.Ho ?? "") + " " + (x.User.TenDem ?? "") + " " + (x.User.Ten ?? "")).Trim() })
            .ToListAsync(cancellationToken);
        var activeTopics = await _context.Topics.AsNoTracking()
            .Where(x => x.GradeId == student.GradeId && x.IsActive)
            .Select(x => new { x.SubjectId }).ToListAsync(cancellationToken);

        var examMap = examDefinitions.ToDictionary(x => x.Id);
        var subjectMap = subjects.ToDictionary(x => x.Id, x => x.TenMH);
        var teacherMap = teachers.ToDictionary(x => x.Id, x => x.Name);
        var examResults = rawExamResults.Where(x => examMap.ContainsKey(x.ExamId)).Select(x => new
        {
            x.Diem, x.SubmittedAt, x.ExamId,
            ExamName = examMap[x.ExamId].TenBaiKT,
            SubjectId = examMap[x.ExamId].SubjectId,
            SubjectName = subjectMap.GetValueOrDefault(examMap[x.ExamId].SubjectId, "Chưa xác định")
        }).ToList();
        var practiceAttempts = rawPracticeAttempts.Select(x => new
        {
            x.Score, x.SubmittedAt, x.TopicName, x.SubjectId,
            SubjectName = subjectMap.GetValueOrDefault(x.SubjectId, "Chưa xác định")
        }).ToList();

        var availableExams = examDefinitions
            .Where(x => x.GradeId == student.GradeId && x.IsPublished)
            .OrderBy(x => x.TenBaiKT)
            .Select(x => new StudentDashboardExamDto
            {
                ExamId = x.Id, SubjectId = x.SubjectId, ExamName = x.TenBaiKT,
                SubjectName = subjectMap.GetValueOrDefault(x.SubjectId, "Chưa xác định"),
                TeacherName = teacherMap.GetValueOrDefault(x.TeacherId, "Chưa xác định"),
                DurationMinutes = x.ThoiLuong, TotalQuestions = x.TotalQuestions
            }).ToList();

        var activityDates = examResults.Select(x => x.SubmittedAt.Date)
            .Concat(practiceAttempts.Select(x => x.SubmittedAt.Date)).Distinct().ToHashSet();
        var today = DateTime.UtcNow.Date;
        var streakCursor = activityDates.Contains(today) ? today : today.AddDays(-1);
        var streak = 0;
        while (activityDates.Contains(streakCursor)) { streak++; streakCursor = streakCursor.AddDays(-1); }

        var firstMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5);
        var monthly = Enumerable.Range(0, 6).Select(offset => firstMonth.AddMonths(offset)).Select(month =>
        {
            var next = month.AddMonths(1);
            var examScores = examResults.Where(x => x.SubmittedAt >= month && x.SubmittedAt < next).Select(x => x.Diem).ToList();
            var practiceScores = practiceAttempts.Where(x => x.SubmittedAt >= month && x.SubmittedAt < next).Select(x => (double)x.Score).ToList();
            var scores = examScores.Concat(practiceScores).ToList();
            return new StudentDashboardMonthlyDto
            {
                Label = $"Thg {month.Month}/{month.Year}", ExamAttempts = examScores.Count,
                PracticeAttempts = practiceScores.Count, AverageScore = scores.Count == 0 ? 0 : Math.Round(scores.Average(), 2)
            };
        }).ToList();

        var relevantSubjectIds = activeTopics.Select(x => x.SubjectId)
            .Concat(availableExams.Select(x => x.SubjectId))
            .Concat(examResults.Select(x => x.SubjectId))
            .Concat(practiceAttempts.Select(x => x.SubjectId)).Distinct().ToList();
        var subjectRows = relevantSubjectIds.Select(subjectId =>
        {
            var exams = examResults.Where(x => x.SubjectId == subjectId).Select(x => x.Diem).ToList();
            var practices = practiceAttempts.Where(x => x.SubjectId == subjectId).Select(x => (double)x.Score).ToList();
            var scores = exams.Concat(practices).ToList();
            return new StudentDashboardSubjectDto
            {
                SubjectId = subjectId, SubjectName = subjectMap.GetValueOrDefault(subjectId, "Chưa xác định"),
                ExamAttempts = exams.Count, PracticeAttempts = practices.Count,
                AverageScore = scores.Count == 0 ? 0 : Math.Round(scores.Average(), 2)
            };
        }).OrderBy(x => x.SubjectName).ToList();

        var recent = examResults.Select(x => new StudentDashboardActivityDto { Type = "exam", Title = x.ExamName, SubjectName = x.SubjectName, Score = x.Diem, SubmittedAt = x.SubmittedAt })
            .Concat(practiceAttempts.Select(x => new StudentDashboardActivityDto { Type = "practice", Title = x.TopicName, SubjectName = x.SubjectName, Score = (double)x.Score, SubmittedAt = x.SubmittedAt }))
            .OrderByDescending(x => x.SubmittedAt).Take(8).ToList();

        return new StudentDashboardDto
        {
            StudentName = student.Name, StudentCode = student.MaHS, GradeName = student.GradeName,
            TotalExamAttempts = examResults.Count, TotalPracticeAttempts = practiceAttempts.Count,
            AverageExamScore = examResults.Count == 0 ? 0 : Math.Round(examResults.Average(x => x.Diem), 2),
            AveragePracticeScore = practiceAttempts.Count == 0 ? 0 : Math.Round(practiceAttempts.Average(x => x.Score), 2),
            CurrentStreak = streak, ActiveDaysLast7 = activityDates.Count(x => x >= today.AddDays(-6) && x <= today),
            AvailableExamCount = availableExams.Count, ActiveTopicCount = activeTopics.Count,
            MonthlyActivity = monthly, Subjects = subjectRows, AvailableExams = availableExams.Take(5).ToList(), RecentActivities = recent
        };
    }
}
