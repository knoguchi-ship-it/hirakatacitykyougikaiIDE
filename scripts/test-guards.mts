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
const PENDING_FILE = path.join(STATE, '.tmp', 'handoff-pending.json');
const REVIEW_FILE = path.join(STATE, '.tmp', 'handoff-review-ok.json');
const prompt = (text: string) => hookRaw('guard-handoff-prompt.mjs', { prompt: text });
const stop = (over: Record<string, unknown> = {}) => hookRaw('guard-handoff-stop.mjs', { stop_hook_active: false, ...over });

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
  fs.writeFileSync(REVIEW_FILE, JSON.stringify({ head: HEAD, at: pendingAt - 1 }), 'utf8');
  assert.equal(stop().decision, 'block', '指示より古い記録');
  fs.writeFileSync(REVIEW_FILE, JSON.stringify({ head: HEAD, at: pendingAt + 1 }), 'utf8');
  assert.equal(stop(), null, 'レビュー済み');
  assert.ok(!fs.existsSync(PENDING_FILE), '印は消える');
});

test('H9: 別の会話・24 時間より古い印では止めない', () => {
  clearState();
  writeState('.tmp/handoff-pending.json', { sessionId: 'other', at: Date.now(), blocks: 0 });
  assert.equal(stop(), null, '別の会話');
  writeState('.tmp/handoff-pending.json', { sessionId: 'sess-1', at: Date.now() - 25 * 3600 * 1000, blocks: 0 });
  assert.equal(stop(), null, '古い印');
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
  assert.match(ctx, /直前は Codex/);
  assert.match(ctx, new RegExp(`${base.slice(0, 8)}\\.\\.${HEAD.slice(0, 8)}（2 件）`));
  assert.match(ctx, /修正・コミット・本番操作はしない/);
  assert.match(ctx, /重大／高／中／低/);
  assert.match(ctx, /cross-review/);
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).pending.agent, 'codex', '通知だけでは未レビューの作業を消さない');
  assert.match(crossReview('claude')!, new RegExp(`直前は Codex.*${base.slice(0, 8)}\.\.`), '再起動でも同じ範囲で通知する');
  crossReview('claude', '--ack');
  const acked = JSON.parse(fs.readFileSync(ACTIVITY, 'utf8'));
  assert.equal(acked.agent, 'claude', 'レビュー後に記録する');
  assert.equal(acked.pending, null, 'レビュー後は未レビューを消す');
  assert.equal(crossReview('claude'), null);
  writeState('.tmp/agent-activity.json', { agent: 'codex', fromHead: '0'.repeat(40), at: '2026-11-02T00:00:00Z' });
  assert.match(crossReview('claude')!, /範囲 不明.*git log --since/, '記録の HEAD が履歴に無いときは日時で引くよう指示');
});

// 2026-11-03 是正: 相手がレビューを --ack せずに終えても、元の担当に戻ったとき相手の作業を通知する（以前は「直前も自分」で黙っていた）
test('H10: 相手がレビューを終えずに去っても、次に起動した担当に相手の作業を通知する', () => {
  clearState();
  const base = execFileSync('git', ['rev-parse', 'HEAD~2'], { cwd: ROOT, encoding: 'utf8' }).trim();
  writeState('.tmp/agent-activity.json', { agent: 'claude', fromHead: base, at: '2026-11-01T00:00:00Z' });
  assert.match(crossReview('codex')!, /直前は ClaudeCode/, 'Codex に ClaudeCode の作業を通知');
  const afterCodex = JSON.parse(fs.readFileSync(ACTIVITY, 'utf8'));
  assert.equal(afterCodex.agent, 'codex', '通知した時点で起動した担当を記録する');
  assert.equal(afterCodex.fromHead, HEAD, 'Codex の作業は起動時の HEAD から');
  assert.match(crossReview('codex')!, /直前は ClaudeCode/, 'Codex の再起動でも未レビューなら再通知');
  assert.equal(JSON.parse(fs.readFileSync(ACTIVITY, 'utf8')).fromHead, HEAD, '再起動で自分の始まりを動かさない');
  // Codex は --ack せずに終えた → ClaudeCode を起動
  const ctx = crossReview('claude');
  assert.ok(ctx, '以前の作りではここで null（直前も自分と誤認）になっていた');
  assert.match(ctx!, /直前は Codex/);
  assert.match(ctx!, new RegExp(`${HEAD.slice(0, 8)}\.\.${HEAD.slice(0, 8)}（0 件）`), '範囲は Codex の起動時から');
  assert.doesNotMatch(ctx!, /ClaudeCode の作業/, '自分の作業のレビューは指示しない');
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
