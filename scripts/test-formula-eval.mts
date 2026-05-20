// v373 (Roster S3): formulaEval.ts の単体テスト
// 実行: npm run test:formula
//
// セキュリティガード（許可されない式は必ず compile or evaluate で reject される）
// と機能（フィールド参照・関数・演算子）の両方を網羅する。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileFormula,
  evaluateFormula,
  evaluateCondition,
  FORMULA_FUNCTIONS,
} from '../src/lib/formulaEval.ts';

const scope = {
  lastName: '山田',
  firstName: '太郎',
  feeStatus: 'UNPAID',
  annualFee: 5000,
  joinedDate: '2024-04-01',
  empty: '',
  zero: 0,
};

// =============== セキュリティ ===============

test('reject: eval', () => {
  assert.equal(compileFormula('eval("1")').ok, false);
});

test('reject: Function', () => {
  assert.equal(compileFormula('Function("return 1")()').ok, false);
});

test('reject: メンバアクセス（プロトタイプ汚染防止）', () => {
  const r = compileFormula('obj.constructor');
  assert.equal(r.ok, false);
  assert.match(r.error || '', /プロパティアクセス/);
});

test('reject: this', () => {
  assert.equal(compileFormula('this').ok, false);
});

test('reject: 配列リテラル', () => {
  assert.equal(compileFormula('[1,2,3]').ok, false);
});

test('reject: 未許可関数 (alert / require / fetch)', () => {
  for (const name of ['alert', 'require', 'fetch', 'setTimeout', 'Object', 'Array']) {
    const r = compileFormula(`${name}(1)`);
    assert.equal(r.ok, false, `${name} should be rejected`);
  }
});

test('reject: 未許可演算子 (** / >>>)', () => {
  // jsep 自体が >>> をサポートしないかもしれないが、念のためチェック
  const r = compileFormula('a >>> b');
  // jsep がパースに失敗するか、validateAst が拒否するか、いずれにせよ ok=false
  assert.equal(r.ok, false);
});

test('reject: 空式', () => {
  assert.equal(compileFormula('').ok, false);
  assert.equal(compileFormula('   ').ok, false);
});

test('reject: 過剰な長さ', () => {
  const long = 'a'.repeat(10_001);
  assert.equal(compileFormula(long).ok, false);
});

test('reject: 深いネスト (DoS 防止)', () => {
  // 32 を超える nested ternary
  let expr = '1';
  for (let i = 0; i < 40; i++) expr = `(${expr} ? 1 : 0)`;
  const r = compileFormula(expr);
  assert.equal(r.ok, false);
});

// =============== 機能 ===============

test('リテラル: 文字列', () => {
  assert.deepEqual(evaluateFormula("'hello'", scope), { ok: true, value: 'hello' });
});

test('リテラル: 数値', () => {
  assert.deepEqual(evaluateFormula('42', scope), { ok: true, value: 42 });
});

test('リテラル: boolean', () => {
  assert.deepEqual(evaluateFormula('true', scope), { ok: true, value: true });
});

test('フィールド参照', () => {
  assert.deepEqual(evaluateFormula('{lastName}', scope), { ok: true, value: '山田' });
});

test('文字列結合 (+)', () => {
  assert.deepEqual(evaluateFormula("{lastName} + ' ' + {firstName}", scope), { ok: true, value: '山田 太郎' });
});

test('算術', () => {
  assert.deepEqual(evaluateFormula('{annualFee} * 1.1', scope), { ok: true, value: 5500 });
  assert.deepEqual(evaluateFormula('{annualFee} - 1000', scope), { ok: true, value: 4000 });
});

test('除算 by 0 は 0', () => {
  assert.deepEqual(evaluateFormula('10 / 0', scope), { ok: true, value: 0 });
});

test('比較', () => {
  assert.deepEqual(evaluateFormula("{feeStatus} === 'UNPAID'", scope), { ok: true, value: true });
  assert.deepEqual(evaluateFormula("{feeStatus} !== 'PAID'", scope), { ok: true, value: true });
  assert.deepEqual(evaluateFormula('{annualFee} > 4000', scope), { ok: true, value: true });
});

test('論理', () => {
  assert.deepEqual(evaluateFormula('true && false', scope), { ok: true, value: false });
  assert.deepEqual(evaluateFormula("{feeStatus} === 'UNPAID' || {annualFee} === 0", scope), { ok: true, value: true });
});

test('三項', () => {
  assert.deepEqual(
    evaluateFormula("{feeStatus} === 'PAID' ? '○' : '×'", scope),
    { ok: true, value: '×' },
  );
});

test('if() 関数', () => {
  assert.deepEqual(
    evaluateFormula("if({feeStatus} === 'UNPAID', '未納', '完納')", scope),
    { ok: true, value: '未納' },
  );
});

test('coalesce: 最初の非空を返す', () => {
  assert.deepEqual(evaluateFormula("coalesce({empty}, {lastName}, 'fallback')", scope), { ok: true, value: '山田' });
});

test('len/upper/lower/trim', () => {
  assert.deepEqual(evaluateFormula('len({lastName})', scope), { ok: true, value: 2 });
  assert.deepEqual(evaluateFormula("upper('abc')", scope), { ok: true, value: 'ABC' });
  assert.deepEqual(evaluateFormula("lower('ABC')", scope), { ok: true, value: 'abc' });
  assert.deepEqual(evaluateFormula("trim('  x  ')", scope), { ok: true, value: 'x' });
});

test('concat', () => {
  assert.deepEqual(evaluateFormula("concat({lastName}, '・', {firstName})", scope), { ok: true, value: '山田・太郎' });
});

test('formatDate', () => {
  assert.deepEqual(evaluateFormula("formatDate({joinedDate}, 'yyyy/MM/dd')", scope), { ok: true, value: '2024/04/01' });
  assert.deepEqual(evaluateFormula("formatDate({joinedDate}, 'ja-date')", scope), { ok: true, value: '2024年4月1日' });
});

test('contains/startsWith/endsWith', () => {
  assert.deepEqual(evaluateFormula("contains({lastName}, '山')", scope), { ok: true, value: true });
  assert.deepEqual(evaluateFormula("startsWith({lastName}, '田')", scope), { ok: true, value: false });
  assert.deepEqual(evaluateFormula("endsWith({lastName}, '田')", scope), { ok: true, value: true });
});

test('null 系: 空フィールドは空文字扱い', () => {
  assert.deepEqual(evaluateFormula('len({notExist})', scope), { ok: true, value: 0 });
  assert.deepEqual(evaluateFormula("{notExist} === ''", scope), { ok: true, value: true });
});

test('evaluateCondition: truthy/falsy', () => {
  assert.equal(evaluateCondition("{feeStatus} === 'UNPAID'", scope), true);
  assert.equal(evaluateCondition("{feeStatus} === 'PAID'", scope), false);
  assert.equal(evaluateCondition('invalid syntax !!!', scope), false); // 構文エラーは false に倒す
});

test('FORMULA_FUNCTIONS export', () => {
  assert.ok(FORMULA_FUNCTIONS.includes('if'));
  assert.ok(FORMULA_FUNCTIONS.includes('formatDate'));
  assert.ok(FORMULA_FUNCTIONS.length >= 10);
});

// =============== 攻撃シナリオ ===============

test('攻撃: scope を window/global にアクセスしようとしても fieldMap 経由のみ', () => {
  // walk() の identifier resolution は __f\d+ または allowlist 関数だけ
  const r = compileFormula('window');
  assert.equal(r.ok, false);
});

test('攻撃: コンストラクタチェーン', () => {
  assert.equal(compileFormula("''.constructor.constructor('return process')()").ok, false);
});

test('攻撃: 関数呼び出しを括弧で隠す', () => {
  // (alert)('x') も Identifier(alert) -> 未許可で reject
  assert.equal(compileFormula('(alert)(1)').ok, false);
});

test('攻撃: タグ付きテンプレ', () => {
  // jsep は template literal 未対応 → 構文エラー
  assert.equal(compileFormula('alert`1`').ok, false);
});
