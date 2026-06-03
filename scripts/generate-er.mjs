// v376.37: ER 単一情報源化（A+B ハイブリッド）。
//   列の存在/順序 = gas-src テーブル定義（正本）／ 型・PK/FK・コメント・リレーション・分類 = docs/er-metadata.json
//   → マージして docs/03_DATA_MODEL.md の最初の ```mermaid erDiagram ブロックを自動生成（手書き禁止）。
import { readFileSync, writeFileSync } from 'fs';
import { extractTableDefs, loadMetadata, renderMermaid } from './lib/er-model.mjs';

const GAS_SRC = 'gas-src/Code.full.gs';
const META = 'docs/er-metadata.json';
const DOC = 'docs/03_DATA_MODEL.md';

const defs = extractTableDefs(GAS_SRC);
const meta = loadMetadata(META);
const banner = '  %% ⚠ AUTO-GENERATED — 手書き禁止。正本は gas-src テーブル定義(列) + docs/er-metadata.json(型/キー/コメント/リレーション)。再生成: npm run build:docs-portal';
const mermaid = renderMermaid(defs, meta).replace(/^erDiagram\n/, `erDiagram\n${banner}\n`);

const md = readFileSync(DOC, 'utf8');
const f = md.indexOf('```mermaid');
if (f < 0) throw new Error('docs/03 に ```mermaid ブロックがありません');
const bodyStart = f + '```mermaid'.length;
const close = md.indexOf('```', bodyStart);
if (close < 0) throw new Error('```mermaid の終端が見つかりません');
const next = `${md.slice(0, bodyStart)}\n${mermaid}\n${md.slice(close)}`;
writeFileSync(DOC, next, 'utf8');

const tableCount = Object.keys(defs).length;
const colCount = Object.values(defs).reduce((a, c) => a + c.length, 0);
console.log(`[generate-er] docs/03 main ER 再生成: tables=${tableCount} columns=${colCount} relationships=${meta.relationships.length}`);
