// v376.37: ER 単一情報源 完全性ゲート（prerelease）。
//   正本 = gas-src テーブル定義（列）。docs/er-metadata.json は型/キー/コメント/リレーション。
//   ドリフトをビルドで検出: stale メタ（正本に無いテーブル/列を参照）/ 存在しないテーブルへのリレーション → FAIL。
//   正本にあってメタ未整備（型なし・順序未掲載）→ WARN。
import { extractTableDefs, loadMetadata } from './lib/er-model.mjs';

const defs = extractTableDefs('gas-src/Code.full.gs');
const meta = loadMetadata('docs/er-metadata.json');
const errors = [];
const warns = [];

// stale: メタが参照するテーブル/列が正本に無い
for (const t of Object.keys(meta.columns || {})) {
  if (!defs[t]) { errors.push(`stale: er-metadata の テーブル "${t}" が テーブル定義 に存在しない`); continue; }
  for (const col of Object.keys(meta.columns[t])) {
    if (!defs[t].includes(col)) errors.push(`stale: "${t}.${col}" が テーブル定義 に存在しない`);
  }
}
// リレーション端点が正本に存在するか
for (const r of meta.relationships || []) {
  if (!defs[r.left]) errors.push(`relationship: 左テーブル "${r.left}" が テーブル定義 に存在しない`);
  if (!defs[r.right]) errors.push(`relationship: 右テーブル "${r.right}" が テーブル定義 に存在しない`);
}
// WARN: 正本にあってメタ未整備
for (const t of Object.keys(defs)) {
  if (!(meta.tableOrder || []).includes(t)) warns.push(`未掲載: テーブル "${t}" が er-metadata の順序/分類に無い（ER 末尾・未分類で出力）`);
  const cm = meta.columns[t] || {};
  for (const col of defs[t]) {
    if (!cm[col]) warns.push(`型未設定: "${t}.${col}"（type=string 既定で出力）`);
  }
}

if (warns.length) {
  console.log(`[test-er-sync] WARN ${warns.length} 件:`);
  warns.slice(0, 40).forEach((w) => console.log('  - ' + w));
  if (warns.length > 40) console.log(`  ... 他 ${warns.length - 40} 件`);
}
if (errors.length) {
  console.error(`[test-er-sync] FAIL ${errors.length} 件:`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log(`[test-er-sync] PASS （テーブル ${Object.keys(defs).length} / リレーション ${(meta.relationships || []).length} / stale=0）`);
