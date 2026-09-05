/**
 * SOW §1.2 の成功条件「文書間の重複を機械検査で 0 件にする」の縮小版（SOW §8 U-22）。
 *
 * 当初は「文書間の重複そのもの」を検出する構想だったが、重複の機械判定は曖昧で
 * 誤検出が多く、運用の邪魔になると判断した（operator 合意・2026-09-05）。
 * 代わりに **ID の整合**を突き合わせる。これなら誤検出がほぼ無く、
 * 実際に起きた事故（v376.73 で「実装済みなのに未実装と書いてある」を 4 件見逃した）を捕まえられる。
 *
 * 検査すること:
 *   1. 5 文書が参照する未確定事項 U-xx が、SOW §8 に実在するか（幽霊参照を作らない）
 *   2. SOW §8 の U-xx に欠番・重複が無いか
 *   3. 要件 ID（NF / BR / MG / SCR / TM）に重複が無いか
 *   4. 要件 ID がトレーサビリティ一覧（docs/268）から辿れるか
 *   5. 解決済みの未確定事項が、他文書で未解決のまま参照されていないか
 *
 * 検査しないこと（意図的）:
 *   - 文面の重複。人手のレビュー（docs/267 §4）に委ねる
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_DIR = path.join(ROOT, 'docs', 'spec');
const SPEC_FILES = ['01_SOW.md', '02_RD.md', '03_TRD.md', '04_UIUX.md', '05_DATA_IF.md'];
const TRACEABILITY = 'docs/268_SPEC_TRACEABILITY_2026-09-04.md';

const read = (p) => fs.readFileSync(p, 'utf8');
const errors = [];
const warns = [];

const docs = {};
for (const f of SPEC_FILES) docs[f] = read(path.join(SPEC_DIR, f));
const allSpec = Object.values(docs).join('\n');
const traceability = fs.existsSync(path.join(ROOT, TRACEABILITY)) ? read(path.join(ROOT, TRACEABILITY)) : null;
if (!traceability) errors.push(`トレーサビリティ一覧が無い: ${TRACEABILITY}`);

/** 「| U-01 | …」の形で定義されている ID を拾う（表の 1 列目＝定義） */
const definedIds = (text, prefix) => {
  const re = new RegExp(`^\\|\\s*(?:~~)?\\**\\s*(${prefix}-\\d+)`, 'gm');
  return [...text.matchAll(re)].map((m) => m[1]);
};
/** 本文中で言及されている ID をすべて拾う */
const mentionedIds = (text, prefix) =>
  [...text.matchAll(new RegExp(`\\b(${prefix}-\\d+)`, 'g'))].map((m) => m[1]);

// ── 1 & 2. 未確定事項 U-xx ─────────────────────────────────────
const sow = docs['01_SOW.md'];
const uDefined = definedIds(sow, 'U');
const uSet = new Set(uDefined);

if (uDefined.length !== uSet.size) {
  const dup = uDefined.filter((v, i) => uDefined.indexOf(v) !== i);
  errors.push(`SOW §8 の U-ID が重複: ${[...new Set(dup)].join(', ')}`);
}
const uNums = uDefined.map((id) => Number(id.split('-')[1])).sort((a, b) => a - b);
for (let i = 1; i <= (uNums[uNums.length - 1] || 0); i += 1) {
  if (!uNums.includes(i)) {
    // 欠番は「ID を再利用しない」方針では起こりうる（廃止）。警告に留める
    warns.push(`SOW §8 に U-${String(i).padStart(2, '0')} が無い（廃止なら改訂履歴に記載があること）`);
  }
}
for (const [file, text] of Object.entries(docs)) {
  if (file === '01_SOW.md') continue;
  for (const id of new Set(mentionedIds(text, 'U'))) {
    if (!uSet.has(id)) errors.push(`${file} が参照する ${id} が SOW §8 に無い`);
  }
}

// ── 3. 要件 ID の重複 ──────────────────────────────────────────
const ID_OWNERS = [
  ['NF', '01_SOW.md'],
  ['TM', '01_SOW.md'],
  ['BR', '02_RD.md'],
  ['MG', '03_TRD.md'],
  ['SCR', '04_UIUX.md'],
];
const requirementIds = [];
for (const [prefix, owner] of ID_OWNERS) {
  const ids = definedIds(docs[owner], prefix);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dup.length) errors.push(`${owner} の ${prefix}-ID が重複: ${[...new Set(dup)].join(', ')}`);
  requirementIds.push(...ids.map((id) => ({ id, owner })));

  // 所有者以外の文書で「定義」されていないこと（同じ ID を 2 文書で定義しない）
  for (const [file, text] of Object.entries(docs)) {
    if (file === owner) continue;
    const foreign = definedIds(text, prefix);
    if (foreign.length) {
      errors.push(`${file} が ${prefix}-ID を定義している（正本は ${owner}）: ${foreign.join(', ')}`);
    }
  }
}

// ── 4. トレーサビリティ一覧から辿れるか ────────────────────────
if (traceability) {
  // 個別に載せず「BR-01〜04」のように範囲で書く運用があるため、範囲表記も展開して照合する
  const expanded = new Set();
  for (const m of traceability.matchAll(/\b([A-Z]{2,3})-(\d+)\s*〜\s*(?:[A-Z]{2,3}-)?(\d+)/g)) {
    const [, prefix, from, to] = m;
    for (let n = Number(from); n <= Number(to); n += 1) {
      expanded.add(`${prefix}-${String(n).padStart(String(from).length, '0')}`);
    }
  }
  for (const m of traceability.matchAll(/\b([A-Z]{2,3}-\d+)/g)) expanded.add(m[1]);

  const missing = requirementIds
    .filter(({ id }) => !expanded.has(id))
    .filter(({ id }) => !id.startsWith('TM-')); // 用語は検証対象ではない（docs/268 §7）
  if (missing.length) {
    errors.push(
      `トレーサビリティ一覧（${TRACEABILITY}）に無い要件 ID: ${missing.map((x) => x.id).join(', ')}`
    );
  }
}

// ── 5. 解決済みの未確定事項が未解決扱いで残っていないか ────────
// 解決済みは「| U-xx | ~~…~~ → **解決済み（…）**」の形で書く（SOW §8 の運用）。
// 行内に閉じるので、改行をまたがない正規表現で拾う。
const resolvedIds = [...sow.matchAll(/^\|\s*(U-\d+)\s*\|[^\n]*解決済み/gm)].map((m) => m[1]);
for (const id of resolvedIds) {
  for (const [file, text] of Object.entries(docs)) {
    if (file === '01_SOW.md') continue;
    const re = new RegExp(`${id}[^\\n]{0,60}(未確定|未実装|判断待ち|検討中)`);
    const hit = text.match(re);
    if (hit) errors.push(`${file}: ${id} は SOW で解決済みだが「${hit[1]}」のまま（${hit[0].slice(0, 50)}）`);
  }
}

// ── 出力 ───────────────────────────────────────────────────────
console.log('[test-docs-single-source]');
console.log(`  未確定事項 U: ${uDefined.length} 件（解決済み ${resolvedIds.length} 件）`);
console.log(`  要件 ID: ${requirementIds.length} 件`);
if (warns.length) {
  console.log(`  WARN ${warns.length} 件:`);
  warns.forEach((w) => console.log(`    - ${w}`));
}
if (errors.length) {
  console.error(`  FAIL ${errors.length} 件:`);
  errors.forEach((e) => console.error(`    - ${e}`));
  process.exit(1);
}
console.log('  PASS');
