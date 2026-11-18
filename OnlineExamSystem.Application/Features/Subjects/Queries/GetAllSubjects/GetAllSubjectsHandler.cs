using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Subjects;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Queries.GetAllSubjects
{
    public class GetAllSubjectsHandler
    : IRequestHandler<
        GetAllSubjectsQuery,
        List<SubjectDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllSubjectsHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<SubjectDto>> Handle(
            GetAllSubjectsQuery request,
            CancellationToken cancellationToken)
        {
            var subjects = await _context.Subjects
                .AsNoTracking()
                .OrderBy(x => x.TenMH)
                .Select(x => new SubjectDto
                {
                    Id = x.Id,
                    TenMH = x.TenMH
                })
                .ToListAsync(cancellationToken);

            var topicRows = await _context.Topics
                .AsNoTracking()
                .Select(x => new { x.SubjectId })
                .ToListAsync(cancellationToken);

            var chapterRows = await _context.Chapters
                .AsNoTracking()
                .Select(x => new { x.SubjectId })
                .ToListAsync(cancellationToken);

            // Gom nhóm phía ứng dụng để tránh truy vấn COUNT DISTINCT nhiều cột
            // không tương thích giữa các phiên bản EF Core/SQL Server.
            // Số chương đếm từ bảng Chapters (khớp với tab "Chương" trong chi tiết môn).
            var topicStats = topicRows
                .GroupBy(x => x.SubjectId)
                .ToDictionary(group => group.Key, group => group.Count());

            var chapterStats = chapterRows
                .GroupBy(x => x.SubjectId)
                .ToDictionary(group => group.Key, group => group.Count());

            var questionStats = await _context.Questions
                .AsNoTracking()
                .GroupBy(x => x.SubjectId)
                .Select(group => new { SubjectId = group.Key, Count = group.Count() })
                .ToDictionaryAsync(x => x.SubjectId, cancellationToken);

            var examStats = await _context.Exams
                .AsNoTracking()
                .GroupBy(x => x.SubjectId)
                .Select(group => new { SubjectId = group.Key, Count = group.Count() })
                .ToDictionaryAsync(x => x.SubjectId, cancellationToken);

            // Hệ thống không có bảng đăng ký Student-Subject. Học sinh được xem là
            // học môn nếu khối của em có ít nhất một Topic đang hoạt động của môn đó.
            var eligibleStudentPairs = await (
                from student in _context.Students.AsNoTracking()
                join topic in _context.Topics.AsNoTracking().Where(x => x.IsActive)
                    on student.GradeId equals topic.GradeId
                select new { topic.SubjectId, StudentId = student.Id })
                .Distinct()
                .ToListAsync(cancellationToken);

            var studentStats = eligibleStudentPairs
                .GroupBy(x => x.SubjectId)
                .ToDictionary(group => group.Key, group => group.Count());

            foreach (var subject in subjects)
            {
                subject.TopicsCount = topicStats.TryGetValue(subject.Id, out var topicCount)
                    ? topicCount : 0;
                subject.ChaptersCount = chapterStats.TryGetValue(subject.Id, out var chapterCount)
                    ? chapterCount : 0;

                subject.QuestionsCount = questionStats.TryGetValue(subject.Id, out var questionStat)
                    ? questionStat.Count : 0;
                subject.ExamsCount = examStats.TryGetValue(subject.Id, out var examStat)
                    ? examStat.Count : 0;
                subject.StudentsCount = studentStats.TryGetValue(subject.Id, out var studentCount)
                    ? studentCount : 0;
            }

            return subjects;
        }
    }
}
