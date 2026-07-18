// src/shared/api-base.ts
// google.script.run の共通ラッパー + GCP runtime 分岐（docs/250 Phase 3）
//
// runtime 選択は window.__APP_CONFIG__.apiRuntime（既定 'gas'）。GAS 配信 build には
// scripts/compress-html.mjs が {apiRuntime:'gas'} を注入するため本番挙動は不変で、
// 'gcp' はローカル検証で config を明示注入した場合のみ有効になる。

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AppRuntimeConfig } from '../services/api';

declare const google: any;

const GAS_RUNTIME_REQUIRED_MESSAGE =
  'この画面は Google Apps Script Web アプリ上でのみ利用できます。ローカルのモック運用は廃止しました。';

export const GCP_ACTION_NOT_IMPLEMENTED_MESSAGE =
  'この操作は GCP API runtime では未実装です（read-only 移行中・docs/250 Phase 3）。現行の GAS 版をご利用ください。';

// GCP runtime で呼べる action の allowlist。portal-api（GCP 作業場
// services/portal-api/src/actions.js）のサーバー側 allowlist と同一の 2 read action のみ。
// ここに無い action は deny-by-default で reject し、サーバー側 allowlist との二重防御とする。
export const GCP_READ_ACTIONS: readonly string[] = ['getPublicTrainings', 'getPublicPortalSettings'];

// portal-api 契約: POST {apiBaseUrl}/api {action,payload} → {success,data|error}（GAS と同一 envelope。
// GAS が JSON 文字列を返すのに対し portal-api は JSON オブジェクトを返す点のみ異なる）。
export async function callGcpApi<T>(action: string, payload: unknown, config: AppRuntimeConfig): Promise<T> {
  if (!GCP_READ_ACTIONS.includes(action)) {
    throw new Error(GCP_ACTION_NOT_IMPLEMENTED_MESSAGE);
  }
  const base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('GCP API runtime: apiBaseUrl が未設定です。__APP_CONFIG__.apiBaseUrl を確認してください。');
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiAuthToken) {
    headers.Authorization = `Bearer ${config.apiAuthToken}`;
  }
  const res = await fetch(`${base}/api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload: payload ?? null }),
  });
  if (!res.ok) {
    throw new Error(`GCP API HTTP ${res.status}`);
  }
  const parsed = await res.json();
  if (parsed && parsed.success) {
    return parsed.data as T;
  }
  throw new Error((parsed && parsed.error) || 'API error');
}

export function callApi<T>(action: string, payload?: unknown): Promise<T> {
  const config = typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined;
  if (config?.apiRuntime === 'gcp') {
    return callGcpApi<T>(action, payload, config);
  }
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined' || !google.script?.run) {
      reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
      return;
    }
    google.script.run
      .withSuccessHandler((result: string) => {
        try {
          const parsed = JSON.parse(result);
          if (parsed.success) {
            resolve(parsed.data as T);
          } else {
            reject(new Error(parsed.error || 'API error'));
          }
        } catch (e) {
          reject(e);
        }
      })
      .withFailureHandler((err: Error) => reject(err))
      .processApiRequest(action, JSON.stringify(payload ?? {}));
  });
}
