namespace OnlineExamSystem.Application.DTOs.Teachers;

public class TeacherStudentPracticeResultDto
{
    public Guid StudentId { get; set; }

    public string MaHS { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string GradeName { get; set; } = string.Empty;

    public bool IsLocked { get; set; }

    public int AttemptCount { get; set; }

    public int CompletedTopics { get; set; }

    // Tổng số Topic thuộc đúng môn + khối giáo viên phụ trách (dùng tính tiến độ luyện tập).
    public int TotalTopics { get; set; }

    public decimal AverageScore { get; set; }

    public decimal HighestScore { get; set; }

    public int CorrectAnswers { get; set; }

    public int TotalQuestions { get; set; }

    public DateTime? LastSubmittedAt { get; set; }

    public List<TeacherPracticeAttemptDto> Attempts { get; set; }
        = new();
}

public class TeacherPracticeAttemptDto
{
    public Guid AttemptId { get; set; }

    public Guid TopicId { get; set; }

    public string TopicName { get; set; } = string.Empty;

    public string ChapterName { get; set; } = string.Empty;

    public int ChapterOrder { get; set; }

    public int OrderNum { get; set; }

    public decimal Score { get; set; }

    public int TotalQuestions { get; set; }

    public int AnsweredQuestions { get; set; }

    public int CorrectAnswers { get; set; }

    public int WrongAnswers { get; set; }

    public DateTime SubmittedAt { get; set; }
}