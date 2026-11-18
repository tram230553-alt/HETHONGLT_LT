using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common.Security;

namespace OnlineExamSystem.Application.Features.Auths.ResetPassword;

public class ResetPasswordHandler
    : IRequestHandler<ResetPasswordCommand, string>
{
    private readonly IApplicationDbContext _context;

    public ResetPasswordHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> Handle(
        ResetPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var code = request.Code?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(request.Identifier) ||
            code.Length == 0 ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            throw new ArgumentException("Vui lòng nhập đầy đủ thông tin.");
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new ArgumentException("Mật khẩu xác nhận không khớp.");
        }

        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

        PasswordPolicy.Validate(request.NewPassword, settings);

        var user = await PasswordResetHelper.FindEligibleUserAsync(
            _context,
            request.Identifier,
            cancellationToken);

        // Không phân biệt "tài khoản không tồn tại" với "mã sai" để không lộ thông tin.
        if (user == null)
        {
            throw new ArgumentException(PasswordResetHelper.InvalidCodeMessage);
        }

        var now = DateTime.UtcNow;

        var token = await _context.PasswordResetTokens
            .Where(x => x.UserId == user.Id && x.UsedAt == null && x.ExpiresAt > now)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (token == null)
        {
            throw new ArgumentException(PasswordResetHelper.InvalidCodeMessage);
        }

        if (!BCrypt.Net.BCrypt.Verify(code, token.CodeHash))
        {
            token.FailedAttempts++;

            // Nhập sai quá số lần cho phép thì khoá mã, phải yêu cầu mã mới.
            if (token.FailedAttempts >= PasswordResetHelper.MaxFailedAttempts)
            {
                token.UsedAt = now;
            }

            await _context.SaveChangesAsync(cancellationToken);

            throw new ArgumentException(
                token.UsedAt.HasValue
                    ? "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã xác nhận mới."
                    : PasswordResetHelper.InvalidCodeMessage);
        }

        if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.MatKhau))
        {
            throw new ArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại.");
        }

        user.MatKhau = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        token.UsedAt = now;

        // Vô hiệu mọi mã còn lại của tài khoản này.
        var otherTokens = await _context.PasswordResetTokens
            .Where(x => x.UserId == user.Id && x.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var other in otherTokens)
        {
            other.UsedAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return "Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.";
    }
}
