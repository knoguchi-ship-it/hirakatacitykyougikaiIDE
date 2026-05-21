import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../services/api';
import { Training } from '../types';
import {
  LinePostRequest,
  LinePostStatus,
  LinePostTargetType,
  LinePostAttachmentKind,
} from '../shared/types';

// v374.1: 公式LINE投稿依頼コンソール（管理者ポータル）
// LINE 担当者向け依頼データ集約所。手動投稿前提（自動投稿せず）。
// 状態: DRAFT (作成中) → REQUESTED (投稿依頼中) → POSTED (投稿済み)
// docs/245 (UI a11y チェックリスト) に準拠

interface LinePostConsoleProps {
  api: ApiClient;
  trainings: Training[];                 // T_研修 から渡される候補（targetType=TRAINING 用 picker）
}

const STATUS_LABEL: Record<LinePostStatus, string> = {
  DRAFT: '作成中',
  REQUESTED: '投稿依頼中',
  POSTED: '投稿済み',
};
const STATUS_COLOR: Record<LinePostStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  REQUESTED: 'bg-amber-50 text-amber-800 border-amber-300',
  POSTED: 'bg-emerald-50 text-emerald-800 border-emerald-300',
};
const STATUS_ICON: Record<LinePostStatus, string> = {
  DRAFT: '📝',
  REQUESTED: '📤',
  POSTED: '✅',
};
const TEXT_MAX = 500;
const ATTACH_MAX_BYTES = 10 * 1024 * 1024;

const emptyForm = (): {
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
} => ({
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

const formatDate = (s: string): string => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('ja-JP', { hour12: false });
  } catch {
    return s;
  }
};

const LinePostConsole: React.FC<LinePostConsoleProps> = ({ api, trainings }) => {
  const [items, setItems] = useState<LinePostRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LinePostStatus | ''>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<LinePostTargetType | ''>('');
  const [keyword, setKeyword] = useState('');

  const [editing, setEditing] = useState<ReturnType<typeof emptyForm> | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detailItem, setDetailItem] = useState<LinePostRequest | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.listLinePostRequests({
        status: statusFilter,
        targetType: targetTypeFilter,
        keyword,
        limit: 200,
      });
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '一覧取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [api, statusFilter, targetTypeFilter, keyword]);

  useEffect(() => { void loadList(); }, [loadList]);

  const trainingLabel = useCallback((id: string): string => {
    const t = trainings.find((x) => x.id === id);
    return t ? `${t.name}${t.date ? ` (${t.date})` : ''}` : `(削除済み研修: ${id})`;
  }, [trainings]);

  const openNew = () => {
    setEditing(emptyForm());
    setEditError(null);
  };

  const openEdit = (item: LinePostRequest) => {
    if (item.status !== 'DRAFT') {
      alert('作成中の依頼のみ編集できます。先に「取り下げ」を行ってください。');
      return;
    }
    setEditing({
      id: item.id,
      text: item.text,
      trainingApplyUrl: item.trainingApplyUrl,
      attachmentUrl: item.attachmentUrl,
      attachmentKind: item.attachmentKind,
      attachmentName: item.attachmentName,
      targetType: item.targetType,
      targetId: item.targetId,
      memo: item.memo,
      clearAttachment: false,
    });
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.text.trim()) { setEditError('テキストを入力してください。'); return; }
    if (editing.text.length > TEXT_MAX) { setEditError(`テキストは${TEXT_MAX}文字以内で入力してください。`); return; }
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
      setEditing(null);
      await loadList();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!editing) return;
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
      setEditing({
        ...editing,
        attachmentUrl: uploaded.url,
        attachmentKind: uploaded.kind,
        attachmentName: uploaded.fileName,
        clearAttachment: false,
      });
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleTransition = async (id: string, action: 'request' | 'post' | 'withdraw') => {
    const labels = { request: '投稿依頼中に変更', post: '投稿済みに変更', withdraw: '取り下げて作成中に戻す' };
    if (!window.confirm(`「${labels[action]}」を実行しますか？`)) return;
    try {
      await api.transitionLinePostRequest({ id, action });
      await loadList();
      setDetailItem(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : '状態変更に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('この依頼を削除しますか？（論理削除のため復元可能）')) return;
    try {
      await api.deleteLinePostRequest(id);
      await loadList();
      setDetailItem(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました');
    }
  };

  const filteredCount = items.length;
  const charCount = editing?.text.length ?? 0;
  const remaining = TEXT_MAX - charCount;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">📱 公式LINE投稿依頼</h2>
        <p className="text-sm text-slate-600">
          公式LINEに投稿したいデータを集約します。LINE 担当者がこの一覧から内容をコピーし、LINE Official Account Manager で手動投稿します。
        </p>
      </header>

      {/* フィルタ + 新規作成 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm flex items-center gap-2">
          <span className="text-slate-600">ステータス:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LinePostStatus | '')}
            className="rounded border border-slate-300 px-2 py-1 text-sm min-h-[36px]"
            aria-label="ステータスで絞り込み"
          >
            <option value="">すべて</option>
            <option value="DRAFT">📝 作成中</option>
            <option value="REQUESTED">📤 投稿依頼中</option>
            <option value="POSTED">✅ 投稿済み</option>
          </select>
        </label>
        <label className="text-sm flex items-center gap-2">
          <span className="text-slate-600">対象:</span>
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value as LinePostTargetType | '')}
            className="rounded border border-slate-300 px-2 py-1 text-sm min-h-[36px]"
            aria-label="対象種別で絞り込み"
          >
            <option value="">すべて</option>
            <option value="GENERAL">一般</option>
            <option value="TRAINING">研修</option>
          </select>
        </label>
        <input
          type="search"
          placeholder="🔍 テキスト / 備考検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-[200px] rounded border border-slate-300 px-3 py-1.5 text-sm min-h-[36px]"
          aria-label="キーワード検索"
        />
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 min-h-[44px]"
        >
          ＋ 新規作成
        </button>
      </section>

      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      {/* 一覧 */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-200 text-sm text-slate-500">
          {loading ? '読み込み中…' : `${filteredCount} 件`}
        </div>
        {filteredCount === 0 && !loading ? (
          <p className="px-4 py-12 text-center text-sm text-slate-400">該当する投稿依頼はありません</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="p-4 hover:bg-slate-50">
                <div className="flex flex-wrap items-start gap-3">
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[item.status]}`}>
                    {STATUS_ICON[item.status]} {STATUS_LABEL[item.status]}
                  </span>
                  {item.targetType === 'TRAINING' && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs text-sky-800">
                      🎓 {trainingLabel(item.targetId)}
                    </span>
                  )}
                  {item.attachmentUrl && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                      {item.attachmentKind === 'IMAGE' ? '🖼' : '📄'} {item.attachmentName}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 line-clamp-3">{item.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 min-h-[32px]"
                  >
                    詳細
                  </button>
                  {item.status === 'DRAFT' && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 min-h-[32px]"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTransition(item.id, 'request')}
                        className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 min-h-[32px]"
                      >
                        📤 投稿依頼へ
                      </button>
                    </>
                  )}
                  {item.status === 'REQUESTED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTransition(item.id, 'post')}
                        className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800 min-h-[32px]"
                      >
                        ✅ 投稿済みにする
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTransition(item.id, 'withdraw')}
                        className="rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 min-h-[32px]"
                      >
                        取り下げ
                      </button>
                    </>
                  )}
                  {item.status !== 'POSTED' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded border border-rose-200 bg-white px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 min-h-[32px]"
                    >
                      削除
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 詳細モーダル */}
      {detailItem && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
          onClick={() => setDetailItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label="投稿依頼詳細"
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">投稿依頼詳細</h3>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                aria-label="閉じる"
                className="rounded hover:bg-slate-100 p-2 min-h-[44px] min-w-[44px]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_COLOR[detailItem.status]}`}>
                  {STATUS_ICON[detailItem.status]} {STATUS_LABEL[detailItem.status]}
                </span>
                {detailItem.targetType === 'TRAINING' && (
                  <span className="text-sm text-slate-600">🎓 {detailItem.targetLabel || trainingLabel(detailItem.targetId)}</span>
                )}
              </div>
              <LinePreview text={detailItem.text} trainingApplyUrl={detailItem.trainingApplyUrl} attachmentUrl={detailItem.attachmentUrl} attachmentKind={detailItem.attachmentKind} attachmentName={detailItem.attachmentName} />
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div><dt className="font-semibold">作成者</dt><dd>{detailItem.createdByEmail}</dd></div>
                <div><dt className="font-semibold">作成日時</dt><dd>{formatDate(detailItem.createdAt)}</dd></div>
                <div><dt className="font-semibold">依頼日時</dt><dd>{formatDate(detailItem.requestedAt)}</dd></div>
                <div><dt className="font-semibold">投稿日時</dt><dd>{formatDate(detailItem.postedAt)}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold">投稿者</dt><dd>{detailItem.postedByEmail || '—'}</dd></div>
                {detailItem.memo && <div className="sm:col-span-2"><dt className="font-semibold">備考</dt><dd className="whitespace-pre-wrap">{detailItem.memo}</dd></div>}
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
          onClick={() => !saving && !uploading && setEditing(null)}
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
                onClick={() => !saving && !uploading && setEditing(null)}
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
                      value="GENERAL"
                      checked={editing.targetType === 'GENERAL'}
                      onChange={() => setEditing({ ...editing, targetType: 'GENERAL', targetId: '' })}
                    />
                    一般投稿
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      value="TRAINING"
                      checked={editing.targetType === 'TRAINING'}
                      onChange={() => setEditing({ ...editing, targetType: 'TRAINING' })}
                    />
                    研修に紐付け
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
                      <option key={t.id} value={t.id}>{t.name}{t.date ? ` (${t.date})` : ''}</option>
                    ))}
                  </select>
                )}
              </fieldset>

              {/* テキスト */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="line-post-text" className="text-sm font-medium text-slate-700">
                    テキスト（必須・{TEXT_MAX}文字以内）
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
                  maxLength={TEXT_MAX + 50}
                />
              </div>

              {/* 研修申込リンク */}
              <div className="space-y-1">
                <label htmlFor="line-post-url" className="text-sm font-medium text-slate-700">
                  研修申込リンク（任意・http(s):// で始まる URL）
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
                onClick={() => !saving && !uploading && setEditing(null)}
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
      )}
    </div>
  );
};

const LinePreview: React.FC<{
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

export default LinePostConsole;
