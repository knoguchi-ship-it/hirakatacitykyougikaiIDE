/**
 * ClaimCard — 役員の請求提出・履歴表示カード（会員マイページ用）
 *
 * OfficerStatusCard 内から描画される。isOfficer チェックは呼び出し元で完了済み。
 * - 請求一覧（自分の分のみ）: 状態バッジ・詳細展開・取下げ
 * - 請求フォーム: 新規作成 / 申請中の編集
 * - ファイル添付: PDF/JPG/PNG 10MB 以内、複数ファイル対応
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import {
  ClaimAttachment,
  ClaimRecord,
  MemberActiveRole,
  OfficerMasterData,
} from '../shared/types';

interface ClaimCardProps {
  activeRoles: MemberActiveRole[];
}

// ── 定数 ────────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const CLAIM_STATUS_CONFIG: Record<ClaimRecord['請求状態'], { label: string; icon: string; cls: string }> = {
  申請中:    { label: '申請中',    icon: '⏳', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  承認済み:  { label: '承認済み',  icon: '✓',  cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  支払い済み: { label: '支払い済み', icon: '✓✓', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  却下:      { label: '却下',      icon: '✕',  cls: 'bg-red-50 text-red-700 ring-red-200' },
};

const inputCls = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const inputErrCls = 'w-full rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400';
const fi = (e?: string) => e ? inputErrCls : inputCls;

// ── バリデーション ────────────────────────────────────────────────────────────

interface ClaimFormState {
  claimId: string;
  typeCode: string;
  roleCode: string;
  organizationCode: string;
  amount: string;
  activityDate: string;
  activityDescription: string;
}

interface ClaimFormErrors {
  typeCode?: string;
  amount?: string;
  activityDate?: string;
  activityDescription?: string;
}

function validateClaimForm(form: ClaimFormState): ClaimFormErrors {
  const errs: ClaimFormErrors = {};
  if (!form.typeCode) errs.typeCode = '種別は必須です。';
  if (!form.amount || Number(form.amount) <= 0) errs.amount = '1円以上の金額を入力してください。';
  if (!form.activityDate) errs.activityDate = '活動日は必須です。';
  else if (form.activityDate > new Date().toISOString().slice(0, 10)) errs.activityDate = '未来の日付は入力できません。';
  if (!form.activityDescription.trim()) errs.activityDescription = '活動内容は必須です。';
  else if (form.activityDescription.trim().length < 10) errs.activityDescription = '活動内容は10文字以上入力してください（具体的に記述）。';
  else if (form.activityDescription.trim().length > 200) errs.activityDescription = '200文字以内で入力してください。';
  return errs;
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ClaimRecord['請求状態'] }> = ({ status }) => {
  const cfg = CLAIM_STATUS_CONFIG[status] ?? { label: status, icon: '?', cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.cls}`}
      aria-label={`請求状態: ${cfg.label}`}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

// ── AttachmentList ────────────────────────────────────────────────────────────

const AttachmentList: React.FC<{
  attachments: ClaimAttachment[];
  canRemove: boolean;
  removing: string | null;
  onRemove: (fileId: string) => void;
}> = ({ attachments, canRemove, removing, onRemove }) => {
  if (attachments.length === 0) return <p className="text-xs text-slate-400">添付ファイルなし</p>;
  return (
    <ul className="space-y-1.5">
      {attachments.map(a => (
        <li key={a.fileId} className="flex items-center gap-2">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-xs text-primary-600 underline hover:no-underline"
            title={a.name}
          >
            {a.name}
          </a>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(a.fileId)}
              disabled={removing === a.fileId}
              className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              aria-label={`${a.name} を削除`}
            >
              {removing === a.fileId ? '…' : '削除'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

// ── メインコンポーネント ──────────────────────────────────────────────────────

const ClaimCard: React.FC<ClaimCardProps> = ({ activeRoles }) => {
  const [masterData, setMasterData] = useState<OfficerMasterData | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<ClaimFormState>({ claimId: '', typeCode: '', roleCode: activeRoles[0]?.roleCode ?? '', organizationCode: activeRoles[0]?.organizationCode ?? '', amount: '', activityDate: '', activityDescription: '' });
  const [formErrors, setFormErrors] = useState<ClaimFormErrors>({});
  const [formAttachments, setFormAttachments] = useState<ClaimAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [removingFile, setRemovingFile] = useState<string | null>(null);
  const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [m, c] = await Promise.all([
        api.getOfficerMasterData(),
        api.getMyClaims(),
      ]);
      setMasterData(m);
      setClaims(c);
    } catch (e: any) {
      setLoadError(e?.message || '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeTypes = useMemo(
    () => (masterData?.paymentTypes ?? []).filter(t => !t.削除フラグ && t.有効フラグ && (t.対象区分 === '請求' || t.対象区分 === '両方')).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0)),
    [masterData],
  );

  const orgMap = useMemo(() => Object.fromEntries((masterData?.organizations ?? []).map(o => [o.組織コード, o.組織名])), [masterData]);
  const roleMap = useMemo(() => Object.fromEntries((masterData?.roles ?? []).map(r => [r.役職コード, r.役職名])), [masterData]);
  const typeMap = useMemo(() => Object.fromEntries((masterData?.paymentTypes ?? []).map(t => [t.種別コード, t.種別名])), [masterData]);

  const parseAttachments = (jsonStr: string): ClaimAttachment[] => {
    if (!jsonStr) return [];
    try { return JSON.parse(jsonStr); } catch { return []; }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // フォーム開く（新規 or 編集）
  const openForm = (claim?: ClaimRecord) => {
    if (claim) {
      setForm({
        claimId: claim.請求ID,
        typeCode: claim.種別コード,
        roleCode: claim.役職コード,
        organizationCode: claim.組織コード,
        amount: String(claim.請求金額 || ''),
        activityDate: claim.活動日,
        activityDescription: claim.活動内容,
      });
      setFormAttachments(parseAttachments(claim.添付ファイルURL));
    } else {
      setForm({ claimId: '', typeCode: '', roleCode: activeRoles[0]?.roleCode ?? '', organizationCode: activeRoles[0]?.organizationCode ?? '', amount: '', activityDate: '', activityDescription: '' });
      setFormAttachments([]);
    }
    setFormErrors({});
    setServerError(null);
    setFormVisible(true);
  };

  // ファイル選択 → Drive アップロード
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      alert('PDF・JPG・PNG のみアップロードできます。');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      alert('ファイルサイズが 10MB を超えています。');
      return;
    }

    setUploadingFile(true);
    setServerError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
        reader.readAsDataURL(file);
      });

      const attachment = await api.uploadClaimAttachment({
        claimId: form.claimId || undefined,
        base64,
        filename: file.name,
        mimeType: file.type,
      });
      setFormAttachments(prev => [...prev, attachment]);

      // 既存請求の場合は claims リストも更新
      if (form.claimId) {
        setClaims(prev => prev.map(c => {
          if (c.請求ID !== form.claimId) return c;
          const existing = parseAttachments(c.添付ファイルURL);
          return { ...c, 添付ファイルURL: JSON.stringify([...existing, attachment]) };
        }));
      }
    } catch (e: any) {
      setServerError(e?.message || 'アップロードに失敗しました。');
    } finally {
      setUploadingFile(false);
    }
  };

  // フォーム内のファイル削除
  const handleRemoveFormFile = async (fileId: string) => {
    setRemovingFile(fileId);
    setServerError(null);
    try {
      if (form.claimId) {
        await api.removeClaimAttachment({ claimId: form.claimId, fileId });
        setClaims(prev => prev.map(c => {
          if (c.請求ID !== form.claimId) return c;
          const updated = parseAttachments(c.添付ファイルURL).filter(a => a.fileId !== fileId);
          return { ...c, 添付ファイルURL: JSON.stringify(updated) };
        }));
      }
      setFormAttachments(prev => prev.filter(a => a.fileId !== fileId));
    } catch (e: any) {
      setServerError(e?.message || 'ファイルの削除に失敗しました。');
    } finally {
      setRemovingFile(null);
    }
  };

  // 請求保存
  const handleSave = async () => {
    const errs = validateClaimForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setServerError(null);
    try {
      const res = await api.submitClaim({
        claimId: form.claimId || undefined,
        typeCode: form.typeCode,
        roleCode: form.roleCode || undefined,
        organizationCode: form.organizationCode || undefined,
        amount: Number(form.amount),
        activityDate: form.activityDate,
        activityDescription: form.activityDescription.trim(),
        attachmentsJson: formAttachments.length > 0 ? formAttachments : undefined,
      });
      // 成功後リロード
      await load();
      setFormVisible(false);
      setSuccessMsg(form.claimId ? '請求を更新しました。' : '請求を提出しました。');
      setTimeout(() => setSuccessMsg(null), 4000);
      // 新規なら展開して確認しやすくする
      if (!form.claimId) setExpandedIds(prev => new Set([...prev, res.claimId]));
    } catch (e: any) {
      setServerError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  // 取下げ
  const handleDelete = async (claimId: string) => {
    if (!window.confirm('この請求を取り下げますか？取り下げ後は元に戻せません。')) return;
    setDeletingClaimId(claimId);
    try {
      await api.deleteMyClaim({ claimId });
      setClaims(prev => prev.filter(c => c.請求ID !== claimId));
      setSuccessMsg('請求を取り下げました。');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      alert(e?.message || '取り下げに失敗しました。');
    } finally {
      setDeletingClaimId(null);
    }
  };

  if (loading) return <div className="mt-2 text-sm text-slate-400">請求情報を読み込み中…</div>;
  if (loadError) {
    // v331: 生エラーコードを利用者向けの平易なメッセージに置換し、状態を区別しやすくする。
    const raw = loadError;
    let friendly = raw;
    if (/member_unauthorized/i.test(raw) || /member_session_expired/i.test(raw)) {
      friendly = 'ログインセッションが切れています。一度ログアウト後、再度ログインしてください。';
    } else if (/unsupported_action/i.test(raw)) {
      friendly = '請求情報の読み込みに失敗しました。お手数ですがページを再読み込みしてください。';
    }
    return (
      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <p className="font-semibold mb-1">請求情報を読み込めませんでした</p>
        <p>{friendly}</p>
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">請求履歴</h3>
        {!formVisible && (
          <button type="button" onClick={() => openForm()} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">
            ＋ 新しい請求を申請
          </button>
        )}
      </div>

      {/* 成功メッセージ */}
      {successMsg && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          <span aria-hidden="true">✓</span>{successMsg}
        </div>
      )}

      {/* 請求フォーム */}
      {formVisible && (
        <div className="mb-4 rounded-xl border border-primary-200 bg-primary-50/40 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">{form.claimId ? '請求を編集' : '新しい請求を申請'}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* 種別 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">種別 <span className="text-red-500">*</span></label>
              <select value={form.typeCode} onChange={e => setForm(f => ({ ...f, typeCode: e.target.value }))} className={fi(formErrors.typeCode)}>
                <option value="">-- 選択してください --</option>
                {activeTypes.map(t => <option key={t.種別コード} value={t.種別コード}>{t.種別名}</option>)}
              </select>
              {formErrors.typeCode && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.typeCode}</p>}
            </div>

            {/* 役職 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">役職</label>
              <select value={form.roleCode} onChange={e => {
                const role = masterData?.roles.find(r => r.役職コード === e.target.value);
                setForm(f => ({ ...f, roleCode: e.target.value, organizationCode: role?.組織コード ?? f.organizationCode }));
              }} className={inputCls}>
                <option value="">（未指定）</option>
                {activeRoles.map(r => <option key={r.officerId} value={r.roleCode}>{r.roleName}（{r.organizationName}）</option>)}
              </select>
            </div>

            {/* 金額 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">請求金額（円）<span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^\d]/g, '') }))}
                placeholder="例: 3000"
                className={fi(formErrors.amount)}
              />
              {formErrors.amount && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.amount}</p>}
            </div>

            {/* 活動日 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">活動日 <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.activityDate}
                onChange={e => setForm(f => ({ ...f, activityDate: e.target.value }))}
                max={todayStr}
                className={fi(formErrors.activityDate)}
              />
              {formErrors.activityDate && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.activityDate}</p>}
            </div>

            {/* 活動内容 */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                活動内容 <span className="text-red-500">*</span>
                <span className="ml-1 text-slate-400 font-normal">（10〜200文字・具体的に記述）</span>
              </label>
              <textarea
                value={form.activityDescription}
                onChange={e => setForm(f => ({ ...f, activityDescription: e.target.value }))}
                rows={3}
                maxLength={200}
                placeholder="例: 圏域委員会に出席し、地域ケア会議の運営について協議した。"
                className={`${fi(formErrors.activityDescription)} resize-none`}
              />
              <p className="mt-0.5 text-right text-[11px] text-slate-400">{form.activityDescription.length}/200</p>
              {formErrors.activityDescription && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.activityDescription}</p>}
            </div>

            {/* 添付ファイル */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">添付ファイル（PDF・JPG・PNG／10MB 以内）</label>
              <AttachmentList
                attachments={formAttachments}
                canRemove
                removing={removingFile}
                onRemove={handleRemoveFormFile}
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {uploadingFile ? 'アップロード中…' : '＋ ファイルを追加'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS}
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="添付ファイルを選択"
                />
              </div>
            </div>
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{serverError}</div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving || uploadingFile} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? '提出中…' : (form.claimId ? '更新する' : '請求を提出する')}
            </button>
            <button type="button" onClick={() => { setFormVisible(false); setFormErrors({}); setServerError(null); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 請求一覧 */}
      {claims.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">請求はまだありません。</p>
      ) : (
        <div className="space-y-2">
          {claims.map(claim => {
            const expanded = expandedIds.has(claim.請求ID);
            const attachments = parseAttachments(claim.添付ファイルURL);
            const canEdit = claim.請求状態 === '申請中';
            return (
              <div key={claim.請求ID} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                {/* 行ヘッダー */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setExpandedIds(prev => { const n = new Set(prev); n.has(claim.請求ID) ? n.delete(claim.請求ID) : n.add(claim.請求ID); return n; })}
                    aria-label={expanded ? '詳細を閉じる' : '詳細を開く'}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={claim.請求状態} />
                      <span className="text-sm font-semibold text-slate-800">
                        {typeMap[claim.種別コード] ?? claim.種別コード}
                        {' '}¥{Number(claim.請求金額 || 0).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      活動日: {claim.活動日} ／ 申請日: {claim.作成日時?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {canEdit && (
                      <>
                        <button type="button" onClick={() => openForm(claim)} className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100">編集</button>
                        <button type="button" onClick={() => handleDelete(claim.請求ID)} disabled={deletingClaimId === claim.請求ID} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                          {deletingClaimId === claim.請求ID ? '…' : '取下げ'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 展開詳細 */}
                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-2 text-xs">
                    <p><span className="font-medium text-slate-600">役職: </span><span className="text-slate-700">{roleMap[claim.役職コード] ?? '—'}</span></p>
                    <p><span className="font-medium text-slate-600">活動内容: </span><span className="text-slate-700">{claim.活動内容}</span></p>
                    {claim.請求状態 === '却下' && claim.却下理由 && (
                      <p className="rounded bg-red-50 px-2 py-1 text-red-700"><span className="font-medium">却下理由: </span>{claim.却下理由}</p>
                    )}
                    {claim.請求状態 === '承認済み' && (
                      <p className="text-blue-600">承認日: {claim.承認日時?.slice(0, 10)} ／ 担当: {claim.承認者メール}</p>
                    )}
                    <div>
                      <p className="mb-1 font-medium text-slate-600">添付ファイル:</p>
                      {canEdit ? (
                        <>
                          <AttachmentList attachments={attachments} canRemove removing={removingFile} onRemove={async fid => {
                            setRemovingFile(fid);
                            try {
                              await api.removeClaimAttachment({ claimId: claim.請求ID, fileId: fid });
                              setClaims(prev => prev.map(c => c.請求ID !== claim.請求ID ? c : { ...c, 添付ファイルURL: JSON.stringify(parseAttachments(c.添付ファイルURL).filter(a => a.fileId !== fid)) }));
                            } catch (e: any) { alert(e?.message || 'ファイルの削除に失敗しました。'); }
                            finally { setRemovingFile(null); }
                          }} />
                          <div className="mt-1.5 flex items-center gap-2">
                            <button type="button" onClick={() => { openForm(claim); setTimeout(() => fileInputRef.current?.click(), 100); }} className="text-primary-600 underline hover:no-underline">
                              ＋ ファイルを追加
                            </button>
                          </div>
                        </>
                      ) : (
                        <AttachmentList attachments={attachments} canRemove={false} removing={null} onRemove={() => {}} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClaimCard;
