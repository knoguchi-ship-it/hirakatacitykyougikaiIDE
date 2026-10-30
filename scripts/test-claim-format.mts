import test from 'node:test';
import assert from 'node:assert/strict';
import { formatClaimUnitQuantity } from '../src/shared/claimFormat.ts';

test('単価と数量は請求の値を使い、単価 0 も保つ', () => {
  assert.equal(formatClaimUnitQuantity({ 単価: 0, 数量: 3, 請求金額: 100 }), '¥0 × 3');
  assert.equal(formatClaimUnitQuantity({ 単価: 1200, 数量: 2, 請求金額: 2400 }), '¥1,200 × 2');
});
