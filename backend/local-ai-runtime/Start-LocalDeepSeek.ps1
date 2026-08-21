[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://127.0.0.1:11434',
    [string]$Model = 'deepseek-r1:1.5b',
    [int]$ContextTokens = 4096,
    [string]$KeepAlive = '10m',
    [switch]$StartIfMissing,
    [switch]$VerifyModel
)

$ErrorActionPreference = 'Stop'

# Operational policy:
# 1. Bind/use loopback only; this helper must not expose an inference endpoint on the network.
# 2. Never kill an existing Ollama process. It may serve another user workload.
# 3. Never pull a model automatically. Model download size, license and storage remain owner-controlled.
# 4. Return machine-readable status; GPU use is reported only when verified separately.

$uri = [Uri]$BaseUrl
if ($uri.Host -notin @('127.0.0.1', 'localhost', '::1')) {
    throw 'Local DeepSeek runtime is restricted to a loopback Ollama endpoint.'
}
$base = $BaseUrl.TrimEnd('/')
$tagsUri = "$base/api/tags"

function Get-OllamaTags {
    return Invoke-RestMethod -Uri $tagsUri -TimeoutSec 4
}

$startedNow = $false
try {
    $tags = Get-OllamaTags
} catch {
    if (-not $StartIfMissing) {
        throw 'Ollama is not reachable on loopback. Re-run with -StartIfMissing after confirming local runtime ownership.'
    }
    $ollama = Get-Command ollama -ErrorAction Stop
    $env:OLLAMA_NUM_CTX = "$ContextTokens"
    $env:OLLAMA_KEEP_ALIVE = $KeepAlive
    Start-Process -FilePath $ollama.Source -ArgumentList 'serve' -WindowStyle Hidden
    $startedNow = $true
    $deadline = (Get-Date).AddSeconds(20)
    do {
        Start-Sleep -Seconds 1
        try { $tags = Get-OllamaTags; break } catch { $tags = $null }
    } while ((Get-Date) -lt $deadline)
    if (-not $tags) { throw 'Ollama did not become healthy within 20 seconds.' }
}

$availableModels = @($tags.models | ForEach-Object { $_.name })
$modelInstalled = $availableModels -contains $Model
if (-not $modelInstalled) {
    throw "Required local model '$Model' is not installed. Download it explicitly with: ollama pull $Model"
}

$verification = $null
if ($VerifyModel) {
    $payload = @{ model = $Model; prompt = 'Reply with exactly LOCAL_OK.'; stream = $false; keep_alive = $KeepAlive; options = @{ num_ctx = $ContextTokens; temperature = 0 } } | ConvertTo-Json -Depth 5
    $result = Invoke-RestMethod -Uri "$base/api/generate" -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec 60
    $verification = @{ requested = $true; responseReceived = [bool]$result.response; responseLength = ([string]$result.response).Length; model = $Model }
}

[pscustomobject]@{
    status = 'healthy'
    endpoint = $base
    loopbackOnly = $true
    model = $Model
    modelInstalled = $modelInstalled
    startedNow = $startedNow
    contextTokens = $ContextTokens
    keepAlive = $KeepAlive
    verification = $verification
    gpuVerified = $false
    gpuVerificationNote = 'Ollama response proves model availability only. Verify GPU separately through a healthy NVIDIA driver/runtime before claiming acceleration.'
} | ConvertTo-Json -Depth 5
