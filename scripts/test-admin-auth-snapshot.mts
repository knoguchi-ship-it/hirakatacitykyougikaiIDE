/**
 * 2026-11-12 管理者認証の完成品 JSON（docs/328・TRD §1.4・§3.2・§3.2.1・RD §12）。
 *
 * 発覚した不具合: checkAdminBySession_ が紐付く 1 行のために会員全員分の T_認証アカウント（ハッシュ入り）を読み、
 * 丸ごとキャッシュしようとして上限 100 KB を超え、キャッシュが一度も効いていなかった。
 * 以前の検査はキャッシュの偽物が大きさを見なかったので気づけなかった。
 * → ここでは偽物を本物と同じ制限にする（キャッシュ 1 値 100 KB・プロパティ 1 値 9 KB で例外）。
 *
 * 実ソースから関数を切り出して実行する（ミラー禁止・AGENTS L3.1）。
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
    else if (gas[i] === '}') { depth -= 1; if (depth === 0) return gas.slice(start, i + 1); }
  }
  throw new Error(`${name} の終端が見つからない`);
}
const hasFunction = (name: string) => gas.includes(`function ${name}(`);
function extractVar(name: string): string {
  const start = gas.indexOf(`var ${name} =`);
  assert.notEqual(start, -1, `var ${name} が見つからない`);
  return gas.slice(start, gas.indexOf(';\n', start) + 1);
}

type Row = Record<string, unknown>;
const HASH_MARK = 'HASH-SECRET-';
const SALT_MARK = 'SALT-SECRET-';

/** 本物と同じく、読んだ範囲（シート・列）を記録する偽スプレッドシート */
function fakeSpreadsheet(tables: Record<string, Row[]>, headersOf: Record<string, string[]> = {}) {
  const fullReads: Record<string, number> = {};
  const columnReads: Record<string, Set<string>> = {};
  const matrices: Record<string, unknown[][]> = {};
  const sheets = Object.keys(tables).map((name) => {
    const rows = tables[name];
    const headers = headersOf[name] || (rows.length ? Object.keys(rows[0]) : ['id']);
    const matrix = () => [headers, ...rows.map((r) => headers.map((h) => (r[h] === undefined ? '' : r[h])))];
    matrices[name] = matrix();
    const noteCols = (c: number, nc: number) => {
      columnReads[name] = columnReads[name] || new Set();
      for (let k = c; k < c + nc; k += 1) columnReads[name].add(headers[k - 1]);
    };
    return {
      getName: () => name,
      getLastRow: () => rows.length + 1,
      getLastColumn: () => headers.length,
      getDataRange: () => ({ getValues: () => { fullReads[name] = (fullReads[name] || 0) + 1; noteCols(1, headers.length); return matrix(); } }),
      getRange: (r: number, c: number, nr = 1, nc = 1) => ({
        getValues: () => {
          // 見出し行（列名）だけの読みは値を読んでいないので数えない
          if (r + nr - 1 >= 2) noteCols(c, nc);
          const m = matrix();
          return m.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc));
        },
      }),
    };
  });
  return {
    fullReads, columnReads, tables,
    getId: () => 'DB-ID',
    getSheets: () => sheets,
    getSheetByName: (n: string) => sheets.find((s) => s.getName() === n) || null,
    touched: () => Object.keys(fullReads).length + Object.keys(columnReads).length,
    resetReads: () => { for (const k of Object.keys(fullReads)) delete fullReads[k]; for (const k of Object.keys(columnReads)) delete columnReads[k]; },
  };
}

/** 本物の CacheService と同じく 1 値 100 KB を超えると例外 */
function fakeCache() {
  const store = new Map<string, string>();
  return {
    store,
    get: (k: string) => (store.has(k) ? store.get(k)! : null),
    put: (k: string, v: string) => {
      if (Buffer.byteLength(String(v), 'utf8') > 100 * 1024) throw new Error('Argument too large: value');
      store.set(k, String(v));
    },
    remove: (k: string) => { store.delete(k); },
    getAll: (keys: string[]) => Object.fromEntries(keys.filter((k) => store.has(k)).map((k) => [k, store.get(k)])),
  };
}

/** 本物のスクリプトプロパティと同じく 1 値 9 KB を超えると例外 */
function fakeProps() {
  const store = new Map<string, string>();
  let failWrites = false;
  return {
    store,
    setFailWrites: (v: boolean) => { failWrites = v; },
    getProperty: (k: string) => (store.has(k) ? store.get(k)! : null),
    setProperty: (k: string, v: string) => {
      if (failWrites) throw new Error('一時的な失敗');
      if (Buffer.byteLength(String(v), 'utf8') > 9 * 1024) throw new Error('値が大きすぎます');
      store.set(k, String(v));
    },
    deleteProperty: (k: string) => { store.delete(k); },
  };
}

function baseTables(opts: { asStaff?: boolean; manyAuthRows?: number } = {}) {
  const many = opts.manyAuthRows ?? 400;
  const authRows: Row[] = [];
  for (let i = 0; i < many; i += 1) {
    authRows.push({ 認証ID: 'AUTH-M' + i, 認証方式: 'PASSWORD', ログインID: 'login' + i,
      パスワードハッシュ: HASH_MARK + 'x'.repeat(90) + i, パスワードソルト: SALT_MARK + 'y'.repeat(30) + i,
      GoogleユーザーID: '', Googleメール: '', システムロールコード: 'MEMBER', 会員ID: 'MM' + i, 職員ID: '',
      最終ログイン日時: '2026-11-01T00:00:00.000Z', パスワード更新日時: '2026-11-01T00:00:00.000Z', アカウント有効フラグ: true,
      ログイン失敗回数: 0, ロック状態: false, ロック解除予定日時: '', 作成日時: '2026-04-01T00:00:00.000Z', 更新日時: '2026-11-01T00:00:00.000Z', 削除フラグ: false });
  }
  const adminAuth = (id: string, memberId: string, staffId = '', deleted = false): Row => ({
    認証ID: id, 認証方式: 'PASSWORD', ログインID: id, パスワードハッシュ: HASH_MARK + id, パスワードソルト: SALT_MARK + id,
    GoogleユーザーID: '', Googleメール: '', システムロールコード: 'ADMIN', 会員ID: memberId, 職員ID: staffId,
    最終ログイン日時: '', パスワード更新日時: '', アカウント有効フラグ: true, ログイン失敗回数: 0, ロック状態: false,
    ロック解除予定日時: '', 作成日時: '', 更新日時: '', 削除フラグ: deleted });
  authRows.splice(17, 0, adminAuth('AUTH-1', 'M1', opts.asStaff ? 'S1' : ''));
  authRows.splice(203, 0, adminAuth('AUTH-2', 'M2'));
  authRows.push(adminAuth('AUTH-NM', ''));
  authRows.push(adminAuth('AUTH-DEL', 'M9', '', true));
  return {
    T_管理者Googleホワイトリスト: [
      { ホワイトリストID: 'WL-1', Googleメール: 'Admin@Example.org', 紐付け認証ID: 'AUTH-1', 紐付け会員ID: 'M1', 権限コード: 'MASTER', ロールID: '', 有効フラグ: true, 削除フラグ: false },
      { ホワイトリストID: 'WL-2', Googleメール: 'admin2@example.org', 紐付け認証ID: 'AUTH-2', 紐付け会員ID: '', 権限コード: '', ロールID: '', 有効フラグ: true, 削除フラグ: false },
      { ホワイトリストID: 'WL-3', Googleメール: 'general@example.org', 紐付け認証ID: 'AUTH-2', 紐付け会員ID: '', 権限コード: 'GENERAL', ロールID: '', 有効フラグ: true, 削除フラグ: false },
      { ホワイトリストID: 'WL-4', Googleメール: 'nolink@example.org', 紐付け認証ID: 'AUTH-DEL', 紐付け会員ID: 'M9', 権限コード: 'ADMIN', ロールID: '', 有効フラグ: true, 削除フラグ: false },
      { ホワイトリストID: 'WL-5', Googleメール: 'nomember@example.org', 紐付け認証ID: 'AUTH-NM', 紐付け会員ID: '', 権限コード: 'ADMIN', ロールID: '', 有効フラグ: true, 削除フラグ: false },
      { ホワイトリストID: 'WL-6', Googleメール: 'disabled@example.org', 紐付け認証ID: 'AUTH-2', 紐付け会員ID: '', 権限コード: 'ADMIN', ロールID: '', 有効フラグ: false, 削除フラグ: false },
      { ホワイトリストID: 'WL-7', Googleメール: 'admin@example.org', 紐付け認証ID: 'AUTH-2', 紐付け会員ID: '', 権限コード: 'ADMIN', ロールID: '', 有効フラグ: true, 削除フラグ: false },
    ] as Row[],
    T_認証アカウント: authRows,
    T_会員: opts.asStaff
      ? [{ 会員ID: 'M1', 姓: '', 名: '', 削除フラグ: false }, { 会員ID: 'M2', 姓: '鈴木', 名: '一郎', 削除フラグ: false }]
      : [{ 会員ID: 'M1', 姓: '山田', 名: '花子', 削除フラグ: false }, { 会員ID: 'M2', 姓: '鈴木', 名: '一郎', 削除フラグ: false }],
    T_事業所職員: [
      { 職員ID: 'S0', 会員ID: 'M1', 姓: '削除', 名: '済み', 氏名: '', 削除フラグ: true },
      { 職員ID: 'S1', 会員ID: 'M1', 姓: '野口', 名: '健太', 氏名: '', 削除フラグ: false },
    ] as Row[],
  };
}

type Session = { loginId: string; memberId: string; staffId: string; roleCode: string; adminPermissionLevel: string;
  isMaster: boolean; displayName: string; personName: string };

function buildServer(opts: { email: string; asStaff?: boolean; preview?: unknown } = { email: 'admin@example.org' }) {
  const ss = fakeSpreadsheet(baseTables({ asStaff: opts.asStaff }));
  const cache = fakeCache();
  const props = fakeProps();
  const clock = { t: Date.UTC(2026, 10, 12, 3, 0, 0) };
  const drive = { modifiedMs: clock.t - 60_000, fail: false, calls: 0 };
  const history: Array<{ authId: string; result: string; reason: string }> = [];
  const user = { email: opts.email };
  const RealDate = Date;
  function FakeDate(this: unknown, ...a: unknown[]) { return a.length ? new (RealDate as any)(...a) : new RealDate(clock.t); }
  (FakeDate as any).now = () => clock.t;
  (FakeDate as any).UTC = RealDate.UTC;
  const optional = (names: string[]) => names.filter(hasFunction).map(extractFunction).join('\n');
  const optionalVars = (names: string[]) => names.filter((n) => gas.includes(`var ${n} =`)).map(extractVar).join('\n');
  const factory = new Function('deps', `
    var Session = deps.Session, CacheService = deps.CacheService, PropertiesService = deps.PropertiesService, DriveApp = deps.DriveApp;
    var Date = deps.Date;
    var Logger = { log: function() {} }, console = { log: function() {}, warn: function() {} };
    var MENU_REGISTRY = [{ id: 'dashboard' }], LEGACY_ROLE_TO_MENUS = { ADMIN: ['dashboard'] }, LEGACY_ROLE_TRAINING_SCOPE = {};
    var _previewAdminSession = deps.preview || null;
    var _apiProfile = null;
    ${extractFunction('apiProfileMark_')}
    function getOrCreateDatabase_() { return deps.ss; }
    function getRowsAsObjects_(ss, name) { return getRowsAsObjectsFromSheet_(ss.getSheetByName(name)); }
    ${extractFunction('getRowsAsObjectsFromSheet_')}
    ${extractFunction('toBoolean_')}
    ${extractFunction('joinHumanNameParts_')}
    function getChunkedCache_() { return null; }
    function getAllDataCacheKey_() { return 'fetchAllData:test'; }
    function masterLabel_(ss, master, c) { return c; }
    function getRoleByIdCached_() { return null; }
    function appendLoginHistory_(ss, authId, loginId, method, result, reason) { deps.history.push({ authId: authId, result: result, reason: reason }); }
    ${optionalVars(['ADMIN_AUTH_SNAPSHOT_KEY_', 'ADMIN_AUTH_SNAPSHOT_OK_CACHE_KEY_', 'ADMIN_AUTH_SNAPSHOT_MAX_AGE_MS_', 'ADMIN_AUTH_SNAPSHOT_CHECK_TTL_SECONDS_', 'ADMIN_AUTH_SNAPSHOT_MAX_CHARS_', 'ADMIN_AUTH_SNAPSHOT_AUTH_COLUMNS_'])}
    ${optional(['getDbLastModifiedMs_', 'pickColumn_', 'readSheetColumnsByName_', 'readAdminAuthLinkedRows_', 'buildAdminAuthSnapshot_', 'getAdminAuthSnapshot_', 'clearAdminPermissionCaches_'])}
    ${extractFunction('checkAdminBySession_')}
    return { check: checkAdminBySession_, clear: typeof clearAdminPermissionCaches_ === 'function' ? clearAdminPermissionCaches_ : null };
  `);
  const srv = factory({
    ss, history, preview: opts.preview, Date: FakeDate,
    Session: { getActiveUser: () => ({ getEmail: () => user.email }) },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => props },
    DriveApp: { getFileById: () => ({ getLastUpdated: () => { drive.calls += 1; if (drive.fail) throw new Error('drive down'); return new RealDate(drive.modifiedMs); } }) },
  }) as { check: (o?: { recordLogin?: boolean }) => Session; clear: (() => void) | null };
  return { srv, ss, cache, props, clock, drive, history, user };
}

const snapshotText = (props: ReturnType<typeof fakeProps>) => [...props.store.values()].join('\n');

test('T1: 2 回目以降（30 秒以内）はどのシートも読まない', () => {
  const { srv, ss } = buildServer({ email: 'admin@example.org' });
  srv.check();
  ss.resetReads();
  const s = srv.check();
  assert.equal(s.loginId, 'admin@example.org');
  assert.equal(ss.touched(), 0, `2 回目に読んだ: ${JSON.stringify({ full: ss.fullReads, cols: Object.keys(ss.columnReads) })}`);
});

test('T2: パスワードハッシュ・ソルトは読まない・どこにも置かない', () => {
  const { srv, ss, props, cache } = buildServer({ email: 'admin@example.org' });
  srv.check();
  const authCols = ss.columnReads['T_認証アカウント'] || new Set();
  assert.equal(authCols.has('パスワードハッシュ'), false, 'ハッシュの列を読んだ');
  assert.equal(authCols.has('パスワードソルト'), false, 'ソルトの列を読んだ');
  assert.equal(ss.fullReads['T_認証アカウント'] || 0, 0, '認証の表を全列読んだ');
  const stored = snapshotText(props) + [...cache.store.values()].join('\n');
  assert.equal(stored.includes(HASH_MARK) || stored.includes(SALT_MARK), false, 'ハッシュ・ソルトが保存された');
});

test('T3: DB の最終更新日時が新しくなったら作り直し、外した管理者は拒否される', () => {
  const { srv, ss, clock, drive, cache, history } = buildServer({ email: 'admin2@example.org' });
  assert.equal(srv.check().memberId, 'M2');
  // シートを直接編集して admin2 を外した（管理画面を通らない）
  ss.tables.T_管理者Googleホワイトリスト[1].削除フラグ = true;
  clock.t += 10_000;
  assert.equal(srv.check().memberId, 'M2', '30 秒以内の確認済みはそのまま（反映の約束は 30 秒＋Drive の遅れ）');
  clock.t += 25_000;
  cache.remove('admin_auth_snap_ok_v1');
  drive.modifiedMs = clock.t - 1_000;
  assert.throws(() => srv.check(), /管理者権限がありません/);
  assert.equal(history.at(-1)?.reason, 'ホワイトリスト未登録（セッション認証）');
});

test('T4: 作ってから 5 分を超えたら、最終更新日時が古くても作り直す', () => {
  const { srv, ss, clock } = buildServer({ email: 'admin@example.org' });
  srv.check();
  ss.tables.T_管理者Googleホワイトリスト[0].権限コード = 'ADMIN';
  clock.t += 5 * 60_000 + 1;
  ss.resetReads();
  const s = srv.check();
  assert.equal(s.adminPermissionLevel, 'ADMIN');
  assert.ok((ss.columnReads['T_認証アカウント'] || new Set()).size > 0, 'シートから作り直した');
});

test('T5: プロパティが無い・壊れている・最終更新日時が読めない → シートから作って正しく答える', () => {
  const a = buildServer({ email: 'admin@example.org' });
  a.srv.check();
  a.props.store.set('ADMIN_AUTH_SNAPSHOT_V1', '{壊れた');
  a.cache.store.clear();
  assert.equal(a.srv.check().memberId, 'M1');
  const b = buildServer({ email: 'admin@example.org' });
  b.srv.check();
  b.cache.store.clear();
  b.drive.fail = true;
  b.ss.resetReads();
  assert.equal(b.srv.check().memberId, 'M1');
  assert.ok(b.ss.touched() > 0, '最終更新日時が読めないときは正本で作り直す');
});

test('T6: ホワイトリスト外・GENERAL・紐付け無し・会員ID無し・無効 → 今と同じ文言で拒否し失敗を記録', () => {
  const cases: Array<[string, RegExp, string]> = [
    ['intruder@example.org', /管理者権限がありません/, 'ホワイトリスト未登録（セッション認証）'],
    ['general@example.org', /管理者権限が無効です/, '一般権限のため管理者ログイン不可'],
    ['nolink@example.org', /管理者の認証紐付けが未設定です/, '紐付け認証ID未整備（セッション認証）'],
    ['nomember@example.org', /管理者に会員IDが紐付いていません/, '会員ID未紐付け（セッション認証）'],
    ['disabled@example.org', /管理者権限がありません/, 'ホワイトリスト未登録（セッション認証）'],
  ];
  for (const [email, err, reason] of cases) {
    const { srv, history } = buildServer({ email });
    assert.throws(() => srv.check(), err, email);
    assert.deepEqual(history.map((h) => [h.result, h.reason]), [['FAILURE', reason]], email);
  }
});

test('T6b: 同じメールが複数あるときはシートの上の行（今と同じ「最初に一致」）・大文字小文字は区別しない', () => {
  const { srv } = buildServer({ email: 'ADMIN@example.org' });
  const s = srv.check();
  assert.equal(s.adminPermissionLevel, 'MASTER');
  assert.equal(s.loginId, 'admin@example.org');
});

test('T7: ログイン操作（recordLogin）の成功は 1 行・管理 API の認可では書かない', () => {
  const { srv, history } = buildServer({ email: 'admin@example.org' });
  srv.check();
  assert.equal(history.length, 0);
  srv.check({ recordLogin: true });
  assert.deepEqual(history.map((h) => [h.result, h.authId]), [['SUCCESS', 'AUTH-1']]);
});

test('T8: 表示名は職員の行 → 会員の行の順（権限名を含まない personName）', () => {
  const staff = buildServer({ email: 'admin@example.org', asStaff: true }).srv.check();
  assert.equal(staff.displayName, '野口 健太（MASTER）');
  assert.equal(staff.personName, '野口 健太');
  const member = buildServer({ email: 'admin@example.org' }).srv.check();
  assert.equal(member.displayName, '山田 花子（MASTER）');
  const viaWhitelistMember = buildServer({ email: 'admin2@example.org' }).srv.check();
  assert.equal(viaWhitelistMember.adminPermissionLevel, 'ADMIN', '権限コードが空なら ADMIN');
  assert.equal(viaWhitelistMember.personName, '鈴木 一郎');
});

test('T9: 管理画面の保存（clearAdminPermissionCaches_）で完成品が消え、次の要求で作り直す', () => {
  const { srv, props, ss } = buildServer({ email: 'admin@example.org' });
  srv.check();
  assert.ok(props.store.has('ADMIN_AUTH_SNAPSHOT_V1'), '完成品を保存した');
  assert.ok(srv.clear, 'clearAdminPermissionCaches_ がある');
  srv.clear!();
  assert.equal(props.store.has('ADMIN_AUTH_SNAPSHOT_V1'), false);
  ss.resetReads();
  srv.check();
  assert.ok(ss.touched() > 0);
});

test('T10: 保存できない（大きすぎ・一時的な失敗）ときも、作った中身で正しく答える', () => {
  const { srv, props } = buildServer({ email: 'admin@example.org' });
  props.setFailWrites(true);
  assert.equal(srv.check().memberId, 'M1');
  assert.equal(props.store.size, 0);
  assert.match(extractVar('ADMIN_AUTH_SNAPSHOT_MAX_CHARS_'), /8000/);
});

test('T11: ロール視点プレビュー中は完成品にもシートにも触れない（ログイン操作は除く）', () => {
  const preview = { loginId: 'admin@example.org', roleId: 'R-X', isPreview: true };
  const { srv, ss, props } = buildServer({ email: 'admin@example.org', preview });
  assert.equal(srv.check(), preview);
  assert.equal(ss.touched(), 0);
  assert.equal(props.store.size, 0);
});

test('配置: 新しい関数は管理 split にだけ入る（公開・会員の生成物に無い）', () => {
  for (const file of ['backend/Code.gs', 'gas/member/Code.gs']) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.equal(src.includes('function getAdminAuthSnapshot_('), false, `${file} に getAdminAuthSnapshot_ がある`);
  }
  assert.ok(fs.readFileSync(path.join(ROOT, 'gas/admin/Code.gs'), 'utf8').includes('function getAdminAuthSnapshot_('));
});
