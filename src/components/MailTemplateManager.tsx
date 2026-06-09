/**
 * v376.42: 全メール種別共通のテンプレート管理パネル。
 * 名前付きスナップショットの 一覧/読込/上書き保存/新規保存/削除 を提供する。
 * カテゴリ単位で自前に一覧を取得し、global state を共有しない（複数カードの並置で衝突しない）。
 *
 * 上書き保存: 「読み込む」した テンプレートの id を保持し、「上書き保存」で同 id を update。
 * 新規保存:   名前を付けて別テンプレートとして insert。
 * runtime のメール本文は呼出側（System設定の <CAT>_SUBJECT/BODY）が正本で、本パネルは保存/読込のみ。
 */
import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { EmailTemplate } from '../types';

interface MailTemplateManagerProps {
  api: ApiClient;
  category: string;
  /** 現在の編集中の件名・本文（保存対象） */
  subject: string;
  body: string;
  /** テンプレート読込時に呼ぶ。件名・本文を呼出側 state へ反映する。 */
  onLoad: (subject: string, body: string) => void;
  /** 任意: 「デフォルトに戻す」で本文をこの値へ戻す（未指定ならボタン非表示） */
  defaultBody?: string;
  /** 任意: 「デフォルトに戻す」で件名もこの値へ戻す */
  defaultSubject?: string;
}

const MailTemplateManager: React.FC<MailTemplateManagerProps> = ({
  api, category, subject, body, onLoad, defaultBody, defaultSubject,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadedId, setLoadedId] = useState<string>('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.listMailTemplates(category)
      .then((r) => { if (alive) setTemplates((r && r.templates) || []); })
      .catch(() => { if (alive) setErr('テンプレート一覧の取得に失敗しました'); });
    return () => { alive = false; };
  }, [api, category]);

  const loadedTemplate = templates.find((t) => t.id === loadedId) || null;

  const handleOverwrite = async () => {
    if (!loadedTemplate) return;
    if (!window.confirm(`テンプレート「${loadedTemplate.name}」を現在の件名・本文で上書き保存しますか？`)) return;
    setSaving(true); setErr(null);
    try {
      const saved = await api.saveMailTemplate({ id: loadedTemplate.id, category, name: loadedTemplate.name, subject, body });
      setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } catch { setErr('上書き保存に失敗しました'); } finally { setSaving(false); }
  };

  const handleSaveNew = async () => {
    if (!newName.trim()) return;
    setSaving(true); setErr(null);
    try {
      const saved = await api.saveMailTemplate({ category, name: newName.trim(), subject, body });
      setTemplates((prev) => [saved, ...prev]);
      setLoadedId(saved.id);
      setShowNew(false); setNewName('');
    } catch { setErr('保存に失敗しました'); } finally { setSaving(false); }
  };

  const handleLoad = (t: EmailTemplate) => {
    if (!window.confirm(`「${t.name}」を読み込みますか？\n現在の件名・本文が置き換わります。`)) return;
    onLoad(t.subject, t.body);
    setLoadedId(t.id);
  };

  const handleDelete = async (t: EmailTemplate) => {
    if (!window.confirm(`「${t.name}」を削除しますか？`)) return;
    setDeleting(t.id); setErr(null);
    try {
      await api.deleteMailTemplate(t.id);
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
      if (loadedId === t.id) setLoadedId('');
    } catch { setErr('削除に失敗しました'); } finally { setDeleting(''); }
  };

  return (
    <div className="mt-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-700">テンプレート管理</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!loadedTemplate || saving}
            className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40"
            title={loadedTemplate ? `「${loadedTemplate.name}」を上書き` : '先にテンプレートを読み込むと上書きできます'}
            onClick={handleOverwrite}
          >{saving ? '保存中…' : '上書き保存'}</button>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-primary-50 border border-primary-300 text-primary-700 hover:bg-primary-100"
            onClick={() => { setShowNew((f) => !f); setNewName(''); }}
          >＋ 新規保存</button>
        </div>
      </div>

      {loadedTemplate && (
        <p className="text-[11px] text-emerald-700 mb-2">編集中のテンプレート: <span className="font-semibold">{loadedTemplate.name}</span></p>
      )}

      {showNew && (
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="新しいテンプレート名" maxLength={50}
            className="flex-1 min-w-[160px] border border-slate-300 rounded px-2 py-1 text-xs"
          />
          <button
            type="button" disabled={saving || !newName.trim()}
            className="px-3 py-1 text-xs rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            onClick={handleSaveNew}
          >{saving ? '保存中…' : '保存'}</button>
          <button
            type="button" className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-100"
            onClick={() => { setShowNew(false); setNewName(''); }}
          >キャンセル</button>
        </div>
      )}

      {err && <p className="text-xs text-rose-600 mb-2">{err}</p>}

      {templates.length === 0 ? (
        <p className="text-xs text-slate-400">保存済みテンプレートはありません</p>
      ) : (
        <ul className="space-y-1">
          {templates.map((t) => (
            <li
              key={t.id}
              className={`flex flex-wrap items-center gap-2 text-xs border rounded px-2 py-1.5 bg-white ${t.id === loadedId ? 'border-emerald-300' : 'border-slate-200'}`}
            >
              <span className="flex-1 min-w-[120px] font-medium text-slate-700 truncate">{t.name}</span>
              <span className="text-slate-400 shrink-0">{String(t.savedAt || '').slice(0, 10)}</span>
              <button
                type="button"
                className="px-2 py-0.5 rounded border border-primary-300 text-primary-700 hover:bg-primary-50 whitespace-nowrap"
                onClick={() => handleLoad(t)}
              >読み込む</button>
              <button
                type="button" disabled={deleting === t.id}
                className="px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 whitespace-nowrap disabled:opacity-50"
                onClick={() => handleDelete(t)}
              >{deleting === t.id ? '…' : '削除'}</button>
            </li>
          ))}
        </ul>
      )}

      {(defaultBody !== undefined || defaultSubject !== undefined) && (
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={() => {
              onLoad(defaultSubject !== undefined ? defaultSubject : subject, defaultBody !== undefined ? defaultBody : body);
              setLoadedId('');
            }}
            className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50"
          >デフォルトに戻す</button>
        </div>
      )}
    </div>
  );
};

export default MailTemplateManager;
