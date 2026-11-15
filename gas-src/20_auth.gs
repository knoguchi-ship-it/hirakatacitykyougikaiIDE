// gas-src/20_auth.gs — ログイン・パスワード・ロック・管理者の認証・pepper。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

function seedAuthAccounts_(ss, now) {
  var basePassword = 'demo1234';
  var supportS2 = buildSupportLoginId_('99999999-S2');
  var supportS3 = buildSupportLoginId_('99999999-S3');
  var supportMember = buildSupportLoginId_('934567890');

  appendRowsByHeaders_(ss, 'T_認証アカウント', [
    createPasswordAuthRow_('AUTH-I-12345678', '12345678', 'INDIVIDUAL_MEMBER', '12345678', '', basePassword, now),
    createPasswordAuthRow_('AUTH-I-87654321', '87654321', 'INDIVIDUAL_MEMBER', '87654321', '', basePassword, now),
    createPasswordAuthRow_('AUTH-S-934567890', supportMember, 'INDIVIDUAL_MEMBER', '934567890', '', basePassword, now),
    createPasswordAuthRow_('AUTH-B-S1', '11223344', 'BUSINESS_ADMIN', '99999999', 'S1', basePassword, now),
    createPasswordAuthRow_('AUTH-B-S2', supportS2, 'BUSINESS_MEMBER', '99999999', 'S2', basePassword, now),
    createPasswordAuthRow_('AUTH-B-S3', supportS3, 'BUSINESS_MEMBER', '99999999', 'S3', basePassword, now),
    {
      認証ID: 'AUTH-ADMIN-GOOGLE',
      認証方式: 'GOOGLE',
      ログインID: '',
      パスワードハッシュ: '',
      パスワードソルト: '',
      GoogleユーザーID: 'demo-google-sub-001',
      Googleメール: 'k.noguchi@uguisunosato.or.jp',
      システムロールコード: 'OFFICE_ADMIN',
      会員ID: '99999999',
      職員ID: 'S1',
      最終ログイン日時: '',
      パスワード更新日時: '',
      アカウント有効フラグ: true,
      ログイン失敗回数: 0,
      ロック状態: false,
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);
}

/**
 * 会員ログインE2Eのため、代表的な会員認証アカウントのみを安全に再作成する。
 * - 既存データ全削除は行わない（seedDemoData は呼ばない）
 * - 対象: 個人会員2件 + 事業所管理者1件
 * - パスワードは一括で demo1234 に再設定する
 */
function provisionTestMemberAccounts() {
  var ss = getOrCreateDatabase_();
  var nowIso = new Date().toISOString();
  var defaultPassword = 'demo1234';
  var specs = [
    { authId: 'AUTH-I-12345678', loginId: '12345678', roleCode: 'INDIVIDUAL_MEMBER', memberId: '12345678', staffId: '' },
    { authId: 'AUTH-I-87654321', loginId: '87654321', roleCode: 'INDIVIDUAL_MEMBER', memberId: '87654321', staffId: '' },
    { authId: 'AUTH-B-S1', loginId: '11223344', roleCode: 'BUSINESS_ADMIN', memberId: '99999999', staffId: 'S1' },
  ];
  var updated = [];
  for (var i = 0; i < specs.length; i += 1) {
    updated.push(upsertPasswordAuthAccount_(ss, specs[i], defaultPassword, nowIso));
  }
  return {
    ok: true,
    message: '会員テスト認証アカウントを再生成しました。',
    password: defaultPassword,
    updated: updated,
  };
}

function upsertPasswordAuthAccount_(ss, spec, plainPassword, nowIso) {
  var sheet = ss.getSheetByName('T_認証アカウント');
  if (!sheet) throw new Error('T_認証アカウント シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '認証ID', String(spec.authId || ''));
  if (!found) {
    found = findRowByColumnValue_(sheet, 'ログインID', String(spec.loginId || ''));
  }

  var salt = generateSalt_();
  var hash = hashPasswordCurrent_(String(plainPassword || ''), salt);

  if (!found) {
    appendRowsByHeaders_(ss, 'T_認証アカウント', [
      createPasswordAuthRow_(
        String(spec.authId || ''),
        String(spec.loginId || ''),
        String(spec.roleCode || 'INDIVIDUAL_MEMBER'),
        String(spec.memberId || ''),
        String(spec.staffId || ''),
        String(plainPassword || ''),
        nowIso
      ),
    ]);
    return {
      authId: String(spec.authId || ''),
      loginId: String(spec.loginId || ''),
      memberId: String(spec.memberId || ''),
      created: true,
      updated: true,
    };
  }

  var row = found.row.slice();
  var cols = found.columns;
  function setCol(name, value) {
    var idx = cols[name];
    if (idx != null) row[idx] = value;
  }

  setCol('認証方式', 'PASSWORD');
  setCol('ログインID', String(spec.loginId || ''));
  setCol('パスワードハッシュ', hash);
  setCol('パスワードソルト', salt);
  setCol('GoogleユーザーID', '');
  setCol('Googleメール', '');
  setCol('システムロールコード', String(spec.roleCode || 'INDIVIDUAL_MEMBER'));
  setCol('会員ID', String(spec.memberId || ''));
  setCol('職員ID', String(spec.staffId || ''));
  setCol('パスワード更新日時', nowIso);
  setCol('アカウント有効フラグ', true);
  setCol('ログイン失敗回数', 0);
  setCol('ロック状態', false);
  setCol('更新日時', nowIso);
  setCol('削除フラグ', false);
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  return {
    authId: String(row[cols['認証ID']] || spec.authId || ''),
    loginId: String(spec.loginId || ''),
    memberId: String(spec.memberId || ''),
    created: false,
    updated: true,
  };
}

function createPasswordAuthRow_(authId, loginId, roleCode, memberId, staffId, plainPassword, now) {
  var salt = generateSalt_();
  return {
    認証ID: authId,
    認証方式: 'PASSWORD',
    ログインID: loginId,
    パスワードハッシュ: hashPasswordCurrent_(plainPassword, salt),
    パスワードソルト: salt,
    GoogleユーザーID: '',
    Googleメール: '',
    システムロールコード: roleCode,
    会員ID: memberId,
    職員ID: staffId || '',
    最終ログイン日時: '',
    パスワード更新日時: now,
    アカウント有効フラグ: true,
    ログイン失敗回数: 0,
    ロック状態: false,
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  };
}

function getCredentialsTempHeaders_() {
  return [
    '氏名',
    'ログインID',
    '初期パスワード',
    'メール',
    '会員種別',
    '会員ID',
    '職員ID',
    '認証ID',
    '通知対象種別',
    'パスワード状態',
    'アカウント有効',
    '通知状況',
    '通知日時',
    '再発行日時',
    '更新日時',
    '備考',
  ];
}

function generateCredentialTempPassword_() {
  var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + ':' + new Date().getTime());
  var chars = [];
  for (var i = 0; i < PASSWORD_GENERATED_LENGTH; i += 1) {
    var idx = Math.abs(bytes[i % bytes.length]) % alphabet.length;
    chars.push(alphabet.charAt(idx));
  }
  return chars.join('');
}

function buildCredentialsTempRows_(ss, plainPasswordByAuthId, options) {
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['認証方式'] || '') === 'PASSWORD';
  });
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });

  var memberById = {};
  var staffById = {};
  for (var i = 0; i < memberRows.length; i += 1) {
    memberById[String(memberRows[i]['会員ID'] || '')] = memberRows[i];
  }
  for (var j = 0; j < staffRows.length; j += 1) {
    staffById[String(staffRows[j]['職員ID'] || '')] = staffRows[j];
  }

  var existingLedger = {};
  var ledgerSheet = ss.getSheetByName('_CREDENTIALS_TEMP');
  if (ledgerSheet && ledgerSheet.getLastRow() >= 2) {
    var existingRows = getRowsAsObjects_(ss, '_CREDENTIALS_TEMP');
    for (var k = 0; k < existingRows.length; k += 1) {
      var authId = String(existingRows[k]['認証ID'] || '');
      if (authId) existingLedger[authId] = existingRows[k];
    }
  }

  var rows = [];
  var missingLinks = [];
  var nowIso = String((options && options.updatedAt) || new Date().toISOString());
  var reissuedAt = String((options && options.reissuedAt) || '');

  for (var a = 0; a < authRows.length; a += 1) {
    var auth = authRows[a];
    var authIdValue = String(auth['認証ID'] || '');
    var memberId = String(auth['会員ID'] || '');
    var staffId = String(auth['職員ID'] || '');
    var member = memberById[memberId] || null;
    var staff = staffId ? (staffById[staffId] || null) : null;
    var nameFields = staff ? normalizeStaffNameFields_(staff) : null;
    var plainPassword = plainPasswordByAuthId && plainPasswordByAuthId[authIdValue] ? String(plainPasswordByAuthId[authIdValue]) : '';
    var existing = existingLedger[authIdValue] || {};
    var memberTypeCode = member ? String(member['会員種別コード'] || '') : '';
    var memberDisplayName = member
      ? (joinHumanNameParts_(member['姓'], member['名']) || String(member['事業所名'] || ''))
      : '';
    var displayName = staff ? nameFields.name : memberDisplayName;
    var email = staff
      ? (String(staff['メールアドレス'] || '').trim() || String((member && member['代表メールアドレス']) || '').trim())
      : String((member && member['代表メールアドレス']) || '').trim();

    if (!member || (staffId && !staff)) {
      missingLinks.push({
        authId: authIdValue,
        loginId: String(auth['ログインID'] || ''),
        memberId: memberId,
        staffId: staffId,
      });
    }

    rows.push({
      氏名: displayName,
      ログインID: String(auth['ログインID'] || ''),
      初期パスワード: plainPassword,
      メール: email,
      会員種別: masterLabel_(ss, 'M_会員種別', memberTypeCode),
      会員ID: memberId,
      職員ID: staffId,
      認証ID: authIdValue,
      通知対象種別: staff ? 'STAFF' : 'MEMBER',
      パスワード状態: plainPassword ? 'REISSUED' : 'HASH_ONLY',
      アカウント有効: toBoolean_(auth['アカウント有効フラグ']) ? 'true' : 'false',
      通知状況: plainPassword ? '' : String(existing['通知状況'] || ''),
      通知日時: plainPassword ? '' : String(existing['通知日時'] || ''),
      再発行日時: plainPassword ? reissuedAt : '',
      更新日時: nowIso,
      備考: String(existing['備考'] || ''),
    });
  }

  rows.sort(function(a, b) {
    var aKey = [a['会員種別'], a['氏名'], a['ログインID']].join('|');
    var bKey = [b['会員種別'], b['氏名'], b['ログインID']].join('|');
    return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
  });

  return {
    headers: getCredentialsTempHeaders_(),
    rows: rows,
    missingLinks: missingLinks,
  };
}

function rebuildCredentialsTempSheet_(ss, plainPasswordByAuthId, options) {
  var targetSs = ss || getOrCreateDatabase_();
  var build = buildCredentialsTempRows_(targetSs, plainPasswordByAuthId || {}, options || {});
  writeObjectRowsToSheet_(targetSs, '_CREDENTIALS_TEMP', build.headers, build.rows);
  return {
    sheetName: '_CREDENTIALS_TEMP',
    rowCount: build.rows.length,
    missingLinkCount: build.missingLinks.length,
    missingLinks: build.missingLinks,
    passwordStateCounts: summarizeByKey_(build.rows, 'パスワード状態'),
  };
}

function parseCredentialReissueOptions_(options) {
  if (!options) return {};
  if (typeof options === 'string') {
    var text = String(options).trim();
    if (!text) return {};
    return JSON.parse(text);
  }
  return options;
}

function resolveCredentialReissueTargets_(authRows, options) {
  var opts = parseCredentialReissueOptions_(options);
  var authIdSet = makeLookupSet_(opts.authIds);
  var memberIdSet = makeLookupSet_(opts.memberIds);
  var staffIdSet = makeLookupSet_(opts.staffIds);
  var loginIdSet = makeLookupSet_(opts.loginIds);
  var hasScope = Object.keys(authIdSet).length || Object.keys(memberIdSet).length || Object.keys(staffIdSet).length || Object.keys(loginIdSet).length;
  if (!hasScope && opts.confirmAll !== true) {
    throw new Error('全件再発行は confirmAll=true が必要です。');
  }
  return authRows.filter(function(auth) {
    if (String(auth['認証方式'] || '') !== 'PASSWORD') return false;
    if (toBoolean_(auth['削除フラグ'])) return false;
    if (opts.activeOnly !== false && !toBoolean_(auth['アカウント有効フラグ'])) return false;
    if (!hasScope) return true;
    var authId = String(auth['認証ID'] || '');
    var memberId = String(auth['会員ID'] || '');
    var staffId = String(auth['職員ID'] || '');
    var loginId = String(auth['ログインID'] || '');
    return !!(authIdSet[authId] || memberIdSet[memberId] || staffIdSet[staffId] || loginIdSet[loginId]);
  });
}

function makeLookupSet_(values) {
  var set = {};
  var items = Array.isArray(values) ? values : [];
  for (var i = 0; i < items.length; i += 1) {
    var key = String(items[i] || '').trim();
    if (key) set[key] = true;
  }
  return set;
}

function summarizeByKey_(rows, key) {
  var summary = {};
  for (var i = 0; i < rows.length; i += 1) {
    var value = String(rows[i][key] || '');
    summary[value] = (summary[value] || 0) + 1;
  }
  return summary;
}

function rebuildCredentialsTemp() {
  var ss = getOrCreateDatabase_();
  return rebuildCredentialsTempSheet_(ss, {}, { updatedAt: new Date().toISOString() });
}

function rebuildCredentialsTempJson() {
  return JSON.stringify(rebuildCredentialsTemp());
}

function inspectCredentialsTemp_() {
  var ss = getOrCreateDatabase_();
  var rows = getRowsAsObjects_(ss, '_CREDENTIALS_TEMP');
  return {
    exists: !!ss.getSheetByName('_CREDENTIALS_TEMP'),
    rowCount: rows.length,
    passwordStateCounts: summarizeByKey_(rows, 'パスワード状態'),
    notificationStatusCounts: summarizeByKey_(rows, '通知状況'),
    blankPasswordCount: rows.filter(function(row) {
      return !String(row['初期パスワード'] || '').trim();
    }).length,
    sample: rows.slice(0, 5),
  };
}

function inspectCredentialsTempJson() {
  return JSON.stringify(inspectCredentialsTemp_());
}

function previewCredentialPasswordReissue(options) {
  var ss = getOrCreateDatabase_();
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント');
  var targets = resolveCredentialReissueTargets_(authRows, options);
  return {
    targetCount: targets.length,
    targets: targets.slice(0, 20).map(function(row) {
      return {
        authId: String(row['認証ID'] || ''),
        loginId: String(row['ログインID'] || ''),
        memberId: String(row['会員ID'] || ''),
        staffId: String(row['職員ID'] || ''),
      };
    }),
  };
}

function previewCredentialPasswordReissueJson(options) {
  return JSON.stringify(previewCredentialPasswordReissue(options));
}

function previewAllActiveCredentialPasswordReissue() {
  return previewCredentialPasswordReissue({ confirmAll: true, activeOnly: true });
}

function previewAllActiveCredentialPasswordReissueJson() {
  return JSON.stringify(previewAllActiveCredentialPasswordReissue());
}

function reissueCredentialPasswords(options) {
  var parsedOptions = parseCredentialReissueOptions_(options);
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_認証アカウント');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('T_認証アカウント が見つかりません。');

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  requireColumns_(cols, ['認証ID', '認証方式', 'ログインID', 'パスワードハッシュ', 'パスワードソルト', 'パスワード更新日時', 'アカウント有効フラグ', 'ログイン失敗回数', 'ロック状態', '更新日時', '削除フラグ']);

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var authObjects = rows.map(function(row) {
    var obj = {};
    for (var h = 0; h < headers.length; h += 1) obj[headers[h]] = row[h];
    return obj;
  });
  var targets = resolveCredentialReissueTargets_(authObjects, parsedOptions);
  var targetByAuthId = {};
  for (var t = 0; t < targets.length; t += 1) targetByAuthId[String(targets[t]['認証ID'] || '')] = true;

  var nowIso = new Date().toISOString();
  var plainPasswordByAuthId = {};
  var updated = 0;
  for (var r = 0; r < rows.length; r += 1) {
    var authId = String(rows[r][cols['認証ID']] || '');
    if (!targetByAuthId[authId]) continue;
    var plainPassword = generateCredentialTempPassword_();
    var salt = generateSalt_();
    rows[r][cols['パスワードハッシュ']] = hashPasswordCurrent_(plainPassword, salt);
    rows[r][cols['パスワードソルト']] = salt;
    rows[r][cols['パスワード更新日時']] = nowIso;
    rows[r][cols['アカウント有効フラグ']] = true;
    rows[r][cols['ログイン失敗回数']] = 0;
    rows[r][cols['ロック状態']] = false;
    if (cols['ロック解除予定日時'] != null) rows[r][cols['ロック解除予定日時']] = '';
    rows[r][cols['更新日時']] = nowIso;
    plainPasswordByAuthId[authId] = plainPassword;
    updated += 1;
  }

  if (updated > 0) {
    sheet.getRange(2, 1, rows.length, sheet.getLastColumn()).setValues(rows);
  }

  var ledgerResult = rebuildCredentialsTempSheet_(ss, plainPasswordByAuthId, {
    updatedAt: nowIso,
    reissuedAt: nowIso,
  });
  clearAllDataCache_();
  return {
    updatedAuthCount: updated,
    credentialsSheet: ledgerResult.sheetName,
    credentialsRowCount: ledgerResult.rowCount,
    missingLinkCount: ledgerResult.missingLinkCount,
  };
}

function reissueCredentialPasswordsJson(options) {
  return JSON.stringify(reissueCredentialPasswords(options));
}

function reissueAllActiveCredentialPasswords() {
  return reissueCredentialPasswords({ confirmAll: true, activeOnly: true });
}

function reissueAllActiveCredentialPasswordsJson() {
  return JSON.stringify(reissueAllActiveCredentialPasswords());
}

function resolvePasswordAuthContextByLoginId_(ss, loginId) {
  var normalizedLoginId = String(loginId || '').trim();
  if (!normalizedLoginId) {
    throw new Error('認証情報が不足しています。');
  }
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) {
    throw new Error('認証アカウントテーブルが見つかりません。');
  }
  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', normalizedLoginId);
  if (!authRowInfo) {
    throw new Error('認証情報が見つかりません。');
  }
  var row = authRowInfo.row;
  var cols = authRowInfo.columns;
  requireColumns_(cols, ['認証方式', '会員ID', '職員ID', 'アカウント有効フラグ', 'ロック状態']);
  if (String(row[cols['認証方式']] || '') !== 'PASSWORD') {
    throw new Error('会員認証アカウントではありません。');
  }
  if (!toBoolean_(row[cols['アカウント有効フラグ']])) {
    throw new Error('アカウントが無効化されています。');
  }
  if (toBoolean_(row[cols['ロック状態']])) {
    // 待機時間を過ぎたロックはここでも通す（ログインだけ解除されて他が通らない状態を作らない）。
    var selfLockState = evaluateLoginLockState_(
      true,
      cols['ログイン失敗回数'] != null ? row[cols['ログイン失敗回数']] : 0,
      cols['ロック解除予定日時'] != null ? row[cols['ロック解除予定日時']] : '',
      Date.now());
    if (!selfLockState.expired) {
      throw new Error('アカウントがロックされています。');
    }
    // v376.79: ここでも失敗回数は保持する（memberLogin_ と挙動を揃える）。
    // 以前は 0 に戻していたため、パスワード再設定の導線を叩くだけでカウントを消せた。
    releaseLoginLockKeepingFailures_(authSheet, authRowInfo.rowNumber, cols);
  }
  return {
    authSheet: authSheet,
    authRowInfo: authRowInfo,
    authRow: row,
    authColumns: cols,
    loginId: normalizedLoginId,
    memberId: String(row[cols['会員ID']] || '').trim(),
    staffId: String(row[cols['職員ID']] || '').trim(),
  };
}

function resolveMemberPrincipalPayload_(payload) {
  var normalizedPayload = payload || {};
  var ss = getOrCreateDatabase_();
  var authContext = resolvePasswordAuthContextByLoginId_(ss, normalizedPayload.loginId);
  var resolved = {};
  for (var key in normalizedPayload) {
    if (Object.prototype.hasOwnProperty.call(normalizedPayload, key)) {
      resolved[key] = normalizedPayload[key];
    }
  }
  resolved.loginId = authContext.loginId;
  resolved.id = authContext.memberId;
  resolved.memberId = authContext.memberId;
  if (authContext.staffId) {
    resolved.staffId = authContext.staffId;
  }
  return resolved;
}

function updateMemberSelfByPrincipal_(payload) {
  var resolved = resolveMemberPrincipalPayload_(payload);
  var result = updateMemberSelf_(resolved);
  notifyMembershipChatForMember_(getOrCreateDatabase_(), 'FINAL', resolved.id, {
    '手続種別': '会員情報変更（本人操作）',
    '申請ID': '',
    '変更内容': '会員マイページから会員情報が更新されました。',
    '異常内容': '',
  });
  return result;
}

function withdrawSelfByPrincipal_(payload) {
  var resolved = resolveMemberPrincipalPayload_(payload);
  var result = withdrawSelf_(resolved);
  notifyMembershipChatForMember_(getOrCreateDatabase_(), 'FINAL', resolved.memberId, {
    '手続種別': '退会申請（年度末）',
    '申請ID': '',
    '変更内容': '会員マイページから年度末退会が申請されました。',
    '異常内容': '',
  });
  return result;
}

function cancelWithdrawalSelfByPrincipal_(payload) {
  return cancelWithdrawalSelf_(resolveMemberPrincipalPayload_(payload));
}

function changePassword_(request) {
  if (!request || !request.loginId || !request.currentPassword || !request.newPassword) {
    throw new Error('パスワード変更パラメータが不足しています。');
  }

  var loginId = String(request.loginId).trim();
  var currentPassword = String(request.currentPassword);
  var newPassword = String(request.newPassword);

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    throw new Error('新しいパスワードは' + PASSWORD_MIN_LENGTH + '文字以上で入力してください。');
  }
  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    throw new Error('新しいパスワードは' + PASSWORD_MAX_LENGTH + '文字以内で入力してください。');
  }
  if (!validatePasswordCharset_(newPassword)) {
    throw new Error('使用できない文字が含まれています。半角英数字と一部記号 (! @ # $ % ^ * ( ) _ + - = [ ] { } ; : , . ? / | ~) のみ使用できます。');
  }

  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) {
    throw new Error('認証アカウントテーブルが見つかりません。');
  }

  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', loginId);
  if (!authRowInfo) {
    appendLoginHistory_(ss, '', loginId, 'PASSWORD', 'FAILURE', 'ログインID未登録');
    throw new Error('ログインIDが存在しません。');
  }

  var row = authRowInfo.row;
  var columns = authRowInfo.columns;
  requireColumns_(columns, [
    '認証ID',
    'パスワードハッシュ',
    'パスワードソルト',
    'パスワード更新日時',
    'アカウント有効フラグ',
    'ログイン失敗回数',
    'ロック状態',
    'ロック解除予定日時',
    '更新日時',
  ]);
  var authId = row[columns['認証ID']];
  var isActive = toBoolean_(row[columns['アカウント有効フラグ']]);
  var isLocked = toBoolean_(row[columns['ロック状態']]);
  var failedCount = Number(row[columns['ログイン失敗回数']] || 0);

  if (!isActive) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'アカウント無効');
    throw new Error('アカウントが無効です。');
  }
  if (isLocked) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'アカウントロック');
    throw new Error('アカウントがロックされています。');
  }

  var storedSalt = String(row[columns['パスワードソルト']] || '');
  var storedHash = String(row[columns['パスワードハッシュ']] || '');
  if (!storedSalt || !storedHash) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'パスワード未初期化');
    throw new Error('パスワードが初期化されていません。管理者へ連絡してください。');
  }

  var verifyChangeResult = verifyPassword_(currentPassword, storedSalt, storedHash);
  if (!verifyChangeResult.match) {
    var changeFailure = applyLoginFailure_(authSheet, authRowInfo.rowNumber, columns, failedCount, Date.now());
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE',
      '現在パスワード不一致（' + changeFailure.failedCount + '回連続'
        + (changeFailure.locked ? ('・' + (changeFailure.permanent ? '恒久ロック' : 'ロック ' + changeFailure.waitMinutes + '分')) : '') + '）');
    // ここは認証済みの本人操作なので、ロック状態を隠す必要はない（画面文言は変えない）。
    throw new Error('現在のパスワードが正しくありません。');
  }
  if (verifyChangeResult.needsRehash) {
    var rehashSalt = generateSalt_();
    var rehashValue = hashPasswordCurrent_(currentPassword, rehashSalt);
    authSheet.getRange(authRowInfo.rowNumber, columns['パスワードソルト'] + 1).setValue(rehashSalt);
    authSheet.getRange(authRowInfo.rowNumber, columns['パスワードハッシュ'] + 1).setValue(rehashValue);
  }

  var newSalt = generateSalt_();
  var newHash = hashPasswordCurrent_(newPassword, newSalt);
  var nowIso = new Date().toISOString();

  authSheet.getRange(authRowInfo.rowNumber, columns['パスワードソルト'] + 1).setValue(newSalt);
  authSheet.getRange(authRowInfo.rowNumber, columns['パスワードハッシュ'] + 1).setValue(newHash);
  authSheet.getRange(authRowInfo.rowNumber, columns['パスワード更新日時'] + 1).setValue(nowIso);
  clearLoginLockout_(authSheet, authRowInfo.rowNumber, columns);
  if (columns['更新日時'] != null) {
    authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(nowIso);
  }

  appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'SUCCESS', 'パスワード変更成功');

  return {
    loginId: loginId,
    updatedAt: nowIso,
  };
}

/**
 * v376.55: 管理者による会員パスワードリセット。
 * 会員がパスワードを失念し OTP 経路も使えない場合の救済、およびテスト会員の資格情報整備に使う。
 *
 * 特徴:
 * - 現行パスワードの入力は不要（admin 権限で強制リセット）。RBAC は processApiRequest 側 + 本関数内 checkAdminBySession_ で二重防御。
 * - 新パスワードは generateCredentialTempPassword_（安全乱数 15 文字）で自動生成し、hashPasswordCurrent_ で現行方式ハッシュ化。
 *   → ARGON2_ENABLED の状態に自動追従（false=PBKDF2 / true=Argon2id）。
 * - リセットと同時に ロック状態=false / ログイン失敗回数=0 に戻す。
 * - 平文パスワードは戻り値で 1 度だけ返す（呼び出し元が画面に表示）。ログ・監査には平文・ハッシュとも一切記録しない（AGENTS §0）。
 *
 * 対象特定: **認証ID（内部一意キー）必須**。会員種別・会員IDからの推測は一切しない（誤リセット防止・operator 指摘 2026-07-08）。
 * operator は getMemberAuthAccounts_ が返す認証アカウント一覧から対象を選び、その行の認証IDで本関数を呼ぶ。
 * ログインID は顧客に見える表示用、認証ID はシステム内部の一意キー。書込対象の特定は必ず認証IDで行う。
 * 認証方式は PASSWORD のみリセット可（Google 認証等は対象外）。
 */
// v376.78: ログインロックの解除（パスワードは変えない）。
//
// v376.71 で時限ロックを入れたが、連続 20 回失敗で到達する恒久ロックには
// 「資格情報の再発行」しか解除手段が無く、**パスワードまで変わってしまう**（SOW §8 U-26）。
// 正当な利用者は成功でカウントが 0 に戻るため恒久ロックには到達しないが、
// ログイン ID が介護支援専門員番号で推測できる以上、第三者に狙われて到達させられる可能性は残る。
// その復旧を事務局が自力でできるようにする。
//
// GCP 移行後は別実装として再検討する（ランニングコストの観点。operator 判断・2026-09-05）。
// 詳細は docs/272 の GCP 移植メモ。
function adminUnlockMemberAccount_(payload) {
  var adminSession = checkAdminBySession_();
  if (!adminSession) {
    throw new Error('管理者認証が確認できません。');
  }
  var authIdInput = payload && payload.authId != null ? String(payload.authId).trim() : '';
  if (!authIdInput) {
    throw new Error('解除対象の認証IDを指定してください。');
  }

  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var authSheet = ss.getSheetByName('T_認証アカウント');
    if (!authSheet) {
      throw new Error('認証アカウントテーブルが見つかりません。');
    }
    var authRowInfo = findRowByColumnValue_(authSheet, '認証ID', authIdInput);
    if (!authRowInfo) {
      throw new Error('指定された認証IDのアカウントが見つかりません。');
    }
    var columns = authRowInfo.columns;
    requireColumns_(columns, ['認証ID', 'ログインID', '認証方式', 'ログイン失敗回数', 'ロック状態', '更新日時', '削除フラグ']);
    var row = authRowInfo.row;
    if (toBoolean_(row[columns['削除フラグ']])) {
      throw new Error('削除済みの認証アカウントは解除できません。');
    }
    if (String(row[columns['認証方式']] || '') !== 'PASSWORD') {
      throw new Error('パスワード認証のアカウントではありません。');
    }

    var wasLocked = toBoolean_(row[columns['ロック状態']]);
    var failedBefore = Number(row[columns['ログイン失敗回数']] || 0);
    var nowIso = new Date().toISOString();

    // ロック状態・失敗回数・解除予定日時をまとめて戻す。ログイン成功時と同じ処理を通す。
    clearLoginLockout_(authSheet, authRowInfo.rowNumber, columns);
    authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(nowIso);
    SpreadsheetApp.flush();

    // 監査ログ（ログインIDは記録するが、パスワード等の秘密値は扱わない）
    try {
      appendAuditLogEntries_([{ operatorEmail: adminSession.loginId, operation: 'ACCOUNT_UNLOCK',
        tableName: 'T_認証アカウント', recordId: authIdInput, fieldName: 'ログインロックの解除',
        oldValue: 'ロック状態=' + wasLocked + ' / 失敗回数=' + failedBefore,
        newValue: 'ロック状態=false / 失敗回数=0（パスワードは変更していない）' }]);
    } catch (auditErr) {
      try { Logger.log('[adminUnlockMemberAccount_] audit log failed: ' + auditErr.message); } catch (e) {}
    }

    clearAllDataCache_();
    return {
      authId: authIdInput,
      loginId: String(row[columns['ログインID']] || ''),
      wasLocked: wasLocked,
      failedCountBefore: failedBefore,
      unlockedAt: nowIso,
    };
  } finally {
    lock.releaseLock();
  }
}

function adminResetMemberPassword_(payload) {
  var adminSession = checkAdminBySession_();
  if (!adminSession) {
    throw new Error('管理者認証が確認できません。');
  }
  var authIdInput = payload && payload.authId != null ? String(payload.authId).trim() : '';
  if (!authIdInput) {
    throw new Error('リセット対象の認証IDを指定してください。');
  }

  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) {
    throw new Error('認証アカウントテーブルが見つかりません。');
  }

  var authRowInfo = findRowByColumnValue_(authSheet, '認証ID', authIdInput);
  if (!authRowInfo) {
    throw new Error('指定された認証IDのアカウントが見つかりません。');
  }
  var columns = authRowInfo.columns;
  requireColumns_(columns, [
    '認証ID',
    'ログインID',
    '認証方式',
    'パスワードハッシュ',
    'パスワードソルト',
    'パスワード更新日時',
    'ログイン失敗回数',
    'ロック状態',
    '更新日時',
    '削除フラグ',
  ]);
  var row = authRowInfo.row;
  if (toBoolean_(row[columns['削除フラグ']])) {
    throw new Error('削除済みの認証アカウントはリセットできません。');
  }
  if (String(row[columns['認証方式']] || '') !== 'PASSWORD') {
    throw new Error('パスワード認証以外のアカウントはリセットできません。');
  }
  var authId = row[columns['認証ID']];
  var targetLoginId = String(row[columns['ログインID']] || '');

  var newPassword = generateCredentialTempPassword_();
  var newSalt = generateSalt_();
  var newHash = hashPasswordCurrent_(newPassword, newSalt);
  var nowIso = new Date().toISOString();

  authSheet.getRange(authRowInfo.rowNumber, columns['パスワードソルト'] + 1).setValue(newSalt);
  authSheet.getRange(authRowInfo.rowNumber, columns['パスワードハッシュ'] + 1).setValue(newHash);
  authSheet.getRange(authRowInfo.rowNumber, columns['パスワード更新日時'] + 1).setValue(nowIso);
  authSheet.getRange(authRowInfo.rowNumber, columns['ログイン失敗回数'] + 1).setValue(0);
  authSheet.getRange(authRowInfo.rowNumber, columns['ロック状態'] + 1).setValue(false);
  authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(nowIso);

  // 監査ログ（T_監査ログ）— 平文・ハッシュとも記録しない（AGENTS §0）
  try {
    // 実行者は loginId（adminSession に email は無い。以前は空欄で記録されていた）
    appendAuditLogEntries_([{ operatorEmail: adminSession.loginId, operation: 'PASSWORD_RESET',
      tableName: 'T_認証アカウント', recordId: authId, fieldName: 'パスワード',
      oldValue: '(リセット実行)', newValue: '(新パスワード発行・値は非記録)' }]);
  } catch (auditErr) {
    // 監査ログ失敗はリセット本体を止めない（値は出さない）
    try { Logger.log('[adminResetMemberPassword_] audit log failed: ' + auditErr.message); } catch (e) {}
  }

  return {
    loginId: targetLoginId,
    newPassword: newPassword,
    resetAt: nowIso,
  };
}

/**
 * v376.55/56: 会員に紐づく認証アカウント一覧（read 専用）。
 * 会員種別からの推測をせず、実データ（T_認証アカウント の 会員ID 一致）で紐付きを列挙する。
 * v376.56: 認証アカウントが「未発行」のユニット（個人/賛助=会員本人、事業所=各職員）も列挙する。
 *   issued=true は adminResetMemberPassword_（認証ID）でリセット、issued=false は adminIssueMemberCredential_ で発行。
 * パスワードハッシュ・ソルト等の機密は返さない（AGENTS §0）。
 * 返り値: [{ issued, authId, loginId, method, active, locked, unit:'MEMBER'|'STAFF', memberId, staffId, personName }]
 */
function getMemberAuthAccounts_(payload) {
  var adminSession = checkAdminBySession_();
  if (!adminSession) {
    throw new Error('管理者認証が確認できません。');
  }
  var memberId = payload && payload.memberId != null ? String(payload.memberId).trim() : '';
  if (!memberId) {
    throw new Error('会員IDを指定してください。');
  }

  var ss = getOrCreateDatabase_();
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(s) {
    return !toBoolean_(s['削除フラグ']) && String(s['会員ID'] || '') === memberId;
  });
  var staffById = {};
  staffRows.forEach(function(s) { staffById[String(s['職員ID'] || '')] = s; });
  var memberRow = null;
  getRowsAsObjects_(ss, 'T_会員').some(function(m) {
    if (String(m['会員ID'] || '') === memberId) { memberRow = m; return true; }
    return false;
  });
  var memberType = memberRow ? String(memberRow['会員種別コード'] || 'INDIVIDUAL') : 'INDIVIDUAL';
  var memberDisplayName = memberRow
    ? (joinHumanNameParts_(memberRow['姓'], memberRow['名']) || String(memberRow['事業所名'] || ''))
    : '';

  var result = [];
  var existingStaffIds = {};
  var hasMemberSelf = false;

  // 発行済み（既存認証アカウント）
  authRows.forEach(function(r) {
    var staffId = String(r['職員ID'] || '').trim();
    if (staffId) { existingStaffIds[staffId] = true; } else { hasMemberSelf = true; }
    var personName = '';
    if (staffId && staffById[staffId]) {
      var nf = normalizeStaffNameFields_(staffById[staffId]);
      personName = nf && nf.name ? nf.name : '';
    } else {
      personName = memberDisplayName;
    }
    result.push({
      issued: true,
      authId: String(r['認証ID'] || ''),
      loginId: String(r['ログインID'] || ''),
      method: String(r['認証方式'] || ''),
      active: toBoolean_(r['アカウント有効フラグ']),
      locked: toBoolean_(r['ロック状態']),
      unit: staffId ? 'STAFF' : 'MEMBER',
      memberId: memberId,
      staffId: staffId,
      personName: personName,
    });
  });

  // 未発行ユニット
  if (memberType === 'BUSINESS') {
    staffRows.forEach(function(s) {
      var sid = String(s['職員ID'] || '').trim();
      if (!sid || existingStaffIds[sid]) return;
      var nf = normalizeStaffNameFields_(s);
      result.push({
        issued: false, authId: '', loginId: '', method: 'PASSWORD',
        active: false, locked: false, unit: 'STAFF',
        memberId: memberId, staffId: sid,
        personName: nf && nf.name ? nf.name : '',
      });
    });
  } else if (!hasMemberSelf) {
    result.push({
      issued: false, authId: '', loginId: '', method: 'PASSWORD',
      active: false, locked: false, unit: 'MEMBER',
      memberId: memberId, staffId: '',
      personName: memberDisplayName,
    });
  }

  return result;
}

/**
 * v376.56: 認証アカウントが無い会員本人/事業所職員へ、ログインID+初期パスワードを新規発行する。
 * 既に PASSWORD 認証がある対象は発行不可（adminResetMemberPassword_ を使う）。
 * 会員種別からの推測はせず、個人/賛助=会員本人（staffId なし）、事業所=職員（staffId 必須）を明示指定。
 * 平文は戻り値で 1 度だけ返す。ログ・監査に平文/ハッシュは記録しない（AGENTS §0）。
 */
function adminIssueMemberCredential_(payload) {
  var adminSession = checkAdminBySession_();
  if (!adminSession) {
    throw new Error('管理者認証が確認できません。');
  }
  var memberId = payload && payload.memberId != null ? String(payload.memberId).trim() : '';
  var staffId = payload && payload.staffId != null ? String(payload.staffId).trim() : '';
  if (!memberId) {
    throw new Error('会員IDを指定してください。');
  }

  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var memberRow = null;
    getRowsAsObjects_(ss, 'T_会員').some(function(m) {
      if (String(m['会員ID'] || '') === memberId && !toBoolean_(m['削除フラグ'])) { memberRow = m; return true; }
      return false;
    });
    if (!memberRow) {
      throw new Error('会員が見つかりません。');
    }
    var memberType = String(memberRow['会員種別コード'] || 'INDIVIDUAL');

    var allAuth = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
      return !toBoolean_(r['削除フラグ']);
    });
    var existingLoginIds = allAuth.map(function(r) { return String(r['ログインID'] || ''); }).filter(Boolean);

    var roleCode, cmNumber, personName;
    if (staffId) {
      var staff = null;
      getRowsAsObjects_(ss, 'T_事業所職員').some(function(s) {
        if (String(s['職員ID'] || '') === staffId && String(s['会員ID'] || '') === memberId && !toBoolean_(s['削除フラグ'])) { staff = s; return true; }
        return false;
      });
      if (!staff) {
        throw new Error('指定された職員が見つかりません。');
      }
      var dupStaff = allAuth.some(function(r) {
        return String(r['職員ID'] || '') === staffId && String(r['認証方式'] || '') === 'PASSWORD';
      });
      if (dupStaff) {
        throw new Error('この職員には既に認証アカウントがあります。パスワードリセットを使用してください。');
      }
      roleCode = String(staff['職員権限コード'] || '') === 'REPRESENTATIVE' ? 'BUSINESS_ADMIN' : 'BUSINESS_MEMBER';
      cmNumber = String(staff['介護支援専門員番号'] || '');
      var snf = normalizeStaffNameFields_(staff);
      personName = snf && snf.name ? snf.name : '';
    } else {
      if (memberType === 'BUSINESS') {
        throw new Error('事業所会員は職員IDを指定してください（会員本人ログインは持ちません）。');
      }
      var dupSelf = allAuth.some(function(r) {
        return String(r['会員ID'] || '') === memberId && !String(r['職員ID'] || '').trim() && String(r['認証方式'] || '') === 'PASSWORD';
      });
      if (dupSelf) {
        throw new Error('この会員には既に認証アカウントがあります。パスワードリセットを使用してください。');
      }
      roleCode = 'INDIVIDUAL_MEMBER';
      cmNumber = String(memberRow['介護支援専門員番号'] || '');
      personName = joinHumanNameParts_(memberRow['姓'], memberRow['名']) || String(memberRow['事業所名'] || '');
    }

    var loginId = generateCmBasedLoginId_(cmNumber, existingLoginIds);
    var newPassword = generateCredentialTempPassword_();
    var authId = Utilities.getUuid();
    var nowIso = new Date().toISOString();
    appendRowsByHeaders_(ss, 'T_認証アカウント', [
      createPasswordAuthRow_(authId, loginId, roleCode, memberId, staffId || '', newPassword, nowIso),
    ]);

    // 監査ログ（値は記録しない）
    try {
      // 実行者は loginId（adminSession に email は無い。以前は空欄で記録されていた）
      appendAuditLogEntries_([{ operatorEmail: adminSession.loginId, operation: 'CREDENTIAL_ISSUE',
        tableName: 'T_認証アカウント', recordId: authId, fieldName: '認証アカウント発行',
        oldValue: '(なし)', newValue: '(ログインID発番・新パスワード発行・値は非記録)' }]);
    } catch (auditErr) {
      try { Logger.log('[adminIssueMemberCredential_] audit log failed: ' + auditErr.message); } catch (e) {}
    }

    return {
      authId: authId,
      loginId: loginId,
      newPassword: newPassword,
      issuedAt: nowIso,
      personName: personName,
    };
  } finally {
    lock.releaseLock();
  }
}

var PASSWORD_RESET_CODE_TTL_SECONDS = 30 * 60;
var PASSWORD_RESET_CODE_TTL_MINUTES = 30;
var PASSWORD_RESET_GENERIC_MESSAGE = '入力内容が登録情報と一致する場合、手続き用メールを送信しました。メールに記載された確認コードを入力してください。';

function normalizeEmailForCompare_(email) {
  return String(email || '').trim().toLowerCase();
}

function passwordResetCacheKey_(loginId) {
  return 'pr_' + hmacSha256Hex_(String(loginId || '').trim(), 'password-reset-cache-key').slice(0, 48);
}

function passwordResetRateLimitKey_(loginId, email) {
  return 'pr_rl_' + hmacSha256Hex_(String(loginId || '').trim() + '|' + normalizeEmailForCompare_(email), 'password-reset-rate-limit').slice(0, 48);
}

function generatePasswordResetCode_(loginId) {
  var seed = Utilities.getUuid() + '|' + String(loginId || '') + '|' + new Date().toISOString();
  var hex = hmacSha256Hex_(seed, 'password-reset-code');
  var value = parseInt(hex.slice(0, 12), 16) % 1000000;
  return ('000000' + value).slice(-6);
}

function resolvePasswordResetTarget_(ss, loginId) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) return null;
  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', loginId);
  if (!authRowInfo) return null;
  var authRow = authRowInfo.row;
  var authCols = authRowInfo.columns;
  requireColumns_(authCols, ['認証ID', '認証方式', '会員ID', '職員ID', 'アカウント有効フラグ', '削除フラグ']);
  if (String(authRow[authCols['認証方式']] || '') !== 'PASSWORD') return null;
  if (!toBoolean_(authRow[authCols['アカウント有効フラグ']])) return null;
  if (toBoolean_(authRow[authCols['削除フラグ']])) return null;

  var authId = String(authRow[authCols['認証ID']] || '').trim();
  var memberId = String(authRow[authCols['会員ID']] || '').trim();
  var staffId = String(authRow[authCols['職員ID']] || '').trim();
  var email = '';
  var displayName = '';

  if (staffId) {
    var staffSheet = ss.getSheetByName('T_事業所職員');
    if (!staffSheet) return null;
    var staffRowInfo = findRowByColumnValue_(staffSheet, '職員ID', staffId);
    if (!staffRowInfo) return null;
    var staffRow = staffRowInfo.row;
    var staffCols = staffRowInfo.columns;
    requireColumns_(staffCols, ['メールアドレス', '姓', '名', '氏名', '削除フラグ']);
    if (toBoolean_(staffRow[staffCols['削除フラグ']])) return null;
    email = String(staffRow[staffCols['メールアドレス']] || '').trim();
    displayName = String(staffRow[staffCols['氏名']] || '').trim()
      || (String(staffRow[staffCols['姓']] || '').trim() + ' ' + String(staffRow[staffCols['名']] || '').trim()).trim();
  } else {
    var memberSheet = ss.getSheetByName('T_会員');
    if (!memberSheet) return null;
    var memberRowInfo = findRowByColumnValue_(memberSheet, '会員ID', memberId);
    if (!memberRowInfo) return null;
    var memberRow = memberRowInfo.row;
    var memberCols = memberRowInfo.columns;
    requireColumns_(memberCols, ['代表メールアドレス', '姓', '名', '勤務先名', '削除フラグ']);
    if (toBoolean_(memberRow[memberCols['削除フラグ']])) return null;
    email = String(memberRow[memberCols['代表メールアドレス']] || '').trim();
    displayName = (String(memberRow[memberCols['姓']] || '').trim() + ' ' + String(memberRow[memberCols['名']] || '').trim()).trim()
      || String(memberRow[memberCols['勤務先名']] || '').trim();
  }

  if (!email) return null;
  return {
    authSheet: authSheet,
    authRowInfo: authRowInfo,
    authColumns: authCols,
    authId: authId,
    loginId: String(loginId || '').trim(),
    memberId: memberId,
    staffId: staffId,
    email: email,
    displayName: displayName || '会員',
  };
}

function sendPasswordResetCodeEmail_(target, code) {
  var ss = getOrCreateDatabase_();
  var from = String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim();
  // v376.43: 件名/本文を設定値（無ければ既定）から差し込み描画。確認コード欠落を安全ガード。
  var mail = renderConfiguredMail_(ss, 'PASSWORD_RESET_SUBJECT', 'PASSWORD_RESET_BODY',
    PASSWORD_RESET_DEFAULT_SUBJECT, PASSWORD_RESET_DEFAULT_BODY, {
      'ユーザー名': target.displayName,
      '確認コード': code,
      '有効期限': PASSWORD_RESET_CODE_TTL_MINUTES + '分',
      '会員マイページURL': MEMBER_PORTAL_URL,
    }, code);
  deliverMail_('PASSWORD_RESET', target.email, mail.subject, mail.body, {
    from: from,
    replyTo: from || '',
    name: '枚方市介護支援専門員連絡協議会',
  });
}

function requestPasswordReset_(request) {
  if (!request || !String(request.loginId || '').trim() || !String(request.email || '').trim()) {
    throw new Error('ログインIDと登録メールアドレスを入力してください。');
  }

  var loginId = String(request.loginId || '').trim();
  var inputEmail = normalizeEmailForCompare_(request.email);
  var cache = CacheService.getScriptCache();
  var rateKey = passwordResetRateLimitKey_(loginId, inputEmail);
  var rateCount = Number(cache.get(rateKey) || 0);
  if (rateCount >= 5) {
    return { message: PASSWORD_RESET_GENERIC_MESSAGE, expiresInMinutes: PASSWORD_RESET_CODE_TTL_MINUTES };
  }
  cache.put(rateKey, String(rateCount + 1), PASSWORD_RESET_CODE_TTL_SECONDS);

  var ss = getOrCreateDatabase_();
  var target = resolvePasswordResetTarget_(ss, loginId);
  if (!target || normalizeEmailForCompare_(target.email) !== inputEmail) {
    appendLoginHistory_(ss, '', loginId, 'PASSWORD', 'FAILURE', 'パスワード再設定照合不一致');
    return { message: PASSWORD_RESET_GENERIC_MESSAGE, expiresInMinutes: PASSWORD_RESET_CODE_TTL_MINUTES };
  }

  var code = generatePasswordResetCode_(loginId);
  var createdAt = new Date().toISOString();
  var secret = target.authId + '|' + target.email + '|' + createdAt;
  cache.put(passwordResetCacheKey_(loginId), JSON.stringify({
    loginId: loginId,
    authId: target.authId,
    email: target.email,
    codeHash: hmacSha256Hex_(code, secret),
    createdAt: createdAt,
    attempts: 0,
  }), PASSWORD_RESET_CODE_TTL_SECONDS);

  sendPasswordResetCodeEmail_(target, code);
  appendLoginHistory_(ss, target.authId, loginId, 'PASSWORD', 'SUCCESS', 'パスワード再設定コード送信');
  return { message: PASSWORD_RESET_GENERIC_MESSAGE, expiresInMinutes: PASSWORD_RESET_CODE_TTL_MINUTES };
}

function completePasswordReset_(request) {
  if (!request || !String(request.loginId || '').trim() || !String(request.code || '').trim() || !String(request.newPassword || '')) {
    throw new Error('確認コードと新しいパスワードを入力してください。');
  }
  var loginId = String(request.loginId || '').trim();
  var code = String(request.code || '').trim();
  var newPassword = String(request.newPassword || '');
  if (!/^\d{6}$/.test(code)) {
    throw new Error('確認コードは6桁で入力してください。');
  }
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    throw new Error('新しいパスワードは' + PASSWORD_MIN_LENGTH + '文字以上で入力してください。');
  }
  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    throw new Error('新しいパスワードは' + PASSWORD_MAX_LENGTH + '文字以内で入力してください。');
  }
  if (!validatePasswordCharset_(newPassword)) {
    throw new Error('使用できない文字が含まれています。半角英数字と一部記号 (! @ # $ % ^ * ( ) _ + - = [ ] { } ; : , . ? / | ~) のみ使用できます。');
  }

  var cache = CacheService.getScriptCache();
  var key = passwordResetCacheKey_(loginId);
  var raw = cache.get(key);
  if (!raw) {
    throw new Error('確認コードが無効または期限切れです。もう一度手続きしてください。');
  }
  var record = JSON.parse(raw);
  var attempts = Number(record.attempts || 0);
  if (attempts >= 5) {
    cache.remove(key);
    throw new Error('確認コードの入力回数が上限に達しました。もう一度手続きしてください。');
  }
  var secret = String(record.authId || '') + '|' + String(record.email || '') + '|' + String(record.createdAt || '');
  var expected = String(record.codeHash || '');
  var actual = hmacSha256Hex_(code, secret);
  if (!secureCompareString_(actual, expected)) {
    record.attempts = attempts + 1;
    cache.put(key, JSON.stringify(record), PASSWORD_RESET_CODE_TTL_SECONDS);
    throw new Error('確認コードが正しくありません。');
  }

  var ss = getOrCreateDatabase_();
  var target = resolvePasswordResetTarget_(ss, loginId);
  if (!target || String(target.authId || '') !== String(record.authId || '')) {
    cache.remove(key);
    throw new Error('認証情報を確認できませんでした。もう一度手続きしてください。');
  }

  var cols = target.authColumns;
  requireColumns_(cols, ['パスワードハッシュ', 'パスワードソルト', 'パスワード更新日時', 'ログイン失敗回数', 'ロック状態', '更新日時']);
  var nowIso = new Date().toISOString();
  var newSalt = generateSalt_();
  var newHash = hashPasswordCurrent_(newPassword, newSalt);
  target.authSheet.getRange(target.authRowInfo.rowNumber, cols['パスワードソルト'] + 1).setValue(newSalt);
  target.authSheet.getRange(target.authRowInfo.rowNumber, cols['パスワードハッシュ'] + 1).setValue(newHash);
  target.authSheet.getRange(target.authRowInfo.rowNumber, cols['パスワード更新日時'] + 1).setValue(nowIso);
  target.authSheet.getRange(target.authRowInfo.rowNumber, cols['ログイン失敗回数'] + 1).setValue(0);
  target.authSheet.getRange(target.authRowInfo.rowNumber, cols['ロック状態'] + 1).setValue(false);
  target.authSheet.getRange(target.authRowInfo.rowNumber, cols['更新日時'] + 1).setValue(nowIso);
  cache.remove(key);
  appendLoginHistory_(ss, target.authId, loginId, 'PASSWORD', 'SUCCESS', 'パスワード再設定成功');
  return {
    message: 'パスワードを再設定しました。新しいパスワードでログインしてください。',
    updatedAt: nowIso,
  };
}

// ── ログイン失敗の時限解除（docs/261 T-04・v376.71）──────────────────
//
// 連続した認証失敗だけを数え、成功した時点で 0 に戻す。待機時間は段階的に伸ばし、
// 上限を超えたら管理者の対応が要る恒久ロックにする。閾値をここ以外に書かない（AGENTS.md §3）。
//
// 背景: ログイン ID が介護支援専門員番号で推測できるため、以前の「5 回で無期限ロック」は
// 第三者が故意に他人のアカウントを止められる状態だった。
var LOGIN_LOCKOUT_POLICY = {
  steps: [
    { failures: 3, waitMinutes: 1 },
    { failures: 4, waitMinutes: 5 },
    { failures: 5, waitMinutes: 15 },
    { failures: 6, waitMinutes: 60 },
  ],
  permanentAtFailures: 20,
};

function loginLockoutWaitMinutes_(failedCount) {
  var count = Number(failedCount || 0);
  var minutes = 0;
  var steps = LOGIN_LOCKOUT_POLICY.steps;
  for (var i = 0; i < steps.length; i += 1) {
    if (count >= steps[i].failures) minutes = steps[i].waitMinutes;
  }
  return minutes;
}

function isLoginLockoutPermanent_(failedCount) {
  return Number(failedCount || 0) >= LOGIN_LOCKOUT_POLICY.permanentAtFailures;
}

// 現在のロック状態を判定する。待機を過ぎていれば expired=true を返し、呼び出し側が解除する。
// 恒久ロックは時間では解けない。解除予定が空の旧データ（無期限ロック）は解除対象として扱う。
function evaluateLoginLockState_(lockedFlag, failedCount, lockUntilIso, nowMs) {
  var permanent = isLoginLockoutPermanent_(failedCount);
  if (!lockedFlag) {
    return { locked: false, permanent: permanent, expired: false };
  }
  if (permanent) {
    return { locked: true, permanent: true, expired: false };
  }
  var until = String(lockUntilIso || '').trim();
  if (!until) {
    return { locked: true, permanent: false, expired: true };
  }
  var untilMs = Date.parse(until);
  if (isNaN(untilMs)) {
    return { locked: true, permanent: false, expired: true };
  }
  return { locked: true, permanent: false, expired: nowMs >= untilMs };
}

// 認証失敗を 1 回加算して必要ならロックする。シートへの書き込みまで行い、新しい状態を返す。
function applyLoginFailure_(sheet, rowNumber, columns, previousFailedCount, nowMs) {
  var failedCount = Number(previousFailedCount || 0) + 1;
  var waitMinutes = loginLockoutWaitMinutes_(failedCount);
  var permanent = isLoginLockoutPermanent_(failedCount);
  var locked = permanent || waitMinutes > 0;
  var lockUntilIso = '';
  if (locked && !permanent) {
    lockUntilIso = new Date(nowMs + waitMinutes * 60 * 1000).toISOString();
  }
  if (columns['ログイン失敗回数'] != null) {
    sheet.getRange(rowNumber, columns['ログイン失敗回数'] + 1).setValue(failedCount);
  }
  if (columns['ロック状態'] != null) {
    sheet.getRange(rowNumber, columns['ロック状態'] + 1).setValue(locked);
  }
  if (columns['ロック解除予定日時'] != null) {
    sheet.getRange(rowNumber, columns['ロック解除予定日時'] + 1).setValue(lockUntilIso);
  }
  if (columns['更新日時'] != null) {
    sheet.getRange(rowNumber, columns['更新日時'] + 1).setValue(new Date(nowMs).toISOString());
  }
  return { failedCount: failedCount, locked: locked, permanent: permanent, waitMinutes: waitMinutes, lockUntil: lockUntilIso };
}

// v376.79: 待機満了時に使う。**ロックだけ**を解除し、失敗回数は残す。
// 失敗回数まで戻すと段階的な待機と恒久ロックに到達しなくなるため、
// カウントのリセットは clearLoginLockout_（ログイン成功・管理者解除）に限る。
function releaseLoginLockKeepingFailures_(sheet, rowNumber, columns) {
  if (columns['ロック状態'] != null) {
    sheet.getRange(rowNumber, columns['ロック状態'] + 1).setValue(false);
  }
  if (columns['ロック解除予定日時'] != null) {
    sheet.getRange(rowNumber, columns['ロック解除予定日時'] + 1).setValue('');
  }
}

// 認証成功・管理者解除で使う。失敗回数とロックを完全に戻す。
function clearLoginLockout_(sheet, rowNumber, columns) {
  if (columns['ログイン失敗回数'] != null) {
    sheet.getRange(rowNumber, columns['ログイン失敗回数'] + 1).setValue(0);
  }
  if (columns['ロック状態'] != null) {
    sheet.getRange(rowNumber, columns['ロック状態'] + 1).setValue(false);
  }
  if (columns['ロック解除予定日時'] != null) {
    sheet.getRange(rowNumber, columns['ロック解除予定日時'] + 1).setValue('');
  }
}

function memberLogin_(request) {
  if (!request || !request.loginId || !request.password) {
    throw new Error('ログインIDとパスワードを入力してください。');
  }

  var loginId = String(request.loginId).trim();
  var password = String(request.password);
  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('認証アカウントテーブルが見つかりません。');

  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', loginId);
  if (!authRowInfo) {
    appendLoginHistory_(ss, '', loginId, 'PASSWORD', 'FAILURE', 'ログインID未登録');
    throw new Error('ログインIDまたはパスワードが正しくありません。');
  }

  var row = authRowInfo.row;
  var columns = authRowInfo.columns;
  requireColumns_(columns, [
    '認証ID',
    '認証方式',
    'パスワードハッシュ',
    'パスワードソルト',
    'システムロールコード',
    '会員ID',
    '職員ID',
    'アカウント有効フラグ',
    'ログイン失敗回数',
    'ロック状態',
    '最終ログイン日時',
    '更新日時',
  ]);

  var authId = String(row[columns['認証ID']] || '');
  var authMethod = String(row[columns['認証方式']] || '');
  var roleCode = String(row[columns['システムロールコード']] || '');
  var memberId = String(row[columns['会員ID']] || '');
  var staffId = String(row[columns['職員ID']] || '');
  var isActive = toBoolean_(row[columns['アカウント有効フラグ']]);
  var isLocked = toBoolean_(row[columns['ロック状態']]);
  var failedCount = Number(row[columns['ログイン失敗回数']] || 0);
  var storedSalt = String(row[columns['パスワードソルト']] || '');
  var storedHash = String(row[columns['パスワードハッシュ']] || '');

  if (authMethod !== 'PASSWORD') {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', '認証方式不一致');
    throw new Error('このログインIDはパスワード認証に対応していません。');
  }
  if (!isActive) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'アカウント無効');
    throw new Error('アカウントが無効です。');
  }
  var loginNowMs = Date.now();
  var lockState = evaluateLoginLockState_(
    isLocked, failedCount, columns['ロック解除予定日時'] != null ? row[columns['ロック解除予定日時']] : '', loginNowMs);
  if (lockState.locked && lockState.expired) {
    // v376.79: 待機時間を過ぎたら**ロックだけ**を解除し、失敗回数は保持する。
    //
    // v376.71〜.78 はここで失敗回数も 0 に戻していたため、カウントが 3 を超えられず
    // 段階的な待機（4回=5分 / 5回=15分 / 6回以降=60分）と恒久ロック（20回）に
    // 到達しなかった（実質「3 回失敗で 1 分待ち」の固定で、1 分あたり 3 回の総当たりを
    // 無期限に続けられる状態だった）。
    //
    // 失敗回数を 0 に戻すのは **ログイン成功時**（正当な利用者であることが確認できたとき）と
    // **管理者による解除時**のみとする。これが「連続失敗のカウント」の本来の意味。
    releaseLoginLockKeepingFailures_(authSheet, authRowInfo.rowNumber, columns);
    lockState = { locked: false, permanent: false, expired: false };
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE',
      'ロック自動解除（失敗 ' + failedCount + ' 回は保持）');
  }
  if (lockState.locked) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE',
      lockState.permanent ? 'アカウントロック（恒久・管理者対応が必要）' : 'アカウントロック（待機中）');
    // ロック状態を攻撃者に教えないため、パスワード不一致と同じ文言にする（docs/261 T-04 #6）。
    throw new Error('ログインIDまたはパスワードが正しくありません。');
  }
  if (!storedSalt || !storedHash) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'パスワード未初期化');
    throw new Error('パスワードが初期化されていません。');
  }

  var verifyResult = verifyPassword_(password, storedSalt, storedHash);
  if (!verifyResult.match) {
    var failureState = applyLoginFailure_(authSheet, authRowInfo.rowNumber, columns, failedCount, loginNowMs);
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE',
      failureState.locked
        ? ('パスワード不一致（' + failureState.failedCount + '回連続・'
            + (failureState.permanent ? '恒久ロック' : ('ロック ' + failureState.waitMinutes + '分')) + '）')
        : ('パスワード不一致（' + failureState.failedCount + '回連続）'));
    throw new Error('ログインIDまたはパスワードが正しくありません。');
  }

  var nowIso = new Date().toISOString();
  clearLoginLockout_(authSheet, authRowInfo.rowNumber, columns);
  authSheet.getRange(authRowInfo.rowNumber, columns['最終ログイン日時'] + 1).setValue(nowIso);
  authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(nowIso);

  // 旧 SHA-256 で一致した場合は PBKDF2 へ再ハッシュ（ログイン成功時のみ）
  if (verifyResult.needsRehash) {
    var newSalt = generateSalt_();
    var newHash = hashPasswordCurrent_(password, newSalt);
    authSheet.getRange(authRowInfo.rowNumber, columns['パスワードソルト'] + 1).setValue(newSalt);
    authSheet.getRange(authRowInfo.rowNumber, columns['パスワードハッシュ'] + 1).setValue(newHash);
  }

  appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'SUCCESS', '会員ログイン成功');

  var sessionToken = Utilities.getUuid();
  CacheService.getScriptCache().put('ms_' + sessionToken, JSON.stringify({
    loginId: loginId,
    memberId: memberId,
    staffId: staffId,
    createdAt: nowIso,
  }), 1800);

  return {
    authMethod: 'PASSWORD',
    loginId: loginId,
    memberId: memberId,
    staffId: staffId,
    roleCode: roleCode,
    canAccessAdminPage: false,
    sessionToken: sessionToken,
    authenticatedAt: nowIso,
  };
}


/**
 * 管理者権限コードを日本語ラベルに変換する。
 */
/**
 * google.script.run 経由で呼び出し元の Google セッションを検証し、管理者認証を行う。
 * Session.getActiveUser() は google.script.run 呼び出し元のメールを返す（Execute as: Me でも）。
 * 権限コードに応じた adminPermissionLevel を返す。
 */
// ロール視点プレビュー中は、この 1 回の処理（processApiRequest）の間だけ、
// なりすましたロールのセッションを返す。処理の中で checkAdminBySession_ を呼び直しても
// MASTER の権限に戻らないようにするため（呼び直している処理が 20 箇所ほどある）。
// processApiRequest が毎回先頭で null に戻す。
var _previewAdminSession = null;

function checkAdminBySession_(options) {
  // ログイン操作はプレビューの対象外。返すとクライアントが自分をそのロールだと思い込む。
  if (_previewAdminSession && !(options && options.recordLogin)) return _previewAdminSession;
  // options.recordLogin: 成功をログイン履歴へ残すのは「ログイン操作」（action checkAdminBySession）だけ。
  //   管理 API はすべて認可のためにこの関数を通るため、毎回記録すると API 1 回ごとに
  //   ログ用スプレッドシートを開いて appendRow する（実測で 1 回 2 秒の固定費に上乗せされていた）。
  //   失敗は不正アクセスの痕跡なので、どの経路でも従来どおり必ず記録する。
  var recordLogin = !!(options && options.recordLogin);
  // options.silentFailure（2026-11-15 docs/332 §13）: doGet の埋め込みでは失敗を記録しない。画面が API の経路で認証し直し、
  //   そこで 1 回だけ記録する（二重に残さない）。判定の条件・エラーは同じ。
  var silentFailure = !!(options && options.silentFailure);
  var email = Session.getActiveUser().getEmail();
  apiProfileMark_('auth.getActiveUser');
  if (!email) {
    throw new Error('Googleアカウントでログインされていません。組織のGoogleアカウントでブラウザにログインしてください。');
  }
  email = email.toLowerCase();

  var ss = getOrCreateDatabase_();
  var logFailure = function(failAuthId, failEmail, reason) {
    if (!silentFailure) appendLoginHistory_(ss, failAuthId, failEmail, 'GOOGLE', 'FAILURE', reason);
  };
  // 2026-11-12 docs/328: 判定は管理者認証の完成品（スクリプトプロパティ）で行う。以前は紐付く 1 行のために
  // T_認証アカウント（会員全員分・ハッシュ入り）を毎回読み、丸ごとのキャッシュは上限 100 KB を超えて一度も効いていなかった。
  var snapshot = getAdminAuthSnapshot_(ss);
  apiProfileMark_('auth.snapshot');
  var entry = Object.prototype.hasOwnProperty.call(snapshot.admins, email) ? snapshot.admins[email] : null;
  if (!entry) {
    logFailure('', email, 'ホワイトリスト未登録（セッション認証）');
    throw new Error('管理者権限がありません。');
  }

  // 権限コード（空欄は既存データ互換で ADMIN）
  var permCode = String(entry.permCode || '') || 'ADMIN';

  // GENERAL 権限は管理者ログイン不可
  if (entry.status === 'GENERAL') {
    logFailure('', email, '一般権限のため管理者ログイン不可');
    throw new Error('管理者権限が無効です。会員ログイン（ID/パスワード）をご利用ください。');
  }
  if (entry.status === 'NO_AUTH_LINK') {
    logFailure('', email, '紐付け認証ID未整備（セッション認証）');
    throw new Error('管理者の認証紐付けが未設定です。');
  }
  var authId = String(entry.authId || '');
  if (entry.status === 'NO_MEMBER') {
    logFailure(authId, email, '会員ID未紐付け（セッション認証）');
    throw new Error('管理者に会員IDが紐付いていません。');
  }
  // 知らない状態は通さない（fail-closed）
  if (entry.status !== 'OK') {
    logFailure(authId, email, '管理者認証の状態が不明（' + String(entry.status) + '）');
    throw new Error('管理者権限がありません。');
  }

  var roleCode = String(entry.roleCode || '');
  var memberId = String(entry.memberId || '');
  var staffId = String(entry.staffId || '');
  var memberName = String(entry.memberName || '');
  var permLabel = entry.permLabel ? String(entry.permLabel) : masterLabel_(ss, 'M_管理者権限', permCode);
  var derivedDisplayName = memberName ? memberName + '（' + permLabel + '）' : permLabel;
  apiProfileMark_('auth.permLabel');

  var nowIso = new Date().toISOString();
  if (recordLogin) {
    appendLoginHistory_(ss, authId, email, 'GOOGLE', 'SUCCESS', '管理者セッション認証成功（' + permCode + '）');
  }

  // docs/246 Phase 1-A: menu-based 認可向けの追加フィールド。
  // 既存 adminPermissionLevel は後方互換のため維持。
  // Phase 1-B: ロールID 列があれば T_権限ロール を優先参照、無ければ legacy 権限コード fallback。
  var roleIdFromWl = String(entry.roleId || '').trim();
  apiProfileMark_('auth.recordLogin');
  var resolvedRole = roleIdFromWl ? (entry.role || null) : null; // docs/332 §10.4: 完成品のロール（ロール表を読まない）
  apiProfileMark_('auth.role');
  var isMaster;
  var allowedMenus;
  var trainingEditScope;
  var effectiveRoleId;
  var effectiveRoleName;
  if (resolvedRole) {
    // Phase 1-B 移行後: T_権限ロール の値が authoritative
    isMaster = !!resolvedRole.isMaster;
    allowedMenus = isMaster
      ? (MENU_REGISTRY || []).map(function(m) { return m.id; })
      : (resolvedRole.allowedMenus || []).slice();
    trainingEditScope = String(resolvedRole.trainingEditScope || 'ALL').toUpperCase();
    effectiveRoleId = resolvedRole.roleId;
    effectiveRoleName = resolvedRole.roleName;
  } else {
    // Phase 1-A 互換 fallback: legacy 権限コード ベース
    isMaster = permCode === 'MASTER';
    allowedMenus = isMaster
      ? (MENU_REGISTRY || []).map(function(m) { return m.id; })
      : (LEGACY_ROLE_TO_MENUS[permCode] || []).slice();
    trainingEditScope = String(LEGACY_ROLE_TRAINING_SCOPE[permCode] || 'ALL').toUpperCase();
    effectiveRoleId = permCode;
    effectiveRoleName = permCode;
  }

  return {
    authMethod: 'GOOGLE',
    loginId: email,
    memberId: memberId,
    staffId: staffId,
    roleCode: roleCode,
    canAccessAdminPage: true,
    adminPermissionLevel: permCode,
    // docs/246 Phase 1-A/1-B 追加フィールド
    roleId: effectiveRoleId,
    roleName: effectiveRoleName,
    isMaster: isMaster,
    allowedMenus: allowedMenus,
    trainingEditScope: trainingEditScope,
    // displayName は記録・通知用（「名前（権限）」）。personName は画面に出す本人の名前だけ。
    displayName: derivedDisplayName,
    personName: memberName,
    authenticatedAt: nowIso,
  };
}

// ─── 保守ツールの実行者確認（2026-10-10・docs/302 §2） ─────────────────────
// 管理 split のトップレベル関数は google.script.run から直接呼べる（Apps Script の仕様:
// 名前が `_` で終わらない関数はすべてクライアントへ公開される）。管理 web app は DOMAIN 公開なので、
// 管理者リストに無い組織アカウントでも、ページを開いて開発者ツールから保守ツールを実行できていた。
// 認可は processApiRequest の入口にしか無く、保守ツールはそこを通らない。
// 関数はデプロイした人の権限で動くため、Google 側では誰が呼んでも止まらない。
//
// そこで保守ツールは先頭で「呼び出した人が管理者リスト上の MASTER か」を確かめる。
// エディタの ▶ 実行・clasp run でも呼び出した人は MASTER 本人なので、運用は変わらない。
// 一覧の正本は scripts/gas-boundary-utils.mjs の ADMIN_TOP_LEVEL_FUNCTIONS。
// 入れ忘れは test:operator-tool-guard が落とす。
function assertMasterOperator_(toolName) {
  // 管理者リスト外はここで例外になり、ログイン履歴に失敗が残る。
  var session = checkAdminBySession_();
  if (!session || !session.isMaster) {
    try {
      appendLoginHistory_(null, '', String(session && session.loginId || ''), 'GOOGLE', 'FAILURE',
        '保守ツールの実行を拒否（MASTER 以外）: ' + toolName);
    } catch (e) {}
    throw new Error('この保守ツール（' + toolName + '）は MASTER のみ実行できます。');
  }
  return session;
}

// 時間主導トリガーのハンドラ用。トリガーから起動されたときは呼び出した人が居ないので、
// イベントの triggerUid がこのプロジェクトに実在するトリガーかで確かめる。
// クライアントは引数を偽れるため、triggerUid が付いているだけでは信用しない。
// トリガー以外（エディタ・google.script.run）からの起動は MASTER に限る。
function assertTriggerOrMasterOperator_(e, toolName) {
  var triggerUid = e && e.triggerUid ? String(e.triggerUid) : '';
  if (!triggerUid) return assertMasterOperator_(toolName);
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i += 1) {
    if (String(triggers[i].getUniqueId()) === triggerUid) return null;
  }
  throw new Error('このプロジェクトに無いトリガーからの実行は拒否しました（' + toolName + '）。');
}

// ─── ロール視点プレビュー（docs/246 改訂 2026-10-10・docs/302 §2） ─────────────────
// MASTER が他のロールの画面を、そのロールの権限で実際に操作して確かめるための仕組み。
// 以前はクライアントで書き込みを止める「閲覧のみ」だったが、それではそのロールで本当に
// 操作できるかを確かめられず、しかも callApi を直接使う画面（変更申請の承認・却下）は止まっていなかった。
//
// - 受け付けるのは実際の操作者が MASTER のときだけ（権限を下げる方向にしか働かない）
// - サーバーの判定もそのロールの許可メニュー・研修編集範囲・旧来の権限コードで行う
// - loginId は実際の操作者のまま。記録上の操作者を偽らない
// - 書き込み系の操作は T_監査ログ に「誰が・どのロールとして・何を」を残す
// 旧来の権限コードは、初期ロールとの対応表（scripts/menu-registry.mjs の
// LEGACY_CODE_TO_INITIAL_ROLE_ID・build 注入）を逆に引く。カスタムロールは管理者リストで
// 権限コードが空のときと同じ既定値（ADMIN）として扱う。
function previewLegacyLevelForRole_(role) {
  if (role.isMaster) return 'MASTER';
  var map = LEGACY_CODE_TO_INITIAL_ROLE_ID || {};
  for (var code in map) {
    if (Object.prototype.hasOwnProperty.call(map, code) && map[code] === role.roleId) return code;
  }
  return 'ADMIN';
}
var PREVIEW_READ_ACTION_PREFIXES = ['get', 'list', 'search', 'fetch', 'check', 'load', 'preview'];

function buildPreviewAdminSession_(previewRoleId) {
  var real = checkAdminBySession_();
  if (!real || !real.isMaster) {
    throw new Error('ロール視点プレビューは MASTER のみ利用できます。');
  }
  var role = getRoleByIdCached_(getOrCreateDatabase_(), String(previewRoleId || ''));
  if (!role) {
    throw new Error('プレビュー対象のロールが見つかりません。');
  }
  var isMaster = !!role.isMaster;
  var level = previewLegacyLevelForRole_(role);
  return {
    authMethod: real.authMethod,
    loginId: real.loginId,
    memberId: real.memberId,
    staffId: real.staffId,
    roleCode: real.roleCode,
    canAccessAdminPage: level !== 'GENERAL',
    adminPermissionLevel: level,
    roleId: role.roleId,
    roleName: role.roleName,
    isMaster: isMaster,
    allowedMenus: isMaster
      ? (MENU_REGISTRY || []).map(function(m) { return m.id; })
      : (role.allowedMenus || []).slice(),
    trainingEditScope: String(role.trainingEditScope || 'ALL').toUpperCase(),
    displayName: String(real.displayName || '') + '（' + role.roleName + 'としてプレビュー）',
    personName: real.personName,
    authenticatedAt: real.authenticatedAt,
    previewRoleId: role.roleId,
    previewActorLoginId: real.loginId,
  };
}

function isPreviewReadAction_(actionName) {
  var name = String(actionName || '');
  for (var i = 0; i < PREVIEW_READ_ACTION_PREFIXES.length; i += 1) {
    if (name.indexOf(PREVIEW_READ_ACTION_PREFIXES[i]) === 0) return true;
  }
  return false;
}

function appendPreviewAuditLog_(previewSession, actionName) {
  try {
    appendAuditLogEntries_([{ operatorEmail: previewSession.previewActorLoginId, operation: 'ROLE_PREVIEW_ACTION',
      recordId: actionName, fieldName: previewSession.previewRoleId, newValue: previewSession.roleName }]);
  } catch (e) { /* 記録の失敗で操作を止めない */ }
}

// 正本（シート）から完成品を作る。判定の規則・順は以前の checkAdminBySession_ と同じ（docs/328 §3）。
function buildAdminAuthSnapshot_(ss, dbModifiedAtMs) {
  var admins = Object.create(null);
  var whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
  });
  var authById = readAdminAuthLinkedRows_(ss, whitelistRows.map(function(r) { return String(r['紐付け認証ID'] || ''); }));
  var staffRows = null;
  var memberRows = null;
  for (var i = 0; i < whitelistRows.length; i += 1) {
    var w = whitelistRows[i];
    var email = String(w['Googleメール'] || '').toLowerCase();
    if (!email || Object.prototype.hasOwnProperty.call(admins, email)) continue;
    var permCode = String(w['権限コード'] || '') || 'ADMIN';
    var entry = { status: 'OK', whitelistId: String(w['ホワイトリストID'] || ''), permCode: permCode, roleId: String(w['ロールID'] || '').trim() };
    admins[email] = entry;
    if (permCode === 'GENERAL') { entry.status = 'GENERAL'; continue; }
    var linkedAuthId = String(w['紐付け認証ID'] || '');
    var auth = linkedAuthId ? authById[linkedAuthId] : null;
    if (!auth) { entry.status = 'NO_AUTH_LINK'; continue; }
    entry.authId = linkedAuthId;
    entry.roleCode = auth.roleCode;
    entry.staffId = auth.staffId;
    // 認証行の会員IDを正とし、ホワイトリストの紐付け会員IDは後方互換の補助（TRD §1.4）
    entry.memberId = auth.memberId || String(w['紐付け会員ID'] || '');
    if (!entry.memberId) { entry.status = 'NO_MEMBER'; continue; }
    // 表示名: 職員の行 → 会員の行（事業所会員の会員の行は姓・名が空・v131）
    var memberName = '';
    if (entry.staffId) {
      if (!staffRows) staffRows = getRowsAsObjects_(ss, 'T_事業所職員');
      for (var s = 0; s < staffRows.length; s += 1) {
        var st = staffRows[s];
        if (String(st['職員ID'] || '') !== entry.staffId || toBoolean_(st['削除フラグ'])) continue;
        memberName = joinHumanNameParts_(st['姓'], st['名']) || String(st['氏名'] || '').trim();
        break;
      }
    }
    if (!memberName) {
      if (!memberRows) memberRows = getRowsAsObjects_(ss, 'T_会員');
      for (var m = 0; m < memberRows.length; m += 1) {
        var mr = memberRows[m];
        if (toBoolean_(mr['削除フラグ']) || String(mr['会員ID'] || '') !== entry.memberId) continue;
        memberName = joinHumanNameParts_(mr['姓'], mr['名']);
        break;
      }
    }
    entry.memberName = memberName;
    // docs/332 §10.4: 権限名とロールも入れ、要求のたびにマスタもロール表も読まない
    entry.permLabel = masterLabel_(ss, 'M_管理者権限', permCode);
    entry.role = entry.roleId ? snapshotRole_(getRoleByIdCached_(ss, entry.roleId)) : null;
  }
  return { v: 2, builtAtMs: Date.now(), dbModifiedAtMs: dbModifiedAtMs, admins: admins };
}

function snapshotRole_(role) {
  if (!role) return null;
  return {
    roleId: role.roleId,
    roleName: role.roleName,
    isMaster: !!role.isMaster,
    allowedMenus: (role.allowedMenus || []).slice(),
    trainingEditScope: role.trainingEditScope,
  };
}

// 要求のたびに呼ぶ。ふだんはプロパティ 1 回とキャッシュ 1 回で返す（docs/328 §5）。
function getAdminAuthSnapshot_(ss) {
  var props = PropertiesService.getScriptProperties();
  var cache = CacheService.getScriptCache();
  var snap = null;
  try { snap = JSON.parse(props.getProperty(ADMIN_AUTH_SNAPSHOT_KEY_) || 'null'); } catch (e) { snap = null; }
  var ageMs = snap && typeof snap.builtAtMs === 'number' ? Date.now() - snap.builtAtMs : -1;
  var usable = !!(snap && snap.v === 2 && snap.admins && typeof snap.admins === 'object'
    && typeof snap.dbModifiedAtMs === 'number' && ageMs >= 0 && ageMs < ADMIN_AUTH_SNAPSHOT_MAX_AGE_MS_);
  var modifiedMs = null;
  var modifiedRead = false;
  if (usable) {
    var okMark = null;
    try { okMark = cache.get(ADMIN_AUTH_SNAPSHOT_OK_CACHE_KEY_); } catch (e) { okMark = null; }
    if (okMark === String(snap.builtAtMs)) return snap;
    modifiedMs = getDbLastModifiedMs_(ss);
    modifiedRead = true;
    apiProfileMark_('auth.snapshot.dbModified');
    if (modifiedMs !== null && modifiedMs <= snap.dbModifiedAtMs) {
      try { cache.put(ADMIN_AUTH_SNAPSHOT_OK_CACHE_KEY_, String(snap.builtAtMs), ADMIN_AUTH_SNAPSHOT_CHECK_TTL_SECONDS_); } catch (e) {}
      return snap;
    }
  }
  // 作り直す。最終更新日時はシートを読む前に取る（読んでいる間に書かれても、次の確認で新しいと分かる）
  if (!modifiedRead) modifiedMs = getDbLastModifiedMs_(ss);
  var rebuilt = buildAdminAuthSnapshot_(ss, modifiedMs === null ? -1 : modifiedMs);
  apiProfileMark_('auth.snapshot.rebuild');
  var json = JSON.stringify(rebuilt);
  if (json.length > ADMIN_AUTH_SNAPSHOT_MAX_CHARS_) {
    console.warn('管理者認証の完成品が ' + json.length + ' 文字で上限を超えるため保存しません（毎回シートから作ります）');
    return rebuilt;
  }
  try {
    props.setProperty(ADMIN_AUTH_SNAPSHOT_KEY_, json);
    if (modifiedMs !== null) cache.put(ADMIN_AUTH_SNAPSHOT_OK_CACHE_KEY_, String(rebuilt.builtAtMs), ADMIN_AUTH_SNAPSHOT_CHECK_TTL_SECONDS_);
  } catch (e) {
    console.warn('管理者認証の完成品を保存できませんでした: ' + (e && e.message ? e.message : e));
  }
  return rebuilt;
}

// 管理画面で権限・ロール・ホワイトリストを保存したら呼ぶ。管理者認証の完成品もその場で消す（RD §12「即時無効化」・docs/328 §5）。
function clearAdminPermissionCaches_() {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('admin_roles_v1'); // docs/246 Phase 1-B
    cache.remove(ADMIN_AUTH_SNAPSHOT_OK_CACHE_KEY_);
  } catch (e) {}
  try {
    PropertiesService.getScriptProperties().deleteProperty(ADMIN_AUTH_SNAPSHOT_KEY_);
  } catch (e) {
    console.warn('管理者認証の完成品を消せませんでした（最大 30 秒＋Drive の遅れ、上限 5 分で作り直されます）: ' + (e && e.message ? e.message : e));
  }
}

// ─── docs/246 Phase 1-B: T_権限ロール 関連ヘルパー ─────────────────────────

/**
 * T_権限ロール の全行をキャッシュ付きで取得し、roleId → role object に解決する。
 * 行が見つからない / 削除済 / 未マッチの場合は null。
 */
function getRoleByIdCached_(ss, roleId) {
  if (!roleId) return null;
  var cache = CacheService.getScriptCache();
  var rolesById = null;
  var cached = cache.get('admin_roles_v1');
  if (cached) {
    try { rolesById = JSON.parse(cached); } catch (e) { rolesById = null; }
  }
  if (!rolesById) {
    rolesById = {};
    var sheet = ss.getSheetByName('T_権限ロール');
    if (sheet) {
      var rows = getRowsAsObjects_(ss, 'T_権限ロール');
      for (var i = 0; i < rows.length; i += 1) {
        var r = rows[i];
        if (toBoolean_(r['削除フラグ'])) continue;
        var rid = String(r['ロールID'] || '');
        if (!rid) continue;
        var allowedMenus = [];
        try {
          var raw = String(r['許可メニューJSON'] || '[]');
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) allowedMenus = parsed.map(function(x) { return String(x); });
        } catch (e) { allowedMenus = []; }
        rolesById[rid] = {
          roleId: rid,
          roleName: String(r['ロール名'] || ''),
          description: String(r['説明'] || ''),
          allowedMenus: allowedMenus,
          trainingEditScope: String(r['研修編集スコープ'] || 'ALL').toUpperCase(),
          isBuiltIn: toBoolean_(r['組込フラグ']),
          isMaster: toBoolean_(r['マスターフラグ']),
          sortOrder: Number(r['表示順'] || 0),
        };
      }
    }
    try { cache.put('admin_roles_v1', JSON.stringify(rolesById), 300); } catch (e) {}
  }
  return rolesById[roleId] || null;
}

/**
 * T_権限ロール が空ならば INITIAL_ROLE_DEFINITIONS を seed する（冪等）。
 * 既存行があれば一切上書きしない（操作者編集が消えないように）。
 */
function seedInitialPermissionRoles_(ss) {
  var sheet = ss.getSheetByName('T_権限ロール');
  if (!sheet) {
    // 防御的にシート作成 + ヘッダ書込（v376.28.1 hotfix: normalizeTableColumns_ がシート作成しない問題への対応）
    sheet = ss.insertSheet('T_権限ロール');
    writeSheetHeaders_(sheet, テーブル定義['T_権限ロール']);
  }
  if (sheet.getLastRow() >= 2) return { seeded: false, reason: '既存ロールあり（seed スキップ）', existing: sheet.getLastRow() - 1 };
  var defs = INITIAL_ROLE_DEFINITIONS || [];
  if (defs.length === 0) return { seeded: false, reason: 'INITIAL_ROLE_DEFINITIONS が空' };
  var nowIso = new Date().toISOString();
  var rows = defs.map(function(d) {
    return {
      'ロールID': d.roleId,
      'ロール名': d.roleName,
      '説明': d.description || '',
      '許可メニューJSON': JSON.stringify(d.allowedMenus || []),
      '研修編集スコープ': String(d.trainingEditScope || 'ALL').toUpperCase(),
      '組込フラグ': !!d.isBuiltIn,
      'マスターフラグ': !!d.isMaster,
      '表示順': Number(d.sortOrder || 0),
      '作成日時': nowIso,
      '更新日時': nowIso,
      '削除フラグ': false,
    };
  });
  appendRowsByHeaders_(ss, 'T_権限ロール', rows);
  try { CacheService.getScriptCache().remove('admin_roles_v1'); } catch (e) {}
  return { seeded: true, count: rows.length };
}

function hashPassword_(password, salt) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + '::' + password,
    Utilities.Charset.UTF_8
  );
  var out = [];
  for (var i = 0; i < bytes.length; i += 1) {
    var b = bytes[i];
    if (b < 0) b += 256;
    out.push((b < 16 ? '0' : '') + b.toString(16));
  }
  return out.join('');
}

// ---------------------------------------------------------------------------
// Password hashing (PBKDF2 + verifier-side pepper)
// ---------------------------------------------------------------------------

// v332: パスワード長制約（8〜20 文字 — user-supplied）
// generateCredentialTempPassword_ で生成する初期パスワードは PASSWORD_GENERATED_LENGTH（15）固定。
var PASSWORD_MIN_LENGTH = 8;
var PASSWORD_MAX_LENGTH = 20;
var PASSWORD_GENERATED_LENGTH = 15;
// v331: 許可文字 — ASCII 英数 + 安全記号のみ。エスケープ可能な記号
// (\ ` ' " < > &)、空白、制御文字は禁止（インジェクション・XSS・コマンド注入対策）。
var PASSWORD_ALLOWED_REGEX = /^[A-Za-z0-9!@#$%^*()_+=\-\[\]{};:,.?\/|~]+$/;
function validatePasswordCharset_(password) {
  if (typeof password !== 'string' || password.length === 0) return false;
  return PASSWORD_ALLOWED_REGEX.test(password);
}
var PASSWORD_HASH_PEPPER_PROPERTY = 'PASSWORD_HASH_PEPPER_V1';
var PASSWORD_HASH_PEPPER_ID = 'v1';
// v373.5: Google Cloud Secret Manager 連携用 — Script Properties から GCP project ID と secret 名を取得
// `PASSWORD_HASH_PEPPER_GCP_PROJECT` が未設定なら hcmn-member-system-prod を既定値とする
var PASSWORD_HASH_PEPPER_GCP_PROJECT_PROPERTY = 'PASSWORD_HASH_PEPPER_GCP_PROJECT';
var PASSWORD_HASH_PEPPER_GCP_PROJECT_DEFAULT = 'hcmn-member-system-prod';
// v376.54 (GCP Phase B): secret 名は GCP 実体 `PASSWORD_HASH_PEPPER_V1` に一致させる（docs/250 §5 Phase B 手順7）。
// Script Property `PASSWORD_HASH_PEPPER_SECRET_NAME` で上書き可能（getPasswordPepperSecretName_ 参照）。
var PASSWORD_HASH_PEPPER_SECRET_NAME_PROPERTY = 'PASSWORD_HASH_PEPPER_SECRET_NAME';
var PASSWORD_HASH_PEPPER_SECRET_NAME_DEFAULT = 'PASSWORD_HASH_PEPPER_V1';
// v376.54 (GCP Phase B): Cloud Run password-hash service の URL（値は Script Properties のみ・コード埋め込み禁止）
var CLOUD_RUN_HASH_SERVICE_URL_PROPERTY = 'CLOUD_RUN_HASH_SERVICE_URL';
// v376.54 (GCP Phase B): Argon2id 段階移行 feature flag（'true' で新規 hash が Argon2id・rehash-on-login 開始）
var ARGON2_ENABLED_PROPERTY = 'ARGON2_ENABLED';
// Argon2id hash の保存形式 prefix（保存 hash の方式自動判別に使用。
// 注意: この直前コメントに関数名を書くと build pruner が「削除関数への参照」と誤認して定数ごと消すため書かない）
var ARGON2_HASH_PREFIX = 'argon2id:v1:';
var PASSWORD_HASH_PEPPER_CACHE_KEY = 'pepper:v1';
var PASSWORD_HASH_PEPPER_CACHE_TTL_SECONDS = 300; // 5 min

/**
 * PBKDF2-HMAC-SHA256 を GAS の Utilities.computeHmacSha256Signature で実装する。
 * RFC 2898 準拠。iterations 回 PRF を繰り返し、dkLen=32 バイト（hex 64文字）を返す。
 */
function pbkdf2HmacSha256_(password, salt, iterations, dkLen) {
  var passwordBytes = Utilities.newBlob(password).getBytes();
  var saltBytes = Utilities.newBlob(salt).getBytes();

  // PRF = HMAC-SHA256(password, data) — GAS では key と message が逆順
  function prf(data) {
    return Utilities.computeHmacSha256Signature(data, passwordBytes);
  }

  var result = [];
  var blocks = Math.ceil(dkLen / 32);
  for (var block = 1; block <= blocks; block++) {
    // U1 = PRF(salt + INT(block))
    var blockNum = [
      (block >>> 24) & 0xff,
      (block >>> 16) & 0xff,
      (block >>> 8) & 0xff,
      block & 0xff
    ];
    var u = prf(saltBytes.concat(blockNum));
    var t = u.slice();
    for (var i = 1; i < iterations; i++) {
      u = prf(u);
      for (var j = 0; j < t.length; j++) {
        t[j] ^= u[j];
      }
    }
    result = result.concat(t);
  }

  var out = [];
  for (var k = 0; k < dkLen; k++) {
    var b = result[k];
    if (b < 0) b += 256;
    out.push((b < 16 ? '0' : '') + b.toString(16));
  }
  return out.join('');
}

/**
 * PBKDF2 反復数ベンチマーク。
 * 本番実装前に GAS 上での実行時間を計測するために使用する。
 * Logger.log で結果を出力する。
 */
function benchmarkHashPassword_() {
  var password = 'benchmark_password_test';
  var salt = 'benchmark_salt_value';
  var results = [];

  var testCounts = [1000, 5000, 10000, 50000, 100000];
  for (var t = 0; t < testCounts.length; t++) {
    var iters = testCounts[t];
    var start = new Date().getTime();
    pbkdf2HmacSha256_(password, salt, iters, 32);
    var elapsed = new Date().getTime() - start;
    results.push({ iterations: iters, ms: elapsed });
    Logger.log('PBKDF2 iterations=%s  time=%sms', iters, elapsed);
  }
  return results;
}

/**
 * PBKDF2 反復数。GAS の 30 秒制限内に収まる最大値をベンチマーク結果から設定。
 * ベンチマーク結果: 10000itr ≒ 2-4s (GAS), 本番は 10000 を採用。
 * NIST SP 800-132 推奨 (100,000+) に対し GAS 制約内の最大値。
 */
var PBKDF2_ITERATIONS = 10000;

function bytesToHex_(bytes) {
  var out = [];
  for (var i = 0; i < bytes.length; i += 1) {
    var b = bytes[i];
    if (b < 0) b += 256;
    out.push((b < 16 ? '0' : '') + b.toString(16));
  }
  return out.join('');
}

function secureCompareString_(a, b) {
  a = String(a || '');
  b = String(b || '');
  var maxLen = Math.max(a.length, b.length);
  var diff = a.length ^ b.length;
  for (var i = 0; i < maxLen; i += 1) {
    var ca = i < a.length ? a.charCodeAt(i) : 0;
    var cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

/**
 * v373.5: パスワード pepper を Secret Manager 優先で取得する。
 *
 * 階層:
 *   1. CacheService に直近 5 分以内の値があればそれを返す（API 呼び出し最小化）
 *   2. Secret Manager から取得を試行（cloud-platform scope + IAM 必須）
 *   3. Script Properties (PASSWORD_HASH_PEPPER_V1) にフォールバック（移行期間用）
 *
 * Secret Manager は fail-soft: 障害時は Logger に警告（値は出さない）+ Properties に倒れる。
 * これにより GCP 障害でログイン全停止を避ける。本番完全移行後は Properties fallback を撤去する。
 *
 * 値の出力ルール: 関数内・呼び出し元・ログ・例外メッセージのいずれでも pepper 値を表示しない。
 * 不一致検証など値そのものを比較する場面でも、長さや先頭数文字のみログ出力にとどめる（実装上は出力しない）。
 */
function getPasswordPepper_() {
  // 1. CacheService から
  var cache = null;
  try { cache = CacheService.getScriptCache(); } catch (cacheErr) { cache = null; }
  if (cache) {
    try {
      var cached = cache.get(PASSWORD_HASH_PEPPER_CACHE_KEY);
      if (cached && typeof cached === 'string' && cached.length > 0) {
        return cached;
      }
    } catch (cacheReadErr) { /* fall through */ }
  }

  // 2. Secret Manager (fail-soft)
  // E2（TRD §1.8）: 本番でないプロジェクトは Secret Manager を読まない（既定の GCP は本番で、同じアカウントなら
  // 本番の pepper が読めてしまう）。スクリプトプロパティのステージング専用の値だけを使う。
  var fromSecretManager = '';
  if (isProductionScript_()) try {
    fromSecretManager = fetchPepperFromSecretManager_();
  } catch (smErr) {
    var smMsg = smErr && smErr.message ? smErr.message : String(smErr);
    // 値は絶対に出さない。失敗事象だけログ
    try { Logger.log('[getPasswordPepper_] Secret Manager fetch failed (fail-soft to Properties): %s', smMsg); } catch (e) {}
  }

  // 3. Properties fallback
  var resolved = fromSecretManager;
  if (!resolved) {
    resolved = String(PropertiesService.getScriptProperties().getProperty(PASSWORD_HASH_PEPPER_PROPERTY) || '').trim();
  }

  if (resolved && cache) {
    try { cache.put(PASSWORD_HASH_PEPPER_CACHE_KEY, resolved, PASSWORD_HASH_PEPPER_CACHE_TTL_SECONDS); } catch (e) {}
  }
  return resolved;
}

/**
 * v373.5: GCP Secret Manager v1 API から pepper を取得する。
 *
 * 失敗時は throw する（呼び出し側で fail-soft 判定）。
 * 値は base64 で返るため Utilities.base64Decode → string 化する。
 */
/**
 * v376.54 (GCP Phase B): Secret Manager の secret 名を解決する。
 * Script Property `PASSWORD_HASH_PEPPER_SECRET_NAME` があればそれを優先し、
 * 未設定なら GCP 実体と同名の既定値 `PASSWORD_HASH_PEPPER_V1` を返す。
 */
function getPasswordPepperSecretName_() {
  var fromProps = '';
  try {
    fromProps = String(PropertiesService.getScriptProperties().getProperty(PASSWORD_HASH_PEPPER_SECRET_NAME_PROPERTY) || '').trim();
  } catch (e) { /* fall through to default */ }
  return fromProps || PASSWORD_HASH_PEPPER_SECRET_NAME_DEFAULT;
}

function fetchPepperFromSecretManager_() {
  var projectId = String(
    PropertiesService.getScriptProperties().getProperty(PASSWORD_HASH_PEPPER_GCP_PROJECT_PROPERTY)
    || PASSWORD_HASH_PEPPER_GCP_PROJECT_DEFAULT
  ).trim();
  if (!projectId) {
    throw new Error('GCP project id not set');
  }
  var url = 'https://secretmanager.googleapis.com/v1/projects/'
    + encodeURIComponent(projectId)
    + '/secrets/' + encodeURIComponent(getPasswordPepperSecretName_())
    + '/versions/latest:access';
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
    followRedirects: true,
  });
  var code = response.getResponseCode();
  if (code !== 200) {
    // body は error 情報を含むが、Secret 値そのものは含まないので長さだけ確認
    throw new Error('Secret Manager HTTP ' + code);
  }
  var body = response.getContentText();
  if (!body) throw new Error('Empty response');
  var parsed;
  try { parsed = JSON.parse(body); } catch (parseErr) { throw new Error('Invalid JSON response'); }
  if (!parsed || !parsed.payload || !parsed.payload.data) {
    throw new Error('payload.data missing');
  }
  // payload.data は base64 エンコード済み
  var decoded = Utilities.newBlob(Utilities.base64Decode(parsed.payload.data)).getDataAsString();
  if (!decoded) throw new Error('Decoded value empty');
  return decoded.trim();
}

/**
 * v373.5: pepper 取得ヘルスチェック（admin Apps Script editor からの手動実行用）。
 * 値は出力せず、source / length / SHA-256 fingerprint のみ Logger に返す。
 * operator が Secret Manager セットアップ後に Apps Script editor から実行して検証する。
 * admin split のみ top-level callable として残す（member/public からは pruning）。
 */
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

/**
 * v376.54 (GCP Phase B / docs/250 §10-6): GAS→Cloud Run 接続の事前診断。
 * operator が admin の Apps Script editor から手動 Run する（admin build のみ残存）。
 *
 * 確認内容（AGENTS.md §0 準拠 — token 値・pepper 値は絶対に出力しない）:
 *   1. identity token: 取得可否と payload の aud / iss / email 有無のみ
 *      （aud = 本 script の OAuth クライアント ID。Cloud Run custom audiences 登録に使う）
 *   2. Secret Manager: pepper 取得可否・使用 secret 名・長さのみ
 *   3. Cloud Run /health: Script Property CLOUD_RUN_HASH_SERVICE_URL 設定時のみ、
 *      identity token 認証での HTTP status を確認（未設定なら skip・失敗扱いにしない）
 */
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

function hmacSha256Hex_(message, secret) {
  return bytesToHex_(Utilities.computeHmacSha256Signature(String(message || ''), String(secret || '')));
}

// ============================================================
// v376.54 (GCP Phase B / docs/240 §4, docs/250 §5): Cloud Run Argon2id 連携
// ============================================================

function isArgon2Enabled_() {
  try {
    return String(PropertiesService.getScriptProperties().getProperty(ARGON2_ENABLED_PROPERTY) || '').toLowerCase() === 'true';
  } catch (e) {
    return false; // Properties 読取不能時は従来 PBKDF2 に倒す（生成側 fail-soft・検証側は方式自動判別で影響なし）
  }
}

function getCloudRunHashServiceUrl_() {
  return String(PropertiesService.getScriptProperties().getProperty(CLOUD_RUN_HASH_SERVICE_URL_PROPERTY) || '').trim();
}

/**
 * Cloud Run password-hash service の共通呼び出し。
 * - 認証: ScriptApp.getIdentityToken()（openid scope 必須・aud は Cloud Run custom audiences 登録済）
 * - 失敗時は throw（fail-closed）。token / password / pepper / response body は例外メッセージ・ログに出さない（AGENTS §0）。
 */
function callCloudRunHashService_(path, payloadObj) {
  var url = getCloudRunHashServiceUrl_();
  if (!url) {
    throw new Error('Cloud Run hash service URL 未設定（Script Property ' + CLOUD_RUN_HASH_SERVICE_URL_PROPERTY + '）');
  }
  var idToken = ScriptApp.getIdentityToken();
  if (!idToken) {
    throw new Error('identity token を取得できません（openid scope 未反映の可能性）');
  }
  var response = UrlFetchApp.fetch(url.replace(/\/+$/, '') + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + idToken },
    payload: JSON.stringify(payloadObj),
    muteHttpExceptions: true,
  });
  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('Argon2 hash service HTTP ' + code);
  }
  var parsed;
  try {
    parsed = JSON.parse(response.getContentText());
  } catch (parseErr) {
    throw new Error('Argon2 hash service invalid JSON response');
  }
  return parsed;
}

/**
 * Cloud Run Argon2id でパスワードをハッシュする。
 * salt 引数は PHC 文字列（$argon2id$...）内に salt が含まれるため未使用（PBKDF2 系との drop-in 互換用）。
 * 返り値: "argon2id:v1:$argon2id$v=19$m=19456,t=2,p=1$..."
 */
function hashPasswordArgon2_(password, salt) {
  var pepper = getPasswordPepper_();
  var body = callCloudRunHashService_('/v1/hash', { password: String(password || ''), pepper: pepper });
  if (!body || typeof body.phc !== 'string' || body.phc.indexOf('$argon2id$') !== 0) {
    throw new Error('Argon2 hash service unexpected response');
  }
  return ARGON2_HASH_PREFIX + body.phc;
}

/**
 * Cloud Run Argon2id でパスワードを検証する。
 * 返り値: { match: boolean, needsRehash: boolean }（verifyPassword_ と同一契約）
 */
function verifyPasswordArgon2_(password, storedHash) {
  if (String(storedHash || '').indexOf(ARGON2_HASH_PREFIX) !== 0) {
    throw new Error('not an argon2id hash');
  }
  var phc = String(storedHash).substring(ARGON2_HASH_PREFIX.length);
  var pepper = getPasswordPepper_();
  var body = callCloudRunHashService_('/v1/verify', { password: String(password || ''), phc: phc, pepper: pepper });
  return { match: body.match === true, needsRehash: body.needsRehash === true };
}

/**
 * v376.54 (GCP Phase B / docs/240 §4): パスワードハッシュ生成の単一スイッチ。
 * `ARGON2_ENABLED=true` なら Cloud Run Argon2id、それ以外は PBKDF2（既定・従来挙動不変）。
 * Argon2 有効時に Cloud Run へ到達できない場合は fail-closed（throw）— docs/240 §6。
 * 生成箇所は必ず本関数を経由し、hashPasswordPbkdf2_ / hashPasswordArgon2_ を直接呼ばない。
 */
function hashPasswordCurrent_(password, salt) {
  if (isArgon2Enabled_()) {
    return hashPasswordArgon2_(password, salt);
  }
  return hashPasswordPbkdf2_(password, salt);
}

/**
 * PBKDF2-HMAC-SHA256 でパスワードをハッシュする。
 * 旧 hashPassword_ と同じシグネチャで呼び出せるが、方式識別子を prefix として返す。
 * 返り値: "pbkdf2:sha256:<hex64>" (71 文字)
 */
function hashPasswordPbkdf2_(password, salt) {
  var dk = pbkdf2HmacSha256_(password, salt, PBKDF2_ITERATIONS, 32);
  var pepper = getPasswordPepper_();
  if (pepper) {
    var mac = hmacSha256Hex_(dk, pepper);
    return 'pbkdf2:sha256:' + PBKDF2_ITERATIONS + ':pepper:' + PASSWORD_HASH_PEPPER_ID + ':' + mac;
  }
  return 'pbkdf2:sha256:' + PBKDF2_ITERATIONS + ':' + dk;
}

/**
 * パスワード検証。ハッシュ方式を自動判別する。
 * - "argon2id:v1:" prefix → Cloud Run Argon2id で検証（v376.54・ARGON2_ENABLED に関わらず常時有効 = rollback 後も既存 Argon2 hash でログイン可）
 * - "pbkdf2:sha256:" prefix → PBKDF2 で検証
 * - それ以外 → 旧 SHA-256 で検証
 * 旧方式で一致した場合は rehash 用フラグを返す。ARGON2_ENABLED=true 中は PBKDF2 一致にも
 * needsRehash=true を返し、呼び出し側の rehash-on-login（hashPasswordCurrent_）で Argon2id へ移行する。
 */
function verifyPassword_(password, salt, storedHash) {
  if (storedHash && String(storedHash).indexOf(ARGON2_HASH_PREFIX) === 0) {
    return verifyPasswordArgon2_(password, storedHash);
  }
  if (storedHash && storedHash.indexOf('pbkdf2:sha256:') === 0) {
    var parts = String(storedHash).split(':');
    if (parts.length === 6 && parts[3] === 'pepper') {
      var pepper = getPasswordPepper_();
      if (!pepper) {
        throw new Error('パスワード検証用pepperが未設定です。管理者へ連絡してください。');
      }
      var pepperIterations = Number(parts[2] || 0);
      var dkPepper = pbkdf2HmacSha256_(password, salt, pepperIterations || PBKDF2_ITERATIONS, 32);
      var mac = hmacSha256Hex_(dkPepper, pepper);
      return {
        match: secureCompareString_(mac, parts[5]),
        needsRehash: pepperIterations !== PBKDF2_ITERATIONS || parts[4] !== PASSWORD_HASH_PEPPER_ID || isArgon2Enabled_(),
      };
    }
    if (parts.length === 4) {
      var iterations = Number(parts[2] || 0);
      var dkVersioned = pbkdf2HmacSha256_(password, salt, iterations || PBKDF2_ITERATIONS, 32);
      return {
        match: secureCompareString_('pbkdf2:sha256:' + (iterations || PBKDF2_ITERATIONS) + ':' + dkVersioned, storedHash),
        needsRehash: true,
      };
    }
    var dk = pbkdf2HmacSha256_(password, salt, PBKDF2_ITERATIONS, 32);
    return {
      match: secureCompareString_('pbkdf2:sha256:' + dk, storedHash),
      needsRehash: true,
    };
  }
  // 旧 SHA-256
  var legacyHash = hashPassword_(password, salt);
  if (legacyHash === storedHash) {
    return { match: true, needsRehash: true };
  }
  return { match: false, needsRehash: false };
}
