$ErrorActionPreference = "Stop"

$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) "scripts" }
$root = Resolve-Path -LiteralPath (Join-Path $scriptRoot "..")
$watcher = Join-Path $scriptRoot "codex-completion-sound-watch.vbs"
$pidFile = Join-Path $root ".codex-completion-sound.pid"

if (Test-Path -LiteralPath $pidFile) {
  $existingPid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
  if ($existingPid) {
    $existing = Get-Process -Id ([int] $existingPid) -ErrorAction SilentlyContinue
    if ($existing -and $existing.ProcessName -eq "cscript") {
      Write-Host "Codex completion sound watcher already running. PID $existingPid"
      exit 0
    }
  }
}

$process = Start-Process -FilePath "cscript.exe" -ArgumentList @("//nologo", "//B", $watcher) -WindowStyle Hidden -PassThru
Set-Content -LiteralPath $pidFile -Encoding ASCII -Value $process.Id
Write-Host "Codex completion sound watcher started. PID $($process.Id)"
