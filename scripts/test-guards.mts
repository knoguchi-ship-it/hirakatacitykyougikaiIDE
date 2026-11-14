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
const HOOKS = process.env.GUARD_TEST_HOOKS || path.join(ROOT, '.claude', 'hooks');
const { CLASP_PROJECTS, PUSH_MARKER, projectFilesHash } =
  await import(pathToFileURL(path.join(ROOT, 'scripts', 'release-config.mjs')).href);
const shared = await import(pathToFileURL(path.join(HOOKS, 'hook-shared.mjs')).href);
const { handoffPendingPath } = await import(pathToFileURL(path.join(HOOKS, 'handoff-state.mjs')).href);

// 記録（.tmp/*.json）は一時ディレクトリへ。本物の記録には触れない
const STATE = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-state-'));
fs.mkdirSync(path.join(STATE, '.tmp'));
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();

function writeState(name: string, value: unknown) {
  fs.writeFileSync(path.join(STATE, name), JSON.stringify(value), 'utf8');
}
function clearState() {
  for (const f of fs.readdirSync(path.join(STATE, '.tmp'))) fs.rmSync(path.join(STATE, '.tmp', f), { recursive: true, force: true });
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

test('★1 つのコマンドで commit してから push するのは拒否（判定は実行前の HEAD を見るため、2026-10-22 に未検証の HEAD が push された）', () => {
  writeState(path.join('.tmp', 'prerelease-ok.json'), { head: HEAD });
  assert.equal(bash('git commit -m x && npm run prerelease; git push origin main'), 'deny');
  assert.equal(bash('git add a && git commit -q -F - <<EOF\nmsg\nEOF\ngit push -q origin main'), 'deny');
  assert.equal(bash('git pull --rebase && git push'), 'deny');
  // push の後に commit するのは判定に影響しない。commit だけ・push だけは従来どおり
  assert.equal(bash('git push origin main && git commit -m x'), 'none');
  assert.equal(bash('git commit -m x'), 'none');
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
  // 2026-10-19: 第 1 引数の文字列（実際の呼び方）も読む
  assert.equal(browser("() => google.script.run.processApiRequest('getTrainingManagementData', null)"), 'none');
  assert.equal(browser('() => google.script.run.processApiRequest("getTrainingRosterDetail", JSON.stringify({ trainingId: "T1" }))'), 'none');
  assert.equal(browser("() => google.script.run.processApiRequest('saveTraining', '{}')"), 'ask');
  // 読める呼び出しと変数で渡す呼び出しが混ざっていたら ask
  assert.equal(browser("(a) => { google.script.run.processApiRequest('getX', null); google.script.run.processApiRequest(a, null); }"), 'ask');
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

// ── H8: 機能のコードを含むコミットは Spec: 行が要る（2026-11-01・Skill /spec-sync）──────────────
// 本物のリポジトリの索引を汚さないよう、一時リポジトリで試す（判定の部品 scripts/spec-trailer.mjs を写す）
function tempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-spec-'));
  const g = (...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...a], { cwd: dir, encoding: 'utf8' });
  g('init', '-q');
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(path.join(ROOT, 'scripts', 'spec-trailer.mjs'), path.join(dir, 'scripts', 'spec-trailer.mjs'));
  g('add', '.');
  g('commit', '-q', '-m', 'init');
  const write = (rel: string) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), 'x', 'utf8');
  };
  return { dir, g, write };
}

test('H8: 機能のコードを含むコミットは Spec 行が無いと拒否し、書式どおりなら通す', () => {
  const { dir, g, write } = tempRepo();
  write('gas-src/Code.full.gs');
  g('add', 'gas-src/Code.full.gs');
  assert.equal(bash('git commit -m "fix"', dir), 'deny', 'Spec 行なし');
  assert.equal(bash('git commit -m "fix\n\nSpec: 不要"', dir), 'deny', '理由のない不要');
  assert.equal(bash('git commit -m "fix\n\nSpec: docs/316 を更新"', dir), 'deny', '仕様書ではない');
  assert.equal(bash('git commit -m "fix\n\nSpec: docs/spec/02_RD.md §2-4 を更新"', dir), 'none');
  assert.equal(bash('git commit -q -m "fix\n\nSpec: 不要（内部の整理だけ）\n\nCo-Authored-By: x"', dir), 'none');
  assert.equal(bash("git commit -F - <<'EOF'\nfix\n\nSpec: 不要（内部の整理だけ）\nEOF", dir), 'none', 'ヒアドキュメントの本文も読む');
  assert.equal(bash('git commit --no-verify -m "fix\n\nSpec: 不要（内部の整理だけ）"', dir), 'deny', '確認の飛ばしは拒否');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('H8: 同じコマンドの git add で足す機能のコードも見る。生成物・文書だけのコミットは止めない', () => {
  const { dir, g, write } = tempRepo();
  write('src/App.tsx');
  assert.equal(bash('git add src/App.tsx && git commit -m "fix"', dir), 'deny', 'add と commit を 1 コマンドで');
  assert.equal(bash('git add -A && git commit -m "fix"', dir), 'deny', 'add -A');
  assert.equal(bash('git commit -am "fix"', dir), 'none', '-a は追跡済みの変更だけ（未追跡の src は入らない）');
  write('backend/Code.gs');
  write('docs/spec/02_RD.md');
  g('add', 'backend/Code.gs', 'docs/spec/02_RD.md');
  assert.equal(bash('git commit -m "build"', dir), 'none', '生成物・文書だけ');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('H8: MCP の git_commit にも同じ判定を当てる', () => {
  const { dir, g, write } = tempRepo();
  write('gas-src/Code.full.gs');
  assert.equal(run('guard-bash.mjs', { message: 'fix', filesToStage: ['gas-src/Code.full.gs'] }, dir), 'deny');
  assert.equal(run('guard-bash.mjs', { message: 'fix\n\nSpec: 不要（内部の整理だけ）', filesToStage: ['gas-src/Code.full.gs'] }, dir), 'none');
  assert.equal(run('guard-bash.mjs', { message: 'fix\n\nSpec: 不要（内部の整理だけ）', noVerify: true }, dir), 'deny');
  g('add', 'gas-src/Code.full.gs');
  assert.equal(run('guard-bash.mjs', { message: 'fix' }, dir), 'deny', '既に索引にある');
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── H9: ハンドオフの指示 → レビューが通るまで返答を終えさせない（2026-11-01・Skill /handoff 1.5）──────────────
function hookRaw(hook: string, input: Record<string, unknown>) {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], {
    input: JSON.stringify({ cwd: ROOT, session_id: 'sess-1', ...input }),
    env: { ...process.env, GUARD_STATE_ROOT: STATE },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `${hook} が異常終了: ${r.stderr}`);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}
const PENDING_FILE = handoffPendingPath(STATE, 'sess-1');
const LEGACY_PENDING_FILE = handoffPendingPath(STATE);
const REVIEW_FILE = path.join(STATE, '.tmp', 'handoff-review-ok.json');
const CLEAN_REPO = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-clean-'));
execFileSync('git', ['init', '-q'], { cwd: CLEAN_REPO });
execFileSync('git', ['-c', 'user.name=Hook Test', '-c', 'user.email=hook@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture'], { cwd: CLEAN_REPO });
const CLEAN_HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: CLEAN_REPO, encoding: 'utf8' }).trim();
const prompt = (text: string) => hookRaw('guard-handoff-prompt.mjs', { prompt: text });
const stop = (over: Record<string, unknown> = {}) => hookRaw('guard-handoff-stop.mjs', { stop_hook_active: false, cwd: CLEAN_REPO, ...over });

test('H9: 依頼の形のハンドオフ指示だけに印を付け、話題にしているだけの発言では付けない', () => {
  for (const text of ['ハンドオフ', 'ハンドオフしてください', '引き継ぎをお願いします', '引継ぎお願い', '/handoff', '/handoff 今日の分', 'まとめて閉じて', 'ここで区切りましょう']) {
    clearState();
    const out = prompt(text);
    assert.ok(fs.existsSync(PENDING_FILE), `印が付かない: ${text}`);
    assert.match(out.hookSpecificOutput.additionalContext, /handoff:review/, text);
  }
  for (const text of ['レビューはハンドオフの指示があった時に必ず走らせる', '引継ぎ作業がなされるときとみなしているが', '引き継ぎを強制する仕組み', 'ハンドオフについて教えて', '/handoffx', '研修の受付を区切る']) {
    clearState();
    assert.equal(prompt(text), null, text);
    assert.ok(!fs.existsSync(PENDING_FILE), `印が付いた: ${text}`);
  }
});

test('H9: 引用・コード・否定・条件文は除外し、独立した直接依頼を拾う', () => {
  for (const text of ['ハンドオフしないでください', 'ハンドオフしてくださいと言われた場合',
    '「ハンドオフしてください」の条件を変更して', '> ハンドオフしてください',
    '```text\nハンドオフしてください\n```', '~~~text\n/handoff\n~~~',
    'ハンドオフをお願いしないでください', 'ここで区切らないでください', 'ハンドオフしてもよいですか？']) {
    clearState();
    assert.equal(prompt(text), null, text);
    assert.ok(!fs.existsSync(PENDING_FILE), text);
  }
  for (const text of ['では、ハンドオフしてください。', '作業内容です。\n引き継ぎをお願いします',
    '```\n/handoff\n```\nハンドオフしてください', '$handoff 今日の分']) {
    clearState();
    assert.ok(prompt(text)?.hookSpecificOutput, text);
  }
});

test('H9: 入れ子や短いフェンス・言語指定ではコードブロックを閉じない', () => {
  for (const text of ['````markdown\n```\nハンドオフしてください\n```\n````',
    '~~~~text\n~~~\n/handoff\n~~~~', '```markdown\n```text\nハンドオフしてください\n```']) {
    clearState();
    assert.equal(prompt(text), null, text);
    assert.ok(!fs.existsSync(PENDING_FILE));
  }
  clearState();
  assert.ok(prompt('````markdown\n```\n例\n```\n````\nハンドオフしてください'));
});

test('H9: 複数セッションの印・ブロック回数・終了は独立する', () => {
  clearState();
  const request = (id: string) => hookRaw('guard-handoff-prompt.mjs', { prompt: '/handoff', session_id: id });
  const fileA = handoffPendingPath(STATE, 'session-A');
  const fileB = handoffPendingPath(STATE, 'session-B');
  request('session-A');
  request('session-B');
  assert.ok(fs.existsSync(fileA));
  assert.ok(fs.existsSync(fileB));
  assert.equal(stop({ session_id: 'session-A' }).decision, 'block');
  assert.equal(stop({ session_id: 'session-B' }).decision, 'block');
  assert.equal(stop({ session_id: 'session-A' }).decision, 'block');
  assert.equal(JSON.parse(fs.readFileSync(fileA, 'utf8')).blocks, 2);
  assert.equal(JSON.parse(fs.readFileSync(fileB, 'utf8')).blocks, 1);
  assert.match(stop({ session_id: 'session-A' }).systemMessage, /operator|判断/);
  assert.ok(!fs.existsSync(fileA));
  assert.ok(fs.existsSync(fileB), 'Aの終了でBを消さない');
  assert.equal(stop({ session_id: 'session-C' }), null, '依頼していない会話は止めない');
  writeState(path.relative(STATE, fileB), { sessionId: 'session-B', at: Date.now() - 25 * 3600 * 1000, blocks: 1 });
  assert.equal(stop({ session_id: 'session-B' }), null, '期限切れは自分だけ解除');
  assert.ok(!fs.existsSync(fileB));
  assert.ok(!fs.existsSync(path.dirname(fileB)), '空のディレクトリは残さない');
});

test('H9: 印が無ければ何もしない。印があってレビューの記録が無ければ戻し、2 回戻したら operator に渡す', () => {
  clearState();
  assert.equal(stop(), null, '印なし');
  prompt('ハンドオフ');
  assert.equal(stop().decision, 'block', '1 回目');
  assert.equal(stop({ stop_hook_active: true }).decision, 'block', '2 回目');
  const third = stop({ stop_hook_active: true });
  assert.equal(third.decision, undefined, '3 回目は止めない');
  assert.match(third.systemMessage, /operator|判断/);
  assert.ok(!fs.existsSync(PENDING_FILE), '印は消える');
});

test('H9: この HEAD で指示の後にレビューが通っていれば終えてよい。HEAD が変わった・指示より古い記録は認めない', () => {
  clearState();
  prompt('ハンドオフ');
  const pendingAt = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8')).at;
  fs.writeFileSync(REVIEW_FILE, JSON.stringify({ head: '0'.repeat(40), at: pendingAt + 1 }), 'utf8');
  assert.equal(stop().decision, 'block', '別の HEAD の記録');
  fs.writeFileSync(REVIEW_FILE, JSON.stringify({ head: CLEAN_HEAD, at: pendingAt - 1 }), 'utf8');
  assert.equal(stop().decision, 'block', '指示より古い記録');
  fs.writeFileSync(REVIEW_FILE, JSON.stringify({ head: CLEAN_HEAD, at: pendingAt + 1 }), 'utf8');
  assert.equal(stop(), null, 'レビュー済み');
  assert.ok(!fs.existsSync(PENDING_FILE), '印は消える');
});

test('H9: 別の会話・24 時間より古い印では止めない', () => {
  clearState();
  writeState('.tmp/handoff-pending.json', { sessionId: 'other', at: Date.now(), blocks: 0 });
  assert.equal(stop(), null, '別の会話');
  assert.ok(fs.existsSync(LEGACY_PENDING_FILE), '別の会話の印を消さない');
  writeState('.tmp/handoff-pending.json', { sessionId: 'sess-1', at: Date.now() - 25 * 3600 * 1000, blocks: 0 });
  assert.equal(stop(), null, '古い印');
});

test('H9: レビュー済みHEADでも未追跡・未コミットの変更があれば止める', () => {
  clearState();
  prompt('ハンドオフ');
  const pendingAt = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8')).at;
  writeState('.tmp/handoff-review-ok.json', { head: CLEAN_HEAD, at: pendingAt + 1 });
  const changed = path.join(CLEAN_REPO, 'changed.txt');
  fs.writeFileSync(changed, 'change', 'utf8');
  try {
    assert.match(stop().reason, /未コミット|未追跡/);
    execFileSync('git', ['add', 'changed.txt'], { cwd: CLEAN_REPO });
    assert.equal(stop().decision, 'block', 'stage済みでも再確認');
  } finally {
    if (spawnSync('git', ['ls-files', '--error-unmatch', 'changed.txt'], { cwd: CLEAN_REPO }).status === 0) {
      execFileSync('git', ['rm', '--cached', 'changed.txt'], { cwd: CLEAN_REPO });
    }
    fs.rmSync(changed);
  }
  assert.equal(stop(), null, 'クリーンに戻せば終了できる');
});

test('H9: handoff:review は通らなければレビュー済みの記録を書かない（消す）', () => {
  clearState();
  writeState('.tmp/handoff-review-ok.json', { head: HEAD, at: Date.now() });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-review-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'HANDOVER.md'), '# x\n', 'utf8');
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'handoff-review.mjs')], {
    env: { ...process.env, GUARD_STATE_ROOT: STATE, HANDOFF_REVIEW_ROOT: dir }, encoding: 'utf8',
  });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /今日の日付|未追跡/);
  assert.ok(!fs.existsSync(REVIEW_FILE), '通らなかったのに記録が残っている');
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── H10: 起動時、直前が別の担当なら担当交代レビュー（提案のみ）を指示する（2026-11-02・Skill /cross-review）──────────────
function crossReview(agent: string, ...args: string[]) {
  const r = spawnSync(process.execPath, [path.join(HOOKS, 'guard-cross-agent-review.mjs'), agent, ...args], {
    input: JSON.stringify({ source: 'startup' }), env: { ...process.env, GUARD_STATE_ROOT: STATE }, encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext as string : null;
}
const ACTIVITY = path.join(STATE, '.tmp', 'agent-activity.json');

test('H10: 初回・直前が自分なら何も出さず、自分を記録する', () => {
  clearState();
  assert.equal(crossReview('claude'), null, '初回');
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).agent, 'claude');
  assert.equal(crossReview('claude'), null, '直前が自分');
  assert.equal(crossReview('unknown'), null, '知らない担当名では何もしない');
});

test('H10: 直前が相手ならレビューを指示する（範囲・件数・修正しない・重要度別）', () => {
  clearState();
  const base = execFileSync('git', ['rev-parse', 'HEAD~2'], { cwd: ROOT, encoding: 'utf8' }).trim();
  writeState('.tmp/agent-activity.json', { agent: 'codex', fromHead: base, at: '2026-11-02T00:00:00Z' });
  const ctx = crossReview('claude')!;
  assert.match(ctx, /Codex:/);
  assert.match(ctx, new RegExp(`${base.slice(0, 8)}\\.\\.${HEAD.slice(0, 8)}（2 件）`));
  assert.match(ctx, /修正・コミット・本番操作はしない/);
  assert.match(ctx, /重大／高／中／低/);
  assert.match(ctx, /cross-review/);
  assert.match(ctx, /説明・読み取り調査は止めず/);
  assert.match(ctx, /変更前.*関連範囲と依存先/);
  assert.doesNotMatch(ctx, /最初の依頼に取りかかる前|指示を待つ/);
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).pending.agent, 'codex', '通知だけでは未レビューの作業を消さない');
  assert.match(crossReview('claude')!, new RegExp(`Codex:.*${base.slice(0, 8)}\.\.`), '再起動でも同じ範囲で通知する');
  crossReview('claude', '--ack');
  const acked = JSON.parse(fs.readFileSync(ACTIVITY, 'utf8'));
  assert.equal(acked.agent, 'claude', 'レビュー後に記録する');
  assert.equal(acked.pending, null, 'レビュー後は未レビューを消す');
  assert.equal(crossReview('claude'), null);
  writeState('.tmp/agent-activity.json', { agent: 'codex', fromHead: '0'.repeat(40), at: '2026-11-02T00:00:00Z' });
  assert.match(crossReview('claude')!, /範囲 不明.*git log --since/, '記録の HEAD が履歴に無いときは日時で引くよう指示');
});

function crossFixture() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-cross-'));
  const hooks = path.join(repo, '.claude', 'hooks');
  fs.mkdirSync(hooks, { recursive: true });
  const script = path.join(hooks, 'guard-cross-agent-review.mjs');
  fs.copyFileSync(path.join(HOOKS, 'guard-cross-agent-review.mjs'), script);
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  const commit = () => {
    git('add', '.');
    git('-c', 'user.name=Hook Test', '-c', 'user.email=hook@example.invalid', 'commit', '-qm', 'fixture');
    return git('rev-parse', 'HEAD');
  };
  git('init', '-q');
  const base = commit();
  const invoke = (agent: string, ...args: string[]) => {
    const r = spawnSync(process.execPath, [script, agent, ...args], {
      env: { ...process.env, GUARD_STATE_ROOT: STATE }, encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : null;
  };
  return { repo, base, commit, invoke };
}

test('H10: 未確認範囲を保持し、変更なしの往復は通知せず、未コミット差分は通知する', () => {
  clearState();
  const { repo, commit, invoke } = crossFixture();
  invoke('claude');
  fs.writeFileSync(path.join(repo, 'work.txt'), 'previous');
  const end = commit();
  assert.match(invoke('codex'), /ClaudeCode:/);
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).fromHead, end);
  assert.match(invoke('codex'), /ClaudeCode:/, '未確認なら再起動でも通知');
  assert.equal(invoke('claude'), null, '変更なしの担当への交代は通知しない');
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).pendingReviews.length, 1, '元の保留は消えない');
  assert.match(invoke('codex'), /ClaudeCode:/, '元の未確認範囲を再通知');
  fs.writeFileSync(path.join(repo, 'work.txt'), 'uncommitted');
  assert.match(invoke('claude'), /Codex:.*0 件.*未コミット 1 件/, 'コミット0でも実際の差分を通知');
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).pendingReviews.length, 2);
  invoke('claude', '--ack');
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).pendingReviews.length, 1);
  assert.match(invoke('codex'), /ClaudeCode:/, '自分の過去の未確認範囲はackで消さない');
});

test('H10: 変更0件なら通知せず、終点を固定し、説明だけの往復でも未確認範囲を失わない', () => {
  clearState();
  const { repo, base, commit, invoke } = crossFixture();
  assert.equal(invoke('claude'), null);
  assert.equal(invoke('codex'), null, '担当が変わっても変更0なら通知しない');
  assert.equal(invoke('claude'), null, '説明だけの往復でも通知しない');
  writeState('.tmp/agent-activity.json', {
    agent: 'claude', fromHead: base, at: '2026-11-14T00:00:00Z',
    pending: { agent: 'claude', fromHead: base, at: '2026-11-14T00:00:00Z' },
  });
  assert.equal(invoke('codex'), null, '旧形式の変更0件の保留も通知しない');
  assert.equal(invoke('claude'), null);
  fs.writeFileSync(path.join(repo, 'work.txt'), 'previous');
  const end = commit();
  assert.match(invoke('codex'), /ClaudeCode:/);
  let state = JSON.parse(fs.readFileSync(ACTIVITY, 'utf8'));
  assert.equal(state.pending.fromHead, base);
  assert.equal(state.pending.toHead, end);
  fs.writeFileSync(path.join(repo, 'work.txt'), 'mine');
  const own = commit();
  invoke('codex');
  state = JSON.parse(fs.readFileSync(ACTIVITY, 'utf8'));
  assert.equal(state.pending.toHead, end, '自分のコミットを相手の範囲へ加えない');
  assert.notEqual(end, own);
  invoke('claude');
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).pendingReviews.length, 2);
  invoke('claude', '--ack');
  assert.match(invoke('codex'), /ClaudeCode:/, '確認していない元の範囲は残る');
});

test('H10: 記録が壊れていればエラーで知らせ、記録を書き換えない', () => {
  clearState();
  writeState('.tmp/agent-activity.json', { agent: 'someone', fromHead: HEAD, at: 'x' });
  const r = spawnSync(process.execPath, [path.join(HOOKS, 'guard-cross-agent-review.mjs'), 'claude'], {
    input: '{}', env: { ...process.env, GUARD_STATE_ROOT: STATE }, encoding: 'utf8',
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /担当交代の確認に失敗/);
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).agent, 'someone');
});

test('.claude/hooks の hook はすべて settings.json に登録されている', () => {
  const settings = fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8');
  const hooks = fs.readdirSync(HOOKS).filter((f) => f.startsWith('guard-') && f.endsWith('.mjs'));
  assert.ok(hooks.length >= 3);
  for (const h of hooks) assert.ok(settings.includes(`/.claude/hooks/${h}`), `${h} が settings.json に無い`);
});

process.on('exit', () => fs.rmSync(STATE, { recursive: true, force: true }));
