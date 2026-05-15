$ErrorActionPreference = "Stop"

$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) "scripts" }
$root = Resolve-Path -LiteralPath (Join-Path $scriptRoot "..")
$pidFile = Join-Path $root ".codex-completion-sound.pid"

if (-not (Test-Path -LiteralPath $pidFile)) {
  Write-Host "Codex completion sound watcher is not running for this project."
  exit 0
}

$pidValue = (Get-Content -LiteralPath $pidFile -Raw).Trim()
if ($pidValue) {
  Stop-Process -Id ([int] $pidValue) -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue
Write-Host "Codex completion sound watcher stopped."
