/**
 * 2026-10-19: docs/307 S18 の回帰テスト。
 *
 * normalizeTableColumns_ は、ヘッダーが定義と違うシートを作り直していた。定義に無い列のデータは
 * 報告も退避もせずに消え、末尾に列を足すだけのとき（BR-21 の 4 列など）もシートごと作り直していた。
 *
 * - 末尾に足すだけなら見出しのセルを書き足すだけ（行・書式に触らない）
 * - 消える列があれば止める（シートを消さない）
 * - 並べ替えのときは書式を先に移す（'0123' が数値になる事故を防ぐ）
 * - リハーサルの差分は、あってはならない変化だけを issues に出す
 *
 * 判定は生成物から関数を取り出して実行する（ミラー実装を書かない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// 保守ツールの本体は maintenance.gs へ分かれる（scripts/gas-boundary-utils.mjs）
const adminArtifact = read('gas/admin/Code.gs') + '\n' + read('gas/admin/maintenance.gs');

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

const plan = new Function(`${extractFunction(adminArtifact, 'planTableColumnNormalization_')}
  return planTableColumnNormalization_;`)() as (c: string[], t: string[], d?: boolean[]) => any;

test('同じ見出しなら何もしない', () => {
  assert.equal(plan(['a', 'b'], ['a', 'b'], [true, true]).mode, 'same');
});

test('末尾に足すだけなら append（BR-21 の 4 列）', () => {
  const r = plan(['a', 'b'], ['a', 'b', 'c', 'd'], [true, true]);
  assert.equal(r.mode, 'append');
  assert.deepEqual(r.added, ['c', 'd']);
});

test('末尾の、見出しもデータも無い列は数えない', () => {
  assert.equal(plan(['a', 'b', '', ''], ['a', 'b'], [true, true, false, false]).mode, 'same');
  assert.equal(plan(['a', ''], ['a', 'b'], [true, false]).mode, 'append');
});

test('定義に無い列があれば blocked（データが無くても列名があれば止める）', () => {
  const r = plan(['a', 'old', 'b'], ['a', 'b'], [true, false, true]);
  assert.equal(r.mode, 'blocked');
  assert.deepEqual(r.dropped, ['old']);
});

test('見出しの無い列にデータがあれば blocked', () => {
  const r = plan(['a', '', 'b'], ['a', 'b'], [true, true, true]);
  assert.equal(r.mode, 'blocked');
  assert.match(r.dropped[0], /見出しなし・2列目/);
});

test('同じ名前の列が 2 つあれば blocked（後ろの列のデータが消える）', () => {
  const r = plan(['a', 'b', 'a'], ['a', 'b'], [true, true, true]);
  assert.equal(r.mode, 'blocked');
  assert.match(r.dropped[0], /a（重複・3列目）/);
});

test('並べ替えが要るなら rebuild、途中への追加も rebuild', () => {
  assert.equal(plan(['b', 'a'], ['a', 'b'], [true, true]).mode, 'rebuild');
  const r = plan(['a', 'c'], ['a', 'b', 'c'], [true, true]);
  assert.equal(r.mode, 'rebuild');
  assert.deepEqual(r.added, ['b']);
});

// ── normalizeTableColumns_ を偽のシートで動かす ─────────────────────
function makeSheet(grid: unknown[][], maxColumns = 26) {
  const calls: string[] = [];
  const sheet = {
    grid,
    maxColumns,
    getLastColumn: () => Math.max(0, ...grid.map((r) => r.length)),
    getLastRow: () => grid.length,
    getMaxColumns: () => sheet.maxColumns,
    insertColumnsAfter: (_after: number, n: number) => { calls.push('insertColumnsAfter:' + n); sheet.maxColumns += n; },
    getIndex: () => 1,
    getRange: (row: number, col: number, nr: number, nc: number) => ({
      getValues: () => Array.from({ length: nr }, (_, r) =>
        Array.from({ length: nc }, (_, c) => (grid[row - 1 + r]?.[col - 1 + c] ?? ''))),
      getNumberFormats: () => Array.from({ length: nr }, () => Array.from({ length: nc }, () => '@')),
      setValues: (v: unknown[][]) => {
        calls.push(`setValues:${row},${col},${nr}x${nc}`);
        v.forEach((line, r) => line.forEach((cell, c) => {
          grid[row - 1 + r] = grid[row - 1 + r] || [];
          grid[row - 1 + r][col - 1 + c] = cell;
        }));
      },
      setNumberFormats: () => { calls.push('setNumberFormats'); },
    }),
  };
  return { sheet, calls };
}

function runNormalize(tableHeaders: string[], sheet: any) {
  const ssCalls: string[] = [];
  const temp = makeSheet([]);
  const ss = {
    getSheetByName: () => sheet,
    insertSheet: () => { ssCalls.push('insertSheet'); return Object.assign(temp.sheet, { setName: () => {} }); },
    deleteSheet: () => { ssCalls.push('deleteSheet'); },
    setActiveSheet: () => {},
    moveActiveSheet: () => {},
  };
  const logs: string[] = [];
  const fn = new Function('テーブル定義', 'Logger', 'Utilities', `
    ${extractFunction(adminArtifact, 'planTableColumnNormalization_')}
    ${extractFunction(adminArtifact, 'normalizeTableColumns_')}
    return normalizeTableColumns_;`)(
    { T: tableHeaders },
    { log: (m: string) => logs.push(m) },
    { getUuid: () => 'uuid-0000-0000' },
  );
  return { run: () => fn(ss, 'T'), ssCalls, logs, tempCalls: temp.calls, temp: temp.sheet };
}

test('append: 見出しのセルだけ書き、シートを作り直さず、行に触らない', () => {
  const { sheet, calls } = makeSheet([['a', 'b'], ['0123', 'x']], 2);
  const { run, ssCalls } = runNormalize(['a', 'b', 'c', 'd'], sheet);
  const r = run();
  assert.equal(r.mode, 'append');
  assert.deepEqual(ssCalls, [], 'シートを作り直した');
  assert.deepEqual(calls, ['insertColumnsAfter:2', 'setValues:1,3,1x2']);
  assert.deepEqual(sheet.grid, [['a', 'b', 'c', 'd'], ['0123', 'x']]);
});

test('blocked: 例外で止め、シートを消さない', () => {
  const { sheet } = makeSheet([['a', 'old'], ['1', 'keep']]);
  const { run, ssCalls } = runNormalize(['a'], sheet);
  assert.throws(run, /old.*データを消さずに止めました/);
  assert.deepEqual(ssCalls, []);
  assert.deepEqual(sheet.grid, [['a', 'old'], ['1', 'keep']]);
});

test('rebuild: 書式を値より先に移す', () => {
  const { sheet } = makeSheet([['b', 'a'], ['1', '0123']]);
  const { run, ssCalls, tempCalls, temp } = runNormalize(['a', 'b'], sheet);
  assert.equal(run().mode, 'rebuild');
  assert.deepEqual(ssCalls, ['insertSheet', 'deleteSheet']);
  assert.deepEqual(tempCalls, ['setValues:1,1,1x2', 'setNumberFormats', 'setValues:2,1,1x2']);
  assert.deepEqual(temp.grid, [['a', 'b'], ['0123', '1']]);
});

// ── リハーサルの差分 ─────────────────────────────────────────────
const diff = new Function('テーブル定義', `${extractFunction(adminArtifact, 'diffSpreadsheetSnapshotsForRehearsal_')}
  return diffSpreadsheetSnapshotsForRehearsal_;`)({ T_研修申込: [] }) as (b: any, a: any) => any;
const cellKey = new Function(`${extractFunction(adminArtifact, 'rehearsalCellKey_')} return rehearsalCellKey_;`)() as (v: unknown) => string;

test('リハーサル: 列の追加だけなら issues 0', () => {
  const before = { T_研修申込: { headers: ['a', 'b'], rows: [['string:1', '']] } };
  const after = { T_研修申込: { headers: ['a', 'b', 'c'], rows: [['string:1', '', '']] } };
  const r = diff(before, after);
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.changedTables, ['T_研修申込']);
});

test('リハーサル: 文字列が数値に変わったら issues に出す（値は出さない）', () => {
  assert.notEqual(cellKey('0123'), cellKey(123));
  const before = { T_研修申込: { headers: ['a'], rows: [[cellKey('0123')]] } };
  const after = { T_研修申込: { headers: ['a'], rows: [[cellKey(123)]] } };
  const r = diff(before, after);
  assert.equal(r.issues.length, 1);
  assert.match(r.issues[0], /2行目 string→number/);
  assert.doesNotMatch(r.issues[0], /0123/);
});

test('リハーサル: 列が消えた・行が減った・テーブルのシートが消えたら issues', () => {
  const before = {
    T_研修申込: { headers: ['a', 'b'], rows: [['string:1', 'string:2'], ['string:3', '']] },
    メモ: { headers: ['x'], rows: [['string:y']] },
  };
  const after = { T_研修申込: { headers: ['a'], rows: [['string:1']] } };
  const r = diff(before, after);
  assert.ok(r.issues.some((s: string) => s.includes('列「b」が消えた')));
  assert.ok(r.issues.some((s: string) => s.includes('行が減った 2→1')));
  assert.ok(r.issues.some((s: string) => s.startsWith('メモ: シートが消えた')));
});

test('リハーサル: seed による行の追加は issues にしない', () => {
  const before = { T_研修申込: { headers: ['a'], rows: [['string:1']] } };
  const after = { T_研修申込: { headers: ['a'], rows: [['string:1'], ['string:2']] } };
  const r = diff(before, after);
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.appendedRows, { T_研修申込: 1 });
});

test('リハーサルのツールは MASTER 限定・コピーを必ずゴミ箱へ・本番へ initializeSchema_ を流さない', () => {
  const body = extractFunction(adminArtifact, 'rehearseSchemaMigrationOnCopy_APPLY');
  assert.match(body.split('\n')[1], /assertMasterOperator_\('rehearseSchemaMigrationOnCopy_APPLY'\)/);
  assert.match(body, /finally \{\s*copyFile\.setTrashed\(true\);/);
  assert.doesNotMatch(body, /initializeSchema_\((source|ss)\)/);
  assert.equal((body.match(/initializeSchema_\(copy\)/g) || []).length, 2);
});
