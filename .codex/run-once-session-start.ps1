# One-shot SessionStart for Codex (2026-11-02 operator request).
# If .tmp/codex-once-session-start.md exists, pass its text to Codex as developer context once,
# then rename it to *.done.md so it never fires again. The instructions in that file tell Codex to
# remove this hook entry and this script after the check. Keep this file ASCII only (PowerShell 5.1).
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
  $root = (git rev-parse --show-toplevel).Trim()
  $file = [System.IO.Path]::Combine($root, '.tmp', 'codex-once-session-start.md')
  if (-not [System.IO.File]::Exists($file)) { exit 0 }
  $text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
  [System.IO.File]::Move($file, [System.IO.Path]::Combine($root, '.tmp', 'codex-once-session-start.done.md'))
  $out = @{ hookSpecificOutput = @{ hookEventName = 'SessionStart'; additionalContext = $text } }
  ConvertTo-Json -InputObject $out -Compress -Depth 4
  exit 0
} catch {
  exit 0
}
