// ============================================================
// dryrun.gs — dryRun E2E と読み取り専用の診断（自動生成・手編集禁止）
// 自分で作って自分で消す dryRun E2E と、データを変えない診断だけ。
// 本番データを書き換えるものは maintenance.gs、定期実行されるものは jobs.gs。
// helper / 定数は Code.gs 側に残っており、同一プロジェクトのグローバルスコープで参照される。
// 許可リストの正本: scripts/gas-boundary-utils.mjs ADMIN_OPERATOR_TOOL_FUNCTIONS
// ============================================================
function probeSheetsBatchUpdate_APPLY() {
  var session = assertMasterOperator_('probeSheetsBatchUpdate_APPLY');
  var started = Date.now();
  var stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
  var temp = SpreadsheetApp.create(SHEETS_PROBE_FILE_PREFIX_ + 'P_' + stamp + '（自動でゴミ箱へ移します）');
  var report = { operator: session.loginId, startedAt: new Date(started).toISOString(), checks: [], trashed: false, verdict: '' };
  try {
    runSheetsBatchUpdateProbes_(temp, report);
  } catch (e) {
    report.checks.push({ id: 'ABORT', passed: false, detail: String(e && e.message ? e.message : e) });
  } finally {
    try {
      DriveApp.getFileById(temp.getId()).setTrashed(true);
      report.trashed = true;
    } catch (e2) {
      report.trashError = String(e2 && e2.message ? e2.message : e2);
    }
  }
  report.elapsedMs = Date.now() - started;
  var failed = report.checks.filter(function(c) { return !c.passed; }).map(function(c) { return c.id; });
  report.verdict = failed.length ? 'NG: ' + failed.join(', ') : 'OK: ' + report.checks.length + ' 件すべて合格';
  var out = JSON.stringify(report, null, 2);
  Logger.log('=== Sheets API 一括更新の実地確認（一時スプレッドシート）===\n' + out);
  return out;
}

function e2eMemberConversionIsolated_APPLY() {
  var session = assertMasterOperator_('e2eMemberConversionIsolated_APPLY');
  var started = Date.now();
  var props = PropertiesService.getScriptProperties();
  var pendingRaw = props.getProperty(MEMBER_CONVERSION_E2E_PENDING_KEY_);
  var ctx = {
    stamp: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss'),
    today: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
    deadline: started + 300000, // GAS の上限 6 分より前に打ち切る（残りは時間切れとして不合格にする）
    files: [], batchCalls: 0, inject: '',
  };
  var report = { operator: session.loginId, startedAt: new Date(started).toISOString(), phase: pendingRaw ? '2/2' : '1/2',
    scenarios: [], observations: {}, files: { created: 0, opened: 0, trashed: 0, kept: 0, trashErrors: [] }, next: '', verdict: '' };
  var savedMemo = MASTER_OPTIONS_MEMO_;
  var realBatch = sheetsApiBatchUpdate_;
  var keepForPhase2 = false;
  // 一括更新の呼び出しを数え、シナリオが指定したときだけ失敗を混ぜる・応答を捨てる（本体には試験用の分岐を入れない）
  sheetsApiBatchUpdate_ = function(spreadsheetId, requests) { return memberConversionE2eBatch_(ctx, realBatch, spreadsheetId, requests); };
  // 移行が読むマスタ（M_職員権限）は、この実行の中だけ固定値にする。
  // 一時ファイルの空のマスタを読んで、本番と共有のスクリプトキャッシュへ入れないため。
  MASTER_OPTIONS_MEMO_ = { M_職員権限: [{ code: 'STAFF', label: '一般' }, { code: 'ADMIN', label: '管理者' }, { code: 'REPRESENTATIVE', label: '代表者' }] };
  try {
    if (pendingRaw) {
      props.deleteProperty(MEMBER_CONVERSION_E2E_PENDING_KEY_); // 2 回目が途中で止まっても、次の実行は 1 回目からやり直す
      runMemberConversionE2ePhase2_(ctx, report, JSON.parse(pendingRaw));
    } else {
      var pending = runMemberConversionE2ePhase1_(ctx, report);
      props.setProperty(MEMBER_CONVERSION_E2E_PENDING_KEY_, JSON.stringify(pending));
      keepForPhase2 = true;
      report.next = 'もう一度 e2eMemberConversionIsolated_APPLY を実行してください（2/2: 往復の戻りと同じ操作IDの再送）。';
    }
  } catch (e) {
    report.scenarios.push({ id: 'ABORT', passed: false, problems: [String(e && e.message ? e.message : e)] });
  } finally {
    sheetsApiBatchUpdate_ = realBatch;
    MASTER_OPTIONS_MEMO_ = savedMemo;
    ctx.files.forEach(function(f) {
      if (f.created) report.files.created += 1; else report.files.opened += 1;
      if (keepForPhase2 && f.keep) { report.files.kept += 1; return; }
      try {
        DriveApp.getFileById(f.id).setTrashed(true);
        report.files.trashed += 1;
      } catch (e2) {
        report.files.trashErrors.push(String(e2 && e2.message ? e2.message : e2));
      }
    });
  }
  report.elapsedMs = Date.now() - started;
  var failed = report.scenarios.filter(function(s) { return !s.passed; }).map(function(s) { return s.id; });
  report.verdict = (failed.length ? 'NG: ' + failed.join(', ') : 'OK: ' + report.scenarios.length + ' 件すべて合格')
    + '（' + report.phase + (keepForPhase2 ? '・続きあり' : '') + '）';
  var out = JSON.stringify(report, null, 2);
  Logger.log('=== 会員・職員移行の隔離 E2E（一時スプレッドシート）===\n' + out);
  return out;
}

function describeDatabaseState_LOG() {
  assertMasterOperator_('describeDatabaseState_LOG');
  var main = getOrCreateDatabase_();
  var logSs = getLogSs_();
  var books = [{ label: 'main', ss: main }];
  if (logSs.getId() !== main.getId()) books.push({ label: 'log', ss: logSs });

  var cache = {};
  var result = { schemaVersion: DB_SCHEMA_VERSION, books: [], references: [], notes: [] };
  books.forEach(function(book) {
    var sheets = book.ss.getSheets().map(function(sheet) {
      var name = sheet.getName();
      var snap = readSheetForDbState_(sheet);
      cache[book.label + ':' + name] = snap;
      var kind = テーブル定義[name] ? 'table' : (マスタ定義[name] ? 'master' : 'other');
      var info = { name: name, kind: kind, rows: snap.rows.length, cols: snap.headers.length };
      var delIdx = snap.headers.indexOf('削除フラグ');
      if (delIdx >= 0) info.deleted = snap.rows.filter(function(r) { return toBoolean_(r[delIdx]); }).length;
      var target = テーブル定義[name] || マスタ定義[name];
      if (target && kind === 'table') {
        var hasData = snap.headers.map(function(_, c) { return snap.rows.some(function(r) { return r[c] !== '' && r[c] !== null; }); });
        var plan = planTableColumnNormalization_(snap.headers, target, hasData);
        info.schema = plan.mode;
        if (plan.added.length) info.missingColumns = plan.added;
        if (plan.dropped.length) info.extraColumns = plan.dropped;
      }
      return info;
    });
    result.books.push({ label: book.label, sheets: sheets });
  });

  function snapOf(tableName) {
    var preferLog = DB_STATE_LOG_TABLES_.indexOf(tableName) >= 0 && books.length > 1;
    return cache[(preferLog ? 'log' : 'main') + ':' + tableName] || null;
  }
  DB_STATE_ID_REFERENCES_.forEach(function(ref) {
    var child = snapOf(ref[0]);
    var parent = snapOf(ref[2]);
    var out = { child: ref[0], column: ref[1], parent: ref[2] };
    if (!child || !parent) { out.skipped = !child ? '子のシートが無い' : '親のシートが無い'; result.references.push(out); return; }
    var col = child.headers.indexOf(ref[1]);
    var pkName = (テーブル定義[ref[2]] || [])[0];
    var pk = parent.headers.indexOf(pkName);
    if (col < 0 || pk < 0) { out.skipped = col < 0 ? '子に列が無い' : '親に主キー列が無い'; result.references.push(out); return; }
    var parentDel = parent.headers.indexOf('削除フラグ');
    var parentIds = {};
    parent.rows.forEach(function(r) {
      var id = String(r[pk] == null ? '' : r[pk]).trim();
      if (id) parentIds[id] = parentDel >= 0 && toBoolean_(r[parentDel]) ? 'deleted' : 'active';
    });
    var childDel = child.headers.indexOf('削除フラグ');
    out.withValue = 0; out.orphanActive = 0; out.orphanDeleted = 0; out.activeToDeletedParent = 0;
    child.rows.forEach(function(r) {
      var v = String(r[col] == null ? '' : r[col]).trim();
      if (!v) return;
      out.withValue += 1;
      var childDeleted = childDel >= 0 && toBoolean_(r[childDel]);
      if (!parentIds[v]) { if (childDeleted) out.orphanDeleted += 1; else out.orphanActive += 1; }
      else if (!childDeleted && parentIds[v] === 'deleted') out.activeToDeletedParent += 1;
    });
    result.references.push(out);
  });

  result.authOfDeletedPeople = countAuthOfDeletedPeople_(snapOf('T_認証アカウント'), snapOf('T_会員'), snapOf('T_事業所職員'));
  result.credentialsTemp = countCredentialsTempExposure_(cache['main:_CREDENTIALS_TEMP'] || null, snapOf('T_認証アカウント'));
  result.shortMemberIds = countShortMemberIds_(snapOf('T_会員'), snapOf('T_認証アカウント'),
    DB_STATE_ID_REFERENCES_.filter(function(ref) { return ref[2] === 'T_会員'; })
      .map(function(ref) { return { table: ref[0], column: ref[1], snap: snapOf(ref[0]) }; }));

  var out = JSON.stringify(result, null, 2);
  Logger.log('=== DB の状態（件数のみ）===\n' + out);
  return out;
}

function healthCheckPasswordPepper() {
  assertMasterOperator_('healthCheckPasswordPepper');
  var report = [];
  var fpProps = '';
  var fpSm = '';
  // Properties
  var fromProps = String(PropertiesService.getScriptProperties().getProperty(PASSWORD_HASH_PEPPER_PROPERTY) || '').trim();
  if (fromProps) {
    fpProps = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fromProps)).substring(0, 16);
  }
  report.push({ source: 'ScriptProperties', present: !!fromProps, length: fromProps.length, fp: fpProps });
  // Secret Manager
  var fromSm = '';
  var smError = '';
  try {
    fromSm = fetchPepperFromSecretManager_();
    if (fromSm) {
      fpSm = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fromSm)).substring(0, 16);
    }
    report.push({ source: 'SecretManager', present: !!fromSm, length: fromSm.length, fp: fpSm });
  } catch (smErr) {
    smError = String(smErr.message || smErr);
    report.push({ source: 'SecretManager', present: false, error: smError });
  }
  // fingerprint 一致性検証（値そのものは絶対に出力しない）
  if (fpProps && fpSm) {
    report.push({ check: 'fingerprint_match', match: fpProps === fpSm });
  }
  // 解決後の effective source（getPasswordPepper_ が返す値の出所）
  // cache を一度クリアして強制的に取得経路を確認
  try { CacheService.getScriptCache().remove(PASSWORD_HASH_PEPPER_CACHE_KEY); } catch (e) {}
  var resolved = getPasswordPepper_();
  var effectiveSource = resolved && resolved === fromSm ? 'SecretManager'
    : resolved && resolved === fromProps ? 'ScriptProperties'
    : resolved ? 'unknown' : 'none';
  report.push({ resolved_via: effectiveSource, length: resolved.length });
  Logger.log('[healthCheckPasswordPepper] %s', JSON.stringify(report));
  return report;
}

function dryRunGcpPhaseB_LOG() {
  assertMasterOperator_('dryRunGcpPhaseB_LOG');
  var report = { passed: true, checks: [] };

  // 1. identity token payload（値そのものは出力しない）
  var idToken = '';
  try {
    idToken = ScriptApp.getIdentityToken();
    if (!idToken) throw new Error('getIdentityToken() が空を返した（openid scope 未反映の可能性）');
    var payloadPart = String(idToken).split('.')[1];
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadPart)).getDataAsString());
    report.checks.push({
      check: 'identityToken',
      ok: true,
      aud: String(payload.aud || ''),
      iss: String(payload.iss || ''),
      hasEmail: !!payload.email,
      emailVerified: payload.email_verified === true,
    });
  } catch (tokenErr) {
    report.passed = false;
    report.checks.push({ check: 'identityToken', ok: false, error: String(tokenErr.message || tokenErr) });
  }

  // 2. Secret Manager 取得可否（値は出さない・長さのみ）
  try {
    var pepper = fetchPepperFromSecretManager_();
    report.checks.push({ check: 'secretManager', ok: !!pepper, secretName: getPasswordPepperSecretName_(), length: pepper ? pepper.length : 0 });
    if (!pepper) report.passed = false;
  } catch (smErr) {
    report.passed = false;
    report.checks.push({ check: 'secretManager', ok: false, secretName: getPasswordPepperSecretName_(), error: String(smErr.message || smErr) });
  }

  // 3. Cloud Run /health（IAM 通過確認。URL 未設定時は skip）
  try {
    var serviceUrl = String(PropertiesService.getScriptProperties().getProperty(CLOUD_RUN_HASH_SERVICE_URL_PROPERTY) || '').trim();
    if (!serviceUrl) {
      report.checks.push({ check: 'cloudRunHealth', skipped: true, reason: 'Script Property ' + CLOUD_RUN_HASH_SERVICE_URL_PROPERTY + ' 未設定' });
    } else if (!idToken) {
      report.checks.push({ check: 'cloudRunHealth', ok: false, error: 'identity token 未取得のため実行不可' });
      report.passed = false;
    } else {
      var res = UrlFetchApp.fetch(serviceUrl.replace(/\/+$/, '') + '/health', {
        method: 'get',
        headers: { 'Authorization': 'Bearer ' + idToken },
        muteHttpExceptions: true,
      });
      var status = res.getResponseCode();
      report.checks.push({ check: 'cloudRunHealth', ok: status === 200, httpStatus: status });
      if (status !== 200) report.passed = false;
    }
  } catch (crErr) {
    report.passed = false;
    report.checks.push({ check: 'cloudRunHealth', ok: false, error: String(crErr.message || crErr) });
  }

  // 4. Argon2 hash→verify 往復（実 DB 非破壊・ダミーパスワードのみ。URL 未設定なら skip）
  //    docs/250 §7: 実サービスでの hash/verify latency もここで実測する
  try {
    if (!getCloudRunHashServiceUrl_()) {
      report.checks.push({ check: 'argon2RoundTrip', skipped: true, reason: 'Script Property ' + CLOUD_RUN_HASH_SERVICE_URL_PROPERTY + ' 未設定' });
    } else {
      var dummyPassword = 'dryrun-dummy-password-v376_54';
      var tHash0 = new Date().getTime();
      var testHash = hashPasswordArgon2_(dummyPassword, 'unused-salt');
      var hashMs = new Date().getTime() - tHash0;
      var tVerify0 = new Date().getTime();
      var okVerify = verifyPasswordArgon2_(dummyPassword, testHash);
      var ngVerify = verifyPasswordArgon2_('wrong-password-dummy', testHash);
      var verifyMs = Math.round((new Date().getTime() - tVerify0) / 2);
      var roundTripOk = okVerify.match === true && ngVerify.match === false;
      report.checks.push({
        check: 'argon2RoundTrip',
        ok: roundTripOk,
        matchExpectedTrue: okVerify.match,
        matchExpectedFalse: ngVerify.match,
        needsRehash: okVerify.needsRehash,
        phcFormatOk: testHash.indexOf(ARGON2_HASH_PREFIX + '$argon2id$v=19$m=19456,t=2,p=1$') === 0,
        hashMs: hashMs,
        verifyMsAvg: verifyMs,
        argon2Enabled: isArgon2Enabled_(),
      });
      if (!roundTripOk) report.passed = false;
    }
  } catch (argonErr) {
    report.passed = false;
    report.checks.push({ check: 'argon2RoundTrip', ok: false, error: String(argonErr.message || argonErr) });
  }

  Logger.log('[dryRunGcpPhaseB_LOG] %s', JSON.stringify(report, null, 2));
  return report;
}

function dryRunApplicationScenarios() {
  var adminSession = dryRun_assertAdminOperator_();
  var ss = getOrCreateDatabase_();
  var runStamp = String(Date.now()).slice(-5);
  var startedAt = new Date().toISOString();

  var state = {
    runStamp: runStamp,
    report: {
      runId: 'DRYRUN_' + runStamp + '_' + Utilities.getUuid().substring(0, 8),
      operator: adminSession.loginId,
      // 2026-10-13: セッションに permissionCode は無い（adminPermissionLevel）。以前は常に空だった。
      permissionCode: adminSession.adminPermissionLevel,
      startedAt: startedAt,
      finishedAt: null,
      passedCount: 0,
      failedCount: 0,
      scenarios: [],
    },
    manifest: {
      memberIds: {},
      staffIds: {},
      authIds: {},
      requestIds: {},
    },
  };

  // ── Email isolation: CREDENTIAL_EMAIL_ENABLED を一時 false 化 ────────────
  var originalEmailEnabled = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_ENABLED');
  var emailSettingExisted = (originalEmailEnabled !== '' && originalEmailEnabled !== null);
  try {
    batchUpsertSystemSettings_(ss, [{ key: 'CREDENTIAL_EMAIL_ENABLED', value: 'false', description: 'dryRun: 一時的に無効化' }]);
  } catch (e) {
    Logger.log('dryRun: email setting toggle failed (continuing with @example.invalid as defense): ' + e.message);
  }

  try {
    dryRun_scenario_newIndividual_(state, ss, adminSession);
    dryRun_scenario_newSupport_(state, ss, adminSession);
    dryRun_scenario_newBusiness_(state, ss, adminSession);
    dryRun_scenario_transferIndividualToStaff_(state, ss, adminSession);
    dryRun_scenario_transferStaffToIndividual_(state, ss, adminSession);
    dryRun_scenario_transferStaffAcrossBiz_(state, ss, adminSession);
    dryRun_scenario_memberTypeChange_(state, ss, adminSession);
  } finally {
    // 元の email 設定を復元
    try {
      var restoreValue = emailSettingExisted ? String(originalEmailEnabled) : 'true';
      batchUpsertSystemSettings_(ss, [{ key: 'CREDENTIAL_EMAIL_ENABLED', value: restoreValue, description: 'dryRun: 復元' }]);
    } catch (e) {
      Logger.log('dryRun: email setting restore failed: ' + e.message);
    }
  }

  state.report.finishedAt = new Date().toISOString();
  state.report.manifestCounts = {
    members: Object.keys(state.manifest.memberIds).length,
    staff: Object.keys(state.manifest.staffIds).length,
    auth: Object.keys(state.manifest.authIds).length,
    changeRequests: Object.keys(state.manifest.requestIds).length,
  };

  Logger.log('dryRunApplicationScenarios: ' + JSON.stringify(state.report));
  // clasp run は util.inspect で出力するためネストが [Object]/[Array] に省略される。
  // 文字列で返すことで全データを取り出せるようにする。
  return '__DRYRUN_JSON__' + JSON.stringify(state.report);
}
