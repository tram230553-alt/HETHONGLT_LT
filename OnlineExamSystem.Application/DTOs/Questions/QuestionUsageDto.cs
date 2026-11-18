namespace OnlineExamSystem.Application.DTOs.Questions;

public class QuestionUsageExamDto
{
    public Guid Id { get; set; }

    public string TenBaiKT { get; set; } = string.Empty;

    public bool IsPublished { get; set; }

    public bool IsSubmittedForApproval { get; set; }

    public bool IsRejected { get; set; }
}

/// <summary>
/// Kết quả kiểm tra một câu hỏi đang được dùng ở đâu, dùng trước khi xóa.
/// </summary>
public class QuestionUsageDto
{
    public Guid QuestionId { get; set; }

    // Các đề thi đang chứa câu hỏi (cả đã công bố và chưa công bố).
    public List<QuestionUsageExamDto> Exams { get; set; } = new();

    // Câu hỏi nằm trong ít nhất một đề đã công bố.
    public bool HasPublishedExam { get; set; }

    // Học sinh đã làm câu hỏi này (kết quả thi hoặc luyện tập).
    public bool HasStudentActivity { get; set; }

    // false nếu bị chặn hoàn toàn (đề đã công bố hoặc đã có dữ liệu học sinh).
    public bool CanDelete { get; set; }

    // Lý do bị chặn (khi CanDelete = false).
    public string? BlockReason { get; set; }

    // true nếu xóa được nhưng phải xác nhận vì câu hỏi sẽ bị gỡ khỏi các đề chưa công bố.
    public bool RequiresConfirmation { get; set; }
}
