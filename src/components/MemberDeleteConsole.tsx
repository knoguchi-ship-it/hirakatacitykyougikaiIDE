import React, { useState, useCallback } from 'react';
import { api, MemberDeleteSearchResult, MemberDeletePreview, DeleteLogEntry } from '../services/api';

type Step = 'search' | 'preview' | 'confirm' | 'done';

const MEMBER_TYPE_LABEL: Record<string, string> = {
  INDIVIDUAL: '個人会員',
  BUSINESS: '事業所会員',
  SUPPORT: '賛助会員',
};
const MEMBER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '有効',
  WITHDRAWAL_SCHEDULED: '退会予定',
  WITHDRAWN: '退会済',
};
const STAFF_STATUS_LABEL: Record<string, string> = {
  ENROLLED: '在籍',
  LEFT: '退職',
};
const STAFF_ROLE_LABEL: Record<string, string> = {
  REPRESENTATIVE: '代表者',
  ADMIN: '管理者',
  STAFF: 'メンバー',
};
const TABLE_LABEL: Record<string, string> = {
  'T_会員': '会員レコード',
  'T_事業所職員': '事業所職員レコード',
  'T_認証アカウント': '認証アカウント',
  'T_管理者Googleホワイトリスト': '管理者ホワイトリスト',
  'T_ログイン履歴': 'ログイン履歴',
  'T_年会費納入履歴': '年会費納入履歴',
  'T_年会費更新履歴': '年会費更新履歴',
  'T_研修申込': '研修申込',
};

const UPDATED_TABLE_ORDER = [
  'T_会員',
  'T_事業所職員',
  'T_認証アカウント',
  'T_管理者Googleホワイトリスト',
];
const RETAINED_TABLE_ORDER = [
  'T_ログイン履歴',
  'T_年会費納入履歴',
  'T_年会費更新履歴',
  'T_研修申込',
];

const renderTargetMeta = (target: MemberDeleteSearchResult | MemberDeletePreview['targets'][number]) => {
  if (target.targetKind === 'STAFF') {
    return [
      '事業所会員メンバー',
      STAFF_ROLE_LABEL[target.staffRole || 'STAFF'] || target.staffRole || 'メンバー',
      STAFF_STATUS_LABEL[target.staffStatus || 'ENROLLED'] || target.staffStatus || '在籍',
    ].join('・');
  }
  return [
    MEMBER_TYPE_LABEL[target.memberType] || target.memberType,
    MEMBER_STATUS_LABEL[target.memberStatus] || target.memberStatus,
  ].join('・');
};

const MemberDeleteConsole: React.FC = () => {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemberDeleteSearchResult[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<MemberDeletePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [confirmText, setConfirmText] = useState('');
  const [executing, setExecuting] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<{ logId: string; count: number } | null>(null);

  const [logs, setLogs] = useState<DeleteLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  const [repairLoading, setRepairLoading] = useState(false);
  const [repairResult, setRepairResult] = useState<{ repaired: number } | null>(null);
  const [repairError, setRepairError] = useState<string | null>(null);

  const [repairApplyLoading, setRepairApplyLoading] = useState(false);
  const [repairApplyResult, setRepairApplyResult] = useState<{ repaired: number; skipped: number } | null>(null);
  const [repairApplyError, setRepairApplyError] = useState<string | null>(null);

  const [repairCmLoading, setRepairCmLoading] = useState(false);
  const [repairCmResult, setRepairCmResult] = useState<{ repaired: number; details: { memberId: string; careManagerNumber: string }[] } | null>(null);
  const [repairCmError, setRepairCmError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSelectedKeys(new Set());
    try {
      const results = await api.searchMembersForDelete(query.trim());
      setSearchResults(results);
    } catch (e: any) {
      setSearchError(e.message || '検索に失敗しました');
    } finally {
      setSearchLoading(false);
    }
  }, [query]);

  const toggleSelect = (targetKey: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(targetKey)) {
        next.delete(targetKey);
      } else {
        if (next.size >= 10) return prev;
        next.add(targetKey);
      }
      return next;
    });
  };

  const handlePreview = async () => {
    if (selectedKeys.size === 0) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await api.previewDeleteMember(Array.from(selectedKeys));
      setPreview(result);
      setStep('preview');
    } catch (e: any) {
      setPreviewError(e.message || 'プレビューに失敗しました');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecute = async () => {
    if (confirmText !== '論理削除' || !preview) return;
    setExecuting(true);
    setExecError(null);
    try {
      const result = await api.executeDeleteMember(Array.from(selectedKeys), confirmText);
      setExecResult({ logId: result.logId, count: result.archivedTargetKeys.length });
      setStep('done');
    } catch (e: any) {
      setExecError(e.message || '論理削除に失敗しました');
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    setStep('search');
    setQuery('');
    setSearchResults([]);
    setSelectedKeys(new Set());
    setPreview(null);
    setConfirmText('');
    setExecResult(null);
    setExecError(null);
    setPreviewError(null);
    setLogsLoaded(false);
    setLogs([]);
  };

  const handleRepair = async () => {
    setRepairLoading(true);
    setRepairError(null);
    setRepairResult(null);
    try {
      const result = await api.repairDuplicateStaffRecords();
      setRepairResult(result);
    } catch (e: any) {
      setRepairError(e.message || '修復に失敗しました');
    } finally {
      setRepairLoading(false);
    }
  };

  const handleRepairCareManagerDuplicates = async () => {
    setRepairCmLoading(true);
    setRepairCmError(null);
    setRepairCmResult(null);
    try {
      const result = await api.repairMemberCareManagerDuplicates();
      setRepairCmResult(result);
    } catch (e: any) {
      setRepairCmError(e.message || '修復に失敗しました');
    } finally {
      setRepairCmLoading(false);
    }
  };

  const handleRepairApplicantIds = async () => {
    setRepairApplyLoading(true);
    setRepairApplyError(null);
    setRepairApplyResult(null);
    try {
      const result = await api.repairTrainingApplicationApplicantIds();
      setRepairApplyResult(result);
    } catch (e: any) {
      setRepairApplyError(e.message || '修復に失敗しました');
    } finally {
      setRepairApplyLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const result = await api.getDeleteLogs(20);
      setLogs(result);
      setLogsLoaded(true);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            MASTER専用
          </span>
          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 border border-amber-200">
            物理削除は使用しません
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">データ管理コンソール（論理削除）</h2>
        <p className="text-sm leading-6 text-slate-700">
          個人会員、賛助会員、事業所会員、事業所会員メンバーを検索し、
          <strong className="mx-1 text-slate-900">退会・退職 + 削除フラグ + 認証無効化</strong>
          を一括で実行します。履歴テーブルは保持し、`T_削除ログ` に操作前スナップショットを残します。
        </p>
      </div>

      {step === 'search' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">Step 1: 論理削除対象を検索</h3>
            <p className="text-xs text-slate-500">
              会員ID、職員ID、氏名、事業所名、ログインID、メールアドレス、事業所番号で部分一致検索します。
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm"
              placeholder="例: 2770100001 / 山田 / ひらかた / demo-ind-001"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading || !query.trim()}
              className="px-4 py-2.5 bg-slate-900 text-white text-sm rounded-xl hover:bg-slate-800 disabled:opacity-50"
            >
              {searchLoading ? '検索中...' : '検索'}
            </button>
          </div>

          {searchError && <p className="text-sm text-red-600">{searchError}</p>}

          {searchResults.length > 0 && (() => {
            const visibleResults = showDeleted
              ? searchResults
              : searchResults.filter(r => !r.isDeleted);
            const hiddenCount = searchResults.length - visibleResults.length;
            return (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="text-slate-600">
                  {visibleResults.length} 件表示中
                  {hiddenCount > 0 && <span className="ml-1 text-slate-400">（削除済み {hiddenCount} 件を非表示）</span>}
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={showDeleted}
                      onChange={e => setShowDeleted(e.target.checked)}
                      className="accent-slate-600"
                    />
                    削除済みも表示する
                  </label>
                  <p className="text-xs text-slate-400">選択数: {selectedKeys.size} / 10</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                {visibleResults.length === 0 && (
                  <p className="text-sm text-slate-500 py-2">
                    削除フラグOFFの対象が見つかりませんでした。「削除済みも表示する」をオンにすると削除済み対象が表示されます。
                  </p>
                )}
                {visibleResults.map(result => (
                  <label
                    key={result.targetKey}
                    className={`block cursor-pointer rounded-2xl border px-4 py-3 transition ${
                      selectedKeys.has(result.targetKey)
                        ? 'border-amber-400 bg-amber-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(result.targetKey)}
                        onChange={() => toggleSelect(result.targetKey)}
                        disabled={!selectedKeys.has(result.targetKey) && selectedKeys.size >= 10}
                        className="mt-1 accent-amber-600"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{result.displayName}</span>
                          <span className="text-xs text-slate-500">{renderTargetMeta(result)}</span>
                          {result.isDeleted && (
                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                              削除フラグON
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>キー: {result.targetKey}</span>
                          <span>会員ID: {result.memberId}</span>
                          {result.staffId && <span>職員ID: {result.staffId}</span>}
                          {result.loginId && <span>ログインID: {result.loginId}</span>}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {selectedKeys.size > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-slate-600">選択した対象の更新件数と保持履歴を確認します。</p>
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="px-4 py-2.5 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 disabled:opacity-50"
                  >
                    {previewLoading ? '確認中...' : '影響を確認する'}
                  </button>
                </div>
              )}
              {previewError && <p className="text-sm text-red-600">{previewError}</p>}
            </div>
            );
          })()}

          {searchResults.length === 0 && !searchLoading && query && (
            <p className="text-sm text-slate-500">該当する対象が見つかりませんでした。</p>
          )}
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">Step 2: 論理削除プレビュー</h3>
            <p className="text-sm text-slate-600">
              更新対象 {preview.totalUpdatedRows} 件、関連履歴 {Object.values(preview.retainedCounts).reduce<number>((sum, value) => sum + Number(value || 0), 0)} 件を確認します。
              関連履歴は削除せず保持します。
            </p>
          </div>

          <div className="grid gap-3">
            {preview.targets.map(target => (
              <div key={target.targetKey} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{target.displayName}</span>
                  <span className="text-xs text-slate-500">{renderTargetMeta(target)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>キー: {target.targetKey}</span>
                  <span>会員ID: {target.memberId}</span>
                  {target.staffId && <span>職員ID: {target.staffId}</span>}
                  {target.loginId && <span>ログインID: {target.loginId}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <h4 className="font-semibold text-amber-900">更新されるレコード</h4>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-amber-100">
                  {UPDATED_TABLE_ORDER.map(table => {
                    const count = preview.counts[table] || 0;
                    return (
                      <tr key={table}>
                        <td className="py-2 text-slate-700">{TABLE_LABEL[table] || table}</td>
                        <td className="py-2 text-right font-mono text-amber-900">{count}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-semibold">
                    <td className="py-2 text-amber-900">合計</td>
                    <td className="py-2 text-right font-mono text-amber-900">{preview.totalUpdatedRows}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h4 className="font-semibold text-slate-900">保持される関連履歴</h4>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-200">
                  {RETAINED_TABLE_ORDER.map(table => {
                    const count = preview.retainedCounts[table] || 0;
                    return (
                      <tr key={table}>
                        <td className="py-2 text-slate-700">{TABLE_LABEL[table] || table}</td>
                        <td className="py-2 text-right font-mono text-slate-700">{count}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-semibold">
                    <td className="py-2 text-slate-900">総影響件数</td>
                    <td className="py-2 text-right font-mono text-slate-900">{preview.totalRows}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep('search')}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-xl hover:bg-slate-50"
            >
              検索に戻る
            </button>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="px-4 py-2.5 bg-slate-900 text-white text-sm rounded-xl hover:bg-slate-800"
            >
              最終確認へ進む
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && preview && (
        <div className="bg-white border border-red-300 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-semibold text-red-800">Step 3: 最終確認</h3>
            <p className="text-sm text-red-700">
              対象を即時に退会・退職扱いへ更新し、認証を無効化します。履歴は保持されますが、通常画面からは除外されます。
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800 space-y-1">
            <p>・物理削除は行いません。</p>
            <p>・代表者職員は単体では論理削除できません。必要な場合は事業所会員全体を対象にしてください。</p>
            <p>・対象: <strong>{preview.targets.map(target => target.displayName).join('、')}</strong></p>
            <p>・更新レコード合計: <strong>{preview.totalUpdatedRows} 件</strong></p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              実行するには <code className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded">論理削除</code> と入力してください。
            </label>
            <input
              type="text"
              className="w-full border border-red-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="論理削除"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>

          {execError && <p className="text-sm text-red-600">{execError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('preview')}
              disabled={executing}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={confirmText !== '論理削除' || executing}
              className="px-4 py-2.5 bg-red-700 text-white text-sm rounded-xl hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            >
              {executing ? '実行中...' : '論理削除を実行する'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && execResult && (
        <div className="bg-white border border-green-300 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-green-800">論理削除完了</h3>
          <p className="text-sm text-slate-700">
            {execResult.count} 件の対象に対して退会・退職と認証無効化を適用しました。
          </p>
          <p className="text-xs text-slate-500">削除ログID: {execResult.logId}</p>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 bg-slate-900 text-white text-sm rounded-xl hover:bg-slate-800"
          >
            続けて処理する
          </button>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-amber-800">データ整合性修復: 重複在籍職員レコード</h3>
        <p className="text-xs text-amber-700">
          同一介護支援専門員番号 × 同一事業所に ENROLLED 件数が 2件以上ある場合、
          最新レコード以外を LEFT + 削除済みに更新します。個人⇔事業所の往復変換バグで生じた重複を一括修復します。
        </p>
        <button
          type="button"
          onClick={handleRepair}
          disabled={repairLoading}
          className="px-4 py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 disabled:opacity-50"
        >
          {repairLoading ? '修復中...' : '重複在籍レコードを修復する'}
        </button>
        {repairError && <p className="text-sm text-red-600">{repairError}</p>}
        {repairResult !== null && (
          <p className="text-sm text-amber-800">
            {repairResult.repaired === 0
              ? '重複レコードは見つかりませんでした（整合性OK）。'
              : `${repairResult.repaired} 件の重複レコードを修復しました。`}
          </p>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-amber-800">データ整合性修復: 会員CM番号重複（同一介護支援専門員番号に複数の有効会員）</h3>
        <p className="text-xs text-amber-700">
          同一介護支援専門員番号を持つ個人/賛助会員が複数 ACTIVE な場合、入会日が最も新しい1件を残し、それ以外を WITHDRAWN に更新します。
          個人⇔事業所の変換エラー後に残る整合性違反を修復します。
        </p>
        <button
          type="button"
          onClick={handleRepairCareManagerDuplicates}
          disabled={repairCmLoading}
          className="px-4 py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 disabled:opacity-50"
        >
          {repairCmLoading ? '修復中...' : '会員CM番号重複を修復する'}
        </button>
        {repairCmError && <p className="text-sm text-red-600">{repairCmError}</p>}
        {repairCmResult !== null && (
          <div className="text-sm text-amber-800 space-y-1">
            <p>
              {repairCmResult.repaired === 0
                ? '重複は見つかりませんでした（整合性OK）。'
                : `${repairCmResult.repaired} 件の重複会員を WITHDRAWN に更新しました。`}
            </p>
            {repairCmResult.details.length > 0 && (
              <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5">
                {repairCmResult.details.map(detail => (
                  <li key={detail.memberId}>会員ID {detail.memberId}（CM# {detail.careManagerNumber}）</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-amber-800">データ整合性修復: 研修申込の申込者ID不整合</h3>
        <p className="text-xs text-amber-700">
          個人会員⇔事業所会員の往復変換後に <code className="bg-amber-100 px-1 rounded">申込者ID ≠ 会員ID</code> となったレコードを修復します。
          `T_会員` に存在しない会員IDを持つレコードは安全のため変更しません。
        </p>
        <button
          type="button"
          onClick={handleRepairApplicantIds}
          disabled={repairApplyLoading}
          className="px-4 py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 disabled:opacity-50"
        >
          {repairApplyLoading ? '修復中...' : '研修申込の申込者IDを修復する'}
        </button>
        {repairApplyError && <p className="text-sm text-red-600">{repairApplyError}</p>}
        {repairApplyResult !== null && (
          <div className="text-sm text-amber-800 space-y-1">
            <p>
              {repairApplyResult.repaired === 0
                ? '不整合レコードは見つかりませんでした（整合性OK）。'
                : `${repairApplyResult.repaired} 件の申込者IDを修復しました。`}
            </p>
            {repairApplyResult.skipped > 0 && (
              <p className="font-medium text-orange-700">
                {repairApplyResult.skipped} 件は会員IDが `T_会員` に存在しないためスキップしました。
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">削除ログ（直近20件）</h3>
            <p className="text-xs text-slate-500">論理削除実行前のスナップショットから集計した影響件数を表示します。</p>
          </div>
          <button
            type="button"
            onClick={loadLogs}
            disabled={logsLoading}
            className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50"
          >
            {logsLoading ? '読込中...' : '更新'}
          </button>
        </div>

        {!logsLoaded && !logsLoading && (
          <p className="text-xs text-slate-400">「更新」ボタンで削除ログを読み込みます。</p>
        )}
        {logsLoaded && logs.length === 0 && (
          <p className="text-xs text-slate-400">削除ログはまだありません。</p>
        )}
        {logs.length > 0 && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">操作日時</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">操作者</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">対象キー</th>
                  <th className="text-right px-3 py-2 text-slate-500 font-medium">影響件数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.logId} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600 font-mono whitespace-nowrap">
                      {log.operatedAt ? new Date(log.operatedAt).toLocaleString('ja-JP') : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{log.operatorEmail || '-'}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono break-all">{log.memberIdList}</td>
                    <td className="px-3 py-2 text-right text-slate-700 font-semibold">{log.totalAffectedRows}</td>
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

export default MemberDeleteConsole;
