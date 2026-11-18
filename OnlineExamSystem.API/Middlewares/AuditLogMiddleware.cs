using System.Security.Claims;
using OnlineExamSystem.Domain.Entities;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;
namespace OnlineExamSystem.API.Middlewares;
public class AuditLogMiddleware
{
    private static readonly HashSet<string> Tracked = new(StringComparer.OrdinalIgnoreCase) { "POST", "PUT", "PATCH", "DELETE" };
    private readonly RequestDelegate _next;
    public AuditLogMiddleware(RequestDelegate next) => _next = next;
    public async Task InvokeAsync(HttpContext context, IServiceScopeFactory scopes)
    {
        try { await _next(context); }
        finally
        {
            if (!Tracked.Contains(context.Request.Method) || context.Request.Path.StartsWithSegments("/api/admin/audit-logs")) ;
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                Guid? userId = Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
                db.AuditLogs.Add(new AuditLog { Id = Guid.NewGuid(), UserId = userId, UserEmail = context.User.FindFirstValue(ClaimTypes.Email) ?? "Ẩn danh", Role = context.User.FindFirstValue(ClaimTypes.Role) ?? "Anonymous", Method = context.Request.Method, Path = context.Request.Path, StatusCode = context.Response.StatusCode, IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? string.Empty, CreatedAt = DateTime.UtcNow });
                await db.SaveChangesAsync();
            }
            catch { /* Nhật ký không được làm hỏng request chính. */ }
        }
    }
}
