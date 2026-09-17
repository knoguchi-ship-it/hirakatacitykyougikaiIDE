/**
 * メール配信状態（停止 / 通常送信 / テスト集約）の正本化を検証する。
 * GAS 本体から関数を抽出して評価し、テスト側に判定を複製しない。
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

function createMailDeliveryFunctions() {
  const constants = gas.match(/var MAIL_DELIVERY_STATE_STOPPED_[\s\S]*?var MAIL_DELIVERY_STATE_REDIRECT_ = 'REDIRECT';/)?.[0];
  assert.ok(constants, 'メール配信状態の定数が見つからない');
  const source = [
    constants,
    extractFunction(gas, 'normalizeMailDeliveryState_'),
    extractFunction(gas, 'getMailDeliveryState_'),
    extractFunction(gas, 'legacyMailDispatchValues_'),
    'return { getMailDeliveryState_, legacyMailDispatchValues_ };',
  ].join('\n');
  return new Function(source)() as {
    getMailDeliveryState_: (map: Record<string, string>) => string;
    legacyMailDispatchValues_: (state: string) => { globalEnabled: string; deliveryMode: string };
  };
}

test('配信状態は新しい一つの設定を最優先する', () => {
  const { getMailDeliveryState_ } = createMailDeliveryFunctions();
  assert.equal(getMailDeliveryState_({ MAIL_DELIVERY_STATE: 'STOPPED', MAIL_GLOBAL_ENABLED: 'false' }), 'STOPPED');
  assert.equal(getMailDeliveryState_({ MAIL_DELIVERY_STATE: 'LIVE', MAIL_GLOBAL_ENABLED: 'false' }), 'LIVE');
  assert.equal(getMailDeliveryState_({ MAIL_DELIVERY_STATE: 'REDIRECT' }), 'REDIRECT');
});

test('旧SUPPRESSは停止へ読み替え、旧保存値も後方互換を保つ', () => {
  const { getMailDeliveryState_, legacyMailDispatchValues_ } = createMailDeliveryFunctions();
  assert.equal(getMailDeliveryState_({ MAIL_DELIVERY_MODE: 'SUPPRESS' }), 'STOPPED');
  assert.equal(getMailDeliveryState_({ MAIL_GLOBAL_ENABLED: 'false', MAIL_DELIVERY_MODE: 'REDIRECT' }), 'STOPPED');
  assert.equal(getMailDeliveryState_({ MAIL_GLOBAL_ENABLED: 'true', MAIL_DELIVERY_MODE: 'REDIRECT' }), 'REDIRECT');
  // v376.95 初回版が誤って追加した STOPPED は、旧キーが LIVE/REDIRECT なら既存運用を優先する。
  assert.equal(getMailDeliveryState_({ MAIL_DELIVERY_STATE: 'STOPPED', MAIL_GLOBAL_ENABLED: 'true', MAIL_DELIVERY_MODE: 'LIVE' }), 'LIVE');
  assert.equal(getMailDeliveryState_({ MAIL_DELIVERY_STATE: 'STOPPED', MAIL_GLOBAL_ENABLED: 'true', MAIL_DELIVERY_MODE: 'REDIRECT' }), 'REDIRECT');
  assert.deepEqual(legacyMailDispatchValues_('STOPPED'), { globalEnabled: 'false', deliveryMode: 'LIVE' });
  assert.deepEqual(legacyMailDispatchValues_('LIVE'), { globalEnabled: 'true', deliveryMode: 'LIVE' });
  assert.deepEqual(legacyMailDispatchValues_('REDIRECT'), { globalEnabled: 'true', deliveryMode: 'REDIRECT' });
});

test('メールの送信出口は配信状態の正本を経由する', () => {
  const policy = extractFunction(gas, 'mailDispatchPolicy_');
  const save = extractFunction(gas, 'updateSystemSettings_');
  assert.match(policy, /getMailDeliveryState_\(getSystemSettingMap_\(ss\)\)/);
  assert.match(save, /MAIL_DELIVERY_STATE/);
});

test('初期化で配信状態を停止として追加し、既存の通常送信を止めない', () => {
  const defaults = gas.match(/var mailGuardDefaults = \[[\s\S]*?\n  \];/)?.[0] || '';
  assert.doesNotMatch(defaults, /MAIL_DELIVERY_STATE/);
});
