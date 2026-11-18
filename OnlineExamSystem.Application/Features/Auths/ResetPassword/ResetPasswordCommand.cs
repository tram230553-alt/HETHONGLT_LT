using MediatR;

namespace OnlineExamSystem.Application.Features.Auths.ResetPassword;

public class ResetPasswordCommand : IRequest<string>
{
    // Học sinh: mã học sinh. Giáo viên: email.
    public string Identifier { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string NewPassword { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}
