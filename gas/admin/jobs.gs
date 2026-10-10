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
  handled['warm' + 'Up'] = true;
  handled['runThumbnail' + 'Generation'] = true;
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (handled[existing[i].getHandlerFunction()]) ScriptApp.deleteTrigger(existing[i]);
  }
  // 日次 退会ポリシー（毎日 02:00-03:00 JST）
  ScriptApp.newTrigger('dailyWithdrawalPolicyTrigger').timeBased().everyDays(1).atHour(2).create();

  var names = [];
  var after = ScriptApp.getProjectTriggers();
  for (var n = 0; n < after.length; n++) names.push(after[n].getHandlerFunction());
  Logger.log('setupScheduledTriggers: 現在のトリガー = ' + names.join(', '));
  return JSON.stringify({ triggers: names });
}

function processPendingThumbnails(e) {
  assertTriggerOrMasterOperator_(e, 'processPendingThumbnails');
  try {
    var ss = getOrCreateDatabase_();
    var folder = getOrCreateTrainingFolder_(ss);
    var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
    var MAX_BATCH = 5;
    var processed = 0;
    for (var i = 0; i < rows.length && processed < MAX_BATCH; i += 1) {
      var row = rows[i];
      if (String(row['案内状サムネイルURL'] || '').trim()) continue;
      var pdfUrl = String(row['案内状URL'] || '').trim();
      if (!pdfUrl) continue;
      var m = pdfUrl.match(/\/file\/d\/([^/?]+)/) || pdfUrl.match(/[?&]id=([^&]+)/);
      if (!m) continue;
      try {
        var newUrl = generateAndSaveThumbnailForPdf_(m[1], folder);
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
