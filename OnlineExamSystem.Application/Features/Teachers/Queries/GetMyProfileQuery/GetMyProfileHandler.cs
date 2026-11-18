using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetMyProfileQuery
{
    public class GetMyProfileHandler
    : IRequestHandler<GetMyProfileQuery, TeacherProfileDto>
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

        public async Task<TeacherProfileDto> Handle(
            GetMyProfileQuery request,
            CancellationToken cancellationToken)
        {
            var userId = Guid.Parse(_currentUser.UserId);

            var teacher = await _context.Teachers
    .Include(x => x.User)
    .Include(x => x.Subject)
    .Include(x => x.Grade)
    .FirstOrDefaultAsync(
        x => x.UserId == userId,
        cancellationToken);

            if (teacher == null)
                throw new Exception("Teacher not found");

            var recentActivities = await _context.AuditLogs
                .AsNoTracking()
                .Where(x => x.UserId == userId &&
                            x.Method != "GET" &&
                            x.StatusCode >= 200 &&
                            x.StatusCode < 400)
                .OrderByDescending(x => x.CreatedAt)
                .Take(10)
                .Select(x => new { x.Method, x.Path, x.CreatedAt })
                .ToListAsync(cancellationToken);

            var safeActivities = recentActivities
                .Select(x => new TeacherAccountActivityDto
                {
                    Description = DescribeActivity(x.Method, x.Path),
                    CreatedAt = x.CreatedAt
                })
                .ToList();

            return new TeacherProfileDto
            {
                Id = teacher.Id,

                HoTen = $"{teacher.User.Ho} {teacher.User.TenDem} {teacher.User.Ten}",

                Email = teacher.User.Email,

                SDT = teacher.SDT,

                SubjectId = teacher.SubjectId,

                GradeId = teacher.GradeId,

                TenMH = teacher.Subject.TenMH,

                TenKhoi = teacher.Grade.TenKhoi,
                ReceiveAdminNotifications = teacher.ReceiveAdminNotifications,
                ExamApprovalNotifications = teacher.ExamApprovalNotifications,
                StudentSubmissionNotifications = teacher.StudentSubmissionNotifications,
                EmailNotifications = teacher.EmailNotifications,
                SystemNotifications = teacher.SystemNotifications,
                ThemePreference = teacher.ThemePreference,
                AutoSaveEnabled = teacher.AutoSaveEnabled,
                RecentAccountActivities = safeActivities
            };
        }

        private static string DescribeActivity(string method, string path)
        {
            if (path.StartsWith("/api/users/change-password", StringComparison.OrdinalIgnoreCase))
                return "Đã đổi mật khẩu";
            if (path.StartsWith("/api/teachers/profile", StringComparison.OrdinalIgnoreCase))
                return "Đã cập nhật thông tin cá nhân";
            if (path.StartsWith("/api/teachers/settings", StringComparison.OrdinalIgnoreCase))
                return "Đã cập nhật cài đặt tài khoản";
            if (path.Contains("/submit-for-approval", StringComparison.OrdinalIgnoreCase))
                return "Đã gửi đề thi để Admin duyệt";
            if (path.StartsWith("/api/questions", StringComparison.OrdinalIgnoreCase))
                return method == "POST" ? "Đã tạo câu hỏi" : method == "DELETE" ? "Đã xóa câu hỏi" : "Đã cập nhật câu hỏi";
            if (path.StartsWith("/api/exams", StringComparison.OrdinalIgnoreCase))
                return method == "POST" ? "Đã tạo đề thi" : method == "DELETE" ? "Đã xóa đề thi" : "Đã cập nhật đề thi";

            return method == "POST" ? "Đã tạo dữ liệu mới" :
                   method == "DELETE" ? "Đã xóa dữ liệu" :
                   "Đã cập nhật dữ liệu";
        }
    }
}
