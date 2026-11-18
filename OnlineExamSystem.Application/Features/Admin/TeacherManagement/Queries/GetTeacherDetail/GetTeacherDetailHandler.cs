using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Queries.GetTeacherDetail;

public class GetTeacherDetailHandler
    : IRequestHandler<GetTeacherDetailQuery, AdminTeacherDetailDto>
{
    // Giới hạn danh sách hiển thị để drawer luôn nhẹ; các số đếm vẫn là tổng thật.
    private const int MaxRecentQuestions = 30;
    private const int MaxExams = 100;
    private const int MaxPracticeStudents = 100;
    private const int MaxRecentAttempts = 30;

    private readonly IApplicationDbContext _context;

    public GetTeacherDetailHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminTeacherDetailDto> Handle(
        GetTeacherDetailQuery request,
        CancellationToken cancellationToken)
    {
        var teacher = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.Id == request.TeacherId)
            .Select(x => new
            {
                x.Id,
                x.SubjectId,
                x.GradeId,
                x.SDT,
                x.User.Ho,
                x.User.TenDem,
                x.User.Ten,
                x.User.Email,
                x.User.IsLocked,
                x.User.CreatedAt,
                TenMH = x.Subject != null ? x.Subject.TenMH : null,
                TenKhoi = x.Grade != null ? x.Grade.TenKhoi : null
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (teacher == null)
        {
            throw new KeyNotFoundException("Không tìm thấy giáo viên.");
        }

        var teacherId = teacher.Id;

        // ================= CÂU HỎI =================

        // Chỉ lấy cột độ khó cho toàn bộ câu hỏi (nhẹ), nội dung chỉ lấy cho các câu mới nhất.
        var difficulties = await _context.Questions
            .AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .Select(x => x.Difficulty)
            .ToListAsync(cancellationToken);

        var difficultyStats = new AdminTeacherDifficultyStatsDto();

        foreach (var difficulty in difficulties)
        {
            switch (NormalizeDifficulty(difficulty))
            {
                case "easy":
                    difficultyStats.Easy++;
                    break;
                case "medium":
                    difficultyStats.Medium++;
                    break;
                case "hard":
                    difficultyStats.Hard++;
                    break;
                default:
                    difficultyStats.Other++;
                    break;
            }
        }

        var recentQuestionRows = await _context.Questions
            .AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(MaxRecentQuestions)
            .Select(x => new
            {
                x.Id,
                x.NoiDung,
                x.Difficulty,
                x.CreatedAt,
                TopicName = x.Topic != null ? x.Topic.Name : null
            })
            .ToListAsync(cancellationToken);

        var recentQuestions = recentQuestionRows
            .Select(x => new AdminTeacherQuestionItemDto
            {
                Id = x.Id,
                NoiDung = x.NoiDung ?? string.Empty,
                Difficulty = NormalizeDifficulty(x.Difficulty),
                TopicName = x.TopicName ?? string.Empty,
                CreatedAt = x.CreatedAt
            })
            .ToList();

        // ================= ĐỀ THI =================

        var examRows = await _context.Exams
            .AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .OrderBy(x => x.TenBaiKT)
            .Select(x => new
            {
                x.Id,
                x.TenBaiKT,
                x.ThoiLuong,
                x.IsPublished,
                x.IsSubmittedForApproval,
                x.IsRejected,
                x.RejectionNote,
                TotalQuestions = x.ExamQuestions.Count
            })
            .ToListAsync(cancellationToken);

        var examIds = examRows
            .Select(x => x.Id)
            .ToList();

        var examResultRows = await _context.ExamResults
            .AsNoTracking()
            .Where(x => examIds.Contains(x.ExamId))
            .Select(x => new { x.ExamId, x.Diem })
            .ToListAsync(cancellationToken);

        var resultsByExam = examResultRows
            .GroupBy(x => x.ExamId)
            .ToDictionary(
                group => group.Key,
                group => (
                    Count: group.Count(),
                    Average: group.Average(item => item.Diem)));

        var examStatusStats = new AdminTeacherExamStatusStatsDto();

        var exams = new List<AdminTeacherExamItemDto>();

        foreach (var row in examRows)
        {
            var status = GetExamStatus(
                row.IsPublished,
                row.IsSubmittedForApproval,
                row.IsRejected);

            switch (status)
            {
                case "published":
                    examStatusStats.Published++;
                    break;
                case "pending":
                    examStatusStats.Pending++;
                    break;
                case "rejected":
                    examStatusStats.Rejected++;
                    break;
                default:
                    examStatusStats.Draft++;
                    break;
            }

            if (exams.Count < MaxExams)
            {
                var hasResults = resultsByExam.TryGetValue(row.Id, out var examResult);

                exams.Add(new AdminTeacherExamItemDto
                {
                    Id = row.Id,
                    TenBaiKT = row.TenBaiKT ?? string.Empty,
                    ThoiLuong = row.ThoiLuong,
                    TotalQuestions = row.TotalQuestions,
                    Status = status,
                    SubmissionsCount = hasResults ? examResult.Count : 0,
                    AverageScore = hasResults
                        ? Math.Round(examResult.Average, 2)
                        : null,
                    RejectionNote = status == "rejected" ? row.RejectionNote : null
                });
            }
        }

        // ================= LUYỆN TẬP =================

        var students = await _context.Students
            .AsNoTracking()
            .Where(x => x.GradeId == teacher.GradeId)
            .Select(x => new
            {
                x.Id,
                x.MaHS,
                x.User.Ho,
                x.User.TenDem,
                x.User.Ten
            })
            .ToListAsync(cancellationToken);

        var studentMap = students.ToDictionary(x => x.Id);

        var totalTopics = await _context.Topics
            .AsNoTracking()
            .CountAsync(
                x => x.SubjectId == teacher.SubjectId &&
                     x.GradeId == teacher.GradeId &&
                     x.IsActive,
                cancellationToken);

        // Cùng định nghĩa với cổng giáo viên: chuyên đề đúng môn + khối của giáo viên,
        // học sinh cùng khối.
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
                x.Score,
                x.CorrectAnswers,
                x.TotalQuestions,
                x.SubmittedAt
            })
            .ToListAsync(cancellationToken);

        var practiceStudentRows = attempts
            .GroupBy(x => x.StudentId)
            .Select(group =>
            {
                studentMap.TryGetValue(group.Key, out var student);

                return new AdminTeacherPracticeStudentDto
                {
                    StudentId = group.Key,
                    MaHS = student?.MaHS ?? string.Empty,
                    StudentName = student == null
                        ? string.Empty
                        : JoinName(student.Ho, student.TenDem, student.Ten),
                    AttemptsCount = group.Count(),
                    PracticedTopicsCount = group
                        .Select(item => item.TopicId)
                        .Distinct()
                        .Count(),
                    AverageScore = Math.Round(
                        group.Average(item => (double)item.Score),
                        2),
                    LastSubmittedAt = group.Max(item => item.SubmittedAt)
                };
            })
            .OrderByDescending(x => x.AttemptsCount)
            .ThenBy(x => x.StudentName)
            .ToList();

        var recentAttempts = attempts
            .Take(MaxRecentAttempts)
            .Select(x =>
            {
                studentMap.TryGetValue(x.StudentId, out var student);

                return new AdminTeacherPracticeAttemptItemDto
                {
                    AttemptId = x.Id,
                    StudentName = student == null
                        ? string.Empty
                        : JoinName(student.Ho, student.TenDem, student.Ten),
                    TopicName = x.TopicName ?? string.Empty,
                    Score = (double)x.Score,
                    CorrectAnswers = x.CorrectAnswers,
                    TotalQuestions = x.TotalQuestions,
                    SubmittedAt = x.SubmittedAt
                };
            })
            .ToList();

        var practice = new AdminTeacherPracticeSummaryDto
        {
            AttemptsCount = attempts.Count,
            StudentsCount = practiceStudentRows.Count,
            PracticedTopicsCount = attempts
                .Select(x => x.TopicId)
                .Distinct()
                .Count(),
            TotalTopicsCount = totalTopics,
            AverageScore = attempts.Count == 0
                ? null
                : Math.Round(attempts.Average(x => (double)x.Score), 2),
            Students = practiceStudentRows
                .Take(MaxPracticeStudents)
                .ToList(),
            RecentAttempts = recentAttempts
        };

        return new AdminTeacherDetailDto
        {
            Id = teacher.Id,
            HoTen = JoinName(teacher.Ho, teacher.TenDem, teacher.Ten),
            Email = teacher.Email ?? string.Empty,
            SDT = teacher.SDT ?? string.Empty,
            TenMH = teacher.TenMH,
            TenKhoi = teacher.TenKhoi,
            IsLocked = teacher.IsLocked,
            CreatedAt = teacher.CreatedAt,
            QuestionsCount = difficulties.Count,
            ExamsCount = examRows.Count,
            StudentsCount = students.Count,
            ExamSubmissionsCount = examResultRows.Count,
            QuestionsByDifficulty = difficultyStats,
            RecentQuestions = recentQuestions,
            ExamsByStatus = examStatusStats,
            Exams = exams,
            Practice = practice
        };
    }

    private static string JoinName(string? ho, string? tenDem, string? ten)
    {
        return string.Join(
            " ",
            new[] { ho, tenDem, ten }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Select(part => part!.Trim()));
    }

    private static string NormalizeDifficulty(string? difficulty)
    {
        return (difficulty ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string GetExamStatus(
        bool isPublished,
        bool isSubmittedForApproval,
        bool isRejected)
    {
        if (isPublished)
        {
            return "published";
        }

        if (isSubmittedForApproval)
        {
            return "pending";
        }

        if (isRejected)
        {
            return "rejected";
        }

        return "draft";
    }
}
