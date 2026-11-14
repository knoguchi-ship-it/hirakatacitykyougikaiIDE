param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('prompt', 'stop')]
  [string]$Kind
)
# Codex (Windows) front stage for the ClaudeCode handoff hooks (H9, 2026-11-01).
# Runs on every prompt / every turn end, so exit without starting node when nothing applies
# (starting node alone takes ~0.75 s on this machine).
# Keep this file ASCII only: PowerShell 5.1 reads a BOM-less .ps1 as the ANSI code page.
# Japanese keywords are therefore built from code points below, not written as literals or escapes.
# Avoid cmdlets such as Join-Path / Test-Path (first use loads a module, > 1 s); use .NET calls.
# Fail-open. Codex Stop expects JSON on exit 0, so print '{}' when not blocking.
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
  $root = (git rev-parse --show-toplevel).Trim()
  $state = if ($env:GUARD_STATE_ROOT) { $env:GUARD_STATE_ROOT } else { $root }
  $env:CODEX_HOOK_RUNTIME = '1'
  if ($Kind -eq 'stop') {
    if (-not [System.IO.File]::Exists([System.IO.Path]::Combine($state, '.tmp', 'handoff-pending.json')) -and -not [System.IO.Directory]::Exists([System.IO.Path]::Combine($state, '.tmp', 'handoff-pending'))) { '{}'; exit 0 }
    & node ([System.IO.Path]::Combine($root, '.claude', 'hooks', 'guard-handoff-stop.mjs'))
    exit 0
  }
  [Console]::InputEncoding = [System.Text.Encoding]::UTF8
  $raw = [Console]::In.ReadToEnd()
  # Coarse filter only; the exact decision is made by guard-handoff-prompt.mjs.
  # handoff (katakana) / hiki(ki)tsugi / matomete-toji / kugiri / handoff / JSON escape "\u"
  $handoffKana = -join [char[]](0x30CF, 0x30F3, 0x30C9, 0x30AA, 0x30D5)
  $hikitsugi = [string][char]0x5F15 + [char]0x304D + '?' + [char]0x7D99
  $matome = -join [char[]](0x307E, 0x3068, 0x3081, 0x3066, 0x9589, 0x3058)
  $kugiri = -join [char[]](0x533A, 0x5207)
  $jsonEscape = [regex]::Escape([string][char]92) + 'u'
  $pattern = '(?i)' + (@($handoffKana, $hikitsugi, $matome, $kugiri, 'handoff', $jsonEscape) -join '|')
  if (-not [regex]::IsMatch($raw, $pattern)) { exit 0 }
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($tmp, $raw, (New-Object System.Text.UTF8Encoding($false)))
    $env:HANDOFF_HOOK_INPUT_FILE = $tmp
    & node ([System.IO.Path]::Combine($root, '.claude', 'hooks', 'guard-handoff-prompt.mjs'))
  } finally {
    [System.IO.File]::Delete($tmp)
  }
  exit 0
} catch {
  if ($Kind -eq 'stop') { '{}' }
  exit 0
}
