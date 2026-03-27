import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { AnnualFeeAdminData, AnnualFeeAdminRecord, MemberType, PaymentStatus } from '../types';

interface Props {
  onChanged?: () => Promise<void> | void;
}

type StatusFilter = 'ALL' | PaymentStatus;
type MemberTypeFilter = 'ALL' | MemberType;

type EditableRow = {
  id: string;
  status: PaymentStatus;
  confirmedDate: string;
  note: string;
};

type SortKey = 'displayName' | 'memberType' | 'status' | 'confirmedDate' | 'note';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const CURRENT_YEAR = new Date().getFullYear();
const MESSAGE_AUTO_CLEAR_MS = 4000;

/** YYYY-MM-DD → YYYY/MM/DD 表示変換 */
const toSlashDate = (isoDate: string): string => {
  if (!isoDate) return '';
  return isoDate.replace(/-/g, '/');
};

/** YYYY/M/D or YYYY/MM/DD → YYYY-MM-DD 内部変換。不正値は null */
const parseSlashDate = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const [, ys, ms, ds] = match;
  const y = Number(ys), m = Number(ms), d = Number(ds);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${ys}-${mm}-${dd}`;
};

const createEmptyData = (): AnnualFeeAdminData => ({
  selectedYear: CURRENT_YEAR,
  records: [],
  years: [],
  auditLogs: [],
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

const buildRowKey = (record: Pick<AnnualFeeAdminRecord, 'memberId' | 'year'>): string =>
  `${record.memberId}:${record.year}`;

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

const isDirty = (record: AnnualFeeAdminRecord, draft: EditableRow): boolean => {
  if (draft.status !== record.status) return true;
  if ((draft.confirmedDate || '') !== (record.confirmedDate || '')) return true;
  if ((draft.note || '') !== (record.note || '')) return true;
  return false;
};

const MEMBER_TYPE_ORDER: Record<string, number> = {
  [MemberType.INDIVIDUAL]: 0,
  [MemberType.BUSINESS]: 1,
  [MemberType.SUPPORT]: 2,
};

/* ── ソートインジケータ ── */
const SortIndicator: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => (
  <span className={`ml-1 inline-block text-[10px] ${active ? 'text-slate-800' : 'text-slate-300'}`}>
    {!active ? '⇅' : dir === 'asc' ? '▲' : '▼'}
  </span>
);

/* ── ページネーション ── */
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
      title="先頭ページ"
    >
      «
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
      title="末尾ページ"
    >
      »
    </button>
  </div>
);

const AnnualFeeManagement: React.FC<Props> = ({ onChanged }) => {
  const [data, setData] = useState<AnnualFeeAdminData>(createEmptyData);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [memberTypeFilter, setMemberTypeFilter] = useState<MemberTypeFilter>('ALL');
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [editableRows, setEditableRows] = useState<Record<string, EditableRow>>({});
  const [sortKey, setSortKey] = useState<SortKey>('displayName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
  const [rawDateTexts, setRawDateTexts] = useState<Record<string, string>>({});
  const [failedKeys, setFailedKeys] = useState<Set<string> | null>(null);

  /* ── メッセージ自動消去 ── */
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), MESSAGE_AUTO_CLEAR_MS);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    if (failedKeys) return;
    const t = setTimeout(() => setError(null), MESSAGE_AUTO_CLEAR_MS * 2);
    return () => clearTimeout(t);
  }, [error, failedKeys]);

  const load = useCallback(async (year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.getAnnualFeeAdminData(year);
      setData(next);
      setSelectedYear(next.selectedYear);
      setEditableRows(buildEditableRows(next.records));
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

  /* ── 楽観更新: レスポンスで data.records をローカル更新 ── */
  const applyOptimisticUpdate = useCallback((saved: AnnualFeeAdminRecord | AnnualFeeAdminRecord[]) => {
    const savedArr = Array.isArray(saved) ? saved : [saved];
    const savedMap = new Map(savedArr.map((r) => [buildRowKey(r), r]));
    setData((prev) => {
      const nextRecords = prev.records.map((r) => {
        const updated = savedMap.get(buildRowKey(r));
        return updated || r;
      });
      return { ...prev, records: nextRecords };
    });
    setEditableRows((prev) => {
      const next = { ...prev };
      savedArr.forEach((r) => {
        const key = buildRowKey(r);
        next[key] = {
          id: r.id,
          status: r.status,
          confirmedDate: r.confirmedDate || '',
          note: r.note || '',
        };
      });
      return next;
    });
    setRawDateTexts((prev) => {
      const next = { ...prev };
      savedArr.forEach((r) => { delete next[buildRowKey(r)]; });
      return next;
    });
    setDateErrors((prev) => {
      const next = { ...prev };
      savedArr.forEach((r) => { delete next[buildRowKey(r)]; });
      return next;
    });
  }, []);

  /* ── ソート ── */
  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
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
  }, [data.records, statusFilter, memberTypeFilter, query, failedKeys]);

  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    const dir = sortDir === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'displayName':
          cmp = a.displayName.localeCompare(b.displayName, 'ja');
          break;
        case 'memberType':
          cmp = (MEMBER_TYPE_ORDER[a.memberType] ?? 9) - (MEMBER_TYPE_ORDER[b.memberType] ?? 9);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'confirmedDate':
          cmp = (a.confirmedDate || '').localeCompare(b.confirmedDate || '');
          break;
        case 'note':
          cmp = (a.note || '').localeCompare(b.note || '', 'ja');
          break;
      }
      return cmp * dir;
    });
    return sorted;
  }, [filteredRecords, sortKey, sortDir]);

  const filteredSummary = useMemo(() => ({
    total: filteredRecords.length,
    paid: filteredRecords.filter((r) => r.status === PaymentStatus.PAID).length,
    unpaid: filteredRecords.filter((r) => r.status === PaymentStatus.UNPAID).length,
    draft: filteredRecords.filter((r) => !r.exists).length,
  }), [filteredRecords]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, statusFilter, memberTypeFilter, query, pageSize, sortKey, sortDir]);

  useEffect(() => {
    setFailedKeys(null);
  }, [statusFilter, memberTypeFilter, query]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [currentPage, sortedRecords, pageSize]);

  const visibleStart = sortedRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(currentPage * pageSize, sortedRecords.length);

  /* ── 全体で変更があるレコードの一覧 ── */
  const allDirtyRecords = useMemo(() => {
    return data.records.filter((record) => {
      const key = buildRowKey(record);
      const draft = editableRows[key];
      return (draft && isDirty(record, draft)) || rawDateTexts[key] !== undefined;
    });
  }, [data.records, editableRows, rawDateTexts]);

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

  /* ── 個別保存（楽観更新で高速化） ── */
  const handleSave = async (record: AnnualFeeAdminRecord) => {
    const key = buildRowKey(record);
    const draft = editableRows[key] || {
      id: record.id,
      status: record.status,
      confirmedDate: record.confirmedDate || '',
      note: record.note || '',
    };

    // Resolve confirmedDate from raw text if user typed something
    let finalDate = draft.confirmedDate;
    const raw = rawDateTexts[key];
    if (raw !== undefined) {
      const trimmed = raw.trim();
      if (!trimmed) {
        finalDate = '';
      } else {
        const parsed = parseSlashDate(raw);
        if (parsed === null) {
          setDateErrors((prev) => ({ ...prev, [key]: '日付は YYYY/MM/DD 形式で入力してください' }));
          setError(`${record.displayName}: 日付は YYYY/MM/DD 形式で入力してください`);
          setSuccess(null);
          return;
        }
        finalDate = parsed;
      }
    }

    if (draft.status === PaymentStatus.PAID && !finalDate) {
      setError(`${record.displayName}: 納入済にする場合は納入確認日を入力してください。`);
      setSuccess(null);
      return;
    }

    setSavingKey(key);
    setError(null);
    setSuccess(null);
    try {
      const saved = await api.saveAnnualFeeRecord({
        id: record.exists ? draft.id || undefined : undefined,
        memberId: record.memberId,
        year: record.year,
        status: draft.status,
        confirmedDate: draft.status === PaymentStatus.PAID ? finalDate : '',
        note: draft.note,
      });
      applyOptimisticUpdate(saved);
      if (onChanged) {
        void Promise.resolve(onChanged()).catch((err) => {
          console.error('Failed to refresh dashboard data after annual fee save:', err);
        });
      }
      setSuccess(`${record.displayName} の年会費情報を保存しました。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '年会費レコードの保存に失敗しました。');
    } finally {
      setSavingKey(null);
    }
  };

  /* ── 一括保存（Partial Success: 正常分のみ保存、エラー分はスキップ） ── */
  const handleBatchSave = async () => {
    const targets = allDirtyRecords;
    if (targets.length === 0) return;

    // Validate all targets — separate valid/invalid
    const validPayloads: Array<{
      id?: string;
      memberId: string;
      year: number;
      status: 'PAID' | 'UNPAID';
      confirmedDate: string;
      note: string;
    }> = [];
    const newInvalidKeys = new Set<string>();
    const newDateErrors: Record<string, string> = {};

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
            newInvalidKeys.add(key);
            newDateErrors[key] = '日付は YYYY/MM/DD 形式で入力してください';
            continue;
          }
          finalDate = parsed;
        }
      }

      if (draft.status === PaymentStatus.PAID && !finalDate) {
        newInvalidKeys.add(key);
        newDateErrors[key] = '納入済にする場合は納入確認日を入力してください';
        continue;
      }

      validPayloads.push({
        id: record.exists ? draft.id || undefined : undefined,
        memberId: record.memberId,
        year: record.year,
        status: draft.status as 'PAID' | 'UNPAID',
        confirmedDate: draft.status === PaymentStatus.PAID ? finalDate : '',
        note: draft.note,
      });
    }

    if (Object.keys(newDateErrors).length > 0) {
      setDateErrors((prev) => ({ ...prev, ...newDateErrors }));
    }

    if (validPayloads.length === 0) {
      setError(`${newInvalidKeys.size} 件すべてにエラーがあります。修正してから保存してください。`);
      setSuccess(null);
      setFailedKeys(newInvalidKeys);
      return;
    }

    setBatchSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const savedRecords = await api.saveAnnualFeeRecordsBatch(validPayloads);
      applyOptimisticUpdate(savedRecords);
      if (onChanged) {
        void Promise.resolve(onChanged()).catch((err) => {
          console.error('Failed to refresh dashboard data after batch save:', err);
        });
      }
      if (newInvalidKeys.size > 0) {
        setSuccess(`${savedRecords.length} 件を保存しました。`);
        setError(`${newInvalidKeys.size} 件はエラーのため保存できませんでした。`);
        setFailedKeys(newInvalidKeys);
      } else {
        setSuccess(`${savedRecords.length} 件の年会費情報を一括保存しました。`);
        setFailedKeys(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '一括保存に失敗しました。');
    } finally {
      setBatchSaving(false);
    }
  };

  const setPage = (p: number) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  const isBusy = savingKey !== null || batchSaving;

  const thClass = 'px-3 py-2 text-left text-xs font-medium text-slate-500 select-none cursor-pointer hover:text-slate-800 transition-colors';

  return (
    <div className="space-y-6">
      {/* ── ヘッダー ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">年会費管理コンソール</h2>
        <p className="text-slate-600 mt-2 leading-relaxed">
          対象年度の全会員を一覧表示し、各行で納入状況を直接更新します。列ヘッダーをクリックすると並び替えできます。
        </p>
      </div>

      {/* ── メッセージ ── */}
      {error && (
        <div className="flex items-center justify-between text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}
      {success && (
        <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-4 py-3">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 text-lg leading-none">&times;</button>
        </div>
      )}
      {failedKeys && (
        <div className="flex items-center justify-between text-amber-800 bg-amber-50 border border-amber-300 rounded px-4 py-3">
          <span>保存できなかったレコード（{failedKeys.size} 件）を表示しています。</span>
          <button
            type="button"
            onClick={() => { setFailedKeys(null); setError(null); }}
            className="px-3 py-1.5 rounded text-sm font-medium bg-amber-200 hover:bg-amber-300 text-amber-900 transition-colors whitespace-nowrap"
          >
            全件表示に戻す
          </button>
        </div>
      )}

      {/* ── フィルター・サマリー ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">対象年度</label>
            <select
              className="border border-slate-300 rounded px-3 py-2 bg-white"
              value={selectedYear}
              onChange={(e) => {
                const nextYear = Number(e.target.value);
                setSelectedYear(nextYear);
                void load(nextYear);
              }}
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
              <option value="ALL">全件</option>
              <option value={PaymentStatus.PAID}>納入済</option>
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
              <option value="ALL">全種別</option>
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
              placeholder="会員番号・氏名・事業所名"
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
                <option key={size} value={size}>{size} 件</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">抽出結果</div>
            <div className="mt-1 text-xl font-semibold text-slate-800">{filteredSummary.total} 件</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="text-xs text-emerald-700">納入済</div>
            <div className="mt-1 text-xl font-semibold text-emerald-800">{filteredSummary.paid} 件</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="text-xs text-amber-700">未納</div>
            <div className="mt-1 text-xl font-semibold text-amber-800">{filteredSummary.unpaid} 件</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">未作成</div>
            <div className="mt-1 text-xl font-semibold text-slate-600">{filteredSummary.draft} 件</div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          レコード未作成の会員も一覧に含まれます。行を保存すると、その年度の年会費レコードを新規作成します。
        </p>
      </div>

      {/* ── 年会費一覧テーブル ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">年会費一覧</h3>
              <p className="text-sm text-slate-500 mt-1">
                {sortedRecords.length === 0
                  ? '該当データなし'
                  : `${visibleStart} - ${visibleEnd} 件を表示 / 全 ${sortedRecords.length} 件`}
              </p>
            </div>
            {allDirtyRecords.length > 0 && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleBatchSave()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {batchSaving ? '一括保存中...' : `変更をまとめて保存（${allDirtyRecords.length} 件）`}
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
                    納入状況<SortIndicator active={sortKey === 'status'} dir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort('confirmedDate')}>
                    納入確認日<SortIndicator active={sortKey === 'confirmedDate'} dir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort('note')}>
                    備考<SortIndicator active={sortKey === 'note'} dir={sortDir} />
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagedRecords.map((record, idx) => {
                  const key = buildRowKey(record);
                  const draft = editableRows[key] || {
                    id: record.id,
                    status: record.status,
                    confirmedDate: record.confirmedDate || '',
                    note: record.note || '',
                  };
                  const isSaving = savingKey === key;
                  const dirty = isDirty(record, draft) || rawDateTexts[key] !== undefined;
                  const stripe = idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white';
                  return (
                    <tr key={key} className={`${stripe} hover:bg-primary-50/40 transition-colors`}>
                      <td className="px-3 py-2.5 text-sm text-slate-900 align-top">
                        <div className="font-medium">{record.displayName}</div>
                        <div className="text-xs text-slate-400 tabular-nums">{record.memberId}</div>
                        {!record.exists && (
                          <span className="inline-block mt-0.5 text-[10px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">未作成</span>
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
                            const newStatus = e.target.value as PaymentStatus;
                            updateDraft(record, {
                              status: newStatus,
                              confirmedDate: newStatus === PaymentStatus.UNPAID ? '' : draft.confirmedDate,
                            });
                            if (newStatus === PaymentStatus.UNPAID) {
                              setRawDateTexts((prev) => { const next = { ...prev }; delete next[key]; return next; });
                              setDateErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
                            }
                          }}
                        >
                          <option value={PaymentStatus.UNPAID}>未納</option>
                          <option value={PaymentStatus.PAID}>納入済</option>
                        </select>
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
                              // Reward Early: エラー表示中なら修正を即座に検知して解除
                              if (dateErrors[key]) {
                                const parsed = parseSlashDate(raw);
                                if (parsed !== null) {
                                  setDateErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
                                  updateDraft(record, { confirmedDate: parsed });
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const raw = e.target.value.trim();
                              if (!raw) {
                                setDateErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
                                updateDraft(record, { confirmedDate: '' });
                                return;
                              }
                              const parsed = parseSlashDate(raw);
                              if (parsed === null) {
                                // Punish Late: フォーカスを離れた時のみエラー表示
                                setDateErrors((prev) => ({ ...prev, [key]: '日付は YYYY/MM/DD 形式で入力してください' }));
                              } else {
                                setDateErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
                                updateDraft(record, { confirmedDate: parsed });
                                setRawDateTexts((prev) => { const next = { ...prev }; delete next[key]; return next; });
                              }
                            }}
                          />
                          <div className="relative inline-flex items-center">
                            <div className="p-1.5 rounded border border-slate-300 bg-white text-slate-500 disabled:opacity-40"
                              style={draft.status !== PaymentStatus.PAID || isBusy ? { opacity: 0.4, cursor: 'default' } : {}}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <input
                              type="date"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              style={draft.status !== PaymentStatus.PAID || isBusy ? { pointerEvents: 'none' } : {}}
                              tabIndex={-1}
                              value={draft.confirmedDate}
                              title="カレンダーから選択"
                              onChange={(e) => {
                                setDateErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
                                setRawDateTexts((prev) => { const next = { ...prev }; delete next[key]; return next; });
                                updateDraft(record, { confirmedDate: e.target.value });
                              }}
                            />
                          </div>
                        </div>
                        {dateErrors[key] && (
                          <p className="text-xs text-red-500 mt-0.5">{dateErrors[key]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm align-top">
                        <input
                          type="text"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                          value={draft.note}
                          disabled={isBusy}
                          onChange={(e) => updateDraft(record, { note: e.target.value })}
                          placeholder="管理メモ"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-sm align-top text-center">
                        <button
                          type="button"
                          disabled={isBusy || !dirty}
                          onClick={() => void handleSave(record)}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            dirty
                              ? 'bg-slate-800 text-white hover:bg-slate-700'
                              : 'bg-slate-200 text-slate-400 cursor-default'
                          } disabled:opacity-50`}
                        >
                          {isSaving ? '...' : '保存'}
                        </button>
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
                ページ移動で入力内容は保持されます。
              </p>
              {allDirtyRecords.length > 0 && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleBatchSave()}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {batchSaving ? '保存中...' : `まとめて保存（${allDirtyRecords.length} 件）`}
                </button>
              )}
            </div>
            <Pagination current={currentPage} total={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {/* ── 更新履歴 ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">直近の更新履歴</h3>
          <span className="text-sm text-slate-500">{data.auditLogs.length} 件</span>
        </div>
        {data.auditLogs.length === 0 ? (
          <div className="text-slate-500 py-4 text-center">更新履歴はまだありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">実行日時</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">操作</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">会員</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">年度</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">実行者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.auditLogs.map((log, idx) => (
                  <tr key={log.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="px-3 py-2 text-sm text-slate-700 tabular-nums">{formatDateTimeDisplay(log.executedAt)}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`inline-block text-xs font-medium rounded px-1.5 py-0.5 ${
                        log.action === 'CREATE' ? 'bg-primary-50 text-primary-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {log.action === 'CREATE' ? '新規' : '更新'}
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
  );
};

export default AnnualFeeManagement;
