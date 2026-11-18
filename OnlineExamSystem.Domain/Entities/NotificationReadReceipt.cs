namespace OnlineExamSystem.Domain.Entities;

public class NotificationReadReceipt
{
    public Guid NotificationId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ReadAt { get; set; }
    public NotificationMessage Notification { get; set; } = null!;
    public User User { get; set; } = null!;
}
