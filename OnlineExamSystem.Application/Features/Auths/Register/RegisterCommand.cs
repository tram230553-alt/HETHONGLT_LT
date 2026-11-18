using MediatR;

namespace OnlineExamSystem.Application.Features.Auths.Register;

public class RegisterCommand : IRequest<string>
{
    public string MaHS { get; set; } = string.Empty;

    public string Ho { get; set; } = string.Empty;

    public string TenDem { get; set; } = string.Empty;

    public string Ten { get; set; } = string.Empty;

    public DateTime NgaySinh { get; set; } 
    public string Email { get; set; } = string.Empty;

    public string MatKhau { get; set; } = string.Empty;
}
