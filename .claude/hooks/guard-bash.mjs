#!/usr/bin/env node
/**
 * PreToolUse(Bash) ガード — 文章でしか守れていなかったルールを、実行前に止める。
 *
 *   H1  `clasp deploy` を拒否（固定 URL が変わる）
 *   H3  prerelease 未通過の `git push` を拒否（記録はリポジトリ直下）。同じコマンドで commit 等の後の push も拒否（2026-10-22）
 *   H4  本番 DB を変えうる `clasp run` は ask
 *   H5  直接の `clasp push` を拒否 → `npm run release:push`（3 つとも成功したときだけ記録が残る）（2026-10-11）
 *   H6  push の記録と一致しないファイルでの `clasp create-version` を拒否（2026-10-11・admin @287 の再発防止）
 *   H8  機能のコード（gas-src/・src/）を含むコミットに `Spec:` 行が無ければ拒否 → Skill /spec-sync（2026-11-01）。
 *       `git commit --no-verify` も拒否。判定の正本は scripts/spec-trailer.mjs、リリース前の拾い直しは test:spec-trailer
 *   （H2 は guard-write.mjs、H7 は guard-browser.mjs）
 *
 * 共通部品と契約: ./hook-shared.mjs ／ 設計の正本: docs/296 §3 ／ 検査: npm run test:guards
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  deny, ask, runHook, repoRoot, stateRoot, readJson, importFromRepo, loadWriteFunctionSet,
} from './hook-shared.mjs';

/**
 * ヒアドキュメントの中身を落とす。
 * 文書やコミットメッセージに `npx clasp deploy` と**書く**行為まで止めてしまうため、本文は検査対象から外す。
 */
function stripHeredocs(command) {
  const out = [];
  let delimiter = null;
  for (const line of String(command).split('\n')) {
    if (delimiter !== null) {
      if (line.trim() === delimiter) delimiter = null;
      continue;
    }
    const m = line.match(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/);
    out.push(line);
    if (m) delimiter = m[2];
  }
  return out.join('\n');
}

/** `&&` `||` `;` `|` 改行で区切る */
function commandSegments(command) {
  return stripHeredocs(command)
    .split(/\n|&&|\|\||;|(?<!\|)\|(?!\|)/)
    .map((s) => s.trim().replace(/^\(+|\)+$/g, '').trim())
    .filter(Boolean);
}

/** 先頭の環境変数代入 / `sudo` / `timeout N` / `npx` を剥がし、残りを語の配列で返す */
function invocationTokens(segment) {
  let tokens = segment.split(/\s+/).filter(Boolean);
  for (;;) {
    if (tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0]) || tokens[0] === 'sudo')) tokens = tokens.slice(1);
    else if (tokens[0] === 'timeout' && /^\d/.test(tokens[1] || '')) tokens = tokens.slice(2);
    else if (tokens[0] === 'npx') tokens = tokens.slice(1);
    else break;
  }
  return tokens;
}

async function checkClasp(tokens, ctx) {
  if (tokens[0] !== 'clasp') return;
  const sub = tokens[1];

  // H1
  if (sub === 'deploy' || sub === 'create-deployment') {
    deny('`clasp deploy` は禁止です（固定 URL が変わります）。'
      + '固定 deployment の更新は `npx clasp redeploy <deploymentId> -V <version>`、'
      + '新しい版の作成は `npx clasp create-version` を使ってください。正本: docs/09_DEPLOYMENT_POLICY.md / Skill /release');
  }

  // H5
  if (sub === 'push') {
    deny('`clasp push` を直接打たないでください。`npm run release:push` が 3 プロジェクトを順に push し、'
      + '全部成功したときだけ記録を残します（create-version はその記録を確かめます）。正本: Skill /release');
  }

  // H4
  if (sub === 'run' && tokens[2]) {
    const writes = await loadWriteFunctionSet(ctx.root);
    if (writes.has(tokens[2])) {
      ask(`本番 DB を変更する可能性のある関数です: ${tokens[2]}。`
        + '対象テーブルと不可逆性を operator へ明示し、承認を得てから実行してください（AGENTS L0.3 / Skill /dbops）。');
    }
  }

  // H6
  if (sub === 'create-version' || sub === 'version') {
    const { CLASP_PROJECTS, PUSH_MARKER, projectFilesHash, projectForDir } =
      await importFromRepo(ctx.root, 'scripts/release-config.mjs');
    const project = projectForDir(ctx.root, ctx.dir);
    if (!project) {
      deny(`clasp create-version をどのプロジェクトで打つのか判別できません（${ctx.dir}）。`
        + 'リポジトリ直下（public）・gas/member・gas/admin のいずれかで実行してください。');
    }
    const marker = readJson(path.join(stateRoot(ctx.root), PUSH_MARKER));
    if (!marker || !marker.projects) {
      deny('push の成功記録がありません。先に `npm run release:push` で 3 プロジェクトとも push してください。正本: Skill /release');
    }
    const stale = CLASP_PROJECTS
      .filter((p) => !marker.projects[p.key] || marker.projects[p.key].hash !== projectFilesHash(ctx.root, p))
      .map((p) => p.key);
    if (stale.length) {
      deny(`push の記録と手元のファイルが一致しません（${stale.join(' / ')}）。`
        + 'push に失敗したか、push の後にビルドし直しています。`npm run release:push` をやり直してください。'
        + '（2026-10-10 に admin の push 失敗に気づかず古いコードの版 @287 を作った事故の再発防止）');
    }
  }
}

// H3 で HEAD を進める git の操作。同じコマンドの中で push より前にあると、実行前の HEAD での判定が意味をなさない
const HEAD_MOVING_GIT = new Set(['commit', 'merge', 'rebase', 'pull', 'cherry-pick', 'revert', 'reset', 'am', 'checkout', 'switch']);

// H3
function checkGitPush(tokens, ctx) {
  if (tokens[0] !== 'git') return;
  const rest = tokens.slice(1);
  if (HEAD_MOVING_GIT.has(rest[0])) { ctx.headMoved = true; return; }
  if (!rest.includes('push')) return;
  if (rest.includes('--dry-run') || rest.includes('-n')) return;

  // 判定はコマンドを実行する前に 1 回だけ行う。commit と push を 1 つのコマンドにすると、
  // 実行前の（検証済みの）HEAD で通り、その後にできた未検証の HEAD が push される（2026-10-22 に実際に起きた）
  if (ctx.headMoved) {
    deny('同じコマンドの中で、push の前に HEAD を進める git の操作（commit など）があります。'
      + 'commit → `npm run prerelease` → `git push` は別々のコマンドで実行してください。正本: AGENTS.md L4.3');
  }

  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ctx.dir, encoding: 'utf8' }).trim();
  // 記録はリポジトリ直下に置く（サブディレクトリから push しても同じ記録を見る）
  const marker = readJson(path.join(stateRoot(ctx.root), '.tmp', 'prerelease-ok.json'));
  if (!marker) {
    deny('この HEAD で prerelease が通っていません（成功記録が見つかりません）。'
      + '`npm run prerelease` を実行してから push してください。正本: AGENTS.md L4.3');
  }
  if (marker.head !== head) {
    deny(`prerelease の成功記録が現在の HEAD と一致しません（記録: ${String(marker.head).slice(0, 8)} / `
      + `現在: ${head.slice(0, 8)}）。コミット後に \`npm run prerelease\` を実行してください。正本: AGENTS.md L4.3`);
  }
}

const SPEC_SYNC_HELP = '仕様書（docs/spec/）の追従確認が済んでいません。Skill `/spec-sync` を実行し'
  + '（Codex は `.claude/skills/spec-sync/SKILL.md` を最後まで読んで適用）、結果をコミットメッセージの `Spec:` 行に書いてから'
  + 'コミットし直してください。例: `Spec: docs/spec/02_RD.md §2-4・BR-22 を追加` / `Spec: 不要（理由）`。'
  + '旧い記述が残ると仕様の誤認が起きるため（2026-11-01 operator 指示）。';

function gitLines(dir, args) {
  try {
    return execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
}

/** `git add …` で同じコマンドの中で足されるファイル（コミットより前の段）を覚える */
function noteGitAdd(tokens, ctx) {
  if (tokens[0] !== 'git' || tokens[1] !== 'add') return;
  const args = tokens.slice(2);
  if (args.some((a) => a === '-A' || a === '--all' || a === '.' || a === '-u' || a === '--update')) {
    ctx.addAll = true;
    return;
  }
  for (const a of args) if (!a.startsWith('-')) ctx.added.push(a.replace(/^["']|["']$/g, ''));
}

// H8
async function checkGitCommitSpec(tokens, ctx, rawCommand) {
  if (tokens[0] !== 'git' || tokens[1] !== 'commit') return;
  if (tokens.includes('--no-verify') || tokens.includes('-n')) {
    deny('`git commit --no-verify` は使わないでください（確認を飛ばすことになります）。' + SPEC_SYNC_HELP);
  }
  const spec = await importFromRepo(ctx.root, 'scripts/spec-trailer.mjs');
  // git diff / ls-files --full-name はリポジトリ直下からのパスを返す。git add の引数は打った場所からの相対パス
  const files = new Set(gitLines(ctx.dir, ['diff', '--cached', '--name-only']));
  for (const f of ctx.added) files.add(path.relative(ctx.root, path.resolve(ctx.dir, f)).split(path.sep).join('/'));
  // `git add -A` は未追跡も入る。`git commit -a` は追跡済みの変更だけ
  if (ctx.addAll || tokens.includes('-a') || tokens.includes('--all') || tokens.includes('-am')) {
    for (const f of gitLines(ctx.dir, ['diff', '--name-only'])) files.add(f);
  }
  if (ctx.addAll) {
    for (const f of gitLines(ctx.dir, ['ls-files', '--others', '--exclude-standard', '--full-name'])) files.add(f);
  }
  const functional = [...files].filter((f) => spec.isFunctionalPath(f));
  if (!functional.length) return;

  let message = rawCommand;
  const fi = tokens.findIndex((t) => t === '-F' || t === '--file');
  if (fi >= 0 && tokens[fi + 1] && tokens[fi + 1] !== '-') {
    try { message = fs.readFileSync(path.resolve(ctx.dir, tokens[fi + 1].replace(/^["']|["']$/g, '')), 'utf8'); } catch { /* 読めなければコマンド本文で判定 */ }
  }
  const found = spec.findSpecLine(message);
  if (found.problem) {
    deny(`${found.problem}（機能のコードを含むコミット: ${functional.slice(0, 5).join(', ')}${functional.length > 5 ? ' ほか' : ''}）\n` + SPEC_SYNC_HELP);
  }
}

/** MCP の git_commit（mcp__git__git_commit）にも H8 を当てる。入力は { message, filesToStage, noVerify, path } */
async function checkMcpGitCommit(input) {
  const ti = input.tool_input || {};
  let dir = input.cwd || process.cwd();
  if (ti.path && ti.path !== '.') dir = path.resolve(dir, ti.path);
  let root;
  try { root = repoRoot(dir); } catch { return; }
  if (ti.noVerify) deny('git_commit の noVerify は使わないでください（確認を飛ばすことになります）。' + SPEC_SYNC_HELP);
  const tokens = ['git', 'commit'];
  const ctx = { root, dir, added: Array.isArray(ti.filesToStage) ? ti.filesToStage.map(String) : [], addAll: false };
  await checkGitCommitSpec(tokens, ctx, String(ti.message || ''));
}

runHook(async (input) => {
  if (input.tool_input && typeof input.tool_input.message === 'string' && typeof input.tool_input.command !== 'string') {
    await checkMcpGitCommit(input);
    return;
  }
  const command = (input.tool_input && input.tool_input.command) || '';
  let dir = input.cwd || process.cwd();
  let root;
  try { root = repoRoot(dir); } catch { return; } // リポジトリ外は判断しない
  let headMoved = false;
  const gitAdd = { added: [], addAll: false };
  for (const segment of commandSegments(command)) {
    const tokens = invocationTokens(segment);
    if (!tokens.length) continue;
    // `cd X && npx clasp …` の形を追う（どのプロジェクトで打つかに効く）
    if (tokens[0] === 'cd' && tokens[1]) {
      const target = tokens[1].replace(/^["']|["']$/g, '');
      const resolved = /^\/[a-z]\//i.test(target) && process.platform === 'win32'
        ? target.replace(/^\/([a-z])\//i, '$1:/')
        : target;
      dir = path.resolve(dir, resolved);
      continue;
    }
    const ctx = { root, dir, headMoved, ...gitAdd };
    await checkClasp(tokens, ctx);
    noteGitAdd(tokens, ctx);
    gitAdd.added = ctx.added; gitAdd.addAll = ctx.addAll;
    await checkGitCommitSpec(tokens, ctx, command);
    checkGitPush(tokens, ctx);
    headMoved = ctx.headMoved;
  }
});
