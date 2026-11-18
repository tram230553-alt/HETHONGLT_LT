using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Subjects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace OnlineExamSystem.Application.Features.Subjects.Queries.GetSubjectDetail
{
    public class GetSubjectDetailHandler
        : IRequestHandler<GetSubjectDetailQuery, SubjectDetailDto>
    {
        // Giới hạn danh sách hiển thị để drawer luôn nhẹ; các số đếm vẫn là tổng thật.
        private const int MaxRecentQuestions = 20;
        private const int MaxExams = 100;

        private readonly IApplicationDbContext _context;

        public GetSubjectDetailHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SubjectDetailDto> Handle(
            GetSubjectDetailQuery request,
            CancellationToken cancellationToken)
        {
            var subject = await _context.Subjects
                .AsNoTracking()
                .Where(x => x.Id == request.Id)
                .Select(x => new { x.Id, x.TenMH })
                .FirstOrDefaultAsync(cancellationToken);

            if (subject == null)
            {
                throw new KeyNotFoundException("Không tìm thấy môn học.");
            }

            var subjectId = subject.Id;

            // Các truy vấn đều đơn giản, phần gom nhóm làm trong bộ nhớ
            // để tránh các câu lệnh GROUP BY phức tạp khó dịch sang SQL.

            var chapterRows = await _context.Chapters
                .AsNoTracking()
                .Where(x => x.SubjectId == subjectId)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Order,
                    GradeName = x.Grade.TenKhoi
                })
                .ToListAsync(cancellationToken);

            var topicRows = await _context.Topics
                .AsNoTracking()
                .Where(x => x.SubjectId == subjectId)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.IsActive,
                    x.ChapterId,
                    x.OrderNum,
                    ChapterName = x.Chapter.Name,
                    ChapterOrder = x.Chapter.Order,
                    GradeName = x.Grade.TenKhoi
                })
                .ToListAsync(cancellationToken);

            var questionRows = await _context.Questions
                .AsNoTracking()
                .Where(x => x.SubjectId == subjectId)
                .Select(x => new { x.TopicId, x.Difficulty })
                .ToListAsync(cancellationToken);

            var questionsByTopic = questionRows
                .GroupBy(x => x.TopicId)
                .ToDictionary(group => group.Key, group => group.Count());

            var topicsByChapter = topicRows
                .GroupBy(x => x.ChapterId)
                .ToDictionary(group => group.Key, group => group.ToList());

            var chapters = chapterRows
                .OrderBy(x => x.GradeName)
                .ThenBy(x => x.Order)
                .Select(chapter =>
                {
                    topicsByChapter.TryGetValue(chapter.Id, out var chapterTopics);
                    chapterTopics ??= new();

                    return new SubjectChapterItemDto
                    {
                        Name = chapter.Name,
                        Order = chapter.Order,
                        GradeName = chapter.GradeName ?? string.Empty,
                        TopicsCount = chapterTopics.Count,
                        QuestionsCount = chapterTopics.Sum(t =>
                            questionsByTopic.TryGetValue(t.Id, out var count) ? count : 0)
                    };
                })
                .ToList();

            var topics = topicRows
                .OrderBy(x => x.GradeName)
                .ThenBy(x => x.ChapterOrder)
                .ThenBy(x => x.OrderNum)
                .Select(x => new SubjectTopicItemDto
                {
                    Id = x.Id,
                    Name = x.Name,
                    ChapterName = x.ChapterName ?? string.Empty,
                    GradeName = x.GradeName ?? string.Empty,
                    IsActive = x.IsActive,
                    QuestionsCount = questionsByTopic.TryGetValue(x.Id, out var count) ? count : 0
                })
                .ToList();

            var teacherRows = await _context.Teachers
                .AsNoTracking()
                .Where(x => x.SubjectId == subjectId)
                .Select(x => new
                {
                    x.Id,
                    x.User.Ho,
                    x.User.TenDem,
                    x.User.Ten,
                    x.User.Email,
                    x.User.IsLocked,
                    GradeName = x.Grade.TenKhoi
                })
                .ToListAsync(cancellationToken);

            var teachers = teacherRows
                .OrderBy(x => x.Ten)
                .Select(x => new SubjectTeacherItemDto
                {
                    Id = x.Id,
                    HoTen = JoinName(x.Ho, x.TenDem, x.Ten),
                    Email = x.Email ?? string.Empty,
                    GradeName = x.GradeName ?? string.Empty,
                    IsLocked = x.IsLocked
                })
                .ToList();

            var recentQuestionRows = await _context.Questions
                .AsNoTracking()
                .Where(x => x.SubjectId == subjectId)
                .OrderByDescending(x => x.CreatedAt)
                .Take(MaxRecentQuestions)
                .Select(x => new
                {
                    x.Id,
                    x.NoiDung,
                    x.Difficulty,
                    TopicName = x.Topic != null ? x.Topic.Name : null,
                    x.Teacher.User.Ho,
                    x.Teacher.User.TenDem,
                    x.Teacher.User.Ten
                })
                .ToListAsync(cancellationToken);

            var recentQuestions = recentQuestionRows
                .Select(x => new SubjectQuestionItemDto
                {
                    Id = x.Id,
                    NoiDung = x.NoiDung ?? string.Empty,
                    Difficulty = NormalizeDifficulty(x.Difficulty),
                    TopicName = x.TopicName ?? string.Empty,
                    CreatorName = JoinName(x.Ho, x.TenDem, x.Ten)
                })
                .ToList();

            var difficultyStats = new SubjectDifficultyStatsDto();

            foreach (var row in questionRows)
            {
                switch (NormalizeDifficulty(row.Difficulty))
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

            var gradeNames = await _context.Grades
                .AsNoTracking()
                .ToDictionaryAsync(x => x.Id, x => x.TenKhoi, cancellationToken);

            var examRows = await _context.Exams
                .AsNoTracking()
                .Where(x => x.SubjectId == subjectId)
                .OrderBy(x => x.TenBaiKT)
                .Select(x => new
                {
                    x.Id,
                    x.TenBaiKT,
                    x.ThoiLuong,
                    x.GradeId,
                    x.TeacherId,
                    x.IsPublished,
                    x.IsSubmittedForApproval,
                    x.IsRejected,
                    TotalQuestions = x.ExamQuestions.Count
                })
                .ToListAsync(cancellationToken);

            var examTeacherIds = examRows
                .Select(x => x.TeacherId)
                .Distinct()
                .ToList();

            var examTeacherRows = await _context.Teachers
                .AsNoTracking()
                .Where(x => examTeacherIds.Contains(x.Id))
                .Select(x => new
                {
                    x.Id,
                    x.User.Ho,
                    x.User.TenDem,
                    x.User.Ten
                })
                .ToListAsync(cancellationToken);

            var examTeacherNames = examTeacherRows
                .ToDictionary(x => x.Id, x => JoinName(x.Ho, x.TenDem, x.Ten));

            var examStatusStats = new SubjectExamStatusStatsDto();

            var exams = new List<SubjectExamItemDto>();

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
                    exams.Add(new SubjectExamItemDto
                    {
                        Id = row.Id,
                        TenBaiKT = row.TenBaiKT ?? string.Empty,
                        ThoiLuong = row.ThoiLuong,
                        TotalQuestions = row.TotalQuestions,
                        GradeName = gradeNames.TryGetValue(row.GradeId, out var gradeName)
                            ? gradeName ?? string.Empty
                            : string.Empty,
                        CreatorName = examTeacherNames.TryGetValue(row.TeacherId, out var creatorName)
                            ? creatorName
                            : string.Empty,
                        Status = status
                    });
                }
            }

            var resultsQuery = _context.ExamResults
                .AsNoTracking()
                .Where(x => x.Exam.SubjectId == subjectId);

            var examResultsCount = await resultsQuery.CountAsync(cancellationToken);

            double? averageScore = null;

            if (examResultsCount > 0)
            {
                averageScore = await resultsQuery
                    .AverageAsync(x => x.Diem, cancellationToken);
            }

            // Cùng quy ước với danh sách môn học: học sinh được xem là học môn
            // khi khối của em có ít nhất một Topic đang hoạt động của môn đó.
            var studentsCount = await (
                from student in _context.Students.AsNoTracking()
                join topic in _context.Topics.AsNoTracking()
                    .Where(x => x.IsActive && x.SubjectId == subjectId)
                    on student.GradeId equals topic.GradeId
                select student.Id)
                .Distinct()
                .CountAsync(cancellationToken);

            return new SubjectDetailDto
            {
                Id = subject.Id,
                TenMH = subject.TenMH ?? string.Empty,
                ChaptersCount = chapters.Count,
                TopicsCount = topics.Count,
                TeachersCount = teachers.Count,
                QuestionsCount = questionRows.Count,
                ExamsCount = examRows.Count,
                StudentsCount = studentsCount,
                Chapters = chapters,
                Topics = topics,
                Teachers = teachers,
                RecentQuestions = recentQuestions,
                QuestionsByDifficulty = difficultyStats,
                Exams = exams,
                ExamsByStatus = examStatusStats,
                ExamResultsCount = examResultsCount,
                AverageScore = averageScore.HasValue
                    ? Math.Round(averageScore.Value, 2)
                    : null
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
}
