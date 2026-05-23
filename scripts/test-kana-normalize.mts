// v376: src/utils/kanaNormalize.ts の単体テスト。
// 実行: npm run test:kana (Node 22+ の --experimental-strip-types を使用)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeKana,
  isValidFullwidthKatakana,
  normalizeAndValidateKana,
} from '../src/utils/kanaNormalize.ts';

// ── normalizeKana: 形式統一 ───────────────────────────────────────
test('normalizeKana: 半角カナ → 全角カタカナ', () => {
  assert.equal(normalizeKana('ｼｵﾐ'), 'シオミ');
  assert.equal(normalizeKana('ｱｷｴ'), 'アキエ');
});

test('normalizeKana: 半角カナ + 半角濁点 → 全角合成カタカナ', () => {
  assert.equal(normalizeKana('ｶﾞﾝﾀﾞﾑ'), 'ガンダム');
  assert.equal(normalizeKana('ﾊﾟﾝ'), 'パン');
});

test('normalizeKana: ひらがな → カタカナ', () => {
  assert.equal(normalizeKana('しおみ'), 'シオミ');
  assert.equal(normalizeKana('あきえ'), 'アキエ');
  assert.equal(normalizeKana('がんだむ'), 'ガンダム');
});

test('normalizeKana: 全角カタカナはそのまま', () => {
  assert.equal(normalizeKana('シオミ'), 'シオミ');
  assert.equal(normalizeKana('ヴァン'), 'ヴァン');
});

test('normalizeKana: 半角カナ・ひらがな・全角カタカナの混在', () => {
  assert.equal(normalizeKana('ｼオみ'), 'シオミ');
});

test('normalizeKana: 半角長音 ｰ → 全角長音 ー', () => {
  assert.equal(normalizeKana('ﾗｰﾒﾝ'), 'ラーメン');
});

test('normalizeKana: 半角スペース → 全角スペース', () => {
  assert.equal(normalizeKana('シオミ アキエ'), 'シオミ　アキエ');
  assert.equal(normalizeKana('しおみ あきえ'), 'シオミ　アキエ');
});

test('normalizeKana: 半角中点 ･ → 全角中点 ・', () => {
  assert.equal(normalizeKana('ｳﾞｧﾝ･ﾎｰﾃﾝ'), 'ヴァン・ホーテン');
});

test('normalizeKana: 前後 trim', () => {
  assert.equal(normalizeKana('  しおみ  '), 'シオミ');
});

test('normalizeKana: 空文字・null・undefined は空文字を返す', () => {
  assert.equal(normalizeKana(''), '');
  assert.equal(normalizeKana(null), '');
  assert.equal(normalizeKana(undefined), '');
  assert.equal(normalizeKana('   '), '');
});

// ── isValidFullwidthKatakana ────────────────────────────────────
test('isValidFullwidthKatakana: 全角カタカナのみは valid', () => {
  assert.equal(isValidFullwidthKatakana('シオミ'), true);
  assert.equal(isValidFullwidthKatakana('ガンダム'), true);
  assert.equal(isValidFullwidthKatakana('ヴァン・ホーテン'), true);
  assert.equal(isValidFullwidthKatakana('シオミ　アキエ'), true);
});

test('isValidFullwidthKatakana: 空文字は valid', () => {
  assert.equal(isValidFullwidthKatakana(''), true);
});

test('isValidFullwidthKatakana: 漢字・英数字・ひらがなは invalid', () => {
  assert.equal(isValidFullwidthKatakana('塩見'), false);
  assert.equal(isValidFullwidthKatakana('シオミabc'), false);
  assert.equal(isValidFullwidthKatakana('シオミ123'), false);
  assert.equal(isValidFullwidthKatakana('しおみ'), false);
});

test('isValidFullwidthKatakana: 半角スペース・半角カナは invalid（先に normalizeKana を通すこと）', () => {
  assert.equal(isValidFullwidthKatakana('シオミ アキエ'), false);
  assert.equal(isValidFullwidthKatakana('ｼｵﾐ'), false);
});

// ── normalizeAndValidateKana: 統合 API ────────────────────────────
test('normalizeAndValidateKana: 正常入力は valid + 正規化値', () => {
  const r = normalizeAndValidateKana('しおみ');
  assert.equal(r.valid, true);
  assert.equal(r.value, 'シオミ');
});

test('normalizeAndValidateKana: 漢字混入は invalid', () => {
  const r = normalizeAndValidateKana('塩見');
  assert.equal(r.valid, false);
  assert.equal(r.reason, 'invalid_chars');
});

test('normalizeAndValidateKana: 空文字 + required → invalid (empty)', () => {
  const r = normalizeAndValidateKana('', { required: true });
  assert.equal(r.valid, false);
  assert.equal(r.reason, 'empty');
});

test('normalizeAndValidateKana: 空文字 + 任意 → valid', () => {
  const r = normalizeAndValidateKana('');
  assert.equal(r.valid, true);
  assert.equal(r.value, '');
});

// ── 冪等性 (idempotence) ────────────────────────────────────────
test('normalizeKana: 冪等 — normalize(normalize(x)) === normalize(x)', () => {
  const inputs = ['しおみ', 'ｼｵﾐ', 'シオミ', 'ｶﾞﾝﾀﾞﾑ', 'ヴァン・ホーテン', 'シオミ　アキエ'];
  for (const x of inputs) {
    const once = normalizeKana(x);
    const twice = normalizeKana(once);
    assert.equal(twice, once, `not idempotent for ${x}`);
  }
});
