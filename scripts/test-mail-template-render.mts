/**
 * v376.43 (Phase B) 回帰テスト: メール差し込み描画ロジックの単体検証。
 * gas-src/Code.full.gs の renderBizEmailTemplate_ / renderConfiguredMail_ のロジックを忠実に再現し、
 *  ① {{タグ}} 置換が正しく行われること
 *  ② 認証コード等の requiredValue が描画後本文に無い場合、デフォルト文面へフォールバックして
 *     コードが必ず含まれること（OTP/パスワード再設定の欠落防止 = 安全ガード）
 * を機械検証する。実 GAS 経路の E2E は operator が dryRunMailTemplatesV376_43_LOG で確認する。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// ── gas-src の renderBizEmailTemplate_ と同一ロジック ──
function renderBizEmailTemplate_(template: string, vars: Record<string, string>): string {
  let result = String(template || '');
  for (const k of Object.keys(vars)) {
    result = result.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(vars[k] == null ? '' : vars[k]));
  }
  return result;
}

// ── gas-src の renderConfiguredMail_ と同一ロジック（settings は map で注入） ──
function renderConfiguredMail_(
  map: Record<string, string>, subjectKey: string, bodyKey: string,
  defaultSubject: string, defaultBody: string,
  vars: Record<string, string>, requiredValue?: string,
): { subject: string; body: string } {
  const subjTpl = String(map[subjectKey] || '') || defaultSubject;
  const bodyTpl = String(map[bodyKey] || '') || defaultBody;
  let subject = renderBizEmailTemplate_(subjTpl, vars);
  let body = renderBizEmailTemplate_(bodyTpl, vars);
  if (requiredValue && body.indexOf(String(requiredValue)) < 0) {
    subject = renderBizEmailTemplate_(defaultSubject, vars);
    body = renderBizEmailTemplate_(defaultBody, vars);
  }
  return { subject, body };
}

const OTP_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{用途}} 確認コード';
const OTP_DEFAULT_BODY = '{{会員名}} 様\n\n{{用途}}の認証コードをお送りします。\n\n認証コード: {{認証コード}}\n\nこのコードは{{有効期限}}有効です。';
const PW_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】パスワード再設定手続き';
const PW_DEFAULT_BODY = '{{ユーザー名}} 様\n\n確認コード: {{確認コード}}\n有効期限: {{有効期限}}\n会員マイページURL:\n{{会員マイページURL}}';

test('タグ置換: 設定テンプレが全タグを含む場合は設定値を使用し全て置換される', () => {
  const map = { AUTH_OTP_SUBJECT: '【確認】{{用途}}', AUTH_OTP_BODY: '{{会員名}}様 コード:{{認証コード}} ({{有効期限}})' };
  const m = renderConfiguredMail_(map, 'AUTH_OTP_SUBJECT', 'AUTH_OTP_BODY', OTP_DEFAULT_SUBJECT, OTP_DEFAULT_BODY,
    { '会員名': '山田太郎', '用途': '会員情報変更', '認証コード': '123456', '有効期限': '10分間' }, '123456');
  assert.equal(m.subject, '【確認】会員情報変更');
  assert.equal(m.body, '山田太郎様 コード:123456 (10分間)');
  assert.ok(m.body.includes('123456'));
});

test('安全ガード: 設定テンプレが認証コードタグを欠く場合はデフォルト文面へフォールバックしコードが必ず入る', () => {
  // 管理者が誤って {{認証コード}} を消したテンプレ
  const map = { AUTH_OTP_SUBJECT: '【確認】', AUTH_OTP_BODY: 'コードは画面に表示されます' };
  const m = renderConfiguredMail_(map, 'AUTH_OTP_SUBJECT', 'AUTH_OTP_BODY', OTP_DEFAULT_SUBJECT, OTP_DEFAULT_BODY,
    { '会員名': '山田太郎', '用途': '会員情報変更', '認証コード': '999999', '有効期限': '10分間' }, '999999');
  assert.ok(m.body.includes('999999'), 'フォールバックで認証コードが本文に含まれること');
  assert.ok(m.body.includes('山田太郎'));
});

test('安全ガード: パスワード再設定の確認コード欠落時もデフォルトで必ずコードが入る', () => {
  const map = { PASSWORD_RESET_BODY: 'パスワードを再設定してください' };
  const m = renderConfiguredMail_(map, 'PASSWORD_RESET_SUBJECT', 'PASSWORD_RESET_BODY', PW_DEFAULT_SUBJECT, PW_DEFAULT_BODY,
    { 'ユーザー名': '山田太郎', '確認コード': '654321', '有効期限': '30分', '会員マイページURL': 'https://example.com' }, '654321');
  assert.ok(m.body.includes('654321'), 'フォールバックで確認コードが本文に含まれること');
});

test('未設定キーはデフォルトを使用する', () => {
  const m = renderConfiguredMail_({}, 'AUTH_OTP_SUBJECT', 'AUTH_OTP_BODY', OTP_DEFAULT_SUBJECT, OTP_DEFAULT_BODY,
    { '会員名': '佐藤花子', '用途': '退会申請', '認証コード': '111222', '有効期限': '10分間' }, '111222');
  assert.ok(m.subject.includes('退会申請'));
  assert.ok(m.body.includes('111222'));
  assert.ok(m.body.includes('佐藤花子'));
});

test('requiredValue 未指定の通常メールは設定テンプレをそのまま描画（フォールバックしない）', () => {
  const map = { WITHDRAWAL_CONFIRM_BODY: '{{会員名}} 様 退会予定日:{{退会予定日}}' };
  const m = renderConfiguredMail_(map, 'WITHDRAWAL_CONFIRM_SUBJECT', 'WITHDRAWAL_CONFIRM_BODY',
    '退会受付', '既定本文', { '会員名': '山田太郎', '退会予定日': '2027-03-31' });
  assert.equal(m.body, '山田太郎 様 退会予定日:2027-03-31');
  assert.equal(m.subject, '退会受付'); // subject 設定なし→デフォルト
});
