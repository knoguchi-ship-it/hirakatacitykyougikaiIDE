import React, { useState, useMemo, useCallback } from 'react';
import { RosterTarget } from '../shared/types';
import { ApiClient } from '../services/api';

interface RosterExportSettings {
  rosterTemplateSsId?: string;
}

interface RosterExportProps {
  api: ApiClient;
  settings: RosterExportSettings;
}

const ROSTER_MAX_BATCH = 50;

const MEMBER_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: '個人',
  BUSINESS:   '事業所',
  SUPPORT:    '賛助',
};
const FEE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PAID:   { label: '納入済',   cls: 'text-green-700 bg-green-50' },
  UNPAID: { label: '未納',     cls: 'text-red-600 bg-red-50' },
  NONE:   { label: '記録なし', cls: 'text-slate-400 bg-slate-50' },
};
const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE:                '在籍',
  WITHDRAWAL_SCHEDULED:  '退会予定',
  WITHDRAWN:             '退会',
};

// 当年度を算出（日本会計年度: 4月始まり）
const calcCurrentFY = (): number => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

const btnCls =
  'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

const RosterExport: React.FC<RosterExportProps> = ({ api, settings }) => {
  const currentFY = useMemo(calcCurrentFY, []);

  // ── フィルタ ────────────────────────────────────────────────
  const [filterTypes, setFilterTypes]         = useState<string[]>(['INDIVIDUAL', 'BUSINESS', 'SUPPORT']);
  const [filterStatus, setFilterStatus]       = useState('ACTIVE');
  const [filterFeeStatus, setFilterFeeStatus] = useState('ALL');
  const [filterYear, setFilterYear]           = useState(currentFY);

  // ── 宛先一覧 ─────────────────────────────────────────────────
  const [targets, setTargets]     = useState<RosterTarget[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // ── 選択（null = 全選択） ────────────────────────────────────
  const [selectedIds, setSelectedIds]   = useState<Set<string> | null>(null);
  const [excludedIds, setExcludedIds]   = useState<Set<string>>(new Set());

  // ── 生成 ─────────────────────────────────────────────────────
  const [generating, setGenerating]         = useState(false);
  const [generateError, setGenerateError]   = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<{
    downloadUrl: string; fileId: string; zipName: string; count: number; errors: string[];
  } | null>(null);

  // ── 有効選択リスト ────────────────────────────────────────────
  const effectiveTargets = useMemo<RosterTarget[]>(() => {
    if (selectedIds === null) return targets.filter(t => !excludedIds.has(t.memberId));
    return targets.filter(t => selectedIds.has(t.memberId));
  }, [targets, selectedIds, excludedIds]);

  const isSelected = (id: string) =>
    selectedIds === null ? !excludedIds.has(id) : selectedIds.has(id);

  // ── 種別トグル ────────────────────────────────────────────────
  const toggleType = (t: string) =>
    setFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  // ── 宛先読み込み ─────────────────────────────────────────────
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
        memberTypes:    filterTypes,
        memberStatus:   filterStatus,
        annualFeeStatus: filterFeeStatus,
        year:           filterYear,
      });
      setTargets(data);
      setHasLoaded(true);
    } catch (e: any) {
      setLoadError(e.message || '対象一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [filterTypes, filterStatus, filterFeeStatus, filterYear, api]);

  // ── 選択操作 ─────────────────────────────────────────────────
  const selectAll   = () => { setSelectedIds(null); setExcludedIds(new Set()); };
  const deselectAll = () => { setSelectedIds(new Set()); setExcludedIds(new Set()); };

  const toggleOne = (id: string) => {
    if (selectedIds === null) {
      setExcludedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev ?? []);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  // 種別ごと全選択
  const selectByType = (type: string) => {
    const ids = targets.filter(t => t.memberType === type).map(t => t.memberId);
    if (selectedIds === null) {
      setExcludedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev ?? []);
        ids.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // ── ZIP 生成 ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    setGenerateResult(null);
    try {
      const result = await api.generateRosterZip({
        memberIds: effectiveTargets.map(t => t.memberId),
        year:      filterYear,
      });
      setGenerateResult(result);
    } catch (e: any) {
      setGenerateError(e.message || 'ZIP 生成に失敗しました。');
    } finally {
      setGenerating(false);
    }
  };

  const hasTemplate = Boolean(settings.rosterTemplateSsId);
  const overLimit   = effectiveTargets.length > ROSTER_MAX_BATCH;

  // 種別ごとのカウント
  const typeCount = useMemo(() => {
    const m: Record<string, number> = {};
    targets.forEach(t => { m[t.memberType] = (m[t.memberType] || 0) + 1; });
    return m;
  }, [targets]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">名簿出力コンソール</h2>

      {!hasTemplate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠ 名簿テンプレートSSが未設定です。
          <strong>システム設定 &gt; ROSTER_TEMPLATE_SS_ID</strong> にテンプレートスプレッドシートのIDを登録してください。
        </div>
      )}

      {/* ── フィルタパネル ── */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-700">出力フィルタ</h3>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 在籍状態 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">在籍状態</label>
            <select className={inputCls} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ACTIVE">在籍中のみ</option>
              <option value="INCLUDING_SCHEDULED">退会予定を含む</option>
              <option value="ALL">すべて</option>
            </select>
          </div>

          {/* 年会費状態 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">年会費状態</label>
            <select className={inputCls} value={filterFeeStatus} onChange={e => setFilterFeeStatus(e.target.value)}>
              <option value="ALL">すべて</option>
              <option value="UNPAID">未納のみ（記録なし含む）</option>
              <option value="PAID">納入済みのみ</option>
            </select>
          </div>

          {/* 対象年度 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">年会費対象年度</label>
            <input
              type="number"
              className={inputCls}
              value={filterYear}
              min={2020}
              max={2099}
              onChange={e => setFilterYear(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={loadTargets}
          disabled={loading || filterTypes.length === 0}
          className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}
        >
          {loading ? '読み込み中…' : '対象を読み込む'}
        </button>

        {loadError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {loadError}
          </p>
        )}
      </section>

      {/* ── 対象一覧 ── */}
      {hasLoaded && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">
                対象: {targets.length}件 / 選択中: {effectiveTargets.length}件
              </span>
              {overLimit && (
                <span className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5">
                  ⚠ {ROSTER_MAX_BATCH}件を超えています。{ROSTER_MAX_BATCH}件以下に絞り込んでください。
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] as const).filter(t => typeCount[t] > 0).map(t => (
                <button key={t} type="button" onClick={() => selectByType(t)}
                  className={`${btnCls} text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
                  {MEMBER_TYPE_LABELS[t]}全選
                </button>
              ))}
              <button type="button" onClick={selectAll}
                className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>全選択</button>
              <button type="button" onClick={deselectAll}
                className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>全解除</button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-4 py-2 text-left"></th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">氏名 / 事業所名</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">種別</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">在籍状態</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">年会費</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">職員数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {targets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      対象者がいません。フィルタを変更して再読み込みしてください。
                    </td>
                  </tr>
                ) : (
                  targets.map(t => {
                    const feeMeta = FEE_STATUS_LABELS[t.annualFeeStatus] ?? FEE_STATUS_LABELS.NONE;
                    return (
                      <tr
                        key={t.memberId}
                        className={`cursor-pointer transition-colors ${
                          isSelected(t.memberId) ? 'bg-primary-50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => toggleOne(t.memberId)}
                      >
                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`${t.displayName}を選択`}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            checked={isSelected(t.memberId)}
                            onChange={() => toggleOne(t.memberId)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-slate-800">{t.displayName}</div>
                          {t.officeName && (
                            <div className="text-xs text-slate-500">{t.officeName}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{MEMBER_TYPE_LABELS[t.memberType] ?? t.memberType}</td>
                        <td className="px-4 py-2 text-slate-600 text-xs">
                          {MEMBER_STATUS_LABELS[t.memberStatus] ?? t.memberStatus}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${feeMeta.cls}`}>
                            {feeMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-500 text-xs text-center">
                          {t.memberType === 'BUSINESS' && t.enrolledStaffCount !== undefined
                            ? `${t.enrolledStaffCount}名`
                            : '—'}
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

      {/* ── ZIP 生成ボタン ── */}
      {hasLoaded && (
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            disabled={effectiveTargets.length === 0 || overLimit || generating || !hasTemplate}
            onClick={handleGenerate}
            className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}
          >
            {generating
              ? '生成中…（数分かかる場合があります）'
              : `${effectiveTargets.length}件の名簿PDFをZIPで生成`}
          </button>
          {!hasTemplate && (
            <span className="text-sm text-amber-600">テンプレートSSを設定してください</span>
          )}
          {effectiveTargets.length === 0 && (
            <span className="text-sm text-slate-400">対象を選択してください</span>
          )}
          {overLimit && (
            <span className="text-sm text-red-500">{ROSTER_MAX_BATCH}件以下に絞り込んでください</span>
          )}
        </div>
      )}

      {/* ── 生成中プログレス ── */}
      {generating && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-slate-700">名簿PDFを生成中です…</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {effectiveTargets.length}件 × テンプレートPDF変換中。
                50件の場合は2〜4分かかる場合があります。このまましばらくお待ちください。
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 生成結果 ── */}
      {(generateResult || generateError) && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-base font-semibold text-slate-700">生成結果</h3>

          {generateError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {generateError}
            </p>
          )}

          {generateResult && (
            <>
              <p className="text-sm text-green-700">
                <span className="font-semibold">{generateResult.count}件</span> のPDFを生成しました。
              </p>

              <a
                href={generateResult.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 ${btnCls} bg-green-600 text-white hover:bg-green-700`}
              >
                ↓ {generateResult.zipName} をダウンロード
              </a>

              <p className="text-xs text-slate-400">
                ※ ファイルはスクリプトオーナーのGoogleドライブに保存されています。
                ダウンロード後は不要なファイルを削除してください。
              </p>

              {generateResult.errors.length > 0 && (
                <div className="text-sm text-amber-700 bg-amber-50 rounded p-3 space-y-1">
                  <p className="font-medium">一部PDF生成失敗（ZIP には含まれません）:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {generateResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── テンプレート規約ヘルプ ── */}
      <section className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-600">テンプレートSS準備ガイド</h3>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            テンプレートSSは管理者がGoogleドライブで事前に作成し、
            スプレッドシートIDをシステム設定に登録してください。
          </p>
          <div className="bg-white border border-slate-200 rounded p-3 space-y-1 font-mono">
            <p className="font-bold text-slate-700 font-sans">_DATA シート構造（コードが自動管理）</p>
            <p>行1: 会員ヘッダ（A=会員番号, B=会員種別, C=姓, D=名, E=フリガナ姓, F=フリガナ名,</p>
            <p className="pl-8">G=勤務先名, H=事業所番号, I=勤務先郵便番号, J=勤務先都道府県,</p>
            <p className="pl-8">K=勤務先市区町村, L=勤務先住所, M=勤務先電話, N=勤務先FAX,</p>
            <p className="pl-8">O=自宅郵便番号, P=自宅都道府県, Q=自宅市区町村, R=自宅住所,</p>
            <p className="pl-8">S=メールアドレス, T=入会日, U=年会費状態, V=年会費年度, W=介護支援専門員番号）</p>
            <p>行2: 会員データ値</p>
            <p>行4: 在籍職員ヘッダ（A=職員番号, B=職員権限, C=姓, D=名, E=フリガナ姓, F=フリガナ名,</p>
            <p className="pl-8">G=メールアドレス, H=入会日, I=職員状態）※BUSINESS のみ</p>
            <p>行5〜: 在籍職員データ（代表者→管理者→一般の順）</p>
          </div>
          <p>
            表示シートのセルでは <code className="bg-slate-100 px-1 rounded">=IFERROR(_DATA!C2&amp;" "&amp;_DATA!D2,"")</code>
            のように <code className="bg-slate-100 px-1 rounded">_DATA</code> シートを参照する数式を使用してください。
          </p>
        </div>
      </section>
    </div>
  );
};

export default RosterExport;
