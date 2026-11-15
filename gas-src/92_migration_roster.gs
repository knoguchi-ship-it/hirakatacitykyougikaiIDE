// gas-src/92_migration_roster.gs — 名簿移行（v128）とその修復。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ============================================================
// 名簿移行関数群 (v128)
// ソース: ★会員名簿 スプレッドシート → 2025年度シート
// ============================================================

var ROSTER_SOURCE_SPREADSHEET_ID = '1aNKUc-lsJbc-whDY2SWRQW6I_npYnPloTurnyoQxGPQ';
var ROSTER_SOURCE_SHEET_NAME = '2025年度';
var ROSTER_SOUKAI_DATE_2024 = '2024-05-24';
var ROSTER_SOUKAI_DATE_2025 = '2025-05-23';
var MIGRATION_TARGET_TABLES = ['T_会員', 'T_事業所職員', 'T_認証アカウント', 'T_年会費納入履歴', 'T_年会費更新履歴', 'T_ログイン履歴'];
var MIGRATION_REPORT_SHEETS = {
  summary: '_MIGRATION_SUMMARY',
  map: '_MIGRATION_MAP',
  skipped: '_MIGRATION_SKIPPED',
};
var MIGRATION_STATUS_KEY = 'MIGRATION_RUN_STATUS';
var MIGRATION_RUN_ID_KEY = 'MIGRATION_LAST_RUN_ID';
var MIGRATION_RUN_STARTED_AT_KEY = 'MIGRATION_LAST_RUN_STARTED_AT';
var MIGRATION_RUN_FINISHED_AT_KEY = 'MIGRATION_LAST_RUN_FINISHED_AT';
var MIGRATION_RUN_MODE_KEY = 'MIGRATION_LAST_RUN_MODE';
var MIGRATION_RUN_ERROR_KEY = 'MIGRATION_LAST_RUN_ERROR';
var MIGRATION_LOCK_WAIT_MS = 30000;

/**
 * Phase 1: 移行前バックアップ
 * 対象テーブルの全データを _BAK_yyyyMMdd シートに退避し、
 * 同じスナップショットを別スプレッドシートにも保存する。
 */
function backupBeforeMigration_() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var suffix = '_BAK_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
  var backed = [];
  var externalBackup = createExternalBackupSpreadsheet_(ss, suffix);
  var externalBacked = [];

  for (var i = 0; i < MIGRATION_TARGET_TABLES.length; i++) {
    var tableName = MIGRATION_TARGET_TABLES[i];
    var src = ss.getSheetByName(tableName);
    if (!src || src.getLastRow() < 1) continue;
    var copy = src.copyTo(ss);
    copy.setName(tableName + suffix);
    backed.push(tableName + suffix);

    var externalCopy = src.copyTo(externalBackup.spreadsheet);
    externalCopy.setName(tableName);
    externalBacked.push({
      tableName: tableName,
      rowCount: src.getLastRow(),
      columnCount: src.getLastColumn()
    });
  }

  finalizeExternalBackupSpreadsheet_(externalBackup.spreadsheet, ss, suffix, backed, externalBacked);
  var props = PropertiesService.getScriptProperties();
  props.setProperty(LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY, externalBackup.spreadsheet.getId());
  props.setProperty(LAST_EXTERNAL_BACKUP_SPREADSHEET_URL_KEY, externalBackup.spreadsheet.getUrl());
  props.setProperty(LAST_EXTERNAL_BACKUP_SUFFIX_KEY, suffix);
  Logger.log('バックアップ完了: ' + backed.join(', '));
  Logger.log('外部バックアップ: ' + externalBackup.spreadsheet.getUrl());
  return {
    suffix: suffix,
    tables: backed,
    externalSpreadsheetId: externalBackup.spreadsheet.getId(),
    externalSpreadsheetUrl: externalBackup.spreadsheet.getUrl(),
    externalTables: externalBacked.map(function(item) { return item.tableName; })
  };
}

function createExternalBackupSpreadsheet_(sourceSpreadsheet, suffix) {
  var backupName = DB_BACKUP_SPREADSHEET_NAME_PREFIX + suffix.replace(/^_/, '_');
  var backupSpreadsheet = SpreadsheetApp.create(backupName);
  var manifest = backupSpreadsheet.getSheets()[0];
  manifest.setName(DB_BACKUP_MANIFEST_SHEET);
  manifest.clear();
  manifest.getRange(1, 1, 1, 5).setValues([['section', 'key', 'value', 'rowCount', 'columnCount']]);
  manifest.getRange(2, 1, 5, 5).setValues([
    ['meta', 'createdAt', Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'), '', ''],
    ['meta', 'sourceSpreadsheetId', sourceSpreadsheet.getId(), '', ''],
    ['meta', 'sourceSpreadsheetName', sourceSpreadsheet.getName(), '', ''],
    ['meta', 'backupSuffix', suffix, '', ''],
    ['meta', 'backupSpreadsheetId', backupSpreadsheet.getId(), '', '']
  ]);
  return { spreadsheet: backupSpreadsheet };
}

function finalizeExternalBackupSpreadsheet_(backupSpreadsheet, sourceSpreadsheet, suffix, internalTables, externalTables) {
  var manifest = backupSpreadsheet.getSheetByName(DB_BACKUP_MANIFEST_SHEET);
  if (!manifest) {
    manifest = backupSpreadsheet.insertSheet(DB_BACKUP_MANIFEST_SHEET, 0);
    manifest.getRange(1, 1, 1, 5).setValues([['section', 'key', 'value', 'rowCount', 'columnCount']]);
  }

  var rows = [
    ['meta', 'backupSpreadsheetUrl', backupSpreadsheet.getUrl(), '', ''],
    ['meta', 'tableCount', String(externalTables.length), '', ''],
    ['meta', 'internalBackupSheets', internalTables.join(','), '', ''],
    ['meta', 'sourceSpreadsheetUrl', sourceSpreadsheet.getUrl(), '', '']
  ];

  for (var i = 0; i < externalTables.length; i++) {
    rows.push([
      'table',
      externalTables[i].tableName,
      externalTables[i].tableName + suffix,
      externalTables[i].rowCount,
      externalTables[i].columnCount
    ]);
  }

  manifest.getRange(manifest.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
}

function rollbackMigrationFromBackupSpreadsheet_(backupSpreadsheetId) {
  if (!backupSpreadsheetId) throw new Error('backupSpreadsheetId が必要です');
  var targetSs = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var backupSs = SpreadsheetApp.openById(backupSpreadsheetId);
  var restored = [];

  for (var i = 0; i < MIGRATION_TARGET_TABLES.length; i++) {
    var tableName = MIGRATION_TARGET_TABLES[i];
    var backupSheet = backupSs.getSheetByName(tableName);
    var targetSheet = targetSs.getSheetByName(tableName);
    if (!backupSheet || !targetSheet) continue;

    var backupHeaders = backupSheet.getRange(1, 1, 1, backupSheet.getLastColumn()).getValues()[0];
    var targetHeaders = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn()).getValues()[0];
    if (backupHeaders.join('\t') !== targetHeaders.join('\t')) {
      throw new Error('ヘッダー不一致のため復元中止: ' + tableName);
    }

    if (targetSheet.getLastRow() > 1) {
      targetSheet.deleteRows(2, targetSheet.getLastRow() - 1);
    }

    if (backupSheet.getLastRow() > 1) {
      var values = backupSheet.getRange(2, 1, backupSheet.getLastRow() - 1, backupSheet.getLastColumn()).getValues();
      targetSheet.getRange(2, 1, values.length, values[0].length).setValues(values);
    }

    restored.push(tableName);
  }

  Logger.log('外部バックアップからロールバック完了: ' + restored.join(', '));
  return {
    backupSpreadsheetId: backupSpreadsheetId,
    backupSpreadsheetUrl: backupSs.getUrl(),
    restoredTables: restored
  };
}

function rollbackMigrationFromBackupSpreadsheetJson(backupSpreadsheetId) {
  return JSON.stringify(rollbackMigrationFromBackupSpreadsheet_(backupSpreadsheetId));
}

function restoreSheetFromBackupSpreadsheet_(backupSpreadsheetId, sheetName) {
  if (!backupSpreadsheetId) throw new Error('backupSpreadsheetId が必要です');
  if (!sheetName) throw new Error('sheetName が必要です');
  var targetSs = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var backupSs = SpreadsheetApp.openById(backupSpreadsheetId);
  var backupSheet = backupSs.getSheetByName(sheetName);
  if (!backupSheet) throw new Error('バックアップにシートがありません: ' + sheetName);

  var targetSheet = targetSs.getSheetByName(sheetName);
  var insertIndex = targetSheet ? targetSheet.getIndex() : targetSs.getSheets().length;
  var tempName = '__RESTORE_' + sheetName + '_' + Utilities.getUuid().substring(0, 8);
  var copied = backupSheet.copyTo(targetSs).setName(tempName);
  targetSs.setActiveSheet(copied);
  targetSs.moveActiveSheet(insertIndex);
  if (targetSheet) {
    targetSs.deleteSheet(targetSheet);
  }
  copied.setName(sheetName);
  return {
    backupSpreadsheetId: backupSpreadsheetId,
    backupSpreadsheetUrl: backupSs.getUrl(),
    restoredSheet: sheetName,
    rowCount: Math.max(copied.getLastRow() - 1, 0),
    columnCount: copied.getLastColumn(),
  };
}

function restoreBusinessStaffFromBackupSpreadsheetJson(backupSpreadsheetId) {
  return JSON.stringify(restoreSheetFromBackupSpreadsheet_(backupSpreadsheetId, 'T_事業所職員'));
}

function restoreBusinessStaffFromLatestBackupJson() {
  var latest = inspectLatestBackupSpreadsheet_();
  if (!latest.available) throw new Error('利用可能な外部バックアップがありません。');
  return restoreBusinessStaffFromBackupSpreadsheetJson(latest.spreadsheetId);
}

function restoreBusinessStaffFromVerifiedBackupJson() {
  return restoreBusinessStaffFromBackupSpreadsheetJson('11vgpc0CvCny85QZwapV0gr-YqK5CCl17pRPK-fH0ZKA');
}

function restoreTableFromBackupSpreadsheetJson(backupSpreadsheetId, sheetName) {
  return JSON.stringify(restoreSheetFromBackupSpreadsheet_(backupSpreadsheetId, sheetName));
}

function getBackupSheetHeadersJson(backupSpreadsheetId, sheetName) {
  if (!backupSpreadsheetId) throw new Error('backupSpreadsheetId が必要です');
  if (!sheetName) throw new Error('sheetName が必要です');
  var ss = SpreadsheetApp.openById(backupSpreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('シートが見つかりません: ' + sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return JSON.stringify({ sheetName: sheetName, columnCount: sheet.getLastColumn(), headers: headers });
}

function findMemberByNameJson(lastName) {
  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var matches = memberRows.filter(function(r) {
    return String(r['姓'] || '').indexOf(lastName) >= 0 || String(r['氏名'] || '').indexOf(lastName) >= 0;
  });
  return JSON.stringify(matches.map(function(m) {
    return { 会員ID: m['会員ID'], 姓: m['姓'], 名: m['名'], 代表メールアドレス: m['代表メールアドレス'], 会員種別コード: m['会員種別コード'], 会員状態コード: m['会員状態コード'] };
  }));
}

/**
 * デモアカウントを追加する（append-only, 本番データを削除しない）。
 * 既に存在する場合はスキップする。
 * 名前には [デモ] プレフィックスを付け、本番データと区別できるようにする。
 */
function provisionDemoAccountsJson() {
  var ss = getOrCreateDatabase_();
  var now = new Date().toISOString();

  function makeSalt() { return generateSalt_(); }
  function makeHash(pw, salt) { return hashPasswordCurrent_(pw, salt); }

  var demoPw = 'demo1234';

  var existingMembers = getRowsAsObjects_(ss, 'T_会員').map(function(r) { return String(r['会員ID'] || ''); });
  var existingMemberSet = {};
  existingMembers.forEach(function(id) { existingMemberSet[id] = true; });

  var existingAuth = getRowsAsObjects_(ss, 'T_認証アカウント').map(function(r) { return String(r['ログインID'] || ''); });
  var existingAuthSet = {};
  existingAuth.forEach(function(id) { existingAuthSet[id] = true; });

  var results = [];

  // 1. 個人会員 [デモ] 山田 太郎
  if (!existingMemberSet['DEMO-IND-001']) {
    appendRowsByHeaders_(ss, 'T_会員', [{
      会員ID: 'DEMO-IND-001', 会員種別コード: 'INDIVIDUAL', 会員状態コード: 'ACTIVE',
      入会日: '2024-04-01', 退会日: '', 退会処理日: '',
      姓: '[デモ]山田', 名: '太郎', セイ: 'デモ ヤマダ', メイ: 'タロウ',
      代表メールアドレス: 'demo-ind-001@example.invalid', 携帯電話番号: '',
      勤務先名: '[デモ]枚方ケアプランセンター', 勤務先郵便番号: '573-0027',
      勤務先都道府県: '大阪府', 勤務先市区町村: '枚方市', 勤務先住所: '[デモ]大垣内町1-1-1',
      勤務先電話番号: '072-000-0000', 勤務先FAX番号: '', 自宅郵便番号: '',
      自宅都道府県: '', 自宅市区町村: '', 自宅住所: '',
      発送方法コード: 'EMAIL', 郵送先区分コード: 'OFFICE', 職員数上限: '',
      作成日時: now, 更新日時: now, 削除フラグ: false, 介護支援専門員番号: 'DEMO001', 事業所番号: '',
    }]);
    results.push({ action: 'added', table: 'T_会員', id: 'DEMO-IND-001' });
  } else {
    results.push({ action: 'skipped', table: 'T_会員', id: 'DEMO-IND-001', reason: 'already exists' });
  }
  if (!existingAuthSet['demo-ind-001']) {
    var s1 = makeSalt();
    appendRowsByHeaders_(ss, 'T_認証アカウント', [{
      認証ID: Utilities.getUuid(), 認証方式: 'PASSWORD', ログインID: 'demo-ind-001',
      パスワードハッシュ: makeHash(demoPw, s1), パスワードソルト: s1, GoogleユーザーID: '', Googleメール: '',
      システムロールコード: 'INDIVIDUAL_MEMBER', 会員ID: 'DEMO-IND-001', 職員ID: '',
      最終ログイン日時: '', パスワード更新日時: '', アカウント有効フラグ: true,
      ログイン失敗回数: 0, ロック状態: false, 作成日時: now, 更新日時: now, 削除フラグ: false,
    }]);
    results.push({ action: 'added', table: 'T_認証アカウント', loginId: 'demo-ind-001' });
  } else {
    results.push({ action: 'skipped', table: 'T_認証アカウント', loginId: 'demo-ind-001', reason: 'already exists' });
  }

  // 2. 個人会員 [デモ] 鈴木 花子
  if (!existingMemberSet['DEMO-IND-002']) {
    appendRowsByHeaders_(ss, 'T_会員', [{
      会員ID: 'DEMO-IND-002', 会員種別コード: 'INDIVIDUAL', 会員状態コード: 'ACTIVE',
      入会日: '2024-04-01', 退会日: '', 退会処理日: '',
      姓: '[デモ]鈴木', 名: '花子', セイ: 'デモ スズキ', メイ: 'ハナコ',
      代表メールアドレス: 'demo-ind-002@example.invalid', 携帯電話番号: '',
      勤務先名: '[デモ]花子ケアプラン', 勤務先郵便番号: '573-0027',
      勤務先都道府県: '大阪府', 勤務先市区町村: '枚方市', 勤務先住所: '[デモ]渚西2-2-2',
      勤務先電話番号: '072-000-0001', 勤務先FAX番号: '', 自宅郵便番号: '',
      自宅都道府県: '', 自宅市区町村: '', 自宅住所: '',
      発送方法コード: 'EMAIL', 郵送先区分コード: 'OFFICE', 職員数上限: '',
      作成日時: now, 更新日時: now, 削除フラグ: false, 介護支援専門員番号: 'DEMO002', 事業所番号: '',
    }]);
    results.push({ action: 'added', table: 'T_会員', id: 'DEMO-IND-002' });
  } else {
    results.push({ action: 'skipped', table: 'T_会員', id: 'DEMO-IND-002', reason: 'already exists' });
  }
  if (!existingAuthSet['demo-ind-002']) {
    var s2 = makeSalt();
    appendRowsByHeaders_(ss, 'T_認証アカウント', [{
      認証ID: Utilities.getUuid(), 認証方式: 'PASSWORD', ログインID: 'demo-ind-002',
      パスワードハッシュ: makeHash(demoPw, s2), パスワードソルト: s2, GoogleユーザーID: '', Googleメール: '',
      システムロールコード: 'INDIVIDUAL_MEMBER', 会員ID: 'DEMO-IND-002', 職員ID: '',
      最終ログイン日時: '', パスワード更新日時: '', アカウント有効フラグ: true,
      ログイン失敗回数: 0, ロック状態: false, 作成日時: now, 更新日時: now, 削除フラグ: false,
    }]);
    results.push({ action: 'added', table: 'T_認証アカウント', loginId: 'demo-ind-002' });
  } else {
    results.push({ action: 'skipped', table: 'T_認証アカウント', loginId: 'demo-ind-002', reason: 'already exists' });
  }

  // 3. 事業所会員 [デモ] 代表者 + 管理者 + 一般職員
  if (!existingMemberSet['DEMO-BIZ-001']) {
    appendRowsByHeaders_(ss, 'T_会員', [{
      会員ID: 'DEMO-BIZ-001', 会員種別コード: 'BUSINESS', 会員状態コード: 'ACTIVE',
      入会日: '2024-04-01', 退会日: '', 退会処理日: '',
      姓: '[デモ]佐藤', 名: '次郎', セイ: 'デモ サトウ', メイ: 'ジロウ',
      代表メールアドレス: 'demo-biz@example.invalid', 携帯電話番号: '',
      勤務先名: '[デモ]ひらかた介護ステーション', 勤務先郵便番号: '573-0084',
      勤務先都道府県: '大阪府', 勤務先市区町村: '枚方市', 勤務先住所: '[デモ]香里ケ丘3-3-3',
      勤務先電話番号: '072-222-2222', 勤務先FAX番号: '', 自宅郵便番号: '',
      自宅都道府県: '', 自宅市区町村: '', 自宅住所: '',
      発送方法コード: 'EMAIL', 郵送先区分コード: 'OFFICE', 職員数上限: 10,
      作成日時: now, 更新日時: now, 削除フラグ: false, 介護支援専門員番号: 'DEMO999', 事業所番号: 'DEMO00001',
    }]);
    results.push({ action: 'added', table: 'T_会員', id: 'DEMO-BIZ-001' });
  } else {
    results.push({ action: 'skipped', table: 'T_会員', id: 'DEMO-BIZ-001', reason: 'already exists' });
  }

  var demoStaffDefs = [
    { staffId: 'DEMO-S-REP', loginId: 'demo-biz-rep', role: 'REPRESENTATIVE', systemRole: 'BUSINESS_ADMIN', 姓: '[デモ]佐藤', 名: '次郎（代表）', セイ: 'デモ サトウ', メイ: 'ジロウ' },
    { staffId: 'DEMO-S-ADM', loginId: 'demo-biz-adm', role: 'ADMIN', systemRole: 'BUSINESS_ADMIN', 姓: '[デモ]田中', 名: '三郎（管理者）', セイ: 'デモ タナカ', メイ: 'サブロウ' },
    { staffId: 'DEMO-S-STF', loginId: 'demo-biz-stf', role: 'STAFF', systemRole: 'BUSINESS_MEMBER', 姓: '[デモ]伊藤', 名: '四郎（一般）', セイ: 'デモ イトウ', メイ: 'シロウ' },
  ];

  var existingStaff = getRowsAsObjects_(ss, 'T_事業所職員').map(function(r) { return String(r['職員ID'] || ''); });
  var existingStaffSet = {};
  existingStaff.forEach(function(id) { existingStaffSet[id] = true; });

  demoStaffDefs.forEach(function(def) {
    if (!existingStaffSet[def.staffId]) {
      appendRowsByHeaders_(ss, 'T_事業所職員', [{
        職員ID: def.staffId, 会員ID: 'DEMO-BIZ-001',
        姓: def.姓, 名: def.名, セイ: def.セイ, メイ: def.メイ,
        氏名: def.姓 + ' ' + def.名, フリガナ: def.セイ + ' ' + def.メイ,
        メールアドレス: '', 職員権限コード: def.role, 職員状態コード: 'ENROLLED',
        入会日: '2024-04-01', 退会日: '', 介護支援専門員番号: '', メール配信希望コード: 'YES',
        作成日時: now, 更新日時: now, 削除フラグ: false,
      }]);
      results.push({ action: 'added', table: 'T_事業所職員', staffId: def.staffId });
    } else {
      results.push({ action: 'skipped', table: 'T_事業所職員', staffId: def.staffId, reason: 'already exists' });
    }
    if (!existingAuthSet[def.loginId]) {
      var salt = makeSalt();
      appendRowsByHeaders_(ss, 'T_認証アカウント', [{
        認証ID: Utilities.getUuid(), 認証方式: 'PASSWORD', ログインID: def.loginId,
        パスワードハッシュ: makeHash(demoPw, salt), パスワードソルト: salt, GoogleユーザーID: '', Googleメール: '',
        システムロールコード: def.systemRole, 会員ID: 'DEMO-BIZ-001', 職員ID: def.staffId,
        最終ログイン日時: '', パスワード更新日時: '', アカウント有効フラグ: true,
        ログイン失敗回数: 0, ロック状態: false, 作成日時: now, 更新日時: now, 削除フラグ: false,
      }]);
      results.push({ action: 'added', table: 'T_認証アカウント', loginId: def.loginId });
    } else {
      results.push({ action: 'skipped', table: 'T_認証アカウント', loginId: def.loginId, reason: 'already exists' });
    }
  });

  clearAllDataCache_();
  return JSON.stringify({ ok: true, results: results });
}

function repairWL001LinkageJson(linkedAuthId, linkedMemberId) {
  // Repairs the WL-001 whitelist entry after a seedDemoData incident.
  // Should only be called by an authorized operator via clasp run.
  if (!linkedAuthId) throw new Error('linkedAuthId が必要です');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIdx = {};
  headers.forEach(function(h, i) { colIdx[h] = i; });
  if (sheet.getLastRow() < 2) throw new Error('データ行がありません');
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var wl001Row = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][colIdx['ホワイトリストID']] || '') === 'WL-001') { wl001Row = i; break; }
  }
  if (wl001Row < 0) throw new Error('WL-001 が見つかりません');
  var now = new Date().toISOString();
  if (colIdx['紐付け認証ID'] !== undefined) sheet.getRange(wl001Row + 2, colIdx['紐付け認証ID'] + 1).setValue(linkedAuthId);
  if (colIdx['紐付け会員ID'] !== undefined && linkedMemberId) sheet.getRange(wl001Row + 2, colIdx['紐付け会員ID'] + 1).setValue(linkedMemberId);
  if (colIdx['変更者メール'] !== undefined) sheet.getRange(wl001Row + 2, colIdx['変更者メール'] + 1).setValue('system-repair');
  if (colIdx['変更日時'] !== undefined) sheet.getRange(wl001Row + 2, colIdx['変更日時'] + 1).setValue(now);
  if (colIdx['更新日時'] !== undefined) sheet.getRange(wl001Row + 2, colIdx['更新日時'] + 1).setValue(now);
  return JSON.stringify({ ok: true, wl001Row: wl001Row, linkedAuthId: linkedAuthId, linkedMemberId: linkedMemberId });
}

function listStaffByMemberIdJson(memberId) {
  var ss = getOrCreateDatabase_();
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === String(memberId); });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === String(memberId); });
  var authByStaffId = {};
  authRows.forEach(function(a) { if (a['職員ID']) authByStaffId[String(a['職員ID'])] = a; });
  return JSON.stringify(staffRows.map(function(s) {
    var auth = authByStaffId[String(s['職員ID'] || '')];
    return {
      職員ID: s['職員ID'], 姓: s['姓'], 名: s['名'], 氏名: s['氏名'],
      職員権限コード: s['職員権限コード'], メールアドレス: s['メールアドレス'],
      介護支援専門員番号: s['介護支援専門員番号'],
      authId: auth ? String(auth['認証ID']) : null,
      loginId: auth ? String(auth['ログインID']) : null,
      systemRole: auth ? String(auth['システムロールコード']) : null,
    };
  }));
}

function findAuthByMemberIdJson(memberId) {
  var ss = getOrCreateDatabase_();
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberMatch = memberRows.filter(function(r) { return String(r['会員ID'] || '') === String(memberId); });
  var authMatch = authRows.filter(function(r) { return String(r['会員ID'] || '') === String(memberId); });
  return JSON.stringify({
    memberId: memberId,
    memberFound: memberMatch.map(function(m) { return { 会員ID: m['会員ID'], 姓: m['姓'], 名: m['名'], 会員種別コード: m['会員種別コード'], 会員状態コード: m['会員状態コード'] }; }),
    authFound: authMatch.map(function(a) { return { 認証ID: a['認証ID'], 認証方式: a['認証方式'], ログインID: a['ログインID'], システムロールコード: a['システムロールコード'] }; }),
  });
}

function findMemberByEmailJson(email) {
  var ss = getOrCreateDatabase_();
  var normalizedEmail = String(email || '').toLowerCase().trim();
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberMap = {};
  for (var i = 0; i < memberRows.length; i++) memberMap[String(memberRows[i]['会員ID'] || '')] = memberRows[i];

  var matchedAuths = authRows.filter(function(r) {
    return String(r['Googleメール'] || '').toLowerCase() === normalizedEmail ||
           String(r['ログインID'] || '').toLowerCase() === normalizedEmail;
  });
  var matchedMembers = memberRows.filter(function(r) {
    return String(r['代表メールアドレス'] || '').toLowerCase() === normalizedEmail;
  });
  var authResults = matchedAuths.map(function(a) {
    var mem = memberMap[String(a['会員ID'] || '')] || null;
    return {
      source: 'T_認証アカウント',
      authId: String(a['認証ID'] || ''),
      authMethod: String(a['認証方式'] || ''),
      loginId: String(a['ログインID'] || ''),
      googleEmail: String(a['Googleメール'] || ''),
      systemRole: String(a['システムロールコード'] || ''),
      memberId: String(a['会員ID'] || ''),
      staffId: String(a['職員ID'] || ''),
      memberName: mem ? (String(mem['姓'] || '') + ' ' + String(mem['名'] || '')).trim() : '',
    };
  });
  var memberResults = matchedMembers.map(function(m) {
    return {
      source: 'T_会員',
      memberId: String(m['会員ID'] || ''),
      memberName: (String(m['姓'] || '') + ' ' + String(m['名'] || '')).trim(),
      memberType: String(m['会員種別コード'] || ''),
      email: String(m['代表メールアドレス'] || ''),
      status: String(m['会員状態コード'] || ''),
    };
  });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var matchedStaff = staffRows.filter(function(r) {
    return String(r['メールアドレス'] || '').toLowerCase() === normalizedEmail;
  });
  var staffResults = matchedStaff.map(function(s) {
    var mem = memberMap[String(s['会員ID'] || '')] || null;
    return {
      source: 'T_事業所職員',
      staffId: String(s['職員ID'] || ''),
      memberId: String(s['会員ID'] || ''),
      staffName: (String(s['姓'] || '') + ' ' + String(s['名'] || '') || String(s['氏名'] || '')).trim(),
      role: String(s['職員権限コード'] || ''),
      email: String(s['メールアドレス'] || ''),
      memberName: mem ? (String(mem['姓'] || '') + ' ' + String(mem['名'] || '')).trim() : '',
    };
  });
  return JSON.stringify({ email: email, authResults: authResults, memberResults: memberResults, staffResults: staffResults });
}

function inspectBackupSpreadsheet_(backupSpreadsheetId) {
  if (!backupSpreadsheetId) throw new Error('backupSpreadsheetId が必要です');
  var ss = SpreadsheetApp.openById(backupSpreadsheetId);
  var manifest = ss.getSheetByName(DB_BACKUP_MANIFEST_SHEET);
  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    spreadsheetName: ss.getName(),
    sheetNames: ss.getSheets().map(function(sheet) { return sheet.getName(); }),
    manifestPreview: manifest
      ? manifest.getRange(1, 1, Math.min(manifest.getLastRow(), 12), Math.min(manifest.getLastColumn(), 5)).getValues()
      : []
  };
}

function inspectBackupSpreadsheetJson(backupSpreadsheetId) {
  return JSON.stringify(inspectBackupSpreadsheet_(backupSpreadsheetId));
}

function inspectLatestBackupSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var backupSpreadsheetId = props.getProperty(LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY);
  if (!backupSpreadsheetId) throw new Error('最新の外部バックアップIDが記録されていません');
  var summary = inspectBackupSpreadsheet_(backupSpreadsheetId);
  summary.backupSuffix = props.getProperty(LAST_EXTERNAL_BACKUP_SUFFIX_KEY) || '';
  summary.recordedBackupSpreadsheetUrl = props.getProperty(LAST_EXTERNAL_BACKUP_SPREADSHEET_URL_KEY) || '';
  return summary;
}

function inspectLatestBackupSpreadsheetJson() {
  return JSON.stringify(inspectLatestBackupSpreadsheet_());
}

function getLatestExternalBackupMetadata_() {
  var props = PropertiesService.getScriptProperties();
  var backupSpreadsheetId = props.getProperty(LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY) || '';
  var backupSpreadsheetUrl = props.getProperty(LAST_EXTERNAL_BACKUP_SPREADSHEET_URL_KEY) || '';
  var backupSuffix = props.getProperty(LAST_EXTERNAL_BACKUP_SUFFIX_KEY) || '';
  return {
    spreadsheetId: backupSpreadsheetId,
    spreadsheetUrl: backupSpreadsheetUrl,
    backupSuffix: backupSuffix,
    available: !!backupSpreadsheetId
  };
}

function listInternalBackupSheets_() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  return ss.getSheets().map(function(sheet) {
    return sheet.getName();
  }).filter(function(name) {
    return /_BAK_\d{8}_\d{6}$/.test(String(name || ''));
  });
}

function cleanupInternalBackupSheets_() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var latestExternal = getLatestExternalBackupMetadata_();
  if (!latestExternal.available) {
    throw new Error('外部バックアップ未作成のため、internal backup sheet は削除しません');
  }

  var deleted = [];
  var sheetNames = listInternalBackupSheets_();
  for (var i = 0; i < sheetNames.length; i++) {
    var sheet = ss.getSheetByName(sheetNames[i]);
    if (!sheet) continue;
    ss.deleteSheet(sheet);
    deleted.push(sheetNames[i]);
  }

  return {
    deletedSheetCount: deleted.length,
    deletedSheets: deleted,
    latestExternalBackup: latestExternal
  };
}

function cleanupInternalBackupSheetsJson() {
  return JSON.stringify(cleanupInternalBackupSheets_());
}

/**
 * Phase 2: 移行対象テーブルのデータ行を削除（ヘッダー保持）
 */
function clearMigrationTargets_() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var cleared = [];

  for (var i = 0; i < MIGRATION_TARGET_TABLES.length; i++) {
    var tableName = MIGRATION_TARGET_TABLES[i];
    var sheet = ss.getSheetByName(tableName);
    if (!sheet) continue;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
      cleared.push(tableName + ' (' + (lastRow - 1) + '行削除)');
    }
  }

  Logger.log('クリア完了: ' + cleared.join(', '));
  return cleared;
}

/**
 * ロールバック: バックアップシートからデータを復元する
 */
function rollbackMigration_(backupSuffix) {
  if (!backupSuffix) throw new Error('backupSuffix が必要です');
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var restored = [];

  for (var i = 0; i < MIGRATION_TARGET_TABLES.length; i++) {
    var tableName = MIGRATION_TARGET_TABLES[i];
    var bakSheet = ss.getSheetByName(tableName + backupSuffix);
    if (!bakSheet) continue;

    var target = ss.getSheetByName(tableName);
    if (!target) continue;

    // 既存データ行を削除
    if (target.getLastRow() > 1) {
      target.deleteRows(2, target.getLastRow() - 1);
    }

    // バックアップからデータ行をコピー
    if (bakSheet.getLastRow() > 1) {
      var data = bakSheet.getRange(2, 1, bakSheet.getLastRow() - 1, bakSheet.getLastColumn()).getValues();
      target.getRange(2, 1, data.length, data[0].length).setValues(data);
    }

    restored.push(tableName);
  }

  Logger.log('ロールバック完了: ' + restored.join(', '));
  return restored;
}

function createMigrationRunId_() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyyMMdd'T'HHmmss") + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
}

function updateMigrationRunStatus_(status, runId, mode, errorMessage) {
  var props = PropertiesService.getScriptProperties();
  var now = new Date().toISOString();
  var values = {};
  if (status) values[MIGRATION_STATUS_KEY] = status;
  if (runId) values[MIGRATION_RUN_ID_KEY] = runId;
  if (mode) values[MIGRATION_RUN_MODE_KEY] = mode;
  if (status && status.indexOf('RUNNING') >= 0) {
    values[MIGRATION_RUN_STARTED_AT_KEY] = now;
    values[MIGRATION_RUN_FINISHED_AT_KEY] = '';
    values[MIGRATION_RUN_ERROR_KEY] = '';
  } else {
    values[MIGRATION_RUN_FINISHED_AT_KEY] = now;
    values[MIGRATION_RUN_ERROR_KEY] = errorMessage || '';
  }
  props.setProperties(values, false);
}

function normalizeRosterCellText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeRosterKeyText_(value) {
  return normalizeRosterCellText_(value).replace(/[\s\u3000]+/g, '').toLowerCase();
}

function hasMeaningfulRosterRow_(row, col) {
  var indexes = [
    col.fee2024,
    col.feeIndiv2025,
    col.feeBiz2025,
    col.memberType,
    col.statusEvent,
    col.remarks,
    col.delivery,
    col.mailDest,
    col.email,
    col.workplace,
    col.name,
    col.cmNumber,
    col.furigana,
    col.postalCode,
    col.address1,
    col.address2,
    col.phone,
    col.fax,
    col.otherContact,
  ];
  for (var i = 0; i < indexes.length; i++) {
    if (normalizeRosterCellText_(row[indexes[i]])) return true;
  }
  return false;
}

function pushMigrationSkippedRow_(report, sourceRow, row, col, reasonCode, reason, explicitMemberType, effectiveMemberType) {
  report.skippedRows.push({
    runId: report.runId,
    sourceRow: sourceRow,
    explicitMemberType: explicitMemberType || '',
    effectiveMemberType: effectiveMemberType || '',
    officeName: normalizeRosterCellText_(row[col.workplace]),
    name: normalizeRosterCellText_(row[col.name]),
    furigana: normalizeRosterCellText_(row[col.furigana]),
    cmNumber: normalizeRosterCellText_(row[col.cmNumber]),
    statusEvent: normalizeRosterCellText_(row[col.statusEvent]),
    reasonCode: reasonCode,
    reason: reason,
  });
}

function cloneMigrationRowData_(rowData) {
  return JSON.parse(JSON.stringify(rowData));
}

function buildRosterMergeKey_(rowData) {
  var parts = [rowData.effectiveMemberType];
  if (rowData.rawCmNumber) {
    parts.push('CM', rowData.rawCmNumber);
    parts.push('NAME', normalizeRosterKeyText_(rowData.rawName));
    if (rowData.effectiveMemberType === '事業所') {
      parts.push('OFFICE', normalizeRosterKeyText_(rowData.rawWorkplace));
    }
  } else {
    parts.push('NAME', normalizeRosterKeyText_(rowData.rawName));
    parts.push('MAIL', normalizeRosterKeyText_(rowData.rawEmail));
    if (rowData.effectiveMemberType === '事業所') {
      parts.push('OFFICE', normalizeRosterKeyText_(rowData.rawWorkplace));
    }
  }
  return parts.join('|');
}

function mergeRosterRowData_(base, incoming) {
  var overwriteFields = [
    'statusEvent',
    'rawDelivery',
    'rawName',
    'rawFurigana',
    'rawEmail',
    'rawWorkplace',
    'rawCmNumber',
    'rawPostalCode',
    'rawAddress1',
    'rawAddress2',
    'rawPhone',
    'rawFax',
    'rawOtherContact',
    'rawMailDest',
    'rawRemarks',
    'rawRemarksDate',
    'rawJoinedDate',
    'rawFee2024',
    'rawFeeIndiv2025',
    'rawFeeBiz2025',
  ];
  for (var i = 0; i < overwriteFields.length; i++) {
    var field = overwriteFields[i];
    if (incoming[field] !== '' && incoming[field] !== null && incoming[field] !== undefined) {
      base[field] = incoming[field];
    }
  }
  base.isWithdrawn = base.isWithdrawn || incoming.isWithdrawn;
  base.isNewEntry = base.isNewEntry || incoming.isNewEntry;
  base.isKanjiInFurigana = base.isKanjiInFurigana || incoming.isKanjiInFurigana;
  base.isChangeRow = base.isChangeRow || incoming.isChangeRow;
  base.sourceRows = base.sourceRows.concat(incoming.sourceRows || []);
  base.sourceRows.sort(function(a, b) { return a - b; });
  base.changeSourceRows = (base.changeSourceRows || 0) + (incoming.changeSourceRows || 0);
  base.inferredMemberTypeSourceRows = (base.inferredMemberTypeSourceRows || 0) + (incoming.inferredMemberTypeSourceRows || 0);
  base.memberTypeNote = [base.memberTypeNote, incoming.memberTypeNote].filter(function(v, idx, arr) {
    return !!v && arr.indexOf(v) === idx;
  }).join(' / ');
  return base;
}

function addRosterRowToStore_(store, rowData) {
  var key = buildRosterMergeKey_(rowData);
  rowData.mergeKey = key;
  if (!store[key]) {
    store[key] = cloneMigrationRowData_(rowData);
    return;
  }
  store[key] = mergeRosterRowData_(store[key], rowData);
}

function isPlaceholderRosterValue_(value) {
  var text = normalizeRosterCellText_(value);
  return text === '' || text === 'ー' || text === '一' || text === '-' || text === '―' || text === 'ｰ';
}

function normalizeWideAsciiText_(value) {
  return String(value || '')
    .replace(/[０-９]/g, function(ch) { return String.fromCharCode(ch.charCodeAt(0) - 65248); })
    .replace(/[Ａ-Ｚａ-ｚ]/g, function(ch) { return String.fromCharCode(ch.charCodeAt(0) - 65248); })
    .replace(/　/g, ' ')
    .replace(/：/g, ':');
}

function normalizeRosterKeywordText_(value) {
  return normalizeWideAsciiText_(value)
    .replace(/[\s\u3000]+/g, '')
    .toLowerCase();
}

function cleanRosterWorkplace_(value) {
  return isPlaceholderRosterValue_(value) ? '' : normalizeRosterCellText_(value);
}

function normalizeRosterPhone_(value) {
  if (isPlaceholderRosterValue_(value)) return '';
  var text = normalizeWideAsciiText_(value)
    .replace(/[()]/g, '')
    .replace(/[‐‑‒–—―ーｰ−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[^0-9+\-]/g, '');
  var digits = text.replace(/[^0-9]/g, '');
  if (/^(70|80|90)\d{8}$/.test(digits)) {
    digits = '0' + digits;
  }
  if (/^0(?:70|80|90)\d{8}$/.test(digits)) {
    return digits.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
  }
  return text;
}

function extractPhoneDigits_(value) {
  return normalizeRosterPhone_(value).replace(/[^0-9]/g, '');
}

function looksLikeMobilePhone_(value) {
  return /^0(?:70|80|90)\d{8}$/.test(extractPhoneDigits_(value));
}

function looksLikeFixedLinePhone_(value) {
  var digits = extractPhoneDigits_(value);
  return /^0\d{9,10}$/.test(digits) && !looksLikeMobilePhone_(digits);
}

function normalizeRosterDeliveryCode_(rawDelivery, rawEmail) {
  var keyword = normalizeRosterKeywordText_(rawDelivery);
  if (keyword) {
    if (keyword.indexOf('郵送') >= 0 || keyword.indexOf('郵便') >= 0 || keyword.indexOf('封書') >= 0 || keyword.indexOf('fax') >= 0) {
      return 'POST';
    }
    if (keyword.indexOf('メール') >= 0 || keyword.indexOf('mail') >= 0 || keyword.indexOf('e-mail') >= 0 || keyword.indexOf('email') >= 0) {
      return 'EMAIL';
    }
  }
  return normalizeRosterCellText_(rawEmail) ? 'EMAIL' : 'POST';
}

function normalizeRosterMailDestinationCode_(rawMailDest, defaultCode) {
  var fallback = defaultCode || 'HOME';
  if (isPlaceholderRosterValue_(rawMailDest)) return fallback;
  var keyword = normalizeRosterKeywordText_(rawMailDest);
  if (!keyword) return fallback;
  if (keyword.indexOf('所属先') >= 0 || keyword.indexOf('勤務先') >= 0 || keyword.indexOf('事業所') >= 0) return 'OFFICE';
  if (keyword.indexOf('自宅') >= 0 || keyword.indexOf('本人') >= 0) return 'HOME';
  return fallback;
}

function buildStructuredRosterAddress_(postalCode, rawAddress1, rawAddress2) {
  var addr = parseAddress_(rawAddress1);
  var line1 = normalizeRosterCellText_(addr.street);
  var line2 = normalizeRosterCellText_(rawAddress2);
  return {
    postalCode: normalizeRosterCellText_(postalCode),
    prefecture: normalizeRosterCellText_(addr.prefecture),
    city: normalizeRosterCellText_(addr.city),
    addressLine: line1 ? line1 + (line2 ? ' ' + line2 : '') : line2,
  };
}

function deriveIndividualPhoneFields_(rowData) {
  var primaryPhone = normalizeRosterPhone_(rowData.rawPhone);
  var otherPhone = normalizeRosterPhone_(rowData.rawOtherContact);
  var officePhone = '';
  var mobilePhone = '';

  if (otherPhone) {
    if (looksLikeMobilePhone_(otherPhone)) {
      mobilePhone = otherPhone;
    } else {
      officePhone = otherPhone;
    }
  }
  if (primaryPhone) {
    if (looksLikeMobilePhone_(primaryPhone)) {
      if (!mobilePhone) {
        mobilePhone = primaryPhone;
      } else if (!officePhone) {
        officePhone = primaryPhone;
      }
    } else if (!officePhone) {
      officePhone = primaryPhone;
    }
  }

  return {
    mobilePhone: mobilePhone,
    officePhone: officePhone,
    fax: normalizeRosterPhone_(rowData.rawFax),
  };
}

function pickPreferredBusinessRecordIndex_(staffList) {
  var bestIndex = 0;
  var bestScore = -1;
  for (var i = 0; i < staffList.length; i++) {
    var staff = staffList[i];
    var score = 0;
    if (!staff.isWithdrawn) score += 100;
    if (normalizeRosterMailDestinationCode_(staff.rawMailDest, 'OFFICE') === 'OFFICE') score += 50;
    if (normalizeRosterCellText_(staff.rawEmail)) score += 10;
    if (normalizeRosterCellText_(staff.rawPostalCode) || normalizeRosterCellText_(staff.rawAddress1)) score += 5;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function deriveBusinessOfficeContact_(staffList, preferredIndex) {
  var addressIndex = preferredIndex || 0;
  var addressScore = -1;
  var officePhone = '';
  var fallbackPhone = '';
  var officeFax = '';

  for (var i = 0; i < staffList.length; i++) {
    var staff = staffList[i];
    var score = 0;
    if (!staff.isWithdrawn) score += 100;
    if (normalizeRosterMailDestinationCode_(staff.rawMailDest, 'OFFICE') === 'OFFICE') score += 50;
    if (normalizeRosterCellText_(staff.rawPostalCode)) score += 20;
    if (normalizeRosterCellText_(staff.rawAddress1)) score += 20;
    if (score > addressScore) {
      addressScore = score;
      addressIndex = i;
    }

    var primaryPhone = normalizeRosterPhone_(staff.rawPhone);
    var otherPhone = normalizeRosterPhone_(staff.rawOtherContact);
    var fixedLinePhone = looksLikeFixedLinePhone_(primaryPhone) ? primaryPhone
      : looksLikeFixedLinePhone_(otherPhone) ? otherPhone
        : '';
    if (!officePhone && fixedLinePhone) officePhone = fixedLinePhone;
    if (!fallbackPhone && (primaryPhone || otherPhone)) fallbackPhone = fixedLinePhone || primaryPhone || otherPhone;
    if (!officeFax && normalizeRosterPhone_(staff.rawFax)) officeFax = normalizeRosterPhone_(staff.rawFax);
  }

  var addressSource = staffList[addressIndex] || staffList[preferredIndex || 0] || staffList[0];
  var structured = buildStructuredRosterAddress_(addressSource.rawPostalCode, addressSource.rawAddress1, addressSource.rawAddress2);
  return {
    postalCode: structured.postalCode,
    prefecture: structured.prefecture,
    city: structured.city,
    addressLine: structured.addressLine,
    phone: officePhone || fallbackPhone,
    fax: officeFax,
  };
}

function buildIndividualMigrationMemberRecord_(rowData, memberId, now) {
  var nameParts = splitName_(rowData.rawName);
  var kanaParts = splitName_(rowData.rawFurigana);
  var workplace = cleanRosterWorkplace_(rowData.rawWorkplace);
  var mailDestCode = normalizeRosterMailDestinationCode_(rowData.rawMailDest, 'HOME');
  var address = buildStructuredRosterAddress_(rowData.rawPostalCode, rowData.rawAddress1, rowData.rawAddress2);
  var phones = deriveIndividualPhoneFields_(rowData);
  var withdrawnProcessDate = rowData.isWithdrawn ? (rowData.rawRemarksDate || rowData.rawJoinedDate || '') : '';
  var withdrawnDate = withdrawnProcessDate ? calcFiscalYearEnd_(withdrawnProcessDate) : '';
  var joinedDate = rowData.isNewEntry ? (rowData.rawJoinedDate || rowData.rawRemarksDate || '') : '';

  return {
    会員ID: memberId,
    会員種別コード: 'INDIVIDUAL',
    会員状態コード: rowData.isWithdrawn ? 'WITHDRAWN' : 'ACTIVE',
    入会日: joinedDate,
    退会日: withdrawnDate,
    退会処理日: withdrawnProcessDate,
    姓: nameParts.last,
    名: nameParts.first,
    セイ: kanaParts.last,
    メイ: kanaParts.first,
    代表メールアドレス: normalizeRosterCellText_(rowData.rawEmail),
    携帯電話番号: phones.mobilePhone,
    勤務先名: workplace,
    勤務先郵便番号: mailDestCode === 'OFFICE' ? address.postalCode : '',
    勤務先都道府県: mailDestCode === 'OFFICE' ? address.prefecture : '',
    勤務先市区町村: mailDestCode === 'OFFICE' ? address.city : '',
    勤務先住所: mailDestCode === 'OFFICE' ? address.addressLine : '',
    勤務先電話番号: phones.officePhone,
    勤務先FAX番号: phones.fax,
    自宅郵便番号: mailDestCode === 'HOME' ? address.postalCode : '',
    自宅都道府県: mailDestCode === 'HOME' ? address.prefecture : '',
    自宅市区町村: mailDestCode === 'HOME' ? address.city : '',
    自宅住所: mailDestCode === 'HOME' ? address.addressLine : '',
    発送方法コード: normalizeRosterDeliveryCode_(rowData.rawDelivery, rowData.rawEmail),
    郵送先区分コード: mailDestCode,
    職員数上限: '',
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
    介護支援専門員番号: rowData.rawCmNumber,
    事業所番号: '',
  };
}

function buildBusinessMigrationContext_(staffList) {
  var repIndex = pickPreferredBusinessRecordIndex_(staffList);
  var rep = staffList[repIndex];
  var repNameParts = splitName_(rep.rawName);
  var repKanaParts = splitName_(rep.rawFurigana);
  var officeContact = deriveBusinessOfficeContact_(staffList, repIndex);
  var officeWithdrawn = staffList.every(function(staff) { return staff.isWithdrawn; });
  var officeNewEntry = staffList.some(function(staff) { return staff.isNewEntry; });
  var officeJoinedDate = '';
  var officeWithdrawnDate = '';
  var officeWithdrawnProcessDate = '';

  if (officeNewEntry) {
    for (var i = 0; i < staffList.length; i++) {
      if (staffList[i].isNewEntry) {
        officeJoinedDate = staffList[i].rawJoinedDate || staffList[i].rawRemarksDate || '';
        if (officeJoinedDate) break;
      }
    }
  }
  if (officeWithdrawn) {
    for (var j = 0; j < staffList.length; j++) {
      if (staffList[j].rawRemarksDate || staffList[j].rawJoinedDate) {
        officeWithdrawnProcessDate = staffList[j].rawRemarksDate || staffList[j].rawJoinedDate || '';
        if (officeWithdrawnProcessDate) {
          officeWithdrawnDate = calcFiscalYearEnd_(officeWithdrawnProcessDate);
          break;
        }
      }
    }
  }

  return {
    repIndex: repIndex,
    rep: rep,
    repNameParts: repNameParts,
    repKanaParts: repKanaParts,
    officeContact: officeContact,
    officeWithdrawn: officeWithdrawn,
    officeJoinedDate: officeJoinedDate,
    officeWithdrawnDate: officeWithdrawnDate,
    officeWithdrawnProcessDate: officeWithdrawnProcessDate,
    deliveryCode: normalizeRosterDeliveryCode_(rep.rawDelivery, rep.rawEmail),
  };
}

function buildBusinessMigrationMemberRecord_(staffList, memberId, now, officeName) {
  var context = buildBusinessMigrationContext_(staffList);
  return {
    member: {
      会員ID: memberId,
      会員種別コード: 'BUSINESS',
      会員状態コード: context.officeWithdrawn ? 'WITHDRAWN' : 'ACTIVE',
      入会日: context.officeJoinedDate,
      退会日: context.officeWithdrawnDate,
      退会処理日: context.officeWithdrawnProcessDate,
      姓: context.repNameParts.last,
      名: context.repNameParts.first,
      セイ: context.repKanaParts.last,
      メイ: context.repKanaParts.first,
      代表メールアドレス: normalizeRosterCellText_(context.rep.rawEmail),
      携帯電話番号: '',
      勤務先名: cleanRosterWorkplace_(officeName),
      勤務先郵便番号: context.officeContact.postalCode,
      勤務先都道府県: context.officeContact.prefecture,
      勤務先市区町村: context.officeContact.city,
      勤務先住所: context.officeContact.addressLine,
      勤務先電話番号: context.officeContact.phone,
      勤務先FAX番号: context.officeContact.fax,
      自宅郵便番号: '',
      自宅都道府県: '',
      自宅市区町村: '',
      自宅住所: '',
      発送方法コード: context.deliveryCode,
      郵送先区分コード: 'OFFICE',
      職員数上限: '',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
      介護支援専門員番号: '',
      事業所番号: '',
    },
    context: context,
  };
}

function buildBusinessMigrationStaffRecord_(staffRow, memberId, staffId, isRepresentative, now, context) {
  var withdrawnDate = '';
  if (staffRow.isWithdrawn) {
    withdrawnDate = staffRow.rawRemarksDate || staffRow.rawJoinedDate || context.officeWithdrawnDate || '';
  }
  var nameParts = splitName_(normalizeRosterCellText_(staffRow.rawName));
  var kanaParts = splitName_(normalizeRosterCellText_(staffRow.rawFurigana));
  return {
    職員ID: staffId,
    会員ID: memberId,
    姓: nameParts.last,
    名: nameParts.first,
    セイ: kanaParts.last,
    メイ: kanaParts.first,
    氏名: joinHumanNameParts_(nameParts.last, nameParts.first),
    フリガナ: joinHumanNameParts_(kanaParts.last, kanaParts.first),
    メールアドレス: normalizeRosterCellText_(staffRow.rawEmail),
    職員権限コード: isRepresentative ? 'REPRESENTATIVE' : 'STAFF',
    職員状態コード: staffRow.isWithdrawn ? 'LEFT' : 'ENROLLED',
    入会日: staffRow.isNewEntry ? (staffRow.rawJoinedDate || staffRow.rawRemarksDate || '') : '',
    退会日: withdrawnDate,
    介護支援専門員番号: normalizeRosterCellText_(staffRow.rawCmNumber),
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  };
}

function appendMigrationMapRows_(report, rowData, targetMemberId, targetStaffId, targetLoginId, targetType) {
  var mergedSourceRows = (rowData.sourceRows || []).join(',');
  var notes = [];
  if (rowData.memberTypeNote) notes.push(rowData.memberTypeNote);
  if (rowData.isChangeRow) notes.push('変更行を最新値として採用');
  if (rowData.inferredMemberTypeSourceRows) notes.push('D列空行を事業所職員として補完');
  if ((rowData.sourceRows || []).length > 1) notes.push('複数行を統合');
  var noteText = notes.join(' / ');
  for (var i = 0; i < rowData.sourceRows.length; i++) {
    report.mapRows.push({
      runId: report.runId,
      sourceRow: rowData.sourceRows[i],
      mergedSourceRows: mergedSourceRows,
      explicitMemberType: rowData.explicitMemberType || '',
      effectiveMemberType: rowData.effectiveMemberType || '',
      officeName: rowData.rawWorkplace || '',
      name: rowData.rawName || '',
      cmNumber: rowData.rawCmNumber || '',
      statusEvent: rowData.statusEvent || '',
      mergeKey: rowData.mergeKey || '',
      targetType: targetType,
      targetMemberId: targetMemberId || '',
      targetStaffId: targetStaffId || '',
      targetLoginId: targetLoginId || '',
      notes: noteText,
    });
  }
}

function writeObjectRowsToSheet_(ss, sheetName, headers, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clearContents();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (!rows || rows.length === 0) return;
  var values = rows.map(function(row) {
    return headers.map(function(header) {
      return row[header] !== undefined ? row[header] : '';
    });
  });
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function buildMigrationSummaryRows_(result, verification, backupSuffix) {
  var stats = result.stats || {};
  var rows = [];
  function add(item, value) {
    rows.push({
      runId: result.runId,
      mode: result.dryRun ? 'DRY_RUN' : 'EXECUTE',
      item: item,
      value: value,
    });
  }
  add('status', verification ? (verification.integrityOk ? 'OK' : 'INTEGRITY_ERROR') : 'READY');
  add('totalRows', stats.totalRows || 0);
  add('processedSourceRows', result.sourceCoverage ? result.sourceCoverage.processed : 0);
  add('skippedRows', stats.skippedRows || 0);
  add('emptyRows', stats.emptyRows || 0);
  add('orphanRows', stats.orphanRows || 0);
  add('changeRows', stats.changeRows || 0);
  add('mergedRows', stats.mergedRows || 0);
  add('individualMembers', stats.individualMembers || 0);
  add('businessGroups', stats.businessGroups || 0);
  add('businessStaff', stats.businessStaff || 0);
  add('withdrawnMembers', stats.withdrawnMembers || 0);
  add('kanjiFurigana', stats.kanjiFurigana || 0);
  add('authAccounts', stats.authAccounts || 0);
  add('annualFeeRecords', stats.annualFeeRecords || 0);
  add('autoLoginIds', stats.autoLoginIds || 0);
  add('warnings', (result.warnings || []).length);
  add('errors', (result.errors || []).length);
  if (backupSuffix) add('backupSuffix', backupSuffix);
  if (verification) {
    add('integrityOk', verification.integrityOk ? 'true' : 'false');
    add('integrityErrorCount', (verification.integrityErrors || []).length);
  }
  return rows;
}

function writeMigrationReports_(result, verification, backupSuffix) {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var report = result._report || { runId: result.runId, mapRows: [], skippedRows: [] };
  writeObjectRowsToSheet_(ss, MIGRATION_REPORT_SHEETS.summary, ['runId', 'mode', 'item', 'value'], buildMigrationSummaryRows_(result, verification, backupSuffix));
  writeObjectRowsToSheet_(ss, MIGRATION_REPORT_SHEETS.map, ['runId', 'sourceRow', 'mergedSourceRows', 'explicitMemberType', 'effectiveMemberType', 'officeName', 'name', 'cmNumber', 'statusEvent', 'mergeKey', 'targetType', 'targetMemberId', 'targetStaffId', 'targetLoginId', 'notes'], report.mapRows || []);
  writeObjectRowsToSheet_(ss, MIGRATION_REPORT_SHEETS.skipped, ['runId', 'sourceRow', 'explicitMemberType', 'effectiveMemberType', 'officeName', 'name', 'furigana', 'cmNumber', 'statusEvent', 'reasonCode', 'reason'], report.skippedRows || []);
}

function normalizeNameKey_(lastName, firstName) {
  return normalizeRosterKeyText_([lastName || '', firstName || ''].join(''));
}

function normalizeComparableRosterValue_(value) {
  var normalized = normalizeRosterCellText_(value);
  if (normalized === 'ー' || normalized === '一' || normalized === '-') return '';
  return normalized;
}

function getLatestMigrationRunId_() {
  return PropertiesService.getScriptProperties().getProperty(MIGRATION_RUN_ID_KEY) || '';
}

function compareExpectedAndActualField_(mismatches, fieldName, expectedValue, actualValue, context) {
  if (normalizeRosterKeyText_(normalizeComparableRosterValue_(expectedValue)) !== normalizeRosterKeyText_(normalizeComparableRosterValue_(actualValue))) {
    mismatches.push({
      field: fieldName,
      expected: expectedValue || '',
      actual: actualValue || '',
      context: context,
    });
  }
}

function buildLooseIdKeys_(value) {
  var raw = String(value == null ? '' : value).trim();
  if (!raw) return [];
  var keys = {};
  keys[raw] = true;
  if (/^\d+$/.test(raw)) {
    keys[String(Number(raw))] = true;
    keys[raw.replace(/^0+/, '') || '0'] = true;
  }
  return Object.keys(keys);
}

function setRowByLooseId_(index, value, row) {
  var keys = buildLooseIdKeys_(value);
  for (var i = 0; i < keys.length; i++) {
    index[keys[i]] = row;
  }
}

function setValueByLooseId_(index, value, payload) {
  var keys = buildLooseIdKeys_(value);
  for (var i = 0; i < keys.length; i++) {
    index[keys[i]] = payload;
  }
}

function getRowByLooseId_(index, value) {
  var keys = buildLooseIdKeys_(value);
  for (var i = 0; i < keys.length; i++) {
    if (index[keys[i]]) return index[keys[i]];
  }
  return null;
}

function reconcileMigrationWithSource(runId) {
  var targetRunId = runId ? String(runId) : getLatestMigrationRunId_();
  if (!targetRunId) throw new Error('runId が特定できません。');

  var source = readRosterSource_();
  var data = source.data;
  var col = source.colMap;
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);

  var mapRows = getRowsAsObjects_(ss, MIGRATION_REPORT_SHEETS.map).filter(function(row) {
    return String(row['runId'] || '') === targetRunId;
  });
  var skippedRows = getRowsAsObjects_(ss, MIGRATION_REPORT_SHEETS.skipped).filter(function(row) {
    return String(row['runId'] || '') === targetRunId;
  });
  var members = getRowsAsObjects_(ss, 'T_会員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var auths = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var creds = getRowsAsObjects_(ss, '_CREDENTIALS_TEMP');

  var memberById = {};
  var staffById = {};
  var authByLoginId = {};
  var authByMemberId = {};
  var authByStaffId = {};
  var memberIndexById = {};
  var staffIndexById = {};
  var coveredRows = {};
  var mismatches = [];
  var individualMemberIndexByKey = {};
  var businessMemberIndexByKey = {};
  var staffIndexesByMemberId = {};
  var usedIndividualIndexes = {};
  var usedBusinessStaffIndexesByMemberId = {};

  for (var mi = 0; mi < members.length; mi++) {
    setRowByLooseId_(memberById, members[mi]['会員ID'], members[mi]);
    setValueByLooseId_(memberIndexById, members[mi]['会員ID'], mi);
    if (String(members[mi]['会員種別コード'] || '') === 'INDIVIDUAL') {
      var individualKeys = buildIndividualMemberMatchKeysFromRow_(members[mi]);
      for (var mik = 0; mik < individualKeys.length; mik++) addMatchIndex_(individualMemberIndexByKey, individualKeys[mik], mi);
    } else if (String(members[mi]['会員種別コード'] || '') === 'BUSINESS') {
      addMatchIndex_(businessMemberIndexByKey, buildBusinessMemberMatchKey_(members[mi]['勤務先名'] || ''), mi);
    }
  }
  for (var si = 0; si < staffs.length; si++) {
    setRowByLooseId_(staffById, staffs[si]['職員ID'], staffs[si]);
    setValueByLooseId_(staffIndexById, staffs[si]['職員ID'], si);
    var staffMemberId = String(staffs[si]['会員ID'] || '');
    if (!staffIndexesByMemberId[staffMemberId]) staffIndexesByMemberId[staffMemberId] = [];
    staffIndexesByMemberId[staffMemberId].push(si);
  }
  for (var ai = 0; ai < auths.length; ai++) {
    setRowByLooseId_(authByLoginId, auths[ai]['ログインID'], auths[ai]);
    if (String(auths[ai]['会員ID'] || '')) setRowByLooseId_(authByMemberId, auths[ai]['会員ID'], auths[ai]);
    if (String(auths[ai]['職員ID'] || '')) setRowByLooseId_(authByStaffId, auths[ai]['職員ID'], auths[ai]);
  }

  for (var sri = 0; sri < skippedRows.length; sri++) {
    var skippedRowNo = Number(skippedRows[sri]['sourceRow'] || 0);
    coveredRows[skippedRowNo] = true;
    var skippedSource = data[skippedRowNo - 2];
    if (!skippedSource) {
      mismatches.push({ field: 'skippedRow', expected: 'source row exists', actual: 'missing', context: 'sourceRow=' + skippedRowNo });
      continue;
    }
    if (String(skippedRows[sri]['reasonCode'] || '') !== 'EMPTY_ROW') {
      mismatches.push({ field: 'skippedReason', expected: 'EMPTY_ROW', actual: String(skippedRows[sri]['reasonCode'] || ''), context: 'sourceRow=' + skippedRowNo });
    }
    if (hasMeaningfulRosterRow_(skippedSource, col)) {
      mismatches.push({ field: 'skippedMeaningfulData', expected: 'empty row', actual: 'meaningful data found', context: 'sourceRow=' + skippedRowNo });
    }
  }

  for (var mri = 0; mri < mapRows.length; mri++) {
    var mapRow = mapRows[mri];
    var sourceRowNo = Number(mapRow['sourceRow'] || 0);
    coveredRows[sourceRowNo] = true;
    var sourceRow = data[sourceRowNo - 2];
    if (!sourceRow) {
      mismatches.push({ field: 'mappedRow', expected: 'source row exists', actual: 'missing', context: 'sourceRow=' + sourceRowNo });
      continue;
    }

    var sourceName = normalizeRosterCellText_(sourceRow[col.name]);
    var sourceFurigana = normalizeRosterCellText_(sourceRow[col.furigana]);
    var sourceStatus = normalizeRosterCellText_(sourceRow[col.statusEvent]);
    var sourceCm = normalizeRosterCellText_(sourceRow[col.cmNumber]).replace(/[^0-9]/g, '');
    var sourceWorkplace = normalizeRosterCellText_(sourceRow[col.workplace]);
    var sourceEmail = normalizeRosterCellText_(sourceRow[col.email]);
    var sourceEffectiveName = (isKanjiFurigana_(sourceFurigana) && !sourceName) ? sourceFurigana : sourceName;
    var context = 'sourceRow=' + sourceRowNo + ',targetType=' + String(mapRow['targetType'] || '');
    var sourceMatchRow = {
      rawName: sourceEffectiveName,
      rawEmail: sourceEmail,
      rawWorkplace: sourceWorkplace,
      rawCmNumber: sourceCm,
    };

    if (String(mapRow['targetType'] || '') === 'INDIVIDUAL_MEMBER') {
      var targetMember = getRowByLooseId_(memberById, mapRow['targetMemberId']);
      if (!targetMember) {
        var fallbackMemberIndex = claimMatchedIndex_(individualMemberIndexByKey, buildIndividualMemberMatchKeysFromSource_(sourceMatchRow), usedIndividualIndexes);
        if (fallbackMemberIndex >= 0) {
          targetMember = members[fallbackMemberIndex];
        }
      } else {
        var resolvedMemberIndex = getRowByLooseId_(memberIndexById, mapRow['targetMemberId']);
        if (resolvedMemberIndex != null) usedIndividualIndexes[resolvedMemberIndex] = true;
      }
      if (!targetMember) {
        mismatches.push({ field: 'targetMember', expected: String(mapRow['targetMemberId'] || ''), actual: 'missing', context: context });
        continue;
      }
      compareExpectedAndActualField_(mismatches, 'name', sourceEffectiveName, [targetMember['姓'] || '', targetMember['名'] || ''].join(' '), context);
      compareExpectedAndActualField_(mismatches, 'workplace', sourceWorkplace, targetMember['勤務先名'] || '', context);
      compareExpectedAndActualField_(mismatches, 'cmNumber', sourceCm, targetMember['介護支援専門員番号'] || '', context);
      var expectedMemberState = (sourceStatus === '退会' || isKanjiFurigana_(sourceFurigana)) ? 'WITHDRAWN' : 'ACTIVE';
      compareExpectedAndActualField_(mismatches, 'memberState', expectedMemberState, targetMember['会員状態コード'] || '', context);
      var targetAuth = getRowByLooseId_(authByLoginId, mapRow['targetLoginId']);
      if (!targetAuth) targetAuth = getRowByLooseId_(authByMemberId, targetMember['会員ID']);
      if (!targetAuth) {
        mismatches.push({ field: 'auth', expected: String(mapRow['targetLoginId'] || ''), actual: 'missing', context: context });
      }
    } else if (String(mapRow['targetType'] || '') === 'BUSINESS_STAFF') {
      var targetStaff = getRowByLooseId_(staffById, mapRow['targetStaffId']);
      var targetBizMember = getRowByLooseId_(memberById, mapRow['targetMemberId']);
      if (!targetBizMember) {
        var businessMemberCandidates = businessMemberIndexByKey[buildBusinessMemberMatchKey_(sourceWorkplace)] || [];
        if (businessMemberCandidates.length) {
          targetBizMember = members[businessMemberCandidates[0]];
        }
      }
      if (!targetStaff && targetBizMember) {
        var targetBizMemberId = String(targetBizMember['会員ID'] || '');
        var currentStaffIndexes = staffIndexesByMemberId[targetBizMemberId] || [];
        var currentStaffKeyMap = {};
        for (var csi = 0; csi < currentStaffIndexes.length; csi++) {
          var staffIndex = currentStaffIndexes[csi];
          var staffKeys = buildBusinessStaffMatchKeysFromRow_(staffs[staffIndex], sourceWorkplace);
          for (var sk = 0; sk < staffKeys.length; sk++) addMatchIndex_(currentStaffKeyMap, staffKeys[sk], staffIndex);
        }
        if (!usedBusinessStaffIndexesByMemberId[targetBizMemberId]) usedBusinessStaffIndexesByMemberId[targetBizMemberId] = {};
        var fallbackStaffIndex = claimMatchedIndex_(currentStaffKeyMap, buildBusinessStaffMatchKeysFromSource_(sourceMatchRow, sourceWorkplace), usedBusinessStaffIndexesByMemberId[targetBizMemberId]);
        if (fallbackStaffIndex >= 0) {
          targetStaff = staffs[fallbackStaffIndex];
        }
      } else if (targetStaff) {
        var resolvedStaffIndex = getRowByLooseId_(staffIndexById, mapRow['targetStaffId']);
        var resolvedTargetMemberId = targetBizMember ? String(targetBizMember['会員ID'] || '') : '';
        if (resolvedStaffIndex != null && resolvedTargetMemberId) {
          if (!usedBusinessStaffIndexesByMemberId[resolvedTargetMemberId]) usedBusinessStaffIndexesByMemberId[resolvedTargetMemberId] = {};
          usedBusinessStaffIndexesByMemberId[resolvedTargetMemberId][resolvedStaffIndex] = true;
        }
      }
      if (!targetStaff) {
        mismatches.push({ field: 'targetStaff', expected: String(mapRow['targetStaffId'] || ''), actual: 'missing', context: context });
        continue;
      }
      if (!targetBizMember) {
        mismatches.push({ field: 'targetMember', expected: String(mapRow['targetMemberId'] || ''), actual: 'missing', context: context });
        continue;
      }
      compareExpectedAndActualField_(mismatches, 'staffName', sourceEffectiveName, targetStaff['氏名'] || '', context);
      compareExpectedAndActualField_(mismatches, 'officeName', sourceWorkplace, targetBizMember['勤務先名'] || '', context);
      compareExpectedAndActualField_(mismatches, 'cmNumber', sourceCm, targetStaff['介護支援専門員番号'] || '', context);
      var expectedStaffState = (sourceStatus === '退会' || isKanjiFurigana_(sourceFurigana)) ? 'LEFT' : 'ENROLLED';
      compareExpectedAndActualField_(mismatches, 'staffState', expectedStaffState, targetStaff['職員状態コード'] || '', context);
      var targetBizAuth = getRowByLooseId_(authByLoginId, mapRow['targetLoginId']);
      if (!targetBizAuth) targetBizAuth = getRowByLooseId_(authByStaffId, targetStaff['職員ID']);
      if (!targetBizAuth) {
        mismatches.push({ field: 'auth', expected: String(mapRow['targetLoginId'] || ''), actual: 'missing', context: context });
      }
    } else {
      mismatches.push({ field: 'targetType', expected: 'known target type', actual: String(mapRow['targetType'] || ''), context: context });
    }
  }

  for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
    var actualRowNo = rowIndex + 2;
    if (!coveredRows[actualRowNo]) {
      mismatches.push({ field: 'sourceCoverage', expected: 'covered', actual: 'not covered', context: 'sourceRow=' + actualRowNo });
    }
  }

  var credentialRows = creds.filter(function(row) {
    return String(row['ログインID'] || '') !== 'ログインID';
  });

  return {
    runId: targetRunId,
    sourceRowCount: data.length,
    mappedRowCount: mapRows.length,
    skippedRowCount: skippedRows.length,
    credentialCount: credentialRows.length,
    memberCount: members.length,
    staffCount: staffs.length,
    authCount: auths.length,
    mismatchCount: mismatches.length,
    mismatches: mismatches.slice(0, 200),
    ok: mismatches.length === 0,
  };
}

function debugReconcileLookup_() {
  var targetRunId = getLatestMigrationRunId_();
  if (!targetRunId) throw new Error('runId が特定できません。');
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var mapRows = getRowsAsObjects_(ss, MIGRATION_REPORT_SHEETS.map).filter(function(row) {
    return String(row['runId'] || '') === targetRunId;
  });
  var members = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });
  var memberById = {};
  for (var mi = 0; mi < members.length; mi++) setRowByLooseId_(memberById, members[mi]['会員ID'], members[mi]);
  var firstMap = mapRows[0] || null;
  var firstMember = members[0] || null;
  return {
    runId: targetRunId,
    firstMapRow: firstMap,
    firstMapLookupKeys: firstMap ? buildLooseIdKeys_(firstMap['targetMemberId']) : [],
    firstResolvedMemberId: firstMap ? (getRowByLooseId_(memberById, firstMap['targetMemberId']) || {})['会員ID'] || '' : '',
    firstMemberRow: firstMember,
    firstMemberKeys: firstMember ? buildLooseIdKeys_(firstMember['会員ID']) : [],
    sampleMemberIds: members.slice(0, 10).map(function(row) { return row['会員ID']; }),
    sampleMapTargetMemberIds: mapRows.slice(0, 10).map(function(row) { return row['targetMemberId']; })
  };
}

function debugReconcileLookupJson() {
  return JSON.stringify(debugReconcileLookup_());
}

function inspectMigrationRow(sourceRow, runId) {
  var targetRunId = runId ? String(runId) : getLatestMigrationRunId_();
  var rowNumber = Number(sourceRow || 0);
  if (!targetRunId) throw new Error('runId が特定できません。');
  if (rowNumber < 2) throw new Error('sourceRow は 2 以上を指定してください。');

  var source = readRosterSource_();
  var data = source.data;
  var col = source.colMap;
  var row = data[rowNumber - 2];
  if (!row) throw new Error('sourceRow が範囲外です: ' + rowNumber);

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var mapRows = getRowsAsObjects_(ss, MIGRATION_REPORT_SHEETS.map).filter(function(mapRow) {
    return String(mapRow['runId'] || '') === targetRunId && Number(mapRow['sourceRow'] || 0) === rowNumber;
  });
  var memberById = {};
  var staffById = {};
  var authByLoginId = {};
  var members = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var auths = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  for (var mi = 0; mi < members.length; mi++) memberById[String(members[mi]['会員ID'] || '')] = members[mi];
  for (var si = 0; si < staffs.length; si++) staffById[String(staffs[si]['職員ID'] || '')] = staffs[si];
  for (var ai = 0; ai < auths.length; ai++) authByLoginId[String(auths[ai]['ログインID'] || '')] = auths[ai];

  return {
    runId: targetRunId,
    sourceRow: rowNumber,
    source: {
      memberType: normalizeRosterCellText_(row[col.memberType]),
      statusEvent: normalizeRosterCellText_(row[col.statusEvent]),
      remarks: normalizeRosterCellText_(row[col.remarks]),
      mailDest: normalizeRosterCellText_(row[col.mailDest]),
      email: normalizeRosterCellText_(row[col.email]),
      workplace: normalizeRosterCellText_(row[col.workplace]),
      name: normalizeRosterCellText_(row[col.name]),
      cmNumber: normalizeRosterCellText_(row[col.cmNumber]),
      furigana: normalizeRosterCellText_(row[col.furigana]),
    },
    mapRows: mapRows.map(function(mapRow) {
      return {
        map: mapRow,
        member: memberById[String(mapRow['targetMemberId'] || '')] || null,
        staff: staffById[String(mapRow['targetStaffId'] || '')] || null,
        auth: authByLoginId[String(mapRow['targetLoginId'] || '')] || null,
      };
    }),
  };
}

function inspectMigrationRowJson(sourceRow, runId) {
  return JSON.stringify(inspectMigrationRow(sourceRow, runId));
}

function inspectAdminWhitelistLinkage(googleEmail) {
  var email = String(googleEmail || '').trim().toLowerCase();
  if (!email) throw new Error('googleEmail は必須です。');

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['Googleメール'] || '').trim().toLowerCase() === email;
  });
  if (!whitelistRows.length) {
    return { googleEmail: email, found: false };
  }

  var row = whitelistRows[0];
  var linkedAuthId = String(row['紐付け認証ID'] || '');
  var linkedMemberId = String(row['紐付け会員ID'] || '');
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });

  var linkedAuth = null;
  var linkedMember = null;
  var linkedStaff = null;

  for (var ai = 0; ai < authRows.length; ai++) {
    if (String(authRows[ai]['認証ID'] || '') === linkedAuthId) {
      linkedAuth = authRows[ai];
      break;
    }
  }
  var effectiveMemberId = linkedMemberId || String((linkedAuth && linkedAuth['会員ID']) || '');
  var effectiveStaffId = String((linkedAuth && linkedAuth['職員ID']) || '');

  for (var mi = 0; mi < memberRows.length; mi++) {
    if (String(memberRows[mi]['会員ID'] || '') === effectiveMemberId) {
      linkedMember = memberRows[mi];
      break;
    }
  }
  for (var si = 0; si < staffRows.length; si++) {
    if (String(staffRows[si]['職員ID'] || '') === effectiveStaffId) {
      linkedStaff = staffRows[si];
      break;
    }
  }

  return {
    found: true,
    googleEmail: email,
    whitelist: row,
    linkedAuth: linkedAuth,
    linkedMember: linkedMember,
    linkedStaff: linkedStaff,
    linkageOk: !!(linkedAuth && linkedMember),
  };
}

function inspectAdminWhitelistLinkageJson(googleEmail) {
  return JSON.stringify(inspectAdminWhitelistLinkage(googleEmail));
}

function inspectDefaultAdminWhitelistLinkageJson() {
  return inspectAdminWhitelistLinkageJson('k.noguchi@uguisunosato.or.jp');
}

function inspectRecordsByEmail(email) {
  var normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('email is required.');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['代表メールアドレス'] || '').trim().toLowerCase() === normalizedEmail;
  }).map(function(row) {
    return {
      memberId: String(row['会員ID'] || ''),
      memberType: String(row['会員種別コード'] || ''),
      memberStatus: String(row['会員状態コード'] || ''),
      name: (String(row['姓'] || '') + ' ' + String(row['名'] || '')).trim(),
      officeName: String(row['勤務先名'] || ''),
      representativeEmail: String(row['代表メールアドレス'] || ''),
    };
  });

  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['メールアドレス'] || '').trim().toLowerCase() === normalizedEmail;
  }).map(function(row) {
    return {
      staffId: String(row['職員ID'] || ''),
      memberId: String(row['会員ID'] || ''),
      name: String(row['氏名'] || ''),
      staffRoleCode: String(row['職員権限コード'] || ''),
      staffStatus: String(row['職員状態コード'] || ''),
      email: String(row['メールアドレス'] || ''),
    };
  });

  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    var googleEmail = String(row['Googleメール'] || '').trim().toLowerCase();
    var loginId = String(row['ログインID'] || '').trim().toLowerCase();
    return googleEmail === normalizedEmail || loginId === normalizedEmail;
  }).map(function(row) {
    return {
      authId: String(row['認証ID'] || ''),
      authMethod: String(row['認証方式'] || ''),
      loginId: String(row['ログインID'] || ''),
      googleEmail: String(row['Googleメール'] || ''),
      roleCode: String(row['システムロールコード'] || ''),
      memberId: String(row['会員ID'] || ''),
      staffId: String(row['職員ID'] || ''),
      enabled: toBoolean_(row['アカウント有効フラグ']),
      locked: toBoolean_(row['ロック状態']),
    };
  });

  var matchedMemberIds = {};
  var matchedStaffIds = {};
  for (var mi = 0; mi < memberRows.length; mi += 1) matchedMemberIds[String(memberRows[mi].memberId || '')] = true;
  for (var si = 0; si < staffRows.length; si += 1) {
    matchedMemberIds[String(staffRows[si].memberId || '')] = true;
    matchedStaffIds[String(staffRows[si].staffId || '')] = true;
  }
  var candidateAuths = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    var memberId = String(row['会員ID'] || '');
    var staffId = String(row['職員ID'] || '');
    return !!matchedMemberIds[memberId] || !!matchedStaffIds[staffId];
  }).map(function(row) {
    return {
      authId: String(row['認証ID'] || ''),
      authMethod: String(row['認証方式'] || ''),
      loginId: String(row['ログインID'] || ''),
      googleEmail: String(row['Googleメール'] || ''),
      roleCode: String(row['システムロールコード'] || ''),
      memberId: String(row['会員ID'] || ''),
      staffId: String(row['職員ID'] || ''),
      enabled: toBoolean_(row['アカウント有効フラグ']),
      locked: toBoolean_(row['ロック状態']),
    };
  });

  return {
    email: normalizedEmail,
    members: memberRows,
    staffs: staffRows,
    auths: authRows,
    candidateAuths: candidateAuths,
  };
}

function inspectRecordsByEmailJson(email) {
  return JSON.stringify(inspectRecordsByEmail(email));
}

function inspectDefaultAdminRecordsByEmailJson() {
  return inspectRecordsByEmailJson('k.noguchi@uguisunosato.or.jp');
}

function inspectAuthCandidatesByIds(memberId, staffId) {
  var normalizedMemberId = String(memberId || '').trim();
  var normalizedStaffId = String(staffId || '').trim();
  if (!normalizedMemberId && !normalizedStaffId) throw new Error('memberId or staffId is required.');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  return getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    return String(row['会員ID'] || '') === normalizedMemberId || String(row['職員ID'] || '') === normalizedStaffId;
  }).map(function(row) {
    return {
      authId: String(row['認証ID'] || ''),
      authMethod: String(row['認証方式'] || ''),
      loginId: String(row['ログインID'] || ''),
      googleEmail: String(row['Googleメール'] || ''),
      roleCode: String(row['システムロールコード'] || ''),
      memberId: String(row['会員ID'] || ''),
      staffId: String(row['職員ID'] || ''),
      enabled: toBoolean_(row['アカウント有効フラグ']),
      locked: toBoolean_(row['ロック状態']),
    };
  });
}

function inspectAuthCandidatesByIdsJson(memberId, staffId) {
  return JSON.stringify(inspectAuthCandidatesByIds(memberId, staffId));
}

function inspectDefaultAdminAuthCandidatesJson() {
  return inspectAuthCandidatesByIdsJson('4539021', '09740b4f-c1a5-4248-a0d6-8ffabf08810c');
}

function repairDefaultAdminWhitelistLinkage() {
  var email = 'k.noguchi@uguisunosato.or.jp';
  var linkage = inspectAdminWhitelistLinkage(email);
  if (linkage.linkageOk) return linkage;

  var records = inspectRecordsByEmail(email);
  if (records.staffs.length !== 1) {
    throw new Error('対象メールに対応する職員が一意に定まりません。 staffCount=' + records.staffs.length);
  }

  var staff = records.staffs[0];
  var authCandidates = inspectAuthCandidatesByIds(staff.memberId, staff.staffId);
  var selectedAuth = null;
  for (var i = 0; i < authCandidates.length; i += 1) {
    if (String(authCandidates[i].staffId || '') === String(staff.staffId || '') && authCandidates[i].enabled && !authCandidates[i].locked) {
      selectedAuth = authCandidates[i];
      break;
    }
  }
  if (!selectedAuth) {
    throw new Error('対象職員に対応する有効な認証アカウントが見つかりません。 staffId=' + staff.staffId);
  }

  saveAdminPermission_({
    id: linkage.found && linkage.whitelist ? String(linkage.whitelist['ホワイトリストID'] || '') : 'WL-001',
    googleEmail: email,
    linkedAuthId: selectedAuth.authId,
    permissionLevel: linkage.found && linkage.whitelist ? String(linkage.whitelist['権限コード'] || 'MASTER') : 'MASTER',
    enabled: true,
    __adminSession: {
      loginId: 'system-repair',
      adminPermissionLevel: 'MASTER',
    },
  });

  return inspectAdminWhitelistLinkage(email);
}

function repairDefaultAdminWhitelistLinkageJson() {
  return JSON.stringify(repairDefaultAdminWhitelistLinkage());
}

/**
 * WL-001 の Googleメール を k.noguchi@hcm-n.org に更新する（ワンタイム実行）。
 * 紐付け認証ID / 紐付け会員ID / MASTER 権限はそのまま維持する。
 * 実行: npx clasp run updateWL001EmailToHcmN
 */
function inspectHcmNAdminWhitelistLinkageJson() {
  return inspectAdminWhitelistLinkageJson('k.noguchi@hcm-n.org');
}

function updateWL001EmailToHcmN() {
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, 'ホワイトリストID', 'WL-001');
  if (!found) throw new Error('WL-001 が見つかりません。');

  var row = found.row.slice();
  var cols = found.columns;

  var oldEmail = String(row[cols['Googleメール']] || '');
  var newEmail = 'k.noguchi@hcm-n.org';

  row[cols['Googleメール']] = newEmail;
  row[cols['変更者メール']] = newEmail;
  row[cols['変更日時']] = new Date().toISOString();
  row[cols['更新日時']] = new Date().toISOString();

  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // キャッシュを無効化
  clearAdminPermissionCaches_();

  return {
    ok: true,
    wlId: 'WL-001',
    oldEmail: oldEmail,
    newEmail: newEmail,
    linkedAuthId: String(row[cols['紐付け認証ID']] || ''),
    linkedMemberId: String(row[cols['紐付け会員ID']] || ''),
    permissionCode: String(row[cols['権限コード']] || ''),
  };
}

// ── ソース読み取りとパース ──

/**
 * ソーススプレッドシートから名簿データを読み取る（読み取り専用）
 */
function readRosterSource_() {
  var srcSs = SpreadsheetApp.openById(ROSTER_SOURCE_SPREADSHEET_ID);
  var sheet = srcSs.getSheetByName(ROSTER_SOURCE_SHEET_NAME);
  if (!sheet) throw new Error('シート "' + ROSTER_SOURCE_SHEET_NAME + '" が見つかりません');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) throw new Error('データ行がありません');

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // ヘッダーインデックスマップ
  var colMap = {};
  var headerNames = ['2024年', '2025年・個', '2025年・事', '会員', '', '備　考', 'LINE', '発送', '郵送先', 'ルアド',
    '勤　務　先', '氏名', 'CM番号', 'ﾌﾘｶﾞﾅ', '郵便番号', '連絡先住所', '住所②', '', '連絡先電話番号', '連絡先ＦＡＸ', 'その他連絡先'];
  // インデックスベースでマッピング（ヘッダー名が日本語で完全一致しない場合に備えて位置ベース）
  colMap.fee2024 = 0;     // A: 2024年
  colMap.feeIndiv2025 = 1; // B: 2025年・個
  colMap.feeBiz2025 = 2;   // C: 2025年・事
  colMap.memberType = 3;   // D: 会員
  colMap.statusEvent = 4;  // E: (入会/退会/変更)
  colMap.remarks = 5;      // F: 備考
  colMap.line = 6;         // G: LINE
  colMap.delivery = 7;     // H: 発送
  colMap.mailDest = 8;     // I: 郵送先
  colMap.email = 9;        // J: ルアド
  colMap.workplace = 10;   // K: 勤務先
  colMap.name = 11;        // L: 氏名
  colMap.cmNumber = 12;    // M: CM番号
  colMap.furigana = 13;    // N: フリガナ
  colMap.postalCode = 14;  // O: 郵便番号
  colMap.address1 = 15;    // P: 連絡先住所
  colMap.address2 = 16;    // Q: 住所②
  // R: 数式列（スキップ）
  colMap.phone = 18;       // S: 連絡先電話番号
  colMap.fax = 19;         // T: 連絡先FAX
  colMap.otherContact = 20; // U: その他連絡先
  colMap.joinedDate = lastCol > 21 ? 21 : -1; // V: 入会日（存在する場合）

  return { data: data, colMap: colMap, rowCount: data.length };
}

/**
 * フリガナが漢字かどうかを判定する
 * カタカナ・ひらがな・半角英数・スペース・記号以外が含まれていれば漢字と判定
 */
function isKanjiFurigana_(text) {
  if (!text) return false;
  var s = String(text).trim();
  if (!s) return false;
  // カタカナ(全角)、ひらがな、半角カナ、半角英数、スペース、記号のみならfalse
  var katakanaHiraganaPattern = /^[\u30A0-\u30FF\u3040-\u309F\uFF65-\uFF9F\u0020-\u007E\u3000\u00A0\uFF01-\uFF5E\s]+$/;
  return !katakanaHiraganaPattern.test(s);
}

/**
 * 住所から都道府県を抽出する
 */
function parseAddress_(rawAddress) {
  var addr = String(rawAddress || '').trim();
  if (!addr) return { prefecture: '', city: '', street: '' };

  var prefecture = '';
  var rest = addr;

  // 都道府県パターン
  var prefMatch = addr.match(/^(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/);
  if (prefMatch) {
    prefecture = prefMatch[1];
    rest = addr.substring(prefecture.length);
  }

  // 市区町村抽出
  var city = '';
  // 政令指定都市の区を含むパターン
  var cityMatch = rest.match(/^(.+?[市郡])(.+?[区町村])?/);
  if (cityMatch) {
    city = cityMatch[1] + (cityMatch[2] || '');
    // 「市」で終わる場合、そこまで
    var simpleCity = rest.match(/^(.+?市)/);
    if (simpleCity) {
      city = simpleCity[1];
      rest = rest.substring(city.length);
    } else if (cityMatch) {
      city = cityMatch[0];
      rest = rest.substring(city.length);
    }
  }

  // 都道府県が未検出の場合、市名から推定
  if (!prefecture && city) {
    if (/^(枚方市|交野市|寝屋川市|門真市|守口市|四條畷市|大東市|東大阪市|八尾市|堺市|高槻市|茨木市|摂津市|吹田市|豊中市|池田市|箕面市)/.test(city)) {
      prefecture = '大阪府';
    } else if (/^(八幡市|京田辺市|木津川市|宇治市|城陽市|長岡京市|向日市|福知山市)/.test(city)) {
      prefecture = '京都府';
    } else if (/^(奈良市|生駒市|大和郡山市)/.test(city)) {
      prefecture = '奈良県';
    } else if (/^(神戸市|西宮市|尼崎市|芦屋市|宝塚市)/.test(city)) {
      prefecture = '兵庫県';
    }
  }

  return { prefecture: prefecture, city: city, street: rest.trim() };
}

/**
 * 氏名を姓と名に分割する（全角・半角スペース対応）
 */
function splitName_(fullName) {
  var s = String(fullName || '').trim();
  if (!s) return { last: '', first: '' };
  var parts = s.split(/[\s\u3000]+/);
  if (parts.length >= 2) {
    return { last: parts[0], first: parts.slice(1).join(' ') };
  }
  return { last: s, first: '' };
}

function joinHumanNameParts_(lastName, firstName) {
  var last = String(lastName || '').trim();
  var first = String(firstName || '').trim();
  if (last && first) return last + ' ' + first;
  return last || first;
}

// v376: フリガナ列の保存用正規化（src/utils/kanaNormalize.ts と同一ロジック）。
//   入力が半角カナ / ひらがな / 全角カナの混在でも保存形式は「全角カタカナ + 長音 + 全角スペース + 中点」に揃える。
//   順序: trim → NFKC → ひらがな→カタカナ → 半角スペース→全角スペース → NFC
function normalizeKana_(value) {
  var raw = String(value == null ? '' : value).trim();
  if (!raw) return '';
  return raw
    .normalize('NFKC')
    .replace(/[ぁ-ゖ]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) + 0x60);
    })
    .replace(/ /g, '　')
    .normalize('NFC');
}

// v376: 正規化済み文字列が「全角カタカナ ァ-ヶ + 長音 ー + 全角スペース + 中点 ・」のみで構成されるか判定。
//   空文字は valid（必須チェックは呼び出し側で）。
function isValidFullwidthKatakana_(normalized) {
  var s = String(normalized == null ? '' : normalized);
  if (!s) return true;
  return /^[ァ-ヶー　・]+$/.test(s);
}

// v376: 正規化 + バリデーション + エラー throw を一括で行うヘルパー。
//   fieldLabel: エラーメッセージに含める表示名（例: '個人会員のセイ'）
//   options.required: true なら空文字でエラー
function normalizeAndValidateKana_(value, fieldLabel, options) {
  var opts = options || {};
  var normalized = normalizeKana_(value);
  if (!normalized) {
    if (opts.required) {
      throw new Error(fieldLabel + 'は必須です。');
    }
    return '';
  }
  if (!isValidFullwidthKatakana_(normalized)) {
    throw new Error(fieldLabel + 'はカタカナ・ひらがな・半角カナのみで入力してください（漢字・英数字・記号は使用できません）。');
  }
  return normalized;
}

function normalizeStaffNameFields_(rowLike) {
  var lastName = String((rowLike && rowLike['姓']) || '').trim();
  var firstName = String((rowLike && rowLike['名']) || '').trim();
  // v376: kana 列は normalizeKana_ で全角カタカナに正規化し、不正文字は throw
  var lastKana = normalizeAndValidateKana_((rowLike && rowLike['セイ']) || '', '職員のセイ');
  var firstKana = normalizeAndValidateKana_((rowLike && rowLike['メイ']) || '', '職員のメイ');
  var fullName = String((rowLike && rowLike['氏名']) || '').trim();
  var fullKana = normalizeAndValidateKana_((rowLike && rowLike['フリガナ']) || '', '職員のフリガナ');

  if (!lastName && !firstName && fullName) {
    var nameParts = splitName_(fullName);
    lastName = nameParts.last;
    firstName = nameParts.first;
  }
  if (!lastKana && !firstKana && fullKana) {
    var kanaParts = splitName_(fullKana);
    lastKana = kanaParts.last;
    firstKana = kanaParts.first;
  }

  if (lastName || firstName) {
    fullName = joinHumanNameParts_(lastName, firstName);
  } else if (fullName) {
    var fallbackNameParts = splitName_(fullName);
    lastName = fallbackNameParts.last;
    firstName = fallbackNameParts.first;
    fullName = joinHumanNameParts_(lastName, firstName);
  }

  if (lastKana || firstKana) {
    fullKana = joinHumanNameParts_(lastKana, firstKana);
  } else if (fullKana) {
    var fallbackKanaParts = splitName_(fullKana);
    lastKana = fallbackKanaParts.last;
    firstKana = fallbackKanaParts.first;
    fullKana = joinHumanNameParts_(lastKana, firstKana);
  }
  // v376: joinHumanNameParts_ は半角スペースで連結するため、全角スペースに再正規化
  fullKana = normalizeKana_(fullKana);

  return {
    lastName: lastName,
    firstName: firstName,
    lastKana: lastKana,
    firstKana: firstKana,
    name: fullName,
    kana: fullKana,
  };
}

// v376: 既存 DB のフリガナ列を全角カタカナへ一括正規化する migration 関数。
//   対象: T_会員 (セイ/メイ) / T_事業所職員 (セイ/メイ/フリガナ) / T_外部申込者 (フリガナ)
//   実行: admin editor から手動 Run。最初に dryRun=true で件数確認、ユーザー承認後 dryRun=false で本実行。
//   Plan A: T_変更申請 の pending レコードは正規化対象外（承認時に approveAdminChangeRequest_ → 各 save 関数で正規化される）。
// v376.2: editor 1-click 本実行用ラッパー（dryRun:false 固定）。引数指定が editor から面倒なため。
function backfillKanaToFullwidth_APPLY() {
  assertMasterOperator_('backfillKanaToFullwidth_APPLY');
  return backfillKanaToFullwidth({ dryRun: false });
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

function backfillBusinessStaffNameColumns_(ss) {
  var targetSs = ss || getOrCreateDatabase_();
  var sheet = targetSs.getSheetByName('T_事業所職員');
  if (!sheet || sheet.getLastRow() < 2) {
    return { scanned: 0, updated: 0 };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  requireColumns_(cols, ['氏名', 'フリガナ', '更新日時']);

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var updated = 0;
  var nowIso = new Date().toISOString();
  var nextLastNames = [];
  var nextFirstNames = [];
  var nextLastKanas = [];
  var nextFirstKanas = [];
  var nextNames = [];
  var nextKanas = [];
  var nextUpdatedAt = [];

  for (var r = 0; r < data.length; r += 1) {
    var row = data[r];
    var normalized = normalizeStaffNameFields_({
      姓: cols['姓'] != null ? row[cols['姓']] : '',
      名: cols['名'] != null ? row[cols['名']] : '',
      セイ: cols['セイ'] != null ? row[cols['セイ']] : '',
      メイ: cols['メイ'] != null ? row[cols['メイ']] : '',
      氏名: row[cols['氏名']],
      フリガナ: row[cols['フリガナ']],
    });
    nextLastNames.push([normalized.lastName]);
    nextFirstNames.push([normalized.firstName]);
    nextLastKanas.push([normalized.lastKana]);
    nextFirstKanas.push([normalized.firstKana]);
    nextNames.push([normalized.name]);
    nextKanas.push([normalized.kana]);
    var changed = false;
    function wouldChange(name, value) {
      var idx = cols[name];
      if (idx == null) return false;
      return String(row[idx] || '') !== String(value || '');
    }
    if (wouldChange('姓', normalized.lastName)) changed = true;
    if (wouldChange('名', normalized.firstName)) changed = true;
    if (wouldChange('セイ', normalized.lastKana)) changed = true;
    if (wouldChange('メイ', normalized.firstKana)) changed = true;
    if (wouldChange('氏名', normalized.name)) changed = true;
    if (wouldChange('フリガナ', normalized.kana)) changed = true;
    nextUpdatedAt.push([changed ? nowIso : String(row[cols['更新日時']] || '')]);
    if (changed) {
      updated += 1;
    }
  }

  if (updated > 0) {
    if (cols['姓'] != null) sheet.getRange(2, cols['姓'] + 1, data.length, 1).setValues(nextLastNames);
    if (cols['名'] != null) sheet.getRange(2, cols['名'] + 1, data.length, 1).setValues(nextFirstNames);
    if (cols['セイ'] != null) sheet.getRange(2, cols['セイ'] + 1, data.length, 1).setValues(nextLastKanas);
    if (cols['メイ'] != null) sheet.getRange(2, cols['メイ'] + 1, data.length, 1).setValues(nextFirstKanas);
    sheet.getRange(2, cols['氏名'] + 1, data.length, 1).setValues(nextNames);
    sheet.getRange(2, cols['フリガナ'] + 1, data.length, 1).setValues(nextKanas);
    sheet.getRange(2, cols['更新日時'] + 1, data.length, 1).setValues(nextUpdatedAt);
  }
  return { scanned: data.length, updated: updated };
}

function backfillBusinessStaffNameColumnsJson() {
  return JSON.stringify(backfillBusinessStaffNameColumns_());
}

/**
 * 日付セル値を YYYY-MM-DD に正規化する
 */
function normalizeRosterDate_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return Utilities.formatDate(val, 'Asia/Tokyo', 'yyyy-MM-dd');
  }
  var s = String(val).trim();
  if (!s) return '';
  // YYYY/MM/DD or YYYY-MM-DD
  var m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) {
    return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  }
  return '';
}

/**
 * 退会処理日から退会日（年度末）を算出する
 * 4月〜3月を1年度とし、処理日が属する年度の3/31を返す
 */
function calcFiscalYearEnd_(processDateStr) {
  if (!processDateStr) return '';
  var d = new Date(processDateStr);
  if (isNaN(d.getTime())) return '';
  var year = d.getFullYear();
  var month = d.getMonth() + 1; // 1-12
  // 4月以降 → 翌年3/31、1-3月 → 当年3/31
  var fyEndYear = month >= 4 ? year + 1 : year;
  return fyEndYear + '-03-31';
}

/**
 * ランダムパスワードを生成する（PASSWORD_GENERATED_LENGTH 文字、英数字のみ）
 */
function generateRandomPassword_() {
  var chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var pw = '';
  for (var i = 0; i < PASSWORD_GENERATED_LENGTH; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

/**
 * CM番号がない場合の9桁ログインID自動生成（先頭9 + 8桁ランダム）
 */
function generateAutoLoginId_(existingIds) {
  var maxAttempts = 1000;
  for (var i = 0; i < maxAttempts; i++) {
    var id = '9' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
    if (existingIds.indexOf(id) === -1) return id;
  }
  throw new Error('ログインID自動生成に失敗（重複回避上限超過）');
}

function generateCmBasedLoginId_(cmNumber, existingIds) {
  var baseCm = String(cmNumber || '').replace(/[^0-9]/g, '');
  if (!baseCm) return generateAutoLoginId_(existingIds);
  if (baseCm.length !== 8) return generateAutoLoginId_(existingIds);
  if (existingIds.indexOf(baseCm) === -1) return baseCm;
  for (var prefix = 1; prefix <= 9; prefix++) {
    var duplicateId = String(prefix) + baseCm;
    if (existingIds.indexOf(duplicateId) === -1) return duplicateId;
  }
  throw new Error('CM番号重複の9桁ログインID採番に失敗: ' + baseCm);
}

function collectRosterSourceRows_(runId) {
  var source = readRosterSource_();
  var data = source.data;
  var col = source.colMap;
  var log = [];
  var warnings = [];
  var errors = [];
  var report = {
    runId: runId,
    mapRows: [],
    skippedRows: [],
  };
  var stats = {
    runId: runId,
    totalRows: data.length,
    skippedRows: 0,
    emptyRows: 0,
    orphanRows: 0,
    changeRows: 0,
    changeRowsMerged: 0,
    changeRowsStandalone: 0,
    mergedRows: 0,
    inferredBusinessRows: 0,
    individualMembers: 0,
    businessGroups: 0,
    businessStaff: 0,
    withdrawnMembers: 0,
    kanjiFurigana: 0,
    authAccounts: 0,
    annualFeeRecords: 0,
    autoLoginIds: 0,
  };
  var parsingState = {
    lastBusinessOfficeName: '',
  };
  var individualRowsStore = {};
  var businessRowsStore = {};

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var sourceRow = i + 2;
    var explicitMemberType = normalizeRosterCellText_(row[col.memberType]);
    var statusEvent = normalizeRosterCellText_(row[col.statusEvent]);
    var name = normalizeRosterCellText_(row[col.name]);
    var furigana = normalizeRosterCellText_(row[col.furigana]);
    var workplace = normalizeRosterCellText_(row[col.workplace]);
    var hasMeaningfulData = hasMeaningfulRosterRow_(row, col);
    var effectiveMemberType = explicitMemberType;
    var memberTypeNote = '';

    if (!explicitMemberType) {
      if (!hasMeaningfulData) {
        stats.skippedRows++;
        stats.emptyRows++;
        pushMigrationSkippedRow_(report, sourceRow, row, col, 'EMPTY_ROW', '会員種別・氏名を含む有効データがありません', explicitMemberType, '');
        continue;
      }
      if (name && parsingState.lastBusinessOfficeName) {
        effectiveMemberType = '事業所';
        memberTypeNote = 'D列空のため直前の事業所を継承';
      } else {
        stats.skippedRows++;
        stats.orphanRows++;
        pushMigrationSkippedRow_(report, sourceRow, row, col, 'ORPHAN_ROW', 'D列が空で、所属事業所を推定できません', explicitMemberType, '');
        continue;
      }
    }

    if (effectiveMemberType !== '個人' && effectiveMemberType !== '事業所') {
      stats.skippedRows++;
      pushMigrationSkippedRow_(report, sourceRow, row, col, 'UNKNOWN_MEMBER_TYPE', '未知の会員種別です', explicitMemberType, effectiveMemberType);
      continue;
    }

    var isKanjiInFurigana = isKanjiFurigana_(furigana);
    var effectiveName = isKanjiInFurigana && !name ? furigana : name;
    if (!effectiveName) {
      stats.skippedRows++;
      pushMigrationSkippedRow_(report, sourceRow, row, col, 'MISSING_NAME', '氏名が空のため移行対象から除外しました', explicitMemberType, effectiveMemberType);
      continue;
    }

    var effectiveWorkplace = workplace;
    if (effectiveMemberType === '事業所') {
      effectiveWorkplace = workplace || parsingState.lastBusinessOfficeName || ('不明事業所_行' + sourceRow);
      parsingState.lastBusinessOfficeName = effectiveWorkplace;
    } else {
      parsingState.lastBusinessOfficeName = '';
    }

    if (isKanjiInFurigana) {
      stats.kanjiFurigana++;
      log.push('行' + sourceRow + ': フリガナに漢字 "' + furigana + '" → 退会者として登録、フリガナなし');
    }
    if (statusEvent === '変更') {
      stats.changeRows++;
      log.push('行' + sourceRow + ': E=変更 → 変更前レコードに上書きする候補として扱う');
    }

    var rowData = {
      sourceRows: [sourceRow],
      explicitMemberType: explicitMemberType,
      effectiveMemberType: effectiveMemberType,
      memberTypeNote: memberTypeNote,
      statusEvent: statusEvent,
      isWithdrawn: statusEvent === '退会' || isKanjiInFurigana,
      isNewEntry: statusEvent === '入会',
      isKanjiInFurigana: isKanjiInFurigana,
      isChangeRow: statusEvent === '変更',
      changeSourceRows: statusEvent === '変更' ? 1 : 0,
      inferredMemberTypeSourceRows: explicitMemberType ? 0 : 1,
      rawDelivery: String(row[col.delivery] || '').trim(),
      rawName: effectiveName,
      rawFurigana: isKanjiInFurigana ? '' : furigana,
      rawEmail: String(row[col.email] || '').trim(),
      rawWorkplace: effectiveWorkplace,
      rawCmNumber: String(row[col.cmNumber] || '').trim().replace(/[^0-9]/g, ''),
      rawPostalCode: String(row[col.postalCode] || '').trim(),
      rawAddress1: String(row[col.address1] || '').trim(),
      rawAddress2: String(row[col.address2] || '').trim(),
      rawPhone: String(row[col.phone] || '').trim(),
      rawFax: String(row[col.fax] || '').trim(),
      rawOtherContact: String(row[col.otherContact] || '').trim(),
      rawMailDest: String(row[col.mailDest] || '').trim(),
      rawRemarks: String(row[col.remarks] || '').trim(),
      rawRemarksDate: normalizeRosterDate_(row[col.remarks]),
      rawJoinedDate: col.joinedDate >= 0 ? normalizeRosterDate_(row[col.joinedDate]) : '',
      rawFee2024: row[col.fee2024],
      rawFeeIndiv2025: row[col.feeIndiv2025],
      rawFeeBiz2025: row[col.feeBiz2025],
    };

    if (effectiveMemberType === '個人') {
      var beforeIndividualKeys = Object.keys(individualRowsStore).length;
      addRosterRowToStore_(individualRowsStore, rowData);
      if (Object.keys(individualRowsStore).length === beforeIndividualKeys) stats.mergedRows++;
    } else {
      var beforeBusinessKeys = Object.keys(businessRowsStore).length;
      addRosterRowToStore_(businessRowsStore, rowData);
      if (Object.keys(businessRowsStore).length === beforeBusinessKeys) stats.mergedRows++;
    }
  }

  var individualRows = Object.keys(individualRowsStore).map(function(key) { return individualRowsStore[key]; });
  var businessRowsByOffice = {};
  var businessRows = Object.keys(businessRowsStore).map(function(key) { return businessRowsStore[key]; });
  for (var br = 0; br < businessRows.length; br++) {
    var officeName = businessRows[br].rawWorkplace || ('不明事業所_行' + businessRows[br].sourceRows[0]);
    if (!businessRowsByOffice[officeName]) businessRowsByOffice[officeName] = [];
    businessRowsByOffice[officeName].push(businessRows[br]);
  }
  var mergedRows = individualRows.concat(businessRows);
  for (var mr = 0; mr < mergedRows.length; mr++) {
    var mergedRow = mergedRows[mr];
    if (mergedRow.inferredMemberTypeSourceRows) {
      stats.inferredBusinessRows += mergedRow.inferredMemberTypeSourceRows;
    }
    if (mergedRow.changeSourceRows) {
      if (mergedRow.sourceRows.length > mergedRow.changeSourceRows) {
        stats.changeRowsMerged += mergedRow.changeSourceRows;
      } else {
        stats.changeRowsStandalone += mergedRow.changeSourceRows;
      }
    }
  }

  return {
    source: source,
    data: data,
    col: col,
    log: log,
    warnings: warnings,
    errors: errors,
    report: report,
    stats: stats,
    individualRows: individualRows,
    businessRowsByOffice: businessRowsByOffice,
  };
}

// ── メイン移行関数 ──

/**
 * 名簿移行メイン関数
 * @param {Object} options - { dryRun: true/false }
 * @returns {Object} 移行結果
 */
function migrateRoster2025_(options) {
  var dryRun = options && options.dryRun !== false;
  var runId = options && options.runId ? String(options.runId) : createMigrationRunId_();
  var now = new Date().toISOString();
  var collected = collectRosterSourceRows_(runId);
  var source = collected.source;
  var data = collected.data;
  var log = collected.log;
  var warnings = collected.warnings;
  var errors = collected.errors;
  var report = collected.report;
  var stats = collected.stats;
  var individualRows = collected.individualRows;
  var businessRowsByOffice = collected.businessRowsByOffice;

  // ── 移行レコード生成 ──
  var memberRecords = [];
  var staffRecords = [];
  var authRecords = [];
  var feeRecords = [];
  var allLoginIds = [];
  var credentialsList = []; // ログインID/パスワード一覧（メール送信用）

  // ── 個人会員 ──
  for (var idx = 0; idx < individualRows.length; idx++) {
    var r = individualRows[idx];
    var memberId = generateMemberId_();
    var member = buildIndividualMigrationMemberRecord_(r, memberId, now);
    memberRecords.push(member);
    if (r.isWithdrawn) stats.withdrawnMembers++;
    stats.individualMembers++;

    // 認証アカウント（CM番号重複時は自動ID発番）
    var loginId = generateCmBasedLoginId_(r.rawCmNumber, allLoginIds);
    if (!r.rawCmNumber || r.rawCmNumber !== loginId) stats.autoLoginIds++;
    allLoginIds.push(loginId);
    var plainPassword = generateRandomPassword_();
    var salt = generateSalt_();
    var hashed = hashPasswordCurrent_(plainPassword, salt);

    authRecords.push({
      認証ID: Utilities.getUuid(),
      認証方式: 'PASSWORD',
      ログインID: loginId,
      パスワードハッシュ: hashed,
      パスワードソルト: salt,
      GoogleユーザーID: '',
      Googleメール: '',
      システムロールコード: 'INDIVIDUAL_MEMBER',
      会員ID: memberId,
      職員ID: '',
      最終ログイン日時: '',
      パスワード更新日時: '',
      アカウント有効フラグ: r.isWithdrawn ? false : true,
      ログイン失敗回数: 0,
      ロック状態: false,
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    });
    stats.authAccounts++;
    appendMigrationMapRows_(report, r, memberId, '', loginId, 'INDIVIDUAL_MEMBER');

    credentialsList.push({
      name: r.rawName,
      loginId: loginId,
      password: plainPassword,
      email: r.rawEmail,
      memberType: '個人',
      memberId: memberId,
    });

    // 年会費（2024年度）
    var fee2024Raw = r.rawFee2024;
    var fee2024Date = '';
    if (fee2024Raw) {
      var s2024 = String(fee2024Raw).trim();
      if (s2024 === '総会') {
        fee2024Date = ROSTER_SOUKAI_DATE_2024;
      } else {
        fee2024Date = normalizeRosterDate_(fee2024Raw);
      }
    }
    if (fee2024Date || fee2024Raw) {
      feeRecords.push({
        年会費履歴ID: Utilities.getUuid(),
        会員ID: memberId,
        対象年度: 2024,
        会費納入状態コード: fee2024Date ? 'PAID' : 'UNPAID',
        納入確認日: fee2024Date,
        金額: 3000,
        備考: String(fee2024Raw).trim() === '総会' ? '総会にて納入' : '',
        作成日時: now,
        更新日時: now,
        削除フラグ: false,
      });
      stats.annualFeeRecords++;
    }

    // 年会費（2025年度・個人）
    var fee2025Raw = r.rawFeeIndiv2025;
    var fee2025Date = '';
    if (fee2025Raw) {
      var s2025 = String(fee2025Raw).trim();
      if (s2025 === '総会') {
        fee2025Date = ROSTER_SOUKAI_DATE_2025;
      } else {
        fee2025Date = normalizeRosterDate_(fee2025Raw);
      }
    }
    if (fee2025Date || fee2025Raw) {
      feeRecords.push({
        年会費履歴ID: Utilities.getUuid(),
        会員ID: memberId,
        対象年度: 2025,
        会費納入状態コード: fee2025Date ? 'PAID' : 'UNPAID',
        納入確認日: fee2025Date,
        金額: 3000,
        備考: String(fee2025Raw).trim() === '総会' ? '総会にて納入' : '',
        作成日時: now,
        更新日時: now,
        削除フラグ: false,
      });
      stats.annualFeeRecords++;
    }
  }

  // ── 事業所会員 ──
  var officeNames = Object.keys(businessRowsByOffice);
  for (var oi = 0; oi < officeNames.length; oi++) {
    var officeName = officeNames[oi];
    var staffList = businessRowsByOffice[officeName];
    var memberId = generateMemberId_();
    var businessProjection = buildBusinessMigrationMemberRecord_(staffList, memberId, now, officeName);
    var member = businessProjection.member;
    var businessContext = businessProjection.context;
    var rep = businessContext.rep;
    var repIndex = businessContext.repIndex;
    if (businessContext.officeWithdrawn) stats.withdrawnMembers++;
    memberRecords.push(member);
    stats.businessGroups++;

    // 年会費（事業所: 2024年度）
    var bizFee2024Raw = rep.rawFee2024;
    var bizFee2024Date = '';
    if (bizFee2024Raw) {
      var bs2024 = String(bizFee2024Raw).trim();
      if (bs2024 === '総会') bizFee2024Date = ROSTER_SOUKAI_DATE_2024;
      else bizFee2024Date = normalizeRosterDate_(bizFee2024Raw);
    }
    if (bizFee2024Date || bizFee2024Raw) {
      feeRecords.push({
        年会費履歴ID: Utilities.getUuid(),
        会員ID: memberId,
        対象年度: 2024,
        会費納入状態コード: bizFee2024Date ? 'PAID' : 'UNPAID',
        納入確認日: bizFee2024Date,
        金額: 8000,
        備考: String(bizFee2024Raw).trim() === '総会' ? '総会にて納入' : '',
        作成日時: now,
        更新日時: now,
        削除フラグ: false,
      });
      stats.annualFeeRecords++;
    }

    // 年会費（事業所: 2025年度）
    var bizFee2025Raw = rep.rawFeeBiz2025;
    if (!bizFee2025Raw) {
      // 代表者にない場合、グループ内で探す
      for (var bfi = 0; bfi < staffList.length; bfi++) {
        if (staffList[bfi].rawFeeBiz2025) {
          bizFee2025Raw = staffList[bfi].rawFeeBiz2025;
          break;
        }
      }
    }
    var bizFee2025Date = '';
    if (bizFee2025Raw) {
      var bs2025 = String(bizFee2025Raw).trim();
      if (bs2025 === '総会') bizFee2025Date = ROSTER_SOUKAI_DATE_2025;
      else bizFee2025Date = normalizeRosterDate_(bizFee2025Raw);
    }
    if (bizFee2025Date || bizFee2025Raw) {
      feeRecords.push({
        年会費履歴ID: Utilities.getUuid(),
        会員ID: memberId,
        対象年度: 2025,
        会費納入状態コード: bizFee2025Date ? 'PAID' : 'UNPAID',
        納入確認日: bizFee2025Date,
        金額: 8000,
        備考: String(bizFee2025Raw).trim() === '総会' ? '総会にて納入' : '',
        作成日時: now,
        更新日時: now,
        削除フラグ: false,
      });
      stats.annualFeeRecords++;
    }

    // ── 職員レコード ──
    for (var si2 = 0; si2 < staffList.length; si2++) {
      var st = staffList[si2];
      var staffId = Utilities.getUuid();
      var isRep = si2 === repIndex;
      staffRecords.push(buildBusinessMigrationStaffRecord_(st, memberId, staffId, isRep, now, businessContext));
      stats.businessStaff++;

      // 認証アカウント（CM番号重複時は自動ID発番）
      var stLoginId = generateCmBasedLoginId_(st.rawCmNumber, allLoginIds);
      if (!st.rawCmNumber || st.rawCmNumber !== stLoginId) stats.autoLoginIds++;
      allLoginIds.push(stLoginId);
      var stPassword = generateRandomPassword_();
      var stSalt = generateSalt_();
      var stHashed = hashPasswordCurrent_(stPassword, stSalt);

      authRecords.push({
        認証ID: Utilities.getUuid(),
        認証方式: 'PASSWORD',
        ログインID: stLoginId,
        パスワードハッシュ: stHashed,
        パスワードソルト: stSalt,
        GoogleユーザーID: '',
        Googleメール: '',
        システムロールコード: isRep ? 'BUSINESS_ADMIN' : 'BUSINESS_MEMBER',
        会員ID: memberId,
        職員ID: staffId,
        最終ログイン日時: '',
        パスワード更新日時: '',
        アカウント有効フラグ: businessContext.officeWithdrawn || st.isWithdrawn ? false : true,
        ログイン失敗回数: 0,
        ロック状態: false,
        作成日時: now,
        更新日時: now,
        削除フラグ: false,
      });
      stats.authAccounts++;
      appendMigrationMapRows_(report, st, memberId, staffId, stLoginId, 'BUSINESS_STAFF');

      credentialsList.push({
        name: st.rawName,
        loginId: stLoginId,
        password: stPassword,
        email: st.rawEmail,
        memberType: '事業所(' + officeName + ')',
        memberId: memberId,
      });
    }
  }

  // ── ドライラン結果 or 本番書き込み ──
  var result = {
    runId: runId,
    dryRun: dryRun,
    stats: stats,
    memberCount: memberRecords.length,
    staffCount: staffRecords.length,
    authCount: authRecords.length,
    feeCount: feeRecords.length,
    warnings: warnings,
    errors: errors,
    log: log,
    sourceCoverage: {
      total: data.length,
      processed: report.mapRows.length + report.skippedRows.length,
      ok: (report.mapRows.length + report.skippedRows.length) === data.length,
    },
    reportSheets: MIGRATION_REPORT_SHEETS,
    _report: report,
  };

  if (!result.sourceCoverage.ok) {
    errors.push('sourceCoverage 不一致: total=' + data.length + ', processed=' + result.sourceCoverage.processed);
  }

  if (dryRun) {
    var skippedSummary = {};
    for (var sri = 0; sri < report.skippedRows.length; sri++) {
      var reasonCode = String(report.skippedRows[sri].reasonCode || 'UNKNOWN');
      skippedSummary[reasonCode] = (skippedSummary[reasonCode] || 0) + 1;
    }
    Logger.log('=== ドライラン結果 ===');
    Logger.log(JSON.stringify(stats, null, 2));
    Logger.log('警告: ' + warnings.length + '件');
    Logger.log('ログ: ' + log.length + '件');
    result.credentialsSample = credentialsList.slice(0, 5);
    result.skippedSummary = skippedSummary;
    result.skippedSample = report.skippedRows.slice(0, 20);
    result.mapSample = report.mapRows.slice(0, 20);
    return result;
  }

  // ── 本番書き込み ──
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);

  // データ入力規則を一時クリア（setAllowInvalid(false) が書き込みを阻害するため）
  var targetTableNames = ['T_会員', 'T_事業所職員', 'T_認証アカウント', 'T_年会費納入履歴'];
  for (var ti = 0; ti < targetTableNames.length; ti++) {
    var tSheet = ss.getSheetByName(targetTableNames[ti]);
    if (tSheet && tSheet.getMaxRows() > 1) {
      tSheet.getRange(2, 1, tSheet.getMaxRows() - 1, tSheet.getMaxColumns()).clearDataValidations();
    }
  }

  // T_会員
  var memberCols = テーブル定義.T_会員;
  var memberData = memberRecords.map(function(rec) {
    return memberCols.map(function(colName) {
      return rec[colName] !== undefined ? rec[colName] : '';
    });
  });
  if (memberData.length > 0) {
    var memberSheet = ss.getSheetByName('T_会員');
    memberSheet.getRange(2, 1, memberData.length, memberData[0].length).setValues(memberData);
  }

  // T_事業所職員
  var staffCols = テーブル定義.T_事業所職員;
  var staffData = staffRecords.map(function(rec) {
    return staffCols.map(function(colName) {
      return rec[colName] !== undefined ? rec[colName] : '';
    });
  });
  if (staffData.length > 0) {
    var staffSheet = ss.getSheetByName('T_事業所職員');
    staffSheet.getRange(2, 1, staffData.length, staffData[0].length).setValues(staffData);
  }

  // T_認証アカウント
  var authCols = テーブル定義.T_認証アカウント;
  var authData = authRecords.map(function(rec) {
    return authCols.map(function(colName) {
      return rec[colName] !== undefined ? rec[colName] : '';
    });
  });
  if (authData.length > 0) {
    var authSheet = ss.getSheetByName('T_認証アカウント');
    authSheet.getRange(2, 1, authData.length, authData[0].length).setValues(authData);
  }

  // T_年会費納入履歴
  var feeCols = テーブル定義.T_年会費納入履歴;
  var feeData = feeRecords.map(function(rec) {
    return feeCols.map(function(colName) {
      return rec[colName] !== undefined ? rec[colName] : '';
    });
  });
  if (feeData.length > 0) {
    var feeSheet = ss.getSheetByName('T_年会費納入履歴');
    feeSheet.getRange(2, 1, feeData.length, feeData[0].length).setValues(feeData);
  }

  // 認証情報をスプレッドシートに記録（一時シート）
  var credSheet = ss.getSheetByName('_CREDENTIALS_TEMP');
  if (!credSheet) {
    credSheet = ss.insertSheet('_CREDENTIALS_TEMP');
  } else if (credSheet.getLastRow() > 0) {
    credSheet.clear();
  }
  credSheet.appendRow(['氏名', 'ログインID', '初期パスワード', 'メール', '会員種別', '会員ID']);
  var credRows = credentialsList.map(function(c) {
    return [c.name, c.loginId, c.password, c.email, c.memberType, c.memberId];
  });
  if (credRows.length > 0) {
    credSheet.getRange(2, 1, credRows.length, credRows[0].length).setValues(credRows);
  }

  // データ入力規則を再適用
  applyDataValidationRules_(ss);

  clearAllDataCache_();
  Logger.log('=== 本番書き込み完了 ===');
  Logger.log(JSON.stringify(stats, null, 2));

  result.credentialsSheetName = '_CREDENTIALS_TEMP';
  return result;
}

function buildIndividualMemberMatchKeysFromSource_(rowData) {
  var keys = [];
  if (rowData.rawCmNumber) keys.push('INDIVIDUAL|CM|' + rowData.rawCmNumber);
  keys.push('INDIVIDUAL|NAME|' + normalizeRosterKeyText_(rowData.rawName) + '|MAIL|' + normalizeRosterKeyText_(rowData.rawEmail) + '|WORK|' + normalizeRosterKeyText_(cleanRosterWorkplace_(rowData.rawWorkplace)));
  keys.push('INDIVIDUAL|NAME|' + normalizeRosterKeyText_(rowData.rawName) + '|WORK|' + normalizeRosterKeyText_(cleanRosterWorkplace_(rowData.rawWorkplace)));
  return keys;
}

function buildIndividualMemberMatchKeysFromRow_(row) {
  var fullName = [row['姓'] || '', row['名'] || ''].join(' ').trim();
  var workplace = cleanRosterWorkplace_(row['勤務先名']);
  var careManagerNumber = normalizeRosterCellText_(row['介護支援専門員番号']);
  var keys = [];
  if (careManagerNumber) keys.push('INDIVIDUAL|CM|' + careManagerNumber);
  keys.push('INDIVIDUAL|NAME|' + normalizeRosterKeyText_(fullName) + '|MAIL|' + normalizeRosterKeyText_(row['代表メールアドレス'] || '') + '|WORK|' + normalizeRosterKeyText_(workplace));
  keys.push('INDIVIDUAL|NAME|' + normalizeRosterKeyText_(fullName) + '|WORK|' + normalizeRosterKeyText_(workplace));
  return keys;
}

function buildBusinessMemberMatchKey_(officeName) {
  return 'BUSINESS|OFFICE|' + normalizeRosterKeyText_(officeName);
}

function buildBusinessStaffMatchKeysFromSource_(rowData, officeName) {
  var keys = [];
  if (rowData.rawCmNumber) keys.push('BUSINESS_STAFF|OFFICE|' + normalizeRosterKeyText_(officeName) + '|CM|' + rowData.rawCmNumber);
  keys.push('BUSINESS_STAFF|OFFICE|' + normalizeRosterKeyText_(officeName) + '|NAME|' + normalizeRosterKeyText_(rowData.rawName) + '|MAIL|' + normalizeRosterKeyText_(rowData.rawEmail));
  keys.push('BUSINESS_STAFF|OFFICE|' + normalizeRosterKeyText_(officeName) + '|NAME|' + normalizeRosterKeyText_(rowData.rawName));
  return keys;
}

function buildBusinessStaffMatchKeysFromRow_(row, officeName) {
  var keys = [];
  var cmNumber = normalizeRosterCellText_(row['介護支援専門員番号']);
  if (cmNumber) keys.push('BUSINESS_STAFF|OFFICE|' + normalizeRosterKeyText_(officeName) + '|CM|' + cmNumber);
  keys.push('BUSINESS_STAFF|OFFICE|' + normalizeRosterKeyText_(officeName) + '|NAME|' + normalizeRosterKeyText_(row['氏名'] || '') + '|MAIL|' + normalizeRosterKeyText_(row['メールアドレス'] || ''));
  keys.push('BUSINESS_STAFF|OFFICE|' + normalizeRosterKeyText_(officeName) + '|NAME|' + normalizeRosterKeyText_(row['氏名'] || ''));
  return keys;
}

function addMatchIndex_(map, key, index) {
  if (!map[key]) map[key] = [];
  map[key].push(index);
}

function claimMatchedIndex_(map, keys, used) {
  for (var i = 0; i < keys.length; i++) {
    var candidates = map[keys[i]] || [];
    for (var j = 0; j < candidates.length; j++) {
      var index = candidates[j];
      if (!used[index]) {
        used[index] = true;
        return index;
      }
    }
  }
  return -1;
}

function normalizeRepairComparableValue_(field, value) {
  if (field === '入会日' || field === '退会日' || field === '退会処理日') {
    return normalizeDateInput_(value) || normalizeRosterDate_(value) || '';
  }
  if (field === '削除フラグ' || field === 'アカウント有効フラグ') {
    return String(toBoolean_(value));
  }
  return normalizeRosterCellText_(value);
}

function applyRepairFieldUpdates_(row, cols, expected, fields, changedFields) {
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var colIndex = cols[field];
    if (colIndex == null) continue;
    var nextValue = expected[field] !== undefined ? expected[field] : '';
    var currentValue = row[colIndex];
    if (normalizeRepairComparableValue_(field, currentValue) !== normalizeRepairComparableValue_(field, nextValue)) {
      row[colIndex] = nextValue;
      changedFields.push(field);
    }
  }
}

function repairRosterMigratedData_(options) {
  var dryRun = !(options && options.dryRun === false);
  var now = new Date().toISOString();
  var collected = collectRosterSourceRows_(createMigrationRunId_());
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet = ss.getSheetByName('T_事業所職員');
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!memberSheet || !staffSheet || !authSheet) throw new Error('補正対象シートが見つかりません。');

  var memberHeaders = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn()).getValues()[0];
  var staffHeaders = staffSheet.getRange(1, 1, 1, staffSheet.getLastColumn()).getValues()[0];
  var authHeaders = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var memberCols = {};
  var staffCols = {};
  var authCols = {};
  for (var mh = 0; mh < memberHeaders.length; mh++) memberCols[memberHeaders[mh]] = mh;
  for (var sh = 0; sh < staffHeaders.length; sh++) staffCols[staffHeaders[sh]] = sh;
  for (var ah = 0; ah < authHeaders.length; ah++) authCols[authHeaders[ah]] = ah;

  var memberData = memberSheet.getLastRow() > 1 ? memberSheet.getRange(2, 1, memberSheet.getLastRow() - 1, memberSheet.getLastColumn()).getValues() : [];
  var staffData = staffSheet.getLastRow() > 1 ? staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues() : [];
  var authData = authSheet.getLastRow() > 1 ? authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues() : [];

  var memberFieldNames = [
    '会員状態コード', '入会日', '退会日', '退会処理日',
    '姓', '名', 'セイ', 'メイ',
    '代表メールアドレス', '携帯電話番号',
    '勤務先名', '勤務先郵便番号', '勤務先都道府県', '勤務先市区町村', '勤務先住所',
    '勤務先電話番号', '勤務先FAX番号',
    '自宅郵便番号', '自宅都道府県', '自宅市区町村', '自宅住所',
    '発送方法コード', '郵送先区分コード', '職員数上限',
    '削除フラグ', '介護支援専門員番号', '事業所番号'
  ];
  var staffFieldNames = [
    '姓', '名', 'セイ', 'メイ',
    '氏名', 'フリガナ', 'メールアドレス',
    '職員権限コード', '職員状態コード',
    '入会日', '退会日', '介護支援専門員番号',
    '削除フラグ'
  ];

  var individualMemberIndexByKey = {};
  var businessMemberIndexByKey = {};
  var staffIndexesByMemberId = {};
  var authIndexByMemberId = {};
  var authIndexByStaffId = {};

  for (var mi = 0; mi < memberData.length; mi++) {
    if (toBoolean_(memberData[mi][memberCols['削除フラグ']])) continue;
    var memberType = String(memberData[mi][memberCols['会員種別コード']] || '');
    var memberRowObject = {};
    for (var mho = 0; mho < memberHeaders.length; mho++) memberRowObject[memberHeaders[mho]] = memberData[mi][mho];
    if (memberType === 'INDIVIDUAL') {
      var individualKeys = buildIndividualMemberMatchKeysFromRow_(memberRowObject);
      for (var mik = 0; mik < individualKeys.length; mik++) addMatchIndex_(individualMemberIndexByKey, individualKeys[mik], mi);
    } else if (memberType === 'BUSINESS') {
      addMatchIndex_(businessMemberIndexByKey, buildBusinessMemberMatchKey_(memberRowObject['勤務先名'] || ''), mi);
    }
  }
  for (var si = 0; si < staffData.length; si++) {
    if (toBoolean_(staffData[si][staffCols['削除フラグ']])) continue;
    var memberId = String(staffData[si][staffCols['会員ID']] || '');
    if (!staffIndexesByMemberId[memberId]) staffIndexesByMemberId[memberId] = [];
    staffIndexesByMemberId[memberId].push(si);
  }
  for (var ai = 0; ai < authData.length; ai++) {
    if (toBoolean_(authData[ai][authCols['削除フラグ']])) continue;
    var authMemberId = String(authData[ai][authCols['会員ID']] || '');
    var authStaffId = String(authData[ai][authCols['職員ID']] || '');
    if (authMemberId && !authStaffId && authIndexByMemberId[authMemberId] == null) authIndexByMemberId[authMemberId] = ai;
    if (authStaffId && authIndexByStaffId[authStaffId] == null) authIndexByStaffId[authStaffId] = ai;
  }

  var usedIndividualIndexes = {};
  var summary = {
    dryRun: dryRun,
    memberUpdates: 0,
    staffUpdates: 0,
    authUpdates: 0,
    unmatchedIndividuals: [],
    unmatchedBusinessMembers: [],
    unmatchedBusinessStaff: [],
    samples: [],
  };

  for (var ir = 0; ir < collected.individualRows.length; ir++) {
    var sourceIndividual = collected.individualRows[ir];
    var memberIndex = claimMatchedIndex_(individualMemberIndexByKey, buildIndividualMemberMatchKeysFromSource_(sourceIndividual), usedIndividualIndexes);
    if (memberIndex < 0) {
      summary.unmatchedIndividuals.push({
        sourceRows: sourceIndividual.sourceRows,
        name: sourceIndividual.rawName,
        cmNumber: sourceIndividual.rawCmNumber,
      });
      continue;
    }

    var memberId = String(memberData[memberIndex][memberCols['会員ID']] || '');
    var expectedMember = buildIndividualMigrationMemberRecord_(sourceIndividual, memberId, now);
    var memberChanges = [];
    applyRepairFieldUpdates_(memberData[memberIndex], memberCols, expectedMember, memberFieldNames, memberChanges);
    if (memberChanges.length) {
      if (memberCols['更新日時'] != null) memberData[memberIndex][memberCols['更新日時']] = now;
      summary.memberUpdates++;
      if (summary.samples.length < 20) summary.samples.push({ type: 'INDIVIDUAL_MEMBER', id: memberId, fields: memberChanges });
    }

    var authIndex = authIndexByMemberId[memberId];
    if (authIndex != null) {
      var authChanges = [];
      if (String(authData[authIndex][authCols['システムロールコード']] || '') !== 'INDIVIDUAL_MEMBER') {
        authData[authIndex][authCols['システムロールコード']] = 'INDIVIDUAL_MEMBER';
        authChanges.push('システムロールコード');
      }
      var nextEnabled = sourceIndividual.isWithdrawn ? false : true;
      if (normalizeRepairComparableValue_('アカウント有効フラグ', authData[authIndex][authCols['アカウント有効フラグ']]) !== normalizeRepairComparableValue_('アカウント有効フラグ', nextEnabled)) {
        authData[authIndex][authCols['アカウント有効フラグ']] = nextEnabled;
        authChanges.push('アカウント有効フラグ');
      }
      if (authChanges.length) {
        if (authCols['更新日時'] != null) authData[authIndex][authCols['更新日時']] = now;
        summary.authUpdates++;
        if (summary.samples.length < 20) summary.samples.push({ type: 'INDIVIDUAL_AUTH', id: String(authData[authIndex][authCols['認証ID']] || ''), fields: authChanges });
      }
    }
  }

  var officeNames = Object.keys(collected.businessRowsByOffice);
  for (var oi = 0; oi < officeNames.length; oi++) {
    var officeName = officeNames[oi];
    var businessMemberCandidates = businessMemberIndexByKey[buildBusinessMemberMatchKey_(officeName)] || [];
    if (!businessMemberCandidates.length) {
      summary.unmatchedBusinessMembers.push({ officeName: officeName });
      continue;
    }
    var businessMemberIndex = businessMemberCandidates[0];
    var businessMemberId = String(memberData[businessMemberIndex][memberCols['会員ID']] || '');
    var businessProjection = buildBusinessMigrationMemberRecord_(collected.businessRowsByOffice[officeName], businessMemberId, now, officeName);
    var businessMemberChanges = [];
    applyRepairFieldUpdates_(memberData[businessMemberIndex], memberCols, businessProjection.member, memberFieldNames, businessMemberChanges);
    if (businessMemberChanges.length) {
      if (memberCols['更新日時'] != null) memberData[businessMemberIndex][memberCols['更新日時']] = now;
      summary.memberUpdates++;
      if (summary.samples.length < 20) summary.samples.push({ type: 'BUSINESS_MEMBER', id: businessMemberId, fields: businessMemberChanges });
    }

    var currentStaffIndexes = staffIndexesByMemberId[businessMemberId] || [];
    var currentStaffKeyMap = {};
    for (var csi = 0; csi < currentStaffIndexes.length; csi++) {
      var staffIndex = currentStaffIndexes[csi];
      var staffRowObject = {};
      for (var sho = 0; sho < staffHeaders.length; sho++) staffRowObject[staffHeaders[sho]] = staffData[staffIndex][sho];
      var staffKeys = buildBusinessStaffMatchKeysFromRow_(staffRowObject, officeName);
      for (var sk = 0; sk < staffKeys.length; sk++) addMatchIndex_(currentStaffKeyMap, staffKeys[sk], staffIndex);
    }
    var usedStaffIndexes = {};
    for (var bs = 0; bs < collected.businessRowsByOffice[officeName].length; bs++) {
      var sourceStaff = collected.businessRowsByOffice[officeName][bs];
      var targetStaffIndex = claimMatchedIndex_(currentStaffKeyMap, buildBusinessStaffMatchKeysFromSource_(sourceStaff, officeName), usedStaffIndexes);
      if (targetStaffIndex < 0) {
        summary.unmatchedBusinessStaff.push({
          officeName: officeName,
          sourceRows: sourceStaff.sourceRows,
          name: sourceStaff.rawName,
          cmNumber: sourceStaff.rawCmNumber,
        });
        continue;
      }

      var staffId = String(staffData[targetStaffIndex][staffCols['職員ID']] || '');
      var isRepresentative = bs === businessProjection.context.repIndex;
      var expectedStaff = buildBusinessMigrationStaffRecord_(sourceStaff, businessMemberId, staffId, isRepresentative, now, businessProjection.context);
      var staffChanges = [];
      applyRepairFieldUpdates_(staffData[targetStaffIndex], staffCols, expectedStaff, staffFieldNames, staffChanges);
      if (staffChanges.length) {
        if (staffCols['更新日時'] != null) staffData[targetStaffIndex][staffCols['更新日時']] = now;
        summary.staffUpdates++;
        if (summary.samples.length < 20) summary.samples.push({ type: 'BUSINESS_STAFF', id: staffId, fields: staffChanges });
      }

      var targetAuthIndex = authIndexByStaffId[staffId];
      if (targetAuthIndex != null) {
        var expectedRole = isRepresentative ? 'BUSINESS_ADMIN' : 'BUSINESS_MEMBER';
        var expectedEnabled = businessProjection.context.officeWithdrawn || sourceStaff.isWithdrawn ? false : true;
        var businessAuthChanges = [];
        if (String(authData[targetAuthIndex][authCols['システムロールコード']] || '') !== expectedRole) {
          authData[targetAuthIndex][authCols['システムロールコード']] = expectedRole;
          businessAuthChanges.push('システムロールコード');
        }
        if (normalizeRepairComparableValue_('アカウント有効フラグ', authData[targetAuthIndex][authCols['アカウント有効フラグ']]) !== normalizeRepairComparableValue_('アカウント有効フラグ', expectedEnabled)) {
          authData[targetAuthIndex][authCols['アカウント有効フラグ']] = expectedEnabled;
          businessAuthChanges.push('アカウント有効フラグ');
        }
        if (businessAuthChanges.length) {
          if (authCols['更新日時'] != null) authData[targetAuthIndex][authCols['更新日時']] = now;
          summary.authUpdates++;
          if (summary.samples.length < 20) summary.samples.push({ type: 'BUSINESS_AUTH', id: String(authData[targetAuthIndex][authCols['認証ID']] || ''), fields: businessAuthChanges });
        }
      }
    }
  }

  if (dryRun) {
    return summary;
  }

  var backup = backupBeforeMigration_();
  summary.backupSuffix = backup.suffix;

  var repairTargetSheets = [memberSheet, staffSheet, authSheet];
  for (var rs = 0; rs < repairTargetSheets.length; rs++) {
    var repairSheet = repairTargetSheets[rs];
    if (repairSheet && repairSheet.getMaxRows() > 1) {
      repairSheet.getRange(2, 1, repairSheet.getMaxRows() - 1, repairSheet.getMaxColumns()).clearDataValidations();
    }
  }

  if (memberData.length) memberSheet.getRange(2, 1, memberData.length, memberData[0].length).setValues(memberData);
  if (staffData.length) staffSheet.getRange(2, 1, staffData.length, staffData[0].length).setValues(staffData);
  if (authData.length) authSheet.getRange(2, 1, authData.length, authData[0].length).setValues(authData);

  applyDataValidationRules_(ss);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  summary.verification = verifyMigration_();
  summary.remainingPreview = repairRosterMigratedData_({ dryRun: true });
  return summary;
}

function previewRosterMigrationRepair() {
  return repairRosterMigratedData_({ dryRun: true });
}

function previewRosterMigrationRepairJson() {
  return JSON.stringify(previewRosterMigrationRepair());
}

function buildExpectedMigrationFeeEntryForAudit_(memberId, year, rawValue, amount, soukaiDate, sourceRows) {
  if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') return null;
  var rawText = String(rawValue).trim();
  var confirmedDate = rawText === '総会' ? soukaiDate : normalizeRosterDate_(rawValue);
  return {
    key: String(memberId || '') + '|' + String(year || ''),
    memberId: String(memberId || ''),
    year: Number(year || 0),
    status: confirmedDate ? 'PAID' : 'UNPAID',
    confirmedDate: confirmedDate,
    amount: Number(amount || 0),
    note: rawText === '総会' ? '総会にて納入' : '',
    sourceRows: sourceRows || [],
    rawValue: rawText,
  };
}

function normalizeFeeAuditComparableValue_(field, value) {
  if (field === 'year' || field === 'amount') return String(Number(value || 0));
  if (field === 'confirmedDate') return normalizeDateInput_(value) || normalizeRosterDate_(value) || '';
  return normalizeRosterCellText_(value);
}

function compareFeeAuditField_(mismatches, field, expectedValue, actualValue, context) {
  if (normalizeFeeAuditComparableValue_(field, expectedValue) !== normalizeFeeAuditComparableValue_(field, actualValue)) {
    mismatches.push({
      field: field,
      expected: expectedValue === undefined || expectedValue === null ? '' : expectedValue,
      actual: actualValue === undefined || actualValue === null ? '' : actualValue,
      context: context,
    });
  }
}

function classifyFeeSourceRawValue_(rawValue) {
  var text = normalizeRosterCellText_(rawValue);
  if (!text || isPlaceholderRosterValue_(text)) return { present: false, score: 0, status: 'EMPTY', text: text };
  if (text === '総会') return { present: true, score: 300, status: 'PAID', text: text };
  if (normalizeRosterDate_(text)) return { present: true, score: 200, status: 'PAID', text: text };
  return { present: true, score: 100, status: 'UNPAID', text: text };
}

function findFirstBusinessFeeRawValue_(staffList, fieldName) {
  var best = null;
  for (var i = 0; i < staffList.length; i++) {
    var rawValue = staffList[i] && staffList[i][fieldName];
    var classified = classifyFeeSourceRawValue_(rawValue);
    if (!classified.present) continue;
    var candidate = {
        rawValue: rawValue,
        sourceRows: staffList[i].sourceRows || [],
        staffName: staffList[i].rawName || '',
        score: classified.score,
        status: classified.status,
      };
    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }
  if (best) {
    return {
      rawValue: best.rawValue,
      sourceRows: best.sourceRows,
      staffName: best.staffName,
      score: best.score,
      status: best.status,
    };
  }
  return null;
}

function auditMigrationConsistencyAgainstSource_() {
  var repairPreview = repairRosterMigratedData_({ dryRun: true });
  var collected = collectRosterSourceRows_(createMigrationRunId_());
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var backupSheets = listInternalBackupSheets_();
  var latestExternalBackup = getLatestExternalBackupMetadata_();
  var directBackupAvailable = backupSheets.length > 0 || latestExternalBackup.available;

  var members = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });
  var fees = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });

  var individualMemberIndexByKey = {};
  var businessMemberIndexByKey = {};
  var staffIndexesByMemberId = {};
  var usedMemberIndexes = {};
  var usedStaffIndexes = {};
  var expectedFees = [];
  var feeMismatches = [];
  var extraMembers = [];
  var extraStaffs = [];
  var ambiguousBusinessMembers = [];

  for (var mi = 0; mi < members.length; mi++) {
    var memberType = String(members[mi]['会員種別コード'] || '');
    if (memberType === 'INDIVIDUAL') {
      var individualKeys = buildIndividualMemberMatchKeysFromRow_(members[mi]);
      for (var mik = 0; mik < individualKeys.length; mik++) addMatchIndex_(individualMemberIndexByKey, individualKeys[mik], mi);
    } else if (memberType === 'BUSINESS') {
      addMatchIndex_(businessMemberIndexByKey, buildBusinessMemberMatchKey_(members[mi]['勤務先名'] || ''), mi);
    }
  }
  for (var si = 0; si < staffs.length; si++) {
    var staffMemberId = String(staffs[si]['会員ID'] || '');
    if (!staffIndexesByMemberId[staffMemberId]) staffIndexesByMemberId[staffMemberId] = [];
    staffIndexesByMemberId[staffMemberId].push(si);
  }

  var usedIndividualIndexes = {};
  for (var ir = 0; ir < collected.individualRows.length; ir++) {
    var sourceIndividual = collected.individualRows[ir];
    var memberIndex = claimMatchedIndex_(individualMemberIndexByKey, buildIndividualMemberMatchKeysFromSource_(sourceIndividual), usedIndividualIndexes);
    if (memberIndex < 0) continue;
    usedMemberIndexes[memberIndex] = true;
    var individualMemberId = String(members[memberIndex]['会員ID'] || '');
    var fee2024 = buildExpectedMigrationFeeEntryForAudit_(individualMemberId, 2024, sourceIndividual.rawFee2024, 3000, ROSTER_SOUKAI_DATE_2024, sourceIndividual.sourceRows);
    var fee2025 = buildExpectedMigrationFeeEntryForAudit_(individualMemberId, 2025, sourceIndividual.rawFeeIndiv2025, 3000, ROSTER_SOUKAI_DATE_2025, sourceIndividual.sourceRows);
    if (fee2024) expectedFees.push(fee2024);
    if (fee2025) expectedFees.push(fee2025);
  }

  var officeNames = Object.keys(collected.businessRowsByOffice);
  for (var oi = 0; oi < officeNames.length; oi++) {
    var officeName = officeNames[oi];
    var businessMemberCandidates = businessMemberIndexByKey[buildBusinessMemberMatchKey_(officeName)] || [];
    if (businessMemberCandidates.length > 1) {
      ambiguousBusinessMembers.push({
        officeName: officeName,
        memberIds: businessMemberCandidates.map(function(index) {
          return String(members[index]['会員ID'] || '');
        }),
      });
    }
    if (!businessMemberCandidates.length) continue;

    var businessMemberIndex = businessMemberCandidates[0];
    usedMemberIndexes[businessMemberIndex] = true;
    var businessMemberId = String(members[businessMemberIndex]['会員ID'] || '');
    var staffList = collected.businessRowsByOffice[officeName];
    var businessProjection = buildBusinessMigrationMemberRecord_(staffList, businessMemberId, new Date().toISOString(), officeName);
    var rep = businessProjection.context.rep;
    var bizFee2024 = findFirstBusinessFeeRawValue_(staffList, 'rawFee2024');
    var repFee2024 = buildExpectedMigrationFeeEntryForAudit_(businessMemberId, 2024, bizFee2024 ? bizFee2024.rawValue : '', 8000, ROSTER_SOUKAI_DATE_2024, bizFee2024 ? bizFee2024.sourceRows : (rep.sourceRows || []));
    if (repFee2024) expectedFees.push(repFee2024);

    var bizFee2025 = findFirstBusinessFeeRawValue_(staffList, 'rawFeeBiz2025');
    var repFee2025 = buildExpectedMigrationFeeEntryForAudit_(businessMemberId, 2025, bizFee2025 ? bizFee2025.rawValue : '', 8000, ROSTER_SOUKAI_DATE_2025, bizFee2025 ? bizFee2025.sourceRows : (rep.sourceRows || []));
    if (repFee2025) expectedFees.push(repFee2025);

    var currentStaffIndexes = staffIndexesByMemberId[businessMemberId] || [];
    var currentStaffKeyMap = {};
    for (var csi = 0; csi < currentStaffIndexes.length; csi++) {
      var currentStaffIndex = currentStaffIndexes[csi];
      var staffKeys = buildBusinessStaffMatchKeysFromRow_(staffs[currentStaffIndex], officeName);
      for (var sk = 0; sk < staffKeys.length; sk++) addMatchIndex_(currentStaffKeyMap, staffKeys[sk], currentStaffIndex);
    }
    var usedOfficeStaffIndexes = {};
    for (var bs = 0; bs < staffList.length; bs++) {
      var sourceStaff = staffList[bs];
      var targetStaffIndex = claimMatchedIndex_(currentStaffKeyMap, buildBusinessStaffMatchKeysFromSource_(sourceStaff, officeName), usedOfficeStaffIndexes);
      if (targetStaffIndex >= 0) usedStaffIndexes[targetStaffIndex] = true;
    }
  }

  for (var em = 0; em < members.length; em++) {
    if (usedMemberIndexes[em]) continue;
    extraMembers.push({
      memberId: String(members[em]['会員ID'] || ''),
      memberType: String(members[em]['会員種別コード'] || ''),
      name: [members[em]['姓'] || '', members[em]['名'] || ''].join(' ').trim(),
      officeName: String(members[em]['勤務先名'] || ''),
    });
  }
  for (var es = 0; es < staffs.length; es++) {
    if (usedStaffIndexes[es]) continue;
    extraStaffs.push({
      staffId: String(staffs[es]['職員ID'] || ''),
      memberId: String(staffs[es]['会員ID'] || ''),
      name: String(staffs[es]['職員名'] || ''),
    });
  }

  var currentFeeByKey = {};
  var currentFeeDuplicateKeys = [];
  var currentFeeAmountTotal = 0;
  for (var fi = 0; fi < fees.length; fi++) {
    var feeKey = String(fees[fi]['会員ID'] || '') + '|' + String(fees[fi]['対象年度'] || '');
    currentFeeAmountTotal += Number(fees[fi]['金額'] || 0);
    if (currentFeeByKey[feeKey]) {
      currentFeeDuplicateKeys.push(feeKey);
      continue;
    }
    currentFeeByKey[feeKey] = fees[fi];
  }

  var expectedFeeByKey = {};
  var expectedFeeAmountTotal = 0;
  for (var ef = 0; ef < expectedFees.length; ef++) {
    expectedFeeByKey[expectedFees[ef].key] = expectedFees[ef];
    expectedFeeAmountTotal += Number(expectedFees[ef].amount || 0);
  }

  var missingFeeKeys = [];
  var extraFeeKeys = [];
  var expectedFeeKeys = Object.keys(expectedFeeByKey);
  for (var eki = 0; eki < expectedFeeKeys.length; eki++) {
    var expectedKey = expectedFeeKeys[eki];
    var expectedFee = expectedFeeByKey[expectedKey];
    var currentFee = currentFeeByKey[expectedKey];
    if (!currentFee) {
      missingFeeKeys.push(expectedKey);
      if (feeMismatches.length < 30) {
        feeMismatches.push({
          field: 'feeRow',
          expected: 'present',
          actual: 'missing',
          context: 'memberId=' + expectedFee.memberId + ',year=' + expectedFee.year + ',sourceRows=' + expectedFee.sourceRows.join(','),
        });
      }
      continue;
    }
    compareFeeAuditField_(feeMismatches, 'status', expectedFee.status, currentFee['会費納入状態コード'], 'memberId=' + expectedFee.memberId + ',year=' + expectedFee.year);
    compareFeeAuditField_(feeMismatches, 'confirmedDate', expectedFee.confirmedDate, currentFee['納入確認日'], 'memberId=' + expectedFee.memberId + ',year=' + expectedFee.year);
    compareFeeAuditField_(feeMismatches, 'amount', expectedFee.amount, currentFee['金額'], 'memberId=' + expectedFee.memberId + ',year=' + expectedFee.year);
    compareFeeAuditField_(feeMismatches, 'note', expectedFee.note, currentFee['備考'], 'memberId=' + expectedFee.memberId + ',year=' + expectedFee.year);
  }

  var currentFeeKeys = Object.keys(currentFeeByKey);
  for (var cki = 0; cki < currentFeeKeys.length; cki++) {
    if (!expectedFeeByKey[currentFeeKeys[cki]]) extraFeeKeys.push(currentFeeKeys[cki]);
  }

  return {
    directPreMigrationComparisonAvailable: directBackupAvailable,
    backupSheetNames: backupSheets.slice(0, 20),
    latestExternalBackup: latestExternalBackup,
    limitations: directBackupAvailable ? [] : ['live DB または外部に移行前バックアップが存在しないため、移行前DBとの直接比較は未実施'],
    repairPreview: {
      memberUpdates: repairPreview.memberUpdates,
      staffUpdates: repairPreview.staffUpdates,
      authUpdates: repairPreview.authUpdates,
      unmatchedIndividuals: repairPreview.unmatchedIndividuals.length,
      unmatchedBusinessMembers: repairPreview.unmatchedBusinessMembers.length,
      unmatchedBusinessStaff: repairPreview.unmatchedBusinessStaff.length,
      sampleCount: (repairPreview.samples || []).length,
      samples: (repairPreview.samples || []).slice(0, 20),
    },
    counts: {
      sourceIndividuals: collected.individualRows.length,
      sourceBusinessMembers: officeNames.length,
      sourceBusinessStaff: officeNames.reduce(function(total, office) {
        return total + collected.businessRowsByOffice[office].length;
      }, 0),
      currentMembers: members.length,
      currentStaffs: staffs.length,
      currentFees: fees.length,
      expectedFees: expectedFees.length,
    },
    sourceMapping: {
      extraCurrentMembers: extraMembers.length,
      extraCurrentStaffs: extraStaffs.length,
      ambiguousBusinessMembers: ambiguousBusinessMembers.length,
      extraMemberSamples: extraMembers.slice(0, 20),
      extraStaffSamples: extraStaffs.slice(0, 20),
      ambiguousBusinessMemberSamples: ambiguousBusinessMembers.slice(0, 20),
    },
    feeAudit: {
      missingFeeCount: missingFeeKeys.length,
      extraFeeCount: extraFeeKeys.length,
      duplicateFeeKeyCount: currentFeeDuplicateKeys.length,
      mismatchCount: feeMismatches.length,
      expectedAmountTotal: expectedFeeAmountTotal,
      currentAmountTotal: currentFeeAmountTotal,
      missingFeeKeys: missingFeeKeys.slice(0, 30),
      extraFeeKeys: extraFeeKeys.slice(0, 30),
      duplicateFeeKeys: currentFeeDuplicateKeys.slice(0, 30),
      mismatchSamples: feeMismatches.slice(0, 30),
    },
    ok: directBackupAvailable &&
      repairPreview.memberUpdates === 0 &&
      repairPreview.staffUpdates === 0 &&
      repairPreview.authUpdates === 0 &&
      repairPreview.unmatchedIndividuals.length === 0 &&
      repairPreview.unmatchedBusinessMembers.length === 0 &&
      repairPreview.unmatchedBusinessStaff.length === 0 &&
      extraMembers.length === 0 &&
      extraStaffs.length === 0 &&
      ambiguousBusinessMembers.length === 0 &&
      missingFeeKeys.length === 0 &&
      extraFeeKeys.length === 0 &&
      currentFeeDuplicateKeys.length === 0 &&
      feeMismatches.length === 0,
  };
}

function auditMigrationConsistencyAgainstSourceJson() {
  return JSON.stringify(auditMigrationConsistencyAgainstSource_());
}

function buildExpectedAnnualFeeEntriesAgainstCurrentMembers_() {
  var collected = collectRosterSourceRows_(createMigrationRunId_());
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var members = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });
  var individualMemberIndexByKey = {};
  var businessMemberIndexByKey = {};
  var expectedFees = [];
  var mappingIssues = {
    unmatchedIndividuals: [],
    unmatchedBusinessMembers: [],
    ambiguousBusinessMembers: [],
  };

  for (var mi = 0; mi < members.length; mi++) {
    var memberType = String(members[mi]['会員種別コード'] || '');
    if (memberType === 'INDIVIDUAL') {
      var individualKeys = buildIndividualMemberMatchKeysFromRow_(members[mi]);
      for (var mik = 0; mik < individualKeys.length; mik++) addMatchIndex_(individualMemberIndexByKey, individualKeys[mik], mi);
    } else if (memberType === 'BUSINESS') {
      addMatchIndex_(businessMemberIndexByKey, buildBusinessMemberMatchKey_(members[mi]['勤務先名'] || ''), mi);
    }
  }

  var usedIndividualIndexes = {};
  for (var ir = 0; ir < collected.individualRows.length; ir++) {
    var sourceIndividual = collected.individualRows[ir];
    var memberIndex = claimMatchedIndex_(individualMemberIndexByKey, buildIndividualMemberMatchKeysFromSource_(sourceIndividual), usedIndividualIndexes);
    if (memberIndex < 0) {
      mappingIssues.unmatchedIndividuals.push({
        sourceRows: sourceIndividual.sourceRows,
        name: sourceIndividual.rawName,
        cmNumber: sourceIndividual.rawCmNumber,
      });
      continue;
    }
    var individualMemberId = String(members[memberIndex]['会員ID'] || '');
    var fee2024 = buildExpectedMigrationFeeEntryForAudit_(individualMemberId, 2024, sourceIndividual.rawFee2024, 3000, ROSTER_SOUKAI_DATE_2024, sourceIndividual.sourceRows);
    var fee2025 = buildExpectedMigrationFeeEntryForAudit_(individualMemberId, 2025, sourceIndividual.rawFeeIndiv2025, 3000, ROSTER_SOUKAI_DATE_2025, sourceIndividual.sourceRows);
    if (fee2024) expectedFees.push(fee2024);
    if (fee2025) expectedFees.push(fee2025);
  }

  var officeNames = Object.keys(collected.businessRowsByOffice);
  for (var oi = 0; oi < officeNames.length; oi++) {
    var officeName = officeNames[oi];
    var businessMemberCandidates = businessMemberIndexByKey[buildBusinessMemberMatchKey_(officeName)] || [];
    if (businessMemberCandidates.length > 1) {
      mappingIssues.ambiguousBusinessMembers.push({
        officeName: officeName,
        memberIds: businessMemberCandidates.map(function(index) {
          return String(members[index]['会員ID'] || '');
        }),
      });
    }
    if (!businessMemberCandidates.length) {
      mappingIssues.unmatchedBusinessMembers.push({ officeName: officeName });
      continue;
    }
    var businessMemberId = String(members[businessMemberCandidates[0]]['会員ID'] || '');
    var staffList = collected.businessRowsByOffice[officeName];
    var bizFee2024 = findFirstBusinessFeeRawValue_(staffList, 'rawFee2024');
    var bizFee2025 = findFirstBusinessFeeRawValue_(staffList, 'rawFeeBiz2025');
    var fee2024Biz = buildExpectedMigrationFeeEntryForAudit_(businessMemberId, 2024, bizFee2024 ? bizFee2024.rawValue : '', 8000, ROSTER_SOUKAI_DATE_2024, bizFee2024 ? bizFee2024.sourceRows : []);
    var fee2025Biz = buildExpectedMigrationFeeEntryForAudit_(businessMemberId, 2025, bizFee2025 ? bizFee2025.rawValue : '', 8000, ROSTER_SOUKAI_DATE_2025, bizFee2025 ? bizFee2025.sourceRows : []);
    if (fee2024Biz) expectedFees.push(fee2024Biz);
    if (fee2025Biz) expectedFees.push(fee2025Biz);
  }

  return {
    expectedFees: expectedFees,
    mappingIssues: mappingIssues,
  };
}

function repairAnnualFeeRowsAgainstSource_(options) {
  var dryRun = !(options && options.dryRun === false);
  var expected = buildExpectedAnnualFeeEntriesAgainstCurrentMembers_();
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var feeSheet = ss.getSheetByName('T_年会費納入履歴');
  if (!feeSheet) throw new Error('T_年会費納入履歴 が見つかりません。');

  var headers = feeSheet.getRange(1, 1, 1, feeSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var hi = 0; hi < headers.length; hi++) cols[headers[hi]] = hi;
  var feeData = feeSheet.getLastRow() > 1 ? feeSheet.getRange(2, 1, feeSheet.getLastRow() - 1, feeSheet.getLastColumn()).getValues() : [];
  var currentFeeByKey = {};
  for (var fi = 0; fi < feeData.length; fi++) {
    if (toBoolean_(feeData[fi][cols['削除フラグ']])) continue;
    var key = String(feeData[fi][cols['会員ID']] || '') + '|' + String(feeData[fi][cols['対象年度']] || '');
    if (currentFeeByKey[key] == null) currentFeeByKey[key] = fi;
  }

  var now = new Date().toISOString();
  var summary = {
    dryRun: dryRun,
    inserted: 0,
    updated: 0,
    samples: [],
    mappingIssues: {
      unmatchedIndividuals: expected.mappingIssues.unmatchedIndividuals.length,
      unmatchedBusinessMembers: expected.mappingIssues.unmatchedBusinessMembers.length,
      ambiguousBusinessMembers: expected.mappingIssues.ambiguousBusinessMembers.length,
    },
  };

  for (var ei = 0; ei < expected.expectedFees.length; ei++) {
    var expectedFee = expected.expectedFees[ei];
    var rowIndex = currentFeeByKey[expectedFee.key];
    if (rowIndex == null) {
      var newRow = headers.map(function() { return ''; });
      newRow[cols['年会費履歴ID']] = Utilities.getUuid();
      newRow[cols['会員ID']] = expectedFee.memberId;
      newRow[cols['対象年度']] = expectedFee.year;
      newRow[cols['会費納入状態コード']] = expectedFee.status;
      newRow[cols['納入確認日']] = expectedFee.confirmedDate;
      newRow[cols['金額']] = expectedFee.amount;
      newRow[cols['備考']] = expectedFee.note;
      if (cols['作成日時'] != null) newRow[cols['作成日時']] = now;
      if (cols['更新日時'] != null) newRow[cols['更新日時']] = now;
      if (cols['削除フラグ'] != null) newRow[cols['削除フラグ']] = false;
      feeData.push(newRow);
      currentFeeByKey[expectedFee.key] = feeData.length - 1;
      summary.inserted++;
      if (summary.samples.length < 20) summary.samples.push({ type: 'INSERT', key: expectedFee.key, sourceRows: expectedFee.sourceRows });
      continue;
    }

    var row = feeData[rowIndex];
    var changedFields = [];
    if (normalizeFeeAuditComparableValue_('status', row[cols['会費納入状態コード']]) !== normalizeFeeAuditComparableValue_('status', expectedFee.status)) {
      row[cols['会費納入状態コード']] = expectedFee.status;
      changedFields.push('会費納入状態コード');
    }
    if (normalizeFeeAuditComparableValue_('confirmedDate', row[cols['納入確認日']]) !== normalizeFeeAuditComparableValue_('confirmedDate', expectedFee.confirmedDate)) {
      row[cols['納入確認日']] = expectedFee.confirmedDate;
      changedFields.push('納入確認日');
    }
    if (normalizeFeeAuditComparableValue_('amount', row[cols['金額']]) !== normalizeFeeAuditComparableValue_('amount', expectedFee.amount)) {
      row[cols['金額']] = expectedFee.amount;
      changedFields.push('金額');
    }
    if (normalizeFeeAuditComparableValue_('note', row[cols['備考']]) !== normalizeFeeAuditComparableValue_('note', expectedFee.note)) {
      row[cols['備考']] = expectedFee.note;
      changedFields.push('備考');
    }
    if (changedFields.length) {
      if (cols['更新日時'] != null) row[cols['更新日時']] = now;
      summary.updated++;
      if (summary.samples.length < 20) summary.samples.push({ type: 'UPDATE', key: expectedFee.key, fields: changedFields, sourceRows: expectedFee.sourceRows });
    }
  }

  if (dryRun) return summary;

  summary.backup = backupBeforeMigration_();
  if (feeSheet.getLastRow() > 1) {
    feeSheet.getRange(2, 1, feeSheet.getLastRow() - 1, feeSheet.getLastColumn()).clearContent();
  }
  if (feeData.length) {
    feeSheet.getRange(2, 1, feeData.length, feeData[0].length).setValues(feeData);
  }
  clearAllDataCache_();
  clearAdminDashboardCache_();
  summary.remainingAudit = auditMigrationConsistencyAgainstSource_();
  return summary;
}

function previewAnnualFeeRepairAgainstSourceJson() {
  return JSON.stringify(repairAnnualFeeRowsAgainstSource_({ dryRun: true }));
}

function repairAnnualFeeAgainstSourceJson() {
  return JSON.stringify(repairAnnualFeeRowsAgainstSource_({ dryRun: false }));
}

function inspectBusinessOfficeFeeSource_(officeName) {
  var targetOfficeName = String(officeName || '').trim();
  if (!targetOfficeName) throw new Error('officeName is required.');
  var collected = collectRosterSourceRows_(createMigrationRunId_());
  var staffList = collected.businessRowsByOffice[targetOfficeName];
  if (!staffList || !staffList.length) {
    return { officeName: targetOfficeName, found: false };
  }
  return {
    officeName: targetOfficeName,
    found: true,
    entries: staffList.map(function(staff) {
      return {
        sourceRows: staff.sourceRows || [],
        name: staff.rawName || '',
        rawFee2024: staff.rawFee2024 || '',
        rawFeeBiz2025: staff.rawFeeBiz2025 || '',
        rawMailDest: staff.rawMailDest || '',
        rawEmail: staff.rawEmail || '',
      };
    }),
  };
}

function inspectBusinessOfficeFeeSourceJson(officeName) {
  return JSON.stringify(inspectBusinessOfficeFeeSource_(officeName));
}

function inspectBusinessFeeSourceByMemberId_(memberId) {
  var targetMemberId = String(memberId || '').trim();
  if (!targetMemberId) throw new Error('memberId is required.');
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['会員ID'] || '') === targetMemberId;
  });
  if (!memberRows.length) {
    return { memberId: targetMemberId, found: false };
  }
  var officeName = String(memberRows[0]['勤務先名'] || '');
  var sourceInfo = inspectBusinessOfficeFeeSource_(officeName);
  sourceInfo.memberId = targetMemberId;
  sourceInfo.memberName = [memberRows[0]['姓'] || '', memberRows[0]['名'] || ''].join(' ').trim();
  return sourceInfo;
}

function inspectBusinessFeeSourceByMemberIdJson(memberId) {
  return JSON.stringify(inspectBusinessFeeSourceByMemberId_(memberId));
}

function backupMigrationTargets_() {
  return backupBeforeMigration_();
}

function backupMigrationTargetsJson() {
  return JSON.stringify(backupMigrationTargets_());
}

function debugRosterRepairIndexSummary() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });
  var individualRows = memberRows.filter(function(row) {
    return String(row['会員種別コード'] || '') === 'INDIVIDUAL';
  });
  var businessRows = memberRows.filter(function(row) {
    return String(row['会員種別コード'] || '') === 'BUSINESS';
  });
  return {
    totalMembers: memberRows.length,
    individualCount: individualRows.length,
    businessCount: businessRows.length,
    firstIndividual: individualRows.slice(0, 5).map(function(row) {
      return {
        memberId: row['会員ID'],
        fullName: [row['姓'] || '', row['名'] || ''].join(' ').trim(),
        careManagerNumber: row['介護支援専門員番号'] || '',
        email: row['代表メールアドレス'] || '',
        officeName: row['勤務先名'] || '',
        keys: buildIndividualMemberMatchKeysFromRow_(row),
      };
    }),
    firstBusiness: businessRows.slice(0, 5).map(function(row) {
      return {
        memberId: row['会員ID'],
        officeName: row['勤務先名'] || '',
        key: buildBusinessMemberMatchKey_(row['勤務先名'] || ''),
      };
    }),
  };
}

function debugRosterRepairIndexSummaryJson() {
  return JSON.stringify(debugRosterRepairIndexSummary());
}

function debugMemberRowRaw(memberId) {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('T_会員 が空です。');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var found = findRowByColumnValue_(sheet, '会員ID', String(memberId || ''));
  if (!found) throw new Error('会員ID が見つかりません: ' + memberId);
  var pairs = [];
  for (var i = 0; i < headers.length; i++) {
    pairs.push({
      header: headers[i],
      value: found.row[i],
    });
  }
  return {
    memberId: memberId,
    rowNumber: found.rowNumber,
    pairs: pairs,
  };
}

function debugMemberRowRawJson(memberId) {
  return JSON.stringify(debugMemberRowRaw(memberId));
}

function debugStaffRowRaw(staffId) {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員');
  return staffRows.filter(function(row) {
    return String(row['職員ID'] || '') === String(staffId || '');
  })[0] || null;
}

function debugStaffRowRawJson(staffId) {
  return JSON.stringify(debugStaffRowRaw(staffId));
}

function debugSampleBusinessStaffRowRawJson() {
  return debugStaffRowRawJson('48140703-ba30-4629-ab5d-01fa449fd0bb');
}

function repairRosterMigrationData() {
  return repairRosterMigratedData_({ dryRun: false });
}

function repairRosterMigrationDataJson() {
  return JSON.stringify(repairRosterMigrationData());
}

/**
 * Phase 5: 移行結果の検証
 */
function verifyMigration_(expected) {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var results = [];

  // T_会員
  var memberSheet = ss.getSheetByName('T_会員');
  var memberCount = memberSheet ? memberSheet.getLastRow() - 1 : 0;
  results.push('T_会員: ' + memberCount + '件');

  // T_事業所職員
  var staffSheet = ss.getSheetByName('T_事業所職員');
  var staffCount = staffSheet ? staffSheet.getLastRow() - 1 : 0;
  results.push('T_事業所職員: ' + staffCount + '件');

  // T_認証アカウント
  var authSheet = ss.getSheetByName('T_認証アカウント');
  var authCount = authSheet ? authSheet.getLastRow() - 1 : 0;
  results.push('T_認証アカウント: ' + authCount + '件');

  // T_年会費納入履歴
  var feeSheet = ss.getSheetByName('T_年会費納入履歴');
  var feeCount = feeSheet ? feeSheet.getLastRow() - 1 : 0;
  results.push('T_年会費納入履歴: ' + feeCount + '件');

  // 参照整合性チェック
  var integrityErrors = [];

  if (memberSheet && memberCount > 0) {
    var mHeaders = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn()).getValues()[0];
    var mIdCol = mHeaders.indexOf('会員ID');
    var mTypeCol = mHeaders.indexOf('会員種別コード');
    var mData = memberSheet.getRange(2, 1, memberCount, memberSheet.getLastColumn()).getValues();
    var memberIds = {};
    var businessMemberIds = {};
    for (var mi = 0; mi < mData.length; mi++) {
      var mid = String(mData[mi][mIdCol] || '');
      if (memberIds[mid]) integrityErrors.push('T_会員: 会員ID重複 "' + mid + '"');
      memberIds[mid] = true;
      if (String(mData[mi][mTypeCol] || '') === 'BUSINESS') businessMemberIds[mid] = true;
    }

    // 職員の会員ID参照チェック
    var staffIds = {};
    var staffCountByMemberId = {};
    var representativeCountByMemberId = {};
    if (staffSheet && staffCount > 0) {
      var sHeaders = staffSheet.getRange(1, 1, 1, staffSheet.getLastColumn()).getValues()[0];
      var sIdCol = sHeaders.indexOf('職員ID');
      var sMemberIdCol = sHeaders.indexOf('会員ID');
      var sRoleCol = sHeaders.indexOf('職員権限コード');
      var sData = staffSheet.getRange(2, 1, staffCount, staffSheet.getLastColumn()).getValues();
      for (var si = 0; si < sData.length; si++) {
        var staffId = String(sData[si][sIdCol] || '');
        if (!staffId) integrityErrors.push('T_事業所職員行' + (si + 2) + ': 職員ID が空');
        if (staffIds[staffId]) integrityErrors.push('T_事業所職員: 職員ID重複 "' + staffId + '"');
        staffIds[staffId] = true;
        var sMid = String(sData[si][sMemberIdCol] || '');
        if (!memberIds[sMid]) integrityErrors.push('T_事業所職員行' + (si + 2) + ': 会員ID "' + sMid + '" がT_会員に存在しない');
        staffCountByMemberId[sMid] = (staffCountByMemberId[sMid] || 0) + 1;
        if (String(sData[si][sRoleCol] || '') === 'REPRESENTATIVE') {
          representativeCountByMemberId[sMid] = (representativeCountByMemberId[sMid] || 0) + 1;
        }
      }
      var businessMemberIdList = Object.keys(businessMemberIds);
      for (var bmi = 0; bmi < businessMemberIdList.length; bmi++) {
        var businessMemberId = businessMemberIdList[bmi];
        if (!staffCountByMemberId[businessMemberId]) {
          integrityErrors.push('T_会員: 事業所会員 "' + businessMemberId + '" に紐づく職員が存在しない');
        }
        if ((representativeCountByMemberId[businessMemberId] || 0) !== 1) {
          integrityErrors.push('T_会員: 事業所会員 "' + businessMemberId + '" の代表者数が1件ではない');
        }
      }
    }

    // 認証の会員ID参照チェック
    if (authSheet && authCount > 0) {
      var aHeaders = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
      var aMemberIdCol = aHeaders.indexOf('会員ID');
      var aStaffIdCol = aHeaders.indexOf('職員ID');
      var aLoginIdCol = aHeaders.indexOf('ログインID');
      var aRoleCol = aHeaders.indexOf('システムロールコード');
      var aData = authSheet.getRange(2, 1, authCount, authSheet.getLastColumn()).getValues();
      var loginIds = {};
      for (var ai = 0; ai < aData.length; ai++) {
        var aMid = String(aData[ai][aMemberIdCol] || '');
        if (!memberIds[aMid]) integrityErrors.push('T_認証アカウント行' + (ai + 2) + ': 会員ID "' + aMid + '" がT_会員に存在しない');
        var aStaffId = String(aData[ai][aStaffIdCol] || '');
        var aRole = String(aData[ai][aRoleCol] || '');
        if (aStaffId && !staffIds[aStaffId]) {
          integrityErrors.push('T_認証アカウント行' + (ai + 2) + ': 職員ID "' + aStaffId + '" がT_事業所職員に存在しない');
        }
        if (!aStaffId && (aRole === 'BUSINESS_ADMIN' || aRole === 'BUSINESS_MEMBER')) {
          integrityErrors.push('T_認証アカウント行' + (ai + 2) + ': 事業所ロールなのに職員IDが空');
        }
        var aLid = String(aData[ai][aLoginIdCol] || '');
        if (!aLid) integrityErrors.push('T_認証アカウント行' + (ai + 2) + ': ログインIDが空');
        if (loginIds[aLid]) integrityErrors.push('T_認証アカウント: ログインID重複 "' + aLid + '"');
        loginIds[aLid] = true;
      }
    }

    // 年会費の会員ID参照チェック
    if (feeSheet && feeCount > 0) {
      var fHeaders = feeSheet.getRange(1, 1, 1, feeSheet.getLastColumn()).getValues()[0];
      var fMemberIdCol = fHeaders.indexOf('会員ID');
      var fYearCol = fHeaders.indexOf('対象年度');
      var fData = feeSheet.getRange(2, 1, feeCount, feeSheet.getLastColumn()).getValues();
      var feeKeys = {};
      for (var fi = 0; fi < fData.length; fi++) {
        var fMid = String(fData[fi][fMemberIdCol] || '');
        if (!memberIds[fMid]) integrityErrors.push('T_年会費行' + (fi + 2) + ': 会員ID "' + fMid + '" がT_会員に存在しない');
        var feeKey = fMid + '|' + String(fData[fi][fYearCol] || '');
        if (feeKeys[feeKey]) integrityErrors.push('T_年会費納入履歴: 同一会員・同一年度の重複 "' + feeKey + '"');
        feeKeys[feeKey] = true;
      }
    }

    var authIdMap = {};
    var authRowsForIntegrity = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
    for (var am = 0; am < authRowsForIntegrity.length; am += 1) {
      authIdMap[String(authRowsForIntegrity[am]['認証ID'] || '')] = authRowsForIntegrity[am];
    }

    var whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
      return !toBoolean_(r['削除フラグ']);
    });
    for (var wi = 0; wi < whitelistRows.length; wi += 1) {
      var wlId = String(whitelistRows[wi]['ホワイトリストID'] || '');
      var wlAuthId = String(whitelistRows[wi]['紐付け認証ID'] || '');
      var wlMemberId = String(whitelistRows[wi]['紐付け会員ID'] || '');
      if (wlAuthId && !authIdMap[wlAuthId]) {
        integrityErrors.push('T_管理者Googleホワイトリスト "' + wlId + '": 紐付け認証ID "' + wlAuthId + '" がT_認証アカウントに存在しない');
      }
      if (wlMemberId && !memberIds[wlMemberId]) {
        integrityErrors.push('T_管理者Googleホワイトリスト "' + wlId + '": 紐付け会員ID "' + wlMemberId + '" がT_会員に存在しない');
      }
      if (wlAuthId && authIdMap[wlAuthId] && wlMemberId && String(authIdMap[wlAuthId]['会員ID'] || '') !== wlMemberId) {
        integrityErrors.push('T_管理者Googleホワイトリスト "' + wlId + '": 紐付け認証IDと紐付け会員IDの会員参照が一致しない');
      }
    }

    var loginRows = getRowsAsObjects_(getLogSs_(), 'T_ログイン履歴'); // v259: ログSS
    for (var li = 0; li < loginRows.length; li += 1) {
      var loginAuthId = String(loginRows[li]['認証ID'] || '');
      if (loginAuthId && !authIdMap[loginAuthId]) {
        integrityErrors.push('T_ログイン履歴 "' + String(loginRows[li]['ログイン履歴ID'] || '') + '": 認証ID "' + loginAuthId + '" がT_認証アカウントに存在しない');
      }
    }

    var trainingContext = buildTrainingApplicationRelationContext_(ss);
    var applicationRows = getRowsAsObjects_(ss, 'T_研修申込').filter(function(r) {
      return !toBoolean_(r['削除フラグ']);
    });
    for (var ap = 0; ap < applicationRows.length; ap += 1) {
      var appIssues = getTrainingApplicationIntegrityIssues_(applicationRows[ap], trainingContext);
      if (appIssues.length) {
        integrityErrors.push('T_研修申込 "' + String(applicationRows[ap]['申込ID'] || '') + '": ' + appIssues.join(', '));
      }
    }

    var trainingRowsForIntegrity = getRowsAsObjects_(ss, 'T_研修').filter(function(r) {
      return !toBoolean_(r['削除フラグ']);
    });
    for (var ti = 0; ti < trainingRowsForIntegrity.length; ti += 1) {
      var trainingId = String(trainingRowsForIntegrity[ti]['研修ID'] || '');
      var storedApplicants = Number(trainingRowsForIntegrity[ti]['申込者数'] || 0);
      var actualApplicants = countAppliedApplicants_(ss, trainingId);
      if (storedApplicants !== actualApplicants) {
        integrityErrors.push('T_研修 "' + trainingId + '": 申込者数 stored=' + storedApplicants + ' actual=' + actualApplicants);
      }
    }
  }

  if (expected) {
    if (expected.memberCount !== undefined && memberCount !== Number(expected.memberCount)) {
      integrityErrors.push('期待件数不一致: T_会員 actual=' + memberCount + ' expected=' + expected.memberCount);
    }
    if (expected.staffCount !== undefined && staffCount !== Number(expected.staffCount)) {
      integrityErrors.push('期待件数不一致: T_事業所職員 actual=' + staffCount + ' expected=' + expected.staffCount);
    }
    if (expected.authCount !== undefined && authCount !== Number(expected.authCount)) {
      integrityErrors.push('期待件数不一致: T_認証アカウント actual=' + authCount + ' expected=' + expected.authCount);
    }
    if (expected.feeCount !== undefined && feeCount !== Number(expected.feeCount)) {
      integrityErrors.push('期待件数不一致: T_年会費納入履歴 actual=' + feeCount + ' expected=' + expected.feeCount);
    }
  }

  var summary = {
    counts: results,
    integrityErrors: integrityErrors,
    integrityOk: integrityErrors.length === 0,
  };

  Logger.log('=== 検証結果 ===');
  Logger.log(results.join('\n'));
  if (integrityErrors.length > 0) {
    Logger.log('整合性エラー: ' + integrityErrors.length + '件');
    for (var ei = 0; ei < integrityErrors.length; ei++) Logger.log('  ' + integrityErrors[ei]);
  } else {
    Logger.log('参照整合性: OK');
  }

  return summary;
}

// ── CLI エントリポイント（clasp run 用） ──

function dryRunMigration() {
  var lock = LockService.getScriptLock();
  lock.waitLock(MIGRATION_LOCK_WAIT_MS);
  var runId = createMigrationRunId_();
  updateMigrationRunStatus_('DRY_RUN_RUNNING', runId, 'DRY_RUN', '');
  try {
    var result = migrateRoster2025_({ dryRun: true, runId: runId });
    writeMigrationReports_(result, null, '');
    delete result._report;
    updateMigrationRunStatus_('COMPLETED', runId, 'DRY_RUN', '');
    return result;
  } catch (error) {
    updateMigrationRunStatus_('FAILED', runId, 'DRY_RUN', error && error.message ? error.message : String(error));
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function executeMigration() {
  var lock = LockService.getScriptLock();
  lock.waitLock(MIGRATION_LOCK_WAIT_MS);
  var runId = createMigrationRunId_();
  updateMigrationRunStatus_('EXECUTE_RUNNING', runId, 'EXECUTE', '');
  var backup = null;
  try {
    backup = backupBeforeMigration_();
    Logger.log('バックアップ: ' + backup.suffix);
    clearMigrationTargets_();
    var result = migrateRoster2025_({ dryRun: false, runId: runId });
    var verify = verifyMigration_(result);
    result.verification = verify;
    result.backupSuffix = backup.suffix;
    writeMigrationReports_(result, verify, backup.suffix);
    delete result._report;
    updateMigrationRunStatus_('COMPLETED', runId, 'EXECUTE', '');
    return result;
  } catch (error) {
    updateMigrationRunStatus_('FAILED', runId, 'EXECUTE', error && error.message ? error.message : String(error));
    if (backup && backup.suffix) {
      Logger.log('必要に応じて rollbackMigration_(\'' + backup.suffix + '\') を実行してください。');
    }
    throw error;
  } finally {
    lock.releaseLock();
  }
}

// ── v131 補正関数 ──

/**
 * ソース V列の入会日を _MIGRATION_MAP 経由で T_会員.入会日 に補正する（dry-run 対応）
 * 呼び出し: clasp run repairJoinedDateFromSourceJson
 */
function repairJoinedDateFromSourceJson() {
  return JSON.stringify(repairJoinedDateFromSource_(true));
}

function executeRepairJoinedDateFromSourceJson() {
  return JSON.stringify(repairJoinedDateFromSource_(false));
}

function repairJoinedDateFromSource_(dryRun) {
  var source = readRosterSource_();
  var data = source.data;
  var col = source.colMap;

  // ソースからCM番号→入会日、勤務先→最古の入会日のマップを構築
  var cmDateMap = {};       // CM番号 → 入会日（個人会員用）
  var officeNameDateMap = {}; // 勤務先名 → 最古の入会日（事業所会員用）
  var sourceWithDate = 0;
  var sourceWithoutDate = 0;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var name = String(row[col.name] || '').trim();
    if (!name) continue;
    var vDate = col.joinedDate >= 0 ? normalizeRosterDate_(row[col.joinedDate]) : '';
    if (!vDate) { sourceWithoutDate++; continue; }
    sourceWithDate++;

    var cmNumber = normalizeRosterCellText_(row[col.cmNumber]);
    var workplace = normalizeRosterCellText_(row[col.workplace]);
    var memberType = normalizeRosterCellText_(row[col.memberType]);

    // CM番号マップ（個人会員・事業所職員とも登録）
    if (cmNumber) {
      var cmKeys = buildLooseIdKeys_(cmNumber);
      for (var ck = 0; ck < cmKeys.length; ck++) {
        if (!cmDateMap[cmKeys[ck]] || vDate < cmDateMap[cmKeys[ck]]) {
          cmDateMap[cmKeys[ck]] = vDate;
        }
      }
    }

    // 勤務先マップ（事業所会員用: 同一勤務先の最古の日付）
    if (memberType === '事業所' && workplace) {
      var wpKey = normalizeRosterKeyText_(workplace);
      if (!officeNameDateMap[wpKey] || vDate < officeNameDateMap[wpKey]) {
        officeNameDateMap[wpKey] = vDate;
      }
    }
  }

  // T_会員を読み込み、更新対象を特定
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberSheet = ss.getSheetByName('T_会員');
  var lastRow = memberSheet.getLastRow();
  var lastCol = memberSheet.getLastColumn();
  var headers = memberSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var memberData = lastRow > 1 ? memberSheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];

  var colIdx = {};
  for (var hi = 0; hi < headers.length; hi++) colIdx[headers[hi]] = hi;
  var idCol = colIdx['会員ID'];
  var joinedCol = colIdx['入会日'];
  var updatedAtCol = colIdx['更新日時'];
  var typeCol = colIdx['会員種別コード'];
  var cmCol = colIdx['介護支援専門員番号'];
  var officeNameCol = colIdx['勤務先名'];

  var updates = [];
  var alreadyCorrect = 0;
  var noMapping = 0;
  var now = new Date().toISOString();

  for (var ri = 0; ri < memberData.length; ri++) {
    var mId = String(memberData[ri][idCol] == null ? '' : memberData[ri][idCol]).trim();
    var currentJoined = memberData[ri][joinedCol];
    var currentJoinedStr = '';
    if (currentJoined instanceof Date) {
      currentJoinedStr = isNaN(currentJoined.getTime()) ? '' : Utilities.formatDate(currentJoined, 'Asia/Tokyo', 'yyyy-MM-dd');
    } else {
      currentJoinedStr = normalizeRosterDate_(currentJoined);
    }
    var memberType = String(memberData[ri][typeCol] || '').trim();
    var cmNum = String(memberData[ri][cmCol] == null ? '' : memberData[ri][cmCol]).trim();
    var officeName = String(memberData[ri][officeNameCol] || '').trim();

    var newDate = null;
    var matchMethod = '';

    if (memberType === 'BUSINESS') {
      // 事業所会員: 勤務先名でマッチ
      if (officeName) {
        var wpKey2 = normalizeRosterKeyText_(officeName);
        if (officeNameDateMap[wpKey2]) {
          newDate = officeNameDateMap[wpKey2];
          matchMethod = 'officeName';
        }
      }
    } else {
      // 個人・賛助: CM番号でマッチ
      if (cmNum) {
        var cmKeys2 = buildLooseIdKeys_(cmNum);
        for (var ck2 = 0; ck2 < cmKeys2.length; ck2++) {
          if (cmDateMap[cmKeys2[ck2]]) {
            newDate = cmDateMap[cmKeys2[ck2]];
            matchMethod = 'cmNumber';
            break;
          }
        }
      }
    }

    if (!newDate) {
      noMapping++;
      continue;
    }

    if (currentJoinedStr && currentJoinedStr === newDate) {
      alreadyCorrect++;
      continue;
    }

    updates.push({
      rowIndex: ri,
      memberId: mId,
      memberType: memberType,
      matchMethod: matchMethod,
      matchKey: matchMethod === 'officeName' ? officeName : cmNum,
      oldJoinedDate: currentJoinedStr || '(blank)',
      newJoinedDate: newDate,
    });
  }

  if (!dryRun && updates.length > 0) {
    for (var ui = 0; ui < updates.length; ui++) {
      var u = updates[ui];
      memberData[u.rowIndex][joinedCol] = u.newJoinedDate;
      memberData[u.rowIndex][updatedAtCol] = now;
    }
    memberSheet.getRange(2, 1, memberData.length, memberData[0].length).setValues(memberData);
  }

  return {
    dryRun: dryRun,
    sourceDateCount: sourceWithDate,
    sourceNoDateCount: sourceWithoutDate,
    cmDateMapSize: Object.keys(cmDateMap).length,
    officeNameDateMapSize: Object.keys(officeNameDateMap).length,
    totalMembers: memberData.length,
    alreadyCorrect: alreadyCorrect,
    noMappingFound: noMapping,
    updatedCount: updates.length,
    updates: dryRun ? updates : updates.map(function(u) { return { memberId: u.memberId, newJoinedDate: u.newJoinedDate }; }),
  };
}

/**
 * 入会日が不明な会員のリストを返す
 */
function listMembersWithoutJoinedDateJson() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var members = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var result = [];
  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    var joined = m['入会日'];
    var joinedStr = '';
    if (joined instanceof Date) {
      joinedStr = isNaN(joined.getTime()) ? '' : Utilities.formatDate(joined, 'Asia/Tokyo', 'yyyy-MM-dd');
    } else {
      joinedStr = String(joined || '').trim();
    }
    if (!joinedStr) {
      var memberType = String(m['会員種別コード'] || '');
      var name = (String(m['姓'] || '') + '　' + String(m['名'] || '')).trim();
      if (!name || name === '　') name = String(m['勤務先名'] || '(不明)');
      result.push({
        memberId: String(m['会員ID'] == null ? '' : m['会員ID']),
        memberType: memberType,
        name: name,
        officeName: String(m['勤務先名'] || ''),
        cmNumber: String(m['介護支援専門員番号'] == null ? '' : m['介護支援専門員番号']),
        status: String(m['会員状態コード'] || ''),
      });
    }
  }
  return JSON.stringify({ count: result.length, members: result });
}

/**
 * T_事業所職員の介護支援専門員番号をソース M列から補正する（dry-run）
 * マッチ方式: K列(勤務先) = T_会員.勤務先名 AND 職員の姓がL列/N列(氏名)に含まれる
 * 呼び出し: clasp run repairStaffCareManagerNumberFromSourceJson
 */
function repairStaffCareManagerNumberFromSourceJson() {
  return JSON.stringify(repairStaffCareManagerNumberFromSource_(true));
}

/**
 * v133: 既存の T_事業所職員 の メール配信希望コード が空のレコードを 'YES' で埋める。
 * 呼び出し: clasp run backfillStaffMailingPreferenceJson
 */
function backfillStaffMailingPreferenceJson() {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheet = ss.getSheetByName('T_事業所職員');
  if (!sheet) return JSON.stringify({ error: 'T_事業所職員 not found' });
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIdx = headers.indexOf('メール配信希望コード');
  if (colIdx === -1) return JSON.stringify({ error: 'メール配信希望コード column not found' });
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return JSON.stringify({ updated: 0, total: 0 });
  var data = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
  var updated = 0;
  for (var i = 0; i < data.length; i++) {
    var val = String(data[i][0] || '').trim();
    if (!val) {
      sheet.getRange(i + 2, colIdx + 1).setValue('YES');
      updated++;
    }
  }
  return JSON.stringify({ updated: updated, total: data.length });
}

function executeRepairStaffCareManagerNumberFromSourceJson() {
  return JSON.stringify(repairStaffCareManagerNumberFromSource_(false));
}

function repairStaffCareManagerNumberFromSource_(dryRun) {
  var source = readRosterSource_();
  var data = source.data;
  var col = source.colMap;

  // ソースから事業所行を抽出: 勤務先 + 名前 + CM番号
  var sourceEntries = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var workplace = normalizeRosterCellText_(row[col.workplace]);
    if (!workplace) continue;
    var sourceName = normalizeRosterCellText_(row[col.name]);
    if (!sourceName) {
      sourceName = normalizeRosterCellText_(row[col.furigana]);
    }
    if (!sourceName) continue;
    var cmNumber = normalizeRosterCellText_(row[col.cmNumber]);
    sourceEntries.push({
      workplaceKey: normalizeRosterKeyText_(workplace),
      workplaceRaw: workplace,
      sourceName: sourceName,
      sourceNameKey: normalizeRosterKeyText_(sourceName),
      cmNumber: cmNumber,
      sourceRow: i + 2,
    });
  }

  // DB読み込み
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);

  // T_会員: 会員ID → 勤務先名マップ（事業所会員のみ）
  var memberRows = getRowsAsObjects_(ss, 'T_会員');
  var memberOfficeMap = {};
  var memberOfficeRaw = {};
  for (var mi = 0; mi < memberRows.length; mi++) {
    var m = memberRows[mi];
    if (String(m['会員種別コード'] || '') !== 'BUSINESS') continue;
    var mId = String(m['会員ID'] == null ? '' : m['会員ID']).trim();
    var office = String(m['勤務先名'] || '').trim();
    if (mId && office) {
      memberOfficeMap[mId] = normalizeRosterKeyText_(office);
      memberOfficeRaw[mId] = office;
    }
  }

  // T_事業所職員を読み込み
  var staffSheet = ss.getSheetByName('T_事業所職員');
  var lastRow = staffSheet.getLastRow();
  var lastCol = staffSheet.getLastColumn();
  var headers = staffSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var staffData = lastRow > 1 ? staffSheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];

  var colIdx = {};
  for (var hi = 0; hi < headers.length; hi++) colIdx[headers[hi]] = hi;
  var staffIdCol = colIdx['職員ID'];
  var cmCol = colIdx['介護支援専門員番号'];
  var updatedAtCol = colIdx['更新日時'];
  var lastNameCol = colIdx['姓'];
  var nameCol = colIdx['氏名'];
  var memberIdCol = colIdx['会員ID'];

  var updates = [];
  var alreadyHasValue = 0;
  var noMapping = [];
  var sourceCmBlank = 0;
  var now = new Date().toISOString();

  for (var ri = 0; ri < staffData.length; ri++) {
    var sId = String(staffData[ri][staffIdCol] || '').trim();
    if (!sId) continue;

    var currentCm = String(staffData[ri][cmCol] == null ? '' : staffData[ri][cmCol]).trim();
    if (currentCm) {
      alreadyHasValue++;
      continue;
    }

    var staffMemberId = String(staffData[ri][memberIdCol] || '').trim();
    var staffLastName = String(staffData[ri][lastNameCol] || '').trim();
    var staffFullName = String(staffData[ri][nameCol] || '').trim();
    var officeKey = memberOfficeMap[staffMemberId] || '';

    if (!staffLastName && staffFullName) {
      var parts = staffFullName.split(/[\s\u3000]+/);
      staffLastName = parts[0] || '';
    }

    if (!officeKey || !staffLastName) {
      noMapping.push({ staffId: sId, name: staffFullName, reason: !officeKey ? 'no_office' : 'no_lastName' });
      continue;
    }

    var matched = null;
    var lastNameKey = normalizeRosterKeyText_(staffLastName);
    for (var si = 0; si < sourceEntries.length; si++) {
      var se = sourceEntries[si];
      if (se.workplaceKey !== officeKey) continue;
      if (se.sourceNameKey.indexOf(lastNameKey) === -1) continue;
      matched = se;
      break;
    }

    if (!matched) {
      noMapping.push({ staffId: sId, name: staffFullName, officeName: memberOfficeRaw[staffMemberId] || '', lastName: staffLastName, reason: 'no_source_match' });
      continue;
    }

    if (!matched.cmNumber) {
      sourceCmBlank++;
      continue;
    }

    updates.push({
      rowIndex: ri,
      staffId: sId,
      memberId: staffMemberId,
      name: staffFullName,
      officeName: memberOfficeRaw[staffMemberId] || '',
      matchedSourceName: matched.sourceName,
      matchedSourceRow: matched.sourceRow,
      newCmNumber: matched.cmNumber,
    });
  }

  if (!dryRun && updates.length > 0) {
    for (var ui = 0; ui < updates.length; ui++) {
      var u = updates[ui];
      staffData[u.rowIndex][cmCol] = u.newCmNumber;
      staffData[u.rowIndex][updatedAtCol] = now;
    }
    staffSheet.getRange(2, 1, staffData.length, staffData[0].length).setValues(staffData);
  }

  return {
    dryRun: dryRun,
    sourceEntriesWithWorkplace: sourceEntries.length,
    totalStaff: staffData.length,
    alreadyHasValue: alreadyHasValue,
    sourceCmBlank: sourceCmBlank,
    noMappingCount: noMapping.length,
    updatedCount: updates.length,
    updates: dryRun ? updates : updates.map(function(u) { return { staffId: u.staffId, name: u.name, newCmNumber: u.newCmNumber }; }),
    noMapping: dryRun ? noMapping : [],
  };
}

/**
 * T_事業所職員の入会日をソース V列から補正する（dry-run）
 * マッチ方式: ソースK列(勤務先) = T_会員.勤務先名 AND 職員の姓がソースL列(氏名)に含まれる
 * 呼び出し: clasp run repairStaffJoinedDateFromSourceJson
 */
function repairStaffJoinedDateFromSourceJson() {
  return JSON.stringify(repairStaffJoinedDateFromSource_(true));
}

function executeRepairStaffJoinedDateFromSourceJson() {
  return JSON.stringify(repairStaffJoinedDateFromSource_(false));
}

function repairStaffJoinedDateFromSource_(dryRun) {
  var source = readRosterSource_();
  var data = source.data;
  var col = source.colMap;

  // ソースから事業所行を抽出
  // 名前は L列(氏名) を優先、空なら N列(フリガナ欄に漢字名が入るケース) をフォールバック
  var sourceEntries = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var workplace = normalizeRosterCellText_(row[col.workplace]);
    if (!workplace) continue;
    var sourceName = normalizeRosterCellText_(row[col.name]);
    if (!sourceName) {
      sourceName = normalizeRosterCellText_(row[col.furigana]);
    }
    if (!sourceName) continue;
    var vDate = col.joinedDate >= 0 ? normalizeRosterDate_(row[col.joinedDate]) : '';
    sourceEntries.push({
      workplaceKey: normalizeRosterKeyText_(workplace),
      workplaceRaw: workplace,
      sourceName: sourceName,
      sourceNameKey: normalizeRosterKeyText_(sourceName),
      joinedDate: vDate,
      sourceRow: i + 2,
    });
  }

  // DB読み込み
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);

  // T_会員: 会員ID → 勤務先名マップ（事業所会員のみ）
  var memberRows = getRowsAsObjects_(ss, 'T_会員');
  var memberOfficeMap = {};  // 会員ID → 勤務先名(正規化キー)
  var memberOfficeRaw = {};  // 会員ID → 勤務先名(生値)
  for (var mi = 0; mi < memberRows.length; mi++) {
    var m = memberRows[mi];
    if (String(m['会員種別コード'] || '') !== 'BUSINESS') continue;
    var mId = String(m['会員ID'] == null ? '' : m['会員ID']).trim();
    var office = String(m['勤務先名'] || '').trim();
    if (mId && office) {
      memberOfficeMap[mId] = normalizeRosterKeyText_(office);
      memberOfficeRaw[mId] = office;
    }
  }

  // T_事業所職員を読み込み
  var staffSheet = ss.getSheetByName('T_事業所職員');
  var lastRow = staffSheet.getLastRow();
  var lastCol = staffSheet.getLastColumn();
  var headers = staffSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var staffData = lastRow > 1 ? staffSheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];

  var colIdx = {};
  for (var hi = 0; hi < headers.length; hi++) colIdx[headers[hi]] = hi;
  var staffIdCol = colIdx['職員ID'];
  var joinedCol = colIdx['入会日'];
  var updatedAtCol = colIdx['更新日時'];
  var lastNameCol = colIdx['姓'];
  var nameCol = colIdx['氏名'];
  var memberIdCol = colIdx['会員ID'];

  var updates = [];
  var alreadyHasDate = 0;
  var noMapping = [];
  var now = new Date().toISOString();

  for (var ri = 0; ri < staffData.length; ri++) {
    var sId = String(staffData[ri][staffIdCol] || '').trim();
    if (!sId) continue;

    var currentJoined = staffData[ri][joinedCol];
    var currentJoinedStr = '';
    if (currentJoined instanceof Date) {
      currentJoinedStr = isNaN(currentJoined.getTime()) ? '' : Utilities.formatDate(currentJoined, 'Asia/Tokyo', 'yyyy-MM-dd');
    } else {
      currentJoinedStr = normalizeRosterDate_(currentJoined);
    }

    // 既に入会日がある場合はスキップ
    if (currentJoinedStr) {
      alreadyHasDate++;
      continue;
    }

    var staffMemberId = String(staffData[ri][memberIdCol] || '').trim();
    var staffLastName = String(staffData[ri][lastNameCol] || '').trim();
    var staffFullName = String(staffData[ri][nameCol] || '').trim();
    var officeKey = memberOfficeMap[staffMemberId] || '';

    // 姓が空なら氏名から姓を抽出（スペース区切りの先頭）
    if (!staffLastName && staffFullName) {
      var parts = staffFullName.split(/[\s\u3000]+/);
      staffLastName = parts[0] || '';
    }

    if (!officeKey || !staffLastName) {
      noMapping.push({
        staffId: sId,
        name: staffFullName,
        reason: !officeKey ? 'no_office' : 'no_lastName',
      });
      continue;
    }

    // ソースから一致を探す: 事業所名一致 AND 姓がソース名(L列 or N列)に含まれる
    var matched = null;
    var lastNameKey = normalizeRosterKeyText_(staffLastName);
    for (var si = 0; si < sourceEntries.length; si++) {
      var se = sourceEntries[si];
      if (se.workplaceKey !== officeKey) continue;
      if (se.sourceNameKey.indexOf(lastNameKey) === -1) continue;
      matched = se;
      break;
    }

    if (!matched) {
      noMapping.push({
        staffId: sId,
        name: staffFullName,
        officeName: memberOfficeRaw[staffMemberId] || '',
        lastName: staffLastName,
        reason: 'no_source_match',
      });
      continue;
    }

    // ソースV列が空の場合はデフォルト日付を適用
    if (!matched.joinedDate) {
      matched = { workplaceKey: matched.workplaceKey, workplaceRaw: matched.workplaceRaw, sourceName: matched.sourceName, sourceNameKey: matched.sourceNameKey, joinedDate: '2025-12-31', sourceRow: matched.sourceRow };
    }

    updates.push({
      rowIndex: ri,
      staffId: sId,
      memberId: staffMemberId,
      name: staffFullName,
      officeName: memberOfficeRaw[staffMemberId] || '',
      matchedSourceName: matched.sourceName,
      matchedSourceRow: matched.sourceRow,
      oldJoinedDate: '(blank)',
      newJoinedDate: matched.joinedDate,
    });
  }

  if (!dryRun && updates.length > 0) {
    for (var ui = 0; ui < updates.length; ui++) {
      var u = updates[ui];
      staffData[u.rowIndex][joinedCol] = u.newJoinedDate;
      staffData[u.rowIndex][updatedAtCol] = now;
    }
    staffSheet.getRange(2, 1, staffData.length, staffData[0].length).setValues(staffData);
  }

  return {
    dryRun: dryRun,
    sourceEntriesWithWorkplace: sourceEntries.length,
    totalStaff: staffData.length,
    alreadyHasDate: alreadyHasDate,
    noMappingCount: noMapping.length,
    updatedCount: updates.length,
    updates: dryRun ? updates : updates.map(function(u) { return { staffId: u.staffId, name: u.name, newJoinedDate: u.newJoinedDate }; }),
    noMapping: dryRun ? noMapping : [],
  };
}

/**
 * 事業所会員の個人属性フィールドをブランクに補正する（dry-run 対応）
 * 対象: 姓/名/セイ/メイ/介護支援専門員番号/発送方法コード/郵送先区分コード
 * 呼び出し: clasp run repairBusinessMemberFieldsJson
 */
function repairBusinessMemberFieldsJson() {
  return JSON.stringify(repairBusinessMemberFields_(true));
}

function executeRepairBusinessMemberFieldsJson() {
  return JSON.stringify(repairBusinessMemberFields_(false));
}

function repairBusinessMemberFields_(dryRun) {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheet = ss.getSheetByName('T_会員');
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];

  var colIdx = {};
  for (var hi = 0; hi < headers.length; hi++) colIdx[headers[hi]] = hi;

  var blankFields = ['姓', '名', 'セイ', 'メイ', '介護支援専門員番号', '発送方法コード', '郵送先区分コード'];
  var typeCol = colIdx['会員種別コード'];
  var deleteCol = colIdx['削除フラグ'];
  var updatedAtCol = colIdx['更新日時'];
  var idCol = colIdx['会員ID'];
  var now = new Date().toISOString();

  var updates = [];

  for (var ri = 0; ri < data.length; ri++) {
    var memberType = String(data[ri][typeCol] || '').trim();
    if (memberType !== 'BUSINESS') continue;
    if (toBoolean_(data[ri][deleteCol])) continue;

    var changes = [];
    for (var fi = 0; fi < blankFields.length; fi++) {
      var fieldName = blankFields[fi];
      var ci = colIdx[fieldName];
      if (ci == null) continue;
      var currentVal = String(data[ri][ci] || '').trim();
      if (currentVal) {
        changes.push({ field: fieldName, oldValue: currentVal });
      }
    }

    if (changes.length > 0) {
      updates.push({
        rowIndex: ri,
        memberId: String(data[ri][idCol] || ''),
        changes: changes,
      });
    }
  }

  if (!dryRun && updates.length > 0) {
    for (var ui = 0; ui < updates.length; ui++) {
      var u = updates[ui];
      for (var ci2 = 0; ci2 < u.changes.length; ci2++) {
        var fieldIdx = colIdx[u.changes[ci2].field];
        data[u.rowIndex][fieldIdx] = '';
      }
      data[u.rowIndex][updatedAtCol] = now;
    }
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }

  var totalBusiness = data.filter(function(r) {
    return String(r[typeCol] || '').trim() === 'BUSINESS' && !toBoolean_(r[deleteCol]);
  }).length;

  return {
    dryRun: dryRun,
    totalBusinessMembers: totalBusiness,
    membersWithNonBlankFields: updates.length,
    membersAlreadyClean: totalBusiness - updates.length,
    updates: updates.map(function(u) {
      return { memberId: u.memberId, changes: u.changes };
    }),
  };
}
