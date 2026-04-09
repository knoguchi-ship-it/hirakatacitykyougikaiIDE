import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import {
  AnnualFeeAdminData,
  AnnualFeeAdminRecord,
  AnnualFeeAdminSummary,
  AnnualFeeAdminSummaryByType,
  MemberType,
  PaymentStatus,
} from '../types';

interface Props {
  onChanged?: () => Promise<void> | void;
  onDirtyChange?: (dirty: boolean) => void;
  onOpenMember?: (memberId: string) => void;
}

type StatusFilter = 'ALL' | PaymentStatus;

type MemberTypeFilter = 'ALL' | MemberType;

type AnnualFeeDraftStatus = PaymentStatus | 'WITHDRAW';

type EditableRow = {

  id: string;

  status: AnnualFeeDraftStatus;

  confirmedDate: string;

  note: string;

};

type SortKey = 'displayName' | 'memberType' | 'status' | 'confirmedDate' | 'note';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
// 会計年度は4月始まり: 1〜3月は前年度を指す
const CURRENT_YEAR = (() => { const d = new Date(); return d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear(); })();

const MESSAGE_AUTO_CLEAR_MS = 4000;

const WITHDRAW_ACTION = 'WITHDRAW' as const;
const MEMBER_TYPES = [MemberType.INDIVIDUAL, MemberType.BUSINESS, MemberType.SUPPORT] as const;
const MEMBER_TYPE_ORDER: Record<MemberType, number> = {
  [MemberType.INDIVIDUAL]: 0,
  [MemberType.BUSINESS]: 1,
  [MemberType.SUPPORT]: 2,
};
const YEN_FORMATTER = new Intl.NumberFormat('ja-JP');

const toSlashDate = (isoDate: string): string => {
  if (!isoDate) return '';
  return isoDate.replace(/-/g, '/');
};

const parseSlashDate = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const [, ys, ms, ds] = match;
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${ys}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const formatCurrency = (value: number): string => `${YEN_FORMATTER.format(Math.max(0, Math.trunc(Number(value) || 0)))}円`;

const createEmptySummaryByType = (memberType: MemberType): AnnualFeeAdminSummaryByType => ({
  memberType,
  eligibleCount: 0,
  paidCount: 0,
  unpaidCount: 0,
  paidAmount: 0,
  unpaidAmount: 0,
});

const createEmptySummary = (): AnnualFeeAdminSummary => ({
  eligibleCount: 0,
  paidCount: 0,
  unpaidCount: 0,
  paidAmount: 0,
  unpaidAmount: 0,
  memberTypeBreakdown: MEMBER_TYPES.map((memberType) => createEmptySummaryByType(memberType)),
});

const normalizeSummary = (summary?: AnnualFeeAdminSummary | null): AnnualFeeAdminSummary => {
  const lookup = new Map((summary?.memberTypeBreakdown || []).map((entry) => [entry.memberType, entry]));
  return {
    eligibleCount: Number(summary?.eligibleCount || 0),
    paidCount: Number(summary?.paidCount || 0),
    unpaidCount: Number(summary?.unpaidCount || 0),
    paidAmount: Number(summary?.paidAmount || 0),
    unpaidAmount: Number(summary?.unpaidAmount || 0),
    memberTypeBreakdown: MEMBER_TYPES.map((memberType) => ({
      ...createEmptySummaryByType(memberType),
      ...(lookup.get(memberType) || {}),
      memberType,
    })),
  };
};

const createEmptyData = (): AnnualFeeAdminData => ({
  selectedYear: CURRENT_YEAR,
  records: [],
  years: [],
  auditLogs: [],
  summary: createEmptySummary(),
});

const toMemberTypeLabel = (memberType: MemberType): string => {
  if (memberType === MemberType.BUSINESS) return '事業所会員';
  if (memberType === MemberType.SUPPORT) return '賛助会員';
  return '個人会員';
};

const memberTypeBadge = (memberType: MemberType): string => {
  if (memberType === MemberType.BUSINESS) return 'bg-violet-100 text-violet-700';
  if (memberType === MemberType.SUPPORT) return 'bg-sky-100 text-sky-700';
  return 'bg-slate-100 text-slate-700';
};

const formatDateTimeDisplay = (value?: string): string => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ja-JP');
};

const buildRowKey = (record: Pick<AnnualFeeAdminRecord, 'memberId' | 'year'>): string => `${record.memberId}:${record.year}`;

const buildEditableRows = (records: AnnualFeeAdminRecord[]): Record<string, EditableRow> => {
  const next: Record<string, EditableRow> = {};
  records.forEach((record) => {
    next[buildRowKey(record)] = {
      id: record.id,
      status: record.status,
      confirmedDate: record.confirmedDate || '',
      note: record.note || '',
    };
  });
  return next;
};

const buildSummaryFromRecords = (records: AnnualFeeAdminRecord[]): AnnualFeeAdminSummary => {
  const summary = createEmptySummary();
  const typeMap = new Map(summary.memberTypeBreakdown.map((entry) => [entry.memberType, entry]));
  records.forEach((record) => {
    const bucket = typeMap.get(record.memberType);
    const amount = Number(record.amount || 0);
    summary.eligibleCount += 1;
    if (record.status === PaymentStatus.PAID) {
      summary.paidCount += 1;
      summary.paidAmount += amount;
      if (bucket) {
        bucket.paidCount += 1;
        bucket.paidAmount += amount;
      }
      return;
    }
    summary.unpaidCount += 1;
    summary.unpaidAmount += amount;
    if (bucket) {
      bucket.unpaidCount += 1;
      bucket.unpaidAmount += amount;
    }
  });
  return summary;
};

const isDirty = (record: AnnualFeeAdminRecord, draft: EditableRow): boolean => {
  if (draft.status !== record.status) return true;
  if ((draft.confirmedDate || '') !== (record.confirmedDate || '')) return true;
  if ((draft.note || '') !== (record.note || '')) return true;
  return false;
};

const getSummaryByType = (summary: AnnualFeeAdminSummary, memberType: MemberType): AnnualFeeAdminSummaryByType => (
  summary.memberTypeBreakdown.find((entry) => entry.memberType === memberType) || createEmptySummaryByType(memberType)
);

const SortIndicator: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => (
  <span className={`ml-1 inline-block text-[10px] ${active ? 'text-slate-800' : 'text-slate-300'}`}>
    {!active ? '・' : dir === 'asc' ? '▲' : '▼'}
  </span>
);

const Pagination: React.FC<{
  current: number;
  total: number;
  onChange: (page: number) => void;
}> = ({ current, total, onChange }) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      disabled={current <= 1}
      onClick={() => onChange(1)}
      className="px-2 py-1.5 rounded border border-slate-300 bg-white text-xs disabled:opacity-40"
      title="最初のページ"
    >
      ≪
    </button>
    <button
      type="button"
      disabled={current <= 1}
      onClick={() => onChange(current - 1)}
      className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-sm disabled:opacity-40"
    >
      前へ
    </button>
    <span className="px-2 text-sm text-slate-600 tabular-nums">{current} / {total}</span>
    <button
      type="button"
      disabled={current >= total}
      onClick={() => onChange(current + 1)}
      className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-sm disabled:opacity-40"
    >
      次へ
    </button>
    <button
      type="button"
      disabled={current >= total}
      onClick={() => onChange(total)}
      className="px-2 py-1.5 rounded border border-slate-300 bg-white text-xs disabled:opacity-40"
      title="最後のページ"
    >
      ≫
    </button>
  </div>
);

const AnnualFeeManagement: React.FC<Props> = ({ onChanged, onDirtyChange, onOpenMember }) => {
  const [data, setData] = useState<AnnualFeeAdminData>(createEmptyData);
  const [loading, setLoading] = useState(true);
  const [batchSaving, setBatchSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('UNPAID');
  const [memberTypeFilter, setMemberTypeFilter] = useState<MemberTypeFilter>('ALL');
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [editableRows, setEditableRows] = useState<Record<string, EditableRow>>({});
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
  const [rawDateTexts, setRawDateTexts] = useState<Record<string, string>>({});
  const [failedKeys, setFailedKeys] = useState<Set<string> | null>(null);
  const [pendingYearChange, setPendingYearChange] = useState<number | null>(null);
  const yearChangeDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), MESSAGE_AUTO_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error || failedKeys) return;
    const timer = setTimeout(() => setError(null), MESSAGE_AUTO_CLEAR_MS * 2);
    return () => clearTimeout(timer);
  }, [error, failedKeys]);

  const load = useCallback(async (year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.getAnnualFeeAdminData(year);
      const normalized: AnnualFeeAdminData = {
        ...next,
        summary: normalizeSummary(next.summary),
      };
      setData(normalized);
      setSelectedYear(normalized.selectedYear);
      setEditableRows(buildEditableRows(normalized.records));
      setRawDateTexts({});
      setDateErrors({});
      setFailedKeys(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '年会費データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const dialog = yearChangeDialogRef.current;
    if (!dialog) return;
    if (pendingYearChange === null) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, [pendingYearChange]);

  const applyOptimisticUpdate = useCallback((saved: AnnualFeeAdminRecord | AnnualFeeAdminRecord[]) => {
    const savedRecords = Array.isArray(saved) ? saved : [saved];
    const savedMap = new Map(savedRecords.map((record) => [buildRowKey(record), record]));
    setData((prev) => {
      const nextRecords = prev.records.map((record) => savedMap.get(buildRowKey(record)) || record);
      return {
        ...prev,
        records: nextRecords,
        summary: buildSummaryFromRecords(nextRecords),
      };
    });
    setEditableRows((prev) => {
      const next = { ...prev };
      savedRecords.forEach((record) => {
        next[buildRowKey(record)] = {
          id: record.id,
          status: record.status,
          confirmedDate: record.confirmedDate || '',
          note: record.note || '',
        };
      });
      return next;
    });
    setRawDateTexts((prev) => {
      const next = { ...prev };
      savedRecords.forEach((record) => {
        delete next[buildRowKey(record)];
      });
      return next;
    });
    setDateErrors((prev) => {
      const next = { ...prev };
      savedRecords.forEach((record) => {
        delete next[buildRowKey(record)];
      });
      return next;
    });
  }, []);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.records.filter((record) => {
      if (failedKeys && !failedKeys.has(buildRowKey(record))) return false;
      if (statusFilter !== 'ALL' && record.status !== statusFilter) return false;
      if (memberTypeFilter !== 'ALL' && record.memberType !== memberTypeFilter) return false;
      if (!normalizedQuery) return true;
      return [record.memberId, record.displayName, toMemberTypeLabel(record.memberType)]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [data.records, failedKeys, memberTypeFilter, query, statusFilter]);

  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    const dir = sortDir === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'displayName':
          comparison = a.displayName.localeCompare(b.displayName, 'ja');
          break;
        case 'memberType':
          comparison = (MEMBER_TYPE_ORDER[a.memberType] ?? 9) - (MEMBER_TYPE_ORDER[b.memberType] ?? 9);
          break;
        case 'status': {
          const statusOrder: Record<string, number> = { UNPAID: 0, PAID: 1, WITHDRAW: 2 };
          comparison = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
          break;
        }
        case 'confirmedDate':
          comparison = (a.confirmedDate || '').localeCompare(b.confirmedDate || '');
          break;
        case 'note':
          comparison = (a.note || '').localeCompare(b.note || '', 'ja');
          break;
      }
      return comparison * dir;
    });
    return sorted;
  }, [filteredRecords, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [memberTypeFilter, pageSize, query, selectedYear, sortDir, sortKey, statusFilter]);

  useEffect(() => {
    setFailedKeys(null);
  }, [memberTypeFilter, query, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedRecords]);

  const visibleStart = sortedRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(currentPage * pageSize, sortedRecords.length);

  const allDirtyRecords = useMemo(() => {
    return data.records.filter((record) => {
      const key = buildRowKey(record);
      const draft = editableRows[key];
      return (draft && isDirty(record, draft)) || rawDateTexts[key] !== undefined;
    });
  }, [data.records, editableRows, rawDateTexts]);

  const hasUnsavedChanges = allDirtyRecords.length > 0;

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => () => {
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateDraft = (record: AnnualFeeAdminRecord, patch: Partial<EditableRow>) => {
    const key = buildRowKey(record);
    setEditableRows((prev) => ({
      ...prev,
      [key]: {
        id: record.id,
        status: record.status,
        confirmedDate: record.confirmedDate || '',
        note: record.note || '',
        ...prev[key],
        ...patch,
      },
    }));
  };

  const handleBatchSave = async () => {
    const targets = allDirtyRecords;
    if (targets.length === 0) return;

    const validPayloads: Array<{
      id?: string;
      memberId: string;
      year: number;
      status: 'PAID' | 'UNPAID' | 'WITHDRAW';
      confirmedDate: string;
      note: string;
    }> = [];
    const invalidKeys = new Set<string>();
    const nextDateErrors: Record<string, string> = {};
    const withdrawTargets: AnnualFeeAdminRecord[] = [];

    for (const record of targets) {
      const key = buildRowKey(record);
      const draft = editableRows[key] || {
        id: record.id,
        status: record.status,
        confirmedDate: record.confirmedDate || '',
        note: record.note || '',
      };

      let finalDate = draft.confirmedDate;
      const raw = rawDateTexts[key];
      if (raw !== undefined) {
        const trimmed = raw.trim();
        if (!trimmed) {
          finalDate = '';
        } else {
          const parsed = parseSlashDate(raw);
          if (parsed === null) {
            invalidKeys.add(key);
            nextDateErrors[key] = '入金日は YYYY/MM/DD 形式で入力してください。';
            continue;
          }
          finalDate = parsed;
        }
      }

      if (draft.status === PaymentStatus.PAID && !finalDate) {
        invalidKeys.add(key);
        nextDateErrors[key] = '納入済みにする場合は入金日を入力してください。';
        continue;
      }

      if (draft.status === WITHDRAW_ACTION) {
        withdrawTargets.push(record);
      }

      validPayloads.push({
        id: record.exists ? draft.id || undefined : undefined,
        memberId: record.memberId,
        year: record.year,
        status: draft.status,
        confirmedDate: draft.status === PaymentStatus.PAID ? finalDate : '',
        note: draft.note,
      });
    }

    if (Object.keys(nextDateErrors).length > 0) {
      setDateErrors((prev) => ({ ...prev, ...nextDateErrors }));
    }

    if (validPayloads.length === 0) {
      setSuccess(null);
      setError(`${invalidKeys.size}件すべてに入力エラーがあります。修正後に保存してください。`);
      setFailedKeys(invalidKeys);
      return;
    }

    if (withdrawTargets.length > 0) {
      const previewNames = withdrawTargets.slice(0, 5).map((record) => `- ${record.displayName} (${record.memberId})`).join('\n');
      const moreLabel = withdrawTargets.length > 5 ? `\n- 他 ${withdrawTargets.length - 5} 件` : '';
      const confirmed = window.confirm(
        `以下 ${withdrawTargets.length} 件を前年度末退会として処理します。\n` +
        `対象年度 ${selectedYear} の年会費対象外になり、前年度末日が退会日に設定されます。\n\n` +
        `${previewNames}${moreLabel}\n\n続行しますか？`,
      );
      if (!confirmed) return;
    }

    setBatchSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.saveAnnualFeeRecordsBatch(validPayloads);
      await load(selectedYear);
      if (onChanged) {
        void Promise.resolve(onChanged()).catch((refreshError) => {
          console.error('Failed to refresh dashboard data after annual fee batch save:', refreshError);
        });
      }
      const withdrawCount = result.withdrawnMemberIds.length;
      const savedCount = result.savedRecords.length;
      if (invalidKeys.size > 0) {
        setSuccess(
          withdrawCount > 0
            ? `${savedCount}件を保存し、${withdrawCount}件を前年度末退会として処理しました。`
            : `${savedCount}件を保存しました。`,
        );
        setError(`${invalidKeys.size}件は入力エラーのため未保存です。`);
        setFailedKeys(invalidKeys);
      } else {
        setSuccess(
          withdrawCount > 0
            ? `${savedCount}件を保存し、${withdrawCount}件を前年度末退会として処理しました。`
            : `${savedCount}件の変更を保存しました。`,
        );
        setFailedKeys(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '変更の保存に失敗しました。');
    } finally {
      setBatchSaving(false);
    }
  };

  const requestYearChange = (nextYear: number) => {
    if (nextYear === selectedYear) return;
    if (hasUnsavedChanges) {
      setPendingYearChange(nextYear);
      return;
    }
    void load(nextYear);
  };

  const cancelPendingYearChange = () => {
    setPendingYearChange(null);
  };

  const confirmPendingYearChange = () => {
    if (pendingYearChange === null) return;
    const nextYear = pendingYearChange;
    setPendingYearChange(null);
    void load(nextYear);
  };

  const setPage = (page: number) => setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  const isBusy = batchSaving;
  const summary = normalizeSummary(data.summary);
  const thClass = 'px-3 py-2 text-left text-xs font-medium text-slate-500 select-none cursor-pointer hover:text-slate-800 transition-colors';

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">年会費管理コンソール</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            対象年度の支払対象会員を一覧表示します。退会年月日が前年度末以前の会員は対象外です。
            レコード未作成の会員も「未納」として扱い、保存時に当該年度のレコードを新規作成します。
            「前年度末退会」は年会費状態として保存せず、会員側に退会処理を行います。
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
          </div>
        )}
        {success && (
          <div role="status" aria-live="polite" className="flex items-center justify-between text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-4 py-3">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 text-lg leading-none">&times;</button>
          </div>
        )}
        {failedKeys && (
          <div className="flex items-center justify-between text-amber-800 bg-amber-50 border border-amber-300 rounded px-4 py-3">
            <span>入力エラーのあるレコード {failedKeys.size} 件を絞り込んで表示しています。</span>
            <button
              type="button"
              onClick={() => {
                setFailedKeys(null);
                setError(null);
              }}
              className="px-3 py-1.5 rounded text-sm font-medium bg-amber-200 hover:bg-amber-300 text-amber-900 transition-colors whitespace-nowrap"
            >
              全件表示に戻す
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">対象年度</label>
              <select
                className="border border-slate-300 rounded px-3 py-2 bg-white"
                value={selectedYear}
                onChange={(e) => requestYearChange(Number(e.target.value))}
              >
                {data.years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">納入状況</label>
              <select
                className="border border-slate-300 rounded px-3 py-2 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="ALL">すべて</option>
                <option value={PaymentStatus.PAID}>納入済み</option>
                <option value={PaymentStatus.UNPAID}>未納</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">会員種別</label>
              <select
                className="border border-slate-300 rounded px-3 py-2 bg-white"
                value={memberTypeFilter}
                onChange={(e) => setMemberTypeFilter(e.target.value as MemberTypeFilter)}
              >
                <option value="ALL">すべて</option>
                <option value={MemberType.INDIVIDUAL}>個人会員</option>
                <option value={MemberType.BUSINESS}>事業所会員</option>
                <option value={MemberType.SUPPORT}>賛助会員</option>
              </select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">会員検索</label>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="会員名・会員ID・会員種別で検索"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">表示件数</label>
              <select
                className="border border-slate-300 rounded px-3 py-2 bg-white"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}件</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">対象会員数</div>
              <div className="mt-1 text-xl font-semibold text-slate-800">{summary.eligibleCount} 件</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs text-emerald-700">納入済み</div>
              <div className="mt-1 text-xl font-semibold text-emerald-800">{summary.paidCount} 件</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs text-amber-700">未納</div>
              <div className="mt-1 text-xl font-semibold text-amber-800">{summary.unpaidCount} 件</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs text-emerald-700">納入済み会費合計</div>
              <div className="mt-1 text-xl font-semibold text-emerald-800">{formatCurrency(summary.paidAmount)}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs text-amber-700">未納会費合計</div>
              <div className="mt-1 text-xl font-semibold text-amber-800">{formatCurrency(summary.unpaidAmount)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {MEMBER_TYPES.map((memberType) => {
              const memberSummary = getSummaryByType(summary, memberType);
              return (
                <div key={memberType} className="rounded-lg border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${memberTypeBadge(memberType)}`}>
                      {toMemberTypeLabel(memberType)}
                    </span>
                    <span className="text-xs text-slate-500">対象 {memberSummary.eligibleCount} 件</span>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <dt>納入済み</dt>
                      <dd className="font-medium text-emerald-700">{memberSummary.paidCount} 件 / {formatCurrency(memberSummary.paidAmount)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>未納</dt>
                      <dd className="font-medium text-amber-700">{memberSummary.unpaidCount} 件 / {formatCurrency(memberSummary.unpaidAmount)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-500">
            上の集計は保存済みデータ基準です。未作成レコードは画面上では未納として扱います。
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">年会費一覧</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {sortedRecords.length === 0
                    ? '対象データはありません。'
                    : `${visibleStart} - ${visibleEnd} 件を表示 / 絞り込み結果 ${sortedRecords.length} 件`}
                </p>
              </div>
              {hasUnsavedChanges && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleBatchSave()}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {batchSaving ? '保存中...' : `変更を保存（${allDirtyRecords.length} 件）`}
                </button>
              )}
            </div>
            <Pagination current={currentPage} total={totalPages} onChange={setPage} />
          </div>

          {loading ? (
            <div className="text-slate-500 py-8 text-center">読み込み中です...</div>
          ) : sortedRecords.length === 0 ? (
            <div className="text-slate-500 py-8 text-center">条件に一致する会員はありません。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thClass} onClick={() => toggleSort('displayName')}>
                      会員<SortIndicator active={sortKey === 'displayName'} dir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => toggleSort('memberType')}>
                      種別<SortIndicator active={sortKey === 'memberType'} dir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => toggleSort('status')}>
                      年度処理<SortIndicator active={sortKey === 'status'} dir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => toggleSort('confirmedDate')}>
                      入金日<SortIndicator active={sortKey === 'confirmedDate'} dir={sortDir} />
                    </th>
                    <th className={thClass}>会費</th>
                    <th className={thClass} onClick={() => toggleSort('note')}>
                      備考<SortIndicator active={sortKey === 'note'} dir={sortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pagedRecords.map((record, index) => {
                    const key = buildRowKey(record);
                    const draft = editableRows[key] || {
                      id: record.id,
                      status: record.status,
                      confirmedDate: record.confirmedDate || '',
                      note: record.note || '',
                    };
                    const dirty = isDirty(record, draft) || rawDateTexts[key] !== undefined;
                    const stripe = index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white';
                    return (
                      <tr key={key} className={`${dirty ? 'bg-amber-50/50' : stripe} hover:bg-primary-50/40 transition-colors`}>
                        <td className="px-3 py-2.5 text-sm text-slate-900 align-top">
                          {onOpenMember ? (
                            <button
                              type="button"
                              className="text-left hover:text-primary-600 hover:underline transition-colors"
                              onClick={() => onOpenMember(record.memberId)}
                            >
                              <div className="font-medium">{record.displayName}</div>
                              <div className="text-xs text-slate-400 tabular-nums">{record.memberId}</div>
                            </button>
                          ) : (
                            <>
                              <div className="font-medium">{record.displayName}</div>
                              <div className="text-xs text-slate-400 tabular-nums">{record.memberId}</div>
                            </>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-sm align-top">
                          <span className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${memberTypeBadge(record.memberType)}`}>
                            {toMemberTypeLabel(record.memberType)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm align-top">
                          <select
                            className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white text-sm"
                            value={draft.status}
                            disabled={isBusy}
                            onChange={(e) => {
                              const newStatus = e.target.value as AnnualFeeDraftStatus;
                              if (newStatus === PaymentStatus.PAID) {
                                const todayIso = new Date().toISOString().slice(0, 10);
                                updateDraft(record, { status: newStatus, confirmedDate: todayIso });
                                setRawDateTexts((prev) => ({ ...prev, [key]: toSlashDate(todayIso) }));
                                setDateErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
                              } else {
                                updateDraft(record, { status: newStatus, confirmedDate: '' });
                                setRawDateTexts((prev) => { const next = { ...prev }; delete next[key]; return next; });
                                setDateErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
                              }
                            }}
                          >
                            <option value={PaymentStatus.UNPAID}>未納</option>
                            <option value={PaymentStatus.PAID}>納入済み</option>
                            <option value={WITHDRAW_ACTION}>前年度末退会</option>
                          </select>
                          {draft.status === WITHDRAW_ACTION && (
                            <p className="mt-1 text-xs text-rose-700">
                              保存時に会員を前年度末退会として処理し、この年度の年会費対象外にします。
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-sm align-top">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              className={`flex-1 min-w-0 border rounded px-2 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400 ${
                                dateErrors[key] ? 'border-red-400 bg-red-50' : 'border-slate-300'
                              }`}
                              value={rawDateTexts[key] !== undefined ? rawDateTexts[key] : toSlashDate(draft.confirmedDate)}
                              disabled={draft.status !== PaymentStatus.PAID || isBusy}
                              placeholder="YYYY/MM/DD"
                              onChange={(e) => {
                                const raw = e.target.value;
                                setRawDateTexts((prev) => ({ ...prev, [key]: raw }));
                                if (dateErrors[key]) {
                                  const parsed = parseSlashDate(raw);
                                  if (parsed !== null) {
                                    setDateErrors((prev) => {
                                      const next = { ...prev };
                                      delete next[key];
                                      return next;
                                    });
                                    updateDraft(record, { confirmedDate: parsed });
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const raw = e.target.value.trim();
                                if (!raw) {
                                  setDateErrors((prev) => {
                                    const next = { ...prev };
                                    delete next[key];
                                    return next;
                                  });
                                  updateDraft(record, { confirmedDate: '' });
                                  return;
                                }
                                const parsed = parseSlashDate(raw);
                                if (parsed === null) {
                                  setDateErrors((prev) => ({ ...prev, [key]: '入金日は YYYY/MM/DD 形式で入力してください。' }));
                                  return;
                                }
                                setDateErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                                updateDraft(record, { confirmedDate: parsed });
                                setRawDateTexts((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                              }}
                            />
                            <div className="relative inline-flex items-center">
                              <div
                                className="p-1.5 rounded border border-slate-300 bg-white text-slate-500 disabled:opacity-40"
                                style={draft.status !== PaymentStatus.PAID || isBusy ? { opacity: 0.4, cursor: 'default' } : undefined}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <input
                                type="date"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                style={draft.status !== PaymentStatus.PAID || isBusy ? { pointerEvents: 'none' } : undefined}
                                tabIndex={-1}
                                value={draft.confirmedDate}
                                title="カレンダーから選択"
                                onChange={(e) => {
                                  setDateErrors((prev) => {
                                    const next = { ...prev };
                                    delete next[key];
                                    return next;
                                  });
                                  setRawDateTexts((prev) => {
                                    const next = { ...prev };
                                    delete next[key];
                                    return next;
                                  });
                                  updateDraft(record, { confirmedDate: e.target.value });
                                }}
                              />
                            </div>
                          </div>
                          {dateErrors[key] && <p className="text-xs text-red-500 mt-0.5">{dateErrors[key]}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-slate-700 align-top tabular-nums">{formatCurrency(record.amount)}</td>
                        <td className="px-3 py-2.5 text-sm align-top">
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                            value={draft.note}
                            disabled={isBusy}
                            onChange={(e) => updateDraft(record, { note: e.target.value })}
                            placeholder="確認メモ"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && sortedRecords.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                  並べ替えやページ移動では入力内容を保持します。画面遷移や年度変更の前に保存してください。
                </p>
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleBatchSave()}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {batchSaving ? '保存中...' : `変更を保存（${allDirtyRecords.length} 件）`}
                  </button>
                )}
              </div>
              <Pagination current={currentPage} total={totalPages} onChange={setPage} />
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">操作履歴</h3>
            <span className="text-sm text-slate-500">{data.auditLogs.length} 件</span>
          </div>
          {data.auditLogs.length === 0 ? (
            <div className="text-slate-500 py-4 text-center">操作履歴はまだありません。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">実行日時</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">種別</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">会員</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">年度</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">実行者</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.auditLogs.map((log, index) => (
                    <tr key={log.id} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="px-3 py-2 text-sm text-slate-700 tabular-nums">{formatDateTimeDisplay(log.executedAt)}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`inline-block text-xs font-medium rounded px-1.5 py-0.5 ${
                          log.action === 'CREATE'
                            ? 'bg-primary-50 text-primary-700'
                            : log.action === 'WITHDRAW'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                       }`}>
                          {log.action === 'CREATE' ? '新規' : log.action === 'WITHDRAW' ? '退会処理' : '更新'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-900">
                        <div className="font-medium">{log.displayName}</div>
                        <div className="text-xs text-slate-400">{log.memberId}</div>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700 tabular-nums">{log.year}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{log.actorDisplayName || log.actorEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <dialog
        ref={yearChangeDialogRef}
        aria-labelledby="year-change-dialog-title"
        onClose={() => {
          if (pendingYearChange !== null && yearChangeDialogRef.current?.returnValue !== 'confirm') {
            setPendingYearChange(null);
          }
        }}
        className="w-full max-w-md rounded-2xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-900/30"
      >
        <div className="p-6 space-y-4">
          <div>
            <h3 id="year-change-dialog-title" className="text-lg font-bold text-slate-800">未保存の変更があります</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              保存していない変更が {allDirtyRecords.length} 件あります。このまま年度を切り替えると破棄されます。
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelPendingYearChange}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={confirmPendingYearChange}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
            >
              破棄して切替
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default AnnualFeeManagement;
