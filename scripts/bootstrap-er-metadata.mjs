// v376.37: 現行 docs/03 main ER から er-metadata.json を一度だけ生成（型/PK/FK/コメント/リレーション/分類を吸出し）。
// 以後 er-metadata.json が「列の存在/順序以外」の正本。列存在/順序は gas-src テーブル定義 が正本。
import { readFileSync, writeFileSync } from 'fs';
import { extractMainErBlock, parseMermaidEr } from './lib/er-model.mjs';

const md = readFileSync('docs/03_DATA_MODEL.md', 'utf8');
const meta = parseMermaidEr(extractMainErBlock(md));
writeFileSync('docs/er-metadata.json', JSON.stringify(meta, null, 2) + '\n', 'utf8');
console.log(`[bootstrap-er-metadata] tables=${meta.tableOrder.length} relationships=${meta.relationships.length}`);
const colCount = Object.values(meta.columns).reduce((a, c) => a + Object.keys(c).length, 0);
console.log(`  columns(meta)=${colCount} sections=${new Set(Object.values(meta.sectionByTable)).size}`);
