using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.DTOs.Exams;

public class ExamDetailDto
{
    public Guid Id { get; set; }
    public string TenBaiKT { get; set; } = string.Empty;
    public int ThoiLuong { get; set; }
    public bool IsSubmittedForApproval { get; set; }
    public bool IsPublished { get; set; }

    // Trạng thái "Bị từ chối": Admin đã từ chối và giáo viên chưa gửi duyệt lại.
    public bool IsRejected { get; set; }

    public string? RejectionReasonCodes { get; set; }

    // Nhãn lý do hiển thị cho người dùng.
    public List<string> RejectionReasons { get; set; } = new();

    public string? RejectionNote { get; set; }

    public DateTime? RejectedAt { get; set; }
    public List<TeacherQuestionDto> Questions { get; set; } = new();
}
