public class SubmitPracticeAnswerDto
{
    public Guid QuestionId { get; set; }

    public string Answer { get; set; } = string.Empty;
}