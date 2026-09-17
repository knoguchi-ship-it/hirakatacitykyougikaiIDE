/**
 * Google Chat 会員手続き通知の機械検証。
 * 実URLや Script Properties は一切読まず、生成元ソースの契約だけを確認する。
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  assert.fail(`${name} の終端が見つからない`);
}

function createTemplateValidator() {
  const tagDefinition = gas.match(/var CHAT_MEMBERSHIP_TEMPLATE_TAGS = [^;]+;/)?.[0];
  assert.ok(tagDefinition, '差し込みタグ定義が見つからない');
  return new Function(`${tagDefinition}\n${extractFunction(gas, 'validateChatMembershipTemplate_')}\nreturn validateChatMembershipTemplate_;`)() as (template: string) => void;
}

test('通知本文は許可済みの差し込みタグだけを受け付ける', () => {
  const validate = createTemplateValidator();
  assert.doesNotThrow(() => validate('手続き: {{手続種別}}\n会員: {{会員名}}'));
  assert.throws(() => validate('不正: {{メールアドレス}}'), /使用できない/);
  assert.throws(() => validate('不正: {{会員名}'), /書式/);
});

test('接続先は Script Properties 経由だけで、設定DBやソースに固定URLを持たない', () => {
  const notify = extractFunction(gas, 'notifyMembershipChatSafely_');
  assert.match(notify, /getScriptProperties\(\)\.getProperty\(CHAT_MEMBERSHIP_WEBHOOK_URL_PROPERTY\)/);
  assert.match(notify, /UrlFetchApp\.fetch\(webhookUrl/);
  assert.doesNotMatch(gas, /https:\/\/chat\.googleapis\.com/);
  assert.doesNotMatch(gas, /CHAT_MEMBERSHIP_WEBHOOK_URL['\"]\s*[:,]/);
});

test('申請IDを共通キーにして、受付と処理完了を同じスレッドへ送る', () => {
  const threadKey = extractFunction(gas, 'buildMembershipChatThreadKey_');
  const appendQuery = extractFunction(gas, 'withChatWebhookQueryParameter_');
  const notify = extractFunction(gas, 'notifyMembershipChatSafely_');
  const makeKey = new Function(`${threadKey}\nreturn buildMembershipChatThreadKey_;`)() as (context: Record<string, string>) => string;
  const append = new Function(`${appendQuery}\nreturn withChatWebhookQueryParameter_;`)() as (url: string, key: string, value: string) => string;
  assert.equal(makeKey({ '申請ID': 'CR123_abc' }), 'membership-request-CR123_abc');
  assert.equal(makeKey({}), '');
  assert.match(append('https://example.test/messages?key=value', 'messageReplyOption', 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD'), /[?&]messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD/);
  assert.match(notify, /payload\.thread = \{ threadKey: threadKey \}/);
  assert.match(notify, /REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD/);
});

test('受付・確定・要確認の各通知が会員手続きの正本フローから呼ばれる', () => {
  assert.match(extractFunction(gas, 'enqueueMemberApplicationChangeRequest_'), /notifyMembershipChatSafely_\(ss, 'REQUEST'/);
  assert.match(extractFunction(gas, 'submitPublicChangeRequest_'), /notifyMembershipChatForMember_\(ss, 'REQUEST'/);
  const approve = extractFunction(gas, 'approveAdminChangeRequest_');
  assert.match(approve, /notifyMembershipChatForMember_\(ss, 'FINAL'/);
  assert.match(approve, /notifyMembershipChatForMember_\(ss, 'ANOMALY'/);
  assert.match(extractFunction(gas, 'updateMemberSelfByPrincipal_'), /notifyMembershipChatForMember_/);
  assert.match(extractFunction(gas, 'withdrawSelfByPrincipal_'), /notifyMembershipChatForMember_/);
  const dispatch = extractFunction(gas, 'processApiRequest');
  assert.match(dispatch, /action === 'updateMember'[\s\S]*notifyMembershipChatForMember_/);
  assert.match(dispatch, /action === 'updateStaff'[\s\S]*updateStaffResult\.memberId/);
  assert.match(dispatch, /action === 'removeStaffFromOffice'[\s\S]*notifyMembershipChatForMember_/);
});

test('通知障害は会員手続きを失敗させない', () => {
  const notify = extractFunction(gas, 'notifyMembershipChatSafely_');
  assert.match(notify, /try \{/);
  assert.match(notify, /catch \(e\)/);
  assert.match(notify, /return \{ sent: false \}/);
});
