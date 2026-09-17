export const WITHDRAWAL_METHODS = ['FISCAL_YEAR_END', 'IMMEDIATE'] as const;
export type WithdrawalMethod = typeof WITHDRAWAL_METHODS[number];

export const WITHDRAWAL_CONFIRMATION_ITEM_IDS = [
  'method',
  'effectiveDate',
  'memberPortal',
  'cancellation',
  'approval',
] as const;
export type WithdrawalConfirmationItemId = typeof WITHDRAWAL_CONFIRMATION_ITEM_IDS[number];

export type WithdrawalConfirmationItem = {
  id: WithdrawalConfirmationItemId;
  enabled: boolean;
  label: string;
  fiscalYearEndText: string;
  immediateText: string;
};

// The editable default content for the five fixed confirmation rows. Runtime
// content is stored in T_システム設定; this only covers an unconfigured system.
export const DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS: WithdrawalConfirmationItem[] = [
  { id: 'method', enabled: true, label: '退会方式', fiscalYearEndText: '年度末退会（自動計算）', immediateText: '即時退会（承認日に適用）' },
  { id: 'effectiveDate', enabled: true, label: '適用タイミング', fiscalYearEndText: '当年度末 3月31日', immediateText: '管理者の承認日' },
  { id: 'memberPortal', enabled: true, label: 'マイページ利用', fiscalYearEndText: '退会予定日まで可能', immediateText: '承認後は利用できません' },
  { id: 'cancellation', enabled: true, label: '取消', fiscalYearEndText: '会員マイページから年度末前まで可能', immediateText: '承認後は取り消せません' },
  { id: 'approval', enabled: true, label: '承認', fiscalYearEndText: '管理者が申請を確認後に反映', immediateText: '管理者が申請を確認後に反映' },
];

export function normalizeWithdrawalConfirmationItems(value: unknown): WithdrawalConfirmationItem[] {
  const input = Array.isArray(value) ? value : [];
  const byId = new Map(input
    .filter((item): item is Partial<WithdrawalConfirmationItem> & { id: WithdrawalConfirmationItemId } =>
      !!item && typeof item === 'object' && WITHDRAWAL_CONFIRMATION_ITEM_IDS.includes((item as { id?: WithdrawalConfirmationItemId }).id as WithdrawalConfirmationItemId))
    .map((item) => [item.id, item]));

  return DEFAULT_WITHDRAWAL_CONFIRMATION_ITEMS.map((defaultItem) => {
    const item = byId.get(defaultItem.id);
    return {
      id: defaultItem.id,
      enabled: typeof item?.enabled === 'boolean' ? item.enabled : defaultItem.enabled,
      label: typeof item?.label === 'string' ? item.label.slice(0, 80) : defaultItem.label,
      fiscalYearEndText: typeof item?.fiscalYearEndText === 'string' ? item.fiscalYearEndText.slice(0, 300) : defaultItem.fiscalYearEndText,
      immediateText: typeof item?.immediateText === 'string' ? item.immediateText.slice(0, 300) : defaultItem.immediateText,
    };
  });
}
