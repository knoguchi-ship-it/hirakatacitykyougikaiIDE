/**
 * ConnectionRetryNotice — 最初の読み込みが返らないときの再試行表示（管理・会員・公開の共通部品）
 *
 * 状態は shared/connectionRetry.ts が 1 か所で持つ。各画面はこの部品を 1 つ置き、
 * 読み込みの呼び出しを callWithConnectionRetry で包むだけでよい（画面ごとに状態を持たない）。
 */
import React, { useSyncExternalStore } from 'react';
import {
  CONNECTION_GAVE_UP_MESSAGE,
  getConnectionRetryStatus,
  subscribeConnectionRetryStatus,
} from '../shared/connectionRetry';
import { getAppUrl } from '../utils/deepLink';

const ConnectionRetryNotice: React.FC = () => {
  const status = useSyncExternalStore(subscribeConnectionRetryStatus, getConnectionRetryStatus, getConnectionRetryStatus);

  if (status.kind === 'retrying') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-[10000] flex justify-center px-4 pt-3"
      >
        <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" aria-hidden="true" />
          接続に時間がかかっています。再試行しています（{status.attempt}/{status.maxAttempts}）…
        </div>
      </div>
    );
  }

  if (status.kind === 'gaveUp') {
    // GAS は二重の iframe で配信されるため、内側の location.reload() は期待どおりに効かないことがある。
    // 利用者のクリックで exec URL を最上位に開き直す（target=_top はクリック起点なら許される）。
    const appUrl = getAppUrl();
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 px-4">
        <div role="alert" className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-left shadow-xl">
          <h2 className="text-base font-bold text-slate-900">接続できませんでした</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{CONNECTION_GAVE_UP_MESSAGE}</p>
          <a
            href={appUrl || '#'}
            target={appUrl ? '_top' : undefined}
            onClick={(e) => { if (!appUrl) { e.preventDefault(); window.location.reload(); } }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            再読み込みする
          </a>
        </div>
      </div>
    );
  }

  return null;
};

export default ConnectionRetryNotice;
