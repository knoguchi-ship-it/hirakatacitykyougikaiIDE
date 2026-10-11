// ============================================================
// dryrun.gs — dryRun E2E と読み取り専用の診断（自動生成・手編集禁止）
// 自分で作って自分で消す dryRun E2E と、データを変えない診断だけ。
// 本番データを書き換えるものは maintenance.gs、定期実行されるものは jobs.gs。
// helper / 定数は Code.gs 側に残っており、同一プロジェクトのグローバルスコープで参照される。
// 許可リストの正本: scripts/gas-boundary-utils.mjs ADMIN_OPERATOR_TOOL_FUNCTIONS
// ============================================================
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

function dryRunTrainingManagement() {
  assertMasterOperator_('dryRunTrainingManagement');
  var ss = getOrCreateDatabase_();
  var stamp = String(Date.now()).slice(-6);
  var report = { startedAt: new Date().toISOString(), results: [], passed: 0, failed: 0, manifest: {} };
  var manifest = { trainingId: '', applyIds: [], externalIds: [] };

  function record(name, ok, detail) {
    report.results.push({ test: name, result: ok ? 'PASS' : 'FAIL', detail: detail || '' });
    if (ok) report.passed += 1; else report.failed += 1;
  }
  function safe(name, fn) {
    try { return fn(); }
    catch (e) { record(name, false, 'EXCEPTION: ' + (e && e.message ? e.message : String(e))); return null; }
  }

  // ── 1. CREATE ──────────────────────────────────────────────────────────
  var trainingId = safe('1.研修作成(CREATE)', function () {
    var openDate = Utilities.formatDate(new Date(Date.now() - 86400000), 'Asia/Tokyo', 'yyyy-MM-dd');
    var closeDate = Utilities.formatDate(new Date(Date.now() + 30 * 86400000), 'Asia/Tokyo', 'yyyy-MM-dd');
    var saved = saveTraining_({
      title: DRYRUN_PREFIX + 'テスト研修_' + stamp,
      date: Utilities.formatDate(new Date(Date.now() + 14 * 86400000), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm"),
      organizer: '枚方市介護支援専門員連絡協議会',
      summary: 'ドライランテスト用研修（自動削除対象）',
      location: 'テスト会場',
      capacity: 50,
      applicationOpenDate: openDate,
      applicationCloseDate: closeDate,
      inquiryPerson: '事務局テスト',
      inquiryEmail: 'dryrun' + DRYRUN_EMAIL_DOMAIN,
      fees: [{ label: '会員', amount: 0 }],
    });
    var id = saved && saved.id ? String(saved.id) : '';
    if (!id) throw new Error('id が返却されない');
    record('1.研修作成(CREATE)', true, 'trainingId=' + id);
    return id;
  });
  if (!trainingId) { report.finishedAt = new Date().toISOString(); Logger.log(JSON.stringify(report, null, 2)); return report; }
  manifest.trainingId = trainingId;

  // ── 2. READ (一覧) ─────────────────────────────────────────────────────
  safe('2.研修一覧取得(READ)', function () {
    clearTrainingManagementCache_();
    var list = getTrainingManagementData_();
    var found = (list || []).filter(function (t) { return String(t.id) === trainingId; })[0];
    if (!found) throw new Error('一覧に作成研修が無い');
    if (found.isDeleted) throw new Error('新規作成なのに isDeleted=true');
    record('2.研修一覧取得(READ)', true, 'title=' + found.title + ' isDeleted=' + found.isDeleted);
  });

  // ── 3. UPDATE ──────────────────────────────────────────────────────────
  safe('3.研修更新(UPDATE)', function () {
    saveTraining_({
      id: trainingId,
      title: DRYRUN_PREFIX + 'テスト研修_更新済_' + stamp,
      date: Utilities.formatDate(new Date(Date.now() + 14 * 86400000), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm"),
      organizer: '枚方市介護支援専門員連絡協議会',
      summary: '更新後サマリ',
      location: 'テスト会場2',
      capacity: 99,
      inquiryPerson: '事務局テスト',
      inquiryEmail: 'dryrun' + DRYRUN_EMAIL_DOMAIN,
      fees: [{ label: '会員', amount: 0 }],
    });
    clearTrainingManagementCache_();
    var list = getTrainingManagementData_();
    var found = (list || []).filter(function (t) { return String(t.id) === trainingId; })[0];
    if (!found || found.capacity !== 99) throw new Error('定員更新が反映されない (capacity=' + (found ? found.capacity : 'N/A') + ')');
    record('3.研修更新(UPDATE)', true, 'capacity=99 title=' + found.title);
  });

  // ── 4. ゲスト追加 (EXTERNAL) ───────────────────────────────────────────
  var guestApplyId = safe('4.ゲスト追加', function () {
    var res = addGuestRosterEntry_({
      trainingId: trainingId,
      guest: { name: DRYRUN_PREFIX + 'ゲスト太郎', kana: 'ゲストタロウ', email: 'guest' + DRYRUN_EMAIL_DOMAIN, officeName: 'テスト事業所' },
      memo: 'dryrun guest',
    });
    if (!res || !res.ok || !res.applyId) throw new Error('ゲスト追加失敗: ' + JSON.stringify(res));
    manifest.applyIds.push(res.applyId);
    if (res.externalId) manifest.externalIds.push(res.externalId);
    record('4.ゲスト追加', true, 'applyId=' + res.applyId);
    return res.applyId;
  });

  // ── 5. STAFF 申込挿入（v376.12 回帰確認用） ────────────────────────────
  var staffApplyId = safe('5.STAFF申込挿入', function () {
    var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function (r) {
      return !toBoolean_(r['削除フラグ']) && String(r['職員状態コード'] || 'ENROLLED') === 'ENROLLED' &&
             String(r['メールアドレス'] || '').trim();
    });
    if (!staffRows.length) { record('5.STAFF申込挿入', true, 'SKIP: 有効な職員が存在しない'); return null; }
    var staff = staffRows[0];
    var parentMemberId = String(staff['会員ID'] || '');
    var apId = 'AP-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    var now = new Date().toISOString();
    // v376.14-fix: 本番の職員申込と同型に構築（区分コード=MEMBER + 申込者ID=親会員ID + 職員ID 併記）。
    //   isTrainingApplicationRowValid_ を通過しつつ getCanonicalApplicantRef_ が 職員ID 優先で STAFF 解決する。
    appendRowsByHeaders_(ss, 'T_研修申込', [{
      申込ID: apId, 研修ID: trainingId, 会員ID: parentMemberId, 職員ID: String(staff['職員ID'] || ''),
      外部申込者ID: '', 申込者区分コード: 'MEMBER', 申込者ID: parentMemberId,
      申込状態コード: 'APPLIED', 申込日時: now, 取消日時: '', 備考: 'dryrun staff',
      出欠状態コード: 'UNRECORDED', 出欠記録日時: '', 出欠記録者メール: '', 事務局メモ: '',
      作成日時: now, 更新日時: now, 削除フラグ: false,
    }]);
    manifest.applyIds.push(apId);
    clearAllDataCache_();
    record('5.STAFF申込挿入', true, 'applyId=' + apId + ' staffId=' + staff['職員ID'] + ' staffEmail=' + staff['メールアドレス']);
    return apId;
  });

  // ── 6. 名簿取得（区分解決確認） ────────────────────────────────────────
  safe('6.名簿取得', function () {
    var detail = getTrainingRosterDetail_({ trainingId: trainingId });
    var rows = (detail && detail.applicants) || [];
    var guest = rows.filter(function (r) { return r.applyId === guestApplyId; })[0];
    if (!guest) throw new Error('ゲストが名簿に無い');
    if (guest.applicantType !== 'EXTERNAL') throw new Error('ゲストの区分が EXTERNAL でない: ' + guest.applicantType);
    var staffDetail = '';
    if (staffApplyId) {
      var staffRow = rows.filter(function (r) { return r.applyId === staffApplyId; })[0];
      if (!staffRow || staffRow.applicantType !== 'STAFF') throw new Error('STAFF 区分解決失敗: ' + (staffRow ? staffRow.applicantType : 'なし'));
      staffDetail = ' / STAFF=' + staffRow.name + '<' + staffRow.email + '>';
    }
    record('6.名簿取得', true, 'EXTERNAL=' + guest.name + staffDetail);
  });

  // ── 7. メール対象解決（v376.12 回帰） ──────────────────────────────────
  safe('7.メール対象解決', function () {
    var raw = getTrainingApplicants_({ trainingId: trainingId });
    var parsed = JSON.parse(raw);
    if (!parsed.success) throw new Error('getTrainingApplicants_ 失敗: ' + parsed.error);
    var rows = parsed.data || [];
    if (staffApplyId) {
      var staffRow = rows.filter(function (r) { return r.applyId === staffApplyId; })[0];
      if (!staffRow) throw new Error('STAFF がメール対象に無い');
      if (staffRow.applicantType !== 'STAFF') throw new Error('メール対象 STAFF 区分誤り: ' + staffRow.applicantType);
      if (!staffRow.email || staffRow.email.indexOf('@') < 0) throw new Error('STAFF メール解決失敗（事業所代表メール宛バグ再発の疑い）: ' + staffRow.email);
      record('7.メール対象解決', true, 'STAFF email=' + staffRow.email + '（職員個人メールで解決・v376.12 回帰OK）');
    } else {
      var guestRow = rows.filter(function (r) { return r.applyId === guestApplyId; })[0];
      record('7.メール対象解決', !!guestRow, guestRow ? 'EXTERNAL email=' + guestRow.email : 'ゲスト解決失敗');
    }
  });

  // ── 8. 出欠記録（単） ──────────────────────────────────────────────────
  safe('8.出欠記録(単)', function () {
    if (!guestApplyId) throw new Error('対象 applyId 無し');
    var res = saveAttendance_({ applyId: guestApplyId, status: 'PRESENT' });
    if (res && res.error) throw new Error(res.error);
    record('8.出欠記録(単)', true, 'guest→PRESENT');
  });

  // ── 9. 出欠記録（一括） ────────────────────────────────────────────────
  safe('9.出欠記録(一括)', function () {
    // v376.14-fix: saveAttendanceBatch_ は { entries: [...] } 形式を期待する
    var entries = manifest.applyIds.map(function (id) { return { applyId: id, status: 'ABSENT' }; });
    var res = saveAttendanceBatch_({ entries: entries });
    if (res && res.error) throw new Error(res.error);
    record('9.出欠記録(一括)', true, manifest.applyIds.length + ' 件→ABSENT');
  });

  // ── 10. 集計 ───────────────────────────────────────────────────────────
  safe('10.集計', function () {
    var stats = getTrainingStats_({ trainingId: trainingId });
    if (stats && stats.error) throw new Error(stats.error);
    record('10.集計', true, '申込=' + stats.applicantCount + ' 定員=' + stats.capacity + ' 出席率=' + stats.attendanceRate + '%');
  });

  // ── 11. メモ更新 ───────────────────────────────────────────────────────
  safe('11.メモ更新', function () {
    if (!guestApplyId) throw new Error('対象 applyId 無し');
    var res = updateRosterEntry_({ applyId: guestApplyId, adminMemo: 'dryrunメモ更新確認' });
    if (res && res.error) throw new Error(res.error);
    record('11.メモ更新', true, 'adminMemo set');
  });

  // ── 12. 申込キャンセル ─────────────────────────────────────────────────
  safe('12.申込キャンセル', function () {
    if (!guestApplyId) throw new Error('対象 applyId 無し');
    var res = cancelRosterEntry_({ applyId: guestApplyId, reason: 'dryrun cancel' });
    if (res && res.error) throw new Error(res.error);
    record('12.申込キャンセル', true, 'guest→CANCELED');
  });

  // ── 13. soft delete ────────────────────────────────────────────────────
  safe('13.soft delete', function () {
    var res = softDeleteTraining_({ trainingId: trainingId });
    if (!res || !res.deleted) throw new Error('soft delete 失敗');
    record('13.soft delete', true, 'applicantCount=' + res.applicantCount);
  });

  // ── 14. 一覧除外確認 ───────────────────────────────────────────────────
  safe('14.一覧除外確認', function () {
    clearTrainingManagementCache_();
    var list = getTrainingManagementData_();
    var found = (list || []).filter(function (t) { return String(t.id) === trainingId; })[0];
    if (!found) throw new Error('admin 一覧から消えた（admin は削除済も isDeleted で表示すべき）');
    if (!found.isDeleted) throw new Error('soft delete 後も isDeleted=false');
    record('14.一覧除外確認', true, 'isDeleted=true で識別');
  });

  // ── 15. 復元 ───────────────────────────────────────────────────────────
  safe('15.復元', function () {
    var res = restoreTraining_({ trainingId: trainingId });
    if (!res || !res.restored) throw new Error('restore 失敗');
    clearTrainingManagementCache_();
    var list = getTrainingManagementData_();
    var found = (list || []).filter(function (t) { return String(t.id) === trainingId; })[0];
    if (!found || found.isDeleted) throw new Error('復元後も isDeleted=true');
    record('15.復元', true, 'isDeleted=false に復元');
  });

  // manifest 保存（cleanup 用）
  report.manifest = manifest;
  PropertiesService.getScriptProperties().setProperty(DRYRUN_TRAINING_MGMT_MANIFEST_KEY, JSON.stringify(manifest));
  report.finishedAt = new Date().toISOString();

  Logger.log('=== dryRunTrainingManagement ===');
  Logger.log('PASS ' + report.passed + ' / FAIL ' + report.failed);
  Logger.log(JSON.stringify(report, null, 2));
  Logger.log('--- 次に cleanupDryRunTrainingManagement() を実行してテストデータを物理削除してください ---');
  return report;
}

function cleanupDryRunTrainingManagement() {
  assertMasterOperator_('cleanupDryRunTrainingManagement');
  var ss = getOrCreateDatabase_();

  // 1. manifest（最新 run）から ID 収集
  var trainingIds = {}, applyIds = {}, externalIds = {};
  var raw = PropertiesService.getScriptProperties().getProperty(DRYRUN_TRAINING_MGMT_MANIFEST_KEY);
  if (raw) {
    try {
      var manifest = JSON.parse(raw);
      if (manifest.trainingId) trainingIds[String(manifest.trainingId)] = true;
      (manifest.applyIds || []).forEach(function (id) { applyIds[String(id)] = true; });
      (manifest.externalIds || []).forEach(function (id) { externalIds[String(id)] = true; });
    } catch (e) {}
  }

  // 2. DRYRUN_ プレフィックスの研修を sweep（孤児対策）
  getRowsAsObjects_(ss, 'T_研修').forEach(function (r) {
    if (String(r['研修名'] || '').indexOf(DRYRUN_PREFIX) === 0) trainingIds[String(r['研修ID'] || '')] = true;
  });

  // 3. 上記研修に紐づく申込を全収集 + DRYRUN_ ゲストの外部申込者も収集
  getRowsAsObjects_(ss, 'T_研修申込').forEach(function (r) {
    if (trainingIds[String(r['研修ID'] || '')]) {
      applyIds[String(r['申込ID'] || '')] = true;
      var extId = String(r['外部申込者ID'] || '');
      if (extId) externalIds[extId] = true;
    }
  });
  getRowsAsObjects_(ss, 'T_外部申込者').forEach(function (r) {
    if (String(r['氏名'] || '').indexOf(DRYRUN_PREFIX) === 0) externalIds[String(r['外部申込者ID'] || '')] = true;
  });

  var result = {
    deleted: {
      training: dryRun_physicalDeleteRowsByKey_(ss, 'T_研修', '研修ID', Object.keys(trainingIds)),
      applications: dryRun_physicalDeleteRowsByKey_(ss, 'T_研修申込', '申込ID', Object.keys(applyIds)),
      external: dryRun_physicalDeleteRowsByKey_(ss, 'T_外部申込者', '外部申込者ID', Object.keys(externalIds)),
    },
    sweptTrainingIds: Object.keys(trainingIds),
  };
  PropertiesService.getScriptProperties().deleteProperty(DRYRUN_TRAINING_MGMT_MANIFEST_KEY);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  Logger.log('=== cleanupDryRunTrainingManagement (manifest + DRYRUN_ prefix sweep) ===');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
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
      permissionCode: adminSession.permissionCode,
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
