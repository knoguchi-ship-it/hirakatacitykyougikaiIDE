/**
 * 職員の介護支援専門員番号を変えたときにログインIDが追従することを固定する。
 *
 * v376.99 の調査で、個人会員（CM番号）・事業所会員（事業所番号）はログインIDを
 * 書き換えるのに、事業所職員だけ追従していないことが分かった（v376.100 で是正）。
 * 本体と同じロジックをテスト側に書き直すとドリフトするため、gas-src から
 * 実ソースを切り出して評価する（AGENTS §3「テストにミラー実装を書かない」）。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const GAS_SRC = path.join(process.cwd(), 'gas-src', 'Code.full.gs');
const source = fs.readFileSync(GAS_SRC, 'utf8');

// トップレベル関数の閉じ括弧は行頭の } という本リポジトリの約束で切り出す。
function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

type Row = unknown[];

/** T_認証アカウント の最小スタブ。setValues で書き戻した内容を保持する。 */
function makeAuthSheet(headers: string[], rows: Row[]) {
  return {
    getLastRow: () => rows.length + 1,
    getLastColumn: () => headers.length,
    getRange(r: number, _c: number, numRows: number, _numCols: number) {
      return {
        getValues: () => (r === 1 ? [headers] : rows.slice(r - 2, r - 2 + numRows)),
        setValues: (vals: Row[]) => { for (let i = 0; i < vals.length; i++) rows[r - 2 + i] = vals[i]; },
      };
    },
    rows,
  };
}

const HEADERS = ['認証ID', 'ログインID', '会員ID', '職員ID', 'アカウント有効フラグ', '更新日時', '削除フラグ'];

function buildSync(rows: Row[]) {
  const sheet = makeAuthSheet(HEADERS, rows);
  const ss = { getSheetByName: (n: string) => (n === 'T_認証アカウント' ? sheet : null) };
  const fn = new Function(
    'toBoolean_', 'generateCmBasedLoginId_', 'Logger',
    `${extractFunction('syncStaffLoginIdToCmNumber_')}; return syncStaffLoginIdToCmNumber_;`,
  )(
    (v: unknown) => v === true || String(v).toLowerCase() === 'true',
    // 本体の採番規則（9 + CM番号）を模す。衝突時は末尾を繰り上げる。
    (cm: string, existing: string[]) => {
      let id = `9${cm}`;
      let n = 1;
      while (existing.includes(id)) { id = `9${cm}-${n}`; n += 1; }
      return id;
    },
    { log: () => {} },
  ) as (ss: unknown, staffId: string, cm: string) => { changed: boolean; before: string; after: string };
  return { fn, ss, sheet };
}

test('介護支援専門員番号を変えると職員のログインIDが追従する', () => {
  const rows: Row[] = [['A1', '911111111', 'M1', 'S1', true, '', false]];
  const { fn, ss, sheet } = buildSync(rows);
  const r = fn(ss, 'S1', '22222222');
  assert.equal(r.changed, true);
  assert.equal(r.before, '911111111');
  assert.equal(r.after, '922222222');
  assert.equal(sheet.rows[0][1], '922222222', 'シートへ書き戻されていること');
});

test('同じ番号なら書き換えない（無意味な更新と通知を出さない）', () => {
  const rows: Row[] = [['A1', '922222222', 'M1', 'S1', true, '', false]];
  const { fn, ss } = buildSync(rows);
  assert.equal(fn(ss, 'S1', '22222222').changed, false);
});

test('他の職員が使っているログインIDは奪わない（v376.73 の重複事故の再発防止）', () => {
  const rows: Row[] = [
    ['A1', '922222222', 'M1', 'S9', false, '', false], // 退会者が保持したまま残っている行
    ['A2', '911111111', 'M1', 'S1', true, '', false],
  ];
  const { fn, ss } = buildSync(rows);
  const r = fn(ss, 'S1', '22222222');
  assert.equal(r.changed, true);
  assert.notEqual(r.after, '922222222', '既存と同じログインIDにしない');
  assert.equal(r.after, '922222222-1');
});

test('削除済みの認証行は対象にしない', () => {
  const rows: Row[] = [['A1', '911111111', 'M1', 'S1', true, '', true]];
  const { fn, ss } = buildSync(rows);
  assert.equal(fn(ss, 'S1', '22222222').changed, false);
});

test('番号が空なら何もしない', () => {
  const rows: Row[] = [['A1', '911111111', 'M1', 'S1', true, '', false]];
  const { fn, ss } = buildSync(rows);
  assert.equal(fn(ss, 'S1', '   ').changed, false);
});

test('承認処理が同期を呼び、ログインID変更メールを職員本人と申請者へ送る', () => {
  const approve = source.slice(source.indexOf('function approveAdminChangeRequest_('));
  assert.ok(
    approve.includes('syncStaffLoginIdToCmNumber_(ss, String(upd.staffId)'),
    '職員情報変更の承認で同期を呼んでいること',
  );
  assert.ok(
    approve.includes('staffLoginIdNotifications.forEach'),
    'ログインID変更の通知を積んで送っていること',
  );
  assert.ok(
    approve.includes("if (contactEmail && contactEmail !== n.staffEmail) targets.push(contactEmail);"),
    '申請者（代表者）にも送ること。ただし職員本人と同じ宛先なら二重に送らない',
  );
});
