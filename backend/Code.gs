var DB_SPREADSHEET_ID_KEY = 'DB_SPREADSHEET_ID';
var DB_SPREADSHEET_NAME = '枚方市ケアマネ協議会_DB';
var DB_SPREADSHEET_ID_FIXED = '1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs';
var SCHEMA_INITIALIZED_KEY = 'DB_SCHEMA_INITIALIZED';
var ADMIN_GOOGLE_CLIENT_ID_KEY = 'ADMIN_GOOGLE_CLIENT_ID';
var DEFAULT_BUSINESS_STAFF_LIMIT_KEY = 'DEFAULT_BUSINESS_STAFF_LIMIT';
var TRAINING_HISTORY_LOOKBACK_MONTHS_KEY = 'TRAINING_HISTORY_LOOKBACK_MONTHS';
var DB_SCHEMA_VERSION = '2026-03-09-02';

var マスタ定義 = {
  M_会員種別: ['コード', '名称', '表示順', '有効フラグ'],
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
};

var マスタ初期値 = {
  M_会員種別: [
    ['INDIVIDUAL', '個人会員', 1, true],
    ['BUSINESS', '事業所会員', 2, true],
    ['SUPPORT', '賛助会員', 3, true],
  ],
  M_会員状態: [
    ['ACTIVE', '有効', 1, true],
    ['WITHDRAWN', '退会', 2, true],
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
    ['ADMIN', '管理者', 1, true],
    ['STAFF', '一般', 2, true],
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
};

var テーブル定義 = {
  T_会員: [
    '会員ID',
    '会員種別コード',
    '会員状態コード',
    '入会日',
    '退会日',
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
    '氏名',
    'フリガナ',
    'メールアドレス',
    '職員権限コード',
    '職員状態コード',
    '入会日',
    '退会日',
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
    'GoogleユーザーID',
    'Googleメール',
    '表示名',
    '紐付け認証ID',
    '紐付け会員ID',
    '有効フラグ',
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
  ['T_年会費納入履歴', '会費納入状態コード', 'M_会費納入状態'],
  ['T_画面項目権限', 'システムロールコード', 'M_システムロール'],
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
  PropertiesService.getScriptProperties().setProperty(SCHEMA_INITIALIZED_KEY, 'true');
  return getDbInfo_();
}

/**
 * DBスキーマを再構築する。
 * 既存の定義外シートは削除し、定義シートのヘッダー/入力規則/保護を再適用する。
 */
function rebuildDatabaseSchema() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  PropertiesService.getScriptProperties().setProperty(SCHEMA_INITIALIZED_KEY, 'true');
  return {
    スプレッドシートID: ss.getId(),
    削除シート一覧: cleanupNonSchemaSheets_(ss),
    シート一覧: ss.getSheets().map(function(sheet) {
      return sheet.getName();
    }),
  };
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
  PropertiesService.getScriptProperties().setProperty(SCHEMA_INITIALIZED_KEY, 'true');
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

/**
 * 管理者Google認証を有効化するセットアップ関数。
 * 1. ADMIN_GOOGLE_CLIENT_ID を Script Properties に保存する。
 * 2. T_管理者Googleホワイトリストのデモ用 GoogleユーザーID（プレースホルダ）を
 *    クリアして、メールアドレスによるフォールバックマッチングを有効にする。
 *
 * 使い方:
 *   npx clasp run setupAdminAuth -- '["YOUR_OAUTH_CLIENT_ID"]'
 *   例: npx clasp run setupAdminAuth -- '["123456789-abc.apps.googleusercontent.com"]'
 *
 * OAuthクライアントIDの確認場所:
 *   GCP Console > APIとサービス > 認証情報 > admin-google-login-web
 */
function setupAdminAuth(clientId) {
  if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
    throw new Error('clientId が空です。GCP Console から OAuth クライアントIDを取得して渡してください。');
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(ADMIN_GOOGLE_CLIENT_ID_KEY, clientId.trim());

  // ホワイトリストのデモ用プレースホルダ sub ID をクリア（メール照合フォールバックを有効にする）
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (sheet && sheet.getLastRow() >= 2) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var subColIdx = headers.indexOf('GoogleユーザーID');
    if (subColIdx >= 0) {
      var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
      for (var i = 0; i < rows.length; i += 1) {
        var sub = String(rows[i][subColIdx] || '');
        // デモ用プレースホルダ（'demo-'で始まる値）のみクリア
        if (sub.indexOf('demo-') === 0) {
          sheet.getRange(i + 2, subColIdx + 1).setValue('');
        }
      }
    }
  }

  return {
    ok: true,
    adminGoogleClientIdSet: clientId.trim(),
    message: 'ADMIN_GOOGLE_CLIENT_ID を設定し、ホワイトリストのデモ sub ID をクリアしました。管理者ログインを有効化するには、GAS を再デプロイしてください。',
  };
}

/**
 * 現在の管理者認証設定を確認する。
 * 使い方: npx clasp run checkAdminAuthConfig
 */
function checkAdminAuthConfig() {
  var props = PropertiesService.getScriptProperties();
  var clientId = props.getProperty(ADMIN_GOOGLE_CLIENT_ID_KEY) || '';

  var ss = getOrCreateDatabase_();
  var wlRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
  });

  var whitelist = wlRows.map(function(r) {
    return {
      id: String(r['ホワイトリストID'] || ''),
      email: String(r['Googleメール'] || ''),
      googleUserId: String(r['GoogleユーザーID'] || ''),
      matchMode: String(r['GoogleユーザーID'] || '') ? 'sub' : 'email（フォールバック）',
      displayName: String(r['表示名'] || ''),
    };
  });

  return {
    adminGoogleClientIdConfigured: clientId !== '',
    adminGoogleClientId: clientId ? clientId.substring(0, 12) + '...' : '（未設定）',
    whitelistCount: whitelist.length,
    whitelist: whitelist,
  };
}

/**
 * スクリプトオーナーの Google sub ID とメールアドレスを返す。
 * WL-001 の GoogleユーザーID を実値に更新するために使用する。
 * 使い方: npx clasp run getOwnerSubId
 */
function getOwnerSubId() {
  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('UserInfo API エラー: ' + response.getContentText());
  }
  var info = JSON.parse(response.getContentText());
  return { sub: info.sub, email: info.email };
}

/**
 * ホワイトリストの指定エントリの GoogleユーザーID を更新する。
 * 使い方: npx clasp run updateWhitelistSub --params '["WL-001","実際のsub値"]'
 */
function updateWhitelistSub(whitelistId, sub) {
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません。');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idColIdx = headers.indexOf('ホワイトリストID');
  var subColIdx = headers.indexOf('GoogleユーザーID');
  if (idColIdx < 0 || subColIdx < 0) throw new Error('列が見つかりません。');
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i][idColIdx]) === whitelistId) {
      sheet.getRange(i + 2, subColIdx + 1).setValue(sub);
      return { ok: true, updated: whitelistId, sub: sub };
    }
  }
  throw new Error('ホワイトリストID が見つかりません: ' + whitelistId);
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
    var parsedPayload = parsePayload_(payload);
    applyWithdrawalDeletionPolicy_();

    // ── アクセス制御（二重防御）────────────────────────────────
    // 管理者専用アクションは processApiRequest レベルで早期リジェクト。
    // 各関数内の checkAdminBySession_() チェックと合わせて二重防御とする。
    // 公開ポータル URL（?app=public）からこれらのアクションを呼んでも
    // 必ず unauthorized で返るため、URL 分離の信頼性を担保する。
    var ADMIN_REQUIRED_ACTIONS = [
      'getDbInfo', 'getSystemSettings', 'updateSystemSettings',
      'sendTrainingReminder', 'seedDemoData', 'saveTraining',
      'uploadTrainingFile', 'getTrainingApplicants',
      'getAdminEmailAliases', 'sendTrainingMail',
    ];
    if (ADMIN_REQUIRED_ACTIONS.indexOf(action) !== -1 && !checkAdminBySession_()) {
      return JSON.stringify({ success: false, error: 'unauthorized' });
    }
    // ─────────────────────────────────────────────────────────

    if (action === 'fetchAllData') {
      return JSON.stringify({
        success: true,
        data: fetchAllDataFromDb_(),
      });
    }

    if (action === 'updateMember') {
      return JSON.stringify({
        success: true,
        data: updateMember_(parsedPayload),
      });
    }

    if (action === 'getDbInfo') {
      return JSON.stringify({ success: true, data: getDbInfo_() });
    }

    if (action === 'changePassword') {
      return JSON.stringify({ success: true, data: changePassword_(parsedPayload) });
    }

    if (action === 'memberLogin') {
      return JSON.stringify({ success: true, data: memberLogin_(parsedPayload) });
    }

    if (action === 'adminGoogleLogin') {
      return JSON.stringify({ success: true, data: adminGoogleLogin_(parsedPayload) });
    }

    if (action === 'checkAdminBySession') {
      return JSON.stringify({ success: true, data: checkAdminBySession_() });
    }

    if (action === 'getAuthConfig') {
      return JSON.stringify({ success: true, data: getAuthConfig_() });
    }

    if (action === 'getSystemSettings') {
      return JSON.stringify({ success: true, data: getSystemSettings_() });
    }

    if (action === 'updateSystemSettings') {
      return JSON.stringify({ success: true, data: updateSystemSettings_(parsedPayload) });
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
      職員権限コード: 'ADMIN',
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
      職員権限コード: 'STAFF',
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
      GoogleユーザーID: 'demo-google-sub-001',
      Googleメール: 'k.noguchi@uguisunosato.or.jp',
      表示名: '運用管理者',
      紐付け認証ID: 'AUTH-ADMIN-GOOGLE',
      紐付け会員ID: '99999999',
      有効フラグ: true,
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);

  appendRowsByHeaders_(ss, 'T_研修', [
    {
      研修ID: 'T001',
      研修名: '令和8年度 介護報酬改定に伴う実務研修',
      開催日: '2026-02-15',
      定員: 100,
      申込者数: 85,
      開催場所: 'オンライン (Zoom)',
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: false,
      研修概要: '介護報酬改定の実務対応ポイントを解説します。',
      研修内容: '改定内容の要点、請求・記録の実務対応、質疑応答を行います。現場での運用変更点を具体例で確認します。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 0 }, { label: '非会員', amount: 1000 }]),
      申込開始日: '2026-01-10',
      申込締切日: '2026-02-10',
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
      開催日: '2026-03-10',
      定員: 40,
      申込者数: 40,
      開催場所: '枚方市市民会館 会議室A',
      研修状態コード: 'CLOSED',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: true,
      研修概要: '認知症ケアの実践事例とリーダー育成を扱います。',
      研修内容: 'ケーススタディを通じて、チームでの支援方針策定と多職種連携を学びます。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 2000 }, { label: '非会員', amount: 3000 }]),
      申込開始日: '2026-02-01',
      申込締切日: '2026-03-01',
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
      開催日: '2026-04-18',
      定員: 60,
      申込者数: 18,
      開催場所: '枚方市総合文化芸術センター 第2会議室',
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: false,
      研修概要: '提出書類の点検観点を実例ベースで学ぶ実践型研修です。',
      研修内容: '事前配布資料のケースに沿って、算定根拠・記録整合性・加算要件を確認します。少人数グループで相互レビューを行います。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 1000 }, { label: '非会員', amount: 4000 }]),
      申込開始日: '2026-03-01',
      申込締切日: '2026-04-12',
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
      開催日: '2026-05-09',
      定員: 120,
      申込者数: 45,
      開催場所: 'オンライン (Zoom)',
      研修状態コード: 'OPEN',
      主催者: '枚方市介護支援専門員連絡協議会',
      法定外研修フラグ: true,
      研修概要: '多職種連携の最新実務と連絡票運用を整理します。',
      研修内容: '訪問診療・訪問看護・薬局・ケアマネの連携フローを、事例とテンプレートで確認します。オンライン参加向け資料も配布します。',
      費用JSON: JSON.stringify([{ label: '会員', amount: 0 }, { label: '非会員', amount: 2000 }]),
      申込開始日: '2026-03-15',
      申込締切日: '2026-05-02',
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
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    },
  ]);

  appendRowsByHeaders_(ss, 'T_年会費納入履歴', [
    { 年会費履歴ID: 'FY-001', 会員ID: '12345678', 対象年度: 2025, 会費納入状態コード: 'PAID', 納入確認日: '2025-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-002', 会員ID: '12345678', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-003', 会員ID: '87654321', 対象年度: 2025, 会費納入状態コード: 'UNPAID', 納入確認日: '', 金額: 5000, 備考: JSON.stringify(DEMO_TRANSFER_ACCOUNT), 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-004', 会員ID: '87654321', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-007', 会員ID: '934567890', 対象年度: 2025, 会費納入状態コード: 'PAID', 納入確認日: '2025-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-008', 会員ID: '934567890', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-005', 会員ID: '99999999', 対象年度: 2025, 会費納入状態コード: 'PAID', 納入確認日: '2025-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 年会費履歴ID: 'FY-006', 会員ID: '99999999', 対象年度: 2024, 会費納入状態コード: 'PAID', 納入確認日: '2024-05-01', 金額: 5000, 備考: '', 作成日時: now, 更新日時: now, 削除フラグ: false },
  ]);

  return {
    message: 'デモデータ投入完了',
    dbInfo: getDbInfo_(),
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

function parseTrainingOptions_(raw) {
  var defaultResult = {
    fieldConfig: null,
    cancelAllowed: false,
    inquiryPerson: '',
    inquiryContactType: 'PHONE',
    inquiryContactValue: '',
  };
  var text = String(raw || '').trim();
  if (!text) return defaultResult;
  try {
    var parsed = JSON.parse(text);
    if (parsed && parsed.fieldConfig !== undefined) {
      return {
        fieldConfig: parsed.fieldConfig || null,
        cancelAllowed: parsed.cancelAllowed === true,
        inquiryPerson: String(parsed.inquiryPerson || ''),
        inquiryContactType: String(parsed.inquiryContactType || 'PHONE') === 'EMAIL' ? 'EMAIL' : 'PHONE',
        inquiryContactValue: String(parsed.inquiryContactValue || ''),
      };
    }
    // 旧形式（fieldConfigオブジェクトのみ）
    return {
      fieldConfig: parsed || null,
      cancelAllowed: false,
      inquiryPerson: '',
      inquiryContactType: 'PHONE',
      inquiryContactValue: '',
    };
  } catch (e) {
    return defaultResult;
  }
}

function serializeTrainingOptions_(fieldConfig, cancelAllowed, inquiryPerson, inquiryContactType, inquiryContactValue) {
  return JSON.stringify({
    fieldConfig: fieldConfig || null,
    cancelAllowed: cancelAllowed === true,
    inquiryPerson: String(inquiryPerson || ''),
    inquiryContactType: String(inquiryContactType || 'PHONE') === 'EMAIL' ? 'EMAIL' : 'PHONE',
    inquiryContactValue: String(inquiryContactValue || ''),
  });
}

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

function fetchAllDataFromDb_() {
  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var trainingRows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var applicationRows = getRowsAsObjects_(ss, 'T_研修申込').filter(function(r) { return !toBoolean_(r['削除フラグ']) && String(r['申込状態コード'] || '') === 'APPLIED'; });
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) { return !toBoolean_(r['削除フラグ']); });

  var loginByMemberId = {};
  var loginByStaffId = {};
  for (var i = 0; i < authRows.length; i += 1) {
    var a = authRows[i];
    if (String(a['認証方式'] || '') !== 'PASSWORD') continue;
    if (!toBoolean_(a['アカウント有効フラグ'])) continue;
    var memberId = String(a['会員ID'] || '');
    var staffId = String(a['職員ID'] || '');
    if (staffId) {
      loginByStaffId[staffId] = String(a['ログインID'] || '');
    } else if (memberId) {
      loginByMemberId[memberId] = String(a['ログインID'] || '');
    }
  }

  var trainings = trainingRows.map(function(t) {
    // 費用JSON: JSON配列。旧データ(数値文字列)は会員費用として変換
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

    // 項目設定JSON（旧形式: fieldConfigのみ / 新形式: { fieldConfig, cancelAllowed }）
    var trainingOptions = parseTrainingOptions_(t['項目設定JSON']);

    return {
      id: String(t['研修ID'] || ''),
      title: String(t['研修名'] || ''),
      summary: String(t['研修概要'] || ''),
      description: String(t['研修内容'] || ''),
      guidePdfUrl: String(t['案内状URL'] || ''),
      date: formatDateForApi_(t['開催日']),
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
    };
  });

  var applicationsByMember = {};
  var applicationsByStaff = {};
  for (var j = 0; j < applicationRows.length; j += 1) {
    var app = applicationRows[j];
    var trainingId = String(app['研修ID'] || '');
    var appMemberId = String(app['会員ID'] || '');
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
  for (var k = 0; k < feeRows.length; k += 1) {
    var f = feeRows[k];
    var feeMemberId = String(f['会員ID'] || '');
    if (!feeByMember[feeMemberId]) feeByMember[feeMemberId] = [];
    var feeItem = {
      year: Number(f['対象年度'] || 0),
      status: String(f['会費納入状態コード'] || 'UNPAID'),
    };
    if (feeItem.status === 'UNPAID') {
      feeItem.transferAccount = parseTransferAccount_(f['備考']);
    }
    feeByMember[feeMemberId].push(feeItem);
  }

  var staffByMember = {};
  for (var s = 0; s < staffRows.length; s += 1) {
    var st = staffRows[s];
    var stMemberId = String(st['会員ID'] || '');
    if (!staffByMember[stMemberId]) staffByMember[stMemberId] = [];
    var stId = String(st['職員ID'] || '');
    staffByMember[stMemberId].push({
      id: stId,
      loginId: loginByStaffId[stId] || '',
      name: String(st['氏名'] || ''),
      kana: String(st['フリガナ'] || ''),
      email: String(st['メールアドレス'] || ''),
      role: String(st['職員権限コード'] || 'STAFF'),
      status: String(st['職員状態コード'] || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED',
      joinedDate: String(st['入会日'] || ''),
      withdrawnDate: String(st['退会日'] || ''),
      midYearWithdrawal: false,
      participatedTrainingIds: uniqueStrings_(applicationsByStaff[stId] || []),
    });
  }

  var members = memberRows.map(function(m) {
    var id = String(m['会員ID'] || '');
    var type = String(m['会員種別コード'] || 'INDIVIDUAL');
    var history = (feeByMember[id] || []).sort(function(a, b) { return b.year - a.year; }).slice(0, 2);
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
      status: String(m['会員状態コード'] || 'ACTIVE') === 'WITHDRAWN' ? 'WITHDRAWN' : 'ACTIVE',
      joinedDate: String(m['入会日'] || ''),
      withdrawnDate: String(m['退会日'] || ''),
      midYearWithdrawal: false,
      annualFeeHistory: history,
      participatedTrainingIds: type === 'BUSINESS' ? [] : uniqueStrings_(applicationsByMember[id] || []),
    };
  });

  return {
    members: members,
    trainings: trainings,
  };
}

function parseTransferAccount_(raw) {
  if (!raw) return DEMO_TRANSFER_ACCOUNT;
  var txt = String(raw);
  try {
    var parsed = JSON.parse(txt);
    if (parsed && parsed.bankName && parsed.accountNumber) {
      return parsed;
    }
  } catch (e) {}
  return DEMO_TRANSFER_ACCOUNT;
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
  if (!request || !request.loginId || !request.newPassword) {
    throw new Error('パスワード変更パラメータが不足しています。');
  }

  var loginId = String(request.loginId).trim();
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

function adminGoogleLogin_(request) {
  if (!request || !request.idToken) {
    throw new Error('Google IDトークンが必要です。');
  }

  var claims = verifyGoogleIdToken_(String(request.idToken));
  var sub = String(claims.sub || '');
  var email = String(claims.email || '').toLowerCase();
  if (!sub) {
    throw new Error('GoogleトークンからユーザーIDを取得できませんでした。');
  }

  var ss = getOrCreateDatabase_();
  var whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
  });

  var matched = null;
  for (var i = 0; i < whitelistRows.length; i += 1) {
    var w = whitelistRows[i];
    var wSub = String(w['GoogleユーザーID'] || '');
    var wEmail = String(w['Googleメール'] || '').toLowerCase();
    if (wSub && wSub === sub) {
      matched = w;
      break;
    }
    if (!wSub && wEmail && wEmail === email) {
      matched = w;
      break;
    }
  }

  if (!matched) {
    appendLoginHistory_(ss, '', email, 'GOOGLE', 'FAILURE', 'ホワイトリスト未登録');
    throw new Error('管理者権限がありません。');
  }

  var linkedAuthId = String(matched['紐付け認証ID'] || '');
  var linkedMemberId = String(matched['紐付け会員ID'] || '');
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var linkedAuth = null;
  for (var j = 0; j < authRows.length; j += 1) {
    var a = authRows[j];
    if (linkedAuthId && String(a['認証ID'] || '') === linkedAuthId) {
      linkedAuth = a;
      break;
    }
    if (!linkedAuthId && String(a['GoogleユーザーID'] || '') === sub) {
      linkedAuth = a;
      break;
    }
  }

  if (!linkedAuth) {
    appendLoginHistory_(ss, linkedAuthId, email, 'GOOGLE', 'FAILURE', '紐付け認証ID未整備');
    throw new Error('管理者の認証紐付けが未設定です。');
  }

  var authId = String(linkedAuth['認証ID'] || '');
  var roleCode = String(linkedAuth['システムロールコード'] || '');
  var memberId = linkedMemberId || String(linkedAuth['会員ID'] || '');
  var staffId = String(linkedAuth['職員ID'] || '');
  if (!memberId) {
    appendLoginHistory_(ss, authId, email, 'GOOGLE', 'FAILURE', '会員ID未紐付け');
    throw new Error('管理者に会員IDが紐付いていません。');
  }

  var nowIso = new Date().toISOString();
  appendLoginHistory_(ss, authId, email, 'GOOGLE', 'SUCCESS', '管理者Googleログイン成功');

  return {
    authMethod: 'GOOGLE',
    loginId: email,
    memberId: memberId,
    staffId: staffId,
    roleCode: roleCode,
    canAccessAdminPage: true,
    displayName: String(matched['表示名'] || claims.name || ''),
    authenticatedAt: nowIso,
  };
}

/**
 * google.script.run 経由で呼び出し元の Google セッションを検証し、管理者認証を行う。
 * Session.getActiveUser() は google.script.run 呼び出し元のメールを返す（Execute as: Me でも）。
 */
function checkAdminBySession_() {
  var email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error('Googleアカウントでログインされていません。組織のGoogleアカウントでブラウザにログインしてください。');
  }
  email = email.toLowerCase();

  var ss = getOrCreateDatabase_();
  var whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
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

  var linkedAuthId = String(matched['紐付け認証ID'] || '');
  var linkedMemberId = String(matched['紐付け会員ID'] || '');
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var linkedAuth = null;
  for (var j = 0; j < authRows.length; j += 1) {
    var a = authRows[j];
    if (linkedAuthId && String(a['認証ID'] || '') === linkedAuthId) { linkedAuth = a; break; }
  }

  if (!linkedAuth) {
    appendLoginHistory_(ss, linkedAuthId, email, 'GOOGLE', 'FAILURE', '紐付け認証ID未整備（セッション認証）');
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

  var nowIso = new Date().toISOString();
  appendLoginHistory_(ss, authId, email, 'GOOGLE', 'SUCCESS', '管理者セッション認証成功');

  return {
    authMethod: 'GOOGLE',
    loginId: email,
    memberId: memberId,
    staffId: staffId,
    roleCode: roleCode,
    canAccessAdminPage: true,
    displayName: String(matched['表示名'] || ''),
    authenticatedAt: nowIso,
  };
}

function getAuthConfig_() {
  var scriptProperties = PropertiesService.getScriptProperties();
  return {
    adminGoogleClientId: String(scriptProperties.getProperty(ADMIN_GOOGLE_CLIENT_ID_KEY) || ''),
  };
}

function getSystemSettings_() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  var raw = Number(getSystemSettingValue_(ss, 'DEFAULT_BUSINESS_STAFF_LIMIT') || 10);
  var lookbackRaw = Number(getSystemSettingValue_(ss, 'TRAINING_HISTORY_LOOKBACK_MONTHS') || 18);
  var value = Math.floor(raw);
  var lookback = Math.floor(lookbackRaw);
  if (!isFinite(value) || value < 1) value = 10;
  if (!isFinite(lookback) || lookback < 1) lookback = 18;
  return {
    defaultBusinessStaffLimit: value,
    trainingHistoryLookbackMonths: lookback,
  };
}

function updateSystemSettings_(request) {
  if (!request) throw new Error('settings が空です。');
  var next = Number(request.defaultBusinessStaffLimit || 0);
  var lookbackRaw = request.trainingHistoryLookbackMonths;
  var lookback = Number(lookbackRaw);
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
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  upsertSystemSetting_(ss, 'DEFAULT_BUSINESS_STAFF_LIMIT', String(Math.floor(next)), '事業所会員メンバー上限（全体デフォルト）');
  upsertSystemSetting_(ss, 'TRAINING_HISTORY_LOOKBACK_MONTHS', String(Math.floor(lookback)), '研修履歴の表示期間（月）');
  upsertSystemSetting_(ss, 'DB_SCHEMA_VERSION', DB_SCHEMA_VERSION, 'DBスキーマバージョン');
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(DEFAULT_BUSINESS_STAFF_LIMIT_KEY, String(Math.floor(next))); // backward compatibility
  scriptProperties.setProperty(TRAINING_HISTORY_LOOKBACK_MONTHS_KEY, String(Math.floor(lookback))); // backward compatibility
  return getSystemSettings_();
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

function updateMember_(payload) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var ss = getOrCreateDatabase_();
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
    midYearWithdrawal: fromPayloadOrCurrent('midYearWithdrawal', false),
  };
  validateMemberPayload_(mergedPayload, memberTypeCode);
  var sharedMobile = memberTypeCode === 'BUSINESS' && !String(mergedPayload.mobilePhone || '').trim()
    ? String(mergedPayload.phone || '')
    : String(mergedPayload.mobilePhone || '');

  function setCol(name, value) {
    var idx = cols[name];
    if (idx != null) row[idx] = value !== undefined ? value : '';
  }

  setCol('姓', mergedPayload.lastName || '');
  setCol('名', mergedPayload.firstName || '');
  setCol('セイ', mergedPayload.lastKana || '');
  setCol('メイ', mergedPayload.firstKana || '');
  var nextStatus = String(mergedPayload.status || 'ACTIVE') === 'WITHDRAWN' ? 'WITHDRAWN' : 'ACTIVE';
  setCol('会員状態コード', nextStatus);
  setCol('入会日', normalizeDateInput_(mergedPayload.joinedDate));
  setCol('退会日', normalizeDateInput_(mergedPayload.withdrawnDate));
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
  setCol('更新日時', new Date().toISOString());
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  if (hasOwn.call(payload, 'staff')) {
    syncBusinessStaffRows_(ss, String(payload.id), memberTypeCode, payload.staff || []);
  }
  return { updated: true, memberId: String(payload.id) };
}

function validateMemberPayload_(payload, memberTypeCode) {
  function trim(v) { return String(v || '').trim(); }
  function toDate(v) {
    var text = trim(v);
    if (!text) return null;
    var parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  var isBusiness = memberTypeCode === 'BUSINESS';
  var isSupport = memberTypeCode === 'SUPPORT';

  if (!trim(payload.lastName)) throw new Error('姓は必須です。');
  if (!trim(payload.firstName)) throw new Error('名は必須です。');
  if (!trim(payload.lastKana)) throw new Error('セイは必須です。');
  if (!trim(payload.firstKana)) throw new Error('メイは必須です。');
  if (!isSupport && !trim(payload.careManagerNumber)) throw new Error('賛助会員以外は介護支援専門員番号が必須です。');

  if (isBusiness) {
    if (!trim(payload.mobilePhone) && !trim(payload.phone)) {
      throw new Error('電話番号（または事業所電話番号）が必須です。');
    }
  } else {
    if (!trim(payload.mobilePhone)) throw new Error('電話番号は必須です。');
  }

  var hasOfficeAffiliationInput =
    !!trim(payload.officeName) ||
    !!trim(payload.officePostCode) ||
    !!trim(payload.officePrefecture) ||
    !!trim(payload.officeCity) ||
    !!trim(payload.officeAddressLine) ||
    !!trim(payload.phone) ||
    !!trim(payload.fax);
  var requireOfficeInfo = isBusiness || hasOfficeAffiliationInput;
  var requireHomeInfo = !isBusiness;

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

  var joined = toDate(payload.joinedDate);
  var withdrawn = toDate(payload.withdrawnDate);
  if (trim(payload.joinedDate) && !joined) throw new Error('入会日は有効な日付で入力してください。');
  if (trim(payload.withdrawnDate) && !withdrawn) throw new Error('退会日は有効な日付で入力してください。');
  if (joined && withdrawn && joined.getTime() > withdrawn.getTime()) {
    throw new Error('退会日は入会日以降で入力してください。');
  }
  if (String(payload.status || 'ACTIVE') === 'WITHDRAWN' && !trim(payload.withdrawnDate)) {
    throw new Error('退会済み会員は退会日の入力が必須です。');
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

function applyWithdrawalDeletionPolicy_() {
  var ss = getOrCreateDatabase_();
  var now = new Date();

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
    var name = String(payload.name || '').trim();
    var kana = String(payload.kana || '').trim();
    if (!name) throw new Error('職員氏名は必須です。');
    if (!kana) throw new Error('職員フリガナは必須です。');
    var status = String(payload.status || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED';
    var joined = normalizeDateInput_(payload.joinedDate);
    var withdrawn = normalizeDateInput_(payload.withdrawnDate);
    var immediateDelete = status === 'LEFT' &&
      (payload.midYearWithdrawal === true || String(payload.midYearWithdrawal || '').toLowerCase() === 'true');
    if (status === 'LEFT' && !withdrawn) throw new Error('退職済み職員は退会日が必須です。');
    if (joined && withdrawn && new Date(joined).getTime() > new Date(withdrawn).getTime()) {
      throw new Error('職員の退会日は入会日以降で入力してください。');
    }

    upsertStaffRow_(ss, {
      職員ID: staffId,
      会員ID: String(memberId || ''),
      氏名: name,
      フリガナ: kana,
      メールアドレス: String(payload.email || ''),
      職員権限コード: String(payload.role || 'STAFF') === 'ADMIN' ? 'ADMIN' : 'STAFF',
      職員状態コード: status,
      入会日: joined,
      退会日: withdrawn,
      更新日時: nowIso,
      削除フラグ: immediateDelete,
    });
  }

  for (var existingId in byId) {
    if (!Object.prototype.hasOwnProperty.call(byId, existingId)) continue;
    if (seen[existingId]) continue;
    var rowObj = byId[existingId];
    upsertStaffRow_(ss, {
      職員ID: existingId,
      会員ID: String(memberId || ''),
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
  var found = findRowByColumnValue_(sheet, '職員ID', String(rowObject['職員ID'] || ''));
  if (!found) {
    var now = String(rowObject['更新日時'] || new Date().toISOString());
    appendRowsByHeaders_(ss, 'T_事業所職員', [{
      職員ID: String(rowObject['職員ID'] || ''),
      会員ID: String(rowObject['会員ID'] || ''),
      氏名: String(rowObject['氏名'] || ''),
      フリガナ: String(rowObject['フリガナ'] || ''),
      メールアドレス: String(rowObject['メールアドレス'] || ''),
      職員権限コード: String(rowObject['職員権限コード'] || 'STAFF'),
      職員状態コード: String(rowObject['職員状態コード'] || 'ENROLLED'),
      入会日: normalizeDateInput_(rowObject['入会日']),
      退会日: normalizeDateInput_(rowObject['退会日']),
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
  setCol('氏名', String(rowObject['氏名'] || ''));
  setCol('フリガナ', String(rowObject['フリガナ'] || ''));
  setCol('メールアドレス', String(rowObject['メールアドレス'] || ''));
  setCol('職員権限コード', String(rowObject['職員権限コード'] || 'STAFF'));
  setCol('職員状態コード', String(rowObject['職員状態コード'] || 'ENROLLED'));
  setCol('入会日', normalizeDateInput_(rowObject['入会日']));
  setCol('退会日', normalizeDateInput_(rowObject['退会日']));
  setCol('更新日時', String(rowObject['更新日時'] || new Date().toISOString()));
  setCol('削除フラグ', toBoolean_(rowObject['削除フラグ']));
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
}

function verifyGoogleIdToken_(idToken) {
  var url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = response.getResponseCode();
  var body = String(response.getContentText() || '{}');
  var parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    throw new Error('Googleトークン検証レスポンスの解析に失敗しました。');
  }

  if (code !== 200) {
    throw new Error('Googleトークン検証に失敗しました。');
  }

  var allowedAud = String(PropertiesService.getScriptProperties().getProperty(ADMIN_GOOGLE_CLIENT_ID_KEY) || '');
  if (allowedAud && String(parsed.aud || '') !== allowedAud) {
    throw new Error('Googleトークンの発行先が不正です。');
  }
  return parsed;
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
  var normalizedInquiryContact = normalizeInquiryContact_(payload.inquiryContactValue);
  var derivedStatus = deriveTrainingStatusByCloseDate_(payload.applicationCloseDate);
  payload.organizer = organizer;
  payload.location = location;
  payload.summary = summary;
  payload.status = derivedStatus;
  payload.inquiryPerson = inquiryPerson;
  payload.inquiryContactType = normalizedInquiryContact.type;
  payload.inquiryContactValue = normalizedInquiryContact.value;

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

    function setCol(name, value) {
      var idx = cols[name];
      if (idx != null) row[idx] = value !== undefined ? value : '';
    }

    setCol('研修名', payload.title || '');
    setCol('開催日', payload.date || '');
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
      payload.inquiryContactValue
    ));
    setCol('更新日時', now);

    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    return payload;
  }

  // 新規作成
  var newId = 'T' + Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
  appendRowsByHeaders_(ss, 'T_研修', [{
    '研修ID': newId,
    '研修名': payload.title || '',
    '開催日': payload.date || '',
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
      payload.inquiryContactValue
    ),
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  }]);

  payload.id = newId;
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

    var applicationRows = getRowsAsObjects_(ss, 'T_研修申込').filter(function(r) {
      return !toBoolean_(r['削除フラグ']) && String(r['申込状態コード'] || '') === 'APPLIED';
    });
    var duplicate = applicationRows.find(function(r) {
      if (String(r['研修ID'] || '') !== trainingId) return false;
      if (String(r['会員ID'] || '') !== memberId) return false;
      return String(r['職員ID'] || '') === staffId;
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
    requireColumns_(cols, ['研修ID', '会員ID', '職員ID', '申込状態コード', '取消日時', '更新日時', '削除フラグ']);

    var data = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
    var targetRowNumber = null;
    for (var r = 0; r < data.length; r += 1) {
      var row = data[r];
      var deleted = toBoolean_(row[cols['削除フラグ']]);
      if (deleted) continue;
      if (String(row[cols['研修ID']] || '') !== trainingId) continue;
      if (String(row[cols['会員ID']] || '') !== memberId) continue;
      if (String(row[cols['職員ID']] || '') !== staffId) continue;
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
  var applicationRows = getRowsAsObjects_(ss, 'T_研修申込').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
      String(r['研修ID'] || '') === String(trainingId) &&
      String(r['申込状態コード'] || '') === 'APPLIED';
  });
  return applicationRows.length;
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
  createTableSheets_(ss);
  normalizeTableColumns_(ss, 'T_会員');
  normalizeTableColumns_(ss, 'T_事業所職員');
  normalizeTableColumns_(ss, 'T_研修');
  ensureSystemSettingsRows_(ss);
  seedPermissionMatrixIfNeeded_(ss);
  applyDataValidationRules_(ss);
  protectHeaderRows_(ss);
  cleanupNonSchemaSheets_(ss);
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

function initializeSchemaIfNeeded_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(SCHEMA_INITIALIZED_KEY) === 'true') {
    return;
  }

  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    if (props.getProperty(SCHEMA_INITIALIZED_KEY) === 'true') {
      return;
    }
    var ss = getOrCreateDatabase_();
    initializeSchema_(ss);
    props.setProperty(SCHEMA_INITIALIZED_KEY, 'true');
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
      .setAllowInvalid(false)
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
  var applySheet = db.getSheetByName('T_研修申込');
  var applyRows = getSheetData_(applySheet);
  var count = applyRows.filter(function(r) {
    return String(r['研修ID'] || '') === trainingId &&
      String(r['申込状態コード'] || '') !== '取消' &&
      String(r['申込状態コード'] || '') !== 'CANCELED' &&
      !toBoolean_(r['削除フラグ']);
  }).length;
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
      capacity: Number(r['定員'] || 0),
      applicantCount: Number(r['申込者数'] || 0),
      location: String(r['開催場所'] || ''),
      summary: String(r['研修概要'] || ''),
      content: String(r['研修内容'] || ''),
      cost: String(r['費用JSON'] || ''),
      startDate: formatDateForApi_(r['申込開始日']),
      endDate: formatDateForApi_(r['申込締切日']),
      instructor: String(r['講師'] || ''),
      fileUrl: String(r['案内状URL'] || ''),
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

  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
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

  if (training['定員'] && Number(training['申込者数']) >= Number(training['定員'])) {
    return JSON.stringify({ success: false, error: '定員に達しています' });
  }

  var applySheet = db.getSheetByName('T_研修申込');
  var applyRows = getSheetData_(applySheet);

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
    for (var k = 0; k < applyRows.length; k += 1) {
      var ar = applyRows[k];
      if (String(ar['研修ID'] || '') === trainingId &&
          String(ar['申込者区分コード'] || '') === 'EXTERNAL' &&
          String(ar['申込者ID'] || '') === String(existingExternal['外部申込者ID'] || '') &&
          !toBoolean_(ar['削除フラグ'])) {
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
  newApply['申込状態コード'] = '申込済';
  newApply['申込日時'] = nowStr;
  newApply['作成日時'] = nowStr;
  newApply['更新日時'] = nowStr;
  newApply['削除フラグ'] = false;
  appendRow_(applySheet, applyColsAll, newApply);

  updateTrainingApplicantCount_(db, trainingId);

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
  updateRowByKey_(applySheet, テーブル定義.T_研修申込, '申込ID', applyId, { '申込状態コード': '取消', '更新日時': nowStr });
  updateTrainingApplicantCount_(db, String(apply['研修ID'] || ''));

  return JSON.stringify({ success: true });
}

function getTrainingApplicants_(payload) {
  if (!checkAdminBySession_()) return JSON.stringify({ success: false, error: 'unauthorized' });
  if (!payload) return JSON.stringify({ success: false, error: 'trainingId required' });
  var trainingId = String(payload.trainingId || '').trim();
  if (!trainingId) return JSON.stringify({ success: false, error: 'trainingId required' });

  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var applySheet = db.getSheetByName('T_研修申込');
  var applyRows = getSheetData_(applySheet).filter(function(r) {
    return String(r['研修ID'] || '') === trainingId && !toBoolean_(r['削除フラグ']);
  });

  var memberSheet = db.getSheetByName('T_会員');
  var memberRows = getSheetData_(memberSheet);
  var memberMap = {};
  memberRows.forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });

  var externalSheet = db.getSheetByName('T_外部申込者');
  var externalRows = getSheetData_(externalSheet);
  var externalMap = {};
  externalRows.forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

  var result = applyRows.map(function(r) {
    var isMember = String(r['申込者区分コード'] || '') === 'MEMBER';
    var applicantId = String(r['申込者ID'] || '') || String(r['会員ID'] || '');
    var info = isMember ? memberMap[applicantId] : externalMap[applicantId];
    var memberName = info ? (String(info['姓'] || '') + ' ' + String(info['名'] || '')).trim() : '';
    return {
      applyId: String(r['申込ID'] || ''),
      trainingId: String(r['研修ID'] || ''),
      applicantType: String(r['申込者区分コード'] || 'MEMBER'),
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
    var applySheet = db.getSheetByName('T_研修申込');
    var applyRows = getSheetData_(applySheet).filter(function(r) {
      return String(r['研修ID'] || '') === trainingId && !toBoolean_(r['削除フラグ']);
    });
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
        var isMember = String(r['申込者区分コード'] || '') === 'MEMBER';
        var applicantId = String(r['申込者ID'] || '') || String(r['会員ID'] || '');
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
