using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.API.Controllers;

[ApiController]
[Route("api/system-settings")]
[Authorize]
public class ClientSystemSettingsController : ControllerBase
{
    private readonly IApplicationDbContext _db;

    public ClientSystemSettingsController(IApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var setting = await _db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

        if (setting == null)
            return NotFound(new { message = "Chưa có cấu hình hệ thống." });

        return Ok(new
        {
            setting.SystemName,
            setting.SchoolName,
            setting.LogoUrl,
            setting.AcademicYear,
            setting.DefaultPracticeQuestionCount,
            setting.AllowPracticeRetake,
            setting.DefaultExamDurationMinutes,
            setting.DefaultExamQuestionCount,
            setting.ShowExamResultAfterSubmit
        });
    }
}
