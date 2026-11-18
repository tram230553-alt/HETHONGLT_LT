using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Common.Security;

public static class PasswordPolicy
{
    public static void Validate(string? password, SystemSetting? setting)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Mật khẩu không được để trống.");

        var minimumLength = setting?.MinimumPasswordLength ?? 6;
        if (password.Length < minimumLength)
            throw new ArgumentException($"Mật khẩu phải có ít nhất {minimumLength} ký tự.");

        if (setting?.RequireUppercasePassword == true && !password.Any(char.IsUpper))
            throw new ArgumentException("Mật khẩu phải có ít nhất một chữ in hoa.");

        if (setting?.RequireDigitPassword == true && !password.Any(char.IsDigit))
            throw new ArgumentException("Mật khẩu phải có ít nhất một chữ số.");
    }
}
