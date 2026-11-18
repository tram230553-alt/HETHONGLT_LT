public class StudentQuestionDto
{
    public Guid Id { get; set; }

    public string NoiDung { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string Type { get; set; } = "single_choice";

    public Guid? TopicId { get; set; }

    public string? TopicName { get; set; }

    public string? Explanation { get; set; }
}
