/**
 * v376.43 (Phase B) 回帰テスト: メール差し込み描画ロジックの単体検証。
 *  ① {{タグ}} 置換が正しく行われること
 *  ② 認証コード等の requiredValue が描画後本文に無い場合、デフォルト文面へフォールバックして
 *     コードが必ず含まれること（OTP/パスワード再設定の欠落防止 = 安全ガード）
 * を機械検証する。実 GAS 経路の E2E は operator が dryRunMailTemplatesV376_43_LOG で確認する。
 *
 * v376.67 DRY 是正: 以前はここに gas-src と「同一ロジック」のミラー実装を置いていたが、
 * それ自体が二重管理であり、本体を直してもテストが古い挙動を守り続ける危険があった
 * （v376.66 の障害と同じ「同じ処理が別ルートにある」構造）。
 * 実ソースから関数を抽出して評価する方式へ変更した。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gas-src', 'Code.full.gs'), 'utf8',
);

// gas-src のトップレベル関数は閉じ括弧が行頭にある規約なのでそれで切り出す
function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

const renderMergeTags_ = new Function(
  `${extractFunction('renderMergeTags_')}; return renderMergeTags_;`,
)() as (tpl: string, vars: Record<string, string>) => string;

// renderConfiguredMail_ は設定読み出し（getSystemSettingMap_）を伴うため、
// 実ソースを抽出したうえで settings map だけスタブして評価する。
const renderConfiguredMailRaw = new Function(
  'getSystemSettingMap_', 'renderMergeTags_',
  `${extractFunction('renderConfiguredMail_')}; return renderConfiguredMail_;`,
);

function renderConfiguredMail_(
  map: Record<string, string>, subjectKey: string, bodyKey: string,
  defaultSubject: string, defaultBody: string,
  vars: Record<string, string>, requiredValue?: string,
): { subject: string; body: string } {
  const fn = renderConfiguredMailRaw(() => map, renderMergeTags_);
  return fn({}, subjectKey, bodyKey, defaultSubject, defaultBody, vars, requiredValue);
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
