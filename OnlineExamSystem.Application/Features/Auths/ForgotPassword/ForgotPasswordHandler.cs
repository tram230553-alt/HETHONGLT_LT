using System.Net;
using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Auths.ForgotPassword;

public class ForgotPasswordHandler
    : IRequestHandler<ForgotPasswordCommand, string>
{
    // Luôn trả cùng một thông báo dù tài khoản có tồn tại hay không,
    // để người ngoài không dò được mã học sinh/email nào đang có trong hệ thống.
    private static readonly string GenericMessage =
        "Nếu tài khoản tồn tại, mã xác nhận đã được gửi tới email đăng ký của tài khoản. " +
        $"Mã có hiệu lực trong {PasswordResetHelper.CodeLifetimeMinutes} phút.";

    private readonly IApplicationDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<ForgotPasswordHandler> _logger;

    public ForgotPasswordHandler(
        IApplicationDbContext context,
        IEmailSender emailSender,
        ILogger<ForgotPasswordHandler> logger)
    {
        _context = context;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<string> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier))
        {
            throw new ArgumentException("Vui lòng nhập mã học sinh hoặc email.");
        }

        // Lỗi cấu hình hệ thống không phụ thuộc vào tài khoản nên có thể báo thẳng.
        if (!_emailSender.IsAvailable)
        {
            throw new InvalidOperationException(
                "Hệ thống chưa cấu hình gửi email. Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.");
        }

        var user = await PasswordResetHelper.FindEligibleUserAsync(
            _context,
            request.Identifier,
            cancellationToken);

        if (user == null)
        {
            return GenericMessage;
        }

        var now = DateTime.UtcNow;

        // Chống gửi dồn dập: nếu vừa gửi trong thời gian chờ thì bỏ qua (vẫn trả thông báo chung).
        var lastCreatedAt = await _context.PasswordResetTokens
            .AsNoTracking()
            .Where(x => x.UserId == user.Id)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => (DateTime?)x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (lastCreatedAt.HasValue &&
            now - lastCreatedAt.Value < TimeSpan.FromSeconds(PasswordResetHelper.ResendCooldownSeconds))
        {
            return GenericMessage;
        }

        // Mã cũ chưa dùng bị vô hiệu, chỉ mã mới nhất có hiệu lực.
        var activeTokens = await _context.PasswordResetTokens
            .Where(x => x.UserId == user.Id && x.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var old in activeTokens)
        {
            old.UsedAt = now;
        }

        // Dọn mã đã hết hạn quá 1 ngày của chính tài khoản này.
        var stale = await _context.PasswordResetTokens
            .Where(x => x.UserId == user.Id && x.ExpiresAt < now.AddDays(-1))
            .ToListAsync(cancellationToken);
        _context.PasswordResetTokens.RemoveRange(stale);

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        var token = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CodeHash = BCrypt.Net.BCrypt.HashPassword(code),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(PasswordResetHelper.CodeLifetimeMinutes),
            FailedAttempts = 0
        };

        _context.PasswordResetTokens.Add(token);
        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailSender.SendAsync(
                user.Email,
                BuildFullName(user),
                "Mã xác nhận đặt lại mật khẩu SmartExam",
                BuildEmailBody(user, code),
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Không gửi được email đặt lại mật khẩu cho người dùng {UserId}.",
                user.Id);

            // Gỡ mã vừa tạo để người dùng có thể yêu cầu lại ngay, không bị chặn bởi thời gian chờ.
            try
            {
                _context.PasswordResetTokens.Remove(token);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception cleanupEx)
            {
                _logger.LogWarning(cleanupEx, "Không gỡ được mã đặt lại mật khẩu sau khi gửi email thất bại.");
            }
        }

        return GenericMessage;
    }

    private static string BuildFullName(User user)
    {
        return string.Join(
            " ",
            new[] { user.Ho, user.TenDem, user.Ten }
                .Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    private static string BuildEmailBody(User user, string code)
    {
        var name = WebUtility.HtmlEncode(BuildFullName(user));

        return $$"""
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
              <h2 style="margin:0 0 16px;color:#4f46e5">SmartExam</h2>
              <p>Xin chào <strong>{{name}}</strong>,</p>
              <p>Bạn vừa yêu cầu đặt lại mật khẩu. Hãy nhập mã xác nhận dưới đây vào màn hình đặt lại mật khẩu:</p>
              <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;background:#f1f5f9;border-radius:12px;padding:16px;margin:20px 0">{{code}}</p>
              <p>Mã có hiệu lực trong <strong>{{PasswordResetHelper.CodeLifetimeMinutes}} phút</strong> và chỉ dùng được một lần.</p>
              <p style="color:#64748b;font-size:13px">Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu hiện tại của bạn vẫn an toàn. Không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
            """;
    }
}
