import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClient } from '../services/api';
import { AdminPermissionLevel, SharedMemo } from '../types';

const MEMO_KEY = 'ANNUAL_FEE_BOARD';
const POLL_INTERVAL_MS = 60_000;

function formatUpdatedAt(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}時間前`;
  // 日付表示
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  api: ApiClient;
  adminPermissionLevel: AdminPermissionLevel | null;
  /** v366: 親スクロール領域内で上部に sticky 表示する（sm+ のみ）。スクロール時は自動 collapsed */
  sticky?: boolean;
}

const SharedMemoPanel: React.FC<Props> = ({ api, adminPermissionLevel, sticky = false }) => {
  const canWrite = adminPermissionLevel === 'MASTER' || adminPermissionLevel === 'ADMIN';

  const [memo, setMemo] = useState<SharedMemo | null>(null);
  const [draft, setDraft] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [conflict, setConflict] = useState<SharedMemo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // v366: sticky モード時、IntersectionObserver で「上部に張り付いている」状態を検知し
  // 自動的に collapsed = true にする（コンパクトヘッダーのみ表示）。
  // ユーザーが click で展開した場合は peek 表示として一時的に expand。
  const [stuck, setStuck] = useState(false);
  const stickySentinelRef = useRef<HTMLDivElement>(null);

  const saveMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFocused = useRef(false);

  const applyMemo = useCallback((loaded: SharedMemo, force = false) => {
    setMemo(loaded);
    if (!isFocused.current || force) {
      setDraft(loaded.content);
      setIsDirty(false);
    }
  }, []);

  const loadMemo = useCallback(async (silent = false) => {
    try {
      const loaded = await api.getSharedMemo(MEMO_KEY);
      if (!silent) setLoadError(null);
      // 編集中でバージョンが上がっていたら競合を通知
      setMemo(prev => {
        if (prev && loaded.version > prev.version && isFocused.current) {
          setConflict(loaded);
          return prev;
        }
        applyMemo(loaded);
        return loaded;
      });
    } catch (e) {
      if (!silent) setLoadError('メモの読み込みに失敗しました。');
    }
  }, [api, applyMemo]);

  // 初回ロード
  useEffect(() => {
    loadMemo();
  }, [loadMemo]);

  // 自動ポーリング
  useEffect(() => {
    const schedule = () => {
      pollTimer.current = setTimeout(async () => {
        await loadMemo(true);
        schedule();
      }, POLL_INTERVAL_MS);
    };
    schedule();
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [loadMemo]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isFocused.current && canWrite) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const showSaveMessage = (type: 'success' | 'error', text: string) => {
    if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
    setSaveMessage({ type, text });
    saveMessageTimer.current = setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!canWrite || saving) return;
    setSaving(true);
    try {
      const currentVersion = memo?.version ?? 0;
      const result = await api.saveSharedMemo(MEMO_KEY, draft, currentVersion);
      if (result.conflict && result.current) {
        setConflict(result.current);
        setSaving(false);
        return;
      }
      const saved: SharedMemo = {
        key: MEMO_KEY,
        content: result.content ?? draft,
        updatedByEmail: result.updatedByEmail ?? '',
        updatedByName: result.updatedByName ?? '',
        updatedAt: result.updatedAt ?? '',
        version: result.version ?? (currentVersion + 1),
      };
      setMemo(saved);
      setDraft(saved.content);
      setIsDirty(false);
      setConflict(null);
      showSaveMessage('success', '保存しました');
    } catch {
      showSaveMessage('error', '保存に失敗しました。再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptServer = () => {
    if (!conflict) return;
    applyMemo(conflict, true);
    setConflict(null);
  };

  const handleForceOverwrite = async () => {
    if (!conflict) return;
    setConflict(null);
    // バージョンをサーバーに合わせて上書き保存
    setSaving(true);
    try {
      const result = await api.saveSharedMemo(MEMO_KEY, draft, conflict.version);
      if (result.conflict && result.current) {
        setConflict(result.current);
        setSaving(false);
        return;
      }
      const saved: SharedMemo = {
        key: MEMO_KEY,
        content: result.content ?? draft,
        updatedByEmail: result.updatedByEmail ?? '',
        updatedByName: result.updatedByName ?? '',
        updatedAt: result.updatedAt ?? '',
        version: result.version ?? (conflict.version + 1),
      };
      setMemo(saved);
      setDraft(saved.content);
      setIsDirty(false);
      showSaveMessage('success', '上書き保存しました');
    } catch {
      showSaveMessage('error', '保存に失敗しました。再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const metaText = memo?.updatedByName
    ? `最終更新: ${memo.updatedByName} · ${formatUpdatedAt(memo.updatedAt)}`
    : memo?.updatedAt
      ? `最終更新: ${formatUpdatedAt(memo.updatedAt)}`
      : '未記入';

  // v366: sticky モードでは sentinel が viewport 外 (top) になったら stuck = true
  useEffect(() => {
    if (!sticky) {
      setStuck(false);
      return;
    }
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // sentinel が見えている (top にいる) → not stuck
          // sentinel が見えなくなった (上にスクロールアウト) → stuck
          setStuck(!entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sticky]);

  // v366: stuck になったタイミングで自動 collapse（peek 表示への入口）
  // 既にユーザーが手動で collapsed していた場合はそのまま、展開していた場合のみ collapse する
  const prevStuck = useRef(false);
  useEffect(() => {
    if (sticky && stuck && !prevStuck.current && !collapsed) {
      setCollapsed(true);
    }
    prevStuck.current = stuck;
  }, [stuck, sticky, collapsed]);

  // v366: sticky 用 wrapper クラス。sm+ のみ sticky 適用、< 640px は通常配置
  const wrapperClass = sticky
    ? 'sm:sticky sm:top-0 sm:z-30'
    : '';
  const panelShadowClass = sticky && stuck ? 'sm:shadow-lg' : 'shadow-sm';

  return (
    <div className={wrapperClass}>
      {/* v366: sticky 検知用の sentinel（高さ0・視覚非表示） */}
      {sticky && <div ref={stickySentinelRef} aria-hidden="true" style={{ height: 1, marginTop: -1 }} />}
      <div className={`bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-xl ${panelShadowClass} overflow-hidden transition-shadow`}>
      {/* ヘッダー */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-amber-700 text-base" aria-hidden="true">🗒</span>
          <span className="font-semibold text-amber-900 text-sm">申し送りメモ</span>
          {!collapsed && (
            <span className="text-amber-600 text-xs truncate hidden sm:inline">{metaText}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isDirty && !collapsed && (
            <span className="text-xs text-amber-700 font-medium">未保存</span>
          )}
          <span className="text-amber-600 text-xs">{collapsed ? '▼ 開く' : '▲ 閉じる'}</span>
        </div>
      </button>

      {/* 本体 */}
      {!collapsed && (
        <div className="px-5 pb-4 space-y-2">
          {/* 競合バナー */}
          {conflict && (
            <div className="flex flex-wrap items-start gap-2 bg-orange-50 border border-orange-300 rounded px-3 py-2 text-sm text-orange-800">
              <span className="flex-1 min-w-0">
                ⚠ 別の管理者（{conflict.updatedByName || conflict.updatedByEmail}）が更新しました。
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAcceptServer}
                  className="px-3 py-1 rounded bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-900 font-medium text-xs transition-colors"
                >
                  サーバーの内容を読み込む
                </button>
                <button
                  type="button"
                  onClick={handleForceOverwrite}
                  className="px-3 py-1 rounded bg-white hover:bg-orange-50 border border-orange-300 text-orange-800 text-xs transition-colors"
                >
                  このまま上書き保存
                </button>
              </div>
            </div>
          )}

          {/* ロードエラー */}
          {loadError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {loadError}
            </div>
          )}

          {/* テキストエリア */}
          {canWrite ? (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => { setDraft(e.target.value); setIsDirty(e.target.value !== (memo?.content ?? '')); }}
              onFocus={() => { isFocused.current = true; }}
              onBlur={() => { isFocused.current = false; }}
              placeholder="申し送り事項をメモしてください（全管理者で共有されます）"
              className="w-full min-h-[80px] resize-y border border-amber-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 leading-relaxed"
              disabled={saving}
            />
          ) : (
            <div className="w-full min-h-[60px] border border-amber-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white/60 leading-relaxed whitespace-pre-wrap">
              {memo?.content || <span className="text-slate-400">申し送り事項なし</span>}
              <span className="ml-2 text-xs text-slate-400 align-middle">🔒 閲覧のみ</span>
            </div>
          )}

          {/* フッター */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-amber-600">
              <span>{metaText}</span>
              <span className="hidden sm:inline text-amber-400">·</span>
              <span className="hidden sm:inline">↻ 60秒ごと自動更新</span>
            </div>
            {canWrite && (
              <div className="flex items-center gap-2">
                {saveMessage && (
                  <span className={`text-xs font-medium ${saveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {saveMessage.text}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => loadMemo()}
                  title="今すぐ更新"
                  className="px-2 py-1.5 rounded text-xs text-amber-700 border border-amber-300 bg-white hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={saving}
                >
                  ↻ 今すぐ更新
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  title="保存 (Ctrl+S)"
                  className="px-4 py-1.5 rounded text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 disabled:text-amber-400 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            )}
            {!canWrite && (
              <button
                type="button"
                onClick={() => loadMemo()}
                title="今すぐ更新"
                className="px-2 py-1.5 rounded text-xs text-amber-700 border border-amber-300 bg-white hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                ↻ 今すぐ更新
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SharedMemoPanel;
