/**
 * PreToolUse hook の共通部品（2026-10-11 に guard-bash から切り出し）。
 *
 * 契約（2026-10-02 に公式ドキュメントで確認）:
 *   - stdout に `{hookSpecificOutput:{hookEventName,permissionDecision,permissionDecisionReason}}`
 *     を出すと、`deny` で拒否・`ask` で operator へ確認が出る。終了コードは 0 でよい。
 *   - 何も出さずに exit 0 なら「判断しない」＝通常の権限フローへ。
 *   - 判断に失敗したら**通す**。ガードの不具合で作業を止めない（止めるべき操作は npm 側にも検査を置いて二重化する）。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function decide(permissionDecision, permissionDecisionReason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason },
  }));
  process.exit(0);
}
export const deny = (reason) => decide('deny', reason);
export const ask = (reason) => decide('ask', reason);

/** stdin の JSON を読んで handler(input) を呼ぶ。handler が判断しなければ「判断しない」で終わる */
export function runHook(handler) {
  let raw = '';
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', async () => {
    try {
      await handler(JSON.parse(raw || '{}'));
    } catch {
      // ガード自身の不具合で作業を止めない
    }
    process.exit(0);
  });
}

export function repoRoot(cwd) {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim();
}

/** 記録（.tmp/*.json）を読む場所。テストだけが GUARD_STATE_ROOT で差し替える */
export function stateRoot(root) {
  return process.env.GUARD_STATE_ROOT || root;
}

export function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

export async function importFromRepo(root, rel) {
  return import(pathToFileURL(path.join(root, rel)).href);
}

// ── 本番 DB を変えうる関数 ───────────────────────────────────────────────────
// MEMORY L0「DB 全削除・全更新は必ず事前許可」/ AGENTS L0.3。
// 名前が `_LOG` で終わるものは「読むだけ」の約束（docs/303・editor ▶ の命名規約）。
// それ以外の管理 split のトップレベル関数と、下の明示リストは、実行前に operator へ確認を出す。
export const EXPLICIT_WRITE_FUNCTIONS = [
  'seedDemoData',
  'rebuildDatabaseSchema',
  'forceMarkSchemaInitializedToCurrent',
  'cleanupDatabaseSheets',
];

export async function loadWriteFunctionSet(root) {
  const b = await importFromRepo(root, 'scripts/gas-boundary-utils.mjs');
  const names = new Set(EXPLICIT_WRITE_FUNCTIONS);
  for (const n of [...b.ADMIN_TOP_LEVEL_FUNCTIONS, ...b.ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS]) {
    if (n === 'doGet' || n === 'processApiRequest' || n === 'getDbInfo' || n.endsWith('_LOG')) continue;
    names.add(n);
  }
  return names;
}

/** processApiRequest の action のうち「読むだけ」の接頭辞（gas-src の PREVIEW_READ_ACTION_PREFIXES が正本） */
export function loadReadActionPrefixes(root) {
  const gas = fs.readFileSync(path.join(root, 'gas-src', 'Code.full.gs'), 'utf8');
  const m = gas.match(/var PREVIEW_READ_ACTION_PREFIXES = \[([^\]]*)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/'([A-Za-z]+)'/g)].map((x) => x[1]);
}
