// 会員・職員の移行の「結果不明」を扱う（2026-10-31・docs/316 §6・docs/317 I4/I5）。
//
// 移行は 1 回の一括更新で書くので、サーバーが答えを返したなら「反映した」か「何も変わっていない」のどちらか。
// 困るのは答えが返らないとき（通信断・実行時間切れ）で、サーバーで反映済みかもしれない。
//
// - 画面が操作IDを作って送る。サーバーは同じ操作IDの完了記録があれば、もう一度は実行しない
// - 答えが返らなかったら、操作IDで結果を 1 回だけ照会する（照会は読むだけ。移行を送り直さない）
// - 照会でも分からなければ、推測せず「結果不明」と操作IDを示して止める
//
// 通信の失敗（google.script.run の failure handler）とサーバーの答え（success:false）は GasTransportError で区別する。

export class GasTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GasTransportError';
  }
}

export function isGasTransportError(error: unknown): boolean {
  return error instanceof GasTransportError;
}

// サーバーの完了記録のログIDと同じ表記（サーバーが 'MC-' を付ける）
export function conversionOperationLabel(operationId: string): string {
  return `MC-${operationId}`;
}

export function conversionOutcomeUnknownMessage(operationId: string): string {
  return `通信が途切れたため、移行の結果を確認できませんでした（操作ID: ${conversionOperationLabel(operationId)}）。`
    + '会員詳細を開き直して状態を確認してから、必要な場合だけもう一度実行してください。';
}

export function newConversionOperationId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // randomUUID が無い環境の代わり（一意性だけが目的。秘密ではない）
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

export interface ConversionLookup<R> {
  found: boolean;
  result?: R;
}

export async function convertWithOutcomeCheck<P extends { operationId?: string }, R extends object>(
  payload: P,
  deps: {
    convert: (payload: P & { operationId: string }) => Promise<R>;
    lookup: (operationId: string) => Promise<ConversionLookup<R>>;
    newId?: () => string;
  },
): Promise<R & { operationId?: string; recovered?: boolean }> {
  const operationId = payload.operationId || (deps.newId || newConversionOperationId)();
  try {
    return await deps.convert({ ...payload, operationId });
  } catch (error) {
    if (!isGasTransportError(error)) throw error; // サーバーの答え（入力不備・未反映など）はそのまま見せる
    try {
      const found = await deps.lookup(operationId);
      if (found && found.found && found.result) return { ...found.result, recovered: true };
    } catch {
      // 照会も届かなければ結果不明のまま
    }
    throw new Error(conversionOutcomeUnknownMessage(operationId));
  }
}
