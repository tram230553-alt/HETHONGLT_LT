public class TeacherQuestionDto
{
    public Guid Id { get; set; }

    public string NoiDung { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public string Type { get; set; } = "single_choice";

    public string Difficulty { get; set; } = "medium";

    public Guid SubjectId { get; set; }

    // QUAN TRỌNG
    public Guid? TopicId { get; set; }

    public Guid CreatedBy { get; set; }

    public string? CreatorName { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public string? Explanation { get; set; }
}
