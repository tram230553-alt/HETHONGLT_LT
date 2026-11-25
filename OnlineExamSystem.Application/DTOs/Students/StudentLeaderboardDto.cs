namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentLeaderboardDto
{
    public int Rank { get; set; }

    public Guid StudentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public Guid? GradeId { get; set; }

    public string? Khoi { get; set; }

    public double AverageScore { get; set; }

    public int TotalExams { get; set; }

    public int TotalPractices { get; set; }

    public int TotalAttempts { get; set; }

    public int TotalCorrectAnswers { get; set; }

    public int TotalQuestions { get; set; }
}
