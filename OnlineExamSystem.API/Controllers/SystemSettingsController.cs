using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.API.Controllers;

[ApiController]
[Route("api/admin/system-settings")]
[Authorize(Roles = "Admin")]
public class SystemSettingsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public SystemSettingsController(IApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var setting = await GetOrCreate();
        return Ok(new { setting.SystemName, setting.SchoolName, setting.LogoUrl, setting.AcademicYear,
            GradeCount = await _db.Grades.CountAsync(), SubjectCount = await _db.Subjects.CountAsync(),
            setting.DefaultPracticeQuestionCount, setting.AllowPracticeRetake,
            setting.DefaultExamDurationMinutes, setting.DefaultExamQuestionCount, setting.ShowExamResultAfterSubmit,
            setting.SessionTimeoutMinutes, setting.MinimumPasswordLength, setting.RequireUppercasePassword,
            setting.RequireDigitPassword, setting.UpdatedAt });
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdateSystemSettingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SystemName) || string.IsNullOrWhiteSpace(request.SchoolName))
            throw new ArgumentException("Tên hệ thống và tên trường không được để trống.");
        if (string.IsNullOrWhiteSpace(request.AcademicYear)) throw new ArgumentException("Năm học không được để trống.");
        if (request.DefaultPracticeQuestionCount is < 1 or > 200) throw new ArgumentException("Số câu luyện tập phải từ 1 đến 200.");
        if (request.DefaultExamDurationMinutes is < 1 or > 300) throw new ArgumentException("Thời gian đề phải từ 1 đến 300 phút.");
        if (request.DefaultExamQuestionCount is < 1 or > 200) throw new ArgumentException("Số câu đề thi phải từ 1 đến 200.");
        if (request.SessionTimeoutMinutes is < 5 or > 1440) throw new ArgumentException("Thời hạn phiên phải từ 5 đến 1440 phút.");
        if (request.MinimumPasswordLength is < 6 or > 64) throw new ArgumentException("Độ dài mật khẩu phải từ 6 đến 64 ký tự.");

        var x = await GetOrCreate();
        x.SystemName = request.SystemName.Trim(); x.SchoolName = request.SchoolName.Trim(); x.LogoUrl = request.LogoUrl?.Trim() ?? "";
        x.AcademicYear = request.AcademicYear.Trim(); x.DefaultPracticeQuestionCount = request.DefaultPracticeQuestionCount;
        x.AllowPracticeRetake = request.AllowPracticeRetake; x.DefaultExamDurationMinutes = request.DefaultExamDurationMinutes;
        x.DefaultExamQuestionCount = request.DefaultExamQuestionCount; x.ShowExamResultAfterSubmit = request.ShowExamResultAfterSubmit;
        x.SessionTimeoutMinutes = request.SessionTimeoutMinutes; x.MinimumPasswordLength = request.MinimumPasswordLength;
        x.RequireUppercasePassword = request.RequireUppercasePassword; x.RequireDigitPassword = request.RequireDigitPassword;
        x.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(CancellationToken.None);
        return await Get();
    }

    private async Task<SystemSetting> GetOrCreate()
    {
        var setting = await _db.SystemSettings.FirstOrDefaultAsync(x => x.Id == 1);
        if (setting != null) return setting;
        setting = new SystemSetting { Id = 1, UpdatedAt = DateTime.UtcNow };
        _db.SystemSettings.Add(setting); await _db.SaveChangesAsync(CancellationToken.None); return setting;
    }
}

public class UpdateSystemSettingRequest
{
    public string SystemName { get; set; } = string.Empty; public string SchoolName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; } public string AcademicYear { get; set; } = string.Empty;
    public int DefaultPracticeQuestionCount { get; set; } public bool AllowPracticeRetake { get; set; }
    public int DefaultExamDurationMinutes { get; set; } public int DefaultExamQuestionCount { get; set; }
    public bool ShowExamResultAfterSubmit { get; set; } public int SessionTimeoutMinutes { get; set; }
    public int MinimumPasswordLength { get; set; } public bool RequireUppercasePassword { get; set; }
    public bool RequireDigitPassword { get; set; }
}
