// v376.74: 規程・注意事項の本文に差し込む値の解決（単一情報源）。
//
// 会費の正本は `M_会員種別.年会費金額`（AGENTS.md §3）で、画面へは API 経由で渡る。
// 本文に金額を直接書くと会費改定のたびに文面も直すことになり二重管理になるため、
// 管理画面では `{{年会費}}` のように書いてもらい、表示の直前にここで置き換える。
//
// メール本文の差し込み（`src/shared/mailTemplates.ts` / GAS の `renderMergeTags_`）とは
// 別系統だが、「未解決のタグは利用者に見せない」という方針は揃えてある。

import { formatAnnualFee } from './memberTypes.mjs';
import type { MemberTypeOption } from './memberTypeMaster';

// 2026-10-19: 種別の一覧・名称・年会費は M_会員種別（src/shared/memberTypeMaster.ts）から受け取る。
// {{個人会費}} / {{事業所会費}} / {{賛助会費}} は、すでに T_規程 の文面で使われているタグ名なので残す
// （タグ名 → 種別コードの対応だけをここに持つ）。新しい種別は {{<種別名称>の年会費}} で書ける。
const LEGACY_FEE_TAGS: Record<string, string> = {
  個人会費: 'INDIVIDUAL',
  事業所会費: 'BUSINESS',
  賛助会費: 'SUPPORT',
};

/**
 * 対応するタグ:
 *   {{年会費}}   … 選択中の会員種別の年会費（例「3,000円」）。未選択なら表示順の先頭の種別
 *   {{会員種別}} … 選択中の会員種別の名称（例「個人会員」）
 *   {{<種別名称>の年会費}} … 種別を指定した年会費（例 {{賛助会員の年会費}}）
 *   {{個人会費}} / {{事業所会費}} / {{賛助会費}} … 同上（既存文面の互換）
 *
 * 未対応のタグは空文字にする（`{{...}}` のまま利用者へ見せない）。
 */
export function renderRegulationBody(
  body: string,
  memberType: string,
  memberTypes: MemberTypeOption[],
): string {
  const byCode = new Map(memberTypes.map((t) => [t.code, t]));
  const selected = byCode.get(memberType) || memberTypes[0];
  const map: Record<string, string> = {
    年会費: selected ? formatAnnualFee(selected.annualFee) : '',
    会員種別: memberType ? (byCode.get(memberType)?.label ?? memberType) : '',
  };
  for (const t of memberTypes) map[`${t.label}の年会費`] = formatAnnualFee(t.annualFee);
  for (const [tag, code] of Object.entries(LEGACY_FEE_TAGS)) {
    const t = byCode.get(code);
    map[tag] = t ? formatAnnualFee(t.annualFee) : '';
  }
  return String(body || '').replace(/\{\{([^}]*)\}\}/g, (_all, tag) => {
    const key = String(tag).trim();
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : '';
  });
}
