// docs/317 E: 会員・職員移行の隔離 E2E ツール（e2eMemberConversionIsolated_APPLY）を、本番に出す前にローカルで丸ごと動かす。
// 実ソースから、ツールとそこから呼ばれる関数（本物の移行・本物の要求組み立て）をすべて取り出し、
// 偽のスプレッドシート・偽の Drive・偽の Sheets API の上で 1 回目・2 回目を実行する。
// 偽の環境は実測（docs/317 §9.1）に合わせる:
//   - API で書いた内容は、同じ Spreadsheet オブジェクトの SpreadsheetApp からは見えない（P0）。開き直せば見える
//   - setValues は、書式なしテキストでない列の yyyy-MM-dd を日付に、数字だけを数値にする
//   - batchUpdate は全部か無しか（P2）
// 確かめること: 正しい実装なら全シナリオ合格。わざと壊した実装（参照の付け替えすぎ・日付の型・往復の使い直し・
// 途中まで反映する API）なら、該当するシナリオが不合格になる＝実環境の「合格」が証拠になっている。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const SOURCE = fs.readFileSync(new URL('../gas-src/Code.full.gs', import.meta.url), 'utf8');

// ── ソースから取り出す ────────────────────────────────────────────────
// 文字列とコメントを飛ばして括弧の対応を取る
function matchClose(src, open) {
  const pairs = { '{': '}', '[': ']', '(': ')' };
  const stack = [];
  for (let i = open; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      for (i += 1; i < src.length && src[i] !== ch; i += 1) if (src[i] === '\\') i += 1;
      continue;
    }
    if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (ch === '}' || ch === ']' || ch === ')') {
      if (stack.pop() !== ch) throw new Error(`括弧の対応が取れない: ${src.slice(open, open + 80)}`);
      if (stack.length === 0) return i;
    }
  }
  throw new Error('括弧が閉じない');
}
function functionDefs(src) {
  const defs = new Map();
  const re = /^function ([\p{L}\p{N}_$]+)\(/gmu;
  let m;
  // トップレベルの関数は 0 桁目の } で閉じる（括弧を数えると、別の関数の正規表現リテラルで崩れる）
  while ((m = re.exec(src))) {
    const end = src.indexOf('\n}', m.index);
    defs.set(m[1], src.slice(m.index, end + 2));
  }
  return defs;
}
// head から始まる文（最初の { か [ の対応まで）
function statement(src, head) {
  const start = src.indexOf(head);
  assert.ok(start >= 0, `${head} が見つからない`);
  let i = start + head.length;
  while (src[i] !== '{' && src[i] !== '[') i += 1;
  return src.slice(start, matchClose(src, i) + 1) + ';';
}
function closure(defs, roots) {
  const out = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.pop();
    if (out.has(name) || !defs.has(name)) continue;
    out.add(name);
    for (const id of defs.get(name).match(/[\p{L}\p{N}_$]+/gu) || []) if (defs.has(id) && !out.has(id)) queue.push(id);
  }
  return [...out];
}
function globalsSource(src) {
  const parts = [statement(src, 'var テーブル定義 = ')];
  const addRe = /^テーブル定義\['[^']+'\] = /gm;
  let m;
  while ((m = addRe.exec(src))) parts.push(statement(src.slice(m.index), m[0]));
  for (const head of ['var TEXT_FORMAT_COLUMNS_ = ', 'var MEMBER_CONVERSION_REQUIRED_COLUMNS_ = ', 'var OFFICER_PERSON_TABLES_ = ',
    'var MEMBER_CONVERSION_E2E_TABLES_ = ', 'var MEMBER_CONVERSION_E2E_REF_ID_HEADERS_ = ']) parts.push(statement(src, head));
  for (const line of ["var SHEETS_PROBE_FILE_PREFIX_ = ", "var MEMBER_CONVERSION_E2E_PENDING_KEY_ = "]) {
    const i = src.indexOf(line);
    assert.ok(i >= 0, line);
    parts.push(src.slice(i, src.indexOf('\n', i)));
  }
  parts.push('var MASTER_OPTIONS_MEMO_ = null;');
  return parts.join('\n');
}

// ── 偽のスプレッドシート ─────────────────────────────────────────────
const isDateString = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isNumberString = (v) => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) && v.length <= 15;
const serialToDate = (n) => new Date(Math.round((n - 25569) * 86400000));
const cloneCell = (x) => ({ ...x, v: x.v instanceof Date ? new Date(x.v.getTime()) : x.v });
const cloneGrid = (g) => g.map((row) => (row || []).map((x) => (x ? cloneCell(x) : x)));

function fakeWorld({ atomic = true } = {}) {
  const files = new Map();
  let fileSeq = 0;
  let sheetSeq = 0;
  const newFileSheet = (name) => ({ name, sheetId: ++sheetSeq, truth: [] });
  const lastRowOf = (g) => { for (let r = g.length - 1; r >= 0; r -= 1) if ((g[r] || []).some((x) => x && (x.v !== '' || x.f))) return r + 1; return 0; };
  const lastColOf = (g) => Math.max(0, ...g.map((row) => { for (let c = (row || []).length - 1; c >= 0; c -= 1) if (row[c] && (row[c].v !== '' || row[c].f)) return c + 1; return 0; }));
  const at = (g, r, c) => { while (g.length <= r) g.push([]); if (!g[r][c]) g[r][c] = { v: '', fmt: '', dv: null, f: '' }; return g[r][c]; };
  // SpreadsheetApp の setValues と同じ変換
  const userEntered = (x, value) => {
    if (x.fmt === '@') return value instanceof Date ? value : String(value ?? '');
    if (isDateString(value)) return new Date(`${value}T00:00:00Z`);
    if (isNumberString(value)) return Number(value);
    return value ?? '';
  };

  // Spreadsheet オブジェクト: 開いた時点の内容（view）を持ち、SpreadsheetApp の書込みは view と本物の両方へ
  function openSpreadsheet(file) {
    const views = new Map(file.sheets.map((s) => [s.sheetId, cloneGrid(s.truth)]));
    const wrap = (fs_) => {
      if (!views.has(fs_.sheetId)) views.set(fs_.sheetId, cloneGrid(fs_.truth));
      const view = () => views.get(fs_.sheetId);
      const both = (r, c, fn) => { fn(at(fs_.truth, r, c)); fn(at(view(), r, c)); };
      const sheet = {
        getName: () => fs_.name,
        setName: (n) => { fs_.name = n; },
        getSheetId: () => fs_.sheetId,
        getLastRow: () => lastRowOf(view()),
        getLastColumn: () => lastColOf(view()),
        getMaxRows: () => Math.max(1000, view().length),
        insertRowsAfter: () => {},
        appendRow: (values) => { const r = lastRowOf(view()); values.forEach((v, c) => both(r, c, (x) => { x.v = userEntered(x, v); })); },
        deleteColumn: (col) => { for (const g of [fs_.truth, view()]) g.forEach((row) => row && row.splice(col - 1, 1)); },
        getDataRange: () => sheet.getRange(1, 1, Math.max(1, lastRowOf(view())), Math.max(1, lastColOf(view()))),
        getRange: (r, c, nr = 1, nc = 1) => {
          const each = (fn) => { for (let i = 0; i < nr; i += 1) for (let j = 0; j < nc; j += 1) both(r - 1 + i, c - 1 + j, (x) => fn(x, i, j)); };
          const v = (i = 0, j = 0) => at(view(), r - 1 + i, c - 1 + j);
          return {
            getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => v(i, j).v)),
            getValue: () => v().v,
            setValues: (vals) => each((x, i, j) => { x.v = userEntered(x, vals[i][j]); x.f = ''; }),
            setNumberFormat: (f) => each((x) => { x.fmt = f; }),
            setDataValidation: (dv) => each((x) => { x.dv = dv; }),
            clearDataValidations: () => each((x) => { x.dv = null; }),
          };
        },
      };
      return sheet;
    };
    return {
      getId: () => file.id,
      getSheets: () => file.sheets.map(wrap),
      getSheetByName: (n) => { const s = file.sheets.find((x) => x.name === n); return s ? wrap(s) : null; },
      insertSheet: (n) => { const s = newFileSheet(n); file.sheets.push(s); return wrap(s); },
    };
  }

  const SpreadsheetApp = {
    create: (name) => { const file = { id: `FILE-${++fileSeq}`, name, trashed: false, sheets: [newFileSheet('シート1')] }; files.set(file.id, file); return openSpreadsheet(file); },
    openById: (id) => { const f = files.get(id); if (!f) throw new Error(`no file ${id}`); return openSpreadsheet(f); },
    flush: () => {},
    newDataValidation: () => ({ requireValueInList() { return this; }, build: () => ({ rule: 'list' }) }),
  };
  const DriveApp = {
    getFileById: (id) => {
      const f = files.get(id);
      if (!f) throw new Error(`no file ${id}`);
      return {
        makeCopy: (name) => {
          const copy = { id: `FILE-${++fileSeq}`, name, trashed: false, sheets: f.sheets.map((s) => ({ name: s.name, sheetId: s.sheetId, truth: cloneGrid(s.truth) })) };
          files.set(copy.id, copy);
          return { getId: () => copy.id };
        },
        setTrashed: (b) => { f.trashed = b; },
      };
    },
  };

  // 偽の Sheets API
  const findSheet = (fileId, sheetId) => (files.get(fileId)?.sheets || []).find((s) => s.sheetId === sheetId);
  const writeCell = (x, cell, fields) => {
    const uv = cell.userEnteredValue || {};
    const type = cell.userEnteredFormat?.numberFormat?.type;
    if ('boolValue' in uv) x.v = uv.boolValue;
    else if ('numberValue' in uv) x.v = type === 'DATE' ? serialToDate(uv.numberValue) : uv.numberValue;
    else x.v = uv.stringValue ?? '';
    if (fields.includes('userEnteredFormat')) x.fmt = type === 'TEXT' ? '@' : '';
    x.f = '';
  };
  const batchCalls = [];
  const batchUpdate = (fileId, requests) => {
    batchCalls.push(requests.length);
    const valid = requests.every((q) => findSheet(fileId, q.updateCells ? q.updateCells.start.sheetId : q.appendCells.sheetId));
    if (atomic && !valid) return { ok: false, code: 400, errorStatus: 'INVALID_ARGUMENT', replies: 0, bytes: 0, ms: 1 };
    for (const q of requests) {
      if (q.updateCells) {
        const s = findSheet(fileId, q.updateCells.start.sheetId);
        if (!s) return { ok: false, code: 400, errorStatus: 'INVALID_ARGUMENT', replies: 0, bytes: 0, ms: 1 };
        writeCell(at(s.truth, q.updateCells.start.rowIndex, q.updateCells.start.columnIndex), q.updateCells.rows[0].values[0], q.updateCells.fields);
      } else {
        const s = findSheet(fileId, q.appendCells.sheetId);
        if (!s) return { ok: false, code: 400, errorStatus: 'INVALID_ARGUMENT', replies: 0, bytes: 0, ms: 1 };
        const r = lastRowOf(s.truth);
        q.appendCells.rows[0].values.forEach((cell, c) => writeCell(at(s.truth, r, c), cell, q.appendCells.fields));
      }
    }
    return { ok: true, code: 200, errorStatus: '', replies: requests.length, bytes: 0, ms: 1 };
  };
  const cellJson = (x) => {
    if (!x) return {};
    const out = {};
    if (x.v instanceof Date) { out.effectiveValue = { numberValue: x.v.getTime() / 86400000 + 25569 }; out.userEnteredFormat = { numberFormat: { type: 'DATE' } }; }
    else if (typeof x.v === 'boolean') out.effectiveValue = { boolValue: x.v };
    else if (typeof x.v === 'number') out.effectiveValue = { numberValue: x.v };
    else if (x.v !== '') out.effectiveValue = { stringValue: String(x.v) };
    if (x.fmt === '@') out.userEnteredFormat = { numberFormat: { type: 'TEXT' } };
    return out;
  };
  const getGrid = (fileId) => ({
    sheets: files.get(fileId).sheets.map((s) => ({ properties: { title: s.name, sheetId: s.sheetId }, data: [{ rowData: s.truth.map((row) => ({ values: (row || []).map(cellJson) })) }] })),
  });
  // confirmConversionAppliedViaApi_ が読む T_人物統合ログ の A 列（本物の内容）
  const UrlFetchApp = {
    fetch: (url) => {
      const id = decodeURIComponent(url.split('/spreadsheets/')[1].split('/')[0]);
      const s = files.get(id).sheets.find((x) => x.name === 'T_人物統合ログ');
      const values = s.truth.map((row) => [row && row[0] ? String(row[0].v) : '']);
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ values }) };
    },
  };
  const props = new Map();
  return {
    files, batchCalls, SpreadsheetApp, DriveApp, UrlFetchApp,
    batchUpdate, getGrid,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => props.set(k, String(v)), deleteProperty: (k) => props.delete(k) }) },
    props,
  };
}

// ── ツールを読み込んで実行する ──────────────────────────────────────────
const STUBS = `
  function assertMasterOperator_() { return { loginId: 'op@example.invalid' }; }
  function getOrCreateDatabase_() { throw new Error('本番 DB を開こうとした'); }
  function getLogSs_() { throw new Error('ログ用 DB を開こうとした'); }
  function clearAllDataCache_() {}
  function clearAdminDashboardCache_() {}
  function clearTrainingManagementCache_() {}
  function notifyMembershipChatSafely_(ss, kind) { w.notified.push(kind); return { skipped: true }; }
  function sheetsApiBatchUpdate_(id, requests) { return w.batchUpdate(id, requests); }
  function sheetsApiGetGrid_(id) { return w.getGrid(id); }
`;
function loadTool(source = SOURCE, worldOptions) {
  const defs = functionDefs(source);
  const names = closure(defs, ['e2eMemberConversionIsolated_APPLY']);
  const body = `
    var w = arguments[0];
    var SpreadsheetApp = w.SpreadsheetApp, DriveApp = w.DriveApp, UrlFetchApp = w.UrlFetchApp, PropertiesService = w.PropertiesService;
    var ScriptApp = { getOAuthToken: function() { return 'token'; } };
    var Logger = { log: function() {} };
    var CacheService = { getScriptCache: function() { throw new Error('スクリプトキャッシュに触れた'); } };
    var LockService = { getScriptLock: function() { return { waitLock: function() {}, releaseLock: function() {} }; } };
    var Utilities = {
      getUuid: function() { return w.uuid(); },
      formatDate: function(d, tz, fmt) { return fmt === 'yyyy-MM-dd' ? '2026-11-01' : '20261101-090000'; },
    };
    ${globalsSource(source)}
    ${names.map((n) => defs.get(n)).join('\n')}
    ${STUBS}
    return { run: e2eMemberConversionIsolated_APPLY };
  `;
  const world = fakeWorld(worldOptions);
  world.notified = [];
  world.uuid = () => crypto.randomUUID();
  const tool = new Function(body)(world);
  return { world, run: () => JSON.parse(tool.run()) };
}
const byId = (report) => Object.fromEntries(report.scenarios.map((s) => [s.id, s]));
const failedIds = (report) => report.scenarios.filter((s) => !s.passed).map((s) => s.id);

test('正しい実装なら、1 回目（E1〜E11）・2 回目（往復の戻り・同じ操作IDの再送）がすべて合格し、一時ファイルはすべてゴミ箱へ', () => {
  const { world, run } = loadTool();
  const first = run();
  assert.equal(first.phase, '1/2');
  assert.deepEqual(failedIds(first), [], JSON.stringify(first.scenarios.filter((s) => !s.passed), null, 1));
  const ids = first.scenarios.map((s) => s.id);
  for (const id of ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7a-1', 'E7b-1', 'E8a', 'E8b', 'E8c', 'E8d', 'E8e', 'E9', 'E10-1', 'E11a', 'E11b']) assert.ok(ids.includes(id), id);
  assert.match(first.verdict, /^OK/);
  assert.equal(first.files.kept, 3, '往復 2 本と E10 の一時ファイルだけ 2 回目のために残す');
  assert.ok(world.props.has('E2E_MEMBER_CONVERSION_PENDING'));
  assert.equal(world.notified.filter((k) => k === 'ANOMALY').length, 1, '異常通知は列の欠落（E8e）の 1 回だけ（宛先設定が無いので送られない）');

  const second = run();
  assert.equal(second.phase, '2/2');
  assert.deepEqual(failedIds(second), [], JSON.stringify(second.scenarios.filter((s) => !s.passed), null, 1));
  assert.deepEqual(second.scenarios.map((s) => s.id), ['E7a-2', 'E7b-2', 'E10-2']);
  assert.equal(byId(second)['E7a-2'].result.newMemberId, '10000007', '個人→職員→個人で元の会員ID に戻る');
  assert.equal(byId(second)['E7b-2'].result.newStaffId, 'S900000011', '職員→個人→職員で元の職員ID に戻る');
  assert.equal(byId(second)['E10-2'].batchCalls, 0);
  assert.ok(!world.props.has('E2E_MEMBER_CONVERSION_PENDING'), '2 回目の最初に途中の状態を消す');
  assert.ok([...world.files.values()].every((f) => f.trashed), '一時ファイルはすべてゴミ箱');
});

test('壊した実装は該当シナリオで落ちる: 削除済みの研修申込まで付け替える → E1 が「変わってはならないセル」で不合格', () => {
  const broken = SOURCE.replace("    if (toBoolean_(data[r][cols['削除フラグ']])) continue;\n    var appMemberId", '    var appMemberId');
  assert.notEqual(broken, SOURCE);
  const report = loadTool(broken).run();
  const e1 = byId(report).E1;
  assert.equal(e1.passed, false);
  assert.ok(e1.detail.unexpected.some((k) => k.startsWith('T_研修申込|')), JSON.stringify(e1.detail));
});

test('壊した実装は該当シナリオで落ちる: 日付を文字列のまま書く → 型が既存の行と違い不合格', () => {
  const broken = SOURCE.replace('  if (isPlainDateString_(s)) {\n    return { cell: { userEnteredValue: { numberValue: dateStringToSheetSerial_(s) }', '  if (false) {\n    return { cell: { userEnteredValue: { numberValue: dateStringToSheetSerial_(s) }');
  assert.notEqual(broken, SOURCE);
  const e1 = byId(loadTool(broken).run()).E1;
  assert.equal(e1.passed, false);
  assert.ok(e1.detail.typeMismatches.some((m) => m.includes('「移行日」')), JSON.stringify(e1.detail));
  assert.ok(e1.detail.typeMismatches.some((m) => m.includes('「入会日」')), '追加行の日付も型で見つかる');
});

test('壊した実装は該当シナリオで落ちる: 移行済みの行を使い直さない（2026-10-31 以前の動き）→ 2 回目の E7a-2 だけ不合格', () => {
  const broken = SOURCE.replace("&& (status === 'WITHDRAWN' || status === 'TRANSFERRED');", "&& status === 'WITHDRAWN';");
  assert.notEqual(broken, SOURCE);
  const { run } = loadTool(broken);
  assert.deepEqual(failedIds(run()), []);
  const second = run();
  assert.deepEqual(failedIds(second), ['E7a-2']);
  assert.ok(byId(second)['E7a-2'].problems.some((p) => p.includes('T_会員 の行数')), JSON.stringify(byId(second)['E7a-2']));
});

test('途中まで反映してしまう API なら、失敗を混ぜた E9 が「変わってはならないセル」で不合格になる', () => {
  const report = loadTool(SOURCE, { atomic: false }).run();
  const e9 = byId(report).E9;
  assert.equal(e9.passed, false);
  assert.ok(e9.detail.unexpected.length > 0 || Object.keys(e9.detail.appended).length > 0);
});

test('ツールは本番 DB・ログ用 DB を開かず、マスタは実行中だけ固定値・一括更新の差し替えは必ず元に戻す', () => {
  const defs = functionDefs(SOURCE);
  const own = [...defs.keys()].filter((n) => n.startsWith('memberConversionE2e') || n.endsWith('MemberConversionE2eBase_') || n.includes('MemberConversionE2e'));
  assert.ok(own.length >= 15, own.join(','));
  for (const name of own) {
    assert.doesNotMatch(defs.get(name), /getOrCreateDatabase_\(|getLogSs_\(|DB_SPREADSHEET_ID_FIXED/, name);
  }
  const entry = defs.get('e2eMemberConversionIsolated_APPLY');
  assert.match(entry, /^function e2eMemberConversionIsolated_APPLY\(\) \{\n  var session = assertMasterOperator_\('e2eMemberConversionIsolated_APPLY'\);/);
  const fin = entry.slice(entry.indexOf('} finally {'));
  assert.match(fin, /sheetsApiBatchUpdate_ = realBatch;/);
  assert.match(fin, /MASTER_OPTIONS_MEMO_ = savedMemo;/);
  assert.match(fin, /setTrashed\(true\)/);
});
