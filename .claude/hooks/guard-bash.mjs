#!/usr/bin/env node
/**
 * PreToolUse(Bash) ガード — 文章でしか守れていなかったルールを、実行前に止める。
 *
 * 契約（2026-10-02 に公式ドキュメントで確認）:
 *   - stdout に `{hookSpecificOutput:{hookEventName,permissionDecision,permissionDecisionReason}}`
 *     を出すと、`deny` で拒否・`ask` で operator へ確認が出る。終了コードは 0 でよい。
 *   - 何も出さずに exit 0 なら「判断しない」＝通常の権限フローへ。
 *   - 判断に失敗したら**通す**。ガードの不具合で作業を止めない（ここは fail-open が正しい。
 *     止めるべき操作は npm 側にも検査を置いて二重化する）。
 *
 * 設計の正本: docs/296_RULES_ARCHITECTURE_DESIGN_2026-10-02.md §3
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function deny(reason) { decide('deny', reason); }
function ask(reason) { decide('ask', reason); }
function decide(permissionDecision, permissionDecisionReason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision,
      permissionDecisionReason,
    },
  }));
  process.exit(0);
}

/**
 * ヒアドキュメントの中身を落とす。
 * 文書やコミットメッセージに `npx clasp deploy` と**書く**行為まで止めてしまうため
 * （実際に本リポジトリの docs にその文字列がある）、本文は検査対象から外す。
 */
function stripHeredocs(command) {
  const lines = String(command).split('\n');
  const out = [];
  let delimiter = null;
  for (const line of lines) {
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

/** `&&` `||` `;` `|` 改行で区切り、「コマンドの先頭に来ている語」だけを見る */
function commandSegments(command) {
  return stripHeredocs(command)
    .split(/\n|&&|\|\||;|(?<!\|)\|(?!\|)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 先頭の `npx` / 環境変数代入 / `sudo` を剥がし、残りを語の配列で返す */
function invocationTokens(segment) {
  let tokens = segment.split(/\s+/).filter(Boolean);
  while (tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0]) || tokens[0] === 'sudo')) {
    tokens = tokens.slice(1);
  }
  if (tokens[0] === 'npx') tokens = tokens.slice(1);
  return tokens;
}

// ── H4: 本番 DB を変える clasp run（deny ではなく ask）──────────────────────
// MEMORY L0「DB 全削除・全更新は必ず事前許可」。
// 限界: 管理画面経由（google.script.run）は Bash を通らないため、ここでは止まらない。
const DESTRUCTIVE_RUN_TARGETS = new Set([
  'seedDemoData',
  'rebuildDatabaseSchema',
  'deleteTestData_APPLY',
  'executeStrictE2ETestMemberCleanup_APPLY',
  'backfillKanaToFullwidth_APPLY',
  'restoreLastArchiveBatch_APPLY',
  'forceMarkSchemaInitializedToCurrent',
]);

function checkClasp(tokens) {
  if (tokens[0] !== 'clasp') return;
  const sub = tokens[1];

  // H1: 新しい deployment ID が生成され、固定 URL が変わる
  if (sub === 'deploy' || sub === 'create-deployment') {
    deny(
      '`clasp deploy` は禁止です（固定 URL が変わります）。'
      + '固定 deployment の更新は `npx clasp redeploy <deploymentId> -V <version>`、'
      + '新しい版の作成は `npx clasp create-version` を使ってください。'
      + '正本: docs/09_DEPLOYMENT_POLICY.md / MEMORY L4',
    );
  }

  // H4
  if (sub === 'run' && DESTRUCTIVE_RUN_TARGETS.has(tokens[2])) {
    ask(
      `本番 DB を変更する可能性のある関数です: ${tokens[2]}。`
      + '対象テーブルと不可逆性を operator へ明示し、承認を得てから実行してください（MEMORY L0）。',
    );
  }
}

// ── H3: ゲート未通過の push を拒否 ──────────────────────────────────────────
function checkGitPush(tokens, cwd) {
  if (tokens[0] !== 'git') return;
  const rest = tokens.slice(1);
  if (!rest.includes('push')) return;
  if (rest.includes('--dry-run') || rest.includes('-n')) return;

  let head;
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  } catch {
    return; // HEAD が取れない状況では判断しない
  }

  const markerPath = path.join(cwd, '.tmp', 'prerelease-ok.json');
  let marker = null;
  try {
    marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  } catch {
    deny(
      'この HEAD で prerelease が通っていません（成功記録が見つかりません）。'
      + '`npm run prerelease` を実行してから push してください。正本: AGENTS.md §5',
    );
  }

  if (marker.head !== head) {
    deny(
      `prerelease の成功記録が現在の HEAD と一致しません（記録: ${String(marker.head).slice(0, 8)} / `
      + `現在: ${head.slice(0, 8)}）。コミット後に \`npm run prerelease\` を実行してください。正本: AGENTS.md §5`,
    );
  }
}

// ── 入口 ────────────────────────────────────────────────────────────────────
let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const command = (input.tool_input && input.tool_input.command) || '';
    const cwd = input.cwd || process.cwd();
    for (const segment of commandSegments(command)) {
      const tokens = invocationTokens(segment);
      if (!tokens.length) continue;
      checkClasp(tokens);
      checkGitPush(tokens, cwd);
    }
  } catch {
    // ガード自身の不具合で作業を止めない
  }
  process.exit(0);
});
