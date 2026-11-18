using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using OnlineExamSystem.Infrastructure.AI;

static void Check(bool ok, string label) { if (!ok) throw new Exception(label); Console.WriteLine("PASS " + label); }
var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> {
    ["Gemini:ApiKey"] = "fake-test-key", ["Gemini:Model"] = " models/test-model " }).Build();
Check(GeminiRequest.Model(config) == "test-model", "normalize model prefix and spaces");
var oldEnv = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
try {
    config["Gemini:ApiKey"] = " "; Environment.SetEnvironmentVariable("GEMINI_API_KEY", "fallback-test");
    Check(GeminiRequest.ApiKey(config) == "fallback-test", "blank config uses environment key");
} finally { Environment.SetEnvironmentVariable("GEMINI_API_KEY", oldEnv); config["Gemini:ApiKey"] = "fake-test-key"; }
var handler = new FakeHandler(HttpStatusCode.ServiceUnavailable, HttpStatusCode.OK);
using var http = new HttpClient(handler);
using var response = await GeminiRequest.SendAsync(http, config, NullLogger.Instance, new { contents = new object[0] }, default);
Check(handler.Calls == 2 && handler.Path == "/v1beta/models/test-model:generateContent", "retry transient failure and correct path");
Check(await GeminiRequest.ReadTextAsync(response, default) == "OK", "exclude thought text");
var noFallback = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> {
    ["Gemini:ApiKey"] = "fake-test-key", ["Gemini:Model"] = "test-model", ["Gemini:FallbackModels"] = "none" }).Build();
foreach (var code in new[] { HttpStatusCode.Forbidden, HttpStatusCode.NotFound, HttpStatusCode.TooManyRequests }) {
    var h = new FakeHandler(code); using var c = new HttpClient(h);
    try { using var unused = await GeminiRequest.SendAsync(c, noFallback, NullLogger.Instance, new { }, default); throw new Exception("Expected provider exception"); }
    catch (AiProviderException ex) { Check(ex.ProviderStatusCode == (int)code && h.Calls == 1, "no retry and preserve " + (int)code); }
}

// --- Model dự phòng: model chính 404 -> tự chuyển sang model kế tiếp ---
var fb = new FakeHandler(HttpStatusCode.NotFound, HttpStatusCode.OK); using var fbClient = new HttpClient(fb);
using var fbResponse = await GeminiRequest.SendAsync(fbClient, config, NullLogger.Instance, new { }, default);
Check(fb.Calls == 2 && fb.Path == "/v1beta/models/gemini-flash-latest:generateContent", "fallback model used after primary 404");

// 403 (key/quyền) không đổi model vì đổi model không giải quyết được
var forbidden = new FakeHandler(HttpStatusCode.Forbidden); using var forbiddenClient = new HttpClient(forbidden);
try { using var unused = await GeminiRequest.SendAsync(forbiddenClient, config, NullLogger.Instance, new { }, default); throw new Exception("Expected 403"); }
catch (AiProviderException ex) { Check(ex.ProviderStatusCode == 403 && forbidden.Calls == 1, "403 stops without trying other models"); }

// Hết hạn mức ở mọi model -> báo 429 (không bị che bởi lỗi khác)
var quota = new FakeHandler(HttpStatusCode.TooManyRequests, HttpStatusCode.TooManyRequests, HttpStatusCode.TooManyRequests, HttpStatusCode.NotFound);
using var quotaClient = new HttpClient(quota);
try { using var unused = await GeminiRequest.SendAsync(quotaClient, config, NullLogger.Instance, new { }, default); throw new Exception("Expected 429"); }
catch (AiProviderException ex) { Check(ex.ProviderStatusCode == 429, "quota error preferred over later 404"); }

// Key mẫu bị bỏ qua, dùng key thật ở biến môi trường
var placeholder = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> { ["Gemini:ApiKey"] = "your_gemini_api_key_here" }).Build();
var oldEnv2 = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
try {
    Environment.SetEnvironmentVariable("GEMINI_API_KEY", "real-env-key");
    Check(GeminiRequest.ApiKey(placeholder) == "real-env-key", "placeholder key ignored");
} finally { Environment.SetEnvironmentVariable("GEMINI_API_KEY", oldEnv2); }

// Văn bản bị cắt do MAX_TOKENS nhưng có nội dung: dùng được khi allowPartial
using var partial = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(
    "{\"candidates\":[{\"finishReason\":\"MAX_TOKENS\",\"content\":{\"parts\":[{\"text\":\"Phần đầu lời giải\"}]}}]}") };
Check((await GeminiRequest.ReadTextAsync(partial, default, allowPartial: true)).StartsWith("Phần đầu lời giải"), "partial text accepted for plain answers");
foreach (var payload in new[] { "{", "{}", "{\"candidates\":[{\"finishReason\":\"MAX_TOKENS\"}]}" }) {
    using var bad = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(payload) };
    try { await GeminiRequest.ReadTextAsync(bad, default); throw new Exception("Expected invalid content exception"); }
    catch (AiProviderException) { Check(true, "invalid/incomplete content has actionable error"); }
}
using var cancelled = new CancellationTokenSource(); cancelled.Cancel();
try { using var unused = await GeminiRequest.SendAsync(http, config, NullLogger.Instance, new { }, cancelled.Token); throw new Exception("Expected cancellation"); }
catch (OperationCanceledException) { Check(true, "caller cancellation preserved"); }
Console.WriteLine("All checks passed.");

sealed class FakeHandler(params HttpStatusCode[] codes) : HttpMessageHandler {
    public int Calls { get; private set; }
    public string? Path { get; private set; }
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) {
        ct.ThrowIfCancellationRequested(); Path = request.RequestUri!.AbsolutePath;
        if (request.Headers.GetValues("x-goog-api-key").Single() != "fake-test-key") throw new Exception("Missing key header");
        var code = codes[Math.Min(Calls++, codes.Length - 1)];
        return Task.FromResult(new HttpResponseMessage(code) { Content = new StringContent(code == HttpStatusCode.OK
            ? "{\"candidates\":[{\"finishReason\":\"STOP\",\"content\":{\"parts\":[{\"thought\":true,\"text\":\"hidden\"},{\"text\":\"OK\"}]}}]}"
            : "{\"error\":{\"status\":\"UNAVAILABLE\"}}") });
    }
}
