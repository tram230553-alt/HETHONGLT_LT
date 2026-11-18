using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace OnlineExamSystem.Infrastructure.AI;

internal static class GeminiRequest
{
    private static readonly string[] PlaceholderMarkers =
    {
        "your_gemini_api_key", "my_gemini_api_key", "your_api_key", "api_key_here", "changeme", "xxxx"
    };

    private static bool IsUsableKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return false;
        var lower = key.Trim().ToLowerInvariant();
        return !PlaceholderMarkers.Any(lower.Contains);
    }

    public static string ApiKey(IConfiguration config)
    {
        // Thứ tự: cấu hình (user-secrets/appsettings) -> biến môi trường. Giá trị mẫu bị bỏ qua
        // để không che mất key thật ở nguồn khác.
        foreach (var candidate in new[]
        {
            config["Gemini:ApiKey"],
            Environment.GetEnvironmentVariable("GEMINI_API_KEY"),
            Environment.GetEnvironmentVariable("GOOGLE_API_KEY")
        })
        {
            if (IsUsableKey(candidate)) return candidate!.Trim();
        }
        throw new AiProviderException("AI chưa được cấu hình. Đặt Gemini:ApiKey bằng dotnet user-secrets trong project API (hoặc biến môi trường GEMINI_API_KEY) rồi khởi động lại API.");
    }

    private static string NormalizeModel(string? raw)
    {
        var model = raw?.Trim();
        if (string.IsNullOrWhiteSpace(model)) model = "gemini-2.5-flash";
        if (model.StartsWith("models/", StringComparison.Ordinal)) model = model[7..];
        if (!Regex.IsMatch(model, @"^[a-zA-Z0-9][a-zA-Z0-9._-]*$"))
            throw new AiProviderException("Gemini:Model không hợp lệ. Nhập tên model hoặc models/tên-model, không nhập URL.");
        return model;
    }

    public static string Model(IConfiguration config) => NormalizeModel(config["Gemini:Model"]);

    // Model dự phòng mặc định dùng alias "-latest" nên không bị hỏng khi Google ngừng một phiên bản cụ thể.
    private static readonly string[] DefaultFallbackModels =
        { "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-flash-lite-latest" };

    /// <summary>Model chính + các model dự phòng (Gemini:FallbackModels, phân tách bằng dấu phẩy; "none" để tắt).</summary>
    public static IReadOnlyList<string> Models(IConfiguration config)
    {
        var list = new List<string> { Model(config) };
        var raw = config["Gemini:FallbackModels"];
        IEnumerable<string> extras;
        if (string.IsNullOrWhiteSpace(raw)) extras = DefaultFallbackModels;
        else if (raw.Trim().Equals("none", StringComparison.OrdinalIgnoreCase)) extras = Array.Empty<string>();
        else extras = raw.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var extra in extras)
        {
            var normalized = NormalizeModel(extra);
            if (!list.Contains(normalized, StringComparer.OrdinalIgnoreCase)) list.Add(normalized);
        }
        return list;
    }

    // Lỗi nằm ở key/yêu cầu: đổi model không giúp được gì nên dừng ngay.
    private static bool IsFatalForAllModels(int? code) => code is 400 or 401 or 403;

    public static async Task<HttpResponseMessage> SendAsync(HttpClient http, IConfiguration config,
        ILogger logger, object body, CancellationToken ct)
    {
        var key = ApiKey(config);
        var models = Models(config);
        var started = DateTime.UtcNow;
        AiProviderException? lastError = null;
        AiProviderException? quotaError = null; // ưu tiên báo lỗi hạn mức nếu có, vì đó là điều người dùng cần xử lý

        for (var m = 0; m < models.Count; m++)
        {
            var model = models[m];
            // Không mở thêm model mới nếu đã chờ quá lâu (tránh treo người dùng hàng phút).
            if (m > 0 && DateTime.UtcNow - started > TimeSpan.FromSeconds(75)) break;

            for (var attempt = 0; ; attempt++)
            {
                using var request = new HttpRequestMessage(HttpMethod.Post,
                    $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent");
                request.Headers.Add("x-goog-api-key", key);
                request.Content = JsonContent.Create(body);
                HttpResponseMessage response;
                try { response = await http.SendAsync(request, ct); }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                {
                    lastError = new AiProviderException("Gemini phản hồi quá lâu. Vui lòng thử lại hoặc giảm số câu hỏi.");
                    logger.LogWarning("Gemini model {Model} quá thời gian chờ", model);
                    break; // thử model kế tiếp
                }
                catch (HttpRequestException)
                {
                    // Lỗi mạng/DNS/TLS không phụ thuộc model: báo ngay.
                    throw new AiProviderException("Máy chủ không kết nối được Gemini. Kiểm tra mạng, DNS, proxy và TLS.");
                }

                var code = (int)response.StatusCode;
                // Thử lại một lần với lỗi tạm thời của cùng model, sau đó chuyển model dự phòng.
                if (attempt < 1 && code is 500 or 502 or 503 or 504)
                {
                    response.Dispose();
                    logger.LogWarning("Gemini model {Model} tạm thời lỗi (HTTP {Code}); thử lại", model, code);
                    await Task.Delay(TimeSpan.FromMilliseconds(800 + Random.Shared.Next(0, 600)), ct);
                    continue;
                }

                try { await AiProviderException.CheckResponseAsync(response, logger, ct); }
                catch (AiProviderException ex)
                {
                    response.Dispose();
                    if (IsFatalForAllModels(ex.ProviderStatusCode)) throw;
                    lastError = ex;
                    if (ex.ProviderStatusCode == 429) quotaError = ex;
                    logger.LogWarning("Gemini model {Model} thất bại (HTTP {Code}); chuyển model dự phòng nếu còn",
                        model, ex.ProviderStatusCode);
                    break; // 404/429/5xx: thử model kế tiếp
                }
                if (m > 0) logger.LogInformation("Gemini đã dùng model dự phòng {Model}", model);
                return response;
            }
        }

        throw quotaError ?? lastError ?? new AiProviderException("Gemini không phản hồi. Vui lòng thử lại sau.");
    }

    public static async Task<string> ReadTextAsync(HttpResponseMessage response, CancellationToken ct, bool allowPartial = false)
    {
        try
        {
            using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var root = json.RootElement;
            if (!root.TryGetProperty("candidates", out var candidates) || candidates.ValueKind != JsonValueKind.Array || candidates.GetArrayLength() == 0)
                throw new AiProviderException("Gemini không trả về nội dung; yêu cầu có thể bị bộ lọc chặn. Hãy đổi cách hỏi.");
            var candidate = candidates[0];
            var finishReason = candidate.TryGetProperty("finishReason", out var finish) ? finish.GetString() : null;
            var truncated = finishReason == "MAX_TOKENS";
            // Văn bản thường (chat/giải thích) bị cắt do giới hạn token vẫn dùng được; JSON thì không.
            if (finishReason != null && finishReason != "STOP" && !(truncated && allowPartial))
                throw new AiProviderException(truncated
                    ? "Phản hồi AI bị cắt do giới hạn token. Giảm số câu hoặc hỏi ngắn hơn."
                    : "Gemini chưa hoàn thành phản hồi hoặc đã chặn nội dung. Hãy đổi cách hỏi.");
            if (!candidate.TryGetProperty("content", out var content) || !content.TryGetProperty("parts", out var parts) || parts.ValueKind != JsonValueKind.Array)
                throw new AiProviderException(truncated
                    ? "Phản hồi AI bị cắt do giới hạn token. Giảm số câu hoặc hỏi ngắn hơn."
                    : "Gemini trả về phản hồi thiếu nội dung. Vui lòng thử lại.");
            var text = string.Join("\n", parts.EnumerateArray()
                .Where(p => (!p.TryGetProperty("thought", out var thought) || thought.ValueKind != JsonValueKind.True)
                    && p.TryGetProperty("text", out var t) && t.ValueKind == JsonValueKind.String)
                .Select(p => p.GetProperty("text").GetString()));
            if (string.IsNullOrWhiteSpace(text))
                throw new AiProviderException(truncated
                    ? "Phản hồi AI bị cắt do giới hạn token. Giảm số câu hoặc hỏi ngắn hơn."
                    : "Gemini trả về nội dung rỗng. Vui lòng thử lại.");
            return truncated ? text + "\n\n(…câu trả lời bị cắt ngắn, hãy hỏi tiếp để AI viết nốt phần còn lại.)" : text;
        }
        catch (JsonException) { throw new AiProviderException("Gemini trả về JSON không hợp lệ. Vui lòng thử lại."); }
        catch (InvalidOperationException) { throw new AiProviderException("Cấu trúc phản hồi Gemini không hợp lệ. Vui lòng thử lại."); }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        { throw new AiProviderException("Gemini phản hồi quá lâu. Vui lòng thử lại."); }
    }
}
