import { useEffect, type RefObject } from 'react';

// エラーや開いたフォームが画面外に出ると「押したのに何も起きない」と見える。
// value が真値に変わったら対象を画面中央へスクロールし、フォーカスも移す
// （スクリーンリーダーにも読ませるため。対象要素には tabIndex={-1} を付けること）。
//
// selector を渡すと ref の中で最初に一致した要素（例: 最初の aria-invalid 項目）を対象にする。
// 一致が無ければ ref 自身へフォールバックする。
// 同じ文言のエラーが続けて出るときは連番（nonce）を value に渡すと毎回反応する。
export function useRevealOnChange(
  value: unknown,
  ref: RefObject<HTMLElement | null>,
  options?: { selector?: string },
): void {
  const selector = options?.selector;
  useEffect(() => {
    if (!value) return;
    const root = ref.current;
    if (!root) return;
    const target = (selector && root.querySelector<HTMLElement>(selector)) || root;
    // 描画が確定してから動かす（同じコミットで開いたモーダル等の高さが決まる前に動くとずれる）
    const raf = window.requestAnimationFrame(() => {
      target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      target.focus?.({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [value, ref, selector]);
}

// エラー要素に付ける共通の selector（最初の誤り項目 → 無ければ文で書いたエラー）
export const FIRST_ERROR_SELECTOR = '[aria-invalid="true"], [data-reveal-error]';
