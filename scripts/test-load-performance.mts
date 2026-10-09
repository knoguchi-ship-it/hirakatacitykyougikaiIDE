/**
 * 2026-10-09 回帰テスト: 読み込み遅延の是正（docs/301）。
 *
 * 実測で、Apps Script の呼び出し 1 回あたり約 2 秒の固定費の上に、実装側の無駄が乗っていた。
 * 戻ると体感がそのまま悪化するもの 4 点を、実ソースから関数を切り出して実行して確かめる。
 *   1. 管理 API の認可のたびにログイン履歴へ書き込まない（成功の記録はログイン操作だけ）
 *   2. 失敗は経路を問わず必ず記録する（不正アクセスの痕跡を消さない）
 *   3. 表示名のために毎回 T_会員 を全件読まない
 *   4. ダッシュボード・会員マイページの取得で、同じシートを 2 回読まない
 * あわせて、フロントの配線（heic2any を静的 import しない・会員/管理の分岐）を確認する。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

/** 実ソースから関数定義を切り出す（ミラー実装を書かない・AGENTS.md L3） */
function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  let i = gas.indexOf('{', start);
  for (; i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

type Row = Record<string, unknown>;

/** シート名 → 行。getDataRange().getValues() の回数をシートごとに数える偽スプレッドシート */
function fakeSpreadsheet(tables: Record<string, Row[]>) {
  const reads: Record<string, number> = {};
  const sheets = Object.keys(tables).map((name) => {
    const rows = tables[name];
    const headers = rows.length ? Object.keys(rows[0]) : ['id'];
    return {
      getName: () => name,
      getDataRange: () => ({
        getValues: () => {
          reads[name] = (reads[name] || 0) + 1;
          return [headers, ...rows.map((r) => headers.map((h) => r[h]))];
        },
      }),
    };
  });
  return {
    reads,
    getSheets: () => sheets,
    getSheetByName: (n: string) => sheets.find((s) => s.getName() === n) || null,
  };
}

function fakeCache() {
  const store = new Map<string, string>();
  return {
    store,
    get: (k: string) => (store.has(k) ? store.get(k)! : null),
    put: (k: string, v: string) => { store.set(k, v); },
    getAll: (keys: string[]) => Object.fromEntries(keys.filter((k) => store.has(k)).map((k) => [k, store.get(k)])),
  };
}

// ── 1〜3: checkAdminBySession_ ───────────────────────────────
function buildAdminSession(opts: { email: string }) {
  const ss = fakeSpreadsheet({
    T_管理者Googleホワイトリスト: [
      { Googleメール: 'admin@example.org', 権限コード: 'MASTER', 紐付け認証ID: 'AUTH-1', 紐付け会員ID: 'M1', ロールID: '', 有効フラグ: true, 削除フラグ: false },
    ],
    T_認証アカウント: [
      { 認証ID: 'AUTH-1', 会員ID: 'M1', 職員ID: '', システムロールコード: 'ADMIN', 削除フラグ: false },
    ],
    T_会員: [{ 会員ID: 'M1', 姓: '山田', 名: '花子', 削除フラグ: false }],
  });
  const cache = fakeCache();
  const history: Array<{ result: string; reason: string }> = [];
  const factory = new Function('deps', `
    var Session = deps.Session, CacheService = deps.CacheService;
    var MENU_REGISTRY = [{ id: 'dashboard' }], LEGACY_ROLE_TO_MENUS = {}, LEGACY_ROLE_TRAINING_SCOPE = {};
    function getOrCreateDatabase_() { return deps.ss; }
    function getRowsAsObjects_(ss, name) { return ${'getRowsAsObjectsFromSheet_'}(ss.getSheetByName(name)); }
    ${extractFunction('getRowsAsObjectsFromSheet_')}
    ${extractFunction('toBoolean_')}
    function getChunkedCache_() { return null; }
    function getAllDataCacheKey_() { return 'fetchAllData:test'; }
    function mapAdminPermissionLabel_(c) { return c; }
    function getRoleByIdCached_() { return null; }
    function appendLoginHistory_(ss, authId, loginId, method, result, reason) { deps.history.push({ result: result, reason: reason }); }
    ${extractFunction('checkAdminBySession_')}
    return checkAdminBySession_;
  `);
  const fn = factory({
    ss, history,
    Session: { getActiveUser: () => ({ getEmail: () => opts.email }) },
    CacheService: { getScriptCache: () => cache },
  }) as (o?: { recordLogin?: boolean }) => { displayName: string; isMaster: boolean };
  return { fn, ss, history };
}

test('管理 API の認可（recordLogin なし）では成功をログイン履歴へ書かない', () => {
  const { fn, history } = buildAdminSession({ email: 'admin@example.org' });
  const session = fn();
  assert.equal(session.isMaster, true);
  assert.equal(history.length, 0);
});

test('ログイン操作（recordLogin: true）では成功を 1 行だけ書く', () => {
  const { fn, history } = buildAdminSession({ email: 'admin@example.org' });
  fn({ recordLogin: true });
  assert.deepEqual(history.map((h) => h.result), ['SUCCESS']);
});

test('ホワイトリスト外は recordLogin が無くても失敗を記録して拒否する', () => {
  const { fn, history } = buildAdminSession({ email: 'intruder@example.org' });
  assert.throws(() => fn(), /管理者権限がありません/);
  assert.deepEqual(history.map((h) => h.result), ['FAILURE']);
});

test('表示名はキャッシュし、2 回目以降は T_会員 を読まない', () => {
  const { fn, ss } = buildAdminSession({ email: 'admin@example.org' });
  const first = fn();
  const second = fn();
  assert.match(first.displayName, /山田 花子/);
  assert.equal(second.displayName, first.displayName);
  assert.equal(ss.reads['T_会員'], 1);
});

// ── 4: 同じシートを 2 回読まない ─────────────────────────────
const READ_HELPERS = `
  ${extractFunction('getRowsAsObjectsFromSheet_')}
  ${extractFunction('buildSheetLookup_')}
  ${extractFunction('getRowsAsObjectsBatch_')}
  ${extractFunction('buildTrainingApplicationRelationContextFromRows_')}
  ${extractFunction('buildTrainingApplicationRelationContext_')}
  ${extractFunction('getTrainingApplicationRows_')}
  ${extractFunction('toBoolean_')}
  function getRowsAsObjects_(ss, name) { return getRowsAsObjectsFromSheet_(ss.getSheetByName(name)); }
  function getOrCreateDatabase_() { return deps.ss; }
  function initializeSchemaIfNeeded_() {}
  function isTrainingApplicationRowValid_() { return true; }
  function getMemberIdFromApplication_(row) { return String(row['会員ID'] || ''); }
`;

function sampleTables(): Record<string, Row[]> {
  return {
    T_認証アカウント: [{ 認証ID: 'A1', ログインID: 'L1', 会員ID: 'M1', 職員ID: '', 認証方式: 'PASSWORD', アカウント有効フラグ: true, 削除フラグ: false }],
    T_会員: [{ 会員ID: 'M1', 姓: '山田', 名: '花子', 削除フラグ: false }],
    T_事業所職員: [{ 職員ID: 'S1', 会員ID: 'M1', 職員状態コード: 'ENROLLED', 削除フラグ: false }],
    T_研修: [{ 研修ID: 'T1', 開催日: '2026-10-01', 削除フラグ: false }],
    T_研修申込: [{ 申込ID: 'P1', 研修ID: 'T1', 会員ID: 'M1', 申込状態コード: 'APPLIED', 削除フラグ: false }],
    T_年会費納入履歴: [{ 会員ID: 'M1', 対象年度: 2026, 会費納入状態コード: 'PAID', 削除フラグ: false }],
    T_外部申込者: [{ 外部申込者ID: 'E1', 削除フラグ: false }],
  };
}

test('会員マイページの取得は各シートを 1 回ずつしか読まない', () => {
  const ss = fakeSpreadsheet(sampleTables());
  const fn = new Function('deps', `
    ${READ_HELPERS}
    function computeTrainingAvailability_() { return { lifecycleStatus: 'PUBLISHED', isApplicationOpen: true }; }
    function getAnnualFeeAmountMap_() { return {}; }
    function mapMembersForApi_(ss, members) { return members; }
    function mapTrainingRowsForApi_(rows) { return rows; }
    ${extractFunction('getMemberPortalData_')}
    return getMemberPortalData_;
  `)({ ss }) as (p: { loginId: string }) => { members: Row[]; trainings: Row[]; resolvedMemberId: string };
  const result = fn({ loginId: 'L1' });
  assert.equal(result.resolvedMemberId, 'M1');
  assert.equal(result.members.length, 1);
  assert.equal(result.trainings.length, 1);
  for (const [sheet, n] of Object.entries(ss.reads)) {
    assert.equal(n, 1, `${sheet} を ${n} 回読んでいる`);
  }
});

test('管理ダッシュボードの集計は各シートを 1 回ずつしか読まない', () => {
  const ss = fakeSpreadsheet(sampleTables());
  const cache = fakeCache();
  const fn = new Function('deps', `
    var CacheService = { getScriptCache: function() { return deps.cache; } };
    var ALL_DATA_CACHE_TTL_SECONDS = 600;
    ${READ_HELPERS}
    ${extractFunction('getAdminDashboardCacheKey_')}
    var DB_SCHEMA_VERSION = 'test';
    function getChunkedCache_() { return null; }
    function putChunkedCache_() {}
    ${extractFunction('getCurrentFiscalYear_')}
    function getAnnualFeeAmountMap_() { return {}; }
    // 読み込み回数に関係しない整形系は素通しのスタブでよい
    function normalizeStaffNameFields_(row) { return row; }
    function normalizeDateInput_(v) { return String(v || ''); }
    function buildAnnualFeeDisplayName_(row) { return String(row['姓'] || ''); }
    function formatDateForApi_(v) { return String(v || ''); }
    function computeTrainingAvailability_() { return { lifecycleStatus: 'PUBLISHED', isApplicationOpen: true }; }
    ${extractFunction('getAdminDashboardData_')}
    return getAdminDashboardData_;
  `)({ ss, cache }) as () => { staffRows: Row[] };
  let result: { staffRows: Row[] };
  try {
    result = fn();
  } catch (e) {
    // 集計の後半で使う補助関数が増えたら、ここで名前が出る。スタブを足すこと。
    throw new Error(`getAdminDashboardData_ の実行に失敗: ${(e as Error).message}`);
  }
  assert.ok(Array.isArray(result.staffRows));
  for (const [sheet, n] of Object.entries(ss.reads)) {
    assert.equal(n, 1, `${sheet} を ${n} 回読んでいる`);
  }
});

// ── フロントの配線（配置の確認なので文字列照合でよい） ───────────────
test('heic2any を静的 import しない（読み込むだけで 1.3MB の Worker が起動する）', () => {
  const src = fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }) as string[];
  const offenders = src
    .filter((f) => /\.(tsx?|mts)$/.test(f))
    .filter((f) => /from\s+['"]heic2any['"]|import\(\s*['"]heic2any['"]\s*\)/.test(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')));
  assert.deepEqual(offenders, [], 'heic2any は src/lib/heic2anyLoader.ts 経由でのみ使う');
});

test('会員 split は管理画面へ、管理 split は会員マイページへ分岐しない（ビルド時定数で閉じる）', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');
  assert.match(app, /if \(import\.meta\.env\.VITE_APP === 'member'\) \{\s*return renderMemberView\(\);/);
  assert.match(app, /const renderMemberView = \(\) => \{\s*(\/\/[^\n]*\n\s*)*if \(import\.meta\.env\.VITE_APP === 'admin'\)/);
});
