import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AdminPermissionLevel, SystemSettings } from '../types';
import { BulkMailRecipient, EmailSendLog } from '../shared/types';
import { ApiClient } from '../services/api';

interface BulkMailSenderProps {
  api: ApiClient;
  settings: SystemSettings;
  adminPermissionLevel?: AdminPermissionLevel | null;
}

type AttachmentBlob = { name: string; mimeType: string; base64: string };

const MERGE_TAGS = ['{{氏名}}', '{{事業所名}}', '{{会員番号}}'];

const MEMBER_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: '個人',
  BUSINESS:   '事業所',
  SUPPORT:    '賛助',
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const btnCls =
  'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const BulkMailSender: React.FC<BulkMailSenderProps> = ({ api, settings, adminPermissionLevel }) => {
  // ── フィルタ状態 ────────────────────────────────────────────
  const [filterTypes, setFilterTypes]           = useState<string[]>(['INDIVIDUAL', 'BUSINESS', 'SUPPORT']);
  const [filterMemberStatus, setFilterMemberStatus] = useState('ACTIVE');
  const [filterStaffStatus, setFilterStaffStatus]   = useState('ENROLLED');
  const [filterMailing, setFilterMailing]       = useState('OPT_IN');
  const [filterNoEmail, setFilterNoEmail]       = useState(true);

  // ── 宛先一覧 ────────────────────────────────────────────────
  const [recipients, setRecipients]             = useState<BulkMailRecipient[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [loadError, setLoadError]               = useState<string | null>(null);
  const [hasLoaded, setHasLoaded]               = useState(false);

  // ── 選択状態（null = 全選択） ────────────────────────────────
  const [selectedIds, setSelectedIds]           = useState<Set<string> | null>(null);
  const [excludedIds, setExcludedIds]           = useState<Set<string>>(new Set());

  // ── メール本文 ───────────────────────────────────────────────
  const [aliases, setAliases]                   = useState<string[]>([]);
  const [from, setFrom]                         = useState('');
  const [subject, setSubject]                   = useState('');
  const [body, setBody]                         = useState('');
  const [commonAttachments, setCommonAttachments] = useState<AttachmentBlob[]>([]);
  const [useAutoAttach, setUseAutoAttach]       = useState(true);
  const [indvAttachments, setIndvAttachments]   = useState<Record<string, AttachmentBlob>>({});

  // ── 確認・送信 ───────────────────────────────────────────────
  const [showConfirm, setShowConfirm]           = useState(false);
  const [sending, setSending]                   = useState(false);
  const [sendResult, setSendResult]             = useState<{
    sent: number; total: number; errors: string[]; autoAttachMissed: string[]; logId: string;
  } | null>(null);
  const [sendError, setSendError]               = useState<string | null>(null);

  // ── 送信ログ ─────────────────────────────────────────────────
  const [logs, setLogs]                         = useState<EmailSendLog[]>([]);
  const [logsLoading, setLogsLoading]           = useState(false);
  const [logsError, setLogsError]               = useState<string | null>(null);

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef    = useRef<HTMLTextAreaElement>(null);

  // ── 有効な宛先リスト ─────────────────────────────────────────
  const effectiveTargets = useMemo<BulkMailRecipient[]>(() => {
    if (selectedIds === null) {
      return recipients.filter(r => !excludedIds.has(r.recipientKey));
    }
    return recipients.filter(r => selectedIds.has(r.recipientKey));
  }, [recipients, selectedIds, excludedIds]);

  const optOutCount = useMemo(
    () => effectiveTargets.filter(r => r.mailingOptOut).length,
    [effectiveTargets]
  );

  // ── エイリアス取得（コンポーネント初期化時） ────────────────
  useEffect(() => {
    api.getAdminEmailAliases().then(a => {
      setAliases(a);
      if (!from && a.length) setFrom(a[0]);
    }).catch(() => {});
  }, []);

  // ── 宛先読み込み ─────────────────────────────────────────────
  const loadRecipients = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setHasLoaded(false);
    setRecipients([]);
    setSelectedIds(null);
    setExcludedIds(new Set());
    setSendResult(null);
    setSendError(null);
    try {
      const data = await api.getMembersForBulkMail({
        memberTypes:    filterTypes,
        memberStatus:   filterMemberStatus,
        staffStatus:    filterStaffStatus,
        mailingFilter:  filterMailing,
        excludeNoEmail: filterNoEmail,
      });
      setRecipients(data);
      setHasLoaded(true);
    } catch (e: any) {
      setLoadError(e.message || '宛先の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [filterTypes, filterMemberStatus, filterStaffStatus, filterMailing, filterNoEmail, api]);

  // ── 選択操作 ──────────────────────────────────────────────────
  const selectAll    = () => { setSelectedIds(null); setExcludedIds(new Set()); };
  const deselectAll  = () => { setSelectedIds(new Set()); setExcludedIds(new Set()); };

  const toggleOne = (key: string) => {
    if (selectedIds === null) {
      setExcludedIds(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev ?? []);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
    }
  };

  const isSelected = (key: string) =>
    selectedIds === null ? !excludedIds.has(key) : selectedIds.has(key);

  // ── タグ挿入 ─────────────────────────────────────────────────
  const insertTag = (tag: string, target: 'subject' | 'body') => {
    if (target === 'subject' && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart ?? subject.length;
      const end   = el.selectionEnd   ?? subject.length;
      const next  = subject.slice(0, start) + tag + subject.slice(end);
      setSubject(next);
      setTimeout(() => { el.focus(); el.setSelectionRange(start + tag.length, start + tag.length); }, 0);
    } else if (target === 'body' && bodyRef.current) {
      const el = bodyRef.current;
      const start = el.selectionStart ?? body.length;
      const end   = el.selectionEnd   ?? body.length;
      const next  = body.slice(0, start) + tag + body.slice(end);
      setBody(next);
      setTimeout(() => { el.focus(); el.setSelectionRange(start + tag.length, start + tag.length); }, 0);
    }
  };

  // ── 共通添付 ─────────────────────────────────────────────────
  const handleCommonAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    const blobs = await Promise.all(files.map(async (f: File) => ({
      name: f.name, mimeType: f.type || 'application/octet-stream',
      base64: await readFileAsBase64(f),
    })));
    setCommonAttachments(prev => [...prev, ...blobs]);
    e.target.value = '';
  };

  // ── 個人追加添付 ─────────────────────────────────────────────
  const handleIndvAttach = async (key: string, file: File) => {
    const base64 = await readFileAsBase64(file);
    setIndvAttachments(prev => ({
      ...prev,
      [key]: { name: file.name, mimeType: file.type || 'application/octet-stream', base64 },
    }));
  };

  // ── 送信 ─────────────────────────────────────────────────────
  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setSendError(null);
    setSendResult(null);
    try {
      const result = await api.sendBulkMemberMail({
        recipientKeys:        effectiveTargets.map(r => r.recipientKey),
        from,
        subject,
        body,
        commonAttachments:    commonAttachments.length ? commonAttachments : undefined,
        individualAttachments: Object.keys(indvAttachments).length ? indvAttachments : undefined,
        useAutoAttach,
        memberTypes:          filterTypes,
        memberStatus:         filterMemberStatus,
        staffStatus:          filterStaffStatus,
        mailingFilter:        'ALL',
        excludeNoEmail:       false,
      });
      setSendResult(result);
    } catch (e: any) {
      setSendError(e.message || '送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  // ── 送信ログ読み込み ─────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await api.getEmailSendLog();
      setLogs(data);
    } catch (e: any) {
      setLogsError(e.message || '送信ログの取得に失敗しました。');
    } finally {
      setLogsLoading(false);
    }
  }, [api]);

  const canViewLog = useMemo(() => {
    const viewerRole = settings.emailLogViewerRole ?? 'MASTER';
    const allowed = viewerRole.split(',').map(s => s.trim());
    return allowed.includes(adminPermissionLevel ?? '');
  }, [settings.emailLogViewerRole, adminPermissionLevel]);

  // ── 種別チェックボックストグル ──────────────────────────────
  const toggleType = (t: string) =>
    setFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const hasFolder = Boolean(settings.bulkMailAutoAttachFolderId);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">一括メール送信コンソール</h2>

      {/* ── フィルタパネル ── */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-700">宛先フィルタ</h3>

        {/* 会員種別 */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">会員種別</p>
          <div className="flex gap-4 flex-wrap">
            {(['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={filterTypes.includes(t)}
                  onChange={() => toggleType(t)}
                />
                {MEMBER_TYPE_LABELS[t]}会員
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 在籍状態（個人・賛助） */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">在籍状態（個人・賛助）</label>
            <select className={inputCls} value={filterMemberStatus} onChange={e => setFilterMemberStatus(e.target.value)}>
              <option value="ACTIVE">在籍中のみ</option>
              <option value="ALL">すべて</option>
            </select>
          </div>

          {/* 在籍状態（事業所職員） */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">在籍状態（事業所職員）</label>
            <select className={inputCls} value={filterStaffStatus} onChange={e => setFilterStaffStatus(e.target.value)}>
              <option value="ENROLLED">在籍中のみ</option>
              <option value="ALL">すべて</option>
            </select>
          </div>

          {/* メール配信希望 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">メール配信希望（事業所職員）</label>
            <select className={inputCls} value={filterMailing} onChange={e => setFilterMailing(e.target.value)}>
              <option value="OPT_IN">希望者のみ（推奨）</option>
              <option value="ALL">全員（オプトアウト含む）</option>
            </select>
          </div>

          {/* メールアドレスなし */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={filterNoEmail}
                onChange={e => setFilterNoEmail(e.target.checked)}
              />
              メールアドレス未登録を除外（推奨）
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={loadRecipients}
          disabled={loading || filterTypes.length === 0}
          className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}
        >
          {loading ? '読み込み中…' : '宛先を読み込む'}
        </button>

        {loadError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{loadError}</p>
        )}
      </section>

      {/* ── 宛先一覧 ── */}
      {hasLoaded && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">
                宛先: {recipients.length}名 / 選択中: {effectiveTargets.length}名
              </span>
              {filterMailing === 'ALL' && optOutCount > 0 && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                  ⚠ オプトアウト {optOutCount}名を含みます
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll}   className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>全選択</button>
              <button type="button" onClick={deselectAll} className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>全解除</button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-4 py-2 text-left"></th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">氏名</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">種別</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">事業所名</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">メールアドレス</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">状態</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">個人添付</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipients.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">対象者がいません。フィルタを変更して再読み込みしてください。</td></tr>
                ) : (
                  recipients.map(r => (
                    <tr
                      key={r.recipientKey}
                      className={`cursor-pointer transition-colors ${isSelected(r.recipientKey) ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                      onClick={() => toggleOne(r.recipientKey)}
                    >
                      <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`${r.displayName}を選択`}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          checked={isSelected(r.recipientKey)}
                          onChange={() => toggleOne(r.recipientKey)}
                        />
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {r.displayName}
                        {r.mailingOptOut && (
                          <span className="ml-1 text-xs text-amber-600">⚠opt-out</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{MEMBER_TYPE_LABELS[r.memberType] ?? r.memberType}</td>
                      <td className="px-4 py-2 text-slate-600">{r.officeName || '—'}</td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-xs">{r.email || <span className="text-red-400">未登録</span>}</td>
                      <td className="px-4 py-2 text-slate-500 text-xs">
                        {r.memberType === 'BUSINESS' ? (r.staffStatus === 'ENROLLED' ? '在籍' : '退職') : (r.memberStatus === 'ACTIVE' ? '在籍' : r.memberStatus === 'WITHDRAWAL_SCHEDULED' ? '退会予定' : '退会')}
                      </td>
                      <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                        <label className="cursor-pointer text-xs text-primary-600 hover:underline">
                          {indvAttachments[r.recipientKey] ? indvAttachments[r.recipientKey].name : '＋追加'}
                          <input
                            type="file"
                            className="sr-only"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleIndvAttach(r.recipientKey, f); e.target.value = ''; }}
                          />
                        </label>
                        {indvAttachments[r.recipientKey] && (
                          <button
                            type="button"
                            onClick={() => setIndvAttachments(prev => { const n = { ...prev }; delete n[r.recipientKey]; return n; })}
                            className="ml-2 text-xs text-red-400 hover:text-red-600"
                          >削除</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── メール作成パネル ── */}
      {hasLoaded && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-700">メール作成</h3>

          {/* 送信元 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">送信元アドレス</label>
            <select className={inputCls} value={from} onChange={e => setFrom(e.target.value)}>
              {aliases.map(a => <option key={a} value={a}>{a}</option>)}
              {aliases.length === 0 && <option value="">（取得中…）</option>}
            </select>
          </div>

          {/* 件名 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-600">件名</label>
              <div className="flex gap-1">
                {MERGE_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => insertTag(tag, 'subject')}
                    className="text-xs px-2 py-0.5 rounded border border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <input
              ref={subjectRef}
              type="text"
              className={inputCls}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="例: 【枚方ケアマネ協議会】{{事業所名}} {{氏名}}様へのご案内"
            />
          </div>

          {/* 本文 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-600">本文</label>
              <div className="flex gap-1">
                {MERGE_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => insertTag(tag, 'body')}
                    className="text-xs px-2 py-0.5 rounded border border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              ref={bodyRef}
              className={`${inputCls} h-48 resize-y font-mono`}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={`{{氏名}} 様\n\nいつもお世話になっております。\n枚方市介護支援専門員連絡協議会です。\n\n【会員番号: {{会員番号}}】\n【事業所: {{事業所名}}】`}
            />
          </div>

          {/* 共通添付 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">共通添付ファイル</label>
            <label className={`inline-flex cursor-pointer items-center gap-1 text-sm text-primary-600 hover:underline`}>
              ＋ファイルを追加
              <input type="file" multiple className="sr-only" onChange={handleCommonAttach} />
            </label>
            {commonAttachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {commonAttachments.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="truncate max-w-xs">{a.name}</span>
                    <button type="button" onClick={() => setCommonAttachments(prev => prev.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-xs">削除</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Drive 自動添付 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <input
              id="use-auto-attach"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              checked={useAutoAttach}
              onChange={e => setUseAutoAttach(e.target.checked)}
            />
            <label htmlFor="use-auto-attach" className="text-sm text-slate-700 cursor-pointer">
              Driveフォルダから個別自動添付を使用
              {hasFolder ? (
                <span className="ml-1 text-xs text-green-600">（フォルダ設定済み）</span>
              ) : (
                <span className="ml-1 text-xs text-amber-600">（フォルダ未設定 — システム設定で登録してください）</span>
              )}
            </label>
          </div>
          {useAutoAttach && hasFolder && (
            <p className="text-xs text-slate-500">
              ファイル名に「姓名（スペースなし）」が含まれるファイルを1件自動添付します。例: <code>山田太郎_申込書.pdf</code>
            </p>
          )}
        </section>
      )}

      {/* ── 送信ボタン ── */}
      {hasLoaded && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={effectiveTargets.length === 0 || !subject.trim() || !body.trim() || sending}
            onClick={() => setShowConfirm(true)}
            className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}
          >
            {sending ? '送信中…' : `${effectiveTargets.length}名に送信する`}
          </button>
          {effectiveTargets.length === 0 && (
            <span className="text-sm text-slate-400">宛先を選択してください</span>
          )}
        </div>
      )}

      {/* ── 確認ダイアログ ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <h4 className="text-lg font-bold text-slate-800">送信確認</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div><span className="font-medium">宛先数:</span> {effectiveTargets.length}名</div>
              <div><span className="font-medium">送信元:</span> {from}</div>
              <div><span className="font-medium">件名:</span> {subject}</div>
              {filterMailing === 'ALL' && optOutCount > 0 && (
                <div className="text-amber-700 bg-amber-50 rounded px-2 py-1">
                  ⚠ オプトアウト {optOutCount}名が含まれます
                </div>
              )}
              {useAutoAttach && !hasFolder && (
                <div className="text-slate-400 text-xs">Drive自動添付: フォルダ未設定のためスキップされます</div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowConfirm(false)}
                className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
                キャンセル
              </button>
              <button type="button" onClick={handleSend}
                className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}>
                送信する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 送信結果 ── */}
      {(sendResult || sendError) && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-base font-semibold text-slate-700">送信結果</h3>
          {sendError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{sendError}</p>
          )}
          {sendResult && (
            <>
              <p className="text-sm">
                <span className="text-green-700 font-semibold">成功: {sendResult.sent}名</span>
                {sendResult.errors.length > 0 && (
                  <span className="ml-3 text-red-600">失敗: {sendResult.errors.length}名</span>
                )}
                <span className="ml-3 text-slate-500">（合計: {sendResult.total}名）</span>
              </p>
              {sendResult.errors.length > 0 && (
                <div className="text-sm text-red-700 bg-red-50 rounded p-3 space-y-1">
                  <p className="font-medium">送信失敗:</p>
                  <ul className="list-disc list-inside">
                    {sendResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              {sendResult.autoAttachMissed.length > 0 && (
                <div className="text-sm text-amber-700 bg-amber-50 rounded p-3 space-y-1">
                  <p className="font-medium">自動添付ファイル未マッチ（送信は完了）:</p>
                  <ul className="list-disc list-inside">
                    {sendResult.autoAttachMissed.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── 送信ログ ── */}
      {canViewLog && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-700">送信ログ</h3>
            <button type="button" onClick={loadLogs} disabled={logsLoading}
              className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
              {logsLoading ? '読み込み中…' : '更新'}
            </button>
          </div>
          {logsError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{logsError}</p>
          )}
          {logs.length === 0 && !logsLoading && !logsError && (
            <p className="text-sm text-slate-400">ログがありません。「更新」ボタンで読み込んでください。</p>
          )}
          {logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">送信日時</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">送信者</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">件名テンプレート</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">宛先</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">成功</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">失敗</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.logId} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{log.sentAt.replace('T', ' ').slice(0, 19)}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs font-mono">{log.senderEmail}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-xs truncate">{log.subjectTemplate}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{log.totalCount}</td>
                      <td className="px-3 py-2 text-right text-green-700 font-medium">{log.successCount}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={log.errorCount > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>{log.errorCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default BulkMailSender;
