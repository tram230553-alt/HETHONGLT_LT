namespace OnlineExamSystem.Domain.Entities;

/// <summary>
/// Mã xác nhận (OTP) dùng một lần để đặt lại mật khẩu.
/// Chỉ lưu bản băm của mã, không lưu mã gốc.
/// </summary>
public class PasswordResetToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string CodeHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    /// <summary>Số lần nhập sai mã. Vượt giới hạn thì mã bị vô hiệu.</summary>
    public int FailedAttempts { get; set; }

    /// <summary>Có giá trị khi mã đã dùng, đã bị thay bằng mã mới hoặc bị khoá do nhập sai nhiều lần.</summary>
    public DateTime? UsedAt { get; set; }

    public User User { get; set; } = null!;
}
