namespace OnlineExamSystem.Application.DTOs.Teachers;

/// <summary>Đề thi của giáo viên, dùng cho bộ lọc "chọn đề" ở màn thống kê câu sai.</summary>
public class ExamWrongQuestionExamDto
{
    public Guid ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public int TotalQuestions { get; set; }
    public int SubmissionCount { get; set; }
}

/// <summary>Số lượt chọn của từng phương án A/B/C/D cho một câu hỏi.</summary>
public class ExamQuestionOptionStatDto
{
    public string Option { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int SelectedCount { get; set; }
}

/// <summary>Học sinh đã làm sai một câu (lấy lần nộp gần nhất của học sinh đó trong phạm vi thống kê).</summary>
public class ExamWrongStudentDto
{
    public Guid StudentId { get; set; }
    public string MaHS { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string SelectedAnswer { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}

public class ExamWrongQuestionDto
{
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "single_choice";
    public string Difficulty { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public string ChapterName { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;
    public string? Explanation { get; set; }

    /// <summary>Tổng số lượt làm câu này (gồm cả bỏ trống).</summary>
    public int TotalAttempts { get; set; }

    /// <summary>Số lượt sai, gồm cả bỏ trống vì hệ thống chấm bỏ trống là sai.</summary>
    public int WrongCount { get; set; }

    /// <summary>Trong số lượt sai, có bao nhiêu lượt bỏ trống.</summary>
    public int BlankCount { get; set; }

    /// <summary>Số học sinh khác nhau từng sai câu này.</summary>
    public int StudentCount { get; set; }

    public decimal WrongRate { get; set; }

    /// <summary>Đáp án sai được chọn nhiều nhất (null nếu mọi lượt sai đều bỏ trống).</summary>
    public string? MostChosenWrongAnswer { get; set; }
    public int MostChosenWrongAnswerCount { get; set; }

    public List<ExamQuestionOptionStatDto> Options { get; set; } = new();
    public List<ExamWrongStudentDto> WrongStudents { get; set; } = new();
}

public class ExamWrongQuestionStatsDto
{
    public Guid? ExamId { get; set; }
    public string? ExamName { get; set; }

    /// <summary>Toàn bộ đề của giáo viên để chọn bộ lọc.</summary>
    public List<ExamWrongQuestionExamDto> Exams { get; set; } = new();

    public int SubmissionCount { get; set; }
    public int StudentCount { get; set; }
    public int QuestionsWithWrongAnswers { get; set; }

    public List<ExamWrongQuestionDto> Questions { get; set; } = new();
}
