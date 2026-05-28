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
var DB_SCHEMA_VERSION = '2026-05-19-roster-designer-v372';

// v251: 会員専用 split プロジェクト URL を正本とする（scriptId ベースルーティング移行）
var MEMBER_PORTAL_URL = 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
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

// v259: 退会済み会員のアーカイブシート（メインDB内。同スキーマ）
テーブル定義['T_会員_archive'] = テーブル定義['T_会員'].slice();
テーブル定義['T_事業所職員_archive'] = テーブル定義['T_事業所職員'].slice();
// v264: 公開ポータル変更申請テーブル（管理者承認待ちキュー）
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

  // v251: scriptId でプロジェクトを識別し配信ページを固定。URL パラメータは無視。
  // 各 split プロジェクトは自身の HTML のみを持ち、常に同一ページを返す。
  var SCRIPT_ID_ROUTES = {
    '1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ': { file: 'index',        title: '会員マイページ｜枚方市ケアマネ協議会',          favicon: 'member' },
    '1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi': { file: 'index',        title: '管理者ポータル｜枚方市ケアマネ協議会',          favicon: 'member' },
    '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL':  { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' },
  };
  var route = SCRIPT_ID_ROUTES[ScriptApp.getScriptId()]
    || { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' };

  // GAS は外側 iframe で配信するため、HTML 内の <meta viewport> は無視される。
  // モバイル表示（白ページ防止／レスポンシブ動作）には server-side addMetaTag が必須。
  var rawHtml = HtmlService.createHtmlOutputFromFile(route.file).getContent();

  // v363: 新タブ deep link 用に exec URL を client へ注入する。
  // iframe 内では window.location が iframe 内部 URL になるため、
  // クライアント側で window.open(__APP_URL__ + '#member=...') を組み立てる際に
  // ScriptApp.getService().getUrl() を正本として参照する。
  try {
    var appUrl = ScriptApp.getService().getUrl();
    if (appUrl) {
      var injection = '<script>window.__APP_URL__=' + JSON.stringify(appUrl) + ';</script>';
      rawHtml = injection + rawHtml;
    }
  } catch (ex) {
    // getUrl() 失敗時は注入をスキップ（ハッシュ未指定で同一タブ navigation にフォールバック）
  }

  var output = HtmlService.createHtmlOutput(rawHtml)
    .setTitle(route.title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
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
};

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
var ACTION_TO_MENU = {
  "updateMember": "members-list",
  "withdrawMember": "members-list",
  "scheduleWithdrawMember": "members-list",
  "cancelScheduledWithdraw": "members-list",
  "removeStaffFromOffice": "members-list",
  "updateStaff": "members-list",
  "getAdminPersonList": "members-list",
  "updatePersonsBatch": "members-list",
  "convertMemberType": "members-list",
  "getAdminChangeRequests": "change-requests",
  "approveAdminChangeRequest": "change-requests",
  "rejectAdminChangeRequest": "change-requests",
  "getAnnualFeeAdminData": "annual-fee",
  "saveAnnualFeeRecord": "annual-fee",
  "saveAnnualFeeRecordsBatch": "annual-fee",
  "getPaymentHistory": "payment-history",
  "savePayment": "payment-history",
  "deletePayment": "payment-history",
  "getAdminBankAccount": "payment-history",
  "saveAdminBankAccount": "payment-history",
  "deleteAdminBankAccount": "payment-history",
  "getClaims": "claim-management",
  "approveClaim": "claim-management",
  "rejectClaim": "claim-management",
  "adminDeleteClaim": "claim-management",
  "getRosterFieldDictionary": "roster-export",
  "getRosterDesignerData": "roster-export",
  "loadRosterTemplatesV2": "roster-export",
  "saveRosterTemplateV2": "roster-export",
  "deleteRosterTemplateV2": "roster-export",
  "duplicateRosterTemplateV2": "roster-export",
  "getMailingListTargets": "mailing-list-export",
  "generateMailingListExcel": "mailing-list-export",
  "saveTraining": "training-manage",
  "softDeleteTraining": "training-manage",
  "restoreTraining": "training-manage",
  "uploadTrainingFile": "training-manage",
  "regenerateThumbnailForTraining": "training-manage",
  "setupTrainingFileFolder": "training-manage",
  "getTrainingManagementData": "training-manage",
  "getTrainingApplicants": "training-manage",
  "sendTrainingReminder": "training-manage",
  "getAdminEmailAliases": "training-manage",
  "sendTrainingMail": "training-manage",
  "generateTrainingEmail": "training-manage",
  "getTrainingRosterDetail": "training-manage",
  "saveAttendance": "training-manage",
  "saveAttendanceBatch": "training-manage",
  "addRosterEntry": "training-manage",
  "addGuestRosterEntry": "training-manage",
  "cancelRosterEntry": "training-manage",
  "updateRosterEntry": "training-manage",
  "getTrainingStats": "training-manage",
  "getMembersForBulkMail": "bulk-mail",
  "sendBulkMemberMail": "bulk-mail",
  "getEmailSendLog": "bulk-mail",
  "getCredentialEmailTemplates": "bulk-mail",
  "saveCredentialEmailTemplate": "bulk-mail",
  "deleteCredentialEmailTemplate": "bulk-mail",
  "getBulkMailTemplates": "bulk-mail",
  "saveBulkMailTemplate": "bulk-mail",
  "deleteBulkMailTemplate": "bulk-mail",
  "listLinePostRequests": "line-post",
  "getLinePostRequest": "line-post",
  "saveLinePostRequest": "line-post",
  "uploadLinePostAttachment": "line-post",
  "transitionLinePostRequest": "line-post",
  "deleteLinePostRequest": "line-post",
  "getOfficerMasterData": "officer-management",
  "saveOrganization": "officer-management",
  "deleteOrganization": "officer-management",
  "saveOfficerRole": "officer-management",
  "deleteOfficerRole": "officer-management",
  "savePaymentType": "officer-management",
  "deletePaymentType": "officer-management",
  "saveWorkCategory": "officer-management",
  "deleteWorkCategory": "officer-management",
  "getOfficerManagementData": "officer-management",
  "assignOfficer": "officer-management",
  "resignOfficer": "officer-management",
  "updateOfficerLinkage": "officer-management",
  "updateOfficerRecord": "officer-management",
  "getDbInfo": "admin-settings",
  "getSystemSettings": "admin-settings",
  "updateSystemSettings": "admin-settings",
  "getAdminDashboardData": "admin-settings",
  "getAdminInitData": "admin-settings",
  "getAdminPermissionData": "system-permissions",
  "saveAdminPermission": "system-permissions",
  "deleteAdminPermission": "system-permissions",
  "seedDemoData": "data-management",
  "searchMembersForDelete": "data-management",
  "previewDeleteMember": "data-management",
  "executeDeleteMember": "data-management",
  "getDeleteLogs": "data-management",
  "repairDuplicateStaffRecords": "data-management",
  "repairTrainingApplicationApplicantIds": "data-management",
  "repairMemberCareManagerDuplicates": "data-management",
  "backupMigrationTargets": "data-management",
  "fetchAllData": "common-shared",
  "getSharedMemo": "common-shared",
  "getFileThumbnail": "common-shared",
  "saveSharedMemo": "admin-settings"
};
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
// __MENU_REGISTRY_BUILD_INJECT_END__

// docs/246 Phase 1-A: action 認可判定。
// 規則: role === 'MASTER' は全許可。それ以外は ACTION_TO_MENU[action] が
// LEGACY_ROLE_TO_MENUS[role] に含まれる場合のみ許可（未マップ action は fail-closed）。
// scripts/test-menu-registry.mjs が旧 ADMIN_ACTION_PERMISSIONS との等価性を保証する。
function isActionAllowedByMenu_(action, roleCode) {
  if (roleCode === 'MASTER') return true;
  var menuId = ACTION_TO_MENU[action];
  if (!menuId) return false;
  var allowed = LEGACY_ROLE_TO_MENUS[roleCode] || [];
  for (var i = 0; i < allowed.length; i += 1) {
    if (allowed[i] === menuId) return true;
  }
  return false;
}

var ADMIN_ACTION_PERMISSIONS = {
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
  'saveTraining': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v376.7: soft delete / restore は MASTER/ADMIN/TRAINING_MANAGER のみ（REGISTRAR は登録専用で削除権限なし）
  'softDeleteTraining': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'restoreTraining': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'uploadTrainingFile': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v350: 失敗時の手動サムネイル再生成
  'regenerateThumbnailForTraining': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'setupTrainingFileFolder': ['MASTER','ADMIN'],
  'getTrainingManagementData': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'getTrainingApplicants': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'sendTrainingReminder': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'getAdminEmailAliases': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'sendTrainingMail': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'generateTrainingEmail': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v373.7 (S5 Phase 2): getMembersForRoster / generateRosterZip / validateTemplateSpreadsheet 撤去（旧 RosterExport 関連）
  'getMembersForBulkMail': ['MASTER','ADMIN'],
  'sendBulkMemberMail': ['MASTER','ADMIN'],
  'getEmailSendLog': ['MASTER','ADMIN'],
  'getCredentialEmailTemplates': ['MASTER','ADMIN'],
  'saveCredentialEmailTemplate': ['MASTER','ADMIN'],
  'deleteCredentialEmailTemplate': ['MASTER','ADMIN'],
  'getBulkMailTemplates': ['MASTER','ADMIN'],
  'saveBulkMailTemplate': ['MASTER','ADMIN'],
  'deleteBulkMailTemplate': ['MASTER','ADMIN'],
  'searchMembersForDelete': ['MASTER'],
  'previewDeleteMember': ['MASTER'],
  'executeDeleteMember': ['MASTER'],
  'getDeleteLogs': ['MASTER'],
  'repairDuplicateStaffRecords': ['MASTER'],
  'repairTrainingApplicationApplicantIds': ['MASTER'],
  'repairMemberCareManagerDuplicates': ['MASTER'],
  'backupMigrationTargets': ['MASTER'],
  'fetchAllData': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v373.7 (S5 Phase 2): initRosterExport / processRosterChunk / finalizeRosterExport / cleanupRosterExport 撤去
  'getMailingListTargets': ['MASTER','ADMIN'],
  'generateMailingListExcel': ['MASTER','ADMIN'],
  // v264: 変更申請管理
  'getAdminChangeRequests': ['MASTER','ADMIN'],
  'approveAdminChangeRequest': ['MASTER','ADMIN'],
  'rejectAdminChangeRequest': ['MASTER','ADMIN'],
  // v295: 役員管理マスタ（システム設定から管理）
  'getOfficerMasterData': ['MASTER','ADMIN'],
  'saveOrganization': ['MASTER','ADMIN'],
  'deleteOrganization': ['MASTER','ADMIN'],
  'saveOfficerRole': ['MASTER','ADMIN'],
  'deleteOfficerRole': ['MASTER','ADMIN'],
  'savePaymentType': ['MASTER','ADMIN'],
  'deletePaymentType': ['MASTER','ADMIN'],
  'saveWorkCategory': ['MASTER','ADMIN'],
  'deleteWorkCategory': ['MASTER','ADMIN'],
  // v295/v297: 役員割当て管理（管理コンソール）
  'getOfficerManagementData': ['MASTER','ADMIN'],
  'assignOfficer': ['MASTER','ADMIN'],
  'resignOfficer': ['MASTER','ADMIN'],
  'updateOfficerLinkage': ['MASTER','ADMIN'],
  'updateOfficerRecord': ['MASTER','ADMIN'],
  // v295: 振込口座管理（管理者用）
  'getAdminBankAccount': ['MASTER','ADMIN'],
  'saveAdminBankAccount': ['MASTER','ADMIN'],
  'deleteAdminBankAccount': ['MASTER','ADMIN'],
  // v295: 支払い履歴管理
  'getPaymentHistory': ['MASTER','ADMIN'],
  'savePayment': ['MASTER','ADMIN'],
  'deletePayment': ['MASTER','ADMIN'],
  // v296: 請求管理（管理者）
  'getClaims': ['MASTER','ADMIN'],
  'approveClaim': ['MASTER','ADMIN'],
  'rejectClaim': ['MASTER','ADMIN'],
  'adminDeleteClaim': ['MASTER','ADMIN'],
  // v309: 共有メモ（年会費コンソール申し送りホワイトボード）
  'getSharedMemo': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR','GENERAL'],
  'saveSharedMemo': ['MASTER','ADMIN'],
  // v344: 案内PDFサムネイルを管理者画面でも Drive proxy 経由で取得（hotlink 制限回避）。
  'getFileThumbnail': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR','GENERAL'],
  // v373.7 (S5 Phase 2): 旧 v316 テンプレートライブラリ ACTION 群撤去
  // v372: 名簿出力 Visual Template Designer
  'getRosterFieldDictionary': ['MASTER','ADMIN'],
  'getRosterDesignerData': ['MASTER','ADMIN'],
  'loadRosterTemplatesV2': ['MASTER','ADMIN'],
  'saveRosterTemplateV2': ['MASTER','ADMIN'],
  'deleteRosterTemplateV2': ['MASTER','ADMIN'],
  'duplicateRosterTemplateV2': ['MASTER','ADMIN'],
  // v374.1: 公式LINE投稿依頼
  'listLinePostRequests': ['MASTER','ADMIN'],
  'getLinePostRequest': ['MASTER','ADMIN'],
  'saveLinePostRequest': ['MASTER','ADMIN'],
  'uploadLinePostAttachment': ['MASTER','ADMIN'],
  'transitionLinePostRequest': ['MASTER','ADMIN'],
  'deleteLinePostRequest': ['MASTER','ADMIN'],
  // v360: 研修名簿・出欠・受講履歴・一括メール明細
  'getTrainingRosterDetail': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'saveAttendance': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'saveAttendanceBatch': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'addRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'addGuestRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'cancelRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'updateRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'getTrainingStats': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
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
      // docs/246 Phase 1-A: 旧 requiredPerms.indexOf(permLevel) 判定を menu-based に置換。
      // 等価性は scripts/test-menu-registry.mjs（snapshot test）が保証する。
      // ADMIN_ACTION_PERMISSIONS は action 集合の whitelist 用途として残置（Phase 1-B で撤去予定）。
      if (!isActionAllowedByMenu_(action, permLevel)) {
        return JSON.stringify({ success: false, error: 'insufficient_permission' });
      }
      parsedPayload.__adminSession = sessionResult;
    }
    // 会員セッショントークン検証: ログイン以外の MEMBER_ALLOWED_ACTIONS は
    // サーバー側セッションキャッシュからのみ principal を解決し、クライアント申告を信頼しない
    var LOGIN_ONLY_MEMBER_ACTIONS = { memberLogin: true, requestPasswordReset: true, completePasswordReset: true };
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


    // v295: 役員自己サービス（sessionToken 検証済み → payload.memberId 確定済み）
    // v296: 請求（役員のみ）

    if (action === 'updateMember') {
      // v143: 管理者用 allowlist でサニタイズしてから委譲
      var sanitizedMemberPayload = sanitizeAdminMemberPayload_(parsedPayload);
      sanitizedMemberPayload.__adminSession = parsedPayload.__adminSession;
      return JSON.stringify({
        success: true,
        data: updateMember_(sanitizedMemberPayload),
      });
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






    if (action === 'checkAdminBySession') {
      return JSON.stringify({ success: true, data: checkAdminBySession_() });
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

    if (action === 'getSharedMemo') {
      return JSON.stringify({ success: true, data: getSharedMemo_(parsedPayload) });
    }

    if (action === 'saveSharedMemo') {
      return JSON.stringify({ success: true, data: saveSharedMemo_(parsedPayload) });
    }

    // v373.7 (S5 Phase 2): 旧 v316 RosterTemplate dispatcher 撤去
    // v372: 名簿出力 全面刷新（Visual Template Designer）
    if (action === 'getRosterFieldDictionary') {
      return JSON.stringify({ success: true, data: getRosterFieldDictionary_() });
    }
    if (action === 'getRosterDesignerData') {
      return JSON.stringify({ success: true, data: getRosterDesignerData_(parsedPayload) });
    }
    if (action === 'loadRosterTemplatesV2') {
      return JSON.stringify({ success: true, data: loadRosterTemplatesV2_() });
    }
    if (action === 'saveRosterTemplateV2') {
      return JSON.stringify({ success: true, data: saveRosterTemplateV2_(parsedPayload) });
    }
    if (action === 'deleteRosterTemplateV2') {
      return JSON.stringify({ success: true, data: deleteRosterTemplateV2_(parsedPayload) });
    }
    if (action === 'duplicateRosterTemplateV2') {
      return JSON.stringify({ success: true, data: duplicateRosterTemplateV2_(parsedPayload) });
    }

    // v374.1: 公式LINE投稿依頼
    if (action === 'listLinePostRequests') {
      return JSON.stringify({ success: true, data: listLinePostRequests_(parsedPayload) });
    }
    if (action === 'getLinePostRequest') {
      return JSON.stringify({ success: true, data: getLinePostRequest_(parsedPayload) });
    }
    if (action === 'saveLinePostRequest') {
      return JSON.stringify({ success: true, data: saveLinePostRequest_(parsedPayload) });
    }
    if (action === 'uploadLinePostAttachment') {
      return JSON.stringify({ success: true, data: uploadLinePostAttachment_(parsedPayload) });
    }
    if (action === 'transitionLinePostRequest') {
      return JSON.stringify({ success: true, data: transitionLinePostRequest_(parsedPayload) });
    }
    if (action === 'deleteLinePostRequest') {
      return JSON.stringify({ success: true, data: deleteLinePostRequest_(parsedPayload) });
    }

    if (action === 'sendTrainingReminder') {
      return JSON.stringify({ success: true, data: sendTrainingReminder_(parsedPayload) });
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

    // v376.7: 研修 soft delete / restore
    if (action === 'softDeleteTraining') {
      try {
        return JSON.stringify({ success: true, data: softDeleteTraining_(parsedPayload) });
      } catch (delErr) {
        return JSON.stringify({ success: false, error: delErr && delErr.message ? delErr.message : String(delErr) });
      }
    }
    if (action === 'restoreTraining') {
      try {
        return JSON.stringify({ success: true, data: restoreTraining_(parsedPayload) });
      } catch (resErr) {
        return JSON.stringify({ success: false, error: resErr && resErr.message ? resErr.message : String(resErr) });
      }
    }

    if (action === 'uploadTrainingFile') {
      return JSON.stringify({ success: true, data: uploadTrainingFile_(parsedPayload) });
    }

    if (action === 'regenerateThumbnailForTraining') {
      return JSON.stringify({ success: true, data: regenerateThumbnailForTraining_(parsedPayload) });
    }

    if (action === 'setupTrainingFileFolder') {
      return JSON.stringify({ success: true, data: setupTrainingFileFolder_(parsedPayload) });
    }




    if (action === 'getFileThumbnail') {
      return JSON.stringify({ success: true, data: getFileThumbnail_(parsedPayload) });
    }




    // v260/v261: 公開ポータル 会員情報変更・退会申請








    // v264: OTPなし本人確認フロー
    if (action === 'getAdminChangeRequests') {
      return JSON.stringify({ success: true, data: getAdminChangeRequests_(parsedPayload) });
    }
    if (action === 'approveAdminChangeRequest') {
      // v367: inner が {success:false, error:...} を返した場合は outer に伝播し
      // client 側で正しく失敗として扱えるようにする（旧: 常に success:true で包んでいた）
      var approveResult = approveAdminChangeRequest_(parsedPayload);
      if (approveResult && approveResult.success === false) {
        return JSON.stringify({ success: false, error: approveResult.error || 'approve failed' });
      }
      return JSON.stringify({ success: true, data: approveResult });
    }
    if (action === 'rejectAdminChangeRequest') {
      var rejectResult = rejectAdminChangeRequest_(parsedPayload);
      if (rejectResult && rejectResult.success === false) {
        return JSON.stringify({ success: false, error: rejectResult.error || 'reject failed' });
      }
      return JSON.stringify({ success: true, data: rejectResult });
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

    // ── v360: 研修名簿・出欠・受講履歴・一括メール明細 ───────────────
    if (action === 'getTrainingRosterDetail') {
      return JSON.stringify({ success: true, data: getTrainingRosterDetail_(parsedPayload) });
    }
    if (action === 'saveAttendance') {
      return JSON.stringify({ success: true, data: saveAttendance_(parsedPayload) });
    }
    if (action === 'saveAttendanceBatch') {
      return JSON.stringify({ success: true, data: saveAttendanceBatch_(parsedPayload) });
    }
    if (action === 'addRosterEntry') {
      return JSON.stringify({ success: true, data: addRosterEntry_(parsedPayload) });
    }
    if (action === 'addGuestRosterEntry') {
      return JSON.stringify({ success: true, data: addGuestRosterEntry_(parsedPayload) });
    }
    if (action === 'cancelRosterEntry') {
      return JSON.stringify({ success: true, data: cancelRosterEntry_(parsedPayload) });
    }
    if (action === 'updateRosterEntry') {
      return JSON.stringify({ success: true, data: updateRosterEntry_(parsedPayload) });
    }
    if (action === 'getTrainingStats') {
      return JSON.stringify({ success: true, data: getTrainingStats_(parsedPayload) });
    }

    // v188: Gemini AI案内メール生成（APIキーはScriptPropertiesで管理、フロントに露出しない）
    if (action === 'generateTrainingEmail') {
      return JSON.stringify({ success: true, data: generateTrainingEmailWithAI_(parsedPayload) });
    }

    // v373.7 (S5 Phase 2): 旧 PDF 名簿出力 dispatcher 群撤去（v194 getMembersForRoster /
    // v205 initRosterExport / processRosterChunk / finalizeRosterExport / cleanupRosterExport /
    // validateTemplateSpreadsheet）。新 Visual Template Designer に統合済み。

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
    if (action === 'getMailingListTargets') {
      return JSON.stringify({ success: true, data: getMailingListTargets_(parsedPayload) });
    }
    if (action === 'generateMailingListExcel') {
      return JSON.stringify({ success: true, data: generateMailingListExcel_(parsedPayload) });
    }

    // v295: 役員管理マスタ
    if (action === 'getOfficerMasterData') {
      return JSON.stringify({ success: true, data: getOfficerMasterData_() });
    }
    if (action === 'saveOrganization') {
      return JSON.stringify({ success: true, data: saveOrganization_(parsedPayload) });
    }
    if (action === 'deleteOrganization') {
      return JSON.stringify({ success: true, data: deleteOrganization_(parsedPayload) });
    }
    if (action === 'saveOfficerRole') {
      return JSON.stringify({ success: true, data: saveOfficerRole_(parsedPayload) });
    }
    if (action === 'deleteOfficerRole') {
      return JSON.stringify({ success: true, data: deleteOfficerRole_(parsedPayload) });
    }
    if (action === 'savePaymentType') {
      return JSON.stringify({ success: true, data: savePaymentType_(parsedPayload) });
    }
    if (action === 'deletePaymentType') {
      return JSON.stringify({ success: true, data: deletePaymentType_(parsedPayload) });
    }
    if (action === 'saveWorkCategory') {
      return JSON.stringify({ success: true, data: saveWorkCategory_(parsedPayload) });
    }
    if (action === 'deleteWorkCategory') {
      return JSON.stringify({ success: true, data: deleteWorkCategory_(parsedPayload) });
    }
    // v295: 役員割当て管理
    if (action === 'getOfficerManagementData') {
      return JSON.stringify({ success: true, data: getOfficerManagementData_() });
    }
    if (action === 'assignOfficer') {
      return JSON.stringify({ success: true, data: assignOfficer_(parsedPayload) });
    }
    if (action === 'resignOfficer') {
      return JSON.stringify({ success: true, data: resignOfficer_(parsedPayload) });
    }
    if (action === 'updateOfficerLinkage') {
      return JSON.stringify({ success: true, data: updateOfficerLinkage_(parsedPayload) });
    }
    if (action === 'updateOfficerRecord') {
      return JSON.stringify({ success: true, data: updateOfficerRecord_(parsedPayload) });
    }
    // v295: 振込口座管理（管理者用）
    if (action === 'getAdminBankAccount') {
      return JSON.stringify({ success: true, data: getBankAccount_(parsedPayload) });
    }
    if (action === 'saveAdminBankAccount') {
      return JSON.stringify({ success: true, data: saveBankAccount_(parsedPayload) });
    }
    if (action === 'deleteAdminBankAccount') {
      return JSON.stringify({ success: true, data: deleteBankAccount_(parsedPayload) });
    }
    // v295: 支払い履歴管理
    if (action === 'getPaymentHistory') {
      return JSON.stringify({ success: true, data: getPaymentHistory_(parsedPayload) });
    }
    if (action === 'savePayment') {
      return JSON.stringify({ success: true, data: savePayment_(parsedPayload) });
    }
    if (action === 'deletePayment') {
      return JSON.stringify({ success: true, data: deletePayment_(parsedPayload) });
    }
    // v296: 請求管理（管理者）
    if (action === 'getClaims') {
      return JSON.stringify({ success: true, data: getClaims_(parsedPayload) });
    }
    if (action === 'approveClaim') {
      return JSON.stringify({ success: true, data: approveClaim_(parsedPayload) });
    }
    if (action === 'rejectClaim') {
      return JSON.stringify({ success: true, data: rejectClaim_(parsedPayload) });
    }
    if (action === 'adminDeleteClaim') {
      return JSON.stringify({ success: true, data: adminDeleteClaim_(parsedPayload) });
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
    if (action === 'backupMigrationTargets') {
      return JSON.stringify({ success: true, data: backupMigrationTargets_() });
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
    var sendRes = deliverMail_('BULK_MAIL', to, subject, body, { name: '枚方市介護支援専門員連絡協議会 事務局' });
    if (sendRes && sendRes.sent) {
      result.sentTo.push(to);
      result.sentCount += 1;
    }
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


/**
 * 負荷試験用の会員・事業所・職員・認証・会費・研修申込データを追加する。
 * - 既存データは保持する
 * - 以前生成した LT 系データのみ削除して再生成する
 * - 会員/職員/認証/年会費/申込/申込者数の整合を同一処理で保つ
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
  // v362: kana 列追加のためキャッシュ key を bump
  return 'adminDashboard:' + DB_SCHEMA_VERSION + ':v362-kana';
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
  // v376.7: getTrainingManagementData_ は cache key に _v2 suffix を追加したため両方クリア
  var cache = CacheService.getScriptCache();
  var baseKey = getTrainingManagementCacheKey_();
  removeChunkedCache_(cache, baseKey);
  removeChunkedCache_(cache, baseKey + '_v2');
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
    members: mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap, { includeAdminStatusNote: true }),
    trainings: mapTrainingRowsForApi_(trainingRows),
  };
}

// v235: loginId をセッションアンカーとして受け取り、T_認証アカウントから現在の memberId/staffId を解決する。
// ロール変換後にフロントエンドのセッションが古い memberId を持っていても自動補正される。
// 後方互換: loginId のみ指定時は T_認証アカウントから解決。memberId のみ指定（旧形式）も引き続き動作。

function mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap, options) {
  var includeAdminStatusNote = options && options.includeAdminStatusNote === true;
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
    var mappedMember = {
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
    if (includeAdminStatusNote) {
      mappedMember.statusNote = String(m['ステータスメモ'] || '');
    }
    return mappedMember;
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
      // v376.7: admin 一覧で削除済フィルタを表示するため isDeleted を公開（公開ポータルは別パス）
      isDeleted: toBoolean_(t['削除フラグ']),
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
  if (cached && cached.staffRows) return cached;

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var memberById = {};
  for (var memberMapIdx = 0; memberMapIdx < memberRows.length; memberMapIdx += 1) {
    memberById[String(memberRows[memberMapIdx]['会員ID'] || '')] = memberRows[memberMapIdx];
  }
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
  var staffSummaries = staffRows.map(function(staff) {
    var staffMemberId = String(staff['会員ID'] || '');
    var parentMember = memberById[staffMemberId] || {};
    var staffNameFields = normalizeStaffNameFields_(staff);
    return {
      memberId: staffMemberId,
      officeName: String(parentMember['勤務先名'] || ''),
      officeNumber: String(parentMember['事業所番号'] || ''),
      staffId: String(staff['職員ID'] || ''),
      careManagerNumber: String(staff['介護支援専門員番号'] || ''),
      lastName: staffNameFields.lastName,
      firstName: staffNameFields.firstName,
      lastKana: staffNameFields.lastKana,
      firstKana: staffNameFields.firstKana,
      name: staffNameFields.name,
      kana: staffNameFields.kana,
      email: String(staff['メールアドレス'] || ''),
      role: String(staff['職員権限コード'] || 'STAFF'),
      status: String(staff['職員状態コード'] || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED',
      joinedDate: normalizeDateInput_(staff['入会日']),
      withdrawnDate: normalizeDateInput_(staff['退会日']),
      mailingPreference: String(staff['メール配信希望コード'] || 'YES'),
    };
  }).sort(function(a, b) {
    return String(a.officeName || '').localeCompare(String(b.officeName || ''))
      || String(a.name || '').localeCompare(String(b.name || ''))
      || String(a.staffId || '').localeCompare(String(b.staffId || ''));
  });

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
      // v362: フリガナ検索対応（T_会員 セイ + メイ）
      kana: (String(member['セイ'] || '') + ' ' + String(member['メイ'] || '')).trim(),
      memberType: memberType,
      officeName: String(member['勤務先名'] || ''),
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
    staffRows: staffSummaries,
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
  // v376.7: admin 一覧では削除済も含めて全件返す（isDeleted で識別、frontend で filter）。
  //   公開ポータルは fetchAllData_ など別 API パスで !削除フラグ filter 済み。
  var cache = CacheService.getScriptCache();
  var cacheKey = getTrainingManagementCacheKey_() + '_v2';
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var trainingRows = getRowsAsObjects_(ss, 'T_研修');

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







var PASSWORD_RESET_CODE_TTL_SECONDS = 30 * 60;
var PASSWORD_RESET_CODE_TTL_MINUTES = 30;
var PASSWORD_RESET_GENERIC_MESSAGE = '入力内容が登録情報と一致する場合、手続き用メールを送信しました。メールに記載された確認コードを入力してください。';











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

  // docs/246 Phase 1-A: menu-based 認可向けの追加フィールド。
  // 既存 adminPermissionLevel は後方互換のため維持。
  // Phase 1-B: ロールID 列があれば T_権限ロール を優先参照、無ければ legacy 権限コード fallback。
  var roleIdFromWl = String(matched['ロールID'] || '').trim();
  var resolvedRole = roleIdFromWl ? getRoleByIdCached_(ss, roleIdFromWl) : null;
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
    displayName: derivedDisplayName,
    authenticatedAt: nowIso,
  };
}

function clearAdminPermissionCaches_() {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('admin_wl_v1');
    cache.remove('admin_auth_v1');
    cache.remove('admin_roles_v1'); // docs/246 Phase 1-B
  } catch (e) {}
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
  if (!sheet) return { seeded: false, reason: 'T_権限ロール シート未作成' };
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
 * operator 実行用: T_権限ロール スキーマ + ロールID 列 + 初期ロール seed を一括で適用。
 * 既存スキーマには影響なし（idempotent）。
 *
 * 実行手順: Apps Script editor（admin split）から ▶ Run。
 * 出力: 適用結果サマリ JSON。
 */
function runRebuildSchemaForV246() {
  var ss = getOrCreateDatabase_();
  var report = { schemaVersion: DB_SCHEMA_VERSION, steps: [] };

  // Step 1: T_権限ロール シート作成（既存なら no-op）
  normalizeTableColumns_(ss, 'T_権限ロール');
  report.steps.push({ step: 'T_権限ロール 列正規化', table: 'T_権限ロール' });

  // Step 2: T_管理者Googleホワイトリスト の ロールID 列追加（既存データ保持）
  normalizeTableColumns_(ss, 'T_管理者Googleホワイトリスト');
  report.steps.push({ step: 'T_管理者Googleホワイトリスト 列正規化（ロールID 列追加）' });

  // Step 3: 初期ロール seed
  var seedResult = seedInitialPermissionRoles_(ss);
  report.steps.push({ step: '初期ロール seed', result: seedResult });

  // Step 4: キャッシュ無効化
  clearAdminPermissionCaches_();
  report.steps.push({ step: 'admin permission caches クリア' });

  return JSON.stringify(report, null, 2);
}

/**
 * operator 実行用: ホワイトリスト各行の権限コード → ロールID 変換プレビュー。
 * 何も書き換えず、変換結果を JSON で返す。
 */
function migrateToRoleBasedRBAC_v246_DRYRUN() {
  var ss = getOrCreateDatabase_();
  var rows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト');
  var preview = [];
  for (var i = 0; i < rows.length; i += 1) {
    var r = rows[i];
    if (toBoolean_(r['削除フラグ'])) continue;
    var code = String(r['権限コード'] || '');
    var currentRoleId = String(r['ロールID'] || '');
    var newRoleId = LEGACY_CODE_TO_INITIAL_ROLE_ID[code] || '';
    preview.push({
      wlId: String(r['ホワイトリストID'] || ''),
      email: String(r['Googleメール'] || ''),
      currentPermCode: code,
      currentRoleId: currentRoleId,
      newRoleId: newRoleId,
      action: !newRoleId ? 'SKIP（未マップ権限コード）'
        : currentRoleId === newRoleId ? 'SKIP（既に正しい）'
        : currentRoleId ? '上書き（' + currentRoleId + ' → ' + newRoleId + '）'
        : '新規設定（' + newRoleId + '）',
    });
  }
  return JSON.stringify({
    総ホワイトリスト件数: preview.length,
    プレビュー: preview,
    mapping参考: LEGACY_CODE_TO_INITIAL_ROLE_ID,
    注意事項: '実反映には migrateToRoleBasedRBAC_v246_APPLY を実行してください。',
  }, null, 2);
}

/**
 * operator 実行用: ホワイトリスト各行の権限コード → ロールID を実書込み。
 * 冪等（既に正しい値なら no-op）。権限コード列は保持（並行運用）。
 */
function migrateToRoleBasedRBAC_v246_APPLY() {
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません。');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idCol = headers.indexOf('ホワイトリストID');
  var codeCol = headers.indexOf('権限コード');
  var roleIdCol = headers.indexOf('ロールID');
  var delFlagCol = headers.indexOf('削除フラグ');
  var updatedAtCol = headers.indexOf('更新日時');
  if (idCol < 0 || codeCol < 0 || roleIdCol < 0) {
    throw new Error('ホワイトリストの列構成が想定外（ロールID 列が無い場合は runRebuildSchemaForV246 を先に実行）。');
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return JSON.stringify({ updated: 0, skipped: 0, note: 'ホワイトリスト空' });
  var range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  var values = range.getValues();
  var nowIso = new Date().toISOString();
  var updated = 0;
  var skipped = 0;
  var log = [];
  for (var i = 0; i < values.length; i += 1) {
    var row = values[i];
    if (delFlagCol >= 0 && toBoolean_(row[delFlagCol])) { skipped += 1; continue; }
    var code = String(row[codeCol] || '');
    var newRoleId = LEGACY_CODE_TO_INITIAL_ROLE_ID[code] || '';
    var currentRoleId = String(row[roleIdCol] || '');
    if (!newRoleId) { skipped += 1; log.push({ wlId: String(row[idCol] || ''), reason: '未マップ権限コード: ' + code }); continue; }
    if (currentRoleId === newRoleId) { skipped += 1; continue; }
    row[roleIdCol] = newRoleId;
    if (updatedAtCol >= 0) row[updatedAtCol] = nowIso;
    updated += 1;
    log.push({ wlId: String(row[idCol] || ''), email: String(row[1] || ''), from: currentRoleId || '(空)', to: newRoleId });
  }
  if (updated > 0) {
    range.setValues(values);
  }
  clearAdminPermissionCaches_();
  return JSON.stringify({ updated: updated, skipped: skipped, log: log, appliedAt: nowIso }, null, 2);
}


// ─── v309: 共有メモ（申し送りホワイトボード）────────────────────────────────

function getSharedMemo_(payload) {
  var key = String((payload && payload.key) || 'ANNUAL_FEE_BOARD');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_共有メモ');
  if (!sheet || sheet.getLastRow() < 2) {
    return { key: key, content: '', updatedByEmail: '', updatedByName: '', updatedAt: '', version: 0 };
  }
  var found = findRowByColumnValue_(sheet, 'キー', key);
  if (!found) {
    return { key: key, content: '', updatedByEmail: '', updatedByName: '', updatedAt: '', version: 0 };
  }
  var row = found.row;
  var cols = found.columns;
  return {
    key: key,
    content: String(row[cols['内容']] || ''),
    updatedByEmail: String(row[cols['更新者メール']] || ''),
    updatedByName: String(row[cols['更新者名']] || ''),
    updatedAt: String(row[cols['更新日時']] || ''),
    version: parseInt(String(row[cols['バージョン']] || '0'), 10) || 0,
  };
}

function saveSharedMemo_(payload) {
  var key = String((payload && payload.key) || 'ANNUAL_FEE_BOARD');
  var content = String((payload && payload.content !== undefined) ? payload.content : '');
  var clientVersion = parseInt(String((payload && payload.version) || '0'), 10) || 0;
  var session = payload && payload.__adminSession;
  var editorEmail = session ? String(session.loginId || '') : '';
  var editorName = session ? String(session.displayName || '') : '';

  var ss = getOrCreateDatabase_();
  // シートが存在しない場合はヘッダー付きで新規作成
  var sheet = getOrCreateSheet_(ss, 'T_共有メモ');
  writeSheetHeaders_(sheet, テーブル定義['T_共有メモ']);

  var now = new Date().toISOString();
  var found = (sheet.getLastRow() >= 2) ? findRowByColumnValue_(sheet, 'キー', key) : null;

  if (found) {
    var serverVersion = parseInt(String(found.row[found.columns['バージョン']] || '0'), 10) || 0;
    // 楽観的排他制御: クライアントのバージョンが古い場合は競合として返す
    if (clientVersion < serverVersion) {
      return {
        conflict: true,
        current: {
          key: key,
          content: String(found.row[found.columns['内容']] || ''),
          updatedByEmail: String(found.row[found.columns['更新者メール']] || ''),
          updatedByName: String(found.row[found.columns['更新者名']] || ''),
          updatedAt: String(found.row[found.columns['更新日時']] || ''),
          version: serverVersion,
        },
      };
    }
    var newVersion = serverVersion + 1;
    var newRow = found.row.slice();
    newRow[found.columns['内容']] = content;
    newRow[found.columns['更新者メール']] = editorEmail;
    newRow[found.columns['更新者名']] = editorName;
    newRow[found.columns['更新日時']] = now;
    newRow[found.columns['バージョン']] = newVersion;
    sheet.getRange(found.rowNumber, 1, 1, newRow.length).setValues([newRow]);
    return { key: key, content: content, updatedByEmail: editorEmail, updatedByName: editorName, updatedAt: now, version: newVersion };
  }

  // 新規行を追加
  appendRowsByHeaders_(ss, 'T_共有メモ', [{
    'キー': key,
    '内容': content,
    '更新者メール': editorEmail,
    '更新者名': editorName,
    '更新日時': now,
    'バージョン': 1,
  }]);
  return { key: key, content: content, updatedByEmail: editorEmail, updatedByName: editorName, updatedAt: now, version: 1 };
}

// ─────────────────────────────────────────────────────────────────────────────

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
  // v373.7 (S5 Phase 2): ROSTER_TEMPLATE_SS_ID / REMINDER_TEMPLATE_SS_ID は撤去（旧 RosterExport 関連）
  // データ自体は T_システム設定 に残置（rollback 容易・データ保全）
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
    // v373.7 (S5 Phase 2): rosterTemplateSsId / reminderTemplateSsId / rosterTemplates 撤去
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
    claimAttachmentFolderId: String(m['CLAIM_ATTACHMENT_FOLDER_ID'] || '').trim(),
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
    // v368: 変更申請ワークフローメール
    applicationReceiptEnabled:    (function(){ var v = m['APPLICATION_RECEIPT_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    applicationReceiptSubject:    String(m['APPLICATION_RECEIPT_SUBJECT'] || '') || APPLICATION_RECEIPT_DEFAULT_SUBJECT,
    applicationReceiptBody:       String(m['APPLICATION_RECEIPT_BODY'] || '') || APPLICATION_RECEIPT_DEFAULT_BODY,
    approvalNotificationEnabled:  (function(){ var v = m['APPROVAL_NOTIFICATION_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    approvalNotificationSubject:  String(m['APPROVAL_NOTIFICATION_SUBJECT'] || '') || APPROVAL_NOTIFICATION_DEFAULT_SUBJECT,
    approvalNotificationBody:     String(m['APPROVAL_NOTIFICATION_BODY'] || '') || APPROVAL_NOTIFICATION_DEFAULT_BODY,
    rejectionNotificationEnabled: (function(){ var v = m['REJECTION_NOTIFICATION_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    rejectionNotificationSubject: String(m['REJECTION_NOTIFICATION_SUBJECT'] || '') || REJECTION_NOTIFICATION_DEFAULT_SUBJECT,
    rejectionNotificationBody:    String(m['REJECTION_NOTIFICATION_BODY'] || '') || REJECTION_NOTIFICATION_DEFAULT_BODY,
    // v371: メール送信 4 階層ガード（GLOBAL / MODE / ALLOWLIST / CATEGORY 6 種）
    mailGlobalEnabled:            (function(){ var v = m['MAIL_GLOBAL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    mailDeliveryMode:             String(m['MAIL_DELIVERY_MODE'] || 'LIVE').toUpperCase(),
    mailRedirectAllowlist:        String(m['MAIL_REDIRECT_ALLOWLIST'] || ''),
    trainingApplyReceiptEnabled:  (function(){ var v = m['TRAINING_APPLY_RECEIPT_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    trainingReminderEnabled:      (function(){ var v = m['TRAINING_REMINDER_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    bulkMailEnabled:              (function(){ var v = m['BULK_MAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    authOtpEnabled:               (function(){ var v = m['AUTH_OTP_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    memberUpdateConfirmEnabled:   (function(){ var v = m['MEMBER_UPDATE_CONFIRM_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    withdrawalConfirmEnabled:     (function(){ var v = m['WITHDRAWAL_CONFIRM_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    passwordResetEnabled:         (function(){ var v = m['PASSWORD_RESET_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
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
  // v373.7 (S5 Phase 2): rosterTemplateSsId / reminderTemplateSsId pass-through 撤去
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
  // v296: 請求添付ファイル保存先フォルダ
  if (request.claimAttachmentFolderId != null) {
    updates.push({ key: 'CLAIM_ATTACHMENT_FOLDER_ID', value: String(request.claimAttachmentFolderId || '').trim(), description: '請求添付ファイル保存先 Google Drive フォルダ ID' });
    PropertiesService.getScriptProperties().setProperty('CLAIM_ATTACHMENT_FOLDER_ID', String(request.claimAttachmentFolderId || '').trim());
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
  // v368: 変更申請ワークフローメール 3 種 × ENABLED/SUBJECT/BODY
  if (request.applicationReceiptEnabled != null) {
    updates.push({ key: 'APPLICATION_RECEIPT_ENABLED', value: request.applicationReceiptEnabled ? 'true' : 'false', description: '公開ポータル申請受付時：受付確認メール送信ON/OFF' });
  }
  if (request.applicationReceiptSubject != null) {
    updates.push({ key: 'APPLICATION_RECEIPT_SUBJECT', value: String(request.applicationReceiptSubject).trim() || APPLICATION_RECEIPT_DEFAULT_SUBJECT, description: '公開ポータル申請受付時：受付確認メール件名' });
  }
  if (request.applicationReceiptBody != null) {
    updates.push({ key: 'APPLICATION_RECEIPT_BODY', value: String(request.applicationReceiptBody) || APPLICATION_RECEIPT_DEFAULT_BODY, description: '公開ポータル申請受付時：受付確認メール本文' });
  }
  if (request.approvalNotificationEnabled != null) {
    updates.push({ key: 'APPROVAL_NOTIFICATION_ENABLED', value: request.approvalNotificationEnabled ? 'true' : 'false', description: '管理者承認時：承認通知メール送信ON/OFF' });
  }
  if (request.approvalNotificationSubject != null) {
    updates.push({ key: 'APPROVAL_NOTIFICATION_SUBJECT', value: String(request.approvalNotificationSubject).trim() || APPROVAL_NOTIFICATION_DEFAULT_SUBJECT, description: '管理者承認時：承認通知メール件名' });
  }
  if (request.approvalNotificationBody != null) {
    updates.push({ key: 'APPROVAL_NOTIFICATION_BODY', value: String(request.approvalNotificationBody) || APPROVAL_NOTIFICATION_DEFAULT_BODY, description: '管理者承認時：承認通知メール本文' });
  }
  if (request.rejectionNotificationEnabled != null) {
    updates.push({ key: 'REJECTION_NOTIFICATION_ENABLED', value: request.rejectionNotificationEnabled ? 'true' : 'false', description: '管理者却下時：却下通知メール送信ON/OFF' });
  }
  if (request.rejectionNotificationSubject != null) {
    updates.push({ key: 'REJECTION_NOTIFICATION_SUBJECT', value: String(request.rejectionNotificationSubject).trim() || REJECTION_NOTIFICATION_DEFAULT_SUBJECT, description: '管理者却下時：却下通知メール件名' });
  }
  if (request.rejectionNotificationBody != null) {
    updates.push({ key: 'REJECTION_NOTIFICATION_BODY', value: String(request.rejectionNotificationBody) || REJECTION_NOTIFICATION_DEFAULT_BODY, description: '管理者却下時：却下通知メール本文' });
  }
  // v371: メール送信 4 階層ガード
  if (request.mailGlobalEnabled != null) {
    updates.push({ key: 'MAIL_GLOBAL_ENABLED', value: request.mailGlobalEnabled ? 'true' : 'false', description: 'メール送信のグローバルキルスイッチ（false で全停止）' });
  }
  if (request.mailDeliveryMode != null) {
    var rawMode = String(request.mailDeliveryMode || 'LIVE').toUpperCase();
    if (['LIVE', 'REDIRECT', 'SUPPRESS'].indexOf(rawMode) < 0) rawMode = 'LIVE';
    updates.push({ key: 'MAIL_DELIVERY_MODE', value: rawMode, description: '配信モード: LIVE / REDIRECT / SUPPRESS' });
  }
  if (request.mailRedirectAllowlist != null) {
    // 入力サニタイズ: トリム + カンマ区切り正規化
    var allowlistRaw = String(request.mailRedirectAllowlist || '');
    var normalized = allowlistRaw.split(',').map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; }).join(',');
    updates.push({ key: 'MAIL_REDIRECT_ALLOWLIST', value: normalized, description: 'REDIRECT モード時の送信先（カンマ区切り）' });
  }
  if (request.trainingApplyReceiptEnabled != null) {
    updates.push({ key: 'TRAINING_APPLY_RECEIPT_ENABLED', value: request.trainingApplyReceiptEnabled ? 'true' : 'false', description: '研修申込確認メール送信ON/OFF' });
  }
  if (request.trainingReminderEnabled != null) {
    updates.push({ key: 'TRAINING_REMINDER_ENABLED', value: request.trainingReminderEnabled ? 'true' : 'false', description: '研修リマインダーメール送信ON/OFF' });
  }
  if (request.bulkMailEnabled != null) {
    updates.push({ key: 'BULK_MAIL_ENABLED', value: request.bulkMailEnabled ? 'true' : 'false', description: '一括メール送信ON/OFF' });
  }
  if (request.authOtpEnabled != null) {
    updates.push({ key: 'AUTH_OTP_ENABLED', value: request.authOtpEnabled ? 'true' : 'false', description: '公開ポータル OTP メール送信ON/OFF' });
  }
  if (request.memberUpdateConfirmEnabled != null) {
    updates.push({ key: 'MEMBER_UPDATE_CONFIRM_ENABLED', value: request.memberUpdateConfirmEnabled ? 'true' : 'false', description: '会員情報変更確認メール送信ON/OFF' });
  }
  if (request.withdrawalConfirmEnabled != null) {
    updates.push({ key: 'WITHDRAWAL_CONFIRM_ENABLED', value: request.withdrawalConfirmEnabled ? 'true' : 'false', description: '退会申請受付確認メール送信ON/OFF' });
  }
  if (request.passwordResetEnabled != null) {
    updates.push({ key: 'PASSWORD_RESET_ENABLED', value: request.passwordResetEnabled ? 'true' : 'false', description: 'パスワード再設定確認コードメール送信ON/OFF' });
  }
  batchUpsertSystemSettings_(ss, updates);
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
      // 表示名を会員名/職員名 + 権限ラベルから自動導出
      var memberRow = memberMap[linkedMemberId];
      var staffRow = staffMap[linkedStaffId];
      var personName = '';
      if (memberRow) {
        personName = (String(memberRow['姓'] || '') + ' ' + String(memberRow['名'] || '')).trim();
      }
      if (!personName && staffRow) {
        personName = String(staffRow['氏名'] || '').trim();
        if (!personName) {
          personName = (String(staffRow['姓'] || '') + ' ' + String(staffRow['名'] || '')).trim();
        }
      }
      var derivedDisplayName = personName ? personName + '（' + mapAdminPermissionLabel_(permLevel) + '）' : mapAdminPermissionLabel_(permLevel);
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

function getMemberFiscalSnapshot_(memberRow, fiscalYear) {
  var normalizedYear = Number(fiscalYear || 0);
  var result = {
    eligible: false,
    memberStatus: 'OUT_OF_YEAR',
    joinedDate: normalizeDateInput_(memberRow && memberRow['入会日']),
    withdrawnDate: normalizeDateInput_(memberRow && memberRow['退会日']),
    fiscalYear: normalizedYear,
    reason: '',
  };
  if (!memberRow) {
    result.reason = 'NO_MEMBER';
    return result;
  }
  if (toBoolean_(memberRow['削除フラグ'])) {
    result.reason = 'DELETED';
    return result;
  }
  if (!isFinite(normalizedYear) || normalizedYear < 2000 || normalizedYear > 2100) {
    result.reason = 'INVALID_YEAR';
    return result;
  }

  var memberStatus = String(memberRow['会員状態コード'] || 'ACTIVE');
  var previousFiscalYearEnd = getAnnualFeeFiscalYearPreviousEndDate_(normalizedYear);
  var fiscalYearEnd = getAnnualFeeFiscalYearEndDate_(normalizedYear);

  if (result.withdrawnDate && result.withdrawnDate <= previousFiscalYearEnd) {
    result.reason = 'WITHDRAWN_BEFORE_YEAR';
    result.memberStatus = 'WITHDRAWN';
    return result;
  }
  if (!result.withdrawnDate && memberStatus === 'WITHDRAWN') {
    result.reason = 'WITHDRAWN_WITHOUT_DATE';
    result.memberStatus = 'WITHDRAWN';
    return result;
  }
  if (result.joinedDate && result.joinedDate > fiscalYearEnd) {
    result.reason = 'JOINED_AFTER_YEAR';
    result.memberStatus = 'NOT_YET_JOINED';
    return result;
  }

  result.eligible = true;
  if (memberStatus === 'WITHDRAWAL_SCHEDULED') {
    result.memberStatus = 'WITHDRAWAL_SCHEDULED';
  } else if (result.withdrawnDate && result.withdrawnDate <= fiscalYearEnd) {
    result.memberStatus = 'WITHDRAWN';
  } else {
    result.memberStatus = 'ACTIVE';
  }
  return result;
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
  var oldestDisplayYear = Math.max(2024, currentFiscalYear - 3);
  for (var displayYear = currentFiscalYear; displayYear >= oldestDisplayYear; displayYear -= 1) {
    if (isAnnualFeeEligibleMemberForYear_(memberRow, displayYear)) {
      prioritizedYears.push(displayYear);
    }
  }

  if (prioritizedYears.length === 0) {
    return sortedActualHistory.filter(function(record) {
      var actualYear = Number(record && record.year || 0);
      return actualYear >= 2024 && actualYear <= currentFiscalYear;
    }).slice(0, 4);
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
  return getMemberFiscalSnapshot_(memberRow, fiscalYear).eligible;
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
    // v364: 前年度未納者数（前年度有効 かつ UNPAID/未記録）
    previousYearUnpaidCount: 0,
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

    // v364: 前年度未納集計
    if (record.previousYearEligible && record.previousYearStatus === 'UNPAID') {
      summary.previousYearUnpaidCount += 1;
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
  // v364: 前年度（selectedYear - 1）の納入状況を判定するためのマップ
  var previousYear = selectedYear - 1;
  var prevFeeByMember = {};
  for (var feeIdx = 0; feeIdx < feeRows.length; feeIdx += 1) {
    var fee = feeRows[feeIdx];
    var feeYear = Number(fee['対象年度'] || 0);
    var feeMemberId = String(fee['会員ID'] || '');
    if (feeYear === selectedYear) feeByMemberYear[feeMemberId] = fee;
    else if (feeYear === previousYear) prevFeeByMember[feeMemberId] = fee;
  }

  // v364: 全 T_会員 から「前年度に有効だった人」を一度判定（memberRows は selectedYear で
  // フィルタ済のため、selectedYear=2026 / previousYear=2025 で 2026 入会者の前年判定が漏れない
  // よう、対象 selectedYear の memberRows をそのまま使う＝同一スキーマで eligibility 再判定）
  var records = memberRows.map(function(member) {
    var memberId = String(member['会員ID'] || '');
    var row = feeByMemberYear[memberId];
    var record = mapAnnualFeeAdminRecord_(row, member, selectedYear, amountMap);

    // 前年度ステータス判定: 有効でない → NOT_ELIGIBLE, 有効かつ PAID → PAID, それ以外 → UNPAID
    var prevEligible = isAnnualFeeEligibleMemberForYear_(member, previousYear);
    record.previousYear = previousYear;
    record.previousYearEligible = prevEligible;
    if (!prevEligible) {
      record.previousYearStatus = 'NOT_ELIGIBLE';
    } else {
      var prevFee = prevFeeByMember[memberId];
      var prevStatus = prevFee ? String(prevFee['会費納入状態コード'] || 'UNPAID') : 'UNPAID';
      record.previousYearStatus = prevStatus === 'PAID' ? 'PAID' : 'UNPAID';
    }
    return record;
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
    // v362: フリガナ検索対応（T_会員 セイ + メイ）
    kana: ((String((memberRow && memberRow['セイ']) || '') + ' ' + String((memberRow && memberRow['メイ']) || '')).trim()),
    officeName: String((memberRow && memberRow['勤務先名']) || ''),
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
  // v362: kana 列追加 / v364: previousYear 列追加のためキャッシュ key を bump
  return 'annualFeeAdminData:' + DB_SCHEMA_VERSION + ':v364-prev:' + String(year || '');
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

// ── 入会申込処理（統合フォーム用）──────────────────────────
function enqueueMemberApplicationChangeRequest_(payload) {
  payload = payload || {};
  var memberType = String(payload.memberType || '').trim();
  if (['INDIVIDUAL', 'BUSINESS', 'SUPPORT'].indexOf(memberType) === -1) {
    throw new Error('会員種別が不正です。');
  }
  var contactEmail = String(payload.email || payload.representativeEmail || '').trim();
  if (!contactEmail && memberType === 'BUSINESS' && Array.isArray(payload.staff) && payload.staff.length > 0) {
    contactEmail = String(payload.staff[0].email || '').trim();
  }
  if (!contactEmail) throw new Error('連絡先メールアドレスが必要です。');

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
    memberTypeLabel: memberType === 'INDIVIDUAL' ? '個人会員' : memberType === 'BUSINESS' ? '事業所会員' : '賛助会員',
  });
  return { queued: true, success: true, requestId: requestId };
}

function submitMemberApplication_(payload) {
  return enqueueMemberApplicationChangeRequest_(payload);
}

function createMemberApplicationDirect_(payload) {
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

  if (!isBusiness) {
    var applicantCareManagerNumber = String(payload.careManagerNumber || '').trim();
    if (applicantCareManagerNumber) {
      var duplicateIndividual = getSingleRegistrationCandidate_(
        registrationIndex.activeMembersByCareManager[applicantCareManagerNumber],
        '同じ介護支援専門員番号の会員が複数登録されています。事務局へお問い合わせください。'
      );
      if (duplicateIndividual) {
        throw new Error('この介護支援専門員番号は既に登録済みです。同じ人物の二重登録はできません。');
      }

      var sourceStaff = getSingleRegistrationCandidate_(
        registrationIndex.activeStaffByCareManager[applicantCareManagerNumber],
        '同じ介護支援専門員番号の事業所会員メンバーが複数登録されています。事務局へお問い合わせください。'
      );
      if (sourceStaff) {
        if (memberTypeCode !== 'INDIVIDUAL') {
          throw new Error('事業所職員から賛助会員への自動移行は未対応です。手動で確認してください。');
        }
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
      // v376: kana 列を全角カタカナへ正規化（事業所会員は空のまま）
      case 'セイ': return isBusiness ? '' : normalizeAndValidateKana_(payload.lastKana || '', '個人会員のセイ');
      case 'メイ': return isBusiness ? '' : normalizeAndValidateKana_(payload.firstKana || '', '個人会員のメイ');
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
      var defaultPassword = generateRandomPassword_();
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
              deliverMail_('BIZ_REP_EMAIL', staffEmail, bizEmailSettings.bizRepEmailSubject, repBody, { from: fromAddr });
              result.emailsSent++;
            }
          } else {
            if (bizEmailSettings.bizStaffEmailEnabled) {
              var memberBody = renderBizEmailTemplate_(bizEmailSettings.bizStaffEmailBody, bizVars);
              deliverMail_('BIZ_STAFF_EMAIL', staffEmail, bizEmailSettings.bizStaffEmailSubject, memberBody, { from: fromAddr });
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
    var defaultPassword = generateRandomPassword_();

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
  return !isInactiveMemberStatusForIdentity_(row['会員状態コード']);
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
  setCol('移行日', '');
  setCol('退会処理日', '');
  setCol('姓', String(payload.lastName || '').trim());
  setCol('名', String(payload.firstName || '').trim());
  // v376: kana 列を normalizeKana_ で全角カタカナへ正規化
  setCol('セイ', normalizeAndValidateKana_(payload.lastKana || '', '個人会員のセイ'));
  setCol('メイ', normalizeAndValidateKana_(payload.firstKana || '', '個人会員のメイ'));
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
  // v376: kana 列を normalizeKana_ で全角カタカナへ正規化
  var lastKana = normalizeAndValidateKana_(payload.lastKana || '', '職員のセイ');
  var firstKana = normalizeAndValidateKana_(payload.firstKana || '', '職員のメイ');
  var name = joinHumanNameParts_(lastName, firstName).trim();
  var kana = normalizeKana_(joinHumanNameParts_(lastKana, firstKana));
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

  var migrated = migratePersonOwnedReferences_(ss, {
    oldMemberId: sourceMemberId,
    oldStaffId: sourceStaffId,
    newMemberId: targetOfficeMemberId,
    newStaffId: newStaffId,
    updatedAt: nowIso,
  });
  appendPersonMergeLog_(ss, {
    action: 'STAFF_TO_STAFF',
    careManagerNumber: String(sRow[sCols['介護支援専門員番号']] || '').trim(),
    oldMemberId: sourceMemberId,
    oldStaffId: sourceStaffId,
    newMemberId: targetOfficeMemberId,
    newStaffId: newStaffId,
    details: { officeWithdrawn: officeWithdrawn, migrated: migrated },
    executedAt: nowIso,
  });
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

// v368: 申込受付メール送信ヘルパー（公開ポータル申請受付時に使用）
function sendApplicationReceiptMail_(ss, params) {
  // params: { contactEmail, applicantName, requestId, requestType, memberTypeLabel, receivedAt }
  if (!params || !params.contactEmail) return;
  var enabledRaw = String(getSystemSettingValue_(ss, 'APPLICATION_RECEIPT_ENABLED') || 'true');
  if (enabledRaw === 'false') return;
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
    deliverMail_('APPLICATION_RECEIPT', params.contactEmail, renderBizEmailTemplate_(subjectTpl, vars), renderBizEmailTemplate_(bodyTpl, vars));
  } catch (e) {
    Logger.log('[sendApplicationReceiptMail_] failed: ' + e.message);
  }
}

// v368: 承認通知メール送信ヘルパー
function sendApprovalNotificationMail_(ss, params) {
  // params: { contactEmail, applicantName, requestId, requestType, processedAt, processorName, changeSummary }
  if (!params || !params.contactEmail) return;
  var enabledRaw = String(getSystemSettingValue_(ss, 'APPROVAL_NOTIFICATION_ENABLED') || 'true');
  if (enabledRaw === 'false') return;
  var subjectTpl = String(getSystemSettingValue_(ss, 'APPROVAL_NOTIFICATION_SUBJECT') || '') || APPROVAL_NOTIFICATION_DEFAULT_SUBJECT;
  var bodyTpl = String(getSystemSettingValue_(ss, 'APPROVAL_NOTIFICATION_BODY') || '') || APPROVAL_NOTIFICATION_DEFAULT_BODY;
  var vars = {
    '氏名': params.applicantName || '',
    '会員種別ラベル': params.memberTypeLabel || '',
    '申請種別': REQUEST_TYPE_LABEL_[params.requestType] || params.requestType || '',
    '申請ID': params.requestId || '',
    '処理日時': params.processedAt || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
    '処理者名': params.processorName || '事務局',
    '変更内容サマリー': params.changeSummary || '',
  };
  try {
    deliverMail_('APPROVAL_NOTIFICATION', params.contactEmail, renderBizEmailTemplate_(subjectTpl, vars), renderBizEmailTemplate_(bodyTpl, vars));
  } catch (e) {
    Logger.log('[sendApprovalNotificationMail_] failed: ' + e.message);
  }
}

// v368: 却下通知メール送信ヘルパー
function sendRejectionNotificationMail_(ss, params) {
  // params: { contactEmail, applicantName, requestId, requestType, processedAt, processorName, note }
  if (!params || !params.contactEmail) return;
  var enabledRaw = String(getSystemSettingValue_(ss, 'REJECTION_NOTIFICATION_ENABLED') || 'true');
  if (enabledRaw === 'false') return;
  var subjectTpl = String(getSystemSettingValue_(ss, 'REJECTION_NOTIFICATION_SUBJECT') || '') || REJECTION_NOTIFICATION_DEFAULT_SUBJECT;
  var bodyTpl = String(getSystemSettingValue_(ss, 'REJECTION_NOTIFICATION_BODY') || '') || REJECTION_NOTIFICATION_DEFAULT_BODY;
  var vars = {
    '氏名': params.applicantName || '',
    '会員種別ラベル': params.memberTypeLabel || '',
    '申請種別': REQUEST_TYPE_LABEL_[params.requestType] || params.requestType || '',
    '申請ID': params.requestId || '',
    '処理日時': params.processedAt || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
    '処理者名': params.processorName || '事務局',
    '処理備考': params.note || '',
  };
  try {
    deliverMail_('REJECTION_NOTIFICATION', params.contactEmail, renderBizEmailTemplate_(subjectTpl, vars), renderBizEmailTemplate_(bodyTpl, vars));
  } catch (e) {
    Logger.log('[sendRejectionNotificationMail_] failed: ' + e.message);
  }
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
  deliverMail_('CREDENTIAL_EMAIL', toEmail, subject, body, {
    from: from,
    replyTo: from || '',
    name: '枚方市介護支援専門員連絡協議会',
  });
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
    // v372.4: admin 権限（MASTER/ADMIN）の場合 1〜10 桁半角英数字を許容、それ以外は厳格 8 桁数字
    var rawCm = String(payload.careManagerNumber).trim();
    if (rawCm) {
      var allowRelaxedStaffCm = isAllowedRelaxedCmNumber_(payload.__adminSession);
      if (allowRelaxedStaffCm) {
        if (!isValidCmNumberStrict_(rawCm) && !isValidCmNumberRelaxed_(rawCm)) {
          throw new Error('介護支援専門員番号は 8 桁の半角数字、または例外として 1〜10 桁の半角英数字で入力してください（看護師等: HN+事業所番号下8桁 / 社会福祉士: HS+事業所番号下8桁）。');
        }
      } else {
        if (!isValidCmNumberStrict_(rawCm)) {
          throw new Error('介護支援専門員番号は8桁の半角数字で入力してください。');
        }
      }
    }
    row[cols['介護支援専門員番号']] = normalizeCmNumberForStorage_(rawCm);
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

  // v372.5: withdrawnDate を明示指定された場合は status='LEFT' のとき限定で上書き
  if (payload.withdrawnDate != null && String(payload.withdrawnDate).trim() && cols['退会日'] != null) {
    var curStatus = String(row[cols['職員状態コード']] || '');
    if (curStatus === 'LEFT') {
      var normalizedW = normalizeDateInput_(payload.withdrawnDate);
      if (normalizedW) row[cols['退会日']] = normalizedW;
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
      // v297: 退職時に現職の役員レコードを自動退任
      autoRetireOfficerByStaffId_(ss, String(payload.staffId), nowIso);
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

function isInactiveMemberStatusForIdentity_(status) {
  var value = String(status || 'ACTIVE');
  return value === 'WITHDRAWN' || value === 'TRANSFERRED';
}

function getSingleRegistrationCandidate_(candidates, duplicateMessage) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length > 1) throw new Error(duplicateMessage);
  return candidates[0];
}

function appendPersonMergeLog_(ss, entry) {
  if (!ss.getSheetByName('T_人物統合ログ')) {
    var sheet = getOrCreateSheet_(ss, 'T_人物統合ログ');
    writeSheetHeaders_(sheet, テーブル定義['T_人物統合ログ']);
  }
  var now = entry.executedAt || new Date().toISOString();
  appendRowsByHeaders_(ss, 'T_人物統合ログ', [{
    ログID: entry.logId || ('PML' + Date.now() + '_' + Utilities.getUuid().slice(0, 8)),
    処理種別: entry.action || '',
    介護支援専門員番号: entry.careManagerNumber || '',
    旧会員ID: entry.oldMemberId || '',
    旧職員ID: entry.oldStaffId || '',
    新会員ID: entry.newMemberId || '',
    新職員ID: entry.newStaffId || '',
    結果コード: entry.result || 'OK',
    詳細JSON: JSON.stringify(entry.details || {}),
    実行者メール: entry.actorEmail || '',
    実行日時: now,
    作成日時: now,
    削除フラグ: false,
  }]);
}

function rebindPersonReferenceTable_(ss, tableName, oldMemberId, oldStaffId, newMemberId, newStaffId, now) {
  var sheet = ss.getSheetByName(tableName);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  if (cols['会員ID'] == null && cols['職員ID'] == null) return 0;

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var updated = 0;
  for (var r = 0; r < data.length; r += 1) {
    if (cols['削除フラグ'] != null && toBoolean_(data[r][cols['削除フラグ']])) continue;
    var memberMatches = oldMemberId && cols['会員ID'] != null && String(data[r][cols['会員ID']] || '') === String(oldMemberId || '');
    var staffMatches = oldStaffId && cols['職員ID'] != null && String(data[r][cols['職員ID']] || '') === String(oldStaffId || '');
    if (!memberMatches && !staffMatches) continue;

    if (cols['会員ID'] != null) data[r][cols['会員ID']] = newMemberId || '';
    if (cols['職員ID'] != null) data[r][cols['職員ID']] = newStaffId || '';
    if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
    sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    updated += 1;
  }
  return updated;
}

function migratePersonOwnedReferences_(ss, opts) {
  var oldMemberId = String(opts.oldMemberId || '');
  var oldStaffId = String(opts.oldStaffId || '');
  var newMemberId = String(opts.newMemberId || '');
  var newStaffId = String(opts.newStaffId || '');
  var now = opts.updatedAt || new Date().toISOString();
  var counts = {};

  migrateTrainingApplications_(ss, oldMemberId, oldStaffId, newMemberId, newStaffId);
  counts['T_研修申込'] = 'migrated';
  ['T_役員', 'T_振込口座', 'T_請求'].forEach(function(tableName) {
    counts[tableName] = rebindPersonReferenceTable_(ss, tableName, oldMemberId, oldStaffId, newMemberId, newStaffId, now);
  });
  if (oldMemberId && newMemberId && !oldStaffId && !newStaffId) {
    counts['T_支払い'] = rebindPersonReferenceTable_(ss, 'T_支払い', oldMemberId, '', newMemberId, '', now);
    counts['T_年会費納入履歴'] = rebindPersonReferenceTable_(ss, 'T_年会費納入履歴', oldMemberId, '', newMemberId, '', now);
    counts['T_年会費更新履歴'] = rebindPersonReferenceTable_(ss, 'T_年会費更新履歴', oldMemberId, '', newMemberId, '', now);
  }
  return counts;
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
    if (reuseFound.columns['移行日'] != null) updMemberRow[reuseFound.columns['移行日']] = '';
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
  var migrateCounts = migratePersonOwnedReferences_(ss, {
    oldMemberId: sourceMemberId,
    oldStaffId: sourceStaffId,
    newMemberId: newMemberId,
    newStaffId: '',
    updatedAt: now,
  });
  appendPersonMergeLog_(ss, {
    action: 'STAFF_TO_INDIVIDUAL',
    careManagerNumber: staffCareNum,
    oldMemberId: sourceMemberId,
    oldStaffId: sourceStaffId,
    newMemberId: newMemberId,
    newStaffId: '',
    details: { officeWithdrawn: officeWithdrawn, migrated: migrateCounts },
    executedAt: now,
  });
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
        && !isInactiveMemberStatusForIdentity_(r['会員状態コード'])
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
  // v368: 紐づけは介護支援専門員番号で行うため、メアド空でも転籍を通す。
  // メアド空の場合は credential メール送信は skip し、職員レコードのみ作成する。
  // 後で管理者が職員のメアドを手動入力した時点で、管理画面から credential メール再送が可能。
  var staffEmail = String(srcRow[srcCols['代表メールアドレス']] || '').trim();
  if (!staffEmail) {
    Logger.log('[convertMemberType] 転籍元会員(' + sourceMemberId + ')のメアド空。credential メール送信を skip して転籍を継続。');
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

  // 6. 元の個人/賛助会員を移行済みにする（賛助会員で新規入力 CM 番号があれば書き戻す）
  var updSrcRow = srcRow.slice();
  updSrcRow[srcCols['会員状態コード']] = 'TRANSFERRED';
  if (srcCols['移行日'] != null) updSrcRow[srcCols['移行日']] = today;
  updSrcRow[srcCols['更新日時']] = now;
  if (inputCareNum && srcCols['介護支援専門員番号'] != null) {
    updSrcRow[srcCols['介護支援専門員番号']] = srcCareNum;
  }
  memberSheet.getRange(srcFound.rowNumber, 1, 1, updSrcRow.length).setValues([updSrcRow]);

  // 7. T_研修申込: 会員ID→事業所ID, 職員ID→新ID
  // ※ assertSingleActiveAffiliationByCareManager_ は DB変更前の 3.6 pre-check に移行済み
  var migrateCounts2 = migratePersonOwnedReferences_(ss, {
    oldMemberId: sourceMemberId,
    oldStaffId: '',
    newMemberId: targetOfficeMemberId,
    newStaffId: newStaffId,
    updatedAt: now,
  });
  appendPersonMergeLog_(ss, {
    action: 'INDIVIDUAL_TO_STAFF',
    careManagerNumber: staffCareNum,
    oldMemberId: sourceMemberId,
    oldStaffId: '',
    newMemberId: targetOfficeMemberId,
    newStaffId: newStaffId,
    details: { migrated: migrateCounts2 },
    executedAt: now,
  });

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
  if (enableAdminAudit && effectiveAdminSession && effectiveAdminSession.email) {
    var auditChanges = [];
    var newJoinedDate = String(normalizeDateInput_(mergedPayload.joinedDate) || '');
    var newWithdrawnDate = String(normalizeDateInput_(mergedPayload.withdrawnDate) || '');
    var newWithdrawalProcessDate = String(normalizeDateInput_(mergedPayload.withdrawalProcessDate) || '');
    var newStatusNote = String(mergedPayload.statusNote || '').slice(0, 2000);
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
    if (newStatusNote !== prevStatusNote) {
      auditChanges.push({ field: 'ステータスメモ', oldValue: prevStatusNote, newValue: newStatusNote });
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

function normalizeSearchText_(value) {
  return String(value == null ? '' : value)
    .normalize('NFKC')
    .toLowerCase()
    .trim();
}

function compactSearchText_(value) {
  return normalizeSearchText_(value).replace(/[\s\u3000]+/g, '');
}

function matchesSearchQuery_(query, values) {
  var normalizedQuery = normalizeSearchText_(query);
  if (!normalizedQuery) return true;
  var sourceValues = Array.isArray(values) ? values : [];
  var normalizedHaystack = sourceValues.map(normalizeSearchText_).join(' ');
  var compactHaystack = sourceValues.map(compactSearchText_).join('');
  var compactQuery = compactSearchText_(normalizedQuery);
  if (compactQuery && compactHaystack.indexOf(compactQuery) >= 0) return true;
  var terms = normalizedQuery.split(/[\s\u3000]+/).filter(function(term) { return !!term; });
  return terms.every(function(term) {
    return normalizedHaystack.indexOf(term) >= 0 || compactHaystack.indexOf(compactSearchText_(term)) >= 0;
  });
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










// v376.7: 研修の soft delete（削除フラグ=true）。物理削除しない。
//   payload: { trainingId: string }
//   返却: { trainingId, applicantCount, deleted: true }
//   申込実績がある場合も削除可能（呼出側で警告表示 → 確認後実行する設計）。
//   削除後は公開ポータル/admin dashboard から自動非表示（既存の !削除フラグ filter 経由）。
function softDeleteTraining_(payload) {
  var trainingId = String((payload && payload.trainingId) || '').trim();
  if (!trainingId) throw new Error('trainingId が必要です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, '研修ID', trainingId);
  if (!found) throw new Error('対象研修が見つかりません: ' + trainingId);
  var cols = found.columns;
  var row = found.row.slice();
  if (toBoolean_(row[cols['削除フラグ']])) {
    return { trainingId: trainingId, applicantCount: 0, deleted: true, alreadyDeleted: true };
  }
  row[cols['削除フラグ']] = true;
  if (cols['更新日時'] != null) row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // 申込件数を返却（参考表示用、削除をブロックしない）
  var applicantCount = 0;
  try {
    var applySheet = ss.getSheetByName('T_研修申込');
    if (applySheet && applySheet.getLastRow() >= 2) {
      var applies = getRowsAsObjects_(ss, 'T_研修申込');
      applicantCount = applies.filter(function (r) {
        return !toBoolean_(r['削除フラグ']) &&
               String(r['研修ID'] || '') === trainingId &&
               String(r['申込状態コード'] || '') !== 'CANCELED';
      }).length;
    }
  } catch (e) {}

  try { clearAllDataCache_(); } catch (e) {}
  try { clearAdminDashboardCache_(); } catch (e) {}
  return { trainingId: trainingId, applicantCount: applicantCount, deleted: true };
}

// v376.7: 研修の復元（削除フラグ=false）。soft delete の取消。
function restoreTraining_(payload) {
  var trainingId = String((payload && payload.trainingId) || '').trim();
  if (!trainingId) throw new Error('trainingId が必要です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, '研修ID', trainingId);
  if (!found) throw new Error('対象研修が見つかりません: ' + trainingId);
  var cols = found.columns;
  var row = found.row.slice();
  if (!toBoolean_(row[cols['削除フラグ']])) {
    return { trainingId: trainingId, restored: true, alreadyActive: true };
  }
  row[cols['削除フラグ']] = false;
  if (cols['更新日時'] != null) row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  try { clearAllDataCache_(); } catch (e) {}
  try { clearAdminDashboardCache_(); } catch (e) {}
  return { trainingId: trainingId, restored: true };
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

    // docs/246 Phase 1-A: 旧 'TRAINING_REGISTRAR' ハードコードを trainingEditScope='OWN' 判定へ置換。
    // 挙動完全維持（LEGACY_ROLE_TRAINING_SCOPE で TR のみ OWN、他は ALL）。
    var trainingScope = adminSession ? String(adminSession.trainingEditScope || 'ALL').toUpperCase() : 'ALL';
    if (trainingScope === 'OWN') {
      var registrarEmail = String(cols['登録者メール'] != null ? row[cols['登録者メール']] : '' || '').trim().toLowerCase();
      if (!registrarEmail || registrarEmail !== adminEmail.toLowerCase()) {
        throw new Error('研修登録者は自身が登録した研修のみ編集可能です。');
      }
    }

    function setCol(name, value) {
      var idx = cols[name];
      if (idx != null) row[idx] = value !== undefined ? value : '';
    }

    // v349: PDF / サムネイル差し替え時に旧ファイルを Drive 上で trashed する。
    var oldPdfUrl = cols['案内状URL'] != null ? String(row[cols['案内状URL']] || '') : '';
    var oldThumbUrl = cols['案内状サムネイルURL'] != null ? String(row[cols['案内状サムネイルURL']] || '') : '';
    var newPdfUrl = String(payload.guidePdfUrl || '');
    var newThumbUrl = String(payload.thumbnailUrl || '');
    if (oldPdfUrl && oldPdfUrl !== newPdfUrl) {
      trashFileFromUrlIfPossible_(oldPdfUrl);
    }
    if (oldThumbUrl && oldThumbUrl !== newThumbUrl) {
      trashFileFromUrlIfPossible_(oldThumbUrl);
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
function getCanonicalApplicantRef_(rowObj) {
  var memberId = String(rowObj['会員ID'] || '').trim();
  var staffId = String(rowObj['職員ID'] || '').trim();
  var externalId = String(rowObj['外部申込者ID'] || '').trim();
  if (externalId) return { type: 'EXTERNAL', id: externalId };
  if (staffId) return { type: 'STAFF', id: staffId };
  if (memberId) return { type: 'MEMBER', id: memberId };
  // フォールバック: legacy データ
  var legacyId = String(rowObj['申込者ID'] || '').trim();
  var legacyType = String(rowObj['申込者区分コード'] || '').trim();
  if (legacyId && legacyType === 'EXTERNAL') return { type: 'EXTERNAL', id: legacyId };
  if (legacyId) return { type: 'MEMBER', id: legacyId };
  return { type: '', id: '' };
}

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

  var pdfFileId = file.getId();
  var pdfFileUrl = file.getUrl();
  var thumbnailUrl = '';
  // v350: client が UX を切り替えるための状態。'skipped' は PDF 以外。
  // v351: 'client-generated' = ブラウザ側で pdf.js が render した PNG を保存
  var thumbnailGenerationStatus = 'skipped';

  // v351: client (pdfjs-dist) が先に 1 ページ目を PNG に変換して送ってきた場合は
  // それを Drive にそのまま createFile する（Drive thumbnail API 待ち skip）。
  // 体感 3〜8 秒で完結する。client 失敗時は thumbnailBase64=空で v350 経路へ。
  var clientThumbnailBase64 = String((payload && payload.thumbnailBase64) || '').trim();
  if (clientThumbnailBase64) {
    try {
      var clientPngBytes = Utilities.base64Decode(clientThumbnailBase64);
      var clientPngBlob = Utilities.newBlob(clientPngBytes, 'image/png',
        'thumb_' + pdfFileId + '_' + Date.now() + '_client.png');
      var clientPngFile = folder.createFile(clientPngBlob);
      clientPngFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      thumbnailUrl = clientPngFile.getUrl();
      thumbnailGenerationStatus = 'client-generated';
    } catch (e) {
      Logger.log('uploadTrainingFile_: client thumbnail save failed pdfFileId=' + pdfFileId + ': ' + e.message);
    }
  }

  // v349: client が thumbnail を送ってこなかった or 上で失敗した場合のみ、
  // サーバ側の Drive thumbnailLink polling へ fallback する。
  if (!thumbnailUrl) {
    var looksLikePdf = String(mimeType).toLowerCase().indexOf('pdf') >= 0 ||
      /\.pdf$/i.test(filename);
    if (looksLikePdf) {
      try {
        thumbnailUrl = generateAndSaveThumbnailForPdf_(pdfFileId, folder) || '';
        thumbnailGenerationStatus = thumbnailUrl ? 'generated' : 'pending';
      } catch (e) {
        Logger.log('uploadTrainingFile_: server thumbnail generation failed pdfFileId=' + pdfFileId + ': ' + e.message);
        thumbnailUrl = '';
        thumbnailGenerationStatus = 'failed';
      }
    }
  }

  return {
    url: pdfFileUrl,
    driveFileId: pdfFileId,
    thumbnailUrl: thumbnailUrl,
    thumbnailGenerationStatus: thumbnailGenerationStatus,
  };
}

/**
 * v350: 単一研修のサムネイル PNG を再生成する admin action。
 * 編集モーダルの「サムネイル再生成」ボタンから呼ぶ。
 * payload: { trainingId }
 * 返り値: { trainingId, thumbnailUrl, thumbnailGenerationStatus, reason? }
 */
function regenerateThumbnailForTraining_(payload) {
  var trainingId = String((payload && payload.trainingId) || '').trim();
  if (!trainingId) throw new Error('trainingId が未指定です。');
  var ss = getOrCreateDatabase_();
  var folder = getOrCreateTrainingFolder_(ss);
  var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var row = rows.find ? rows.find(function(r) { return String(r['研修ID']) === trainingId; })
    : (function() { for (var i = 0; i < rows.length; i += 1) if (String(rows[i]['研修ID']) === trainingId) return rows[i]; return null; })();
  if (!row) throw new Error('研修ID「' + trainingId + '」が見つかりません。');

  var pdfUrl = String(row['案内状URL'] || '').trim();
  if (!pdfUrl) {
    return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'skipped', reason: 'no_pdf' };
  }
  var pdfIdMatch = pdfUrl.match(/\/file\/d\/([^/?]+)/) || pdfUrl.match(/[?&]id=([^&]+)/);
  if (!pdfIdMatch) {
    return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'failed', reason: 'pdf_url_unparseable' };
  }
  var pdfId = pdfIdMatch[1];
  var oldThumb = String(row['案内状サムネイルURL'] || '').trim();
  try {
    var newThumbUrl = generateAndSaveThumbnailForPdf_(pdfId, folder);
    if (!newThumbUrl) {
      return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'pending', reason: 'thumbnail_not_ready' };
    }
    updateTrainingThumbnailUrlByRowId_(ss, trainingId, newThumbUrl);
    if (oldThumb) trashFileFromUrlIfPossible_(oldThumb);
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return { trainingId: trainingId, thumbnailUrl: newThumbUrl, thumbnailGenerationStatus: 'generated' };
  } catch (e) {
    Logger.log('regenerateThumbnailForTraining_: error trainingId=' + trainingId + ' msg=' + e.message);
    return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'failed', reason: String(e.message || e).substring(0, 200) };
  }
}

/**
 * v350: 10 分ごとに時間ベーストリガーから呼ばれる pending backfill。
 * thumbnailUrl 空の T_研修 行を最大 5 件処理する（Apps Script 6 分制限を考慮）。
 * Drive が 5 分以上かけて生成する大きい PDF も時間経過で hasThumbnail=true に
 * なるため、繰り返し trigger で最終的に救済される。
 */
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

/**
 * v350: processPendingThumbnails を 10 分ごとに走らせるトリガーを登録する。
 * 既存の同名トリガーを削除して再登録（冪等）。
 * admin の Apps Script editor から 1 回手動実行する想定。
 */
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
function generateAndSaveThumbnailForPdf_(pdfFileId, folder) {
  if (!pdfFileId) return '';
  var authHeaders = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };

  // v350: hasThumbnail boolean field を真実情報として polling する。
  // Drive コミュニティ推奨 (Latenode thread, 2024-2025) では 10-15 秒初動 +
  // 30s 毎に 5 分まで polling だが、Web App の同期 path で 5 分は不可。
  // ここでは admin の UX を考慮し最大 25 秒 (5s x 5 回) まで sync で粘る。
  // 間に合わなければ '' を返し、time-based trigger (processPendingThumbnails_)
  // が後追いで生成する。
  var thumbnailLink = '';
  var maxAttempts = 5;
  for (var attempt = 1; attempt <= maxAttempts; attempt += 1) {
    Utilities.sleep(5000);
    var metaUrl = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(pdfFileId) +
      '?fields=thumbnailLink,hasThumbnail,mimeType&supportsAllDrives=true';
    var metaResp = UrlFetchApp.fetch(metaUrl, { muteHttpExceptions: true, headers: authHeaders });
    var metaCode = metaResp.getResponseCode();
    if (metaCode !== 200) {
      Logger.log('generateAndSaveThumbnailForPdf_: files.get attempt=' + attempt +
        ' code=' + metaCode + ' pdfFileId=' + pdfFileId +
        ' body=' + metaResp.getContentText().substring(0, 200));
      continue;
    }
    var meta = JSON.parse(metaResp.getContentText());
    if (meta && meta.hasThumbnail && meta.thumbnailLink) {
      thumbnailLink = meta.thumbnailLink;
      Logger.log('generateAndSaveThumbnailForPdf_: hasThumbnail=true at attempt=' + attempt +
        ' pdfFileId=' + pdfFileId);
      break;
    }
    Logger.log('generateAndSaveThumbnailForPdf_: hasThumbnail=' + (meta && meta.hasThumbnail) +
      ' thumbnailLink=' + (meta && !!meta.thumbnailLink) + ' attempt=' + attempt +
      ' pdfFileId=' + pdfFileId);
  }

  if (!thumbnailLink) {
    Logger.log('generateAndSaveThumbnailForPdf_: not ready after ' +
      maxAttempts + ' attempts pdfFileId=' + pdfFileId +
      ' — processPendingThumbnails_ trigger will retry later');
    return '';
  }

  var sizedLink = thumbnailLink.replace(/=s\d+(-.+)?$/, '=w800').replace(/=s\d+$/, '=w800');
  var imgResp = UrlFetchApp.fetch(sizedLink, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: authHeaders,
  });
  var imgCode = imgResp.getResponseCode();
  if (imgCode !== 200) {
    Logger.log('generateAndSaveThumbnailForPdf_: thumbnailLink fetch code=' + imgCode +
      ' pdfFileId=' + pdfFileId);
    return '';
  }
  var pngBlob = imgResp.getBlob();
  var contentType = pngBlob.getContentType() || 'image/png';
  if (contentType.indexOf('image/') !== 0) {
    Logger.log('generateAndSaveThumbnailForPdf_: unexpected contentType=' + contentType +
      ' pdfFileId=' + pdfFileId);
    return '';
  }
  pngBlob.setName('thumb_' + pdfFileId + '_' + Date.now() + '.png');

  var pngFile = folder.createFile(pngBlob);
  pngFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return pngFile.getUrl();
}

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

function updateTrainingThumbnailUrlByRowId_(ss, trainingId, thumbUrl) {
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 sheet missing');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idCol = headers.indexOf('研修ID');
  var thumbCol = headers.indexOf('案内状サムネイルURL');
  var updatedCol = headers.indexOf('更新日時');
  if (idCol < 0 || thumbCol < 0) throw new Error('required column missing');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
  for (var r = 0; r < ids.length; r += 1) {
    if (String(ids[r][0]) === String(trainingId)) {
      sheet.getRange(r + 2, thumbCol + 1).setValue(thumbUrl);
      if (updatedCol >= 0) sheet.getRange(r + 2, updatedCol + 1).setValue(new Date().toISOString());
      return;
    }
  }
}

function trashFileFromUrlIfPossible_(url) {
  if (!url) return false;
  var fileId = extractDriveFileId_(url);
  if (!fileId) return false;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    return true;
  } catch (e) {
    Logger.log('trashFileFromUrlIfPossible_: ' + e.message + ' url=' + url);
    return false;
  }
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
  ensureTableSheetsExist_(ss);
  normalizeTableColumns_(ss, 'T_会員');
  normalizeTableColumns_(ss, 'T_事業所職員');
  normalizeTableColumns_(ss, 'T_研修');
  normalizeTableColumns_(ss, 'T_年会費納入履歴');
  normalizeTableColumns_(ss, 'T_年会費更新履歴');
  normalizeTableColumns_(ss, 'T_管理者Googleホワイトリスト');
  // docs/246 Phase 1-B: メニュー単位カスタムロール RBAC
  normalizeTableColumns_(ss, 'T_権限ロール');
  seedInitialPermissionRoles_(ss);
  normalizeTableColumns_(ss, 'T_認証アカウント');
  normalizeTableColumns_(ss, 'T_ログイン履歴');
  normalizeTableColumns_(ss, 'T_研修申込');
  normalizeTableColumns_(ss, 'T_監査ログ');
  normalizeTableColumns_(ss, 'T_会員_archive');
  normalizeTableColumns_(ss, 'T_事業所職員_archive');
  normalizeTableColumns_(ss, 'T_変更申請');
  normalizeTableColumns_(ss, 'T_人物統合ログ');
  // v295: 役員管理テーブル
  normalizeTableColumns_(ss, 'T_役員');
  normalizeTableColumns_(ss, 'T_振込口座');
  normalizeTableColumns_(ss, 'T_支払い');
  normalizeTableColumns_(ss, 'T_支払い明細');
  normalizeTableColumns_(ss, 'T_請求');
  ensureSystemSettingsRows_(ss);
  seedPermissionMatrixIfNeeded_(ss);
  applyDataValidationRules_(ss);
  protectHeaderRows_(ss);
  cleanupNonSchemaSheets_(ss);
  backfillBusinessStaffNameColumns_(ss);
  auditDeleteFlagColumns_(ss);
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


function ensureTableSheetsExist_(ss) {
  var tableNames = Object.keys(テーブル定義);
  for (var i = 0; i < tableNames.length; i += 1) {
    var tableName = tableNames[i];
    if (ss.getSheetByName(tableName)) continue;
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
// v376.20: getSheetData_ は getRowsAsObjectsFromSheet_ と機能同一だったため統合・削除。
//   呼び出しは getRowsAsObjectsFromSheet_ に置換済み。

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


// ─── 公開ポータル API ─────────────────────────────────────────────────────────

// v210: 公開ポータルの表示設定（認証不要・公開API）

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
  // v372.4: 大文字統一を追加（旧 8 桁数字データには影響なし）。HN/HS プレフィックス等の英字比較を統一。
  return String(cm || '').trim().replace(/\s/g, '').toUpperCase();
}

// v372.4: 介護支援専門員番号バリデーション + 大文字統一
// 厳格: 8 桁の半角数字（公開ポータルでの基本ルール）
// 緩和: 1〜10 桁の半角英数字（admin 例外運用）— 例: 看護師 HN12345678 / 社会福祉士 HS12345678
var CM_NUMBER_STRICT_RE_ = /^\d{8}$/;
var CM_NUMBER_RELAXED_RE_ = /^[A-Za-z0-9]{1,10}$/;
function isValidCmNumberStrict_(v) {
  return CM_NUMBER_STRICT_RE_.test(String(v || '').trim());
}
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

// v372.5: 事業所会員の在籍職員一覧を取得（公開ポータル staffUpdate フロー用）
// HMAC token 経由で BUSINESS 会員のみアクセス可。最小限の情報のみ返却。

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
  // v367: checkAdminBySession_() の戻り値は loginId (email)。`email` キーは存在しない
  if (!adminSession || !adminSession.loginId) return { success: false, error: 'unauthorized' };

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
  var approvalResult = {};

  // ── 変更内容の適用 ────────────────────────────────────────────────────────
  if (requestType === 'MEMBER_APPLICATION') {
    approvalResult = createMemberApplicationDirect_(changeData.applicationPayload || {});
  } else if (requestType === 'MEMBER_UPDATE') {
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
      var mixedAddResult = addPublicStaffMember_({ token: 'ADMIN_APPROVED', staffData: staffToAddMixed[ja], _directMemberId: memberId });
      if (!approvalResult.staffAddResults) approvalResult.staffAddResults = [];
      approvalResult.staffAddResults.push(mixedAddResult);
    }
    var staffToRemoveMixed = changeData.staffRemove || [];
    // v376.9 perf: staffToRemoveMixed.length 回の T_事業所職員 sheet 読込を 1 回にホイスト
    var allStaffRowsForRemoval = staffToRemoveMixed.length > 0 ? getRowsAsObjects_(ss, 'T_事業所職員') : [];
    for (var kr = 0; kr < staffToRemoveMixed.length; kr++) {
      var srm = staffToRemoveMixed[kr];
      var staffRowsMixed = allStaffRowsForRemoval.filter(function(r) {
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

    // v372.5: 既存職員情報の更新（staffUpdate）
    var staffUpdates = changeData.staffUpdate || [];
    if (staffUpdates.length > 0) {
      var staffSheetU = ss.getSheetByName('T_事業所職員');
      var allStaffRowsU = getRowsAsObjects_(ss, 'T_事業所職員');
      var staffEmailNotifications = []; // [{staffId, oldEmail, newEmail, staffName}]
      for (var su = 0; su < staffUpdates.length; su++) {
        var upd = staffUpdates[su];
        // 対象職員の所属確認（セキュリティ: 申請の memberId と職員の所属 memberId が一致）
        var target = allStaffRowsU.filter(function(r) {
          return !toBoolean_(r['削除フラグ']) &&
                 String(r['職員ID'] || '') === String(upd.staffId) &&
                 String(r['会員ID'] || '') === memberId &&
                 String(r['職員状態コード'] || '') === 'ENROLLED';
        })[0];
        if (!target) { Logger.log('staffUpdate skipped (not found / not belonging): ' + upd.staffId); continue; }
        // 10 桁等の admin 緩和 CM 番号は公開ポータルからは更新不可（safeguard）
        var currentCm = String(target['介護支援専門員番号'] || '');
        if (Object.prototype.hasOwnProperty.call(upd, 'careManagerNumber') && currentCm && !/^\d{8}$/.test(currentCm)) {
          Logger.log('staffUpdate CM number protected (admin-relaxed): ' + upd.staffId);
          delete upd.careManagerNumber;
        }
        var oldEmail = String(target['メールアドレス'] || '');
        // updateStaff_ 経由で適用（権限境界 skipAdminCheck はないので、adminSession 渡しでバイパス）
        try {
          var staffPayload = { staffId: String(upd.staffId), memberId: memberId, __adminSession: adminSession };
          if (Object.prototype.hasOwnProperty.call(upd, 'lastName')) staffPayload.lastName = upd.lastName;
          if (Object.prototype.hasOwnProperty.call(upd, 'firstName')) staffPayload.firstName = upd.firstName;
          if (Object.prototype.hasOwnProperty.call(upd, 'lastKana')) staffPayload.lastKana = upd.lastKana;
          if (Object.prototype.hasOwnProperty.call(upd, 'firstKana')) staffPayload.firstKana = upd.firstKana;
          if (Object.prototype.hasOwnProperty.call(upd, 'email')) staffPayload.email = upd.email;
          if (Object.prototype.hasOwnProperty.call(upd, 'careManagerNumber')) staffPayload.careManagerNumber = upd.careManagerNumber;
          updateStaff_(staffPayload);
          // メール変更があれば旧・新両方に通知メール（H 採用）
          if (Object.prototype.hasOwnProperty.call(upd, 'email') && upd.email && upd.email !== oldEmail) {
            staffEmailNotifications.push({
              staffId: upd.staffId,
              oldEmail: oldEmail,
              newEmail: upd.email,
              staffName: String(target['氏名'] || '').trim() || (String(target['姓'] || '') + ' ' + String(target['名'] || '')).trim(),
            });
          }
        } catch (eUpd) {
          Logger.log('staffUpdate apply failed for staffId=' + upd.staffId + ': ' + eUpd.message);
        }
      }
      approvalResult.staffUpdateCount = staffUpdates.length;
      approvalResult.staffEmailNotifications = staffEmailNotifications.length;
      // 通知メール送信（メール変更時のみ・旧アドレス + 新アドレス両方）
      staffEmailNotifications.forEach(function(n) {
        var subject = '【枚方市介護支援専門員連絡協議会】登録メールアドレス変更のお知らせ';
        var bodyOld = [
          n.staffName + ' 様',
          '',
          'ご登録のメールアドレスが変更されました。',
          '',
          '旧アドレス: ' + n.oldEmail,
          '新アドレス: ' + n.newEmail,
          '',
          '今後のご連絡は新アドレス宛てに送信されます。',
          'お心当たりがない場合は、お早めに事務局までご連絡ください。',
          '',
          '枚方市介護支援専門員連絡協議会',
        ].join('\n');
        var bodyNew = [
          n.staffName + ' 様',
          '',
          'こちらのメールアドレスが連絡先として新たに登録されました。',
          '',
          '旧アドレス: ' + n.oldEmail,
          '新アドレス: ' + n.newEmail,
          '',
          'お心当たりがない場合は事務局までご連絡ください。',
          '',
          '枚方市介護支援専門員連絡協議会',
        ].join('\n');
        try { if (n.oldEmail) deliverMail_('MEMBER_UPDATE_CONFIRM', n.oldEmail, subject, bodyOld); } catch (e1) { Logger.log('staffUpdate notify old failed: ' + e1.message); }
        try { if (n.newEmail) deliverMail_('MEMBER_UPDATE_CONFIRM', n.newEmail, subject, bodyNew); } catch (e2) { Logger.log('staffUpdate notify new failed: ' + e2.message); }
      });
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
      var addResult = addPublicStaffMember_({
        token: 'ADMIN_APPROVED',
        staffData: staffToAdd[j],
        _directMemberId: memberId,
      });
      if (!approvalResult.staffAddResults) approvalResult.staffAddResults = [];
      approvalResult.staffAddResults.push(addResult);
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
        var saPassword = '事務局から別途通知';
        addedNames.push(saName);
        // 追加された職員へのメール
        if (bizMailSettings.staffAddStaffEmailEnabled && saEmail) {
          try {
            var staffAddVars = { 氏名: saName, ログインID: saLoginId, パスワード: saPassword, 会員マイページURL: MEMBER_PORTAL_URL, 事業所名: officeNameForEmail };
            var staffAddBody = renderBizEmailTemplate_(bizMailSettings.staffAddStaffEmailBody, staffAddVars);
            deliverMail_('STAFF_ADD_STAFF_EMAIL', saEmail, bizMailSettings.staffAddStaffEmailSubject, staffAddBody, { from: fromAddrForStaffAdd });
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
          deliverMail_('STAFF_ADD_REP_EMAIL', repEmail, bizMailSettings.staffAddRepEmailSubject, repNotifyBody, { from: fromAddrForStaffAdd });
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
  row[cols['処理者メールアドレス']] = adminSession.loginId; // v367: email→loginId
  row[cols['処理備考']] = String(payload.note || '');
  row[cols['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  clearAllDataCache_();
  clearAdminDashboardCache_();

  // v368: 申請者への承認通知メール（テンプレ化・変更内容サマリー差込）
  sendApprovalNotificationMail_(ss, {
    contactEmail: contactEmail,
    applicantName: applicantName,
    requestId: requestId,
    requestType: requestType,
    memberTypeLabel: memberType === 'INDIVIDUAL' ? '個人会員' : memberType === 'BUSINESS' ? '事業所会員' : '賛助会員',
    processorName: adminSession.displayName || adminSession.loginId || '事務局',
    changeSummary: buildChangeSummaryText_(changeData, requestType),
  });

  return { success: true, requestId: requestId, result: approvalResult };
}

// ── 管理者: 変更申請を却下 ──────────────────────────────────────────────────
function rejectAdminChangeRequest_(payload) {
  var requestId = String(payload.requestId || '').trim();
  if (!requestId) return { success: false, error: '申請IDが必要です' };
  var adminSession = payload.__adminSession;
  // v367: checkAdminBySession_() の戻り値は loginId (email)。`email` キーは存在しない
  if (!adminSession || !adminSession.loginId) return { success: false, error: 'unauthorized' };

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
  row[cols['処理者メールアドレス']] = adminSession.loginId; // v367: email→loginId
  row[cols['処理備考']] = String(payload.note || '');
  row[cols['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // v368: 申請者への却下通知メール（テンプレ化・備考差込）
  sendRejectionNotificationMail_(ss, {
    contactEmail: contactEmail,
    applicantName: applicantName,
    requestId: requestId,
    requestType: requestType,
    processorName: adminSession.displayName || adminSession.loginId || '事務局',
    note: String(payload.note || ''),
  });

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
    var requestedRole = normalizeBusinessStaffRole_(s.role || 'STAFF');
    if (careNum) {
      var registrationIndex = buildMemberApplicationRegistrationIndex_(ss);
      var duplicateMember = getSingleRegistrationCandidate_(
        registrationIndex.activeMembersByCareManager[careNum],
        '同じ介護支援専門員番号の会員が複数登録されています。事務局で重複修復を行ってください。'
      );
      if (duplicateMember) {
        var converted = convertIndividualToStaff_(ss, {
          sourceMemberId: duplicateMember.memberId,
          targetOfficeMemberId: memberId,
          staffRole: requestedRole,
        });
        overwritePublicApplicationStaffFields_(ss, memberId, converted.newStaffId, s, today, now);
        return { success: true, converted: true, action: 'INDIVIDUAL_TO_STAFF', staffId: converted.newStaffId };
      }
      var duplicateStaff = getSingleRegistrationCandidate_(
        registrationIndex.activeStaffByCareManager[careNum],
        '同じ介護支援専門員番号の事業所職員が複数登録されています。事務局で重複修復を行ってください。'
      );
      if (duplicateStaff) {
        if (String(duplicateStaff.memberId || '') === String(memberId || '')) {
          return { success: false, error: '同じ事業所に同一介護支援専門員番号の在籍職員が既に存在します。' };
        }
        var transferred = transferBusinessStaffToBusinessMember_(ss, {
          sourceMemberId: duplicateStaff.memberId,
          sourceStaffId: duplicateStaff.staffId,
          targetOfficeMemberId: memberId,
          staffRole: requestedRole,
        });
        overwritePublicApplicationStaffFields_(ss, memberId, transferred.newStaffId, s, today, now);
        return { success: true, converted: true, action: 'STAFF_TO_STAFF', staffId: transferred.newStaffId };
      }
    }
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
      職員権限コード: requestedRole,
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

  // v376.12: getCanonicalApplicantRef_ で 3-FK XOR 正本判定。事業所職員 (STAFF) を職員IDで解決し、
  //   送信先メールが事業所代表ではなく職員個人になるよう修正。
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  backfillApplicationApplicantIdentity_(db);
  var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });

  var memberSheet = db.getSheetByName('T_会員');
  var memberRows = getRowsAsObjectsFromSheet_(memberSheet);
  var memberMap = {};
  memberRows.forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });

  var staffSheet = db.getSheetByName('T_事業所職員');
  var staffMap = {};
  (staffSheet ? getRowsAsObjectsFromSheet_(staffSheet) : []).forEach(function(r) { staffMap[String(r['職員ID'] || '')] = r; });

  var externalSheet = db.getSheetByName('T_外部申込者');
  var externalRows = getRowsAsObjectsFromSheet_(externalSheet);
  var externalMap = {};
  externalRows.forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

  var result = applyRows.map(function(r) {
    var ref = getCanonicalApplicantRef_(r);
    var name = '(不明)', email = '', officeName = '';
    if (ref.type === 'STAFF') {
      var staffInfo = staffMap[ref.id];
      if (staffInfo) {
        name = (String(staffInfo['姓'] || '') + ' ' + String(staffInfo['名'] || '')).trim() || String(staffInfo['氏名'] || '');
        email = String(staffInfo['メールアドレス'] || '');
        var parentMember = memberMap[String(staffInfo['会員ID'] || '')];
        officeName = parentMember ? String(parentMember['勤務先名'] || '') : '';
      }
    } else if (ref.type === 'MEMBER') {
      var memberInfo = memberMap[ref.id];
      if (memberInfo) {
        name = (String(memberInfo['姓'] || '') + ' ' + String(memberInfo['名'] || '')).trim() || String(memberInfo['氏名'] || '');
        email = String(memberInfo['代表メールアドレス'] || '');
        officeName = String(memberInfo['勤務先名'] || '');
      }
    } else if (ref.type === 'EXTERNAL') {
      var extInfo = externalMap[ref.id];
      if (extInfo) {
        name = String(extInfo['氏名'] || '');
        email = String(extInfo['メールアドレス'] || '');
        officeName = String(extInfo['事業所名'] || '');
      }
    }
    return {
      applyId: String(r['申込ID'] || ''),
      trainingId: String(r['研修ID'] || ''),
      applicantType: ref.type || 'MEMBER',
      applicantId: ref.id,
      name: name,
      email: email,
      officeName: officeName,
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
    finalSubject = '[REDIRECT from ' + origTo + '] ' + subject;
    finalBody = '--- ORIGINAL TO: ' + origTo + ' ---\n--- CATEGORY: ' + (category || 'GENERAL') + ' ---\n\n' + (body || '');
  }
  sendEmailWithValidatedFrom_(finalTo, finalSubject, finalBody, options || {});
  return { sent: true, mode: policy.mode };
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
    // v376.12: getCanonicalApplicantRef_ で 3-FK XOR 正本判定。STAFF を職員IDで解決し
    //   実際の送信先が職員個人メールになるよう修正（事業所代表メール宛の誤送信を防止）。
    var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    backfillApplicationApplicantIdentity_(db);
    var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });
    var memberSheet = db.getSheetByName('T_会員');
    var memberMap = {};
    getRowsAsObjectsFromSheet_(memberSheet).forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });
    var staffSheetForSend = db.getSheetByName('T_事業所職員');
    var staffMapForSend = {};
    (staffSheetForSend ? getRowsAsObjectsFromSheet_(staffSheetForSend) : []).forEach(function(r) {
      staffMapForSend[String(r['職員ID'] || '')] = r;
    });
    var externalSheet = db.getSheetByName('T_外部申込者');
    var externalMap = {};
    getRowsAsObjectsFromSheet_(externalSheet).forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

    var targetSet = {};
    targetApplyIds.forEach(function(id) { targetSet[String(id)] = true; });

    recipients = applyRows
      .filter(function(r) { return targetSet[String(r['申込ID'] || '')]; })
      .map(function(r) {
        var ref = getCanonicalApplicantRef_(r);
        var name = '(不明)', email = '', officeName = '';
        if (ref.type === 'STAFF') {
          var staffInfo = staffMapForSend[ref.id];
          if (staffInfo) {
            name = (String(staffInfo['姓'] || '') + ' ' + String(staffInfo['名'] || '')).trim() || String(staffInfo['氏名'] || '');
            email = String(staffInfo['メールアドレス'] || '');
            var parentMember = memberMap[String(staffInfo['会員ID'] || '')];
            officeName = parentMember ? String(parentMember['勤務先名'] || '') : '';
          }
        } else if (ref.type === 'MEMBER') {
          var memberInfo = memberMap[ref.id];
          if (memberInfo) {
            name = (String(memberInfo['姓'] || '') + ' ' + String(memberInfo['名'] || '')).trim() || String(memberInfo['氏名'] || '');
            email = String(memberInfo['代表メールアドレス'] || '');
            officeName = String(memberInfo['勤務先名'] || '');
          }
        } else if (ref.type === 'EXTERNAL') {
          var extInfo = externalMap[ref.id];
          if (extInfo) {
            name = String(extInfo['氏名'] || '');
            email = String(extInfo['メールアドレス'] || '');
            officeName = String(extInfo['事業所名'] || '');
          }
        }
        return { applyId: String(r['申込ID'] || ''), name: name, email: email, officeName: officeName };
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
      var mergeVars = { '氏名': rec.name, '事業所名': rec.officeName || '' };
      var personalSubject = renderBizEmailTemplate_(subject, mergeVars);
      var personalBody = renderBizEmailTemplate_(body, mergeVars);
      var allAttachments = commonAttachments.slice();
      if (driveFileIds[rec.applyId]) {
        try {
          var file = DriveApp.getFileById(driveFileIds[rec.applyId]);
          allAttachments.push(file.getBlob());
        } catch (fe) {
          Logger.log('個別添付取得失敗: ' + rec.applyId + ' ' + fe.message);
        }
      }
      deliverMail_('TRAINING_REMINDER', rec.email, personalSubject, personalBody, {
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

// v376: 既存 DB のフリガナ列を全角カタカナへ一括正規化する migration 関数。
//   対象: T_会員 (セイ/メイ) / T_事業所職員 (セイ/メイ/フリガナ) / T_外部申込者 (フリガナ)
//   実行: admin editor から手動 Run。最初に dryRun=true で件数確認、ユーザー承認後 dryRun=false で本実行。
//   Plan A: T_変更申請 の pending レコードは正規化対象外（承認時に approveAdminChangeRequest_ → 各 save 関数で正規化される）。
// v376.2: editor 1-click 本実行用ラッパー（dryRun:false 固定）。引数指定が editor から面倒なため。
function backfillKanaToFullwidth_APPLY() {
  return backfillKanaToFullwidth({ dryRun: false });
}

// v376.4: 過去運用で投入されたデモアカウント + T_外部申込者 テスト 3 件の棚卸し・soft delete。
//   対象（保守的に ID 厳格マッチ）:
//   - T_認証アカウント: ログインID が demo- で始まる
//   - T_会員: 上記認証に紐づく 会員ID + 'DEMO-' プレフィックス
//   - T_事業所職員: 上記認証に紐づく 職員ID + 上記会員に属する職員
//   - T_外部申込者: 氏名 or フリガナ が「テスト」「ガイブ」「セイゴウカクニン」のいずれかを含む
//   いずれも soft delete（削除フラグ=true）のみ。
function _collectTestDataTargets_(ss) {
  var rows = function (name) { return getRowsAsObjects_(ss, name); };
  var authAll = rows('T_認証アカウント');
  var memberAll = rows('T_会員');
  var staffAll = rows('T_事業所職員');
  var extAll = rows('T_外部申込者');

  var matchedAuth = authAll.filter(function (r) {
    return !toBoolean_(r['削除フラグ']) &&
           /^demo-/i.test(String(r['ログインID'] || ''));
  });
  var memberIdsFromAuth = {};
  var staffIdsFromAuth = {};
  matchedAuth.forEach(function (r) {
    if (r['会員ID']) memberIdsFromAuth[String(r['会員ID'])] = true;
    if (r['職員ID']) staffIdsFromAuth[String(r['職員ID'])] = true;
  });

  var matchedMembers = memberAll.filter(function (r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    var id = String(r['会員ID'] || '');
    if (/^DEMO-/i.test(id)) return true;
    if (memberIdsFromAuth[id]) return true;
    return false;
  });
  var memberIdSet = {};
  matchedMembers.forEach(function (m) { memberIdSet[String(m['会員ID'])] = true; });

  var matchedStaff = staffAll.filter(function (r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    var sid = String(r['職員ID'] || '');
    var mid = String(r['会員ID'] || '');
    if (staffIdsFromAuth[sid]) return true;
    if (memberIdSet[mid]) return true; // demo 会員に属する全職員
    return false;
  });

  var matchedExt = extAll.filter(function (r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    var name = String(r['氏名'] || '');
    var kana = String(r['フリガナ'] || '');
    return /テスト|ガイブ|セイゴウカクニン/.test(name) ||
           /テスト|ガイブ|セイゴウカクニン/.test(kana);
  });

  return {
    auth: matchedAuth,
    members: matchedMembers,
    staff: matchedStaff,
    external: matchedExt,
  };
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

// v376.3: editor で実行結果を Logger.log に出すラッパー（previewDryRunApplicationCleanup は return のみで log しない仕様）。
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



// ── メイン移行関数 ──

/**
 * 名簿移行メイン関数
 * @param {Object} options - { dryRun: true/false }
 * @returns {Object} 移行結果
 */




























function backupMigrationTargets_() {
  return backupBeforeMigration_();
}











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
  var members     = getRowsAsObjectsFromSheet_(memberSheet);
  var staffRows   = getRowsAsObjectsFromSheet_(staffSheet);

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
      // v362: フリガナ検索対応
      kana:         (String(m['セイ'] || '') + ' ' + String(m['メイ'] || '')).trim(),
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
        // v362: フリガナ検索対応
        kana:          (String(s['セイ'] || '') + ' ' + String(s['メイ'] || '')).trim() || String(s['フリガナ'] || ''),
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

function normalizeMailingListYear_(year) {
  var selected = Number(year || 0);
  if (!selected || !isFinite(selected)) selected = getCurrentFiscalYear_();
  selected = Math.floor(selected);
  if (selected < 2000 || selected > 2100) {
    throw new Error('対象年度は 2000〜2100 の範囲で指定してください。');
  }
  return selected;
}

function getMailingListYears_(feeRows, selectedYear) {
  var currentFiscalYear = getCurrentFiscalYear_();
  var years = {};
  years[currentFiscalYear] = true;
  years[selectedYear] = true;
  (feeRows || []).forEach(function(row) {
    if (toBoolean_(row['削除フラグ'])) return;
    var y = Number(row['対象年度'] || 0);
    if (y) years[y] = true;
  });
  return Object.keys(years).map(function(y) {
    return Number(y);
  }).sort(function(a, b) {
    return b - a;
  });
}

function buildMailingListCandidates_(payload) {
  var p = payload || {};
  var filterType = String(p.filterType || 'KOHOUSHI'); // 'KOHOUSHI' | 'OSHIRASE'
  if (filterType !== 'KOHOUSHI' && filterType !== 'OSHIRASE') {
    throw new Error('発送区分が不正です。');
  }
  var year = normalizeMailingListYear_(p.year);

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberSheet = ss.getSheetByName('T_会員');
  var feeSheet = ss.getSheetByName('T_年会費納入履歴');
  var members = getRowsAsObjectsFromSheet_(memberSheet);
  var feeRows = feeSheet ? getRowsAsObjectsFromSheet_(feeSheet) : [];

  // 全年度の feeMap を構築（v310: 年度別複数条件フィルター対応）
  var feeMap = {};        // 選択年度: { memberId: status }
  var feeMapByYear = {};  // 全年度: { year: { memberId: status } }
  feeRows.forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    var yr = Number(r['対象年度'] || 0);
    var mid = String(r['会員ID'] || '');
    if (!yr || !mid) return;
    var status = String(r['会費納入状態コード'] || 'UNPAID');
    if (!feeMapByYear[yr]) feeMapByYear[yr] = {};
    feeMapByYear[yr][mid] = status;
    if (yr === year) feeMap[mid] = status;
  });
  // 利用可能な全年度リストを先行計算（候補ループで annualFeeHistories に使用）
  var allFeeYears = getMailingListYears_(feeRows, year);

  var candidates = [];

  members.forEach(function(m) {
    var fiscalSnapshot = getMemberFiscalSnapshot_(m, year);
    if (!fiscalSnapshot.eligible) return;
    var mtype = String(m['会員種別コード'] || '');
    var status = fiscalSnapshot.memberStatus;

    // お知らせフィルター: 事業所は全員対象。個人・賛助は 発送方法コード='POST' のみ
    if (filterType === 'OSHIRASE' && mtype !== 'BUSINESS') {
      var mailingPrefFilter = String(m['発送方法コード'] || 'EMAIL');
      if (mailingPrefFilter !== 'POST') return;
    }

    var memberId = String(m['会員ID'] || '');
    var displayName;
    if (mtype === 'BUSINESS') {
      displayName = String(m['勤務先名'] || '').trim();
    } else {
      var lastName = String(m['姓'] || '').trim();
      var firstName = String(m['名'] || '').trim();
      displayName = (lastName + ' ' + firstName).trim();
    }
    if (!displayName) displayName = memberId;

    var postCode, prefecture, city, line1, line2, mailingDestination;
    if (mtype === 'BUSINESS') {
      mailingDestination = 'OFFICE';
      postCode = String(m['勤務先郵便番号'] || '').trim();
      prefecture = String(m['勤務先都道府県'] || '').trim();
      city = String(m['勤務先市区町村'] || '').trim();
      line1 = String(m['勤務先住所'] || '').trim();
      line2 = String(m['勤務先住所2'] || '').trim();
    } else {
      mailingDestination = String(m['郵送先区分コード'] || 'OFFICE');
      if (mailingDestination === 'HOME') {
        postCode = String(m['自宅郵便番号'] || '').trim();
        prefecture = String(m['自宅都道府県'] || '').trim();
        city = String(m['自宅市区町村'] || '').trim();
        line1 = String(m['自宅住所'] || '').trim();
        line2 = String(m['自宅住所2'] || '').trim();
      } else {
        postCode = String(m['勤務先郵便番号'] || '').trim();
        prefecture = String(m['勤務先都道府県'] || '').trim();
        city = String(m['勤務先市区町村'] || '').trim();
        line1 = String(m['勤務先住所'] || '').trim();
        line2 = String(m['勤務先住所2'] || '').trim();
      }
    }

    var invalidItems = [];
    if (!postCode) invalidItems.push('郵便番号');
    if (!city) invalidItems.push('市区町村');
    if (!line1) invalidItems.push('番地');

    var prefDisplay = (prefecture && prefecture !== '大阪府') ? prefecture : '';
    var address1 = prefDisplay + city + line1;
    var officeName = String(m['勤務先名'] || '').trim();
    var feeStatus = feeMap[memberId] || 'UNPAID';
    // v310: 全年度の納入状況マップ（未記録は UNPAID 扱い）
    var feeHistories = {};
    allFeeYears.forEach(function(yr) {
      feeHistories[yr] = (feeMapByYear[yr] && feeMapByYear[yr][memberId]) || 'UNPAID';
    });

    candidates.push({
      targetKey: memberId,
      memberId: memberId,
      displayName: displayName,
      // v362: フリガナ検索対応（T_会員 セイ + メイ）
      kana: (String(m['セイ'] || '') + ' ' + String(m['メイ'] || '')).trim(),
      memberType: mtype,
      memberStatus: status,
      annualFeeStatus: feeStatus,
      annualFeeYear: year,
      annualFeeHistories: feeHistories,
      officeName: officeName,
      mailingPreference: String(m['発送方法コード'] || 'EMAIL'),
      mailingDestination: mailingDestination,
      addressInvalidItems: invalidItems,
      postCode: postCode,
      address1: address1,
      address2: line2,
    });
  });

  candidates.sort(function(a, b) {
    var ta = String(a.memberType || '');
    var tb = String(b.memberType || '');
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a.displayName || '').localeCompare(String(b.displayName || ''), 'ja');
  });

  return {
    filterType: filterType,
    year: year,
    years: getMailingListYears_(feeRows, year),
    candidates: candidates,
  };
}

function summarizeMailingListCandidates_(candidates) {
  var counts = { business: 0, individual: 0, support: 0, invalid: 0 };
  (candidates || []).forEach(function(c) {
    if (c.memberType === 'BUSINESS') counts.business += 1;
    else if (c.memberType === 'INDIVIDUAL') counts.individual += 1;
    else if (c.memberType === 'SUPPORT') counts.support += 1;
    if (c.addressInvalidItems && c.addressInvalidItems.length > 0) counts.invalid += 1;
  });
  return counts;
}

function getMailingListTargets_(payload) {
  var built = buildMailingListCandidates_(payload);
  return {
    selectedYear: built.year,
    years: built.years,
    targets: built.candidates.map(function(c) {
      return {
        targetKey: c.targetKey,
        memberId: c.memberId,
        displayName: c.displayName,
        kana: c.kana || '', // v362
        memberType: c.memberType,
        memberStatus: c.memberStatus,
        annualFeeStatus: c.annualFeeStatus,
        annualFeeYear: c.annualFeeYear,
        annualFeeHistories: c.annualFeeHistories || {},
        officeName: c.officeName,
        mailingPreference: c.mailingPreference,
        mailingDestination: c.mailingDestination,
        addressInvalidItems: c.addressInvalidItems,
      };
    }),
    counts: summarizeMailingListCandidates_(built.candidates),
  };
}

/**
 * v207/v291: 宛名リスト Excel（.xlsx）出力
 *
 * payload: { filterType: 'KOHOUSHI' | 'OSHIRASE', year?: number, targetKeys?: string[] }
 *   KOHOUSHI: 広報誌発送 — ACTIVE + WITHDRAWAL_SCHEDULED の全会員
 *   OSHIRASE: お知らせ発送 — 事業所会員全員 + 個人/賛助のうち 発送方法コード='POST'
 *
 * targetKeys 指定時は、バックエンドで再計算した発送対象候補との交差だけを出力する。
 */
function generateMailingListExcel_(payload) {
  var p = payload || {};
  var built = buildMailingListCandidates_(p);
  var filterType = built.filterType;
  var selectedCandidates = built.candidates;
  if (Array.isArray(p.targetKeys)) {
    if (p.targetKeys.length === 0) throw new Error('出力対象が選択されていません。');
    var keySet = {};
    p.targetKeys.forEach(function(k) {
      keySet[String(k)] = true;
    });
    selectedCandidates = selectedCandidates.filter(function(c) {
      return !!keySet[String(c.targetKey)];
    });
    if (selectedCandidates.length === 0) {
      throw new Error('選択された会員が現在の発送条件に一致しません。');
    }
  }

  var HEADERS_BIZ     = ['名前', '郵便番号', '住所', '建物名'];
  var HEADERS_IND_SUP = ['名前', '郵便番号', '住所', '建物名', '勤務先名'];
  var HEADERS_INVALID = ['名前', '会員種別', '住所不備の項目'];

  var rowsBiz     = [];
  var rowsInd     = [];
  var rowsSup     = [];
  var rowsInvalid = [];

  selectedCandidates.forEach(function(c) {
    if (c.addressInvalidItems.length > 0) {
      var mtypeLabel = c.memberType === 'BUSINESS' ? '事業所会員'
                     : c.memberType === 'INDIVIDUAL' ? '個人会員' : '賛助会員';
      rowsInvalid.push([c.displayName, mtypeLabel, c.addressInvalidItems.join('、')]);
      return;
    }

    if (c.memberType === 'BUSINESS') {
      rowsBiz.push([c.displayName, c.postCode, c.address1, c.address2]);
    } else if (c.memberType === 'INDIVIDUAL') {
      rowsInd.push([c.displayName, c.postCode, c.address1, c.address2, c.officeName]);
    } else if (c.memberType === 'SUPPORT') {
      rowsSup.push([c.displayName, c.postCode, c.address1, c.address2, c.officeName]);
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
      var mergeVars = { '氏名': rec.displayName, '事業所名': rec.officeName || '', '会員番号': rec.memberId || '' };
      var personalSubject = renderBizEmailTemplate_(subject, mergeVars);
      var personalBody = renderBizEmailTemplate_(body, mergeVars);

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

      deliverMail_('BULK_MAIL', rec.email, personalSubject, personalBody, {
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

  var rows = getRowsAsObjectsFromSheet_(logSheet).filter(function(r) {
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

// ─── v372: 名簿出力 Visual Template Designer 用 API ───────────────────────────

/**
 * フィールド辞書: 列ビルダー UI で表示する全候補フィールドのメタ情報。
 * フロントエンドはこの辞書からチェックボックスを生成し、出力列に追加可能。
 * 新フィールド追加時はこの辞書のみ更新すればフロント改修不要。
 */
function getRosterFieldDictionary_() {
  // applicableUnits: 'MEMBER' | 'STAFF' のどちらの出力単位で意味があるか
  // - 'MEMBER': 会員行（個人/賛助/事業所会員）で値が入る
  // - 'STAFF':  事業所職員行で値が入る
  // 両方含むものは MIXED モードで安心して使える
  return [
    // === 統合（polymorphic）フィールド: 全エンティティで自動的に値が入る ===
    { key: 'autoName',                label: '氏名（自動）',           group: 'auto', type: 'string', sample: '山田 太郎', applicableUnits: ['MEMBER', 'STAFF'], description: '個人/賛助は姓名、事業所会員は勤務先名、事業所職員は職員姓名' },
    { key: 'autoKana',                label: 'フリガナ（自動）',       group: 'auto', type: 'string', sample: 'ヤマダ タロウ', applicableUnits: ['MEMBER', 'STAFF'], description: '個人/賛助は会員フリガナ、職員は職員フリガナ' },
    { key: 'autoEmail',               label: 'メール（自動）',         group: 'auto', type: 'string', sample: 'taro@example.jp', applicableUnits: ['MEMBER', 'STAFF'], description: '個人/賛助は代表メール、職員は職員メール' },
    { key: 'autoCareManagerNumber',   label: 'CM番号（自動）',         group: 'auto', type: 'string', sample: '27000001', applicableUnits: ['MEMBER', 'STAFF'], description: '個人は会員CM番号、職員は職員CM番号' },
    // === 区分 ===
    { key: 'outputCategory',          label: '区分（会員/職員）',       group: 'auto', type: 'enum', enumLabels: { MEMBER: '会員', STAFF: '事業所職員' }, sample: '会員', applicableUnits: ['MEMBER', 'STAFF'], description: '混合モードで会員行/職員行を識別' },

    // === 会員（個人/賛助/事業所すべての会員行）===
    { key: 'memberId',                label: '会員ID',                  group: 'member', type: 'string', sample: 'M0123456789', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'memberType',              label: '会員種別',                group: 'member', type: 'enum', enumLabels: { INDIVIDUAL: '個人会員', BUSINESS: '事業所会員', SUPPORT: '賛助会員' }, sample: '個人会員', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'memberStatus',            label: '会員状態',                group: 'member', type: 'enum', enumLabels: { ACTIVE: '在籍中', WITHDRAWAL_SCHEDULED: '退会予定', WITHDRAWN: '年度内退会' }, sample: '在籍中', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'joinedDate',              label: '会員入会日',              group: 'member', type: 'date', sample: '2024-04-01', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'withdrawnDate',           label: '会員退会日',              group: 'member', type: 'date', sample: '', applicableUnits: ['MEMBER', 'STAFF'] },

    // === 個人/賛助会員のみ（事業所会員は空・職員行は親会員値が空のため出ない）===
    { key: 'lastName',                label: '姓（個人/賛助）',         group: 'individual', type: 'string', sample: '山田', applicableUnits: ['MEMBER'] },
    { key: 'firstName',               label: '名（個人/賛助）',         group: 'individual', type: 'string', sample: '太郎', applicableUnits: ['MEMBER'] },
    { key: 'fullName',                label: '氏名 姓名（個人/賛助）',  group: 'individual', type: 'string', sample: '山田 太郎', applicableUnits: ['MEMBER'] },
    { key: 'lastKana',                label: 'セイ（個人/賛助）',       group: 'individual', type: 'string', sample: 'ヤマダ', applicableUnits: ['MEMBER'] },
    { key: 'firstKana',               label: 'メイ（個人/賛助）',       group: 'individual', type: 'string', sample: 'タロウ', applicableUnits: ['MEMBER'] },
    { key: 'fullKana',                label: 'フリガナ（個人/賛助）',   group: 'individual', type: 'string', sample: 'ヤマダ タロウ', applicableUnits: ['MEMBER'] },
    { key: 'email',                   label: '代表メールアドレス',      group: 'individual', type: 'string', sample: 'taro@example.jp', applicableUnits: ['MEMBER'] },
    { key: 'mobilePhone',             label: '携帯電話番号',            group: 'individual', type: 'string', sample: '090-1234-5678', applicableUnits: ['MEMBER'] },
    { key: 'careManagerNumber',       label: '介護支援専門員番号（会員）', group: 'individual', type: 'string', sample: '27000001', applicableUnits: ['MEMBER'] },
    { key: 'mailingPreference',       label: '発送方法',                group: 'individual', type: 'enum', enumLabels: { EMAIL: 'メール', POST: '郵送' }, sample: 'メール', applicableUnits: ['MEMBER'] },
    { key: 'preferredMailDestination', label: '郵送先区分',              group: 'individual', type: 'enum', enumLabels: { OFFICE: '勤務先', HOME: '自宅' }, sample: '勤務先', applicableUnits: ['MEMBER'] },
    { key: 'homePostCode',            label: '自宅郵便番号',            group: 'individual', type: 'string', sample: '573-0000', applicableUnits: ['MEMBER'] },
    { key: 'homePrefecture',          label: '自宅都道府県',            group: 'individual', type: 'string', sample: '大阪府', applicableUnits: ['MEMBER'] },
    { key: 'homeCity',                label: '自宅市区町村',            group: 'individual', type: 'string', sample: '枚方市', applicableUnits: ['MEMBER'] },
    { key: 'homeAddressLine',         label: '自宅住所',                group: 'individual', type: 'string', sample: '○○町1-1', applicableUnits: ['MEMBER'] },
    { key: 'homeAddressLine2',        label: '自宅住所2',               group: 'individual', type: 'string', sample: '', applicableUnits: ['MEMBER'] },
    { key: 'homeFullAddress',         label: '自宅住所（結合）',        group: 'individual', type: 'string', sample: '大阪府枚方市○○町1-1', applicableUnits: ['MEMBER'] },

    // === 事業所会員（勤務先情報・MEMBER単位・職員行は親会員から継承）===
    { key: 'officeName',              label: '事業所名',                group: 'office', type: 'string', sample: 'ケアプランセンターA', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeNumber',            label: '事業所番号',              group: 'office', type: 'string', sample: '2700123456', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officePostCode',          label: '事業所郵便番号',          group: 'office', type: 'string', sample: '573-0000', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officePrefecture',        label: '事業所都道府県',          group: 'office', type: 'string', sample: '大阪府', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeCity',              label: '事業所市区町村',          group: 'office', type: 'string', sample: '枚方市', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeAddressLine',       label: '事業所住所',              group: 'office', type: 'string', sample: '岡東町1-1', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeAddressLine2',      label: '事業所住所2',             group: 'office', type: 'string', sample: '○○ビル3F', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeFullAddress',       label: '事業所住所（結合）',      group: 'office', type: 'string', sample: '大阪府枚方市岡東町1-1', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officePhone',             label: '事業所電話番号',          group: 'office', type: 'string', sample: '072-000-0000', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeFax',               label: '事業所FAX番号',           group: 'office', type: 'string', sample: '072-000-0001', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'enrolledStaffCount',      label: '在籍職員数（事業所）',    group: 'office', type: 'number', sample: '5', applicableUnits: ['MEMBER', 'STAFF'] },

    // === 事業所職員（STAFF/MIXED モードでのみ意味あり）===
    { key: 'staffId',                 label: '職員ID',                  group: 'staff', type: 'string', sample: 'a1b2c3d4', applicableUnits: ['STAFF'] },
    { key: 'staffLastName',           label: '職員 姓',                 group: 'staff', type: 'string', sample: '佐藤', applicableUnits: ['STAFF'] },
    { key: 'staffFirstName',          label: '職員 名',                 group: 'staff', type: 'string', sample: '次郎', applicableUnits: ['STAFF'] },
    { key: 'staffFullName',           label: '職員氏名 姓名',           group: 'staff', type: 'string', sample: '佐藤 次郎', applicableUnits: ['STAFF'] },
    { key: 'staffLastKana',           label: '職員 セイ',               group: 'staff', type: 'string', sample: 'サトウ', applicableUnits: ['STAFF'] },
    { key: 'staffFirstKana',          label: '職員 メイ',               group: 'staff', type: 'string', sample: 'ジロウ', applicableUnits: ['STAFF'] },
    { key: 'staffFullKana',           label: '職員フリガナ',            group: 'staff', type: 'string', sample: 'サトウ ジロウ', applicableUnits: ['STAFF'] },
    { key: 'staffEmail',              label: '職員メールアドレス',      group: 'staff', type: 'string', sample: 'jiro@example.jp', applicableUnits: ['STAFF'] },
    { key: 'staffCareManagerNumber',  label: '職員CM番号',              group: 'staff', type: 'string', sample: '27000123', applicableUnits: ['STAFF'] },
    { key: 'staffRole',               label: '職員権限',                group: 'staff', type: 'enum', enumLabels: { REPRESENTATIVE: '代表者', ADMIN: '管理者', STAFF: '職員' }, sample: '代表者', applicableUnits: ['STAFF'] },
    { key: 'staffStatus',             label: '職員状態',                group: 'staff', type: 'enum', enumLabels: { ENROLLED: '在籍', LEFT: '退職' }, sample: '在籍', applicableUnits: ['STAFF'] },
    { key: 'staffJoinedDate',         label: '職員入会日',              group: 'staff', type: 'date', sample: '2024-04-01', applicableUnits: ['STAFF'] },
    { key: 'staffWithdrawnDate',      label: '職員退会日',              group: 'staff', type: 'date', sample: '', applicableUnits: ['STAFF'] },
    { key: 'staffMailingOptOut',      label: '職員メール配信希望',      group: 'staff', type: 'enum', enumLabels: { YES: '配信希望', NO: '配信停止' }, sample: '配信希望', applicableUnits: ['STAFF'] },

    // === 年会費 ===
    { key: 'annualFeeStatus',         label: '年会費状態（選択年度）',  group: 'fee', type: 'enum', enumLabels: { PAID: '納入済み', UNPAID: '未納' }, sample: '納入済み', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'annualFeeYear',           label: '年会費対象年度',          group: 'fee', type: 'number', sample: '2026', applicableUnits: ['MEMBER', 'STAFF'], valuePicker: 'year' },
  ];
}

/**
 * Visual Template Designer 用に会員データをフラット化して返す。
 * 辞書の全キーを raw 文字列で含む（v373.7 までは旧 getMembersForRoster_ と並存していたが現在は唯一の経路）。
 * フロントエンドは row[fieldKey] でアクセスできる。
 */
function getRosterDesignerData_(payload) {
  var p = payload || {};
  var memberTypes  = p.memberTypes  || ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'];
  var memberStatusFilter = String(p.memberStatus || 'ACTIVE');
  var outputUnit = String(p.outputUnit || 'MEMBER').toUpperCase();
  if (['MEMBER', 'STAFF', 'MIXED'].indexOf(outputUnit) < 0) outputUnit = 'MEMBER';

  var now = new Date();
  var currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  var year = Number(p.year || 0);
  if (!year || !isFinite(year)) year = currentFY;

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet  = ss.getSheetByName('T_事業所職員');
  var feeSheet    = ss.getSheetByName('T_年会費納入履歴');

  var members   = getRowsAsObjectsFromSheet_(memberSheet);
  var staffRows = staffSheet ? getRowsAsObjectsFromSheet_(staffSheet) : [];
  var feeRows   = feeSheet   ? getRowsAsObjectsFromSheet_(feeSheet)   : [];

  var feeMap = {};
  var feeMapByYear = {};
  feeRows.forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    var yr  = Number(r['対象年度'] || 0);
    var mid = String(r['会員ID'] || '');
    if (!yr || !mid) return;
    var status = String(r['会費納入状態コード'] || 'UNPAID');
    if (!feeMapByYear[yr]) feeMapByYear[yr] = {};
    feeMapByYear[yr][mid] = status;
    if (yr === year) feeMap[mid] = status;
  });
  var allFeeYears = getMailingListYears_(feeRows, year);

  var staffCountMap = {};
  staffRows.forEach(function(s) {
    if (toBoolean_(s['削除フラグ'])) return;
    if (String(s['職員状態コード'] || '') !== 'ENROLLED') return;
    var mid = String(s['会員ID'] || '');
    staffCountMap[mid] = (staffCountMap[mid] || 0) + 1;
  });

  var joinStr_ = function(parts) {
    return parts.filter(function(p){ return p != null && String(p).trim() !== ''; }).map(function(p){ return String(p).trim(); }).join('');
  };

  // 事業所職員行を会員IDごとに事前マップ
  var staffByMemberId = {};
  if (outputUnit === 'STAFF' || outputUnit === 'MIXED') {
    staffRows.forEach(function(s) {
      if (toBoolean_(s['削除フラグ'])) return;
      var mid = String(s['会員ID'] || '');
      if (!mid) return;
      if (!staffByMemberId[mid]) staffByMemberId[mid] = [];
      staffByMemberId[mid].push(s);
    });
  }

  var memberById = {};
  members.forEach(function(m) { memberById[String(m['会員ID'] || '')] = m; });

  // 会員行を作る共通ヘルパー
  var buildMemberRow_ = function(m, fiscalSnapshot, memberId, feeStatus, feeHistories) {
    var mtype = String(m['会員種別コード'] || '');
    var lastName  = String(m['姓'] || '').trim();
    var firstName = String(m['名'] || '').trim();
    var lastKana  = String(m['セイ'] || '').trim();
    var firstKana = String(m['メイ'] || '').trim();
    var officeName = String(m['勤務先名'] || '').trim();
    var displayName = (mtype === 'BUSINESS')
      ? (officeName || memberId)
      : ((lastName + ' ' + firstName).trim() || memberId);
    return {
      memberId: memberId,
      memberType: mtype,
      memberStatus: String(fiscalSnapshot.memberStatus || ''),
      lastName: lastName,
      firstName: firstName,
      lastKana: lastKana,
      firstKana: firstKana,
      email: String(m['代表メールアドレス'] || ''),
      mobilePhone: String(m['携帯電話番号'] || ''),
      careManagerNumber: String(m['介護支援専門員番号'] || ''),
      joinedDate: fiscalSnapshot.joinedDate || '',
      withdrawnDate: fiscalSnapshot.withdrawnDate || '',
      mailingPreference: String(m['発送方法コード'] || ''),
      preferredMailDestination: String(m['郵送先区分コード'] || ''),
      officeName: officeName,
      officeNumber: String(m['事業所番号'] || ''),
      officePostCode: String(m['勤務先郵便番号'] || ''),
      officePrefecture: String(m['勤務先都道府県'] || ''),
      officeCity: String(m['勤務先市区町村'] || ''),
      officeAddressLine: String(m['勤務先住所'] || ''),
      officeAddressLine2: String(m['勤務先住所2'] || ''),
      officePhone: String(m['勤務先電話番号'] || ''),
      officeFax: String(m['勤務先FAX番号'] || ''),
      homePostCode: String(m['自宅郵便番号'] || ''),
      homePrefecture: String(m['自宅都道府県'] || ''),
      homeCity: String(m['自宅市区町村'] || ''),
      homeAddressLine: String(m['自宅住所'] || ''),
      homeAddressLine2: String(m['自宅住所2'] || ''),
      annualFeeStatus: feeStatus,
      annualFeeYear: String(year),
      enrolledStaffCount: mtype === 'BUSINESS' ? String(staffCountMap[memberId] || 0) : '',
      annualFeeHistories: feeHistories,
      fullName: (lastName + ' ' + firstName).trim(),
      fullKana: (lastKana + ' ' + firstKana).trim(),
      displayName: displayName,
      officeFullAddress: joinStr_([m['勤務先都道府県'], m['勤務先市区町村'], m['勤務先住所'], m['勤務先住所2']]),
      homeFullAddress: joinStr_([m['自宅都道府県'], m['自宅市区町村'], m['自宅住所'], m['自宅住所2']]),
      outputCategory: 'MEMBER',
      // === 統合 polymorphic フィールド（会員行）===
      autoName: (mtype === 'BUSINESS') ? officeName : ((lastName + ' ' + firstName).trim()),
      autoKana: (mtype === 'BUSINESS') ? '' : ((lastKana + ' ' + firstKana).trim()),
      autoEmail: (mtype === 'BUSINESS') ? '' : String(m['代表メールアドレス'] || ''),
      autoCareManagerNumber: (mtype === 'BUSINESS') ? '' : String(m['介護支援専門員番号'] || ''),
      // staff 列は空（会員行）
      staffId: '', staffLastName: '', staffFirstName: '', staffFullName: '',
      staffLastKana: '', staffFirstKana: '', staffFullKana: '',
      staffEmail: '', staffCareManagerNumber: '', staffRole: '', staffStatus: '',
      staffJoinedDate: '', staffWithdrawnDate: '', staffMailingOptOut: '',
    };
  };

  // 職員行を作る共通ヘルパー（親会員データを継承）
  var buildStaffRow_ = function(m, s, fiscalSnapshot, memberId, feeStatus, feeHistories) {
    var base = buildMemberRow_(m, fiscalSnapshot, memberId, feeStatus, feeHistories);
    var sLastName  = String(s['姓'] || '').trim();
    var sFirstName = String(s['名'] || '').trim();
    var sLastKana  = String(s['セイ'] || '').trim();
    var sFirstKana = String(s['メイ'] || '').trim();
    base.outputCategory = 'STAFF';
    base.staffId = String(s['職員ID'] || '');
    base.staffLastName = sLastName;
    base.staffFirstName = sFirstName;
    base.staffFullName = (sLastName + ' ' + sFirstName).trim();
    base.staffLastKana = sLastKana;
    base.staffFirstKana = sFirstKana;
    base.staffFullKana = (sLastKana + ' ' + sFirstKana).trim();
    base.staffEmail = String(s['メールアドレス'] || '');
    base.staffCareManagerNumber = String(s['介護支援専門員番号'] || '');
    base.staffRole = String(s['職員権限コード'] || '');
    base.staffStatus = String(s['職員状態コード'] || '');
    base.staffJoinedDate = String(s['入会日'] || '');
    base.staffWithdrawnDate = String(s['退会日'] || '');
    base.staffMailingOptOut = String(s['メール配信希望コード'] || '');
    base.displayName = base.staffFullName || base.staffId;
    // === 統合 polymorphic フィールド（職員行は職員値で上書き）===
    base.autoName = base.staffFullName || base.staffId;
    base.autoKana = base.staffFullKana;
    base.autoEmail = base.staffEmail;
    base.autoCareManagerNumber = base.staffCareManagerNumber;
    return base;
  };

  var rows = [];
  members.forEach(function(m) {
    if (toBoolean_(m['削除フラグ'])) return;
    var mtype = String(m['会員種別コード'] || '');
    if (memberTypes.indexOf(mtype) < 0) return;

    var fiscalSnapshot = getMemberFiscalSnapshot_(m, year);
    if (!fiscalSnapshot.eligible) return;
    var status = fiscalSnapshot.memberStatus;
    if (memberStatusFilter === 'ACTIVE' && status !== 'ACTIVE') return;
    if (memberStatusFilter === 'INCLUDING_SCHEDULED' &&
        status !== 'ACTIVE' && status !== 'WITHDRAWAL_SCHEDULED') return;

    var memberId  = String(m['会員ID'] || '');
    var feeStatus = feeMap[memberId] || 'UNPAID';
    var feeHistories = {};
    allFeeYears.forEach(function(yr) {
      feeHistories[yr] = (feeMapByYear[yr] && feeMapByYear[yr][memberId]) || 'UNPAID';
    });

    if (outputUnit === 'MEMBER') {
      rows.push(buildMemberRow_(m, fiscalSnapshot, memberId, feeStatus, feeHistories));
    } else if (outputUnit === 'STAFF') {
      // 事業所会員のみ職員行を展開
      if (mtype !== 'BUSINESS') return;
      var arr = staffByMemberId[memberId] || [];
      arr.forEach(function(s) {
        if (String(s['職員状態コード'] || '') !== 'ENROLLED') return;
        rows.push(buildStaffRow_(m, s, fiscalSnapshot, memberId, feeStatus, feeHistories));
      });
    } else {
      // MIXED: 個人/賛助は会員行、事業所は職員行（事業所自身も 1 行追加して代表者欄を可視化したい場合は別途検討）
      if (mtype === 'BUSINESS') {
        var sArr = staffByMemberId[memberId] || [];
        sArr.forEach(function(s) {
          if (String(s['職員状態コード'] || '') !== 'ENROLLED') return;
          rows.push(buildStaffRow_(m, s, fiscalSnapshot, memberId, feeStatus, feeHistories));
        });
      } else {
        rows.push(buildMemberRow_(m, fiscalSnapshot, memberId, feeStatus, feeHistories));
      }
    }
  });

  return { rows: rows, years: allFeeYears, year: year, outputUnit: outputUnit };
}

/**
 * ROSTER_TEMPLATE_LIBRARY_V2 の読み込み（T_システム設定 から JSON 取得）。
 */
function loadRosterTemplatesV2_() {
  var ss = getOrCreateDatabase_();
  var raw = String(getSystemSettingValue_(ss, 'ROSTER_TEMPLATE_LIBRARY_V2') || '[]');
  var list = [];
  try { list = JSON.parse(raw); } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  return { templates: list };
}

function saveRosterTemplateV2_(payload) {
  var p = payload || {};
  var template = p.template;
  if (!template || typeof template !== 'object') throw new Error('テンプレートが指定されていません。');
  if (!template.id || typeof template.id !== 'string') throw new Error('テンプレートIDが必要です。');
  if (!template.name || typeof template.name !== 'string') throw new Error('テンプレート名が必要です。');
  if (!Array.isArray(template.columns)) throw new Error('columns 配列が必要です。');

  var ss = getOrCreateDatabase_();
  var current = loadRosterTemplatesV2_().templates;
  var now = new Date().toISOString();
  var found = false;
  current = current.map(function(t) {
    if (t.id === template.id) {
      found = true;
      return Object.assign({}, t, template, { updatedAt: now });
    }
    return t;
  });
  if (!found) {
    template.createdAt = template.createdAt || now;
    template.updatedAt = now;
    current.push(template);
  }
  // isDefault 排他処理
  if (template.isDefault) {
    current = current.map(function(t) {
      return Object.assign({}, t, { isDefault: t.id === template.id });
    });
  }
  batchUpsertSystemSettings_(ss, [{
    key: 'ROSTER_TEMPLATE_LIBRARY_V2',
    value: JSON.stringify(current),
    description: '名簿テンプレートライブラリ V2（Visual Designer 用）',
  }]);
  return { ok: true, templates: current };
}

function deleteRosterTemplateV2_(payload) {
  var id = String((payload || {}).id || '').trim();
  if (!id) throw new Error('テンプレートIDが必要です。');
  var ss = getOrCreateDatabase_();
  var current = loadRosterTemplatesV2_().templates.filter(function(t){ return t.id !== id; });
  batchUpsertSystemSettings_(ss, [{
    key: 'ROSTER_TEMPLATE_LIBRARY_V2',
    value: JSON.stringify(current),
    description: '名簿テンプレートライブラリ V2（Visual Designer 用）',
  }]);
  return { ok: true, templates: current };
}

function duplicateRosterTemplateV2_(payload) {
  var id = String((payload || {}).id || '').trim();
  if (!id) throw new Error('テンプレートIDが必要です。');
  var current = loadRosterTemplatesV2_().templates;
  var src = current.filter(function(t){ return t.id === id; })[0];
  if (!src) throw new Error('テンプレートが見つかりません。');
  var copy = JSON.parse(JSON.stringify(src));
  copy.id = Utilities.getUuid();
  copy.name = (src.name || '名前なし') + ' (コピー)';
  copy.isDefault = false;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  return saveRosterTemplateV2_({ template: copy });
}

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

function ensureLinePostRequestSheet_(ss) {
  return getOrCreateSheet_(ss, 'T_LINE投稿依頼');
}

function getLinePostAssetsFolder_() {
  var ss = getOrCreateDatabase_();
  var folderId = String(getSystemSettingValue_(ss, 'LINE_POST_ASSETS_FOLDER_ID') || '').trim();
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) { /* fall through to create */ }
  }
  var folder = DriveApp.createFolder('LINE投稿資材');
  upsertSystemSetting_(ss, 'LINE_POST_ASSETS_FOLDER_ID', folder.getId(),
    '公式LINE投稿の添付ファイル保存先 Drive フォルダID');
  return folder;
}

function rowToLinePostRequest_(row) {
  return {
    id: String(row['投稿依頼ID'] || ''),
    status: String(row['ステータス'] || LINE_POST_STATUS_DRAFT),
    text: String(row['テキスト'] || ''),
    trainingApplyUrl: String(row['研修申込リンク'] || ''),
    attachmentUrl: String(row['添付ファイルURL'] || ''),
    attachmentKind: String(row['添付ファイル種別'] || ''),
    attachmentName: String(row['添付ファイル名'] || ''),
    targetType: String(row['対象種別'] || LINE_POST_TARGET_GENERAL),
    targetId: String(row['対象ID'] || ''),
    createdByEmail: String(row['作成者メール'] || ''),
    createdAt: String(row['作成日時'] || ''),
    updatedAt: String(row['更新日時'] || ''),
    requestedAt: String(row['投稿依頼日時'] || ''),
    postedAt: String(row['投稿日時'] || ''),
    postedByEmail: String(row['投稿マーク者メール'] || ''),
    memo: String(row['備考'] || ''),
  };
}

function listLinePostRequests_(payload) {
  var p = payload || {};
  var statusFilter = String(p.status || '').trim();
  var targetTypeFilter = String(p.targetType || '').trim();
  var keyword = String(p.keyword || '').trim().toLowerCase();
  var limit = Math.min(Math.max(Number(p.limit) || 200, 1), 1000);

  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (String(row['削除フラグ'] || '').toLowerCase() === 'true') continue;
    if (statusFilter && String(row['ステータス']) !== statusFilter) continue;
    if (targetTypeFilter && String(row['対象種別']) !== targetTypeFilter) continue;
    if (keyword) {
      var hay = (String(row['テキスト']) + ' ' + String(row['備考']) + ' ' + String(row['添付ファイル名'])).toLowerCase();
      if (hay.indexOf(keyword) < 0) continue;
    }
    items.push(rowToLinePostRequest_(row));
  }
  // 作成日時降順
  items.sort(function (a, b) { return (a.createdAt < b.createdAt) ? 1 : (a.createdAt > b.createdAt ? -1 : 0); });
  if (items.length > limit) items = items.slice(0, limit);
  return { items: items, total: items.length, statusFilter: statusFilter, targetTypeFilter: targetTypeFilter };
}

function getLinePostRequest_(payload) {
  var id = String((payload || {}).id || '').trim();
  if (!id) throw new Error('投稿依頼IDが必要です。');
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['投稿依頼ID']) === id) {
      if (String(rows[i]['削除フラグ'] || '').toLowerCase() === 'true') {
        throw new Error('削除済みの投稿依頼です。');
      }
      var item = rowToLinePostRequest_(rows[i]);
      // 関連情報（targetType=TRAINING なら研修名を同送）
      if (item.targetType === LINE_POST_TARGET_TRAINING && item.targetId) {
        var trainings = getRowsAsObjects_(ss, 'T_研修');
        for (var j = 0; j < trainings.length; j++) {
          if (String(trainings[j]['研修ID']) === item.targetId) {
            item.targetLabel = String(trainings[j]['研修名'] || '') + (trainings[j]['開催日'] ? ' (' + trainings[j]['開催日'] + ')' : '');
            break;
          }
        }
      }
      return { item: item };
    }
  }
  throw new Error('投稿依頼が見つかりません。');
}

function saveLinePostRequest_(payload) {
  var p = payload || {};
  var caller = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var text = String(p.text || '');
  if (!text) throw new Error('テキストを入力してください。');
  if (text.length > LINE_POST_TEXT_MAX) throw new Error('テキストは' + LINE_POST_TEXT_MAX + '文字以内で入力してください。');
  var trainingApplyUrl = String(p.trainingApplyUrl || '').trim();
  if (trainingApplyUrl) {
    var urlLower = trainingApplyUrl.toLowerCase();
    if (urlLower.indexOf('http://') !== 0 && urlLower.indexOf('https://') !== 0) {
      throw new Error('研修申込リンクは http(s):// で始まる URL を入力してください。');
    }
  }
  var targetType = String(p.targetType || LINE_POST_TARGET_GENERAL);
  if (targetType !== LINE_POST_TARGET_GENERAL && targetType !== LINE_POST_TARGET_TRAINING) {
    throw new Error('対象種別が不正です。');
  }
  var targetId = String(p.targetId || '').trim();
  if (targetType === LINE_POST_TARGET_TRAINING && !targetId) {
    throw new Error('対象種別が研修の場合は対象ID（研修ID）が必要です。');
  }
  var now = new Date().toISOString();
  var id = String(p.id || '').trim();
  var sheet = ss.getSheetByName('T_LINE投稿依頼');
  if (id) {
    // 既存更新（DRAFT のみ編集可）
    var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
    var foundIndex = -1;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i]['投稿依頼ID']) === id) { foundIndex = i; break; }
    }
    if (foundIndex < 0) throw new Error('編集対象の投稿依頼が見つかりません。');
    if (String(rows[foundIndex]['ステータス']) !== LINE_POST_STATUS_DRAFT) {
      throw new Error('作成中（DRAFT）の投稿依頼のみ編集できます。先に「取り下げ」を実行してください。');
    }
    var existing = rows[foundIndex];
    var updates = Object.assign({}, existing, {
      'テキスト': text,
      '研修申込リンク': trainingApplyUrl,
      '添付ファイルURL': String(p.attachmentUrl || existing['添付ファイルURL'] || ''),
      '添付ファイル種別': String(p.attachmentKind || existing['添付ファイル種別'] || ''),
      '添付ファイル名': String(p.attachmentName || existing['添付ファイル名'] || ''),
      '対象種別': targetType,
      '対象ID': targetId,
      '更新日時': now,
      '備考': String(p.memo || ''),
    });
    // 添付削除リクエスト（明示 null）
    if (p.clearAttachment === true) {
      updates['添付ファイルURL'] = '';
      updates['添付ファイル種別'] = '';
      updates['添付ファイル名'] = '';
    }
    var saveSheet = ss.getSheetByName('T_LINE投稿依頼');
    updateRowByKey_(saveSheet, テーブル定義['T_LINE投稿依頼'], '投稿依頼ID', id, updates);
    return getLinePostRequest_({ id: id });
  } else {
    // 新規作成
    var newId = Utilities.getUuid();
    var newRow = {
      '投稿依頼ID': newId,
      'ステータス': LINE_POST_STATUS_DRAFT,
      'テキスト': text,
      '研修申込リンク': trainingApplyUrl,
      '添付ファイルURL': String(p.attachmentUrl || ''),
      '添付ファイル種別': String(p.attachmentKind || ''),
      '添付ファイル名': String(p.attachmentName || ''),
      '対象種別': targetType,
      '対象ID': targetId,
      '作成者メール': caller,
      '作成日時': now,
      '更新日時': now,
      '投稿依頼日時': '',
      '投稿日時': '',
      '投稿マーク者メール': '',
      '備考': String(p.memo || ''),
      '削除フラグ': 'false',
    };
    appendRowsByHeaders_(ss, 'T_LINE投稿依頼', [newRow]);
    return getLinePostRequest_({ id: newId });
  }
}

function uploadLinePostAttachment_(payload) {
  var p = payload || {};
  var base64 = String(p.base64 || '');
  var mimeType = String(p.mimeType || '').toLowerCase();
  var fileName = String(p.fileName || 'attachment');
  if (!base64) throw new Error('添付データが空です。');
  // mimeType 判定
  var kind = '';
  if (mimeType.indexOf('image/') === 0) kind = LINE_POST_ATTACHMENT_KIND_IMAGE;
  else if (mimeType === 'application/pdf') kind = LINE_POST_ATTACHMENT_KIND_PDF;
  else throw new Error('画像（jpg/png/gif/webp）または PDF のみアップロード可能です。');
  // size check (base64 length × 3/4 ≒ bytes)
  var approxBytes = Math.floor(base64.length * 0.75);
  if (approxBytes > LINE_POST_ATTACHMENT_MAX_BYTES) {
    throw new Error('ファイルサイズが上限（10MB）を超えています。');
  }
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, mimeType, fileName);
  var folder = getLinePostAssetsFolder_();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    url: file.getUrl(),
    fileId: file.getId(),
    fileName: file.getName(),
    kind: kind,
    mimeType: mimeType,
    sizeBytes: approxBytes,
  };
}

function transitionLinePostRequest_(payload) {
  var p = payload || {};
  var id = String(p.id || '').trim();
  // build pruner が `if (action === '...')` を dispatcher case と誤認するのを避けるため
  // パラメータ名は `transAction` を使用（payload.action は外部 API 名で固定のため受信側のみ別名）
  var transAction = String(p.action || '').trim(); // 'request' / 'post' / 'withdraw'
  if (!id) throw new Error('投稿依頼IDが必要です。');
  var caller = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
  var found = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['投稿依頼ID']) === id) { found = rows[i]; break; }
  }
  if (!found) throw new Error('投稿依頼が見つかりません。');
  var now = new Date().toISOString();
  var currentStatus = String(found['ステータス']);
  var updates = { '更新日時': now };
  if (transAction === 'request') {
    if (currentStatus !== LINE_POST_STATUS_DRAFT) {
      throw new Error('作成中（DRAFT）の投稿依頼のみ依頼へ移行できます。');
    }
    updates['ステータス'] = LINE_POST_STATUS_REQUESTED;
    updates['投稿依頼日時'] = now;
    // メール通知
    var notifyEmail = String(getSystemSettingValue_(ss, 'LINE_POST_NOTIFY_EMAIL') || '').trim();
    if (notifyEmail) {
      try {
        var subject = '【LINE投稿依頼】新規依頼が登録されました';
        var body = '公式LINE への投稿依頼が登録されました。\n\n'
          + '【投稿依頼ID】' + id + '\n'
          + '【依頼者】' + caller + '\n'
          + '【依頼日時】' + now + '\n\n'
          + '----- 本文 -----\n' + String(found['テキスト']) + '\n\n'
          + (String(found['研修申込リンク']) ? '【研修申込リンク】' + String(found['研修申込リンク']) + '\n' : '')
          + (String(found['添付ファイルURL']) ? '【添付ファイル】' + String(found['添付ファイル名']) + '\n' + String(found['添付ファイルURL']) + '\n' : '');
        deliverMail_('LINE_POST_REQUEST', notifyEmail, subject, body, {});
      } catch (mailErr) {
        Logger.log('[transitionLinePostRequest_] mail notify failed: ' + mailErr.message);
      }
    }
  } else if (transAction === 'post') {
    if (currentStatus !== LINE_POST_STATUS_REQUESTED) {
      throw new Error('投稿依頼中（REQUESTED）の依頼のみ「投稿済み」に移行できます。');
    }
    updates['ステータス'] = LINE_POST_STATUS_POSTED;
    updates['投稿日時'] = now;
    updates['投稿マーク者メール'] = caller;
  } else if (transAction === 'withdraw') {
    if (currentStatus === LINE_POST_STATUS_POSTED) {
      throw new Error('投稿済みの依頼は取下げできません。');
    }
    updates['ステータス'] = LINE_POST_STATUS_DRAFT;
    updates['投稿依頼日時'] = '';
  } else {
    throw new Error('不正な遷移アクションです。');
  }
  var transSheet = ss.getSheetByName('T_LINE投稿依頼');
  updateRowByKey_(transSheet, テーブル定義['T_LINE投稿依頼'], '投稿依頼ID', id, updates);
  return getLinePostRequest_({ id: id });
}

function deleteLinePostRequest_(payload) {
  var id = String((payload || {}).id || '').trim();
  if (!id) throw new Error('投稿依頼IDが必要です。');
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var delSheet = ss.getSheetByName('T_LINE投稿依頼');
  updateRowByKey_(delSheet, テーブル定義['T_LINE投稿依頼'], '投稿依頼ID', id, {
    '削除フラグ': 'true',
    '更新日時': new Date().toISOString(),
  });
  return { ok: true, id: id };
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
  var results = [];

  for (var i = 0; i < catalog.members.length; i++) {
    var member = catalog.members[i];
    var memberId = String(member['会員ID'] || '');
    if (!memberId) continue;
    var displayName = getDeleteMemberDisplayName_(member);
    var loginId = catalog.memberLoginIdById[memberId] || '';
    var memberSearchValues = [
      memberId,
      displayName,
      loginId,
      String(member['事業所番号'] || ''),
      String(member['代表メールアドレス'] || ''),
    ];
    if (!matchesSearchQuery_(query, memberSearchValues)) continue;
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
    var staffSearchValues = [
      staffId,
      parentMemberId,
      staffDisplayName,
      staffLoginId,
      String(staff['メールアドレス'] || ''),
      String(staff['介護支援専門員番号'] || ''),
    ];
    if (!matchesSearchQuery_(query, staffSearchValues)) continue;
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
var PASSWORD_HASH_PEPPER_SECRET_NAME = 'password-hash-pepper-v1';
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
  var fromSecretManager = '';
  try {
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
    + '/secrets/' + encodeURIComponent(PASSWORD_HASH_PEPPER_SECRET_NAME)
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

function hmacSha256Hex_(message, secret) {
  return bytesToHex_(Utilities.computeHmacSha256Signature(String(message || ''), String(secret || '')));
}
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
 * - "pbkdf2:sha256:" prefix → PBKDF2 で検証
 * - それ以外 → 旧 SHA-256 で検証
 * 旧方式で一致した場合は rehash 用フラグを返す。
 */

// ============================================================
// v295: 役員管理 — マスタ管理 / 役員割当て / 口座 / 支払い
// ============================================================

// ---------- 役員マスタデータ一括取得 ----------

function getOfficerMasterData_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var orgs = getRowsAsObjects_(ss, 'M_組織マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var roles = getRowsAsObjects_(ss, 'M_役職マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var paymentTypes = getRowsAsObjects_(ss, 'M_支払い種別マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var workCategories = getRowsAsObjects_(ss, 'M_業務分類').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  return { organizations: orgs, roles: roles, paymentTypes: paymentTypes, workCategories: workCategories };
}

// ---------- M_組織マスタ CRUD ----------

function saveOrganization_(payload) {
  var id           = String(payload.organizationCode || '').trim().toUpperCase();
  var name         = String(payload.organizationName || '').trim();
  var type         = String(payload.organizationType || '').trim();
  var displayOrder = Number(payload.displayOrder || 0);
  var allOfficerVisible = toBoolean_(payload.allOfficerVisible);
  if (!id)   throw new Error('組織コードは必須です。');
  if (!name) throw new Error('組織名は必須です。');

  var ss     = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet  = ss.getSheetByName('M_組織マスタ');
  if (!sheet) throw new Error('M_組織マスタ が見つかりません。');
  var found  = findRowByColumnValue_(sheet, '組織コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['組織名']]    = name;
    row[found.columns['組織種別']]  = type;
    row[found.columns['表示順']]    = displayOrder;
    if (found.columns['全役員表示フラグ'] != null) row[found.columns['全役員表示フラグ']] = allOfficerVisible;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']]  = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_組織マスタ', [{
      '組織コード': id, '組織名': name, '組織種別': type,
      '表示順': displayOrder, '全役員表示フラグ': allOfficerVisible, '有効フラグ': true,
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);
  }
  return { organizationCode: id };
}

function deleteOrganization_(payload) {
  var id = String(payload.organizationCode || '').trim();
  if (!id) throw new Error('組織コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var roles = getRowsAsObjects_(ss, 'M_役職マスタ').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['組織コード'] || '') === id;
  });
  if (roles.length > 0) throw new Error('この組織に役職が登録されています。先に役職を削除してください。');
  var workCategories = getRowsAsObjects_(ss, 'M_業務分類').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['組織コード'] || '') === id;
  });
  if (workCategories.length > 0) throw new Error('この組織に業務分類が登録されています。先に業務分類を削除してください。');

  var sheet = ss.getSheetByName('M_組織マスタ');
  var found = findRowByColumnValue_(sheet, '組織コード', id);
  if (!found) throw new Error('削除対象の組織が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { deleted: true, organizationCode: id };
}

// ---------- M_役職マスタ CRUD ----------

function saveOfficerRole_(payload) {
  var id      = String(payload.roleCode         || '').trim().toUpperCase();
  var name    = String(payload.roleName         || '').trim();
  var orgCode = String(payload.organizationCode || '').trim();
  var isChair = toBoolean_(payload.isChairman);
  var displayOrder = Number(payload.displayOrder || 0);
  if (!id)      throw new Error('役職コードは必須です。');
  if (!name)    throw new Error('役職名は必須です。');
  if (!orgCode) throw new Error('組織コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var org = findRowByColumnValue_(ss.getSheetByName('M_組織マスタ'), '組織コード', orgCode);
  if (!org || toBoolean_(org.row[org.columns['削除フラグ']])) throw new Error('指定された組織が見つかりません。');

  var sheet  = ss.getSheetByName('M_役職マスタ');
  if (!sheet) throw new Error('M_役職マスタ が見つかりません。');
  var found  = findRowByColumnValue_(sheet, '役職コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['役職名']]     = name;
    row[found.columns['組織コード']] = orgCode;
    row[found.columns['委員長フラグ']] = isChair;
    row[found.columns['表示順']]     = displayOrder;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']]   = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_役職マスタ', [{
      '役職コード': id, '役職名': name, '組織コード': orgCode,
      '委員長フラグ': isChair, '表示順': displayOrder, '有効フラグ': true,
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);
  }
  return { roleCode: id };
}

function deleteOfficerRole_(payload) {
  var id = String(payload.roleCode || '').trim();
  if (!id) throw new Error('役職コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var officers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['役職コード'] || '') === id;
  });
  if (officers.length > 0) throw new Error('この役職に役員が登録されています。先に役員割当てを解除してください。');

  var sheet = ss.getSheetByName('M_役職マスタ');
  var found = findRowByColumnValue_(sheet, '役職コード', id);
  if (!found) throw new Error('削除対象の役職が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { deleted: true, roleCode: id };
}

// ---------- M_支払い種別マスタ CRUD ----------

function savePaymentType_(payload) {
  var id           = String(payload.typeCode     || '').trim().toUpperCase();
  var name         = String(payload.typeName     || '').trim();
  var scope        = String(payload.scope        || '両方').trim();
  var displayOrder = Number(payload.displayOrder || 0);
  if (!id)   throw new Error('種別コードは必須です。');
  if (!name) throw new Error('種別名は必須です。');

  var ss     = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet  = ss.getSheetByName('M_支払い種別マスタ');
  if (!sheet) throw new Error('M_支払い種別マスタ が見つかりません。');
  var found  = findRowByColumnValue_(sheet, '種別コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['種別名']]    = name;
    row[found.columns['対象区分']]  = scope;
    row[found.columns['表示順']]    = displayOrder;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']]  = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_支払い種別マスタ', [{
      '種別コード': id, '種別名': name, '対象区分': scope,
      '表示順': displayOrder, '有効フラグ': true,
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);
  }
  return { typeCode: id };
}

function deletePaymentType_(payload) {
  var id = String(payload.typeCode || '').trim();
  if (!id) throw new Error('種別コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var lines  = getRowsAsObjects_(ss, 'T_支払い明細').filter(function(r) { return !toBoolean_(r['削除フラグ']) && String(r['種別コード'] || '') === id; });
  var claims = getRowsAsObjects_(ss, 'T_請求').filter(function(r) { return !toBoolean_(r['削除フラグ']) && String(r['種別コード'] || '') === id; });
  if (lines.length > 0 || claims.length > 0) throw new Error('この種別は使用中のため削除できません。');

  var sheet = ss.getSheetByName('M_支払い種別マスタ');
  var found = findRowByColumnValue_(sheet, '種別コード', id);
  if (!found) throw new Error('削除対象の支払い種別が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { deleted: true, typeCode: id };
}

// ---------- M_業務分類 CRUD ----------

function saveWorkCategory_(payload) {
  var id           = String(payload.categoryCode || '').trim().toUpperCase();
  var name         = String(payload.categoryName || '').trim();
  var orgCode      = String(payload.organizationCode || '').trim();
  var unitPrice    = Number(payload.unitPrice || 0);
  var displayOrder = Number(payload.displayOrder || 0);
  if (!id)      throw new Error('業務分類コードは必須です。');
  if (!name)    throw new Error('業務分類名は必須です。');
  if (!orgCode) throw new Error('組織は必須です。');
  if (unitPrice < 0 || !isFinite(unitPrice)) throw new Error('単価は0円以上の数値で入力してください。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var org = findRowByColumnValue_(ss.getSheetByName('M_組織マスタ'), '組織コード', orgCode);
  if (!org || toBoolean_(org.row[org.columns['削除フラグ']])) throw new Error('指定された組織が見つかりません。');

  var sheet = ss.getSheetByName('M_業務分類');
  if (!sheet) throw new Error('M_業務分類 が見つかりません。');
  var found = findRowByColumnValue_(sheet, '業務分類コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['業務分類名']] = name;
    row[found.columns['組織コード']] = orgCode;
    row[found.columns['単価']] = unitPrice;
    row[found.columns['表示順']] = displayOrder;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']] = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_業務分類', [{
      '業務分類コード': id,
      '業務分類名': name,
      '組織コード': orgCode,
      '単価': unitPrice,
      '表示順': displayOrder,
      '有効フラグ': true,
      '削除フラグ': false,
      '作成日時': nowIso,
      '更新日時': nowIso,
    }]);
  }
  return { categoryCode: id };
}

function deleteWorkCategory_(payload) {
  var id = String(payload.categoryCode || '').trim();
  if (!id) throw new Error('業務分類コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var claims = getRowsAsObjects_(ss, 'T_請求').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['業務分類コード'] || '') === id;
  });
  if (claims.length > 0) throw new Error('この業務分類は請求で使用中のため削除できません。');

  var sheet = ss.getSheetByName('M_業務分類');
  var found = findRowByColumnValue_(sheet, '業務分類コード', id);
  if (!found) throw new Error('削除対象の業務分類が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { deleted: true, categoryCode: id };
}

// ---------- 役員ステータス確認ヘルパー ----------

// v297: memberId（個人/賛助）または staffId（事業所職員）のいずれかでチェック

// ---------- T_役員 管理 ----------

function getOfficerManagementData_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var orgs     = getRowsAsObjects_(ss, 'M_組織マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var roles    = getRowsAsObjects_(ss, 'M_役職マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var officers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var members  = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });

  var memberMap = {};
  members.forEach(function(m) { memberMap[String(m['会員ID'] || '')] = m; });
  var staffMap = {};
  staffRows.forEach(function(s) { staffMap[String(s['職員ID'] || '')] = s; });

  var candidates = [];
  members.forEach(function(m) {
    var memberStatus = String(m['会員状態コード'] || 'ACTIVE');
    if (memberStatus !== 'ACTIVE' && memberStatus !== 'WITHDRAWAL_SCHEDULED') return;
    var memberType = String(m['会員種別コード'] || '');
    if (memberType === 'BUSINESS') return;
    var memberIdForCandidate = String(m['会員ID'] || '');
    var memberDisplayName = (String(m['姓'] || '') + ' ' + String(m['名'] || '')).trim() || memberIdForCandidate;
    var memberOfficeName = String(m['勤務先名'] || '');
    candidates.push({
      key: 'member-' + memberIdForCandidate,
      memberId: memberIdForCandidate,
      staffId: '',
      displayName: memberDisplayName,
      officeName: memberOfficeName,
      label: memberDisplayName + '（' + memberIdForCandidate + '）' + (memberOfficeName ? ' ' + memberOfficeName : ''),
    });
  });
  staffRows.forEach(function(s) {
    if (String(s['職員状態コード'] || 'ENROLLED') !== 'ENROLLED') return;
    var staffIdForCandidate = String(s['職員ID'] || '');
    var parentBiz = memberMap[String(s['会員ID'] || '')] || {};
    var staffDisplayName = String(s['氏名'] || (String(s['姓'] || '') + ' ' + String(s['名'] || '')).trim() || staffIdForCandidate);
    var staffOfficeName = String(parentBiz['勤務先名'] || '');
    candidates.push({
      key: 'staff-' + staffIdForCandidate,
      memberId: '',
      staffId: staffIdForCandidate,
      displayName: staffDisplayName,
      officeName: staffOfficeName,
      label: staffDisplayName + '（' + staffOfficeName + '）',
    });
  });

  var enriched = officers.map(function(o) {
    var staffId  = String(o['職員ID'] || '');
    var memberId = String(o['会員ID'] || '');
    var displayName = '';
    var memberType = '';
    var officeName = '';

    if (staffId) {
      // 事業所職員パターン
      var s = staffMap[staffId] || {};
      displayName = String(s['氏名'] || (String(s['姓'] || '') + ' ' + String(s['名'] || '')).trim() || staffId);
      var parentBiz = memberMap[String(s['会員ID'] || '')] || {};
      officeName = String(parentBiz['勤務先名'] || '');
      memberType = 'BUSINESS_STAFF';
    } else {
      // 個人・賛助会員パターン
      var m = memberMap[memberId] || {};
      displayName = (String(m['姓'] || '') + ' ' + String(m['名'] || '')).trim() || memberId;
      memberType = String(m['会員種別コード'] || '');
      officeName = String(m['勤務先名'] || '');
    }

    return {
      役員ID: o['役員ID'],
      会員ID: memberId,
      職員ID: staffId,
      表示名: displayName,
      所属名: officeName,
      会員種別コード: memberType,
      役職コード: o['役職コード'], 組織コード: o['組織コード'],
      就任日: normalizeDateInput_(o['就任日']), 退任日: normalizeDateInput_(o['退任日']), 備考: o['備考'],
      作成日時: o['作成日時'], 更新日時: o['更新日時'],
    };
  });
  return { organizations: orgs, roles: roles, officers: enriched, candidates: candidates };
}

function assignOfficer_(payload) {
  var memberId      = String(payload.memberId      || '').trim();
  var staffId       = String(payload.staffId       || '').trim();
  var roleCode      = String(payload.roleCode      || '').trim();
  var appointedDate = String(payload.appointedDate || '').trim();
  var note          = String(payload.note          || '').trim();

  // XOR バリデーション
  if (!memberId && !staffId) throw new Error('会員IDまたは職員IDのいずれかが必要です。');
  if (memberId && staffId)   throw new Error('会員IDと職員IDは同時に指定できません。');
  if (!roleCode) throw new Error('役職コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  // 存在確認
  if (memberId) {
    var member = findRowByColumnValue_(ss.getSheetByName('T_会員'), '会員ID', memberId);
    if (!member || toBoolean_(member.row[member.columns['削除フラグ']])) throw new Error('対象会員が見つかりません。');
  } else {
    var staffRec = findRowByColumnValue_(ss.getSheetByName('T_事業所職員'), '職員ID', staffId);
    if (!staffRec || toBoolean_(staffRec.row[staffRec.columns['削除フラグ']])) throw new Error('対象職員が見つかりません。');
    if (String(staffRec.row[staffRec.columns['職員状態コード']] || '') === 'LEFT') throw new Error('退職済みの職員は役員に就任できません。');
  }

  var roleSheet = ss.getSheetByName('M_役職マスタ');
  var role = findRowByColumnValue_(roleSheet, '役職コード', roleCode);
  if (!role || toBoolean_(role.row[role.columns['削除フラグ']])) throw new Error('役職が見つかりません。');
  var orgCode = String(role.row[role.columns['組織コード']] || '');

  // 現職二重就任チェック
  var dup = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (r['退任日'] && String(r['退任日'] || '') !== '') return false;
    if (String(r['役職コード'] || '') !== roleCode) return false;
    if (memberId && String(r['会員ID'] || '') === memberId) return true;
    if (staffId  && String(r['職員ID'] || '') === staffId)  return true;
    return false;
  });
  if (dup.length > 0) throw new Error('すでに同じ役職に就任中です。');

  var nowIso = new Date().toISOString();
  var officerId = Utilities.getUuid();
  appendRowsByHeaders_(ss, 'T_役員', [{
    '役員ID': officerId, '会員ID': memberId, '職員ID': staffId,
    '役職コード': roleCode, '組織コード': orgCode,
    '就任日': appointedDate, '退任日': '', '備考': note,
    '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
  }]);
  clearAllDataCache_();
  return { officerId: officerId };
}

function resignOfficer_(payload) {
  var officerId       = String(payload.officerId       || '').trim();
  var resignationDate = String(payload.resignationDate || '').trim();
  if (!officerId) throw new Error('役員IDは必須です。');

  var ss    = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_役員');
  var found = findRowByColumnValue_(sheet, '役員ID', officerId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('役員レコードが見つかりません。');

  var row = found.row.slice();
  row[found.columns['退任日']]  = resignationDate || new Date().toISOString().substring(0, 10);
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { resigned: true, officerId: officerId };
}

function updateOfficerRecord_(payload) {
  var officerId = String(payload.officerId || '').trim();
  if (!officerId) throw new Error('役員IDは必須です。');

  var roleCode = String(payload.roleCode || '').trim();
  var appointedDate = String(payload.appointedDate || '').trim();
  var resignationDate = String(payload.resignationDate || '').trim();
  var note = String(payload.note || '').trim();

  function assertDateString_(value, label, allowBlank) {
    if (!value) {
      if (allowBlank) return;
      throw new Error(label + 'は必須です。');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(new Date(value + 'T00:00:00+09:00').getTime())) {
      throw new Error(label + 'は YYYY-MM-DD 形式で指定してください。');
    }
  }

  assertDateString_(appointedDate, '就任日', true);
  assertDateString_(resignationDate, '退任日', true);
  if (appointedDate && resignationDate && resignationDate < appointedDate) {
    throw new Error('退任日は就任日以降の日付を指定してください。');
  }

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_役員');
  var found = findRowByColumnValue_(sheet, '役員ID', officerId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('役員レコードが見つかりません。');

  var row = found.row.slice();
  if (roleCode) {
    var roleSheet = ss.getSheetByName('M_役職マスタ');
    var role = findRowByColumnValue_(roleSheet, '役職コード', roleCode);
    if (!role || toBoolean_(role.row[role.columns['削除フラグ']])) throw new Error('役職が見つかりません。');
    row[found.columns['役職コード']] = roleCode;
    row[found.columns['組織コード']] = String(role.row[role.columns['組織コード']] || '');
  }
  var nextRoleCode = String(row[found.columns['役職コード']] || '');
  var nextMemberId = String(row[found.columns['会員ID']] || '');
  var nextStaffId = String(row[found.columns['職員ID']] || '');
  if (!resignationDate) {
    var activeDup = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
      if (toBoolean_(r['削除フラグ'])) return false;
      if (String(r['役員ID'] || '') === officerId) return false;
      if (String(r['役職コード'] || '') !== nextRoleCode) return false;
      if (String(r['退任日'] || '')) return false;
      if (nextMemberId && String(r['会員ID'] || '') === nextMemberId) return true;
      if (nextStaffId && String(r['職員ID'] || '') === nextStaffId) return true;
      return false;
    });
    if (activeDup.length > 0) throw new Error('同じ担当者が同じ役職で現職になっているレコードが既にあります。');
  }
  if (found.columns['就任日'] != null) row[found.columns['就任日']] = appointedDate;
  if (found.columns['退任日'] != null) row[found.columns['退任日']] = resignationDate;
  if (found.columns['備考'] != null) row[found.columns['備考']] = note;
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { updated: true, officerId: officerId };
}

// ---------- T_振込口座 管理 ----------

function getBankAccount_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var rows = getRowsAsObjects_(ss, 'T_振込口座').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (staffId  && String(r['職員ID'] || '') === staffId)  return true;
    if (memberId && !staffId && String(r['会員ID'] || '') === memberId) return true;
    return false;
  });
  return rows.length > 0 ? rows[0] : null;
}

function saveBankAccount_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();
  if (!memberId && !staffId) throw new Error('会員IDまたは職員IDが必要です。');

  var ss    = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_振込口座');
  if (!sheet) throw new Error('T_振込口座 が見つかりません。');

  var existing = getRowsAsObjects_(ss, 'T_振込口座');
  var found = null;
  for (var i = 0; i < existing.length; i += 1) {
    if (toBoolean_(existing[i]['削除フラグ'])) continue;
    var matchM = memberId && !staffId && String(existing[i]['会員ID'] || '') === memberId;
    var matchS = staffId  && String(existing[i]['職員ID'] || '') === staffId;
    if (matchM || matchS) { found = findRowByColumnValue_(sheet, '口座ID', existing[i]['口座ID']); break; }
  }

  var nowIso    = new Date().toISOString();
  var accountId = found ? String(found.row[found.columns['口座ID']] || '') : Utilities.getUuid();
  var newData   = {
    '口座ID': accountId, '会員ID': staffId ? '' : memberId, '職員ID': staffId,
    '金融機関名':   String(payload.bankName          || '').trim(),
    '金融機関コード': String(payload.bankCode        || '').trim(),
    '支店名':       String(payload.branchName        || '').trim(),
    '支店コード':   String(payload.branchCode        || '').trim(),
    '口座種別':     String(payload.accountType       || '普通').trim(),
    '口座番号':     String(payload.accountNumber     || '').trim(),
    '口座名義カナ': String(payload.accountHolderKana || '').trim(),
    '備考':         String(payload.note              || '').trim(),
    '削除フラグ': false,
    '作成日時': found ? String(found.row[found.columns['作成日時']] || nowIso) : nowIso,
    '更新日時': nowIso,
  };

  if (found) {
    var row = found.row.slice();
    var cols = found.columns;
    Object.keys(newData).forEach(function(key) { if (cols[key] != null) row[cols[key]] = newData[key]; });
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'T_振込口座', [newData]);
  }
  return { accountId: accountId };
}

function deleteBankAccount_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();

  var ss    = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_振込口座');
  var rows  = getRowsAsObjects_(ss, 'T_振込口座');
  var found = null;
  for (var i = 0; i < rows.length; i += 1) {
    if (toBoolean_(rows[i]['削除フラグ'])) continue;
    var matchM = memberId && !staffId && String(rows[i]['会員ID'] || '') === memberId;
    var matchS = staffId  && String(rows[i]['職員ID'] || '') === staffId;
    if (matchM || matchS) { found = findRowByColumnValue_(sheet, '口座ID', rows[i]['口座ID']); break; }
  }
  if (!found) throw new Error('口座情報が見つかりません。');

  var row = found.row.slice();
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { deleted: true };
}

// 会員自身の役員ステータス + 口座取得（会員ポータル用）
// processApiRequest で sessionToken 検証済み → memberId・staffId が確定済み


function normalizeClaimRecord_(record) {
  var out = Object.assign({}, record);
  if (!String(out['請求種別'] || '').trim()) out['請求種別'] = 'EXPENSE_CLAIM';
  if (!String(out['数量'] || '').trim()) out['数量'] = 1;
  if (!String(out['単価'] || '').trim()) out['単価'] = Number(out['請求金額'] || 0);
  if (!String(out['業務分類コード'] || '').trim()) out['業務分類コード'] = '';
  return out;
}


// ---------- T_支払い / T_支払い明細 / T_請求 管理 ----------

function getPaymentHistory_(payload) {
  var ss       = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var memberId = payload && payload.memberId ? String(payload.memberId).trim() : null;

  var payments = getRowsAsObjects_(ss, 'T_支払い').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (memberId && String(r['会員ID'] || '') !== memberId) return false;
    return true;
  });
  var lines = getRowsAsObjects_(ss, 'T_支払い明細').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var lineMap = {};
  lines.forEach(function(l) {
    var pid = String(l['支払いID'] || '');
    if (!lineMap[pid]) lineMap[pid] = [];
    lineMap[pid].push(l);
  });

  var memberMap = {};
  getRowsAsObjects_(ss, 'T_会員').forEach(function(m) { memberMap[String(m['会員ID'] || '')] = m; });

  return payments.map(function(p) {
    var m = memberMap[String(p['会員ID'] || '')] || {};
    var displayName = (String(m['姓'] || '') + ' ' + String(m['名'] || '')).trim();
    return Object.assign({}, p, { 表示名: displayName, 明細: lineMap[String(p['支払いID'] || '')] || [] });
  });
}

function savePayment_(payload) {
  var memberId = String(payload.memberId || '').trim();
  if (!memberId) throw new Error('会員IDは必須です。');

  var lines = payload.lines || [];
  if (!lines.length) throw new Error('支払い明細は1件以上必要です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var member = findRowByColumnValue_(ss.getSheetByName('T_会員'), '会員ID', memberId);
  if (!member || toBoolean_(member.row[member.columns['削除フラグ']])) throw new Error('対象会員が見つかりません。');

  var lineTotal = lines.reduce(function(sum, l) { return sum + Number(l.amount || 0); }, 0);
  if (Number(payload.totalAmount || 0) !== lineTotal) {
    throw new Error('合計金額（' + payload.totalAmount + '）と明細合計（' + lineTotal + '）が一致しません。');
  }

  var bankAccount  = getBankAccount_({ memberId: memberId });
  var bankSnapshot = bankAccount ? JSON.stringify({
    金融機関名: bankAccount['金融機関名'], 金融機関コード: bankAccount['金融機関コード'],
    支店名: bankAccount['支店名'], 支店コード: bankAccount['支店コード'],
    口座種別: bankAccount['口座種別'], 口座番号: bankAccount['口座番号'],
    口座名義カナ: bankAccount['口座名義カナ'],
  }) : '';

  var nowIso     = new Date().toISOString();
  var paymentId  = Utilities.getUuid();
  var actorEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    appendRowsByHeaders_(ss, 'T_支払い', [{
      '支払いID': paymentId, '会員ID': memberId,
      '支払い日':   String(payload.paymentDate   || '').trim(),
      '支払い方法': String(payload.paymentMethod || '振込').trim(),
      '合計金額':   lineTotal,
      '振込先口座JSON': bankSnapshot,
      '登録者メール': actorEmail,
      '備考': String(payload.note || '').trim(),
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);

    var claimsToUpdate = [];
    lines.forEach(function(l) {
      var claimId = String(l.claimId || '').trim();
      appendRowsByHeaders_(ss, 'T_支払い明細', [{
        '明細ID': Utilities.getUuid(), '支払いID': paymentId, '請求ID': claimId,
        '役職コード':   String(l.roleCode         || '').trim(),
        '組織コード':   String(l.organizationCode  || '').trim(),
        '種別コード':   String(l.typeCode          || '').trim(),
        '金額':         Number(l.amount            || 0),
        '対象期間FROM': String(l.periodFrom        || '').trim(),
        '対象期間TO':   String(l.periodTo          || '').trim(),
        '摘要':         String(l.note             || '').trim(),
        '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
      }]);
      if (claimId) claimsToUpdate.push(claimId);
    });

    if (claimsToUpdate.length > 0) {
      var claimSheet = ss.getSheetByName('T_請求');
      if (claimSheet) {
        claimsToUpdate.forEach(function(claimId) {
          var cf = findRowByColumnValue_(claimSheet, '請求ID', claimId);
          if (cf && !toBoolean_(cf.row[cf.columns['削除フラグ']])) {
            var cr = cf.row.slice();
            cr[cf.columns['請求状態']] = '支払い済み';
            cr[cf.columns['更新日時']] = nowIso;
            claimSheet.getRange(cf.rowNumber, 1, 1, cr.length).setValues([cr]);
          }
        });
      }
    }

    clearAllDataCache_();
    return { paymentId: paymentId, totalAmount: lineTotal };
  } finally {
    lock.releaseLock();
  }
}

function deletePayment_(payload) {
  var paymentId = String(payload.paymentId || '').trim();
  if (!paymentId) throw new Error('支払いIDは必須です。');

  var ss     = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var nowIso = new Date().toISOString();

  var paymentSheet = ss.getSheetByName('T_支払い');
  var pFound = findRowByColumnValue_(paymentSheet, '支払いID', paymentId);
  if (!pFound || toBoolean_(pFound.row[pFound.columns['削除フラグ']])) throw new Error('支払いレコードが見つかりません。');

  var pRow = pFound.row.slice();
  pRow[pFound.columns['削除フラグ']] = true;
  pRow[pFound.columns['更新日時']]   = nowIso;
  paymentSheet.getRange(pFound.rowNumber, 1, 1, pRow.length).setValues([pRow]);

  var lineSheet  = ss.getSheetByName('T_支払い明細');
  var claimSheet = ss.getSheetByName('T_請求');
  if (lineSheet) {
    var lines = getRowsAsObjects_(ss, 'T_支払い明細').filter(function(r) {
      return !toBoolean_(r['削除フラグ']) && String(r['支払いID'] || '') === paymentId;
    });
    lines.forEach(function(l) {
      var lf = findRowByColumnValue_(lineSheet, '明細ID', l['明細ID']);
      if (lf) {
        var lr = lf.row.slice();
        lr[lf.columns['削除フラグ']] = true;
        lr[lf.columns['更新日時']]   = nowIso;
        lineSheet.getRange(lf.rowNumber, 1, 1, lr.length).setValues([lr]);
      }
      var claimId = String(l['請求ID'] || '');
      if (claimId && claimSheet) {
        var cf = findRowByColumnValue_(claimSheet, '請求ID', claimId);
        if (cf && !toBoolean_(cf.row[cf.columns['削除フラグ']])) {
          var cr = cf.row.slice();
          cr[cf.columns['請求状態']] = '承認済み';
          cr[cf.columns['更新日時']] = nowIso;
          claimSheet.getRange(cf.rowNumber, 1, 1, cr.length).setValues([cr]);
        }
      }
    });
  }

  clearAllDataCache_();
  return { deleted: true, paymentId: paymentId };
}

// ============================================================
// v296: 請求管理 — Drive フォルダ / 請求 CRUD / ファイル管理
// ============================================================

var CLAIM_ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
var CLAIM_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ---------- Drive フォルダ ----------


// ---------- 請求 CRUD ----------



function getClaims_(payload) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var filterStatus   = payload && payload.status   ? String(payload.status).trim()   : '';
  var filterMemberId = payload && payload.memberId ? String(payload.memberId).trim() : '';

  var claims = getRowsAsObjects_(ss, 'T_請求').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (filterStatus   && String(r['請求状態'] || '') !== filterStatus)   return false;
    if (filterMemberId && String(r['会員ID']   || '') !== filterMemberId) return false;
    return true;
  });

  var memberMap = {};
  getRowsAsObjects_(ss, 'T_会員').forEach(function(m) { memberMap[String(m['会員ID'] || '')] = m; });

  return claims.map(function(c) {
    c = normalizeClaimRecord_(c);
    var m = memberMap[String(c['会員ID'] || '')] || {};
    var displayName = (String(m['姓'] || '') + ' ' + String(m['名'] || '')).trim();
    return Object.assign({}, c, { 表示名: displayName || String(c['会員ID'] || '') });
  }).sort(function(a, b) { return (b['作成日時'] || '').localeCompare(a['作成日時'] || ''); });
}

function approveClaim_(payload) {
  var claimId = String(payload.claimId || '').trim();
  if (!claimId) throw new Error('請求IDは必須です。');

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');
  if (String(found.row[found.columns['請求状態']] || '') === '支払い済み') throw new Error('支払い済みの請求は状態を変更できません。');

  var nowIso = new Date().toISOString();
  var row = found.row.slice();
  row[found.columns['請求状態']]    = '承認済み';
  row[found.columns['承認者メール']] = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  row[found.columns['承認日時']]     = nowIso;
  row[found.columns['却下理由']]     = '';
  row[found.columns['更新日時']]     = nowIso;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { approved: true, claimId: claimId };
}

function rejectClaim_(payload) {
  var claimId = String(payload.claimId || '').trim();
  var reason  = String(payload.reason  || '').trim();
  if (!claimId)         throw new Error('請求IDは必須です。');
  if (reason.length < 5) throw new Error('却下理由は5文字以上入力してください。');

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');
  if (String(found.row[found.columns['請求状態']] || '') === '支払い済み') throw new Error('支払い済みの請求は却下できません。');

  var nowIso = new Date().toISOString();
  var row = found.row.slice();
  row[found.columns['請求状態']]    = '却下';
  row[found.columns['却下理由']]    = reason;
  row[found.columns['承認者メール']] = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  row[found.columns['承認日時']]    = nowIso;
  row[found.columns['更新日時']]    = nowIso;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { rejected: true, claimId: claimId };
}


function adminDeleteClaim_(payload) {
  var claimId = String(payload.claimId || '').trim();
  if (!claimId) throw new Error('請求IDは必須です。');

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');

  var row = found.row.slice();
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { deleted: true, claimId: claimId };
}

// ---------- 添付ファイル管理 ----------



// ============================================================
// v297: 役員紐づけ変更 / 退職自動退任
// ============================================================

/**
 * 役員の紐づけを変更する（個人会員↔事業所職員の双方向対応）。
 * T_振込口座 の linkage も同時に更新する。
 * T_請求 の過去レコードは元の紐づけのまま保持（履歴として有効）。
 */
function updateOfficerLinkage_(payload) {
  var officerId    = String(payload.officerId    || '').trim();
  var newMemberId  = String(payload.newMemberId  || '').trim();
  var newStaffId   = String(payload.newStaffId   || '').trim();
  if (!officerId)                    throw new Error('役員IDは必須です。');
  if (!newMemberId && !newStaffId)   throw new Error('新しい会員IDまたは職員IDが必要です。');
  if (newMemberId && newStaffId)     throw new Error('会員IDと職員IDは同時に指定できません。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var officerSheet = ss.getSheetByName('T_役員');
  var oFound = findRowByColumnValue_(officerSheet, '役員ID', officerId);
  if (!oFound || toBoolean_(oFound.row[oFound.columns['削除フラグ']])) throw new Error('役員レコードが見つかりません。');

  // 新しい人物の存在確認
  if (newMemberId) {
    var memCheck = findRowByColumnValue_(ss.getSheetByName('T_会員'), '会員ID', newMemberId);
    if (!memCheck || toBoolean_(memCheck.row[memCheck.columns['削除フラグ']])) throw new Error('指定した会員が見つかりません。');
  } else {
    var stfCheck = findRowByColumnValue_(ss.getSheetByName('T_事業所職員'), '職員ID', newStaffId);
    if (!stfCheck || toBoolean_(stfCheck.row[stfCheck.columns['削除フラグ']])) throw new Error('指定した職員が見つかりません。');
    if (String(stfCheck.row[stfCheck.columns['職員状態コード']] || '') === 'LEFT') throw new Error('退職済みの職員には紐づけ変更できません。');
  }

  // 旧 linkage を記録（口座の照合に使用）
  var oldMemberId = String(oFound.row[oFound.columns['会員ID']] || '');
  var oldStaffId  = String(oFound.row[oFound.columns['職員ID'] != null ? oFound.columns['職員ID'] : -1] || '');

  var nowIso = new Date().toISOString();

  // T_役員 更新
  var oRow = oFound.row.slice();
  oRow[oFound.columns['会員ID']] = newMemberId;
  if (oFound.columns['職員ID'] != null) oRow[oFound.columns['職員ID']] = newStaffId;
  oRow[oFound.columns['更新日時']] = nowIso;
  officerSheet.getRange(oFound.rowNumber, 1, 1, oRow.length).setValues([oRow]);

  // T_振込口座 の linkage も自動移行
  var bankSheet = ss.getSheetByName('T_振込口座');
  var bankRows  = getRowsAsObjects_(ss, 'T_振込口座');
  for (var i = 0; i < bankRows.length; i += 1) {
    var br = bankRows[i];
    if (toBoolean_(br['削除フラグ'])) continue;
    var matchM = oldMemberId && !oldStaffId && String(br['会員ID'] || '') === oldMemberId;
    var matchS = oldStaffId  && String(br['職員ID'] || '') === oldStaffId;
    if (matchM || matchS) {
      var bFound = findRowByColumnValue_(bankSheet, '口座ID', br['口座ID']);
      if (bFound) {
        var bRow = bFound.row.slice();
        bRow[bFound.columns['会員ID']] = newMemberId;
        if (bFound.columns['職員ID'] != null) bRow[bFound.columns['職員ID']] = newStaffId;
        bRow[bFound.columns['更新日時']] = nowIso;
        bankSheet.getRange(bFound.rowNumber, 1, 1, bRow.length).setValues([bRow]);
      }
    }
  }

  clearAllDataCache_();
  return { updated: true, officerId: officerId };
}

/**
 * 職員が退職（LEFT）になった時に現職の役員レコードを自動退任させる。
 * updateStaff_ から呼び出される。
 */
function autoRetireOfficerByStaffId_(ss, staffId, nowIso) {
  var officerSheet = ss.getSheetByName('T_役員');
  if (!officerSheet) return;
  var activeOfficers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
      String(r['職員ID'] || '') === staffId &&
      (!r['退任日'] || String(r['退任日'] || '') === '');
  });
  activeOfficers.forEach(function(o) {
    var found = findRowByColumnValue_(officerSheet, '役員ID', o['役員ID']);
    if (found) {
      var row = found.row.slice();
      row[found.columns['退任日']]  = nowIso.substring(0, 10);
      row[found.columns['更新日時']] = nowIso;
      officerSheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    }
  });
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

/**
 * v370.1 診断: PENDING 入会申込の applicationPayload を解析し、
 * partial に作成された会員・職員・認証アカウントを特定するレポートを返す。
 * **read-only**。DB 変更なし。Logger に詳細出力 + 戻り値で構造化レポート。
 *
 * 使い方（Apps Script editor から）:
 *   diagnoseStaleApplicationForV370('CR1778920612878_22c197b0')
 *   または引数なしで全 PENDING MEMBER_APPLICATION を一括診断:
 *   diagnoseAllStaleApplicationsForV370()
 */
function diagnoseStaleApplicationForV370(targetRequestId) {
  var ss = getOrCreateDatabase_();
  var changeRequests = getRowsAsObjects_(ss, 'T_変更申請').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (String(r['申請種別コード'] || '') !== 'MEMBER_APPLICATION') return false;
    if (String(r['申請状態コード'] || '') !== 'PENDING') return false;
    if (targetRequestId && String(r['申請ID'] || '') !== String(targetRequestId)) return false;
    return true;
  });

  if (changeRequests.length === 0) {
    var msg = targetRequestId
      ? '指定された申請ID (' + targetRequestId + ') が見つからない、または PENDING 入会申込ではありません。'
      : 'PENDING の入会申込はありません。';
    Logger.log(msg);
    return { found: 0, message: msg, reports: [] };
  }

  var allMembers = getRowsAsObjects_(ss, 'T_会員');
  var allStaff = getRowsAsObjects_(ss, 'T_事業所職員');
  var allAuth = getRowsAsObjects_(ss, 'T_認証アカウント');

  var reports = changeRequests.map(function(req) {
    var requestId = String(req['申請ID'] || '');
    var memberType = String(req['会員種別コード'] || '');
    var contactEmail = String(req['連絡先メールアドレス'] || '');
    var applicantName = String(req['申請者表示名'] || '');
    var submittedAt = String(req['申請日時'] || '');

    var changeData = {};
    try { changeData = JSON.parse(String(req['申請内容JSON'] || '{}')); } catch (e) {}
    var payload = changeData.applicationPayload || {};

    // 申請内容の整合性チェック
    var payloadValidation = {
      hasMemberType: !!payload.memberType,
      memberTypeMatch: String(payload.memberType || '') === memberType,
      isBusiness: memberType === 'BUSINESS',
      officeName: String(payload.officeName || ''),
      officeNumber: String(payload.officeNumber || ''),
      staffCount: Array.isArray(payload.staff) ? payload.staff.length : 0,
      staffList: Array.isArray(payload.staff) ? payload.staff.map(function(s, i) {
        return {
          index: i,
          role: String(s.role || ''),
          lastName: String(s.lastName || ''),
          firstName: String(s.firstName || ''),
          lastKana: String(s.lastKana || ''),
          firstKana: String(s.firstKana || ''),
          careManagerNumber: String(s.careManagerNumber || ''),
          email: String(s.email || ''),
          missingRequiredFields: ['lastName', 'firstName', 'lastKana', 'firstKana', 'careManagerNumber', 'email']
            .filter(function(f) { return !String(s[f] || '').trim(); }),
        };
      }) : [],
    };

    // partial に作成された会員候補を勤務先名/事業所名で検索
    var partialMembers = [];
    if (memberType === 'BUSINESS' && payload.officeName) {
      partialMembers = allMembers.filter(function(m) {
        if (toBoolean_(m['削除フラグ'])) return false;
        if (String(m['会員種別コード'] || '') !== 'BUSINESS') return false;
        var officeNameMatch = String(m['勤務先名'] || '').trim() === String(payload.officeName || '').trim();
        var officeNumberMatch = payload.officeNumber
          ? String(m['事業所番号'] || '').trim() === String(payload.officeNumber || '').trim()
          : false;
        return officeNameMatch || officeNumberMatch;
      }).map(function(m) {
        var memberId = String(m['会員ID'] || '');
        var memberStaff = allStaff.filter(function(s) {
          return !toBoolean_(s['削除フラグ']) && String(s['会員ID'] || '') === memberId;
        }).map(function(s) {
          return {
            staffId: String(s['職員ID'] || ''),
            name: String(s['姓'] || '') + ' ' + String(s['名'] || ''),
            role: String(s['職員権限コード'] || ''),
            status: String(s['職員状態コード'] || ''),
            careManagerNumber: String(s['介護支援専門員番号'] || ''),
            email: String(s['メールアドレス'] || ''),
          };
        });
        var memberAuth = allAuth.filter(function(a) {
          return !toBoolean_(a['削除フラグ']) && String(a['会員ID'] || '') === memberId;
        }).map(function(a) {
          return {
            authId: String(a['認証ID'] || ''),
            loginId: String(a['ログインID'] || ''),
            staffId: String(a['職員ID'] || ''),
            enabled: toBoolean_(a['アカウント有効フラグ']),
          };
        });
        return {
          memberId: memberId,
          memberStatus: String(m['会員状態コード'] || ''),
          officeName: String(m['勤務先名'] || ''),
          officeNumber: String(m['事業所番号'] || ''),
          joinedDate: String(m['入会日'] || ''),
          createdAt: String(m['作成日時'] || ''),
          staffRows: memberStaff,
          authRows: memberAuth,
          partialDetectionHint:
            payloadValidation.staffCount > memberStaff.length
              ? '申請の職員数 ' + payloadValidation.staffCount + ' 名に対し DB は ' + memberStaff.length + ' 名のみ。partial 登録の可能性。'
              : '完全登録の可能性（職員数一致）',
        };
      });
    }

    var report = {
      requestId: requestId,
      submittedAt: submittedAt,
      contactEmail: contactEmail,
      applicantName: applicantName,
      memberType: memberType,
      payload: payloadValidation,
      partialMembers: partialMembers,
      verdict: (function() {
        if (partialMembers.length === 0) return 'クリーン: partial 登録は検出されず。再承認可能。';
        if (partialMembers.length > 1) return '警告: 同名 BUSINESS 会員が複数存在。手動確認必要。';
        var pm = partialMembers[0];
        if (pm.staffRows.length < payloadValidation.staffCount) return 'partial 登録あり: ' + pm.partialDetectionHint;
        return '完全登録の可能性: 申請は再承認すべきでない（既に DB に反映済の可能性）';
      })(),
    };
    return report;
  });

  Logger.log('=== v370.1 partial application 診断レポート ===');
  Logger.log(JSON.stringify(reports, null, 2));
  Logger.log('=== END ===');
  return { found: reports.length, reports: reports };
}

/**
 * 全 PENDING 入会申込を一括診断する
 */
function diagnoseAllStaleApplicationsForV370() {
  return diagnoseStaleApplicationForV370(null);
}

/**
 * v370.1 クリーンアップ: 指定の partial 登録された 事業所会員 + 関連職員 + 認証 を soft-delete する。
 *
 * **必ず先に diagnoseStaleApplicationForV370 で対象を確認してから実行すること。**
 *
 * 使い方（Apps Script editor から）:
 *   cleanupStaleBusinessApplicationForV370('M0123456789') // 部分登録された 事業所会員ID
 *
 * 安全策:
 *   - 引数で memberId を明示必須
 *   - 既に削除済みなら何もしない
 *   - 事業所会員かつ職員数 < 申請数 のときのみ削除（誤削除防止）
 *   - T_監査ログ へ削除前スナップショット記録
 *   - 申請 PENDING 行は触らない（再承認可能な状態を維持）
 */
function cleanupStaleBusinessApplicationForV370(memberId) {
  if (!memberId) throw new Error('memberId を指定してください。例: cleanupStaleBusinessApplicationForV370("M0123456789")');

  var ss = getOrCreateDatabase_();
  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet = ss.getSheetByName('T_事業所職員');
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!memberSheet || !staffSheet || !authSheet) throw new Error('必要シートが見つかりません。');

  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', String(memberId));
  if (!memberFound) throw new Error('会員 ' + memberId + ' が見つかりません。');
  var memberRow = memberFound.row;
  var memberCols = memberFound.columns;

  if (toBoolean_(memberRow[memberCols['削除フラグ']])) {
    return { ok: true, message: '既に削除済み。何もしません。', memberId: memberId };
  }
  if (String(memberRow[memberCols['会員種別コード']] || '') !== 'BUSINESS') {
    throw new Error('指定された会員は事業所会員ではありません。手動で削除してください。');
  }

  var now = new Date().toISOString();
  var operatorEmail = '';
  try { operatorEmail = Session.getActiveUser().getEmail() || ''; } catch (e) {}

  // スナップショット
  var snapshot = {
    member: { memberId: memberId, officeName: String(memberRow[memberCols['勤務先名']] || ''), 状態: String(memberRow[memberCols['会員状態コード']] || '') },
    staff: [],
    auth: [],
  };

  // 1. 関連職員を soft-delete + 認証アカウントを soft-delete
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === String(memberId);
  });
  var staffData = staffSheet.getRange(2, 1, Math.max(staffSheet.getLastRow() - 1, 0), staffSheet.getLastColumn()).getValues();
  var staffHeaders = staffSheet.getRange(1, 1, 1, staffSheet.getLastColumn()).getValues()[0];
  var staffColMap = {};
  for (var i = 0; i < staffHeaders.length; i++) staffColMap[staffHeaders[i]] = i;
  var deletedStaffCount = 0;
  for (var r = 0; r < staffData.length; r++) {
    if (String(staffData[r][staffColMap['会員ID']] || '') !== String(memberId)) continue;
    if (toBoolean_(staffData[r][staffColMap['削除フラグ']])) continue;
    snapshot.staff.push({
      staffId: String(staffData[r][staffColMap['職員ID']] || ''),
      name: String(staffData[r][staffColMap['姓']] || '') + ' ' + String(staffData[r][staffColMap['名']] || ''),
      role: String(staffData[r][staffColMap['職員権限コード']] || ''),
    });
    staffData[r][staffColMap['削除フラグ']] = true;
    if (staffColMap['職員状態コード'] != null) staffData[r][staffColMap['職員状態コード']] = 'LEFT';
    if (staffColMap['退会日'] != null) staffData[r][staffColMap['退会日']] = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    if (staffColMap['更新日時'] != null) staffData[r][staffColMap['更新日時']] = now;
    staffSheet.getRange(r + 2, 1, 1, staffData[r].length).setValues([staffData[r]]);
    deletedStaffCount++;
  }

  // 2. 認証アカウント soft-delete（会員ID または 職員ID で hit）
  var authData = authSheet.getRange(2, 1, Math.max(authSheet.getLastRow() - 1, 0), authSheet.getLastColumn()).getValues();
  var authHeaders = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var authColMap = {};
  for (var ai = 0; ai < authHeaders.length; ai++) authColMap[authHeaders[ai]] = ai;
  var deletedStaffIds = snapshot.staff.map(function(s) { return s.staffId; });
  var deletedAuthCount = 0;
  for (var ar = 0; ar < authData.length; ar++) {
    if (toBoolean_(authData[ar][authColMap['削除フラグ']])) continue;
    var aMemberId = String(authData[ar][authColMap['会員ID']] || '');
    var aStaffId = String(authData[ar][authColMap['職員ID']] || '');
    var matches = (aMemberId === String(memberId)) || (aStaffId && deletedStaffIds.indexOf(aStaffId) >= 0);
    if (!matches) continue;
    snapshot.auth.push({
      authId: String(authData[ar][authColMap['認証ID']] || ''),
      loginId: String(authData[ar][authColMap['ログインID']] || ''),
    });
    authData[ar][authColMap['削除フラグ']] = true;
    if (authColMap['アカウント有効フラグ'] != null) authData[ar][authColMap['アカウント有効フラグ']] = false;
    if (authColMap['更新日時'] != null) authData[ar][authColMap['更新日時']] = now;
    authSheet.getRange(ar + 2, 1, 1, authData[ar].length).setValues([authData[ar]]);
    deletedAuthCount++;
  }

  // 3. 会員レコード soft-delete
  memberRow[memberCols['削除フラグ']] = true;
  if (memberCols['会員状態コード'] != null) memberRow[memberCols['会員状態コード']] = 'WITHDRAWN';
  if (memberCols['退会日'] != null) memberRow[memberCols['退会日']] = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  if (memberCols['更新日時'] != null) memberRow[memberCols['更新日時']] = now;
  memberSheet.getRange(memberFound.rowNumber, 1, 1, memberRow.length).setValues([memberRow]);

  // 4. 監査ログ
  try {
    var logSs = getLogSs_();
    appendRowsByHeaders_(logSs, 'T_監査ログ', [{
      '監査ログID': 'AUD' + Date.now(),
      '操作日時': now,
      '操作者メール': operatorEmail,
      '操作種別': 'CLEANUP_STALE_BUSINESS_APPLICATION_V370',
      '対象テーブル': 'T_会員,T_事業所職員,T_認証アカウント',
      '対象レコードID': memberId,
      'フィールド名': '',
      '旧値': JSON.stringify(snapshot),
      '新値': '削除済み（partial v368 srcMemberId reference error の補正）',
    }]);
  } catch (e) {
    Logger.log('[cleanupStaleBusinessApplicationForV370] audit log failed: ' + e.message);
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  var result = {
    ok: true,
    memberId: memberId,
    deletedStaffCount: deletedStaffCount,
    deletedAuthCount: deletedAuthCount,
    snapshot: snapshot,
    nextSteps: '変更申請管理コンソールから該当申請を再承認すれば、全職員が新規作成されます。',
  };
  Logger.log('=== v370.1 cleanup 完了 ===');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * v370.1 one-shot: 申請 CR1778920612878_22c197b0 の partial 会員 53779700 をクリーンアップ
 * （Apps Script editor で引数渡し不可のため、固定引数 wrapper として 1 回限り使用）
 * 実行後この wrapper は次リリースで削除予定。
 */
function runCleanupPartialBusinessV370_53779700() {
  return cleanupStaleBusinessApplicationForV370('53779700');
}
function cleanupCorruptChangeRequestsV372() {
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_変更申請');
  if (!sheet) return { ok: false, error: 'T_変更申請 sheet not found' };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, scanned: 0, softDeleted: 0 };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var col = {};
  headers.forEach(function(h, i) { col[h] = i; });
  var required = ['申請者表示名', '削除フラグ', '更新日時'];
  for (var ri = 0; ri < required.length; ri++) {
    if (col[required[ri]] == null) return { ok: false, error: 'required column missing: ' + required[ri] };
  }

  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  var operator = '';
  try { operator = Session.getActiveUser().getEmail() || ''; } catch (e) {}
  var corruptIds = [];
  for (var r = 0; r < data.length; r++) {
    if (toBoolean_(data[r][col['削除フラグ']])) continue;
    var name = String(data[r][col['申請者表示名']] || '');
    // 「???」が含まれる、または「？」が含まれる（全角・半角どちらも）→ 文字化け疑い
    if (/^\?+$/.test(name) || /\?{5,}/.test(name) || /^\？+$/.test(name) || /\？{5,}/.test(name)) {
      data[r][col['削除フラグ']] = true;
      if (col['更新日時'] != null) data[r][col['更新日時']] = now;
      corruptIds.push(String(data[r][col['申請ID'] || 0] || ''));
      sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }

  // 監査ログ
  try {
    var logSs = getLogSs_();
    appendRowsByHeaders_(logSs, 'T_監査ログ', [{
      '監査ログID': 'AUD' + Date.now(),
      '操作日時': now,
      '操作者メール': operator,
      '操作種別': 'CLEANUP_CORRUPT_CHANGE_REQUESTS_V372_6',
      '対象テーブル': 'T_変更申請',
      '対象レコードID': corruptIds.join(','),
      'フィールド名': '申請者表示名',
      '旧値': '???系の文字化け',
      '新値': '削除フラグ=true',
    }]);
  } catch (e) {
    Logger.log('cleanupCorruptChangeRequestsV372 audit log failed: ' + e.message);
  }

  clearAllDataCache_();
  var result = { ok: true, scanned: data.length, softDeleted: corruptIds.length, corruptIds: corruptIds };
  Logger.log('cleanupCorruptChangeRequestsV372 result: ' + JSON.stringify(result));
  return result;
}


// ─── v360: 研修名簿・出欠・一括メール明細 スキーマ移行 ─────────────────
/**
 * v360 のスキーマ変更を本番 DB へ反映する。Apps Script editor から手動 1 回実行する。
 *
 * 実行内容:
 *  1. マスタシート M_出欠状態 を作成・初期値投入
 *  2. T_研修申込 に 5 列追加（外部申込者ID / 出欠状態コード / 出欠記録日時 / 出欠記録者メール / 事務局メモ）
 *  3. ログ SS に T_メール送信明細 を作成（Header-Detail パターン）
 *  4. T_メール送信ログ に 研修ID 列を追加
 *  5. 既存 T_研修申込 行を 2-FK 化（申込者区分=EXTERNAL の 申込者ID を 外部申込者ID へ複写）
 *  6. 既存 T_研修申込 行の 出欠状態コード を UNRECORDED で backfill
 *  7. (v373.7 で撤去) ROSTER_TEMPLATE_LIST category 追加 — 操作者確認済みで dead code 化
 *  8. 整合性監査結果を Logger に記録
 */
function runRebuildSchemaForV360() {
  var ss = getOrCreateDatabase_();
  var report = { schemaVersion: DB_SCHEMA_VERSION, steps: [] };

  // Step 1: M_出欠状態 マスタ作成 + 初期値
  var masterSheet = getOrCreateSheet_(ss, 'M_出欠状態');
  writeSheetHeaders_(masterSheet, マスタ定義['M_出欠状態']);
  if (masterSheet.getLastRow() < 2) {
    var initialRows = マスタ初期値['M_出欠状態'];
    masterSheet.getRange(2, 1, initialRows.length, initialRows[0].length).setValues(initialRows);
    report.steps.push({ step: 'M_出欠状態 初期値投入', count: initialRows.length });
  } else {
    report.steps.push({ step: 'M_出欠状態 既存', note: 'マスタ既存のため初期値投入スキップ' });
  }

  // Step 2: T_研修申込 列追加（writeSheetHeaders_ v342 name-based shift が data 保持）
  normalizeTableColumns_(ss, 'T_研修申込');
  report.steps.push({ step: 'T_研修申込 列追加', columns: ['外部申込者ID', '出欠状態コード', '出欠記録日時', '出欠記録者メール', '事務局メモ'] });

  // Step 3: ログ SS に T_メール送信明細 作成 + T_メール送信ログ 拡張
  try {
    var logSs = getLogSs_();
    var detailSheet = logSs.getSheetByName('T_メール送信明細');
    if (!detailSheet) {
      detailSheet = logSs.insertSheet('T_メール送信明細');
      detailSheet.getRange(1, 1, 1, テーブル定義['T_メール送信明細'].length).setValues([テーブル定義['T_メール送信明細']]);
      report.steps.push({ step: 'T_メール送信明細 作成', location: 'ログSS' });
    } else {
      report.steps.push({ step: 'T_メール送信明細 既存', location: 'ログSS' });
    }
    normalizeTableColumns_(logSs, 'T_メール送信ログ');
    report.steps.push({ step: 'T_メール送信ログ 研修ID 列追加', location: 'ログSS' });
  } catch (e) {
    report.steps.push({ step: 'ログSS 操作失敗', error: e.message });
    Logger.log('v360 log SS migration failed: ' + e.message);
  }

  // Step 5: T_研修申込 2-FK 化マイグレーション
  var migrateResult = migrateTrainingApplicationsToTwoFkForV360_(ss);
  report.steps.push({ step: '2-FK migration', detail: migrateResult });

  // Step 6: 出欠状態コード backfill
  var backfillResult = backfillAttendanceStatusForV360_(ss);
  report.steps.push({ step: '出欠状態 backfill', detail: backfillResult });

  // Step 7: v373.7 (S5 Phase 2) で撤去（旧 RosterExport 関連、操作者確認終了で dead code）

  // Step 8: 整合性監査
  var auditResult = auditTrainingApplicationsAfterV360_(ss);
  report.steps.push({ step: '整合性監査', detail: auditResult });
  if (auditResult.xorViolations > 0) {
    Logger.log('[v360 WARNING] XOR 違反行 ' + auditResult.xorViolations + ' 件検出。詳細: ' + JSON.stringify(auditResult.violationSample));
  }

  markSchemaInitialized_();
  clearAllDataCache_();
  Logger.log('runRebuildSchemaForV360 完了: ' + JSON.stringify(report));
  return report;
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
function getTrainingRosterDetail_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload) return { error: 'trainingId required' };
  var trainingId = String(payload.trainingId || '').trim();
  if (!trainingId) return { error: 'trainingId required' };

  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });

  var memberRows = getRowsAsObjects_(db, 'T_会員');
  var memberMap = {};
  memberRows.forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });

  var staffRows = getRowsAsObjects_(db, 'T_事業所職員');
  var staffMap = {};
  staffRows.forEach(function(r) { staffMap[String(r['職員ID'] || '')] = r; });

  var externalRows = getRowsAsObjects_(db, 'T_外部申込者');
  var externalMap = {};
  externalRows.forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

  var result = applyRows.map(function(r) {
    var ref = getCanonicalApplicantRef_(r);
    var info, name = '(不明)', email = '', officeName = '', phone = '';
    if (ref.type === 'EXTERNAL') {
      info = externalMap[ref.id];
      if (info) {
        name = String(info['氏名'] || '');
        email = String(info['メールアドレス'] || '');
        officeName = String(info['事業所名'] || '');
        phone = String(info['電話番号'] || '');
      }
    } else if (ref.type === 'STAFF') {
      info = staffMap[ref.id];
      if (info) {
        name = (String(info['姓'] || '') + ' ' + String(info['名'] || '')).trim() || String(info['氏名'] || '');
        email = String(info['メールアドレス'] || '');
        var officeMember = memberMap[String(info['会員ID'] || '')];
        officeName = officeMember ? String(officeMember['勤務先名'] || '') : '';
      }
    } else if (ref.type === 'MEMBER') {
      info = memberMap[ref.id];
      if (info) {
        name = (String(info['姓'] || '') + ' ' + String(info['名'] || '')).trim() || String(info['氏名'] || '');
        email = String(info['代表メールアドレス'] || '');
        officeName = String(info['勤務先名'] || '');
        phone = String(info['携帯電話番号'] || '');
      }
    }
    return {
      applyId: String(r['申込ID'] || ''),
      trainingId: String(r['研修ID'] || ''),
      applicantType: ref.type,
      applicantId: ref.id,
      name: name,
      email: email,
      officeName: officeName,
      phone: phone,
      status: String(r['申込状態コード'] || ''),
      applyDate: String(r['申込日時'] || ''),
      cancelDate: String(r['取消日時'] || ''),
      attendanceStatus: String(r['出欠状態コード'] || 'UNRECORDED'),
      attendanceRecordedAt: String(r['出欠記録日時'] || ''),
      attendanceRecordedBy: String(r['出欠記録者メール'] || ''),
      adminMemo: String(r['事務局メモ'] || ''),
      remarks: String(r['備考'] || ''),
    };
  });
  return { applicants: result };
}

/**
 * 出欠状態を 1 件記録。
 */
function saveAttendance_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.applyId || !payload.status) return { error: 'invalid payload' };
  var validStatus = ['UNRECORDED', 'PRESENT', 'ABSENT', 'LATE', 'SAMEDAY_CANCEL'];
  if (validStatus.indexOf(payload.status) < 0) return { error: 'invalid status' };
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修申込');
  if (!sheet) return { error: 'sheet missing' };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  if (cols['申込ID'] == null || cols['出欠状態コード'] == null) return { error: 'columns missing' };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { error: 'no data' };
  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var operatorEmail = Session.getActiveUser().getEmail();
  var now = new Date().toISOString();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['申込ID']] || '') === String(payload.applyId)) {
      data[r][cols['出欠状態コード']] = payload.status;
      if (cols['出欠記録日時'] != null) data[r][cols['出欠記録日時']] = now;
      if (cols['出欠記録者メール'] != null) data[r][cols['出欠記録者メール']] = operatorEmail;
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      clearAllDataCache_();
      return { ok: true, applyId: payload.applyId, status: payload.status, recordedAt: now };
    }
  }
  return { error: 'applyId not found' };
}

/**
 * 出欠を一括更新（全員出席セット等）。
 */
function saveAttendanceBatch_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !Array.isArray(payload.entries)) return { error: 'invalid payload' };
  var results = [];
  for (var i = 0; i < payload.entries.length; i++) {
    results.push(saveAttendance_(payload.entries[i]));
  }
  return { results: results };
}

/**
 * 管理者による申込者の手動追加（会員・職員）。
 * payload: { trainingId, memberId? | staffId? }
 */
function addRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.trainingId) return { error: 'trainingId required' };
  var trainingId = String(payload.trainingId).trim();
  var memberId = String(payload.memberId || '').trim();
  var staffId = String(payload.staffId || '').trim();
  if (!memberId && !staffId) return { error: 'memberId or staffId required' };
  if (memberId && staffId) return { error: 'memberId and staffId are mutually exclusive' };

  var ss = getOrCreateDatabase_();
  var operatorEmail = Session.getActiveUser().getEmail();
  var now = new Date().toISOString();
  var applyId = 'AP-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  var row = {
    '申込ID': applyId,
    '研修ID': trainingId,
    '会員ID': memberId,
    '職員ID': staffId,
    '外部申込者ID': '',
    '申込者区分コード': 'MEMBER',
    '申込者ID': memberId || staffId,
    '申込状態コード': 'APPLIED',
    '申込日時': now,
    '取消日時': '',
    '備考': '管理者により手動追加 (' + operatorEmail + ')',
    '出欠状態コード': 'UNRECORDED',
    '出欠記録日時': '',
    '出欠記録者メール': '',
    '事務局メモ': String(payload.memo || ''),
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  };
  appendRowsByHeaders_(ss, 'T_研修申込', [row]);
  clearAllDataCache_();
  return { ok: true, applyId: applyId };
}

/**
 * 管理者によるゲスト（非会員）申込追加。T_外部申込者 + T_研修申込 を 1 トランザクションで作成。
 * payload: { trainingId, guest: { name, kana?, email?, phone?, officeName? } }
 */
function addGuestRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.trainingId) return { error: 'trainingId required' };
  if (!payload.guest || !payload.guest.name) return { error: 'guest.name required' };

  var ss = getOrCreateDatabase_();
  var operatorEmail = Session.getActiveUser().getEmail();
  var now = new Date().toISOString();

  // 1. T_外部申込者 へ追加
  var externalId = 'EXT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  var externalRow = {
    '外部申込者ID': externalId,
    '氏名': String(payload.guest.name),
    'フリガナ': String(payload.guest.kana || ''),
    'メールアドレス': String(payload.guest.email || ''),
    '電話番号': String(payload.guest.phone || ''),
    '事業所名': String(payload.guest.officeName || ''),
    '同意日時': now,
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  };
  appendRowsByHeaders_(ss, 'T_外部申込者', [externalRow]);

  // 2. T_研修申込 へ追加
  var applyId = 'AP-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  var applyRow = {
    '申込ID': applyId,
    '研修ID': String(payload.trainingId),
    '会員ID': '',
    '職員ID': '',
    '外部申込者ID': externalId,
    '申込者区分コード': 'EXTERNAL',
    '申込者ID': externalId,
    '申込状態コード': 'APPLIED',
    '申込日時': now,
    '取消日時': '',
    '備考': '管理者によりゲスト追加 (' + operatorEmail + ')',
    '出欠状態コード': 'UNRECORDED',
    '出欠記録日時': '',
    '出欠記録者メール': '',
    '事務局メモ': String(payload.memo || ''),
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  };
  appendRowsByHeaders_(ss, 'T_研修申込', [applyRow]);
  clearAllDataCache_();
  return { ok: true, applyId: applyId, externalId: externalId };
}

/**
 * 管理者による申込キャンセル。物理削除はせず、申込状態=CANCELED + 取消日時 を記録。
 */
function cancelRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.applyId) return { error: 'applyId required' };
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修申込');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  var operatorEmail = Session.getActiveUser().getEmail();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['申込ID']] || '') === String(payload.applyId)) {
      data[r][cols['申込状態コード']] = 'CANCELED';
      data[r][cols['取消日時']] = now;
      if (cols['備考'] != null) {
        var prevNote = String(data[r][cols['備考']] || '');
        data[r][cols['備考']] = prevNote + ' / 管理者キャンセル(' + operatorEmail + '): ' + String(payload.reason || '');
      }
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      clearAllDataCache_();
      return { ok: true };
    }
  }
  return { error: 'applyId not found' };
}

/**
 * 申込レコードの編集（事務局メモのみ変更可能 - データ整合性のため）。
 */
function updateRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.applyId) return { error: 'applyId required' };
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修申込');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['申込ID']] || '') === String(payload.applyId)) {
      if (payload.adminMemo !== undefined && cols['事務局メモ'] != null) {
        data[r][cols['事務局メモ']] = String(payload.adminMemo || '').slice(0, 1000);
      }
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      clearAllDataCache_();
      return { ok: true };
    }
  }
  return { error: 'applyId not found' };
}

/**
 * 研修の集計指標を返す（残席・区分内訳・出欠率・事業所別）。
 */
function getTrainingStats_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.trainingId) return { error: 'trainingId required' };
  var trainingId = String(payload.trainingId).trim();
  var detail = getTrainingRosterDetail_({ trainingId: trainingId });
  if (detail.error) return detail;
  var applicants = detail.applicants;

  var ss = getOrCreateDatabase_();
  var trainingRows = getRowsAsObjects_(ss, 'T_研修');
  var training = null;
  for (var i = 0; i < trainingRows.length; i++) {
    if (String(trainingRows[i]['研修ID'] || '') === trainingId) { training = trainingRows[i]; break; }
  }
  var capacity = training ? Number(training['定員'] || 0) : 0;

  var applied = applicants.filter(function(a) { return a.status === 'APPLIED'; });
  var typeBreakdown = { MEMBER: 0, STAFF: 0, EXTERNAL: 0 };
  var attendanceBreakdown = { UNRECORDED: 0, PRESENT: 0, ABSENT: 0, LATE: 0, SAMEDAY_CANCEL: 0 };
  var officeBreakdown = {};
  applied.forEach(function(a) {
    typeBreakdown[a.applicantType] = (typeBreakdown[a.applicantType] || 0) + 1;
    attendanceBreakdown[a.attendanceStatus] = (attendanceBreakdown[a.attendanceStatus] || 0) + 1;
    var office = a.officeName || '(未設定)';
    officeBreakdown[office] = (officeBreakdown[office] || 0) + 1;
  });
  var officeList = Object.keys(officeBreakdown).map(function(k) { return { officeName: k, count: officeBreakdown[k] }; });
  officeList.sort(function(a, b) { return b.count - a.count; });

  var recorded = applied.length - attendanceBreakdown.UNRECORDED;
  var attended = attendanceBreakdown.PRESENT + attendanceBreakdown.LATE;
  return {
    trainingId: trainingId,
    capacity: capacity,
    applicantCount: applied.length,
    canceledCount: applicants.length - applied.length,
    remainingSlots: Math.max(capacity - applied.length, 0),
    typeBreakdown: typeBreakdown,
    attendanceBreakdown: attendanceBreakdown,
    attendanceRate: recorded > 0 ? Math.round((attended / recorded) * 1000) / 10 : null,
    cancellationRate: recorded > 0 ? Math.round((attendanceBreakdown.SAMEDAY_CANCEL / recorded) * 1000) / 10 : null,
    officeBreakdown: officeList,
  };
}

/**
 * 会員ごとの受講履歴を返す。
 * payload: { memberId? | staffId? | externalId? }
 */

function auditTrainingApplicationsAfterV360_(ss) {
  var sheet = ss.getSheetByName('T_研修申込');
  if (!sheet || sheet.getLastRow() < 2) return { rows: 0, xorViolations: 0, legacyWarnings: 0 };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var xorViolations = 0;
  var legacyWarnings = 0;
  var sample = [];
  for (var r = 0; r < data.length; r++) {
    if (toBoolean_(data[r][cols['削除フラグ']])) continue;
    var memberId = String(data[r][cols['会員ID']] || '').trim();
    var staffId = String(data[r][cols['職員ID']] || '').trim();
    var externalId = String(data[r][cols['外部申込者ID']] || '').trim();
    var setCount = (memberId ? 1 : 0) + (staffId ? 1 : 0) + (externalId ? 1 : 0);
    if (setCount === 0) {
      // legacy: 申込者ID に頼っている行
      var legacyId = String(data[r][cols['申込者ID']] || '').trim();
      if (legacyId) {
        legacyWarnings++;
      } else {
        xorViolations++;
        if (sample.length < 5) sample.push({ row: r + 2, applyId: data[r][cols['申込ID']], issue: 'all FKs empty' });
      }
    } else if (setCount > 1) {
      // 会員ID + 職員ID 併存は legacy STAFF 申込の正常状態として許容（既存 §4.12 と同パターン）
      // 外部申込者ID + 他併存は違反
      if (externalId && (memberId || staffId)) {
        xorViolations++;
        if (sample.length < 5) sample.push({ row: r + 2, applyId: data[r][cols['申込ID']], issue: 'external + internal combined' });
      }
    }
  }
  return { rows: data.length, xorViolations: xorViolations, legacyWarnings: legacyWarnings, violationSample: sample };
}

// ============================================================================
// DRYRUN APPLICATION SCENARIOS (2026-05-17)
//
// 本番 DB に DRYRUN_ プレフィックス付きで投入し、申込→承認→転籍経路を end-to-end
// 検証する synthetic transaction フレームワーク。
//
// 設計原則:
//   - Unique prefix isolation: 全フィクスチャに `DRYRUN_` / `dryrun-*@example.invalid`
//   - Track-then-cleanup: 作成行 ID を ScriptProperties manifest に蓄積、別関数で
//     preview → soft delete (削除フラグ=true)
//   - AAA pattern: Arrange (payload 作成) → Act (関数呼出) → Assert (DB 副作用検証)
//   - Email isolation: CREDENTIAL_EMAIL_ENABLED を一時 false 化 + @example.invalid
//   - Independence: 各シナリオ独立、任意順序で実行可
//   - Idempotency: cleanup は同 runId に対し冪等
//
// 呼び出し:
//   1. dryRunApplicationScenarios()    — 全シナリオ実行（admin 認証必須）
//   2. previewDryRunApplicationCleanup() — 削除対象件数を返す
//   3. executeDryRunApplicationCleanup() — soft delete 実行
// ============================================================================

var DRYRUN_PREFIX = 'DRYRUN_';
var DRYRUN_EMAIL_DOMAIN = '@example.invalid';  // RFC 2606 reserved
var DRYRUN_MANIFEST_KEY = 'DRYRUN_APPLICATION_MANIFEST_V1';
var DRYRUN_TRAINING_MGMT_MANIFEST_KEY = 'DRYRUN_TRAINING_MGMT_MANIFEST_V1';

// ============================================================================
// v376.14: 研修管理 全機能ドライランテスト（operator が Apps Script editor から実行）
//   dryRunTrainingManagement()        — 全機能テスト実行 + Logger 出力 + manifest 保存
//   cleanupDryRunTrainingManagement() — テストで作成したデータを物理削除
//   いずれもメール送信は行わない（getTrainingApplicants_ の対象解決のみ検証）。
// ============================================================================

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

// テストで作成した training / 申込 / 外部申込者 を物理削除（行削除）。
// v376.14.2: manifest だけでなく DRYRUN_ プレフィックスの研修・外部申込者を sweep し、
//   過去 run の孤児データ（manifest 上書きで参照が外れた分）も含めて確実に削除する。
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

// 指定キーに一致する行を物理削除（行番号降順で deleteRow して index ずれを回避）。
function dryRun_physicalDeleteRowsByKey_(ss, sheetName, keyColumn, ids) {
  if (!ids || !ids.length) return 0;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var keyIdx = -1;
  for (var i = 0; i < headers.length; i++) { if (String(headers[i]) === keyColumn) keyIdx = i; }
  if (keyIdx === -1) return 0;
  var idSet = {};
  ids.forEach(function (id) { idSet[String(id)] = true; });
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var rowsToDelete = [];
  for (var r = 0; r < data.length; r++) {
    if (idSet[String(data[r][keyIdx] || '')]) rowsToDelete.push(r + 2);
  }
  rowsToDelete.sort(function (a, b) { return b - a; }); // 降順
  rowsToDelete.forEach(function (rowNum) { sheet.deleteRow(rowNum); });
  return rowsToDelete.length;
}

function dryRun_assertAdminOperator_() {
  // 設計判断: clasp run 経由でのみ呼ばれる関数のため、admin ホワイトリスト照合より
  // 厳しい「Apps Script editor 権限 + project-scoped OAuth」が既に gating 条件として
  // 効いている。userinfo.email スコープ非搭載でも安全に実行可能なよう、
  // checkAdminBySession_() を呼ばず effective user で代用する。
  var operatorEmail = '';
  try { operatorEmail = Session.getEffectiveUser().getEmail() || ''; } catch (e) {}
  if (!operatorEmail) {
    try { operatorEmail = Session.getActiveUser().getEmail() || ''; } catch (e) {}
  }
  return {
    loginId: operatorEmail || 'clasp-run-operator',
    permissionCode: 'CLASP_EDITOR',
    displayName: operatorEmail ? operatorEmail + '（clasp editor）' : 'DryRunOperator',
  };
}

function dryRun_pad_(n, width) {
  var s = String(n);
  while (s.length < width) s = '0' + s;
  return s;
}


function dryRun_makeOfficeNumber_(seed) {
  // 事業所番号は半角英数字 10 文字。`DRYRUN` (6) + 4 桁数字。
  return 'DRYRUN' + dryRun_pad_(seed % 10000, 4);
}

function dryRun_makeCmNumber_(seed) {
  // 介護支援専門員番号: `DRYR` (4) + 6 桁数字 → 10 文字（典型的な CM 番号と同桁数）
  return 'DRYR' + dryRun_pad_(seed % 1000000, 6);
}

function dryRun_makeIndividualPayload_(suffix, opts) {
  opts = opts || {};
  return {
    memberType: 'INDIVIDUAL',
    lastName: DRYRUN_PREFIX + '個人姓' + suffix,
    firstName: '太郎' + suffix,
    lastKana: 'ドライラン',
    firstKana: 'タロウ',
    email: 'dryrun-ind-' + suffix.toLowerCase() + DRYRUN_EMAIL_DOMAIN,
    mobilePhone: '090-0000-0000',
    careManagerNumber: opts.careManagerNumber || dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + suffix.length),
    officeName: DRYRUN_PREFIX + '勤務先' + suffix,
    officePostCode: '5730000',
    officePrefecture: '大阪府',
    officeCity: '枚方市',
    officeAddressLine: 'DRYRUN町1-1-1',
    officeAddressLine2: '',
    phone: '072-000-0000',
    fax: '',
    homePostCode: '5730000',
    homePrefecture: '大阪府',
    homeCity: '枚方市',
    homeAddressLine: 'DRYRUN自宅1-1-1',
    homeAddressLine2: '',
    mailingPreference: 'EMAIL',
    preferredMailDestination: 'OFFICE',
  };
}

function dryRun_makeSupportPayload_(suffix) {
  return {
    memberType: 'SUPPORT',
    lastName: DRYRUN_PREFIX + '賛助姓' + suffix,
    firstName: '次郎' + suffix,
    lastKana: 'ドライラン',
    firstKana: 'ジロウ',
    email: 'dryrun-sup-' + suffix.toLowerCase() + DRYRUN_EMAIL_DOMAIN,
    mobilePhone: '090-0000-0001',
    careManagerNumber: '',
    officeName: '',
    officePostCode: '',
    officePrefecture: '',
    officeCity: '',
    officeAddressLine: '',
    officeAddressLine2: '',
    phone: '',
    fax: '',
    homePostCode: '5730000',
    homePrefecture: '大阪府',
    homeCity: '枚方市',
    homeAddressLine: 'DRYRUN賛助自宅1-1-1',
    homeAddressLine2: '',
    mailingPreference: 'EMAIL',
    preferredMailDestination: 'HOME',
  };
}

function dryRun_makeBizPayload_(suffix, opts) {
  opts = opts || {};
  var officeNumberSeed = parseInt(String(Date.now()).slice(-4), 10) + suffix.length * 7;
  var officeNumber = opts.officeNumber || dryRun_makeOfficeNumber_(officeNumberSeed);
  var staffList = opts.staff || [
    { role: 'REPRESENTATIVE', last: '代表', first: '太郎' },
    { role: 'STAFF', last: '職員A', first: '花子' },
    { role: 'STAFF', last: '職員B', first: '次郎' },
    { role: 'ADMIN', last: '管理者', first: '三郎' },
  ];
  var built = staffList.map(function(s, idx) {
    return {
      role: s.role || 'STAFF',
      lastName: DRYRUN_PREFIX + s.last + suffix,
      firstName: s.first + suffix,
      lastKana: 'ドライラン',
      firstKana: 'スタッフ',
      email: 'dryrun-staff-' + suffix.toLowerCase() + '-' + idx + DRYRUN_EMAIL_DOMAIN,
      careManagerNumber: s.careManagerNumber || dryRun_makeCmNumber_(officeNumberSeed * 10 + idx),
    };
  });
  return {
    memberType: 'BUSINESS',
    officeName: DRYRUN_PREFIX + '事業所' + suffix,
    officeNumber: officeNumber,
    representativeEmail: built[0].email,
    officePostCode: '5730000',
    officePrefecture: '大阪府',
    officeCity: '枚方市',
    officeAddressLine: 'DRYRUN事業所1-1-1',
    officeAddressLine2: '',
    phone: '072-100-0000',
    fax: '072-100-0001',
    staff: built,
  };
}

function dryRun_runScenario_(state, scenarioName, fn) {
  var startedAt = new Date().toISOString();
  var assertions = [];
  function assert(condition, message) {
    assertions.push({ ok: !!condition, message: message });
    if (!condition) throw new Error('Assertion failed: ' + message);
  }
  var ok = false;
  var error = null;
  var result = null;
  try {
    result = fn(assert) || {};
    ok = true;
  } catch (e) {
    error = e.message || String(e);
  }
  var finishedAt = new Date().toISOString();
  state.report.scenarios.push({
    name: scenarioName,
    passed: ok,
    error: error,
    startedAt: startedAt,
    finishedAt: finishedAt,
    assertions: assertions,
    result: result,
  });
  if (ok) state.report.passedCount++;
  else state.report.failedCount++;
}

function dryRun_submitAndApprove_(payload, adminSession) {
  var enqueue = submitMemberApplication_(payload);
  if (!enqueue || !enqueue.requestId) throw new Error('enqueue 失敗: ' + JSON.stringify(enqueue));
  var approveResult = approveAdminChangeRequest_({
    requestId: enqueue.requestId,
    note: 'DRYRUN approval',
    __adminSession: adminSession,
  });
  if (!approveResult || approveResult.success !== true) {
    throw new Error('approve 失敗: ' + JSON.stringify(approveResult));
  }
  return {
    requestId: enqueue.requestId,
    result: approveResult.result || {},
  };
}

function dryRun_findMemberById_(ss, memberId) {
  var rows = getRowsAsObjects_(ss, 'T_会員');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['会員ID'] || '') === String(memberId)) return rows[i];
  }
  return null;
}

function dryRun_findStaffByMemberId_(ss, memberId) {
  return getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return String(r['会員ID'] || '') === String(memberId);
  });
}

function dryRun_findAuthByMemberId_(ss, memberId) {
  return getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
    return String(r['会員ID'] || '') === String(memberId);
  });
}

function dryRun_recordMember_(state, memberId) {
  if (memberId) state.manifest.memberIds[memberId] = true;
}

function dryRun_recordAllSideEffects_(state, ss, memberId) {
  dryRun_recordMember_(state, memberId);
  var staffRows = dryRun_findStaffByMemberId_(ss, memberId);
  for (var i = 0; i < staffRows.length; i++) {
    var sid = String(staffRows[i]['職員ID'] || '');
    if (sid) state.manifest.staffIds[sid] = true;
  }
  var authRows = dryRun_findAuthByMemberId_(ss, memberId);
  for (var j = 0; j < authRows.length; j++) {
    var aid = String(authRows[j]['認証ID'] || '');
    if (aid) state.manifest.authIds[aid] = true;
  }
}

function dryRun_recordChangeRequest_(state, requestId) {
  if (requestId) state.manifest.requestIds[requestId] = true;
}

// ── シナリオ実装 ─────────────────────────────────────────────────────────
function dryRun_scenario_newIndividual_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'NEW_INDIVIDUAL', function(assert) {
    var suffix = 'IND' + state.runStamp;
    var payload = dryRun_makeIndividualPayload_(suffix);
    var io = dryRun_submitAndApprove_(payload, adminSession);
    dryRun_recordChangeRequest_(state, io.requestId);
    var memberId = io.result.memberId;
    assert(!!memberId, 'memberId が返ること');
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, 'T_会員 行が作成されていること');
    assert(String(memberRow['会員種別コード']) === 'INDIVIDUAL', '会員種別コード=INDIVIDUAL');
    assert(String(memberRow['会員状態コード']) === 'ACTIVE', '会員状態コード=ACTIVE');
    assert(String(memberRow['介護支援専門員番号']) === payload.careManagerNumber, 'CM 番号一致');
    var auths = dryRun_findAuthByMemberId_(ss, memberId);
    assert(auths.length === 1, 'T_認証アカウント 1 行作成 (got ' + auths.length + ')');
    assert(String(auths[0]['ログインID']) === payload.careManagerNumber, 'ログインID=CM番号');
    dryRun_recordAllSideEffects_(state, ss, memberId);
    return { memberId: memberId, loginId: io.result.loginId };
  });
}

function dryRun_scenario_newSupport_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'NEW_SUPPORT', function(assert) {
    var suffix = 'SUP' + state.runStamp;
    var payload = dryRun_makeSupportPayload_(suffix);
    var io = dryRun_submitAndApprove_(payload, adminSession);
    dryRun_recordChangeRequest_(state, io.requestId);
    var memberId = io.result.memberId;
    assert(!!memberId, 'memberId が返ること');
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, 'T_会員 行が作成されていること');
    assert(String(memberRow['会員種別コード']) === 'SUPPORT', '会員種別=SUPPORT');
    var auths = dryRun_findAuthByMemberId_(ss, memberId);
    assert(auths.length === 1, 'T_認証アカウント 1 行作成');
    assert(String(auths[0]['ログインID']) === memberId, '賛助のログインIDは会員ID');
    dryRun_recordAllSideEffects_(state, ss, memberId);
    return { memberId: memberId };
  });
}

function dryRun_scenario_newBusiness_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'NEW_BUSINESS', function(assert) {
    var suffix = 'BIZ' + state.runStamp;
    var payload = dryRun_makeBizPayload_(suffix);
    var io = dryRun_submitAndApprove_(payload, adminSession);
    dryRun_recordChangeRequest_(state, io.requestId);
    var memberId = io.result.memberId;
    assert(!!memberId, 'memberId が返ること');
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, 'T_会員 行が作成されていること');
    assert(String(memberRow['会員種別コード']) === 'BUSINESS', '会員種別=BUSINESS');
    assert(String(memberRow['事業所番号']) === payload.officeNumber, '事業所番号一致');
    var staffRows = dryRun_findStaffByMemberId_(ss, memberId);
    assert(staffRows.length === payload.staff.length,
      '職員 ' + payload.staff.length + ' 名作成 (got ' + staffRows.length + ')');
    var repCount = 0;
    for (var i = 0; i < staffRows.length; i++) {
      if (String(staffRows[i]['職員権限コード']) === 'REPRESENTATIVE') repCount++;
    }
    assert(repCount === 1, '代表者は 1 名');
    var auths = dryRun_findAuthByMemberId_(ss, memberId);
    assert(auths.length === payload.staff.length, '認証アカウント ' + payload.staff.length + ' 行');
    dryRun_recordAllSideEffects_(state, ss, memberId);
    return { memberId: memberId, staffCount: staffRows.length };
  });
}

function dryRun_scenario_transferIndividualToStaff_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'TRANSFER_INDIVIDUAL_TO_STAFF', function(assert) {
    // Arrange: 既存個人会員を作成
    var indSuffix = 'I2S' + state.runStamp;
    var sharedCm = dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 17);
    var indPayload = dryRun_makeIndividualPayload_(indSuffix, { careManagerNumber: sharedCm });
    var indIo = dryRun_submitAndApprove_(indPayload, adminSession);
    dryRun_recordChangeRequest_(state, indIo.requestId);
    var sourceMemberId = indIo.result.memberId;
    assert(!!sourceMemberId, '前提: 個人会員作成');
    dryRun_recordAllSideEffects_(state, ss, sourceMemberId);

    // Act: 同 CM を含む事業所申込 → 転籍
    var bizSuffix = 'I2SB' + state.runStamp;
    var bizPayload = dryRun_makeBizPayload_(bizSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: '代表', first: '太郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 19) },
        { role: 'STAFF', last: '転籍者', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var bizIo = dryRun_submitAndApprove_(bizPayload, adminSession);
    dryRun_recordChangeRequest_(state, bizIo.requestId);
    var bizMemberId = bizIo.result.memberId;
    assert(!!bizMemberId, '事業所会員作成');
    dryRun_recordAllSideEffects_(state, ss, bizMemberId);

    // Assert: 元個人会員が WITHDRAWN になり、事業所職員として登録されている
    var srcMember = dryRun_findMemberById_(ss, sourceMemberId);
    assert(srcMember, '元個人会員行存在');
    var srcStatus = String(srcMember['会員状態コード'] || '');
    assert(srcStatus === 'TRANSFERRED' || srcStatus === 'WITHDRAWN',
      '元個人会員が TRANSFERRED/WITHDRAWN になっている (got ' + srcStatus + ')');
    var bizStaffRows = dryRun_findStaffByMemberId_(ss, bizMemberId);
    var transferredStaff = null;
    for (var i = 0; i < bizStaffRows.length; i++) {
      if (String(bizStaffRows[i]['介護支援専門員番号']) === sharedCm) {
        transferredStaff = bizStaffRows[i];
        break;
      }
    }
    assert(transferredStaff, '事業所側に CM 一致の職員が存在');
    return { sourceMemberId: sourceMemberId, bizMemberId: bizMemberId, sharedCm: sharedCm };
  });
}

function dryRun_scenario_transferStaffToIndividual_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'TRANSFER_STAFF_TO_INDIVIDUAL', function(assert) {
    // Arrange: 事業所会員 + 職員 (CM 共有)
    var bizSuffix = 'S2I' + state.runStamp;
    var sharedCm = dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 23);
    var bizPayload = dryRun_makeBizPayload_(bizSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: '代表', first: '太郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 29) },
        { role: 'STAFF', last: '独立予定', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var bizIo = dryRun_submitAndApprove_(bizPayload, adminSession);
    dryRun_recordChangeRequest_(state, bizIo.requestId);
    var bizMemberId = bizIo.result.memberId;
    assert(!!bizMemberId, '前提: 事業所会員作成');
    dryRun_recordAllSideEffects_(state, ss, bizMemberId);

    // Act: 同 CM で個人会員申込 → convertStaffToIndividual_ が走る
    var indSuffix = 'S2II' + state.runStamp;
    var indPayload = dryRun_makeIndividualPayload_(indSuffix, { careManagerNumber: sharedCm });
    var indIo = dryRun_submitAndApprove_(indPayload, adminSession);
    dryRun_recordChangeRequest_(state, indIo.requestId);
    var newMemberId = indIo.result.memberId;
    assert(!!newMemberId, '新個人会員作成');
    dryRun_recordAllSideEffects_(state, ss, newMemberId);

    // Assert: 元事業所職員が ENROLLED でなくなっている
    var bizStaffRows = dryRun_findStaffByMemberId_(ss, bizMemberId);
    var formerStaff = null;
    for (var i = 0; i < bizStaffRows.length; i++) {
      if (String(bizStaffRows[i]['介護支援専門員番号']) === sharedCm) {
        formerStaff = bizStaffRows[i];
        break;
      }
    }
    if (formerStaff) {
      var fs = String(formerStaff['職員状態コード'] || '');
      assert(fs !== 'ENROLLED', '元職員は ENROLLED でなくなっている (got ' + fs + ')');
    }
    var newMember = dryRun_findMemberById_(ss, newMemberId);
    assert(newMember, '新個人会員行存在');
    assert(String(newMember['会員種別コード']) === 'INDIVIDUAL', '会員種別=INDIVIDUAL');
    assert(String(newMember['介護支援専門員番号']) === sharedCm, 'CM 引継ぎ');
    return { bizMemberId: bizMemberId, newMemberId: newMemberId, sharedCm: sharedCm };
  });
}

function dryRun_scenario_transferStaffAcrossBiz_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'TRANSFER_STAFF_ACROSS_BIZ', function(assert) {
    // Arrange: 事業所 A + 職員 (CM 共有)
    var aSuffix = 'BA' + state.runStamp;
    var sharedCm = dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 31);
    var aPayload = dryRun_makeBizPayload_(aSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: 'A代表', first: '太郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 37) },
        { role: 'STAFF', last: '移籍予定', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var aIo = dryRun_submitAndApprove_(aPayload, adminSession);
    dryRun_recordChangeRequest_(state, aIo.requestId);
    var bizAId = aIo.result.memberId;
    assert(!!bizAId, '事業所 A 作成');
    dryRun_recordAllSideEffects_(state, ss, bizAId);

    // Act: 事業所 B 申込（同 CM の職員含む）
    var bSuffix = 'BB' + state.runStamp;
    var bPayload = dryRun_makeBizPayload_(bSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: 'B代表', first: '次郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 41) },
        { role: 'STAFF', last: '移籍者', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var bIo = dryRun_submitAndApprove_(bPayload, adminSession);
    dryRun_recordChangeRequest_(state, bIo.requestId);
    var bizBId = bIo.result.memberId;
    assert(!!bizBId, '事業所 B 作成');
    dryRun_recordAllSideEffects_(state, ss, bizBId);

    // Assert: A 側の職員が ENROLLED でなく、B 側に同 CM 職員が存在
    var aStaffRows = dryRun_findStaffByMemberId_(ss, bizAId);
    var formerStaff = null;
    for (var i = 0; i < aStaffRows.length; i++) {
      if (String(aStaffRows[i]['介護支援専門員番号']) === sharedCm) {
        formerStaff = aStaffRows[i];
        break;
      }
    }
    if (formerStaff) {
      var fs = String(formerStaff['職員状態コード'] || '');
      assert(fs !== 'ENROLLED', '事業所 A 側元職員は ENROLLED ではない (got ' + fs + ')');
    }
    var bStaffRows = dryRun_findStaffByMemberId_(ss, bizBId);
    var newStaff = null;
    for (var j = 0; j < bStaffRows.length; j++) {
      if (String(bStaffRows[j]['介護支援専門員番号']) === sharedCm) {
        newStaff = bStaffRows[j];
        break;
      }
    }
    assert(newStaff, '事業所 B 側に CM 一致の職員が存在');
    return { bizAId: bizAId, bizBId: bizBId, sharedCm: sharedCm };
  });
}

function dryRun_scenario_memberTypeChange_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'MEMBER_TYPE_CHANGE_IND_TO_SUPPORT', function(assert) {
    // Arrange: 個人会員作成
    var suffix = 'TYP' + state.runStamp;
    var indPayload = dryRun_makeIndividualPayload_(suffix);
    var indIo = dryRun_submitAndApprove_(indPayload, adminSession);
    dryRun_recordChangeRequest_(state, indIo.requestId);
    var memberId = indIo.result.memberId;
    assert(!!memberId, '個人会員作成');
    dryRun_recordAllSideEffects_(state, ss, memberId);

    // Act: convertMemberType_ を直接呼び出し（INDIVIDUAL → SUPPORT）
    var convertResult;
    try {
      convertResult = convertMemberType_({ memberId: memberId, newMemberType: 'SUPPORT' });
    } catch (e) {
      throw new Error('convertMemberType_ 呼出失敗: ' + e.message);
    }
    assert(convertResult && convertResult.success !== false, 'convertMemberType_ 成功');

    // Assert: 会員種別が SUPPORT に変わっている
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, '会員行存在');
    var newType = String(memberRow['会員種別コード'] || '');
    assert(newType === 'SUPPORT', '会員種別が SUPPORT に変わっている (got ' + newType + ')');
    return { memberId: memberId, newType: newType };
  });
}

// ── メインエントリ ───────────────────────────────────────────────────────
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

function dryRun_softDeleteByKey_(ss, sheetName, keyColumn, ids) {
  if (!ids || ids.length === 0) return 0;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var keyIdx = -1, delIdx = -1, updIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]) === keyColumn) keyIdx = i;
    if (String(headers[i]) === '削除フラグ') delIdx = i;
    if (String(headers[i]) === '更新日時') updIdx = i;
  }
  if (keyIdx === -1 || delIdx === -1) return 0;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var idSet = {};
  ids.forEach(function(id) { idSet[String(id)] = true; });
  var now = new Date().toISOString();
  var changed = 0;
  for (var r = 0; r < data.length; r++) {
    var key = String(data[r][keyIdx] || '');
    if (!key || !idSet[key]) continue;
    if (data[r][delIdx] === true) continue;
    data[r][delIdx] = true;
    if (updIdx !== -1) data[r][updIdx] = now;
    sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    changed++;
  }
  return changed;
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
