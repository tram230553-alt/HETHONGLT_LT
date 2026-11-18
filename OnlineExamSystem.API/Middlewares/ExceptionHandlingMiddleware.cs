using OnlineExamSystem.Infrastructure.AI;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace OnlineExamSystem.API.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(
                context,
                exception);
        }
    }

    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        var statusCode = exception switch
        {
            KeyNotFoundException =>
                HttpStatusCode.NotFound,

            UnauthorizedAccessException =>
                HttpStatusCode.Unauthorized,

            ArgumentException =>
                HttpStatusCode.BadRequest,

            AiProviderException ai when ai.ProviderStatusCode == 429 =>
                HttpStatusCode.TooManyRequests,

            AiProviderException =>
                HttpStatusCode.ServiceUnavailable,

            HttpRequestException =>
                HttpStatusCode.ServiceUnavailable,

            InvalidOperationException =>
                HttpStatusCode.Conflict,

            DbUpdateException =>
                HttpStatusCode.Conflict,

            _ =>
                HttpStatusCode.InternalServerError
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(
                exception,
                "Lỗi hệ thống tại {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
        }
        else
        {
            _logger.LogWarning(
                exception,
                "Yêu cầu thất bại tại {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
        }

        var message = exception switch
        {
            DbUpdateException =>
                "Không thể cập nhật dữ liệu vì đang có dữ liệu liên quan.",

            AiProviderException ai => ai.Message,

            HttpRequestException =>
                "AI hiện không phản hồi. Vui lòng thử lại sau.",

            _ when statusCode ==
                   HttpStatusCode.InternalServerError =>
                "Đã xảy ra lỗi trong hệ thống. Vui lòng thử lại.",

            _ => exception.Message
        };

        context.Response.StatusCode =
            (int)statusCode;

        context.Response.ContentType =
            "application/json";

        await context.Response.WriteAsJsonAsync(
            new ApiErrorResponse
            {
                ProviderStatusCode = (exception as AiProviderException)?.ProviderStatusCode,
                StatusCode = (int)statusCode,
                Message = message,
                Path = context.Request.Path,
                Timestamp = DateTime.UtcNow
            });
    }
}

public class ApiErrorResponse
{
    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public int? ProviderStatusCode { get; set; }
    public int StatusCode { get; set; }

    public string Message { get; set; }
        = string.Empty;

    public string Path { get; set; }
        = string.Empty;

    public DateTime Timestamp { get; set; }
}
