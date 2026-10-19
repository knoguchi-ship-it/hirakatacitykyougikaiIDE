/**
 * 2026-10-19 回帰テスト: 会員種別の正本は M_会員種別（operator 指示・DRY／ハードコード禁止）。
 *
 * 入会の検査・画面の選択肢・絞り込み・会費欄が ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] を直書きしており、
 * マスタで種別を足しても止めても追随しなかった。
 * GAS は実ソースから関数を取り出し、偽の M_会員種別 シートで動かして確かめる（ミラー実装にしない）。
 * 画面は src/shared/memberTypeMaster.ts（GAS が返すマスタ）から描いていることを確かめる。
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

function extractVarLine(name: string): string {
  const start = gas.indexOf(`var ${name} = `);
  assert.notEqual(start, -1, `${name} が見つからない`);
  return gas.slice(start, gas.indexOf(';', start) + 1);
}

// 会員種別はマスタ共通の読み出し（readAllMasterOptions_）を通る。キャッシュは空として動かす
const SHARED = [
  extractVarLine('MASTER_OPTIONS_CACHE_KEY_'), extractVarLine('MASTER_OPTIONS_CACHE_TTL_'),
  extractVarLine('MASTER_BOOKKEEPING_COLUMNS_'), extractVarLine('MASTER_OPTIONS_MEMO_'),
  ...['isKnownMasterCode_', 'findRowByColumnValue_', 'getRowsAsObjects_', 'getRowsAsObjectsFromSheet_',
    'masterOptionsFromRows_', 'readAllMasterOptions_', 'readMasterOptions_',
    'readMemberTypeMaster_', 'getActiveMemberTypeCodes_', 'annualFeesByMemberType_'].map(extractFunction),
].join('\n');
// build が src/shared/memberTypes.mjs から注入する既定値と、キャッシュの代わり
const INJECTED = `var MEMBER_TYPE_ANNUAL_FEE_DEFAULTS = { INDIVIDUAL: 3000 };
  function memberTypeLabel_(code) { return code; }
  var CacheService = { getScriptCache: function() { return {}; } };
  function getChunkedCache_() { return null; }
  function putChunkedCache_() {}`;

/** 種別の検査を通ったら、その次に呼ばれる関数で止めて PASSED を投げる */
function runUntilPassed(fnName: string, nextCall: string, payload: Record<string, unknown>): string {
  const fn = new Function('マスタ定義', 'toBoolean_', 'getOrCreateDatabase_', nextCall,
    `${INJECTED}\n${SHARED}\n${extractFunction(fnName)}\nreturn ${fnName};`,
  )(マスタ定義, toBoolean, () => ss, () => { throw new Error('PASSED'); });
  try { fn(payload); } catch (e) { return (e as Error).message; }
  return 'NO_THROW';
}

test('readMemberTypeMaster_: 有効な種別だけを表示順で、名称・年会費つきで返す（画面へ渡す一覧の正本）', () => {
  const fns = new Function('toBoolean_', 'マスタ定義', `${INJECTED}\n${SHARED}
    return { readMemberTypeMaster_, getActiveMemberTypeCodes_, annualFeesByMemberType_ };`)(toBoolean, マスタ定義);
  assert.deepEqual(fns.getActiveMemberTypeCodes_(ss), ['INDIVIDUAL', 'SUPPORT', 'NEWTYPE']);
  const list = fns.readMemberTypeMaster_(ss);
  assert.deepEqual(list.map((t: { label: string }) => t.label), ['個人会員', '賛助会員', '新設した種別']);
  assert.deepEqual(fns.annualFeesByMemberType_(list), { INDIVIDUAL: 3000, SUPPORT: 5000, NEWTYPE: 1000 });
});

test('管理の設定・公開ポータル設定・名簿の項目辞書が M_会員種別 の一覧を返す（1 回だけ読む）', () => {
  const settings = extractFunction('getSystemSettings_');
  assert.match(settings, /memberTypes: memberTypeMaster/);
  assert.equal((settings.match(/readMemberTypeMaster_\(/g) || []).length, 1, 'マスタを 2 回読んでいる');
  assert.match(gas, /memberTypes: ppMemberTypes/);
  assert.match(extractFunction('getRosterFieldDictionary_'), /enumLabels: labelsOf\('M_会員種別'\)/);
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

// 一覧（'INDIVIDUAL', 'BUSINESS' …）・選択肢（<option value="SUPPORT">）・名称表（MEMBER_TYPE_LABELS）の直書き
const HARDCODED = /'INDIVIDUAL',\s*'BUSINESS'|'BUSINESS',\s*'SUPPORT'|<option value=(?:\{MemberType\.|")(?:INDIVIDUAL|BUSINESS|SUPPORT)\b|MEMBER_TYPE_LABELS|MEMBER_TYPE_ANNUAL_FEE_DEFAULTS|MEMBER_TYPE_CODES/;

test('★gas-src に会員種別の一覧を直書きしない（正本は M_会員種別。初期値の行と build 注入は除く）', () => {
  const lines = gas.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const hits = lines.filter((l) => /'INDIVIDUAL',\s*'BUSINESS'|'BUSINESS',\s*'SUPPORT'/.test(l));
  assert.deepEqual(hits, [], '会員種別の一覧がコードに直書きされている');
});

function listSources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listSources(full);
    return /\.(tsx?|mjs)$/.test(e.name) ? [full] : [];
  });
}

test('★画面に会員種別の一覧・選択肢・名称表を直書きしない（memberTypeMaster から描く）', () => {
  // 既定値の置き場（マスタを受け取る前だけ使う）と、マスタを配る口だけが持ってよい
  const ALLOWED = new Set(['src/shared/memberTypes.mjs', 'src/shared/memberTypeMaster.ts']);
  const hits: string[] = [];
  for (const file of listSources(path.join(ROOT, 'src'))) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (ALLOWED.has(rel)) continue;
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (HARDCODED.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
    });
  }
  assert.deepEqual(hits, [], '会員種別の一覧・名称がコードに直書きされている');
});

test('画面はマスタを受け取って配る（管理=設定の取得・保存、公開=ポータル設定）', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');
  assert.match(app, /setMemberTypeMaster\(systemSettings\.memberTypes\)/);
  assert.match(app, /setMemberTypeMaster\(saved\.memberTypes\)/);
  const portal = fs.readFileSync(path.join(ROOT, 'src', 'public-portal', 'App.tsx'), 'utf8');
  assert.match(portal, /setMemberTypeMaster\(portalSettings\.value\.memberTypes\)/);
});
