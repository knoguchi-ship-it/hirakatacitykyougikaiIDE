import React from 'react';
import { HomeIcon, UsersIcon, BookOpenIcon, MailIcon } from './Icons';
import { Member, MemberType } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  role: 'ADMIN' | 'MEMBER';
  currentUser?: Member;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, role, currentUser }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <HomeIcon className="w-5 h-5" />, roles: ['ADMIN'] },
    { id: 'members', label: '会員管理', icon: <UsersIcon className="w-5 h-5" />, roles: ['ADMIN'] },
    { id: 'profile', label: '会員マイページ', icon: <BookOpenIcon className="w-5 h-5" />, roles: ['MEMBER'] }, // Renamed and Icon changed implies broader scope
    { id: 'training', label: '研修管理', icon: <MailIcon className="w-5 h-5" />, roles: ['ADMIN'] },
  ];

  const displayItems = menuItems.filter(item => item.roles.includes(role));

  const getUserDisplayName = () => {
    if (role === 'ADMIN') return '事務局 管理者';
    if (currentUser) return `${currentUser.lastName} ${currentUser.firstName}`;
    return 'ゲスト';
  };

  const getUserDisplayDetail = () => {
    if (role === 'ADMIN') return 'admin@hirakata-care.jp';
    if (currentUser) {
        // Business members are also treated as Regular members
        return currentUser.type === MemberType.BUSINESS ? '正会員 (事業所)' : '正会員 (個人)';
    }
    return '';
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl transition-all duration-300">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">枚方市<br/>介護支援専門員<br/>連絡協議会</h1>
        <p className="text-xs text-slate-400 mt-2">
            {role === 'ADMIN' ? '事務局 管理画面' : '会員ポータル'}
        </p>
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
      <nav className="flex-1 p-4 space-y-2">
        {displayItems.map((item) => (
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