using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetStudentTopics
{
    public class GetStudentTopicsHandler
        : IRequestHandler<
            GetStudentTopicsQuery,
            List<StudentTopicDto>>
    {
        private readonly IApplicationDbContext _context;

        private readonly ICurrentUserService _currentUser;

        public GetStudentTopicsHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<List<StudentTopicDto>> Handle(
            GetStudentTopicsQuery request,
            CancellationToken cancellationToken)
        {
            // ============================================
            // 1. LẤY USER ID ĐANG ĐĂNG NHẬP
            // ============================================

            if (!Guid.TryParse(
                    _currentUser.UserId,
                    out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Không xác định được học sinh đang đăng nhập.");
            }


            // ============================================
            // 2. TÌM STUDENT
            // ============================================

            var student =
                await _context.Students
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        x => x.UserId == userId,
                        cancellationToken);


            if (student == null)
            {
                throw new KeyNotFoundException(
                    "Không tìm thấy hồ sơ học sinh.");
            }


            // ============================================
            // 3. LẤY GRADE CỦA STUDENT
            // ============================================

            var gradeId = student.GradeId;


            // ============================================
            // 4. LẤY TOPIC
            // ============================================

            var query =
                _context.Topics
                    .AsNoTracking()
                    .Where(t =>
                        t.IsActive &&
                        t.GradeId == gradeId);


            // ============================================
            // 5. NẾU STUDENT CHỌN MÔN
            // ============================================

            if (request.SubjectId.HasValue)
            {
                query = query.Where(
                    t => t.SubjectId ==
                         request.SubjectId.Value);
            }


            // ============================================
            // 6. SORT
            // ============================================

            var topics =
                await query
                    .OrderBy(t => t.SubjectId)
                    .ThenBy(t => t.Chapter.Order)
                    .ThenBy(t => t.OrderNum)
                    .Select(t => new StudentTopicDto
                    {
                        Id = t.Id,

                        Name = t.Name,

                        Description = t.Description,

                        SubjectId = t.SubjectId,

                        SubjectName = t.Subject.TenMH,

                        GradeId = t.GradeId,

                        GradeName = t.Grade.TenKhoi,

                        ChapterName = t.Chapter.Name,

                        ChapterOrder = t.Chapter.Order,

                        OrderNum = t.OrderNum,

                        IsActive = t.IsActive,

                        QuestionCount =
                            t.Questions.Count(),

                        ChessQuestionCount =
                            t.Questions.Count(q =>
                                q.Type == "true_false" ||
                                q.Type == "single_choice" ||
                                q.Type == "multiple_choice" ||
                                q.Type == "essay"),

                        WordPuzzleQuestionCount =
                            t.Questions.Count(q =>
                                (q.Type == "essay" || q.Type == "short_answer" || q.Type == "fill_blank") &&
                                q.CorrectAnswer != null &&
                                q.CorrectAnswer != "")
                    })
                    .ToListAsync(
                        cancellationToken);


            return topics;
        }
    }
}