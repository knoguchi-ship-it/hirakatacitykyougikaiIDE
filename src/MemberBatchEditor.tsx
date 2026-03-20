import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { api } from './services/api';
import { MailDestination, MailingPreference, Member, MemberType } from './types';

interface MemberBatchEditorProps {
  members: Member[];
  loaded: boolean;
  loading: boolean;
  onLoadMembers: () => Promise<void>;
  onSaved?: () => Promise<void> | void;
  onOpenDetail?: (memberId: string) => void;
}

type MemberStatus = Member['status'];
type MemberTypeFilter = 'ALL' | MemberType;
type StatusFilter = 'ALL' | MemberStatus;

type EditableMember = {
  email: string;
  mailingPreference: MailingPreference;
  preferredMailDestination: MailDestination;
  status: MemberStatus;
  joinedDate: string;
  withdrawnDate: string;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const MESSAGE_AUTO_CLEAR_MS = 4000;

const buildDisplayName = (member: Member): string => {
  if (member.type === MemberType.BUSINESS) {
    return member.officeName || `${member.lastName} ${member.firstName}`.trim() || member.id;
  }
  return `${member.lastName} ${member.firstName}`.trim() || member.id;
};

const buildEditableRows = (members: Member[]): Record<string, EditableMember> => {
  const next: Record<string, EditableMember> = {};
  members.forEach((member) => {
    next[member.id] = {
      email: member.email || '',
      mailingPreference: member.mailingPreference || MailingPreference.EMAIL,
      preferredMailDestination: member.preferredMailDestination || MailDestination.OFFICE,
      status: member.status || 'ACTIVE',
      joinedDate: member.joinedDate || '',
      withdrawnDate: member.withdrawnDate || '',
    };
  });
  return next;
};

const isDirty = (member: Member, draft: EditableMember): boolean => {
  if ((draft.email || '') !== (member.email || '')) return true;
  if ((draft.mailingPreference || MailingPreference.EMAIL) !== (member.mailingPreference || MailingPreference.EMAIL)) return true;
  if ((draft.preferredMailDestination || MailDestination.OFFICE) !== (member.preferredMailDestination || MailDestination.OFFICE)) return true;
  if ((draft.status || 'ACTIVE') !== (member.status || 'ACTIVE')) return true;
  if ((draft.joinedDate || '') !== (member.joinedDate || '')) return true;
  if ((draft.withdrawnDate || '') !== (member.withdrawnDate || '')) return true;
  return false;
};

const toMemberTypeLabel = (memberType: MemberType): string => {
  if (memberType === MemberType.BUSINESS) return '事業所会員';
  if (memberType === MemberType.SUPPORT) return '賛助会員';
  return '個人会員';
};

const toMemberTypeBadge = (memberType: MemberType): string => {
  if (memberType === MemberType.BUSINESS) return 'bg-indigo-100 text-indigo-700';
  if (memberType === MemberType.SUPPORT) return 'bg-pink-100 text-pink-700';
  return 'bg-slate-100 text-slate-700';
};

const MemberBatchEditor: React.FC<MemberBatchEditorProps> = ({
  members,
  loaded,
  loading,
  onLoadMembers,
  onSaved,
  onOpenDetail,
}) => {
  const [memberTypeFilter, setMemberTypeFilter] = useState<MemberTypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editableRows, setEditableRows] = useState<Record<string, EditableMember>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!loaded) return;
    setEditableRows(buildEditableRows(members));
  }, [loaded, members]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), MESSAGE_AUTO_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), MESSAGE_AUTO_CLEAR_MS * 2);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    setCurrentPage(1);
  }, [memberTypeFilter, statusFilter, deferredQuery, pageSize]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => a.id.localeCompare(b.id, 'ja'));
  }, [members]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return sortedMembers.filter((member) => {
      if (memberTypeFilter !== 'ALL' && member.type !== memberTypeFilter) return false;
      if (statusFilter !== 'ALL' && member.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [member.id, buildDisplayName(member), member.officeName || '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [sortedMembers, memberTypeFilter, statusFilter, deferredQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const dirtyMembers = useMemo(() => {
    return members.filter((member) => {
      const draft = editableRows[member.id];
      return draft ? isDirty(member, draft) : false;
    });
  }, [members, editableRows]);

  const filteredSummary = useMemo(() => ({
    total: filteredMembers.length,
    dirty: dirtyMembers.filter((member) => {
      if (memberTypeFilter !== 'ALL' && member.type !== memberTypeFilter) return false;
      if (statusFilter !== 'ALL' && member.status !== statusFilter) return false;
      return true;
    }).length,
    active: filteredMembers.filter((member) => member.status === 'ACTIVE').length,
    withdrawn: filteredMembers.filter((member) => member.status !== 'ACTIVE').length,
  }), [filteredMembers, dirtyMembers, memberTypeFilter, statusFilter]);

  const updateDraft = (memberId: string, patch: Partial<EditableMember>) => {
    setEditableRows((prev) => {
      const current = prev[memberId];
      if (!current) return prev;
      return {
        ...prev,
        [memberId]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const buildPayload = (member: Member, draft: EditableMember) => ({
    id: member.id,
    email: draft.email.trim(),
    mailingPreference: draft.mailingPreference,
    preferredMailDestination: draft.preferredMailDestination,
    status: draft.status,
    joinedDate: draft.joinedDate || '',
    withdrawnDate: draft.status === 'ACTIVE' ? '' : (draft.withdrawnDate || ''),
  });

  const afterSave = async () => {
    if (onSaved) {
      await Promise.resolve(onSaved());
    }
  };

  const handleSaveOne = async (member: Member) => {
    const draft = editableRows[member.id];
    if (!draft || !isDirty(member, draft)) return;
    setSavingKey(member.id);
    setError(null);
    setSuccess(null);
    try {
      await api.updateMembersBatch([buildPayload(member, draft)]);
      await afterSave();
      setSuccess(`${buildDisplayName(member)} を保存しました。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '一括編集の保存に失敗しました。');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveBatch = async () => {
    if (dirtyMembers.length === 0) return;
    setBatchSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.updateMembersBatch(dirtyMembers.map((member) => buildPayload(member, editableRows[member.id]!)));
      await afterSave();
      setSuccess(`${dirtyMembers.length} 件の会員情報を一括保存しました。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '一括編集の保存に失敗しました。');
    } finally {
      setBatchSaving(false);
    }
  };

  const isBusy = loading || batchSaving || savingKey !== null;
  const visibleStart = filteredMembers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(currentPage * pageSize, filteredMembers.length);

  if (!loaded) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <h3 className="text-lg font-bold text-slate-800">会員一括編集</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              代表メール、発送方法、郵送先、会員状態、入退会日を一覧でまとめて更新します。
              住所や職員情報の詳細編集は個別の会員詳細画面を使用します。
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onLoadMembers()}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? '読込中...' : '一括編集データを読み込む'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h3 className="text-lg font-bold text-slate-800">会員一括編集</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            管理トップで一覧のまま会員情報をまとめて更新します。詳細項目の編集は個別詳細画面へ遷移してください。
          </p>
        </div>
        {dirtyMembers.length > 0 && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleSaveBatch()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {batchSaving ? '一括保存中...' : `変更をまとめて保存（${dirtyMembers.length} 件）`}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}
      {success && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600">&times;</button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">会員種別</label>
          <select
            className="border border-slate-300 rounded px-3 py-2 bg-white text-sm"
            value={memberTypeFilter}
            onChange={(e) => setMemberTypeFilter(e.target.value as MemberTypeFilter)}
          >
            <option value="ALL">全種別</option>
            <option value={MemberType.INDIVIDUAL}>個人会員</option>
            <option value={MemberType.BUSINESS}>事業所会員</option>
            <option value={MemberType.SUPPORT}>賛助会員</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">会員状態</label>
          <select
            className="border border-slate-300 rounded px-3 py-2 bg-white text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="ALL">全状態</option>
            <option value="ACTIVE">在籍中</option>
            <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
            <option value="WITHDRAWN">退会済</option>
          </select>
        </div>
        <div className="min-w-[240px] flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">会員検索</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="会員番号・氏名・事業所名"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">表示件数</label>
          <select
            className="border border-slate-300 rounded px-3 py-2 bg-white text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size} 件</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-500">抽出件数</div>
          <div className="mt-1 text-xl font-semibold text-slate-800">{filteredSummary.total}</div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="text-xs text-blue-700">未保存変更</div>
          <div className="mt-1 text-xl font-semibold text-blue-800">{filteredSummary.dirty}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="text-xs text-emerald-700">在籍中</div>
          <div className="mt-1 text-xl font-semibold text-emerald-800">{filteredSummary.active}</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-xs text-amber-700">退会予定/済</div>
          <div className="mt-1 text-xl font-semibold text-amber-800">{filteredSummary.withdrawn}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {filteredMembers.length === 0 ? '該当データなし' : `${visibleStart} - ${visibleEnd} 件を表示 / 全 ${filteredMembers.length} 件`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50"
          >
            &laquo;
          </button>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50"
          >
            前へ
          </button>
          <span className="text-sm text-slate-600">{currentPage} / {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50"
          >
            次へ
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50"
          >
            &raquo;
          </button>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="py-8 text-center text-slate-500">条件に一致する会員はありません。</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">会員</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">種別</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">代表メール</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">発送方法</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">郵送先</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">会員状態</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">入会日</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">退会日</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pagedMembers.map((member, index) => {
                const draft = editableRows[member.id];
                if (!draft) return null;
                const dirty = isDirty(member, draft);
                const stripe = index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white';
                return (
                  <tr key={member.id} className={`${stripe} ${dirty ? 'ring-1 ring-inset ring-blue-100' : ''}`}>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <div className="font-medium text-slate-900">{buildDisplayName(member)}</div>
                      <div className="text-xs text-slate-400">{member.id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toMemberTypeBadge(member.type)}`}>
                        {toMemberTypeLabel(member.type)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <input
                        type="email"
                        className="w-full min-w-[180px] border border-slate-300 rounded px-2 py-1.5 text-sm"
                        value={draft.email}
                        disabled={isBusy}
                        onChange={(e) => updateDraft(member.id, { email: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <select
                        className="w-full min-w-[120px] border border-slate-300 rounded px-2 py-1.5 bg-white text-sm"
                        value={draft.mailingPreference}
                        disabled={isBusy}
                        onChange={(e) => updateDraft(member.id, { mailingPreference: e.target.value as MailingPreference })}
                      >
                        <option value={MailingPreference.EMAIL}>メール配信</option>
                        <option value={MailingPreference.POST}>郵送希望</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <select
                        className="w-full min-w-[110px] border border-slate-300 rounded px-2 py-1.5 bg-white text-sm"
                        value={draft.preferredMailDestination}
                        disabled={isBusy}
                        onChange={(e) => updateDraft(member.id, { preferredMailDestination: e.target.value as MailDestination })}
                      >
                        <option value={MailDestination.OFFICE}>勤務先</option>
                        <option value={MailDestination.HOME}>自宅</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <select
                        className="w-full min-w-[130px] border border-slate-300 rounded px-2 py-1.5 bg-white text-sm"
                        value={draft.status}
                        disabled={isBusy}
                        onChange={(e) => {
                          const nextStatus = e.target.value as MemberStatus;
                          updateDraft(member.id, {
                            status: nextStatus,
                            withdrawnDate: nextStatus === 'ACTIVE' ? '' : draft.withdrawnDate,
                          });
                        }}
                      >
                        <option value="ACTIVE">在籍中</option>
                        <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
                        <option value="WITHDRAWN">退会済</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <input
                        type="date"
                        className="w-full min-w-[140px] border border-slate-300 rounded px-2 py-1.5 text-sm"
                        value={draft.joinedDate}
                        disabled={isBusy}
                        onChange={(e) => updateDraft(member.id, { joinedDate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <input
                        type="date"
                        className="w-full min-w-[140px] border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                        value={draft.withdrawnDate}
                        disabled={draft.status === 'ACTIVE' || isBusy}
                        onChange={(e) => updateDraft(member.id, { withdrawnDate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy || !dirty}
                          onClick={() => void handleSaveOne(member)}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            dirty ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-400'
                          } disabled:opacity-50`}
                        >
                          {savingKey === member.id ? '...' : '保存'}
                        </button>
                        {onOpenDetail && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onOpenDetail(member.id)}
                            className="px-3 py-1.5 rounded border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            詳細
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
  );
};

export default MemberBatchEditor;
