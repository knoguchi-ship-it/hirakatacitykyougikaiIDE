/**
 * 2026-10-11 回帰テスト: テストデータの物理削除（docs/303）。
 *
 * テストデータは「名前の先頭に★」かつ「メールアドレスが @example.invalid」の両方で判定し、
 * previewTestDataPurge_LOG → executeTestDataPurge_APPLY で物理削除する。
 * 実ソースから関数を切り出し、本番の表・*_archive・ログ用スプレッドシートを模した
 * 偽の DB で実際に削除まで動かして確かめる。
 *
 *   1. 印は両方そろったときだけテストデータ（実行）
 *   2. 全テーブルが削除時の扱いで分類されている（新しい表の分類漏れを落とす）
 *   3. 確認していない・期限切れ・別人・内容が変わった実行は止まる（実行）
 *   4. 実行後、テストデータは 0 行になり、実データは 1 行も減らない（実行）
 *   5. 止まるべき場面（申込中・実在事業所の代表者）で止まる（実行）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

test('旧研修ドライランと印を確認しない後片付けは公開しない', () => {
  const registry = fs.readFileSync(path.join(ROOT, 'scripts', 'gas-boundary-utils.mjs'), 'utf8');
  for (const name of ['dryRunTrainingManagement', 'cleanupDryRunTrainingManagement', 'dryRun_physicalDeleteRowsByKey_']) {
    assert.ok(!gas.includes('function ' + name + '('), `${name} が残っている`);
    assert.ok(!registry.includes("'" + name + "'"), `${name} が公開登録に残っている`);
  }
});

function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  let i = gas.indexOf('{', start);
  for (; i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

/** `var NAME = ...;` を切り出す。値が {...} / [...] なら括弧の対応で終わりを決める */
function extractVar(name: string): string {
  const start = gas.indexOf(`var ${name} = `);
  assert.notEqual(start, -1, `${name} が見つからない`);
  const valueStart = start + `var ${name} = `.length;
  const open = gas[valueStart];
  if (open !== '{' && open !== '[') return gas.slice(start, gas.indexOf(';', valueStart) + 1);
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let i = valueStart; i < gas.length; i += 1) {
    if (gas[i] === open) depth += 1;
    else if (gas[i] === close) {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1) + ';';
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

// ── 偽のスプレッドシート ──────────────────────────────────
type Cell = string | number | boolean;
class FakeSheet {
  rows: Cell[][];
  name: string;
  constructor(name: string, headers: string[], records: Record<string, Cell>[]) {
    this.name = name;
    this.rows = [headers, ...records.map((r) => headers.map((h) => (r[h] ?? '') as Cell))];
  }
  get headers() { return this.rows[0] as string[]; }
  getLastRow() {
    for (let i = this.rows.length - 1; i >= 0; i -= 1) if (this.rows[i].some((v) => v !== '')) return i + 1;
    return 0;
  }
  getLastColumn() { return this.headers.length; }
  getMaxRows() { return this.rows.length; }
  getFrozenRows() { return 1; }
  getRange(r: number, c: number, nr: number, nc: number) {
    const self = this;
    return {
      getValues: () => self.rows.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
      setValues: (vals: Cell[][]) => {
        vals.forEach((v, i) => {
          while (self.rows.length < r + i) self.rows.push(self.headers.map(() => ''));
          self.rows[r - 1 + i] = v.slice();
        });
      },
      clearContent: () => { for (let i = 0; i < nr; i += 1) if (self.rows[r - 1 + i]) self.rows[r - 1 + i] = self.headers.map(() => ''); },
    };
  }
  getDataRange() { return this.getRange(1, 1, this.getLastRow(), this.getLastColumn()); }
  deleteRows(start: number, n: number) {
    if (this.rows.length - n <= this.getFrozenRows()) throw new Error('固定されていない行をすべて削除することはできません');
    this.rows.splice(start - 1, n);
  }
  records() { return this.rows.slice(1).filter((r) => r.some((v) => v !== '')).map((r) => Object.fromEntries(this.headers.map((h, i) => [h, r[i]]))); }
}
class FakeBook {
  sheets = new Map<string, FakeSheet>();
  add(name: string, headers: string[], records: Record<string, Cell>[] = []) { this.sheets.set(name, new FakeSheet(name, headers, records)); return this; }
  getSheetByName(name: string) { return this.sheets.get(name) || null; }
}

const H = {
  member: ['会員ID', '会員種別コード', '姓', '名', '勤務先名', '代表メールアドレス', '削除フラグ'],
  staff: ['職員ID', '会員ID', '姓', '名', '氏名', 'メールアドレス', '職員権限コード', '削除フラグ'],
  auth: ['認証ID', 'ログインID', '会員ID', '職員ID', '削除フラグ'],
  apply: ['申込ID', '研修ID', '会員ID', '職員ID', '申込者ID', '外部申込者ID', '申込状態コード', '削除フラグ'],
  external: ['外部申込者ID', '氏名', 'メールアドレス', '削除フラグ'],
  fee: ['会員ID', '対象年度', '削除フラグ'],
  request: ['申請ID', '会員ID', '申請内容JSON', '連絡先メールアドレス', '申請者表示名', '削除フラグ'],
  claim: ['請求ID', '会員ID', '職員ID', '添付ファイルURL', '削除フラグ'],
  payment: ['支払いID', '会員ID', '削除フラグ'],
  generic: ['会員ID', '職員ID', '削除フラグ'],
  whitelist: ['Googleメール', '紐付け会員ID', '削除フラグ'],
  loginHistory: ['ログイン履歴ID', '認証ID'],
  mailDetail: ['明細ID', '受信者ID', '受信者メール'],
  deleteLog: ['ログID', '対象会員IDリスト', '削除前スナップショットJSON'],
  mergeLog: ['ログID', '旧会員ID', '旧職員ID', '新会員ID', '新職員ID'],
  audit: ['監査ログID', '操作日時', '操作者メール', '操作種別', '対象テーブル', '対象レコードID', 'フィールド名', '旧値', '新値'],
};
const T = '@example.invalid';

/** 実データとテストデータが混ざった DB を作る */
function buildDb() {
  const db = new FakeBook()
    .add('T_会員', H.member, [
      { 会員ID: 'M-REAL', 会員種別コード: 'INDIVIDUAL', 姓: '山田', 名: '花子', 代表メールアドレス: 'yamada@example.org' },
      { 会員ID: 'M-REALBIZ', 会員種別コード: 'BUSINESS', 勤務先名: '実在事業所', 代表メールアドレス: 'office@example.org' },
      { 会員ID: 'M-HALF', 会員種別コード: 'INDIVIDUAL', 姓: '★星野', 名: '実在', 代表メールアドレス: 'hoshino@example.org' }, // ★だけ（実在）
      { 会員ID: 'M-T1', 会員種別コード: 'INDIVIDUAL', 姓: '★テスト', 名: '個人', 代表メールアドレス: 't1' + T },
      { 会員ID: 'M-T2', 会員種別コード: 'SUPPORT', 姓: '★テスト', 名: '賛助', 代表メールアドレス: 'T2' + T.toUpperCase() },
      { 会員ID: 'M-TB', 会員種別コード: 'BUSINESS', 勤務先名: '★テスト事業所', 代表メールアドレス: 'tb' + T },
    ])
    .add('T_会員_archive', H.member, [
      { 会員ID: 'M-TA', 会員種別コード: 'INDIVIDUAL', 姓: '★テスト', 名: '論理削除済み', 代表メールアドレス: 'ta' + T },
      { 会員ID: 'M-OLD', 会員種別コード: 'INDIVIDUAL', 姓: '退会', 名: '済み', 代表メールアドレス: 'old@example.org' },
    ])
    .add('T_事業所職員', H.staff, [
      { 職員ID: 'S-REALREP', 会員ID: 'M-REALBIZ', 姓: '実在', 名: '代表', メールアドレス: 'rep@example.org', 職員権限コード: 'REPRESENTATIVE' },
      { 職員ID: 'S-TONLY', 会員ID: 'M-REALBIZ', 姓: '★テスト', 名: '職員', メールアドレス: 'ts' + T, 職員権限コード: 'STAFF' },
      { 職員ID: 'S-TB1', 会員ID: 'M-TB', 姓: '代表', 名: '印なし', メールアドレス: 'x@example.org', 職員権限コード: 'REPRESENTATIVE' },
      { 職員ID: 'S-TB2', 会員ID: 'M-TB', 氏名: '★氏名だけ', メールアドレス: 'tb2' + T, 職員権限コード: 'STAFF' },
    ])
    .add('T_事業所職員_archive', H.staff, [])
    .add('T_認証アカウント', H.auth, [
      { 認証ID: 'A-REAL', ログインID: '1', 会員ID: 'M-REAL' },
      { 認証ID: 'A-REALREP', ログインID: '2', 会員ID: 'M-REALBIZ', 職員ID: 'S-REALREP' },
      { 認証ID: 'A-T1', ログインID: '3', 会員ID: 'M-T1' },
      { 認証ID: 'A-TONLY', ログインID: '4', 会員ID: 'M-REALBIZ', 職員ID: 'S-TONLY' },
      { 認証ID: 'A-TB1', ログインID: '5', 会員ID: 'M-TB', 職員ID: 'S-TB1' },
    ])
    .add('T_認証アカウント_archive', H.auth, [{ 認証ID: 'A-TA', ログインID: '6', 会員ID: 'M-TA' }])
    .add('T_研修申込', H.apply, [
      { 申込ID: 'P-REAL', 研修ID: 'TR1', 会員ID: 'M-REAL', 申込状態コード: 'APPLIED' },
      { 申込ID: 'P-T1', 研修ID: 'TR1', 会員ID: 'M-T1', 申込状態コード: 'CANCELLED' },
      { 申込ID: 'P-TEXT', 研修ID: 'TR1', 外部申込者ID: 'E-T', 申込状態コード: 'CANCELLED' },
      { 申込ID: 'P-REXT', 研修ID: 'TR1', 外部申込者ID: 'E-REAL', 申込状態コード: 'APPLIED' },
    ])
    .add('T_研修申込_archive', H.apply, [])
    .add('T_外部申込者', H.external, [
      { 外部申込者ID: 'E-REAL', 氏名: '外部 太郎', メールアドレス: 'gaibu@example.org' },
      { 外部申込者ID: 'E-T', 氏名: '★テスト 外部', メールアドレス: 'e' + T },
    ])
    .add('T_年会費納入履歴', H.fee, [{ 会員ID: 'M-REAL', 対象年度: 2026 }, { 会員ID: 'M-T1', 対象年度: 2026 }])
    .add('T_年会費納入履歴_archive', H.fee, [{ 会員ID: 'M-TA', 対象年度: 2025 }])
    .add('T_変更申請', H.request, [
      { 申請ID: 'R-REAL', 会員ID: 'M-REAL', 申請内容JSON: '{}', 連絡先メールアドレス: 'yamada@example.org', 申請者表示名: '山田 花子' },
      { 申請ID: 'R-T1', 会員ID: 'M-T1', 申請内容JSON: '{}', 連絡先メールアドレス: 't1' + T, 申請者表示名: '★テスト 個人' },
      { 申請ID: 'R-PENDING', 会員ID: '', 申請内容JSON: '{}', 連絡先メールアドレス: 'new' + T, 申請者表示名: '★テスト 未承認' },
      { 申請ID: 'R-STAFFADD', 会員ID: 'M-REALBIZ', 申請内容JSON: '{"staffId":"S-TONLY"}', 連絡先メールアドレス: 'rep@example.org', 申請者表示名: '実在 代表' },
    ])
    .add('T_請求', H.claim, [
      { 請求ID: 'C-T1', 会員ID: 'M-T1', 添付ファイルURL: JSON.stringify([{ fileId: 'F-IN', url: 'u' }, { fileId: 'F-OUT', url: 'u' }]) },
      { 請求ID: 'C-REAL', 会員ID: 'M-REAL', 添付ファイルURL: JSON.stringify([{ fileId: 'F-REAL', url: 'u' }]) },
    ])
    .add('T_支払い', H.payment, [{ 支払いID: 'PAY-T1', 会員ID: 'M-T1' }, { 支払いID: 'PAY-REAL', 会員ID: 'M-REAL' }])
    .add('T_支払い明細', ['明細ID', '支払いID', '請求ID'], [{ 明細ID: 'D1', 支払いID: 'PAY-T1' }, { 明細ID: 'D2', 支払いID: 'PAY-REAL' }])
    .add('T_年会費更新履歴', H.fee, [])
    .add('T_役員', H.generic, [{ 会員ID: 'M-T1' }, { 会員ID: 'M-REAL' }])
    .add('T_振込口座', H.generic, [{ 会員ID: 'M-REALBIZ', 職員ID: 'S-TONLY' }, { 会員ID: 'M-REALBIZ', 職員ID: 'S-REALREP' }])
    .add('T_管理者Googleホワイトリスト', H.whitelist, [{ Googleメール: 'a@example.org', 紐付け会員ID: 'M-REAL' }])
    .add('T_削除ログ', H.deleteLog, [
      { ログID: 'DL-T', 対象会員IDリスト: 'member:M-TA', 削除前スナップショットJSON: '{"T_会員":[{"姓":"★テスト"}]}' },
      { ログID: 'DL-MIX', 対象会員IDリスト: 'member:M-TA,member:M-OLD', 削除前スナップショットJSON: '{}' },
      { ログID: 'DL-REAL', 対象会員IDリスト: 'member:M-OLD', 削除前スナップショットJSON: '{}' },
    ])
    .add('T_人物統合ログ', H.mergeLog, [
      { ログID: 'ML-T', 旧会員ID: 'M-T1', 新会員ID: 'M-T2' },
      { ログID: 'ML-MIX', 旧会員ID: 'M-T1', 新会員ID: 'M-REAL' },
    ]);
  const logs = new FakeBook()
    .add('T_ログイン履歴', H.loginHistory, [
      { ログイン履歴ID: 'L1', 認証ID: 'A-REAL' }, { ログイン履歴ID: 'L2', 認証ID: 'A-T1' },
      { ログイン履歴ID: 'L3', 認証ID: 'A-TONLY' }, { ログイン履歴ID: 'L4', 認証ID: 'A-TA' },
    ])
    .add('T_メール送信明細', H.mailDetail, [
      { 明細ID: 'MD1', 受信者ID: 'M-REAL', 受信者メール: 'yamada@example.org' },
      { 明細ID: 'MD2', 受信者ID: 'M-T1', 受信者メール: 't1' + T },
      { 明細ID: 'MD3', 受信者ID: 'E-T', 受信者メール: 'e' + T },
    ])
    .add('T_監査ログ', H.audit, []);
  return { db, logs };
}

type Server = {
  isTestMemberRow_: (r: Record<string, unknown>, representativeEmail?: string) => boolean;
  isTestStaffRow_: (r: Record<string, unknown>) => boolean;
  isTestExternalApplicantRow_: (r: Record<string, unknown>) => boolean;
  isTestChangeRequestRow_: (r: Record<string, unknown>) => boolean;
  buildTestDataPurgePlan_: (ss: FakeBook) => { blockers: string[]; totalRows: number; fingerprint: string; memberIds: string[]; staffIds: string[]; externalIds: string[]; remainingChangeRequests: number; counts: Record<string, number> };
  previewTestDataPurge_LOG: () => string;
  executeTestDataPurge_APPLY: () => string;
  takeRowsByMatch_: (s: FakeSheet, m: (r: Record<string, unknown>) => boolean, before?: (t: unknown[]) => void) => unknown[];
};

// props（Script Properties）と trashed（ゴミ箱へ移したファイル）は外から渡せる。
// 別人の実行を試すときは、同じ props を共有する 2 つのサーバーを作る。
function buildServer(env: {
  db: FakeBook; logs: FakeBook; loginId?: string; now?: () => number;
  props?: Map<string, string>; trashed?: string[];
}) {
  const props = env.props || new Map<string, string>();
  const trashed = env.trashed || [];
  const driveFolder: Record<string, string> = { 'F-IN': 'CLAIM-FOLDER', 'F-OUT': 'OTHER', 'F-REAL': 'CLAIM-FOLDER' };
  const deps = {
    db: env.db, logs: env.logs, props, trashed,
    session: { loginId: env.loginId || 'master@example.org', isMaster: true },
    now: env.now || (() => Date.now()),
    sha: (s: string) => [...crypto.createHash('sha256').update(s).digest()].map((b) => (b > 127 ? b - 256 : b)),
    driveFolder,
  };
  const names = [
    'isTestDataName_', 'isTestDataEmail_', 'isTestMemberRow_', 'isTestStaffRow_', 'isTestExternalApplicantRow_',
    'isTestChangeRequestRow_', 'getCascadeMatchers_', 'getTestDataPurgeMatchers_', 'getTestDataPurgeLogMatchers_',
    'readRowsWithArchive_', 'idSetOf_', 'parseClaimAttachmentFileIds_', 'buildTestDataPurgePlan_',
    'formatTestDataPurgePlan_', 'previewTestDataPurge_LOG', 'trashClaimAttachmentFiles_', 'executeTestDataPurge_APPLY',
    'takeRowsByMatch_', 'purgeLoginHistoryByAuthIds_', 'appendAuditLogEntries_', 'getRowsAsObjectsFromSheet_',
    'toBoolean_', 'bytesToHex_',
  ];
  return new Function('deps', `
    ${extractVar('TEST_DATA_NAME_PREFIX')}
    ${extractVar('TEST_DATA_EMAIL_DOMAIN')}
    ${extractVar('TEST_DATA_PURGE_PLAN_KEY')}
    ${extractVar('TEST_DATA_PURGE_PLAN_TTL_MS')}
    ${extractVar('DRYRUN_MANIFEST_KEY')}
    var Date = Object.assign(function() { return new globalThis.Date(); }, { now: deps.now });
    var Logger = { log: function() {} };
    var Utilities = {
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: function(alg, text) { return deps.sha(text); },
      getUuid: function() { return 'uuid-' + Math.random().toString(16).slice(2); },
    };
    var PropertiesService = { getScriptProperties: function() { return {
      getProperty: function(k) { return deps.props.has(k) ? deps.props.get(k) : null; },
      setProperty: function(k, v) { deps.props.set(k, v); },
      deleteProperty: function(k) { deps.props.delete(k); },
    }; } };
    var LockService = { getScriptLock: function() { return { tryLock: function() { return true; }, releaseLock: function() {} }; } };
    var DriveApp = { getFileById: function(id) {
      var parent = deps.driveFolder[id];
      var done = false;
      return {
        getParents: function() { return { hasNext: function() { return !done; }, next: function() { done = true; return { getId: function() { return parent; } }; } }; },
        setTrashed: function() { deps.trashed.push(id); },
      };
    } };
    function assertMasterOperator_() { return deps.session; }
    function getOrCreateDatabase_() { return deps.db; }
    function getLogSs_() { return deps.logs; }
    function getRowsAsObjects_(ss, name) { return getRowsAsObjectsFromSheet_(ss.getSheetByName(name)); }
    function getSystemSettingValue_(ss, key) { return key === 'CLAIM_ATTACHMENT_FOLDER_ID' ? 'CLAIM-FOLDER' : ''; }
    function clearAllDataCache_() {}
    function clearAdminDashboardCache_() {}
    function clearTrainingManagementCache_() {}
    function clearAdminPermissionCaches_() {}
    ${names.map(extractFunction).join('\n')}
    return { ${names.join(', ')} };
  `)(deps) as Server;
}

// ── 1. 印 ───────────────────────────────────────────
test('印は「★で始まる名前」と「@example.invalid」の両方がそろったときだけ', () => {
  const srv = buildServer(buildDb());
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'INDIVIDUAL', 姓: '★テスト', 代表メールアドレス: 'a' + T }), true);
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'SUPPORT', 姓: ' ★テスト', 代表メールアドレス: 'A@EXAMPLE.INVALID' }), true);
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'INDIVIDUAL', 姓: '★テスト', 代表メールアドレス: 'a@example.org' }), false, '★だけ');
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'INDIVIDUAL', 姓: 'テスト', 代表メールアドレス: 'a' + T }), false, 'メールだけ');
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'INDIVIDUAL', 姓: '☆テスト', 代表メールアドレス: 'a' + T }), false, '白い☆は印ではない');
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'INDIVIDUAL', 姓: '★', 代表メールアドレス: T }), false, 'ドメインだけのアドレスは不可');
  // 事業所は事業所名（勤務先名）で見る。姓に★があっても事業所名に無ければ対象外
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'BUSINESS', 勤務先名: '★テスト事業所', 代表メールアドレス: 'a' + T }), true);
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'BUSINESS', 勤務先名: '実在事業所', 姓: '★', 代表メールアドレス: 'a' + T }), false);
  // 申込から作った事業所は代表メールアドレスが空。空のときだけ代表者の職員のメールで見る（2026-10-25）
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'BUSINESS', 勤務先名: '★申込事業所', 代表メールアドレス: '' }, 'r' + T), true);
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'BUSINESS', 勤務先名: '★申込事業所', 代表メールアドレス: '' }, 'r@example.org'), false, '代表者のメールが本物');
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'BUSINESS', 勤務先名: '★事業所', 代表メールアドレス: 'office@example.org' }, 'r' + T), false, '代表メールアドレスがあればそれで見る');
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'BUSINESS', 勤務先名: '★申込事業所', 代表メールアドレス: '' }), false, '代表者がいない');
  assert.equal(srv.isTestMemberRow_({ 会員種別コード: 'INDIVIDUAL', 姓: '★テスト', 代表メールアドレス: '' }, 'r' + T), false, '個人は代表者を見ない');
  assert.equal(srv.isTestStaffRow_({ 姓: '', 氏名: '★氏名', メールアドレス: 's' + T }), true, '姓が空なら氏名');
  assert.equal(srv.isTestExternalApplicantRow_({ 氏名: '★外部', メールアドレス: 'e' + T }), true);
  assert.equal(srv.isTestChangeRequestRow_({ 申請者表示名: '★未承認', 連絡先メールアドレス: 'n' + T }), true);
});

// ── 2. 全テーブルの分類 ────────────────────────────────────
test('テーブル定義の全テーブルが、物理削除での扱いを分類されている（新しい表の分類漏れを落とす）', () => {
  const policy = new Function(`${extractVar('TEST_DATA_PURGE_TABLE_POLICY')}; return TEST_DATA_PURGE_TABLE_POLICY;`)() as Record<string, string>;
  const body = gas.slice(gas.indexOf('var テーブル定義 = {'), gas.indexOf('\n};', gas.indexOf('var テーブル定義 = {'))).replace(/\/\/[^\n]*/g, '');
  const tables = [...body.matchAll(/^\s{2}(T_[^\s:]+):\s*\[/gm)].map((m) => m[1])
    .concat([...gas.matchAll(/^テーブル定義\['(T_[^']+)'\]\s*=/gm)].map((m) => m[1]));
  assert.ok(tables.length >= 28);
  const missing = tables.filter((t) => !policy[t]);
  assert.deepEqual(missing, [], '分類の無いテーブル');
  for (const [t, kind] of Object.entries(policy)) assert.ok(['CASCADE', 'PURGE', 'KEEP', 'NONE'].includes(kind), `${t}: ${kind}`);
  // CASCADE と、実際の連動（getCascadeMatchers_）が一致している
  const cascadeTables = [...extractFunction('getCascadeMatchers_').matchAll(/\['(T_[^']+)'/g)].map((m) => m[1]).sort();
  const policyCascade = Object.entries(policy).filter(([, k]) => k === 'CASCADE').map(([t]) => t).sort();
  assert.deepEqual(policyCascade, cascadeTables);
  // アーカイブを持つ表はすべて CASCADE（アーカイブ側からも消す）
  const archived = [...extractVar('ARCHIVE_SOURCE_TABLES').matchAll(/'(T_[^']+)'/g)].map((m) => m[1]);
  for (const t of archived) assert.equal(policy[t], 'CASCADE', t);
});

// ── 3. 安全装置 ──────────────────────────────────────
test('確認（preview）をしていない実行は止まる', () => {
  const srv = buildServer(buildDb());
  assert.throws(() => srv.executeTestDataPurge_APPLY(), /先に previewTestDataPurge_LOG/);
});

test('確認から 30 分を過ぎた実行は止まる', () => {
  let now = 1_000_000;
  const srv = buildServer({ ...buildDb(), now: () => now });
  srv.previewTestDataPurge_LOG();
  now += 31 * 60 * 1000;
  assert.throws(() => srv.executeTestDataPurge_APPLY(), /30 分を過ぎました/);
});

test('確認したあとにデータが変わったら止まる', () => {
  const env = buildDb();
  const srv = buildServer(env);
  srv.previewTestDataPurge_LOG();
  env.db.getSheetByName('T_会員')!.rows.push(['M-T9', 'INDIVIDUAL', '★追加', '', '', 'x' + T, '']);
  assert.throws(() => srv.executeTestDataPurge_APPLY(), /データが変わりました/);
});

test('確認した人と実行する人が違えば止まる', () => {
  const env = buildDb();
  const props = new Map<string, string>();
  buildServer({ ...env, props, loginId: 'a@example.org' }).previewTestDataPurge_LOG();
  const other = buildServer({ ...env, props, loginId: 'b@example.org' });
  assert.throws(() => other.executeTestDataPurge_APPLY(), /確認した人と実行する人が違います/);
  assert.equal(env.db.getSheetByName('T_会員')!.records().length, 6, '何も消えていない');
});

// ── 4. 実行: テストデータは 0、実データは減らない ──────────────────────
const REAL_KEEP: Record<string, string[]> = {
  T_会員: ['M-REAL', 'M-REALBIZ', 'M-HALF'],
  T_会員_archive: ['M-OLD'],
  T_事業所職員: ['S-REALREP'],
  T_認証アカウント: ['A-REAL', 'A-REALREP'],
  T_研修申込: ['P-REAL', 'P-REXT'],
  T_外部申込者: ['E-REAL'],
  T_変更申請: ['R-REAL', 'R-STAFFADD'],
};

test('確認 → 実行で、印の付いたものと結び付く行がすべて消え、実データは 1 行も減らない', () => {
  const env = buildDb();
  const srv = buildServer(env);
  const preview = JSON.parse(srv.previewTestDataPurge_LOG().replace('__PURGE_JSON__', ''));
  assert.deepEqual(preview.blockers, []);
  assert.deepEqual(preview.memberIds, ['M-T1', 'M-T2', 'M-TA', 'M-TB']);
  assert.deepEqual(preview.staffIds, ['S-TB1', 'S-TB2', 'S-TONLY'], 'テスト事業所の職員は印が無くても一緒に、実在事業所はテスト職員だけ');
  assert.deepEqual(preview.externalIds, ['E-T']);
  assert.equal(preview.remainingChangeRequests, 1, '実在事業所の職員追加の申請は残る（知らせるだけ）');

  const result = JSON.parse(srv.executeTestDataPurge_APPLY().replace('__PURGE_JSON__', ''));
  assert.equal(result.remainingRows, 0, '同じ判定で数え直して 0');

  const ids = (book: FakeBook, sheet: string, col: string) => book.getSheetByName(sheet)!.records().map((r) => String(r[col]));
  assert.deepEqual(ids(env.db, 'T_会員', '会員ID'), REAL_KEEP.T_会員);
  assert.deepEqual(ids(env.db, 'T_会員_archive', '会員ID'), REAL_KEEP.T_会員_archive);
  assert.deepEqual(ids(env.db, 'T_事業所職員', '職員ID'), REAL_KEEP.T_事業所職員);
  assert.deepEqual(ids(env.db, 'T_認証アカウント', '認証ID'), REAL_KEEP.T_認証アカウント);
  assert.deepEqual(ids(env.db, 'T_認証アカウント_archive', '認証ID'), []);
  assert.deepEqual(ids(env.db, 'T_研修申込', '申込ID'), REAL_KEEP.T_研修申込);
  assert.deepEqual(ids(env.db, 'T_外部申込者', '外部申込者ID'), REAL_KEEP.T_外部申込者);
  assert.deepEqual(ids(env.db, 'T_変更申請', '申請ID'), REAL_KEEP.T_変更申請, '承認前のテスト申込も消える');
  assert.deepEqual(ids(env.db, 'T_年会費納入履歴', '会員ID'), ['M-REAL']);
  assert.deepEqual(ids(env.db, 'T_年会費納入履歴_archive', '会員ID'), []);
  assert.deepEqual(ids(env.db, 'T_支払い', '支払いID'), ['PAY-REAL']);
  assert.deepEqual(ids(env.db, 'T_支払い明細', '明細ID'), ['D2']);
  assert.deepEqual(ids(env.db, 'T_役員', '会員ID'), ['M-REAL']);
  assert.deepEqual(env.db.getSheetByName('T_振込口座')!.records().map((r) => r['職員ID']), ['S-REALREP']);
  assert.deepEqual(ids(env.db, 'T_請求', '請求ID'), ['C-REAL']);
  assert.deepEqual(ids(env.db, 'T_削除ログ', 'ログID'), ['DL-MIX', 'DL-REAL'], '対象がすべてテストのものだけ消す');
  assert.deepEqual(ids(env.db, 'T_人物統合ログ', 'ログID'), ['ML-MIX'], '新旧すべてテストのものだけ消す');
  assert.deepEqual(ids(env.logs, 'T_ログイン履歴', 'ログイン履歴ID'), ['L1']);
  assert.deepEqual(ids(env.logs, 'T_メール送信明細', '明細ID'), ['MD1']);
  // 監査ログに 1 行残る
  const audit = env.logs.getSheetByName('T_監査ログ')!.records();
  assert.equal(audit.length, 1);
  assert.equal(audit[0]['操作種別'], 'TEST_DATA_PURGE');
});

test('削除で空いた行はシートから取り除く（中身だけ消して空行を残さない）', () => {
  const env = buildDb();
  const srv = buildServer(env);
  const before = env.db.getSheetByName('T_会員')!.getMaxRows();
  srv.previewTestDataPurge_LOG();
  srv.executeTestDataPurge_APPLY();
  assert.equal(env.db.getSheetByName('T_会員')!.getMaxRows(), before - 3, '本番の表のテスト会員 3 件分の行が消える（M-TA はアーカイブ側）');
});

test('請求の添付は請求添付フォルダ内のファイルだけをゴミ箱へ移す（実データの添付には触れない）', () => {
  const env = buildDb();
  const trashed: string[] = [];
  const srv = buildServer({ ...env, trashed });
  srv.previewTestDataPurge_LOG();
  const result = JSON.parse(srv.executeTestDataPurge_APPLY().replace('__PURGE_JSON__', ''));
  assert.deepEqual(trashed, ['F-IN'], 'F-OUT はフォルダ外、F-REAL は実データの請求');
  assert.deepEqual(result.removed.drive, { trashed: 1, skipped: 1 });
});

// ── 5. 止まるべき場面 ──────────────────────────────────
test('申込中のテストの研修申込があれば止まる（申込者数がずれるため）', () => {
  const env = buildDb();
  env.db.getSheetByName('T_研修申込')!.rows.push(['P-T2', 'TR1', 'M-T1', '', '', '', 'APPLIED', '']);
  const srv = buildServer(env);
  const plan = srv.buildTestDataPurgePlan_(env.db);
  assert.equal(plan.blockers.length, 1);
  srv.previewTestDataPurge_LOG();
  assert.throws(() => srv.executeTestDataPurge_APPLY(), /申込を取り消してください/);
  assert.equal(env.db.getSheetByName('T_会員')!.records().length, 6, '何も消えていない');
});

test('実在の事業所の代表者に印があれば止まる', () => {
  const env = buildDb();
  env.db.getSheetByName('T_事業所職員')!.rows.push(['S-BADREP', 'M-REALBIZ', '★代表', '', '', 'r' + T, 'REPRESENTATIVE', '']);
  const plan = buildServer(env).buildTestDataPurgePlan_(env.db);
  assert.equal(plan.blockers.length, 1);
  assert.match(plan.blockers[0], /代表者は単独では削除できません/);
});

test('申込から作った★事業所（代表メールアドレスが空）は、代表者ごと事業所として消す（止まらない）', () => {
  const env = buildDb();
  env.db.getSheetByName('T_会員')!.rows.push(['M-TAPP', 'BUSINESS', '', '', '★申込事業所', '', '']);
  env.db.getSheetByName('T_事業所職員')!.rows.push(
    ['S-TAPP1', 'M-TAPP', '★テスト', '代表', '', 'a1' + T, 'REPRESENTATIVE', ''],
    ['S-TAPP2', 'M-TAPP', '★テスト', '職員', '', 'a2' + T, 'STAFF', ''],
  );
  const plan = buildServer(env).buildTestDataPurgePlan_(env.db);
  assert.deepEqual(plan.blockers, [], '以前は「実在の事業所の代表者に印」で止まった');
  assert.ok(plan.memberIds.includes('M-TAPP'));
  assert.ok(plan.staffIds.includes('S-TAPP1') && plan.staffIds.includes('S-TAPP2'));
});

test('takeRowsByMatch_: 取り除く前の処理が失敗したら何も消さない', () => {
  const env = buildDb();
  const srv = buildServer(env);
  const sheet = env.db.getSheetByName('T_会員')!;
  const before = JSON.stringify(sheet.rows);
  assert.throws(() => srv.takeRowsByMatch_(sheet, () => true, () => { throw new Error('archive failed'); }), /archive failed/);
  assert.equal(JSON.stringify(sheet.rows), before);
});

test('takeRowsByMatch_: 全行を取り除くときは見出し＋空行 1 行を残す（固定行だけにはできない）', () => {
  const sheet = new FakeSheet('X', ['id'], [{ id: 'a' }, { id: 'b' }]);
  const srv = buildServer(buildDb());
  assert.equal(srv.takeRowsByMatch_(sheet, () => true).length, 2);
  assert.equal(sheet.getMaxRows(), 2);
  assert.equal(sheet.getLastRow(), 1);
});

// ── 6. テスト研修の物理削除（2026-11-03・docs/319 §7）──────────────────────
// 研修専用。印（研修名の★＋問い合わせメール @example.invalid）の研修と、一度きりの既存デモ研修（作成日時 2026-11-03 以前）。
// 会員・職員・印の無い外部申込者（本人データ）・送信ログ・監査ログ・LINE 投稿依頼は残す。
const trainingRules = await import(new URL('../src/shared/trainingRules.mjs', import.meta.url).href);
const HT = {
  training: ['研修ID', '研修名', '開催日', '項目設定JSON', '案内状URL', '作成日時', '削除フラグ'],
  apply: ['申込ID', '研修ID', '会員ID', '職員ID', '外部申込者ID', '申込状態コード', '削除フラグ'],
  external: ['外部申込者ID', '氏名', 'メールアドレス', '削除フラグ'],
  mailLog: ['ログID', '研修ID', '件数'],
  line: ['投稿依頼ID', '対象種別', '対象ID'],
};
const inquiry = (email: string) => JSON.stringify({ fieldConfig: {}, inquiryPerson: '事務局', inquiryEmail: email });

function buildTrainingDb() {
  const db = new FakeBook()
    .add('T_研修', HT.training, [
      { 研修ID: 'TR-T', 研修名: '★テスト研修', 開催日: '2026-12-01 10:00', 項目設定JSON: inquiry('t' + T), 作成日時: '2026-11-10 09:00' },
      { 研修ID: 'TR-HALF', 研修名: '★実在の研修', 開催日: '2026-12-01 10:00', 項目設定JSON: inquiry('real@example.org'), 作成日時: '2026-11-10 09:00' },
      { 研修ID: 'TR-REAL', 研修名: '実在の研修', 開催日: '2026-12-02 10:00', 項目設定JSON: inquiry('real@example.org'), 作成日時: '2026-11-10 09:00' },
      { 研修ID: 'TR-DEMO1', 研修名: 'デモ研修', 開催日: '2026-10-20 10:00', 項目設定JSON: inquiry(''), 案内状URL: 'https://drive/x', 作成日時: '2026-10-01 09:00' },
      { 研修ID: 'TR-DEMO2', 研修名: 'デモ（削除済み）', 開催日: '2026-10-21 10:00', 項目設定JSON: '', 作成日時: '2026-11-03 23:00', 削除フラグ: true },
    ])
    .add('T_研修申込', HT.apply, [
      { 申込ID: 'P-T1', 研修ID: 'TR-T', 外部申込者ID: 'E-T1', 申込状態コード: 'APPLIED' },
      { 申込ID: 'P-REAL', 研修ID: 'TR-REAL', 会員ID: 'M-REAL', 申込状態コード: 'APPLIED' },
      { 申込ID: 'P-REAL2', 研修ID: 'TR-REAL', 外部申込者ID: 'E-T2', 申込状態コード: 'APPLIED' },
      { 申込ID: 'P-D1', 研修ID: 'TR-DEMO1', 会員ID: 'M-REAL', 申込状態コード: 'APPLIED' },
      { 申込ID: 'P-D2', 研修ID: 'TR-DEMO1', 外部申込者ID: 'E-REAL', 申込状態コード: 'APPLIED' },
      { 申込ID: 'P-D3', 研修ID: 'TR-DEMO2', 外部申込者ID: 'E-T3', 申込状態コード: 'CANCELLED' },
    ])
    .add('T_研修申込_archive', HT.apply, [
      { 申込ID: 'P-T2', 研修ID: 'TR-T', 外部申込者ID: 'E-T2', 申込状態コード: 'CANCELLED' },
    ])
    .add('T_外部申込者', HT.external, [
      { 外部申込者ID: 'E-T1', 氏名: '★外部一', メールアドレス: 'e1' + T },
      { 外部申込者ID: 'E-T2', 氏名: '★外部二', メールアドレス: 'e2' + T }, // 実在の研修の申込にも使われている → 残す
      { 外部申込者ID: 'E-T3', 氏名: '★外部三', メールアドレス: 'e3' + T },
      { 外部申込者ID: 'E-REAL', 氏名: '佐藤', メールアドレス: 'sato@example.org' },
    ])
    .add('T_会員', H.member, [{ 会員ID: 'M-REAL', 会員種別コード: 'INDIVIDUAL', 姓: '山田', 代表メールアドレス: 'yamada@example.org' }])
    .add('T_LINE投稿依頼', HT.line, [{ 投稿依頼ID: 'LN1', 対象種別: 'TRAINING', 対象ID: 'TR-DEMO1' }]);
  const logs = new FakeBook()
    .add('T_メール送信明細', H.mailDetail, [
      { 明細ID: 'MD-T1', 受信者ID: 'E-T1', 受信者メール: 'e1' + T },
      { 明細ID: 'MD-T2', 受信者ID: 'E-T2', 受信者メール: 'e2' + T },
      { 明細ID: 'MD-T3', 受信者ID: 'E-T3', 受信者メール: 'e3' + T },
      { 明細ID: 'MD-REAL', 受信者ID: 'E-REAL', 受信者メール: 'sato@example.org' },
      { 明細ID: 'MD-M', 受信者ID: 'M-REAL', 受信者メール: 'yamada@example.org' },
    ])
    .add('T_メール送信ログ', HT.mailLog, [{ ログID: 'ML1', 研修ID: 'TR-T', 件数: 1 }])
    .add('T_監査ログ', H.audit, []);
  return { db, logs };
}

type TrainingPlan = {
  trainingIds: string[]; externalIds: string[]; blockers: string[]; totalRows: number; applicationCount: number;
  remaining: { externalsUnmarked: number; externalsUsedElsewhere: number; mailLogs: number; linePostRequests: number; guideFiles: number };
};
type TrainingServer = {
  previewTrainingTestDataPurge_LOG: () => string; executeTrainingTestDataPurge_APPLY: () => string;
  previewDemoTrainingPurge_LOG: () => string; executeDemoTrainingPurge_APPLY: () => string;
};

function buildTrainingServer(env: { db: FakeBook; logs: FakeBook; loginId?: string; props?: Map<string, string> }) {
  const deps = {
    db: env.db, logs: env.logs, props: env.props || new Map<string, string>(),
    session: { loginId: env.loginId || 'master@example.org', isMaster: true },
    sha: (s: string) => [...crypto.createHash('sha256').update(s).digest()].map((b) => (b > 127 ? b - 256 : b)),
  };
  const names = [
    'isTestDataName_', 'isTestDataEmail_', 'isTestExternalApplicantRow_', 'parseTrainingOptions_', 'isTestTrainingRow_',
    'isTrainingPurgeTarget_', 'buildTrainingPurgePlan_', 'getTrainingPurgeMatchers_', 'getTrainingPurgeMailDetailMatcher_',
    'formatTrainingPurgePlan_', 'previewTrainingPurge_', 'executeTrainingPurge_',
    'previewTrainingTestDataPurge_LOG', 'executeTrainingTestDataPurge_APPLY', 'previewDemoTrainingPurge_LOG', 'executeDemoTrainingPurge_APPLY',
    'readRowsWithArchive_', 'idSetOf_', 'takeRowsByMatch_', 'appendAuditLogEntries_', 'getRowsAsObjectsFromSheet_', 'toBoolean_', 'bytesToHex_',
  ];
  return new Function('deps', `
    ${trainingRules.serializeTrainingRulesForGas()}
    ${extractVar('TEST_DATA_NAME_PREFIX')}
    ${extractVar('TEST_DATA_EMAIL_DOMAIN')}
    ${extractVar('TEST_DATA_PURGE_PLAN_TTL_MS')}
    ${extractVar('TRAINING_PURGE_PLAN_KEY')}
    ${extractVar('DEMO_TRAINING_PURGE_PLAN_KEY')}
    ${extractVar('DEMO_TRAINING_CREATED_UNTIL_YMD_')}
    var Logger = { log: function() {} };
    var Utilities = {
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: function(alg, text) { return deps.sha(text); },
      getUuid: function() { return 'uuid-' + Math.random().toString(16).slice(2); },
    };
    var PropertiesService = { getScriptProperties: function() { return {
      getProperty: function(k) { return deps.props.has(k) ? deps.props.get(k) : null; },
      setProperty: function(k, v) { deps.props.set(k, v); },
      deleteProperty: function(k) { deps.props.delete(k); },
    }; } };
    var LockService = { getScriptLock: function() { return { tryLock: function() { return true; }, releaseLock: function() {} }; } };
    function assertMasterOperator_() { return deps.session; }
    function getOrCreateDatabase_() { return deps.db; }
    function getLogSs_() { return deps.logs; }
    function getRowsAsObjects_(ss, name) { return getRowsAsObjectsFromSheet_(ss.getSheetByName(name)); }
    function clearAllDataCache_() {}
    function clearAdminDashboardCache_() {}
    function clearTrainingManagementCache_() {}
    ${names.map(extractFunction).join('\n')}
    return { ${names.join(', ')} };
  `)(deps) as TrainingServer;
}

const planOf = (s: string) => JSON.parse(s.replace('__TRAINING_PURGE_JSON__', '')) as TrainingPlan;
const idsOf = (book: FakeBook, sheet: string, col: string) => book.getSheetByName(sheet)!.records().map((r) => String(r[col]));

test('研修の印: 研修名の★と問い合わせメールの @example.invalid の両方（旧形式の問い合わせ先も読む）', () => {
  const srv = buildTrainingServer(buildTrainingDb()) as unknown as { isTestTrainingRow_: (r: Record<string, unknown>) => boolean };
  assert.equal(srv.isTestTrainingRow_({ 研修名: '★研修', 項目設定JSON: inquiry('a' + T) }), true);
  assert.equal(srv.isTestTrainingRow_({ 研修名: '★研修', 項目設定JSON: JSON.stringify({ fieldConfig: {}, inquiryContactType: 'EMAIL', inquiryContactValue: 'a' + T }) }), true, '旧形式');
  assert.equal(srv.isTestTrainingRow_({ 研修名: '★研修', 項目設定JSON: inquiry('a@example.org') }), false, '★だけ');
  assert.equal(srv.isTestTrainingRow_({ 研修名: '研修', 項目設定JSON: inquiry('a' + T) }), false, 'メールだけ');
  assert.equal(srv.isTestTrainingRow_({ 研修名: '★研修', 項目設定JSON: '{壊れた' }), false, '読めない設定は対象外');
});

test('テスト研修: 確認 → 実行で印のある研修と申込・テストの外部申込者が消え、ほかは 1 行も減らない', () => {
  const env = buildTrainingDb();
  const srv = buildTrainingServer(env);
  const plan = planOf(srv.previewTrainingTestDataPurge_LOG());
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.trainingIds, ['TR-T'], '★だけの研修は対象外');
  assert.deepEqual(plan.externalIds, ['E-T1'], 'ほかの研修の申込に使われている E-T2 は残す');
  assert.equal(plan.remaining.externalsUsedElsewhere, 1);
  assert.equal(plan.remaining.mailLogs, 1, '送信ログは残す（件数だけ知らせる）');

  const result = JSON.parse(srv.executeTrainingTestDataPurge_APPLY().replace('__TRAINING_PURGE_JSON__', ''));
  assert.equal(result.remainingRows, 0);
  assert.deepEqual(idsOf(env.db, 'T_研修', '研修ID'), ['TR-HALF', 'TR-REAL', 'TR-DEMO1', 'TR-DEMO2']);
  assert.deepEqual(idsOf(env.db, 'T_研修申込', '申込ID'), ['P-REAL', 'P-REAL2', 'P-D1', 'P-D2', 'P-D3']);
  assert.deepEqual(idsOf(env.db, 'T_研修申込_archive', '申込ID'), [], 'アーカイブの申込も消す');
  assert.deepEqual(idsOf(env.db, 'T_外部申込者', '外部申込者ID'), ['E-T2', 'E-T3', 'E-REAL']);
  assert.deepEqual(idsOf(env.logs, 'T_メール送信明細', '明細ID'), ['MD-T2', 'MD-T3', 'MD-REAL', 'MD-M'], '消した外部申込者の明細だけ');
  assert.deepEqual(idsOf(env.logs, 'T_メール送信ログ', 'ログID'), ['ML1']);
  assert.deepEqual(idsOf(env.db, 'T_会員', '会員ID'), ['M-REAL']);
  const audit = env.logs.getSheetByName('T_監査ログ')!.records();
  assert.equal(audit.length, 1);
  assert.equal(audit[0]['操作種別'], 'TRAINING_TEST_DATA_PURGE');
});

test('テスト研修: 会員・職員・印の無い人・見つからない人の申込があれば止まり、何も消さない', () => {
  const cases: Array<[Record<string, string>, RegExp]> = [
    [{ 申込ID: 'P-X', 研修ID: 'TR-T', 会員ID: 'M-REAL' }, /会員・職員の申込があります/],
    [{ 申込ID: 'P-X', 研修ID: 'TR-T', 職員ID: 'S-REAL' }, /会員・職員の申込があります/],
    [{ 申込ID: 'P-X', 研修ID: 'TR-T', 外部申込者ID: 'E-REAL' }, /印の無い外部申込者/],
    [{ 申込ID: 'P-X', 研修ID: 'TR-T', 外部申込者ID: 'E-NONE' }, /が見つかりません/],
    [{ 申込ID: 'P-X', 研修ID: 'TR-T' }, /申込者を確認できません/],
  ];
  for (const [row, message] of cases) {
    const env = buildTrainingDb();
    const sheet = env.db.getSheetByName('T_研修申込')!;
    sheet.rows.push(sheet.headers.map((h) => row[h] ?? ''));
    const srv = buildTrainingServer(env);
    const plan = planOf(srv.previewTrainingTestDataPurge_LOG());
    assert.ok(plan.blockers.some((b) => message.test(b)), `${JSON.stringify(row)}: ${plan.blockers.join(' / ')}`);
    assert.throws(() => srv.executeTrainingTestDataPurge_APPLY(), /削除できません/);
    assert.equal(env.db.getSheetByName('T_研修')!.records().length, 5, '何も消えていない');
  }
});

test('テスト研修: 確認していない・別人・確認後にデータが変わった実行は止まる', () => {
  const env = buildTrainingDb();
  assert.throws(() => buildTrainingServer(env).executeTrainingTestDataPurge_APPLY(), /先に previewTrainingTestDataPurge_LOG/);
  const props = new Map<string, string>();
  buildTrainingServer({ ...env, props, loginId: 'a@example.org' }).previewTrainingTestDataPurge_LOG();
  assert.throws(() => buildTrainingServer({ ...env, props, loginId: 'b@example.org' }).executeTrainingTestDataPurge_APPLY(), /確認した人と実行する人が違います/);
  const srv = buildTrainingServer({ ...env, props, loginId: 'a@example.org' });
  const sheet = env.db.getSheetByName('T_研修')!;
  sheet.rows.push(sheet.headers.map((h) => ({ 研修ID: 'TR-T9', 研修名: '★追加', 項目設定JSON: inquiry('n' + T), 作成日時: '2026-11-10' } as Record<string, string>)[h] ?? ''));
  assert.throws(() => srv.executeTrainingTestDataPurge_APPLY(), /データが変わりました/);
  assert.equal(sheet.records().length, 6, '何も消えていない');
  assert.throws(() => srv.executeDemoTrainingPurge_APPLY(), /先に previewDemoTrainingPurge_LOG/, 'テスト研修の確認ではデモの削除は動かない');
});

test('既存のデモ研修（一度きり）: 2026-11-03 以前に作られた研修と申込を消し、会員と印の無い外部申込者は残す', () => {
  const env = buildTrainingDb();
  const srv = buildTrainingServer(env);
  const plan = planOf(srv.previewDemoTrainingPurge_LOG());
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.trainingIds, ['TR-DEMO1', 'TR-DEMO2'], '作成日 11-03 の 23:00（日本時間）までは含める');
  assert.equal(plan.applicationCount, 3);
  assert.deepEqual(plan.externalIds, ['E-T3'], '印のある外部申込者だけ消す');
  assert.equal(plan.remaining.externalsUnmarked, 1, '印の無い外部申込者（本人データ）は残す');
  assert.equal(plan.remaining.linePostRequests, 1);
  assert.equal(plan.remaining.guideFiles, 1);

  srv.executeDemoTrainingPurge_APPLY();
  assert.deepEqual(idsOf(env.db, 'T_研修', '研修ID'), ['TR-T', 'TR-HALF', 'TR-REAL']);
  assert.deepEqual(idsOf(env.db, 'T_研修申込', '申込ID'), ['P-T1', 'P-REAL', 'P-REAL2'], '会員の申込（P-D1）も研修と一緒に消す。会員は残る');
  assert.deepEqual(idsOf(env.db, 'T_研修申込_archive', '申込ID'), ['P-T2']);
  assert.deepEqual(idsOf(env.db, 'T_外部申込者', '外部申込者ID'), ['E-T1', 'E-T2', 'E-REAL']);
  assert.deepEqual(idsOf(env.db, 'T_会員', '会員ID'), ['M-REAL']);
  assert.deepEqual(idsOf(env.logs, 'T_メール送信明細', '明細ID'), ['MD-T1', 'MD-T2', 'MD-REAL', 'MD-M']);
  assert.deepEqual(idsOf(env.db, 'T_LINE投稿依頼', '投稿依頼ID'), ['LN1'], 'LINE 投稿依頼は残す');
  assert.equal(env.logs.getSheetByName('T_監査ログ')!.records()[0]['操作種別'], 'DEMO_TRAINING_PURGE');
});

test('既存のデモ研修: 作成日時を確認できない研修があれば止まる・11-04 以降に作られた研修は対象外', () => {
  const env = buildTrainingDb();
  const sheet = env.db.getSheetByName('T_研修')!;
  sheet.rows.push(sheet.headers.map((h) => ({ 研修ID: 'TR-NODATE', 研修名: '作成日なし', 作成日時: '' } as Record<string, string>)[h] ?? ''));
  const srv = buildTrainingServer(env);
  const plan = planOf(srv.previewDemoTrainingPurge_LOG());
  assert.ok(plan.blockers.some((b) => /TR-NODATE.*作成日時を確認できません/.test(b)), plan.blockers.join(' / '));
  assert.throws(() => srv.executeDemoTrainingPurge_APPLY(), /削除できません/);
  assert.equal(sheet.records().length, 6, '何も消えていない');
  sheet.rows[sheet.rows.length - 1][sheet.headers.indexOf('作成日時')] = '2026-11-04 00:00';
  assert.deepEqual(planOf(srv.previewDemoTrainingPurge_LOG()).trainingIds, ['TR-DEMO1', 'TR-DEMO2']);
});

test('研修の物理削除は管理 split の保守ツールとして登録し、公開・会員 split には含めない', () => {
  const registry = fs.readFileSync(path.join(ROOT, 'scripts', 'gas-boundary-utils.mjs'), 'utf8');
  const tools = ['previewTrainingTestDataPurge_LOG', 'executeTrainingTestDataPurge_APPLY', 'previewDemoTrainingPurge_LOG', 'executeDemoTrainingPurge_APPLY'];
  for (const name of tools) {
    assert.equal(registry.split("'" + name + "'").length - 1, 2, `${name} の登録`);
    assert.match(extractFunction(name), new RegExp(`^function ${name}\\(\\) \\{\\s+var session = assertMasterOperator_\\('${name}'\\);`), `${name} は先頭で MASTER を確かめる`);
    for (const file of ['backend/Code.gs', 'gas/member/Code.gs']) {
      assert.ok(!fs.readFileSync(path.join(ROOT, file), 'utf8').includes('function ' + name + '('), `${file} に ${name} がある`);
    }
  }
});
