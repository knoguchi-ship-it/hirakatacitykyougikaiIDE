// src/shared/api-base.ts
// google.script.run の共通ラッパー

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const google: any;

const GAS_RUNTIME_REQUIRED_MESSAGE =
  'この画面は Google Apps Script Web アプリ上でのみ利用できます。ローカルのモック運用は廃止しました。';

export function callApi<T>(action: string, payload?: unknown): Promise<T> {
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
