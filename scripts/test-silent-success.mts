/**
 * 2026-10-24 回帰テスト: docs/307 §4-3「黙って成功と言う」サーバ側（S9・S10/F22・S11・S30/31・S41・S42・S44・E6）。
 *
 * どれも「失敗・欠落を伝えずに完了と返す」型。直した関数を生成物から取り出し、外との境（シート・メール）だけを
 * 差し替えて動かす（ミラー実装にしない・AGENTS L3.1）。S27/E2 は画面が結果を見る形（v376.122）で止め、
 * 外側の形は変えていない（変えると名簿の文言が生のエラーコードになる）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { linePostNotNotifiedMessage } from '../src/shared/linePostNotice.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pub = read('backend/Code.gs');
const admin = read('gas/admin/Code.gs');

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

/** 2 次元配列だけを持つシートの代役 */
function fakeSheet(values: unknown[][]) {
  const writes: unknown[][][] = [];
  return {
    writes,
    getLastRow: () => values.length,
    getLastColumn: () => (values[0] || []).length,
    getRange: (r: number, c: number, nr: number, nc: number) => ({
      getValues: () => values.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
      setValues: (v: unknown[][]) => { writes.push(v); v.forEach((row, i) => { values[r - 1 + i] = row; }); },
    }),
  };
}
const fakeSs = (sheets: Record<string, ReturnType<typeof fakeSheet>>) => ({ getSheetByName: (n: string) => sheets[n] || null });

// ── S9 / S10: 公開の変更申請 ──────────────────────────────────────────────
const submitChange = new Function('deps', `
  var stored = deps.stored;
  function verifyPublicIdentityToken_() { return stored; }
  function consumePublicSubmissionQuota_() {}
  function assertPublicPortalIntakeOpen_() {}
  function getOrCreateDatabase_() { return {}; }
  function publicUpdateAllowlistFor_() { return []; }
  function normalizeAndValidateKana_(v) { return String(v || '').trim(); }
  function consumePublicStaffMatchQuota_() { return true; }
  function getRowsAsObjects_() { return deps.staffRows; }
  function toBoolean_(v) { return v === true || String(v) === 'true'; }
  function appendRowsByHeaders_() { throw new Error('受け付けてはいけない'); }
  ${extractFunction(pub, 'normalizeCmNumberForKey_')}
  ${extractFunction(pub, 'findPublicEnrolledStaffByIdentity_')}
  ${extractFunction(pub, 'submitPublicChangeRequest_')}
  return submitPublicChangeRequest_;
`)({
  stored: { memberId: 'M1', memberType: 'BUSINESS', purpose: 'update', contactEmail: 'a@example.invalid', applicantName: '★事業所' },
  staffRows: [{ 職員ID: 'S1', 会員ID: 'M1', 職員状態コード: 'ENROLLED', 介護支援専門員番号: '12345678', 姓: '★山田', 名: '花子', 削除フラグ: false }],
}) as (p: object) => { success: boolean; error?: string };

const fullAdd = { lastName: '★追加', firstName: '太郎', lastKana: 'ツイカ', firstKana: 'タロウ', careManagerNumber: '87654321', email: 'add@example.invalid' };

test('S9: 職員追加の欠けた行・形式違いは黙って捨てず、何人目かを示して止める', () => {
  for (const [patch, want] of [
    [{ firstKana: '' }, '氏名とフリガナ'],
    [{ careManagerNumber: '1234' }, '8 桁'],
    [{ email: 'not-an-email' }, 'メールアドレスの形式'],
  ] as const) {
    const r = submitChange({ token: 't', requestType: 'STAFF_ADD', staffAdd: [fullAdd, { ...fullAdd, ...patch }] });
    assert.equal(r.success, false, JSON.stringify(patch));
    assert.match(String(r.error), /追加する職員 2 人目/);
    assert.ok(String(r.error).includes(want), String(r.error));
  }
});

test('S10: 職員情報変更の形式違いの番号・メールは黙って外さず止める', () => {
  const target = { lastName: '★山田', firstName: '花子', careManagerNumber: '12345678' };
  const cm = submitChange({ token: 't', requestType: 'MEMBER_UPDATE', staffUpdate: [{ target, careManagerNumber: '123' }] });
  assert.equal(cm.success, false);
  assert.match(String(cm.error), /1 人目: 変更後の介護支援専門員番号/);
  const mail = submitChange({ token: 't', requestType: 'MEMBER_UPDATE', staffUpdate: [{ target, email: 'x@' }] });
  assert.equal(mail.success, false);
  assert.match(String(mail.error), /1 人目: 変更後のメールアドレス/);
});

// ── S30/31・S44: LINE 投稿依頼の通知 ─────────────────────────────────────
function lineNotify(setting: string, delivered: object | Error) {
  return new Function('deps', `
    function getSystemSettingValue_() { return deps.setting; }
    function deliverMail_() { if (deps.delivered instanceof Error) throw deps.delivered; return deps.delivered; }
    var Logger = { log: function() {} };
    ${extractFunction(admin, 'notifyLinePostRequest_')}
    ${extractFunction(admin, 'linePostNotifyOutcome_')}
    return linePostNotifyOutcome_;
  `)({ setting, delivered })({}, 'L1', {}, 'a@example.invalid');
}

test('S30/31: 通知先が未設定・配信停止・失敗のときは届いていないと返す', () => {
  assert.deepEqual(lineNotify('', { sent: true }), { notified: false, reason: 'not_configured' });
  assert.deepEqual(lineNotify('n@example.invalid', { sent: false, suppressed: true }), { notified: false, reason: 'suppressed' });
  assert.deepEqual(lineNotify('n@example.invalid', new Error('quota')), { notified: false, reason: 'failed' });
  assert.deepEqual(lineNotify('n@example.invalid', { sent: true }), { notified: true });
});

test('S30/31: 画面は届かなかったときだけ理由つきで知らせる', () => {
  assert.equal(linePostNotNotifiedMessage({ notified: true }), null);
  assert.equal(linePostNotNotifiedMessage(undefined), null);
  assert.match(String(linePostNotNotifiedMessage({ notified: false, reason: 'not_configured' })), /通知先のメールアドレスが設定されていません/);
  assert.match(String(linePostNotNotifiedMessage({ notified: false, reason: 'suppressed' })), /担当者へ直接お知らせください/);
});

test('★S44: 状態を保存してから通知する（保存より前に通知を呼ばない）', () => {
  const body = extractFunction(admin, 'transitionLinePostRequest_');
  const saveAt = body.indexOf('updateRowByKey_(');
  const notifyAt = body.indexOf('linePostNotifyOutcome_(');
  assert.ok(saveAt > 0 && notifyAt > saveAt, '通知が保存より前にある');
  assert.ok(!body.includes('notifyLinePostRequest_('), '戻り値を見ない呼び方が残っている');
  assert.ok(extractFunction(admin, 'saveLinePostRequest_').includes('saved.notification = linePostNotifyOutcome_('));
});

// ── S41: 設定の一括保存 ──────────────────────────────────────────────────
const batchUpsert = new Function(`${extractFunction(admin, 'batchUpsertSystemSettings_')}\nreturn batchUpsertSystemSettings_;`)() as
  (ss: object, u: object[]) => void;

test('S41: 設定シート・列が無いときは黙って戻らず止める', () => {
  const upd = [{ key: 'K', value: 'v' }];
  assert.throws(() => batchUpsert(fakeSs({}), upd), /T_システム設定 シートが無い/);
  assert.throws(() => batchUpsert(fakeSs({ T_システム設定: fakeSheet([['設定キー', '説明']]) }), upd), /「設定キー」「設定値」の列が無い/);
  assert.doesNotThrow(() => batchUpsert(fakeSs({}), []), '更新が無いときは何もしない');
});

// ── S42: 認証アカウントの無効化 ───────────────────────────────────────────
const disableAuth = new Function(`${extractFunction(admin, 'disableAuthAccountsByMemberId_')}\nreturn disableAuthAccountsByMemberId_;`)() as
  (ss: object, id: string) => number;

test('S42: 無効にした件数を返し、シート・列が無ければ止める', () => {
  const sheet = fakeSheet([
    ['認証ID', '会員ID', 'アカウント有効フラグ', '更新日時'],
    ['A1', 'M1', true, ''], ['A2', 'M2', true, ''], ['A3', 'M1', true, ''],
  ]);
  assert.equal(disableAuth(fakeSs({ T_認証アカウント: sheet }), 'M1'), 2);
  assert.equal(sheet.writes.length, 2);
  assert.equal(disableAuth(fakeSs({ T_認証アカウント: fakeSheet([['会員ID', 'アカウント有効フラグ']]) }), 'M1'), 0, '行が無いのは正常');
  assert.throws(() => disableAuth(fakeSs({}), 'M1'), /シートが無い/);
  assert.throws(() => disableAuth(fakeSs({ T_認証アカウント: fakeSheet([['会員ID', '更新日時'], ['M1', '']]) }), 'M1'), /列が無い/);
});

// ── S11・E6: 数え方（関数が大きく外部依存が多いので、数える場所の配線を見る） ─────────────
test('★S11: 抑止されたメールを「送信済み」に数えない', () => {
  const body = extractFunction(admin, 'createMemberApplicationDirectLocked_');
  assert.equal(body.split('emailsSent++').length - 1, 1, 'deliverMail_ の結果を見ずに数える箇所がある');
  assert.ok(body.includes('if (outcome && outcome.sent) result.emailsSent++;'));
  assert.ok(body.includes('emailsSuppressed: 0'));
  assert.ok(extractFunction(admin, 'sendCredentialEmail_').includes("return deliverMail_('CREDENTIAL_EMAIL'"), '送信の結果を返していない');
});

test('★E6: 職員情報の更新人数は反映できた分だけ', () => {
  const body = extractFunction(admin, 'approveAdminChangeRequest_');
  assert.ok(body.includes('approvalResult.staffUpdateCount = appliedStaffUpdates;'));
  assert.ok(!body.includes('approvalResult.staffUpdateCount = staffUpdates.length;'));
  assert.ok(body.indexOf('appliedStaffUpdates++') > body.indexOf('updateStaff_(staffPayload)'), '反映の前に数えている');
});
