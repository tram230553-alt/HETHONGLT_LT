using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Infrastructure.Email;

/// <summary>
/// Gửi email qua SMTP. Cấu hình trong appsettings, mục "Smtp":
/// Host, Port, Username, Password, From, FromName, EnableSsl.
/// Nếu chưa có Host và "UseConsoleFallback" = true (dùng khi phát triển) thì nội dung email được ghi ra log.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IConfiguration configuration,
        ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_configuration["Smtp:Host"]) &&
        !string.IsNullOrWhiteSpace(FromAddress);

    private bool UseConsoleFallback =>
        bool.TryParse(_configuration["Smtp:UseConsoleFallback"], out var value) && value;

    private string FromAddress =>
        _configuration["Smtp:From"] ?? _configuration["Smtp:Username"] ?? string.Empty;

    public bool IsAvailable => IsConfigured || UseConsoleFallback;

    public async Task SendAsync(
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            if (UseConsoleFallback)
            {
                _logger.LogWarning(
                    "[EMAIL - CHƯA CẤU HÌNH SMTP, CHỈ GHI LOG] Gửi tới: {To} | Tiêu đề: {Subject}{NewLine}{Body}",
                    toEmail,
                    subject,
                    Environment.NewLine,
                    htmlBody);
                return;
            }

            throw new InvalidOperationException("Hệ thống chưa cấu hình SMTP để gửi email.");
        }

        var port = int.TryParse(_configuration["Smtp:Port"], out var parsedPort) ? parsedPort : 587;
        var enableSsl = !bool.TryParse(_configuration["Smtp:EnableSsl"], out var parsedSsl) || parsedSsl;
        var username = _configuration["Smtp:Username"];
        var password = _configuration["Smtp:Password"];
        var fromName = _configuration["Smtp:FromName"] ?? "SmartExam";

        using var message = new MailMessage
        {
            From = new MailAddress(FromAddress, fromName, Encoding.UTF8),
            Subject = subject,
            SubjectEncoding = Encoding.UTF8,
            Body = htmlBody,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = true
        };
        message.To.Add(new MailAddress(toEmail, toName, Encoding.UTF8));

        using var client = new SmtpClient(_configuration["Smtp:Host"], port)
        {
            EnableSsl = enableSsl,
            Timeout = 20000
        };

        if (!string.IsNullOrWhiteSpace(username))
        {
            client.Credentials = new NetworkCredential(username, password);
        }

        await client.SendMailAsync(message, cancellationToken);
    }
}
