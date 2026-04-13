import React, { useMemo, useState } from 'react';
import { ApiClient } from '../services/api';
import { TemplateValidationResult, TemplateValidationStatus } from '../shared/types';
import { AlertTriangleIcon, BookOpenIcon, CheckCircleIcon, SettingsIcon } from './Icons';

interface TemplateValidationPanelProps {
  api: ApiClient;
  rosterTemplateSsId: string;
  reminderTemplateSsId: string;
  onRosterTemplateChange: (value: string) => void;
  onReminderTemplateChange: (value: string) => void;
  onOpenHelp: () => void;
}

const statusCls: Record<TemplateValidationStatus, string> = {
  pass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  fail: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-slate-200 bg-slate-50 text-slate-800',
};

const summaryLabels: Record<'pass' | 'warn' | 'fail', string> = {
  pass: '利用可能',
  warn: '要確認',
  fail: '修正が必要',
};

const TemplateValidationPanel: React.FC<TemplateValidationPanelProps> = ({
  api,
  rosterTemplateSsId,
  reminderTemplateSsId,
  onRosterTemplateChange,
  onReminderTemplateChange,
  onOpenHelp,
}) => {
  const [busyKind, setBusyKind] = useState<'ROSTER' | 'REMINDER' | null>(null);
  const [rosterResult, setRosterResult] = useState<TemplateValidationResult | null>(null);
  const [reminderResult, setReminderResult] = useState<TemplateValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasAnyResult = useMemo(() => Boolean(rosterResult || reminderResult), [reminderResult, rosterResult]);

  const runValidation = async (kind: 'ROSTER' | 'REMINDER') => {
    try {
      setBusyKind(kind);
      setErrorMessage(null);
      const spreadsheetId = kind === 'ROSTER' ? rosterTemplateSsId : reminderTemplateSsId;
      const result = await api.validateTemplateSpreadsheet({ kind, spreadsheetId });
      if (kind === 'ROSTER') setRosterResult(result);
      else setReminderResult(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'テンプレート検証に失敗しました。');
    } finally {
      setBusyKind(null);
    }
  };

  const renderResult = (title: string, result: TemplateValidationResult | null) => {
    if (!result) return null;

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="text-base font-semibold text-slate-900">{title}</h5>
            <p className="mt-1 text-sm text-slate-600">{result.spreadsheetName}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusCls[result.summaryStatus]}`}>
            {summaryLabels[result.summaryStatus]}
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          {result.checks.map((check) => (
            <div key={check.key} className={`rounded-2xl border px-4 py-3 ${statusCls[check.status]}`}>
              <div className="text-sm font-semibold">{check.label}</div>
              <div className="mt-1 text-sm leading-6">{check.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">検出した表示シート</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              {result.visibleSheets.length > 0 ? result.visibleSheets.join(', ') : '該当なし'}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">推奨アクション</div>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
              {result.recommendedActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mt-4 rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            <SettingsIcon className="h-4 w-4" />
            テンプレート検証
          </div>
          <h4 className="mt-3 text-lg font-bold text-slate-900">URL または ID を入力し、保存前に構成を確認します。</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            スプレッドシート URL をそのまま貼り付けても保存時に ID へ正規化されます。検証では hidden シートや必要な表示シートの不足を確認できます。
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenHelp}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <BookOpenIcon className="h-4 w-4" />
          利用ガイドを開く
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <CheckCircleIcon className="h-5 w-5" />
            <h5 className="text-base font-semibold">名簿テンプレート</h5>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">スプレッドシート ID または URL</label>
          <input
            type="text"
            value={rosterTemplateSsId}
            onChange={(event) => onRosterTemplateChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => runValidation('ROSTER')}
              disabled={busyKind !== null}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {busyKind === 'ROSTER' ? '検証中...' : '名簿テンプレートを検証'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <AlertTriangleIcon className="h-5 w-5" />
            <h5 className="text-base font-semibold">催促状テンプレート</h5>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">スプレッドシート ID または URL</label>
          <input
            type="text"
            value={reminderTemplateSsId}
            onChange={(event) => onReminderTemplateChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => runValidation('REMINDER')}
              disabled={busyKind !== null}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {busyKind === 'REMINDER' ? '検証中...' : '催促状テンプレートを検証'}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {renderResult('名簿テンプレートの検証結果', rosterResult)}
        {renderResult('催促状テンプレートの検証結果', reminderResult)}
      </div>

      {!hasAnyResult && (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          まずは URL または ID を入力して検証してください。エラーの有無だけでなく、検出された表示シート名もここで確認できます。
        </div>
      )}
    </section>
  );
};

export default TemplateValidationPanel;
