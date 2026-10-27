/**
 * Prevent ClaudeCode/Codex agent-surface drift. Claude procedures are the
 * canonical source; Codex adapters must point to the same procedures.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAUDE_SKILLS = path.join(ROOT, '.claude', 'skills');
const CODEX_SKILLS = path.join(ROOT, '.agents', 'skills');
const CODEX_DIR = path.join(ROOT, '.codex');
const RULES = path.join(CODEX_DIR, 'rules', 'production.rules');
const ADAPTER_BODIES: Record<string, string> = {
  dbops: '# 本番 DB 操作\n\n実行前に、正本である `.claude/skills/dbops/SKILL.md` を最後まで読む。その手順を適用する。Codex では DB 書込みに `sandbox_permissions: "require_escalated"` を付け、operator の承認後にのみ実行する。',
  doc: '# 文書\n\n実行前に、正本である `.claude/skills/doc/SKILL.md` を最後まで読む。その手順と文字コード・索引更新の規約をそのまま適用する。',
  'gas-admin-tool': '# GAS 管理ツール\n\n実行前に、正本である `.claude/skills/gas-admin-tool/SKILL.md` を最後まで読む。その手順と検査をそのまま適用する。',
  handoff: '# 引き継ぎ\n\n実行前に、正本である `.claude/skills/handoff/SKILL.md` を最後まで読む。その手順と最終確認をそのまま適用する。',
  prodcheck: '# 本番確認\n\n実行前に、正本である `.claude/skills/prodcheck/SKILL.md` を最後まで読む。その手順を適用する。ブラウザ経由の書込みは Codex では拒否されるため、承認済みの `clasp run` 経路を使う。',
  release: '# リリース\n\n実行前に、正本である `.claude/skills/release/SKILL.md` を最後まで読む。その手順と承認条件をそのまま適用する。',
  'spec-change': '# 仕様変更\n\n実行前に、正本である `.claude/skills/spec-change/SKILL.md` を最後まで読む。その手順と検査をそのまま適用する。',
};

function skillNames(dir: string) {
  return fs.readdirSync(dir)
    .filter((name) => fs.existsSync(path.join(dir, name, 'SKILL.md')))
    .sort();
}

function configuredHookDecision(matcher: string, toolInput: Record<string, string>, cwd = ROOT) {
  const hooks = JSON.parse(fs.readFileSync(path.join(CODEX_DIR, 'hooks.json'), 'utf8'));
  const hook = hooks.hooks.PreToolUse.find((entry: { matcher: string }) => entry.matcher === matcher)?.hooks?.[0];
  assert.ok(hook, `${matcher}: hook is not configured`);
  const command = process.platform === 'win32' ? hook.commandWindows : hook.command;
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/c', command], {
      cwd, input: JSON.stringify({ tool_input: toolInput }), encoding: 'utf8',
    })
    : spawnSync('/bin/sh', ['-lc', command], {
      cwd, input: JSON.stringify({ tool_input: toolInput }), encoding: 'utf8',
    });
  assert.equal(result.status, 0, `Codex ${matcher} failed: ${result.stderr}`);
  if (!result.stdout.trim()) return 'none';
  return JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;
}

function ruleDecision(...command: string[]) {
  const rulePath = process.platform === 'win32' ? '.codex\\rules\\production.rules' : RULES;
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', [
      'codex', 'execpolicy', 'check', '--rules', rulePath, '--', ...command,
    ].join(' ')], { cwd: ROOT, encoding: 'utf8' })
    : spawnSync('codex', ['execpolicy', 'check', '--rules', rulePath, '--', ...command], {
      cwd: ROOT, encoding: 'utf8',
    });
  assert.equal(result.status, 0, `Codex execpolicy failed: ${result.error || result.stderr}`);
  return JSON.parse(result.stdout).decision || 'allow';
}

test('Codex skill adapters exactly cover canonical ClaudeCode skills', () => {
  const canonical = skillNames(CLAUDE_SKILLS);
  assert.deepEqual(skillNames(CODEX_SKILLS), canonical);
  for (const name of canonical) {
    const adapter = fs.readFileSync(path.join(CODEX_SKILLS, name, 'SKILL.md'), 'utf8');
    assert.match(adapter, new RegExp(`^name: ${name}$`, 'm'), `${name}: adapter name mismatch`);
    assert.ok(adapter.includes(`.claude/skills/${name}/SKILL.md`), `${name}: canonical source missing`);
    const body = adapter.replace(/\r\n/g, '\n').split('---').slice(2).join('---').trim();
    assert.equal(body, ADAPTER_BODIES[name], `${name}: adapter must only contain its approved delegation`);
  }
});

test('Codex project configuration requires approval and installs every guard', () => {
  const config = fs.readFileSync(path.join(CODEX_DIR, 'config.toml'), 'utf8');
  assert.match(config, /^approval_policy\s*=\s*"on-request"$/m);
  assert.match(config, /^approvals_reviewer\s*=\s*"user"$/m);
  assert.match(config, /^hooks\s*=\s*true$/m);

  const hooks = JSON.parse(fs.readFileSync(path.join(CODEX_DIR, 'hooks.json'), 'utf8'));
  const matchers = hooks.hooks.PreToolUse.map((entry: { matcher: string }) => entry.matcher).join('|');
  assert.match(matchers, /Bash/);
  assert.match(matchers, /apply_patch/);
  assert.match(matchers, /mcp__playwright__browser_run_code/);
  assert.ok(fs.existsSync(path.join(CODEX_DIR, 'run-claude-guard.mjs')));
  const windowsCommands = hooks.hooks.PreToolUse.flatMap((entry: { hooks: Array<{ commandWindows?: string }> }) => entry.hooks)
    .map((hook: { commandWindows?: string }) => hook.commandWindows || '')
    .filter(Boolean);
  assert.ok(windowsCommands.every((command: string) => !command.includes('$(git')));
});

test('Codex native approval prompts cover release and production-write commands', () => {
  assert.equal(ruleDecision('npx', 'clasp', 'run', 'healthCheck'), 'prompt');
  assert.equal(ruleDecision('npx', 'clasp', 'run', 'seedDemoData'), 'prompt');
  assert.equal(ruleDecision('git', 'push', 'origin', 'main'), 'prompt');
  assert.equal(ruleDecision('git', 'status'), 'allow');
});

test('Configured Codex hook commands deny forbidden paths and delegate approval', () => {
  for (const cwd of [ROOT, path.join(ROOT, 'gas', 'admin')]) {
    assert.equal(configuredHookDecision('Bash', { command: 'npx clasp deploy' }, cwd), 'deny');
    assert.equal(configuredHookDecision('Bash', { command: 'npx clasp run seedDemoData' }, cwd), 'none');
  }
  assert.equal(configuredHookDecision('mcp__playwright__browser_evaluate|mcp__playwright__browser_run_code', {
    function: '() => google.script.run.executeTestDataPurge_APPLY()',
  }), 'deny');
});

test('Agent configuration is committed to the repository index', () => {
  const tracked = [
    '.codex/config.toml', '.codex/hooks.json', '.codex/rules/production.rules',
    '.codex/run-claude-guard.mjs', '.codex/run-claude-guard.ps1',
    'scripts/test-agent-surface-sync.mts',
    ...skillNames(CODEX_SKILLS).map((name) => `.agents/skills/${name}/SKILL.md`),
  ];
  for (const target of tracked) {
    const result = spawnSync('git', ['ls-files', '--error-unmatch', target], { cwd: ROOT });
    assert.equal(result.status, 0, `${target} must be tracked`);
  }
  assert.equal(execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, encoding: 'utf8' }).trim(), 'true');
});
