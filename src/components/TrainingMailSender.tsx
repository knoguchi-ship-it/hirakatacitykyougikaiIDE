import React, { useEffect, useRef, useState } from 'react';
import { TrainingApplicantRow } from '../shared/types';
import { api, TrainingMailPayload, TrainingMailResult } from '../services/api';
import { TrashIcon } from './Icons';

interface Props {
  trainingId: string;
  trainingTitle: string;
  onBack: () => void;
}

// {{氏名}} / {{事業所名}} をタグ置換
const replaceMailTags = (template: string, row: TrainingApplicantRow): string =>
  template.replace(/\{\{氏名\}\}/g, row.name).replace(/\{\{事業所名\}\}/g, row.officeName || '');

const TrainingMailSender: React.FC<Props> = ({ trainingId, trainingTitle, onBack }) => {
  // ラベルと入力欄を結び付ける id（見えているラベルだけでは支援技術に伝わらない）
  const uid = React.useId();
  const [applicants, setApplicants] = useState<TrainingApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasWarning, setAliasWarning] = useState('');
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [commonAttachFile, setCommonAttachFile] = useState<File | null>(null);
  const [commonAttachBase64, setCommonAttachBase64] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 選択状態: null = 全員、Set<string> = 選択中
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null); // null = 全員
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const [preview, setPreview] = useState<TrainingApplicantRow | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<TrainingMailResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [rows, aliasResult] = await Promise.all([
          api.getTrainingApplicants(trainingId),
          api.getAdminEmailAliases(),
        ]);
        setApplicants(rows);
        // 2026-10-13: 戻り値は { aliases, warning }。以前は配列として扱い、選択肢が出なかった。
        const aliasList = Array.isArray(aliasResult?.aliases) ? aliasResult.aliases : [];
        setAliases(aliasList);
        setAliasWarning(String(aliasResult?.warning || ''));
        setFrom(aliasList[0] || '');
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : '申込者一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trainingId]);

  const effectiveTargets = applicants.filter((row) => {
    if (excludedIds.has(row.applyId)) return false;
    if (selectedIds === null) return true;
    return selectedIds.has(row.applyId);
  });

  const toggleSelect = (applyId: string) => {
    if (selectedIds === null) {
      // v376.13 fix: 全員選択モード（excludedIds による除外管理）で、再クリック時に
      //   除外を解除できないバグを修正。has なら delete (再選択)、無ければ add (除外)。
      const next = new Set(excludedIds);
      if (next.has(applyId)) next.delete(applyId);
      else next.add(applyId);
      setExcludedIds(next);
    } else {
      // 個別選択モード
      const next = new Set(selectedIds);
      if (next.has(applyId)) next.delete(applyId);
      else next.add(applyId);
      setSelectedIds(next);
    }
  };

  const isChecked = (applyId: string): boolean => {
    if (excludedIds.has(applyId)) return false;
    if (selectedIds === null) return true;
    return selectedIds.has(applyId);
  };

  const selectAll = () => {
    setSelectedIds(null);
    setExcludedIds(new Set());
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = () => reject(new Error('ファイル読み込みに失敗しました。'));
      reader.readAsDataURL(file);
    });

  const handleAttachChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSendError('添付ファイルは10MB以下にしてください。');
      return;
    }
    const b64 = await readFileAsBase64(file);
    setCommonAttachFile(file);
    setCommonAttachBase64(b64);
  };

  const removeAttach = () => {
    setCommonAttachFile(null);
    setCommonAttachBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (effectiveTargets.length === 0) {
      setSendError('送信対象者を選択してください。');
      return;
    }
    if (!from) {
      setSendError('送信元アドレスを選択してください。');
      return;
    }
    if (!subject.trim()) {
      setSendError('件名を入力してください。');
      return;
    }
    if (!body.trim()) {
      setSendError('本文を入力してください。');
      return;
    }

    // 2026-10-13: 以前は確認なしで 1 クリックで全員に送っていた
    if (!window.confirm(`${effectiveTargets.length} 名に「${subject.trim()}」を送信します。よろしいですか？`)) return;

    const payload: TrainingMailPayload = {
      trainingId,
      targetApplyIds: effectiveTargets.map((r) => r.applyId),
      from,
      subject,
      body,
      ...(commonAttachBase64 && commonAttachFile
        ? { commonAttachBase64, commonAttachFilename: commonAttachFile.name, commonAttachMime: commonAttachFile.type }
        : {}),
    };

    setSending(true);
    setSendError(null);
    setSendResult(null);
    try {
      const result = await api.sendTrainingMail(payload);
      setSendResult(result);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'メール送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-3" />
        <p className="text-sm">申込者一覧を読み込み中...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
        {loadError}
        <button type="button" className="ml-4 underline" onClick={onBack}>戻る</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* v376.8: header 簡素化 — タブで「メール送信」コンテキスト明示済なので二重見出しを廃止 */}
      <div className="flex flex-wrap items-baseline gap-3 pb-2 border-b border-slate-200">
        <span className="text-sm text-slate-500">📨 送信対象: {effectiveTargets.length} / {applicants.length} 名</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 申込者一覧 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              送信対象を選択
              <span className="ml-2 text-slate-400 font-normal text-xs">
                {effectiveTargets.length} / {applicants.length} 名
              </span>
            </h3>
            <div className="flex gap-1">
              <button type="button" onClick={selectAll}
                className="text-xs px-2 py-1 min-h-[32px] border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50">全員選択</button>
              <button type="button" onClick={deselectAll}
                className="text-xs px-2 py-1 min-h-[32px] border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50">全員解除</button>
            </div>
          </div>
          {applicants.length === 0 ? (
            <p className="p-4 text-sm text-slate-400 text-center">申込者がいません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium w-8">選択</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">氏名</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">事業所名</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">区分</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">メール</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applicants.map((row) => (
                    <tr key={row.applyId} className={isChecked(row.applyId) ? 'bg-primary-50' : 'bg-white opacity-50'}>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked(row.applyId)}
                          onChange={() => toggleSelect(row.applyId)}
                          aria-label={`${row.name} を送信対象にする`}
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{row.officeName || '—'}</td>
                      <td className="px-3 py-2">
                        {/* v376.12: STAFF (事業所職員) を独立した区分として表示 */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          row.applicantType === 'MEMBER' ? 'bg-primary-100 text-primary-700'
                          : row.applicantType === 'STAFF' ? 'bg-violet-100 text-violet-700'
                          : 'bg-orange-100 text-orange-700'
                        }`}>
                          {row.applicantType === 'MEMBER' ? '会員' : row.applicantType === 'STAFF' ? '事業所職員' : '非会員'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500 truncate max-w-[120px]">{row.email || '（未登録）'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 送信フォーム */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">メール作成</h3>
          </div>
          <div className="p-5 space-y-4">
            {/* 送信元 */}
            <div>
              <label htmlFor={`${uid}-from`} className="block text-sm font-medium text-slate-700 mb-1">
                送信元アドレス <span className="text-red-500">*</span>
              </label>
              {aliases.length > 0 ? (
                <select id={`${uid}-from`} aria-describedby={`${uid}-from-note`} className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)}>
                  {aliases.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              ) : (
                <input id={`${uid}-from`} aria-describedby={`${uid}-from-note`} className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="送信元メールアドレス" />
              )}
              {aliasWarning && <p className="text-xs text-amber-700 mt-1">{aliasWarning}</p>}
              <p id={`${uid}-from-note`} className="text-xs text-slate-400 mt-1">
                返信先（Reply-To）は送信元アドレスになります。
              </p>
            </div>

            {/* 件名 */}
            <div>
              <label htmlFor={`${uid}-f1`} className="block text-sm font-medium text-slate-700 mb-1">
                件名 <span className="text-red-500">*</span>
              </label>
              <input id={`${uid}-f1`}
                className={inputCls}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="例: 【研修ご案内】{{氏名}} 様"
              />
            </div>

            {/* 本文 */}
            <div>
              <label htmlFor={`${uid}-f2`} className="block text-sm font-medium text-slate-700 mb-1">
                本文 <span className="text-red-500">*</span>
              </label>
              <textarea id={`${uid}-f2`}
                className={inputCls}
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`{{氏名}} 様\n\n{{事業所名}} ご担当者様\n\n...`}
              />
              <p className="text-xs text-slate-400 mt-1">
                使用可能なタグ: <code className="bg-slate-100 px-1 rounded">&#123;&#123;氏名&#125;&#125;</code>{' '}
                <code className="bg-slate-100 px-1 rounded">&#123;&#123;事業所名&#125;&#125;</code>
              </p>
            </div>

            {/* 共通添付 */}
            <div>
              {/* 見出しは添付操作のまとまりの名前（選択後は入力欄が消えるため label ではなく見出しにする） */}
              <p className="block text-sm font-medium text-slate-700 mb-1">共通添付ファイル（全員に添付）</p>
              {commonAttachFile ? (
                <div className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="truncate flex-1">{commonAttachFile.name}</span>
                  <button type="button" onClick={removeAttach} className="text-slate-400 hover:text-red-500">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-primary-400">
                  ファイルを選択
                  {/* input を display:none（hidden）にするとキーボードでは選べない。sr-only で Tab 到達可能にし、枠にフォーカスを表示する */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    aria-label="共通添付ファイル（全員に添付）を選択"
                    onChange={handleAttachChange}
                  />
                </label>
              )}
            </div>

            {/* 2026-10-13: 「個別添付フォルダ」はサーバ側の照合が実装されておらず、入力しても添付されなかったため外した */}

            {/* プレビュー */}
            {applicants.length > 0 && (
              <div>
                <label htmlFor={`${uid}-f3`} className="block text-sm font-medium text-slate-700 mb-1">送信プレビュー</label>
                <select id={`${uid}-f3`}
                  className={inputCls}
                  value={preview?.applyId || ''}
                  onChange={(e) => setPreview(applicants.find((r) => r.applyId === e.target.value) || null)}
                >
                  <option value="">— 申込者を選択して確認 —</option>
                  {effectiveTargets.map((r) => (
                    <option key={r.applyId} value={r.applyId}>{r.name}</option>
                  ))}
                </select>
                {preview && (
                  <div className="mt-2 border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs space-y-2">
                    <p><span className="font-medium text-slate-600">件名: </span>{replaceMailTags(subject, preview)}</p>
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                      {replaceMailTags(body, preview)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {sendError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{sendError}</div>
            )}
            {sendResult && (
              <div className={`text-sm rounded-lg p-3 border ${sendResult.sent > 0 ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-800 bg-amber-50 border-amber-300'}`} role="status">
                <p>{sendResult.sent} 件送信しました。</p>
                {(sendResult.suppressed || 0) > 0 && (
                  <p className="mt-1 text-amber-800">
                    {sendResult.suppressed} 件は送っていません（{sendResult.suppressedReason === 'category_disabled'
                      ? 'システム設定で研修メールが無効になっています'
                      : 'メールの配信が停止中です'}）。
                  </p>
                )}
                {(sendResult.notFound || 0) > 0 && (
                  <p className="mt-1 text-amber-800">{sendResult.notFound} 件は申込が見つからず送っていません（取消・削除された可能性があります）。</p>
                )}
                {sendResult.errors.length > 0 && (
                  <p className="mt-1 text-red-600">送れなかった宛先: {sendResult.errors.join('、')}</p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-slate-500">送信対象: <strong>{effectiveTargets.length}</strong> 名</p>
              <button
                type="button"
                disabled={sending || effectiveTargets.length === 0}
                onClick={handleSend}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium"
              >
                {sending ? '送信中...' : `${effectiveTargets.length} 名に送信`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingMailSender;
