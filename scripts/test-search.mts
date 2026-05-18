// v362: src/utils/search.ts の単体テスト。
// 実行: npm run test:search (Node 22+ の --experimental-strip-types を使用)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSearchText,
  compactSearchText,
  matchesSearchQuery,
} from '../src/utils/search.ts';

// ── normalizeSearchText: 形式統一の確認 ───────────────────────────────
test('normalizeSearchText: 半角カナ・全角カナ・ひらがな を同一形式に統一', () => {
  const half = normalizeSearchText('ﾀﾅｶ');    // 半角カナ
  const full = normalizeSearchText('タナカ');   // 全角カナ
  const hira = normalizeSearchText('たなか');   // 全角ひらがな
  assert.equal(half, full, '半角カナ ≠ 全角カナ');
  assert.equal(full, hira, '全角カナ ≠ ひらがな');
  assert.equal(half, 'タナカ');
});

test('normalizeSearchText: 濁音・半濁音の各形式を統一', () => {
  const half = normalizeSearchText('ｶﾞｷﾞｸﾞ');  // 半角カナ + 半角濁点
  const full = normalizeSearchText('ガギグ');    // 全角合成
  const hira = normalizeSearchText('がぎぐ');    // ひらがな合成
  assert.equal(half, full);
  assert.equal(full, hira);
  assert.equal(half, 'ガギグ');
});

test('normalizeSearchText: 全角英数・半角英数を統一', () => {
  assert.equal(normalizeSearchText('ＡＢＣ123'), 'abc123');
  assert.equal(normalizeSearchText('abc１２３'), 'abc123');
});

test('normalizeSearchText: 大文字・小文字を統一', () => {
  assert.equal(normalizeSearchText('Hello'), 'hello');
  assert.equal(normalizeSearchText('ＨＥＬＬＯ'), 'hello');
});

test('normalizeSearchText: 前後空白を除去（途中スペースは保持）', () => {
  assert.equal(normalizeSearchText('  田中 太郎  '), '田中 太郎');
});

test('normalizeSearchText: null / undefined / 数値の安全処理', () => {
  assert.equal(normalizeSearchText(null), '');
  assert.equal(normalizeSearchText(undefined), '');
  assert.equal(normalizeSearchText(123), '123');
});

// ── matchesSearchQuery: 実用ケース ───────────────────────────────────
test('matchesSearchQuery: ひらがな入力で半角カナ DB にヒット', () => {
  // 想定: T_事業所職員.フリガナ = "ﾀﾅｶ ﾀﾛｳ"
  const haystack = ['ﾀﾅｶ ﾀﾛｳ', '田中 太郎'];
  assert.equal(matchesSearchQuery('たなか', haystack), true);
  assert.equal(matchesSearchQuery('たなか たろう', haystack), true);
});

test('matchesSearchQuery: 全角カナ入力で半角カナ DB にヒット', () => {
  const haystack = ['ﾔﾏﾀﾞ ﾊﾅｺ'];
  assert.equal(matchesSearchQuery('ヤマダ', haystack), true);
  assert.equal(matchesSearchQuery('ヤマダ ハナコ', haystack), true);
});

test('matchesSearchQuery: 半角カナ入力で全角ひらがな DB にヒット', () => {
  const haystack = ['すずき いちろう'];
  assert.equal(matchesSearchQuery('ｽｽﾞｷ', haystack), true);
});

test('matchesSearchQuery: 多語 AND 検索（空白区切り）', () => {
  const haystack = ['田中 太郎', '介護太郎事業所'];
  assert.equal(matchesSearchQuery('田中 事業所', haystack), true);
  assert.equal(matchesSearchQuery('田中 鈴木', haystack), false);
});

test('matchesSearchQuery: 全角スペース・連続スペースの許容', () => {
  const haystack = ['田中 太郎'];
  assert.equal(matchesSearchQuery('田中　太郎', haystack), true);
  assert.equal(matchesSearchQuery('田中   太郎', haystack), true);
});

test('matchesSearchQuery: スペース除去マッチ（"田中太郎" でも "田中 太郎" にヒット）', () => {
  const haystack = ['田中 太郎'];
  assert.equal(matchesSearchQuery('田中太郎', haystack), true);
});

test('matchesSearchQuery: 空クエリは全件マッチ', () => {
  assert.equal(matchesSearchQuery('', ['anything']), true);
  assert.equal(matchesSearchQuery('   ', ['anything']), true);
});

test('matchesSearchQuery: 英数字の半角・全角混在', () => {
  const haystack = ['CM12345678 田中'];
  assert.equal(matchesSearchQuery('ｃｍ12345678', haystack), true);
  assert.equal(matchesSearchQuery('CM１２３４５６７８', haystack), true);
});

test('matchesSearchQuery: フリガナ正本（半角カナ）に対し3形式すべてヒット', () => {
  // 実際の T_事業所職員.フリガナ は半角カナで保存される
  const haystack = ['ｽｽﾞｷ ﾊﾅｺ', '鈴木 花子', '介護センター花子'];
  assert.equal(matchesSearchQuery('ｽｽﾞｷ', haystack), true, '半角カナ NG');
  assert.equal(matchesSearchQuery('スズキ', haystack), true, '全角カナ NG');
  assert.equal(matchesSearchQuery('すずき', haystack), true, 'ひらがな NG');
  assert.equal(matchesSearchQuery('鈴木', haystack), true, '漢字 NG');
});

// ── compactSearchText: 圧縮形 ───────────────────────────────────────
test('compactSearchText: スペースを全部除去', () => {
  assert.equal(compactSearchText('  田中  太郎　次郎 '), '田中太郎次郎');
});
