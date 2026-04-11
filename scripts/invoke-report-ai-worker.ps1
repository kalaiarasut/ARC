param(
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$WorkerSecret = $env:REPORT_AI_WORKER_SECRET,
  [int]$Limit = 10,
  [int]$Concurrency = 2
)

if ([string]::IsNullOrWhiteSpace($SupabaseUrl)) {
  throw "SUPABASE_URL is required. Set it in the environment or pass -SupabaseUrl."
}

if ([string]::IsNullOrWhiteSpace($WorkerSecret)) {
  throw "REPORT_AI_WORKER_SECRET is required. Set it in the environment or pass -WorkerSecret."
}

$baseUrl = $SupabaseUrl.TrimEnd('/')
$endpoint = "$baseUrl/functions/v1/process_pending_report_ai"
$headers = @{
  "content-type"   = "application/json"
  "x-worker-secret" = $WorkerSecret
}
$payload = @{
  limit = $Limit
  concurrency = $Concurrency
} | ConvertTo-Json

Write-Host "Invoking report AI worker at $endpoint" -ForegroundColor Cyan
Write-Host "Batch size: $Limit | Concurrency: $Concurrency" -ForegroundColor DarkGray

$response = Invoke-RestMethod -Method Post -Uri $endpoint -Headers $headers -Body $payload
$response | ConvertTo-Json -Depth 6
