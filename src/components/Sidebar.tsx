import React, { useEffect, useState } from 'react';
import {
  BanknoteIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  ChevronDownIcon,
  FileTextIcon,
  LockIcon,
  SettingsIcon,
  UsersIcon,
} from './Icons';
import { Member, MemberType, AdminPermissionLevel } from '../types';
import { canAccessMenu } from '../shared/rbac-util';

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
  pendingChangeRequestCount?: number;
  // docs/246 Phase 3: 動的 allowedMenus ベース描画用
  isMaster?: boolean;
  allowedMenus?: string[];
  roleName?: string;
  /** Mobile drawer state. md+ ignores this and always shows the sidebar. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  id: string;          // view id (onChangeView に渡す値)
  menuId: string;      // docs/246 RBAC menu id (allowedMenus との照合に使う)
  label: string;
  masterOnly?: boolean;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  defaultOpen?: boolean;
}

const STORAGE_KEY = 'sidebar_groups_v1';

const loadGroupState = (defaults: Record<string, boolean>): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...defaults };
};

const saveGroupState = (state: Record<string, boolean>) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
};

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
  pendingChangeRequestCount = 0,
  isMaster: isMasterProp,
  allowedMenus,
  roleName,
  mobileOpen = false,
  onMobileClose,
}) => {
  // docs/246 Phase 3: allowedMenus が渡されていれば動的描画モード。
  // 渡されていない（旧 API caller、または session 未取得）場合は legacy 二択分岐に fallback。
  const hasDynamicMenus = Array.isArray(allowedMenus);
  const isMaster = isMasterProp ?? (adminPermissionLevel === 'MASTER');
  const isFullAdmin = adminPermissionLevel === 'MASTER' || adminPermissionLevel === 'ADMIN';
  const isTrainingOnly =
    adminPermissionLevel === 'TRAINING_MANAGER' ||
    adminPermissionLevel === 'TRAINING_REGISTRAR';

  const adminGroups: NavGroup[] = [
    {
      id: 'members',
      label: '会員管理',
      icon: <UsersIcon className="w-4 h-4" />,
      defaultOpen: true,
      items: [
        { id: 'admin',             menuId: 'members-list',         label: '会員一覧' },
        { id: 'change-requests',   menuId: 'change-requests',      label: '変更申請管理', badge: pendingChangeRequestCount },
      ],
    },
    {
      id: 'finance',
      label: '財務・帳票',
      icon: <BanknoteIcon className="w-4 h-4" />,
      defaultOpen: true,
      items: [
        { id: 'annual-fee-manage',  menuId: 'annual-fee',          label: '年会費管理' },
        { id: 'payment-history',    menuId: 'payment-history',     label: '支払い履歴管理' },
        { id: 'claim-management',   menuId: 'claim-management',    label: '請求管理' },
        { id: 'roster-export',      menuId: 'roster-export',       label: '名簿出力' },
        { id: 'mailing-list-export',menuId: 'mailing-list-export', label: '宛名リスト出力' },
      ],
    },
    {
      id: 'training',
      label: '研修・通知',
      icon: <CalendarIcon className="w-4 h-4" />,
      defaultOpen: true,
      items: [
        { id: 'training-manage', menuId: 'training-manage', label: '研修管理' },
        { id: 'bulk-mail',       menuId: 'bulk-mail',       label: '一括メール送信' },
        { id: 'line-post',       menuId: 'line-post',       label: '📱 公式LINE投稿依頼' },
      ],
    },
    {
      id: 'org',
      label: '組織管理',
      icon: <BuildingIcon className="w-4 h-4" />,
      defaultOpen: true,
      items: [
        { id: 'officer-management', menuId: 'officer-management', label: '役員管理' },
      ],
    },
  ];

  const systemGroup: NavGroup = {
    id: 'system',
    label: 'システム',
    icon: <SettingsIcon className="w-4 h-4" />,
    defaultOpen: false,
    items: [
      { id: 'admin-settings',     menuId: 'admin-settings',     label: 'システム設定' },
      { id: 'system-permissions', menuId: 'system-permissions', label: '権限管理', masterOnly: true },
      { id: 'member-delete',      menuId: 'data-management',    label: 'データ管理', masterOnly: true },
      // v376.68: 既定は MASTER のみ。MASTER が 権限管理 から data-export を付与すれば他ロールにも表示される
      { id: 'data-export',        menuId: 'data-export',        label: 'データ出力（CSV）' },
    ],
  };

  // docs/246 Phase 3: allowedMenus に基づき items を絞り込み。空グループは非表示。
  const isItemVisible = (item: NavItem): boolean => {
    if (!hasDynamicMenus) {
      // legacy fallback — masterOnly は MASTER のみ
      if (item.masterOnly && !isMaster) return false;
      return true;
    }
    return canAccessMenu({ isMaster, allowedMenus: allowedMenus as string[] }, item.menuId);
  };
  const filterGroup = (g: NavGroup): NavGroup => ({ ...g, items: g.items.filter(isItemVisible) });
  const visibleAdminGroups = adminGroups.map(filterGroup).filter((g) => g.items.length > 0);
  const visibleSystemGroup = filterGroup(systemGroup);

  const allGroups = [...adminGroups, systemGroup];

  const defaultOpen = allGroups.reduce<Record<string, boolean>>((acc, g) => {
    acc[g.id] = g.defaultOpen ?? true;
    return acc;
  }, {});

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => loadGroupState(defaultOpen),
  );

  // 現在のビューが属するグループを自動展開
  useEffect(() => {
    for (const g of allGroups) {
      if (g.items.some((item) => item.id === currentView)) {
        setOpenGroups((prev) => {
          if (prev[g.id]) return prev;
          const next = { ...prev, [g.id]: true };
          saveGroupState(next);
          return next;
        });
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveGroupState(next);
      return next;
    });
  };

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
      // docs/246 Phase 3: ロール名が判明していれば優先表示（カスタムロールも反映）
      const pLabel = roleName && roleName !== adminPermissionLevel
        ? roleName
        : permissionLabel(adminPermissionLevel);
      if (currentUser) return `管理者権限: ${pLabel}`;
      return `管理者権限: ${pLabel}`;
    }
    if (currentUser?.type === MemberType.BUSINESS) return memberPageTypeLabel;
    if (currentUser?.type === MemberType.INDIVIDUAL) return memberPageTypeLabel;
    if (currentUser?.type === MemberType.SUPPORT) return memberPageTypeLabel;
    if (role === 'ADMIN') return '管理者権限アカウント';
    return '';
  };

  const handleNavChange = (view: string) => {
    onChangeView(view);
    if (mobileOpen && onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        className={`bg-slate-900 text-white flex flex-col shadow-xl overflow-hidden z-50
          fixed inset-y-0 left-0 w-64 transform transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:w-56 md:h-full md:sticky md:top-0`}
      >
      {/* ヘッダー */}
      <div className="px-5 py-4 border-b border-slate-700/60">
        <h1 className="text-sm font-bold leading-snug tracking-tight text-white">
          枚方市<br />介護支援専門員<br />連絡協議会
        </h1>
        <p className="text-[10px] text-slate-400 mt-1">会員システム</p>
      </div>

      {/* ユーザー情報 */}
      <div className="px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              role === 'ADMIN' ? 'bg-primary-500' : 'bg-emerald-500'
            }`}
          >
            {role === 'ADMIN' ? 'A' : 'M'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{getUserDisplayName()}</p>
            <p className="text-[10px] text-slate-400 truncate">{getUserDisplayDetail()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2.5 w-full inline-flex min-h-[44px] items-center justify-center rounded border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        >
          ログアウト
        </button>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 py-2 overflow-y-auto overscroll-contain">

        {/* 会員マイページ（会員ログイン時） */}
        {showMemberPages && (
          <div className="px-2 pb-1">
            {[
              { id: 'profile', label: '会員マイページ', icon: <BookOpenIcon className="w-4 h-4" /> },
              { id: 'training-apply', label: '研修の申込み', icon: <CalendarIcon className="w-4 h-4" /> },
            ].map((item) => (
              <NavItemButton
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                active={currentView === item.id}
                onClick={() => handleNavChange(item.id)}
              />
            ))}
          </div>
        )}

        {/* 管理者メニュー（docs/246 Phase 3: allowedMenus ベース動的描画 / 旧ロールは legacy fallback） */}
        {showAdminPage && hasDynamicMenus && (
          <>
            {visibleAdminGroups.map((group) => (
              <NavGroupSection
                key={group.id}
                group={group}
                currentView={currentView}
                open={!!openGroups[group.id]}
                onToggle={() => toggleGroup(group.id)}
                onChangeView={handleNavChange}
              />
            ))}
            {visibleSystemGroup.items.length > 0 && (
              <>
                <div className="mx-3 my-2 border-t border-slate-700/60" />
                <NavGroupSection
                  group={visibleSystemGroup}
                  currentView={currentView}
                  open={!!openGroups[visibleSystemGroup.id]}
                  onToggle={() => toggleGroup(visibleSystemGroup.id)}
                  onChangeView={handleNavChange}
                  dimmed
                />
              </>
            )}
          </>
        )}

        {/* Legacy fallback: allowedMenus 未取得時のみ旧 2 択分岐で描画（session 取得前の一瞬を吸収） */}
        {showAdminPage && !hasDynamicMenus && isFullAdmin && (
          <>
            {adminGroups.map((group) => (
              <NavGroupSection
                key={group.id}
                group={group}
                currentView={currentView}
                open={!!openGroups[group.id]}
                onToggle={() => toggleGroup(group.id)}
                onChangeView={handleNavChange}
              />
            ))}
            <div className="mx-3 my-2 border-t border-slate-700/60" />
            <NavGroupSection
              group={{ ...systemGroup, items: systemGroup.items.filter((it) => !it.masterOnly || isMaster) }}
              currentView={currentView}
              open={!!openGroups[systemGroup.id]}
              onToggle={() => toggleGroup(systemGroup.id)}
              onChangeView={handleNavChange}
              dimmed
            />
          </>
        )}
        {showAdminPage && !hasDynamicMenus && isTrainingOnly && (
          <div className="px-2">
            <NavItemButton
              id="training-manage"
              label="研修管理"
              icon={<CalendarIcon className="w-4 h-4" />}
              active={currentView === 'training-manage'}
              onClick={() => handleNavChange('training-manage')}
            />
          </div>
        )}
      </nav>
    </aside>
    </>
  );
};

/* ── 内部コンポーネント ─────────────────────────────────────────── */

interface NavItemButtonProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  masterOnly?: boolean;
  badge?: number;
  indent?: boolean;
}

const NavItemButton: React.FC<NavItemButtonProps> = ({
  label,
  icon,
  active,
  onClick,
  masterOnly,
  badge,
  indent,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 min-h-[44px] py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
      indent ? 'pl-7' : ''
    } ${
      active
        ? 'bg-primary-600 text-white'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span className="flex-1 text-left truncate">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        active ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'
      }`}>
        {badge > 99 ? '99+' : badge}
      </span>
    )}
    {masterOnly && (
      <LockIcon className="w-3 h-3 shrink-0 opacity-60" />
    )}
  </button>
);

interface NavGroupSectionProps {
  group: NavGroup;
  currentView: string;
  open: boolean;
  onToggle: () => void;
  onChangeView: (view: string) => void;
  dimmed?: boolean;
}

const NavGroupSection: React.FC<NavGroupSectionProps> = ({
  group,
  currentView,
  open,
  onToggle,
  onChangeView,
  dimmed,
}) => {
  const hasActive = group.items.some((item) => item.id === currentView);

  return (
    <div className="px-2 pb-0.5">
      {/* グループヘッダー */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 min-h-[44px] py-2 rounded-md text-[11px] font-semibold tracking-wide transition-colors ${
          dimmed
            ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            : hasActive
            ? 'text-slate-200 hover:bg-slate-800'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
      >
        <span className={`shrink-0 ${hasActive && !dimmed ? 'text-slate-300' : ''}`}>
          {group.icon}
        </span>
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDownIcon
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {/* アイテム一覧 */}
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavItemButton
              key={item.id}
              id={item.id}
              label={item.label}
              active={currentView === item.id}
              onClick={() => onChangeView(item.id)}
              masterOnly={item.masterOnly}
              badge={item.badge}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
