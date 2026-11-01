/**
 * Prevent ClaudeCode/Codex agent-surface drift. Claude procedures are the
 * canonical source; Codex adapters must point to the same procedures.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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
  'cross-review': '# 担当交代時のレビュー\n\n実行前に、正本である `.claude/skills/cross-review/SKILL.md` を最後まで読む。その手順と報告の形をそのまま適用し、修正はしない。',
  'spec-sync': '# 仕様書の追従確認\n\n実行前に、正本である `.claude/skills/spec-sync/SKILL.md` を最後まで読む。その手順と Spec 行の書き方をそのまま適用する。',
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

// H9（2026-11-01）: Codex でもハンドオフの指示 → レビューが通るまで返答を終えさせない。
// Codex が実際に起動する形（Windows の PowerShell）で、印の付け外しを確かめる。mac・Linux は対象外（2026-11-02 operator 指示）。
function codexEventHook(event: 'UserPromptSubmit' | 'Stop', input: Record<string, unknown>, state: string) {
  const hooks = JSON.parse(fs.readFileSync(path.join(CODEX_DIR, 'hooks.json'), 'utf8'));
  const hook = hooks.hooks[event]?.[0]?.hooks?.[0];
  assert.ok(hook, `${event}: Codex hook is not configured`);
  const env = { ...process.env, GUARD_STATE_ROOT: state };
  const stdin = JSON.stringify({ cwd: ROOT, session_id: 'codex-1', ...input });
  const result = spawnSync('cmd.exe', ['/d', '/c', hook.command], { cwd: ROOT, input: stdin, encoding: 'utf8', env });
  assert.equal(result.status, 0, `Codex ${event} failed: ${result.stderr}`);
  const text = result.stdout.trim();
  return text ? JSON.parse(text) : null;
}

test('Codex: ハンドオフの指示（日本語・$handoff）で印を付け、話題だけ・ふだんの発言では付けない', () => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-handoff-'));
  const pending = path.join(state, '.tmp', 'handoff-pending.json');
  for (const prompt of ['研修の設計を見せて', 'ハンドオフについて教えて']) {
    assert.equal(codexEventHook('UserPromptSubmit', { prompt }, state), null, prompt);
    assert.ok(!fs.existsSync(pending), `印が付いた: ${prompt}`);
  }
  for (const prompt of ['ハンドオフしてください', '$handoff']) {
    fs.rmSync(pending, { force: true });
    const out = codexEventHook('UserPromptSubmit', { prompt }, state);
    assert.match(out.hookSpecificOutput.additionalContext, /handoff:review/, prompt);
    assert.ok(fs.existsSync(pending), `印が付かない: ${prompt}`);
  }
  fs.rmSync(state, { recursive: true, force: true });
});

test('Codex: 印が無ければ {} を返して止めず、印があってレビューが無ければ作業へ戻す', () => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-handoff-'));
  assert.deepEqual(codexEventHook('Stop', { stop_hook_active: false }, state), {}, '印なし');
  fs.mkdirSync(path.join(state, '.tmp'), { recursive: true });
  fs.writeFileSync(path.join(state, '.tmp', 'handoff-pending.json'), JSON.stringify({ sessionId: 'codex-1', at: Date.now(), blocks: 0 }), 'utf8');
  const out = codexEventHook('Stop', { stop_hook_active: false }, state);
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /handoff:review/);
  fs.rmSync(state, { recursive: true, force: true });
});

// H10（2026-11-02）: Codex の起動時、直前が ClaudeCode なら担当交代レビュー（提案のみ）を指示する
test('Codex: 起動時、直前が ClaudeCode ならレビューを指示し、直前が Codex 自身なら何も出さない', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(CODEX_DIR, 'hooks.json'), 'utf8'));
  const entry = hooks.hooks.SessionStart.find((e: { hooks: Array<{ command: string }> }) =>
    Buffer.from(e.hooks[0].command.split(' ').pop()!, 'base64').toString('utf16le').includes('guard-cross-agent-review.mjs'));
  assert.ok(entry, 'Codex の SessionStart に担当交代レビューが無い');
  assert.match(entry.matcher, /startup/);
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-cross-'));
  fs.mkdirSync(path.join(state, '.tmp'));
  const activity = path.join(state, '.tmp', 'agent-activity.json');
  const head = execFileSync('git', ['rev-parse', 'HEAD~1'], { cwd: ROOT, encoding: 'utf8' }).trim();
  fs.writeFileSync(activity, JSON.stringify({ agent: 'claude', fromHead: head, at: '2026-11-02T00:00:00Z' }), 'utf8');
  const run = () => spawnSync('cmd.exe', ['/d', '/c', entry.hooks[0].command], {
    cwd: ROOT, input: JSON.stringify({ source: 'startup' }), encoding: 'utf8', env: { ...process.env, GUARD_STATE_ROOT: state },
  });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const ctx = JSON.parse(first.stdout.trim()).hookSpecificOutput.additionalContext;
  assert.match(ctx, /ClaudeCode/);
  assert.match(ctx, /修正・コミット・本番操作はしない/, '日本語が化けずに届く');
  assert.match(ctx, /1 件/, 'HEAD~1..HEAD の 1 件');
  assert.equal(JSON.parse(fs.readFileSync(activity, 'utf8')).agent, 'codex', '自分を記録する');
  assert.equal(run().stdout.trim(), '', '直前が自分なら何も出さない');
  fs.rmSync(state, { recursive: true, force: true });
});

test('Agent configuration is committed to the repository index', () => {
  const tracked = [
    '.codex/config.toml', '.codex/hooks.json', '.codex/rules/production.rules',
    '.codex/run-claude-guard.mjs', '.codex/run-claude-guard.ps1', '.codex/run-handoff-hook.ps1',
    'scripts/test-agent-surface-sync.mts',
    ...skillNames(CODEX_SKILLS).map((name) => `.agents/skills/${name}/SKILL.md`),
  ];
  for (const target of tracked) {
    const result = spawnSync('git', ['ls-files', '--error-unmatch', target], { cwd: ROOT });
    assert.equal(result.status, 0, `${target} must be tracked`);
  }
  assert.equal(execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, encoding: 'utf8' }).trim(), 'true');
});
