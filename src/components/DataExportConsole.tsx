import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

/**
 * v376.68: 汎用データエクスポート（CSV）コンソール。
 *
 * 背景（docs/261 T-07）: GCP 移行後はスプレッドシートを直接開けなくなるため、
 * 「任意のテーブルを Excel で確認・分析する」手段を先に用意する。
 *
 * 権限: menu `data-export`。既定では MASTER のみで、事務局へ渡す場合は
 * MASTER が 権限管理 から明示的に付与する（会員の個人情報を丸ごと持ち出せる操作のため）。
 */

type ExportTable = {
  name: string;
  kind: 'TABLE' | 'MASTER';
  masterOnly: boolean;
  exists: boolean;
};

const DataExportConsole: React.FC = () => {
  const [tables, setTables] = useState<ExportTable[]>([]);
  const [maxRows, setMaxRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listExportableTables();
      setTables(Array.isArray(res.tables) ? res.tables : []);
      setMaxRows(Number(res.maxRows || 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : '出力できるテーブルの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const k = keyword.trim();
    if (!k) return tables;
    return tables.filter((t) => t.name.includes(k));
  }, [tables, keyword]);

  const download = async (tableName: string) => {
    setBusy(tableName);
    setError(null);
    setMessage(null);
    try {
      const res = await api.exportTableCsv(tableName, includeDeleted);
      // Excel が文字化けしないよう BOM を付ける
      const blob = new Blob(['﻿' + res.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const notes: string[] = [`${res.rowCount.toLocaleString('ja-JP')} 行を出力しました`];
      if (res.skippedDeleted > 0) notes.push(`削除済み ${res.skippedDeleted.toLocaleString('ja-JP')} 行は除外`);
      if (res.truncated) notes.push(`⚠️ 上限 ${res.maxRows.toLocaleString('ja-JP')} 行で打ち切りました`);
      setMessage(`${res.tableName}: ${notes.join(' / ')}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '出力に失敗しました。');
    } finally {
      setBusy('');
    }
  };

  const renderRows = (kind: 'TABLE' | 'MASTER') => filtered
    .filter((t) => t.kind === kind)
    .map((t) => (
      <tr key={t.name} className="border-b border-slate-100">
        <td className="px-3 py-2">
          <span className="font-medium text-slate-800">{t.name}</span>
          {t.masterOnly && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">マスター限定</span>
          )}
          {!t.exists && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">未作成</span>
          )}
        </td>
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            disabled={!t.exists || busy === t.name}
            onClick={() => { void download(t.name); }}
            className="min-h-[44px] rounded border border-primary-300 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-40"
          >
            {busy === t.name ? '出力中...' : 'CSV を出力'}
          </button>
        </td>
      </tr>
    ));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">データ出力（CSV）</h2>
        <p className="text-sm text-slate-600">
          任意のテーブルを CSV で出力します。Excel でそのまま開けます（文字コードは UTF-8）。
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">取り扱いの注意</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>出力したファイルには<strong>会員の個人情報</strong>が含まれます。保存先と共有範囲にご注意ください。</li>
          <li>誰がどのテーブルを出力したかは<strong>監査ログに記録</strong>されます（内容は記録しません）。</li>
          <li>ログイン情報を保持する認証テーブルは<strong>出力できません</strong>。</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            className="accent-primary-600"
          />
          <span className="text-sm text-slate-700">削除済みの行も含める</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="テーブル名で絞り込み"
            className="min-h-[44px] rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => { void load(); }}
            disabled={loading}
            className="min-h-[44px] rounded border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? '読込中...' : '再読込'}
          </button>
        </div>
      </div>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {maxRows > 0 && (
        <p className="text-xs text-slate-500">
          1 回の出力は最大 {maxRows.toLocaleString('ja-JP')} 行までです（実行時間の上限を超えないための制限）。
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-600">
              <th className="px-3 py-2">テーブル</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-100"><td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-slate-600">業務テーブル</td></tr>
            {renderRows('TABLE')}
            <tr className="bg-slate-100"><td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-slate-600">マスタ</td></tr>
            {renderRows('MASTER')}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length === 0 && (
        <p className="rounded border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          出力できるテーブルがありません。権限が付与されているかご確認ください。
        </p>
      )}
    </div>
  );
};

export default DataExportConsole;
