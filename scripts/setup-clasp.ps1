param(
  [Parameter(Mandatory = $true)]
  [string]$ScriptId
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$claspPath = Join-Path $repoRoot ".clasp.json"

$config = @{
  scriptId = $ScriptId
  rootDir  = "backend"
} | ConvertTo-Json

Set-Content -Path $claspPath -Value $config -Encoding UTF8
Write-Host "Created .clasp.json with rootDir=backend"
