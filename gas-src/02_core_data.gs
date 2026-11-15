// gas-src/02_core_data.gs — シートの読み書き・キャッシュ・Sheets REST・書き込みのまとめ。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

function getAllDataCacheKey_() {
  return 'fetchAllData:' + DB_SCHEMA_VERSION;
}

function getAdminDashboardCacheKey_() {
  // v362: kana 列追加のためキャッシュ key を bump
  return 'adminDashboard:' + DB_SCHEMA_VERSION + ':v362-kana';
}

function getTrainingManagementCacheKey_() {
  return 'trainingManagement:' + DB_SCHEMA_VERSION;
}

// v150: CacheService チャンキング（100KB上限対応、putAll/getAll バッチ操作）
var CACHE_CHUNK_SIZE = 90000; // 90KB safety margin

function putChunkedCache_(cache, key, data, ttl) {
  var json = JSON.stringify(data);
  if (json.length <= CACHE_CHUNK_SIZE) {
    cache.put(key, json, ttl);
    cache.put(key + ':chunks', '0', ttl);
    return;
  }
  var keysToStore = {};
  var chunkCount = 0;
  for (var i = 0; i < json.length; i += CACHE_CHUNK_SIZE) {
    keysToStore[key + ':' + chunkCount] = json.substring(i, i + CACHE_CHUNK_SIZE);
    chunkCount++;
  }
  keysToStore[key + ':chunks'] = String(chunkCount);
  cache.putAll(keysToStore, ttl);
}

function getChunkedCache_(cache, key) {
  var chunkCount = cache.get(key + ':chunks');
  if (chunkCount === null) return null;
  var n = parseInt(chunkCount, 10);
  if (n === 0) {
    var single = cache.get(key);
    return single ? JSON.parse(single) : null;
  }
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(key + ':' + i);
  var all = cache.getAll(keys);
  var json = '';
  for (var j = 0; j < n; j++) {
    var chunk = all[key + ':' + j];
    if (!chunk) return null; // 部分的なキャッシュ失効
    json += chunk;
  }
  return JSON.parse(json);
}

function removeChunkedCache_(cache, key) {
  var chunkCount = cache.get(key + ':chunks');
  cache.remove(key);
  cache.remove(key + ':chunks');
  if (chunkCount !== null) {
    var n = parseInt(chunkCount, 10);
    for (var i = 0; i < n; i++) cache.remove(key + ':' + i);
  }
}

function clearAllDataCache_() {
  var cache = CacheService.getScriptCache();
  removeChunkedCache_(cache, getAllDataCacheKey_());
  clearRecentAnnualFeeAdminCaches_();
}

function clearAdminDashboardCache_() {
  removeChunkedCache_(CacheService.getScriptCache(), getAdminDashboardCacheKey_());
  markSnapshotStale_('dashboard'); // docs/332 S1: 38 か所の書き込みがここを通る
}

// getTrainingManagementData_ のキャッシュの鍵の版。取り出す側と消す側が必ずこの 1 か所を見る。
// 2026-11-03 是正: v376.141 で取り出す側だけ _v3 にし、消す側は _v2 のままだった。研修の保存・削除・申込の後も
// 管理画面の研修一覧が最大 10 分（ALL_DATA_CACHE_TTL_SECONDS）古いままだった。
var TRAINING_MANAGEMENT_CACHE_VERSION_ = '_v3';

function clearTrainingManagementCache_() {
  // 古い版の鍵も消す（版を上げた直後に残っている分）
  var cache = CacheService.getScriptCache();
  var baseKey = getTrainingManagementCacheKey_();
  removeChunkedCache_(cache, baseKey);
  removeChunkedCache_(cache, baseKey + '_v2');
  removeChunkedCache_(cache, baseKey + TRAINING_MANAGEMENT_CACHE_VERSION_);
}

function fetchAllDataFromDb_() {
  var cache = CacheService.getScriptCache();
  var cacheKey = getAllDataCacheKey_();
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var result = fetchAllDataFromDbFresh_();
  try {
    putChunkedCache_(cache, cacheKey, result, ALL_DATA_CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('fetchAllDataFromDb_ cache skipped: ' + e.message);
  }
  return result;
}

function buildSheetLookup_(ss) {
  var map = {};
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i += 1) {
    map[sheets[i].getName()] = sheets[i];
  }
  return map;
}

function getRowsAsObjectsFromSheet_(sheet) {
  if (!sheet) return [];
  return rowsFromValues_(sheet.getDataRange().getValues());
}

function getRowsAsObjectsBatch_(ss, sheetNames) {
  var sheetLookup = buildSheetLookup_(ss);
  var rowsBySheet = {};
  for (var i = 0; i < sheetNames.length; i += 1) {
    var sheetName = sheetNames[i];
    rowsBySheet[sheetName] = getRowsAsObjectsFromSheet_(sheetLookup[sheetName]);
  }
  return rowsBySheet;
}

function buildTrainingApplicationRelationContextFromRows_(rowsBySheet) {
  var trainingMap = {};
  var memberMap = {};
  var staffMap = {};
  var externalMap = {};

  var trainingRows = rowsBySheet['T_研修'] || [];
  var memberRows = rowsBySheet['T_会員'] || [];
  var staffRows = rowsBySheet['T_事業所職員'] || [];
  var externalRows = rowsBySheet['T_外部申込者'] || [];

  for (var i = 0; i < trainingRows.length; i += 1) {
    if (!toBoolean_(trainingRows[i]['削除フラグ'])) {
      trainingMap[String(trainingRows[i]['研修ID'] || '')] = trainingRows[i];
    }
  }
  for (var j = 0; j < memberRows.length; j += 1) {
    if (!toBoolean_(memberRows[j]['削除フラグ'])) {
      memberMap[String(memberRows[j]['会員ID'] || '')] = memberRows[j];
    }
  }
  for (var k = 0; k < staffRows.length; k += 1) {
    if (!toBoolean_(staffRows[k]['削除フラグ'])) {
      staffMap[String(staffRows[k]['職員ID'] || '')] = staffRows[k];
    }
  }
  for (var m = 0; m < externalRows.length; m += 1) {
    if (!toBoolean_(externalRows[m]['削除フラグ'])) {
      externalMap[String(externalRows[m]['外部申込者ID'] || '')] = externalRows[m];
    }
  }

  return {
    trainingMap: trainingMap,
    memberMap: memberMap,
    staffMap: staffMap,
    externalMap: externalMap,
  };
}

function fetchAllDataFromDbFresh_() {
  var ss = getOrCreateDatabase_();
  var rowsBySheet = getRowsAsObjectsBatch_(ss, [
    'T_会員',
    'T_事業所職員',
    'T_認証アカウント',
    'T_研修',
    'T_研修申込',
    'T_年会費納入履歴',
    'T_外部申込者',
  ]);
  var memberRows = (rowsBySheet['T_会員'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffRows = (rowsBySheet['T_事業所職員'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var authRows = (rowsBySheet['T_認証アカウント'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var trainingRows = (rowsBySheet['T_研修'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var applicationRows = getTrainingApplicationRows_(ss, {
    appliedOnly: true,
    rows: rowsBySheet['T_研修申込'] || [],
    context: buildTrainingApplicationRelationContextFromRows_(rowsBySheet),
  });
  var feeRows = (rowsBySheet['T_年会費納入履歴'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberTypeFeeMap = getAnnualFeeAmountMap_(ss);
  return {
    members: mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap, { includeAdminStatusNote: true }),
    trainings: mapTrainingRowsForApi_(trainingRows),
  };
}

function uniqueStrings_(arr) {
  var out = [];
  var seen = {};
  for (var i = 0; i < arr.length; i += 1) {
    var v = String(arr[i] || '');
    if (!v || seen[v]) continue;
    seen[v] = true;
    out.push(v);
  }
  return out;
}

function clearTableData_(ss, sheetNames) {
  for (var i = 0; i < sheetNames.length; i += 1) {
    var sheet = ss.getSheetByName(sheetNames[i]);
    if (!sheet) continue;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  }
}

function rewriteTableWithoutRows_(ss, sheetName, keepPredicate) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { removed: 0, kept: 0 };
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { removed: 0, kept: 0 };

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var keptRows = [];
  for (var r = 0; r < values.length; r += 1) {
    var rowObj = {};
    for (var c = 0; c < headers.length; c += 1) {
      rowObj[headers[c]] = values[r][c];
    }
    if (keepPredicate(rowObj, values[r])) {
      keptRows.push(values[r]);
    }
  }

  sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (keptRows.length > 0) {
    var writeRange = sheet.getRange(2, 1, keptRows.length, lastCol);
    writeRange.clearDataValidations();
    writeRange.setValues(keptRows);
  }

  return {
    removed: values.length - keptRows.length,
    kept: keptRows.length,
  };
}

function appendRowsByHeaders_(ss, sheetName, objectRows) {
  if (!objectRows || objectRows.length === 0) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('シートが見つかりません: ' + sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rows = objectRows.map(function(obj) {
    var row = [];
    for (var i = 0; i < headers.length; i += 1) {
      row.push(obj[headers[i]] !== undefined ? obj[headers[i]] : '');
    }
    return row;
  });
  var startRow = sheet.getLastRow() + 1;
  // シートの最大行数を超える場合は行を追加する（restoreSheetFromBackupSpreadsheet_ で復元したシートは行数が固定のため）
  var neededRows = startRow + rows.length - 1;
  var maxRow = sheet.getMaxRows();
  if (neededRows > maxRow) {
    sheet.insertRowsAfter(maxRow, neededRows - maxRow);
  }
  var targetRange = sheet.getRange(startRow, 1, rows.length, headers.length);
  // シード投入時は既存入力規則に阻害されないよう、投入範囲の検証だけ解除してから書き込む。
  targetRange.clearDataValidations();
  // 数字だけの文字列の列は書く前に書式なしテキストにする（足した行・作り直した表の新しい行は書式を持たない）
  var baseName = String(sheetName);
  if (baseName.slice(-8) === '_archive') baseName = baseName.slice(0, -8);
  (TEXT_FORMAT_COLUMNS_[baseName] || []).forEach(function(column) {
    var index = headers.indexOf(column);
    if (index >= 0) sheet.getRange(startRow, index + 1, rows.length, 1).setNumberFormat('@');
  });
  targetRange.setValues(rows);
}

function getRowsAsObjects_(ss, sheetName) {
  return getRowsAsObjectsFromSheet_(ss.getSheetByName(sheetName));
}

function getDbInfo_() {
  var ss = getOrCreateDatabase_();
  return {
    スプレッドシートID: ss.getId(),
    スプレッドシートURL: ss.getUrl(),
    シート一覧: ss.getSheets().map(function(sheet) {
      return sheet.getName();
    }),
  };
}

function parsePayload_(payload) {
  if (!payload) {
    return null;
  }
  if (typeof payload !== 'string') {
    return payload;
  }
  try {
    return JSON.parse(payload);
  } catch (e) {
    throw new Error('payloadのJSONパースに失敗しました。');
  }
}

// ─── 2026-11-12 docs/332 §10.5: Sheets REST で 1 回に読む ─────────────────────────────────────
// 範囲は本文（POST）で送る（values:batchGetByDataFilter）。表名を URL に並べると 2 KB の上限を超える（34 表で約 2,500 字）。
function columnLetter_(n) {
  var s = '';
  var x = n;
  while (x > 0) {
    var m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

// SpreadsheetApp の getValues と同じ形の行にする（見出しはそのまま・末尾の省かれた空セルは ''）
function rowsFromValues_(values) {
  if (!values || values.length < 2) return [];
  var headers = values[0] || [];
  var rows = [];
  for (var r = 1; r < values.length; r += 1) {
    var row = values[r] || [];
    var obj = {};
    for (var c = 0; c < headers.length; c += 1) obj[headers[c]] = c < row.length ? row[c] : '';
    rows.push(obj);
  }
  return rows;
}

// ranges の順に値の配列を返す。失敗したら null（呼び出し側は SpreadsheetApp で読む）
function fetchSheetsValuesBatch_(ss, ranges, majorDimension) {
  try {
    var res = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + ss.getId() + '/values:batchGetByDataFilter', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({
        dataFilters: ranges.map(function(r) { return { a1Range: r }; }),
        majorDimension: majorDimension || 'ROWS',
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return null;
    var body = JSON.parse(res.getContentText());
    var items = body && body.valueRanges;
    if (!items || items.length !== ranges.length) return null;
    var byRange = {};
    items.forEach(function(item) {
      var filters = item.dataFilters || [];
      var key = filters.length && filters[0].a1Range ? filters[0].a1Range : '';
      byRange[key] = (item.valueRange && item.valueRange.values) || [];
    });
    var out = [];
    for (var i = 0; i < ranges.length; i += 1) {
      if (!Object.prototype.hasOwnProperty.call(byRange, ranges[i])) return null;
      out.push(byRange[ranges[i]]);
    }
    return out;
  } catch (e) {
    return null;
  }
}

// 必要な列だけを 1 回の通信で読む。列の位置はテーブル定義の順から求め、同じ呼び出しで読んだ見出しと合うか確かめる。
// 合わない・定義が無い・失敗したら null（呼び出し側は全体を 1 回で読む）。パスワードなど要らない列は範囲に入れない。
function readSheetColumnsViaRest_(ss, sheetName, names) {
  if (typeof テーブル定義 === 'undefined' || !テーブル定義[sheetName]) return null;
  var def = テーブル定義[sheetName];
  var ranges = [];
  for (var i = 0; i < names.length; i += 1) {
    var idx = def.indexOf(names[i]);
    if (idx < 0) return null;
    var col = columnLetter_(idx + 1);
    ranges.push("'" + sheetName + "'!" + col + '1:' + col);
  }
  var columns = fetchSheetsValuesBatch_(ss, ranges, 'COLUMNS');
  if (!columns) return null;
  var out = { rowCount: 0, columns: {} };
  var lists = [];
  for (var k = 0; k < names.length; k += 1) {
    var colValues = (columns[k] && columns[k][0]) || [];
    if (String(colValues[0] == null ? '' : colValues[0]).trim() !== names[k]) return null;
    lists.push(colValues.slice(1));
    if (colValues.length - 1 > out.rowCount) out.rowCount = colValues.length - 1;
  }
  for (var n = 0; n < names.length; n += 1) {
    var list = lists[n];
    while (list.length < out.rowCount) list.push('');
    out.columns[names[n]] = list;
  }
  return out;
}

// 見出しから列を探して読む。まず REST 1 回（必要な列だけ）、だめなら全体を 1 回で読む。必要な列が無ければ null。
// 返り値: { rowCount, columns: { 列名: [値…] } }。docs/328（管理者認証）・docs/330（件数）・docs/332 §10.5
function readSheetColumnsByName_(ss, sheetName, names) {
  var viaRest = readSheetColumnsViaRest_(ss, sheetName, names);
  if (viaRest) return viaRest;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return null;
  var headers = (values[0] || []).map(function(h) { return String(h || '').trim(); });
  var out = { rowCount: values.length - 1, columns: {} };
  for (var c = 0; c < names.length; c += 1) {
    var idx = headers.indexOf(names[c]);
    if (idx < 0) return null;
    out.columns[names[c]] = values.slice(1).map(function(row) { return row[idx]; });
  }
  return out;
}

// 変更申請の未処理件数（PENDING かつ削除されていない行）。2 列だけ読む。数えられなければ null。docs/330 §3
function countPendingChangeRequests_(ss) {
  var cols = readSheetColumnsByName_(ss, 'T_変更申請', ['申請状態コード', '削除フラグ']);
  if (!cols) return null;
  var count = 0;
  for (var r = 0; r < cols.rowCount; r += 1) {
    if (toBoolean_(cols.columns['削除フラグ'][r])) continue;
    if (String(cols.columns['申請状態コード'][r] || '') === 'PENDING') count += 1;
  }
  return count;
}

function pickColumn_(block, col) {
  var values = [];
  for (var i = 0; i < block.length; i += 1) values.push(block[i][col]);
  return values;
}

// 移行の書込み前に、参照の付け替えに必要な構造を検証する。
// 対象行が 0 件でも、表・列の不在は「確認不能」として区別する。
// ── 2026-10-31 docs/316 §4・docs/317 I: 書き込み計画（tx）と一括更新 ───────────────────────
// 移行の書込みは、その場で setValues せず tx に集め、最後に Sheets API の 1 回の batchUpdate で書く。
// 同じスプレッドシート内の要求は全部反映されるか、何も反映されない（docs/317 §9.1 P2 で実測）。
// - 行の更新は元の行との差分セルだけを書く（列単位。関係しない列・人を書き戻さない）
// - 値の型は既存の書き方（SpreadsheetApp の setValues）と揃える（P5）。書式なしテキスト列以外では
//   yyyy-MM-dd の文字列は日付、数字だけの文字列は数値になる（setValues と同じ）
// - API で書いた後は、同じ実行で SpreadsheetApp で読まない・書かない（P0: 古い内容が見える）
function createSheetWriteTx_(ss) {
  return { ss: ss, updates: [], appends: [], cells: {}, headers: {} };
}

function txHeaders_(tx, tableName) {
  if (!tx.headers[tableName]) {
    var sheet = tx.ss.getSheetByName(tableName);
    if (!sheet) throw new Error('表「' + tableName + '」がありません。');
    tx.headers[tableName] = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  }
  return tx.headers[tableName];
}

// 行の更新を予約する。originalRow（読んだまま）と newRow（書きたい行）の差分セルだけ
function txUpdateRow_(tx, tableName, rowNumber, originalRow, newRow) {
  var headers = txHeaders_(tx, tableName);
  for (var c = 0; c < newRow.length && c < headers.length; c += 1) {
    if (rehearsalCellKey_(originalRow[c]) === rehearsalCellKey_(newRow[c])) continue;
    var key = tableName + '|' + rowNumber + '|' + c;
    if (Object.prototype.hasOwnProperty.call(tx.cells, key)) {
      if (rehearsalCellKey_(tx.cells[key]) !== rehearsalCellKey_(newRow[c])) {
        throw new Error('同じセルに異なる値を書こうとしました（' + tableName + ' ' + rowNumber + '行目「' + headers[c] + '」）。移行を中止します。');
      }
      continue;
    }
    tx.cells[key] = newRow[c];
    tx.updates.push({ table: tableName, row: rowNumber, col: c + 1, header: headers[c], value: newRow[c] });
  }
}

// 行の追加を予約する（シートの見出し順で並べるのは commit のとき）
function txAppend_(tx, tableName, obj) {
  txHeaders_(tx, tableName);
  tx.appends.push({ table: tableName, obj: obj });
}

function isPlainDateString_(s) {
  if (s.length !== 10 || s.charAt(4) !== '-' || s.charAt(7) !== '-') return false;
  for (var i = 0; i < 10; i += 1) {
    if (i === 4 || i === 7) continue;
    var ch = s.charCodeAt(i);
    if (ch < 48 || ch > 57) return false;
  }
  var m = Number(s.slice(5, 7));
  var d = Number(s.slice(8, 10));
  return m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

// 数字だけ（先頭の - と小数点 1 つまで）。15 桁を超えるものは精度が落ちるので文字列のまま
function isPlainNumberString_(s) {
  if (!s || s.length > 15) return false;
  var start = s.charAt(0) === '-' ? 1 : 0;
  if (start >= s.length) return false;
  var dots = 0;
  for (var i = start; i < s.length; i += 1) {
    var ch = s.charCodeAt(i);
    if (ch === 46) { dots += 1; if (dots > 1 || i === start || i === s.length - 1) return false; continue; }
    if (ch < 48 || ch > 57) return false;
  }
  return true;
}

// yyyy-MM-dd → スプレッドシートのシリアル値（1899-12-30 起点の日数。日付だけなので時差は関係しない）
function dateStringToSheetSerial_(s) {
  return Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10))) / 86400000 + 25569;
}

// 1 セルを setValues と同じ型で書くための CellData と fields
function sheetsApiUserEnteredCell_(tableName, header, value) {
  if (value === true || value === false) return { cell: { userEnteredValue: { boolValue: value } }, fields: 'userEnteredValue' };
  if (typeof value === 'number') return { cell: { userEnteredValue: { numberValue: value } }, fields: 'userEnteredValue' };
  if (Object.prototype.toString.call(value) === '[object Date]') {
    throw new Error('日付オブジェクトの書込みには対応していません（' + tableName + '「' + header + '」）。移行を中止します。');
  }
  var s = String(value == null ? '' : value);
  var isText = (TEXT_FORMAT_COLUMNS_[tableName] || []).indexOf(header) >= 0;
  if (isText) {
    return { cell: { userEnteredValue: { stringValue: s }, userEnteredFormat: { numberFormat: { type: 'TEXT' } } }, fields: 'userEnteredValue,userEnteredFormat.numberFormat' };
  }
  if (isPlainDateString_(s)) {
    return { cell: { userEnteredValue: { numberValue: dateStringToSheetSerial_(s) }, userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } } },
      fields: 'userEnteredValue,userEnteredFormat.numberFormat' };
  }
  if (isPlainNumberString_(s)) return { cell: { userEnteredValue: { numberValue: Number(s) } }, fields: 'userEnteredValue' };
  return { cell: { userEnteredValue: { stringValue: s } }, fields: 'userEnteredValue' };
}

function txBuildRequests_(tx) {
  var requests = [];
  tx.updates.forEach(function(u) {
    var sheet = tx.ss.getSheetByName(u.table);
    var conv = sheetsApiUserEnteredCell_(u.table, u.header, u.value);
    requests.push({ updateCells: {
      start: { sheetId: sheet.getSheetId(), rowIndex: u.row - 1, columnIndex: u.col - 1 },
      rows: [{ values: [conv.cell] }],
      fields: conv.fields,
    } });
  });
  tx.appends.forEach(function(a) {
    var sheet = tx.ss.getSheetByName(a.table);
    var values = txHeaders_(tx, a.table).map(function(h) {
      return sheetsApiUserEnteredCell_(a.table, h, a.obj[h] !== undefined ? a.obj[h] : '').cell;
    });
    requests.push({ appendCells: { sheetId: sheet.getSheetId(), rows: [{ values: values }], fields: 'userEnteredValue,userEnteredFormat.numberFormat' } });
  });
  return requests;
}

// 予約した書込みを 1 回で書く。status: APPLIED（反映）/ NOT_APPLIED（拒否・何も変わっていない）/ UNKNOWN（結果不明）
function txCommit_(tx) {
  var requests = txBuildRequests_(tx); // 変換できない値はここで止まる（まだ何も書いていない）
  if (!requests.length) return { status: 'APPLIED', requests: 0 };
  SpreadsheetApp.flush(); // それまでの SpreadsheetApp の書込み（シートの作成など）を先に確定させる
  var res;
  try {
    res = sheetsApiBatchUpdate_(tx.ss.getId(), requests);
  } catch (e) {
    return { status: 'UNKNOWN', requests: requests.length, reason: 'NO_RESPONSE' };
  }
  if (res.ok) return { status: 'APPLIED', requests: requests.length, ms: res.ms };
  // 5xx は処理されたかが分からない。4xx（429 を含む）は受け付けられていない
  return { status: res.code >= 500 ? 'UNKNOWN' : 'NOT_APPLIED', requests: requests.length, code: res.code, errorStatus: res.errorStatus };
}


function findRowByColumnValue_(sheet, columnName, targetValue) {
  if (sheet.getLastRow() < 2) {
    return null;
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var columns = {};
  for (var i = 0; i < headers.length; i += 1) {
    columns[headers[i]] = i;
  }
  if (columns[columnName] == null) {
    return null;
  }
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r += 1) {
    if (String(data[r][columns[columnName]] || '') === String(targetValue)) {
      return {
        rowNumber: r + 2,
        row: data[r],
        columns: columns,
      };
    }
  }
  return null;
}

function requireColumns_(columns, names) {
  for (var i = 0; i < names.length; i += 1) {
    if (columns[names[i]] == null) {
      throw new Error('スキーマ不足: 列「' + names[i] + '」が見つかりません。rebuildDatabaseSchema() を実行してください。');
    }
  }
}

// v259: ログSSが設定されている場合はそちらに書き込む
function appendLoginHistory_(ss, authId, loginId, authMethod, result, reason) {
  var historySheet = getLogSs_().getSheetByName('T_ログイン履歴');
  if (!historySheet) {
    return;
  }
  historySheet.appendRow([
    'LH-' + Utilities.getUuid(),
    authId || '',
    loginId || '',
    authMethod || '',
    result || '',
    reason || '',
    '',
    '',
    new Date().toISOString(),
  ]);
}

function toBoolean_(v) {
  if (v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1') {
    return true;
  }
  return false;
}

function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}

function startsWith_(value, prefix) {
  return String(value || '').indexOf(String(prefix || '')) === 0;
}

function padNumber_(value, length) {
  var text = String(value || '');
  while (text.length < length) text = '0' + text;
  return text;
}

function createSeededRandom_(seed) {
  var state = Number(seed) || 1;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function shuffleArray_(items, rng) {
  for (var i = items.length - 1; i > 0; i -= 1) {
    var j = Math.floor(rng() * (i + 1));
    var tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

function randomDateString_(rng, startDateStr, endDateStr) {
  var start = new Date(startDateStr + 'T00:00:00+09:00').getTime();
  var end = new Date(endDateStr + 'T00:00:00+09:00').getTime();
  var sampled = start + Math.floor((end - start) * rng());
  return Utilities.formatDate(new Date(sampled), 'Asia/Tokyo', 'yyyy-MM-dd');
}

function randomDateTimeIso_(rng, startDateTimeIso, endDateTimeIso) {
  var start = new Date(startDateTimeIso).getTime();
  var end = new Date(endDateTimeIso).getTime();
  var sampled = start + Math.floor((end - start) * rng());
  return new Date(sampled).toISOString();
}

function addHoursToIsoString_(isoString, hours) {
  var date = new Date(String(isoString || ''));
  if (isNaN(date.getTime())) return '';
  date.setTime(date.getTime() + Number(hours || 0) * 60 * 60 * 1000);
  return date.toISOString();
}

function buildSupportLoginId_(seed) {
  var text = String(seed || '');
  var hash = 0;
  for (var i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  var tail = String(hash % 100000000);
  while (tail.length < 8) tail = '0' + tail;
  return '9' + tail;
}

// ─── 低水準ヘルパー（公開ポータル用追加） ───────────────────────────────────

/**
 * シートの全行をオブジェクト配列として返す（getRowsAsObjects_ のシートオブジェクト版）。
 */
// v376.20: getSheetData_ は getRowsAsObjectsFromSheet_ と機能同一だったため統合・削除。
//   呼び出しは getRowsAsObjectsFromSheet_ に置換済み。

function getLastRowsAsObjects_(ss, sheetName, count) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var rowCount = Math.max(0, Math.min(Number(count) || 0, lastRow - 1));
  if (rowCount < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var startRow = lastRow - rowCount + 1;
  var values = sheet.getRange(startRow, 1, rowCount, lastCol).getValues();
  var rows = [];
  for (var r = 0; r < values.length; r += 1) {
    var obj = {};
    for (var c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = values[r][c];
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * シートにオブジェクト1行を追記する（cols順で値をマッピング）。
 */
function appendRow_(sheet, cols, obj) {
  var row = cols.map(function(c) {
    var v = obj[c];
    return (v === undefined || v === null) ? '' : v;
  });
  sheet.appendRow(row);
}

/**
 * keyColumn が keyValue と一致する行の指定フィールドを更新する。
 */
function updateRowByKey_(sheet, cols, keyColumn, keyValue, updates) {
  if (sheet.getLastRow() < 2) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIndex = {};
  for (var i = 0; i < headers.length; i += 1) {
    colIndex[headers[i]] = i;
  }
  var keyIdx = colIndex[keyColumn];
  if (keyIdx == null) return;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r += 1) {
    if (String(data[r][keyIdx] || '') === String(keyValue)) {
      var updateKeys = Object.keys(updates);
      for (var k = 0; k < updateKeys.length; k += 1) {
        var col = updateKeys[k];
        var idx = colIndex[col];
        if (idx != null) {
          sheet.getRange(r + 2, idx + 1).setValue(updates[col]);
        }
      }
      return;
    }
  }
}
