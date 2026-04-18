import React, { useState, useCallback } from 'react';
import { api, MemberDeleteSearchResult, MemberDeletePreview, DeleteLogEntry } from '../services/api';

type Step = 'search' | 'preview' | 'confirm' | 'done';

const MEMBER_TYPE_LABEL: Record<string, string> = {
  INDIVIDUAL: '個人会員',
  BUSINESS: '事業所会員',
  SUPPORT: '賛助会員',
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '有効',
  WITHDRAWAL_SCHEDULED: '退会予定',
  WITHDRAWN: '退会済',
};
const TABLE_LABEL: Record<string, string> = {
  'T_会員': '会員',
  'T_事業所職員': '事業所職員',
  'T_認証アカウント': '認証アカウント',
  'T_ログイン履歴': 'ログイン履歴',
  'T_年会費納入履歴': '年会費納入履歴',
  'T_年会費更新履歴': '年会費更新履歴',
  'T_研修申込': '研修申込',
  'T_管理者Googleホワイトリスト': '管理者ホワイトリスト',
};

const MemberDeleteConsole: React.FC = () => {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemberDeleteSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    setSelectedIds(new Set());
    try {
      const results = await api.searchMembersForDelete(query.trim());
      setSearchResults(results);
    } catch (e: any) {
      setSearchError(e.message || '検索に失敗しました');
    } finally {
      setSearchLoading(false);
    }
  }, [query]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 10) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const handlePreview = async () => {
    if (selectedIds.size === 0) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await api.previewDeleteMember(Array.from(selectedIds));
      setPreview(result);
      setStep('preview');
    } catch (e: any) {
      setPreviewError(e.message || 'プレビューに失敗しました');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecute = async () => {
    if (confirmText !== '物理削除' || !preview) return;
    setExecuting(true);
    setExecError(null);
    try {
      const result = await api.executeDeleteMember(Array.from(selectedIds), confirmText);
      setExecResult({ logId: result.logId, count: result.deletedMemberIds.length });
      setStep('done');
    } catch (e: any) {
      setExecError(e.message || '削除に失敗しました');
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    setStep('search');
    setQuery('');
    setSearchResults([]);
    setSelectedIds(new Set());
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
    } catch (e: any) {
      setLogsLoaded(true);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
        <h2 className="text-xl font-bold text-red-800">データ管理コンソール（物理削除）</h2>
        <p className="text-sm text-red-700 mt-1">
          MASTER権限専用。対象アカウントに紐づく全データを不可逆的に物理削除します。
          削除前スナップショットは T_削除ログ に保存されます。
        </p>
      </div>

      {/* STEP 1: 検索 */}
      {step === 'search' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">Step 1: 削除対象アカウントを検索</h3>
          <p className="text-xs text-slate-500">会員ID・氏名・ログインIDで検索（部分一致）</p>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
              placeholder="例: demo-ind-001 / 野口 / 山田"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading || !query.trim()}
              className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 disabled:opacity-50"
            >
              {searchLoading ? '検索中...' : '検索'}
            </button>
          </div>

          {searchError && <p className="text-sm text-red-600">{searchError}</p>}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                {searchResults.length} 件見つかりました。削除する対象をチェック（最大10件）。
              </p>
              <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {searchResults.map(r => (
                  <label
                    key={r.memberId}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 ${
                      selectedIds.has(r.memberId) ? 'bg-red-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.memberId)}
                      onChange={() => toggleSelect(r.memberId)}
                      disabled={!selectedIds.has(r.memberId) && selectedIds.size >= 10}
                      className="accent-red-600"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-slate-800">{r.displayName}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {MEMBER_TYPE_LABEL[r.memberType] || r.memberType}・
                        {STATUS_LABEL[r.memberStatus] || r.memberStatus}
                      </span>
                      {r.isDeleted && <span className="ml-2 text-xs bg-slate-200 text-slate-600 rounded px-1">削除フラグON</span>}
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">
                      <div>{r.memberId}</div>
                      {r.loginId && <div>ID: {r.loginId}</div>}
                    </div>
                  </label>
                ))}
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-slate-600">{selectedIds.size} 件選択中</span>
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {previewLoading ? '確認中...' : '削除プレビューを確認 →'}
                  </button>
                </div>
              )}
              {previewError && <p className="text-sm text-red-600">{previewError}</p>}
            </div>
          )}

          {searchResults.length === 0 && !searchLoading && query && (
            <p className="text-sm text-slate-500">該当するアカウントが見つかりませんでした。</p>
          )}
        </div>
      )}

      {/* STEP 2: プレビュー */}
      {step === 'preview' && preview && (
        <div className="bg-white border border-orange-300 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">Step 2: 削除プレビュー</h3>
          <p className="text-sm text-orange-700">
            以下のデータが <strong>物理削除（復元不可）</strong> されます。
            削除前にスナップショットが T_削除ログ に保存されます。
          </p>

          {/* 対象アカウント */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">削除対象アカウント</p>
            {preview.targets.map(t => (
              <div key={t.memberId} className="flex gap-2 text-sm">
                <span className="font-medium text-slate-800">{t.displayName}</span>
                <span className="text-slate-500">{MEMBER_TYPE_LABEL[t.memberType] || t.memberType}</span>
                <span className="text-slate-400">{t.memberId}</span>
              </div>
            ))}
          </div>

          {/* 削除件数テーブル */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-600 font-medium">テーブル</th>
                  <th className="text-right px-3 py-2 text-slate-600 font-medium">削除行数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(preview.counts).map(([table, countVal]) => {
                  const count = countVal as number;
                  return (
                    <tr key={table} className={count > 0 ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                      <td className="px-3 py-2 text-slate-700">{TABLE_LABEL[table] || table}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={count > 0 ? 'text-red-700 font-semibold' : 'text-slate-400'}>
                          {count} 件
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-red-50 font-semibold">
                  <td className="px-3 py-2 text-red-800">合計</td>
                  <td className="px-3 py-2 text-right font-mono text-red-800">{preview.totalRows} 件</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('search')}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50"
            >
              ← 検索に戻る
            </button>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              削除確認へ進む →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 確認 */}
      {step === 'confirm' && preview && (
        <div className="bg-white border border-red-400 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-red-800">Step 3: 最終確認</h3>
          <div className="bg-red-50 rounded p-3 text-sm text-red-800 space-y-1">
            <p>・この操作は <strong>取り消せません</strong>。</p>
            <p>・削除されたデータは T_削除ログ のスナップショットからのみ手動復元できます。</p>
            <p>・対象: <strong>{preview.targets.map(t => t.displayName).join('、')}</strong> （計{preview.targets.length}件）</p>
            <p>・削除行合計: <strong>{preview.totalRows} 行</strong></p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              実行するには下のテキストボックスに <code className="bg-red-100 text-red-800 px-1 rounded">物理削除</code> と入力してください。
            </label>
            <input
              type="text"
              className="w-full border border-red-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="物理削除"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>

          {execError && <p className="text-sm text-red-600">{execError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('preview')}
              disabled={executing}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50 disabled:opacity-50"
            >
              ← 戻る
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={confirmText !== '物理削除' || executing}
              className="px-4 py-2 bg-red-700 text-white text-sm rounded hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            >
              {executing ? '削除実行中...' : '物理削除を実行する'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 完了 */}
      {step === 'done' && execResult && (
        <div className="bg-white border border-green-300 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-green-800">削除完了</h3>
          <p className="text-sm text-slate-700">
            {execResult.count} 件のアカウントとその関連データを物理削除しました。
          </p>
          <p className="text-xs text-slate-500">削除ログID: {execResult.logId}</p>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
          >
            続けて削除する / リセット
          </button>
        </div>
      )}

      {/* 重複職員レコード修復 */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 space-y-3">
        <h3 className="font-semibold text-amber-800">データ整合性修復: 重複在籍職員レコード</h3>
        <p className="text-xs text-amber-700">
          同一介護支援専門員番号 × 同一事業所に ENROLLED 件数が 2件以上ある場合、
          最新レコード以外を LEFT + 削除済みに更新します。個人⇔事業所の往復変換バグで生じた重複を一括修復します。
        </p>
        <button
          type="button"
          onClick={handleRepair}
          disabled={repairLoading}
          className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50"
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

      {/* 会員CM番号重複修復 */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 space-y-3">
        <h3 className="font-semibold text-amber-800">データ整合性修復: 会員CM番号重複（同一介護支援専門員番号に複数の有効会員）</h3>
        <p className="text-xs text-amber-700">
          同一介護支援専門員番号を持つ個人/賛助会員が複数 ACTIVE な場合、入会日が最も新しい1件を残し、それ以外を WITHDRAWN に更新します。
          個人⇔事業所の変換エラー後に残る整合性違反を修復します。
        </p>
        <button
          type="button"
          onClick={handleRepairCareManagerDuplicates}
          disabled={repairCmLoading}
          className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50"
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
                {repairCmResult.details.map(d => (
                  <li key={d.memberId}>会員ID {d.memberId}（CM# {d.careManagerNumber}）</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 研修申込の申込者ID修復 */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 space-y-3">
        <h3 className="font-semibold text-amber-800">データ整合性修復: 研修申込の申込者ID不整合</h3>
        <p className="text-xs text-amber-700">
          個人会員⇔事業所会員の往復変換後に <code className="bg-amber-100 px-1 rounded">申込者ID ≠ 会員ID</code>{' '}
          となったレコードを修復します。T_会員 に存在しない 会員ID を持つレコードは安全のため変更しません。
          スキップ件数が残る場合は手動確認が必要です。
        </p>
        <button
          type="button"
          onClick={handleRepairApplicantIds}
          disabled={repairApplyLoading}
          className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50"
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
              <p className="text-orange-700 font-medium">
                ⚠ {repairApplyResult.skipped} 件は会員ID が T_会員 に存在しないためスキップしました。手動確認が必要です。
              </p>
            )}
          </div>
        )}
      </div>

      {/* 削除ログ */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">削除ログ（直近20件）</h3>
          <button
            type="button"
            onClick={loadLogs}
            disabled={logsLoading}
            className="text-xs px-3 py-1 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 disabled:opacity-50"
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
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">操作日時</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">操作者</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">対象会員ID</th>
                  <th className="text-right px-3 py-2 text-slate-500 font-medium">削除行数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.logId} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600 font-mono whitespace-nowrap">
                      {log.operatedAt ? new Date(log.operatedAt).toLocaleString('ja-JP') : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{log.operatorEmail}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono">{log.memberIdList}</td>
                    <td className="px-3 py-2 text-right text-slate-700 font-semibold">{log.totalDeletedRows}</td>
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
