namespace OnlineExamSystem.Application.DTOs.Teachers;

/// <summary>Học sinh đã làm sai một câu trong luyện tập (lần sai gần nhất của học sinh đó).</summary>
public class PracticeWrongStudentDto
{
    public Guid StudentId { get; set; }

    public string MaHS { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public string SelectedAnswer { get; set; } = string.Empty;

    public string TopicName { get; set; } = string.Empty;

    public DateTime SubmittedAt { get; set; }
}

public class CommonWrongPracticeQuestionDto
{
    public Guid QuestionId { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public Guid TopicId { get; set; }

    public string TopicName { get; set; } = string.Empty;

    public string ChapterName { get; set; } = string.Empty;

    public int ChapterOrder { get; set; }

    public int OrderNum { get; set; }

    public int WrongCount { get; set; }

    public int AnsweredCount { get; set; }

    public int StudentCount { get; set; }

    public decimal WrongRate { get; set; }

    // ===== Chi tiết để giao diện đồng bộ với thống kê câu sai của đề thi =====

    public string QuestionType { get; set; } = "single_choice";

    public string CorrectAnswer { get; set; } = string.Empty;

    public string? Explanation { get; set; }

    /// <summary>Đáp án sai được chọn nhiều nhất (null nếu không có).</summary>
    public string? MostChosenWrongAnswer { get; set; }

    public int MostChosenWrongAnswerCount { get; set; }

    public List<ExamQuestionOptionStatDto> Options { get; set; } = new();

    public List<PracticeWrongStudentDto> WrongStudents { get; set; } = new();
}
