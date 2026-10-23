/**
 * 2026-10-23 回帰テスト B-15: 会員マイページは事業所の一般職員に同僚の行を返さない。
 *
 * docs/03 §3.5「STAFF は自分の情報のみ閲覧」。以前は同じ事業所の全職員の氏名・メール・
 * CM 番号（＝ログイン ID）を返し、画面の「所属職員一覧」にも出ていた。
 * 判定は生成物（会員 split）から limitPortalStaffToCaller_ を取り出して動かす（ミラー実装にしない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function extractFunction(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} の終端が見つからない`);
}

const member = read('gas/member/Code.gs');
const limit = new Function(`${extractFunction(member, 'limitPortalStaffToCaller_')}\nreturn limitPortalStaffToCaller_;`)() as
  (s: object[], a: object[], id: string) => { staffRows: Array<Record<string, string>>; authRows: Array<Record<string, string>> };

const staff = [
  { 職員ID: 'S1', 職員権限コード: 'REPRESENTATIVE', メールアドレス: 'rep@example.invalid' },
  { 職員ID: 'S2', 職員権限コード: 'ADMIN', メールアドレス: 'adm@example.invalid' },
  { 職員ID: 'S3', 職員権限コード: 'STAFF', メールアドレス: 'me@example.invalid' },
  { 職員ID: 'S4', 職員権限コード: '', メールアドレス: 'blank@example.invalid' },
];
const auth = staff.map((s, i) => ({ 職員ID: s.職員ID, ログインID: `1000000${i}` }));
const ids = (rows: Array<Record<string, string>>) => rows.map((r) => r.職員ID);

test('一般職員には自分の行と自分のログインだけを返す', () => {
  const r = limit(staff, auth, 'S3');
  assert.deepEqual(ids(r.staffRows), ['S3']);
  assert.deepEqual(ids(r.authRows), ['S3']);
});

test('代表者・管理者には全員分を返す（職員を管理するため）', () => {
  for (const id of ['S1', 'S2']) {
    const r = limit(staff, auth, id);
    assert.deepEqual(ids(r.staffRows), ['S1', 'S2', 'S3', 'S4'], id);
    assert.equal(r.authRows.length, 4, id);
  }
});

test('権限が空・自分の行が無いときは閉じる側に倒す', () => {
  assert.deepEqual(ids(limit(staff, auth, 'S4').staffRows), ['S4']);
  const missing = limit(staff, auth, 'S9');
  assert.deepEqual(missing.staffRows, []);
  assert.deepEqual(missing.authRows, []);
});

test('個人・賛助会員（職員 ID なし）はそのまま', () => {
  const r = limit([], [{ 職員ID: '', ログインID: '12345678' }], '');
  assert.equal(r.authRows.length, 1);
});

test('★getMemberPortalData_ が mapMembersForApi_ の前に絞っている', () => {
  const body = extractFunction(member, 'getMemberPortalData_');
  const at = body.indexOf('limitPortalStaffToCaller_(staffRows, memberAuthRows, staffId)');
  assert.notEqual(at, -1, '絞り込みを呼んでいない');
  assert.ok(at < body.indexOf('mapMembersForApi_('), '返す前に絞っていない');
});

test('★画面: 一般職員には代表者情報を出さない', () => {
  const form = read('src/components/MemberForm.tsx');
  const at = form.indexOf('{!isBusinessStaffSelfMode && (<>');
  assert.notEqual(at, -1);
  assert.ok(at < form.indexOf('代表者情報</h4>'), '代表者情報の見出しが条件の外にある');
});
