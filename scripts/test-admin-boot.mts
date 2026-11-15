/**
 * 2026-11-15 管理画面の初期データの埋め込み（docs/332 §13・TRD §1.3.1・データ・IF §5.6）。
 *   doGet が閲覧者を確かめ、完成品を「読むだけ」で window.__ADMIN_BOOT__ に入れる。権限で絞る。失敗は今の経路へ。
 *   表示の後の refreshAdminBoot は、DB の最終更新日時も含めて確かめ、版が変わったときだけ初期データを返す（§13.9 B）。
 *   マスタの完成品の上限は管理 60 分・公開と会員 10 分（§13.9 A）。
 * 実ソースから関数を切り出して実行する（ミラー禁止・AGENTS L3.1）。偽物は本物と同じ制限（プロパティ 1 値 9 KB）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

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

// ── 偽物 ───────────────────────────────────────────────
function fakeProps() {
  const store = new Map<string, string>();
  return {
    store,
    getProperties: () => Object.fromEntries(store),
    getProperty: (k: string) => (store.has(k) ? store.get(k)! : null),
    setProperty: (k: string, v: string) => {
      if (Buffer.byteLength(String(v), 'utf8') > 9 * 1024) throw new Error('値が大きすぎます');
      store.set(k, String(v));
    },
    setProperties: (obj: Record<string, string>) => {
      for (const [k, v] of Object.entries(obj)) {
        if (Buffer.byteLength(String(v), 'utf8') > 9 * 1024) throw new Error('値が大きすぎます');
        store.set(k, String(v));
      }
    },
    deleteProperty: (k: string) => { store.delete(k); },
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

const SNAP_VARS = ['SNAPSHOT_FORMAT_', 'SNAPSHOT_PREFIX_', 'SNAPSHOT_STALE_PREFIX_', 'SNAPSHOT_CHUNK_BYTES_', 'SNAPSHOT_TOTAL_LIMIT_BYTES_',
  'SNAPSHOT_MAX_AGE_MASTERS_MS_', 'SNAPSHOT_MAX_AGE_MASTERS_ADMIN_MS_', 'SNAPSHOT_MAX_AGE_SETTINGS_MS_', 'SNAPSHOT_MAX_AGE_DASHBOARD_MS_', 'ADMIN_BOOT_FORMAT_'];
const SNAP_FNS = ['utf8ByteLength_', 'encodeSnapshotPayload_', 'decodeSnapshotPayload_', 'writeSnapshot_', 'readSnapshot_',
  'markSnapshotStale_', 'snapshotNeedsRebuild_', 'mastersSnapshotMaxAgeMs_',
  'buildAdminBootPayload_', 'adminBootScriptTag_', 'adminInitFromSnapshots_', 'adminInitVersion_',
  'refreshAdminInitSnapshot_', 'buildAdminBootRefresh_'];

type Session = { loginId: string; canAccessAdminPage: boolean; allowed: string[] };
type Deps = {
  props: ReturnType<typeof fakeProps>;
  clock: { t: number };
  boundary: string;
  session: Session | Error;
  dbModifiedMs: number | null;
  calls: string[];
  authOptions: unknown[];
};

function harness(over: Partial<Deps> = {}) {
  const deps: Deps = {
    props: fakeProps(),
    clock: { t: 1_800_000_000_000 },
    boundary: 'admin',
    session: { loginId: 'admin@example.invalid', canAccessAdminPage: true, allowed: ['getAdminInitData', 'getAdminChangeRequests'] },
    dbModifiedMs: 1_800_000_000_000 - 60_000,
    calls: [],
    authOptions: [],
    ...over,
  };
  const RealDate = Date;
  function FakeDate(this: unknown, ...a: unknown[]) { return a.length ? new (RealDate as any)(...a) : new RealDate(deps.clock.t); }
  (FakeDate as any).now = () => deps.clock.t;
  const f = new Function('deps', `
    var PropertiesService = { getScriptProperties: function() { return deps.props; } };
    var Utilities = deps.Utilities;
    var LockService = { getScriptLock: function() { return { tryLock: function() { return true; }, releaseLock: function() {} }; } };
    var console = { warn: function() {}, log: function() {} };
    var Date = deps.Date;
    var APP_SECURITY_BOUNDARY = deps.boundary;
    function checkAdminBySession_(options) {
      deps.authOptions.push(options || null);
      if (deps.session instanceof Error) throw deps.session;
      return deps.session;
    }
    function isActionAllowedForSession_(name, session) { return session.allowed.indexOf(name) !== -1; }
    function getOrCreateDatabase_() { deps.calls.push('openDb'); return { getId: function() { return 'DB'; } }; }
    function initializeSchemaIfNeeded_() { deps.calls.push('schema'); }
    function getDbLastModifiedMs_() { deps.calls.push('dbModified'); return deps.dbModifiedMs; }
    function masterOptionsForClient_(ss, scope) { deps.calls.push('masters:' + scope); return { M_x: [{ code: 'A' }] }; }
    function buildDashboardSnapshotData_() { deps.calls.push('build:dashboard'); return { dashboard: { memberCount: 9, built: 'new' }, pendingChangeRequestCount: 4 }; }
    function getSystemSettings_() { deps.calls.push('build:settings'); return { s: 'new' }; }
    function reportOverdueScheduledJobs_() { deps.calls.push('jobs'); return {}; }
    function getOrBuildSnapshot_() { deps.calls.push('getOrBuild'); throw new Error('作り直しを呼んだ'); }
    ${SNAP_VARS.map(extractVar).join('\n')}
    ${SNAP_FNS.map(extractFunction).join('\n')}
    return { write: writeSnapshot_, read: readSnapshot_, stale: markSnapshotStale_, boot: buildAdminBootPayload_, tag: adminBootScriptTag_,
      refresh: buildAdminBootRefresh_, mastersMaxAge: mastersSnapshotMaxAgeMs_ };
  `);
  const g = f(Object.assign(deps, { Utilities, Date: FakeDate })); // 同じ入れ物を渡す（後から変えた値を届ける）
  return { g, deps };
}

function seed(h: ReturnType<typeof harness>, names: string[] = ['masters', 'dashboard', 'settings']) {
  const data: Record<string, unknown> = {
    masters: { M_x: [{ code: 'A' }] },
    dashboard: { dashboard: { memberCount: 3, memberRows: [{ id: 'M1' }] }, pendingChangeRequestCount: 2 },
    settings: { s: 'old' },
  };
  for (const n of names) {
    assert.ok(h.g.write(n, data[n], { dbModifiedAtMs: h.deps.dbModifiedMs ?? -1, buildStartedAtMs: h.deps.clock.t }));
  }
}
const genOf = (h: ReturnType<typeof harness>, name: string) => JSON.parse(h.deps.props.store.get('SNAP:' + name)!).gen;

// ── doGet の埋め込み ─────────────────────────────────────
test('埋め込み: 管理者でダッシュボードの権限があれば、認証・マスタ・初期データ・件数・版を入れる', () => {
  const h = harness();
  seed(h);
  const boot = h.g.boot();
  assert.equal(boot.v, 1);
  assert.equal(boot.auth.loginId, 'admin@example.invalid');
  assert.deepEqual(boot.auth.masters, { M_x: [{ code: 'A' }] });
  assert.equal(boot.init.dashboard.memberCount, 3);
  assert.deepEqual(boot.init.settings, { s: 'old' });
  assert.equal(boot.init.pendingChangeRequestCount, 2);
  assert.equal(boot.initVersion, `${genOf(h, 'dashboard')}:${genOf(h, 'settings')}`);
  assert.equal(boot.initBuiltAtMs, h.deps.clock.t);
  assert.equal(boot.initStale, false);
});

test('埋め込み: 認証は失敗を記録しない形で呼び、失敗したら何も埋め込まない（今の経路で 1 回だけ記録）', () => {
  const h = harness({ session: new Error('管理者権限がありません。') });
  seed(h);
  assert.equal(h.g.boot(), null);
  assert.deepEqual(h.deps.authOptions, [{ silentFailure: true }]);
});

test('埋め込み: 管理画面に入れない・形が違う認証の結果なら埋め込まない', () => {
  const h = harness({ session: { loginId: 'x@example.invalid', canAccessAdminPage: false, allowed: ['getAdminInitData'] } });
  seed(h);
  assert.equal(h.g.boot(), null);
});

test('埋め込み: ダッシュボードの権限が無ければ認証とマスタだけ。件数の権限が無ければ件数は null', () => {
  const noInit = harness({ session: { loginId: 'tm@example.invalid', canAccessAdminPage: true, allowed: ['getAdminChangeRequests'] } });
  seed(noInit);
  const a = noInit.g.boot();
  assert.equal(a.init, null);
  assert.equal(a.initVersion, null);
  assert.ok(a.auth.masters);
  const noCount = harness({ session: { loginId: 'ad@example.invalid', canAccessAdminPage: true, allowed: ['getAdminInitData'] } });
  seed(noCount);
  assert.equal(noCount.g.boot().init.pendingChangeRequestCount, null);
});

test('埋め込み: 完成品が無ければ作り直さず、初期データは null（マスタが無ければ埋め込まない）', () => {
  const noDash = harness();
  seed(noDash, ['masters', 'settings']);
  const b = noDash.g.boot();
  assert.equal(b.init, null);
  assert.ok(!noDash.deps.calls.includes('getOrBuild'));
  assert.ok(!noDash.deps.calls.some((c) => c.startsWith('build:')), 'doGet で作り直さない');
  const noMasters = harness();
  seed(noMasters, ['dashboard', 'settings']);
  assert.equal(noMasters.g.boot(), null);
});

test('埋め込み: 古い印が付いていれば印付きで先に出す（initStale）', () => {
  const h = harness();
  seed(h);
  h.deps.clock.t += 1000;
  h.g.stale('dashboard');
  const b = h.g.boot();
  assert.ok(b.init, '古くても先に出す');
  assert.equal(b.initStale, true);
});

test('埋め込み: 例外が起きても doGet を止めず null', () => {
  const h = harness();
  seed(h);
  h.deps.props.getProperties = () => { throw new Error('プロパティを読めない'); };
  assert.equal(h.g.boot(), null);
});

test('埋め込み: </script>・U+2028・U+2029 で HTML と JS を壊させない', () => {
  const h = harness();
  const tag = h.g.tag({ v: 1, note: '</script><script>alert(1)</script>  ' });
  assert.ok(tag.startsWith('<script>window.__ADMIN_BOOT__='));
  assert.ok(tag.endsWith(';</script>'));
  const inner = tag.slice('<script>'.length, -'</script>'.length);
  assert.ok(!inner.includes('<'), '中に < を残さない');
  assert.ok(!inner.includes(' ') && !inner.includes(' '));
  const win: Record<string, unknown> = {};
  new Function('window', inner)(win);
  assert.equal((win.__ADMIN_BOOT__ as { note: string }).note, '</script><script>alert(1)</script>  ');
});

// ── 表示の後の取り直し（refreshAdminBoot） ─────────────────────
test('取り直し: 版が同じで変わっていなければ中身を送らない（initUnchanged）', () => {
  const h = harness();
  seed(h);
  const known = `${genOf(h, 'dashboard')}:${genOf(h, 'settings')}`;
  const r = h.g.refresh(h.deps.session, known);
  assert.equal(r.initUnchanged, true);
  assert.equal(r.init, null);
  assert.equal(r.initVersion, known);
  assert.ok(r.auth.masters, '認証とマスタはいつも返す');
  assert.ok(h.deps.calls.includes('jobs'), '定期ジョブの死活を評価する');
  assert.ok(!h.deps.calls.some((c) => c.startsWith('build:')));
});

test('取り直し: 版が違えば、作り直さずに今の完成品を返す', () => {
  const h = harness();
  seed(h);
  const r = h.g.refresh(h.deps.session, 'old:old');
  assert.equal(r.initUnchanged, false);
  assert.equal(r.init.dashboard.memberCount, 3);
  assert.equal(r.init.pendingChangeRequestCount, 2);
  assert.ok(!h.deps.calls.some((c) => c.startsWith('build:')));
});

test('取り直し: DB の最終更新日時が新しい・古い印付きなら作り直して新しい版を返す', () => {
  const h = harness();
  seed(h);
  const known = `${genOf(h, 'dashboard')}:${genOf(h, 'settings')}`;
  h.deps.clock.t += 5000;
  h.deps.dbModifiedMs = h.deps.clock.t; // 別のプロジェクトの書き込み
  const r = h.g.refresh(h.deps.session, known);
  assert.ok(h.deps.calls.includes('build:dashboard') && h.deps.calls.includes('build:settings'));
  assert.equal(r.initUnchanged, false);
  assert.notEqual(r.initVersion, known);
  assert.equal(r.init.dashboard.built, 'new');
  assert.equal(r.init.pendingChangeRequestCount, 4);
  assert.equal(h.g.read('dashboard', h.deps.props.getProperties()).data.dashboard.built, 'new', '作り直したものを置く');

  const s = harness();
  seed(s);
  s.deps.clock.t += 1000;
  s.g.stale('settings');
  const r2 = s.g.refresh(s.deps.session, `${genOf(s, 'dashboard')}:${genOf(s, 'settings')}`);
  assert.ok(s.deps.calls.includes('build:settings'));
  assert.ok(!s.deps.calls.includes('build:dashboard'), '変わっていない方は作り直さない');
  assert.equal(r2.initUnchanged, false);
});

test('取り直し: ダッシュボードの権限が無ければ初期データを扱わない（認証とマスタだけ）', () => {
  const h = harness({ session: { loginId: 'tm@example.invalid', canAccessAdminPage: true, allowed: [] } });
  seed(h);
  const r = h.g.refresh(h.deps.session, '');
  assert.equal(r.init, null);
  assert.equal(r.initVersion, null);
  assert.ok(r.auth.masters);
  assert.ok(!h.deps.calls.includes('dbModified') && !h.deps.calls.includes('jobs'));
});

// ── A: マスタの上限 ─────────────────────────────────────
test('マスタの完成品の上限は管理 60 分・公開と会員 10 分。トリガーと表示の読みが同じ関数を使う', () => {
  assert.equal(harness({ boundary: 'admin' }).g.mastersMaxAge(), 60 * 60 * 1000);
  assert.equal(harness({ boundary: 'public' }).g.mastersMaxAge(), 10 * 60 * 1000);
  assert.equal(harness({ boundary: 'member' }).g.mastersMaxAge(), 10 * 60 * 1000);
  for (const fn of ['readAllMasterOptions_', 'refreshSnapshotsJob']) {
    const body = extractFunction(fn);
    assert.match(body, /mastersSnapshotMaxAgeMs_\(\)/, `${fn} が上限の関数を使っていない`);
    assert.doesNotMatch(body, /SNAPSHOT_MAX_AGE_MASTERS_MS_/, `${fn} が 10 分を直に使っている`);
  }
});

// ── 配線 ────────────────────────────────────────────
test('配線: doGet は管理 split だけで埋め込み、公開・会員の build はその塊を削る', () => {
  const doGet = extractFunction('doGet');
  assert.match(doGet, /var adminBootRoute = APP_SECURITY_BOUNDARY === 'admin';/);
  assert.match(doGet, /if \(adminBootRoute\) \{[\s\S]*buildAdminBootPayload_\(\)[\s\S]*adminBootScriptTag_\(/);
  for (const f of ['scripts/build-gas.mjs', 'scripts/build-member-gas.mjs']) {
    assert.match(read(f), /removeIfBlock\(code, 'adminBootRoute'\)/, `${f} が埋め込みを削っていない`);
  }
  for (const f of ['scripts/audit-public-boundary.mjs', 'scripts/audit-member-boundary.mjs']) {
    const src = read(f);
    for (const token of ['buildAdminBootPayload_', '__ADMIN_BOOT__', 'refreshAdminBoot']) {
      assert.ok(src.includes(`'${token}'`), `${f} の禁止語に ${token} が無い`);
    }
  }
});

test('配線: checkAdminBySession_ は silentFailure のとき失敗をログイン履歴へ書かない', () => {
  const body = extractFunction('checkAdminBySession_');
  assert.match(body, /var silentFailure = !!\(options && options\.silentFailure\);/);
  const failureWrites = body.match(/appendLoginHistory_\(ss, [^)]*'FAILURE'[^)]*\)/g) || [];
  assert.equal(failureWrites.length, 1, '失敗の記録は silentFailure を見る 1 か所から');
  assert.match(body, /if \(!silentFailure\) appendLoginHistory_\(ss, [^)]*'FAILURE'/);
  assert.ok((body.match(/logFailure\(/g) || []).length >= 5, '失敗の分岐はすべて logFailure を通す');
});

test('配線: refreshAdminBoot は管理のログイン action（gas-src・共有定数。checkAdminBySession と同じく機能一覧の分類の対象外）で、ログインを記録して取り直す', () => {
  assert.match(gas, /var ADMIN_LOGIN_ACTIONS = \{[^}]*refreshAdminBoot: true/);
  assert.match(read('scripts/gas-boundary-utils.mjs'), /ADMIN_LOGIN_ACTIONS_LIST = \[[^\]]*'refreshAdminBoot'/);
  const i = gas.indexOf("if (action === 'refreshAdminBoot') {");
  assert.ok(i > 0, 'action の処理が無い');
  const handler = gas.slice(i, gas.indexOf('\n    }\n', i));
  assert.match(handler, /checkAdminBySession_\(\{ recordLogin: true \}\)/);
  assert.match(handler, /buildAdminBootRefresh_\(/);
});

// ── 画面（src/utils/adminBoot.ts） ─────────────────────────────
const loadClient = () => import('../src/utils/adminBoot.ts');
const validBoot = () => ({
  v: 1,
  auth: { loginId: 'admin@example.invalid', canAccessAdminPage: true, isMaster: true, allowedMenus: ['admin'], masters: {} },
  init: { dashboard: { memberCount: 1, memberRows: [] }, settings: {}, pendingChangeRequestCount: 0 },
  initVersion: 'g1:g2',
  initBuiltAtMs: 1_000_000,
  initStale: false,
});

test('画面: 埋め込みは 1 回だけ取り出して消す。形が違うものは使わない', async () => {
  const { takeAdminBoot } = await loadClient();
  const g = globalThis as unknown as { window?: Record<string, unknown> };
  const hadWindow = 'window' in g;
  g.window = { __ADMIN_BOOT__: validBoot() };
  try {
    const boot = takeAdminBoot();
    assert.equal(boot?.auth.loginId, 'admin@example.invalid');
    assert.equal(g.window.__ADMIN_BOOT__, undefined, '取り出したら消す');
    assert.equal(takeAdminBoot(), null, '2 回目は無い');
    for (const bad of [
      { ...validBoot(), v: 2 },
      { ...validBoot(), auth: { canAccessAdminPage: true } },
      { ...validBoot(), auth: { ...validBoot().auth, canAccessAdminPage: false } },
      { ...validBoot(), init: { settings: {} } },
      'x', null,
    ]) {
      g.window = { __ADMIN_BOOT__: bad };
      assert.equal(takeAdminBoot(), null, JSON.stringify(bad));
    }
  } finally {
    if (!hadWindow) delete g.window;
  }
});

test('画面: 「◯分前の内容」は古い印か 2 分超のときだけ（新しいときは出さない）', async () => {
  const { refreshNoticeAgeMinutes } = await loadClient();
  const b = validBoot();
  assert.equal(refreshNoticeAgeMinutes(b, b.initBuiltAtMs + 60_000), null, '1 分前は出さない');
  assert.equal(refreshNoticeAgeMinutes(b, b.initBuiltAtMs + 7 * 60_000), 7);
  assert.equal(refreshNoticeAgeMinutes({ ...b, initStale: true }, b.initBuiltAtMs + 30_000), 1, '古い印は短くても出す（最低 1 分と表示）');
  assert.equal(refreshNoticeAgeMinutes({ ...b, init: null }, b.initBuiltAtMs + 7 * 60_000), null, '初期データが無ければ出さない');
});

test('画面: 管理者 shell は埋め込みを使い、表示の後に refreshAdminBoot を版つきで呼ぶ', () => {
  const app = read('src/App.tsx');
  assert.match(app, /takeAdminBoot\(\)/);
  assert.match(app, /api\.refreshAdminBoot\(/);
  const api = read('src/services/api.ts');
  assert.match(api, /async refreshAdminBoot\(knownInitVersion: string\)/);
  assert.match(api, /callAction<[^>]*>\('refreshAdminBoot', \{ knownInitVersion \}\)/);
});
