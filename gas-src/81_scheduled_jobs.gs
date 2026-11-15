// gas-src/81_scheduled_jobs.gs — 定期ジョブ。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ── 定期ジョブの登録簿・心拍・死活 ──────────────────────────────────────
//
// 2026-09-27: 定期ジョブのハンドラが build の pruning で 3 split すべての生成物から
// 消えており、登録済みのトリガーが「存在しない関数」を叩き続けていた。
// 退会予定→退会確定の昇格が動いていなかったが、誰も気づけなかった。
// 失敗が見えない状態を作らないため、(1) ジョブを登録簿で持ち、
// (2) 成功のたびに心拍を残し、(3) 遅れと失敗を Chat の「要確認」へ流す。
//
// ジョブは **管理者 split にだけ**置く。公開プロジェクトは匿名アクセスで、
// トップレベル関数は google.script.run から誰でも呼べてしまう
// （scripts/gas-boundary-utils.mjs の assertAllowedTopLevelFunctions が守っている境界）。
var SCHEDULED_JOB_HEARTBEAT_PREFIX_ = 'JOB_HEARTBEAT_';
var SCHEDULED_JOB_ALERT_PREFIX_ = 'JOB_ALERTED_';

// ここが定期ジョブの正本。トリガーを足したら必ずここにも足す
// （scripts/test-scheduled-jobs.mts が登録簿とトリガー宣言の食い違いで落ちる）。
var SCHEDULED_JOBS_ = [
  {
    name: 'dailyWithdrawalPolicyTrigger',
    label: '退会ポリシーの日次適用（退会予定→退会確定の昇格を含む）',
    maxAgeMinutes: 26 * 60,
  },
  {
    name: 'processPendingThumbnails',
    label: '研修案内 PDF のサムネイル生成',
    maxAgeMinutes: 60,
  },
  {
    name: 'refreshSnapshotsJob',
    label: '画面の完成品の作り直し（コールドスタートでも速く出すため・docs/332）',
    maxAgeMinutes: 60,
  },
];

function scheduledJobProps_() {
  return PropertiesService.getScriptProperties();
}

function recordJobHeartbeat_(jobName) {
  try {
    scheduledJobProps_().setProperty(SCHEDULED_JOB_HEARTBEAT_PREFIX_ + jobName, new Date().toISOString());
  } catch (e) {
    Logger.log('[recordJobHeartbeat_] ' + jobName + ': ' + e.message);
  }
}

// 定期ジョブの共通ラッパー。成功したら心拍を残し、落ちたら Chat へ流す。
// メール送信の失敗通知（v376.102）と同じ考え方で、例外は握りつぶさない。
function runScheduledJob_(jobName, body) {
  try {
    var result = body();
    recordJobHeartbeat_(jobName);
    return result;
  } catch (error) {
    notifyScheduledJobFailureToChat_(jobName, error);
    throw error;
  }
}

function notifyScheduledJobFailureToChat_(jobName, error) {
  try {
    notifyMembershipChatSafely_(getOrCreateDatabase_(), 'ANOMALY', {
      '手続種別': '定期ジョブ',
      '申請ID': '',
      '日時': new Date().toISOString(),
      '変更内容': '',
      '異常内容': [
        '定期ジョブが失敗しました。',
        'ジョブ: ' + jobName,
        'エラー: ' + String((error && error.message) || error),
      ].join('\n'),
    });
  } catch (notifyError) {
    Logger.log('[notifyScheduledJobFailureToChat_] failed: ' + notifyError.message);
  }
}

// 遅れているジョブを返す。心拍が無いものは「一度も成功していない」として遅れ扱いにする。
// トリガーが作り直されていない状態を、黙って正常に見せないため。
function checkScheduledJobHealth_() {
  var props = scheduledJobProps_();
  var now = new Date().getTime();
  var jobs = [];
  for (var i = 0; i < SCHEDULED_JOBS_.length; i += 1) {
    var job = SCHEDULED_JOBS_[i];
    var raw = '';
    try { raw = String(props.getProperty(SCHEDULED_JOB_HEARTBEAT_PREFIX_ + job.name) || ''); } catch (e) {}
    var ageMinutes = raw ? Math.floor((now - new Date(raw).getTime()) / 60000) : null;
    jobs.push({
      name: job.name,
      label: job.label,
      lastOkAt: raw,
      ageMinutes: ageMinutes,
      maxAgeMinutes: job.maxAgeMinutes,
      overdue: ageMinutes === null || ageMinutes > job.maxAgeMinutes,
    });
  }
  return { checkedAt: new Date().toISOString(), jobs: jobs };
}

// 管理画面を開いたときに評価する。**トリガーで見張らない**のが肝で、
// 見張り役をトリガーにすると、それ自身が死んだときに誰も気づけない。
// 人が管理画面を開く経路なら、トリガーが全滅していても届く。
// 同じジョブについては 1 日 1 回までしか流さない。
function reportOverdueScheduledJobs_() {
  var health = checkScheduledJobHealth_();
  var overdue = [];
  for (var i = 0; i < health.jobs.length; i += 1) {
    if (health.jobs[i].overdue) overdue.push(health.jobs[i]);
  }
  if (!overdue.length) return health;

  var props = scheduledJobProps_();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var unreported = [];
  for (var j = 0; j < overdue.length; j += 1) {
    var key = SCHEDULED_JOB_ALERT_PREFIX_ + overdue[j].name;
    var last = '';
    try { last = String(props.getProperty(key) || ''); } catch (e) {}
    if (last === today) continue;
    unreported.push(overdue[j]);
    try { props.setProperty(key, today); } catch (e) {}
  }
  if (!unreported.length) return health;

  var lines = ['定期ジョブが動いていません。'];
  for (var k = 0; k < unreported.length; k += 1) {
    var u = unreported[k];
    lines.push('・' + u.label + '（' + u.name + '）: '
      + (u.lastOkAt ? '最終成功 ' + u.lastOkAt : '一度も成功していません')
      + ' / 許容 ' + u.maxAgeMinutes + ' 分');
  }
  lines.push('管理者プロジェクトのスクリプトエディタで setupScheduledTriggers を実行すると作り直せます。');
  try {
    notifyMembershipChatSafely_(getOrCreateDatabase_(), 'ANOMALY', {
      '手続種別': '定期ジョブ',
      '申請ID': '',
      '日時': new Date().toISOString(),
      '変更内容': '',
      '異常内容': lines.join('\n'),
    });
  } catch (notifyError) {
    Logger.log('[reportOverdueScheduledJobs_] failed: ' + notifyError.message);
  }
  return health;
}

// operator が editor から引数なしで実行して状態を見る入口。
function checkScheduledJobHealth() {
  assertMasterOperator_('checkScheduledJobHealth');
  var health = checkScheduledJobHealth_();
  Logger.log(JSON.stringify(health, null, 2));
  return JSON.stringify(health);
}

// v150: 日次トリガーで退会削除ポリシーを実行（ホットパスから除外）
function dailyWithdrawalPolicyTrigger(e) {
  assertTriggerOrMasterOperator_(e, 'dailyWithdrawalPolicyTrigger');
  return runScheduledJob_('dailyWithdrawalPolicyTrigger', function() {
    applyWithdrawalDeletionPolicyIfNeeded_();
  });
}

// トリガー一括セットアップ（editor から手動で 1 回実行）。
//
// 2026-09-27: warmUp（5 分間隔のキャッシュ暖機）は廃止した。暖める CacheService は
// プロジェクトごとに別で、公開プロジェクトに置かないと意味がない。しかしそこへ置くと
// 匿名の利用者が google.script.run から重い DB 全読みを叩けてしまう。
// 実際 pruning で消えたまま長期間動いておらず、体感の悪化も報告されていない。
// 旧 warmUp トリガーが残っていればここで消す。
//
// runThumbnailGeneration も同様に片付ける。これは processPendingThumbnails
// （v351 のサムネイル pipeline）に置き換わった旧世代で、作成元の
// setupThumbnailGenerationTrigger_ はスキーマ再構築（管理者の保守ツール）からしか呼ばれず、
// その保守ツールはどの生成物にも入っていない（＝もう作られない）。
// ※ 公開生成物に保守ツールの関数名を出さない（security:public-boundary）ので、ここでは名前を書かない。
// 過去に作られたトリガーだけが、存在しない関数を叩き続けて残りうる。
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

/**
 * v350: 10 分ごとに時間ベーストリガーから呼ばれる pending backfill。
 * thumbnailUrl 空の T_研修 行を最大 5 件処理する（Apps Script 6 分制限を考慮）。
 * Drive が 5 分以上かけて生成する大きい PDF も時間経過で hasThumbnail=true に
 * なるため、繰り返し trigger で最終的に救済される。
 */
// 2026-11-12 docs/332 S1: 画面の完成品を裏で作り直す（10 分ごと）。冷えた状態で開いても、完成品は必ずある。
// 無い・形式が違う・古い印・DB の最終更新日時が新しい・経過時間の上限を超えたものだけ作り直す（何も変わっていなければ書かない）。
// 1 つが失敗しても他は続ける。全部うまくいったときだけ死活の記録を残す。
function refreshSnapshotsJob(e) {
  assertTriggerOrMasterOperator_(e, 'refreshSnapshotsJob');
  var ss = getOrCreateDatabase_();
  var dbModified = getDbLastModifiedMs_(ss);
  var all = PropertiesService.getScriptProperties().getProperties();
  var report = {};
  var failed = false;
  var jobs = [
    { name: 'masters', maxAgeMs: mastersSnapshotMaxAgeMs_(), build: function() {
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
