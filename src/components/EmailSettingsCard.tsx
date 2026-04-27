/**
 * 入会・登録メール設定セクション用の共通コンポーネント群。
 * App.tsx 内の IIFE で定義すると毎レンダーで新しいコンポーネント型が生成され
 * input/textarea のフォーカスが失われるため、モジュールレベルに抽出。
 */
import React from 'react';

// ── トグルスイッチ ─────────────────────────────────────────────────────────────
export interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  color?: 'violet' | 'emerald' | 'slate';
}
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled, onToggle, onLabel, offLabel, color = 'violet',
}) => {
  const bg = enabled
    ? color === 'emerald' ? 'bg-emerald-600' : 'bg-violet-600'
    : 'bg-slate-300';
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative inline-block w-11 h-6 flex-shrink-0">
        <input type="checkbox" className="sr-only" checked={enabled} onChange={onToggle} />
        <div className={`w-11 h-6 rounded-full transition-colors ${bg}`} />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-slate-700">{enabled ? onLabel : offLabel}</span>
    </label>
  );
};

// ── マスタースイッチOFF バナー ─────────────────────────────────────────────────
export const MasterOffBanner: React.FC<{ masterEnabled: boolean }> = ({ masterEnabled }) => {
  if (masterEnabled) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      全体マスタースイッチが <strong>OFF</strong> のため、以下の設定に関わらず全メールが停止されます。
    </div>
  );
};

// ── マージタグ一覧 ─────────────────────────────────────────────────────────────
export const MergeTags: React.FC<{ items: [string, string][] }> = ({ items }) => (
  <p className="text-xs text-slate-500 mb-3">
    マージタグ: {items.map(([tag, desc]) => (
      <span key={tag} className="inline-flex items-center gap-0.5 mx-0.5">
        <code className="bg-slate-100 text-violet-700 px-1 rounded text-[11px]">{tag}</code>
        <span className="text-slate-400 text-[11px]">({desc})</span>
      </span>
    ))}
  </p>
);

// ── メール設定カード ───────────────────────────────────────────────────────────
export interface EmailCardProps {
  badge: string;
  title: string;
  enabled: boolean;
  onToggle: () => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  defaultSubject: string;
  body: string;
  onBodyChange: (v: string) => void;
  extra?: React.ReactNode;
}
export const EmailCard: React.FC<EmailCardProps> = ({
  badge, title, enabled, onToggle,
  subject, onSubjectChange, defaultSubject,
  body, onBodyChange, extra,
}) => (
  <div className={`rounded-xl border p-4 space-y-3 ${enabled ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
    <div className="flex items-center gap-2">
      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{badge}</span>
      <span className="text-sm font-semibold text-slate-800">{title}</span>
    </div>
    <ToggleSwitch enabled={enabled} onToggle={onToggle} onLabel="送信する（ON）" offLabel="送信しない（OFF）" />
    {enabled && (
      <>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">件名</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={subject}
              onChange={e => onSubjectChange(e.target.value)}
              className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
            />
            <button
              type="button"
              onClick={() => onSubjectChange(defaultSubject)}
              className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 whitespace-nowrap bg-white"
            >
              デフォルト
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">本文</label>
          <textarea
            value={body}
            onChange={e => onBodyChange(e.target.value)}
            rows={7}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono leading-relaxed resize-y bg-white"
            placeholder="メール本文（マージタグ使用可能）"
          />
          {extra}
        </div>
      </>
    )}
  </div>
);
