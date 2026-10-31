// docs/317 P: Sheets API 一括更新の実地確認ツールの「判定」を検証する。
// 実ソースの関数を取り出し、偽のスプレッドシートと偽の Sheets API で動かす。
// 偽 API を「全部か無しか」にすれば全項目が合格し、「途中まで反映」にすれば P2・P9 が不合格になる
// ——つまり、実環境で P ツールが合格と言ったとき、それが原子性の証拠になっていることを確かめる。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../gas-src/Code.full.gs', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end < 0 ? source.length : end);
}
// `head` から始まる文の、最初の { または [ に対応する閉じ括弧までを返す
function block(head) {
  const start = source.indexOf(head);
  assert.ok(start >= 0, `${head} が見つからない`);
  let i = start + head.length;
  while (source[i] !== '{' && source[i] !== '[') i += 1;
  const open = source[i];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (; i < source.length; i += 1) {
    if (source[i] === open) depth += 1;
    else if (source[i] === close && --depth === 0) return source.slice(start, i + 1) + ';';
  }
  throw new Error(`${head} の終端が見つからない`);
}

const PROBE_FUNCTIONS = ['probeSheetsBatchUpdate_APPLY', 'sheetsApiBatchUpdate_', 'sheetsApiGetGrid_', 'probeApiCellKey_', 'probeSnapshotViaApi_', 'probeRowIndexById_', 'sheetsApiCellValue_', 'sheetsApiUpdateCellRequest_',
  'sheetsApiAppendRowRequest_', 'probeCell_', 'probeChangedCells_', 'probeSameList_', 'probeTypeOf_', 'runSheetsBatchUpdateProbes_'];

// ── 偽のスプレッドシート ──────────────────────────────────────────────
// 実環境（2026-10-31 実測）と同じく、Sheets API で書いた内容は同じ実行の SpreadsheetApp からは見えない。
// 本物の内容（truth）は API が読み書きし、SpreadsheetApp は自分の見え方（view）を読む。SpreadsheetApp の書込みは両方へ。
const isDateString = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
function fakeSpreadsheet() {
  let nextId = 1;
  const sheets = [];
  const makeSheet = (name) => {
    const truth = [];
    const view = [];
    const sheetId = nextId++;
    const at = (grid, r, c) => {
      while (grid.length <= r) grid.push([]);
      if (!grid[r][c]) grid[r][c] = { v: '', fmt: '', dv: null, f: '' };
      return grid[r][c];
    };
    const lastRowOf = (grid) => {
      for (let r = grid.length - 1; r >= 0; r -= 1) if ((grid[r] || []).some((x) => x && (x.v !== '' || x.f))) return r + 1;
      return 0;
    };
    const lastColOf = (grid) => Math.max(0, ...grid.map((row) => {
      for (let c = (row || []).length - 1; c >= 0; c -= 1) if (row[c] && (row[c].v !== '' || row[c].f)) return c + 1;
      return 0;
    }));
    // SpreadsheetApp の setValues は、書式なしテキストでない限り日付の文字列を日付にする（実環境の振る舞いを模す）
    const userEntered = (x, value) => (x.fmt !== '@' && isDateString(value) ? new Date(`${value}T00:00:00Z`) : value);
    const both = (r, c, fn) => { fn(at(truth, r, c)); fn(at(view, r, c)); };
    const sheet = {
      name, sheetId, truth, at,
      truthLastRow: () => lastRowOf(truth),
      getName: () => sheet.name,
      setName: (n) => { sheet.name = n; },
      getSheetId: () => sheetId,
      getLastRow: () => lastRowOf(view),
      getLastColumn: () => lastColOf(view),
      getMaxRows: () => Math.max(1000, view.length),
      appendRow: (values) => { const r = lastRowOf(view); values.forEach((v, c) => both(r, c, (x) => { x.v = v; })); },
      insertRowsAfter: () => {},
      getDataRange: () => sheet.getRange(1, 1, Math.max(1, lastRowOf(view)), Math.max(1, lastColOf(view))),
      getRange: (r, c, nr = 1, nc = 1) => {
        const each = (fn) => { for (let i = 0; i < nr; i += 1) for (let j = 0; j < nc; j += 1) both(r - 1 + i, c - 1 + j, (x) => fn(x, i, j)); };
        const v = (i = 0, j = 0) => at(view, r - 1 + i, c - 1 + j);
        return {
          getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => v(i, j).v)),
          getValue: () => v().v,
          setValues: (vals) => each((x, i, j) => { x.v = userEntered(x, vals[i][j]); x.f = ''; }),
          setNumberFormat: (f) => each((x) => { x.fmt = f; }),
          getNumberFormat: () => v().fmt,
          setDataValidation: (dv) => each((x) => { x.dv = dv; }),
          getDataValidation: () => v().dv,
          clearDataValidations: () => each((x) => { x.dv = null; }),
          setFormula: (f) => each((x) => { x.f = f; x.v = '★式'; }),
          getFormula: () => v().f,
        };
      },
    };
    return sheet;
  };
  const ss = {
    getId: () => 'TEMP-1',
    getSheets: () => sheets.slice(),
    getSheetByName: (n) => sheets.find((x) => x.name === n) || null,
    insertSheet: (n) => { const s = makeSheet(n); sheets.push(s); return s; },
    _sheets: sheets,
  };
  sheets.push(makeSheet('シート1'));
  return ss;
}

// ── 偽の Sheets API（atomic=false なら失敗の手前まで反映してしまう） ─────────────
function fakeSheetsApi(ss, { atomic = true, available = true } = {}) {
  const find = (id) => ss._sheets.find((s) => s.sheetId === id);
  const write = (x, cellJson) => {
    const uv = cellJson.userEnteredValue;
    x.v = 'boolValue' in uv ? uv.boolValue : 'numberValue' in uv ? uv.numberValue : uv.stringValue;
    x.f = '';
  };
  const applyOne = (req) => {
    if (req.updateCells) {
      const s = find(req.updateCells.start.sheetId);
      if (!s) return false;
      write(s.at(s.truth, req.updateCells.start.rowIndex, req.updateCells.start.columnIndex), req.updateCells.rows[0].values[0]);
      return true;
    }
    if (req.appendCells) {
      const s = find(req.appendCells.sheetId);
      if (!s) return false;
      const r = s.truthLastRow();
      req.appendCells.rows[0].values.forEach((v, c) => {
        const x = s.at(s.truth, r, c);
        write(x, v);
        x.fmt = v.userEnteredFormat && v.userEnteredFormat.numberFormat ? '@' : '';
      });
      return true;
    }
    return false;
  };
  const batchUpdate = (spreadsheetId, requests) => {
    const body = JSON.stringify({ requests });
    if (!available) return { ok: false, code: 403, errorStatus: 'PERMISSION_DENIED', replies: 0, bytes: body.length, ms: 1 };
    const valid = requests.every((req) => find((req.updateCells && req.updateCells.start.sheetId) || (req.appendCells && req.appendCells.sheetId)));
    if (atomic && !valid) return { ok: false, code: 400, errorStatus: 'INVALID_ARGUMENT', replies: 0, bytes: body.length, ms: 1 };
    for (const req of requests) {
      if (!applyOne(req)) return { ok: false, code: 400, errorStatus: 'INVALID_ARGUMENT', replies: 0, bytes: body.length, ms: 1 };
    }
    return { ok: true, code: 200, errorStatus: '', replies: requests.length, bytes: body.length, ms: 1 };
  };
  // includeGridData の応答（本物の内容から作る）
  const cellJson = (x) => {
    if (!x) return {};
    const out = {};
    if (x.v instanceof Date) {
      out.effectiveValue = { numberValue: x.v.getTime() / 86400000 + 25569 };
      out.userEnteredFormat = { numberFormat: { type: 'DATE' } };
    } else if (typeof x.v === 'boolean') out.effectiveValue = { boolValue: x.v };
    else if (typeof x.v === 'number') out.effectiveValue = { numberValue: x.v };
    else if (x.v !== '') out.effectiveValue = { stringValue: String(x.v) };
    if (x.fmt === '@') out.userEnteredFormat = { numberFormat: { type: 'TEXT' } };
    if (x.dv) out.dataValidation = { condition: { type: 'ONE_OF_LIST' } };
    if (x.f) out.userEnteredValue = { formulaValue: x.f };
    return out;
  };
  const getGrid = () => ({
    sheets: ss._sheets.map((s) => ({
      properties: { title: s.name, sheetId: s.sheetId },
      data: [{ rowData: s.truth.map((row) => ({ values: (row || []).map(cellJson) })) }],
    })),
  });
  return { batchUpdate, getGrid };
}

function runProbe(apiOptions) {
  const ss = fakeSpreadsheet();
  const api = fakeSheetsApi(ss, apiOptions);
  const report = { checks: [] };
  const helpers = ['writeSheetHeaders_', 'applyTextColumnFormats_', 'appendRowsByHeaders_', 'getRowsAsObjects_', 'getRowsAsObjectsFromSheet_'];
  const body = `
    var deps = arguments[0];
    ${block('var テーブル定義 = ')}
    ${block("テーブル定義['T_人物統合ログ'] = ")}
    ${block('var TEXT_FORMAT_COLUMNS_ = ')}
    var SpreadsheetApp = { flush: function() {}, newDataValidation: function() { return { requireValueInList: function() { return this; }, build: function() { return { rule: 'list' }; } }; } };
    ${helpers.map(extract).join('\n')}
    ${['sheetsApiCellValue_', 'sheetsApiUpdateCellRequest_', 'sheetsApiAppendRowRequest_', 'probeCell_', 'probeChangedCells_',
       'probeSameList_', 'probeTypeOf_', 'probeApiCellKey_', 'probeSnapshotViaApi_', 'probeRowIndexById_', 'runSheetsBatchUpdateProbes_'].map(extract).join('\n')}
    var sheetsApiBatchUpdate_ = deps.api.batchUpdate;
    var sheetsApiGetGrid_ = deps.api.getGrid;
    return runSheetsBatchUpdateProbes_;
  `;
  new Function(body)({ api })(ss, report);
  return { checks: Object.fromEntries(report.checks.map((c) => [c.id, c])), observations: report.observations || {} };
}

test('全部か無しかで適用する API なら、型（P5）以外のすべてが合格する（SpreadsheetApp が古い内容を返しても）', () => {
  const { checks, observations } = runProbe({ atomic: true });
  for (const id of ['P10', 'P1', 'P2', 'P9', 'P3', 'P4', 'P6', 'P7', 'P8']) {
    assert.equal(checks[id]?.passed, true, `${id}: ${JSON.stringify(checks[id]?.detail)}`);
  }
  // 偽のシートは実環境と同じく setValues で日付の文字列を日付にする。一括更新（stringValue）は文字列のまま。
  // この差を P5 が見つけて不合格にできること（実環境で同じ差が出たら、読む側の前提を確かめてから決める）。
  assert.equal(checks.P5.passed, false);
  const join = checks.P5.detail.types.find((t) => t.column === '入会日');
  assert.deepEqual([join.existingWriter, join.batch, join.same], ['date', 'string', false]);
  assert.equal(checks.P5.detail.types.find((t) => t.column === '介護支援専門員番号').same, true, '書式なしテキストの番号は同じ');
  // P0 は観察（合否に入れない）。偽の環境では「同じ実行の SpreadsheetApp からは見えない」
  assert.deepEqual([observations.P0.sameObjectSeesWrite, observations.P0.apiSeesWrite], [false, true]);
  assert.ok(!('P0' in checks));
});

test('途中まで反映してしまう API なら、原子性（P2）と操作記録（P9）が不合格になる', () => {
  const { checks } = runProbe({ atomic: false });
  assert.equal(checks.P2.passed, false);
  assert.ok(checks.P2.detail.changedCells > 0 || Object.keys(checks.P2.detail.appended).length > 0);
  assert.equal(checks.P9.passed, false);
});

test('API が使えなければ P10 で止まり、以降を合格扱いにしない', () => {
  const { checks } = runProbe({ available: false });
  assert.equal(checks.P10.passed, false);
  assert.equal(checks.P10.detail.code, 403);
  assert.deepEqual(Object.keys(checks), ['P10']);
});

test('書いた結果の確認は API から読む（API で書いた後に SpreadsheetApp で書かない・読んで判定しない）', () => {
  const runner = extract('runSheetsBatchUpdateProbes_');
  const firstApiWrite = runner.indexOf('sheetsApiBatchUpdate_(');
  assert.ok(firstApiWrite > 0);
  const afterWrites = runner.slice(firstApiWrite);
  // 最初の API 書込みより後に、SpreadsheetApp の書込み（setValues 等・appendRowsByHeaders_）が無い
  assert.doesNotMatch(afterWrites, /\.setValues?\(|\.setFormula\(|\.setNumberFormat\(|\.setDataValidation\(|appendRowsByHeaders_\(|appendRow\(/);
  // 判定に使うスナップショットは API から
  assert.doesNotMatch(runner, /snapshotSpreadsheetForRehearsal_\(/);
});

test('要求の組み立て: 列単位の更新は値だけ、追加行は見出し順で書式なしテキスト列にテキスト書式', () => {
  const fns = new Function(`${block('var TEXT_FORMAT_COLUMNS_ = ')}
    ${['sheetsApiCellValue_', 'sheetsApiUpdateCellRequest_', 'sheetsApiAppendRowRequest_'].map(extract).join('\n')}
    return { sheetsApiCellValue_, sheetsApiUpdateCellRequest_, sheetsApiAppendRowRequest_ };`)();
  assert.deepEqual(fns.sheetsApiCellValue_(true), { userEnteredValue: { boolValue: true } });
  assert.deepEqual(fns.sheetsApiCellValue_(3), { userEnteredValue: { numberValue: 3 } });
  assert.deepEqual(fns.sheetsApiCellValue_('0123'), { userEnteredValue: { stringValue: '0123' } });
  assert.deepEqual(fns.sheetsApiCellValue_(null), { userEnteredValue: { stringValue: '' } });
  const upd = fns.sheetsApiUpdateCellRequest_(7, 2, 3, 'x').updateCells;
  assert.deepEqual([upd.start, upd.fields], [{ sheetId: 7, rowIndex: 1, columnIndex: 2 }, 'userEnteredValue']);
  const sheet = { getSheetId: () => 9, getLastColumn: () => 3, getRange: () => ({ getValues: () => [['会員ID', '介護支援専門員番号', '姓']] }) };
  const app = fns.sheetsApiAppendRowRequest_(sheet, 'T_会員', { 姓: '★', 会員ID: 'M1', 介護支援専門員番号: '01234567' }).appendCells;
  assert.equal(app.sheetId, 9);
  assert.deepEqual(app.rows[0].values.map((v) => v.userEnteredValue.stringValue), ['M1', '01234567', '★']);
  assert.deepEqual(app.rows[0].values.map((v) => !!v.userEnteredFormat), [false, true, false]);
});

test('実地確認ツールは本番 DB・ログ用 DB を開かず、一時ファイルを必ずゴミ箱へ移す', () => {
  for (const name of PROBE_FUNCTIONS) {
    assert.doesNotMatch(extract(name), /getOrCreateDatabase_\(|getLogSs_\(|openById\(/, name);
  }
  const entry = extract('probeSheetsBatchUpdate_APPLY');
  assert.match(entry, /SpreadsheetApp\.create\(SHEETS_PROBE_FILE_PREFIX_/);
  assert.match(entry, /finally \{[\s\S]*setTrashed\(true\)/);
  // セルの値を出力しない（判定・型・件数・時間だけ）
  assert.doesNotMatch(extract('runSheetsBatchUpdateProbes_'), /detail[^;]*getValues\(\)/);
});
