import React, { useEffect, useRef, useState } from 'react';
import { PublicTraining } from '../shared/types';
import { callApi } from '../shared/api-base';
import MemberApplicationForm from '../components/application/MemberApplicationForm';
import PublicTrainingList from './components/PublicTrainingList';
import ExternalApplyForm from './components/ExternalApplyForm';
import CancelForm from './components/CancelForm';

type PublicPortalContentSettings = {
  heroBadgeEnabled: boolean;
  heroBadgeLabel: string;
  heroTitle: string;
  heroDescriptionEnabled: boolean;
  heroDescription: string;
  membershipBadgeEnabled: boolean;
  membershipBadgeLabel: string;
  membershipTitleEnabled: boolean;
  membershipTitle: string;
  membershipDescriptionEnabled: boolean;
  membershipDescription: string;
  membershipCtaLabel: string;
  completionLoginInfoVisible: boolean;
  credentialEmailEnabled: boolean;
};

type View =
  | 'home'
  | 'training-list'
  | 'training-apply'
  | 'training-cancel'
  | 'training-complete'
  | 'member-application';

const DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS: PublicPortalContentSettings = {
  heroBadgeEnabled: false,
  heroBadgeLabel: 'お申込みポータル',
  heroTitle: '研修申込・申込取消・新規入会申込を受け付けています',
  heroDescriptionEnabled: false,
  heroDescription: 'ご希望の手続きを選択し、そのまま申込画面へ進んでください。',
  membershipBadgeEnabled: true,
  membershipBadgeLabel: '入会申込',
  membershipTitleEnabled: true,
  membershipTitle: '新規入会を申し込む',
  membershipDescriptionEnabled: true,
  membershipDescription: '個人会員・事業所会員・賛助会員の入会申込を受け付けています。',
  membershipCtaLabel: '入会申込へ進む',
  completionLoginInfoVisible: true,
  credentialEmailEnabled: true,
};

const PublicApp: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [trainings, setTrainings] = useState<PublicTraining[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<PublicTraining | null>(null);
  const [completedApplyId, setCompletedApplyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // null = 未確定（ローディング中）。設定確定前は一切描画しない（FOIC防止）
  const [trainingMenuEnabled, setTrainingMenuEnabled] = useState<boolean | null>(null);
  const [membershipMenuEnabled, setMembershipMenuEnabled] = useState<boolean | null>(null);
  const [portalContentSettings, setPortalContentSettings] = useState<PublicPortalContentSettings | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  const viewTitles: Record<View, string> = {
    'home': 'ポータルトップ',
    'training-list': '研修一覧',
    'training-apply': '研修申込',
    'training-cancel': '申込取消',
    'training-complete': '申込完了',
    'member-application': '新規入会申込',
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus();
    setAnnouncement(viewTitles[view]);
    document.title = `${viewTitles[view]} | 枚方市介護支援専門員連絡協議会`;
  }, [view]);

  useEffect(() => {
    const load = async () => {
      try {
        const [trainingsData, portalSettings] = await Promise.allSettled([
          callApi<PublicTraining[]>('getPublicTrainings'),
          callApi<{ trainingMenuEnabled: boolean; membershipMenuEnabled: boolean } & PublicPortalContentSettings>('getPublicPortalSettings'),
        ]);
        if (trainingsData.status === 'fulfilled') {
          setTrainings(trainingsData.value ?? []);
        } else {
          const msg = trainingsData.reason instanceof Error ? trainingsData.reason.message : String(trainingsData.reason);
          setLoadError(msg || 'データの取得に失敗しました。');
        }
        // 設定取得成功時は確定値をセット。失敗時はフォールバックとして全表示（fail-open）
        if (portalSettings.status === 'fulfilled' && portalSettings.value) {
          setTrainingMenuEnabled(portalSettings.value.trainingMenuEnabled !== false);
          setMembershipMenuEnabled(portalSettings.value.membershipMenuEnabled !== false);
          setPortalContentSettings({
            heroBadgeEnabled: portalSettings.value.heroBadgeEnabled ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.heroBadgeEnabled,
            heroBadgeLabel: portalSettings.value.heroBadgeLabel || DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.heroBadgeLabel,
            heroTitle: portalSettings.value.heroTitle || DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.heroTitle,
            heroDescriptionEnabled: portalSettings.value.heroDescriptionEnabled ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.heroDescriptionEnabled,
            heroDescription: portalSettings.value.heroDescription || DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.heroDescription,
            membershipBadgeEnabled: portalSettings.value.membershipBadgeEnabled ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.membershipBadgeEnabled,
            membershipBadgeLabel: portalSettings.value.membershipBadgeLabel || DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.membershipBadgeLabel,
            membershipTitleEnabled: portalSettings.value.membershipTitleEnabled ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.membershipTitleEnabled,
            membershipTitle: portalSettings.value.membershipTitle || DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.membershipTitle,
            membershipDescriptionEnabled: portalSettings.value.membershipDescriptionEnabled ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.membershipDescriptionEnabled,
            membershipDescription: portalSettings.value.membershipDescription || DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.membershipDescription,
            membershipCtaLabel: portalSettings.value.membershipCtaLabel || DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.membershipCtaLabel,
            completionLoginInfoVisible: portalSettings.value.completionLoginInfoVisible ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.completionLoginInfoVisible,
            credentialEmailEnabled: portalSettings.value.credentialEmailEnabled ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.credentialEmailEnabled,
          });
        } else {
          setTrainingMenuEnabled(true);
          setMembershipMenuEnabled(true);
          setPortalContentSettings(DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS);
        }
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

  const renderHome = () => {
    const content = portalContentSettings ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS;
    return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-10">
        <div className="max-w-3xl space-y-4">
          {content.heroBadgeEnabled && (
            <p className="text-sm font-semibold tracking-[0.12em] text-sky-700">
              {content.heroBadgeLabel}
            </p>
          )}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {content.heroTitle}
            </h2>
            {content.heroDescriptionEnabled && (
              <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {content.heroDescription}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 設定確定前は Skeleton を表示。設定未確定のまま誤ったカードを瞬間描画しない（FOIC防止） */}
      {(trainingMenuEnabled === null || membershipMenuEnabled === null) ? (
        <section className="grid gap-6 md:grid-cols-2" aria-busy="true" aria-label="読み込み中">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 h-6 w-24 rounded-full bg-slate-200" />
              <div className="h-7 w-40 rounded-lg bg-slate-200" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
                <div className="h-4 w-4/6 rounded bg-slate-100" />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="h-4 w-14 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </section>
      ) : (trainingMenuEnabled || membershipMenuEnabled) ? (
        <section className={`grid gap-6 ${trainingMenuEnabled && membershipMenuEnabled ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-xl'}`}>
          {trainingMenuEnabled && (
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
                <span className="font-medium text-sky-700">{`${trainings.length} 件の受付中研修`}</span>
                <span className="font-semibold text-slate-900 transition group-hover:translate-x-0.5">進む →</span>
              </div>
            </button>
          )}

          {membershipMenuEnabled && (
            <button
              type="button"
              onClick={() => setView('member-application')}
              className="group rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_70%)] p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {content.membershipBadgeEnabled && (
                <div className="mb-5 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-white">
                  {content.membershipBadgeLabel}
                </div>
              )}
              {content.membershipTitleEnabled && (
                <h3 className="text-2xl font-bold text-slate-900">{content.membershipTitle}</h3>
              )}
              {content.membershipDescriptionEnabled && (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {content.membershipDescription}
                </p>
              )}
              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900 transition group-hover:translate-x-0.5">{content.membershipCtaLabel} →</span>
              </div>
            </button>
          )}
        </section>
      ) : (
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-12 shadow-sm text-center">
          <p className="text-2xl mb-3">🔧</p>
          <h3 className="text-lg font-bold text-slate-800">現在準備中です</h3>
          <p className="mt-2 text-sm text-slate-600">申込受付を一時停止しています。しばらく経ってから再度アクセスしてください。</p>
        </section>
      )}

      {loadError && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          研修一覧の取得でエラーが発生しています。新規入会申込はそのまま利用できます。
          <div className="mt-1">{loadError}</div>
        </section>
      )}
    </div>
  );
  };

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-sky-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        メインコンテンツへスキップ
      </a>
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

      <div aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>

      <main ref={mainRef} id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 outline-none">
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
            showCompletionLoginInfo={portalContentSettings?.completionLoginInfoVisible ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.completionLoginInfoVisible}
            credentialEmailEnabled={portalContentSettings?.credentialEmailEnabled ?? DEFAULT_PUBLIC_PORTAL_CONTENT_SETTINGS.credentialEmailEnabled}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <p className="text-xs text-slate-500">
            &copy; 枚方市介護支援専門員連絡協議会
          </p>
          <p className="text-xs text-slate-500">
            プライバシーポリシーは本サイトに掲載しています。
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicApp;
