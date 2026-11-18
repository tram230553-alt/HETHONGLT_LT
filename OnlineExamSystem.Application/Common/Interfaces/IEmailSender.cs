namespace OnlineExamSystem.Application.Common.Interfaces;

public interface IEmailSender
{
    /// <summary>
    /// true khi hệ thống có thể gửi email (đã cấu hình SMTP, hoặc đang bật chế độ ghi email ra log để thử nghiệm).
    /// </summary>
    bool IsAvailable { get; }

    Task SendAsync(
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken);
}
