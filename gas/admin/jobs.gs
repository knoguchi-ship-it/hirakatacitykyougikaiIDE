// ============================================================
// jobs.gs — 本番の定期ジョブと、その設定・死活確認（自動生成・手編集禁止）
// 時間主導トリガーが叩くハンドラと、トリガーを作り直す設定関数、死活確認。
// **これらは本番で動く。診断ツール（dryrun.gs）と混ぜないこと。**
// トリガーを足すときは gas-src の SCHEDULED_JOBS_ 登録簿にも足す
// （足さないと npm run test:scheduled-jobs が落ちる）。
// helper / 定数は Code.gs 側に残っており、同一プロジェクトのグローバルスコープで参照される。
// 許可リストの正本: scripts/gas-boundary-utils.mjs ADMIN_SCHEDULED_JOB_FUNCTIONS
// ============================================================
function checkScheduledJobHealth() {
  assertMasterOperator_('checkScheduledJobHealth');
  var health = checkScheduledJobHealth_();
  Logger.log(JSON.stringify(health, null, 2));
  return JSON.stringify(health);
}

function dailyWithdrawalPolicyTrigger(e) {
  assertTriggerOrMasterOperator_(e, 'dailyWithdrawalPolicyTrigger');
  return runScheduledJob_('dailyWithdrawalPolicyTrigger', function() {
    applyWithdrawalDeletionPolicyIfNeeded_();
  });
}

function setupScheduledTriggers() {
  assertMasterOperator_('setupScheduledTriggers');
  // build の pruner は文字列中の識別子も「参照」とみなすため、廃止したハンドラ名は
  // 分割して書く。そのまま書くと、削除したはずの実体が生成物に復活する
  // （feedback_build_pruner_regex_action_traps と同じ罠）。
  var handled = {};
  handled['dailyWithdrawalPolicyTrigger'] = true;
  handled['refreshSnapshotsJob'] = true;
  handled['warm' + 'Up'] = true;
  handled['runThumbnail' + 'Generation'] = true;
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (handled[existing[i].getHandlerFunction()]) ScriptApp.deleteTrigger(existing[i]);
  }
  // 日次 退会ポリシー（毎日 02:00-03:00 JST）
  ScriptApp.newTrigger('dailyWithdrawalPolicyTrigger').timeBased().everyDays(1).atHour(2).create();
  // 2026-11-12 docs/332 S1: 画面の完成品の作り直し（10 分ごと）
  ScriptApp.newTrigger('refreshSnapshotsJob').timeBased().everyMinutes(10).create();

  var names = [];
  var after = ScriptApp.getProjectTriggers();
  for (var n = 0; n < after.length; n++) names.push(after[n].getHandlerFunction());
  Logger.log('setupScheduledTriggers: 現在のトリガー = ' + names.join(', '));
  return JSON.stringify({ triggers: names });
}

function refreshSnapshotsJob(e) {
  assertTriggerOrMasterOperator_(e, 'refreshSnapshotsJob');
  var ss = getOrCreateDatabase_();
  var dbModified = getDbLastModifiedMs_(ss);
  var all = PropertiesService.getScriptProperties().getProperties();
  var report = {};
  var failed = false;
  var jobs = [
    { name: 'masters', maxAgeMs: SNAPSHOT_MAX_AGE_MASTERS_MS_, build: function() {
      MASTER_OPTIONS_MEMO_ = null;
      var built = buildAllMasterOptions_(ss);
      MASTER_OPTIONS_MEMO_ = built; // 続く設定の作り直しで使う
      return built;
    } },
    { name: 'settings', maxAgeMs: SNAPSHOT_MAX_AGE_SETTINGS_MS_, build: function() { return getSystemSettings_(); } },
    { name: 'dashboard', maxAgeMs: SNAPSHOT_MAX_AGE_DASHBOARD_MS_, build: buildDashboardSnapshotData_ },
  ];
  jobs.forEach(function(job) {
    try {
      var snap = readSnapshot_(job.name, all);
      if (!snapshotNeedsRebuild_(snap, dbModified, Date.now(), job.maxAgeMs)) { report[job.name] = 'fresh'; return; }
      var startedAt = Date.now();
      var data = job.build();
      var saved = writeSnapshot_(job.name, data, { dbModifiedAtMs: dbModified === null ? -1 : dbModified, buildStartedAtMs: startedAt });
      report[job.name] = saved ? 'rebuilt' : 'not-saved';
      if (!saved) failed = true;
    } catch (err) {
      failed = true;
      report[job.name] = 'error: ' + (err && err.message ? err.message : String(err));
    }
  });
  try {
    getAdminAuthSnapshot_(ss); // 認証の完成品は自分の鮮度の規則で作り直す
    report.auth = 'checked';
  } catch (authErr) {
    failed = true;
    report.auth = 'error: ' + (authErr && authErr.message ? authErr.message : String(authErr));
  }
  console.log('[refreshSnapshotsJob] ' + JSON.stringify(report));
  if (!failed) recordJobHeartbeat_('refreshSnapshotsJob');
  return JSON.stringify(report);
}

function processPendingThumbnails(e) {
  assertTriggerOrMasterOperator_(e, 'processPendingThumbnails');
  try {
    var ss = getOrCreateDatabase_();
    var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
    // 2026-11-12 docs/324 ②: 先に対象（案内状あり・サムネイル無し）を数え、0 件ならフォルダに触れずに終わる。
    // 保存先を開けないときは getTrainingFolder_ が作らずに例外を投げる（下の catch で通知）。
    var targets = [];
    for (var t = 0; t < rows.length; t += 1) {
      if (String(rows[t]['案内状サムネイルURL'] || '').trim()) continue;
      var targetPdfUrl = String(rows[t]['案内状URL'] || '').trim();
      if (!targetPdfUrl) continue;
      var tm = targetPdfUrl.match(/\/file\/d\/([^/?]+)/) || targetPdfUrl.match(/[?&]id=([^&]+)/);
      if (tm) targets.push({ row: rows[t], fileId: tm[1] });
    }
    if (!targets.length) {
      recordJobHeartbeat_('processPendingThumbnails');
      return;
    }
    var folder = getTrainingFolder_(ss);
    var MAX_BATCH = 5;
    var processed = 0;
    for (var i = 0; i < targets.length && processed < MAX_BATCH; i += 1) {
      var row = targets[i].row;
      try {
        var newUrl = generateAndSaveThumbnailForPdf_(targets[i].fileId, folder);
        if (newUrl) {
          updateTrainingThumbnailUrlByRowId_(ss, String(row['研修ID']), newUrl);
          Logger.log('processPendingThumbnails: backfilled trainingId=' + row['研修ID']);
          processed += 1;
        }
      } catch (e) {
        Logger.log('processPendingThumbnails: error trainingId=' + row['研修ID'] + ' ' + e.message);
      }
    }
    if (processed > 0) {
      clearAllDataCache_();
      clearAdminDashboardCache_();
      clearTrainingManagementCache_();
    }
    recordJobHeartbeat_('processPendingThumbnails');
  } catch (e) {
    Logger.log('processPendingThumbnails: fatal ' + e.message);
    notifyScheduledJobFailureToChat_('processPendingThumbnails', e);
  }
}

function setupPendingThumbnailsTrigger() {
  assertMasterOperator_('setupPendingThumbnailsTrigger');
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'processPendingThumbnails') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('processPendingThumbnails').timeBased().everyMinutes(10).create();
  Logger.log('setupPendingThumbnailsTrigger: trigger installed (every 10 min).');
  return { ok: true, intervalMinutes: 10 };
}
