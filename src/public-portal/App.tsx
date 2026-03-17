import React, { useEffect, useState } from 'react';
import { PublicTraining } from '../shared/types';
import { callApi } from '../shared/api-base';
import MemberApplicationForm from '../components/application/MemberApplicationForm';
import PublicTrainingList from './components/PublicTrainingList';
import ExternalApplyForm from './components/ExternalApplyForm';
import CancelForm from './components/CancelForm';

type View =
  | 'home'
  | 'training-list'
  | 'training-apply'
  | 'training-cancel'
  | 'training-complete'
  | 'member-application';

const PublicApp: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [trainings, setTrainings] = useState<PublicTraining[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<PublicTraining | null>(null);
  const [completedApplyId, setCompletedApplyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
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
    setView('training-apply');
  };

  const handleApplySuccess = (applyId: string) => {
    setCompletedApplyId(applyId);
    setView('training-complete');
  };

  const handleBackToHome = () => {
    setSelectedTraining(null);
    setCompletedApplyId('');
    setView('home');
  };

  const handleOpenTrainingList = () => {
    setSelectedTraining(null);
    setCompletedApplyId('');
    setView('training-list');
  };

  const handleBackToTrainingList = () => {
    setSelectedTraining(null);
    setCompletedApplyId('');
    setView('training-list');
  };

  const renderHome = () => (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Application Portal
          </p>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              研修申込と新規入会を、同じ公開ポータルから受け付けます。
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              このページはログイン不要です。最初にご希望の手続きを選択し、そのまま申込画面へ進んでください。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <button
          type="button"
          onClick={handleOpenTrainingList}
          className="group rounded-[28px] border border-sky-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_70%)] p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mb-5 inline-flex rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white">
            TRAINING
          </div>
          <h3 className="text-2xl font-bold text-slate-900">研修を申し込む</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            受付中の研修一覧を確認し、そのまま申込できます。申込後の取消も研修ページから行えます。
          </p>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="font-medium text-sky-700">
              {isLoading ? '研修情報を読み込み中です' : `${trainings.length} 件の受付中研修`}
            </span>
            <span className="font-semibold text-slate-900 transition group-hover:translate-x-0.5">進む →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setView('member-application')}
          className="group rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_70%)] p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mb-5 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white">
            MEMBERSHIP
          </div>
          <h3 className="text-2xl font-bold text-slate-900">新規入会を申し込む</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            個人会員、事業所会員、賛助会員の入会申込を受け付けます。登録後のログイン情報はメールで通知します。
          </p>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="font-medium text-emerald-700">ログイン不要で申込できます</span>
            <span className="font-semibold text-slate-900 transition group-hover:translate-x-0.5">進む →</span>
          </div>
        </button>
      </section>

      {loadError && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          研修一覧の取得でエラーが発生しています。新規入会申込はそのまま利用できます。
          <div className="mt-1">{loadError}</div>
        </section>
      )}
    </div>
  );

  const renderTrainingList = () => (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <button onClick={handleBackToHome} className="mb-3 text-sm font-medium text-sky-700 hover:underline">
            ← ポータルトップへ戻る
          </button>
          <h2 className="text-2xl font-bold text-slate-900">研修申込</h2>
          <p className="mt-1 text-sm text-slate-600">
            受付中の研修を確認し、申込または取消を行えます。
          </p>
        </div>
        <button
          onClick={() => setView('training-cancel')}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
        >
          申込を取消する
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">
          読み込み中...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      ) : (
        <PublicTrainingList trainings={trainings} onApply={handleApplyClick} />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef5f7_45%,#f8fafc_100%)]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">枚方市介護支援専門員連絡協議会お申込みポータル</h1>
            <p className="text-sm text-slate-500">研修申込・申込取消・新規入会申込</p>
          </div>
          {view !== 'home' && (
            <button
              type="button"
              onClick={handleBackToHome}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              トップへ戻る
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {view === 'home' && renderHome()}

        {view === 'training-list' && renderTrainingList()}

        {view === 'training-apply' && selectedTraining && (
          <ExternalApplyForm
            training={selectedTraining}
            onSuccess={handleApplySuccess}
            onCancel={handleBackToTrainingList}
          />
        )}

        {view === 'training-cancel' && (
          <CancelForm onCancel={handleBackToTrainingList} />
        )}

        {view === 'training-complete' && (
          <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-900">研修申込が完了しました</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              ご登録のメールアドレスに確認メールをお送りしました。
            </p>
            {completedApplyId && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="mb-1 text-slate-500">申込ID（取消時に必要です）</div>
                <div className="break-all font-mono font-medium text-slate-900">{completedApplyId}</div>
              </div>
            )}
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={handleBackToTrainingList}
                className="rounded-full bg-sky-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                研修一覧に戻る
              </button>
              <button
                onClick={handleBackToHome}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
              >
                ポータルトップへ戻る
              </button>
            </div>
          </div>
        )}

        {view === 'member-application' && (
          <MemberApplicationForm
            onBack={handleBackToHome}
            onComplete={handleBackToHome}
            title="新規入会申込"
            backLabel="ポータルトップへ戻る"
            completeLabel="ポータルトップへ戻る"
          />
        )}
      </main>
    </div>
  );
};

export default PublicApp;
