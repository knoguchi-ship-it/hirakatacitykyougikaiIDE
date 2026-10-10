// 最初の読み込みが返ってこないときの自動再試行（2026-10-10・docs/302 §2）。
//
// デプロイ直後などに、google.script.run の最初の呼び出しが返らないまま止まることがある
// （管理画面が「認証を確認しています…」で 3 分以上止まった。同じ画面から呼び直すと 4 秒で返った）。
// 画面側に待ち時間の上限が無く、利用者は無期限に待たされていた。
//
// - 返らない呼び出しは TIMEOUT で打ち切り、最大 MAX_ATTEMPTS 回まで呼び直す
// - サーバーが返したエラー（権限なし・入力不備など）は「答え」なので呼び直さない
// - 打ち切った呼び出しが後から返ってきても使わない（Promise は最初の決着だけが有効）
// - **読み取りと認証だけに使う。** 保存・承認・送信は、打ち切った呼び出しがサーバーで
//   実行済みかもしれないので、呼び直すと二重に実行される
//
// 設定と案内文の正本はここだけ。管理・会員・公開の 3 画面が同じものを使う（test:connection-retry）。

export const CONNECTION_RETRY_POLICY = { timeoutMs: 15000, maxAttempts: 5 } as const;

export const CONNECTION_GAVE_UP_MESSAGE =
  'ただいま混み合っているか、システム更新の直後のため接続できませんでした。時間をおいてアクセスしてみてください。';

export class ConnectionGaveUpError extends Error {
  constructor() {
    super(CONNECTION_GAVE_UP_MESSAGE);
    this.name = 'ConnectionGaveUpError';
  }
}

export function isConnectionGaveUp(error: unknown): boolean {
  return error instanceof ConnectionGaveUpError;
}

// ── 試行状況（画面の表示用）────────────────────────────────
// 呼び出しごとに今何回目かを持ち、表示は一番進んでいるものに合わせる。
// 一度あきらめたら、再読み込みするまで案内を出し続ける。
export type ConnectionRetryStatus =
  | { kind: 'idle' }
  | { kind: 'retrying'; attempt: number; maxAttempts: number }
  | { kind: 'gaveUp' };

const activeAttempts = new Map<number, number>();
let gaveUp = false;
let nextCallId = 1;
let status: ConnectionRetryStatus = { kind: 'idle' };
const listeners = new Set<() => void>();

function publish(maxAttempts: number): void {
  let attempt = 0;
  activeAttempts.forEach((n) => { if (n > attempt) attempt = n; });
  status = gaveUp
    ? { kind: 'gaveUp' }
    : attempt > 1
      ? { kind: 'retrying', attempt, maxAttempts }
      : { kind: 'idle' };
  listeners.forEach((fn) => fn());
}

export function getConnectionRetryStatus(): ConnectionRetryStatus {
  return status;
}

export function subscribeConnectionRetryStatus(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

type Outcome<T> = { kind: 'value'; value: T } | { kind: 'error'; error: unknown } | { kind: 'timeout' };

function settleWithin<T>(promise: Promise<T>, timeoutMs: number): Promise<Outcome<T>> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ kind: 'timeout' }), timeoutMs);
    promise.then(
      (value) => { clearTimeout(timer); resolve({ kind: 'value', value }); },
      (error) => { clearTimeout(timer); resolve({ kind: 'error', error }); },
    );
  });
}

/** start は呼ぶたびに新しい呼び出しを始める関数（使い回した Promise を渡さない）。 */
export async function callWithConnectionRetry<T>(
  start: () => Promise<T>,
  policy: { timeoutMs: number; maxAttempts: number } = CONNECTION_RETRY_POLICY,
): Promise<T> {
  const callId = nextCallId++;
  try {
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
      activeAttempts.set(callId, attempt);
      publish(policy.maxAttempts);
      const outcome = await settleWithin(start(), policy.timeoutMs);
      if (outcome.kind === 'value') return outcome.value;
      if (outcome.kind === 'error') throw outcome.error;
    }
    gaveUp = true;
    throw new ConnectionGaveUpError();
  } finally {
    activeAttempts.delete(callId);
    publish(policy.maxAttempts);
  }
}

/** テスト用: 試行状況を初期状態へ戻す。 */
export function resetConnectionRetryStatusForTest(): void {
  activeAttempts.clear();
  gaveUp = false;
  status = { kind: 'idle' };
}
