namespace OnlineExamSystem.Application.Common;

public static class QuestionAnswerHelper
{
    private static readonly HashSet<string> AllowedChoices = new(StringComparer.OrdinalIgnoreCase)
    {
        "A", "B", "C", "D"
    };

    private static readonly HashSet<string> AllowedTrueFalse = new(StringComparer.OrdinalIgnoreCase)
    {
        "T", "F", "TRUE", "FALSE", "ĐÚNG", "SAI", "DUNG", "1", "0"
    };

    public static string NormalizeType(string? value)
    {
        var trimmed = value?.Trim().ToLowerInvariant() ?? "";
        return trimmed switch
        {
            "multiple_choice" => "multiple_choice",
            "true_false" => "true_false",
            "essay" => "essay",
            _ => "single_choice"
        };
    }

    public static string NormalizeAnswerSet(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var answers = value
            .Split(new[] { ',', ';', '|', ' ' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim().ToUpperInvariant())
            .Where(AllowedChoices.Contains)
            .Distinct()
            .OrderBy(x => x)
            .ToArray();

        return string.Join(",", answers);
    }

    public static string NormalizeTrueFalseAnswer(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var raw = value.Trim().ToUpperInvariant();
        if (raw == "T" || raw == "TRUE" || raw == "ĐÚNG" || raw == "DUNG" || raw == "1")
            return "T";
        if (raw == "F" || raw == "FALSE" || raw == "SAI" || raw == "0")
            return "F";

        return raw;
    }

    public static string NormalizeEssayText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        return System.Text.RegularExpressions.Regex.Replace(value.Trim(), @"\s+", " ");
    }

    public static string ValidateCorrectAnswer(string? type, string? value)
    {
        var normalizedType = NormalizeType(type);

        if (normalizedType == "true_false")
        {
            var normalizedTf = NormalizeTrueFalseAnswer(value);
            if (normalizedTf != "T" && normalizedTf != "F")
            {
                throw new ArgumentException("Câu hỏi Đúng/Sai phải có đáp án đúng là Đúng (T) hoặc Sai (F).");
            }
            return normalizedTf;
        }

        if (normalizedType == "essay")
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException("Câu hỏi tự luận/điền khuyết phải có đáp án hoặc từ khóa gợi ý.");
            }
            return value.Trim();
        }

        var normalized = NormalizeAnswerSet(value);
        var count = string.IsNullOrEmpty(normalized) ? 0 : normalized.Split(',').Length;

        if (normalizedType == "single_choice" && count != 1)
            throw new ArgumentException("Câu hỏi một đáp án phải chọn đúng 1 phương án.");

        if (normalizedType == "multiple_choice" && count < 2)
            throw new ArgumentException("Câu hỏi nhiều đáp án phải chọn ít nhất 2 phương án đúng.");

        return normalized;
    }

    public static bool IsValidSubmittedAnswer(string? type, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalizedType = NormalizeType(type);

        if (normalizedType == "essay")
        {
            return true;
        }

        if (normalizedType == "true_false")
        {
            var tf = NormalizeTrueFalseAnswer(value);
            return tf == "T" || tf == "F";
        }

        var rawParts = value.Split(new[] { ',', ';', '|', ' ' }, StringSplitOptions.RemoveEmptyEntries);
        var normalized = NormalizeAnswerSet(value);
        return rawParts.Length > 0 &&
               rawParts.All(x => AllowedChoices.Contains(x.Trim())) &&
               normalized.Split(',', StringSplitOptions.RemoveEmptyEntries).Length == rawParts.Length;
    }

    public static bool CompareAnswers(string? type, string? submittedAnswer, string? correctAnswer)
    {
        if (string.IsNullOrWhiteSpace(submittedAnswer) || string.IsNullOrWhiteSpace(correctAnswer))
            return false;

        var normalizedType = NormalizeType(type);

        if (normalizedType == "true_false")
        {
            return NormalizeTrueFalseAnswer(submittedAnswer) == NormalizeTrueFalseAnswer(correctAnswer);
        }

        if (normalizedType == "essay")
        {
            var sub = NormalizeEssayText(submittedAnswer);
            var cor = NormalizeEssayText(correctAnswer);

            // 1. So khớp chính xác tuyệt đối không phân biệt hoa thường
            if (string.Equals(sub, cor, StringComparison.OrdinalIgnoreCase))
                return true;

            // 2. Giáo viên có thể nhập nhiều phương án đúng phân tách bởi dấu / hoặc ; hoặc |
            var acceptableList = cor.Split(new[] { '/', ';', '|' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => NormalizeEssayText(x))
                .Where(x => !string.IsNullOrEmpty(x));

            if (acceptableList.Any(opt => string.Equals(sub, opt, StringComparison.OrdinalIgnoreCase)))
                return true;

            // 3. Nếu là số thập phân (dấu chấm hoặc dấu phẩy)
            var subNum = sub.Replace(',', '.');
            var corNum = cor.Replace(',', '.');
            if (double.TryParse(subNum, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var n1) &&
                double.TryParse(corNum, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var n2))
            {
                if (Math.Abs(n1 - n2) < 0.0001)
                    return true;
            }

            return false;
        }

        return string.Equals(
            NormalizeAnswerSet(submittedAnswer),
            NormalizeAnswerSet(correctAnswer),
            StringComparison.OrdinalIgnoreCase);
    }
}

