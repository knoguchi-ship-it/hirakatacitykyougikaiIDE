// v376.74: 規程・注意事項の本文に差し込む値の解決（単一情報源）。
//
// 会費の正本は `M_会員種別.年会費金額`（AGENTS.md §3）で、画面へは API 経由で渡る。
// 本文に金額を直接書くと会費改定のたびに文面も直すことになり二重管理になるため、
// 管理画面では `{{年会費}}` のように書いてもらい、表示の直前にここで置き換える。
//
// メール本文の差し込み（`src/shared/mailTemplates.ts` / GAS の `renderMergeTags_`）とは
// 別系統だが、「未解決のタグは利用者に見せない」という方針は揃えてある。

import { MEMBER_TYPE_LABELS, formatAnnualFee } from './memberTypes.mjs';

export type RegulationMemberType = 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';

export interface MemberTypeFees {
  INDIVIDUAL: number;
  BUSINESS: number;
  SUPPORT: number;
}

/**
 * 対応するタグ:
 *   {{年会費}}   … 選択中の会員種別の年会費（例「3,000円」）
 *   {{会員種別}} … 選択中の会員種別の名称（例「個人会員」）
 *   {{個人会費}} / {{事業所会費}} / {{賛助会費}} … 種別を指定した年会費
 *     （「賛助会員は 1 口 5,000円」のように他種別へ言及する文面のため）
 *
 * 未対応のタグは空文字にする（`{{...}}` のまま利用者へ見せない）。
 */
export function renderRegulationBody(
  body: string,
  memberType: RegulationMemberType | '',
  fees: MemberTypeFees,
): string {
  const selected: RegulationMemberType = memberType || 'INDIVIDUAL';
  const map: Record<string, string> = {
    年会費: formatAnnualFee(fees[selected]),
    会員種別: memberType ? MEMBER_TYPE_LABELS[memberType] : '',
    個人会費: formatAnnualFee(fees.INDIVIDUAL),
    事業所会費: formatAnnualFee(fees.BUSINESS),
    賛助会費: formatAnnualFee(fees.SUPPORT),
  };
  return String(body || '').replace(/\{\{([^}]*)\}\}/g, (_all, tag) => {
    const key = String(tag).trim();
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : '';
  });
}
