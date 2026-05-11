/**
 * ClaimCard — 役員の活動報告・経費請求提出と履歴表示（会員マイページ用）
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import heic2any from 'heic2any';
import { api } from '../services/api';
import {
  ClaimAttachment,
  ClaimRecord,
  MemberActiveRole,
  OfficerMasterData,
  Organization,
  WorkCategory,
} from '../shared/types';

interface ClaimCardProps {
  activeRoles: MemberActiveRole[];
}

type ClaimType = 'ACTIVITY_REPORT' | 'EXPENSE_CLAIM';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.heic,.heif';
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

interface ClaimFormState {
  claimId: string;
  claimType: ClaimType;
  roleCode: string;
  organizationCode: string;
  workCategoryCode: string;
  amount: string;
  activityDate: string;
  description: string;
}

interface ClaimFormErrors {
  organizationCode?: string;
  workCategoryCode?: string;
  amount?: string;
  activityDate?: string;
  description?: string;
  attachments?: string;
}

function parseAttachments(jsonStr: string): ClaimAttachment[] {
  if (!jsonStr) return [];
  try { return JSON.parse(jsonStr); } catch { return []; }
}

function getClaimType(claim: ClaimRecord): ClaimType {
  return claim.請求種別 === 'ACTIVITY_REPORT' ? 'ACTIVITY_REPORT' : 'EXPENSE_CLAIM';
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsDataURL(file);
  });
}

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === 'image/heic' || file.type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
}

async function normalizeAttachmentFile(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const jpgName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([blob], jpgName.endsWith('.jpg') ? jpgName : `${file.name}.jpg`, { type: 'image/jpeg' });
}

const StatusBadge: React.FC<{ status: ClaimRecord['請求状態'] }> = ({ status }) => {
  const cfg = CLAIM_STATUS_CONFIG[status] ?? { label: status, icon: '?', cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.cls}`} aria-label={`状態: ${cfg.label}`}>
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

const ClaimTypeBadge: React.FC<{ type: ClaimType }> = ({ type }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${type === 'ACTIVITY_REPORT' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-teal-50 text-teal-700 ring-teal-200'}`}>
    {type === 'ACTIVITY_REPORT' ? '活動報告' : '経費請求'}
  </span>
);

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
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-xs text-primary-600 underline hover:no-underline" title={a.name}>
            {a.name}
          </a>
          {canRemove && (
            <button type="button" onClick={() => onRemove(a.fileId)} disabled={removing === a.fileId} className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50" aria-label={`${a.name} を削除`}>
              {removing === a.fileId ? '…' : '削除'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

const ClaimCard: React.FC<ClaimCardProps> = ({ activeRoles }) => {
  const [masterData, setMasterData] = useState<OfficerMasterData | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<ClaimFormState>({
    claimId: '',
    claimType: 'ACTIVITY_REPORT',
    roleCode: activeRoles[0]?.roleCode ?? '',
    organizationCode: activeRoles[0]?.organizationCode ?? '',
    workCategoryCode: '',
    amount: '',
    activityDate: '',
    description: '',
  });
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
      const [m, c] = await Promise.all([api.getOfficerMasterData(), api.getMyClaims()]);
      setMasterData(m);
      setClaims(c);
    } catch (e: any) {
      setLoadError(e?.message || '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const orgMap = useMemo(() => Object.fromEntries((masterData?.organizations ?? []).map(o => [o.組織コード, o.組織名])), [masterData]);
  const roleMap = useMemo(() => Object.fromEntries((masterData?.roles ?? []).map(r => [r.役職コード, r.役職名])), [masterData]);
  const categoryMap = useMemo(() => Object.fromEntries((masterData?.workCategories ?? []).map(c => [c.業務分類コード, c])), [masterData]);

  const selectableOrganizations = useMemo(() => {
    const activeOrgCodes = new Set(activeRoles.map(r => r.organizationCode));
    return (masterData?.organizations ?? [])
      .filter((o): o is Organization => !o.削除フラグ && !!o.有効フラグ && (activeOrgCodes.has(o.組織コード) || !!o.全役員表示フラグ))
      .sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));
  }, [activeRoles, masterData]);

  const activeWorkCategories = useMemo(() => {
    return (masterData?.workCategories ?? [])
      .filter((c): c is WorkCategory => !c.削除フラグ && !!c.有効フラグ && c.組織コード === form.organizationCode)
      .sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));
  }, [form.organizationCode, masterData]);

  const selectedCategory = form.workCategoryCode ? categoryMap[form.workCategoryCode] : undefined;
  const todayStr = new Date().toISOString().slice(0, 10);

  const validateClaimForm = (state: ClaimFormState): ClaimFormErrors => {
    const errs: ClaimFormErrors = {};
    if (!state.organizationCode) errs.organizationCode = '活動部は必須です。';
    if (!state.activityDate) errs.activityDate = '活動日は必須です。';
    else if (state.activityDate > todayStr) errs.activityDate = '未来の日付は入力できません。';
    if (state.claimType === 'ACTIVITY_REPORT') {
      if (!state.workCategoryCode) errs.workCategoryCode = '業務分類は必須です。';
    } else {
      if (!state.amount || Number(state.amount) <= 0) errs.amount = '1円以上の金額を入力してください。';
      if (!state.description.trim()) errs.description = '請求内容は必須です。';
      else if (state.description.trim().length > 200) errs.description = '200文字以内で入力してください。';
      if (formAttachments.length === 0) errs.attachments = '経費請求には領収書等の添付ファイルが必要です。';
    }
    return errs;
  };

  const openForm = (claimType: ClaimType, claim?: ClaimRecord) => {
    if (claim) {
      const existingType = getClaimType(claim);
      setForm({
        claimId: claim.請求ID,
        claimType: existingType,
        roleCode: claim.役職コード || activeRoles[0]?.roleCode || '',
        organizationCode: claim.組織コード || activeRoles[0]?.organizationCode || selectableOrganizations[0]?.組織コード || '',
        workCategoryCode: claim.業務分類コード || '',
        amount: String(claim.請求金額 || ''),
        activityDate: claim.活動日,
        description: claim.活動内容,
      });
      setFormAttachments(parseAttachments(claim.添付ファイルURL));
    } else {
      const orgCode = activeRoles[0]?.organizationCode || selectableOrganizations[0]?.組織コード || '';
      setForm({
        claimId: '',
        claimType,
        roleCode: activeRoles[0]?.roleCode ?? '',
        organizationCode: orgCode,
        workCategoryCode: '',
        amount: '',
        activityDate: '',
        description: '',
      });
      setFormAttachments([]);
    }
    setFormErrors({});
    setServerError(null);
    setFormVisible(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    e.target.value = '';
    if (!originalFile) return;

    setUploadingFile(true);
    setServerError(null);
    try {
      const file = await normalizeAttachmentFile(originalFile);
      if (!ALLOWED_MIME_TYPES.includes(file.type)) throw new Error('PDF・JPG・PNG・HEIC のみアップロードできます。');
      if (file.size > MAX_FILE_BYTES) throw new Error('ファイルサイズが 10MB を超えています。');
      const base64 = await fileToBase64(file);
      const attachment = await api.uploadClaimAttachment({
        claimId: form.claimId || undefined,
        base64,
        filename: file.name,
        mimeType: file.type,
      });
      setFormAttachments(prev => [...prev, attachment]);
      setFormErrors(prev => ({ ...prev, attachments: undefined }));
      if (form.claimId) {
        setClaims(prev => prev.map(c => {
          if (c.請求ID !== form.claimId) return c;
          return { ...c, 添付ファイルURL: JSON.stringify([...parseAttachments(c.添付ファイルURL), attachment]) };
        }));
      }
    } catch (err: any) {
      setServerError(err?.message || 'アップロードに失敗しました。');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFormFile = async (fileId: string) => {
    setRemovingFile(fileId);
    setServerError(null);
    try {
      if (form.claimId) {
        await api.removeClaimAttachment({ claimId: form.claimId, fileId });
        setClaims(prev => prev.map(c => {
          if (c.請求ID !== form.claimId) return c;
          return { ...c, 添付ファイルURL: JSON.stringify(parseAttachments(c.添付ファイルURL).filter(a => a.fileId !== fileId)) };
        }));
      }
      setFormAttachments(prev => prev.filter(a => a.fileId !== fileId));
    } catch (e: any) {
      setServerError(e?.message || 'ファイルの削除に失敗しました。');
    } finally {
      setRemovingFile(null);
    }
  };

  const handleSave = async () => {
    const errs = validateClaimForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const activityAmount = selectedCategory ? Number(selectedCategory.単価 || 0) : 0;
    setSaving(true);
    setServerError(null);
    try {
      const res = await api.submitClaim({
        claimId: form.claimId || undefined,
        claimType: form.claimType,
        roleCode: form.roleCode || undefined,
        organizationCode: form.organizationCode,
        workCategoryCode: form.claimType === 'ACTIVITY_REPORT' ? form.workCategoryCode : undefined,
        amount: form.claimType === 'ACTIVITY_REPORT' ? activityAmount : Number(form.amount),
        activityDate: form.activityDate,
        activityDescription: form.claimType === 'ACTIVITY_REPORT'
          ? (selectedCategory?.業務分類名 ?? '')
          : form.description.trim(),
        attachmentsJson: formAttachments.length > 0 ? formAttachments : undefined,
      });
      await load();
      setFormVisible(false);
      setSuccessMsg(form.claimType === 'ACTIVITY_REPORT' ? '活動報告を提出しました。' : '経費請求を申請しました。');
      setTimeout(() => setSuccessMsg(null), 4000);
      if (!form.claimId) setExpandedIds(prev => new Set([...prev, res.claimId]));
    } catch (e: any) {
      setServerError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (claimId: string) => {
    if (!window.confirm('この申請を取り下げますか？取り下げ後は元に戻せません。')) return;
    setDeletingClaimId(claimId);
    try {
      await api.deleteMyClaim({ claimId });
      setClaims(prev => prev.filter(c => c.請求ID !== claimId));
      setSuccessMsg('申請を取り下げました。');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      alert(e?.message || '取り下げに失敗しました。');
    } finally {
      setDeletingClaimId(null);
    }
  };

  if (loading) return <div className="mt-2 text-sm text-slate-400">請求情報を読み込み中…</div>;
  if (loadError) {
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
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-700">活動報告・経費請求</h3>
        {!formVisible && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => openForm('ACTIVITY_REPORT')} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
              ＋ 活動報告を提出
            </button>
            <button type="button" onClick={() => openForm('EXPENSE_CLAIM')} className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700">
              ＋ 経費請求を申請
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          <span aria-hidden="true">✓</span>{successMsg}
        </div>
      )}

      {formVisible && (
        <div className="mb-4 rounded-xl border border-primary-200 bg-primary-50/40 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">{form.claimType === 'ACTIVITY_REPORT' ? '活動報告' : '経費請求'}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">活動日 <span className="text-red-500">*</span></label>
              <input type="date" value={form.activityDate} onChange={e => setForm(f => ({ ...f, activityDate: e.target.value }))} max={todayStr} className={fi(formErrors.activityDate)} />
              {formErrors.activityDate && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.activityDate}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">活動部 <span className="text-red-500">*</span></label>
              <select
                value={form.organizationCode}
                onChange={e => setForm(f => ({ ...f, organizationCode: e.target.value, workCategoryCode: '' }))}
                className={fi(formErrors.organizationCode)}
              >
                <option value="">-- 選択してください --</option>
                {selectableOrganizations.map(o => <option key={o.組織コード} value={o.組織コード}>{o.組織名}</option>)}
              </select>
              {formErrors.organizationCode && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.organizationCode}</p>}
            </div>

            {form.claimType === 'ACTIVITY_REPORT' ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">業務分類 <span className="text-red-500">*</span></label>
                  <select value={form.workCategoryCode} onChange={e => setForm(f => ({ ...f, workCategoryCode: e.target.value }))} className={fi(formErrors.workCategoryCode)}>
                    <option value="">-- 選択してください --</option>
                    {activeWorkCategories.map(c => <option key={c.業務分類コード} value={c.業務分類コード}>{c.業務分類名}</option>)}
                  </select>
                  {formErrors.workCategoryCode && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.workCategoryCode}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">単価</label>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                    ¥{Number(selectedCategory?.単価 || 0).toLocaleString('ja-JP')}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">数量は1件固定です。</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">請求金額（円）<span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^\d]/g, '') }))} placeholder="例: 3000" className={fi(formErrors.amount)} />
                  {formErrors.amount && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.amount}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">請求内容 <span className="text-red-500">*</span></label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} maxLength={200} placeholder="例: 会議資料印刷代、交通費など" className={`${fi(formErrors.description)} resize-none`} />
                  <p className="mt-0.5 text-right text-[11px] text-slate-400">{form.description.length}/200</p>
                  {formErrors.description && <p className="mt-0.5 text-xs text-red-600" role="alert">{formErrors.description}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">添付ファイル（領収書等）<span className="text-red-500">*</span></label>
                  <AttachmentList attachments={formAttachments} canRemove removing={removingFile} onRemove={handleRemoveFormFile} />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                      {uploadingFile ? 'アップロード中…' : '＋ ファイルを追加'}
                    </button>
                    <span className="text-xs text-slate-500">PDF / JPG / PNG / HEIC、10MB以内</span>
                    <input ref={fileInputRef} type="file" accept={ALLOWED_EXTENSIONS} onChange={handleFileSelect} className="hidden" aria-label="添付ファイルを選択" />
                  </div>
                  {formErrors.attachments && <p className="mt-1 text-xs text-red-600" role="alert">{formErrors.attachments}</p>}
                </div>
              </>
            )}
          </div>

          {serverError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{serverError}</div>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleSave} disabled={saving || uploadingFile} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? '提出中…' : (form.claimType === 'ACTIVITY_REPORT' ? '活動報告を提出' : '経費請求を申請')}
            </button>
            <button type="button" onClick={() => { setFormVisible(false); setFormErrors({}); setServerError(null); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {claims.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">活動報告・経費請求はまだありません。</p>
      ) : (
        <div className="space-y-2">
          {claims.map(claim => {
            const expanded = expandedIds.has(claim.請求ID);
            const attachments = parseAttachments(claim.添付ファイルURL);
            const claimType = getClaimType(claim);
            const canEdit = claim.請求状態 === '申請中';
            const category = claim.業務分類コード ? categoryMap[claim.業務分類コード] : undefined;
            return (
              <div key={claim.請求ID} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => setExpandedIds(prev => { const n = new Set(prev); n.has(claim.請求ID) ? n.delete(claim.請求ID) : n.add(claim.請求ID); return n; })} aria-label={expanded ? '詳細を閉じる' : '詳細を開く'} className="text-slate-400 hover:text-slate-600">
                    <svg viewBox="0 0 12 12" fill="currentColor" className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClaimTypeBadge type={claimType} />
                      <StatusBadge status={claim.請求状態} />
                      <span className="text-sm font-semibold text-slate-800">¥{Number(claim.請求金額 || 0).toLocaleString('ja-JP')}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {claimType === 'ACTIVITY_REPORT' ? (category?.業務分類名 ?? claim.活動内容) : claim.活動内容}
                      {' ／ '}活動日: {claim.活動日}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {canEdit && (
                      <>
                        <button type="button" onClick={() => openForm(claimType, claim)} className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100">編集</button>
                        <button type="button" onClick={() => handleDelete(claim.請求ID)} disabled={deletingClaimId === claim.請求ID} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                          {deletingClaimId === claim.請求ID ? '…' : '取下げ'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs">
                    <p><span className="font-medium text-slate-600">活動部: </span><span className="text-slate-700">{orgMap[claim.組織コード] ?? claim.組織コード}</span></p>
                    {claimType === 'ACTIVITY_REPORT' ? (
                      <>
                        <p><span className="font-medium text-slate-600">業務分類: </span><span className="text-slate-700">{category?.業務分類名 ?? claim.業務分類コード}</span></p>
                        <p><span className="font-medium text-slate-600">単価/数量: </span><span className="text-slate-700">¥{Number(claim.単価 || claim.請求金額 || 0).toLocaleString('ja-JP')} × 1</span></p>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium text-slate-600">請求内容: </span><span className="text-slate-700">{claim.活動内容}</span></p>
                        <div>
                          <p className="mb-1 font-medium text-slate-600">添付ファイル:</p>
                          <AttachmentList attachments={attachments} canRemove={canEdit} removing={removingFile} onRemove={async fid => {
                            setRemovingFile(fid);
                            try {
                              await api.removeClaimAttachment({ claimId: claim.請求ID, fileId: fid });
                              setClaims(prev => prev.map(c => c.請求ID !== claim.請求ID ? c : { ...c, 添付ファイルURL: JSON.stringify(parseAttachments(c.添付ファイルURL).filter(a => a.fileId !== fid)) }));
                            } catch (e: any) { alert(e?.message || 'ファイルの削除に失敗しました。'); }
                            finally { setRemovingFile(null); }
                          }} />
                        </div>
                      </>
                    )}
                    {claim.請求状態 === '却下' && claim.却下理由 && <p className="rounded bg-red-50 px-2 py-1 text-red-700"><span className="font-medium">却下理由: </span>{claim.却下理由}</p>}
                    {(claim.請求状態 === '承認済み' || claim.請求状態 === '支払い済み') && <p className="text-blue-600">承認日: {claim.承認日時?.slice(0, 10)} ／ 担当: {claim.承認者メール}</p>}
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
