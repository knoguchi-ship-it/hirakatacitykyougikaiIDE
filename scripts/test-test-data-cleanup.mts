import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync('gas-src/Code.full.gs', 'utf8');

test('テストデータ削除は正規E2E用メールアドレスだけを厳格に対象化する', () => {
  assert.match(source, /function isStrictE2ETestMemberEmail_\(value\)/);
  assert.match(source, /\^test-member-\[\^@\\s\]\+@example\\\.invalid\$/);
  assert.match(source, /isStrictE2ETestMemberEmail_\(row\['連絡先メールアドレス'\]\)/);
  assert.doesNotMatch(source, /test-member-\.\*/);
});

test('E2E専用削除は変更申請をプレビューと実行の両方で扱い、旧デモ削除と分離する', () => {
  assert.match(source, /function previewStrictE2ETestMemberCleanup_LOG\(\)/);
  assert.match(source, /function executeStrictE2ETestMemberCleanup_APPLY\(\)/);
  assert.match(source, /'T_変更申請', '申請ID', targets\.changeRequests/);
  assert.match(source, /既存の deleteTestData_APPLY（旧デモ／外部申込者を含む）とは分離/);
});
