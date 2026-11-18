using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
namespace OnlineExamSystem.API.Controllers;
[ApiController, Route("api/admin/audit-logs"), Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public AuditLogsController(IApplicationDbContext db) => _db = db;
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] string? role, [FromQuery] int limit = 200)
    {
        var q = _db.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(x => x.Role == role);
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(x => x.UserEmail.Contains(search) || x.Path.Contains(search));
        return Ok(await q.OrderByDescending(x => x.CreatedAt).Take(Math.Clamp(limit, 1, 500)).ToListAsync());
    }
}
