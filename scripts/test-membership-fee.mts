/**
 * v376.64 回帰テスト: 会員種別ごとの年会費（会費設定）。
 *
 * 背景:
 * 年会費の正本は `M_会員種別.年会費金額` の 1 列だけで、公開ポータルの入会申込カード・
 * 年会費請求・メール差し込みがすべてここを読む。これを設定画面から変更できるようにしたため、
 * 次の 2 点が壊れると「設定したのに元に戻る／不正な金額が保存される」実害になる:
 *   1. ensureMemberTypeAnnualFeeAmounts_ が既存の金額を上書きしないこと（空欄補完のみ）
 *   2. normalizeAnnualFeeAmount_ が範囲外・非数値を弾くこと
 *
 * どちらも gas-src の【実ソースから関数を抽出して評価】する（ミラー実装にしない＝ドリフト防止）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GAS_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gas-src', 'Code.full.gs');
// @ts-expect-error allowJs な共有モジュール（GAS へも注入される単一情報源）
import { MEMBER_TYPE_ANNUAL_FEE_DEFAULTS } from '../src/shared/memberTypes.mjs';
const source = fs.readFileSync(GAS_SRC, 'utf8');

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

function extractVar(name: string): string {
  const start = source.indexOf(`var ${name} = {`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('};', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 2);
}

// v376.67: 年会費既定値の正本は src/shared/memberTypes.mjs へ集約し、gas-src へは build 時に注入される。
// gas-src 上は空の stub なので、テストは正本（共有モジュール）の値を注入して評価する。
const DEFAULTS_SRC = 'var MEMBER_TYPE_ANNUAL_FEE_DEFAULTS = '
  + JSON.stringify(MEMBER_TYPE_ANNUAL_FEE_DEFAULTS) + ';';

const normalizeAnnualFeeAmount_ = new Function(
  `${extractFunction('normalizeAnnualFeeAmount_')}; return normalizeAnnualFeeAmount_;`,
)() as (raw: unknown, code: string) => number;

// ── 金額の検証 ────────────────────────────────────────────
test('整数として保存される（小数は切り捨て・文字列も受ける）', () => {
  assert.equal(normalizeAnnualFeeAmount_(3000, 'INDIVIDUAL'), 3000);
  assert.equal(normalizeAnnualFeeAmount_('8000', 'BUSINESS'), 8000);
  assert.equal(normalizeAnnualFeeAmount_(5000.9, 'SUPPORT'), 5000);
});

test('0 円は許容する（会費無料の種別を設定できる）', () => {
  assert.equal(normalizeAnnualFeeAmount_(0, 'SUPPORT'), 0);
});

test('★範囲外・非数値は保存させない', () => {
  assert.throws(() => normalizeAnnualFeeAmount_(-1, 'INDIVIDUAL'), /0〜1,000,000/);
  assert.throws(() => normalizeAnnualFeeAmount_(1000001, 'INDIVIDUAL'), /0〜1,000,000/);
  assert.throws(() => normalizeAnnualFeeAmount_('三千円', 'INDIVIDUAL'), /数値/);
  assert.throws(() => normalizeAnnualFeeAmount_(NaN, 'BUSINESS'), /数値/);
});

// ── スキーマ初期化が設定値を壊さないこと ──────────────────
// ensureMemberTypeAnnualFeeAmounts_ をシートスタブ付きで実行し、書き戻し内容を検証する。
function runEnsure(rows: Array<[string, unknown]>): { written: Array<[string, unknown]>; wrote: boolean } {
  const values = rows.map(([code, amount]) => [code, '名称', 1, true, amount]);
  let wrote = false;
  let written = values;
  const sheet = {
    getLastRow: () => values.length + 1,
    getLastColumn: () => 5,
    getRange: () => ({
      getValues: () => values.map((r) => r.slice()),
      setValues: (v: unknown[][]) => { wrote = true; written = v as typeof values; },
    }),
  };
  const ss = { getSheetByName: () => sheet };
  const fn = new Function(
    'ss',
    `${DEFAULTS_SRC}
     function buildColumnIndex_() { return { 'コード': 0, '年会費金額': 4 }; }
     function requireColumns_() {}
     ${extractFunction('ensureMemberTypeAnnualFeeAmounts_')}
     return ensureMemberTypeAnnualFeeAmounts_(ss);`,
  );
  fn(ss);
  return { written: written.map((r) => [String(r[0]), r[4]]) as Array<[string, unknown]>, wrote };
}

test('★回帰固定: 設定済みの金額をスキーマ初期化が上書きしない', () => {
  const { written, wrote } = runEnsure([['INDIVIDUAL', 4500], ['BUSINESS', 12000], ['SUPPORT', 0]]);
  assert.equal(wrote, false, '既定値へ書き戻してはならない（設定が元に戻る）');
  assert.deepEqual(written, [['INDIVIDUAL', 4500], ['BUSINESS', 12000], ['SUPPORT', 0]]);
});

test('未設定（空欄・非数値）のときだけ既定値を補完する', () => {
  const { written, wrote } = runEnsure([['INDIVIDUAL', ''], ['BUSINESS', 12000], ['SUPPORT', 'なし']]);
  assert.equal(wrote, true);
  assert.deepEqual(written, [['INDIVIDUAL', 3000], ['BUSINESS', 12000], ['SUPPORT', 5000]]);
});

// ── ソース契約 ────────────────────────────────────────────
test('★正本は M_会員種別.年会費金額 の 1 箇所（公開 API も同じ読み出しを使う）', () => {
  assert.match(source, /function readMemberTypeAnnualFees_\(ss\)/, '共通読み出しが無い');
  assert.match(source, /membershipFees: ppMembershipFees/, '公開ポータル設定に会費が乗っていない');
  assert.match(source, /memberTypeAnnualFees: memberTypeAnnualFees/, '管理設定に会費が乗っていない');
  // 会費を T_システム設定 側に二重で持たない（金額キーを増やさない）
  assert.doesNotMatch(source, /MEMBERSHIP_FEE_(INDIVIDUAL|BUSINESS|SUPPORT)/, '会費金額を設定キーに二重定義している');
});
