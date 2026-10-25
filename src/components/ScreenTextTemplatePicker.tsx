// 2026-10-25 docs/313: 公開ポータルの案内文は定型文（T_画面文テンプレート）から選ぶ。
// 選択は設定の保存で確定する。定型文そのものの追加・編集・削除はその場で保存する（一覧を最新に入れ替える）。
// 選ばれている定型文・その用途の最後の 1 件は削除できない（サーバーも止める）。
import React, { useState } from 'react';
import { api } from '../services/api';
import type { ScreenTextTemplate, ScreenTextTemplatePurpose } from '../types';

type Props = {
  id: string;
  purpose: ScreenTextTemplatePurpose;
  label: string;
  templates: ScreenTextTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  onTemplatesChange: (templates: ScreenTextTemplate[]) => void;
};

type Draft = { id?: string; name: string; body: string };

const ScreenTextTemplatePicker: React.FC<Props> = ({ id, purpose, label, templates, selectedId, onSelect, onTemplatesChange }) => {
  const own = templates.filter((t) => t.purpose === purpose);
  const selected = own.find((t) => t.id === selectedId) || null;
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const save = async () => {
    if (!draft || busy) return;
    if (!draft.name.trim()) { setError('定型文の名前を入力してください。'); return; }
    if (!draft.body.trim()) { setError('定型文の本文が空です。空の定型文は保存できません。'); return; }
    setBusy('save');
    setError('');
    try {
      const result = await api.saveScreenTextTemplate({ id: draft.id, purpose, name: draft.name, body: draft.body });
      onTemplatesChange(result.templates);
      setDraft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (template: ScreenTextTemplate) => {
    if (busy) return;
    if (!window.confirm(`定型文「${template.name}」を削除します。よろしいですか？`)) return;
    setBusy(template.id);
    setError('');
    try {
      const result = await api.deleteScreenTextTemplate(template.id);
      onTemplatesChange(result.templates);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">{label}</label>
      <select
        id={id}
        value={selected ? selected.id : ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
      >
        {!selected && <option value="">（定型文を選んでください）</option>}
        {own.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      {selected ? (
        <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" style={{ whiteSpace: 'pre-line' }}>{selected.body}</p>
      ) : (
        <p role="alert" className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          定型文が選ばれていないため、公開ポータルではこの枠を表示していません。
        </p>
      )}
      <button
        type="button"
        onClick={() => { setEditorOpen((v) => !v); setDraft(null); setError(''); }}
        aria-expanded={editorOpen}
        className="min-h-[44px] text-xs font-medium text-primary-700 underline"
      >
        {editorOpen ? '定型文の編集を閉じる' : `定型文を追加・編集する（${own.length} 件）`}
      </button>
      {editorOpen && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
          <ul className="space-y-2">
            {own.map((t) => {
              const inUse = t.id === selectedId;
              const last = own.length <= 1;
              return (
                <li key={t.id} className="rounded border border-slate-200 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {t.name}{inUse && <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">使用中</span>}
                    </span>
                    <span className="flex gap-2">
                      <button type="button" disabled={!!busy} onClick={() => { setDraft({ id: t.id, name: t.name, body: t.body }); setError(''); }}
                        className="min-h-[44px] rounded border border-slate-300 px-3 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">編集</button>
                      <button type="button" disabled={!!busy || inUse || last} onClick={() => { void remove(t); }}
                        title={inUse ? '使用中の定型文は削除できません。先に別の定型文を選んで保存してください。' : last ? 'この用途の最後の 1 件は削除できません。' : undefined}
                        className="min-h-[44px] rounded border border-red-200 px-3 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50">
                        {busy === t.id ? '削除中…' : '削除'}
                      </button>
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500" style={{ whiteSpace: 'pre-line' }}>{t.body}</p>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-slate-500">使用中の定型文と、この用途の最後の 1 件は削除できません。</p>
          {draft ? (
            <div className="space-y-2 rounded border border-primary-200 bg-primary-50/40 p-3">
              <label htmlFor={`${id}-draft-name`} className="block text-xs font-medium text-slate-600">名前</label>
              <input id={`${id}-draft-name`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm" maxLength={100} />
              <label htmlFor={`${id}-draft-body`} className="block text-xs font-medium text-slate-600">本文</label>
              <textarea id={`${id}-draft-body`} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={4} className="w-full resize-y rounded border border-slate-300 px-3 py-2 text-sm" maxLength={2000} />
              <div className="flex gap-2">
                <button type="button" disabled={!!busy} onClick={() => { void save(); }}
                  className="min-h-[44px] rounded bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {busy === 'save' ? '保存中…' : '定型文を保存'}
                </button>
                <button type="button" disabled={!!busy} onClick={() => { setDraft(null); setError(''); }}
                  className="min-h-[44px] rounded border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">やめる</button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={!!busy} onClick={() => { setDraft({ name: '', body: '' }); setError(''); }}
              className="min-h-[44px] rounded border border-dashed border-slate-400 px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">＋ 新しい定型文</button>
          )}
          {error && <p role="alert" className="whitespace-pre-line text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default ScreenTextTemplatePicker;
