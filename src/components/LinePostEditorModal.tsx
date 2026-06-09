import React, { useState } from 'react';
import { ApiClient } from '../services/api';
import { Training } from '../types';
import { LinePostTargetType, LinePostAttachmentKind } from '../shared/types';

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
  targetType: 'GENERAL',
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

const LinePostEditorModal: React.FC<LinePostEditorModalProps> = ({ api, trainings, initial, onClose, onSaved }) => {
  const [editing, setEditing] = useState<LinePostEditorForm>(() => ({ ...emptyLinePostForm(), ...initial }));
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const charCount = editing.text.length;
  const remaining = LINE_POST_TEXT_MAX - charCount;

  const requestClose = () => {
    if (!saving && !uploading) onClose();
  };

  const handleSave = async () => {
    if (!editing.text.trim()) { setEditError('テキストを入力してください。'); return; }
    if (editing.text.length > LINE_POST_TEXT_MAX) { setEditError(`テキストは${LINE_POST_TEXT_MAX}文字以内で入力してください。`); return; }
    if (editing.targetType === 'TRAINING' && !editing.targetId) { setEditError('対象研修を選択してください。'); return; }
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
              <select
                value={editing.targetId}
                onChange={(e) => setEditing({ ...editing, targetId: e.target.value })}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm min-h-[40px]"
                aria-label="対象研修を選択"
              >
                <option value="">— 研修を選択 —</option>
                {trainings.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}{t.date ? ` (${t.date})` : ''}</option>
                ))}
              </select>
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
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
                disabled={uploading}
                className="block text-sm min-h-[44px]"
                aria-label="添付ファイルをアップロード"
              />
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
            onClick={handleSave}
            disabled={saving || uploading}
            className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 min-h-[44px] disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

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
          <img src={attachmentUrl} alt={attachmentName} className="w-full rounded max-h-64 object-contain" loading="lazy" />
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
