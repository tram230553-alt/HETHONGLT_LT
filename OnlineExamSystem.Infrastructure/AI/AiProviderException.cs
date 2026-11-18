using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace OnlineExamSystem.Infrastructure.AI;

public class AiProviderException : HttpRequestException
{
    public int? ProviderStatusCode { get; }
    public AiProviderException(string message, int? providerStatusCode = null) : base(message)
        => ProviderStatusCode = providerStatusCode;

    public static async Task CheckResponseAsync(HttpResponseMessage response, ILogger logger, CancellationToken ct)
    {
        if (response.IsSuccessStatusCode) return;
        var code = (int)response.StatusCode;
        string? providerStatus = null;
        try
        {
            using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            if (json.RootElement.TryGetProperty("error", out var error)
                && error.TryGetProperty("status", out var status))
            {
                // Log only a known status identifier, never the raw response/key/prompt.
                var value = status.GetString();
                if (value is "INVALID_ARGUMENT" or "FAILED_PRECONDITION" or "PERMISSION_DENIED"
                    or "UNAUTHENTICATED" or "NOT_FOUND" or "RESOURCE_EXHAUSTED" or "INTERNAL" or "UNAVAILABLE")
                    providerStatus = value;
            }
        }
        catch (JsonException) { }
        catch (InvalidOperationException) { }
        logger.LogWarning("Gemini request failed: HTTP {ProviderStatusCode}, status {ProviderStatus}", code, providerStatus ?? "unknown");
        var message = code switch
        {
            400 => "Gemini từ chối yêu cầu (400). Kiểm tra API key, cấu hình model và điều kiện sử dụng của project.",
            401 or 403 => "Gemini từ chối quyền truy cập (401/403). Kiểm tra API key, quyền và giới hạn áp dụng cho key.",
            404 => "Gemini không tìm thấy model (404). Chạy scripts/Test-Gemini.ps1 để lấy model hỗ trợ generateContent và kiểm tra trực tiếp quyền truy cập.",
            429 => "Gemini hết hạn mức hoặc quá nhiều yêu cầu (429). Kiểm tra quota và billing trong Google AI Studio.",
            500 or 503 => "Dịch vụ Gemini tạm thời gặp lỗi hoặc quá tải (500/503). Vui lòng thử lại sau.",
            _ => $"Gọi Gemini thất bại (HTTP {code}). Kiểm tra kết nối và cấu hình máy chủ."
        };
        throw new AiProviderException(message, code);
    }
}
