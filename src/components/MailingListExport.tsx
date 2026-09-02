import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../services/api';
import {
  MailingListFilterType,
  MailingListExcelResult,
  MailingListTarget,
  MailingListTargetsResult,
} from '../shared/types';
import { matchesSearchQuery } from '../utils/search';

interface MailingListExportProps {
  api: ApiClient;
}

const MEMBER_TYPE_LABELS: Record<string, string> = {
  BUSINESS: '事業所会員',
  INDIVIDUAL: '個人会員',
  SUPPORT: '賛助会員',
};

const MEMBER_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: '在籍中', cls: 'bg-emerald-50 text-emerald-700' },
  WITHDRAWAL_SCHEDULED: { label: '退会予定', cls: 'bg-amber-50 text-amber-700' },
  WITHDRAWN: { label: '年度内退会', cls: 'bg-slate-100 text-slate-600' },
};

const FEE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PAID:   { label: '納入済み', cls: 'bg-emerald-50 text-emerald-700' },
  UNPAID: { label: '未納',    cls: 'bg-rose-50   text-rose-700'    },
};

const MAILING_DESTINATION_LABELS: Record<string, string> = {
  HOME: '自宅',
  OFFICE: '事業所',
};

const calcCurrentFiscalYear = (): number => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

const badgeClass = (base: string) =>
  `inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${base}`;

const selectCls =
  'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

type FeeCondition = { year: number | ''; status: 'PAID' | 'UNPAID' | '' };

interface ColumnFilters {
  memberType: string;
  memberStatus: string;
  mailingDest: string;
  addressValidity: string;
}

const INITIAL_COLUMN_FILTERS: ColumnFilters = {
  memberType: '',
  memberStatus: '',
  mailingDest: '',
  addressValidity: '',
};

const XIcon: React.FC<{ className?: string }> = ({ className = 'h-3 w-3' }) => (
  <svg className={className} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M6 4.586 9.293 1.293a1 1 0 1 1 1.414 1.414L7.414 6l3.293 3.293a1 1 0 0 1-1.414 1.414L6 7.414l-3.293 3.293a1 1 0 0 1-1.414-1.414L4.586 6 1.293 2.707A1 1 0 0 1 2.707 1.293L6 4.586z" />
  </svg>
);

const MailingListExport: React.FC<MailingListExportProps> = ({ api }) => {
  const currentFiscalYear = useMemo(calcCurrentFiscalYear, []);
  const [filterType, setFilterType] = useState<MailingListFilterType>('KOHOUSHI');
  const [year, setYear] = useState(currentFiscalYear);
  const [keyword, setKeyword] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(INITIAL_COLUMN_FILTERS);
  const [feeConditions, setFeeConditions] = useState<FeeCondition[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targetsError, setTargetsError] = useState<string | null>(null);
  const [targetsData, setTargetsData] = useState<MailingListTargetsResult | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MailingListExcelResult | null>(null);

  const filterOptions: { value: MailingListFilterType; label: string; description: string }[] = [
    {
      value: 'KOHOUSHI',
      label: '広報誌発送',
      description: '選択年度に会員だった全会員（年度内退会を含む）が対象です。',
    },
    {
      value: 'KOHOUSHI_ONLY',
      label: '広報誌のみ発送',
      description: '広報誌発送のうち、お知らせ発送対象ではない個人・賛助会員が対象です。',
    },
    {
      value: 'OSHIRASE',
      label: 'お知らせ発送',
      description: '事業所会員の全員 + 個人・賛助会員のうち発送方法が「郵送」の方が対象です。',
    },
  ];

  const loadTargets = useCallback(async () => {
    setLoadingTargets(true);
    setTargetsError(null);
    setResult(null);
    setError(null);
    setKeyword('');
    setColumnFilters(INITIAL_COLUMN_FILTERS);
    try {
      const data = await api.getMailingListTargets({ filterType, year });
      setTargetsData(data);
      setYear(data.selectedYear);
      setFeeConditions([{ year: data.selectedYear, status: '' }]);
      setSelectedKeys(new Set());
    } catch (e: any) {
      setTargetsData(null);
      setSelectedKeys(new Set());
      setTargetsError(e?.message || '発送対象の読み込みに失敗しました。');
    } finally {
      setLoadingTargets(false);
    }
  }, [api, filterType, year]);

  useEffect(() => {
    void loadTargets();
  }, [loadTargets]);

  const targets = targetsData?.targets || [];

  // 郵送先「未設定」選択肢を動的表示するための判定
  const hasEmptyMailingDest = useMemo(
    () => targets.some((t) => !t.mailingDestination),
    [targets],
  );

  // キーワード + 年会費年度別条件（AND）+ 列フィルターを AND で適用
  const filteredTargets = useMemo(() => {
    const { memberType, memberStatus, mailingDest, addressValidity } = columnFilters;
    const activeFeeConditions = feeConditions.filter((c) => c.year !== '' && c.status !== '');

    return targets.filter((target) => {
      if (keyword.trim()) {
        if (!matchesSearchQuery(keyword, [
          target.displayName,
          target.kana || '', // v362: フリガナ検索（ひらがな/全角カナ/半角カナ いずれもヒット）
          target.memberId,
          target.officeName,
          MEMBER_TYPE_LABELS[target.memberType] || target.memberType,
          MEMBER_STATUS_LABELS[target.memberStatus]?.label || target.memberStatus,
          FEE_STATUS_LABELS[target.annualFeeStatus]?.label || target.annualFeeStatus,
        ])) return false;
      }
      // 年度別年会費 AND フィルター（レコードなしは UNPAID 扱い）
      for (const cond of activeFeeConditions) {
        const actual = (target.annualFeeHistories?.[cond.year as number]) ?? 'UNPAID';
        if (actual !== cond.status) return false;
      }
      if (memberType && target.memberType !== memberType) return false;
      if (memberStatus && target.memberStatus !== memberStatus) return false;
      if (mailingDest) {
        const dest = target.mailingDestination || '';
        if (mailingDest === '__EMPTY__' ? dest !== '' : dest !== mailingDest) return false;
      }
      if (addressValidity === 'VALID' && target.addressInvalidItems.length > 0) return false;
      if (addressValidity === 'INVALID' && target.addressInvalidItems.length === 0) return false;
      return true;
    });
  }, [keyword, targets, columnFilters, feeConditions]);

  // 表示中かつ選択済み — カウントバッジ用（Q1=B）
  const filteredSelectedTargets = useMemo(
    () => filteredTargets.filter((t) => selectedKeys.has(t.targetKey)),
    [filteredTargets, selectedKeys],
  );

  const selectedCount = selectedKeys.size;
  const filteredSelectedCount = filteredSelectedTargets.length;

  // カウントバッジは「表示中かつ選択済み」件数を反映（Q1=B）
  const selectedCounts = useMemo(() => {
    const counts = { business: 0, individual: 0, support: 0, invalid: 0 };
    filteredSelectedTargets.forEach((target) => {
      if (target.memberType === 'BUSINESS') counts.business += 1;
      if (target.memberType === 'INDIVIDUAL') counts.individual += 1;
      if (target.memberType === 'SUPPORT') counts.support += 1;
      if (target.addressInvalidItems.length > 0) counts.invalid += 1;
    });
    return counts;
  }, [filteredSelectedTargets]);

  // 全件選択 = 表示中（フィルター後）のみ選択（Q2=B / Best practice: Select All respects filters）
  const selectAll = () =>
    setSelectedKeys(new Set(filteredTargets.map((t) => t.targetKey)));
  const clearAll = () => setSelectedKeys(new Set());
  const selectFiltered = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      filteredTargets.forEach((t) => next.add(t.targetKey));
      return next;
    });
  };
  const clearFiltered = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      filteredTargets.forEach((t) => next.delete(t.targetKey));
      return next;
    });
  };

  const toggleOne = (targetKey: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(targetKey)) next.delete(targetKey);
      else next.add(targetKey);
      return next;
    });
  };

  const activeFeeConditionCount = feeConditions.filter((c) => c.year !== '' && c.status !== '').length;

  const isFiltered =
    !!keyword.trim() ||
    activeFeeConditionCount > 0 ||
    !!columnFilters.memberType ||
    !!columnFilters.memberStatus ||
    !!columnFilters.mailingDest ||
    !!columnFilters.addressValidity;

  const resetAllFilters = () => {
    setKeyword('');
    setColumnFilters(INITIAL_COLUMN_FILTERS);
    setFeeConditions([]);
  };

  // アクティブフィルターチップ（フィルター中のみ表示）
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (keyword.trim()) {
    activeChips.push({
      key: 'keyword',
      label: `検索: ${keyword.trim()}`,
      onRemove: () => setKeyword(''),
    });
  }
  feeConditions.forEach((cond, i) => {
    if (cond.year === '' || cond.status === '') return;
    const statusLabel = cond.status === 'PAID' ? '納入済み' : '未納';
    activeChips.push({
      key: `fee-${i}`,
      label: `年会費 ${cond.year}年度: ${statusLabel}`,
      onRemove: () => setFeeConditions((prev) => prev.filter((_, idx) => idx !== i)),
    });
  });
  if (columnFilters.memberType) {
    activeChips.push({
      key: 'memberType',
      label: `種別: ${MEMBER_TYPE_LABELS[columnFilters.memberType] ?? columnFilters.memberType}`,
      onRemove: () => setColumnFilters((f) => ({ ...f, memberType: '' })),
    });
  }
  if (columnFilters.memberStatus) {
    activeChips.push({
      key: 'memberStatus',
      label: `状態: ${MEMBER_STATUS_LABELS[columnFilters.memberStatus]?.label ?? columnFilters.memberStatus}`,
      onRemove: () => setColumnFilters((f) => ({ ...f, memberStatus: '' })),
    });
  }
  if (columnFilters.mailingDest) {
    const destLabel =
      columnFilters.mailingDest === '__EMPTY__'
        ? '未設定'
        : (MAILING_DESTINATION_LABELS[columnFilters.mailingDest] ?? columnFilters.mailingDest);
    activeChips.push({
      key: 'mailingDest',
      label: `郵送先: ${destLabel}`,
      onRemove: () => setColumnFilters((f) => ({ ...f, mailingDest: '' })),
    });
  }
  if (columnFilters.addressValidity) {
    activeChips.push({
      key: 'addressValidity',
      label: `住所: ${columnFilters.addressValidity === 'INVALID' ? '不備あり' : '不備なし'}`,
      onRemove: () => setColumnFilters((f) => ({ ...f, addressValidity: '' })),
    });
  }

  const handleExport = async () => {
    if (selectedCount === 0) {
      setError('出力対象を1件以上選択してください。');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.generateMailingListExcel({
        filterType,
        year,
        targetKeys: Array.from(selectedKeys),
      });
      setResult(res);

      const binary = atob(res.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || '出力中にエラーが発生しました。');
    } finally {
      setBusy(false);
    }
  };

  const renderStatusBadge = (target: MailingListTarget) => {
    const status = MEMBER_STATUS_LABELS[target.memberStatus] ?? {
      label: target.memberStatus || '-',
      cls: 'bg-slate-100 text-slate-600',
    };
    return <span className={badgeClass(status.cls)}>{status.label}</span>;
  };

  const renderFeeBadge = (target: MailingListTarget) => {
    const status = FEE_STATUS_LABELS[target.annualFeeStatus] ?? {
      label: target.annualFeeStatus || '-',
      cls: 'bg-slate-100 text-slate-600',
    };
    return <span className={badgeClass(status.cls)}>{status.label}</span>;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">宛名リスト出力コンソール</h2>
        <p className="mt-1 text-sm text-slate-500">
          会員の郵送先住所を Excel ファイル（.xlsx）で出力します。発送区分・年度・絞り込みで対象を確認し、出力する会員を選択できます。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">発送区分の選択</h3>
          <div className="space-y-3">
            {filterOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                  filterType === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="filterType"
                  value={opt.value}
                  checked={filterType === opt.value}
                  onChange={() => setFilterType(opt.value)}
                  className="mt-0.5 accent-primary-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">年度フィルタ</h3>
          <label className="block text-xs font-medium text-slate-600" htmlFor="mailing-list-year">
            年度
          </label>
          <select
            id="mailing-list-year"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {(targetsData?.years?.length ? targetsData.years : [currentFiscalYear]).map((fy) => (
              <option key={fy} value={fy}>
                {fy}年度
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadTargets()}
            disabled={loadingTargets}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingTargets ? '読み込み中...' : '対象を再読み込み'}
          </button>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="space-y-4 border-b border-slate-200 p-5">

          {/* ヘッダー：件数 + 選択ボタン */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">発送対象の選択</h3>
              <p className="mt-1 text-sm text-slate-500">
                全 {targets.length} 件中{' '}
                {isFiltered && filteredTargets.length !== targets.length ? (
                  <span className="font-semibold text-primary-700">{filteredTargets.length} 件表示</span>
                ) : (
                  <span>{filteredTargets.length} 件表示</span>
                )}
                。{filteredSelectedCount} 件選択中
                {selectedCount !== filteredSelectedCount && (
                  <span className="text-slate-400">（合計選択 {selectedCount} 件）</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                全件選択
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                全件解除
              </button>
              <button
                type="button"
                onClick={selectFiltered}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                表示中を選択
              </button>
              <button
                type="button"
                onClick={clearFiltered}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                表示中を解除
              </button>
            </div>
          </div>

          {/* キーワード検索 + カウントバッジ */}
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">キーワード検索</span>
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="氏名、フリガナ、会員番号、事業所名、種別、状態、年会費納入で検索"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs lg:min-w-[360px]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-slate-500">事業所</p>
                <p className="text-lg font-bold text-slate-800">{selectedCounts.business}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-slate-500">個人</p>
                <p className="text-lg font-bold text-slate-800">{selectedCounts.individual}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-slate-500">賛助</p>
                <p className="text-lg font-bold text-slate-800">{selectedCounts.support}</p>
              </div>
              <div
                className={`rounded-lg border p-2 ${
                  selectedCounts.invalid > 0
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="text-slate-500">住所不備</p>
                <p
                  className={`text-lg font-bold ${
                    selectedCounts.invalid > 0 ? 'text-amber-700' : 'text-slate-800'
                  }`}
                >
                  {selectedCounts.invalid}
                </p>
              </div>
            </div>
          </div>

          {/* 絞り込みフィルター */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-600">絞り込みフィルター</p>

            {/* 年会費納入（年度別条件ビルダー） */}
            <div>
              <p className="mb-1.5 text-xs text-slate-500">年会費納入（年度別）</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                {feeConditions.length === 0 && (
                  <p className="text-xs text-slate-400">条件なし（すべて表示）</p>
                )}
                {feeConditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={cond.year}
                      onChange={(e) =>
                        setFeeConditions((prev) =>
                          prev.map((c, idx) => idx === i ? { ...c, year: e.target.value === '' ? '' : Number(e.target.value) } : c)
                        )
                      }
                      className={selectCls}
                      aria-label={`年会費条件${i + 1} 年度`}
                    >
                      <option value="">年度を選択</option>
                      {(targetsData?.years ?? []).map((yr) => (
                        <option key={yr} value={yr}>{yr}年度</option>
                      ))}
                    </select>
                    <select
                      value={cond.status}
                      onChange={(e) =>
                        setFeeConditions((prev) =>
                          prev.map((c, idx) => idx === i ? { ...c, status: e.target.value as FeeCondition['status'] } : c)
                        )
                      }
                      className={selectCls}
                      aria-label={`年会費条件${i + 1} 状態`}
                    >
                      <option value="">状態を選択</option>
                      <option value="UNPAID">未納</option>
                      <option value="PAID">納入済み</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setFeeConditions((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label={`条件${i + 1}を削除`}
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setFeeConditions((prev) => [...prev, { year: '', status: '' }])}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium focus:outline-none focus:underline"
                  >
                    + 条件を追加
                  </button>
                  {feeConditions.filter((c) => c.year !== '' && c.status !== '').length > 1 && (
                    <span className="text-xs text-slate-400">※ 複数条件はすべて満たす行だけを抽出します</span>
                  )}
                </div>
              </div>
            </div>

            {/* 他の列フィルター */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

              <div>
                <label htmlFor="filter-member-type" className="mb-1 block text-xs text-slate-500">
                  種別
                </label>
                <select
                  id="filter-member-type"
                  value={columnFilters.memberType}
                  onChange={(e) =>
                    setColumnFilters((f) => ({ ...f, memberType: e.target.value }))
                  }
                  className={selectCls}
                >
                  <option value="">すべて</option>
                  <option value="BUSINESS">事業所会員</option>
                  <option value="INDIVIDUAL">個人会員</option>
                  <option value="SUPPORT">賛助会員</option>
                </select>
              </div>

              <div>
                <label htmlFor="filter-member-status" className="mb-1 block text-xs text-slate-500">
                  状態
                </label>
                <select
                  id="filter-member-status"
                  value={columnFilters.memberStatus}
                  onChange={(e) =>
                    setColumnFilters((f) => ({ ...f, memberStatus: e.target.value }))
                  }
                  className={selectCls}
                >
                  <option value="">すべて</option>
                  <option value="ACTIVE">在籍中</option>
                  <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
                  <option value="WITHDRAWN">年度内退会</option>
                </select>
              </div>

              <div>
                <label htmlFor="filter-mailing-dest" className="mb-1 block text-xs text-slate-500">
                  郵送先
                </label>
                <select
                  id="filter-mailing-dest"
                  value={columnFilters.mailingDest}
                  onChange={(e) =>
                    setColumnFilters((f) => ({ ...f, mailingDest: e.target.value }))
                  }
                  className={selectCls}
                >
                  <option value="">すべて</option>
                  <option value="OFFICE">事業所</option>
                  <option value="HOME">自宅</option>
                  {hasEmptyMailingDest && <option value="__EMPTY__">未設定</option>}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-address-validity"
                  className="mb-1 block text-xs text-slate-500"
                >
                  住所不備
                </label>
                <select
                  id="filter-address-validity"
                  value={columnFilters.addressValidity}
                  onChange={(e) =>
                    setColumnFilters((f) => ({ ...f, addressValidity: e.target.value }))
                  }
                  className={selectCls}
                >
                  <option value="">すべて</option>
                  <option value="INVALID">不備あり</option>
                  <option value="VALID">不備なし</option>
                </select>
              </div>
            </div>
          </div>
          {/* /絞り込みフィルター */}

          {/* アクティブフィルターチップ（フィルター適用中のみ表示） */}
          {isFiltered && (
            <div
              className="flex flex-wrap items-center gap-2"
              role="status"
              aria-label="適用中のフィルター"
            >
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-800"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`${chip.label}のフィルターを解除`}
                    className="rounded-full p-0.5 hover:bg-primary-200 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-slate-500 underline hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 rounded"
              >
                すべてリセット
              </button>
            </div>
          )}
        </div>

        {targetsError && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {targetsError}
          </div>
        )}

        {!targetsError && (
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <span className="sr-only">選択</span>
                  </th>
                  <th className="min-w-[220px] px-3 py-3">会員</th>
                  <th className="px-3 py-3">年会費納入</th>
                  <th className="px-3 py-3">種別</th>
                  <th className="px-3 py-3">状態</th>
                  <th className="px-3 py-3">郵送先</th>
                  <th className="px-3 py-3">住所</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loadingTargets && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      発送対象を読み込み中です。
                    </td>
                  </tr>
                )}
                {!loadingTargets && filteredTargets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      条件に一致する会員がありません。
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="ml-2 text-primary-600 underline hover:text-primary-700"
                        >
                          フィルターをリセット
                        </button>
                      )}
                    </td>
                  </tr>
                )}
                {!loadingTargets &&
                  filteredTargets.map((target) => {
                    const selected = selectedKeys.has(target.targetKey);
                    return (
                      <tr
                        key={target.targetKey}
                        className={selected ? 'bg-primary-50/40' : undefined}
                      >
                        <td className="px-4 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleOne(target.targetKey)}
                            aria-label={`${target.displayName} を出力対象にする`}
                            className="mt-1 h-4 w-4 rounded border-slate-300 accent-primary-600"
                          />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-slate-800">{target.displayName}</p>
                          <p className="text-xs text-slate-500">会員番号: {target.memberId}</p>
                          {target.officeName && target.memberType !== 'BUSINESS' && (
                            <p className="mt-0.5 text-xs text-slate-500">{target.officeName}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1">
                            {renderFeeBadge(target)}
                            <p className="text-xs text-slate-500">{target.annualFeeYear}年度</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-slate-700">
                          {MEMBER_TYPE_LABELS[target.memberType] || target.memberType}
                        </td>
                        <td className="px-3 py-3 align-top">{renderStatusBadge(target)}</td>
                        <td className="px-3 py-3 align-top text-slate-700">
                          {MAILING_DESTINATION_LABELS[target.mailingDestination] ||
                            target.mailingDestination ||
                            '-'}
                        </td>
                        <td className="px-3 py-3 align-top">
                          {target.addressInvalidItems.length > 0 ? (
                            <span className={badgeClass('bg-amber-50 text-amber-700')}>
                              不備: {target.addressInvalidItems.join('、')}
                            </span>
                          ) : (
                            <span className={badgeClass('bg-emerald-50 text-emerald-700')}>
                              出力可
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">出力内容について</p>
        <ul className="list-inside list-disc space-y-0.5 text-xs">
          <li>退会予定の会員は発送対象に含まれます。画面上では状態として確認できます。</li>
          <li>大阪府は住所欄に表示しません（他府県は表示します）。</li>
          <li>郵便番号・市区町村・番地のいずれかが未入力の場合は「住所不備」シートに分類されます。</li>
          <li>個人・賛助会員の郵送先は「郵送先区分」設定（事業所または自宅）に従います。</li>
        </ul>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">出力完了 — {result.filename}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700 md:grid-cols-4">
            <div className="rounded-lg border border-green-200 bg-white p-3">
              <p className="text-slate-500">事業所会員</p>
              <p className="text-xl font-bold text-slate-800">
                {result.counts.business}
                <span className="ml-1 text-sm font-normal">件</span>
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3">
              <p className="text-slate-500">個人会員</p>
              <p className="text-xl font-bold text-slate-800">
                {result.counts.individual}
                <span className="ml-1 text-sm font-normal">件</span>
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3">
              <p className="text-slate-500">賛助会員</p>
              <p className="text-xl font-bold text-slate-800">
                {result.counts.support}
                <span className="ml-1 text-sm font-normal">件</span>
              </p>
            </div>
            <div
              className={`rounded-lg border bg-white p-3 ${
                result.counts.invalid > 0 ? 'border-amber-300' : 'border-green-200'
              }`}
            >
              <p className="text-slate-500">住所不備</p>
              <p
                className={`text-xl font-bold ${
                  result.counts.invalid > 0 ? 'text-amber-600' : 'text-slate-800'
                }`}
              >
                {result.counts.invalid}
                <span className="ml-1 text-sm font-normal">件</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={busy || loadingTargets || selectedCount === 0}
        className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? '出力中...' : `選択した ${selectedCount} 件を Excel 出力・ダウンロード`}
      </button>
    </div>
  );
};

export default MailingListExport;
