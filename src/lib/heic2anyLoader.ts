// heic2any を「使うときだけ」評価するローダー。
//
// heic2any は読み込んだ瞬間に約 1.3MB の変換エンジン（libheif）を Worker で起動する。
// 静的 import だと、HEIC を一度も扱わない人でも会員・管理画面を開くたびにこれが走る
// （本番の計測で、ページを開くたびに 1.3MB の Worker 読み込みが 2 回発生していた）。
//
// 動的 import() では解決しない。vite-plugin-singlefile は動的 import を 1 ファイルへ
// インライン化し、モジュール本体は起動時に評価される。さらに Vite が import.meta を含む
// preload ヘルパを挿入し、compress-html.mjs の new Function() 起動と非互換になる（v351 の罠）。
//
// そこでライブラリを文字列として同梱し、初回呼び出し時に評価する。
// 起動ローダーが new Function() を使っている（GAS の CSP が unsafe-eval を許す）ため、同じ前提で動く。
import heic2anySource from 'heic2any/dist/heic2any.min.js?raw';

type Heic2any = (options: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>;

let cached: Heic2any | null = null;

export function loadHeic2any(): Heic2any {
  if (cached) return cached;
  // UMD の AMD 分岐へ流す。CommonJS 分岐は `module.exports = a(); module.exports.default = a();`
  // と本体を 2 回生成し、Worker（各 1.3MB）を 2 つ起動してしまう。AMD 分岐なら 1 回で済み、window も汚さない。
  // 同梱の gifshot も define([], fn) を呼ぶので、関数 1 個で呼ばれたもの（heic2any 本体）だけを拾う。
  let factory: (() => Heic2any) | null = null;
  const define = (depsOrFactory: unknown) => {
    if (typeof depsOrFactory === 'function') factory = depsOrFactory as () => Heic2any;
  };
  (define as unknown as { amd: boolean }).amd = true;
  new Function('define', heic2anySource)(define);
  const fn = factory ? (factory as () => Heic2any)() : null;
  if (typeof fn !== 'function') {
    throw new Error('HEIC 変換ライブラリの読み込みに失敗しました。');
  }
  cached = fn;
  return fn;
}
