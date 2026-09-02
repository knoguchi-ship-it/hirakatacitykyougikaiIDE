/** v376.59: 入会申込の申請者通知の回帰テスト。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

type ApplicationStaff = { role?: string; email?: string };

function resolveBusinessApplicationRepresentativeEmail_(staff: unknown): string {
  if (!Array.isArray(staff)) return '';
  for (const row of staff as ApplicationStaff[]) {
    if (String(row?.role || '').trim() !== 'REPRESENTATIVE') continue;
    return String(row?.email || '').trim();
  }
  return '';
}

function isSystemSettingValueEnabled_(raw: unknown, defaultValue: boolean): boolean {
  if (raw === '' || raw === null || raw === undefined) return defaultValue;
  return String(raw).trim().toLowerCase() !== 'false';
}

test('事業所入会申込の受付通知先は、職員一覧の先頭ではなく代表者だけ', () => {
  const staff = [
    { role: 'STAFF', email: 'member@example.invalid' },
    { role: 'REPRESENTATIVE', email: 'representative@example.invalid' },
  ];
  assert.equal(resolveBusinessApplicationRepresentativeEmail_(staff), 'representative@example.invalid');
});

test('代表者がいない、またはメール未入力なら宛先を決めず fail-close にできる', () => {
  assert.equal(resolveBusinessApplicationRepresentativeEmail_([{ role: 'STAFF', email: 'member@example.invalid' }]), '');
  assert.equal(resolveBusinessApplicationRepresentativeEmail_([{ role: 'REPRESENTATIVE', email: '  ' }]), '');
});

test('ワークフローメールの OFF は文字列 false でも Boolean false でも必ず停止する', () => {
  assert.equal(isSystemSettingValueEnabled_('false', true), false);
  assert.equal(isSystemSettingValueEnabled_(false, true), false);
  assert.equal(isSystemSettingValueEnabled_(' FALSE ', true), false);
});

test('未設定のワークフローメールだけが既定値に従う', () => {
  assert.equal(isSystemSettingValueEnabled_(undefined, true), true);
  assert.equal(isSystemSettingValueEnabled_(undefined, false), false);
  assert.equal(isSystemSettingValueEnabled_('true', false), true);
});
