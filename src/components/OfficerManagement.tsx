import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../services/api';
import {
  BankAccount,
  OfficerManagementData,
  OfficerMasterData,
  OfficerRecord,
  SaveBankAccountPayload,
} from '../shared/types';
import { Member, MemberType } from '../types';
import { matchesSearchQuery } from '../utils/search';

interface OfficerManagementProps {
  api: ApiClient;
  members: Member[];
}

type Tab = 'officers' | 'bankAccounts';

// ── スタイル定数 ───────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50';

const inputErrCls =
  'w-full rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400';

const fieldInput = (hasErr: boolean) => (hasErr ? inputErrCls : inputCls);

const btnPrimary =
  'rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50';

const btnSecondary =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

const btnDanger =
  'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50';

const btnAction =
  'rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100';

// ── バリデーションユーティリティ ──────────────────────────────────────────

function validateDate(value: string): boolean {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

function validateKana(value: string): boolean {
  // 全角カタカナ・長音符・全/半角スペースのみ許容
  return /^[ァ-ヶー\s　]+$/.test(value);
}

// ── メインコンポーネント ───────────────────────────────────────────────────

const OfficerManagement: React.FC<OfficerManagementProps> = ({ api, members }) => {
  const [tab, setTab] = useState<Tab>('officers');
  const [masterData, setMasterData] = useState<OfficerMasterData | null>(null);
  const [officerData, setOfficerData] = useState<OfficerManagementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [m, o] = await Promise.all([
        api.getOfficerMasterData(),
        api.getOfficerManagementData(),
      ]);
      setMasterData(m);
      setOfficerData(o);
    } catch (e: any) {
      setLoadError(e?.message || 'データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-center text-sm text-slate-500">読み込み中…</div>;
  }
  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
          <button onClick={() => void load()} className="ml-3 underline hover:no-underline">再読み込み</button>
        </div>
      </div>
    );
  }
  if (!masterData || !officerData) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">役員管理コンソール</h2>
        <p className="mt-1 text-sm text-slate-500">役員の割当て・退任処理と振込口座の管理を行います。</p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {([['officers', '役員一覧・割当て'], ['bankAccounts', '振込口座管理']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'officers' && (
        <OfficerListTab
          masterData={masterData}
          officerData={officerData}
          members={members}
          api={api}
          onRefresh={load}
        />
      )}
      {tab === 'bankAccounts' && (
        <BankAccountTab
          officerData={officerData}
          api={api}
        />
      )}
    </div>
  );
};

// ── 役員一覧・割当てタブ ───────────────────────────────────────────────────

interface AssignFormState {
  memberId: string;   // 個人・賛助会員の場合
  staffId: string;    // 事業所職員の場合（XOR）
  memberSearch: string;
  roleCode: string;
  appointedDate: string;
  note: string;
}

const ASSIGN_INITIAL: AssignFormState = {
  memberId: '', staffId: '', memberSearch: '', roleCode: '', appointedDate: '', note: '',
};

/** 割当て対象人物（個人会員・事業所職員を統合した検索用） */
interface SearchablePerson {
  key: string;         // unique key for React
  memberId: string;
  staffId: string;
  label: string;       // 検索ドロップダウン表示用
  displayName: string;
  officeName: string;
}

const OfficerListTab: React.FC<{
  masterData: OfficerMasterData;
  officerData: OfficerManagementData;
  members: Member[];
  api: ApiClient;
  onRefresh: () => Promise<void>;
}> = ({ masterData, officerData, members, api, onRefresh }) => {
  // フィルター
  const [filterOrg, setFilterOrg] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showResigned, setShowResigned] = useState(false);

  // 割当てフォーム
  const [assignVisible, setAssignVisible] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignFormState>(ASSIGN_INITIAL);
  const [assignErrors, setAssignErrors] = useState<Partial<AssignFormState>>({});
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignServerError, setAssignServerError] = useState<string | null>(null);

  // 退任フォーム
  const [resignTarget, setResignTarget] = useState<OfficerRecord | null>(null);
  const [resignDate, setResignDate] = useState('');
  const [resignDateError, setResignDateError] = useState('');
  const [resignSaving, setResignSaving] = useState(false);

  const orgMap = useMemo(
    () => Object.fromEntries(masterData.organizations.map(o => [o.組織コード, o.組織名])),
    [masterData],
  );
  const roleMap = useMemo(
    () => Object.fromEntries(masterData.roles.map(r => [r.役職コード, r.役職名])),
    [masterData],
  );

  const activeRoles = masterData.roles.filter(r => !r.削除フラグ && r.有効フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));
  const activeOrgs = masterData.organizations.filter(o => !o.削除フラグ && o.有効フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));

  // 割当て候補（個人・賛助会員 + 全事業所職員）を統合した検索リスト
  const allSearchablePersons = useMemo((): SearchablePerson[] => {
    const result: SearchablePerson[] = [];
    for (const m of members) {
      if (m.status !== 'ACTIVE' && m.status !== 'WITHDRAWAL_SCHEDULED') continue;
      if (m.type !== MemberType.BUSINESS) {
        // 個人・賛助会員
        const fullName = `${m.lastName} ${m.firstName}`;
        result.push({
          key: `member-${m.id}`,
          memberId: m.id,
          staffId: '',
          displayName: fullName,
          officeName: m.officeName,
          label: `${fullName}（${m.id}）${m.officeName ? ' ' + m.officeName : ''}`,
        });
      } else {
        // 事業所の全在籍職員
        for (const s of m.staff ?? []) {
          if (s.status !== 'ENROLLED') continue;
          const name = s.name || `${(s as any).lastName ?? ''} ${(s as any).firstName ?? ''}`.trim() || s.id;
          result.push({
            key: `staff-${s.id}`,
            memberId: '',
            staffId: s.id,
            displayName: name,
            officeName: m.officeName,
            label: `${name}（${m.officeName}）`,
          });
        }
      }
    }
    return result;
  }, [members]);

  const filteredPersons = useMemo(() => {
    if (!assignForm.memberSearch.trim()) return allSearchablePersons.slice(0, 80);
    return allSearchablePersons
      .filter(p => matchesSearchQuery(assignForm.memberSearch, [p.label, p.memberId, p.staffId]))
      .slice(0, 80);
  }, [allSearchablePersons, assignForm.memberSearch]);

  // 役員リストフィルタリング
  const filteredOfficers = useMemo(() => {
    return officerData.officers
      .filter(o => showResigned || !o.退任日)
      .filter(o => !filterOrg || o.組織コード === filterOrg)
      .filter(o => !filterRole || o.役職コード === filterRole)
      .sort((a, b) => {
        if (!a.退任日 && b.退任日) return -1;
        if (a.退任日 && !b.退任日) return 1;
        return (a.就任日 || '').localeCompare(b.就任日 || '');
      });
  }, [officerData.officers, filterOrg, filterRole, showResigned]);

  // 紐づけ変更フォーム
  const [linkageTarget, setLinkageTarget] = useState<OfficerRecord | null>(null);
  const [linkageSearch, setLinkageSearch] = useState('');
  const [linkageSelected, setLinkageSelected] = useState<SearchablePerson | null>(null);
  const [linkageSaving, setLinkageSaving] = useState(false);
  const [linkageError, setLinkageError] = useState<string | null>(null);

  const filteredLinkagePersons = useMemo(() => {
    if (!linkageSearch.trim()) return allSearchablePersons.slice(0, 80);
    return allSearchablePersons
      .filter(p => matchesSearchQuery(linkageSearch, [p.label, p.memberId, p.staffId]))
      .slice(0, 80);
  }, [allSearchablePersons, linkageSearch]);

  const handleLinkageUpdate = async () => {
    if (!linkageTarget || !linkageSelected) { setLinkageError('新しい担当者を選択してください。'); return; }
    setLinkageSaving(true);
    setLinkageError(null);
    try {
      await api.updateOfficerLinkage({
        officerId: linkageTarget.役員ID,
        newMemberId: linkageSelected.memberId || undefined,
        newStaffId: linkageSelected.staffId || undefined,
      });
      await onRefresh();
      setLinkageTarget(null);
      setLinkageSearch('');
      setLinkageSelected(null);
    } catch (e: any) {
      setLinkageError(e?.message || '紐づけ変更に失敗しました。');
    } finally {
      setLinkageSaving(false);
    }
  };

  // 割当てフォームバリデーション
  const validateAssign = (): boolean => {
    const errs: Partial<AssignFormState> = {};
    if (!assignForm.memberId && !assignForm.staffId) errs.memberId = '会員または職員を選択してください。';
    if (!assignForm.roleCode) errs.roleCode = '役職を選択してください。';
    if (assignForm.appointedDate && !validateDate(assignForm.appointedDate)) {
      errs.appointedDate = '正しい日付形式（YYYY-MM-DD）で入力してください。';
    }
    setAssignErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAssign = async () => {
    if (!validateAssign()) return;
    setAssignSaving(true);
    setAssignServerError(null);
    try {
      await api.assignOfficer({
        memberId: assignForm.memberId || undefined,
        staffId: assignForm.staffId || undefined,
        roleCode: assignForm.roleCode,
        appointedDate: assignForm.appointedDate || undefined,
        note: assignForm.note || undefined,
      });
      await onRefresh();
      setAssignVisible(false);
      setAssignForm(ASSIGN_INITIAL);
      setAssignErrors({});
    } catch (e: any) {
      setAssignServerError(e?.message || '割当てに失敗しました。');
    } finally {
      setAssignSaving(false);
    }
  };

  // 退任バリデーション
  const validateResign = (): boolean => {
    if (!resignDate) { setResignDateError('退任日は必須です。'); return false; }
    if (!validateDate(resignDate)) { setResignDateError('正しい日付形式（YYYY-MM-DD）で入力してください。'); return false; }
    if (resignTarget?.就任日 && resignDate < resignTarget.就任日) {
      setResignDateError('退任日は就任日より後の日付を指定してください。');
      return false;
    }
    setResignDateError('');
    return true;
  };

  const handleResign = async () => {
    if (!resignTarget || !validateResign()) return;
    setResignSaving(true);
    try {
      await api.resignOfficer({ officerId: resignTarget.役員ID, resignationDate: resignDate });
      await onRefresh();
      setResignTarget(null);
      setResignDate('');
    } catch (e: any) {
      alert(e?.message || '退任処理に失敗しました。');
    } finally {
      setResignSaving(false);
    }
  };

  const openResign = (officer: OfficerRecord) => {
    setResignTarget(officer);
    setResignDate(new Date().toISOString().slice(0, 10));
    setResignDateError('');
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* フィルター + 割当てボタン */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">すべての組織</option>
            {activeOrgs.map(o => <option key={o.組織コード} value={o.組織コード}>{o.組織名}</option>)}
          </select>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">すべての役職</option>
            {activeRoles.map(r => <option key={r.役職コード} value={r.役職コード}>{r.役職名}</option>)}
          </select>
          <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showResigned}
              onChange={e => setShowResigned(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-primary-600"
            />
            退任済みも表示
          </label>
        </div>
        <button
          type="button"
          onClick={() => { setAssignVisible(v => !v); setAssignForm(ASSIGN_INITIAL); setAssignErrors({}); setAssignServerError(null); }}
          className={btnPrimary}
        >
          ＋ 役員を割当てる
        </button>
      </div>

      {/* 割当てフォーム */}
      {assignVisible && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-primary-800">新しい役員を割当てる</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 会員検索 */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                会員 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={assignForm.memberSearch}
                onChange={e => setAssignForm(f => ({ ...f, memberSearch: e.target.value, memberId: '', staffId: '' }))}
                placeholder="氏名・会員ID・事業所名で検索（個人会員・事業所職員を含む）"
                className={fieldInput(!!assignErrors.memberId)}
              />
              {assignForm.memberSearch && !assignForm.memberId && !assignForm.staffId && (
                <div className="mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-md">
                  {filteredPersons.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">該当なし</p>
                  ) : (
                    filteredPersons.map(p => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setAssignForm(f => ({ ...f, memberId: p.memberId, staffId: p.staffId, memberSearch: p.label }))}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-primary-50"
                      >
                        <span className="font-medium text-slate-800">{p.displayName}</span>
                        {p.officeName && <span className="ml-2 text-slate-400">{p.officeName}</span>}
                        <span className="ml-2 text-[10px] rounded bg-slate-100 px-1 text-slate-500">
                          {p.staffId ? '事業所職員' : '個人/賛助'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {(assignForm.memberId || assignForm.staffId) && (
                <p className="mt-1 text-[11px] text-emerald-600">✓ 選択済み: {assignForm.memberSearch}</p>
              )}
              {assignErrors.memberId && <p className="mt-1 text-xs text-red-600">{assignErrors.memberId}</p>}
            </div>

            {/* 役職 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                役職 <span className="text-red-500">*</span>
              </label>
              <select
                value={assignForm.roleCode}
                onChange={e => setAssignForm(f => ({ ...f, roleCode: e.target.value }))}
                className={fieldInput(!!assignErrors.roleCode)}
              >
                <option value="">-- 選択してください --</option>
                {activeOrgs.map(org => {
                  const orgRoles = activeRoles.filter(r => r.組織コード === org.組織コード);
                  if (orgRoles.length === 0) return null;
                  return (
                    <optgroup key={org.組織コード} label={org.組織名}>
                      {orgRoles.map(r => <option key={r.役職コード} value={r.役職コード}>{r.役職名}</option>)}
                    </optgroup>
                  );
                })}
              </select>
              {assignErrors.roleCode && <p className="mt-1 text-xs text-red-600">{assignErrors.roleCode}</p>}
            </div>

            {/* 就任日 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">就任日</label>
              <input
                type="date"
                value={assignForm.appointedDate}
                onChange={e => setAssignForm(f => ({ ...f, appointedDate: e.target.value }))}
                max={todayStr}
                className={fieldInput(!!assignErrors.appointedDate)}
              />
              {assignErrors.appointedDate
                ? <p className="mt-1 text-xs text-red-600">{assignErrors.appointedDate}</p>
                : <p className="mt-1 text-[11px] text-slate-400">省略可。空欄の場合は就任日なしとして登録します。</p>}
            </div>

            {/* 備考 */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">備考</label>
              <input
                type="text"
                value={assignForm.note}
                onChange={e => setAssignForm(f => ({ ...f, note: e.target.value }))}
                maxLength={200}
                placeholder="任意"
                className={inputCls}
              />
            </div>
          </div>

          {assignServerError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{assignServerError}</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={handleAssign} disabled={assignSaving} className={btnPrimary}>
              {assignSaving ? '登録中…' : '役員として割当て'}
            </button>
            <button type="button" onClick={() => { setAssignVisible(false); setAssignErrors({}); }} className={btnSecondary}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 退任フォーム */}
      {resignTarget && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-800">
            退任処理 — {resignTarget.表示名}（{roleMap[resignTarget.役職コード] ?? resignTarget.役職コード}）
          </h3>
          <div className="max-w-xs">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              退任日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={resignDate}
              onChange={e => { setResignDate(e.target.value); setResignDateError(''); }}
              min={resignTarget.就任日 || undefined}
              max={todayStr}
              className={resignDateError ? inputErrCls : inputCls}
            />
            {resignDateError && <p className="mt-1 text-xs text-red-600">{resignDateError}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleResign} disabled={resignSaving} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
              {resignSaving ? '処理中…' : '退任を確定'}
            </button>
            <button type="button" onClick={() => { setResignTarget(null); setResignDate(''); }} className={btnSecondary}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 紐づけ変更フォーム */}
      {linkageTarget && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-sky-800">
            紐づけ変更 — {linkageTarget.表示名}（{roleMap[linkageTarget.役職コード] ?? linkageTarget.役職コード}）
          </h3>
          <p className="text-xs text-slate-600">会員種別が変わった場合（個人↔事業所職員）に紐づけを更新します。振込口座も同時に移行されます。</p>
          <div className="max-w-lg">
            <label className="mb-1 block text-xs font-medium text-slate-700">新しい担当者</label>
            <input type="text" value={linkageSearch} onChange={e => { setLinkageSearch(e.target.value); setLinkageSelected(null); }}
              placeholder="氏名・事業所名で検索" className={inputCls} />
            {linkageSearch && !linkageSelected && (
              <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white shadow-md">
                {filteredLinkagePersons.length === 0
                  ? <p className="px-3 py-2 text-xs text-slate-400">該当なし</p>
                  : filteredLinkagePersons.map(p => (
                    <button key={p.key} type="button"
                      onClick={() => { setLinkageSelected(p); setLinkageSearch(p.label); }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-sky-50">
                      <span className="font-medium text-slate-800">{p.displayName}</span>
                      {p.officeName && <span className="ml-2 text-slate-400">{p.officeName}</span>}
                      <span className="ml-2 text-[10px] rounded bg-slate-100 px-1 text-slate-500">{p.staffId ? '事業所職員' : '個人/賛助'}</span>
                    </button>
                  ))
                }
              </div>
            )}
            {linkageSelected && <p className="mt-1 text-[11px] text-emerald-600">✓ 選択済み: {linkageSelected.label}</p>}
          </div>
          {linkageError && <p className="text-xs text-red-600" role="alert">{linkageError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleLinkageUpdate} disabled={linkageSaving || !linkageSelected}
              className={btnPrimary}>{linkageSaving ? '変更中…' : '紐づけを変更する'}</button>
            <button type="button" onClick={() => { setLinkageTarget(null); setLinkageSearch(''); setLinkageSelected(null); }} className={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {/* 役員テーブル */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-700">
            役員一覧 <span className="ml-1 text-slate-400 font-normal">({filteredOfficers.length} 件)</span>
          </p>
        </div>

        {filteredOfficers.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">条件に一致する役員がいません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">氏名 / 会員番号</th>
                  <th className="px-3 py-3">組織</th>
                  <th className="px-3 py-3">役職</th>
                  <th className="px-3 py-3">就任日</th>
                  <th className="px-3 py-3">退任日</th>
                  <th className="px-3 py-3">状態</th>
                  <th className="px-3 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredOfficers.map(officer => {
                  const isActive = !officer.退任日;
                  return (
                    <tr key={officer.役員ID} className={!isActive ? 'bg-slate-50/60 opacity-60' : undefined}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{officer.表示名}</p>
                        {officer.所属名 && <p className="text-xs text-slate-400">{officer.所属名}</p>}
                        <span className="text-[10px] rounded bg-slate-100 px-1 text-slate-500">
                          {officer.職員ID ? '事業所職員' : (officer.会員種別コード === 'INDIVIDUAL' ? '個人会員' : officer.会員種別コード === 'SUPPORT' ? '賛助会員' : officer.会員種別コード)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700 text-xs">{orgMap[officer.組織コード] ?? officer.組織コード}</td>
                      <td className="px-3 py-3 text-slate-700">{roleMap[officer.役職コード] ?? officer.役職コード}</td>
                      <td className="px-3 py-3 text-slate-500">{officer.就任日 || '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{officer.退任日 || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {isActive ? '現職' : '退任済み'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isActive && (
                            <button type="button" onClick={() => { setLinkageTarget(officer); setLinkageSearch(''); setLinkageSelected(null); setLinkageError(null); }}
                              className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100">
                              紐づけ変更
                            </button>
                          )}
                          {isActive && (
                            <button type="button" onClick={() => openResign(officer)} className={btnDanger}>
                              退任処理
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── 振込口座管理タブ ──────────────────────────────────────────────────────

interface BankFormState {
  bankName: string;
  bankCode: string;
  branchName: string;
  branchCode: string;
  accountType: string;
  accountNumber: string;
  accountHolderKana: string;
  note: string;
}

type BankFormErrors = Partial<Record<keyof BankFormState, string>>;

const BANK_INITIAL: BankFormState = {
  bankName: '', bankCode: '', branchName: '', branchCode: '',
  accountType: '普通', accountNumber: '', accountHolderKana: '', note: '',
};

const ACCOUNT_TYPES = ['普通', '当座', '貯蓄'];

type BankAccountSubjectKind = 'member' | 'staff';

interface BankAccountSubject {
  key: string;
  kind: BankAccountSubjectKind;
  memberId: string;
  staffId: string;
  label: string;
}

function buildBankAccountSubject(officer: OfficerRecord): BankAccountSubject | null {
  const staffId = String(officer.職員ID || '').trim();
  const memberId = String(officer.会員ID || '').trim();
  if (staffId && memberId) return null;
  if (staffId) {
    return {
      key: `staff:${staffId}`,
      kind: 'staff',
      memberId: '',
      staffId,
      label: `${officer.表示名}（${staffId}）`,
    };
  }
  if (memberId) {
    return {
      key: `member:${memberId}`,
      kind: 'member',
      memberId,
      staffId: '',
      label: `${officer.表示名}（${memberId}）`,
    };
  }
  return null;
}

function bankAccountSubjectPayload(subject: BankAccountSubject): { memberId?: string; staffId?: string } {
  return subject.kind === 'staff'
    ? { staffId: subject.staffId }
    : { memberId: subject.memberId };
}

function validateBankForm(form: BankFormState): BankFormErrors {
  const errs: BankFormErrors = {};
  if (!form.bankName.trim()) errs.bankName = '金融機関名は必須です。';
  else if (form.bankName.trim().length > 50) errs.bankName = '50文字以内で入力してください。';
  if (!form.bankCode.trim()) errs.bankCode = '金融機関コードは必須です。';
  else if (!/^\d{4}$/.test(form.bankCode.trim())) errs.bankCode = '4桁の数字で入力してください。';
  if (!form.branchName.trim()) errs.branchName = '支店名は必須です。';
  else if (form.branchName.trim().length > 50) errs.branchName = '50文字以内で入力してください。';
  if (!form.branchCode.trim()) errs.branchCode = '支店コードは必須です。';
  else if (!/^\d{3}$/.test(form.branchCode.trim())) errs.branchCode = '3桁の数字で入力してください。';
  if (!form.accountType) errs.accountType = '口座種別を選択してください。';
  if (!form.accountNumber.trim()) errs.accountNumber = '口座番号は必須です。';
  else if (!/^\d{1,7}$/.test(form.accountNumber.trim())) errs.accountNumber = '1〜7桁の数字で入力してください。';
  if (!form.accountHolderKana.trim()) errs.accountHolderKana = '口座名義カナは必須です。';
  else if (!validateKana(form.accountHolderKana.trim())) errs.accountHolderKana = '全角カタカナで入力してください。';
  else if (form.accountHolderKana.trim().length > 30) errs.accountHolderKana = '30文字以内で入力してください。';
  return errs;
}

const BankAccountTab: React.FC<{
  officerData: OfficerManagementData;
  api: ApiClient;
}> = ({ officerData, api }) => {
  const activeOfficerSubjects = useMemo(() => {
    const subjectsByKey = new Map<string, BankAccountSubject>();
    officerData.officers
      .filter(o => !o.退任日)
      .map(buildBankAccountSubject)
      .filter((subject): subject is BankAccountSubject => subject !== null)
      .forEach(subject => {
        if (!subjectsByKey.has(subject.key)) subjectsByKey.set(subject.key, subject);
      });
    return [...subjectsByKey.values()].sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  }, [officerData.officers]);

  const [selectedSubjectKey, setSelectedSubjectKey] = useState('');
  const [account, setAccount] = useState<BankAccount | null | undefined>(undefined); // undefined=未読込
  const [accountLoading, setAccountLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<BankFormState>(BANK_INITIAL);
  const [formErrors, setFormErrors] = useState<BankFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const selectedSubject = useMemo(
    () => activeOfficerSubjects.find(subject => subject.key === selectedSubjectKey) ?? null,
    [activeOfficerSubjects, selectedSubjectKey],
  );

  const loadAccount = async (subject: BankAccountSubject) => {
    setAccountLoading(true);
    setAccount(undefined);
    setFormVisible(false);
    setServerError(null);
    try {
      const acc = await api.getAdminBankAccount(bankAccountSubjectPayload(subject));
      setAccount(acc);
    } catch (e: any) {
      setServerError(e?.message || '口座情報の取得に失敗しました。');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSelectSubject = (subjectKey: string) => {
    setSelectedSubjectKey(subjectKey);
    const subject = activeOfficerSubjects.find(item => item.key === subjectKey);
    if (subject) {
      void loadAccount(subject);
      return;
    }
    setAccount(undefined);
    setFormVisible(false);
    setServerError(subjectKey ? '選択した役員の人物IDが不正です。役員一覧を再読み込みしてください。' : null);
  };

  const openForm = () => {
    setForm(
      account
        ? {
            bankName: account.金融機関名 ?? '',
            bankCode: account.金融機関コード ?? '',
            branchName: account.支店名 ?? '',
            branchCode: account.支店コード ?? '',
            accountType: account.口座種別 ?? '普通',
            accountNumber: account.口座番号 ?? '',
            accountHolderKana: account.口座名義カナ ?? '',
            note: account.備考 ?? '',
          }
        : BANK_INITIAL,
    );
    setFormErrors({});
    setServerError(null);
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!selectedSubject) {
      setServerError('対象役員を選択してください。');
      return;
    }
    const errs = validateBankForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setServerError(null);
    try {
      const payload: SaveBankAccountPayload = {
        ...bankAccountSubjectPayload(selectedSubject),
        bankName: form.bankName.trim(),
        bankCode: form.bankCode.trim(),
        branchName: form.branchName.trim(),
        branchCode: form.branchCode.trim(),
        accountType: form.accountType,
        accountNumber: form.accountNumber.trim(),
        accountHolderKana: form.accountHolderKana.trim(),
        note: form.note.trim(),
      };
      await api.saveAdminBankAccount(payload);
      await loadAccount(selectedSubject);
      setFormVisible(false);
    } catch (e: any) {
      setServerError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) {
      setServerError('対象役員を選択してください。');
      return;
    }
    if (!window.confirm('この口座情報を削除しますか？')) return;
    setDeleting(true);
    setServerError(null);
    try {
      await api.deleteAdminBankAccount(bankAccountSubjectPayload(selectedSubject));
      setAccount(null);
      setFormVisible(false);
    } catch (e: any) {
      setServerError(e?.message || '削除に失敗しました。');
    } finally {
      setDeleting(false);
    }
  };

  const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 会員選択 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">対象役員の選択</h3>
        <div className="max-w-sm">
          <select
            value={selectedSubjectKey}
            onChange={e => handleSelectSubject(e.target.value)}
            className={inputCls}
          >
            <option value="">-- 役員を選択してください --</option>
            {activeOfficerSubjects.map(subject => (
              <option key={subject.key} value={subject.key}>
                {subject.label}{subject.kind === 'staff' ? ' / 事業所職員' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">現職の役員のみ表示しています。</p>
        </div>
      </div>

      {/* 口座情報表示 */}
      {selectedSubject && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">振込口座情報</h3>
            {!formVisible && account !== undefined && (
              <div className="flex gap-2">
                <button type="button" onClick={openForm} className={btnAction}>
                  {account ? '編集' : '口座を登録'}
                </button>
                {account && (
                  <button type="button" onClick={handleDelete} disabled={deleting} className={btnDanger}>
                    {deleting ? '…' : '削除'}
                  </button>
                )}
              </div>
            )}
          </div>

          {accountLoading && <p className="text-sm text-slate-400">読み込み中…</p>}
          {serverError && !formVisible && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          {/* 登録済み口座表示 */}
          {!accountLoading && account && !formVisible && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['金融機関', `${account.金融機関名}（${account.金融機関コード}）`],
                ['支店', `${account.支店名}（${account.支店コード}）`],
                ['口座種別', account.口座種別],
                ['口座番号', account.口座番号],
                ['口座名義カナ', account.口座名義カナ],
                ['備考', account.備考 || '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* 未登録 */}
          {!accountLoading && account === null && !formVisible && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
              <p className="text-sm text-slate-500">口座情報が登録されていません。</p>
              <button type="button" onClick={openForm} className="mt-3 text-sm text-primary-600 underline hover:no-underline">
                口座を登録する
              </button>
            </div>
          )}

          {/* 入力フォーム */}
          {formVisible && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="金融機関名" required error={formErrors.bankName}>
                  <input
                    value={form.bankName}
                    onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                    maxLength={50}
                    placeholder="例: ゆうちょ銀行"
                    className={fieldInput(!!formErrors.bankName)}
                  />
                </Field>
                <Field label="金融機関コード（4桁）" required error={formErrors.bankCode}>
                  <input
                    value={form.bankCode}
                    onChange={e => setForm(f => ({ ...f, bankCode: e.target.value.replace(/\D/g, '') }))}
                    maxLength={4}
                    placeholder="例: 9900"
                    className={fieldInput(!!formErrors.bankCode)}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="支店名" required error={formErrors.branchName}>
                  <input
                    value={form.branchName}
                    onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
                    maxLength={50}
                    placeholder="例: 四〇八支店"
                    className={fieldInput(!!formErrors.branchName)}
                  />
                </Field>
                <Field label="支店コード（3桁）" required error={formErrors.branchCode}>
                  <input
                    value={form.branchCode}
                    onChange={e => setForm(f => ({ ...f, branchCode: e.target.value.replace(/\D/g, '') }))}
                    maxLength={3}
                    placeholder="例: 408"
                    className={fieldInput(!!formErrors.branchCode)}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="口座種別" required error={formErrors.accountType}>
                  <select
                    value={form.accountType}
                    onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}
                    className={fieldInput(!!formErrors.accountType)}
                  >
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="口座番号（7桁以内の数字）" required error={formErrors.accountNumber}>
                  <input
                    value={form.accountNumber}
                    onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))}
                    maxLength={7}
                    placeholder="例: 1234567"
                    className={fieldInput(!!formErrors.accountNumber)}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="口座名義カナ（全角カタカナ）" required error={formErrors.accountHolderKana}>
                  <input
                    value={form.accountHolderKana}
                    onChange={e => setForm(f => ({ ...f, accountHolderKana: e.target.value }))}
                    maxLength={30}
                    placeholder="例: ヒラカタ タロウ"
                    className={fieldInput(!!formErrors.accountHolderKana)}
                    lang="ja"
                  />
                  <p className="mt-0.5 text-[11px] text-slate-400">全角カタカナのみ。スペースで区切り可。</p>
                </Field>
                <Field label="備考" error={formErrors.note}>
                  <input
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    maxLength={200}
                    placeholder="任意"
                    className={inputCls}
                  />
                </Field>
              </div>

              {serverError && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{serverError}</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
                  {saving ? '保存中…' : '口座情報を保存'}
                </button>
                <button type="button" onClick={() => { setFormVisible(false); setFormErrors({}); setServerError(null); }} className={btnSecondary}>
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfficerManagement;
