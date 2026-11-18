public class PracticeAnswer
{
    public Guid Id { get; set; }

    public Guid PracticeAttemptId { get; set; }

    public Guid QuestionId { get; set; }

    public int QuestionOrder { get; set; }

    // Snapshot nội dung câu hỏi tại thời điểm nộp bài.
    // Nhờ vậy lịch sử không bị thay đổi nếu giáo viên sửa câu hỏi sau này.
    public string QuestionText { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string? StudentAnswer { get; set; }

    public string CorrectAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public string? Explanation { get; set; }

    public PracticeAttempt PracticeAttempt { get; set; } = null!;

    public Question Question { get; set; } = null!;
}
