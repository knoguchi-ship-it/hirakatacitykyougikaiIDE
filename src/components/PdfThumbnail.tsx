import React from 'react';

interface PdfThumbnailProps {
  /** Drive に保存済みのサムネイル画像 URL（永続 URL）*/
  thumbnailUrl: string;
  /** クリックで fileUrl を新しいタブで開くか（デフォルト true） */
  fileUrl?: string;
  /** サムネイル高さ px（デフォルト 140） */
  height?: number;
  /** 追加 className */
  className?: string;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  thumbnailUrl,
  fileUrl,
  height = 140,
  className = '',
}) => {
  if (!thumbnailUrl) return null;

  const clickable = !!fileUrl;

  const handleClick = () => {
    if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm ${clickable ? 'cursor-pointer group' : ''} ${className}`}
      style={{ height }}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? '案内PDFを開く' : 'PDF サムネイル'}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      <img
        src={thumbnailUrl}
        alt="案内PDFサムネイル"
        className="h-full w-full object-cover object-top"
        draggable={false}
      />

      {/* ホバーオーバーレイ */}
      {clickable && (
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
      {clickable && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white shadow select-none">
            クリックで全ページを開く →
          </span>
        </div>
      )}
    </div>
  );
};

export default PdfThumbnail;
