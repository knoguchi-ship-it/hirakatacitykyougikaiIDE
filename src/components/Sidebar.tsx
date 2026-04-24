import React from 'react';
import { BookOpenIcon, HomeIcon, CalendarIcon, SettingsIcon } from './Icons';
import { Member, MemberType, AdminPermissionLevel } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  role: 'ADMIN' | 'MEMBER';
  currentUser?: Member;
  currentStaffName?: string;
  memberPageTypeLabel: string;
  showAdminPage: boolean;
  showMemberPages?: boolean;
  adminPermissionLevel?: AdminPermissionLevel | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  onLogout,
  role,
  currentUser,
  currentStaffName,
  memberPageTypeLabel,
  showAdminPage,
  showMemberPages = true,
  adminPermissionLevel,
}) => {
  const isFullAdmin = adminPermissionLevel === 'MASTER' || adminPermissionLevel === 'ADMIN';
  const isTrainingOnly = adminPermissionLevel === 'TRAINING_MANAGER' || adminPermissionLevel === 'TRAINING_REGISTRAR';

  const menuItems = [
    ...(showMemberPages
      ? [
          { id: 'profile', label: '会員マイページ', icon: <BookOpenIcon className="w-5 h-5" /> },
          { id: 'training-apply', label: '研修受講の申込み', icon: <CalendarIcon className="w-5 h-5" /> },
        ]
      : []),
    ...(showAdminPage && isFullAdmin
      ? [
          { id: 'admin', label: '管理コンソール（会員管理）', icon: <HomeIcon className="w-5 h-5" /> },
          { id: 'annual-fee-manage', label: '年会費管理コンソール', icon: <HomeIcon className="w-5 h-5" /> },
          { id: 'training-manage', label: '研修管理コンソール', icon: <CalendarIcon className="w-5 h-5" /> },
          { id: 'bulk-mail', label: '一括メール送信コンソール', icon: <HomeIcon className="w-5 h-5" /> },
          { id: 'roster-export', label: '名簿出力コンソール', icon: <HomeIcon className="w-5 h-5" /> },
          { id: 'mailing-list-export', label: '宛名リスト出力コンソール', icon: <HomeIcon className="w-5 h-5" /> },
          { id: 'change-requests', label: '変更申請管理コンソール', icon: <HomeIcon className="w-5 h-5" /> },
          { id: 'system-permissions', label: '管理コンソール（システム権限）', icon: <SettingsIcon className="w-5 h-5" /> },
          { id: 'admin-settings', label: 'システム設定', icon: <SettingsIcon className="w-5 h-5" /> },
          ...(adminPermissionLevel === 'MASTER'
            ? [{ id: 'member-delete', label: 'データ管理コンソール', icon: <SettingsIcon className="w-5 h-5" /> }]
            : []),
        ]
      : []),
    ...(showAdminPage && isTrainingOnly
      ? [
          { id: 'training-manage', label: '研修管理コンソール', icon: <CalendarIcon className="w-5 h-5" /> },
        ]
      : []),
  ];

  const permissionLabel = (level?: AdminPermissionLevel | null) => {
    const map: Record<string, string> = {
      MASTER: 'マスター',
      ADMIN: '管理者',
      TRAINING_MANAGER: '研修管理者',
      TRAINING_REGISTRAR: '研修登録者',
      GENERAL: '一般',
    };
    return level ? map[level] || '' : '';
  };

  const getUserDisplayName = () => {
    if (currentStaffName) return currentStaffName;
    if (currentUser) return `${currentUser.lastName} ${currentUser.firstName}`.trim();
    if (role === 'ADMIN') return 'システム管理者';
    return 'ゲスト';
  };

  const getUserDisplayDetail = () => {
    if (role === 'ADMIN' && adminPermissionLevel) {
      const pLabel = permissionLabel(adminPermissionLevel);
      if (currentUser) return `${memberPageTypeLabel} / 管理者権限: ${pLabel}`;
      return `管理者権限: ${pLabel}`;
    }
    if (currentUser?.type === MemberType.BUSINESS) return memberPageTypeLabel;
    if (currentUser?.type === MemberType.INDIVIDUAL) return memberPageTypeLabel;
    if (currentUser?.type === MemberType.SUPPORT) return memberPageTypeLabel;
    if (role === 'ADMIN') return '管理者権限アカウント';
    return '';
  };

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen sticky top-0 flex flex-col shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">
          枚方市
          <br />
          介護支援専門員
          <br />
          連絡協議会
        </h1>
        <p className="text-xs text-slate-400 mt-2">会員システム</p>
      </div>

      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${role === 'ADMIN' ? 'bg-primary-500' : 'bg-green-500'}`}>
            {role === 'ADMIN' ? 'A' : 'M'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{getUserDisplayName()}</p>
            <p className="text-xs text-slate-400 truncate">{getUserDisplayDetail()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
        >
          ログアウト
        </button>
      </div>

      <div className="px-4 pt-4 text-xs text-slate-400">
        会員マイページ種別: <span className="text-slate-200">{memberPageTypeLabel}</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overscroll-contain">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              currentView === item.id
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
