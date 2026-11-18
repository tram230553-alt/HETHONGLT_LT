using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common.Security;
using OnlineExamSystem.Domain.Entities;
using System.Text;

namespace OnlineExamSystem.Application.Features.Auths.Register;

public class RegisterHandler
    : IRequestHandler<RegisterCommand, string>
{
    private readonly IApplicationDbContext _context;

    public RegisterHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var maHS = request.MaHS?.Trim().ToUpperInvariant()
            ?? string.Empty;

        var email = request.Email?.Trim().ToLowerInvariant()
            ?? string.Empty;

        var ho = request.Ho?.Trim() ?? string.Empty;
        var tenDem = request.TenDem?.Trim() ?? string.Empty;
        var ten = request.Ten?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(maHS))
            throw new ArgumentException("Mã học sinh không được để trống.");

        if (string.IsNullOrWhiteSpace(ho))
            throw new ArgumentException("Họ không được để trống.");

        if (string.IsNullOrWhiteSpace(ten))
            throw new ArgumentException("Tên không được để trống.");

        if (request.NgaySinh == default)
            throw new ArgumentException("Ngày sinh không hợp lệ.");

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cá nhân không được để trống.");

        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

        PasswordPolicy.Validate(request.MatKhau, settings);

        var schoolStudent = await _context.SchoolStudents
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.MaHS == maHS && x.IsActive,
                cancellationToken);

        if (schoolStudent == null)
        {
            throw new ArgumentException(
                "Mã học sinh không thuộc danh sách hiện tại của trường.");
        }

        var registeredFullName = string.Join(
            " ",
            new[] { ho, tenDem, ten }
                .Where(x => !string.IsNullOrWhiteSpace(x)));

        if (!string.Equals(
                NormalizeName(schoolStudent.HoTen),
                NormalizeName(registeredFullName),
                StringComparison.Ordinal))
        {
            throw new ArgumentException(
                "Họ và tên không khớp với mã học sinh trong danh sách của trường.");
        }

        var studentCodeUsed = await _context.Students
            .AnyAsync(
                x => x.MaHS == maHS,
                cancellationToken);

        if (studentCodeUsed)
        {
            throw new InvalidOperationException(
                "Mã học sinh này đã được đăng ký tài khoản.");
        }

        var emailUsed = await _context.Users
            .AnyAsync(
                x => x.Email == email,
                cancellationToken);

        if (emailUsed)
        {
            throw new InvalidOperationException(
                "Email này đã được sử dụng cho một tài khoản khác.");
        }

        var gradeExists = await _context.Grades
            .AnyAsync(
                x => x.Id == schoolStudent.GradeId,
                cancellationToken);

        if (!gradeExists)
        {
            throw new InvalidOperationException(
                "Mã học sinh chưa được gán khối lớp hợp lệ trong danh sách trường.");
        }

        var userId = Guid.NewGuid();

        var user = new User
        {
            Id = userId,
            Ho = ho,
            TenDem = tenDem,
            Ten = ten,
            Email = email,
            MatKhau = BCrypt.Net.BCrypt.HashPassword(request.MatKhau),
            Role = "Student",
            IsLocked = false,
            CreatedAt = DateTime.UtcNow,
        };

        var student = new Student
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            GradeId = schoolStudent.GradeId,
            MaHS = maHS,
            NgaySinh = request.NgaySinh.Date,
        };

        _context.Users.Add(user);
        _context.Students.Add(student);

        await _context.SaveChangesAsync(cancellationToken);

        return "Đăng ký thành công. Hãy đăng nhập bằng mã học sinh.";
    }

    private static string NormalizeName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var normalizedWhitespace = string.Join(
            " ",
            value
                .Trim()
                .Split(
                    ' ',
                    StringSplitOptions.RemoveEmptyEntries));

        return normalizedWhitespace
            .Normalize(NormalizationForm.FormC)
            .ToUpperInvariant();
    }
}
