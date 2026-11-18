using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common.Security;
using OnlineExamSystem.Application.Common.Validation;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.CreateTeacher;

public class CreateTeacherHandler
    : IRequestHandler<CreateTeacherCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateTeacherHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(
        CreateTeacherCommand request,
        CancellationToken cancellationToken)
    {
        var email = request.Email?.Trim()
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email))
            throw new Exception("Email không được để trống");

        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

        PasswordPolicy.Validate(request.MatKhau, settings);

        // SĐT (nếu có) phải gồm đúng 10 chữ số.
        var phone = PhoneNumberValidator.Normalize(request.SDT);

        var emailExists = await _context.Users
            .AnyAsync(
                x => x.Email == email,
                cancellationToken);

        if (emailExists)
            throw new Exception("Email đã tồn tại");

        var subjectExists = await _context.Subjects
            .AnyAsync(
                x => x.Id == request.SubjectId,
                cancellationToken);

        if (!subjectExists)
            throw new Exception("Môn học không tồn tại");

        var gradeExists = await _context.Grades
            .AnyAsync(
                x => x.Id == request.GradeId,
                cancellationToken);

        if (!gradeExists)
            throw new Exception("Khối lớp không tồn tại");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Ho = request.Ho?.Trim() ?? string.Empty,
            TenDem = request.TenDem?.Trim() ?? string.Empty,
            Ten = request.Ten?.Trim() ?? string.Empty,
            Email = email,
            MatKhau = BCrypt.Net.BCrypt.HashPassword(request.MatKhau),
            Role = "Teacher",
            CreatedAt = DateTime.UtcNow
        };

        var teacher = new Teacher
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,

            // Admin được nhập SĐT khi tạo tài khoản.
            // Sau khi tạo, Admin không được sửa SĐT qua UpdateTeacherCommand.
            SDT = phone,

            SubjectId = request.SubjectId,
            GradeId = request.GradeId
        };

        _context.Users.Add(user);
        _context.Teachers.Add(teacher);

        await _context.SaveChangesAsync(
            cancellationToken);

        return teacher.Id;
    }
}
