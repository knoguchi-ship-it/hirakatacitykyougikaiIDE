// v351: Client-side PDF first-page thumbnail generation.
//
// Drive 側の thumbnailLink 生成は新規アップロード後 20+ 秒〜数分かかることが
// 多く、admin の UX を悪化させていた。pdfjs-dist (Mozilla) を使ってブラウザで
// 1 ページ目を <canvas> にレンダリングし、PNG base64 をアップロード時に
// 一緒にサーバへ送ることで、Drive 待ちを完全に排除する。
//
// Worker policy: vite-plugin-singlefile を使っているため worker を別 file で
// 配信できない。disableWorker=true でメインスレッド実行とする。1 ページ
// レンダリングなら数百 ms〜2 秒程度なので UI ブロック影響は許容範囲。

import * as pdfjsLib from 'pdfjs-dist';

// pdfjs-dist v5: GlobalWorkerOptions.workerSrc は値が空でも console warning が
// 出るだけで動作はする (mainthread fallback)。Vite singlefile 環境ではこの
// 構成が現実的。
// (将来 worker を inline したい場合は import.meta.url + Worker 化を検討)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export type PdfThumbnailResult = {
  /** PNG data URL (data:image/png;base64,...) — そのまま <img src> に使える */
  dataUrl: string;
  /** base64 部分のみ (header 'data:image/png;base64,' を除いた本体) */
  base64: string;
  /** 描画した canvas の物理サイズ */
  width: number;
  height: number;
};

/**
 * PDF blob (File or ArrayBuffer) を受け取り、1 ページ目を PNG として返す。
 * 最大サイズ targetWidth を指定すると、その width に収まるようスケーリング。
 *
 * 失敗時は throw する。caller 側でサーバ fallback に切り替えること。
 */
export async function renderPdfFirstPageToPng(
  input: File | ArrayBuffer | Uint8Array,
  targetWidth: number = 800,
): Promise<PdfThumbnailResult> {
  // ArrayBuffer に正規化
  let buffer: ArrayBuffer;
  if (input instanceof ArrayBuffer) {
    buffer = input;
  } else if (input instanceof Uint8Array) {
    // Uint8Array の中身を独立 ArrayBuffer にコピー（offset 問題回避）
    buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  } else {
    buffer = await input.arrayBuffer();
  }

  // pdfjs-dist v5 では DocumentInitParameters の isEvalSupported は型から
  // 削除済（内部で常に無効）。data だけ渡せばよい。
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  });
  const pdfDoc = await loadingTask.promise;
  if (pdfDoc.numPages < 1) {
    throw new Error('PDF has no pages');
  }
  const page = await pdfDoc.getPage(1);

  // viewport 計算: targetWidth に合わせて scale
  const unscaled = page.getViewport({ scale: 1 });
  const scale = targetWidth / unscaled.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 白背景（PDF 透過の場合の見栄え）
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  // pdfjs のレンダリング後、リソース解放
  page.cleanup();
  await pdfDoc.destroy();

  const dataUrl = canvas.toDataURL('image/png');
  // 'data:image/png;base64,' を取り除いて生の base64 部分だけ抽出
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

  return { dataUrl, base64, width: canvas.width, height: canvas.height };
}
