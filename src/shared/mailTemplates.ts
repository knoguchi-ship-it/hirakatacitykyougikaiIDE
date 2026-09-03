// v376.42: 全メール種別テンプレート管理の共有定数。
// カテゴリ enum と「カテゴリ→利用可能マージタグ」表を front/back で参照する単一情報源。
// GAS 側の MAIL_TEMPLATE_CATEGORIES_（gas-src/Code.full.gs）と同一順を保つこと。

export type MailTemplateCategory =
  // Tier1（件名/本文を編集可能）
  | 'CREDENTIAL'
  | 'BIZ_REP'
  | 'BIZ_STAFF'
  | 'STAFF_ADD_STAFF'
  | 'STAFF_ADD_REP'
  | 'APPLICATION_RECEIPT'
  | 'APPROVAL_NOTIFICATION'
  | 'REJECTION_NOTIFICATION'
  // Tier2（Phase B で差し込み化）
  | 'TRAINING_APPLY_RECEIPT'
  | 'TRAINING_REMINDER'
  | 'AUTH_OTP'
  | 'MEMBER_UPDATE_CONFIRM'
  | 'WITHDRAWAL_CONFIRM'
  | 'PASSWORD_RESET';

export const MAIL_TEMPLATE_CATEGORIES: MailTemplateCategory[] = [
  'CREDENTIAL', 'BIZ_REP', 'BIZ_STAFF', 'STAFF_ADD_STAFF', 'STAFF_ADD_REP',
  'APPLICATION_RECEIPT', 'APPROVAL_NOTIFICATION', 'REJECTION_NOTIFICATION',
  'TRAINING_APPLY_RECEIPT', 'TRAINING_REMINDER', 'AUTH_OTP',
  'MEMBER_UPDATE_CONFIRM', 'WITHDRAWAL_CONFIRM', 'PASSWORD_RESET',
];

// カテゴリ→利用可能マージタグ（[タグ, 説明][]）。UI のマージタグ凡例で使用。
//
// v376.67 DRY 是正: 以前は本カタログがありながら App.tsx が Tier1 の 4 カテゴリ分を
// インラインで別途列挙しており、v376.66 で事業所メールにタグを足したときに
// インライン側だけが更新されてカタログと食い違った（＝二重管理そのもの）。
// **UI は必ず本カタログを参照すること**（インライン列挙は test:mail-merge-tags で検出して落とす）。
export const MAIL_TEMPLATE_MERGE_TAGS: Record<MailTemplateCategory, [string, string][]> = {
  CREDENTIAL: [['{{氏名}}', '氏名'], ['{{ログインID}}', 'ログインID'], ['{{パスワード}}', '初期パスワード'], ['{{会員マイページURL}}', 'マイページURL'], ['{{会員種別}}', '会員種別'], ['{{年会費}}', '年会費']],
  BIZ_REP: [['{{氏名}}', '氏名'], ['{{ログインID}}', 'ログインID'], ['{{パスワード}}', '初期パスワード'], ['{{会員マイページURL}}', 'マイページURL'], ['{{事業所名}}', '事業所名'], ['{{会員種別}}', '会員種別'], ['{{年会費}}', '年会費']],
  BIZ_STAFF: [['{{氏名}}', '氏名'], ['{{ログインID}}', 'ログインID'], ['{{パスワード}}', '初期パスワード'], ['{{会員マイページURL}}', 'マイページURL'], ['{{事業所名}}', '事業所名'], ['{{会員種別}}', '会員種別'], ['{{年会費}}', '年会費']],
  STAFF_ADD_STAFF: [['{{氏名}}', '氏名'], ['{{ログインID}}', 'ログインID'], ['{{パスワード}}', '初期パスワード'], ['{{会員マイページURL}}', 'マイページURL'], ['{{事業所名}}', '事業所名']],
  STAFF_ADD_REP: [['{{氏名}}', '氏名'], ['{{会員マイページURL}}', 'マイページURL'], ['{{事業所名}}', '事業所名'], ['{{追加職員氏名}}', '追加職員名']],
  APPLICATION_RECEIPT: [['{{氏名}}', '氏名'], ['{{会員種別ラベル}}', '会員種別ラベル'], ['{{申請種別}}', '申請種別'], ['{{申請ID}}', '申請ID'], ['{{受付日時}}', '受付日時']],
  APPROVAL_NOTIFICATION: [['{{氏名}}', '氏名'], ['{{会員種別ラベル}}', '会員種別ラベル'], ['{{申請種別}}', '申請種別'], ['{{申請ID}}', '申請ID'], ['{{処理日時}}', '処理日時'], ['{{処理者名}}', '処理者名'], ['{{変更内容サマリー}}', '変更内容サマリー']],
  REJECTION_NOTIFICATION: [['{{氏名}}', '氏名'], ['{{会員種別ラベル}}', '会員種別ラベル'], ['{{申請種別}}', '申請種別'], ['{{申請ID}}', '申請ID'], ['{{処理日時}}', '処理日時'], ['{{処理者名}}', '処理者名'], ['{{処理備考}}', '処理備考']],
  // Tier2（Phase B で送信実体を差し込み化）
  TRAINING_APPLY_RECEIPT: [['{{申込者名}}', '申込者名'], ['{{研修名}}', '研修名'], ['{{開催日}}', '開催日'], ['{{申込ID}}', '申込ID']],
  TRAINING_REMINDER: [['{{研修名}}', '研修名'], ['{{開催日}}', '開催日'], ['{{会場}}', '会場']],
  AUTH_OTP: [['{{会員名}}', '会員名'], ['{{用途}}', '用途'], ['{{認証コード}}', '認証コード'], ['{{有効期限}}', '有効期限']],
  MEMBER_UPDATE_CONFIRM: [['{{氏名}}', '氏名']],
  WITHDRAWAL_CONFIRM: [['{{会員名}}', '会員名'], ['{{退会予定日}}', '退会予定日'], ['{{会員マイページURL}}', 'マイページURL']],
  PASSWORD_RESET: [['{{ユーザー名}}', 'ユーザー名'], ['{{確認コード}}', '確認コード'], ['{{有効期限}}', '有効期限'], ['{{会員マイページURL}}', 'マイページURL']],
};
