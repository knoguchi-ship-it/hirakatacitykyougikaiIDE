/**
 * 研修登録の段 1（docs/319 §5・2026-11-02）: 入力の確認・受付期間（BR-22）・削除の権限・保存のロック。
 *
 * 実ソース（src/shared/trainingRules.mjs と gas-src/Code.full.gs）を実行して確かめる（ミラー実装を書かない）。
 * GAS のスクリプトのタイムゾーンは America/New_York（appsscript.json）。本番と同じずれを再現するため、
 * この検査は同じタイムゾーンで動かす（以前の setHours による区切りは、ここで日本時間 13:59 締切として現れる）。
 */
process.env.TZ = 'America/New_York';

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const source = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');
const rules = await import(pathToFileURL(path.join(ROOT, 'src', 'shared', 'trainingRules.mjs')).href);

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

/** gas-src の関数を、build と同じ注入（trainingRules）を済ませた状態で読み込む */
function loadGas(names: string[], extra = '') {
  const body = rules.serializeTrainingRulesForGas() + '\n' + names.map(extractFunction).join('\n') + '\n' + extra;
  return new Function(`${body}\nreturn { ${names.join(', ')} };`)();
}

const jst = (s: string) => new Date(`${s}+09:00`);
const fields = (errs: { field: string }[]) => errs.map((e) => e.field);

const VALID = {
  title: '★研修', date: '2026-11-20T14:00', organizer: '協議会', location: '会館', summary: '概要', inquiryPerson: '事務局',
  capacityEnabled: true, capacity: 30, feesEnabled: true, fees: [{ label: '会員', amount: 0 }, { label: '非会員', amount: 1000 }],
  applicationOpenDate: '2026-11-01', applicationCloseDate: '2026-11-20', applicationUrl: '',
};

// ── 共有の確認（画面とサーバーが同じ関数を使う）────────────────────────────
test('誤りを 1 件ずつではなくまとめて返す（C）', () => {
  assert.deepEqual(rules.validateTrainingRegistration(VALID), []);
  const errs = rules.validateTrainingRegistration({ ...VALID, title: ' ', organizer: '', location: '', summary: '', inquiryPerson: '' });
  assert.deepEqual(fields(errs), ['title', 'organizer', 'location', 'summary', 'inquiryPerson']);
});

test('研修タイトル・開催日時は必須（1.1 #1）', () => {
  assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, title: '', date: '' })), ['title', 'date']);
  assert.match(rules.validateTrainingRegistration({ ...VALID, date: '2026-02-30T10:00' })[0].message, /形式/);
});

test('定員: 有効なら 1 以上の整数、無効なら確かめない（1.1 #3・§5.8）', () => {
  for (const capacity of [0, -1, 1.5, '', 'abc', null]) {
    assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, capacity })), ['capacity'], String(capacity));
  }
  assert.deepEqual(rules.validateTrainingRegistration({ ...VALID, capacity: 1 }), []);
  assert.deepEqual(rules.validateTrainingRegistration({ ...VALID, capacityEnabled: false, capacity: 0 }), []);
});

test('研修費用: 区分名は必須・金額は 0 以上の整数（1.1 #4）', () => {
  assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, fees: [{ label: '会員', amount: -100 }] })), ['fees']);
  assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, fees: [{ label: '会員', amount: 10.5 }] })), ['fees']);
  assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, fees: [{ label: '', amount: 0 }] })), ['fees']);
  assert.deepEqual(rules.validateTrainingRegistration({ ...VALID, feesEnabled: false, fees: [{ label: '', amount: -1 }] }), [], '無効なら確かめない');
});

test('申込URL: http(s) だけ（1.1 #4）', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'ftp://example.invalid', 'forms.gle/abc']) {
    assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, applicationUrl: url })), ['applicationUrl'], url);
  }
  for (const url of ['https://forms.gle/abc', 'HTTP://example.invalid/x', '']) {
    assert.deepEqual(rules.validateTrainingRegistration({ ...VALID, applicationUrl: url }), [], url);
  }
});

test('受付期間（BR-22）: 申込開始日 ≦ 申込締切日 ≦ 開催日。締切日が空なら開催日と比べる', () => {
  assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, applicationCloseDate: '2026-11-21' })), ['applicationCloseDate']);
  assert.deepEqual(rules.validateTrainingRegistration({ ...VALID, applicationCloseDate: '2026-11-20' }), [], '当日締切はよい');
  assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, applicationOpenDate: '2026-11-15', applicationCloseDate: '2026-11-10' })), ['applicationOpenDate']);
  assert.deepEqual(fields(rules.validateTrainingRegistration({ ...VALID, applicationOpenDate: '2026-11-21', applicationCloseDate: '' })), ['applicationOpenDate']);
  assert.deepEqual(rules.validateTrainingRegistration({ ...VALID, applicationOpenDate: '', applicationCloseDate: '' }), []);
});

test('日付は日本時間で区切る（実行環境のタイムゾーンに左右されない）', () => {
  assert.equal(rules.toJstYmd(new Date('2026-11-19T15:30:00Z')), '2026-11-20', 'UTC では前日でも日本時間は 11/20');
  assert.equal(rules.toJstYmd('2026/11/20 14:00'), '2026-11-20');
  assert.equal(rules.toJstYmd('2026-11-20T14:00'), '2026-11-20');
  assert.equal(rules.toJstYmd('2026-02-30'), '');
  assert.equal(new Date(rules.jstDayEndMs('2026-11-20')!).toISOString(), '2026-11-20T14:59:59.999Z');
  assert.equal(new Date(rules.jstDayStartMs(jst('2026-11-20T00:00:00'))!).toISOString(), '2026-11-19T15:00:00.000Z');
});

// ── 受付の判定（GAS）──────────────────────────────────────────
const { computeTrainingAvailability_ } = loadGas(['normalizeTrainingLifecycleStatus_', 'computeTrainingAvailability_']);
const status = (row: Record<string, unknown>, now: string) =>
  computeTrainingAvailability_({ 研修状態コード: 'PUBLISHED', 定員: 0, 申込者数: 0, ...row }, { now: jst(now) });

test('受付は開催日の当日 23:59（日本時間）まで（BR-22・2026-11-01 決定。以前は開始時刻で終了）', () => {
  const row = { 開催日: '2026-11-20 14:00' };
  assert.equal(status(row, '2026-11-20T20:00:00').applicationStatus, 'OPEN', '開始時刻の後も当日中は受け付ける');
  assert.equal(status(row, '2026-11-20T23:59:59').applicationStatus, 'OPEN');
  const after = status(row, '2026-11-21T00:00:01');
  assert.equal(after.applicationStatus, 'CLOSED');
  assert.equal(after.applicationStatusReason, '開催日を過ぎています。');
});

test('申込締切日は日本時間の 23:59 まで（以前は America/New_York の区切りで 13:59 に締め切っていた）', () => {
  for (const close of ['2026-11-10', new Date('2026-11-10T00:00:00+09:00')]) {
    const row = { 開催日: '2026-11-20 14:00', 申込締切日: close };
    assert.equal(status(row, '2026-11-10T20:00:00').applicationStatus, 'OPEN', `締切日当日の夜 ${String(close)}`);
    assert.equal(status(row, '2026-11-11T00:00:01').applicationStatus, 'CLOSED');
  }
});

test('申込開始日は日本時間の 0:00 から（以前は日付型だと前日 14:00 に始まっていた）', () => {
  for (const open of ['2026-11-01', new Date('2026-11-01T00:00:00+09:00')]) {
    const row = { 開催日: '2026-11-20 14:00', 申込開始日: open };
    assert.equal(status(row, '2026-10-31T20:00:00').applicationStatus, 'NOT_STARTED', `前日の夜 ${String(open)}`);
    assert.equal(status(row, '2026-11-01T00:00:00').applicationStatus, 'OPEN');
  }
});

test('公開でなければ受け付けない・定員 0 は定員なし', () => {
  assert.equal(status({ 研修状態コード: 'DRAFT', 開催日: '2026-11-20' }, '2026-11-01T10:00:00').applicationStatus, 'UNAVAILABLE');
  assert.equal(status({ 開催日: '2026-11-20', 定員: 0, 申込者数: 99 }, '2026-11-01T10:00:00').applicationStatus, 'OPEN');
  assert.equal(status({ 開催日: '2026-11-20', 定員: 10, 申込者数: 10 }, '2026-11-01T10:00:00').applicationStatus, 'FULL');
});

// ── 保存（GAS）──────────────────────────────────────────────
function loadSave() {
  const stubs = `
    function normalizeInquiryContacts_(p, e) {
      if (!p && !e) throw new Error('問い合わせ窓口の電話番号またはメールアドレスを入力してください。');
      return { phone: p || '', email: e || '', primaryType: p ? 'PHONE' : 'EMAIL', primaryValue: p || e };
    }
    function getOrCreateDatabase_() { return { getSheetByName: function() { return null; } }; }
  `;
  return loadGas(['normalizeTrainingLifecycleStatus_', 'saveTrainingLocked_'], stubs).saveTrainingLocked_;
}
const PAYLOAD = {
  title: '★研修', date: '2026-11-20T14:00', organizer: '協議会', location: '会館', summary: '概要', inquiryPerson: '事務局',
  inquiryPhone: '072-000-0000', capacity: 30, fees: [{ label: '会員', amount: 0 }], applicationOpenDate: '2026-11-01',
  applicationCloseDate: '2026-11-20', applicationUrl: '', fieldConfig: {},
};

test('サーバーの保存も同じ確認を通し、誤りをまとめて止める（書き込む前）', () => {
  const save = loadSave();
  assert.throws(() => save({ ...PAYLOAD, title: '', date: '', capacity: 0, applicationUrl: 'javascript:x', inquiryPhone: '' }), (e: Error) =>
    /入力に誤りがあります/.test(e.message) && /研修タイトル/.test(e.message) && /開催日時/.test(e.message)
    && /定員/.test(e.message) && /申込URL/.test(e.message) && /問い合わせ窓口/.test(e.message));
  assert.throws(() => save({ ...PAYLOAD }), /T_研修 シートが見つかりません/, '正しい入力は確認を通って保存へ進む');
});

test('サーバー: 定員の項目が無効なら 0（定員なし）で保存する・申込URL が無効なら確かめない', () => {
  const save = loadSave();
  const p = { ...PAYLOAD, capacity: 0, fieldConfig: { capacity: false } };
  assert.throws(() => save(p), /T_研修 シートが見つかりません/);
  assert.equal(p.capacity, 0);
  const q = { ...PAYLOAD, capacity: 5, fieldConfig: { capacity: false } };
  assert.throws(() => save(q), /T_研修 シートが見つかりません/);
  assert.equal(q.capacity, 0, '無効なら入力値があっても定員なし');
  assert.throws(() => save({ ...PAYLOAD, applicationUrl: 'javascript:x', fieldConfig: { applicationUrl: false } }), /T_研修 シートが見つかりません/);
});

test('保存は申込の受付と同じスクリプトロックの中で行う（1.1 #5: 申込者数の上書き防止）', () => {
  const fn = extractFunction('saveTraining_');
  assert.match(fn, /LockService\.getScriptLock\(\)/);
  assert.match(fn, /return saveTrainingLocked_\(payload\)/);
  assert.match(fn, /releaseLock\(\)/);
});

// ── 削除・復元の権限（§5.9）─────────────────────────────────────
test('研修の削除・復元: 編集範囲が「自分の研修のみ」のロールは不可・MASTER と ALL は可・確かめられなければ止める', () => {
  const { assertTrainingDeleteAllowed_ } = loadGas(['assertTrainingDeleteAllowed_']);
  assert.doesNotThrow(() => assertTrainingDeleteAllowed_({ isMaster: true, trainingEditScope: 'OWN' }));
  assert.doesNotThrow(() => assertTrainingDeleteAllowed_({ isMaster: false, trainingEditScope: 'ALL' }));
  assert.throws(() => assertTrainingDeleteAllowed_({ isMaster: false, trainingEditScope: 'OWN' }), /削除・復元はできません/);
  assert.throws(() => assertTrainingDeleteAllowed_({ isMaster: false }), /削除・復元はできません/, '編集範囲が読めない');
  assert.throws(() => assertTrainingDeleteAllowed_(null), /管理者を確認できない/);
});

test('削除・復元の入口で権限を確かめてから処理する（配線）', () => {
  for (const [action, fn] of [['softDeleteTraining', 'softDeleteTraining_'], ['restoreTraining', 'restoreTraining_']]) {
    const start = source.indexOf(`if (action === '${action}')`);
    assert.notEqual(start, -1, action);
    const block = source.slice(start, source.indexOf('}\n', source.indexOf(`${fn}(parsedPayload)`, start)));
    const guard = block.indexOf('assertTrainingDeleteAllowed_(parsedPayload.__adminSession)');
    assert.ok(guard !== -1 && guard < block.indexOf(`${fn}(parsedPayload)`), `${action}: 処理の前に権限を確かめていない`);
  }
});

// ── 研修ごとの操作: 研修登録者は自分の研修だけ（2026-11-02 operator 決定）────────────────
function loadOperationGuard(trainings: Record<string, string>, applies: Record<string, string>) {
  const fakeSs = { tag: 'ss' };
  const extra = `
    function getRowsAsObjects_(ss, name) {
      if (name === 'T_研修') return Object.keys(TRAININGS).map(function(id) { return { '研修ID': id, '登録者メール': TRAININGS[id] }; });
      if (name === 'T_研修申込') return Object.keys(APPLIES).map(function(id) { return { '申込ID': id, '研修ID': APPLIES[id] }; });
      return [];
    }
    var TRAININGS = ${JSON.stringify(trainings)};
    var APPLIES = ${JSON.stringify(applies)};
    var TRAINING_SCOPED_OPERATION_ACTIONS_ = ${source.slice(source.indexOf('var TRAINING_SCOPED_OPERATION_ACTIONS_ = ') + 'var TRAINING_SCOPED_OPERATION_ACTIONS_ = '.length, source.indexOf('};', source.indexOf('var TRAINING_SCOPED_OPERATION_ACTIONS_ = ')) + 1)};
  `;
  const { assertTrainingOperationAllowed_ } = loadGas(['resolveTrainingIdsForOperation_', 'assertTrainingOperationAllowed_'], extra);
  return (action: string, payload: unknown, session: unknown) => assertTrainingOperationAllowed_(action, payload, session, () => fakeSs);
}

test('研修ごとの操作: 研修登録者は自分が登録した研修だけ。MASTER・全研修のロールは制限なし', () => {
  const guard = loadOperationGuard({ T1: 'me@example.invalid', T2: 'other@example.invalid' }, { A1: 'T1', A2: 'T2' });
  const own = { isMaster: false, trainingEditScope: 'OWN', loginId: 'Me@Example.invalid' };
  const ok = (a: string, p: unknown, s: unknown = own) => assert.doesNotThrow(() => guard(a, p, s), `${a} ${JSON.stringify(p)}`);
  const ng = (a: string, p: unknown, re: RegExp, s: unknown = own) => assert.throws(() => guard(a, p, s), re, `${a} ${JSON.stringify(p)}`);
  ok('addRosterEntry', { trainingId: 'T1' });
  ng('addRosterEntry', { trainingId: 'T2' }, /自分が登録した研修だけ/);
  ok('saveAttendance', { applyId: 'A1' });
  ng('saveAttendance', { applyId: 'A2' }, /自分が登録した研修だけ/);
  ng('saveAttendanceBatch', { entries: [{ applyId: 'A1' }, { applyId: 'A2' }] }, /T2/, );
  ng('cancelRosterEntry', { applyId: 'A9' }, /申込が見つからない/);
  ng('updateRosterEntry', {}, /申込IDがありません/);
  ng('sendTrainingMail', { recipients: [{ email: 'x@example.invalid' }] }, /研修IDがありません/, own);
  for (const a of ['regenerateThumbnailForTraining', 'sendTrainingReminder', 'sendTrainingMail', 'addGuestRosterEntry']) ng(a, { trainingId: 'T2' }, /自分が登録した研修だけ/);
  ok('getTrainingRosterDetail', { trainingId: 'T2' }, own); // 見るのはよい
  ok('getTrainingStats', { trainingId: 'T2' }, own);
  ok('addRosterEntry', { trainingId: 'T2' }, { isMaster: true, trainingEditScope: 'OWN' });
  ok('addRosterEntry', { trainingId: 'T2' }, { isMaster: false, trainingEditScope: 'ALL' });
  ng('addRosterEntry', { trainingId: 'T1' }, /管理者を確認できない/, null);
  ng('addRosterEntry', { trainingId: 'T1' }, /管理者を確認できない/, { isMaster: false, trainingEditScope: 'OWN', loginId: '' });
  ng('addRosterEntry', { trainingId: 'T1' }, /編集範囲を確かめられない/, { isMaster: false, loginId: 'me@example.invalid' });
});

test('研修ごとの操作の判定は、管理の入口で権限の確認の直後に行う（配線）・研修管理の書き込み操作をすべて含む', () => {
  const set = source.indexOf('parsedPayload.__adminSession = sessionResult;');
  const call = source.indexOf('assertTrainingOperationAllowed_(action, parsedPayload, sessionResult, getOrCreateDatabase_)');
  assert.ok(set !== -1 && call > set && call - set < 400, '権限の確認の直後に呼んでいない');
  const registry = fs.readFileSync(path.join(ROOT, 'scripts', 'menu-registry.mjs'), 'utf8');
  const trainingActions = [...registry.matchAll(/^\s+([A-Za-z]+): 'training-manage',$/gm)].map((m) => m[1]);
  const READ_OR_SEPARATE = ['getTrainingManagementData', 'getTrainingApplicants', 'getTrainingRosterDetail', 'getTrainingStats', 'getAdminEmailAliases',
    'generateTrainingEmail', 'uploadTrainingFile', 'setupTrainingFileFolder', 'saveTraining', 'softDeleteTraining', 'restoreTraining'];
  const guarded = Object.keys(new Function(`return ${source.slice(source.indexOf('var TRAINING_SCOPED_OPERATION_ACTIONS_ = ') + 'var TRAINING_SCOPED_OPERATION_ACTIONS_ = '.length, source.indexOf('};', source.indexOf('var TRAINING_SCOPED_OPERATION_ACTIONS_ = ')) + 1)}`)());
  const missing = trainingActions.filter((a) => !READ_OR_SEPARATE.includes(a) && !guarded.includes(a));
  assert.deepEqual(missing, [], '研修管理メニューに増えた操作が、研修登録者の範囲の確認から漏れている（読むだけなら READ_OR_SEPARATE に理由とともに足す）');
});

test('管理画面の研修一覧にだけ登録者を載せ、公開ポータルの変換には載せない', () => {
  assert.doesNotMatch(extractFunction('mapTrainingRowsForApi_'), /登録者メール/, '公開ポータルにも使う変換に管理者のメールを載せない');
  assert.match(extractFunction('getTrainingManagementData_'), /t\.registrarEmail = /);
});

test('申込の取消も開催日の当日 23:59（日本時間）まで（2026-11-02 operator 決定・受付とそろえる）', () => {
  const { isTrainingCancelable_ } = loadGas(['parseTrainingOptions_', 'isTrainingCancelable_']);
  const cols = { '項目設定JSON': 0, '開催日': 1 };
  const todayJst = rules.toJstYmd(new Date());
  const yesterday = rules.toJstYmd(new Date(Date.now() - 86400000));
  const opts = JSON.stringify({ fieldConfig: {}, cancelAllowed: true }); // 保存される形（serializeTrainingOptions_）
  assert.equal(isTrainingCancelable_([opts, `${todayJst} 00:00`], cols), true, '開始時刻を過ぎても当日中は取り消せる');
  assert.equal(isTrainingCancelable_([opts, `${yesterday} 23:00`], cols), false, '翌日になれば取り消せない');
  assert.equal(isTrainingCancelable_([JSON.stringify({ fieldConfig: {}, cancelAllowed: false }), `${todayJst} 23:59`], cols), false, '取消を許さない研修');
});

// ── 画面の配線 ─────────────────────────────────────────────
test('画面: 保存の確認は共有の関数・初期の日付は日本時間・削除ボタンは権限で出し分ける', () => {
  const tm = fs.readFileSync(path.join(ROOT, 'src', 'components', 'TrainingManagement.tsx'), 'utf8');
  assert.match(tm, /from '\.\.\/shared\/trainingRules\.mjs'/);
  assert.match(tm, /validateTrainingRegistration\(\{/);
  assert.doesNotMatch(tm, /toISOString\(\)\.slice\(0, 10\)/, 'UTC で日付を作らない');
  assert.match(tm, /\{ key: 'capacity', label: '定員' \}/);
  const app = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');
  assert.match(app, /onDelete=\{canDeleteTraining \? handleTrainingDelete : undefined\}/);
  assert.match(app, /onRestore=\{canDeleteTraining \? handleTrainingRestore : undefined\}/);
  // 研修登録者は他の担当者の研修を閲覧のみ（編集フォームは fieldset disabled・名簿は readOnly・メールと LINE 投稿は出さない）
  assert.match(app, /canOperateTraining=\{canOperateTraining\}/);
  assert.match(tm, /<fieldset disabled=\{readOnly\}/);
  assert.match(tm, /readOnly=\{readOnly\}/);
  assert.match(tm, /panelView === 'mail' && !readOnly/);
  const roster = fs.readFileSync(path.join(ROOT, 'src', 'components', 'TrainingRoster.tsx'), 'utf8');
  assert.match(roster, /\{!readOnly && selectedVisibleCount > 0 &&/);
});

test('GAS の 3 split に共有の確認が注入されている（stub のままにしない）', () => {
  for (const file of ['backend/Code.gs', 'gas/admin/Code.gs', 'gas/member/Code.gs']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    if (!code.includes('computeTrainingAvailability_')) continue; // 受付を判定しない split
    assert.ok(!code.includes('jstDayEndMs_ is not injected'), `${file}: stub のまま（build:gas を実行）`);
    assert.ok(code.includes('function jstDayEndMs_('), `${file}: 注入されていない`);
  }
});
