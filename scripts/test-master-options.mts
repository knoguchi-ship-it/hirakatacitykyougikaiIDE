/**
 * 2026-10-19 回帰テスト: マスタ（M_ 表）の選択肢・名称の正本は DB（operator 指示: DRY／ハードコード禁止／マスタは今後も増える）。
 *
 * GAS は マスタ定義 にある表をすべて同じ形で読み（readAllMasterOptions_）、画面へ masters として渡す。
 * 画面は src/shared/masterOptions.ts から選択肢・名称を引く。直書きは audit-master-hardcode --check が落とす。
 * ここでは GAS 側を実ソースから取り出して動かす（ミラー実装にしない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const gas = read('gas-src/Code.full.gs');

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
function extractVarLine(name: string): string {
  const start = gas.indexOf(`var ${name} = `);
  assert.notEqual(start, -1, `${name} が見つからない`);
  return gas.slice(start, gas.indexOf(';', start) + 1);
}

const toBoolean = (v: unknown) => v === true || String(v).toLowerCase() === 'true';

// 既存の形（コード・名称）と、組織マスタの形（組織コード・組織名）、まだ無い新しいマスタを混ぜる
const DEFINITION: Record<string, string[]> = {
  M_会員状態: ['コード', '名称', '表示順', '有効フラグ'],
  M_組織マスタ: ['組織コード', '組織名', '組織種別', '表示順', '全役員表示フラグ', '有効フラグ', '削除フラグ', '作成日時', '更新日時'],
  M_新設マスタ: ['コード', '名称', '表示順', '有効フラグ', '色'],
  M_業務分類: ['業務分類コード', '業務分類名', '組織コード', '単価', '表示順', '有効フラグ', '削除フラグ'],
};
const SHEETS: Record<string, unknown[][]> = {
  M_会員状態: [DEFINITION.M_会員状態, ['WITHDRAWN', '退会', 3, true], ['ACTIVE', '有効', 1, true], ['OLD', '旧', 2, false]],
  M_組織マスタ: [DEFINITION.M_組織マスタ, ['HQ', '本部', '本部', 1, true, true, false, '', ''], ['GONE', '廃止', '委員会', 2, false, true, true, '', '']],
  M_新設マスタ: [DEFINITION.M_新設マスタ, ['X', 'エックス', 1, true, 'red']],
  M_業務分類: [DEFINITION.M_業務分類, ['MEETING', '会議出席', 'HQ', 5000, 1, true, false]],
};

function makeEnv() {
  let sheetReads = 0;
  const store = new Map<string, string>();
  const cache = {
    get: (k: string) => (store.has(k) ? store.get(k)! : null),
    put: (k: string, v: string) => { store.set(k, v); },
    putAll: (o: Record<string, string>) => { Object.entries(o).forEach(([k, v]) => store.set(k, v)); },
    getAll: (keys: string[]) => Object.fromEntries(keys.map((k) => [k, store.get(k)])),
    remove: (k: string) => { store.delete(k); },
  };
  const ss = {
    getSheetByName: (name: string) => (SHEETS[name] ? {
      getDataRange: () => { sheetReads += 1; return { getValues: () => SHEETS[name] }; },
    } : null),
  };
  const source = [
    extractVarLine('MASTER_OPTIONS_CACHE_KEY_'), extractVarLine('MASTER_OPTIONS_CACHE_TTL_'),
    extractVarLine('MASTER_BOOKKEEPING_COLUMNS_'), extractVarLine('MASTER_OPTIONS_MEMO_'),
    extractVarLine('PUBLIC_MASTER_NAMES_'), 'var CACHE_CHUNK_SIZE = 90000;',
    ...['masterOptionsFromRows_', 'readAllMasterOptions_', 'readMasterOptions_', 'masterLabel_', 'hasMasterOption_',
      'invalidateMasterOptionsCache_', 'masterOptionsForClient_', 'getRowsAsObjects_', 'getRowsAsObjectsFromSheet_',
      'putChunkedCache_', 'getChunkedCache_', 'removeChunkedCache_'].map(extractFunction),
  ].join('\n');
  const fns = new Function('マスタ定義', 'toBoolean_', 'CacheService', 'getOrCreateDatabase_', `${source}
    return { readAllMasterOptions_, readMasterOptions_, masterLabel_, hasMasterOption_, invalidateMasterOptionsCache_, masterOptionsForClient_,
      resetMemo: function() { MASTER_OPTIONS_MEMO_ = null; } };`)(
    DEFINITION, toBoolean, { getScriptCache: () => cache }, () => ss,
  );
  return { fns, ss, reads: () => sheetReads, store };
}

test('マスタ定義 の全表を同じ形で読む（1 列目=コード、2 列目=名称・表示順・無効と削除を除く・属性）', () => {
  const { fns, ss } = makeEnv();
  const all = fns.readAllMasterOptions_(ss);
  assert.deepEqual(Object.keys(all).sort(), Object.keys(DEFINITION).sort(), 'マスタ定義 の表が漏れている');
  assert.deepEqual(all.M_会員状態.map((o: any) => o.code), ['ACTIVE', 'WITHDRAWN'], '表示順・有効フラグ');
  assert.deepEqual(all.M_組織マスタ.map((o: any) => [o.code, o.label]), [['HQ', '本部']], '削除フラグ・列名の違うマスタ');
  assert.deepEqual(all.M_組織マスタ[0].attrs, { 組織種別: '本部', 全役員表示フラグ: true }, '属性に管理用の列を入れない');
  assert.equal(fns.masterLabel_(ss, 'M_会員状態', 'ACTIVE'), '有効');
  assert.equal(fns.masterLabel_(ss, 'M_会員状態', 'OLD'), 'OLD', '無効な行の名称は出さない（コードのまま）');
});

test('★新しいマスタはコードを変えずに乗る（管理には全表、公開・会員には許可した表だけ・属性なし）', () => {
  const { fns, ss } = makeEnv();
  const admin = fns.masterOptionsForClient_(ss, 'ADMIN');
  assert.deepEqual(admin.M_新設マスタ.map((o: any) => [o.code, o.label, o.attrs.色]), [['X', 'エックス', 'red']]);
  const pub = fns.masterOptionsForClient_(ss, 'PUBLIC');
  assert.equal(pub.M_新設マスタ, undefined, '許可していない表を公開側へ出している');
  assert.equal(pub.M_業務分類, undefined, '単価を持つ表を公開側へ出している');
  assert.deepEqual(Object.keys(pub.M_会員状態[0]).sort(), ['code', 'label', 'order'], '公開側に属性を出している');
});

test('キャッシュ: 2 回目はシートを読まない。書き換え後の invalidate で読み直す', () => {
  const { fns, ss, reads } = makeEnv();
  fns.readAllMasterOptions_(ss);
  const first = reads();
  assert.equal(first, Object.keys(DEFINITION).length, '表ごとに 1 回だけ読む');
  fns.resetMemo(); // 次の実行（メモは実行ごと、キャッシュは実行をまたぐ）
  fns.readAllMasterOptions_(ss);
  assert.equal(reads(), first, 'キャッシュがあるのにシートを読んだ');
  fns.invalidateMasterOptionsCache_();
  fns.readAllMasterOptions_(ss);
  assert.equal(reads(), first * 2, 'invalidate の後に読み直していない');
  assert.equal(fns.hasMasterOption_(null, 'M_会員状態', 'ACTIVE'), true);
  assert.equal(fns.hasMasterOption_(null, 'M_会員状態', 'OLD'), false);
});

test('★マスタのシートを書き換える関数は、必ず選択肢のキャッシュを捨てる', () => {
  const re = /^function ([A-Za-z0-9_$]+)\(/gm;
  const starts: Array<[string, number]> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(gas))) starts.push([m[1], m.index]);
  const writers: string[] = [];
  const missing: string[] = [];
  starts.forEach(([name, st], i) => {
    const body = gas.slice(st, i + 1 < starts.length ? starts[i + 1][1] : gas.length);
    const vars = [...body.matchAll(/var\s+(\w+)\s*=\s*\w+\.getSheetByName\(\s*'(M_[^']+)'\s*\)/g)].map((x) => x[1]);
    const writes = vars.some((v) => new RegExp(`\\b${v}\\.(?:getRange\\([^;]*?\\)\\.)?(?:setValues|setValue|appendRow|deleteRow|deleteRows|clear|clearContents)\\(`).test(body))
      || /appendRowsByHeaders_\(\s*\w+\s*,\s*'M_/.test(body);
    if (!writes) return;
    writers.push(name);
    if (!/invalidateMasterOptionsCache_\(\)/.test(body)) missing.push(name);
  });
  assert.ok(writers.length >= 10, `書き換える関数を見つけられていない（${writers.length} 件）`);
  assert.deepEqual(missing, [], 'キャッシュを捨てていない（画面に古い選択肢が残る）');
  assert.match(extractFunction('initializeSchema_'), /post\('invalidateMasterOptionsCache_'/, 'スキーマ整備（初期値の投入）の後に捨てていない');
});

test('画面へ渡す: 管理=getSystemSettings_（全表）、公開=ポータル設定・会員=マイページ（許可した表）', () => {
  assert.match(extractFunction('getSystemSettings_'), /masters: masterOptionsForClient_\(ss, 'ADMIN'\)/);
  // 研修管理者などは getSystemSettings を呼べない（MASTER/ADMIN だけ）。ログインの応答で全権限へ渡す
  assert.match(gas, /Object\.assign\(\{\}, adminLogin, \{ masters: masterOptionsForClient_\(null, 'ADMIN'\) \}\)/);
  assert.match(read('src/services/api.ts'), /setMasterOptions\(result\?\.masters\)/);
  assert.match(gas, /masters: masterOptionsForClient_\(db, 'PUBLIC'\)/);
  assert.match(extractFunction('getMemberPortalData_'), /masters: masterOptionsForClient_\(ss, 'PUBLIC'\)/);
  const api = read('src/services/api.ts');
  assert.equal((api.match(/setMasterOptions\(parsed\.data\?\.masters\)/g) || []).length, 2, '設定の取得・保存の両方で受け取る');
  assert.match(api, /setMasterOptions\(data\.masters\)/);
  assert.match(read('src/public-portal/App.tsx'), /setMasterOptions\(portalSettings\.value\.masters\)/);
});

test('★発送方法・郵送先区分はマスタに無い値で保存しない（公開ポータルが MAIL を送っていた）', () => {
  const assertCodes = new Function('isKnownMasterCode_', `${extractFunction('assertMemberMailingCodes_')} return assertMemberMailingCodes_;`)(
    (_ss: unknown, master: string, code: string) => ({ M_発送方法: ['EMAIL', 'POST'], M_郵送先区分: ['OFFICE', 'HOME'] } as Record<string, string[]>)[master].includes(code),
  );
  assert.throws(() => assertCodes({}, 'MAIL', 'OFFICE'), /発送方法の値が不正です: MAIL/);
  assert.throws(() => assertCodes({}, 'POST', 'SCHOOL'), /郵送先区分の値が不正です/);
  assertCodes({}, 'POST', 'HOME');
  for (const fn of ['saveMemberCore_', 'createMember_', 'createMemberApplicationDirectLocked_']) {
    assert.match(extractFunction(fn), /assertMemberMailingCodes_\(ss, /, `${fn} が発送方法を検査していない`);
  }
  assert.doesNotMatch(read('src/public-portal/components/MemberUpdateForm.tsx'), /value="MAIL"/);
});

test('GAS の名称表を残さない（マスタの名称を masterLabel_ で引く）', () => {
  for (const fn of ['resolveMemberTypeLabel_', 'mapAdminPermissionLabel_', 'mapSystemRoleLabel_']) {
    assert.equal(gas.indexOf(`function ${fn}(`), -1, `${fn} が残っている`);
  }
  const dictionary = extractFunction('getRosterFieldDictionary_');
  for (const master of ['M_会員種別', 'M_会員状態', 'M_発送方法', 'M_郵送先区分', 'M_職員権限', 'M_職員状態', 'M_会費納入状態']) {
    assert.match(dictionary, new RegExp(`labelsOf\\('${master}'\\)`), `名簿の項目辞書が ${master} を引いていない`);
  }
});
