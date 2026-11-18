public class SubmitPracticeResult
{
    public Guid AttemptId { get; set; }

    public Guid TopicId { get; set; }

    public string TopicName { get; set; } = string.Empty;

    public int TotalQuestions { get; set; }

    public int AnsweredQuestions { get; set; }

    public int CorrectAnswers { get; set; }

    public int WrongAnswers { get; set; }

    public decimal Score { get; set; }

    public List<QuestionAnswerResultDto> Results { get; set; }
        = new();
}