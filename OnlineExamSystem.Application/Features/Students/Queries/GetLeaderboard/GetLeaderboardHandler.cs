using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students
    .Queries.GetLeaderboard;

public class GetLeaderboardHandler
    : IRequestHandler<
        GetLeaderboardQuery,
        List<StudentLeaderboardDto>>
{
    private readonly IApplicationDbContext _context;

    public GetLeaderboardHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    private sealed class LeaderboardRecordItem
    {
        public Guid StudentId { get; init; }
        public string StudentName { get; init; } = string.Empty;
        public Guid? GradeId { get; init; }
        public string? Khoi { get; init; }
        public double Score { get; init; }
        public int TotalQuestions { get; init; }
        public int CorrectAnswers { get; init; }
        public bool IsExam { get; init; }
    }

    public async Task<List<StudentLeaderboardDto>> Handle(
        GetLeaderboardQuery request,
        CancellationToken cancellationToken)
    {
        var limit = request.Limit;
        if (limit <= 0) limit = 50;
        if (limit > 100) limit = 100;

        var mode = (request.Mode ?? "all").Trim().ToLowerInvariant();
        var includeExam = mode == "all" || mode == "exam";
        var includePractice = mode == "all" || mode == "practice";

        var records = new List<LeaderboardRecordItem>();

        // 1. DỮ LIỆU LUYỆN THI (ExamResults)
        if (includeExam)
        {
            var examQuery =
                from result in _context.ExamResults.AsNoTracking()
                join student in _context.Students.AsNoTracking()
                    on result.StudentId equals student.Id
                join user in _context.Users.AsNoTracking()
                    on student.UserId equals user.Id
                join grade in _context.Grades.AsNoTracking()
                    on student.GradeId equals grade.Id into gradeJoin
                from grade in gradeJoin.DefaultIfEmpty()
                join exam in _context.Exams.AsNoTracking()
                    on result.ExamId equals exam.Id
                select new
                {
                    ResultId = result.Id,
                    StudentId = student.Id,
                    Ho = user.Ho ?? "",
                    TenDem = user.TenDem ?? "",
                    Ten = user.Ten ?? "",
                    GradeId = (Guid?)student.GradeId,
                    Khoi = grade != null ? grade.TenKhoi : null,
                    SubjectId = exam.SubjectId,
                    Score = (double)result.Diem
                };

            if (request.GradeId.HasValue)
            {
                var gId = request.GradeId.Value;
                examQuery = examQuery.Where(x => x.GradeId == gId);
            }

            if (request.SubjectId.HasValue)
            {
                var sId = request.SubjectId.Value;
                examQuery = examQuery.Where(x => x.SubjectId == sId);
            }

            var rawExams = await examQuery.ToListAsync(cancellationToken);

            if (rawExams.Count > 0)
            {
                var resultIds = rawExams.Select(x => x.ResultId).ToList();
                var examAnswerStats = await _context.StudentAnswers.AsNoTracking()
                    .Where(a => resultIds.Contains(a.ExamResultId))
                    .GroupBy(a => a.ExamResultId)
                    .Select(g => new
                    {
                        ExamResultId = g.Key,
                        TotalQuestions = g.Count(),
                        CorrectAnswers = g.Count(a => a.IsCorrect)
                    })
                    .ToDictionaryAsync(x => x.ExamResultId, cancellationToken);

                foreach (var item in rawExams)
                {
                    examAnswerStats.TryGetValue(item.ResultId, out var aStat);
                    var fullName = $"{item.Ho} {item.TenDem} {item.Ten}".Replace("  ", " ").Trim();
                    records.Add(new LeaderboardRecordItem
                    {
                        StudentId = item.StudentId,
                        StudentName = string.IsNullOrWhiteSpace(fullName) ? "Học sinh" : fullName,
                        GradeId = item.GradeId,
                        Khoi = item.Khoi,
                        Score = item.Score,
                        TotalQuestions = aStat?.TotalQuestions ?? 0,
                        CorrectAnswers = aStat?.CorrectAnswers ?? 0,
                        IsExam = true
                    });
                }
            }
        }

        // 2. DỮ LIỆU LUYỆN TẬP CHỦ ĐỀ (PracticeAttempts)
        if (includePractice)
        {
            var practiceQuery =
                from attempt in _context.PracticeAttempts.AsNoTracking()
                join student in _context.Students.AsNoTracking()
                    on attempt.StudentId equals student.Id
                join user in _context.Users.AsNoTracking()
                    on student.UserId equals user.Id
                join grade in _context.Grades.AsNoTracking()
                    on student.GradeId equals grade.Id into gradeJoin
                from grade in gradeJoin.DefaultIfEmpty()
                join topic in _context.Topics.AsNoTracking()
                    on attempt.TopicId equals topic.Id
                select new
                {
                    StudentId = student.Id,
                    Ho = user.Ho ?? "",
                    TenDem = user.TenDem ?? "",
                    Ten = user.Ten ?? "",
                    GradeId = (Guid?)student.GradeId,
                    Khoi = grade != null ? grade.TenKhoi : null,
                    SubjectId = topic.SubjectId,
                    Score = (double)attempt.Score,
                    TotalQuestions = attempt.TotalQuestions,
                    CorrectAnswers = attempt.CorrectAnswers
                };

            if (request.GradeId.HasValue)
            {
                var gId = request.GradeId.Value;
                practiceQuery = practiceQuery.Where(x => x.GradeId == gId);
            }

            if (request.SubjectId.HasValue)
            {
                var sId = request.SubjectId.Value;
                practiceQuery = practiceQuery.Where(x => x.SubjectId == sId);
            }

            var rawPractices = await practiceQuery.ToListAsync(cancellationToken);

            foreach (var item in rawPractices)
            {
                var fullName = $"{item.Ho} {item.TenDem} {item.Ten}".Replace("  ", " ").Trim();
                records.Add(new LeaderboardRecordItem
                {
                    StudentId = item.StudentId,
                    StudentName = string.IsNullOrWhiteSpace(fullName) ? "Học sinh" : fullName,
                    GradeId = item.GradeId,
                    Khoi = item.Khoi,
                    Score = item.Score,
                    TotalQuestions = item.TotalQuestions,
                    CorrectAnswers = item.CorrectAnswers,
                    IsExam = false
                });
            }
        }

        // 3. TỔNG HỢP & XẾP HẠNG THEO HỌC SINH
        var grouped = records
            .GroupBy(x => x.StudentId)
            .Select(g =>
            {
                var first = g.First();
                var totalExams = g.Count(x => x.IsExam);
                var totalPractices = g.Count(x => !x.IsExam);
                var totalAttempts = g.Count();
                var avgScore = totalAttempts == 0 ? 0 : g.Average(x => x.Score);

                return new
                {
                    StudentId = g.Key,
                    first.StudentName,
                    first.GradeId,
                    first.Khoi,
                    AverageScore = Math.Round(avgScore, 2),
                    TotalExams = totalExams,
                    TotalPractices = totalPractices,
                    TotalAttempts = totalAttempts,
                    TotalQuestions = g.Sum(x => x.TotalQuestions),
                    TotalCorrectAnswers = g.Sum(x => x.CorrectAnswers)
                };
            })
            .OrderByDescending(x => x.AverageScore)
            .ThenByDescending(x => x.TotalCorrectAnswers)
            .ThenByDescending(x => x.TotalAttempts)
            .ThenBy(x => x.StudentName)
            .Take(limit)
            .ToList();

        var resultList = new List<StudentLeaderboardDto>(grouped.Count);
        for (var i = 0; i < grouped.Count; i++)
        {
            var item = grouped[i];
            resultList.Add(new StudentLeaderboardDto
            {
                Rank = i + 1,
                StudentId = item.StudentId,
                StudentName = item.StudentName,
                GradeId = item.GradeId,
                Khoi = item.Khoi,
                AverageScore = item.AverageScore,
                TotalExams = item.TotalExams,
                TotalPractices = item.TotalPractices,
                TotalAttempts = item.TotalAttempts,
                TotalQuestions = item.TotalQuestions,
                TotalCorrectAnswers = item.TotalCorrectAnswers
            });
        }

        return resultList;
    }
}
