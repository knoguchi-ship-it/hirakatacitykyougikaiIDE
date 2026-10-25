// BUILD_INPUT_SHA256: 426c467a4c5b78772a66b3c2c025533e28b833da45329ee6edf3763a1ba03ed8
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
// 版を上げるリリースの前に rehearseSchemaMigrationOnCopy_APPLY を本番 DB のコピーで流し、OK を確かめてから上げる。
// push するとトリガーが最新のコードで動くため、先に上げて push すると確かめる前に本番で整備が走る。
// 2026-10-19: BR-21 の 4 列。リハーサル OK（既存データの変化 0・2 回目の変化 0・書いて読む 22 列）
// 2026-10-25: T_支払い.職員ID（末尾）。リハーサル OK（既存データの変化 0・2 回目の変化 0・書いて読む 34 列・docs/311）
var DB_SCHEMA_VERSION = '2026-10-25-officer-payment-staff-v376.131';

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

// v376.99: ログインIDが変わったことを伝える通知。
// 以前は公開ポータルの画面に「⚠ 変更するとログインIDも変わります」と書いていたが、
// 会員マイページを展開していない現状では読んでも行き場がなく、矛盾した案内になる。
// 変わった事実を、変わった後にメールで伝える方式へ改めた。
var LOGIN_ID_CHANGED_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】ログインIDの変更のお知らせ';
var LOGIN_ID_CHANGED_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'ご登録内容の変更にともない、ログインIDが変更されました。',
  '',
  '旧ログインID: {{旧ログインID}}',
  '新ログインID: {{新ログインID}}',
  '',
  'パスワードは変更されていません。',
  'お心当たりのない場合は、お早めに事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v376.99: 連絡先メールアドレス変更の通知。旧・新の両方へ送る（乗っ取り検知のため）。
// 以前は職員情報変更の承認処理に固定文が直書きされており、管理画面から直せなかった。
var CONTACT_EMAIL_CHANGED_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】登録メールアドレス変更のお知らせ';
var CONTACT_EMAIL_CHANGED_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'ご登録のメールアドレスが変更されました（この案内は{{宛先区分}}宛です）。',
  '',
  '旧アドレス: {{旧メールアドレス}}',
  '新アドレス: {{新メールアドレス}}',
  '',
  '今後のご連絡は新アドレス宛てに送信されます。',
  'お心当たりのない場合は、お早めに事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var WITHDRAWAL_CONFIRM_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】退会申請受付のご確認';
// v376.99: 「（年度末）」を直書きしていたため、v376.92 で入った即時退会でも
// 年度末と書かれてしまっていた。方式は差し込みタグで出す。
var WITHDRAWAL_CONFIRM_DEFAULT_BODY = [
  '{{会員名}} 様',
  '',
  '退会のお手続きが完了しました。',
  '',
  '退会方式: {{退会方式}}',
  '退会日: {{退会予定日}}',
  '',
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
  // 2026-10-02: プライバシーポリシーの掲載先。**既定は空**にする。
  // URL は外部サイト（Google Sites）にあり移動しうるので、コードではなくデータで持つ。
  // 空のときは画面にリンクを出さない（押せるのにどこへも飛ばない状態を作らない）。
  // 定款の掲載先が変わってリンクが古くなった件（T_規程 REG-005）と同じ轍を踏まないため。
  privacyPolicyUrl: '',
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
    '申込内容を事務局で確認し、承認後にログイン情報をご登録のメールアドレスへお送りします。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '追加確認が必要な場合のみ、事務局からご連絡します。'
  ].join('\n'),
  completionGuidanceBodyWhenCredentialNotSent: [
    'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '追加確認が必要な場合のみ、事務局からご連絡します。'
  ].join('\n'),
  completionLoginInfoBlockVisible: true,
  completionLoginInfoVisible: true,
  completionLoginInfoBodyWhenCredentialSent: 'ログイン情報は画面に表示していません。登録済みのメールをご確認ください。',
  completionLoginInfoBodyWhenCredentialNotSent: 'ログイン情報メールは現在送信していません。公開準備後にご案内します。',
  completionNoCredentialNotice: 'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
  completionCredentialNotice: '申込内容を事務局で確認し、承認後にログイン情報をご登録のメールアドレスへお送りします。',
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
  memberUpdateDescription: '住所・電話番号・メールアドレスなど、ご登録情報の変更を申し込めます。会員種別ごとに、氏名または事業所名と、番号または電話番号でご本人確認を行います。',
  memberUpdateCtaLabel: '変更手続きへ進む',
  withdrawalMenuEnabled: true,
  withdrawalBadgeEnabled: true,
  withdrawalBadgeLabel: '退会',
  withdrawalTitleEnabled: true,
  withdrawalTitle: '退会を申し込む',
  withdrawalDescriptionEnabled: true,
  withdrawalDescription: '退会申請を行います。年度末退会または即時退会を選択できます。会員種別ごとに、氏名または事業所名と、番号または電話番号でご本人確認を行います。',
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
    // 2026-10-18 BR-21: 公開ポータル申込の会員照合（末尾追加）
    '会員照合結果コード',
    '照合会員ID',
    '照合職員ID',
    '申告介護支援専門員番号',
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
// 2026-10-25: 職員ID を末尾に追加（事業所職員の役員にも支払う。受取人は役員本人・operator 決定）。
// 会員ID（個人・賛助会員）と職員ID（事業所職員）はXOR — T_役員・T_振込口座・T_請求 と同じ人物の参照。
テーブル定義['T_支払い'] = [
  '支払いID', '会員ID',
  '支払い日', '支払い方法', '合計金額',
  '振込先口座JSON', '登録者メール', '備考',
  '削除フラグ', '作成日時', '更新日時',
  '職員ID',
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

// ─── テストデータの印（2026-10-11・docs/303） ─────────────────────────────
// テストで作る会員・職員・外部申込者は、名前の先頭に★を付け、メールアドレスを
// @example.invalid（RFC 6761 の予約ドメイン。どこにも届かない）にする。
// **両方を満たすものだけ**をテストデータとみなす。片方だけでは消さない
// （実在の会員の名前に★が入っても、メールアドレスが本物なら対象にならない）。
// 判定はこの関数群が正本。作成（scripts/create-test-member.mjs・dryRun）と
// 物理削除（previewTestDataPurge_LOG / executeTestDataPurge_APPLY）が同じものを使う。
var TEST_DATA_NAME_PREFIX = '★';
var TEST_DATA_EMAIL_DOMAIN = '@example.invalid';



// 個人会員・賛助会員は姓、事業所会員は事業所名（T_会員.勤務先名）に印を付ける。



// 承認前の入会申込は会員IDを持たないので、申請者名（氏名・事業所名）と連絡先で判定する。

// 物理削除で、テーブルごとにどう扱うか（ゴミを残さないための分類）。
// テーブル定義に表を足したら、ここにも分類を足す。未分類は test:test-data-purge が落とす。
//   CASCADE  getCascadeMatchers_ の会員・職員の連動。本番の表と *_archive の両方から消す
//   PURGE    表ごとの条件で消す（buildTestDataPurgePlan_ / getTestDataPurgeLogMatchers_）
//   KEEP     消さない
//   NONE     会員・職員・外部申込者と結び付かない
var TEST_DATA_PURGE_TABLE_POLICY = {
  'T_会員': 'CASCADE',
  'T_事業所職員': 'CASCADE',
  'T_認証アカウント': 'CASCADE',
  'T_管理者Googleホワイトリスト': 'CASCADE',
  'T_研修申込': 'CASCADE',          // ＋テストの外部申込者の申込
  'T_年会費納入履歴': 'CASCADE',
  'T_年会費更新履歴': 'CASCADE',
  'T_役員': 'CASCADE',
  'T_振込口座': 'CASCADE',
  'T_支払い': 'CASCADE',
  'T_支払い明細': 'CASCADE',
  'T_請求': 'CASCADE',              // 添付ファイル（Drive）は請求添付フォルダ内のものだけゴミ箱へ
  'T_変更申請': 'CASCADE',          // ＋承認前のテストの入会申込（isTestChangeRequestRow_）
  'T_外部申込者': 'PURGE',          // isTestExternalApplicantRow_
  'T_ログイン履歴': 'PURGE',        // 消す認証アカウントのもの（ログ用スプレッドシート）
  'T_メール送信明細': 'PURGE',      // 受信者が消す会員・職員・外部申込者のもの（ログ用スプレッドシート）
  'T_削除ログ': 'PURGE',            // 対象がすべて消す会員・職員のもの。スナップショットに個人データを持つ
  'T_人物統合ログ': 'PURGE',        // 新旧のIDがすべて消す会員・職員のもの
  'T_監査ログ': 'KEEP',             // 操作の記録。IDだけで個人データを持たない。物理削除そのものもここに残す
  'T_メール送信ログ': 'KEEP',       // 送信のまとまり（件数）だけ。宛先は明細側にある
  'T_研修': 'NONE',
  'T_システム設定': 'NONE',
  'T_権限ロール': 'NONE',
  'T_メールテンプレート': 'NONE',
  'T_画面項目権限': 'NONE',
  'T_規程': 'NONE',
  'T_共有メモ': 'NONE',
  'T_LINE投稿依頼': 'NONE',
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
  // v295: 役員管理FK検証
  ['T_役員',       '役職コード', 'M_役職マスタ'],
  ['T_役員',       '組織コード', 'M_組織マスタ'],
  ['T_支払い明細', '種別コード', 'M_支払い種別マスタ'],
  ['T_支払い明細', '組織コード', 'M_組織マスタ'],
  ['T_請求',       '種別コード', 'M_支払い種別マスタ'],
  ['T_請求',       '業務分類コード', 'M_業務分類'],
  ['T_請求',       '組織コード', 'M_組織マスタ'],
  // 2026-10-02: マスタを参照しているのに宣言が漏れていた分（docs/294 §2-6）。
  // 入力規則は人がシートを直接編集するときにしか効かない（setValues は素通りする）。
  // 実効的な検証は isKnownMasterCode_ 側で行い、ここは手編集に対する保険として足す。
  ['T_研修申込',   '出欠状態コード', 'M_出欠状態'],
  ['T_請求',       '役職コード', 'M_役職マスタ'],
  ['T_支払い明細', '役職コード', 'M_役職マスタ'],
  ['M_役職マスタ', '組織コード', 'M_組織マスタ'],
  ['M_業務分類',   '組織コード', 'M_組織マスタ'],
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
 * スプレッドシートDBを作成し、マスタ/テーブルを初期化する。
 * 不要シート（定義外シート）もあわせて削除する。
 * clasp run setupDatabase から実行想定。
 */

/**
 * T_会員 に 勤務先住所2 / 自宅住所2 列を追加するマイグレーション。
 * 既にカラムが存在する場合はスキップする（冪等）。
 * 実行後は schema maintenance のヘッダー保護を再適用することを推奨。
 */

/**
 * DBスキーマを再構築する。
 * 既存の定義外シートは削除し、定義シートのヘッダー/入力規則/保護を再適用する。
 */




/**
 * 既存ホワイトリストの権限コードをマイグレーションする。
 * k.noguchi@uguisunosato.or.jp → MASTER、他 → ADMIN。
 * 使い方: npx clasp run migrateAdminPermissions
 */

/**
 * ホワイトリストのデータ列ズレを修復する（v118 スキーマ移行用）。
 * writeSheetHeaders_ がヘッダーだけ上書きしデータ行を移動しなかったため、
 * 旧列位置のデータを新列位置にリマップする。
 * 使い方: npx clasp run repairWhitelistData
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
 * v209: T_システム設定 に認証情報メール設定キーを追加する（ワンタイム実行）
 * 実行: npx clasp run insertSystemSettingKeysForV209
 */

/**
 * v210: T_システム設定 に公開ポータルメニュー表示設定キーを追加する（ワンタイム実行）
 * 実行: npx clasp run insertSystemSettingKeysForV210
 */

/**
 * v194 Phase 1: T_システム設定 に3新設定キーを追加する（ワンタイム実行）
 * 実行: npx clasp run insertSystemSettingKeysForV194
 */

/**
 * v194 Phase 1: T_メール送信ログ シートを DB に新設する（ワンタイム実行）
 * 実行: npx clasp run createEmailLogSheet
 */

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
  // v260: 公開ポータル OTP
  sendPublicOtp: true,          // 退会申請用 OTP（継続使用）
  verifyPublicOtp: true,        // 退会申請用 OTP 検証（継続使用）
  // v264: OTPなし本人確認フロー + 変更申請キュー
  verifyMemberIdentityForPublic: true,
  submitPublicChangeRequest: true,
  // 2026-10-13: 職員の照合（一致したかどうかだけを返す）。旧 getPublicEnrolledStaffList /
  // getPublicAvailableStaffSlots は登録内容を返していたため廃止した。
  checkPublicStaffMatch: true,
};


// 管理者ログイン専用アクション: Session.getActiveUser() による自己完結型認証のため、
// 事前の admin session 検証を必要としない。関数内で認証を完結させる。

// docs/246 Phase 1-A: メニュー単位 RBAC の認可レジストリ。
// 以下 4 vars は build 時に scripts/menu-registry.mjs の serializeMenuRegistryForGas() で
// 上書き注入される。ここではソースの parse 健全性のために空の placeholder を置いている。
// 単一情報源は scripts/menu-registry.mjs（frontend からも import）。
// __MENU_REGISTRY_BUILD_INJECT_START__
var MENU_REGISTRY = [];
var ACTION_TO_MENU = {};
var LEGACY_ROLE_TO_MENUS = {};
var LEGACY_ROLE_TRAINING_SCOPE = {};
var INITIAL_ROLE_DEFINITIONS = [];
var LEGACY_CODE_TO_INITIAL_ROLE_ID = {};
// __MENU_REGISTRY_BUILD_INJECT_END__

// docs/246 Phase 1-A: action 認可判定（legacy 権限コード ベース）。
// Phase 2 hotfix v376.28.2: 主要パスは isActionAllowedForSession_ へ移行。
// この関数は snapshot test / fallback パス用に残置（直接呼び出し非推奨）。

// docs/246 Phase 2 hotfix v376.28.2: 認可は checkAdminBySession_ で解決済の
// session (isMaster + allowedMenus) を直接参照する。これにより:
//   - whitelist.ロールID が埋まっていれば T_権限ロール の値が authoritative
//   - 無ければ legacy 権限コードからの fallback（Phase 1-B fallback chain と整合）
//   - カスタムロールの allowedMenus が実トラフィックの認可判定に反映される
// MASTER は session.isMaster=true により従来通り全許可（user 確認済の設計意図）。


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
    // ロール視点プレビューのロールID。業務処理へは渡さない。
    var previewRoleId = String(parsedPayload.__previewRoleId || '').trim();
    delete parsedPayload.__previewRoleId;
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

    // v260: 公開ポータル OTP
    if (action === 'sendPublicOtp') {
      return JSON.stringify({ success: true, data: sendPublicOtp_(parsedPayload) });
    }

    if (action === 'verifyPublicOtp') {
      return JSON.stringify({ success: true, data: verifyPublicOtp_(parsedPayload) });
    }

    // v264: OTPなし本人確認フロー
    if (action === 'verifyMemberIdentityForPublic') {
      return JSON.stringify({ success: true, data: verifyMemberIdentityForPublic_(parsedPayload) });
    }
    if (action === 'submitPublicChangeRequest') {
      return JSON.stringify({ success: true, data: submitPublicChangeRequest_(parsedPayload) });
    }
    if (action === 'checkPublicStaffMatch') {
      return JSON.stringify({ success: true, data: checkPublicStaffMatch_(parsedPayload) });
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


    // 2026-10-13: 許可リストにあるのに処理の分岐が無い action を「成功」と返していた。失敗として返す。
    return JSON.stringify({ success: false, error: '未実装アクションです: ' + action });
  } catch (error) {
    Logger.log('[processApiRequest catch] action=' + action + ' error=' + (error && error.message ? error.message : String(error)));
    return JSON.stringify({
      success: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}








// 研修の日付表記の単一情報源 src/shared/trainingDate.mjs::formatTrainingDateJa を
// build（injectTrainingDatePlaceholders）が下記マーカー間へ formatTrainingDateJa_ として注入する。
// __TRAINING_DATE_BUILD_INJECT_START__
function formatTrainingDateJa_(dateStr, endTime) {
  var raw = String(dateStr == null ? '' : dateStr).trim();
  if (!raw) return '';
  var sep = raw.indexOf('T') !== -1 ? 'T' : ' ';
  var datePart = raw.split(sep)[0].split('/').join('-');
  var timePart = raw.indexOf(sep) !== -1 ? raw.slice(raw.indexOf(sep) + 1) : '';
  var ymd = datePart.split('-');
  if (ymd.length !== 3) return raw;
  var y = Number(ymd[0]);
  var m = Number(ymd[1]);
  var d = Number(ymd[2]);
  if (!(y > 0) || !(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return raw;

  function hhmm(value) {
    var s = String(value == null ? '' : value).trim();
    var parts = s.split(':');
    if (parts.length < 2) return '';
    var h = Number(parts[0]);
    var mi = Number(parts[1].slice(0, 2));
    if (parts[0] === '' || isNaN(h) || isNaN(mi) || h < 0 || h > 23 || mi < 0 || mi > 59) return '';
    return h + ':' + (mi < 10 ? '0' : '') + mi;
  }

  var key = y * 10000 + m * 100 + d;
  var era;
  if (key >= 20190501) era = '令和' + (y - 2018 === 1 ? '元' : String(y - 2018));
  else if (key >= 19890108) era = '平成' + (y - 1988 === 1 ? '元' : String(y - 1988));
  else era = String(y);
  // 曜日は暦の上の日付から求める（端末のタイムゾーンに左右されない）
  var weekday = '日月火水木金土'.charAt(new Date(Date.UTC(y, m - 1, d)).getUTCDay());
  var text = era + '年' + m + '月' + d + '日(' + weekday + ')';

  var start = hhmm(timePart);
  if (start) {
    var end = hhmm(endTime);
    text += ' ' + start + '〜' + end;
  }
  return text;
}
// __TRAINING_DATE_BUILD_INJECT_END__

/**
 * メール・LINE・一覧の見出しに出す研修の日付（令和8年6月20日(土) 14:00〜16:30）。
 * セルの Date はここで文字列にする。文字列は new Date に通さない（日付だけの値が UTC 解釈で 9:00 になるため）。
 */
function formatTrainingDate_(rawDate, endTime) {
  if (!rawDate) return '';
  var text = Object.prototype.toString.call(rawDate) === '[object Date]'
    ? Utilities.formatDate(rawDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm')
    : String(rawDate);
  return formatTrainingDateJa_(text, formatTimeOnly_(endTime));
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






/**
 * 会員ログインE2Eのため、代表的な会員認証アカウントのみを安全に再作成する。
 * - 既存データ全削除は行わない（seedDemoData は呼ばない）
 * - 対象: 個人会員2件 + 事業所管理者1件
 * - パスワードは一括で demo1234 に再設定する
 */























function parseTrainingOptions_(raw) {
  var defaultResult = {
    fieldConfig: null,
    cancelAllowed: false,
    inquiryPerson: '',
    inquiryContactType: 'PHONE',
    inquiryContactValue: '',
    inquiryPhone: '',
    inquiryEmail: '',
    askMemberNumber: null,
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
        // BR-21: 真偽で入っているときだけ持つ。null は「未設定（費用から決める）」
        askMemberNumber: typeof parsed.askMemberNumber === 'boolean' ? parsed.askMemberNumber : null,
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
      askMemberNumber: null,
    };
  } catch (e) {
    return defaultResult;
  }
}



// 旧関数（後方互換、seed/test コード向け）

function getAllDataCacheKey_() {
  return 'fetchAllData:' + DB_SCHEMA_VERSION;
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

// B-15（2026-10-23）: 事業所の一般職員には同僚の行（氏名・メール・CM 番号＝ログイン ID）を返さない。
// docs/03 §3.5「STAFF は自分の情報のみ閲覧」。以前は全員分を返し、画面にも出ていた。
// 代表者・管理者は職員を管理するので全員分。それ以外の権限・自分の行が無いときは自分だけ（閉じる側に倒す）。
// 保存は updateMemberSelf_ が送られなかった職員を DB の値のまま残すので、自分の行だけで足りる。











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


/**
 * v376.55/56: 会員に紐づく認証アカウント一覧（read 専用）。
 * 会員種別からの推測をせず、実データ（T_認証アカウント の 会員ID 一致）で紐付きを列挙する。
 * v376.56: 認証アカウントが「未発行」のユニット（個人/賛助=会員本人、事業所=各職員）も列挙する。
 *   issued=true は adminResetMemberPassword_（認証ID）でリセット、issued=false は adminIssueMemberCredential_ で発行。
 * パスワードハッシュ・ソルト等の機密は返さない（AGENTS §0）。
 * 返り値: [{ issued, authId, loginId, method, active, locked, unit:'MEMBER'|'STAFF', memberId, staffId, personName }]
 */

/**
 * v376.56: 認証アカウントが無い会員本人/事業所職員へ、ログインID+初期パスワードを新規発行する。
 * 既に PASSWORD 認証がある対象は発行不可（adminResetMemberPassword_ を使う）。
 * 会員種別からの推測はせず、個人/賛助=会員本人（staffId なし）、事業所=職員（staffId 必須）を明示指定。
 * 平文は戻り値で 1 度だけ返す。ログ・監査に平文/ハッシュは記録しない（AGENTS §0）。
 */

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

// v376.79: 待機満了時に使う。**ロックだけ**を解除し、失敗回数は残す。
// 失敗回数まで戻すと段階的な待機と恒久ロックに到達しなくなるため、
// カウントのリセットは clearLoginLockout_（ログイン成功・管理者解除）に限る。

// 認証成功・管理者解除で使う。失敗回数とロックを完全に戻す。



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

// 時間主導トリガーのハンドラ用。トリガーから起動されたときは呼び出した人が居ないので、
// イベントの triggerUid がこのプロジェクトに実在するトリガーかで確かめる。
// クライアントは引数を偽れるため、triggerUid が付いているだけでは信用しない。
// トリガー以外（エディタ・google.script.run）からの起動は MASTER に限る。

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
var PREVIEW_READ_ACTION_PREFIXES = ['get', 'list', 'search', 'fetch', 'check', 'load', 'preview'];





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

// 2026-10-19 docs/307 S18: スキーマ整備（initializeSchema_）を本番 DB の「コピー」で通しで流し、
// 全シートの全セルを前後で突き合わせる。本番 DB には書き込まない（コピーを作って最後にゴミ箱へ移す）。
// スキーマの版を上げるリリースの前に実行し、巻き添えが 0 であることを確かめる。
// 出力にセルの値は出さない（型と件数だけ。個人情報を実行ログやチャットへ出さない）。



// 値を型付きの文字列にする。'0123'（文字列）と 123（数値）、日付と同じ見た目の文字列を区別する

// 前後のスナップショットを列名で突き合わせる。issues は「あってはならない変化」だけ。

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

// 2026-10-19: DB の今の状態を数えるだけの診断（読むだけ・書き込みなし・監査ログにも書かない）。
// シートごとの行数・削除済み・定義との差（planTableColumnNormalization_ の方針）と、ID 参照の孤児の件数。
// セルの値は返さない（件数と列名だけ）。



// 削除済みの会員・職員に結び付いたまま、削除されていない認証アカウント。有効なものはログインできる

// _CREDENTIALS_TEMP（2026-03 移行時の認証情報台帳）に平文の初期パスワードが残っているか。
// 値は読むが返さない。台帳の日時より後にパスワードが変わっていない有効なアカウントを「まだ使えうる」と数える


// 整備後のコピーで、定義の全列を持つ行を 1 行書いて読み戻す（列のずれ・書けない列を見つける）。
// 書くのはコピーだけ。値は列名から作るので、どの列に入ったかが読み戻しで分かる。



// ─── v309: 共有メモ（申し送りホワイトボード）────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────

// 公開ポータルの退会確認欄は、手続きに必要な5項目を固定し、表示と文言のみを設定化する。
// 任意行の追加・削除は審査上の説明責任に影響するため、別途仕様化するまで受け付けない。
var WITHDRAWAL_CONFIRMATION_ITEM_IDS_ = ['method', 'effectiveDate', 'memberPortal', 'cancellation', 'approval'];

function normalizeWithdrawalConfirmationItems_(items) {
  if (!Array.isArray(items)) throw new Error('退会確認項目の形式が不正です。');
  var byId = {};
  items.forEach(function(item) {
    if (!item || typeof item !== 'object') throw new Error('退会確認項目の形式が不正です。');
    var id = String(item.id || '');
    if (WITHDRAWAL_CONFIRMATION_ITEM_IDS_.indexOf(id) === -1 || byId[id]) {
      throw new Error('退会確認項目の識別子が不正です。');
    }
    var label = String(item.label == null ? '' : item.label).trim();
    var fiscalYearEndText = String(item.fiscalYearEndText == null ? '' : item.fiscalYearEndText).trim();
    var immediateText = String(item.immediateText == null ? '' : item.immediateText).trim();
    if (typeof item.enabled !== 'boolean' || !label || !fiscalYearEndText || !immediateText ||
        label.length > 80 || fiscalYearEndText.length > 300 || immediateText.length > 300) {
      throw new Error('退会確認項目の入力内容が不正です。');
    }
    byId[id] = {
      id: id,
      enabled: item.enabled,
      label: label,
      fiscalYearEndText: fiscalYearEndText,
      immediateText: immediateText,
    };
  });
  return WITHDRAWAL_CONFIRMATION_ITEM_IDS_.map(function(id) {
    if (!byId[id]) throw new Error('退会確認項目が不足しています。');
    return byId[id];
  });
}

function parseWithdrawalConfirmationItems_(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  try {
    return normalizeWithdrawalConfirmationItems_(JSON.parse(String(raw)));
  } catch (e) {
    return null;
  }
}


// MASTER のみ変更可能な設定キー（v194）
var MASTER_ONLY_SETTING_KEYS = ['EMAIL_LOG_VIEWER_ROLE'];

// T_システム設定のスネークアッパーケースキーを camelCase に変換する
// 例: 'EMAIL_LOG_VIEWER_ROLE' → 'emailLogViewerRole'





// ─── docs/246 Phase 2-A: ロール CRUD ─────────────────────────────────

/**
 * T_監査ログ にロール CRUD を追記する。
 * appendAdminAuditLog_ は T_会員 専用なので別関数とする。
 */
// 監査ログ（T_監査ログ）への書き込みの唯一の出口。まとめて 1 回で書く。
// entries: [{ operatorEmail, operation, tableName, recordId, fieldName, oldValue, newValue }]
// 監査ログのシートが無い（スキーマ未整備）ときは何もしない。


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




// 2026-10-13: 公開ポータルの受付メニュー（研修・入会・登録情報変更・退会）が有効か。
// 以前は設定で「受付停止」にしても画面がメニューを隠すだけで、サーバは受け付け続けていた。
// 既定値は画面の表示（PUBLIC_PORTAL_DEFAULTS / 未設定は表示）と同じ。
// 2026-10-13: 公開の受付（研修申込・入会申込・変更申請）の回数制限。以前は無く、
// ①申込済みかどうかを総当たりで確かめられる ②架空の申込で定員を埋められる
// ③任意の宛先へ受付メールを送らせ、1 日の送信上限を使い切ってシステム全体のメールを止められた。
// GAS では送信元 IP が取れないので、「宛先（メール・会員）ごと」と「全体の 1 時間あたり」の 2 段で抑える。
// kind: 'TRAINING' / 'APPLICATION' / 'CHANGE_REQUEST'。key: メールアドレスや会員ID。
function consumePublicSubmissionQuota_(kind, key) {
  var limits = {
    TRAINING: { perKey: 10, perKeySeconds: 3600 },
    APPLICATION: { perKey: 5, perKeySeconds: 3600 },
    CHANGE_REQUEST: { perKey: 5, perKeySeconds: 1800 },
  };
  var limit = limits[kind];
  var cache = CacheService.getScriptCache();
  var keyName = 'pub_submit_' + kind + '_' + String(key || '').toLowerCase().slice(0, 200);
  var used = Number(cache.get(keyName) || 0) || 0;
  if (used >= limit.perKey) throw new Error('短時間に多くの申込がありました。しばらくしてからもう一度お試しください。');
  // 全体: 1 時間あたり 300 件（受付メールの送信上限を守る）。時間帯ごとの箱で数える。
  var hourKey = 'pub_submit_all_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHH');
  var allUsed = Number(cache.get(hourKey) || 0) || 0;
  if (allUsed >= 300) throw new Error('現在、申込が集中しています。しばらくしてからもう一度お試しください。');
  cache.put(keyName, String(used + 1), limit.perKeySeconds);
  cache.put(hourKey, String(allUsed + 1), 3600);
}

function assertPublicPortalIntakeOpen_(ss, kind) {
  // 対応表は関数の中に置く（build の未使用除去が最上位の var を消す罠を避ける）
  var keys = {
    TRAINING: 'PUBLIC_PORTAL_TRAINING_MENU_ENABLED',
    MEMBERSHIP: 'PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED',
    MEMBER_UPDATE: 'PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED',
    WITHDRAWAL: 'PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED',
  };
  var raw = getSystemSettingValue_(ss, keys[kind]);
  var enabled = (raw === '' || raw === null || raw === undefined) ? true : String(raw) !== 'false';
  if (!enabled) throw new Error('現在、この受付は停止しています。');
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
// docs/307 S41（2026-10-24）: シートや列が無ければ止める。以前は黙って戻り、呼び出し元は「保存しました」と返した。




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
  var ss = getOrCreateDatabase_();
  if (!isKnownMasterCode_(ss, 'M_会員種別', memberType)) {
    throw new Error('会員種別が不正です。');
  }
  // 受付確認・承認・却下の連絡先は、事業所会員では代表者を正本とする。
  // 職員配列の先頭を使うと、入力順によって一般メンバーへ誤送信されるため禁止する。
  var contactEmail = memberType === 'BUSINESS'
    ? resolveBusinessApplicationRepresentativeEmail_(payload.staff)
    : String(payload.email || '').trim();
  if (!contactEmail) throw new Error('連絡先メールアドレスが必要です。');
  consumePublicSubmissionQuota_('APPLICATION', contactEmail);

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
  notifyMembershipChatSafely_(ss, 'REQUEST', {
    '手続種別': chatMembershipRequestTypeLabel_('MEMBER_APPLICATION'),
    '会員名': applicantName,
    '会員種別': memberTypeLabel_(memberType),
    '会員ID': '',
    '申請ID': requestId,
    '日時': now,
    '変更内容': '',
    '異常内容': '',
  });
  return { queued: true, success: true, requestId: requestId };
}

function submitMemberApplication_(payload) {
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), 'MEMBERSHIP');
  return enqueueMemberApplicationChangeRequest_(payload);
}

// v376.73: 入会承認の本体。呼び出し側（approveAdminChangeRequest_）は 1 度に 1 件しか
// 処理しないが、事務局が複数人で同時に承認すると会員ID・ログインIDの採番が競合するため
// ScriptLock で直列化する（管理画面の資格情報発行 adminIssueMemberCredential_ と同じ扱い）。


// 2026-10-13 operator 判断: 申込・追加された介護支援専門員番号が、既存の会員・職員と重なるときは
// **承認で止める**。以前は番号だけを根拠に既存者を自動で移し（個人→職員・他事業所→自事業所）、
// メールを申請者の値で上書きしていた。他人の番号で申し込めば、その人の会員資格とメールを奪えた。
// 同一人物の移籍なら、事務局が会員の移行機能で手動で行う。
// 戻り値: 重なりの説明（承認者向け）の配列。重なりが無ければ空配列。

var CARE_MANAGER_CONFLICT_GUIDANCE_ = '同一人物かを確認し、移籍であれば会員の移行機能で手動で処理してください。この申請は差し戻してください。';



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


// v368: 変更申請の人間可読サマリーを生成する
//   changeData: { fields?: {key:value}, staffAdd?: [...], staffRemove?: [...], applicationPayload?: {...} }
//   requestType: MEMBER_APPLICATION / MEMBER_UPDATE / WITHDRAWAL / STAFF_ADD / STAFF_REMOVE
function buildChangeSummaryText_(changeData, requestType) {
  if (!changeData || typeof changeData !== 'object') return '';
  var lines = [];
  var FIELD_LABELS = {
    lastName: '姓', firstName: '名', lastKana: '姓カナ', firstKana: '名カナ',
    email: 'メールアドレス', mobilePhone: '携帯電話',
    workplaceName: '勤務先名', officeName: '事業所名',
    workplacePostalCode: '勤務先郵便番号', workplacePrefecture: '勤務先都道府県',
    workplaceCity: '勤務先市区町村', workplaceAddress1: '勤務先住所', workplaceAddress2: '勤務先住所2',
    workplacePhone: '勤務先電話番号', workplaceFax: '勤務先FAX',
    homePostalCode: '自宅郵便番号', homePrefecture: '自宅都道府県',
    homeCity: '自宅市区町村', homeAddress1: '自宅住所', homeAddress2: '自宅住所2',
    careManagerNumber: '介護支援専門員番号',
    deliveryMethodCode: '通知方法', deliveryDestinationCode: '郵送先区分',
  };
  if (requestType === 'WITHDRAWAL') {
    lines.push('・退会申請');
    lines.push('・退会方式: ' + (changeData.withdrawalMethod === 'IMMEDIATE' ? '即時退会（承認日に適用）' : '年度末退会'));
  } else if (requestType === 'MEMBER_APPLICATION') {
    lines.push('・新規入会申込');
  } else if (changeData.fields && typeof changeData.fields === 'object') {
    var keys = Object.keys(changeData.fields);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = String(changeData.fields[k] == null ? '' : changeData.fields[k]).trim();
      if (!v) continue;
      var label = FIELD_LABELS[k] || k;
      lines.push('・' + label + ': ' + v);
    }
  }
  if (Array.isArray(changeData.staffAdd) && changeData.staffAdd.length > 0) {
    changeData.staffAdd.forEach(function(s) {
      lines.push('・職員追加: ' + (s.lastName || '') + ' ' + (s.firstName || '') + '（CM番号 ' + (s.careManagerNumber || '') + '）');
    });
  }
  if (Array.isArray(changeData.staffRemove) && changeData.staffRemove.length > 0) {
    changeData.staffRemove.forEach(function(s) {
      lines.push('・職員除籍: ' + (s.lastName || '') + ' ' + (s.firstName || '') + '（CM番号 ' + (s.careManagerNumber || '') + '）');
    });
  }
  // v372.5: 既存職員情報の変更
  if (Array.isArray(changeData.staffUpdate) && changeData.staffUpdate.length > 0) {
    changeData.staffUpdate.forEach(function(s) {
      var changes = [];
      ['lastName', 'firstName', 'lastKana', 'firstKana', 'email', 'careManagerNumber'].forEach(function(k) {
        if (Object.prototype.hasOwnProperty.call(s, k) && String(s[k] || '').trim()) {
          changes.push((FIELD_LABELS[k] || k) + '→' + s[k]);
        }
      });
      lines.push('・職員情報変更（職員ID: ' + (s.staffId || '') + '）: ' + changes.join(', '));
    });
  }
  if (lines.length === 0) return '';
  return ['変更内容:'].concat(lines).join('\n') + '\n';
}

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





// ============================================================
// v376.65（案C Phase 1）: 規程・重要事項マスタ
// 本文の正本は T_規程 の 1 箇所。公開ポータルの入会申込画面と管理設定が同じ行を読む。
// ============================================================

var REGULATION_KINDS = ['NOTICE', 'REGULATION'];
// 対象会員種別は 'ALL' か M_会員種別 の有効なコード（getActiveMemberTypeCodes_）
var REGULATION_TARGET_ALL = 'ALL';

// 初期 seed（従来フロントにハードコードされていた文面をそのまま移行する）。
// 既に行があるときは何もしない＝事務局の改定を上書きしない。
var REGULATION_SEED = [
  { kind: 'NOTICE', title: '会費の返還について', body: '納入後の会費は、いかなる理由があっても返還できません。', url: '', urlLabel: '', target: 'ALL', order: 1 },
  { kind: 'NOTICE', title: '個人情報の利用目的', body: '登録情報は、台帳管理、定例会・研修会等の周知、受付確認、広報発送など、協議会運営に必要な範囲でのみ利用します。', url: '', urlLabel: '', target: 'ALL', order: 2 },
  { kind: 'NOTICE', title: '変更・退会の手続き', body: '登録情報の変更や退会は、協議会ホームページからお手続きください。', url: 'https://sites.google.com/view/starhirakata/%E5%85%A5%E4%BC%9A%E9%80%80%E4%BC%9A?authuser=0', urlLabel: '入会・退会案内を開く', target: 'ALL', order: 3 },
  { kind: 'NOTICE', title: '退会の締切', body: '退会は年度切替前の3月末までに完了してください。手続きがない場合は継続扱いとなり、当該年度の会費納入が必要です。', url: '', urlLabel: '', target: 'ALL', order: 4 },
  { kind: 'REGULATION', title: '協議会の定款', body: '入会前に、協議会の基本規程も確認できます。', url: 'https://sites.google.com/view/starhirakata/%E5%AE%9A%E6%AC%BE?authuser=0', urlLabel: '定款を確認する', target: 'ALL', order: 5 }
];










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
  var list = rows.map(function(row) {
    var obj = regulationRowToObject_(row);
    // 2026-10-13: 公開ポータル用（publishedOnly）には更新者のメールを含めない（匿名に事務局員のアドレスが渡っていた）
    if (publishedOnly) delete obj.updatedBy;
    return obj;
  });
  list.sort(function(a, b) {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  });
  return list;
}


// 新規追加 / 既存更新。本文・タイトル・リンクが変わったときだけ版数を +1 する
// （Phase 2 の同意記録が「どの版に同意したか」を指せるようにするため）。

// v376.86: 規程の一括保存。設定画面の「一括保存」でまとめて反映するための入口。
//
// 以前は 1 件ごとに saveRegulation / deleteRegulation を呼んでいたため、
// 並べ替え 1 回で 3 往復（保存 2 + 再読込 1）＝ 15〜20 秒かかり、操作のたびに待たされた。
// GAS は 1 呼び出しあたり 1.8〜5 秒の固定オーバーヘッドがある（TRD 第1部 §6）ので、
// 往復回数を減らすことがそのまま体感速度になる。
//
// changes: [{ op: 'upsert' | 'delete', item: {...} }] を順に適用し、シート書き込みは 1 回にまとめる。

// soft delete（削除フラグ）。会員に紐づかないため cascade アーカイブの対象外。


// dryRun 専用: 検証で作った T_規程 の行を物理削除する（通常運用では soft delete のみ）。


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

// 出力の事実を T_監査ログ へ残す（列構成は既存の appendRoleAuditLog_ と同一）。
// 中身は残さず、テーブル名・行数・条件のみ記録する（持ち出し記録が目的）。

// 指定テーブルを CSV 文字列で返す。




// v368: 申込受付メール送信ヘルパー（公開ポータル申請受付時に使用）
// ── Google Chat: 会員手続き通知 ────────────────────────────────────────────
// Webhook URL は設定テーブルに保存しない。3 split の Script Properties に同じキーを設定する。
var CHAT_MEMBERSHIP_WEBHOOK_URL_PROPERTY = 'CHAT_MEMBERSHIP_WEBHOOK_URL';
var CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY = '【会員手続き受付】\n手続き: {{手続種別}}\n会員: {{会員名}}\n会員種別: {{会員種別}}\n申請ID: {{申請ID}}\n受付日時: {{日時}}\n{{変更内容}}';
var CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY = '【会員手続き確定】\n手続き: {{手続種別}}\n会員: {{会員名}}\n会員種別: {{会員種別}}\n申請ID: {{申請ID}}\n確定日時: {{日時}}\n{{変更内容}}';
var CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY = '【会員手続き 要確認】\n手続き: {{手続種別}}\n会員: {{会員名}}\n会員ID: {{会員ID}}\n申請ID: {{申請ID}}\n日時: {{日時}}\n内容: {{異常内容}}';
var CHAT_MEMBERSHIP_TEMPLATE_TAGS = ['通知種別', '手続種別', '会員種別', '会員名', '会員ID', '申請ID', '日時', '変更内容', '異常内容'];


function getChatMembershipNotificationSettings_(ss) {
  return {
    enabled: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_NOTIFICATION_ENABLED') || '') === 'true',
    requestEnabled: isSystemSettingEnabled_(ss, 'CHAT_MEMBERSHIP_REQUEST_ENABLED', true),
    finalEnabled: isSystemSettingEnabled_(ss, 'CHAT_MEMBERSHIP_FINAL_ENABLED', true),
    anomalyEnabled: isSystemSettingEnabled_(ss, 'CHAT_MEMBERSHIP_ANOMALY_ENABLED', true),
    requestBody: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_REQUEST_BODY') || '') || CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY,
    finalBody: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_FINAL_BODY') || '') || CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY,
    anomalyBody: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_ANOMALY_BODY') || '') || CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY,
  };
}

function renderChatMembershipTemplate_(template, context) {
  var values = context || {};
  return String(template || '').replace(/{{([^{}]+)}}/g, function(_, rawTag) {
    var tag = String(rawTag || '').trim();
    return Object.prototype.hasOwnProperty.call(values, tag) ? String(values[tag] || '') : '';
  }).replace(/\n{3,}/g, '\n\n').trim();
}

// 同じ申請IDの受付・処理完了を1スレッドへまとめる。申請IDは業務上の主キーであり、
// 個人情報やWebhook応答の識別子をDBへ保存する必要がない。
function buildMembershipChatThreadKey_(context) {
  var requestId = String((context || {})['申請ID'] || '').trim();
  if (!requestId) return '';
  return ('membership-request-' + requestId).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 240);
}

function withChatWebhookQueryParameter_(url, key, value) {
  var source = String(url || '');
  var hashIndex = source.indexOf('#');
  var hash = hashIndex >= 0 ? source.slice(hashIndex) : '';
  var withoutHash = hashIndex >= 0 ? source.slice(0, hashIndex) : source;
  var questionIndex = withoutHash.indexOf('?');
  var path = questionIndex >= 0 ? withoutHash.slice(0, questionIndex) : withoutHash;
  var query = questionIndex >= 0 ? withoutHash.slice(questionIndex + 1).split('&') : [];
  var encodedKey = encodeURIComponent(key);
  var filtered = query.filter(function(item) {
    return item && item.split('=')[0] !== encodedKey;
  });
  filtered.push(encodedKey + '=' + encodeURIComponent(value));
  return path + '?' + filtered.join('&') + hash;
}

function getMembershipChatMemberContext_(ss, memberId, fallback) {
  var row = getRowsAsObjects_(ss, 'T_会員').filter(function(item) {
    // 退会（年度途中を含む）直後も確定通知に会員表示名を使う。
    return String(item['会員ID'] || '') === String(memberId || '');
  })[0] || {};
  var memberType = String(row['会員種別コード'] || (fallback && fallback.memberType) || '');
  var memberName = memberType === 'BUSINESS'
    ? String(row['勤務先名'] || (fallback && fallback.memberName) || '').trim()
    : String(row['氏名'] || joinHumanNameParts_(row['姓'], row['名']) || (fallback && fallback.memberName) || '').trim();
  return {
    memberId: String(memberId || (fallback && fallback.memberId) || ''),
    memberName: memberName || '（未設定）',
    memberType: memberTypeLabel_(memberType) || '（未設定）',
  };
}

function notifyMembershipChatSafely_(ss, eventType, context) {
  try {
    var settings = getChatMembershipNotificationSettings_(ss);
    var eventKey = String(eventType || '');
    if (!settings.enabled ||
        (eventKey === 'REQUEST' && !settings.requestEnabled) ||
        (eventKey === 'FINAL' && !settings.finalEnabled) ||
        (eventKey === 'ANOMALY' && !settings.anomalyEnabled)) return { skipped: true };

    var webhookUrl = PropertiesService.getScriptProperties().getProperty(CHAT_MEMBERSHIP_WEBHOOK_URL_PROPERTY);
    if (!webhookUrl) {
      Logger.log('Google Chat membership notification skipped: webhook property is not configured.');
      return { skipped: true };
    }
    var bodyTemplate = eventKey === 'REQUEST' ? settings.requestBody : (eventKey === 'ANOMALY' ? settings.anomalyBody : settings.finalBody);
    var notificationLabels = { REQUEST: '受付', FINAL: '確定', ANOMALY: '要確認' };
    var values = context || {};
    values['通知種別'] = notificationLabels[eventKey] || '通知';
    values['日時'] = values['日時'] || Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd HH:mm:ss");
    var text = renderChatMembershipTemplate_(bodyTemplate, values);
    if (!text) return { skipped: true };
    var threadKey = buildMembershipChatThreadKey_(values);
    var payload = { text: text };
    if (threadKey) {
      payload.thread = { threadKey: threadKey };
      webhookUrl = withChatWebhookQueryParameter_(webhookUrl, 'messageReplyOption', 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD');
    }
    var response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    var status = response.getResponseCode();
    if (status < 200 || status >= 300) Logger.log('Google Chat membership notification failed: HTTP ' + status);
    return { sent: status >= 200 && status < 300, status: status };
  } catch (e) {
    // 通知障害は会員の受付・確定処理を失敗させない。
    Logger.log('Google Chat membership notification failed.');
    return { sent: false };
  }
}

function notifyMembershipChatForMember_(ss, eventType, memberId, details) {
  var member = getMembershipChatMemberContext_(ss, memberId, details || {});
  var context = details || {};
  context['会員ID'] = member.memberId;
  context['会員名'] = member.memberName;
  context['会員種別'] = member.memberType;
  return notifyMembershipChatSafely_(ss, eventType, context);
}

function chatMembershipRequestTypeLabel_(requestType, withdrawalMethod) {
  var labels = {
    MEMBER_APPLICATION: '入会申請', MEMBER_UPDATE: '会員情報変更',
    WITHDRAWAL: withdrawalMethod === 'IMMEDIATE' ? '退会申請（即時）' : '退会申請（年度末）',
    STAFF_ADD: '職員追加', STAFF_REMOVE: '職員除籍',
  };
  return labels[String(requestType || '')] || '会員手続き';
}

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
  'MEMBER_UPDATE_CONFIRM', 'WITHDRAWAL_CONFIRM', 'PASSWORD_RESET',
  'LOGIN_ID_CHANGED', 'CONTACT_EMAIL_CHANGED'
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

// v376.73: 事業所会員の職員数上限（全体既定）の取得をここに集約する。
// 以前は getSystemSettings_ が `Number(m['DEFAULT_BUSINESS_STAFF_LIMIT'] || 10)` で読み、
// 入会承認は 10 をリテラルで書いていたため、設定を変えても新規申込に反映されなかった。

// v376.73: 認証アカウントの現在のログインID一覧。採番の重複回避に使う。
// 削除フラグや有効フラグで絞らない — 無効な行でもログインIDは占有され続けるため
// （findRowByColumnValue_ は先頭一致の 1 行しか返さない。重複すると後から作られた側が
//  永久にログインできなくなる。退会者の再入会で実際に起こる）。

// ── 退会処理 ──────────────────────────────────────────

// ── 事業所職員の除籍処理 ──────────────────────────────────────
// T_事業所職員の状態を LEFT に変更し、T_認証アカウントの有効フラグを false にする

// ── 会員IDに紐づく全認証アカウントの有効フラグを false にする ──
// docs/307 S42（2026-10-24）: シートや列が無ければ止め、無効にした件数を返す。
// 以前は黙って戻り、退会・削除なのにログインが有効なまま「完了」になりえた。

// ── 職員IDに紐づく認証アカウントの有効フラグを false にする ──
// v376.100: 職員の介護支援専門員番号を変えたときにログインIDを追従させる。
// 個人会員（CM番号）・事業所会員（事業所番号）は以前からログインIDを書き換えており、
// 職員だけが追従していなかった（v376.99 の調査で判明）。
//
// 既存の不一致は直さない。ここは「これから変えたとき」にだけ効く。
// 一括で書き換えると、現に使われているログインIDを奪うことになるため。
//
// 戻り値: { changed: bool, before: string, after: string, staffEmail: string }
// T_認証アカウント のログインIDを書き換える唯一の場所（2026-09-27 集約）。
//
// 呼び出し元は「どの行か」と「新しいIDを何にするか」だけを決める。
// 行の特定・重複の検出・更新日時・書き戻し・before/after の返却はここが持つ。
// 以前は会員のCM番号・事業所番号・職員のCM番号で 3 箇所が別々にシートを叩いており、
// 重複回避が入っているのは職員だけだった。
//
// resolveNewLoginId(before, otherLoginIds) が新しいIDを返す。
// 空を返すか before と同じなら何もしない。
// 返したIDが他の行と衝突する場合は **書き換えない**（同じログインIDが 2 つできると
// どちらもログインできなくなる。v376.73 で実際に起きた）。衝突は collision で返す。



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











// v106: 年度開始日ユーティリティ（日本の会計年度: 4月1日〜翌年3月31日）





// 退会予定日を過ぎた WITHDRAWAL_SCHEDULED を WITHDRAWN に昇格 + 認証アカウント無効化


// ── 定期ジョブの登録簿・心拍・死活 ──────────────────────────────────────
//
// 2026-09-27: 定期ジョブのハンドラが build の pruning で 3 split すべての生成物から
// 消えており、登録済みのトリガーが「存在しない関数」を叩き続けていた。
// 退会予定→退会確定の昇格が動いていなかったが、誰も気づけなかった。
// 失敗が見えない状態を作らないため、(1) ジョブを登録簿で持ち、
// (2) 成功のたびに心拍を残し、(3) 遅れと失敗を Chat の「要確認」へ流す。
//
// ジョブは **管理者 split にだけ**置く。公開プロジェクトは匿名アクセスで、
// トップレベル関数は google.script.run から誰でも呼べてしまう
// （scripts/gas-boundary-utils.mjs の assertAllowedTopLevelFunctions が守っている境界）。
var SCHEDULED_JOB_HEARTBEAT_PREFIX_ = 'JOB_HEARTBEAT_';
var SCHEDULED_JOB_ALERT_PREFIX_ = 'JOB_ALERTED_';

// ここが定期ジョブの正本。トリガーを足したら必ずここにも足す
// （scripts/test-scheduled-jobs.mts が登録簿とトリガー宣言の食い違いで落ちる）。
var SCHEDULED_JOBS_ = [
  {
    name: 'dailyWithdrawalPolicyTrigger',
    label: '退会ポリシーの日次適用（退会予定→退会確定の昇格を含む）',
    maxAgeMinutes: 26 * 60,
  },
  {
    name: 'processPendingThumbnails',
    label: '研修案内 PDF のサムネイル生成',
    maxAgeMinutes: 60,
  },
];



// 定期ジョブの共通ラッパー。成功したら心拍を残し、落ちたら Chat へ流す。
// メール送信の失敗通知（v376.102）と同じ考え方で、例外は握りつぶさない。


// 遅れているジョブを返す。心拍が無いものは「一度も成功していない」として遅れ扱いにする。
// トリガーが作り直されていない状態を、黙って正常に見せないため。

// 管理画面を開いたときに評価する。**トリガーで見張らない**のが肝で、
// 見張り役をトリガーにすると、それ自身が死んだときに誰も気づけない。
// 人が管理画面を開く経路なら、トリガーが全滅していても届く。
// 同じジョブについては 1 日 1 回までしか流さない。

// operator が editor から引数なしで実行して状態を見る入口。

// v150: 日次トリガーで退会削除ポリシーを実行（ホットパスから除外）

// トリガー一括セットアップ（editor から手動で 1 回実行）。
//
// 2026-09-27: warmUp（5 分間隔のキャッシュ暖機）は廃止した。暖める CacheService は
// プロジェクトごとに別で、公開プロジェクトに置かないと意味がない。しかしそこへ置くと
// 匿名の利用者が google.script.run から重い DB 全読みを叩けてしまう。
// 実際 pruning で消えたまま長期間動いておらず、体感の悪化も報告されていない。
// 旧 warmUp トリガーが残っていればここで消す。
//
// runThumbnailGeneration も同様に片付ける。これは processPendingThumbnails
// （v351 のサムネイル pipeline）に置き換わった旧世代で、作成元の
// setupThumbnailGenerationTrigger_ はスキーマ再構築（管理者の保守ツール）からしか呼ばれず、
// その保守ツールはどの生成物にも入っていない（＝もう作られない）。
// ※ 公開生成物に保守ツールの関数名を出さない（security:public-boundary）ので、ここでは名前を書かない。
// 過去に作られたトリガーだけが、存在しない関数を叩き続けて残りうる。




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

function isTrainingCancelable_(trainingRow, trainingCols) {
  var idx = trainingCols['項目設定JSON'];
  if (idx == null) return false;
  var options = parseTrainingOptions_(trainingRow[idx]);
  if (options.cancelAllowed !== true) return false;
  // 2026-10-13: 開催日時を過ぎた研修は取り消せない（以前は開催後でも取り消せ、受講済みの記録が「取消」に変わった）。
  var dateIdx = trainingCols['開催日'];
  var eventDate = dateIdx == null ? null : parseTrainingDateTime_(trainingRow[dateIdx]);
  if (eventDate && new Date().getTime() > eventDate.getTime()) return false;
  return true;
}

function countAppliedApplicants_(ss, trainingId) {
  return getTrainingApplicationRows_(ss, { appliedOnly: true, trainingId: String(trainingId || '') }).length;
}

// ── 研修申込の共通ルール ────────────────────────────────────────────────
//
// 2026-09-27: 申込の入口は 3 つある（会員マイページ / 公開ポータル / 管理画面の名簿追加）。
// 以前はそれぞれが独自に判定しており、管理画面からの追加には重複検査も定員検査も無く、
// 公開申込は同じメールの人でも申込のたびに T_外部申込者 を作り直していた。
// 「どこから登録しても 1 人の申込は 1 人」を守るため、判定をここに集める。
// 入口ごとの手続き（本人確認・権限・メール）は別物なので共通化しない。

// 外部申込者の同一性はメールアドレスで見る。氏名は表記ゆれが避けられず、
// 同姓同名もありうるので鍵にしない。メールが無い場合だけ新規に起こす。
function normalizeApplicantEmailKey_(email) {
  return String(email == null ? '' : email).trim().toLowerCase();
}

// 既存の外部申込者を返す。無ければ 1 件だけ作る。
// 連絡先が変わっていれば最新で上書きする（同じ人を増やさない）。
function resolveOrCreateExternalApplicant_(ss, info) {
  var sheet = ss.getSheetByName('T_外部申込者');
  if (!sheet) throw new Error('T_外部申込者 シートが見つかりません。');
  var emailKey = normalizeApplicantEmailKey_(info && info.email);
  var nowIso = new Date().toISOString();

  if (emailKey) {
    var found = null;
    var rows = getRowsAsObjectsFromSheet_(sheet);
    for (var i = 0; i < rows.length; i += 1) {
      if (toBoolean_(rows[i]['削除フラグ'])) continue;
      if (normalizeApplicantEmailKey_(rows[i]['メールアドレス']) !== emailKey) continue;
      found = rows[i];
      break;
    }
    if (found) {
      var externalId = String(found['外部申込者ID'] || '');
      updateExternalApplicantContact_(ss, externalId, info, nowIso);
      return { externalId: externalId, created: false };
    }
  }

  var newId = 'EXT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  appendRowsByHeaders_(ss, 'T_外部申込者', [{
    '外部申込者ID': newId,
    '氏名': String((info && info.name) || ''),
    'フリガナ': String((info && info.kana) || ''),
    'メールアドレス': String((info && info.email) || ''),
    '電話番号': String((info && info.phone) || ''),
    '事業所名': String((info && info.officeName) || ''),
    '同意日時': nowIso,
    '作成日時': nowIso,
    '更新日時': nowIso,
    '削除フラグ': false,
  }]);
  return { externalId: newId, created: true };
}

// 既存の外部申込者の連絡先を、空でない値だけ更新する。
// 空で上書きすると、管理画面のゲスト追加（メール任意）が既存の連絡先を消してしまう。
function updateExternalApplicantContact_(ss, externalId, info, nowIso) {
  try {
    var sheet = ss.getSheetByName('T_外部申込者');
    var found = findRowByColumnValue_(sheet, '外部申込者ID', String(externalId || ''));
    if (!found) return;
    var cols = found.columns;
    var row = found.row;
    var updates = {
      '氏名': (info && info.name) || '',
      'フリガナ': (info && info.kana) || '',
      '電話番号': (info && info.phone) || '',
      '事業所名': (info && info.officeName) || '',
    };
    var changed = false;
    for (var key in updates) {
      if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;
      var value = String(updates[key] || '').trim();
      if (!value || cols[key] == null) continue;
      // 2026-10-13: 登録済みの値は上書きしない（空欄だけ埋める）。この経路は匿名の公開申込で、
      // メールアドレスを知っていれば他人の氏名・電話を書き換えられた（名簿にそのまま出る）。
      // 連絡先の変更は事務局が名簿で行う。
      if (String(row[cols[key]] || '').trim() !== '') continue;
      row[cols[key]] = value;
      changed = true;
    }
    if (!changed) return;
    if (cols['更新日時'] != null) row[cols['更新日時']] = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } catch (e) {
    Logger.log('[updateExternalApplicantContact_] ' + externalId + ': ' + e.message);
  }
}

// 同じ研修に同じ人の有効な申込が既にあるか。無ければ null。
// applicant: { kind: 'MEMBER'|'EXTERNAL', memberId, staffId, externalId }
function findExistingTrainingApplication_(ss, trainingId, applicant) {
  var rows = getTrainingApplicationRows_(ss, { appliedOnly: true, trainingId: String(trainingId || '') });
  var kind = String((applicant && applicant.kind) || '');
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (kind === 'MEMBER') {
      if (isMemberApplicationRecord_(row, trainingId, applicant.memberId, applicant.staffId)) return row;
      continue;
    }
    if (String(row['申込者区分コード'] || '') !== 'EXTERNAL') continue;
    var target = String((applicant && applicant.externalId) || '');
    if (!target) continue;
    // 申込者ID と 外部申込者ID のどちらに入っているかは経路によって違う（申込者解決の 2 モデル）。
    if (String(row['申込者ID'] || '') === target || String(row['外部申込者ID'] || '') === target) return row;
  }
  return null;
}

// 研修IDだけ分かっている呼び出し元（管理画面の名簿追加）向け。

// 定員の判定。数え方は countAppliedApplicants_ に一本化する。
// 管理画面からは意図的に超過させられるが、超えたことは呼び出し元へ返して伝える
// （運用の基本は定員そのものを広げること）。
function evaluateTrainingCapacity_(ss, trainingId, capacityValue) {
  var capacity = Number(capacityValue || 0);
  var applicants = countAppliedApplicants_(ss, trainingId);
  return {
    capacity: capacity,
    applicants: applicants,
    isFull: capacity > 0 && applicants >= capacity,
  };
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

// ============================================================
// 【申込者解決ヘルパーの使い分け — 重要・v376.21 ガードレール】
//
// 申込者の解決には用途の異なる 2 モデルが併存する。混同禁止:
//
//  (1) getCanonicalApplicantRef_  … v360 正本・STAFF を独立 type として返す。
//      「実際に申込んだのは誰か（送信先メール・名簿表示・本人解決）」を求める用途は
//      必ずこちら。STAFF 申込を職員個人として正しく解決する。
//
//  (2) getApplicationApplicantType_ / getApplicationApplicantId_ /
//      getMemberIdFromApplication_  … legacy「MEMBER + 別途 職員ID」モデル。
//      整合性検証 (getTrainingApplicationIntegrityIssues_) と会員申込フィルタが
//      この前提で組まれているため温存している。STAFF 申込を独立解決しない。
//
// ⚠️ 禁止: (2) を「送信先・名簿・本人」の解決に使わないこと。STAFF 申込が
//    会員として誤解決され、事業所代表メールへ誤送信される（v376.12 で実際に発生）。
//    送信先・表示・本人解決は必ず (1) getCanonicalApplicantRef_ を使う。
// ============================================================
/**
 * @deprecated v376.52〜（docs/248 是正）。legacy「MEMBER + 別途 職員ID」モデル。
 * 用途は整合性検証・会員申込フィルタに限定（上記ガードレール参照）。
 * 送信先・名簿・本人解決に使うことは禁止。新規呼出は追加しない（v377 で撤去予定）。
 */
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

// legacy モデル: 会員申込フィルタ専用（MEMBER 以外は '' を返す）。
// 送信先・名簿・本人解決には使わない（getCanonicalApplicantRef_ を使う / 上記ガードレール参照）。
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
 * v350: processPendingThumbnails を 10 分ごとに走らせるトリガーを登録する。
 * 既存の同名トリガーを削除して再登録（冪等）。
 * admin の Apps Script editor から 1 回手動実行する想定。
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

/**
 * v349: URL から fileId を抽出して Drive 上のファイルを trashed にする。
 * 想定: 研修案内 PDF / サムネイル PNG の差し替え時に旧ファイルを GC する。
 * fileId が抽出できない / 既に trashed / 権限不足 等は黙って無視する。
 */
/**
 * v349 backfill: 既存研修のサムネイル PNG を一括生成する MASTER 専用ツール。
 * clasp run regenerateAllThumbnails --params '[{ ... }]' から呼ぶ。
 *
 * payload:
 *   - trainingId?: string  特定の研修だけ対象。未指定で全件
 *   - force?: boolean      既にサムネイル URL がある研修も上書きする
 *   - dryRun?: boolean     生成は行わず対象数だけ報告
 *
 * 返却: { dryRun, processed, succeeded, skipped, failed: [{id,name,reason}] }
 *
 * セキュリティ: clasp run は OAuth 認証済の deployer (k.noguchi@hcm-n.org) として
 * 実行されるため、ここでは MASTER 確認を行わない。Apps Script editor から
 * 誤って呼ばれても damage は「サムネイル再生成」だけで非破壊。元 PDF が現 deployer
 * から不可視 (Drive REST 404) のものはスキップして失敗扱い + 理由をログへ。
 */



// ── 研修案内PDF サムネイル バッチ生成（時間ベーストリガーで定期実行）──────────

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

/**
 * 初期化順序の不変条件 (v342, docs/204 再発防止):
 *   1. createMasterSheets_ は writeSheetHeaders_ の name-based shift により、
 *      master sheet の列追加でデータ列が残存していても安全に migrate される。
 *   2. ensureTableSheetsExist_ は欠落シートのみ追加。既存シートのヘッダーは触らない。
 *   3. normalizeTableColumns_ が各 T_* テーブルの name-based shift を実施する。
 *   4. auditDeleteFlagColumns_ は migration 後の sanity check (read-only) であり、
 *      schema-drift の取りこぼしを Logger.log で警告する。
 * createTableSheets_ は v340 以降 initializeSchema_ から外している。既存シートの
 * ヘッダー上書きより前に name-based migration を走らせる目的。
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
  // マスタの初期値・列の整備を書いたかもしれないので、選択肢のキャッシュを捨てる
  post('invalidateMasterOptionsCache_',          function() { invalidateMasterOptionsCache_(); });

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

// 2026-10-19 docs/307 S18: 列の整え方を決める（シートには触らない）。
//   same    … 定義と同じ。何もしない
//   append  … 今の列が定義の先頭と同じで、末尾に足すだけ。見出しのセルを書き足す（行・書式・入力規則に触らない）
//   rebuild … 並べ替えが要る。消える列は無い
//   blocked … 定義に無い列・名前の重なった列・見出しの無い列にデータがある。消さずに止める
// columnHasData[i] は今の i 列目に（見出しを除いて）値が 1 つでもあるか。
function planTableColumnNormalization_(currentHeaders, targetHeaders, columnHasData) {
  var current = [];
  for (var i = 0; i < currentHeaders.length; i += 1) current.push(String(currentHeaders[i] == null ? '' : currentHeaders[i]));
  // 末尾の、見出しもデータも無い列は数えない（getLastColumn が書式だけの列を含むことがある）
  while (current.length > 0 && current[current.length - 1] === '' && !(columnHasData && columnHasData[current.length - 1])) {
    current.pop();
  }
  var target = [];
  var targetSet = {};
  for (var t = 0; t < targetHeaders.length; t += 1) {
    target.push(String(targetHeaders[t]));
    targetSet[String(targetHeaders[t])] = true;
  }

  var dropped = [];
  var seen = {};
  for (var c = 0; c < current.length; c += 1) {
    var name = current[c];
    var hasData = !!(columnHasData && columnHasData[c]);
    if (name === '') {
      if (hasData) dropped.push('（見出しなし・' + (c + 1) + '列目）');
      continue;
    }
    if (seen[name]) { dropped.push(name + '（重複・' + (c + 1) + '列目）'); continue; }
    seen[name] = true;
    if (!targetSet[name]) dropped.push(name);
  }
  var added = [];
  for (var a = 0; a < target.length; a += 1) {
    if (!seen[target[a]]) added.push(target[a]);
  }
  if (dropped.length > 0) return { mode: 'blocked', added: added, dropped: dropped };

  var isPrefix = current.length <= target.length;
  for (var p = 0; isPrefix && p < current.length; p += 1) {
    if (current[p] !== target[p]) isPrefix = false;
  }
  if (isPrefix && current.length === target.length) return { mode: 'same', added: [], dropped: [] };
  if (isPrefix) return { mode: 'append', added: target.slice(current.length), dropped: [] };
  return { mode: 'rebuild', added: added, dropped: [] };
}

function normalizeTableColumns_(ss, tableName) {
  var targetHeaders = テーブル定義[tableName];
  if (!targetHeaders || targetHeaders.length === 0) return { mode: 'same', added: [], dropped: [] };

  var sheet = ss.getSheetByName(tableName);
  if (!sheet) return { mode: 'same', added: [], dropped: [] };
  var lastCol = Math.max(1, sheet.getLastColumn());
  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var oldRows = [];
  if (sheet.getLastRow() > 1) {
    oldRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  }
  var columnHasData = [];
  for (var ch = 0; ch < lastCol; ch += 1) {
    var has = false;
    for (var rr = 0; rr < oldRows.length && !has; rr += 1) {
      var cell = oldRows[rr][ch];
      if (cell !== '' && cell !== null && cell !== undefined) has = true;
    }
    columnHasData.push(has);
  }

  var plan = planTableColumnNormalization_(currentHeaders, targetHeaders, columnHasData);
  if (plan.mode === 'same') return plan;
  if (plan.mode === 'blocked') {
    // 消さずに止める。critical step なので initializeSchema_ ごと止まり、初期化済みの印も付かない
    Logger.log('[normalizeTableColumns_][BLOCKED] ' + tableName + ' dropped=' + JSON.stringify(plan.dropped));
    throw new Error('スキーマ整備を止めました: ' + tableName + ' の列 ' + plan.dropped.join('・') +
      ' は定義に無いため、データを消さずに止めました。列名を定義へ足すか、データを移してから列を外してください。');
  }
  if (plan.mode === 'append') {
    var startCol = targetHeaders.length - plan.added.length + 1;
    if (sheet.getMaxColumns() < targetHeaders.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), targetHeaders.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, startCol, 1, plan.added.length).setValues([plan.added]);
    Logger.log('[normalizeTableColumns_][APPEND] ' + tableName + ' added=' + JSON.stringify(plan.added));
    return plan;
  }

  var oldHeaderIndex = {};
  for (var h = 0; h < currentHeaders.length; h += 1) {
    var headerKey = String(currentHeaders[h] || '');
    if (headerKey && oldHeaderIndex[headerKey] == null) oldHeaderIndex[headerKey] = h;
  }

  var tempName = '__TMP_' + tableName + '_' + Utilities.getUuid().substring(0, 8);
  var tempSheet = ss.insertSheet(tempName);
  tempSheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);

  if (oldRows.length > 0) {
    var mapRow = function(row, fill) {
      return targetHeaders.map(function(header) {
        var idx = oldHeaderIndex[String(header || '')];
        return idx == null ? fill : row[idx];
      });
    };
    // 書式を先に移す。書式の無いセルへ文字列を書くと '0123' が数値 123 になる
    var oldFormats = sheet.getRange(2, 1, oldRows.length, lastCol).getNumberFormats();
    var dataRange = tempSheet.getRange(2, 1, oldRows.length, targetHeaders.length);
    dataRange.setNumberFormats(oldFormats.map(function(row) { return mapRow(row, 'General'); }));
    dataRange.setValues(oldRows.map(function(row) { return mapRow(row, ''); }));
  }
  Logger.log('[normalizeTableColumns_][REBUILD] ' + tableName + ' added=' + JSON.stringify(plan.added));

  var oldIndex = sheet.getIndex();
  ss.deleteSheet(sheet);
  tempSheet.setName(tableName);
  ss.setActiveSheet(tempSheet);
  ss.moveActiveSheet(oldIndex);
  return plan;
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
  if (changed) {
    sheet.getRange(2, 1, rows.length, sheet.getLastColumn()).setValues(rows);
    invalidateMasterOptionsCache_();
  }
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
    { key: 'PUBLIC_PORTAL_PRIVACY_POLICY_URL', value: PUBLIC_PORTAL_DEFAULTS.privacyPolicyUrl, desc: '公開ポータル：プライバシーポリシーの掲載先URL（空ならリンクを出さない）' },
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
    { key: 'PUBLIC_PORTAL_WITHDRAWAL_CONFIRMATION_ITEMS', value: '', desc: '公開ポータル：退会確認項目の表示・文言設定' },
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
    { key: 'LOGIN_ID_CHANGED_SUBJECT',       value: LOGIN_ID_CHANGED_DEFAULT_SUBJECT,       desc: 'ログインID変更のお知らせ件名' },
    { key: 'LOGIN_ID_CHANGED_BODY',          value: LOGIN_ID_CHANGED_DEFAULT_BODY,          desc: 'ログインID変更のお知らせ本文' },
    { key: 'CONTACT_EMAIL_CHANGED_SUBJECT',  value: CONTACT_EMAIL_CHANGED_DEFAULT_SUBJECT,  desc: 'メールアドレス変更のお知らせ件名' },
    { key: 'CONTACT_EMAIL_CHANGED_BODY',     value: CONTACT_EMAIL_CHANGED_DEFAULT_BODY,     desc: 'メールアドレス変更のお知らせ本文' },
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

  // 旧キーは既存デプロイメントとの互換用。MAIL_DELIVERY_STATE は管理画面の保存時にだけ
  // 作成する。ここで STOPPED を初期投入すると、既存環境の LIVE を誤って停止させるため。
  var mailGuardDefaults = [
    { key: 'MAIL_GLOBAL_ENABLED',         value: 'false', desc: 'メール送信のグローバルキルスイッチ（false で全停止）' },
    { key: 'MAIL_DELIVERY_MODE',          value: 'LIVE',  desc: '旧互換: 配信モード' },
    { key: 'MAIL_REDIRECT_ALLOWLIST',     value: '',      desc: 'REDIRECT モード時の送信先（カンマ区切り）' },
    { key: 'TRAINING_APPLY_RECEIPT_ENABLED', value: 'true', desc: '研修申込確認メール送信ON/OFF' },
    { key: 'TRAINING_REMINDER_ENABLED',   value: 'true', desc: '研修リマインダーメール送信ON/OFF' },
    { key: 'BULK_MAIL_ENABLED',           value: 'true', desc: '一括メール送信ON/OFF' },
    { key: 'AUTH_OTP_ENABLED',            value: 'true', desc: '公開ポータル OTP メール送信ON/OFF' },
    { key: 'LOGIN_ID_CHANGED_ENABLED', value: 'true', desc: 'ログインID変更のお知らせ送信ON/OFF' },
    { key: 'CONTACT_EMAIL_CHANGED_ENABLED', value: 'true', desc: 'メールアドレス変更のお知らせ送信ON/OFF' },
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

  // Google Chat の接続先は Script Properties 専用。ここには有効化と本文だけを保存する。
  var chatMembershipDefaults = [
    { key: 'CHAT_MEMBERSHIP_NOTIFICATION_ENABLED', value: 'false', desc: 'Google Chat 会員手続き通知の全体有効化（Webhook URL は Script Properties）' },
    { key: 'CHAT_MEMBERSHIP_REQUEST_ENABLED', value: 'true', desc: 'Google Chat 会員手続きの受付通知' },
    { key: 'CHAT_MEMBERSHIP_FINAL_ENABLED', value: 'true', desc: 'Google Chat 会員手続きの確定通知' },
    { key: 'CHAT_MEMBERSHIP_ANOMALY_ENABLED', value: 'true', desc: 'Google Chat 会員手続きの異常通知' },
    { key: 'CHAT_MEMBERSHIP_REQUEST_BODY', value: CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY, desc: 'Google Chat 会員手続きの受付通知本文' },
    { key: 'CHAT_MEMBERSHIP_FINAL_BODY', value: CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY, desc: 'Google Chat 会員手続きの確定通知本文' },
    { key: 'CHAT_MEMBERSHIP_ANOMALY_BODY', value: CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY, desc: 'Google Chat 会員手続きの異常通知本文' },
  ];
  chatMembershipDefaults.forEach(function(item) {
    if (!byKey[item.key]) {
      appendRowsByHeaders_(ss, 'T_システム設定', [{
        設定キー: item.key, 設定値: item.value, 説明: item.desc, 更新日時: now,
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
  var publicPortalPrivacyPolicyUrl = String(map['PUBLIC_PORTAL_PRIVACY_POLICY_URL'] || '');
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
    '追加確認が必要な場合のみ、事務局からご連絡します。'
  ].join('\n');
  var publicPortalCompletionGuidanceBodyWhenCredentialNotSent = String(map['PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT'] || '') || [
    legacyCompletionNoCredentialNotice,
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '追加確認が必要な場合のみ、事務局からご連絡します。'
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
  var ppWithdrawalConfirmationItems = parseWithdrawalConfirmationItems_(map['PUBLIC_PORTAL_WITHDRAWAL_CONFIRMATION_ITEMS']);
  // v376.65（案C Phase 1）: 入会申込画面に出す規程・重要事項（公開フラグの立った行のみ）
  var ppRegulations = listRegulations_(db, true);
  // v376.64: 入会申込の会員種別カードに表示する年会費（正本は M_会員種別.年会費金額）
  // 種別ごとの年会費は memberTypes[].annualFee に乗る（入会フォームの種別カードはこの一覧から描く）
  var ppMemberTypes = readMemberTypeMaster_(db);
  var ppMembershipFeeVisibleRaw = map['MEMBERSHIP_FEE_PUBLIC_VISIBLE'];
  var ppMembershipFeeVisible = ppMembershipFeeVisibleRaw === undefined || ppMembershipFeeVisibleRaw === ''
    ? MEMBERSHIP_FEE_DEFAULTS.publicVisible
    : String(ppMembershipFeeVisibleRaw) !== 'false';
  var ppMembershipFeeNote = map['MEMBERSHIP_FEE_NOTE'] == null ? MEMBERSHIP_FEE_DEFAULTS.note : String(map['MEMBERSHIP_FEE_NOTE']);
  return JSON.stringify({
    success: true,
    data: {
      regulations: ppRegulations,
      memberTypes: ppMemberTypes,
      masters: masterOptionsForClient_(db, 'PUBLIC'),
      membershipFeeVisible: ppMembershipFeeVisible,
      membershipFeeNote: ppMembershipFeeNote,
      trainingMenuEnabled: publicPortalTrainingMenuEnabled,
      membershipMenuEnabled: publicPortalMembershipMenuEnabled,
      privacyPolicyUrl: publicPortalPrivacyPolicyUrl,
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
      withdrawalConfirmationItems: ppWithdrawalConfirmationItems,
    }
  });
}

// v345: Google Drive ファイルのサムネイルを base64 data URL で返す。
//
// 真因の経緯:
//   - v272 で DriveApp.getFileById(id).getThumbnail() を使用していたが、これは
//     PDF に対し常に null を返す Apps Script の既知制約があり、PDF サムネイルが
//     一切表示できない状態だった（issuetracker / forums 多数）。
//   - v345 で Google Drive の公開 thumbnail endpoint
//     `https://drive.google.com/thumbnail?id=<id>&sz=w400` を UrlFetchApp で取得し、
//     bytes を base64 へ変換するアプローチへ切替。Drive の thumbnail CDN が PDF→
//     画像変換を裏で実行するため、PDF にもサムネイルが返る。
//   - <img src> 直接参照では rate limit / 多枚問題が起きるが、サーバー側で取得して
//     base64 化すればクライアントは data: URL を読むだけなので回避できる。
//   - ANYONE_WITH_LINK 共有ファイルは無認証 UrlFetchApp で取得可能（member split は
//     drive scope 無しだが script.external_request はあるため動作する）。
//   - CacheService で 1 時間キャッシュ（item size limit 100KB を考慮し、超える
//     payload はキャッシュをスキップ）。
/**
 * v349: 引数で渡される URL は「PDF の URL」ではなく **「事前生成済み PNG サムネイル」
 * の Drive URL** である前提（uploadTrainingFile_ が生成して T_研修.案内状サムネイルURL
 * に保存している）。実行ユーザー所有の PNG なので DriveApp.getBlob() で確実に取れる。
 *
 * v358: payload.size でリサイズ指示を受け付ける。
 *   - 未指定 / 0: 既存の DriveApp.getBlob() (元 PNG をそのまま返却、低解像度サムネ用)
 *   - 数値 (例: 2000): Drive thumbnailLink を w<N> で再取得して高解像度 PNG を返す
 *     （lightbox 拡大表示用）
 *
 * 想定外（fileId 抽出不可 / 取得例外 / image 以外）の場合は SVG プレースホルダを返却し、
 * 画面が空にならないようにする。
 */
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
    // 2026-10-13: 項目設定で「無効」にした項目は返さない。以前は画面が隠すだけで、講師名・内容・
    // 使っていない方の問合せ先（電話・メール）まで応答に入っていた。項目設定JSON も丸ごと返していた。
    var opts = {};
    try { opts = JSON.parse(String(r['項目設定JSON'] || '') || '{}') || {}; } catch (e) { opts = {}; }
    var fc = (opts.fieldConfig && typeof opts.fieldConfig === 'object') ? opts.fieldConfig : {};
    var on = function(key) { return fc[key] !== false; };
    var publicOptions = {
      fieldConfig: fc,
      inquiryPerson: String(opts.inquiryPerson || ''),
      inquiryContactType: String(opts.inquiryContactType || ''),
      inquiryContactValue: String(opts.inquiryContactValue || ''),
    };
    return {
      id: String(r['研修ID'] || ''),
      name: String(r['研修名'] || ''),
      date: formatDateForApi_(r['開催日']),
      endTime: formatTimeOnly_(r['開催終了時刻']),
      capacity: Number(r['定員'] || 0),
      location: String(r['開催場所'] || ''),
      summary: String(r['研修概要'] || ''),
      content: on('description') ? String(r['研修内容'] || '') : '',
      cost: on('fees') ? String(r['費用JSON'] || '') : '',
      startDate: on('applicationOpenDate') ? formatDateForApi_(r['申込開始日']) : '',
      endDate: on('applicationCloseDate') ? formatDateForApi_(r['申込締切日']) : '',
      instructor: on('instructor') ? String(r['講師'] || '') : '',
      fileUrl: on('guidePdfUrl') ? String(r['案内状URL'] || '') : '',
      thumbnailUrl: on('guidePdfUrl') ? String(r['案内状サムネイルURL'] || '') : '',
      applicationUrl: on('applicationUrl') ? String(r['申込URL'] || '') : '', // v376.30: 外部申込フォーム URL
      organizer: String(r['主催者'] || ''),
      fieldConfig: JSON.stringify(publicOptions),
      // BR-21: 申込フォームに介護支援専門員番号の欄を出すか
      askMemberNumber: resolveTrainingAsksMemberNumber_(r),
    };
  });
  return JSON.stringify({ success: true, data: result });
}

// 研修の申込方法: 'none'（申込URL トグル無効＝閲覧のみ）/ 'external'（URL あり）/ 'internal'（URL 空）。
// 画面の resolveApplyCta（src/shared/trainingOptions.ts）と同じ規則。項目設定JSON が読めなければ既定（有効）。
function resolveTrainingApplyMode_(trainingRow) {
  var enabled = true;
  try {
    var opts = JSON.parse(String((trainingRow && trainingRow['項目設定JSON']) || '') || '{}');
    if (opts && opts.fieldConfig && opts.fieldConfig.applicationUrl === false) enabled = false;
  } catch (e) { /* 旧データ・壊れた JSON は既定（有効） */ }
  if (!enabled) return 'none';
  return String((trainingRow && trainingRow['申込URL']) || '').trim() ? 'external' : 'internal';
}

// 2026-10-18 BR-21: 公開ポータルの研修申込で介護支援専門員番号を尋ねるか。
// 項目設定JSON の askMemberNumber が真偽で入っていればそれに従う。入っていない（この設定より前の研修）ときは
// 費用から決める: 金額が 2 通り以上ある＝会員と非会員で違う研修だけ尋ねる。
// 画面はこの関数の結果（API の askMemberNumber）を受け取るだけで、自分では判定しない。
function resolveTrainingAsksMemberNumber_(trainingRow) {
  try {
    var opts = JSON.parse(String((trainingRow && trainingRow['項目設定JSON']) || '') || '{}');
    if (opts && typeof opts.askMemberNumber === 'boolean') return opts.askMemberNumber;
    // 研修費用を「無効」にした研修は参加費無料として案内している（会員と非会員の違いが無い）
    if (opts && opts.fieldConfig && opts.fieldConfig.fees === false) return false;
  } catch (e) { /* 壊れた JSON は費用から決める */ }
  var fees = [];
  try { fees = JSON.parse(String((trainingRow && trainingRow['費用JSON']) || '') || '[]'); } catch (e2) { fees = []; }
  if (!Array.isArray(fees)) return false;
  var amounts = {};
  fees.forEach(function(f) { if (f && f.amount !== undefined && f.amount !== '') amounts[String(Number(f.amount))] = true; });
  return Object.keys(amounts).length >= 2;
}

// 2026-10-18 BR-21: 公開ポータルの研修申込者が会員かどうかを、氏名と介護支援専門員番号で照合する。
// 対象は在籍中の個人会員と、在籍中の事業所会員の在籍職員。賛助会員は含めない（研修申込の可否が U-16 で未確定）。
// 戻り値の code:
//   MEMBER    … 番号と氏名がそろって 1 人に一致した（memberId / staffId を返す）
//   UNMATCHED … 番号は入力されたが一致しない・2 人以上に一致した（非会員として扱う）
//   NONE      … 番号が空白（非会員として扱う）
// 結果はサーバ内部と管理画面でだけ使う。公開ポータルへは返さない（会員かどうかを外から探れないようにする）。
function matchTrainingApplicantMembership_(memberRows, staffRows, name, cmNumber) {
  var cm = normalizeCmNumberForKey_(cmNumber);
  if (!cm) return { code: 'NONE', memberId: '', staffId: '' };
  var nameKey = normalizeRosterKeyText_(name);
  if (!nameKey) return { code: 'UNMATCHED', memberId: '', staffId: '' };

  var activeMembers = {};
  var hits = [];
  (memberRows || []).forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (isInactiveMemberStatusForIdentity_(r['会員状態コード'])) return;
    var memberId = String(r['会員ID'] || '');
    var type = String(r['会員種別コード'] || '');
    activeMembers[memberId] = type;
    if (type !== 'INDIVIDUAL') return;
    // 登録側が空の番号は一致とみなさない（BR-19 と同じ）
    var dbCm = normalizeCmNumberForKey_(r['介護支援専門員番号']);
    if (!dbCm || dbCm !== cm) return;
    if (normalizeNameKey_(r['姓'], r['名']) !== nameKey) return;
    hits.push({ memberId: memberId, staffId: '' });
  });
  (staffRows || []).forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (String(r['職員状態コード'] || '') !== 'ENROLLED') return;
    var memberId = String(r['会員ID'] || '');
    if (activeMembers[memberId] !== 'BUSINESS') return;
    var dbCm = normalizeCmNumberForKey_(r['介護支援専門員番号']);
    if (!dbCm || dbCm !== cm) return;
    if (normalizeNameKey_(r['姓'], r['名']) !== nameKey) return;
    hits.push({ memberId: memberId, staffId: String(r['職員ID'] || '') });
  });
  if (hits.length !== 1) return { code: 'UNMATCHED', memberId: '', staffId: '' };
  return { code: 'MEMBER', memberId: hits[0].memberId, staffId: hits[0].staffId };
}

function applyTrainingExternal_(payload) {
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), 'TRAINING');
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
  var declaredCm = normalizeCmNumberForKey_(payload.careManagerNumber);

  if (!name || name.length > 100) return JSON.stringify({ success: false, error: '氏名が無効です' });
  // 番号は任意。入力があるときだけ書式を見る（管理画面と同じ 1〜10 桁の英数字。HN/HS 付きの会員がいるため）
  if (declaredCm && !isValidCmNumberRelaxed_(declaredCm)) return JSON.stringify({ success: false, error: '介護支援専門員番号は半角英数字で入力してください' });
  if (furigana.length > 100) return JSON.stringify({ success: false, error: 'フリガナが無効です' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return JSON.stringify({ success: false, error: 'メールアドレスが無効です' });
  if (!phone || !/^[\d\-\+\(\)]+$/.test(phone) || phone.length > 20) return JSON.stringify({ success: false, error: '電話番号が無効です' });
  if (office.length > 100) return JSON.stringify({ success: false, error: '事業所名が無効です' });
  if (!trainingId) return JSON.stringify({ success: false, error: '研修IDが無効です' });
  if (!consent) return JSON.stringify({ success: false, error: 'プライバシーポリシーへの同意が必要です' });
  consumePublicSubmissionQuota_('TRAINING', email);

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
    // 2026-10-13: 研修の申込方法をサーバでも効かせる（画面 src/shared/trainingOptions.ts resolveApplyCta と同じ規則）。
    // 以前は画面がボタンを隠すだけで、閲覧のみ・外部フォームの研修にも内部の申込が入った。
    var applyMode = resolveTrainingApplyMode_(training);
    if (applyMode === 'none') return JSON.stringify({ success: false, error: 'この研修は申込を受け付けていません。' });
    if (applyMode === 'external') return JSON.stringify({ success: false, error: 'この研修は案内にある申込フォームからお申し込みください。' });

    if (evaluateTrainingCapacity_(db, trainingId, training['定員']).isFull) {
      return JSON.stringify({ success: false, error: '定員に達しています' });
    }

    var applySheet = db.getSheetByName('T_研修申込');

    // 2026-09-27: 以前はここで既存の外部申込者を探したうえで、見つかっても必ず
    // 新しい行を作っていた。同じ人が別の研修に申し込むたびに T_外部申込者 が増え、
    // 名簿でも宛先でも 1 人が複数人に見えていた。同一性の判定は共通ルールに委ねる。
    var resolvedExternal = resolveOrCreateExternalApplicant_(db, {
      name: name, kana: furigana, email: email, phone: phone, officeName: office,
    });
    var externalId = resolvedExternal.externalId;

    if (findExistingTrainingApplication_(db, trainingId, { kind: 'EXTERNAL', externalId: externalId })) {
      return JSON.stringify({ success: false, error: '既に申込済みです' });
    }

    // BR-21: 会員かどうか。尋ねない研修では番号を受け取っても照合も保存もしない。
    var membership = { code: 'NOT_ASKED', memberId: '', staffId: '' };
    if (resolveTrainingAsksMemberNumber_(training)) {
      membership = matchTrainingApplicantMembership_(
        getRowsAsObjectsFromSheet_(db.getSheetByName('T_会員')),
        getRowsAsObjectsFromSheet_(db.getSheetByName('T_事業所職員')),
        name, declaredCm);
    }

    var nowStr = new Date().toISOString();

    var applyId = generateTrainingApplyId_();
    var applyColsAll = テーブル定義.T_研修申込;
    var newApply = {};
    for (var m = 0; m < applyColsAll.length; m += 1) { newApply[applyColsAll[m]] = ''; }
    newApply['会員照合結果コード'] = membership.code;
    newApply['照合会員ID'] = membership.memberId;
    newApply['照合職員ID'] = membership.staffId;
    newApply['申告介護支援専門員番号'] = membership.code === 'NOT_ASKED' ? '' : declaredCm;
    newApply['申込ID'] = applyId;
    newApply['研修ID'] = trainingId;
    newApply['申込者区分コード'] = 'EXTERNAL';
    newApply['申込者ID'] = externalId;
    newApply['申込状態コード'] = 'APPLIED';
    newApply['申込日時'] = nowStr;
    newApply['作成日時'] = nowStr;
    newApply['更新日時'] = nowStr;
    newApply['削除フラグ'] = false;
    // 列の位置ではなく見出しで書く。照合の列がまだ無いシート（スキーマ移行前）に書くと、
    // 会員かどうかが黙って落ちるので止める（fail-closed）。
    var applyHeaders = applySheet.getRange(1, 1, 1, applySheet.getLastColumn()).getValues()[0].map(String);
    if (applyHeaders.indexOf('会員照合結果コード') < 0) {
      throw new Error('研修申込の受付を準備中です。しばらくしてからお申し込みください。');
    }
    appendRowsByHeaders_(db, 'T_研修申込', [newApply]);

    updateTrainingApplicantCount_(db, trainingId);
    clearAllDataCache_();

    try {
      // v376.43: 件名/本文を設定値（無ければ既定）から差し込み描画。
      var applyMail = renderConfiguredMail_(db, 'TRAINING_APPLY_RECEIPT_SUBJECT', 'TRAINING_APPLY_RECEIPT_BODY',
        TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT, TRAINING_APPLY_RECEIPT_DEFAULT_BODY, {
          '申込者名': name,
          '研修名': String(training['研修名'] || ''),
          '開催日': formatTrainingDate_(training['開催日'], training['開催終了時刻']),
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
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), 'TRAINING');
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
  // 2026-10-13: 会員側の取消と同じ規則を効かせる。以前は「キャンセル可」設定・開催日・申込状態の
  // どれも見ておらず、キャンセル不可の研修や開催後・取消済みの申込も取り消せた。
  if (String(apply['申込状態コード'] || '') !== 'APPLIED') {
    return JSON.stringify({ success: false, error: 'この申込は既に取り消されています' });
  }
  var cancelTrainingFound = findRowByColumnValue_(db.getSheetByName('T_研修'), '研修ID', String(apply['研修ID'] || ''));
  if (!cancelTrainingFound || !isTrainingCancelable_(cancelTrainingFound.row, cancelTrainingFound.columns)) {
    return JSON.stringify({ success: false, error: 'この研修はキャンセルできません。事務局へお問い合わせください。' });
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
  // 2026-10-01: 勤務先名を追加した。入会申込では必須で取るのに本人からは変更できず、
  // 転職しても「前職の名前 ＋ 現職の住所・電話」という行しか作れなかった。
  // 郵送先区分が勤務先のとき宛名を決めるのはこの項目（docs/spec/02_RD.md §591）なので、
  // 変えられないままだと郵便が前職へ届く。認証には影響しない
  // （個人会員のログインIDは介護支援専門員番号）。
  'officeName',
  'phone', 'fax',
  'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  'homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine', 'homeAddressLine2',
  'mailingPreference', 'preferredMailDestination',
  'careManagerNumber',
];

// 勤務先なしを表す予約語と判定。正本の考え方は docs/spec/02_RD.md §479
// 「勤務先名が空または 勤務なし の場合は勤務先なしとして扱う」。
// フロント側の同一実装は src/shared/officeAffiliation.ts にあり、
// npm run test:office-affiliation が両者の一致を検査する。
var NO_OFFICE_AFFILIATION_LABEL_ = '勤務なし';


// 2026-10-02: マスタに実在するコードかを確かめる（docs/294 §2-6）。
// シートの入力規則（入力規則定義）は人が手で入力するときしか効かず、
// Apps Script の setValues は素通りする。コード側で突き合わせないと守れない。
// 主キー列はマスタごとに違う（M_出欠状態 は『コード』、M_役職マスタ は『役職コード』）ので
// マスタ定義の先頭列を使う。
function isKnownMasterCode_(ss, masterName, code) {
  var value = String(code == null ? '' : code).trim();
  if (!value) return false;
  var columns = マスタ定義[masterName];
  if (!columns || !columns.length) return false;
  var sheet = ss.getSheetByName(masterName);
  if (!sheet) return false;
  var found = findRowByColumnValue_(sheet, columns[0], value);
  if (!found) return false;
  if (found.columns['削除フラグ'] != null && toBoolean_(found.row[found.columns['削除フラグ']])) return false;
  if (found.columns['有効フラグ'] != null && !toBoolean_(found.row[found.columns['有効フラグ']])) return false;
  return true;
}

// ── マスタの選択肢（2026-10-19・operator 指示: DRY／ハードコード禁止／マスタは今後も増える） ──
// マスタ定義 にある M_ 表すべてを、同じ形で読む。1 列目がコード、2 列目が名称（どのマスタも同じ並び）。
// 有効フラグが false・削除フラグが true の行を除き、表示順に並べる。
// 画面の選択肢・名称、GAS の名称表はすべてここから引く。マスタ定義 に表を足せば、コードを変えずに乗る。
// 書き込みの検査は isKnownMasterCode_（シートを直接読む）を使う。こちらはキャッシュを通すため。
var MASTER_OPTIONS_CACHE_KEY_ = 'master_options_v1';
var MASTER_OPTIONS_CACHE_TTL_ = 600;
var MASTER_BOOKKEEPING_COLUMNS_ = ['表示順', '有効フラグ', '削除フラグ', '作成日時', '更新日時'];

function masterOptionsFromRows_(masterName, rows) {
  var columns = マスタ定義[masterName] || [];
  var codeCol = columns[0];
  var labelCol = columns[1];
  var extraCols = columns.slice(2).filter(function(c) { return MASTER_BOOKKEEPING_COLUMNS_.indexOf(c) < 0; });
  return rows
    .filter(function(r) {
      if (!String(r[codeCol] || '').trim()) return false;
      if (r['削除フラグ'] !== undefined && toBoolean_(r['削除フラグ'])) return false;
      if (r['有効フラグ'] !== undefined && !toBoolean_(r['有効フラグ'])) return false;
      return true;
    })
    .sort(function(a, b) { return Number(a['表示順'] || 0) - Number(b['表示順'] || 0); })
    .map(function(r) {
      var code = String(r[codeCol]).trim();
      var attrs = {};
      extraCols.forEach(function(c) { attrs[c] = r[c] === undefined ? '' : r[c]; });
      return { code: code, label: String(r[labelCol] || '').trim() || code, order: Number(r['表示順'] || 0), attrs: attrs };
    });
}

/** マスタ名 → 選択肢の配列（マスタ定義 の全表）。スクリプトキャッシュを通す */
// 1 回の実行の中では読んだ結果を覚えておく（行ごとの正規化で何度呼ばれてもキャッシュを引き直さない）
var MASTER_OPTIONS_MEMO_ = null;
function readAllMasterOptions_(ss) {
  if (MASTER_OPTIONS_MEMO_) return MASTER_OPTIONS_MEMO_;
  var cache = CacheService.getScriptCache();
  var cached = getChunkedCache_(cache, MASTER_OPTIONS_CACHE_KEY_);
  if (cached) {
    MASTER_OPTIONS_MEMO_ = cached;
    return cached;
  }
  var db = ss || getOrCreateDatabase_();
  var result = {};
  Object.keys(マスタ定義).forEach(function(name) {
    result[name] = masterOptionsFromRows_(name, getRowsAsObjects_(db, name));
  });
  putChunkedCache_(cache, MASTER_OPTIONS_CACHE_KEY_, result, MASTER_OPTIONS_CACHE_TTL_);
  MASTER_OPTIONS_MEMO_ = result;
  return result;
}

/** 有効なコードか（キャッシュを通す。行ごとの正規化向け。1 件の書き込みの検査は isKnownMasterCode_） */

// 会員の発送方法・郵送先区分を、マスタに無い値のまま保存しない。
// 2026-10-19: 公開ポータルの変更申請が 'MAIL'（M_発送方法 に無い）を送り、承認でそのまま書かれていた。

function readMasterOptions_(ss, masterName) {
  return readAllMasterOptions_(ss)[masterName] || [];
}

/** コードの表示名（マスタの名称）。マスタに無い・無効なコードはコードのまま返す */

/** マスタのシートを書き換えた関数は必ず呼ぶ（test:master-options が書き換える関数を見つけて確かめる） */
function invalidateMasterOptionsCache_() {
  MASTER_OPTIONS_MEMO_ = null;
  removeChunkedCache_(CacheService.getScriptCache(), MASTER_OPTIONS_CACHE_KEY_);
}

/**
 * 画面へ渡すマスタ。管理は全表（属性つき）、公開・会員は名前を許可した表だけ・属性なし。
 * 公開側に属性（M_業務分類.単価 など）を出さないための許可リスト。新しいマスタは管理には自動で乗る。
 */
var PUBLIC_MASTER_NAMES_ = ['M_会員種別', 'M_発送方法', 'M_郵送先区分', 'M_職員権限', 'M_職員状態', 'M_会員状態'];
function masterOptionsForClient_(ss, scope) {
  var all = readAllMasterOptions_(ss);
  if (scope === 'ADMIN') return all;
  var result = {};
  PUBLIC_MASTER_NAMES_.forEach(function(name) {
    result[name] = (all[name] || []).map(function(o) { return { code: o.code, label: o.label, order: o.order }; });
  });
  return result;
}

// 会員種別の正本は M_会員種別。種別の検査・「全種別」の既定値・画面の会費欄と入会カードはここから引く。
// 金額が不正なときだけコード側の既定額（src/shared/memberTypes.mjs）。
function readMemberTypeMaster_(ss) {
  return readMasterOptions_(ss, 'M_会員種別').map(function(o) {
    var amount = Number(o.attrs['年会費金額']);
    return {
      code: o.code,
      label: o.label,
      order: o.order,
      annualFee: isFinite(amount) && amount >= 0 ? Math.floor(amount) : Number(MEMBER_TYPE_ANNUAL_FEE_DEFAULTS[o.code] || 0),
    };
  });
}


// 事業所会員: 公開ポータル変更申請（管理者承認後に適用）で変更可能なフィールド allowlist
var PUBLIC_BUSINESS_UPDATE_ALLOWLIST_ = [
  'officeName',
  'email', 'phone', 'fax',
  'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  'officeNumber',
];

// 賛助会員: 個人会員と同じ項目から、介護支援専門員番号だけを外す。
// 賛助会員は CM番号を持たない（入会フォームでも個人会員のときしか出さない）ため、
// 変更対象に残すとログインIDを書き換える経路になってしまう。
var PUBLIC_SUPPORT_UPDATE_ALLOWLIST_ = PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_.filter(function(k) {
  return k !== 'careManagerNumber';
});

// 種別 → allowlist。三項演算子で分岐を書くと、種別が増えたときに
// 「INDIVIDUAL 以外＝事業所」と解釈されて賛助会員が事業所扱いになる。実際にそうなった。
var PUBLIC_UPDATE_ALLOWLIST_BY_TYPE_ = {
  INDIVIDUAL: PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_,
  BUSINESS: PUBLIC_BUSINESS_UPDATE_ALLOWLIST_,
  SUPPORT: PUBLIC_SUPPORT_UPDATE_ALLOWLIST_,
};

// docs/307 F21（2026-10-25）: 承認画面に今の値を並べるための、変更申請の項目 → 列。
// 会員一覧（mapMembersForApi_）の対応と同じであることを test:change-request-current が確かめる。
var PUBLIC_UPDATE_FIELD_COLUMN_ = {
  lastName: '姓', firstName: '名', lastKana: 'セイ', firstKana: 'メイ',
  email: '代表メールアドレス', mobilePhone: '携帯電話番号', officeName: '勤務先名',
  phone: '勤務先電話番号', fax: '勤務先FAX番号',
  officePostCode: '勤務先郵便番号', officePrefecture: '勤務先都道府県', officeCity: '勤務先市区町村',
  officeAddressLine: '勤務先住所', officeAddressLine2: '勤務先住所2',
  homePostCode: '自宅郵便番号', homePrefecture: '自宅都道府県', homeCity: '自宅市区町村',
  homeAddressLine: '自宅住所', homeAddressLine2: '自宅住所2',
  mailingPreference: '発送方法コード', preferredMailDestination: '郵送先区分コード',
  careManagerNumber: '介護支援専門員番号', officeNumber: '事業所番号',
};
var STAFF_UPDATE_FIELD_COLUMN_ = {
  lastName: '姓', firstName: '名', lastKana: 'セイ', firstKana: 'メイ',
  email: 'メールアドレス', careManagerNumber: '介護支援専門員番号',
};

// 未処理の申請が変えようとしている項目の今の値（会員の項目と、職員情報変更の職員ごと）

function publicUpdateAllowlistFor_(memberType) {
  return PUBLIC_UPDATE_ALLOWLIST_BY_TYPE_[String(memberType || '')] || PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_;
}

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
// adminSession から MASTER/ADMIN 権限を判定（CM 番号緩和許可の単一判定箇所）

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
    // 2026-10-14（docs/307 E1）: 署名は時間一定で比べる（!== は最初に違った文字で止まり、かかる時間から署名を推測されうる）
    if (!secureCompareString_(sig, expectedSig)) return null;
    var decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(encoded)).getDataAsString();
    var obj = JSON.parse(decoded);
    if (!obj.exp || obj.exp < Date.now()) return null;
    return obj.d;
  } catch (e) {
    return null;
  }
}

// 電話番号の照合キー。数字だけを見る（ハイフン・空白・全角の揺れを吸収）。
// 全角数字はそのままだと落ちるため、半角へ寄せてから数字以外を捨てる。
function normalizePhoneForKey_(value) {
  return String(value == null ? '' : value)
    .replace(/[０-９]/g, function(ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); })
    .replace(/[^0-9]/g, '');
}

// v376.88: 公開ポータルの本人確認で使える照合項目。
//
// 以前は個人 = CM番号、事業所 = 事業所番号 の 1 本だけで、
//   - 賛助会員は鍵が無く、変更・退会のどちらもできなかった（RD §2 は認めている）
//   - 個人会員も CM番号が空の 20 名（187 名中）が通れなかった
// という取りこぼしがあった。実データの充足率を数えたうえで、
// 「氏名（事業所名）＋ 手元にある番号を 1 つ」へ広げる。
//
// 名義の照合は全種別で必須にする。事業所会員はこれまで番号だけで通っていたので、
// この変更で強くなる。
function getPublicIdentityCredentials_() {
  return {
    INDIVIDUAL: [
      { key: 'cmNumber',    column: '介護支援専門員番号', normalize: normalizeCmNumberForKey_, label: '介護支援専門員番号' },
      { key: 'phone',       column: '勤務先電話番号',     normalize: normalizePhoneForKey_,    label: '電話番号' },
      { key: 'mobilePhone', column: '携帯電話番号',       normalize: normalizePhoneForKey_,    label: '携帯電話番号' },
    ],
    BUSINESS: [
      { key: 'officeNumber', column: '事業所番号',     normalize: normalizeCmNumberForKey_, label: '事業所番号' },
      { key: 'phone',        column: '勤務先電話番号', normalize: normalizePhoneForKey_,    label: '電話番号' },
    ],
    SUPPORT: [
      { key: 'phone',       column: '勤務先電話番号', normalize: normalizePhoneForKey_, label: '電話番号' },
      { key: 'mobilePhone', column: '携帯電話番号',   normalize: normalizePhoneForKey_, label: '携帯電話番号' },
    ],
  };
}

// 名義の一致を見る。表記の揺れ（前後空白・全角空白・大小文字）は吸収するが、
// 文字そのものは変えない。事業所名は空白の入り方が揺れやすいのでこの正規化が要る。
function matchesPublicIdentityName_(memberType, member, payload) {
  if (memberType === 'BUSINESS') {
    var inName = normalizeRosterKeyText_(payload.officeName);
    if (!inName) return false;
    return normalizeRosterKeyText_(member['勤務先名']) === inName;
  }
  var inLast = normalizeRosterKeyText_(payload.lastName);
  var inFirst = normalizeRosterKeyText_(payload.firstName);
  if (!inLast || !inFirst) return false;
  return normalizeRosterKeyText_(member['姓']) === inLast
    && normalizeRosterKeyText_(member['名']) === inFirst;
}

// 本人確認（OTP不要）: 入力情報でDB照合し、成功時にアクショントークンを発行。
// 列挙防止: 照合失敗・未存在ともに同一エラーを返す。
// contactEmail はDB照合に使わず、確認メール送信先として保存する。
function verifyMemberIdentityForPublic_(payload) {
  var memberType = String(payload.memberType || '').trim();
  var purpose = String(payload.purpose || '').trim();
  var contactEmail = String(payload.contactEmail || '').trim();

  var credentials = getPublicIdentityCredentials_()[memberType];
  if (!credentials) {
    return { verified: false, error: 'invalid_member_type' };
  }
  if (purpose !== 'update' && purpose !== 'withdrawal') {
    return { verified: false, error: 'invalid_purpose' };
  }
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), purpose === 'withdrawal' ? 'WITHDRAWAL' : 'MEMBER_UPDATE');
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { verified: false, error: '有効なメールアドレスを入力してください' };
  }

  // 入力された照合項目はちょうど 1 つ。複数受け付けると、どれで通ったかが
  // 分からなくなり、片方が空でも通る抜け道になる。
  var supplied = credentials.filter(function(c) {
    return c.normalize(payload[c.key]) !== '';
  });
  if (supplied.length !== 1) {
    return { verified: false, error: '照合に使う番号を 1 つだけ入力してください。' };
  }
  var credential = supplied[0];
  var idKey = credential.normalize(payload[credential.key]);

  // レート制限（同一の照合値につき 15 分以内 5 回まで）
  var cache = CacheService.getScriptCache();
  var rlKey = 'pub_id_rl_' + memberType + '_' + credential.key + '_' + idKey;
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
    // DB 側が空の行は、入力も空にすれば一致してしまう。空は必ず除く。
    var dbValue = credential.normalize(r[credential.column]);
    if (!dbValue || dbValue !== idKey) return false;
    return matchesPublicIdentityName_(memberType, r, payload);
  });

  if (memberRows.length !== 1) {
    return { verified: false, error: '入力内容と一致する会員情報が見つかりませんでした。' };
  }
  var member = memberRows[0];

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

// 2026-10-13 operator 判断: 公開ポータルは登録済みの個人情報を一切返さない。
// 以前は在籍職員の一覧（氏名・フリガナ・メール・介護支援専門員番号）と在籍人数を返していた。
// 職員の変更・除籍は、申請者が入力した「今の氏名と介護支援専門員番号」で職員を特定する。

// 入力された氏名と介護支援専門員番号の 3 つがそろって一致する、その事業所の在籍職員を返す。
// 戻り値はサーバ内部でだけ使う。公開ポータルへは「一致したかどうか」以外を返さない。
// 照合規則は申請受付・照合ボタン・承認時で共通（ここが唯一の定義）。
function findPublicEnrolledStaffByIdentity_(staffRows, memberId, s) {
  var lastName = String((s && s.lastName) || '').trim();
  var firstName = String((s && s.firstName) || '').trim();
  var careManagerNumber = normalizeCmNumberForKey_(s && s.careManagerNumber);
  if (!lastName || !firstName || !/^\d{8}$/.test(careManagerNumber)) return [];
  return (staffRows || []).filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員ID'] || '') === String(memberId || '') &&
           String(r['職員状態コード'] || '') === 'ENROLLED' &&
           normalizeCmNumberForKey_(r['介護支援専門員番号']) === careManagerNumber &&
           String(r['姓'] || '').trim() === lastName &&
           String(r['名'] || '').trim() === firstName;
  });
}

// 職員の照合回数を数える。照合は「その氏名と番号の職員が在籍しているか」を確かめられてしまうので、
// トークンの有効期間（30 分）に 20 回までとする。照合ボタンと申請受付で同じ枠を使う。
function consumePublicStaffMatchQuota_(memberId, count) {
  var cache = CacheService.getScriptCache();
  var key = 'pub_staff_rl_' + String(memberId || '');
  var used = Number(cache.get(key) || 0) || 0;
  if (used + count > 20) return false;
  cache.put(key, String(used + count), 1800);
  return true;
}

// 事業所会員が入力した氏名と介護支援専門員番号で、在籍職員がちょうど 1 人に特定できるかを返す。
// 返すのは matched（真偽）だけ。職員ID・氏名・連絡先などは返さない。
function checkPublicStaffMatch_(payload) {
  var token = String(payload.token || '').trim();
  var stored = verifyPublicIdentityToken_(token);
  if (!stored) return { error: 'token_expired' };
  if (stored.memberType !== 'BUSINESS') return { error: '事業所会員専用の操作です' };
  if (!consumePublicStaffMatchQuota_(stored.memberId, 1)) {
    return { error: '照合の回数が上限を超えました。しばらくしてから最初からやり直してください。' };
  }
  var ss = getOrCreateDatabase_();
  var matches = findPublicEnrolledStaffByIdentity_(getRowsAsObjects_(ss, 'T_事業所職員'), stored.memberId, payload);
  return { matched: matches.length === 1 };
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
  consumePublicSubmissionQuota_('CHANGE_REQUEST', stored.memberId);
  // 2026-10-13: 本人確認の用途と申請の種類を一致させる。以前は変更用のトークンで退会申請も出せた。
  var expectedPurpose = requestType === 'WITHDRAWAL' ? 'withdrawal' : 'update';
  if (String(stored.purpose || '') !== expectedPurpose) {
    return { success: false, error: 'token_expired' };
  }
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), requestType === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'MEMBER_UPDATE');

  // 変更内容のallowlistフィルタ
  var allowlist = publicUpdateAllowlistFor_(stored.memberType);

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
  if (requestType === 'WITHDRAWAL') {
    var withdrawalMethod = String(payload.withdrawalMethod || 'FISCAL_YEAR_END');
    if (withdrawalMethod !== 'FISCAL_YEAR_END' && withdrawalMethod !== 'IMMEDIATE') {
      return { success: false, error: 'invalid_withdrawal_method' };
    }
    changeData.withdrawalMethod = withdrawalMethod;
  }

  // 事業所会員: スタッフ追加（必須フィールド検証）
  // 2026-10-13: 職員の追加も事業所会員だけ。以前は個人・賛助会員の申請でも受け付け、
  // 承認すると会員IDの下に職員行が作られる作りだった（画面は事業所会員にしか欄を出さない）。
  if (Array.isArray(payload.staffAdd) && payload.staffAdd.length > 0 && stored.memberType !== 'BUSINESS') {
    return { success: false, error: '事業所会員専用の操作です' };
  }
  var staffAddProblems = [];
  if (Array.isArray(payload.staffAdd)) {
    payload.staffAdd.forEach(function(s, si) {
      var lastName = String(s.lastName || '').trim();
      var firstName = String(s.firstName || '').trim();
      // v376: kana を normalize + validate（不正なら throw → このエントリは弾かれない代わりに申請自体が失敗）
      var lastKana = normalizeAndValidateKana_(s.lastKana || '', '職員のセイ');
      var firstKana = normalizeAndValidateKana_(s.firstKana || '', '職員のメイ');
      var careManagerNumber = normalizeCmNumberForKey_(s.careManagerNumber);
      var email = String(s.email || '').trim();
      // docs/307 S9（2026-10-24）: 以前は欠けた行を黙って捨て、受付完了と返していた。
      var addProblem = !lastName || !firstName || !lastKana || !firstKana ? '氏名とフリガナを入力してください。'
        : !/^\d{8}$/.test(careManagerNumber) ? '介護支援専門員番号は 8 桁の半角数字で入力してください。'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'メールアドレスの形式が正しくありません。'
        : '';
      if (addProblem) {
        staffAddProblems.push('追加する職員 ' + (si + 1) + ' 人目: ' + addProblem);
        return;
      }
      changeData.staffAdd.push({ lastName: lastName, firstName: firstName, lastKana: lastKana, firstKana: firstKana, careManagerNumber: careManagerNumber, email: email });
    });
  }
  if (staffAddProblems.length > 0) {
    return { success: false, error: staffAddProblems.join('\n') };
  }

  // 事業所会員: 職員の除籍と情報変更は、入力された「今の氏名と介護支援専門員番号」で職員を特定する。
  // 2026-10-13: 画面に職員一覧を出さなくなったため、特定はサーバ側だけで行う。
  // 一致しないときは申請を受け付けず、何件目が一致しないかだけを返す（登録内容は返さない）。
  var staffRemoveInput = Array.isArray(payload.staffRemove) ? payload.staffRemove : [];
  var staffUpdateInput = Array.isArray(payload.staffUpdate) ? payload.staffUpdate : [];
  if ((staffRemoveInput.length > 0 || staffUpdateInput.length > 0) && stored.memberType !== 'BUSINESS') {
    return { success: false, error: '事業所会員専用の操作です' };
  }
  var staffRowsForMatch = [];
  if (staffRemoveInput.length > 0 || staffUpdateInput.length > 0) {
    if (!consumePublicStaffMatchQuota_(stored.memberId, staffRemoveInput.length + staffUpdateInput.length)) {
      return { success: false, error: '照合の回数が上限を超えました。しばらくしてから最初からやり直してください。' };
    }
    staffRowsForMatch = getRowsAsObjects_(getOrCreateDatabase_(), 'T_事業所職員');
  }

  // 事業所会員: スタッフ除籍（姓・名・CM番号で照合）
  for (var ri = 0; ri < staffRemoveInput.length; ri++) {
    var rs = staffRemoveInput[ri] || {};
    var removeTarget = {
      lastName: String(rs.lastName || '').trim(),
      firstName: String(rs.firstName || '').trim(),
      careManagerNumber: normalizeCmNumberForKey_(rs.careManagerNumber),
    };
    var removeMatches = findPublicEnrolledStaffByIdentity_(staffRowsForMatch, stored.memberId, removeTarget);
    if (removeMatches.length !== 1) {
      return { success: false, error: '除籍する職員 ' + (ri + 1) + ' 人目: 氏名と介護支援専門員番号に一致する在籍職員が見つかりません。' };
    }
    // 代表者は除籍できない（承認時に止まる申請を受け付けない）。代表者の変更は事務局が行う。
    if (String(removeMatches[0]['職員権限コード'] || '') === 'REPRESENTATIVE') {
      return { success: false, error: '除籍する職員 ' + (ri + 1) + ' 人目は代表者のため、ここでは除籍できません。代表者の変更は事務局へご連絡ください。' };
    }
    changeData.staffRemove.push(removeTarget);
  }

  // v372.5: 事業所会員: 既存職員の情報変更（変更したいフィールドのみ含める）
  // 2026-10-13: 対象は target（今の氏名・番号）で特定し、職員IDはサーバが引く。画面から職員IDは受け取らない。
  var updateAllowlist_ = ['lastName', 'firstName', 'lastKana', 'firstKana', 'email', 'careManagerNumber'];
  for (var ui = 0; ui < staffUpdateInput.length; ui++) {
    var us = staffUpdateInput[ui] || {};
    var ut = us.target || {};
    var updateTarget = {
      lastName: String(ut.lastName || '').trim(),
      firstName: String(ut.firstName || '').trim(),
      careManagerNumber: normalizeCmNumberForKey_(ut.careManagerNumber),
    };
    var updateMatches = findPublicEnrolledStaffByIdentity_(staffRowsForMatch, stored.memberId, updateTarget);
    if (updateMatches.length !== 1) {
      return { success: false, error: '情報を変更する職員 ' + (ui + 1) + ' 人目: 氏名と介護支援専門員番号に一致する在籍職員が見つかりません。' };
    }
    var entry = { staffId: String(updateMatches[0]['職員ID'] || ''), target: updateTarget };
    var hasAny = false;
    for (var k = 0; k < updateAllowlist_.length; k++) {
      var f = updateAllowlist_[k];
      if (!Object.prototype.hasOwnProperty.call(us, f)) continue;
      var v = String(us[f] || '').trim();
      if (v === '') continue; // 空欄 = 変更なし
      // docs/307 S10（2026-10-24）: 以前は形式違いの番号・メールを黙って外し、受付完了と返していた。
      if (f === 'careManagerNumber') {
        if (!/^\d{8}$/.test(v)) return { success: false, error: '情報を変更する職員 ' + (ui + 1) + ' 人目: 変更後の介護支援専門員番号は 8 桁の半角数字で入力してください。' };
      } else if (f === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { success: false, error: '情報を変更する職員 ' + (ui + 1) + ' 人目: 変更後のメールアドレスの形式が正しくありません。' };
      } else if (f === 'lastKana' || f === 'firstKana') {
        // v376: kana 列は全角カタカナに正規化（不正文字は throw）
        v = normalizeAndValidateKana_(v, f === 'lastKana' ? '職員のセイ' : '職員のメイ');
      }
      entry[f] = v;
      hasAny = true;
    }
    if (hasAny) changeData.staffUpdate.push(entry);
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
  notifyMembershipChatForMember_(ss, 'REQUEST', stored.memberId, {
    '手続種別': chatMembershipRequestTypeLabel_(requestType, changeData.withdrawalMethod),
    '申請ID': requestId,
    '日時': now,
    '変更内容': buildChangeSummaryText_(changeData, requestType),
    '異常内容': '',
  });

  return { success: true, requestId: requestId };
}

// ── 管理者: 変更申請一覧取得 ──────────────────────────────────────────────────

// ── 管理者: 変更申請を承認し変更を適用 ─────────────────────────────────────────
// 変更申請の承認・却下は 1 件ずつ順に処理する（2026-10-14・docs/307 SX）。
// 以前は排他が無く、二人の管理者が同じ申請をほぼ同時に承認すると、どちらも「未処理」を読んで
// 二重に反映しえた（職員の二重追加・認証アカウントの二重発行）。状態の確認から書き込みまでをロックの中で行う。
// 入会申込の作成（createMemberApplicationDirectLocked_）は承認からしか呼ばれないので、ロックはここで一度だけ取る
// （同じスクリプトロックを内側でもう一度取って解放すると、外側のロックまで外れる）。


// ── 管理者: 変更申請を却下 ──────────────────────────────────────────────────

// 管理者が承認した変更申請からのみ職員を追加する。
// 承認した職員追加を適用し、追加できた職員だけに案内メールを送る（変更申請の承認から呼ぶ）。
// 2026-10-13: 職員追加だけの申請（STAFF_ADD）と、登録情報変更に含まれる職員追加で処理が分かれており、
// 後者は案内メールを送っていなかった。失敗した職員にも「追加しました」と送っていた。
// - 追加に失敗した職員・ログイン用アカウントを作れなかった職員は chatAnomalies に積み、メールを送らない
// - 案内のログインIDは、実際に作られたもの（衝突回避で先頭に数字が付くことがある）を使う

// 事業所会員の職員数上限と在籍人数。上限 0 は「上限なし」（会員行が無い場合も 0）。
// 2026-10-08: 事業所ごとの個別上限が未設定なら全体既定を使う（RD §136 / §205）。
// 以前は個別上限が空だと 0 として扱われ、**上限が一切効かなかった**。


/**
 * 職員の認証アカウントを作る。ログインIDは介護支援専門員番号から採番する（BR-15）。
 * 既に同じ職員IDのアカウントがあれば何もしない（再承認や再実行で重複させない）。
 * 初期パスワードは乱数。**通知はここでは送らない**——送るかどうかは設定が決める。
 */

// ── v264 変更申請キュー ここまで ────────────────────────────────────────────






// ── メール配信状態（停止 / 通常送信 / テスト集約）─────────────────────────────
// MAIL_DELIVERY_STATE が正本。旧3キーは既存リリースへ戻す場合だけの互換値であり、
// 新しい画面・新しい実行判定ではこれらを個別に判断しない。
var MAIL_DELIVERY_STATE_STOPPED_ = 'STOPPED';
var MAIL_DELIVERY_STATE_LIVE_ = 'LIVE';
var MAIL_DELIVERY_STATE_REDIRECT_ = 'REDIRECT';


function getMailDeliveryState_(settingsMap) {
  var map = settingsMap || {};
  var explicit = String(map['MAIL_DELIVERY_STATE'] || '').trim().toUpperCase();
  var oldGlobal = String(map['MAIL_GLOBAL_ENABLED'] || '').trim().toLowerCase();
  var oldMode = String(map['MAIL_DELIVERY_MODE'] || MAIL_DELIVERY_STATE_LIVE_).trim().toUpperCase();
  // v376.95 初回版が追加した STOPPED と旧 LIVE/REDIRECT が矛盾する場合だけ、
  // 旧設定を優先して既存運用を維持する。通常の「停止」保存では旧キーも false へ同期される。
  var initialMigrationConflict = explicit === MAIL_DELIVERY_STATE_STOPPED_
    && oldGlobal === 'true'
    && oldMode !== 'SUPPRESS';
  if ([MAIL_DELIVERY_STATE_STOPPED_, MAIL_DELIVERY_STATE_LIVE_, MAIL_DELIVERY_STATE_REDIRECT_].indexOf(explicit) >= 0 && !initialMigrationConflict) {
    return explicit;
  }
  // 初回移行前の保存値を一度だけ読み替える。旧 SUPPRESS は停止へ正規化する。
  if (oldGlobal === 'false') return MAIL_DELIVERY_STATE_STOPPED_;
  if (oldMode === MAIL_DELIVERY_STATE_REDIRECT_) return MAIL_DELIVERY_STATE_REDIRECT_;
  if (oldMode === 'SUPPRESS') return MAIL_DELIVERY_STATE_STOPPED_;
  return MAIL_DELIVERY_STATE_LIVE_;
}


function mailDispatchPolicy_() {
  try {
    var ss = getOrCreateDatabase_();
    var state = getMailDeliveryState_(getSystemSettingMap_(ss));
    if (state === MAIL_DELIVERY_STATE_STOPPED_) return { mode: 'SUPPRESS', reason: 'delivery_stopped' };
    if (state === MAIL_DELIVERY_STATE_REDIRECT_) {
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

// 2026-09-27: 自動通知の送信記録。以前は T_メール送信ログ に一括メールしか書いておらず、
// 受付確認などの自動通知は成功も失敗も何も残らなかった。だから「公開ポータル発のメールが
// 半年近く 1 通も届いていない」ことに誰も気づけなかった（v376.103）。
//
// 個人情報は載せない。宛先も、差し込み済みの件名・本文も書かない
// （件名には {{氏名}} が入りうる）。残すのは「いつ・どの種別が・どの経路で・どうなったか」だけ。
// 一括メールは自前で明細付きの集計行を書くので、ここでは扱わない（二重記録を作らない）。
function recordAutomatedMailLog_(category, outcome, options, detail) {
  var categoryCode = String(category || 'GENERAL').toUpperCase();
  if (categoryCode === 'BULK_MAIL') return;
  try {
    var from = String((options && options.from) || '').trim();
    appendRowsByHeaders_(getLogSs_(), 'T_メール送信ログ', [{
      'ログID': Utilities.getUuid(),
      '送信日時': new Date().toISOString(),
      // システム設定の送信元。個人の連絡先ではない。
      '送信者メール': from,
      // 差し込み済みの件名は載せない。種別が分かれば十分で、種別なら個人情報を含まない。
      '件名テンプレート': categoryCode,
      '宛先数': 1,
      '成功数': outcome === 'SENT' ? 1 : 0,
      'エラー数': outcome === 'FAILED' ? 1 : 0,
      // SENT / FAILED / SUPPRESSED(理由) の別と、エイリアス送信かどうかを残す。
      '送信種別': 'AUTO_' + outcome + (detail ? ':' + detail : '') + (from ? '/ALIAS' : '/DEFAULT'),
      '研修ID': '',
      '削除フラグ': false,
    }]);
  } catch (logError) {
    // 記録できないことで業務処理を止めない。
    Logger.log('[recordAutomatedMailLog_] ' + categoryCode + ': ' + logError.message);
  }
}

// v376.102: メール送信の失敗を Chat の「要確認」へ流す。
// 宛先・件名・本文は載せない。Chat は外部送信先であり、載せると会員の連絡先が外へ出る。
// 載せるのは「どの種別が」「どの送信経路で」「どんなエラーで」落ちたかだけ。
// 通知自体の失敗で業務処理を止めないため、全体を try で包む。
function notifyMailFailureToChat_(category, options, error) {
  try {
    var ss = getOrCreateDatabase_();
    var from = String((options && options.from) || '').trim();
    // from が実行ユーザー以外だと Gmail API 経路になり、gmail.send の承認と
    // 「名前として送信」の登録が要る。どちらで落ちたかを切り分けられるようにする。
    var route = from ? 'Gmail API（送信元エイリアス指定）' : 'MailApp（実行ユーザー送信）';
    notifyMembershipChatSafely_(ss, 'ANOMALY', {
      '手続種別': 'メール送信',
      '申請ID': '',
      '日時': new Date().toISOString(),
      '変更内容': '',
      '異常内容': [
        'メールを送信できませんでした。',
        'メール種別: ' + String(category || 'GENERAL'),
        '送信経路: ' + route,
        'エラー: ' + String((error && error.message) || error),
      ].join('\n'),
    });
  } catch (notifyError) {
    Logger.log('[notifyMailFailureToChat_] failed: ' + notifyError.message);
  }
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
        recordAutomatedMailLog_(category, 'SUPPRESSED', options, 'category_disabled');
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
    recordAutomatedMailLog_(category, 'SUPPRESSED', options, policy.reason);
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
  // v376.102: 送信失敗は呼び出し側が Logger.log で握りつぶしており、画面にも DB にも
  // 何も残らなかった。「Chat は届くのにメールだけ来ない」状態に誰も気づけない。
  // 実際に届いている Chat の「要確認」へ流して、気づける状態にする。
  try {
    sendEmailWithValidatedFrom_(finalTo, finalSubject, finalBody, finalOptions);
  } catch (sendError) {
    recordAutomatedMailLog_(category, 'FAILED', finalOptions, '');
    notifyMailFailureToChat_(category, finalOptions, sendError);
    throw sendError;   // 呼び出し側の従来の扱い（握りつぶし or ログ）は変えない
  }
  recordAutomatedMailLog_(category, 'SENT', finalOptions, policy.mode === 'LIVE' ? '' : policy.mode);
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
    LOGIN_ID_CHANGED: true,
    CONTACT_EMAIL_CHANGED: true,
    MEMBER_UPDATE_CONFIRM: true,
    WITHDRAWAL_CONFIRM: true,
    PASSWORD_RESET: true,
  };
  return !!automatic[String(category || '').toUpperCase()];
}

// 既存 CREDENTIAL_EMAIL_FROM を「自動通知の共通送信元」として後方互換で利用する。
// 空欄時は GAS の標準送信元を使う。指定済み alias が使えない場合は Gmail API が例外にし、
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

  // v376.103: 送信エイリアス指定 → Gmail REST API。
  //
  // 以前は GmailApp.sendEmail({from}) を使っていたが、GmailApp は送信前に
  // 送信者のエイリアス一覧を照合するため mail.google.com / gmail.settings.basic /
  // gmail.readonly / gmail.modify のいずれかを要求する。公開・会員 split は
  // v263 のスコープ最小化でこれらを持たないため、公開ポータル発のメール
  // （受付確認など）が送信時に落ちていた。失敗は握りつぶされ誰も気づけなかった。
  //
  // REST の users.messages.send は gmail.send だけで呼べる。エイリアスの「管理」には
  // 設定系スコープが要るが、「送信」には要らない。From が送信者の検証済み
  // エイリアスであれば Gmail が受け付ける。3 split とも gmail.send と
  // script.external_request を持っているので、スコープ追加なしで送れる。
  sendMailViaGmailApi_({
    from: from, name: name, to: to, subject: subject,
    body: body, replyTo: replyTo, attachments: attachments,
  });
}

// RFC 2047 の encoded-word。日本語の件名・表示名・添付ファイル名に使う。
function encodeMimeWord_(text) {
  var raw = String(text == null ? '' : text);
  if (!raw) return '';
  // ASCII だけなら素のまま通す（可読性を保つ）
  if (!/[^\x20-\x7E]/.test(raw)) return raw;
  return '=?UTF-8?B?' + Utilities.base64Encode(raw, Utilities.Charset.UTF_8) + '?=';
}

// base64 は 76 桁で折る。折らない実装を受け付けない MTA があるため。
function wrapBase64_(encoded) {
  var out = [];
  for (var i = 0; i < encoded.length; i += 76) out.push(encoded.substring(i, i + 76));
  return out.join('\r\n');
}

// RFC822 形式のメッセージを組み立てる。添付があれば multipart/mixed にする。
function buildRfc822Message_(params) {
  var attachments = params.attachments || [];
  var fromHeader = params.name
    ? encodeMimeWord_(params.name) + ' <' + params.from + '>'
    : params.from;
  var lines = [];
  lines.push('From: ' + fromHeader);
  lines.push('To: ' + params.to);
  if (params.replyTo) lines.push('Reply-To: ' + params.replyTo);
  lines.push('Subject: ' + encodeMimeWord_(params.subject));
  lines.push('MIME-Version: 1.0');

  var bodyB64 = wrapBase64_(Utilities.base64Encode(String(params.body == null ? '' : params.body), Utilities.Charset.UTF_8));

  if (!attachments.length) {
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(bodyB64);
    return lines.join('\r\n');
  }

  var boundary = 'hcmn_' + Utilities.getUuid().replace(/-/g, '');
  lines.push('Content-Type: multipart/mixed; boundary="' + boundary + '"');
  lines.push('');
  lines.push('--' + boundary);
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(bodyB64);
  for (var i = 0; i < attachments.length; i++) {
    var blob = attachments[i];
    var fileName = encodeMimeWord_(blob.getName() || ('attachment-' + (i + 1)));
    lines.push('');
    lines.push('--' + boundary);
    lines.push('Content-Type: ' + (blob.getContentType() || 'application/octet-stream') + '; name="' + fileName + '"');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('Content-Disposition: attachment; filename="' + fileName + '"');
    lines.push('');
    lines.push(wrapBase64_(Utilities.base64Encode(blob.getBytes())));
  }
  lines.push('');
  lines.push('--' + boundary + '--');
  return lines.join('\r\n');
}

function sendMailViaGmailApi_(params) {
  var message = buildRfc822Message_(params);
  var response = UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ raw: Utilities.base64EncodeWebSafe(Utilities.newBlob(message).getBytes()) }),
    muteHttpExceptions: true,
  });
  var code = response.getResponseCode();
  if (code >= 200 && code < 300) return;
  var detail = '';
  try {
    detail = String((((JSON.parse(response.getContentText() || '{}')).error) || {}).message || '').trim();
  } catch (parseError) {}
  // 失敗の切り分けに要るので、HTTP コードと Gmail のメッセージを両方残す。
  // 呼び出し元（deliverMail_）がこれを Chat の「要確認」へ流す。
  throw new Error('Gmail API 送信に失敗しました (HTTP ' + code + ')'
    + (detail ? ': ' + detail : '')
    + '。送信元エイリアスが「名前として送信」に登録済みか、gmail.send の承認が済んでいるか確認してください。');
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



function normalizeRosterCellText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeRosterKeyText_(value) {
  return normalizeRosterCellText_(value).replace(/[\s\u3000]+/g, '').toLowerCase();
}





























function normalizeNameKey_(lastName, firstName) {
  return normalizeRosterKeyText_([lastName || '', firstName || ''].join(''));
}
























/**
 * WL-001 の Googleメール を k.noguchi@hcm-n.org に更新する（ワンタイム実行）。
 * 紐付け認証ID / 紐付け会員ID / MASTER 権限はそのまま維持する。
 * 実行: npx clasp run updateWL001EmailToHcmN
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

// v376: 既存 DB のフリガナ列を全角カタカナへ一括正規化する migration 関数。
//   対象: T_会員 (セイ/メイ) / T_事業所職員 (セイ/メイ/フリガナ) / T_外部申込者 (フリガナ)
//   実行: admin editor から手動 Run。最初に dryRun=true で件数確認、ユーザー承認後 dryRun=false で本実行。
//   Plan A: T_変更申請 の pending レコードは正規化対象外（承認時に approveAdminChangeRequest_ → 各 save 関数で正規化される）。
// v376.2: editor 1-click 本実行用ラッパー（dryRun:false 固定）。引数指定が editor から面倒なため。


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



// ── v131 補正関数 ──

/**
 * ソース V列の入会日を _MIGRATION_MAP 経由で T_会員.入会日 に補正する（dry-run 対応）
 * 呼び出し: clasp run repairJoinedDateFromSourceJson
 */



/**
 * 入会日が不明な会員のリストを返す
 */

/**
 * T_事業所職員の介護支援専門員番号をソース M列から補正する（dry-run）
 * マッチ方式: K列(勤務先) = T_会員.勤務先名 AND 職員の姓がL列/N列(氏名)に含まれる
 * 呼び出し: clasp run repairStaffCareManagerNumberFromSourceJson
 */

/**
 * v133: 既存の T_事業所職員 の メール配信希望コード が空のレコードを 'YES' で埋める。
 * 呼び出し: clasp run backfillStaffMailingPreferenceJson
 */



/**
 * T_事業所職員の入会日をソース V列から補正する（dry-run）
 * マッチ方式: ソースK列(勤務先) = T_会員.勤務先名 AND 職員の姓がソースL列(氏名)に含まれる
 * 呼び出し: clasp run repairStaffJoinedDateFromSourceJson
 */



/**
 * 事業所会員の個人属性フィールドをブランクに補正する（dry-run 対応）
 * 対象: 姓/名/セイ/メイ/介護支援専門員番号/発送方法コード/郵送先区分コード
 * 呼び出し: clasp run repairBusinessMemberFieldsJson
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
 *   memberTypes?    – 会員種別コードの配列。省略時は M_会員種別 の有効な全種別
 *   memberStatus?   – 'ACTIVE' | 'ALL'  (T_会員.会員状態コード)   デフォルト 'ACTIVE'
 *   staffStatus?    – 'ENROLLED' | 'ALL' (T_事業所職員.職員状態コード) デフォルト 'ENROLLED'
 *   mailingFilter?  – 'OPT_IN' | 'ALL'  (メール配信希望コード)    デフォルト 'OPT_IN'
 *   excludeNoEmail? – true: メール未登録除外（デフォルト true）
 */




// 件数は会員種別コードごと（種別の一覧は M_会員種別。画面はマスタの表示順で並べる）


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





// v376.45: 投稿依頼登録の通知メール（saveLinePostRequest_ の submitRequest と transition 'request' で共用）。
// docs/307 S30/31（2026-10-24）: 結果を返す。以前は通知先が未設定・送信抑止でも黙って「依頼済み」になり、
// 依頼者は担当者に伝わったと思い込んだ。呼び出し元は戻り値を画面へ返す（linePostNotifyOutcome_）。

















// ══ v376.52: 会員系削除 cascade アーカイブ（docs/249・a1 単一化）═══════════════
// 削除対象の会員/職員に紐づく行を live から除去し <table>_archive へ「移動」する。
// - 退避行にはサロゲート3列（アーカイブID/削除バッチID/アーカイブ日時）を付与
// - 削除バッチID = T_削除ログ.ログID。復元は同一バッチの全行を戻す（会員単位アトミック）
// - T_ログイン履歴 は archive せず物理 purge（高volume・PII 最小化）
// - 退会フロー（withdrawMember 系）はこの cascade を呼ばない（履歴保持・docs/249 §4.4）

// テーブル → 「live 行が削除対象会員系に属するか」の一致条件（cascade と診断の共通定義）

// シートから matchFn に一致する行を取り除き、取り除いた行（オブジェクト）を返す。
// beforeRemove(taken) は行を取り除く前に呼ぶ（アーカイブへの書き込みなど。失敗すれば何も消さない）。
// 残す行を詰め直したあと、空いた末尾の行はシートから削除する。中身だけ消すと空行が残り、
// シートの容量が減らない（2026-10-11 まではそうだった）。

// 共通ムーバ: matchFn に一致する行を live から除去し <table>_archive へ append する。
// archive シートのヘッダー欠落（列数0）は自己修復する。戻り値は移動件数。

// 削除対象認証IDのログイン履歴を log スプレッドシートから物理削除する（docs/249: purge 確定）

// cascade オーケストレータ: 支払いID/認証ID を移動前に解決 → 13テーブル移動 → ログイン履歴 purge

// ─── テストデータの物理削除（2026-10-11・docs/303） ─────────────────────────
// 印（★＋@example.invalid）の付いた会員・職員・外部申込者と、それに結び付く行を物理削除する。
// 論理削除やアーカイブ移動と違い、本番の表・*_archive・ログ用スプレッドシートから行ごと消える。
// 手順（エディタの ▶・MASTER のみ）:
//   1. previewTestDataPurge_LOG   対象と表ごとの件数を確認する。確認した内容を 30 分間記録する
//   2. executeTestDataPurge_APPLY 確認時と同じ内容のときだけ消す（データが変わっていたら止まる）
var TEST_DATA_PURGE_PLAN_KEY = 'TEST_DATA_PURGE_PLAN_V1';
var TEST_DATA_PURGE_PLAN_TTL_MS = 30 * 60 * 1000;



// 会員・職員の連動（getCascadeMatchers_）に、テストデータだけが持つ結び付きを足したもの。

// ログ系の表（T_削除ログ はメイン DB、ほかはログ用スプレッドシート）の消す条件。

// 請求の添付（[{ fileId, url, ... }] の JSON）からファイルIDを取り出す。






// 復元: 各 archive から 削除バッチID 一致行を live へ戻す（サロゲート3列は落とす）

// operator 実行（▶ 引数なし）: 直近の削除バッチ（T_削除ログ 最終行）を復元する

// operator 実行（▶ 引数なし）: archive 内の削除バッチ一覧（バッチID別件数 + 削除ログ情報）

// operator 実行（▶ 引数なし・read-only）: 現 DB の削除負債を診断する（docs/249 §7）。
// 旧削除実装（in-place soft delete）で live に残った削除済み会員/職員と、
// それらを参照して取り残された子テーブル行（孤児候補）を計測する。非破壊。

// ── dryRun E2E（operator 実行・実DB・自己完結: 投入→cascade→検証→復元→検証→掃除）──
var DRYRUN_CASCADE_TAG = 'DRYRUN_CASCADE';


// dryRun fixture 行のカウント（liveOnly=false で live 側 / true で archive 側）


// いずれかのセルが prefix で始まる行を物理削除する（dryRun sweep 用）





// ============================================================
// v259: ログSS分離・アーカイブ関連
// ============================================================

/**
 * ログスプレッドシートをセットアップする（初回1回だけ実行）。
 * 新規スプレッドシートを作成し、Script Properties に LOG_SPREADSHEET_ID を保存。
 * その後 rebuildLogDatabaseSchema() でシートを作成してから
 * migrateLogsToLogSpreadsheet() で既存ログを移行する。
 */

/**
 * ログSSのスキーマを再構築する（既存ログSSのシートが壊れた場合など）。
 */


/**
 * メインSSのログデータをログSSに移行する（一回実行専用）。
 * 実行前に setupLogSpreadsheet() でログSSを作成済みであること。
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

/**
 * Cloud Run Argon2id でパスワードを検証する。
 * 返り値: { match: boolean, needsRehash: boolean }（verifyPassword_ と同一契約）
 */

/**
 * v376.54 (GCP Phase B / docs/240 §4): パスワードハッシュ生成の単一スイッチ。
 * `ARGON2_ENABLED=true` なら Cloud Run Argon2id、それ以外は PBKDF2（既定・従来挙動不変）。
 * Argon2 有効時に Cloud Run へ到達できない場合は fail-closed（throw）— docs/240 §6。
 * 生成箇所は必ず本関数を経由し、hashPasswordPbkdf2_ / hashPasswordArgon2_ を直接呼ばない。
 */

/**
 * PBKDF2-HMAC-SHA256 でパスワードをハッシュする。
 * 旧 hashPassword_ と同じシグネチャで呼び出せるが、方式識別子を prefix として返す。
 * 返り値: "pbkdf2:sha256:<hex64>" (71 文字)
 */

/**
 * パスワード検証。ハッシュ方式を自動判別する。
 * - "argon2id:v1:" prefix → Cloud Run Argon2id で検証（v376.54・ARGON2_ENABLED に関わらず常時有効 = rollback 後も既存 Argon2 hash でログイン可）
 * - "pbkdf2:sha256:" prefix → PBKDF2 で検証
 * - それ以外 → 旧 SHA-256 で検証
 * 旧方式で一致した場合は rehash 用フラグを返す。ARGON2_ENABLED=true 中は PBKDF2 一致にも
 * needsRehash=true を返し、呼び出し側の rehash-on-login（hashPasswordCurrent_）で Argon2id へ移行する。
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

// 役員まわりで人物（会員ID か 職員ID）を参照する表。紐づけ変更・人物の統合はこの 4 表をまとめて付け替える。
var OFFICER_PERSON_TABLES_ = ['T_役員', 'T_振込口座', 'T_請求', 'T_支払い'];

// 2026-10-25: 役員まわり（T_役員・T_振込口座・T_請求・T_支払い）の人物の参照を 1 か所で決める。
// 個人・賛助会員は会員ID、事業所職員は職員ID だけで人を指す（XOR）。事業所職員のセッションは会員ID に
// 事業所の会員ID も持つが、人を決めるのは職員ID。以前は約 20 の関数がこの判定を個別に書き、
// 支払いだけ職員を扱えなかった（docs/307 F31）。判定はここを通す（test:officer-person が直書きを落とす）。


// 行（会員ID・職員ID 列を持つ）がこの人物のものか

// シートの見出しでの列の位置（無ければ -1）

// findRowByColumnValue_ の結果（row 配列 + columns）がこの人物の請求か

// 人物の表示名と所属（会員・職員の行から引く）

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
 * 2026-10-25: 人単位で、役員まわり 4 表（役職・振込口座・請求・支払い）をまとめて付け替える。
 * 以前は T_請求 を元の紐づけのまま残していたが、それでは本人のマイページに過去の請求が出ず、
 * 古い会員を削除すると請求も一緒にアーカイブへ移った。人物の統合（migratePersonOwnedReferences_）と同じ扱いにする。
 */

/**
 * 職員が退職（LEFT）になった時に現職の役員レコードを自動退任させる。
 * updateStaff_ から呼び出される。
 */

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








/**
 * T_研修申込 の既存行を 2-FK 化:
 *  - 申込者区分=EXTERNAL かつ 外部申込者ID が空の行: 申込者ID を 外部申込者ID へ複写
 *  - 既存 申込者ID / 申込者区分コード は維持（v361 以降で物理削除予定）
 */

/**
 * 既存 T_研修申込 行の 出欠状態コード を UNRECORDED で backfill。
 */

// v373.7 (S5 Phase 2): migrateRosterTemplateLibraryCategoryForV360_ 撤去（操作者確認済み）

/**
 * T_研修申込 の 3-FK XOR 違反を検出（v360 以降の不変条件）。
 * Strict-XOR は外部申込者ID/会員ID/職員ID のいずれか1つだけ non-empty。
 * legacy 行（外部申込者ID 空 + 申込者ID 持ち）は warning 扱い。
 */
// ─── v360: 研修名簿管理 API ─────────────────────────────────────────────

/**
 * 研修詳細名簿取得（管理者専用）。
 * 既存 getTrainingApplicants_ を拡張し、出欠状態・事務局メモ・申込者サブ種別情報を追加する。
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


// ============================================================================
// DRYRUN APPLICATION SCENARIOS (2026-05-17)
//
// 本番 DB に DRYRUN_ プレフィックス付きで投入し、申込→承認→転籍経路を end-to-end
// 検証する synthetic transaction フレームワーク。
//
// 設計原則:
//   - テストデータの印: 全フィクスチャの名前に `★DRYRUN_`、メールは `@example.invalid`
//   - 後片付け: previewTestDataPurge_LOG → executeTestDataPurge_APPLY で物理削除する
//     （2026-10-11 までの manifest + 論理削除の方式は取りこぼしがあり廃止）
//   - AAA pattern: Arrange (payload 作成) → Act (関数呼出) → Assert (DB 副作用検証)
//   - Email isolation: CREDENTIAL_EMAIL_ENABLED を一時 false 化 + @example.invalid
//   - Independence: 各シナリオ独立、任意順序で実行可
//   - Idempotency: cleanup は同 runId に対し冪等
//
// 呼び出し:
//   1. dryRunApplicationScenarios()    — 全シナリオ実行（MASTER のみ）
//   2. previewTestDataPurge_LOG()        — 削除対象と件数を確認する
//   3. executeTestDataPurge_APPLY()      — 物理削除する
// ============================================================================

// 名前の先頭に★、メールアドレスは @example.invalid（テストデータの印・isTestMemberRow_ ほか）。
// 作ったデータは executeTestDataPurge_APPLY で物理削除する。
var DRYRUN_PREFIX = TEST_DATA_NAME_PREFIX + 'DRYRUN_';
var DRYRUN_EMAIL_DOMAIN = TEST_DATA_EMAIL_DOMAIN;
// 2026-10-11 に廃止した後片付けの記録。残っていれば executeTestDataPurge_APPLY が消す。
var DRYRUN_MANIFEST_KEY = 'DRYRUN_APPLICATION_MANIFEST_V1';
var DRYRUN_TRAINING_MGMT_MANIFEST_KEY = 'DRYRUN_TRAINING_MGMT_MANIFEST_V1';

// ============================================================================
// v376.14: 研修管理 全機能ドライランテスト（operator が Apps Script editor から実行）
//   dryRunTrainingManagement()        — 全機能テスト実行 + Logger 出力 + manifest 保存
//   cleanupDryRunTrainingManagement() — テストで作成したデータを物理削除
//   いずれもメール送信は行わない（getTrainingApplicants_ の対象解決のみ検証）。
// ============================================================================


// テストで作成した training / 申込 / 外部申込者 を物理削除（行削除）。
// v376.14.2: manifest だけでなく DRYRUN_ プレフィックスの研修・外部申込者を sweep し、
//   過去 run の孤児データ（manifest 上書きで参照が外れた分）も含めて確実に削除する。

// 指定キーに一致する行を物理削除（行番号降順で deleteRow して index ずれを回避）。

















// ── シナリオ実装 ─────────────────────────────────────────────────────────







// ── メインエントリ ───────────────────────────────────────────────────────

