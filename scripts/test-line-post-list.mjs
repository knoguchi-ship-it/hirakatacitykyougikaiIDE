import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../gas-src/Code.full.gs', import.meta.url), 'utf8');
const start = source.indexOf('function listLinePostRequests_(');
assert.notEqual(start, -1);
let depth = 0;
let end = -1;
for (let i = source.indexOf('{', start); i < source.length; i++) {
  if (source[i] === '{') depth++;
  if (source[i] === '}' && --depth === 0) { end = i + 1; break; }
}
assert.notEqual(end, -1);
function run(rows, payload = {}, canManage = true) {
  const fn = new Function('getOrCreateDatabase_', 'ensureLinePostRequestSheet_', 'lineCanManage_', 'Session', 'getRowsAsObjects_', 'rowToLinePostRequest_',
    `${source.slice(start, end)}; return listLinePostRequests_;`)(
    () => ({}), () => {}, () => canManage, { getActiveUser: () => ({ getEmail: () => '' }) },
    () => rows, row => ({ createdAt: row.createdAt }));
  return fn(payload);
}
test('表示上限を超えたときだけ続きがあることを返す', () => {
  const rows = [{ createdAt: '1' }, { createdAt: '2' }, { createdAt: '3' }];
  assert.equal(run(rows, { limit: 2 }).hasMore, true);
  assert.equal(run(rows, { limit: 3 }).hasMore, false);
  assert.equal(run([], { limit: 2 }).hasMore, false);
  assert.equal(run(rows, { limit: 2 }).total, 2);
});
test('表示対象外の行は続きの件数に含めない', () => {
  const rows = [{ createdAt: '1', 削除フラグ: false }, { createdAt: '2', 削除フラグ: true }];
  assert.equal(run(rows, { limit: 1 }).hasMore, false);
  const scoped = [{ createdAt: '1', 作成者メール: 'me@example.invalid', ステータス: 'DRAFT' },
    { createdAt: '2', 作成者メール: 'other@example.invalid', ステータス: 'DRAFT' },
    { createdAt: '3', 作成者メール: 'me@example.invalid', ステータス: 'POSTED' }];
  assert.equal(run(scoped, { limit: 1, status: 'DRAFT', __adminSession: { loginId: 'me@example.invalid' } }, false).hasMore, false);
});
