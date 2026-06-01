// v376.11: 既存研修の詳細を大画面で表示する共通モーダルシェル。
// 設計準拠: 既存 PdfPreviewModal.tsx と同じ a11y / ESC / focus restore / scroll lock パターン。
//   - role="dialog" + aria-modal="true" + aria-labelledby
//   - ESC キーで close
//   - backdrop クリックで close
//   - open 時に body scroll lock、close 時に previous focus へ戻す
//   - モバイル fullscreen / デスクトップ 95vw/95vh max-w-1600px
import React, { useEffect, useRef } from 'react';

interface TrainingDetailModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** モーダル header 右に並べるタブボタン群（編集/名簿/メール/削除など） */
  headerActions?: React.ReactNode;
  /** モーダル body の中身 */
  children: React.ReactNode;
}

const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  open,
  title,
  onClose,
  headerActions,
  children,
}) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  // v376.33: onClose を ref 経由で参照し、effect 依存から外す。
  // 親が onClose を useCallback していないと毎レンダーで参照が変わり、依存に含めると
  // 入力1文字ごとに effect が再実行 → cleanup の focus 復元 + closeButton への再フォーカスで
  // 入力欄からフォーカスが奪われる（フォーム入力不能）バグの原因だった。
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
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
    // open の変化時のみ実行（onClose は ref 経由で最新を参照）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="training-detail-title"
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white shadow-2xl flex flex-col w-full h-[100dvh] sm:h-[95vh] sm:w-[95vw] sm:max-w-[1600px] sm:rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0">
          <h2
            id="training-detail-title"
            className="text-base sm:text-lg font-bold text-slate-900 truncate min-w-0 flex-1"
          >
            {title || '(未入力)'}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Sticky tabs (header actions) — モバイルでは横スクロール許容 */}
        {headerActions && (
          <div className="px-4 sm:px-6 py-2 border-b border-slate-100 bg-slate-50 flex-shrink-0 overflow-x-auto">
            <div className="flex gap-1 flex-nowrap min-w-max">{headerActions}</div>
          </div>
        )}

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        >
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetailModal;
