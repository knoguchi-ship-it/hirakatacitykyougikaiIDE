/**
 * 2026-11-12 最初の画面までの往復（docs/330・TRD §1.3.1・§3.2.2・UI/UX SCR-23）。
 *   ③ 設定のキャッシュ: 表示のための読み（管理 5 分・公開 10 分）だけをキャッシュし、判断のための読みは常に正本。
 *      捨てるのは書き込みの最下層。設定の源を書き換える関数が invalidateSettingsCache_ を呼んでいなければ落とす。
 *   A′ 件数バッジ: 初期データの応答に未処理件数を同梱（権限があるときだけ・2 列だけ読む）。
 * 判定は実ソースから関数を切り出して実行する（ミラー禁止・AGENTS L3.1）。配線だけ文字列で確かめる。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakeSheetsRest } from './lib/fake-sheets-rest.mts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  for (let i = gas.indexOf('{', start); i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') { depth -= 1; if (depth === 0) return gas.slice(start, i + 1); }
  }
  throw new Error(`${name} の終端が見つからない`);
}
function extractVar(name: string): string {
  const start = gas.indexOf(`var ${name} =`);
  assert.notEqual(start, -1, `var ${name} が見つからない`);
  // 1 行の定数に限る（行末のコメントの後に ; が無いので、「;＋改行」で切ると次の関数まで取り込んでしまう）
  return gas.slice(start, gas.indexOf('\n', start));
}

/** 本物の CacheService と同じく 1 値 100 KB を超えると例外 */
function fakeCache() {
  const store = new Map<string, string>();
  const calls = { put: 0, removed: [] as string[] };
  return {
    store, calls,
    get: (k: string) => (store.has(k) ? store.get(k)! : null),
    put: (k: string, v: string) => {
      calls.put += 1;
      if (Buffer.byteLength(String(v), 'utf8') > 100 * 1024) throw new Error('Argument too large: value');
      store.set(k, String(v));
    },
    remove: (k: string) => { calls.removed.push(k); store.delete(k); },
    removeAll: (keys: string[]) => { for (const k of keys) { calls.removed.push(k); store.delete(k); } },
  };
}

function buildCacheHelpers(cache: ReturnType<typeof fakeCache>, opts: { throwOnGet?: boolean } = {}) {
  const warnings: string[] = [];
  const f = new Function('deps', `
    var CacheService = { getScriptCache: function() { if (deps.throwOnGet) throw new Error('cache down'); return deps.cache; } };
    var console = { warn: function(m) { deps.warnings.push(String(m)); }, log: function() {} };
    var PropertiesService = { getScriptProperties: function() { return { setProperty: function(k, v) { deps.marks[k] = v; } }; } };
    ${extractVar('SNAPSHOT_STALE_PREFIX_')}
    ${extractFunction('markSnapshotStale_')}
    var DB_SCHEMA_VERSION = 'TEST-V1';
    ${extractVar('SETTINGS_CACHE_MAX_CHARS_')}
    ${extractVar('ADMIN_SETTINGS_CACHE_TTL_SECONDS_')}
    ${extractVar('PUBLIC_SETTINGS_CACHE_TTL_SECONDS_')}
    ${extractFunction('adminSettingsCacheKey_')}
    ${extractFunction('publicSettingsCacheKey_')}
    ${extractFunction('getOrBuildCachedText_')}
    ${extractFunction('invalidateSettingsCache_')}
    return { getOrBuild: getOrBuildCachedText_, invalidate: invalidateSettingsCache_, adminKey: adminSettingsCacheKey_, publicKey: publicSettingsCacheKey_,
      ttlAdmin: ADMIN_SETTINGS_CACHE_TTL_SECONDS_, ttlPublic: PUBLIC_SETTINGS_CACHE_TTL_SECONDS_ };
  `);
  const marks: Record<string, string> = {};
  return { h: f({ cache, warnings, marks, throwOnGet: !!opts.throwOnGet }), warnings, marks };
}

test('③ 2 回目はキャッシュから返し、作り直さない', () => {
  const cache = fakeCache();
  const { h } = buildCacheHelpers(cache);
  let builds = 0;
  const build = () => { builds += 1; return JSON.stringify({ a: 1 }); };
  assert.equal(h.getOrBuild(h.adminKey(), h.ttlAdmin, build), '{"a":1}');
  assert.equal(h.getOrBuild(h.adminKey(), h.ttlAdmin, build), '{"a":1}');
  assert.equal(builds, 1);
});

test('③ 有効期限は管理 5 分・公開 10 分。キーはスキーマの版を含み、管理と公開で別', () => {
  const { h } = buildCacheHelpers(fakeCache());
  assert.equal(h.ttlAdmin, 300);
  assert.equal(h.ttlPublic, 600);
  assert.match(h.adminKey(), /TEST-V1/);
  assert.match(h.publicKey(), /TEST-V1/);
  assert.notEqual(h.adminKey(), h.publicKey());
});

test('③ 上限（90 KB）を超えうる値は入れず、黙らずに警告を出す（それでも値は返す）', () => {
  const cache = fakeCache();
  const { h, warnings } = buildCacheHelpers(cache);
  const big = 'あ'.repeat(40_000); // 120 KB（UTF-8）
  assert.equal(h.getOrBuild(h.adminKey(), h.ttlAdmin, () => big), big);
  assert.equal(cache.store.size, 0, '入れていない');
  assert.equal(cache.calls.put, 0, 'put を試して失敗を握りつぶす形ではない');
  assert.ok(warnings.some((w) => w.includes('キャッシュ')), warnings.join(' / '));
});

test('③ キャッシュが使えないときも、作って返す', () => {
  const { h } = buildCacheHelpers(fakeCache(), { throwOnGet: true });
  assert.equal(h.getOrBuild(h.adminKey(), h.ttlAdmin, () => 'x'), 'x');
});

test('③ invalidateSettingsCache_ は管理と公開の両方のキーを消し、設定の完成品に古い印を付ける（docs/332 S1）', () => {
  const cache = fakeCache();
  const { h, marks } = buildCacheHelpers(cache);
  h.getOrBuild(h.adminKey(), h.ttlAdmin, () => 'A');
  h.getOrBuild(h.publicKey(), h.ttlPublic, () => 'P');
  h.invalidate();
  assert.equal(cache.store.size, 0);
  assert.ok(marks['SNAPSTALE:settings'], '設定の完成品に古い印');
  let rebuilt = 0;
  h.getOrBuild(h.adminKey(), h.ttlAdmin, () => { rebuilt += 1; return 'A2'; });
  assert.equal(rebuilt, 1);
});

// ── 捨て忘れの検出（書き込みの最下層で捨てる） ─────────────────────────
// 中括弧の対応で切り出すと、文字列・正規表現の中の { } で壊れる（stripUnresolvedMergeTags_ で実際に壊れた）。
// 行頭の function から次の行頭の function までを 1 つの関数とみなす（間の最上位の var も含むが、判定には影響しない）。
function topLevelFunctions(): Array<{ name: string; body: string }> {
  const starts: Array<{ name: string; at: number }> = [];
  const re = /^function ([A-Za-z0-9_$]+)\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(gas))) starts.push({ name: m[1], at: m.index });
  return starts.map((s, i) => ({ name: s.name, body: gas.slice(s.at, i + 1 < starts.length ? starts[i + 1].at : gas.length) }));
}
const SOURCE_SHEETS = ['T_システム設定', 'T_画面文テンプレート'];
function writesSheet(body: string, sheet: string): boolean {
  if (body.includes(`appendRowsByHeaders_(ss, '${sheet}'`) || body.includes(`appendRowsByHeaders_(db, '${sheet}'`)) return true;
  if (!body.includes(`getSheetByName('${sheet}')`)) return false;
  return /\.(setValues?|appendRow|deleteRows?|insertRows?\w*|clear\w*)\(/.test(body);
}

test('③ 設定の源（T_システム設定・T_画面文テンプレート）を書き換える関数は、必ず invalidateSettingsCache_ を呼ぶ', () => {
  const offenders: string[] = [];
  let writers = 0;
  for (const fn of topLevelFunctions()) {
    if (!SOURCE_SHEETS.some((s) => writesSheet(fn.body, s))) continue;
    writers += 1;
    if (!fn.body.includes('invalidateSettingsCache_(')) offenders.push(fn.name);
  }
  assert.ok(writers >= 6, `書き換える関数を見つけられていない（${writers} 件）。検出の条件が壊れている`);
  assert.deepEqual(offenders, [], `捨てていない書き込み口: ${offenders.join(', ')}`);
});

test('③ マスタの書き込みは invalidateMasterOptionsCache_ 経由で設定のキャッシュも捨てる', () => {
  assert.match(extractFunction('invalidateMasterOptionsCache_'), /invalidateSettingsCache_\(\)/);
});

test('③ 表示の読みだけをキャッシュし、判断の読み（getSystemSettings_）は常に正本', () => {
  const display = extractFunction('getSystemSettingsForDisplay_');
  assert.match(display, /initializeSchemaIfNeeded_\(/, '整備の入口はキャッシュの前に残す');
  assert.match(display, /getOrBuildSnapshot_\('settings', SNAPSHOT_MAX_AGE_SETTINGS_MS_/, '管理の設定は完成品（docs/332 S1）');
  assert.equal(extractFunction('getSystemSettings_').includes('getOrBuildCachedText_'), false, '判断の読みをキャッシュしない');
  assert.match(extractFunction('getPublicPortalSettingsForDisplay_'), /getOrBuildCachedText_\(publicSettingsCacheKey_\(\), PUBLIC_SETTINGS_CACHE_TTL_SECONDS_/);
  const dispatch = extractFunction('processApiRequest');
  const initBlock = dispatch.slice(dispatch.indexOf("action === 'getAdminInitData'"), dispatch.indexOf("action === 'getTrainingManagementData'"));
  assert.match(initBlock, /getSystemSettingsForDisplay_\(\)/);
  const settingsBlock = dispatch.slice(dispatch.indexOf("action === 'getSystemSettings'"), dispatch.indexOf("action === 'checkSystemSettingsPatch'"));
  assert.match(settingsBlock, /getSystemSettingsForDisplay_\(\)/);
  const publicBlock = dispatch.slice(dispatch.indexOf("action === 'getPublicPortalSettings'"));
  assert.match(publicBlock.slice(0, 400), /getPublicPortalSettingsForDisplay_\(\)/);
  for (const fn of ['checkSystemSettingsPatch_', 'updateSystemSettings_']) {
    assert.equal(extractFunction(fn).includes('ForDisplay_'), false, `${fn} は判断の読み（正本）を使う`);
  }
});

// ── A′ 件数バッジ ────────────────────────────────────────────
type Row = Record<string, unknown>;
function fakeSheetDb(name: string, headers: string[], rows: Row[]) {
  const reads: string[][] = [];
  const matrix = () => [headers, ...rows.map((r) => headers.map((h) => (r[h] === undefined ? '' : r[h])))];
  const sheet = {
    getLastRow: () => rows.length + 1,
    getLastColumn: () => headers.length,
    getDataRange: () => ({ getValues: () => { reads.push(headers.slice()); return matrix(); } }),
    getRange: (r: number, c: number, nr = 1, nc = 1) => ({
      getValues: () => {
        if (r + nr - 1 >= 2) reads.push(headers.slice(c - 1, c - 1 + nc));
        return matrix().slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc));
      },
    }),
  };
  return { reads, getId: () => 'DB', matrixOf: (n: string) => (n === name ? matrix() : null), getSheetByName: (n: string) => (n === name ? sheet : null) };
}
function buildCounter(db: { matrixOf?: (n: string) => unknown[][] | null; reads?: string[][] }, opts: { rest?: boolean } = {}) {
  const urlFetch = fakeSheetsRest((n) => (db.matrixOf ? db.matrixOf(n) : null), (_n, headers) => db.reads?.push(headers));
  return new Function('deps', `
    var UrlFetchApp = deps.urlFetch, ScriptApp = { getOAuthToken: function() { return 'TOKEN'; } };
    var テーブル定義 = deps.tableDefs;
    ${['toBoolean_', 'columnLetter_', 'fetchSheetsValuesBatch_', 'readSheetColumnsViaRest_', 'readSheetColumnsByName_', 'countPendingChangeRequests_'].map(extractFunction).join('\n')}
    return countPendingChangeRequests_;
  `)({ urlFetch, tableDefs: opts.rest === false ? {} : { T_変更申請: CR_HEADERS } }) as (ss: unknown) => number | null;
}
const CR_HEADERS = ['申請ID', '会員ID', '申請種別コード', '申請状態コード', '申請内容JSON', '連絡先メールアドレス', '申請日時', '削除フラグ'];

test('A′ 未処理件数は PENDING かつ削除されていない行の数。2 列だけ読み、申請内容（個人情報）の列は読まない', () => {
  const db = fakeSheetDb('T_変更申請', CR_HEADERS, [
    { 申請ID: 'R1', 申請状態コード: 'PENDING', 申請内容JSON: '{"name":"山田"}', 削除フラグ: false },
    { 申請ID: 'R2', 申請状態コード: 'APPROVED', 削除フラグ: false },
    { 申請ID: 'R3', 申請状態コード: 'PENDING', 削除フラグ: true },
    { 申請ID: 'R4', 申請状態コード: 'PENDING', 削除フラグ: '' },
  ]);
  assert.equal(buildCounter(db)(db), 2);
  const readCols = new Set(db.reads.flat());
  assert.deepEqual([...readCols].sort(), ['削除フラグ', '申請状態コード'].sort());
});

test('A′ シートや列が無ければ数えない（null）＝画面は今の経路で数える', () => {
  const noSheet = { getSheetByName: () => null };
  assert.equal(buildCounter(noSheet)(noSheet), null);
  const noCol = fakeSheetDb('T_変更申請', ['申請ID', '削除フラグ'], [{ 申請ID: 'R1', 削除フラグ: false }]);
  assert.equal(buildCounter(noCol)(noCol), null);
  const empty = fakeSheetDb('T_変更申請', CR_HEADERS, []);
  assert.equal(buildCounter(empty)(empty), 0);
});

test('A′ 初期データの応答に件数を同梱する（変更申請の権限があるときだけ）・画面は同梱を使い、無ければ個別に取る', () => {
  const dispatch = extractFunction('processApiRequest');
  const initBlock = dispatch.slice(dispatch.indexOf("action === 'getAdminInitData'"), dispatch.indexOf("action === 'getTrainingManagementData'"));
  assert.match(initBlock, /isActionAllowedForSession_\('getAdminChangeRequests', parsedPayload\.__adminSession\)/);
  // docs/332 S1: 件数はダッシュボードの完成品と一緒に作り（buildDashboardSnapshotData_）、応答のときに権限で絞る
  assert.match(initBlock, /initSnapshot\.pendingChangeRequestCount/);
  assert.match(extractFunction('buildDashboardSnapshotData_'), /countPendingChangeRequests_\(/);
  assert.match(initBlock, /pendingChangeRequestCount:/);
  const app = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');
  assert.match(app, /adminInitCountRef/, '件数は先行取得とは別の参照で受け取る（ダッシュボードが先行取得を消費しても失われない）');
  const badge = app.slice(app.indexOf("callApi<{ status: string }[]>('getAdminChangeRequests'") - 900, app.indexOf("callApi<{ status: string }[]>('getAdminChangeRequests'") + 200);
  assert.match(badge, /adminInitCountRef\.current/, '同梱の件数を先に見る');
});
