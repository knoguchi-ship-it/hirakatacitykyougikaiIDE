import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { Training } from '../types';
import { LinePostTargetType, LinePostAttachmentKind } from '../shared/types';
import { buildPublicTrainingApplyUrl } from '../config/publicPortal';

// v376.39: 公式LINE投稿依頼の編集モーダルを LinePostConsole から抽出し、
// 研修管理画面（文脈起点の作成）とコンソールで共用する（DRY）。
// 研修編集モーダル（z-50）の上に重畳させるため z-[60]。手動投稿前提（自動投稿せず）。

export const LINE_POST_TEXT_MAX = 500;
const ATTACH_MAX_BYTES = 10 * 1024 * 1024;

export interface LinePostEditorForm {
  id: string;
  text: string;
  trainingApplyUrl: string;
  attachmentUrl: string;
  attachmentKind: LinePostAttachmentKind;
  attachmentName: string;
  targetType: LinePostTargetType;
  targetId: string;
  memo: string;
  clearAttachment: boolean;
}

export const emptyLinePostForm = (): LinePostEditorForm => ({
  id: '',
  text: '',
  trainingApplyUrl: '',
  attachmentUrl: '',
  attachmentKind: '',
  attachmentName: '',
  targetType: 'TRAINING',
  targetId: '',
  memo: '',
  clearAttachment: false,
});

interface LinePostEditorModalProps {
  api: ApiClient;
  trainings: Training[];
  /** 事前入力値（研修からの起動時は targetType/targetId/trainingApplyUrl/text を渡す）。 */
  initial?: Partial<LinePostEditorForm>;
  onClose: () => void;
  /** 保存成功時。呼び出し側で必要なら一覧再取得 + クローズを行う。 */
  onSaved: () => void;
}

// 研修開催日時（datetime-local 形式 "2026-06-15T14:00" 等）を表示用に整形。
const formatTrainingDate = (s: string): string => {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const hasTime = /T\d/.test(s);
  return d.toLocaleString('ja-JP', hasTime
    ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
    : { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const trainingPickerLabel = (t: Training): string => {
  const d = formatTrainingDate(t.date);
  return d ? `${t.title}（${d}）` : t.title;
};

// 開催日が「過ぎた」研修か（当日は未来扱いで残す＝開催日 < 今日0時 のとき past）。日付不明は残す。
const isPastTraining = (s: string): boolean => {
  if (!s) return false;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return d.getTime() < startOfToday.getTime();
};

// 研修名で検索して選択する combobox（研修の投稿用）。
const TrainingPicker: React.FC<{
  trainings: Training[];
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ trainings, selectedId, onSelect }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = trainings.find((t) => t.id === selectedId) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? trainings.filter((t) => t.title.toLowerCase().includes(q)) : trainings;
    return base.slice(0, 50);
  }, [query, trainings]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query, open]);

  const choose = (id: string) => {
    onSelect(id);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { if (open && filtered[activeIdx]) { e.preventDefault(); choose(filtered[activeIdx].id); } }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="training-picker-list"
        aria-autocomplete="list"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={selected ? '別の研修を検索…' : '研修名で検索して選択…'}
        className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm min-h-[40px]"
        aria-label="対象研修を研修名で検索して選択"
      />
      {selected && (
        <div className="mt-1 flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-2 py-1 text-sm text-sky-800">
          <span className="truncate">🎓 {trainingPickerLabel(selected)}</span>
          <button
            type="button"
            onClick={() => onSelect('')}
            className="ml-auto shrink-0 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
            aria-label="研修の選択を解除"
          >
            選択解除
          </button>
        </div>
      )}
      {open && (
        <ul
          id="training-picker-list"
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-300 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">該当する開催予定の研修がありません</li>
          ) : (
            filtered.map((t, idx) => (
              <li
                key={t.id}
                role="option"
                aria-selected={t.id === selectedId}
                onMouseDown={(e) => { e.preventDefault(); choose(t.id); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`cursor-pointer px-3 py-2 text-sm ${idx === activeIdx ? 'bg-sky-50' : ''} ${t.id === selectedId ? 'font-semibold text-sky-800' : 'text-slate-700'}`}
              >
                {trainingPickerLabel(t)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

const LinePostEditorModal: React.FC<LinePostEditorModalProps> = ({ api, trainings, initial, onClose, onSaved }) => {
  const [editing, setEditing] = useState<LinePostEditorForm>(() => ({ ...emptyLinePostForm(), ...initial }));
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // 研修ピッカー候補: 削除済を除外し、開催日が過ぎた研修を非表示にする。
  // ただし現在選択中の研修は（過去・削除済でも）候補に残し、表示が消えないようにする。
  const visibleTrainings = useMemo(() => {
    const list = trainings.filter((t) => !t.isDeleted && !isPastTraining(t.date));
    if (editing.targetId && !list.some((t) => t.id === editing.targetId)) {
      const sel = trainings.find((t) => t.id === editing.targetId);
      if (sel) list.unshift(sel);
    }
    return [...list].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return da - db;
    });
  }, [trainings, editing.targetId]);

  const charCount = editing.text.length;
  const remaining = LINE_POST_TEXT_MAX - charCount;

  const requestClose = () => {
    if (!saving && !uploading) onClose();
  };

  // v376.45: submit=true で新規を即「投稿依頼中」にする（既存編集時は submit 無効＝下書き更新のみ）。
  const handleSave = async (submit: boolean) => {
    if (!editing.text.trim()) { setEditError('テキストを入力してください。'); return; }
    if (editing.text.length > LINE_POST_TEXT_MAX) { setEditError(`テキストは${LINE_POST_TEXT_MAX}文字以内で入力してください。`); return; }
    if (editing.targetType === 'TRAINING' && !editing.targetId) { setEditError('対象研修を選択してください。'); return; }
    if (submit && !editing.id && !window.confirm('この内容で投稿依頼をします。よろしいですか？')) return;
    setSaving(true);
    setEditError(null);
    try {
      await api.saveLinePostRequest({
        id: editing.id || undefined,
        text: editing.text,
        trainingApplyUrl: editing.trainingApplyUrl,
        attachmentUrl: editing.attachmentUrl,
        attachmentKind: editing.attachmentKind,
        attachmentName: editing.attachmentName,
        targetType: editing.targetType,
        targetId: editing.targetId,
        memo: editing.memo,
        clearAttachment: editing.clearAttachment,
        submitRequest: submit && !editing.id,
      });
      onSaved();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > ATTACH_MAX_BYTES) { setEditError('ファイルサイズが上限（10MB）を超えています'); return; }
    const isImage = /^image\//.test(file.type);
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) { setEditError('画像（jpg/png/gif/webp）または PDF のみ添付可能です'); return; }
    setUploading(true);
    setEditError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Part = result.split(',')[1] || '';
          resolve(base64Part);
        };
        reader.onerror = () => reject(reader.error || new Error('ファイル読み込みエラー'));
        reader.readAsDataURL(file);
      });
      const uploaded = await api.uploadLinePostAttachment({ base64, mimeType: file.type, fileName: file.name });
      setEditing((prev) => ({
        ...prev,
        attachmentUrl: uploaded.url,
        attachmentKind: uploaded.kind,
        attachmentName: uploaded.fileName,
        clearAttachment: false,
      }));
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label={editing.id ? '投稿依頼を編集' : '投稿依頼を新規作成'}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{editing.id ? '投稿依頼を編集' : '新規 投稿依頼'}</h3>
          <button
            type="button"
            onClick={requestClose}
            aria-label="閉じる"
            className="rounded hover:bg-slate-100 p-2 min-h-[44px] min-w-[44px]"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          {editError && (
            <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{editError}</div>
          )}

          {/* 対象種別 */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">対象</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="TRAINING"
                  checked={editing.targetType === 'TRAINING'}
                  onChange={() => setEditing({ ...editing, targetType: 'TRAINING' })}
                />
                研修の投稿
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="GENERAL"
                  checked={editing.targetType === 'GENERAL'}
                  onChange={() => setEditing({ ...editing, targetType: 'GENERAL', targetId: '' })}
                />
                登録研修以外
              </label>
            </div>
            {editing.targetType === 'TRAINING' && (
              <TrainingPicker
                trainings={visibleTrainings}
                selectedId={editing.targetId}
                onSelect={(id) => {
                  // v376.45: 研修選択時に「研修申込リンク」を自動入力（申込URL→無ければ公開申込ディープリンク）。
                  if (!id) { setEditing({ ...editing, targetId: '' }); return; }
                  const t = trainings.find((x) => x.id === id);
                  const url = String((t && t.applicationUrl) || '').trim() || buildPublicTrainingApplyUrl(id);
                  setEditing({ ...editing, targetId: id, trainingApplyUrl: url });
                }}
              />
            )}
          </fieldset>

          {/* テキスト */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="line-post-text" className="text-sm font-medium text-slate-700">
                テキスト（必須・{LINE_POST_TEXT_MAX}文字以内）
              </label>
              <span
                aria-live="polite"
                className={`text-xs ${remaining < 0 ? 'text-rose-600 font-bold' : remaining < 50 ? 'text-amber-600' : 'text-slate-500'}`}
              >
                残り {remaining} 文字
              </span>
            </div>
            <textarea
              id="line-post-text"
              rows={8}
              value={editing.text}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-medium"
              placeholder="LINE に投稿する本文を入力…"
              maxLength={LINE_POST_TEXT_MAX + 50}
            />
          </div>

          {/* リンク欄（対象により文言が変わる：研修の投稿=研修申込リンク／登録研修以外=掲載リンク） */}
          <div className="space-y-1">
            <label htmlFor="line-post-url" className="text-sm font-medium text-slate-700">
              {editing.targetType === 'GENERAL'
                ? '掲載リンク（資料・申込リンク等）（任意・http(s):// で始まる URL）'
                : '研修申込リンク（任意・http(s):// で始まる URL）'}
            </label>
            <input
              id="line-post-url"
              type="url"
              value={editing.trainingApplyUrl}
              onChange={(e) => setEditing({ ...editing, trainingApplyUrl: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm min-h-[40px]"
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>

          {/* 添付ファイル */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              添付ファイル（任意・画像 or PDF・10MB 以内）
            </label>
            {editing.attachmentUrl ? (
              <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm">{editing.attachmentKind === 'IMAGE' ? '🖼' : '📄'} {editing.attachmentName}</span>
                <a href={editing.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-700 underline">プレビュー</a>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, attachmentUrl: '', attachmentKind: '', attachmentName: '', clearAttachment: true })}
                  className="ml-auto rounded border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 min-h-[32px]"
                >
                  削除
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); if (!uploading) setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (uploading) return;
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleFile(f);
                }}
                className={`rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${dragOver ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-slate-50'}`}
              >
                <p className="text-sm text-slate-600">ここにファイルをドラッグ&ドロップ</p>
                <p className="mt-0.5 text-xs text-slate-400">または</p>
                <label className="mt-2 inline-block cursor-pointer rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 min-h-[44px]">
                  ファイルを選択
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }}
                    disabled={uploading}
                    className="hidden"
                    aria-label="添付ファイルをアップロード"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-400">画像（jpg/png/gif/webp）または PDF・10MB 以内</p>
              </div>
            )}
            {uploading && <p className="text-xs text-slate-500">アップロード中…</p>}
          </div>

          {/* 備考 */}
          <div className="space-y-1">
            <label htmlFor="line-post-memo" className="text-sm font-medium text-slate-700">備考（任意）</label>
            <input
              id="line-post-memo"
              type="text"
              value={editing.memo}
              onChange={(e) => setEditing({ ...editing, memo: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm min-h-[40px]"
              placeholder="LINE 担当者向けメモ（投稿時刻指定等）"
            />
          </div>

          {/* プレビュー */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">プレビュー（LINE 投稿イメージ）</p>
            <LinePreview
              text={editing.text}
              trainingApplyUrl={editing.trainingApplyUrl}
              attachmentUrl={editing.attachmentUrl}
              attachmentKind={editing.attachmentKind}
              attachmentName={editing.attachmentName}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={requestClose}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 min-h-[44px]"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || uploading}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 min-h-[44px] disabled:opacity-50"
          >
            {saving ? '保存中…' : '下書き保存'}
          </button>
          {!editing.id && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || uploading}
              className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 min-h-[44px] disabled:opacity-50"
            >
              {saving ? '保存中…' : '投稿依頼をする'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// v376.44: Drive の attachmentUrl はビューアURL（/d/<id>/view = HTMLページ）のため <img src> に直接渡すと
// 画像が表示されない。ファイルIDを抽出し、画像配信に使える thumbnail エンドポイントへ変換する。
export function driveImageSrc(url: string): string {
  if (!url) return url;
  const m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000` : url;
}

export const LinePreview: React.FC<{
  text: string;
  trainingApplyUrl: string;
  attachmentUrl: string;
  attachmentKind: LinePostAttachmentKind;
  attachmentName: string;
}> = ({ text, trainingApplyUrl, attachmentUrl, attachmentKind, attachmentName }) => {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 max-w-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">L</span>
        <span className="text-sm font-semibold text-emerald-900">枚方市介護支援専門員連絡協議会 公式LINE</span>
      </div>
      <div className="bg-white rounded-lg p-3 space-y-2 shadow-sm">
        {attachmentUrl && attachmentKind === 'IMAGE' && (
          <img src={driveImageSrc(attachmentUrl)} alt={attachmentName} className="w-full rounded max-h-64 object-contain" loading="lazy" />
        )}
        {attachmentUrl && attachmentKind === 'PDF' && (
          <div className="border border-slate-300 rounded p-3 text-sm flex items-center gap-2 bg-slate-50">
            <span className="text-2xl">📄</span>
            <span className="text-slate-700 truncate">{attachmentName}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-sm text-slate-800 break-words">{text || '(本文未入力)'}</p>
        {trainingApplyUrl && (
          <a
            href={trainingApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-sky-700 underline break-all"
          >
            🔗 {trainingApplyUrl}
          </a>
        )}
      </div>
    </div>
  );
};

export default LinePostEditorModal;
