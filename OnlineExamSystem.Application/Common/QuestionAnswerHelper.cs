namespace OnlineExamSystem.Application.Common;

public static class QuestionAnswerHelper
{
    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        "A", "B", "C", "D"
    };

    public static string NormalizeType(string? value)
    {
        return string.Equals(value?.Trim(), "multiple_choice", StringComparison.OrdinalIgnoreCase)
            ? "multiple_choice"
            : "single_choice";
    }

    public static string NormalizeAnswerSet(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var answers = value
            .Split(new[] { ',', ';', '|', ' ' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim().ToUpperInvariant())
            .Where(Allowed.Contains)
            .Distinct()
            .OrderBy(x => x)
            .ToArray();

        return string.Join(",", answers);
    }

    public static string ValidateCorrectAnswer(string? type, string? value)
    {
        var normalizedType = NormalizeType(type);
        var normalized = NormalizeAnswerSet(value);
        var count = string.IsNullOrEmpty(normalized) ? 0 : normalized.Split(',').Length;

        if (normalizedType == "single_choice" && count != 1)
            throw new ArgumentException("Câu hỏi một đáp án phải chọn đúng 1 phương án.");

        if (normalizedType == "multiple_choice" && count < 2)
            throw new ArgumentException("Câu hỏi nhiều đáp án phải chọn ít nhất 2 phương án đúng.");

        return normalized;
    }

    public static bool IsValidSubmittedAnswer(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var rawParts = value.Split(new[] { ',', ';', '|', ' ' }, StringSplitOptions.RemoveEmptyEntries);
        var normalized = NormalizeAnswerSet(value);
        return rawParts.Length > 0 &&
               rawParts.All(x => Allowed.Contains(x.Trim())) &&
               normalized.Split(',', StringSplitOptions.RemoveEmptyEntries).Length == rawParts.Length;
    }
}
