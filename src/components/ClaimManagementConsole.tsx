/**
 * ClaimManagementConsole — 請求管理コンソール（管理者用）
 *
 * - 請求一覧: 状態/会員/種別/日付フィルター・SLA 警告（14日超）
 * - インライン承認 / 却下（理由必須・5文字以上）
 * - 管理者削除（全状態・ソフト削除）
 * - 承認済み → 支払い履歴コンソールへの連携誘導
 * - WCAG 2.2: テキスト+アイコン+aria-label のステータスバッジ
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../services/api';
import {
  ClaimAttachment,
  ClaimRecord,
  OfficerMasterData,
} from '../shared/types';

interface ClaimManagementConsoleProps {
  api: ApiClient;
  onOpenPaymentConsole?: (claimId: string, memberId: string) => void;
}

// ── 定数 ────────────────────────────────────────────────────────────────────

const SLA_WARNING_DAYS = 14;

const STATUS_CONFIG: Record<ClaimRecord['請求状態'], { label: string; icon: string; cls: string }> = {
  申請中:    { label: '申請中',    icon: '⏳', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  承認済み:  { label: '承認済み',  icon: '✓',  cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  支払い済み: { label: '支払い済み', icon: '✓✓', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  却下:      { label: '却下',      icon: '✕',  cls: 'bg-red-50 text-red-700 ring-red-200' },
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'すべての状態' },
  { value: '申請中', label: '申請中' },
  { value: '承認済み', label: '承認済み' },
  { value: '支払い済み', label: '支払い済み' },
  { value: '却下', label: '却下' },
];

const inputCls = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const btnPrimary = 'rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50';
const btnSec = 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

// ── ユーティリティ ────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function parseAttachments(jsonStr: string): ClaimAttachment[] {
  if (!jsonStr) return [];
  try { return JSON.parse(jsonStr); } catch { return []; }
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ClaimRecord['請求状態'] }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: '?', cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.cls}`} aria-label={`請求状態: ${cfg.label}`}>
      <span aria-hidden="true">{cfg.icon}</span>{cfg.label}
    </span>
  );
};

// ── メインコンポーネント ──────────────────────────────────────────────────────

const ClaimManagementConsole: React.FC<ClaimManagementConsoleProps> = ({ api, onOpenPaymentConsole }) => {
  const [masterData, setMasterData] = useState<OfficerMasterData | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // フィルター
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterTypeCode, setFilterTypeCode] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showSlaOnly, setShowSlaOnly] = useState(false);

  // 展開
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 却下フォーム
  const [rejectTarget, setRejectTarget] = useState<ClaimRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);

  // 操作状態
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [m, c] = await Promise.all([
        api.getOfficerMasterData(),
        api.getClaims(),
      ]);
      setMasterData(m);
      setClaims(c);
    } catch (e: any) {
      setLoadError(e?.message || '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const typeMap = useMemo(() => Object.fromEntries((masterData?.paymentTypes ?? []).map(t => [t.種別コード, t.種別名])), [masterData]);
  const orgMap = useMemo(() => Object.fromEntries((masterData?.organizations ?? []).map(o => [o.組織コード, o.組織名])), [masterData]);
  const roleMap = useMemo(() => Object.fromEntries((masterData?.roles ?? []).map(r => [r.役職コード, r.役職名])), [masterData]);

  // 会員ドロップダウン用（重複排除）
  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    return claims.filter(c => { if (seen.has(c.会員ID)) return false; seen.add(c.会員ID); return true; })
      .map(c => ({ id: c.会員ID, name: c.表示名 ?? c.会員ID }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [claims]);

  // 種別ドロップダウン用
  const activeTypes = useMemo(
    () => (masterData?.paymentTypes ?? []).filter(t => !t.削除フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0)),
    [masterData],
  );

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      if (filterStatus && c.請求状態 !== filterStatus) return false;
      if (filterMemberId && c.会員ID !== filterMemberId) return false;
      if (filterTypeCode && c.種別コード !== filterTypeCode) return false;
      if (filterDateFrom && c.活動日 < filterDateFrom) return false;
      if (filterDateTo && c.活動日 > filterDateTo) return false;
      if (showSlaOnly && !(c.請求状態 === '申請中' && daysSince(c.作成日時) >= SLA_WARNING_DAYS)) return false;
      return true;
    });
  }, [claims, filterStatus, filterMemberId, filterTypeCode, filterDateFrom, filterDateTo, showSlaOnly]);

  const slaCount = useMemo(
    () => claims.filter(c => c.請求状態 === '申請中' && daysSince(c.作成日時) >= SLA_WARNING_DAYS).length,
    [claims],
  );

  const isFiltered = !!(filterStatus || filterMemberId || filterTypeCode || filterDateFrom || filterDateTo || showSlaOnly);

  const clearFilters = () => {
    setFilterStatus(''); setFilterMemberId(''); setFilterTypeCode('');
    setFilterDateFrom(''); setFilterDateTo(''); setShowSlaOnly(false);
  };

  const toggleExpand = (id: string) => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // 承認
  const handleApprove = async (claimId: string) => {
    if (!window.confirm('この請求を承認しますか？')) return;
    setApprovingId(claimId);
    try {
      await api.approveClaim({ claimId });
      setClaims(prev => prev.map(c => c.請求ID !== claimId ? c : { ...c, 請求状態: '承認済み' }));
    } catch (e: any) {
      alert(e?.message || '承認に失敗しました。');
    } finally {
      setApprovingId(null);
    }
  };

  // 却下フォーム
  const openReject = (claim: ClaimRecord) => {
    setRejectTarget(claim);
    setRejectReason('');
    setRejectError('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) { setRejectError('却下理由は5文字以上入力してください。'); return; }
    setRejectSaving(true);
    try {
      await api.rejectClaim({ claimId: rejectTarget.請求ID, reason: trimmed });
      setClaims(prev => prev.map(c => c.請求ID !== rejectTarget.請求ID ? c : { ...c, 請求状態: '却下', 却下理由: trimmed }));
      setRejectTarget(null);
    } catch (e: any) {
      setRejectError(e?.message || '却下処理に失敗しました。');
    } finally {
      setRejectSaving(false);
    }
  };

  // 削除
  const handleDelete = async (claimId: string, memberName: string) => {
    if (!window.confirm(`「${memberName}」の請求を削除しますか？\n削除後は元に戻せません。`)) return;
    setDeletingId(claimId);
    try {
      await api.adminDeleteClaim({ claimId });
      setClaims(prev => prev.filter(c => c.請求ID !== claimId));
    } catch (e: any) {
      alert(e?.message || '削除に失敗しました。');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="mx-auto max-w-5xl p-6 text-center text-sm text-slate-500">読み込み中…</div>;
  if (loadError) return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {loadError}<button onClick={() => void load()} className="ml-3 underline">再読み込み</button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">請求管理コンソール</h2>
        <p className="mt-1 text-sm text-slate-500">役員からの活動費・交通費等の請求を審査・承認・却下します。</p>
      </div>

      {/* SLA 警告バー */}
      {slaCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <span className="text-lg" aria-hidden="true">⚠️</span>
          <p className="text-sm font-semibold text-amber-800">
            申請中の請求のうち <span className="text-amber-900">{slaCount} 件</span>が {SLA_WARNING_DAYS} 日以上未処理です。
          </p>
          <button type="button" onClick={() => setShowSlaOnly(true)} className="ml-auto rounded-lg border border-amber-400 bg-white px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">
            該当件のみ表示
          </button>
        </div>
      )}

      {/* フィルターバー */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">状態</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">会員</label>
          <select value={filterMemberId} onChange={e => setFilterMemberId(e.target.value)} className={inputCls}>
            <option value="">すべての会員</option>
            {uniqueMembers.map(m => <option key={m.id} value={m.id}>{m.name}（{m.id}）</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">種別</label>
          <select value={filterTypeCode} onChange={e => setFilterTypeCode(e.target.value)} className={inputCls}>
            <option value="">すべての種別</option>
            {activeTypes.map(t => <option key={t.種別コード} value={t.種別コード}>{t.種別名}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">活動日（FROM）</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">活動日（TO）</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={inputCls} />
        </div>
        {isFiltered && (
          <button type="button" onClick={clearFilters} className={btnSec}>クリア</button>
        )}
        <button type="button" onClick={() => void load()} className={`${btnSec} ml-auto`}>↻ 更新</button>
      </div>

      {/* 集計バー */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-sm text-slate-600">
          表示件数: <span className="font-semibold text-slate-800">{filteredClaims.length}</span> 件
          {isFiltered && <span className="ml-1 text-slate-400">（全 {claims.length} 件中）</span>}
        </p>
        <p className="text-sm text-slate-600">
          表示合計: <span className="font-bold text-slate-800">
            ¥{filteredClaims.reduce((s, c) => s + Number(c.請求金額 || 0), 0).toLocaleString('ja-JP')}
          </span>
        </p>
      </div>

      {/* 却下フォーム */}
      {rejectTarget && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-red-800">
            却下処理 — {rejectTarget.表示名}（{typeMap[rejectTarget.種別コード] ?? rejectTarget.種別コード} ¥{Number(rejectTarget.請求金額 || 0).toLocaleString('ja-JP')}）
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">却下理由 <span className="text-red-500">*</span>（5文字以上）</label>
            <textarea
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
              rows={3}
              maxLength={200}
              placeholder="例: 領収書の添付が必要です。再申請してください。"
              className="w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
            />
            {rejectError && <p className="mt-0.5 text-xs text-red-600" role="alert">{rejectError}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleReject} disabled={rejectSaving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {rejectSaving ? '処理中…' : '却下を確定'}
            </button>
            <button type="button" onClick={() => setRejectTarget(null)} className={btnSec}>キャンセル</button>
          </div>
        </div>
      )}

      {/* 請求テーブル */}
      {filteredClaims.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <p className="text-sm text-slate-400">条件に一致する請求がありません。</p>
          {isFiltered && <button type="button" onClick={clearFilters} className="mt-2 text-sm text-primary-600 underline hover:no-underline">フィルターをリセット</button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="px-3 py-3">会員 / 種別</th>
                <th className="px-3 py-3">活動日</th>
                <th className="px-3 py-3">申請日</th>
                <th className="px-3 py-3 text-right">金額</th>
                <th className="px-3 py-3">状態</th>
                <th className="px-3 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredClaims.map(claim => {
                const expanded = expandedIds.has(claim.請求ID);
                const days = daysSince(claim.作成日時);
                const isSlaWarning = claim.請求状態 === '申請中' && days >= SLA_WARNING_DAYS;
                const attachments = parseAttachments(claim.添付ファイルURL);

                return (
                  <React.Fragment key={claim.請求ID}>
                    <tr className={isSlaWarning ? 'bg-amber-50/40' : undefined}>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => toggleExpand(claim.請求ID)} aria-label={expanded ? '詳細を閉じる' : '詳細を開く'} className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-colors">
                          <svg viewBox="0 0 12 12" fill="currentColor" className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true">
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-800">{claim.表示名 ?? claim.会員ID}</p>
                        <p className="text-xs text-slate-400">{typeMap[claim.種別コード] ?? claim.種別コード}</p>
                        {roleMap[claim.役職コード] && <p className="text-xs text-slate-400">{roleMap[claim.役職コード]}</p>}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{claim.活動日}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs ${isSlaWarning ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>
                          {claim.作成日時?.slice(0, 10)}
                          {isSlaWarning && <span className="ml-1" aria-label={`${days}日経過（要対応）`}>⚠{days}日</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-800">
                        ¥{Number(claim.請求金額 || 0).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={claim.請求状態} /></td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {claim.請求状態 !== '支払い済み' && (
                            <>
                              {claim.請求状態 !== '承認済み' && claim.請求状態 !== '却下' && (
                                <button type="button" onClick={() => handleApprove(claim.請求ID)} disabled={approvingId === claim.請求ID} className={btnPrimary}>
                                  {approvingId === claim.請求ID ? '…' : '承認'}
                                </button>
                              )}
                              {claim.請求状態 !== '却下' && (
                                <button type="button" onClick={() => openReject(claim)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                                  却下
                                </button>
                              )}
                            </>
                          )}
                          {claim.請求状態 === '承認済み' && onOpenPaymentConsole && (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentConsole(claim.請求ID, claim.会員ID)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              title="支払い履歴コンソールで支払い登録"
                            >
                              支払い登録へ
                            </button>
                          )}
                          <button type="button" onClick={() => handleDelete(claim.請求ID, claim.表示名 ?? claim.会員ID)} disabled={deletingId === claim.請求ID} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-red-600 disabled:opacity-50">
                            {deletingId === claim.請求ID ? '…' : '削除'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 展開詳細 */}
                    {expanded && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50/50 px-6 pb-4 pt-2">
                          <div className="space-y-2 text-xs text-slate-600">
                            <p><span className="font-medium">活動内容:</span> {claim.活動内容}</p>
                            {claim.組織コード && <p><span className="font-medium">組織:</span> {orgMap[claim.組織コード] ?? claim.組織コード}</p>}
                            {claim.請求状態 === '却下' && claim.却下理由 && (
                              <p className="rounded bg-red-50 px-2 py-1 text-red-700"><span className="font-medium">却下理由:</span> {claim.却下理由}</p>
                            )}
                            {(claim.請求状態 === '承認済み' || claim.請求状態 === '支払い済み') && claim.承認者メール && (
                              <p className="text-blue-600"><span className="font-medium">承認:</span> {claim.承認日時?.slice(0, 10)} ／ {claim.承認者メール}</p>
                            )}
                            <div>
                              <p className="font-medium mb-1">添付ファイル ({attachments.length}件):</p>
                              {attachments.length === 0 ? (
                                <p className="text-slate-400">なし</p>
                              ) : (
                                <ul className="space-y-1">
                                  {attachments.map(a => (
                                    <li key={a.fileId}>
                                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline hover:no-underline" title={a.name}>{a.name}</a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClaimManagementConsole;
