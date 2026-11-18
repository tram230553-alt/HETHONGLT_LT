using MediatR;

namespace OnlineExamSystem.Application.Features.Auths.ForgotPassword;

public class ForgotPasswordCommand : IRequest<string>
{
    // Học sinh: mã học sinh. Giáo viên: email.
    public string Identifier { get; set; } = string.Empty;
}
