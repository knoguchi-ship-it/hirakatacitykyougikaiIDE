// v376.37: er-metadata.json の型未設定列を命名規則から推論して補完（既存メタは保持）。
// 保守的推論: 日時→datetime / 日→date / フラグ→boolean / 順・数・金額・単価・上限→int / 既定→string。
// 各テーブル先頭列が ID/コード で終われば PK 付与（未設定時のみ）。
import { readFileSync, writeFileSync } from 'fs';
import { extractTableDefs, loadMetadata } from './lib/er-model.mjs';

function inferType(name) {
  if (/日時$/.test(name)) return 'datetime';
  if (/日$/.test(name)) return 'date';
  if (/フラグ$/.test(name)) return 'boolean';
  if (/(順|数|金額|単価|上限)$/.test(name)) return 'int';
  return 'string';
}

const defs = extractTableDefs('gas-src/Code.full.gs');
const meta = loadMetadata('docs/er-metadata.json');
meta.columns = meta.columns || {};
let filledType = 0, filledPk = 0;

for (const [table, cols] of Object.entries(defs)) {
  meta.columns[table] = meta.columns[table] || {};
  cols.forEach((col, idx) => {
    const existing = meta.columns[table][col];
    if (!existing) {
      const entry = { type: inferType(col), key: '', comment: '' };
      if (idx === 0 && /(ID|コード)$/.test(col)) { entry.key = 'PK'; filledPk += 1; }
      meta.columns[table][col] = entry;
      filledType += 1;
    }
  });
}

// 順序/分類が未掲載のテーブルを補完（ER 末尾の未分類出力を解消）
meta.tableOrder = meta.tableOrder || [];
meta.sectionByTable = meta.sectionByTable || {};
let filledOrder = 0;
for (const table of Object.keys(defs)) {
  if (!meta.tableOrder.includes(table)) {
    meta.tableOrder.push(table);
    if (!meta.sectionByTable[table]) meta.sectionByTable[table] = 'その他';
    filledOrder += 1;
  }
}

writeFileSync('docs/er-metadata.json', JSON.stringify(meta, null, 2) + '\n', 'utf8');
console.log(`[enrich-er-metadata] 型補完 ${filledType} 列 / PK 付与 ${filledPk} / 順序・分類補完 ${filledOrder} テーブル`);
