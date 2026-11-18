using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common.Validation;

namespace OnlineExamSystem.Application.Features.Teachers.Commands.UpdateProfile;

public class UpdateProfileHandler
    : IRequestHandler<UpdateProfileCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateProfileHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(
        UpdateProfileCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được tài khoản đăng nhập");
        }

        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (teacher == null)
            throw new Exception("Teacher not found");

        // SĐT (nếu có) phải gồm đúng 10 chữ số.
        var phone = PhoneNumberValidator.Normalize(request.SDT);

        // Giáo viên chỉ được tự cập nhật thông tin cá nhân riêng tư
        // hiện được backend hỗ trợ là số điện thoại.
        // Họ tên, Email, SubjectId và GradeId không nằm trong command này.
        teacher.SDT = phone;

        await _context.SaveChangesAsync(
            cancellationToken);

        return "Cập nhật số điện thoại thành công";
    }
}
