// 会員一覧の「継続年数」（2026-11-01・docs/317 §9.4 S で発見: 入会当日の正午より前に「-1年」と出た）。
// 実際の部品（src/shared/memberTenure.ts）と、会員一覧がそれを使っていることを確かめる。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeTenureYears } from '../src/shared/memberTenure.ts';

// 画面と同じく、入会日は「その日の正午」で渡される（src/App.tsx の parseDateString）
const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0, 0);
const at = (y: number, m: number, d: number, h: number) => new Date(y, m - 1, d, h, 0, 0, 0);

test('入会した当日は、正午より前でも 0 年（以前は -1 年）', () => {
  assert.equal(computeTenureYears(noon(2026, 11, 1), at(2026, 11, 1, 9)), 0);
  assert.equal(computeTenureYears(noon(2026, 11, 1), at(2026, 11, 1, 18)), 0);
});

test('満年数で数える（記念日の前日までは前の年数）', () => {
  assert.equal(computeTenureYears(noon(2020, 4, 1), at(2026, 3, 31, 23)), 5);
  assert.equal(computeTenureYears(noon(2020, 4, 1), at(2026, 4, 1, 0)), 6);
  assert.equal(computeTenureYears(noon(2025, 11, 2), at(2026, 11, 1, 12)), 0);
  assert.equal(computeTenureYears(noon(2025, 11, 1), at(2026, 11, 1, 8)), 1);
});

test('入会日が無い・未来の日付なら 0（負の年数を出さない）', () => {
  assert.equal(computeTenureYears(null, at(2026, 11, 1, 12)), 0);
  assert.equal(computeTenureYears(new Date('invalid'), at(2026, 11, 1, 12)), 0);
  assert.equal(computeTenureYears(noon(2027, 1, 1), at(2026, 11, 1, 12)), 0);
});

test('会員一覧の継続年数はこの部品を使う（独自の計算を持たない）', () => {
  const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /import \{ computeTenureYears \} from '\.\/shared\/memberTenure'/);
  assert.doesNotMatch(app, /365\.25/);
});
