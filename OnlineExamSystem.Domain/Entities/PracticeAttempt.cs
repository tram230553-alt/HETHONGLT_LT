using OnlineExamSystem.Domain.Entities;

public class PracticeAttempt
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid TopicId { get; set; }

    public decimal Score { get; set; }

    public int TotalQuestions { get; set; }

    public int AnsweredQuestions { get; set; }

    public int CorrectAnswers { get; set; }

    public int WrongAnswers { get; set; }

    public DateTime SubmittedAt { get; set; }

    public Student Student { get; set; } = null!;

    public Topic Topic { get; set; } = null!;

    public ICollection<PracticeAnswer> Answers { get; set; }
        = new List<PracticeAnswer>();
}
