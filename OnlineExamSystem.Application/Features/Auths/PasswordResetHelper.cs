using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Auths;

internal static class PasswordResetHelper
{
    public const int CodeLifetimeMinutes = 15;
    public const int ResendCooldownSeconds = 60;
    public const int MaxFailedAttempts = 5;

    public const string InvalidCodeMessage = "Mã xác nhận không đúng hoặc đã hết hạn.";

    /// <summary>
    /// Tìm tài khoản được phép đặt lại mật khẩu: chỉ Học sinh và Giáo viên, chưa bị khoá, có email.
    /// Học sinh nhập mã học sinh; Giáo viên (hoặc học sinh) có thể nhập email.
    /// Admin cố ý không được hỗ trợ để tránh chiếm quyền quản trị qua email.
    /// </summary>
    public static async Task<User?> FindEligibleUserAsync(
        IApplicationDbContext context,
        string? identifier,
        CancellationToken cancellationToken)
    {
        var value = identifier?.Trim() ?? string.Empty;
        if (value.Length == 0) return null;

        User? user;

        if (value.Contains('@'))
        {
            var email = value.ToLowerInvariant();
            user = await context.Users
                .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        }
        else
        {
            var studentCode = value.ToUpperInvariant();
            var student = await context.Students
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.MaHS == studentCode, cancellationToken);
            user = student?.User;
        }

        if (user == null || user.IsLocked) return null;
        if (string.IsNullOrWhiteSpace(user.Email)) return null;

        var isStudent = string.Equals(user.Role, "Student", StringComparison.OrdinalIgnoreCase);
        var isTeacher = string.Equals(user.Role, "Teacher", StringComparison.OrdinalIgnoreCase);

        return isStudent || isTeacher ? user : null;
    }
}
