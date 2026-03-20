import React, { useState } from 'react';
import { Staff, Training } from '../types';
import { BookOpenIcon, CheckCircleIcon, SparklesIcon } from './Icons';
import { api } from '../services/api';

interface StaffTrainingViewProps {
  staff: Staff;
  memberId: string;
  trainings: Training[];
  canOperate: boolean; // 代表者・管理者 → true, 一般(自分) → true, 一般(他人) → false
  historyLookbackMonths: number;
  onClose: () => void;
  onUpdate: (staffId: string, trainingIds: string[]) => void;
}

const StaffTrainingView: React.FC<StaffTrainingViewProps> = ({
  staff,
  memberId,
  trainings,
  canOperate,
  historyLookbackMonths,
  onClose,
  onUpdate,
}) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const participatedIds = staff.participatedTrainingIds || [];

  const availableTrainings = trainings.filter(
    (t) => t.status === 'OPEN' && !participatedIds.includes(t.id)
  );

  const trainingHistory = trainings
    .filter((t) => participatedIds.includes(t.id))
    .filter((t) => {
      const date = new Date(t.date);
      if (Number.isNaN(date.getTime())) return true;
      const threshold = new Date();
      threshold.setMonth(threshold.getMonth() - Math.max(1, Math.floor(historyLookbackMonths || 18)));
      return date.getTime() >= threshold.getTime();
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleApply = async (trainingId: string) => {
    if (submittingId) return;
    const training = trainings.find((t) => t.id === trainingId);
    if (!training) return;
    if (!window.confirm(`「${training.title}」に\n職員: ${staff.name} 様の名義で申し込みますか？`)) return;
    setSubmittingId(trainingId);
    try {
      await api.applyTraining({ trainingId, memberId, staffId: staff.id });
      const newIds = [...participatedIds, trainingId];
      onUpdate(staff.id, newIds);
      setSuccessMsg(`「${training.title}」に申し込みました。`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : '研修申込に失敗しました。');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancel = async (trainingId: string) => {
    if (submittingId) return;
    const training = trainings.find((t) => t.id === trainingId);
    if (!training) return;
    if (!window.confirm(`「${training.title}」への申込を取り消しますか？`)) return;
    setSubmittingId(trainingId);
    try {
      await api.cancelTraining({ trainingId, memberId, staffId: staff.id });
      const newIds = participatedIds.filter((id) => id !== trainingId);
      onUpdate(staff.id, newIds);
      setSuccessMsg(`「${training.title}」の申込を取り消しました。`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : '取消に失敗しました。');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold text-blue-900 flex items-center">
            <BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
            {staff.name} 様の研修
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {successMsg && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center">
            <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
            {successMsg}
          </div>
        )}

        {/* 申し込み可能な研修 */}
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center">
            <SparklesIcon className="w-4 h-4 mr-1 text-yellow-500" />
            申し込み可能な研修
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{availableTrainings.length}件</span>
          </h3>
          {availableTrainings.length > 0 ? (
            <div className="space-y-3">
              {availableTrainings.map((t) => (
                <div key={t.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded mr-2">受付中</span>
                    <span className="text-sm text-slate-500">{t.date}</span>
                    <p className="font-bold text-slate-800 mt-1">{t.title}</p>
                  </div>
                  {canOperate && (
                    <button
                      type="button"
                      disabled={!!submittingId}
                      onClick={() => handleApply(t.id)}
                      className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
                    >
                      {submittingId === t.id ? '処理中...' : '申し込む'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">現在申し込み可能な研修はありません。</p>
          )}
        </div>

        {/* 申込済み研修 */}
        <div className="p-6">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center">
            <BookOpenIcon className="w-4 h-4 mr-1 text-slate-500" />
            申込済み研修
            <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{trainingHistory.length}件</span>
          </h3>
          {trainingHistory.length > 0 ? (
            <div className="space-y-2">
              {trainingHistory.map((t) => {
                const isOpen = t.status === 'OPEN';
                const canCancel = canOperate && isOpen && (t.cancelAllowed !== false);
                return (
                  <div key={t.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded mr-2 ${isOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isOpen ? '申込済' : '終了'}
                      </span>
                      <span className="text-sm text-slate-500">{t.date}</span>
                      <p className="font-medium text-slate-700 mt-1">{t.title}</p>
                    </div>
                    {canCancel && (
                      <button
                        type="button"
                        disabled={!!submittingId}
                        onClick={() => handleCancel(t.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-bold px-3 py-1 border border-red-200 rounded-lg disabled:opacity-50 whitespace-nowrap"
                      >
                        {submittingId === t.id ? '処理中...' : '取り消す'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">申込済みの研修はありません。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffTrainingView;
