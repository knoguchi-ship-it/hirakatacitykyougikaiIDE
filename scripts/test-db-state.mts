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

const HELPERS = ['dbStateIndex_', 'dbStateTime_', 'countAuthOfDeletedPeople_', 'countCredentialsTempExposure_']
  .map((n) => extractFunction(adminArtifact, n)).join('\n');

const refs = new Function(`${extractVar(gas, 'DB_STATE_ID_REFERENCES_')} return DB_STATE_ID_REFERENCES_;`)() as string[][];


test('ID 参照の一覧が ER の ID 参照（マスタ・archive 以外）と一致する', () => {
  const meta = JSON.parse(read('docs/er-metadata.json'));
  const er = (meta.relationships as Array<{ left: string; right: string; label: string }>)
    .filter((r) => !r.right.startsWith('M_') && !r.left.endsWith('_archive'))
    .map((r) => `${r.left}.${r.label.split('(')[0].trim()}→${r.right}`)
    .sort();
  const mine = refs.map(([c, col, p]) => `${c}.${col}→${p}`).sort();
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
    ${HELPERS}
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

test('平文の初期パスワード台帳: 変わっていない有効アカウントを数え、値は返さない', () => {
  const fn = new Function('toBoolean_', `${HELPERS} return { countCredentialsTempExposure_, countAuthOfDeletedPeople_ };`)(
    (v: unknown) => v === true || v === 'true',
  );
  const ledger = {
    headers: ['ログインID', '初期パスワード', '認証ID', '再発行日時', '更新日時'],
    rows: [
      ['u1', 'Secret-1', 'A1', '', '2026-03-25T00:00:00Z'],
      ['u2', 'Secret-2', 'A2', '', '2026-03-25T00:00:00Z'],
      ['u3', 'Secret-3', 'A3', '', '2026-03-25T00:00:00Z'],
      ['u4', '', 'A4', '', '2026-03-25T00:00:00Z'],
      ['u5', 'Secret-5', 'AX', '', '2026-03-25T00:00:00Z'],
    ],
  };
  const auth = {
    headers: ['認証ID', 'ログインID', '会員ID', '職員ID', 'パスワード更新日時', '最終ログイン日時', 'アカウント有効フラグ', 'ロック状態', '削除フラグ'],
    rows: [
      ['A1', 'u1', 'M1', '', '', '', true, false, false],
      ['A2', 'u2', 'M2', '', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z', true, false, false],
      ['A3', 'u3', 'M3', '', '', '', false, false, false],
      ['A4', 'u4', 'M4', '', '', '', true, false, false],
    ],
  };
  const out = fn.countCredentialsTempExposure_(ledger, auth);
  assert.equal(out.withPlainPassword, 4);
  assert.equal(out.matchedAuth, 3);
  assert.equal(out.enabledAndUnchanged, 1);
  assert.equal(out.enabledAndChanged, 1);
  assert.equal(out.disabledOrDeleted, 1);
  assert.equal(out.neverLoggedIn, 1);
  assert.doesNotMatch(JSON.stringify(out), /Secret|u1|A1/);

  const members = { headers: ['会員ID', '削除フラグ'], rows: [['M1', true], ['M2', false], ['M3', true]] };
  const staff = { headers: ['職員ID', '削除フラグ'], rows: [] };
  assert.deepEqual(fn.countAuthOfDeletedPeople_(auth, members, staff), { total: 2, enabled: 1, disabled: 1, locked: 0 });
});

test('describeDatabaseState_LOG は読むだけ（MASTER 限定・書き込みなし・監査ログに書かない）', () => {
  const body = [
    extractFunction(adminArtifact, 'describeDatabaseState_LOG'),
    extractFunction(adminArtifact, 'readSheetForDbState_'),
  ].join('\n');
  assert.match(body.split('\n')[1], /assertMasterOperator_\('describeDatabaseState_LOG'\)/);
  assert.doesNotMatch(body, /setValue|appendRow|insertSheet|deleteSheet|setProperty|appendAuditLogEntries_|deleteRow|clear\(/);
});
