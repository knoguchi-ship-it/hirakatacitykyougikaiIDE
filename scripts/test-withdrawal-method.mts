/**
 * 退会方式選択と確認欄設定の回帰テスト。
 *
 * GAS の設定正規化は生成元ソースから抽出・実行し、テスト側に同じ判定を複製しない。
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS,
  normalizeWithdrawalConfirmationItems,
} from '../src/shared/withdrawalConfirmation.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');
const publicArtifact = fs.readFileSync(path.join(ROOT, 'backend', 'Code.gs'), 'utf8');
const adminArtifact = fs.readFileSync(path.join(ROOT, 'gas', 'admin', 'Code.gs'), 'utf8');

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

function createServerNormalizer() {
  const definitionStart = gas.indexOf("var WITHDRAWAL_CONFIRMATION_ITEM_IDS_ =");
  assert.notEqual(definitionStart, -1, '退会確認項目の識別子定義が見つからない');
  const definitionEnd = gas.indexOf('\n', definitionStart);
  const factory = new Function(`
    ${gas.slice(definitionStart, definitionEnd)}
    ${extractFunction(gas, 'normalizeWithdrawalConfirmationItems_')}
    return normalizeWithdrawalConfirmationItems_;
  `) as () => (items: unknown) => unknown;
  return factory();
}

test('確認欄の既定5項目は固定識別子を持ち、未設定時にも復元される', () => {
  assert.deepEqual(
    DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS.map((item) => item.id),
    ['method', 'effectiveDate', 'memberPortal', 'cancellation', 'approval'],
  );
  assert.deepEqual(normalizeWithdrawalConfirmationItems(undefined), DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS);
});

test('サーバ側設定の正規化は5項目すべてを受け付け、識別子順に返す', () => {
  const normalizeServer = createServerNormalizer();
  const reversed = [...DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS].reverse();
  const normalized = normalizeServer(reversed) as typeof DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS;
  assert.deepEqual(normalized.map((item) => item.id), DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS.map((item) => item.id));
});

test('サーバ側設定は項目の不足・重複を拒否する', () => {
  const normalizeServer = createServerNormalizer();
  assert.throws(() => normalizeServer(DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS.slice(1)), /不足/);
  assert.throws(() => normalizeServer([...DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS, DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS[0]]), /識別子/);
});

test('公開申請は退会方式を記録し、承認時に即時退会をログイン無効化とともに適用する', () => {
  const submit = extractFunction(gas, 'submitPublicChangeRequest_');
  const approve = extractFunction(gas, 'approveAdminChangeRequest_');
  assert.match(submit, /payload\.withdrawalMethod/);
  assert.match(submit, /withdrawalMethod !== 'FISCAL_YEAR_END'/);
  assert.match(submit, /withdrawalMethod !== 'IMMEDIATE'/);
  assert.match(approve, /status: 'WITHDRAWN'/);
  assert.match(approve, /midYearWithdrawal: true/);
  assert.match(approve, /disableAuthAccountsByMemberId_\(ss, memberId\)/);
  assert.match(approve, /status: 'WITHDRAWAL_SCHEDULED'/);
});

test('generated public and admin artifacts retain the withdrawal contracts', () => {
  assert.match(publicArtifact, /payload\.withdrawalMethod/);
  assert.match(publicArtifact, /withdrawalMethod !== 'FISCAL_YEAR_END'/);
  assert.match(publicArtifact, /withdrawalConfirmationItems: ppWithdrawalConfirmationItems/);
  assert.match(adminArtifact, /request\.withdrawalConfirmationItems/);
  assert.match(adminArtifact, /status: 'WITHDRAWN'/);
  assert.match(adminArtifact, /disableAuthAccountsByMemberId_\(ss, memberId\)/);
});
