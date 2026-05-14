import React, { useEffect, useState } from 'react';

interface PdfThumbnailProps {
  /** Drive 上の事前生成 PNG サムネイルの URL（fetchThumbnail に渡される） */
  thumbnailUrl: string;
  /** PDF サムネイル base64 data URL を取得する関数（境界ごとに API 経路が違う） */
  fetchThumbnail: (thumbnailUrl: string) => Promise<string | null>;
  /** PDF 本体の URL（カードをクリックすると新しいタブで開く先） */
  fileUrl?: string;
  /** サムネイル高さ px（aspectRatio 未指定時のデフォルト 140） */
  height?: number;
  /** CSS aspect-ratio (例: '210 / 297' で A4 縦)。指定時は width=100% で aspect 維持。 */
  aspectRatio?: string;
  /** 追加 className */
  className?: string;
}

/**
 * v349: 引数 thumbnailUrl は uploadTrainingFile_ がアップロード時に永続保存した
 * PNG ファイルの Drive URL。fetchThumbnail でサーバーが PNG bytes を base64 化して
 * 返す。クリック時は fileUrl (PDF) を新タブで開く。
 */
const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  thumbnailUrl,
  fetchThumbnail,
  fileUrl,
  height = 140,
  aspectRatio,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  useEffect(() => {
    if (!thumbnailUrl) {
      setDataUrl(null);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    fetchThumbnail(thumbnailUrl)
      .then((url) => {
        if (cancelled) return;
        if (url) {
          setDataUrl(url);
          setStatus('loaded');
        } else {
          setDataUrl(null);
          setStatus('error');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setDataUrl(null);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [thumbnailUrl, fetchThumbnail]);

  const clickable = !!fileUrl;

  const handleClick = () => {
    if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  // aspectRatio が指定されればそれを優先、なければ height 固定
  const containerStyle: React.CSSProperties = aspectRatio
    ? { aspectRatio, width: '100%' }
    : { height };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm ${clickable ? 'cursor-pointer group' : ''} ${className}`}
      style={containerStyle}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? '案内PDFを開く' : 'PDF サムネイル'}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      {status === 'loaded' && dataUrl && (
        <img
          src={dataUrl}
          alt="案内PDFサムネイル"
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      )}
      {status === 'loading' && (
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
          サムネイル読み込み中...
        </div>
      )}
      {status === 'error' && (
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
          PDF プレビューを読み込めませんでした
        </div>
      )}

      {clickable && status === 'loaded' && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      )}

      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm select-none">
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
        PDF
      </div>

      {clickable && status === 'loaded' && (
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
