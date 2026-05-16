import React, { useEffect, useRef, useState } from 'react';

/**
 * v357: PDF プレビュー lightbox モーダル（blob URL 方式に再設計）。
 *
 * v355 では Drive `/file/d/<id>/preview` を iframe 埋め込みしていたが、Drive
 * 自身が CSP `frame-ancestors https://drive.google.com` を返すため外部からの
 * 埋め込みが完全ブロックされた（2024+ のセキュリティ強化）。
 *
 * v357 の解:
 *   1. GAS server (`getFileBytes` action) が Drive REST `files/<id>?alt=media`
 *      で PDF bytes を取得して base64 で返す（Bearer 付きなので CORS / CSP 回避）
 *   2. client で base64 → Uint8Array → Blob('application/pdf') → URL.createObjectURL
 *   3. その blob: URL を iframe src に → ブラウザ内蔵 PDF viewer で render
 *
 * Mobile (iOS Safari / 一部 Android Chrome): blob URL の iframe で PDF が
 * blank になるケースが知られているため、UA 判定で iframe を出さず「別タブで
 * 開く」CTA を中央に大きく表示する。
 */

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  /** PDF の Drive 上の URL (例: https://drive.google.com/file/d/<id>/view?...) */
  fileUrl: string;
  /** ヘッダーに出すタイトル（研修名など） */
  title?: string;
  /**
   * 境界ごとの fetcher を渡す:
   *   - member / admin: api.getFileBytes.bind(api)（sessionToken 自動付与）
   *   - public: (url) => callApi('getFileBytes', { fileUrl: url })
   * 未指定時は iframe 表示せず「別タブで開く」のみを案内。
   */
  fetchPdfBytes?: (fileUrl: string) => Promise<{ base64: string | null; mimeType?: string; size?: number; error?: string }>;
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  onClose,
  fileUrl,
  title,
  fetchPdfBytes,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'too-large'>('idle');
  const [errorReason, setErrorReason] = useState<string>('');
  const [isMobile] = useState<boolean>(isMobileUserAgent);

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

  // open かつ desktop の場合のみ PDF bytes を取得
  useEffect(() => {
    if (!open) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setStatus('idle');
      setErrorReason('');
      return;
    }
    if (!fileUrl || !fetchPdfBytes || isMobile) {
      // モバイルや fetcher 未指定時は iframe を出さない（CTA だけ表示）
      return;
    }
    let cancelled = false;
    let localBlobUrl: string | null = null;
    setStatus('loading');
    setErrorReason('');
    fetchPdfBytes(fileUrl)
      .then((res) => {
        if (cancelled) return;
        if (!res || !res.base64) {
          if (res?.error === 'file_too_large') {
            setStatus('too-large');
            setErrorReason('file_too_large');
          } else {
            setStatus('error');
            setErrorReason(res?.error || 'unknown');
          }
          return;
        }
        // base64 → Uint8Array
        const bin = atob(res.base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: res.mimeType || 'application/pdf' });
        localBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(localBlobUrl);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setErrorReason('fetch_failed');
      });
    return () => {
      cancelled = true;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [open, fileUrl, fetchPdfBytes, isMobile]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/70 backdrop-blur-sm"
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

        <div className="flex-1 min-h-0 bg-slate-100 flex items-center justify-center">
          {/* Mobile: iframe を出さず「別タブで開く」CTA を中央に */}
          {isMobile && (
            <div className="text-center p-6 max-w-sm">
              <p className="text-slate-700 text-sm mb-4">
                スマートフォンでは、案内PDFは別タブで開いてご覧ください。<br />
                ブラウザの PDF ビューアーで全文表示できます。
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h6v6m0-6L10 15M5 5h6m-6 0v14h14v-6" />
                </svg>
                案内PDFを別タブで開く
              </a>
            </div>
          )}

          {/* Desktop: blob URL iframe */}
          {!isMobile && status === 'loading' && (
            <div className="text-sm text-slate-500">PDFを読み込み中...</div>
          )}
          {!isMobile && status === 'ready' && blobUrl && (
            <iframe
              src={blobUrl}
              title={title ? `${title} の案内PDFプレビュー` : '案内PDFプレビュー'}
              className="w-full h-full border-0 bg-white"
              loading="eager"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            />
          )}
          {!isMobile && status === 'too-large' && (
            <div className="text-center p-6 max-w-md">
              <p className="text-sm text-slate-700 mb-3">
                このPDFは大きいため、プレビュー内では表示しません。
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700"
              >
                案内PDFを別タブで開く
              </a>
            </div>
          )}
          {!isMobile && status === 'error' && (
            <div className="text-center p-6 max-w-md">
              <p className="text-sm text-red-700 mb-3">
                PDFの読み込みに失敗しました（理由: {errorReason || 'unknown'}）。<br />
                「別タブで開く」をご利用ください。
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700"
              >
                案内PDFを別タブで開く
              </a>
            </div>
          )}
          {!isMobile && !fetchPdfBytes && (
            <div className="text-center p-6 max-w-md">
              <p className="text-sm text-slate-700 mb-3">
                このページでは PDF プレビューを表示できません。
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700"
              >
                案内PDFを別タブで開く
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
