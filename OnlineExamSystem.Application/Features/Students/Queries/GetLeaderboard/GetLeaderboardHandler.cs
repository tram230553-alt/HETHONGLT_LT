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


    public async Task<List<StudentLeaderboardDto>> Handle(
        GetLeaderboardQuery request,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // 1. GIỚI HẠN LIMIT
        // ==========================================

        var limit = request.Limit;

        if (limit <= 0)
        {
            limit = 10;
        }

        if (limit > 100)
        {
            limit = 100;
        }


        // ==========================================
        // 2. LẤY RESULT
        // ==========================================

        var query =
     from result in
         _context.ExamResults.AsNoTracking()

     join student in
         _context.Students.AsNoTracking()
         on result.StudentId equals student.Id

     join user in
         _context.Users.AsNoTracking()
         on student.UserId equals user.Id

     join exam in
         _context.Exams.AsNoTracking()
         on result.ExamId equals exam.Id

     select new
     {
         StudentId = student.Id,

         StudentName =
             user.Ten,


         GradeId =
             student.GradeId,

         SubjectId =
             exam.SubjectId,

         Score =
             result.Diem
     };

        // ==========================================
        // 3. FILTER KHỐI
        // ==========================================

        if (request.GradeId.HasValue)
        {
            query = query.Where(
                x => x.GradeId ==
                     request.GradeId.Value);
        }


        // ==========================================
        // 4. FILTER MÔN
        // ==========================================

        if (request.SubjectId.HasValue)
        {
            query = query.Where(
                x => x.SubjectId ==
                     request.SubjectId.Value);
        }


        // ==========================================
        // 5. GROUP THEO STUDENT
        // ==========================================

        var leaderboard = await query
            .GroupBy(x => new
            {
                x.StudentId,
                x.StudentName,
                x.GradeId
            })

            .Select(group => new
            {
                group.Key.StudentId,

                group.Key.StudentName,


                group.Key.GradeId,

                AverageScore =
                    group.Average(x =>
                        (double?)x.Score) ?? 0,

                TotalExams =
                    group.Count()
            })

            .OrderByDescending(x =>
                x.AverageScore)

            .ThenByDescending(x =>
                x.TotalExams)

            .ThenBy(x =>
                x.StudentName)

            .Take(limit)

            .ToListAsync(cancellationToken);


        // ==========================================
        // 6. LẤY THÊM THỐNG KÊ CÂU TRẢ LỜI
        // ==========================================

        var studentIds =
            leaderboard
                .Select(x => x.StudentId)
                .ToList();


        var answerStats =
            await (
                from answer in
                    _context.StudentAnswers.AsNoTracking()

                join result in
                    _context.ExamResults.AsNoTracking()
                    on answer.ExamResultId equals result.Id

                where studentIds.Contains(
                    result.StudentId)

                group answer by result.StudentId
                into grouped

                select new
                {
                    StudentId =
                        grouped.Key,

                    TotalQuestions =
                        grouped.Count(),

                    TotalCorrectAnswers =
                        grouped.Count(
                            x => x.IsCorrect)
                }
            )
            .ToListAsync(
                cancellationToken);


        // ==========================================
        // 7. MAP DTO + RANK
        // ==========================================

        var resultList = new List<StudentLeaderboardDto>();

        for (var index = 0;
             index < leaderboard.Count;
             index++)
        {
            var item =
                leaderboard[index];

            var stats =
                answerStats.FirstOrDefault(
                    x =>
                        x.StudentId ==
                        item.StudentId);


            resultList.Add(
                new StudentLeaderboardDto
                {
                    Rank = index + 1,

                    StudentId =
                        item.StudentId,

                    StudentName =
                        item.StudentName,

                    GradeId =
                        item.GradeId,

                    AverageScore =
                        Math.Round(
                            item.AverageScore,
                            2),

                    TotalExams =
                        item.TotalExams,

                    TotalQuestions =
                        stats?.TotalQuestions ?? 0,

                    TotalCorrectAnswers =
                        stats?.TotalCorrectAnswers ?? 0
                });
        }


        return resultList;
    }
}