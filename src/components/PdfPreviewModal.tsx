import React, { useEffect, useRef } from 'react';

/**
 * v355: PDF プレビュー lightbox モーダル。
 *
 * Google Drive 公式の embed URL `https://drive.google.com/file/d/<id>/preview`
 * を iframe で表示する。Drive viewer がそのまま動くので:
 *   - 文字読み取り可能（高解像度ネイティブ render）
 *   - ページめくり / ズーム / テキスト選択 / 検索 全部使える
 *   - ANYONE_WITH_LINK 共有 + 25MB 以下 という前提
 *
 * モーダル仕様:
 *   - Desktop: 90vw × 90vh
 *   - Mobile (~640px 未満): full screen
 *   - ESC キーで閉じる、backdrop クリックで閉じる
 *   - role="dialog" + aria-modal + focus restoration
 */

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  /** PDF の Drive 上の URL (例: https://drive.google.com/file/d/<id>/view?...) */
  fileUrl: string;
  /** ヘッダーに出すタイトル（研修名など） */
  title?: string;
}

function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([^/?]+)/) || url.match(/[?&]id=([^&]+)/);
  return m ? m[1] : null;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ open, onClose, fileUrl, title }) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ESC キーで閉じる + フォーカスリストア
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
    // モーダル open 時に背景スクロールを止める
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 初期フォーカスを閉じるボタンに
    setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const fileId = extractDriveFileId(fileUrl);
  const previewSrc = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : '';
  const openInTabHref = fileUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        // backdrop click で閉じる（モーダル本体のクリックは伝播停止）
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white shadow-2xl flex flex-col w-full h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-[1400px] sm:rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
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
                href={openInTabHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1 px-3 text-xs sm:text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-md"
                aria-label="案内PDFを別タブで開く"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h6v6m0-6L10 15M5 5h6m-6 0v14h14v-6" />
                </svg>
                <span className="hidden sm:inline">別タブで開く</span>
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

        {/* iframe 本体 */}
        <div className="flex-1 min-h-0 bg-slate-100">
          {previewSrc ? (
            <iframe
              src={previewSrc}
              title={title ? `${title} の案内PDFプレビュー` : '案内PDFプレビュー'}
              className="w-full h-full border-0"
              loading="lazy"
              allow="autoplay"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 p-4 text-center">
              PDF の URL を解析できませんでした。「別タブで開く」をご利用ください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
