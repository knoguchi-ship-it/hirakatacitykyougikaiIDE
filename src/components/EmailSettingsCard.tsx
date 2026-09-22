/**
 * 入会・登録メール設定セクション用の共通コンポーネント群。
 * App.tsx 内の IIFE で定義すると毎レンダーで新しいコンポーネント型が生成され
 * input/textarea のフォーカスが失われるため、モジュールレベルに抽出。
 */
import React from 'react';
import {
  MAIL_CATEGORY_ORDER,
  MAIL_CATEGORY_STYLES,
  MAIL_CATEGORY_TAB_LABEL,
  type MailCategoryIconKey,
  type MailCategoryKey,
} from '../shared/mailCategories';
import { MAIL_TEMPLATE_MERGE_TAGS, type MailTemplateCategory } from '../shared/mailTemplates';

// ── カテゴリアイコン ───────────────────────────────────────────────────────────
// 色だけに頼らず形でもカテゴリを判別できるようにする（WCAG 1.4.1）。
const MAIL_CATEGORY_ICON_PATHS: Record<MailCategoryIconKey, string[]> = {
  userPlus: [
    'M15 19.5a6 6 0 0 0-12 0',
    'M9 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z',
    'M18 8.25v6',
    'M21 11.25h-6',
  ],
  users: [
    'M14 19.5a5 5 0 0 0-10 0',
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M16.5 11.5a2.75 2.75 0 1 0 0-5.5',
    'M17.5 19.5a4.5 4.5 0 0 0-2.4-3.98',
  ],
  cycle: [
    'M4.5 12a7.5 7.5 0 0 1 12.8-5.3',
    'M19.5 12a7.5 7.5 0 0 1-12.8 5.3',
    'M17.3 3.5v3.2h-3.2',
    'M6.7 20.5v-3.2h3.2',
  ],
  cap: [
    'M12 4 2.5 9 12 14l9.5-5L12 4Z',
    'M6.5 11.2V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.8',
  ],
  clipboardCheck: [
    'M9 4.5h6',
    'M8.25 5.5H6.75A1.5 1.5 0 0 0 5.25 7v12.5A1.5 1.5 0 0 0 6.75 21h10.5a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5h-1.5',
    'M9.5 13.5l2 2 3.5-4',
  ],
  shield: [
    'M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z',
    'M12 10v3.5',
  ],
};

export const MailCategoryIcon: React.FC<{ icon: MailCategoryIconKey; className?: string }> = ({
  icon, className = 'h-4 w-4',
}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {MAIL_CATEGORY_ICON_PATHS[icon].map(d => <path key={d} d={d} />)}
  </svg>
);

// ── グループ見出し ─────────────────────────────────────────────────────────────
// カテゴリ色の帯 + アイコンで、スクロール中でもどのグループを見ているか分かるようにする。
// （`AdminSettingsSection` が overflow-hidden のため sticky は効かない。帯の強調で代替する）
export const MailGroupHeader: React.FC<{
  category: MailCategoryKey;
  title: string;
  count: number;
}> = ({ category, title, count }) => {
  const style = MAIL_CATEGORY_STYLES[category];
  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${style.groupBand}`}>
      <MailCategoryIcon icon={style.icon} className={`h-5 w-5 shrink-0 ${style.groupIcon}`} />
      <h4 className="text-sm font-bold">{title}</h4>
      <span className="ml-auto text-xs font-medium opacity-80">{count} 件</span>
    </div>
  );
};

// ── トグルスイッチ ─────────────────────────────────────────────────────────────
export interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  color?: 'violet' | 'emerald' | 'slate';
  /**
   * 有効時の色を完成形クラス文字列で上書きする（例 'bg-teal-600'）。
   * Tailwind v4 はクラス名を動的生成しないため、呼び出し側も文字列を結合しないこと。
   */
  enabledBgClass?: string;
}
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled, onToggle, onLabel, offLabel, color = 'violet', enabledBgClass,
}) => {
  const bg = enabled
    ? enabledBgClass ?? (color === 'emerald' ? 'bg-emerald-600' : 'bg-violet-600')
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
      このグループの共通スイッチが <strong>無効</strong> のため、以下の設定に関わらず対象メールが停止されます。
    </div>
  );
};

// ── 差し込みの挿入ボタン ───────────────────────────────────────────────────────
// 以前は `マージタグ: {{氏名}} (氏名) {{ログインID}} (ログインID) …` と並べるだけで、
// 利用者が手で打ち込む必要があった。説明の大半はタグ名の繰り返しで、読む価値もなかった。
// ここではクリックでカーソル位置へ挿入する。説明はタグ名と意味が違うときだけ添える。
export const MergeTagInserter: React.FC<{
  items: [string, string][];
  targetLabel: string;
  onInsert: (tag: string) => void;
  justInserted: string | null;
}> = ({ items, targetLabel, onInsert, justInserted }) => {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-xs font-medium text-slate-600">差し込み</span>
        {/* 押した直後だけ結果を文で返す。ボタン側の文言を変えると幅が動いて押しにくくなる。 */}
        <span className="text-[11px] text-slate-500" aria-live="polite">
          {justInserted
            ? <span className="font-semibold text-emerald-700">「{justInserted.replace(/[{}]/g, '')}」を{targetLabel}に入れました</span>
            : <>押すと<strong className="font-semibold text-slate-700">{targetLabel}</strong>のカーソル位置に入ります</>}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(([tag, desc]) => {
          const label = tag.replace(/[{}]/g, '');
          // 説明がタグ名の言い換えでしかないものは出さない。
          // 「氏名／氏名」も「会員マイページURL／マイページURL」も情報が増えない。
          // 「パスワード／初期パスワード」のように説明が意味を足すときだけ添える。
          const hint = desc && !label.includes(desc) ? desc : '';
          const flash = justInserted === tag;
          return (
            <button
              key={tag}
              type="button"
              // mousedown で focus が移ると入力欄のカーソル位置を失う。既定動作を止めて保持する。
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsert(tag)}
              title={hint ? `${label}（${hint}）を挿入` : `${label} を挿入`}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                flash
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-800'
              }`}
            >
              <span className="font-medium">{label}</span>
              {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── 系統の選択 ─────────────────────────────────────────────────────────────────
// 14 枚を一度に並べると画面が長くなりすぎるため、系統を選んでから
// その系統のカードだけを出す。件数と有効数をボタン上に出し、
// 開かなくても「どこが止まっているか」が分かるようにする。
export interface MailCategoryPickerProps {
  value: MailCategoryKey;
  onChange: (next: MailCategoryKey) => void;
  /** 系統ごとの [有効数, 総数] */
  counts: Record<MailCategoryKey, [number, number]>;
}
export const MailCategoryPicker: React.FC<MailCategoryPickerProps> = ({ value, onChange, counts }) => (
  <div role="tablist" aria-label="メール通知の系統" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
    {MAIL_CATEGORY_ORDER.map((key) => {
      const style = MAIL_CATEGORY_STYLES[key];
      const [on, total] = counts[key];
      const selected = key === value;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(key)}
          className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${selected ? style.chipActive : style.chipIdle}`}
        >
          {/* 未選択でもカテゴリ色を残す。灰色にすると系統を色で見分けられなくなる。
              選択の有無は枠線とリングで示す。 */}
          <MailCategoryIcon icon={style.icon} className={`h-5 w-5 shrink-0 ${style.groupIcon}`} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{MAIL_CATEGORY_TAB_LABEL[key]}</span>
            <span className="block text-[11px] font-medium opacity-80">
              {on === 0 ? `${total} 件すべて停止中` : `${total} 件中 ${on} 件が有効`}
            </span>
          </span>
        </button>
      );
    })}
  </div>
);

// ── メール設定カード ───────────────────────────────────────────────────────────
export interface EmailCardProps {
  /** カテゴリ。左端のカラーバー・バッジ色・アイコンを決める。 */
  category: MailCategoryKey;
  badge: string;
  title: string;
  enabled: boolean;
  onToggle: () => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  defaultSubject: string;
  body: string;
  onBodyChange: (v: string) => void;
  /**
   * このメール種別。差し込みタグは `MAIL_TEMPLATE_MERGE_TAGS` から種別で引く。
   * グループ単位で和集合を並べると、そのメールでは使えないタグまで出てしまう
   * （v376.97 以前は受付確認に {{処理備考}} が出ていた）。
   */
  templateCategory: MailTemplateCategory;
  extra?: React.ReactNode;
}
export const EmailCard: React.FC<EmailCardProps> = ({
  category, badge, title, enabled, onToggle,
  subject, onSubjectChange, defaultSubject,
  body, onBodyChange, templateCategory, extra,
}) => {
  const style = MAIL_CATEGORY_STYLES[category];
  const subjectRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const [target, setTarget] = React.useState<'subject' | 'body'>('body');
  const [justInserted, setJustInserted] = React.useState<string | null>(null);
  const flashTimer = React.useRef<number | null>(null);
  React.useEffect(() => () => { if (flashTimer.current) window.clearTimeout(flashTimer.current); }, []);

  const insertTag = (tag: string) => {
    const el: HTMLInputElement | HTMLTextAreaElement | null =
      target === 'subject' ? subjectRef.current : bodyRef.current;
    const current = target === 'subject' ? subject : body;
    const apply = target === 'subject' ? onSubjectChange : onBodyChange;
    // 未フォーカスなら末尾に足す。カーソルがあればその位置へ差し込む（選択中なら置換）。
    const start = el && el.selectionStart != null ? el.selectionStart : current.length;
    const end = el && el.selectionEnd != null ? el.selectionEnd : current.length;
    apply(current.slice(0, start) + tag + current.slice(end));
    setJustInserted(tag);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setJustInserted(null), 1400);
    // 値の反映後にカーソルを挿入直後へ戻す。続けて入力・挿入できるようにする。
    window.requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + tag.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
  <div className={`rounded-xl p-4 space-y-3 ${enabled ? style.cardEnabled : style.cardDisabled}`}>
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${enabled ? style.badgeEnabled : style.badgeDisabled}`}>
        <MailCategoryIcon icon={style.icon} className="h-3.5 w-3.5" />
        {badge}
      </span>
      <span className={`text-sm font-semibold ${enabled ? 'text-slate-800' : 'text-slate-500'}`}>{title}</span>
      {!enabled && (
        <span className="inline-flex rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500">停止中</span>
      )}
    </div>
    <ToggleSwitch enabled={enabled} onToggle={onToggle} enabledBgClass={style.toggleOn}
      onLabel="送信する（有効）" offLabel="送信しない（無効）" />
    <details className="rounded-lg border border-slate-200 bg-white p-3" open={enabled}>
      <summary className="cursor-pointer text-xs font-medium text-slate-600">
        {enabled ? 'メール内容・テンプレートを編集する' : '無効のままメール内容・テンプレートを編集する'}
      </summary>
      {!enabled && <p className="mt-2 text-xs text-slate-500">送信を無効にしたまま文面の準備、保存済みテンプレートの読込・編集ができます。実際に送信するには、この通知を有効にしてください。</p>}
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">件名</label>
          <div className="flex gap-2">
            <input
              ref={subjectRef}
              type="text"
              value={subject}
              onChange={e => onSubjectChange(e.target.value)}
              onFocus={() => setTarget('subject')}
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
        <MergeTagInserter
          items={MAIL_TEMPLATE_MERGE_TAGS[templateCategory]}
          targetLabel={target === 'subject' ? '件名' : '本文'}
          onInsert={insertTag}
          justInserted={justInserted}
        />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">本文</label>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={e => onBodyChange(e.target.value)}
            onFocus={() => setTarget('body')}
            rows={7}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono leading-relaxed resize-y bg-white"
            placeholder="メール本文（上の「差し込み」ボタンで会員名などを入れられます）"
          />
          {extra}
        </div>
      </div>
    </details>
  </div>
  );
};
