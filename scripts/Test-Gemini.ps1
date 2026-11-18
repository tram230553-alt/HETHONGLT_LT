param([string]$Model = "")
$ErrorActionPreference = "Stop"
$key = $env:GEMINI_API_KEY
if ([string]::IsNullOrWhiteSpace($key)) {
    $secure = Read-Host "Nhap Gemini API key (an ky tu)" -AsSecureString
    $key = [System.Net.NetworkCredential]::new("", $secure).Password
}
if ([string]::IsNullOrWhiteSpace($key)) { throw "API key is empty." }
$headers = @{ "x-goog-api-key" = $key.Trim() }
$base = "https://generativelanguage.googleapis.com/v1beta"
try {
    $available = @()
    $pageToken = ""
    do {
        $url = "$base/models?pageSize=100"
        if ($pageToken) { $url += "&pageToken=$([uri]::EscapeDataString($pageToken))" }
        $page = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -TimeoutSec 90
        $available += @($page.models | Where-Object { $_.supportedGenerationMethods -contains "generateContent" })
        $pageToken = $page.nextPageToken
    } while ($pageToken)
    $available | Select-Object name, displayName | Format-Table -AutoSize
    if (!$available.Count) { throw "No model supporting generateContent is available." }
    if ([string]::IsNullOrWhiteSpace($Model)) { $Model = Read-Host "Nhap model tu danh sach tren (vi du models/...)" }
    $Model = $Model.Trim() -replace '^models/', ''
    if ($Model -notmatch '^[a-zA-Z0-9][a-zA-Z0-9._-]*$') { throw "Invalid model name." }
    $payload = @{ contents = @(@{ role = "user"; parts = @(@{ text = "Reply with the word OK." }) }); generationConfig = @{ maxOutputTokens = 1024 } } | ConvertTo-Json -Depth 10
    $result = Invoke-RestMethod -Uri "$base/models/$($Model):generateContent" -Headers $headers -Method Post -ContentType "application/json" -Body $payload -TimeoutSec 90
    $texts = @($result.candidates[0].content.parts | Where-Object { !$_.thought -and $_.text } | ForEach-Object { $_.text })
    if (!$texts.Count) { throw "HTTP succeeded but no text returned. Try another text model." }
    Write-Host "generateContent OK. Model: $Model"
    $texts -join "`n"
    Write-Host "Set this SAME model in Visual Studio Terminal:"
    Write-Host "dotnet user-secrets set Gemini:Model $Model --project .\OnlineExamSystem.API"
} catch {
    # Do not dump exception/URL/headers that could contain credentials.
    $status = $null
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    if ($status) { Write-Host "Gemini HTTP $status. 403: key/permissions; 404: model/access; 429: quota; 503: temporary overload." }
    else { Write-Host "Test failed: check network, key, model name and nonempty response." }
    exit 1
} finally { $key = $null; $headers = $null }
