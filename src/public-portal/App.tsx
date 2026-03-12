import React, { useState, useEffect } from 'react';
import { PublicTraining } from '../shared/types';
import { callApi } from '../shared/api-base';
import PublicTrainingList from './components/PublicTrainingList';
import ExternalApplyForm from './components/ExternalApplyForm';
import CancelForm from './components/CancelForm';

type View = 'list' | 'apply' | 'cancel' | 'complete';

const isMockMode = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true';

const MOCK_TRAININGS: PublicTraining[] = [
  {
    id: 'T001',
    name: '介護支援専門員 現任研修（サンプル）',
    date: '2026-04-15 10:00',
    capacity: 30,
    applicantCount: 5,
    location: '枚方市立総合文化芸術センター',
    summary: '介護支援専門員として必要な知識の更新を目的とした研修です。',
    content: '',
    cost: '[{"label":"会員","amount":0},{"label":"非会員","amount":1000}]',
    startDate: '2026-03-01 00:00',
    endDate: '2026-04-10 23:59',
    instructor: '講師 山田 先生',
    fileUrl: '',
    fieldConfig: '',
  },
];

const PublicApp: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [trainings, setTrainings] = useState<PublicTraining[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<PublicTraining | null>(null);
  const [completedApplyId, setCompletedApplyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (isMockMode) {
        setTrainings(MOCK_TRAININGS);
        setIsLoading(false);
        return;
      }
      try {
        const data = await callApi<PublicTraining[]>('getPublicTrainings');
        setTrainings(data ?? []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg || 'データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleApplyClick = (training: PublicTraining) => {
    setSelectedTraining(training);
    setView('apply');
  };

  const handleApplySuccess = (applyId: string) => {
    setCompletedApplyId(applyId);
    setView('complete');
  };

  const handleBackToList = () => {
    setSelectedTraining(null);
    setCompletedApplyId('');
    setView('list');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white py-4 px-4 shadow">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold">枚方市介護支援専門員連絡協議会</h1>
          <p className="text-sm text-blue-200">研修申込ポータル</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {view === 'list' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">受付中の研修</h2>
              <button
                onClick={() => setView('cancel')}
                className="text-sm text-blue-600 underline"
              >
                申込を取消する
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-gray-500">読み込み中...</div>
            ) : loadError ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
                {loadError}
              </div>
            ) : (
              <PublicTrainingList trainings={trainings} onApply={handleApplyClick} />
            )}
          </>
        )}

        {view === 'apply' && selectedTraining && (
          <ExternalApplyForm
            training={selectedTraining}
            onSuccess={handleApplySuccess}
            onCancel={handleBackToList}
          />
        )}

        {view === 'cancel' && (
          <CancelForm onCancel={handleBackToList} />
        )}

        {view === 'complete' && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">申込が完了しました</h2>
            <p className="text-sm text-gray-600 mb-2">
              ご登録のメールアドレスに確認メールをお送りしました。
            </p>
            {completedApplyId && (
              <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
                <div className="text-gray-600 mb-1">申込ID（取消時に必要です）</div>
                <div className="font-mono font-medium text-gray-900 break-all">{completedApplyId}</div>
              </div>
            )}
            <button
              onClick={handleBackToList}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              研修一覧に戻る
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicApp;
