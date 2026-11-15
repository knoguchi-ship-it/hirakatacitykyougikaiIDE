// gas-src/90_ops_maintenance.gs — 保守ツール（_LOG / _APPLY）・修復・計測・Drive の整理・ステージング。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

/**
 * DriveApp 権限診断。
 *
 * 実行方法: Apps Script エディタでこの関数を選択して「実行」する。
 * 目的: DriveApp の read / createFolder / createFile / trash がどの段階で失敗するかを切り分ける。
 * 影響: 診断用の一時フォルダと一時ファイルを作成し、成功時は即座にゴミ箱へ移動する。
 */
function testDriveAccess() {
  var result = {
    ok: false,
    executedAt: new Date().toISOString(),
    scriptId: ScriptApp.getScriptId(),
    effectiveUser: '',
    activeUser: '',
    steps: []
  };

  function recordStep(name, fn) {
    var step = { name: name, ok: false };
    try {
      var value = fn();
      step.ok = true;
      if (value !== undefined) step.value = value;
    } catch (e) {
      step.error = e && e.message ? e.message : String(e);
      step.stack = e && e.stack ? e.stack : '';
    }
    result.steps.push(step);
    if (!step.ok) {
      throw new Error(name + ' failed: ' + step.error);
    }
    return step.value;
  }

  try {
    result.effectiveUser = Session.getEffectiveUser().getEmail();
  } catch (e1) {
    result.effectiveUserError = e1 && e1.message ? e1.message : String(e1);
  }
  try {
    result.activeUser = Session.getActiveUser().getEmail();
  } catch (e2) {
    result.activeUserError = e2 && e2.message ? e2.message : String(e2);
  }

  var folder;
  var file;
  try {
    var rootName = recordStep('getRootFolder', function () {
      return DriveApp.getRootFolder().getName();
    });
    result.rootFolderName = rootName;

    folder = recordStep('createFolder', function () {
      return DriveApp.getRootFolder().createFolder('_hcmn_drive_diagnostic_' + Date.now());
    });
    result.folderId = folder.getId();
    result.folderUrl = folder.getUrl();

    file = recordStep('createFile', function () {
      return folder.createFile(
        'drive-diagnostic.txt',
        'DriveApp diagnostic created at ' + result.executedAt,
        MimeType.PLAIN_TEXT
      );
    });
    result.fileId = file.getId();
    result.fileUrl = file.getUrl();

    recordStep('trashFile', function () {
      file.setTrashed(true);
      return true;
    });
    recordStep('trashFolder', function () {
      folder.setTrashed(true);
      return true;
    });

    result.ok = true;
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  } catch (e3) {
    result.error = e3 && e3.message ? e3.message : String(e3);
    result.stack = e3 && e3.stack ? e3.stack : '';
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  }
}

/**
 * スプレッドシートDBを作成し、マスタ/テーブルを初期化する。
 * 不要シート（定義外シート）もあわせて削除する。
 * clasp run setupDatabase から実行想定。
 */
function setupDatabase() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  markSchemaInitialized_();
  return getDbInfo_();
}

/**
 * T_会員 に 勤務先住所2 / 自宅住所2 列を追加するマイグレーション。
 * 既にカラムが存在する場合はスキップする（冪等）。
 * 実行後は rebuildDatabaseSchema() のヘッダー保護を再適用することを推奨。
 */
function addAddressLine2Columns() {
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) return { error: 'T_会員 シートが見つかりません。' };

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var results = [];

  // 勤務先住所2 を 勤務先住所 の直後に挿入
  var officeAddrIdx = headers.indexOf('勤務先住所'); // 0-based
  if (officeAddrIdx < 0) {
    return { error: '勤務先住所 列が見つかりません。rebuildDatabaseSchema() を先に実行してください。' };
  }
  if (headers.indexOf('勤務先住所2') >= 0) {
    results.push('勤務先住所2: 既に存在します。スキップ。');
  } else {
    sheet.insertColumnAfter(officeAddrIdx + 1); // insertColumnAfter は 1-based
    sheet.getRange(1, officeAddrIdx + 2).setValue('勤務先住所2');
    headers.splice(officeAddrIdx + 1, 0, '勤務先住所2'); // ローカルの headers を更新
    results.push('勤務先住所2: 列 ' + (officeAddrIdx + 2) + ' に追加しました。');
  }

  // 自宅住所2 を 自宅住所 の直後に挿入（headers は更新済みのものを使う）
  var homeAddrIdx = headers.indexOf('自宅住所'); // 0-based
  if (homeAddrIdx < 0) {
    return { error: '自宅住所 列が見つかりません。rebuildDatabaseSchema() を先に実行してください。', results: results };
  }
  if (headers.indexOf('自宅住所2') >= 0) {
    results.push('自宅住所2: 既に存在します。スキップ。');
  } else {
    sheet.insertColumnAfter(homeAddrIdx + 1);
    sheet.getRange(1, homeAddrIdx + 2).setValue('自宅住所2');
    results.push('自宅住所2: 列 ' + (homeAddrIdx + 2) + ' に追加しました。');
  }

  clearAllDataCache_();
  return { ok: true, results: results };
}

/**
 * DBスキーマを再構築する。
 * 既存の定義外シートは削除し、定義シートのヘッダー/入力規則/保護を再適用する。
 */
function rebuildDatabaseSchema() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  markSchemaInitialized_();
  // 2026-09-27: 旧世代のサムネイルトリガー設定をここから外した。
  // 現行は processPendingThumbnails（setupPendingThumbnailsTrigger で登録）。
  return {
    スプレッドシートID: ss.getId(),
    削除シート一覧: cleanupNonSchemaSheets_(ss),
    シート一覧: ss.getSheets().map(function(sheet) {
      return sheet.getName();
    }),
  };
}

function ensureBusinessStaffNameColumnsPatched_(ss) {
  var sheet = ss.getSheetByName('T_事業所職員');
  if (!sheet) throw new Error('T_事業所職員 が見つかりません。');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('姓') >= 0 && headers.indexOf('名') >= 0 && headers.indexOf('セイ') >= 0 && headers.indexOf('メイ') >= 0) {
    sheet.getRange(2, 3, Math.max(sheet.getMaxRows() - 1, 1), 6).clearDataValidations();
    return { inserted: false, headerCount: headers.length };
  }

  var memberIdIndex = headers.indexOf('会員ID');
  var nameIndex = headers.indexOf('氏名');
  if (memberIdIndex !== 1 || nameIndex !== 2) {
    throw new Error('T_事業所職員 の列順が想定外です。手動確認が必要です。');
  }

  sheet.insertColumnsAfter(memberIdIndex + 1, 4);
  sheet.getRange(1, memberIdIndex + 2, 1, 4).setValues([['姓', '名', 'セイ', 'メイ']]);
  sheet.getRange(2, 3, Math.max(sheet.getMaxRows() - 1, 1), 6).clearDataValidations();
  return { inserted: true, headerCount: sheet.getLastColumn() };
}

function applyStaffNameSchemaPatch() {
  var ss = getOrCreateDatabase_();
  var patchResult = ensureBusinessStaffNameColumnsPatched_(ss);
  var backfill = backfillBusinessStaffNameColumns_(ss);
  markSchemaInitialized_();
  return {
    applied: true,
    table: 'T_事業所職員',
    patch: patchResult,
    backfill: backfill,
  };
}

function applyStaffNameSchemaPatchJson() {
  return JSON.stringify(applyStaffNameSchemaPatch());
}

/**
 * 既存ホワイトリストの権限コードをマイグレーションする。
 * k.noguchi@uguisunosato.or.jp → MASTER、他 → ADMIN。
 * 使い方: npx clasp run migrateAdminPermissions
 */
function migrateAdminPermissions() {
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet || sheet.getLastRow() < 2) return { message: '対象なし' };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var permColIdx = headers.indexOf('権限コード');
  var emailColIdx = headers.indexOf('Googleメール');
  var changerColIdx = headers.indexOf('変更者メール');
  var changeTimeColIdx = headers.indexOf('変更日時');
  if (permColIdx < 0 || emailColIdx < 0) return { message: '権限コード列またはGoogleメール列が見つかりません。rebuildDatabaseSchema を先に実行してください。' };
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  var updated = [];
  for (var i = 0; i < rows.length; i += 1) {
    var currentPerm = String(rows[i][permColIdx] || '').trim();
    if (!currentPerm) {
      var rowEmail = String(rows[i][emailColIdx] || '').toLowerCase();
      var newPerm = rowEmail === 'k.noguchi@uguisunosato.or.jp' ? 'MASTER' : 'ADMIN';
      sheet.getRange(i + 2, permColIdx + 1).setValue(newPerm);
      if (changerColIdx >= 0) sheet.getRange(i + 2, changerColIdx + 1).setValue('system-migration');
      if (changeTimeColIdx >= 0) sheet.getRange(i + 2, changeTimeColIdx + 1).setValue(now);
      updated.push({ email: rowEmail, perm: newPerm });
    }
  }
  return { migrated: updated.length, details: updated };
}

/**
 * ホワイトリストのデータ列ズレを修復する（v118 スキーマ移行用）。
 * writeSheetHeaders_ がヘッダーだけ上書きしデータ行を移動しなかったため、
 * 旧列位置のデータを新列位置にリマップする。
 * 使い方: npx clasp run repairWhitelistData
 */
function repairWhitelistData() {
  // 旧スキーマ列順 (10列):
  // 0:ホワイトリストID, 1:GoogleユーザーID, 2:Googleメール, 3:表示名,
  // 4:紐付け認証ID, 5:紐付け会員ID, 6:有効フラグ, 7:作成日時, 8:更新日時, 9:削除フラグ
  //
  // 新スキーマ列順 (11列):
  // 0:ホワイトリストID, 1:Googleメール, 2:紐付け認証ID, 3:紐付け会員ID,
  // 4:権限コード, 5:有効フラグ, 6:変更者メール, 7:変更日時, 8:作成日時, 9:更新日時, 10:削除フラグ
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet || sheet.getLastRow() < 2) return { message: '対象なし' };
  var lastCol = Math.max(1, sheet.getLastColumn());
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  var now = new Date().toISOString();
  var repaired = [];
  for (var i = 0; i < rows.length; i += 1) {
    var old = rows[i];
    // 旧列位置からデータを取り出し
    var wlId       = String(old[0] || '');
    var oldEmail    = String(old[2] || '');  // 旧col2 = Googleメール
    var oldAuthId   = String(old[4] || '');  // 旧col4 = 紐付け認証ID
    var oldMemberId = String(old[5] || '');  // 旧col5 = 紐付け会員ID
    var oldEnabled  = old[6];                // 旧col6 = 有効フラグ
    var oldCreated  = String(old[7] || '');  // 旧col7 = 作成日時
    var oldUpdated  = String(old[8] || '');  // 旧col8 = 更新日時
    var oldDeleted  = old[9];                // 旧col9 = 削除フラグ
    // ヒューリスティック: 旧データかどうかを判定（col1 が @ を含まないか数字のみなら旧データ）
    var col1Val = String(old[1] || '');
    var looksLikeOldLayout = col1Val && !col1Val.includes('@');
    if (!looksLikeOldLayout) {
      // 既に新スキーマに見える → スキップ
      continue;
    }
    var permCode = oldEmail.toLowerCase() === 'k.noguchi@uguisunosato.or.jp' ? 'MASTER' : 'ADMIN';
    // 新スキーマ列順でデータを書き込み (11列)
    var newRow = [
      wlId,         // 0: ホワイトリストID
      oldEmail,     // 1: Googleメール
      oldAuthId,    // 2: 紐付け認証ID
      oldMemberId,  // 3: 紐付け会員ID
      permCode,     // 4: 権限コード
      oldEnabled,   // 5: 有効フラグ
      'system-repair', // 6: 変更者メール
      now,          // 7: 変更日時
      oldCreated,   // 8: 作成日時
      oldUpdated,   // 9: 更新日時
      oldDeleted,   // 10: 削除フラグ
    ];
    sheet.getRange(i + 2, 1, 1, newRow.length).setValues([newRow]);
    repaired.push({ wlId: wlId, email: oldEmail, perm: permCode });
  }
  return { repaired: repaired.length, details: repaired };
}

/**
 * 定義外シートのみを削除する。
 */
function cleanupDatabaseSheets() {
  var ss = getOrCreateDatabase_();
  var deleted = cleanupNonSchemaSheets_(ss);
  return {
    スプレッドシートID: ss.getId(),
    削除シート一覧: deleted,
    シート一覧: ss.getSheets().map(function(sheet) {
      return sheet.getName();
    }),
  };
}

/**
 * 定義済みの範囲のみを構築する。
 * 未定義の初期業務データ（例: 認証アカウント実データ）は作成しない。
 */
function buildDefinedScopeOnly() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  markSchemaInitialized_();
  return getDefinedBuildStatus_();
}

function getDbInfo() {
  return getDbInfo_();
}
// スコープ不要の疎通確認用。Execution API経路の切り分けに使う。
function healthCheck() {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    scriptId: ScriptApp.getScriptId(),
  };
}

/**
 * v209: T_システム設定 に認証情報メール設定キーを追加する（ワンタイム実行）
 * 実行: npx clasp run insertSystemSettingKeysForV209
 */
function insertSystemSettingKeysForV209() {
  var ss = getOrCreateDatabase_();
  var now = new Date().toISOString();
  var existing = getRowsAsObjects_(ss, 'T_システム設定');
  var byKey = {};
  existing.forEach(function(row) {
    var k = String(row['設定キー'] || '');
    if (k) byKey[k] = true;
  });
  var newKeys = [
    { key: 'CREDENTIAL_EMAIL_ENABLED', value: 'true', desc: '入会申込時にログイン情報メールを送信するか（true / false）' },
    { key: 'CREDENTIAL_EMAIL_FROM', value: '', desc: '自動通知メール共通の送信元アドレス（空欄時は実行ユーザーの主メールアドレス）' },
    { key: 'CREDENTIAL_EMAIL_SUBJECT', value: CREDENTIAL_EMAIL_DEFAULT_SUBJECT, desc: '入会時認証情報メールの件名' },
    { key: 'CREDENTIAL_EMAIL_BODY', value: CREDENTIAL_EMAIL_DEFAULT_BODY, desc: '入会時認証情報メールの本文（マージタグ: {{氏名}} {{ログインID}} {{パスワード}} {{会員マイページURL}}）' },
  ];
  var added = [];
  newKeys.forEach(function(item) {
    if (!byKey[item.key]) {
      appendRowsByHeaders_(ss, 'T_システム設定', [{
        設定キー: item.key,
        設定値: item.value,
        説明: item.desc,
        更新日時: now,
      }]);
      added.push(item.key);
    }
  });
  invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
  return { added: added, skipped: newKeys.map(function(i) { return i.key; }).filter(function(k) { return added.indexOf(k) < 0; }) };
}

/**
 * v210: T_システム設定 に公開ポータルメニュー表示設定キーを追加する（ワンタイム実行）
 * 実行: npx clasp run insertSystemSettingKeysForV210
 */
function insertSystemSettingKeysForV210() {
  var ss = getOrCreateDatabase_();
  var now = new Date().toISOString();
  var existing = getRowsAsObjects_(ss, 'T_システム設定');
  var byKey = {};
  existing.forEach(function(row) {
    var k = String(row['設定キー'] || '');
    if (k) byKey[k] = true;
  });
  var newKeys = [
    { key: 'PUBLIC_PORTAL_TRAINING_MENU_ENABLED', value: 'true', desc: '公開ポータル：研修申込メニューを表示するか（true / false）' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED', value: 'true', desc: '公開ポータル：入会申込メニューを表示するか（true / false）' },
  ];
  var added = [];
  newKeys.forEach(function(item) {
    if (!byKey[item.key]) {
      appendRowsByHeaders_(ss, 'T_システム設定', [{
        設定キー: item.key,
        設定値: item.value,
        説明: item.desc,
        更新日時: now,
      }]);
      added.push(item.key);
    }
  });
  invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
  return { added: added, skipped: newKeys.map(function(i) { return i.key; }).filter(function(k) { return added.indexOf(k) < 0; }) };
}

/**
 * v194 Phase 1: T_システム設定 に3新設定キーを追加する（ワンタイム実行）
 * 実行: npx clasp run insertSystemSettingKeysForV194
 */
function insertSystemSettingKeysForV194() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var now = new Date().toISOString();
  var existing = getRowsAsObjects_(ss, 'T_システム設定');
  var byKey = {};
  existing.forEach(function(r) {
    var k = String(r['設定キー'] || '');
    if (k) byKey[k] = true;
  });
  var newKeys = [
    // v373.7 (S5 Phase 2): ROSTER_TEMPLATE_SS_ID / REMINDER_TEMPLATE_SS_ID / ROSTER_TEMPLATE_LIST
    // のスキーマ初期化エントリ撤去。既存環境では行データを残置（rollback 容易・データ保全）
    { key: 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID', value: '', desc: '一括メール個別自動添付DriveフォルダID' },
    // v374.1: 公式LINE投稿依頼
    { key: 'LINE_POST_ASSETS_FOLDER_ID', value: '', desc: '公式LINE投稿の添付ファイル保存先 Drive フォルダID（空なら初回アップロード時に自動作成）' },
    { key: 'LINE_POST_NOTIFY_EMAIL', value: '', desc: '公式LINE投稿依頼が REQUESTED 状態になった際の通知先メールアドレス（空ならメール送信スキップ）' },
    { key: 'EMAIL_LOG_VIEWER_ROLE', value: 'MASTER', desc: 'メール送信ログ閲覧権限（MASTER / MASTER,ADMIN）' },
  ];
  var added = [];
  newKeys.forEach(function(item) {
    if (!byKey[item.key]) {
      appendRowsByHeaders_(ss, 'T_システム設定', [{
        設定キー: item.key,
        設定値: item.value,
        説明: item.desc,
        更新日時: now,
      }]);
      added.push(item.key);
    }
  });
  invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
  return { added: added, skipped: newKeys.map(function(i) { return i.key; }).filter(function(k) { return !added.includes(k); }) };
}

/**
 * v194 Phase 1: T_メール送信ログ シートを DB に新設する（ワンタイム実行）
 * 実行: npx clasp run createEmailLogSheet
 */
function createEmailLogSheet() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheetName = 'T_メール送信ログ';
  var existing = ss.getSheetByName(sheetName);
  if (existing) {
    return { status: 'already_exists', sheet: sheetName };
  }
  var headers = テーブル定義[sheetName];
  if (!headers) {
    return { status: 'error', message: 'テーブル定義に ' + sheetName + ' が見つかりません' };
  }
  var sheet = ss.insertSheet(sheetName);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4a86e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  return { status: 'created', sheet: sheetName, columns: headers.length };
}

/**
 * Web App公開状態の確認用。
 * 404復旧時の一次切り分け（URL誤り / 未公開 / 権限設定ミス）に使う。
 */
function getWebAppEndpointInfo() {
  var service = ScriptApp.getService();
  return {
    scriptId: ScriptApp.getScriptId(),
    webAppUrl: service.getUrl(),
    serviceEnabled: service.isEnabled(),
    timestamp: new Date().toISOString(),
  };
}

function getApiDataSnapshot() {
  return fetchAllDataFromDb_();
}

/**
 * 研修の問い合わせ窓口（担当者/連絡先）欠損を監査する。
 */
function auditTrainingInquiryContacts() {
  var ss = getOrCreateDatabase_();
  var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });

  var missing = [];
  for (var i = 0; i < rows.length; i += 1) {
    var r = rows[i];
    var options = parseTrainingOptions_(r['項目設定JSON']);
    var person = String(options.inquiryPerson || '').trim();
    var contact = String(options.inquiryContactValue || '').trim();
    if (!person || !contact) {
      missing.push({
        trainingId: String(r['研修ID'] || ''),
        title: String(r['研修名'] || ''),
        inquiryPerson: person,
        inquiryContactValue: contact,
      });
    }
  }

  return {
    total: rows.length,
    missingCount: missing.length,
    missingTrainings: missing,
  };
}

/**
 * 研修の問い合わせ窓口（担当者/連絡先）未設定データをテスト用既定値で補完する。
 */
function backfillTrainingInquiryContacts() {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var ss = getOrCreateDatabase_();
    var sheet = ss.getSheetByName('T_研修');
    if (!sheet) throw new Error('T_研修 シートが見つかりません。');
    if (sheet.getLastRow() < 2) {
      return { scanned: 0, updated: 0, updatedTrainings: [], message: '研修データがありません。' };
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
    requireColumns_(cols, ['研修ID', '研修名', '項目設定JSON', '更新日時', '削除フラグ']);

    var nowIso = new Date().toISOString();
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var updatedTrainings = [];
    var scanned = 0;

    for (var r = 0; r < rows.length; r += 1) {
      var row = rows[r];
      if (toBoolean_(row[cols['削除フラグ']])) continue;
      scanned += 1;

      var options = parseTrainingOptions_(row[cols['項目設定JSON']]);
      var person = String(options.inquiryPerson || '').trim();
      var contact = String(options.inquiryContactValue || '').trim();
      if (person && contact) continue;

      var nextPerson = person || '事務局';
      var nextContactValue = contact || 'support@example.com';
      var nextContactType = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextContactValue) ? 'EMAIL' : 'PHONE';

      row[cols['項目設定JSON']] = serializeTrainingOptions_(
        options.fieldConfig,
        options.cancelAllowed,
        nextPerson,
        nextContactType,
        nextContactValue,
        '',
        '',
        options.askMemberNumber
      );
      row[cols['更新日時']] = nowIso;

      sheet.getRange(r + 2, 1, 1, row.length).setValues([row]);
      updatedTrainings.push({
        trainingId: String(row[cols['研修ID']] || ''),
        title: String(row[cols['研修名']] || ''),
        inquiryPerson: nextPerson,
        inquiryContactType: nextContactType,
        inquiryContactValue: nextContactValue,
      });
    }

    SpreadsheetApp.flush();
    return {
      scanned: scanned,
      updated: updatedTrainings.length,
      updatedTrainings: updatedTrainings,
    };
  } finally {
    lock.releaseLock();
  }
}



function verifySeedData() {
  var ss = getOrCreateDatabase_();
  var members = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var auths = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var trainings = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var fees = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) { return !toBoolean_(r['削除フラグ']); });

  var emailChecks = [];
  for (var i = 0; i < members.length; i += 1) {
    if (members[i]['代表メールアドレス']) emailChecks.push(String(members[i]['代表メールアドレス']));
  }
  for (var j = 0; j < staffs.length; j += 1) {
    if (staffs[j]['メールアドレス']) emailChecks.push(String(staffs[j]['メールアドレス']));
  }
  for (var k = 0; k < auths.length; k += 1) {
    if (auths[k]['Googleメール']) emailChecks.push(String(auths[k]['Googleメール']));
  }

  var distinctEmails = uniqueStrings_(emailChecks);
  var loginIds = auths
    .filter(function(a) { return String(a['認証方式'] || '') === 'PASSWORD'; })
    .map(function(a) { return String(a['ログインID'] || ''); })
    .filter(function(v) { return !!v; });

  var result = {
    memberCount: members.length,
    staffCount: staffs.length,
    authCount: auths.length,
    trainingCount: trainings.length,
    annualFeeCount: fees.length,
    loginIds: loginIds,
    distinctEmails: distinctEmails,
    allEmailsAreNoguchi: distinctEmails.every(function(e) { return e === 'k.noguchi@uguisunosato.or.jp'; }),
  };

  Logger.log(JSON.stringify(result));
  return result;
}

/** DBスプレッドシートのタイムゾーンをAsia/Tokyoに設定する（一度だけ実行）*/
function setSpreadsheetTimezone() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  ss.setSpreadsheetTimeZone('Asia/Tokyo');
  Logger.log('スプレッドシートのタイムゾーンを Asia/Tokyo に設定しました。現在: ' + ss.getSpreadsheetTimeZone());
}

function seedDemoData() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);

  var now = new Date().toISOString();
  clearTableData_(ss, [
    'T_会員',
    'T_事業所職員',
    'T_認証アカウント',
    'T_ログイン履歴',
    'T_管理者Googleホワイトリスト',
    'T_研修',
    'T_研修申込',
    'T_年会費納入履歴',
  ]);

  appendRowsByHeaders_(ss, 'T_会員', [
    {
      会員ID: '12345678',
      会員種別コード: 'INDIVIDUAL',
      会員状態コード: 'ACTIVE',
      入会日: '2024-04-01',
      退会日: '',
      姓: '山田',
      名: '太郎',
      セイ: 'ヤマダ',
      メイ: 'タロウ',
      代表メールアドレス: 'k.noguchi@uguisunosato.or.jp',
      携帯電話番号: '090-0000-0000',
      介護支援専門員番号: '12345678',
      勤務先名: '枚方ケアプランセンター',
      勤務先郵便番号: '573-0027',
      勤務先都道府県: '大阪府',
      勤務先市区町村: '枚方市',
      勤務先住所: '大垣内町1-1-1',
      勤務先電話番号: '072-000-0000',
      勤務先FAX番号: '072-000-0001',
      自宅郵便番号: '573-0000',
      自宅都道府県: '大阪府',
      自宅市区町村: '枚方市',
      自宅住所: '自宅町1-2-3',
      発送方法コード: 'EMAIL',
      郵送先区分コード: 'OFFICE',
      職員数上限: '',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      会員ID: '87654321',
      会員種別コード: 'INDIVIDUAL',
      会員状態コード: 'ACTIVE',
      入会日: '2024-04-01',
      退会日: '',
      姓: '鈴木',
      名: '花子',
      セイ: 'スズキ',
      メイ: 'ハナコ',
      代表メールアドレス: '',
      携帯電話番号: '090-1111-1111',
      介護支援専門員番号: '87654321',
      勤務先名: '勤務なし',
      勤務先郵便番号: '',
      勤務先都道府県: '',
      勤務先市区町村: '',
      勤務先住所: '',
      勤務先電話番号: '',
      勤務先FAX番号: '',
      自宅郵便番号: '573-0121',
      自宅都道府県: '大阪府',
      自宅市区町村: '枚方市',
      自宅住所: '津田北町2-2-2',
      発送方法コード: 'POST',
      郵送先区分コード: 'HOME',
      職員数上限: '',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      会員ID: '934567890',
      会員種別コード: 'SUPPORT',
      会員状態コード: 'ACTIVE',
      入会日: '2024-04-01',
      退会日: '',
      姓: '高橋',
      名: '恵',
      セイ: 'タカハシ',
      メイ: 'メグミ',
      代表メールアドレス: '',
      携帯電話番号: '090-2222-3333',
      介護支援専門員番号: '',
      勤務先名: '賛助会員（個人）',
      勤務先郵便番号: '',
      勤務先都道府県: '',
      勤務先市区町村: '',
      勤務先住所: '',
      勤務先電話番号: '',
      勤務先FAX番号: '072-333-3333',
      自宅郵便番号: '573-0055',
      自宅都道府県: '大阪府',
      自宅市区町村: '枚方市',
      自宅住所: '中宮本町1-1',
      発送方法コード: 'POST',
      郵送先区分コード: 'HOME',
      職員数上限: '',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      会員ID: '99999999',
      会員種別コード: 'BUSINESS',
      会員状態コード: 'ACTIVE',
      入会日: '2024-04-01',
      退会日: '',
      姓: '佐藤',
      名: '次郎',
      セイ: 'サトウ',
      メイ: 'ジロウ',
      代表メールアドレス: 'k.noguchi@uguisunosato.or.jp',
      携帯電話番号: '080-8888-8888',
      介護支援専門員番号: '933307710',
      勤務先名: 'ひらかた介護ステーション',
      勤務先郵便番号: '573-0084',
      勤務先都道府県: '大阪府',
      勤務先市区町村: '枚方市',
      勤務先住所: '香里ケ丘3-3-3',
      勤務先電話番号: '072-222-2222',
      勤務先FAX番号: '072-222-2223',
      自宅郵便番号: '',
      自宅都道府県: '',
      自宅市区町村: '',
      自宅住所: '',
      発送方法コード: 'EMAIL',
      郵送先区分コード: 'OFFICE',
      職員数上限: 10,
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);

  appendRowsByHeaders_(ss, 'T_事業所職員', [
    {
      職員ID: 'S1',
      会員ID: '99999999',
      氏名: '佐藤 次郎',
      フリガナ: 'サトウ ジロウ',
      メールアドレス: 'k.noguchi@uguisunosato.or.jp',
      職員権限コード: 'REPRESENTATIVE',
      職員状態コード: 'ENROLLED',
      入会日: '2024-04-01',
      退会日: '',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      職員ID: 'S2',
      会員ID: '99999999',
      氏名: '田中 三郎',
      フリガナ: 'タナカ サブロウ',
      メールアドレス: 'k.noguchi@uguisunosato.or.jp',
      職員権限コード: 'ADMIN',
      職員状態コード: 'ENROLLED',
      入会日: '2024-04-01',
      退会日: '',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      職員ID: 'S3',
      会員ID: '99999999',
      氏名: '伊藤 四郎',
      フリガナ: 'イトウ シロウ',
      メールアドレス: 'k.noguchi@uguisunosato.or.jp',
      職員権限コード: 'STAFF',
      職員状態コード: 'ENROLLED',
      入会日: '2024-04-01',
      退会日: '',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);

  seedAuthAccounts_(ss, now);

  appendRowsByHeaders_(ss, 'T_管理者Googleホワイトリスト', [
    {
      ホワイトリストID: 'WL-001',
      Googleメール: 'k.noguchi@uguisunosato.or.jp',
      紐付け認証ID: 'AUTH-ADMIN-GOOGLE',
      紐付け会員ID: '99999999',
      権限コード: 'MASTER',
      有効フラグ: true,
      変更者メール: 'k.noguchi@uguisunosato.or.jp',
      変更日時: now,
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);

  appendRowsByHeaders_(ss, 'T_研修', [
    {
      研修ID: 'T001',
      研修名: '令和8年度 介護報酬改定に伴う実務研修',
      開催日: Utilities.parseDate('2026-04-15 10:00', 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'),
      開催終了時刻: '12:00',
      定員: 100,
      申込者数: 12,
      開催場所: 'オンライン (Zoom)',
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: false,
      研修概要: '介護報酬改定の実務対応ポイントを解説します。',
      研修内容: '改定内容の要点、請求・記録の実務対応、質疑応答を行います。現場での運用変更点を具体例で確認します。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 0 }, { label: '非会員', amount: 1000 }]),
      申込開始日: '2026-03-01',
      申込締切日: '2026-04-10',
      講師: '厚生労働省 担当官',
      案内状URL: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      項目設定JSON: serializeTrainingOptions_(null, true, '事務局 田中', 'EMAIL', 'support@example.com'),
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      研修ID: 'T002',
      研修名: '認知症ケア実践リーダー研修',
      開催日: Utilities.parseDate('2026-05-10 13:00', 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'),
      開催終了時刻: '17:00',
      定員: 40,
      申込者数: 40,
      開催場所: '枚方市市民会館 会議室A',
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: true,
      研修概要: '認知症ケアの実践事例とリーダー育成を扱います。',
      研修内容: 'ケーススタディを通じて、チームでの支援方針策定と多職種連携を学びます。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 2000 }, { label: '非会員', amount: 3000 }]),
      申込開始日: '2026-03-15',
      申込締切日: '2026-04-25',
      講師: '田中 一郎 先生',
      案内状URL: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      項目設定JSON: serializeTrainingOptions_(null, false, '事務局 佐藤', 'PHONE', '072-000-1234'),
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      研修ID: 'T003',
      研修名: 'ケアプラン点検 実践ハンズオン',
      開催日: Utilities.parseDate('2026-05-23 10:00', 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'),
      開催終了時刻: '16:00',
      定員: 60,
      申込者数: 18,
      開催場所: '枚方市総合文化芸術センター 第2会議室',
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: false,
      研修概要: '提出書類の点検観点を実例ベースで学ぶ実践型研修です。',
      研修内容: '事前配布資料のケースに沿って、算定根拠・記録整合性・加算要件を確認します。少人数グループで相互レビューを行います。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 1000 }, { label: '非会員', amount: 4000 }]),
      申込開始日: '2026-03-20',
      申込締切日: '2026-05-16',
      講師: '中村 友美 先生',
      案内状URL: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      項目設定JSON: serializeTrainingOptions_(null, true, '研修担当 中村', 'EMAIL', 'kenshu@example.com'),
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      研修ID: 'T004',
      研修名: '在宅医療連携アップデート 2026',
      開催日: Utilities.parseDate('2026-06-06 14:00', 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'),
      開催終了時刻: '16:30',
      定員: 120,
      申込者数: 45,
      開催場所: 'オンライン (Zoom)',
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: true,
      研修概要: '多職種連携の最新実務と連絡票運用を整理します。',
      研修内容: '訪問診療・訪問看護・薬局・ケアマネの連携フローを、事例とテンプレートで確認します。オンライン参加向け資料も配布します。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 0 }, { label: '非会員', amount: 2000 }]),
      申込開始日: '2026-03-20',
      申込締切日: '2026-05-30',
      講師: '川口 誠 先生',
      案内状URL: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      項目設定JSON: serializeTrainingOptions_(null, false, '運営窓口 川口', 'PHONE', '072-111-2222'),
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);

  appendRowsByHeaders_(ss, 'T_研修申込', [
    {
      申込ID: 'AP-001',
      研修ID: 'T002',
      会員ID: '12345678',
      職員ID: '',
      申込状態コード: 'APPLIED',
      申込日時: now,
      取消日時: '',
      備考: '',
      申込者区分コード: 'MEMBER',
      申込者ID: '12345678',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      申込ID: 'AP-002',
      研修ID: 'T001',
      会員ID: '99999999',
      職員ID: 'S1',
      申込状態コード: 'APPLIED',
      申込日時: now,
      取消日時: '',
      備考: '',
      申込者区分コード: 'MEMBER',
      申込者ID: '99999999',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      申込ID: 'AP-003',
      研修ID: 'T002',
      会員ID: '99999999',
      職員ID: 'S1',
      申込状態コード: 'APPLIED',
      申込日時: now,
      取消日時: '',
      備考: '',
      申込者区分コード: 'MEMBER',
      申込者ID: '99999999',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
    {
      申込ID: 'AP-004',
      研修ID: 'T001',
      会員ID: '99999999',
      職員ID: 'S2',
      申込状態コード: 'APPLIED',
      申込日時: now,
      取消日時: '',
      備考: '',
      申込者区分コード: 'MEMBER',
      申込者ID: '99999999',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);

  appendRowsByHeaders_(ss, 'T_年会費納入履歴', [
    { 年会費履歴ID: 'FY-001', 会員ID: '12345678', 対象年度: 2025, 会費納入状態コード: 'PAID', 納入確認日: '2025-05-01', 金額: 3000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-002', 会員ID: '12345678', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 3000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-003', 会員ID: '87654321', 対象年度: 2025, 会費納入状態コード: 'UNPAID', 納入確認日: '', 金額: 3000, 備考: JSON.stringify(DEMO_TRANSFER_ACCOUNT), 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-004', 会員ID: '87654321', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 3000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-007', 会員ID: '934567890', 対象年度: 2025, 会費納入状態コード: 'PAID', 納入確認日: '2025-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-008', 会員ID: '934567890', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-005', 会員ID: '99999999', 対象年度: 2025, 会費納入状態コード: 'PAID', 納入確認日: '2025-05-01', 金額: 8000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-006', 会員ID: '99999999', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 8000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
  ]);

  return {
    message: 'デモデータ投入完了',
    dbInfo: getDbInfo_(),
  };
}

/**
 * 負荷試験用の会員・事業所・職員・認証・会費・研修申込データを追加する。
 * - 既存データは保持する
 * - 以前生成した LT 系データのみ削除して再生成する
 * - 会員/職員/認証/年会費/申込/申込者数の整合を同一処理で保つ
 */
function seedPerformanceTestData() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);

  var nowIso = new Date().toISOString();
  var seed = 20260315;
  var rng = createSeededRandom_(seed);
  var currentYear = new Date().getFullYear();
  var previousYear = currentYear - 1;
  var counts = {
    individualMembers: 300,
    businessMembers: 30,
    minStaffPerBusiness: 4,
    maxStaffPerBusiness: 10,
    loadTrainings: 8,
  };
  var baseLoginNumber = 20000001;

  var removed = purgePerformanceTestData_(ss);
  var amountMap = getAnnualFeeAmountMap_(ss);
  var trainingRows = buildPerformanceLoadTrainingRows_(counts.loadTrainings, nowIso);

  var memberRows = [];
  var staffRows = [];
  var authRows = [];
  var feeRows = [];
  var applicationRows = [];
  var applicantPool = [];
  var loginFirst = '';
  var loginLast = '';
  var applicationSeq = 1;
  var totalStaff = 0;

  function nextLoginId_() {
    var loginId = String(baseLoginNumber);
    baseLoginNumber += 1;
    if (!loginFirst) loginFirst = loginId;
    loginLast = loginId;
    return loginId;
  }

  for (var i = 1; i <= counts.individualMembers; i += 1) {
    var memberNo = padNumber_(i, 3);
    var memberId = 'LTM-I-' + memberNo;
    var loginId = nextLoginId_();
    var memberEmail = 'load.ind.' + memberNo + '@example.test';
    var joinedDate = randomDateString_(rng, '2023-04-01', '2025-03-31');
    memberRows.push({
      会員ID: memberId,
      会員種別コード: 'INDIVIDUAL',
      会員状態コード: 'ACTIVE',
      入会日: joinedDate,
      退会日: '',
      姓: '負荷',
      名: '個人' + memberNo,
      セイ: 'フカ',
      メイ: 'コジン' + memberNo,
      代表メールアドレス: memberEmail,
      携帯電話番号: '090-' + padNumber_(1000 + i, 4) + '-' + padNumber_(2000 + i, 4),
      介護支援専門員番号: '71' + padNumber_(i, 8),
      勤務先名: '負荷試験個人会員',
      勤務先郵便番号: '',
      勤務先都道府県: '',
      勤務先市区町村: '',
      勤務先住所: '',
      勤務先電話番号: '',
      勤務先FAX番号: '',
      自宅郵便番号: '573-' + padNumber_(1000 + i, 4),
      自宅都道府県: '大阪府',
      自宅市区町村: '枚方市',
      自宅住所: '負荷試験町' + memberNo + '-1-1',
      発送方法コード: rng() < 0.75 ? 'EMAIL' : 'POST',
      郵送先区分コード: 'HOME',
      職員数上限: '',
      作成日時: nowIso,
      更新日時: nowIso,
      削除フラグ: false,
    });
    authRows.push(createPasswordAuthRow_(
      'LTAUTH-I-' + memberNo,
      loginId,
      'INDIVIDUAL_MEMBER',
      memberId,
      '',
      'test',
      nowIso
    ));
    feeRows.push(buildPerformanceFeeRow_(memberId, 'INDIVIDUAL', currentYear, nowIso, amountMap, rng, 'LTFEE-I-' + memberNo + '-' + currentYear));
    feeRows.push(buildPerformanceFeeRow_(memberId, 'INDIVIDUAL', previousYear, nowIso, amountMap, rng, 'LTFEE-I-' + memberNo + '-' + previousYear));
    applicantPool.push({ memberId: memberId, staffId: '', joinedDate: joinedDate });
  }

  for (var officeIndex = 1; officeIndex <= counts.businessMembers; officeIndex += 1) {
    var officeNo = padNumber_(officeIndex, 3);
    var officeMemberId = 'LTM-B-' + officeNo;
    var staffCount = counts.minStaffPerBusiness + Math.floor(rng() * (counts.maxStaffPerBusiness - counts.minStaffPerBusiness + 1));
    totalStaff += staffCount;
    var officeJoinedDate = randomDateString_(rng, '2023-04-01', '2025-03-31');
    var adminEmail = 'load.office.' + officeNo + '.admin@example.test';
    memberRows.push({
      会員ID: officeMemberId,
      会員種別コード: 'BUSINESS',
      会員状態コード: 'ACTIVE',
      入会日: officeJoinedDate,
      退会日: '',
      姓: '負荷',
      名: '事業所' + officeNo + '管理者',
      セイ: 'フカ',
      メイ: 'ジギョウショ' + officeNo,
      代表メールアドレス: adminEmail,
      携帯電話番号: '080-' + padNumber_(3000 + officeIndex, 4) + '-' + padNumber_(4000 + officeIndex, 4),
      介護支援専門員番号: '72' + padNumber_(officeIndex, 8),
      勤務先名: '負荷試験事業所' + officeNo,
      勤務先郵便番号: '573-' + padNumber_(5000 + officeIndex, 4),
      勤務先都道府県: '大阪府',
      勤務先市区町村: '枚方市',
      勤務先住所: '負荷事業所町' + officeNo + '-2-3',
      勤務先電話番号: '072-5' + padNumber_(officeIndex, 3) + '-1000',
      勤務先FAX番号: '072-5' + padNumber_(officeIndex, 3) + '-1001',
      自宅郵便番号: '',
      自宅都道府県: '',
      自宅市区町村: '',
      自宅住所: '',
      発送方法コード: rng() < 0.9 ? 'EMAIL' : 'POST',
      郵送先区分コード: 'OFFICE',
      職員数上限: staffCount,
      作成日時: nowIso,
      更新日時: nowIso,
      削除フラグ: false,
    });
    feeRows.push(buildPerformanceFeeRow_(officeMemberId, 'BUSINESS', currentYear, nowIso, amountMap, rng, 'LTFEE-B-' + officeNo + '-' + currentYear));
    feeRows.push(buildPerformanceFeeRow_(officeMemberId, 'BUSINESS', previousYear, nowIso, amountMap, rng, 'LTFEE-B-' + officeNo + '-' + previousYear));

    for (var staffIndex = 1; staffIndex <= staffCount; staffIndex += 1) {
      var staffNo = padNumber_(staffIndex, 2);
      var staffId = 'LTSTAFF-' + officeNo + '-' + staffNo;
      var staffName = '負荷事業所' + officeNo + '職員' + staffNo;
      var staffEmail = staffIndex === 1 ? adminEmail : 'load.office.' + officeNo + '.staff' + staffNo + '@example.test';
      var staffJoinedDate = randomDateString_(rng, officeJoinedDate, '2025-12-31');
      var roleCode = staffIndex === 1 ? 'ADMIN' : 'STAFF';
      var systemRoleCode = staffIndex === 1 ? 'BUSINESS_ADMIN' : 'BUSINESS_MEMBER';
      var loginIdForStaff = nextLoginId_();

      staffRows.push({
        職員ID: staffId,
        会員ID: officeMemberId,
        氏名: staffName,
        フリガナ: 'フカジギョウショ' + officeNo + 'ショクイン' + staffNo,
        メールアドレス: staffEmail,
        職員権限コード: roleCode,
        職員状態コード: 'ENROLLED',
        入会日: staffJoinedDate,
        退会日: '',
        作成日時: nowIso,
        更新日時: nowIso,
        削除フラグ: false,
      });
      authRows.push(createPasswordAuthRow_(
        'LTAUTH-B-' + officeNo + '-' + staffNo,
        loginIdForStaff,
        systemRoleCode,
        officeMemberId,
        staffId,
        'test',
        nowIso
      ));
      applicantPool.push({ memberId: officeMemberId, staffId: staffId, joinedDate: staffJoinedDate });
    }
  }

  applicationRows = buildPerformanceApplications_(
    applicantPool,
    trainingRows,
    nowIso,
    rng,
    function nextApplicationId() {
      var id = 'LTAPP-' + padNumber_(applicationSeq, 6);
      applicationSeq += 1;
      return id;
    }
  );

  appendRowsByHeaders_(ss, 'T_会員', memberRows);
  appendRowsByHeaders_(ss, 'T_事業所職員', staffRows);
  appendRowsByHeaders_(ss, 'T_認証アカウント', authRows);
  appendRowsByHeaders_(ss, 'T_年会費納入履歴', feeRows);
  appendRowsByHeaders_(ss, 'T_研修', trainingRows);
  appendRowsByHeaders_(ss, 'T_研修申込', applicationRows.rows);

  SpreadsheetApp.flush();
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  clearAnnualFeeAdminCache_(currentYear);
  clearAnnualFeeAdminCache_(previousYear);

  return {
    ok: true,
    message: '負荷試験データを再生成しました。',
    seed: seed,
    removed: removed,
    generated: {
      individualMembers: memberRows.filter(function(row) { return String(row['会員種別コード'] || '') === 'INDIVIDUAL'; }).length,
      businessMembers: memberRows.filter(function(row) { return String(row['会員種別コード'] || '') === 'BUSINESS'; }).length,
      businessStaff: totalStaff,
      authAccounts: authRows.length,
      annualFeeRecords: feeRows.length,
      trainings: trainingRows.length,
      applications: applicationRows.rows.length,
      appliedApplications: applicationRows.appliedCount,
      canceledApplications: applicationRows.canceledCount,
    },
    login: {
      firstLoginId: loginFirst,
      lastLoginId: loginLast,
      password: 'test',
    },
    annualFeeYears: [currentYear, previousYear],
  };
}

function purgePerformanceTestData_(ss) {
  return {
    trainings: rewriteTableWithoutRows_(ss, 'T_研修', function(row) {
      return !startsWith_(row['研修ID'], 'LTT-');
    }),
    applications: rewriteTableWithoutRows_(ss, 'T_研修申込', function(row) {
      return !startsWith_(row['申込ID'], 'LTAPP-');
    }),
    annualFees: rewriteTableWithoutRows_(ss, 'T_年会費納入履歴', function(row) {
      return !startsWith_(row['年会費履歴ID'], 'LTFEE-');
    }),
    authAccounts: rewriteTableWithoutRows_(ss, 'T_認証アカウント', function(row) {
      return !startsWith_(row['認証ID'], 'LTAUTH-');
    }),
    staffs: rewriteTableWithoutRows_(ss, 'T_事業所職員', function(row) {
      return !startsWith_(row['職員ID'], 'LTSTAFF-');
    }),
    members: rewriteTableWithoutRows_(ss, 'T_会員', function(row) {
      return !startsWith_(row['会員ID'], 'LTM-');
    }),
  };
}

function buildPerformanceLoadTrainingRows_(count, nowIso) {
  var trainings = [];
  for (var i = 1; i <= count; i += 1) {
    var no = padNumber_(i, 3);
    var month = 4 + ((i - 1) % 6);
    var day = 5 + ((i * 3) % 20);
    var startHour = 10 + (i % 4) * 2;
    var closeHour = startHour + 2;
    trainings.push({
      研修ID: 'LTT-' + no,
      研修名: '負荷試験研修 ' + no,
      開催日: Utilities.parseDate('2026-' + padNumber_(month, 2) + '-' + padNumber_(day, 2) + ' ' + padNumber_(startHour, 2) + ':00', 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'),
      開催終了時刻: padNumber_(closeHour, 2) + ':00',
      定員: 180,
      申込者数: 0,
      開催場所: i % 2 === 0 ? 'オンライン (Zoom)' : '枚方市総合文化芸術センター 会議室' + i,
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: i % 2 === 0,
      研修概要: '負荷試験用に生成した研修データです。',
      研修内容: '一覧・申込・管理画面の応答確認用に生成したテスト研修です。業務利用しないでください。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 0 }, { label: '非会員', amount: 2000 }]),
      申込開始日: '2026-03-01',
      申込締切日: '2026-12-20',
      講師: '負荷試験講師 ' + no,
      案内状URL: '',
      項目設定JSON: serializeTrainingOptions_(null, true, '負荷試験事務局', 'EMAIL', 'load-test@example.test'),
      作成日時: nowIso,
      更新日時: nowIso,
      削除フラグ: false,
    });
  }
  return trainings;
}

function buildPerformanceFeeRow_(memberId, memberTypeCode, year, nowIso, amountMap, rng, recordId) {
  var paidProbability = year === new Date().getFullYear() ? 0.72 : 0.9;
  var isPaid = rng() < paidProbability;
  return {
    年会費履歴ID: recordId,
    会員ID: memberId,
    対象年度: year,
    会費納入状態コード: isPaid ? 'PAID' : 'UNPAID',
    納入確認日: isPaid ? randomDateString_(rng, year + '-04-01', year + '-09-30') : '',
    金額: Number(amountMap[memberTypeCode] || 0),
    備考: isPaid ? '負荷試験データ' : '負荷試験データ（未納）',
    作成日時: nowIso,
    更新日時: nowIso,
    削除フラグ: false,
  };
}

function buildPerformanceApplications_(applicantPool, trainingRows, nowIso, rng, nextApplicationIdFn) {
  var rows = [];
  var activeCounts = {};
  var appliedCount = 0;
  var canceledCount = 0;
  var trainingIds = trainingRows.map(function(training) { return String(training['研修ID'] || ''); });
  var trainingCapacity = {};
  for (var t = 0; t < trainingRows.length; t += 1) {
    trainingCapacity[String(trainingRows[t]['研修ID'] || '')] = Number(trainingRows[t]['定員'] || 0);
    activeCounts[String(trainingRows[t]['研修ID'] || '')] = 0;
  }

  for (var i = 0; i < applicantPool.length; i += 1) {
    var applicant = applicantPool[i];
    var selected = shuffleArray_(trainingIds.slice(), rng);
    var desiredApplications = rng() < 0.2 ? 2 : (rng() < 0.45 ? 1 : 0);
    var added = 0;

    for (var j = 0; j < selected.length && added < desiredApplications; j += 1) {
      var trainingId = selected[j];
      if (activeCounts[trainingId] >= trainingCapacity[trainingId]) continue;
      var appliedAt = randomDateTimeIso_(rng, '2026-03-01T09:00:00+09:00', '2026-03-15T18:00:00+09:00');
      var isCanceled = rng() < 0.18;
      rows.push({
        申込ID: nextApplicationIdFn(),
        研修ID: trainingId,
        会員ID: applicant.memberId,
        申込者区分コード: 'MEMBER',
        申込者ID: applicant.memberId,
        職員ID: applicant.staffId || '',
        申込状態コード: isCanceled ? 'CANCELED' : 'APPLIED',
        申込日時: appliedAt,
        取消日時: isCanceled ? addHoursToIsoString_(appliedAt, 24) : '',
        備考: '負荷試験データ',
        作成日時: nowIso,
        更新日時: nowIso,
        削除フラグ: false,
      });
      if (isCanceled) {
        canceledCount += 1;
      } else {
        activeCounts[trainingId] += 1;
        appliedCount += 1;
      }
      added += 1;
    }
  }

  for (var k = 0; k < trainingRows.length; k += 1) {
    var id = String(trainingRows[k]['研修ID'] || '');
    trainingRows[k]['申込者数'] = Number(activeCounts[id] || 0);
  }

  return {
    rows: rows,
    appliedCount: appliedCount,
    canceledCount: canceledCount,
  };
}






/**
 * v376.30 hotfix: DB_SCHEMA_INITIALIZED_VERSION を現在の DB_SCHEMA_VERSION に強制マークする。
 *
 * 用途: initializeSchemaIfNeeded_ が初期化途中の例外で markSchemaInitialized_ に到達できず、
 * スキーマ自体は既に正しい状態だが Properties が古いままで毎回再初期化が走る状況の救済。
 * diagnoseSchemaStateV376_30 でスキーマが期待値に一致していることを確認した上で実行すること。
 *
 * 書込み: PropertiesService の 2 キーのみ。シートは触らない（破壊なし）。
 */
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

// 2026-10-19 docs/307 S18: スキーマ整備（initializeSchema_）を本番 DB の「コピー」で通しで流し、
// 全シートの全セルを前後で突き合わせる。本番 DB には書き込まない（コピーを作って最後にゴミ箱へ移す）。
// スキーマの版を上げるリリースの前に実行し、巻き添えが 0 であることを確かめる。
// 出力にセルの値は出さない（型と件数だけ。個人情報を実行ログやチャットへ出さない）。
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

function snapshotSheetForRehearsal_(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol < 1) return { headers: [], rows: [] };
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h == null ? '' : h); });
  var rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  return {
    headers: headers,
    rows: rows.map(function(row) { return row.map(rehearsalCellKey_); }),
  };
}

function snapshotSpreadsheetForRehearsal_(ss) {
  var snap = {};
  ss.getSheets().forEach(function(sheet) { snap[sheet.getName()] = snapshotSheetForRehearsal_(sheet); });
  return snap;
}

// 値を型付きの文字列にする。'0123'（文字列）と 123（数値）、日付と同じ見た目の文字列を区別する
function rehearsalCellKey_(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return 'date:' + v.getTime();
  return typeof v + ':' + String(v);
}

// 前後のスナップショットを列名で突き合わせる。issues は「あってはならない変化」だけ。
function diffSpreadsheetSnapshotsForRehearsal_(before, after) {
  var out = { issues: [], changedTables: [], removedSheets: [], addedSheets: [], appendedRows: {} };
  Object.keys(before).forEach(function(name) {
    if (!after[name]) {
      out.removedSheets.push(name);
      if (テーブル定義[name] || before[name].rows.length > 0) out.issues.push(name + ': シートが消えた（' + before[name].rows.length + ' 行）');
    }
  });
  Object.keys(after).forEach(function(name) { if (!before[name]) out.addedSheets.push(name); });

  Object.keys(before).forEach(function(name) {
    var b = before[name];
    var a = after[name];
    if (!a) return;
    var changed = false;
    var aIndex = {};
    a.headers.forEach(function(h, i) { if (h && aIndex[h] == null) aIndex[h] = i; });
    var bIndex = {};
    b.headers.forEach(function(h, i) { if (h && bIndex[h] == null) bIndex[h] = i; });
    if (a.headers.join('\u0001') !== b.headers.join('\u0001')) changed = true;

    if (a.rows.length < b.rows.length) out.issues.push(name + ': 行が減った ' + b.rows.length + '→' + a.rows.length);
    if (a.rows.length > b.rows.length) { out.appendedRows[name] = a.rows.length - b.rows.length; changed = true; }

    b.headers.forEach(function(h, bi) {
      var nonEmpty = b.rows.filter(function(row) { return row[bi] !== ''; }).length;
      if (!h || bIndex[h] !== bi) {
        if (nonEmpty > 0) out.issues.push(name + ': 見出しの無い列・重複列 ' + (bi + 1) + '列目のデータ ' + nonEmpty + ' 件');
        return;
      }
      var ai = aIndex[h];
      if (ai == null) {
        changed = true;
        if (nonEmpty > 0) out.issues.push(name + ': 列「' + h + '」が消えた（データ ' + nonEmpty + ' 件）');
        return;
      }
      var mismatch = 0;
      var converted = 0;
      var example = '';
      var n = Math.min(a.rows.length, b.rows.length);
      // 書式なしテキストの列（applyTextColumnFormats_）は、数値のセルが同じ数字の文字列になる。値は変わらないので別に数える
      var isTextColumn = (TEXT_FORMAT_COLUMNS_[name.slice(-8) === '_archive' ? name.slice(0, -8) : name] || []).indexOf(h) >= 0;
      for (var r = 0; r < n; r += 1) {
        var bv = b.rows[r][bi];
        var av = a.rows[r][ai] == null ? '' : a.rows[r][ai];
        if (bv !== av) {
          if (isTextColumn && String(bv).indexOf('number:') === 0 && av === 'string:' + String(bv).slice(7)) { converted += 1; continue; }
          mismatch += 1;
          if (!example) example = (r + 2) + '行目 ' + String(bv).split(':')[0] + '→' + String(av).split(':')[0];
        }
      }
      if (converted > 0) { changed = true; (out.textConverted = out.textConverted || {})[name + '.' + h] = converted; }
      if (mismatch > 0) { changed = true; out.issues.push(name + ': 列「' + h + '」の値が ' + mismatch + ' 件変わった（例: ' + example + '）'); }
    });

    a.headers.forEach(function(h, ai) {
      if (!h || bIndex[h] != null) return;
      var filled = 0;
      for (var r = 0; r < Math.min(a.rows.length, b.rows.length); r += 1) if (a.rows[r][ai] !== '') filled += 1;
      if (filled > 0) out.issues.push(name + ': 足した列「' + h + '」の既存行に値が入った ' + filled + ' 件');
    });
    if (changed) out.changedTables.push(name);
  });
  return out;
}

// 2026-10-19: DB が守らない ID 参照（docs/294 §3.2 の 24 本＋BR-21 の 2 本）。[子テーブル, 列, 親テーブル]。親の主キーは親の先頭列。
// docs/er-metadata.json の関係と一致することを test:db-state が確かめる（増減したら両方を直す）。
var DB_STATE_ID_REFERENCES_ = [
  ['T_事業所職員', '会員ID', 'T_会員'],
  ['T_認証アカウント', '会員ID', 'T_会員'],
  ['T_認証アカウント', '職員ID', 'T_事業所職員'],
  ['T_管理者Googleホワイトリスト', '紐付け認証ID', 'T_認証アカウント'],
  ['T_管理者Googleホワイトリスト', '紐付け会員ID', 'T_会員'],
  ['T_研修申込', '研修ID', 'T_研修'],
  ['T_研修申込', '会員ID', 'T_会員'],
  ['T_研修申込', '職員ID', 'T_事業所職員'],
  ['T_研修申込', '外部申込者ID', 'T_外部申込者'],
  ['T_研修申込', '照合会員ID', 'T_会員'],
  ['T_研修申込', '照合職員ID', 'T_事業所職員'],
  ['T_メール送信明細', 'ログID', 'T_メール送信ログ'],
  ['T_メール送信明細', '研修ID', 'T_研修'],
  ['T_年会費納入履歴', '会員ID', 'T_会員'],
  ['T_年会費更新履歴', '年会費履歴ID', 'T_年会費納入履歴'],
  ['T_年会費更新履歴', '会員ID', 'T_会員'],
  ['T_役員', '会員ID', 'T_会員'],
  ['T_役員', '職員ID', 'T_事業所職員'],
  ['T_振込口座', '会員ID', 'T_会員'],
  ['T_振込口座', '職員ID', 'T_事業所職員'],
  ['T_支払い', '会員ID', 'T_会員'],
  ['T_支払い', '職員ID', 'T_事業所職員'],
  ['T_支払い明細', '支払いID', 'T_支払い'],
  ['T_支払い明細', '請求ID', 'T_請求'],
  ['T_請求', '会員ID', 'T_会員'],
  ['T_請求', '職員ID', 'T_事業所職員'],
  ['T_ログイン履歴', '認証ID', 'T_認証アカウント'],
  ['T_変更申請', '会員ID', 'T_会員'],
  ['T_管理者Googleホワイトリスト', 'ロールID', 'T_権限ロール'],
  ['T_メール送信ログ', '研修ID', 'T_研修'],
];

// ログ系はログ用スプレッドシートにある（getLogSs_ の書き込み先）
var DB_STATE_LOG_TABLES_ = ['T_監査ログ', 'T_ログイン履歴', 'T_メール送信ログ', 'T_メール送信明細'];

// ── 2026-10-31 docs/317 P: Sheets API batchUpdate の実地確認 ─────────────────────────────
// 会員移行を「全部か無しか」で書く方式の採否を決めるため、一時スプレッドシートだけを使って
// 原子性・列単位更新・行追加・型・書式・入力規則・数式・規模・権限を確かめる。
// 本番 DB は開かない。データは合成（★・@example.invalid）だけ。最後に一時ファイルをゴミ箱へ移す。
// 出力は判定と型・件数・時間だけ（セルの値は合成データでも出さない）。
var SHEETS_PROBE_FILE_PREFIX_ = '★E2E移行検証_';

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

// Sheets API spreadsheets.batchUpdate を 1 回呼ぶ。例外にせず、状態コードと所要時間を返す。
function sheetsApiBatchUpdate_(spreadsheetId, requests) {
  var started = Date.now();
  var body = JSON.stringify({ requests: requests });
  var res = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(spreadsheetId) + ':batchUpdate', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: body,
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  var parsed = null;
  try { parsed = JSON.parse(res.getContentText() || 'null'); } catch (e) { parsed = null; }
  var errorStatus = parsed && parsed.error ? String(parsed.error.status || '') : '';
  return { ok: code >= 200 && code < 300, code: code, errorStatus: errorStatus, replies: parsed && parsed.replies ? parsed.replies.length : 0, bytes: body.length, ms: Date.now() - started };
}

function sheetsApiCellValue_(v) {
  if (v === true || v === false) return { userEnteredValue: { boolValue: v } };
  if (typeof v === 'number') return { userEnteredValue: { numberValue: v } };
  return { userEnteredValue: { stringValue: String(v == null ? '' : v) } };
}

// 1 セルだけを書く（列単位更新。書式・入力規則には触れない）
function sheetsApiUpdateCellRequest_(sheetId, rowNumber, columnNumber, value) {
  return { updateCells: {
    start: { sheetId: sheetId, rowIndex: rowNumber - 1, columnIndex: columnNumber - 1 },
    rows: [{ values: [sheetsApiCellValue_(value)] }],
    fields: 'userEnteredValue',
  } };
}

// シートの見出し順で 1 行を足す。書式なしテキストの列（TEXT_FORMAT_COLUMNS_）は追加行にもテキスト書式を付ける
function sheetsApiAppendRowRequest_(sheet, tableName, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var textCols = TEXT_FORMAT_COLUMNS_[tableName] || [];
  var values = headers.map(function(h) {
    var key = String(h);
    var cell = sheetsApiCellValue_(obj[key] !== undefined ? obj[key] : '');
    if (textCols.indexOf(key) >= 0) cell.userEnteredFormat = { numberFormat: { type: 'TEXT' } };
    return cell;
  });
  return { appendCells: { sheetId: sheet.getSheetId(), rows: [{ values: values }], fields: 'userEnteredValue,userEnteredFormat.numberFormat' } };
}

// 見出し名からセル位置（1 始まり）を引く
function probeCell_(sheet, rowNumber, header) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var col = headers.indexOf(header) + 1;
  if (col < 1) throw new Error(sheet.getName() + ' に列「' + header + '」がありません。');
  return { row: rowNumber, col: col, key: sheet.getName() + '|' + header + '|' + rowNumber };
}

// 前後のスナップショットで、変わった既存セル（"シート|見出し|行"）と増えた行数を返す
function probeChangedCells_(before, after) {
  var changed = [];
  var appended = {};
  Object.keys(after).forEach(function(name) {
    var a = after[name];
    var b = before[name] || { headers: a.headers, rows: [] };
    if (a.rows.length !== b.rows.length) appended[name] = a.rows.length - b.rows.length;
    var n = Math.min(a.rows.length, b.rows.length);
    for (var r = 0; r < n; r += 1) {
      for (var c = 0; c < a.headers.length; c += 1) {
        var bv = b.rows[r][c] == null ? '' : b.rows[r][c];
        var av = a.rows[r][c] == null ? '' : a.rows[r][c];
        if (bv !== av) changed.push(name + '|' + a.headers[c] + '|' + (r + 2));
      }
    }
  });
  return { changed: changed.sort(), appended: appended };
}

function probeSameList_(a, b) {
  return a.slice().sort().join('\u0001') === b.slice().sort().join('\u0001');
}

function probeTypeOf_(v) {
  if (v === '' || v === null || v === undefined) return 'empty';
  if (Object.prototype.toString.call(v) === '[object Date]') return 'date';
  return typeof v;
}

// Sheets API で表を読む（includeGridData）。値・書式・入力規則・数式を、SpreadsheetApp を通さずに得る。
// 2026-10-31 実測: API で書いた直後に同じ実行の SpreadsheetApp で読むと、古い内容が返った（P0）。
// 書いた結果の確認は API から読む。
function sheetsApiGetGrid_(spreadsheetId) {
  var fields = 'sheets(properties(title,sheetId),data(rowData(values(userEnteredValue,effectiveValue,'
    + 'userEnteredFormat(numberFormat),effectiveFormat(numberFormat),dataValidation(condition(type))))))';
  var res = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(spreadsheetId)
    + '?includeGridData=true&fields=' + encodeURIComponent(fields), {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Sheets API の読取に失敗しました（' + code + '）。');
  return JSON.parse(res.getContentText() || '{}');
}

// セルを型付きの文字列にする（rehearsalCellKey_ と同じ表記: '0123' と 123、日付と日付に見える文字列を区別する）
function probeApiCellKey_(cell) {
  var ev = cell && cell.effectiveValue;
  if (!ev) return '';
  if (Object.prototype.hasOwnProperty.call(ev, 'boolValue')) return 'boolean:' + String(ev.boolValue);
  if (Object.prototype.hasOwnProperty.call(ev, 'stringValue')) return ev.stringValue === '' ? '' : 'string:' + ev.stringValue;
  if (Object.prototype.hasOwnProperty.call(ev, 'numberValue')) {
    var fmt = (cell.userEnteredFormat && cell.userEnteredFormat.numberFormat) || (cell.effectiveFormat && cell.effectiveFormat.numberFormat) || {};
    var type = String(fmt.type || '');
    return (type === 'DATE' || type === 'DATE_TIME' ? 'date:' : 'number:') + String(ev.numberValue);
  }
  return '';
}

// API から全シートのスナップショット。rows は見出しを除き、末尾の空行は落とす。
// meta[行][列] は { text: 書式なしテキストか, rule: 入力規則があるか, formula: 数式か }
function probeSnapshotViaApi_(spreadsheetId) {
  var grid = sheetsApiGetGrid_(spreadsheetId);
  var snap = {};
  (grid.sheets || []).forEach(function(sheet) {
    var rowData = (sheet.data && sheet.data[0] && sheet.data[0].rowData) || [];
    var headerCells = (rowData[0] && rowData[0].values) || [];
    var headers = headerCells.map(function(c) { return String((c && c.effectiveValue && c.effectiveValue.stringValue) || ''); });
    while (headers.length && headers[headers.length - 1] === '') headers.pop();
    var rows = [];
    var meta = [];
    for (var r = 1; r < rowData.length; r += 1) {
      var values = (rowData[r] && rowData[r].values) || [];
      var row = [];
      var m = [];
      for (var c = 0; c < headers.length; c += 1) {
        var cell = values[c] || {};
        row.push(probeApiCellKey_(cell));
        var uf = cell.userEnteredFormat && cell.userEnteredFormat.numberFormat;
        m.push({ text: !!uf && uf.type === 'TEXT', rule: !!cell.dataValidation, formula: !!(cell.userEnteredValue && cell.userEnteredValue.formulaValue) });
      }
      rows.push(row);
      meta.push(m);
    }
    while (rows.length && rows[rows.length - 1].every(function(v) { return v === ''; })) { rows.pop(); meta.pop(); }
    snap[sheet.properties.title] = { headers: headers, rows: rows, meta: meta };
  });
  return snap;
}

// スナップショットで、列 idHeader が id の行の番号（0 始まり・見出しを除く）
function probeRowIndexById_(table, idHeader, id) {
  var c = table.headers.indexOf(idHeader);
  for (var r = 0; r < table.rows.length; r += 1) if (table.rows[r][c] === 'string:' + id) return r;
  return -1;
}

function runSheetsBatchUpdateProbes_(temp, report) {
  var add = function(id, passed, detail) { report.checks.push({ id: id, passed: !!passed, detail: detail }); };
  var now = new Date().toISOString();
  // 更新で書く日時は準備の日時と変える（同じ値だと「変わったセル」に現れず、書けたかを確かめられない）
  var later = new Date(Date.now() + 60000).toISOString();
  var id = temp.getId();

  // ── 準備（SpreadsheetApp）: API で書く前に全部済ませる。API で書いた後は SpreadsheetApp で書かない ──
  var tables = ['T_会員', 'T_事業所職員', 'T_人物統合ログ'];
  var first = temp.getSheets()[0];
  first.setName(tables[0]);
  tables.forEach(function(name, i) {
    var sheet = i === 0 ? first : temp.insertSheet(name);
    writeSheetHeaders_(sheet, テーブル定義[name]);
  });
  applyTextColumnFormats_(temp);
  var memberSheet = temp.getSheetByName('T_会員');
  var staffSheet = temp.getSheetByName('T_事業所職員');
  var logSheet = temp.getSheetByName('T_人物統合ログ');
  var member = function(memberId, type, cm) {
    return { 会員ID: memberId, 会員種別コード: type, 会員状態コード: 'ACTIVE', 入会日: '2020-04-01', 姓: '★試験', 名: memberId,
      代表メールアドレス: memberId.toLowerCase() + '@example.invalid', 介護支援専門員番号: cm, 作成日時: now, 更新日時: now, 削除フラグ: false };
  };
  // P5 の比較に使う値（既存の書き方 appendRowsByHeaders_ で S8、一括更新で S9 を同じ値で書く）
  var sample = { 介護支援専門員番号: '00123456', 入会日: '2026-10-31', 更新日時: '2026-10-31T01:02:03.000Z', 削除フラグ: true, 退会日: '' };
  var staffRow = function(staffId, extra) {
    var o = { 職員ID: staffId, 会員ID: 'B1', 姓: '★試験', 名: staffId, 職員権限コード: 'STAFF', 職員状態コード: 'ENROLLED',
      入会日: '2021-04-01', 介護支援専門員番号: '03456789', 作成日時: now, 更新日時: now, 削除フラグ: false };
    Object.keys(extra || {}).forEach(function(k) { o[k] = extra[k]; });
    return o;
  };
  appendRowsByHeaders_(temp, 'T_会員', [member('M1', 'INDIVIDUAL', '01234567'), member('M2', 'INDIVIDUAL', '02345678'), member('B1', 'BUSINESS', '')]);
  appendRowsByHeaders_(temp, 'T_事業所職員', [staffRow('S1'), staffRow('S2', { 職員権限コード: 'REPRESENTATIVE', 介護支援専門員番号: '04567890' }), staffRow('S8', sample)]);
  var statusCol = probeCell_(memberSheet, 2, '会員状態コード').col;
  memberSheet.getRange(2, statusCol, 3, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['ACTIVE', 'WITHDRAWN', 'TRANSFERRED'], true).build());
  var formulaCell = probeCell_(memberSheet, 2, 'メイ');
  memberSheet.getRange(formulaCell.row, formulaCell.col).setFormula('="★"&"式"');
  // P8 の規模（本番の約 8 倍）。番号の行（2〜4 行目・2〜4 行目）より後ろに置く
  var scaleRows = 2000;
  var mHeaders = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn()).getValues()[0].map(String);
  var sHeaders = staffSheet.getRange(1, 1, 1, staffSheet.getLastColumn()).getValues()[0].map(String);
  var bulk = function(headers, prefix) {
    var rows = [];
    for (var i = 0; i < scaleRows; i += 1) {
      rows.push(headers.map(function(h) {
        if (h === '会員ID' || h === '職員ID') return prefix + i;
        if (h === '姓') return '★規模';
        if (h === '削除フラグ') return false;
        return '';
      }));
    }
    return rows;
  };
  memberSheet.getRange(memberSheet.getLastRow() + 1, 1, scaleRows, mHeaders.length).setValues(bulk(mHeaders, 'MX'));
  staffSheet.getRange(staffSheet.getLastRow() + 1, 1, scaleRows, sHeaders.length).setValues(bulk(sHeaders, 'SX'));
  SpreadsheetApp.flush();

  var logRow = function(logId) {
    return { ログID: logId, 処理種別: 'PROBE', 介護支援専門員番号: '01234567', 旧会員ID: 'M1', 新会員ID: 'B1', 結果コード: 'OK', 実行日時: now, 作成日時: now, 削除フラグ: false };
  };

  // ── P10・P1・P9: 複数表の更新と操作記録を 1 回で ──
  var p1Cells = [
    [memberSheet, probeCell_(memberSheet, 2, '会員状態コード'), 'TRANSFERRED'],
    [memberSheet, probeCell_(memberSheet, 2, '移行日'), '2026-10-31'],
    [memberSheet, probeCell_(memberSheet, 2, '更新日時'), later],
    [staffSheet, probeCell_(staffSheet, 2, '職員状態コード'), 'LEFT'],
    [staffSheet, probeCell_(staffSheet, 2, '削除フラグ'), true],
  ];
  var before1 = probeSnapshotViaApi_(id);
  var res1 = sheetsApiBatchUpdate_(id, p1Cells.map(function(x) {
    return sheetsApiUpdateCellRequest_(x[0].getSheetId(), x[1].row, x[1].col, x[2]);
  }).concat([sheetsApiAppendRowRequest_(logSheet, 'T_人物統合ログ', logRow('OP-P1'))]));
  add('P10', res1.ok, { code: res1.code, errorStatus: res1.errorStatus, note: 'admin の実行ユーザー・既存スコープで呼べるか' });
  if (!res1.ok) return; // API が使えなければ以降は確かめられない
  var after1 = probeSnapshotViaApi_(id);
  var diff1 = probeChangedCells_(before1, after1);
  var expected1 = p1Cells.map(function(x) { return x[1].key; });
  add('P1', probeSameList_(diff1.changed, expected1) && diff1.appended['T_人物統合ログ'] === 1 && res1.replies === p1Cells.length + 1,
    { changedCells: diff1.changed.length, expectedCells: expected1.length, appended: diff1.appended, replies: res1.replies, ms: res1.ms, bytes: res1.bytes });

  // ── P0（観察）: API で書いた直後の SpreadsheetApp の読み。合否には入れない（実装の前提として記録する） ──
  var statusKey = 'string:TRANSFERRED';
  var viaSameObject = 'string:' + String(memberSheet.getRange(2, statusCol).getValue());
  report.observations = report.observations || {};
  report.observations.P0 = {
    note: 'API で書いた後に同じ実行の SpreadsheetApp で読んだ値が、API で読んだ値と一致するか',
    sameObjectSeesWrite: viaSameObject === statusKey,
    apiSeesWrite: after1['T_会員'].rows[0][after1['T_会員'].headers.indexOf('会員状態コード')] === statusKey,
  };

  // ── P2・P9: 失敗する要求を混ぜたら何も反映されない（操作記録も残らない） ──
  var m2 = probeCell_(memberSheet, 3, '会員状態コード');
  var res2 = sheetsApiBatchUpdate_(id, [
    sheetsApiUpdateCellRequest_(memberSheet.getSheetId(), m2.row, m2.col, 'WITHDRAWN'),
    sheetsApiAppendRowRequest_(logSheet, 'T_人物統合ログ', logRow('OP-P2')),
    sheetsApiUpdateCellRequest_(987654321, 2, 1, 'x'), // 存在しないシート → 必ず失敗する
  ]);
  var after2 = probeSnapshotViaApi_(id);
  var diff2 = probeChangedCells_(after1, after2);
  add('P2', !res2.ok && diff2.changed.length === 0 && Object.keys(diff2.appended).length === 0,
    { code: res2.code, errorStatus: res2.errorStatus, changedCells: diff2.changed.length, appended: diff2.appended });
  add('P9', diff1.appended['T_人物統合ログ'] === 1 && !diff2.appended['T_人物統合ログ'],
    { note: '本体が反映されたときだけ操作記録がある', appendedOnSuccess: diff1.appended['T_人物統合ログ'] || 0, appendedOnFailure: diff2.appended['T_人物統合ログ'] || 0 });

  // ── P3: 既存行の更新と、同じ表への 2 行追加を同じ要求で ──
  var m2Leave = probeCell_(memberSheet, 3, '退会日');
  var res3 = sheetsApiBatchUpdate_(id, [
    sheetsApiUpdateCellRequest_(memberSheet.getSheetId(), m2Leave.row, m2Leave.col, '2026-10-31'),
    sheetsApiAppendRowRequest_(memberSheet, 'T_会員', member('M9', 'INDIVIDUAL', '00012345')),
    sheetsApiAppendRowRequest_(memberSheet, 'T_会員', member('M10', 'INDIVIDUAL', '00067890')),
  ]);
  var after3 = probeSnapshotViaApi_(id);
  var diff3 = probeChangedCells_(after2, after3);
  var members3 = after3['T_会員'];
  var idCol = members3.headers.indexOf('会員ID');
  var appendedIds = members3.rows.slice(after2['T_会員'].rows.length).map(function(r) { return r[idCol]; });
  var inOrder = appendedIds.join(',') === 'string:M9,string:M10';
  add('P3', res3.ok && probeSameList_(diff3.changed, [m2Leave.key]) && diff3.appended['T_会員'] === 2 && inOrder,
    { code: res3.code, changedCells: diff3.changed.length, appended: diff3.appended, appendedInOrder: inOrder });

  // ── P4: P1・P3 で対象外のセル（同じ行の他列・他人の行）が 1 つも変わっていない ──
  add('P4', probeSameList_(diff1.changed, expected1) && probeSameList_(diff3.changed, [m2Leave.key]),
    { unexpectedInP1: diff1.changed.filter(function(k) { return expected1.indexOf(k) < 0; }).length,
      unexpectedInP3: diff3.changed.filter(function(k) { return k !== m2Leave.key; }).length });

  // ── P5: 型。既存の書き方（S8・appendRowsByHeaders_）と一括更新（S9）で、読んだ型が同じか ──
  var res5 = sheetsApiBatchUpdate_(id, [sheetsApiAppendRowRequest_(staffSheet, 'T_事業所職員', staffRow('S9', sample))]);
  var staff5 = probeSnapshotViaApi_(id)['T_事業所職員'];
  var r8 = probeRowIndexById_(staff5, '職員ID', 'S8');
  var r9 = probeRowIndexById_(staff5, '職員ID', 'S9');
  var typeRows = Object.keys(sample).map(function(k) {
    var c = staff5.headers.indexOf(k);
    var a = r8 >= 0 ? staff5.rows[r8][c] : 'missing';
    var b = r9 >= 0 ? staff5.rows[r9][c] : 'missing';
    return { column: k, existingWriter: String(a).split(':')[0] || 'empty', batch: String(b).split(':')[0] || 'empty', same: a === b };
  });
  add('P5', res5.ok && r8 >= 0 && r9 >= 0 && typeRows.every(function(t) { return t.same; }),
    { types: typeRows, note: '同じでない列は、読む側が文字列と日付のどちらを前提にしているかで扱いを決める' });

  // ── P6: 入力規則と書式なしテキスト（追加行） ──
  var cmCol = members3.headers.indexOf('介護支援専門員番号');
  var m9 = probeRowIndexById_(members3, '会員ID', 'M9');
  var ruleKept = !!(members3.meta[0][statusCol - 1].rule && members3.meta[1][statusCol - 1].rule);
  var m9Text = m9 >= 0 && members3.meta[m9][cmCol].text;
  var m9Value = m9 >= 0 ? members3.rows[m9][cmCol] : '';
  add('P6', ruleKept && m9Text && m9Value === 'string:00012345',
    { validationKept: ruleKept, appendedTextFormat: !!m9Text, leadingZeroKept: m9Value === 'string:00012345' });

  // ── P7: 同じ行の数式セル ──
  add('P7', !!members3.meta[formulaCell.row - 2][formulaCell.col - 1].formula, { formulaKept: !!members3.meta[formulaCell.row - 2][formulaCell.col - 1].formula });

  // ── P8: 規模と時間（読取と 1 回の移行分の要求） ──
  var readStarted = Date.now();
  getRowsAsObjects_(temp, 'T_会員');
  getRowsAsObjects_(temp, 'T_事業所職員');
  var readMs = Date.now() - readStarted;
  var scaleRequests = [];
  for (var u = 0; u < 40; u += 1) {
    var sheetU = u % 2 ? memberSheet : staffSheet;
    var target = probeCell_(sheetU, 10 + u, '更新日時');
    scaleRequests.push(sheetsApiUpdateCellRequest_(sheetU.getSheetId(), target.row, target.col, later));
  }
  scaleRequests.push(sheetsApiAppendRowRequest_(memberSheet, 'T_会員', member('M11', 'INDIVIDUAL', '00011111')));
  scaleRequests.push(sheetsApiAppendRowRequest_(staffSheet, 'T_事業所職員', staffRow('S11')));
  scaleRequests.push(sheetsApiAppendRowRequest_(logSheet, 'T_人物統合ログ', logRow('OP-P8')));
  var res8 = sheetsApiBatchUpdate_(id, scaleRequests);
  add('P8', res8.ok && res8.ms < 30000 && res8.bytes < 1000000,
    { rowsPerTable: scaleRows, requests: scaleRequests.length, bytes: res8.bytes, batchMs: res8.ms, readTwoTablesMs: readMs, code: res8.code });
}

// 2026-10-19: DB の今の状態を数えるだけの診断（読むだけ・書き込みなし・監査ログにも書かない）。
// シートごとの行数・削除済み・定義との差（planTableColumnNormalization_ の方針）と、ID 参照の孤児の件数。
// セルの値は返さない（件数と列名だけ）。
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

function dbStateIndex_(snap) {
  var idx = {};
  if (snap) snap.headers.forEach(function(h, i) { if (h && idx[h] == null) idx[h] = i; });
  return idx;
}

function dbStateTime_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  var t = Object.prototype.toString.call(v) === '[object Date]' ? v.getTime() : new Date(String(v)).getTime();
  return isNaN(t) ? 0 : t;
}

// 削除済みの会員・職員に結び付いたまま、削除されていない認証アカウント。有効なものはログインできる
function countAuthOfDeletedPeople_(auth, members, staff) {
  if (!auth || !members || !staff) return { skipped: 'シートが無い' };
  var a = dbStateIndex_(auth), m = dbStateIndex_(members), s = dbStateIndex_(staff);
  var deletedMember = {}, deletedStaff = {};
  members.rows.forEach(function(r) { if (toBoolean_(r[m['削除フラグ']])) deletedMember[String(r[m['会員ID']])] = true; });
  staff.rows.forEach(function(r) { if (toBoolean_(r[s['削除フラグ']])) deletedStaff[String(r[s['職員ID']])] = true; });
  var out = { total: 0, enabled: 0, disabled: 0, locked: 0 };
  auth.rows.forEach(function(r) {
    if (toBoolean_(r[a['削除フラグ']])) return;
    var mid = String(r[a['会員ID']] || ''), sid = String(r[a['職員ID']] || '');
    if (!(deletedMember[mid] || (sid && deletedStaff[sid]))) return;
    out.total += 1;
    if (toBoolean_(r[a['アカウント有効フラグ']])) out.enabled += 1; else out.disabled += 1;
    if (toBoolean_(r[a['ロック状態']])) out.locked += 1;
  });
  return out;
}

// 2026-11-01: 先頭の 0 が消えて 8 桁未満になった会員ID（docs/317 §9.3 E7b-2）。件数だけ返す。
// - loginIsZeroPadded: 認証アカウントのログインIDが 0 を補った 8 桁のまま（ログインIDの列は文字列）＝会員IDと食い違う
// - references: 会員ID を持つ表で、0 を補った 8 桁の文字列で持っている行（数値の会員IDと一致しない）
function countShortMemberIds_(members, auth, refs) {
  if (!members) return { skipped: 'シートが無い' };
  var m = dbStateIndex_(members);
  var out = { total: 0, numericCell: 0, byType: {}, byStatus: {}, deleted: 0, auth: 0, loginIsMemberId: 0, loginIsZeroPadded: 0, references: [] };
  var shortIds = {};
  members.rows.forEach(function(r) {
    var raw = r[m['会員ID']];
    var id = String(raw == null ? '' : raw).trim();
    if (!id || id.length >= 8) return;
    shortIds[id] = true;
    out.total += 1;
    if (typeof raw === 'number') out.numericCell += 1;
    var type = String(r[m['会員種別コード']] || '');
    var status = String(r[m['会員状態コード']] || '');
    out.byType[type] = (out.byType[type] || 0) + 1;
    out.byStatus[status] = (out.byStatus[status] || 0) + 1;
    if (toBoolean_(r[m['削除フラグ']])) out.deleted += 1;
  });
  var pad8 = function(id) { var t = id; while (t.length < 8) t = '0' + t; return t; };
  if (auth) {
    var a = dbStateIndex_(auth);
    auth.rows.forEach(function(r) {
      var mid = String(r[a['会員ID']] == null ? '' : r[a['会員ID']]).trim();
      if (!shortIds[mid] || toBoolean_(r[a['削除フラグ']])) return;
      out.auth += 1;
      var login = String(r[a['ログインID']] == null ? '' : r[a['ログインID']]).trim();
      if (login === mid) out.loginIsMemberId += 1;
      else if (login === pad8(mid)) out.loginIsZeroPadded += 1;
    });
  }
  var padded = {};
  Object.keys(shortIds).forEach(function(id) { padded[pad8(id)] = true; });
  (refs || []).forEach(function(ref) {
    var item = { table: ref.table, column: ref.column, shortId: 0, zeroPadded: 0 };
    if (!ref.snap) { item.skipped = 'シートが無い'; out.references.push(item); return; }
    var c = dbStateIndex_(ref.snap)[ref.column];
    if (c == null) { item.skipped = '列が無い'; out.references.push(item); return; }
    ref.snap.rows.forEach(function(r) {
      var v = String(r[c] == null ? '' : r[c]).trim();
      if (shortIds[v]) item.shortId += 1;
      else if (padded[v]) item.zeroPadded += 1;
    });
    out.references.push(item);
  });
  return out;
}

// _CREDENTIALS_TEMP（2026-03 移行時の認証情報台帳）に平文の初期パスワードが残っているか。
// 値は読むが返さない。台帳の日時より後にパスワードが変わっていない有効なアカウントを「まだ使えうる」と数える
function countCredentialsTempExposure_(ledger, auth) {
  if (!ledger) return { exists: false };
  var l = dbStateIndex_(ledger);
  var out = { exists: true, rows: ledger.rows.length, columns: ledger.headers.filter(function(h) { return h; }),
    withPlainPassword: 0, matchedAuth: 0, enabledAndUnchanged: 0, enabledAndChanged: 0, disabledOrDeleted: 0, neverLoggedIn: 0 };
  if (l['初期パスワード'] == null) return out;
  var a = dbStateIndex_(auth);
  var authById = {}, authByLogin = {};
  if (auth) auth.rows.forEach(function(r) {
    authById[String(r[a['認証ID']] || '')] = r;
    authByLogin[String(r[a['ログインID']] || '')] = r;
  });
  ledger.rows.forEach(function(r) {
    if (String(r[l['初期パスワード']] == null ? '' : r[l['初期パスワード']]) === '') return;
    out.withPlainPassword += 1;
    var row = (l['認証ID'] != null && authById[String(r[l['認証ID']] || '')]) || authByLogin[String(r[l['ログインID']] || '')];
    if (!row) return;
    out.matchedAuth += 1;
    if (toBoolean_(row[a['削除フラグ']]) || !toBoolean_(row[a['アカウント有効フラグ']])) { out.disabledOrDeleted += 1; return; }
    var issuedAt = Math.max(dbStateTime_(l['再発行日時'] != null ? r[l['再発行日時']] : ''), dbStateTime_(l['更新日時'] != null ? r[l['更新日時']] : ''));
    var changedAt = dbStateTime_(row[a['パスワード更新日時']]);
    if (changedAt && issuedAt && changedAt > issuedAt) out.enabledAndChanged += 1; else out.enabledAndUnchanged += 1;
    if (!dbStateTime_(row[a['最終ログイン日時']])) out.neverLoggedIn += 1;
  });
  return out;
}

function readSheetForDbState_(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol < 1) return { headers: [], rows: [] };
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h == null ? '' : h); });
  return { headers: headers, rows: lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [] };
}

// 整備後のコピーで、定義の全列を持つ行を 1 行書いて読み戻す（列のずれ・書けない列を見つける）。
// 書くのはコピーだけ。値は列名から作るので、どの列に入ったかが読み戻しで分かる。
function rehearseTableWriteRead_(copy) {
  var result = { checked: 0, failures: [] };
  // 数字だけの文字列の列（TEXT_FORMAT_COLUMNS_）は 0 始まりの数字を書き、先頭の 0 が残ることを見る
  ['T_研修申込', 'T_支払い', 'T_振込口座', 'T_会員'].forEach(function(tableName) {
    try {
      var headers = テーブル定義[tableName];
      var textColumns = TEXT_FORMAT_COLUMNS_[tableName] || [];
      var expected = function(h, i) { return textColumns.indexOf(h) >= 0 ? '0' + String(100000 + i) : '★rehearsal-' + i; };
      var row = {};
      headers.forEach(function(h, i) { row[h] = expected(h, i); });
      appendRowsByHeaders_(copy, tableName, [row]);
      var rows = getRowsAsObjects_(copy, tableName);
      var last = rows[rows.length - 1] || {};
      headers.forEach(function(h, i) {
        result.checked += 1;
        if (String(last[h]) !== expected(h, i)) result.failures.push(tableName + '.' + h);
      });
    } catch (e) {
      result.failures.push(tableName + ': ' + (e && e.message ? e.message : String(e)));
    }
  });
  return result;
}

// ── 研修申込の会員ID/職員ID/申込者IDを移行する ──
// 照合会員ID・照合職員ID（外部申込を会員と突き合わせた結果）は申込時点の記録なので付け替えない
// （2026-10-31 operator 決定・docs/316 B）。移行後に削除済みの職員IDを指していても誤りではない。
// 申込者IDは常に会員IDと一致させる（getTrainingApplicationIntegrityIssues_ の不変条件）。
// 更新対象: 削除フラグ=false のレコードのみ。
// tx（省略可）: 渡せば予約だけ（会員移行の一括更新）。戻り値は付け替えた行数
function migrateTrainingApplications_(ss, oldMemberId, oldStaffId, newMemberId, newStaffId, tx) {
  var appSheet = ss.getSheetByName('T_研修申込');
  if (!appSheet || appSheet.getLastRow() < 2) return 0;
  var headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['会員ID'] == null) return 0;

  var data = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  var updated = 0;
  for (var r = 0; r < data.length; r++) {
    // 削除済みは触らない
    if (toBoolean_(data[r][cols['削除フラグ']])) continue;
    var appMemberId = String(data[r][cols['会員ID']] || '');
    var appStaffId = cols['職員ID'] != null ? String(data[r][cols['職員ID']] || '') : '';
    var match = false;
    if (oldStaffId) {
      // 職員IDで一致判定（事業所職員→個人変換の場合）
      match = appStaffId === oldStaffId && appMemberId === oldMemberId;
    } else {
      // 会員IDで一致判定（個人→事業所職員変換の場合）
      match = appMemberId === oldMemberId && !appStaffId;
    }
    if (match) {
      var originalRow = data[r].slice();
      data[r][cols['会員ID']] = newMemberId;
      if (cols['申込者ID'] != null) data[r][cols['申込者ID']] = newMemberId; // 申込者IDを会員IDと同期
      if (cols['職員ID'] != null) data[r][cols['職員ID']] = newStaffId;
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      if (tx) txUpdateRow_(tx, 'T_研修申込', r + 2, originalRow, data[r]);
      else appSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      updated += 1;
    }
  }
  return updated;
}

// ── 事業所職員の重複在籍レコード修復 (MASTER専用) ──────────────────
// 同一介護支援専門員番号 × 同一事業所で ENROLLED 件数 > 1 の場合、
// 作成日時が古いレコードを LEFT + 削除フラグ = true に設定する。
function repairDuplicateStaffRecords_() {
  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var staffSheet = ss.getSheetByName('T_事業所職員');
    if (!staffSheet || staffSheet.getLastRow() < 2) return { repaired: 0 };

    var headers = staffSheet.getRange(1, 1, 1, staffSheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;

    var data = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues();
    var now = new Date().toISOString();
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

    // グループ化: key = 事業所会員ID + '|' + 介護支援専門員番号
    var groups = {};
    for (var r = 0; r < data.length; r++) {
      var deleted = toBoolean_(data[r][cols['削除フラグ']]);
      var state = String(data[r][cols['職員状態コード']] || '');
      var cmNum = String(data[r][cols['介護支援専門員番号']] || '').trim();
      var officeId = String(data[r][cols['会員ID']] || '');
      if (deleted || state !== 'ENROLLED' || !cmNum || !officeId) continue;

      var key = officeId + '|' + cmNum;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ rowIndex: r, createdAt: String(data[r][cols['作成日時']] || '') });
    }

    var repairedCount = 0;
    Object.keys(groups).forEach(function(key) {
      var group = groups[key];
      if (group.length <= 1) return;

      // 作成日時昇順ソート → 最新1件以外を LEFT + 削除フラグ = true
      group.sort(function(a, b) { return a.createdAt < b.createdAt ? -1 : 1; });
      for (var i = 0; i < group.length - 1; i++) {
        var ri = group[i].rowIndex;
        if (cols['職員状態コード'] != null) data[ri][cols['職員状態コード']] = 'LEFT';
        if (cols['退会日'] != null) data[ri][cols['退会日']] = today;
        if (cols['削除フラグ'] != null) data[ri][cols['削除フラグ']] = true;
        if (cols['更新日時'] != null) data[ri][cols['更新日時']] = now;
        staffSheet.getRange(ri + 2, 1, 1, data[ri].length).setValues([data[ri]]);
        repairedCount++;
      }
    });

    clearAllDataCache_();
    return { repaired: repairedCount };
  } finally {
    lock.releaseLock();
  }
}

// ── 会員CM番号重複（同一CM番号の複数アクティブ個人/賛助会員）を修復する (MASTER専用) ──
// 同一CM番号に ACTIVE/WITHDRAWAL_SCHEDULED の個人・賛助会員が複数存在する場合、
// 入会日が最も新しい1件を残し、残りを TRANSFERRED + 移行日=本日 に更新する。
// 削除フラグ=true のレコードは一切触れない。
function repairMemberCareManagerDuplicates_() {
  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var memberSheet = ss.getSheetByName('T_会員');
    if (!memberSheet || memberSheet.getLastRow() < 2) return { repaired: 0, details: [] };

    var headers = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;

    var data = memberSheet.getRange(2, 1, memberSheet.getLastRow() - 1, memberSheet.getLastColumn()).getValues();
    var now = new Date().toISOString();
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

    // グループ化: key = CM番号、value = {rowIndex, joinedDate, memberId}[]
    var groups = {};
    for (var r = 0; r < data.length; r++) {
      var deleted = toBoolean_(data[r][cols['削除フラグ']]);
      var typeCode = String(data[r][cols['会員種別コード']] || '');
      var statusCode = String(data[r][cols['会員状態コード']] || '');
      var cmNum = String(data[r][cols['介護支援専門員番号']] || '').trim();
      if (deleted || typeCode === 'BUSINESS' || statusCode === 'WITHDRAWN' || !cmNum) continue;
      if (!groups[cmNum]) groups[cmNum] = [];
      groups[cmNum].push({
        rowIndex: r,
        joinedDate: String(data[r][cols['入会日']] || ''),
        memberId: String(data[r][cols['会員ID']] || ''),
      });
    }

    var repairedCount = 0;
    var details = [];
    Object.keys(groups).forEach(function(cmNum) {
      var group = groups[cmNum];
      if (group.length <= 1) return;
      // 入会日降順ソート → 最も新しい1件（index 0）を残す
      group.sort(function(a, b) { return a.joinedDate > b.joinedDate ? -1 : 1; });
      for (var i = 1; i < group.length; i++) {
        var ri = group[i].rowIndex;
        if (cols['会員状態コード'] != null) data[ri][cols['会員状態コード']] = 'TRANSFERRED';
        if (cols['移行日'] != null) data[ri][cols['移行日']] = today;
        if (cols['更新日時'] != null) data[ri][cols['更新日時']] = now;
        memberSheet.getRange(ri + 2, 1, 1, data[ri].length).setValues([data[ri]]);
        var migrated = migratePersonOwnedReferences_(ss, {
          oldMemberId: group[i].memberId,
          oldStaffId: '',
          newMemberId: group[0].memberId,
          newStaffId: '',
          updatedAt: now,
        });
        appendPersonMergeLog_(ss, {
          action: 'REPAIR_MEMBER_CM_DUPLICATE',
          careManagerNumber: cmNum,
          oldMemberId: group[i].memberId,
          oldStaffId: '',
          newMemberId: group[0].memberId,
          newStaffId: '',
          details: { migrated: migrated },
          executedAt: now,
        });
        details.push({ memberId: group[i].memberId, careManagerNumber: cmNum });
        repairedCount++;
      }
    });

    clearAllDataCache_();
    clearAdminDashboardCache_();
    return { repaired: repairedCount, details: details };
  } finally {
    lock.releaseLock();
  }
}

// ── T_研修申込の申込者ID不整合を修復する (MASTER専用) ──────────────
// 申込者区分コード=MEMBER かつ 申込者ID ≠ 会員ID のレコードを対象に、
// 申込者ID を 会員ID に揃える（不変条件の回復）。
// 安全条件: 会員ID が T_会員 に存在するレコードのみ更新。削除フラグ=true は触らない。
function repairTrainingApplicationApplicantIds_() {
  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var appSheet = ss.getSheetByName('T_研修申込');
    if (!appSheet || appSheet.getLastRow() < 2) return { repaired: 0, skipped: 0 };

    var headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;

    if (cols['会員ID'] == null || cols['申込者ID'] == null || cols['申込者区分コード'] == null) {
      throw new Error('T_研修申込 に必要な列（会員ID / 申込者ID / 申込者区分コード）が見つかりません。');
    }

    // T_会員 の有効IDセットを構築（削除フラグ=false のみ）
    var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
      return !toBoolean_(r['削除フラグ']);
    });
    var validMemberIdSet = {};
    memberRows.forEach(function(r) {
      var mid = String(r['会員ID'] || '').trim();
      if (mid) validMemberIdSet[mid] = true;
    });

    var data = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
    var now = new Date().toISOString();
    var repairedCount = 0;
    var skippedCount = 0;

    for (var r = 0; r < data.length; r++) {
      // 削除済みは絶対に触らない
      if (toBoolean_(data[r][cols['削除フラグ']])) continue;

      var applicantType = String(data[r][cols['申込者区分コード']] || '').trim();
      // MEMBER 以外（EXTERNAL など）は対象外
      if (applicantType !== 'MEMBER') continue;

      var currentApplicantId = String(data[r][cols['申込者ID']] || '').trim();
      var memberId = String(data[r][cols['会員ID']] || '').trim();

      // 既に一致している場合はスキップ
      if (currentApplicantId === memberId) continue;

      // 会員ID が T_会員 に存在しない場合は安全のためスキップ（手動確認が必要）
      if (!memberId || !validMemberIdSet[memberId]) {
        skippedCount++;
        continue;
      }

      // 申込者ID を 会員ID に同期
      data[r][cols['申込者ID']] = memberId;
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      appSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      repairedCount++;
    }

    clearAllDataCache_();
    return { repaired: repairedCount, skipped: skippedCount };
  } finally {
    lock.releaseLock();
  }
}

function recalculateAllTrainingApplicantCounts_(ss) {
  var trainingSheet = ss.getSheetByName('T_研修');
  if (!trainingSheet) return { updated: 0, details: [] };

  var context = buildTrainingApplicationRelationContext_(ss);
  var appliedRows = getTrainingApplicationRows_(ss, { appliedOnly: true, context: context });
  var countMap = {};
  for (var i = 0; i < appliedRows.length; i += 1) {
    var trainingId = String(appliedRows[i]['研修ID'] || '');
    countMap[trainingId] = (countMap[trainingId] || 0) + 1;
  }

  var trainings = getRowsAsObjects_(ss, 'T_研修').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });
  var nowIso = new Date().toISOString();
  var updated = 0;
  var details = [];
  for (var t = 0; t < trainings.length; t += 1) {
    var training = trainings[t];
    var trainingId = String(training['研修ID'] || '');
    var nextCount = countMap[trainingId] || 0;
    var currentCount = Number(training['申込者数'] || 0);
    if (currentCount !== nextCount) {
      updateRowByKey_(trainingSheet, テーブル定義.T_研修, '研修ID', trainingId, {
        '申込者数': nextCount,
        '更新日時': nowIso,
      });
      updated += 1;
      details.push({ trainingId: trainingId, before: currentCount, after: nextCount });
    }
  }
  return { updated: updated, details: details };
}

function repairTrainingApplicationIntegrity_(ss) {
  var db = ss || getOrCreateDatabase_();
  var backfilled = backfillApplicationApplicantIdentity_(db);
  var sheet = db.getSheetByName('T_研修申込');
  if (!sheet || sheet.getLastRow() < 2) {
    return { backfilled: backfilled, invalidated: 0, details: [], applicantCounts: recalculateAllTrainingApplicantCounts_(db) };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIndex = {};
  for (var h = 0; h < headers.length; h += 1) {
    colIndex[headers[h]] = h;
  }

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var context = buildTrainingApplicationRelationContext_(db);
  var nowIso = new Date().toISOString();
  var invalidated = [];

  for (var r = 0; r < values.length; r += 1) {
    var rowObj = {};
    for (var c = 0; c < headers.length; c += 1) {
      rowObj[headers[c]] = values[r][c];
    }
    if (toBoolean_(rowObj['削除フラグ'])) continue;

    var issues = getTrainingApplicationIntegrityIssues_(rowObj, context);
    if (!issues.length) continue;

    var row = values[r].slice();
    if (colIndex['申込状態コード'] != null) row[colIndex['申込状態コード']] = 'CANCELED';
    if (colIndex['取消日時'] != null && !String(row[colIndex['取消日時']] || '').trim()) row[colIndex['取消日時']] = nowIso;
    if (colIndex['削除フラグ'] != null) row[colIndex['削除フラグ']] = true;
    if (colIndex['備考'] != null) {
      row[colIndex['備考']] = buildRepairNote_(row[colIndex['備考']], '[system-repair] 参照不整合のため自動無効化: ' + issues.join(', '));
    }
    if (colIndex['更新日時'] != null) row[colIndex['更新日時']] = nowIso;
    sheet.getRange(r + 2, 1, 1, row.length).setValues([row]);
    invalidated.push({
      applicationId: String(rowObj['申込ID'] || ''),
      trainingId: String(rowObj['研修ID'] || ''),
      issues: issues,
    });
  }

  return {
    backfilled: backfilled,
    invalidated: invalidated.length,
    details: invalidated,
    applicantCounts: recalculateAllTrainingApplicantCounts_(db),
  };
}

function repairTrainingApplicationIntegrity() {
  return repairTrainingApplicationIntegrity_();
}

function repairTrainingApplicationIntegrityJson() {
  return JSON.stringify(repairTrainingApplicationIntegrity());
}

function repairAdminSessionLoginHistory_(ss) {
  var db = getLogSs_(); // v259: ログSSを使用
  var sheet = db.getSheetByName('T_ログイン履歴');
  if (!sheet || sheet.getLastRow() < 2) return { repaired: 0, details: [] };

  var authMap = {};
  getRowsAsObjects_(db, 'T_認証アカウント').forEach(function(row) {
    if (!toBoolean_(row['削除フラグ'])) {
      authMap[String(row['認証ID'] || '')] = true;
    }
  });

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIndex = {};
  for (var i = 0; i < headers.length; i += 1) {
    colIndex[headers[i]] = i;
  }
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var repaired = [];

  for (var r = 0; r < values.length; r += 1) {
    var authId = String(values[r][colIndex['認証ID']] || '').trim();
    var authMethod = String(values[r][colIndex['認証方式']] || '').trim();
    var result = String(values[r][colIndex['ログイン結果']] || '').trim();
    var reason = String(values[r][colIndex['失敗理由']] || '').trim();
    if (!authId || authMap[authId]) continue;
    if (authMethod !== 'GOOGLE' || result !== 'FAILURE') continue;
    if (reason !== '紐付け認証ID未整備（セッション認証）') continue;

    values[r][colIndex['認証ID']] = '';
    sheet.getRange(r + 2, 1, 1, values[r].length).setValues([values[r]]);
    repaired.push(String(values[r][colIndex['ログイン履歴ID']] || ''));
  }

  return { repaired: repaired.length, details: repaired };
}

function repairAdminSessionLoginHistory() {
  return repairAdminSessionLoginHistory_();
}

function repairAdminSessionLoginHistoryJson() {
  return JSON.stringify(repairAdminSessionLoginHistory());
}

function repairKnownDataIntegrity() {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var ss = getOrCreateDatabase_();
    initializeSchemaIfNeeded_(ss);
    var whitelist = repairDefaultAdminWhitelistLinkage();
    var loginHistory = repairAdminSessionLoginHistory_(ss);
    var trainings = repairTrainingApplicationIntegrity_(ss);
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return {
      whitelist: whitelist,
      loginHistory: loginHistory,
      trainings: trainings,
    };
  } finally {
    lock.releaseLock();
  }
}

function repairKnownDataIntegrityJson() {
  return JSON.stringify(repairKnownDataIntegrity());
}

function auditCurrentIntegrityJson() {
  return JSON.stringify(verifyMigration_());
}

// ─── テストデータの物理削除（2026-10-11・docs/303） ─────────────────────────
// 印（★＋@example.invalid）の付いた会員・職員・外部申込者と、それに結び付く行を物理削除する。
// 論理削除やアーカイブ移動と違い、本番の表・*_archive・ログ用スプレッドシートから行ごと消える。
// 手順（エディタの ▶・MASTER のみ）:
//   1. previewTestDataPurge_LOG   対象と表ごとの件数を確認する。確認した内容を 30 分間記録する
//   2. executeTestDataPurge_APPLY 確認時と同じ内容のときだけ消す（データが変わっていたら止まる）
var TEST_DATA_PURGE_PLAN_KEY = 'TEST_DATA_PURGE_PLAN_V1';
var TEST_DATA_PURGE_PLAN_TTL_MS = 30 * 60 * 1000;

function readRowsWithArchive_(ss, tableName) {
  var rows = getRowsAsObjects_(ss, tableName);
  if (ss.getSheetByName(tableName + '_archive')) rows = rows.concat(getRowsAsObjects_(ss, tableName + '_archive'));
  return rows;
}

function idSetOf_(ids) {
  var set = {};
  for (var i = 0; i < ids.length; i++) if (ids[i]) set[String(ids[i])] = true;
  return set;
}

// 会員・職員の連動（getCascadeMatchers_）に、テストデータだけが持つ結び付きを足したもの。
function getTestDataPurgeMatchers_(memberIdSet, staffIdSet, paymentIdSet, externalIdSet) {
  return getCascadeMatchers_(memberIdSet, staffIdSet, paymentIdSet).map(function(pair) {
    var tableName = pair[0];
    var cascadeMatch = pair[1];
    if (tableName === 'T_研修申込') {
      return [tableName, function(row) { return cascadeMatch(row) || !!externalIdSet[String(row['外部申込者ID'] || '')]; }];
    }
    if (tableName === 'T_変更申請') {
      return [tableName, function(row) { return cascadeMatch(row) || isTestChangeRequestRow_(row); }];
    }
    return pair;
  }).concat([
    ['T_外部申込者', function(row) { return !!externalIdSet[String(row['外部申込者ID'] || '')]; }],
  ]);
}

// ログ系の表（T_削除ログ はメイン DB、ほかはログ用スプレッドシート）の消す条件。
function getTestDataPurgeLogMatchers_(memberIdSet, staffIdSet, externalIdSet) {
  var isPurgedPerson = function(id) { return !!memberIdSet[id] || !!staffIdSet[id]; };
  return {
    'T_メール送信明細': function(row) {
      var id = String(row['受信者ID'] || '');
      return isPurgedPerson(id) || !!externalIdSet[id];
    },
    // 対象会員IDリストは "member:<会員ID>,staff:<職員ID>"。すべてが消す相手のときだけ消す。
    'T_削除ログ': function(row) {
      var keys = String(row['対象会員IDリスト'] || '').split(',').map(function(k) { return k.trim(); }).filter(Boolean);
      if (keys.length === 0) return false;
      return keys.every(function(key) {
        var sep = key.indexOf(':');
        var kind = key.slice(0, sep);
        var id = key.slice(sep + 1);
        if (kind === 'member') return !!memberIdSet[id];
        if (kind === 'staff') return !!staffIdSet[id];
        return false;
      });
    },
    'T_人物統合ログ': function(row) {
      var ids = ['旧会員ID', '旧職員ID', '新会員ID', '新職員ID']
        .map(function(col) { return String(row[col] || ''); }).filter(Boolean);
      return ids.length > 0 && ids.every(isPurgedPerson);
    },
  };
}

// 請求の添付（[{ fileId, url, ... }] の JSON）からファイルIDを取り出す。
function parseClaimAttachmentFileIds_(value) {
  var text = String(value || '').trim();
  if (!text) return [];
  try {
    var parsed = JSON.parse(text);
    return (Array.isArray(parsed) ? parsed : [parsed])
      .map(function(a) { return a && a.fileId ? String(a.fileId) : ''; })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

function buildTestDataPurgePlan_(ss) {
  var blockers = [];
  var memberRows = readRowsWithArchive_(ss, 'T_会員');
  var staffRows = readRowsWithArchive_(ss, 'T_事業所職員');
  // 代表メールアドレスが空の事業所は、代表者の職員のメールで判定する（isTestMemberRow_）
  var representativeEmailByMemberId = {};
  staffRows.forEach(function(row) {
    if (String(row['職員権限コード'] || '') !== 'REPRESENTATIVE') return;
    var parentId = String(row['会員ID'] || '');
    if (parentId && !representativeEmailByMemberId[parentId]) representativeEmailByMemberId[parentId] = String(row['メールアドレス'] || '');
  });
  var memberIdSet = {};
  var memberTypeCounts = {};
  memberRows.forEach(function(row) {
    var id = String(row['会員ID'] || '');
    if (!id || memberIdSet[id] || !isTestMemberRow_(row, representativeEmailByMemberId[id])) return;
    memberIdSet[id] = true;
    var type = String(row['会員種別コード'] || '');
    memberTypeCounts[type] = (memberTypeCounts[type] || 0) + 1;
  });

  // テスト事業所の職員は、職員側の印が無くても事業所と一緒に消す。
  // 実在の事業所に属するテスト職員は職員だけを消す（代表者は単独では消さない）。
  var staffIdSet = {};
  var staffOnlyParents = {};
  staffRows.forEach(function(row) {
    var staffId = String(row['職員ID'] || '');
    var memberId = String(row['会員ID'] || '');
    if (!staffId) return;
    if (memberIdSet[memberId]) { staffIdSet[staffId] = true; return; }
    if (!isTestStaffRow_(row)) return;
    if (String(row['職員権限コード'] || '') === 'REPRESENTATIVE') {
      blockers.push('実在の事業所（会員ID ' + memberId + '）の代表者（職員ID ' + staffId + '）にテストの印があります。代表者は単独では削除できません。');
      return;
    }
    staffIdSet[staffId] = true;
    staffOnlyParents[memberId] = true;
  });

  var externalIdSet = {};
  getRowsAsObjects_(ss, 'T_外部申込者').forEach(function(row) {
    var id = String(row['外部申込者ID'] || '');
    if (id && isTestExternalApplicantRow_(row)) externalIdSet[id] = true;
  });

  var authIdSet = {};
  readRowsWithArchive_(ss, 'T_認証アカウント').forEach(function(row) {
    if (memberIdSet[String(row['会員ID'] || '')] || staffIdSet[String(row['職員ID'] || '')]) {
      var authId = String(row['認証ID'] || '');
      if (authId) authIdSet[authId] = true;
    }
  });
  var paymentIdSet = {};
  readRowsWithArchive_(ss, 'T_支払い').forEach(function(row) {
    if (memberIdSet[String(row['会員ID'] || '')] || staffIdSet[String(row['職員ID'] || '')]) {
      var paymentId = String(row['支払いID'] || '');
      if (paymentId) paymentIdSet[paymentId] = true;
    }
  });

  var matchers = getTestDataPurgeMatchers_(memberIdSet, staffIdSet, paymentIdSet, externalIdSet);
  var counts = {};
  var claimFileIds = [];
  matchers.forEach(function(pair) {
    var tableName = pair[0];
    var match = pair[1];
    var live = getRowsAsObjects_(ss, tableName).filter(match);
    counts[tableName] = live.length;
    var archive = [];
    if (ss.getSheetByName(tableName + '_archive')) {
      archive = getRowsAsObjects_(ss, tableName + '_archive').filter(match);
      counts[tableName + '_archive'] = archive.length;
    }
    if (tableName === 'T_研修申込') {
      // 申込中のまま消すと T_研修.申込者数 がずれるので、先に取り消してもらう。
      live.forEach(function(row) {
        if (!toBoolean_(row['削除フラグ']) && String(row['申込状態コード'] || '') === 'APPLIED') {
          blockers.push('研修（研修ID ' + String(row['研修ID'] || '') + '）に申込中のテストデータがあります（申込ID '
            + String(row['申込ID'] || '') + '）。先に申込を取り消してください。');
        }
      });
    }
    if (tableName === 'T_請求') {
      live.concat(archive).forEach(function(row) {
        claimFileIds = claimFileIds.concat(parseClaimAttachmentFileIds_(row['添付ファイルURL']));
      });
    }
  });

  var logMatchers = getTestDataPurgeLogMatchers_(memberIdSet, staffIdSet, externalIdSet);
  var logSs = getLogSs_();
  var countIn = function(book, tableName, match) {
    return book.getSheetByName(tableName) ? getRowsAsObjects_(book, tableName).filter(match).length : 0;
  };
  counts['T_ログイン履歴'] = countIn(logSs, 'T_ログイン履歴', function(row) { return !!authIdSet[String(row['認証ID'] || '')]; });
  counts['T_メール送信明細'] = countIn(logSs, 'T_メール送信明細', logMatchers['T_メール送信明細']);
  counts['T_削除ログ'] = countIn(ss, 'T_削除ログ', logMatchers['T_削除ログ']);
  counts['T_人物統合ログ'] = countIn(ss, 'T_人物統合ログ', logMatchers['T_人物統合ログ']);

  // 実在の事業所に残る、テスト職員に触れた変更申請（実在会員の記録なので消さない・知らせるだけ）
  var staffOnlyIds = Object.keys(staffIdSet).filter(function(id) { return !!id; });
  var remainingChangeRequests = 0;
  if (Object.keys(staffOnlyParents).length > 0) {
    getRowsAsObjects_(ss, 'T_変更申請').forEach(function(row) {
      if (!staffOnlyParents[String(row['会員ID'] || '')] || isTestChangeRequestRow_(row)) return;
      var body = String(row['申請内容JSON'] || '');
      if (staffOnlyIds.some(function(id) { return body.indexOf(id) !== -1; })) remainingChangeRequests += 1;
    });
  }

  var sorted = function(set) { return Object.keys(set).sort(); };
  var plan = {
    memberIds: sorted(memberIdSet),
    staffIds: sorted(staffIdSet),
    externalIds: sorted(externalIdSet),
    authIds: sorted(authIdSet),
    paymentIds: sorted(paymentIdSet),
    memberTypeCounts: memberTypeCounts,
    counts: counts,
    claimFileIds: claimFileIds.sort(),
    remainingChangeRequests: remainingChangeRequests,
    blockers: blockers,
  };
  plan.totalRows = Object.keys(counts).reduce(function(sum, key) { return sum + counts[key]; }, 0);
  plan.isEmpty = plan.totalRows === 0 && plan.claimFileIds.length === 0;
  plan.fingerprint = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify([
    plan.memberIds, plan.staffIds, plan.externalIds, plan.authIds, plan.paymentIds, plan.counts, plan.claimFileIds,
  ])));
  return plan;
}

function formatTestDataPurgePlan_(plan) {
  var lines = [];
  lines.push('対象: 会員 ' + plan.memberIds.length + ' 件 ' + JSON.stringify(plan.memberTypeCounts)
    + ' / 職員 ' + plan.staffIds.length + ' 件 / 外部申込者 ' + plan.externalIds.length + ' 件'
    + ' / 認証アカウント ' + plan.authIds.length + ' 件');
  Object.keys(plan.counts).forEach(function(key) {
    if (plan.counts[key] > 0) lines.push('  ' + key + ': ' + plan.counts[key] + ' 行');
  });
  lines.push('  Drive（請求の添付）: ' + plan.claimFileIds.length + ' ファイル');
  lines.push('合計 ' + plan.totalRows + ' 行');
  if (plan.remainingChangeRequests > 0) {
    lines.push('残るもの: 実在の事業所の変更申請のうち、テスト職員に触れたもの ' + plan.remainingChangeRequests
      + ' 件（実在会員の記録なので消さない）');
  }
  if (plan.blockers.length > 0) {
    lines.push('【削除できません】');
    plan.blockers.forEach(function(b) { lines.push('  - ' + b); });
  }
  return lines.join('\n');
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

function trashClaimAttachmentFiles_(ss, fileIds) {
  var result = { trashed: 0, skipped: 0 };
  if (!fileIds || fileIds.length === 0) return result;
  // 請求添付フォルダ内のファイルだけをゴミ箱へ移す（フォルダ外のファイルには触らない）。
  var folderId = String(getSystemSettingValue_(ss, 'CLAIM_ATTACHMENT_FOLDER_ID') || '').trim();
  fileIds.forEach(function(fileId) {
    try {
      var file = DriveApp.getFileById(fileId);
      var parents = file.getParents();
      var inFolder = false;
      while (parents.hasNext()) { if (parents.next().getId() === folderId) inFolder = true; }
      if (folderId && inFolder) { file.setTrashed(true); result.trashed += 1; } else { result.skipped += 1; }
    } catch (e) {
      result.skipped += 1;
    }
  });
  return result;
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

// ─── テスト研修の物理削除（2026-11-03・docs/319 §7） ─────────────────────────
// 会員用（previewTestDataPurge_LOG / executeTestDataPurge_APPLY）とは分けた研修専用の操作（2026-11-02 operator 決定）。
// 手順・照合は会員用と同じ 2 段（確認 _LOG → 30 分以内に同じ人が実行 _APPLY。データが変わっていたら止まる・2026-11-03 operator 決定）。
//   previewTrainingTestDataPurge_LOG / executeTrainingTestDataPurge_APPLY
//     印（研修名の先頭の★＋問い合わせメールが @example.invalid）の両方を確認できた研修だけ。
//   既存のデモ研修を消した一度きりの previewDemoTrainingPurge_LOG / executeDemoTrainingPurge_APPLY は、
//   2026-11-08 に本番で実行（研修 5・申込 8 行）したので撤去した（docs/319 §7.1）。
// 消すもの: 研修・その申込（_archive を含む）・印のある外部申込者のうち、ほかの申込から参照されていない人と、その人の送信明細。
// 残すもの: 会員・事業所・職員・認証・マスタ（触らない）、印の無い外部申込者（本人データ）、送信ログ・監査ログ（記録）、
//   LINE 投稿依頼、Drive の案内状・サムネイル（共有されうる）。残る件数は確認の画面に出す。
var TRAINING_PURGE_PLAN_KEY = 'TRAINING_PURGE_PLAN_V1';

// 研修のテストの印。研修名の先頭の★と、問い合わせメール（項目設定JSON・旧形式は parseTrainingOptions_ が読み替える）。
function isTestTrainingRow_(row) {
  return isTestDataName_(row['研修名']) && isTestDataEmail_(parseTrainingOptions_(row['項目設定JSON']).inquiryEmail);
}

function buildTrainingPurgePlan_(ss) {
  var blockers = [];
  var trainingRows = getRowsAsObjects_(ss, 'T_研修');
  var trainingIdSet = {};
  var trainings = [];
  trainingRows.forEach(function(row) {
    var id = String(row['研修ID'] || '').trim();
    if (!id) return;
    if (!isTestTrainingRow_(row)) return;
    trainingIdSet[id] = true;
    trainings.push({ id: id, title: String(row['研修名'] || ''), date: String(toJstYmd_(row['開催日']) || row['開催日'] || ''),
      created: String(toJstYmd_(row['作成日時']) || ''), deleted: toBoolean_(row['削除フラグ']) });
  });
  // 同じ研修IDの行が対象外にもあると、ID で消すときに巻き込む
  trainingRows.forEach(function(row) {
    var id = String(row['研修ID'] || '').trim();
    if (id && trainingIdSet[id] && !isTestTrainingRow_(row)) {
      blockers.push('研修ID ' + id + ' の行が対象外にもあります（同じ ID の行が複数）。');
    }
  });

  var externalById = {};
  getRowsAsObjects_(ss, 'T_外部申込者').forEach(function(row) {
    var id = String(row['外部申込者ID'] || '').trim();
    if (id) externalById[id] = row;
  });
  var targetExternalIds = {};
  var usedElsewhere = {};
  var applicationCount = 0;
  readRowsWithArchive_(ss, 'T_研修申込').forEach(function(row) {
    var trainingId = String(row['研修ID'] || '').trim();
    var externalId = String(row['外部申込者ID'] || '').trim();
    if (!trainingIdSet[trainingId]) {
      if (externalId) usedElsewhere[externalId] = true;
      return;
    }
    applicationCount += 1;
    var applicationId = String(row['申込ID'] || '');
    // 印のある研修に、会員・職員・印の無い人の申込があれば止める（実在の人の申込を消さない）
    if (String(row['会員ID'] || '').trim() || String(row['職員ID'] || '').trim()) {
      blockers.push('研修（研修ID ' + trainingId + '）に会員・職員の申込があります（申込ID ' + applicationId
        + '）。テスト会員なら previewTestDataPurge_LOG で先に消してください（申込も一緒に消えます）。');
      return;
    }
    if (!externalId) {
      blockers.push('研修（研修ID ' + trainingId + '）の申込（申込ID ' + applicationId + '）の申込者を確認できません。');
      return;
    }
    if (!externalById[externalId]) {
      blockers.push('申込（申込ID ' + applicationId + '）の外部申込者（' + externalId + '）が見つかりません。');
      return;
    }
    if (!isTestExternalApplicantRow_(externalById[externalId])) {
      blockers.push('研修（研修ID ' + trainingId + '）に印の無い外部申込者の申込があります（申込ID ' + applicationId + '）。');
      return;
    }
    if (externalId) targetExternalIds[externalId] = true;
  });

  // 外部申込者は、印があり、ほかの研修の申込から参照されていない人だけ消す
  var externalIdSet = {};
  var keptExternals = { unmarked: 0, usedElsewhere: 0 };
  Object.keys(targetExternalIds).forEach(function(id) {
    var row = externalById[id];
    if (!row || !isTestExternalApplicantRow_(row)) { keptExternals.unmarked += 1; return; }
    if (usedElsewhere[id]) { keptExternals.usedElsewhere += 1; return; }
    externalIdSet[id] = true;
  });

  var counts = {};
  getTrainingPurgeMatchers_(trainingIdSet, externalIdSet).forEach(function(pair) {
    counts[pair[0]] = getRowsAsObjects_(ss, pair[0]).filter(pair[1]).length;
    if (ss.getSheetByName(pair[0] + '_archive')) {
      counts[pair[0] + '_archive'] = getRowsAsObjects_(ss, pair[0] + '_archive').filter(pair[1]).length;
    }
  });
  var logSs = getLogSs_();
  if (!logSs.getSheetByName('T_メール送信明細')) {
    blockers.push('ログ用スプレッドシートに T_メール送信明細 がありません（送信の記録を確認できません）。');
    counts['T_メール送信明細'] = 0;
  } else {
    counts['T_メール送信明細'] = getRowsAsObjects_(logSs, 'T_メール送信明細').filter(getTrainingPurgeMailDetailMatcher_(externalIdSet)).length;
  }

  // 残るもの（消さない・知らせるだけ）
  var remaining = { externalsUnmarked: keptExternals.unmarked, externalsUsedElsewhere: keptExternals.usedElsewhere,
    mailLogs: 0, linePostRequests: 0, guideFiles: 0 };
  if (logSs.getSheetByName('T_メール送信ログ')) {
    remaining.mailLogs = getRowsAsObjects_(logSs, 'T_メール送信ログ').filter(function(row) {
      return !!trainingIdSet[String(row['研修ID'] || '').trim()];
    }).length;
  }
  if (ss.getSheetByName('T_LINE投稿依頼')) {
    remaining.linePostRequests = getRowsAsObjects_(ss, 'T_LINE投稿依頼').filter(function(row) {
      return String(row['対象種別'] || '') === 'TRAINING' && !!trainingIdSet[String(row['対象ID'] || '').trim()];
    }).length;
  }
  trainingRows.forEach(function(row) {
    if (trainingIdSet[String(row['研修ID'] || '').trim()] && String(row['案内状URL'] || '').trim()) remaining.guideFiles += 1;
  });

  trainings.sort(function(a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
  var plan = {
    trainings: trainings,
    trainingIds: Object.keys(trainingIdSet).sort(),
    externalIds: Object.keys(externalIdSet).sort(),
    applicationCount: applicationCount,
    counts: counts,
    remaining: remaining,
    blockers: blockers,
  };
  plan.totalRows = Object.keys(counts).reduce(function(sum, key) { return sum + counts[key]; }, 0);
  plan.isEmpty = plan.totalRows === 0;
  plan.fingerprint = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify([
    plan.trainings, plan.externalIds, plan.counts, plan.remaining,
  ])));
  return plan;
}

// 消す順: 申込 → 外部申込者 → 研修（途中で止まっても、研修が残って申込だけ無い形にとどめる）
function getTrainingPurgeMatchers_(trainingIdSet, externalIdSet) {
  return [
    ['T_研修申込', function(row) { return !!trainingIdSet[String(row['研修ID'] || '').trim()]; }],
    ['T_外部申込者', function(row) { return !!externalIdSet[String(row['外部申込者ID'] || '').trim()]; }],
    ['T_研修', function(row) { return !!trainingIdSet[String(row['研修ID'] || '').trim()]; }],
  ];
}

function getTrainingPurgeMailDetailMatcher_(externalIdSet) {
  return function(row) { return !!externalIdSet[String(row['受信者ID'] || '').trim()]; };
}

function formatTrainingPurgePlan_(plan) {
  var lines = [];
  lines.push('対象の研修 ' + plan.trainings.length + ' 件（印のある研修）');
  plan.trainings.forEach(function(t) {
    lines.push('  ' + t.id + ' ' + t.title + ' / 開催日 ' + t.date + ' / 作成 ' + t.created + (t.deleted ? ' / 削除済み' : ''));
  });
  lines.push('申込 ' + plan.applicationCount + ' 件 / 消す外部申込者 ' + plan.externalIds.length + ' 人');
  Object.keys(plan.counts).forEach(function(key) {
    if (plan.counts[key] > 0) lines.push('  ' + key + ': ' + plan.counts[key] + ' 行');
  });
  lines.push('合計 ' + plan.totalRows + ' 行');
  var r = plan.remaining;
  lines.push('残るもの: 外部申込者（印なし・本人データ）' + r.externalsUnmarked + ' 人 / ほかの申込で使われている外部申込者 '
    + r.externalsUsedElsewhere + ' 人 / 送信ログ ' + r.mailLogs + ' 件 / LINE 投稿依頼 ' + r.linePostRequests
    + ' 件 / 案内状のある研修 ' + r.guideFiles + ' 件（Drive のファイルは消さない）');
  if (plan.blockers.length > 0) {
    lines.push('【削除できません】');
    plan.blockers.forEach(function(b) { lines.push('  - ' + b); });
  }
  return lines.join('\n');
}

function previewTrainingPurge_(session, executeName, planKey) {
  var plan = buildTrainingPurgePlan_(getOrCreateDatabase_());
  PropertiesService.getScriptProperties().setProperty(planKey, JSON.stringify({
    fingerprint: plan.fingerprint, at: Date.now(), loginId: session.loginId,
  }));
  Logger.log('=== 研修の物理削除: 確認 ===\n' + formatTrainingPurgePlan_(plan)
    + (plan.isEmpty ? '\n削除するものはありません。'
      : plan.blockers.length ? '' : '\n内容を確認のうえ、30 分以内に ' + executeName + ' を実行してください。'));
  return '__TRAINING_PURGE_JSON__' + JSON.stringify(plan);
}

function executeTrainingPurge_(session, previewName, planKey, operation) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('ほかの処理が実行中です。少し待ってからやり直してください。');
  try {
    var props = PropertiesService.getScriptProperties();
    var recorded = null;
    try { recorded = JSON.parse(props.getProperty(planKey) || 'null'); } catch (e) { recorded = null; }
    if (!recorded || !recorded.fingerprint) throw new Error('先に ' + previewName + ' を実行して、削除する内容を確認してください。');
    if (Date.now() - Number(recorded.at || 0) > TEST_DATA_PURGE_PLAN_TTL_MS) {
      throw new Error('確認から 30 分を過ぎました。' + previewName + ' をもう一度実行してください。');
    }
    if (recorded.loginId !== session.loginId) {
      throw new Error('確認した人と実行する人が違います。実行する人が ' + previewName + ' を実行してください。');
    }

    var ss = getOrCreateDatabase_();
    var plan = buildTrainingPurgePlan_(ss);
    if (plan.blockers.length > 0) throw new Error('削除できません:\n' + plan.blockers.join('\n'));
    if (plan.fingerprint !== recorded.fingerprint) {
      throw new Error('確認したあとにデータが変わりました。' + previewName + ' をもう一度実行してください。');
    }
    if (plan.isEmpty) {
      props.deleteProperty(planKey);
      return '__TRAINING_PURGE_JSON__' + JSON.stringify({ removed: {}, message: '削除するものはありませんでした。' });
    }

    var trainingIdSet = idSetOf_(plan.trainingIds);
    var externalIdSet = idSetOf_(plan.externalIds);
    var removed = {};
    getTrainingPurgeMatchers_(trainingIdSet, externalIdSet).forEach(function(pair) {
      removed[pair[0]] = takeRowsByMatch_(ss.getSheetByName(pair[0]), pair[1]).length;
      if (ss.getSheetByName(pair[0] + '_archive')) {
        removed[pair[0] + '_archive'] = takeRowsByMatch_(ss.getSheetByName(pair[0] + '_archive'), pair[1]).length;
      }
    });
    removed['T_メール送信明細'] = takeRowsByMatch_(getLogSs_().getSheetByName('T_メール送信明細'),
      getTrainingPurgeMailDetailMatcher_(externalIdSet)).length;

    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();

    var after = buildTrainingPurgePlan_(ss);
    appendAuditLogEntries_([{
      operatorEmail: session.loginId,
      operation: operation,
      recordId: plan.fingerprint,
      fieldName: 'removed',
      newValue: JSON.stringify({ trainings: plan.trainingIds, externals: plan.externalIds, removed: removed }),
    }]);
    props.deleteProperty(planKey);
    Logger.log('=== 研修の物理削除: 完了 ===\n' + JSON.stringify(removed) + '\n削除後の残り: ' + after.totalRows + ' 行');
    return '__TRAINING_PURGE_JSON__' + JSON.stringify({ removed: removed, remainingRows: after.totalRows });
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

// ─── 2026-11-12: 読み込みの遅さの内訳を計る（一度きり・docs/325 手順 0） ──────────────────────
// 管理 API は応答の大きさに関係なく 1 回 4.5 秒（うち Apps Script の固定費 1.5 秒）。残り約 3 秒が
// どの部品で使われているかを、部品ごとに本番で計る。完成品（画面用 JSON）の置き場を
// プロパティ・キャッシュ・Drive のどれにするかの判断材料も取る。
// profileLoadCost_LOG は読むだけ（キャッシュが空なら通常の読み取りと同じくダッシュボードのキャッシュを作る）。
// 値は出さない: プロパティは件数と合計の大きさだけ（PASSWORD_HASH_PEPPER_V1 などを含むため・AGENTS L0.1）。
function profileTime_(label, out, fn) {
  var started = Date.now();
  var value;
  try { value = fn(); } catch (e) { out.push({ step: label, ms: Date.now() - started, error: e && e.message ? e.message : String(e) }); return null; }
  out.push({ step: label, ms: Date.now() - started });
  return value;
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

// 書く速さ（プロパティ・キャッシュ）を、使い捨てのキーで計り、すぐ消す。DB と Drive には書かない。
// operator 承認 2026-11-12（docs/325 手順 0）。キーは __profile_tmp_ で始まり、最後に必ず消す。
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

// ─── 2026-11-15 docs/334 D1: Drive の整理の棚卸し（読むだけ） ───────────────────────────────────
// 共有ドライブのフォルダへ移す前に、各資産の場所・持ち主・共有設定と、移動先の共有ドライブの制限を一覧にする。
// 出すのはファイル名・ID・件数だけ（フォルダの中のファイル名は出さない＝個人情報を出さない）。
var DRIVE_REORG_TARGET_FOLDER_ID_ = '1BKBwQF9dFIwdnEqnpGaeM1iCypSFuPgr';
var DRIVE_REORG_SCAN_LIMIT_ = 2000;

// 共有ドライブの制限で「リンクを知っている全員」の公開ができるか。組織外・メンバー外を禁じていればできない
function driveLinkSharingAllowed_(restrictions) {
  if (!restrictions) return true;
  return !(restrictions.domainUsersOnly === true || restrictions.driveMembersOnly === true);
}

// 棚卸しの対象。ID が無いものも「未設定」として並べる（見落としを出さない）
function collectDriveAssetRefs_(props, settingOf, dbId, scriptId) {
  var refs = [];
  function add(label, source, id, kind) {
    var v = String(id || '').trim();
    refs.push({ label: label, source: source, id: v, kind: kind, missing: !v });
  }
  add('DB', 'コード DB_SPREADSHEET_ID_FIXED', dbId, 'file');
  add('ログ用スプレッドシート', 'プロパティ LOG_SPREADSHEET_ID（管理プロジェクト）', props.LOG_SPREADSHEET_ID, 'file');
  add('最新の外部バックアップ', 'プロパティ ' + LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY, props[LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY], 'file');
  [['研修案内状フォルダ', 'TRAINING_FILE_FOLDER_ID'], ['請求添付フォルダ', 'CLAIM_ATTACHMENT_FOLDER_ID'],
    ['LINE 投稿資材フォルダ', 'LINE_POST_ASSETS_FOLDER_ID'], ['一括メール添付フォルダ', 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID']]
    .forEach(function(p) { add(p[0], 'DB 設定 ' + p[1], settingOf(p[1]), 'folder'); });
  add('ファビコン（会員・管理）', 'プロパティ FAVICON_MEMBER_FILE_ID', props.FAVICON_MEMBER_FILE_ID, 'file');
  add('ファビコン（公開）', 'プロパティ FAVICON_PUBLIC_FILE_ID', props.FAVICON_PUBLIC_FILE_ID, 'file');
  add('管理プロジェクト（Apps Script・今回は移さない）', 'ScriptApp.getScriptId()', scriptId, 'file');
  return refs;
}

function driveRestGet_(pathAndQuery) {
  try {
    var res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/' + pathAndQuery, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true,
    });
    var code = res.getResponseCode();
    if (code !== 200) return { error: 'HTTP ' + code + ' ' + String(res.getContentText()).slice(0, 200) };
    return JSON.parse(res.getContentText());
  } catch (e) {
    return { error: String(e && e.message ? e.message : e) };
  }
}

// q に当たるファイル数（上限で打ち切り）。マイドライブ・共有ドライブの両方を数える
function driveCountQuery_(q) {
  var count = 0;
  var token = '';
  do {
    var r = driveRestGet_('files?q=' + encodeURIComponent(q) + '&fields=nextPageToken,files(id)&pageSize=1000'
      + '&supportsAllDrives=true&includeItemsFromAllDrives=true' + (token ? '&pageToken=' + encodeURIComponent(token) : ''));
    if (r.error) return { error: r.error, count: count };
    count += (r.files || []).length;
    token = r.nextPageToken || '';
  } while (token && count < DRIVE_REORG_SCAN_LIMIT_);
  return { count: count, truncated: !!token };
}

function inventoryDriveAssets_LOG() {
  assertMasterOperator_('inventoryDriveAssets_LOG');
  var out = { target: null, assets: [], myDriveRootLeftovers: [] };
  var log = function(line) { console.log(line); };

  // 移動先（機密・公開。docs/334 §9.1）
  var target = driveRestGet_('files/' + DRIVE_REORG_TARGET_FOLDER_ID_
    + '?fields=id,name,mimeType,driveId,capabilities(canAddChildren,canMoveChildrenWithinDrive)&supportsAllDrives=true');
  var drive = target.driveId ? driveRestGet_('drives/' + target.driveId + '?fields=id,name,restrictions,capabilities(canManageMembers,canAddChildren)') : null;
  out.target = {
    folder: target, sharedDrive: drive,
    linkSharingAllowed: drive && !drive.error ? driveLinkSharingAllowed_(drive.restrictions) : null,
  };
  log('[移動先・機密] ' + JSON.stringify(out.target));
  var pubDrive = driveRestGet_('drives/' + DRIVE_REORG_PUBLIC_DRIVE_ID_ + '?fields=id,name,restrictions,capabilities(canManageMembers,canAddChildren)');
  out.publicTarget = { sharedDrive: pubDrive, linkSharingAllowed: pubDrive.error ? null : driveLinkSharingAllowed_(pubDrive.restrictions) };
  log('[移動先・公開] ' + JSON.stringify(out.publicTarget));
  var driveNames = {};
  var driveNameOf = function(driveId) {
    if (!driveId) return '';
    if (!Object.prototype.hasOwnProperty.call(driveNames, driveId)) {
      var d = driveRestGet_('drives/' + driveId + '?fields=name');
      driveNames[driveId] = d.error ? '(読めない)' : d.name;
    }
    return driveNames[driveId];
  };

  // 資産
  var props = PropertiesService.getScriptProperties().getProperties();
  var ss = getOrCreateDatabase_();
  var refs = collectDriveAssetRefs_(props, function(k) { return getSystemSettingValue_(ss, k); }, ss.getId(), ScriptApp.getScriptId());
  refs.forEach(function(ref) {
    var item = { label: ref.label, source: ref.source, id: ref.id, kind: ref.kind };
    if (ref.missing) { item.status = '未設定'; out.assets.push(item); log('[資産] ' + JSON.stringify(item)); return; }
    var meta = driveRestGet_('files/' + encodeURIComponent(ref.id)
      + '?fields=id,name,mimeType,driveId,parents,owners(emailAddress),trashed,capabilities(canMoveItemWithinDrive,canMoveItemOutOfDrive)&supportsAllDrives=true');
    if (meta.error) { item.status = '読めない: ' + meta.error; out.assets.push(item); log('[資産] ' + JSON.stringify(item)); return; }
    item.name = meta.name;
    item.mimeType = meta.mimeType;
    item.trashed = !!meta.trashed;
    item.inSharedDrive = !!meta.driveId;
    item.sharedDriveName = driveNameOf(meta.driveId);
    item.owners = (meta.owners || []).map(function(o) { return o.emailAddress; });
    item.parents = (meta.parents || []).map(function(pid) {
      var p = driveRestGet_('files/' + encodeURIComponent(pid) + '?fields=id,name&supportsAllDrives=true');
      return { id: pid, name: p.error ? '(読めない)' : p.name };
    });
    try {
      var node = ref.kind === 'folder' ? DriveApp.getFolderById(ref.id) : DriveApp.getFileById(ref.id);
      item.sharing = String(node.getSharingAccess()) + '/' + String(node.getSharingPermission());
    } catch (shareErr) { item.sharing = '読めない'; }
    if (ref.kind === 'folder') {
      var all = driveCountQuery_("'" + ref.id + "' in parents and trashed = false");
      var linked = driveCountQuery_("'" + ref.id + "' in parents and trashed = false and visibility = 'anyoneWithLink'");
      var folders = driveCountQuery_("'" + ref.id + "' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'");
      item.children = all; item.publicLinkChildren = linked; item.subfolders = folders;
    }
    item.status = 'OK';
    out.assets.push(item);
    log('[資産] ' + JSON.stringify(item));
  });

  // マイドライブ直下に作られたもの（コードがここに作る・docs/334 §2 危険 2）
  [['外部バックアップ', DB_BACKUP_SPREADSHEET_NAME_PREFIX], ['研修案内状フォルダ', '研修案内状'], ['LINE 投稿資材フォルダ', 'LINE投稿資材'],
    ['宛名リスト（一時）', '宛名リスト_'], ['診断用フォルダ', '_hcmn_drive_diagnostic_'], ['移行検証の一時ファイル', SHEETS_PROBE_FILE_PREFIX_]]
    .forEach(function(p) {
      var c = driveCountQuery_("'root' in parents and trashed = false and name contains '" + String(p[1]).split("'").join("\\'") + "'");
      var row = { label: p[0], namePrefix: p[1], count: c.count, truncated: !!c.truncated, error: c.error || '' };
      out.myDriveRootLeftovers.push(row);
      log('[マイドライブ直下] ' + JSON.stringify(row));
    });
  return JSON.stringify(out);
}

// ─── 2026-11-15 docs/334 §9: D2 構成と D3 移動（記録 → 移動 → 戻し）────────────────────────────
// 機密（外部共有禁止）と公開（公開リンク可）の 2 つの共有ドライブに、「システム → 本番/ステージング → 用途」でそろえる。
// 移す前に元の親と共有設定を記録し、記録から戻せるようにする（operator 指示「元に戻す方法を必ず準備」）。
var DRIVE_REORG_PUBLIC_DRIVE_ID_ = '0AAdJXEXqX8ImUk9PVA';
var DRIVE_FOLDER_MIME_ = 'application/vnd.google-apps.folder';

// 作るフォルダ（親を子より先に）。既存のフォルダを移す先（公開 本番/LINE投稿資材）は作らない（入れ子にしない）
function driveReorgLayout_(confRootId, pubDriveId) {
  var list = [];
  function add(rootId, prefix, path) {
    list.push({
      key: prefix + '/' + path.join('/'),
      parentKey: path.length > 1 ? prefix + '/' + path.slice(0, -1).join('/') : null,
      rootId: rootId,
      name: path[path.length - 1],
    });
  }
  var uses = ['ログ', '宛名リスト', 'バックアップ', '請求添付', '一括メール添付'];
  add(confRootId, 'conf', ['本番']);
  uses.forEach(function(u) { add(confRootId, 'conf', ['本番', u]); });
  add(confRootId, 'conf', ['ステージング']);
  ['Apps Script', 'DB'].concat(uses).forEach(function(u) { add(confRootId, 'conf', ['ステージング', u]); });
  var sys = '協議会基幹システム';
  add(pubDriveId, 'pub', [sys]);
  add(pubDriveId, 'pub', [sys, '本番']);
  add(pubDriveId, 'pub', [sys, '本番', '研修案内状']);
  add(pubDriveId, 'pub', [sys, 'ステージング']);
  add(pubDriveId, 'pub', [sys, 'ステージング', '研修案内状']);
  add(pubDriveId, 'pub', [sys, 'ステージング', 'LINE投稿資材']);
  return list;
}

// 今回移すもの（docs/334 §9.2）。移し先に既にあるもの・未設定は入れない
function driveReorgPlanItems_(rootFiles, logMeta, lineMeta, folderIds) {
  var items = [];
  var sheetMime = 'application/vnd.google-apps.spreadsheet';
  (rootFiles || []).forEach(function(f) {
    if (f.mimeType === sheetMime && String(f.name || '').indexOf('宛名リスト_') === 0) {
      items.push({ id: f.id, name: f.name, kind: 'file', targetKey: 'conf/本番/宛名リスト' });
    }
  });
  function addUnlessThere(meta, targetKey, kind, label) {
    if (!meta || !meta.id) return;
    var targetId = folderIds[targetKey];
    if (targetId && (meta.parents || []).indexOf(targetId) !== -1) return;
    items.push({ id: meta.id, name: meta.name || label, kind: kind, targetKey: targetKey });
  }
  addUnlessThere(logMeta, 'conf/本番/ログ', 'file', 'ログ用スプレッドシート');
  addUnlessThere(lineMeta, 'pub/協議会基幹システム/本番', 'folder', 'LINE投稿資材');
  return items;
}

function driveReorgFingerprintInput_(missingFolderKeys, items) {
  return JSON.stringify({ folders: missingFolderKeys || [], items: (items || []).map(function(i) { return [i.id, i.targetKey]; }) });
}

// 確認（preview）から 30 分以内・同じ実行者・同じ計画のときだけ実行できる
function driveReorgPreviewValid_(stored, fingerprint, operator, nowMs) {
  if (!stored || stored.fingerprint !== fingerprint || stored.operator !== operator) return false;
  var age = nowMs - Number(stored.atMs || 0);
  return age >= 0 && age < 30 * 60 * 1000;
}

// 戻す操作の一覧。移したもの（status moved）だけを、記録した元の親へ
function driveReorgRestoreOps_(batch) {
  return ((batch && batch.items) || []).filter(function(it) { return it.status === 'moved'; }).map(function(it) {
    return { id: it.id, name: it.name, kind: it.kind, addParents: (it.fromParents || []).join(','), removeParents: it.toParentId, sharing: it.sharing };
  });
}

function driveRestSend_(method, pathAndQuery, body) {
  try {
    var opts = { method: method, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
    if (body) { opts.contentType = 'application/json'; opts.payload = JSON.stringify(body); }
    var res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/' + pathAndQuery, opts);
    var code = res.getResponseCode();
    if (code !== 200) return { error: 'HTTP ' + code + ' ' + String(res.getContentText()).slice(0, 300) };
    return JSON.parse(res.getContentText() || '{}');
  } catch (e) {
    return { error: String(e && e.message ? e.message : e) };
  }
}

// フォルダを確かめる（apply なら無いものを作る）。同名が 2 つ以上あれば止める（どちらへ入れるか決められない）
function driveReorgEnsureFolders_(layout, apply) {
  var ids = {};
  var created = [];
  var missing = [];
  layout.forEach(function(f) {
    var parentId = f.parentKey ? ids[f.parentKey] : f.rootId;
    if (!parentId) { missing.push(f.key); return; }
    var q = "'" + parentId + "' in parents and trashed = false and mimeType = '" + DRIVE_FOLDER_MIME_
      + "' and name = '" + String(f.name).split("'").join("\\'") + "'";
    var found = driveRestGet_('files?q=' + encodeURIComponent(q) + '&fields=files(id,name)&pageSize=10'
      + '&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives');
    if (found.error) throw new Error('フォルダを確かめられません（' + f.key + '）: ' + found.error);
    var hits = found.files || [];
    if (hits.length > 1) throw new Error('同じ名前のフォルダが ' + hits.length + ' つあります（' + f.key + '）。どちらかを整理してから実行してください');
    if (hits.length === 1) { ids[f.key] = hits[0].id; return; }
    if (!apply) { missing.push(f.key); return; }
    var made = driveRestSend_('post', 'files?supportsAllDrives=true&fields=id', { name: f.name, mimeType: DRIVE_FOLDER_MIME_, parents: [parentId] });
    if (made.error || !made.id) throw new Error('フォルダを作れません（' + f.key + '）: ' + (made.error || 'id なし'));
    ids[f.key] = made.id;
    created.push(f.key);
  });
  return { ids: ids, created: created, missing: missing };
}

function driveReorgGather_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var q = "'root' in parents and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet' and name contains '宛名リスト_'";
  var root = driveRestGet_('files?q=' + encodeURIComponent(q) + '&fields=files(id,name,mimeType,parents)&pageSize=200');
  if (root.error) throw new Error('マイドライブ直下を読めません: ' + root.error);
  var metaOf = function(id) {
    if (!id) return null;
    var m = driveRestGet_('files/' + encodeURIComponent(id) + '?fields=id,name,parents&supportsAllDrives=true');
    if (m.error) throw new Error('移す対象を読めません（' + id + '）: ' + m.error);
    return m;
  };
  var ss = getOrCreateDatabase_();
  return {
    rootFiles: root.files || [],
    logMeta: metaOf(String(props.LOG_SPREADSHEET_ID || '').trim()),
    lineMeta: metaOf(String(getSystemSettingValue_(ss, 'LINE_POST_ASSETS_FOLDER_ID') || '').trim()),
  };
}

function driveReorgReadSharing_(id, kind) {
  var node = kind === 'folder' ? DriveApp.getFolderById(id) : DriveApp.getFileById(id);
  return { access: String(node.getSharingAccess()), permission: String(node.getSharingPermission()) };
}

function driveReorgParents_(id) {
  var m = driveRestGet_('files/' + encodeURIComponent(id) + '?fields=id,parents&supportsAllDrives=true');
  if (m.error) throw new Error('場所を読めません（' + id + '）: ' + m.error);
  return m.parents || [];
}

// 1 件移す。移った先を読み直して確かめる
function driveReorgMoveItem_(id, toParentId) {
  var from = driveReorgParents_(id);
  var res = driveRestSend_('patch', 'files/' + encodeURIComponent(id) + '?addParents=' + encodeURIComponent(toParentId)
    + '&removeParents=' + encodeURIComponent(from.join(',')) + '&supportsAllDrives=true&fields=id,parents');
  if (res.error) throw new Error('移せません（' + id + '）: ' + res.error);
  var after = driveReorgParents_(id);
  if (after.length !== 1 || after[0] !== toParentId) throw new Error('移った先を確かめられません（' + id + '）: ' + JSON.stringify(after));
  return { fromParents: from };
}

// 1 件戻す。元の親へ戻し、共有設定を記録どおりにする
function driveReorgRestoreItem_(op) {
  var res = driveRestSend_('patch', 'files/' + encodeURIComponent(op.id) + '?addParents=' + encodeURIComponent(op.addParents)
    + '&removeParents=' + encodeURIComponent(op.removeParents) + '&supportsAllDrives=true&fields=id,parents');
  if (res.error) throw new Error('戻せません（' + op.id + '）: ' + res.error);
  var after = driveReorgParents_(op.id);
  var wanted = String(op.addParents).split(',');
  if (after.length !== wanted.length || wanted.some(function(p) { return after.indexOf(p) === -1; })) {
    throw new Error('元の場所に戻ったか確かめられません（' + op.id + '）: ' + JSON.stringify(after));
  }
  var sharingRestored = false;
  if (op.sharing && op.sharing.access) {
    var now = driveReorgReadSharing_(op.id, op.kind);
    if (now.access !== op.sharing.access || now.permission !== op.sharing.permission) {
      var node = op.kind === 'folder' ? DriveApp.getFolderById(op.id) : DriveApp.getFileById(op.id);
      node.setSharing(DriveApp.Access[op.sharing.access], DriveApp.Permission[op.sharing.permission]);
      sharingRestored = true;
    }
  }
  return { sharingRestored: sharingRestored };
}

function driveReorgPlan_(apply) {
  var layout = driveReorgLayout_(DRIVE_REORG_TARGET_FOLDER_ID_, DRIVE_REORG_PUBLIC_DRIVE_ID_);
  var folders = driveReorgEnsureFolders_(layout, apply);
  var g = driveReorgGather_();
  var items = driveReorgPlanItems_(g.rootFiles, g.logMeta, g.lineMeta, folders.ids);
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, driveReorgFingerprintInput_(folders.missing, items), Utilities.Charset.UTF_8);
  return { folders: folders, items: items, fingerprint: bytesToHex_(digest) };
}

function previewDriveReorg_LOG() {
  var session = assertMasterOperator_('previewDriveReorg_LOG');
  var plan = driveReorgPlan_(false);
  plan.items.forEach(function(it) {
    it.currentParents = driveReorgParents_(it.id);
    it.sharing = driveReorgReadSharing_(it.id, it.kind);
    console.log('[移すもの] ' + JSON.stringify(it));
  });
  console.log('[作るフォルダ] ' + JSON.stringify(plan.folders.missing));
  console.log('[計画の指紋] ' + plan.fingerprint);
  PropertiesService.getScriptProperties().setProperty('DRIVE_REORG_PREVIEW',
    JSON.stringify({ fingerprint: plan.fingerprint, operator: String(session.loginId || ''), atMs: Date.now() }));
  return JSON.stringify({ createFolders: plan.folders.missing, items: plan.items, fingerprint: plan.fingerprint });
}

function executeDriveReorg_APPLY() {
  var session = assertMasterOperator_('executeDriveReorg_APPLY');
  var props = PropertiesService.getScriptProperties();
  var operator = String(session.loginId || '');
  var stored = null;
  try { stored = JSON.parse(props.getProperty('DRIVE_REORG_PREVIEW') || 'null'); } catch (e) { stored = null; }
  var check = driveReorgPlan_(false);
  if (!driveReorgPreviewValid_(stored, check.fingerprint, operator, Date.now())) {
    throw new Error('確認（previewDriveReorg_LOG）の後 30 分以内・同じ実行者・同じ計画のときだけ実行できます。もう一度確認してください');
  }
  var plan = driveReorgPlan_(true); // フォルダを作る
  var batch = {
    batchId: 'DR' + Date.now(), at: new Date().toISOString(), operator: operator,
    items: plan.items.map(function(it) {
      return { id: it.id, name: it.name, kind: it.kind, targetKey: it.targetKey, toParentId: plan.folders.ids[it.targetKey],
        fromParents: driveReorgParents_(it.id), sharing: driveReorgReadSharing_(it.id, it.kind), status: 'recorded' };
    }),
  };
  // 移す前に記録する。書けなければ移さない（元に戻せないまま移さない）
  props.setProperty('DRIVE_REORG_LAST_BATCH', JSON.stringify(batch));
  console.log('[記録] ' + batch.batchId + ' 作ったフォルダ ' + JSON.stringify(plan.folders.created));
  for (var i = 0; i < batch.items.length; i += 1) {
    var it = batch.items[i];
    try {
      driveReorgMoveItem_(it.id, it.toParentId);
      it.status = 'moved';
      props.setProperty('DRIVE_REORG_LAST_BATCH', JSON.stringify(batch));
      try {
        appendAuditLogEntries_([{ operatorEmail: operator, operation: 'DRIVE_REORG_MOVE', tableName: 'Drive', recordId: it.id,
          fieldName: it.name, oldValue: it.fromParents.join(','), newValue: it.toParentId }]);
      } catch (auditErr) { console.warn('監査ログに書けませんでした: ' + auditErr); }
      console.log('[移した] ' + JSON.stringify({ id: it.id, name: it.name, to: it.targetKey }));
    } catch (e) {
      it.status = 'failed';
      it.error = String(e && e.message ? e.message : e);
      props.setProperty('DRIVE_REORG_LAST_BATCH', JSON.stringify(batch));
      console.log('[止めた] ' + JSON.stringify({ id: it.id, name: it.name, error: it.error }) + ' 戻すなら restoreDriveReorg_APPLY');
      break;
    }
  }
  props.deleteProperty('DRIVE_REORG_PREVIEW');
  return JSON.stringify(batch);
}

function restoreDriveReorg_APPLY() {
  var session = assertMasterOperator_('restoreDriveReorg_APPLY');
  // 緊急の戻しなので確認の段を挟まない。記録にあり、移したものだけを戻す（docs/334 §9.3）
  var props = PropertiesService.getScriptProperties();
  var batch = null;
  try { batch = JSON.parse(props.getProperty('DRIVE_REORG_LAST_BATCH') || 'null'); } catch (e) { batch = null; }
  var ops = driveReorgRestoreOps_(batch);
  if (!ops.length) { console.log('[戻し] 戻すものはありません'); return '[]'; }
  var results = ops.map(function(op) {
    var item = batch.items.filter(function(x) { return x.id === op.id; })[0];
    try {
      var r = driveReorgRestoreItem_(op);
      item.status = 'restored';
      try {
        appendAuditLogEntries_([{ operatorEmail: String(session.loginId || ''), operation: 'DRIVE_REORG_RESTORE', tableName: 'Drive',
          recordId: op.id, fieldName: op.name, oldValue: op.removeParents, newValue: op.addParents }]);
      } catch (auditErr) { console.warn('監査ログに書けませんでした: ' + auditErr); }
      console.log('[戻した] ' + JSON.stringify({ id: op.id, name: op.name, sharingRestored: r.sharingRestored }));
      return { id: op.id, ok: true };
    } catch (e) {
      item.status = 'restore-failed';
      console.log('[戻せない] ' + JSON.stringify({ id: op.id, name: op.name, originalParents: op.addParents, error: String(e && e.message ? e.message : e) }));
      return { id: op.id, ok: false };
    } finally {
      props.setProperty('DRIVE_REORG_LAST_BATCH', JSON.stringify(batch));
    }
  });
  return JSON.stringify(results);
}

function rehearseDriveReorgRoundTrip_APPLY() {
  var session = assertMasterOperator_('rehearseDriveReorgRoundTrip_APPLY');
  // 試し用のファイル 2 つで、本番と同じ移動・戻しの関数を通す（docs/334 §9.3）。フォルダの構成もここで作る
  var steps = [];
  var step = function(name, ok, detail) {
    steps.push({ step: name, ok: !!ok, detail: detail || '' });
    console.log('[試し] ' + (ok ? 'OK ' : 'NG ') + name + (detail ? ' ' + JSON.stringify(detail) : ''));
  };
  var layout = driveReorgLayout_(DRIVE_REORG_TARGET_FOLDER_ID_, DRIVE_REORG_PUBLIC_DRIVE_ID_);
  var folders = driveReorgEnsureFolders_(layout, true);
  step('フォルダの構成', true, { created: folders.created });
  var stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
  var body = 'Drive の移動と戻しの試し（' + String(session.loginId || '') + '・自動でゴミ箱へ移します）';
  var privateFile = DriveApp.createFile('★Drive移動の試し_非公開_' + stamp + '.txt', body);
  var publicFile = DriveApp.createFile('★Drive移動の試し_公開_' + stamp + '.txt', body);
  publicFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var cases = [
    { label: '機密（非公開）', file: privateFile, to: folders.ids['conf/ステージング'] },
    { label: '公開（公開リンク）', file: publicFile, to: folders.ids['pub/協議会基幹システム/ステージング'] },
  ];
  try {
    cases.forEach(function(c) {
      c.id = c.file.getId();
      c.sharing = driveReorgReadSharing_(c.id, 'file');
      c.from = driveReorgMoveItem_(c.id, c.to).fromParents;
      step(c.label + ': 移した', true);
      var s = driveReorgReadSharing_(c.id, 'file');
      step(c.label + ': 移した後の共有設定が同じ', s.access === c.sharing.access && s.permission === c.sharing.permission, s);
    });
    cases.forEach(function(c) {
      driveReorgRestoreItem_({ id: c.id, kind: 'file', addParents: c.from.join(','), removeParents: c.to, sharing: c.sharing });
      var p = driveReorgParents_(c.id);
      step(c.label + ': 元の場所に戻った', p.length === c.from.length && p.every(function(x) { return c.from.indexOf(x) !== -1; }), p);
      var s = driveReorgReadSharing_(c.id, 'file');
      step(c.label + ': 共有設定が元どおり', s.access === c.sharing.access && s.permission === c.sharing.permission, s);
    });
  } catch (e) {
    step('例外', false, String(e && e.message ? e.message : e));
  } finally {
    [privateFile, publicFile].forEach(function(f) { try { f.setTrashed(true); } catch (trashErr) {} });
    step('試し用のファイルをゴミ箱へ', true);
  }
  var pass = steps.every(function(s) { return s.ok; });
  console.log('[試し] 結果 ' + (pass ? 'PASS' : 'FAIL'));
  return JSON.stringify({ pass: pass, steps: steps });
}

// ─── 2026-11-15 ステージングの DB とログの用意（docs/334 §10.4・TRD §1.8） ─────────────────────────
// ステージングの管理プロジェクトのエディタ ▶ で動かす。DB がまだ無いので管理者リスト（assertMasterOperator_）では
// 確かめられない。代わりに、本番のスクリプトでは止め、実行者がデプロイした人（＝プロジェクトの持ち主）と同じときだけ通す。
// web app（USER_DEPLOYING）から google.script.run で呼ばれたときは、実行者が閲覧者・デプロイした人が持ち主で一致しない。
var STAGING_DB_NAME_ = '【ステージング】協議会基幹システム_DB';
var STAGING_LOG_NAME_ = '【ステージング】協議会基幹システム_ログDB';

function assertStagingOwnerOperator_(toolName) {
  if (isProductionScript_()) {
    throw new Error('本番のプロジェクトでは実行できません（' + toolName + ' はステージング専用・docs/334 §10.4）。');
  }
  var active = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var effective = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (!active || active !== effective) {
    throw new Error('ステージングの持ち主がエディタから実行してください（' + toolName + '）。');
  }
  return active;
}

// DB とログのスプレッドシートを共有ドライブの「ステージング/DB」「ステージング/ログ」に作り、自分のプロジェクトの
// プロパティにだけ ID を書く。2 回目以降は作らない（設定済みの ID を使う）。DB のスキーマは画面を開いたときの整備で作られ、
// テストデータは別の段（docs/334 §10.4）。公開・会員のプロジェクトのプロパティは、ここでは書けない（ログに出す値を画面で入れる）。
function setupStagingStores_APPLY() {
  assertStagingOwnerOperator_('setupStagingStores_APPLY');
  var props = PropertiesService.getScriptProperties();
  var folders = driveReorgEnsureFolders_(driveReorgLayout_(DRIVE_REORG_TARGET_FOLDER_ID_, DRIVE_REORG_PUBLIC_DRIVE_ID_), false);
  var dbFolder = folders.ids['conf/ステージング/DB'];
  var logFolder = folders.ids['conf/ステージング/ログ'];
  if (!dbFolder || !logFolder) {
    throw new Error('ステージングのフォルダがありません（' + folders.missing.join(', ') + '）。');
  }
  function ensure(key, name, folderId) {
    var current = String(props.getProperty(key) || '').trim();
    if (current === PRODUCTION_DB_SPREADSHEET_ID_) throw new Error(key + ' が本番 DB を指しています。消してから実行してください。');
    if (current) return { id: current, created: false };
    var made = driveRestSend_('post', 'files?supportsAllDrives=true&fields=id',
      { name: name, mimeType: 'application/vnd.google-apps.spreadsheet', parents: [folderId] });
    if (made.error || !made.id) throw new Error(name + ' を作れません: ' + (made.error || 'id なし'));
    props.setProperty(key, made.id);
    return { id: made.id, created: true };
  }
  var db = ensure('DB_SPREADSHEET_ID_OVERRIDE', STAGING_DB_NAME_, dbFolder);
  console.log('[ステージング] DB ' + db.id + (db.created ? '（作成）' : '（設定済み）'));
  var log = ensure('LOG_SPREADSHEET_ID', STAGING_LOG_NAME_, logFolder);
  console.log('[ステージング] ログ ' + log.id + (log.created ? '（作成）' : '（設定済み）'));
  if (log.created) rebuildLogDatabaseSchemaInternal_(SpreadsheetApp.openById(log.id));
  props.setProperty('SCRIPT_ID_ADMIN', ScriptApp.getScriptId());
  console.log('[ステージング] 公開・会員のプロジェクトに入れる値: DB_SPREADSHEET_ID_OVERRIDE=' + db.id + ' LOG_SPREADSHEET_ID=' + log.id);
  return JSON.stringify({ db: db, log: log, scriptIdAdmin: ScriptApp.getScriptId() });
}

// ステージングの DB に確認用のテストデータを入れる（docs/334 §10.8）。古い seedDemoData は実在のアドレスを使い、
// 表を消してから入れるので使わない。ここでは何も消さない: 会員の表に入れた覚えのない行が 1 行でもあれば止める。
// 入れるもの: 実行者（ステージングの持ち主）を MASTER の管理者として登録する 1 組（会員・認証・管理者リスト）と、
// ★＋@example.invalid の会員（個人 1・事業所 1＋職員 1）。研修は管理画面から作って確かめる。2 回目は何もしない。
var STAGING_SEED_MEMBER_IDS_ = ['99000001', '99000002', '99000003'];

function stagingSeedRows_(operatorEmail, now, masterRoleId) {
  var base = { 会員状態コード: 'ACTIVE', 入会日: '2024-04-01', 発送方法コード: 'EMAIL', 郵送先区分コード: 'OFFICE', 作成日時: now, 更新日時: now, 削除フラグ: false };
  function member(extra) { var o = {}; Object.keys(base).forEach(function(k) { o[k] = base[k]; }); Object.keys(extra).forEach(function(k) { o[k] = extra[k]; }); return o; }
  return {
    members: [
      member({ 会員ID: '99000001', 会員種別コード: 'INDIVIDUAL', 姓: '★ステージング', 名: '管理者', セイ: 'ステージング', メイ: 'カンリシャ',
        代表メールアドレス: 'stg-admin@example.invalid', 介護支援専門員番号: '99000001', 勤務先名: '★テスト勤務先' }),
      member({ 会員ID: '99000002', 会員種別コード: 'INDIVIDUAL', 姓: '★テスト', 名: '個人', セイ: 'テスト', メイ: 'コジン',
        代表メールアドレス: 'stg-individual@example.invalid', 介護支援専門員番号: '99000002', 勤務先名: '★テスト勤務先' }),
      member({ 会員ID: '99000003', 会員種別コード: 'BUSINESS', 勤務先名: '★テスト事業所', 代表メールアドレス: 'stg-office@example.invalid', 職員数上限: 5 }),
    ],
    staff: [
      { 職員ID: 'STF-STG-01', 会員ID: '99000003', 姓: '★テスト', 名: '職員', セイ: 'テスト', メイ: 'ショクイン', 氏名: '★テスト 職員', フリガナ: 'テスト ショクイン',
        メールアドレス: 'stg-staff@example.invalid', 職員権限コード: 'REPRESENTATIVE', 職員状態コード: 'ENROLLED', 入会日: '2024-04-01',
        介護支援専門員番号: '99000004', メール配信希望コード: 'YES', 作成日時: now, 更新日時: now, 削除フラグ: false },
    ],
    auths: [
      { 認証ID: 'AUTH-STG-01', 認証方式: 'PASSWORD', ログインID: '99000001', システムロールコード: 'INDIVIDUAL_MEMBER', 会員ID: '99000001', 職員ID: '',
        アカウント有効フラグ: true, ログイン失敗回数: 0, ロック状態: false, 作成日時: now, 更新日時: now, 削除フラグ: false },
    ],
    whitelist: [
      { ホワイトリストID: 'WL-STG-01', Googleメール: operatorEmail, 紐付け認証ID: 'AUTH-STG-01', 紐付け会員ID: '99000001', 権限コード: 'MASTER',
        ロールID: masterRoleId, 有効フラグ: true, 変更者メール: 'staging-seed', 変更日時: now, 作成日時: now, 更新日時: now, 削除フラグ: false },
    ],
  };
}

function seedStagingTestData_APPLY() {
  var operatorEmail = assertStagingOwnerOperator_('seedStagingTestData_APPLY');
  var ss = getOrCreateDatabase_();
  if (ss.getId() === PRODUCTION_DB_SPREADSHEET_ID_) throw new Error('本番 DB には入れられません。');
  initializeSchema_(ss);
  var existing = getRowsAsObjects_(ss, 'T_会員').map(function(r) { return String(r['会員ID'] || ''); }).filter(function(id) { return id; });
  var foreign = existing.filter(function(id) { return STAGING_SEED_MEMBER_IDS_.indexOf(id) < 0; });
  if (foreign.length) throw new Error('会員の表に、このツールが入れていない行が ' + foreign.length + ' 行あります。何も入れずに止めました。');
  if (existing.length) {
    console.log('[ステージング] テストデータは入れてあります（' + existing.length + ' 行）。何もしません。');
    return JSON.stringify({ seeded: false, reason: 'already' });
  }
  var rows = stagingSeedRows_(operatorEmail, new Date().toISOString(), LEGACY_CODE_TO_INITIAL_ROLE_ID['MASTER'] || '');
  appendRowsByHeaders_(ss, 'T_会員', rows.members);
  appendRowsByHeaders_(ss, 'T_事業所職員', rows.staff);
  appendRowsByHeaders_(ss, 'T_認証アカウント', rows.auths);
  appendRowsByHeaders_(ss, 'T_管理者Googleホワイトリスト', rows.whitelist);
  clearAdminPermissionCaches_();
  clearAllDataCache_();
  console.log('[ステージング] テストデータを入れました: 会員 ' + rows.members.length + '・職員 ' + rows.staff.length + '・管理者 1（実行者・MASTER）');
  return JSON.stringify({ seeded: true, members: rows.members.length, staff: rows.staff.length, admins: 1 });
}

// ─── 2026-11-12: doGet の内訳を計る（読むだけ・一度きり・docs/332 S0） ───────────────────────────
// 冷えた状態で画面の枠が出るまで 3.4〜3.8 秒のうち、doGet のサーバー処理が約 2 秒。どの手順に使われているかを 3 回ずつ計る。
// 返すのは手順名と ms だけ（HTML の中身・設定の値は出さない）。
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

// ─── 2026-11-12: Drive の最終更新日時の反映遅れを計る（一度きり・docs/328 §8・計画 P1） ───────────
// 管理者認証の完成品は「DB の最終更新日時が新しければ作り直す」。書き込みから最終更新日時が変わるまでの遅れが
// 反映までの時間の約束を決めるので、実測する。個人情報の無い一時スプレッドシートだけを作り、
// SpreadsheetApp と Sheets REST で 1 セルずつ書いて、DriveApp と Drive REST の値が変わるまでを 2 秒ごとに最大 120 秒計る。
// 終わったら一時スプレッドシートをゴミ箱へ。本番 DB には触れない。Drive に書くので _APPLY（実行は operator 承認）。
function readDriveModifiedPair_(fileId, token) {
  var appMs = DriveApp.getFileById(fileId).getLastUpdated().getTime();
  var resp = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?fields=modifiedTime&supportsAllDrives=true', {
    headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true,
  });
  var restMs = resp.getResponseCode() === 200 ? new Date(JSON.parse(resp.getContentText()).modifiedTime).getTime() : -1;
  return { app: appMs, rest: restMs };
}

// 2026-11-12 第 2 版: 1 回目は同じファイルへ続けて書いたため、2 つ目の変化がどちらの書き込みによるものか区別できなかった。
// 書き方ごとに別の一時スプレッドシートを用意し、作成直後の変化が落ち着くまで 60 秒待ってから同時に書き、両方を最大 240 秒見る。
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

// ─── 2026-10-25: 先頭の 0 が消えた電話番号を戻す（docs/311 §5.5） ─────────────────────
// 列が書式なしテキストになる前（v376.132 より前）に数値として保存され、0 が落ちた値を直す。
// 日本の電話番号は 0 で始まる。数字だけで 9 桁（固定電話・0120 の 0 抜け）か、10 桁で 50 / 70 / 80 / 90 から始まる
// （050 / 070 / 080 / 090 の 0 抜け）値だけに 0 を足す。ハイフン付き・0 始まり・それ以外の桁数には触れない。
// セル単位で書き、行の他の列（更新日時を含む）には触れない。確認 → 実行の 2 段（テストデータの物理削除と同じ照合）。
var PHONE_ZERO_REPAIR_COLUMNS_ = {
  'T_会員': ['携帯電話番号', '勤務先電話番号', '勤務先FAX番号'],
  'T_外部申込者': ['電話番号'],
};
var PHONE_ZERO_REPAIR_ID_COLUMNS_ = { 'T_会員': '会員ID', 'T_外部申込者': '外部申込者ID' };
var PHONE_ZERO_REPAIR_PLAN_KEY = 'PHONE_ZERO_REPAIR_PLAN_V1';

// 0 を足した値。直す対象でなければ ''
function repairedPhoneLeadingZero_(value) {
  var s = String(value == null ? '' : value).trim();
  if (!s || s.charAt(0) === '0') return '';
  for (var i = 0; i < s.length; i += 1) {
    if (s.charAt(i) < '0' || s.charAt(i) > '9') return '';
  }
  if (s.length === 9) return '0' + s;
  // 携帯・IP 電話は 0X0（090 / 080 / 070 / 050）。0 が落ちると「X0」で始まる 10 桁になる。
  // 2026-10-25 の本番確認で「999…」の 10 桁があった（0 を足すと 11 桁で番号にならない）。2 桁目が 0 のものだけ直す
  if (s.length === 10 && '5789'.indexOf(s.charAt(0)) >= 0 && s.charAt(1) === '0') return '0' + s;
  return '';
}

// 画面・ログに出すときは真ん中を伏せる（例: 072****34）
function maskPhoneForLog_(value) {
  var s = String(value || '');
  return s.length <= 5 ? s : s.slice(0, 3) + new Array(s.length - 4).join('*') + s.slice(-2);
}

function buildPhoneZeroRepairPlan_(ss) {
  var items = [];
  Object.keys(PHONE_ZERO_REPAIR_COLUMNS_).forEach(function(tableName) {
    [tableName, tableName + '_archive'].forEach(function(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return;
      var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
      var headers = values[0].map(function(h) { return String(h); });
      var idIndex = headers.indexOf(PHONE_ZERO_REPAIR_ID_COLUMNS_[tableName]);
      PHONE_ZERO_REPAIR_COLUMNS_[tableName].forEach(function(column) {
        var c = headers.indexOf(column);
        if (c < 0) return;
        for (var r = 1; r < values.length; r += 1) {
          var after = repairedPhoneLeadingZero_(values[r][c]);
          if (!after) continue;
          items.push({ sheet: sheetName, row: r + 1, col: c + 1, id: idIndex >= 0 ? String(values[r][idIndex] || '') : '',
            column: column, before: String(values[r][c]), after: after });
        }
      });
    });
  });
  return {
    items: items,
    fingerprint: bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(items))),
  };
}

function maskedPhoneZeroRepairItems_(items) {
  return items.map(function(it) {
    return { sheet: it.sheet, row: it.row, id: it.id, column: it.column, before: maskPhoneForLog_(it.before), after: maskPhoneForLog_(it.after) };
  });
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

// ─── v309: T_共有メモ シート追加（ワンタイム移行） ─────────────────────────────

/**
 * v309 移行: T_共有メモ シートをDBスプレッドシートに作成する。
 * Apps Script エディタ（admin split）から手動で1回だけ実行すること。
 * saveSharedMemo_ も初回書き込み時に自動作成するため、
 * 本関数は事前に確実にシートを用意したい場合の補助として使用する。
 */
// ─── v370.1: PENDING 入会申込の partial データ診断とクリーンアップ ────────────
// v368 で導入したバグ（srcMemberId reference error）により、事業所入会申込承認時に
// 事業所会員 + 代表者 1 名のみが部分登録され、残職員と申請ステータス更新が中断された。
// 以下は (1) 安全な read-only 診断と (2) 確認後の soft-delete クリーンアップ関数。






function runAddSharedMemoSheetForV309() {
  var ss = getOrCreateDatabase_();
  var sheet = getOrCreateSheet_(ss, 'T_共有メモ');
  writeSheetHeaders_(sheet, テーブル定義['T_共有メモ']);
  Logger.log('T_共有メモ シートを作成しました（または既存シートのヘッダーを確認しました）。');
  return { ok: true, message: 'T_共有メモ シート作成完了' };
}


/**
 * T_研修申込 の既存行を 2-FK 化:
 *  - 申込者区分=EXTERNAL かつ 外部申込者ID が空の行: 申込者ID を 外部申込者ID へ複写
 *  - 既存 申込者ID / 申込者区分コード は維持（v361 以降で物理削除予定）
 */
function migrateTrainingApplicationsToTwoFkForV360_(ss) {
  var sheet = ss.getSheetByName('T_研修申込');
  if (!sheet || sheet.getLastRow() < 2) return { migrated: 0, skipped: 0 };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  if (cols['外部申込者ID'] == null || cols['申込者区分コード'] == null || cols['申込者ID'] == null) {
    return { migrated: 0, skipped: 0, error: '必要列が見つかりません' };
  }
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var migrated = 0;
  for (var r = 0; r < data.length; r++) {
    var type = String(data[r][cols['申込者区分コード']] || '').trim();
    var legacyId = String(data[r][cols['申込者ID']] || '').trim();
    var externalId = String(data[r][cols['外部申込者ID']] || '').trim();
    if (type === 'EXTERNAL' && legacyId && !externalId) {
      data[r][cols['外部申込者ID']] = legacyId;
      migrated++;
    }
  }
  if (migrated > 0) {
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }
  return { migrated: migrated, total: data.length };
}

/**
 * 既存 T_研修申込 行の 出欠状態コード を UNRECORDED で backfill。
 */
function backfillAttendanceStatusForV360_(ss) {
  var sheet = ss.getSheetByName('T_研修申込');
  if (!sheet || sheet.getLastRow() < 2) return { backfilled: 0 };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var col = headers.indexOf('出欠状態コード');
  if (col < 0) return { backfilled: 0, error: '出欠状態コード列なし' };
  var data = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
  var backfilled = 0;
  for (var r = 0; r < data.length; r++) {
    if (!String(data[r][0] || '').trim()) {
      data[r][0] = 'UNRECORDED';
      backfilled++;
    }
  }
  if (backfilled > 0) {
    sheet.getRange(2, col + 1, data.length, 1).setValues(data);
  }
  return { backfilled: backfilled, total: data.length };
}
