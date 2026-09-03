// ============================================================
// dryrun.gs — operator ツール集（build-admin-gas.mjs が自動生成・手編集禁止）
// Apps Script editor の関数ドロップダウンから ▶ 実行する診断 / dryRun / backfill ツール。
// helper / 定数は Code.gs 側に残っており、同一プロジェクトのグローバルスコープで参照される。
// 許可リストの正本: scripts/gas-boundary-utils.mjs ADMIN_OPERATOR_TOOL_FUNCTIONS
// ============================================================
function forceMarkSchemaInitializedToCurrent() {
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

function dryRunMailTemplatesV376_43_LOG() {
  var ss = getOrCreateDatabase_();
  var results = [];
  function check(label, mail, mustContain) {
    var ok = true; var missing = [];
    (mustContain || []).forEach(function(v) {
      if (mail.subject.indexOf(String(v)) < 0 && mail.body.indexOf(String(v)) < 0) { ok = false; missing.push(v); }
    });
    results.push({ category: label, ok: ok, missing: missing, subject: mail.subject });
  }
  check('TRAINING_APPLY_RECEIPT', renderConfiguredMail_(ss, 'TRAINING_APPLY_RECEIPT_SUBJECT', 'TRAINING_APPLY_RECEIPT_BODY',
    TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT, TRAINING_APPLY_RECEIPT_DEFAULT_BODY,
    { '申込者名': '山田太郎', '研修名': 'テスト研修', '開催日': '2026-07-01', '申込ID': 'APP-TEST-001' }),
    ['山田太郎', 'テスト研修', 'APP-TEST-001']);
  check('TRAINING_REMINDER', renderConfiguredMail_(ss, 'TRAINING_REMINDER_SUBJECT', 'TRAINING_REMINDER_BODY',
    TRAINING_REMINDER_DEFAULT_SUBJECT, TRAINING_REMINDER_DEFAULT_BODY,
    { '研修名': 'テスト研修', '開催日': '2026-07-01 14:00', '会場': '枚方市民会館' }),
    ['テスト研修', '枚方市民会館']);
  check('AUTH_OTP', renderConfiguredMail_(ss, 'AUTH_OTP_SUBJECT', 'AUTH_OTP_BODY',
    AUTH_OTP_DEFAULT_SUBJECT, AUTH_OTP_DEFAULT_BODY,
    { '会員名': '山田太郎', '用途': '会員情報変更', '認証コード': '123456', '有効期限': '10分間' }, '123456'),
    ['123456']);
  check('MEMBER_UPDATE_CONFIRM', renderConfiguredMail_(ss, 'MEMBER_UPDATE_CONFIRM_SUBJECT', 'MEMBER_UPDATE_CONFIRM_BODY',
    MEMBER_UPDATE_CONFIRM_DEFAULT_SUBJECT, MEMBER_UPDATE_CONFIRM_DEFAULT_BODY, { '氏名': '山田太郎' }),
    ['山田太郎']);
  check('WITHDRAWAL_CONFIRM', renderConfiguredMail_(ss, 'WITHDRAWAL_CONFIRM_SUBJECT', 'WITHDRAWAL_CONFIRM_BODY',
    WITHDRAWAL_CONFIRM_DEFAULT_SUBJECT, WITHDRAWAL_CONFIRM_DEFAULT_BODY,
    { '会員名': '山田太郎', '退会予定日': '2027-03-31', '会員マイページURL': MEMBER_PORTAL_URL }),
    ['山田太郎', '2027-03-31']);
  check('PASSWORD_RESET', renderConfiguredMail_(ss, 'PASSWORD_RESET_SUBJECT', 'PASSWORD_RESET_BODY',
    PASSWORD_RESET_DEFAULT_SUBJECT, PASSWORD_RESET_DEFAULT_BODY,
    { 'ユーザー名': '山田太郎', '確認コード': '654321', '有効期限': '30分', '会員マイページURL': MEMBER_PORTAL_URL }, '654321'),
    ['654321']);

  // 安全ガード健全性: OTP/PW のデフォルト本文に必須タグが含まれること（含まれなければフォールバックが機能しない）。
  var guardOk = AUTH_OTP_DEFAULT_BODY.indexOf('{{認証コード}}') >= 0 && PASSWORD_RESET_DEFAULT_BODY.indexOf('{{確認コード}}') >= 0;

  var allOk = guardOk && results.every(function(r) { return r.ok; });
  var report = { passed: allOk, guardOk: guardOk, results: results };
  Logger.log('[dryRunMailTemplatesV376_43_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunApplicationReceiptRoutingV376_59_LOG() {
  var fixtureStaff = [
    { role: 'STAFF', email: 'member@example.invalid' },
    { role: 'REPRESENTATIVE', email: 'representative@example.invalid' },
  ];
  var representativeEmail = resolveBusinessApplicationRepresentativeEmail_(fixtureStaff);
  var ss = getOrCreateDatabase_();
  var checks = [
    { name: 'boolean_false_stops_receipt', passed: !isSystemSettingValueEnabled_(false, true) },
    { name: 'string_false_stops_receipt', passed: !isSystemSettingValueEnabled_('false', true) },
    { name: 'business_receipt_uses_representative', passed: representativeEmail === 'representative@example.invalid' },
    { name: 'live_application_receipt_setting_readable', passed: typeof isSystemSettingEnabled_(ss, 'APPLICATION_RECEIPT_ENABLED', true) === 'boolean' },
  ];
  var report = {
    version: 'v376.59',
    dryRun: true,
    mailSent: false,
    dbWritten: false,
    passed: checks.every(function(check) { return check.passed; }),
    checks: checks,
    liveApplicationReceiptEnabled: isSystemSettingEnabled_(ss, 'APPLICATION_RECEIPT_ENABLED', true),
  };
  Logger.log('[dryRunApplicationReceiptRoutingV376_59_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunMailSettingsV376_60_LOG() {
  var ss = getOrCreateDatabase_();
  var templateSheet = ss.getSheetByName('T_メールテンプレート');
  var templates = templateSheet ? getRowsAsObjects_(ss, 'T_メールテンプレート').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  }) : [];
  var categoryCounts = {};
  templates.forEach(function(row) {
    var category = String(row['カテゴリ'] || '').trim().toUpperCase();
    if (!category) category = 'UNKNOWN';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  var checks = [
    { name: 'template_table_readable', passed: !!templateSheet },
    { name: 'workflow_off_value_is_boolean', passed: typeof isSystemSettingEnabled_(ss, 'APPLICATION_RECEIPT_ENABLED', true) === 'boolean' },
    { name: 'automatic_sender_option_resolves', passed: typeof buildAutomatedMailOptions_(ss, {}).from === 'string' || buildAutomatedMailOptions_(ss, {}).from === undefined },
  ];
  var report = {
    version: 'v376.60',
    dryRun: true,
    mailSent: false,
    dbWritten: false,
    passed: checks.every(function(check) { return check.passed; }),
    checks: checks,
    activeTemplateCounts: categoryCounts,
    automaticSenderConfigured: !!String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim(),
    applicationReceiptEnabled: isSystemSettingEnabled_(ss, 'APPLICATION_RECEIPT_ENABLED', true),
  };
  Logger.log('[dryRunMailSettingsV376_60_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunTrainingEndTimeV376_61_LOG() {
  var ss = getOrCreateDatabase_();
  var stamp = String(Date.now()).slice(-6);
  var checks = [];
  var trainingId = '';
  var cleanedUp = false;

  function record(name, passed, detail) {
    checks.push({ name: name, passed: !!passed, detail: detail || '' });
  }
  function findById(id) {
    clearTrainingManagementCache_();
    var list = getTrainingManagementData_() || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }
  function basePayload(extra) {
    var payload = {
      title: DRYRUN_PREFIX + 'endTime検証_' + stamp,
      date: Utilities.formatDate(new Date(Date.now() + 14 * 86400000), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm"),
      endTime: '16:30',
      organizer: '枚方市介護支援専門員連絡協議会',
      summary: 'ドライラン用（自動削除対象）',
      location: 'テスト会場',
      capacity: 10,
      applicationOpenDate: Utilities.formatDate(new Date(Date.now() - 86400000), 'Asia/Tokyo', 'yyyy-MM-dd'),
      applicationCloseDate: Utilities.formatDate(new Date(Date.now() + 30 * 86400000), 'Asia/Tokyo', 'yyyy-MM-dd'),
      inquiryPerson: '事務局テスト',
      inquiryEmail: 'dryrun' + DRYRUN_EMAIL_DOMAIN,
      fees: [{ label: '会員', amount: 0 }]
    };
    if (extra) {
      for (var key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) payload[key] = extra[key];
      }
    }
    return payload;
  }

  try {
    // 1. CREATE — endTime=16:30 で作成
    var saved = saveTraining_(basePayload());
    trainingId = saved && saved.id ? String(saved.id) : '';
    record('create_returns_id', !!trainingId, 'trainingId=' + trainingId);

    if (trainingId) {
      // 2. READ — 管理画面と同じ経路(mapTrainingRowsForApi_)で HH:mm が返ること
      var afterCreate = findById(trainingId);
      var readEndTime = afterCreate ? String(afterCreate.endTime || '') : '';
      record('read_endTime_is_hhmm', readEndTime === '16:30', 'endTime=' + readEndTime);

      // 3. RESAVE — 読み戻した値をそのまま保存（管理画面のモーダル保存と同じ形）しても消えないこと
      saveTraining_(basePayload({ id: trainingId, endTime: readEndTime }));
      var afterResave = findById(trainingId);
      var resavedEndTime = afterResave ? String(afterResave.endTime || '') : '';
      record('resave_keeps_endTime', resavedEndTime === '16:30', 'endTime=' + resavedEndTime);
    }
  } catch (e) {
    record('exception', false, String(e && e.message ? e.message : e));
  } finally {
    // 4. CLEANUP — 作成した検証行を物理削除
    if (trainingId) {
      try {
        cleanedUp = dryRun_physicalDeleteRowsByKey_(ss, 'T_研修', '研修ID', [trainingId]) > 0;
      } catch (e2) {
        record('cleanup', false, String(e2 && e2.message ? e2.message : e2));
      }
      clearTrainingManagementCache_();
    }
  }
  record('cleanup_done', !trainingId || cleanedUp, 'trainingId=' + trainingId);

  // 5. 既存行の監査 — セルに壊れた文字列が入っている研修 ID を列挙（課題B の対象特定用・書込なし）
  var corruptedIds = [];
  var emptyCount = 0;
  getRowsAsObjects_(ss, 'T_研修').forEach(function(row) {
    var raw = row['開催終了時刻'];
    if (raw === '' || raw === null || raw === undefined) { emptyCount += 1; return; }
    if (!formatTimeOnly_(raw)) corruptedIds.push(String(row['研修ID'] || ''));
  });

  var report = {
    version: 'v376.61',
    dryRun: true,
    mailSent: false,
    testRowCleanedUp: cleanedUp,
    passed: checks.every(function(check) { return check.passed; }),
    checks: checks,
    corruptedEndTimeIds: corruptedIds,
    corruptedEndTimeCount: corruptedIds.length,
    emptyEndTimeCount: emptyCount
  };
  Logger.log('[dryRunTrainingEndTimeV376_61_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunMembershipFeeV376_64_LOG() {
  var ss = getOrCreateDatabase_();
  var checks = [];
  var restored = false;
  function record(name, passed, detail) {
    checks.push({ name: name, passed: !!passed, detail: detail || '' });
  }

  var before = readMemberTypeAnnualFees_(ss);
  var beforeVisible = isSystemSettingEnabled_(ss, 'MEMBERSHIP_FEE_PUBLIC_VISIBLE', MEMBERSHIP_FEE_DEFAULTS.publicVisible);
  var beforeNote = String(getSystemSettingValue_(ss, 'MEMBERSHIP_FEE_NOTE') || '');
  record('現在値を退避できる',
    isFinite(before.INDIVIDUAL) && isFinite(before.BUSINESS) && isFinite(before.SUPPORT),
    JSON.stringify(before));

  try {
    // 1) 検証値で保存（既存値と必ず異なる値にする）
    var probe = {
      INDIVIDUAL: before.INDIVIDUAL + 11,
      BUSINESS: before.BUSINESS + 22,
      SUPPORT: before.SUPPORT + 33,
    };
    setMemberTypeAnnualFeeAmounts_(ss, probe);
    var afterWrite = readMemberTypeAnnualFees_(ss);
    record('保存した金額が読み戻せる',
      afterWrite.INDIVIDUAL === probe.INDIVIDUAL && afterWrite.BUSINESS === probe.BUSINESS && afterWrite.SUPPORT === probe.SUPPORT,
      JSON.stringify(afterWrite));

    // 2) 公開ポータル設定 API にも同じ金額が出る（申込カードの表示元）
    var publicPayload = JSON.parse(getPublicPortalSettings_());
    var publicFees = publicPayload && publicPayload.data ? publicPayload.data.membershipFees : null;
    record('公開ポータル設定に同じ金額が出る',
      !!publicFees && publicFees.INDIVIDUAL === probe.INDIVIDUAL && publicFees.BUSINESS === probe.BUSINESS && publicFees.SUPPORT === probe.SUPPORT,
      JSON.stringify(publicFees));
    record('公開ポータル設定に表示可否と補足が出る',
      !!publicPayload.data && typeof publicPayload.data.membershipFeeVisible === 'boolean' && typeof publicPayload.data.membershipFeeNote === 'string',
      'visible=' + (publicPayload.data && publicPayload.data.membershipFeeVisible) );

    // 3) スキーマ初期化を通しても設定値が戻らない（v376.64 の要点）
    ensureMemberTypeAnnualFeeAmounts_(ss);
    var afterEnsure = readMemberTypeAnnualFees_(ss);
    record('★スキーマ初期化が設定値を上書きしない',
      afterEnsure.INDIVIDUAL === probe.INDIVIDUAL && afterEnsure.BUSINESS === probe.BUSINESS && afterEnsure.SUPPORT === probe.SUPPORT,
      JSON.stringify(afterEnsure));

    // 4) 範囲外は拒否される
    var rejected = false;
    try { setMemberTypeAnnualFeeAmounts_(ss, { INDIVIDUAL: -1 }); } catch (e) { rejected = true; }
    record('範囲外の金額は拒否される', rejected, '');
  } finally {
    // 5) 必ず原状復帰
    try {
      setMemberTypeAnnualFeeAmounts_(ss, before);
      var restoredFees = readMemberTypeAnnualFees_(ss);
      restored = restoredFees.INDIVIDUAL === before.INDIVIDUAL
        && restoredFees.BUSINESS === before.BUSINESS
        && restoredFees.SUPPORT === before.SUPPORT;
      record('原状復帰した', restored, JSON.stringify(restoredFees));
    } catch (e) {
      record('原状復帰した', false, e && e.message ? e.message : String(e));
    }
  }

  var report = {
    version: 'v376.64',
    dryRun: true,
    mailSent: false,
    restored: restored,
    passed: checks.every(function(check) { return check.passed; }) && restored,
    checks: checks,
    feesBefore: before,
    publicVisibleBefore: beforeVisible,
    noteLengthBefore: beforeNote.length
  };
  Logger.log('[dryRunMembershipFeeV376_64_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunRegulationsV376_65_LOG() {
  var ss = getOrCreateDatabase_();
  var checks = [];
  var cleanedUp = false;
  var stamp = String(Date.now()).slice(-6);
  var createdId = '';
  function record(name, passed, detail) {
    checks.push({ name: name, passed: !!passed, detail: detail || '' });
  }
  function findById(list, id) {
    for (var i = 0; i < list.length; i += 1) if (list[i].id === id) return list[i];
    return null;
  }

  var before = listRegulations_(ss, false);
  record('既存の規程を読める', before.length >= 0, '件数=' + before.length);

  try {
    // 1) 作成
    var created = saveRegulation_({
      kind: 'NOTICE',
      title: DRYRUN_PREFIX + '規程検証_' + stamp,
      body: '検証用の本文です。実行後に削除されます。',
      linkUrl: 'https://example.com/dryrun',
      linkLabel: '検証リンク',
      target: 'ALL',
      sortOrder: 900,
      published: true
    }, 'dryrun');
    createdId = created.id;
    record('新規作成できる（版数=1）', !!createdId && created.version === 1, JSON.stringify(created));

    // 2) 読み戻し
    var afterCreate = findById(listRegulations_(ss, false), createdId);
    record('作成した規程を読み戻せる',
      !!afterCreate && afterCreate.title.indexOf(DRYRUN_PREFIX) === 0 && afterCreate.linkUrl === 'https://example.com/dryrun',
      afterCreate ? afterCreate.title : '(not found)');

    // 3) 本文変更で版数が上がる
    var updated = saveRegulation_({
      id: createdId,
      kind: 'NOTICE',
      title: DRYRUN_PREFIX + '規程検証_' + stamp,
      body: '本文を書き換えました。',
      linkUrl: 'https://example.com/dryrun',
      linkLabel: '検証リンク',
      target: 'ALL',
      sortOrder: 900,
      published: true
    }, 'dryrun');
    record('本文変更で版数が +1 される', updated.version === 2, JSON.stringify(updated));

    // 4) 内容が同じなら版数は上がらない
    var unchanged = saveRegulation_({
      id: createdId,
      kind: 'NOTICE',
      title: DRYRUN_PREFIX + '規程検証_' + stamp,
      body: '本文を書き換えました。',
      linkUrl: 'https://example.com/dryrun',
      linkLabel: '検証リンク',
      target: 'ALL',
      sortOrder: 901,
      published: true
    }, 'dryrun');
    record('内容が同じなら版数は据え置き', unchanged.version === 2, JSON.stringify(unchanged));

    // 5) 公開ポータル設定に出る
    var publicPayload = JSON.parse(getPublicPortalSettings_());
    var publicList = publicPayload && publicPayload.data ? publicPayload.data.regulations : [];
    record('公開ポータル設定に公開中の規程が出る',
      !!findById(publicList || [], createdId),
      '公開件数=' + ((publicList || []).length));

    // 6) 非公開にすると公開側から消える
    saveRegulation_({
      id: createdId,
      kind: 'NOTICE',
      title: DRYRUN_PREFIX + '規程検証_' + stamp,
      body: '本文を書き換えました。',
      linkUrl: 'https://example.com/dryrun',
      linkLabel: '検証リンク',
      target: 'ALL',
      sortOrder: 901,
      published: false
    }, 'dryrun');
    var publicPayload2 = JSON.parse(getPublicPortalSettings_());
    var publicList2 = publicPayload2 && publicPayload2.data ? publicPayload2.data.regulations : [];
    record('★非公開にすると公開側に出ない', !findById(publicList2 || [], createdId), '公開件数=' + ((publicList2 || []).length));

    // 7) 不正な外部リンクは拒否
    var rejected = false;
    try {
      saveRegulation_({ title: DRYRUN_PREFIX + 'bad', body: '', linkUrl: 'javascript:alert(1)' }, 'dryrun');
    } catch (e) { rejected = true; }
    record('不正な外部リンクは拒否される', rejected, '');
  } finally {
    // 8) 検証行を物理削除して原状復帰（soft delete では行が残るため）
    try {
      if (createdId) {
        cleanedUp = purgeRegulationRowForDryRun_(ss, createdId);
      } else {
        cleanedUp = true;
      }
      record('検証行を物理削除した', cleanedUp, createdId);
      var after = listRegulations_(ss, false);
      record('既存の規程件数が元に戻っている', after.length === before.length, before.length + ' -> ' + after.length);
    } catch (e) {
      record('検証行を物理削除した', false, e && e.message ? e.message : String(e));
    }
  }

  var report = {
    version: 'v376.65',
    dryRun: true,
    mailSent: false,
    testRowCleanedUp: cleanedUp,
    passed: checks.every(function(c) { return c.passed; }) && cleanedUp,
    checks: checks,
    regulationCountBefore: before.length
  };
  Logger.log('[dryRunRegulationsV376_65_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunMailMergeTagsV376_66_LOG() {
  var ss = getOrCreateDatabase_();
  var checks = [];
  function record(name, passed, detail) {
    checks.push({ name: name, passed: !!passed, detail: detail || '' });
  }

  // 1) 会員種別マスタから種別ラベルと年会費を引く（メール送信と同じ経路）
  var master = {};
  var rows = getRowsAsObjects_(ss, 'M_会員種別');
  for (var i = 0; i < rows.length; i += 1) {
    var code = String(rows[i]['コード'] || '');
    if (!code) continue;
    master[code] = {
      label: String(rows[i]['名称'] || code),
      fee: parseInt(String(rows[i]['年会費金額'] || '0'), 10) || 0
    };
  }
  record('会員種別マスタから種別と年会費を取得できる',
    !!(master.INDIVIDUAL && master.BUSINESS && master.SUPPRESS !== undefined || master.SUPPORT),
    JSON.stringify(master));

  var probeTemplate = '{{氏名}} 様の会員種別は{{会員種別}}となります。\nその為、年会費は{{年会費}}となります。\nログインID: {{ログインID}}';

  // 2) 事業所（代表者/メンバー）の経路: renderBizEmailTemplate_ + bizVars 相当
  var bizFee = master.BUSINESS ? master.BUSINESS.fee : 0;
  var bizVars = {
    氏名: 'ドライラン 太郎',
    ログインID: 'DRYRUN-LOGIN',
    パスワード: '(非表示)',
    会員マイページURL: MEMBER_PORTAL_URL,
    事業所名: 'ドライラン事業所',
    会員種別: master.BUSINESS ? master.BUSINESS.label : '',
    年会費: formatAnnualFee_(bizFee)
  };
  var bizRendered = renderMergeTags_(probeTemplate, bizVars);
  record('★事業所メールで {{会員種別}} が解決する',
    bizRendered.indexOf('{{会員種別}}') < 0 && bizRendered.indexOf(bizVars.会員種別) >= 0, bizVars.会員種別);
  record('★事業所メールで {{年会費}} が解決する',
    bizRendered.indexOf('{{年会費}}') < 0 && bizVars.年会費 !== '' && bizRendered.indexOf(bizVars.年会費) >= 0, bizVars.年会費);
  record('事業所メールに未解決タグが残らない', bizRendered.indexOf('{{') < 0, '');

  // 3) 個人の経路: sendCredentialEmail_ と同じ置換規則
  var indFee = master.INDIVIDUAL ? master.INDIVIDUAL.fee : 0;
  var indLabel = master.INDIVIDUAL ? master.INDIVIDUAL.label : '';
  var indRendered = probeTemplate
    .replace(/\{\{氏名\}\}/g, 'ドライラン 花子')
    .replace(/\{\{ログインID\}\}/g, 'DRYRUN-LOGIN')
    .replace(/\{\{会員マイページURL\}\}/g, MEMBER_PORTAL_URL)
    .replace(/\{\{会員種別\}\}/g, indLabel)
    .replace(/\{\{年会費\}\}/g, formatAnnualFee_(indFee));
  record('個人メールも従来どおり解決する（非退行）',
    indRendered.indexOf('{{') < 0 && indRendered.indexOf(indLabel) >= 0, indLabel + ' / ' + formatAnnualFee_(indFee));

  // 4) 最後の砦: 未知タグは送信直前に除去される
  var stripped = stripUnresolvedMergeTags_('未知の{{存在しないタグ}}と{{会員種別}}', 'DRYRUN', 'body');
  record('★未解決タグは送信直前に除去される', stripped.indexOf('{{') < 0, stripped);

  // 5) 実際に設定されている事業所テンプレートを描画して未解決タグを検出
  var bizSettings = getBizEmailSettings_(ss);
  var liveTargets = [
    { name: '事業所 代表者向け 本文', text: bizSettings.bizRepEmailBody },
    { name: '事業所 代表者向け 件名', text: bizSettings.bizRepEmailSubject },
    { name: '事業所 メンバー向け 本文', text: bizSettings.bizStaffEmailBody },
    { name: '事業所 メンバー向け 件名', text: bizSettings.bizStaffEmailSubject }
  ];
  var leftovers = [];
  for (var t = 0; t < liveTargets.length; t += 1) {
    var rendered = renderMergeTags_(String(liveTargets[t].text || ''), bizVars);
    var m = rendered.match(/\{\{[^{}]{1,60}\}\}/g);
    if (m && m.length) leftovers.push(liveTargets[t].name + ': ' + m.join(','));
  }
  record('★現在保存されている事業所テンプレートに未解決タグが無い', leftovers.length === 0, leftovers.join(' / '));

  var report = {
    version: 'v376.66',
    dryRun: true,
    mailSent: false,
    dbWritten: false,
    passed: checks.every(function(c) { return c.passed; }),
    checks: checks,
    memberTypeMaster: master,
    unresolvedInLiveTemplates: leftovers
  };
  Logger.log('[dryRunMailMergeTagsV376_66_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunDataExportV376_68_LOG() {
  var checks = [];
  function record(name, passed, detail) {
    checks.push({ name: name, passed: !!passed, detail: detail || '' });
  }
  var masterSession = { isMaster: true, loginId: 'dryrun-master' };
  var adminSession = { isMaster: false, loginId: 'dryrun-admin' };

  // 1) 一覧: MASTER と非 MASTER で見える範囲が違う
  var listMaster = listExportableTables_(masterSession);
  var listAdmin = listExportableTables_(adminSession);
  record('MASTER のほうが出力できるテーブルが多い',
    listMaster.tables.length > listAdmin.tables.length,
    'master=' + listMaster.tables.length + ' / admin=' + listAdmin.tables.length);

  // 2) 認証テーブルはどちらの一覧にも出ない
  function hasTable(list, name) {
    for (var i = 0; i < list.tables.length; i += 1) if (list.tables[i].name === name) return true;
    return false;
  }
  record('★認証テーブルは一覧に出ない（MASTER でも）',
    !hasTable(listMaster, 'T_認証アカウント') && !hasTable(listAdmin, 'T_認証アカウント'), '');

  // 3) ログ系は非 MASTER の一覧に出ない
  record('★ログ系は非 MASTER の一覧に出ない',
    !hasTable(listAdmin, 'T_監査ログ') && !hasTable(listAdmin, 'T_ログイン履歴')
      && hasTable(listMaster, 'T_監査ログ'), '');

  // 4) 認証テーブルの出力は MASTER でも拒否される
  var authBlocked = false;
  try { exportTableCsv_({ tableName: 'T_認証アカウント' }, masterSession); }
  catch (e) { authBlocked = true; }
  record('★認証テーブルの出力は MASTER でも拒否される', authBlocked, '');

  // 5) ログ系の出力は非 MASTER で拒否される
  var logBlocked = false;
  try { exportTableCsv_({ tableName: 'T_監査ログ' }, adminSession); }
  catch (e) { logBlocked = true; }
  record('★ログ系の出力は非 MASTER で拒否される', logBlocked, '');

  // 5-2) ★アーカイブテーブルも元テーブルと同じ制限を受ける
  record('★認証アーカイブは一覧に出ない（MASTER でも）',
    !hasTable(listMaster, 'T_認証アカウント_archive') && !hasTable(listAdmin, 'T_認証アカウント_archive'), '');
  var authArchiveBlocked = false;
  try { exportTableCsv_({ tableName: 'T_認証アカウント_archive' }, masterSession); }
  catch (e) { authArchiveBlocked = true; }
  record('★認証アーカイブの出力は MASTER でも拒否される', authArchiveBlocked, '');

  // 6) 未知のテーブル名は拒否される
  var unknownBlocked = false;
  try { exportTableCsv_({ tableName: 'T_存在しない' }, masterSession); }
  catch (e) { unknownBlocked = true; }
  record('未知のテーブル名は拒否される', unknownBlocked, '');

  // 7) 実データを 1 件出力できる（中身は出さず、ヘッダー名と行数だけ確認）
  var sample = null;
  try {
    sample = exportTableCsv_({ tableName: 'M_会員種別' }, adminSession);
  } catch (e) {
    record('マスタを CSV 出力できる', false, e && e.message ? e.message : String(e));
  }
  if (sample) {
    var firstLine = String(sample.csv || '').split('\r\n')[0];
    record('マスタを CSV 出力できる',
      sample.rowCount > 0 && firstLine.indexOf('コード') >= 0,
      'rows=' + sample.rowCount + ' / header=' + firstLine);
    record('ファイル名が付与される',
      sample.filename.indexOf('M_会員種別_') === 0 && sample.filename.indexOf('.csv') > 0,
      sample.filename);
  }

  var report = {
    version: 'v376.68',
    dryRun: true,
    mailSent: false,
    dbWritten: false,
    passed: checks.every(function(c) { return c.passed; }),
    checks: checks,
    exportableForMaster: listMaster.tables.length,
    exportableForAdmin: listAdmin.tables.length,
    maxRows: listMaster.maxRows
  };
  Logger.log('[dryRunDataExportV376_68_LOG] ' + JSON.stringify(report));
  return report;
}

function processPendingThumbnails() {
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
  } catch (e) {
    Logger.log('processPendingThumbnails: fatal ' + e.message);
  }
}

function setupPendingThumbnailsTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'processPendingThumbnails') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('processPendingThumbnails').timeBased().everyMinutes(10).create();
  Logger.log('setupPendingThumbnailsTrigger: trigger installed (every 10 min).');
  return { ok: true, intervalMinutes: 10 };
}

function regenerateAllThumbnails(payload) {
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
  return backfillKanaToFullwidth({ dryRun: false });
}

function deleteTestDataPreview_LOG() {
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

function inspectDryRunManifest_LOG() {
  var raw = PropertiesService.getScriptProperties().getProperty(DRYRUN_MANIFEST_KEY);
  Logger.log('=== inspectDryRunManifest_LOG ===');
  if (!raw) {
    Logger.log('DRYRUN_MANIFEST: 未保存（dryRunApplicationScenarios 未実行 / すでに cleanup 済）');
    return null;
  }
  try {
    var parsed = JSON.parse(raw);
    var runs = (parsed && parsed.runs) || [];
    var memberSet = {}, staffSet = {}, authSet = {}, requestSet = {};
    for (var i = 0; i < runs.length; i++) {
      (runs[i].memberIds || []).forEach(function (id) { memberSet[id] = true; });
      (runs[i].staffIds || []).forEach(function (id) { staffSet[id] = true; });
      (runs[i].authIds || []).forEach(function (id) { authSet[id] = true; });
      (runs[i].requestIds || []).forEach(function (id) { requestSet[id] = true; });
    }
    var summary = {
      runs: runs.length,
      counts: {
        members: Object.keys(memberSet).length,
        staff: Object.keys(staffSet).length,
        auth: Object.keys(authSet).length,
        changeRequests: Object.keys(requestSet).length,
      },
      sampleMemberIds: Object.keys(memberSet).slice(0, 10),
      sampleAuthIds: Object.keys(authSet).slice(0, 10),
      runsTimeline: runs.map(function (r) {
        return { runId: r.runId, startedAt: r.startedAt, finishedAt: r.finishedAt };
      }),
    };
    Logger.log(JSON.stringify(summary, null, 2));
    return summary;
  } catch (e) {
    Logger.log('parse 失敗: ' + (e && e.message));
    Logger.log('raw: ' + raw);
    return null;
  }
}

function backfillKanaToFullwidth(options) {
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

function dryRunLinePostV376_44_LOG() {
  var ss = getOrCreateDatabase_();
  var report = { steps: [], passed: false };
  try {
    ensureLinePostRequestSheet_(ss);
    var lastCol = ss.getSheetByName('T_LINE投稿依頼').getLastColumn();
    report.steps.push({ step: 'ensureSheet', lastColumn: lastCol, ok: lastCol >= 1 });
    var saved = saveLinePostRequest_({ text: 'DRYRUN_V376_44 LINE保存検証', targetType: LINE_POST_TARGET_GENERAL });
    report.steps.push({ step: 'save', id: saved && saved.id, status: saved && saved.status, ok: !!(saved && saved.id) });
    var fetched = getLinePostRequest_({ id: saved.id });
    var fetchOk = !!(fetched && fetched.id === saved.id);
    report.steps.push({ step: 'fetch', ok: fetchOk });
    deleteLinePostRequest_({ id: saved.id });
    report.steps.push({ step: 'softDelete', ok: true });
    report.passed = lastCol >= 1 && !!(saved && saved.id) && fetchOk;
  } catch (e) {
    report.error = e && e.message ? e.message : String(e);
  }
  Logger.log('[dryRunLinePostV376_44_LOG] ' + JSON.stringify(report));
  return report;
}

function dryRunLinePostV376_45_LOG() {
  var ss = getOrCreateDatabase_();
  var report = { steps: [], passed: false };
  try {
    // (0) lineCanManage_ ロジック
    var mgmtLogic = lineCanManage_({ isMaster: true, allowedMenus: [] }) === true
      && lineCanManage_({ isMaster: false, allowedMenus: ['line-post-manage'] }) === true
      && lineCanManage_({ isMaster: false, allowedMenus: ['line-post'] }) === false;
    report.steps.push({ step: 'lineCanManage_logic', ok: mgmtLogic });

    var userA = { loginId: 'dryrun-a@example.com', displayName: 'ドライランA', isMaster: false, allowedMenus: ['line-post'] };
    var userB = { loginId: 'dryrun-b@example.com', displayName: 'ドライランB', isMaster: false, allowedMenus: ['line-post'] };
    var mgr = { loginId: 'dryrun-mgr@example.com', displayName: 'ドライラン管理', isMaster: false, allowedMenus: ['line-post', 'line-post-manage'] };

    // (1) userA が submitRequest で作成 → REQUESTED + 作成者名 + 投稿依頼日時
    var saved = saveLinePostRequest_({ text: 'DRYRUN_V376_45 投稿依頼検証', targetType: LINE_POST_TARGET_GENERAL, submitRequest: true, __adminSession: userA });
    var submitOk = saved && saved.status === LINE_POST_STATUS_REQUESTED && saved.createdByName === 'ドライランA' && !!saved.requestedAt;
    report.steps.push({ step: 'submitRequest', id: saved && saved.id, status: saved && saved.status, createdByName: saved && saved.createdByName, ok: submitOk });

    // (2) 可視範囲: userB（非管理・別人）には見えない / userA には見える / mgr には見える
    var seenByB = listLinePostRequests_({ __adminSession: userB }).items.some(function (x) { return x.id === saved.id; });
    var seenByA = listLinePostRequests_({ __adminSession: userA }).items.some(function (x) { return x.id === saved.id; });
    var seenByMgr = listLinePostRequests_({ __adminSession: mgr }).items.some(function (x) { return x.id === saved.id; });
    report.steps.push({ step: 'visibility', seenByB: seenByB, seenByA: seenByA, seenByMgr: seenByMgr, ok: !seenByB && seenByA && seenByMgr });

    // (3) post 権限: userA（非管理）は不可、mgr は可
    var postBlocked = false;
    try { transitionLinePostRequest_({ id: saved.id, action: 'post', __adminSession: userA }); } catch (e1) { postBlocked = true; }
    var posted = transitionLinePostRequest_({ id: saved.id, action: 'post', __adminSession: mgr });
    var postOk = postBlocked && posted && posted.status === LINE_POST_STATUS_POSTED && posted.postedByName === 'ドライラン管理';
    report.steps.push({ step: 'postPermission', postBlockedForNonManager: postBlocked, postedByName: posted && posted.postedByName, ok: postOk });

    // (4) cleanup（mgr 権限で soft delete）
    deleteLinePostRequest_({ id: saved.id, __adminSession: mgr });
    report.steps.push({ step: 'cleanup', ok: true });

    report.passed = mgmtLogic && submitOk && (!seenByB && seenByA && seenByMgr) && postOk;
  } catch (e) {
    report.error = e && e.message ? e.message : String(e);
  }
  Logger.log('[dryRunLinePostV376_45_LOG] ' + JSON.stringify(report));
  return report;
}

function restoreLastArchiveBatch_APPLY() {
  var ss = getOrCreateDatabase_();
  var logs = getRowsAsObjects_(ss, 'T_削除ログ');
  if (logs.length === 0) throw new Error('T_削除ログ が空です（復元対象なし）。');
  var lastLogId = String(logs[logs.length - 1]['ログID'] || '');
  var result = restoreArchiveBatch_(lastLogId);
  Logger.log(JSON.stringify(result, null, 2));
  return JSON.stringify(result);
}

function listArchiveBatches_LOG() {
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

function dryRunDeleteCascadeV376_52_LOG() {
  var ss = getOrCreateDatabase_();
  var tag = DRYRUN_CASCADE_TAG;
  var nowIso = new Date().toISOString();
  var memberId = tag + '_M1';
  var staffId = tag + '_S1';
  var authId = tag + '_A1';
  var payId = tag + '_P1';
  var out = { passed: false, checks: [] };
  function check(name, ok, detail) {
    out.checks.push({ name: name, ok: !!ok, detail: detail === undefined ? '' : detail });
    if (!ok) out.passed = false;
  }
  try {
    cleanupDryRunDeleteCascade();

    // 1. fixture 投入（各テーブル最小行。appendRowsByHeaders は未知キー無視・欠損は空欄）
    appendRowsByHeaders_(ss, 'T_会員', [{ '会員ID': memberId, '会員種別コード': 'INDIVIDUAL', '会員状態コード': 'ACTIVE', '姓': tag, '名': 'テスト', '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_事業所職員', [{ '職員ID': staffId, '会員ID': memberId, '氏名': tag + ' テスト', '職員状態コード': 'ENROLLED', '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_認証アカウント', [{ '認証ID': authId, '認証方式': 'PASSWORD', 'ログインID': tag + '_LOGIN', '会員ID': memberId, 'アカウント有効フラグ': false, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_研修申込', [{ '申込ID': tag + '_AP1', '研修ID': tag + '_T1', '会員ID': memberId, '申込者区分コード': 'MEMBER', '申込者ID': memberId, '申込状態コード': 'CANCELED', '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_年会費納入履歴', [{ '会員ID': memberId, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_年会費更新履歴', [{ '会員ID': memberId, '作成日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_役員', [{ '役員ID': tag + '_O1', '会員ID': memberId, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_振込口座', [{ '口座ID': tag + '_B1', '会員ID': memberId, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_支払い', [{ '支払いID': payId, '会員ID': memberId, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_支払い明細', [{ '明細ID': tag + '_PD1', '支払いID': payId, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_請求', [{ '請求ID': tag + '_C1', '会員ID': memberId, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_変更申請', [{ '申請ID': tag + '_R1', '会員ID': memberId, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(ss, 'T_管理者Googleホワイトリスト', [{ 'ホワイトリストID': tag + '_W1', 'Googleメール': tag.toLowerCase() + '@example.invalid', '紐付け会員ID': memberId, '有効フラグ': false, '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso }]);
    appendRowsByHeaders_(getLogSs_(), 'T_ログイン履歴', [{ 'ログイン履歴ID': tag + '_LH1', '認証ID': authId, 'ログイン結果': 'SUCCESS', '実行日時': nowIso }]);

    // 2. cascade 実行
    var mSet = {}; mSet[memberId] = true;
    var sSet = {}; sSet[staffId] = true;
    var batchId = tag + '_BATCH_' + Utilities.getUuid().substring(0, 8).toUpperCase();
    out.batchId = batchId;
    var cascade = runDeleteCascade_(ss, mSet, sSet, batchId, nowIso);
    out.cascade = cascade;

    // 3. 検証: 13テーブルすべて移動件数1・live 残存0・archive 側にバッチ行あり・purge 1件
    out.passed = true;
    var expectedTables = getCascadeMatchers_(mSet, sSet, {});
    for (var i = 0; i < expectedTables.length; i++) {
      var tbl = expectedTables[i][0];
      check('moved:' + tbl, cascade.moved[tbl] === 1, 'moved=' + cascade.moved[tbl]);
    }
    check('purge:T_ログイン履歴', cascade.purgedLoginHistory === 1, 'purged=' + cascade.purgedLoginHistory);
    var residue = countDryRunCascadeRows_(ss, tag, false);
    check('live残存0', residue === 0, 'liveResidue=' + residue);
    var archived = countDryRunCascadeRows_(ss, tag, true);
    check('archive移動13', archived === 13, 'archivedRows=' + archived);

    // 4. 復元 → live に13行戻り archive からバッチ消滅
    var restoreResult = restoreArchiveBatch_(batchId);
    out.restore = restoreResult;
    var restoredLive = countDryRunCascadeRows_(ss, tag, false);
    check('復元後live13', restoredLive === 13, 'liveAfterRestore=' + restoredLive);
    var archivedAfter = countDryRunCascadeRows_(ss, tag, true);
    check('復元後archive0', archivedAfter === 0, 'archiveAfterRestore=' + archivedAfter);
  } catch (e) {
    out.passed = false;
    out.error = String((e && e.stack) || e);
  } finally {
    try { cleanupDryRunDeleteCascade(); } catch (e2) { out.cleanupError = String(e2); }
  }
  Logger.log(JSON.stringify(out, null, 2));
  return JSON.stringify(out);
}

function cleanupDryRunDeleteCascade() {
  var ss = getOrCreateDatabase_();
  var tag = DRYRUN_CASCADE_TAG;
  var removed = 0;
  var sheetNames = [];
  for (var i = 0; i < ARCHIVE_SOURCE_TABLES.length; i++) {
    sheetNames.push(ARCHIVE_SOURCE_TABLES[i]);
    sheetNames.push(ARCHIVE_SOURCE_TABLES[i] + '_archive');
  }
  sheetNames.push('T_削除ログ');
  for (var n = 0; n < sheetNames.length; n++) {
    removed += removeRowsWithCellPrefix_(ss, sheetNames[n], tag);
  }
  removed += removeRowsWithCellPrefix_(getLogSs_(), 'T_ログイン履歴', tag);
  Logger.log('[cleanupDryRunDeleteCascade] removed=' + removed);
  return removed;
}

function healthCheckPasswordPepper() {
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
      manifestKey: DRYRUN_MANIFEST_KEY,
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

  // Manifest を ScriptProperties に保存（cleanup 用）
  var existingManifestJson = PropertiesService.getScriptProperties().getProperty(DRYRUN_MANIFEST_KEY);
  var manifestAccumulator = { runs: [] };
  if (existingManifestJson) {
    try { manifestAccumulator = JSON.parse(existingManifestJson); } catch (e) {}
    if (!manifestAccumulator.runs) manifestAccumulator.runs = [];
  }
  manifestAccumulator.runs.push({
    runId: state.report.runId,
    startedAt: startedAt,
    finishedAt: state.report.finishedAt,
    memberIds: Object.keys(state.manifest.memberIds),
    staffIds: Object.keys(state.manifest.staffIds),
    authIds: Object.keys(state.manifest.authIds),
    requestIds: Object.keys(state.manifest.requestIds),
  });
  PropertiesService.getScriptProperties().setProperty(DRYRUN_MANIFEST_KEY, JSON.stringify(manifestAccumulator));

  Logger.log('dryRunApplicationScenarios: ' + JSON.stringify(state.report));
  // clasp run は util.inspect で出力するためネストが [Object]/[Array] に省略される。
  // 文字列で返すことで全データを取り出せるようにする。
  return '__DRYRUN_JSON__' + JSON.stringify(state.report);
}

function previewDryRunApplicationCleanup() {
  dryRun_assertAdminOperator_();
  var manifestJson = PropertiesService.getScriptProperties().getProperty(DRYRUN_MANIFEST_KEY);
  if (!manifestJson) return '__DRYRUN_JSON__' + JSON.stringify({ runs: 0, totalRows: 0, message: 'manifest 未保存（dryRunApplicationScenarios 未実行）' });
  var manifest;
  try { manifest = JSON.parse(manifestJson); } catch (e) { return '__DRYRUN_JSON__' + JSON.stringify({ error: 'manifest parse 失敗: ' + e.message }); }
  var runs = (manifest && manifest.runs) || [];
  var memberSet = {}, staffSet = {}, authSet = {}, requestSet = {};
  for (var r = 0; r < runs.length; r++) {
    (runs[r].memberIds || []).forEach(function(id) { memberSet[id] = true; });
    (runs[r].staffIds || []).forEach(function(id) { staffSet[id] = true; });
    (runs[r].authIds || []).forEach(function(id) { authSet[id] = true; });
    (runs[r].requestIds || []).forEach(function(id) { requestSet[id] = true; });
  }
  var out = {
    runs: runs.length,
    counts: {
      members: Object.keys(memberSet).length,
      staff: Object.keys(staffSet).length,
      auth: Object.keys(authSet).length,
      changeRequests: Object.keys(requestSet).length,
    },
    sampleMemberIds: Object.keys(memberSet).slice(0, 5),
    note: 'soft delete (削除フラグ=true) のみ。executeDryRunApplicationCleanup で実行。',
  };
  return '__DRYRUN_JSON__' + JSON.stringify(out);
}

function executeDryRunApplicationCleanup() {
  dryRun_assertAdminOperator_();
  var manifestJson = PropertiesService.getScriptProperties().getProperty(DRYRUN_MANIFEST_KEY);
  if (!manifestJson) return { success: false, error: 'manifest 未保存' };
  var manifest;
  try { manifest = JSON.parse(manifestJson); } catch (e) { return { success: false, error: 'manifest parse 失敗: ' + e.message }; }
  var ss = getOrCreateDatabase_();
  var runs = (manifest && manifest.runs) || [];
  var memberSet = {}, staffSet = {}, authSet = {}, requestSet = {};
  for (var r = 0; r < runs.length; r++) {
    (runs[r].memberIds || []).forEach(function(id) { memberSet[id] = true; });
    (runs[r].staffIds || []).forEach(function(id) { staffSet[id] = true; });
    (runs[r].authIds || []).forEach(function(id) { authSet[id] = true; });
    (runs[r].requestIds || []).forEach(function(id) { requestSet[id] = true; });
  }
  var result = {
    success: true,
    deleted: {
      members: dryRun_softDeleteByKey_(ss, 'T_会員', '会員ID', Object.keys(memberSet)),
      staff: dryRun_softDeleteByKey_(ss, 'T_事業所職員', '職員ID', Object.keys(staffSet)),
      auth: dryRun_softDeleteByKey_(ss, 'T_認証アカウント', '認証ID', Object.keys(authSet)),
      changeRequests: dryRun_softDeleteByKey_(ss, 'T_変更申請', '申請ID', Object.keys(requestSet)),
    },
  };
  // manifest クリア（冪等性のため）
  PropertiesService.getScriptProperties().deleteProperty(DRYRUN_MANIFEST_KEY);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  Logger.log('executeDryRunApplicationCleanup: ' + JSON.stringify(result));
  return '__DRYRUN_JSON__' + JSON.stringify(result);
}
