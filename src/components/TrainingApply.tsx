import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenIcon, CheckCircleIcon, PlusIcon, SparklesIcon } from './Icons';
import { Member, MemberType, Training } from '../types';

interface TrainingApplyProps {
  member: Member;
  activeStaffId?: string;
  trainings: Training[];
  onApply: (trainingId: string) => Promise<void>;
}

const formatDateTime = (raw: string) => {
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toPdfPreviewUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const m = url.match(/\/file\/d\/([^/]+)/);
    if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }
  return url;
};

const TrainingApply: React.FC<TrainingApplyProps> = ({ member, activeStaffId, trainings, onApply }) => {
  const [submittingTrainingId, setSubmittingTrainingId] = useState<string | null>(null);
  const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(null);
  const [selectedHistoryTrainingId, setSelectedHistoryTrainingId] = useState<string | null>(null);
  const [confirmTraining, setConfirmTraining] = useState<Training | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isBusiness = member.type === MemberType.BUSINESS;
  const currentStaff = isBusiness ? member.staff?.find((s) => s.id === activeStaffId) : null;
  const participatedIds = isBusiness
    ? (currentStaff?.participatedTrainingIds || [])
    : (member.participatedTrainingIds || []);

  const availableTrainings = useMemo(
    () => trainings.filter((t) => t.status === 'OPEN' && !participatedIds.includes(t.id)),
    [trainings, participatedIds],
  );
  const trainingHistory = useMemo(
    () => trainings.filter((t) => participatedIds.includes(t.id)),
    [trainings, participatedIds],
  );
  const selectedHistoryTraining = useMemo(
    () => trainingHistory.find((t) => t.id === selectedHistoryTrainingId) || null,
    [trainingHistory, selectedHistoryTrainingId],
  );
  const selectedPreviewUrl = selectedHistoryTraining?.guidePdfUrl ? toPdfPreviewUrl(selectedHistoryTraining.guidePdfUrl) : '';

  useEffect(() => {
    if (trainingHistory.length === 0) {
      setSelectedHistoryTrainingId(null);
      return;
    }
    const exists = trainingHistory.some((t) => t.id === selectedHistoryTrainingId);
    if (!exists) {
      setSelectedHistoryTrainingId(trainingHistory[0].id);
    }
  }, [trainingHistory, selectedHistoryTrainingId]);

  const hasPaidFee = (training: Training) => (training.fees || []).some((fee) => Number(fee.amount || 0) > 0);

  const openApplyConfirm = (training: Training) => {
    if (submittingTrainingId) return;
    setConfirmTraining(training);
  };

  const handleApply = async (training: Training) => {
    if (submittingTrainingId) return;

    try {
      setErrorMsg(null);
      setSubmittingTrainingId(training.id);
      await onApply(training.id);
      setSuccessMsg(`「${training.title}」への申し込みが完了しました。`);
      setSelectedHistoryTrainingId(training.id);
      setConfirmTraining(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '研修申込に失敗しました。');
    } finally {
      setSubmittingTrainingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">研修確認・申込</h2>
        <p className="text-slate-600 mt-2">
          受付中の研修を確認して申し込みできます。申し込み済み研修の詳細と案内PDFも確認できます。
        </p>
      </div>

      {successMsg && (
        <div className="bg-green-50 px-6 py-3 border border-green-200 rounded-lg flex items-center text-green-800 text-sm">
          <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
          <span className="font-bold">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-700 hover:text-green-900 font-bold">×</button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 px-6 py-3 border border-red-200 rounded-lg text-red-700 text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-blue-900 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
            現在受付中の研修
          </h3>
          <span className="text-xs font-medium bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
            申し込み可能: {availableTrainings.length}件
          </span>
        </div>
        <div className="p-6">
          {availableTrainings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              現在申し込み可能な研修はありません。
            </div>
          ) : (
            <div className="grid gap-4">
              {availableTrainings.map((training) => (
                <div key={training.id} className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">受付中</span>
                      <span className="text-sm text-slate-500">{formatDateTime(training.date)} 開催</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{training.title}</h4>
                    {training.summary && <p className="text-sm text-slate-600 mb-2">{training.summary}</p>}
                    <p className="text-sm text-slate-600">
                      {training.isOnline ? 'オンライン' : '現地'} / {training.location} / 定員 {training.capacity}名
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedTrainingId((prev) => (prev === training.id ? null : training.id))}
                        className="text-sm text-blue-700 hover:text-blue-900 underline"
                      >
                        {expandedTrainingId === training.id ? '詳細を閉じる' : '詳細を見る'}
                      </button>
                      {training.guidePdfUrl && (
                        <a href={training.guidePdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-700 hover:text-indigo-900 underline">
                          案内PDFを見る
                        </a>
                      )}
                    </div>
                    {expandedTrainingId === training.id && training.description && (
                      <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 max-w-xl">
                        {training.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openApplyConfirm(training)}
                    disabled={submittingTrainingId !== null}
                    className={`whitespace-nowrap font-bold py-2 px-6 rounded-lg shadow-sm transition-all flex items-center ${
                      submittingTrainingId === training.id
                        ? 'bg-slate-300 text-slate-500 cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {submittingTrainingId === training.id
                      ? '処理中...'
                      : (
                        <>
                          <PlusIcon className="w-4 h-4 mr-1" />
                          {hasPaidFee(training) ? '費用を確認して申し込む' : '申し込む'}
                        </>
                      )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <BookOpenIcon className="w-5 h-5 mr-2 text-slate-500" />
              研修受講・申込履歴
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            {trainingHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">受講履歴はありません。</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">開催日</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">研修名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">詳細</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {trainingHistory.map((t) => (
                    <tr key={t.id} className={selectedHistoryTrainingId === t.id ? 'bg-blue-50/50' : ''}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{formatDateTime(t.date)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">{t.title}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryTrainingId(t.id)}
                          className="text-sm text-blue-700 hover:text-blue-900 underline"
                        >
                          詳細を見る
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">申し込み済み研修の詳細</h3>
          </div>
          {!selectedHistoryTraining ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              表示する研修がありません。
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500">研修名</p>
                <p className="text-lg font-bold text-slate-900">{selectedHistoryTraining.title}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">開催日時</p>
                  <p className="text-slate-800">{formatDateTime(selectedHistoryTraining.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">開催形式</p>
                  <p className="text-slate-800">{selectedHistoryTraining.isOnline ? 'オンライン' : '現地開催'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">会場</p>
                  <p className="text-slate-800">{selectedHistoryTraining.location || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">主催者</p>
                  <p className="text-slate-800">{selectedHistoryTraining.organizer || '-'}</p>
                </div>
              </div>
              {selectedHistoryTraining.summary && (
                <div>
                  <p className="text-xs text-slate-500">概要</p>
                  <p className="text-sm text-slate-700">{selectedHistoryTraining.summary}</p>
                </div>
              )}
              {selectedHistoryTraining.description && (
                <div>
                  <p className="text-xs text-slate-500">詳細内容</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{selectedHistoryTraining.description}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">添付PDF</p>
                {selectedHistoryTraining.guidePdfUrl ? (
                  <div className="space-y-2">
                    <a
                      href={selectedHistoryTraining.guidePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-900 underline"
                    >
                      新しいタブでPDFを開く
                    </a>
                    <iframe
                      title={`pdf-preview-${selectedHistoryTraining.id}`}
                      src={selectedPreviewUrl}
                      className="w-full h-72 border border-slate-200 rounded"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">この研修にはPDFが添付されていません。</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmTraining(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="text-lg font-bold text-slate-900">研修申込の確認</h4>
            <p className="text-sm text-slate-700">
              「{confirmTraining.title}」へ申し込みます。
              {isBusiness && ` 申込名義: ${currentStaff?.name || '未選択'} 様`}
            </p>

            {hasPaidFee(confirmTraining) && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-900 mb-2">費用が設定されています。内容を確認してください。</p>
                <div className="space-y-1 text-sm text-amber-900">
                  {(confirmTraining.fees || []).map((fee) => (
                    <div key={`${confirmTraining.id}-${fee.label}`} className="flex justify-between">
                      <span>{fee.label}</span>
                      <span>¥{Number(fee.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTraining(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleApply(confirmTraining)}
                disabled={submittingTrainingId !== null}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
              >
                {submittingTrainingId === confirmTraining.id ? '申込中...' : 'この内容で申し込む'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingApply;
