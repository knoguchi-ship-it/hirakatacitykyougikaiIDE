// gas-src/01_core_schema.gs — テーブル定義・マスタ定義・スキーマの整備・DB を開く。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

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
// 2026-10-25 docs/313: 公開ポータルの案内文の定型文。設定（T_システム設定）には選んだテンプレートID だけを持つ。
// 用途コードは SCREEN_TEXT_TEMPLATE_PURPOSES_。選択中・用途の最後の 1 件は削除できない（サーバーで止める）。
テーブル定義['T_画面文テンプレート'] = [
  'テンプレートID', '用途コード', '名前', '本文', '表示順', '作成日時', '更新日時', '削除フラグ',
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

function isTestDataName_(value) {
  return String(value || '').trim().indexOf(TEST_DATA_NAME_PREFIX) === 0;
}

function isTestDataEmail_(value) {
  var email = String(value || '').trim().toLowerCase();
  return email.length > TEST_DATA_EMAIL_DOMAIN.length
    && email.slice(email.length - TEST_DATA_EMAIL_DOMAIN.length) === TEST_DATA_EMAIL_DOMAIN;
}

// 個人会員・賛助会員は姓、事業所会員は事業所名（T_会員.勤務先名）に印を付ける。
// 事業所会員は入会申込の承認で代表メールアドレスが空になる（連絡先は代表者の職員が持つ）。
// 空のときだけ、代表者の職員のメールアドレスで見る（2026-10-25 の本番確認で、申込から作った★事業所が消せなかった）。
function isTestMemberRow_(row, representativeEmail) {
  var isBusiness = String(row['会員種別コード'] || '') === 'BUSINESS';
  var nameField = isBusiness ? row['勤務先名'] : row['姓'];
  var email = String(row['代表メールアドレス'] || '').trim();
  if (isBusiness && !email) email = String(representativeEmail || '');
  return isTestDataName_(nameField) && isTestDataEmail_(email);
}

function isTestStaffRow_(row) {
  var name = String(row['姓'] || '').trim() || String(row['氏名'] || '').trim();
  return isTestDataName_(name) && isTestDataEmail_(row['メールアドレス']);
}

function isTestExternalApplicantRow_(row) {
  return isTestDataName_(row['氏名']) && isTestDataEmail_(row['メールアドレス']);
}

// 承認前の入会申込は会員IDを持たないので、申請者名（氏名・事業所名）と連絡先で判定する。
function isTestChangeRequestRow_(row) {
  return isTestDataName_(row['申請者表示名']) && isTestDataEmail_(row['連絡先メールアドレス']);
}

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
  'T_画面文テンプレート': 'NONE',
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

// ── 研修案内PDF サムネイル バッチ生成（時間ベーストリガーで定期実行）──────────

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
  // E1（TRD §1.8）: 本番でないプロジェクトは上書きの DB だけを開く。プロパティ DB_SPREADSHEET_ID（本番 DB が
  // 残っているかもしれない）は読まず、開けなくても新しい表を作らない。
  if (!isProductionScript_()) {
    if (!DB_SPREADSHEET_ID_FIXED) {
      throw new Error('本番でないプロジェクトの DB が設定されていません。スクリプトプロパティ DB_SPREADSHEET_ID_OVERRIDE に'
        + 'ステージングの DB を設定してください（本番 DB は指定できません・docs/334 §10）。');
    }
    return SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  }
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
// 2026-10-25: 数字だけの文字列を入れる列は、書式を「書式なしテキスト」にする。
// 書式の無いセルへ '0005' を書くと、シートが数値の 5 に変える（振込口座の金融機関コード・口座番号、
// 0 始まりの電話番号）。書き込みの経路は多い（appendRowsByHeaders_・行ごとの setValues）ので、列の書式で守る。
// アーカイブ（*_archive）も同じ列を持つ。足すときは audit:db-model が「〜番号」などの列の漏れを落とす。
var TEXT_FORMAT_COLUMNS_ = {
  'T_会員': ['携帯電話番号', '勤務先郵便番号', '勤務先電話番号', '勤務先FAX番号', '自宅郵便番号', '介護支援専門員番号', '事業所番号'],
  'T_事業所職員': ['介護支援専門員番号'],
  'T_認証アカウント': ['ログインID'],
  'T_研修申込': ['申告介護支援専門員番号'],
  'T_外部申込者': ['電話番号'],
  'T_人物統合ログ': ['介護支援専門員番号'],
  'T_振込口座': ['金融機関コード', '支店コード', '口座番号'],
};

// 既に数値になっていたセルは、同じ数字の文字列になる（27012345 → '27012345'。リハーサルで確かめる。
// 消えた先頭の 0 は戻らない）。新しく書く値は 0 始まりのまま残る。
function applyTextColumnFormats_(ss) {
  Object.keys(TEXT_FORMAT_COLUMNS_).forEach(function(tableName) {
    [tableName, tableName + '_archive'].forEach(function(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastColumn() < 1) return;
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h); });
      TEXT_FORMAT_COLUMNS_[tableName].forEach(function(column) {
        var index = headers.indexOf(column);
        if (index >= 0) sheet.getRange(1, index + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
      });
    });
  });
}

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
  // 2026-10-25 docs/313: 案内文の定型文。設定行がそろってから、今の表示と同じ文面を移す
  critical('normalize T_画面文テンプレート',      function() { normalizeTableColumns_(ss, 'T_画面文テンプレート'); });
  critical('seedScreenTextTemplates_',            function() { seedScreenTextTemplates_(ss); });
  critical('seedPermissionMatrixIfNeeded_',       function() { seedPermissionMatrixIfNeeded_(ss); });

  // ── post: 補助処理（失敗してもスキーマ整合は保たれるためログのみで続行）─────
  post('applyDataValidationRules_',              function() { applyDataValidationRules_(ss); });
  post('applyTextColumnFormats_',                function() { applyTextColumnFormats_(ss); });
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
function setMemberTypeAnnualFeeAmounts_(ss, feeMap) {
  if (!feeMap) return;
  var sheet = ss.getSheetByName('M_会員種別');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('M_会員種別 が初期化されていません。');
  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['コード', '年会費金額']);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var changed = false;
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var code = String(row[cols['コード']] || '');
    if (!code || !Object.prototype.hasOwnProperty.call(feeMap, code)) continue;
    row[cols['年会費金額']] = normalizeAnnualFeeAmount_(feeMap[code], code);
    changed = true;
  }
  if (changed) {
    sheet.getRange(2, 1, rows.length, sheet.getLastColumn()).setValues(rows);
    invalidateMasterOptionsCache_();
  }
}

function normalizeAnnualFeeAmount_(raw, code) {
  var amount = Number(raw);
  if (!isFinite(amount)) throw new Error('年会費（' + code + '）は数値で入力してください。');
  amount = Math.floor(amount);
  if (amount < 0 || amount > 1000000) {
    throw new Error('年会費（' + code + '）は 0〜1,000,000 円の範囲で設定してください。');
  }
  return amount;
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
    // 2026-10-25 docs/313: 案内文の本文 4 つと旧い補完 2 つは定型文（T_画面文テンプレート）へ移した。seedScreenTextTemplates_ が入れる
    { key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE', value: PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible ? 'true' : 'false', desc: '公開ポータル：入会完了画面のログイン情報ブロックを表示するか' },
    { key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE', value: PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible ? 'true' : 'false', desc: '公開ポータル：入会完了画面のログイン情報を表示するか' },
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
  invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
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
