param(
  [int]$Port = 3010
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $PSScriptRoot
$env:NEXT_TELEMETRY_DISABLED = "1"
$nextCli = Join-Path $dir "node_modules\next\dist\bin\next"
$stdout = Join-Path $dir "site-server.log"
$stderr = Join-Path $dir "site-server.err.log"

function Write-Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $stdout -Value $line -ErrorAction SilentlyContinue
}

function Get-ServerProc {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    $pid_ = ($conn | Select-Object -First 1).OwningProcess
    return Get-Process -Id $pid_ -ErrorAction SilentlyContinue
  }
  return $null
}

Write-Log "watchdog started on port $Port"

if (Get-ServerProc) {
  Write-Log "port $Port already in use - exiting to avoid duplicate instances"
  exit 0
}

$proc = $null

while ($true) {
  if (-not $proc -or $proc.HasExited) {
    if ($proc) { Write-Log "server exited (code $($proc.ExitCode)); restarting" }
    Write-Log "starting next start on port $Port"
    $proc = Start-Process -FilePath "node" -ArgumentList "`"$nextCli`"", "start", "-p", "$Port" -WorkingDirectory $dir -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  }
  Start-Sleep -Seconds 5
}