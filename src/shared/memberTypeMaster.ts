// 2026-10-19: 会員種別の一覧は DB の M_会員種別 が正本（operator 指示・DRY／ハードコード禁止）。
//
// GAS は getSystemSettings（管理）と公開ポータル設定（公開）で、有効な種別を表示順に `memberTypes` として返す。
// 画面の選択肢・絞り込み・会費欄・入会の種別カードは、種別をコードに並べずにここから描く。
// 受け取る前（起動直後・取得失敗）だけ src/shared/memberTypes.mjs の既定値で描く。
//
// 種別ごとの振る舞い（事業所会員は職員を持つ、賛助会員は CM番号が任意 など）はコードの分岐のまま残す。
// それは一覧ではなく仕様なので、マスタへは移せない。
import { useSyncExternalStore } from 'react';
import { MEMBER_TYPE_CODES, MEMBER_TYPE_ANNUAL_FEE_DEFAULTS, memberTypeLabel } from './memberTypes.mjs';

export interface MemberTypeOption {
  code: string;
  label: string;
  order: number;
  annualFee: number;
}

const FALLBACK: MemberTypeOption[] = MEMBER_TYPE_CODES.map((code: string, i: number) => ({
  code,
  label: memberTypeLabel(code),
  order: i + 1,
  annualFee: Number((MEMBER_TYPE_ANNUAL_FEE_DEFAULTS as Record<string, number>)[code] || 0),
}));

let current: MemberTypeOption[] = FALLBACK;
const listeners = new Set<() => void>();

/** GAS から受け取ったマスタで置き換える。空や不正な値は無視する（マスタ未初期化で選択肢が消えないように） */
export function setMemberTypeMaster(list: unknown): void {
  if (!Array.isArray(list) || list.length === 0) return;
  const next = list
    .filter((t) => t && typeof t === 'object' && String((t as MemberTypeOption).code || '').trim())
    .map((t) => {
      const o = t as MemberTypeOption;
      const code = String(o.code).trim();
      return { code, label: String(o.label || '') || memberTypeLabel(code), order: Number(o.order || 0), annualFee: Number(o.annualFee || 0) };
    });
  if (next.length === 0) return;
  current = next;
  listeners.forEach((l) => l());
}

export function getMemberTypeMaster(): MemberTypeOption[] {
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** 有効な会員種別（表示順）。マスタを受け取ると再描画される */
export function useMemberTypeMaster(): MemberTypeOption[] {
  return useSyncExternalStore(subscribe, getMemberTypeMaster, getMemberTypeMaster);
}

/** 種別コードの表示名。マスタの名称を優先し、無ければ既定ラベル（未知コードはそのまま） */
export function memberTypeMasterLabel(code: string): string {
  const hit = current.find((t) => t.code === code);
  return hit ? hit.label : memberTypeLabel(code);
}

/** 選択肢に今の値が無いとき（マスタで無効にした種別の会員など）も、その値を表示できるように足す */
export function memberTypeOptionsIncluding(options: MemberTypeOption[], code: string): MemberTypeOption[] {
  if (!code || options.some((t) => t.code === code)) return options;
  return [...options, { code, label: memberTypeMasterLabel(code), order: 999, annualFee: 0 }];
}
