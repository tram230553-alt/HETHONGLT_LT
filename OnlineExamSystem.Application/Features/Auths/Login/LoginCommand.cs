using MediatR;
using System.Text.Json.Serialization;

namespace OnlineExamSystem.Application.Features.Auths.Login;

public class LoginCommand : IRequest<string>
{
    // Student: nhập MaHS. Admin/Teacher: nhập Email.
    public string Identifier { get; set; } = string.Empty;

    public string MatKhau { get; set; } = string.Empty;

    [JsonIgnore]
    public string IpAddress { get; set; } = string.Empty;

    [JsonIgnore]
    public string UserAgent { get; set; } = string.Empty;
}
