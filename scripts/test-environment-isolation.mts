/**
 * 2026-11-15 環境の分離（docs/334 §10.2・TRD §1.8）。
 *   本番かどうかは ScriptApp.getScriptId() で決める（設定のフラグでは決めない）。
 *   本番でないときは、コードの中の本番の既定値を使わない（fail closed）:
 *     E1 DB は DB_SPREADSHEET_ID_OVERRIDE だけ・本番 DB の ID は拒む・新しい表を作らない
 *     E2 pepper は Secret Manager を読まず、プロパティ PASSWORD_HASH_PEPPER_V1 だけ
 *     E3 メールの送信の判定で LIVE を送らない（infra error のときも送らない）
 *   本番での動きは変えない。
 * 実ソースから切り出して実行する（ミラー禁止・AGENTS L3.1）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, process.env.TEST_GAS_SRC || 'gas-src/Code.full.gs'), 'utf8');

const PROD_PUBLIC = '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL';
const PROD_MEMBER = '1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ';
const PROD_ADMIN = '1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi';
const PROD_DB = '1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs';
const STAGING_SCRIPT = 'STAGING_SCRIPT_ID_FOR_TEST';
const STAGING_DB = 'STAGING_DB_ID_FOR_TEST';

function extractFunction(name: string): string {
  const start = gas.indexOf(`\nfunction ${name}(`) + 1;
  assert.ok(start > 0, `${name} が見つからない`);
  const end = gas.indexOf('\n}\n', start);
  return gas.slice(start, end + 2);
}
/** 先頭の DB の ID の決め方（本番の ID の一覧〜DB_SPREADSHEET_ID_FIXED の IIFE）を切り出す */
function extractDbIdPrelude(): string {
  const start = gas.indexOf('\nvar PRODUCTION_SCRIPT_IDS_ =');
  assert.ok(start >= 0, 'var PRODUCTION_SCRIPT_IDS_ が見つからない（本番のスクリプト ID の一覧）');
  const fixed = gas.indexOf('\nvar DB_SPREADSHEET_ID_FIXED =', start);
  assert.ok(fixed > start, 'DB_SPREADSHEET_ID_FIXED が PRODUCTION_SCRIPT_IDS_ の後に無い（読み込み時に一覧が未定義になる）');
  const end = gas.indexOf('})();', fixed);
  return gas.slice(start, end + 5);
}

type Env = { scriptId: string | Error; props: Record<string, string>; openable: Set<string>; secret: string | Error };

function load(env: Env) {
  const calls: string[] = [];
  const store = { ...env.props };
  const props = {
    getProperty: (k: string) => (k in store ? store[k] : null),
    setProperty: (k: string, v: string) => { calls.push(`setProperty ${k}=${v}`); store[k] = v; },
  };
  const ScriptApp = {
    getScriptId: () => { if (env.scriptId instanceof Error) throw env.scriptId; return env.scriptId; },
    getOAuthToken: () => 'token',
  };
  const SpreadsheetApp = {
    openById: (id: string) => {
      calls.push(`openById ${id}`);
      if (!id || !env.openable.has(id)) throw new Error(`開けない: ${id}`);
      return { getId: () => id };
    },
    create: (name: string) => { calls.push(`create ${name}`); return { getId: () => 'NEW' }; },
  };
  const UrlFetchApp = {
    fetch: (url: string) => {
      calls.push(`fetch ${url}`);
      if (env.secret instanceof Error) throw env.secret;
      const data = Buffer.from(env.secret, 'utf8').toString('base64');
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ payload: { data } }) };
    },
  };
  const Utilities = {
    base64Decode: (s: string) => Array.from(Buffer.from(s, 'base64')),
    newBlob: (bytes: number[]) => ({ getDataAsString: () => Buffer.from(bytes).toString('utf8') }),
  };
  const CacheService = { getScriptCache: () => ({ get: () => null, put: () => {} }) };
  const Logger = { log: () => {} };
  const settings: Record<string, string> = {};
  const src = [
    "var DB_SPREADSHEET_ID_KEY = 'DB_SPREADSHEET_ID';",
    "var DB_SPREADSHEET_NAME = 'テストDB';",
    extractDbIdPrelude(),
    extractFunction('isProductionScript_'),
    extractFunction('getOrCreateDatabase_'),
    "var PASSWORD_HASH_PEPPER_PROPERTY = 'PASSWORD_HASH_PEPPER_V1';",
    "var PASSWORD_HASH_PEPPER_GCP_PROJECT_PROPERTY = 'PASSWORD_HASH_PEPPER_GCP_PROJECT';",
    "var PASSWORD_HASH_PEPPER_GCP_PROJECT_DEFAULT = 'hcmn-member-system-prod';",
    "var PASSWORD_HASH_PEPPER_SECRET_NAME_PROPERTY = 'PASSWORD_HASH_PEPPER_SECRET_NAME';",
    "var PASSWORD_HASH_PEPPER_SECRET_NAME_DEFAULT = 'PASSWORD_HASH_PEPPER_V1';",
    "var PASSWORD_HASH_PEPPER_CACHE_KEY = 'pepper:v1';",
    'var PASSWORD_HASH_PEPPER_CACHE_TTL_SECONDS = 300;',
    extractFunction('getPasswordPepper_'),
    extractFunction('getPasswordPepperSecretName_'),
    extractFunction('fetchPepperFromSecretManager_'),
    "var MAIL_DELIVERY_STATE_STOPPED_ = 'STOPPED';",
    "var MAIL_DELIVERY_STATE_LIVE_ = 'LIVE';",
    "var MAIL_DELIVERY_STATE_REDIRECT_ = 'REDIRECT';",
    extractFunction('getMailDeliveryState_'),
    extractFunction('mailDispatchPolicy_'),
    'return { DB_SPREADSHEET_ID_FIXED, getOrCreateDatabase_, getPasswordPepper_, mailDispatchPolicy_, isProductionScript_ };',
  ].join('\n');
  const fn = new Function('PropertiesService', 'ScriptApp', 'SpreadsheetApp', 'UrlFetchApp', 'Utilities', 'CacheService', 'Logger',
    'getSystemSettingMap_', 'getSystemSettingValue_', src);
  const api = fn({ getScriptProperties: () => props }, ScriptApp, SpreadsheetApp, UrlFetchApp, Utilities, CacheService, Logger,
    () => settings, (_ss: unknown, k: string) => settings[k] || '');
  return { api, calls, store, settings };
}

const openAll = new Set([PROD_DB, STAGING_DB]);

// ── 本番の判定 ───────────────────────────────────────────
test('本番の 3 つのスクリプト ID は本番・それ以外と取得の失敗は本番でない', () => {
  for (const id of [PROD_PUBLIC, PROD_MEMBER, PROD_ADMIN]) {
    assert.equal(load({ scriptId: id, props: {}, openable: openAll, secret: 'x' }).api.isProductionScript_(), true, id);
  }
  assert.equal(load({ scriptId: STAGING_SCRIPT, props: {}, openable: openAll, secret: 'x' }).api.isProductionScript_(), false);
  assert.equal(load({ scriptId: new Error('取れない'), props: {}, openable: openAll, secret: 'x' }).api.isProductionScript_(), false);
});

test('本番のスクリプト ID の一覧は doGet の振り分けの既定値と同じ', () => {
  for (const id of [PROD_PUBLIC, PROD_MEMBER, PROD_ADMIN]) {
    assert.ok(extractDbIdPrelude().includes(id), `一覧に ${id} が無い`);
    assert.ok(extractFunction('doGet').includes(id), `doGet に ${id} が無い`);
  }
});

// ── E1 DB ───────────────────────────────────────────────
test('E1 本番: 上書きが無ければ本番 DB・あればその値（今と同じ）', () => {
  assert.equal(load({ scriptId: PROD_ADMIN, props: {}, openable: openAll, secret: 'x' }).api.DB_SPREADSHEET_ID_FIXED, PROD_DB);
  assert.equal(load({ scriptId: PROD_ADMIN, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB }, openable: openAll, secret: 'x' }).api.DB_SPREADSHEET_ID_FIXED, STAGING_DB);
});

test('E1 本番でない: 上書きが無い・本番 DB を指す → 固定 ID は空（本番 DB を開かない）', () => {
  assert.equal(load({ scriptId: STAGING_SCRIPT, props: {}, openable: openAll, secret: 'x' }).api.DB_SPREADSHEET_ID_FIXED, '');
  assert.equal(load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: PROD_DB }, openable: openAll, secret: 'x' }).api.DB_SPREADSHEET_ID_FIXED, '');
  assert.equal(load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: ` ${STAGING_DB} ` }, openable: openAll, secret: 'x' }).api.DB_SPREADSHEET_ID_FIXED, STAGING_DB);
});

test('E1 本番でない: getOrCreateDatabase_ は上書きの DB だけを開き、プロパティ DB_SPREADSHEET_ID の本番 DB を使わない', () => {
  const { api, calls } = load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB, DB_SPREADSHEET_ID: PROD_DB }, openable: openAll, secret: 'x' });
  assert.equal(api.getOrCreateDatabase_().getId(), STAGING_DB);
  assert.ok(!calls.includes(`openById ${PROD_DB}`), calls.join(' / '));
});

test('E1 本番でない: 上書きが無ければ止める（本番 DB を開かない・新しい表を作らない）', () => {
  const { api, calls } = load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID: PROD_DB }, openable: openAll, secret: 'x' });
  assert.throws(() => api.getOrCreateDatabase_(), /DB_SPREADSHEET_ID_OVERRIDE/);
  assert.ok(!calls.some((c) => c.startsWith('create') || c === `openById ${PROD_DB}`), calls.join(' / '));
});

test('E1 本番でない: 上書きの DB が開けなければ止める（新しい表を作らない）', () => {
  const { api, calls } = load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB }, openable: new Set([PROD_DB]), secret: 'x' });
  assert.throws(() => api.getOrCreateDatabase_());
  assert.ok(!calls.some((c) => c.startsWith('create')), calls.join(' / '));
});

test('E1 本番: getOrCreateDatabase_ は今と同じ（プロパティ → 固定 ID）', () => {
  const a = load({ scriptId: PROD_PUBLIC, props: { DB_SPREADSHEET_ID: PROD_DB }, openable: openAll, secret: 'x' });
  assert.equal(a.api.getOrCreateDatabase_().getId(), PROD_DB);
  const b = load({ scriptId: PROD_PUBLIC, props: {}, openable: openAll, secret: 'x' });
  assert.equal(b.api.getOrCreateDatabase_().getId(), PROD_DB);
  assert.ok(b.calls.includes(`setProperty DB_SPREADSHEET_ID=${PROD_DB}`));
});

// ── E2 pepper ───────────────────────────────────────────
test('E2 本番: Secret Manager を先に読む（今と同じ）', () => {
  const { api, calls } = load({ scriptId: PROD_MEMBER, props: { PASSWORD_HASH_PEPPER_V1: 'prop' }, openable: openAll, secret: 'from-sm' });
  assert.equal(api.getPasswordPepper_(), 'from-sm');
  assert.ok(calls.some((c) => c.startsWith('fetch https://secretmanager.googleapis.com/')));
});

test('E2 本番でない: Secret Manager を読まず、プロパティだけ', () => {
  const { api, calls } = load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB, PASSWORD_HASH_PEPPER_V1: 'staging-pepper' }, openable: openAll, secret: 'PROD-PEPPER' });
  assert.equal(api.getPasswordPepper_(), 'staging-pepper');
  assert.ok(!calls.some((c) => c.startsWith('fetch')), calls.join(' / '));
});

test('E2 本番でない: プロパティが空なら空（本番の pepper に落ちない）', () => {
  const { api, calls } = load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB }, openable: openAll, secret: 'PROD-PEPPER' });
  assert.equal(api.getPasswordPepper_(), '');
  assert.ok(!calls.some((c) => c.startsWith('fetch')));
});

// ── E3 メール ───────────────────────────────────────────
test('E3 本番: LIVE は送る・infra error も LIVE（今と同じ）', () => {
  const a = load({ scriptId: PROD_ADMIN, props: {}, openable: openAll, secret: 'x' });
  a.settings.MAIL_DELIVERY_STATE = 'LIVE';
  assert.equal(a.api.mailDispatchPolicy_().mode, 'LIVE');
  const b = load({ scriptId: PROD_ADMIN, props: {}, openable: new Set(), secret: 'x' });
  assert.equal(b.api.mailDispatchPolicy_().mode, 'LIVE');
});

test('E3 本番でない: LIVE は送らない・infra error でも送らない・REDIRECT は今と同じ', () => {
  const a = load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB }, openable: openAll, secret: 'x' });
  a.settings.MAIL_DELIVERY_STATE = 'LIVE';
  assert.equal(a.api.mailDispatchPolicy_().mode, 'SUPPRESS');
  const b = load({ scriptId: STAGING_SCRIPT, props: {}, openable: openAll, secret: 'x' });
  assert.equal(b.api.mailDispatchPolicy_().mode, 'SUPPRESS');
  const c = load({ scriptId: STAGING_SCRIPT, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB }, openable: openAll, secret: 'x' });
  c.settings.MAIL_DELIVERY_STATE = 'REDIRECT';
  c.settings.MAIL_REDIRECT_ALLOWLIST = 'a@example.invalid';
  assert.deepEqual(c.api.mailDispatchPolicy_(), { mode: 'REDIRECT', allowlist: ['a@example.invalid'] });
});

// ── 3 つの生成物に入っている ─────────────────────────────
test('E1〜E3 の判定は 3 つの生成物すべてに入っている', () => {
  for (const f of ['backend/Code.gs', 'gas/member/Code.gs', 'gas/admin/Code.gs']) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(code.includes('var PRODUCTION_SCRIPT_IDS_ ='), `${f} に本番のスクリプト ID の一覧が無い`);
    assert.ok(code.includes('function isProductionScript_('), `${f} に isProductionScript_ が無い`);
  }
});

// ── ステージングの DB とログの用意（docs/334 §10.4） ───────────────────
function loadSetup(opts: { production: boolean; props: Record<string, string> }) {
  const calls: string[] = [];
  const store = { ...opts.props };
  const deps = {
    production: opts.production,
    props: {
      getProperty: (k: string) => (k in store ? store[k] : null),
      setProperty: (k: string, v: string) => { calls.push(`set ${k}=${v}`); store[k] = v; },
    },
    send: (method: string, p: string, body: { name: string }) => { calls.push(`${method} ${body.name}`); return { id: `NEW_${calls.length}` }; },
    ensure: () => { calls.push('ensureFolders'); return { ids: { 'conf/ステージング/DB': 'F_DB', 'conf/ステージング/ログ': 'F_LOG' }, missing: [] }; },
    rebuild: (ss: { id: string }) => calls.push(`rebuildLog ${ss.id}`),
  };
  const src = [
    `var PRODUCTION_DB_SPREADSHEET_ID_ = '${PROD_DB}';`,
    "var DRIVE_REORG_TARGET_FOLDER_ID_ = 'CONF'; var DRIVE_REORG_PUBLIC_DRIVE_ID_ = 'PUB';",
    'function isProductionScript_() { return deps.production; }',
    'function driveReorgLayout_() { return []; }',
    'function driveReorgEnsureFolders_() { return deps.ensure(); }',
    'function driveRestSend_(m, p, b) { return deps.send(m, p, b); }',
    'function rebuildLogDatabaseSchemaInternal_(ss) { deps.rebuild(ss); }',
    "var PropertiesService = { getScriptProperties: function() { return deps.props; } };",
    "var ScriptApp = { getScriptId: function() { return 'STAGING_ADMIN'; } };",
    "var SpreadsheetApp = { openById: function(id) { return { id: id }; } };",
    "var Session = { getActiveUser: function() { return { getEmail: function() { return 'o@example.org'; } }; }, getEffectiveUser: function() { return { getEmail: function() { return 'o@example.org'; } }; } };",
    "var console = { log: function() {} };",
    extractFunction('assertStagingOwnerOperator_'),
    "var STAGING_DB_NAME_ = 'DB'; var STAGING_LOG_NAME_ = 'LOG';",
    extractFunction('setupStagingStores_APPLY'),
    'return setupStagingStores_APPLY;',
  ].join('\n');
  return { run: new Function('deps', src)(deps) as () => string, calls, store };
}

test('ステージングの用意: 本番のプロジェクトでは何もしない（フォルダも見ない）', () => {
  const s = loadSetup({ production: true, props: {} });
  assert.throws(() => s.run(), /本番/);
  assert.deepEqual(s.calls, []);
});

test('ステージングの用意: 初回は DB とログを作り、自分のプロパティに書き、ログの表を作る', () => {
  const s = loadSetup({ production: false, props: {} });
  const r = JSON.parse(s.run());
  assert.equal(r.db.created, true);
  assert.equal(r.log.created, true);
  assert.ok(s.calls.includes('post DB') && s.calls.includes('post LOG'));
  assert.equal(s.store.DB_SPREADSHEET_ID_OVERRIDE, r.db.id);
  assert.equal(s.store.LOG_SPREADSHEET_ID, r.log.id);
  assert.equal(s.store.SCRIPT_ID_ADMIN, 'STAGING_ADMIN');
  assert.ok(s.calls.includes(`rebuildLog ${r.log.id}`));
});

test('ステージングの用意: 2 回目は作らない（設定済みの ID を使う）', () => {
  const s = loadSetup({ production: false, props: { DB_SPREADSHEET_ID_OVERRIDE: STAGING_DB, LOG_SPREADSHEET_ID: 'L1' } });
  const r = JSON.parse(s.run());
  assert.equal(r.db.created, false);
  assert.equal(r.log.created, false);
  assert.ok(!s.calls.some((c) => c.startsWith('post') || c.startsWith('rebuildLog')), s.calls.join(' / '));
});

test('ステージングの用意: 上書きが本番 DB を指していたら止める', () => {
  const s = loadSetup({ production: false, props: { DB_SPREADSHEET_ID_OVERRIDE: PROD_DB } });
  assert.throws(() => s.run(), /本番 DB/);
  assert.ok(!s.calls.some((c) => c.startsWith('post')));
});

// ── ステージングのテストデータ（docs/334 §10.8） ───────────────────────
function loadSeed(opts: { production: boolean; dbId?: string; existing?: string[] }) {
  const appended: Record<string, Array<Record<string, unknown>>> = {};
  const calls: string[] = [];
  const deps = {
    production: opts.production,
    dbId: opts.dbId || STAGING_DB,
    existing: (opts.existing || []).map((id) => ({ 会員ID: id })),
    append: (table: string, rows: Array<Record<string, unknown>>) => { appended[table] = (appended[table] || []).concat(rows); },
    call: (c: string) => calls.push(c),
  };
  const src = [
    `var PRODUCTION_DB_SPREADSHEET_ID_ = '${PROD_DB}';`,
    "var LEGACY_CODE_TO_INITIAL_ROLE_ID = { MASTER: 'ROLE_MASTER' };",
    'function isProductionScript_() { return deps.production; }',
    'function getOrCreateDatabase_() { deps.call("db"); return { getId: function() { return deps.dbId; } }; }',
    'function initializeSchema_() { deps.call("schema"); }',
    'function getRowsAsObjects_(ss, t) { return t === "T_会員" ? deps.existing : []; }',
    'function appendRowsByHeaders_(ss, t, rows) { deps.append(t, rows); }',
    'function clearAdminPermissionCaches_() { deps.call("clearAdmin"); }',
    'function clearAllDataCache_() { deps.call("clearAll"); }',
    "var Session = { getActiveUser: function() { return { getEmail: function() { return 'Owner@hcm-n.example'; } }; }, getEffectiveUser: function() { return { getEmail: function() { return 'owner@hcm-n.example'; } }; } };",
    "var console = { log: function() {} };",
    extractFunction('assertStagingOwnerOperator_'),
    extractFunction('stagingSeedRows_'),
    "var STAGING_SEED_MEMBER_IDS_ = ['99000001', '99000002', '99000003'];",
    extractFunction('seedStagingTestData_APPLY'),
    'return seedStagingTestData_APPLY;',
  ].join('\n');
  return { run: new Function('deps', src)(deps) as () => string, appended, calls };
}

test('テストデータ: 本番のプロジェクトでは DB を開きもしない', () => {
  const s = loadSeed({ production: true });
  assert.throws(() => s.run(), /本番/);
  assert.deepEqual(s.calls, []);
});

test('テストデータ: 本番 DB だったら何も入れない', () => {
  const s = loadSeed({ production: false, dbId: PROD_DB });
  assert.throws(() => s.run(), /本番 DB/);
  assert.deepEqual(s.appended, {});
});

test('テストデータ: 入れた覚えのない会員が 1 行でもあれば止める（消さない）', () => {
  const s = loadSeed({ production: false, existing: ['99000001', '12345678'] });
  assert.throws(() => s.run(), /入れていない行/);
  assert.deepEqual(s.appended, {});
});

test('テストデータ: 2 回目は何もしない', () => {
  const s = loadSeed({ production: false, existing: ['99000001', '99000002', '99000003'] });
  assert.equal(JSON.parse(s.run()).seeded, false);
  assert.deepEqual(s.appended, {});
});

test('テストデータ: 空の DB に入れる。実行者が MASTER、他は★＋@example.invalid', () => {
  const s = loadSeed({ production: false });
  assert.equal(JSON.parse(s.run()).seeded, true);
  const wl = s.appended['T_管理者Googleホワイトリスト'];
  assert.equal(wl.length, 1);
  assert.equal(wl[0].Googleメール, 'owner@hcm-n.example');
  assert.equal(wl[0].権限コード, 'MASTER');
  assert.equal(wl[0].ロールID, 'ROLE_MASTER');
  // 管理者の判定が通る鎖: 管理者リスト → 認証 → 会員
  const auth = s.appended['T_認証アカウント'].find((a) => a.認証ID === wl[0].紐付け認証ID);
  assert.ok(auth && auth.アカウント有効フラグ === true);
  assert.ok(s.appended['T_会員'].some((m) => m.会員ID === auth!.会員ID));
  for (const t of ['T_会員', 'T_事業所職員']) {
    for (const r of s.appended[t]) {
      const name = String(r.姓 || r.勤務先名 || '');
      assert.ok(name.startsWith('★'), `${t}: ★が無い ${name}`);
      for (const k of ['代表メールアドレス', 'メールアドレス']) {
        if (r[k]) assert.match(String(r[k]), /@example\.invalid$/, `${t}.${k}`);
      }
    }
  }
  assert.ok(s.calls.includes('schema') && s.calls.includes('clearAdmin'));
});
