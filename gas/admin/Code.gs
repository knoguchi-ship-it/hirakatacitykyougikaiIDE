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

// v251: 会員専用 split プロジェクト URL を正本とする（scriptId ベースルーティング移行）
var MEMBER_PORTAL_URL = 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
var CREDENTIAL_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】会員登録完了のお知らせ';
var CREDENTIAL_EMAIL_DEFAULT_BODY = '{{氏名}} 様\n\n会員登録が完了しました。\n以下のログイン情報で会員マイページにアクセスできます。\n\nログインID: {{ログインID}}\n初期パスワード: {{パスワード}}\n\n会員マイページURL:\n{{会員マイページURL}}\n\n初回ログイン後、パスワードの変更をお勧めします。\n\n※このメールに心当たりがない場合は、お手数ですが削除してください。\n─────────────────────────────\n枚方市介護支援専門員連絡協議会\n';

// v265: 事業所会員 入会時メール（代表者・メンバー別）・職員追加承認時メール デフォルトテンプレート
var BIZ_REP_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】事業所会員登録完了のお知らせ（代表者）';
var BIZ_REP_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}の代表者として、事業所会員登録が完了しました。',
  '以下のログイン情報で会員マイページにアクセスできます。',
  '',
  'ログインID: {{ログインID}}',
  '初期パスワード: {{パスワード}}',
  '',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '初回ログイン後、パスワードの変更をお勧めします。',
  '代表者として、事業所のメンバーの情報管理をお願いします。',
  '',
  '※このメールに心当たりがない場合は、お手数ですが削除してください。',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var BIZ_STAFF_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】事業所会員登録完了のお知らせ';
var BIZ_STAFF_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}のメンバーとして、事業所会員登録が完了しました。',
  '以下のログイン情報で会員マイページにアクセスできます。',
  '',
  'ログインID: {{ログインID}}',
  '初期パスワード: {{パスワード}}',
  '',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '初回ログイン後、パスワードの変更をお勧めします。',
  '',
  '※このメールに心当たりがない場合は、お手数ですが削除してください。',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var STAFF_ADD_STAFF_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】事業所会員メンバー追加のお知らせ';
var STAFF_ADD_STAFF_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}のメンバーとして登録されました。',
  '以下のログイン情報で会員マイページにアクセスできます。',
  '',
  'ログインID: {{ログインID}}',
  '初期パスワード: {{パスワード}}',
  '',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '初回ログイン後、パスワードの変更をお勧めします。',
  '',
  '※このメールに心当たりがない場合は、お手数ですが削除してください。',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var STAFF_ADD_REP_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】新メンバー追加のお知らせ';
var STAFF_ADD_REP_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}に新しいメンバーが追加されました。',
  '',
  '追加されたメンバー: {{追加職員氏名}}',
  '',
  '詳細は会員マイページよりご確認ください。',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');
var PUBLIC_PORTAL_DEFAULTS = {
  heroBadgeEnabled: false,
  heroBadgeLabel: 'お申込みポータル',
  heroTitle: '研修申込・申込取消・新規入会申込を受け付けています',
  heroDescriptionEnabled: false,
  heroDescription: 'ご希望の手続きを選択し、そのまま申込画面へ進んでください。',
  membershipBadgeEnabled: true,
  membershipBadgeLabel: '入会申込',
  membershipTitleEnabled: true,
  membershipTitle: '新規入会を申し込む',
  membershipDescriptionEnabled: true,
  membershipDescription: '個人会員・事業所会員・賛助会員の入会申込を受け付けています。',
  membershipCtaLabel: '入会申込へ進む',
  completionGuidanceVisible: true,
  completionGuidanceBodyWhenCredentialSent: [
    'ログイン情報をご登録のメールアドレスに送信しました。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。'
  ].join('\n'),
  completionGuidanceBodyWhenCredentialNotSent: [
    'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。'
  ].join('\n'),
  completionLoginInfoBlockVisible: true,
  completionLoginInfoVisible: true,
  completionLoginInfoBodyWhenCredentialSent: 'ログイン情報は画面に表示していません。登録済みのメールをご確認ください。',
  completionLoginInfoBodyWhenCredentialNotSent: 'ログイン情報メールは現在送信していません。公開準備後にご案内します。',
  completionNoCredentialNotice: 'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
  completionCredentialNotice: 'ログイン情報をご登録のメールアドレスに送信しました。',
  trainingBadgeEnabled: true,
  trainingBadgeLabel: 'TRAINING',
  trainingTitleEnabled: true,
  trainingTitle: '研修を申し込む',
  trainingDescriptionEnabled: true,
  trainingDescription: '受付中の研修一覧を確認し、そのまま申込できます。申込後の取消も研修ページから行えます。',
  trainingCtaLabel: '進む',
  memberUpdateMenuEnabled: true,
  memberUpdateBadgeEnabled: true,
  memberUpdateBadgeLabel: '登録情報変更',
  memberUpdateTitleEnabled: true,
  memberUpdateTitle: '会員登録情報を変更する',
  memberUpdateDescriptionEnabled: true,
  memberUpdateDescription: '住所・電話番号・メールアドレスなど、ご登録情報の変更を申し込めます。介護支援専門員番号でご本人確認を行います。',
  memberUpdateCtaLabel: '変更手続きへ進む',
  withdrawalMenuEnabled: true,
  withdrawalBadgeEnabled: true,
  withdrawalBadgeLabel: '退会',
  withdrawalTitleEnabled: true,
  withdrawalTitle: '退会を申し込む',
  withdrawalDescriptionEnabled: true,
  withdrawalDescription: '退会申請を行います。退会は当年度末（3月31日）に適用されます。介護支援専門員番号でご本人確認を行います。',
  withdrawalCtaLabel: '退会手続きへ進む',
};

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
    ['DRAFT', '下書き', 1, true],
    ['PUBLISHED', '公開', 2, true],
    ['CANCELLED', '中止', 3, true],
    ['ARCHIVED', 'アーカイブ', 4, true],
    ['OPEN', '受付中（旧）', 90, false],
    ['CLOSED', '受付終了（旧）', 91, false],
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
    '勤務先住所2',
    '勤務先電話番号',
    '勤務先FAX番号',
    '自宅郵便番号',
    '自宅都道府県',
    '自宅市区町村',
    '自宅住所',
    '自宅住所2',
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
    '案内状サムネイルURL',
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
  // v232: 物理削除ログ（MASTER権限専用。append-only）
  T_削除ログ: [
    'ログID',
    '操作日時',
    '操作者メール',
    '対象会員IDリスト',
    '削除前スナップショットJSON',
  ],
};

// v259: 退会済み会員のアーカイブシート（メインDB内。同スキーマ）
テーブル定義['T_会員_archive'] = テーブル定義['T_会員'].slice();
テーブル定義['T_事業所職員_archive'] = テーブル定義['T_事業所職員'].slice();
// v264: 公開ポータル変更申請テーブル（管理者承認待ちキュー）
テーブル定義['T_変更申請'] = [
  '申請ID', '会員ID', '会員種別コード', '申請種別コード', '申請状態コード',
  '申請内容JSON', '連絡先メールアドレス', '申請者表示名', '申請日時',
  '処理日時', '処理者メールアドレス', '処理備考', '作成日時', '更新日時', '削除フラグ',
];

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

  // v251: scriptId でプロジェクトを識別し配信ページを固定。URL パラメータは無視。
  // 各 split プロジェクトは自身の HTML のみを持ち、常に同一ページを返す。
  var SCRIPT_ID_ROUTES = {
    '1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ': { file: 'index',        title: '会員マイページ｜枚方市ケアマネ協議会',          favicon: 'member' },
    '1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi': { file: 'index',        title: '管理者ポータル｜枚方市ケアマネ協議会',          favicon: 'member' },
    '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL':  { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' },
  };
  var route = SCRIPT_ID_ROUTES[ScriptApp.getScriptId()]
    || { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' };

  var output = HtmlService.createHtmlOutputFromFile(route.file)
    .setTitle(route.title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  try {
    var MEMBER_PNG_B64 =
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAATUlEQVR42mOQ9btBU8Qwa' +
      'sGoBUjoPxKgsgX/cQDqWPAfLxi14D8RYDQOaG4BzfMBPXLyaGk6agGpFvynABC24D/FY' +
      'KB9MGrBaEYjHQEAAxOEvw9kj6UAAAAASUVORK5CYII=';
    var PUBLIC_PNG_B64 =
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAUUlEQVR42mNgnZZJU8Qwa' +
      'sHIs+A/xYCwD6hoOs4gopbpA2cBGXaQnIpobgFJdpCZD2huAZF2UJSTaWjB0E9Fw84C' +
      'MhSMWjBqwdC3YLThRTcLALH0a/3mcrRMAAAAAElFTkSuQmCC';
    output.setFaviconUrl('data:image/png;base64,' + (route.favicon === 'public' ? PUBLIC_PNG_B64 : MEMBER_PNG_B64));
  } catch (ex) {}

  return output;
}

/**
 * v217: ファビコン PNG を Drive にアップロードして公開し、Script Properties に記録する。
 *
 * ★ 実行方法: Apps Script エディタ（script.google.com）でこの関数を選択して「実行」ボタンを押す。
 *   - clasp run からは DriveApp が動作しないため必ずエディタから実行すること。
 *   - 初回のみ実行。再実行しても既存 ID をそのまま返す（上書きしない）。
 *   - 実行後に doGet() が Drive URL を使ってファビコンを設定する。
 */

/**
 * DriveApp 権限診断。
 *
 * 実行方法: Apps Script エディタでこの関数を選択して「実行」する。
 * 目的: DriveApp の read / createFolder / createFile / trash がどの段階で失敗するかを切り分ける。
 * 影響: 診断用の一時フォルダと一時ファイルを作成し、成功時は即座にゴミ箱へ移動する。
 */

/**
 * T_会員 に 勤務先住所2 / 自宅住所2 列を追加するマイグレーション。
 * 既にカラムが存在する場合はスキップする（冪等）。
 * 実行後は rebuildDatabaseSchema() のヘッダー保護を再適用することを推奨。
 */

/**
 * DBスキーマを再構築する。
 * 既存の定義外シートは削除し、定義シートのヘッダー/入力規則/保護を再適用する。
 */
function rebuildDatabaseSchema() {
  var ss = getOrCreateDatabase_();
  initializeSchema_(ss);
  markSchemaInitialized_();
  // 研修案内PDFサムネイル自動生成トリガーを設定（10分ごと）
  try {
    setupThumbnailGenerationTrigger_();
  } catch (e) {
    Logger.log('setupThumbnailGenerationTrigger_ failed: ' + e.message);
  }
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

/**
 * 定義済みの範囲のみを構築する。
 * 未定義の初期業務データ（例: 認証アカウント実データ）は作成しない。
 */


// スコープ不要の疎通確認用。Execution API経路の切り分けに使う。

/**
 * Web App公開状態の確認用。
 * 404復旧時の一次切り分け（URL誤り / 未公開 / 権限設定ミス）に使う。
 */


/**
 * 研修の問い合わせ窓口（担当者/連絡先）欠損を監査する。
 */

/**
 * 研修の問い合わせ窓口（担当者/連絡先）未設定データをテスト用既定値で補完する。
 */




var APP_SECURITY_BOUNDARY = 'admin';

var PUBLIC_ALLOWED_ACTIONS = {};

var MEMBER_ALLOWED_ACTIONS = {};

// 管理者ログイン専用アクション: Session.getActiveUser() による自己完結型認証のため、
// 事前の admin session 検証を必要としない。関数内で認証を完結させる。
var ADMIN_LOGIN_ACTIONS = {
  checkAdminBySession: true,
  adminLoginWithData: true,
};

function getActionRegistryForCurrentApp_() {
  if (APP_SECURITY_BOUNDARY === 'public') {
    return {
      publicActions: PUBLIC_ALLOWED_ACTIONS,
      memberActions: {},
      adminLoginActions: {},
      adminPermissions: {},
    };
  }
  if (APP_SECURITY_BOUNDARY === 'member') {
    return {
      publicActions: {},
      memberActions: MEMBER_ALLOWED_ACTIONS,
      adminLoginActions: {},
      adminPermissions: {},
    };
  }
  if (APP_SECURITY_BOUNDARY === 'admin') {
    return {
      publicActions: {},
      memberActions: {},
      adminLoginActions: ADMIN_LOGIN_ACTIONS,
      adminPermissions: ADMIN_ACTION_PERMISSIONS,
    };
  }
  return { publicActions: {}, memberActions: {}, adminLoginActions: {}, adminPermissions: {} };
}

function processApiRequest(action, payload) {
  try {
    var parsedPayload = parsePayload_(payload) || {};
    var actionRegistry = getActionRegistryForCurrentApp_();
    var isPublicAction = !!actionRegistry.publicActions[action];
    var isMemberAction = !!actionRegistry.memberActions[action];
    var isAdminLoginAction = !!actionRegistry.adminLoginActions[action];
    var requiredPerms = actionRegistry.adminPermissions[action];
    if (!isPublicAction && !isMemberAction && !isAdminLoginAction && !requiredPerms) {
      return JSON.stringify({ success: false, error: 'unsupported_action' });
    }
    if (requiredPerms) {
      var sessionResult = checkAdminBySession_();
      if (!sessionResult) {
        return JSON.stringify({ success: false, error: 'unauthorized' });
      }
      var permLevel = String(sessionResult.adminPermissionLevel || 'ADMIN');
      if (requiredPerms.indexOf(permLevel) === -1) {
        return JSON.stringify({ success: false, error: 'insufficient_permission' });
      }
      parsedPayload.__adminSession = sessionResult;
    }
    // 会員セッショントークン検証: ログイン以外の MEMBER_ALLOWED_ACTIONS は
    // サーバー側セッションキャッシュからのみ principal を解決し、クライアント申告を信頼しない
    var LOGIN_ONLY_MEMBER_ACTIONS = { memberLogin: true, memberLoginWithData: true };
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


    if (action === 'getDbInfo') {
      return JSON.stringify({ success: true, data: getDbInfo_() });
    }




    // v150: ログイン+ポータルデータ統合API（round-trip削減）

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
      try {
        var saveResult = saveTraining_(parsedPayload);
        return JSON.stringify({ success: true, data: saveResult });
      } catch (saveErr) {
        Logger.log('[saveTraining error] ' + (saveErr && saveErr.message ? saveErr.message : String(saveErr)));
        return JSON.stringify({ success: false, error: saveErr && saveErr.message ? saveErr.message : String(saveErr) });
      }
    }

    if (action === 'uploadTrainingFile') {
      return JSON.stringify({ success: true, data: uploadTrainingFile_(parsedPayload) });
    }

    if (action === 'setupTrainingFileFolder') {
      return JSON.stringify({ success: true, data: setupTrainingFileFolder_(parsedPayload) });
    }








    // v260/v261: 公開ポータル 会員情報変更・退会申請








    // v264: OTPなし本人確認フロー
    if (action === 'getAdminChangeRequests') {
      return JSON.stringify({ success: true, data: getAdminChangeRequests_(parsedPayload) });
    }
    if (action === 'approveAdminChangeRequest') {
      return JSON.stringify({ success: true, data: approveAdminChangeRequest_(parsedPayload) });
    }
    if (action === 'rejectAdminChangeRequest') {
      return JSON.stringify({ success: true, data: rejectAdminChangeRequest_(parsedPayload) });
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

    // v194: PDF名簿出力（対象取得）
    if (action === 'getMembersForRoster') {
      return JSON.stringify({ success: true, data: getMembersForRoster_(parsedPayload) });
    }

    // v205: チャンク分割 PDF 出力 API（1000件対応・all-or-nothing + リトライ）
    if (action === 'initRosterExport') {
      return JSON.stringify({ success: true, data: initRosterExport_(parsedPayload) });
    }
    if (action === 'processRosterChunk') {
      return JSON.stringify({ success: true, data: processRosterChunk_(parsedPayload) });
    }
    if (action === 'finalizeRosterExport') {
      return JSON.stringify({ success: true, data: finalizeRosterExport_(parsedPayload) });
    }
    if (action === 'cleanupRosterExport') {
      return JSON.stringify({ success: true, data: cleanupRosterExport_(parsedPayload) });
    }

    if (action === 'validateTemplateSpreadsheet') {
      return JSON.stringify({ success: true, data: validateTemplateSpreadsheet_(parsedPayload) });
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

    // v219: 入会メール テンプレート管理
    if (action === 'getCredentialEmailTemplates') {
      return JSON.stringify({ success: true, data: getCredentialEmailTemplates_() });
    }
    if (action === 'saveCredentialEmailTemplate') {
      return JSON.stringify({ success: true, data: saveCredentialEmailTemplate_(parsedPayload) });
    }
    if (action === 'deleteCredentialEmailTemplate') {
      return JSON.stringify({ success: true, data: deleteCredentialEmailTemplate_(parsedPayload) });
    }

    // v224: 一括メール テンプレート管理
    if (action === 'getBulkMailTemplates') {
      return JSON.stringify({ success: true, data: getBulkMailTemplates_() });
    }
    if (action === 'saveBulkMailTemplate') {
      return JSON.stringify({ success: true, data: saveBulkMailTemplate_(parsedPayload) });
    }
    if (action === 'deleteBulkMailTemplate') {
      return JSON.stringify({ success: true, data: deleteBulkMailTemplate_(parsedPayload) });
    }

    // v207: 宛名リスト Excel 出力
    if (action === 'generateMailingListExcel') {
      return JSON.stringify({ success: true, data: generateMailingListExcel_(parsedPayload) });
    }

    // v232: 物理削除（MASTER専用）
    if (action === 'searchMembersForDelete') {
      return JSON.stringify({ success: true, data: searchMembersForDelete_(parsedPayload) });
    }
    if (action === 'previewDeleteMember') {
      return JSON.stringify({ success: true, data: previewDeleteMember_(parsedPayload) });
    }
    if (action === 'executeDeleteMember') {
      return JSON.stringify({ success: true, data: executeDeleteMember_(parsedPayload) });
    }
    if (action === 'getDeleteLogs') {
      return JSON.stringify({ success: true, data: getDeleteLogs_(parsedPayload) });
    }
    if (action === 'repairDuplicateStaffRecords') {
      return JSON.stringify({ success: true, data: repairDuplicateStaffRecords_() });
    }
    if (action === 'repairTrainingApplicationApplicantIds') {
      return JSON.stringify({ success: true, data: repairTrainingApplicationApplicantIds_() });
    }
    if (action === 'repairMemberCareManagerDuplicates') {
      return JSON.stringify({ success: true, data: repairMemberCareManagerDuplicates_() });
    }

    // ── 会員セルフサービス（管理者認証不要・パスワード再認証必須）──


    return JSON.stringify({ success: true, data: { message: '未実装アクションです' } });
  } catch (error) {
    Logger.log('[processApiRequest catch] action=' + action + ' error=' + (error && error.message ? error.message : String(error)));
    return JSON.stringify({
      success: false,
      error: error && error.message ? error.message : String(error),
    });
  }
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

/** DBスプレッドシートのタイムゾーンをAsia/Tokyoに設定する（一度だけ実行）*/

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


function createPasswordAuthRow_(authId, loginId, roleCode, memberId, staffId, plainPassword, now) {
  var salt = generateSalt_();
  return {
    認証ID: authId,
    認証方式: 'PASSWORD',
    ログインID: loginId,
    パスワードハッシュ: hashPasswordPbkdf2_(plainPassword, salt),
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

function buildSheetLookup_(ss) {
  var map = {};
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i += 1) {
    map[sheets[i].getName()] = sheets[i];
  }
  return map;
}

function getRowsAsObjectsFromSheet_(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];
  var headers = data[0] || [];
  var rows = [];
  for (var r = 1; r < data.length; r += 1) {
    var obj = {};
    for (var c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = data[r][c];
    }
    rows.push(obj);
  }
  return rows;
}

function getRowsAsObjectsBatch_(ss, sheetNames) {
  var sheetLookup = buildSheetLookup_(ss);
  var rowsBySheet = {};
  for (var i = 0; i < sheetNames.length; i += 1) {
    var sheetName = sheetNames[i];
    rowsBySheet[sheetName] = getRowsAsObjectsFromSheet_(sheetLookup[sheetName]);
  }
  return rowsBySheet;
}

function buildTrainingApplicationRelationContextFromRows_(rowsBySheet) {
  var trainingMap = {};
  var memberMap = {};
  var staffMap = {};
  var externalMap = {};

  var trainingRows = rowsBySheet['T_研修'] || [];
  var memberRows = rowsBySheet['T_会員'] || [];
  var staffRows = rowsBySheet['T_事業所職員'] || [];
  var externalRows = rowsBySheet['T_外部申込者'] || [];

  for (var i = 0; i < trainingRows.length; i += 1) {
    if (!toBoolean_(trainingRows[i]['削除フラグ'])) {
      trainingMap[String(trainingRows[i]['研修ID'] || '')] = trainingRows[i];
    }
  }
  for (var j = 0; j < memberRows.length; j += 1) {
    if (!toBoolean_(memberRows[j]['削除フラグ'])) {
      memberMap[String(memberRows[j]['会員ID'] || '')] = memberRows[j];
    }
  }
  for (var k = 0; k < staffRows.length; k += 1) {
    if (!toBoolean_(staffRows[k]['削除フラグ'])) {
      staffMap[String(staffRows[k]['職員ID'] || '')] = staffRows[k];
    }
  }
  for (var m = 0; m < externalRows.length; m += 1) {
    if (!toBoolean_(externalRows[m]['削除フラグ'])) {
      externalMap[String(externalRows[m]['外部申込者ID'] || '')] = externalRows[m];
    }
  }

  return {
    trainingMap: trainingMap,
    memberMap: memberMap,
    staffMap: staffMap,
    externalMap: externalMap,
  };
}

function fetchAllDataFromDbFresh_() {
  var ss = getOrCreateDatabase_();
  var rowsBySheet = getRowsAsObjectsBatch_(ss, [
    'T_会員',
    'T_事業所職員',
    'T_認証アカウント',
    'T_研修',
    'T_研修申込',
    'T_年会費納入履歴',
    'T_外部申込者',
  ]);
  var memberRows = (rowsBySheet['T_会員'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffRows = (rowsBySheet['T_事業所職員'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var authRows = (rowsBySheet['T_認証アカウント'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var trainingRows = (rowsBySheet['T_研修'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var applicationRows = getTrainingApplicationRows_(ss, {
    appliedOnly: true,
    rows: rowsBySheet['T_研修申込'] || [],
    context: buildTrainingApplicationRelationContextFromRows_(rowsBySheet),
  });
  var feeRows = (rowsBySheet['T_年会費納入履歴'] || []).filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var memberTypeFeeMap = getAnnualFeeAmountMap_(ss);
  return {
    members: mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap),
    trainings: mapTrainingRowsForApi_(trainingRows),
  };
}

// v235: loginId をセッションアンカーとして受け取り、T_認証アカウントから現在の memberId/staffId を解決する。
// ロール変換後にフロントエンドのセッションが古い memberId を持っていても自動補正される。
// 後方互換: loginId のみ指定時は T_認証アカウントから解決。memberId のみ指定（旧形式）も引き続き動作。
function getMemberPortalData_(payload) {
  var ss = getOrCreateDatabase_();
  var memberId = '';
  var staffId = '';
  var resolvedByLoginId = false;

  var loginId = String(payload && payload.loginId || '').trim();
  if (loginId) {
    // loginId から現在の有効な認証アカウントを解決する（セッションアンカー方式）
    var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && toBoolean_(r['アカウント有効フラグ'])
        && String(r['ログインID'] || '').trim() === loginId
        && String(r['認証方式'] || '') === 'PASSWORD';
    });
    if (!authRows.length) {
      throw new Error('認証アカウントが見つかりません（loginId: ' + loginId + '）。再ログインしてください。');
    }
    memberId = String(authRows[0]['会員ID'] || '').trim();
    staffId = String(authRows[0]['職員ID'] || '').trim();
    resolvedByLoginId = true;
  } else {
    // 後方互換: memberId 直接指定（管理者が代理参照する場合など）
    memberId = String(payload && payload.memberId || '').trim();
  }

  if (!memberId) {
    throw new Error('loginId または memberId が未指定です。');
  }

  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  if (!memberRows.length) {
    throw new Error('対象会員が見つかりません（memberId: ' + memberId + '）。');
  }
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var memberAuthRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
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
    var availability = computeTrainingAvailability_(r, { now: new Date(nowTs) });
    if (availability.lifecycleStatus !== 'PUBLISHED') return false;
    if (availability.isApplicationOpen || availability.applicationStatus === 'NOT_STARTED') return true;
    return false;
  });
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var memberTypeFeeMap = getAnnualFeeAmountMap_(ss);

  var result = {
    members: mapMembersForApi_(ss, memberRows, staffRows, memberAuthRows, applicationRows, feeRows, memberTypeFeeMap),
    trainings: mapTrainingRowsForApi_(trainingRows),
  };

  // loginId 解決時は現在の memberId/staffId をレスポンスに含め、フロントエンドがセッションを自動補正できるようにする
  if (resolvedByLoginId) {
    result.resolvedMemberId = memberId;
    result.resolvedStaffId = staffId;
  }

  return result;
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
      officeAddressLine2: String(m['勤務先住所2'] || ''),
      phone: String(m['勤務先電話番号'] || ''),
      fax: String(m['勤務先FAX番号'] || ''),
      homePostCode: String(m['自宅郵便番号'] || ''),
      homePrefecture: String(m['自宅都道府県'] || ''),
      homeCity: String(m['自宅市区町村'] || ''),
      homeAddressLine: String(m['自宅住所'] || ''),
      homeAddressLine2: String(m['自宅住所2'] || ''),
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
    var availability = computeTrainingAvailability_(t);
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
      thumbnailUrl: String(t['案内状サムネイルURL'] || ''),
      date: formatDateForApi_(t['開催日']),
      endTime: String(t['開催終了時刻'] || ''),
      capacity: Number(t['定員'] || 0),
      applicants: Number(t['申込者数'] || 0),
      location: String(t['開催場所'] || ''),
      status: availability.isApplicationOpen ? 'OPEN' : 'CLOSED',
      lifecycleStatus: availability.lifecycleStatus,
      applicationStatus: availability.applicationStatus,
      applicationStatusReason: availability.applicationStatusReason,
      isApplicationOpen: availability.isApplicationOpen,
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
  return getRowsAsObjectsFromSheet_(ss.getSheetByName(sheetName));
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
  // 認証アカウントの現在の紐付けを正とし、whitelist 側の会員IDは後方互換の補助に留める。
  var memberId = String(linkedAuth['会員ID'] || '') || linkedMemberId;
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

function clearAdminPermissionCaches_() {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('admin_wl_v1');
    cache.remove('admin_auth_v1');
  } catch (e) {}
}

function getSystemSettings_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  // 全設定を1回の読み込みで取得（N+1問題を解消）
  var m = getSystemSettingMap_(ss);
  var raw = Number(m['DEFAULT_BUSINESS_STAFF_LIMIT'] || 10);
  var lookbackRaw = Number(m['TRAINING_HISTORY_LOOKBACK_MONTHS'] || 18);
  var guidanceRaw = m['ANNUAL_FEE_PAYMENT_GUIDANCE'];
  // 振込先設定をマップから直接パース
  var transferAccount = DEMO_TRANSFER_ACCOUNT;
  var transferRaw = m['ANNUAL_FEE_TRANSFER_ACCOUNT'];
  if (transferRaw) {
    try {
      var tParsed = JSON.parse(String(transferRaw));
      if (tParsed && tParsed.bankName && tParsed.accountNumber && tParsed.accountName) {
        transferAccount = {
          bankName: String(tParsed.bankName || ''),
          branchName: String(tParsed.branchName || ''),
          accountType: String(tParsed.accountType || '普通') === '当座' ? '当座' : '普通',
          accountNumber: String(tParsed.accountNumber || ''),
          accountName: String(tParsed.accountName || ''),
          note: String(tParsed.note || ''),
        };
      }
    } catch (e) {}
  }
  var value = Math.floor(raw);
  var lookback = Math.floor(lookbackRaw);
  var guidance = guidanceRaw == null
    ? '年会費が未納の場合は、下記の振込先をご確認のうえお手続きください。\n振込名義は会員番号と氏名を記載してください。'
    : String(guidanceRaw);
  if (!isFinite(value) || value < 1) value = 10;
  if (!isFinite(lookback) || lookback < 1) lookback = 18;
  var trainingDefaultFieldConfig = null;
  var trainingDefaultFieldConfigRaw = m['TRAINING_DEFAULT_FIELD_CONFIG'];
  if (trainingDefaultFieldConfigRaw) {
    try { trainingDefaultFieldConfig = JSON.parse(trainingDefaultFieldConfigRaw); } catch (e) {}
  }
  // v194: PDF名簿出力 & 一括メール設定
  var rosterTemplateSsId = String(m['ROSTER_TEMPLATE_SS_ID'] || '');
  var reminderTemplateSsId = String(m['REMINDER_TEMPLATE_SS_ID'] || '');
  var bulkMailAutoAttachFolderId = String(m['BULK_MAIL_AUTO_ATTACH_FOLDER_ID'] || '');
  var emailLogViewerRole = String(m['EMAIL_LOG_VIEWER_ROLE'] || 'MASTER');
  // v209: 入会時認証情報メール設定
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var credentialEmailEnabledRaw = m['CREDENTIAL_EMAIL_ENABLED'];
  var credentialEmailEnabled = credentialEmailEnabledRaw === '' || credentialEmailEnabledRaw === null
    ? true
    : String(credentialEmailEnabledRaw) !== 'false';
  var credentialEmailFrom = String(m['CREDENTIAL_EMAIL_FROM'] || '').trim() || ownerEmail;
  var credentialEmailSubject = String(m['CREDENTIAL_EMAIL_SUBJECT'] || '') || CREDENTIAL_EMAIL_DEFAULT_SUBJECT;
  var credentialEmailBody = String(m['CREDENTIAL_EMAIL_BODY'] || '') || CREDENTIAL_EMAIL_DEFAULT_BODY;
  // v210: 公開ポータル メニュー表示設定
  var trainingMenuEnabledRaw = m['PUBLIC_PORTAL_TRAINING_MENU_ENABLED'];
  var publicPortalTrainingMenuEnabled = !trainingMenuEnabledRaw
    ? true
    : String(trainingMenuEnabledRaw) !== 'false';
  var membershipMenuEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED'];
  var publicPortalMembershipMenuEnabled = !membershipMenuEnabledRaw
    ? true
    : String(membershipMenuEnabledRaw) !== 'false';
  var heroBadgeEnabledRaw = m['PUBLIC_PORTAL_HERO_BADGE_ENABLED'];
  var publicPortalHeroBadgeEnabled = heroBadgeEnabledRaw === undefined || heroBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled
    : String(heroBadgeEnabledRaw) !== 'false';
  var publicPortalHeroBadgeLabel = String(m['PUBLIC_PORTAL_HERO_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.heroBadgeLabel;
  var publicPortalHeroTitle = String(m['PUBLIC_PORTAL_HERO_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.heroTitle;
  var heroDescriptionEnabledRaw = m['PUBLIC_PORTAL_HERO_DESCRIPTION_ENABLED'];
  var publicPortalHeroDescriptionEnabled = heroDescriptionEnabledRaw === undefined || heroDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled
    : String(heroDescriptionEnabledRaw) !== 'false';
  var publicPortalHeroDescription = String(m['PUBLIC_PORTAL_HERO_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.heroDescription;
  var membershipBadgeEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_BADGE_ENABLED'];
  var publicPortalMembershipBadgeEnabled = membershipBadgeEnabledRaw === undefined || membershipBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled
    : String(membershipBadgeEnabledRaw) !== 'false';
  var publicPortalMembershipBadgeLabel = String(m['PUBLIC_PORTAL_MEMBERSHIP_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipBadgeLabel;
  var membershipTitleEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_TITLE_ENABLED'];
  var publicPortalMembershipTitleEnabled = membershipTitleEnabledRaw === undefined || membershipTitleEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled
    : String(membershipTitleEnabledRaw) !== 'false';
  var publicPortalMembershipTitle = String(m['PUBLIC_PORTAL_MEMBERSHIP_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipTitle;
  var membershipDescriptionEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION_ENABLED'];
  var publicPortalMembershipDescriptionEnabled = membershipDescriptionEnabledRaw === undefined || membershipDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled
    : String(membershipDescriptionEnabledRaw) !== 'false';
  var publicPortalMembershipDescription = String(m['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipDescription;
  var publicPortalMembershipCtaLabel = String(m['PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel;
  var completionGuidanceVisibleRaw = m['PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE'];
  var publicPortalCompletionGuidanceVisible = completionGuidanceVisibleRaw === undefined || completionGuidanceVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible
    : String(completionGuidanceVisibleRaw) !== 'false';
  var completionLoginInfoVisibleRaw = m['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE'];
  var publicPortalCompletionLoginInfoVisible = completionLoginInfoVisibleRaw === undefined || completionLoginInfoVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible
    : String(completionLoginInfoVisibleRaw) !== 'false';
  var completionLoginInfoBlockVisibleRaw = m['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE'];
  var publicPortalCompletionLoginInfoBlockVisible = completionLoginInfoBlockVisibleRaw === undefined || completionLoginInfoBlockVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible
    : String(completionLoginInfoBlockVisibleRaw) !== 'false';
  var legacyCompletionNoCredentialNotice = String(m['PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice;
  var legacyCompletionCredentialNotice = String(m['PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice;
  var publicPortalCompletionGuidanceBodyWhenCredentialSent = String(m['PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT'] || '') || [
    legacyCompletionCredentialNotice,
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。'
  ].join('\n');
  var publicPortalCompletionGuidanceBodyWhenCredentialNotSent = String(m['PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT'] || '') || [
    legacyCompletionNoCredentialNotice,
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。'
  ].join('\n');
  var publicPortalCompletionLoginInfoBodyWhenCredentialSent = String(m['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT'] || '') || PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialSent;
  var publicPortalCompletionLoginInfoBodyWhenCredentialNotSent = String(m['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT'] || '') || PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent;
  var publicPortalCompletionNoCredentialNotice = String(m['PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice;
  var publicPortalCompletionCredentialNotice = String(m['PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice;
  var trainingBadgeEnabledRaw = m['PUBLIC_PORTAL_TRAINING_BADGE_ENABLED'];
  var publicPortalTrainingBadgeEnabled = trainingBadgeEnabledRaw === undefined || trainingBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled : String(trainingBadgeEnabledRaw) !== 'false';
  var publicPortalTrainingBadgeLabel = String(m['PUBLIC_PORTAL_TRAINING_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingBadgeLabel;
  var trainingTitleEnabledRaw = m['PUBLIC_PORTAL_TRAINING_TITLE_ENABLED'];
  var publicPortalTrainingTitleEnabled = trainingTitleEnabledRaw === undefined || trainingTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled : String(trainingTitleEnabledRaw) !== 'false';
  var publicPortalTrainingTitle = String(m['PUBLIC_PORTAL_TRAINING_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingTitle;
  var trainingDescriptionEnabledRaw = m['PUBLIC_PORTAL_TRAINING_DESCRIPTION_ENABLED'];
  var publicPortalTrainingDescriptionEnabled = trainingDescriptionEnabledRaw === undefined || trainingDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled : String(trainingDescriptionEnabledRaw) !== 'false';
  var publicPortalTrainingDescription = String(m['PUBLIC_PORTAL_TRAINING_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingDescription;
  var publicPortalTrainingCtaLabel = String(m['PUBLIC_PORTAL_TRAINING_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingCtaLabel;
  var memberUpdateMenuEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED'];
  var publicPortalMemberUpdateMenuEnabled = memberUpdateMenuEnabledRaw === undefined || memberUpdateMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled : String(memberUpdateMenuEnabledRaw) !== 'false';
  var memberUpdateBadgeEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_ENABLED'];
  var publicPortalMemberUpdateBadgeEnabled = memberUpdateBadgeEnabledRaw === undefined || memberUpdateBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled : String(memberUpdateBadgeEnabledRaw) !== 'false';
  var publicPortalMemberUpdateBadgeLabel = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeLabel;
  var memberUpdateTitleEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE_ENABLED'];
  var publicPortalMemberUpdateTitleEnabled = memberUpdateTitleEnabledRaw === undefined || memberUpdateTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled : String(memberUpdateTitleEnabledRaw) !== 'false';
  var publicPortalMemberUpdateTitle = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateTitle;
  var memberUpdateDescriptionEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION_ENABLED'];
  var publicPortalMemberUpdateDescriptionEnabled = memberUpdateDescriptionEnabledRaw === undefined || memberUpdateDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled : String(memberUpdateDescriptionEnabledRaw) !== 'false';
  var publicPortalMemberUpdateDescription = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateDescription;
  var publicPortalMemberUpdateCtaLabel = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateCtaLabel;
  var withdrawalMenuEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED'];
  var publicPortalWithdrawalMenuEnabled = withdrawalMenuEnabledRaw === undefined || withdrawalMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled : String(withdrawalMenuEnabledRaw) !== 'false';
  var withdrawalBadgeEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_BADGE_ENABLED'];
  var publicPortalWithdrawalBadgeEnabled = withdrawalBadgeEnabledRaw === undefined || withdrawalBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled : String(withdrawalBadgeEnabledRaw) !== 'false';
  var publicPortalWithdrawalBadgeLabel = String(m['PUBLIC_PORTAL_WITHDRAWAL_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeLabel;
  var withdrawalTitleEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_TITLE_ENABLED'];
  var publicPortalWithdrawalTitleEnabled = withdrawalTitleEnabledRaw === undefined || withdrawalTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled : String(withdrawalTitleEnabledRaw) !== 'false';
  var publicPortalWithdrawalTitle = String(m['PUBLIC_PORTAL_WITHDRAWAL_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalTitle;
  var withdrawalDescriptionEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION_ENABLED'];
  var publicPortalWithdrawalDescriptionEnabled = withdrawalDescriptionEnabledRaw === undefined || withdrawalDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled : String(withdrawalDescriptionEnabledRaw) !== 'false';
  var publicPortalWithdrawalDescription = String(m['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalDescription;
  var publicPortalWithdrawalCtaLabel = String(m['PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalCtaLabel;
  return {
    defaultBusinessStaffLimit: value,
    trainingHistoryLookbackMonths: lookback,
    annualFeePaymentGuidance: guidance,
    annualFeeTransferAccount: transferAccount,
    trainingDefaultFieldConfig: trainingDefaultFieldConfig,
    rosterTemplateSsId: rosterTemplateSsId,
    reminderTemplateSsId: reminderTemplateSsId,
    bulkMailAutoAttachFolderId: bulkMailAutoAttachFolderId,
    emailLogViewerRole: emailLogViewerRole,
    credentialEmailEnabled: credentialEmailEnabled,
    credentialEmailFrom: credentialEmailFrom,
    credentialEmailSubject: credentialEmailSubject,
    credentialEmailBody: credentialEmailBody,
    publicPortalTrainingMenuEnabled: publicPortalTrainingMenuEnabled,
    publicPortalMembershipMenuEnabled: publicPortalMembershipMenuEnabled,
    publicPortalHeroBadgeEnabled: publicPortalHeroBadgeEnabled,
    publicPortalHeroBadgeLabel: publicPortalHeroBadgeLabel,
    publicPortalHeroTitle: publicPortalHeroTitle,
    publicPortalHeroDescriptionEnabled: publicPortalHeroDescriptionEnabled,
    publicPortalHeroDescription: publicPortalHeroDescription,
    publicPortalMembershipBadgeEnabled: publicPortalMembershipBadgeEnabled,
    publicPortalMembershipBadgeLabel: publicPortalMembershipBadgeLabel,
    publicPortalMembershipTitleEnabled: publicPortalMembershipTitleEnabled,
    publicPortalMembershipTitle: publicPortalMembershipTitle,
    publicPortalMembershipDescriptionEnabled: publicPortalMembershipDescriptionEnabled,
    publicPortalMembershipDescription: publicPortalMembershipDescription,
    publicPortalMembershipCtaLabel: publicPortalMembershipCtaLabel,
    publicPortalCompletionGuidanceVisible: publicPortalCompletionGuidanceVisible,
    publicPortalCompletionGuidanceBodyWhenCredentialSent: publicPortalCompletionGuidanceBodyWhenCredentialSent,
    publicPortalCompletionGuidanceBodyWhenCredentialNotSent: publicPortalCompletionGuidanceBodyWhenCredentialNotSent,
    publicPortalCompletionLoginInfoBlockVisible: publicPortalCompletionLoginInfoBlockVisible,
    publicPortalCompletionLoginInfoVisible: publicPortalCompletionLoginInfoVisible,
    publicPortalCompletionLoginInfoBodyWhenCredentialSent: publicPortalCompletionLoginInfoBodyWhenCredentialSent,
    publicPortalCompletionLoginInfoBodyWhenCredentialNotSent: publicPortalCompletionLoginInfoBodyWhenCredentialNotSent,
    publicPortalCompletionNoCredentialNotice: publicPortalCompletionNoCredentialNotice,
    publicPortalCompletionCredentialNotice: publicPortalCompletionCredentialNotice,
    publicPortalCredentialEmailEnabled: credentialEmailEnabled,
    publicPortalTrainingBadgeEnabled: publicPortalTrainingBadgeEnabled,
    publicPortalTrainingBadgeLabel: publicPortalTrainingBadgeLabel,
    publicPortalTrainingTitleEnabled: publicPortalTrainingTitleEnabled,
    publicPortalTrainingTitle: publicPortalTrainingTitle,
    publicPortalTrainingDescriptionEnabled: publicPortalTrainingDescriptionEnabled,
    publicPortalTrainingDescription: publicPortalTrainingDescription,
    publicPortalTrainingCtaLabel: publicPortalTrainingCtaLabel,
    publicPortalMemberUpdateMenuEnabled: publicPortalMemberUpdateMenuEnabled,
    publicPortalMemberUpdateBadgeEnabled: publicPortalMemberUpdateBadgeEnabled,
    publicPortalMemberUpdateBadgeLabel: publicPortalMemberUpdateBadgeLabel,
    publicPortalMemberUpdateTitleEnabled: publicPortalMemberUpdateTitleEnabled,
    publicPortalMemberUpdateTitle: publicPortalMemberUpdateTitle,
    publicPortalMemberUpdateDescriptionEnabled: publicPortalMemberUpdateDescriptionEnabled,
    publicPortalMemberUpdateDescription: publicPortalMemberUpdateDescription,
    publicPortalMemberUpdateCtaLabel: publicPortalMemberUpdateCtaLabel,
    publicPortalWithdrawalMenuEnabled: publicPortalWithdrawalMenuEnabled,
    publicPortalWithdrawalBadgeEnabled: publicPortalWithdrawalBadgeEnabled,
    publicPortalWithdrawalBadgeLabel: publicPortalWithdrawalBadgeLabel,
    publicPortalWithdrawalTitleEnabled: publicPortalWithdrawalTitleEnabled,
    publicPortalWithdrawalTitle: publicPortalWithdrawalTitle,
    publicPortalWithdrawalDescriptionEnabled: publicPortalWithdrawalDescriptionEnabled,
    publicPortalWithdrawalDescription: publicPortalWithdrawalDescription,
    publicPortalWithdrawalCtaLabel: publicPortalWithdrawalCtaLabel,
    trainingFileFolderId: String(m['TRAINING_FILE_FOLDER_ID'] || '').trim(),
    // v265: 個人・賛助会員 入会時メール ON/OFF
    indSuppEmailEnabled: (function(){ var v = m['IND_SUPP_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    // v265: 事業所入会・職員追加メール設定
    bizRepEmailEnabled:        String(m['BIZ_REP_EMAIL_ENABLED'] || '') !== 'false',
    bizRepEmailSubject:        String(m['BIZ_REP_EMAIL_SUBJECT'] || '') || BIZ_REP_EMAIL_DEFAULT_SUBJECT,
    bizRepEmailBody:           String(m['BIZ_REP_EMAIL_BODY'] || '') || BIZ_REP_EMAIL_DEFAULT_BODY,
    bizStaffEmailEnabled:      (function(){ var v = m['BIZ_STAFF_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    bizStaffEmailSubject:      String(m['BIZ_STAFF_EMAIL_SUBJECT'] || '') || BIZ_STAFF_EMAIL_DEFAULT_SUBJECT,
    bizStaffEmailBody:         String(m['BIZ_STAFF_EMAIL_BODY'] || '') || BIZ_STAFF_EMAIL_DEFAULT_BODY,
    staffAddStaffEmailEnabled: (function(){ var v = m['STAFF_ADD_STAFF_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    staffAddStaffEmailSubject: String(m['STAFF_ADD_STAFF_EMAIL_SUBJECT'] || '') || STAFF_ADD_STAFF_EMAIL_DEFAULT_SUBJECT,
    staffAddStaffEmailBody:    String(m['STAFF_ADD_STAFF_EMAIL_BODY'] || '') || STAFF_ADD_STAFF_EMAIL_DEFAULT_BODY,
    staffAddRepEmailEnabled:   (function(){ var v = m['STAFF_ADD_REP_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    staffAddRepEmailSubject:   String(m['STAFF_ADD_REP_EMAIL_SUBJECT'] || '') || STAFF_ADD_REP_EMAIL_DEFAULT_SUBJECT,
    staffAddRepEmailBody:      String(m['STAFF_ADD_REP_EMAIL_BODY'] || '') || STAFF_ADD_REP_EMAIL_DEFAULT_BODY,
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
  // 全更新を1配列に収集し batchUpsertSystemSettings_ で一括書き込み（N+1問題解消）
  var updates = [
    { key: 'DEFAULT_BUSINESS_STAFF_LIMIT', value: String(Math.floor(next)), description: '事業所会員メンバー上限（全体デフォルト）' },
    { key: 'TRAINING_HISTORY_LOOKBACK_MONTHS', value: String(Math.floor(lookback)), description: '研修履歴の表示期間（月）' },
    { key: 'ANNUAL_FEE_PAYMENT_GUIDANCE', value: guidance, description: '年会費未納時の会員向け納入案内' },
    { key: 'ANNUAL_FEE_TRANSFER_ACCOUNT', value: JSON.stringify(transferAccount), description: '年会費未納時の共通振込先' },
    { key: 'DB_SCHEMA_VERSION', value: DB_SCHEMA_VERSION, description: 'DBスキーマバージョン' },
  ];
  if (request.trainingDefaultFieldConfig != null) {
    updates.push({ key: 'TRAINING_DEFAULT_FIELD_CONFIG', value: JSON.stringify(request.trainingDefaultFieldConfig), description: '研修フォームのデフォルト表示項目設定' });
  }
  // v194: PDF名簿出力 & 一括メール設定（MASTER/ADMIN 共通可変）
  if (request.rosterTemplateSsId != null) {
    updates.push({ key: 'ROSTER_TEMPLATE_SS_ID', value: normalizeSpreadsheetIdInput_(request.rosterTemplateSsId), description: '名簿テンプレートスプレッドシートID' });
  }
  if (request.reminderTemplateSsId != null) {
    updates.push({ key: 'REMINDER_TEMPLATE_SS_ID', value: normalizeSpreadsheetIdInput_(request.reminderTemplateSsId), description: '催促用紙テンプレートスプレッドシートID' });
  }
  if (request.bulkMailAutoAttachFolderId != null) {
    updates.push({ key: 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID', value: String(request.bulkMailAutoAttachFolderId).trim(), description: '一括メール個別自動添付DriveフォルダID' });
  }
  // v194: MASTER のみ変更可能
  if (request.emailLogViewerRole != null && effectivePermLevel === 'MASTER') {
    var allowedRoles = ['MASTER', 'MASTER,ADMIN'];
    var roleVal = String(request.emailLogViewerRole).trim();
    if (allowedRoles.indexOf(roleVal) < 0) roleVal = 'MASTER';
    updates.push({ key: 'EMAIL_LOG_VIEWER_ROLE', value: roleVal, description: 'メール送信ログ閲覧権限' });
  }
  // v209: 入会時認証情報メール設定（MASTER/ADMIN 共通可変）
  if (request.credentialEmailEnabled != null) {
    updates.push({ key: 'CREDENTIAL_EMAIL_ENABLED', value: request.credentialEmailEnabled ? 'true' : 'false', description: '入会申込時にログイン情報メールを送信するか' });
  }
  if (request.credentialEmailFrom != null) {
    var ownerEmail = Session.getEffectiveUser().getEmail();
    var requestedFrom = String(request.credentialEmailFrom || '').trim();
    var validatedFrom = validateRequestedFromAddress_(requestedFrom, ownerEmail);
    updates.push({ key: 'CREDENTIAL_EMAIL_FROM', value: validatedFrom === ownerEmail ? '' : validatedFrom, description: '入会時認証情報メールの送信元アドレス' });
  }
  if (request.credentialEmailSubject != null) {
    var subj = String(request.credentialEmailSubject).trim();
    if (!subj) subj = CREDENTIAL_EMAIL_DEFAULT_SUBJECT;
    updates.push({ key: 'CREDENTIAL_EMAIL_SUBJECT', value: subj, description: '入会時認証情報メールの件名' });
  }
  if (request.credentialEmailBody != null) {
    var bodyVal = String(request.credentialEmailBody);
    if (!bodyVal.trim()) bodyVal = CREDENTIAL_EMAIL_DEFAULT_BODY;
    updates.push({ key: 'CREDENTIAL_EMAIL_BODY', value: bodyVal, description: '入会時認証情報メールの本文（マージタグ: {{氏名}} {{ログインID}} {{パスワード}} {{会員マイページURL}}）' });
  }
  // v210: 公開ポータル メニュー表示設定
  if (request.publicPortalTrainingMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_MENU_ENABLED', value: request.publicPortalTrainingMenuEnabled ? 'true' : 'false', description: '公開ポータル：研修申込メニューを表示するか' });
  }
  if (request.publicPortalMembershipMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED', value: request.publicPortalMembershipMenuEnabled ? 'true' : 'false', description: '公開ポータル：入会申込メニューを表示するか' });
  }
  if (request.publicPortalHeroBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_HERO_BADGE_ENABLED', value: request.publicPortalHeroBadgeEnabled ? 'true' : 'false', description: '公開ポータル：トップ補助ラベルを表示するか' });
  }
  if (request.publicPortalHeroBadgeLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_HERO_BADGE_LABEL', value: String(request.publicPortalHeroBadgeLabel).trim() || PUBLIC_PORTAL_DEFAULTS.heroBadgeLabel, description: '公開ポータル：トップ補助ラベル文言' });
  }
  if (request.publicPortalHeroTitle != null) {
    updates.push({ key: 'PUBLIC_PORTAL_HERO_TITLE', value: String(request.publicPortalHeroTitle).trim() || PUBLIC_PORTAL_DEFAULTS.heroTitle, description: '公開ポータル：トップ見出し' });
  }
  if (request.publicPortalHeroDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_HERO_DESCRIPTION_ENABLED', value: request.publicPortalHeroDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：トップ説明文を表示するか' });
  }
  if (request.publicPortalHeroDescription != null) {
    updates.push({ key: 'PUBLIC_PORTAL_HERO_DESCRIPTION', value: String(request.publicPortalHeroDescription).trim() || PUBLIC_PORTAL_DEFAULTS.heroDescription, description: '公開ポータル：トップ説明文' });
  }
  if (request.publicPortalMembershipBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_BADGE_ENABLED', value: request.publicPortalMembershipBadgeEnabled ? 'true' : 'false', description: '公開ポータル：入会カード補助ラベルを表示するか' });
  }
  if (request.publicPortalMembershipBadgeLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_BADGE_LABEL', value: String(request.publicPortalMembershipBadgeLabel).trim() || PUBLIC_PORTAL_DEFAULTS.membershipBadgeLabel, description: '公開ポータル：入会カード補助ラベル文言' });
  }
  if (request.publicPortalMembershipTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_TITLE_ENABLED', value: request.publicPortalMembershipTitleEnabled ? 'true' : 'false', description: '公開ポータル：入会カード見出しを表示するか' });
  }
  if (request.publicPortalMembershipTitle != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_TITLE', value: String(request.publicPortalMembershipTitle).trim() || PUBLIC_PORTAL_DEFAULTS.membershipTitle, description: '公開ポータル：入会カード見出し' });
  }
  if (request.publicPortalMembershipDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION_ENABLED', value: request.publicPortalMembershipDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：入会カード説明文を表示するか' });
  }
  if (request.publicPortalMembershipDescription != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION', value: String(request.publicPortalMembershipDescription).trim() || PUBLIC_PORTAL_DEFAULTS.membershipDescription, description: '公開ポータル：入会カード説明文' });
  }
  if (request.publicPortalMembershipCtaLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL', value: String(request.publicPortalMembershipCtaLabel).trim() || PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel, description: '公開ポータル：入会カードボタン文言' });
  }
  if (request.publicPortalCompletionGuidanceVisible != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE', value: request.publicPortalCompletionGuidanceVisible ? 'true' : 'false', description: '公開ポータル：入会完了画面の今後のご案内ブロックを表示するか' });
  }
  if (request.publicPortalCompletionGuidanceBodyWhenCredentialSent != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT', value: String(request.publicPortalCompletionGuidanceBodyWhenCredentialSent), description: '公開ポータル：入会完了画面・今後のご案内（メール送信ON時）' });
  }
  if (request.publicPortalCompletionGuidanceBodyWhenCredentialNotSent != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT', value: String(request.publicPortalCompletionGuidanceBodyWhenCredentialNotSent), description: '公開ポータル：入会完了画面・今後のご案内（メール送信OFF時）' });
  }
  if (request.publicPortalCompletionLoginInfoBlockVisible != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE', value: request.publicPortalCompletionLoginInfoBlockVisible ? 'true' : 'false', description: '公開ポータル：入会完了画面のログイン情報ブロックを表示するか' });
  }
  if (request.publicPortalCompletionLoginInfoVisible != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE', value: request.publicPortalCompletionLoginInfoVisible ? 'true' : 'false', description: '公開ポータル：入会完了画面のログイン情報を表示するか' });
  }
  if (request.publicPortalCompletionLoginInfoBodyWhenCredentialSent != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT', value: String(request.publicPortalCompletionLoginInfoBodyWhenCredentialSent), description: '公開ポータル：入会完了画面・ログイン情報補足本文（メール送信ON時）' });
  }
  if (request.publicPortalCompletionLoginInfoBodyWhenCredentialNotSent != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT', value: String(request.publicPortalCompletionLoginInfoBodyWhenCredentialNotSent), description: '公開ポータル：入会完了画面・ログイン情報補足本文（メール送信OFF時）' });
  }
  if (request.publicPortalCompletionNoCredentialNotice != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE', value: String(request.publicPortalCompletionNoCredentialNotice).trim() || PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice, description: '公開ポータル：入会完了画面・ログイン情報未送信時の案内文' });
  }
  if (request.publicPortalCompletionCredentialNotice != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE', value: String(request.publicPortalCompletionCredentialNotice).trim() || PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice, description: '公開ポータル：入会完了画面・ログイン情報送信済み時の案内文' });
  }
  if (request.publicPortalTrainingBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_BADGE_ENABLED', value: request.publicPortalTrainingBadgeEnabled ? 'true' : 'false', description: '公開ポータル：研修カード補助ラベルを表示するか' });
  }
  if (request.publicPortalTrainingBadgeLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_BADGE_LABEL', value: String(request.publicPortalTrainingBadgeLabel).trim() || PUBLIC_PORTAL_DEFAULTS.trainingBadgeLabel, description: '公開ポータル：研修カード補助ラベル文言' });
  }
  if (request.publicPortalTrainingTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_TITLE_ENABLED', value: request.publicPortalTrainingTitleEnabled ? 'true' : 'false', description: '公開ポータル：研修カード見出しを表示するか' });
  }
  if (request.publicPortalTrainingTitle != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_TITLE', value: String(request.publicPortalTrainingTitle).trim() || PUBLIC_PORTAL_DEFAULTS.trainingTitle, description: '公開ポータル：研修カード見出し' });
  }
  if (request.publicPortalTrainingDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_DESCRIPTION_ENABLED', value: request.publicPortalTrainingDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：研修カード説明文を表示するか' });
  }
  if (request.publicPortalTrainingDescription != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_DESCRIPTION', value: String(request.publicPortalTrainingDescription).trim() || PUBLIC_PORTAL_DEFAULTS.trainingDescription, description: '公開ポータル：研修カード説明文' });
  }
  if (request.publicPortalTrainingCtaLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_CTA_LABEL', value: String(request.publicPortalTrainingCtaLabel).trim() || PUBLIC_PORTAL_DEFAULTS.trainingCtaLabel, description: '公開ポータル：研修カードボタン文言' });
  }
  if (request.publicPortalMemberUpdateMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED', value: request.publicPortalMemberUpdateMenuEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更メニューを表示するか' });
  }
  if (request.publicPortalMemberUpdateBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_ENABLED', value: request.publicPortalMemberUpdateBadgeEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更カード補助ラベルを表示するか' });
  }
  if (request.publicPortalMemberUpdateBadgeLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_LABEL', value: String(request.publicPortalMemberUpdateBadgeLabel).trim() || PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeLabel, description: '公開ポータル：登録情報変更カード補助ラベル文言' });
  }
  if (request.publicPortalMemberUpdateTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_TITLE_ENABLED', value: request.publicPortalMemberUpdateTitleEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更カード見出しを表示するか' });
  }
  if (request.publicPortalMemberUpdateTitle != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_TITLE', value: String(request.publicPortalMemberUpdateTitle).trim() || PUBLIC_PORTAL_DEFAULTS.memberUpdateTitle, description: '公開ポータル：登録情報変更カード見出し' });
  }
  if (request.publicPortalMemberUpdateDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION_ENABLED', value: request.publicPortalMemberUpdateDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更カード説明文を表示するか' });
  }
  if (request.publicPortalMemberUpdateDescription != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION', value: String(request.publicPortalMemberUpdateDescription).trim() || PUBLIC_PORTAL_DEFAULTS.memberUpdateDescription, description: '公開ポータル：登録情報変更カード説明文' });
  }
  if (request.publicPortalMemberUpdateCtaLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL', value: String(request.publicPortalMemberUpdateCtaLabel).trim() || PUBLIC_PORTAL_DEFAULTS.memberUpdateCtaLabel, description: '公開ポータル：登録情報変更カードボタン文言' });
  }
  if (request.publicPortalWithdrawalMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED', value: request.publicPortalWithdrawalMenuEnabled ? 'true' : 'false', description: '公開ポータル：退会申込メニューを表示するか' });
  }
  if (request.publicPortalWithdrawalBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_BADGE_ENABLED', value: request.publicPortalWithdrawalBadgeEnabled ? 'true' : 'false', description: '公開ポータル：退会カード補助ラベルを表示するか' });
  }
  if (request.publicPortalWithdrawalBadgeLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_BADGE_LABEL', value: String(request.publicPortalWithdrawalBadgeLabel).trim() || PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeLabel, description: '公開ポータル：退会カード補助ラベル文言' });
  }
  if (request.publicPortalWithdrawalTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_TITLE_ENABLED', value: request.publicPortalWithdrawalTitleEnabled ? 'true' : 'false', description: '公開ポータル：退会カード見出しを表示するか' });
  }
  if (request.publicPortalWithdrawalTitle != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_TITLE', value: String(request.publicPortalWithdrawalTitle).trim() || PUBLIC_PORTAL_DEFAULTS.withdrawalTitle, description: '公開ポータル：退会カード見出し' });
  }
  if (request.publicPortalWithdrawalDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION_ENABLED', value: request.publicPortalWithdrawalDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：退会カード説明文を表示するか' });
  }
  if (request.publicPortalWithdrawalDescription != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION', value: String(request.publicPortalWithdrawalDescription).trim() || PUBLIC_PORTAL_DEFAULTS.withdrawalDescription, description: '公開ポータル：退会カード説明文' });
  }
  if (request.publicPortalWithdrawalCtaLabel != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL', value: String(request.publicPortalWithdrawalCtaLabel).trim() || PUBLIC_PORTAL_DEFAULTS.withdrawalCtaLabel, description: '公開ポータル：退会カードボタン文言' });
  }
  if (request.trainingFileFolderId != null) {
    updates.push({ key: 'TRAINING_FILE_FOLDER_ID', value: String(request.trainingFileFolderId || '').trim(), description: '研修ファイル保存先 Google Drive フォルダ ID' });
    // Script Properties にも保存
    PropertiesService.getScriptProperties().setProperty('TRAINING_FILE_FOLDER_ID', String(request.trainingFileFolderId || '').trim());
  }
  // v265: 個人・賛助会員 入会時メール ON/OFF
  if (request.indSuppEmailEnabled != null) {
    updates.push({ key: 'IND_SUPP_EMAIL_ENABLED', value: request.indSuppEmailEnabled ? 'true' : 'false', description: '入会時：個人・賛助会員メール送信ON/OFF' });
  }
  // v265: 事業所入会・職員追加メール設定
  if (request.bizRepEmailEnabled != null) {
    updates.push({ key: 'BIZ_REP_EMAIL_ENABLED', value: request.bizRepEmailEnabled ? 'true' : 'false', description: '事業所入会時：代表者メール送信ON/OFF' });
  }
  if (request.bizRepEmailSubject != null) {
    updates.push({ key: 'BIZ_REP_EMAIL_SUBJECT', value: String(request.bizRepEmailSubject).trim() || BIZ_REP_EMAIL_DEFAULT_SUBJECT, description: '事業所入会時：代表者メール件名' });
  }
  if (request.bizRepEmailBody != null) {
    updates.push({ key: 'BIZ_REP_EMAIL_BODY', value: String(request.bizRepEmailBody) || BIZ_REP_EMAIL_DEFAULT_BODY, description: '事業所入会時：代表者メール本文' });
  }
  if (request.bizStaffEmailEnabled != null) {
    updates.push({ key: 'BIZ_STAFF_EMAIL_ENABLED', value: request.bizStaffEmailEnabled ? 'true' : 'false', description: '事業所入会時：メンバーメール送信ON/OFF' });
  }
  if (request.bizStaffEmailSubject != null) {
    updates.push({ key: 'BIZ_STAFF_EMAIL_SUBJECT', value: String(request.bizStaffEmailSubject).trim() || BIZ_STAFF_EMAIL_DEFAULT_SUBJECT, description: '事業所入会時：メンバーメール件名' });
  }
  if (request.bizStaffEmailBody != null) {
    updates.push({ key: 'BIZ_STAFF_EMAIL_BODY', value: String(request.bizStaffEmailBody) || BIZ_STAFF_EMAIL_DEFAULT_BODY, description: '事業所入会時：メンバーメール本文' });
  }
  if (request.staffAddStaffEmailEnabled != null) {
    updates.push({ key: 'STAFF_ADD_STAFF_EMAIL_ENABLED', value: request.staffAddStaffEmailEnabled ? 'true' : 'false', description: '職員追加承認時：追加職員メール送信ON/OFF' });
  }
  if (request.staffAddStaffEmailSubject != null) {
    updates.push({ key: 'STAFF_ADD_STAFF_EMAIL_SUBJECT', value: String(request.staffAddStaffEmailSubject).trim() || STAFF_ADD_STAFF_EMAIL_DEFAULT_SUBJECT, description: '職員追加承認時：追加職員メール件名' });
  }
  if (request.staffAddStaffEmailBody != null) {
    updates.push({ key: 'STAFF_ADD_STAFF_EMAIL_BODY', value: String(request.staffAddStaffEmailBody) || STAFF_ADD_STAFF_EMAIL_DEFAULT_BODY, description: '職員追加承認時：追加職員メール本文' });
  }
  if (request.staffAddRepEmailEnabled != null) {
    updates.push({ key: 'STAFF_ADD_REP_EMAIL_ENABLED', value: request.staffAddRepEmailEnabled ? 'true' : 'false', description: '職員追加承認時：代表者通知メール送信ON/OFF' });
  }
  if (request.staffAddRepEmailSubject != null) {
    updates.push({ key: 'STAFF_ADD_REP_EMAIL_SUBJECT', value: String(request.staffAddRepEmailSubject).trim() || STAFF_ADD_REP_EMAIL_DEFAULT_SUBJECT, description: '職員追加承認時：代表者通知メール件名' });
  }
  if (request.staffAddRepEmailBody != null) {
    updates.push({ key: 'STAFF_ADD_REP_EMAIL_BODY', value: String(request.staffAddRepEmailBody) || STAFF_ADD_REP_EMAIL_DEFAULT_BODY, description: '職員追加承認時：代表者通知メール本文' });
  }
  batchUpsertSystemSettings_(ss, updates);
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(DEFAULT_BUSINESS_STAFF_LIMIT_KEY, String(Math.floor(next))); // backward compatibility
  scriptProperties.setProperty(TRAINING_HISTORY_LOOKBACK_MONTHS_KEY, String(Math.floor(lookback))); // backward compatibility
  return getSystemSettings_();
}

function normalizeSpreadsheetIdInput_(rawValue) {
  var text = String(rawValue || '').trim();
  if (!text) return '';
  var match = text.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return text;
}

function buildTemplateValidationCheck_(key, label, status, detail) {
  return { key: key, label: label, status: status, detail: detail };
}

function getTemplateSheetsByRule_(ss, kind) {
  var result = { personal: [], business: [], metadataMatched: 0 };
  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    var metadata = getTemplateSheetMetadataMap_(sheet);
    var family = String(metadata.HKC_TEMPLATE_FAMILY || '').toUpperCase();
    var target = String(metadata.HKC_TEMPLATE_TARGET || '').toUpperCase();
    var matchedByMetadata = false;

    if (kind === 'ROSTER' && family === 'ROSTER') {
      matchedByMetadata = true;
      if (target === 'PERSONAL_SUPPORT') result.personal.push(sheet);
      if (target === 'BUSINESS') result.business.push(sheet);
    }
    if (kind === 'REMINDER' && family === 'REMINDER') {
      matchedByMetadata = true;
      if (target === 'PERSONAL_SUPPORT') result.personal.push(sheet);
      if (target === 'BUSINESS') result.business.push(sheet);
    }
    if (matchedByMetadata) {
      result.metadataMatched += 1;
      return;
    }

    if (kind === 'ROSTER') {
      if (name.indexOf('P_') === 0) result.personal.push(sheet);
      if (name.indexOf('B_') === 0) result.business.push(sheet);
      return;
    }

    if (name.indexOf('R_P_') === 0) result.personal.push(sheet);
    if (name.indexOf('R_B_') === 0) result.business.push(sheet);
  });
  return result;
}

function summarizeTemplateValidationStatus_(checks) {
  for (var i = 0; i < checks.length; i += 1) {
    if (checks[i].status === 'fail') return 'fail';
  }
  for (var j = 0; j < checks.length; j += 1) {
    if (checks[j].status === 'warn') return 'warn';
  }
  return 'pass';
}

function validateTemplateSpreadsheet_(payload) {
  var kind = String(payload && payload.kind || 'ROSTER').toUpperCase() === 'REMINDER' ? 'REMINDER' : 'ROSTER';
  var spreadsheetId = normalizeSpreadsheetIdInput_(payload && payload.spreadsheetId);
  if (!spreadsheetId) {
    throw new Error((kind === 'ROSTER' ? '名簿' : '催促状') + 'テンプレートのスプレッドシートIDまたはURLを入力してください。');
  }

  var ss = SpreadsheetApp.openById(spreadsheetId);
  var grouped = getTemplateSheetsByRule_(ss, kind);
  var visibleSheets = ss.getSheets().filter(function(sheet) { return !sheet.isSheetHidden(); }).map(function(sheet) { return sheet.getName(); });
  var hiddenSheets = ss.getSheets().filter(function(sheet) { return sheet.isSheetHidden(); }).map(function(sheet) { return sheet.getName(); });
  var dataSheet = kind === 'ROSTER' ? getRosterTemplateDataSheet_(ss) : ss.getSheetByName('_DATA_REMINDER');
  var checks = [];

  checks.push(buildTemplateValidationCheck_('open', 'テンプレートファイルにアクセスできる', 'pass', 'スプレッドシートを開けました。'));
  checks.push(buildTemplateValidationCheck_(
    'data-sheet',
    kind === 'ROSTER' ? 'データシートがある' : '催促状データシートがある',
    dataSheet ? 'pass' : 'fail',
    dataSheet
      ? ('使用データシート: ' + dataSheet.getName())
      : (kind === 'ROSTER' ? '`_DATA_ROSTER` または `_DATA` が必要です。' : '`_DATA_REMINDER` が必要です。')
  ));
  checks.push(buildTemplateValidationCheck_(
    'personal',
    kind === 'ROSTER' ? '個人・賛助向けの用紙がある' : '個人・賛助向けの催促状がある',
    grouped.personal.length > 0 ? 'pass' : 'fail',
    grouped.personal.length > 0
      ? grouped.personal.map(function(sheet) { return sheet.getName(); }).join(', ')
      : (kind === 'ROSTER' ? '`P_` シート群または metadata が必要です。' : '`R_P_` シート群または metadata が必要です。')
  ));
  checks.push(buildTemplateValidationCheck_(
    'business',
    kind === 'ROSTER' ? '事業所向けの用紙がある' : '事業所向けの催促状がある',
    grouped.business.length > 0 ? 'pass' : 'fail',
    grouped.business.length > 0
      ? grouped.business.map(function(sheet) { return sheet.getName(); }).join(', ')
      : (kind === 'ROSTER' ? '`B_` シート群または metadata が必要です。' : '`R_B_` シート群または metadata が必要です。')
  ));
  checks.push(buildTemplateValidationCheck_(
    'metadata',
    '分類ルール',
    grouped.metadataMatched > 0 ? 'pass' : 'warn',
    grouped.metadataMatched > 0
      ? 'developer metadata が設定されています。'
      : '現在はシート名の規約で判定します。新規テンプレートでは metadata 設定を推奨します。'
  ));
  checks.push(buildTemplateValidationCheck_(
    'guide',
    '運用ガイドシート',
    ss.getSheetByName('_GUIDE') ? 'pass' : 'warn',
    ss.getSheetByName('_GUIDE') ? '`_GUIDE` シートがあります。' : '運用担当者向けに `_GUIDE` シートの追加を推奨します。'
  ));
  checks.push(buildTemplateValidationCheck_(
    'hidden-data',
    'システムシートの非表示',
    !dataSheet ? 'info' : (dataSheet.isSheetHidden() ? 'pass' : 'warn'),
    !dataSheet ? 'データシート未検出のため未判定です。' : (dataSheet.isSheetHidden() ? 'hidden で管理されています。' : '実運用では hidden を推奨します。')
  ));

  var recommendedActions = [];
  if (!dataSheet) {
    recommendedActions.push(kind === 'ROSTER' ? '`_DATA_ROSTER` を追加する' : '`_DATA_REMINDER` を追加する');
  }
  if (grouped.personal.length === 0) {
    recommendedActions.push(kind === 'ROSTER' ? '`P_01_会員基本` を追加する' : '`R_P_01_催促状` を追加する');
  }
  if (grouped.business.length === 0) {
    recommendedActions.push(kind === 'ROSTER' ? '`B_01_会員基本` を追加する' : '`R_B_01_催促状` を追加する');
  }
  if (grouped.metadataMatched === 0) {
    recommendedActions.push('新規テンプレートでは developer metadata を設定する');
  }
  if (!ss.getSheetByName('_GUIDE')) {
    recommendedActions.push('運用担当者向けの `_GUIDE` シートを追加する');
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push('このまま利用できます。印刷シートだけを編集し、hidden シートは保護してください。');
  }

  return {
    kind: kind,
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: ss.getUrl(),
    spreadsheetName: ss.getName(),
    summaryStatus: summarizeTemplateValidationStatus_(checks),
    visibleSheets: visibleSheets,
    hiddenSheets: hiddenSheets,
    checks: checks,
    recommendedActions: recommendedActions,
  };
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

  // ホワイトリスト変更時は権限解決キャッシュを両方無効化する
  clearAdminPermissionCaches_();
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
  // ホワイトリスト変更時は権限解決キャッシュを両方無効化する
  clearAdminPermissionCaches_();
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
  var sortedActualHistory = history
    .sort(function(a, b) { return Number(b.year || 0) - Number(a.year || 0); });
  var actualByYear = {};
  for (var i = 0; i < sortedActualHistory.length; i += 1) {
    var record = sortedActualHistory[i];
    var year = Number(record && record.year || 0);
    if (!year || actualByYear[year]) continue;
    actualByYear[year] = record;
  }

  var prioritizedYears = [];
  if (isAnnualFeeEligibleMemberForYear_(memberRow, currentFiscalYear)) {
    prioritizedYears.push(currentFiscalYear);
  }
  if (isAnnualFeeEligibleMemberForYear_(memberRow, currentFiscalYear - 1)) {
    prioritizedYears.push(currentFiscalYear - 1);
  }

  if (prioritizedYears.length === 0) {
    return sortedActualHistory.slice(0, 2);
  }

  return prioritizedYears.map(function(year) {
    if (actualByYear[year]) return actualByYear[year];
    return {
      id: '',
      year: year,
      status: 'UNPAID',
      confirmedDate: '',
      amount: resolveAnnualFeeAmount_(memberRow, memberTypeFeeMap, 0),
      note: '',
      updatedAt: '',
    };
  });
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

// T_システム設定を1回の読み込みで全設定を {key: value} マップとして返す（N+1回避）
function getSystemSettingMap_(ss) {
  var rows = getRowsAsObjects_(ss, 'T_システム設定');
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var k = String(rows[i]['設定キー'] || '');
    if (!k) continue;
    var v = rows[i]['設定値'];
    map[k] = (v === null || v === undefined) ? '' : String(v);
  }
  return map;
}

// 複数の設定を一括書き込み：読み2回＋書き1回で完結（N+1問題を解消）
function batchUpsertSystemSettings_(ss, updates) {
  if (!updates || updates.length === 0) return;
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var headerValues = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var columns = {};
  for (var i = 0; i < headerValues.length; i++) {
    columns[String(headerValues[i] || '')] = i;
  }
  var keyCol = columns['設定キー'];
  var valueCol = columns['設定値'];
  var descCol = columns['説明'];
  var updatedAtCol = columns['更新日時'];
  if (keyCol === undefined) return;
  var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  // key → row index マップ
  var keyToIndex = {};
  for (var r = 0; r < data.length; r++) {
    var k = String(data[r][keyCol] || '');
    if (k) keyToIndex[k] = r;
  }
  var now = new Date().toISOString();
  var modified = false;
  var toAppend = [];
  for (var u = 0; u < updates.length; u++) {
    var upd = updates[u];
    if (keyToIndex[upd.key] !== undefined) {
      var ri = keyToIndex[upd.key];
      if (valueCol !== undefined) data[ri][valueCol] = upd.value;
      if (descCol !== undefined) data[ri][descCol] = upd.description || '';
      if (updatedAtCol !== undefined) data[ri][updatedAtCol] = now;
      modified = true;
    } else {
      toAppend.push(upd);
    }
  }
  // 変更行を一括書き戻し（1回の setValues）
  if (modified && data.length > 0) {
    sheet.getRange(2, 1, data.length, lastCol).setValues(data);
  }
  // 新規行はアペンド
  for (var ap = 0; ap < toAppend.length; ap++) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      '設定キー': toAppend[ap].key,
      '設定値': toAppend[ap].value,
      '説明': toAppend[ap].description || '',
      '更新日時': now,
    }]);
  }
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
      case '勤務先住所2': return String(payload.officeAddressLine2 || '');
      case '勤務先電話番号': return String(payload.phone || '');
      case '勤務先FAX番号': return String(payload.fax || '');
      case '自宅郵便番号': return String(payload.homePostCode || '');
      case '自宅都道府県': return String(payload.homePrefecture || '');
      case '自宅市区町村': return String(payload.homeCity || '');
      case '自宅住所': return String(payload.homeAddressLine || '');
      case '自宅住所2': return String(payload.homeAddressLine2 || '');
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
    var hashed = hashPasswordPbkdf2_(defaultPassword, salt);
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









// ── ログイン情報メール送信 ──────────────────────────────────
/**
 * 入会時認証情報メールを送信する。
 * opts.subject / opts.body にマージタグを含むテンプレートを渡す。
 * 利用可能マージタグ: {{氏名}} {{ログインID}} {{パスワード}} {{会員マイページURL}}
 * opts を省略した場合はデフォルトテンプレートを使用する。
 */
// v265: {{変数名}} プレースホルダーを vars オブジェクトで置換するヘルパー
function renderBizEmailTemplate_(template, vars) {
  var result = String(template || '');
  var keys = Object.keys(vars);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    result = result.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(vars[k] == null ? '' : vars[k]));
  }
  return result;
}

// v265: 事業所メール設定をまとめて取得するヘルパー（T_システム設定から）
function getBizEmailSettings_(ss) {
  var m = getSystemSettingMap_(ss);
  var toB = function(key, def) {
    var v = m[key];
    return (v === '' || v === null || v === undefined) ? def : String(v) !== 'false';
  };
  return {
    bizRepEmailEnabled:      toB('BIZ_REP_EMAIL_ENABLED', true),
    bizRepEmailSubject:      String(m['BIZ_REP_EMAIL_SUBJECT'] || '') || BIZ_REP_EMAIL_DEFAULT_SUBJECT,
    bizRepEmailBody:         String(m['BIZ_REP_EMAIL_BODY'] || '') || BIZ_REP_EMAIL_DEFAULT_BODY,
    bizStaffEmailEnabled:    toB('BIZ_STAFF_EMAIL_ENABLED', true),
    bizStaffEmailSubject:    String(m['BIZ_STAFF_EMAIL_SUBJECT'] || '') || BIZ_STAFF_EMAIL_DEFAULT_SUBJECT,
    bizStaffEmailBody:       String(m['BIZ_STAFF_EMAIL_BODY'] || '') || BIZ_STAFF_EMAIL_DEFAULT_BODY,
    staffAddStaffEmailEnabled: toB('STAFF_ADD_STAFF_EMAIL_ENABLED', true),
    staffAddStaffEmailSubject: String(m['STAFF_ADD_STAFF_EMAIL_SUBJECT'] || '') || STAFF_ADD_STAFF_EMAIL_DEFAULT_SUBJECT,
    staffAddStaffEmailBody:    String(m['STAFF_ADD_STAFF_EMAIL_BODY'] || '') || STAFF_ADD_STAFF_EMAIL_DEFAULT_BODY,
    staffAddRepEmailEnabled:   toB('STAFF_ADD_REP_EMAIL_ENABLED', true),
    staffAddRepEmailSubject:   String(m['STAFF_ADD_REP_EMAIL_SUBJECT'] || '') || STAFF_ADD_REP_EMAIL_DEFAULT_SUBJECT,
    staffAddRepEmailBody:      String(m['STAFF_ADD_REP_EMAIL_BODY'] || '') || STAFF_ADD_REP_EMAIL_DEFAULT_BODY,
  };
}


// ── 入会メール テンプレート管理（v219）──────────────────
// T_システム設定 の CREDENTIAL_EMAIL_TEMPLATES キーに JSON 配列で保存
// [{id, name, subject, body, savedAt}, ...]

function getCredentialEmailTemplates_() {
  var ss = getOrCreateDatabase_();
  var raw = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_TEMPLATES');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveCredentialEmailTemplate_(payload) {
  if (!payload || !String(payload.name || '').trim()) throw new Error('テンプレート名は必須です。');
  var ss = getOrCreateDatabase_();
  var templates = getCredentialEmailTemplates_();
  var id = payload.id ? String(payload.id) : Utilities.getUuid();
  var now = new Date().toISOString();
  var idx = templates.findIndex(function(t) { return t.id === id; });
  var record = {
    id: id,
    name: String(payload.name).trim(),
    subject: String(payload.subject || ''),
    body: String(payload.body || ''),
    savedAt: now,
  };
  if (idx >= 0) {
    templates[idx] = record;
  } else {
    templates.push(record);
  }
  batchUpsertSystemSettings_(ss, [
    { key: 'CREDENTIAL_EMAIL_TEMPLATES', value: JSON.stringify(templates), description: '入会メールテンプレート一覧（JSON）' }
  ]);
  return record;
}

function deleteCredentialEmailTemplate_(payload) {
  if (!payload || !payload.id) throw new Error('テンプレートIDは必須です。');
  var ss = getOrCreateDatabase_();
  var templates = getCredentialEmailTemplates_();
  var before = templates.length;
  templates = templates.filter(function(t) { return t.id !== String(payload.id); });
  if (templates.length === before) throw new Error('指定テンプレートが見つかりません。');
  batchUpsertSystemSettings_(ss, [
    { key: 'CREDENTIAL_EMAIL_TEMPLATES', value: JSON.stringify(templates), description: '入会メールテンプレート一覧（JSON）' }
  ]);
  return { deletedId: payload.id };
}

// ── 一括メール テンプレート管理（v224）──────────────────
// T_システム設定 の BULK_MAIL_TEMPLATES キーに JSON 配列で保存
// [{id, name, subject, body, savedAt}, ...]

function getBulkMailTemplates_() {
  var ss = getOrCreateDatabase_();
  var raw = getSystemSettingValue_(ss, 'BULK_MAIL_TEMPLATES');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveBulkMailTemplate_(payload) {
  if (!payload || !String(payload.name || '').trim()) throw new Error('テンプレート名は必須です。');
  var ss = getOrCreateDatabase_();
  var templates = getBulkMailTemplates_();
  var id = payload.id ? String(payload.id) : Utilities.getUuid();
  var now = new Date().toISOString();
  var idx = templates.findIndex(function(t) { return t.id === id; });
  var record = {
    id: id,
    name: String(payload.name).trim(),
    subject: String(payload.subject || ''),
    body: String(payload.body || ''),
    savedAt: now,
  };
  if (idx >= 0) {
    templates[idx] = record;
  } else {
    templates.push(record);
  }
  batchUpsertSystemSettings_(ss, [
    { key: 'BULK_MAIL_TEMPLATES', value: JSON.stringify(templates), description: '一括メールテンプレート一覧（JSON）' }
  ]);
  return record;
}

function deleteBulkMailTemplate_(payload) {
  if (!payload || !payload.id) throw new Error('テンプレートIDは必須です。');
  var ss = getOrCreateDatabase_();
  var templates = getBulkMailTemplates_();
  var before = templates.length;
  templates = templates.filter(function(t) { return t.id !== String(payload.id); });
  if (templates.length === before) throw new Error('指定テンプレートが見つかりません。');
  batchUpsertSystemSettings_(ss, [
    { key: 'BULK_MAIL_TEMPLATES', value: JSON.stringify(templates), description: '一括メールテンプレート一覧（JSON）' }
  ]);
  return { deletedId: payload.id };
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
function rebindAuthPrincipal_(ss, options) {
  options = options || {};
  var sourceMemberId = String(options.sourceMemberId || '').trim();
  var sourceStaffId = String(options.sourceStaffId || '').trim();
  var targetMemberId = String(options.targetMemberId || '').trim();
  var targetStaffId = String(options.targetStaffId || '').trim();
  var targetRoleCode = String(options.targetRoleCode || '').trim();
  var updatedAt = String(options.updatedAt || new Date().toISOString());
  var result = { updatedCount: 0, authIds: [] };
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return result;

  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  var rows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();

  for (var r = 0; r < rows.length; r += 1) {
    if (toBoolean_(rows[r][cols['削除フラグ']])) continue;
    var rowMemberId = String(rows[r][cols['会員ID']] || '').trim();
    var rowStaffId = String(rows[r][cols['職員ID']] || '').trim();
    var shouldUpdate = sourceStaffId
      ? rowStaffId === sourceStaffId
      : !!sourceMemberId && rowMemberId === sourceMemberId;
    if (!shouldUpdate) continue;

    rows[r][cols['会員ID']] = targetMemberId;
    rows[r][cols['職員ID']] = targetStaffId;
    if (cols['システムロールコード'] != null && targetRoleCode) {
      rows[r][cols['システムロールコード']] = targetRoleCode;
    }
    if (cols['アカウント有効フラグ'] != null) {
      rows[r][cols['アカウント有効フラグ']] = true;
    }
    if (cols['更新日時'] != null) {
      rows[r][cols['更新日時']] = updatedAt;
    }
    authSheet.getRange(r + 2, 1, 1, rows[r].length).setValues([rows[r]]);

    result.updatedCount += 1;
    result.authIds.push(String(rows[r][cols['認証ID']] || ''));
  }

  return result;
}

function syncWhitelistMemberLinkByAuthIds_(ss, authIds, memberId, updatedAt) {
  var normalizedAuthIds = uniqueStrings_(authIds || []).filter(function(id) { return !!String(id || '').trim(); });
  if (!normalizedAuthIds.length) return 0;

  var whitelistSheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!whitelistSheet || whitelistSheet.getLastRow() < 2) return 0;

  var headers = whitelistSheet.getRange(1, 1, 1, whitelistSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  var rows = whitelistSheet.getRange(2, 1, whitelistSheet.getLastRow() - 1, whitelistSheet.getLastColumn()).getValues();
  var updatedCount = 0;

  for (var r = 0; r < rows.length; r += 1) {
    if (toBoolean_(rows[r][cols['削除フラグ']])) continue;
    var linkedAuthId = String(rows[r][cols['紐付け認証ID']] || '').trim();
    if (normalizedAuthIds.indexOf(linkedAuthId) === -1) continue;

    if (cols['紐付け会員ID'] != null) {
      rows[r][cols['紐付け会員ID']] = memberId;
    }
    if (cols['変更日時'] != null) {
      rows[r][cols['変更日時']] = updatedAt;
    }
    if (cols['更新日時'] != null) {
      rows[r][cols['更新日時']] = updatedAt;
    }
    whitelistSheet.getRange(r + 2, 1, 1, rows[r].length).setValues([rows[r]]);
    updatedCount += 1;
  }

  return updatedCount;
}


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

  // now/today をここで確定（ステップ3で使うため、ステップ5より前に宣言）
  var now = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  // 2.5. 介護支援専門員番号を先取得して事前チェック（DB変更前）
  var staffCareNumPre = String(sRow[sCols['介護支援専門員番号']] || '').trim();
  if (staffCareNumPre) {
    var otherEnrolledSameCM = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === staffCareNumPre
        && String(r['職員状態コード'] || '') === 'ENROLLED'
        && String(r['職員ID'] || '') !== sourceStaffId;
    });
    if (otherEnrolledSameCM.length > 0) {
      throw new Error('介護支援専門員番号 ' + staffCareNumPre + ' の在籍職員が他事業所に存在します（職員ID: ' + otherEnrolledSameCM.map(function(r) { return String(r['職員ID'] || ''); }).join(', ') + '）。重複を解消してから再度お試しください。');
    }
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

  // 5. 個人会員レコード: 同一CM番号の既存 WITHDRAWN 行を再活性化、なければ新規作成
  // 再活性化により往復変換でのレコード蓄積を防ぎ、年会費履歴を自動継承する。
  var newMemberId;
  var reuseFound = null;
  if (staffCareNum) {
    var memberCandidates = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === staffCareNum
        && String(r['会員種別コード'] || '') !== 'BUSINESS'
        && String(r['会員状態コード'] || '') === 'WITHDRAWN';
    });
    memberCandidates.sort(function(a, b) {
      // 退会日が最も新しい行を優先
      var da = String(a['退会日'] || a['更新日時'] || '');
      var db = String(b['退会日'] || b['更新日時'] || '');
      return da > db ? -1 : 1;
    });
    if (memberCandidates.length > 0) {
      reuseFound = findRowByColumnValue_(memberSheet, '会員ID', String(memberCandidates[0]['会員ID'] || ''));
    }
  }
  if (reuseFound) {
    // 既存行を再活性化（入会日=再入会日、氏名・メールを職員情報で更新）
    newMemberId = String(reuseFound.row[reuseFound.columns['会員ID']] || '');
    var updMemberRow = reuseFound.row.slice();
    updMemberRow[reuseFound.columns['会員状態コード']] = 'ACTIVE';
    updMemberRow[reuseFound.columns['入会日']] = today;
    updMemberRow[reuseFound.columns['退会日']] = '';
    if (reuseFound.columns['姓'] != null) updMemberRow[reuseFound.columns['姓']] = lastName;
    if (reuseFound.columns['名'] != null) updMemberRow[reuseFound.columns['名']] = firstName;
    if (reuseFound.columns['セイ'] != null) updMemberRow[reuseFound.columns['セイ']] = lastKana;
    if (reuseFound.columns['メイ'] != null) updMemberRow[reuseFound.columns['メイ']] = firstKana;
    if (reuseFound.columns['代表メールアドレス'] != null) updMemberRow[reuseFound.columns['代表メールアドレス']] = staffEmail;
    updMemberRow[reuseFound.columns['更新日時']] = now;
    memberSheet.getRange(reuseFound.rowNumber, 1, 1, updMemberRow.length).setValues([updMemberRow]);
  } else {
    // 初回変換 or CM番号なし → 新規作成
    newMemberId = generateMemberId_();
    while (findRowByColumnValue_(memberSheet, '会員ID', newMemberId)) {
      newMemberId = generateMemberId_();
    }
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
  }

  // 6. T_事業所職員を LEFT + 削除フラグ
  var updStaffRow = sRow.slice();
  updStaffRow[sCols['職員状態コード']] = 'LEFT';
  updStaffRow[sCols['退会日']] = today;
  updStaffRow[sCols['削除フラグ']] = true;
  updStaffRow[sCols['更新日時']] = now;
  staffSheet.getRange(staffFound.rowNumber, 1, 1, updStaffRow.length).setValues([updStaffRow]);

  // 7. T_認証アカウント: 会員ID→新ID, 職員ID→クリア, 有効フラグ=true
  var authRebind = rebindAuthPrincipal_(ss, {
    sourceStaffId: sourceStaffId,
    targetMemberId: newMemberId,
    targetStaffId: '',
    targetRoleCode: 'INDIVIDUAL_MEMBER',
    updatedAt: now,
  });
  syncWhitelistMemberLinkByAuthIds_(ss, authRebind.authIds, newMemberId, now);

  // 8. T_研修申込: 該当職員の申込を新会員IDに更新
  migrateTrainingApplications_(ss, sourceMemberId, sourceStaffId, newMemberId, '');
  // post-check は廃止: 再活性化パターン + 事前チェック（step 2.5）で整合性を保証するため不要

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
  if (['REPRESENTATIVE', 'ADMIN', 'STAFF'].indexOf(staffRole) === -1) staffRole = 'STAFF';

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
  var allEnrolledStaff = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === targetOfficeMemberId
      && String(r['職員状態コード'] || '') === 'ENROLLED';
  });
  var staffLimit = Number(officeFound.row[officeFound.columns['職員数上限']] || 50);
  if (allEnrolledStaff.length >= staffLimit) {
    throw new Error('転籍先の事業所は職員数上限（' + staffLimit + '名）に達しています。');
  }

  // 3.5. 介護支援専門員番号の解決（賛助会員でペイロードから受け取る場合を含む）
  var srcCareNum = String(srcRow[srcCols['介護支援専門員番号']] || '').trim();
  var inputCareNum = String(payload.careManagerNumber || '').trim();
  if (!srcCareNum && srcType === 'SUPPORT') {
    // 賛助会員で介護支援専門員番号が未登録の場合は入力値を必須とする
    if (!inputCareNum) {
      throw new Error('賛助会員を事業所職員として転籍するには介護支援専門員番号が必要です。モーダルで介護支援専門員番号を入力してください。');
    }
    if (!/^\d{8}$/.test(inputCareNum)) {
      throw new Error('介護支援専門員番号は8桁の半角数字で入力してください。');
    }
    srcCareNum = inputCareNum;
  } else if (!srcCareNum && srcType === 'INDIVIDUAL') {
    // 個人会員で介護支援専門員番号がない場合（データ不整合）は警告付きで続行
    Logger.log('警告: 個人会員 ' + sourceMemberId + ' に介護支援専門員番号が登録されていません。');
  }
  // 3.6. Pre-check: DB変更前に全会員・全事業所を対象とした重複確認（変更後アサートより安全）
  if (srcCareNum) {
    // (a) 転籍元以外の有効な個人/賛助会員に同一CM番号が存在しないか
    var allMemberRowsForCheck = getRowsAsObjects_(ss, 'T_会員');
    var activeSameCMMembers = allMemberRowsForCheck.filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === srcCareNum
        && String(r['会員種別コード'] || '') !== 'BUSINESS'
        && String(r['会員状態コード'] || 'ACTIVE') !== 'WITHDRAWN'
        && String(r['会員ID'] || '') !== sourceMemberId;
    });
    if (activeSameCMMembers.length > 0) {
      throw new Error('介護支援専門員番号 ' + srcCareNum + ' の有効な個人/賛助会員が他に存在します（会員ID: ' + activeSameCMMembers.map(function(r) { return String(r['会員ID'] || ''); }).join(', ') + '）。データ管理コンソールの「会員CM番号重複修復」を実行してから再度お試しください。');
    }
    // (b) 全事業所で同一CM番号のENROLLED職員が存在しないか
    var allStaffRowsForCheck = getRowsAsObjects_(ss, 'T_事業所職員');
    var enrolledSameCMStaff = allStaffRowsForCheck.filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === srcCareNum
        && String(r['職員状態コード'] || '') === 'ENROLLED';
    });
    if (enrolledSameCMStaff.length > 0) {
      throw new Error('介護支援専門員番号 ' + srcCareNum + ' の在籍職員が既に存在します（職員ID: ' + enrolledSameCMStaff.map(function(r) { return String(r['職員ID'] || ''); }).join(', ') + '）。重複を解消してから再度お試しください。');
    }
  }

  // 4. 職員レコード: 同一CM番号 × 同一事業所の既存 LEFT 行を再活性化、なければ新規作成
  // 再活性化により往復変換でのレコード蓄積を防ぐ。
  var now = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var staffName = (String(srcRow[srcCols['姓']] || '') + ' ' + String(srcRow[srcCols['名']] || '')).trim();
  var staffKana = (String(srcRow[srcCols['セイ']] || '') + ' ' + String(srcRow[srcCols['メイ']] || '')).trim();
  var staffEmail = String(srcRow[srcCols['代表メールアドレス']] || '').trim();
  if (!staffEmail) {
    throw new Error('事業所職員へ転籍するには転籍元会員のメールアドレスが必須です。先に個人会員または賛助会員のメールアドレスを登録してください。');
  }
  var staffCareNum = srcCareNum; // step 3.5 で確定済み

  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');

  var newStaffId;
  var reuseStaffFound = null;
  if (staffCareNum) {
    // 削除フラグ=true の LEFT 行も再活性化対象（変換時に削除フラグが付くため）
    var staffCandidates = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
      return String(r['会員ID'] || '') === targetOfficeMemberId
        && String(r['介護支援専門員番号'] || '').trim() === staffCareNum
        && String(r['職員状態コード'] || '') === 'LEFT';
    });
    staffCandidates.sort(function(a, b) {
      var da = String(a['退会日'] || a['更新日時'] || '');
      var db = String(b['退会日'] || b['更新日時'] || '');
      return da > db ? -1 : 1;
    });
    if (staffCandidates.length > 0) {
      reuseStaffFound = findRowByColumnValue_(staffSheet, '職員ID', String(staffCandidates[0]['職員ID'] || ''));
    }
  }
  if (reuseStaffFound) {
    // 既存行を再活性化（入会日=再入会日、権限・氏名・メール・CM番号を更新）
    newStaffId = String(reuseStaffFound.row[reuseStaffFound.columns['職員ID']] || '');
    var updStaff = reuseStaffFound.row.slice();
    updStaff[reuseStaffFound.columns['職員状態コード']] = 'ENROLLED';
    updStaff[reuseStaffFound.columns['入会日']] = today;
    updStaff[reuseStaffFound.columns['退会日']] = '';
    updStaff[reuseStaffFound.columns['削除フラグ']] = false;
    updStaff[reuseStaffFound.columns['職員権限コード']] = staffRole;
    if (reuseStaffFound.columns['姓'] != null) updStaff[reuseStaffFound.columns['姓']] = String(srcRow[srcCols['姓']] || '');
    if (reuseStaffFound.columns['名'] != null) updStaff[reuseStaffFound.columns['名']] = String(srcRow[srcCols['名']] || '');
    if (reuseStaffFound.columns['セイ'] != null) updStaff[reuseStaffFound.columns['セイ']] = String(srcRow[srcCols['セイ']] || '');
    if (reuseStaffFound.columns['メイ'] != null) updStaff[reuseStaffFound.columns['メイ']] = String(srcRow[srcCols['メイ']] || '');
    if (reuseStaffFound.columns['氏名'] != null) updStaff[reuseStaffFound.columns['氏名']] = staffName;
    if (reuseStaffFound.columns['フリガナ'] != null) updStaff[reuseStaffFound.columns['フリガナ']] = staffKana;
    if (reuseStaffFound.columns['メールアドレス'] != null) updStaff[reuseStaffFound.columns['メールアドレス']] = staffEmail;
    if (reuseStaffFound.columns['介護支援専門員番号'] != null) updStaff[reuseStaffFound.columns['介護支援専門員番号']] = staffCareNum;
    updStaff[reuseStaffFound.columns['更新日時']] = now;
    staffSheet.getRange(reuseStaffFound.rowNumber, 1, 1, updStaff.length).setValues([updStaff]);
  } else {
    // 初回転籍 or CM番号なし → 新規作成
    newStaffId = 'S' + Date.now();
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
  }

  // 5. T_認証アカウント: 会員ID→事業所ID, 職員ID→新ID, 有効フラグ=true
  var targetRoleCode = staffRole === 'STAFF' ? 'BUSINESS_MEMBER' : 'BUSINESS_ADMIN';
  var authRebind = rebindAuthPrincipal_(ss, {
    sourceMemberId: sourceMemberId,
    targetMemberId: targetOfficeMemberId,
    targetStaffId: newStaffId,
    targetRoleCode: targetRoleCode,
    updatedAt: now,
  });
  syncWhitelistMemberLinkByAuthIds_(ss, authRebind.authIds, targetOfficeMemberId, now);

  // 6. 元の個人会員を退会（賛助会員で新規入力 CM 番号があれば書き戻す）
  var updSrcRow = srcRow.slice();
  updSrcRow[srcCols['会員状態コード']] = 'WITHDRAWN';
  updSrcRow[srcCols['退会日']] = today;
  updSrcRow[srcCols['更新日時']] = now;
  if (inputCareNum && srcCols['介護支援専門員番号'] != null) {
    updSrcRow[srcCols['介護支援専門員番号']] = srcCareNum;
  }
  memberSheet.getRange(srcFound.rowNumber, 1, 1, updSrcRow.length).setValues([updSrcRow]);

  // 7. T_研修申込: 会員ID→事業所ID, 職員ID→新ID
  // ※ assertSingleActiveAffiliationByCareManager_ は DB変更前の 3.6 pre-check に移行済み
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

// ── 研修申込の会員ID/職員ID/申込者IDを移行する ──
// 申込者IDは常に会員IDと一致させる（getTrainingApplicationIntegrityIssues_ の不変条件）。
// 更新対象: 削除フラグ=false のレコードのみ。
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
      data[r][cols['会員ID']] = newMemberId;
      if (cols['申込者ID'] != null) data[r][cols['申込者ID']] = newMemberId; // 申込者IDを会員IDと同期
      if (cols['職員ID'] != null) data[r][cols['職員ID']] = newStaffId;
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      appSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }
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
// 入会日が最も新しい1件を残し、残りを WITHDRAWN + 退会日=本日 に更新する。
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
        if (cols['会員状態コード'] != null) data[ri][cols['会員状態コード']] = 'WITHDRAWN';
        if (cols['退会日'] != null) data[ri][cols['退会日']] = today;
        if (cols['更新日時'] != null) data[ri][cols['更新日時']] = now;
        memberSheet.getRange(ri + 2, 1, 1, data[ri].length).setValues([data[ri]]);
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

// ── 会員セルフ退会申請（年度末退会予約）──────────────────────
// パスワード再認証 → 会員状態を WITHDRAWAL_SCHEDULED に変更 → 退会日を年度末(3/31)に設定
// アカウントは無効化しない（年度末までログイン可能）

// ── 退会申請取り消し（年度末前のセルフ取り消し）──────────────
// パスワード再認証 → WITHDRAWAL_SCHEDULED を ACTIVE に戻す → 退会日クリア

// ── 会員セルフサービス更新（OWASP Mass Assignment 対策）──────────────
// 根拠: OWASP Top 10 A01 / ASVS V4.1.2 / CWE-915
// サーバーサイド allowlist でフィールドをフィルタし、管理者専用フィールドへの
// クライアント側からの書き換えを防止する。
// CM番号編集ポリシー（docs/113 案C確定）:
//   careManagerNumber はこのリストに含めない。会員セルフサービスでは読み取り専用。
//   変更は管理者コンソール（ADMIN_MEMBER_WRITABLE_FIELDS_）経由のみ。
var MEMBER_WRITABLE_FIELDS_ = [
  'lastName','firstName','lastKana','firstKana',
  'homePostCode','homePrefecture','homeCity','homeAddressLine','homeAddressLine2','mobilePhone',
  'officePostCode','officePrefecture','officeCity','officeAddressLine','officeAddressLine2','phone','fax',
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
  'homePostCode','homePrefecture','homeCity','homeAddressLine','homeAddressLine2','mobilePhone',
  'officePostCode','officePrefecture','officeCity','officeAddressLine','officeAddressLine2','phone','fax',
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
// v259: ログSSが設定されている場合はそちらに書き込む
function appendAdminAuditLog_(ss, adminEmail, memberId, changes) {
  if (!changes || changes.length === 0) return;
  var sheet = getLogSs_().getSheetByName('T_監査ログ');
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


function updateMember_(payload, options) {
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
  return saveMemberCore_(payload, {
    skipAdminCheck: true,
    adminSession: adminSession,
    ss: ss,
    skipCacheClear: skipCacheClear,
    enableAdminRoleValidation: true,
    enableAdminAudit: true,
  });
}

function saveMemberCore_(payload, options) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var skipAdminCheck = false;
  var adminSession = null;
  var ss = null;
  var skipCacheClear = false;
  var enableAdminRoleValidation = false;
  var enableAdminAudit = false;
  if (typeof options === 'boolean') {
    skipAdminCheck = options;
  } else if (options && typeof options === 'object') {
    skipAdminCheck = options.skipAdminCheck === true;
    adminSession = options.adminSession || null;
    ss = options.ss || null;
    skipCacheClear = options.skipCacheClear === true;
    enableAdminRoleValidation = options.enableAdminRoleValidation === true;
    enableAdminAudit = options.enableAdminAudit === true;
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
  if (enableAdminRoleValidation && memberTypeCode === 'BUSINESS' && currentMemberStatus !== 'WITHDRAWN' && Object.prototype.hasOwnProperty.call(payload, 'staff')) {
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
    officeAddressLine2: fromPayloadOrCurrent('officeAddressLine2', String(getCol('勤務先住所2') || '')),
    phone: fromPayloadOrCurrent('phone', String(getCol('勤務先電話番号') || '')),
    fax: fromPayloadOrCurrent('fax', String(getCol('勤務先FAX番号') || '')),
    homePostCode: fromPayloadOrCurrent('homePostCode', String(getCol('自宅郵便番号') || '')),
    homePrefecture: fromPayloadOrCurrent('homePrefecture', String(getCol('自宅都道府県') || '')),
    homeCity: fromPayloadOrCurrent('homeCity', String(getCol('自宅市区町村') || '')),
    homeAddressLine: fromPayloadOrCurrent('homeAddressLine', String(getCol('自宅住所') || '')),
    homeAddressLine2: fromPayloadOrCurrent('homeAddressLine2', String(getCol('自宅住所2') || '')),
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
  setCol('勤務先住所2', mergedPayload.officeAddressLine2 || '');
  setCol('勤務先電話番号', mergedPayload.phone || '');
  setCol('勤務先FAX番号', mergedPayload.fax || '');
  setCol('自宅郵便番号', mergedPayload.homePostCode || '');
  setCol('自宅都道府県', mergedPayload.homePrefecture || '');
  setCol('自宅市区町村', mergedPayload.homeCity || '');
  setCol('自宅住所', mergedPayload.homeAddressLine || '');
  setCol('自宅住所2', mergedPayload.homeAddressLine2 || '');
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
  if (enableAdminAudit && effectiveAdminSession && effectiveAdminSession.email) {
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
  function isHalfWidthKana(v) { return /^[ｦ-ﾟ\s]+$/u.test(trim(v)); }
  function isEightDigits(v) { return /^\d{8}$/.test(trim(v)); }
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
    if (!isHalfWidthKana(payload.lastKana)) throw new Error('セイは半角ｶﾅで入力してください。');
    if (!isHalfWidthKana(payload.firstKana)) throw new Error('メイは半角ｶﾅで入力してください。');
    if (!isSupport && !trim(payload.careManagerNumber)) throw new Error('賛助会員以外は介護支援専門員番号が必須です。');
    if (trim(payload.careManagerNumber) && !isEightDigits(payload.careManagerNumber)) {
      throw new Error('介護支援専門員番号は8桁の半角数字で入力してください。');
    }
  }

  if (!isWithdrawn) {
    if (!trim(payload.mobilePhone) && !trim(payload.phone)) {
      if (isBusiness) {
        throw new Error('電話番号（または事業所電話番号）が必須です。');
      }
      throw new Error('勤務先電話番号または携帯電話番号のどちらかを入力してください。');
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
  var preferredMailDestination = trim(payload.preferredMailDestination || (isBusiness ? 'OFFICE' : ''));
  var requireOfficeInfo = !isWithdrawn && (
    isBusiness ||
    (!isBusiness && preferredMailDestination === 'OFFICE')
  );
  var requireHomeInfo = !isWithdrawn && !isBusiness && preferredMailDestination === 'HOME';

  if (requireOfficeInfo) {
    if (!trim(payload.officeName)) throw new Error('事業所情報: 勤務先名は必須です。');
    if (isBusiness) {
      if (!trim(payload.officePostCode)) throw new Error('事業所情報: 郵便番号は必須です。');
      if (!trim(payload.officePrefecture)) throw new Error('事業所情報: 都道府県は必須です。');
      if (!trim(payload.officeCity)) throw new Error('事業所情報: 市区町村は必須です。');
      if (!trim(payload.officeAddressLine)) throw new Error('事業所情報: 住所は必須です。');
      if (!trim(payload.phone)) throw new Error('事業所情報: 電話番号は必須です。');
    }
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


// 退会予定日を過ぎた WITHDRAWAL_SCHEDULED を WITHDRAWN に昇格 + 認証アカウント無効化


// v150: 日次トリガーで退会削除ポリシーを実行（ホットパスから除外）

// v150: ウォームアップトリガー（コールドスタート軽減）
// v188: SpreadsheetApp接続確立 + キャッシュ投入でV8ランタイムとDBを同時に温める

// v150: トリガー一括セットアップ（手動で1回実行）

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
      介護支援専門員番号: String(payload.careManagerNumber || '').trim(),
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

// v259: ログSSが設定されている場合はそちらに書き込む
function appendLoginHistory_(ss, authId, loginId, authMethod, result, reason) {
  var historySheet = getLogSs_().getSheetByName('T_ログイン履歴');
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
  var lifecycleStatus = normalizeTrainingLifecycleStatus_(payload.lifecycleStatus || payload.status || 'PUBLISHED');
  payload.organizer = organizer;
  payload.location = location;
  payload.summary = summary;
  payload.status = lifecycleStatus;
  payload.lifecycleStatus = lifecycleStatus;
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
    setCol('研修状態コード', lifecycleStatus);
    setCol('主催者', payload.organizer || '');
    setCol('法定外研修フラグ', payload.isNonMandatory ? true : false);
    setCol('研修概要', payload.summary || '');
    setCol('研修内容', payload.description || '');
    setCol('費用JSON', payload.fees ? JSON.stringify(payload.fees) : '[]');
    setCol('申込開始日', payload.applicationOpenDate || '');
    setCol('申込締切日', payload.applicationCloseDate || '');
    setCol('講師', payload.instructor || '');
    setCol('案内状URL', payload.guidePdfUrl || '');
    setCol('案内状サムネイルURL', payload.thumbnailUrl || '');
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
    return buildTrainingSaveResponse_(payload, lifecycleStatus, Number((cols['申込者数'] != null ? row[cols['申込者数']] : payload.applicants) || 0));
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
    '研修状態コード': lifecycleStatus,
    '主催者': payload.organizer || '',
    '法定外研修フラグ': payload.isNonMandatory ? true : false,
    '研修概要': payload.summary || '',
    '研修内容': payload.description || '',
    '費用JSON': payload.fees ? JSON.stringify(payload.fees) : '[]',
    '申込開始日': payload.applicationOpenDate || '',
    '申込締切日': payload.applicationCloseDate || '',
    '講師': payload.instructor || '',
    '案内状URL': payload.guidePdfUrl || '',
    '案内状サムネイルURL': payload.thumbnailUrl || '',
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
  return buildTrainingSaveResponse_(payload, lifecycleStatus, 0);
}

/**
 * 会員/職員の研修申込を登録する。
 * - 重複申込を防止
 * - 受付期間/受付状態/定員を検証
 * - T_研修申込 へ追記
 * - T_研修 の申込者数を同期
 */

/**
 * 申込済み研修をキャンセルする。
 * - 研修側のキャンセル可否設定を検証
 * - 対象のAPPLIEDレコードをCANCELEDへ更新
 * - T_研修 の申込者数を再集計
 */




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
  return buildTrainingApplicationRelationContextFromRows_(getRowsAsObjectsBatch_(ss, [
    'T_研修',
    'T_会員',
    'T_事業所職員',
    'T_外部申込者',
  ]));
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
  var sourceRows = opts.rows || getRowsAsObjects_(ss, 'T_研修申込');
  return sourceRows.filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    if (opts.appliedOnly && String(row['申込状態コード'] || '') !== 'APPLIED') return false;
    if (opts.trainingId && String(row['研修ID'] || '') !== String(opts.trainingId)) return false;
    if (!isTrainingApplicationRowValid_(row, context)) return false;
    if (opts.memberId && getMemberIdFromApplication_(row) !== String(opts.memberId)) return false;
    return true;
  });
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



function normalizeTrainingLifecycleStatus_(raw) {
  var status = String(raw || '').trim().toUpperCase();
  if (status === 'DRAFT') return 'DRAFT';
  if (status === 'CANCELLED' || status === 'CANCELED') return 'CANCELLED';
  if (status === 'ARCHIVED') return 'ARCHIVED';
  // Legacy OPEN/CLOSED only described application availability. Treat them as visible trainings.
  return 'PUBLISHED';
}

function parseDateOnlyStart_(raw) {
  if (!raw) return null;
  if (Object.prototype.toString.call(raw) === '[object Date]' && !isNaN(raw.getTime())) {
    var date = new Date(raw.getTime());
    date.setHours(0, 0, 0, 0);
    return date;
  }
  var text = String(raw).trim();
  if (!text) return null;
  var normalized = text.replace(/\//g, '-').split('T')[0].split(' ')[0];
  var parsed = new Date(normalized + 'T00:00:00+09:00');
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseTrainingDateTime_(raw) {
  if (!raw) return null;
  if (Object.prototype.toString.call(raw) === '[object Date]' && !isNaN(raw.getTime())) {
    return new Date(raw.getTime());
  }
  var text = String(raw).trim();
  if (!text) return null;
  var normalized = text.replace(/\//g, '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized += 'T23:59:59+09:00';
  } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(normalized)) {
    normalized = normalized.replace(/\s+/, 'T') + '+09:00';
  }
  var parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function computeTrainingAvailability_(trainingRow, options) {
  var now = options && options.now ? options.now : new Date();
  var lifecycleStatus = normalizeTrainingLifecycleStatus_(trainingRow && trainingRow['研修状態コード']);
  var openDate = parseDateOnlyStart_(trainingRow && trainingRow['申込開始日']);
  var closeDate = parseDateOnly_(trainingRow && trainingRow['申込締切日']);
  var eventDate = parseTrainingDateTime_(trainingRow && trainingRow['開催日']);
  var capacity = Number(trainingRow && trainingRow['定員'] || 0);
  var applicants = Number(trainingRow && trainingRow['申込者数'] || 0);

  if (lifecycleStatus !== 'PUBLISHED') {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'UNAVAILABLE', isApplicationOpen: false, applicationStatusReason: '研修が公開状態ではありません。' };
  }
  if (eventDate && now.getTime() > eventDate.getTime()) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'CLOSED', isApplicationOpen: false, applicationStatusReason: '開催日時を過ぎています。' };
  }
  if (openDate && now.getTime() < openDate.getTime()) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'NOT_STARTED', isApplicationOpen: false, applicationStatusReason: '申込開始日前です。' };
  }
  if (closeDate && now.getTime() > closeDate.getTime()) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'CLOSED', isApplicationOpen: false, applicationStatusReason: '申込締切日を過ぎています。' };
  }
  if (capacity > 0 && applicants >= capacity) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'FULL', isApplicationOpen: false, applicationStatusReason: '定員に達しています。' };
  }
  return { lifecycleStatus: lifecycleStatus, applicationStatus: 'OPEN', isApplicationOpen: true, applicationStatusReason: '' };
}

function buildTrainingSaveResponse_(payload, lifecycleStatus, applicants) {
  var response = {};
  Object.keys(payload || {}).forEach(function(key) {
    response[key] = payload[key];
  });
  var availability = computeTrainingAvailability_({
    '研修状態コード': lifecycleStatus,
    '申込開始日': response.applicationOpenDate,
    '申込締切日': response.applicationCloseDate,
    '開催日': response.date,
    '定員': response.capacity,
    '申込者数': applicants,
  });
  response.status = availability.isApplicationOpen ? 'OPEN' : 'CLOSED';
  response.lifecycleStatus = availability.lifecycleStatus;
  response.applicationStatus = availability.applicationStatus;
  response.applicationStatusReason = availability.applicationStatusReason;
  response.isApplicationOpen = availability.isApplicationOpen;
  return response;
}

/**
 * 研修案内状ファイル（base64）をGoogle Driveにアップロードし、共有URLを返す。
 * PDFの場合はGoogleが自動生成するサムネイルを取得して永続保存し thumbnailUrl も返す。
 * payload: { base64: string, filename: string, mimeType: string }
 */
/**
 * 研修ファイル用フォルダを取得する。
 * T_システム設定の TRAINING_FILE_FOLDER_ID が設定済みであればIDで直接取得。
 * 未設定の場合は DriveApp.getRootFolder() 配下に作成してIDを保存する。
 * getFoldersByName() は Drive 全体検索を行うため失敗リスクが高く使用しない。
 */
function getOrCreateTrainingFolder_(ss) {
  // 設定済みフォルダIDを優先使用
  var storedId = ss ? getSystemSettingValue_(ss, 'TRAINING_FILE_FOLDER_ID') : '';
  if (storedId && String(storedId).trim()) {
    try {
      var folder = DriveApp.getFolderById(String(storedId).trim());
      return folder;
    } catch (e) {
      Logger.log('getOrCreateTrainingFolder_: stored ID invalid, will recreate. ' + e.message);
    }
  }

  // フォルダを新規作成してIDを保存
  var newFolder = DriveApp.getRootFolder().createFolder('研修案内状');
  newFolder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  var newFolderId = newFolder.getId();

  // Script Properties にも保存（DBが取得できない場合の保険）
  PropertiesService.getScriptProperties().setProperty('TRAINING_FILE_FOLDER_ID', newFolderId);
  Logger.log('getOrCreateTrainingFolder_: created folder ' + newFolderId);
  return newFolder;
}

/**
 * 研修ファイル用フォルダIDを返す管理者 API。
 * 設定画面の「フォルダを作成・設定する」ボタンから呼び出す。
 */
function setupTrainingFileFolder_(payload) {
  var ss = getOrCreateDatabase_();
  var folder = getOrCreateTrainingFolder_(ss);
  var folderId = folder.getId();
  var folderUrl = 'https://drive.google.com/drive/folders/' + folderId;

  // T_システム設定に保存
  var updates = [{ key: 'TRAINING_FILE_FOLDER_ID', value: folderId, description: '研修ファイル保存先Driveフォルダ ID' }];
  batchUpsertSystemSettings_(ss, updates);

  return { folderId: folderId, folderUrl: folderUrl };
}

function uploadTrainingFile_(payload) {
  if (!payload || !payload.base64) throw new Error('ファイルデータが空です。');
  var filename = payload.filename || 'upload';
  var mimeType = payload.mimeType || 'application/octet-stream';

  var bytes = Utilities.base64Decode(payload.base64);
  var blob = Utilities.newBlob(bytes, mimeType, filename);

  var ss = getOrCreateDatabase_();
  var folder = getOrCreateTrainingFolder_(ss);

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return { url: file.getUrl(), driveFileId: file.getId(), thumbnailUrl: '' };
}

// ── 研修案内PDF サムネイル バッチ生成（時間ベーストリガーで定期実行）──────────

/**
 * トリガーから呼び出されるエントリーポイント（グローバル関数）。
 * サムネイルURLが空の研修を最大5件処理する。
 */

/**
 * 案内状URLはあるがサムネイルURLが未設定の研修を検索し、
 * Drive のサムネイルが生成済みであれば取得・保存・更新する。
 * 1回の実行で最大 MAX_BATCH 件処理（GASタイムアウト防止）。
 */
function setupThumbnailGenerationTrigger_() {
  // 既存の同名トリガーを削除
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'runThumbnailGeneration') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 10分ごとに実行するトリガーを登録
  ScriptApp.newTrigger('runThumbnailGeneration')
    .timeBased()
    .everyMinutes(10)
    .create();
  Logger.log('Thumbnail generation trigger set (every 10 min).');
}

/**
 * GASが参照するDBスプレッドシートIDを明示設定する。
 */

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

/**
 * v259: ログスプレッドシートを返す。
 * Script Properties に LOG_SPREADSHEET_ID が設定されていればそちらを返す。
 * 未設定またはアクセス失敗時はメインDBにフォールバック（移行前・設定前は既存動作を維持）。
 */
function getLogSs_() {
  var id = PropertiesService.getScriptProperties().getProperty('LOG_SPREADSHEET_ID');
  if (!id) return getOrCreateDatabase_();
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    Logger.log('getLogSs_: ログSSへのアクセス失敗。メインDBにフォールバック: ' + e.message);
    return getOrCreateDatabase_();
  }
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
  normalizeTableColumns_(ss, 'T_会員_archive');
  normalizeTableColumns_(ss, 'T_事業所職員_archive');
  normalizeTableColumns_(ss, 'T_変更申請');
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
  if (!byKey['REMINDER_TEMPLATE_SS_ID']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'REMINDER_TEMPLATE_SS_ID',
      設定値: '',
      説明: '催促用紙テンプレートスプレッドシートID',
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
  var publicPortalTextSettings = [
    { key: 'PUBLIC_PORTAL_HERO_BADGE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled ? 'true' : 'false', desc: '公開ポータル：トップ補助ラベルを表示するか' },
    { key: 'PUBLIC_PORTAL_HERO_BADGE_LABEL', value: PUBLIC_PORTAL_DEFAULTS.heroBadgeLabel, desc: '公開ポータル：トップ補助ラベル文言' },
    { key: 'PUBLIC_PORTAL_HERO_TITLE', value: PUBLIC_PORTAL_DEFAULTS.heroTitle, desc: '公開ポータル：トップ見出し' },
    { key: 'PUBLIC_PORTAL_HERO_DESCRIPTION_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled ? 'true' : 'false', desc: '公開ポータル：トップ説明文を表示するか' },
    { key: 'PUBLIC_PORTAL_HERO_DESCRIPTION', value: PUBLIC_PORTAL_DEFAULTS.heroDescription, desc: '公開ポータル：トップ説明文' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_BADGE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled ? 'true' : 'false', desc: '公開ポータル：入会カード補助ラベルを表示するか' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_BADGE_LABEL', value: PUBLIC_PORTAL_DEFAULTS.membershipBadgeLabel, desc: '公開ポータル：入会カード補助ラベル文言' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_TITLE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled ? 'true' : 'false', desc: '公開ポータル：入会カード見出しを表示するか' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_TITLE', value: PUBLIC_PORTAL_DEFAULTS.membershipTitle, desc: '公開ポータル：入会カード見出し' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled ? 'true' : 'false', desc: '公開ポータル：入会カード説明文を表示するか' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION', value: PUBLIC_PORTAL_DEFAULTS.membershipDescription, desc: '公開ポータル：入会カード説明文' },
    { key: 'PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL', value: PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel, desc: '公開ポータル：入会カードボタン文言' },
    { key: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE', value: PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible ? 'true' : 'false', desc: '公開ポータル：入会完了画面の今後のご案内ブロックを表示するか' },
    { key: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT', value: PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialSent, desc: '公開ポータル：入会完了画面・今後のご案内（メール送信ON時）' },
    { key: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT', value: PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialNotSent, desc: '公開ポータル：入会完了画面・今後のご案内（メール送信OFF時）' },
    { key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE', value: PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible ? 'true' : 'false', desc: '公開ポータル：入会完了画面のログイン情報ブロックを表示するか' },
    { key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE', value: PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible ? 'true' : 'false', desc: '公開ポータル：入会完了画面のログイン情報を表示するか' },
    { key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT', value: PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialSent, desc: '公開ポータル：入会完了画面・ログイン情報補足本文（メール送信ON時）' },
    { key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT', value: PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent, desc: '公開ポータル：入会完了画面・ログイン情報補足本文（メール送信OFF時）' },
    { key: 'PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE', value: PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice, desc: '公開ポータル：入会完了画面・ログイン情報未送信時の案内文' },
    { key: 'PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE', value: PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice, desc: '公開ポータル：入会完了画面・ログイン情報送信済み時の案内文' },
    { key: 'PUBLIC_PORTAL_TRAINING_BADGE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled ? 'true' : 'false', desc: '公開ポータル：研修カード補助ラベルを表示するか' },
    { key: 'PUBLIC_PORTAL_TRAINING_BADGE_LABEL', value: PUBLIC_PORTAL_DEFAULTS.trainingBadgeLabel, desc: '公開ポータル：研修カード補助ラベル文言' },
    { key: 'PUBLIC_PORTAL_TRAINING_TITLE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled ? 'true' : 'false', desc: '公開ポータル：研修カード見出しを表示するか' },
    { key: 'PUBLIC_PORTAL_TRAINING_TITLE', value: PUBLIC_PORTAL_DEFAULTS.trainingTitle, desc: '公開ポータル：研修カード見出し' },
    { key: 'PUBLIC_PORTAL_TRAINING_DESCRIPTION_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled ? 'true' : 'false', desc: '公開ポータル：研修カード説明文を表示するか' },
    { key: 'PUBLIC_PORTAL_TRAINING_DESCRIPTION', value: PUBLIC_PORTAL_DEFAULTS.trainingDescription, desc: '公開ポータル：研修カード説明文' },
    { key: 'PUBLIC_PORTAL_TRAINING_CTA_LABEL', value: PUBLIC_PORTAL_DEFAULTS.trainingCtaLabel, desc: '公開ポータル：研修カードボタン文言' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled ? 'true' : 'false', desc: '公開ポータル：登録情報変更メニューを表示するか' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled ? 'true' : 'false', desc: '公開ポータル：登録情報変更カード補助ラベルを表示するか' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_LABEL', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeLabel, desc: '公開ポータル：登録情報変更カード補助ラベル文言' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_TITLE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled ? 'true' : 'false', desc: '公開ポータル：登録情報変更カード見出しを表示するか' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_TITLE', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateTitle, desc: '公開ポータル：登録情報変更カード見出し' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled ? 'true' : 'false', desc: '公開ポータル：登録情報変更カード説明文を表示するか' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateDescription, desc: '公開ポータル：登録情報変更カード説明文' },
    { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL', value: PUBLIC_PORTAL_DEFAULTS.memberUpdateCtaLabel, desc: '公開ポータル：登録情報変更カードボタン文言' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled ? 'true' : 'false', desc: '公開ポータル：退会申込メニューを表示するか' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_BADGE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled ? 'true' : 'false', desc: '公開ポータル：退会カード補助ラベルを表示するか' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_BADGE_LABEL', value: PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeLabel, desc: '公開ポータル：退会カード補助ラベル文言' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_TITLE_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled ? 'true' : 'false', desc: '公開ポータル：退会カード見出しを表示するか' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_TITLE', value: PUBLIC_PORTAL_DEFAULTS.withdrawalTitle, desc: '公開ポータル：退会カード見出し' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION_ENABLED', value: PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled ? 'true' : 'false', desc: '公開ポータル：退会カード説明文を表示するか' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION', value: PUBLIC_PORTAL_DEFAULTS.withdrawalDescription, desc: '公開ポータル：退会カード説明文' },
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL', value: PUBLIC_PORTAL_DEFAULTS.withdrawalCtaLabel, desc: '公開ポータル：退会カードボタン文言' },
  ];
  publicPortalTextSettings.forEach(function(item) {
    if (!byKey[item.key]) {
      appendRowsByHeaders_(ss, 'T_システム設定', [{
        設定キー: item.key,
        設定値: item.value,
        説明: item.desc,
        更新日時: now,
      }]);
    }
  });

  // 研修ファイル保存先フォルダID（未設定時は uploadTrainingFile_ で自動作成）
  if (!byKey['TRAINING_FILE_FOLDER_ID']) {
    // Script Properties に保存済みの場合は引き継ぐ
    var existingFolderId = PropertiesService.getScriptProperties().getProperty('TRAINING_FILE_FOLDER_ID') || '';
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'TRAINING_FILE_FOLDER_ID',
      設定値: existingFolderId,
      説明: '研修ファイル保存先 Google Drive フォルダ ID（空の場合は初回アップロード時に自動作成）',
      更新日時: now,
    }]);
  }

  // v265: 個人・賛助会員メール ON/OFF デフォルト初期化
  if (!byKey['IND_SUPP_EMAIL_ENABLED']) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: 'IND_SUPP_EMAIL_ENABLED',
      設定値: 'true',
      説明: '入会時：個人・賛助会員メール送信ON/OFF',
      更新日時: now,
    }]);
  }

  // v265: 事業所入会・職員追加メール設定 デフォルト初期化
  var bizEmailDefaults = [
    { key: 'BIZ_REP_EMAIL_ENABLED',        value: 'true',                                  desc: '事業所入会時：代表者メール送信ON/OFF' },
    { key: 'BIZ_REP_EMAIL_SUBJECT',         value: BIZ_REP_EMAIL_DEFAULT_SUBJECT,           desc: '事業所入会時：代表者メール件名' },
    { key: 'BIZ_REP_EMAIL_BODY',            value: BIZ_REP_EMAIL_DEFAULT_BODY,              desc: '事業所入会時：代表者メール本文' },
    { key: 'BIZ_STAFF_EMAIL_ENABLED',       value: 'true',                                  desc: '事業所入会時：メンバーメール送信ON/OFF' },
    { key: 'BIZ_STAFF_EMAIL_SUBJECT',       value: BIZ_STAFF_EMAIL_DEFAULT_SUBJECT,         desc: '事業所入会時：メンバーメール件名' },
    { key: 'BIZ_STAFF_EMAIL_BODY',          value: BIZ_STAFF_EMAIL_DEFAULT_BODY,            desc: '事業所入会時：メンバーメール本文' },
    { key: 'STAFF_ADD_STAFF_EMAIL_ENABLED', value: 'true',                                  desc: '職員追加承認時：追加職員メール送信ON/OFF' },
    { key: 'STAFF_ADD_STAFF_EMAIL_SUBJECT', value: STAFF_ADD_STAFF_EMAIL_DEFAULT_SUBJECT,   desc: '職員追加承認時：追加職員メール件名' },
    { key: 'STAFF_ADD_STAFF_EMAIL_BODY',    value: STAFF_ADD_STAFF_EMAIL_DEFAULT_BODY,      desc: '職員追加承認時：追加職員メール本文' },
    { key: 'STAFF_ADD_REP_EMAIL_ENABLED',   value: 'true',                                  desc: '職員追加承認時：代表者通知メール送信ON/OFF' },
    { key: 'STAFF_ADD_REP_EMAIL_SUBJECT',   value: STAFF_ADD_REP_EMAIL_DEFAULT_SUBJECT,     desc: '職員追加承認時：代表者通知メール件名' },
    { key: 'STAFF_ADD_REP_EMAIL_BODY',      value: STAFF_ADD_REP_EMAIL_DEFAULT_BODY,        desc: '職員追加承認時：代表者通知メール本文' },
  ];
  bizEmailDefaults.forEach(function(item) {
    if (!byKey[item.key]) {
      appendRowsByHeaders_(ss, 'T_システム設定', [{
        設定キー: item.key,
        設定値: item.value,
        説明: item.desc,
        更新日時: now,
      }]);
    }
  });
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

/**
 * keyColumn が keyValue と一致する行の指定フィールドを更新する。
 */

// ─── 申込者数ヘルパー ────────────────────────────────────────────────────────


// ─── 公開ポータル API ─────────────────────────────────────────────────────────

// v210: 公開ポータルの表示設定（認証不要・公開API）

// v272: Google Drive ファイルのサムネイルを base64 data URL で返す。
// X-Frame-Options により iframe 埋め込みが Chrome でブロックされるため、
// サムネイルを GAS 経由で img タグ表示に切り替える。




// ── v260/v261: 公開ポータル 会員情報変更・退会申請 ────────────────────────────

// 個人会員: 公開ポータル変更申請（管理者承認後に適用）で変更可能なフィールド allowlist
var PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_ = [
  'lastName', 'firstName', 'lastKana', 'firstKana',
  'email', 'mobilePhone',
  'phone', 'fax',
  'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  'homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine', 'homeAddressLine2',
  'mailingPreference', 'preferredMailDestination',
  'careManagerNumber',
];

// 事業所会員: 公開ポータル変更申請（管理者承認後に適用）で変更可能なフィールド allowlist
var PUBLIC_BUSINESS_UPDATE_ALLOWLIST_ = [
  'officeName',
  'email', 'phone', 'fax',
  'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  'officeNumber',
];

function normalizeCmNumberForKey_(cm) {
  return String(cm || '').trim().replace(/\s/g, '');
}



// CM番号で個人会員を検索し OTP をメール送信する。
// セキュリティ: CM番号の有無を応答で露出しない（列挙防止）。

// OTP を検証し、成功時に単一使用アクショントークンを発行する。

// アクショントークンを検証し、許可フィールドのみ会員情報を更新する。

// アクショントークンを検証し、年度末退会申請を登録する。

// ── v261: OTP なし照合フロー（個人: CM番号 / 事業所: 事業所番号）──────────────

// CM番号または事業所番号でメンバーを検索し、アクショントークンを発行する。
// token は pub_tok_update_<token> に memberType を含めて保存（30分・多用途）。

// 事業所会員の基本情報変更 + スタッフ追加/除籍をまとめて処理する。
// token は削除せず TTL 内で多用途使用を許容。

// 事業所にスタッフを新規追加する。認証アカウントは別途管理者が発行する。
function addPublicStaffMember_(payload) {
  var token = String(payload.token || '').trim();
  if (!token) return { success: false, error: 'invalid_token' };

  var cache = CacheService.getScriptCache();
  var tokenRaw = cache.get('pub_tok_update_' + token);
  if (!tokenRaw) return { success: false, error: 'token_expired' };

  var stored = JSON.parse(tokenRaw);
  if (stored.memberType !== 'BUSINESS') return { success: false, error: '事業所会員専用の操作です' };
  var memberId = stored.memberId;

  var s = payload.staffData || {};
  var lastName = String(s.lastName || '').trim();
  var firstName = String(s.firstName || '').trim();
  if (!lastName || !firstName) return { success: false, error: '姓と名は必須です' };

  var ss = getOrCreateDatabase_();

  // 職員数上限チェック
  var memberSheet = ss.getSheetByName('T_会員');
  var memberFound = memberSheet ? findRowByColumnValue_(memberSheet, '会員ID', memberId) : null;
  if (memberFound) {
    var limitVal = memberFound.row[memberFound.columns['職員数上限']];
    var staffLimit = limitVal ? Number(limitVal) : 0;
    if (staffLimit > 0) {
      var currentCount = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
        return !toBoolean_(r['削除フラグ']) &&
               String(r['会員ID'] || '') === memberId &&
               String(r['職員状態コード'] || '') === 'ENROLLED';
      }).length;
      if (currentCount >= staffLimit) {
        return { success: false, error: '職員数上限（' + staffLimit + '名）に達しています' };
      }
    }
  }

  var careNum = normalizeCmNumberForKey_(s.careManagerNumber);
  var now = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var newStaffId = 'S' + Date.now();
  var fullName = [lastName, firstName].join(' ').trim();
  var lastKana = String(s.lastKana || '').trim();
  var firstKana = String(s.firstKana || '').trim();
  var fullKana = [lastKana, firstKana].join(' ').trim();

  appendRowsByHeaders_(ss, 'T_事業所職員', [{
    職員ID: newStaffId,
    会員ID: memberId,
    姓: lastName,
    名: firstName,
    セイ: lastKana,
    メイ: firstKana,
    氏名: fullName,
    フリガナ: fullKana,
    メールアドレス: String(s.email || '').trim(),
    職員権限コード: 'STAFF',
    職員状態コード: 'ENROLLED',
    入会日: today,
    退会日: '',
    介護支援専門員番号: careNum,
    メール配信希望コード: 'YES',
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  }]);

  clearAllDataCache_();
  clearAdminDashboardCache_();
  return { success: true, staffId: newStaffId };
}

// 事業所内のスタッフを介護支援専門員番号で検索して除籍する。

// ── v260 公開ポータル OTP 認証フロー ここまで ────────────────────────────────

// ── v264: OTPなし本人確認フロー + 変更申請キュー ─────────────────────────────

// ステートレストークン（HMAC-SHA256署名）: CacheService非依存。
// キーは Script Properties の PUBLIC_TOKEN_SECRET（未設定時はフォールバック値）。


// 本人確認（OTP不要）: 入力情報でDB照合し、成功時にアクショントークンを発行。
// 列挙防止: 照合失敗・未存在ともに同一エラーを返す。
// contactEmail はDB照合に使わず、確認メール送信先として保存する。

// 事業所会員の追加可能スタッフ数を返す。メンバーデータは漏らさない。

// 変更申請をT_変更申請に書き込む。DBは変更しない。管理者承認後に適用される。

// ── 管理者: 変更申請一覧取得 ──────────────────────────────────────────────────
function getAdminChangeRequests_(payload) {
  var ss = getOrCreateDatabase_();
  var rows = getRowsAsObjects_(ss, 'T_変更申請').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });

  var statusFilter = String(payload.status || '').trim();
  var memberTypeFilter = String(payload.memberType || '').trim();
  var requestTypeFilter = String(payload.requestType || '').trim();

  if (statusFilter) rows = rows.filter(function(r) { return String(r['申請状態コード'] || '') === statusFilter; });
  if (memberTypeFilter) rows = rows.filter(function(r) { return String(r['会員種別コード'] || '') === memberTypeFilter; });
  if (requestTypeFilter) rows = rows.filter(function(r) { return String(r['申請種別コード'] || '') === requestTypeFilter; });

  // 新しい順
  rows.sort(function(a, b) {
    return String(b['申請日時'] || '') > String(a['申請日時'] || '') ? 1 : -1;
  });

  return rows.map(function(r) {
    var changeData = {};
    try { changeData = JSON.parse(String(r['申請内容JSON'] || '{}')); } catch(e) {}
    return {
      requestId: String(r['申請ID'] || ''),
      memberId: String(r['会員ID'] || ''),
      memberType: String(r['会員種別コード'] || ''),
      requestType: String(r['申請種別コード'] || ''),
      status: String(r['申請状態コード'] || ''),
      contactEmail: String(r['連絡先メールアドレス'] || ''),
      applicantName: String(r['申請者表示名'] || ''),
      requestedAt: String(r['申請日時'] || ''),
      processedAt: String(r['処理日時'] || ''),
      processedByEmail: String(r['処理者メールアドレス'] || ''),
      processNote: String(r['処理備考'] || ''),
      changeData: changeData,
    };
  });
}

// ── 管理者: 変更申請を承認し変更を適用 ─────────────────────────────────────────
function approveAdminChangeRequest_(payload) {
  var requestId = String(payload.requestId || '').trim();
  if (!requestId) return { success: false, error: '申請IDが必要です' };
  var adminSession = payload.__adminSession;
  if (!adminSession || !adminSession.email) return { success: false, error: 'unauthorized' };

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_変更申請');
  if (!sheet) return { success: false, error: 'テーブルが見つかりません' };

  var found = findRowByColumnValue_(sheet, '申請ID', requestId);
  if (!found) return { success: false, error: '申請が見つかりません' };

  var cols = found.columns;
  var row = found.row;
  var statusVal = String(row[cols['申請状態コード']] || '');
  if (statusVal !== 'PENDING') return { success: false, error: 'この申請はすでに処理済みです（' + statusVal + '）' };

  var memberId = String(row[cols['会員ID']] || '');
  var memberType = String(row[cols['会員種別コード']] || '');
  var requestType = String(row[cols['申請種別コード']] || '');
  var contactEmail = String(row[cols['連絡先メールアドレス']] || '');
  var applicantName = String(row[cols['申請者表示名']] || '');
  var changeData = {};
  try { changeData = JSON.parse(String(row[cols['申請内容JSON']] || '{}')); } catch(e) {}

  var now = new Date().toISOString();

  // ── 変更内容の適用 ────────────────────────────────────────────────────────
  if (requestType === 'MEMBER_UPDATE') {
    var updatePayload = { id: memberId };
    var allowlist = memberType === 'INDIVIDUAL' ? PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_ : PUBLIC_BUSINESS_UPDATE_ALLOWLIST_;
    var fields = changeData.fields || {};
    for (var i = 0; i < allowlist.length; i++) {
      var fk = allowlist[i];
      if (Object.prototype.hasOwnProperty.call(fields, fk) && fields[fk] !== '') {
        updatePayload[fk] = fields[fk];
      }
    }
    if (Object.keys(updatePayload).length > 1) {
      updateMember_(updatePayload, { skipAdminCheck: true });
    }

    // 介護支援専門員番号変更の場合、T_認証アカウントのログインIDも更新
    if (memberType === 'INDIVIDUAL' && fields.careManagerNumber) {
      var authSheet = ss.getSheetByName('T_認証アカウント');
      if (authSheet) {
        var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
          return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
        });
        if (authRows.length > 0) {
          var authFound = findRowByColumnValue_(authSheet, '会員ID', memberId);
          if (authFound) {
            var authRow = authFound.row;
            var authCols = authFound.columns;
            authRow[authCols['ログインID']] = fields.careManagerNumber;
            authRow[authCols['更新日時']] = now;
            authSheet.getRange(authFound.rowNumber, 1, 1, authRow.length).setValues([authRow]);
          }
        }
      }
    }
    // 事業所番号変更の場合、T_認証アカウントのログインIDも更新
    if (memberType === 'BUSINESS' && fields.officeNumber) {
      var bizAuthSheet = ss.getSheetByName('T_認証アカウント');
      if (bizAuthSheet) {
        var bizAuthFound = findRowByColumnValue_(bizAuthSheet, '会員ID', memberId);
        if (bizAuthFound) {
          var bizAuthRow = bizAuthFound.row;
          var bizAuthCols = bizAuthFound.columns;
          bizAuthRow[bizAuthCols['ログインID']] = fields.officeNumber;
          bizAuthRow[bizAuthCols['更新日時']] = now;
          bizAuthSheet.getRange(bizAuthFound.rowNumber, 1, 1, bizAuthRow.length).setValues([bizAuthRow]);
        }
      }
    }
    // MEMBER_UPDATE に含まれるスタッフ追加/除籍も適用（事業所会員の複合申請対応）
    var staffToAddMixed = changeData.staffAdd || [];
    for (var ja = 0; ja < staffToAddMixed.length; ja++) {
      addPublicStaffMember_({ token: 'ADMIN_APPROVED', staffData: staffToAddMixed[ja], _directMemberId: memberId });
    }
    var staffToRemoveMixed = changeData.staffRemove || [];
    for (var kr = 0; kr < staffToRemoveMixed.length; kr++) {
      var srm = staffToRemoveMixed[kr];
      var staffRowsMixed = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
        return !toBoolean_(r['削除フラグ']) &&
               String(r['会員ID'] || '') === memberId &&
               String(r['職員状態コード'] || '') === 'ENROLLED' &&
               normalizeCmNumberForKey_(r['介護支援専門員番号']) === normalizeCmNumberForKey_(srm.careManagerNumber) &&
               String(r['姓'] || '').trim() === srm.lastName &&
               String(r['名'] || '').trim() === srm.firstName;
      });
      if (staffRowsMixed.length === 1) {
        var sIdMixed = String(staffRowsMixed[0]['職員ID'] || '');
        if (sIdMixed) removeStaffFromOffice_({ memberId: memberId, staffId: sIdMixed });
      }
    }

  } else if (requestType === 'WITHDRAWAL') {
    var today = new Date();
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    var withdrawnYear = (month >= 4) ? year + 1 : year;
    var withdrawnDate = withdrawnYear + '-03-31';
    updateMember_({ id: memberId, status: 'WITHDRAWAL_SCHEDULED', withdrawnDate: withdrawnDate }, { skipAdminCheck: true });

  } else if (requestType === 'STAFF_ADD') {
    var staffToAdd = changeData.staffAdd || [];
    for (var j = 0; j < staffToAdd.length; j++) {
      addPublicStaffMember_({
        token: 'ADMIN_APPROVED',
        staffData: staffToAdd[j],
        _directMemberId: memberId,
      });
    }

    // v265: 職員追加承認時メール（全体フラグ最優先）
    var staffAddCredEnabledRaw = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_ENABLED');
    var staffAddCredEnabled = (staffAddCredEnabledRaw === '' || staffAddCredEnabledRaw === null)
      ? true : String(staffAddCredEnabledRaw) !== 'false';
    if (staffAddCredEnabled && staffToAdd.length > 0) {
      var bizMailSettings = getBizEmailSettings_(ss);
      // 事業所名・代表者メールを取得
      var memberRowForEmail = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
        return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
      })[0] || {};
      var officeNameForEmail = String(memberRowForEmail['勤務先名'] || applicantName || '');
      var repStaffRow = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
        return !toBoolean_(r['削除フラグ']) &&
               String(r['会員ID'] || '') === memberId &&
               String(r['職員状態コード'] || '') === 'ENROLLED' &&
               String(r['権限コード'] || '') === 'REPRESENTATIVE';
      })[0] || null;
      var repEmail = repStaffRow ? String(repStaffRow['メールアドレス'] || '') : '';
      var repName = repStaffRow ? (String(repStaffRow['姓'] || '') + ' ' + String(repStaffRow['名'] || '')).trim() : '';
      var fromAddrForStaffAdd = String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim();
      var addedNames = [];

      for (var ja = 0; ja < staffToAdd.length; ja++) {
        var sa = staffToAdd[ja];
        var saName = (String(sa.lastName || '') + ' ' + String(sa.firstName || '')).trim();
        var saEmail = String(sa.email || '').trim();
        var saLoginId = String(sa.careManagerNumber || '').trim();
        var saPassword = 'member' + saLoginId;
        addedNames.push(saName);
        // 追加された職員へのメール
        if (bizMailSettings.staffAddStaffEmailEnabled && saEmail) {
          try {
            var staffAddVars = { 氏名: saName, ログインID: saLoginId, パスワード: saPassword, 会員マイページURL: MEMBER_PORTAL_URL, 事業所名: officeNameForEmail };
            var staffAddBody = renderBizEmailTemplate_(bizMailSettings.staffAddStaffEmailBody, staffAddVars);
            sendEmailWithValidatedFrom_(saEmail, bizMailSettings.staffAddStaffEmailSubject, staffAddBody, { from: fromAddrForStaffAdd });
          } catch (e) {
            Logger.log('staffAdd staff email failed for ' + saEmail + ': ' + e.message);
          }
        }
      }

      // 代表者への追加通知メール
      if (bizMailSettings.staffAddRepEmailEnabled && repEmail) {
        try {
          var repNotifyVars = { 氏名: repName, 会員マイページURL: MEMBER_PORTAL_URL, 事業所名: officeNameForEmail, 追加職員氏名: addedNames.join('、') };
          var repNotifyBody = renderBizEmailTemplate_(bizMailSettings.staffAddRepEmailBody, repNotifyVars);
          sendEmailWithValidatedFrom_(repEmail, bizMailSettings.staffAddRepEmailSubject, repNotifyBody, { from: fromAddrForStaffAdd });
        } catch (e) {
          Logger.log('staffAdd rep notify email failed for ' + repEmail + ': ' + e.message);
        }
      }
    }

  } else if (requestType === 'STAFF_REMOVE') {
    var staffToRemove = changeData.staffRemove || [];
    for (var k = 0; k < staffToRemove.length; k++) {
      var sr = staffToRemove[k];
      var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
        return !toBoolean_(r['削除フラグ']) &&
               String(r['会員ID'] || '') === memberId &&
               String(r['職員状態コード'] || '') === 'ENROLLED' &&
               normalizeCmNumberForKey_(r['介護支援専門員番号']) === normalizeCmNumberForKey_(sr.careManagerNumber) &&
               String(r['姓'] || '').trim() === sr.lastName &&
               String(r['名'] || '').trim() === sr.firstName;
      });
      if (staffRows.length === 1) {
        var sId = String(staffRows[0]['職員ID'] || '');
        if (sId) removeStaffFromOffice_({ memberId: memberId, staffId: sId });
      }
    }
  }

  // ステータス更新
  row[cols['申請状態コード']] = 'APPROVED';
  row[cols['処理日時']] = now;
  row[cols['処理者メールアドレス']] = adminSession.email;
  row[cols['処理備考']] = String(payload.note || '');
  row[cols['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  clearAllDataCache_();
  clearAdminDashboardCache_();

  // 申請者への通知
  if (contactEmail) {
    var typeLabel2 = { MEMBER_UPDATE: '登録情報変更申請', WITHDRAWAL: '退会申請', STAFF_ADD: '職員追加申請', STAFF_REMOVE: '職員除籍申請' };
    MailApp.sendEmail(
      contactEmail,
      '【枚方市介護支援専門員連絡協議会】' + (typeLabel2[requestType] || '申請') + 'が承認されました',
      [
        applicantName + ' 様',
        '',
        'お申し込みいただいた内容が承認され、変更が反映されました。',
        '',
        '申請ID: ' + requestId,
        '処理日時: ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
        '',
        '変更内容の確認は会員マイページをご覧ください。',
        'ご不明な点は事務局までお問い合わせください。',
        '',
        '枚方市介護支援専門員連絡協議会',
      ].join('\n')
    );
  }

  return { success: true, requestId: requestId };
}

// ── 管理者: 変更申請を却下 ──────────────────────────────────────────────────
function rejectAdminChangeRequest_(payload) {
  var requestId = String(payload.requestId || '').trim();
  if (!requestId) return { success: false, error: '申請IDが必要です' };
  var adminSession = payload.__adminSession;
  if (!adminSession || !adminSession.email) return { success: false, error: 'unauthorized' };

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_変更申請');
  if (!sheet) return { success: false, error: 'テーブルが見つかりません' };

  var found = findRowByColumnValue_(sheet, '申請ID', requestId);
  if (!found) return { success: false, error: '申請が見つかりません' };

  var cols = found.columns;
  var row = found.row;
  if (String(row[cols['申請状態コード']] || '') !== 'PENDING') {
    return { success: false, error: 'この申請はすでに処理済みです' };
  }

  var now = new Date().toISOString();
  var contactEmail = String(row[cols['連絡先メールアドレス']] || '');
  var applicantName = String(row[cols['申請者表示名']] || '');
  var requestType = String(row[cols['申請種別コード']] || '');

  row[cols['申請状態コード']] = 'REJECTED';
  row[cols['処理日時']] = now;
  row[cols['処理者メールアドレス']] = adminSession.email;
  row[cols['処理備考']] = String(payload.note || '');
  row[cols['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  if (contactEmail) {
    var typeLabel3 = { MEMBER_UPDATE: '登録情報変更申請', WITHDRAWAL: '退会申請', STAFF_ADD: '職員追加申請', STAFF_REMOVE: '職員除籍申請' };
    MailApp.sendEmail(
      contactEmail,
      '【枚方市介護支援専門員連絡協議会】' + (typeLabel3[requestType] || '申請') + 'について',
      [
        applicantName + ' 様',
        '',
        'お申し込みいただいた内容について、下記の理由により対応できませんでした。',
        '',
        '申請ID: ' + requestId,
        'ご連絡: ' + (payload.note || '事務局よりご連絡いたします。'),
        '',
        'ご不明な点は事務局までお問い合わせください。',
        '',
        '枚方市介護支援専門員連絡協議会',
      ].join('\n')
    );
  }

  return { success: true, requestId: requestId };
}

// addPublicStaffMember_ の管理者承認経由呼び出し対応（_directMemberId でトークン不要）
var _origAddPublicStaffMember = addPublicStaffMember_;
addPublicStaffMember_ = function(payload) {
  if (payload._directMemberId) {
    var ss = getOrCreateDatabase_();
    var memberId = payload._directMemberId;
    var s = payload.staffData || {};
    var lastName = String(s.lastName || '').trim();
    var firstName = String(s.firstName || '').trim();
    if (!lastName || !firstName) return { success: false, error: '姓と名は必須です' };
    var memberSheet = ss.getSheetByName('T_会員');
    var memberFound = memberSheet ? findRowByColumnValue_(memberSheet, '会員ID', memberId) : null;
    if (memberFound) {
      var limitVal = memberFound.row[memberFound.columns['職員数上限']];
      var staffLimit = limitVal ? Number(limitVal) : 0;
      if (staffLimit > 0) {
        var currentCount = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
          return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId && String(r['職員状態コード'] || '') === 'ENROLLED';
        }).length;
        if (currentCount >= staffLimit) return { success: false, error: '職員数上限に達しています' };
      }
    }
    var careNum = normalizeCmNumberForKey_(s.careManagerNumber);
    var now = new Date().toISOString();
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    appendRowsByHeaders_(ss, 'T_事業所職員', [{
      職員ID: 'S' + Date.now(),
      会員ID: memberId,
      姓: lastName,
      名: firstName,
      セイ: String(s.lastKana || '').trim(),
      メイ: String(s.firstKana || '').trim(),
      氏名: [lastName, firstName].join(' ').trim(),
      フリガナ: [String(s.lastKana || '').trim(), String(s.firstKana || '').trim()].join(' ').trim(),
      メールアドレス: String(s.email || '').trim(),
      職員権限コード: 'STAFF',
      職員状態コード: 'ENROLLED',
      入会日: today,
      退会日: '',
      介護支援専門員番号: careNum,
      メール配信希望コード: 'YES',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    }]);
    clearAllDataCache_();
    return { success: true };
  }
  return _origAddPublicStaffMember(payload);
};

// ── v264 変更申請キュー ここまで ────────────────────────────────────────────

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
  try {
    return JSON.stringify({
      success: true,
      data: {
        aliases: listAvailableSendAsAddresses_(),
        warning: '',
      },
    });
  } catch (e) {
    var detail = String(e && e.message ? e.message : e);
    return JSON.stringify({
      success: true,
      data: {
        aliases: [ownerEmail],
        warning: buildSendAsPermissionError_(detail),
      },
    });
  }
}

function buildSendAsPermissionError_(detail) {
  var suffix = detail ? ' 詳細: ' + detail : '';
  return '送信エイリアスの利用に必要な Gmail 権限が不足しています。/exec を開いて再承認し、再度お試しください。' + suffix;
}

function listAvailableSendAsAddresses_() {
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var aliases = [ownerEmail];
  var seen = {};
  seen[ownerEmail] = true;

  var response = UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  if (code !== 200) {
    var detail = '';
    try {
      var errorBody = JSON.parse(response.getContentText() || '{}');
      detail = String(((errorBody.error || {}).message) || '').trim();
    } catch (parseError) {}
    throw new Error(buildSendAsPermissionError_(detail));
  }

  var body = JSON.parse(response.getContentText() || '{}');
  var sendAsList = body.sendAs || [];
  sendAsList.forEach(function(item) {
    var email = String((item || {}).sendAsEmail || '').trim();
    if (email && !seen[email]) {
      seen[email] = true;
      aliases.push(email);
    }
  });
  return aliases;
}

function validateRequestedFromAddress_(from, ownerEmail) {
  var requested = String(from || '').trim();
  if (!requested) return ownerEmail;
  if (requested === ownerEmail) return ownerEmail;

  var aliases = listAvailableSendAsAddresses_();
  if (aliases.indexOf(requested) < 0) {
    throw new Error('指定した送信元アドレスは、この Gmail アカウントで利用可能な送信エイリアスに登録されていません: ' + requested);
  }
  return requested;
}

function sendEmailWithValidatedFrom_(to, subject, body, options) {
  // Session.getEffectiveUser() は userinfo.email スコープが必要。
  // 統合・会員 split では v263 スコープ削減により使用不可のため try-catch で安全に取得する。
  var ownerEmail = '';
  try { ownerEmail = Session.getEffectiveUser().getEmail(); } catch (e) {}

  var from = String((options && options.from) || ownerEmail).trim();
  var replyTo = String((options && options.replyTo) || from || ownerEmail).trim();
  var name = String((options && options.name) || '');
  var attachments = (options && options.attachments) || [];

  var mailOpts = { to: to, subject: subject, body: body, name: name, attachments: attachments };
  if (replyTo) mailOpts.replyTo = replyTo;

  if (!from || from === ownerEmail) {
    // from 未指定 or deploying user → MailApp（userinfo.email スコープ不要）
    MailApp.sendEmail(mailOpts);
    return;
  }

  // 送信エイリアス指定 → GmailApp（admin split での alias 送信用）
  GmailApp.sendEmail(to, subject, body, {
    from: from,
    replyTo: replyTo,
    name: name,
    attachments: attachments,
  });
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

  var ownerEmail = Session.getEffectiveUser().getEmail();
  from = validateRequestedFromAddress_(from, ownerEmail);
  var replyTo = from || ownerEmail;

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
      sendEmailWithValidatedFrom_(rec.email, personalSubject, personalBody, {
        from: from,
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












/**
 * デモアカウントを追加する（append-only, 本番データを削除しない）。
 * 既に存在する場合はスキップする。
 * 名前には [デモ] プレフィックスを付け、本番データと区別できるようにする。
 */













/**
 * Phase 2: 移行対象テーブルのデータ行を削除（ヘッダー保持）
 */

/**
 * ロールバック: バックアップシートからデータを復元する
 */


























































// ── ソース読み取りとパース ──

/**
 * ソーススプレッドシートから名簿データを読み取る（読み取り専用）
 */

/**
 * フリガナが漢字かどうかを判定する
 * カタカナ・ひらがな・半角英数・スペース・記号以外が含まれていれば漢字と判定
 */

/**
 * 住所から都道府県を抽出する
 */

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


/**
 * 日付セル値を YYYY-MM-DD に正規化する
 */

/**
 * 退会処理日から退会日（年度末）を算出する
 * 4月〜3月を1年度とし、処理日が属する年度の3/31を返す
 */

/**
 * ランダムパスワードを生成する（8文字、英数字）
 */

/**
 * CM番号がない場合の9桁ログインID自動生成（先頭9 + 8桁ランダム）
 */



// ── メイン移行関数 ──

/**
 * 名簿移行メイン関数
 * @param {Object} options - { dryRun: true/false }
 * @returns {Object} 移行結果
 */







































/**
 * Phase 5: 移行結果の検証
 */

// ── CLI エントリポイント（clasp run 用） ──





/**
 * 入会日が不明な会員のリストを返す
 */







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
 * v207: 宛名リスト Excel（.xlsx）出力
 *
 * payload: { filterType: 'KOHOUSHI' | 'OSHIRASE' }
 *   KOHOUSHI: 広報誌発送 — ACTIVE + WITHDRAWAL_SCHEDULED の全会員
 *   OSHIRASE: お知らせ発送 — 事業所会員全員 + 個人/賛助のうち 発送方法コード='POST'
 *
 * 住所解決:
 *   事業所会員: 勤務先* フィールドを使用
 *   個人/賛助: 郵送先区分コード が 'HOME' なら 自宅*、それ以外は 勤務先*
 *
 * 都道府県: '大阪府' の場合は出力しない（省略）。他府県のみ表示。
 *
 * 住所不備: 郵便番号・市区町村・番地のいずれかが空の場合は '住所不備' シートへ。
 *
 * 出力シート構成:
 *   [1] 事業所会員  columns: 名前, 郵便番号, 住所, 建物名
 *   [2] 個人会員    columns: 名前, 郵便番号, 住所, 建物名, 勤務先名
 *   [3] 賛助会員    columns: 名前, 郵便番号, 住所, 建物名, 勤務先名
 *   [4] 住所不備    columns: 名前, 会員種別, 住所不備の項目
 *
 * returns: { base64: string, filename: string, counts: { business, individual, support, invalid } }
 */
function generateMailingListExcel_(payload) {
  var p = payload || {};
  var filterType = String(p.filterType || 'KOHOUSHI'); // 'KOHOUSHI' | 'OSHIRASE'

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberSheet = ss.getSheetByName('T_会員');
  var members = getSheetData_(memberSheet);

  var ACTIVE_STATUSES = ['ACTIVE', 'WITHDRAWAL_SCHEDULED'];
  var HEADERS_BIZ     = ['名前', '郵便番号', '住所', '建物名'];
  var HEADERS_IND_SUP = ['名前', '郵便番号', '住所', '建物名', '勤務先名'];
  var HEADERS_INVALID = ['名前', '会員種別', '住所不備の項目'];

  var rowsBiz     = [];
  var rowsInd     = [];
  var rowsSup     = [];
  var rowsInvalid = [];

  members.forEach(function(m) {
    if (toBoolean_(m['削除フラグ'])) return;
    var mtype  = String(m['会員種別コード'] || '');
    var status = String(m['会員状態コード'] || '');
    if (ACTIVE_STATUSES.indexOf(status) < 0) return;

    // お知らせフィルター: 事業所は全員対象。個人・賛助は 発送方法コード='POST' のみ
    if (filterType === 'OSHIRASE' && mtype !== 'BUSINESS') {
      var mailingPref = String(m['発送方法コード'] || 'EMAIL');
      if (mailingPref !== 'POST') return;
    }

    // 事業所会員の宛名は勤務先名。個人・賛助は姓名
    var displayName;
    if (mtype === 'BUSINESS') {
      displayName = String(m['勤務先名'] || '').trim();
    } else {
      var lastName  = String(m['姓'] || '').trim();
      var firstName = String(m['名'] || '').trim();
      displayName   = (lastName + ' ' + firstName).trim();
    }
    if (!displayName) displayName = String(m['会員ID'] || '');

    // 住所解決
    var postCode, prefecture, city, line1, line2;
    if (mtype === 'BUSINESS') {
      postCode   = String(m['勤務先郵便番号'] || '').trim();
      prefecture = String(m['勤務先都道府県'] || '').trim();
      city       = String(m['勤務先市区町村'] || '').trim();
      line1      = String(m['勤務先住所']     || '').trim();
      line2      = String(m['勤務先住所2']    || '').trim();
    } else {
      var dest = String(m['郵送先区分コード'] || 'OFFICE');
      if (dest === 'HOME') {
        postCode   = String(m['自宅郵便番号'] || '').trim();
        prefecture = String(m['自宅都道府県'] || '').trim();
        city       = String(m['自宅市区町村'] || '').trim();
        line1      = String(m['自宅住所']     || '').trim();
        line2      = String(m['自宅住所2']    || '').trim();
      } else {
        postCode   = String(m['勤務先郵便番号'] || '').trim();
        prefecture = String(m['勤務先都道府県'] || '').trim();
        city       = String(m['勤務先市区町村'] || '').trim();
        line1      = String(m['勤務先住所']     || '').trim();
        line2      = String(m['勤務先住所2']    || '').trim();
      }
    }

    // 住所不備チェック（郵便番号・市区町村・番地のいずれかが空）
    var invalidItems = [];
    if (!postCode) invalidItems.push('郵便番号');
    if (!city)     invalidItems.push('市区町村');
    if (!line1)    invalidItems.push('番地');

    if (invalidItems.length > 0) {
      var mtypeLabel = mtype === 'BUSINESS' ? '事業所会員'
                     : mtype === 'INDIVIDUAL' ? '個人会員' : '賛助会員';
      rowsInvalid.push([displayName, mtypeLabel, invalidItems.join('、')]);
      return;
    }

    // 都道府県: 大阪府は省略、他府県のみ表示
    var prefDisplay = (prefecture && prefecture !== '大阪府') ? prefecture : '';
    var address1    = prefDisplay + city + line1;
    var officeName  = String(m['勤務先名'] || '').trim();

    // 事業所会員: 名前は事業所代表名（姓名）、勤務先名列は不要（事業所ごとの宛先）
    if (mtype === 'BUSINESS') {
      rowsBiz.push([displayName, postCode, address1, line2]);
    } else if (mtype === 'INDIVIDUAL') {
      rowsInd.push([displayName, postCode, address1, line2, officeName]);
    } else if (mtype === 'SUPPORT') {
      rowsSup.push([displayName, postCode, address1, line2, officeName]);
    }
  });

  // 一時スプレッドシート作成
  var dateStr   = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
  var filterLbl = filterType === 'KOHOUSHI' ? '広報誌発送' : 'お知らせ発送';
  var tempSs    = SpreadsheetApp.create('宛名リスト_' + filterLbl + '_' + dateStr);
  var tempSsId  = tempSs.getId();

  try {
    var sheet1 = tempSs.getActiveSheet();
    sheet1.setName('事業所会員');
    _fillMailingSheet_(sheet1, HEADERS_BIZ, rowsBiz);

    var sheet2 = tempSs.insertSheet('個人会員');
    _fillMailingSheet_(sheet2, HEADERS_IND_SUP, rowsInd);

    var sheet3 = tempSs.insertSheet('賛助会員');
    _fillMailingSheet_(sheet3, HEADERS_IND_SUP, rowsSup);

    var sheet4 = tempSs.insertSheet('住所不備');
    _fillMailingSheet_(sheet4, HEADERS_INVALID, rowsInvalid);

    // GAS の setValues() 書き込みバッファを強制フラッシュ。
    // flush() なしでは UrlFetchApp の HTTP エクスポートが古いサーバー状態を返す場合がある。
    // 特に行数が少ないシート（住所不備など）はバッファが自動フラッシュされず取りこぼされる。
    SpreadsheetApp.flush();

    // xlsx エクスポート（UrlFetchApp + Bearer token — drive OAuth スコープ使用）
    var exportUrl = 'https://docs.google.com/spreadsheets/d/' + tempSsId +
                    '/export?format=xlsx&id=' + tempSsId;
    var response  = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('Excel エクスポート失敗: HTTP ' + response.getResponseCode());
    }

    var base64   = Utilities.base64Encode(response.getBlob().getBytes());
    var today    = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    var filename = '宛名リスト_' + filterLbl + '_' + today + '.xlsx';

    return {
      base64:   base64,
      filename: filename,
      counts: {
        business:  rowsBiz.length,
        individual: rowsInd.length,
        support:   rowsSup.length,
        invalid:   rowsInvalid.length,
      },
    };
  } finally {
    // 一時ファイルを必ず削除
    try { DriveApp.getFileById(tempSsId).setTrashed(true); } catch (e) {}
  }
}

/**
 * 宛名リスト シート書き込みヘルパー
 * ヘッダー行を太字で書き込み、データ行を追加し、列幅を自動調整する。
 */
function _fillMailingSheet_(sheet, headers, rows) {
  var hRange = sheet.getRange(1, 1, 1, headers.length);
  hRange.setValues([headers]);
  hRange.setFontWeight('bold');
  hRange.setBackground('#E8EAED');
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.autoResizeColumns(1, headers.length);
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
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var from = validateRequestedFromAddress_(String(payload.from || '').trim(), ownerEmail);

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

      sendEmailWithValidatedFrom_(rec.email, personalSubject, personalBody, {
        from: from,
        replyTo: from,
        name: '枚方市介護支援専門員連絡協議会',
        attachments: allAttachments,
      });
      sentCount += 1;
    } catch (e) {
      errors.push({ recipientKey: rec.recipientKey, displayName: rec.displayName, error: e.message });
    }
  }

  // ── T_メール送信ログ記録（append-only、個人情報なし） ────────────
  // v259: getLogSs_() 経由でログSSに書き込む。バグ修正: 以前は引数ミスで書き込まれていなかった
  var logId = Utilities.getUuid();
  var now   = new Date().toISOString();
  try {
    appendRowsByHeaders_(getLogSs_(), 'T_メール送信ログ', [{
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

  // v259: getLogSs_() 経由でログSSから読み込む
  var logSheet = getLogSs_().getSheetByName('T_メール送信ログ');
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

// ============================================================
// v196 Phase 3: PDF名簿出力
// ============================================================

/**
 * PDF名簿出力用: 対象会員一覧を取得する。
 * 年会費ステータスは T_会員(BUSINESS) ベースで判定。
 *
 * payload:
 *   memberTypes?    – ['INDIVIDUAL','BUSINESS','SUPPORT'] デフォルト全種別
 *   memberStatus?   – 'ACTIVE' | 'INCLUDING_SCHEDULED' | 'ALL'  デフォルト 'ACTIVE'
 *   annualFeeStatus? – 'ALL' | 'PAID' | 'UNPAID'              デフォルト 'ALL'
 *   year?           – 対象年度（省略時は当年度）
 */
function getMembersForRoster_(payload) {
  var p = payload || {};
  var memberTypes    = p.memberTypes    || ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'];
  var memberStatus   = String(p.memberStatus   || 'ACTIVE');
  var annualFeeStatus = String(p.annualFeeStatus || 'ALL');

  // 当年度算出（日本会計年度: 4月始まり）
  var now = new Date();
  var currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  var year = Number(p.year || 0);
  if (!year || !isFinite(year)) year = currentFY;

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet  = ss.getSheetByName('T_事業所職員');
  var feeSheet    = ss.getSheetByName('T_年会費納入履歴');

  var members  = getSheetData_(memberSheet);
  var staffRows = staffSheet  ? getSheetData_(staffSheet)  : [];
  var feeRows   = feeSheet    ? getSheetData_(feeSheet)    : [];

  // 年会費マップ: 会員ID → 状態コード（対象年度のみ）
  var feeMap = {};
  feeRows.forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (Number(r['対象年度'] || 0) !== year) return;
    var mid = String(r['会員ID'] || '');
    if (mid) feeMap[mid] = String(r['会費納入状態コード'] || 'UNPAID');
  });

  // 在籍職員数マップ: 会員ID → 在籍数
  var staffCountMap = {};
  staffRows.forEach(function(s) {
    if (toBoolean_(s['削除フラグ'])) return;
    if (String(s['職員状態コード'] || '') !== 'ENROLLED') return;
    var mid = String(s['会員ID'] || '');
    staffCountMap[mid] = (staffCountMap[mid] || 0) + 1;
  });

  var results = [];

  members.forEach(function(m) {
    if (toBoolean_(m['削除フラグ'])) return;
    var mtype = String(m['会員種別コード'] || '');
    if (memberTypes.indexOf(mtype) < 0) return;

    var status = String(m['会員状態コード'] || '');
    if (memberStatus === 'ACTIVE' && status !== 'ACTIVE') return;
    if (memberStatus === 'INCLUDING_SCHEDULED' &&
        status !== 'ACTIVE' && status !== 'WITHDRAWAL_SCHEDULED') return;
    // 'ALL' → フィルタなし

    var memberId  = String(m['会員ID'] || '');
    var feeStatus = feeMap[memberId] || 'NONE'; // NONE = 当年度の記録なし

    if (annualFeeStatus === 'PAID'   && feeStatus !== 'PAID') return;
    // UNPAID: UNPAID と NONE（記録なし = 未納扱い）を含む
    if (annualFeeStatus === 'UNPAID' && feeStatus === 'PAID') return;

    var lastName  = String(m['姓'] || '').trim();
    var firstName = String(m['名'] || '').trim();
    var displayName = (lastName + ' ' + firstName).trim() ||
                      String(m['代表メールアドレス'] || memberId);
    var kana = (String(m['セイ'] || '') + ' ' + String(m['メイ'] || '')).trim();

    results.push({
      memberId:          memberId,
      memberType:        mtype,
      displayName:       displayName,
      kana:              kana,
      officeName:        String(m['勤務先名'] || '').trim(),
      memberStatus:      status,
      joinedDate:        String(m['入会日'] || ''),
      annualFeeStatus:   feeStatus,
      annualFeeYear:     year,
      enrolledStaffCount: mtype === 'BUSINESS' ? (staffCountMap[memberId] || 0) : undefined,
    });
  });

  return results;
}

/**
 * PDF名簿出力 v205: 1000件対応アーキテクチャ
 *
 * フロントエンドが CHUNK_SIZE=250 件ずつ分割し、順次 processRosterChunk_ を呼ぶ。
 * 各チャンク内で PARALLEL_BATCH=15 本の temp SS + UrlFetchApp.fetchAll() で並列 PDF 取得。
 * 失敗分は最大 MAX_RETRY=2 回リトライ。全成功のみ部分 ZIP を Drive 一時フォルダへ保存。
 * 全チャンク完了後に finalizeRosterExport_ で部分 ZIP を統合して最終 ZIP を生成。
 * all-or-nothing: いずれかのチャンクで失敗が残った場合は ZIP を出力しない。
 *
 * GAS 6分制限 vs 件数試算:
 *   250件/チャンク、PARALLEL_BATCH=15 → ceil(250/15)=17バッチ x ~10s ≈ 3分 (余裕あり)
 *   1000件 = 4チャンク x ~3分 ≈ 計12分（GASは1回あたり6分以内に収まる）
 *   finalizeRosterExport_ (unzip+rezip) ≈ 30秒
 *
 * 注意: 会員データなし（memberMap に存在しない ID）は恒久失敗として扱いリトライしない。
 */

/**
 * v205: PDF 出力ジョブ初期化。Drive に一時フォルダを作成して folderId を返す。
 */
function initRosterExport_(payload) {
  var folder = DriveApp.createFolder(
    '_ROSTER_JOB_' + Utilities.getUuid().substring(0, 12)
  );
  return { folderId: folder.getId() };
}

/**
 * v205: チャンク単位の PDF 生成（all-or-nothing + リトライ）。
 *
 * - 内部で最大 MAX_RETRY 回リトライ（transient HTTP エラー対策）。
 * - 全成功: chunk_{chunkIndex}.zip を folderId フォルダに保存 → { ok: true, count }
 * - 失敗残存: { ok: false, errors[] } (ZIP 保存なし。フロント側が cleanupRosterExport_ を呼ぶ)
 *
 * payload: { folderId, chunkIndex, memberIds[], year }
 */
function processRosterChunk_(payload) {
  var p          = payload || {};
  var folderId   = String(p.folderId   || '');
  var chunkIndex = Number(p.chunkIndex || 0);
  var memberIds  = p.memberIds         || [];
  var year       = Number(p.year       || 0);
  var MAX_RETRY  = 2;
  var PARALLEL_BATCH = 15;

  if (!folderId)         throw new Error('folderId が指定されていません。');
  if (!memberIds.length) return { ok: true, count: 0 };

  var now = new Date();
  var currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  if (!year || !isFinite(year)) year = currentFY;

  var dbSs = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var templateId = String(getSystemSettingValue_(dbSs, 'ROSTER_TEMPLATE_SS_ID') || '').trim();
  if (!templateId) {
    throw new Error('名簿テンプレートSSが未設定です。システム設定 > ROSTER_TEMPLATE_SS_ID を登録してください。');
  }
  var templateFile;
  try { templateFile = DriveApp.getFileById(templateId); }
  catch (e) { throw new Error('テンプレートSSの取得に失敗しました: ' + e.message); }

  var memberSheet = dbSs.getSheetByName('T_会員');
  var staffSheet  = dbSs.getSheetByName('T_事業所職員');
  var feeSheet    = dbSs.getSheetByName('T_年会費納入履歴');

  var memberMap = {};
  getSheetData_(memberSheet).forEach(function(m) {
    memberMap[String(m['会員ID'] || '')] = m;
  });
  var staffByMember = {};
  (staffSheet ? getSheetData_(staffSheet) : []).forEach(function(s) {
    if (toBoolean_(s['削除フラグ'])) return;
    var mid = String(s['会員ID'] || '');
    if (!staffByMember[mid]) staffByMember[mid] = [];
    staffByMember[mid].push(s);
  });
  var feeMap = {};
  (feeSheet ? getSheetData_(feeSheet) : []).forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (Number(r['対象年度'] || 0) !== year) return;
    var mid = String(r['会員ID'] || '');
    if (mid) feeMap[mid] = String(r['会費納入状態コード'] || 'UNPAID');
  });

  var remainingIds = memberIds.slice();
  var allBlobs     = [];
  var finalErrors  = [];

  for (var attempt = 0; attempt <= MAX_RETRY; attempt++) {
    if (remainingIds.length === 0) break;
    if (attempt > 0) Utilities.sleep(2000);
    var result = generatePdfsForIds_(
      remainingIds, templateFile, memberMap, staffByMember, feeMap, year, PARALLEL_BATCH
    );
    allBlobs     = allBlobs.concat(result.blobs);
    remainingIds = result.failedIds;
    finalErrors  = result.errors;
  }

  if (remainingIds.length > 0) {
    return { ok: false, errors: finalErrors };
  }

  var zipBlob = Utilities.zip(allBlobs, 'chunk_' + chunkIndex + '.zip');
  DriveApp.getFolderById(folderId).createFile(zipBlob);
  return { ok: true, count: allBlobs.length };
}

/**
 * v205: 全チャンクの部分 ZIP を統合して最終 ZIP を生成。
 * payload: { folderId, year }
 */
function finalizeRosterExport_(payload) {
  var p        = payload || {};
  var folderId = String(p.folderId || '');
  var year     = Number(p.year    || 0);

  if (!folderId) throw new Error('folderId が指定されていません。');

  var folder = DriveApp.getFolderById(folderId);
  var files  = folder.getFiles();

  var allBlobs = [];
  while (files.hasNext()) {
    var file = files.next();
    try {
      var unzipped = Utilities.unzip(file.getBlob());
      unzipped.forEach(function(b) { allBlobs.push(b); });
    } catch (e) {
      Logger.log('finalizeRosterExport_: unzip 失敗: ' + file.getName() + ': ' + e.message);
    }
  }

  if (allBlobs.length === 0) {
    throw new Error('統合する PDF がありません。チャンク処理が完了していない可能性があります。');
  }

  var now = new Date();
  var currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  if (!year || !isFinite(year)) year = currentFY;

  var zipName = '名簿_' + year + '年度_' + allBlobs.length + '件.zip';
  var zipBlob = Utilities.zip(allBlobs, zipName);
  var zipFile = DriveApp.createFile(zipBlob);
  var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + zipFile.getId();

  try { folder.setTrashed(true); } catch (ce) {
    Logger.log('finalizeRosterExport_: temp folder 削除失敗: ' + ce.message);
  }

  return {
    downloadUrl: downloadUrl,
    fileId:      zipFile.getId(),
    zipName:     zipName,
    count:       allBlobs.length,
  };
}

/**
 * v205: エラー・中断時の一時フォルダクリーンアップ。
 * payload: { folderId }
 */
function cleanupRosterExport_(payload) {
  var folderId = String((payload || {}).folderId || '');
  if (!folderId) return { ok: true };
  try { DriveApp.getFolderById(folderId).setTrashed(true); }
  catch (e) { Logger.log('cleanupRosterExport_: ' + e.message); }
  return { ok: true };
}

/**
 * v205: PDF 生成コアヘルパー（processRosterChunk_ から呼ばれる）。
 * memberIds を会員種別でソートし、parallelBatch 本の temp SS + UrlFetchApp.fetchAll() で並列 PDF 取得。
 * returns { blobs: Blob[], failedIds: string[], errors: string[] }
 *
 * failedIds: HTTP エラー会員 ID のみ（リトライ対象）。
 *            会員データなしは errors のみ（リトライ不要なので failedIds に入れない）。
 */
function generatePdfsForIds_(memberIds, templateFile, memberMap, staffByMember, feeMap, year, parallelBatch) {
  var MEMBER_HEADERS = [
    '会員番号', '会員種別', '姓', '名', 'フリガナ姓', 'フリガナ名',
    '勤務先名', '事業所番号', '勤務先郵便番号', '勤務先都道府県', '勤務先市区町村', '勤務先住所',
    '勤務先電話', '勤務先FAX', '自宅郵便番号', '自宅都道府県', '自宅市区町村', '自宅住所',
    'メールアドレス', '入会日', '年会費状態', '年会費年度', '介護支援専門員番号',
  ];
  var STAFF_HEADERS = [
    '職員番号', '職員権限', '姓', '名', 'フリガナ姓', 'フリガナ名',
    'メールアドレス', '入会日', '職員状態',
  ];
  var roleOrder = { REPRESENTATIVE: 0, ADMIN: 1, STAFF: 2 };

  var memberTypeOf = {};
  memberIds.forEach(function(id) {
    var m = memberMap[String(id)];
    memberTypeOf[String(id)] = m ? String(m['会員種別コード'] || '') : '';
  });
  var sortedIds = memberIds.slice().sort(function(a, b) {
    var ta = memberTypeOf[String(a)] || '';
    var tb = memberTypeOf[String(b)] || '';
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });

  var actualBatch  = Math.min(parallelBatch, sortedIds.length);
  var tempContexts = [];
  for (var ti = 0; ti < actualBatch; ti++) {
    try {
      var tmpFile = templateFile.makeCopy(
        '_ROSTER_TMP_' + Utilities.getUuid().substring(0, 8) + '_' + ti
      );
      var tmpSs = SpreadsheetApp.openById(tmpFile.getId());

      if (ti === 0) {
        var visibleSheets = tmpSs.getSheets().filter(function(s) {
          return !s.isSheetHidden() && !isTemplateInternalSheet_(s.getName());
        });
        if (visibleSheets.length === 0) {
          try { DriveApp.getFileById(tmpFile.getId()).setTrashed(true); } catch (ce) {}
          throw new Error(
            'テンプレートSSに表示用シートがありません。' +
            '「P_」または「B_」で始まるシートを1枚以上追加してください。'
          );
        }
      }

      var tmpDataSheet = ensureRosterTemplateDataSheet_(tmpSs);
      tmpDataSheet.hideSheet();
      tempContexts.push({
        ss:        tmpSs,
        dataSheet: tmpDataSheet,
        fileId:    tmpFile.getId(),
        lastType:  null,
      });
    } catch (e) {
      if (ti === 0) throw e;
      Logger.log('generatePdfsForIds_: temp SS ' + ti + ' 作成失敗: ' + e.message);
    }
  }

  if (tempContexts.length === 0) {
    throw new Error('テンプレートSSのコピーに失敗しました。Drive の容量・権限・ID を確認してください。');
  }
  actualBatch = tempContexts.length;

  var oauthToken = ScriptApp.getOAuthToken();
  var blobs     = [];
  var failedIds = [];
  var errors    = [];

  for (var batchStart = 0; batchStart < sortedIds.length; batchStart += actualBatch) {
    var batchIds  = sortedIds.slice(batchStart, batchStart + actualBatch);
    var requests  = [];
    var batchMeta = [];

    for (var j = 0; j < batchIds.length; j++) {
      var ctx      = tempContexts[j];
      var memberId = String(batchIds[j]);
      var member   = memberMap[memberId];

      if (!member) {
        errors.push(memberId + ': 会員データなし');
        continue;
      }

      var mtype = String(member['会員種別コード'] || '');
      var enrolledStaff = [];
      if (mtype === 'BUSINESS') {
        enrolledStaff = (staffByMember[memberId] || []).filter(function(s) {
          return String(s['職員状態コード'] || '') === 'ENROLLED';
        });
        enrolledStaff.sort(function(a, b) {
          return (roleOrder[a['職員権限コード']] || 9) - (roleOrder[b['職員権限コード']] || 9);
        });
      }

      var dataSheet = ctx.dataSheet;
      dataSheet.clearContents();
      dataSheet.getRange(1, 1, 1, MEMBER_HEADERS.length).setValues([MEMBER_HEADERS]);
      dataSheet.getRange(2, 1, 1, MEMBER_HEADERS.length).setValues([[
        memberId, mtype,
        String(member['姓'] || ''), String(member['名'] || ''),
        String(member['セイ'] || ''), String(member['メイ'] || ''),
        String(member['勤務先名'] || ''), String(member['事業所番号'] || ''),
        String(member['勤務先郵便番号'] || ''), String(member['勤務先都道府県'] || ''),
        String(member['勤務先市区町村'] || ''), String(member['勤務先住所'] || ''),
        String(member['勤務先電話番号'] || ''), String(member['勤務先FAX番号'] || ''),
        String(member['自宅郵便番号'] || ''), String(member['自宅都道府県'] || ''),
        String(member['自宅市区町村'] || ''), String(member['自宅住所'] || ''),
        String(member['代表メールアドレス'] || ''), String(member['入会日'] || ''),
        feeMap[memberId] || 'NONE', year,
        String(member['介護支援専門員番号'] || ''),
      ]]);
      if (enrolledStaff.length > 0) {
        dataSheet.getRange(4, 1, 1, STAFF_HEADERS.length).setValues([STAFF_HEADERS]);
        dataSheet.getRange(5, 1, enrolledStaff.length, STAFF_HEADERS.length)
          .setValues(enrolledStaff.map(function(s) {
            return [
              String(s['職員ID'] || ''), String(s['職員権限コード'] || ''),
              String(s['姓'] || ''), String(s['名'] || ''),
              String(s['セイ'] || ''), String(s['メイ'] || ''),
              String(s['メールアドレス'] || ''), String(s['入会日'] || ''),
              String(s['職員状態コード'] || ''),
            ];
          }));
      }

      if (ctx.lastType !== mtype) {
        selectRosterDisplaySheetsV2_(ctx.ss, mtype);
        ctx.lastType = mtype;
      }

      requests.push({
        url: 'https://docs.google.com/spreadsheets/d/' + ctx.fileId +
          '/export?format=pdf&size=a4&portrait=true&fitw=true' +
          '&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false',
        headers: { Authorization: 'Bearer ' + oauthToken },
        muteHttpExceptions: true,
      });
      batchMeta.push({ memberId: memberId, member: member, ctxIndex: j });
    }

    if (requests.length === 0) continue;

    SpreadsheetApp.flush();

    for (var k = 0; k < batchMeta.length; k++) {
      var ctx = tempContexts[batchMeta[k].ctxIndex];
      var dispSheets = ctx.ss.getSheets().filter(function(s) { return !s.isSheetHidden(); });
      if (dispSheets.length > 0 && dispSheets[0].getLastRow() > 0 && dispSheets[0].getLastColumn() > 0) {
        dispSheets[0].getRange(1, 1).getValue();
      }
    }

    var responses = UrlFetchApp.fetchAll(requests);

    for (var k = 0; k < responses.length; k++) {
      var meta     = batchMeta[k];
      var response = responses[k];
      if (response.getResponseCode() === 200) {
        var lastName   = String(meta.member['姓'] || '').trim();
        var firstName  = String(meta.member['名'] || '').trim();
        var officeName = String(meta.member['勤務先名'] || '').trim().substring(0, 20);
        var pdfName    = meta.memberId + '_' + (lastName + firstName || officeName || '名前なし') + '.pdf';
        blobs.push(response.getBlob().setName(pdfName));
      } else {
        failedIds.push(meta.memberId);
        errors.push(
          String(meta.member['姓'] || '') + String(meta.member['名'] || '') +
          '（' + meta.memberId + '）: HTTP ' + response.getResponseCode()
        );
      }
    }
  }

  tempContexts.forEach(function(ctx) {
    try { DriveApp.getFileById(ctx.fileId).setTrashed(true); } catch (ce) {
      Logger.log('generatePdfsForIds_: cleanup 失敗: ' + ce.message);
    }
  });

  return { blobs: blobs, failedIds: failedIds, errors: errors };
}




function isTemplateInternalSheet_(sheetName) {
  return String(sheetName || '').indexOf('_') === 0;
}

function getTemplateSheetMetadataMap_(sheet) {
  var map = {};
  var metadata = sheet.getDeveloperMetadata ? sheet.getDeveloperMetadata() : [];
  metadata.forEach(function(item) {
    map[item.getKey()] = item.getValue();
  });
  return map;
}

function getRosterTemplateDataSheet_(ss) {
  return ss.getSheetByName('_DATA_ROSTER') || ss.getSheetByName('_DATA');
}

function ensureRosterTemplateDataSheet_(ss) {
  var sheet = getRosterTemplateDataSheet_(ss);
  if (sheet) return sheet;
  return ss.insertSheet('_DATA_ROSTER');
}

function applyRosterSheetVisibility_(ss, targetSheets) {
  var allowed = {};
  targetSheets.forEach(function(sheet) {
    allowed[sheet.getName()] = true;
    if (sheet.isSheetHidden()) sheet.showSheet();
  });

  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    if (isTemplateInternalSheet_(name)) {
      if (!sheet.isSheetHidden()) sheet.hideSheet();
      return;
    }
    if (!allowed[name] && !sheet.isSheetHidden()) {
      sheet.hideSheet();
    }
  });

  return targetSheets;
}


/**
 * 名簿テンプレートのサンプルスプレッドシートを作成する。
 * - 実運用に流用できるよう、_DATA のサンプルデータと表示シートの参照数式をあらかじめ設定する。
 * - 作成後に返す spreadsheetId を T_システム設定.ROSTER_TEMPLATE_SS_ID に登録すれば、
 *   そのまま名簿出力テンプレートとして利用できる。
 */









// 2026-04-11: metadata 優先・prefix 後方互換のテンプレート解決と、
// 名簿/催促状同居テンプレート例を後方互換を壊さず上書き定義する。









function selectRosterDisplaySheetsV2_(ss, memberType) {
  var target = String(memberType || '') === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL_SUPPORT';
  var metadataSheets = ss.getSheets()
    .map(function(sheet) {
      var meta = getTemplateSheetMetadataMap_(sheet);
      return { sheet: sheet, meta: meta };
    })
    .filter(function(item) {
      return item.meta.HKC_TEMPLATE_FAMILY === 'ROSTER' &&
        item.meta.HKC_TEMPLATE_TARGET === target;
    })
    .sort(function(a, b) {
      return Number(a.meta.HKC_TEMPLATE_ORDER || 0) - Number(b.meta.HKC_TEMPLATE_ORDER || 0);
    })
    .map(function(item) { return item.sheet; });

  if (metadataSheets.length) {
    return applyRosterSheetVisibility_(ss, metadataSheets);
  }

  var prefix = String(memberType || '') === 'BUSINESS' ? 'B_' : 'P_';
  var prefixSheets = ss.getSheets().filter(function(sheet) {
    return sheet.getName().indexOf(prefix) === 0;
  });
  if (!prefixSheets.length) {
    throw new Error('名簿テンプレートの対象シートが見つかりません。memberType=' + memberType);
  }
  return applyRosterSheetVisibility_(ss, prefixSheets);
}

function addDeleteLogSheet() {
  var ss = getOrCreateDatabase_();
  var sheetName = 'T_削除ログ';
  if (!ss.getSheetByName(sheetName)) {
    var sheet = ss.insertSheet(sheetName);
    var cols = テーブル定義[sheetName];
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    sheet.setFrozenRows(1);
  }
  return { status: 'ok', sheet: sheetName };
}

function getDeleteMemberDisplayName_(memberRow) {
  var memberType = String(memberRow['会員種別コード'] || '');
  var fullName = joinHumanNameParts_(memberRow['姓'], memberRow['名']).trim();
  var officeName = String(memberRow['勤務先名'] || '').trim();
  if (memberType === 'BUSINESS') return officeName || fullName || '（事業所名なし）';
  return fullName || officeName || '（名前なし）';
}

function getDeleteStaffDisplayName_(staffRow, memberRow) {
  var officeName = memberRow ? getDeleteMemberDisplayName_(memberRow) : '（事業所不明）';
  var fullName = joinHumanNameParts_(staffRow['姓'], staffRow['名']).trim();
  return officeName + ' / ' + (fullName || '（職員名なし）');
}

function parseDeleteTargetKey_(rawValue) {
  var raw = String(rawValue || '').trim();
  if (!raw) return null;
  var matched = raw.match(/^(member|staff):(.+)$/);
  if (!matched) return null;
  return {
    targetKey: matched[1] + ':' + matched[2],
    targetKind: matched[1] === 'staff' ? 'STAFF' : 'MEMBER',
    id: matched[2],
  };
}

function normalizeDeleteTargetKeys_(payload) {
  var rawKeys = Array.isArray(payload && payload.targetKeys)
    ? payload.targetKeys
    : Array.isArray(payload && payload.memberIds)
      ? payload.memberIds.map(function(memberId) { return 'member:' + String(memberId || '').trim(); })
      : [];
  var seen = {};
  var keys = [];
  for (var i = 0; i < rawKeys.length; i++) {
    var parsed = parseDeleteTargetKey_(rawKeys[i]);
    if (!parsed || seen[parsed.targetKey]) continue;
    seen[parsed.targetKey] = true;
    keys.push(parsed.targetKey);
  }
  if (keys.length === 0) throw new Error('targetKeys が空です。');
  if (keys.length > 10) throw new Error('一度に処理できるのは最大10件です。');
  return keys;
}

function buildDeleteCatalog_(ss) {
  var members = getRowsAsObjects_(ss, 'T_会員');
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員');
  var auths = getRowsAsObjects_(ss, 'T_認証アカウント');
  var memberById = {};
  var staffById = {};
  var staffsByMemberId = {};
  var memberLoginIdById = {};
  var staffLoginIdById = {};

  for (var i = 0; i < members.length; i++) {
    memberById[String(members[i]['会員ID'] || '')] = members[i];
  }
  for (var j = 0; j < staffs.length; j++) {
    var staffId = String(staffs[j]['職員ID'] || '');
    var memberId = String(staffs[j]['会員ID'] || '');
    staffById[staffId] = staffs[j];
    if (!staffsByMemberId[memberId]) staffsByMemberId[memberId] = [];
    staffsByMemberId[memberId].push(staffs[j]);
  }
  for (var k = 0; k < auths.length; k++) {
    var auth = auths[k];
    var authMemberId = String(auth['会員ID'] || '');
    var authStaffId = String(auth['職員ID'] || '');
    var loginId = String(auth['ログインID'] || '');
    if (authStaffId && !staffLoginIdById[authStaffId]) staffLoginIdById[authStaffId] = loginId;
    if (authMemberId && !memberLoginIdById[authMemberId] && !authStaffId) memberLoginIdById[authMemberId] = loginId;
  }

  return {
    members: members,
    staffs: staffs,
    auths: auths,
    memberById: memberById,
    staffById: staffById,
    staffsByMemberId: staffsByMemberId,
    memberLoginIdById: memberLoginIdById,
    staffLoginIdById: staffLoginIdById,
  };
}

function shouldArchiveMemberRow_(row) {
  return String(row['会員状態コード'] || 'ACTIVE') !== 'WITHDRAWN' || !toBoolean_(row['削除フラグ']);
}

function shouldArchiveStaffRow_(row) {
  return String(row['職員状態コード'] || 'ENROLLED') !== 'LEFT' || !toBoolean_(row['削除フラグ']);
}

function shouldArchiveAuthRow_(row) {
  return toBoolean_(row['アカウント有効フラグ']) || !toBoolean_(row['削除フラグ']);
}

function shouldArchiveWhitelistRow_(row) {
  return toBoolean_(row['有効フラグ']) || !toBoolean_(row['削除フラグ']);
}

function buildLogicalDeletePlan_(ss, targetKeys) {
  var catalog = buildDeleteCatalog_(ss);
  var parsedTargets = [];
  var memberIdSet = {};
  var staffIdSet = {};
  var seenTargetKey = {};

  for (var i = 0; i < targetKeys.length; i++) {
    var parsed = parseDeleteTargetKey_(targetKeys[i]);
    if (!parsed || seenTargetKey[parsed.targetKey]) continue;
    seenTargetKey[parsed.targetKey] = true;

    if (parsed.targetKind === 'MEMBER') {
      var memberRow = catalog.memberById[parsed.id];
      if (!memberRow) throw new Error('対象会員が見つかりません: ' + parsed.id);
      memberIdSet[parsed.id] = true;
      parsedTargets.push({
        targetKey: parsed.targetKey,
        targetKind: 'MEMBER',
        memberId: parsed.id,
        displayName: getDeleteMemberDisplayName_(memberRow),
        memberType: String(memberRow['会員種別コード'] || ''),
        memberStatus: String(memberRow['会員状態コード'] || ''),
        loginId: catalog.memberLoginIdById[parsed.id] || '',
        isDeleted: toBoolean_(memberRow['削除フラグ']),
      });
    } else {
      var staffRow = catalog.staffById[parsed.id];
      if (!staffRow) throw new Error('対象職員が見つかりません: ' + parsed.id);
      if (String(staffRow['職員権限コード'] || '') === 'REPRESENTATIVE') {
        throw new Error('代表者職員は単体では論理削除できません。先に事業所会員全体を対象にしてください。');
      }
      var parentMemberId = String(staffRow['会員ID'] || '');
      var parentMemberRow = catalog.memberById[parentMemberId] || null;
      staffIdSet[parsed.id] = true;
      parsedTargets.push({
        targetKey: parsed.targetKey,
        targetKind: 'STAFF',
        memberId: parentMemberId,
        staffId: parsed.id,
        displayName: getDeleteStaffDisplayName_(staffRow, parentMemberRow),
        memberType: parentMemberRow ? String(parentMemberRow['会員種別コード'] || 'BUSINESS') : 'BUSINESS',
        memberStatus: parentMemberRow ? String(parentMemberRow['会員状態コード'] || '') : '',
        staffRole: String(staffRow['職員権限コード'] || ''),
        staffStatus: String(staffRow['職員状態コード'] || ''),
        loginId: catalog.staffLoginIdById[parsed.id] || '',
        isDeleted: toBoolean_(staffRow['削除フラグ']),
      });
    }
  }

  var memberIds = Object.keys(memberIdSet);
  for (var j = 0; j < memberIds.length; j++) {
    var memberId = memberIds[j];
    var memberRowForChildren = catalog.memberById[memberId];
    if (memberRowForChildren && String(memberRowForChildren['会員種別コード'] || '') === 'BUSINESS') {
      var childStaffRows = catalog.staffsByMemberId[memberId] || [];
      for (var c = 0; c < childStaffRows.length; c++) {
        var childStaffId = String(childStaffRows[c]['職員ID'] || '');
        if (childStaffId) staffIdSet[childStaffId] = true;
      }
    }
  }

  var staffIds = Object.keys(staffIdSet);
  var affectedAuthIdSet = {};
  var counts = {
    'T_会員': 0,
    'T_事業所職員': 0,
    'T_認証アカウント': 0,
    'T_管理者Googleホワイトリスト': 0,
  };
  var retainedCounts = {
    'T_ログイン履歴': 0,
    'T_年会費納入履歴': 0,
    'T_年会費更新履歴': 0,
    'T_研修申込': 0,
  };

  for (var m = 0; m < memberIds.length; m++) {
    var memberRowForCount = catalog.memberById[memberIds[m]];
    if (memberRowForCount && shouldArchiveMemberRow_(memberRowForCount)) counts['T_会員']++;
  }
  for (var s = 0; s < staffIds.length; s++) {
    var staffRowForCount = catalog.staffById[staffIds[s]];
    if (staffRowForCount && shouldArchiveStaffRow_(staffRowForCount)) counts['T_事業所職員']++;
  }

  var whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト');
  for (var w = 0; w < whitelistRows.length; w++) {
    var whitelistMemberId = String(whitelistRows[w]['紐付け会員ID'] || '');
    if (memberIdSet[whitelistMemberId] && shouldArchiveWhitelistRow_(whitelistRows[w])) {
      counts['T_管理者Googleホワイトリスト']++;
    }
  }

  for (var a = 0; a < catalog.auths.length; a++) {
    var authRow = catalog.auths[a];
    var authMemberId = String(authRow['会員ID'] || '');
    var authStaffId = String(authRow['職員ID'] || '');
    var authId = String(authRow['認証ID'] || '');
    if (memberIdSet[authMemberId] || (authStaffId && staffIdSet[authStaffId])) {
      if (authId) affectedAuthIdSet[authId] = true;
      if (shouldArchiveAuthRow_(authRow)) counts['T_認証アカウント']++;
    }
  }

  var loginRows = getRowsAsObjects_(getLogSs_(), 'T_ログイン履歴'); // v259: ログSS
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴');
  var feeUpdateRows = getRowsAsObjects_(ss, 'T_年会費更新履歴');
  var trainingRows = getRowsAsObjects_(ss, 'T_研修申込');
  var affectedAuthIds = Object.keys(affectedAuthIdSet);

  retainedCounts['T_ログイン履歴'] = loginRows.filter(function(row) {
    return affectedAuthIds.indexOf(String(row['認証ID'] || '')) !== -1;
  }).length;
  retainedCounts['T_年会費納入履歴'] = feeRows.filter(function(row) {
    return memberIdSet[String(row['会員ID'] || '')];
  }).length;
  retainedCounts['T_年会費更新履歴'] = feeUpdateRows.filter(function(row) {
    return memberIdSet[String(row['会員ID'] || '')];
  }).length;
  retainedCounts['T_研修申込'] = trainingRows.filter(function(row) {
    return memberIdSet[String(row['会員ID'] || '')] ||
      memberIdSet[String(row['申込者ID'] || '')] ||
      staffIdSet[String(row['職員ID'] || '')];
  }).length;

  var totalUpdatedRows = 0;
  Object.keys(counts).forEach(function(tableName) {
    totalUpdatedRows += counts[tableName] || 0;
  });
  var totalRows = totalUpdatedRows;
  Object.keys(retainedCounts).forEach(function(tableName) {
    totalRows += retainedCounts[tableName] || 0;
  });

  return {
    targetKeys: targetKeys,
    targets: parsedTargets,
    memberIds: memberIds,
    staffIds: staffIds,
    authIds: affectedAuthIds,
    counts: counts,
    retainedCounts: retainedCounts,
    totalUpdatedRows: totalUpdatedRows,
    totalRows: totalRows,
  };
}

function archiveMembersByIds_(ss, memberIds, today, nowIso) {
  if (!memberIds || memberIds.length === 0) return 0;
  var memberIdSet = {};
  for (var i = 0; i < memberIds.length; i++) memberIdSet[String(memberIds[i])] = true;
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var h = 0; h < headers.length; h++) cols[headers[h]] = h;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var changed = 0;
  for (var r = 0; r < data.length; r++) {
    var memberId = String(data[r][cols['会員ID']] || '');
    if (!memberIdSet[memberId]) continue;
    var nextChanged = false;
    if (String(data[r][cols['会員状態コード']] || 'ACTIVE') !== 'WITHDRAWN') {
      data[r][cols['会員状態コード']] = 'WITHDRAWN';
      nextChanged = true;
    }
    if (!normalizeDateInput_(data[r][cols['退会日']])) {
      data[r][cols['退会日']] = today;
      nextChanged = true;
    }
    if (!toBoolean_(data[r][cols['削除フラグ']])) {
      data[r][cols['削除フラグ']] = true;
      nextChanged = true;
    }
    if (cols['更新日時'] != null) data[r][cols['更新日時']] = nowIso;
    if (nextChanged) changed++;
  }
  if (changed > 0) sheet.getRange(2, 1, data.length, sheet.getLastColumn()).setValues(data);
  return changed;
}

function archiveStaffsByIds_(ss, staffIds, today, nowIso) {
  if (!staffIds || staffIds.length === 0) return 0;
  var staffIdSet = {};
  for (var i = 0; i < staffIds.length; i++) staffIdSet[String(staffIds[i])] = true;
  var sheet = ss.getSheetByName('T_事業所職員');
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var h = 0; h < headers.length; h++) cols[headers[h]] = h;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var changed = 0;
  for (var r = 0; r < data.length; r++) {
    var staffId = String(data[r][cols['職員ID']] || '');
    if (!staffIdSet[staffId]) continue;
    var nextChanged = false;
    if (String(data[r][cols['職員状態コード']] || 'ENROLLED') !== 'LEFT') {
      data[r][cols['職員状態コード']] = 'LEFT';
      nextChanged = true;
    }
    if (!normalizeDateInput_(data[r][cols['退会日']])) {
      data[r][cols['退会日']] = today;
      nextChanged = true;
    }
    if (!toBoolean_(data[r][cols['削除フラグ']])) {
      data[r][cols['削除フラグ']] = true;
      nextChanged = true;
    }
    if (cols['更新日時'] != null) data[r][cols['更新日時']] = nowIso;
    if (nextChanged) changed++;
  }
  if (changed > 0) sheet.getRange(2, 1, data.length, sheet.getLastColumn()).setValues(data);
  return changed;
}

function archiveAuthAccountsForTargets_(ss, memberIds, staffIds, nowIso) {
  var memberIdSet = {};
  var staffIdSet = {};
  for (var i = 0; i < memberIds.length; i++) memberIdSet[String(memberIds[i])] = true;
  for (var j = 0; j < staffIds.length; j++) staffIdSet[String(staffIds[j])] = true;
  var sheet = ss.getSheetByName('T_認証アカウント');
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var h = 0; h < headers.length; h++) cols[headers[h]] = h;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var changed = 0;
  for (var r = 0; r < data.length; r++) {
    var memberId = String(data[r][cols['会員ID']] || '');
    var staffId = cols['職員ID'] != null ? String(data[r][cols['職員ID']] || '') : '';
    if (!memberIdSet[memberId] && !(staffId && staffIdSet[staffId])) continue;
    var nextChanged = false;
    if (cols['アカウント有効フラグ'] != null && toBoolean_(data[r][cols['アカウント有効フラグ']])) {
      data[r][cols['アカウント有効フラグ']] = false;
      nextChanged = true;
    }
    if (cols['削除フラグ'] != null && !toBoolean_(data[r][cols['削除フラグ']])) {
      data[r][cols['削除フラグ']] = true;
      nextChanged = true;
    }
    if (cols['更新日時'] != null) data[r][cols['更新日時']] = nowIso;
    if (nextChanged) changed++;
  }
  if (changed > 0) sheet.getRange(2, 1, data.length, sheet.getLastColumn()).setValues(data);
  return changed;
}

function archiveAdminWhitelistsByMemberIds_(ss, memberIds, nowIso) {
  if (!memberIds || memberIds.length === 0) return 0;
  var memberIdSet = {};
  for (var i = 0; i < memberIds.length; i++) memberIdSet[String(memberIds[i])] = true;
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var h = 0; h < headers.length; h++) cols[headers[h]] = h;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var changed = 0;
  for (var r = 0; r < data.length; r++) {
    var linkedMemberId = String(data[r][cols['紐付け会員ID']] || '');
    if (!memberIdSet[linkedMemberId]) continue;
    var nextChanged = false;
    if (cols['有効フラグ'] != null && toBoolean_(data[r][cols['有効フラグ']])) {
      data[r][cols['有効フラグ']] = false;
      nextChanged = true;
    }
    if (cols['削除フラグ'] != null && !toBoolean_(data[r][cols['削除フラグ']])) {
      data[r][cols['削除フラグ']] = true;
      nextChanged = true;
    }
    if (cols['更新日時'] != null) data[r][cols['更新日時']] = nowIso;
    if (nextChanged) changed++;
  }
  if (changed > 0) sheet.getRange(2, 1, data.length, sheet.getLastColumn()).setValues(data);
  return changed;
}

function searchMembersForDelete_(payload) {
  var query = String(payload.query || '').trim();
  if (!query) throw new Error('検索クエリが空です。');

  var ss = getOrCreateDatabase_();
  var catalog = buildDeleteCatalog_(ss);
  var lowerQuery = query.toLowerCase();
  var results = [];

  for (var i = 0; i < catalog.members.length; i++) {
    var member = catalog.members[i];
    var memberId = String(member['会員ID'] || '');
    if (!memberId) continue;
    var displayName = getDeleteMemberDisplayName_(member);
    var loginId = catalog.memberLoginIdById[memberId] || '';
    var memberSearchText = [
      memberId,
      displayName,
      loginId,
      String(member['事業所番号'] || ''),
      String(member['代表メールアドレス'] || ''),
    ].join(' ').toLowerCase();
    if (memberSearchText.indexOf(lowerQuery) === -1) continue;
    results.push({
      targetKey: 'member:' + memberId,
      targetKind: 'MEMBER',
      memberId: memberId,
      displayName: displayName,
      memberType: String(member['会員種別コード'] || ''),
      memberStatus: String(member['会員状態コード'] || ''),
      loginId: loginId,
      isDeleted: toBoolean_(member['削除フラグ']),
    });
    if (results.length >= 20) return results;
  }

  for (var j = 0; j < catalog.staffs.length; j++) {
    var staff = catalog.staffs[j];
    if (String(staff['職員権限コード'] || '') === 'REPRESENTATIVE') continue;
    var staffId = String(staff['職員ID'] || '');
    if (!staffId) continue;
    var parentMemberId = String(staff['会員ID'] || '');
    var parentMember = catalog.memberById[parentMemberId] || null;
    var staffDisplayName = getDeleteStaffDisplayName_(staff, parentMember);
    var staffLoginId = catalog.staffLoginIdById[staffId] || '';
    var staffSearchText = [
      staffId,
      parentMemberId,
      staffDisplayName,
      staffLoginId,
      String(staff['メールアドレス'] || ''),
      String(staff['介護支援専門員番号'] || ''),
    ].join(' ').toLowerCase();
    if (staffSearchText.indexOf(lowerQuery) === -1) continue;
    results.push({
      targetKey: 'staff:' + staffId,
      targetKind: 'STAFF',
      memberId: parentMemberId,
      staffId: staffId,
      displayName: staffDisplayName,
      memberType: parentMember ? String(parentMember['会員種別コード'] || 'BUSINESS') : 'BUSINESS',
      memberStatus: parentMember ? String(parentMember['会員状態コード'] || '') : '',
      staffRole: String(staff['職員権限コード'] || ''),
      staffStatus: String(staff['職員状態コード'] || ''),
      loginId: staffLoginId,
      isDeleted: toBoolean_(staff['削除フラグ']),
    });
    if (results.length >= 20) break;
  }

  return results;
}

function previewDeleteMember_(payload) {
  var targetKeys = normalizeDeleteTargetKeys_(payload);
  var ss = getOrCreateDatabase_();
  var plan = buildLogicalDeletePlan_(ss, targetKeys);
  return {
    targets: plan.targets,
    counts: plan.counts,
    retainedCounts: plan.retainedCounts,
    totalRows: plan.totalRows,
    totalUpdatedRows: plan.totalUpdatedRows,
  };
}

function executeDeleteMember_(payload) {
  var confirmText = String(payload.confirmText || '');
  if (confirmText !== '論理削除') throw new Error('確認テキストが一致しません。');

  var targetKeys = normalizeDeleteTargetKeys_(payload);
  var ss = getOrCreateDatabase_();
  var plan = buildLogicalDeletePlan_(ss, targetKeys);
  if (plan.targets.length === 0) throw new Error('対象が見つかりません。');

  var snap = {};
  function collectRows_(tableName, filterFn) {
    var rows = getRowsAsObjects_(ss, tableName);
    snap[tableName] = rows.filter(filterFn);
  }

  var memberIdSet = {};
  var staffIdSet = {};
  var authIdSet = {};
  for (var i = 0; i < plan.memberIds.length; i++) memberIdSet[String(plan.memberIds[i])] = true;
  for (var j = 0; j < plan.staffIds.length; j++) staffIdSet[String(plan.staffIds[j])] = true;
  for (var k = 0; k < plan.authIds.length; k++) authIdSet[String(plan.authIds[k])] = true;

  collectRows_('T_会員', function(row) { return memberIdSet[String(row['会員ID'] || '')]; });
  collectRows_('T_事業所職員', function(row) { return staffIdSet[String(row['職員ID'] || '')]; });
  collectRows_('T_認証アカウント', function(row) { return authIdSet[String(row['認証ID'] || '')]; });
  collectRows_('T_管理者Googleホワイトリスト', function(row) { return memberIdSet[String(row['紐付け会員ID'] || '')]; });
  collectRows_('T_ログイン履歴', function(row) { return authIdSet[String(row['認証ID'] || '')]; });
  collectRows_('T_年会費納入履歴', function(row) { return memberIdSet[String(row['会員ID'] || '')]; });
  collectRows_('T_年会費更新履歴', function(row) { return memberIdSet[String(row['会員ID'] || '')]; });
  collectRows_('T_研修申込', function(row) {
    return memberIdSet[String(row['会員ID'] || '')] ||
      memberIdSet[String(row['申込者ID'] || '')] ||
      staffIdSet[String(row['職員ID'] || '')];
  });

  if (!ss.getSheetByName('T_削除ログ')) {
    addDeleteLogSheet();
  }

  var logId = Utilities.getUuid();
  var operatorEmail = '';
  try {
    var session = checkAdminBySession_();
    operatorEmail = session ? String(session.googleEmail || '') : '';
  } catch (e) {}

  appendRowsByHeaders_(ss, 'T_削除ログ', [{
    'ログID': logId,
    '操作日時': new Date().toISOString(),
    '操作者メール': operatorEmail,
    '対象会員IDリスト': plan.targetKeys.join(','),
    '削除前スナップショットJSON': JSON.stringify(snap),
  }]);

  var nowIso = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  archiveMembersByIds_(ss, plan.memberIds, today, nowIso);
  archiveStaffsByIds_(ss, plan.staffIds, today, nowIso);
  archiveAuthAccountsForTargets_(ss, plan.memberIds, plan.staffIds, nowIso);
  archiveAdminWhitelistsByMemberIds_(ss, plan.memberIds, nowIso);

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    logId: logId,
    archivedTargetKeys: plan.targetKeys,
    affectedCounts: plan.counts,
    retainedCounts: plan.retainedCounts,
  };
}

function getDeleteLogs_(payload) {
  var limit = Math.min(parseInt(payload && payload.limit, 10) || 20, 100);
  var ss = getOrCreateDatabase_();
  if (!ss.getSheetByName('T_削除ログ')) return [];
  var rows = getRowsAsObjects_(ss, 'T_削除ログ');
  return rows.slice(-limit).reverse().map(function(row) {
    var snap = {};
    try { snap = JSON.parse(String(row['削除前スナップショットJSON'] || '{}')); } catch (e) {}
    var totalRows = Object.keys(snap).reduce(function(sum, tableName) {
      return sum + (Array.isArray(snap[tableName]) ? snap[tableName].length : 0);
    }, 0);
    return {
      logId: String(row['ログID'] || ''),
      operatedAt: String(row['操作日時'] || ''),
      operatorEmail: String(row['操作者メール'] || ''),
      memberIdList: String(row['対象会員IDリスト'] || ''),
      totalAffectedRows: totalRows,
    };
  });
}

/**
 * ログSSのスキーマを再構築する（既存ログSSのシートが壊れた場合など）。
 */


/**
 * 退会済み会員（指定年数以上前）をアーカイブシートに移動する（定期実行用）。
 * デフォルトは退会から3年以上経過した会員をアーカイブ対象とする。
 * 実行前に rebuildDatabaseSchema() でアーカイブシートが作成済みであること。
 */


/**
 * LOG_SPREADSHEET_ID をこのプロジェクトのスクリプトプロパティに設定する。
 * admin/member split に同じログSSIDを適用するために使用する。
 */

// ---------------------------------------------------------------------------
// PBKDF2 パスワードハッシュ (docs/122)
// ---------------------------------------------------------------------------

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

/**
 * PBKDF2 反復数。GAS の 30 秒制限内に収まる最大値をベンチマーク結果から設定。
 * ベンチマーク結果: 10000itr ≒ 2-4s (GAS), 本番は 10000 を採用。
 * NIST SP 800-132 推奨 (100,000+) に対し GAS 制約内の最大値。
 */
var PBKDF2_ITERATIONS = 10000;
function hashPasswordPbkdf2_(password, salt) {
  var dk = pbkdf2HmacSha256_(password, salt, PBKDF2_ITERATIONS, 32);
  return 'pbkdf2:sha256:' + dk;
}

/**
 * パスワード検証。ハッシュ方式を自動判別する。
 * - "pbkdf2:sha256:" prefix → PBKDF2 で検証
 * - それ以外 → 旧 SHA-256 で検証
 * 旧方式で一致した場合は rehash 用フラグを返す。
 */
