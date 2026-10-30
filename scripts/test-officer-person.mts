/**
 * 2026-10-25 回帰テスト: 役員まわり（T_役員・T_振込口座・T_請求・T_支払い）の人物の参照（docs/307 F31）。
 *
 * 個人・賛助会員は会員ID、事業所職員は職員ID だけで人を指す。以前は約 20 の関数がこの判定を個別に書き、
 * 支払いだけ職員を扱えず（T_支払い に職員ID が無い）、紐づけ変更は役職 1 行ずつしか付け替えなかった。
 * 生成物から実際の関数を取り出し、シートだけを小さな表で差し替えて動かす（ミラー実装にしない・AGENTS L3.1）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { officerPersonKey, officerPersonRef, officerPersonRefFromKey } from '../src/shared/officerPerson.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const admin = read('gas/admin/Code.gs');
const member = read('gas/member/Code.gs');
const source = read('gas-src/Code.full.gs');

function block(src: string, head: string): string {
  const start = src.indexOf(head);
  assert.notEqual(start, -1, `${head} が見つからない`);
  // 見出し（`テーブル定義['T_役員'] = ` は自分の中に [ を含む）の後ろから探す
  const open = src.slice(start + head.length).search(/[{[]/) + start + head.length;
  const close = src[open] === '{' ? '}' : ']';
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === src[open]) depth += 1;
    else if (src[i] === close && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`${head} の終端が見つからない`);
}
const fn = (src: string, name: string) => block(src, `function ${name}(`);
const HELPERS = ['officerPersonRef_', 'officerPersonKey_', 'rowBelongsToOfficerPerson_'];

// ── 小さな表（見出し + 行）で Spreadsheet を差し替える ─────────────────────────
type Table = unknown[][];
function fakeDb(tables: Record<string, Table>) {
  const sheets: Record<string, any> = {};
  for (const [name, values] of Object.entries(tables)) {
    sheets[name] = {
      values,
      getLastRow: () => values.length,
      getLastColumn: () => (values[0] || []).length,
      getRange: (r: number, c: number, nr = 1, nc = 1) => ({
        getValues: () => values.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
        setValues: (v: unknown[][]) => v.forEach((row, i) => { values[r - 1 + i] = row.slice(); }),
      }),
    };
  }
  return { getSheetByName: (n: string) => sheets[n] || null, sheets };
}
const rowsOf = (db: ReturnType<typeof fakeDb>, name: string) => {
  const s = db.sheets[name];
  if (!s) return [];
  const [h, ...rows] = s.values as unknown[][];
  return rows.map((r) => Object.fromEntries((h as string[]).map((k, i) => [k, r[i]])));
};
// GAS の環境（シートの読み書き以外）を差し替える
const ENV = `
  var deps = arguments[0];
  function getOrCreateDatabase_() { return deps.db; }
  function initializeSchemaIfNeeded_() {}
  function clearAllDataCache_() {}
  function toBoolean_(v) { return v === true || String(v).toLowerCase() === 'true'; }
  function getRowsAsObjects_(ss, name) { return deps.rowsOf(ss, name); }
  function findRowByColumnValue_(sheet, col, val) {
    if (!sheet) return null;
    var h = sheet.values[0], c = h.indexOf(col);
    for (var r = 1; r < sheet.values.length; r++) {
      if (String(sheet.values[r][c]) === String(val)) {
        var cols = {}; h.forEach(function(k, i) { cols[k] = i; });
        return { rowNumber: r + 1, row: sheet.values[r].slice(), columns: cols };
      }
    }
    return null;
  }
  function appendRowsByHeaders_(ss, name, objs) {
    var s = ss.getSheetByName(name), h = s.values[0];
    objs.forEach(function(o) { s.values.push(h.map(function(k) { return o[k] === undefined ? '' : o[k]; })); });
  }
  var Utilities = { getUuid: function() { return 'UUID-' + (++deps.seq); }, formatDate: function() { return '2026-10-30'; } };
  var Session = { getActiveUser: function() { return { getEmail: function() { return 'op@example.invalid'; } }; } };
  var LockService = { getScriptLock: function() { return { waitLock: function() {}, releaseLock: function() {} }; } };
`;
function load(src: string, names: string[], extra = '') {
  const body = ENV + extra + names.map((n) => fn(src, n)).join('\n') + `\nreturn { ${names.map((n) => `${n}: ${n}`).join(', ')} };`;
  return (db: ReturnType<typeof fakeDb>) => new Function(body)({ db, rowsOf, seq: 0 }) as Record<string, (...a: any[]) => any>;
}

const OFFICER_H = ['役員ID', '会員ID', '職員ID', '役職コード', '組織コード', '就任日', '退任日', '備考', '削除フラグ', '作成日時', '更新日時'];
const BANK_H = ['口座ID', '会員ID', '職員ID', '金融機関名', '金融機関コード', '支店名', '支店コード', '口座種別', '口座番号', '口座名義カナ', '備考', '削除フラグ', '作成日時', '更新日時'];
const CLAIM_H = ['請求ID', '会員ID', '職員ID', '請求状態', '削除フラグ', '作成日時', '更新日時'];
const PAY_H = ['支払いID', '会員ID', '支払い日', '支払い方法', '合計金額', '振込先口座JSON', '登録者メール', '備考', '削除フラグ', '作成日時', '更新日時', '職員ID'];
const LINE_H = ['明細ID', '支払いID', '請求ID', '役職コード', '組織コード', '種別コード', '金額', '対象期間FROM', '対象期間TO', '摘要', '削除フラグ', '作成日時', '更新日時'];
const officer = (id: string, m: string, s: string, role: string, retired = '') => [id, m, s, role, 'HQ', '2026-04-01', retired, '', false, '', ''];
const bank = (id: string, m: string, s: string, no: string) => [id, m, s, '★銀行', '0001', '★支店', '001', '普通', no, 'テスト', '', false, '', ''];

// ── 1. 人物の参照の規則（GAS と画面で同じ） ────────────────────────────────
test('人物キー: 職員は職員ID だけで決まり、GAS と画面の規則が一致する', () => {
  const gas = new Function(`${HELPERS.slice(0, 2).map((n) => fn(source, n)).join('\n')} return { ref: officerPersonRef_, key: officerPersonKey_ };`)();
  const cases: Array<[string, string]> = [['M1', ''], ['', 'S1'], ['B1', 'S1'], ['', ''], [' M2 ', ''], ['', ' S2 ']];
  for (const [m, s] of cases) {
    assert.equal(gas.key(m, s), officerPersonKey(m, s), `${m}/${s}`);
    assert.deepEqual(gas.ref(m, s), officerPersonRef(m, s), `${m}/${s}`);
  }
  assert.equal(officerPersonKey('B1', 'S1'), 'staff:S1', '事業所職員のセッションは事業所の会員ID も持つが、人は職員ID');
  assert.deepEqual(officerPersonRefFromKey(officerPersonKey('', 'S1')), { memberId: '', staffId: 'S1' });
  assert.deepEqual(officerPersonRefFromKey(officerPersonKey('M1', '')), { memberId: 'M1', staffId: '' });
});

// ── 2. 役員かどうか・口座（会員マイページ側） ──────────────────────────────
test('役員の判定: 職員のセッションは自分の職員ID の役職だけ・事業所の会員ID の役職を拾わない', () => {
  const db = fakeDb({
    T_役員: [OFFICER_H, officer('O1', '', 'S1', 'DIRECTOR'), officer('O2', 'B1', '', 'AUDITOR'), officer('O3', '', 'S2', 'DIRECTOR', '2026-05-01')],
  });
  const g = load(member, [...HELPERS, 'isActiveOfficer_'])(db);
  assert.equal(g.isActiveOfficer_('B1', 'S1', db), true);
  assert.equal(g.isActiveOfficer_('B1', 'S9', db), false, '事業所の会員ID（B1）で別の行を拾っていない');
  assert.equal(g.isActiveOfficer_('B1', '', db), true, '個人・賛助会員としての B1');
  assert.equal(g.isActiveOfficer_('B1', 'S2', db), false, '退任済み');
});

test('口座: サーバも画面と同じ形（金融機関 4 桁・支店 3 桁・口座 1〜7 桁の数字）を確かめ、0 始まりは文字列のまま渡す', () => {
  const db = fakeDb({ T_振込口座: [BANK_H] });
  const g = load(admin, [...HELPERS, 'saveBankAccount_'])(db);
  const ok = { staffId: 'S1', bankName: '★銀行', bankCode: '0005', branchName: '★支店', branchCode: '012', accountNumber: '0123456', accountHolderKana: 'テスト' };
  g.saveBankAccount_(ok);
  const [a] = rowsOf(db, 'T_振込口座');
  assert.deepEqual([a['金融機関コード'], a['支店コード'], a['口座番号']], ['0005', '012', '0123456']);
  assert.throws(() => g.saveBankAccount_({ ...ok, bankCode: '5' }), /金融機関コードは4桁/);
  assert.throws(() => g.saveBankAccount_({ ...ok, branchCode: '12a' }), /支店コードは3桁/);
  assert.throws(() => g.saveBankAccount_({ ...ok, accountNumber: '12345678' }), /口座番号は1〜7桁/);
  assert.equal(rowsOf(db, 'T_振込口座').length, 1, '形の違う値は書かない');
});

// ── 3. 支払い: 職員の役員を受取人にできる ──────────────────────────────────
test('支払い: 事業所職員の役員を受取人にでき、本人の口座を写す', () => {
  const db = fakeDb({
    T_事業所職員: [['職員ID', '会員ID', '姓', '名', '削除フラグ'], ['S1', 'B1', '★職員', '花子', false]],
    T_会員: [['会員ID', '姓', '名', '削除フラグ'], ['B1', '', '', false], ['M1', '★個人', '太郎', false]],
    T_振込口座: [BANK_H, bank('A1', 'B1', '', '1111111'), bank('A2', '', 'S1', '2222222')],
    T_支払い: [PAY_H],
    T_支払い明細: [LINE_H],
    T_請求: [CLAIM_H],
  });
  const g = load(admin, [...HELPERS, 'getSheetHeaderIndex_', 'getBankAccount_', 'savePayment_'])(db);
  g.savePayment_({ staffId: 'S1', paymentDate: '2026-10-25', paymentMethod: '振込', totalAmount: 1000, lines: [{ amount: 1000, typeCode: 'TRANSPORT' }] });
  const [p] = rowsOf(db, 'T_支払い');
  assert.equal(p['職員ID'], 'S1');
  assert.equal(p['会員ID'], '', '受取人は役員本人（事業所の会員ID ではない）');
  assert.equal(JSON.parse(String(p['振込先口座JSON']))['口座番号'], '2222222', '本人の口座を写す（事業所の口座ではない）');
  assert.throws(() => g.savePayment_({ totalAmount: 0, lines: [{ amount: 0 }] }), /受取人/);
});

test('支払い: 職員ID の列が無い古い表には職員の支払いを書かない（受取人が黙って落ちるのを防ぐ）', () => {
  const db = fakeDb({
    T_事業所職員: [['職員ID', '会員ID', '削除フラグ'], ['S1', 'B1', false]],
    T_支払い: [PAY_H.slice(0, -1)],
  });
  const g = load(admin, [...HELPERS, 'getSheetHeaderIndex_', 'getBankAccount_', 'savePayment_'])(db);
  assert.throws(() => g.savePayment_({ staffId: 'S1', totalAmount: 1, lines: [{ amount: 1 }] }), /職員ID」の列がありません/);
  assert.equal(rowsOf(db, 'T_支払い').length, 0);
});

test('支払い履歴: 人物で絞り込み、職員の役員は氏名（事業所名）で出す', () => {
  const db = fakeDb({
    T_支払い: [PAY_H, ['P1', '', '', '', 0, '', '', '', false, '', '', 'S1'], ['P2', 'M1', '', '', 0, '', '', '', false, '', '', '']],
    T_支払い明細: [LINE_H],
    T_会員: [['会員ID', '姓', '名', '勤務先名'], ['B1', '', '', '★事業所'], ['M1', '★個人', '太郎', '']],
    T_事業所職員: [['職員ID', '会員ID', '姓', '名', '氏名'], ['S1', 'B1', '★職員', '花子', '']],
  });
  const g = load(admin, [...HELPERS, 'officerPersonDisplay_', 'getPaymentHistory_'])(db);
  const staffOnly = g.getPaymentHistory_({ staffId: 'S1' });
  assert.deepEqual(staffOnly.map((p: any) => p['支払いID']), ['P1']);
  assert.equal(staffOnly[0]['表示名'], '★職員 花子（★事業所）');
  assert.deepEqual(g.getPaymentHistory_({ memberId: 'M1' }).map((p: any) => p['支払いID']), ['P2']);
  assert.equal(g.getPaymentHistory_({}).length, 2);
});

// ── 4. 紐づけ変更は人単位 ────────────────────────────────────────────────
function linkageDb() {
  return fakeDb({
    T_役員: [OFFICER_H,
      officer('O1', '', 'S1', 'DIRECTOR'), officer('O2', '', 'S1', 'PR_MEMBER'), officer('O3', 'M5', '', 'AUDITOR')],
    T_振込口座: [BANK_H, bank('A1', '', 'S1', '1111111'), bank('A5', 'M5', '', '5555555')],
    T_請求: [CLAIM_H, ['C1', '', 'S1', '承認済み', false, '', ''], ['C5', 'M5', '', '申請中', false, '', '']],
    T_支払い: [PAY_H, ['P1', '', '', '', 0, '', '', '', false, '', '', 'S1']],
    T_会員: [['会員ID', '削除フラグ'], ['M9', false], ['M5', false]],
    T_事業所職員: [['職員ID', '職員状態コード', '削除フラグ'], ['S1', 'ENROLLED', false], ['S7', 'ENROLLED', false]],
  });
}
const loadLinkage = load(admin, [...HELPERS, 'getBankAccount_', 'rebindPersonReferenceTable_', 'updateOfficerLinkage_'],
  `var OFFICER_PERSON_TABLES_ = ${block(source, 'var OFFICER_PERSON_TABLES_ = ').replace('var OFFICER_PERSON_TABLES_ = ', '')};\n`);

test('事業所職員の移行は本人の参照だけを付け替え、事業所や同僚の参照に触れない', () => {
  const db = fakeDb({ T_役員: [OFFICER_H,
    officer('self', '', 'S1', 'DIRECTOR'), officer('other', '', 'S2', 'DIRECTOR'),
    officer('office', 'B1', '', 'DIRECTOR'), officer('both-other', 'B1', 'S2', 'DIRECTOR')] });
  const g = load(source, [...HELPERS, 'rebindPersonReferenceTable_'])(db);
  assert.equal(g.rebindPersonReferenceTable_(db, 'T_役員', 'B1', 'S1', 'M1', '', 'date'), 1);
  assert.deepEqual(rowsOf(db, 'T_役員').map(r => [r['会員ID'], r['職員ID']]),
    [['M1', ''], ['', 'S2'], ['B1', ''], ['B1', 'S2']]);
});

test('個人会員から職員への付け替えは、職員IDだけを人物の参照として保存する', () => {
  const db = fakeDb({ T_役員: [OFFICER_H, officer('self', 'M1', '', 'DIRECTOR')] });
  const g = load(source, [...HELPERS, 'rebindPersonReferenceTable_'])(db);
  assert.equal(g.rebindPersonReferenceTable_(db, 'T_役員', 'M1', '', 'B1', 'S1', 'date'), 1);
  const [row] = rowsOf(db, 'T_役員');
  assert.deepEqual([row['会員ID'], row['職員ID']], ['', 'S1']);
});

test('個人会員から事業所職員への転籍は本人の会員・認証・研修・役員参照を一貫して移す', () => {
  const memberHeaders = ['会員ID', '会員種別コード', '会員状態コード', '職員数上限', '介護支援専門員番号', '姓', '名', 'セイ', 'メイ', '代表メールアドレス', '更新日時', '削除フラグ', '移行日'];
  const staffHeaders = ['職員ID', '会員ID', '職員状態コード', '介護支援専門員番号', '姓', '名', 'セイ', 'メイ', '氏名', 'フリガナ', 'メールアドレス', '職員権限コード', '削除フラグ'];
  const authHeaders = ['認証ID', '会員ID', '職員ID', 'システムロールコード', 'アカウント有効フラグ', '削除フラグ', '更新日時'];
  const appHeaders = ['申込ID', '会員ID', '職員ID', '申込者ID', '削除フラグ', '更新日時'];
  const db = fakeDb({
    T_会員: [memberHeaders, ['M1', 'INDIVIDUAL', 'ACTIVE', '', '12345678', '★試験', '太郎', 'シケン', 'タロウ', 'member@example.invalid', '', false, ''], ['B1', 'BUSINESS', 'ACTIVE', '3', '', '', '', '', '', 'office@example.invalid', '', false, '']],
    T_事業所職員: [staffHeaders, ['S2', 'B1', 'ENROLLED', '87654321', '★別人', '', '', '', '', '', 'other@example.invalid', 'STAFF', false]],
    T_認証アカウント: [authHeaders, ['A1', 'M1', '', 'INDIVIDUAL_MEMBER', true, false, '']],
    T_研修申込: [appHeaders, ['T1', 'M1', '', 'M1', false, ''], ['T2', 'B1', 'S2', 'B1', false, '']],
    T_役員: [OFFICER_H, officer('O1', 'M1', '', 'DIRECTOR'), officer('O2', '', 'S2', 'DIRECTOR')],
    T_振込口座: [BANK_H], T_請求: [CLAIM_H], T_支払い: [PAY_H],
    T_人物統合ログ: [['ログID', '処理種別', '旧会員ID', '新会員ID', '新職員ID']],
  });
  const extra = `
    var OFFICER_PERSON_TABLES_ = ['T_役員', 'T_振込口座', 'T_請求', 'T_支払い'];
    function getSystemSettingValue_() { return '3'; }
    function hasMasterOption_() { return true; }
    function uniqueStrings_(xs) { return Array.from(new Set(xs)); }
    function clearAdminDashboardCache_() {}
    function clearTrainingManagementCache_() {}
    function notifyMembershipChatSafely_() { throw new Error('正常時は通知しない'); }
    var Logger = { log: function() {} };
  `;
  const names = [...HELPERS, 'getBusinessStaffLimitInfo_', 'isInactiveMemberStatusForIdentity_', 'inspectMemberConversionData_',
    'rebindAuthPrincipal_', 'syncWhitelistMemberLinkByAuthIds_', 'migrateTrainingApplications_', 'rebindPersonReferenceTable_',
    'migratePersonOwnedReferences_', 'appendPersonMergeLog_', 'convertIndividualToStaff_', 'convertMemberType_'];
  const untouchedBefore = [rowsOf(db, 'T_会員')[1], rowsOf(db, 'T_事業所職員')[0], rowsOf(db, 'T_研修申込')[1], rowsOf(db, 'T_役員')[1]];
  const result = load(source, names, extra)(db).convertMemberType_({ direction: 'INDIVIDUAL_TO_STAFF', sourceMemberId: 'M1', targetOfficeMemberId: 'B1', staffRole: 'STAFF' });
  assert.equal(result.converted, true);
  const staffId = result.newStaffId;
  assert.ok(staffId);
  assert.equal(rowsOf(db, 'T_会員')[0]['会員状態コード'], 'TRANSFERRED');
  assert.deepEqual(rowsOf(db, 'T_認証アカウント').map(r => [r['会員ID'], r['職員ID']]), [['B1', staffId]]);
  assert.deepEqual(rowsOf(db, 'T_研修申込').map(r => [r['会員ID'], r['職員ID'], r['申込者ID']]), [['B1', staffId, 'B1'], ['B1', 'S2', 'B1']]);
  assert.deepEqual(rowsOf(db, 'T_役員').map(r => [r['会員ID'], r['職員ID']]), [['', staffId], ['', 'S2']]);
  assert.deepEqual([rowsOf(db, 'T_会員')[1], rowsOf(db, 'T_事業所職員')[0], rowsOf(db, 'T_研修申込')[1], rowsOf(db, 'T_役員')[1]], untouchedBefore);
});

test('事業所職員から個人会員への転換は本人だけの認証・研修・役員参照を移す', () => {
  const memberHeaders = ['会員ID', '会員種別コード', '会員状態コード', '介護支援専門員番号', '入会日', '退会日', '移行日', '姓', '名', 'セイ', 'メイ', '代表メールアドレス', '更新日時', '削除フラグ'];
  const staffHeaders = ['職員ID', '会員ID', '職員状態コード', '介護支援専門員番号', '姓', '名', 'セイ', 'メイ', '氏名', 'フリガナ', 'メールアドレス', '職員権限コード', '退会日', '更新日時', '削除フラグ'];
  const authHeaders = ['認証ID', '会員ID', '職員ID', 'システムロールコード', 'アカウント有効フラグ', '削除フラグ', '更新日時'];
  const appHeaders = ['申込ID', '会員ID', '職員ID', '申込者ID', '削除フラグ', '更新日時'];
  const db = fakeDb({
    T_会員: [memberHeaders, ['B1', 'BUSINESS', 'ACTIVE', '', '', '', '', '', '', '', '', 'office@example.invalid', '', false], ['M1', 'INDIVIDUAL', 'WITHDRAWN', '12345678', '', '', '', '★試験', '太郎', 'シケン', 'タロウ', 'member@example.invalid', '', false]],
    T_事業所職員: [staffHeaders, ['S1', 'B1', 'ENROLLED', '12345678', '★試験', '太郎', 'シケン', 'タロウ', '★試験 太郎', 'シケン タロウ', 'member@example.invalid', 'STAFF', '', '', false], ['S2', 'B1', 'ENROLLED', '87654321', '★別人', '', '', '', '★別人', '', 'other@example.invalid', 'STAFF', '', '', false]],
    T_認証アカウント: [authHeaders, ['A1', 'B1', 'S1', 'BUSINESS_MEMBER', true, false, '']],
    T_研修申込: [appHeaders, ['T1', 'B1', 'S1', 'B1', false, ''], ['T2', 'B1', 'S2', 'B1', false, '']],
    T_役員: [OFFICER_H, officer('O1', '', 'S1', 'DIRECTOR'), officer('O2', '', 'S2', 'DIRECTOR'), officer('O3', 'B1', '', 'AUDITOR')],
    T_振込口座: [BANK_H], T_請求: [CLAIM_H], T_支払い: [PAY_H],
    T_人物統合ログ: [['ログID', '処理種別', '旧会員ID', '旧職員ID', '新会員ID']],
  });
  const extra = `
    var OFFICER_PERSON_TABLES_ = ['T_役員', 'T_振込口座', 'T_請求', 'T_支払い'];
    function uniqueStrings_(xs) { return Array.from(new Set(xs)); }
    function clearAdminDashboardCache_() {}
    function clearTrainingManagementCache_() {}
    function notifyMembershipChatSafely_() { throw new Error('正常時は通知しない'); }
    function normalizeStaffNameFields_(row) { return { name: row['氏名'], kana: row['フリガナ'], lastName: row['姓'], firstName: row['名'], lastKana: row['セイ'], firstKana: row['メイ'] }; }
  `;
  const names = [...HELPERS, 'inspectMemberConversionData_', 'rebindAuthPrincipal_', 'syncWhitelistMemberLinkByAuthIds_',
    'migrateTrainingApplications_', 'rebindPersonReferenceTable_', 'migratePersonOwnedReferences_', 'appendPersonMergeLog_',
    'convertStaffToIndividual_', 'convertMemberType_'];
  const untouchedBefore = [rowsOf(db, 'T_会員')[0], rowsOf(db, 'T_事業所職員')[1], rowsOf(db, 'T_研修申込')[1], rowsOf(db, 'T_役員')[1], rowsOf(db, 'T_役員')[2]];
  const result = load(source, names, extra)(db).convertMemberType_({ direction: 'STAFF_TO_INDIVIDUAL', sourceMemberId: 'B1', sourceStaffId: 'S1' });
  assert.equal(result.newMemberId, 'M1');
  assert.equal(rowsOf(db, 'T_会員')[1]['会員状態コード'], 'ACTIVE');
  assert.equal(rowsOf(db, 'T_事業所職員')[0]['職員状態コード'], 'LEFT');
  assert.deepEqual(rowsOf(db, 'T_認証アカウント').map(r => [r['会員ID'], r['職員ID']]), [['M1', '']]);
  assert.deepEqual(rowsOf(db, 'T_研修申込').map(r => [r['会員ID'], r['職員ID'], r['申込者ID']]), [['M1', '', 'M1'], ['B1', 'S2', 'B1']]);
  assert.deepEqual(rowsOf(db, 'T_役員').map(r => [r['会員ID'], r['職員ID']]), [['M1', ''], ['', 'S2'], ['B1', '']]);
  assert.deepEqual([rowsOf(db, 'T_会員')[0], rowsOf(db, 'T_事業所職員')[1], rowsOf(db, 'T_研修申込')[1], rowsOf(db, 'T_役員')[1], rowsOf(db, 'T_役員')[2]], untouchedBefore);
});

test('紐づけ変更: その人のすべての役職と口座・請求・支払いをまとめて付け替え、他の人には触れない', () => {
  const db = linkageDb();
  const g = loadLinkage(db);
  const res = g.updateOfficerLinkage_({ officerId: 'O1', newMemberId: 'M9' });
  assert.deepEqual(res.counts, { T_役員: 2, T_振込口座: 1, T_請求: 1, T_支払い: 1 });
  const key = (r: any) => officerPersonKey(r['会員ID'] as string, r['職員ID'] as string);
  assert.deepEqual(rowsOf(db, 'T_役員').map(key), ['member:M9', 'member:M9', 'member:M5'], '役職を 2 つ持つ人の両方が移る');
  assert.deepEqual(rowsOf(db, 'T_振込口座').map(key), ['member:M9', 'member:M5']);
  assert.deepEqual(rowsOf(db, 'T_請求').map(key), ['member:M9', 'member:M5']);
  assert.deepEqual(rowsOf(db, 'T_支払い').map(key), ['member:M9']);
});

test('紐づけ変更: 同じ役職が 2 つ現職になる・口座が 2 つになるときは、書き込む前に止める', () => {
  const clashDb = linkageDb();
  clashDb.sheets['T_役員'].values.push(officer('O8', 'M9', '', 'DIRECTOR'));
  const before = JSON.stringify(clashDb.sheets);
  assert.throws(() => loadLinkage(clashDb).updateOfficerLinkage_({ officerId: 'O1', newMemberId: 'M9' }), /同じ役職にすでに就任/);
  assert.equal(JSON.stringify(clashDb.sheets), before, '何も書いていない');

  const bankDb = linkageDb();
  const beforeBank = JSON.stringify(bankDb.sheets);
  assert.throws(() => loadLinkage(bankDb).updateOfficerLinkage_({ officerId: 'O1', newMemberId: 'M5' }), /同じ役職|振込口座/);
  assert.equal(JSON.stringify(bankDb.sheets), beforeBank);
  bankDb.sheets['T_役員'].values = bankDb.sheets['T_役員'].values.filter((r: unknown[]) => r[0] !== 'O3');
  assert.throws(() => loadLinkage(bankDb).updateOfficerLinkage_({ officerId: 'O1', newMemberId: 'M5' }), /振込口座が登録されています/);

  assert.throws(() => loadLinkage(linkageDb()).updateOfficerLinkage_({ officerId: 'O1', newStaffId: 'S1' }), /今と同じ人物/);
});

// ── 5. 会員の削除・人物の統合も支払いを職員で探す ───────────────────────────
test('会員の削除: 職員の役員への支払いも、その職員と一緒にアーカイブへ移す対象になる', () => {
  const matchers = new Function(`${fn(admin, 'getCascadeMatchers_')} return getCascadeMatchers_;`)()({}, { S1: true }, {});
  const pay = matchers.find((m: any) => m[0] === 'T_支払い')[1];
  assert.equal(pay({ 会員ID: '', 職員ID: 'S1' }), true);
  assert.equal(pay({ 会員ID: '', 職員ID: 'S2' }), false);
  for (const name of ['runDeleteCascade_', 'buildLogicalDeletePlan_', 'buildTestDataPurgePlan_']) {
    assert.match(fn(admin, name), /T_支払い[\s\S]*?staffIdSet\[String\((payRows\[p\]|row)\['職員ID'\]/, `${name}: 支払いを職員ID で集めていない`);
  }
});

test('人物の統合: 役員まわり 4 表を同じく付け替える（支払いも職員を含めて）', () => {
  const body = fn(admin, 'migratePersonOwnedReferences_');
  assert.match(body, /OFFICER_PERSON_TABLES_\.forEach/);
  assert.deepEqual(new Function(`${block(source, 'var OFFICER_PERSON_TABLES_ = ')}; return OFFICER_PERSON_TABLES_;`)(),
    ['T_役員', 'T_振込口座', 'T_請求', 'T_支払い']);
  // 役員まわりの表は `テーブル定義['T_役員'] = [...]` で 1 本ずつ定義されている
  for (const t of ['T_役員', 'T_振込口座', 'T_請求', 'T_支払い']) {
    const def = block(source, `テーブル定義['${t}'] = `);
    const cols = new Function(`return ${def.slice(def.indexOf('= [') + 2)};`)() as string[];
    assert.ok(cols.includes('会員ID') && cols.includes('職員ID'), `${t} に会員ID と職員ID がそろっていない`);
  }
});

// ── 6. 判定を直書きしない ────────────────────────────────────────────────
test('役員まわりの関数は人物の判定を直書きしない（共通関数を通す）', () => {
  const names = ['isActiveOfficer_', 'getMemberOfficerStatus_', 'getOfficerSelectableOrganizationCodes_', 'assignOfficer_',
    'updateOfficerRecord_', 'autoRetireOfficerByStaffId_', 'saveClaim_', 'getClaims_', 'getMyClaims_', 'deleteMyClaim_',
    'uploadClaimAttachment_', 'removeClaimAttachment_', 'getBankAccount_', 'saveBankAccount_', 'saveMemberBankAccount_',
    'deleteBankAccount_', 'savePayment_', 'getPaymentHistory_', 'updateOfficerLinkage_', 'getOfficerManagementData_'];
  // `!memberId && !staffId`（どちらも無ければ止める）は判定ではないので許す
  const banned = [/(^|[^!\w])memberId\s*&&\s*!staffId/, /staffId\s*\?\s*''\s*:\s*memberId/, /\['職員ID'\][^;\n]*===\s*(String\()?staffId/, /\['会員ID'\][^;\n]*===\s*(String\()?memberId/];
  for (const name of names) {
    const body = fn(source, name);
    for (const re of banned) assert.ok(!re.test(body), `${name} に人物の判定の直書きがある: ${re}`);
  }
  for (const file of ['src/components/PaymentHistoryConsole.tsx', 'src/components/ClaimManagementConsole.tsx']) {
    assert.ok(!/\.会員ID\s*(===|!==)/.test(read(file)), `${file} が会員ID だけで人を区別している`);
  }
});
