import React, { useCallback, useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { Training } from '../types';
import {
  LinePostRequest,
  LinePostStatus,
  LinePostTargetType,
} from '../shared/types';
import LinePostEditorModal, { LinePreview, LinePostEditorForm } from './LinePostEditorModal';

// v374.1: 公式LINE投稿依頼コンソール（管理者ポータル）
// LINE 担当者向け依頼データ集約所。手動投稿前提（自動投稿せず）。
// 状態: DRAFT (作成中) → REQUESTED (投稿依頼中) → POSTED (投稿済み)
// docs/245 (UI a11y チェックリスト) に準拠

interface LinePostConsoleProps {
  api: ApiClient;
  trainings: Training[];                 // T_研修 から渡される候補（targetType=TRAINING 用 picker）
  canManage?: boolean;                   // v376.45: LINE投稿 管理権限（全件閲覧・投稿済みマーク）。falseは自分の依頼のみ
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
const formatDate = (s: string): string => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('ja-JP', { hour12: false });
  } catch {
    return s;
  }
};

const LinePostConsole: React.FC<LinePostConsoleProps> = ({ api, trainings, canManage = false }) => {
  const [items, setItems] = useState<LinePostRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LinePostStatus | ''>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<LinePostTargetType | ''>('');
  const [keyword, setKeyword] = useState('');

  // null = エディタ非表示。オブジェクト = 表示（initial 値を渡す）。
  const [editorInitial, setEditorInitial] = useState<Partial<LinePostEditorForm> | null>(null);
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
    return t ? `${t.title}${t.date ? ` (${t.date})` : ''}` : `(削除済み研修: ${id})`;
  }, [trainings]);

  const openNew = () => {
    setEditorInitial({});
  };

  const openEdit = (item: LinePostRequest) => {
    if (item.status !== 'DRAFT') {
      alert('作成中の依頼のみ編集できます。先に「取り下げ」を行ってください。');
      return;
    }
    setEditorInitial({
      id: item.id,
      text: item.text,
      trainingApplyUrl: item.trainingApplyUrl,
      attachmentUrl: item.attachmentUrl,
      attachmentKind: item.attachmentKind,
      attachmentName: item.attachmentName,
      targetType: item.targetType,
      targetId: item.targetId,
      memo: item.memo,
    });
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
            <option value="TRAINING">研修の投稿</option>
            <option value="GENERAL">登録研修以外</option>
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
                <p className="mt-1 text-xs text-slate-500">
                  依頼者: {item.createdByName || item.createdByEmail || '—'}
                  {item.requestedAt && <>　/　依頼日時: {formatDate(item.requestedAt)}</>}
                  {item.status === 'POSTED' && <>　/　投稿者: {item.postedByName || item.postedByEmail || '—'}（{formatDate(item.postedAt)}）</>}
                </p>
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
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleTransition(item.id, 'post')}
                          className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800 min-h-[32px]"
                        >
                          ✅ 投稿済みにする
                        </button>
                      )}
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
                <div><dt className="font-semibold">依頼者</dt><dd>{detailItem.createdByName || detailItem.createdByEmail || '—'}{detailItem.createdByName && detailItem.createdByEmail ? `（${detailItem.createdByEmail}）` : ''}</dd></div>
                <div><dt className="font-semibold">作成日時</dt><dd>{formatDate(detailItem.createdAt)}</dd></div>
                <div><dt className="font-semibold">依頼日時</dt><dd>{formatDate(detailItem.requestedAt)}</dd></div>
                <div><dt className="font-semibold">投稿日時</dt><dd>{formatDate(detailItem.postedAt)}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold">投稿者</dt><dd>{detailItem.postedByName || detailItem.postedByEmail || '—'}{detailItem.postedByName && detailItem.postedByEmail ? `（${detailItem.postedByEmail}）` : ''}</dd></div>
                {detailItem.memo && <div className="sm:col-span-2"><dt className="font-semibold">備考</dt><dd className="whitespace-pre-wrap">{detailItem.memo}</dd></div>}
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル（v376.39: LinePostEditorModal に抽出し研修管理画面と共用） */}
      {editorInitial !== null && (
        <LinePostEditorModal
          key={editorInitial.id || 'new'}
          api={api}
          trainings={trainings}
          initial={editorInitial}
          onClose={() => setEditorInitial(null)}
          onSaved={async () => { setEditorInitial(null); await loadList(); }}
        />
      )}
    </div>
  );
};

export default LinePostConsole;
