namespace OnlineExamSystem.Application.DTOs.Students;

public class PracticeAttemptDto
{
    public Guid Id { get; set; }

    public Guid TopicId { get; set; }

    public string TopicName { get; set; } = string.Empty;

    public string SubjectName { get; set; } = string.Empty;

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
