// ============================================================
// maintenance.gs — 本番データを書き換える保守ツール（自動生成・手編集禁止）
// **ここの関数は本番データを変える。** backfill / 復元 / テストデータ削除 / スキーマ救済。
// 実行前に必ず対になる preview（_LOG）を先に流して対象を確認すること。
// 試すだけのもの（dryRun E2E・読み取り専用の診断）は dryrun.gs にある。
// helper / 定数は Code.gs 側に残っており、同一プロジェクトのグローバルスコープで参照される。
// 許可リストの正本: scripts/gas-boundary-utils.mjs ADMIN_MAINTENANCE_TOOL_FUNCTIONS
// ============================================================
function forceMarkSchemaInitializedToCurrent() {
  assertMasterOperator_('forceMarkSchemaInitializedToCurrent');
  var props = PropertiesService.getScriptProperties();
  var before = {
    DB_SCHEMA_INITIALIZED: props.getProperty('DB_SCHEMA_INITIALIZED'),
    DB_SCHEMA_INITIALIZED_VERSION: props.getProperty('DB_SCHEMA_INITIALIZED_VERSION'),
  };
  props.setProperty('DB_SCHEMA_INITIALIZED', 'true');
  props.setProperty('DB_SCHEMA_INITIALIZED_VERSION', DB_SCHEMA_VERSION);
  var after = {
    DB_SCHEMA_INITIALIZED: props.getProperty('DB_SCHEMA_INITIALIZED'),
    DB_SCHEMA_INITIALIZED_VERSION: props.getProperty('DB_SCHEMA_INITIALIZED_VERSION'),
  };
  var out = JSON.stringify({
    before: before,
    after: after,
    note: '以降 initializeSchemaIfNeeded_ は no-op になります。研修管理など再試行可能。',
  }, null, 2);
  Logger.log('[forceMarkSchemaInitializedToCurrent] ' + out);
  return out;
}

function rehearseSchemaMigrationOnCopy_APPLY() {
  var session = assertMasterOperator_('rehearseSchemaMigrationOnCopy_APPLY');
  var source = getOrCreateDatabase_();
  var stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
  var copyFile = DriveApp.getFileById(source.getId()).makeCopy('__スキーマ整備リハーサル_' + stamp + '（自動でゴミ箱へ移します）');
  var result = { operator: session.loginId, schemaVersion: DB_SCHEMA_VERSION, plans: {}, firstRun: null, secondRun: null, writeRead: null, verdict: '' };
  try {
    var copy = SpreadsheetApp.openById(copyFile.getId());
    Object.keys(テーブル定義).forEach(function(tableName) {
      var sheet = copy.getSheetByName(tableName);
      if (!sheet) { result.plans[tableName] = { mode: 'missing' }; return; }
      var snap = snapshotSheetForRehearsal_(sheet);
      var hasData = snap.headers.map(function(_, c) {
        return snap.rows.some(function(row) { return row[c] !== ''; });
      });
      var plan = planTableColumnNormalization_(snap.headers, テーブル定義[tableName], hasData);
      if (plan.mode !== 'same') result.plans[tableName] = plan;
    });

    var before = snapshotSpreadsheetForRehearsal_(copy);
    var firstError = '';
    try { initializeSchema_(copy); } catch (e) { firstError = e && e.message ? e.message : String(e); }
    var after = snapshotSpreadsheetForRehearsal_(copy);
    result.firstRun = diffSpreadsheetSnapshotsForRehearsal_(before, after);
    result.firstRun.error = firstError;

    if (!firstError) {
      var secondError = '';
      try { initializeSchema_(copy); } catch (e2) { secondError = e2 && e2.message ? e2.message : String(e2); }
      var again = snapshotSpreadsheetForRehearsal_(copy);
      result.secondRun = diffSpreadsheetSnapshotsForRehearsal_(after, again);
      result.secondRun.error = secondError;
      result.writeRead = rehearseTableWriteRead_(copy);
    }

    var problems = [];
    if (firstError) problems.push('1 回目の整備が止まった');
    if (result.firstRun.issues.length) problems.push('1 回目で既存データが変わった ' + result.firstRun.issues.length + ' 件');
    if (result.secondRun && (result.secondRun.error || result.secondRun.issues.length || result.secondRun.changedTables.length)) {
      problems.push('2 回目でも変化があった（整備が収束しない）');
    }
    if (result.writeRead && result.writeRead.failures.length) problems.push('書いて読む確認が ' + result.writeRead.failures.length + ' 件失敗');
    var textConvertedCount = 0;
    Object.keys(result.firstRun.textConverted || {}).forEach(function(k) { textConvertedCount += result.firstRun.textConverted[k]; });
    result.verdict = problems.length ? 'NG: ' + problems.join(' / ') : 'OK: 既存データの変化 0・2 回目の変化 0・書いて読む確認 ' + (result.writeRead ? result.writeRead.checked : 0) + ' 件'
      + (textConvertedCount ? '・書式なしテキストへ（同じ数字の文字列に）' + textConvertedCount + ' セル' : '');
  } finally {
    copyFile.setTrashed(true);
  }
  var out = JSON.stringify(result, null, 2);
  Logger.log('=== スキーマ整備のリハーサル（本番 DB のコピー）===\n' + out);
  return out;
}

function regenerateAllThumbnails(payload) {
  assertMasterOperator_('regenerateAllThumbnails');
  var opts = payload || {};
  var trainingId = String(opts.trainingId || '').trim();
  var force = !!opts.force;
  var dryRun = !!opts.dryRun;

  var ss = getOrCreateDatabase_();
  var folder = getTrainingFolder_(ss);
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet || sheet.getLastRow() < 2) {
    return { dryRun: dryRun, processed: 0, succeeded: 0, skipped: 0, failed: [] };
  }

  var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  if (trainingId) {
    rows = rows.filter(function(r) { return String(r['研修ID']) === trainingId; });
  }

  var result = { dryRun: dryRun, processed: 0, succeeded: 0, skipped: 0, failed: [] };

  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var pdfUrl = String(row['案内状URL'] || '').trim();
    var existingThumb = String(row['案内状サムネイルURL'] || '').trim();
    if (!pdfUrl) {
      result.skipped += 1;
      continue;
    }
    if (existingThumb && !force) {
      result.skipped += 1;
      continue;
    }
    result.processed += 1;

    var pdfIdMatch = pdfUrl.match(/\/file\/d\/([^/?]+)/) || pdfUrl.match(/[?&]id=([^&]+)/);
    if (!pdfIdMatch) {
      result.failed.push({ id: String(row['研修ID']), name: String(row['研修名']), reason: 'pdf_url_unparseable' });
      continue;
    }
    var pdfId = pdfIdMatch[1];

    if (dryRun) {
      result.succeeded += 1;
      continue;
    }

    try {
      var newThumbUrl = generateAndSaveThumbnailForPdf_(pdfId, folder);
      if (!newThumbUrl) {
        result.failed.push({ id: String(row['研修ID']), name: String(row['研修名']), reason: 'no_thumbnail_link' });
        continue;
      }
      updateTrainingThumbnailUrlByRowId_(ss, String(row['研修ID']), newThumbUrl);
      if (existingThumb) {
        trashFileFromUrlIfPossible_(existingThumb);
      }
      result.succeeded += 1;
      Logger.log('regenerateAllThumbnails: OK trainingId=' + row['研修ID'] + ' -> ' + newThumbUrl);
    } catch (e) {
      var reason = String((e && e.message) || e).substring(0, 200);
      result.failed.push({ id: String(row['研修ID']), name: String(row['研修名']), reason: reason });
      Logger.log('regenerateAllThumbnails: FAIL trainingId=' + row['研修ID'] + ' reason=' + reason);
    }
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return result;
}

function backfillKanaToFullwidth_APPLY() {
  assertMasterOperator_('backfillKanaToFullwidth_APPLY');
  return backfillKanaToFullwidth({ dryRun: false });
}

function backfillKanaToFullwidth(options) {
  assertMasterOperator_('backfillKanaToFullwidth');
  var opts = options || {};
  var dryRun = opts.dryRun !== false; // 既定 dryRun=true（安全側）
  var ss = getOrCreateDatabase_();
  var report = { dryRun: dryRun, tables: {}, totalChanged: 0, totalScanned: 0, errors: [] };

  // 対象テーブルと kana 列の対応
  var targets = [
    { sheetName: 'T_会員', kanaCols: ['セイ', 'メイ'] },
    { sheetName: 'T_事業所職員', kanaCols: ['セイ', 'メイ', 'フリガナ'] },
    { sheetName: 'T_外部申込者', kanaCols: ['フリガナ'] },
  ];

  for (var t = 0; t < targets.length; t++) {
    var target = targets[t];
    var sheet = ss.getSheetByName(target.sheetName);
    var tableReport = { scanned: 0, changed: 0, samples: [], skipped: false, error: null };
    report.tables[target.sheetName] = tableReport;

    if (!sheet) {
      tableReport.skipped = true;
      tableReport.error = 'sheet not found';
      continue;
    }
    if (sheet.getLastRow() < 2) {
      tableReport.skipped = true;
      continue;
    }

    try {
      var lastCol = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var colIdx = {};
      for (var h = 0; h < headers.length; h++) colIdx[headers[h]] = h;

      // 対象列が 1 つでも欠落していたらスキップ（schema-mismatch）
      var missingCols = target.kanaCols.filter(function (c) { return colIdx[c] == null; });
      if (missingCols.length > 0) {
        tableReport.skipped = true;
        tableReport.error = 'missing columns: ' + missingCols.join(',');
        continue;
      }

      var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      var rowsChanged = 0;
      var updates = []; // [{ rowNumber, colIndex, oldValue, newValue }]

      for (var r = 0; r < data.length; r++) {
        tableReport.scanned += 1;
        var rowChanged = false;
        for (var k = 0; k < target.kanaCols.length; k++) {
          var col = target.kanaCols[k];
          var idx = colIdx[col];
          var oldVal = String(data[r][idx] == null ? '' : data[r][idx]);
          if (!oldVal) continue;
          var newVal = normalizeKana_(oldVal);
          if (newVal !== oldVal) {
            data[r][idx] = newVal;
            updates.push({ rowNumber: r + 2, colIndex: idx, col: col, oldValue: oldVal, newValue: newVal });
            rowChanged = true;
            if (tableReport.samples.length < 20) {
              tableReport.samples.push({
                rowNumber: r + 2,
                column: col,
                before: oldVal,
                after: newVal,
              });
            }
          }
        }
        if (rowChanged) rowsChanged += 1;
      }

      tableReport.changed = rowsChanged;
      tableReport.cellUpdates = updates.length;

      if (!dryRun && updates.length > 0) {
        // 一括書き戻し（更新列を保護しつつ data 全体を書き戻す）
        sheet.getRange(2, 1, data.length, lastCol).setValues(data);
        SpreadsheetApp.flush();
      }

      report.totalChanged += rowsChanged;
      report.totalScanned += tableReport.scanned;
    } catch (e) {
      tableReport.error = String(e && e.message ? e.message : e);
      report.errors.push(target.sheetName + ': ' + tableReport.error);
    }
  }

  // Logger 出力（admin editor の実行ログで確認可能）
  Logger.log('=== backfillKanaToFullwidth ' + (dryRun ? '[DRY RUN]' : '[APPLY]') + ' ===');
  Logger.log(JSON.stringify(report, null, 2));

  // キャッシュ無効化（本実行時のみ）
  if (!dryRun && report.totalChanged > 0) {
    try { clearAllDataCache_(); } catch (eCache) {}
    try { clearAdminDashboardCache_(); } catch (eCache2) {}
  }

  return report;
}

function previewTestDataPurge_LOG() {
  var session = assertMasterOperator_('previewTestDataPurge_LOG');
  var plan = buildTestDataPurgePlan_(getOrCreateDatabase_());
  PropertiesService.getScriptProperties().setProperty(TEST_DATA_PURGE_PLAN_KEY, JSON.stringify({
    fingerprint: plan.fingerprint,
    at: Date.now(),
    loginId: session.loginId,
  }));
  Logger.log('=== テストデータの物理削除: 確認 ===\n' + formatTestDataPurgePlan_(plan)
    + (plan.isEmpty ? '\n削除するものはありません。'
      : plan.blockers.length ? '' : '\n内容を確認のうえ、30 分以内に executeTestDataPurge_APPLY を実行してください。'));
  return '__PURGE_JSON__' + JSON.stringify(plan);
}

function executeTestDataPurge_APPLY() {
  var session = assertMasterOperator_('executeTestDataPurge_APPLY');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('ほかの処理が実行中です。少し待ってからやり直してください。');
  try {
    var props = PropertiesService.getScriptProperties();
    var recorded = null;
    try { recorded = JSON.parse(props.getProperty(TEST_DATA_PURGE_PLAN_KEY) || 'null'); } catch (e) { recorded = null; }
    if (!recorded || !recorded.fingerprint) {
      throw new Error('先に previewTestDataPurge_LOG を実行して、削除する内容を確認してください。');
    }
    if (Date.now() - Number(recorded.at || 0) > TEST_DATA_PURGE_PLAN_TTL_MS) {
      throw new Error('確認から 30 分を過ぎました。previewTestDataPurge_LOG をもう一度実行してください。');
    }
    if (recorded.loginId !== session.loginId) {
      throw new Error('確認した人と実行する人が違います。実行する人が previewTestDataPurge_LOG を実行してください。');
    }

    var ss = getOrCreateDatabase_();
    var plan = buildTestDataPurgePlan_(ss);
    if (plan.blockers.length > 0) throw new Error('削除できません:\n' + plan.blockers.join('\n'));
    if (plan.fingerprint !== recorded.fingerprint) {
      throw new Error('確認したあとにデータが変わりました。previewTestDataPurge_LOG をもう一度実行してください。');
    }
    if (plan.isEmpty) {
      props.deleteProperty(TEST_DATA_PURGE_PLAN_KEY);
      return '__PURGE_JSON__' + JSON.stringify({ removed: {}, message: '削除するものはありませんでした。' });
    }

    var memberIdSet = idSetOf_(plan.memberIds);
    var staffIdSet = idSetOf_(plan.staffIds);
    var externalIdSet = idSetOf_(plan.externalIds);
    var removed = { drive: trashClaimAttachmentFiles_(ss, plan.claimFileIds) };
    getTestDataPurgeMatchers_(memberIdSet, staffIdSet, idSetOf_(plan.paymentIds), externalIdSet).forEach(function(pair) {
      removed[pair[0]] = takeRowsByMatch_(ss.getSheetByName(pair[0]), pair[1]).length;
      if (ss.getSheetByName(pair[0] + '_archive')) {
        removed[pair[0] + '_archive'] = takeRowsByMatch_(ss.getSheetByName(pair[0] + '_archive'), pair[1]).length;
      }
    });
    removed['T_ログイン履歴'] = purgeLoginHistoryByAuthIds_(idSetOf_(plan.authIds));
    var logMatchers = getTestDataPurgeLogMatchers_(memberIdSet, staffIdSet, externalIdSet);
    removed['T_メール送信明細'] = takeRowsByMatch_(getLogSs_().getSheetByName('T_メール送信明細'), logMatchers['T_メール送信明細']).length;
    removed['T_削除ログ'] = takeRowsByMatch_(ss.getSheetByName('T_削除ログ'), logMatchers['T_削除ログ']).length;
    removed['T_人物統合ログ'] = takeRowsByMatch_(ss.getSheetByName('T_人物統合ログ'), logMatchers['T_人物統合ログ']).length;
    // 2026-10-11 に廃止した dryRun 後片付けの記録（読む側がもう無い）
    if (props.getProperty(DRYRUN_MANIFEST_KEY)) {
      props.deleteProperty(DRYRUN_MANIFEST_KEY);
      removed.legacyDryRunManifest = 1;
    }

    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    clearAdminPermissionCaches_();

    var after = buildTestDataPurgePlan_(ss);
    appendAuditLogEntries_([{
      operatorEmail: session.loginId,
      operation: 'TEST_DATA_PURGE',
      recordId: plan.fingerprint,
      fieldName: 'removed',
      newValue: JSON.stringify({ members: plan.memberIds, staff: plan.staffIds, externals: plan.externalIds, removed: removed }),
    }]);
    props.deleteProperty(TEST_DATA_PURGE_PLAN_KEY);
    Logger.log('=== テストデータの物理削除: 完了 ===\n' + JSON.stringify(removed) + '\n削除後の残り: ' + after.totalRows + ' 行');
    return '__PURGE_JSON__' + JSON.stringify({ removed: removed, remainingRows: after.totalRows });
  } finally {
    lock.releaseLock();
  }
}

function previewTrainingTestDataPurge_LOG() {
  var session = assertMasterOperator_('previewTrainingTestDataPurge_LOG');
  return previewTrainingPurge_(session, 'executeTrainingTestDataPurge_APPLY', TRAINING_PURGE_PLAN_KEY);
}

function executeTrainingTestDataPurge_APPLY() {
  var session = assertMasterOperator_('executeTrainingTestDataPurge_APPLY');
  return executeTrainingPurge_(session, 'previewTrainingTestDataPurge_LOG', TRAINING_PURGE_PLAN_KEY, 'TRAINING_TEST_DATA_PURGE');
}

function profileLoadCost_LOG() {
  var session = assertMasterOperator_('profileLoadCost_LOG');
  var steps = [];
  var info = { operator: session.loginId, startedAt: new Date().toISOString() };

  // スクリプトプロパティ: 1 件ずつと一括
  var props = PropertiesService.getScriptProperties();
  for (var p = 0; p < 3; p += 1) profileTime_('props.getProperty(DB_SPREADSHEET_ID) #' + (p + 1), steps, function() { return props.getProperty(DB_SPREADSHEET_ID_KEY); });
  var allProps = null;
  for (var q = 0; q < 3; q += 1) allProps = profileTime_('props.getProperties() #' + (q + 1), steps, function() { return props.getProperties(); });
  if (allProps) {
    var propBytes = 0;
    Object.keys(allProps).forEach(function(k) { propBytes += k.length + String(allProps[k]).length; });
    info.properties = { count: Object.keys(allProps).length, totalChars: propBytes, limitBytes: 500 * 1024 };
  }

  // キャッシュ: 無いキー・小さい値・大きい値（ダッシュボードの分割キャッシュ）
  var cache = CacheService.getScriptCache();
  for (var c = 0; c < 3; c += 1) profileTime_('cache.get(無いキー) #' + (c + 1), steps, function() { return cache.get('__profile_missing__'); });
  profileTime_('cache.get(admin_wl_v1)', steps, function() { return cache.get('admin_wl_v1'); });
  var dashCached = profileTime_('getChunkedCache_(adminDashboard)', steps, function() { return getChunkedCache_(cache, getAdminDashboardCacheKey_()); });
  info.dashboardCacheHit = !!dashCached;
  profileTime_('getChunkedCache_(masterOptions)', steps, function() { return getChunkedCache_(cache, MASTER_OPTIONS_CACHE_KEY_); });

  // DB を開く（getOrCreateDatabase_ は結果を覚えないので、1 回の要求で何度も呼ぶと毎回この時間がかかる）
  var ss = null;
  for (var o = 0; o < 3; o += 1) ss = profileTime_('SpreadsheetApp.openById #' + (o + 1), steps, function() { return SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED); });
  profileTime_('getOrCreateDatabase_()', steps, function() { return getOrCreateDatabase_(); });
  var sheets = profileTime_('ss.getSheets()', steps, function() { return ss.getSheets(); }) || [];
  var grid = [];
  var totalMaxCells = 0;
  var totalUsedCells = 0;
  sheets.forEach(function(sh) {
    var maxCells = sh.getMaxRows() * sh.getMaxColumns();
    var usedCells = sh.getLastRow() * sh.getLastColumn();
    totalMaxCells += maxCells;
    totalUsedCells += usedCells;
    grid.push({ name: sh.getName(), lastRow: sh.getLastRow(), lastCol: sh.getLastColumn(), maxRows: sh.getMaxRows(), maxCols: sh.getMaxColumns() });
  });
  info.db = { sheetCount: sheets.length, totalMaxCells: totalMaxCells, totalUsedCells: totalUsedCells, sheets: grid };

  // 表を読む: 小さい表 1 枚・ダッシュボードの 6 枚（SpreadsheetApp）・同じ 6 枚（Sheets REST batchGet・1 回）
  profileTime_('read T_システム設定 (SpreadsheetApp)', steps, function() { return getRowsAsObjects_(ss, 'T_システム設定'); });
  var dashboardSheets = ['T_会員', 'T_研修', 'T_年会費納入履歴', 'T_研修申込', 'T_事業所職員', 'T_外部申込者'];
  profileTime_('read 6 sheets (getRowsAsObjectsBatch_)', steps, function() { return getRowsAsObjectsBatch_(ss, dashboardSheets); });
  var token = ScriptApp.getOAuthToken();
  var batchQuery = dashboardSheets.map(function(name) { return 'ranges=' + encodeURIComponent("'" + name + "'"); }).join('&');
  var restBody = profileTime_('read 6 sheets (Sheets REST values:batchGet)', steps, function() {
    var res = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + DB_SPREADSHEET_ID_FIXED + '/values:batchGet?' + batchQuery
      + '&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING',
      { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
    return res.getContentText();
  });
  if (restBody) info.sheetsRestBytes = restBody.length;

  // DB の最終更新日時（DB を開かずに変化を知る手段の候補）
  for (var d = 0; d < 3; d += 1) profileTime_('DriveApp.getFileById(DB).getLastUpdated #' + (d + 1), steps, function() { return DriveApp.getFileById(DB_SPREADSHEET_ID_FIXED).getLastUpdated(); });
  var modified = profileTime_('Drive REST files.get(modifiedTime)', steps, function() {
    var res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + DB_SPREADSHEET_ID_FIXED + '?fields=modifiedTime&supportsAllDrives=true',
      { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
    return JSON.parse(res.getContentText()).modifiedTime;
  });
  info.dbModifiedTime = modified || '';

  // 実際の処理（管理 API の中身。書き込みを伴う reportOverdueScheduledJobs_ は使わず、読むだけの checkScheduledJobHealth_）
  profileTime_('checkAdminBySession_() (ログイン記録なし)', steps, function() { return checkAdminBySession_(); });
  var settings = profileTime_('getSystemSettings_()', steps, function() { return getSystemSettings_(); });
  var dashboard = profileTime_('getAdminDashboardData_()', steps, function() { return getAdminDashboardData_(); });
  profileTime_('checkScheduledJobHealth_()', steps, function() { return checkScheduledJobHealth_(); });
  var changeRequests = profileTime_('getAdminChangeRequests_(PENDING)', steps, function() { return getAdminChangeRequests_({ status: 'PENDING' }); });
  var publicTrainings = profileTime_('getPublicTrainings_()', steps, function() { return getPublicTrainings_(); });
  var publicSettings = profileTime_('getPublicPortalSettings_()', steps, function() { return getPublicPortalSettings_(); });
  info.sizes = {
    settingsChars: settings ? JSON.stringify(settings).length : null,
    dashboardChars: dashboard ? JSON.stringify(dashboard).length : null,
    changeRequestCount: changeRequests ? changeRequests.length : null,
    publicTrainingsChars: publicTrainings ? JSON.stringify(publicTrainings).length : null,
    publicSettingsChars: publicSettings ? JSON.stringify(publicSettings).length : null,
  };

  var result = { info: info, steps: steps };
  // エディタの実行ログは長いと切れる（2026-11-12 に表一覧で切れた）。計測値を先に 1 行ずつ出す。
  steps.forEach(function(s) { Logger.log('STEP ' + s.ms + 'ms\t' + s.step + (s.error ? '\tERROR ' + s.error : '')); });
  Logger.log('SIZES ' + JSON.stringify(info.sizes) + ' restBytes=' + info.sheetsRestBytes + ' dashCacheHit=' + info.dashboardCacheHit
    + ' props=' + JSON.stringify(info.properties) + ' dbModified=' + info.dbModifiedTime);
  Logger.log('DB sheets=' + info.db.sheetCount + ' maxCells=' + info.db.totalMaxCells + ' usedCells=' + info.db.totalUsedCells);
  return '__PROFILE_JSON__' + JSON.stringify(result);
}

function profileStoreWriteCost_APPLY() {
  var session = assertMasterOperator_('profileStoreWriteCost_APPLY');
  var steps = [];
  var stamp = String(Date.now());
  var props = PropertiesService.getScriptProperties();
  var cache = CacheService.getScriptCache();
  var chunk9k = new Array(9001).join('x'); // 9,000 文字（プロパティ 1 値の上限 9 KB の手前）
  var propKeys = [];
  for (var i = 0; i < 5; i += 1) propKeys.push('__profile_tmp_' + stamp + '_' + i);
  var removedProps = 0;
  try {
    profileTime_('props.setProperty(9KB) ×1', steps, function() { props.setProperty(propKeys[0], chunk9k); });
    var batch = {};
    propKeys.forEach(function(k) { batch[k] = chunk9k; });
    profileTime_('props.setProperties(9KB ×5)', steps, function() { props.setProperties(batch, false); });
    var readBack = profileTime_('props.getProperties()（45KB を足した後）', steps, function() { return props.getProperties(); });
    var ok = !!readBack && propKeys.every(function(k) { return readBack[k] === chunk9k; });
    steps.push({ step: 'props 読み戻しの一致', ok: ok });
    profileTime_('cache.put(90KB) ×1', steps, function() { cache.put('__profile_tmp_' + stamp, new Array(90001).join('y'), 60); });
    var big = { rows: [] };
    for (var r = 0; r < 1500; r += 1) big.rows.push({ id: 'ID' + r, name: 'name-' + r, note: chunk9k.substring(0, 60) });
    profileTime_('putChunkedCache_(約 150KB)', steps, function() { putChunkedCache_(cache, '__profile_tmp_big_' + stamp, big, 60); });
    var back = profileTime_('getChunkedCache_(約 150KB)', steps, function() { return getChunkedCache_(cache, '__profile_tmp_big_' + stamp); });
    steps.push({ step: 'cache 読み戻しの一致', ok: !!back && back.rows.length === 1500 });
  } finally {
    propKeys.forEach(function(k) { try { props.deleteProperty(k); removedProps += 1; } catch (e) {} });
    try { cache.remove('__profile_tmp_' + stamp); removeChunkedCache_(cache, '__profile_tmp_big_' + stamp); } catch (e) {}
  }
  var leftover = Object.keys(props.getProperties()).filter(function(k) { return k.indexOf('__profile_tmp_') === 0; });
  var result = { operator: session.loginId, steps: steps, removedProps: removedProps, leftoverTmpProps: leftover.length };
  steps.forEach(function(s) { Logger.log('STEP ' + (s.ms === undefined ? '' : s.ms + 'ms') + '\t' + s.step + (s.ok === undefined ? '' : '\tok=' + s.ok) + (s.error ? '\tERROR ' + s.error : '')); });
  Logger.log('removedProps=' + removedProps + ' leftoverTmpProps=' + leftover.length);
  return '__PROFILE_WRITE_JSON__' + JSON.stringify(result);
}

function profileDoGetCost_LOG() {
  assertMasterOperator_('profileDoGetCost_LOG');
  var steps = [];
  var props = PropertiesService.getScriptProperties();
  for (var a = 0; a < 3; a += 1) {
    profileTime_('getProperty×3（今の doGet） #' + (a + 1), steps, function() {
      props.getProperty('SCRIPT_ID_MEMBER'); props.getProperty('SCRIPT_ID_ADMIN'); props.getProperty('SCRIPT_ID_PUBLIC');
    });
  }
  var all = null;
  for (var b = 0; b < 3; b += 1) all = profileTime_('getProperties() 1 回 #' + (b + 1), steps, function() { return props.getProperties(); });
  var propChars = 0;
  Object.keys(all || {}).forEach(function(k) { propChars += String(all[k] || '').length; });
  var raw = null;
  for (var c = 0; c < 3; c += 1) raw = profileTime_('createHtmlOutputFromFile(index).getContent() #' + (c + 1), steps, function() { return HtmlService.createHtmlOutputFromFile('index').getContent(); });
  for (var d = 0; d < 3; d += 1) profileTime_('ScriptApp.getService().getUrl() #' + (d + 1), steps, function() { return ScriptApp.getService().getUrl(); });
  var padded = null;
  for (var f = 0; f < 3; f += 1) padded = profileTime_('文字列の差し込み（120 KB の JSON を先頭へ） #' + (f + 1), steps, function() {
    return '<script>window.__ADMIN_BOOT__=' + JSON.stringify({ x: new Array(120000).join('a') }) + ';</script>' + raw;
  });
  for (var g = 0; g < 3; g += 1) profileTime_('createHtmlOutput(＋120 KB)＋setTitle・XFrame・meta・favicon #' + (g + 1), steps, function() {
    var out = HtmlService.createHtmlOutput(padded).setTitle('t')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
    out.setFaviconUrl('data:image/png;base64,iVBORw0KGgo=');
    return out;
  });
  for (var h = 0; h < 3; h += 1) profileTime_('Session.getActiveUser().getEmail() #' + (h + 1), steps, function() { return Session.getActiveUser().getEmail(); });
  for (var i = 0; i < steps.length; i += 1) Logger.log('STEP ' + steps[i].ms + 'ms\t' + steps[i].step);
  Logger.log('SIZES html=' + (raw ? raw.length : 0) + ' props=' + Object.keys(all || {}).length + '件/' + propChars + '文字');
  return '__PROFILE_DOGET_JSON__' + JSON.stringify({ steps: steps, htmlChars: raw ? raw.length : 0, propCount: Object.keys(all || {}).length, propChars: propChars });
}

function probeDriveModifiedLag_APPLY() {
  assertMasterOperator_('probeDriveModifiedLag_APPLY');
  var stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
  var token = ScriptApp.getOAuthToken();
  var viaApp = SpreadsheetApp.create('__Drive反映遅れの計測_App_' + stamp);
  var viaRest = SpreadsheetApp.create('__Drive反映遅れの計測_REST_' + stamp);
  var files = [
    { label: 'SpreadsheetApp', id: viaApp.getId() },
    { label: 'SheetsREST', id: viaRest.getId() },
  ];
  var results = [];
  try {
    Utilities.sleep(60000);
    for (var b = 0; b < files.length; b += 1) files[b].before = readDriveModifiedPair_(files[b].id, token);
    var wroteAt = Date.now();
    viaApp.getSheets()[0].getRange('A1').setValue('probe ' + wroteAt);
    SpreadsheetApp.flush();
    UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + files[1].id + '/values/A1?valueInputOption=RAW', {
      method: 'put', contentType: 'application/json', headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({ values: [['probe ' + wroteAt]] }),
    });
    for (var f = 0; f < files.length; f += 1) { files[f].appLagMs = null; files[f].restLagMs = null; }
    for (var i = 0; i < 80; i += 1) {
      var pending = false;
      for (var k = 0; k < files.length; k += 1) {
        var x = files[k];
        if (x.appLagMs !== null && x.restLagMs !== null) continue;
        var now = readDriveModifiedPair_(x.id, token);
        if (x.appLagMs === null && now.app > x.before.app) x.appLagMs = Date.now() - wroteAt;
        if (x.restLagMs === null && now.rest > x.before.rest) x.restLagMs = Date.now() - wroteAt;
        if (x.appLagMs === null || x.restLagMs === null) pending = true;
      }
      if (!pending || Date.now() - wroteAt > 240000) break;
      Utilities.sleep(3000);
    }
    for (var r = 0; r < files.length; r += 1) results.push({ label: files[r].label, appLagMs: files[r].appLagMs, restLagMs: files[r].restLagMs, watchedMs: Date.now() - wroteAt });
  } finally {
    for (var t = 0; t < files.length; t += 1) {
      try { DriveApp.getFileById(files[t].id).setTrashed(true); } catch (e) { Logger.log('一時スプレッドシートをゴミ箱へ移せませんでした: ' + e.message); }
    }
  }
  for (var q = 0; q < results.length; q += 1) Logger.log(JSON.stringify(results[q]));
  return '__DRIVE_LAG_JSON__' + JSON.stringify(results);
}

function previewPhoneZeroRepair_LOG() {
  var session = assertMasterOperator_('previewPhoneZeroRepair_LOG');
  var plan = buildPhoneZeroRepairPlan_(getOrCreateDatabase_());
  PropertiesService.getScriptProperties().setProperty(PHONE_ZERO_REPAIR_PLAN_KEY, JSON.stringify({
    fingerprint: plan.fingerprint, at: Date.now(), loginId: session.loginId,
  }));
  var shown = maskedPhoneZeroRepairItems_(plan.items);
  Logger.log('=== 電話番号の先頭の 0: 確認 ===\n' + (shown.length ? shown.map(function(it) {
    return it.sheet + ' ' + it.row + '行目（' + it.id + '）' + it.column + ': ' + it.before + ' → ' + it.after;
  }).join('\n') + '\n内容を確認のうえ、30 分以内に executePhoneZeroRepair_APPLY を実行してください。' : '直すものはありません。'));
  return '__PHONE_JSON__' + JSON.stringify({ count: plan.items.length, items: shown, fingerprint: plan.fingerprint });
}

function executePhoneZeroRepair_APPLY() {
  var session = assertMasterOperator_('executePhoneZeroRepair_APPLY');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('ほかの処理が実行中です。少し待ってからやり直してください。');
  try {
    var props = PropertiesService.getScriptProperties();
    var recorded = null;
    try { recorded = JSON.parse(props.getProperty(PHONE_ZERO_REPAIR_PLAN_KEY) || 'null'); } catch (e) { recorded = null; }
    if (!recorded || !recorded.fingerprint) throw new Error('先に previewPhoneZeroRepair_LOG を実行して、直す内容を確認してください。');
    if (Date.now() - Number(recorded.at || 0) > TEST_DATA_PURGE_PLAN_TTL_MS) throw new Error('確認から 30 分を過ぎました。previewPhoneZeroRepair_LOG をもう一度実行してください。');
    if (recorded.loginId !== session.loginId) throw new Error('確認した人と実行する人が違います。実行する人が previewPhoneZeroRepair_LOG を実行してください。');

    var ss = getOrCreateDatabase_();
    var plan = buildPhoneZeroRepairPlan_(ss);
    if (plan.fingerprint !== recorded.fingerprint) throw new Error('確認したあとにデータが変わりました。previewPhoneZeroRepair_LOG をもう一度実行してください。');
    plan.items.forEach(function(it) {
      ss.getSheetByName(it.sheet).getRange(it.row, it.col).setNumberFormat('@').setValue(it.after);
    });
    if (plan.items.length) {
      appendAuditLogEntries_(plan.items.map(function(it) {
        return { operatorEmail: session.loginId, operation: 'PHONE_ZERO_REPAIR', tableName: it.sheet, recordId: it.id,
          fieldName: it.column, oldValue: it.before, newValue: it.after };
      }));
      clearAllDataCache_();
    }
    props.deleteProperty(PHONE_ZERO_REPAIR_PLAN_KEY);
    var after = buildPhoneZeroRepairPlan_(ss);
    Logger.log('=== 電話番号の先頭の 0: 完了 === ' + plan.items.length + ' セル・残り ' + after.items.length);
    return '__PHONE_JSON__' + JSON.stringify({ repaired: plan.items.length, remaining: after.items.length, items: maskedPhoneZeroRepairItems_(plan.items) });
  } finally {
    lock.releaseLock();
  }
}

function restoreLastArchiveBatch_APPLY() {
  assertMasterOperator_('restoreLastArchiveBatch_APPLY');
  var ss = getOrCreateDatabase_();
  var logs = getRowsAsObjects_(ss, 'T_削除ログ');
  if (logs.length === 0) throw new Error('T_削除ログ が空です（復元対象なし）。');
  var lastLogId = String(logs[logs.length - 1]['ログID'] || '');
  var result = restoreArchiveBatch_(lastLogId);
  Logger.log(JSON.stringify(result, null, 2));
  return JSON.stringify(result);
}

function listArchiveBatches_LOG() {
  assertMasterOperator_('listArchiveBatches_LOG');
  var ss = getOrCreateDatabase_();
  var byBatch = {};
  for (var i = 0; i < ARCHIVE_SOURCE_TABLES.length; i++) {
    var srcName = ARCHIVE_SOURCE_TABLES[i];
    var rows = getRowsAsObjects_(ss, srcName + '_archive');
    for (var r = 0; r < rows.length; r++) {
      var bid = String(rows[r]['削除バッチID'] || '(none)');
      if (!byBatch[bid]) byBatch[bid] = { total: 0, tables: {} };
      byBatch[bid].total++;
      byBatch[bid].tables[srcName] = (byBatch[bid].tables[srcName] || 0) + 1;
    }
  }
  var logs = getRowsAsObjects_(ss, 'T_削除ログ');
  for (var l = 0; l < logs.length; l++) {
    var logIdVal = String(logs[l]['ログID'] || '');
    if (byBatch[logIdVal]) {
      byBatch[logIdVal].deletedAt = String(logs[l]['操作日時'] || '');
      byBatch[logIdVal].operator = String(logs[l]['操作者メール'] || '');
      byBatch[logIdVal].targetKeys = String(logs[l]['対象会員IDリスト'] || '');
    }
  }
  var result = { batches: byBatch, generatedAt: new Date().toISOString() };
  Logger.log(JSON.stringify(result, null, 2));
  return JSON.stringify(result);
}

function diagnoseMemberDeleteDebt_LOG() {
  assertMasterOperator_('diagnoseMemberDeleteDebt_LOG');
  var ss = getOrCreateDatabase_();
  var members = getRowsAsObjects_(ss, 'T_会員');
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員');
  var liveMemberIds = {};
  var deletedMemberIds = {};
  for (var m = 0; m < members.length; m++) {
    var mid = String(members[m]['会員ID'] || '');
    if (!mid) continue;
    if (toBoolean_(members[m]['削除フラグ'])) deletedMemberIds[mid] = true;
    else liveMemberIds[mid] = true;
  }
  var liveStaffIds = {};
  var deletedStaffIds = {};
  for (var s = 0; s < staffs.length; s++) {
    var sid = String(staffs[s]['職員ID'] || '');
    if (!sid) continue;
    if (toBoolean_(staffs[s]['削除フラグ'])) deletedStaffIds[sid] = true;
    else liveStaffIds[sid] = true;
  }

  // 子テーブル別に「削除済み会員/職員を参照」「存在しないIDを参照」の live 行を数える
  var childRefSpecs = [
    ['T_研修申込', ['会員ID'], ['職員ID']],
    ['T_年会費納入履歴', ['会員ID'], []],
    ['T_年会費更新履歴', ['会員ID'], []],
    ['T_役員', ['会員ID'], ['職員ID']],
    ['T_振込口座', ['会員ID'], ['職員ID']],
    ['T_支払い', ['会員ID'], ['職員ID']],
    ['T_請求', ['会員ID'], ['職員ID']],
    ['T_変更申請', ['会員ID'], []],
    ['T_管理者Googleホワイトリスト', ['紐付け会員ID'], []],
    ['T_認証アカウント', ['会員ID'], ['職員ID']],
  ];
  var orphans = {};
  for (var t = 0; t < childRefSpecs.length; t++) {
    var tableName = childRefSpecs[t][0];
    var memberCols = childRefSpecs[t][1];
    var staffCols = childRefSpecs[t][2];
    var rows = getRowsAsObjects_(ss, tableName);
    var refDeleted = 0;
    var refMissing = 0;
    var liveRowCount = 0;
    for (var r2 = 0; r2 < rows.length; r2++) {
      if (toBoolean_(rows[r2]['削除フラグ'])) continue;
      liveRowCount++;
      var flaggedDeleted = false;
      var flaggedMissing = false;
      for (var mc = 0; mc < memberCols.length; mc++) {
        var refM = String(rows[r2][memberCols[mc]] || '');
        if (!refM) continue;
        if (deletedMemberIds[refM]) flaggedDeleted = true;
        else if (!liveMemberIds[refM]) flaggedMissing = true;
      }
      for (var sc = 0; sc < staffCols.length; sc++) {
        var refS = String(rows[r2][staffCols[sc]] || '');
        if (!refS) continue;
        if (deletedStaffIds[refS]) flaggedDeleted = true;
        else if (!liveStaffIds[refS]) flaggedMissing = true;
      }
      if (flaggedDeleted) refDeleted++;
      else if (flaggedMissing) refMissing++;
    }
    orphans[tableName] = { liveRows: liveRowCount, refSoftDeleted: refDeleted, refMissing: refMissing };
  }

  var report = {
    schemaVersion: DB_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    members: {
      total: members.length,
      live: Object.keys(liveMemberIds).length,
      softDeleted: Object.keys(deletedMemberIds).length,
    },
    staffs: {
      total: staffs.length,
      live: Object.keys(liveStaffIds).length,
      softDeleted: Object.keys(deletedStaffIds).length,
    },
    orphans: orphans,
    note: 'refSoftDeleted=削除済み会員/職員を参照する live 行, refMissing=存在しないIDを参照する live 行。バックフィル要否判断用（docs/249 §7）',
  };
  Logger.log(JSON.stringify(report, null, 2));
  return JSON.stringify(report);
}
