using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Questions;

namespace OnlineExamSystem.Application.Common;

/// <summary>
/// Kiểm tra câu hỏi đang được sử dụng ở đâu. Dùng chung cho màn xem trước và khi xóa
/// để hai nơi luôn cho cùng một kết luận.
/// </summary>
public static class QuestionUsageChecker
{
    public static async Task<QuestionUsageDto> CheckAsync(
        IApplicationDbContext context,
        Guid questionId,
        CancellationToken cancellationToken)
    {
        var exams = await (
            from eq in context.ExamQuestions.AsNoTracking()
            join exam in context.Exams.AsNoTracking()
                on eq.ExamId equals exam.Id
            where eq.QuestionId == questionId
            orderby exam.IsPublished descending, exam.TenBaiKT
            select new QuestionUsageExamDto
            {
                Id = exam.Id,
                TenBaiKT = exam.TenBaiKT,
                IsPublished = exam.IsPublished,
                IsSubmittedForApproval = exam.IsSubmittedForApproval,
                IsRejected = exam.IsRejected
            })
            .ToListAsync(cancellationToken);

        var hasExamAnswers = await context.StudentAnswers
            .AsNoTracking()
            .AnyAsync(x => x.QuestionId == questionId, cancellationToken);

        var hasPracticeAnswers = await context.PracticeAnswers
            .AsNoTracking()
            .AnyAsync(x => x.QuestionId == questionId, cancellationToken);

        var usage = new QuestionUsageDto
        {
            QuestionId = questionId,
            Exams = exams,
            HasPublishedExam = exams.Any(x => x.IsPublished),
            HasStudentActivity = hasExamAnswers || hasPracticeAnswers,
            CanDelete = true
        };

        if (usage.HasPublishedExam)
        {
            var names = string.Join(", ",
                exams.Where(x => x.IsPublished).Select(x => $"\"{x.TenBaiKT}\""));

            usage.CanDelete = false;
            usage.BlockReason =
                $"Không thể xóa câu hỏi vì đang được sử dụng trong đề thi đã công bố: {names}.";
        }
        else if (hasExamAnswers)
        {
            usage.CanDelete = false;
            usage.BlockReason =
                "Không thể xóa câu hỏi vì học sinh đã làm câu hỏi này trong bài thi. " +
                "Việc xóa sẽ làm mất dữ liệu kết quả.";
        }
        else if (hasPracticeAnswers)
        {
            usage.CanDelete = false;
            usage.BlockReason =
                "Không thể xóa câu hỏi vì học sinh đã làm câu hỏi này. " +
                "Việc xóa sẽ làm mất dữ liệu lịch sử luyện tập.";
        }
        else
        {
            usage.RequiresConfirmation = exams.Count > 0;
        }

        return usage;
    }
}
