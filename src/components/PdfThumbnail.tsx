import React, { useState } from 'react';
import { toPdfPreviewUrl } from '../shared/pdfUtils';

interface PdfThumbnailProps {
  fileUrl: string;
  /** サムネイル高さ px（デフォルト 140） */
  height?: number;
  /** クリックで元URLを新しいタブで開くか（デフォルト true） */
  openOnClick?: boolean;
  /** 追加 className */
  className?: string;
  /** ラベルを表示するか（デフォルト true） */
  showLabel?: boolean;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  fileUrl,
  height = 140,
  openOnClick = true,
  className = '',
  showLabel = true,
}) => {
  const [loadError, setLoadError] = useState(false);
  const previewUrl = toPdfPreviewUrl(fileUrl);

  if (!previewUrl || loadError) return null;

  const handleClick = () => {
    if (openOnClick && fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm ${openOnClick ? 'cursor-pointer group' : ''} ${className}`}
      style={{ height }}
      onClick={handleClick}
      role={openOnClick ? 'button' : undefined}
      aria-label={openOnClick ? '案内PDFを開く' : 'PDF プレビュー'}
      tabIndex={openOnClick ? 0 : undefined}
      onKeyDown={openOnClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      {/* PDF iframe（pointer-events-none でクリックを親に委譲） */}
      <iframe
        src={previewUrl}
        title="案内PDF プレビュー"
        className="w-full pointer-events-none"
        style={{ height: height * 1.6, border: 'none', marginTop: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setLoadError(true)}
        aria-hidden="true"
      />

      {/* グラデーションオーバーレイ（下部をフェード） */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-white/90 pointer-events-none" />

      {/* ホバーオーバーレイ */}
      {openOnClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors pointer-events-none" />
      )}

      {/* PDF バッジ */}
      {showLabel && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
          PDF
        </div>
      )}

      {/* クリック促進ラベル（ホバー時のみ表示） */}
      {openOnClick && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white shadow">
            クリックで全ページを開く →
          </span>
        </div>
      )}
    </div>
  );
};

export default PdfThumbnail;
