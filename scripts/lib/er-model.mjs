// v376.37: ER 単一情報源化（A+B ハイブリッド）の共有ライブラリ。
//   - 列の存在/順序 = gas-src テーブル定義（正本）
//   - 型/PK/FK/コメント/リレーション/分類 = docs/er-metadata.json（手書き正本）
// eval を避け regex で抽出（テーブル定義は文字列名のみの配列・concat なので安全）。
import { readFileSync } from 'fs';

const colsFromBody = (body) => [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);

/** `var NAME = { ... };` リテラルを抽出して { key: [cols] } を defs にマージ。 */
function parseObjectLiteral(src, startMarker, defs) {
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error(`${startMarker} が見つかりません`);
  let depth = 0, litEnd = -1;
  const braceStart = start + startMarker.length - 1;
  for (let j = braceStart; j < src.length; j += 1) {
    const c = src[j];
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (depth === 0) { litEnd = j; break; } }
  }
  if (litEnd < 0) throw new Error(`${startMarker} の終端が見つかりません`);
  const literal = src.slice(braceStart + 1, litEnd);
  const entryRe = /(?:^|\n)\s*'?([A-Za-z0-9_ぁ-んァ-ヶ一-龯ー]+)'?\s*:\s*\[([\s\S]*?)\]/g;
  let m;
  while ((m = entryRe.exec(literal))) defs[m[1]] = colsFromBody(m[2]);
}

/** gas-src/Code.full.gs から { tableName: [colName,...] } を抽出（列順保持）。テーブル定義 + マスタ定義 + 動的代入。 */
export function extractTableDefs(gasSrcPath) {
  const src = readFileSync(gasSrcPath, 'utf8');
  const defs = {};
  // 1) リテラル: var テーブル定義 = { ... }; / var マスタ定義 = { ... };
  parseObjectLiteral(src, 'var テーブル定義 = {', defs);
  parseObjectLiteral(src, 'var マスタ定義 = {', defs);

  let m;
  // 2) 動的代入: テーブル定義['NAME'] = [ ... ];
  const assignRe = /テーブル定義\['([^']+)'\]\s*=\s*\[([\s\S]*?)\];/g;
  while ((m = assignRe.exec(src))) defs[m[1]] = colsFromBody(m[2]);

  // 3) concat 代入: テーブル定義['NAME'] = テーブル定義['BASE'].slice().concat([ ... ]);
  const concatRe = /テーブル定義\['([^']+)'\]\s*=\s*テーブル定義\['([^']+)'\]\.slice\(\)\.concat\(\[([\s\S]*?)\]\)/g;
  while ((m = concatRe.exec(src))) {
    const base = defs[m[2]] || [];
    defs[m[1]] = base.concat(colsFromBody(m[3]));
  }

  // 4) v376.52 cascade アーカイブ生成ループ（docs/249）:
  //    gas-src は ARCHIVE_SOURCE_TABLES（単一情報源）を for ループで展開して
  //    SRC_archive = SRC 列 + ARCHIVE_SURROGATE_COLUMNS を定義する。
  //    ここでは同じ2配列を静的に読んで同一の展開を再現する。
  const surrM = src.match(/var ARCHIVE_SURROGATE_COLUMNS\s*=\s*\[([\s\S]*?)\];/);
  const srcsM = src.match(/var ARCHIVE_SOURCE_TABLES\s*=\s*\[([\s\S]*?)\];/);
  if (surrM && srcsM) {
    const surrogate = colsFromBody(surrM[1]);
    for (const name of colsFromBody(srcsM[1])) {
      if (defs[name]) defs[name + '_archive'] = defs[name].concat(surrogate);
    }
  }
  return defs;
}

/** er-metadata.json を読込（無ければ空骨格）。 */
export function loadMetadata(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { tableOrder: [], sectionByTable: {}, columns: {}, relationships: [] };
  }
}

/** docs/03 の最初の ```mermaid erDiagram ブロックを抽出。 */
export function extractMainErBlock(md) {
  const f = md.indexOf('```mermaid');
  if (f < 0) return '';
  const end = md.indexOf('```', f + 9);
  return md.slice(f + 9, end);
}

/** Mermaid erDiagram テキストをパースして {tableOrder, sectionByTable, columns, relationships} を返す（ブートストラップ用）。 */
export function parseMermaidEr(src) {
  const meta = { tableOrder: [], sectionByTable: {}, columns: {}, relationships: [] };
  let cur = null, section = '';
  for (let raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    const sec = line.match(/^%%\s*=+\s*(.+?)\s*=+\s*$/);
    if (sec) { section = sec[1]; continue; }
    if (line.startsWith('%%') || !line) continue;
    const start = line.match(/^(\S+)\s*\{$/);
    if (start) {
      cur = start[1];
      meta.tableOrder.push(cur);
      meta.sectionByTable[cur] = section;
      meta.columns[cur] = {};
      continue;
    }
    if (cur && line === '}') { cur = null; continue; }
    if (cur) {
      const c = line.match(/^(\S+)\s+(\S+?)(?:\s+(PK|FK|PK,FK|FK,PK))?(?:\s+"([^"]*)")?$/);
      if (c) meta.columns[cur][c[2]] = { type: c[1], key: c[3] || '', comment: c[4] || '' };
      continue;
    }
    const rel = line.match(/^(\S+)\s+([}{|o<>0-9\-]+--[}{|o<>0-9\-]+)\s+(\S+)\s*:\s*"?([^"]*)"?$/);
    if (rel) meta.relationships.push({ left: rel[1], cardinality: rel[2], right: rel[3], label: rel[4] || '' });
  }
  return meta;
}

/** テーブル定義(列順=正本) + メタ → Mermaid erDiagram テキストを生成。 */
export function renderMermaid(defs, meta) {
  const out = ['erDiagram'];
  // 出力順: メタの tableOrder を優先、テーブル定義にあってメタ未掲載は末尾
  const ordered = [...meta.tableOrder.filter((t) => defs[t]),
    ...Object.keys(defs).filter((t) => !meta.tableOrder.includes(t))];
  let lastSection = null;
  for (const t of ordered) {
    const section = meta.sectionByTable[t] || '';
    if (section && section !== lastSection) { out.push(`  %% ===== ${section} =====`); lastSection = section; }
    out.push(`  ${t} {`);
    for (const col of defs[t]) {
      const md = (meta.columns[t] && meta.columns[t][col]) || {};
      const type = md.type || 'string';
      let l = `    ${type} ${col}`;
      if (md.key) l += ` ${md.key}`;
      if (md.comment) l += ` "${md.comment}"`;
      out.push(l);
    }
    out.push('  }');
    out.push('');
  }
  // リレーション（存在するテーブル間のみ）
  for (const r of meta.relationships) {
    if (defs[r.left] && defs[r.right]) out.push(`  ${r.left} ${r.cardinality} ${r.right} : "${r.label}"`);
  }
  return out.join('\n');
}
