using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common.Security;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Users.Commands.ChangePassword
{
    public class ChangePasswordHandler
    : IRequestHandler<ChangePasswordCommand, string>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public ChangePasswordHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<string> Handle(
    ChangePasswordCommand request,
    CancellationToken cancellationToken)
        {
            if (
                string.IsNullOrWhiteSpace(
                    request.OldPassword)
                ||
                string.IsNullOrWhiteSpace(
                    request.NewPassword)
                ||
                string.IsNullOrWhiteSpace(
                    request.ConfirmPassword))
            {
                throw new ArgumentException(
                    "Vui lòng nhập đầy đủ thông tin mật khẩu.");
            }

            if (
                request.NewPassword !=
                request.ConfirmPassword)
            {
                throw new ArgumentException(
                    "Mật khẩu xác nhận không khớp.");
            }

            var settings = await _context.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

            PasswordPolicy.Validate(request.NewPassword, settings);

            if (
                request.OldPassword ==
                request.NewPassword)
            {
                throw new ArgumentException(
                    "Mật khẩu mới phải khác mật khẩu hiện tại.");
            }

            if (
                !Guid.TryParse(
                    _currentUser.UserId,
                    out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Không xác định được người dùng đang đăng nhập.");
            }

            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        x =>
                            x.Id ==
                            userId,
                        cancellationToken);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "Không tìm thấy tài khoản.");
            }

            var oldPasswordValid =
                BCrypt.Net.BCrypt.Verify(
                    request.OldPassword,
                    user.MatKhau);

            if (!oldPasswordValid)
            {
                throw new ArgumentException(
                    "Mật khẩu hiện tại không chính xác.");
            }

            user.MatKhau =
                BCrypt.Net.BCrypt.HashPassword(
                    request.NewPassword);

            await _context.SaveChangesAsync(
                cancellationToken);

            return "Đổi mật khẩu thành công.";
        }
    }
}
