/**
 * 2026-10-25 回帰テスト: 公開ポータルの文言（docs/313・docs/307 F26）。
 *
 * 案内文は T_画面文テンプレート から選び、設定には選んだ定型文の ID だけを持つ。見出し・説明・ボタン名は空欄で保存できない。
 * 以前は設定が空だと、読むときにプログラムの中の既定の文面（4 か所に同じもの）で補っていた。
 * 生成物（管理 split）から実際の関数を取り出し、シートだけを小さな表で差し替えて動かす（ミラー実装にしない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const admin = read('gas/admin/Code.gs');
const publicGas = read('backend/Code.gs');

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

// ── 小さな表 ─────────────────────────────────────────
const TEMPLATE_H = ['テンプレートID', '用途コード', '名前', '本文', '表示順', '作成日時', '更新日時', '削除フラグ'];
const SETTING_H = ['設定キー', '設定値', '説明', '更新日時'];
type Table = unknown[][];
function fakeDb(settings: Record<string, string>, templates: Table = []) {
  const tables: Record<string, Table> = {
    T_システム設定: [SETTING_H, ...Object.entries(settings).map(([k, v]) => [k, v, '', ''])],
    T_画面文テンプレート: [TEMPLATE_H, ...templates],
  };
  const sheets: Record<string, any> = {};
  for (const [name, values] of Object.entries(tables)) {
    sheets[name] = {
      values,
      getRange: (r: number, _c: number, nr = 1) => ({
        setValues: (v: unknown[][]) => v.forEach((row, i) => { values[r - 1 + i] = row.slice(); }),
        getValues: () => values.slice(r - 1, r - 1 + nr),
      }),
    };
  }
  return { getSheetByName: (n: string) => sheets[n] || null, sheets, tables };
}
const rowsOf = (db: ReturnType<typeof fakeDb>, name: string) => {
  const [h, ...rows] = db.tables[name];
  return rows.map((r) => Object.fromEntries((h as string[]).map((k, i) => [k, (r as unknown[])[i]])));
};
const settingsOf = (db: ReturnType<typeof fakeDb>) => Object.fromEntries(rowsOf(db, 'T_システム設定').map((r) => [r['設定キー'], String(r['設定値'])]));

const ENV = `
  var deps = arguments[0];
  function getOrCreateDatabase_() { return deps.db; }
  function initializeSchemaIfNeeded_() {}
  function toBoolean_(v) { return v === true || String(v).toLowerCase() === 'true'; }
  function getRowsAsObjects_(ss, name) { return deps.rowsOf(ss, name); }
  function getSystemSettingMap_(ss) { return deps.settingsOf(ss); }
  function findRowByColumnValue_(sheet, col, val) {
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
  function batchUpsertSystemSettings_(ss, updates) {
    var s = ss.getSheetByName('T_システム設定');
    updates.forEach(function(u) {
      for (var r = 1; r < s.values.length; r++) if (s.values[r][0] === u.key) { s.values[r][1] = u.value; return; }
      s.values.push([u.key, u.value, u.description || '', '']);
    });
  }
  var Utilities = { getUuid: function() { return 'uuid' + String(++deps.seq).padStart(4, '0') + '-xxxx'; } };
  var LOCK_WAIT_TIMEOUT_MS = 10000;
  var LockService = { getScriptLock: function() { return {
    waitLock: function() { deps.events.push('lock'); }, releaseLock: function() { deps.events.push('unlock'); } }; } };
`;
const FNS = ['collectRequiredPublicPortalTexts_', 'findScreenTextTemplatePurpose_', 'legacyScreenTextBody_', 'screenTextTemplateRowToObject_',
  'listScreenTextTemplates_', 'resolveScreenTextTemplates_', 'seedScreenTextTemplates_', 'saveScreenTextTemplate_',
  'deleteScreenTextTemplate_', 'validateScreenTextTemplateSelection_'];
const VARS = ['PUBLIC_PORTAL_DEFAULTS', 'SCREEN_TEXT_TEMPLATE_PURPOSES_', 'PUBLIC_PORTAL_REQUIRED_TEXTS_'];
function load(db: ReturnType<typeof fakeDb>, events: string[] = []) {
  const body = ENV + VARS.map((v) => block(admin, `var ${v} = `) + ';').join('\n') + '\n'
    + FNS.map((n) => block(admin, `function ${n}(`)).join('\n')
    + `\nreturn { ${[...FNS, ...VARS].join(', ')} };`;
  return new Function(body)({ db, rowsOf, settingsOf, seq: 0, events }) as Record<string, any>;
}

// 設定の保存（updateSystemSettings_）そのものを動かす。書き込みはすべて events に記録する
function loadSettingsSave(db: ReturnType<typeof fakeDb>) {
  const events: string[] = [];
  const stubs = `
  var MASTER_ONLY_SETTING_KEYS = [];
  function convertSettingKeyToCamel_(k) { return k; }
  function validateAnnualFeeTransferAccount_() { return {}; }
  function initializeSchema_() {}
  function getSystemSettingValue_() { return ''; }
  var DB_SCHEMA_VERSION = 'test';
  var DEFAULT_BUSINESS_STAFF_LIMIT_KEY = 'DEFAULT_BUSINESS_STAFF_LIMIT';
  var TRAINING_HISTORY_LOOKBACK_MONTHS_KEY = 'TRAINING_HISTORY_LOOKBACK_MONTHS';
  var CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY = '', CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY = '', CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY = '';
  function setMemberTypeAnnualFeeAmounts_(ss, fees) { deps.events.push('fees:' + JSON.stringify(fees)); }
  var PropertiesService = { getScriptProperties: function() { return { setProperty: function(k) { deps.events.push('prop:' + k); } }; } };
  function getSystemSettings_() { return { defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18, annualFeePaymentGuidance: '', annualFeeTransferAccount: {} }; }
  var realUpsert = batchUpsertSystemSettings_;
  batchUpsertSystemSettings_ = function(ss, updates) { deps.events.push('upsert:' + updates.length); realUpsert(ss, updates); };
`;
  const fns = [...FNS, 'normalizeAnnualFeeAmount_', 'requireConfiguredMailText_', 'hasOwnSettingField_', 'updateSystemSettings_'];
  const body = ENV + VARS.map((v) => block(admin, `var ${v} = `) + ';').join('\n') + '\n'
    + fns.map((n) => block(admin, `function ${n}(`)).join('\n') + stubs
    + '\nreturn { updateSystemSettings_: updateSystemSettings_ };';
  const g = new Function(body)({ db, rowsOf, settingsOf, seq: 0, events }) as Record<string, any>;
  return { g, events };
}
const filledTexts = (over: Record<string, string> = {}) => {
  const g = load(fakeDb({}));
  return { ...Object.fromEntries(g.PUBLIC_PORTAL_REQUIRED_TEXTS_.map((item: any) => [item.requestKey, `文言 ${item.key}`])), ...over };
};
const KEY = {
  GS: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_TEMPLATE_ID_WHEN_CREDENTIAL_SENT',
  GN: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_TEMPLATE_ID_WHEN_CREDENTIAL_NOT_SENT',
  LS: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_TEMPLATE_ID_WHEN_CREDENTIAL_SENT',
  LN: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_TEMPLATE_ID_WHEN_CREDENTIAL_NOT_SENT',
};
const tpl = (id: string, purpose: string, name: string, body: string, deleted = false) => [id, purpose, name, body, 1, '', '', deleted];

// ── 1. 移し替え ─────────────────────────────────────────
test('移し替え: 定型文が無い用途に、今の画面に出ている文面を 1 件作って選ぶ（2 回目は増えない）', () => {
  const db = fakeDb({
    PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT: '事務局が書いた案内\n2 行目',
    PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT: '',                 // 空 → 旧い 1 行目＋2 行
    PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE: '旧い 1 行目',
    PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT: 'ログイン補足（事務局）',
    // LOGIN_INFO_NOT_SENT は行が無い → 既定の文面
    PUBLIC_PORTAL_HERO_TITLE: '事務局の見出し',
    PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL: '   ',                                          // 空白だけ → 今の表示（既定）で埋める
  });
  const g = load(db);
  g.seedScreenTextTemplates_(db);
  const templates = rowsOf(db, 'T_画面文テンプレート');
  assert.equal(templates.length, 4);
  const byPurpose = Object.fromEntries(templates.map((t) => [t['用途コード'], t]));
  assert.equal(byPurpose.COMPLETION_GUIDANCE_SENT['本文'], '事務局が書いた案内\n2 行目');
  assert.equal(byPurpose.COMPLETION_GUIDANCE_NOT_SENT['本文'], '旧い 1 行目\n年会費や振込先などのご案内は、登録メールアドレスをご確認ください。\n追加確認が必要な場合のみ、事務局からご連絡します。');
  assert.equal(byPurpose.COMPLETION_LOGIN_INFO_SENT['本文'], 'ログイン補足（事務局）');
  assert.equal(byPurpose.COMPLETION_LOGIN_INFO_NOT_SENT['本文'], g.PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent);
  const st = settingsOf(db);
  assert.equal(st[KEY.GS], byPurpose.COMPLETION_GUIDANCE_SENT['テンプレートID']);
  assert.equal(st[KEY.LN], byPurpose.COMPLETION_LOGIN_INFO_NOT_SENT['テンプレートID']);
  assert.equal(st.PUBLIC_PORTAL_HERO_TITLE, '事務局の見出し', '空でない見出しには触れない');
  assert.equal(st.PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL, g.PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel);
  assert.equal(st.PUBLIC_PORTAL_WITHDRAWAL_TITLE, g.PUBLIC_PORTAL_DEFAULTS.withdrawalTitle, '行の無い見出しも今の表示で埋める');
  assert.equal(st.PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT, '事務局が書いた案内\n2 行目', '旧い本文のキーは書き換えない（前の版へ戻せる）');

  const before = JSON.stringify(db.tables);
  g.seedScreenTextTemplates_(db);
  assert.equal(JSON.stringify(db.tables), before, '2 回目は何も変わらない');
});

test('移し替え: 前の版へ戻してまた上げたとき（シートが消え、設定に古い ID だけ残る）も、作った 1 件に付け替える', () => {
  // 旧い版の整備（cleanupNonSchemaSheets_）は定義に無いシートを消す。設定の ID 4 行は残る
  const db = fakeDb({ [KEY.GS]: 'STT-OLD1', [KEY.GN]: 'STT-OLD2', [KEY.LS]: 'STT-OLD3', [KEY.LN]: 'STT-OLD4',
    PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT: '旧い本文（戻している間も表示されていた）' });
  const g = load(db);
  g.seedScreenTextTemplates_(db);
  const r = g.resolveScreenTextTemplates_(db, settingsOf(db));
  assert.deepEqual(r.warnings, [], '古い ID のまま残さない');
  assert.equal(r.bodies.COMPLETION_GUIDANCE_SENT, '旧い本文（戻している間も表示されていた）');
});

test('移し替え: 定型文はあるのに選ばれていない用途は、その用途の 1 件目を選ぶ（新しく作らない）', () => {
  const db = fakeDb({}, [tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', 'A', '本文A')]);
  const g = load(db);
  g.seedScreenTextTemplates_(db);
  assert.equal(rowsOf(db, 'T_画面文テンプレート').filter((t) => t['用途コード'] === 'COMPLETION_GUIDANCE_SENT').length, 1);
  assert.equal(settingsOf(db)[KEY.GS], 'STT-A');
});

// ── 2. 読むとき ─────────────────────────────────────────
test('読むとき: 選んだ定型文の本文。見つからない・別の用途・削除済みなら空（補わない）で警告を出す', () => {
  const db = fakeDb({ [KEY.GS]: 'STT-A', [KEY.GN]: 'STT-GONE', [KEY.LS]: 'STT-A', [KEY.LN]: 'STT-DEL' }, [
    tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', 'A', '本文A'),
    tpl('STT-DEL', 'COMPLETION_LOGIN_INFO_NOT_SENT', 'D', '本文D', true),
  ]);
  const g = load(db);
  const r = g.resolveScreenTextTemplates_(db, settingsOf(db));
  assert.equal(r.bodies.COMPLETION_GUIDANCE_SENT, '本文A');
  assert.equal(r.bodies.COMPLETION_GUIDANCE_NOT_SENT, '');
  assert.equal(r.bodies.COMPLETION_LOGIN_INFO_SENT, '', '別の用途の定型文は使わない');
  assert.equal(r.bodies.COMPLETION_LOGIN_INFO_NOT_SENT, '', '削除済みは使わない');
  assert.equal(r.warnings.length, 3);
  assert.deepEqual(r.templates.map((t: any) => t.id), ['STT-A'], '一覧に削除済みは出さない');
});

// ── 3. サーバーが止めること ─────────────────────────────────
test('保存: 名前・本文が空（空白だけ）・用途が無い・用途を変える、は止める', () => {
  const db = fakeDb({}, [tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', 'A', '本文A')]);
  const g = load(db);
  assert.throws(() => g.saveScreenTextTemplate_({ purpose: 'COMPLETION_GUIDANCE_SENT', name: '', body: 'x' }), /名前/);
  assert.throws(() => g.saveScreenTextTemplate_({ purpose: 'COMPLETION_GUIDANCE_SENT', name: 'n', body: ' \n ' }), /空の定型文は保存できません/);
  assert.throws(() => g.saveScreenTextTemplate_({ purpose: 'NOPE', name: 'n', body: 'x' }), /用途が正しくありません/);
  assert.throws(() => g.saveScreenTextTemplate_({ id: 'STT-A', purpose: 'COMPLETION_LOGIN_INFO_SENT', name: 'n', body: 'x' }), /用途は変えられません/);
  const created = g.saveScreenTextTemplate_({ purpose: 'COMPLETION_GUIDANCE_SENT', name: '新しい', body: '新しい本文' });
  assert.equal(created.templates.length, 2);
  const updated = g.saveScreenTextTemplate_({ id: 'STT-A', purpose: 'COMPLETION_GUIDANCE_SENT', name: 'A2', body: '本文A2' });
  assert.equal(updated.templates.find((t: any) => t.id === 'STT-A').body, '本文A2');
});

test('削除: 選ばれている定型文・その用途の最後の 1 件は止める（書き込む前に）', () => {
  const db = fakeDb({ [KEY.GS]: 'STT-A' }, [
    tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', 'A', '本文A'),
    tpl('STT-B', 'COMPLETION_GUIDANCE_SENT', 'B', '本文B'),
    tpl('STT-L', 'COMPLETION_LOGIN_INFO_SENT', 'L', '本文L'),
  ]);
  const g = load(db);
  const snapshot = JSON.stringify(db.tables);
  assert.throws(() => g.deleteScreenTextTemplate_({ id: 'STT-A' }), /使われています/);
  assert.throws(() => g.deleteScreenTextTemplate_({ id: 'STT-L' }), /最後の 1 件/);
  assert.equal(JSON.stringify(db.tables), snapshot, '止めたときは何も書かない');
  const r = g.deleteScreenTextTemplate_({ id: 'STT-B' });
  assert.deepEqual(r.templates.map((t: any) => t.id).sort(), ['STT-A', 'STT-L']);
  assert.throws(() => g.deleteScreenTextTemplate_({ id: 'STT-B' }), /見つかりません/, '削除済みはもう消せない');
});

test('設定の保存: 空・存在しない・削除済み・別の用途の ID は選べない', () => {
  const db = fakeDb({}, [
    tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', 'A', '本文A'),
    tpl('STT-D', 'COMPLETION_GUIDANCE_SENT', 'D', '本文D', true),
    tpl('STT-L', 'COMPLETION_LOGIN_INFO_SENT', 'L', '本文L'),
  ]);
  const g = load(db);
  const p = g.findScreenTextTemplatePurpose_('COMPLETION_GUIDANCE_SENT');
  assert.equal(g.validateScreenTextTemplateSelection_(db, p, 'STT-A'), 'STT-A');
  assert.throws(() => g.validateScreenTextTemplateSelection_(db, p, ''), /選んでください/);
  assert.throws(() => g.validateScreenTextTemplateSelection_(db, p, 'STT-X'), /見つかりません/);
  assert.throws(() => g.validateScreenTextTemplateSelection_(db, p, 'STT-D'), /見つかりません/);
  assert.throws(() => g.validateScreenTextTemplateSelection_(db, p, 'STT-L'), /この用途の定型文/);
});

test('見出し・説明・ボタン名は空欄で保存できない（空欄はまとめて 1 回で知らせる・19 項目すべて保存できる）', () => {
  const g = load(fakeDb({}));
  assert.equal(g.PUBLIC_PORTAL_REQUIRED_TEXTS_.length, 19);
  const all = g.collectRequiredPublicPortalTexts_(filledTexts({ publicPortalHeroTitle: '  見出し  ' }));
  assert.equal(all.length, 19, '19 項目すべて保存する行になる');
  assert.equal(all.find((u: any) => u.key === 'PUBLIC_PORTAL_HERO_TITLE').value, '見出し', '前後の空白は落とす');
  assert.ok(all.every((u: any) => /^公開ポータル：/.test(u.description)), '設定の行の説明が付く');
  assert.deepEqual(g.collectRequiredPublicPortalTexts_({}), [], '送られていない項目には触れない');

  // 「表示する」の切り替えが無い項目（トップの見出し・ボタン名）だけが空なら、切り替えの案内を出さない
  const noToggle = () => g.collectRequiredPublicPortalTexts_(filledTexts({ publicPortalHeroTitle: ' ', publicPortalTrainingCtaLabel: '' }));
  assert.throws(noToggle, (e: Error) => e.message.includes('「トップの見出し」、「研修カードのボタン名」') && !e.message.includes('チェックを外して'));
  // 切り替えのある項目が含まれれば、文言を残したままオフにする案内を出す
  assert.throws(() => g.collectRequiredPublicPortalTexts_(filledTexts({ publicPortalWithdrawalTitle: '' })),
    /「退会カードの見出し」。\n表示したくない項目は、文言を残したまま「表示する」のチェックを外してください。/);
  // 切り替えのある・無いの区別が、管理画面の入力欄に出す案内と一致する（ボタン名とトップの見出しだけが切り替え無し）
  const noToggleKeys = g.PUBLIC_PORTAL_REQUIRED_TEXTS_.filter((item: any) => !item.toggle).map((item: any) => item.key);
  assert.deepEqual(noToggleKeys, ['PUBLIC_PORTAL_HERO_TITLE', 'PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL', 'PUBLIC_PORTAL_TRAINING_CTA_LABEL',
    'PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL', 'PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL']);
  for (const item of g.PUBLIC_PORTAL_REQUIRED_TEXTS_) {
    const toggleKey = item.key.replace(/_LABEL$/, '') + '_ENABLED'; // 補助ラベルは …_BADGE_ENABLED・ボタン名の …_CTA_ENABLED は無い
    assert.equal(admin.includes(`'${toggleKey}'`), item.toggle, `${item.key}: 切り替えの有無が実際の設定キー（${toggleKey}）と違う`);
  }
  const appSrc = read('src/App.tsx');
  for (const item of g.PUBLIC_PORTAL_REQUIRED_TEXTS_) {
    const state = item.requestKey + 'Input';
    const hint = new RegExp(`\\{systemSettingsLoaded && !${state}\\.trim\\(\\) && <p[^>]*>([^<]+)</p>\\}`).exec(appSrc);
    assert.ok(hint, `管理画面: ${state} に空欄の指摘が無い`);
    assert.equal(hint![1].includes('チェックを外して'), item.toggle, `管理画面: ${state} の案内が切り替えの有無と合わない`);
  }
});

test('設定の保存: 確かめ終えてから書く（見出しが空なら、年会費・フォルダ・設定のどれも書かない）', () => {
  const db = fakeDb({}, [tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', 'A', '本文A')]);
  const before = JSON.stringify(db.tables);
  const { g, events } = loadSettingsSave(db);
  const base = { defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18, memberTypeAnnualFees: { INDIVIDUAL: 3000 },
    trainingFileFolderId: 'F1', claimAttachmentFolderId: 'F2' };
  assert.throws(
    () => g.updateSystemSettings_({ ...base, ...filledTexts(), credentialEmailSubject: '   ' }, 'MASTER'),
    /空欄/,
  );
  assert.deepEqual(events, [], 'メール件名が空欄なら、設定の書込みを始めない');
  assert.throws(() => g.updateSystemSettings_({ ...base, ...filledTexts({ publicPortalHeroTitle: '' }) }, 'MASTER'), /「トップの見出し」/);
  assert.deepEqual(events, [], '止めたときは何も書かない（以前は年会費とフォルダだけ書いていた）');
  assert.throws(() => g.updateSystemSettings_({ ...base, memberTypeAnnualFees: { INDIVIDUAL: -1 } }, 'MASTER'), /年会費/);
  assert.deepEqual(events, [], '年会費の値が正しくないときも、ほかを書く前に止める');
  // 定型文の選択はロックの中で確かめる。止めたら書かずにロックを放す
  assert.throws(() => g.updateSystemSettings_({ ...base, publicPortalCompletionGuidanceTemplateIdWhenCredentialSent: 'STT-GONE' }, 'MASTER'), /見つかりません/);
  assert.deepEqual(events, ['lock', 'unlock']);
  assert.equal(JSON.stringify(db.tables), before);

  events.length = 0;
  assert.equal(g.updateSystemSettings_({ ...base, ...filledTexts(), publicPortalCompletionGuidanceTemplateIdWhenCredentialSent: 'STT-A' }, 'MASTER').defaultBusinessStaffLimit, 10);
  assert.deepEqual(events.map((e) => e.replace(/:.*$/, '')), ['lock', 'fees', 'upsert', 'prop', 'prop', 'prop', 'prop', 'unlock'], '書くのはロックの中だけ');
  assert.ok(events.includes('prop:TRAINING_FILE_FOLDER_ID') && events.includes('prop:CLAIM_ATTACHMENT_FOLDER_ID'));
  const st = settingsOf(db);
  assert.equal(st.PUBLIC_PORTAL_COMPLETION_GUIDANCE_TEMPLATE_ID_WHEN_CREDENTIAL_SENT, 'STT-A');
  assert.equal(st.PUBLIC_PORTAL_HERO_TITLE, '文言 PUBLIC_PORTAL_HERO_TITLE');
});

test('設定の保存: 差分だけを検証・保存し、dryRun はシートも Script Properties も書き換えない', () => {
  const db = fakeDb({}, [tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', 'A', '本文A')]);
  const { g, events } = loadSettingsSave(db);
  const before = JSON.stringify(db.tables);
  const plan = g.updateSystemSettings_({ __dryRun: true, publicPortalHeroTitle: '差分検証' }, 'MASTER');
  assert.deepEqual(plan, { plannedSettingCount: 1, plannedMemberFeeCodeCount: 0 });
  assert.deepEqual(events, ['lock', 'unlock']);
  assert.equal(JSON.stringify(db.tables), before, 'dryRun は設定表を書き換えない');

  events.length = 0;
  g.updateSystemSettings_({ publicPortalHeroTitle: '差分保存' }, 'MASTER');
  assert.deepEqual(events.map((e) => e.replace(/:.*$/, '')), ['lock', 'upsert', 'unlock']);
  const st = settingsOf(db);
  assert.equal(st.PUBLIC_PORTAL_HERO_TITLE, '差分保存');
  assert.equal(st.DEFAULT_BUSINESS_STAFF_LIMIT, undefined, '送っていない基本設定を作成・上書きしない');
});

test('定型文: 同じ用途に同じ名前は付けられない・保存と削除はロックの中で行い、止めてもロックを放す', () => {
  const events: string[] = [];
  const db = fakeDb({ [KEY.GS]: 'STT-A' }, [
    tpl('STT-A', 'COMPLETION_GUIDANCE_SENT', '標準', '本文A'),
    tpl('STT-B', 'COMPLETION_GUIDANCE_SENT', '別案', '本文B'),
    tpl('STT-L', 'COMPLETION_LOGIN_INFO_SENT', '標準', '本文L'),
  ]);
  const g = load(db, events);
  assert.throws(() => g.saveScreenTextTemplate_({ purpose: 'COMPLETION_GUIDANCE_SENT', name: ' 標準 ', body: 'x' }), /すでにあります/);
  assert.throws(() => g.saveScreenTextTemplate_({ id: 'STT-B', purpose: 'COMPLETION_GUIDANCE_SENT', name: '標準', body: 'x' }), /すでにあります/);
  assert.deepEqual(events, ['lock', 'unlock', 'lock', 'unlock'], '止めてもロックを放す');
  // 自分自身の名前のまま直す・別の用途に同じ名前、は通す
  g.saveScreenTextTemplate_({ id: 'STT-A', purpose: 'COMPLETION_GUIDANCE_SENT', name: '標準', body: '本文A2' });
  g.saveScreenTextTemplate_({ purpose: 'COMPLETION_LOGIN_INFO_NOT_SENT', name: '標準', body: '本文N' });
  events.length = 0;
  assert.throws(() => g.deleteScreenTextTemplate_({ id: 'STT-A' }), /使われています/);
  assert.deepEqual(events, ['lock', 'unlock']);
});

// ── 4. 既定の文面を持たない・補わない ─────────────────────────
test('読むときに既定の文面で補わない・旧い本文のキーを書き換えない（GAS の生成物）', () => {
  const textDefaults = ['heroBadgeLabel', 'heroTitle', 'heroDescription', 'membershipBadgeLabel', 'membershipTitle', 'membershipDescription', 'membershipCtaLabel',
    'trainingBadgeLabel', 'trainingTitle', 'trainingDescription', 'trainingCtaLabel', 'memberUpdateBadgeLabel', 'memberUpdateTitle', 'memberUpdateDescription',
    'memberUpdateCtaLabel', 'withdrawalBadgeLabel', 'withdrawalTitle', 'withdrawalDescription', 'withdrawalCtaLabel',
    'completionGuidanceBodyWhenCredentialSent', 'completionGuidanceBodyWhenCredentialNotSent', 'completionLoginInfoBodyWhenCredentialSent',
    'completionLoginInfoBodyWhenCredentialNotSent', 'completionNoCredentialNotice', 'completionCredentialNotice'];
  for (const [name, src, fn] of [['admin', admin, 'function getSystemSettings_('], ['public', publicGas, 'function getPublicPortalSettings_(']] as const) {
    const body = block(src, fn);
    for (const key of textDefaults) assert.ok(!new RegExp(`PUBLIC_PORTAL_DEFAULTS\\.${key}\\b`).test(body), `${name} ${fn}: ${key} で補っている`);
    assert.match(body, /resolveScreenTextTemplates_\(/, `${name}: 案内文は定型文から引く`);
  }
  const update = block(admin, 'function updateSystemSettings_(');
  for (const legacy of ['PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT', 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT',
    'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT', 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT',
    'PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE', 'PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE']) {
    assert.ok(!update.includes(`'${legacy}'`), `保存で旧い本文のキー ${legacy} を書いている`);
  }
});

test('画面（src）に完了画面の案内文・見出しの既定の文面を持たない', () => {
  const gasDefaults = new Function(`${block(admin, 'var PUBLIC_PORTAL_DEFAULTS = ')}; return PUBLIC_PORTAL_DEFAULTS;`)() as Record<string, unknown>;
  const texts = Object.values(gasDefaults).filter((v): v is string => typeof v === 'string' && v.length >= 8); // 「入会申込」など短い語は画面の別の用途（メニュー名・見出し）にもある
  for (const file of ['src/App.tsx', 'src/public-portal/App.tsx', 'src/components/application/MemberApplicationForm.tsx']) {
    const src = read(file);
    for (const t of texts) {
      for (const line of t.split('\n')) assert.ok(!src.includes(`'${line}'`), `${file} に既定の文面「${line}」が残っている`);
    }
    assert.ok(!/completion(No)?CredentialNotice/.test(src), `${file} に旧い補完が残っている`);
  }
});

test('初期データ（移し替え・新しい DB）の案内文が、承認待ちなのに「送信しました」と言わない', () => {
  const g = load(fakeDb({}));
  for (const key of ['completionGuidanceBodyWhenCredentialSent', 'completionCredentialNotice']) {
    const v = String(g.PUBLIC_PORTAL_DEFAULTS[key]);
    assert.ok(!/ログイン情報[^。]*送信しました/.test(v), `${key}: ${v}`);
    assert.match(v, /承認後/);
  }
});
