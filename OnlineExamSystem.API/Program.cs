using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using MediatR;
using OnlineExamSystem.API.Middlewares;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OnlineExamSystem.API.Services;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Infrastructure.Persistence;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;
using OnlineExamSystem.Infrastructure.AI;
using OnlineExamSystem.Infrastructure.Email;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Cấu hình CORS cho phép Frontend trên Vercel và Local gọi Backend trên Render
var allowedOriginsConfig = builder.Configuration["Cors:AllowedOrigins"]
    ?? builder.Configuration["AllowedOrigins"]
    ?? builder.Configuration["Frontend:Urls"]
    ?? builder.Configuration["FRONTEND_URL"];

var configuredOrigins = string.IsNullOrWhiteSpace(allowedOriginsConfig)
    ? Array.Empty<string>()
    : allowedOriginsConfig
        .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(o => o.TrimEnd('/'))
        .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin))
                {
                    return false;
                }

                var normalizedOrigin = origin.TrimEnd('/');

                if (configuredOrigins.Length == 0 || configuredOrigins.Contains("*"))
                {
                    return true;
                }

                if (configuredOrigins.Contains(normalizedOrigin, StringComparer.OrdinalIgnoreCase))
                {
                    return true;
                }

                if (Uri.TryCreate(normalizedOrigin, UriKind.Absolute, out var uri))
                {
                    if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                        uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                        uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }

                return false;
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))); builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetService<ApplicationDbContext>());
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(
        Assembly.Load("OnlineExamSystem.Application"));
});
builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)

    .AddJwtBearer(
        options =>
        {
            options.TokenValidationParameters
                =
                new TokenValidationParameters
                {
                    ValidateIssuer = true,

                    ValidateAudience = true,

                    ValidateLifetime = true,

                    ValidateIssuerSigningKey
                        = true,

                    ValidIssuer =
                        builder.Configuration[
                            "Jwt:Issuer"],

                    ValidAudience =
                        builder.Configuration[
                            "Jwt:Audience"],

                    IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(
                                builder.Configuration[
                                    "Jwt:Key"]!)),
                    // không cộng thêm thời gian mặc định.
                    ClockSkew = TimeSpan.Zero
                };
        });

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<
    ICurrentUserService,
    CurrentUserService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddHttpClient<IPracticeExplanationService, GeminiPracticeExplanationService>(client =>
    client.Timeout = TimeSpan.FromSeconds(90));
builder.Services.AddHttpClient<ILearningAiService, GeminiLearningAiService>(client =>
    client.Timeout = TimeSpan.FromSeconds(90));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, ct) =>
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = context.HttpContext.Request.Path.StartsWithSegments("/api/auth")
                ? "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút."
                : "Bạn đang gửi quá nhiều yêu cầu AI. Vui lòng thử lại sau một phút."
        }, cancellationToken: ct);
    options.AddPolicy("ai", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
            AutoReplenishment = true
        }));
    // Quên/đặt lại mật khẩu: giới hạn theo IP để chống spam email và dò mã.
    options.AddPolicy("password-reset", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10, Window = TimeSpan.FromMinutes(5), QueueLimit = 0,
            AutoReplenishment = true
        }));
});
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var context =
        services.GetRequiredService<ApplicationDbContext>();

    // Tự áp dụng các migration còn thiếu trước khi đọc/ghi dữ liệu hệ thống.
    await context.Database.MigrateAsync();

    await DbInitializer
        .SeedAdminAsync(context);
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionHandlingMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();

app.UseMiddleware<AuditLogMiddleware>();

app.UseAuthorization();
app.UseRateLimiter(); 

app.MapControllers();

app.Run();
