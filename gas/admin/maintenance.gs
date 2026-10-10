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

function regenerateAllThumbnails(payload) {
  assertMasterOperator_('regenerateAllThumbnails');
  var opts = payload || {};
  var trainingId = String(opts.trainingId || '').trim();
  var force = !!opts.force;
  var dryRun = !!opts.dryRun;

  var ss = getOrCreateDatabase_();
  var folder = getOrCreateTrainingFolder_(ss);
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

function deleteTestDataPreview_LOG() {
  assertMasterOperator_('deleteTestDataPreview_LOG');
  var ss = getOrCreateDatabase_();
  var t = _collectTestDataTargets_(ss);
  var summary = {
    counts: {
      auth: t.auth.length,
      members: t.members.length,
      staff: t.staff.length,
      external: t.external.length,
    },
    auth: t.auth.map(function (r) {
      return { 認証ID: r['認証ID'], ログインID: r['ログインID'], 会員ID: r['会員ID'], 職員ID: r['職員ID'] };
    }),
    members: t.members.map(function (r) {
      return { 会員ID: r['会員ID'], 姓: r['姓'], 名: r['名'], セイ: r['セイ'], 勤務先名: r['勤務先名'] };
    }),
    staff: t.staff.map(function (r) {
      return { 職員ID: r['職員ID'], 会員ID: r['会員ID'], 姓: r['姓'], 名: r['名'] };
    }),
    external: t.external.map(function (r) {
      return { 外部申込者ID: r['外部申込者ID'], 氏名: r['氏名'], フリガナ: r['フリガナ'] };
    }),
  };
  Logger.log('=== deleteTestDataPreview_LOG ===');
  Logger.log(JSON.stringify(summary, null, 2));
  return summary;
}

function deleteTestData_APPLY() {
  assertMasterOperator_('deleteTestData_APPLY');
  var ss = getOrCreateDatabase_();
  var t = _collectTestDataTargets_(ss);
  var authIds = t.auth.map(function (r) { return String(r['認証ID']); });
  var memberIds = t.members.map(function (r) { return String(r['会員ID']); });
  var staffIds = t.staff.map(function (r) { return String(r['職員ID']); });
  var extIds = t.external.map(function (r) { return String(r['外部申込者ID']); });

  var result = {
    deleted: {
      auth: dryRun_softDeleteByKey_(ss, 'T_認証アカウント', '認証ID', authIds),
      members: dryRun_softDeleteByKey_(ss, 'T_会員', '会員ID', memberIds),
      staff: dryRun_softDeleteByKey_(ss, 'T_事業所職員', '職員ID', staffIds),
      external: dryRun_softDeleteByKey_(ss, 'T_外部申込者', '外部申込者ID', extIds),
    },
    appliedIds: {
      auth: authIds,
      members: memberIds,
      staff: staffIds,
      external: extIds,
    },
  };
  try { clearAllDataCache_(); } catch (e) {}
  try { clearAdminDashboardCache_(); } catch (e) {}
  Logger.log('=== deleteTestData_APPLY ===');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function previewStrictE2ETestMemberCleanup_LOG() {
  assertMasterOperator_('previewStrictE2ETestMemberCleanup_LOG');
  var targets = collectStrictE2ETestMemberTargets_(getOrCreateDatabase_());
  var counts = {
    auth: targets.auth.length,
    members: targets.members.length,
    staff: targets.staff.length,
    changeRequests: targets.changeRequests.length,
  };
  Logger.log('=== previewStrictE2ETestMemberCleanup_LOG ===');
  Logger.log(JSON.stringify({ counts: counts }));
  return { counts: counts };
}

function executeStrictE2ETestMemberCleanup_APPLY() {
  assertMasterOperator_('executeStrictE2ETestMemberCleanup_APPLY');
  var ss = getOrCreateDatabase_();
  var targets = collectStrictE2ETestMemberTargets_(ss);
  var result = {
    deleted: {
      auth: dryRun_softDeleteByKey_(ss, 'T_認証アカウント', '認証ID', targets.auth.map(function(row) { return String(row['認証ID']); })),
      members: dryRun_softDeleteByKey_(ss, 'T_会員', '会員ID', targets.members.map(function(row) { return String(row['会員ID']); })),
      staff: dryRun_softDeleteByKey_(ss, 'T_事業所職員', '職員ID', targets.staff.map(function(row) { return String(row['職員ID']); })),
      changeRequests: dryRun_softDeleteByKey_(ss, 'T_変更申請', '申請ID', targets.changeRequests.map(function(row) { return String(row['申請ID']); })),
    },
  };
  clearAllDataCache_();
  clearAdminDashboardCache_();
  Logger.log('=== executeStrictE2ETestMemberCleanup_APPLY ===');
  Logger.log(JSON.stringify(result));
  return result;
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
    ['T_支払い', ['会員ID'], []],
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
