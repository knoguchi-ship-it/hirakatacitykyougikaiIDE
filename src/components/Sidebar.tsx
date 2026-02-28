import React from 'react';
import { BookOpenIcon, HomeIcon } from './Icons';
import { Member, MemberType } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  role: 'ADMIN' | 'MEMBER';
  currentUser?: Member;
  memberPageTypeLabel: string;
  showAdminPage: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  role,
  currentUser,
  memberPageTypeLabel,
  showAdminPage,
}) => {
  const menuItems = [
    { id: 'profile', label: '会員マイページ', icon: <BookOpenIcon className="w-5 h-5" /> },
    ...(showAdminPage
      ? [{ id: 'admin', label: '管理者ページ', icon: <HomeIcon className="w-5 h-5" /> }]
      : []),
  ];

  const getUserDisplayName = () => {
    if (role === 'ADMIN') return 'システム管理者';
    if (currentUser) return `${currentUser.lastName} ${currentUser.firstName}`;
    return 'ゲスト';
  };

  const getUserDisplayDetail = () => {
    if (role === 'ADMIN') return '管理者権限アカウント';
    if (currentUser?.type === MemberType.BUSINESS) return memberPageTypeLabel;
    if (currentUser?.type === MemberType.INDIVIDUAL) return memberPageTypeLabel;
    return '';
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl transition-all duration-300">
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
      </div>

      <div className="px-4 pt-4 text-xs text-slate-400">
        会員マイページ種別: <span className="text-slate-200">{memberPageTypeLabel}</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
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
    </div>
  );
};

export default Sidebar;
