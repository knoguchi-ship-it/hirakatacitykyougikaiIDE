// 2026-11-15 docs/332 §13・データ・IF §5.6: 管理画面の初期データの埋め込み。
// 管理 split の doGet が、閲覧者が管理者なら window.__ADMIN_BOOT__ に認証・マスタ・初期データを入れる。
// 画面はこれがあれば起動の API を呼ばずに描き、表示の後に refreshAdminBoot を 1 回だけ呼ぶ。
// 形が違う・無いときは使わず、今までの API の経路で起動する（遅くなるだけで、間違ったものは出さない）。
import type { AdminInitData, AdminLoginResult } from '../services/api';

export interface AdminBoot {
  v: 1;
  auth: AdminLoginResult & { masters?: unknown };
  init: AdminInitData | null;
  initVersion: string | null;
  initBuiltAtMs: number | null;
  initStale: boolean;
}

declare global {
  interface Window {
    __ADMIN_BOOT__?: unknown;
  }
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function isValidAdminBoot(x: unknown): x is AdminBoot {
  if (!isObject(x) || x.v !== 1) return false;
  const auth = x.auth;
  if (!isObject(auth) || typeof auth.loginId !== 'string' || !auth.loginId || auth.canAccessAdminPage !== true) return false;
  if (x.init !== null) {
    if (!isObject(x.init) || !isObject(x.init.dashboard) || !isObject(x.init.settings)) return false;
    if (typeof x.initVersion !== 'string' || typeof x.initBuiltAtMs !== 'number') return false;
  }
  return true;
}

/** 埋め込みを 1 回だけ取り出して消す（再レンダー・2 回目の起動で古い値を使わない）。形が違えば null */
export function takeAdminBoot(): AdminBoot | null {
  if (typeof window === 'undefined') return null;
  const raw = window.__ADMIN_BOOT__;
  window.__ADMIN_BOOT__ = undefined;
  return isValidAdminBoot(raw) ? raw : null;
}

/** 「◯分前の内容」を出すときだけ分を返す。古い印付きか、作ってから 2 分超のときだけ（新しいときは出さない） */
export const ADMIN_BOOT_NOTICE_AFTER_MS = 2 * 60 * 1000;
export function refreshNoticeAgeMinutes(boot: Pick<AdminBoot, 'init' | 'initBuiltAtMs' | 'initStale'>, nowMs: number): number | null {
  if (!boot.init || typeof boot.initBuiltAtMs !== 'number') return null;
  const ageMs = Math.max(0, nowMs - boot.initBuiltAtMs);
  if (!boot.initStale && ageMs <= ADMIN_BOOT_NOTICE_AFTER_MS) return null;
  return Math.max(1, Math.floor(ageMs / 60000));
}
