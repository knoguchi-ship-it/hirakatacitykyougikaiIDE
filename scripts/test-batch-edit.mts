/**
 * v376.69 回帰テスト: 一括編集の対象拡張。
 *
 * 背景（docs/261 T-07 B）: 一括編集で直せるのは 6 項目だけで、住所や電話をまとめて直すには
 * スプレッドシートを直接開くしかなかった。GCP 移行後はそれができなくなるため、
 * 連絡先・勤務先・自宅まで対象を広げた。
 *
 * 壊れると実害が大きいのは次の 3 点。実ソースから抽出して機械検証する。
 *   1. 許可リストに無い項目を一括更新で書き換えられないこと（氏名・専門員番号などを守る）
 *   2. 事業所職員に、その人が持たない列を書き込もうとしないこと（T_事業所職員 に電話・住所の列は無い）
 *   3. フロントが送る項目と、GAS が受け付ける項目が一致していること
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');
const editor = fs.readFileSync(path.join(ROOT, 'src', 'MemberBatchEditor.tsx'), 'utf8');

function extractArray(src: string, name: string): string[] {
  const start = src.indexOf(`${name} = [`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  const end = src.indexOf('];', start);
  return [...src.slice(start, end).matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const individualFields = extractArray(gas, 'var ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_');
const staffFields = extractArray(gas, 'var ADMIN_BATCH_PERSON_WRITABLE_STAFF_');
const memberOnlyFields = extractArray(editor, 'const MEMBER_ONLY_FIELDS: Array<keyof EditablePerson>');

// ── 許可リストの内容 ──────────────────────────────────────
test('会員の一括編集で 連絡先・勤務先・自宅 を更新できる', () => {
  for (const f of ['phone', 'fax', 'mobilePhone',
    'officeName', 'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
    'homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine', 'homeAddressLine2']) {
    assert.ok(individualFields.includes(f), `${f} が許可リストに無い`);
  }
  // 従来の 6 項目も残っていること（非退行）
  for (const f of ['email', 'mailingPreference', 'preferredMailDestination', 'status', 'joinedDate', 'withdrawnDate']) {
    assert.ok(individualFields.includes(f), `${f} が欠落している`);
  }
});

test('★一括編集で本人特定に関わる項目は書き換えられない', () => {
  // 氏名・カナ・介護支援専門員番号（会員ログイン ID）・会員種別を一括で書き換えると事故が大きい
  for (const f of ['lastName', 'firstName', 'lastKana', 'firstKana', 'careManagerNumber', 'memberType', 'staffLimit']) {
    assert.ok(!individualFields.includes(f), `${f} を一括編集で書き換えられてはならない`);
    assert.ok(!staffFields.includes(f), `${f} を一括編集で書き換えられてはならない`);
  }
});

test('★職員には持たない列を書き込まない（T_事業所職員 に電話・住所の列は無い）', () => {
  const staffTable = gas.slice(gas.indexOf('T_事業所職員: ['), gas.indexOf('T_事業所職員: [') + 600);
  assert.ok(!staffTable.includes('電話'), '前提が変わっている: 職員テーブルに電話列が増えた');
  assert.ok(!staffTable.includes('住所'), '前提が変わっている: 職員テーブルに住所列が増えた');
  for (const f of ['phone', 'fax', 'mobilePhone', 'officePostCode', 'homePostCode']) {
    assert.ok(!staffFields.includes(f), `${f} は職員の許可リストに入れてはならない（保存先が無い）`);
  }
});

// ── フロントと GAS の一致 ─────────────────────────────────
test('★フロントが送る拡張項目を GAS がすべて受け付ける', () => {
  assert.ok(memberOnlyFields.length >= 14, `拡張項目が少ない: ${memberOnlyFields.length}`);
  for (const f of memberOnlyFields) {
    assert.ok(individualFields.includes(f),
      `フロントは ${f} を送るが GAS の許可リストに無い（送っても無視される）`);
  }
});

test('★拡張項目は会員行だけに送る（職員行では送信しない）', () => {
  // buildPayload の中で、拡張項目のループが OFFICE_STAFF 以外の分岐に入っていること
  const idx = editor.indexOf('const buildPayload');
  const block = editor.slice(idx, idx + 900);
  const branchIdx = block.indexOf("person.personType !== 'OFFICE_STAFF'");
  const loopIdx = block.indexOf('for (const key of MEMBER_ONLY_FIELDS)');
  assert.notEqual(branchIdx, -1, '職員判定の分岐が無い');
  assert.notEqual(loopIdx, -1, '拡張項目の送信ループが無い');
  assert.ok(loopIdx > branchIdx, '拡張項目が職員にも送られている');
});

test('★変更検知（isDirty）が拡張項目も見る', () => {
  const idx = editor.indexOf('const isDirty');
  const block = editor.slice(idx, idx + 800);
  assert.match(block, /MEMBER_ONLY_FIELDS/, '拡張項目を編集しても保存対象にならない');
});

test('件数上限は維持されている（一度に壊せる範囲を制限する）', () => {
  assert.match(gas, /payload\.records\.length > 100/);
  assert.match(gas, /一括編集は最大100件までです/);
});
