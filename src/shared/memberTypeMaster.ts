// 2026-10-19: 会員種別の一覧は DB の M_会員種別 が正本（operator 指示・DRY／ハードコード禁止）。
//
// 一覧・名称・表示順は src/shared/masterOptions.ts（GAS が返す masters）の 'M_会員種別'。
// 年会費は GAS が memberTypes（M_会員種別.年会費金額）で返す。ここはその 2 つを会員種別の形にまとめるだけ。
// マスタが届く前（起動直後・取得失敗）だけ src/shared/memberTypes.mjs の既定値で描く。
//
// 種別ごとの振る舞い（事業所会員は職員を持つ、賛助会員は CM番号が任意 など）はコードの分岐のまま残す。
// それは一覧ではなく仕様なので、マスタへは移せない。
import { useMemo, useSyncExternalStore } from 'react';
import { MEMBER_TYPE_CODES, MEMBER_TYPE_ANNUAL_FEE_DEFAULTS, memberTypeLabel } from './memberTypes.mjs';
import { getMasterOptions, setMasterOptions, useMasterOptions, type MasterOption } from './masterOptions';

const MASTER = 'M_会員種別';

export interface MemberTypeOption {
  code: string;
  label: string;
  order: number;
  annualFee: number;
}

const DEFAULT_FEES = MEMBER_TYPE_ANNUAL_FEE_DEFAULTS as Record<string, number>;
const FALLBACK_OPTIONS: MasterOption[] = MEMBER_TYPE_CODES.map((code: string, i: number) => ({
  code, label: memberTypeLabel(code), order: i + 1,
}));

let fees: Record<string, number> = {};
let feeVersion = 0;
const feeListeners = new Set<() => void>();

/** GAS の memberTypes（年会費つき）を受け取る。一覧と名称は masterOptions へ渡す */
export function setMemberTypeMaster(list: unknown): void {
  if (!Array.isArray(list) || list.length === 0) return;
  const next: Record<string, number> = {};
  for (const t of list as MemberTypeOption[]) {
    if (t && String(t.code || '').trim()) next[String(t.code).trim()] = Number(t.annualFee || 0);
  }
  fees = next;
  feeVersion += 1;
  feeListeners.forEach((l) => l());
  setMasterOptions({ [MASTER]: list });
}

function toMemberTypes(options: MasterOption[]): MemberTypeOption[] {
  const source = options.length ? options : FALLBACK_OPTIONS;
  return source.map((o) => {
    const fromAttrs = Number(o.attrs?.['年会費金額']);
    const annualFee = o.code in fees ? fees[o.code]
      : Number.isFinite(fromAttrs) && o.attrs?.['年会費金額'] !== '' && o.attrs?.['年会費金額'] != null ? fromAttrs
        : Number(DEFAULT_FEES[o.code] || 0);
    return { code: o.code, label: o.label, order: o.order, annualFee };
  });
}

export function getMemberTypeMaster(): MemberTypeOption[] {
  return toMemberTypes(getMasterOptions(MASTER));
}

function subscribeFees(listener: () => void): () => void {
  feeListeners.add(listener);
  return () => { feeListeners.delete(listener); };
}
const getFeeVersion = () => feeVersion;

/** 有効な会員種別（表示順）。マスタを受け取ると再描画される */
export function useMemberTypeMaster(): MemberTypeOption[] {
  const options = useMasterOptions(MASTER);
  const version = useSyncExternalStore(subscribeFees, getFeeVersion, getFeeVersion);
  // version は年会費が届いたことを知らせるだけ（中身は fees を読む）
  return useMemo(() => toMemberTypes(options), [options, version]);
}

/** 種別コードの表示名。マスタの名称を優先し、無ければ既定ラベル（未知コードはそのまま） */
export function memberTypeMasterLabel(code: string): string {
  const hit = getMasterOptions(MASTER).find((t) => t.code === code);
  return hit ? hit.label : memberTypeLabel(code);
}

/** 選択肢に今の値が無いとき（マスタで無効にした種別の会員など）も、その値を表示できるように足す */
export function memberTypeOptionsIncluding(options: MemberTypeOption[], code: string): MemberTypeOption[] {
  if (!code || options.some((t) => t.code === code)) return options;
  return [...options, { code, label: memberTypeMasterLabel(code), order: 999, annualFee: 0 }];
}
