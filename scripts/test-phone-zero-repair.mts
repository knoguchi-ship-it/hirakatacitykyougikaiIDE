/**
 * 2026-10-25 回帰テスト: 先頭の 0 が消えた電話番号を戻す保守ツール（docs/311 §5.5）。
 *
 * 列が書式なしテキストになる前に数値として保存され、0 が落ちた電話番号を直す。
 * 直すのは「数字だけで 9 桁」と「10 桁で 5・7・8・9 から始まる」値だけ。セル単位で書き、行の他の列には触れない。
 * 生成物（管理 split）から実際の関数を取り出し、偽の表で動かす（ミラー実装にしない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const admin = fs.readFileSync(path.join(ROOT, 'gas/admin/Code.gs'), 'utf8')
  + '\n' + fs.readFileSync(path.join(ROOT, 'gas/admin/maintenance.gs'), 'utf8');

function block(src: string, head: string): string {
  const start = src.indexOf(head);
  assert.notEqual(start, -1, `${head} が見つからない`);
  const open = src.slice(start + head.length).search(/[{[]/) + start + head.length;
  const close = src[open] === '{' ? '}' : ']';
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === src[open]) depth += 1;
    else if (src[i] === close && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`${head} の終端が見つからない`);
}

class FakeSheet {
  rows: unknown[][];
  formats: Record<string, string> = {};
  constructor(rows: unknown[][]) { this.rows = rows; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows[0].length; }
  getRange(r: number, c: number, nr = 1, nc = 1) {
    const self = this;
    const range = {
      getValues: () => self.rows.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
      setNumberFormat: (f: string) => { self.formats[`${r},${c}`] = f; return range; },
      setValue: (v: unknown) => { self.rows[r - 1][c - 1] = v; return range; },
    };
    return range;
  }
}

const VARS = ['PHONE_ZERO_REPAIR_COLUMNS_', 'PHONE_ZERO_REPAIR_ID_COLUMNS_'];
const FNS = ['repairedPhoneLeadingZero_', 'maskPhoneForLog_', 'buildPhoneZeroRepairPlan_', 'maskedPhoneZeroRepairItems_',
  'previewPhoneZeroRepair_LOG', 'executePhoneZeroRepair_APPLY', 'bytesToHex_'];

function load(env: { sheets: Record<string, FakeSheet>; props: Map<string, string>; loginId: string; audit: unknown[]; now?: () => number }) {
  const body = `
    var env = arguments[0];
    var PHONE_ZERO_REPAIR_PLAN_KEY = 'PHONE_ZERO_REPAIR_PLAN_V1';
    var TEST_DATA_PURGE_PLAN_TTL_MS = 30 * 60 * 1000;
    ${VARS.map((v) => block(admin, `var ${v} = `) + ';').join('\n')}
    function getOrCreateDatabase_() { return { getSheetByName: function(n) { return env.sheets[n] || null; } }; }
    function assertMasterOperator_() { return { loginId: env.loginId }; }
    function appendAuditLogEntries_(e) { env.audit.push.apply(env.audit, e); return e.length; }
    function clearAllDataCache_() {}
    var Logger = { log: function() {} };
    var Date = { now: env.now || function() { return 1000; } };
    var LockService = { getScriptLock: function() { return { tryLock: function() { return true; }, releaseLock: function() {} }; } };
    var PropertiesService = { getScriptProperties: function() { return {
      getProperty: function(k) { return env.props.has(k) ? env.props.get(k) : null; },
      setProperty: function(k, v) { env.props.set(k, v); }, deleteProperty: function(k) { env.props.delete(k); } }; } };
    var Utilities = { DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: function(_a, s) { return Array.from(env.digest(s)); } };
    ${FNS.map((n) => block(admin, `function ${n}(`)).join('\n')}
    return { ${FNS.join(', ')} };`;
  return new Function(body)({ ...env, digest: (s: string) => crypto.createHash('sha256').update(s).digest() });
}

const H = ['会員ID', '姓', '携帯電話番号', '勤務先電話番号', '勤務先FAX番号', '更新日時'];
function db() {
  return {
    T_会員: new FakeSheet([H,
      ['M1', '山田', '09012345678', 728401234, '072-840-1234', 'T0'],   // 勤務先電話だけ 0 抜け（数値）
      ['M2', '佐藤', 9012345678, '', '728405678', 'T0'],               // 携帯（10 桁・9 始まり）と FAX（文字列の 9 桁）
      ['M3', '鈴木', '0728401234', 12345, '5012345678', 'T0'],          // 0 始まり・短い値は触らない。050 の 0 抜けは直す
    ]),
    T_会員_archive: new FakeSheet([H, ['M9', '退会', '', 661234567, '', 'T0']]),
    T_外部申込者: new FakeSheet([['外部申込者ID', '氏名', '電話番号'], ['E1', '外部', '6612345678']]), // 6 始まりの 10 桁は対象外
  };
}

test('直す値の判定: 9 桁、または 5・7・8・9 から始まる 10 桁の数字だけ', () => {
  const g = load({ sheets: {}, props: new Map(), loginId: 'a', audit: [] });
  const cases: Array<[unknown, string]> = [
    [728401234, '0728401234'], ['120123456', '0120123456'], [9012345678, '09012345678'], ['8012345678', '08012345678'],
    ['5012345678', '05012345678'], ['7012345678', '07012345678'],
    ['0728401234', ''], ['072-840-1234', ''], ['6612345678', ''], ['12345', ''], ['', ''], [null, ''], ['72840123a', ''], ['72840123456', ''],
  ];
  for (const [v, expected] of cases) assert.equal(g.repairedPhoneLeadingZero_(v), expected, String(v));
  assert.equal(g.maskPhoneForLog_('0728401234'), '072*****34');
});

test('確認 → 実行で、対象のセルだけを直し、行の他の列（更新日時を含む）には触れない', () => {
  const sheets = db();
  const before = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(sheets).map(([k, s]) => [k, s.rows]))));
  const env = { sheets, props: new Map<string, string>(), loginId: 'op@example.org', audit: [] as any[] };
  const g = load(env);
  const preview = JSON.parse(g.previewPhoneZeroRepair_LOG().replace('__PHONE_JSON__', ''));
  assert.equal(preview.count, 5);
  assert.ok(preview.items.every((it: any) => it.before.includes('*') && it.after.includes('*')), '番号は伏せて返す');
  const result = JSON.parse(g.executePhoneZeroRepair_APPLY().replace('__PHONE_JSON__', ''));
  assert.deepEqual([result.repaired, result.remaining], [5, 0]);

  const changed: string[] = [];
  for (const [name, sheet] of Object.entries(sheets)) {
    sheet.rows.forEach((row, r) => row.forEach((v, c) => { if (v !== before[name][r][c]) changed.push(`${name}.${before[name][0][c]}@${r + 1}=${v}`); }));
  }
  assert.deepEqual(changed.sort(), [
    'T_会員.勤務先FAX番号@3=0728405678', 'T_会員.勤務先FAX番号@4=05012345678', 'T_会員.勤務先電話番号@2=0728401234',
    'T_会員.携帯電話番号@3=09012345678', 'T_会員_archive.勤務先電話番号@2=0661234567',
  ]);
  assert.ok(Object.values(sheets.T_会員.formats).every((f) => f === '@'), '直したセルは書式なしテキスト');
  assert.equal(env.audit.length, 5);
  assert.deepEqual(env.audit.map((a) => a.operation), Array(5).fill('PHONE_ZERO_REPAIR'));
  assert.ok(!env.props.has('PHONE_ZERO_REPAIR_PLAN_V1'), '確認の記録を消す（同じ確認で 2 回実行させない）');
});

test('確認していない・30 分を過ぎた・別の人・確認後にデータが変わった実行は止まり、何も書かない', () => {
  const run = (setup: (env: any) => void, pattern: RegExp) => {
    const env: any = { sheets: db(), props: new Map<string, string>(), loginId: 'a@example.org', audit: [], now: () => 1000 };
    const g = load(env);
    setup({ env, g });
    const snapshot = JSON.stringify(env.sheets.T_会員.rows);
    assert.throws(() => load(env).executePhoneZeroRepair_APPLY(), pattern);
    assert.equal(JSON.stringify(env.sheets.T_会員.rows), snapshot);
  };
  run(() => {}, /先に previewPhoneZeroRepair_LOG/);
  run(({ env, g }) => { g.previewPhoneZeroRepair_LOG(); env.now = () => 1000 + 31 * 60 * 1000; }, /30 分を過ぎました/);
  run(({ env, g }) => { g.previewPhoneZeroRepair_LOG(); env.loginId = 'b@example.org'; }, /確認した人と実行する人が違います/);
  run(({ env, g }) => { g.previewPhoneZeroRepair_LOG(); env.sheets.T_会員.rows[3][3] = 99887766; env.sheets.T_会員.rows.push(['M4', '', '', 723456789, '', '']); }, /データが変わりました/);
});
