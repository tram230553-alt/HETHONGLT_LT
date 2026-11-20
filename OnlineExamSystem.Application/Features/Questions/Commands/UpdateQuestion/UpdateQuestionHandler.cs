using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common;

namespace OnlineExamSystem.Application.Features.Questions.Commands.UpdateQuestion;

public class UpdateQuestionHandler
    : IRequestHandler<UpdateQuestionCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateQuestionHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(
        UpdateQuestionCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được giáo viên đang đăng nhập.");
        }

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

        var question = await _context.Questions
            .FirstOrDefaultAsync(
                x => x.Id == request.Id &&
                     x.TeacherId == teacher.Id,
                cancellationToken);

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
        if (question == null)
        {
            throw new KeyNotFoundException(
                "Không tìm thấy câu hỏi hoặc bạn không có quyền sửa câu hỏi này.");
        }

        var noiDung = request.NoiDung?.Trim() ?? string.Empty;
        var optionA = request.OptionA?.Trim() ?? string.Empty;
        var optionB = request.OptionB?.Trim() ?? string.Empty;
        var optionC = request.OptionC?.Trim() ?? string.Empty;
        var optionD = request.OptionD?.Trim() ?? string.Empty;
        var questionType = QuestionAnswerHelper.NormalizeType(request.Type);

        if (string.IsNullOrWhiteSpace(noiDung))
            throw new ArgumentException("Nội dung câu hỏi không được để trống.");

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

        var correctAnswer = QuestionAnswerHelper.ValidateCorrectAnswer(
            questionType,
            request.CorrectAnswer);

        question.NoiDung = noiDung;

        question.OptionA = optionA;

        question.OptionB = optionB;

        question.OptionC = optionC;

        question.OptionD = optionD;

        question.CorrectAnswer = correctAnswer;

        question.Type = questionType;

        question.Difficulty = request.Difficulty?.Trim() ?? "medium";

        question.TopicId = topic.Id;

        question.SubjectId = topic.SubjectId;

        question.GradeId = topic.GradeId;

        question.Explanation =
            request.Explanation?.Trim();

        question.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return "Cập nhật câu hỏi thành công.";
    }
}
