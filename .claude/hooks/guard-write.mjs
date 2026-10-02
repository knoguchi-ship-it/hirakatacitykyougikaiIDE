#!/usr/bin/env node
/**
 * PreToolUse(Edit|Write|NotebookEdit) ガード — 資格情報ファイルへの書き込みを拒否する。
 *
 * AGENTS.md §0: テスト・開発で必要な認証情報は gitignored ファイルに**ユーザー自身が記入**する。
 * AI は書かない。これまで文章でしか守られていなかった。
 *
 * 契約と fail-open の方針は guard-bash.mjs と同じ。
 * 設計の正本: docs/296_RULES_ARCHITECTURE_DESIGN_2026-10-02.md §3.3
 */
import path from 'node:path';

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

/** テンプレートは対象外。これらは秘密を含まない前提で追跡される */
const TEMPLATE_SUFFIXES = ['.example', '.sample', '.template', '.dist'];

function isSecretFile(filePath) {
  const posix = String(filePath).replace(/\\/g, '/');
  const base = path.posix.basename(posix);

  if (TEMPLATE_SUFFIXES.some((s) => base.endsWith(s))) return null;

  // .env / .env.test / .env.production など
  if (base === '.env' || base.startsWith('.env.')) return '.env 系は資格情報ファイルです';
  // clasp の認証情報・プロジェクト紐づけ
  if (base === '.clasprc.json') return 'clasp の OAuth 認証情報です';
  if (base === '.clasp.json') return 'clasp のプロジェクト紐づけ設定です（環境ごとにユーザーが管理します）';
  // Playwright の storageState（ログイン済みセッション＝実質の資格情報）
  // 相対パス（`.test-out/...`）でも絶対パスでも拾えるよう、先頭スラッシュを必須にしない
  if (/(^|\/)\.test-out\//.test(posix) && /auth|storage[-_]?state/i.test(base)) {
    return 'Playwright の storageState はログイン済みセッションで、資格情報と同等です';
  }
  if (/storage[-_]?state.*\.json$/i.test(base)) {
    return 'Playwright の storageState はログイン済みセッションで、資格情報と同等です';
  }
  return null;
}

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const filePath = (input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path)) || '';
    if (filePath) {
      const why = isSecretFile(filePath);
      if (why) {
        deny(
          `${why}。AI はこのファイルを書きません（AGENTS.md §0）。`
          + '必要な値は operator が手で記入してください。'
          + '記入をお願いする場合は、ファイル名とキー名だけを伝え、値は会話に残さないこと。',
        );
      }
    }
  } catch {
    // ガード自身の不具合で作業を止めない
  }
  process.exit(0);
});
