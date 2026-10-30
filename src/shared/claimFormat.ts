import type { ClaimRecord } from './types';

/** 請求の単価と数量は、管理画面と会員画面で同じ値を表示する。 */
export function formatClaimUnitQuantity(claim: Pick<ClaimRecord, '単価' | '数量' | '請求金額'>): string {
  return `¥${Number(claim.単価 ?? claim.請求金額 ?? 0).toLocaleString('ja-JP')} × ${claim.数量}`;
}
