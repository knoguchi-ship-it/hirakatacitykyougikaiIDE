#!/usr/bin/env node
/**
 * 引き継ぎ前のレビュー（機械で判定できる部分）— npm run handoff:review（2026-11-01 operator 指示）。
 *
 * ハンドオフの指示があると hook（guard-handoff-prompt）が印を付け、返答を終える直前に
 * hook（guard-handoff-stop）が「この HEAD でレビューが通った記録」を確かめる。
 * **記録はこのスクリプトが全項目を通したときだけ書く**（AI が自分で「済み」と書けないようにするため）。
 * 判断の項目（実装と規定の突き合わせ・未検証の書き分け）は Skill /handoff が正本。
 *
 * 記録: <リポジトリ直下>/.tmp/handoff-review-ok.json（テストは GUARD_STATE_ROOT で差し替える）
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.env.HANDOFF_REVIEW_ROOT
  || execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: path.dirname(fileURLToPath(import.meta.url)), encoding: 'utf8' }).trim();
const STATE = process.env.GUARD_STATE_ROOT || ROOT;
const MARKER = path.join(STATE, '.tmp', 'handoff-review-ok.json');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

const todayJst = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date()); // yyyy-MM-dd
const problems = [];

// 1. 作業ツリーがきれい（コミットし忘れ・未追跡ファイルを残さない）
const dirty = git('status', '--porcelain').split('\n').filter(Boolean);
if (dirty.length) problems.push(`コミットしていない変更・未追跡ファイルがあります（${dirty.length} 件）: ${dirty.slice(0, 5).join(' / ')}`);

// 2. 機能のコードを変えたコミットはすべて仕様書の追従を確かめてある（Skill /spec-sync）
try {
  const spec = await import(pathToFileURL(path.join(ROOT, 'scripts', 'spec-trailer.mjs')).href);
  const missing = await spec.findCommitsMissingSpec(ROOT);
  if (missing.length) problems.push(`仕様書の追従確認（Spec: 行）が無いコミットがあります: ${missing.join(' / ')}。/spec-sync で確かめ、Spec-For: で補ってください`);
} catch (e) {
  problems.push(`仕様書の追従確認を確かめられません: ${e.message}`);
}

// 3. HANDOVER の再開プランを今日書き直してある（冒頭に今日の日付）・未検証の欄がある
const handover = fs.readFileSync(path.join(ROOT, 'HANDOVER.md'), 'utf8').split(/\r?\n/);
const head = handover.slice(0, 40).join('\n');
if (!head.includes(todayJst)) problems.push(`HANDOVER.md の冒頭（再開プラン）に今日の日付 ${todayJst} がありません。§0.0 を書き直してください（Skill /handoff の 1）`);
if (!handover.slice(0, 120).join('\n').includes('未検証')) problems.push('HANDOVER.md の再開プランに「未検証」の欄がありません。未検証・承認待ちを完了に混ぜずに書いてください');

if (problems.length) {
  try { fs.rmSync(MARKER, { force: true }); } catch { /* 無ければよい */ }
  console.error('✗ 引き継ぎ前のレビューが通りません:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const headSha = git('rev-parse', 'HEAD').trim();
fs.mkdirSync(path.dirname(MARKER), { recursive: true });
fs.writeFileSync(MARKER, JSON.stringify({ head: headSha, at: Date.now(), date: todayJst }), 'utf8');
console.log(`✓ 引き継ぎ前のレビュー（機械の項目）を通りました（HEAD ${headSha.slice(0, 8)}）。判断の項目は Skill /handoff の 2 を確かめてください。`);
