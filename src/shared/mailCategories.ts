/**
 * メール通知設定（システム設定 ＞ メール通知）のカテゴリ配色。
 *
 * 【設計意図】
 * この画面には独立した 2 つの情報がある。
 *   A: どの種類のメールか（カテゴリ）
 *   B: 有効か無効か（状態）
 * 以前は色が B だけを表し、A は文字だけだったため、読まないと判別できなかった。
 * ここでは
 *   色相（emerald / sky / amber / indigo / violet / rose）= A カテゴリ
 *   色の有無（色付き / グレー）                          = B 状態
 *   アイコンの形                                          = A の補強
 * と、チャネルを分けて割り当てる。アイコンとバッジ文言を併用するため、
 * 色だけに依存しない（WCAG 1.4.1）。
 *
 * 【Tailwind v4 の制約】
 * クラス名を動的に組み立てても CSS は生成されない（`border-l-${c}-500` は無地になる）。
 * そのため **完成形のクラス文字列だけ** を表に持ち、利用側で文字列を結合しない。
 *
 * バッジは各色の 100 番background に 800 番foreground を使い、
 * コントラスト比 4.5:1 以上を満たす組み合わせだけを採用している。
 */

export type MailCategoryKey =
  | 'ENROLLMENT'
  | 'STAFF'
  | 'WORKFLOW'
  | 'TRAINING'
  | 'MEMBER_PROCEDURE'
  | 'SECURITY';

/** アイコンの形。実際の SVG は EmailSettingsCard.tsx の MailCategoryIcon が持つ。 */
export type MailCategoryIconKey =
  | 'userPlus'
  | 'users'
  | 'cycle'
  | 'cap'
  | 'clipboardCheck'
  | 'shield';

export interface MailCategoryStyle {
  /** グループ見出しに出す短いカテゴリ名 */
  label: string;
  icon: MailCategoryIconKey;
  /** カード枠（有効時）。左端の太いバーがカテゴリ色。 */
  cardEnabled: string;
  /** カード枠（無効時）。色を抜いて「止まっている」ことを示す。 */
  cardDisabled: string;
  badgeEnabled: string;
  badgeDisabled: string;
  /** グループ見出しの帯 */
  groupBand: string;
  /** グループ見出しのアイコン色 */
  groupIcon: string;
  /** 有効時のトグルスイッチの色（「色がある＝有効」を補強する） */
  toggleOn: string;
  /** 系統選択ボタン（選択中） */
  chipActive: string;
  /** 系統選択ボタン（未選択） */
  chipIdle: string;
}

export const MAIL_CATEGORY_STYLES: Record<MailCategoryKey, MailCategoryStyle> = {
  ENROLLMENT: {
    label: '入会',
    icon: 'userPlus',
    cardEnabled: 'border border-l-4 border-emerald-200 border-l-emerald-500 bg-emerald-50',
    cardDisabled: 'border border-l-4 border-slate-200 border-l-slate-300 bg-slate-50',
    badgeEnabled: 'bg-emerald-100 text-emerald-800',
    badgeDisabled: 'bg-slate-200 text-slate-600',
    groupBand: 'border-l-4 border-l-emerald-500 bg-emerald-100 text-emerald-900',
    groupIcon: 'text-emerald-700',
    toggleOn: 'bg-emerald-600',
    chipActive: 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200',
    chipIdle: 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50',
  },
  STAFF: {
    label: '職員',
    icon: 'users',
    cardEnabled: 'border border-l-4 border-sky-200 border-l-sky-500 bg-sky-50',
    cardDisabled: 'border border-l-4 border-slate-200 border-l-slate-300 bg-slate-50',
    badgeEnabled: 'bg-sky-100 text-sky-800',
    badgeDisabled: 'bg-slate-200 text-slate-600',
    groupBand: 'border-l-4 border-l-sky-500 bg-sky-100 text-sky-900',
    groupIcon: 'text-sky-700',
    toggleOn: 'bg-sky-600',
    chipActive: 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-200',
    chipIdle: 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50',
  },
  WORKFLOW: {
    label: '申請ワークフロー',
    icon: 'cycle',
    cardEnabled: 'border border-l-4 border-amber-200 border-l-amber-500 bg-amber-50',
    cardDisabled: 'border border-l-4 border-slate-200 border-l-slate-300 bg-slate-50',
    badgeEnabled: 'bg-amber-100 text-amber-800',
    badgeDisabled: 'bg-slate-200 text-slate-600',
    groupBand: 'border-l-4 border-l-amber-500 bg-amber-100 text-amber-900',
    groupIcon: 'text-amber-700',
    toggleOn: 'bg-amber-600',
    chipActive: 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-200',
    chipIdle: 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50',
  },
  TRAINING: {
    label: '研修',
    icon: 'cap',
    cardEnabled: 'border border-l-4 border-indigo-200 border-l-indigo-500 bg-indigo-50',
    cardDisabled: 'border border-l-4 border-slate-200 border-l-slate-300 bg-slate-50',
    badgeEnabled: 'bg-indigo-100 text-indigo-800',
    badgeDisabled: 'bg-slate-200 text-slate-600',
    groupBand: 'border-l-4 border-l-indigo-500 bg-indigo-100 text-indigo-900',
    groupIcon: 'text-indigo-700',
    toggleOn: 'bg-indigo-600',
    chipActive: 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200',
    chipIdle: 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50',
  },
  MEMBER_PROCEDURE: {
    label: '会員手続き',
    icon: 'clipboardCheck',
    cardEnabled: 'border border-l-4 border-violet-200 border-l-violet-500 bg-violet-50',
    cardDisabled: 'border border-l-4 border-slate-200 border-l-slate-300 bg-slate-50',
    badgeEnabled: 'bg-violet-100 text-violet-800',
    badgeDisabled: 'bg-slate-200 text-slate-600',
    groupBand: 'border-l-4 border-l-violet-500 bg-violet-100 text-violet-900',
    groupIcon: 'text-violet-700',
    toggleOn: 'bg-violet-600',
    chipActive: 'border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-200',
    chipIdle: 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50',
  },
  SECURITY: {
    label: '認証・セキュリティ',
    icon: 'shield',
    cardEnabled: 'border border-l-4 border-rose-200 border-l-rose-500 bg-rose-50',
    cardDisabled: 'border border-l-4 border-slate-200 border-l-slate-300 bg-slate-50',
    badgeEnabled: 'bg-rose-100 text-rose-800',
    badgeDisabled: 'bg-slate-200 text-slate-600',
    groupBand: 'border-l-4 border-l-rose-500 bg-rose-100 text-rose-900',
    groupIcon: 'text-rose-700',
    toggleOn: 'bg-rose-600',
    chipActive: 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-200',
    chipIdle: 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50',
  },
};

/**
 * 系統選択ボタンの並び順。会員が受け取る順序（入会 → 職員 → 申請 → 研修 → 手続き → 認証）に沿わせる。
 */
export const MAIL_CATEGORY_ORDER: MailCategoryKey[] = [
  'ENROLLMENT',
  'STAFF',
  'WORKFLOW',
  'TRAINING',
  'MEMBER_PROCEDURE',
  'SECURITY',
];

/** 系統選択ボタンに出す見出し。カード上のバッジより短くする。 */
export const MAIL_CATEGORY_TAB_LABEL: Record<MailCategoryKey, string> = {
  ENROLLMENT: '入会申し込み',
  STAFF: '職員追加',
  WORKFLOW: '申請ワークフロー',
  TRAINING: '研修',
  MEMBER_PROCEDURE: '会員手続き',
  SECURITY: '認証・セキュリティ',
};
