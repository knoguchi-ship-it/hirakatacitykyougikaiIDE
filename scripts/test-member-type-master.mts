/**
 * 2026-10-19 回帰テスト: 会員種別の正本は M_会員種別（operator 指示・DRY／ハードコード禁止）。
 *
 * 入会の検査が ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] を直書きしており、
 * マスタで種別を足しても止めても検査が追随しなかった。
 * 実ソースから関数を取り出し、偽の M_会員種別 シートで動かして確かめる（ミラー実装にしない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  for (let i = gas.indexOf('{', start); i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}' && --depth === 0) return gas.slice(start, i + 1);
  }
  throw new Error(`${name} の終端が見つからない`);
}

// 表示順はわざと行順と逆にし、無効な種別を 1 つ混ぜる
const MASTER: unknown[][] = [
  ['コード', '名称', '表示順', '有効フラグ', '年会費金額'],
  ['SUPPORT', '賛助会員', 3, true, 5000],
  ['INDIVIDUAL', '個人会員', 1, true, 3000],
  ['RETIRED', '廃止した種別', 2, false, 0],
  ['NEWTYPE', '新設した種別', 4, true, 1000],
];

function makeSheet(values: unknown[][]) {
  return {
    getLastRow: () => values.length,
    getLastColumn: () => values[0].length,
    getRange: (r: number, c: number, nr: number, nc: number) => ({
      getValues: () => values.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
    }),
    getDataRange: () => ({ getValues: () => values }),
  };
}
const ss = { getSheetByName: (name: string) => (name === 'M_会員種別' ? makeSheet(MASTER) : null) };
const toBoolean = (v: unknown) => v === true || String(v).toLowerCase() === 'true';
const マスタ定義 = { M_会員種別: ['コード', '名称', '表示順', '有効フラグ', '年会費金額'] };

const SHARED = ['isKnownMasterCode_', 'findRowByColumnValue_', 'getRowsAsObjects_', 'getRowsAsObjectsFromSheet_', 'getActiveMemberTypeCodes_']
  .map(extractFunction).join('\n');

/** 種別の検査を通ったら、その次に呼ばれる関数で止めて PASSED を投げる */
function runUntilPassed(fnName: string, nextCall: string, payload: Record<string, unknown>): string {
  const fn = new Function('マスタ定義', 'toBoolean_', 'getOrCreateDatabase_', nextCall,
    `${SHARED}\n${extractFunction(fnName)}\nreturn ${fnName};`,
  )(マスタ定義, toBoolean, () => ss, () => { throw new Error('PASSED'); });
  try { fn(payload); } catch (e) { return (e as Error).message; }
  return 'NO_THROW';
}

test('getActiveMemberTypeCodes_: 有効な種別だけを表示順で返す', () => {
  const codes = new Function('toBoolean_', `${SHARED} return getActiveMemberTypeCodes_;`)(toBoolean)(ss);
  assert.deepEqual(codes, ['INDIVIDUAL', 'SUPPORT', 'NEWTYPE']);
});

const CASES: Array<[string, string, string]> = [
  ['createMember_', 'clearUnusedIndividualApplicationAddressDefaults_', 'type'],
  ['createMemberApplicationDirectLocked_', 'clearUnusedIndividualApplicationAddressDefaults_', 'memberType'],
  ['enqueueMemberApplicationChangeRequest_', 'consumePublicSubmissionQuota_', 'memberType'],
];

for (const [fnName, nextCall, key] of CASES) {
  test(`★${fnName}: 会員種別を M_会員種別 で検査する（マスタの追加・停止に追随する）`, () => {
    const run = (code: string) => runUntilPassed(fnName, nextCall, { [key]: code, email: 'a@example.invalid' });
    assert.equal(run('INDIVIDUAL'), 'PASSED');
    assert.equal(run('NEWTYPE'), 'PASSED', 'マスタに足した種別が通らない');
    assert.match(run('RETIRED'), /会員種別が不正/, '有効フラグを落とした種別が通る');
    assert.match(run('BUSINESS'), /会員種別が不正/, 'マスタに無い種別が通る');
    assert.match(run('EVIL'), /会員種別が不正/);
  });
}

test('★gas-src に会員種別の一覧を直書きしない（正本は M_会員種別。初期値の行と build 注入は除く）', () => {
  const lines = gas.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const hits = lines.filter((l) => /'INDIVIDUAL',\s*'BUSINESS'|'BUSINESS',\s*'SUPPORT'/.test(l));
  assert.deepEqual(hits, [], '会員種別の一覧がコードに直書きされている');
});
