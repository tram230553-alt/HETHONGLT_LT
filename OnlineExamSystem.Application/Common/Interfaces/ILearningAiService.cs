namespace OnlineExamSystem.Application.Common.Interfaces;

public record AiTurn(string Role, string Text);
public record AiDraftQuestion(string NoiDung, string OptionA, string OptionB, string OptionC,
    string OptionD, string CorrectAnswer, string Explanation);
public interface ILearningAiService
{
    Task<string> AskAsync(string context, string message, IReadOnlyList<AiTurn> history, CancellationToken ct);
    Task<List<AiDraftQuestion>> GenerateAsync(string context, int count, string difficulty, string requirements, CancellationToken ct);
}
