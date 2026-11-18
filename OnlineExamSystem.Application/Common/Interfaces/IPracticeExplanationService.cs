namespace OnlineExamSystem.Application.Common.Interfaces;

public record PracticeExplanationInput(
    string Subject, string Topic, string Question,
    string OptionA, string OptionB, string OptionC, string OptionD,
    string? StudentAnswer, string CorrectAnswer, string? TeacherExplanation);

public interface IPracticeExplanationService
{
    Task<string> ExplainAsync(PracticeExplanationInput input, CancellationToken cancellationToken);
}
