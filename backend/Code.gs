var DB_SPREADSHEET_ID_KEY = 'DB_SPREADSHEET_ID';
var DB_SPREADSHEET_NAME = '枚方市ケアマネ協議会_DB';
var DB_SPREADSHEET_ID_FIXED = '1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs';
var DB_BACKUP_SPREADSHEET_NAME_PREFIX = '枚方市ケアマネ協議会_DB_Backup';
var DB_BACKUP_MANIFEST_SHEET = '_BACKUP_MANIFEST';
var LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY = 'LAST_EXTERNAL_BACKUP_SPREADSHEET_ID';
var LAST_EXTERNAL_BACKUP_SPREADSHEET_URL_KEY = 'LAST_EXTERNAL_BACKUP_SPREADSHEET_URL';
var LAST_EXTERNAL_BACKUP_SUFFIX_KEY = 'LAST_EXTERNAL_BACKUP_SUFFIX';
var SCHEMA_INITIALIZED_KEY = 'DB_SCHEMA_INITIALIZED';
var SCHEMA_INITIALIZED_VERSION_KEY = 'DB_SCHEMA_INITIALIZED_VERSION';
var WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY = 'WITHDRAWAL_POLICY_LAST_APPLIED_DATE';
var DEFAULT_BUSINESS_STAFF_LIMIT_KEY = 'DEFAULT_BUSINESS_STAFF_LIMIT';
var TRAINING_HISTORY_LOOKBACK_MONTHS_KEY = 'TRAINING_HISTORY_LOOKBACK_MONTHS';
var ALL_DATA_CACHE_TTL_SECONDS = 600;
var ANNUAL_FEE_CACHE_TTL_SECONDS = 600;
var DB_SCHEMA_VERSION = '2026-04-10-01';

var マスタ定義 = {
  M_会員種別: ['コード', '名称', '表示順', '有効フラグ', '年会費金額'],
  M_会員状態: ['コード', '名称', '表示順', '有効フラグ'],
  M_発送方法: ['コード', '名称', '表示順', '有効フラグ'],
  M_郵送先区分: ['コード', '名称', '表示順', '有効フラグ'],
  M_職員権限: ['コード', '名称', '表示順', '有効フラグ'],
  M_職員状態: ['コード', '名称', '表示順', '有効フラグ'],
  M_システムロール: ['コード', '名称', '表示順', '有効フラグ'],
  M_研修状態: ['コード', '名称', '表示順', '有効フラグ'],
  M_申込状態: ['コード', '名称', '表示順', '有効フラグ'],
  M_会費納入状態: ['コード', '名称', '表示順', '有効フラグ'],
  M_申込者区分: ['コード', '名称', '表示順', '削除フラグ'],
  M_管理者権限: ['コード', '名称', '表示順', '有効フラグ'],
};

var マスタ初期値 = {
  M_会員種別: [
    ['INDIVIDUAL', '個人会員', 1, true, 3000],
    ['BUSINESS', '事業所会員', 2, true, 8000],
    ['SUPPORT', '賛助会員', 3, true, 5000],
  ],
  M_会員状態: [
    ['ACTIVE', '有効', 1, true],
    ['WITHDRAWAL_SCHEDULED', '退会予定', 2, true],
    ['WITHDRAWN', '退会', 3, true],
  ],
  M_発送方法: [
    ['EMAIL', 'メール', 1, true],
    ['POST', '郵送', 2, true],
  ],
  M_郵送先区分: [
    ['HOME', '自宅', 1, true],
    ['OFFICE', '勤務先', 2, true],
  ],
  M_職員権限: [
    ['REPRESENTATIVE', '代表者', 1, true],
    ['ADMIN', '管理者', 2, true],
    ['STAFF', '一般', 3, true],
  ],
  M_職員状態: [
    ['ENROLLED', '在籍', 1, true],
    ['LEFT', '退職', 2, true],
  ],
  M_システムロール: [
    ['OFFICE_ADMIN', '事務局管理者', 1, true],
    ['INDIVIDUAL_MEMBER', '個人会員', 2, true],
    ['BUSINESS_ADMIN', '事業所管理者', 3, true],
    ['BUSINESS_MEMBER', '事業所メンバー', 4, true],
  ],
  M_研修状態: [
    ['OPEN', '受付中', 1, true],
    ['CLOSED', '受付終了', 2, true],
  ],
  M_申込状態: [
    ['APPLIED', '申込済', 1, true],
    ['CANCELED', '取消', 2, true],
  ],
  M_会費納入状態: [
    ['PAID', '納入済', 1, true],
    ['UNPAID', '未納', 2, true],
  ],
  M_申込者区分: [
    ['MEMBER', '会員', 1, false],
    ['EXTERNAL', '非会員', 2, false],
  ],
  M_管理者権限: [
    ['MASTER', 'マスター', 1, true],
    ['ADMIN', '管理者', 2, true],
    ['TRAINING_MANAGER', '研修管理者', 3, true],
    ['TRAINING_REGISTRAR', '研修登録者', 4, true],
    ['GENERAL', '一般', 5, true],
  ],
};

var テーブル定義 = {
  T_会員: [
    '会員ID',
    '会員種別コード',
    '会員状態コード',
    '入会日',
    '退会日',
    '退会処理日',
    '姓',
    '名',
    'セイ',
    'メイ',
    '代表メールアドレス',
    '携帯電話番号',
    '勤務先名',
    '勤務先郵便番号',
    '勤務先都道府県',
    '勤務先市区町村',
    '勤務先住所',
    '勤務先電話番号',
    '勤務先FAX番号',
    '自宅郵便番号',
    '自宅都道府県',
    '自宅市区町村',
    '自宅住所',
    '発送方法コード',
    '郵送先区分コード',
    '職員数上限',
    '作成日時',
    '更新日時',
    '削除フラグ',
    '介護支援専門員番号',
    '事業所番号',
  ],
  T_システム設定: [
    '設定キー',
    '設定値',
    '説明',
    '更新日時',
  ],
  T_事業所職員: [
    '職員ID',
    '会員ID',
    '姓',
    '名',
    'セイ',
    'メイ',
    '氏名',
    'フリガナ',
    'メールアドレス',
    '職員権限コード',
    '職員状態コード',
    '入会日',
    '退会日',
    '介護支援専門員番号',
    'メール配信希望コード',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_認証アカウント: [
    '認証ID',
    '認証方式',
    'ログインID',
    'パスワードハッシュ',
    'パスワードソルト',
    'GoogleユーザーID',
    'Googleメール',
    'システムロールコード',
    '会員ID',
    '職員ID',
    '最終ログイン日時',
    'パスワード更新日時',
    'アカウント有効フラグ',
    'ログイン失敗回数',
    'ロック状態',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_ログイン履歴: [
    'ログイン履歴ID',
    '認証ID',
    'ログインID',
    '認証方式',
    'ログイン結果',
    '失敗理由',
    '接続元IP',
    'ユーザーエージェント',
    '実行日時',
  ],
  T_管理者Googleホワイトリスト: [
    'ホワイトリストID',
    'Googleメール',
    '紐付け認証ID',
    '紐付け会員ID',
    '権限コード',
    '有効フラグ',
    '変更者メール',
    '変更日時',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_画面項目権限: [
    '権限定義ID',
    'システムロールコード',
    '画面コード',
    '項目コード',
    '閲覧可',
    '登録可',
    '変更可',
    '削除可',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_研修: [
    '研修ID',
    '研修名',
    '開催日',
    '開催終了時刻',
    '定員',
    '申込者数',
    '開催場所',
    '研修状態コード',
    '主催者',
    '法定外研修フラグ',
    '研修概要',
    '研修内容',
    '費用JSON',
    '申込開始日',
    '申込締切日',
    '講師',
    '案内状URL',
    '項目設定JSON',
    '登録者メール',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_研修申込: [
    '申込ID',
    '研修ID',
    '会員ID',
    '職員ID',
    '申込状態コード',
    '申込日時',
    '取消日時',
    '備考',
    '申込者区分コード',
    '申込者ID',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_外部申込者: [
    '外部申込者ID',
    '氏名',
    'フリガナ',
    'メールアドレス',
    '電話番号',
    '事業所名',
    '同意日時',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_年会費納入履歴: [
    '年会費履歴ID',
    '会員ID',
    '対象年度',
    '会費納入状態コード',
    '納入確認日',
    '金額',
    '備考',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  T_年会費更新履歴: [
    '年会費更新履歴ID',
    '年会費履歴ID',
    '会員ID',
    '対象年度',
    '操作種別',
    '更新前JSON',
    '更新後JSON',
    '実行者メール',
    '実行日時',
  ],
  // v194: メール一括送信ログ（append-only。個人メールアドレス・本文は記録しない）
  T_メール送信ログ: [
    'ログID',
    '送信日時',
    '送信者メール',
    '件名テンプレート',
    '宛先数',
    '成功数',
    'エラー数',
    '送信種別',
    '削除フラグ',
  ],
  // v143: 管理者操作の監査ログ（append-only）
  T_監査ログ: [
    '監査ログID',
    '操作日時',
    '操作者メール',
    '操作種別',
    '対象テーブル',
    '対象レコードID',
    'フィールド名',
    '旧値',
    '新値',
  ],
};

var 入力規則定義 = [
  ['T_会員', '会員種別コード', 'M_会員種別'],
  ['T_会員', '会員状態コード', 'M_会員状態'],
  ['T_会員', '発送方法コード', 'M_発送方法'],
  ['T_会員', '郵送先区分コード', 'M_郵送先区分'],
  ['T_事業所職員', '職員権限コード', 'M_職員権限'],
  ['T_事業所職員', '職員状態コード', 'M_職員状態'],
  ['T_認証アカウント', 'システムロールコード', 'M_システムロール'],
  ['T_研修', '研修状態コード', 'M_研修状態'],
  ['T_研修申込', '申込状態コード', 'M_申込状態'],
  ['T_研修申込', '申込者区分コード', 'M_申込者区分'],
  ['T_年会費納入履歴', '会費納入状態コード', 'M_会費納入状態'],
  ['T_画面項目権限', 'システムロールコード', 'M_システムロール'],
  ['T_管理者Googleホワイトリスト', '権限コード', 'M_管理者権限'],
];

var DEMO_TRANSFER_ACCOUNT = {
  bankName: 'ゆうちょ銀行',
  branchName: '四〇八支店',
  accountType: '普通',
  accountNumber: '1234567',
  accountName: 'ヒラカタシカイゴシエンセンモンインレンラクキョウギカイ',
  note: '振込手数料は会員様負担でお願いします。',
};

function doGet(e) {
  try {
    initializeSchemaIfNeeded_();
  } catch (ex) {
    // UI表示を優先し、初期化失敗時もWebアプリは返す
  }
  var app = (e && e.parameter && e.parameter.app) || 'member';
  var allowedApps = { 'member': 'index', 'public': 'index_public' };
  var file = allowedApps[app] || 'index';
  return HtmlService.createHtmlOutputFromFile(file)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
 * DBスキーマを再構築する。
 * 既存の定義外シートは削除し、定義シートのヘッダー/入力規則/保護を再適用する。
 */
function rebuildDatabaseSchema() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  markSchemaInitialized_();
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
    { key: 'ROSTER_TEMPLATE_SS_ID', value: '', desc: '名簿テンプレートスプレッドシートID' },
    { key: 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID', value: '', desc: '一括メール個別自動添付DriveフォルダID' },
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
  lock.waitLock(10000);
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
        nextContactValue
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

function processApiRequest(action, payload) {
  try {
    var parsedPayload = parsePayload_(payload) || {};

    // ── アクセス制御（権限マップ方式）────────────────────────────
    // アクションごとに許可される管理者権限レベルを定義する。
    // 公開ポータル URL（?app=public）からこれらのアクションを呼んでも
    // 必ず unauthorized で返るため、URL 分離の信頼性を担保する。
    var ADMIN_ACTION_PERMISSIONS = {
      // MASTER/ADMIN のみ
      'getDbInfo': ['MASTER','ADMIN'],
      'getSystemSettings': ['MASTER','ADMIN'],
      'updateSystemSettings': ['MASTER','ADMIN'],
      'getAdminPermissionData': ['MASTER','ADMIN'],
      'saveAdminPermission': ['MASTER','ADMIN'],
      'deleteAdminPermission': ['MASTER','ADMIN'],
      'seedDemoData': ['MASTER'],
      'getAdminDashboardData': ['MASTER','ADMIN'],
      'getAdminInitData': ['MASTER','ADMIN'],
      'updateMember': ['MASTER','ADMIN'],
      'updateMembersBatch': ['MASTER','ADMIN'],
      'createMember': ['MASTER','ADMIN'],
      'withdrawMember': ['MASTER','ADMIN'],
      'scheduleWithdrawMember': ['MASTER','ADMIN'],
      'cancelScheduledWithdraw': ['MASTER','ADMIN'],
      'removeStaffFromOffice': ['MASTER','ADMIN'],
      'updateStaff': ['MASTER','ADMIN'],
      'getAdminPersonList': ['MASTER','ADMIN'],
      'updatePersonsBatch': ['MASTER','ADMIN'],
      'convertMemberType': ['MASTER','ADMIN'],
      'getAnnualFeeAdminData': ['MASTER','ADMIN'],
      'saveAnnualFeeRecord': ['MASTER','ADMIN'],
      'saveAnnualFeeRecordsBatch': ['MASTER','ADMIN'],
      // 研修関連（TRAINING_MANAGER/REGISTRAR もアクセス可）
      'saveTraining': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
      'uploadTrainingFile': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
      'getTrainingManagementData': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
      'getTrainingApplicants': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
      'sendTrainingReminder': ['MASTER','ADMIN','TRAINING_MANAGER'],
      'getAdminEmailAliases': ['MASTER','ADMIN','TRAINING_MANAGER'],
      'sendTrainingMail': ['MASTER','ADMIN','TRAINING_MANAGER'],
      // v188: AI案内メール生成（GASサーバー側でGemini APIを呼ぶ）
      'generateTrainingEmail': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
      // v194: PDF名簿出力 & 会員一括メール送信
      'getMembersForRoster': ['MASTER','ADMIN'],
      'generateRosterZip': ['MASTER','ADMIN'],
      'getMembersForBulkMail': ['MASTER','ADMIN'],
      'sendBulkMemberMail': ['MASTER','ADMIN'],
      'getEmailSendLog': ['MASTER','ADMIN'],
    };
    var requiredPerms = ADMIN_ACTION_PERMISSIONS[action];
    if (requiredPerms) {
      var sessionResult = checkAdminBySession_();
      if (!sessionResult) {
        return JSON.stringify({ success: false, error: 'unauthorized' });
      }
      var permLevel = String(sessionResult.adminPermissionLevel || 'ADMIN');
      if (requiredPerms.indexOf(permLevel) === -1) {
        return JSON.stringify({ success: false, error: 'insufficient_permission' });
      }
      // 下流関数でセッション情報を利用可能にする
      parsedPayload.__adminSession = sessionResult;
    }
    // ─────────────────────────────────────────────────────────

    if (action === 'fetchAllData') {
      return JSON.stringify({
        success: true,
        data: fetchAllDataFromDb_(),
      });
    }

    if (action === 'getAdminDashboardData') {
      return JSON.stringify({
        success: true,
        data: getAdminDashboardData_(),
      });
    }

    // v150: 管理者初期データ統合API（dashboard + settings を1回のround-tripで返す）
    if (action === 'getAdminInitData') {
      return JSON.stringify({
        success: true,
        data: {
          dashboard: getAdminDashboardData_(),
          settings: getSystemSettings_(),
        },
      });
    }

    if (action === 'getTrainingManagementData') {
      return JSON.stringify({
        success: true,
        data: getTrainingManagementData_(),
      });
    }

    if (action === 'getMemberPortalData') {
      return JSON.stringify({
        success: true,
        data: getMemberPortalData_(parsedPayload),
      });
    }

    if (action === 'updateMember') {
      // v143: 管理者用 allowlist でサニタイズしてから委譲
      var sanitizedMemberPayload = sanitizeAdminMemberPayload_(parsedPayload);
      sanitizedMemberPayload.__adminSession = parsedPayload.__adminSession;
      return JSON.stringify({
        success: true,
        data: updateMember_(sanitizedMemberPayload),
      });
    }

    if (action === 'updateMembersBatch') {
      return JSON.stringify({
        success: true,
        data: updateMembersBatch_(parsedPayload),
      });
    }

    if (action === 'createMember') {
      return JSON.stringify({ success: true, data: createMember_(parsedPayload) });
    }

    if (action === 'withdrawMember') {
      return JSON.stringify({ success: true, data: withdrawMember_(parsedPayload) });
    }

    if (action === 'removeStaffFromOffice') {
      return JSON.stringify({ success: true, data: removeStaffFromOffice_(parsedPayload) });
    }

    if (action === 'getAdminPersonList') {
      return JSON.stringify({ success: true, data: getAdminPersonList_() });
    }

    if (action === 'updatePersonsBatch') {
      return JSON.stringify({ success: true, data: updatePersonsBatch_(parsedPayload) });
    }

    if (action === 'convertMemberType') {
      return JSON.stringify({ success: true, data: convertMemberType_(parsedPayload) });
    }

    if (action === 'scheduleWithdrawMember') {
      return JSON.stringify({ success: true, data: scheduleWithdrawMember_(parsedPayload) });
    }

    if (action === 'cancelScheduledWithdraw') {
      return JSON.stringify({ success: true, data: cancelScheduledWithdraw_(parsedPayload) });
    }

    if (action === 'updateStaff') {
      return JSON.stringify({ success: true, data: updateStaff_(parsedPayload) });
    }

    if (action === 'submitMemberApplication') {
      return JSON.stringify({ success: true, data: submitMemberApplication_(parsedPayload) });
    }

    if (action === 'getDbInfo') {
      return JSON.stringify({ success: true, data: getDbInfo_() });
    }

    if (action === 'updateMemberSelf') {
      return JSON.stringify({ success: true, data: updateMemberSelf_(parsedPayload) });
    }

    if (action === 'changePassword') {
      return JSON.stringify({ success: true, data: changePassword_(parsedPayload) });
    }

    if (action === 'memberLogin') {
      return JSON.stringify({ success: true, data: memberLogin_(parsedPayload) });
    }

    // v150: ログイン+ポータルデータ統合API（round-trip削減）
    if (action === 'memberLoginWithData') {
      var loginResult = memberLogin_(parsedPayload);
      var portalData = getMemberPortalData_({ memberId: loginResult.memberId });
      return JSON.stringify({ success: true, data: { auth: loginResult, portal: portalData } });
    }

    if (action === 'checkAdminBySession') {
      return JSON.stringify({ success: true, data: checkAdminBySession_() });
    }

    // v150: 管理者ログイン+ポータルデータ統合API（round-trip削減）
    if (action === 'adminLoginWithData') {
      var adminResult = checkAdminBySession_();
      var adminPortalData = getMemberPortalData_({ memberId: adminResult.memberId });
      return JSON.stringify({ success: true, data: { auth: adminResult, portal: adminPortalData } });
    }

    if (action === 'getSystemSettings') {
      return JSON.stringify({ success: true, data: getSystemSettings_() });
    }

    if (action === 'updateSystemSettings') {
      var settingsPermLevel = parsedPayload.__adminSession
        ? String(parsedPayload.__adminSession.adminPermissionLevel || 'ADMIN')
        : 'ADMIN';
      return JSON.stringify({ success: true, data: updateSystemSettings_(parsedPayload, settingsPermLevel) });
    }

    if (action === 'getAdminPermissionData') {
      return JSON.stringify({ success: true, data: getAdminPermissionData_(parsedPayload.__adminSession) });
    }

    if (action === 'saveAdminPermission') {
      return JSON.stringify({ success: true, data: saveAdminPermission_(parsedPayload) });
    }

    if (action === 'deleteAdminPermission') {
      return JSON.stringify({ success: true, data: deleteAdminPermission_(parsedPayload) });
    }

    if (action === 'getAnnualFeeAdminData') {
      return JSON.stringify({ success: true, data: getAnnualFeeAdminData_(parsedPayload) });
    }

    if (action === 'saveAnnualFeeRecord') {
      return JSON.stringify({ success: true, data: saveAnnualFeeRecord_(parsedPayload) });
    }

    if (action === 'saveAnnualFeeRecordsBatch') {
      return JSON.stringify({ success: true, data: saveAnnualFeeRecordsBatch_(parsedPayload) });
    }

    if (action === 'sendTrainingReminder') {
      return JSON.stringify({ success: true, data: sendTrainingReminder_(parsedPayload) });
    }

    if (action === 'seedDemoData') {
      return JSON.stringify({ success: true, data: seedDemoData() });
    }

    if (action === 'saveTraining') {
      return JSON.stringify({ success: true, data: saveTraining_(parsedPayload) });
    }

    if (action === 'uploadTrainingFile') {
      return JSON.stringify({ success: true, data: uploadTrainingFile_(parsedPayload) });
    }

    if (action === 'applyTraining') {
      return JSON.stringify({ success: true, data: applyTraining_(parsedPayload) });
    }

    if (action === 'cancelTraining') {
      return JSON.stringify({ success: true, data: cancelTraining_(parsedPayload) });
    }

    if (action === 'getPublicTrainings') {
      return getPublicTrainings_();
    }

    if (action === 'applyTrainingExternal') {
      return applyTrainingExternal_(parsedPayload);
    }

    if (action === 'cancelTrainingExternal') {
      return cancelTrainingExternal_(parsedPayload);
    }

    if (action === 'getTrainingApplicants') {
      return getTrainingApplicants_(parsedPayload);
    }

    if (action === 'getAdminEmailAliases') {
      return getAdminEmailAliases_();
    }

    if (action === 'sendTrainingMail') {
      return sendTrainingMail_(parsedPayload);
    }

    // v188: Gemini AI案内メール生成（APIキーはScriptPropertiesで管理、フロントに露出しない）
    if (action === 'generateTrainingEmail') {
      return JSON.stringify({ success: true, data: generateTrainingEmailWithAI_(parsedPayload) });
    }

    // v194: 会員一括メール送信
    if (action === 'getMembersForBulkMail') {
      return JSON.stringify({ success: true, data: getMembersForBulkMail_(parsedPayload) });
    }

    if (action === 'sendBulkMemberMail') {
      return JSON.stringify({ success: true, data: sendBulkMemberMail_(parsedPayload) });
    }

    if (action === 'getEmailSendLog') {
      return JSON.stringify({ success: true, data: getEmailSendLog_(parsedPayload) });
    }

    // ── 会員セルフサービス（管理者認証不要・パスワード再認証必須）──
    if (action === 'withdrawSelf') {
      return JSON.stringify({ success: true, data: withdrawSelf_(parsedPayload) });
    }

    if (action === 'cancelWithdrawalSelf') {
      return JSON.stringify({ success: true, data: cancelWithdrawalSelf_(parsedPayload) });
    }

    return JSON.stringify({ success: true, data: { message: '未実装アクションです' } });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

function dryRunTrainingReminder(trainingId) {
  return sendTrainingReminder_({
    trainingId: trainingId,
    dryRun: true,
  });
}

function sendTrainingReminderTest(trainingId, to) {
  return sendTrainingReminder_({
    trainingId: trainingId,
    dryRun: false,
    testRecipient: to,
  });
}

function dryRunTrainingReminderT001() {
  return dryRunTrainingReminder('T001');
}

function sendTrainingReminderToNoguchiTest() {
  return sendTrainingReminderTest('T001', 'k.noguchi@uguisunosato.or.jp');
}

function sendTrainingReminder_(request) {
  if (!request || !request.trainingId) {
    throw new Error('trainingId is required');
  }

  var allData = fetchAllDataFromDb_();
  var trainingId = String(request.trainingId);
  var dryRun = request.dryRun !== false;
  var testRecipient = String(request.testRecipient || '').trim().toLowerCase();
  var subject = String(request.subject || '');
  var body = String(request.body || '');

  var training = null;
  for (var i = 0; i < allData.trainings.length; i += 1) {
    if (String(allData.trainings[i].id) === trainingId) {
      training = allData.trainings[i];
      break;
    }
  }
  if (!training) {
    throw new Error('Training not found: ' + trainingId);
  }

  var recipients = collectTrainingRecipients_(allData.members, trainingId);
  if (testRecipient) {
    recipients = [{
      email: testRecipient,
      name: 'テスト送信先',
      memberId: '',
      staffId: '',
    }];
  }
  if (recipients.length === 0) {
    throw new Error('No email recipients found for training: ' + trainingId);
  }

  if (!subject) {
    subject = '【研修リマインド】' + String(training.title || '');
  }
  if (!body) {
    body = buildTrainingReminderBody_(training);
  }

  var result = {
    dryRun: dryRun,
    trainingId: trainingId,
    trainingTitle: String(training.title || ''),
    recipientCount: recipients.length,
    recipients: recipients.map(function(r) {
      return {
        email: r.email,
        name: r.name,
        memberId: r.memberId,
        staffId: r.staffId,
      };
    }),
    subject: subject,
    body: body,
    sentCount: 0,
    sentTo: [],
  };

  if (dryRun) {
    return result;
  }

  for (var j = 0; j < recipients.length; j += 1) {
    var to = recipients[j].email;
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: body,
      name: '枚方市介護支援専門員連絡協議会 事務局',
    });
    result.sentTo.push(to);
    result.sentCount += 1;
  }

  return result;
}

function collectTrainingRecipients_(members, trainingId) {
  var recipients = [];
  var seen = {};

  function pushRecipient_(email, name, memberId, staffId) {
    var normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return;
    if (seen[normalized]) return;
    seen[normalized] = true;
    recipients.push({
      email: normalized,
      name: String(name || ''),
      memberId: String(memberId || ''),
      staffId: String(staffId || ''),
    });
  }

  for (var i = 0; i < members.length; i += 1) {
    var member = members[i];
    var memberId = String(member.id || '');
    var memberType = String(member.type || '');

    if (memberType !== 'BUSINESS') {
      var memberTrainingIds = member.participatedTrainingIds || [];
      if (memberTrainingIds.indexOf(trainingId) !== -1) {
        pushRecipient_(member.email, String(member.lastName || '') + ' ' + String(member.firstName || ''), memberId, '');
      }
      continue;
    }

    var staffList = member.staff || [];
    var matchedStaffCount = 0;
    for (var j = 0; j < staffList.length; j += 1) {
      var staff = staffList[j];
      var staffTrainingIds = staff.participatedTrainingIds || [];
      if (staffTrainingIds.indexOf(trainingId) === -1) continue;
      matchedStaffCount += 1;
      pushRecipient_(staff.email, staff.name, memberId, staff.id);
    }

    if (matchedStaffCount > 0 && member.email) {
      pushRecipient_(member.email, member.officeName || '事業所代表', memberId, '');
    }
  }

  return recipients;
}

function buildTrainingReminderBody_(training) {
  var trainingDate = formatTrainingDate_(training.date);
  var lines = [];
  lines.push('会員各位');
  lines.push('');
  lines.push('平素よりお世話になっております。');
  lines.push('枚方市介護支援専門員連絡協議会 事務局です。');
  lines.push('');
  lines.push('お申し込み済みの研修が近づいていますので、ご案内いたします。');
  lines.push('');
  lines.push('■研修名');
  lines.push(String(training.title || ''));
  lines.push('');
  lines.push('■開催日');
  lines.push(trainingDate);
  lines.push('');
  lines.push('■会場');
  lines.push(String(training.location || ''));
  lines.push('');
  lines.push('当日の案内資料と詳細は、配布済みのご案内をご確認ください。');
  lines.push('');
  lines.push('何卒よろしくお願いいたします。');
  lines.push('');
  lines.push('枚方市介護支援専門員連絡協議会 事務局');
  return lines.join('\n');
}

function formatTrainingDate_(rawDate) {
  if (!rawDate) return '';
  if (Object.prototype.toString.call(rawDate) === '[object Date]') {
    return Utilities.formatDate(rawDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
  }
  if (typeof rawDate === 'string') {
    var parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate.getTime())) {
      return Utilities.formatDate(parsedDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
    }
  }
  return String(rawDate);
}

function formatDateForApi_(rawDate) {
  if (!rawDate) return '';
  if (Object.prototype.toString.call(rawDate) === '[object Date]') {
    return Utilities.formatDate(rawDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
  }
  if (typeof rawDate === 'string') {
    var parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate.getTime())) {
      return Utilities.formatDate(parsedDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
    }
  }
  return String(rawDate);
}

/** 時刻セル（HH:mm）を文字列で返す。Date型もシート上の時刻セルも正しく処理する */
function formatTimeOnly_(val) {
  if (!val) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    return Utilities.formatDate(val, 'Asia/Tokyo', 'HH:mm');
  }
  var s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    var parts = s.split(':');
    return ('0' + parts[0]).slice(-2) + ':' + parts[1];
  }
  return '';
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
  var hash = hashPassword_(String(plainPassword || ''), salt);

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
    パスワードハッシュ: hashPassword_(plainPassword, salt),
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

function resolveMemberTypeLabel_(memberTypeCode) {
  switch (String(memberTypeCode || '')) {
    case 'INDIVIDUAL': return '個人会員';
    case 'BUSINESS': return '事業所会員';
    case 'SUPPORT': return '賛助会員';
    default: return String(memberTypeCode || '');
  }
}

function generateCredentialTempPassword_() {
  var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + ':' + new Date().getTime());
  var chars = [];
  for (var i = 0; i < 12; i += 1) {
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
      会員種別: resolveMemberTypeLabel_(memberTypeCode),
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
    rows[r][cols['パスワードハッシュ']] = hashPassword_(plainPassword, salt);
    rows[r][cols['パスワードソルト']] = salt;
    rows[r][cols['パスワード更新日時']] = nowIso;
    rows[r][cols['アカウント有効フラグ']] = true;
    rows[r][cols['ログイン失敗回数']] = 0;
    rows[r][cols['ロック状態']] = false;
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

function parseTrainingOptions_(raw) {
  var defaultResult = {
    fieldConfig: null,
    cancelAllowed: false,
    inquiryPerson: '',
    inquiryContactType: 'PHONE',
    inquiryContactValue: '',
    inquiryPhone: '',
    inquiryEmail: '',
  };
  var text = String(raw || '').trim();
  if (!text) return defaultResult;
  try {
    var parsed = JSON.parse(text);
    if (parsed && parsed.fieldConfig !== undefined) {
      var contactType = String(parsed.inquiryContactType || 'PHONE') === 'EMAIL' ? 'EMAIL' : 'PHONE';
      var contactValue = String(parsed.inquiryContactValue || '');
      // 新フィールド優先、なければ旧フィールドから復元（後方互換）
      var phone = String(parsed.inquiryPhone || '');
      var email = String(parsed.inquiryEmail || '');
      if (!phone && !email) {
        if (contactType === 'PHONE') { phone = contactValue; }
        else { email = contactValue; }
      }
      return {
        fieldConfig: parsed.fieldConfig || null,
        cancelAllowed: parsed.cancelAllowed === true,
        inquiryPerson: String(parsed.inquiryPerson || ''),
        inquiryContactType: contactType,
        inquiryContactValue: contactValue,
        inquiryPhone: phone,
        inquiryEmail: email,
      };
    }
    // 旧形式（fieldConfigオブジェクトのみ）
    return {
      fieldConfig: parsed || null,
      cancelAllowed: false,
      inquiryPerson: '',
      inquiryContactType: 'PHONE',
      inquiryContactValue: '',
      inquiryPhone: '',
      inquiryEmail: '',
    };
  } catch (e) {
    return defaultResult;
  }
}

function serializeTrainingOptions_(fieldConfig, cancelAllowed, inquiryPerson, inquiryContactType, inquiryContactValue, inquiryPhone, inquiryEmail) {
  return JSON.stringify({
    fieldConfig: fieldConfig || null,
    cancelAllowed: cancelAllowed === true,
    inquiryPerson: String(inquiryPerson || ''),
    inquiryContactType: String(inquiryContactType || 'PHONE') === 'EMAIL' ? 'EMAIL' : 'PHONE',
    inquiryContactValue: String(inquiryContactValue || ''),
    inquiryPhone: String(inquiryPhone || ''),
    inquiryEmail: String(inquiryEmail || ''),
  });
}

function normalizeInquiryContacts_(phone, email, legacyValue) {
  var p = String(phone || '').trim();
  var e = String(email || '').trim();
  // 新フィールドが両方空の場合は旧フィールドにフォールバック
  if (!p && !e) {
    var legacy = String(legacyValue || '').trim();
    if (legacy) {
      var emailPat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailPat.test(legacy)) { e = legacy; }
      else { p = legacy; }
    }
  }
  if (!p && !e) {
    throw new Error('問い合わせ窓口の電話番号またはメールアドレスを入力してください。');
  }
  var phonePat = /^[0-9+\-() ー−]{6,}$/;
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (p && !phonePat.test(p)) {
    throw new Error('電話番号の形式が正しくありません: ' + p);
  }
  if (e && !emailPattern.test(e)) {
    throw new Error('メールアドレスの形式が正しくありません: ' + e);
  }
  // 後方互換: inquiryContactValue には電話優先で1件格納
  var primaryValue = p || e;
  var primaryType = p ? 'PHONE' : 'EMAIL';
  return { phone: p, email: e, primaryType: primaryType, primaryValue: primaryValue };
}

// 旧関数（後方互換、seed/test コード向け）
function normalizeInquiryContact_(inquiryContactValue) {
  var value = String(inquiryContactValue || '').trim();
  if (!value) {
    throw new Error('問い合わせ窓口の連絡先を入力してください。');
  }
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var phonePattern = /^[0-9+\-() ー−]{6,}$/;
  if (emailPattern.test(value)) {
    return { type: 'EMAIL', value: value };
  }
  if (phonePattern.test(value)) {
    return { type: 'PHONE', value: value };
  }
  throw new Error('問い合わせ窓口の連絡先は電話番号またはメールアドレス形式で入力してください。');
}

function getAllDataCacheKey_() {
  return 'fetchAllData:' + DB_SCHEMA_VERSION;
}

function getAdminDashboardCacheKey_() {
  return 'adminDashboard:' + DB_SCHEMA_VERSION;
}

function getTrainingManagementCacheKey_() {
  return 'trainingManagement:' + DB_SCHEMA_VERSION;
}

// v150: CacheService チャンキング（100KB上限対応、putAll/getAll バッチ操作）
var CACHE_CHUNK_SIZE = 90000; // 90KB safety margin

function putChunkedCache_(cache, key, data, ttl) {
  var json = JSON.stringify(data);
  if (json.length <= CACHE_CHUNK_SIZE) {
    cache.put(key, json, ttl);
    cache.put(key + ':chunks', '0', ttl);
    return;
  }
  var keysToStore = {};
  var chunkCount = 0;
  for (var i = 0; i < json.length; i += CACHE_CHUNK_SIZE) {
    keysToStore[key + ':' + chunkCount] = json.substring(i, i + CACHE_CHUNK_SIZE);
    chunkCount++;
  }
  keysToStore[key + ':chunks'] = String(chunkCount);
  cache.putAll(keysToStore, ttl);
}

function getChunkedCache_(cache, key) {
  var chunkCount = cache.get(key + ':chunks');
  if (chunkCount === null) return null;
  var n = parseInt(chunkCount, 10);
  if (n === 0) {
    var single = cache.get(key);
    return single ? JSON.parse(single) : null;
  }
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(key + ':' + i);
  var all = cache.getAll(keys);
  var json = '';
  for (var j = 0; j < n; j++) {
    var chunk = all[key + ':' + j];
    if (!chunk) return null; // 部分的なキャッシュ失効
    json += chunk;
  }
  return JSON.parse(json);
}

function removeChunkedCache_(cache, key) {
  var chunkCount = cache.get(key + ':chunks');
  cache.remove(key);
  cache.remove(key + ':chunks');
  if (chunkCount !== null) {
    var n = parseInt(chunkCount, 10);
    for (var i = 0; i < n; i++) cache.remove(key + ':' + i);
  }
}

function clearAllDataCache_() {
  var cache = CacheService.getScriptCache();
  removeChunkedCache_(cache, getAllDataCacheKey_());
  clearRecentAnnualFeeAdminCaches_();
}

function clearAdminDashboardCache_() {
  removeChunkedCache_(CacheService.getScriptCache(), getAdminDashboardCacheKey_());
}

function clearTrainingManagementCache_() {
  removeChunkedCache_(CacheService.getScriptCache(), getTrainingManagementCacheKey_());
}

function fetchAllDataFromDb_() {
  var cache = CacheService.getScriptCache();
  var cacheKey = getAllDataCacheKey_();
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var result = fetchAllDataFromDbFresh_();
  try {
    putChunkedCache_(cache, cacheKey, result, ALL_DATA_CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('fetchAllDataFromDb_ cache skipped: ' + e.message);
  }
  return result;
}

function fetchAllDataFromDbFresh_() {
  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var trainingRows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var applicationRows = getTrainingApplicationRows_(ss, { appliedOnly: true });
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberTypeFeeMap = getAnnualFeeAmountMap_(ss);
  return {
    members: mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap),
    trainings: mapTrainingRowsForApi_(trainingRows),
  };
}

function getMemberPortalData_(payload) {
  var memberId = String(payload && payload.memberId || '').trim();
  if (!memberId) {
    throw new Error('memberId が未指定です。');
  }

  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  if (!memberRows.length) {
    throw new Error('対象会員が見つかりません。');
  }
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var applicationRows = getTrainingApplicationRows_(ss, { appliedOnly: true, memberId: memberId });
  // B-01: 申し込み済み研修IDセットを事前構築し、全件スキャンを回避する
  var appliedIdSet = {};
  for (var ai = 0; ai < applicationRows.length; ai++) {
    appliedIdSet[String(applicationRows[ai]['研修ID'] || '')] = true;
  }
  var nowTs = Date.now();
  var trainingRows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    // 申し込み済みは必ず含める（履歴表示のため）
    if (appliedIdSet[String(r['研修ID'] || '')]) return true;
    // キャンセル済みは除外
    if (String(r['研修状態コード'] || '') === 'CANCELLED') return false;
    // 過去の研修（開催日が今日より前）は除外（申し込み対象外のため不要）
    var dateStr = String(r['開催日'] || '').replace(/\//g, '-').split('T')[0];
    if (!dateStr) return true; // 開催日未設定は含める
    return new Date(dateStr + 'T23:59:59+09:00').getTime() >= nowTs;
  });
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var memberTypeFeeMap = getAnnualFeeAmountMap_(ss);

  return {
    members: mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap),
    trainings: mapTrainingRowsForApi_(trainingRows),
  };
}

function mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap) {
  var memberMap = {};
  for (var memberIdx = 0; memberIdx < memberRows.length; memberIdx += 1) {
    memberMap[String(memberRows[memberIdx]['会員ID'] || '')] = memberRows[memberIdx];
  }

  var loginByMemberId = {};
  var loginByStaffId = {};
  for (var i = 0; i < authRows.length; i += 1) {
    var a = authRows[i];
    if (String(a['認証方式'] || '') !== 'PASSWORD') continue;
    if (!toBoolean_(a['アカウント有効フラグ'])) continue;
    var authMemberId = String(a['会員ID'] || '');
    var staffId = String(a['職員ID'] || '');
    if (staffId) {
      loginByStaffId[staffId] = String(a['ログインID'] || '');
    } else if (authMemberId) {
      loginByMemberId[authMemberId] = String(a['ログインID'] || '');
    }
  }

  var applicationsByMember = {};
  var applicationsByStaff = {};
  for (var j = 0; j < applicationRows.length; j += 1) {
    var app = applicationRows[j];
    var trainingId = String(app['研修ID'] || '');
    var appMemberId = getMemberIdFromApplication_(app);
    var appStaffId = String(app['職員ID'] || '');
    if (appStaffId) {
      if (!applicationsByStaff[appStaffId]) applicationsByStaff[appStaffId] = [];
      applicationsByStaff[appStaffId].push(trainingId);
    } else if (appMemberId) {
      if (!applicationsByMember[appMemberId]) applicationsByMember[appMemberId] = [];
      applicationsByMember[appMemberId].push(trainingId);
    }
  }

  var feeByMember = {};
  var annualFeeTransferAccount = getAnnualFeeTransferAccountSetting_(ss);
  for (var k = 0; k < feeRows.length; k += 1) {
    var f = feeRows[k];
    var feeMemberId = String(f['会員ID'] || '');
    if (!feeByMember[feeMemberId]) feeByMember[feeMemberId] = [];
    var feeItem = {
      id: String(f['年会費履歴ID'] || ''),
      year: Number(f['対象年度'] || 0),
      status: String(f['会費納入状態コード'] || 'UNPAID'),
      confirmedDate: normalizeDateInput_(f['納入確認日']),
      amount: resolveAnnualFeeAmount_(memberMap[feeMemberId], memberTypeFeeMap, Number(f['金額'] || 0)),
      note: String(f['備考'] || ''),
      updatedAt: String(f['更新日時'] || ''),
    };
    if (feeItem.status === 'UNPAID') {
      feeItem.transferAccount = parseTransferAccount_(f['備考'], annualFeeTransferAccount);
    }
    feeByMember[feeMemberId].push(feeItem);
  }

  // v106: 退職者の年度フィルタ — 翌年度（4/1〜）から非表示
  var currentFiscalYearStart = getFiscalYearStart_(new Date());
  var staffByMember = {};
  for (var s = 0; s < staffRows.length; s += 1) {
    var st = staffRows[s];
    var staffNameFields = normalizeStaffNameFields_(st);
    var stStatus = String(st['職員状態コード'] || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED';
    // v106: 退職済み職員で退職日が今年度開始より前なら非表示（データは保持）
    if (stStatus === 'LEFT') {
      var stWithdrawn = normalizeDateInput_(st['退会日']);
      if (stWithdrawn && new Date(stWithdrawn + 'T00:00:00+09:00') < currentFiscalYearStart) {
        continue;
      }
    }
    var stMemberId = String(st['会員ID'] || '');
    if (!staffByMember[stMemberId]) staffByMember[stMemberId] = [];
    var stId = String(st['職員ID'] || '');
    staffByMember[stMemberId].push({
      id: stId,
      loginId: loginByStaffId[stId] || '',
      lastName: staffNameFields.lastName,
      firstName: staffNameFields.firstName,
      lastKana: staffNameFields.lastKana,
      firstKana: staffNameFields.firstKana,
      name: staffNameFields.name,
      kana: staffNameFields.kana,
      email: String(st['メールアドレス'] || ''),
      careManagerNumber: String(st['介護支援専門員番号'] || ''),
      role: String(st['職員権限コード'] || 'STAFF'),
      status: stStatus,
      joinedDate: normalizeDateInput_(st['入会日']),
      withdrawnDate: normalizeDateInput_(st['退会日']),
      mailingPreference: String(st['メール配信希望コード'] || 'YES'),
      midYearWithdrawal: false,
      participatedTrainingIds: uniqueStrings_(applicationsByStaff[stId] || []),
    });
  }

  return memberRows.map(function(m) {
    var id = String(m['会員ID'] || '');
    var type = String(m['会員種別コード'] || 'INDIVIDUAL');
    var history = buildMemberAnnualFeeHistory_(m, feeByMember[id] || [], memberTypeFeeMap);
    return {
      id: id,
      loginId: loginByMemberId[id] || '',
      careManagerNumber: String(m['介護支援専門員番号'] || loginByMemberId[id] || ''),
      lastName: String(m['姓'] || ''),
      firstName: String(m['名'] || ''),
      lastKana: String(m['セイ'] || ''),
      firstKana: String(m['メイ'] || ''),
      type: type,
      staff: type === 'BUSINESS' ? (staffByMember[id] || []) : undefined,
      officeName: String(m['勤務先名'] || ''),
      officeNumber: String(m['事業所番号'] || ''),
      officePostCode: String(m['勤務先郵便番号'] || ''),
      officePrefecture: String(m['勤務先都道府県'] || ''),
      officeCity: String(m['勤務先市区町村'] || ''),
      officeAddressLine: String(m['勤務先住所'] || ''),
      phone: String(m['勤務先電話番号'] || ''),
      fax: String(m['勤務先FAX番号'] || ''),
      homePostCode: String(m['自宅郵便番号'] || ''),
      homePrefecture: String(m['自宅都道府県'] || ''),
      homeCity: String(m['自宅市区町村'] || ''),
      homeAddressLine: String(m['自宅住所'] || ''),
      mobilePhone: String(m['携帯電話番号'] || ''),
      mailingPreference: String(m['発送方法コード'] || 'EMAIL'),
      preferredMailDestination: String(m['郵送先区分コード'] || 'OFFICE'),
      staffLimit: (function() {
        var n = Number(m['職員数上限']);
        return isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
      })(),
      email: String(m['代表メールアドレス'] || ''),
      status: (function() {
        var s = String(m['会員状態コード'] || 'ACTIVE');
        if (s === 'WITHDRAWN') return 'WITHDRAWN';
        if (s === 'WITHDRAWAL_SCHEDULED') return 'WITHDRAWAL_SCHEDULED';
        return 'ACTIVE';
      })(),
      joinedDate: normalizeDateInput_(m['入会日']),
      withdrawnDate: normalizeDateInput_(m['退会日']),
      withdrawalProcessDate: normalizeDateInput_(m['退会処理日']),
      midYearWithdrawal: false,
      annualFeeHistory: history,
      participatedTrainingIds: type === 'BUSINESS' ? [] : uniqueStrings_(applicationsByMember[id] || []),
    };
  });
}

function mapTrainingRowsForApi_(trainingRows) {
  return (trainingRows || []).map(function(t) {
    var feesRaw = String(t['費用JSON'] || '');
    var fees = [];
    if (feesRaw) {
      try {
        fees = JSON.parse(feesRaw);
      } catch (e) {
        var n = Number(feesRaw);
        if (!isNaN(n) && n >= 0) {
          fees = [{ label: '会員', amount: n }];
        }
      }
    }
    if (!fees || fees.length === 0) {
      fees = [{ label: '会員', amount: 0 }, { label: '非会員', amount: 0 }];
    }

    var trainingOptions = parseTrainingOptions_(t['項目設定JSON']);

    return {
      id: String(t['研修ID'] || ''),
      title: String(t['研修名'] || ''),
      summary: String(t['研修概要'] || ''),
      description: String(t['研修内容'] || ''),
      guidePdfUrl: String(t['案内状URL'] || ''),
      date: formatDateForApi_(t['開催日']),
      endTime: String(t['開催終了時刻'] || ''),
      capacity: Number(t['定員'] || 0),
      applicants: Number(t['申込者数'] || 0),
      location: String(t['開催場所'] || ''),
      status: deriveTrainingStatusByCloseDate_(t['申込締切日']),
      organizer: String(t['主催者'] || ''),
      isNonMandatory: toBoolean_(t['法定外研修フラグ']),
      fees: fees,
      applicationOpenDate: formatDateForApi_(t['申込開始日']),
      applicationCloseDate: formatDateForApi_(t['申込締切日']),
      instructor: String(t['講師'] || ''),
      fieldConfig: trainingOptions.fieldConfig,
      cancelAllowed: trainingOptions.cancelAllowed,
      inquiryPerson: trainingOptions.inquiryPerson,
      inquiryContactType: trainingOptions.inquiryContactType,
      inquiryContactValue: trainingOptions.inquiryContactValue,
      inquiryPhone: trainingOptions.inquiryPhone,
      inquiryEmail: trainingOptions.inquiryEmail,
    };
  });
}

function getAdminDashboardData_() {
  var cache = CacheService.getScriptCache();
  var cacheKey = getAdminDashboardCacheKey_();
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var trainingRows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) {
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
  var applicationRows = getTrainingApplicationRows_(ss, { appliedOnly: true });
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
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
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

    // v143: アクティブ（在籍中 + 退会予定）のみカード表示数に加算
    var isActive = memberStatus === 'ACTIVE' || memberStatus === 'WITHDRAWAL_SCHEDULED';
    if (isActive) {
      activeMemberCount += 1;
      if (memberType === 'INDIVIDUAL' || memberType === 'SUPPORT') individualCount += 1;
      if (memberType === 'BUSINESS') businessCount += 1;
    }

    if (joinedDateRaw) {
      var jd = new Date(joinedDateRaw);
      if (!isNaN(jd.getTime()) && jd >= fyStart && jd <= fyEnd) currentYearJoinedCount += 1;
    }
    var withdrawnDateRaw = String(member['退会日'] || '');
    if (withdrawnDateRaw && memberStatus === 'WITHDRAWN') {
      var wd = new Date(withdrawnDateRaw);
      if (!isNaN(wd.getTime()) && wd >= fyStart && wd <= fyEnd) currentYearWithdrawnCount += 1;
    }

    return {
      memberId: memberId,
      displayName: buildAnnualFeeDisplayName_(member),
      memberType: memberType,
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
      status: deriveTrainingStatusByCloseDate_(training['申込締切日']),
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
    trainingRows: trainingSummaries,
  };

  try {
    putChunkedCache_(cache, cacheKey, result, ALL_DATA_CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('getAdminDashboardData_ cache skipped: ' + e.message);
  }
  return result;
}

function getTrainingManagementData_() {
  var cache = CacheService.getScriptCache();
  var cacheKey = getTrainingManagementCacheKey_();
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var trainingRows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });

  var trainings = mapTrainingRowsForApi_(trainingRows).sort(function(a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });

  try {
    putChunkedCache_(cache, cacheKey, trainings, ALL_DATA_CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('getTrainingManagementData_ cache skipped: ' + e.message);
  }
  return trainings;
}

function parseTransferAccount_(raw, fallback) {
  var defaultAccount = fallback || DEMO_TRANSFER_ACCOUNT;
  if (!raw) return defaultAccount;
  var txt = String(raw);
  try {
    var parsed = JSON.parse(txt);
    if (parsed && parsed.bankName && parsed.accountNumber) {
      return parsed;
    }
  } catch (e) {}
  return defaultAccount;
}

function getAnnualFeeTransferAccountSetting_(ss) {
  var raw = getSystemSettingValue_(ss, 'ANNUAL_FEE_TRANSFER_ACCOUNT');
  if (!raw) return DEMO_TRANSFER_ACCOUNT;
  try {
    var parsed = JSON.parse(String(raw));
    if (parsed && parsed.bankName && parsed.accountNumber && parsed.accountName) {
      return {
        bankName: String(parsed.bankName || ''),
        branchName: String(parsed.branchName || ''),
        accountType: String(parsed.accountType || '普通') === '当座' ? '当座' : '普通',
        accountNumber: String(parsed.accountNumber || ''),
        accountName: String(parsed.accountName || ''),
        note: String(parsed.note || ''),
      };
    }
  } catch (e) {}
  return DEMO_TRANSFER_ACCOUNT;
}

function validateAnnualFeeTransferAccount_(account) {
  if (!account) throw new Error('年会費の振込先が未設定です。');
  var normalized = {
    bankName: String(account.bankName || '').trim(),
    branchName: String(account.branchName || '').trim(),
    accountType: String(account.accountType || '普通') === '当座' ? '当座' : '普通',
    accountNumber: String(account.accountNumber || '').trim(),
    accountName: String(account.accountName || '').trim(),
    note: String(account.note || '').trim(),
  };
  if (!normalized.bankName) throw new Error('年会費の振込先の銀行名は必須です。');
  if (!normalized.branchName) throw new Error('年会費の振込先の支店名は必須です。');
  if (!normalized.accountNumber) throw new Error('年会費の振込先の口座番号は必須です。');
  if (!normalized.accountName) throw new Error('年会費の振込先の口座名義は必須です。');
  if (normalized.bankName.length > 100 || normalized.branchName.length > 100 || normalized.accountName.length > 150 || normalized.note.length > 500) {
    throw new Error('年会費の振込先情報が長すぎます。');
  }
  return normalized;
}

function uniqueStrings_(arr) {
  var out = [];
  var seen = {};
  for (var i = 0; i < arr.length; i += 1) {
    var v = String(arr[i] || '');
    if (!v || seen[v]) continue;
    seen[v] = true;
    out.push(v);
  }
  return out;
}

function clearTableData_(ss, sheetNames) {
  for (var i = 0; i < sheetNames.length; i += 1) {
    var sheet = ss.getSheetByName(sheetNames[i]);
    if (!sheet) continue;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  }
}

function rewriteTableWithoutRows_(ss, sheetName, keepPredicate) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { removed: 0, kept: 0 };
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { removed: 0, kept: 0 };

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var keptRows = [];
  for (var r = 0; r < values.length; r += 1) {
    var rowObj = {};
    for (var c = 0; c < headers.length; c += 1) {
      rowObj[headers[c]] = values[r][c];
    }
    if (keepPredicate(rowObj, values[r])) {
      keptRows.push(values[r]);
    }
  }

  sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (keptRows.length > 0) {
    var writeRange = sheet.getRange(2, 1, keptRows.length, lastCol);
    writeRange.clearDataValidations();
    writeRange.setValues(keptRows);
  }

  return {
    removed: values.length - keptRows.length,
    kept: keptRows.length,
  };
}

function appendRowsByHeaders_(ss, sheetName, objectRows) {
  if (!objectRows || objectRows.length === 0) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('シートが見つかりません: ' + sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rows = objectRows.map(function(obj) {
    var row = [];
    for (var i = 0; i < headers.length; i += 1) {
      row.push(obj[headers[i]] !== undefined ? obj[headers[i]] : '');
    }
    return row;
  });
  var startRow = sheet.getLastRow() + 1;
  // シートの最大行数を超える場合は行を追加する（restoreSheetFromBackupSpreadsheet_ で復元したシートは行数が固定のため）
  var neededRows = startRow + rows.length - 1;
  var maxRow = sheet.getMaxRows();
  if (neededRows > maxRow) {
    sheet.insertRowsAfter(maxRow, neededRows - maxRow);
  }
  var targetRange = sheet.getRange(startRow, 1, rows.length, headers.length);
  // シード投入時は既存入力規則に阻害されないよう、投入範囲の検証だけ解除してから書き込む。
  targetRange.clearDataValidations();
  targetRange.setValues(rows);
}

function getRowsAsObjects_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rows = [];
  for (var r = 0; r < values.length; r += 1) {
    var obj = {};
    for (var c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = values[r][c];
    }
    rows.push(obj);
  }
  return rows;
}

function getDbInfo_() {
  var ss = getOrCreateDatabase_();
  return {
    スプレッドシートID: ss.getId(),
    スプレッドシートURL: ss.getUrl(),
    シート一覧: ss.getSheets().map(function(sheet) {
      return sheet.getName();
    }),
  };
}

function parsePayload_(payload) {
  if (!payload) {
    return null;
  }
  if (typeof payload !== 'string') {
    return payload;
  }
  try {
    return JSON.parse(payload);
  } catch (e) {
    throw new Error('payloadのJSONパースに失敗しました。');
  }
}

function changePassword_(request) {
  if (!request || !request.loginId || !request.currentPassword || !request.newPassword) {
    throw new Error('パスワード変更パラメータが不足しています。');
  }

  var loginId = String(request.loginId).trim();
  var currentPassword = String(request.currentPassword);
  var newPassword = String(request.newPassword);

  if (newPassword.length < 8) {
    throw new Error('新しいパスワードは8文字以上で入力してください。');
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

  var currentHash = hashPassword_(currentPassword, storedSalt);
  if (currentHash !== storedHash) {
    failedCount += 1;
    var lockNow = failedCount >= 5;
    if (columns['ログイン失敗回数'] != null) {
      authSheet.getRange(authRowInfo.rowNumber, columns['ログイン失敗回数'] + 1).setValue(failedCount);
    }
    if (columns['ロック状態'] != null) {
      authSheet.getRange(authRowInfo.rowNumber, columns['ロック状態'] + 1).setValue(lockNow);
    }
    if (columns['更新日時'] != null) {
      authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(new Date().toISOString());
    }
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', '現在パスワード不一致');
    throw new Error('現在のパスワードが正しくありません。');
  }

  var newSalt = generateSalt_();
  var newHash = hashPassword_(newPassword, newSalt);
  var nowIso = new Date().toISOString();

  authSheet.getRange(authRowInfo.rowNumber, columns['パスワードソルト'] + 1).setValue(newSalt);
  authSheet.getRange(authRowInfo.rowNumber, columns['パスワードハッシュ'] + 1).setValue(newHash);
  authSheet.getRange(authRowInfo.rowNumber, columns['パスワード更新日時'] + 1).setValue(nowIso);
  if (columns['ログイン失敗回数'] != null) {
    authSheet.getRange(authRowInfo.rowNumber, columns['ログイン失敗回数'] + 1).setValue(0);
  }
  if (columns['ロック状態'] != null) {
    authSheet.getRange(authRowInfo.rowNumber, columns['ロック状態'] + 1).setValue(false);
  }
  if (columns['更新日時'] != null) {
    authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(nowIso);
  }

  appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'SUCCESS', 'パスワード変更成功');

  return {
    loginId: loginId,
    updatedAt: nowIso,
  };
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
  if (isLocked) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'アカウントロック');
    throw new Error('アカウントがロックされています。');
  }
  if (!storedSalt || !storedHash) {
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'パスワード未初期化');
    throw new Error('パスワードが初期化されていません。');
  }

  var currentHash = hashPassword_(password, storedSalt);
  if (currentHash !== storedHash) {
    failedCount += 1;
    var lockNow = failedCount >= 5;
    authSheet.getRange(authRowInfo.rowNumber, columns['ログイン失敗回数'] + 1).setValue(failedCount);
    authSheet.getRange(authRowInfo.rowNumber, columns['ロック状態'] + 1).setValue(lockNow);
    authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(new Date().toISOString());
    appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'FAILURE', 'パスワード不一致');
    throw new Error('ログインIDまたはパスワードが正しくありません。');
  }

  var nowIso = new Date().toISOString();
  authSheet.getRange(authRowInfo.rowNumber, columns['ログイン失敗回数'] + 1).setValue(0);
  authSheet.getRange(authRowInfo.rowNumber, columns['ロック状態'] + 1).setValue(false);
  authSheet.getRange(authRowInfo.rowNumber, columns['最終ログイン日時'] + 1).setValue(nowIso);
  authSheet.getRange(authRowInfo.rowNumber, columns['更新日時'] + 1).setValue(nowIso);
  appendLoginHistory_(ss, authId, loginId, 'PASSWORD', 'SUCCESS', '会員ログイン成功');

  return {
    authMethod: 'PASSWORD',
    loginId: loginId,
    memberId: memberId,
    staffId: staffId,
    roleCode: roleCode,
    canAccessAdminPage: false,
    authenticatedAt: nowIso,
  };
}


/**
 * 管理者権限コードを日本語ラベルに変換する。
 */
function mapAdminPermissionLabel_(permCode) {
  var map = {
    'MASTER': 'マスター',
    'ADMIN': '管理者',
    'TRAINING_MANAGER': '研修管理者',
    'TRAINING_REGISTRAR': '研修登録者',
    'GENERAL': '一般',
  };
  return map[permCode] || permCode;
}

/**
 * google.script.run 経由で呼び出し元の Google セッションを検証し、管理者認証を行う。
 * Session.getActiveUser() は google.script.run 呼び出し元のメールを返す（Execute as: Me でも）。
 * 権限コードに応じた adminPermissionLevel を返す。
 */
function checkAdminBySession_() {
  var email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error('Googleアカウントでログインされていません。組織のGoogleアカウントでブラウザにログインしてください。');
  }
  email = email.toLowerCase();

  var ss = getOrCreateDatabase_();
  var cache = CacheService.getScriptCache();

  // ホワイトリストをキャッシュ（5分）— 小テーブルで変更が稀なためスクリプトキャッシュで安全
  var whitelistRows;
  var cachedWL = cache.get('admin_wl_v1');
  if (cachedWL) {
    try { whitelistRows = JSON.parse(cachedWL); } catch (e) { whitelistRows = null; }
  }
  if (!whitelistRows) {
    whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト');
    try { cache.put('admin_wl_v1', JSON.stringify(whitelistRows), 300); } catch (e) {}
  }
  whitelistRows = whitelistRows.filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
  });

  var matched = null;
  for (var i = 0; i < whitelistRows.length; i += 1) {
    var w = whitelistRows[i];
    var wEmail = String(w['Googleメール'] || '').toLowerCase();
    if (wEmail && wEmail === email) { matched = w; break; }
  }

  if (!matched) {
    appendLoginHistory_(ss, '', email, 'GOOGLE', 'FAILURE', 'ホワイトリスト未登録（セッション認証）');
    throw new Error('管理者権限がありません。');
  }

  // 権限コード取得（空欄は既存データ互換で ADMIN）
  var permCode = String(matched['権限コード'] || '') || 'ADMIN';

  // GENERAL 権限は管理者ログイン不可
  if (permCode === 'GENERAL') {
    appendLoginHistory_(ss, '', email, 'GOOGLE', 'FAILURE', '一般権限のため管理者ログイン不可');
    throw new Error('管理者権限が無効です。会員ログイン（ID/パスワード）をご利用ください。');
  }

  var linkedAuthId = String(matched['紐付け認証ID'] || '');
  var linkedMemberId = String(matched['紐付け会員ID'] || '');

  // 認証アカウントをキャッシュ（5分）
  var authRows;
  var cachedAuth = cache.get('admin_auth_v1');
  if (cachedAuth) {
    try { authRows = JSON.parse(cachedAuth); } catch (e) { authRows = null; }
  }
  if (!authRows) {
    authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
    try { cache.put('admin_auth_v1', JSON.stringify(authRows), 300); } catch (e) {}
  }

  var linkedAuth = null;
  for (var j = 0; j < authRows.length; j += 1) {
    var a = authRows[j];
    if (linkedAuthId && String(a['認証ID'] || '') === linkedAuthId) { linkedAuth = a; break; }
  }

  if (!linkedAuth) {
    appendLoginHistory_(ss, '', email, 'GOOGLE', 'FAILURE', '紐付け認証ID未整備（セッション認証）');
    throw new Error('管理者の認証紐付けが未設定です。');
  }

  var authId = String(linkedAuth['認証ID'] || '');
  var roleCode = String(linkedAuth['システムロールコード'] || '');
  var memberId = linkedMemberId || String(linkedAuth['会員ID'] || '');
  var staffId = String(linkedAuth['職員ID'] || '');
  if (!memberId) {
    appendLoginHistory_(ss, authId, email, 'GOOGLE', 'FAILURE', '会員ID未紐付け（セッション認証）');
    throw new Error('管理者に会員IDが紐付いていません。');
  }

  // 表示名: fetchAllDataFromDb_ キャッシュを優先利用（T_会員の直接読み込みを回避）
  var memberName = '';
  var cachedAllData = getChunkedCache_(cache, getAllDataCacheKey_());
  if (cachedAllData && cachedAllData.members) {
    for (var ci = 0; ci < cachedAllData.members.length; ci += 1) {
      if (cachedAllData.members[ci].id === memberId) {
        memberName = ((cachedAllData.members[ci].lastName || '') + ' ' + (cachedAllData.members[ci].firstName || '')).trim();
        break;
      }
    }
  }
  if (!memberName) {
    // キャッシュにない場合は直接読み込み
    var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
    for (var k = 0; k < memberRows.length; k += 1) {
      if (String(memberRows[k]['会員ID'] || '') === memberId) {
        memberName = (String(memberRows[k]['姓'] || '') + ' ' + String(memberRows[k]['名'] || '')).trim();
        break;
      }
    }
  }
  var derivedDisplayName = memberName ? memberName + '（' + mapAdminPermissionLabel_(permCode) + '）' : mapAdminPermissionLabel_(permCode);

  var nowIso = new Date().toISOString();
  appendLoginHistory_(ss, authId, email, 'GOOGLE', 'SUCCESS', '管理者セッション認証成功（' + permCode + '）');

  return {
    authMethod: 'GOOGLE',
    loginId: email,
    memberId: memberId,
    staffId: staffId,
    roleCode: roleCode,
    canAccessAdminPage: true,
    adminPermissionLevel: permCode,
    displayName: derivedDisplayName,
    authenticatedAt: nowIso,
  };
}

function getSystemSettings_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var raw = Number(getSystemSettingValue_(ss, 'DEFAULT_BUSINESS_STAFF_LIMIT') || 10);
  var lookbackRaw = Number(getSystemSettingValue_(ss, 'TRAINING_HISTORY_LOOKBACK_MONTHS') || 18);
  var guidanceRaw = getSystemSettingValue_(ss, 'ANNUAL_FEE_PAYMENT_GUIDANCE');
  var transferAccount = getAnnualFeeTransferAccountSetting_(ss);
  var value = Math.floor(raw);
  var lookback = Math.floor(lookbackRaw);
  var guidance = guidanceRaw == null
    ? '年会費が未納の場合は、下記の振込先をご確認のうえお手続きください。\n振込名義は会員番号と氏名を記載してください。'
    : String(guidanceRaw);
  if (!isFinite(value) || value < 1) value = 10;
  if (!isFinite(lookback) || lookback < 1) lookback = 18;
  var trainingDefaultFieldConfigRaw = getSystemSettingValue_(ss, 'TRAINING_DEFAULT_FIELD_CONFIG');
  var trainingDefaultFieldConfig = null;
  if (trainingDefaultFieldConfigRaw) {
    try { trainingDefaultFieldConfig = JSON.parse(trainingDefaultFieldConfigRaw); } catch (e) {}
  }
  // v194: PDF名簿出力 & 一括メール設定
  var rosterTemplateSsId = String(getSystemSettingValue_(ss, 'ROSTER_TEMPLATE_SS_ID') || '');
  var bulkMailAutoAttachFolderId = String(getSystemSettingValue_(ss, 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID') || '');
  var emailLogViewerRole = String(getSystemSettingValue_(ss, 'EMAIL_LOG_VIEWER_ROLE') || 'MASTER');
  return {
    defaultBusinessStaffLimit: value,
    trainingHistoryLookbackMonths: lookback,
    annualFeePaymentGuidance: guidance,
    annualFeeTransferAccount: transferAccount,
    trainingDefaultFieldConfig: trainingDefaultFieldConfig,
    rosterTemplateSsId: rosterTemplateSsId,
    bulkMailAutoAttachFolderId: bulkMailAutoAttachFolderId,
    emailLogViewerRole: emailLogViewerRole,
  };
}

// MASTER のみ変更可能な設定キー（v194）
var MASTER_ONLY_SETTING_KEYS = ['EMAIL_LOG_VIEWER_ROLE'];

// T_システム設定のスネークアッパーケースキーを camelCase に変換する
// 例: 'EMAIL_LOG_VIEWER_ROLE' → 'emailLogViewerRole'
function convertSettingKeyToCamel_(key) {
  return key.toLowerCase().replace(/_([a-z])/g, function(_, c) { return c.toUpperCase(); });
}

function updateSystemSettings_(request, callerPermLevel) {
  if (!request) throw new Error('settings が空です。');
  // MASTER 限定キーのチェック
  var effectivePermLevel = callerPermLevel || 'ADMIN';
  var masterOnlyRequested = MASTER_ONLY_SETTING_KEYS.some(function(k) {
    return request[convertSettingKeyToCamel_(k)] !== undefined;
  });
  if (masterOnlyRequested && effectivePermLevel !== 'MASTER') {
    throw new Error('この設定はマスター権限のみ変更できます。');
  }
  var next = Number(request.defaultBusinessStaffLimit || 0);
  var lookbackRaw = request.trainingHistoryLookbackMonths;
  var lookback = Number(lookbackRaw);
  var guidance = request.annualFeePaymentGuidance == null ? '' : String(request.annualFeePaymentGuidance);
  var transferAccount = validateAnnualFeeTransferAccount_(request.annualFeeTransferAccount);
  if (lookbackRaw == null || lookbackRaw === '') {
    var ssForDefault = getOrCreateDatabase_();
    initializeSchema_(ssForDefault);
    lookback = Number(getSystemSettingValue_(ssForDefault, 'TRAINING_HISTORY_LOOKBACK_MONTHS') || 18);
  }
  if (!isFinite(next) || next < 1 || next > 200) {
    throw new Error('事業所メンバー上限（全体）は 1〜200 の範囲で設定してください。');
  }
  if (!isFinite(lookback) || lookback < 1 || lookback > 60) {
    throw new Error('履歴表示期間（月）は 1〜60 の範囲で設定してください。');
  }
  if (guidance.length > 2000) {
    throw new Error('年会費の納入案内は 2000 文字以内で設定してください。');
  }
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  upsertSystemSetting_(ss, 'DEFAULT_BUSINESS_STAFF_LIMIT', String(Math.floor(next)), '事業所会員メンバー上限（全体デフォルト）');
  upsertSystemSetting_(ss, 'TRAINING_HISTORY_LOOKBACK_MONTHS', String(Math.floor(lookback)), '研修履歴の表示期間（月）');
  upsertSystemSetting_(ss, 'ANNUAL_FEE_PAYMENT_GUIDANCE', guidance, '年会費未納時の会員向け納入案内');
  upsertSystemSetting_(ss, 'ANNUAL_FEE_TRANSFER_ACCOUNT', JSON.stringify(transferAccount), '年会費未納時の共通振込先');
  upsertSystemSetting_(ss, 'DB_SCHEMA_VERSION', DB_SCHEMA_VERSION, 'DBスキーマバージョン');
  if (request.trainingDefaultFieldConfig != null) {
    upsertSystemSetting_(ss, 'TRAINING_DEFAULT_FIELD_CONFIG', JSON.stringify(request.trainingDefaultFieldConfig), '研修フォームのデフォルト表示項目設定');
  }
  // v194: PDF名簿出力 & 一括メール設定（MASTER/ADMIN 共通可変）
  if (request.rosterTemplateSsId != null) {
    upsertSystemSetting_(ss, 'ROSTER_TEMPLATE_SS_ID', String(request.rosterTemplateSsId).trim(), '名簿テンプレートスプレッドシートID');
  }
  if (request.bulkMailAutoAttachFolderId != null) {
    upsertSystemSetting_(ss, 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID', String(request.bulkMailAutoAttachFolderId).trim(), '一括メール個別自動添付DriveフォルダID');
  }
  // v194: MASTER のみ変更可能
  if (request.emailLogViewerRole != null && effectivePermLevel === 'MASTER') {
    var allowedRoles = ['MASTER', 'MASTER,ADMIN'];
    var roleVal = String(request.emailLogViewerRole).trim();
    if (allowedRoles.indexOf(roleVal) < 0) roleVal = 'MASTER';
    upsertSystemSetting_(ss, 'EMAIL_LOG_VIEWER_ROLE', roleVal, 'メール送信ログ閲覧権限');
  }
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(DEFAULT_BUSINESS_STAFF_LIMIT_KEY, String(Math.floor(next))); // backward compatibility
  scriptProperties.setProperty(TRAINING_HISTORY_LOOKBACK_MONTHS_KEY, String(Math.floor(lookback))); // backward compatibility
  return getSystemSettings_();
}

function getAdminPermissionData_(callerSession) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var callerEmail = '';
  var callerPermLevel = 'ADMIN';
  if (callerSession) {
    callerEmail = String(callerSession.loginId || '');
    callerPermLevel = String(callerSession.adminPermissionLevel || 'ADMIN');
  } else {
    callerEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  }
  return {
    entries: getAdminPermissionEntries_(ss),
    identityOptions: getAdminPermissionIdentityOptions_(ss),
    currentSessionEmail: callerEmail,
    currentSessionPermissionLevel: callerPermLevel,
  };
}

function saveAdminPermission_(payload) {
  if (!payload) throw new Error('権限データが空です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  // 呼出元セッション情報
  var callerSession = payload.__adminSession || null;
  var callerEmail = callerSession ? String(callerSession.loginId || '') : String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var callerPerm = callerSession ? String(callerSession.adminPermissionLevel || 'ADMIN') : 'ADMIN';

  var normalizedEmail = String(payload.googleEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Googleメールアドレスの形式が不正です。');
  }

  var linkedAuthId = String(payload.linkedAuthId || '').trim();
  if (!linkedAuthId) throw new Error('紐付け認証IDは必須です。');

  // 権限コード検証
  var validPerms = ['MASTER', 'ADMIN', 'TRAINING_MANAGER', 'TRAINING_REGISTRAR', 'GENERAL'];
  var permissionLevel = String(payload.permissionLevel || 'ADMIN').trim();
  if (validPerms.indexOf(permissionLevel) === -1) {
    throw new Error('無効な権限コードです: ' + permissionLevel);
  }

  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('T_認証アカウント シートが見つかりません。');
  var linkedAuth = findRowByColumnValue_(authSheet, '認証ID', linkedAuthId);
  if (!linkedAuth || toBoolean_(linkedAuth.row[linkedAuth.columns['削除フラグ']])) {
    throw new Error('紐付け認証ID が見つかりません。');
  }
  if (!toBoolean_(linkedAuth.row[linkedAuth.columns['アカウント有効フラグ']])) {
    throw new Error('紐付け先の認証アカウントが無効です。');
  }

  var linkedMemberId = String(linkedAuth.row[linkedAuth.columns['会員ID']] || '').trim();
  if (!linkedMemberId) throw new Error('紐付け先の認証アカウントに会員IDがありません。');

  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません。');
  var id = String(payload.id || '').trim();
  var existing = id ? findRowByColumnValue_(sheet, 'ホワイトリストID', id) : null;

  var rows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });

  // メール重複チェック
  for (var i = 0; i < rows.length; i += 1) {
    var rowId = String(rows[i]['ホワイトリストID'] || '');
    var rowEmail = String(rows[i]['Googleメール'] || '').trim().toLowerCase();
    if (rowEmail && rowEmail === normalizedEmail && rowId !== id) {
      throw new Error('同じ Googleメールアドレスは既に登録されています。');
    }
  }

  // 権限制約チェック
  if (existing) {
    var existingPerm = String(existing.row[existing.columns['権限コード']] || '') || 'ADMIN';
    // ADMIN は MASTER レコードを編集できない
    if (callerPerm === 'ADMIN' && existingPerm === 'MASTER') {
      throw new Error('管理者権限ではマスター権限のレコードを編集できません。');
    }
    // ADMIN は自分の権限を変更できない
    var existingEmail = String(existing.row[existing.columns['Googleメール']] || '').toLowerCase();
    if (callerPerm === 'ADMIN' && callerEmail === existingEmail && permissionLevel !== existingPerm) {
      throw new Error('管理者権限では自分の権限レベルを変更できません。');
    }
  }

  // 最後のマスター保護
  if (existing) {
    var existingPermForMaster = String(existing.row[existing.columns['権限コード']] || '') || 'ADMIN';
    if (existingPermForMaster === 'MASTER' && permissionLevel !== 'MASTER') {
      var masterCount = 0;
      for (var m = 0; m < rows.length; m += 1) {
        if (String(rows[m]['権限コード'] || '') === 'MASTER' && toBoolean_(rows[m]['有効フラグ'])) {
          masterCount += 1;
        }
      }
      if (masterCount <= 1) {
        throw new Error('最後のマスター権限者の権限を変更することはできません。');
      }
    }
  }

  var nowIso = new Date().toISOString();
  var nextRow = {
    ホワイトリストID: id || ('WL-' + Utilities.getUuid().slice(0, 8)),
    Googleメール: normalizedEmail,
    紐付け認証ID: linkedAuthId,
    紐付け会員ID: linkedMemberId,
    権限コード: permissionLevel,
    有効フラグ: payload.enabled !== false,
    変更者メール: callerEmail,
    変更日時: nowIso,
    作成日時: existing ? String(existing.row[existing.columns['作成日時']] || nowIso) : nowIso,
    更新日時: nowIso,
    削除フラグ: false,
  };

  if (existing) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var updatedRow = existing.row.slice();
    for (var h = 0; h < headers.length; h += 1) {
      if (Object.prototype.hasOwnProperty.call(nextRow, headers[h])) {
        updatedRow[h] = nextRow[headers[h]];
      }
    }
    sheet.getRange(existing.rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);
  } else {
    appendRowsByHeaders_(ss, 'T_管理者Googleホワイトリスト', [nextRow]);
  }

  // ホワイトリスト変更時はキャッシュを無効化
  try { CacheService.getScriptCache().remove('admin_wl_v1'); } catch (e) {}
  return { saved: true, id: nextRow['ホワイトリストID'] };
}

function deleteAdminPermission_(payload) {
  var id = String(payload && payload.id || '').trim();
  if (!id) throw new Error('ホワイトリストID が未指定です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, 'ホワイトリストID', id);
  if (!found) throw new Error('削除対象の管理者権限が見つかりません。');

  // 最後のマスター保護
  var targetPerm = String(found.row[found.columns['権限コード']] || '') || 'ADMIN';
  if (targetPerm === 'MASTER') {
    var allRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
      return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
    });
    var masterCount = 0;
    for (var i = 0; i < allRows.length; i += 1) {
      if (String(allRows[i]['権限コード'] || '') === 'MASTER') masterCount += 1;
    }
    if (masterCount <= 1) {
      throw new Error('最後のマスター権限者を削除することはできません。');
    }
  }

  // 呼出元セッション情報で変更ログを記録
  var callerSession = payload.__adminSession || null;
  var callerEmail = callerSession ? String(callerSession.loginId || '') : String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var nowIso = new Date().toISOString();

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['更新日時']] = nowIso;
  row[found.columns['削除フラグ']] = true;
  if (found.columns['変更者メール'] != null) row[found.columns['変更者メール']] = callerEmail;
  if (found.columns['変更日時'] != null) row[found.columns['変更日時']] = nowIso;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  // ホワイトリスト変更時はキャッシュを無効化
  try { CacheService.getScriptCache().remove('admin_wl_v1'); } catch (e) {}
  return { deleted: true, id: id };
}

function getAdminPermissionEntries_(ss) {
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var memberMap = {};
  var staffMap = {};
  var authMap = {};
  for (var i = 0; i < memberRows.length; i += 1) {
    memberMap[String(memberRows[i]['会員ID'] || '')] = memberRows[i];
  }
  for (var j = 0; j < staffRows.length; j += 1) {
    staffMap[String(staffRows[j]['職員ID'] || '')] = staffRows[j];
  }
  for (var k = 0; k < authRows.length; k += 1) {
    authMap[String(authRows[k]['認証ID'] || '')] = authRows[k];
  }

  return getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト')
    .filter(function(row) { return !toBoolean_(row['削除フラグ']); })
    .map(function(row) {
      var linkedAuthId = String(row['紐付け認証ID'] || '');
      var linkedAuth = authMap[linkedAuthId];
      var linkedMemberId = String(row['紐付け会員ID'] || (linkedAuth && linkedAuth['会員ID']) || '');
      var linkedStaffId = String((linkedAuth && linkedAuth['職員ID']) || '');
      var permLevel = String(row['権限コード'] || '') || 'ADMIN';
      // 表示名を会員名 + 権限ラベルから自動導出
      var memberRow = memberMap[linkedMemberId];
      var memberName = memberRow ? (String(memberRow['姓'] || '') + ' ' + String(memberRow['名'] || '')).trim() : '';
      var derivedDisplayName = memberName ? memberName + '（' + mapAdminPermissionLabel_(permLevel) + '）' : mapAdminPermissionLabel_(permLevel);
      return {
        id: String(row['ホワイトリストID'] || ''),
        googleEmail: String(row['Googleメール'] || '').trim().toLowerCase(),
        displayName: derivedDisplayName,
        linkedAuthId: linkedAuthId,
        linkedMemberId: linkedMemberId,
        linkedStaffId: linkedStaffId,
        linkedRoleCode: String((linkedAuth && linkedAuth['システムロールコード']) || ''),
        linkedIdentityLabel: buildAdminPermissionIdentityLabel_(memberMap[linkedMemberId], staffMap[linkedStaffId], linkedAuth),
        permissionLevel: permLevel,
        enabled: toBoolean_(row['有効フラグ']),
        updatedAt: String(row['更新日時'] || ''),
        updatedByEmail: String(row['変更者メール'] || ''),
        updatedByAt: String(row['変更日時'] || ''),
      };
    })
    .sort(function(a, b) {
      return String(a.googleEmail || '').localeCompare(String(b.googleEmail || ''));
    });
}

function getAdminPermissionIdentityOptions_(ss) {
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && toBoolean_(row['アカウント有効フラグ']);
  });
  var memberMap = {};
  var staffMap = {};
  for (var i = 0; i < memberRows.length; i += 1) {
    memberMap[String(memberRows[i]['会員ID'] || '')] = memberRows[i];
  }
  for (var j = 0; j < staffRows.length; j += 1) {
    staffMap[String(staffRows[j]['職員ID'] || '')] = staffRows[j];
  }

  var options = [];
  for (var k = 0; k < authRows.length; k += 1) {
    var authRow = authRows[k];
    var optionMemberId = String(authRow['会員ID'] || '').trim();
    if (!optionMemberId) continue;
    var optionStaffId = String(authRow['職員ID'] || '').trim();
    options.push({
      authId: String(authRow['認証ID'] || ''),
      authMethod: String(authRow['認証方式'] || 'PASSWORD'),
      loginId: String(authRow['ログインID'] || ''),
      memberId: optionMemberId,
      staffId: optionStaffId,
      roleCode: String(authRow['システムロールコード'] || ''),
      label: buildAdminPermissionIdentityLabel_(memberMap[optionMemberId], staffMap[optionStaffId], authRow),
    });
  }
  options.sort(function(a, b) {
    return String(a.label || '').localeCompare(String(b.label || ''));
  });
  return options;
}

function buildAdminPermissionIdentityLabel_(memberRow, staffRow, authRow) {
  if (!authRow) return '紐付け先不明';
  var base = buildAnnualFeeDisplayName_(memberRow);
  if (staffRow) {
    base = base + ' - ' + String(staffRow['氏名'] || '');
  }
  var suffix = [];
  var roleCode = String(authRow['システムロールコード'] || '');
  if (roleCode) suffix.push(mapSystemRoleLabel_(roleCode));
  var loginId = String(authRow['ログインID'] || '');
  if (loginId) suffix.push('ログインID: ' + loginId);
  return suffix.length ? base + ' (' + suffix.join(' / ') + ')' : base;
}

function mapSystemRoleLabel_(roleCode) {
  switch (String(roleCode || '')) {
    case 'OFFICE_ADMIN': return '事務局管理者';
    case 'INDIVIDUAL_MEMBER': return '個人会員';
    case 'BUSINESS_ADMIN': return '事業所管理者';
    case 'BUSINESS_MEMBER': return '事業所メンバー';
    default: return String(roleCode || '');
  }
}

function getCurrentFiscalYear_() {
  var now = new Date();
  var month = now.getMonth() + 1;
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

function getAnnualFeeFiscalYearPreviousEndDate_(fiscalYear) {
  return String(Number(fiscalYear || 0)) + '-03-31';
}

function getAnnualFeeFiscalYearEndDate_(fiscalYear) {
  return String(Number(fiscalYear || 0) + 1) + '-03-31';
}

function buildMemberAnnualFeeHistory_(memberRow, feeHistory, memberTypeFeeMap) {
  var history = Array.isArray(feeHistory) ? feeHistory.slice() : [];
  var currentFiscalYear = getCurrentFiscalYear_();
  var hasCurrentFiscalYear = history.some(function(record) {
    return Number(record && record.year || 0) === currentFiscalYear;
  });

  if (!hasCurrentFiscalYear && isAnnualFeeEligibleMemberForYear_(memberRow, currentFiscalYear)) {
    history.push({
      id: '',
      year: currentFiscalYear,
      status: 'UNPAID',
      confirmedDate: '',
      amount: resolveAnnualFeeAmount_(memberRow, memberTypeFeeMap, 0),
      note: '',
      updatedAt: '',
    });
  }

  return history
    .sort(function(a, b) { return Number(b.year || 0) - Number(a.year || 0); })
    .slice(0, 2);
}

function isAnnualFeeEligibleMemberForYear_(memberRow, fiscalYear) {
  if (!memberRow) return false;
  if (toBoolean_(memberRow['削除フラグ'])) return false;

  var normalizedYear = Number(fiscalYear || 0);
  if (!isFinite(normalizedYear) || normalizedYear < 2000 || normalizedYear > 2100) return false;

  var memberStatus = String(memberRow['会員状態コード'] || 'ACTIVE');
  var withdrawnDate = normalizeDateInput_(memberRow['退会日']);
  var joinedDate = normalizeDateInput_(memberRow['入会日']);
  var previousFiscalYearEnd = getAnnualFeeFiscalYearPreviousEndDate_(normalizedYear);
  var fiscalYearEnd = getAnnualFeeFiscalYearEndDate_(normalizedYear);

  if (withdrawnDate && withdrawnDate <= previousFiscalYearEnd) return false;
  if (!withdrawnDate && memberStatus === 'WITHDRAWN') return false;
  if (joinedDate && joinedDate > fiscalYearEnd) return false;

  return true;
}

function buildAnnualFeeIneligibleMessage_(memberRow, fiscalYear) {
  var year = Number(fiscalYear || 0);
  var displayName = buildAnnualFeeDisplayName_(memberRow);
  var withdrawnDate = normalizeDateInput_(memberRow && memberRow['退会日']);
  var joinedDate = normalizeDateInput_(memberRow && memberRow['入会日']);
  var previousFiscalYearEnd = getAnnualFeeFiscalYearPreviousEndDate_(year);
  var fiscalYearEnd = getAnnualFeeFiscalYearEndDate_(year);

  if (withdrawnDate && withdrawnDate <= previousFiscalYearEnd) {
    return displayName + ' は対象年度 ' + year + ' の年会費対象外です。退会日 ' + withdrawnDate + ' が前年度末 ' + previousFiscalYearEnd + ' 以前です。';
  }
  if (!withdrawnDate && String(memberRow && memberRow['会員状態コード'] || 'ACTIVE') === 'WITHDRAWN') {
    return displayName + ' は対象年度 ' + year + ' の年会費対象外です。退会済みですが退会日が未設定です。';
  }
  if (joinedDate && joinedDate > fiscalYearEnd) {
    return displayName + ' は対象年度 ' + year + ' の年会費対象外です。入会日 ' + joinedDate + ' が年度末 ' + fiscalYearEnd + ' より後です。';
  }
  return displayName + ' は対象年度 ' + year + ' の年会費対象外です。';
}

function assertAnnualFeeEligibleMemberForYear_(memberRow, fiscalYear) {
  if (!isAnnualFeeEligibleMemberForYear_(memberRow, fiscalYear)) {
    throw new Error(buildAnnualFeeIneligibleMessage_(memberRow, fiscalYear));
  }
}

function createAnnualFeeAdminSummaryByType_(memberType) {
  return {
    memberType: memberType,
    eligibleCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  };
}

function buildAnnualFeeAdminSummary_(records) {
  var byType = {
    INDIVIDUAL: createAnnualFeeAdminSummaryByType_('INDIVIDUAL'),
    BUSINESS: createAnnualFeeAdminSummaryByType_('BUSINESS'),
    SUPPORT: createAnnualFeeAdminSummaryByType_('SUPPORT'),
  };
  var summary = {
    eligibleCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    memberTypeBreakdown: [
      byType.INDIVIDUAL,
      byType.BUSINESS,
      byType.SUPPORT,
    ],
  };

  for (var i = 0; i < (records || []).length; i += 1) {
    var record = records[i];
    var bucket = byType[String(record.memberType || 'INDIVIDUAL')] || byType.INDIVIDUAL;
    var amount = Number(record.amount || 0);
    var isPaid = String(record.status || 'UNPAID') === 'PAID';

    summary.eligibleCount += 1;
    bucket.eligibleCount += 1;

    if (isPaid) {
      summary.paidCount += 1;
      summary.paidAmount += amount;
      bucket.paidCount += 1;
      bucket.paidAmount += amount;
    } else {
      summary.unpaidCount += 1;
      summary.unpaidAmount += amount;
      bucket.unpaidCount += 1;
      bucket.unpaidAmount += amount;
    }
  }

  return summary;
}

function clearRecentAnnualFeeAdminCaches_() {
  var currentFiscalYear = getCurrentFiscalYear_();
  for (var year = currentFiscalYear - 2; year <= currentFiscalYear + 1; year += 1) {
    clearAnnualFeeAdminCache_(year);
  }
}

function resolveAnnualFeeSelectedYear_(ss, payload) {
  var requestedYear = Number(payload && payload.year || 0);
  if (isFinite(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100) {
    return Math.floor(requestedYear);
  }
  // year未指定時は現在の会計年度を返す。
  // 旧実装ではDBの最新レコード年度を返していたが、新年度開始直後にレコードがない場合に
  // 前年度が表示されるバグが発生するため、常に getCurrentFiscalYear_() を基準とする。
  return getCurrentFiscalYear_();
}

function getAnnualFeeAdminData_(payload) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var selectedYear = resolveAnnualFeeSelectedYear_(ss, payload);
  var cache = CacheService.getScriptCache();
  var cacheKey = getAnnualFeeAdminCacheKey_(selectedYear);
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return isAnnualFeeEligibleMemberForYear_(r, selectedYear);
  });
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var auditRows = getLastRowsAsObjects_(ss, 'T_年会費更新履歴', 20);
  var amountMap = getAnnualFeeAmountMap_(ss);

  var memberMap = {};
  for (var i = 0; i < memberRows.length; i += 1) {
    var member = memberRows[i];
    memberMap[String(member['会員ID'] || '')] = member;
  }

  var currentFiscalYear = getCurrentFiscalYear_();
  var years = feeRows.map(function(row) { return Number(row['対象年度'] || 0); })
    .filter(function(year) { return !!year; })
    .filter(function(year, idx, arr) { return arr.indexOf(year) === idx; });
  if (years.indexOf(currentFiscalYear) === -1) years.push(currentFiscalYear);
  if (years.indexOf(selectedYear) === -1) years.push(selectedYear);
  years.sort(function(a, b) { return b - a; });

  var feeByMemberYear = {};
  for (var feeIdx = 0; feeIdx < feeRows.length; feeIdx += 1) {
    var fee = feeRows[feeIdx];
    if (Number(fee['対象年度'] || 0) !== selectedYear) continue;
    feeByMemberYear[String(fee['会員ID'] || '')] = fee;
  }

  var records = memberRows.map(function(member) {
    var memberId = String(member['会員ID'] || '');
    var row = feeByMemberYear[memberId];
    return mapAnnualFeeAdminRecord_(row, member, selectedYear, amountMap);
  }).sort(function(a, b) {
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  });

  var actorNameMap = buildActorDisplayNameMap_(ss, memberMap);
  var auditLogs = auditRows.map(function(row) {
    return mapAnnualFeeAuditLog_(row, memberMap[String(row['会員ID'] || '')], actorNameMap);
  }).sort(function(a, b) {
    return String(b.executedAt || '').localeCompare(String(a.executedAt || ''));
  }).slice(0, 20);

  var result = {
    selectedYear: selectedYear,
    records: records,
    years: years,
    auditLogs: auditLogs,
    summary: buildAnnualFeeAdminSummary_(records),
  };
  try {
    putChunkedCache_(cache, cacheKey, result, ANNUAL_FEE_CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('getAnnualFeeData_ cache skipped: ' + e.message);
  }
  return result;
}

function saveAnnualFeeRecord_(payload) {
  var request = validateAnnualFeePayload_(payload);
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var memberSheet = ss.getSheetByName('T_会員');
  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', request.memberId);
  if (!memberFound || toBoolean_(memberFound.row[memberFound.columns['削除フラグ']])) {
    throw new Error('対象会員が見つかりません。');
  }
  var memberRowObj = annualFeeMemberObject_(memberFound.row, memberFound.columns);
  assertAnnualFeeEligibleMemberForYear_(memberRowObj, request.year);
  var amountMap = getAnnualFeeAmountMap_(ss);
  var resolvedAmount = resolveAnnualFeeAmount_(memberRowObj, amountMap, 0);
  var actorEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var feeSheet = ss.getSheetByName('T_年会費納入履歴');
    if (!feeSheet) throw new Error('T_年会費納入履歴 シートが見つかりません。');
    var duplicate = findAnnualFeeRowByMemberYear_(feeSheet, request.memberId, request.year);
    var foundById = request.id ? findRowByColumnValue_(feeSheet, '年会費履歴ID', request.id) : null;

    if (request.id) {
      if (!foundById) {
        throw new Error('更新対象の年会費レコードが見つかりません。');
      }
      if (duplicate && duplicate.rowNumber !== foundById.rowNumber) {
        throw new Error('同じ会員・同じ年度の年会費レコードが既に存在します。');
      }
    } else if (duplicate) {
      throw new Error('同じ会員・同じ年度の年会費レコードが既に存在します。');
    }

    var target = foundById || duplicate;
    var cols = target ? target.columns : buildColumnIndex_(feeSheet);
    requireColumns_(cols, [
      '年会費履歴ID', '会員ID', '対象年度', '会費納入状態コード',
      '納入確認日', '金額', '備考', '作成日時', '更新日時', '削除フラグ'
    ]);

    var nowIso = new Date().toISOString();
    var beforeRecord = target ? annualFeeSheetRowToObject_(target.row, cols) : null;
    var recordId = target ? String(target.row[cols['年会費履歴ID']] || '') : Utilities.getUuid();
    var nextRow = target ? target.row.slice() : new Array(Object.keys(cols).length).fill('');

    nextRow[cols['年会費履歴ID']] = recordId;
    nextRow[cols['会員ID']] = request.memberId;
    nextRow[cols['対象年度']] = request.year;
    nextRow[cols['会費納入状態コード']] = request.status;
    nextRow[cols['納入確認日']] = request.status === 'PAID' ? request.confirmedDate : '';
    nextRow[cols['金額']] = resolvedAmount;
    nextRow[cols['備考']] = request.note;
    nextRow[cols['更新日時']] = nowIso;
    nextRow[cols['削除フラグ']] = false;
    if (cols['作成日時'] != null && !target) nextRow[cols['作成日時']] = nowIso;
    if (cols['作成日時'] != null && target && !String(nextRow[cols['作成日時']] || '')) nextRow[cols['作成日時']] = nowIso;

    if (target) {
      feeSheet.getRange(target.rowNumber, 1, 1, nextRow.length).setValues([nextRow]);
    } else {
      feeSheet.getRange(feeSheet.getLastRow() + 1, 1, 1, nextRow.length).setValues([nextRow]);
    }

    var afterRecord = annualFeeSheetRowToObject_(nextRow, cols);
    appendRowsByHeaders_(ss, 'T_年会費更新履歴', [{
      年会費更新履歴ID: Utilities.getUuid(),
      年会費履歴ID: recordId,
      会員ID: request.memberId,
      対象年度: request.year,
      操作種別: target ? 'UPDATE' : 'CREATE',
      更新前JSON: beforeRecord ? JSON.stringify(beforeRecord) : '',
      更新後JSON: JSON.stringify(afterRecord),
      実行者メール: actorEmail,
      実行日時: nowIso,
    }]);

    clearAnnualFeeAdminCache_(request.year);
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return mapAnnualFeeAdminRecord_(afterRecord, memberRowObj, request.year, amountMap);
  } finally {
    lock.releaseLock();
  }
}

function saveAnnualFeeRecordsBatch_(payload) {
  if (!payload || !Array.isArray(payload.records) || payload.records.length === 0) {
    throw new Error('保存対象のレコードがありません。');
  }
  if (payload.records.length > 100) {
    throw new Error('一括保存は最大100件までです。');
  }
  var requests = [];
  for (var i = 0; i < payload.records.length; i += 1) {
    requests.push(validateAnnualFeeBatchPayload_(payload.records[i]));
  }
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var memberSheet = ss.getSheetByName('T_会員');
  var amountMap = getAnnualFeeAmountMap_(ss);
  var actorEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var feeSheet = ss.getSheetByName('T_年会費納入履歴');
    if (!feeSheet) throw new Error('T_年会費納入履歴 シートが見つかりません。');
    var cols = buildColumnIndex_(feeSheet);
    requireColumns_(cols, [
      '年会費履歴ID', '会員ID', '対象年度', '会費納入状態コード',
      '納入確認日', '金額', '備考', '作成日時', '更新日時', '削除フラグ'
    ]);
    var feeData = feeSheet.getLastRow() >= 2
      ? feeSheet.getRange(2, 1, feeSheet.getLastRow() - 1, feeSheet.getLastColumn()).getValues()
      : [];
    var nowIso = new Date().toISOString();
    var results = [];
    var withdrawnMemberIds = [];
    var auditRows = [];
    var updatedSheetRows = [];
    var appendRows = [];
    for (var ri = 0; ri < requests.length; ri += 1) {
      var request = requests[ri];
      var memberFound = findRowByColumnValue_(memberSheet, '会員ID', request.memberId);
      if (!memberFound || toBoolean_(memberFound.row[memberFound.columns['削除フラグ']])) {
        throw new Error('対象会員 ' + request.memberId + ' が見つかりません。');
      }
      var memberRowObj = annualFeeMemberObject_(memberFound.row, memberFound.columns);
      assertAnnualFeeEligibleMemberForYear_(memberRowObj, request.year);
      var resolvedAmount = resolveAnnualFeeAmount_(memberRowObj, amountMap, 0);
      var target = null;
      for (var fi = 0; fi < feeData.length; fi += 1) {
        if (String(feeData[fi][cols['会員ID']] || '') === String(request.memberId) &&
            Number(feeData[fi][cols['対象年度']] || 0) === request.year) {
          target = { rowNumber: fi + 2, row: feeData[fi].slice(), columns: cols };
          break;
        }
      }
      if (request.id && !target) {
        for (var fi2 = 0; fi2 < feeData.length; fi2 += 1) {
          if (String(feeData[fi2][cols['年会費履歴ID']] || '') === request.id) {
            target = { rowNumber: fi2 + 2, row: feeData[fi2].slice(), columns: cols };
            break;
          }
        }
      }
      var beforeRecord = target ? annualFeeSheetRowToObject_(target.row, cols) : null;
      if (request.status === 'WITHDRAW') {
        var withdrawnDate = getAnnualFeeFiscalYearPreviousEndDate_(request.year);
        var withdrawalProcessDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
        updateMember_({
          id: request.memberId,
          status: 'WITHDRAWN',
          withdrawnDate: withdrawnDate,
          withdrawalProcessDate: withdrawalProcessDate,
          midYearWithdrawal: false,
        }, {
          skipAdminCheck: true,
          adminSession: { email: actorEmail },
          ss: ss,
          skipCacheClear: true,
        });
        disableAuthAccountsByMemberId_(ss, request.memberId);
        if (target) {
          var withdrawnRow = target.row.slice();
          withdrawnRow[cols['更新日時']] = nowIso;
          withdrawnRow[cols['削除フラグ']] = true;
          updatedSheetRows.push({ rowNumber: target.rowNumber, data: withdrawnRow });
          feeData[target.rowNumber - 2] = withdrawnRow;
        }
        auditRows.push({
          年会費更新履歴ID: Utilities.getUuid(),
          年会費履歴ID: target ? String(target.row[cols['年会費履歴ID']] || '') : '',
          会員ID: request.memberId,
          対象年度: request.year,
          操作種別: 'WITHDRAW',
          更新前JSON: beforeRecord ? JSON.stringify(beforeRecord) : '',
          更新後JSON: JSON.stringify({
            memberStatus: 'WITHDRAWN',
            withdrawnDate: withdrawnDate,
            withdrawalProcessDate: withdrawalProcessDate,
            annualFeeRecordDeleted: !!target,
          }),
          実行者メール: actorEmail,
          実行日時: nowIso,
        });
        withdrawnMemberIds.push(request.memberId);
        continue;
      }
      var recordId = target ? String(target.row[cols['年会費履歴ID']] || '') : Utilities.getUuid();
      var nextRow = target ? target.row.slice() : new Array(Object.keys(cols).length).fill('');
      nextRow[cols['年会費履歴ID']] = recordId;
      nextRow[cols['会員ID']] = request.memberId;
      nextRow[cols['対象年度']] = request.year;
      nextRow[cols['会費納入状態コード']] = request.status;
      nextRow[cols['納入確認日']] = request.status === 'PAID' ? request.confirmedDate : '';
      nextRow[cols['金額']] = resolvedAmount;
      nextRow[cols['備考']] = request.note;
      nextRow[cols['更新日時']] = nowIso;
      nextRow[cols['削除フラグ']] = false;
      if (cols['作成日時'] != null && !target) nextRow[cols['作成日時']] = nowIso;
      if (cols['作成日時'] != null && target && !String(nextRow[cols['作成日時']] || '')) nextRow[cols['作成日時']] = nowIso;
      if (target) {
        updatedSheetRows.push({ rowNumber: target.rowNumber, data: nextRow });
        feeData[target.rowNumber - 2] = nextRow;
      } else {
        appendRows.push(nextRow);
        feeData.push(nextRow);
      }
      var afterRecord = annualFeeSheetRowToObject_(nextRow, cols);
      auditRows.push({
        年会費更新履歴ID: Utilities.getUuid(),
        年会費履歴ID: recordId,
        会員ID: request.memberId,
        対象年度: request.year,
        操作種別: target ? 'UPDATE' : 'CREATE',
        更新前JSON: beforeRecord ? JSON.stringify(beforeRecord) : '',
        更新後JSON: JSON.stringify(afterRecord),
        実行者メール: actorEmail,
        実行日時: nowIso,
      });
      results.push(mapAnnualFeeAdminRecord_(afterRecord, memberRowObj, request.year, amountMap));
    }
    for (var ui = 0; ui < updatedSheetRows.length; ui += 1) {
      var u = updatedSheetRows[ui];
      feeSheet.getRange(u.rowNumber, 1, 1, u.data.length).setValues([u.data]);
    }
    if (appendRows.length > 0) {
      var startRow = feeSheet.getLastRow() + 1;
      feeSheet.getRange(startRow, 1, appendRows.length, appendRows[0].length).setValues(appendRows);
    }
    if (auditRows.length > 0) {
      appendRowsByHeaders_(ss, 'T_年会費更新履歴', auditRows);
    }
    var yearSet = {};
    for (var yi = 0; yi < requests.length; yi += 1) yearSet[requests[yi].year] = true;
    for (var yearKey in yearSet) {
      if (Object.prototype.hasOwnProperty.call(yearSet, yearKey)) clearAnnualFeeAdminCache_(yearKey);
    }
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return { savedRecords: results, withdrawnMemberIds: withdrawnMemberIds };
  } finally {
    lock.releaseLock();
  }
}

function validateAnnualFeePayload_(payload) {
  if (!payload) throw new Error('年会費データが空です。');
  var memberId = String(payload.memberId || '').trim();
  if (!memberId) throw new Error('会員IDが未指定です。');

  var year = Number(payload.year || 0);
  if (!isFinite(year) || year < 2000 || year > 2100) {
    throw new Error('対象年度は 2000〜2100 の範囲で入力してください。');
  }

  var status = String(payload.status || 'UNPAID');
  if (status !== 'PAID' && status !== 'UNPAID') {
    throw new Error('会費納入状態が不正です。');
  }

  var confirmedDate = normalizeDateInput_(payload.confirmedDate);
  if (status === 'PAID' && !confirmedDate) {
    throw new Error('納入済にする場合は納入確認日を入力してください。');
  }

  var note = String(payload.note || '');
  if (note.length > 2000) {
    throw new Error('備考は 2000 文字以内で入力してください。');
  }

  return {
    id: String(payload.id || '').trim(),
    memberId: memberId,
    year: Math.floor(year),
    status: status,
    confirmedDate: confirmedDate,
    note: note,
  };
}

function validateAnnualFeeBatchPayload_(payload) {
  if (!payload) throw new Error('年会費データが空です。');
  var memberId = String(payload.memberId || '').trim();
  if (!memberId) throw new Error('会員IDが未指定です。');

  var year = Number(payload.year || 0);
  if (!isFinite(year) || year < 2000 || year > 2100) {
    throw new Error('対象年度は 2000〜2100 の範囲で入力してください。');
  }

  var status = String(payload.status || 'UNPAID');
  if (status !== 'PAID' && status !== 'UNPAID' && status !== 'WITHDRAW') {
    throw new Error('会費納入状態が不正です。');
  }

  var confirmedDate = normalizeDateInput_(payload.confirmedDate);
  if (status === 'PAID' && !confirmedDate) {
    throw new Error('納入済にする場合は納入確認日を入力してください。');
  }

  var note = String(payload.note || '');
  if (note.length > 2000) {
    throw new Error('備考は 2000 文字以内で入力してください。');
  }

  return {
    id: String(payload.id || '').trim(),
    memberId: memberId,
    year: Math.floor(year),
    status: status,
    confirmedDate: status === 'PAID' ? confirmedDate : '',
    note: note,
  };
}

function buildColumnIndex_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  return cols;
}

function findAnnualFeeRowByMemberYear_(sheet, memberId, year) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['会員ID', '対象年度']);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (String(row[cols['会員ID']] || '') !== String(memberId || '')) continue;
    if (Number(row[cols['対象年度']] || 0) !== Number(year || 0)) continue;
    return {
      rowNumber: i + 2,
      row: row,
      columns: cols,
    };
  }
  return null;
}

function annualFeeSheetRowToObject_(row, cols) {
  return {
    id: String(row[cols['年会費履歴ID']] || ''),
    memberId: String(row[cols['会員ID']] || ''),
    year: Number(row[cols['対象年度']] || 0),
    status: String(row[cols['会費納入状態コード']] || 'UNPAID'),
    confirmedDate: normalizeDateInput_(row[cols['納入確認日']]),
    amount: Number(row[cols['金額']] || 0),
    note: String(row[cols['備考']] || ''),
    updatedAt: String(row[cols['更新日時']] || ''),
  };
}

function annualFeeMemberObject_(row, cols) {
  var obj = {};
  for (var key in cols) {
    if (Object.prototype.hasOwnProperty.call(cols, key)) {
      obj[key] = row[cols[key]];
    }
  }
  return obj;
}

function buildAnnualFeeDisplayName_(memberRow) {
  if (!memberRow) return '(不明)';
  var type = String(memberRow['会員種別コード'] || 'INDIVIDUAL');
  if (type === 'BUSINESS') return String(memberRow['勤務先名'] || '').trim() || String(memberRow['会員ID'] || '');
  var fullName = (String(memberRow['姓'] || '') + ' ' + String(memberRow['名'] || '')).trim();
  return fullName || String(memberRow['会員ID'] || '');
}

function mapAnnualFeeAdminRecord_(rowObj, memberRow, selectedYear, amountMap) {
  var year = Number(selectedYear || rowObj && (rowObj.year || rowObj['対象年度']) || 0);
  var exists = !!rowObj;
  var memberId = exists ? String(rowObj.memberId || rowObj['会員ID'] || '') : String((memberRow && memberRow['会員ID']) || '');
  return {
    id: exists ? String(rowObj.id || rowObj['年会費履歴ID'] || '') : '',
    exists: exists,
    memberId: memberId,
    memberType: String((memberRow && memberRow['会員種別コード']) || 'INDIVIDUAL'),
    displayName: buildAnnualFeeDisplayName_(memberRow),
    year: year,
    status: String((rowObj && (rowObj.status || rowObj['会費納入状態コード'])) || 'UNPAID'),
    confirmedDate: normalizeDateInput_(rowObj && (rowObj.confirmedDate || rowObj['納入確認日'])),
    amount: resolveAnnualFeeAmount_(memberRow, amountMap, rowObj && (rowObj.amount || rowObj['金額'])),
    note: String((rowObj && (rowObj.note || rowObj['備考'])) || ''),
    updatedAt: String((rowObj && (rowObj.updatedAt || rowObj['更新日時'])) || ''),
  };
}

function mapAnnualFeeAuditLog_(rowObj, memberRow, actorNameMap) {
  var email = String(rowObj['実行者メール'] || '').toLowerCase();
  return {
    id: String(rowObj['年会費更新履歴ID'] || ''),
    annualFeeRecordId: String(rowObj['年会費履歴ID'] || ''),
    memberId: String(rowObj['会員ID'] || ''),
    displayName: buildAnnualFeeDisplayName_(memberRow),
    year: Number(rowObj['対象年度'] || 0),
    action: String(rowObj['操作種別'] || 'UPDATE'),
    actorEmail: email,
    actorDisplayName: (actorNameMap && actorNameMap[email]) || '',
    executedAt: String(rowObj['実行日時'] || ''),
    beforeJson: String(rowObj['更新前JSON'] || ''),
    afterJson: String(rowObj['更新後JSON'] || ''),
  };
}

function buildActorDisplayNameMap_(ss, memberMap) {
  var wlRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var result = {};
  for (var i = 0; i < wlRows.length; i += 1) {
    var wl = wlRows[i];
    var email = String(wl['Googleメール'] || '').toLowerCase();
    if (!email) continue;
    var memberId = String(wl['紐付け会員ID'] || '');
    var member = memberId ? memberMap[memberId] : null;
    if (member) {
      var fullName = (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim();
      if (fullName) {
        result[email] = fullName;
        continue;
      }
    }
    result[email] = email;
  }
  return result;
}

function getAnnualFeeAmountMap_(ss) {
  var rows = getRowsAsObjects_(ss, 'M_会員種別');
  var result = {};
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var code = String(row['コード'] || '');
    if (!code) continue;
    result[code] = Number(row['年会費金額'] || 0);
  }
  return result;
}

function resolveAnnualFeeAmount_(memberRow, amountMap, fallbackAmount) {
  var memberType = String((memberRow && memberRow['会員種別コード']) || 'INDIVIDUAL');
  var configured = Number((amountMap && amountMap[memberType]) || 0);
  if (isFinite(configured) && configured > 0) return Math.floor(configured);
  var fallback = Number(fallbackAmount || 0);
  return isFinite(fallback) && fallback > 0 ? Math.floor(fallback) : 0;
}

function getAnnualFeeAdminCacheKey_(year) {
  return 'annualFeeAdminData:' + DB_SCHEMA_VERSION + ':' + String(year || '');
}

function clearAnnualFeeAdminCache_(year) {
  removeChunkedCache_(CacheService.getScriptCache(), getAnnualFeeAdminCacheKey_(year));
}

function getSystemSettingValue_(ss, key) {
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) return '';
  var found = findRowByColumnValue_(sheet, '設定キー', key);
  if (!found) return '';
  var idx = found.columns['設定値'];
  return idx == null ? '' : String(found.row[idx] || '');
}

function upsertSystemSetting_(ss, key, value, description) {
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) return;
  var found = findRowByColumnValue_(sheet, '設定キー', key);
  var now = new Date().toISOString();
  if (!found) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: key,
      設定値: value,
      説明: description || '',
      更新日時: now,
    }]);
    return;
  }
  var row = found.row.slice();
  if (found.columns['設定値'] != null) row[found.columns['設定値']] = value;
  if (found.columns['説明'] != null) row[found.columns['説明']] = description || '';
  if (found.columns['更新日時'] != null) row[found.columns['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
}

function getAnyPasswordLoginIdByMemberId_(ss, memberId) {
  var rows = getRowsAsObjects_(ss, 'T_認証アカウント');
  for (var i = 0; i < rows.length; i += 1) {
    var r = rows[i];
    if (toBoolean_(r['削除フラグ'])) continue;
    if (String(r['認証方式'] || '') !== 'PASSWORD') continue;
    if (!toBoolean_(r['アカウント有効フラグ'])) continue;
    if (String(r['会員ID'] || '') !== String(memberId || '')) continue;
    var loginId = String(r['ログインID'] || '');
    if (loginId) return loginId;
  }
  return '';
}

function clearUnusedIndividualApplicationAddressDefaults_(payload, memberTypeCode) {
  if (!payload || memberTypeCode !== 'INDIVIDUAL') return payload;

  function trimValue(value) {
    return String(value || '').trim();
  }

  var defaultPostCode = '573-';
  var defaultPrefecture = '大阪府';
  var defaultCity = '枚方市';

  var hasOfficeInput =
    !!trimValue(payload.officeName) ||
    !!trimValue(payload.officeAddressLine) ||
    !!trimValue(payload.phone) ||
    !!trimValue(payload.fax) ||
    (trimValue(payload.officePostCode) && trimValue(payload.officePostCode) !== defaultPostCode) ||
    (trimValue(payload.officePrefecture) && trimValue(payload.officePrefecture) !== defaultPrefecture) ||
    (trimValue(payload.officeCity) && trimValue(payload.officeCity) !== defaultCity);

  var hasHomeInput =
    !!trimValue(payload.homeAddressLine) ||
    !!trimValue(payload.mobilePhone) ||
    (trimValue(payload.homePostCode) && trimValue(payload.homePostCode) !== defaultPostCode) ||
    (trimValue(payload.homePrefecture) && trimValue(payload.homePrefecture) !== defaultPrefecture) ||
    (trimValue(payload.homeCity) && trimValue(payload.homeCity) !== defaultCity);

  if (!hasOfficeInput) {
    payload.officePostCode = '';
    payload.officePrefecture = '';
    payload.officeCity = '';
  }

  if (!hasHomeInput) {
    payload.homePostCode = '';
    payload.homePrefecture = '';
    payload.homeCity = '';
  }

  return payload;
}

// ── 入会処理 ──────────────────────────────────────────
function createMember_(payload) {
  if (!payload) throw new Error('ペイロードが空です。');
  var memberTypeCode = String(payload.type || 'INDIVIDUAL');
  if (['INDIVIDUAL', 'BUSINESS', 'SUPPORT'].indexOf(memberTypeCode) === -1) {
    throw new Error('会員種別が不正です: ' + memberTypeCode);
  }
  payload = clearUnusedIndividualApplicationAddressDefaults_(payload, memberTypeCode);
  validateMemberPayload_(payload, memberTypeCode);

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  // 8桁会員ID生成（UUID先頭8桁の数値化）
  var memberId = payload.id || generateMemberId_();
  // 重複チェック
  if (findRowByColumnValue_(sheet, '会員ID', memberId)) {
    throw new Error('会員ID ' + memberId + ' は既に使用されています。');
  }

  var now = new Date().toISOString();
  var joinedDate = normalizeDateInput_(payload.joinedDate) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var columns = テーブル定義.T_会員;
  var newRow = columns.map(function(col) {
    switch (col) {
      case '会員ID': return memberId;
      case '会員種別コード': return memberTypeCode;
      case '会員状態コード': return 'ACTIVE';
      case '入会日': return joinedDate;
      case '退会日': return '';
      case '姓': return String(payload.lastName || '');
      case '名': return String(payload.firstName || '');
      case 'セイ': return String(payload.lastKana || '');
      case 'メイ': return String(payload.firstKana || '');
      case '代表メールアドレス': return String(payload.email || '');
      case '携帯電話番号': return String(payload.mobilePhone || '');
      case '勤務先名': return String(payload.officeName || '');
      case '勤務先郵便番号': return String(payload.officePostCode || '');
      case '勤務先都道府県': return String(payload.officePrefecture || '');
      case '勤務先市区町村': return String(payload.officeCity || '');
      case '勤務先住所': return String(payload.officeAddressLine || '');
      case '勤務先電話番号': return String(payload.phone || '');
      case '勤務先FAX番号': return String(payload.fax || '');
      case '自宅郵便番号': return String(payload.homePostCode || '');
      case '自宅都道府県': return String(payload.homePrefecture || '');
      case '自宅市区町村': return String(payload.homeCity || '');
      case '自宅住所': return String(payload.homeAddressLine || '');
      case '発送方法コード': return String(payload.mailingPreference || 'EMAIL');
      case '郵送先区分コード': return String(payload.preferredMailDestination || 'OFFICE');
      case '職員数上限': return memberTypeCode === 'BUSINESS' ? (Number(payload.staffLimit) || 10) : '';
      case '作成日時': return now;
      case '更新日時': return now;
      case '削除フラグ': return false;
      case '介護支援専門員番号': return String(payload.careManagerNumber || '');
      case '事業所番号': return String(payload.officeNumber || '');
      default: return '';
    }
  });
  sheet.appendRow(newRow);

  // パスワード認証レコード作成
  var loginId = String(payload.careManagerNumber || '').trim() || memberId;
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (authSheet) {
    var defaultPassword = 'member' + memberId;
    var salt = generateSalt_();
    var hashed = hashPassword_(defaultPassword, salt);
    var authColumns = テーブル定義.T_認証アカウント;
    var authRow = authColumns.map(function(col) {
      switch (col) {
        case '認証ID': return Utilities.getUuid();
        case '認証方式': return 'PASSWORD';
        case 'ログインID': return loginId;
        case 'パスワードハッシュ': return hashed;
        case 'パスワードソルト': return salt;
        case 'GoogleユーザーID': return '';
        case 'Googleメール': return '';
        case 'システムロールコード': return 'MEMBER';
        case '会員ID': return memberId;
        case '職員ID': return '';
        case '最終ログイン日時': return '';
        case 'パスワード更新日時': return now;
        case 'アカウント有効フラグ': return true;
        case 'ログイン失敗回数': return 0;
        case 'ロック状態': return false;
        case '作成日時': return now;
        case '更新日時': return now;
        case '削除フラグ': return false;
        default: return '';
      }
    });
    authSheet.appendRow(authRow);
  }

  // 事業所会員の場合、初期職員レコード作成
  if (memberTypeCode === 'BUSINESS' && payload.staff && payload.staff.length > 0) {
    syncBusinessStaffRows_(ss, memberId, memberTypeCode, payload.staff);
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  return {
    created: true,
    memberId: memberId,
    loginId: loginId,
    defaultPassword: 'member' + memberId,
  };
}

// ── 入会申込処理（統合フォーム用）──────────────────────────
function submitMemberApplication_(payload) {
  if (!payload) throw new Error('ペイロードが空です。');
  var memberTypeCode = String(payload.memberType || '');
  if (['INDIVIDUAL', 'BUSINESS', 'SUPPORT'].indexOf(memberTypeCode) === -1) {
    throw new Error('会員種別が不正です: ' + memberTypeCode);
  }
  payload = clearUnusedIndividualApplicationAddressDefaults_(payload, memberTypeCode);

  var ss = getOrCreateDatabase_();
  var now = new Date().toISOString();
  var joinedDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var memberId = generateMemberId_();

  // 重複チェック
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  if (findRowByColumnValue_(memberSheet, '会員ID', memberId)) {
    memberId = generateMemberId_(); // retry once
  }

  // T_会員 レコード作成
  var memberColumns = テーブル定義.T_会員;
  var isBusiness = memberTypeCode === 'BUSINESS';
  var newMemberRow = memberColumns.map(function(col) {
    switch (col) {
      case '会員ID': return memberId;
      case '会員種別コード': return memberTypeCode;
      case '会員状態コード': return 'ACTIVE';
      case '入会日': return joinedDate;
      case '退会日': return '';
      case '姓': return isBusiness ? '' : String(payload.lastName || '');
      case '名': return isBusiness ? '' : String(payload.firstName || '');
      case 'セイ': return isBusiness ? '' : String(payload.lastKana || '');
      case 'メイ': return isBusiness ? '' : String(payload.firstKana || '');
      case '代表メールアドレス': return isBusiness ? '' : String(payload.email || '');
      case '携帯電話番号': return String(payload.mobilePhone || '');
      case '勤務先名': return String(payload.officeName || '');
      case '勤務先郵便番号': return String(payload.officePostCode || '');
      case '勤務先都道府県': return String(payload.officePrefecture || '');
      case '勤務先市区町村': return String(payload.officeCity || '');
      case '勤務先住所': return String(payload.officeAddressLine || '');
      case '勤務先電話番号': return String(payload.phone || '');
      case '勤務先FAX番号': return String(payload.fax || '');
      case '自宅郵便番号': return String(payload.homePostCode || '');
      case '自宅都道府県': return String(payload.homePrefecture || '');
      case '自宅市区町村': return String(payload.homeCity || '');
      case '自宅住所': return String(payload.homeAddressLine || '');
      case '発送方法コード': return isBusiness ? '' : String(payload.mailingPreference || 'EMAIL');
      case '郵送先区分コード': return isBusiness ? 'OFFICE' : String(payload.preferredMailDestination || 'OFFICE');
      case '職員数上限': return isBusiness ? 10 : '';
      case '作成日時': return now;
      case '更新日時': return now;
      case '削除フラグ': return false;
      case '介護支援専門員番号': return isBusiness ? '' : String(payload.careManagerNumber || '');
      case '事業所番号': return String(payload.officeNumber || '');
      default: return '';
    }
  });
  memberSheet.appendRow(newMemberRow);

  var result = {
    created: true,
    memberId: memberId,
    loginId: null,
    staffCredentials: null,
    emailsSent: 0,
  };

  if (isBusiness) {
    // 事業所会員: 職員ごとに認証レコード作成 + メール送信
    var staffList = Array.isArray(payload.staff) ? payload.staff : [];
    if (staffList.length === 0) throw new Error('事業所会員は最低1名の職員が必要です。');

    var repCount = 0;
    for (var r = 0; r < staffList.length; r++) {
      if (String(staffList[r].role || '') === 'REPRESENTATIVE') repCount++;
    }
    if (repCount === 0) throw new Error('代表者は必ず1名登録してください。');
    if (repCount > 1) throw new Error('代表者は1名のみです。');

    var staffCredentials = [];
    var staffSheet = ss.getSheetByName('T_事業所職員');
    var authSheet = ss.getSheetByName('T_認証アカウント');

    for (var i = 0; i < staffList.length; i++) {
      var s = staffList[i];
      var staffId = Utilities.getUuid().substring(0, 8);
      var staffName = joinHumanNameParts_(s.lastName, s.firstName);
      var staffKana = joinHumanNameParts_(s.lastKana, s.firstKana);
      var cmNumber = String(s.careManagerNumber || '').trim();
      var staffEmail = String(s.email || '').trim();
      var staffRole = String(s.role || 'STAFF');
      if (['REPRESENTATIVE', 'ADMIN', 'STAFF'].indexOf(staffRole) === -1) staffRole = 'STAFF';

      if (!cmNumber) throw new Error('職員 ' + (i + 1) + ' の介護支援専門員番号が未入力です。');
      if (!staffEmail) throw new Error('職員 ' + (i + 1) + ' のメールアドレスが未入力です。');

      // T_事業所職員に挿入
      if (staffSheet) {
        var staffColumns = テーブル定義.T_事業所職員;
        var staffRow = staffColumns.map(function(col) {
          switch (col) {
            case '職員ID': return staffId;
            case '会員ID': return memberId;
            case '姓': return String(s.lastName || '').trim();
            case '名': return String(s.firstName || '').trim();
            case 'セイ': return String(s.lastKana || '').trim();
            case 'メイ': return String(s.firstKana || '').trim();
            case '氏名': return staffName.trim();
            case 'フリガナ': return staffKana.trim();
            case 'メールアドレス': return staffEmail;
            case '職員権限コード': return staffRole;
            case '職員状態コード': return 'ENROLLED';
            case '入会日': return joinedDate;
            case '退会日': return '';
            case '介護支援専門員番号': return cmNumber;
            case 'メール配信希望コード': return 'YES';
            case '作成日時': return now;
            case '更新日時': return now;
            case '削除フラグ': return false;
            default: return '';
          }
        });
        staffSheet.appendRow(staffRow);
      }

      // T_認証アカウントに挿入（ログインID = 介護支援専門員番号）
      var loginId = cmNumber;
      var defaultPassword = 'member' + cmNumber;
      if (authSheet) {
        var salt = generateSalt_();
        var hashed = hashPassword_(defaultPassword, salt);
        var authColumns = テーブル定義.T_認証アカウント;
        var authRow = authColumns.map(function(col) {
          switch (col) {
            case '認証ID': return Utilities.getUuid();
            case '認証方式': return 'PASSWORD';
            case 'ログインID': return loginId;
            case 'パスワードハッシュ': return hashed;
            case 'パスワードソルト': return salt;
            case 'GoogleユーザーID': return '';
            case 'Googleメール': return '';
            case 'システムロールコード': return 'MEMBER';
            case '会員ID': return memberId;
            case '職員ID': return staffId;
            case '最終ログイン日時': return '';
            case 'パスワード更新日時': return now;
            case 'アカウント有効フラグ': return true;
            case 'ログイン失敗回数': return 0;
            case 'ロック状態': return false;
            case '作成日時': return now;
            case '更新日時': return now;
            case '削除フラグ': return false;
            default: return '';
          }
        });
        authSheet.appendRow(authRow);
      }

      // メール送信
      try {
        sendCredentialEmail_(staffEmail, loginId, defaultPassword, staffName.trim());
        result.emailsSent++;
      } catch (e) {
        Logger.log('sendCredentialEmail_ failed for ' + staffEmail + ': ' + e.message);
      }

      staffCredentials.push({
        name: staffName.trim(),
        loginId: loginId,
        email: staffEmail,
      });
    }
    result.staffCredentials = staffCredentials;

  } else {
    // 個人 / 賛助: 会員単体の認証レコード作成
    var loginId = memberTypeCode === 'INDIVIDUAL'
      ? (String(payload.careManagerNumber || '').trim() || memberId)
      : memberId;
    var defaultPassword = 'member' + loginId;

    var authSheet = ss.getSheetByName('T_認証アカウント');
    if (authSheet) {
      var salt = generateSalt_();
      var hashed = hashPassword_(defaultPassword, salt);
      var authColumns = テーブル定義.T_認証アカウント;
      var authRow = authColumns.map(function(col) {
        switch (col) {
          case '認証ID': return Utilities.getUuid();
          case '認証方式': return 'PASSWORD';
          case 'ログインID': return loginId;
          case 'パスワードハッシュ': return hashed;
          case 'パスワードソルト': return salt;
          case 'GoogleユーザーID': return '';
          case 'Googleメール': return '';
          case 'システムロールコード': return 'MEMBER';
          case '会員ID': return memberId;
          case '職員ID': return '';
          case '最終ログイン日時': return '';
          case 'パスワード更新日時': return now;
          case 'アカウント有効フラグ': return true;
          case 'ログイン失敗回数': return 0;
          case 'ロック状態': return false;
          case '作成日時': return now;
          case '更新日時': return now;
          case '削除フラグ': return false;
          default: return '';
        }
      });
      authSheet.appendRow(authRow);
    }

    result.loginId = loginId;

    // メール送信
    var email = String(payload.email || '').trim();
    if (email) {
      try {
        var memberName = String(payload.lastName || '') + ' ' + String(payload.firstName || '');
        sendCredentialEmail_(email, loginId, defaultPassword, memberName.trim());
        result.emailsSent++;
      } catch (e) {
        Logger.log('sendCredentialEmail_ failed for ' + email + ': ' + e.message);
      }
    }
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  return result;
}

// ── ログイン情報メール送信 ──────────────────────────────────
function sendCredentialEmail_(toEmail, loginId, password, memberName) {
  var memberUrl = 'https://script.google.com/macros/s/AKfycbycE2_ythCYSPwmPxvyfRzNLhWM7J1cX41TA2wjYgZgdI-P2uknYfQGh3AHrecCQ1Gk/exec';
  var subject = '【枚方市介護支援専門員連絡協議会】会員登録完了のお知らせ';
  var body = memberName + ' 様\n\n'
    + '会員登録が完了しました。\n'
    + '以下のログイン情報で会員マイページにアクセスできます。\n\n'
    + 'ログインID: ' + loginId + '\n'
    + '初期パスワード: ' + password + '\n\n'
    + '会員マイページURL:\n' + memberUrl + '\n\n'
    + '初回ログイン後、パスワードの変更をお勧めします。\n\n'
    + '※このメールに心当たりがない場合は、お手数ですが削除してください。\n'
    + '─────────────────────────────\n'
    + '枚方市介護支援専門員連絡協議会\n';
  MailApp.sendEmail(toEmail, subject, body);
}

function generateMemberId_() {
  var uuid = Utilities.getUuid().replace(/-/g, '');
  var hash = 0;
  for (var i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash + uuid.charCodeAt(i)) >>> 0;
  }
  return String(hash % 100000000).padStart(8, '0');
}

// ── 退会処理 ──────────────────────────────────────────
function withdrawMember_(payload) {
  if (!payload || !payload.memberId) throw new Error('会員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.memberId));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  var currentStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (currentStatus === 'WITHDRAWN') throw new Error('この会員は既に退会済みです。');

  var withdrawnDate = normalizeDateInput_(payload.withdrawnDate) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  row[cols['会員状態コード']] = 'WITHDRAWN';
  row[cols['退会日']] = withdrawnDate;
  var midYear = payload.midYearWithdrawal === true;
  row[cols['削除フラグ']] = midYear;
  row[cols['更新日時']] = new Date().toISOString();

  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // v125: 退会時に関連する T_認証アカウント の有効フラグも false にする
  disableAuthAccountsByMemberId_(ss, String(payload.memberId));

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return { withdrawn: true, memberId: String(payload.memberId), withdrawnDate: withdrawnDate };
}

// ── 事業所職員の除籍処理 ──────────────────────────────────────
// T_事業所職員の状態を LEFT に変更し、T_認証アカウントの有効フラグを false にする
function removeStaffFromOffice_(payload) {
  if (!payload || !payload.memberId || !payload.staffId) {
    throw new Error('会員IDまたは職員IDが未指定です。');
  }
  var ss = getOrCreateDatabase_();
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');

  var staffFound = findRowByColumnValue_(staffSheet, '職員ID', String(payload.staffId));
  if (!staffFound) throw new Error('対象職員が見つかりません。');

  var sCols = staffFound.columns;
  var sRow = staffFound.row.slice();

  // 所属事業所の一致確認
  if (String(sRow[sCols['会員ID']] || '') !== String(payload.memberId)) {
    throw new Error('職員IDと会員IDが一致しません。');
  }

  // 既に除籍済みチェック
  if (String(sRow[sCols['職員状態コード']] || '') === 'LEFT') {
    throw new Error('この職員は既に除籍済みです。');
  }

  // 代表者は除籍不可（先に代表者変更が必要）
  if (String(sRow[sCols['職員権限コード']] || '') === 'REPRESENTATIVE') {
    throw new Error('代表者は除籍できません。先に代表者を変更してください。');
  }

  var nowIso = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  sRow[sCols['職員状態コード']] = 'LEFT';
  sRow[sCols['退会日']] = today;
  sRow[sCols['職員権限コード']] = 'STAFF';
  sRow[sCols['更新日時']] = nowIso;
  staffSheet.getRange(staffFound.rowNumber, 1, 1, sRow.length).setValues([sRow]);

  // T_認証アカウントの有効フラグを false にする
  disableAuthAccountsByStaffId_(ss, String(payload.staffId));

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return {
    removed: true,
    memberId: String(payload.memberId),
    staffId: String(payload.staffId),
    withdrawnDate: today,
  };
}

// ── 会員IDに紐づく全認証アカウントの有効フラグを false にする ──
function disableAuthAccountsByMemberId_(ss, memberId) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return;
  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['会員ID'] == null || cols['アカウント有効フラグ'] == null) return;

  var data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['会員ID']] || '') === memberId) {
      data[r][cols['アカウント有効フラグ']] = false;
      data[r][cols['更新日時']] = new Date().toISOString();
      authSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }
}

// ── 職員IDに紐づく認証アカウントの有効フラグを false にする ──
function disableAuthAccountsByStaffId_(ss, staffId) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return;
  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['職員ID'] == null || cols['アカウント有効フラグ'] == null) return;

  var data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['職員ID']] || '') === staffId) {
      data[r][cols['アカウント有効フラグ']] = false;
      data[r][cols['更新日時']] = new Date().toISOString();
      authSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }
}

// ── v127: 職員IDに紐づく認証アカウントの有効フラグを true に復旧する ──
function enableAuthAccountsByStaffId_(ss, staffId) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return;
  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['職員ID'] == null || cols['アカウント有効フラグ'] == null) return;

  var data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['職員ID']] || '') === staffId) {
      data[r][cols['アカウント有効フラグ']] = true;
      data[r][cols['更新日時']] = new Date().toISOString();
      authSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }
}

// ── v126: 事業所会員の予約退会（Scheduled Cancellation）──
// 翌年度4/1に退会を予約する。退会日まではサービス完全利用可能。
function scheduleWithdrawMember_(payload) {
  if (!payload || !payload.memberId) throw new Error('会員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.memberId));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  var currentStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (currentStatus === 'WITHDRAWN') throw new Error('この会員は既に退会済みです。');
  if (currentStatus === 'WITHDRAWAL_SCHEDULED') throw new Error('この会員は既に退会予定です。');

  // 翌年度4/1を算出
  var nextFyStart = getNextFiscalYearStart_(new Date());
  var withdrawnDate = Utilities.formatDate(nextFyStart, 'Asia/Tokyo', 'yyyy-MM-dd');

  row[cols['会員状態コード']] = 'WITHDRAWAL_SCHEDULED';
  row[cols['退会日']] = withdrawnDate;
  row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // 注: アカウントは無効化しない（退会日まで利用可能）
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return {
    scheduled: true,
    memberId: String(payload.memberId),
    withdrawnDate: withdrawnDate,
  };
}

// ── v126: 予約退会のキャンセル ──
function cancelScheduledWithdraw_(payload) {
  if (!payload || !payload.memberId) throw new Error('会員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.memberId));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  var currentStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (currentStatus !== 'WITHDRAWAL_SCHEDULED') throw new Error('この会員は退会予定ではありません。');

  row[cols['会員状態コード']] = 'ACTIVE';
  row[cols['退会日']] = '';
  row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return { cancelled: true, memberId: String(payload.memberId) };
}

// ── v127: 職員個別更新（status/role 変更対応拡張）──
function updateStaff_(payload) {
  if (!payload || !payload.staffId) throw new Error('職員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');

  var found = findRowByColumnValue_(staffSheet, '職員ID', String(payload.staffId));
  if (!found) throw new Error('対象職員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  // 所属事業所の一致確認（セキュリティ）
  var memberId = String(row[cols['会員ID']] || '');
  if (payload.memberId && memberId !== String(payload.memberId)) {
    throw new Error('職員IDと会員IDが一致しません。');
  }

  // 更新可能フィールド（Allowlist）
  var nowIso = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  // v147: 除籍済み職員は氏名・フリガナ必須チェックをスキップ
  var staffCurrentStatus = String(row[cols['職員状態コード']] || 'ENROLLED');
  var hasStaffNamePayload =
    payload.name != null ||
    payload.kana != null ||
    payload.lastName != null ||
    payload.firstName != null ||
    payload.lastKana != null ||
    payload.firstKana != null;
  if (hasStaffNamePayload) {
    var normalizedStaffNames = normalizeStaffNameFields_({
      姓: payload.lastName != null ? payload.lastName : (cols['姓'] != null ? row[cols['姓']] : ''),
      名: payload.firstName != null ? payload.firstName : (cols['名'] != null ? row[cols['名']] : ''),
      セイ: payload.lastKana != null ? payload.lastKana : (cols['セイ'] != null ? row[cols['セイ']] : ''),
      メイ: payload.firstKana != null ? payload.firstKana : (cols['メイ'] != null ? row[cols['メイ']] : ''),
      氏名: payload.name != null ? payload.name : row[cols['氏名']],
      フリガナ: payload.kana != null ? payload.kana : row[cols['フリガナ']],
    });
    if (staffCurrentStatus !== 'LEFT') {
      if (!normalizedStaffNames.name) throw new Error('職員氏名は必須です。');
      if (!normalizedStaffNames.kana) throw new Error('職員フリガナは必須です。');
    }
    if (cols['姓'] != null) row[cols['姓']] = normalizedStaffNames.lastName;
    if (cols['名'] != null) row[cols['名']] = normalizedStaffNames.firstName;
    if (cols['セイ'] != null) row[cols['セイ']] = normalizedStaffNames.lastKana;
    if (cols['メイ'] != null) row[cols['メイ']] = normalizedStaffNames.firstKana;
    row[cols['氏名']] = normalizedStaffNames.name;
    row[cols['フリガナ']] = normalizedStaffNames.kana;
  }
  if (payload.email != null) {
    row[cols['メールアドレス']] = String(payload.email).trim();
  }
  if (payload.careManagerNumber != null) {
    row[cols['介護支援専門員番号']] = String(payload.careManagerNumber).trim();
  }

  // ── role 変更 ──
  var currentRole = String(row[cols['職員権限コード']] || 'STAFF');
  if (payload.role != null) {
    var newRole = normalizeBusinessStaffRole_(payload.role);
    if (newRole !== currentRole) {
      var allStaff = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues();
      // REPRESENTATIVE から降格する場合: 同事業所に他の ENROLLED 職員が必要
      if (currentRole === 'REPRESENTATIVE' && newRole !== 'REPRESENTATIVE') {
        var enrolledOthers = allStaff.filter(function(r) {
          return String(r[cols['会員ID']] || '') === memberId
            && String(r[cols['職員ID']] || '') !== String(payload.staffId)
            && String(r[cols['職員状態コード']] || '') === 'ENROLLED';
        });
        if (enrolledOthers.length === 0) {
          throw new Error('在籍職員が自分のみのため、代表者の権限変更はできません。個人会員への転換をご利用ください。');
        }
      }
      // REPRESENTATIVE に昇格する場合: 旧代表者を自動で ADMIN に降格
      if (newRole === 'REPRESENTATIVE' && currentRole !== 'REPRESENTATIVE') {
        for (var ri = 0; ri < allStaff.length; ri++) {
          var sr = allStaff[ri];
          if (String(sr[cols['会員ID']] || '') === memberId
            && String(sr[cols['職員ID']] || '') !== String(payload.staffId)
            && String(sr[cols['職員状態コード']] || '') === 'ENROLLED'
            && normalizeBusinessStaffRole_(sr[cols['職員権限コード']]) === 'REPRESENTATIVE') {
            sr[cols['職員権限コード']] = 'ADMIN';
            sr[cols['更新日時']] = new Date().toISOString();
            staffSheet.getRange(ri + 2, 1, 1, sr.length).setValues([sr]);
          }
        }
      }
      row[cols['職員権限コード']] = newRole;
    }
  }

  // ── status 変更（v127 追加）──
  var currentStatus = String(row[cols['職員状態コード']] || 'ENROLLED');
  var statusChanged = false;
  if (payload.status != null) {
    var newStatus = String(payload.status).trim();
    if (['ENROLLED', 'LEFT'].indexOf(newStatus) === -1) {
      throw new Error('職員状態は ENROLLED または LEFT のみ指定可能です。');
    }
    if (newStatus !== currentStatus) {
      row[cols['職員状態コード']] = newStatus;
      statusChanged = true;
      if (newStatus === 'LEFT') {
        row[cols['退会日']] = today;
        // v146: 除籍処分 → 権限を強制的にSTAFFに降格（OWASP A01 最小権限原則）
        var roleAtExpulsion = String(row[cols['職員権限コード']] || 'STAFF');
        if (roleAtExpulsion !== 'STAFF') {
          if (roleAtExpulsion === 'REPRESENTATIVE') {
            var allStaffForDemotion = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues();
            var enrolledOthersForDemotion = allStaffForDemotion.filter(function(r) {
              return String(r[cols['会員ID']] || '') === memberId
                && String(r[cols['職員ID']] || '') !== String(payload.staffId)
                && String(r[cols['職員状態コード']] || '') === 'ENROLLED';
            });
            if (enrolledOthersForDemotion.length === 0) {
              throw new Error('在籍職員が自分のみのため、除籍できません。個人会員への転換をご利用ください。');
            }
          }
          row[cols['職員権限コード']] = 'STAFF';
        }
      } else {
        // ENROLLED に復帰 → 退会日クリア
        row[cols['退会日']] = '';
      }
    }
  }

  if (payload.joinedDate != null) {
    var normalized = normalizeDateInput_(payload.joinedDate);
    if (normalized) row[cols['入会日']] = normalized;
  }
  if (payload.mailingPreference != null && cols['メール配信希望コード'] != null) {
    var mp = String(payload.mailingPreference).trim();
    row[cols['メール配信希望コード']] = (mp === 'NO') ? 'NO' : 'YES';
  }
  row[cols['更新日時']] = nowIso;
  staffSheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // ── status 変更時の認証アカウント連動 ──
  if (statusChanged) {
    var newStatus2 = String(row[cols['職員状態コード']]);
    if (newStatus2 === 'LEFT') {
      disableAuthAccountsByStaffId_(ss, String(payload.staffId));
    } else {
      enableAuthAccountsByStaffId_(ss, String(payload.staffId));
    }
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return {
    updated: true,
    staffId: String(payload.staffId),
    memberId: memberId,
    status: String(row[cols['職員状態コード']] || ''),
    role: String(row[cols['職員権限コード']] || ''),
  };
}

// ── v126: 翌年度の4月1日を返す ──
function getNextFiscalYearStart_(referenceDate) {
  var fyStart = getFiscalYearStart_(referenceDate);
  return new Date(fyStart.getFullYear() + 1, 3, 1, 0, 0, 0, 0);
}

// ── v125: 会員種別変更（個人↔事業所メンバーのシームレス転換）──
function convertMemberType_(payload) {
  if (!payload || !payload.direction) throw new Error('direction が未指定です。');
  var direction = String(payload.direction);

  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (direction === 'STAFF_TO_INDIVIDUAL') {
      return convertStaffToIndividual_(ss, payload);
    } else if (direction === 'INDIVIDUAL_TO_STAFF') {
      return convertIndividualToStaff_(ss, payload);
    } else {
      throw new Error('不明な direction: ' + direction);
    }
  } finally {
    lock.releaseLock();
  }
}

function convertStaffToIndividual_(ss, payload) {
  var sourceMemberId = String(payload.sourceMemberId || '');
  var sourceStaffId = String(payload.sourceStaffId || '');
  if (!sourceMemberId || !sourceStaffId) throw new Error('sourceMemberId / sourceStaffId は必須です。');

  // 1. 事業所の存在確認
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  var officeFound = findRowByColumnValue_(memberSheet, '会員ID', sourceMemberId);
  if (!officeFound) throw new Error('事業所 ' + sourceMemberId + ' が見つかりません。');
  var officeRow = officeFound.row;
  var officeCols = officeFound.columns;
  if (String(officeRow[officeCols['会員種別コード']] || '') !== 'BUSINESS') {
    throw new Error('会員 ' + sourceMemberId + ' は事業所会員ではありません。');
  }

  // 2. 職員の存在確認
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');
  var staffFound = findRowByColumnValue_(staffSheet, '職員ID', sourceStaffId);
  if (!staffFound) throw new Error('職員 ' + sourceStaffId + ' が見つかりません。');
  var sRow = staffFound.row;
  var sCols = staffFound.columns;
  if (String(sRow[sCols['会員ID']] || '') !== sourceMemberId) {
    throw new Error('職員は指定の事業所に所属していません。');
  }

  // 3. 代表者チェック（v127: 最後の1名の場合は事業所自動退会）
  var isRepresentative = String(sRow[sCols['職員権限コード']] || '') === 'REPRESENTATIVE';
  var officeWithdrawn = false;
  if (isRepresentative) {
    // 同事業所の他の ENROLLED 職員を確認
    var allStaffData = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues();
    var enrolledOthers = allStaffData.filter(function(r) {
      return String(r[sCols['会員ID']] || '') === sourceMemberId
        && String(r[sCols['職員ID']] || '') !== sourceStaffId
        && String(r[sCols['職員状態コード']] || '') === 'ENROLLED';
    });

    if (enrolledOthers.length === 0) {
      // 最後の1名 → 事業所を自動退会
      var offRow = officeRow.slice();
      offRow[officeCols['会員状態コード']] = 'WITHDRAWN';
      offRow[officeCols['退会日']] = today;
      offRow[officeCols['更新日時']] = now;
      memberSheet.getRange(officeFound.rowNumber, 1, 1, offRow.length).setValues([offRow]);
      officeWithdrawn = true;
      // newRepresentativeStaffId 不要
    } else {
      // 他に在籍職員がいる → 後任代表者必須
      var newRepStaffId = String(payload.newRepresentativeStaffId || '').trim();
      if (!newRepStaffId) throw new Error('他の在籍職員がいるため、後任代表者の指定が必要です。');
      if (newRepStaffId === sourceStaffId) throw new Error('後任代表者は自分以外を指定してください。');
      var newRepFound = findRowByColumnValue_(staffSheet, '職員ID', newRepStaffId);
      if (!newRepFound) throw new Error('後任代表者 ' + newRepStaffId + ' が見つかりません。');
      if (String(newRepFound.row[newRepFound.columns['会員ID']] || '') !== sourceMemberId) {
        throw new Error('後任代表者は同じ事業所の職員でなければなりません。');
      }
      if (String(newRepFound.row[newRepFound.columns['職員状態コード']] || '') === 'LEFT') {
        throw new Error('後任代表者は在籍中の職員でなければなりません。');
      }
      // 後任を REPRESENTATIVE に昇格
      var nrRow = newRepFound.row.slice();
      nrRow[newRepFound.columns['職員権限コード']] = 'REPRESENTATIVE';
      nrRow[newRepFound.columns['更新日時']] = new Date().toISOString();
      staffSheet.getRange(newRepFound.rowNumber, 1, 1, nrRow.length).setValues([nrRow]);
    }
  }

  // 4. 職員情報を取得（氏名を分割）
  var staffNameFields = normalizeStaffNameFields_({
    姓: sCols['姓'] != null ? sRow[sCols['姓']] : '',
    名: sCols['名'] != null ? sRow[sCols['名']] : '',
    セイ: sCols['セイ'] != null ? sRow[sCols['セイ']] : '',
    メイ: sCols['メイ'] != null ? sRow[sCols['メイ']] : '',
    氏名: sRow[sCols['氏名']],
    フリガナ: sRow[sCols['フリガナ']],
  });
  var staffName = staffNameFields.name;
  var staffKana = staffNameFields.kana;
  var staffEmail = String(sRow[sCols['メールアドレス'] || ''] || '');
  var staffCareNum = String(sRow[sCols['介護支援専門員番号']] || '');
  var lastName = staffNameFields.lastName;
  var firstName = staffNameFields.firstName;
  var lastKana = staffNameFields.lastKana;
  var firstKana = staffNameFields.firstKana;

  // 5. 新しい個人会員レコード作成
  var newMemberId = generateMemberId_();
  while (findRowByColumnValue_(memberSheet, '会員ID', newMemberId)) {
    newMemberId = generateMemberId_();
  }
  var now = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var columns = テーブル定義.T_会員;
  var newRow = columns.map(function(col) {
    switch (col) {
      case '会員ID': return newMemberId;
      case '会員種別コード': return 'INDIVIDUAL';
      case '会員状態コード': return 'ACTIVE';
      case '入会日': return today;
      case '退会日': return '';
      case '姓': return lastName;
      case '名': return firstName;
      case 'セイ': return lastKana;
      case 'メイ': return firstKana;
      case '代表メールアドレス': return staffEmail;
      case '介護支援専門員番号': return staffCareNum;
      case '作成日時': return now;
      case '更新日時': return now;
      case '削除フラグ': return false;
      default: return '';
    }
  });
  memberSheet.appendRow(newRow);

  // 6. T_事業所職員を LEFT + 削除フラグ
  var updStaffRow = sRow.slice();
  updStaffRow[sCols['職員状態コード']] = 'LEFT';
  updStaffRow[sCols['退会日']] = today;
  updStaffRow[sCols['削除フラグ']] = true;
  updStaffRow[sCols['更新日時']] = now;
  staffSheet.getRange(staffFound.rowNumber, 1, 1, updStaffRow.length).setValues([updStaffRow]);

  // 7. T_認証アカウント: 会員ID→新ID, 職員ID→クリア, 有効フラグ=true
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (authSheet && authSheet.getLastRow() >= 2) {
    var aHeaders = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    var aCols = {};
    for (var ai = 0; ai < aHeaders.length; ai++) aCols[aHeaders[ai]] = ai;
    var aData = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
    for (var ar = 0; ar < aData.length; ar++) {
      if (String(aData[ar][aCols['職員ID']] || '') === sourceStaffId) {
        aData[ar][aCols['会員ID']] = newMemberId;
        aData[ar][aCols['職員ID']] = '';
        aData[ar][aCols['システムロールコード']] = 'INDIVIDUAL_MEMBER';
        aData[ar][aCols['アカウント有効フラグ']] = true;
        aData[ar][aCols['更新日時']] = now;
        authSheet.getRange(ar + 2, 1, 1, aData[ar].length).setValues([aData[ar]]);
      }
    }
  }

  // 8. T_研修申込: 該当職員の申込を新会員IDに更新
  migrateTrainingApplications_(ss, sourceMemberId, sourceStaffId, newMemberId, '');

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    converted: true,
    direction: 'STAFF_TO_INDIVIDUAL',
    newMemberId: newMemberId,
    sourceStaffId: sourceStaffId,
    officeWithdrawn: officeWithdrawn,
  };
}

function convertIndividualToStaff_(ss, payload) {
  var sourceMemberId = String(payload.sourceMemberId || '');
  var targetOfficeMemberId = String(payload.targetOfficeMemberId || '');
  var staffRole = String(payload.staffRole || 'STAFF');
  if (!sourceMemberId) throw new Error('sourceMemberId は必須です。');
  if (!targetOfficeMemberId) throw new Error('targetOfficeMemberId は必須です。');
  if (['ADMIN', 'STAFF'].indexOf(staffRole) === -1) staffRole = 'STAFF';

  // 1. 個人会員の存在確認
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  var srcFound = findRowByColumnValue_(memberSheet, '会員ID', sourceMemberId);
  if (!srcFound) throw new Error('会員 ' + sourceMemberId + ' が見つかりません。');
  var srcRow = srcFound.row;
  var srcCols = srcFound.columns;
  var srcType = String(srcRow[srcCols['会員種別コード']] || '');
  if (srcType !== 'INDIVIDUAL' && srcType !== 'SUPPORT') {
    throw new Error('事業所会員を別の事業所に転籍する機能は未対応です。');
  }

  // 2. 転籍先事業所の存在確認
  var officeFound = findRowByColumnValue_(memberSheet, '会員ID', targetOfficeMemberId);
  if (!officeFound) throw new Error('事業所 ' + targetOfficeMemberId + ' が見つかりません。');
  if (String(officeFound.row[officeFound.columns['会員種別コード']] || '') !== 'BUSINESS') {
    throw new Error('転籍先 ' + targetOfficeMemberId + ' は事業所会員ではありません。');
  }
  if (String(officeFound.row[officeFound.columns['会員状態コード']] || '') === 'WITHDRAWN') {
    throw new Error('転籍先の事業所は退会済みです。');
  }

  // 3. 事業所の職員数上限チェック
  var currentStaff = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === targetOfficeMemberId
      && String(r['職員状態コード'] || '') === 'ENROLLED';
  });
  var staffLimit = Number(officeFound.row[officeFound.columns['職員数上限']] || 50);
  if (currentStaff.length >= staffLimit) {
    throw new Error('転籍先の事業所は職員数上限（' + staffLimit + '名）に達しています。');
  }

  // 4. 新しい職員レコード作成
  var newStaffId = 'S' + Date.now();
  var now = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var staffName = (String(srcRow[srcCols['姓']] || '') + ' ' + String(srcRow[srcCols['名']] || '')).trim();
  var staffKana = (String(srcRow[srcCols['セイ']] || '') + ' ' + String(srcRow[srcCols['メイ']] || '')).trim();
  var staffEmail = String(srcRow[srcCols['代表メールアドレス']] || '');
  var staffCareNum = String(srcRow[srcCols['介護支援専門員番号']] || '');

  appendRowsByHeaders_(ss, 'T_事業所職員', [{
    職員ID: newStaffId,
    会員ID: targetOfficeMemberId,
    姓: String(srcRow[srcCols['姓']] || ''),
    名: String(srcRow[srcCols['名']] || ''),
    セイ: String(srcRow[srcCols['セイ']] || ''),
    メイ: String(srcRow[srcCols['メイ']] || ''),
    氏名: staffName,
    フリガナ: staffKana,
    メールアドレス: staffEmail,
    職員権限コード: staffRole,
    職員状態コード: 'ENROLLED',
    入会日: today,
    退会日: '',
    介護支援専門員番号: staffCareNum,
    メール配信希望コード: 'YES',
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  }]);

  // 5. T_認証アカウント: 会員ID→事業所ID, 職員ID→新ID, 有効フラグ=true
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (authSheet && authSheet.getLastRow() >= 2) {
    var aHeaders = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    var aCols = {};
    for (var ai = 0; ai < aHeaders.length; ai++) aCols[aHeaders[ai]] = ai;
    var aData = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
    for (var ar = 0; ar < aData.length; ar++) {
      var aAuthMemberId = String(aData[ar][aCols['会員ID']] || '').trim();
      var aAuthStaffId = String(aData[ar][aCols['職員ID']] || '').trim();
      if (aAuthMemberId === sourceMemberId && !aAuthStaffId) {
        aData[ar][aCols['会員ID']] = targetOfficeMemberId;
        aData[ar][aCols['職員ID']] = newStaffId;
        aData[ar][aCols['システムロールコード']] = staffRole === 'ADMIN' ? 'BUSINESS_ADMIN' : 'BUSINESS_MEMBER';
        aData[ar][aCols['アカウント有効フラグ']] = true;
        aData[ar][aCols['更新日時']] = now;
        authSheet.getRange(ar + 2, 1, 1, aData[ar].length).setValues([aData[ar]]);
      }
    }
  }

  // 6. 元の個人会員を退会
  var updSrcRow = srcRow.slice();
  updSrcRow[srcCols['会員状態コード']] = 'WITHDRAWN';
  updSrcRow[srcCols['退会日']] = today;
  updSrcRow[srcCols['更新日時']] = now;
  memberSheet.getRange(srcFound.rowNumber, 1, 1, updSrcRow.length).setValues([updSrcRow]);

  // 7. T_研修申込: 会員ID→事業所ID, 職員ID→新ID
  migrateTrainingApplications_(ss, sourceMemberId, '', targetOfficeMemberId, newStaffId);

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    converted: true,
    direction: 'INDIVIDUAL_TO_STAFF',
    newStaffId: newStaffId,
    targetOfficeMemberId: targetOfficeMemberId,
    sourceMemberId: sourceMemberId,
  };
}

// ── 研修申込の会員ID/職員IDを移行する ──
function migrateTrainingApplications_(ss, oldMemberId, oldStaffId, newMemberId, newStaffId) {
  var appSheet = ss.getSheetByName('T_研修申込');
  if (!appSheet || appSheet.getLastRow() < 2) return;
  var headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['会員ID'] == null) return;

  var data = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  for (var r = 0; r < data.length; r++) {
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
      data[r][cols['会員ID']] = newMemberId;
      if (cols['職員ID'] != null) data[r][cols['職員ID']] = newStaffId;
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      appSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }
}

// ── 会員セルフ退会申請（年度末退会予約）──────────────────────
// パスワード再認証 → 会員状態を WITHDRAWAL_SCHEDULED に変更 → 退会日を年度末(3/31)に設定
// アカウントは無効化しない（年度末までログイン可能）
function withdrawSelf_(payload) {
  if (!payload || !payload.loginId || !payload.password || !payload.memberId) {
    throw new Error('退会申請に必要な情報が不足しています。');
  }

  var loginId = String(payload.loginId).trim();
  var password = String(payload.password);
  var memberId = String(payload.memberId).trim();

  // ── パスワード再認証（changePassword_ と同パターン）──
  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('認証アカウントテーブルが見つかりません。');

  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', loginId);
  if (!authRowInfo) throw new Error('認証情報が見つかりません。');

  var authRow = authRowInfo.row;
  var authCols = authRowInfo.columns;
  var authMemberId = String(authRow[authCols['会員ID']] || '');
  if (authMemberId !== memberId) throw new Error('認証情報と会員IDが一致しません。');

  if (!toBoolean_(authRow[authCols['アカウント有効フラグ']])) throw new Error('アカウントが無効です。');
  if (toBoolean_(authRow[authCols['ロック状態']])) throw new Error('アカウントがロックされています。');

  var storedSalt = String(authRow[authCols['パスワードソルト']] || '');
  var storedHash = String(authRow[authCols['パスワードハッシュ']] || '');
  if (!storedSalt || !storedHash) throw new Error('パスワードが初期化されていません。');

  var inputHash = hashPassword_(password, storedSalt);
  if (inputHash !== storedHash) throw new Error('パスワードが正しくありません。');

  // ── 事業所会員の代表者チェック ──
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');

  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', memberId);
  if (!memberFound) throw new Error('対象会員が見つかりません。');

  var mCols = memberFound.columns;
  var mRow = memberFound.row.slice();
  var memberType = String(mRow[mCols['会員種別コード']] || '');
  var currentStatus = String(mRow[mCols['会員状態コード']] || 'ACTIVE');

  if (currentStatus === 'WITHDRAWN') throw new Error('この会員は既に退会済みです。');
  if (currentStatus === 'WITHDRAWAL_SCHEDULED') throw new Error('既に退会申請済みです。');

  // 事業所会員の場合、代表者のみ退会申請可能
  if (memberType === 'BUSINESS') {
    var staffId = String(authRow[authCols['職員ID']] || '');
    if (staffId) {
      var staffSheet = ss.getSheetByName('T_事業所職員');
      if (staffSheet) {
        var staffFound = findRowByColumnValue_(staffSheet, '職員ID', staffId);
        if (staffFound) {
          var staffRole = String(staffFound.row[staffFound.columns['職員権限コード']] || '');
          if (staffRole !== 'REPRESENTATIVE') {
            throw new Error('事業所の退会申請は代表者のみ実行できます。');
          }
        }
      }
    }
  }

  // ── 年度末日を計算（日本会計年度: 4月〜3月）──
  var now = new Date();
  var jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  var year = jstNow.getFullYear();
  var month = jstNow.getMonth() + 1; // 1-12
  var fiscalYearEndYear = month >= 4 ? year + 1 : year;
  var withdrawnDate = fiscalYearEndYear + '-03-31';

  // ── T_会員 更新 ──
  mRow[mCols['会員状態コード']] = 'WITHDRAWAL_SCHEDULED';
  mRow[mCols['退会日']] = withdrawnDate;
  mRow[mCols['更新日時']] = new Date().toISOString();

  memberSheet.getRange(memberFound.rowNumber, 1, 1, mRow.length).setValues([mRow]);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    scheduled: true,
    memberId: memberId,
    withdrawnDate: withdrawnDate,
  };
}

// ── 退会申請取り消し（年度末前のセルフ取り消し）──────────────
// パスワード再認証 → WITHDRAWAL_SCHEDULED を ACTIVE に戻す → 退会日クリア
function cancelWithdrawalSelf_(payload) {
  if (!payload || !payload.loginId || !payload.password || !payload.memberId) {
    throw new Error('取り消しに必要な情報が不足しています。');
  }

  var loginId = String(payload.loginId).trim();
  var password = String(payload.password);
  var memberId = String(payload.memberId).trim();

  // ── パスワード再認証 ──
  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('認証アカウントテーブルが見つかりません。');

  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', loginId);
  if (!authRowInfo) throw new Error('認証情報が見つかりません。');

  var authRow = authRowInfo.row;
  var authCols = authRowInfo.columns;
  var authMemberId = String(authRow[authCols['会員ID']] || '');
  if (authMemberId !== memberId) throw new Error('認証情報と会員IDが一致しません。');

  if (!toBoolean_(authRow[authCols['アカウント有効フラグ']])) throw new Error('アカウントが無効です。');
  if (toBoolean_(authRow[authCols['ロック状態']])) throw new Error('アカウントがロックされています。');

  var storedSalt = String(authRow[authCols['パスワードソルト']] || '');
  var storedHash = String(authRow[authCols['パスワードハッシュ']] || '');
  if (!storedSalt || !storedHash) throw new Error('パスワードが初期化されていません。');

  var inputHash = hashPassword_(password, storedSalt);
  if (inputHash !== storedHash) throw new Error('パスワードが正しくありません。');

  // ── 会員状態チェック ──
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');

  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', memberId);
  if (!memberFound) throw new Error('対象会員が見つかりません。');

  var mCols = memberFound.columns;
  var mRow = memberFound.row.slice();
  var currentStatus = String(mRow[mCols['会員状態コード']] || 'ACTIVE');

  if (currentStatus !== 'WITHDRAWAL_SCHEDULED') {
    throw new Error('退会申請中ではありません。');
  }

  // ── T_会員 更新（ACTIVE に戻す）──
  mRow[mCols['会員状態コード']] = 'ACTIVE';
  mRow[mCols['退会日']] = '';
  mRow[mCols['更新日時']] = new Date().toISOString();

  memberSheet.getRange(memberFound.rowNumber, 1, 1, mRow.length).setValues([mRow]);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    canceled: true,
    memberId: memberId,
  };
}

// ── 会員セルフサービス更新（OWASP Mass Assignment 対策）──────────────
// 根拠: OWASP Top 10 A01 / ASVS V4.1.2 / CWE-915
// サーバーサイド allowlist でフィールドをフィルタし、管理者専用フィールドへの
// クライアント側からの書き換えを防止する。
var MEMBER_WRITABLE_FIELDS_ = [
  'lastName','firstName','lastKana','firstKana',
  'homePostCode','homePrefecture','homeCity','homeAddressLine','mobilePhone',
  'officePostCode','officePrefecture','officeCity','officeAddressLine','phone','fax',
  'email','mailingPreference','preferredMailDestination',
];
var ADMIN_BATCH_WRITABLE_FIELDS_ = [
  'id',
  'email', 'mailingPreference', 'preferredMailDestination',
  'status', 'joinedDate', 'withdrawnDate',
];
// v143: NIST RBAC — MASTER/ADMIN が会員詳細画面で編集可能なフィールド
// MEMBER_WRITABLE_FIELDS_ の上位互換 + 管理者専用フィールド
var ADMIN_MEMBER_WRITABLE_FIELDS_ = [
  // 会員セルフサービスでも編集可能なフィールド
  'lastName','firstName','lastKana','firstKana',
  'homePostCode','homePrefecture','homeCity','homeAddressLine','mobilePhone',
  'officePostCode','officePrefecture','officeCity','officeAddressLine','phone','fax',
  'email','mailingPreference','preferredMailDestination',
  // 管理者専用フィールド（ADMIN_ONLY_EDIT 層）
  'status','joinedDate','withdrawnDate','withdrawalProcessDate','midYearWithdrawal',
  'careManagerNumber','officeName','officeNumber','staffLimit',
];
// v143: 管理者編集で監査ログ対象となるフィールド（ADMIN_ONLY_EDIT 層）
var ADMIN_AUDIT_FIELDS_ = [
  'status','joinedDate','withdrawnDate','withdrawalProcessDate','midYearWithdrawal',
];
// v106: NIST RBAC — ロール別職員フィールド allowlist
var STAFF_WRITABLE_FIELDS_REPRESENTATIVE_ = ['id','name','kana','email','status','role'];
var STAFF_WRITABLE_FIELDS_ADMIN_ = ['id','name','kana','email','status','role']; // v167: ADMIN can change roles of others (not self, not REPRESENTATIVE)
var STAFF_WRITABLE_FIELDS_SELF_ = ['id','name','kana','email'];

function buildSelfServiceBusinessStaffSnapshot_(row) {
  row = row || {};
  var lastName = String(row['姓'] || '');
  var firstName = String(row['名'] || '');
  var lastKana = String(row['セイ'] || '');
  var firstKana = String(row['メイ'] || '');
  return {
    id: String(row['職員ID'] || ''),
    lastName: lastName,
    firstName: firstName,
    lastKana: lastKana,
    firstKana: firstKana,
    name: String(row['氏名'] || [lastName, firstName].join(' ').trim() || ''),
    kana: String(row['フリガナ'] || [lastKana, firstKana].join(' ').trim() || ''),
    email: String(row['メールアドレス'] || ''),
    role: String(row['職員権限コード'] || 'STAFF'),
    status: String(row['職員状態コード'] || 'ENROLLED'),
    joinedDate: normalizeDateInput_(row['入会日']),
    withdrawnDate: normalizeDateInput_(row['退会日'])
  };
}

function mergeSelfServiceBusinessStaffPayload_(base, incoming, allowedFields) {
  var result = {};
  var source = incoming || {};
  for (var key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      result[key] = base[key];
    }
  }
  for (var i = 0; i < allowedFields.length; i += 1) {
    var field = allowedFields[i];
    if (field === 'id') continue;
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
  }
  return result;
}

function sanitizeAdminBatchMemberPayload_(payload) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var sanitized = { id: String(payload.id) };
  for (var i = 0; i < ADMIN_BATCH_WRITABLE_FIELDS_.length; i += 1) {
    var key = ADMIN_BATCH_WRITABLE_FIELDS_[i];
    if (key !== 'id' && Object.prototype.hasOwnProperty.call(payload, key)) {
      sanitized[key] = payload[key];
    }
  }
  return sanitized;
}

// v143: 管理者会員詳細編集用サニタイズ — ADMIN_MEMBER_WRITABLE_FIELDS_ でフィルタ
function sanitizeAdminMemberPayload_(payload) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var sanitized = { id: String(payload.id), type: payload.type };
  var hasOwn = Object.prototype.hasOwnProperty;
  for (var i = 0; i < ADMIN_MEMBER_WRITABLE_FIELDS_.length; i += 1) {
    var key = ADMIN_MEMBER_WRITABLE_FIELDS_[i];
    if (hasOwn.call(payload, key)) {
      sanitized[key] = payload[key];
    }
  }
  // staff 配列はそのまま透過（syncBusinessStaffRows_ が処理）
  if (hasOwn.call(payload, 'staff')) {
    sanitized.staff = payload.staff;
  }
  return sanitized;
}

// v143: 監査ログ追記 — ADMIN_AUDIT_FIELDS_ の変更を T_監査ログ に記録
function appendAdminAuditLog_(ss, adminEmail, memberId, changes) {
  if (!changes || changes.length === 0) return;
  var sheet = ss.getSheetByName('T_監査ログ');
  if (!sheet) return; // スキーマ未反映時はサイレントスキップ
  var now = new Date().toISOString();
  for (var i = 0; i < changes.length; i++) {
    var c = changes[i];
    sheet.appendRow([
      Utilities.getUuid(),   // 監査ログID
      now,                   // 操作日時
      adminEmail || '',      // 操作者メール
      'ADMIN_EDIT',          // 操作種別
      'T_会員',              // 対象テーブル
      String(memberId),      // 対象レコードID
      c.field,               // フィールド名
      String(c.oldValue),    // 旧値
      String(c.newValue),    // 新値
    ]);
  }
}

function updateMembersBatch_(payload) {
  if (!payload || !Array.isArray(payload.records) || payload.records.length === 0) {
    throw new Error('保存対象の会員データがありません。');
  }
  if (payload.records.length > 100) {
    throw new Error('会員一括編集は最大100件までです。');
  }

  var adminSession = checkAdminBySession_();
  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var results = [];
    for (var i = 0; i < payload.records.length; i += 1) {
      var sanitized = sanitizeAdminBatchMemberPayload_(payload.records[i]);
      results.push(updateMember_(sanitized, {
        skipAdminCheck: true,
        adminSession: adminSession,
        ss: ss,
        skipCacheClear: true,
      }));
    }
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return results;
  } finally {
    lock.releaseLock();
  }
}

// ── v125: フラット人物リスト取得（個人会員+事業所職員を混合） ──
function getAdminPersonList_() {
  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });

  // 事業所名のルックアップ（会員ID→事業所名）
  var officeNameByMemberId = {};
  for (var mi = 0; mi < memberRows.length; mi++) {
    var m = memberRows[mi];
    if (String(m['会員種別コード'] || '') === 'BUSINESS') {
      officeNameByMemberId[String(m['会員ID'] || '')] = String(m['勤務先名'] || '');
    }
  }

  // 認証アカウントの有効フラグルックアップ
  // 個人会員: 会員IDで引く（職員ID空）、職員: 職員IDで引く
  var authByMemberId = {};
  var authByStaffId = {};
  for (var ai = 0; ai < authRows.length; ai++) {
    var auth = authRows[ai];
    var aStaffId = String(auth['職員ID'] || '').trim();
    var aMemberId = String(auth['会員ID'] || '').trim();
    if (aStaffId) {
      authByStaffId[aStaffId] = toBoolean_(auth['アカウント有効フラグ']);
    } else if (aMemberId) {
      authByMemberId[aMemberId] = toBoolean_(auth['アカウント有効フラグ']);
    }
  }

  var persons = [];

  // 個人会員・賛助会員
  for (var i = 0; i < memberRows.length; i++) {
    var member = memberRows[i];
    var memberType = String(member['会員種別コード'] || 'INDIVIDUAL');
    if (memberType === 'BUSINESS') continue; // 事業所エンティティ自体はスキップ
    var memberId = String(member['会員ID'] || '');
    persons.push({
      personKey: memberId,
      personType: memberType === 'SUPPORT' ? 'SUPPORT' : 'INDIVIDUAL',
      displayName: (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim() || memberId,
      kana: (String(member['セイ'] || '') + ' ' + String(member['メイ'] || '')).trim(),
      email: String(member['代表メールアドレス'] || ''),
      officeName: String(member['勤務先名'] || ''),
      memberId: memberId,
      staffId: null,
      status: String(member['会員状態コード'] || 'ACTIVE'),
      joinedDate: normalizeDateInput_(member['入会日']),
      withdrawnDate: normalizeDateInput_(member['退会日']),
      mailingPreference: String(member['発送方法コード'] || 'EMAIL'),
      preferredMailDestination: String(member['郵送先区分コード'] || 'OFFICE'),
      staffRole: null,
      careManagerNumber: String(member['介護支援専門員番号'] || ''),
      accountEnabled: authByMemberId[memberId] !== undefined ? authByMemberId[memberId] : true,
    });
  }

  // 事業所職員
  for (var j = 0; j < staffRows.length; j++) {
    var staff = staffRows[j];
    var staffMemberId = String(staff['会員ID'] || '');
    var staffId = String(staff['職員ID'] || '');
    persons.push({
      personKey: staffMemberId + ':' + staffId,
      personType: 'OFFICE_STAFF',
      displayName: String(staff['氏名'] || ''),
      kana: String(staff['フリガナ'] || ''),
      email: String(staff['メールアドレス'] || ''),
      officeName: officeNameByMemberId[staffMemberId] || '',
      memberId: staffMemberId,
      staffId: staffId,
      status: String(staff['職員状態コード'] || 'ENROLLED'),
      joinedDate: normalizeDateInput_(staff['入会日']),
      withdrawnDate: normalizeDateInput_(staff['退会日']),
      mailingPreference: String(staff['メール配信希望コード'] || 'YES'),
      preferredMailDestination: '',
      staffRole: String(staff['職員権限コード'] || 'STAFF'),
      careManagerNumber: String(staff['介護支援専門員番号'] || ''),
      accountEnabled: authByStaffId[staffId] !== undefined ? authByStaffId[staffId] : true,
    });
  }

  persons.sort(function(a, b) {
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  });

  return { persons: persons };
}

// ── v125: フラット人物の一括更新 ──
var ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_ = [
  'email', 'mailingPreference', 'preferredMailDestination',
  'status', 'joinedDate', 'withdrawnDate',
];
var ADMIN_BATCH_PERSON_WRITABLE_STAFF_ = [
  'email', 'status', 'joinedDate', 'withdrawnDate',
];

function updatePersonsBatch_(payload) {
  if (!payload || !Array.isArray(payload.records) || payload.records.length === 0) {
    throw new Error('保存対象のデータがありません。');
  }
  if (payload.records.length > 100) {
    throw new Error('一括編集は最大100件までです。');
  }

  var adminSession = checkAdminBySession_();
  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var results = [];
    for (var i = 0; i < payload.records.length; i++) {
      var rec = payload.records[i];
      if (!rec || !rec.personKey || !rec.personType) {
        throw new Error('レコード ' + (i + 1) + ': personKey または personType が未指定です。');
      }
      var personType = String(rec.personType);

      if (personType === 'INDIVIDUAL' || personType === 'SUPPORT') {
        // T_会員 を更新
        var memberSanitized = { id: String(rec.memberId || rec.personKey) };
        for (var mi = 0; mi < ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_.length; mi++) {
          var mk = ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_[mi];
          if (Object.prototype.hasOwnProperty.call(rec, mk)) {
            memberSanitized[mk] = rec[mk];
          }
        }
        results.push(updateMember_(memberSanitized, {
          skipAdminCheck: true,
          adminSession: adminSession,
          ss: ss,
          skipCacheClear: true,
        }));

        // status を WITHDRAWN にした場合、認証アカウントも無効化
        if (String(rec.status) === 'WITHDRAWN') {
          disableAuthAccountsByMemberId_(ss, memberSanitized.id);
        }

      } else if (personType === 'OFFICE_STAFF') {
        // T_事業所職員 を更新
        var staffId = String(rec.staffId || '');
        if (!staffId) throw new Error('レコード ' + (i + 1) + ': staffId が未指定です。');

        var staffSheet = ss.getSheetByName('T_事業所職員');
        if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');
        var staffFound = findRowByColumnValue_(staffSheet, '職員ID', staffId);
        if (!staffFound) throw new Error('レコード ' + (i + 1) + ': 職員ID ' + staffId + ' が見つかりません。');

        var sCols = staffFound.columns;
        var sRow = staffFound.row.slice();
        var nowIso = new Date().toISOString();

        // Allowlist でフィルタして更新
        for (var si = 0; si < ADMIN_BATCH_PERSON_WRITABLE_STAFF_.length; si++) {
          var sk = ADMIN_BATCH_PERSON_WRITABLE_STAFF_[si];
          if (!Object.prototype.hasOwnProperty.call(rec, sk)) continue;

          if (sk === 'email' && sCols['メールアドレス'] != null) {
            sRow[sCols['メールアドレス']] = String(rec.email || '');
          } else if (sk === 'status' && sCols['職員状態コード'] != null) {
            var newStatus = String(rec.status || 'ENROLLED');
            if (newStatus !== 'ENROLLED' && newStatus !== 'LEFT') newStatus = 'ENROLLED';
            sRow[sCols['職員状態コード']] = newStatus;
            // LEFT にした場合は退会日を自動セット + 認証アカウント無効化
            if (newStatus === 'LEFT') {
              if (!normalizeDateInput_(sRow[sCols['退会日']])) {
                sRow[sCols['退会日']] = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
              }
              disableAuthAccountsByStaffId_(ss, staffId);
            }
          } else if (sk === 'joinedDate' && sCols['入会日'] != null) {
            sRow[sCols['入会日']] = normalizeDateInput_(rec.joinedDate) || '';
          } else if (sk === 'withdrawnDate' && sCols['退会日'] != null) {
            sRow[sCols['退会日']] = normalizeDateInput_(rec.withdrawnDate) || '';
          }
        }

        sRow[sCols['更新日時']] = nowIso;
        staffSheet.getRange(staffFound.rowNumber, 1, 1, sRow.length).setValues([sRow]);
        results.push({ updated: true, staffId: staffId });

      } else {
        throw new Error('レコード ' + (i + 1) + ': 不明な personType: ' + personType);
      }
    }

    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return results;
  } finally {
    lock.releaseLock();
  }
}

function updateMemberSelf_(payload) {
  if (!payload || !payload.loginId) throw new Error('認証情報が不足しています。');
  if (!payload.id) throw new Error('会員IDが未指定です。');

  // 1. loginId → 会員ID の照合（なりすまし防止）+ 職員ロール判定
  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('認証テーブルが見つかりません。');
  var authRow = findRowByColumnValue_(authSheet, 'ログインID', String(payload.loginId).trim());
  if (!authRow) throw new Error('認証情報が不正です。');
  var authMemberId = String(authRow.row[authRow.columns['会員ID']] || '');
  if (authMemberId !== String(payload.id)) {
    throw new Error('他の会員のデータは更新できません。');
  }

  // v106: 呼び出し元の職員ロールを判定（NIST RBAC）
  var callerStaffId = String(authRow.row[authRow.columns['職員ID']] || '').trim();
  var callerStaffRole = '';
  if (callerStaffId) {
    var staffSheet = ss.getSheetByName('T_事業所職員');
    if (staffSheet) {
      var staffFound = findRowByColumnValue_(staffSheet, '職員ID', callerStaffId);
      if (staffFound) {
        callerStaffRole = String(staffFound.row[staffFound.columns['職員権限コード']] || 'STAFF');
      }
    }
  }

  // 2. payload をサーバーサイド allowlist でフィルタ
  var sanitized = { id: payload.id, type: payload.type };

  // v106: STAFF ロールは会員基本情報・事業所情報を変更不可
  if (callerStaffRole !== 'STAFF') {
    for (var i = 0; i < MEMBER_WRITABLE_FIELDS_.length; i++) {
      var key = MEMBER_WRITABLE_FIELDS_[i];
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        sanitized[key] = payload[key];
      }
    }
  }

  // 3. 職員データをロール別に制御しつつ、送信されなかった既存行は保持する
  if (Object.prototype.hasOwnProperty.call(payload, 'staff') && Array.isArray(payload.staff)) {
    var currentStaffRows = getBusinessStaffRowsByMember_(ss, String(payload.id || ''));
    var currentStaffById = {};
    for (var csr = 0; csr < currentStaffRows.length; csr += 1) {
      var currentStaffRow = currentStaffRows[csr] || {};
      var currentStaffRowId = String(currentStaffRow['職員ID'] || '').trim();
      if (!currentStaffRowId) continue;
      currentStaffById[currentStaffRowId] = buildSelfServiceBusinessStaffSnapshot_(currentStaffRow);
    }

    var submittedStaff = payload.staff.map(function(s) {
      return {
        id: String(s.id || ''),
        lastName: String(s.lastName || ''),
        firstName: String(s.firstName || ''),
        lastKana: String(s.lastKana || ''),
        firstKana: String(s.firstKana || ''),
        name: String(s.name || ''),
        kana: String(s.kana || ''),
        email: String(s.email || ''),
        role: String(s.role || ''),
        status: String(s.status || ''),
      };
    });

    var normalizedStaff = [];

    if (callerStaffRole === 'STAFF') {
      if (!currentStaffById[callerStaffId]) {
        throw new Error('自身の職員データが見つかりません。');
      }
      var ownSubmittedStaff = null;
      for (var ssi = 0; ssi < submittedStaff.length; ssi += 1) {
        if (submittedStaff[ssi].id === callerStaffId) {
          ownSubmittedStaff = submittedStaff[ssi];
          break;
        }
      }
      if (!ownSubmittedStaff) {
        throw new Error('他の職員のデータは更新できません。');
      }
      for (var currentStaffId in currentStaffById) {
        if (!Object.prototype.hasOwnProperty.call(currentStaffById, currentStaffId)) continue;
        var currentSnapshot = currentStaffById[currentStaffId];
        if (currentStaffId === callerStaffId) {
          normalizedStaff.push(mergeSelfServiceBusinessStaffPayload_(currentSnapshot, ownSubmittedStaff, STAFF_WRITABLE_FIELDS_SELF_));
        } else {
          normalizedStaff.push(currentSnapshot);
        }
      }
    } else if (callerStaffRole === 'ADMIN' || callerStaffRole === 'REPRESENTATIVE') {
      for (var submittedIndex = 0; submittedIndex < submittedStaff.length; submittedIndex += 1) {
        var submitted = submittedStaff[submittedIndex];
        if (!submitted.id) continue;
        var currentSnapshotById = currentStaffById[submitted.id] || null;
        var currentRole = currentSnapshotById ? normalizeBusinessStaffRole_(currentSnapshotById.role) : '';

        if (callerStaffRole === 'ADMIN' && currentRole === 'REPRESENTATIVE') {
          normalizedStaff.push(currentSnapshotById);
          continue;
        }

        if (callerStaffRole === 'REPRESENTATIVE' && submitted.id === callerStaffId) {
          normalizedStaff.push(mergeSelfServiceBusinessStaffPayload_(
            currentSnapshotById || submitted,
            submitted,
            STAFF_WRITABLE_FIELDS_SELF_
          ));
          continue;
        }

        if (callerStaffRole === 'ADMIN' && submitted.id === callerStaffId) {
          normalizedStaff.push(mergeSelfServiceBusinessStaffPayload_(
            currentSnapshotById || submitted,
            submitted,
            ['id','name','kana','email','status']
          ));
          continue;
        }

        normalizedStaff.push(submitted);
      }

      for (var existingStaffId in currentStaffById) {
        if (!Object.prototype.hasOwnProperty.call(currentStaffById, existingStaffId)) continue;
        var alreadyIncluded = false;
        for (var ni = 0; ni < normalizedStaff.length; ni += 1) {
          if (normalizedStaff[ni].id === existingStaffId) {
            alreadyIncluded = true;
            break;
          }
        }
        if (!alreadyIncluded) {
          normalizedStaff.push(currentStaffById[existingStaffId]);
        }
      }
    }

    if (normalizedStaff.length > 0) {
      sanitized.staff = normalizedStaff;
    }
  }

  // 4. 既存の updateMember_ に委譲（skipAdminCheck=true）
  return updateMember_(sanitized, {
    skipAdminCheck: true,
    ss: ss,
    adminSession: callerStaffId ? {
      staffId: callerStaffId,
      roleCode: callerStaffRole
    } : null
  });
}

function updateMember_(payload, options) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var skipAdminCheck = false;
  var adminSession = null;
  var ss = null;
  var skipCacheClear = false;
  if (typeof options === 'boolean') {
    skipAdminCheck = options;
  } else if (options && typeof options === 'object') {
    skipAdminCheck = options.skipAdminCheck === true;
    adminSession = options.adminSession || null;
    ss = options.ss || null;
    skipCacheClear = options.skipCacheClear === true;
  }
  if (!adminSession && !skipAdminCheck) {
    adminSession = checkAdminBySession_();
  }
  if (!ss) {
    ss = getOrCreateDatabase_();
  }
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.id));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();
  requireColumns_(cols, [
    '会員状態コード', '入会日', '退会日', '削除フラグ',
    '姓', '名', 'セイ', 'メイ',
    '勤務先名', '勤務先郵便番号', '勤務先都道府県', '勤務先市区町村', '勤務先住所',
    '勤務先電話番号', '勤務先FAX番号',
    '自宅郵便番号', '自宅都道府県', '自宅市区町村', '自宅住所',
    '携帯電話番号', '介護支援専門員番号'
  ]);

  var memberTypeCode = String(row[cols['会員種別コード']] || payload.type || 'INDIVIDUAL');
  var hasOwn = Object.prototype.hasOwnProperty;
  // v147: 退会済み事業所会員は代表者バリデーションをスキップ（代表者なしでも情報更新可能）
  var currentMemberStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (memberTypeCode === 'BUSINESS' && currentMemberStatus !== 'WITHDRAWN' && Object.prototype.hasOwnProperty.call(payload, 'staff')) {
    validateBusinessStaffRoleTransition_(ss, String(payload.id), payload.staff, adminSession);
  }
  function fromPayloadOrCurrent(key, currentValue) {
    return hasOwn.call(payload, key) ? payload[key] : currentValue;
  }
  function getCol(name) {
    var idx = cols[name];
    return idx != null ? row[idx] : '';
  }
  var loginIdFallback = String(fromPayloadOrCurrent('loginId', getAnyPasswordLoginIdByMemberId_(ss, String(payload.id))) || '');
  var careManagerFallback = String(getCol('介護支援専門員番号') || loginIdFallback || '');
  var mergedPayload = {
    id: String(payload.id),
    type: memberTypeCode,
    lastName: fromPayloadOrCurrent('lastName', String(getCol('姓') || '')),
    firstName: fromPayloadOrCurrent('firstName', String(getCol('名') || '')),
    lastKana: fromPayloadOrCurrent('lastKana', String(getCol('セイ') || '')),
    firstKana: fromPayloadOrCurrent('firstKana', String(getCol('メイ') || '')),
    careManagerNumber: fromPayloadOrCurrent('careManagerNumber', careManagerFallback),
    email: fromPayloadOrCurrent('email', String(getCol('代表メールアドレス') || '')),
    mobilePhone: fromPayloadOrCurrent('mobilePhone', String(getCol('携帯電話番号') || '')),
    officeName: fromPayloadOrCurrent('officeName', String(getCol('勤務先名') || '')),
    officePostCode: fromPayloadOrCurrent('officePostCode', String(getCol('勤務先郵便番号') || '')),
    officePrefecture: fromPayloadOrCurrent('officePrefecture', String(getCol('勤務先都道府県') || '')),
    officeCity: fromPayloadOrCurrent('officeCity', String(getCol('勤務先市区町村') || '')),
    officeAddressLine: fromPayloadOrCurrent('officeAddressLine', String(getCol('勤務先住所') || '')),
    phone: fromPayloadOrCurrent('phone', String(getCol('勤務先電話番号') || '')),
    fax: fromPayloadOrCurrent('fax', String(getCol('勤務先FAX番号') || '')),
    homePostCode: fromPayloadOrCurrent('homePostCode', String(getCol('自宅郵便番号') || '')),
    homePrefecture: fromPayloadOrCurrent('homePrefecture', String(getCol('自宅都道府県') || '')),
    homeCity: fromPayloadOrCurrent('homeCity', String(getCol('自宅市区町村') || '')),
    homeAddressLine: fromPayloadOrCurrent('homeAddressLine', String(getCol('自宅住所') || '')),
    mailingPreference: fromPayloadOrCurrent('mailingPreference', String(getCol('発送方法コード') || 'EMAIL')),
    preferredMailDestination: fromPayloadOrCurrent('preferredMailDestination', String(getCol('郵送先区分コード') || 'OFFICE')),
    staffLimit: fromPayloadOrCurrent('staffLimit', getCol('職員数上限')),
    status: fromPayloadOrCurrent('status', String(getCol('会員状態コード') || 'ACTIVE')),
    joinedDate: fromPayloadOrCurrent('joinedDate', String(getCol('入会日') || '')),
    withdrawnDate: fromPayloadOrCurrent('withdrawnDate', String(getCol('退会日') || '')),
    withdrawalProcessDate: fromPayloadOrCurrent('withdrawalProcessDate', String(getCol('退会処理日') || '')),
    midYearWithdrawal: fromPayloadOrCurrent('midYearWithdrawal', false),
  };
  validateMemberPayload_(mergedPayload, memberTypeCode, currentMemberStatus);
  var sharedMobile = memberTypeCode === 'BUSINESS' && !String(mergedPayload.mobilePhone || '').trim()
    ? String(mergedPayload.phone || '')
    : String(mergedPayload.mobilePhone || '');

  // v143: 監査ログ用 — 変更前の値を記録
  var prevStatus = String(getCol('会員状態コード') || 'ACTIVE');
  var prevJoinedDate = String(normalizeDateInput_(getCol('入会日')) || '');
  var prevWithdrawnDate = String(normalizeDateInput_(getCol('退会日')) || '');
  var prevWithdrawalProcessDate = String(normalizeDateInput_(getCol('退会処理日')) || '');

  function setCol(name, value) {
    var idx = cols[name];
    if (idx != null) row[idx] = value !== undefined ? value : '';
  }

  setCol('姓', mergedPayload.lastName || '');
  setCol('名', mergedPayload.firstName || '');
  setCol('セイ', mergedPayload.lastKana || '');
  setCol('メイ', mergedPayload.firstKana || '');
  // v143: MASTER/ADMIN は全有効ステータスへ遷移可能（復旧・強制退会を含む）
  var rawStatus = String(mergedPayload.status || 'ACTIVE');
  var VALID_MEMBER_STATUSES = ['ACTIVE', 'WITHDRAWAL_SCHEDULED', 'WITHDRAWN'];
  if (VALID_MEMBER_STATUSES.indexOf(rawStatus) === -1) {
    throw new Error('無効な会員状態コードです: ' + rawStatus);
  }
  var nextStatus = rawStatus;
  setCol('会員状態コード', nextStatus);
  setCol('入会日', normalizeDateInput_(mergedPayload.joinedDate));
  setCol('退会日', normalizeDateInput_(mergedPayload.withdrawnDate));
  // v143: 退会処理日の保存
  if (cols['退会処理日'] != null) {
    setCol('退会処理日', normalizeDateInput_(mergedPayload.withdrawalProcessDate));
  }
  var immediateDelete = nextStatus === 'WITHDRAWN' &&
    (mergedPayload.midYearWithdrawal === true || String(mergedPayload.midYearWithdrawal || '').toLowerCase() === 'true');
  setCol('削除フラグ', immediateDelete);
  setCol('介護支援専門員番号', mergedPayload.careManagerNumber || '');
  setCol('代表メールアドレス', mergedPayload.email || '');
  setCol('携帯電話番号', sharedMobile);
  setCol('勤務先名', mergedPayload.officeName || '');
  setCol('勤務先郵便番号', mergedPayload.officePostCode || '');
  setCol('勤務先都道府県', mergedPayload.officePrefecture || '');
  setCol('勤務先市区町村', mergedPayload.officeCity || '');
  setCol('勤務先住所', mergedPayload.officeAddressLine || '');
  setCol('勤務先電話番号', mergedPayload.phone || '');
  setCol('勤務先FAX番号', mergedPayload.fax || '');
  setCol('自宅郵便番号', mergedPayload.homePostCode || '');
  setCol('自宅都道府県', mergedPayload.homePrefecture || '');
  setCol('自宅市区町村', mergedPayload.homeCity || '');
  setCol('自宅住所', mergedPayload.homeAddressLine || '');
  setCol('発送方法コード', mergedPayload.mailingPreference || 'EMAIL');
  setCol('郵送先区分コード', mergedPayload.preferredMailDestination || 'OFFICE');
  if (cols['職員数上限'] != null) {
    var n = Number(mergedPayload.staffLimit);
    setCol('職員数上限', isFinite(n) && n >= 1 ? Math.floor(n) : '');
  }
  // v131: 事業所会員は姓/名/セイ/メイ/介護支援専門員番号/発送方法/郵送先区分をブランク強制
  if (memberTypeCode === 'BUSINESS') {
    setCol('姓', '');
    setCol('名', '');
    setCol('セイ', '');
    setCol('メイ', '');
    setCol('介護支援専門員番号', '');
    setCol('発送方法コード', '');
    setCol('郵送先区分コード', '');
  }
  setCol('更新日時', new Date().toISOString());
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  if (hasOwn.call(payload, 'staff')) {
    syncBusinessStaffRows_(ss, String(payload.id), memberTypeCode, payload.staff || []);
  }

  // v143: 管理者操作の監査ログ出力
  var effectiveAdminSession = adminSession || (payload.__adminSession || null);
  if (effectiveAdminSession && effectiveAdminSession.email) {
    var auditChanges = [];
    var newJoinedDate = String(normalizeDateInput_(mergedPayload.joinedDate) || '');
    var newWithdrawnDate = String(normalizeDateInput_(mergedPayload.withdrawnDate) || '');
    var newWithdrawalProcessDate = String(normalizeDateInput_(mergedPayload.withdrawalProcessDate) || '');
    if (nextStatus !== prevStatus) {
      auditChanges.push({ field: '会員状態コード', oldValue: prevStatus, newValue: nextStatus });
    }
    if (newJoinedDate !== prevJoinedDate) {
      auditChanges.push({ field: '入会日', oldValue: prevJoinedDate, newValue: newJoinedDate });
    }
    if (newWithdrawnDate !== prevWithdrawnDate) {
      auditChanges.push({ field: '退会日', oldValue: prevWithdrawnDate, newValue: newWithdrawnDate });
    }
    if (newWithdrawalProcessDate !== prevWithdrawalProcessDate) {
      auditChanges.push({ field: '退会処理日', oldValue: prevWithdrawalProcessDate, newValue: newWithdrawalProcessDate });
    }
    appendAdminAuditLog_(ss, effectiveAdminSession.email, payload.id, auditChanges);
  }

  if (!skipCacheClear) {
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
  }
  return { updated: true, memberId: String(payload.id) };
}

function validateMemberPayload_(payload, memberTypeCode, currentMemberStatus) {
  function trim(v) { return String(v || '').trim(); }
  function toDate(v) {
    var text = trim(v);
    if (!text) return null;
    var parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  var isBusiness = memberTypeCode === 'BUSINESS';
  var isSupport = memberTypeCode === 'SUPPORT';
  // v147: 退会済み会員は必須フィールドチェックをスキップ（全会員種別共通）
  var isWithdrawn = String(payload.status || currentMemberStatus || 'ACTIVE') === 'WITHDRAWN';

  // 事業所会員は姓/名/セイ/メイ/介護支援専門員番号をブランク運用（v131）
  if (!isBusiness && !isWithdrawn) {
    if (!trim(payload.lastName)) throw new Error('姓は必須です。');
    if (!trim(payload.firstName)) throw new Error('名は必須です。');
    if (!trim(payload.lastKana)) throw new Error('セイは必須です。');
    if (!trim(payload.firstKana)) throw new Error('メイは必須です。');
    if (!isSupport && !trim(payload.careManagerNumber)) throw new Error('賛助会員以外は介護支援専門員番号が必須です。');
  }

  if (!isWithdrawn) {
    if (isBusiness) {
      if (!trim(payload.mobilePhone) && !trim(payload.phone)) {
        throw new Error('電話番号（または事業所電話番号）が必須です。');
      }
    } else {
      if (!trim(payload.mobilePhone)) throw new Error('電話番号は必須です。');
    }
  }

  var hasOfficeAffiliationInput =
    !!trim(payload.officeName) ||
    !!trim(payload.officePostCode) ||
    !!trim(payload.officePrefecture) ||
    !!trim(payload.officeCity) ||
    !!trim(payload.officeAddressLine) ||
    !!trim(payload.phone) ||
    !!trim(payload.fax);
  var requireOfficeInfo = !isWithdrawn && (isBusiness || hasOfficeAffiliationInput);
  var requireHomeInfo = !isWithdrawn && !isBusiness;

  if (requireOfficeInfo) {
    if (!trim(payload.officeName)) throw new Error('事業所情報: 勤務先名は必須です。');
    if (!trim(payload.officePostCode)) throw new Error('事業所情報: 郵便番号は必須です。');
    if (!trim(payload.officePrefecture)) throw new Error('事業所情報: 都道府県は必須です。');
    if (!trim(payload.officeCity)) throw new Error('事業所情報: 市区町村は必須です。');
    if (!trim(payload.officeAddressLine)) throw new Error('事業所情報: 住所は必須です。');
    if (!trim(payload.phone)) throw new Error('事業所情報: 電話番号は必須です。');
    if (!trim(payload.fax)) throw new Error('事業所情報: FAX番号は必須です。');
  }

  if (requireHomeInfo) {
    if (!trim(payload.homePostCode)) throw new Error('個人会員は自宅郵便番号が必須です。');
    if (!trim(payload.homePrefecture)) throw new Error('個人会員は自宅都道府県が必須です。');
    if (!trim(payload.homeCity)) throw new Error('個人会員は自宅市区町村が必須です。');
    if (!trim(payload.homeAddressLine)) throw new Error('個人会員は自宅住所が必須です。');
  }

  // 日付形式と順序チェックはステータスに関係なく維持
  var joined = toDate(payload.joinedDate);
  var withdrawn = toDate(payload.withdrawnDate);
  if (trim(payload.joinedDate) && !joined) throw new Error('入会日は有効な日付で入力してください。');
  if (trim(payload.withdrawnDate) && !withdrawn) throw new Error('退会日は有効な日付で入力してください。');
  if (joined && withdrawn && joined.getTime() > withdrawn.getTime()) {
    throw new Error('退会日は入会日以降で入力してください。');
  }
  var payloadStatus = String(payload.status || 'ACTIVE');
  if ((payloadStatus === 'WITHDRAWN' || payloadStatus === 'WITHDRAWAL_SCHEDULED') && !trim(payload.withdrawnDate)) {
    throw new Error('退会済み・退会予定の会員は退会日の入力が必須です。');
  }
}

function normalizeDateInput_(value) {
  var text = String(value || '').trim();
  if (!text) return '';
  var parsed = new Date(text);
  if (isNaN(parsed.getTime())) return '';
  return Utilities.formatDate(parsed, 'Asia/Tokyo', 'yyyy-MM-dd');
}

function shouldAutoDeleteOnNextApril_(withdrawnDateRaw, referenceDate) {
  var normalized = normalizeDateInput_(withdrawnDateRaw);
  if (!normalized) return false;
  var parsed = new Date(normalized + 'T00:00:00+09:00');
  if (isNaN(parsed.getTime())) return false;
  var threshold = new Date(parsed.getFullYear() + 1, 3, 1, 0, 0, 0, 0); // next year 4/1
  return referenceDate.getTime() >= threshold.getTime();
}

// v106: 年度開始日ユーティリティ（日本の会計年度: 4月1日〜翌年3月31日）
function getFiscalYearStart_(referenceDate) {
  var d = referenceDate || new Date();
  var year = d.getFullYear();
  var month = d.getMonth(); // 0-based: 0=Jan, 3=Apr
  // 1〜3月は前年度
  if (month < 3) year -= 1;
  return new Date(year, 3, 1, 0, 0, 0, 0); // 4月1日 00:00:00
}

function normalizeBusinessStaffRole_(value) {
  var role = String(value || 'STAFF');
  return ['REPRESENTATIVE', 'ADMIN', 'STAFF'].indexOf(role) !== -1 ? role : 'STAFF';
}

function getBusinessStaffRowsByMember_(ss, memberId) {
  return getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['会員ID'] || '') === String(memberId || '');
  });
}

function validateBusinessStaffRoleTransition_(ss, memberId, staffPayloadList, adminSession) {
  var actorStaffId = String((adminSession && adminSession.staffId) || '').trim();
  var actorRoleCode = String((adminSession && adminSession.roleCode) || '');
  var currentRows = getBusinessStaffRowsByMember_(ss, String(memberId || ''));

  var currentRolesById = {};
  var currentStatusById = {};
  var currentRepIds = {};
  var actorStaffRole = '';

  for (var i = 0; i < currentRows.length; i += 1) {
    var row = currentRows[i];
    var staffId = String(row['職員ID'] || '');
    if (!staffId) continue;
    var role = normalizeBusinessStaffRole_(row['職員権限コード']);
    var status = String(row['職員状態コード'] || 'ENROLLED');
    currentRolesById[staffId] = role;
    currentStatusById[staffId] = status;
    if (status !== 'LEFT' && role === 'REPRESENTATIVE') {
      currentRepIds[staffId] = true;
    }
    if (actorStaffId && actorStaffId === staffId) {
      actorStaffRole = role;
    }
  }

  // システム管理権限（MASTER/ADMIN）は事業所内の職員ロールに関係なく全操作可能
  var adminPermLevel = adminSession ? String(adminSession.adminPermissionLevel || '') : '';
  var isSystemAdmin = (adminPermLevel === 'MASTER' || adminPermLevel === 'ADMIN');

  if (!actorStaffRole) {
    actorStaffRole = isSystemAdmin ? 'REPRESENTATIVE' : 'ADMIN';
  }

  var payloadRows = Array.isArray(staffPayloadList) ? staffPayloadList : [];
  var payloadById = {};
  var nextRolesById = {};
  var nextStatusById = {};
  var nextRepIds = {};

  for (var j = 0; j < payloadRows.length; j += 1) {
    var payload = payloadRows[j] || {};
    var staffId = String(payload.id || '').trim();
    if (!staffId) continue;
    payloadById[staffId] = {
      role: normalizeBusinessStaffRole_(payload.role),
      status: String(payload.status || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED',
    };
  }

  for (var existingId in currentRolesById) {
    if (!Object.prototype.hasOwnProperty.call(currentRolesById, existingId)) continue;
    var currentRole = currentRolesById[existingId];
    var currentStatus = currentStatusById[existingId] || 'ENROLLED';
    var nextStatus = currentStatus;
    var nextRole = currentRole;
    if (Object.prototype.hasOwnProperty.call(payloadById, existingId)) {
      nextStatus = payloadById[existingId].status;
      nextRole = payloadById[existingId].role;
    } else {
      nextStatus = 'LEFT';
    }
    nextRolesById[existingId] = nextRole;
    nextStatusById[existingId] = nextStatus;
    if (nextStatus !== 'LEFT' && nextRole === 'REPRESENTATIVE') {
      nextRepIds[existingId] = true;
    }
    if (!isSystemAdmin && actorStaffRole !== 'REPRESENTATIVE') {
      if (currentRole === 'REPRESENTATIVE' && nextRole !== 'REPRESENTATIVE') {
        throw new Error('代表者ロールは代表者または管理者のみ変更できます。');
      }
      if (currentRole !== 'REPRESENTATIVE' && nextRole === 'REPRESENTATIVE') {
        throw new Error('代表者は代表者または管理者のみ登録できます。');
      }
    }
  }

  for (var payloadId in payloadById) {
    if (!Object.prototype.hasOwnProperty.call(payloadById, payloadId)) continue;
    if (Object.prototype.hasOwnProperty.call(currentRolesById, payloadId)) continue;
    var normalizedRole = payloadById[payloadId].role;
    var normalizedStatus = payloadById[payloadId].status;
    nextRolesById[payloadId] = normalizedRole;
    nextStatusById[payloadId] = normalizedStatus;
    if (normalizedStatus !== 'LEFT' && normalizedRole === 'REPRESENTATIVE') {
      nextRepIds[payloadId] = true;
    }
    if (!isSystemAdmin && actorStaffRole !== 'REPRESENTATIVE' && normalizedRole === 'REPRESENTATIVE') {
      throw new Error('代表者は代表者または管理者のみ登録できます。');
    }
  }

  var repCount = 0;
  var activeRepCount = 0;
  for (var finalId in nextRepIds) {
    if (Object.prototype.hasOwnProperty.call(nextRepIds, finalId)) {
      repCount += 1;
    }
  }
  if (repCount === 0) {
    throw new Error('代表者は必ず1名登録してください。');
  }
  if (repCount > 1) {
    throw new Error('代表者は1名のみ登録できます。');
  }

  for (var activeRoleId in nextRolesById) {
    if (!Object.prototype.hasOwnProperty.call(nextRolesById, activeRoleId)) continue;
    if ((nextStatusById[activeRoleId] || 'ENROLLED') === 'LEFT') continue;
    if (nextRolesById[activeRoleId] === 'REPRESENTATIVE') {
      activeRepCount += 1;
    }
  }
  if (activeRepCount === 0) {
    throw new Error('代表者は必ず1名登録してください。');
  }
  if (activeRepCount > 1) {
    throw new Error('代表者は1名のみ登録できます。');
  }
}

function applyWithdrawalDeletionPolicy_() {
  var ss = getOrCreateDatabase_();
  var now = new Date();

  // ── Phase 1: 退会予定 → 退会確定（退会日を過ぎた WITHDRAWAL_SCHEDULED を WITHDRAWN に）──
  promoteScheduledWithdrawals_(ss, now);

  // ── Phase 2: 退会済みの削除フラグ付与（既存ロジック）──
  markAutoDeletedRows_(ss, 'T_会員', '会員状態コード', 'WITHDRAWN', '退会日');
  markAutoDeletedRows_(ss, 'T_事業所職員', '職員状態コード', 'LEFT', '退会日');

  function markAutoDeletedRows_(spreadsheet, sheetName, statusCol, withdrawnCode, withdrawnDateCol) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
    if (cols['削除フラグ'] == null || cols[statusCol] == null || cols[withdrawnDateCol] == null) return;

    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var updates = [];
    for (var r = 0; r < rows.length; r += 1) {
      var row = rows[r];
      if (toBoolean_(row[cols['削除フラグ']])) continue;
      if (String(row[cols[statusCol]] || '') !== withdrawnCode) continue;
      if (!shouldAutoDeleteOnNextApril_(row[cols[withdrawnDateCol]], now)) continue;
      row[cols['削除フラグ']] = true;
      if (cols['更新日時'] != null) row[cols['更新日時']] = now.toISOString();
      updates.push({ rowNumber: r + 2, row: row });
    }
    for (var u = 0; u < updates.length; u += 1) {
      sheet.getRange(updates[u].rowNumber, 1, 1, updates[u].row.length).setValues([updates[u].row]);
    }
  }
}

// 退会予定日を過ぎた WITHDRAWAL_SCHEDULED を WITHDRAWN に昇格 + 認証アカウント無効化
function promoteScheduledWithdrawals_(ss, now) {
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet || memberSheet.getLastRow() < 2) return;

  var headers = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  if (cols['会員状態コード'] == null || cols['退会日'] == null) return;

  var todayStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd');
  var rows = memberSheet.getRange(2, 1, memberSheet.getLastRow() - 1, memberSheet.getLastColumn()).getValues();
  var memberUpdates = [];
  var withdrawnMemberIds = [];

  for (var r = 0; r < rows.length; r += 1) {
    var row = rows[r];
    if (toBoolean_(row[cols['削除フラグ']])) continue;
    if (String(row[cols['会員状態コード']] || '') !== 'WITHDRAWAL_SCHEDULED') continue;

    var withdrawnDate = normalizeDateInput_(row[cols['退会日']]);
    if (!withdrawnDate || withdrawnDate > todayStr) continue;

    // 退会日を過ぎている → WITHDRAWN に確定
    row[cols['会員状態コード']] = 'WITHDRAWN';
    row[cols['更新日時']] = now.toISOString();
    memberUpdates.push({ rowNumber: r + 2, row: row });
    withdrawnMemberIds.push(String(row[cols['会員ID']] || ''));
  }

  for (var u = 0; u < memberUpdates.length; u += 1) {
    memberSheet.getRange(memberUpdates[u].rowNumber, 1, 1, memberUpdates[u].row.length).setValues([memberUpdates[u].row]);
  }

  // 対象会員の認証アカウントを無効化
  if (withdrawnMemberIds.length === 0) return;
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return;

  var authHeaders = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var authCols = {};
  for (var j = 0; j < authHeaders.length; j += 1) authCols[authHeaders[j]] = j;
  if (authCols['会員ID'] == null || authCols['アカウント有効フラグ'] == null) return;

  var authRows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  for (var a = 0; a < authRows.length; a += 1) {
    var authRow = authRows[a];
    var authMemberId = String(authRow[authCols['会員ID']] || '');
    if (withdrawnMemberIds.indexOf(authMemberId) === -1) continue;
    if (!toBoolean_(authRow[authCols['アカウント有効フラグ']])) continue;

    authRow[authCols['アカウント有効フラグ']] = false;
    if (authCols['更新日時'] != null) authRow[authCols['更新日時']] = now.toISOString();
    authSheet.getRange(a + 2, 1, 1, authRow.length).setValues([authRow]);
  }
}

function applyWithdrawalDeletionPolicyIfNeeded_() {
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY) === today) {
    return;
  }

  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    if (props.getProperty(WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY) === today) {
      return;
    }
    applyWithdrawalDeletionPolicy_();
    props.setProperty(WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY, today);
  } finally {
    lock.releaseLock();
  }
}

// v150: 日次トリガーで退会削除ポリシーを実行（ホットパスから除外）
function dailyWithdrawalPolicyTrigger() {
  applyWithdrawalDeletionPolicyIfNeeded_();
}

// v150: ウォームアップトリガー（コールドスタート軽減）
// v188: SpreadsheetApp接続確立 + キャッシュ投入でV8ランタイムとDBを同時に温める
function warmUp() {
  try {
    SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    fetchAllDataFromDb_();
    Logger.log('warmUp: ok');
  } catch (e) {
    Logger.log('warmUp error: ' + e.message);
  }
}

// v150: トリガー一括セットアップ（手動で1回実行）
function setupScheduledTriggers() {
  // 既存トリガーをクリア
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var name = triggers[i].getHandlerFunction();
    if (name === 'dailyWithdrawalPolicyTrigger' || name === 'warmUp') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // 日次 退会削除ポリシー（毎日 02:00-03:00 JST）
  ScriptApp.newTrigger('dailyWithdrawalPolicyTrigger')
    .timeBased().everyDays(1).atHour(2).create();
  // 5分間隔 ウォームアップ（営業時間帯のコールドスタート軽減）
  ScriptApp.newTrigger('warmUp')
    .timeBased().everyMinutes(5).create();
}

function syncBusinessStaffRows_(ss, memberId, memberTypeCode, staffPayloadList) {
  var sheet = ss.getSheetByName('T_事業所職員');
  if (!sheet) return;
  var nowIso = new Date().toISOString();

  var activeRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === String(memberId || '');
  });
  var byId = {};
  for (var i = 0; i < activeRows.length; i += 1) {
    byId[String(activeRows[i]['職員ID'] || '')] = activeRows[i];
  }

  if (memberTypeCode !== 'BUSINESS') {
    for (var k = 0; k < activeRows.length; k += 1) {
      var st = activeRows[k];
        upsertStaffRow_(ss, {
          職員ID: String(st['職員ID'] || ''),
          会員ID: String(memberId || ''),
          姓: String(st['姓'] || ''),
          名: String(st['名'] || ''),
          セイ: String(st['セイ'] || ''),
          メイ: String(st['メイ'] || ''),
          氏名: String(st['氏名'] || ''),
          フリガナ: String(st['フリガナ'] || ''),
        メールアドレス: String(st['メールアドレス'] || ''),
        職員権限コード: String(st['職員権限コード'] || 'STAFF'),
        職員状態コード: 'LEFT',
        入会日: String(st['入会日'] || ''),
        退会日: normalizeDateInput_(String(st['退会日'] || '')) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
        更新日時: nowIso,
        削除フラグ: true,
      });
    }
    return;
  }

  var seen = {};
  var payloadRows = Array.isArray(staffPayloadList) ? staffPayloadList : [];
  for (var j = 0; j < payloadRows.length; j += 1) {
    var payload = payloadRows[j] || {};
    var staffId = String(payload.id || '').trim();
    if (!staffId) continue;
    seen[staffId] = true;
    var existing = byId[staffId];
    var normalizedStaffNames = normalizeStaffNameFields_({
      姓: payload.lastName != null ? payload.lastName : (existing ? existing['姓'] : ''),
      名: payload.firstName != null ? payload.firstName : (existing ? existing['名'] : ''),
      セイ: payload.lastKana != null ? payload.lastKana : (existing ? existing['セイ'] : ''),
      メイ: payload.firstKana != null ? payload.firstKana : (existing ? existing['メイ'] : ''),
      氏名: payload.name != null ? payload.name : (existing ? existing['氏名'] : ''),
      フリガナ: payload.kana != null ? payload.kana : (existing ? existing['フリガナ'] : ''),
    });
    var name = normalizedStaffNames.name;
    var kana = normalizedStaffNames.kana;
    var status = String(payload.status || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED';
    // v147: 除籍済み職員は氏名・フリガナ必須チェックをスキップ
    if (status !== 'LEFT') {
      if (!name) throw new Error('職員氏名は必須です。');
      if (!kana) throw new Error('職員フリガナは必須です。');
    }
    // v106: 既存レコードから現行ステータスと日付を取得
    var prevStatus = existing ? String(existing['職員状態コード'] || 'ENROLLED') : 'ENROLLED';
    var joined = normalizeDateInput_(payload.joinedDate)
      || (existing ? normalizeDateInput_(existing['入会日']) : '');
    // v106: 退職日はバックエンドで自動記録（フロントエンドからの送信は無視）
    var withdrawn = (existing ? normalizeDateInput_(existing['退会日']) : '') || '';
    if (status === 'LEFT' && prevStatus !== 'LEFT' && !withdrawn) {
      // ENROLLED→LEFT 遷移時に退職日を自動セット
      withdrawn = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    }

    upsertStaffRow_(ss, {
      職員ID: staffId,
      会員ID: String(memberId || ''),
      姓: normalizedStaffNames.lastName,
      名: normalizedStaffNames.firstName,
      セイ: normalizedStaffNames.lastKana,
      メイ: normalizedStaffNames.firstKana,
      氏名: name,
      フリガナ: kana,
      メールアドレス: String(payload.email || ''),
      職員権限コード: normalizeBusinessStaffRole_(payload.role),
      職員状態コード: status,
      入会日: joined,
      退会日: withdrawn,
      更新日時: nowIso,
      削除フラグ: false,
    });
  }

  for (var existingId in byId) {
    if (!Object.prototype.hasOwnProperty.call(byId, existingId)) continue;
    if (seen[existingId]) continue;
    var rowObj = byId[existingId];
    upsertStaffRow_(ss, {
      職員ID: existingId,
      会員ID: String(memberId || ''),
      姓: String(rowObj['姓'] || ''),
      名: String(rowObj['名'] || ''),
      セイ: String(rowObj['セイ'] || ''),
      メイ: String(rowObj['メイ'] || ''),
      氏名: String(rowObj['氏名'] || ''),
      フリガナ: String(rowObj['フリガナ'] || ''),
      メールアドレス: String(rowObj['メールアドレス'] || ''),
      職員権限コード: String(rowObj['職員権限コード'] || 'STAFF'),
      職員状態コード: 'LEFT',
      入会日: String(rowObj['入会日'] || ''),
      退会日: normalizeDateInput_(String(rowObj['退会日'] || '')) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
      更新日時: nowIso,
      削除フラグ: true,
    });
  }
}

function upsertStaffRow_(ss, rowObject) {
  var sheet = ss.getSheetByName('T_事業所職員');
  if (!sheet) return;
  var normalizedNameFields = normalizeStaffNameFields_(rowObject);
  var found = findRowByColumnValue_(sheet, '職員ID', String(rowObject['職員ID'] || ''));
  if (!found) {
    var now = String(rowObject['更新日時'] || new Date().toISOString());
    appendRowsByHeaders_(ss, 'T_事業所職員', [{
      職員ID: String(rowObject['職員ID'] || ''),
      会員ID: String(rowObject['会員ID'] || ''),
      姓: normalizedNameFields.lastName,
      名: normalizedNameFields.firstName,
      セイ: normalizedNameFields.lastKana,
      メイ: normalizedNameFields.firstKana,
      氏名: normalizedNameFields.name,
      フリガナ: normalizedNameFields.kana,
      メールアドレス: String(rowObject['メールアドレス'] || ''),
      職員権限コード: String(rowObject['職員権限コード'] || 'STAFF'),
      職員状態コード: String(rowObject['職員状態コード'] || 'ENROLLED'),
      // v106: 新規作成時は登録日を自動セット（フロントエンド値より優先）
      入会日: normalizeDateInput_(rowObject['入会日']) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
      退会日: normalizeDateInput_(rowObject['退会日']),
      介護支援専門員番号: String(rowObject['介護支援専門員番号'] || ''),
      メール配信希望コード: String(rowObject['メール配信希望コード'] || 'YES'),
      作成日時: now,
      更新日時: now,
      削除フラグ: toBoolean_(rowObject['削除フラグ']),
    }]);
    return;
  }

  var row = found.row.slice();
  var cols = found.columns;
  function setCol(name, value) {
    var idx = cols[name];
    if (idx != null) row[idx] = value !== undefined ? value : '';
  }
  setCol('会員ID', String(rowObject['会員ID'] || ''));
  setCol('姓', normalizedNameFields.lastName);
  setCol('名', normalizedNameFields.firstName);
  setCol('セイ', normalizedNameFields.lastKana);
  setCol('メイ', normalizedNameFields.firstKana);
  setCol('氏名', normalizedNameFields.name);
  setCol('フリガナ', normalizedNameFields.kana);
  setCol('メールアドレス', String(rowObject['メールアドレス'] || ''));
  setCol('職員権限コード', String(rowObject['職員権限コード'] || 'STAFF'));
  setCol('職員状態コード', String(rowObject['職員状態コード'] || 'ENROLLED'));
  setCol('入会日', normalizeDateInput_(rowObject['入会日']));
  setCol('退会日', normalizeDateInput_(rowObject['退会日']));
  setCol('更新日時', String(rowObject['更新日時'] || new Date().toISOString()));
  setCol('削除フラグ', toBoolean_(rowObject['削除フラグ']));
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
}


function findRowByColumnValue_(sheet, columnName, targetValue) {
  if (sheet.getLastRow() < 2) {
    return null;
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var columns = {};
  for (var i = 0; i < headers.length; i += 1) {
    columns[headers[i]] = i;
  }
  if (columns[columnName] == null) {
    return null;
  }
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r += 1) {
    if (String(data[r][columns[columnName]] || '') === String(targetValue)) {
      return {
        rowNumber: r + 2,
        row: data[r],
        columns: columns,
      };
    }
  }
  return null;
}

function requireColumns_(columns, names) {
  for (var i = 0; i < names.length; i += 1) {
    if (columns[names[i]] == null) {
      throw new Error('スキーマ不足: 列「' + names[i] + '」が見つかりません。rebuildDatabaseSchema() を実行してください。');
    }
  }
}

function appendLoginHistory_(ss, authId, loginId, authMethod, result, reason) {
  var historySheet = ss.getSheetByName('T_ログイン履歴');
  if (!historySheet) {
    return;
  }
  historySheet.appendRow([
    'LH-' + Utilities.getUuid(),
    authId || '',
    loginId || '',
    authMethod || '',
    result || '',
    reason || '',
    '',
    '',
    new Date().toISOString(),
  ]);
}

function toBoolean_(v) {
  if (v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1') {
    return true;
  }
  return false;
}

function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}

function startsWith_(value, prefix) {
  return String(value || '').indexOf(String(prefix || '')) === 0;
}

function padNumber_(value, length) {
  var text = String(value || '');
  while (text.length < length) text = '0' + text;
  return text;
}

function createSeededRandom_(seed) {
  var state = Number(seed) || 1;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function shuffleArray_(items, rng) {
  for (var i = items.length - 1; i > 0; i -= 1) {
    var j = Math.floor(rng() * (i + 1));
    var tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

function randomDateString_(rng, startDateStr, endDateStr) {
  var start = new Date(startDateStr + 'T00:00:00+09:00').getTime();
  var end = new Date(endDateStr + 'T00:00:00+09:00').getTime();
  var sampled = start + Math.floor((end - start) * rng());
  return Utilities.formatDate(new Date(sampled), 'Asia/Tokyo', 'yyyy-MM-dd');
}

function randomDateTimeIso_(rng, startDateTimeIso, endDateTimeIso) {
  var start = new Date(startDateTimeIso).getTime();
  var end = new Date(endDateTimeIso).getTime();
  var sampled = start + Math.floor((end - start) * rng());
  return new Date(sampled).toISOString();
}

function addHoursToIsoString_(isoString, hours) {
  var date = new Date(String(isoString || ''));
  if (isNaN(date.getTime())) return '';
  date.setTime(date.getTime() + Number(hours || 0) * 60 * 60 * 1000);
  return date.toISOString();
}

function buildSupportLoginId_(seed) {
  var text = String(seed || '');
  var hash = 0;
  for (var i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  var tail = String(hash % 100000000);
  while (tail.length < 8) tail = '0' + tail;
  return '9' + tail;
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

/**
 * 研修を新規登録または更新する。
 * payload.id が空の場合は新規作成、ある場合は既存行を更新する。
 */
function saveTraining_(payload) {
  if (!payload) throw new Error('payload が空です。');
  var organizer = String(payload.organizer || '').trim();
  if (!organizer) {
    throw new Error('主催者を入力してください。');
  }
  var location = String(payload.location || '').trim();
  if (!location) {
    throw new Error('開催場所を入力してください。');
  }
  var summary = String(payload.summary || '').trim();
  if (!summary) {
    throw new Error('研修概要を入力してください。');
  }
  var inquiryPerson = String(payload.inquiryPerson || '').trim();
  if (!inquiryPerson) {
    throw new Error('問い合わせ窓口の担当者を入力してください。');
  }
  var normalizedContact = normalizeInquiryContacts_(payload.inquiryPhone, payload.inquiryEmail, payload.inquiryContactValue);
  var derivedStatus = deriveTrainingStatusByCloseDate_(payload.applicationCloseDate);
  payload.organizer = organizer;
  payload.location = location;
  payload.summary = summary;
  payload.status = derivedStatus;
  payload.inquiryPerson = inquiryPerson;
  payload.inquiryPhone = normalizedContact.phone;
  payload.inquiryEmail = normalizedContact.email;
  payload.inquiryContactType = normalizedContact.primaryType;
  payload.inquiryContactValue = normalizedContact.primaryValue;

  // 管理者セッション情報
  var adminSession = payload.__adminSession || null;
  var adminEmail = adminSession ? String(adminSession.loginId || '') : '';
  var adminPerm = adminSession ? String(adminSession.adminPermissionLevel || '') : '';

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 シートが見つかりません。');

  var now = new Date().toISOString();
  var id = String(payload.id || '');

  if (id) {
    // 既存行を更新
    var found = findRowByColumnValue_(sheet, '研修ID', id);
    if (!found) throw new Error('研修ID「' + id + '」が見つかりません。');
    var cols = found.columns;
    var row = found.row.slice();

    // TRAINING_REGISTRAR は自分が登録した研修のみ編集可
    if (adminPerm === 'TRAINING_REGISTRAR') {
      var registrarEmail = String(cols['登録者メール'] != null ? row[cols['登録者メール']] : '' || '').trim().toLowerCase();
      if (!registrarEmail || registrarEmail !== adminEmail.toLowerCase()) {
        throw new Error('研修登録者は自身が登録した研修のみ編集可能です。');
      }
    }

    function setCol(name, value) {
      var idx = cols[name];
      if (idx != null) row[idx] = value !== undefined ? value : '';
    }

    setCol('研修名', payload.title || '');
    setCol('開催日', payload.date || '');
    setCol('開催終了時刻', payload.endTime || '');
    setCol('定員', Number(payload.capacity || 0));
    setCol('開催場所', payload.location || '');
    setCol('研修状態コード', derivedStatus);
    setCol('主催者', payload.organizer || '');
    setCol('法定外研修フラグ', payload.isNonMandatory ? true : false);
    setCol('研修概要', payload.summary || '');
    setCol('研修内容', payload.description || '');
    setCol('費用JSON', payload.fees ? JSON.stringify(payload.fees) : '[]');
    setCol('申込開始日', payload.applicationOpenDate || '');
    setCol('申込締切日', payload.applicationCloseDate || '');
    setCol('講師', payload.instructor || '');
    setCol('案内状URL', payload.guidePdfUrl || '');
    setCol('項目設定JSON', serializeTrainingOptions_(
      payload.fieldConfig,
      payload.cancelAllowed,
      payload.inquiryPerson,
      payload.inquiryContactType,
      payload.inquiryContactValue,
      payload.inquiryPhone,
      payload.inquiryEmail
    ));
    setCol('更新日時', now);

    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return payload;
  }

  // 新規作成
  var newId = 'T' + Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
  appendRowsByHeaders_(ss, 'T_研修', [{
    '研修ID': newId,
    '研修名': payload.title || '',
    '開催日': payload.date || '',
    '開催終了時刻': payload.endTime || '',
    '定員': Number(payload.capacity || 0),
    '申込者数': 0,
    '開催場所': payload.location || '',
    '研修状態コード': derivedStatus,
    '主催者': payload.organizer || '',
    '法定外研修フラグ': payload.isNonMandatory ? true : false,
    '研修概要': payload.summary || '',
    '研修内容': payload.description || '',
    '費用JSON': payload.fees ? JSON.stringify(payload.fees) : '[]',
    '申込開始日': payload.applicationOpenDate || '',
    '申込締切日': payload.applicationCloseDate || '',
    '講師': payload.instructor || '',
    '案内状URL': payload.guidePdfUrl || '',
    '項目設定JSON': serializeTrainingOptions_(
      payload.fieldConfig,
      payload.cancelAllowed,
      payload.inquiryPerson,
      payload.inquiryContactType,
      payload.inquiryContactValue,
      payload.inquiryPhone,
      payload.inquiryEmail
    ),
    '登録者メール': adminEmail,
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  }]);

  payload.id = newId;
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return payload;
}

/**
 * 会員/職員の研修申込を登録する。
 * - 重複申込を防止
 * - 受付期間/受付状態/定員を検証
 * - T_研修申込 へ追記
 * - T_研修 の申込者数を同期
 */
function applyTraining_(payload) {
  if (!payload) throw new Error('payload が空です。');
  var trainingId = String(payload.trainingId || '').trim();
  var memberId = String(payload.memberId || '').trim();
  var staffId = String(payload.staffId || '').trim();
  if (!trainingId) throw new Error('trainingId が未指定です。');
  if (!memberId) throw new Error('memberId が未指定です。');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = getOrCreateDatabase_();
    backfillApplicationApplicantIdentity_(ss);
    assertTrainingMemberApplicationWritable_(ss, memberId, staffId);
    var trainingSheet = ss.getSheetByName('T_研修');
    if (!trainingSheet) throw new Error('T_研修 シートが見つかりません。');

    var found = findRowByColumnValue_(trainingSheet, '研修ID', trainingId);
    if (!found) throw new Error('対象研修が見つかりません。');
    var tCols = found.columns;
    requireColumns_(tCols, ['申込開始日', '申込締切日', '定員', '申込者数']);
    var tRow = found.row;

    var now = new Date();
    var openDate = parseDateOnly_(tRow[tCols['申込開始日']]);
    var closeDate = parseDateOnly_(tRow[tCols['申込締切日']]);
    if (deriveTrainingStatusByCloseDate_(tRow[tCols['申込締切日']]) !== 'OPEN') {
      throw new Error('この研修は受付期間外です。');
    }
    if (openDate && now.getTime() < openDate.getTime()) {
      throw new Error('申込開始日前のため、まだ申し込めません。');
    }
    if (closeDate && now.getTime() > closeDate.getTime()) {
      throw new Error('申込締切日を過ぎているため、申し込めません。');
    }

    var applicationRows = getTrainingApplicationRows_(ss, { appliedOnly: true });
    var duplicate = applicationRows.find(function(r) {
      return isMemberApplicationRecord_(r, trainingId, memberId, staffId);
    });
    if (duplicate) {
      var applicantsCountForDuplicate = applicationRows.filter(function(r) {
        return String(r['研修ID'] || '') === trainingId;
      }).length;
      return {
        applicationId: String(duplicate['申込ID'] || ''),
        applicants: applicantsCountForDuplicate,
        duplicate: true,
      };
    }

    var currentApplicants = applicationRows.filter(function(r) {
      return String(r['研修ID'] || '') === trainingId;
    }).length;
    var capacity = Number(tRow[tCols['定員']] || 0);
    if (capacity > 0 && currentApplicants >= capacity) {
      throw new Error('定員に達したため、申し込みできません。');
    }

    var nowIso = now.toISOString();
    var applicationId = 'AP-' + Utilities.getUuid().replace(/-/g, '').substring(0, 10).toUpperCase();
    appendRowsByHeaders_(ss, 'T_研修申込', [{
      '申込ID': applicationId,
      '研修ID': trainingId,
      '会員ID': memberId,
      '申込者区分コード': 'MEMBER',
      '申込者ID': memberId,
      '職員ID': staffId,
      '申込状態コード': 'APPLIED',
      '申込日時': nowIso,
      '取消日時': '',
      '備考': '',
      '作成日時': nowIso,
      '更新日時': nowIso,
      '削除フラグ': false,
    }]);

    var nextApplicants = currentApplicants + 1;
    trainingSheet.getRange(found.rowNumber, tCols['申込者数'] + 1).setValue(nextApplicants);
    if (tCols['更新日時'] != null) {
      trainingSheet.getRange(found.rowNumber, tCols['更新日時'] + 1).setValue(nowIso);
    }
    SpreadsheetApp.flush();
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();

    return {
      applicationId: applicationId,
      applicants: nextApplicants,
      duplicate: false,
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 申込済み研修をキャンセルする。
 * - 研修側のキャンセル可否設定を検証
 * - 対象のAPPLIEDレコードをCANCELEDへ更新
 * - T_研修 の申込者数を再集計
 */
function cancelTraining_(payload) {
  if (!payload) throw new Error('payload が空です。');
  var trainingId = String(payload.trainingId || '').trim();
  var memberId = String(payload.memberId || '').trim();
  var staffId = String(payload.staffId || '').trim();
  if (!trainingId) throw new Error('trainingId が未指定です。');
  if (!memberId) throw new Error('memberId が未指定です。');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = getOrCreateDatabase_();
    backfillApplicationApplicantIdentity_(ss);
    var trainingSheet = ss.getSheetByName('T_研修');
    if (!trainingSheet) throw new Error('T_研修 シートが見つかりません。');

    var trainingFound = findRowByColumnValue_(trainingSheet, '研修ID', trainingId);
    if (!trainingFound) throw new Error('対象研修が見つかりません。');
    if (!isTrainingCancelable_(trainingFound.row, trainingFound.columns)) {
      throw new Error('この研修はキャンセルできません。');
    }

    var appSheet = ss.getSheetByName('T_研修申込');
    if (!appSheet) throw new Error('T_研修申込 シートが見つかりません。');
    if (appSheet.getLastRow() < 2) throw new Error('キャンセル対象の申込が見つかりません。');

    var headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
    requireColumns_(cols, ['研修ID', '職員ID', '申込状態コード', '取消日時', '更新日時', '削除フラグ']);

    var data = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
    var targetRowNumber = null;
    for (var r = 0; r < data.length; r += 1) {
      var row = data[r];
      var deleted = toBoolean_(row[cols['削除フラグ']]);
      if (deleted) continue;
      var rowObj = {};
      for (var c = 0; c < headers.length; c += 1) {
        rowObj[String(headers[c] || '')] = row[c];
      }
      if (!isMemberApplicationRecord_(rowObj, trainingId, memberId, staffId)) continue;
      if (String(row[cols['申込状態コード']] || '') !== 'APPLIED') continue;
      targetRowNumber = r + 2;
      break;
    }
    if (!targetRowNumber) throw new Error('キャンセル対象の申込が見つかりません。');

    var nowIso = new Date().toISOString();
    appSheet.getRange(targetRowNumber, cols['申込状態コード'] + 1).setValue('CANCELED');
    appSheet.getRange(targetRowNumber, cols['取消日時'] + 1).setValue(nowIso);
    appSheet.getRange(targetRowNumber, cols['更新日時'] + 1).setValue(nowIso);

    var nextApplicants = countAppliedApplicants_(ss, trainingId);
    var tCols = trainingFound.columns;
    if (tCols['申込者数'] != null) {
      trainingSheet.getRange(trainingFound.rowNumber, tCols['申込者数'] + 1).setValue(nextApplicants);
    }
    if (tCols['更新日時'] != null) {
      trainingSheet.getRange(trainingFound.rowNumber, tCols['更新日時'] + 1).setValue(nowIso);
    }
    SpreadsheetApp.flush();
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();

    return { canceled: true, applicants: nextApplicants };
  } finally {
    lock.releaseLock();
  }
}

function isTrainingCancelable_(trainingRow, trainingCols) {
  var idx = trainingCols['項目設定JSON'];
  if (idx == null) return false;
  var options = parseTrainingOptions_(trainingRow[idx]);
  return options.cancelAllowed === true;
}

function countAppliedApplicants_(ss, trainingId) {
  return getTrainingApplicationRows_(ss, { appliedOnly: true, trainingId: String(trainingId || '') }).length;
}

function isMemberApplicationRecord_(rowObj, trainingId, memberId, staffId) {
  if (String(rowObj['研修ID'] || '') !== String(trainingId || '')) return false;
  if (String(rowObj['職員ID'] || '') !== String(staffId || '')) return false;
  var applicantType = getApplicationApplicantType_(rowObj);
  var applicantId = getApplicationApplicantId_(rowObj);
  if (applicantType || applicantId) {
    return applicantType === 'MEMBER' && applicantId === String(memberId || '');
  }
  return String(rowObj['会員ID'] || '') === String(memberId || '');
}

function backfillApplicationApplicantIdentity_(ss) {
  var appSheet = ss.getSheetByName('T_研修申込');
  if (!appSheet || appSheet.getLastRow() < 2) return 0;

  var headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  if (cols['申込者区分コード'] == null || cols['申込者ID'] == null || cols['会員ID'] == null) return 0;

  var rows = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
  var nowIso = new Date().toISOString();
  var updated = 0;

  for (var r = 0; r < rows.length; r += 1) {
    var row = rows[r];
    var applicantType = String(row[cols['申込者区分コード']] || '').trim();
    var applicantId = String(row[cols['申込者ID']] || '').trim();
    var memberId = String(row[cols['会員ID']] || '').trim();
    var changed = false;

    if (!applicantType && !applicantId && memberId) {
      row[cols['申込者区分コード']] = 'MEMBER';
      row[cols['申込者ID']] = memberId;
      changed = true;
    } else if (applicantType === 'MEMBER' && !applicantId && memberId) {
      row[cols['申込者ID']] = memberId;
      changed = true;
    }

    if (changed) {
      if (cols['更新日時'] != null) row[cols['更新日時']] = nowIso;
      appSheet.getRange(r + 2, 1, 1, row.length).setValues([row]);
      updated += 1;
    }
  }
  return updated;
}

function getApplicationApplicantType_(rowObj) {
  var applicantType = String(rowObj['申込者区分コード'] || '').trim();
  if (applicantType) return applicantType;
  return String(rowObj['会員ID'] || '').trim() ? 'MEMBER' : '';
}

function getApplicationApplicantId_(rowObj) {
  var applicantId = String(rowObj['申込者ID'] || '').trim();
  if (applicantId) return applicantId;
  return String(rowObj['会員ID'] || '').trim();
}

function getMemberIdFromApplication_(rowObj) {
  var applicantType = getApplicationApplicantType_(rowObj);
  if (applicantType !== 'MEMBER') return '';
  return getApplicationApplicantId_(rowObj);
}

function buildTrainingApplicationRelationContext_(ss) {
  var trainingMap = {};
  var memberMap = {};
  var staffMap = {};
  var externalMap = {};

  getRowsAsObjects_(ss, 'T_研修').forEach(function(row) {
    if (!toBoolean_(row['削除フラグ'])) {
      trainingMap[String(row['研修ID'] || '')] = row;
    }
  });
  getRowsAsObjects_(ss, 'T_会員').forEach(function(row) {
    if (!toBoolean_(row['削除フラグ'])) {
      memberMap[String(row['会員ID'] || '')] = row;
    }
  });
  getRowsAsObjects_(ss, 'T_事業所職員').forEach(function(row) {
    if (!toBoolean_(row['削除フラグ'])) {
      staffMap[String(row['職員ID'] || '')] = row;
    }
  });
  getRowsAsObjects_(ss, 'T_外部申込者').forEach(function(row) {
    if (!toBoolean_(row['削除フラグ'])) {
      externalMap[String(row['外部申込者ID'] || '')] = row;
    }
  });

  return {
    trainingMap: trainingMap,
    memberMap: memberMap,
    staffMap: staffMap,
    externalMap: externalMap,
  };
}

function getTrainingApplicationIntegrityIssues_(rowObj, context) {
  var issues = [];
  var trainingId = String(rowObj['研修ID'] || '').trim();
  var rawApplicantType = String(rowObj['申込者区分コード'] || '').trim();
  var rawApplicantId = String(rowObj['申込者ID'] || '').trim();
  var applicantType = getApplicationApplicantType_(rowObj);
  var applicantId = getApplicationApplicantId_(rowObj);
  var memberId = String(rowObj['会員ID'] || '').trim();
  var staffId = String(rowObj['職員ID'] || '').trim();

  if (!trainingId || !context.trainingMap[trainingId]) {
    issues.push('研修ID参照不正');
  }

  if (!rawApplicantType) {
    issues.push('申込者区分コード未設定');
  }
  if (!rawApplicantId && memberId) {
    issues.push('申込者ID未設定');
  }

  if (applicantType === 'MEMBER') {
    var effectiveMemberId = applicantId || memberId;
    if (!effectiveMemberId) {
      issues.push('会員申込なのに会員IDが空');
    } else if (!context.memberMap[effectiveMemberId]) {
      issues.push('会員ID参照不正');
    }
    if (memberId && effectiveMemberId && memberId !== effectiveMemberId) {
      issues.push('会員IDと申込者IDが不一致');
    }
    if (staffId) {
      var staffRow = context.staffMap[staffId];
      if (!staffRow) {
        issues.push('職員ID参照不正');
      } else if (effectiveMemberId && String(staffRow['会員ID'] || '') !== effectiveMemberId) {
        issues.push('職員IDと会員IDの関連不一致');
      }
    }
  } else if (applicantType === 'EXTERNAL') {
    if (!applicantId) {
      issues.push('外部申込者IDが空');
    } else if (!context.externalMap[applicantId]) {
      issues.push('外部申込者ID参照不正');
    }
    if (staffId) {
      issues.push('外部申込に職員IDが設定されている');
    }
  } else {
    issues.push('申込者区分コード不正');
  }

  return issues;
}

function isTrainingApplicationRowValid_(rowObj, context) {
  return getTrainingApplicationIntegrityIssues_(rowObj, context).length === 0;
}

function getTrainingApplicationRows_(ss, options) {
  var opts = options || {};
  var context = opts.context || buildTrainingApplicationRelationContext_(ss);
  return getRowsAsObjects_(ss, 'T_研修申込').filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    if (opts.appliedOnly && String(row['申込状態コード'] || '') !== 'APPLIED') return false;
    if (opts.trainingId && String(row['研修ID'] || '') !== String(opts.trainingId)) return false;
    if (!isTrainingApplicationRowValid_(row, context)) return false;
    if (opts.memberId && getMemberIdFromApplication_(row) !== String(opts.memberId)) return false;
    return true;
  });
}

function assertTrainingMemberApplicationWritable_(ss, memberId, staffId) {
  var normalizedMemberId = String(memberId || '').trim();
  var normalizedStaffId = String(staffId || '').trim();
  if (!normalizedMemberId) {
    throw new Error('memberId が未指定です。');
  }

  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['会員ID'] || '') === normalizedMemberId;
  });
  if (!memberRows.length) {
    throw new Error('対象会員が見つかりません。');
  }

  if (!normalizedStaffId) return;

  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['職員ID'] || '') === normalizedStaffId;
  });
  if (!staffRows.length) {
    throw new Error('対象職員が見つかりません。');
  }
  if (String(staffRows[0]['会員ID'] || '') !== normalizedMemberId) {
    throw new Error('職員IDと会員IDの紐付けが一致しません。');
  }
}

function buildRepairNote_(currentNote, message) {
  var existing = String(currentNote || '').trim();
  return existing ? existing + ' | ' + message : message;
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
  var db = ss || getOrCreateDatabase_();
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
  lock.waitLock(10000);
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

function parseDateOnly_(raw) {
  if (!raw) return null;
  if (Object.prototype.toString.call(raw) === '[object Date]') {
    var fromDateObj = new Date(raw.getTime());
    fromDateObj.setHours(23, 59, 59, 999);
    return fromDateObj;
  }
  var text = String(raw).trim();
  if (!text) return null;
  var parsed = new Date(text);
  if (isNaN(parsed.getTime())) return null;
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

function deriveTrainingStatusByCloseDate_(closeDateRaw) {
  var closeDate = parseDateOnly_(closeDateRaw);
  if (!closeDate) return 'OPEN';
  return new Date().getTime() > closeDate.getTime() ? 'CLOSED' : 'OPEN';
}

/**
 * 研修案内状ファイル（base64）をGoogle Driveにアップロードし、共有URLを返す。
 * payload: { base64: string, filename: string, mimeType: string }
 */
function uploadTrainingFile_(payload) {
  if (!payload || !payload.base64) throw new Error('ファイルデータが空です。');
  var filename = payload.filename || 'upload';
  var mimeType = payload.mimeType || 'application/octet-stream';

  var bytes = Utilities.base64Decode(payload.base64);
  var blob = Utilities.newBlob(bytes, mimeType, filename);

  var folderName = '研修案内状';
  var folder;
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return { url: file.getUrl(), driveFileId: file.getId() };
}

/**
 * GASが参照するDBスプレッドシートIDを明示設定する。
 */
function setDatabaseSpreadsheetId(spreadsheetId) {
  if (!spreadsheetId) {
    throw new Error('スプレッドシートIDが未指定です。');
  }
  SpreadsheetApp.openById(spreadsheetId);
  PropertiesService.getScriptProperties().setProperty(DB_SPREADSHEET_ID_KEY, spreadsheetId);
  return getDbInfo_();
}

function getOrCreateDatabase_() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var spreadsheetId = scriptProperties.getProperty(DB_SPREADSHEET_ID_KEY);
  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (e) {
      // 参照不能なら再作成
    }
  }

  if (DB_SPREADSHEET_ID_FIXED) {
    try {
      var fixed = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
      scriptProperties.setProperty(DB_SPREADSHEET_ID_KEY, DB_SPREADSHEET_ID_FIXED);
      return fixed;
    } catch (e2) {
      // 固定IDが参照不能の場合のみ新規作成する
    }
  }

  var created = SpreadsheetApp.create(DB_SPREADSHEET_NAME);
  scriptProperties.setProperty(DB_SPREADSHEET_ID_KEY, created.getId());
  return created;
}

function initializeSchema_(ss) {
  createMasterSheets_(ss);
  ensureMemberTypeAnnualFeeAmounts_(ss);
  createTableSheets_(ss);
  normalizeTableColumns_(ss, 'T_会員');
  normalizeTableColumns_(ss, 'T_事業所職員');
  normalizeTableColumns_(ss, 'T_研修');
  normalizeTableColumns_(ss, 'T_年会費納入履歴');
  normalizeTableColumns_(ss, 'T_年会費更新履歴');
  normalizeTableColumns_(ss, 'T_管理者Googleホワイトリスト');
  normalizeTableColumns_(ss, 'T_認証アカウント');
  normalizeTableColumns_(ss, 'T_ログイン履歴');
  normalizeTableColumns_(ss, 'T_研修申込');
  normalizeTableColumns_(ss, 'T_監査ログ');
  ensureSystemSettingsRows_(ss);
  seedPermissionMatrixIfNeeded_(ss);
  applyDataValidationRules_(ss);
  protectHeaderRows_(ss);
  cleanupNonSchemaSheets_(ss);
  backfillBusinessStaffNameColumns_(ss);
}

function normalizeTableColumns_(ss, tableName) {
  var targetHeaders = テーブル定義[tableName];
  if (!targetHeaders || targetHeaders.length === 0) return;

  var sheet = ss.getSheetByName(tableName);
  if (!sheet) return;
  var lastCol = Math.max(1, sheet.getLastColumn());
  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var same = currentHeaders.length === targetHeaders.length;
  if (same) {
    for (var i = 0; i < targetHeaders.length; i += 1) {
      if (String(currentHeaders[i] || '') !== String(targetHeaders[i])) {
        same = false;
        break;
      }
    }
  }
  if (same) return;

  var oldRows = [];
  if (sheet.getLastRow() > 1) {
    oldRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  }

  var oldHeaderIndex = {};
  for (var h = 0; h < currentHeaders.length; h += 1) {
    oldHeaderIndex[String(currentHeaders[h] || '')] = h;
  }

  var tempName = '__TMP_' + tableName + '_' + Utilities.getUuid().substring(0, 8);
  var tempSheet = ss.insertSheet(tempName);
  tempSheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);

  if (oldRows.length > 0) {
    var migrated = oldRows.map(function(row) {
      return targetHeaders.map(function(header) {
        var idx = oldHeaderIndex[String(header || '')];
        return idx == null ? '' : row[idx];
      });
    });
    tempSheet.getRange(2, 1, migrated.length, targetHeaders.length).setValues(migrated);
  }

  var oldIndex = sheet.getIndex();
  ss.deleteSheet(sheet);
  tempSheet.setName(tableName);
  ss.setActiveSheet(tempSheet);
  ss.moveActiveSheet(oldIndex);
}

function markSchemaInitialized_() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(SCHEMA_INITIALIZED_KEY, 'true');
  props.setProperty(SCHEMA_INITIALIZED_VERSION_KEY, DB_SCHEMA_VERSION);
}

var _schemaChecked = false; // v150: インメモリフラグで同一実行コンテキスト内の重複PropertiesService呼び出しをスキップ
function initializeSchemaIfNeeded_(ss) {
  if (_schemaChecked) return;
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(SCHEMA_INITIALIZED_KEY) === 'true' &&
      props.getProperty(SCHEMA_INITIALIZED_VERSION_KEY) === DB_SCHEMA_VERSION) {
    _schemaChecked = true;
    return;
  }

  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    if (props.getProperty(SCHEMA_INITIALIZED_KEY) === 'true' &&
        props.getProperty(SCHEMA_INITIALIZED_VERSION_KEY) === DB_SCHEMA_VERSION) {
      return;
    }
    var targetSs = ss || getOrCreateDatabase_();
    initializeSchema_(targetSs);
    markSchemaInitialized_();
    _schemaChecked = true;
  } finally {
    lock.releaseLock();
  }
}

function seedPermissionMatrixIfNeeded_(ss) {
  var sheet = ss.getSheetByName('T_画面項目権限');
  if (!sheet || sheet.getLastRow() > 1) {
    return;
  }
  var now = new Date().toISOString();
  var rows = [
    // 事業所管理者
    ['P001', 'BUSINESS_ADMIN', '会員マイページ', '会員基本情報', true, false, true, false, now, now, false],
    ['P002', 'BUSINESS_ADMIN', '会員マイページ', '事業所職員一覧', true, true, true, true, now, now, false],
    ['P003', 'BUSINESS_ADMIN', '会員マイページ', '発送通信設定', true, false, true, false, now, now, false],
    ['P004', 'BUSINESS_ADMIN', '会員マイページ', '研修申込', true, true, true, true, now, now, false],
    // 事業所メンバー
    ['P101', 'BUSINESS_MEMBER', '会員マイページ', '会員基本情報', true, false, false, false, now, now, false],
    ['P102', 'BUSINESS_MEMBER', '会員マイページ', '事業所職員一覧', true, false, false, false, now, now, false],
    ['P103', 'BUSINESS_MEMBER', '会員マイページ', '発送通信設定', true, false, false, false, now, now, false],
    ['P104', 'BUSINESS_MEMBER', '会員マイページ', '研修申込', true, true, true, false, now, now, false],
    // 個人会員
    ['P201', 'INDIVIDUAL_MEMBER', '会員マイページ', '会員基本情報', true, false, true, false, now, now, false],
    ['P202', 'INDIVIDUAL_MEMBER', '会員マイページ', '発送通信設定', true, false, true, false, now, now, false],
    ['P203', 'INDIVIDUAL_MEMBER', '会員マイページ', '研修申込', true, true, true, false, now, now, false],
    // 事務局管理者
    ['P901', 'OFFICE_ADMIN', '管理画面', '全機能', true, true, true, true, now, now, false],
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function createMasterSheets_(ss) {
  var masterNames = Object.keys(マスタ定義);
  for (var i = 0; i < masterNames.length; i += 1) {
    var sheetName = masterNames[i];
    var headers = マスタ定義[sheetName];
    var rows = マスタ初期値[sheetName] || [];
    var sheet = getOrCreateSheet_(ss, sheetName);
    writeSheetHeaders_(sheet, headers);
    writeMasterRows_(sheet, rows);
  }
}

function ensureMemberTypeAnnualFeeAmounts_(ss) {
  var sheet = ss.getSheetByName('M_会員種別');
  if (!sheet || sheet.getLastRow() < 2) return;
  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['コード', '年会費金額']);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var amountByCode = {
    INDIVIDUAL: 3000,
    BUSINESS: 8000,
    SUPPORT: 5000,
  };
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var code = String(row[cols['コード']] || '');
    if (!Object.prototype.hasOwnProperty.call(amountByCode, code)) continue;
    row[cols['年会費金額']] = Number(amountByCode[code]);
  }
  sheet.getRange(2, 1, rows.length, sheet.getLastColumn()).setValues(rows);
}

function createTableSheets_(ss) {
  var tableNames = Object.keys(テーブル定義);
  for (var i = 0; i < tableNames.length; i += 1) {
    var tableName = tableNames[i];
    var headers = テーブル定義[tableName];
    var sheet = getOrCreateSheet_(ss, tableName);
    writeSheetHeaders_(sheet, headers);
  }
}

function ensureSystemSettingsRows_(ss) {
  var now = new Date().toISOString();
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) return;

  var existing = getRowsAsObjects_(ss, 'T_システム設定');
  var byKey = {};
  for (var i = 0; i < existing.length; i += 1) {
    var key = String(existing[i]['設定キー'] || '');
    if (key) byKey[key] = existing[i];
  }

  var scriptProperties = PropertiesService.getScriptProperties();
  var defaultLimit = Number(scriptProperties.getProperty(DEFAULT_BUSINESS_STAFF_LIMIT_KEY) || 10);
  var historyLookback = Number(scriptProperties.getProperty(TRAINING_HISTORY_LOOKBACK_MONTHS_KEY) || 18);
  var defaultAnnualFeeGuidance = '年会費が未納の場合は、下記の振込先をご確認のうえお手続きください。\n振込名義は会員番号と氏名を記載してください。';
  var defaultAnnualFeeTransferAccount = JSON.stringify(DEMO_TRANSFER_ACCOUNT);
  if (!isFinite(defaultLimit) || defaultLimit < 1) defaultLimit = 10;
  if (!isFinite(historyLookback) || historyLookback < 1) historyLookback = 18;

  if (!byKey['DEFAULT_BUSINESS_STAFF_LIMIT']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'DEFAULT_BUSINESS_STAFF_LIMIT',
      設定値: String(Math.floor(defaultLimit)),
      説明: '事業所会員メンバー上限（全体デフォルト）',
      更新日時: now,
    }]);
  }

  if (!byKey['DB_SCHEMA_VERSION']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'DB_SCHEMA_VERSION',
      設定値: DB_SCHEMA_VERSION,
      説明: 'DBスキーマバージョン',
      更新日時: now,
    }]);
  }

  if (!byKey['TRAINING_HISTORY_LOOKBACK_MONTHS']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'TRAINING_HISTORY_LOOKBACK_MONTHS',
      設定値: String(Math.floor(historyLookback)),
      説明: '研修履歴の表示期間（月）',
      更新日時: now,
    }]);
  }

  if (!byKey['ANNUAL_FEE_PAYMENT_GUIDANCE']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'ANNUAL_FEE_PAYMENT_GUIDANCE',
      設定値: defaultAnnualFeeGuidance,
      説明: '年会費未納時の会員向け納入案内',
      更新日時: now,
    }]);
  }

  if (!byKey['ANNUAL_FEE_TRANSFER_ACCOUNT']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'ANNUAL_FEE_TRANSFER_ACCOUNT',
      設定値: defaultAnnualFeeTransferAccount,
      説明: '年会費未納時の共通振込先',
      更新日時: now,
    }]);
  }
  // v194: PDF名簿出力 & 一括メール設定
  if (!byKey['ROSTER_TEMPLATE_SS_ID']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'ROSTER_TEMPLATE_SS_ID',
      設定値: '',
      説明: '名簿テンプレートスプレッドシートID',
      更新日時: now,
    }]);
  }
  if (!byKey['BULK_MAIL_AUTO_ATTACH_FOLDER_ID']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID',
      設定値: '',
      説明: '一括メール個別自動添付DriveフォルダID',
      更新日時: now,
    }]);
  }
  if (!byKey['EMAIL_LOG_VIEWER_ROLE']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'EMAIL_LOG_VIEWER_ROLE',
      設定値: 'MASTER',
      説明: 'メール送信ログ閲覧権限（MASTER / MASTER,ADMIN）',
      更新日時: now,
    }]);
  }
}

function writeMasterRows_(sheet, rows) {
  if (!rows || rows.length === 0) {
    return;
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    return;
  }
  var existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var existingCodes = {};
  for (var i = 0; i < existing.length; i += 1) {
    existingCodes[String(existing[i][0] || '')] = true;
  }
  var appendRows = [];
  for (var j = 0; j < rows.length; j += 1) {
    var code = String(rows[j][0] || '');
    if (!existingCodes[code]) {
      appendRows.push(rows[j]);
    }
  }
  if (appendRows.length > 0) {
    sheet.getRange(lastRow + 1, 1, appendRows.length, rows[0].length).setValues(appendRows);
  }
}

function writeSheetHeaders_(sheet, headers) {
  var currentLastRow = sheet.getLastRow();
  if (currentLastRow === 0) {
    sheet.appendRow(headers);
    return;
  }

  var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var matches = true;
  for (var i = 0; i < headers.length; i += 1) {
    if (existingHeaders[i] !== headers[i]) {
      matches = false;
      break;
    }
  }
  if (!matches) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function applyDataValidationRules_(ss) {
  for (var i = 0; i < 入力規則定義.length; i += 1) {
    var ruleDef = 入力規則定義[i];
    var tableName = ruleDef[0];
    var columnName = ruleDef[1];
    var masterName = ruleDef[2];

    var tableSheet = ss.getSheetByName(tableName);
    var masterSheet = ss.getSheetByName(masterName);
    if (!tableSheet || !masterSheet) {
      continue;
    }

    var headerRow = tableSheet.getRange(1, 1, 1, tableSheet.getLastColumn()).getValues()[0];
    var columnIndex = headerRow.indexOf(columnName) + 1;
    if (columnIndex <= 0) {
      continue;
    }

    var masterLastRow = masterSheet.getLastRow();
    if (masterLastRow < 2) {
      continue;
    }

      var masterCodeRange = masterSheet.getRange(2, 1, masterLastRow - 1, 1);
      var validation = SpreadsheetApp.newDataValidation()
        .requireValueInRange(masterCodeRange, true)
        .setAllowInvalid(true)
        .build();

    tableSheet
      .getRange(2, columnIndex, Math.max(tableSheet.getMaxRows() - 1, 1), 1)
      .setDataValidation(validation);
  }
}

function protectHeaderRows_(ss) {
  var allSheetNames = Object.keys(マスタ定義).concat(Object.keys(テーブル定義));
  for (var i = 0; i < allSheetNames.length; i += 1) {
    var sheet = ss.getSheetByName(allSheetNames[i]);
    if (!sheet) {
      continue;
    }
    var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    var exists = false;
    for (var p = 0; p < protections.length; p += 1) {
      var range = protections[p].getRange();
      if (range.getA1Notation() === headerRange.getA1Notation()) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      var protection = headerRange.protect();
      protection.setDescription('ヘッダー保護: ' + sheet.getName());
      protection.setWarningOnly(true);
    }
  }
}

function getOrCreateSheet_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    return sheet;
  }
  return ss.insertSheet(sheetName);
}

function cleanupNonSchemaSheets_(ss) {
  var allowed = {};
  var schemaNames = Object.keys(マスタ定義).concat(Object.keys(テーブル定義));
  for (var i = 0; i < schemaNames.length; i += 1) {
    allowed[schemaNames[i]] = true;
  }
  allowed['_CREDENTIALS_TEMP'] = true;
  allowed[MIGRATION_REPORT_SHEETS.summary] = true;
  allowed[MIGRATION_REPORT_SHEETS.map] = true;
  allowed[MIGRATION_REPORT_SHEETS.skipped] = true;

  var sheets = ss.getSheets();
  var deleted = [];
  for (var j = sheets.length - 1; j >= 0; j -= 1) {
    var sheet = sheets[j];
    var name = sheet.getName();
    if (allowed[name]) {
      continue;
    }
    if (ss.getSheets().length <= 1) {
      break;
    }
    try {
      ss.deleteSheet(sheet);
      deleted.push(name);
    } catch (e) {
      // シートが既に削除済みの場合は無視
    }
  }
  return deleted;
}

function getDefinedBuildStatus_() {
  var ss = getOrCreateDatabase_();
  var actual = ss.getSheets().map(function(sheet) {
    return sheet.getName();
  });
  var definedMasters = Object.keys(マスタ定義);
  var definedTables = Object.keys(テーブル定義);
  var defined = definedMasters.concat(definedTables);

  var missing = [];
  for (var i = 0; i < defined.length; i += 1) {
    if (actual.indexOf(defined[i]) === -1) {
      missing.push(defined[i]);
    }
  }

  var extra = [];
  for (var j = 0; j < actual.length; j += 1) {
    if (defined.indexOf(actual[j]) === -1) {
      extra.push(actual[j]);
    }
  }

  return {
    スプレッドシートID: ss.getId(),
    スプレッドシートURL: ss.getUrl(),
    定義済みマスタ数: definedMasters.length,
    定義済みテーブル数: definedTables.length,
    作成済みシート一覧: actual,
    未作成シート一覧: missing,
    定義外シート一覧: extra,
    注意事項: '認証アカウント等の業務初期データは未定義のため自動作成していません。',
  };
}

// ─── 低水準ヘルパー（公開ポータル用追加） ───────────────────────────────────

/**
 * シートの全行をオブジェクト配列として返す（getRowsAsObjects_ のシートオブジェクト版）。
 */
function getSheetData_(sheet) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rows = [];
  for (var r = 0; r < values.length; r += 1) {
    var obj = {};
    for (var c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = values[r][c];
    }
    rows.push(obj);
  }
  return rows;
}

function getLastRowsAsObjects_(ss, sheetName, count) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var rowCount = Math.max(0, Math.min(Number(count) || 0, lastRow - 1));
  if (rowCount < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var startRow = lastRow - rowCount + 1;
  var values = sheet.getRange(startRow, 1, rowCount, lastCol).getValues();
  var rows = [];
  for (var r = 0; r < values.length; r += 1) {
    var obj = {};
    for (var c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = values[r][c];
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * シートにオブジェクト1行を追記する（cols順で値をマッピング）。
 */
function appendRow_(sheet, cols, obj) {
  var row = cols.map(function(c) {
    var v = obj[c];
    return (v === undefined || v === null) ? '' : v;
  });
  sheet.appendRow(row);
}

/**
 * keyColumn が keyValue と一致する行の指定フィールドを更新する。
 */
function updateRowByKey_(sheet, cols, keyColumn, keyValue, updates) {
  if (sheet.getLastRow() < 2) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIndex = {};
  for (var i = 0; i < headers.length; i += 1) {
    colIndex[headers[i]] = i;
  }
  var keyIdx = colIndex[keyColumn];
  if (keyIdx == null) return;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r += 1) {
    if (String(data[r][keyIdx] || '') === String(keyValue)) {
      var updateKeys = Object.keys(updates);
      for (var k = 0; k < updateKeys.length; k += 1) {
        var col = updateKeys[k];
        var idx = colIndex[col];
        if (idx != null) {
          sheet.getRange(r + 2, idx + 1).setValue(updates[col]);
        }
      }
      return;
    }
  }
}

// ─── 申込者数ヘルパー ────────────────────────────────────────────────────────

function updateTrainingApplicantCount_(db, trainingId) {
  var count = countAppliedApplicants_(db, trainingId);
  var trainingSheet = db.getSheetByName('T_研修');
  updateRowByKey_(trainingSheet, テーブル定義.T_研修, '研修ID', trainingId, { '申込者数': count, '更新日時': new Date().toISOString() });
}

// ─── 公開ポータル API ─────────────────────────────────────────────────────────

function getPublicTrainings_() {
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheet = db.getSheetByName('T_研修');
  var rows = getSheetData_(sheet);
  var result = rows.filter(function(r) {
    var status = deriveTrainingStatusByCloseDate_(r['申込締切日']);
    return status === 'OPEN' && !toBoolean_(r['削除フラグ']);
  }).map(function(r) {
    return {
      id: String(r['研修ID'] || ''),
      name: String(r['研修名'] || ''),
      date: formatDateForApi_(r['開催日']),
      endTime: formatTimeOnly_(r['開催終了時刻']),
      capacity: Number(r['定員'] || 0),
      location: String(r['開催場所'] || ''),
      summary: String(r['研修概要'] || ''),
      content: String(r['研修内容'] || ''),
      cost: String(r['費用JSON'] || ''),
      startDate: formatDateForApi_(r['申込開始日']),
      endDate: formatDateForApi_(r['申込締切日']),
      instructor: String(r['講師'] || ''),
      fileUrl: String(r['案内状URL'] || ''),
      organizer: String(r['主催者'] || ''),
      fieldConfig: String(r['項目設定JSON'] || ''),
    };
  });
  return JSON.stringify({ success: true, data: result });
}

function applyTrainingExternal_(payload) {
  if (!payload) return JSON.stringify({ success: false, error: 'invalid_request' });
  // Honeypot チェック
  if (payload.honeypot) {
    return JSON.stringify({ success: false, error: 'invalid_request' });
  }
  var name = String(payload.name || '').trim();
  var furigana = String(payload.furigana || '').trim();
  var email = String(payload.email || '').trim();
  var phone = String(payload.phone || '').trim();
  var office = String(payload.officeName || '').trim();
  var trainingId = String(payload.trainingId || '').trim();
  var consent = payload.consent;

  if (!name || name.length > 100) return JSON.stringify({ success: false, error: '氏名が無効です' });
  if (furigana.length > 100) return JSON.stringify({ success: false, error: 'フリガナが無効です' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return JSON.stringify({ success: false, error: 'メールアドレスが無効です' });
  if (!phone || !/^[\d\-\+\(\)]+$/.test(phone) || phone.length > 20) return JSON.stringify({ success: false, error: '電話番号が無効です' });
  if (office.length > 100) return JSON.stringify({ success: false, error: '事業所名が無効です' });
  if (!trainingId) return JSON.stringify({ success: false, error: '研修IDが無効です' });
  if (!consent) return JSON.stringify({ success: false, error: 'プライバシーポリシーへの同意が必要です' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    backfillApplicationApplicantIdentity_(db);

    var trainingSheet = db.getSheetByName('T_研修');
    var trainingRows = getSheetData_(trainingSheet);
    var training = null;
    for (var i = 0; i < trainingRows.length; i += 1) {
      if (String(trainingRows[i]['研修ID'] || '') === trainingId && !toBoolean_(trainingRows[i]['削除フラグ'])) {
        training = trainingRows[i];
        break;
      }
    }

    if (!training) return JSON.stringify({ success: false, error: '研修が見つかりません' });

    var status = deriveTrainingStatusByCloseDate_(training['申込締切日']);
    if (status !== 'OPEN') return JSON.stringify({ success: false, error: '申込受付期間外です' });

    var now = new Date();
    if (training['申込開始日'] && new Date(training['申込開始日']) > now) return JSON.stringify({ success: false, error: '申込受付前です' });
    if (training['申込締切日'] && new Date(training['申込締切日']) < now) return JSON.stringify({ success: false, error: '申込締切済みです' });

    if (training['定員'] && countAppliedApplicants_(db, trainingId) >= Number(training['定員'])) {
      return JSON.stringify({ success: false, error: '定員に達しています' });
    }

    var applySheet = db.getSheetByName('T_研修申込');
    var activeApplyRows = getTrainingApplicationRows_(db, { appliedOnly: true, trainingId: trainingId });
    var externalSheet = db.getSheetByName('T_外部申込者');
    var externalRows = getSheetData_(externalSheet);

    var existingExternal = null;
    for (var j = 0; j < externalRows.length; j += 1) {
      if (String(externalRows[j]['メールアドレス'] || '') === email && !toBoolean_(externalRows[j]['削除フラグ'])) {
        existingExternal = externalRows[j];
        break;
      }
    }
    if (existingExternal) {
      for (var k = 0; k < activeApplyRows.length; k += 1) {
        var ar = activeApplyRows[k];
        if (String(ar['申込者区分コード'] || '') === 'EXTERNAL' &&
            String(ar['申込者ID'] || '') === String(existingExternal['外部申込者ID'] || '')) {
          return JSON.stringify({ success: false, error: '既に申込済みです' });
        }
      }
    }

    var nowStr = new Date().toISOString();
    var externalId = Utilities.getUuid();
    var newExternal = {
      '外部申込者ID': externalId,
      '氏名': name,
      'フリガナ': furigana,
      'メールアドレス': email,
      '電話番号': phone,
      '事業所名': office,
      '同意日時': nowStr,
      '作成日時': nowStr,
      '更新日時': nowStr,
      '削除フラグ': false,
    };
    appendRow_(externalSheet, テーブル定義.T_外部申込者, newExternal);

    var applyId = Utilities.getUuid();
    var applyColsAll = テーブル定義.T_研修申込;
    var newApply = {};
    for (var m = 0; m < applyColsAll.length; m += 1) { newApply[applyColsAll[m]] = ''; }
    newApply['申込ID'] = applyId;
    newApply['研修ID'] = trainingId;
    newApply['申込者区分コード'] = 'EXTERNAL';
    newApply['申込者ID'] = externalId;
    newApply['申込状態コード'] = 'APPLIED';
    newApply['申込日時'] = nowStr;
    newApply['作成日時'] = nowStr;
    newApply['更新日時'] = nowStr;
    newApply['削除フラグ'] = false;
    appendRow_(applySheet, applyColsAll, newApply);

    updateTrainingApplicantCount_(db, trainingId);
    clearAllDataCache_();
    clearAdminDashboardCache_();

    try {
      MailApp.sendEmail({
        to: email,
        subject: '【研修申込確認】' + String(training['研修名'] || ''),
        body: name + ' 様\n\n以下の研修へお申込いただきありがとうございます。\n\n研修名: ' + String(training['研修名'] || '') + '\n開催日: ' + formatDateForApi_(training['開催日']) + '\n\n申込IDは以下の通りです。取消の際に必要ですので保管してください。\n申込ID: ' + applyId + '\n\n何かご不明な点は主催者までお問い合わせください。',
      });
    } catch (e) {
      Logger.log('申込確認メール送信失敗: ' + e.message);
    }

    return JSON.stringify({ success: true, data: { applyId: applyId } });
  } finally {
    lock.releaseLock();
  }
}

function cancelTrainingExternal_(payload) {
  if (!payload) return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
  var applyId = String(payload.applyId || '').trim();
  var email = String(payload.email || '').trim();

  if (!applyId || !email) return JSON.stringify({ success: false, error: 'パラメータが不足しています' });

  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var applySheet = db.getSheetByName('T_研修申込');
  var applyRows = getSheetData_(applySheet);

  var apply = null;
  for (var i = 0; i < applyRows.length; i += 1) {
    var r = applyRows[i];
    if (String(r['申込ID'] || '') === applyId &&
        String(r['申込者区分コード'] || '') === 'EXTERNAL' &&
        !toBoolean_(r['削除フラグ'])) {
      apply = r;
      break;
    }
  }
  if (!apply) return JSON.stringify({ success: false, error: '申込が見つかりません' });

  var externalSheet = db.getSheetByName('T_外部申込者');
  var externalRows = getSheetData_(externalSheet);
  var external = null;
  for (var j = 0; j < externalRows.length; j += 1) {
    var er = externalRows[j];
    if (String(er['外部申込者ID'] || '') === String(apply['申込者ID'] || '') && !toBoolean_(er['削除フラグ'])) {
      external = er;
      break;
    }
  }
  if (!external || String(external['メールアドレス'] || '') !== email) {
    return JSON.stringify({ success: false, error: 'メールアドレスが一致しません' });
  }

  var nowStr = new Date().toISOString();
  updateRowByKey_(applySheet, テーブル定義.T_研修申込, '申込ID', applyId, { '申込状態コード': 'CANCELED', '更新日時': nowStr });
  updateTrainingApplicantCount_(db, String(apply['研修ID'] || ''));
  clearAllDataCache_();
  clearAdminDashboardCache_();

  return JSON.stringify({ success: true });
}

function getTrainingApplicants_(payload) {
  if (!checkAdminBySession_()) return JSON.stringify({ success: false, error: 'unauthorized' });
  if (!payload) return JSON.stringify({ success: false, error: 'trainingId required' });
  var trainingId = String(payload.trainingId || '').trim();
  if (!trainingId) return JSON.stringify({ success: false, error: 'trainingId required' });

  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  backfillApplicationApplicantIdentity_(db);
  var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });

  var memberSheet = db.getSheetByName('T_会員');
  var memberRows = getSheetData_(memberSheet);
  var memberMap = {};
  memberRows.forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });

  var externalSheet = db.getSheetByName('T_外部申込者');
  var externalRows = getSheetData_(externalSheet);
  var externalMap = {};
  externalRows.forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

  var result = applyRows.map(function(r) {
    var applicantType = getApplicationApplicantType_(r) || 'MEMBER';
    var isMember = applicantType === 'MEMBER';
    var applicantId = getApplicationApplicantId_(r);
    var info = isMember ? memberMap[applicantId] : externalMap[applicantId];
    var memberName = info ? (String(info['姓'] || '') + ' ' + String(info['名'] || '')).trim() : '';
    return {
      applyId: String(r['申込ID'] || ''),
      trainingId: String(r['研修ID'] || ''),
      applicantType: applicantType,
      applicantId: applicantId,
      name: info ? (isMember ? (memberName || String(info['氏名'] || '')) : String(info['氏名'] || '')) : '(不明)',
      email: info ? (isMember ? String(info['代表メールアドレス'] || '') : String(info['メールアドレス'] || '')) : '',
      officeName: info ? (isMember ? String(info['勤務先名'] || '') : String(info['事業所名'] || '')) : '',
      status: String(r['申込状態コード'] || ''),
      applyDate: String(r['申込日時'] || ''),
    };
  });

  return JSON.stringify({ success: true, data: result });
}

function getAdminEmailAliases_() {
  if (!checkAdminBySession_()) return JSON.stringify({ success: false, error: 'unauthorized' });
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var aliases = [];
  try {
    aliases = GmailApp.getAliases();
  } catch (e) {
    // gmail.send スコープ不足時はオーナーメールのみ返す
  }
  var all = [ownerEmail].concat(aliases);
  return JSON.stringify({ success: true, data: all });
}

function sendTrainingMail_(payload) {
  if (!checkAdminBySession_()) return JSON.stringify({ success: false, error: 'unauthorized' });
  if (!payload) return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
  var from = String(payload.from || '').trim();
  var subject = String(payload.subject || '').trim();
  var body = String(payload.body || '').trim();
  var attachments = payload.attachments || [];
  var driveFileIds = payload.driveFileIds || {};

  if (!subject || !body) {
    return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
  }

  // targetApplyIds + trainingId から recipients を組み立てる
  var trainingId = String(payload.trainingId || '').trim();
  var targetApplyIds = payload.targetApplyIds;
  var recipients = payload.recipients; // 後方互換（直接渡す場合）

  if (!recipients || !recipients.length) {
    if (!trainingId || !targetApplyIds || !targetApplyIds.length) {
      return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
    }
    var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    backfillApplicationApplicantIdentity_(db);
    var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });
    var memberSheet = db.getSheetByName('T_会員');
    var memberMap = {};
    getSheetData_(memberSheet).forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });
    var externalSheet = db.getSheetByName('T_外部申込者');
    var externalMap = {};
    getSheetData_(externalSheet).forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

    var targetSet = {};
    targetApplyIds.forEach(function(id) { targetSet[String(id)] = true; });

    recipients = applyRows
      .filter(function(r) { return targetSet[String(r['申込ID'] || '')]; })
      .map(function(r) {
        var applicantType = getApplicationApplicantType_(r) || 'MEMBER';
        var isMember = applicantType === 'MEMBER';
        var applicantId = getApplicationApplicantId_(r);
        var info = isMember ? memberMap[applicantId] : externalMap[applicantId];
        var memberName = info ? (String(info['姓'] || '') + ' ' + String(info['名'] || '')).trim() : '';
        return {
          applyId: String(r['申込ID'] || ''),
          name: info ? (isMember ? (memberName || String(info['氏名'] || '')) : String(info['氏名'] || '')) : '(不明)',
          email: info ? (isMember ? String(info['代表メールアドレス'] || '') : String(info['メールアドレス'] || '')) : '',
          officeName: info ? (isMember ? String(info['勤務先名'] || '') : String(info['事業所名'] || '')) : '',
        };
      });
  }

  if (!recipients.length) {
    return JSON.stringify({ success: false, error: '送信対象者が見つかりません' });
  }

  var replyTo = Session.getActiveUser().getEmail();
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var validAliases = [ownerEmail];
  try {
    validAliases = validAliases.concat(GmailApp.getAliases());
  } catch (e) {
    // gmail スコープ未承認時はオーナーメールのみ
  }
  var fromFound = false;
  for (var a = 0; a < validAliases.length; a += 1) {
    if (validAliases[a] === from) { fromFound = true; break; }
  }
  if (!from || !fromFound) from = ownerEmail;

  var commonAttachments = attachments.map(function(att) {
    var bytes = Utilities.base64Decode(att.base64);
    return Utilities.newBlob(bytes, att.mimeType, att.name);
  });

  var errors = [];
  for (var i = 0; i < recipients.length; i += 1) {
    var rec = recipients[i];
    try {
      var personalSubject = subject.replace(/\{\{氏名\}\}/g, rec.name).replace(/\{\{事業所名\}\}/g, rec.officeName || '');
      var personalBody = body.replace(/\{\{氏名\}\}/g, rec.name).replace(/\{\{事業所名\}\}/g, rec.officeName || '');
      var allAttachments = commonAttachments.slice();
      if (driveFileIds[rec.applyId]) {
        try {
          var file = DriveApp.getFileById(driveFileIds[rec.applyId]);
          allAttachments.push(file.getBlob());
        } catch (fe) {
          Logger.log('個別添付取得失敗: ' + rec.applyId + ' ' + fe.message);
        }
      }
      MailApp.sendEmail(rec.email, personalSubject, personalBody, {
        replyTo: replyTo,
        attachments: allAttachments,
        name: '枚方市介護支援専門員連絡協議会',
      });
    } catch (e) {
      errors.push({ applyId: rec.applyId, error: e.message });
    }
  }

  var sentCount = recipients.length - errors.length;
  if (errors.length > 0 && sentCount === 0) {
    return JSON.stringify({ success: false, error: errors[0].error, data: { sent: 0, errors: errors.map(function(e) { return e.error; }) } });
  }
  return JSON.stringify({ success: true, data: { sent: sentCount, errors: errors.map(function(e) { return e.error; }) } });
}

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
  function makeHash(pw, salt) { return hashPassword_(pw, salt); }

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

function normalizeStaffNameFields_(rowLike) {
  var lastName = String((rowLike && rowLike['姓']) || '').trim();
  var firstName = String((rowLike && rowLike['名']) || '').trim();
  var lastKana = String((rowLike && rowLike['セイ']) || '').trim();
  var firstKana = String((rowLike && rowLike['メイ']) || '').trim();
  var fullName = String((rowLike && rowLike['氏名']) || '').trim();
  var fullKana = String((rowLike && rowLike['フリガナ']) || '').trim();

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

  return {
    lastName: lastName,
    firstName: firstName,
    lastKana: lastKana,
    firstKana: firstKana,
    name: fullName,
    kana: fullKana,
  };
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
 * ランダムパスワードを生成する（8文字、英数字）
 */
function generateRandomPassword_() {
  var chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var pw = '';
  for (var i = 0; i < 10; i++) {
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
    var hashed = hashPassword_(plainPassword, salt);

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
      var stHashed = hashPassword_(stPassword, stSalt);

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

function backupMigrationTargets() {
  return backupBeforeMigration_();
}

function backupMigrationTargetsJson() {
  return JSON.stringify(backupMigrationTargets());
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

    var loginRows = getRowsAsObjects_(ss, 'T_ログイン履歴');
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

// v188: Gemini API を GAS サーバー側で呼び出す（APIキーはScriptPropertiesで管理）
// フロントエンドに @google/genai を含めず、APIキーも露出しない設計。
function generateTrainingEmailWithAI_(payload) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return { ok: false, text: 'GEMINI_API_KEY がScript Propertiesに設定されていません。' };
  }

  var training = payload.training || {};
  var recipientName = String(payload.recipientName || '会員各位');

  var prompt = 'あなたは枚方市介護支援専門員連絡協議会の事務局スタッフです。\n' +
    '以下の研修に参加申し込みをした会員に向けて、開催3日前のリマインドメールを作成してください。\n\n' +
    '【研修情報】\n' +
    '研修名: ' + String(training.title || '') + '\n' +
    '開催日: ' + String(training.date || '') + '\n' +
    '場所: ' + String(training.location || '-') + '\n\n' +
    '【要件】\n' +
    '- 件名は分かりやすく簡潔に。\n' +
    '- 宛名は「' + recipientName + '」としてください。\n' +
    '- 丁寧でプロフェッショナルなトーンで記述してください。';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  var requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  });

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: requestBody,
      muteHttpExceptions: true,
    });
    var statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      Logger.log('generateTrainingEmailWithAI_: Gemini API error ' + statusCode + ': ' + response.getContentText());
      return { ok: false, text: 'Gemini API エラー (HTTP ' + statusCode + ')' };
    }
    var json = JSON.parse(response.getContentText());
    var text = json.candidates &&
               json.candidates[0] &&
               json.candidates[0].content &&
               json.candidates[0].content.parts &&
               json.candidates[0].content.parts[0] &&
               json.candidates[0].content.parts[0].text;
    return { ok: true, text: text || 'メールの生成に失敗しました。' };
  } catch (e) {
    Logger.log('generateTrainingEmailWithAI_: ' + e.message);
    return { ok: false, text: 'エラーが発生しました: ' + e.message };
  }
}

// ============================================================
// v194 Phase 2: 会員一括メール送信
// ============================================================

/**
 * 一括メール宛先一覧を取得する。
 * INDIVIDUAL / SUPPORT: T_会員.代表メールアドレス
 * BUSINESS: T_事業所職員（ENROLLED + メール配信希望コード ≠ 'NO'）
 *
 * payload:
 *   memberTypes?    – ['INDIVIDUAL','BUSINESS','SUPPORT']  デフォルト全種別
 *   memberStatus?   – 'ACTIVE' | 'ALL'  (T_会員.会員状態コード)   デフォルト 'ACTIVE'
 *   staffStatus?    – 'ENROLLED' | 'ALL' (T_事業所職員.職員状態コード) デフォルト 'ENROLLED'
 *   mailingFilter?  – 'OPT_IN' | 'ALL'  (メール配信希望コード)    デフォルト 'OPT_IN'
 *   excludeNoEmail? – true: メール未登録除外（デフォルト true）
 */
function getMembersForBulkMail_(payload) {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var p = payload || {};
  var memberTypes   = p.memberTypes   || ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'];
  var memberStatus  = String(p.memberStatus  || 'ACTIVE');
  var staffStatus   = String(p.staffStatus   || 'ENROLLED');
  var mailingFilter = String(p.mailingFilter || 'OPT_IN');
  var excludeNoEmail = p.excludeNoEmail !== false;

  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet  = ss.getSheetByName('T_事業所職員');
  var members     = getSheetData_(memberSheet);
  var staffRows   = getSheetData_(staffSheet);

  // 事業所会員マップ（会員ID → 会員行）
  var bizMemberMap = {};
  members.forEach(function(m) {
    if (String(m['会員種別コード'] || '') === 'BUSINESS' && !toBoolean_(m['削除フラグ'])) {
      bizMemberMap[String(m['会員ID'] || '')] = m;
    }
  });

  var results = [];

  // ── 個人会員 / 賛助会員 ──────────────────────────────────────
  members.forEach(function(m) {
    if (toBoolean_(m['削除フラグ'])) return;
    var mtype = String(m['会員種別コード'] || '');
    if (mtype !== 'INDIVIDUAL' && mtype !== 'SUPPORT') return;
    if (memberTypes.indexOf(mtype) < 0) return;
    var status = String(m['会員状態コード'] || '');
    if (memberStatus === 'ACTIVE' && status !== 'ACTIVE') return;

    var lastName   = String(m['姓']  || '').trim();
    var firstName  = String(m['名']  || '').trim();
    var name       = lastName + firstName;
    var displayName = (lastName + ' ' + firstName).trim() || name;
    var email      = String(m['代表メールアドレス'] || '').trim();
    if (excludeNoEmail && !email) return;

    results.push({
      recipientKey: String(m['会員ID'] || ''),
      memberType:   mtype,
      memberId:     String(m['会員ID'] || ''),
      staffId:      null,
      lastName:     lastName,
      firstName:    firstName,
      name:         name,
      displayName:  displayName,
      email:        email,
      officeName:   String(m['勤務先名'] || '').trim(),
      memberStatus: status,
      staffStatus:  null,
      mailingOptOut: false,
    });
  });

  // ── 事業所職員 ──────────────────────────────────────────────
  if (memberTypes.indexOf('BUSINESS') >= 0) {
    staffRows.forEach(function(s) {
      if (toBoolean_(s['削除フラグ'])) return;
      var sStatus = String(s['職員状態コード'] || '');
      if (staffStatus === 'ENROLLED' && sStatus !== 'ENROLLED') return;

      var parentMemberId = String(s['会員ID'] || '');
      var parent = bizMemberMap[parentMemberId];
      if (!parent) return;

      // 親会員の在籍状態チェック
      if (memberStatus === 'ACTIVE' && String(parent['会員状態コード'] || '') !== 'ACTIVE') return;

      var mailingCode = String(s['メール配信希望コード'] || '').trim().toUpperCase();
      var isOptOut    = mailingCode === 'NO';
      if (mailingFilter === 'OPT_IN' && isOptOut) return;

      var lastName   = String(s['姓']  || '').trim();
      var firstName  = String(s['名']  || '').trim();
      var name       = lastName + firstName || String(s['氏名'] || '').trim();
      var displayName = (lastName + ' ' + firstName).trim() || name;
      var email      = String(s['メールアドレス'] || '').trim();
      if (excludeNoEmail && !email) return;

      results.push({
        recipientKey:  String(s['職員ID'] || ''),
        memberType:    'BUSINESS',
        memberId:      parentMemberId,
        staffId:       String(s['職員ID'] || ''),
        lastName:      lastName,
        firstName:     firstName,
        name:          name,
        displayName:   displayName,
        email:         email,
        officeName:    String(parent['勤務先名'] || '').trim(),
        memberStatus:  String(parent['会員状態コード'] || ''),
        staffStatus:   sStatus,
        mailingOptOut: isOptOut,
      });
    });
  }

  return results;
}

/**
 * 会員一括メール送信。
 * payload:
 *   recipientKeys: string[]              – 送信対象の recipientKey リスト
 *   from: string                         – 送信元メールアドレス（エイリアス含む）
 *   subject: string                      – 件名テンプレート（{{氏名}} {{事業所名}} {{会員番号}}）
 *   body: string                         – 本文テンプレート
 *   commonAttachments?: Array<{name, mimeType, base64}>
 *   individualAttachments?: Record<recipientKey, {name, mimeType, base64}>
 *   useAutoAttach?: boolean              – Drive自動添付を使用するか（デフォルト true）
 *   memberTypes?, memberStatus?, staffStatus?, mailingFilter?, excludeNoEmail?
 *     └── バックエンド側でも再フィルタ（セキュリティ担保）
 */
function sendBulkMemberMail_(payload) {
  if (!payload) throw new Error('パラメータが不足しています。');

  var recipientKeys = payload.recipientKeys;
  if (!recipientKeys || !recipientKeys.length) throw new Error('宛先が選択されていません。');

  var subject = String(payload.subject || '').trim();
  var body    = String(payload.body    || '').trim();
  if (!subject || !body) throw new Error('件名と本文は必須です。');

  // ── 送信元エイリアス検証 ──────────────────────────────────────
  var ownerEmail    = Session.getEffectiveUser().getEmail();
  var validAliases  = [ownerEmail];
  try { validAliases = validAliases.concat(GmailApp.getAliases()); } catch (e) {}
  var from = String(payload.from || '').trim();
  if (!from || validAliases.indexOf(from) < 0) from = ownerEmail;

  // ── 全宛先リストを再取得（セキュリティ: フロント送信値を信用しない） ──
  var filterPayload = {
    memberTypes:    payload.memberTypes    || ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'],
    memberStatus:   payload.memberStatus   || 'ACTIVE',
    staffStatus:    payload.staffStatus    || 'ENROLLED',
    mailingFilter:  'ALL',  // 送信時は全員対象（フロント側で絞り込み済みキーを送る）
    excludeNoEmail: false,  // キーで絞るのでここでは除外しない
  };
  var allRecipients = getMembersForBulkMail_(filterPayload);

  var keySet = {};
  recipientKeys.forEach(function(k) { keySet[String(k)] = true; });
  var targetRecipients = allRecipients.filter(function(r) {
    return keySet[String(r.recipientKey)];
  });
  if (!targetRecipients.length) throw new Error('送信対象が見つかりませんでした。');

  // ── 共通添付ファイル ──────────────────────────────────────────
  var commonAttachments = (payload.commonAttachments || []).map(function(att) {
    var bytes = Utilities.base64Decode(att.base64);
    return Utilities.newBlob(bytes, att.mimeType, att.name);
  });

  // ── Drive 自動添付マップ構築 ──────────────────────────────────
  var autoAttachMap = {};  // filename → DriveFile
  var useAutoAttach = payload.useAutoAttach !== false;
  var folderId = '';
  if (useAutoAttach) {
    var settingsSs = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    folderId = String(getSystemSettingValue_(settingsSs, 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID') || '').trim();
    if (folderId) {
      try {
        var folder = DriveApp.getFolderById(folderId);
        var fileIter = folder.getFiles();
        while (fileIter.hasNext()) {
          var f = fileIter.next();
          autoAttachMap[f.getName()] = f;
        }
      } catch (fe) {
        Logger.log('sendBulkMemberMail_: Drive自動添付フォルダ取得失敗: ' + fe.message);
      }
    }
  }

  // ── 送信ループ ────────────────────────────────────────────────
  var errors          = [];
  var autoAttachMissed = [];
  var sentCount       = 0;
  var fileNames       = Object.keys(autoAttachMap);
  var indvAttachMap   = payload.individualAttachments || {};

  for (var i = 0; i < targetRecipients.length; i += 1) {
    var rec = targetRecipients[i];
    if (!rec.email) {
      errors.push({ recipientKey: rec.recipientKey, displayName: rec.displayName, error: 'メールアドレス未登録' });
      continue;
    }

    try {
      // 差し込みタグ置換
      var personalSubject = subject
        .replace(/\{\{氏名\}\}/g,   rec.displayName)
        .replace(/\{\{事業所名\}\}/g, rec.officeName || '')
        .replace(/\{\{会員番号\}\}/g, rec.memberId   || '');
      var personalBody = body
        .replace(/\{\{氏名\}\}/g,   rec.displayName)
        .replace(/\{\{事業所名\}\}/g, rec.officeName || '')
        .replace(/\{\{会員番号\}\}/g, rec.memberId   || '');

      var allAttachments = commonAttachments.slice();

      // Drive 自動添付（姓名部分一致、先頭1件）
      if (useAutoAttach && folderId && rec.name) {
        var matchedFile = null;
        for (var j = 0; j < fileNames.length; j += 1) {
          if (fileNames[j].indexOf(rec.name) >= 0) {
            matchedFile = autoAttachMap[fileNames[j]];
            break;
          }
        }
        if (matchedFile) {
          try { allAttachments.push(matchedFile.getBlob()); } catch (be) {
            Logger.log('自動添付 blob 取得失敗: ' + rec.name + ': ' + be.message);
          }
        } else {
          autoAttachMissed.push(rec.displayName);
        }
      }

      // 個人追加添付
      var indvAtt = indvAttachMap[String(rec.recipientKey)];
      if (indvAtt) {
        var indvBytes = Utilities.base64Decode(indvAtt.base64);
        allAttachments.push(Utilities.newBlob(indvBytes, indvAtt.mimeType, indvAtt.name));
      }

      GmailApp.sendEmail(rec.email, personalSubject, personalBody, {
        from:        from,
        replyTo:     from,
        name:        '枚方市介護支援専門員連絡協議会',
        attachments: allAttachments,
      });
      sentCount += 1;
    } catch (e) {
      errors.push({ recipientKey: rec.recipientKey, displayName: rec.displayName, error: e.message });
    }
  }

  // ── T_メール送信ログ記録（append-only、個人情報なし） ────────────
  var logId = Utilities.getUuid();
  var now   = new Date().toISOString();
  try {
    var logSs    = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    var logSheet = logSs.getSheetByName('T_メール送信ログ');
    if (logSheet) {
      appendRowsByHeaders_(logSheet, [{
        'ログID':       logId,
        '送信日時':     now,
        '送信者メール': from,
        '件名テンプレート': subject.substring(0, 200),
        '宛先数':       targetRecipients.length,
        '成功数':       sentCount,
        'エラー数':     errors.length,
        '送信種別':     'BULK_MEMBER',
        '削除フラグ':   false,
      }]);
    }
  } catch (le) {
    Logger.log('sendBulkMemberMail_: ログ記録失敗: ' + le.message);
  }

  return {
    sent:             sentCount,
    total:            targetRecipients.length,
    errors:           errors.map(function(e) { return e.displayName + ': ' + e.error; }),
    autoAttachMissed: autoAttachMissed,
    logId:            logId,
  };
}

/**
 * メール送信ログ取得。
 * 閲覧権限は T_システム設定.EMAIL_LOG_VIEWER_ROLE で動的チェック。
 * 設定値: 'MASTER' または 'MASTER,ADMIN' のどちらか。
 */
function getEmailSendLog_(payload) {
  var p = payload || {};
  var callerPermLevel = String(
    (p.__adminSession && p.__adminSession.adminPermissionLevel) || 'ADMIN'
  );

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var viewerRole = String(getSystemSettingValue_(ss, 'EMAIL_LOG_VIEWER_ROLE') || 'MASTER').trim();
  var allowedRoles = viewerRole.split(',').map(function(r) { return r.trim(); });
  if (allowedRoles.indexOf(callerPermLevel) < 0) {
    throw new Error('メール送信ログの閲覧権限がありません。（権限: ' + callerPermLevel + '）');
  }

  var logSheet = ss.getSheetByName('T_メール送信ログ');
  if (!logSheet || logSheet.getLastRow() < 2) return [];

  var rows = getSheetData_(logSheet).filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  rows.sort(function(a, b) {
    return String(b['送信日時'] || '').localeCompare(String(a['送信日時'] || ''));
  });

  return rows.map(function(r) {
    return {
      logId:           String(r['ログID']       || ''),
      sentAt:          String(r['送信日時']      || ''),
      senderEmail:     String(r['送信者メール']  || ''),
      subjectTemplate: String(r['件名テンプレート'] || ''),
      totalCount:      Number(r['宛先数']   || 0),
      successCount:    Number(r['成功数']   || 0),
      errorCount:      Number(r['エラー数'] || 0),
      sendType:        String(r['送信種別'] || ''),
    };
  });
}
