param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('guard-bash.mjs', 'guard-browser.mjs')]
  [string]$Guard
)

$root = (git rev-parse --show-toplevel).Trim()
$env:CODEX_HOOK_RUNTIME = '1'
$env:CODEX_GUARD_KIND = $Guard
& node (Join-Path $root (".claude\\hooks\\" + $Guard))
exit $LASTEXITCODE
