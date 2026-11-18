namespace OnlineExamSystem.Domain.Entities;

public class Exam
{
    public Guid Id { get; set; }

    public Guid SubjectId { get; set; }

    public Guid GradeId { get; set; }

    public Guid TeacherId { get; set; }

    public string TenBaiKT { get; set; } = string.Empty;

    public int ThoiLuong { get; set; }

    // Giáo viên đã hoàn thiện đề và gửi Admin duyệt.
    public bool IsSubmittedForApproval { get; set; }

    // Chỉ Admin mới được đặt IsPublished = true sau khi duyệt.
    public bool IsPublished { get; set; }

    // Admin đã từ chối đề và giáo viên chưa gửi duyệt lại.
    // Trạng thái "Bị từ chối" = IsRejected && !IsSubmittedForApproval && !IsPublished.
    public bool IsRejected { get; set; }

    // Mã lý do từ chối, phân tách bằng dấu phẩy (xem ExamRejectionReasons).
    // Được giữ lại sau khi giáo viên gửi duyệt lại để Admin đối chiếu lần từ chối trước.
    public string? RejectionReasonCodes { get; set; }

    // Ghi chú chi tiết của Admin (bắt buộc khi chọn "Lý do khác").
    public string? RejectionNote { get; set; }

    public DateTime? RejectedAt { get; set; }

    public ICollection<ExamQuestion> ExamQuestions { get; set; }
        = new List<ExamQuestion>();

    public ICollection<ExamResult> ExamResults { get; set; }
        = new List<ExamResult>();
}
