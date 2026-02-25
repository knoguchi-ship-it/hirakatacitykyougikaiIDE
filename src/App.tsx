import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MemberForm from './components/MemberForm';
import TrainingList from './components/TrainingList';
import { Member, MemberType, Training } from './types';
import { api } from './services/api';

type Role = 'ADMIN' | 'MEMBER';

interface LoginIdentity {
  id: string; // Unique key for the dropdown
  label: string;
  memberId: string;
  staffId?: string; // Only for business members
  type: MemberType;
}

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<Role>('MEMBER');
  const [currentView, setCurrentView] = useState('profile');
  
  // --- Data State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // --- Initial Data Fetch ---
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        const { members, trainings } = await api.fetchAllData();
        setMembers(members);
        setTrainings(trainings);
      } catch (error) {
        console.error("Initialization failed:", error);
        setInitError("データの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // --- Identity / Login Logic ---
  // State for the currently selected identity (Member + optional Staff)
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('');

  // Generate a flat list of all possible login identities from the fetched members
  const loginIdentities: LoginIdentity[] = useMemo(() => {
    return members.flatMap((member): LoginIdentity[] => {
      if (member.type === MemberType.INDIVIDUAL) {
        return [{
          id: member.id,
          label: `👤 ${member.lastName} ${member.firstName} (個人)`,
          memberId: member.id,
          type: MemberType.INDIVIDUAL
        }];
      } else {
        // For Business, create an identity for EACH staff member
        return (member.staff || []).map(staff => ({
          id: `${member.id}-${staff.id}`,
          label: `🏢 ${member.officeName} - ${staff.name} (${staff.role === 'ADMIN' ? '管理者' : '一般'})`,
          memberId: member.id,
          staffId: staff.id,
          type: MemberType.BUSINESS
        }));
      }
    });
  }, [members]);

  // Set default identity once data is loaded
  useEffect(() => {
    if (!selectedIdentityId && loginIdentities.length > 0) {
        // Try to find a demo business user (e.g., Tanaka Saburo) or default to first
        const defaultUser = loginIdentities.find(i => i.label.includes('田中')) || loginIdentities[0];
        setSelectedIdentityId(defaultUser.id);
    }
  }, [loginIdentities, selectedIdentityId]);

  // Resolve current objects based on selection
  const currentIdentity = loginIdentities.find(i => i.id === selectedIdentityId) || loginIdentities[0];
  const currentUser = currentIdentity ? members.find(m => m.id === currentIdentity.memberId) : undefined;

  // --- Actions ---
  const handleMemberSave = async (updatedMember: Member) => {
    // 1. Optimistic UI Update (Immediate reflection)
    setMembers(prevMembers => 
      prevMembers.map(m => m.id === updatedMember.id ? updatedMember : m)
    );

    // 2. Background Sync
    try {
        await api.updateMember(updatedMember);
        console.log("Member synced to backend.");
    } catch (e) {
        console.error("Sync failed:", e);
        alert("データの保存に失敗しました。通信環境を確認してください。");
        // In a real app, we might revert the optimistic update here
    }
  };

  const switchRole = (role: Role) => {
    setUserRole(role);
    if (role === 'ADMIN') {
        setCurrentView('dashboard');
    } else {
        setCurrentView('profile');
    }
  };

  const handleIdentityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIdentityId(e.target.value);
  };

  // --- View Routing ---
  const renderContent = () => {
    if (userRole === 'MEMBER' && currentView !== 'profile') {
        return <div className="text-red-500 p-4">このページにはアクセス権限がありません。</div>;
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4"></div>
                <p>データを読み込んでいます...</p>
            </div>
        );
    }

    if (initError) {
        return <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded">{initError}</div>;
    }

    if (!currentUser && userRole === 'MEMBER') {
        return <div className="p-8 text-center text-slate-500">ユーザーデータが見つかりません。</div>;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />; // Dashboard can be updated to accept props too, but keeping it simple for now
      case 'profile':
        return currentUser ? (
          <MemberForm 
            initialMember={currentUser} 
            activeStaffId={currentIdentity.staffId} 
            trainings={trainings} // Pass dynamic trainings
            onSave={handleMemberSave} 
          />
        ) : null;
      case 'training':
        return <TrainingList trainings={trainings} />; // Pass dynamic trainings
      case 'members':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">会員管理 (管理者ビュー)</h2>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-slate-500">
                             Google Sheets連携データベース <br/>
                             <span className="text-xs text-slate-400">({members.length} records loaded)</span>
                        </p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Sync Active</span>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">登録番号</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">氏名</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">区分</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">通信手段</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">会費(最新)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {members.map(m => (
                                    <tr key={m.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{m.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {m.lastName} {m.firstName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {m.type === 'INDIVIDUAL' ? '個人' : '事業所'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.mailingPreference === 'EMAIL' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {m.mailingPreference === 'EMAIL' ? 'メール' : '郵送'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                             {m.annualFeeHistory[0]?.status === 'PAID' ? '済' : <span className="text-red-500 font-bold">未</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} role={userRole} currentUser={currentUser} />
      <main className="flex-1 p-8 overflow-y-auto relative">
        {/* Role Toggle for Demo */}
        <div className="absolute top-4 right-8 bg-white p-2 rounded-lg shadow border border-slate-200 z-10 flex space-x-2 items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center px-2">Demo Mode</span>
            
            {userRole === 'MEMBER' && (
                <select 
                    className="text-sm border-slate-300 rounded p-1 mr-2 bg-slate-50 max-w-xs"
                    value={selectedIdentityId}
                    onChange={handleIdentityChange}
                >
                    {loginIdentities.map(identity => (
                        <option key={identity.id} value={identity.id}>
                            {identity.label}
                        </option>
                    ))}
                </select>
            )}

            <button 
                onClick={() => switchRole('MEMBER')} 
                className={`px-3 py-1 text-sm rounded transition-colors ${userRole === 'MEMBER' ? 'bg-green-100 text-green-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                会員
            </button>
            <button 
                onClick={() => switchRole('ADMIN')} 
                className={`px-3 py-1 text-sm rounded transition-colors ${userRole === 'ADMIN' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                事務局
            </button>
        </div>

        <div className="max-w-6xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;