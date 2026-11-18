namespace OnlineExamSystem.Domain.Entities;

public class NotificationMessage
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string TargetRole { get; set; } = "All";

    // Khác null: thông báo riêng cho đúng một người dùng (ví dụ đề thi bị từ chối).
    // Thông báo riêng không hiển thị cho người khác cùng vai trò và không nằm trong danh sách quản lý của Admin.
    public Guid? TargetUserId { get; set; }
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Draft";
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public ICollection<NotificationReadReceipt> ReadReceipts { get; set; } = new List<NotificationReadReceipt>();
}
