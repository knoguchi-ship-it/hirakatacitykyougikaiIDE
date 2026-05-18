// v365: 汎用コピーボタン。2026 ベストプラクティス準拠:
// - navigator.clipboard.writeText() を優先、失敗時は execCommand fallback
// - クリック直後にアイコン切替 (clipboard → check) で 1.5秒
// - aria-live="polite" で SR にも変化を通知
// - stopPropagation で親の onClick（行クリック等）を阻害しない
// - 44×44px タップターゲット (WCAG 2.2 AAA)
// - HTTPS 必須（localhost は OK）。fallback ありで非対応環境も動作

import React, { useState, useCallback } from 'react';

interface Props {
  /** コピーする文字列 */
  value: string;
  /** アクセシビリティ用ラベル（例: 「会員名をコピー」） */
  label?: string;
  /** 追加 className */
  className?: string;
  /** サイズ（既定: sm = w-4 h-4） */
  size?: 'xs' | 'sm' | 'md';
  /** コピー成功時のコールバック（任意） */
  onCopied?: (value: string) => void;
}

const SIZE_MAP = {
  xs: { icon: 'w-3.5 h-3.5', btn: 'p-1.5' },
  sm: { icon: 'w-4 h-4', btn: 'p-2' },
  md: { icon: 'w-5 h-5', btn: 'p-2.5' },
};

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy fallback
  }
  // Legacy fallback for non-HTTPS / older browsers (deprecated but functional)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

const CopyButton: React.FC<Props> = ({ value, label = 'コピー', className = '', size = 'sm', onCopied }) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const sizing = SIZE_MAP[size];

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;
    const ok = await copyTextToClipboard(value);
    if (ok) {
      setCopied(true);
      setFailed(false);
      onCopied?.(value);
      setTimeout(() => setCopied(false), 1500);
    } else {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    }
  }, [value, onCopied]);

  const ariaLabel = copied
    ? `${label}: コピーしました`
    : failed
      ? `${label}: コピーに失敗しました`
      : `${label}: ${value}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      aria-label={ariaLabel}
      title={copied ? 'コピーしました' : failed ? 'コピーに失敗しました' : `${label}: ${value}`}
      className={`inline-flex items-center justify-center rounded-md transition-colors min-h-[44px] min-w-[44px] ${sizing.btn} ${
        copied
          ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
          : failed
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
      } ${className}`}
    >
      {copied ? (
        // チェックアイコン（コピー成功）
        <svg className={sizing.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : failed ? (
        // ✕ アイコン（失敗）
        <svg className={sizing.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        // クリップボードアイコン（既定）
        <svg className={sizing.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {/* SR 用アナウンス領域（視覚非表示・aria-live） */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {copied ? 'コピーしました' : failed ? 'コピーに失敗しました' : ''}
      </span>
    </button>
  );
};

export default CopyButton;
