using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Common;

/// <summary>
/// Cấu hình đề thi do Admin thiết lập, áp dụng bắt buộc cho toàn hệ thống:
/// mọi đề thi phải đúng thời gian làm bài và đúng số câu hỏi.
/// </summary>
public sealed class ExamConfig
{
    public int DurationMinutes { get; init; }

    public int QuestionCount { get; init; }
}

public static class ExamConfigPolicy
{
    public static async Task<ExamConfig> LoadAsync(
        IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        var settings = await context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

        return new ExamConfig
        {
            DurationMinutes = settings?.DefaultExamDurationMinutes ?? 60,
            QuestionCount = settings?.DefaultExamQuestionCount ?? 40
        };
    }

    public static void EnsureDuration(ExamConfig config, int duration)
    {
        if (duration != config.DurationMinutes)
            throw new ArgumentException(
                $"Thời lượng đề thi phải đúng {config.DurationMinutes} phút " +
                $"theo cấu hình của Admin (hiện là {duration} phút).");
    }

    public static void EnsureQuestionCount(ExamConfig config, int count)
    {
        if (count != config.QuestionCount)
            throw new ArgumentException(
                $"Đề thi phải có đúng {config.QuestionCount} câu hỏi " +
                $"theo cấu hình của Admin (hiện có {count} câu).");
    }
}
