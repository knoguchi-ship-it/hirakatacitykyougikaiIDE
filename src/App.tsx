import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MemberForm from './components/MemberForm';
import Dashboard from './components/Dashboard';
import TrainingList from './components/TrainingList';
import { Member, MemberType, Training } from './types';
import { api } from './services/api';

type Role = 'ADMIN' | 'MEMBER';
type View = 'profile' | 'admin';
type AuthTab = 'member' | 'admin';
type DemoPersona =
  | 'INDIVIDUAL_MEMBER'
  | 'BUSINESS_ADMIN_MEMBER'
  | 'BUSINESS_STAFF_MEMBER'
  | 'SYSTEM_ADMIN';

interface LoginIdentity {
  id: string;
  label: string;
  memberId: string;
  staffId?: string;
  type: MemberType;
  staffRole?: 'ADMIN' | 'STAFF';
}

declare global {
  interface Window {
    google?: any;
  }
}

const isMockMode = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<Role>('MEMBER');
  const [currentView, setCurrentView] = useState<View>('profile');
  const [demoPersona, setDemoPersona] = useState<DemoPersona>('INDIVIDUAL_MEMBER');

  const [members, setMembers] = useState<Member[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isMockMode);
  const [authTab, setAuthTab] = useState<AuthTab>('member');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [memberLoginId, setMemberLoginId] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [adminIdToken, setAdminIdToken] = useState('');
  const [adminGoogleClientId, setAdminGoogleClientId] = useState('');
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('');

  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        const [{ members, trainings }, authConfig] = await Promise.all([
          api.fetchAllData(),
          api.getAuthConfig().catch(() => ({ adminGoogleClientId: '' })),
        ]);
        setMembers(members);
        setTrainings(trainings);
        setAdminGoogleClientId(authConfig.adminGoogleClientId || '');
      } catch (error) {
        console.error('Initialization failed:', error);
        setInitError('データの読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (isMockMode || !adminGoogleClientId) return;
    if (document.getElementById('google-gsi-client')) {
      setGoogleScriptReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptReady(true);
    script.onerror = () => setGoogleScriptReady(false);
    document.head.appendChild(script);
  }, [adminGoogleClientId]);

  const loginIdentities: LoginIdentity[] = useMemo(() => {
    return members.flatMap((member): LoginIdentity[] => {
      if (member.type === MemberType.INDIVIDUAL) {
        return [{
          id: member.id,
          label: `個人会員: ${member.lastName} ${member.firstName}`,
          memberId: member.id,
          type: MemberType.INDIVIDUAL,
        }];
      }
      return (member.staff || []).map((staff) => ({
        id: `${member.id}-${staff.id}`,
        label: `事業所会員: ${member.officeName} - ${staff.name} (${staff.role === 'ADMIN' ? '管理者' : 'メンバー'})`,
        memberId: member.id,
        staffId: staff.id,
        staffRole: staff.role,
        type: MemberType.BUSINESS,
      }));
    });
  }, [members]);

  const matchesPersona = (identity: LoginIdentity, persona: DemoPersona): boolean => {
    switch (persona) {
      case 'INDIVIDUAL_MEMBER':
        return identity.type === MemberType.INDIVIDUAL;
      case 'BUSINESS_ADMIN_MEMBER':
        return identity.type === MemberType.BUSINESS && identity.staffRole === 'ADMIN';
      case 'BUSINESS_STAFF_MEMBER':
        return identity.type === MemberType.BUSINESS && identity.staffRole === 'STAFF';
      case 'SYSTEM_ADMIN':
        return true;
      default:
        return true;
    }
  };

  const findIdentityForPersona = (persona: DemoPersona): LoginIdentity | undefined => {
    return loginIdentities.find((identity) => matchesPersona(identity, persona));
  };

  useEffect(() => {
    if (!loginIdentities.length) return;

    if (isMockMode) {
      if (!selectedIdentityId) {
        const fallback = findIdentityForPersona(demoPersona) || loginIdentities[0];
        if (fallback) setSelectedIdentityId(fallback.id);
        return;
      }
      const selected = loginIdentities.find((i) => i.id === selectedIdentityId);
      if (!selected) {
        const fallback = findIdentityForPersona(demoPersona) || loginIdentities[0];
        if (fallback) setSelectedIdentityId(fallback.id);
        return;
      }
      if (!matchesPersona(selected, demoPersona) && demoPersona !== 'SYSTEM_ADMIN') {
        const fallback = findIdentityForPersona(demoPersona) || loginIdentities[0];
        if (fallback) setSelectedIdentityId(fallback.id);
      }
      return;
    }

    if (!selectedIdentityId) {
      setSelectedIdentityId(loginIdentities[0].id);
      return;
    }
    if (!loginIdentities.some((i) => i.id === selectedIdentityId)) {
      setSelectedIdentityId(loginIdentities[0].id);
    }
  }, [demoPersona, loginIdentities, selectedIdentityId]);

  const currentIdentity = loginIdentities.find((i) => i.id === selectedIdentityId) || loginIdentities[0];
  const currentUser = currentIdentity ? members.find((m) => m.id === currentIdentity.memberId) : undefined;

  const memberPageTypeLabel = useMemo(() => {
    if (!currentIdentity) return '未選択';
    if (currentIdentity.type === MemberType.INDIVIDUAL) return '個人会員';
    if (currentIdentity.staffRole === 'ADMIN') return '事業所会員（管理者）';
    return '事業所会員（メンバー）';
  }, [currentIdentity]);

  const selectableIdentities = useMemo(() => {
    if (demoPersona === 'SYSTEM_ADMIN') return loginIdentities;
    return loginIdentities.filter((identity) => matchesPersona(identity, demoPersona));
  }, [demoPersona, loginIdentities]);

  const applyAuthContext = (ctx: { memberId: string; staffId?: string; canAccessAdminPage: boolean }) => {
    const targetId = ctx.staffId ? `${ctx.memberId}-${ctx.staffId}` : ctx.memberId;
    const found = loginIdentities.find((i) => i.id === targetId);
    setSelectedIdentityId(found ? found.id : (loginIdentities[0]?.id || ''));
    setUserRole(ctx.canAccessAdminPage ? 'ADMIN' : 'MEMBER');
    setCurrentView(ctx.canAccessAdminPage ? 'admin' : 'profile');
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthBusy(true);
      setAuthError(null);
      const result = await api.memberLogin(memberLoginId.trim(), memberPassword);
      applyAuthContext(result);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'ログインに失敗しました。');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAdminGoogleLogin = async (idToken: string) => {
    try {
      setAuthBusy(true);
      setAuthError(null);
      const result = await api.adminGoogleLogin(idToken);
      applyAuthContext(result);
      setUserRole('ADMIN');
      setCurrentView('admin');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google認証に失敗しました。');
    } finally {
      setAuthBusy(false);
    }
  };

  const startGoogleSignIn = () => {
    if (!adminGoogleClientId) {
      setAuthError('管理者GoogleログインのクライアントIDが未設定です。');
      return;
    }
    if (!window.google?.accounts?.id) {
      setAuthError('Google認証ライブラリの読み込みに失敗しました。');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: adminGoogleClientId,
      callback: (response: { credential?: string }) => {
        if (!response?.credential) {
          setAuthError('Google認証結果を取得できませんでした。');
          return;
        }
        handleAdminGoogleLogin(response.credential);
      },
    });
    window.google.accounts.id.prompt();
  };

  const handleMemberSave = async (updatedMember: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    try {
      await api.updateMember(updatedMember);
    } catch (e) {
      console.error('Sync failed:', e);
      alert('保存に失敗しました。');
    }
  };

  const switchPersona = (persona: DemoPersona) => {
    setDemoPersona(persona);
    if (persona === 'SYSTEM_ADMIN') {
      setUserRole('ADMIN');
      setCurrentView('admin');
      return;
    }
    setUserRole('MEMBER');
    setCurrentView('profile');
    const target = findIdentityForPersona(persona);
    if (target) setSelectedIdentityId(target.id);
  };

  const handleIdentityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIdentityId(e.target.value);
  };

  const logout = () => {
    setIsAuthenticated(isMockMode);
    setUserRole('MEMBER');
    setCurrentView('profile');
    setAuthTab('member');
    setAuthError(null);
    setMemberPassword('');
  };

  const renderMemberList = () => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">会員一覧</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">会員番号</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">氏名/事業所</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">会員種別</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">会費(最新)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-sm font-mono text-slate-600">{m.id}</td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {m.type === MemberType.BUSINESS ? m.officeName : `${m.lastName} ${m.firstName}`}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {m.type === MemberType.INDIVIDUAL ? '個人会員' : '事業所会員'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {m.annualFeeHistory[0]?.status === 'PAID' ? '納入済' : '未納'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminPage = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">管理者ページ</h2>
        <p className="text-slate-600 mt-2 leading-relaxed">
          管理者ログイン時のみ表示されます。会員ページと管理者ページを同一セッションで利用できます。
        </p>
      </div>
      <Dashboard />
      {renderMemberList()}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">研修管理</h3>
        <TrainingList trainings={trainings} />
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4"></div>
          <p>データを読み込み中です...</p>
        </div>
      );
    }

    if (initError) {
      return <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded">{initError}</div>;
    }

    if (!isAuthenticated) {
      return (
        <div className="max-w-lg mx-auto mt-20 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">ログイン</h1>
          <p className="text-sm text-slate-600 mb-5">会員はログインID/パスワード、管理者のみGoogle認証を使用します。</p>
          <div className="flex gap-2 mb-4">
            <button className={`px-3 py-2 rounded ${authTab === 'member' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} onClick={() => setAuthTab('member')}>
              会員ログイン
            </button>
            <button className={`px-3 py-2 rounded ${authTab === 'admin' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} onClick={() => setAuthTab('admin')}>
              管理者ログイン
            </button>
          </div>

          {authTab === 'member' ? (
            <form className="space-y-3" onSubmit={handleMemberLogin}>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="ログインID"
                value={memberLoginId}
                onChange={(e) => setMemberLoginId(e.target.value)}
              />
              <input
                className="w-full border border-slate-300 rounded px-3 py-2"
                type="password"
                placeholder="パスワード"
                value={memberPassword}
                onChange={(e) => setMemberPassword(e.target.value)}
              />
              <button className="w-full bg-slate-800 text-white rounded px-3 py-2" disabled={authBusy} type="submit">
                ログイン
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                className="w-full bg-slate-800 text-white rounded px-3 py-2 disabled:opacity-50"
                disabled={authBusy || !googleScriptReady || !adminGoogleClientId}
                onClick={startGoogleSignIn}
              >
                Googleで管理者ログイン
              </button>
              {!adminGoogleClientId && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  `ADMIN_GOOGLE_CLIENT_ID` が未設定です（Script Properties）。
                </p>
              )}
              <details className="text-xs text-slate-600">
                <summary className="cursor-pointer">IDトークンを直接入力（保守用）</summary>
                <textarea
                  className="w-full border border-slate-300 rounded px-2 py-2 mt-2"
                  placeholder="Google IDトークン"
                  rows={3}
                  value={adminIdToken}
                  onChange={(e) => setAdminIdToken(e.target.value)}
                />
                <button className="mt-2 w-full bg-slate-200 rounded px-3 py-2" onClick={() => handleAdminGoogleLogin(adminIdToken)}>
                  トークンで管理者ログイン
                </button>
              </details>
            </div>
          )}

          {authError && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{authError}</div>}
        </div>
      );
    }

    if (currentView === 'admin') {
      if (userRole !== 'ADMIN') {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return renderAdminPage();
    }

    if (!currentUser) {
      return <div className="p-8 text-center text-slate-500">会員データが見つかりません。</div>;
    }

    return (
      <MemberForm
        initialMember={currentUser}
        activeStaffId={currentIdentity?.staffId}
        trainings={trainings}
        onSave={handleMemberSave}
      />
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        currentView={currentView}
        onChangeView={(view) => setCurrentView(view as View)}
        role={userRole}
        currentUser={currentUser}
        memberPageTypeLabel={memberPageTypeLabel}
        showAdminPage={userRole === 'ADMIN'}
      />
      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="absolute top-4 right-8 bg-white p-2 rounded-lg shadow border border-slate-200 z-10 flex space-x-2 items-center">
          {isMockMode ? (
            <>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Demo</span>
              <select
                className="text-sm border-slate-300 rounded p-1 bg-slate-50"
                value={demoPersona}
                onChange={(e) => switchPersona(e.target.value as DemoPersona)}
              >
                <option value="INDIVIDUAL_MEMBER">個人会員</option>
                <option value="BUSINESS_ADMIN_MEMBER">事業所会員（管理者）</option>
                <option value="BUSINESS_STAFF_MEMBER">事業所会員（メンバー）</option>
                <option value="SYSTEM_ADMIN">管理者アカウント</option>
              </select>
              <select
                className="text-sm border-slate-300 rounded p-1 bg-slate-50 max-w-xl"
                value={currentIdentity?.id || ''}
                onChange={handleIdentityChange}
              >
                {selectableIdentities.map((identity) => (
                  <option key={identity.id} value={identity.id}>
                    {identity.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-500 px-2">{isAuthenticated ? 'ログイン中' : '未ログイン'}</span>
              {isAuthenticated && (
                <button className="text-sm border border-slate-300 rounded px-2 py-1 bg-slate-50" onClick={logout}>
                  ログアウト
                </button>
              )}
            </>
          )}
        </div>
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
