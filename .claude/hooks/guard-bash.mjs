#!/usr/bin/env node
/**
 * PreToolUse(Bash) ガード — 文章でしか守れていなかったルールを、実行前に止める。
 *
 *   H1  `clasp deploy` を拒否（固定 URL が変わる）
 *   H3  prerelease 未通過の `git push` を拒否（記録はリポジトリ直下）
 *   H4  本番 DB を変えうる `clasp run` は ask
 *   H5  直接の `clasp push` を拒否 → `npm run release:push`（3 つとも成功したときだけ記録が残る）（2026-10-11）
 *   H6  push の記録と一致しないファイルでの `clasp create-version` を拒否（2026-10-11・admin @287 の再発防止）
 *   （H2 は guard-write.mjs、H7 は guard-browser.mjs）
 *
 * 共通部品と契約: ./hook-shared.mjs ／ 設計の正本: docs/296 §3 ／ 検査: npm run test:guards
 */
import { execFileSync } from 'node:child_process';
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

// H3
function checkGitPush(tokens, ctx) {
  if (tokens[0] !== 'git') return;
  const rest = tokens.slice(1);
  if (!rest.includes('push')) return;
  if (rest.includes('--dry-run') || rest.includes('-n')) return;

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

runHook(async (input) => {
  const command = (input.tool_input && input.tool_input.command) || '';
  let dir = input.cwd || process.cwd();
  let root;
  try { root = repoRoot(dir); } catch { return; } // リポジトリ外は判断しない
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
    const ctx = { root, dir };
    await checkClasp(tokens, ctx);
    checkGitPush(tokens, ctx);
  }
});
