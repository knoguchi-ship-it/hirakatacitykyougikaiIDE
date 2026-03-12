import React, { useEffect, useRef, useState } from 'react';
import { TrainingApplicantRow } from '../shared/types';
import { api, TrainingMailPayload } from '../services/api';
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
  const [applicants, setApplicants] = useState<TrainingApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [aliases, setAliases] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [individualFolderUrl, setIndividualFolderUrl] = useState('');

  const [commonAttachFile, setCommonAttachFile] = useState<File | null>(null);
  const [commonAttachBase64, setCommonAttachBase64] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 選択状態: null = 全員、Set<string> = 選択中
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null); // null = 全員
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const [preview, setPreview] = useState<TrainingApplicantRow | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; errors: string[] } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [rows, aliasList] = await Promise.all([
          api.getTrainingApplicants(trainingId),
          api.getAdminEmailAliases(),
        ]);
        setApplicants(rows);
        setAliases(aliasList);
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
      // 全員 → 個別除外モードに切替
      const next = new Set(excludedIds);
      next.add(applyId);
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

    const payload: TrainingMailPayload = {
      trainingId,
      targetApplyIds: effectiveTargets.map((r) => r.applyId),
      from,
      subject,
      body,
      ...(commonAttachBase64 && commonAttachFile
        ? { commonAttachBase64, commonAttachFilename: commonAttachFile.name, commonAttachMime: commonAttachFile.type }
        : {}),
      ...(individualFolderUrl.trim() ? { individualFolderUrl: individualFolderUrl.trim() } : {}),
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
      {/* ヘッダー */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-700 text-sm border border-slate-300 rounded-lg px-3 py-1"
        >
          ← 編集に戻る
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">研修メール送信</h2>
          <p className="text-slate-500 text-xs mt-0.5">{trainingTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 申込者一覧 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm">
              申込者一覧
              <span className="ml-2 text-slate-400 font-normal text-xs">
                {effectiveTargets.length} / {applicants.length} 名選択中
              </span>
            </h3>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className="text-xs text-primary-600 hover:underline">全員選択</button>
              <button type="button" onClick={deselectAll} className="text-xs text-slate-500 hover:underline">全員解除</button>
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
                    <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">個別添付</th>
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
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{row.officeName || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.applicantType === 'MEMBER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {row.applicantType === 'MEMBER' ? '会員' : '非会員'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500 truncate max-w-[120px]">{row.email}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {individualFolderUrl ? '照合待ち' : '—'}
                      </td>
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
            <h3 className="font-semibold text-slate-700 text-sm">メール作成</h3>
          </div>
          <div className="p-5 space-y-4">
            {/* 送信元 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                送信元アドレス <span className="text-red-500">*</span>
              </label>
              {aliases.length > 0 ? (
                <select className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)}>
                  {aliases.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              ) : (
                <input className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="送信元メールアドレス" />
              )}
              <p className="text-xs text-slate-400 mt-1">
                Reply-To には現在ログイン中の管理者メールアドレスが自動設定されます。
              </p>
            </div>

            {/* 件名 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                件名 <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="例: 【研修ご案内】{{氏名}} 様"
              />
            </div>

            {/* 本文 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                本文 <span className="text-red-500">*</span>
              </label>
              <textarea
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
              <label className="block text-sm font-medium text-slate-700 mb-1">共通添付ファイル（全員に添付）</label>
              {commonAttachFile ? (
                <div className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="truncate flex-1">{commonAttachFile.name}</span>
                  <button type="button" onClick={removeAttach} className="text-slate-400 hover:text-red-500">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                  ファイルを選択
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleAttachChange}
                  />
                </label>
              )}
            </div>

            {/* 個別添付フォルダ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">個別添付フォルダ（Drive URL または ID）</label>
              <input
                className={inputCls}
                value={individualFolderUrl}
                onChange={(e) => setIndividualFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
              />
              <p className="text-xs text-slate-400 mt-1">
                フォルダ内のファイル名（拡張子除く）が申込者の氏名と一致する場合、自動で個別添付されます。
              </p>
            </div>

            {/* プレビュー */}
            {applicants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">送信プレビュー</label>
                <select
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
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                {sendResult.sent} 件送信完了。
                {sendResult.errors.length > 0 && (
                  <p className="mt-1 text-red-600">エラー: {sendResult.errors.join(', ')}</p>
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
