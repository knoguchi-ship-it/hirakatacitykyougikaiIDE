/**
 * v376.60: メール設定の純粋ロジック回帰。
 * GAS 本体と同じ判定を独立して検証し、Boolean false の取り違えと
 * 自動通知の送信元適用範囲が再発しないことを確認する。
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

function readSystemSettingValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function isEnabled(raw: unknown, defaultValue: boolean): boolean {
  if (raw === '' || raw === null || raw === undefined) return defaultValue;
  return String(raw).trim().toLowerCase() !== 'false';
}

function isAutomatedMailCategory(category: string): boolean {
  return new Set([
    'APPLICATION_RECEIPT', 'APPROVAL_NOTIFICATION', 'REJECTION_NOTIFICATION',
    'CREDENTIAL_EMAIL', 'BIZ_REP_EMAIL', 'BIZ_STAFF_EMAIL',
    'STAFF_ADD_STAFF_EMAIL', 'STAFF_ADD_REP_EMAIL', 'TRAINING_APPLY_RECEIPT',
    'TRAINING_REMINDER', 'AUTH_OTP', 'MEMBER_UPDATE_CONFIRM',
    'WITHDRAWAL_CONFIRM', 'PASSWORD_RESET',
  ]).has(category.toUpperCase());
}

function automatedMailOptions(configuredFrom: string, options: Record<string, unknown> = {}): Record<string, unknown> {
  const merged = { ...options };
  if (configuredFrom.trim() && !String(merged.from || '').trim()) {
    merged.from = configuredFrom.trim();
    if (!String(merged.replyTo || '').trim()) merged.replyTo = configuredFrom.trim();
  }
  if (!String(merged.name || '').trim()) merged.name = '枚方市介護支援専門員連絡協議会';
  return merged;
}

test('Boolean false を未設定に変換しない', () => {
  assert.equal(readSystemSettingValue(false), 'false');
  assert.equal(isEnabled(readSystemSettingValue(false), true), false);
  assert.equal(isEnabled(readSystemSettingValue('false'), true), false);
});

test('未設定だけが既定値を使う', () => {
  assert.equal(isEnabled(readSystemSettingValue(null), true), true);
  assert.equal(isEnabled(readSystemSettingValue(undefined), false), false);
});

test('自動通知だけに共通送信元を適用する', () => {
  assert.equal(isAutomatedMailCategory('APPLICATION_RECEIPT'), true);
  assert.equal(isAutomatedMailCategory('PASSWORD_RESET'), true);
  assert.equal(isAutomatedMailCategory('BULK_MAIL'), false);
  assert.equal(isAutomatedMailCategory('LINE_POST_REQUEST'), false);
});

test('共通送信元は明示済み送信元を上書きしない', () => {
  assert.deepEqual(automatedMailOptions('office@example.invalid'), {
    from: 'office@example.invalid', replyTo: 'office@example.invalid', name: '枚方市介護支援専門員連絡協議会',
  });
  assert.deepEqual(automatedMailOptions('office@example.invalid', { from: 'manual@example.invalid', name: '手動送信' }), {
    from: 'manual@example.invalid', name: '手動送信',
  });
});
