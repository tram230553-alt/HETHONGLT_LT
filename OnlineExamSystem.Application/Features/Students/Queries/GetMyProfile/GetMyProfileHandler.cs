using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetMyProfile
{
    public class GetMyProfileHandler
    : IRequestHandler<
        GetMyProfileQuery,
        StudentProfileDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public GetMyProfileHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<StudentProfileDto> Handle(
        GetMyProfileQuery request,
        CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(
                    _currentUser.UserId,
                    out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Không xác định được tài khoản đang đăng nhập.");
            }

            var student = await _context.Students
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Grade)
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

            if (student == null)
            {
                throw new KeyNotFoundException(
                    "Không tìm thấy hồ sơ học sinh.");
            }

            var hoTen = string.Join(
                " ",
                new[]
                {
                student.User.Ho,
                student.User.TenDem,
                student.User.Ten
                }
                .Where(x =>
                    !string.IsNullOrWhiteSpace(x)));

            return new StudentProfileDto
            {
                Id = student.Id,

                HoTen = hoTen,

                Email = student.User.Email,

                MaHS = student.MaHS,

                NgaySinh = student.NgaySinh,

                GradeId = student.GradeId,

                TenKhoi = student.Grade.TenKhoi,

                IsLocked = student.User.IsLocked,

                CreatedAt = student.User.CreatedAt
            };
        }
    }
}
