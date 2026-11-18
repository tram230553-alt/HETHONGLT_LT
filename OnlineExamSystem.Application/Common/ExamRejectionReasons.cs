namespace OnlineExamSystem.Application.Common;

/// <summary>
/// Danh mục lý do Admin từ chối đề thi. Mã (Code) được lưu trong database,
/// nhãn (Label) dùng để hiển thị cho giáo viên và trong thông báo.
/// </summary>
public static class ExamRejectionReasons
{
    public const string Other = "OTHER";

    public const int MaxNoteLength = 1000;

    private static readonly (string Code, string Label)[] Items =
    {
        ("WRONG_CONTENT", "Sai kiến thức hoặc đáp án"),
        ("MISSING_DATA", "Thiếu câu hỏi hoặc đáp án"),
        ("WRONG_STRUCTURE", "Sai cấu trúc hoặc thang điểm"),
        ("WRONG_SUBJECT_GRADE", "Không phù hợp khối lớp hoặc môn học"),
        ("DISPLAY_ERROR", "Lỗi hiển thị hoặc kỹ thuật"),
        ("POLICY_VIOLATION", "Vi phạm quy định nội dung"),
        (Other, "Lý do khác")
    };

    public static bool IsValid(string code)
        => Items.Any(x => x.Code == code);

    public static string GetLabel(string code)
        => Items.FirstOrDefault(x => x.Code == code).Label ?? code;

    /// <summary>
    /// Chuyển chuỗi mã (phân tách bằng dấu phẩy) thành danh sách nhãn hiển thị.
    /// </summary>
    public static List<string> ToLabels(string? codes)
    {
        if (string.IsNullOrWhiteSpace(codes))
            return new List<string>();

        return codes
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(GetLabel)
            .ToList();
    }
}
