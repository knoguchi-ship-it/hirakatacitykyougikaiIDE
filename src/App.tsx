import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MemberForm from './components/MemberForm';
import Dashboard from './components/Dashboard';
import TrainingList from './components/TrainingList';
import { Member, MemberType, Training } from './types';
import { api } from './services/api';

type Role = 'ADMIN' | 'MEMBER';
type View = 'profile' | 'admin';
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

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<Role>('MEMBER');
  const [currentView, setCurrentView] = useState<View>('profile');
  const [demoPersona, setDemoPersona] = useState<DemoPersona>('INDIVIDUAL_MEMBER');

  const [members, setMembers] = useState<Member[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        const { members, trainings } = await api.fetchAllData();
        setMembers(members);
        setTrainings(trainings);
      } catch (error) {
        console.error('Initialization failed:', error);
        setInitError('データの読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('');

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
          事務局画面は今後、システム管理者画面と統合します。ここではシステム設定、コンテンツ編集、
          会費納入状況の管理、会員資格の変更などを一元的に扱う想定です。
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
        </div>

        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
