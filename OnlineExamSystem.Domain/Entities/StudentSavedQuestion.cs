namespace OnlineExamSystem.Domain.Entities;

public class StudentSavedQuestion
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid QuestionId { get; set; }

    public DateTime CreatedAt { get; set; }


    // Navigation
    public Student Student { get; set; } = null!;

    public Question Question { get; set; } = null!;
}