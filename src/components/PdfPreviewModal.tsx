import React, { useEffect, useRef, useState } from 'react';

/**
 * v358: PDF プレビュー lightbox モーダル（高解像度 PNG 表示方式）。
 *
 * 経緯（実装試行と撤退）:
 *   - v355 Drive `/file/d/<id>/preview` iframe: Drive の CSP `frame-ancestors
 *     https://drive.google.com` で外部から埋め込み禁止 → 構造的に動かない
 *   - v357 blob URL iframe: Chrome の cross-origin blob ナビゲーション制限で
 *     PDF viewer がブロック ("このページは Chrome によってブロックされています")
 *   - data URL iframe: Chrome の data URL サイズ制限 ~2MB で 5MB PDF は無理
 *   - PDF.js bundle: pdfjs-dist の import.meta が vite-singlefile で SyntaxError
 *
 * v358 の解:
 *   server `getFileThumbnail_` に size パラメータを追加して **w2000 の高解像度
 *   PNG** を Drive thumbnailLink から取得 → クライアントで `<img>` として中央表示。
 *   1 ページ目だけだが「人間が文字を読める」品質。複数ページ閲覧は header の
 *   「別タブで開く」リンクから Drive viewer に飛ぶ。CSP/Chrome blob 制約を完全
 *   回避、すべての PDF で確実に動く。
 */

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  /** PDF の Drive 上の URL (例: https://drive.google.com/file/d/<id>/view?...) */
  fileUrl: string;
  /** ヘッダーに出すタイトル（研修名など） */
  title?: string;
  /**
   * 高解像度 PNG (w2000) を取得する関数。境界ごとに渡す:
   *   - member / admin: (url) => api.getFileThumbnail(url, 2000)
   *   - public: (url) => callApi('getFileThumbnail', { fileUrl: url, size: 2000 }).then(r => r.thumbnail)
   * 戻り値は data:image/...;base64,... の data URL。失敗時 null。
   */
  fetchHighResImage?: (fileUrl: string) => Promise<string | null>;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  onClose,
  fileUrl,
  title,
  fetchHighResImage,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const fetchRef = useRef(fetchHighResImage);
  useEffect(() => { fetchRef.current = fetchHighResImage; });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // ESC キー + フォーカスリストア + 背景スクロールロック
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  // open 時に高解像度 PNG を fetch
  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setStatus('idle');
      return;
    }
    if (!fileUrl || !fetchRef.current) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    fetchRef.current(fileUrl)
      .then((url) => {
        if (cancelled) return;
        if (url) {
          setImageUrl(url);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileUrl]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white shadow-2xl flex flex-col w-full h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-[1400px] sm:rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <h2
            id="pdf-preview-title"
            className="text-sm sm:text-base font-bold text-slate-900 truncate flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
            </svg>
            <span className="truncate">{title || '案内PDFプレビュー'}</span>
          </h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1 px-3 text-xs sm:text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-md"
                aria-label="案内PDFを別タブで開く（全ページ閲覧）"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h6v6m0-6L10 15M5 5h6m-6 0v14h14v-6" />
                </svg>
                <span className="hidden sm:inline">全ページを別タブで開く</span>
                <span className="sm:hidden">別タブ</span>
              </a>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-600 hover:bg-slate-200 rounded-md"
              aria-label="PDFプレビューを閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 bg-slate-100 overflow-auto flex items-start justify-center p-2 sm:p-4">
          {status === 'loading' && (
            <div className="self-center text-sm text-slate-500">PDFを読み込み中...</div>
          )}
          {status === 'ready' && imageUrl && (
            <img
              src={imageUrl}
              alt={`${title || '案内PDF'} の 1 ページ目`}
              className="max-w-full h-auto shadow-lg bg-white"
              style={{ imageRendering: 'auto' }}
            />
          )}
          {status === 'error' && (
            <div className="self-center text-center p-6 max-w-md">
              <p className="text-sm text-slate-700 mb-3">
                プレビュー画像を表示できませんでした。<br />
                「全ページを別タブで開く」から Drive で閲覧してください。
              </p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700"
                >
                  案内PDFを別タブで開く
                </a>
              )}
            </div>
          )}
        </div>

        {status === 'ready' && (
          <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200 text-center flex-shrink-0">
            ※ ここに表示しているのは 1 ページ目のプレビューです。複数ページの閲覧は「全ページを別タブで開く」をご利用ください。
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreviewModal;
