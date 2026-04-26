import React, { useEffect, useRef, useState } from 'react';
import { callApi } from '../shared/api-base';

interface PdfThumbnailProps {
  fileUrl: string;
  /** サムネイル高さ px（デフォルト 140） */
  height?: number;
  /** クリックで元URLを新しいタブで開くか（デフォルト true） */
  openOnClick?: boolean;
  /** 追加 className */
  className?: string;
}

type State = 'loading' | 'ok' | 'error';

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  fileUrl,
  height = 140,
  openOnClick = true,
  className = '',
}) => {
  const [state, setState] = useState<State>('loading');
  const [dataUrl, setDataUrl] = useState<string>('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!fileUrl) { setState('error'); return; }

    setState('loading');
    callApi<{ thumbnail: string | null }>('getFileThumbnail', { fileUrl })
      .then((res) => {
        if (!mounted.current) return;
        if (res.thumbnail) {
          setDataUrl(res.thumbnail);
          setState('ok');
        } else {
          setState('error');
        }
      })
      .catch(() => {
        if (mounted.current) setState('error');
      });

    return () => { mounted.current = false; };
  }, [fileUrl]);

  if (!fileUrl || state === 'error') return null;

  const handleClick = () => {
    if (openOnClick) window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm ${openOnClick ? 'cursor-pointer group' : ''} ${className}`}
      style={{ height }}
      onClick={openOnClick ? handleClick : undefined}
      role={openOnClick ? 'button' : undefined}
      aria-label={openOnClick ? '案内PDFを開く' : 'PDF プレビュー'}
      tabIndex={openOnClick ? 0 : undefined}
      onKeyDown={openOnClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      {state === 'loading' && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" aria-hidden="true" />
        </div>
      )}

      {state === 'ok' && (
        <>
          {/* サムネイル画像 */}
          <img
            src={dataUrl}
            alt="案内PDFサムネイル"
            className="h-full w-full object-cover object-top"
            draggable={false}
          />

          {/* ホバーオーバーレイ */}
          {openOnClick && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          )}

          {/* PDF バッジ */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm select-none">
            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            PDF
          </div>

          {/* ホバー時ラベル */}
          {openOnClick && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white shadow select-none">
                クリックで全ページを開く →
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PdfThumbnail;
