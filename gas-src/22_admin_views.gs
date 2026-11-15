// gas-src/22_admin_views.gs — 管理画面のダッシュボード・初期データ。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// 2026-11-12 docs/332 S1: ダッシュボードは完成品（プロパティ）。書き込みの最下層（clearAdminDashboardCache_）で古い印、
// 時間トリガー refreshSnapshotsJob が作り直す。未処理件数も一緒に作る（応答のときに権限で絞る）
function getAdminDashboardData_() {
  return getDashboardSnapshotData_().dashboard;
}

function getDashboardSnapshotData_() {
  return getOrBuildSnapshot_('dashboard', SNAPSHOT_MAX_AGE_DASHBOARD_MS_, buildDashboardSnapshotData_);
}

function buildDashboardSnapshotData_() {
  var count = null;
  try { count = countPendingChangeRequests_(getOrCreateDatabase_()); } catch (e) { count = null; }
  return { dashboard: buildAdminDashboardData_(), pendingChangeRequestCount: count };
}

function buildAdminDashboardData_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  // 必要なシートを 1 回ずつだけ読む。以前は研修申込の妥当性検査が T_会員・T_研修・T_事業所職員を
  // 読み直しており、キャッシュが切れるたびに同じシートを 2 回ずつ読んでいた。
  var dashboardRowsBySheet = getRowsAsObjectsBatch_(ss, [
    'T_会員',
    'T_研修',
    'T_年会費納入履歴',
    'T_研修申込',
    'T_事業所職員',
    'T_外部申込者',
  ]);
  var memberRows = dashboardRowsBySheet['T_会員'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var memberById = {};
  for (var memberMapIdx = 0; memberMapIdx < memberRows.length; memberMapIdx += 1) {
    memberById[String(memberRows[memberMapIdx]['会員ID'] || '')] = memberRows[memberMapIdx];
  }
  var trainingRows = dashboardRowsBySheet['T_研修'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var feeRows = dashboardRowsBySheet['T_年会費納入履歴'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });

  var latestFeeByMember = {};
  for (var feeIdx = 0; feeIdx < feeRows.length; feeIdx += 1) {
    var fee = feeRows[feeIdx];
    var memberId = String(fee['会員ID'] || '');
    if (!memberId) continue;
    var nextYear = Number(fee['対象年度'] || 0);
    var current = latestFeeByMember[memberId];
    if (!current || nextYear > current.year) {
      latestFeeByMember[memberId] = {
        year: nextYear,
        status: String(fee['会費納入状態コード'] || 'UNPAID'),
      };
    }
  }

  // 研修申込データから会員別の今年度参加数を集計（会計年度 4/1〜翌3/31）
  var applicationRows = getTrainingApplicationRows_(ss, {
    appliedOnly: true,
    rows: dashboardRowsBySheet['T_研修申込'],
    context: buildTrainingApplicationRelationContextFromRows_(dashboardRowsBySheet),
  });
  var currentFiscalYear = getCurrentFiscalYear_();
  var fyStart = new Date(currentFiscalYear, 3, 1);      // 4月1日
  var fyEnd   = new Date(currentFiscalYear + 1, 2, 31); // 翌3月31日
  var trainingDateMap = {};
  for (var tIdx = 0; tIdx < trainingRows.length; tIdx += 1) {
    var tr = trainingRows[tIdx];
    trainingDateMap[String(tr['研修ID'] || '')] = String(tr['開催日'] || '');
  }
  var trainingCountByMember = {};
  for (var aIdx = 0; aIdx < applicationRows.length; aIdx += 1) {
    var app = applicationRows[aIdx];
    var tId = String(app['研修ID'] || '');
    var tDate = trainingDateMap[tId] || '';
    if (tDate) {
      var td = new Date(tDate);
      if (td < fyStart || td > fyEnd) continue;
    }
    var appMemberId = getMemberIdFromApplication_(app);
    if (appMemberId) {
      trainingCountByMember[appMemberId] = (trainingCountByMember[appMemberId] || 0) + 1;
    }
  }

  // 事業所職員データ — v143: カラム名を正しい「職員状態コード」に修正
  var staffRows = dashboardRowsBySheet['T_事業所職員'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  // v143: 在籍中（ENROLLED）の職員のみカウント
  var businessStaffCount = staffRows.filter(function(r) {
    return String(r['職員状態コード'] || 'ENROLLED') === 'ENROLLED';
  }).length;
  // 事業所別在籍職員数マップ（フィルタ連動ダッシュボード用）
  var enrolledStaffCountByMember = {};
  for (var siIdx = 0; siIdx < staffRows.length; siIdx += 1) {
    var sr = staffRows[siIdx];
    if (String(sr['職員状態コード'] || 'ENROLLED') !== 'ENROLLED') continue;
    var smid = String(sr['会員ID'] || '');
    if (!smid) continue;
    enrolledStaffCountByMember[smid] = (enrolledStaffCountByMember[smid] || 0) + 1;
  }
  var staffSummaries = staffRows.map(function(staff) {
    var staffMemberId = String(staff['会員ID'] || '');
    var parentMember = memberById[staffMemberId] || {};
    var staffNameFields = normalizeStaffNameFields_(staff);
    return {
      memberId: staffMemberId,
      officeName: String(parentMember['勤務先名'] || ''),
      officeNumber: String(parentMember['事業所番号'] || ''),
      staffId: String(staff['職員ID'] || ''),
      careManagerNumber: String(staff['介護支援専門員番号'] || ''),
      lastName: staffNameFields.lastName,
      firstName: staffNameFields.firstName,
      lastKana: staffNameFields.lastKana,
      firstKana: staffNameFields.firstKana,
      name: staffNameFields.name,
      kana: staffNameFields.kana,
      email: String(staff['メールアドレス'] || ''),
      role: String(staff['職員権限コード'] || 'STAFF'),
      status: String(staff['職員状態コード'] || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED',
      joinedDate: normalizeDateInput_(staff['入会日']),
      withdrawnDate: normalizeDateInput_(staff['退会日']),
      mailingPreference: String(staff['メール配信希望コード'] || 'YES'),
    };
  }).sort(function(a, b) {
    return String(a.officeName || '').localeCompare(String(b.officeName || ''))
      || String(a.name || '').localeCompare(String(b.name || ''))
      || String(a.staffId || '').localeCompare(String(b.staffId || ''));
  });

  // 会員種別別カウント・入退会集計
  // v143: アクティブ会員（ACTIVE / WITHDRAWAL_SCHEDULED）のみカウント
  //       WITHDRAWN は年度退会数で別途集計
  var individualCount = 0;
  var businessCount = 0;
  var activeMemberCount = 0;
  var currentYearJoinedCount = 0;
  var currentYearWithdrawnCount = 0;

  var memberSummaries = memberRows.map(function(member) {
    var memberId = String(member['会員ID'] || '');
    var memberType = String(member['会員種別コード'] || 'INDIVIDUAL');
    var memberStatus = String(member['会員状態コード'] || 'ACTIVE');
    var latestFee = latestFeeByMember[memberId];
    var joinedDateRaw = String(member['入会日'] || '');

    var withdrawnDateRaw = String(member['退会日'] || '');

    // 在籍判定: 入会日が年度末以前 AND (退会日なし OR 退会日が年度開始以降)
    // normalizeDateInput_ でいったん YYYY-MM-DD に正規化してから +09:00 付きでパースすることで
    // GAS の Date.toString() 形式や他の形式に依存せずに安全に日付比較できる。
    var jdNorm = normalizeDateInput_(joinedDateRaw);
    var jdObj = jdNorm ? new Date(jdNorm + 'T00:00:00+09:00') : null;
    var wdNorm = (withdrawnDateRaw && memberStatus === 'WITHDRAWN') ? normalizeDateInput_(withdrawnDateRaw) : '';
    var wdObj = wdNorm ? new Date(wdNorm + 'T00:00:00+09:00') : null;
    // joinedDate がない会員はデータ不備として在籍扱い（フロントエンドと統一）
    var isInFiscalYear = (!jdObj || jdObj <= fyEnd) && (!wdObj || wdObj >= fyStart);
    if (isInFiscalYear) {
      activeMemberCount += 1;
      if (memberType === 'INDIVIDUAL' || memberType === 'SUPPORT') individualCount += 1;
      if (memberType === 'BUSINESS') businessCount += 1;
    }

    if (jdObj && !isNaN(jdObj.getTime())) {
      if (jdObj >= fyStart && jdObj <= fyEnd) currentYearJoinedCount += 1;
    }
    if (wdObj && !isNaN(wdObj.getTime())) {
      if (wdObj >= fyStart && wdObj <= fyEnd) currentYearWithdrawnCount += 1;
    }

    return {
      memberId: memberId,
      displayName: buildAnnualFeeDisplayName_(member),
      // v362: フリガナ検索対応（T_会員 セイ + メイ）
      kana: (String(member['セイ'] || '') + ' ' + String(member['メイ'] || '')).trim(),
      memberType: memberType,
      officeName: String(member['勤務先名'] || ''),
      latestFeeStatus: latestFee ? String(latestFee.status || 'UNPAID') : 'UNPAID',
      trainingCount: trainingCountByMember[memberId] || 0,
      joinedDate: normalizeDateInput_(joinedDateRaw),
      status: memberStatus,
      withdrawnDate: normalizeDateInput_(withdrawnDateRaw),
      enrolledStaffCount: memberType === 'BUSINESS' ? (enrolledStaffCountByMember[memberId] || 0) : undefined,
    };
  }).sort(function(a, b) {
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  });

  var trainingSummaries = trainingRows.map(function(training) {
    return {
      trainingId: String(training['研修ID'] || ''),
      title: String(training['研修名'] || ''),
      date: formatDateForApi_(training['開催日']),
      status: computeTrainingAvailability_(training).isApplicationOpen ? 'OPEN' : 'CLOSED',
      applicants: Number(training['申込者数'] || 0),
      capacity: Number(training['定員'] || 0),
    };
  }).sort(function(a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });

  // v143: アクティブ会員のみを母数とするサマリ
  var activeSummaries = memberSummaries.filter(function(m) {
    return m.status === 'ACTIVE' || m.status === 'WITHDRAWAL_SCHEDULED';
  });
  var activeMembers = memberRows.filter(function(m) {
    var s = String(m['会員状態コード'] || 'ACTIVE');
    return s === 'ACTIVE' || s === 'WITHDRAWAL_SCHEDULED';
  });
  var result = {
    memberCount: activeMemberCount,
    individualCount: individualCount,
    businessCount: businessCount,
    businessStaffCount: businessStaffCount,
    currentFiscalYear: currentFiscalYear,
    currentFiscalYearLabel: currentFiscalYear + '年度',
    currentYearJoinedCount: currentYearJoinedCount,
    currentYearWithdrawnCount: currentYearWithdrawnCount,
    paidCount: activeSummaries.filter(function(member) { return member.latestFeeStatus === 'PAID'; }).length,
    unpaidCount: activeSummaries.filter(function(member) { return member.latestFeeStatus !== 'PAID'; }).length,
    emailCount: activeMembers.filter(function(member) { return String(member['発送方法コード'] || 'EMAIL') === 'EMAIL'; }).length,
    postCount: activeMembers.filter(function(member) { return String(member['発送方法コード'] || 'EMAIL') === 'POST'; }).length,
    openTrainingCount: trainingSummaries.filter(function(training) { return training.status === 'OPEN'; }).length,
    memberRows: memberSummaries,
    staffRows: staffSummaries,
    trainingRows: trainingSummaries,
  };

  return result;
}

// ─── 2026-11-15 docs/332 §13: 管理画面の初期データ（TRD §1.3.1・データ・IF §5.6） ─────────────
// 説明は関数の中に置く（公開・会員の build では関数ごと削られ、外のコメントだけが残るため）。
var ADMIN_BOOT_FORMAT_ = 1;

function buildAdminBootPayload_(report) {
  // doGet（管理 split だけ）で閲覧者を確かめ、完成品を「読むだけ」で画面に埋め込む。画面が出るまでの API を 0 本にする。
  // 中身は API と同じ認可（isActionAllowedForSession_）で絞る＝同じ人に API が返すものと同じ。見られる人は増えない。
  // 管理者でない・完成品が無い・止めている・例外 → null（画面は今までの API の経路で動く）。doGet で作り直しはしない
  // report（任意）: 常時計測のために、埋め込んだか・しなかった理由と、読んだプロパティを返す（docs/332 §13.11）
  var r = report || {};
  r.reason = 'error';
  try {
    var all = PropertiesService.getScriptProperties().getProperties();
    r.props = all;
    // 止めるスイッチ（機能フラグ）: 問題が出たらロールバックせずにプロパティ 1 つで止める。止めていれば認証もしない
    if (String(all.ADMIN_BOOT_DISABLED || '') === 'true') { r.reason = 'disabled'; return null; }
    // 失敗は記録しない（画面が API の経路で認証し直し、そこで 1 回だけ記録する）。成功の記録は表示の後の取り直しで
    var session = null;
    try { session = checkAdminBySession_({ silentFailure: true }); } catch (authErr) { session = null; }
    if (!session || session.canAccessAdminPage !== true) { r.reason = 'not-admin'; return null; }
    var masters = readSnapshot_('masters', all);
    if (!masters) { r.reason = 'no-masters'; return null; }
    var payload = {
      v: ADMIN_BOOT_FORMAT_,
      auth: Object.assign({}, session, { masters: masters.data }),
      init: null,
      initVersion: null,
      initBuiltAtMs: null,
      initStale: false,
    };
    if (isActionAllowedForSession_('getAdminInitData', session)) {
      var dash = readSnapshot_('dashboard', all);
      var settings = readSnapshot_('settings', all);
      if (dash && settings) {
        payload.init = adminInitFromSnapshots_(dash, settings, session);
        payload.initVersion = adminInitVersion_(dash, settings);
        payload.initBuiltAtMs = Math.min(dash.builtAtMs, settings.builtAtMs);
        payload.initStale = !!(dash.stale || settings.stale);
      }
    }
    r.reason = 'embedded';
    r.init = payload.init ? 'embedded' : 'none';
    return payload;
  } catch (e) {
    console.warn('管理画面の初期データを埋め込めませんでした（API の経路で起動します）: ' + (e && e.message ? e.message : e));
    return null;
  }
}

function adminBootScriptTag_(payload) {
  // HTML の先頭に差し込む <script>。< と U+2028・U+2029 を逃がす（</script> で HTML を、行区切りで JS を壊させない）
  // ※ build pruner の罠で正規表現リテラルは使わない（MEMORY: build_pruner_regex_action_traps）
  // ※ U+2028・U+2029 をソースにそのまま書かない（Apps Script の構文解析が ILLEGAL で拒否する・2026-11-15 push 失敗）
  var json = JSON.stringify(payload)
    .split('<').join('\\u003c')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
  return '<script>window.__ADMIN_BOOT__=' + json + ';</script>';
}

function adminInitFromSnapshots_(dash, settings, session) {
  // 初期データの形（getAdminInitData と同じ）。件数は変更申請を見られる人だけ
  var count = null;
  if (isActionAllowedForSession_('getAdminChangeRequests', session)
    && dash.data && typeof dash.data.pendingChangeRequestCount === 'number') {
    count = dash.data.pendingChangeRequestCount;
  }
  return { dashboard: dash.data ? dash.data.dashboard : null, settings: settings.data, pendingChangeRequestCount: count };
}

function adminInitVersion_(dash, settings) {
  return String(dash.gen) + ':' + String(settings.gen);
}

function perfLog_(props, event, fields) {
  // 常時計測（docs/332 §13.11・TRD §6）: 起動の速さを毎回 Cloud Logging に 1 行の JSON で残す。時間・件数・真偽だけ（個人情報は入れない）。
  // スクリプトプロパティ PERF_LOG_DISABLED が true なら出さない。props（読んだプロパティの一覧）が無ければ自分で 1 件だけ読む
  try {
    var disabled = props ? props.PERF_LOG_DISABLED : PropertiesService.getScriptProperties().getProperty('PERF_LOG_DISABLED');
    if (String(disabled || '') === 'true') return;
    var rec = { event: String(event) };
    Object.keys(fields || {}).forEach(function(k) { rec[k] = fields[k]; });
    console.log('[perf] ' + JSON.stringify(rec));
  } catch (e) {
    // 計測の失敗で本来の処理を止めない
  }
}

function sanitizePerfMs_(v) {
  // 画面から届く計時は数値で 0〜10 分のものだけ使う（任意の値をログに残さない）
  if (typeof v !== 'number' || !isFinite(v) || v < 0 || v > 600000) return null;
  return Math.round(v);
}

function refreshAdminInitSnapshot_(name, maxAgeMs, buildFn, all, dbModifiedMs, report) {
  // 表示の後の取り直し用。DB の最終更新日時も含めて確かめ（snapshotNeedsRebuild_）、必要なときだけ作り直して置く
  var snap = readSnapshot_(name, all);
  if (!snapshotNeedsRebuild_(snap, dbModifiedMs, Date.now(), maxAgeMs)) return snap;
  if (report) (report.rebuilt = report.rebuilt || []).push(name);
  var startedAt = Date.now();
  var data = buildFn();
  var saved = writeSnapshot_(name, data, { dbModifiedAtMs: dbModifiedMs === null ? -1 : dbModifiedMs, buildStartedAtMs: startedAt });
  if (saved) {
    var again = readSnapshot_(name, PropertiesService.getScriptProperties().getProperties());
    if (again) return again;
  }
  // 置けなかった: 作った中身で答える。版は毎回違う値にして、画面に必ず差し替えさせる
  return { data: data, gen: 'unsaved-' + startedAt, builtAtMs: Date.now(), dbModifiedAtMs: dbModifiedMs === null ? -1 : dbModifiedMs, stale: false };
}

function buildAdminBootRefresh_(session, knownInitVersion, report) {
  // 表示の後の取り直しの action の中身（認証は呼び出し側で recordLogin つき）。版が同じなら初期データを送らない（docs/332 §13.9 B）
  var result = {
    auth: Object.assign({}, session, { masters: masterOptionsForClient_(null, 'ADMIN') }),
    init: null,
    initVersion: null,
    initUnchanged: false,
  };
  if (!isActionAllowedForSession_('getAdminInitData', session)) return result;
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var dbModified = getDbLastModifiedMs_(ss);
  var all = PropertiesService.getScriptProperties().getProperties();
  var r = report || {};
  r.props = all;
  r.rebuilt = r.rebuilt || [];
  var dash = refreshAdminInitSnapshot_('dashboard', SNAPSHOT_MAX_AGE_DASHBOARD_MS_, buildDashboardSnapshotData_, all, dbModified, r);
  var settings = refreshAdminInitSnapshot_('settings', SNAPSHOT_MAX_AGE_SETTINGS_MS_, function() { return getSystemSettings_(); }, all, dbModified, r);
  // 2026-09-27: 定期ジョブの死活は人が開く経路で評価する（getAdminInitData と同じ）
  try { reportOverdueScheduledJobs_(); } catch (jobErr) {
    console.warn('定期ジョブの死活を評価できませんでした: ' + (jobErr && jobErr.message ? jobErr.message : jobErr));
  }
  var version = adminInitVersion_(dash, settings);
  result.initVersion = version;
  if (knownInitVersion && version === String(knownInitVersion)) {
    result.initUnchanged = true;
    return result;
  }
  result.init = adminInitFromSnapshots_(dash, settings, session);
  return result;
}
