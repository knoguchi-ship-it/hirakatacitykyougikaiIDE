// 2026-10-19: マスタ（DB の M_ 表）の選択肢と名称の受け取り口（operator 指示: DRY／ハードコード禁止／マスタは今後も増える）。
//
// GAS は画面へ `masters`（マスタ名 → 有効な行を表示順に並べた { code, label, order }）を返す。
//   管理: getSystemSettings（マスタ定義 の全表）
//   会員: getMemberPortalData / 公開: getPublicPortalSettings（GAS の PUBLIC_MASTER_NAMES_ の表だけ）
// 受け取りは src/services/api.ts と公開ポータルの起動処理で行い、画面はマスタ名を指定して引く。
// 選択肢・名称をコードに並べない（test:master-options が直書きを見つけて落とす）。
//
// マスタ定義 に表を足すと、管理画面にはコードを変えずに届く。
// 届く前（起動直後）は空の一覧で、名称はコードのまま出る。
import { useCallback, useSyncExternalStore } from 'react';

export interface MasterOption {
  code: string;
  label: string;
  order: number;
  /** 管理画面だけ。コード・名称・表示順・有効フラグなど以外の列（例: M_会員種別.年会費金額） */
  attrs?: Record<string, unknown>;
}

const EMPTY: MasterOption[] = [];
let current: Record<string, MasterOption[]> = {};
const listeners = new Set<() => void>();

function normalize(list: unknown): MasterOption[] | null {
  if (!Array.isArray(list)) return null;
  return list
    .filter((o) => o && typeof o === 'object' && String((o as MasterOption).code ?? '').trim())
    .map((o) => {
      const v = o as MasterOption;
      const code = String(v.code).trim();
      return { code, label: String(v.label || '') || code, order: Number(v.order || 0), attrs: v.attrs };
    });
}

/** GAS から受け取ったマスタで置き換える（受け取った表だけ。他の表は残す） */
export function setMasterOptions(masters: unknown): void {
  if (!masters || typeof masters !== 'object') return;
  const next = { ...current };
  let changed = false;
  for (const [name, list] of Object.entries(masters as Record<string, unknown>)) {
    const options = normalize(list);
    if (!options) continue;
    next[name] = options;
    changed = true;
  }
  if (!changed) return;
  current = next;
  listeners.forEach((l) => l());
}

export function getMasterOptions(masterName: string): MasterOption[] {
  return current[masterName] || EMPTY;
}

/** コードの表示名（マスタの名称）。マスタに無い・まだ届いていないコードはコードのまま */
export function masterLabel(masterName: string, code: string | null | undefined): string {
  const value = String(code ?? '');
  const hit = getMasterOptions(masterName).find((o) => o.code === value);
  return hit ? hit.label : value;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** 有効な選択肢（表示順）。マスタが届くと再描画される */
export function useMasterOptions(masterName: string): MasterOption[] {
  const get = useCallback(() => getMasterOptions(masterName), [masterName]);
  return useSyncExternalStore(subscribe, get, get);
}

/** 名称を引く関数。マスタが届くと再描画される */
export function useMasterLabel(masterName: string): (code: string | null | undefined) => string {
  const options = useMasterOptions(masterName);
  return useCallback((code) => {
    const value = String(code ?? '');
    const hit = options.find((o) => o.code === value);
    return hit ? hit.label : value;
  }, [options]);
}

/** 選択肢に今の値が無いとき（マスタで無効にした値の行など）も、その値を表示できるように足す */
export function optionsIncluding(options: MasterOption[], code: string | null | undefined): MasterOption[] {
  const value = String(code ?? '');
  if (!value || options.some((o) => o.code === value)) return options;
  return [...options, { code: value, label: value, order: 9999 }];
}
