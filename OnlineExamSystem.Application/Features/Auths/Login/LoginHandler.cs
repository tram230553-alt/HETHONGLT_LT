using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OnlineExamSystem.Application.Features.Auths.Login;

public class LoginHandler
    : IRequestHandler<LoginCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public LoginHandler(
        IApplicationDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<string> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var identifier = request.Identifier?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(identifier))
        {
            throw new UnauthorizedAccessException(
                "Vui lòng nhập mã học sinh hoặc email.");
        }

        User? user;
        string? studentCode = null;

        if (identifier.Contains('@'))
        {
            // Admin và Teacher tiếp tục đăng nhập bằng email.
            // Student bắt buộc đăng nhập bằng MaHS.
            var normalizedEmail = identifier.ToLowerInvariant();

            user = await _context.Users
                .FirstOrDefaultAsync(
                    x => x.Email == normalizedEmail &&
                         x.Role != "Student",
                    cancellationToken);
        }
        else
        {
            // Student đăng nhập bằng mã học sinh.
            var normalizedStudentCode = identifier.ToUpperInvariant();

            var student = await _context.Students
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.MaHS == normalizedStudentCode,
                    cancellationToken);

            user = student?.User;
            studentCode = student?.MaHS;
        }

        if (user == null)
        {
            throw new UnauthorizedAccessException(
                "Mã học sinh/email hoặc mật khẩu không chính xác.");
        }

        if (user.IsLocked)
        {
            throw new UnauthorizedAccessException(
                "Tài khoản đã bị khóa.");
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(
            request.MatKhau,
            user.MatKhau);

        if (!passwordValid)
        {
            throw new UnauthorizedAccessException(
                "Mã học sinh/email hoặc mật khẩu không chính xác.");
        }

        var fullName = string.Join(
            " ",
            new[] { user.Ho, user.TenDem, user.Ten }
                .Where(x => !string.IsNullOrWhiteSpace(x)));

        var claims = new List<Claim>
        {
            new(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()),

            new(
                ClaimTypes.Name,
                fullName),

            new(
                ClaimTypes.Email,
                user.Email),

            new(
                ClaimTypes.Role,
                user.Role),
        };

        if (!string.IsNullOrWhiteSpace(studentCode))
        {
            claims.Add(new Claim(
                "student_code",
                studentCode));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"]!));

        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

        var sessionTimeoutMinutes = Math.Clamp(
            settings?.SessionTimeoutMinutes ?? 60,
            5,
            1440);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(sessionTimeoutMinutes),
            signingCredentials: new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256));

        var loggedInAt = DateTime.UtcNow;
        _context.LoginSessions.Add(new LoginSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            DeviceName = GetDeviceName(request.UserAgent),
            BrowserName = GetBrowserName(request.UserAgent),
            IpAddress = Limit(request.IpAddress, 100),
            UserAgent = Limit(request.UserAgent, 1000),
            LoggedInAt = loggedInAt
        });
        await _context.SaveChangesAsync(cancellationToken);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }

    private static string GetDeviceName(string userAgent)
    {
        if (userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase)) return "iPhone";
        if (userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase)) return "iPad";
        if (userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase)) return "Thiết bị Android";
        if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase)) return "Máy tính Windows";
        if (userAgent.Contains("Macintosh", StringComparison.OrdinalIgnoreCase)) return "Máy Mac";
        if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase)) return "Máy tính Linux";
        return "Thiết bị khác";
    }

    private static string GetBrowserName(string userAgent)
    {
        if (userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase)) return "Microsoft Edge";
        if (userAgent.Contains("OPR/", StringComparison.OrdinalIgnoreCase)) return "Opera";
        if (userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase)) return "Firefox";
        if (userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)) return "Google Chrome";
        if (userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase)) return "Safari";
        return "Trình duyệt khác";
    }

    private static string Limit(string? value, int maxLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }
}
