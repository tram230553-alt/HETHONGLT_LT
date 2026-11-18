using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students
    .Queries.GetWrongQuestions;

public class GetWrongQuestionsHandler
    : IRequestHandler<
        GetWrongQuestionsQuery,
        List<StudentWrongQuestionDto>>
{
    private readonly IApplicationDbContext _context;

    private readonly ICurrentUserService _currentUser;

    public GetWrongQuestionsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }


    public async Task<List<StudentWrongQuestionDto>> Handle(
        GetWrongQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // 1. LẤY USER ID TỪ JWT
        // ==========================================

        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được người dùng đang đăng nhập.");
        }


        // ==========================================
        // 2. TÌM STUDENT
        // ==========================================

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


        // ==========================================
        // 3. LẤY TẤT CẢ NHỮNG LẦN TRẢ LỜI SAI
        // ==========================================

        var wrongRows = await (
            from answer in
                _context.StudentAnswers.AsNoTracking()

            join result in
                _context.ExamResults.AsNoTracking()
                on answer.ExamResultId equals result.Id

            join exam in
                _context.Exams.AsNoTracking()
                on result.ExamId equals exam.Id

            join question in
                _context.Questions.AsNoTracking()
                on answer.QuestionId equals question.Id

            join subject in
                _context.Subjects.AsNoTracking()
                on question.SubjectId equals subject.Id

            join grade in
                _context.Grades.AsNoTracking()
                on question.GradeId equals grade.Id

            where
                result.StudentId == student.Id
                && !answer.IsCorrect

            orderby result.SubmittedAt descending

            select new WrongQuestionRow
            {
                QuestionId = question.Id,

                ExamId = exam.Id,

                TenBaiKT = exam.TenBaiKT,

                SubjectId = subject.Id,

                MonHoc = subject.TenMH,

                GradeId = grade.Id,

                Khoi = grade.TenKhoi,

                NoiDung = question.NoiDung,

                OptionA = question.OptionA,

                OptionB = question.OptionB,

                OptionC = question.OptionC,

                OptionD = question.OptionD,

                SelectedAnswer =
                    answer.SelectedAnswer ?? string.Empty,

                CorrectAnswer =
                    question.CorrectAnswer,

                SubmittedAt =
                    result.SubmittedAt
            })
            .ToListAsync(cancellationToken);


        // ==========================================
        // 4. GOM TRÙNG THEO QUESTION
        // ==========================================
        //
        // Ví dụ:
        //
        // Câu A sai lần 1
        // Câu A sai lần 2
        // Câu A sai lần 3
        //
        // API chỉ trả Câu A một lần,
        // WrongCount = 3.
        //

        var resultList = wrongRows

            .GroupBy(x => x.QuestionId)

            .Select(group =>
            {
                // Vì query phía trên order giảm dần,
                // vẫn sort lại để chắc chắn.
                var latest = group
                    .OrderByDescending(
                        x => x.SubmittedAt)
                    .First();

                return new StudentWrongQuestionDto
                {
                    QuestionId =
                        latest.QuestionId,

                    ExamId =
                        latest.ExamId,

                    TenBaiKT =
                        latest.TenBaiKT,

                    SubjectId =
                        latest.SubjectId,

                    MonHoc =
                        latest.MonHoc,

                    GradeId =
                        latest.GradeId,

                    Khoi =
                        latest.Khoi,

                    NoiDung =
                        latest.NoiDung,

                    OptionA =
                        latest.OptionA,

                    OptionB =
                        latest.OptionB,

                    OptionC =
                        latest.OptionC,

                    OptionD =
                        latest.OptionD,

                    SelectedAnswer =
                        latest.SelectedAnswer,

                    CorrectAnswer =
                        latest.CorrectAnswer,

                    IsUnanswered =
                        string.IsNullOrWhiteSpace(
                            latest.SelectedAnswer),

                    WrongCount =
                        group.Count(),

                    LastWrongAt =
                        latest.SubmittedAt
                };
            })

            .OrderByDescending(
                x => x.LastWrongAt)

            .ToList();


        return resultList;
    }


    // ==========================================
    // DỮ LIỆU TRUNG GIAN
    // Không phải entity
    // Không tạo table
    // ==========================================

    private sealed class WrongQuestionRow
    {
        public Guid QuestionId { get; set; }

        public Guid ExamId { get; set; }

        public string TenBaiKT { get; set; }
            = string.Empty;

        public Guid SubjectId { get; set; }

        public string MonHoc { get; set; }
            = string.Empty;

        public Guid GradeId { get; set; }

        public string Khoi { get; set; }
            = string.Empty;

        public string NoiDung { get; set; }
            = string.Empty;

        public string OptionA { get; set; }
            = string.Empty;

        public string OptionB { get; set; }
            = string.Empty;

        public string OptionC { get; set; }
            = string.Empty;

        public string OptionD { get; set; }
            = string.Empty;

        public string SelectedAnswer { get; set; }
            = string.Empty;

        public string CorrectAnswer { get; set; }
            = string.Empty;

        public DateTime SubmittedAt { get; set; }
    }
}