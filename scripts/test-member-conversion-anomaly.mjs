import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../gas-src/Code.full.gs', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end < 0 ? source.length : end);
}
function extractVar(name) {
  const start = source.indexOf(`var ${name} = [`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const end = source.indexOf('\n];', start);
  assert.ok(end > start, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

// 構造確認の一覧は実ソースの定数をそのまま使う（テスト側に複製しない）
const requiredDecl = extractVar('MEMBER_CONVERSION_REQUIRED_COLUMNS_');
const required = new Function(`${requiredDecl}\nreturn MEMBER_CONVERSION_REQUIRED_COLUMNS_;`)();
const tables = Object.fromEntries(required.map(r => [r.table, r.columns.slice()]));

// テーブル定義の列（`  T_x: [ ... ]` と `テーブル定義['T_x'] = [ ... ]` の両形式）
function definedColumns(table) {
  const markers = [`\n  ${table}: [`, `テーブル定義['${table}'] = [`];
  for (const marker of markers) {
    const start = source.indexOf(marker);
    if (start < 0) continue;
    const end = source.indexOf(']', start + marker.length);
    const body = source.slice(start + marker.length, end)
      .split('\n').map(line => line.replace(/\/\/.*$/, '')).join('\n');
    return [...body.matchAll(/'([^']+)'/g)].map(m => m[1]);
  }
  return null;
}

// 移行本体の外側（操作ID・一括更新・キャッシュ）の差し替え。移行本体はこのファイルでは呼ばない
const COMMIT_STUBS = `
    const Utilities = { getUuid: () => 'uuid-1' };
    const findMemberConversionRecord_ = () => null;
    const createSheetWriteTx_ = () => ({});
    const txCommit_ = () => ({ status: 'APPLIED' });
    const confirmConversionAppliedViaApi_ = () => 'UNKNOWN';
    const clearAllDataCache_ = () => {};
    const clearAdminDashboardCache_ = () => {};
    const clearTrainingManagementCache_ = () => {};
    ${extract('normalizeConversionOperationId_')}
`;

const makeDb = (defs) => ({ getSheetByName: name => {
  const headers = defs[name];
  return headers ? { getLastColumn: () => headers.length, getRange: () => ({ getValues: () => [headers] }) } : null;
} });

function runner(defs, send) {
  let converted = 0;
  const db = makeDb(defs);
  const run = new Function('deps', `
    const getOrCreateDatabase_ = () => deps.db;
    const LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
    const notifyMembershipChatSafely_ = deps.send;
    const convertStaffToIndividual_ = () => ++deps.converted;
    const convertIndividualToStaff_ = () => ++deps.converted;
    ${COMMIT_STUBS}
    ${requiredDecl}
    ${extract('inspectMemberConversionData_')}
    ${extract('convertMemberTypeOn_')}
    ${extract('convertMemberType_')}
    return convertMemberType_;
  `)({ db, send, get converted() { return converted; }, set converted(v) { converted = v; } });
  return { run, converted: () => converted };
}

test('正常な表・列では共通処理に進み、異常通知は行わない', () => {
  const notifications = [];
  const t = runner(tables, (...args) => notifications.push(args));
  assert.equal(t.run({ direction: 'INDIVIDUAL_TO_STAFF' }), 1);
  assert.equal(notifications.length, 0);
});
test('表または必要列が無い場合は書込み前に止まり、既存の通知出口を呼ぶ', () => {
  for (const defs of [
    { ...tables, 'T_研修申込': undefined },
    { ...tables, 'T_研修申込': [] },
    { ...tables, 'T_研修申込': ['会員ID', '申込者ID', '削除フラグ'] },
    { ...tables, 'T_認証アカウント': undefined },
    { ...tables, 'T_認証アカウント': ['会員ID', '職員ID', 'システムロールコード', 'アカウント有効フラグ', '削除フラグ'] },
  ]) {
    const notifications = [];
    const t = runner(defs, (...args) => notifications.push(args));
    assert.throws(() => t.run({ direction: 'INDIVIDUAL_TO_STAFF' }), /移行に必要なデータ構造を確認できません/);
    assert.equal(t.converted(), 0);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0][1], 'ANOMALY');
  }
});
test('通常の入力不備では異常通知しない', () => {
  const notifications = [];
  const t = runner(tables, (...args) => notifications.push(args));
  assert.throws(() => t.run({ direction: 'UNKNOWN' }), /不明な direction/);
  assert.equal(notifications.length, 0);
});
test('通知が無効または送信に失敗しても、異常を検出した移行は止まる', () => {
  for (const result of [{ skipped: true }, { sent: false }]) {
    const t = runner({ ...tables, 'T_研修申込': undefined }, () => result);
    assert.throws(() => t.run({ direction: 'STAFF_TO_INDIVIDUAL' }), /移行に必要なデータ構造を確認できません/);
    assert.equal(t.converted(), 0);
  }
});

test('必要な列はすべてテーブル定義に存在する（無い列を求めて移行が常に止まることがない）', () => {
  assert.ok(required.length >= 9, '書込み対象の全表を列挙する');
  for (const { table, columns } of required) {
    const defined = definedColumns(table);
    assert.ok(defined, `${table} がテーブル定義に無い`);
    for (const column of columns) assert.ok(defined.includes(column), `${table}.${column} がテーブル定義に無い`);
  }
});
test('書込み対象の各表について、表の欠落と列の欠落を個別に検知して止まる', () => {
  for (const { table, columns } of required) {
    for (const defs of [{ ...tables, [table]: undefined }, { ...tables, [table]: columns.slice(1) }]) {
      const notifications = [];
      const t = runner(defs, (...args) => notifications.push(args));
      assert.throws(() => t.run({ direction: 'STAFF_TO_INDIVIDUAL' }), /移行に必要なデータ構造を確認できません/, table);
      assert.equal(t.converted(), 0, table);
      assert.equal(notifications.length, 1, table);
      assert.match(String(notifications[0][2]['異常内容']), new RegExp(table), table);
    }
  }
});
test('移行で書く表はすべて構造確認の一覧に載っている', () => {
  const body = [
    'convertStaffToIndividual_', 'convertIndividualToStaff_', 'migratePersonOwnedReferences_',
    'rebindAuthPrincipal_', 'syncWhitelistMemberLinkByAuthIds_', 'migrateTrainingApplications_',
  ].map(extract).join('\n');
  const officer = source.match(/var OFFICER_PERSON_TABLES_ = \[([^\]]*)\]/)[1];
  const written = new Set([...(body + officer).matchAll(/'(T_[^'\s]+)'/g)].map(m => m[1]));
  assert.ok(written.size >= 9, '抽出できている');
  written.delete('T_人物統合ログ'); // 無ければ appendPersonMergeLog_ が作る
  written.delete('T_年会費納入履歴'); // 会員→会員のときだけ（この 2 方向では通らない）
  written.delete('T_年会費更新履歴');
  for (const table of written) assert.ok(tables[table], `${table} を書くが構造確認の一覧に無い`);
});
// docs/317 I0: 隔離 E2E は一時スプレッドシートを渡して本物の移行を通す。移行部分が本番 DB を自分で開くと隔離が破れる。
test('移行部分は渡された ss だけを使い、本番 DB・ログ用 DB を自分では開かない', () => {
  const names = ['convertMemberTypeOn_', 'convertStaffToIndividual_', 'convertIndividualToStaff_', 'inspectMemberConversionData_',
    'findConversionPendingChangeRequests_', 'assertNoConversionPendingChangeRequests_', 'migratePersonOwnedReferences_',
    'rebindAuthPrincipal_', 'syncWhitelistMemberLinkByAuthIds_', 'migrateTrainingApplications_', 'rebindPersonReferenceTable_',
    'appendPersonMergeLog_', 'getBusinessStaffLimitInfo_', 'notifyMembershipChatSafely_',
    'createSheetWriteTx_', 'txHeaders_', 'txUpdateRow_', 'txAppend_', 'txBuildRequests_', 'txCommit_', 'sheetsApiUserEnteredCell_',
    'findMemberConversionRecord_', 'confirmConversionAppliedViaApi_'];
  for (const name of names) {
    assert.doesNotMatch(extract(name), /getOrCreateDatabase_\(|getLogSs_\(|SpreadsheetApp\.openById/, name);
  }
  assert.match(extract('convertMemberType_'), /return convertMemberTypeOn_\(ss, payload\)/);
});
test('渡された ss で移行し、入口と同じ判定をする', () => {
  const seen = [];
  const run = new Function('deps', `
    const notifyMembershipChatSafely_ = () => ({ skipped: true });
    const convertStaffToIndividual_ = (ss) => deps.seen.push(['S2I', ss.name]);
    const convertIndividualToStaff_ = (ss) => deps.seen.push(['I2S', ss.name]);
    ${COMMIT_STUBS}
    ${requiredDecl}
    ${extract('inspectMemberConversionData_')}
    ${extract('convertMemberTypeOn_')}
    return convertMemberTypeOn_;
  `)({ seen });
  const isolated = { ...makeDb(tables), name: 'isolated' };
  run(isolated, { direction: 'STAFF_TO_INDIVIDUAL' });
  run(isolated, { direction: 'INDIVIDUAL_TO_STAFF' });
  assert.deepEqual(seen, [['S2I', 'isolated'], ['I2S', 'isolated']]);
  assert.throws(() => run(isolated, { direction: 'X' }), /不明な direction/);
  assert.throws(() => run({ ...makeDb({ ...tables, 'T_会員': undefined }), name: 'isolated' }, { direction: 'STAFF_TO_INDIVIDUAL' }), /移行に必要なデータ構造/);
});

test('照合会員ID・照合職員IDは申込時点の記録として付け替えない（2026-10-31 operator 決定）', () => {
  assert.doesNotMatch(extract('migrateTrainingApplications_'), /cols\['照合(会員|職員)ID'\]/);
});
