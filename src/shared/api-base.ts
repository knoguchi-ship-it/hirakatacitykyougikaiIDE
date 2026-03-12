// src/shared/api-base.ts
// google.script.run の共通ラッパー

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const google: any;

export function callApi<T>(action: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
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
