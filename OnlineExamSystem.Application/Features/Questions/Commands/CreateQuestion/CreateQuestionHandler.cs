using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Questions.Commands.CreateQuestion;

public class CreateQuestionHandler
    : IRequestHandler<CreateQuestionCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateQuestionHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(
        CreateQuestionCommand request,
        CancellationToken cancellationToken)
    {
        // ============================================
        // 1. LẤY USER ĐANG ĐĂNG NHẬP
        // ============================================

        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được giáo viên đang đăng nhập.");
        }


        // ============================================
        // 2. TÌM TEACHER
        // ============================================

        var teacher = await _context.Teachers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (teacher == null)
        {
            throw new UnauthorizedAccessException(
                "Không tìm thấy hồ sơ giáo viên.");
        }


        // ============================================
        // 3. KIỂM TRA TOPIC
        // ============================================

        var topic = await _context.Topics
            .FirstOrDefaultAsync(
                x =>
                    x.Id == request.TopicId &&
                    x.IsActive &&
                    x.SubjectId == teacher.SubjectId &&
                    x.GradeId == teacher.GradeId,
                cancellationToken);

        if (topic == null)
        {
            throw new KeyNotFoundException(
                "Topic không tồn tại, đã bị khóa hoặc không thuộc môn/khối của giáo viên.");
        }


        // ============================================
        // 4. KIỂM TRA TEACHER CÓ ĐƯỢC DÙNG TOPIC KHÔNG
        // ============================================

        // Nếu hệ thống của bạn quy định Teacher
        // chỉ được tạo câu hỏi cho Subject của mình,
        // kiểm tra ở đây.
        //
        // Nếu TeacherSubject chưa có trong project,
        // có thể bỏ phần này.


        // ============================================
        // 5. VALIDATE NỘI DUNG
        // ============================================

        var noiDung =
            request.NoiDung?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(noiDung))
        {
            throw new ArgumentException(
                "Nội dung câu hỏi không được để trống.");
        }


        var optionA =
            request.OptionA?.Trim() ?? string.Empty;

        var optionB =
            request.OptionB?.Trim() ?? string.Empty;

        var optionC =
            request.OptionC?.Trim() ?? string.Empty;

        var optionD =
            request.OptionD?.Trim() ?? string.Empty;


        var questionType = QuestionAnswerHelper.NormalizeType(request.Type);

        if (questionType == "single_choice" || questionType == "multiple_choice")
        {
            if (string.IsNullOrWhiteSpace(optionA) ||
                string.IsNullOrWhiteSpace(optionB) ||
                string.IsNullOrWhiteSpace(optionC) ||
                string.IsNullOrWhiteSpace(optionD))
            {
                throw new ArgumentException(
                    "Câu hỏi trắc nghiệm phải có đủ 4 phương án A, B, C, D.");
            }
        }
        else if (questionType == "true_false")
        {
            if (string.IsNullOrWhiteSpace(optionA)) optionA = "Đúng";
            if (string.IsNullOrWhiteSpace(optionB)) optionB = "Sai";
            optionC = string.Empty;
            optionD = string.Empty;
        }
        else if (questionType == "essay")
        {
            // Tự luận hoặc Điền khuyết ý a,b,c,d
            // Nếu có nhập các ý phụ ở optionA, B, C, D thì giữ lại, không bắt buộc đủ 4
        }

        // ============================================
        // 6. VALIDATE ĐÁP ÁN
        // ============================================

        var correctAnswer = QuestionAnswerHelper.ValidateCorrectAnswer(
            questionType,
            request.CorrectAnswer);


        // ============================================
        // 7. TẠO QUESTION
        // ============================================

        var question = new Question
        {
            Id = Guid.NewGuid(),

            NoiDung = noiDung,

            OptionA = optionA,

            OptionB = optionB,

            OptionC = optionC,

            OptionD = optionD,

            CorrectAnswer = correctAnswer,

            Type = questionType,

            Difficulty =
                request.Difficulty?.Trim()
                ?? string.Empty,

            Explanation =
                request.Explanation?.Trim(),

            // ========================================
            // QUAN TRỌNG
            // LẤY SUBJECT + GRADE TỪ TOPIC
            // ========================================

            SubjectId = topic.SubjectId,

            GradeId = topic.GradeId,

            TopicId = topic.Id,

            // ========================================
            // QUAN TRỌNG
            // GÁN TEACHER
            // ========================================

            TeacherId = teacher.Id,

            CreatedAt = DateTime.UtcNow
        };


        // ============================================
        // 8. SAVE
        // ============================================

        _context.Questions.Add(question);

        await _context.SaveChangesAsync(
            cancellationToken);


        return question.Id;
    }
}
