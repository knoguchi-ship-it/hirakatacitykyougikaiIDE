var DB_SPREADSHEET_ID_KEY = 'DB_SPREADSHEET_ID';
var DB_SPREADSHEET_NAME = '枚方市ケアマネ協議会_DB';
// AGENTS §3 ハードコーディング原則: 環境識別子は Script Properties の
// DB_SPREADSHEET_ID_OVERRIDE で上書き可能とし、未設定時のみ現行本番の既定値を使う
// （環境切替・DB 移行時にコード改変不要）。IIFE 直書きなのは build pruner の
// 到達性解析に依存しないための意図（feedback_build_pruning_bug）。
var DB_SPREADSHEET_ID_FIXED = (function() {
  try {
    var v = PropertiesService.getScriptProperties().getProperty('DB_SPREADSHEET_ID_OVERRIDE');
    if (v) return v;
  } catch (e) {}
  return '1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs';
})();
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
var LOCK_WAIT_TIMEOUT_MS = 10000; // AGENTS §3: LockService 待機の共通タイムアウト
var ALL_DATA_CACHE_TTL_SECONDS = 600;
var ANNUAL_FEE_CACHE_TTL_SECONDS = 600;
var DB_SCHEMA_VERSION = '2026-09-04-login-lockout-v376.71';

// v251: 会員専用 split プロジェクト URL を正本とする（scriptId ベースルーティング移行）
// AGENTS §3: Script Properties の MEMBER_PORTAL_URL_OVERRIDE で上書き可能（deployment 変更時にコード改変不要）
var MEMBER_PORTAL_URL = (function() {
  try {
    var v = PropertiesService.getScriptProperties().getProperty('MEMBER_PORTAL_URL_OVERRIDE');
    if (v) return v;
  } catch (e) {}
  return 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
})();
var CREDENTIAL_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】会員登録完了のお知らせ';
var CREDENTIAL_EMAIL_DEFAULT_BODY = '{{氏名}} 様\n\n会員登録が完了しました。\n以下のログイン情報で会員マイページにアクセスできます。\n\nログインID: {{ログインID}}\n初期パスワード: {{パスワード}}\n\n会員マイページURL:\n{{会員マイページURL}}\n\n初回ログイン後、パスワードの変更をお勧めします。\n\n※このメールに心当たりがない場合は、お手数ですが削除してください。\n─────────────────────────────\n枚方市介護支援専門員連絡協議会\n';

// v368: 申込受付メール（公開ポータルから申請送信時に送る短い受付確認メール）
var APPLICATION_RECEIPT_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}を受け付けました';
var APPLICATION_RECEIPT_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '以下の申請を受け付けました。担当者が内容を確認後、ご連絡いたします。',
  '',
  '申請ID: {{申請ID}}',
  '申請種別: {{申請種別}}',
  '受付日時: {{受付日時}}',
  '',
  '内容の確認・ご不明な点は事務局までお問い合わせください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v368: 承認通知メール（管理者が承認した際に申請者へ送る通知）
var APPROVAL_NOTIFICATION_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}が承認されました';
var APPROVAL_NOTIFICATION_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'お申し込みいただいた内容が承認され、変更が反映されました。',
  '',
  '申請ID: {{申請ID}}',
  '申請種別: {{申請種別}}',
  '処理日時: {{処理日時}}',
  '処理者: {{処理者名}}',
  '',
  '{{変更内容サマリー}}',
  '変更内容の確認は会員マイページをご覧ください。',
  'ご不明な点は事務局までお問い合わせください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v368: 却下通知メール
var REJECTION_NOTIFICATION_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}について';
var REJECTION_NOTIFICATION_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'お申し込みいただいた内容について、確認の結果、今回はお受けできない結果となりました。',
  '',
  '申請ID: {{申請ID}}',
  '申請種別: {{申請種別}}',
  '処理日時: {{処理日時}}',
  '',
  '理由・備考: {{処理備考}}',
  '',
  'ご不明な点は事務局までお問い合わせください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

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
// v376.43 (Phase B): 従来ハードコードだった6メールの差し込みタグ付きデフォルト。
// 送信実体は renderConfiguredMail_ で <CAT>_SUBJECT/BODY 設定値（無ければ下記既定）を読み、差し込み置換する。
var TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT = '【研修申込確認】{{研修名}}';
var TRAINING_APPLY_RECEIPT_DEFAULT_BODY = [
  '{{申込者名}} 様',
  '',
  '以下の研修へお申込いただきありがとうございます。',
  '',
  '研修名: {{研修名}}',
  '開催日: {{開催日}}',
  '',
  '申込IDは以下の通りです。取消の際に必要ですので保管してください。',
  '申込ID: {{申込ID}}',
  '',
  '何かご不明な点は主催者までお問い合わせください。',
].join('\n');

var TRAINING_REMINDER_DEFAULT_SUBJECT = '【研修リマインド】{{研修名}}';
var TRAINING_REMINDER_DEFAULT_BODY = [
  '会員各位',
  '',
  '平素よりお世話になっております。',
  '枚方市介護支援専門員連絡協議会 事務局です。',
  '',
  'お申し込み済みの研修が近づいていますので、ご案内いたします。',
  '',
  '■研修名',
  '{{研修名}}',
  '',
  '■開催日',
  '{{開催日}}',
  '',
  '■会場',
  '{{会場}}',
  '',
  '当日の案内資料と詳細は、配布済みのご案内をご確認ください。',
  '',
  '何卒よろしくお願いいたします。',
  '',
  '枚方市介護支援専門員連絡協議会 事務局',
].join('\n');

var AUTH_OTP_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{用途}} 確認コード';
var AUTH_OTP_DEFAULT_BODY = [
  '{{会員名}} 様',
  '',
  '{{用途}}の認証コードをお送りします。',
  '',
  '認証コード: {{認証コード}}',
  '',
  'このコードは{{有効期限}}有効です。',
  'お心当たりのない場合は事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// 会員情報変更確認メール（個人会員が公開ポータルで自身の登録情報を変更した際の確認）。
// ※事業所登録情報変更・職員追加/除籍に伴う内部通知は別文面（固定）で送られる別サブケース。
var MEMBER_UPDATE_CONFIRM_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】会員登録情報変更のご確認';
var MEMBER_UPDATE_CONFIRM_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '会員登録情報の変更を受け付けました。',
  '内容にお心当たりのない場合は事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var WITHDRAWAL_CONFIRM_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】退会申請受付のご確認';
var WITHDRAWAL_CONFIRM_DEFAULT_BODY = [
  '{{会員名}} 様',
  '',
  '退会申請を受け付けました。',
  '',
  '退会予定日: {{退会予定日}}（年度末）',
  '',
  '退会予定日までは引き続き会員マイページにログインできます。',
  '退会を撤回される場合は、会員マイページよりお手続きください。',
  'お心当たりのない場合は事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var PASSWORD_RESET_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】パスワード再設定手続き';
var PASSWORD_RESET_DEFAULT_BODY = [
  '{{ユーザー名}} 様',
  '',
  '会員マイページのパスワード再設定を受け付けました。',
  '以下の確認コードを画面に入力し、新しいパスワードを設定してください。',
  '',
  '確認コード: {{確認コード}}',
  '有効期限: {{有効期限}}',
  '',
  'この手続きに心当たりがない場合は、このメールを破棄してください。',
  '確認コードを他の人に伝えないでください。',
  '',
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
  trainingBadgeLabel: '研修申込',
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
  // v295: 役員管理マスタ（CRUD 可能 — システム設定から管理）
  M_組織マスタ: ['組織コード', '組織名', '組織種別', '表示順', '全役員表示フラグ', '有効フラグ', '削除フラグ', '作成日時', '更新日時'],
  M_役職マスタ: ['役職コード', '役職名', '組織コード', '委員長フラグ', '表示順', '有効フラグ', '削除フラグ', '作成日時', '更新日時'],
  M_支払い種別マスタ: ['種別コード', '種別名', '対象区分', '表示順', '有効フラグ', '削除フラグ', '作成日時', '更新日時'],
  M_業務分類: ['業務分類コード', '業務分類名', '組織コード', '単価', '表示順', '有効フラグ', '削除フラグ', '作成日時', '更新日時'],
  // v360: 研修当日出欠状態マスタ
  M_出欠状態: ['コード', '名称', '表示順', '有効フラグ'],
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
    ['TRANSFERRED', '移行済み', 4, true],
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
  // v295: 役員管理マスタ初期値
  // ['組織コード','組織名','組織種別','表示順','全役員表示フラグ','有効フラグ','削除フラグ','作成日時','更新日時']
  M_組織マスタ: [
    ['HQ',          '本部',            '本部',  1, true,  true, false, '', ''],
    ['DIRECTORS',   '理事会',          '委員会', 2, true,  true, false, '', ''],
    ['AUDITORS',    '監事会',          '委員会', 3, false, true, false, '', ''],
    ['SECRETARIAT', '事務局',          '事務局', 4, true,  true, false, '', ''],
    ['REGIONAL',    '圏域委員会',      '委員会', 5, false, true, false, '', ''],
    ['PR',          '広報組織化委員会','委員会', 6, false, true, false, '', ''],
    ['TRAINING',    '研修委員会',      '委員会', 7, false, true, false, '', ''],
    ['RESEARCH',    '調査研究委員会',  '委員会', 8, false, true, false, '', ''],
  ],
  // ['役職コード','役職名','組織コード','委員長フラグ','表示順','有効フラグ','削除フラグ','作成日時','更新日時']
  M_役職マスタ: [
    ['CHAIRMAN',          '会長',             'HQ',          false,  1, true, false, '', ''],
    ['VICE_CHAIRMAN',     '副会長',           'HQ',          false,  2, true, false, '', ''],
    ['DIRECTOR',          '理事',             'DIRECTORS',   false,  3, true, false, '', ''],
    ['AUDITOR',           '監事',             'AUDITORS',    false,  4, true, false, '', ''],
    ['SECRETARY_GENERAL', '事務局長',         'SECRETARIAT', false,  5, true, false, '', ''],
    ['SECRETARY',         '事務局員',         'SECRETARIAT', false,  6, true, false, '', ''],
    ['REGIONAL_CHAIR',    '圏域委員長',       'REGIONAL',    true,   7, true, false, '', ''],
    ['REGIONAL_MEMBER',   '圏域委員',         'REGIONAL',    false,  8, true, false, '', ''],
    ['PR_CHAIR',          '広報組織化委員長', 'PR',          true,   9, true, false, '', ''],
    ['PR_MEMBER',         '広報組織会員',     'PR',          false, 10, true, false, '', ''],
    ['TRAINING_CHAIR',    '研修委員長',       'TRAINING',    true,  11, true, false, '', ''],
    ['TRAINING_MEMBER',   '研修委員',         'TRAINING',    false, 12, true, false, '', ''],
    ['RESEARCH_CHAIR',    '調査研究委員長',   'RESEARCH',    true,  13, true, false, '', ''],
    ['RESEARCH_MEMBER',   '調査研究委員',     'RESEARCH',    false, 14, true, false, '', ''],
  ],
  // ['種別コード','種別名','対象区分','表示順','有効フラグ','削除フラグ','作成日時','更新日時']
  M_支払い種別マスタ: [
    ['COMPENSATION', '役員報酬', '両方', 1, true, false, '', ''],
    ['ACTIVITY',     '活動費',   '両方', 2, true, false, '', ''],
    ['HONORARIUM',   '謝礼',     '両方', 3, true, false, '', ''],
    ['TRANSPORT',    '交通費',   '両方', 4, true, false, '', ''],
    ['SUPPLIES',     '消耗品費', '両方', 5, true, false, '', ''],
    ['OTHER',        'その他',   '両方', 6, true, false, '', ''],
  ],
  // ['業務分類コード','業務分類名','組織コード','単価','表示順','有効フラグ','削除フラグ','作成日時','更新日時']
  M_業務分類: [
    ['MEETING_ATTENDANCE', '会議出席', 'HQ', 0, 1, true, false, '', ''],
  ],
  // v360: 研修当日出欠状態
  M_出欠状態: [
    ['UNRECORDED', '未記録', 1, true],
    ['PRESENT', '出席', 2, true],
    ['ABSENT', '欠席', 3, true],
    ['LATE', '遅刻', 4, true],
    ['SAMEDAY_CANCEL', '当日キャンセル', 5, true],
  ],
};

var テーブル定義 = {
  T_会員: [
    '会員ID',
    '会員種別コード',
    '会員状態コード',
    '入会日',
    '退会日',
    '移行日',
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
    'ステータスメモ',
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
    'ロック解除予定日時',
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
    // docs/246 Phase 1-B: 新 RBAC 用ロールID 列（並行運用）。
    // 移行 APPLY 完了後はこちらが authoritative、権限コード は legacy 後方互換用として保持。
    'ロールID',
    '有効フラグ',
    '変更者メール',
    '変更日時',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  // docs/246 Phase 1-B: メニュー単位カスタムロールの永続化テーブル。
  // 値は scripts/menu-registry.mjs::INITIAL_ROLE_DEFINITIONS を seed として投入。
  T_権限ロール: [
    'ロールID',
    'ロール名',
    '説明',
    '許可メニューJSON',
    '研修編集スコープ',
    '組込フラグ',
    'マスターフラグ',
    '表示順',
    '作成日時',
    '更新日時',
    '削除フラグ',
  ],
  // v376.42: 全メール種別のテンプレート管理（名前付きスナップショット）を集約する単一テーブル。
  // ※このリテラル内コメントに関数名（末尾アンダースコア識別子）を書かないこと。
  //   build pruner が public/member ビルドで unreachable 関数名をコメント誤マッチし、
  //   テーブル定義ごと削除する既知バグ（feedback_build_pruning_bug）の trigger になるため。
  // カテゴリ列で種別を区別し、汎用 CRUD で操作。旧 JSON 保存分はスキーマ初期化時に本テーブルへ移行。
  // runtime のメール本文は従来どおり T_システム設定を使用し、本テーブルは保存/読込専用。
  T_メールテンプレート: [
    'テンプレートID',
    'カテゴリ',
    '名前',
    '件名',
    '本文',
    '既定フラグ',
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
    // v376.30: 外部申込フォーム URL（Google フォーム等、任意項目）
    // 末尾追加: normalizeTableColumns_ + writeSheetHeaders_ name-based shift で既存データ保持
    '申込URL',
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
    // v360: 2-FK XOR 化 + 出欠管理（末尾追加・schema-shift guard 経由で安全に migrate）
    '外部申込者ID',
    '出欠状態コード',
    '出欠記録日時',
    '出欠記録者メール',
    '事務局メモ',
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
  // v360: 研修ID 列を追加（nullable・研修関連送信時のみ populate）
  T_メール送信ログ: [
    'ログID',
    '送信日時',
    '送信者メール',
    '件名テンプレート',
    '宛先数',
    '成功数',
    'エラー数',
    '送信種別',
    '研修ID',
    '削除フラグ',
  ],
  // v360: メール送信明細（per-recipient detail）— Header-Detail パターン
  T_メール送信明細: [
    '明細ID',
    'ログID',
    '研修ID',
    '受信者区分',
    '受信者ID',
    '受信者メール',
    '送信結果',
    'エラー詳細',
    '作成日時',
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

// v264: 公開ポータル変更申請テーブル（管理者承認待ちキュー）
// v376.65（案C Phase 1）: 規程・重要事項マスタ。
// 入会申込画面の「事務局からのお願い（重要事項）」と定款リンクの正本。
// 従来はフロント（MEMBERSHIP_NOTICE_HIGHLIGHTS / INCORPORATION_URL）にハードコードされており
// 事務局が改定できなかった。本文の正本はこのテーブル 1 箇所に集約する。
// 区分コード: NOTICE=重要事項カード / REGULATION=規程・定款（外部リンク中心）
// 対象会員種別: ALL / INDIVIDUAL / BUSINESS / SUPPORT（M_会員種別.コード + ALL）
// 版数・施行日は Phase 2（同意記録）で「どの版に同意したか」を指すために使う。
テーブル定義['T_規程'] = [
  '規程ID', '区分コード', 'タイトル', '本文',
  '外部リンクURL', '外部リンク文言', '対象会員種別',
  '版数', '施行日', '表示順', '公開フラグ',
  '更新者メール', '削除フラグ', '作成日時', '更新日時',
];
テーブル定義['T_変更申請'] = [
  '申請ID', '会員ID', '会員種別コード', '申請種別コード', '申請状態コード',
  '申請内容JSON', '連絡先メールアドレス', '申請者表示名', '申請日時',
  '処理日時', '処理者メールアドレス', '処理備考', '作成日時', '更新日時', '削除フラグ',
];
// v335: 同一人物移行・重複修復ログ（append-only）
テーブル定義['T_人物統合ログ'] = [
  'ログID', '処理種別', '介護支援専門員番号',
  '旧会員ID', '旧職員ID', '新会員ID', '新職員ID',
  '結果コード', '詳細JSON', '実行者メール', '実行日時',
  '作成日時', '削除フラグ',
];
// v295: 役員管理テーブル（5テーブル追加）
// v297: 職員ID追加（事業所職員も役員になれる双方向対応）
// 会員ID（個人・賛助会員）と職員ID（事業所職員）はXOR — どちらか一方のみ non-empty
テーブル定義['T_役員'] = [
  '役員ID', '会員ID', '職員ID', '役職コード', '組織コード',
  '就任日', '退任日', '備考',
  '削除フラグ', '作成日時', '更新日時',
];
テーブル定義['T_振込口座'] = [
  '口座ID', '会員ID', '職員ID',
  '金融機関名', '金融機関コード', '支店名', '支店コード',
  '口座種別', '口座番号', '口座名義カナ', '備考',
  '削除フラグ', '作成日時', '更新日時',
];
テーブル定義['T_支払い'] = [
  '支払いID', '会員ID',
  '支払い日', '支払い方法', '合計金額',
  '振込先口座JSON', '登録者メール', '備考',
  '削除フラグ', '作成日時', '更新日時',
];
テーブル定義['T_支払い明細'] = [
  '明細ID', '支払いID', '請求ID',
  '役職コード', '組織コード', '種別コード',
  '金額', '対象期間FROM', '対象期間TO', '摘要',
  '削除フラグ', '作成日時', '更新日時',
];
テーブル定義['T_請求'] = [
  '請求ID', '会員ID', '職員ID', '役職コード', '組織コード', '種別コード',
  '請求種別', '業務分類コード', '単価', '数量',
  '請求金額', '活動日', '活動内容', '添付ファイルURL',
  '請求状態', '却下理由', '承認者メール', '承認日時',
  '削除フラグ', '作成日時', '更新日時',
];
// v309: 管理者共有メモ（申し送りホワイトボード）
テーブル定義['T_共有メモ'] = [
  'キー', '内容', '更新者メール', '更新者名', '更新日時', 'バージョン',
];
// v374.1: 公式 LINE 投稿依頼テーブル（管理者ポータル → LINE 担当者への依頼集約）
// polymorphic association: 対象種別 + 対象ID で将来の連携対象を任意拡張可能（GENERAL / TRAINING / 将来 EVENT 等）
テーブル定義['T_LINE投稿依頼'] = [
  '投稿依頼ID', 'ステータス',
  'テキスト', '研修申込リンク',
  '添付ファイルURL', '添付ファイル種別', '添付ファイル名',
  '対象種別', '対象ID',
  '作成者メール', '作成日時', '更新日時',
  '投稿依頼日時', '投稿日時', '投稿マーク者メール',
  '備考', '削除フラグ',
  // v376.45: 依頼者/投稿者の表示名をデノーマライズ（read 時 lookup 不要）
  '作成者名', '投稿マーク者名',
];

// ── 会員系削除の cascade アーカイブ（docs/249・a1 単一化モデル）───────────────
// v259/v376.36 の T_会員/T_事業所職員 の2本から、会員系13テーブルへ拡張（v376.52）。
// 削除時は live から行を除去し、元テーブルと同スキーマ + サロゲート3列の archive へ「移動」する。
// - アーカイブID: 行個別の一意キー（UUID。Spreadsheet は一意制約を強制できないため冪等性・追跡性用）
// - 削除バッチID: T_削除ログ の ログID。復元は「同一 削除バッチID の全行を戻す」＝会員単位でアトミック
// - アーカイブ日時: 移動時刻 ISO
// 注意: T_ログイン履歴 は archive せず物理 purge（高volume・PII 最小化。docs/249 §4.1）。
var ARCHIVE_SURROGATE_COLUMNS = ['アーカイブID', '削除バッチID', 'アーカイブ日時'];
var ARCHIVE_SOURCE_TABLES = [
  'T_会員', 'T_事業所職員', 'T_認証アカウント', 'T_管理者Googleホワイトリスト',
  'T_研修申込', 'T_年会費納入履歴', 'T_年会費更新履歴', 'T_役員',
  'T_振込口座', 'T_支払い', 'T_支払い明細', 'T_請求', 'T_変更申請',
];
for (var archiveSrcIdx = 0; archiveSrcIdx < ARCHIVE_SOURCE_TABLES.length; archiveSrcIdx += 1) {
  var archiveSrcName = ARCHIVE_SOURCE_TABLES[archiveSrcIdx];
  テーブル定義[archiveSrcName + '_archive'] = テーブル定義[archiveSrcName].slice().concat(ARCHIVE_SURROGATE_COLUMNS);
}

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
  // v295: 役員管理FK検証
  ['T_役員',       '役職コード', 'M_役職マスタ'],
  ['T_役員',       '組織コード', 'M_組織マスタ'],
  ['T_支払い明細', '種別コード', 'M_支払い種別マスタ'],
  ['T_支払い明細', '組織コード', 'M_組織マスタ'],
  ['T_請求',       '種別コード', 'M_支払い種別マスタ'],
  ['T_請求',       '業務分類コード', 'M_業務分類'],
  ['T_請求',       '組織コード', 'M_組織マスタ'],
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

  // v251: scriptId でプロジェクトを識別し配信ページを固定。各 split は自身の HTML のみを返す。
  // v376.32: 公開ポータルは URL パラメータでディープリンクする（下部で __DEEPLINK__ を注入）。
  // AGENTS §3: Script ID は Script Properties の SCRIPT_ID_MEMBER / SCRIPT_ID_ADMIN /
  // SCRIPT_ID_PUBLIC で上書き可能（未設定時は現行3プロジェクトの既定値。移行時にコード改変不要）。
  var routeIdPublic = '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL';
  try {
    var routeProps = PropertiesService.getScriptProperties();
    routeIdPublic = routeProps.getProperty('SCRIPT_ID_PUBLIC') || routeIdPublic;
  } catch (routeErr) {}
  var SCRIPT_ID_ROUTES = {};
  SCRIPT_ID_ROUTES[routeIdPublic] = { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' };
  var route = SCRIPT_ID_ROUTES[ScriptApp.getScriptId()]
    || { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' };

  // GAS は外側 iframe で配信するため、HTML 内の <meta viewport> は無視される。
  // モバイル表示（白ページ防止／レスポンシブ動作）には server-side addMetaTag が必須。
  var rawHtml = HtmlService.createHtmlOutputFromFile(route.file).getContent();

  // exec URL を client へ注入する。GAS の二重 iframe では window.location が
  // 内側 iframe を指すため、共有リンク生成は ScriptApp.getService().getUrl() を正本にする。
  try {
    var appUrl = ScriptApp.getService().getUrl();
    if (appUrl) {
      rawHtml = '<script>window.__APP_URL__=' + JSON.stringify(appUrl) + ';</script>' + rawHtml;
    }
  } catch (ex) {
    // getUrl() 失敗時は注入をスキップ
  }

  // v376.32: ディープリンク用 URL パラメータを許可制で client へ注入する。
  //   ?t=<研修ID> → 該当研修の申込画面へ直行 / ?p=<page> → 指定画面へ直行。
  //   GAS 予約語 c / sid は使わない（使用すると 405）。deny-by-default で既知キーのみ反映。
  try {
    var dlParams = (e && e.parameter) || {};
    var deepLink = {};
    var dlT = sanitizeDeepLinkValue_(dlParams.t);
    if (dlT) deepLink.t = dlT;
    var dlP = sanitizeDeepLinkValue_(dlParams.p);
    if (dlP) deepLink.p = dlP;
    rawHtml = '<script>window.__DEEPLINK__=' + JSON.stringify(deepLink) + ';</script>' + rawHtml;
  } catch (ex) {
    // パラメータ解釈失敗時はディープリンクなしで通常起動
  }

  // docs/248 M1 是正（2026-07-05）: ALLOWALL は第三者サイト埋込を想定する公開ポータルのみ。
  // member/admin は clickjacking/UI redressing 面を閉じるため DEFAULT（外部 frame 埋込拒否）。
  var xframeMode = route.file === 'index_public'
    ? HtmlService.XFrameOptionsMode.ALLOWALL
    : HtmlService.XFrameOptionsMode.DEFAULT;
  var output = HtmlService.createHtmlOutput(rawHtml)
    .setTitle(route.title)
    .setXFrameOptionsMode(xframeMode)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');

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
 * v376.32: ディープリンク用 URL パラメータ値の sanitize。
 * deny-by-default。英数・ハイフン・アンダースコアのみ許可し最大 80 文字。
 * 研修ID(UUID) / ページキー(training-list 等) を想定し、注入・XSS の余地を断つ。
 * ※ build pruner 対策で正規表現リテラルは使わない（MEMORY: build_pruner_regex_action_traps）。
 */
function sanitizeDeepLinkValue_(raw) {
  if (raw == null) return '';
  var s = String(raw).trim();
  if (!s) return '';
  if (s.length > 80) s = s.slice(0, 80);
  var allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  for (var i = 0; i < s.length; i++) {
    if (allowed.indexOf(s.charAt(i)) === -1) return '';
  }
  return s;
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
 * 実行後は schema maintenance のヘッダー保護を再適用することを推奨。
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
  // v372.5: 公開ポータル 職員情報変更フロー — 在籍職員一覧取得
  getPublicEnrolledStaffList: true,
};


// 管理者ログイン専用アクション: Session.getActiveUser() による自己完結型認証のため、
// 事前の admin session 検証を必要としない。関数内で認証を完結させる。

// docs/246 Phase 1-A: メニュー単位 RBAC の認可レジストリ。
// 以下 4 vars は build 時に scripts/menu-registry.mjs の serializeMenuRegistryForGas() で
// 上書き注入される。ここではソースの parse 健全性のために空の placeholder を置いている。
// 単一情報源は scripts/menu-registry.mjs（frontend からも import）。
// __MENU_REGISTRY_BUILD_INJECT_START__
var MENU_REGISTRY = [
  {
    "id": "members-list",
    "label": "会員一覧",
    "group": "会員管理"
  },
  {
    "id": "change-requests",
    "label": "変更申請管理",
    "group": "会員管理"
  },
  {
    "id": "annual-fee",
    "label": "年会費管理",
    "group": "財務・帳票"
  },
  {
    "id": "payment-history",
    "label": "支払い履歴管理",
    "group": "財務・帳票"
  },
  {
    "id": "claim-management",
    "label": "請求管理",
    "group": "財務・帳票"
  },
  {
    "id": "roster-export",
    "label": "名簿出力",
    "group": "財務・帳票"
  },
  {
    "id": "mailing-list-export",
    "label": "宛名リスト出力",
    "group": "財務・帳票"
  },
  {
    "id": "training-manage",
    "label": "研修管理",
    "group": "研修・通知"
  },
  {
    "id": "bulk-mail",
    "label": "一括メール送信",
    "group": "研修・通知"
  },
  {
    "id": "line-post",
    "label": "公式LINE投稿依頼",
    "group": "研修・通知"
  },
  {
    "id": "line-post-manage",
    "label": "公式LINE投稿 管理（全件閲覧・投稿済みマーク）",
    "group": "研修・通知"
  },
  {
    "id": "officer-management",
    "label": "役員管理",
    "group": "組織管理"
  },
  {
    "id": "admin-settings",
    "label": "システム設定",
    "group": "システム"
  },
  {
    "id": "data-export",
    "label": "データ出力（CSV）",
    "group": "システム"
  },
  {
    "id": "system-permissions",
    "label": "権限管理",
    "group": "システム",
    "masterOnly": true
  },
  {
    "id": "data-management",
    "label": "データ管理",
    "group": "システム",
    "masterOnly": true
  },
  {
    "id": "common-shared",
    "label": "共通機能（共有メモ参照・PDFサムネ・データ取得）",
    "group": "共通"
  }
];
var LEGACY_ROLE_TO_MENUS = {
  "ADMIN": [
    "members-list",
    "change-requests",
    "annual-fee",
    "payment-history",
    "claim-management",
    "roster-export",
    "mailing-list-export",
    "training-manage",
    "bulk-mail",
    "line-post",
    "line-post-manage",
    "officer-management",
    "admin-settings",
    "system-permissions",
    "common-shared"
  ],
  "TRAINING_MANAGER": [
    "training-manage",
    "common-shared"
  ],
  "TRAINING_REGISTRAR": [
    "training-manage",
    "common-shared"
  ],
  "GENERAL": [
    "common-shared"
  ]
};
var LEGACY_ROLE_TRAINING_SCOPE = {
  "MASTER": "ALL",
  "ADMIN": "ALL",
  "TRAINING_MANAGER": "ALL",
  "TRAINING_REGISTRAR": "OWN",
  "GENERAL": "ALL"
};
var INITIAL_ROLE_DEFINITIONS = [
  {
    "roleId": "role-master-builtin",
    "roleName": "MASTER",
    "description": "マスター（全権・組込・編集削除不可）",
    "legacyCode": "MASTER",
    "allowedMenus": [],
    "trainingEditScope": "ALL",
    "isBuiltIn": true,
    "isMaster": true,
    "sortOrder": 1
  },
  {
    "roleId": "role-admin-initial",
    "roleName": "管理者",
    "description": "管理者（Phase 1-A 互換マッピング — 権限管理含む全機能）",
    "legacyCode": "ADMIN",
    "allowedMenus": [
      "members-list",
      "change-requests",
      "annual-fee",
      "payment-history",
      "claim-management",
      "roster-export",
      "mailing-list-export",
      "training-manage",
      "bulk-mail",
      "line-post",
      "line-post-manage",
      "officer-management",
      "admin-settings",
      "system-permissions",
      "common-shared"
    ],
    "trainingEditScope": "ALL",
    "isBuiltIn": false,
    "isMaster": false,
    "sortOrder": 10
  },
  {
    "roleId": "role-training-manager-initial",
    "roleName": "研修管理者",
    "description": "研修管理者（研修管理 + 共通機能）",
    "legacyCode": "TRAINING_MANAGER",
    "allowedMenus": [
      "training-manage",
      "common-shared"
    ],
    "trainingEditScope": "ALL",
    "isBuiltIn": false,
    "isMaster": false,
    "sortOrder": 20
  },
  {
    "roleId": "role-training-registrar-initial",
    "roleName": "研修登録者",
    "description": "研修登録者（自登録研修のみ編集可・OWN scope）",
    "legacyCode": "TRAINING_REGISTRAR",
    "allowedMenus": [
      "training-manage",
      "common-shared"
    ],
    "trainingEditScope": "OWN",
    "isBuiltIn": false,
    "isMaster": false,
    "sortOrder": 30
  },
  {
    "roleId": "role-general-initial",
    "roleName": "一般",
    "description": "一般（admin login 不可・予約）",
    "legacyCode": "GENERAL",
    "allowedMenus": [
      "common-shared"
    ],
    "trainingEditScope": "ALL",
    "isBuiltIn": false,
    "isMaster": false,
    "sortOrder": 90
  }
];
var LEGACY_CODE_TO_INITIAL_ROLE_ID = {
  "MASTER": "role-master-builtin",
  "ADMIN": "role-admin-initial",
  "TRAINING_MANAGER": "role-training-manager-initial",
  "TRAINING_REGISTRAR": "role-training-registrar-initial",
  "GENERAL": "role-general-initial"
};


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
        // 会員セッショントークン検証: ログイン以外の MEMBER_ALLOWED_ACTIONS は
    // サーバー側セッションキャッシュからのみ principal を解決し、クライアント申告を信頼しない
    var LOGIN_ONLY_MEMBER_ACTIONS = { memberLogin: true, requestPasswordReset: true, completePasswordReset: true };
        // ─────────────────────────────────────────────────────────



    // v150: 管理者初期データ統合API（dashboard + settings を1回のround-tripで返す）



    // v295: 役員自己サービス（sessionToken 検証済み → payload.memberId 確定済み）
    // v296: 請求（役員のみ）










    if (action === 'submitMemberApplication') {
      return JSON.stringify({ success: true, data: submitMemberApplication_(parsedPayload) });
    }
















    // docs/246 Phase 2-A: ロール CRUD






    // v373.7 (S5 Phase 2): 旧 v316 RosterTemplate dispatcher 撤去
    // v372: 名簿出力 全面刷新（Visual Template Designer）

    // v374.1: 公式LINE投稿依頼




    // v376.7: 研修 soft delete / restore






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
    if (action === 'getPublicEnrolledStaffList') {
      return JSON.stringify({ success: true, data: getPublicEnrolledStaffList_(parsedPayload) });
    }




    // ── v360: 研修名簿・出欠・受講履歴・一括メール明細 ───────────────

    // v188: Gemini AI案内メール生成（APIキーはScriptPropertiesで管理、フロントに露出しない）

    // v373.7 (S5 Phase 2): 旧 PDF 名簿出力 dispatcher 群撤去（v194 getMembersForRoster /
    // v205 initRosterExport / processRosterChunk / finalizeRosterExport / cleanupRosterExport /
    // validateTemplateSpreadsheet）。新 Visual Template Designer に統合済み。

    // v194: 会員一括メール送信



    // v219: 入会メール テンプレート管理

    // v376.42: 全メール種別 テンプレート管理（汎用・カテゴリ別）
    // v376.68: 汎用データエクスポート（CSV）

    // v376.65（案C Phase 1）: 規程・重要事項マスタ CRUD

    // v224: 一括メール テンプレート管理

    // v207: 宛名リスト Excel 出力

    // v295: 役員管理マスタ
    // v295: 役員割当て管理
    // v295: 振込口座管理（管理者用）
    // v295: 支払い履歴管理
    // v296: 請求管理（管理者）

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







var PASSWORD_RESET_CODE_TTL_SECONDS = 30 * 60;
var PASSWORD_RESET_CODE_TTL_MINUTES = 30;
var PASSWORD_RESET_GENERIC_MESSAGE = '入力内容が登録情報と一致する場合、手続き用メールを送信しました。メールに記載された確認コードを入力してください。';









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



// 現在のロック状態を判定する。待機を過ぎていれば expired=true を返し、呼び出し側が解除する。
// 恒久ロックは時間では解けない。解除予定が空の旧データ（無期限ロック）は解除対象として扱う。

// 認証失敗を 1 回加算して必要ならロックする。シートへの書き込みまで行い、新しい状態を返す。

// 認証成功・自動解除・管理者解除で使う。失敗回数とロックを完全に戻す。



/**
 * 管理者権限コードを日本語ラベルに変換する。
 */

/**
 * google.script.run 経由で呼び出し元の Google セッションを検証し、管理者認証を行う。
 * Session.getActiveUser() は google.script.run 呼び出し元のメールを返す（Execute as: Me でも）。
 * 権限コードに応じた adminPermissionLevel を返す。
 */


// ─── docs/246 Phase 1-B: T_権限ロール 関連ヘルパー ─────────────────────────

/**
 * T_権限ロール の全行をキャッシュ付きで取得し、roleId → role object に解決する。
 * 行が見つからない / 削除済 / 未マッチの場合は null。
 */

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






/**
 * v376.30 hotfix: DB_SCHEMA_INITIALIZED_VERSION を現在の DB_SCHEMA_VERSION に強制マークする。
 *
 * 用途: initializeSchemaIfNeeded_ が初期化途中の例外で markSchemaInitialized_ に到達できず、
 * スキーマ自体は既に正しい状態だが Properties が古いままで毎回再初期化が走る状況の救済。
 * diagnoseSchemaStateV376_30 でスキーマが期待値に一致していることを確認した上で実行すること。
 *
 * 書込み: PropertiesService の 2 キーのみ。シートは触らない（破壊なし）。
 */



// ─── v309: 共有メモ（申し送りホワイトボード）────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────


// MASTER のみ変更可能な設定キー（v194）
var MASTER_ONLY_SETTING_KEYS = ['EMAIL_LOG_VIEWER_ROLE'];

// T_システム設定のスネークアッパーケースキーを camelCase に変換する
// 例: 'EMAIL_LOG_VIEWER_ROLE' → 'emailLogViewerRole'





/**
 * T_権限ロール 全件 + メニュー定義 + 各ロールの assignedCount を返す。
 * Caller: 任意の admin（system-permissions menu アクセス権者）。
 */














// v376.46: 会計年度ステータス判定の単一情報源 computeMemberFiscalStatus を
// src/shared/memberFiscalStatus.mjs から build 時に注入する（フロントと同一ロジック）。
// 下記マーカー間の stub は build（injectMemberFiscalStatusPlaceholders）で実体へ置換される。
// __MEMBER_FISCAL_STATUS_BUILD_INJECT_START__
// __MEMBER_FISCAL_STATUS_BUILD_INJECT_END__















function buildColumnIndex_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  return cols;
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

// v376.67: 会員種別の【単一情報源】。ラベル・年会費既定値・整形関数を
// src/shared/memberTypes.mjs から build 時に注入する（フロントと同一ロジック）。
// 下記マーカー間の stub は build（injectMemberTypesPlaceholders）で実体へ置換される。
// 表示ラベルの最終正本は DB の M_会員種別.名称。memberTypeLabel_(code, overrides) の
// overrides にマスタ由来のラベルを渡すことでマスタが優先される。
// __MEMBER_TYPES_BUILD_INJECT_START__
var MEMBER_TYPE_CODES = ["INDIVIDUAL","BUSINESS","SUPPORT"];
var MEMBER_TYPE_LABELS = {"INDIVIDUAL":"個人会員","BUSINESS":"事業所会員","SUPPORT":"賛助会員"};
var MEMBER_TYPE_ANNUAL_FEE_DEFAULTS = {"INDIVIDUAL":3000,"BUSINESS":8000,"SUPPORT":5000};
function memberTypeLabel_(code, overrides) {
  var key = String(code || '');
  if (overrides && overrides[key]) return String(overrides[key]);
  return MEMBER_TYPE_LABELS[key] || key;
}
// __MEMBER_TYPES_BUILD_INJECT_END__

// v376.64: 会費設定の既定値（金額の既定は MEMBER_TYPE_ANNUAL_FEE_DEFAULTS）
var MEMBERSHIP_FEE_DEFAULTS = {
  publicVisible: true,
  note: '',
};

// 会員種別ごとの年会費を、公開・管理どちらでも同じ形（コード→金額）で返す。
function readMemberTypeAnnualFees_(ss) {
  var map = getAnnualFeeAmountMap_(ss);
  var result = {};
  var codes = Object.keys(MEMBER_TYPE_ANNUAL_FEE_DEFAULTS);
  for (var i = 0; i < codes.length; i += 1) {
    var code = codes[i];
    var amount = Number(map[code]);
    result[code] = isFinite(amount) && amount >= 0 ? Math.floor(amount) : MEMBER_TYPE_ANNUAL_FEE_DEFAULTS[code];
  }
  return result;
}




function getSystemSettingValue_(ss, key) {
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) return '';
  var found = findRowByColumnValue_(sheet, '設定キー', key);
  if (!found) return '';
  var idx = found.columns['設定値'];
  // Boolean false は設定値として有効であり、未設定ではない。
  // `value || ''` にすると false が空文字へ化け、OFF の通知が送信される。
  var value = idx == null ? null : found.row[idx];
  return value === null || value === undefined ? '' : String(value);
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


// ── 入会処理 ──────────────────────────────────────────

// v376.73: 入会申込のサーバ側検証。公開ポータル（認証不要）から届く値を信用しない。
// 検証パターンは各関数内ローカルに置く方針（build pruner の regex 罠。AGENTS.md §3 の
// 正本レジストリ「GAS 側は各関数内ローカル」に従う）。src/shared/validators.ts と
// 同じ規則なので、片方を変えたらもう片方も同時に直すこと。
function validateMemberApplicationPayload_(payload, memberType) {
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var cmRe = /^[0-9]{8}$/;

  function requireEmail(value, label) {
    if (!emailRe.test(String(value || '').trim())) throw new Error(label + 'の形式が正しくありません。');
  }

  if (memberType === 'BUSINESS') {
    var staff = Array.isArray(payload.staff) ? payload.staff : [];
    if (staff.length === 0) throw new Error('事業所会員は最低1名の職員が必要です。');
    for (var i = 0; i < staff.length; i++) {
      var s = staff[i] || {};
      var label = '職員 ' + (i + 1);
      if (!String(s.lastName || '').trim() || !String(s.firstName || '').trim()) {
        throw new Error(label + ' の氏名が未入力です。');
      }
      if (!cmRe.test(String(s.careManagerNumber || '').trim())) {
        throw new Error(label + ' の介護支援専門員番号は半角数字8桁で入力してください。');
      }
      requireEmail(s.email, label + ' のメールアドレス');
      // 保存形式（全角カタカナ）へ正規化できない文字は、ここで弾く
      normalizeAndValidateKana_(s.lastKana || '', label + ' のセイ', { required: true });
      normalizeAndValidateKana_(s.firstKana || '', label + ' のメイ', { required: true });
    }
    return;
  }

  if (!String(payload.lastName || '').trim() || !String(payload.firstName || '').trim()) {
    throw new Error('氏名が未入力です。');
  }
  normalizeAndValidateKana_(payload.lastKana || '', 'セイ', { required: true });
  normalizeAndValidateKana_(payload.firstKana || '', 'メイ', { required: true });
  requireEmail(payload.email, 'メールアドレス');
  // 介護支援専門員番号は個人会員のみ必須（賛助会員は任意。RD BR-01）
  var cm = String(payload.careManagerNumber || '').trim();
  if (memberType === 'INDIVIDUAL') {
    if (!cmRe.test(cm)) throw new Error('介護支援専門員番号は半角数字8桁で入力してください。');
  } else if (cm && !cmRe.test(cm)) {
    throw new Error('介護支援専門員番号は半角数字8桁で入力してください。');
  }
}

// ── 入会申込処理（統合フォーム用）──────────────────────────
function enqueueMemberApplicationChangeRequest_(payload) {
  payload = payload || {};
  var memberType = String(payload.memberType || '').trim();
  if (['INDIVIDUAL', 'BUSINESS', 'SUPPORT'].indexOf(memberType) === -1) {
    throw new Error('会員種別が不正です。');
  }
  // 受付確認・承認・却下の連絡先は、事業所会員では代表者を正本とする。
  // 職員配列の先頭を使うと、入力順によって一般メンバーへ誤送信されるため禁止する。
  var contactEmail = memberType === 'BUSINESS'
    ? resolveBusinessApplicationRepresentativeEmail_(payload.staff)
    : String(payload.email || '').trim();
  if (!contactEmail) throw new Error('連絡先メールアドレスが必要です。');

  // v376.73: 申込時のサーバ側検証。
  // これまで検証は承認時が最初で、公開エンドポイント（認証不要）は種別と連絡先しか見ていなかった。
  // 画面の検証は入力の手助けであって単独の防御にしない（AGENTS.md §6）。
  // ここでは「保存できない値を申請として溜めない」ことだけを担保し、
  // 重複判定など DB 状態に依存する検査は従来どおり承認時に行う。
  validateMemberApplicationPayload_(payload, memberType);

  var applicantName = memberType === 'BUSINESS'
    ? String(payload.officeName || '事業所会員申込').trim()
    : joinHumanNameParts_(payload.lastName, payload.firstName).trim();
  var requestId = 'CR' + Date.now() + '_' + generatePublicActionToken_().slice(0, 8);
  var now = new Date().toISOString();
  var ss = getOrCreateDatabase_();
  if (!ss.getSheetByName('T_変更申請')) {
    var newSheet = getOrCreateSheet_(ss, 'T_変更申請');
    writeSheetHeaders_(newSheet, テーブル定義['T_変更申請']);
  }
  appendRowsByHeaders_(ss, 'T_変更申請', [{
    申請ID: requestId,
    会員ID: '',
    会員種別コード: memberType,
    申請種別コード: 'MEMBER_APPLICATION',
    申請状態コード: 'PENDING',
    申請内容JSON: JSON.stringify({ applicationPayload: payload }),
    連絡先メールアドレス: contactEmail,
    申請者表示名: applicantName,
    申請日時: now,
    処理日時: '',
    処理者メールアドレス: '',
    処理備考: '',
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  }]);
  // v368: 申込受付メールをテンプレ化（システム設定で件名・本文を編集可能）
  sendApplicationReceiptMail_(ss, {
    contactEmail: contactEmail,
    applicantName: applicantName,
    requestId: requestId,
    requestType: 'MEMBER_APPLICATION',
    memberTypeLabel: memberTypeLabel_(memberType),
  });
  return { queued: true, success: true, requestId: requestId };
}

function submitMemberApplication_(payload) {
  return enqueueMemberApplicationChangeRequest_(payload);
}










// ── ログイン情報メール送信 ──────────────────────────────────
/**
 * 入会時認証情報メールを送信する。
 * opts.subject / opts.body にマージタグを含むテンプレートを渡す。
 * 利用可能マージタグ: {{氏名}} {{ログインID}} {{パスワード}} {{会員マイページURL}}
 * opts を省略した場合はデフォルトテンプレートを使用する。
 */
// v265: {{変数名}} プレースホルダーを vars オブジェクトで置換するヘルパー
// v376.67: 汎用の差し込みレンダラ。名前が「Biz」だったため事業所専用に見え、
// 他機能が別ルートの置換を書く誘因になっていた（v376.66 の障害の遠因）。
// 実際は事業所メール・研修メール・研修リマインダーが共用する共通実装。
// **メール本文の差し込みは必ずこの関数を通すこと**（渡していないタグは
// deliverMail_ の stripUnresolvedMergeTags_ が送信直前に除去する）。
function renderMergeTags_(template, vars) {
  var result = String(template || '');
  var keys = Object.keys(vars);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    result = result.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(vars[k] == null ? '' : vars[k]));
  }
  return result;
}

// v376.43 (Phase B): T_システム設定の <CAT>_SUBJECT/BODY（無ければ既定）を読み、差し込み置換して返す。
// requiredValue 指定時（OTP/確認コード等）、置換後の本文にその値が含まれなければ既定本文へフォールバックし、
// 管理者が誤って差し込みタグを消しても認証コードが欠落しないことを保証する（安全ガード）。
function renderConfiguredMail_(ss, subjectKey, bodyKey, defaultSubject, defaultBody, vars, requiredValue) {
  var map = {};
  try { map = getSystemSettingMap_(ss); } catch (e) { map = {}; }
  var subjTpl = String(map[subjectKey] || '') || defaultSubject;
  var bodyTpl = String(map[bodyKey] || '') || defaultBody;
  var subject = renderMergeTags_(subjTpl, vars);
  var body = renderMergeTags_(bodyTpl, vars);
  if (requiredValue && body.indexOf(String(requiredValue)) < 0) {
    subject = renderMergeTags_(defaultSubject, vars);
    body = renderMergeTags_(defaultBody, vars);
  }
  return { subject: subject, body: body };
}

// v376.43 (Phase B): 全メール差し込み描画の dryRun E2E（非送信）。operator が editor ▶ で実行し、
// 各メールの件名/本文が設定値（無ければ既定）から正しく差し込み描画され、重要トークン（OTP/確認コード等）が
// 欠落しないことを検証する。実送信は行わない（renderConfiguredMail_ のみ呼ぶ）。

// v368: 変更申請の人間可読サマリーを生成する
//   changeData: { fields?: {key:value}, staffAdd?: [...], staffRemove?: [...], applicationPayload?: {...} }
//   requestType: MEMBER_APPLICATION / MEMBER_UPDATE / WITHDRAWAL / STAFF_ADD / STAFF_REMOVE

// v368: 申請種別ラベル変換（テンプレ差込変数 {{申請種別}} 用）
var REQUEST_TYPE_LABEL_ = {
  MEMBER_APPLICATION: '入会申込',
  MEMBER_UPDATE: '登録情報変更申請',
  WITHDRAWAL: '退会申請',
  STAFF_ADD: '職員追加申請',
  STAFF_REMOVE: '職員除籍申請',
};

// 事業所入会申込の申請者連絡先は、職員入力順ではなく REPRESENTATIVE のメールアドレス。
// 代表者不在・メール未入力は空文字で返し、呼出元で fail-close する。
function resolveBusinessApplicationRepresentativeEmail_(staff) {
  if (!Array.isArray(staff)) return '';
  for (var i = 0; i < staff.length; i++) {
    var row = staff[i] || {};
    if (String(row.role || '').trim() !== 'REPRESENTATIVE') continue;
    return String(row.email || '').trim();
  }
  return '';
}

// シート由来の設定値は文字列だけでなく Boolean になる場合がある。
// Boolean false を `|| true` で既定値へすり替えないよう、未設定だけを既定値にする。
function isSystemSettingValueEnabled_(raw, defaultValue) {
  if (raw === '' || raw === null || raw === undefined) return !!defaultValue;
  return String(raw).trim().toLowerCase() !== 'false';
}

function isSystemSettingEnabled_(ss, key, defaultValue) {
  return isSystemSettingValueEnabled_(getSystemSettingValue_(ss, key), defaultValue);
}

// v376.59: 申請者通知の宛先と OFF 設定を、実送信せず確認する operator 用 dry-run。
// 実 DB は設定の読取りだけで、行追加・更新・メール送信はいっさい行わない。

// v376.60: メール設定の実DB監査。テンプレート本文・名前・メールアドレスを出力せず、
// 設定・カテゴリ・送信元の解決状態だけを確認する非送信・非書込 dryRun。

// v376.61: 研修の開催終了時刻(endTime)の実DB往復 dryRun。
// 実害バグ（endTime が JS Date 文字列のまま API に出て <input type="time"> が空表示になり、
// 保存で終了時刻が消える）の回帰を実DBで検証する。行を作って読んで消す。メールは送らない。

// v376.64: 会費設定（会員種別ごとの年会費）の実DB往復 dryRun。
// 現在値を退避 → 検証値で保存 → 管理設定・公開ポータル設定の両方から読み戻し → 必ず原状復帰する。
// メールは送らない。DB は最終的に実行前の状態へ戻す（passed だけでなく restored も確認すること）。

// ============================================================
// v376.65（案C Phase 1）: 規程・重要事項マスタ
// 本文の正本は T_規程 の 1 箇所。公開ポータルの入会申込画面と管理設定が同じ行を読む。
// ============================================================

var REGULATION_KINDS = ['NOTICE', 'REGULATION'];
var REGULATION_TARGETS = ['ALL', 'INDIVIDUAL', 'BUSINESS', 'SUPPORT'];

// 初期 seed（従来フロントにハードコードされていた文面をそのまま移行する）。
// 既に行があるときは何もしない＝事務局の改定を上書きしない。
var REGULATION_SEED = [
  { kind: 'NOTICE', title: '会費の返還について', body: '納入後の会費は、いかなる理由があっても返還できません。', url: '', urlLabel: '', target: 'ALL', order: 1 },
  { kind: 'NOTICE', title: '個人情報の利用目的', body: '登録情報は、台帳管理、定例会・研修会等の周知、受付確認、広報発送など、協議会運営に必要な範囲でのみ利用します。', url: '', urlLabel: '', target: 'ALL', order: 2 },
  { kind: 'NOTICE', title: '変更・退会の手続き', body: '登録情報の変更や退会は、協議会ホームページからお手続きください。', url: 'https://sites.google.com/view/starhirakata/%E5%85%A5%E4%BC%9A%E9%80%80%E4%BC%9A?authuser=0', urlLabel: '入会・退会案内を開く', target: 'ALL', order: 3 },
  { kind: 'NOTICE', title: '退会の締切', body: '退会は年度切替前の3月末までに完了してください。手続きがない場合は継続扱いとなり、当該年度の会費納入が必要です。', url: '', urlLabel: '', target: 'ALL', order: 4 },
  { kind: 'REGULATION', title: '協議会の定款', body: '入会前に、協議会の基本規程も確認できます。', url: 'https://sites.google.com/view/starhirakata/%E5%AE%9A%E6%AC%BE?authuser=0', urlLabel: '定款を確認する', target: 'ALL', order: 5 }
];

// v376.74: 会員種別ごとの注意事項（入会申込のステップ 2 に出す文面）の初期投入データ。
// 協議会サイトの掲示文を起点に、operator 確認のうえ次のとおり調整した（2026-09-05）。
//   - 紙の「入会申込書」を前提にした表現は、本フォームでの申込に合わせて 3 種別で統一
//   - 「変更届」「退会届」も同様に、システムからの手続きへ表現を揃えた
//   - 金額は本文に書かず {{年会費}} で差し込む（正本は M_会員種別.年会費金額）
// 既存の ALL 向け 5 件（会費の返還・個人情報・変更退会・退会締切・定款）はそのまま残す。
var MEMBER_TYPE_NOTICE_SEED = [
  { target: 'INDIVIDUAL', order: 101, title: '■ 入会について',
    body: '○本会への入会を希望される方は、本フォームから入会の意向をお申し出ください。\n○お申込み後、役員の承認を得て会員となります。' },
  { target: 'INDIVIDUAL', order: 102, title: '■ 会費について',
    body: '○個人会員は年会費として、{{年会費}}の納入をお願いします。\n○会員がすでに納入した会費は、いかなる理由においても返還いたしかねます。\n○年会費は郵便局への振込みにてお願いします。' },
  { target: 'INDIVIDUAL', order: 103, title: '■ 住所変更等された場合の手続きについて',
    body: '○自宅、勤務先の住所等が変更された場合は、変更のあった項目を本システムからお届けください。\n○住所変更のご連絡がない場合には、協議会からの郵便物等が届きませんので、必ずご連絡ください。' },
  { target: 'INDIVIDUAL', order: 104, title: '■ 退会の手続きについて',
    body: '○退会される時は、必ず年度の切り替え前（3月末まで）に本システムから退会をお申し出ください。\n○ご連絡がない場合は、会員継続とさせていただき、当該年度の年会費の納入が必要となります。\n○また、会費につきましては、退会される年度の会費をお支払いいただいた上で、手続き完了とさせていただきます。' },

  { target: 'BUSINESS', order: 201, title: 'ご連絡について',
    body: '※ 事業所の情報、登録会員の変更などは本システムからお届けください。' },
  { target: 'BUSINESS', order: 202, title: '■ 入会について',
    body: '○本会への入会を希望される事業所は、本フォームから入会の意向をお申し出ください。\n○お申込み後、役員の承認を得て会員となります。' },
  { target: 'BUSINESS', order: 203, title: '■ 会費について',
    body: '○事業所会員は年会費として、1事業所につき{{年会費}}の納入をお願いします。\n○年度途中で介護支援専門員の人数に変更があった場合も、すでに納入した会費は、返還いたしかねます。\n○年会費は郵便局への振込みにてお願いします。' },
  { target: 'BUSINESS', order: 204, title: '■ 事業所内の介護支援専門員・住所に変更があった場合の手続きについて',
    body: '○事業所に所属する介護支援専門員（事業所メンバー）に変更があった場合は、速やかにお申し出ください。\n○入退職等で、事業所内の介護支援専門員情報に変更があった場合は、本システムからお届けください。\n○事業所の住所等が変更された場合は、変更のあった項目を本システムからお届けください。\n○住所変更のご連絡がない場合には、協議会からの郵便物等が届きませんので、必ずご連絡ください。' },
  { target: 'BUSINESS', order: 205, title: '■ 介護支援専門員情報の登録状況の確認について',
    body: '○年1回（3月末）、事業所の介護支援専門員情報を事務局より確認いたします。' },
  { target: 'BUSINESS', order: 206, title: '■ 退会の手続きについて',
    body: '○退会される時は、必ず年度の切り替え前（3月末まで）に本システムから退会をお申し出ください。\n○ご連絡がない場合は、会員継続とさせていただき、当該年度の年会費の納入が必要となります。\n○また、会費につきましては、退会される年度の会費をお支払いいただいた上で、手続き完了とさせていただきます。' },

  { target: 'SUPPORT', order: 301, title: '■ 入会について',
    body: '○本会の活動を支援してくださる方は、本フォームから入会の意向をお申し出ください。\n○お申込み後、役員の承認を得て賛助会員となります。' },
  { target: 'SUPPORT', order: 302, title: '■ 会費について',
    body: '○賛助会員は年会費として、1口につき{{年会費}}の納入をお願いします。\n○会員がすでに納入した会費は、いかなる理由においても返還いたしかねます。\n○年会費は郵便局への振込みにてお願いします。' },
  { target: 'SUPPORT', order: 303, title: '■ 介護支援専門員番号について',
    body: '○賛助会員は介護支援専門員番号の登録を任意としています。\n○お持ちでない場合は、協議会が発行するログインIDをご案内します。' },
  { target: 'SUPPORT', order: 304, title: '■ 住所変更等された場合の手続きについて',
    body: '○ご住所・ご連絡先が変更された場合は、変更のあった項目を本システムからお届けください。\n○ご連絡がない場合、協議会からの郵便物等が届きません。' },
  { target: 'SUPPORT', order: 305, title: '■ 退会の手続きについて',
    body: '○退会される時は、年度の切り替え前（3月末まで）に本システムから退会をお申し出ください。\n○ご連絡がない場合は会員継続となり、当該年度の年会費の納入が必要です。' }
];

// 投入対象のうち、まだ T_規程 に無いものを返す（タイトル＋対象会員種別が一致する行があれば「既存」）。
// 事務局が管理画面で文面を直した後に再実行しても、その改定を上書きしない。

// v376.75: 注意事項の再編（operator 決定・2026-09-05）。
// v376.74 で種別ごとに 15 件入れたところ、共通側と内容が重複した。
// 「全種別に等しくかかること」を共通へ寄せ、種別ごとは「その種別でしか言えないこと」だけにする。
//   共通へ移す : 入会について / 会費の一般条件（返還不可・振込先）/ 退会の手続き
//   種別に残す : 年会費の額と単位 / 住所変更の手続き（事業所は内容が大きく異なる）/ 賛助の専門員番号
// 既存の共通 3 件（会費の返還について・退会の締切・変更・退会の手続き）は新項目が内容を包含するため非公開にする。
// 「変更・退会の手続き」に付いていた外部リンクは引き継がない（手続きは本システムで完結するため・operator 判断）。
var NOTICE_RESTRUCTURE_V376_75 = {
  // 共通へ追加する項目
  add: [
    { target: 'ALL', order: 1, title: '■ 入会について',
      body: '○本会への入会を希望される方は、本フォームから入会の意向をお申し出ください。\n○お申込み後、役員の承認を得て会員となります。' },
    { target: 'ALL', order: 2, title: '■ 会費について',
      body: '○会員がすでに納入した会費は、いかなる理由においても返還いたしかねます。\n○年会費は郵便局への振込みにてお願いします。' },
    { target: 'ALL', order: 3, title: '■ 退会の手続きについて',
      body: '○退会される時は、必ず年度の切り替え前（3月末まで）に本システムから退会をお申し出ください。\n○ご連絡がない場合は、会員継続とさせていただき、当該年度の年会費の納入が必要となります。\n○また、会費につきましては、退会される年度の会費をお支払いいただいた上で、手続き完了とさせていただきます。' }
  ],
  // 非公開にする既存の共通項目（タイトルで特定する。行は消さず公開フラグだけ下ろす）
  unpublishTitles: ['会費の返還について', '退会の締切', '変更・退会の手続き'],
  // 種別ごとから取り除く項目（共通へ移したもの）
  removeTitles: [
    { target: 'INDIVIDUAL', title: '■ 入会について' },
    { target: 'INDIVIDUAL', title: '■ 退会の手続きについて' },
    { target: 'BUSINESS', title: '■ 入会について' },
    { target: 'BUSINESS', title: '■ 退会の手続きについて' },
    { target: 'SUPPORT', title: '■ 入会について' },
    { target: 'SUPPORT', title: '■ 退会の手続きについて' }
  ],
  // 種別ごとに残す会費項目は「年会費の額と単位」だけにし、共通と名前がぶつからないよう改題する
  rewrite: [
    { target: 'INDIVIDUAL', from: '■ 会費について', title: '■ 年会費について',
      body: '○個人会員は年会費として、{{年会費}}の納入をお願いします。' },
    { target: 'BUSINESS', from: '■ 会費について', title: '■ 年会費について',
      body: '○事業所会員は年会費として、1事業所につき{{年会費}}の納入をお願いします。\n○年度途中で介護支援専門員の人数に変更があった場合も、すでに納入した会費は、返還いたしかねます。' },
    { target: 'SUPPORT', from: '■ 会費について', title: '■ 年会費について',
      body: '○賛助会員は年会費として、1口につき{{年会費}}の納入をお願いします。' }
  ]
};

// v376.76: 共通（ALL）の表示順の是正。
// v376.75 で追加した 3 項目に 1・2・3 を振ったが、既存の「個人情報の利用目的」が
// もともと 2 番だったため番号が衝突し、共通の並びに割り込んで表示されていた。
// 公開中の共通項目だけを対象に、意図した順番へ振り直す（非公開の行は触らない）。
var NOTICE_ORDER_V376_76 = [
  { title: '■ 入会について', order: 1 },
  { title: '■ 会費について', order: 2 },
  { title: '■ 退会の手続きについて', order: 3 },
  { title: '個人情報の利用目的', order: 4 },
  { title: '協議会の定款', order: 5 }
];


// v376.75 operator ツール: 再編で何が起きるかを確認する（読み取りのみ）。

// v376.75 operator ツール: 再編を実施する。
// 追加・非公開化・削除（論理削除）・本文の書き換えを 1 回で行う。
// 対象は v376.74 で投入した行と、初期 seed の共通 3 件に限る。

// v376.74 operator ツール: 何が追加されるかを確認する（読み取りのみ・書き込みなし）。

// v376.74 operator ツール: 不足分だけを T_規程 へ追記する。
// 既存行は一切変更しない（事務局が管理画面で直した文面を上書きしないため）。
// 取り消したいときは管理画面から該当行を削除する。

function seedRegulationsIfEmpty_(ss) {
  var sheet = ss.getSheetByName('T_規程');
  if (!sheet) return;
  if (sheet.getLastRow() >= 2) return; // 既存行があれば触らない
  var now = new Date().toISOString();
  var rows = [];
  for (var i = 0; i < REGULATION_SEED.length; i += 1) {
    var seed = REGULATION_SEED[i];
    rows.push({
      '規程ID': 'REG-' + ('000' + (i + 1)).slice(-3),
      '区分コード': seed.kind,
      'タイトル': seed.title,
      '本文': seed.body,
      '外部リンクURL': seed.url,
      '外部リンク文言': seed.urlLabel,
      '対象会員種別': seed.target,
      '版数': 1,
      '施行日': '',
      '表示順': seed.order,
      '公開フラグ': true,
      '更新者メール': '',
      '削除フラグ': false,
      '作成日時': now,
      '更新日時': now
    });
  }
  appendRowsByHeaders_(ss, 'T_規程', rows);
}

function regulationRowToObject_(row) {
  return {
    id: String(row['規程ID'] || ''),
    kind: String(row['区分コード'] || 'NOTICE'),
    title: String(row['タイトル'] || ''),
    body: String(row['本文'] || ''),
    linkUrl: String(row['外部リンクURL'] || ''),
    linkLabel: String(row['外部リンク文言'] || ''),
    target: String(row['対象会員種別'] || 'ALL'),
    version: Number(row['版数'] || 1),
    effectiveDate: String(row['施行日'] || ''),
    sortOrder: Number(row['表示順'] || 0),
    published: toBoolean_(row['公開フラグ']),
    updatedBy: String(row['更新者メール'] || ''),
    updatedAt: String(row['更新日時'] || '')
  };
}

// 規程を表示順で返す。publishedOnly=true のときは公開フラグの立った行だけ（公開ポータル用）。
function listRegulations_(ss, publishedOnly) {
  var target = ss || getOrCreateDatabase_();
  if (!target.getSheetByName('T_規程')) return [];
  var rows = getRowsAsObjects_(target, 'T_規程').filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    if (publishedOnly && !toBoolean_(row['公開フラグ'])) return false;
    return true;
  });
  var list = rows.map(regulationRowToObject_);
  list.sort(function(a, b) {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  });
  return list;
}


// 新規追加 / 既存更新。本文・タイトル・リンクが変わったときだけ版数を +1 する
// （Phase 2 の同意記録が「どの版に同意したか」を指せるようにするため）。

// soft delete（削除フラグ）。会員に紐づかないため cascade アーカイブの対象外。

// v376.65（案C Phase 1）: 規程・重要事項マスタの実DB往復 dryRun。
// 検証用の行を作成 → 読み戻し → 更新（版数 +1）→ 公開ポータル設定に出るか確認 → 物理削除で原状復帰。
// メールは送らない。既存の規程行には一切触れない。

// dryRun 専用: 検証で作った T_規程 の行を物理削除する（通常運用では soft delete のみ）。

// v376.66: 入会承認メールの差し込みタグ解決 dryRun（非送信）。
// 実害（事業所会員のメールで {{会員種別}} {{年会費}} がタグのまま届いた）の回帰を実 DB で検証する。
// 実際の会員種別マスタから値を取り、個人 / 事業所代表者 / 事業所メンバー の 3 経路で
// テンプレートを描画して未解決タグが残らないことを確認する。メールは送らない・DB も書かない。

// ============================================================
// v376.68: 汎用データエクスポート（CSV）
//
// 背景（docs/261 T-07）: GCP 移行後は事務局がスプレッドシートを直接開けなくなる。
// 現状の代替手段は一括編集 6 項目と名簿系の出力しかなく、
// 「任意のテーブルを Excel で確認・分析する」手段が無い。移行を待たず GAS 側で先に実装する。
//
// 設計方針:
//   - 出力は CSV（UTF-8 BOM 付き）。Excel でそのまま開けること
//   - 権限は menu 単位 RBAC に載せる（menu: data-export）。MASTER は常に可
//   - **T_認証アカウントは常に出力禁止**（パスワードハッシュ・ソルトを含むため）
//   - ログ系と T_システム設定 は **MASTER 限定**（個人情報・運用値を含むため）
//   - 誰が何を出力したかを監査ログへ残す（個人情報の持ち出し記録）
//   - GCP 移植性: シート読み出しと文字列生成のみ。Firestore へ移しても同一ロジックで動く
// ============================================================

// 常に出力を禁止するテーブル（秘密値を含む）
var EXPORT_FORBIDDEN_TABLES_ = ['T_認証アカウント'];

// MASTER のみ出力できるテーブル（個人情報の追跡記録・運用設定）
var EXPORT_MASTER_ONLY_TABLES_ = [
  'T_監査ログ', 'T_ログイン履歴', 'T_メール送信ログ', 'T_メール送信明細',
  'T_削除ログ', 'T_人物統合ログ', 'T_システム設定',
];

// 1 回の出力で扱う最大行数（GAS の実行時間を超えないための安全弁）
var EXPORT_MAX_ROWS_ = 20000;

// テーブル名から `_archive` を外した「元テーブル名」を返す。
// v376.68 修正: 削除アーカイブ（`<テーブル名>_archive`）は元テーブルと同じ列を持つため、
// **元テーブルと同じ制限を適用しなければならない**。
// 実際に `T_認証アカウント_archive` がパスワードハッシュ・ソルトを保持したまま
// 出力対象に混入していた（live 確認で検出）。



// 出力可能なテーブル一覧を返す。権限に応じて masterOnly を落とす。

// CSV の 1 セルをエスケープする（RFC 4180）。
// 先頭が = + - @ の場合は数式として解釈されないよう ' を前置する（CSV インジェクション対策）。

// 指定テーブルを CSV 文字列で返す。

// v376.68: 汎用データエクスポートの実 DB dryRun（非送信・DB 書込なし・読み取りのみ）。
// 会員の個人情報を扱う機能のため、権限ガードが実際に効くことを本番 DB で確認する。
// **CSV の中身はログに出さない**（行数と先頭ヘッダー名のみ）。

// v376.71: T_認証アカウント に ロック解除予定日時 を追加したため、既存行の列レイアウトを
// 実際にずらす必要がある。起動時の初期化はキャッシュ済みバージョンで飛ばされる経路があるので、
// operator が明示的に 1 回実行する（docs/09 の Schema migration step）。再実行しても安全。

// v376.71: ログイン失敗の時限解除（docs/261 T-04）の判定を実データ無しで検証する。
// DB への書き込みは行わない。

// v368: 申込受付メール送信ヘルパー（公開ポータル申請受付時に使用）
function sendApplicationReceiptMail_(ss, params) {
  // params: { contactEmail, applicantName, requestId, requestType, memberTypeLabel, receivedAt }
  if (!params || !params.contactEmail) return;
  if (!isSystemSettingEnabled_(ss, 'APPLICATION_RECEIPT_ENABLED', true)) return;
  var subjectTpl = String(getSystemSettingValue_(ss, 'APPLICATION_RECEIPT_SUBJECT') || '') || APPLICATION_RECEIPT_DEFAULT_SUBJECT;
  var bodyTpl = String(getSystemSettingValue_(ss, 'APPLICATION_RECEIPT_BODY') || '') || APPLICATION_RECEIPT_DEFAULT_BODY;
  var vars = {
    '氏名': params.applicantName || '',
    '会員種別ラベル': params.memberTypeLabel || '',
    '申請種別': REQUEST_TYPE_LABEL_[params.requestType] || params.requestType || '',
    '申請ID': params.requestId || '',
    '受付日時': params.receivedAt || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
  };
  try {
    deliverMail_('APPLICATION_RECEIPT', params.contactEmail, renderMergeTags_(subjectTpl, vars), renderMergeTags_(bodyTpl, vars));
  } catch (e) {
    Logger.log('[sendApplicationReceiptMail_] failed: ' + e.message);
  }
}

// v368: 承認通知メール送信ヘルパー

// v368: 却下通知メール送信ヘルパー

// v265: 事業所メール設定をまとめて取得するヘルパー（T_システム設定から）


// ── メールテンプレート管理（v376.42 で全メール種別へ汎用化）─────────────
// T_メールテンプレート テーブルに集約。カテゴリ列で種別を区別する。
// runtime のメール本文は従来どおり T_システム設定 の <CAT>_SUBJECT/BODY を使用し、
// 本テーブルは名前付きスナップショットの保存/読込専用（送信経路の正本にはしない）。
// 上書き保存 = payload.id 一致で update、無ければ新規 insert。

var MAIL_TEMPLATE_CATEGORIES_ = [
  'CREDENTIAL', 'BIZ_REP', 'BIZ_STAFF', 'STAFF_ADD_STAFF', 'STAFF_ADD_REP',
  'APPLICATION_RECEIPT', 'APPROVAL_NOTIFICATION', 'REJECTION_NOTIFICATION',
  'TRAINING_APPLY_RECEIPT', 'TRAINING_REMINDER', 'AUTH_OTP',
  'MEMBER_UPDATE_CONFIRM', 'WITHDRAWAL_CONFIRM', 'PASSWORD_RESET'
];



// 汎用一覧取得。payload.category 指定時はそのカテゴリのみ。更新日時の降順。

// 汎用保存。payload.id 一致で上書き update、無ければ新規 insert。

// 汎用削除（soft delete）。

// 旧 T_システム設定 の CREDENTIAL_EMAIL_TEMPLATES（JSON 配列）を T_メールテンプレート へ移行。
// id 一致で重複スキップするため冪等。旧 JSON キーはロールバック用に削除しない。
function migrateCredentialTemplatesToTable_(ss) {
  var sheet = ss.getSheetByName('T_メールテンプレート');
  if (!sheet) return;
  var raw = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_TEMPLATES');
  if (!raw) return;
  var legacy;
  try { legacy = JSON.parse(raw); } catch (e) { return; }
  if (!Array.isArray(legacy) || legacy.length === 0) return;
  var existing = getRowsAsObjects_(ss, 'T_メールテンプレート');
  var existingIds = {};
  for (var i = 0; i < existing.length; i += 1) existingIds[String(existing[i]['テンプレートID'] || '')] = true;
  var toAppend = [];
  for (var j = 0; j < legacy.length; j += 1) {
    var t = legacy[j] || {};
    var id = String(t.id || '');
    if (!id || existingIds[id]) continue;
    var savedAt = String(t.savedAt || new Date().toISOString());
    toAppend.push({
      'テンプレートID': id,
      'カテゴリ': 'CREDENTIAL',
      '名前': String(t.name || ''),
      '件名': String(t.subject || ''),
      '本文': String(t.body || ''),
      '既定フラグ': false,
      '作成日時': savedAt,
      '更新日時': savedAt,
      '削除フラグ': false,
    });
  }
  if (toAppend.length > 0) {
    appendRowsByHeaders_(ss, 'T_メールテンプレート', toAppend);
    Logger.log('[migrateCredentialTemplatesToTable_] migrated ' + toAppend.length + ' credential templates to T_メールテンプレート');
  }
}

// ── 後方互換: 旧 credential 専用 action は汎用関数へ委譲（単一情報源を維持）──



// ── 一括メール テンプレート管理（v224）──────────────────
// T_システム設定 の BULK_MAIL_TEMPLATES キーに JSON 配列で保存
// [{id, name, subject, body, savedAt}, ...]





// v376.72: T_研修申込.申込ID の採番はこの 1 関数に集約する（AGENTS.md §3 の DRY 原則）。
// 以前は 4 箇所が別々に採番しており、同じ列に 3 通りの形式が混在していた
// （会員セルフ = AP- + 10 桁 / 外部申込 = 素の UUID / 名簿への手動追加 = AP- + 8 桁）。
// 一意性は保たれていたため既存データは振り直さない。取消は完全一致で引くため形式変更の影響を受けない。
function generateTrainingApplyId_() {
  return 'AP-' + Utilities.getUuid().replace(/-/g, '').substring(0, 10).toUpperCase();
}

// v376.73: 認証アカウントの現在のログインID一覧。採番の重複回避に使う。
// 削除フラグや有効フラグで絞らない — 無効な行でもログインIDは占有され続けるため
// （findRowByColumnValue_ は先頭一致の 1 行しか返さない。重複すると後から作られた側が
//  永久にログインできなくなる。退会者の再入会で実際に起こる）。

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


function isInactiveMemberStatusForIdentity_(status) {
  var value = String(status || 'ACTIVE');
  return value === 'WITHDRAWN' || value === 'TRANSFERRED';
}









// ── 研修申込の会員ID/職員ID/申込者IDを移行する ──
// 申込者IDは常に会員IDと一致させる（getTrainingApplicationIntegrityIssues_ の不変条件）。
// 更新対象: 削除フラグ=false のレコードのみ。

// ── 事業所職員の重複在籍レコード修復 (MASTER専用) ──────────────────
// 同一介護支援専門員番号 × 同一事業所で ENROLLED 件数 > 1 の場合、
// 作成日時が古いレコードを LEFT + 削除フラグ = true に設定する。

// ── 会員CM番号重複（同一CM番号の複数アクティブ個人/賛助会員）を修復する (MASTER専用) ──
// 同一CM番号に ACTIVE/WITHDRAWAL_SCHEDULED の個人・賛助会員が複数存在する場合、
// 入会日が最も新しい1件を残し、残りを TRANSFERRED + 移行日=本日 に更新する。
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
  'status','joinedDate','withdrawnDate','withdrawalProcessDate','statusNote','midYearWithdrawal',
  'careManagerNumber','officeName','officeNumber','staffLimit',
];
// v143: 管理者編集で監査ログ対象となるフィールド（ADMIN_ONLY_EDIT 層）
var ADMIN_AUDIT_FIELDS_ = [
  'status','joinedDate','withdrawnDate','withdrawalProcessDate','statusNote','midYearWithdrawal',
];
// v106: NIST RBAC — ロール別職員フィールド allowlist
var STAFF_WRITABLE_FIELDS_REPRESENTATIVE_ = ['id','name','kana','email','status','role'];
var STAFF_WRITABLE_FIELDS_ADMIN_ = ['id','name','kana','email','status','role']; // v167: ADMIN can change roles of others (not self, not REPRESENTATIVE)
var STAFF_WRITABLE_FIELDS_SELF_ = ['id','name','kana','email'];




// v143: 管理者会員詳細編集用サニタイズ — ADMIN_MEMBER_WRITABLE_FIELDS_ でフィルタ

// v143: 監査ログ追記 — ADMIN_AUDIT_FIELDS_ の変更を T_監査ログ に記録
// v259: ログSSが設定されている場合はそちらに書き込む


// ── v125: フラット人物リスト取得（個人会員+事業所職員を混合） ──

// ── v125: フラット人物の一括更新 ──
// v376.69: 一括編集で更新できる項目。
// 以前は 6 項目だけで、住所や電話をまとめて直す手段が無く「スプレッドシートを直接開く」しかなかった。
// GCP 移行後はシートを開けなくなるため（docs/261 T-07）、連絡先・住所まで拡張する。
//
// **意図的に含めないもの**（一括で書き換えると事故が大きい・別画面で扱う）:
//   氏名 / カナ / 介護支援専門員番号（本人特定と会員ログイン ID に直結）
//   会員種別 / 事業所の所属（移行機能で扱う）／職員数上限（事業所設定）
var ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_ = [
  'email', 'mailingPreference', 'preferredMailDestination',
  'status', 'joinedDate', 'withdrawnDate',
  // v376.69: 連絡先
  'phone', 'fax', 'mobilePhone',
  // v376.69: 勤務先
  'officeName', 'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  // v376.69: 自宅
  'homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine', 'homeAddressLine2',
];
// 職員（T_事業所職員）は列が氏名・カナ・メール・権限・状態・入会/退会日・専門員番号のみで、
// **電話や住所の列を持たない**（連絡先は所属事業所＝T_会員 側が正本）。
// そのため一括編集の対象も従来どおり 4 項目に留める。列を増やす場合はスキーマ変更が先。
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
    statusNote: fromPayloadOrCurrent('statusNote', String(getCol('ステータスメモ') || '')),
    midYearWithdrawal: fromPayloadOrCurrent('midYearWithdrawal', false),
  };
  // v372.4: admin 権限（MASTER/ADMIN）の場合のみ CM 番号緩和を許可
  var allowRelaxedCm = isAllowedRelaxedCmNumber_(adminSession);
  validateMemberPayload_(mergedPayload, memberTypeCode, currentMemberStatus, { allowRelaxedCmNumber: allowRelaxedCm });
  // v372.4: DB 保存前に CM 番号を大文字化（既存純数字データは影響なし）
  if (mergedPayload.careManagerNumber) {
    mergedPayload.careManagerNumber = normalizeCmNumberForStorage_(mergedPayload.careManagerNumber);
  }
  var sharedMobile = memberTypeCode === 'BUSINESS' && !String(mergedPayload.mobilePhone || '').trim()
    ? String(mergedPayload.phone || '')
    : String(mergedPayload.mobilePhone || '');

  // v143: 監査ログ用 — 変更前の値を記録
  var prevStatus = String(getCol('会員状態コード') || 'ACTIVE');
  var prevJoinedDate = String(normalizeDateInput_(getCol('入会日')) || '');
  var prevWithdrawnDate = String(normalizeDateInput_(getCol('退会日')) || '');
  var prevWithdrawalProcessDate = String(normalizeDateInput_(getCol('退会処理日')) || '');
  var prevStatusNote = String(getCol('ステータスメモ') || '');

  function setCol(name, value) {
    var idx = cols[name];
    if (idx != null) row[idx] = value !== undefined ? value : '';
  }

  setCol('姓', mergedPayload.lastName || '');
  setCol('名', mergedPayload.firstName || '');
  // v376: kana 列は normalizeKana_ で全角カタカナに正規化（不正文字は throw）
  setCol('セイ', normalizeAndValidateKana_(mergedPayload.lastKana || '', '会員のセイ'));
  setCol('メイ', normalizeAndValidateKana_(mergedPayload.firstKana || '', '会員のメイ'));
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
  if (cols['ステータスメモ'] != null) {
    setCol('ステータスメモ', String(mergedPayload.statusNote || '').slice(0, 2000));
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

  if (!skipCacheClear) {
    clearAllDataCache_();
  }
  return { updated: true, memberId: String(payload.id) };
}

function validateMemberPayload_(payload, memberTypeCode, currentMemberStatus, opts) {
  // v372.4: opts.allowRelaxedCmNumber === true で 1〜10 桁半角英数字を許可
  opts = opts || {};
  var allowRelaxedCm = opts.allowRelaxedCmNumber === true;
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
    // v376: 半角カナ制限を廃止。ひらがな/全角カナ/半角カナを許容し、保存時に normalizeAndValidateKana_ が全角カタカナに正規化する
    if (!isSupport && !trim(payload.careManagerNumber)) throw new Error('賛助会員以外は介護支援専門員番号が必須です。');
    if (trim(payload.careManagerNumber)) {
      // v372.4: admin 例外（MASTER/ADMIN 権限）なら 1〜10 桁半角英数字を許可
      if (allowRelaxedCm) {
        if (!isEightDigits(payload.careManagerNumber) && !isValidCmNumberRelaxed_(payload.careManagerNumber)) {
          throw new Error('介護支援専門員番号は 8 桁の半角数字、または例外として 1〜10 桁の半角英数字で入力してください（看護師等: HN+事業所番号下8桁 / 社会福祉士: HS+事業所番号下8桁）。');
        }
      } else {
        if (!isEightDigits(payload.careManagerNumber)) {
          throw new Error('介護支援専門員番号は8桁の半角数字で入力してください。');
        }
      }
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
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Tokyo', 'yyyy-MM-dd');
  }
  var text = String(value || '').trim();
  if (!text) return '';
  var ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    var y = Number(ymd[1]);
    var m = Number(ymd[2]);
    var d = Number(ymd[3]);
    var strictDate = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (
      strictDate.getFullYear() !== y ||
      strictDate.getMonth() !== m - 1 ||
      strictDate.getDate() !== d
    ) return '';
    return text;
  }
  var parsed = new Date(text);
  if (isNaN(parsed.getTime())) return '';
  return Utilities.formatDate(parsed, 'Asia/Tokyo', 'yyyy-MM-dd');
}





// v106: 年度開始日ユーティリティ（日本の会計年度: 4月1日〜翌年3月31日）

function normalizeBusinessStaffRole_(value) {
  var role = String(value || 'STAFF');
  return ['REPRESENTATIVE', 'ADMIN', 'STAFF'].indexOf(role) !== -1 ? role : 'STAFF';
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
      throw new Error('スキーマ不足: 列「' + names[i] + '」が見つかりません。schema maintenance を実行してください。');
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











// v376.7: 研修の soft delete（削除フラグ=true）。物理削除しない。
//   payload: { trainingId: string }
//   返却: { trainingId, applicantCount, deleted: true }
//   申込実績がある場合も削除可能（呼出側で警告表示 → 確認後実行する設計）。
//   削除後は公開ポータル/admin dashboard から自動非表示（既存の !削除フラグ filter 経由）。

// v376.7: 研修の復元（削除フラグ=false）。soft delete の取消。

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
  // legacy モデル: 3-FK XOR を優先評価し、空ならば legacy 申込者区分コードへフォールバック。
  // STAFF を独立解決しない（送信先・名簿解決には使わない / 上記ガードレール参照）。
  var externalId = String(rowObj['外部申込者ID'] || '').trim();
  if (externalId) return 'EXTERNAL';
  var applicantType = String(rowObj['申込者区分コード'] || '').trim();
  if (applicantType) return applicantType;
  return String(rowObj['会員ID'] || '').trim() ? 'MEMBER' : '';
}

function getApplicationApplicantId_(rowObj) {
  // legacy モデル（getApplicationApplicantType_ と対。送信先・名簿解決には使わない）
  var externalId = String(rowObj['外部申込者ID'] || '').trim();
  if (externalId) return externalId;
  var applicantId = String(rowObj['申込者ID'] || '').trim();
  if (applicantId) return applicantId;
  return String(rowObj['会員ID'] || '').trim();
}

// v360: 申込者の正本参照を取得（3-FK XOR 優先・STAFF を独立 type として返す）。
// 送信先メール・名簿表示・本人解決はすべてこの関数を使うこと（上記ガードレール参照）。
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


/**
 * v350: 単一研修のサムネイル PNG を再生成する admin action。
 * 編集モーダルの「サムネイル再生成」ボタンから呼ぶ。
 * payload: { trainingId }
 * 返り値: { trainingId, thumbnailUrl, thumbnailGenerationStatus, reason? }
 */

/**
 * v350: 10 分ごとに時間ベーストリガーから呼ばれる pending backfill。
 * thumbnailUrl 空の T_研修 行を最大 5 件処理する（Apps Script 6 分制限を考慮）。
 * Drive が 5 分以上かけて生成する大きい PDF も時間経過で hasThumbnail=true に
 * なるため、繰り返し trigger で最終的に救済される。
 */

/**
 * v349: 既存 PDF (Drive 上の fileId) から 1 ページ目のサムネイル PNG を生成し、
 * 同フォルダに ANYONE_WITH_LINK の PNG ファイルとして保存して URL を返す。
 *
 * 流れ:
 *   1. Drive REST API v3 files.get?fields=thumbnailLink を Bearer 付きで呼び、
 *      Drive が裏で生成した lh3.googleusercontent.com の URL を取得。
 *      生成が間に合わない場合があるため最大 3 回まで sleep ＋ retry。
 *   2. thumbnailLink の =s220 を =w800 に置換して解像度を引き上げ、Bearer 付きで
 *      fetch して PNG bytes を取得。
 *   3. PNG を専用ファイル名で同フォルダに createFile + ANYONE_WITH_LINK 共有。
 *   4. 永続化した PNG の getUrl() を返却。
 *
 * 失敗時は空文字を返す（呼び出し側で UI fallback を出す）。
 *
 * Ref: Tanaike, 2023 ("Converting All Pages in PDF File to PNG Images using Google
 *      Apps Script") — multi-page splitting 部分は不要なので簡素化した形を採用。
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
function initializeSchema_(ss) {
  // v376.31: 各 step を try/catch + Logger.log で計装。
  //   - "critical" step（migration / 列追加 / seed）はエラーを伝播してロールバック (markSchemaInitialized_ 未到達)
  //   - "post" step（validation 適用 / 保護 / cleanup / audit）はログのみで続行
  //     → 後処理ステップの軽微なエラーで毎リクエスト再初期化ループに陥る v376.30 の事象を回避
  //   - 計装サマリは Logger に「[initializeSchema_] passed N / failed M (post: K)」で出力
  var passed = 0;
  var critFailed = [];
  var postFailed = [];

  function critical(label, fn) {
    try { fn(); passed += 1; } catch (e) {
      critFailed.push({ step: label, error: e && e.message ? e.message : String(e) });
      Logger.log('[initializeSchema_][CRITICAL FAIL] ' + label + ': ' + (e && e.message ? e.message : String(e)));
      throw e; // 伝播してロールバック
    }
  }
  function post(label, fn) {
    try { fn(); passed += 1; } catch (e) {
      postFailed.push({ step: label, error: e && e.message ? e.message : String(e) });
      Logger.log('[initializeSchema_][POST FAIL] ' + label + ': ' + (e && e.message ? e.message : String(e)));
      // post-step は伝播しない（処理続行）
    }
  }

  // ── critical: スキーマ整備 ───────────────────────────
  critical('createMasterSheets_',                 function() { createMasterSheets_(ss); });
  critical('ensureMemberTypeAnnualFeeAmounts_',   function() { ensureMemberTypeAnnualFeeAmounts_(ss); });
  critical('ensureTableSheetsExist_',             function() { ensureTableSheetsExist_(ss); });
  critical('normalize T_会員',                    function() { normalizeTableColumns_(ss, 'T_会員'); });
  critical('normalize T_事業所職員',              function() { normalizeTableColumns_(ss, 'T_事業所職員'); });
  critical('normalize T_研修',                    function() { normalizeTableColumns_(ss, 'T_研修'); });
  critical('normalize T_年会費納入履歴',          function() { normalizeTableColumns_(ss, 'T_年会費納入履歴'); });
  critical('normalize T_年会費更新履歴',          function() { normalizeTableColumns_(ss, 'T_年会費更新履歴'); });
  critical('normalize T_管理者Googleホワイトリスト', function() { normalizeTableColumns_(ss, 'T_管理者Googleホワイトリスト'); });
  // docs/246 Phase 1-B: メニュー単位カスタムロール RBAC
  critical('normalize T_権限ロール',              function() { normalizeTableColumns_(ss, 'T_権限ロール'); });
  critical('seedInitialPermissionRoles_',         function() { seedInitialPermissionRoles_(ss); });
  // v376.42: 全メール種別テンプレート管理テーブル + 旧 credential JSON の移行
  critical('normalize T_メールテンプレート',      function() { normalizeTableColumns_(ss, 'T_メールテンプレート'); });
  critical('migrateCredentialTemplatesToTable_',  function() { migrateCredentialTemplatesToTable_(ss); });
  // v376.45: 公式LINE投稿依頼に 作成者名/投稿マーク者名 列を追加（name-based shift で既存行保持）
  critical('normalize T_LINE投稿依頼',            function() { normalizeTableColumns_(ss, 'T_LINE投稿依頼'); });
  // v376.65（案C Phase 1）: 規程・重要事項マスタ。初回のみ現行のハードコード文面を移行 seed する。
  critical('normalize T_規程',                    function() { normalizeTableColumns_(ss, 'T_規程'); });
  critical('seedRegulationsIfEmpty_',             function() { seedRegulationsIfEmpty_(ss); });
  critical('normalize T_認証アカウント',          function() { normalizeTableColumns_(ss, 'T_認証アカウント'); });
  critical('normalize T_ログイン履歴',            function() { normalizeTableColumns_(ss, 'T_ログイン履歴'); });
  critical('normalize T_研修申込',                function() { normalizeTableColumns_(ss, 'T_研修申込'); });
  critical('normalize T_監査ログ',                function() { normalizeTableColumns_(ss, 'T_監査ログ'); });
  // v376.52: cascade アーカイブ13本（docs/249）。ARCHIVE_SOURCE_TABLES を単一情報源にループ整備
  critical('normalize *_archive (13)',            function() {
    for (var ai = 0; ai < ARCHIVE_SOURCE_TABLES.length; ai += 1) {
      normalizeTableColumns_(ss, ARCHIVE_SOURCE_TABLES[ai] + '_archive');
    }
  });
  critical('normalize T_変更申請',                function() { normalizeTableColumns_(ss, 'T_変更申請'); });
  critical('normalize T_人物統合ログ',            function() { normalizeTableColumns_(ss, 'T_人物統合ログ'); });
  critical('normalize T_役員',                    function() { normalizeTableColumns_(ss, 'T_役員'); });
  critical('normalize T_振込口座',                function() { normalizeTableColumns_(ss, 'T_振込口座'); });
  critical('normalize T_支払い',                  function() { normalizeTableColumns_(ss, 'T_支払い'); });
  critical('normalize T_支払い明細',              function() { normalizeTableColumns_(ss, 'T_支払い明細'); });
  critical('normalize T_請求',                    function() { normalizeTableColumns_(ss, 'T_請求'); });
  critical('ensureSystemSettingsRows_',           function() { ensureSystemSettingsRows_(ss); });
  critical('seedPermissionMatrixIfNeeded_',       function() { seedPermissionMatrixIfNeeded_(ss); });

  // ── post: 補助処理（失敗してもスキーマ整合は保たれるためログのみで続行）─────
  post('applyDataValidationRules_',              function() { applyDataValidationRules_(ss); });
  post('protectHeaderRows_',                     function() { protectHeaderRows_(ss); });
  post('cleanupNonSchemaSheets_',                function() { cleanupNonSchemaSheets_(ss); });
  post('backfillBusinessStaffNameColumns_',      function() { backfillBusinessStaffNameColumns_(ss); });
  post('auditDeleteFlagColumns_',                function() { auditDeleteFlagColumns_(ss); });

  Logger.log('[initializeSchema_] passed=' + passed + ' criticalFailed=' + critFailed.length + ' postFailed=' + postFailed.length +
    (postFailed.length > 0 ? ' (post detail: ' + JSON.stringify(postFailed) + ')' : ''));
}

/**
 * v342: 削除フラグ列の sanity check (docs/204 再発防止 §3)。
 * schema-shift が writeSheetHeaders_ で取りこぼされた場合、削除フラグ列に
 * boolean 以外の文字列（介護支援専門員番号など）が混入する事象が発生する。
 * 全 T_* テーブルを走査し、true/false/空 以外の値があれば Logger に警告。
 */
function auditDeleteFlagColumns_(ss) {
  var tableNames = Object.keys(テーブル定義);
  var warnings = [];
  for (var i = 0; i < tableNames.length; i += 1) {
    var tableName = tableNames[i];
    var headers = テーブル定義[tableName];
    var deleteFlagIndex = headers.indexOf('削除フラグ');
    if (deleteFlagIndex < 0) continue;
    var sheet = ss.getSheetByName(tableName);
    if (!sheet) continue;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) continue;
    var values = sheet.getRange(2, deleteFlagIndex + 1, lastRow - 1, 1).getValues();
    var badCount = 0;
    var firstBadRow = -1;
    var firstBadValue = '';
    for (var r = 0; r < values.length; r += 1) {
      var v = values[r][0];
      if (v === '' || v === null || v === true || v === false) continue;
      var s = String(v);
      if (s === 'TRUE' || s === 'FALSE' || s === 'true' || s === 'false') continue;
      badCount += 1;
      if (firstBadRow < 0) {
        firstBadRow = r + 2;
        firstBadValue = s.substring(0, 40);
      }
    }
    if (badCount > 0) {
      warnings.push(tableName + ': ' + badCount + ' rows with non-boolean 削除フラグ (first row=' + firstBadRow + ', value="' + firstBadValue + '")');
    }
  }
  if (warnings.length > 0) {
    Logger.log('auditDeleteFlagColumns_: schema-drift suspected. ' + warnings.join(' | '));
  }
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

// v376.64: 年会費金額は設定画面（会費設定）から変更できる運用値になったため、
// スキーマ初期化では「未設定（空欄・非数値・0以下）のときだけ既定値を補完」する。
// 以前は毎回 3000/8000/5000 で上書きしていたため、管理者が変更しても次回ログインの
// initializeSchema_ で元に戻ってしまう（設定として成立しない）。
function ensureMemberTypeAnnualFeeAmounts_(ss) {
  var sheet = ss.getSheetByName('M_会員種別');
  if (!sheet || sheet.getLastRow() < 2) return;
  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['コード', '年会費金額']);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var changed = false;
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var code = String(row[cols['コード']] || '');
    if (!Object.prototype.hasOwnProperty.call(MEMBER_TYPE_ANNUAL_FEE_DEFAULTS, code)) continue;
    // 空欄（未設定）と 0 円（会費無料として設定済み）を区別する。
    // Number('') は 0 になるため、生値が空かどうかを先に見る。
    var rawAmount = row[cols['年会費金額']];
    var isBlank = rawAmount === '' || rawAmount === null || rawAmount === undefined;
    var current = Number(rawAmount);
    if (!isBlank && isFinite(current) && current >= 0) continue; // 設定済みの金額は尊重する
    row[cols['年会費金額']] = Number(MEMBER_TYPE_ANNUAL_FEE_DEFAULTS[code]);
    changed = true;
  }
  if (changed) sheet.getRange(2, 1, rows.length, sheet.getLastColumn()).setValues(rows);
}

// 会員種別ごとの年会費を M_会員種別 に書き込む（設定画面「会費設定」から呼ばれる）。
// 正本は M_会員種別.年会費金額 の 1 箇所のみ（年会費請求・メール差し込みも同じ列を読む）。



function ensureTableSheetsExist_(ss) {
  var tableNames = Object.keys(テーブル定義);
  for (var i = 0; i < tableNames.length; i += 1) {
    var tableName = tableNames[i];
    var existing = ss.getSheetByName(tableName);
    if (existing) {
      // v376.44: 既存だがヘッダー欠落（列数0）のシートを自己修復する。
      // getOrCreateSheet_ 等でヘッダー無しに作られたシートが永久に壊れたまま残るのを防ぐ。
      if (existing.getLastColumn() < 1) {
        writeSheetHeaders_(existing, テーブル定義[tableName]);
      }
      continue;
    }
    var sheet = ss.insertSheet(tableName);
    writeSheetHeaders_(sheet, テーブル定義[tableName]);
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
  // v373.7 (S5 Phase 2): ROSTER_TEMPLATE_SS_ID / REMINDER_TEMPLATE_SS_ID の seed 撤去（旧 RosterExport 関連）
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

  // v368: 申込受付メール / 承認通知メール / 却下通知メール デフォルト初期化
  var changeRequestEmailDefaults = [
    { key: 'APPLICATION_RECEIPT_ENABLED', value: 'true', desc: '公開ポータル申請受付時：受付確認メール送信ON/OFF' },
    { key: 'APPLICATION_RECEIPT_SUBJECT', value: APPLICATION_RECEIPT_DEFAULT_SUBJECT, desc: '公開ポータル申請受付時：受付確認メール件名' },
    { key: 'APPLICATION_RECEIPT_BODY',    value: APPLICATION_RECEIPT_DEFAULT_BODY,    desc: '公開ポータル申請受付時：受付確認メール本文' },
    { key: 'APPROVAL_NOTIFICATION_ENABLED', value: 'true', desc: '管理者承認時：承認通知メール送信ON/OFF' },
    { key: 'APPROVAL_NOTIFICATION_SUBJECT', value: APPROVAL_NOTIFICATION_DEFAULT_SUBJECT, desc: '管理者承認時：承認通知メール件名' },
    { key: 'APPROVAL_NOTIFICATION_BODY',    value: APPROVAL_NOTIFICATION_DEFAULT_BODY,    desc: '管理者承認時：承認通知メール本文' },
    { key: 'REJECTION_NOTIFICATION_ENABLED', value: 'true', desc: '管理者却下時：却下通知メール送信ON/OFF' },
    { key: 'REJECTION_NOTIFICATION_SUBJECT', value: REJECTION_NOTIFICATION_DEFAULT_SUBJECT, desc: '管理者却下時：却下通知メール件名' },
    { key: 'REJECTION_NOTIFICATION_BODY',    value: REJECTION_NOTIFICATION_DEFAULT_BODY,    desc: '管理者却下時：却下通知メール本文' },
    // v376.43 (Phase B): 従来ハードコード6メールの件名/本文
    { key: 'TRAINING_APPLY_RECEIPT_SUBJECT', value: TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT,  desc: '研修申込確認メール件名' },
    { key: 'TRAINING_APPLY_RECEIPT_BODY',    value: TRAINING_APPLY_RECEIPT_DEFAULT_BODY,     desc: '研修申込確認メール本文' },
    { key: 'TRAINING_REMINDER_SUBJECT',      value: TRAINING_REMINDER_DEFAULT_SUBJECT,       desc: '研修リマインダーメール件名' },
    { key: 'TRAINING_REMINDER_BODY',         value: TRAINING_REMINDER_DEFAULT_BODY,          desc: '研修リマインダーメール本文' },
    { key: 'AUTH_OTP_SUBJECT',               value: AUTH_OTP_DEFAULT_SUBJECT,                desc: '公開ポータルOTPメール件名' },
    { key: 'AUTH_OTP_BODY',                  value: AUTH_OTP_DEFAULT_BODY,                   desc: '公開ポータルOTPメール本文' },
    { key: 'MEMBER_UPDATE_CONFIRM_SUBJECT',  value: MEMBER_UPDATE_CONFIRM_DEFAULT_SUBJECT,   desc: '会員情報変更確認メール件名' },
    { key: 'MEMBER_UPDATE_CONFIRM_BODY',     value: MEMBER_UPDATE_CONFIRM_DEFAULT_BODY,      desc: '会員情報変更確認メール本文' },
    { key: 'WITHDRAWAL_CONFIRM_SUBJECT',     value: WITHDRAWAL_CONFIRM_DEFAULT_SUBJECT,      desc: '退会申請受付確認メール件名' },
    { key: 'WITHDRAWAL_CONFIRM_BODY',        value: WITHDRAWAL_CONFIRM_DEFAULT_BODY,         desc: '退会申請受付確認メール本文' },
    { key: 'PASSWORD_RESET_SUBJECT',         value: PASSWORD_RESET_DEFAULT_SUBJECT,          desc: 'パスワード再設定コードメール件名' },
    { key: 'PASSWORD_RESET_BODY',            value: PASSWORD_RESET_DEFAULT_BODY,             desc: 'パスワード再設定コードメール本文' },
  ];
  changeRequestEmailDefaults.forEach(function(item) {
    if (!byKey[item.key]) {
      appendRowsByHeaders_(ss, 'T_システム設定', [{
        設定キー: item.key,
        設定値: item.value,
        説明: item.desc,
        更新日時: now,
      }]);
    }
  });

  // v371: メール送信 4 階層ガード（GLOBAL / MODE / ALLOWLIST / CATEGORY）
  // safe-stop default: MAIL_GLOBAL_ENABLED='false' で初回デプロイ時は全メール停止状態で着地。
  // 操作者がシステム設定 UI から true へ変更することで送信再開。
  // 既存の T_システム設定 行があれば上書きしない（if !byKey ガード）。
  var mailGuardDefaults = [
    { key: 'MAIL_GLOBAL_ENABLED',         value: 'false', desc: 'メール送信のグローバルキルスイッチ（false で全停止）' },
    { key: 'MAIL_DELIVERY_MODE',          value: 'LIVE',  desc: '配信モード: LIVE / REDIRECT / SUPPRESS' },
    { key: 'MAIL_REDIRECT_ALLOWLIST',     value: '',      desc: 'REDIRECT モード時の送信先（カンマ区切り）' },
    { key: 'TRAINING_APPLY_RECEIPT_ENABLED', value: 'true', desc: '研修申込確認メール送信ON/OFF' },
    { key: 'TRAINING_REMINDER_ENABLED',   value: 'true', desc: '研修リマインダーメール送信ON/OFF' },
    { key: 'BULK_MAIL_ENABLED',           value: 'true', desc: '一括メール送信ON/OFF' },
    { key: 'AUTH_OTP_ENABLED',            value: 'true', desc: '公開ポータル OTP メール送信ON/OFF' },
    { key: 'MEMBER_UPDATE_CONFIRM_ENABLED', value: 'true', desc: '会員情報変更確認メール送信ON/OFF' },
    { key: 'WITHDRAWAL_CONFIRM_ENABLED',  value: 'true', desc: '退会申請受付確認メール送信ON/OFF' },
    { key: 'PASSWORD_RESET_ENABLED',      value: 'true', desc: 'パスワード再設定確認コードメール送信ON/OFF' },
  ];
  mailGuardDefaults.forEach(function(item) {
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

/**
 * v342: シート header を schema 定義と一致させる。
 *
 * 旧挙動はヘッダー行のみを上書きしていたため、列追加・列挿入・列名変更を伴う
 * schema 変更時にデータ行が旧 column 位置のまま残置され、T_会員 / M_組織マスタ
 * schema-shift incident (2026-05-12, docs/204) と同じ列ズレを再発させる原因となっていた。
 *
 * 現挙動:
 *   - 空シート: ヘッダーを追記
 *   - ヘッダー完全一致: no-op
 *   - データ行なし & ヘッダー不一致: ヘッダーだけ書換 + 余剰列をクリア
 *   - データ行あり & ヘッダー不一致: name-based shift でデータ行を新 schema 位置へリマップ
 *
 * 旧ヘッダーに存在しない新列は '' で埋め、新ヘッダーに存在しない旧列は破棄する。
 * 同名ヘッダーが旧側に複数ある場合は最初に出現した列を採用する。
 */
function writeSheetHeaders_(sheet, headers) {
  var currentLastRow = sheet.getLastRow();
  if (currentLastRow === 0) {
    sheet.appendRow(headers);
    return;
  }

  var currentLastCol = Math.max(1, sheet.getLastColumn());
  var readWidth = Math.max(currentLastCol, headers.length);
  var existingHeaders = sheet.getRange(1, 1, 1, readWidth).getValues()[0];

  var matches = currentLastCol === headers.length;
  if (matches) {
    for (var i = 0; i < headers.length; i += 1) {
      if (String(existingHeaders[i] == null ? '' : existingHeaders[i]) !== String(headers[i] == null ? '' : headers[i])) {
        matches = false;
        break;
      }
    }
  }
  if (matches) return;

  if (currentLastRow < 2) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (currentLastCol > headers.length) {
      sheet.getRange(1, headers.length + 1, 1, currentLastCol - headers.length).clearContent();
    }
    return;
  }

  var oldHeaderIndex = {};
  for (var h = 0; h < currentLastCol; h += 1) {
    var name = String(existingHeaders[h] == null ? '' : existingHeaders[h]);
    if (name && !Object.prototype.hasOwnProperty.call(oldHeaderIndex, name)) {
      oldHeaderIndex[name] = h;
    }
  }

  var oldRows = sheet.getRange(2, 1, currentLastRow - 1, currentLastCol).getValues();
  var migrated = oldRows.map(function(row) {
    return headers.map(function(header) {
      var idx = oldHeaderIndex[String(header == null ? '' : header)];
      return idx == null ? '' : row[idx];
    });
  });

  Logger.log('writeSheetHeaders_: schema drift detected on "' + sheet.getName() +
    '". Migrating ' + migrated.length + ' rows from ' + currentLastCol +
    ' to ' + headers.length + ' columns by header name.');

  if (currentLastCol > headers.length) {
    sheet.getRange(1, headers.length + 1, currentLastRow, currentLastCol - headers.length).clearContent();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, migrated.length, headers.length).setValues(migrated);
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

    // v376.31: 空 tableSheet（lastColumn=0）を skip（getRange が throw して初期化失敗するのを防ぐ）
    var tableLastCol = tableSheet.getLastColumn();
    if (tableLastCol < 1) {
      Logger.log('applyDataValidationRules_: skip empty sheet "' + tableName + '" (lastColumn=0)');
      continue;
    }
    var headerRow = tableSheet.getRange(1, 1, 1, tableLastCol).getValues()[0];
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
    // v376.31: 空シート（lastColumn=0）を skip。これに当たると getRange が
    //   "範囲の列数には 1 以上を指定してください" を throw して初期化全体が失敗していた。
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) {
      Logger.log('protectHeaderRows_: skip empty sheet "' + allSheetNames[i] + '" (lastColumn=0)');
      continue;
    }
    var headerRange = sheet.getRange(1, 1, 1, lastCol);
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
// v376.20: getSheetData_ は getRowsAsObjectsFromSheet_ と機能同一だったため統合・削除。
//   呼び出しは getRowsAsObjectsFromSheet_ に置換済み。


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
  // v376.65（案C Phase 1）: 入会申込画面に出す規程・重要事項（公開フラグの立った行のみ）
  var ppRegulations = listRegulations_(db, true);
  // v376.64: 入会申込の会員種別カードに表示する年会費（正本は M_会員種別.年会費金額）
  var ppMembershipFees = readMemberTypeAnnualFees_(db);
  var ppMembershipFeeVisibleRaw = map['MEMBERSHIP_FEE_PUBLIC_VISIBLE'];
  var ppMembershipFeeVisible = ppMembershipFeeVisibleRaw === undefined || ppMembershipFeeVisibleRaw === ''
    ? MEMBERSHIP_FEE_DEFAULTS.publicVisible
    : String(ppMembershipFeeVisibleRaw) !== 'false';
  var ppMembershipFeeNote = map['MEMBERSHIP_FEE_NOTE'] == null ? MEMBERSHIP_FEE_DEFAULTS.note : String(map['MEMBERSHIP_FEE_NOTE']);
  return JSON.stringify({
    success: true,
    data: {
      regulations: ppRegulations,
      membershipFees: ppMembershipFees,
      membershipFeeVisible: ppMembershipFeeVisible,
      membershipFeeNote: ppMembershipFeeNote,
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
function getFileThumbnail_(payload) {
  var fileUrl = String((payload && payload.fileUrl) || '').trim();
  if (!fileUrl) return { thumbnail: null };
  var requestedSize = Number((payload && payload.size) || 0);

  var fileId = extractDriveFileId_(fileUrl);
  if (!fileId) {
    Logger.log('getFileThumbnail_: cannot extract fileId from url=' + fileUrl);
    return { thumbnail: makePdfSvgPlaceholder_('PDF') };
  }
  if (!isTrainingGuideDriveFileAllowed_(fileId)) {
    Logger.log('getFileThumbnail_: denied non-training fileId=' + fileId);
    return { thumbnail: makePdfSvgPlaceholder_('PDF') };
  }

  var cache = CacheService.getScriptCache();
  var cacheKey = 'thumb_v358_' + fileId + '_s' + (requestedSize || 0);
  try {
    var cached = cache.get(cacheKey);
    if (cached) return { thumbnail: cached };
  } catch (e1) {}

  // v358: 大きいサイズ要求時は thumbnailLink (lh3.googleusercontent.com) を再取得
  if (requestedSize > 0) {
    try {
      var authHeaders = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
      var metaUrl = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) +
        '?fields=thumbnailLink,mimeType,name&supportsAllDrives=true';
      var metaResp = UrlFetchApp.fetch(metaUrl, { muteHttpExceptions: true, headers: authHeaders });
      if (metaResp.getResponseCode() === 200) {
        var meta = JSON.parse(metaResp.getContentText());
        if (meta && meta.thumbnailLink) {
          var sizedLink = meta.thumbnailLink
            .replace(/=s\d+(-.+)?$/, '=w' + requestedSize)
            .replace(/=s\d+$/, '=w' + requestedSize)
            .replace(/=w\d+(-.+)?$/, '=w' + requestedSize);
          var imgResp = UrlFetchApp.fetch(sizedLink, {
            muteHttpExceptions: true,
            followRedirects: true,
            headers: authHeaders,
          });
          if (imgResp.getResponseCode() === 200) {
            var hrBlob = imgResp.getBlob();
            var hrCt = hrBlob.getContentType() || 'image/png';
            if (hrCt.indexOf('image/') === 0) {
              var hrDataUrl = 'data:' + hrCt + ';base64,' + Utilities.base64Encode(hrBlob.getBytes());
              if (hrDataUrl.length < 95 * 1024) {
                try { cache.put(cacheKey, hrDataUrl, 3600); } catch (e2) {}
              }
              return { thumbnail: hrDataUrl };
            }
          } else {
            Logger.log('getFileThumbnail_ high-res link fetch code=' + imgResp.getResponseCode());
          }
        }
      } else {
        Logger.log('getFileThumbnail_ high-res files.get code=' + metaResp.getResponseCode());
      }
      // 高解像度取得が何らかで失敗した場合は通常 PNG 取得経路へ fallback
    } catch (eHr) {
      Logger.log('getFileThumbnail_ high-res error: ' + eHr.message);
    }
  }

  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var contentType = blob.getContentType() || '';
    if (contentType.indexOf('image/') !== 0) {
      // 受け取ったのが PNG ではなく PDF だった等の異常系
      Logger.log('getFileThumbnail_: not an image fileId=' + fileId + ' ct=' + contentType);
      return { thumbnail: makePdfSvgPlaceholder_(file.getName()) };
    }
    var base64 = Utilities.base64Encode(blob.getBytes());
    var dataUrl = 'data:' + contentType + ';base64,' + base64;
    if (dataUrl.length < 95 * 1024) {
      try { cache.put(cacheKey, dataUrl, 3600); } catch (e2) {}
    }
    return { thumbnail: dataUrl };
  } catch (e) {
    Logger.log('getFileThumbnail_: error fileId=' + fileId + ' msg=' + e.message);
    return { thumbnail: makePdfSvgPlaceholder_('PDF') };
  }
}

/**
 * v358: 各種 Drive URL から fileId を堅牢に抽出する共通ヘルパー。
 * 対応形式:
 *   - https://drive.google.com/file/d/<id>/view (or /preview or /edit)
 *   - https://drive.google.com/open?id=<id>
 *   - https://drive.google.com/uc?export=download&id=<id>
 *   - https://drive.google.com/d/<id>
 *   - 単体 fileId 文字列 (28〜44 文字の英数 + - _)
 *   - URL encode された上記
 */
function extractDriveFileId_(url) {
  if (!url) return null;
  var decoded;
  try { decoded = decodeURIComponent(String(url)); } catch (e) { decoded = String(url); }
  var patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{20,})/,
    /\/d\/([a-zA-Z0-9_-]{20,})/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
    /^([a-zA-Z0-9_-]{28,44})$/,
  ];
  for (var i = 0; i < patterns.length; i += 1) {
    var m = decoded.match(patterns[i]);
    if (m && m[1]) return m[1];
  }
  return null;
}

/**
 * Drive proxy の公開面を T_研修 に登録済みの案内 PDF / 生成済みサムネイルだけへ制限する。
 * WebApp は USER_DEPLOYING 権限で Drive を読むため、任意 fileId proxy にならないよう fail-closed。
 */
function isTrainingGuideDriveFileAllowed_(fileId) {
  var targetId = String(fileId || '').trim();
  if (!targetId) return false;
  try {
    var ss = getOrCreateDatabase_();
    var rows = getRowsAsObjects_(ss, 'T_研修');
    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i];
      if (toBoolean_(row['削除フラグ'])) continue;
      if (APP_SECURITY_BOUNDARY === 'public' && !computeTrainingAvailability_(row).isApplicationOpen) continue;
      var pdfId = extractDriveFileId_(row['案内状URL']);
      if (pdfId && pdfId === targetId) return true;
      var thumbId = extractDriveFileId_(row['案内状サムネイルURL']);
      if (thumbId && thumbId === targetId) return true;
    }
  } catch (e) {
    Logger.log('isTrainingGuideDriveFileAllowed_: fail-closed error=' + (e && e.message ? e.message : String(e)));
  }
  return false;
}

/**
 * v357: Drive 上の PDF 本体の bytes を base64 で返す。lightbox 内 iframe で
 * ブラウザ内蔵 PDF viewer に表示する用途。
 *
 * 背景: Drive の /file/d/<id>/preview を直接 iframe で埋め込むと、Drive が
 * CSP `frame-ancestors https://drive.google.com` を返すため外部からの埋め込み
 * が CSP 違反でブロックされる (2024 以降の Google セキュリティ強化)。
 * GAS server で PDF bytes を取得して base64 で返し、client で blob URL を
 * 作って iframe に渡せば CSP の制約を受けない。
 *
 * 制限: 大きい PDF を毎回 client へ送るとレスポンス時間が伸びるため、
 * 10MB 超のファイルは error code で返して client に「別タブで開く」案内へ
 * 切り替えてもらう。
 */

function makePdfSvgPlaceholder_(name) {
  var safe = String(name || 'PDF')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 60);
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">' +
    '<rect width="320" height="180" fill="#f1f5f9"/>' +
    '<text x="160" y="80" text-anchor="middle" font-family="sans-serif" font-size="42" fill="#94a3b8">PDF</text>' +
    '<text x="160" y="130" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#475569">' + safe + '</text>' +
    '</svg>';
  return 'data:image/svg+xml;base64,' + Utilities.base64Encode(Utilities.newBlob(svg, 'image/svg+xml').getBytes());
}

function getPublicTrainings_() {
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheet = db.getSheetByName('T_研修');
  var rows = getRowsAsObjectsFromSheet_(sheet);
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
      applicationUrl: String(r['申込URL'] || ''), // v376.30: 外部申込フォーム URL
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
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    backfillApplicationApplicantIdentity_(db);

    var trainingSheet = db.getSheetByName('T_研修');
    var trainingRows = getRowsAsObjectsFromSheet_(trainingSheet);
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
    var externalRows = getRowsAsObjectsFromSheet_(externalSheet);

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

    var applyId = generateTrainingApplyId_();
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

    try {
      // v376.43: 件名/本文を設定値（無ければ既定）から差し込み描画。
      var applyMail = renderConfiguredMail_(db, 'TRAINING_APPLY_RECEIPT_SUBJECT', 'TRAINING_APPLY_RECEIPT_BODY',
        TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT, TRAINING_APPLY_RECEIPT_DEFAULT_BODY, {
          '申込者名': name,
          '研修名': String(training['研修名'] || ''),
          '開催日': formatDateForApi_(training['開催日']),
          '申込ID': applyId,
        });
      deliverMail_('TRAINING_APPLY_RECEIPT', email, applyMail.subject, applyMail.body);
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
  var applyRows = getRowsAsObjectsFromSheet_(applySheet);

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
  var externalRows = getRowsAsObjectsFromSheet_(externalSheet);
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
  // v372.4: 大文字統一を追加（旧 8 桁数字データには影響なし）。HN/HS プレフィックス等の英字比較を統一。
  return String(cm || '').trim().replace(/\s/g, '').toUpperCase();
}

// v372.4: 介護支援専門員番号バリデーション + 大文字統一
// 厳格: 8 桁の半角数字（公開ポータルでの基本ルール）
// 緩和: 1〜10 桁の半角英数字（admin 例外運用）— 例: 看護師 HN12345678 / 社会福祉士 HS12345678
var CM_NUMBER_STRICT_RE_ = /^\d{8}$/;
var CM_NUMBER_RELAXED_RE_ = /^[A-Za-z0-9]{1,10}$/;
function isValidCmNumberRelaxed_(v) {
  return CM_NUMBER_RELAXED_RE_.test(String(v || '').trim());
}
// DB 保存時の正規化（trim + 大文字化）。空文字は空のまま返す。
function normalizeCmNumberForStorage_(v) {
  var s = String(v || '').trim();
  if (!s) return '';
  return s.toUpperCase();
}
// adminSession から MASTER/ADMIN 権限を判定（CM 番号緩和許可の単一判定箇所）
function isAllowedRelaxedCmNumber_(adminSession) {
  if (!adminSession) return false;
  var perm = String(adminSession.adminPermissionLevel || '').toUpperCase();
  return perm === 'MASTER' || perm === 'ADMIN';
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
           !isInactiveMemberStatusForIdentity_(r['会員状態コード']) &&
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
  // v376.43: 件名/本文を設定値（無ければ既定）から差し込み描画。認証コード欠落を安全ガード。
  var otpMail = renderConfiguredMail_(ss, 'AUTH_OTP_SUBJECT', 'AUTH_OTP_BODY',
    AUTH_OTP_DEFAULT_SUBJECT, AUTH_OTP_DEFAULT_BODY, {
      '会員名': memberName,
      '用途': purposeLabel,
      '認証コード': otp,
      '有効期限': '10分間',
    }, otp);
  deliverMail_('AUTH_OTP', email, otpMail.subject, otpMail.body);

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
      // v376.43: 件名/本文を設定値（無ければ既定）から差し込み描画。
      var updMail = renderConfiguredMail_(ss, 'MEMBER_UPDATE_CONFIRM_SUBJECT', 'MEMBER_UPDATE_CONFIRM_BODY',
        MEMBER_UPDATE_CONFIRM_DEFAULT_SUBJECT, MEMBER_UPDATE_CONFIRM_DEFAULT_BODY, { '氏名': memberName2 });
      deliverMail_('MEMBER_UPDATE_CONFIRM', toEmail, updMail.subject, updMail.body);
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
  cache.remove(tokenKey);

  var toEmail = String(mRow[mCols['代表メールアドレス']] || '').trim();
  var memberName3 = (String(mRow[mCols['姓']] || '') + ' ' + String(mRow[mCols['名']] || '')).trim();
  if (toEmail) {
    // v376.43: 件名/本文を設定値（無ければ既定）から差し込み描画。
    var wdMail = renderConfiguredMail_(ss, 'WITHDRAWAL_CONFIRM_SUBJECT', 'WITHDRAWAL_CONFIRM_BODY',
      WITHDRAWAL_CONFIRM_DEFAULT_SUBJECT, WITHDRAWAL_CONFIRM_DEFAULT_BODY, {
        '会員名': memberName3,
        '退会予定日': withdrawnDate,
        '会員マイページURL': MEMBER_PORTAL_URL,
      });
    deliverMail_('WITHDRAWAL_CONFIRM', toEmail, wdMail.subject, wdMail.body);
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
    if (isInactiveMemberStatusForIdentity_(r['会員状態コード'])) return false;
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
        deliverMail_('MEMBER_UPDATE_CONFIRM', emailTo,
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
  // v372.6 fix: UTF-8 charset を明示しないと日本語が ? に化ける（Utilities.base64EncodeWebSafe のデフォルト挙動）
  var encoded = Utilities.base64EncodeWebSafe(payload, Utilities.Charset.UTF_8);
  var sigBytes = Utilities.computeHmacSha256Signature(encoded, secret, Utilities.Charset.UTF_8);
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
    // v372.6 fix: HMAC sign 時と verify 時で charset を統一（UTF-8）
    var expectedSigBytes = Utilities.computeHmacSha256Signature(encoded, secret, Utilities.Charset.UTF_8);
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
    if (isInactiveMemberStatusForIdentity_(r['会員状態コード'])) return false;
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

// v372.5: 事業所会員の在籍職員一覧を取得（公開ポータル staffUpdate フロー用）
// HMAC token 経由で BUSINESS 会員のみアクセス可。最小限の情報のみ返却。
function getPublicEnrolledStaffList_(payload) {
  var token = String(payload.token || '').trim();
  var stored = verifyPublicIdentityToken_(token);
  if (!stored) return { error: 'token_expired' };
  if (stored.memberType !== 'BUSINESS') return { error: '事業所会員専用の操作です' };

  var ss = getOrCreateDatabase_();
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員ID'] || '') === stored.memberId &&
           String(r['職員状態コード'] || '') === 'ENROLLED';
  });
  var list = staffRows.map(function(s) {
    var cm = String(s['介護支援専門員番号'] || '');
    // v372.4 緩和ルール: 8桁数字以外（admin 例外で入力された値）は公開ポータルで編集不可
    var isRelaxed = !!cm && !/^\d{8}$/.test(cm);
    return {
      staffId: String(s['職員ID'] || ''),
      lastName: String(s['姓'] || ''),
      firstName: String(s['名'] || ''),
      lastKana: String(s['セイ'] || ''),
      firstKana: String(s['メイ'] || ''),
      email: String(s['メールアドレス'] || ''),
      careManagerNumber: cm,
      role: String(s['職員権限コード'] || ''),
      careManagerNumberLocked: isRelaxed, // 10桁等の特殊 CM 番号は公開ポータルで編集不可
    };
  });
  return { staff: list };
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
        var rawValue = String(payload.fields[fk] || '').trim();
        // v376: kana 列は全角カタカナに正規化（不正文字は throw）
        if (fk === 'lastKana' || fk === 'firstKana') {
          rawValue = normalizeAndValidateKana_(rawValue, fk === 'lastKana' ? 'セイ' : 'メイ');
        }
        sanitizedFields[fk] = rawValue;
      }
    }
  }

  var changeData = {
    fields: sanitizedFields,
    staffAdd: [],
    staffRemove: [],
    staffUpdate: [], // v372.5: 既存職員の情報変更
  };

  // 事業所会員: スタッフ追加（必須フィールド検証）
  if (Array.isArray(payload.staffAdd)) {
    payload.staffAdd.forEach(function(s) {
      var lastName = String(s.lastName || '').trim();
      var firstName = String(s.firstName || '').trim();
      // v376: kana を normalize + validate（不正なら throw → このエントリは弾かれない代わりに申請自体が失敗）
      var lastKana = normalizeAndValidateKana_(s.lastKana || '', '職員のセイ');
      var firstKana = normalizeAndValidateKana_(s.firstKana || '', '職員のメイ');
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

  // v372.5: 事業所会員: 既存職員の情報変更（staffId 指定 + 変更したいフィールドのみ含める）
  if (Array.isArray(payload.staffUpdate)) {
    var updateAllowlist_ = ['lastName', 'firstName', 'lastKana', 'firstKana', 'email', 'careManagerNumber'];
    payload.staffUpdate.forEach(function(s) {
      var staffId = String(s.staffId || '').trim();
      if (!staffId) return;
      var entry = { staffId: staffId };
      var hasAny = false;
      for (var k = 0; k < updateAllowlist_.length; k++) {
        var f = updateAllowlist_[k];
        if (!Object.prototype.hasOwnProperty.call(s, f)) continue;
        var v = String(s[f] || '').trim();
        if (v === '') continue; // 空欄 = 変更なし
        if (f === 'careManagerNumber') {
          // 公開ポータルは厳格 8 桁数字のみ。admin 緩和入力分（HN/HS 等）は更新不可
          if (!/^\d{8}$/.test(v)) continue;
        } else if (f === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) continue;
        } else if (f === 'lastKana' || f === 'firstKana') {
          // v376: kana 列は全角カタカナに正規化（不正文字は throw）
          v = normalizeAndValidateKana_(v, f === 'lastKana' ? '職員のセイ' : '職員のメイ');
        }
        entry[f] = v;
        hasAny = true;
      }
      if (hasAny) changeData.staffUpdate.push(entry);
    });
  }

  // v372.6 fix: 全空の申請は拒否（fields も staffAdd/Remove/Update も空 / WITHDRAWAL は例外）
  var hasAnyChange = (changeData.fields && Object.keys(changeData.fields).length > 0)
    || (changeData.staffAdd && changeData.staffAdd.length > 0)
    || (changeData.staffRemove && changeData.staffRemove.length > 0)
    || (changeData.staffUpdate && changeData.staffUpdate.length > 0)
    || requestType === 'WITHDRAWAL';
  if (!hasAnyChange) {
    return { success: false, error: '変更内容が指定されていません。変更したい項目に入力してください。' };
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

  // v368: 申請者への受付確認メール（テンプレ化）
  sendApplicationReceiptMail_(ss, {
    contactEmail: stored.contactEmail,
    applicantName: stored.applicantName,
    requestId: requestId,
    requestType: requestType,
    memberTypeLabel: memberTypeLabel_(stored.memberType),
  });

  return { success: true, requestId: requestId };
}

// ── 管理者: 変更申請一覧取得 ──────────────────────────────────────────────────

// ── 管理者: 変更申請を承認し変更を適用 ─────────────────────────────────────────

// ── 管理者: 変更申請を却下 ──────────────────────────────────────────────────

// addPublicStaffMember_ の管理者承認経由呼び出し対応（_directMemberId でトークン不要）
var _origAddPublicStaffMember = addPublicStaffMember_;

// ── v264 変更申請キュー ここまで ────────────────────────────────────────────






// ── v371: メール送信の 4 階層ガード（GLOBAL / MODE / ALLOWLIST / CATEGORY）──
// 設計: docs/227_MAIL_KILL_SWITCH_2026-05-18.md
//   [1] MAIL_GLOBAL_ENABLED         — 全停止スイッチ（default true: 既存挙動維持）
//   [2] MAIL_DELIVERY_MODE          — LIVE / REDIRECT / SUPPRESS (default LIVE)
//   [3] MAIL_REDIRECT_ALLOWLIST     — REDIRECT モード時の宛先 (CSV)
//   [4] {category}_ENABLED          — カテゴリ別 ON/OFF (既存 9 + 補完 5)
function mailDispatchPolicy_() {
  try {
    var ss = getOrCreateDatabase_();
    var globalRaw = String(getSystemSettingValue_(ss, 'MAIL_GLOBAL_ENABLED') || '').trim();
    var globalEnabled = globalRaw === '' ? true : globalRaw.toLowerCase() !== 'false';
    if (!globalEnabled) return { mode: 'SUPPRESS', reason: 'global_disabled' };

    var rawMode = String(getSystemSettingValue_(ss, 'MAIL_DELIVERY_MODE') || 'LIVE').trim().toUpperCase();
    if (rawMode === 'SUPPRESS') return { mode: 'SUPPRESS', reason: 'mode_suppress' };
    if (rawMode === 'REDIRECT') {
      var allowlist = String(getSystemSettingValue_(ss, 'MAIL_REDIRECT_ALLOWLIST') || '')
        .split(',')
        .map(function(s){ return s.trim(); })
        .filter(function(s){ return s.length > 0; });
      if (allowlist.length === 0) return { mode: 'SUPPRESS', reason: 'redirect_no_allowlist' };
      return { mode: 'REDIRECT', allowlist: allowlist };
    }
    return { mode: 'LIVE' };
  } catch (e) {
    // fail-safe: infra error 時は LIVE で進める（本番運用中の事故防止優先）
    Logger.log('mailDispatchPolicy_ infra error (defaulting LIVE): ' + e.message);
    return { mode: 'LIVE' };
  }
}

// メール送信の中央集約ラッパー
// category: 'BULK_MAIL' / 'TRAINING_REMINDER' 等。null/未指定なら GENERAL 扱いで GLOBAL/MODE のみ判定。
// to/subject/body/options: 既存 sendEmailWithValidatedFrom_ と互換
// 戻り値: { sent: bool, suppressed?: bool, reason?: string, mode?: string }
// v376.66: 未置換の差し込みタグ {{...}} を除去して返す。除去したタグ名だけをログに残す
// （本文・宛先は出さない＝AGENTS §0）。差し込み漏れは「タグがそのまま届く」という
// 目に見える事故になるため、送信直前で必ず落とす。
function stripUnresolvedMergeTags_(text, category, part) {
  var src = String(text == null ? '' : text);
  if (src.indexOf('{{') < 0) return src;
  var found = [];
  var stripped = src.replace(/\{\{\s*([^{}]{1,60}?)\s*\}\}/g, function(_all, name) {
    found.push(String(name));
    return '';
  });
  if (found.length) {
    Logger.log('[mail/unresolved-merge-tag] category=' + (category || 'GENERAL')
      + ' part=' + part + ' tags=' + found.join(',') );
  }
  return stripped;
}

function deliverMail_(category, to, subject, body, options) {
  // [4] カテゴリ別フラグ
  if (category) {
    try {
      var catKey = String(category).toUpperCase() + '_ENABLED';
      var catRaw = String(getSystemSettingValue_(getOrCreateDatabase_(), catKey) || '').trim();
      var catEnabled = catRaw === '' ? true : catRaw.toLowerCase() !== 'false';
      if (!catEnabled) {
        Logger.log('[mail/category-disabled] category=' + category + ' to=' + to + ' subject=' + subject);
        return { sent: false, suppressed: true, reason: 'category_disabled' };
      }
    } catch (e) {
      // カテゴリ判定失敗時は default 通過（GLOBAL/MODE で受け止める）
    }
  }
  // v376.66: 差し込み漏れの {{タグ}} をそのまま会員へ送らない（最後の砦）。
  // v376.66 以前は、送信側が知らないタグを本文に書くと raw の「{{会員種別}}」が届いていた。
  // ここで除去し、どのカテゴリでどのタグが未解決だったかをログに残す（値は出さない）。
  subject = stripUnresolvedMergeTags_(subject, category, 'subject');
  body = stripUnresolvedMergeTags_(body, category, 'body');
  var policy = mailDispatchPolicy_();
  if (policy.mode === 'SUPPRESS') {
    Logger.log('[mail/' + policy.reason + '] suppressed category=' + (category || 'GENERAL') + ' to=' + to + ' subject=' + subject);
    return { sent: false, suppressed: true, reason: policy.reason };
  }
  var finalTo = to;
  var finalSubject = subject;
  var finalBody = body;
  if (policy.mode === 'REDIRECT') {
    var origTo = String(to || '');
    finalTo = policy.allowlist.join(',');
    Logger.log('deliverMail_ REDIRECT category=' + (category || 'GENERAL') + ' originalTo=' + origTo + ' redirectedTo=' + finalTo);
  }
  var finalOptions = options || {};
  if (isAutomatedMailCategory_(category) && !String(finalOptions.from || '').trim()) {
    finalOptions = buildAutomatedMailOptions_(getOrCreateDatabase_(), finalOptions);
  }
  sendEmailWithValidatedFrom_(finalTo, finalSubject, finalBody, finalOptions);
  return { sent: true, mode: policy.mode };
}

// 一括メールやLINE通知は操作者が送信元を選ぶため対象外。自動通知だけを共通設定へ集約する。
function isAutomatedMailCategory_(category) {
  var automatic = {
    APPLICATION_RECEIPT: true,
    APPROVAL_NOTIFICATION: true,
    REJECTION_NOTIFICATION: true,
    CREDENTIAL_EMAIL: true,
    BIZ_REP_EMAIL: true,
    BIZ_STAFF_EMAIL: true,
    STAFF_ADD_STAFF_EMAIL: true,
    STAFF_ADD_REP_EMAIL: true,
    TRAINING_APPLY_RECEIPT: true,
    TRAINING_REMINDER: true,
    AUTH_OTP: true,
    MEMBER_UPDATE_CONFIRM: true,
    WITHDRAWAL_CONFIRM: true,
    PASSWORD_RESET: true,
  };
  return !!automatic[String(category || '').toUpperCase()];
}

// 既存 CREDENTIAL_EMAIL_FROM を「自動通知の共通送信元」として後方互換で利用する。
// 空欄時は GAS の標準送信元を使う。指定済み alias が使えない場合は GmailApp が例外にし、
// 実行者アドレスへ黙ってフォールバックさせない。
function buildAutomatedMailOptions_(ss, options) {
  var configuredFrom = String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim();
  var merged = {};
  var src = options || {};
  for (var key in src) {
    if (Object.prototype.hasOwnProperty.call(src, key)) merged[key] = src[key];
  }
  if (configuredFrom && !String(merged.from || '').trim()) {
    merged.from = configuredFrom;
    if (!String(merged.replyTo || '').trim()) merged.replyTo = configuredFrom;
  }
  if (!String(merged.name || '').trim()) merged.name = '枚方市介護支援専門員連絡協議会';
  return merged;
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

// v376.4: 過去運用で投入されたデモアカウント + T_外部申込者 テスト 3 件の棚卸し・soft delete。
//   対象（保守的に ID 厳格マッチ）:
//   - T_認証アカウント: ログインID が demo- で始まる
//   - T_会員: 上記認証に紐づく 会員ID + 'DEMO-' プレフィックス
//   - T_事業所職員: 上記認証に紐づく 職員ID + 上記会員に属する職員
//   - T_外部申込者: 氏名 or フリガナ が「テスト」「ガイブ」「セイゴウカクニン」のいずれかを含む
//   いずれも soft delete（削除フラグ=true）のみ。




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
 * ランダムパスワードを生成する（PASSWORD_GENERATED_LENGTH 文字、英数字のみ）
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
 * v207/v291: 宛名リスト Excel（.xlsx）出力
 *
 * payload: { filterType: 'KOHOUSHI' | 'KOHOUSHI_ONLY' | 'OSHIRASE', year?: number, targetKeys?: string[] }
 *   KOHOUSHI: 広報誌発送 — ACTIVE + WITHDRAWAL_SCHEDULED の全会員
 *   KOHOUSHI_ONLY: 広報誌のみ発送 — KOHOUSHI のうち OSHIRASE 対象外
 *   OSHIRASE: お知らせ発送 — 事業所会員全員 + 個人/賛助のうち 発送方法コード='POST'
 *
 * targetKeys 指定時は、バックエンドで再計算した発送対象候補との交差だけを出力する。
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

// ─── v372: 名簿出力 Visual Template Designer 用 API ───────────────────────────

/**
 * フィールド辞書: 列ビルダー UI で表示する全候補フィールドのメタ情報。
 * フロントエンドはこの辞書からチェックボックスを生成し、出力列に追加可能。
 * 新フィールド追加時はこの辞書のみ更新すればフロント改修不要。
 */

/**
 * Visual Template Designer 用に会員データをフラット化して返す。
 * 辞書の全キーを raw 文字列で含む（v373.7 までは旧 getMembersForRoster_ と並存していたが現在は唯一の経路）。
 * フロントエンドは row[fieldKey] でアクセスできる。
 */

/**
 * ROSTER_TEMPLATE_LIBRARY_V2 の読み込み（T_システム設定 から JSON 取得）。
 */




// ─────────────────────────────────────────────────────────────────────────
// v374.1: 公式LINE投稿依頼（管理者ポータル → LINE 担当者への依頼集約）
// ─────────────────────────────────────────────────────────────────────────

var LINE_POST_STATUS_DRAFT = 'DRAFT';
var LINE_POST_STATUS_REQUESTED = 'REQUESTED';
var LINE_POST_STATUS_POSTED = 'POSTED';
var LINE_POST_TARGET_GENERAL = 'GENERAL';
var LINE_POST_TARGET_TRAINING = 'TRAINING';
var LINE_POST_TEXT_MAX = 500;
var LINE_POST_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
var LINE_POST_ATTACHMENT_KIND_IMAGE = 'IMAGE';
var LINE_POST_ATTACHMENT_KIND_PDF = 'PDF';




// v376.45: LINE投稿「管理」権限（全件閲覧・投稿済みマーク・状態変更）の判定。
// MASTER または allowedMenus に line-post-manage を持つ session のみ true。







// v376.44: 公式LINE投稿依頼の保存フロー dryRun E2E（operator が editor ▶ で実行）。
// ヘッダー自己修復 → 新規保存 → 取得 → soft delete を実 DB で検証する（非送信・テスト行は削除済で残る）。
// v376.44 の「T_LINE投稿依頼 がヘッダー欠落で保存不可（範囲の列数エラー）」回帰を捕捉する目的。

// v376.45: LINE投稿 権限二層 + 可視範囲 + submitRequest + 名前/日時 の dryRun E2E（operator が editor ▶）。
// 合成 __adminSession を渡して、非管理者の可視スコープと post 権限ガードを実 DB で検証する（非送信）。












// ══ v376.52: 会員系削除 cascade アーカイブ（docs/249・a1 単一化）═══════════════
// 削除対象の会員/職員に紐づく行を live から除去し <table>_archive へ「移動」する。
// - 退避行にはサロゲート3列（アーカイブID/削除バッチID/アーカイブ日時）を付与
// - 削除バッチID = T_削除ログ.ログID。復元は同一バッチの全行を戻す（会員単位アトミック）
// - T_ログイン履歴 は archive せず物理 purge（高volume・PII 最小化）
// - 退会フロー（withdrawMember 系）はこの cascade を呼ばない（履歴保持・docs/249 §4.4）

// テーブル → 「live 行が削除対象会員系に属するか」の一致条件（cascade と診断の共通定義）

// 共通ムーバ: matchFn に一致する行を live から除去し <table>_archive へ append する。
// archive シートのヘッダー欠落（列数0）は自己修復する。戻り値は移動件数。

// 削除対象認証IDのログイン履歴を log スプレッドシートから物理削除する（docs/249: purge 確定）

// cascade オーケストレータ: 支払いID/認証ID を移動前に解決 → 13テーブル移動 → ログイン履歴 purge

// 復元: 各 archive から 削除バッチID 一致行を live へ戻す（サロゲート3列は落とす）

// operator 実行（▶ 引数なし）: 直近の削除バッチ（T_削除ログ 最終行）を復元する

// operator 実行（▶ 引数なし）: archive 内の削除バッチ一覧（バッチID別件数 + 削除ログ情報）

// operator 実行（▶ 引数なし・read-only）: 現 DB の削除負債を診断する（docs/249 §7）。
// 旧削除実装（in-place soft delete）で live に残った削除済み会員/職員と、
// それらを参照して取り残された子テーブル行（孤児候補）を計測する。非破壊。

// ── dryRun E2E（operator 実行・実DB・自己完結: 投入→cascade→検証→復元→検証→掃除）──
var DRYRUN_CASCADE_TAG = 'DRYRUN_CASCADE';


// dryRun fixture 行のカウント（liveOnly=false で live 側 / true で archive 側）

// dryRun 残骸の物理 sweep（live/archive/削除ログ/ログSS から DRYRUN_CASCADE 行を除去・冪等）

// いずれかのセルが prefix で始まる行を物理削除する（dryRun sweep 用）





/**
 * ログSSのスキーマを再構築する（既存ログSSのシートが壊れた場合など）。
 */


/**
 * 退会済み会員（指定年数以上前）をアーカイブシートに移動する（定期実行用）。
 * デフォルトは退会から3年以上経過した会員をアーカイブ対象とする。
 * 実行前に schema maintenance でアーカイブシートが作成済みであること。
 */

// v376.36: 退会済み行を archive へ「移動」（追記 + ソースから物理削除）。
//   - keyCol（会員ID/職員ID）で冪等化: 既に archive 済みの key は二重追記せずソースから除去（自己修復）
//   - archive 行は dst ヘッダー順にマップして構築し、surrogate `アーカイブID` と `アーカイブ日時` を付与
//   - dst スキーマを実行時に normalizeTableColumns_ で最新化（アーカイブ列を保証）

/**
 * LOG_SPREADSHEET_ID をこのプロジェクトのスクリプトプロパティに設定する。
 * admin/member split に同じログSSIDを適用するために使用する。
 */
var PASSWORD_MAX_LENGTH = 20;
var PASSWORD_GENERATED_LENGTH = 15;
// v331: 許可文字 — ASCII 英数 + 安全記号のみ。エスケープ可能な記号
// (\ ` ' " < > &)、空白、制御文字は禁止（インジェクション・XSS・コマンド注入対策）。
var PASSWORD_ALLOWED_REGEX = /^[A-Za-z0-9!@#$%^*()_+=\-\[\]{};:,.?\/|~]+$/;
var PASSWORD_HASH_PEPPER_PROPERTY = 'PASSWORD_HASH_PEPPER_V1';
var PASSWORD_HASH_PEPPER_ID = 'v1';
// v373.5: Google Cloud Secret Manager 連携用 — Script Properties から GCP project ID と secret 名を取得
// `PASSWORD_HASH_PEPPER_GCP_PROJECT` が未設定なら hcmn-member-system-prod を既定値とする
var PASSWORD_HASH_PEPPER_GCP_PROJECT_PROPERTY = 'PASSWORD_HASH_PEPPER_GCP_PROJECT';
var PASSWORD_HASH_PEPPER_GCP_PROJECT_DEFAULT = 'hcmn-member-system-prod';
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


/**
 * v373.5: pepper 取得ヘルスチェック（admin Apps Script editor からの手動実行用）。
 * 値は出力せず、source / length / SHA-256 fingerprint のみ Logger に返す。
 * operator が Secret Manager セットアップ後に Apps Script editor から実行して検証する。
 * admin split のみ top-level callable として残す（member/public からは pruning）。
 */

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


// ============================================================
// v376.54 (GCP Phase B / docs/240 §4, docs/250 §5): Cloud Run Argon2id 連携
// ============================================================



/**
 * Cloud Run password-hash service の共通呼び出し。
 * - 認証: ScriptApp.getIdentityToken()（openid scope 必須・aud は Cloud Run custom audiences 登録済）
 * - 失敗時は throw（fail-closed）。token / password / pepper / response body は例外メッセージ・ログに出さない（AGENTS §0）。
 */

/**
 * Cloud Run Argon2id でパスワードをハッシュする。
 * salt 引数は PHC 文字列（$argon2id$...）内に salt が含まれるため未使用（PBKDF2 系との drop-in 互換用）。
 * 返り値: "argon2id:v1:$argon2id$v=19$m=19456,t=2,p=1$..."
 */

// ============================================================
// v295: 役員管理 — マスタ管理 / 役員割当て / 口座 / 支払い
// ============================================================

// ---------- 役員マスタデータ一括取得 ----------


// ---------- M_組織マスタ CRUD ----------



// ---------- M_役職マスタ CRUD ----------



// ---------- M_支払い種別マスタ CRUD ----------



// ---------- M_業務分類 CRUD ----------



// ---------- 役員ステータス確認ヘルパー ----------

// v297: memberId（個人/賛助）または staffId（事業所職員）のいずれかでチェック

// ---------- T_役員 管理 ----------





// ---------- T_振込口座 管理 ----------




// 会員自身の役員ステータス + 口座取得（会員ポータル用）
// processApiRequest で sessionToken 検証済み → memberId・staffId が確定済み




// ---------- T_支払い / T_支払い明細 / T_請求 管理 ----------




// ============================================================
// v296: 請求管理 — Drive フォルダ / 請求 CRUD / ファイル管理
// ============================================================

var CLAIM_ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
var CLAIM_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ---------- Drive フォルダ ----------


// ---------- 請求 CRUD ----------








// ---------- 添付ファイル管理 ----------



// ============================================================
// v297: 役員紐づけ変更 / 退職自動退任
// ============================================================

/**
 * 役員の紐づけを変更する（個人会員↔事業所職員の双方向対応）。
 * T_振込口座 の linkage も同時に更新する。
 * T_請求 の過去レコードは元の紐づけのまま保持（履歴として有効）。
 */


/**
 * T_研修申込 の既存行を 2-FK 化:
 *  - 申込者区分=EXTERNAL かつ 外部申込者ID が空の行: 申込者ID を 外部申込者ID へ複写
 *  - 既存 申込者ID / 申込者区分コード は維持（v361 以降で物理削除予定）
 */

/**
 * 既存 T_研修申込 行の 出欠状態コード を UNRECORDED で backfill。
 */

/**
 * 出欠状態を 1 件記録。
 */

/**
 * 出欠を一括更新（全員出席セット等）。
 */

/**
 * 管理者による申込者の手動追加（会員・職員）。
 * payload: { trainingId, memberId? | staffId? }
 */

/**
 * 管理者によるゲスト（非会員）申込追加。T_外部申込者 + T_研修申込 を 1 トランザクションで作成。
 * payload: { trainingId, guest: { name, kana?, email?, phone?, officeName? } }
 */

/**
 * 管理者による申込キャンセル。物理削除はせず、申込状態=CANCELED + 取消日時 を記録。
 */

/**
 * 申込レコードの編集（事務局メモのみ変更可能 - データ整合性のため）。
 */

/**
 * 研修の集計指標を返す（残席・区分内訳・出欠率・事業所別）。
 */

/**
 * 会員ごとの受講履歴を返す。
 * payload: { memberId? | staffId? | externalId? }
 */

var DRYRUN_EMAIL_DOMAIN = '@example.invalid';  // RFC 2606 reserved
var DRYRUN_MANIFEST_KEY = 'DRYRUN_APPLICATION_MANIFEST_V1';
var DRYRUN_TRAINING_MGMT_MANIFEST_KEY = 'DRYRUN_TRAINING_MGMT_MANIFEST_V1';

// テストで作成した training / 申込 / 外部申込者 を物理削除（行削除）。
// v376.14.2: manifest だけでなく DRYRUN_ プレフィックスの研修・外部申込者を sweep し、
//   過去 run の孤児データ（manifest 上書きで参照が外れた分）も含めて確実に削除する。

// 指定キーに一致する行を物理削除（行番号降順で deleteRow して index ずれを回避）。

















// ── シナリオ実装 ─────────────────────────────────────────────────────────







// ── メインエントリ ───────────────────────────────────────────────────────



