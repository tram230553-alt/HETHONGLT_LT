namespace OnlineExamSystem.Application.Common.Validation;

public static class PhoneNumberValidator
{
    public const int RequiredLength = 10;

    public const string ErrorMessage = "Số điện thoại phải gồm đúng 10 chữ số";

    // Số điện thoại là tùy chọn: để trống thì trả về chuỗi rỗng.
    // Nếu có nhập thì phải gồm đúng 10 chữ số (không khoảng trắng, không ký tự khác).
    public static string Normalize(string? phone)
    {
        var value = phone?.Trim() ?? string.Empty;

        if (value.Length == 0)
        {
            return value;
        }

        if (value.Length != RequiredLength || !value.All(char.IsAsciiDigit))
        {
            throw new Exception(ErrorMessage);
        }

        return value;
    }
}
