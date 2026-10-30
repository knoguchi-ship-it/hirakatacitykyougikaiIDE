import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../gas-src/Code.full.gs', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end < 0 ? source.length : end);
}

const tables = {
  'T_研修申込': ['会員ID', '職員ID', '申込者ID', '削除フラグ'],
  'T_認証アカウント': ['認証ID', '会員ID', '職員ID', 'システムロールコード', 'アカウント有効フラグ', '削除フラグ'],
};
const makeDb = (defs) => ({ getSheetByName: name => {
  const headers = defs[name];
  return headers ? { getLastColumn: () => headers.length, getRange: () => ({ getValues: () => [headers] }) } : null;
} });

function runner(defs, send) {
  let converted = 0;
  const db = makeDb(defs);
  const run = new Function('deps', `
    const getOrCreateDatabase_ = () => deps.db;
    const LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
    const notifyMembershipChatSafely_ = deps.send;
    const convertStaffToIndividual_ = () => ++deps.converted;
    const convertIndividualToStaff_ = () => ++deps.converted;
    ${extract('inspectMemberConversionData_')}
    ${extract('convertMemberType_')}
    return convertMemberType_;
  `)({ db, send, get converted() { return converted; }, set converted(v) { converted = v; } });
  return { run, converted: () => converted };
}

test('正常な表・列では共通処理に進み、異常通知は行わない', () => {
  const notifications = [];
  const t = runner(tables, (...args) => notifications.push(args));
  assert.equal(t.run({ direction: 'INDIVIDUAL_TO_STAFF' }), 1);
  assert.equal(notifications.length, 0);
});
test('表または必要列が無い場合は書込み前に止まり、既存の通知出口を呼ぶ', () => {
  for (const defs of [
    { ...tables, 'T_研修申込': undefined },
    { ...tables, 'T_研修申込': [] },
    { ...tables, 'T_研修申込': ['会員ID', '申込者ID', '削除フラグ'] },
    { ...tables, 'T_認証アカウント': undefined },
    { ...tables, 'T_認証アカウント': ['会員ID', '職員ID', 'システムロールコード', 'アカウント有効フラグ', '削除フラグ'] },
  ]) {
    const notifications = [];
    const t = runner(defs, (...args) => notifications.push(args));
    assert.throws(() => t.run({ direction: 'INDIVIDUAL_TO_STAFF' }), /移行に必要なデータ構造を確認できません/);
    assert.equal(t.converted(), 0);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0][1], 'ANOMALY');
  }
});
test('通常の入力不備では異常通知しない', () => {
  const notifications = [];
  const t = runner(tables, (...args) => notifications.push(args));
  assert.throws(() => t.run({ direction: 'UNKNOWN' }), /不明な direction/);
  assert.equal(notifications.length, 0);
});
test('通知が無効または送信に失敗しても、異常を検出した移行は止まる', () => {
  for (const result of [{ skipped: true }, { sent: false }]) {
    const t = runner({ ...tables, 'T_研修申込': undefined }, () => result);
    assert.throws(() => t.run({ direction: 'STAFF_TO_INDIVIDUAL' }), /移行に必要なデータ構造を確認できません/);
    assert.equal(t.converted(), 0);
  }
});
