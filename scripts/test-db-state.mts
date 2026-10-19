/**
 * 2026-10-19: DB の状態を数える診断 describeDatabaseState_LOG の検査。
 *
 * - 調べる ID 参照（DB_STATE_ID_REFERENCES_）が ER（docs/er-metadata.json）の ID 参照を漏れなく含むこと
 * - 孤児の数え方を偽のシートで実際に動かして確かめる
 * - 読むだけであること（書き込み・監査ログ・セルの値を返さない）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const gas = read('gas-src/Code.full.gs');
const adminArtifact = read('gas/admin/Code.gs') + '\n' + read('gas/admin/dryrun.gs');

function extractFunction(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} の終端が見つからない`);
}

function extractVar(source: string, name: string): string {
  const start = source.indexOf(`var ${name} = [`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  return source.slice(start, source.indexOf('];', start) + 2);
}

const refs = new Function(`${extractVar(gas, 'DB_STATE_ID_REFERENCES_')} return DB_STATE_ID_REFERENCES_;`)() as string[][];

// BR-21 の照合列は ER に関係として描いていない（照合の結果であって入力ではない）。ここで明示して許す
const EXTRA_ALLOWED = ['T_研修申込.照合会員ID', 'T_研修申込.照合職員ID'];

test('ID 参照の一覧が ER の ID 参照（マスタ・archive 以外）と一致する', () => {
  const meta = JSON.parse(read('docs/er-metadata.json'));
  const er = (meta.relationships as Array<{ left: string; right: string; label: string }>)
    .filter((r) => !r.right.startsWith('M_') && !r.left.endsWith('_archive'))
    .map((r) => `${r.left}.${r.label.split('(')[0].trim()}→${r.right}`)
    .sort();
  const mine = refs.map(([c, col, p]) => `${c}.${col}→${p}`)
    .filter((k) => !EXTRA_ALLOWED.some((e) => k.startsWith(e + '→')))
    .sort();
  assert.deepEqual(mine, er);
});

test('describeDatabaseState_LOG: 孤児を子の削除状態で分け、削除済みの親を指す稼働行を数える', () => {
  const sheets: Record<string, unknown[][]> = {
    T_会員: [['会員ID', '削除フラグ'], ['M1', false], ['M2', true]],
    T_事業所職員: [['職員ID', '会員ID', '削除フラグ'], ['S1', 'M1', false], ['S2', 'M9', false], ['S3', 'M9', true], ['S4', 'M2', false], ['S5', '', false]],
  };
  const makeSheet = (name: string) => ({
    getName: () => name,
    getLastColumn: () => sheets[name][0].length,
    getLastRow: () => sheets[name].length,
    getRange: (r: number, c: number, nr: number, nc: number) => ({
      getValues: () => sheets[name].slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
    }),
  });
  const ss = { getId: () => 'main', getSheets: () => Object.keys(sheets).map(makeSheet) };
  const fn = new Function('テーブル定義', 'マスタ定義', 'DB_SCHEMA_VERSION', 'DB_STATE_ID_REFERENCES_', 'DB_STATE_LOG_TABLES_',
    'assertMasterOperator_', 'getOrCreateDatabase_', 'getLogSs_', 'Logger', 'toBoolean_', `
    ${extractFunction(adminArtifact, 'planTableColumnNormalization_')}
    ${extractFunction(adminArtifact, 'readSheetForDbState_')}
    ${extractFunction(adminArtifact, 'describeDatabaseState_LOG')}
    return describeDatabaseState_LOG;`)(
    { T_会員: ['会員ID', '削除フラグ'], T_事業所職員: ['職員ID', '会員ID', '削除フラグ'] }, {}, 'v',
    [['T_事業所職員', '会員ID', 'T_会員'], ['T_研修申込', '研修ID', 'T_研修']], [],
    () => ({}), () => ss, () => ss, { log: () => {} }, (v: unknown) => v === true,
  );
  const out = JSON.parse(fn());
  assert.deepEqual(out.references[0], {
    child: 'T_事業所職員', column: '会員ID', parent: 'T_会員',
    withValue: 4, orphanActive: 1, orphanDeleted: 1, activeToDeletedParent: 1,
  });
  assert.equal(out.references[1].skipped, '子のシートが無い');
  const staff = out.books[0].sheets.find((s: any) => s.name === 'T_事業所職員');
  assert.deepEqual(staff, { name: 'T_事業所職員', kind: 'table', rows: 5, cols: 3, deleted: 1, schema: 'same' });
  assert.doesNotMatch(JSON.stringify(out), /S1|S2|M9/, 'セルの値を返している');
});

test('describeDatabaseState_LOG は読むだけ（MASTER 限定・書き込みなし・監査ログに書かない）', () => {
  const body = [
    extractFunction(adminArtifact, 'describeDatabaseState_LOG'),
    extractFunction(adminArtifact, 'readSheetForDbState_'),
  ].join('\n');
  assert.match(body.split('\n')[1], /assertMasterOperator_\('describeDatabaseState_LOG'\)/);
  assert.doesNotMatch(body, /setValue|appendRow|insertSheet|deleteSheet|setProperty|appendAuditLogEntries_|deleteRow|clear\(/);
});
