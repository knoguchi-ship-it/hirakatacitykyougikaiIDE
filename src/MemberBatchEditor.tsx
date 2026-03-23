import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { api } from './services/api';
import { AdminPersonRow, AdminPersonType, MailDestination, MailingPreference } from './types';

interface MemberBatchEditorProps {
  onOpenDetail?: (memberId: string) => void;
}

type PersonTypeFilter = 'ALL' | AdminPersonType;
type StatusFilter = 'ALL' | 'ACTIVE' | 'ENROLLED' | 'WITHDRAWN' | 'LEFT';

type EditablePerson = {
  email: string;
  mailingPreference: string;
  preferredMailDestination: string;
  status: string;
  joinedDate: string;
  withdrawnDate: string;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const MESSAGE_AUTO_CLEAR_MS = 4000;

const toPersonTypeLabel = (t: AdminPersonType): string => {
  if (t === 'INDIVIDUAL') return '個人会員';
  if (t === 'SUPPORT') return '賛助会員';
  return '事業所職員';
};

const toPersonTypeBadge = (t: AdminPersonType): string => {
  if (t === 'INDIVIDUAL') return 'bg-slate-100 text-slate-700';
  if (t === 'SUPPORT') return 'bg-pink-100 text-pink-700';
  return 'bg-indigo-100 text-indigo-700';
};

const toStatusLabel = (status: string): string => {
  if (status === 'ACTIVE') return '在籍中';
  if (status === 'ENROLLED') return '在籍中';
  if (status === 'WITHDRAWAL_SCHEDULED') return '退会予定';
  if (status === 'WITHDRAWN') return '退会済';
  if (status === 'LEFT') return '退職済';
  return status;
};

const buildEditableRows = (persons: AdminPersonRow[]): Record<string, EditablePerson> => {
  const next: Record<string, EditablePerson> = {};
  persons.forEach((p) => {
    next[p.personKey] = {
      email: p.email || '',
      mailingPreference: p.mailingPreference || 'EMAIL',
      preferredMailDestination: p.preferredMailDestination || 'OFFICE',
      status: p.status || 'ACTIVE',
      joinedDate: p.joinedDate || '',
      withdrawnDate: p.withdrawnDate || '',
    };
  });
  return next;
};

const isDirty = (person: AdminPersonRow, draft: EditablePerson): boolean => {
  if ((draft.email || '') !== (person.email || '')) return true;
  if (person.personType !== 'OFFICE_STAFF') {
    if ((draft.mailingPreference || 'EMAIL') !== (person.mailingPreference || 'EMAIL')) return true;
    if ((draft.preferredMailDestination || 'OFFICE') !== (person.preferredMailDestination || 'OFFICE')) return true;
  }
  if ((draft.status || '') !== (person.status || '')) return true;
  if ((draft.joinedDate || '') !== (person.joinedDate || '')) return true;
  if ((draft.withdrawnDate || '') !== (person.withdrawnDate || '')) return true;
  return false;
};

const MemberBatchEditor: React.FC<MemberBatchEditorProps> = ({ onOpenDetail }) => {
  const [persons, setPersons] = useState<AdminPersonRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [personTypeFilter, setPersonTypeFilter] = useState<PersonTypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editableRows, setEditableRows] = useState<Record<string, EditablePerson>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const loadPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAdminPersonList();
      setPersons(result.persons);
      setEditableRows(buildEditableRows(result.persons));
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

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
  }, [personTypeFilter, statusFilter, deferredQuery, pageSize]);

  const sortedPersons = useMemo(() => {
    return [...persons].sort((a, b) => a.kana.localeCompare(b.kana, 'ja'));
  }, [persons]);

  const filteredPersons = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return sortedPersons.filter((p) => {
      if (personTypeFilter !== 'ALL' && p.personType !== personTypeFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && p.status !== 'ACTIVE' && p.status !== 'ENROLLED') return false;
        if (statusFilter === 'ENROLLED' && p.status !== 'ENROLLED') return false;
        if (statusFilter === 'WITHDRAWN' && p.status !== 'WITHDRAWN') return false;
        if (statusFilter === 'LEFT' && p.status !== 'LEFT') return false;
      }
      if (!normalizedQuery) return true;
      return [p.displayName, p.kana, p.officeName, p.memberId, p.email]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [sortedPersons, personTypeFilter, statusFilter, deferredQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPersons.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedPersons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPersons.slice(start, start + pageSize);
  }, [filteredPersons, currentPage, pageSize]);

  const dirtyPersons = useMemo(() => {
    return persons.filter((p) => {
      const draft = editableRows[p.personKey];
      return draft ? isDirty(p, draft) : false;
    });
  }, [persons, editableRows]);

  const filteredSummary = useMemo(() => ({
    total: filteredPersons.length,
    dirty: dirtyPersons.filter((p) => {
      if (personTypeFilter !== 'ALL' && p.personType !== personTypeFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && p.status !== 'ACTIVE' && p.status !== 'ENROLLED') return false;
        if (statusFilter === 'ENROLLED' && p.status !== 'ENROLLED') return false;
        if (statusFilter === 'WITHDRAWN' && p.status !== 'WITHDRAWN') return false;
        if (statusFilter === 'LEFT' && p.status !== 'LEFT') return false;
      }
      return true;
    }).length,
    active: filteredPersons.filter((p) => p.status === 'ACTIVE' || p.status === 'ENROLLED').length,
    inactive: filteredPersons.filter((p) => p.status === 'WITHDRAWN' || p.status === 'LEFT').length,
  }), [filteredPersons, dirtyPersons, personTypeFilter, statusFilter]);

  const updateDraft = (personKey: string, patch: Partial<EditablePerson>) => {
    setEditableRows((prev) => {
      const current = prev[personKey];
      if (!current) return prev;
      return { ...prev, [personKey]: { ...current, ...patch } };
    });
  };

  const buildPayload = (person: AdminPersonRow, draft: EditablePerson) => {
    const base: Record<string, any> = {
      personKey: person.personKey,
      personType: person.personType,
      memberId: person.memberId,
      staffId: person.staffId,
      email: draft.email.trim(),
      status: draft.status,
      joinedDate: draft.joinedDate || '',
      withdrawnDate: draft.withdrawnDate || '',
    };
    if (person.personType !== 'OFFICE_STAFF') {
      base.mailingPreference = draft.mailingPreference;
      base.preferredMailDestination = draft.preferredMailDestination;
    }
    return base;
  };

  const handleSaveOne = async (person: AdminPersonRow) => {
    const draft = editableRows[person.personKey];
    if (!draft || !isDirty(person, draft)) return;
    setSavingKey(person.personKey);
    setError(null);
    setSuccess(null);
    try {
      await api.updatePersonsBatch([buildPayload(person, draft)]);
      setSuccess(`${person.displayName} を保存しました。`);
      await loadPersons();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveBatch = async () => {
    if (dirtyPersons.length === 0) return;
    setBatchSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payloads = dirtyPersons.map((p) => buildPayload(p, editableRows[p.personKey]!));
      await api.updatePersonsBatch(payloads);
      setSuccess(`${dirtyPersons.length} 件を一括保存しました。`);
      await loadPersons();
    } catch (err) {
      setError(err instanceof Error ? err.message : '一括保存に失敗しました。');
    } finally {
      setBatchSaving(false);
    }
  };

  const isBusy = loading || batchSaving || savingKey !== null;
  const visibleStart = filteredPersons.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(currentPage * pageSize, filteredPersons.length);

  const isStaff = (p: AdminPersonRow) => p.personType === 'OFFICE_STAFF';

  // 職員の状態選択肢
  const statusOptions = (personType: AdminPersonType, currentStatus: string) => {
    if (personType === 'OFFICE_STAFF') {
      return [
        { value: 'ENROLLED', label: '在籍中' },
        { value: 'LEFT', label: '退職済' },
      ];
    }
    return [
      { value: 'ACTIVE', label: '在籍中' },
      { value: 'WITHDRAWAL_SCHEDULED', label: '退会予定' },
      { value: 'WITHDRAWN', label: '退会済' },
    ];
  };

  if (!loaded) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <h3 className="text-lg font-bold text-slate-800">会員一括編集</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              個人会員・賛助会員・事業所職員を人物単位でまとめて編集します。
              メール、発送方法、状態、入退会日を一覧で更新できます。
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadPersons()}
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
            個人会員・賛助会員・事業所職員を人物単位で編集します。詳細項目の編集は個別詳細画面へ遷移してください。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void loadPersons()}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            再読込
          </button>
          {dirtyPersons.length > 0 && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleSaveBatch()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {batchSaving ? '一括保存中...' : `変更をまとめて保存（${dirtyPersons.length} 件）`}
            </button>
          )}
        </div>
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
          <label className="block text-xs font-medium text-slate-600 mb-1">人物種別</label>
          <select
            className="border border-slate-300 rounded px-3 py-2 bg-white text-sm"
            value={personTypeFilter}
            onChange={(e) => setPersonTypeFilter(e.target.value as PersonTypeFilter)}
          >
            <option value="ALL">全種別</option>
            <option value="INDIVIDUAL">個人会員</option>
            <option value="SUPPORT">賛助会員</option>
            <option value="OFFICE_STAFF">事業所職員</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">状態</label>
          <select
            className="border border-slate-300 rounded px-3 py-2 bg-white text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="ALL">全状態</option>
            <option value="ACTIVE">在籍中</option>
            <option value="WITHDRAWN">退会済</option>
            <option value="LEFT">退職済</option>
          </select>
        </div>
        <div className="min-w-[240px] flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">検索</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="氏名・カナ・事業所名・会員番号・メール"
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
          <div className="text-xs text-amber-700">退会/退職済</div>
          <div className="mt-1 text-xl font-semibold text-amber-800">{filteredSummary.inactive}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {filteredPersons.length === 0 ? '該当データなし' : `${visibleStart} - ${visibleEnd} 件を表示 / 全 ${filteredPersons.length} 件`}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&laquo;</button>
          <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">前へ</button>
          <span className="text-sm text-slate-600">{currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">次へ</button>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&raquo;</button>
        </div>
      </div>

      {filteredPersons.length === 0 ? (
        <div className="py-8 text-center text-slate-500">条件に一致するデータはありません。</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">氏名 / ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">種別</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">メール</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">発送方法</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">郵送先</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">状態</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">入会日</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">退会日</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pagedPersons.map((person, index) => {
                const draft = editableRows[person.personKey];
                if (!draft) return null;
                const dirty = isDirty(person, draft);
                const stripe = index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white';
                const isOfficeStaff = isStaff(person);
                return (
                  <tr key={person.personKey} className={`${stripe} ${dirty ? 'ring-1 ring-inset ring-blue-100' : ''}`}>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <div className="font-medium text-slate-900">{person.displayName}</div>
                      <div className="text-xs text-slate-400">
                        {isOfficeStaff ? person.officeName : person.memberId}
                      </div>
                      {isOfficeStaff && person.staffRole && (
                        <div className="text-xs text-slate-400">{person.staffRole === 'REPRESENTATIVE' ? '代表者' : person.staffRole === 'ADMIN' ? '管理者' : 'メンバー'}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toPersonTypeBadge(person.personType)}`}>
                        {toPersonTypeLabel(person.personType)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <input
                        type="email"
                        className="w-full min-w-[180px] border border-slate-300 rounded px-2 py-1.5 text-sm"
                        value={draft.email}
                        disabled={isBusy}
                        onChange={(e) => updateDraft(person.personKey, { email: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      {isOfficeStaff ? (
                        <span className="text-xs text-slate-400">―</span>
                      ) : (
                        <select
                          className="w-full min-w-[120px] border border-slate-300 rounded px-2 py-1.5 bg-white text-sm"
                          value={draft.mailingPreference}
                          disabled={isBusy}
                          onChange={(e) => updateDraft(person.personKey, { mailingPreference: e.target.value })}
                        >
                          <option value="EMAIL">メール配信</option>
                          <option value="POST">郵送希望</option>
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      {isOfficeStaff ? (
                        <span className="text-xs text-slate-400">―</span>
                      ) : (
                        <select
                          className="w-full min-w-[110px] border border-slate-300 rounded px-2 py-1.5 bg-white text-sm"
                          value={draft.preferredMailDestination}
                          disabled={isBusy}
                          onChange={(e) => updateDraft(person.personKey, { preferredMailDestination: e.target.value })}
                        >
                          <option value="OFFICE">勤務先</option>
                          <option value="HOME">自宅</option>
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <select
                        className="w-full min-w-[130px] border border-slate-300 rounded px-2 py-1.5 bg-white text-sm"
                        value={draft.status}
                        disabled={isBusy}
                        onChange={(e) => {
                          const nextStatus = e.target.value;
                          updateDraft(person.personKey, {
                            status: nextStatus,
                            withdrawnDate: (nextStatus === 'ACTIVE' || nextStatus === 'ENROLLED') ? '' : draft.withdrawnDate,
                          });
                        }}
                      >
                        {statusOptions(person.personType, draft.status).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <input
                        type="date"
                        className="w-full min-w-[140px] border border-slate-300 rounded px-2 py-1.5 text-sm"
                        value={draft.joinedDate}
                        disabled={isBusy}
                        onChange={(e) => updateDraft(person.personKey, { joinedDate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <input
                        type="date"
                        className="w-full min-w-[140px] border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                        value={draft.withdrawnDate}
                        disabled={(draft.status === 'ACTIVE' || draft.status === 'ENROLLED') || isBusy}
                        onChange={(e) => updateDraft(person.personKey, { withdrawnDate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-sm align-top">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy || !dirty}
                          onClick={() => void handleSaveOne(person)}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            dirty ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-400'
                          } disabled:opacity-50`}
                        >
                          {savingKey === person.personKey ? '...' : '保存'}
                        </button>
                        {onOpenDetail && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onOpenDetail(person.memberId)}
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
