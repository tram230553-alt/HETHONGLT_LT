using OnlineExamSystem.Domain.Entities;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence
{
    public static class DbInitializer
    {
        public static async Task SeedAdminAsync(
            ApplicationDbContext context)
        {
            var systemSettingExists =
                await context.SystemSettings
                    .AnyAsync(x => x.Id == 1);

            if (!systemSettingExists)
            {
                context.SystemSettings.Add(
                    new SystemSetting
                    {
                        Id = 1,
                        SystemName = "SmartExam",
                        SchoolName = "Trường học",
                        LogoUrl = string.Empty,
                        AcademicYear = "2026-2027",
                        DefaultPracticeQuestionCount = 20,
                        AllowPracticeRetake = true,
                        DefaultExamDurationMinutes = 60,
                        DefaultExamQuestionCount = 40,
                        ShowExamResultAfterSubmit = true,
                        SessionTimeoutMinutes = 60,
                        MinimumPasswordLength = 6,
                        RequireUppercasePassword = false,
                        RequireDigitPassword = false,
                        UpdatedAt = DateTime.UtcNow
                    });

                await context.SaveChangesAsync();
            }

            var adminExists =
                await context.Users
                    .AnyAsync(x => x.Role == "Admin");

            if (adminExists)
                return;

            var admin = new User
            {
                Id = Guid.NewGuid(),
                Ho = "System",
                TenDem = "",
                Ten = "Admin",
                Email = "admin@gmail.com",
                MatKhau =
                    BCrypt.Net.BCrypt.HashPassword(
                        "123456"),

                Role = "Admin",
                CreatedAt = DateTime.Now
            };

            context.Users.Add(admin);

            await context.SaveChangesAsync();
        }
    }
}
