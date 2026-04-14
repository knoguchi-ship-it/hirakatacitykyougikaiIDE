import React, { useCallback, useMemo, useState } from 'react';
import { RosterTarget } from '../shared/types';
import { ApiClient } from '../services/api';

interface RosterExportSettings {
  rosterTemplateSsId?: string;
}

interface RosterExportProps {
  api: ApiClient;
  settings: RosterExportSettings;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
}

const MEMBER_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: '個人会員',
  BUSINESS: '事業所会員',
  SUPPORT: '賛助会員',
};

const FEE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PAID: { label: '納入済み', cls: 'text-emerald-700 bg-emerald-50' },
  UNPAID: { label: '未納', cls: 'text-rose-700 bg-rose-50' },
  NONE: { label: '対象外', cls: 'text-slate-500 bg-slate-50' },
};

const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '在籍中',
  WITHDRAWAL_SCHEDULED: '退会予定',
  WITHDRAWN: '退会',
};

const calcCurrentFY = (): number => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

const btnCls =
  'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

const quickStepCls =
  'rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm';

const RosterExport: React.FC<RosterExportProps> = ({
  api,
  settings,
  onOpenHelp,
  onOpenSettings,
}) => {
  const currentFY = useMemo(calcCurrentFY, []);
  const [filterTypes, setFilterTypes] = useState<string[]>(['INDIVIDUAL', 'BUSINESS', 'SUPPORT']);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterFeeStatus, setFilterFeeStatus] = useState('ALL');
  const [filterYear, setFilterYear] = useState(currentFY);

  const [targets, setTargets] = useState<RosterTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<{
    downloadUrl: string;
    fileId: string;
    zipName: string;
    count: number;
    errors: string[];
  } | null>(null);

  const effectiveTargets = useMemo<RosterTarget[]>(() => {
    if (selectedIds === null) {
      return targets.filter((target) => !excludedIds.has(target.memberId));
    }
    return targets.filter((target) => selectedIds.has(target.memberId));
  }, [targets, selectedIds, excludedIds]);

  const typeCount = useMemo(() => {
    const countMap: Record<string, number> = {};
    targets.forEach((target) => {
      countMap[target.memberType] = (countMap[target.memberType] || 0) + 1;
    });
    return countMap;
  }, [targets]);

  const isSelected = (id: string) =>
    selectedIds === null ? !excludedIds.has(id) : selectedIds.has(id);

  const toggleType = (memberType: string) => {
    setFilterTypes((prev) =>
      prev.includes(memberType) ? prev.filter((item) => item !== memberType) : [...prev, memberType],
    );
  };

  const loadTargets = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setHasLoaded(false);
    setTargets([]);
    setSelectedIds(null);
    setExcludedIds(new Set());
    setGenerateResult(null);
    setGenerateError(null);
    try {
      const data = await api.getMembersForRoster({
        memberTypes: filterTypes,
        memberStatus: filterStatus,
        annualFeeStatus: filterFeeStatus,
        year: filterYear,
      });
      setTargets(data);
      setHasLoaded(true);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '対象一覧の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [api, filterFeeStatus, filterStatus, filterTypes, filterYear]);

  const selectAll = () => {
    setSelectedIds(null);
    setExcludedIds(new Set());
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  };

  const toggleOne = (id: string) => {
    if (selectedIds === null) {
      setExcludedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectByType = (memberType: string) => {
    const ids = targets.filter((target) => target.memberType === memberType).map((target) => target.memberId);
    if (selectedIds === null) {
      setExcludedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev ?? []);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    setGenerateResult(null);
    try {
      const result = await api.generateRosterZip({
        memberIds: effectiveTargets.map((target) => target.memberId),
        year: filterYear,
      });
      setGenerateResult(result);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'ZIP 出力に失敗しました。');
    } finally {
      setGenerating(false);
    }
  };

  const hasTemplate = Boolean(settings.rosterTemplateSsId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">名簿出力コンソール</h2>
          <p className="mt-1 text-sm text-slate-500">
            対象を読み込み、会員種別に応じたテンプレートで名簿 PDF を一括生成します。
          </p>
        </div>
      </div>

      {!hasTemplate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          名簿テンプレートが未設定です。先にシステム設定でテンプレートを登録してください。
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#f5faf6_100%)] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">はじめての方へ</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              テンプレートの準備から名簿の出力まで、最初に確認したい流れを3つの手順で案内しています。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenHelp}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              テンプレートの作り方を見る
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              システム設定を開く
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className={quickStepCls}>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">1</div>
            <h4 className="mt-3 text-sm font-semibold text-slate-900">テンプレートを用意する</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              サンプルをコピーして見た目だけ調整します。hidden シートや内部シート名は変更しません。
            </p>
          </div>
          <div className={quickStepCls}>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">2</div>
            <h4 className="mt-3 text-sm font-semibold text-slate-900">システム設定に登録する</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              スプレッドシートの URL か ID を登録し、設定画面の検証で構成エラーがないことを確認します。
            </p>
          </div>
          <div className={quickStepCls}>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">3</div>
            <h4 className="mt-3 text-sm font-semibold text-slate-900">対象を読み込んで出力する</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              会員種別、在籍状態、年会費状態で対象を絞り込み、確認後に ZIP 生成を実行します。
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-700">出力フィルタ</h3>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">会員種別</p>
          <div className="flex flex-wrap gap-4">
            {(['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] as const).map((memberType) => (
              <label key={memberType} className="flex cursor-pointer select-none items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={filterTypes.includes(memberType)}
                  onChange={() => toggleType(memberType)}
                />
                {MEMBER_TYPE_LABELS[memberType]}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">在籍状態</label>
            <select className={inputCls} value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="ACTIVE">在籍中のみ</option>
              <option value="INCLUDING_SCHEDULED">退会予定を含む</option>
              <option value="ALL">すべて</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">年会費状態</label>
            <select className={inputCls} value={filterFeeStatus} onChange={(event) => setFilterFeeStatus(event.target.value)}>
              <option value="ALL">すべて</option>
              <option value="UNPAID">未納のみ</option>
              <option value="PAID">納入済みのみ</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">年会費対象年度</label>
            <input
              type="number"
              className={inputCls}
              value={filterYear}
              min={2020}
              max={2099}
              onChange={(event) => setFilterYear(Number(event.target.value))}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={loadTargets}
          disabled={loading || filterTypes.length === 0}
          className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}
        >
          {loading ? '読み込み中...' : '対象を読み込む'}
        </button>

        {loadError && (
          <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </p>
        )}
      </section>

      {hasLoaded && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
                対象: {targets.length}件 / 選択中: {effectiveTargets.length}件
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] as const)
                .filter((memberType) => typeCount[memberType] > 0)
                .map((memberType) => (
                  <button
                    key={memberType}
                    type="button"
                    onClick={() => selectByType(memberType)}
                    className={`${btnCls} border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50`}
                  >
                    {MEMBER_TYPE_LABELS[memberType]}を選択
                  </button>
                ))}
              <button
                type="button"
                onClick={selectAll}
                className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
              >
                すべて選択
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
              >
                すべて解除
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="w-10 px-4 py-2 text-left"></th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">氏名 / 事業所名</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">会員種別</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">在籍状態</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">年会費</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">職員数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {targets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      対象がありません。フィルタを確認して再度読み込んでください。
                    </td>
                  </tr>
                ) : (
                  targets.map((target) => {
                    const feeMeta = FEE_STATUS_LABELS[target.annualFeeStatus] ?? FEE_STATUS_LABELS.NONE;
                    return (
                      <tr
                        key={target.memberId}
                        className={`cursor-pointer transition-colors ${
                          isSelected(target.memberId) ? 'bg-primary-50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => toggleOne(target.memberId)}
                      >
                        <td className="px-4 py-2" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`${target.displayName} を選択`}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            checked={isSelected(target.memberId)}
                            onChange={() => toggleOne(target.memberId)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-slate-800">{target.displayName}</div>
                          {target.officeName && <div className="text-xs text-slate-500">{target.officeName}</div>}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{MEMBER_TYPE_LABELS[target.memberType] ?? target.memberType}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {MEMBER_STATUS_LABELS[target.memberStatus] ?? target.memberStatus}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${feeMeta.cls}`}>
                            {feeMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-slate-500">
                          {target.memberType === 'BUSINESS' && target.enrolledStaffCount !== undefined
                            ? `${target.enrolledStaffCount}名`
                            : '―'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hasLoaded && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={effectiveTargets.length === 0 || generating || !hasTemplate}
            onClick={handleGenerate}
            className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}
          >
            {generating ? '出力中...' : `${effectiveTargets.length}件の名簿 PDF を ZIP 生成`}
          </button>
          {!hasTemplate && <span className="text-sm text-amber-700">テンプレート設定が必要です。</span>}
          {effectiveTargets.length === 0 && <span className="text-sm text-slate-500">出力対象を選択してください。</span>}
        </div>
      )}

      {generating && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 shrink-0 animate-spin rounded-full border-b-2 border-primary-500"></div>
            <div>
              <p className="text-sm font-medium text-slate-700">名簿 PDF を生成しています。</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {effectiveTargets.length} 件を並列処理しています。件数が多い場合は数分かかることがあります。処理が完了するまでこの画面を閉じないでください。
              </p>
            </div>
          </div>
        </section>
      )}

      {(generateResult || generateError) && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="text-base font-semibold text-slate-700">出力結果</h3>

          {generateError && (
            <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {generateError}
            </p>
          )}

          {generateResult && (
            <>
              <p className="text-sm text-emerald-700">
                <span className="font-semibold">{generateResult.count}件</span> の PDF を生成しました。
              </p>

              <a
                href={generateResult.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 ${btnCls} bg-emerald-600 text-white hover:bg-emerald-700`}
              >
                {generateResult.zipName} をダウンロード
              </a>

              <p className="text-xs text-slate-400">
                ファイルは Google ドライブにも保存されます。不要なファイルは定期的に整理してください。
              </p>

              {generateResult.errors.length > 0 && (
                <div className="space-y-1 rounded p-3 text-sm text-amber-800 bg-amber-50">
                  <p className="font-medium">一部の PDF でエラーが発生しました。</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {generateResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default RosterExport;
