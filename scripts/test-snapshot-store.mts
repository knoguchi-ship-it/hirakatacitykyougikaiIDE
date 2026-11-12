/**
 * 2026-11-12 コールドスタートでも 5 秒（docs/332 S1・TRD §1.3.1・§1.4・§3.2.1）。
 *   完成品をスクリプトプロパティに gzip＋base64 で分けて置き、書き終えてから切り替える。古い印・形式・大きさの上限。
 *   時間トリガー refreshSnapshotsJob の判断。マスタは REST 1 回。列は REST 1 回（見出しが合わなければ全体を 1 回で）。
 * 偽物は本物と同じ制限にする（プロパティ 1 値 9 KB で例外）。実ソースから関数を切り出して実行する（ミラー禁止・AGENTS L3.1）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = gas.indexOf(`\nfunction ${name}(`) + 1;
  assert.ok(start > 0, `${name} が見つからない`);
  const end = gas.indexOf('\n}\n', start);
  return gas.slice(start, end + 2);
}
function extractVar(name: string): string {
  const start = gas.indexOf(`\nvar ${name} =`) + 1;
  assert.ok(start > 0, `var ${name} が見つからない`);
  return gas.slice(start, gas.indexOf('\n', start));
}

// ── 偽物（本物と同じ形・同じ制限） ───────────────────────────────
function fakeProps(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const log: string[] = [];
  return {
    store, log,
    getProperties: () => Object.fromEntries(store),
    getProperty: (k: string) => (store.has(k) ? store.get(k)! : null),
    setProperty: (k: string, v: string) => {
      if (Buffer.byteLength(String(v), 'utf8') > 9 * 1024) throw new Error('値が大きすぎます');
      log.push('set:' + k); store.set(k, String(v));
    },
    setProperties: (obj: Record<string, string>, deleteAll?: boolean) => {
      if (deleteAll) store.clear();
      for (const [k, v] of Object.entries(obj)) {
        if (Buffer.byteLength(String(v), 'utf8') > 9 * 1024) throw new Error('値が大きすぎます');
        log.push('set:' + k); store.set(k, String(v));
      }
    },
    deleteProperty: (k: string) => { log.push('del:' + k); store.delete(k); },
  };
}
type Blob = { bytes: Buffer; getBytes: () => number[]; getDataAsString: () => string };
const newBlob = (data: string | number[] | Buffer): Blob => {
  const bytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data as number[]);
  return { bytes, getBytes: () => Array.from(bytes), getDataAsString: () => bytes.toString('utf8') };
};
const Utilities = {
  newBlob: (d: string | number[]) => newBlob(d),
  gzip: (b: Blob) => newBlob(zlib.gzipSync(b.bytes)),
  ungzip: (b: Blob) => newBlob(zlib.gunzipSync(b.bytes)),
  base64Encode: (bytes: number[]) => Buffer.from(bytes).toString('base64'),
  base64Decode: (s: string) => Array.from(Buffer.from(s, 'base64')),
};

const SNAP_FNS = ['utf8ByteLength_', 'encodeSnapshotPayload_', 'decodeSnapshotPayload_', 'writeSnapshot_', 'readSnapshot_',
  'markSnapshotStale_', 'snapshotNeedsRebuild_', 'getOrBuildSnapshot_'];
const SNAP_VARS = ['SNAPSHOT_FORMAT_', 'SNAPSHOT_PREFIX_', 'SNAPSHOT_STALE_PREFIX_', 'SNAPSHOT_CHUNK_BYTES_', 'SNAPSHOT_TOTAL_LIMIT_BYTES_'];

function buildStore(opts: { props?: ReturnType<typeof fakeProps>; lockOk?: boolean; now?: { t: number }; dbModifiedMs?: number | null } = {}) {
  const props = opts.props || fakeProps();
  const clock = opts.now || { t: 1_800_000_000_000 };
  const warnings: string[] = [];
  const RealDate = Date;
  function FakeDate(this: unknown, ...a: unknown[]) { return a.length ? new (RealDate as any)(...a) : new RealDate(clock.t); }
  (FakeDate as any).now = () => clock.t;
  const f = new Function('deps', `
    var PropertiesService = { getScriptProperties: function() { return deps.props; } };
    var Utilities = deps.Utilities;
    var LockService = { getScriptLock: function() { return { tryLock: function() { return deps.lockOk; }, releaseLock: function() {} }; } };
    var console = { warn: function(m) { deps.warnings.push(String(m)); }, log: function() {} };
    var Date = deps.Date;
    function getOrCreateDatabase_() { return { getId: function() { return 'DB'; } }; }
    function getDbLastModifiedMs_() { return deps.dbModifiedMs; }
    ${SNAP_VARS.map(extractVar).join('\n')}
    ${SNAP_FNS.map(extractFunction).join('\n')}
    return { write: writeSnapshot_, read: readSnapshot_, stale: markSnapshotStale_, needs: snapshotNeedsRebuild_, getOrBuild: getOrBuildSnapshot_,
      CHUNK: SNAPSHOT_CHUNK_BYTES_, LIMIT: SNAPSHOT_TOTAL_LIMIT_BYTES_ };
  `);
  const s = f({ props, Utilities, lockOk: opts.lockOk !== false, warnings, Date: FakeDate, dbModifiedMs: opts.dbModifiedMs === undefined ? clock.t - 60_000 : opts.dbModifiedMs });
  return { s, props, clock, warnings };
}

const bigDashboard = () => ({
  memberCount: 240,
  memberRows: Array.from({ length: 400 }, (_, i) => ({ memberId: 'M' + i, name: '山田 花子' + i, kana: 'ヤマダ ハナコ', status: 'ACTIVE', note: 'x'.repeat(60) })),
});

test('完成品: 圧縮して 8,000 バイト以下に分けて置き、読み戻すと同じ', () => {
  const { s, props } = buildStore();
  const data = bigDashboard();
  assert.equal(s.write('dashboard', data, { dbModifiedAtMs: 1, buildStartedAtMs: 1 }), true);
  const chunks = [...props.store.entries()].filter(([k]) => k.startsWith('SNAP:dashboard:'));
  assert.ok(chunks.length >= 1);
  for (const [, v] of chunks) assert.ok(Buffer.byteLength(v, 'utf8') <= 8000);
  const raw = JSON.stringify(data).length;
  const stored = chunks.reduce((n, [, v]) => n + v.length, 0);
  assert.ok(stored < raw / 3, `圧縮が効いていない（${stored} / ${raw}）`);
  const back = s.read('dashboard', props.getProperties());
  assert.deepEqual(back.data, data);
  assert.equal(back.stale, false);
});

test('完成品: 新しい世代を書き終えてから切り替え、古い世代は切り替えの後に消す', () => {
  const { s, props, clock } = buildStore();
  s.write('settings', { v: 1 }, { dbModifiedAtMs: 1, buildStartedAtMs: clock.t });
  props.log.length = 0;
  clock.t += 1000;
  s.write('settings', { v: 2 }, { dbModifiedAtMs: 2, buildStartedAtMs: clock.t });
  const pointerAt = props.log.indexOf('set:SNAP:settings');
  const lastChunk = props.log.map((l, i) => (l.startsWith('set:SNAP:settings:') ? i : -1)).filter((i) => i >= 0).pop()!;
  const firstDelete = props.log.findIndex((l) => l.startsWith('del:SNAP:settings:'));
  assert.ok(lastChunk < pointerAt, '切り替えの前に新しい世代を書き終える');
  assert.ok(firstDelete > pointerAt, '古い世代は切り替えの後に消す');
  assert.equal([...props.store.keys()].filter((k) => k.startsWith('SNAP:settings:')).length, 1, '古い世代が残っていない');
  assert.equal(s.read('settings', props.getProperties()).data.v, 2);
});

test('完成品: 分割の一部が欠けた・壊れた・形式が違うものは使わない（null）', () => {
  const { s, props } = buildStore();
  s.write('dashboard', bigDashboard(), { dbModifiedAtMs: 1, buildStartedAtMs: 1 });
  const all = props.getProperties();
  const chunkKey = Object.keys(all).find((k) => k.startsWith('SNAP:dashboard:'))!;
  const missing = { ...all }; delete missing[chunkKey];
  assert.equal(s.read('dashboard', missing), null);
  const broken = { ...all, [chunkKey]: 'AAAA' };
  assert.equal(s.read('dashboard', broken), null);
  const pointer = JSON.parse(all['SNAP:dashboard']);
  assert.equal(s.read('dashboard', { ...all, 'SNAP:dashboard': JSON.stringify({ ...pointer, format: 999 }) }), null);
});

test('完成品: 古い印は、印より前に作り始めたものにだけ効く（作り直しの途中の書き込みを取りこぼさない）', () => {
  const { s, props, clock } = buildStore();
  const started = clock.t;
  clock.t += 500;
  s.stale('dashboard'); // 作り直しの途中で書き込みがあった
  clock.t += 500;
  s.write('dashboard', { a: 1 }, { dbModifiedAtMs: 1, buildStartedAtMs: started });
  assert.equal(s.read('dashboard', props.getProperties()).stale, true, '作り始めより後の印は残る');
  clock.t += 1000;
  s.write('dashboard', { a: 2 }, { dbModifiedAtMs: 1, buildStartedAtMs: clock.t });
  assert.equal(s.read('dashboard', props.getProperties()).stale, false, '印より後に作り始めたものは新しい');
});

test('完成品: 全プロパティが上限（400 KB）を超えるなら書かずに警告する・ロックが取れなければ書かない', () => {
  const filler: Record<string, string> = {};
  for (let i = 0; i < 52; i += 1) filler['FILL' + i] = 'z'.repeat(8000); // 約 416 KB（上限 400 KB を超える）
  const a = buildStore({ props: fakeProps(filler) });
  assert.equal(a.s.write('dashboard', bigDashboard(), { dbModifiedAtMs: 1, buildStartedAtMs: 1 }), false);
  assert.ok(a.warnings.some((w) => w.includes('400')), a.warnings.join(' / '));
  assert.equal([...a.props.store.keys()].some((k) => k.startsWith('SNAP:')), false);
  const b = buildStore({ lockOk: false });
  assert.equal(b.s.write('settings', { v: 1 }, { dbModifiedAtMs: 1, buildStartedAtMs: 1 }), false);
  assert.equal(b.props.store.size, 0);
});

test('作り直しの判断: 無い・古い印・DB が新しい・最終更新日時が読めない・上限超え → 作り直す。どれでもなければ作らない', () => {
  const { s } = buildStore();
  const now = 1_000_000;
  const fresh = { data: {}, builtAtMs: now - 60_000, dbModifiedAtMs: 500_000, stale: false };
  assert.equal(s.needs(null, 500_000, now, 600_000), true, '無い');
  assert.equal(s.needs({ ...fresh, stale: true }, 500_000, now, 600_000), true, '古い印');
  assert.equal(s.needs(fresh, 600_000, now, 600_000), true, 'DB が新しい');
  assert.equal(s.needs(fresh, null, now, 600_000), true, '最終更新日時を確かめられない');
  assert.equal(s.needs({ ...fresh, builtAtMs: now - 600_000 }, 500_000, now, 600_000), true, '上限超え');
  assert.equal(s.needs(fresh, 500_000, now, 600_000), false, '何も変わっていない');
});

test('表示の読み（getOrBuildSnapshot_）: 新しい完成品があれば作らない。古い印・上限超え・無いときは作って置く', () => {
  const { s, props, clock } = buildStore();
  let builds = 0;
  const build = () => { builds += 1; return { n: builds }; };
  assert.deepEqual(s.getOrBuild('settings', 3_600_000, build), { n: 1 });
  assert.deepEqual(s.getOrBuild('settings', 3_600_000, build), { n: 1 });
  assert.equal(builds, 1);
  s.stale('settings');
  clock.t += 1;
  assert.deepEqual(s.getOrBuild('settings', 3_600_000, build), { n: 2 }, '古い印は表示の読みで使わない');
  clock.t += 3_600_000;
  assert.deepEqual(s.getOrBuild('settings', 3_600_000, build), { n: 3 });
  assert.ok(props.store.has('SNAP:settings'));
});

// ── REST で読む ──────────────────────────────────────────
// 本物の values:batchGetByDataFilter と同じ形（範囲は本文・応答は valueRanges[].valueRange.values と dataFilters）
type RestReq = { url: string; ranges: string[]; majorDimension: string };
function fakeUrlFetch(responder: (req: RestReq) => { code: number; columnsOrRows?: unknown[][][] }) {
  const calls: RestReq[] = [];
  return {
    calls,
    fetch: (url: string, opts: { payload: string }) => {
      const body = JSON.parse(opts.payload);
      const req = { url, ranges: body.dataFilters.map((d: { a1Range: string }) => d.a1Range), majorDimension: body.majorDimension };
      calls.push(req);
      const r = responder(req);
      const out = r.code === 200
        ? { valueRanges: (r.columnsOrRows || []).map((values, i) => ({ valueRange: { values }, dataFilters: [{ a1Range: req.ranges[i] }] })) }
        : {};
      return { getResponseCode: () => r.code, getContentText: () => JSON.stringify(out) };
    },
  };
}

function buildRestReader(urlFetch: ReturnType<typeof fakeUrlFetch>, tableDefs: Record<string, string[]>, sheets: Record<string, unknown[][]> = {}) {
  const fullReads: string[] = [];
  const ss = {
    getId: () => 'DB',
    getSheetByName: (n: string) => (sheets[n] ? { getDataRange: () => ({ getValues: () => { fullReads.push(n); return sheets[n]; } }) } : null),
  };
  const f = new Function('deps', `
    var UrlFetchApp = deps.urlFetch;
    var ScriptApp = { getOAuthToken: function() { return 'TOKEN'; } };
    var テーブル定義 = deps.tableDefs;
    var マスタ定義 = deps.masterDefs || {};
    ${['columnLetter_', 'rowsFromValues_', 'fetchSheetsValuesBatch_', 'readSheetColumnsViaRest_', 'readSheetColumnsByName_', 'toBoolean_'].map(extractFunction).join('\n')}
    return { cols: readSheetColumnsByName_, letter: columnLetter_, rows: rowsFromValues_ };
  `);
  return { r: f({ urlFetch, tableDefs }), ss, fullReads };
}

test('列の読み: REST 1 回で必要な列だけ（見出しも同じ呼び出しで確かめる）・パスワードの列は範囲に入れない', () => {
  const defs = { T_認証アカウント: ['認証ID', '認証方式', 'ログインID', 'パスワードハッシュ', 'パスワードソルト', 'GoogleユーザーID', 'Googleメール', 'システムロールコード', '会員ID', '職員ID', '最終ログイン日時', 'パスワード更新日時', 'アカウント有効フラグ', 'ログイン失敗回数', 'ロック状態', 'ロック解除予定日時', '作成日時', '更新日時', '削除フラグ'] };
  const uf = fakeUrlFetch((req) => ({ code: 200, columnsOrRows: req.ranges.map((r) => {
    const col = r.split('!')[1].replace(/[0-9:]/g, '').slice(0, 1);
    const header = defs.T_認証アカウント[col.charCodeAt(0) - 65];
    return [[header, header === '認証ID' ? 'AUTH-1' : header === '削除フラグ' ? false : 'v1', header === '認証ID' ? 'AUTH-2' : '']];
  }) }));
  const { r, ss, fullReads } = buildRestReader(uf, defs);
  const out = r.cols(ss, 'T_認証アカウント', ['認証ID', 'システムロールコード', '会員ID', '職員ID', '削除フラグ']);
  assert.equal(uf.calls.length, 1, '通信は 1 回');
  const ranges = uf.calls[0].ranges;
  assert.equal(uf.calls[0].majorDimension, 'COLUMNS');
  assert.ok(!uf.calls[0].url.includes('ranges='), '範囲は URL ではなく本文で送る（URL の 2 KB の上限）');
  assert.ok(!ranges.some((x) => /!D|!E/.test(x)), 'パスワードハッシュ・ソルト（D・E 列）を範囲に入れない: ' + ranges.join(','));
  assert.equal(out.rowCount, 2);
  assert.deepEqual(out.columns['認証ID'], ['AUTH-1', 'AUTH-2']);
  assert.deepEqual(fullReads, []);
  assert.equal(r.letter(1), 'A'); assert.equal(r.letter(26), 'Z'); assert.equal(r.letter(27), 'AA'); assert.equal(r.letter(53), 'BA');
});

test('列の読み: 見出しが定義と合わない・REST が失敗したときは、全体を 1 回で読む（安全側）', () => {
  const defs = { T_変更申請: ['申請ID', '申請状態コード', '削除フラグ'] };
  const sheet = [['申請ID', '削除フラグ', '申請状態コード'], ['R1', false, 'PENDING']]; // 列の順が定義と違う
  const wrongHeader = fakeUrlFetch((req) => ({ code: 200, columnsOrRows: req.ranges.map(() => [['別の見出し', 'x']]) }));
  const a = buildRestReader(wrongHeader, defs, { T_変更申請: sheet });
  const out = a.r.cols(a.ss, 'T_変更申請', ['申請状態コード', '削除フラグ']);
  assert.deepEqual(a.fullReads, ['T_変更申請']);
  assert.deepEqual(out.columns['申請状態コード'], ['PENDING']);
  const failing = fakeUrlFetch(() => ({ code: 500 }));
  const b = buildRestReader(failing, defs, { T_変更申請: sheet });
  assert.equal(b.r.cols(b.ss, 'T_変更申請', ['申請状態コード', '削除フラグ']).rowCount, 1);
  assert.deepEqual(b.fullReads, ['T_変更申請']);
});

test('行の変換: REST の値（末尾の空セルが省かれる）を SpreadsheetApp と同じ形の行にする', () => {
  const { r } = buildRestReader(fakeUrlFetch(() => ({ code: 200 })), {});
  assert.deepEqual(r.rows([['コード', '名称', '無効'], ['A', 'あ'], ['B', 'い', true]]), [
    { コード: 'A', 名称: 'あ', 無効: '' },
    { コード: 'B', 名称: 'い', 無効: true },
  ]);
  assert.deepEqual(r.rows([['コード']]), []);
});

// ── 配線（構造の確認なので文字列照合でよい） ──────────────────────────
test('配線: マスタは完成品（REST 1 回で作る）・設定とダッシュボードは完成品・書き込みの最下層で古い印', () => {
  assert.match(extractFunction('readAllMasterOptions_'), /getOrBuildSnapshot_\('masters'/);
  assert.match(extractFunction('buildAllMasterOptions_'), /fetchSheetsValuesBatch_\(/);
  assert.match(extractFunction('getSystemSettingsForDisplay_'), /getOrBuildSnapshot_\('settings'/);
  assert.match(extractFunction('getDashboardSnapshotData_'), /getOrBuildSnapshot_\('dashboard'/);
  assert.match(extractFunction('getAdminDashboardData_'), /getDashboardSnapshotData_\(\)/);
  assert.match(extractFunction('clearAdminDashboardCache_'), /markSnapshotStale_\('dashboard'\)/);
  assert.match(extractFunction('invalidateSettingsCache_'), /markSnapshotStale_\('settings'\)/);
  assert.match(extractFunction('invalidateMasterOptionsCache_'), /markSnapshotStale_\('masters'\)/);
});

test('配線: 時間トリガー refreshSnapshotsJob（実在のトリガーか MASTER・10 分ごと・死活の一覧に載る・管理 split だけ）', () => {
  const job = extractFunction('refreshSnapshotsJob');
  assert.match(job, /^function refreshSnapshotsJob\(e\) \{\s+assertTriggerOrMasterOperator_\(e, 'refreshSnapshotsJob'\);/);
  assert.match(job, /snapshotNeedsRebuild_\(/);
  assert.match(job, /recordJobHeartbeat_\('refreshSnapshotsJob'\)/);
  assert.match(extractFunction('setupScheduledTriggers'), /newTrigger\('refreshSnapshotsJob'\)\.timeBased\(\)\.everyMinutes\(10\)/);
  const jobsBlock = gas.slice(gas.indexOf('var SCHEDULED_JOBS_ = ['), gas.indexOf('];', gas.indexOf('var SCHEDULED_JOBS_ = [')));
  assert.match(jobsBlock, /name: 'refreshSnapshotsJob'/);
  const registry = fs.readFileSync(path.join(ROOT, 'scripts', 'gas-boundary-utils.mjs'), 'latin1');
  assert.equal(registry.split("'refreshSnapshotsJob'").length - 1, 2, '管理の最上位関数と定期ジョブの一覧の 2 か所');
});
