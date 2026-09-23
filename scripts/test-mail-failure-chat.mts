/**
 * メール送信の失敗が Google Chat の「要確認」へ流れることを固定する。
 *
 * 背景: 送信失敗は呼び出し側が Logger.log で握りつぶしており、画面にも DB にも
 * 何も残らなかった。2026-09-23 に「Chat は届くのにメールだけ来ない」状態が
 * 実運用で起き、気づく手段が無かった（v376.102 で是正）。
 *
 * 本体と同じロジックをテスト側に書き直すとドリフトするため、gas-src から
 * 実ソースを切り出して評価する（AGENTS §3「テストにミラー実装を書かない」）。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const GAS_SRC = path.join(process.cwd(), 'gas-src', 'Code.full.gs');
const source = fs.readFileSync(GAS_SRC, 'utf8');

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

interface ChatCall { eventType: string; context: Record<string, string> }

function buildNotifier() {
  const calls: ChatCall[] = [];
  const logs: string[] = [];
  const fn = new Function(
    'getOrCreateDatabase_', 'notifyMembershipChatSafely_', 'Logger',
    `${extractFunction('notifyMailFailureToChat_')}; return notifyMailFailureToChat_;`,
  )(
    () => ({}),
    (_ss: unknown, eventType: string, context: Record<string, string>) => { calls.push({ eventType, context }); },
    { log: (m: string) => logs.push(m) },
  ) as (category: string, options: unknown, error: unknown) => void;
  return { fn, calls, logs };
}

test('送信失敗は ANOMALY（要確認）として Chat へ流れる', () => {
  const { fn, calls } = buildNotifier();
  fn('APPLICATION_RECEIPT', {}, new Error('boom'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].eventType, 'ANOMALY');
  assert.equal(calls[0].context['手続種別'], 'メール送信');
  assert.match(calls[0].context['異常内容'], /メールを送信できませんでした/);
  assert.match(calls[0].context['異常内容'], /APPLICATION_RECEIPT/);
  assert.match(calls[0].context['異常内容'], /boom/);
});

test('送信経路を書き分ける（GmailApp 経路の切り分けに要る）', () => {
  const a = buildNotifier();
  a.fn('AUTH_OTP', { from: 'info@example.org' }, new Error('x'));
  assert.match(a.calls[0].context['異常内容'], /GmailApp/);

  const b = buildNotifier();
  b.fn('AUTH_OTP', {}, new Error('x'));
  assert.match(b.calls[0].context['異常内容'], /MailApp/);
});

test('宛先・件名・本文を Chat へ載せない（Chat は外部送信先）', () => {
  const { fn, calls } = buildNotifier();
  fn('CREDENTIAL_EMAIL', { from: 'info@example.org', replyTo: 'member@example.org' }, new Error('送信先 member@example.org が拒否されました'));
  const dumped = JSON.stringify(calls[0].context);
  // エラー文に紛れ込んだ宛先まで消すことはできないが、こちらから宛先・件名・本文を
  // 組み立てて載せてはいけない。options の replyTo が漏れていないことを固定する。
  assert.ok(!dumped.includes('replyTo'), 'options をそのまま載せない');
  assert.equal(calls[0].context['変更内容'], '', '変更内容は空にする');
  assert.equal(calls[0].context['申請ID'], '', '申請IDは空にする');
});

test('Chat 通知が失敗しても例外を投げない（業務処理を止めない）', () => {
  const logs: string[] = [];
  const fn = new Function(
    'getOrCreateDatabase_', 'notifyMembershipChatSafely_', 'Logger',
    `${extractFunction('notifyMailFailureToChat_')}; return notifyMailFailureToChat_;`,
  )(
    () => ({}),
    () => { throw new Error('chat down'); },
    { log: (m: string) => logs.push(m) },
  ) as (category: string, options: unknown, error: unknown) => void;
  assert.doesNotThrow(() => fn('BULK_MAIL', {}, new Error('y')));
  assert.ok(logs.some((l) => l.includes('notifyMailFailureToChat_')), '失敗はログに残す');
});

test('deliverMail_ は失敗を通知したうえで例外を投げ直す', () => {
  const deliver = extractFunction('deliverMail_');
  assert.ok(deliver.includes('notifyMailFailureToChat_(category, finalOptions, sendError)'), '通知を呼ぶ');
  assert.ok(deliver.includes('throw sendError'), '呼び出し側の従来の扱いを変えないため投げ直す');
});
