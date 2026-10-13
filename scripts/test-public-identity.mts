/**
 * v376.88 公開ポータルの本人確認（氏名＋番号 1 つ）の検査。
 *
 * 画面（TS）とサーバ（.gs）が別ファイルなので、食い違うと
 * 「画面には出るのにサーバが弾く」という分かりにくい壊れ方をする。
 * ここで両者の定義が一致していることを機械で押さえる。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_IDENTITY_CREDENTIALS,
  PUBLIC_IDENTITY_NAME_KIND,
  PUBLIC_IDENTITY_TYPE_CARDS,
  normalizeCredentialForKey,
  normalizePhoneForKey,
  publicIdentityErrorMessage,
  type PublicIdentityMemberType,
} from '../src/shared/publicIdentity.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

const TYPES: PublicIdentityMemberType[] = ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'];

/** サーバ側の内部設定関数から 種別 → key[] を読む */
function serverCredentials(): Record<string, string[]> {
  const start = gas.indexOf('function getPublicIdentityCredentials_() {');
  assert.notEqual(start, -1, 'サーバ側の定義が見つからない');
  const body = gas.slice(start, gas.indexOf('\n}\n', start));
  const out: Record<string, string[]> = {};
  for (const type of TYPES) {
    const block = body.slice(body.indexOf(`${type}: [`));
    const end = block.indexOf('],');
    assert.notEqual(end, -1, `${type} の定義が閉じていない`);
    out[type] = [...block.slice(0, end).matchAll(/key:\s*'([^']+)'/g)].map((m) => m[1]);
  }
  return out;
}

/** GAS 生成物から関数本体を取り出す。テスト側に本人確認ロジックを複製しない。 */
function extractFunction(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が公開生成物に存在しない`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  assert.fail(`${name} の関数終端が見つからない`);
}

/** 公開成果物そのものを、DB・Cache・token 発行だけを模擬して実行する。 */
function createArtifactIdentityVerifier(rows: Record<string, unknown>[]) {
  const artifact = fs.readFileSync(path.join(ROOT, 'backend', 'Code.gs'), 'utf8');
  const functions = [
    'normalizeCmNumberForKey_',
    'normalizePhoneForKey_',
    'normalizeRosterCellText_',
    'normalizeRosterKeyText_',
    'getPublicIdentityCredentials_',
    'matchesPublicIdentityName_',
    'assertPublicPortalIntakeOpen_',
    'verifyMemberIdentityForPublic_',
  ].map((name) => extractFunction(artifact, name)).join('\n\n');
  const cache = new Map<string, string>();
  const factory = new Function('deps', `
    const CacheService = deps.CacheService;
    const getOrCreateDatabase_ = deps.getOrCreateDatabase_;
    const getRowsAsObjects_ = deps.getRowsAsObjects_;
    const toBoolean_ = deps.toBoolean_;
    const isInactiveMemberStatusForIdentity_ = deps.isInactiveMemberStatusForIdentity_;
    const createPublicIdentityToken_ = deps.createPublicIdentityToken_;
    const getSystemSettingValue_ = deps.getSystemSettingValue_;
    ${functions}
    return verifyMemberIdentityForPublic_;
  `) as (deps: Record<string, unknown>) => (payload: Record<string, unknown>) => Record<string, unknown>;
  return factory({
    CacheService: {
      getScriptCache: () => ({
        get: (key: string) => cache.get(key) || null,
        put: (key: string, value: string) => cache.set(key, value),
      }),
    },
    getOrCreateDatabase_: () => ({}),
    getRowsAsObjects_: () => rows,
    toBoolean_: () => false,
    isInactiveMemberStatusForIdentity_: () => false,
    createPublicIdentityToken_: () => 'test-public-identity-token',
    getSystemSettingValue_: (_ss: unknown, key: string) => intakeSettings[key] ?? '',
  });
}

// 受付メニューの設定（テストごとに切り替える）
const intakeSettings: Record<string, string> = {};

test('照合項目の顔ぶれが画面とサーバで一致する', () => {
  const server = serverCredentials();
  for (const type of TYPES) {
    assert.deepEqual(
      PUBLIC_IDENTITY_CREDENTIALS[type].map((c) => c.key),
      server[type],
      `${type} の照合項目が食い違っている`
    );
  }
});

test('公開生成物に本人確認設定と正規化関数が残る', () => {
  const artifact = fs.readFileSync(path.join(ROOT, 'backend', 'Code.gs'), 'utf8');
  assert.match(artifact, /function getPublicIdentityCredentials_\(\)/);
  assert.match(artifact, /function normalizeCmNumberForKey_\(/);
  assert.match(artifact, /function normalizePhoneForKey_\(value\)/);
});

test('本人確認の内部エラーを公開画面へ出さない', () => {
  assert.equal(
    publicIdentityErrorMessage(new Error('PUBLIC_IDENTITY_CREDENTIALS_ is not defined')),
    '本人確認を完了できませんでした。時間をおいてもう一度お試しください。',
  );
  assert.equal(
    publicIdentityErrorMessage('invalid_member_type'),
    '入力内容を確認して、最初からやり直してください。',
  );
});

test('公開生成物の本人確認は一致した会員を成功として扱う', () => {
  const verify = createArtifactIdentityVerifier([{
    '会員ID': 'test-member-id',
    '会員種別コード': 'INDIVIDUAL',
    '姓': '確認',
    '名': '成功',
    '介護支援専門員番号': '12345678',
  }]);
  assert.deepEqual(verify({
    memberType: 'INDIVIDUAL',
    purpose: 'withdrawal',
    lastName: '確認',
    firstName: '成功',
    cmNumber: '12345678',
    contactEmail: 'test@example.invalid',
  }), { verified: true, token: 'test-public-identity-token' });
});

test('公開生成物の本人確認は不一致を安全な失敗として扱う', () => {
  const verify = createArtifactIdentityVerifier([{
    '会員ID': 'test-member-id',
    '会員種別コード': 'INDIVIDUAL',
    '姓': '確認',
    '名': '成功',
    '介護支援専門員番号': '12345678',
  }]);
  const result = verify({
    memberType: 'INDIVIDUAL',
    purpose: 'withdrawal',
    lastName: '確認',
    firstName: '失敗',
    cmNumber: '12345678',
    contactEmail: 'test@example.invalid',
  });
  assert.deepEqual(result, { verified: false, error: '入力内容と一致する会員情報が見つかりませんでした。' });
  assert.equal(publicIdentityErrorMessage(result.error), result.error);
});

test('3 種別すべてが本人確認に対応している', () => {
  // 賛助会員は RD §2 で「自己情報の更新・退会申請」を認められているのに、
  // v376.87 まで種別選択にすら出ていなかった。落とさないよう固定する。
  assert.deepEqual(PUBLIC_IDENTITY_TYPE_CARDS.map((c) => c.type), TYPES);
  for (const type of TYPES) {
    assert.ok(PUBLIC_IDENTITY_CREDENTIALS[type].length >= 1, `${type} に照合項目が無い`);
  }
});

test('賛助会員に介護支援専門員番号は出さない', () => {
  // 賛助会員は CM番号を持たない（入会フォームは個人会員のときだけ表示する）。
  const keys = PUBLIC_IDENTITY_CREDENTIALS.SUPPORT.map((c) => c.key);
  assert.ok(!keys.includes('cmNumber'), '賛助会員に CM番号が出ている');
  assert.ok(!keys.includes('officeNumber'), '賛助会員に事業所番号が出ている');
});

test('名義の照合方法が画面とサーバで一致する', () => {
  assert.equal(PUBLIC_IDENTITY_NAME_KIND.BUSINESS, 'office');
  assert.equal(PUBLIC_IDENTITY_NAME_KIND.INDIVIDUAL, 'person');
  assert.equal(PUBLIC_IDENTITY_NAME_KIND.SUPPORT, 'person');
  // サーバ側も事業所だけ勤務先名を見ていること
  const fn = gas.slice(gas.indexOf('function matchesPublicIdentityName_'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/memberType === 'BUSINESS'/.test(body), '事業所の分岐が無い');
  assert.ok(body.includes("member['勤務先名']"), '事業所名の照合が無い');
  assert.ok(body.includes("member['姓']") && body.includes("member['名']"), '姓名の照合が無い');
});

test('電話番号の正規化はハイフン・空白・全角を吸収する', () => {
  for (const input of ['072-859-9100', '072 859 9100', '０７２８５９９１００', '(072)859-9100']) {
    assert.equal(normalizePhoneForKey(input), '0728599100', `${input} が揃わない`);
  }
  assert.equal(normalizePhoneForKey(''), '');
  assert.equal(normalizePhoneForKey('---'), '', '数字が無ければ空になること');
});

test('番号系の正規化は空白除去と大文字化のみ', () => {
  assert.equal(normalizeCredentialForKey('cmNumber', ' 12345678 '), '12345678');
  assert.equal(normalizeCredentialForKey('officeNumber', 'ab 12cd3456'), 'AB12CD3456');
});

test('サーバは照合項目をちょうど 1 つだけ受け付ける', () => {
  const fn = gas.slice(gas.indexOf('function verifyMemberIdentityForPublic_'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/supplied\.length !== 1/.test(body), 'ちょうど 1 つの検査が無い');
  // 2 つ入れて片方が空でも通る、という抜け道を作らないこと
  assert.ok(!/\|\|\s*payload\.phone/.test(body), '照合項目を OR で拾っている');
});

test('DB 側が空の行を一致とみなさない', () => {
  // 電話番号が未登録の会員は多い（187 名中 30 名）。空同士で一致させると
  // 誰でも他人になりすませる。ここは必ず弾く。
  const fn = gas.slice(gas.indexOf('function verifyMemberIdentityForPublic_'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/if\s*\(!dbValue\s*\|\|\s*dbValue !== idKey\)/.test(body), '空の DB 値を除いていない');
});

test('賛助会員の変更 allowlist から CM番号が外れている', () => {
  const start = gas.indexOf('var PUBLIC_SUPPORT_UPDATE_ALLOWLIST_');
  assert.notEqual(start, -1, '賛助会員の allowlist が無い');
  const body = gas.slice(start, start + 400);
  assert.ok(/!==\s*'careManagerNumber'/.test(body), 'CM番号を除いていない');
});

test('賛助会員の連絡先変更でログインIDをCM番号として検証しない', () => {
  // 承認時は saveMemberCore_ が既存値と申請値を統合する。ここで賛助会員の
  // 自動採番ログインIDを CM 番号の代替にすると、CM番号を持たない賛助会員の
  // 連絡先変更まで 8 桁検証で失敗する。生成元の保存処理を直接検査する。
  // 2026-10-04: 個人会員への限定ではなく、**どの種別でも代替に使わない**ことへ強めた。
  // 本番の個人会員 19 名が CM 番号を持たないままログインID（9 桁自動採番）だけを持っており、
  // 管理画面の保存 1 回で「登録されていない CM 番号」が捏造されていたため（docs/299）。
  const saveCore = extractFunction(gas, 'saveMemberCore_');
  assert.match(
    saveCore,
    /var careManagerFallback = storedCareManagerNumber;/,
    'CM 番号の既定値は保存済みの値だけにしてください（ログインIDで埋めない）',
  );
  assert.ok(
    !/careManagerFallback\s*=\s*storedCareManagerNumber\s*\|\|/.test(saveCore),
    'ログインIDへのフォールバックが残っています',
  );
  const validate = extractFunction(gas, 'validateMemberPayload_');
  assert.match(
    validate,
    /if\s*\(\s*!isSupport\s*&&\s*trim\(payload\.careManagerNumber\)\s*\)/,
    '賛助会員の任意のCM番号を8桁書式検証してはいけません',
  );

  // 「賛助会員の自動採番ログインID」は 9 桁になり得る。保存前の実関数を
  // 生成元から抽出して実行し、この値が連絡先変更を妨げないことを確認する。
  const validateRuntime = new Function('isValidCmNumberRelaxed_', `${validate}\nreturn validateMemberPayload_;`)(
    () => false,
  ) as (payload: Record<string, unknown>, memberType: string, currentStatus: string) => void;
  const supportPayload = {
    lastName: '検証', firstName: '会員', lastKana: 'ケンショウ', firstKana: 'カイイン',
    careManagerNumber: '900000000', mobilePhone: '09000000000', status: 'ACTIVE',
  };
  assert.doesNotThrow(() => validateRuntime(supportPayload, 'SUPPORT', 'ACTIVE'));
  assert.throws(() => validateRuntime(supportPayload, 'INDIVIDUAL', 'ACTIVE'), /8桁/);
});

test('allowlist の種別分岐が三項演算子で書かれていない', () => {
  // 「INDIVIDUAL 以外＝事業所」と書くと賛助会員が事業所の allowlist を使う。
  // 実際にその状態だったので、表引きに寄せたことを固定する。
  assert.ok(!/memberType === 'INDIVIDUAL'\s*\?\s*PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_/.test(gas),
    '三項演算子での分岐が残っている');
  assert.equal((gas.match(/publicUpdateAllowlistFor_\(/g) || []).length >= 3, true,
    '表引き関数が使われていない');
});

// ── 2026-10-13 公開ポータルは登録済みの個人情報を返さない（operator 判断・docs/304） ──

const STAFF_ROWS = [
  { '会員ID': 'office-1', '職員ID': 'S1', '姓': '照合', '名': '一郎', '介護支援専門員番号': '11111111',
    'セイ': 'ショウゴウ', 'メイ': 'イチロウ', 'メールアドレス': 'ichiro@example.invalid', '職員状態コード': 'ENROLLED' },
  { '会員ID': 'office-1', '職員ID': 'S2', '姓': '退職', '名': '次郎', '介護支援専門員番号': '22222222',
    '職員状態コード': 'LEFT' },
  { '会員ID': 'office-2', '職員ID': 'S3', '姓': '他所', '名': '三郎', '介護支援専門員番号': '33333333',
    '職員状態コード': 'ENROLLED' },
];

/** 公開成果物の checkPublicStaffMatch_ を、DB・Cache・token 検証だけ模擬して実行する。 */
function createArtifactStaffMatcher(memberType = 'BUSINESS') {
  const artifact = fs.readFileSync(path.join(ROOT, 'backend', 'Code.gs'), 'utf8');
  const functions = [
    'normalizeCmNumberForKey_',
    'findPublicEnrolledStaffByIdentity_',
    'consumePublicStaffMatchQuota_',
    'checkPublicStaffMatch_',
  ].map((name) => extractFunction(artifact, name)).join('\n\n');
  const cache = new Map<string, string>();
  const factory = new Function('deps', `
    const CacheService = deps.CacheService;
    const getOrCreateDatabase_ = deps.getOrCreateDatabase_;
    const getRowsAsObjects_ = deps.getRowsAsObjects_;
    const toBoolean_ = deps.toBoolean_;
    const verifyPublicIdentityToken_ = deps.verifyPublicIdentityToken_;
    ${functions}
    return checkPublicStaffMatch_;
  `) as (deps: Record<string, unknown>) => (payload: Record<string, unknown>) => Record<string, unknown>;
  return factory({
    CacheService: {
      getScriptCache: () => ({
        get: (key: string) => cache.get(key) || null,
        put: (key: string, value: string) => cache.set(key, value),
      }),
    },
    getOrCreateDatabase_: () => ({}),
    getRowsAsObjects_: () => STAFF_ROWS,
    toBoolean_: (v: unknown) => v === true || v === 'TRUE',
    verifyPublicIdentityToken_: (token: string) => token === 'ok' ? { memberId: 'office-1', memberType } : null,
  });
}

test('★職員照合は一致したかどうかだけを返し、登録内容を返さない', () => {
  const check = createArtifactStaffMatcher();
  assert.deepEqual(check({ token: 'ok', lastName: '照合', firstName: '一郎', careManagerNumber: '11111111' }), { matched: true });
  // 番号違い・退職者・他事業所の職員は一致しない
  assert.deepEqual(check({ token: 'ok', lastName: '照合', firstName: '一郎', careManagerNumber: '11111112' }), { matched: false });
  assert.deepEqual(check({ token: 'ok', lastName: '退職', firstName: '次郎', careManagerNumber: '22222222' }), { matched: false });
  assert.deepEqual(check({ token: 'ok', lastName: '他所', firstName: '三郎', careManagerNumber: '33333333' }), { matched: false });
  assert.deepEqual(check({ token: 'bad', lastName: '照合', firstName: '一郎', careManagerNumber: '11111111' }), { error: 'token_expired' });
});

test('★職員照合は事業所会員だけ・回数に上限がある', () => {
  assert.ok(createArtifactStaffMatcher('INDIVIDUAL')({ token: 'ok' }).error, '個人会員で照合できてしまう');
  const check = createArtifactStaffMatcher();
  const probe = { token: 'ok', lastName: '照合', firstName: '一郎', careManagerNumber: '11111111' };
  for (let i = 0; i < 20; i++) assert.deepEqual(check(probe), { matched: true });
  const over = check(probe);
  assert.equal(over.matched, undefined, '上限を超えても照合結果を返している');
  assert.ok(over.error, '上限超過がエラーにならない');
});

test('★公開ポータルに職員一覧・在籍人数を返す action が無い', () => {
  const artifact = fs.readFileSync(path.join(ROOT, 'backend', 'Code.gs'), 'utf8');
  for (const name of ['getPublicEnrolledStaffList', 'getPublicAvailableStaffSlots']) {
    assert.ok(!gas.includes(`  ${name}: true,`), `${name} が公開 allowlist に残っている`);
    assert.ok(!artifact.includes(`function ${name}_(`), `${name}_ が公開成果物に残っている`);
    assert.ok(!artifact.includes(`action === '${name}'`), `${name} の dispatcher が公開成果物に残っている`);
  }
  const portal = fs.readFileSync(path.join(ROOT, 'src', 'public-portal', 'components', 'MemberUpdateForm.tsx'), 'utf8');
  assert.ok(!/getPublicEnrolledStaffList|getPublicAvailableStaffSlots/.test(portal), '画面が廃止した action を呼んでいる');
});

test('★職員の変更申請は画面から職員IDを受け取らず、サーバが氏名と番号で特定する', () => {
  const submit = extractFunction(gas, 'submitPublicChangeRequest_');
  assert.ok(!/\b(?:s|us|payload)\.staffId\b/.test(submit), '画面から送られた職員IDを使っている');
  assert.match(submit, /findPublicEnrolledStaffByIdentity_\(staffRowsForMatch, stored\.memberId, updateTarget\)/);
  assert.match(submit, /findPublicEnrolledStaffByIdentity_\(staffRowsForMatch, stored\.memberId, removeTarget\)/);
});

test('★職員数の上限は承認時に、何かを書き込む前に申請全体で確かめる', () => {
  const approve = extractFunction(gas, 'approveAdminChangeRequest_');
  const check = approve.indexOf('getBusinessStaffLimitInfo_(ss, memberId)');
  const firstWrite = approve.indexOf('// ── 変更内容の適用');
  assert.ok(check !== -1 && firstWrite !== -1 && check < firstWrite, '上限の確認が適用より後にある');

  const admin = fs.readFileSync(path.join(ROOT, 'gas', 'admin', 'Code.gs'), 'utf8');
  const info = new Function('deps', `
    const findRowByColumnValue_ = deps.findRowByColumnValue_;
    const getSystemSettingValue_ = deps.getSystemSettingValue_;
    const getRowsAsObjects_ = deps.getRowsAsObjects_;
    const toBoolean_ = deps.toBoolean_;
    ${extractFunction(admin, 'getBusinessStaffLimitInfo_')}
    return getBusinessStaffLimitInfo_;
  `)({
    findRowByColumnValue_: (_s: unknown, _c: string, id: string) =>
      id === 'office-1' ? { row: [''], columns: { '職員数上限': 0 } } : null,
    getSystemSettingValue_: () => '3',
    getRowsAsObjects_: () => STAFF_ROWS,
    toBoolean_: () => false,
  }) as (ss: unknown, memberId: string) => { limit: number; enrolled: number };
  const ss = { getSheetByName: () => ({}) };
  // 個別上限が空なら全体既定（3）。在籍は ENROLLED の 1 名だけ
  assert.deepEqual(info(ss, 'office-1'), { limit: 3, enrolled: 1 });
  assert.deepEqual(info(ss, 'missing'), { limit: 0, enrolled: 0 });
});

test('★職員の追加も事業所会員だけが申請できる', () => {
  const submit = extractFunction(gas, 'submitPublicChangeRequest_');
  const guard = submit.indexOf("payload.staffAdd.length > 0 && stored.memberType !== 'BUSINESS'");
  const handle = submit.indexOf('payload.staffAdd.forEach(');
  assert.ok(guard !== -1 && guard < handle, '個人・賛助会員の申請でも職員追加を受け付けている');
});

test('★承認時に職員の追加・除籍ができなかったら黙って飛ばさない', () => {
  const approve = extractFunction(gas, 'approveAdminChangeRequest_');
  // 追加は混在申請（登録情報変更）・STAFF_ADD の両方とも共通関数を通る
  assert.equal((approve.match(/applyApprovedStaffAdds_\(ss, memberId, applicantName, changeData\.staffAdd \|\| \[\], approvalResult, chatAnomalies\)/g) || []).length, 2,
    '職員追加の経路が共通関数を通っていない');
  // 除籍の対象が特定できない（混在申請・STAFF_REMOVE の両方）
  assert.equal((approve.match(/除籍する職員を特定できなかったため/g) || []).length, 2,
    '除籍の対象が見つからないときに知らせていない');
  // 反映できなかった内容は画面へ返し、申請者への承認メールを止める
  assert.match(approve, /warnings: chatAnomalies, memberMailHeld: memberMailHeld/);
  assert.match(approve, /if \(!memberMailHeld\) sendApprovalNotificationMail_\(/);
});

/** 管理生成物の applyApprovedStaffAdds_ を、追加結果とメール送信だけ模擬して実行する */
function runStaffAdds(addResults: Array<Record<string, unknown>>) {
  const admin = fs.readFileSync(path.join(ROOT, 'gas', 'admin', 'Code.gs'), 'utf8');
  const sent: Array<{ category: string; to: string; body: string }> = [];
  let call = 0;
  const fn = new Function('deps', `
    const addApprovedStaffMember_ = deps.addApprovedStaffMember_;
    const getSystemSettingValue_ = () => '';
    const getBizEmailSettings_ = () => ({ staffAddStaffEmailEnabled: true, staffAddRepEmailEnabled: true,
      staffAddStaffEmailBody: 'ID={{ログインID}}', staffAddStaffEmailSubject: 's', staffAddRepEmailBody: '{{追加職員氏名}}', staffAddRepEmailSubject: 'r' });
    const getRowsAsObjects_ = (ss, t) => t === 'T_事業所職員'
      ? [{ 会員ID: 'B1', 職員状態コード: 'ENROLLED', 職員権限コード: 'REPRESENTATIVE', メールアドレス: 'rep@example.invalid', 姓: '代表', 名: '者' }]
      : [{ 会員ID: 'B1', 勤務先名: '★事業所' }];
    const toBoolean_ = () => false;
    const renderMergeTags_ = (t, v) => t.replace(/\\{\\{(.+?)\\}\\}/g, (_, k) => String(v[k] ?? ''));
    const deliverMail_ = deps.deliverMail_;
    const Logger = { log() {} };
    const MEMBER_PORTAL_URL = 'https://example.invalid';
    ${extractFunction(admin, 'applyApprovedStaffAdds_')}
    return applyApprovedStaffAdds_;
  `)({
    addApprovedStaffMember_: () => addResults[call++],
    deliverMail_: (category: string, to: string, _s: string, body: string) => { sent.push({ category, to, body }); },
  }) as (...a: unknown[]) => void;
  const anomalies: string[] = [];
  const staff = addResults.map((_, i) => ({ lastName: '職員', firstName: String(i + 1), email: `s${i + 1}@example.invalid`, careManagerNumber: `1000000${i}` }));
  fn({}, 'B1', '★事業所', staff, {}, anomalies);
  return { sent, anomalies };
}

test('★職員追加の通知メールは追加できた職員にだけ送り、実際のログインIDで案内する', () => {
  const { sent, anomalies } = runStaffAdds([
    { success: true, authAccountCreated: true, loginId: '210000000' }, // 衝突回避で先頭に数字が付いた
    { success: false, error: '職員数上限に達しています' },
    { success: true, authAccountCreated: false, authError: 'x' },     // アカウントを作れなかった
  ]);
  const staffMails = sent.filter((m) => m.category === 'STAFF_ADD_STAFF_EMAIL');
  assert.deepEqual(staffMails.map((m) => m.to), ['s1@example.invalid'], '追加できなかった職員にも案内を送っている');
  assert.equal(staffMails[0].body, 'ID=210000000', '申請の番号ではなく実際のログインIDで案内すること');
  const rep = sent.filter((m) => m.category === 'STAFF_ADD_REP_EMAIL');
  assert.equal(rep.length, 1);
  assert.equal(rep[0].body, '職員 1', '代表者への通知に追加できなかった職員の名前が入っている');
  assert.equal(anomalies.length, 2, '失敗とアカウント未作成を管理者へ知らせていない');
});

test('★公開の変更申請: 入力途中の職員カードで送信させず、エラーは画面内に出す', () => {
  const form = fs.readFileSync(path.join(ROOT, 'src', 'public-portal', 'components', 'MemberUpdateForm.tsx'), 'utf8');
  const pending = form.slice(form.indexOf('const pendingStaffCards = useMemo'), form.indexOf('}, [memberType, selected, staffAddCards, staffRemoveCards, staffUpdateCards]);'));
  assert.ok(pending.includes("selected.has('staffAdd')") && pending.includes('staffAddComplete(c)'), '途中まで入力した職員追加カードが黙って外れる');
  assert.ok(form.includes('pendingStaffCards.length > 0}'), '送信ボタンを止めていない');
  assert.match(form, /errorRef\.current\.scrollIntoView\(/, 'エラーを画面内へ移していない');
  assert.match(form, /<div ref=\{errorRef\} tabIndex=\{-1\} role="alert"/, 'エラーにフォーカスできない');
});

test('★公開の変更申請: 項目名のラベルはすべて入力欄に結び付いている', () => {
  // 2026-10-13 まで 28 か所が結び付いておらず、スクリーンリーダーで項目名が読まれなかった。
  const form = fs.readFileSync(path.join(ROOT, 'src', 'public-portal', 'components', 'MemberUpdateForm.tsx'), 'utf8');
  assert.equal((form.match(/<label className=\{labelClass\}>/g) || []).length, 0, 'htmlFor の無い項目名ラベルがある');
});

test('★受付を停止した公開メニューは、サーバでも受け付けない', () => {
  const verify = createArtifactIdentityVerifier([{
    '会員ID': 'test-member-id', '会員種別コード': 'INDIVIDUAL', '姓': '確認', '名': '成功', '介護支援専門員番号': '12345678',
  }]);
  const payload = { memberType: 'INDIVIDUAL', lastName: '確認', firstName: '成功', cmNumber: '12345678', contactEmail: 'test@example.invalid' };
  intakeSettings['PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED'] = 'false';
  try {
    assert.throws(() => verify({ ...payload, purpose: 'withdrawal' }), /停止/, '退会の受付を止めても本人確認が通る');
    assert.deepEqual(verify({ ...payload, purpose: 'update' }), { verified: true, token: 'test-public-identity-token' });
  } finally {
    delete intakeSettings['PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED'];
  }
  // 研修・入会・変更申請の入口でも同じ検査を通す
  for (const fn of ['applyTrainingExternal_', 'cancelTrainingExternal_', 'submitMemberApplication_', 'submitPublicChangeRequest_']) {
    assert.match(extractFunction(gas, fn), /assertPublicPortalIntakeOpen_\(/, fn + ' が受付停止を見ていない');
  }
  // 変更用のトークンで退会申請を出せない
  assert.match(extractFunction(gas, 'submitPublicChangeRequest_'), /String\(stored\.purpose \|\| ''\) !== expectedPurpose/);
});
