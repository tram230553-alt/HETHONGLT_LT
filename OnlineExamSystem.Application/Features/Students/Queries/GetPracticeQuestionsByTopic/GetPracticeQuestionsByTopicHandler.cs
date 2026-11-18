using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.StudentTopics.Queries.GetPracticeQuestionsByTopic
{
    public class GetPracticeQuestionsByTopicHandler
        : IRequestHandler<
            GetPracticeQuestionsByTopicQuery,
            List<StudentQuestionDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public GetPracticeQuestionsByTopicHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<List<StudentQuestionDto>> Handle(
            GetPracticeQuestionsByTopicQuery request,
            CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(_currentUser.UserId, out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Không xác định được học sinh đang đăng nhập.");
            }

            var student = await _context.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

            if (student == null)
            {
                throw new KeyNotFoundException(
                    "Không tìm thấy hồ sơ học sinh.");
            }

            var topicExists = await _context.Topics
                .AsNoTracking()
                .AnyAsync(
                    t =>
                        t.Id == request.TopicId &&
                        t.IsActive &&
                        t.GradeId == student.GradeId,
                    cancellationToken);

            if (!topicExists)
            {
                throw new KeyNotFoundException(
                    "Topic không tồn tại, đã bị khóa hoặc không thuộc khối của học sinh.");
            }

            var settings = await _context.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

            var questionCount = Math.Clamp(
                settings?.DefaultPracticeQuestionCount ?? 20,
                1,
                200);

            return await _context.Questions
                .AsNoTracking()
                .Where(q => q.TopicId == request.TopicId)
                .OrderBy(q => q.CreatedAt)
                .ThenBy(q => q.Id)
                .Take(questionCount)
                .Select(q => new StudentQuestionDto
                {
                    Id = q.Id,
                    NoiDung = q.NoiDung,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    Type = q.Type
                })
                .ToListAsync(cancellationToken);
        }
    }
}
