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
    '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL': { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' },
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
 * DBスキーマを再構築する。
 * 既存の定義外シートは削除し、定義シートのヘッダー/入力規則/保護を再適用する。
 */




/**
 * 定義外シートのみを削除する。
 */

/**
 * 定義済みの範囲のみを構築する。
 * 未定義の初期業務データ（例: 認証アカウント実データ）は作成しない。
 */


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


/**
 * 研修の問い合わせ窓口（担当者/連絡先）欠損を監査する。
 */

/**
 * 研修の問い合わせ窓口（担当者/連絡先）未設定データをテスト用既定値で補完する。
 */




var APP_SECURITY_BOUNDARY = 'public';

var PUBLIC_ALLOWED_ACTIONS = {
  getPublicTrainings: true,
  getPublicPortalSettings: true,
  getFileThumbnail: true,   // v272: Drive ファイルサムネイルを base64 で返す
  applyTrainingExternal: true,
  cancelTrainingExternal: true,
  submitMemberApplication: true,
  // v260: 公開ポータル 会員情報変更・退会申請
  sendPublicOtp: true,          // 退会申請用 OTP（継続使用）
  verifyPublicOtp: true,        // 退会申請用 OTP 検証（継続使用）
  lookupMemberForPublicUpdate: true,   // v261: CM番号/事業所番号で照合 → トークン発行
  submitPublicMemberUpdate: true,
  submitPublicBusinessUpdate: true,    // v261: 事業所 基本情報+スタッフ操作
  addPublicStaffMember: true,          // v261: 事業所スタッフ追加
  removePublicStaffByCmNumber: true,   // v261: 事業所スタッフ除籍
  submitPublicWithdrawalRequest: true,
  // v264: OTPなし本人確認フロー + 変更申請キュー
  verifyMemberIdentityForPublic: true,
  submitPublicChangeRequest: true,
  getPublicAvailableStaffSlots: true,
};


// 管理者ログイン専用アクション: Session.getActiveUser() による自己完結型認証のため、
// 事前の admin session 検証を必要としない。関数内で認証を完結させる。


function getActionRegistryForCurrentApp_() {
  return {
    publicActions: PUBLIC_ALLOWED_ACTIONS,
    memberActions: {},
    adminLoginActions: {},
    adminPermissions: {},
  };
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
        // ─────────────────────────────────────────────────────────



    // v150: 管理者初期データ統合API（dashboard + settings を1回のround-tripで返す）














    if (action === 'submitMemberApplication') {
      return JSON.stringify({ success: true, data: submitMemberApplication_(parsedPayload) });
    }





    // v150: ログイン+ポータルデータ統合API（round-trip削減）


    // v150: 管理者ログイン+ポータルデータ統合API（round-trip削減）
















    if (action === 'getPublicTrainings') {
      return getPublicTrainings_();
    }

    if (action === 'getFileThumbnail') {
      return JSON.stringify({ success: true, data: getFileThumbnail_(parsedPayload) });
    }

    if (action === 'getPublicPortalSettings') {
      return getPublicPortalSettings_();
    }

    if (action === 'applyTrainingExternal') {
      return applyTrainingExternal_(parsedPayload);
    }

    if (action === 'cancelTrainingExternal') {
      return cancelTrainingExternal_(parsedPayload);
    }

    // v260/v261: 公開ポータル 会員情報変更・退会申請
    if (action === 'sendPublicOtp') {
      return JSON.stringify({ success: true, data: sendPublicOtp_(parsedPayload) });
    }

    if (action === 'verifyPublicOtp') {
      return JSON.stringify({ success: true, data: verifyPublicOtp_(parsedPayload) });
    }

    if (action === 'lookupMemberForPublicUpdate') {
      return JSON.stringify({ success: true, data: lookupMemberForPublicUpdate_(parsedPayload) });
    }

    if (action === 'submitPublicMemberUpdate') {
      return JSON.stringify({ success: true, data: submitPublicMemberUpdate_(parsedPayload) });
    }

    if (action === 'submitPublicBusinessUpdate') {
      return JSON.stringify({ success: true, data: submitPublicBusinessUpdate_(parsedPayload) });
    }

    if (action === 'addPublicStaffMember') {
      return JSON.stringify({ success: true, data: addPublicStaffMember_(parsedPayload) });
    }

    if (action === 'removePublicStaffByCmNumber') {
      return JSON.stringify({ success: true, data: removePublicStaffByCmNumber_(parsedPayload) });
    }

    if (action === 'submitPublicWithdrawalRequest') {
      return JSON.stringify({ success: true, data: submitPublicWithdrawalRequest_(parsedPayload) });
    }

    // v264: OTPなし本人確認フロー
    if (action === 'verifyMemberIdentityForPublic') {
      return JSON.stringify({ success: true, data: verifyMemberIdentityForPublic_(parsedPayload) });
    }
    if (action === 'submitPublicChangeRequest') {
      return JSON.stringify({ success: true, data: submitPublicChangeRequest_(parsedPayload) });
    }
    if (action === 'getPublicAvailableStaffSlots') {
      return JSON.stringify({ success: true, data: getPublicAvailableStaffSlots_(parsedPayload) });
    }




    // v188: Gemini AI案内メール生成（APIキーはScriptPropertiesで管理、フロントに露出しない）

    // v194: PDF名簿出力（対象取得）

    // v205: チャンク分割 PDF 出力 API（1000件対応・all-or-nothing + リトライ）


    // v194: 会員一括メール送信



    // v219: 入会メール テンプレート管理

    // v224: 一括メール テンプレート管理

    // v207: 宛名リスト Excel 出力

    // v232: 物理削除（MASTER専用）

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


/**
 * 負荷試験用の会員・事業所・職員・認証・会費・研修申込データを追加する。
 * - 既存データは保持する
 * - 以前生成した LT 系データのみ削除して再生成する
 * - 会員/職員/認証/年会費/申込/申込者数の整合を同一処理で保つ
 */
































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


// v235: loginId をセッションアンカーとして受け取り、T_認証アカウントから現在の memberId/staffId を解決する。
// ロール変換後にフロントエンドのセッションが古い memberId を持っていても自動補正される。
// 後方互換: loginId のみ指定時は T_認証アカウントから解決。memberId のみ指定（旧形式）も引き続き動作。








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

/**
 * google.script.run 経由で呼び出し元の Google セッションを検証し、管理者認証を行う。
 * Session.getActiveUser() は google.script.run 呼び出し元のメールを返す（Execute as: Me でも）。
 * 権限コードに応じた adminPermissionLevel を返す。
 */



// MASTER のみ変更可能な設定キー（v194）
var MASTER_ONLY_SETTING_KEYS = ['EMAIL_LOG_VIEWER_ROLE'];

// T_システム設定のスネークアッパーケースキーを camelCase に変換する
// 例: 'EMAIL_LOG_VIEWER_ROLE' → 'emailLogViewerRole'














function getCurrentFiscalYear_() {
  var now = new Date();
  var month = now.getMonth() + 1;
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}









function clearRecentAnnualFeeAdminCaches_() {
  var currentFiscalYear = getCurrentFiscalYear_();
  for (var year = currentFiscalYear - 2; year <= currentFiscalYear + 1; year += 1) {
    clearAnnualFeeAdminCache_(year);
  }
}







function buildColumnIndex_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  return cols;
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

  // v209: 認証情報メール設定を一度だけ読み込む
  var credEmailEnabledRaw = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_ENABLED');
  var credEmailEnabled = credEmailEnabledRaw === '' || credEmailEnabledRaw === null
    ? true
    : String(credEmailEnabledRaw) !== 'false';
  // v219: 会員種別ラベル・年会費をマージタグ用に解決
  var memberTypeLabelForEmail = memberTypeCode;
  var annualFeeForEmail = 0;
  try {
    var memberTypeMasterRows = getRowsAsObjects_(ss, 'M_会員種別');
    var mtRow = null;
    for (var i = 0; i < memberTypeMasterRows.length; i++) {
      if (String(memberTypeMasterRows[i]['コード'] || '') === memberTypeCode) {
        mtRow = memberTypeMasterRows[i];
        break;
      }
    }
    if (mtRow) {
      memberTypeLabelForEmail = String(mtRow['名称'] || memberTypeCode);
      annualFeeForEmail = parseInt(String(mtRow['年会費金額'] || '0'), 10) || 0;
    }
  } catch (e) {
    // マスタ取得失敗はメール送信を止めない
  }
  var credEmailOpts = {
    from: String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim(),
    subject: String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_SUBJECT') || '') || CREDENTIAL_EMAIL_DEFAULT_SUBJECT,
    body: String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_BODY') || '') || CREDENTIAL_EMAIL_DEFAULT_BODY,
    memberTypeLabel: memberTypeLabelForEmail,
    annualFee: annualFeeForEmail,
  };

  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  var registrationIndex = buildMemberApplicationRegistrationIndex_(ss);
  var transitionSummary = [];
  var isBusiness = memberTypeCode === 'BUSINESS';
  function getSingleRegistrationCandidate_(candidates, duplicateMessage) {
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length > 1) throw new Error(duplicateMessage);
    return candidates[0];
  }

  if (!isBusiness && memberTypeCode === 'INDIVIDUAL') {
    var applicantCareManagerNumber = String(payload.careManagerNumber || '').trim();
    var duplicateIndividual = getSingleRegistrationCandidate_(
      registrationIndex.activeMembersByCareManager[applicantCareManagerNumber],
      '同じ介護支援専門員番号の会員が複数登録されています。事務局へお問い合わせください。'
    );
    if (duplicateIndividual) {
      throw new Error('この介護支援専門員番号は既に登録済みです。個人会員の二重登録はできません。');
    }

    var sourceStaff = getSingleRegistrationCandidate_(
      registrationIndex.activeStaffByCareManager[applicantCareManagerNumber],
      '同じ介護支援専門員番号の事業所会員メンバーが複数登録されています。事務局へお問い合わせください。'
    );
    if (sourceStaff) {
      var convertedPayload = preparePublicStaffConversionPayload_(ss, {
        sourceMemberId: sourceStaff.memberId,
        sourceStaffId: sourceStaff.staffId,
      });
      var conversionResult = convertStaffToIndividual_(ss, convertedPayload);
      overwritePublicApplicationMemberFields_(ss, conversionResult.newMemberId, payload, memberTypeCode, joinedDate, now);
      clearAllDataCache_();
      clearAdminDashboardCache_();
      transitionSummary.push('事業所会員メンバーから個人会員へ切り替えました。');
      return {
        created: true,
        converted: true,
        memberId: conversionResult.newMemberId,
        loginId: sourceStaff.loginId || applicantCareManagerNumber,
        staffCredentials: null,
        emailsSent: 0,
        transitionSummary: transitionSummary,
      };
    }
  }

  if (isBusiness) {
    var officeNumber = String(payload.officeNumber || '').trim();
    if (!officeNumber) throw new Error('事業所番号が未入力です。');
    if (!/^[A-Za-z0-9]{10}$/.test(officeNumber)) {
      throw new Error('事業所番号は半角英数字10文字で入力してください。');
    }
    var duplicateOffice = getSingleRegistrationCandidate_(
      registrationIndex.activeBusinessByOfficeNumber[officeNumber],
      '同じ事業所番号の事業所会員が複数登録されています。事務局へお問い合わせください。'
    );
    if (duplicateOffice) {
      throw new Error('この事業所番号は既に登録済みです。同じ事業所の二重登録はできません。');
    }
  }

  if (findRowByColumnValue_(memberSheet, '会員ID', memberId)) {
    memberId = generateMemberId_(); // retry once
  }

  // T_会員 レコード作成
  var memberColumns = テーブル定義.T_会員;
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
      case '勤務先住所2': return String(payload.officeAddressLine2 || '');
      case '勤務先電話番号': return String(payload.phone || '');
      case '勤務先FAX番号': return String(payload.fax || '');
      case '自宅郵便番号': return String(payload.homePostCode || '');
      case '自宅都道府県': return String(payload.homePrefecture || '');
      case '自宅市区町村': return String(payload.homeCity || '');
      case '自宅住所': return String(payload.homeAddressLine || '');
      case '自宅住所2': return String(payload.homeAddressLine2 || '');
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
    transitionSummary: transitionSummary,
  };

  if (isBusiness) {
    // 事業所会員: 職員ごとに認証レコード作成 + メール送信（v265: 代表者/メンバー別テンプレート）
    var bizOfficeName = String(payload.officeName || '').trim();
    var bizEmailSettings = getBizEmailSettings_(ss);
    var staffList = Array.isArray(payload.staff) ? payload.staff.filter(function(staff) {
      if (!staff || typeof staff !== 'object') return false;
      return [
        staff.lastName,
        staff.firstName,
        staff.lastKana,
        staff.firstKana,
        staff.careManagerNumber,
        staff.email,
      ].some(function(value) {
        return String(value || '').trim() !== '';
      });
    }) : [];
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
    var seenCareManagerNumbers = {};

    for (var i = 0; i < staffList.length; i++) {
      var s = staffList[i];
      var cmNumber = String(s.careManagerNumber || '').trim();
      var staffEmail = String(s.email || '').trim();
      var staffRole = String(s.role || 'STAFF');
      if (['REPRESENTATIVE', 'ADMIN', 'STAFF'].indexOf(staffRole) === -1) staffRole = 'STAFF';

      if (!cmNumber) throw new Error('職員 ' + (i + 1) + ' の介護支援専門員番号が未入力です。');
      if (!staffEmail) throw new Error('職員 ' + (i + 1) + ' のメールアドレスが未入力です。');
      if (seenCareManagerNumbers[cmNumber]) {
        throw new Error('同じ介護支援専門員番号の職員が重複しています。職員 ' + (i + 1) + ' を確認してください。');
      }
      seenCareManagerNumbers[cmNumber] = true;

      var duplicateMember = getSingleRegistrationCandidate_(
        registrationIndex.activeMembersByCareManager[cmNumber],
        '同じ介護支援専門員番号の会員が複数登録されています。事務局へお問い合わせください。'
      );
      if (duplicateMember) {
        var convertToStaffResult = convertIndividualToStaff_(ss, {
          sourceMemberId: duplicateMember.memberId,
          targetOfficeMemberId: memberId,
          staffRole: staffRole,
        });
        overwritePublicApplicationStaffFields_(ss, memberId, convertToStaffResult.newStaffId, s, joinedDate, now);
        transitionSummary.push('個人会員を退会し、申込事業所のメンバーとして登録しました: ' + joinHumanNameParts_(s.lastName, s.firstName).trim());
        staffCredentials.push({
          name: joinHumanNameParts_(s.lastName, s.firstName).trim(),
          loginId: duplicateMember.loginId || cmNumber,
          email: staffEmail,
        });
        continue;
      }

      var duplicateStaff = getSingleRegistrationCandidate_(
        registrationIndex.activeStaffByCareManager[cmNumber],
        '同じ介護支援専門員番号の事業所会員メンバーが複数登録されています。事務局へお問い合わせください。'
      );
      if (duplicateStaff) {
        if (String(duplicateStaff.memberId || '') === String(memberId)) {
          throw new Error('同じ事業所への重複登録はできません。職員 ' + (i + 1) + ' を確認してください。');
        }
        var transferResult = transferBusinessStaffToBusinessMember_(ss, {
          sourceMemberId: duplicateStaff.memberId,
          sourceStaffId: duplicateStaff.staffId,
          targetOfficeMemberId: memberId,
          staffRole: staffRole,
        });
        overwritePublicApplicationStaffFields_(ss, memberId, transferResult.newStaffId, s, joinedDate, now);
        transitionSummary.push('既存の事業所会員メンバーを退会し、申込事業所のメンバーとして登録しました: ' + joinHumanNameParts_(s.lastName, s.firstName).trim());
        staffCredentials.push({
          name: joinHumanNameParts_(s.lastName, s.firstName).trim(),
          loginId: duplicateStaff.loginId || cmNumber,
          email: staffEmail,
        });
        continue;
      }

      var staffId = Utilities.getUuid().substring(0, 8);
      var staffName = joinHumanNameParts_(s.lastName, s.firstName);
      var staffKana = joinHumanNameParts_(s.lastKana, s.firstKana);

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

      // v265: 事業所メール送信 — 全体フラグ最優先、代表者/メンバー別テンプレート
      if (credEmailEnabled) {
        var bizVars = {
          氏名: staffName.trim(),
          ログインID: loginId,
          パスワード: defaultPassword,
          会員マイページURL: MEMBER_PORTAL_URL,
          事業所名: bizOfficeName,
        };
        var fromAddr = credEmailOpts.from || '';
        try {
          if (staffRole === 'REPRESENTATIVE') {
            if (bizEmailSettings.bizRepEmailEnabled) {
              var repBody = renderBizEmailTemplate_(bizEmailSettings.bizRepEmailBody, bizVars);
              sendEmailWithValidatedFrom_(staffEmail, bizEmailSettings.bizRepEmailSubject, repBody, { from: fromAddr });
              result.emailsSent++;
            }
          } else {
            if (bizEmailSettings.bizStaffEmailEnabled) {
              var memberBody = renderBizEmailTemplate_(bizEmailSettings.bizStaffEmailBody, bizVars);
              sendEmailWithValidatedFrom_(staffEmail, bizEmailSettings.bizStaffEmailSubject, memberBody, { from: fromAddr });
              result.emailsSent++;
            }
          }
        } catch (e) {
          Logger.log('biz email send failed for ' + staffEmail + ' (' + staffRole + '): ' + e.message);
        }
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

    result.loginId = loginId;

    // v265: 個人・賛助会員メール送信（全体フラグ + 個別フラグ両方チェック）
    var indSuppEmailEnabledRaw = getSystemSettingValue_(ss, 'IND_SUPP_EMAIL_ENABLED');
    var indSuppEmailEnabled = (indSuppEmailEnabledRaw === '' || indSuppEmailEnabledRaw === null)
      ? true : String(indSuppEmailEnabledRaw) !== 'false';
    var email = String(payload.email || '').trim();
    if (email && credEmailEnabled && indSuppEmailEnabled) {
      try {
        var memberName = String(payload.lastName || '') + ' ' + String(payload.firstName || '');
        sendCredentialEmail_(email, loginId, defaultPassword, memberName.trim(), credEmailOpts);
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

function isRegisteredMemberForApplication_(row) {
  if (!row || toBoolean_(row['削除フラグ'])) return false;
  return String(row['会員状態コード'] || 'ACTIVE') !== 'WITHDRAWN';
}

function isRegisteredStaffForApplication_(staffRow, memberRow) {
  if (!staffRow || !memberRow) return false;
  if (toBoolean_(staffRow['削除フラグ'])) return false;
  if (String(staffRow['職員状態コード'] || 'ENROLLED') !== 'ENROLLED') return false;
  return isRegisteredMemberForApplication_(memberRow);
}

function buildMemberApplicationRegistrationIndex_(ss) {
  var memberRows = getRowsAsObjects_(ss, 'T_会員');
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員');
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント');
  var memberById = {};
  var authByMemberId = {};
  var authByStaffId = {};
  var activeMembersByCareManager = {};
  var activeStaffByCareManager = {};
  var activeBusinessByOfficeNumber = {};

  function push(map, key, value) {
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push(value);
  }

  for (var i = 0; i < memberRows.length; i += 1) {
    var member = memberRows[i];
    var memberId = String(member['会員ID'] || '').trim();
    if (!memberId) continue;
    memberById[memberId] = member;
  }

  for (var ai = 0; ai < authRows.length; ai += 1) {
    var auth = authRows[ai];
    if (toBoolean_(auth['削除フラグ'])) continue;
    var authMemberId = String(auth['会員ID'] || '').trim();
    var authStaffId = String(auth['職員ID'] || '').trim();
    if (authMemberId && !authStaffId && !authByMemberId[authMemberId]) authByMemberId[authMemberId] = auth;
    if (authStaffId && !authByStaffId[authStaffId]) authByStaffId[authStaffId] = auth;
  }

  for (var mi = 0; mi < memberRows.length; mi += 1) {
    var memberRow = memberRows[mi];
    if (!isRegisteredMemberForApplication_(memberRow)) continue;
    var memberId2 = String(memberRow['会員ID'] || '').trim();
    var memberType = String(memberRow['会員種別コード'] || '').trim();
    var careManagerNumber = String(memberRow['介護支援専門員番号'] || '').trim();
    var officeNumber = String(memberRow['事業所番号'] || '').trim();
    var authMember = authByMemberId[memberId2];
    var memberEntry = {
      memberId: memberId2,
      memberType: memberType,
      careManagerNumber: careManagerNumber,
      officeNumber: officeNumber,
      member: memberRow,
      auth: authMember || null,
      loginId: authMember ? String(authMember['ログインID'] || '').trim() : '',
    };
    if (memberType !== 'BUSINESS' && careManagerNumber) push(activeMembersByCareManager, careManagerNumber, memberEntry);
    if (memberType === 'BUSINESS' && officeNumber) push(activeBusinessByOfficeNumber, officeNumber, memberEntry);
  }

  for (var si = 0; si < staffRows.length; si += 1) {
    var staffRow = staffRows[si];
    var parentMemberId = String(staffRow['会員ID'] || '').trim();
    var parentMember = memberById[parentMemberId];
    if (!isRegisteredStaffForApplication_(staffRow, parentMember)) continue;
    var staffId = String(staffRow['職員ID'] || '').trim();
    var staffCareManagerNumber = String(staffRow['介護支援専門員番号'] || '').trim();
    var authStaff = authByStaffId[staffId];
    var staffEntry = {
      memberId: parentMemberId,
      staffId: staffId,
      staffRole: String(staffRow['職員権限コード'] || '').trim(),
      careManagerNumber: staffCareManagerNumber,
      member: parentMember,
      staff: staffRow,
      auth: authStaff || null,
      loginId: authStaff ? String(authStaff['ログインID'] || '').trim() : '',
    };
    if (staffCareManagerNumber) push(activeStaffByCareManager, staffCareManagerNumber, staffEntry);
  }

  return {
    activeMembersByCareManager: activeMembersByCareManager,
    activeStaffByCareManager: activeStaffByCareManager,
    activeBusinessByOfficeNumber: activeBusinessByOfficeNumber,
    memberById: memberById,
    authByMemberId: authByMemberId,
    authByStaffId: authByStaffId,
  };
}

function pickAutoRepresentativeSuccessorStaffId_(ss, sourceMemberId, sourceStaffId) {
  var candidates = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ'])
      && String(row['会員ID'] || '') === String(sourceMemberId || '')
      && String(row['職員ID'] || '') !== String(sourceStaffId || '')
      && String(row['職員状態コード'] || 'ENROLLED') === 'ENROLLED';
  });
  if (candidates.length === 0) return '';
  candidates.sort(function(a, b) {
    var roleOrder = { ADMIN: 0, STAFF: 1, REPRESENTATIVE: 2 };
    var aRole = String(a['職員権限コード'] || 'STAFF');
    var bRole = String(b['職員権限コード'] || 'STAFF');
    var roleDiff = (roleOrder[aRole] == null ? 9 : roleOrder[aRole]) - (roleOrder[bRole] == null ? 9 : roleOrder[bRole]);
    if (roleDiff !== 0) return roleDiff;
    return String(a['職員ID'] || '').localeCompare(String(b['職員ID'] || ''));
  });
  return String(candidates[0]['職員ID'] || '');
}

function preparePublicStaffConversionPayload_(ss, payload) {
  var next = {};
  for (var key in payload) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) next[key] = payload[key];
  }
  if (String(next.newRepresentativeStaffId || '').trim()) return next;

  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) return next;
  var staffFound = findRowByColumnValue_(staffSheet, '職員ID', String(next.sourceStaffId || ''));
  if (!staffFound) return next;
  var role = String(staffFound.row[staffFound.columns['職員権限コード']] || '');
  if (role !== 'REPRESENTATIVE') return next;

  var replacementStaffId = pickAutoRepresentativeSuccessorStaffId_(ss, next.sourceMemberId, next.sourceStaffId);
  if (replacementStaffId) next.newRepresentativeStaffId = replacementStaffId;
  return next;
}

function overwritePublicApplicationMemberFields_(ss, memberId, payload, memberTypeCode, joinedDate, nowIso) {
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  var found = findRowByColumnValue_(memberSheet, '会員ID', memberId);
  if (!found) throw new Error('会員 ' + memberId + ' が見つかりません。');
  var row = found.row.slice();
  var cols = found.columns;
  function setCol(name, value) {
    if (cols[name] != null) row[cols[name]] = value;
  }

  setCol('会員種別コード', memberTypeCode);
  setCol('会員状態コード', 'ACTIVE');
  setCol('入会日', joinedDate);
  setCol('退会日', '');
  setCol('退会処理日', '');
  setCol('姓', String(payload.lastName || '').trim());
  setCol('名', String(payload.firstName || '').trim());
  setCol('セイ', String(payload.lastKana || '').trim());
  setCol('メイ', String(payload.firstKana || '').trim());
  setCol('代表メールアドレス', String(payload.email || '').trim());
  setCol('携帯電話番号', String(payload.mobilePhone || '').trim());
  setCol('勤務先名', String(payload.officeName || '').trim());
  setCol('勤務先郵便番号', String(payload.officePostCode || '').trim());
  setCol('勤務先都道府県', String(payload.officePrefecture || '').trim());
  setCol('勤務先市区町村', String(payload.officeCity || '').trim());
  setCol('勤務先住所', String(payload.officeAddressLine || '').trim());
  setCol('勤務先住所2', String(payload.officeAddressLine2 || '').trim());
  setCol('勤務先電話番号', String(payload.phone || '').trim());
  setCol('勤務先FAX番号', String(payload.fax || '').trim());
  setCol('自宅郵便番号', String(payload.homePostCode || '').trim());
  setCol('自宅都道府県', String(payload.homePrefecture || '').trim());
  setCol('自宅市区町村', String(payload.homeCity || '').trim());
  setCol('自宅住所', String(payload.homeAddressLine || '').trim());
  setCol('自宅住所2', String(payload.homeAddressLine2 || '').trim());
  setCol('通知方法コード', String(payload.mailingPreference || 'EMAIL').trim());
  setCol('郵送先区分コード', String(payload.preferredMailDestination || 'OFFICE').trim());
  setCol('職員数上限', '');
  setCol('介護支援専門員番号', String(payload.careManagerNumber || '').trim());
  setCol('事業所番号', String(payload.officeNumber || '').trim());
  setCol('更新日時', nowIso);
  setCol('削除フラグ', false);
  memberSheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
}

function overwritePublicApplicationStaffFields_(ss, memberId, staffId, payload, joinedDate, nowIso) {
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');
  var found = findRowByColumnValue_(staffSheet, '職員ID', staffId);
  if (!found) throw new Error('職員 ' + staffId + ' が見つかりません。');
  var row = found.row.slice();
  var cols = found.columns;
  var lastName = String(payload.lastName || '').trim();
  var firstName = String(payload.firstName || '').trim();
  var lastKana = String(payload.lastKana || '').trim();
  var firstKana = String(payload.firstKana || '').trim();
  var name = joinHumanNameParts_(lastName, firstName).trim();
  var kana = joinHumanNameParts_(lastKana, firstKana).trim();
  var role = normalizeBusinessStaffRole_(payload.role);
  function setCol(name, value) {
    if (cols[name] != null) row[cols[name]] = value;
  }

  setCol('会員ID', memberId);
  setCol('姓', lastName);
  setCol('名', firstName);
  setCol('セイ', lastKana);
  setCol('メイ', firstKana);
  setCol('氏名', name);
  setCol('フリガナ', kana);
  setCol('メールアドレス', String(payload.email || '').trim());
  setCol('職員権限コード', role);
  setCol('職員状態コード', 'ENROLLED');
  setCol('入会日', joinedDate);
  setCol('退会日', '');
  setCol('介護支援専門員番号', String(payload.careManagerNumber || '').trim());
  setCol('メール配信希望コード', 'YES');
  setCol('更新日時', nowIso);
  setCol('削除フラグ', false);
  staffSheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
}

function transferBusinessStaffToBusinessMember_(ss, payload) {
  var sourceMemberId = String(payload.sourceMemberId || '').trim();
  var sourceStaffId = String(payload.sourceStaffId || '').trim();
  var targetOfficeMemberId = String(payload.targetOfficeMemberId || '').trim();
  var targetStaffRole = normalizeBusinessStaffRole_(payload.staffRole || 'STAFF');
  if (!sourceMemberId || !sourceStaffId || !targetOfficeMemberId) {
    throw new Error('sourceMemberId / sourceStaffId / targetOfficeMemberId は必須です。');
  }
  if (sourceMemberId === targetOfficeMemberId) {
    throw new Error('同じ事業所への重複登録はできません。');
  }

  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!memberSheet || !staffSheet) throw new Error('会員・職員シートが見つかりません。');

  var sourceFound = findRowByColumnValue_(memberSheet, '会員ID', sourceMemberId);
  if (!sourceFound) throw new Error('元の事業所会員が見つかりません。');
  if (String(sourceFound.row[sourceFound.columns['会員種別コード']] || '') !== 'BUSINESS') {
    throw new Error('元データは事業所会員ではありません。');
  }

  var targetFound = findRowByColumnValue_(memberSheet, '会員ID', targetOfficeMemberId);
  if (!targetFound) throw new Error('転籍先の事業所会員が見つかりません。');
  if (String(targetFound.row[targetFound.columns['会員種別コード']] || '') !== 'BUSINESS') {
    throw new Error('転籍先は事業所会員ではありません。');
  }
  if (String(targetFound.row[targetFound.columns['会員状態コード']] || '') === 'WITHDRAWN') {
    throw new Error('転籍先の事業所は退会済みです。');
  }

  var staffFound = findRowByColumnValue_(staffSheet, '職員ID', sourceStaffId);
  if (!staffFound) throw new Error('元の職員が見つかりません。');
  var sRow = staffFound.row;
  var sCols = staffFound.columns;
  if (String(sRow[sCols['会員ID']] || '') !== sourceMemberId) {
    throw new Error('職員は指定された元事業所に所属していません。');
  }
  if (String(sRow[sCols['職員状態コード']] || 'ENROLLED') !== 'ENROLLED') {
    throw new Error('元の職員は在籍中ではありません。');
  }

  var currentStaff = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ'])
      && String(row['会員ID'] || '') === targetOfficeMemberId
      && String(row['職員状態コード'] || 'ENROLLED') === 'ENROLLED';
  });
  var staffLimit = Number(targetFound.row[targetFound.columns['職員数上限']] || 50);
  if (currentStaff.length >= staffLimit) {
    throw new Error('転籍先の事業所は職員数上限（' + staffLimit + '名）に達しています。');
  }

  var nowIso = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var preparedPayload = preparePublicStaffConversionPayload_(ss, {
    sourceMemberId: sourceMemberId,
    sourceStaffId: sourceStaffId,
    newRepresentativeStaffId: payload.newRepresentativeStaffId || '',
  });

  var isRepresentative = String(sRow[sCols['職員権限コード']] || '') === 'REPRESENTATIVE';
  var officeWithdrawn = false;
  if (isRepresentative) {
    var enrolledOthers = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
      return !toBoolean_(row['削除フラグ'])
        && String(row['会員ID'] || '') === sourceMemberId
        && String(row['職員ID'] || '') !== sourceStaffId
        && String(row['職員状態コード'] || 'ENROLLED') === 'ENROLLED';
    });
    if (enrolledOthers.length === 0) {
      var sourceRow = sourceFound.row.slice();
      sourceRow[sourceFound.columns['会員状態コード']] = 'WITHDRAWN';
      sourceRow[sourceFound.columns['退会日']] = today;
      if (sourceFound.columns['退会処理日'] != null) sourceRow[sourceFound.columns['退会処理日']] = today;
      sourceRow[sourceFound.columns['更新日時']] = nowIso;
      memberSheet.getRange(sourceFound.rowNumber, 1, 1, sourceRow.length).setValues([sourceRow]);
      officeWithdrawn = true;
    } else {
      var replacementStaffId = String(preparedPayload.newRepresentativeStaffId || '').trim();
      if (!replacementStaffId) throw new Error('元の事業所の後任代表者を自動選定できませんでした。');
      var replacementFound = findRowByColumnValue_(staffSheet, '職員ID', replacementStaffId);
      if (!replacementFound) throw new Error('後任代表者が見つかりません。');
      var replacementRow = replacementFound.row.slice();
      replacementRow[replacementFound.columns['職員権限コード']] = 'REPRESENTATIVE';
      replacementRow[replacementFound.columns['更新日時']] = nowIso;
      staffSheet.getRange(replacementFound.rowNumber, 1, 1, replacementRow.length).setValues([replacementRow]);
    }
  }

  var newStaffId = 'S' + Date.now();
  var staffNameFields = normalizeStaffNameFields_({
    姓: sCols['姓'] != null ? sRow[sCols['姓']] : '',
    名: sCols['名'] != null ? sRow[sCols['名']] : '',
    セイ: sCols['セイ'] != null ? sRow[sCols['セイ']] : '',
    メイ: sCols['メイ'] != null ? sRow[sCols['メイ']] : '',
    氏名: sRow[sCols['氏名']],
    フリガナ: sRow[sCols['フリガナ']],
  });
  appendRowsByHeaders_(ss, 'T_事業所職員', [{
    職員ID: newStaffId,
    会員ID: targetOfficeMemberId,
    姓: staffNameFields.lastName,
    名: staffNameFields.firstName,
    セイ: staffNameFields.lastKana,
    メイ: staffNameFields.firstKana,
    氏名: staffNameFields.name,
    フリガナ: staffNameFields.kana,
    メールアドレス: String(sRow[sCols['メールアドレス']] || '').trim(),
    職員権限コード: targetStaffRole,
    職員状態コード: 'ENROLLED',
    入会日: today,
    退会日: '',
    介護支援専門員番号: String(sRow[sCols['介護支援専門員番号']] || '').trim(),
    メール配信希望コード: String(sRow[sCols['メール配信希望コード']] || 'YES') || 'YES',
    作成日時: nowIso,
    更新日時: nowIso,
    削除フラグ: false,
  }]);

  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (authSheet && authSheet.getLastRow() >= 2) {
    var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var hi = 0; hi < headers.length; hi += 1) cols[headers[hi]] = hi;
    var rows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
    for (var ri = 0; ri < rows.length; ri += 1) {
      if (String(rows[ri][cols['職員ID']] || '') !== sourceStaffId) continue;
      rows[ri][cols['会員ID']] = targetOfficeMemberId;
      rows[ri][cols['職員ID']] = newStaffId;
      rows[ri][cols['システムロールコード']] = targetStaffRole === 'STAFF' ? 'BUSINESS_MEMBER' : 'BUSINESS_ADMIN';
      rows[ri][cols['アカウント有効フラグ']] = true;
      rows[ri][cols['更新日時']] = nowIso;
      authSheet.getRange(ri + 2, 1, 1, rows[ri].length).setValues([rows[ri]]);
    }
  }

  var withdrawnStaffRow = sRow.slice();
  withdrawnStaffRow[sCols['職員状態コード']] = 'LEFT';
  withdrawnStaffRow[sCols['退会日']] = today;
  withdrawnStaffRow[sCols['削除フラグ']] = true;
  withdrawnStaffRow[sCols['更新日時']] = nowIso;
  staffSheet.getRange(staffFound.rowNumber, 1, 1, withdrawnStaffRow.length).setValues([withdrawnStaffRow]);

  migrateTrainingApplications_(ss, sourceMemberId, sourceStaffId, targetOfficeMemberId, newStaffId);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    converted: true,
    direction: 'STAFF_TO_STAFF',
    newStaffId: newStaffId,
    sourceStaffId: sourceStaffId,
    targetOfficeMemberId: targetOfficeMemberId,
    officeWithdrawn: officeWithdrawn,
  };
}

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

function sendCredentialEmail_(toEmail, loginId, password, memberName, opts) {
  opts = opts || {};
  var from = String(opts.from || '').trim();
  var subject = (opts.subject && opts.subject.trim()) ? opts.subject : CREDENTIAL_EMAIL_DEFAULT_SUBJECT;
  var bodyTemplate = (opts.body && opts.body.trim()) ? opts.body : CREDENTIAL_EMAIL_DEFAULT_BODY;
  // v219: 年会費を「3,000円」形式にフォーマット
  var annualFeeStr = '';
  if (opts.annualFee) {
    var feeNum = parseInt(String(opts.annualFee), 10);
    if (!isNaN(feeNum) && feeNum > 0) {
      annualFeeStr = feeNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '円';
    }
  }
  var body = bodyTemplate
    .replace(/\{\{氏名\}\}/g, memberName)
    .replace(/\{\{ログインID\}\}/g, loginId)
    .replace(/\{\{パスワード\}\}/g, password)
    .replace(/\{\{会員マイページURL\}\}/g, MEMBER_PORTAL_URL)
    .replace(/\{\{会員種別\}\}/g, opts.memberTypeLabel || '')
    .replace(/\{\{年会費\}\}/g, annualFeeStr);
  // replyTo は from が設定されている場合のみ設定する。
  // Session.getEffectiveUser() は userinfo.email スコープが必要で、
  // 統合・会員 split では v263 スコープ削減により使用不可。
  sendEmailWithValidatedFrom_(toEmail, subject, body, {
    from: from,
    replyTo: from || '',
    name: '枚方市介護支援専門員連絡協議会',
  });
}

// ── 入会メール テンプレート管理（v219）──────────────────
// T_システム設定 の CREDENTIAL_EMAIL_TEMPLATES キーに JSON 配列で保存
// [{id, name, subject, body, savedAt}, ...]




// ── 一括メール テンプレート管理（v224）──────────────────
// T_システム設定 の BULK_MAIL_TEMPLATES キーに JSON 配列で保存
// [{id, name, subject, body, savedAt}, ...]




function generateMemberId_() {
  var uuid = Utilities.getUuid().replace(/-/g, '');
  var hash = 0;
  for (var i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash + uuid.charCodeAt(i)) >>> 0;
  }
  return String(hash % 100000000).padStart(8, '0');
}

// ── 退会処理 ──────────────────────────────────────────

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

// ── v126: 事業所会員の予約退会（Scheduled Cancellation）──
// 翌年度4/1に退会を予約する。退会日まではサービス完全利用可能。

// ── v126: 予約退会のキャンセル ──

// ── v127: 職員個別更新（status/role 変更対応拡張）──

// ── v126: 翌年度の4月1日を返す ──

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

// ── 会員CM番号重複（同一CM番号の複数アクティブ個人/賛助会員）を修復する (MASTER専用) ──
// 同一CM番号に ACTIVE/WITHDRAWAL_SCHEDULED の個人・賛助会員が複数存在する場合、
// 入会日が最も新しい1件を残し、残りを WITHDRAWN + 退会日=本日 に更新する。
// 削除フラグ=true のレコードは一切触れない。

// ── T_研修申込の申込者ID不整合を修復する (MASTER専用) ──────────────
// 申込者区分コード=MEMBER かつ 申込者ID ≠ 会員ID のレコードを対象に、
// 申込者ID を 会員ID に揃える（不変条件の回復）。
// 安全条件: 会員ID が T_会員 に存在するレコードのみ更新。削除フラグ=true は触らない。

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




// v143: 管理者会員詳細編集用サニタイズ — ADMIN_MEMBER_WRITABLE_FIELDS_ でフィルタ

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


// ── v125: フラット人物リスト取得（個人会員+事業所職員を混合） ──

// ── v125: フラット人物の一括更新 ──
var ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_ = [
  'email', 'mailingPreference', 'preferredMailDestination',
  'status', 'joinedDate', 'withdrawnDate',
];
var ADMIN_BATCH_PERSON_WRITABLE_STAFF_ = [
  'email', 'status', 'joinedDate', 'withdrawnDate',
];



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

function toBoolean_(v) {
  if (v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1') {
    return true;
  }
  return false;
}

function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}










/**
 * 研修を新規登録または更新する。
 * payload.id が空の場合は新規作成、ある場合は既存行を更新する。
 */

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


function countAppliedApplicants_(ss, trainingId) {
  return getTrainingApplicationRows_(ss, { appliedOnly: true, trainingId: String(trainingId || '') }).length;
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

/**
 * 研修ファイル用フォルダIDを返す管理者 API。
 * 設定画面の「フォルダを作成・設定する」ボタンから呼び出す。
 */


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

// v210: 公開ポータルの表示設定（認証不要・公開API）
function getPublicPortalSettings_() {
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var map = getSystemSettingMap_(db);
  var trainingMenuEnabledRaw = map['PUBLIC_PORTAL_TRAINING_MENU_ENABLED'];
  var publicPortalTrainingMenuEnabled = trainingMenuEnabledRaw === undefined || trainingMenuEnabledRaw === ''
    ? true
    : String(trainingMenuEnabledRaw) !== 'false';
  var membershipMenuEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED'];
  var publicPortalMembershipMenuEnabled = membershipMenuEnabledRaw === undefined || membershipMenuEnabledRaw === ''
    ? true
    : String(membershipMenuEnabledRaw) !== 'false';
  var heroBadgeEnabledRaw = map['PUBLIC_PORTAL_HERO_BADGE_ENABLED'];
  var publicPortalHeroBadgeEnabled = heroBadgeEnabledRaw === undefined || heroBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled
    : String(heroBadgeEnabledRaw) !== 'false';
  var publicPortalHeroBadgeLabel = String(map['PUBLIC_PORTAL_HERO_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.heroBadgeLabel;
  var publicPortalHeroTitle = String(map['PUBLIC_PORTAL_HERO_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.heroTitle;
  var heroDescriptionEnabledRaw = map['PUBLIC_PORTAL_HERO_DESCRIPTION_ENABLED'];
  var publicPortalHeroDescriptionEnabled = heroDescriptionEnabledRaw === undefined || heroDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled
    : String(heroDescriptionEnabledRaw) !== 'false';
  var publicPortalHeroDescription = String(map['PUBLIC_PORTAL_HERO_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.heroDescription;
  var membershipBadgeEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_BADGE_ENABLED'];
  var publicPortalMembershipBadgeEnabled = membershipBadgeEnabledRaw === undefined || membershipBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled
    : String(membershipBadgeEnabledRaw) !== 'false';
  var publicPortalMembershipBadgeLabel = String(map['PUBLIC_PORTAL_MEMBERSHIP_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipBadgeLabel;
  var membershipTitleEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_TITLE_ENABLED'];
  var publicPortalMembershipTitleEnabled = membershipTitleEnabledRaw === undefined || membershipTitleEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled
    : String(membershipTitleEnabledRaw) !== 'false';
  var publicPortalMembershipTitle = String(map['PUBLIC_PORTAL_MEMBERSHIP_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipTitle;
  var membershipDescriptionEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION_ENABLED'];
  var publicPortalMembershipDescriptionEnabled = membershipDescriptionEnabledRaw === undefined || membershipDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled
    : String(membershipDescriptionEnabledRaw) !== 'false';
  var publicPortalMembershipDescription = String(map['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipDescription;
  var publicPortalMembershipCtaLabel = String(map['PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel;
  var completionGuidanceVisibleRaw = map['PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE'];
  var publicPortalCompletionGuidanceVisible = completionGuidanceVisibleRaw === undefined || completionGuidanceVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible
    : String(completionGuidanceVisibleRaw) !== 'false';
  var completionLoginInfoVisibleRaw = map['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE'];
  var publicPortalCompletionLoginInfoVisible = completionLoginInfoVisibleRaw === undefined || completionLoginInfoVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible
    : String(completionLoginInfoVisibleRaw) !== 'false';
  var completionLoginInfoBlockVisibleRaw = map['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE'];
  var publicPortalCompletionLoginInfoBlockVisible = completionLoginInfoBlockVisibleRaw === undefined || completionLoginInfoBlockVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible
    : String(completionLoginInfoBlockVisibleRaw) !== 'false';
  var legacyCompletionNoCredentialNotice = String(map['PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice;
  var legacyCompletionCredentialNotice = String(map['PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice;
  var publicPortalCompletionGuidanceBodyWhenCredentialSent = String(map['PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT'] || '') || [
    legacyCompletionCredentialNotice,
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。'
  ].join('\n');
  var publicPortalCompletionGuidanceBodyWhenCredentialNotSent = String(map['PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT'] || '') || [
    legacyCompletionNoCredentialNotice,
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。'
  ].join('\n');
  var publicPortalCompletionLoginInfoBodyWhenCredentialSent = String(map['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT'] || '') || PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialSent;
  var publicPortalCompletionLoginInfoBodyWhenCredentialNotSent = String(map['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT'] || '') || PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent;
  var publicPortalCompletionNoCredentialNotice = String(map['PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice;
  var publicPortalCompletionCredentialNotice = String(map['PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE'] || '') || PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice;
  var credentialEmailEnabledRaw = map['CREDENTIAL_EMAIL_ENABLED'];
  var credentialEmailEnabled = credentialEmailEnabledRaw === '' || credentialEmailEnabledRaw === null
    ? true
    : String(credentialEmailEnabledRaw) !== 'false';
  var ppTrainingBadgeEnabledRaw = map['PUBLIC_PORTAL_TRAINING_BADGE_ENABLED'];
  var ppTrainingBadgeEnabled = ppTrainingBadgeEnabledRaw === undefined || ppTrainingBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled : String(ppTrainingBadgeEnabledRaw) !== 'false';
  var ppTrainingBadgeLabel = String(map['PUBLIC_PORTAL_TRAINING_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingBadgeLabel;
  var ppTrainingTitleEnabledRaw = map['PUBLIC_PORTAL_TRAINING_TITLE_ENABLED'];
  var ppTrainingTitleEnabled = ppTrainingTitleEnabledRaw === undefined || ppTrainingTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled : String(ppTrainingTitleEnabledRaw) !== 'false';
  var ppTrainingTitle = String(map['PUBLIC_PORTAL_TRAINING_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingTitle;
  var ppTrainingDescriptionEnabledRaw = map['PUBLIC_PORTAL_TRAINING_DESCRIPTION_ENABLED'];
  var ppTrainingDescriptionEnabled = ppTrainingDescriptionEnabledRaw === undefined || ppTrainingDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled : String(ppTrainingDescriptionEnabledRaw) !== 'false';
  var ppTrainingDescription = String(map['PUBLIC_PORTAL_TRAINING_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingDescription;
  var ppTrainingCtaLabel = String(map['PUBLIC_PORTAL_TRAINING_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.trainingCtaLabel;
  var ppMemberUpdateMenuEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED'];
  var ppMemberUpdateMenuEnabled = ppMemberUpdateMenuEnabledRaw === undefined || ppMemberUpdateMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled : String(ppMemberUpdateMenuEnabledRaw) !== 'false';
  var ppMemberUpdateBadgeEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_ENABLED'];
  var ppMemberUpdateBadgeEnabled = ppMemberUpdateBadgeEnabledRaw === undefined || ppMemberUpdateBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled : String(ppMemberUpdateBadgeEnabledRaw) !== 'false';
  var ppMemberUpdateBadgeLabel = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeLabel;
  var ppMemberUpdateTitleEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE_ENABLED'];
  var ppMemberUpdateTitleEnabled = ppMemberUpdateTitleEnabledRaw === undefined || ppMemberUpdateTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled : String(ppMemberUpdateTitleEnabledRaw) !== 'false';
  var ppMemberUpdateTitle = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateTitle;
  var ppMemberUpdateDescriptionEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION_ENABLED'];
  var ppMemberUpdateDescriptionEnabled = ppMemberUpdateDescriptionEnabledRaw === undefined || ppMemberUpdateDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled : String(ppMemberUpdateDescriptionEnabledRaw) !== 'false';
  var ppMemberUpdateDescription = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateDescription;
  var ppMemberUpdateCtaLabel = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.memberUpdateCtaLabel;
  var ppWithdrawalMenuEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED'];
  var ppWithdrawalMenuEnabled = ppWithdrawalMenuEnabledRaw === undefined || ppWithdrawalMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled : String(ppWithdrawalMenuEnabledRaw) !== 'false';
  var ppWithdrawalBadgeEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_BADGE_ENABLED'];
  var ppWithdrawalBadgeEnabled = ppWithdrawalBadgeEnabledRaw === undefined || ppWithdrawalBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled : String(ppWithdrawalBadgeEnabledRaw) !== 'false';
  var ppWithdrawalBadgeLabel = String(map['PUBLIC_PORTAL_WITHDRAWAL_BADGE_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeLabel;
  var ppWithdrawalTitleEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_TITLE_ENABLED'];
  var ppWithdrawalTitleEnabled = ppWithdrawalTitleEnabledRaw === undefined || ppWithdrawalTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled : String(ppWithdrawalTitleEnabledRaw) !== 'false';
  var ppWithdrawalTitle = String(map['PUBLIC_PORTAL_WITHDRAWAL_TITLE'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalTitle;
  var ppWithdrawalDescriptionEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION_ENABLED'];
  var ppWithdrawalDescriptionEnabled = ppWithdrawalDescriptionEnabledRaw === undefined || ppWithdrawalDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled : String(ppWithdrawalDescriptionEnabledRaw) !== 'false';
  var ppWithdrawalDescription = String(map['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalDescription;
  var ppWithdrawalCtaLabel = String(map['PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL'] || '') || PUBLIC_PORTAL_DEFAULTS.withdrawalCtaLabel;
  return JSON.stringify({
    success: true,
    data: {
      trainingMenuEnabled: publicPortalTrainingMenuEnabled,
      membershipMenuEnabled: publicPortalMembershipMenuEnabled,
      heroBadgeEnabled: publicPortalHeroBadgeEnabled,
      heroBadgeLabel: publicPortalHeroBadgeLabel,
      heroTitle: publicPortalHeroTitle,
      heroDescriptionEnabled: publicPortalHeroDescriptionEnabled,
      heroDescription: publicPortalHeroDescription,
      membershipBadgeEnabled: publicPortalMembershipBadgeEnabled,
      membershipBadgeLabel: publicPortalMembershipBadgeLabel,
      membershipTitleEnabled: publicPortalMembershipTitleEnabled,
      membershipTitle: publicPortalMembershipTitle,
      membershipDescriptionEnabled: publicPortalMembershipDescriptionEnabled,
      membershipDescription: publicPortalMembershipDescription,
      membershipCtaLabel: publicPortalMembershipCtaLabel,
      completionGuidanceVisible: publicPortalCompletionGuidanceVisible,
      completionGuidanceBodyWhenCredentialSent: publicPortalCompletionGuidanceBodyWhenCredentialSent,
      completionGuidanceBodyWhenCredentialNotSent: publicPortalCompletionGuidanceBodyWhenCredentialNotSent,
      completionLoginInfoBlockVisible: publicPortalCompletionLoginInfoBlockVisible,
      completionLoginInfoVisible: publicPortalCompletionLoginInfoVisible,
      completionLoginInfoBodyWhenCredentialSent: publicPortalCompletionLoginInfoBodyWhenCredentialSent,
      completionLoginInfoBodyWhenCredentialNotSent: publicPortalCompletionLoginInfoBodyWhenCredentialNotSent,
      completionNoCredentialNotice: publicPortalCompletionNoCredentialNotice,
      completionCredentialNotice: publicPortalCompletionCredentialNotice,
      credentialEmailEnabled: credentialEmailEnabled,
      trainingBadgeEnabled: ppTrainingBadgeEnabled,
      trainingBadgeLabel: ppTrainingBadgeLabel,
      trainingTitleEnabled: ppTrainingTitleEnabled,
      trainingTitle: ppTrainingTitle,
      trainingDescriptionEnabled: ppTrainingDescriptionEnabled,
      trainingDescription: ppTrainingDescription,
      trainingCtaLabel: ppTrainingCtaLabel,
      memberUpdateMenuEnabled: ppMemberUpdateMenuEnabled,
      memberUpdateBadgeEnabled: ppMemberUpdateBadgeEnabled,
      memberUpdateBadgeLabel: ppMemberUpdateBadgeLabel,
      memberUpdateTitleEnabled: ppMemberUpdateTitleEnabled,
      memberUpdateTitle: ppMemberUpdateTitle,
      memberUpdateDescriptionEnabled: ppMemberUpdateDescriptionEnabled,
      memberUpdateDescription: ppMemberUpdateDescription,
      memberUpdateCtaLabel: ppMemberUpdateCtaLabel,
      withdrawalMenuEnabled: ppWithdrawalMenuEnabled,
      withdrawalBadgeEnabled: ppWithdrawalBadgeEnabled,
      withdrawalBadgeLabel: ppWithdrawalBadgeLabel,
      withdrawalTitleEnabled: ppWithdrawalTitleEnabled,
      withdrawalTitle: ppWithdrawalTitle,
      withdrawalDescriptionEnabled: ppWithdrawalDescriptionEnabled,
      withdrawalDescription: ppWithdrawalDescription,
      withdrawalCtaLabel: ppWithdrawalCtaLabel,
    }
  });
}

// v272: Google Drive ファイルのサムネイルを base64 data URL で返す。
// X-Frame-Options により iframe 埋め込みが Chrome でブロックされるため、
// サムネイルを GAS 経由で img タグ表示に切り替える。
function getFileThumbnail_(payload) {
  var fileUrl = String(payload.fileUrl || '').trim();
  if (!fileUrl) return { thumbnail: null };

  var match = fileUrl.match(/\/file\/d\/([^/?]+)/);
  if (!match) return { thumbnail: null };
  var fileId = match[1];

  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getThumbnail();
    if (!blob) return { thumbnail: null };
    var base64 = Utilities.base64Encode(blob.getBytes());
    var mimeType = blob.getContentType() || 'image/png';
    return { thumbnail: 'data:' + mimeType + ';base64,' + base64 };
  } catch (e) {
    Logger.log('getFileThumbnail_ error: ' + e.message);
    return { thumbnail: null };
  }
}

function getPublicTrainings_() {
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheet = db.getSheetByName('T_研修');
  var rows = getSheetData_(sheet);
  var result = rows.filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && computeTrainingAvailability_(r).isApplicationOpen;
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
      thumbnailUrl: String(r['案内状サムネイルURL'] || ''),
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

    var availability = computeTrainingAvailability_(training);
    if (!availability.isApplicationOpen) {
      return JSON.stringify({ success: false, error: availability.applicationStatusReason || '申込受付期間外です' });
    }

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

// 後方互換: submitPublicMemberUpdate_ で参照される旧名称
var PUBLIC_MEMBER_UPDATE_ALLOWLIST_ = PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_;

function normalizeCmNumberForKey_(cm) {
  return String(cm || '').trim().replace(/\s/g, '');
}

function generatePublicActionToken_() {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(Date.now()) + String(Math.random()) + String(Math.random())
  );
  return bytes.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('').slice(0, 32);
}

function generateOtp_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// CM番号で個人会員を検索し OTP をメール送信する。
// セキュリティ: CM番号の有無を応答で露出しない（列挙防止）。
function sendPublicOtp_(payload) {
  var cmNumber = normalizeCmNumberForKey_(payload.cmNumber);
  var purpose = String(payload.purpose || '').trim();

  if (!/^\d{8}$/.test(cmNumber)) {
    return { sent: false, error: 'CM番号の形式が正しくありません（8桁の数字）' };
  }
  if (purpose !== 'update' && purpose !== 'withdrawal') {
    return { sent: false, error: 'invalid_purpose' };
  }

  var cache = CacheService.getScriptCache();
  var rateLimitKey = 'pub_otp_rl_' + cmNumber;
  var rateLimitRaw = cache.get(rateLimitKey);
  var rateLimit = rateLimitRaw ? JSON.parse(rateLimitRaw) : { count: 0 };
  if (rateLimit.count >= 5) {
    // レート制限超過でも同じ応答（列挙防止）
    return { sent: true };
  }

  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員種別コード'] || '') === 'INDIVIDUAL' &&
           String(r['会員状態コード'] || '') !== 'WITHDRAWN' &&
           normalizeCmNumberForKey_(r['介護支援専門員番号']) === cmNumber;
  });

  rateLimit.count++;
  cache.put(rateLimitKey, JSON.stringify(rateLimit), 900);

  // 0件・複数件は列挙防止のため同じ応答を返す（メールは送信しない）
  if (memberRows.length !== 1) {
    return { sent: true };
  }

  var member = memberRows[0];
  var email = String(member['代表メールアドレス'] || '').trim();
  var memberId = String(member['会員ID'] || '');
  var memberName = (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim();

  if (!email) {
    return { sent: true };
  }

  var otp = generateOtp_();
  var otpKey = 'pub_otp_' + purpose + '_' + cmNumber;
  cache.put(otpKey, JSON.stringify({ otp: otp, memberId: memberId, attempts: 0 }), 600);

  var purposeLabel = purpose === 'withdrawal' ? '退会申請' : '会員情報変更';
  MailApp.sendEmail(
    email,
    '【枚方市介護支援専門員連絡協議会】' + purposeLabel + ' 確認コード',
    [
      memberName + ' 様',
      '',
      purposeLabel + 'の認証コードをお送りします。',
      '',
      '認証コード: ' + otp,
      '',
      'このコードは10分間有効です。',
      'お心当たりのない場合は事務局までご連絡ください。',
      '',
      '枚方市介護支援専門員連絡協議会',
    ].join('\n')
  );

  return { sent: true };
}

// OTP を検証し、成功時に単一使用アクショントークンを発行する。
function verifyPublicOtp_(payload) {
  var cmNumber = normalizeCmNumberForKey_(payload.cmNumber);
  var otp = String(payload.otp || '').trim();
  var purpose = String(payload.purpose || '').trim();

  if (!/^\d{8}$/.test(cmNumber) || !/^\d{6}$/.test(otp) ||
      (purpose !== 'update' && purpose !== 'withdrawal')) {
    return { success: false, error: 'invalid_input' };
  }

  var cache = CacheService.getScriptCache();
  var otpKey = 'pub_otp_' + purpose + '_' + cmNumber;
  var otpRaw = cache.get(otpKey);

  if (!otpRaw) {
    return { success: false, error: 'otp_expired' };
  }

  var stored = JSON.parse(otpRaw);

  if (stored.attempts >= 5) {
    cache.remove(otpKey);
    return { success: false, error: 'too_many_attempts' };
  }

  if (stored.otp !== otp) {
    stored.attempts++;
    cache.put(otpKey, JSON.stringify(stored), 600);
    var remaining = 5 - stored.attempts;
    return { success: false, error: 'invalid_otp', remaining: remaining };
  }

  var token = generatePublicActionToken_();
  cache.put('pub_tok_' + purpose + '_' + token, JSON.stringify({ memberId: stored.memberId }), 1800);
  cache.remove(otpKey);

  return { success: true, token: token };
}

// アクショントークンを検証し、許可フィールドのみ会員情報を更新する。
function submitPublicMemberUpdate_(payload) {
  var token = String(payload.token || '').trim();
  var fields = payload.fields || {};

  if (!token) return { success: false, error: 'invalid_token' };

  var cache = CacheService.getScriptCache();
  var tokenKey = 'pub_tok_update_' + token;
  var tokenRaw = cache.get(tokenKey);
  if (!tokenRaw) return { success: false, error: 'token_expired' };

  var stored = JSON.parse(tokenRaw);
  var memberId = stored.memberId;

  // allowlist フィルタ
  var updatePayload = { id: memberId };
  for (var i = 0; i < PUBLIC_MEMBER_UPDATE_ALLOWLIST_.length; i++) {
    var key = PUBLIC_MEMBER_UPDATE_ALLOWLIST_[i];
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      updatePayload[key] = fields[key];
    }
  }

  if (Object.keys(updatePayload).length <= 1) {
    return { success: false, error: '変更するフィールドが指定されていません' };
  }

  updateMember_(updatePayload, { skipAdminCheck: true });
  cache.remove(tokenKey);

  var ss = getOrCreateDatabase_();
  var memberSheet = ss.getSheetByName('T_会員');
  var found = memberSheet ? findRowByColumnValue_(memberSheet, '会員ID', memberId) : null;
  if (found) {
    var mRow = found.row;
    var mCols = found.columns;
    var toEmail = String(mRow[mCols['代表メールアドレス']] || '').trim();
    var memberName2 = (String(mRow[mCols['姓']] || '') + ' ' + String(mRow[mCols['名']] || '')).trim();
    if (toEmail) {
      MailApp.sendEmail(
        toEmail,
        '【枚方市介護支援専門員連絡協議会】会員登録情報変更のご確認',
        [
          memberName2 + ' 様',
          '',
          '会員登録情報の変更を受け付けました。',
          '内容にお心当たりのない場合は事務局までご連絡ください。',
          '',
          '枚方市介護支援専門員連絡協議会',
        ].join('\n')
      );
    }
  }

  return { success: true };
}

// アクショントークンを検証し、年度末退会申請を登録する。
function submitPublicWithdrawalRequest_(payload) {
  var token = String(payload.token || '').trim();

  if (!token) return { success: false, error: 'invalid_token' };

  var cache = CacheService.getScriptCache();
  var tokenKey = 'pub_tok_withdrawal_' + token;
  var tokenRaw = cache.get(tokenKey);
  if (!tokenRaw) return { success: false, error: 'token_expired' };

  var stored = JSON.parse(tokenRaw);
  var memberId = stored.memberId;

  var ss = getOrCreateDatabase_();
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');

  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', memberId);
  if (!memberFound) throw new Error('対象会員が見つかりません。');

  var mCols = memberFound.columns;
  var mRow = memberFound.row.slice();
  var currentStatus = String(mRow[mCols['会員状態コード']] || 'ACTIVE');

  if (currentStatus === 'WITHDRAWN') throw new Error('この会員は既に退会済みです。');
  if (currentStatus === 'WITHDRAWAL_SCHEDULED') throw new Error('既に退会申請済みです。');

  var now = new Date();
  var jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  var month = jstNow.getMonth() + 1;
  var fiscalYearEndYear = month >= 4 ? jstNow.getFullYear() + 1 : jstNow.getFullYear();
  var withdrawnDate = fiscalYearEndYear + '-03-31';

  mRow[mCols['会員状態コード']] = 'WITHDRAWAL_SCHEDULED';
  mRow[mCols['退会日']] = withdrawnDate;
  mRow[mCols['更新日時']] = new Date().toISOString();
  memberSheet.getRange(memberFound.rowNumber, 1, 1, mRow.length).setValues([mRow]);

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  cache.remove(tokenKey);

  var toEmail = String(mRow[mCols['代表メールアドレス']] || '').trim();
  var memberName3 = (String(mRow[mCols['姓']] || '') + ' ' + String(mRow[mCols['名']] || '')).trim();
  if (toEmail) {
    MailApp.sendEmail(
      toEmail,
      '【枚方市介護支援専門員連絡協議会】退会申請受付のご確認',
      [
        memberName3 + ' 様',
        '',
        '退会申請を受け付けました。',
        '',
        '退会予定日: ' + withdrawnDate + '（年度末）',
        '',
        '退会予定日までは引き続き会員マイページにログインできます。',
        '退会を撤回される場合は、会員マイページよりお手続きください。',
        'お心当たりのない場合は事務局までご連絡ください。',
        '',
        '枚方市介護支援専門員連絡協議会',
      ].join('\n')
    );
  }

  return { success: true, withdrawnDate: withdrawnDate };
}

// ── v261: OTP なし照合フロー（個人: CM番号 / 事業所: 事業所番号）──────────────

// CM番号または事業所番号でメンバーを検索し、アクショントークンを発行する。
// token は pub_tok_update_<token> に memberType を含めて保存（30分・多用途）。
function lookupMemberForPublicUpdate_(payload) {
  var idNumber = normalizeCmNumberForKey_(payload.idNumber);
  var memberType = String(payload.memberType || '').trim();

  if (memberType !== 'INDIVIDUAL' && memberType !== 'BUSINESS') {
    return { found: false, error: 'invalid_member_type' };
  }

  var validFormat = memberType === 'INDIVIDUAL'
    ? /^\d{8}$/.test(idNumber)
    : /^[A-Za-z0-9]{10}$/.test(idNumber);
  if (!validFormat) {
    return { found: false, error: memberType === 'INDIVIDUAL'
      ? 'CM番号は8桁の数字で入力してください'
      : '事業所番号は半角英数字10文字で入力してください' };
  }

  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (String(r['会員状態コード'] || '') === 'WITHDRAWN') return false;
    if (String(r['会員種別コード'] || '') !== memberType) return false;
    var key = memberType === 'INDIVIDUAL'
      ? normalizeCmNumberForKey_(r['介護支援専門員番号'])
      : normalizeCmNumberForKey_(r['事業所番号']);
    return key === idNumber;
  });

  if (memberRows.length === 0) {
    return { found: false, error: memberType === 'INDIVIDUAL'
      ? '介護支援専門員番号が見つかりません'
      : '事業所番号が見つかりません' };
  }
  if (memberRows.length > 1) {
    return { found: false, error: '整合性エラーが発生しています。事務局にお問い合わせください。' };
  }

  var member = memberRows[0];
  var memberId = String(member['会員ID'] || '');
  var token = generatePublicActionToken_();
  CacheService.getScriptCache().put(
    'pub_tok_update_' + token,
    JSON.stringify({ memberId: memberId, memberType: memberType }),
    1800
  );

  return { found: true, token: token };
}

// 事業所会員の基本情報変更 + スタッフ追加/除籍をまとめて処理する。
// token は削除せず TTL 内で多用途使用を許容。
function submitPublicBusinessUpdate_(payload) {
  var token = String(payload.token || '').trim();
  if (!token) return { success: false, error: 'invalid_token' };

  var cache = CacheService.getScriptCache();
  var tokenRaw = cache.get('pub_tok_update_' + token);
  if (!tokenRaw) return { success: false, error: 'token_expired' };

  var stored = JSON.parse(tokenRaw);
  if (stored.memberType !== 'BUSINESS') return { success: false, error: '事業所会員専用の操作です' };
  var memberId = stored.memberId;

  var results = {};

  // 1. 基本情報変更
  if (payload.fields && Object.keys(payload.fields).length > 0) {
    var updatePayload = { id: memberId };
    for (var i = 0; i < PUBLIC_BUSINESS_UPDATE_ALLOWLIST_.length; i++) {
      var fk = PUBLIC_BUSINESS_UPDATE_ALLOWLIST_[i];
      if (Object.prototype.hasOwnProperty.call(payload.fields, fk)) {
        updatePayload[fk] = payload.fields[fk];
      }
    }
    if (Object.keys(updatePayload).length > 1) {
      updateMember_(updatePayload, { skipAdminCheck: true });
      results.basicUpdated = true;
    }
  }

  // 2. スタッフ追加
  if (payload.addStaff) {
    var addResult = addPublicStaffMember_({ token: token, staffData: payload.addStaff });
    results.staffAdded = addResult.success;
    if (!addResult.success) return { success: false, error: addResult.error };
  }

  // 3. スタッフ除籍
  if (payload.removeCmNumber) {
    var removeResult = removePublicStaffByCmNumber_({ token: token, cmNumber: payload.removeCmNumber });
    results.staffRemoved = removeResult.success;
    if (!removeResult.success) return { success: false, error: removeResult.error };
  }

  // 通知メール
  var ss2 = getOrCreateDatabase_();
  var memberSheet2 = ss2.getSheetByName('T_会員');
  if (memberSheet2) {
    var found2 = findRowByColumnValue_(memberSheet2, '会員ID', memberId);
    if (found2) {
      var emailTo = String(found2.row[found2.columns['代表メールアドレス']] || '').trim();
      if (emailTo) {
        MailApp.sendEmail(emailTo,
          '【枚方市介護支援専門員連絡協議会】事業所登録情報変更のご確認',
          ['事務局担当者 様', '', '事業所登録情報の変更を受け付けました。',
           'お心当たりのない場合は事務局までご連絡ください。', '',
           '枚方市介護支援専門員連絡協議会'].join('\n'));
      }
    }
  }

  return { success: true, results: results };
}

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
function removePublicStaffByCmNumber_(payload) {
  var token = String(payload.token || '').trim();
  if (!token) return { success: false, error: 'invalid_token' };

  var cache = CacheService.getScriptCache();
  var tokenRaw = cache.get('pub_tok_update_' + token);
  if (!tokenRaw) return { success: false, error: 'token_expired' };

  var stored = JSON.parse(tokenRaw);
  if (stored.memberType !== 'BUSINESS') return { success: false, error: '事業所会員専用の操作です' };
  var memberId = stored.memberId;

  var targetCm = normalizeCmNumberForKey_(payload.cmNumber);
  if (!/^\d{8}$/.test(targetCm)) return { success: false, error: 'CM番号は8桁の数字で入力してください' };

  var ss = getOrCreateDatabase_();
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員ID'] || '') === memberId &&
           String(r['職員状態コード'] || '') === 'ENROLLED' &&
           normalizeCmNumberForKey_(r['介護支援専門員番号']) === targetCm;
  });

  if (staffRows.length === 0) {
    return { success: false, error: '対象の職員が見つかりません（CM番号を確認してください）' };
  }
  if (staffRows.length > 1) {
    return { success: false, error: '同一CM番号の在籍職員が複数見つかりました。事務局にお問い合わせください。' };
  }

  var targetStaff = staffRows[0];
  var staffId = String(targetStaff['職員ID'] || '');

  if (String(targetStaff['職員権限コード'] || '') === 'REPRESENTATIVE') {
    return { success: false, error: '代表者は除籍できません。先に会員マイページで代表者を変更してください。' };
  }

  // removeStaffFromOffice_ を内部的に利用
  removeStaffFromOffice_({ memberId: memberId, staffId: staffId });

  return { success: true, staffId: staffId };
}

// ── v260 公開ポータル OTP 認証フロー ここまで ────────────────────────────────

// ── v264: OTPなし本人確認フロー + 変更申請キュー ─────────────────────────────

// ステートレストークン（HMAC-SHA256署名）: CacheService非依存。
// キーは Script Properties の PUBLIC_TOKEN_SECRET（未設定時はフォールバック値）。
function createPublicIdentityToken_(data, ttlSeconds) {
  var secret = PropertiesService.getScriptProperties().getProperty('PUBLIC_TOKEN_SECRET') || 'hcmn_member_system_v264_fallback';
  var payload = JSON.stringify({ d: data, exp: Date.now() + ttlSeconds * 1000 });
  var encoded = Utilities.base64EncodeWebSafe(payload);
  var sigBytes = Utilities.computeHmacSha256Signature(encoded, secret);
  var sig = Utilities.base64EncodeWebSafe(sigBytes);
  return encoded + '.' + sig;
}

function verifyPublicIdentityToken_(token) {
  try {
    var parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    var encoded = parts[0];
    var sig = parts[1];
    var secret = PropertiesService.getScriptProperties().getProperty('PUBLIC_TOKEN_SECRET') || 'hcmn_member_system_v264_fallback';
    var expectedSigBytes = Utilities.computeHmacSha256Signature(encoded, secret);
    var expectedSig = Utilities.base64EncodeWebSafe(expectedSigBytes);
    if (sig !== expectedSig) return null;
    var decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(encoded)).getDataAsString();
    var obj = JSON.parse(decoded);
    if (!obj.exp || obj.exp < Date.now()) return null;
    return obj.d;
  } catch (e) {
    return null;
  }
}

// 本人確認（OTP不要）: 入力情報でDB照合し、成功時にアクショントークンを発行。
// 列挙防止: 照合失敗・未存在ともに同一エラーを返す。
// contactEmail はDB照合に使わず、確認メール送信先として保存する。
function verifyMemberIdentityForPublic_(payload) {
  var memberType = String(payload.memberType || '').trim();
  var purpose = String(payload.purpose || '').trim();
  var contactEmail = String(payload.contactEmail || '').trim();

  if (memberType !== 'INDIVIDUAL' && memberType !== 'BUSINESS') {
    return { verified: false, error: 'invalid_member_type' };
  }
  if (purpose !== 'update' && purpose !== 'withdrawal') {
    return { verified: false, error: 'invalid_purpose' };
  }
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { verified: false, error: '有効なメールアドレスを入力してください' };
  }

  var cache = CacheService.getScriptCache();
  var idKey = memberType === 'INDIVIDUAL'
    ? normalizeCmNumberForKey_(payload.cmNumber)
    : normalizeCmNumberForKey_(payload.officeNumber);

  // レート制限（同一ID 15分以内5回まで）
  var rlKey = 'pub_id_rl_' + memberType + '_' + idKey;
  var rlRaw = cache.get(rlKey);
  var rl = rlRaw ? JSON.parse(rlRaw) : { count: 0 };
  if (rl.count >= 5) {
    return { verified: false, error: '試行回数が上限を超えました。しばらくお待ちください。' };
  }
  rl.count++;
  cache.put(rlKey, JSON.stringify(rl), 900);

  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (String(r['会員状態コード'] || '') === 'WITHDRAWN') return false;
    if (String(r['会員種別コード'] || '') !== memberType) return false;
    if (memberType === 'INDIVIDUAL') {
      return normalizeCmNumberForKey_(r['介護支援専門員番号']) === idKey;
    }
    return normalizeCmNumberForKey_(r['事業所番号']) === idKey;
  });

  if (memberRows.length !== 1) {
    return { verified: false, error: '入力内容と一致する会員情報が見つかりませんでした。' };
  }
  var member = memberRows[0];

  // 個人会員: 姓・名も照合
  if (memberType === 'INDIVIDUAL') {
    var dbLast = String(member['姓'] || '').trim();
    var dbFirst = String(member['名'] || '').trim();
    var inLast = String(payload.lastName || '').trim();
    var inFirst = String(payload.firstName || '').trim();
    if (!inLast || !inFirst || dbLast !== inLast || dbFirst !== inFirst) {
      return { verified: false, error: '入力内容と一致する会員情報が見つかりませんでした。' };
    }
  }

  var memberId = String(member['会員ID'] || '');
  var applicantName = memberType === 'INDIVIDUAL'
    ? (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim()
    : String(member['勤務先名'] || '');

  // ステートレストークン（HMAC署名、CacheService非依存）
  var token = createPublicIdentityToken_(
    { memberId: memberId, memberType: memberType, contactEmail: contactEmail, applicantName: applicantName, purpose: purpose },
    1800
  );

  return { verified: true, token: token };
}

// 事業所会員の追加可能スタッフ数を返す。メンバーデータは漏らさない。
function getPublicAvailableStaffSlots_(payload) {
  var token = String(payload.token || '').trim();
  var stored = verifyPublicIdentityToken_(token);
  if (!stored) return { error: 'token_expired' };
  if (stored.memberType !== 'BUSINESS') return { error: '事業所会員専用の操作です' };

  var ss = getOrCreateDatabase_();
  var memberSheet = ss.getSheetByName('T_会員');
  var found = memberSheet ? findRowByColumnValue_(memberSheet, '会員ID', stored.memberId) : null;
  var staffLimit = found ? (Number(found.row[found.columns['職員数上限']]) || 10) : 10;

  var currentCount = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員ID'] || '') === stored.memberId &&
           String(r['職員状態コード'] || '') === 'ENROLLED';
  }).length;

  return { availableSlots: Math.max(0, staffLimit - currentCount), staffLimit: staffLimit, currentCount: currentCount };
}

// 変更申請をT_変更申請に書き込む。DBは変更しない。管理者承認後に適用される。
function submitPublicChangeRequest_(payload) {
  var token = String(payload.token || '').trim();
  var stored = verifyPublicIdentityToken_(token);
  if (!stored) return { success: false, error: 'token_expired' };

  var requestType = String(payload.requestType || '').trim();
  var validTypes = ['MEMBER_UPDATE', 'WITHDRAWAL', 'STAFF_ADD', 'STAFF_REMOVE'];
  if (validTypes.indexOf(requestType) === -1) {
    return { success: false, error: 'invalid_request_type' };
  }

  // 変更内容のallowlistフィルタ
  var allowlist = stored.memberType === 'INDIVIDUAL'
    ? PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_
    : PUBLIC_BUSINESS_UPDATE_ALLOWLIST_;

  var sanitizedFields = {};
  if (payload.fields && typeof payload.fields === 'object') {
    for (var i = 0; i < allowlist.length; i++) {
      var fk = allowlist[i];
      if (Object.prototype.hasOwnProperty.call(payload.fields, fk)) {
        sanitizedFields[fk] = String(payload.fields[fk] || '').trim();
      }
    }
  }

  var changeData = {
    fields: sanitizedFields,
    staffAdd: [],
    staffRemove: [],
  };

  // 事業所会員: スタッフ追加（必須フィールド検証）
  if (Array.isArray(payload.staffAdd)) {
    payload.staffAdd.forEach(function(s) {
      var lastName = String(s.lastName || '').trim();
      var firstName = String(s.firstName || '').trim();
      var lastKana = String(s.lastKana || '').trim();
      var firstKana = String(s.firstKana || '').trim();
      var careManagerNumber = normalizeCmNumberForKey_(s.careManagerNumber);
      var email = String(s.email || '').trim();
      if (!lastName || !firstName || !lastKana || !firstKana || !/^\d{8}$/.test(careManagerNumber) || !email) {
        return;
      }
      changeData.staffAdd.push({ lastName: lastName, firstName: firstName, lastKana: lastKana, firstKana: firstKana, careManagerNumber: careManagerNumber, email: email });
    });
  }

  // 事業所会員: スタッフ除籍（姓・名・CM番号で照合）
  if (Array.isArray(payload.staffRemove)) {
    payload.staffRemove.forEach(function(s) {
      var lastName = String(s.lastName || '').trim();
      var firstName = String(s.firstName || '').trim();
      var careManagerNumber = normalizeCmNumberForKey_(s.careManagerNumber);
      if (!lastName || !firstName || !/^\d{8}$/.test(careManagerNumber)) return;
      changeData.staffRemove.push({ lastName: lastName, firstName: firstName, careManagerNumber: careManagerNumber });
    });
  }

  var requestId = 'CR' + Date.now() + '_' + generatePublicActionToken_().slice(0, 8);
  var now = new Date().toISOString();

  var ss = getOrCreateDatabase_();
  // T_変更申請 が未作成の場合は自動作成（初回 push 後のスキーマ未反映を吸収）
  if (!ss.getSheetByName('T_変更申請')) {
    var newSheet = getOrCreateSheet_(ss, 'T_変更申請');
    writeSheetHeaders_(newSheet, テーブル定義['T_変更申請']);
  }
  appendRowsByHeaders_(ss, 'T_変更申請', [{
    申請ID: requestId,
    会員ID: stored.memberId,
    会員種別コード: stored.memberType,
    申請種別コード: requestType,
    申請状態コード: 'PENDING',
    申請内容JSON: JSON.stringify(changeData),
    連絡先メールアドレス: stored.contactEmail,
    申請者表示名: stored.applicantName,
    申請日時: now,
    処理日時: '',
    処理者メールアドレス: '',
    処理備考: '',
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  }]);

  // 申請者への確認メール
  var typeLabel = { MEMBER_UPDATE: '登録情報変更申請', WITHDRAWAL: '退会申請', STAFF_ADD: '職員追加申請', STAFF_REMOVE: '職員除籍申請' };
  MailApp.sendEmail(
    stored.contactEmail,
    '【枚方市介護支援専門員連絡協議会】' + (typeLabel[requestType] || '変更申請') + 'を受け付けました',
    [
      stored.applicantName + ' 様',
      '',
      '以下の申請を受け付けました。担当者が内容を確認後、ご連絡いたします。',
      '',
      '申請ID: ' + requestId,
      '申請種別: ' + (typeLabel[requestType] || requestType),
      '受付日時: ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
      '',
      '内容の確認・ご不明な点は事務局までお問い合わせください。',
      '',
      '枚方市介護支援専門員連絡協議会',
    ].join('\n')
  );

  return { success: true, requestId: requestId };
}

// ── 管理者: 変更申請一覧取得 ──────────────────────────────────────────────────

// ── 管理者: 変更申請を承認し変更を適用 ─────────────────────────────────────────

// ── 管理者: 変更申請を却下 ──────────────────────────────────────────────────

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

/**
 * 宛名リスト シート書き込みヘルパー
 * ヘッダー行を太字で書き込み、データ行を追加し、列幅を自動調整する。
 */

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

/**
 * メール送信ログ取得。
 * 閲覧権限は T_システム設定.EMAIL_LOG_VIEWER_ROLE で動的チェック。
 * 設定値: 'MASTER' または 'MASTER,ADMIN' のどちらか。
 */

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

/**
 * v205: 全チャンクの部分 ZIP を統合して最終 ZIP を生成。
 * payload: { folderId, year }
 */

/**
 * v205: エラー・中断時の一時フォルダクリーンアップ。
 * payload: { folderId }
 */










/**
 * 名簿テンプレートのサンプルスプレッドシートを作成する。
 * - 実運用に流用できるよう、_DATA のサンプルデータと表示シートの参照数式をあらかじめ設定する。
 * - 作成後に返す spreadsheetId を T_システム設定.ROSTER_TEMPLATE_SS_ID に登録すれば、
 *   そのまま名簿出力テンプレートとして利用できる。
 */









// 2026-04-11: metadata 優先・prefix 後方互換のテンプレート解決と、
// 名簿/催促状同居テンプレート例を後方互換を壊さず上書き定義する。





























/**
 * ログSSのスキーマを再構築する（既存ログSSのシートが壊れた場合など）。
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
