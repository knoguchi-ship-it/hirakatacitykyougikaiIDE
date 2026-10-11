/**
 * PreToolUse hook（.claude/hooks/）を実際に起動して、止めるべきものを止め、通すべきものを通すかを確かめる（2026-10-11 新設）。
 *
 * hook は**普段は何も言わない**ので、壊れても気づかない（判断に失敗したら通す設計＝fail-open）。
 * 気づくのは事故の後になる。それを防ぐため、ここで入力 → 判断を突き合わせる。
 *
 * あわせて、hook と release スクリプトが頼っている定義（固定 deployment の ID・書き込み関数の一覧・
 * 読むだけの action 接頭辞）が実物とずれていないかを確かめる。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS = path.join(ROOT, '.claude', 'hooks');
const { CLASP_PROJECTS, PUSH_MARKER, projectFilesHash } =
  await import(pathToFileURL(path.join(ROOT, 'scripts', 'release-config.mjs')).href);
const shared = await import(pathToFileURL(path.join(HOOKS, 'hook-shared.mjs')).href);

// 記録（.tmp/*.json）は一時ディレクトリへ。本物の記録には触れない
const STATE = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-state-'));
fs.mkdirSync(path.join(STATE, '.tmp'));
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();

function writeState(name: string, value: unknown) {
  fs.writeFileSync(path.join(STATE, name), JSON.stringify(value), 'utf8');
}
function clearState() {
  for (const f of fs.readdirSync(path.join(STATE, '.tmp'))) fs.rmSync(path.join(STATE, '.tmp', f));
}

function run(hook: string, toolInput: Record<string, unknown>, cwd = ROOT): string {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], {
    input: JSON.stringify({ tool_input: toolInput, cwd }),
    env: { ...process.env, GUARD_STATE_ROOT: STATE },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `${hook} が異常終了: ${r.stderr}`);
  if (!r.stdout.trim()) return 'none';
  return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision;
}
const bash = (command: string, cwd = ROOT) => run('guard-bash.mjs', { command }, cwd);
const browser = (fn: string) => run('guard-browser.mjs', { function: fn });

function writePushMarker(override: Record<string, string> = {}) {
  const projects: Record<string, { hash: string }> = {};
  for (const p of CLASP_PROJECTS) projects[p.key] = { hash: override[p.key] || projectFilesHash(ROOT, p) };
  writeState(PUSH_MARKER, { head: HEAD, projects });
}

// ── H1 / H2: clasp deploy・直接の push ──────────────────────
test('clasp deploy は拒否。文書・コミット文（ヒアドキュメント）に書くのは止めない', () => {
  assert.equal(bash('npx clasp deploy'), 'deny');
  assert.equal(bash('cd gas/admin && timeout 300 npx clasp create-deployment'), 'deny');
  assert.equal(bash("git commit -F - <<'EOF'\nnpx clasp deploy は禁止\nEOF"), 'none');
});

test('clasp push を直接打つと拒否（npm run release:push を使う）', () => {
  assert.equal(bash('cd gas/admin && npx clasp push -f'), 'deny');
  assert.equal(bash('npx clasp push -f'), 'deny');
});

// ── H4: 本番 DB を変えうる clasp run ──────────────────────
test('書き込みうる clasp run は ask・読むだけ（_LOG）と管理 split 外の関数は通す', () => {
  assert.equal(bash('npx clasp run executeTestDataPurge_APPLY'), 'ask');
  assert.equal(bash('npx clasp run seedDemoData'), 'ask');
  assert.equal(bash('npx clasp run dryRunApplicationScenarios'), 'ask'); // 名前に反して本番に書く
  assert.equal(bash('npx clasp run previewTestDataPurge_LOG'), 'none');
  assert.equal(bash('npx clasp run healthCheck'), 'none');
});

// ── H5: create-version は push の記録と一致するときだけ ──────────────
test('push の記録が無いと create-version は拒否', () => {
  clearState();
  assert.equal(bash('cd gas/admin && npx clasp create-version "x"'), 'deny');
});

test('3 つとも記録と一致すれば通す（どのプロジェクトからでも）', () => {
  clearState();
  writePushMarker();
  assert.equal(bash('npx clasp create-version "x"'), 'none');
  assert.equal(bash('cd gas/member && npx clasp create-version "x"'), 'none');
  assert.equal(bash('npx clasp create-version "x"', path.join(ROOT, 'gas', 'admin')), 'none');
});

test('1 つでも記録と違えば拒否（admin の push 失敗に気づかず版を作った 2026-10-10 の再現）', () => {
  clearState();
  writePushMarker({ admin: 'push-failed' });
  assert.equal(bash('cd gas/member && npx clasp create-version "x"'), 'deny');
});

test('どのプロジェクトか分からない場所での create-version は拒否', () => {
  clearState();
  writePushMarker();
  assert.equal(bash('cd scripts && npx clasp create-version "x"'), 'deny');
});

// ── H3: git push ──────────────────────
test('prerelease 未通過・HEAD 不一致の git push は拒否、一致すれば通す', () => {
  clearState();
  assert.equal(bash('git push origin main'), 'deny');
  writeState(path.join('.tmp', 'prerelease-ok.json'), { head: '0000000' });
  assert.equal(bash('git push origin main'), 'deny');
  writeState(path.join('.tmp', 'prerelease-ok.json'), { head: HEAD });
  assert.equal(bash('git push origin main'), 'none');
  assert.equal(bash('git push --dry-run'), 'none');
});

test('サブディレクトリから push しても、リポジトリ直下の記録を見る（2026-10-11 に cwd 相対で誤拒否していた）', () => {
  writeState(path.join('.tmp', 'prerelease-ok.json'), { head: HEAD });
  assert.equal(bash('git push origin main', path.join(ROOT, 'gas', 'admin')), 'none');
});

// ── B1 / B2: ブラウザから google.script.run ──────────────────────
test('ブラウザから書き込みうる関数を呼ぶと ask・_LOG は通す', () => {
  assert.equal(browser('() => new Promise(r => google.script.run.withSuccessHandler(r).executeTestDataPurge_APPLY())'), 'ask');
  assert.equal(browser('() => new Promise(r => google.script.run.withSuccessHandler(r).previewTestDataPurge_LOG())'), 'none');
});

test('processApiRequest は読むだけの action なら通し、それ以外・読めないものは ask', () => {
  assert.equal(browser("() => google.script.run.processApiRequest({ action: 'getAdminDashboardData' })"), 'none');
  assert.equal(browser("() => google.script.run.processApiRequest(JSON.stringify({ action: 'listRoles' }))"), 'none');
  assert.equal(browser("() => google.script.run.processApiRequest({ action: 'approveAdminChangeRequest', id: 1 })"), 'ask');
  assert.equal(browser('(p) => google.script.run.processApiRequest(p)'), 'ask');
});

test('google.script.run を使わない evaluate は判断しない', () => {
  assert.equal(browser('() => document.title'), 'none');
});

// ── 資格情報ファイル ──────────────────────
test('資格情報ファイルへの書き込みは拒否・通常のファイルは通す', () => {
  assert.equal(run('guard-write.mjs', { file_path: path.join(ROOT, '.env.test') }), 'deny');
  assert.equal(run('guard-write.mjs', { file_path: path.join(ROOT, 'gas', 'admin', '.clasp.json') }), 'deny');
  assert.equal(run('guard-write.mjs', { file_path: path.join(ROOT, '.env.example') }), 'none');
  assert.equal(run('guard-write.mjs', { file_path: path.join(ROOT, 'docs', 'x.md') }), 'none');
});

// ── 定義のずれ ──────────────────────
test('固定 deployment の ID が docs/09 の表と一致する', () => {
  const doc = fs.readFileSync(path.join(ROOT, 'docs', '09_DEPLOYMENT_POLICY.md'), 'utf8');
  const section = doc.slice(doc.indexOf('## 2. Fixed Deployment IDs'), doc.indexOf('## 3.'));
  const inDoc = [...section.matchAll(/`(AKfycb[\w-]+)`/g)].map((m) => m[1]).sort();
  const inConfig = CLASP_PROJECTS.flatMap((p: { deployments: string[] }) => p.deployments).sort();
  assert.deepEqual(inDoc, inConfig);
  assert.equal(inConfig.length, 4, '固定 deployment は 4 本');
});

test('hook が名指しする書き込み関数が gas-src に実在し、読むだけの接頭辞を gas-src から読める', () => {
  const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');
  const missing = shared.EXPLICIT_WRITE_FUNCTIONS.filter((n: string) => !new RegExp(`function ${n}\\s*\\(`).test(gas));
  assert.deepEqual(missing, []);
  const prefixes = shared.loadReadActionPrefixes(ROOT);
  assert.ok(prefixes.includes('get') && prefixes.includes('list'), `接頭辞を読めない: ${prefixes}`);
  assert.ok(!prefixes.some((p: string) => /^(save|delete|update|approve|send|execute)/.test(p)), '書き込みの接頭辞が混じっている');
});

test('.claude/hooks の hook はすべて settings.json に登録されている', () => {
  const settings = fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8');
  const hooks = fs.readdirSync(HOOKS).filter((f) => f.startsWith('guard-') && f.endsWith('.mjs'));
  assert.ok(hooks.length >= 3);
  for (const h of hooks) assert.ok(settings.includes(`/.claude/hooks/${h}`), `${h} が settings.json に無い`);
});

process.on('exit', () => fs.rmSync(STATE, { recursive: true, force: true }));
