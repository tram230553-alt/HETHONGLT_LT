namespace OnlineExamSystem.Application.DTOs.Teachers;

/// <summary>
/// Một câu hỏi trong bài làm của học sinh (dùng chung cho cả bài thi và luyện tập)
/// để giáo viên xem học sinh chọn gì, đáp án đúng là gì.
/// </summary>
public class TeacherAttemptQuestionDetailDto
{
    public Guid QuestionId { get; set; }

    public int Order { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string QuestionType { get; set; } = "single_choice";

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    /// <summary>Đáp án học sinh chọn, ví dụ "B" hoặc "A,C". Rỗng nếu bỏ trống.</summary>
    public string SelectedAnswer { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public bool IsBlank { get; set; }

    public string? Explanation { get; set; }
}

public class TeacherExamResultDetailDto
{
    public Guid ExamResultId { get; set; }

    public Guid ExamId { get; set; }

    public string ExamName { get; set; } = string.Empty;

    public Guid StudentId { get; set; }

    public string MaHS { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public double Score { get; set; }

    public int TotalQuestion { get; set; }

    public int CorrectQuestion { get; set; }

    public int BlankQuestion { get; set; }

    public DateTime SubmittedAt { get; set; }

    public List<TeacherAttemptQuestionDetailDto> Questions { get; set; } = new();
}

public class TeacherPracticeAttemptDetailDto
{
    public Guid AttemptId { get; set; }

    public Guid TopicId { get; set; }

    public string TopicName { get; set; } = string.Empty;

    public string ChapterName { get; set; } = string.Empty;

    public int ChapterOrder { get; set; }

    public int OrderNum { get; set; }

    public Guid StudentId { get; set; }

    public string MaHS { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public decimal Score { get; set; }

    public int TotalQuestions { get; set; }

    public int CorrectAnswers { get; set; }

    public int WrongAnswers { get; set; }

    public int BlankQuestions { get; set; }

    public DateTime SubmittedAt { get; set; }

    public List<TeacherAttemptQuestionDetailDto> Questions { get; set; } = new();
}
