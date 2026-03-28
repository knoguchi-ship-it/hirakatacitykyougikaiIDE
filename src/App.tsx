import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MemberBatchEditor from './MemberBatchEditor';
import MemberForm from './components/MemberForm';
import TrainingManagement from './components/TrainingManagement';
import TrainingApply from './components/TrainingApply';
import AnnualFeeManagement from './components/AnnualFeeManagement';
import MemberDetailAdmin from './components/MemberDetailAdmin';
import StaffDetailAdmin from './components/StaffDetailAdmin';
import { AdminDashboardData, AdminDashboardMemberRow, AdminPermissionData, AdminPermissionEntry, AdminPermissionLevel, Member, MemberType, Training } from './types';
import { api } from './services/api';

type Role = 'ADMIN' | 'MEMBER';
type View = 'profile' | 'training-apply' | 'admin' | 'annual-fee-manage' | 'training-manage' | 'member-detail' | 'staff-detail' | 'system-permissions' | 'admin-settings';
type AuthTab = 'member' | 'admin';
type PendingAnnualFeeAction = { type: 'view'; view: View } | { type: 'logout' } | null;
type MemberListFilter = 'ALL' | MemberType;
type MemberStatusFilter = 'ALL' | 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN';
type MemberSortKey = 'memberId' | 'displayName' | 'memberType' | 'trainingCount' | 'tenure' | 'status';
type MemberSortDir = 'asc' | 'desc';
const DEFAULT_MEMBER_PAGE_SIZE = 50;

interface LoginIdentity {
  id: string;
  label: string;
  memberId: string;
  staffId?: string;
  type: MemberType;
  staffRole?: 'REPRESENTATIVE' | 'ADMIN' | 'STAFF';
}

declare global {
  interface Window {
    google?: any;
  }
}

const buildLoginIdentities = (members: Member[]): LoginIdentity[] =>
  members.flatMap((member): LoginIdentity[] => {
    if (member.type !== MemberType.BUSINESS) {
      return [{
        id: member.id,
        label: `${member.type === MemberType.SUPPORT ? '賛助会員' : '個人会員'}: ${member.lastName} ${member.firstName}`,
        memberId: member.id,
        type: member.type,
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

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<Role>('MEMBER');
  const [currentView, setCurrentView] = useState<View>('profile');
  const [annualFeeHasUnsavedChanges, setAnnualFeeHasUnsavedChanges] = useState(false);
  const [pendingAnnualFeeAction, setPendingAnnualFeeAction] = useState<PendingAnnualFeeAction>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [fullDataLoaded, setFullDataLoaded] = useState(false);
  const [memberPortalLoaded, setMemberPortalLoaded] = useState(false);
  const [adminDashboardData, setAdminDashboardData] = useState<AdminDashboardData | null>(null);
  const [adminDashboardLoading, setAdminDashboardLoading] = useState(false);
  const [adminDashboardError, setAdminDashboardError] = useState<string | null>(null);
  const [trainingManagementLoaded, setTrainingManagementLoaded] = useState(false);
  const [trainingManagementLoading, setTrainingManagementLoading] = useState(false);
  const [trainingManagementError, setTrainingManagementError] = useState<string | null>(null);
  const [adminPermissionData, setAdminPermissionData] = useState<AdminPermissionData | null>(null);
  const [adminPermissionLoading, setAdminPermissionLoading] = useState(false);
  const [adminPermissionError, setAdminPermissionError] = useState<string | null>(null);
  const [adminPermissionQuery, setAdminPermissionQuery] = useState('');
  const [adminPermissionFilterLevel, setAdminPermissionFilterLevel] = useState<AdminPermissionLevel | 'ALL'>('ALL');
  const [adminPermissionSortKey, setAdminPermissionSortKey] = useState<'googleEmail' | 'permissionLevel' | 'updatedByAt'>('permissionLevel');
  const [adminPermissionSortDir, setAdminPermissionSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [newPermissionIdentitySearch, setNewPermissionIdentitySearch] = useState('');
  const [editPermissionIdentitySearches, setEditPermissionIdentitySearches] = useState<Record<string, string>>({});
  const [adminPermissionDrafts, setAdminPermissionDrafts] = useState<Record<string, {
    googleEmail: string;
    linkedAuthId: string;
    permissionLevel: AdminPermissionLevel;
    enabled: boolean;
  }>>({});
  const [newAdminPermission, setNewAdminPermission] = useState({
    googleEmail: '',
    linkedAuthId: '',
    permissionLevel: 'ADMIN' as AdminPermissionLevel,
    enabled: true,
  });
  const [adminPermissionLevel, setAdminPermissionLevel] = useState<AdminPermissionLevel | null>(null);
  const [systemSettingsLoaded, setSystemSettingsLoaded] = useState(false);
  const annualFeeLeaveDialogRef = useRef<HTMLDialogElement | null>(null);
  const appDataRequestRef = useRef<Promise<{ members: Member[]; trainings: Training[] }> | null>(null);
  const memberPortalRequestRef = useRef<Promise<{ members: Member[]; trainings: Training[] }> | null>(null);
  const adminDashboardRequestRef = useRef<Promise<AdminDashboardData> | null>(null);
  const trainingManagementRequestRef = useRef<Promise<Training[]> | null>(null);
  const adminPermissionRequestRef = useRef<Promise<AdminPermissionData> | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<AuthTab>('member');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [memberLoginId, setMemberLoginId] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [defaultBusinessStaffLimit, setDefaultBusinessStaffLimit] = useState(10);
  const [globalLimitInput, setGlobalLimitInput] = useState('10');
  const [trainingHistoryLookbackMonths, setTrainingHistoryLookbackMonths] = useState(18);
  const [historyLookbackInput, setHistoryLookbackInput] = useState('18');
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [memberListQuery, setMemberListQuery] = useState('');
  const [memberListFilter, setMemberListFilter] = useState<MemberListFilter>('ALL');
  const [memberListStatusFilter, setMemberListStatusFilter] = useState<MemberStatusFilter>('ACTIVE');
  const [memberListFiscalYearFilter, setMemberListFiscalYearFilter] = useState<string>('ALL');
  const [memberListPage, setMemberListPage] = useState(1);
  const [memberListPageSize, setMemberListPageSize] = useState(DEFAULT_MEMBER_PAGE_SIZE);
  const [memberSortKey, setMemberSortKey] = useState<MemberSortKey>('displayName');
  const [memberSortDir, setMemberSortDir] = useState<MemberSortDir>('asc');
  const [selectedMemberForDetailId, setSelectedMemberForDetailId] = useState<string | null>(null);
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<{ memberId: string; staffId: string } | null>(null);
  const [staffSaveToast, setStaffSaveToast] = useState<string | null>(null);
  const [withdrawingMemberId, setWithdrawingMemberId] = useState<string | null>(null);

  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('');
  const [authenticatedContext, setAuthenticatedContext] = useState<{ memberId: string; staffId?: string } | null>(null);

  const applySystemSettings = (systemSettings: { defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }) => {
    const limit = Number(systemSettings.defaultBusinessStaffLimit || 10);
    const lookback = Number(systemSettings.trainingHistoryLookbackMonths || 18);
    const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
    const normalizedLookback = Number.isFinite(lookback) && lookback > 0 ? Math.floor(lookback) : 18;
    setDefaultBusinessStaffLimit(normalizedLimit);
    setGlobalLimitInput(String(normalizedLimit));
    setTrainingHistoryLookbackMonths(normalizedLookback);
    setHistoryLookbackInput(String(normalizedLookback));
    setSystemSettingsLoaded(true);
  };

  const loadAppData = async (
    options: { includeAdminSettings?: boolean; force?: boolean; silent?: boolean } = {},
  ): Promise<{ members: Member[]; trainings: Training[] }> => {
    const { includeAdminSettings = false, force = false, silent = false } = options;
    if (!force && appDataRequestRef.current) {
      return appDataRequestRef.current;
    }

    const request = (async () => {
      try {
        if (!silent) setIsLoading(true);
        if (!silent) setInitError(null);
        const [{ members: nextMembers, trainings: nextTrainings }, systemSettings] = await Promise.all([
          api.fetchAllData(),
          includeAdminSettings
            ? api.getSystemSettings().catch(() => ({ defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18 }))
            : Promise.resolve(null),
        ]);
        setMembers(nextMembers);
        setTrainings(nextTrainings);
        setFullDataLoaded(true);
        setMemberPortalLoaded(true);
        setTrainingManagementLoaded(true);
        if (systemSettings) {
          applySystemSettings(systemSettings);
        }
        return { members: nextMembers, trainings: nextTrainings };
      } catch (error) {
        console.error('Initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'データの読み込みに失敗しました。');
        throw error;
      } finally {
        if (!silent) setIsLoading(false);
      }
    })();

    appDataRequestRef.current = request;
    try {
      return await request;
    } finally {
      if (appDataRequestRef.current === request) {
        appDataRequestRef.current = null;
      }
    }
  };

  const loadMemberPortalData = async (
    memberId: string,
    options: { force?: boolean } = {},
  ): Promise<{ members: Member[]; trainings: Training[] }> => {
    const { force = false } = options;
    if (!memberId) {
      throw new Error('memberId が未指定です。');
    }
    if (!force && memberPortalRequestRef.current) {
      return memberPortalRequestRef.current;
    }

    const request = (async () => {
      try {
        setIsLoading(true);
        setInitError(null);
        const next = await api.getMemberPortalData(memberId);
        setMembers(next.members);
        setTrainings(next.trainings);
        setMemberPortalLoaded(true);
        return next;
      } catch (error) {
        console.error('Member portal initialization failed:', error);
        setInitError(error instanceof Error ? error.message : '会員ページの読み込みに失敗しました。');
        throw error;
      } finally {
        setIsLoading(false);
      }
    })();

    memberPortalRequestRef.current = request;
    try {
      return await request;
    } finally {
      if (memberPortalRequestRef.current === request) {
        memberPortalRequestRef.current = null;
      }
    }
  };

  const loadAdminDashboardData = async (
    options: { force?: boolean } = {},
  ): Promise<AdminDashboardData> => {
    const { force = false } = options;
    if (!force && adminDashboardRequestRef.current) {
      return adminDashboardRequestRef.current;
    }

    const request = (async () => {
      try {
        setAdminDashboardLoading(true);
        setAdminDashboardError(null);
        const next = await api.getAdminDashboardData();
        setAdminDashboardData(next);
        return next;
      } catch (error) {
        console.error('Admin dashboard initialization failed:', error);
        setAdminDashboardError(error instanceof Error ? error.message : '管理コンソールの読み込みに失敗しました。');
        throw error;
      } finally {
        setAdminDashboardLoading(false);
      }
    })();

    adminDashboardRequestRef.current = request;
    try {
      return await request;
    } finally {
      if (adminDashboardRequestRef.current === request) {
        adminDashboardRequestRef.current = null;
      }
    }
  };

  const loadTrainingManagementData = async (
    options: { force?: boolean } = {},
  ): Promise<Training[]> => {
    const { force = false } = options;
    if (!force && trainingManagementRequestRef.current) {
      return trainingManagementRequestRef.current;
    }

    const request = (async () => {
      try {
        setTrainingManagementLoading(true);
        setTrainingManagementError(null);
        const next = await api.getTrainingManagementData();
        setTrainings(next);
        setTrainingManagementLoaded(true);
        return next;
      } catch (error) {
        console.error('Training management initialization failed:', error);
        setTrainingManagementError(error instanceof Error ? error.message : '研修管理コンソールの読み込みに失敗しました。');
        throw error;
      } finally {
        setTrainingManagementLoading(false);
      }
    })();

    trainingManagementRequestRef.current = request;
    try {
      return await request;
    } finally {
      if (trainingManagementRequestRef.current === request) {
        trainingManagementRequestRef.current = null;
      }
    }
  };

  const loadAdminPermissionData = async (
    options: { force?: boolean } = {},
  ): Promise<AdminPermissionData> => {
    const { force = false } = options;
    if (!force && adminPermissionRequestRef.current) {
      return adminPermissionRequestRef.current;
    }

    const request = (async () => {
      try {
        setAdminPermissionLoading(true);
        setAdminPermissionError(null);
        const next = await api.getAdminPermissionData();
        setAdminPermissionData(next);
        return next;
      } catch (error) {
        console.error('Admin permission initialization failed:', error);
        setAdminPermissionError(error instanceof Error ? error.message : 'システム権限データの読み込みに失敗しました。');
        throw error;
      } finally {
        setAdminPermissionLoading(false);
      }
    })();

    adminPermissionRequestRef.current = request;
    try {
      return await request;
    } finally {
      if (adminPermissionRequestRef.current === request) {
        adminPermissionRequestRef.current = null;
      }
    }
  };

  const loadSystemSettings = async (force = false) => {
    if (systemSettingsLoaded && !force) {
      return;
    }
    const settings = await api.getSystemSettings().catch(() => ({
      defaultBusinessStaffLimit: 10,
      trainingHistoryLookbackMonths: 18,
    }));
    applySystemSettings(settings);
  };

  useEffect(() => {
    const next: Record<string, {
      googleEmail: string;
      linkedAuthId: string;
      permissionLevel: AdminPermissionLevel;
      enabled: boolean;
    }> = {};
    (adminPermissionData?.entries || []).forEach((entry) => {
      next[entry.id] = {
        googleEmail: entry.googleEmail || '',
        linkedAuthId: entry.linkedAuthId || '',
        permissionLevel: entry.permissionLevel || 'ADMIN',
        enabled: entry.enabled,
      };
    });
    setAdminPermissionDrafts(next);
  }, [adminPermissionData]);

  const refreshAllData = async () => {
    const tasks: Promise<unknown>[] = [];
    const activeMemberId = currentIdentity?.memberId || authenticatedContext?.memberId;
    if (activeMemberId && memberPortalLoaded) {
      tasks.push(loadMemberPortalData(activeMemberId, { force: true }));
    }
    if (fullDataLoaded) {
      tasks.push(loadAppData({ includeAdminSettings: userRole === 'ADMIN', force: true }));
    }
    if (userRole === 'ADMIN') {
      tasks.push(loadAdminDashboardData({ force: true }));
      if (trainingManagementLoaded) {
        tasks.push(loadTrainingManagementData({ force: true }));
      }
    }
    await Promise.all(tasks);
  };


  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const activeIdentities = buildLoginIdentities(members);
    const activeIdentity = activeIdentities.find((identity) => identity.id === selectedIdentityId) || activeIdentities[0];
    const activeMemberId = activeIdentity?.memberId || authenticatedContext?.memberId;

    if (userRole === 'ADMIN' && currentView === 'admin') {
      loadAdminDashboardData().catch(() => undefined);
      loadSystemSettings(false).catch(() => undefined);
      return;
    }

    if (userRole === 'ADMIN' && currentView === 'training-manage') {
      loadTrainingManagementData().catch(() => undefined);
      return;
    }

    if (userRole === 'ADMIN' && !systemSettingsLoaded) {
      loadSystemSettings(false).catch(() => undefined);
    }

    if (currentView === 'annual-fee-manage' || currentView === 'member-detail' || currentView === 'staff-detail') {
      return;
    }

    if (userRole === 'ADMIN' && currentView === 'admin-settings') {
      loadSystemSettings(false).catch(() => undefined);
      return;
    }

    if (userRole === 'ADMIN' && currentView === 'system-permissions') {
      loadAdminPermissionData().catch(() => undefined);
      return;
    }

    if (currentView === 'profile' || currentView === 'training-apply') {
      if (activeMemberId && !memberPortalLoaded) {
        loadMemberPortalData(activeMemberId, { force: true }).catch(() => undefined);
      }
      return;
    }

    if (!fullDataLoaded) {
      loadAppData({ includeAdminSettings: userRole === 'ADMIN', force: true }).catch(() => undefined);
    }
  }, [authenticatedContext, currentView, fullDataLoaded, isAuthenticated, memberPortalLoaded, members, selectedIdentityId, systemSettingsLoaded, userRole]);

  const loginIdentities: LoginIdentity[] = useMemo(() => buildLoginIdentities(members), [members]);

  useEffect(() => {
    if (!loginIdentities.length) return;
    if (!selectedIdentityId) {
      setSelectedIdentityId(loginIdentities[0].id);
      return;
    }
    if (!loginIdentities.some((i) => i.id === selectedIdentityId)) {
      setSelectedIdentityId(loginIdentities[0].id);
    }
  }, [loginIdentities, selectedIdentityId]);
  const currentIdentity = loginIdentities.find((i) => i.id === selectedIdentityId) || loginIdentities[0];
  const currentUser = currentIdentity ? members.find((m) => m.id === currentIdentity.memberId) : undefined;
  const adminMemberRows = adminDashboardData?.memberRows || [];

  const computeTenure = useCallback((joinedDate: string): number => {
    if (!joinedDate) return 0;
    const joined = new Date(joinedDate);
    if (isNaN(joined.getTime())) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - joined.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, []);

  const filteredAdminMemberRows = useMemo(() => {
    const normalizedQuery = memberListQuery.trim().toLowerCase();
    return adminMemberRows.filter((member) => {
      if (memberListFilter !== 'ALL' && member.memberType !== memberListFilter) return false;
      if (memberListStatusFilter !== 'ALL' && member.status !== memberListStatusFilter) return false;
      if (memberListFiscalYearFilter !== 'ALL') {
        const fy = Number(memberListFiscalYearFilter);
        const fyStart = new Date(fy, 3, 1);      // 4月1日
        const fyEnd = new Date(fy + 1, 2, 31);   // 翌3月31日
        const joined = member.joinedDate ? new Date(member.joinedDate) : null;
        if (!joined || isNaN(joined.getTime()) || joined > fyEnd) return false;
        // 退会済みの場合、退会日が年度開始前なら除外
        if (member.status === 'WITHDRAWN' && member.withdrawnDate) {
          const wd = new Date(member.withdrawnDate);
          if (!isNaN(wd.getTime()) && wd < fyStart) return false;
        }
      }
      if (!normalizedQuery) return true;
      return [member.memberId, member.displayName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [adminMemberRows, memberListFilter, memberListStatusFilter, memberListFiscalYearFilter, memberListQuery]);

  const sortedAdminMemberRows = useMemo(() => {
    const rows = [...filteredAdminMemberRows];
    const dir = memberSortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (memberSortKey) {
        case 'memberId': return dir * a.memberId.localeCompare(b.memberId);
        case 'displayName': return dir * a.displayName.localeCompare(b.displayName);
        case 'memberType': return dir * a.memberType.localeCompare(b.memberType);
        case 'trainingCount': return dir * (a.trainingCount - b.trainingCount);
        case 'tenure': return dir * (computeTenure(a.joinedDate) - computeTenure(b.joinedDate));
        case 'status': return dir * a.status.localeCompare(b.status);
        default: return 0;
      }
    });
    return rows;
  }, [filteredAdminMemberRows, memberSortKey, memberSortDir, computeTenure]);

  const memberListTotalPages = Math.max(1, Math.ceil(sortedAdminMemberRows.length / memberListPageSize));
  const pagedAdminMemberRows = useMemo(() => {
    const start = (memberListPage - 1) * memberListPageSize;
    return sortedAdminMemberRows.slice(start, start + memberListPageSize);
  }, [sortedAdminMemberRows, memberListPage, memberListPageSize]);

  const availableFiscalYears = useMemo(() => {
    // 会計年度（4月〜翌3月）の範囲を算出
    const toFiscalYear = (d: Date) => d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
    let minFY = Infinity;
    adminMemberRows.forEach(m => {
      if (m.joinedDate) {
        const d = new Date(m.joinedDate);
        if (!isNaN(d.getTime())) {
          const fy = toFiscalYear(d);
          if (fy < minFY) minFY = fy;
        }
      }
    });
    const currentFY = adminDashboardData?.currentFiscalYear ?? toFiscalYear(new Date());
    if (!isFinite(minFY)) return [currentFY];
    const years: number[] = [];
    for (let y = currentFY; y >= minFY; y--) years.push(y);
    return years;
  }, [adminMemberRows, adminDashboardData]);

  const toggleMemberSort = useCallback((key: MemberSortKey) => {
    if (memberSortKey === key) {
      setMemberSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMemberSortKey(key);
      setMemberSortDir('asc');
    }
    setMemberListPage(1);
  }, [memberSortKey]);

  const MemberSortIndicator: React.FC<{ sortKey: MemberSortKey }> = ({ sortKey }) => {
    if (memberSortKey !== sortKey) return <span className="text-slate-300 ml-1">&#8693;</span>;
    return <span className="text-primary-600 ml-1">{memberSortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  };

  const handleWithdrawMember = async (memberId: string) => {
    if (!confirm(`会員 ${memberId} を退会処理しますか？この操作は会員の状態を「退会済」に変更します。`)) return;
    try {
      setWithdrawingMemberId(memberId);
      await api.withdrawMember(memberId);
      await loadAdminDashboardData({ force: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : '退会処理に失敗しました。');
    } finally {
      setWithdrawingMemberId(null);
    }
  };

  const openMemberDetail = async (memberId: string) => {
    try {
      // loadAppData の戻り値を直接使用する（React state は次レンダーまで反映されないため）
      const { members: freshMembers } = await loadAppData({ includeAdminSettings: true, force: true });
      const found = freshMembers.find(m => m.id === memberId);
      if (!found) {
        alert('会員データの取得に失敗しました。');
        return;
      }
      setSelectedMemberForDetailId(found.id);
      setCurrentView('member-detail');
    } catch (e) {
      alert(e instanceof Error ? e.message : '会員データの読み込みに失敗しました。');
    }
  };

  useEffect(() => {
    setMemberListPage(1);
  }, [memberListFilter, memberListStatusFilter, memberListFiscalYearFilter, memberListQuery, memberListPageSize]);

  useEffect(() => {
    if (memberListPage > memberListTotalPages) {
      setMemberListPage(memberListTotalPages);
    }
  }, [memberListPage, memberListTotalPages]);

  const memberPageTypeLabel = useMemo(() => {
    if (!currentIdentity) return '未選択';
    let label = '個人会員';
    if (currentIdentity.type === MemberType.SUPPORT) label = '賛助会員';
    if (currentIdentity.type === MemberType.BUSINESS) {
      label = currentIdentity.staffRole === 'ADMIN' ? '事業所会員（管理者）' : '事業所会員（メンバー）';
    }
    return label;
  }, [currentIdentity]);

  const selectedMemberForDetail = selectedMemberForDetailId
    ? members.find(m => m.id === selectedMemberForDetailId)
    : undefined;

  const resolveIdentityId = (
    ctx: { memberId: string; staffId?: string; canAccessAdminPage: boolean },
    identities: LoginIdentity[],
  ): string => {
    const targetId = ctx.staffId ? `${ctx.memberId}-${ctx.staffId}` : ctx.memberId;
    const found = identities.find((identity) => identity.id === targetId);
    return found ? found.id : (identities[0]?.id || targetId);
  };

  const applyAuthContext = (
    ctx: { memberId: string; staffId?: string; canAccessAdminPage: boolean; adminPermissionLevel?: AdminPermissionLevel },
    availableMembers: Member[] = members,
  ) => {
    const identities = buildLoginIdentities(availableMembers);
    setAuthenticatedContext({ memberId: ctx.memberId, staffId: ctx.staffId });
    setSelectedIdentityId(resolveIdentityId(ctx, identities));
    const permLevel = ctx.adminPermissionLevel || null;
    setAdminPermissionLevel(permLevel);
    if (permLevel === 'GENERAL' || !ctx.canAccessAdminPage) {
      setUserRole('MEMBER');
      setCurrentView('profile');
    } else if (permLevel === 'TRAINING_MANAGER' || permLevel === 'TRAINING_REGISTRAR') {
      setUserRole('ADMIN');
      setCurrentView('training-manage');
    } else {
      setUserRole('ADMIN');
      setCurrentView('admin');
    }
    setIsAuthenticated(true);
    setAuthError(null);
  };

  // GAS セッション経由の管理者ログイン（google.script.run + Session.getActiveUser()）
  const handleAdminSessionLogin = async () => {
    try {
      setAuthBusy(true);
      setAuthError(null);
      const result = await api.checkAdminBySession();
      setFullDataLoaded(false);
      setMemberPortalLoaded(false);
      setMembers([]);
      setTrainings([]);
      setAdminDashboardData(null);
      setTrainingManagementLoaded(false);
      setTrainingManagementError(null);
      setAdminPermissionData(null);
      setAdminPermissionError(null);
      setSystemSettingsLoaded(false);
      const loaded = await loadMemberPortalData(result.memberId, { force: true });
      applyAuthContext(result, loaded.members);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google認証に失敗しました。');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthBusy(true);
      setAuthError(null);
      const result = await api.memberLogin(memberLoginId.trim(), memberPassword);
      const loaded = await loadMemberPortalData(result.memberId, { force: true });
      applyAuthContext(result, loaded.members);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'ログインに失敗しました。');
    } finally {
      setAuthBusy(false);
    }
  };


  const handleTrainingSave = async (training: Training): Promise<Training> => {
    const saved = await api.saveTraining(training);
    setTrainings((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      if (exists) return prev.map((t) => (t.id === saved.id ? saved : t));
      return [...prev, saved];
    });
    if (userRole === 'ADMIN') {
      loadAdminDashboardData({ force: true }).catch(() => undefined);
    }
    return saved;
  };

  const handleTrainingApply = async (trainingId: string): Promise<void> => {
    if (!currentIdentity) {
      throw new Error('ログイン情報が見つかりません。');
    }
    await api.applyTraining({
      trainingId,
      memberId: currentIdentity.memberId,
      staffId: currentIdentity.staffId,
    });
    await refreshAllData();
  };

  const handleTrainingCancel = async (trainingId: string): Promise<void> => {
    if (!currentIdentity) {
      throw new Error('ログイン情報が見つかりません。');
    }
    await api.cancelTraining({
      trainingId,
      memberId: currentIdentity.memberId,
      staffId: currentIdentity.staffId,
    });
    await refreshAllData();
  };

  const handleMemberSave = async (updatedMember: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    try {
      if (userRole === 'ADMIN') {
        await api.updateMember(updatedMember);
        loadAdminDashboardData({ force: true }).catch(() => undefined);
      } else {
        await api.updateMemberSelf(updatedMember, memberLoginId);
      }
    } catch (e) {
      console.error('Sync failed:', e);
      alert('保存に失敗しました。');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole('MEMBER');
    setCurrentView('profile');
    setAnnualFeeHasUnsavedChanges(false);
    setPendingAnnualFeeAction(null);
    setAuthTab('member');
    setAuthError(null);
    setMemberPassword('');
    setSelectedIdentityId('');
    setAuthenticatedContext(null);
    setSelectedMemberForDetailId(null);
    setSelectedStaffForDetail(null);
    setStaffSaveToast(null);
    setMembers([]);
    setTrainings([]);
    setFullDataLoaded(false);
    setMemberPortalLoaded(false);
    setAdminDashboardData(null);
    setAdminDashboardError(null);
    setTrainingManagementLoaded(false);
    setTrainingManagementError(null);
    setAdminPermissionData(null);
    setAdminPermissionError(null);
    setAdminPermissionQuery('');
    setAdminPermissionDrafts({});
    setNewAdminPermission({
      googleEmail: '',
      linkedAuthId: '',
      permissionLevel: 'ADMIN' as AdminPermissionLevel,
      enabled: true,
    });
    setAdminPermissionLevel(null);
    setSystemSettingsLoaded(false);
  };

  useEffect(() => {
    const dialog = annualFeeLeaveDialogRef.current;
    if (!dialog) return;
    if (!pendingAnnualFeeAction) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, [pendingAnnualFeeAction]);

  const handleViewChange = (view: string) => {
    const nextView = view as View;
    if (currentView === 'annual-fee-manage' && annualFeeHasUnsavedChanges && nextView !== currentView) {
      setPendingAnnualFeeAction({ type: 'view', view: nextView });
      return;
    }
    setCurrentView(nextView);
  };

  const handleLogoutClick = () => {
    if (currentView === 'annual-fee-manage' && annualFeeHasUnsavedChanges) {
      setPendingAnnualFeeAction({ type: 'logout' });
      return;
    }
    logout();
  };

  const cancelPendingAnnualFeeAction = () => {
    setPendingAnnualFeeAction(null);
  };

  const confirmPendingAnnualFeeAction = () => {
    const action = pendingAnnualFeeAction;
    setPendingAnnualFeeAction(null);
    setAnnualFeeHasUnsavedChanges(false);
    if (!action) return;
    if (action.type === 'view') {
      setCurrentView(action.view);
      return;
    }
    logout();
  };

  const memberTypeLabel = (type: string) => {
    if (type === MemberType.BUSINESS) return '事業所会員';
    if (type === MemberType.SUPPORT) return '賛助会員';
    return '個人会員';
  };

  const filteredAdminPermissions = useMemo(() => {
    let list = (adminPermissionData?.entries || []).filter((e) => e.permissionLevel !== 'GENERAL');
    if (adminPermissionFilterLevel !== 'ALL') {
      list = list.filter((e) => e.permissionLevel === adminPermissionFilterLevel);
    }
    const normalized = adminPermissionQuery.trim().toLowerCase();
    if (normalized) {
      list = list.filter((entry) =>
        [entry.googleEmail, entry.displayName, entry.linkedIdentityLabel, entry.linkedRoleCode, entry.permissionLevel]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      );
    }
    const permOrder: Record<string, number> = { MASTER: 1, ADMIN: 2, TRAINING_MANAGER: 3, TRAINING_REGISTRAR: 4, GENERAL: 5 };
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (adminPermissionSortKey === 'googleEmail') {
        cmp = (a.googleEmail || '').localeCompare(b.googleEmail || '');
      } else if (adminPermissionSortKey === 'permissionLevel') {
        cmp = (permOrder[a.permissionLevel] || 9) - (permOrder[b.permissionLevel] || 9);
      } else if (adminPermissionSortKey === 'updatedByAt') {
        cmp = (a.updatedByAt || '').localeCompare(b.updatedByAt || '');
      }
      return adminPermissionSortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [adminPermissionData, adminPermissionQuery, adminPermissionFilterLevel, adminPermissionSortKey, adminPermissionSortDir]);

  const adminPermissionOptionLabel = (authId: string) =>
    adminPermissionData?.identityOptions.find((option) => option.authId === authId)?.label || '';

  const updateAdminPermissionDraft = (
    id: string,
    patch: Partial<{ googleEmail: string; linkedAuthId: string; permissionLevel: AdminPermissionLevel; enabled: boolean }>,
  ) => {
    setAdminPermissionDrafts((prev) => ({
      ...prev,
      [id]: {
        googleEmail: '',
        linkedAuthId: '',
        permissionLevel: 'ADMIN' as AdminPermissionLevel,
        enabled: true,
        ...(prev[id] || {}),
        ...patch,
      },
    }));
  };

  const saveAdminPermission = async (payload: {
    id?: string;
    googleEmail: string;
    linkedAuthId: string;
    permissionLevel: AdminPermissionLevel;
    enabled: boolean;
  }) => {
    await api.saveAdminPermission(payload);
    await loadAdminPermissionData({ force: true });
  };

  const deleteAdminPermission = async (id: string) => {
    await api.deleteAdminPermission(id);
    await loadAdminPermissionData({ force: true });
  };

  const permissionLevelLabel = (level: AdminPermissionLevel) => {
    const map: Record<AdminPermissionLevel, string> = {
      MASTER: 'マスター', ADMIN: '管理者', TRAINING_MANAGER: '研修管理者', TRAINING_REGISTRAR: '研修登録者', GENERAL: '一般',
    };
    return map[level] || level;
  };

  const permissionLevelOptions: AdminPermissionLevel[] = ['MASTER', 'ADMIN', 'TRAINING_MANAGER', 'TRAINING_REGISTRAR', 'GENERAL'];

  const filterIdentityOptions = (query: string) => {
    const opts = adminPermissionData?.identityOptions || [];
    if (!query.trim()) return opts;
    const q = query.trim().toLowerCase();
    return opts.filter((o) =>
      [o.label, o.loginId, o.memberId, o.staffId || ''].join(' ').toLowerCase().includes(q)
    );
  };

  const isEntryEditable = (entry: AdminPermissionEntry) => {
    if (adminPermissionLevel === 'MASTER') return true;
    if (entry.permissionLevel === 'MASTER') return false;
    if (entry.googleEmail === adminPermissionData?.currentSessionEmail) return false;
    return true;
  };

  const renderSystemPermissionPage = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">管理コンソール（システム権限）</h2>
            <p className="text-slate-600 mt-2 leading-relaxed">
              管理者ログインに使う Google アカウントと、紐づく会員アカウント・権限を管理します。
            </p>
            <p className="text-xs text-slate-500 mt-2">
              表示名は紐づく会員名と権限から自動で導出されます。
            </p>
          </div>
          <div className="text-xs text-slate-500 md:text-right">
            <div>セッション: {adminPermissionData?.currentSessionEmail || '未取得'}</div>
            <div>権限: {adminPermissionLevel ? permissionLevelLabel(adminPermissionLevel) : '-'}</div>
            <button
              type="button"
              className="mt-2 px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              onClick={() => loadAdminPermissionData({ force: true }).catch(() => undefined)}
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>

      {adminPermissionError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{adminPermissionError}</div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">管理者権限を追加</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Googleメールアドレス</label>
            <input
              type="email"
              value={newAdminPermission.googleEmail}
              onChange={(e) => setNewAdminPermission((prev) => ({ ...prev, googleEmail: e.target.value }))}
              className="w-full border border-slate-300 rounded px-3 py-2"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">紐づく会員アカウント</label>
            <input
              type="text"
              value={newPermissionIdentitySearch}
              onChange={(e) => {
                setNewPermissionIdentitySearch(e.target.value);
                setNewAdminPermission((prev) => ({ ...prev, linkedAuthId: '' }));
              }}
              className="w-full border border-slate-300 rounded px-3 py-2"
              placeholder="名前・ログインID・会員IDで検索"
            />
            {newPermissionIdentitySearch.trim() && !newAdminPermission.linkedAuthId && (
              <div className="mt-1 max-h-40 overflow-y-auto border border-slate-200 rounded bg-white shadow-sm">
                {filterIdentityOptions(newPermissionIdentitySearch).map((option) => (
                  <button
                    key={option.authId}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
                    onClick={() => {
                      setNewAdminPermission((prev) => ({ ...prev, linkedAuthId: option.authId }));
                      setNewPermissionIdentitySearch(option.label);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                {filterIdentityOptions(newPermissionIdentitySearch).length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-500">該当なし</p>
                )}
              </div>
            )}
            {newAdminPermission.linkedAuthId && (
              <p className="text-xs text-green-700 mt-1">選択済: {adminPermissionOptionLabel(newAdminPermission.linkedAuthId)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">権限</label>
            <select
              value={newAdminPermission.permissionLevel}
              onChange={(e) => setNewAdminPermission((prev) => ({ ...prev, permissionLevel: e.target.value as AdminPermissionLevel }))}
              className="w-full border border-slate-300 rounded px-3 py-2"
            >
              {permissionLevelOptions.map((level) => (
                <option key={level} value={level}>{permissionLevelLabel(level)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newAdminPermission.enabled}
              onChange={(e) => setNewAdminPermission((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            有効にする
          </label>
          <button
            type="button"
            className="px-4 py-2 rounded bg-slate-800 text-white disabled:opacity-50"
            disabled={!newAdminPermission.googleEmail.trim() || !newAdminPermission.linkedAuthId}
            onClick={async () => {
              try {
                await saveAdminPermission({
                  googleEmail: newAdminPermission.googleEmail.trim(),
                  linkedAuthId: newAdminPermission.linkedAuthId,
                  permissionLevel: newAdminPermission.permissionLevel,
                  enabled: newAdminPermission.enabled,
                });
                setNewAdminPermission({
                  googleEmail: '',
                  linkedAuthId: '',
                  permissionLevel: 'ADMIN' as AdminPermissionLevel,
                  enabled: true,
                });
                setNewPermissionIdentitySearch('');
                alert('管理者権限を追加しました。');
              } catch (error) {
                alert(error instanceof Error ? error.message : '管理者権限の追加に失敗しました。');
              }
            }}
          >
            管理者権限を追加
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">登録済み管理者アカウント</h3>
              <p className="text-sm text-slate-600 mt-1">
                {filteredAdminPermissions.length} 件{adminPermissionFilterLevel !== 'ALL' || adminPermissionQuery.trim() ? '（絞り込み中）' : ''}
              </p>
            </div>
            <input
              value={adminPermissionQuery}
              onChange={(e) => setAdminPermissionQuery(e.target.value)}
              className="w-full md:w-64 border border-slate-300 rounded px-3 py-2 text-sm"
              placeholder="メール・表示名・紐付け先で検索"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 whitespace-nowrap">権限</label>
              <select
                value={adminPermissionFilterLevel}
                onChange={(e) => setAdminPermissionFilterLevel(e.target.value as AdminPermissionLevel | 'ALL')}
                className="border border-slate-300 rounded px-2 py-1 text-sm"
              >
                <option value="ALL">すべて</option>
                {permissionLevelOptions.filter((l) => l !== 'GENERAL').map((level) => (
                  <option key={level} value={level}>{permissionLevelLabel(level)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 whitespace-nowrap">並び順</label>
              <select
                value={adminPermissionSortKey}
                onChange={(e) => setAdminPermissionSortKey(e.target.value as 'googleEmail' | 'permissionLevel' | 'updatedByAt')}
                className="border border-slate-300 rounded px-2 py-1 text-sm"
              >
                <option value="permissionLevel">権限</option>
                <option value="googleEmail">メールアドレス</option>
                <option value="updatedByAt">変更日時</option>
              </select>
              <button
                type="button"
                className="px-2 py-1 border border-slate-300 rounded text-xs hover:bg-slate-50"
                onClick={() => setAdminPermissionSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
              >
                {adminPermissionSortDir === 'asc' ? '昇順' : '降順'}
              </button>
            </div>
          </div>
        </div>
        {adminPermissionLoading && !adminPermissionData && (
          <p className="text-sm text-slate-500">システム権限データを読み込み中です...</p>
        )}
        {!adminPermissionLoading && filteredAdminPermissions.length === 0 && (
          <p className="text-sm text-slate-500">表示できる管理者アカウントがありません。</p>
        )}
        {filteredAdminPermissions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-600 uppercase tracking-wider">
                  <th className="px-3 py-2 border-b border-slate-200">Googleメール</th>
                  <th className="px-3 py-2 border-b border-slate-200">表示名</th>
                  <th className="px-3 py-2 border-b border-slate-200">紐付け先</th>
                  <th className="px-3 py-2 border-b border-slate-200">権限</th>
                  <th className="px-3 py-2 border-b border-slate-200">状態</th>
                  <th className="px-3 py-2 border-b border-slate-200">変更者</th>
                  <th className="px-3 py-2 border-b border-slate-200">変更日時</th>
                  <th className="px-3 py-2 border-b border-slate-200">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdminPermissions.map((entry) => {
                  const editable = isEntryEditable(entry);
                  const isEditing = editingPermissionId === entry.id;
                  const draft = adminPermissionDrafts[entry.id] || {
                    googleEmail: entry.googleEmail || '',
                    linkedAuthId: entry.linkedAuthId || '',
                    permissionLevel: entry.permissionLevel || 'ADMIN',
                    enabled: entry.enabled,
                  };
                  const editSearch = editPermissionIdentitySearches[entry.id] ?? '';
                  const permBadgeColor: Record<string, string> = {
                    MASTER: 'bg-purple-100 text-purple-700',
                    ADMIN: 'bg-primary-100 text-primary-700',
                    TRAINING_MANAGER: 'bg-teal-100 text-teal-700',
                    TRAINING_REGISTRAR: 'bg-cyan-100 text-cyan-700',
                    GENERAL: 'bg-slate-100 text-slate-600',
                  };
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`border-b border-slate-100 ${isEditing ? 'bg-primary-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{entry.googleEmail}</td>
                        <td className="px-3 py-2 text-slate-600">{entry.displayName || '(未解決)'}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs">{entry.linkedIdentityLabel || '未設定'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${permBadgeColor[entry.permissionLevel] || 'bg-slate-100 text-slate-600'}`}>
                            {permissionLevelLabel(entry.permissionLevel)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${entry.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {entry.enabled ? '有効' : '無効'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{entry.updatedByEmail || '-'}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{entry.updatedByAt || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {editable && !isEditing && (
                            <button
                              type="button"
                              className="px-3 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                              onClick={() => {
                                setEditingPermissionId(entry.id);
                                setEditPermissionIdentitySearches((prev) => ({ ...prev, [entry.id]: '' }));
                                updateAdminPermissionDraft(entry.id, {
                                  googleEmail: entry.googleEmail || '',
                                  linkedAuthId: entry.linkedAuthId || '',
                                  permissionLevel: entry.permissionLevel || 'ADMIN',
                                  enabled: entry.enabled,
                                });
                              }}
                            >
                              編集
                            </button>
                          )}
                          {isEditing && (
                            <button
                              type="button"
                              className="px-3 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                              onClick={() => setEditingPermissionId(null)}
                            >
                              閉じる
                            </button>
                          )}
                          {!editable && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                      {isEditing && editable && (
                        <tr className="bg-primary-50 border-b border-slate-200">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Googleメールアドレス</label>
                                <input
                                  type="email"
                                  value={draft.googleEmail}
                                  onChange={(e) => updateAdminPermissionDraft(entry.id, { googleEmail: e.target.value })}
                                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">紐づく会員アカウント</label>
                                <input
                                  type="text"
                                  value={editSearch || (draft.linkedAuthId ? adminPermissionOptionLabel(draft.linkedAuthId) : '')}
                                  onChange={(e) => {
                                    setEditPermissionIdentitySearches((prev) => ({ ...prev, [entry.id]: e.target.value }));
                                    updateAdminPermissionDraft(entry.id, { linkedAuthId: '' });
                                  }}
                                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                  placeholder="名前・ログインID・会員IDで検索"
                                />
                                {editSearch.trim() && !draft.linkedAuthId && (
                                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto border border-slate-200 rounded bg-white shadow-lg">
                                    {filterIdentityOptions(editSearch).map((option) => (
                                      <button
                                        key={option.authId}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
                                        onClick={() => {
                                          updateAdminPermissionDraft(entry.id, { linkedAuthId: option.authId });
                                          setEditPermissionIdentitySearches((prev) => ({ ...prev, [entry.id]: '' }));
                                        }}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                    {filterIdentityOptions(editSearch).length === 0 && (
                                      <p className="px-3 py-2 text-xs text-slate-500">該当なし</p>
                                    )}
                                  </div>
                                )}
                                {draft.linkedAuthId && (
                                  <p className="text-xs text-green-700 mt-1">選択済: {adminPermissionOptionLabel(draft.linkedAuthId)}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">権限</label>
                                <select
                                  value={draft.permissionLevel}
                                  onChange={(e) => updateAdminPermissionDraft(entry.id, { permissionLevel: e.target.value as AdminPermissionLevel })}
                                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                >
                                  {permissionLevelOptions.map((level) => (
                                    <option key={level} value={level}>{permissionLevelLabel(level)}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4">
                              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={draft.enabled}
                                  onChange={(e) => updateAdminPermissionDraft(entry.id, { enabled: e.target.checked })}
                                />
                                有効にする
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="px-4 py-2 rounded bg-slate-800 text-white text-sm disabled:opacity-50"
                                  disabled={!draft.googleEmail.trim() || !draft.linkedAuthId}
                                  onClick={async () => {
                                    try {
                                      await saveAdminPermission({
                                        id: entry.id,
                                        googleEmail: draft.googleEmail.trim(),
                                        linkedAuthId: draft.linkedAuthId,
                                        permissionLevel: draft.permissionLevel,
                                        enabled: draft.enabled,
                                      });
                                      setEditingPermissionId(null);
                                      alert('管理者権限を更新しました。');
                                    } catch (error) {
                                      alert(error instanceof Error ? error.message : '管理者権限の更新に失敗しました。');
                                    }
                                  }}
                                >
                                  変更を保存
                                </button>
                                <button
                                  type="button"
                                  className="px-4 py-2 rounded border border-red-300 text-red-700 bg-red-50 text-sm"
                                  onClick={async () => {
                                    if (!confirm(`管理者権限 ${entry.googleEmail} を削除しますか？`)) return;
                                    try {
                                      await deleteAdminPermission(entry.id);
                                      setEditingPermissionId(null);
                                      alert('管理者権限を削除しました。');
                                    } catch (error) {
                                      alert(error instanceof Error ? error.message : '管理者権限の削除に失敗しました。');
                                    }
                                  }}
                                >
                                  削除
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderMemberList = () => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      {/* フィルタエリア */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">会員種別</label>
          <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={memberListFilter} onChange={(e) => setMemberListFilter(e.target.value as MemberListFilter)}>
            <option value="ALL">全種別</option>
            <option value={MemberType.INDIVIDUAL}>個人会員</option>
            <option value={MemberType.BUSINESS}>事業所会員</option>
            <option value={MemberType.SUPPORT}>賛助会員</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">会員状態</label>
          <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={memberListStatusFilter} onChange={(e) => setMemberListStatusFilter(e.target.value as MemberStatusFilter)}>
            <option value="ALL">全状態</option>
            <option value="ACTIVE">在籍中</option>
            <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
            <option value="WITHDRAWN">退会済</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">対象年度</label>
          <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={memberListFiscalYearFilter} onChange={(e) => setMemberListFiscalYearFilter(e.target.value)}>
            <option value="ALL">全年度</option>
            {availableFiscalYears.map(y => <option key={y} value={String(y)}>{y}年度</option>)}
          </select>
        </div>
        <div className="min-w-[240px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">キーワード検索</label>
          <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={memberListQuery} onChange={(e) => setMemberListQuery(e.target.value)} placeholder="会員番号・氏名・事業所名" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">表示件数</label>
          <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={memberListPageSize} onChange={(e) => setMemberListPageSize(Number(e.target.value))}>
            <option value={25}>25 件</option>
            <option value={50}>50 件</option>
            <option value={100}>100 件</option>
          </select>
        </div>
      </div>

      {/* フィルタチップ */}
      {(memberListFilter !== 'ALL' || memberListStatusFilter !== 'ALL' || memberListFiscalYearFilter !== 'ALL' || memberListQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-slate-500">適用中:</span>
          {memberListFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {memberTypeLabel(memberListFilter)}
              <button onClick={() => setMemberListFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {memberListStatusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {memberListStatusFilter === 'ACTIVE' ? '在籍中' : '退会済'}
              <button onClick={() => setMemberListStatusFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {memberListFiscalYearFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {memberListFiscalYearFilter}年度
              <button onClick={() => setMemberListFiscalYearFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {memberListQuery && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              &quot;{memberListQuery}&quot;
              <button onClick={() => setMemberListQuery('')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
        </div>
      )}

      {/* ヘッダー行 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">会員一覧</h3>
          <p className="text-sm text-slate-500 mt-1">
            {sortedAdminMemberRows.length === 0
              ? '該当データなし'
              : `${(memberListPage - 1) * memberListPageSize + 1} - ${Math.min(memberListPage * memberListPageSize, sortedAdminMemberRows.length)} 件を表示 / 全 ${sortedAdminMemberRows.length} 件`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button type="button" disabled={memberListPage <= 1} onClick={() => setMemberListPage(1)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&laquo;</button>
            <button type="button" disabled={memberListPage <= 1} onClick={() => setMemberListPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">前へ</button>
            <span className="text-sm text-slate-600">{memberListPage} / {memberListTotalPages}</span>
            <button type="button" disabled={memberListPage >= memberListTotalPages} onClick={() => setMemberListPage(p => Math.min(memberListTotalPages, p + 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">次へ</button>
            <button type="button" disabled={memberListPage >= memberListTotalPages} onClick={() => setMemberListPage(memberListTotalPages)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&raquo;</button>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleMemberSort('memberId')}>会員番号<MemberSortIndicator sortKey="memberId" /></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleMemberSort('displayName')}>氏名/事業所<MemberSortIndicator sortKey="displayName" /></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleMemberSort('memberType')}>種別<MemberSortIndicator sortKey="memberType" /></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleMemberSort('trainingCount')}>研修参加数<MemberSortIndicator sortKey="trainingCount" /></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleMemberSort('tenure')}>継続年数<MemberSortIndicator sortKey="tenure" /></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleMemberSort('status')}>状態<MemberSortIndicator sortKey="status" /></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {pagedAdminMemberRows.map((member) => (
              <tr key={member.memberId} className="hover:bg-slate-50 cursor-pointer" onClick={() => openMemberDetail(member.memberId)}>
                <td className="px-4 py-3 text-sm font-mono text-slate-600">{member.memberId}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{member.displayName}</td>
                <td className="px-4 py-3 text-sm"><span className={`px-2 py-0.5 rounded text-xs font-medium ${member.memberType === MemberType.BUSINESS ? 'bg-indigo-100 text-indigo-700' : member.memberType === MemberType.SUPPORT ? 'bg-pink-100 text-pink-700' : 'text-slate-600'}`}>{memberTypeLabel(member.memberType)}</span></td>
                <td className="px-4 py-3 text-sm text-slate-600 text-center">{member.trainingCount}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{member.joinedDate ? `${computeTenure(member.joinedDate)}年` : '-'}</td>
                <td className="px-4 py-3 text-sm">{member.status === 'WITHDRAWN' ? <span className="text-red-500">退会済</span> : member.status === 'WITHDRAWAL_SCHEDULED' ? <span className="text-amber-600">退会予定</span> : <span className="text-green-600">在籍中</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adminDashboardLoading && <p className="mt-4 text-sm text-slate-500">会員一覧を読み込み中です...</p>}
      {!adminDashboardLoading && !adminDashboardData?.memberRows.length && <p className="mt-4 text-sm text-slate-500">表示できる会員データがありません。</p>}

      {/* 下部ページネーション */}
      {sortedAdminMemberRows.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">行クリックで詳細画面に遷移します。</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={memberListPage <= 1} onClick={() => setMemberListPage(1)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&laquo;</button>
            <button type="button" disabled={memberListPage <= 1} onClick={() => setMemberListPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">前へ</button>
            <span className="text-sm text-slate-600">{memberListPage} / {memberListTotalPages}</span>
            <button type="button" disabled={memberListPage >= memberListTotalPages} onClick={() => setMemberListPage(p => Math.min(memberListTotalPages, p + 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">次へ</button>
            <button type="button" disabled={memberListPage >= memberListTotalPages} onClick={() => setMemberListPage(memberListTotalPages)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&raquo;</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTrainingSummary = () => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">研修サマリー</h3>
          <p className="text-sm text-slate-600 mt-1">
            管理トップでは一覧だけ先に表示します。詳細編集は研修管理コンソールで行います。
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded bg-slate-800 text-white"
          onClick={() => setCurrentView('training-manage')}
        >
          研修管理コンソールを開く
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">研修名</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">開催日</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">状態</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">申込数</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {(adminDashboardData?.trainingRows || []).map((training) => (
              <tr key={training.trainingId}>
                <td className="px-4 py-3 text-sm text-slate-900">{training.title}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{training.date || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{training.status === 'OPEN' ? '受付中' : '受付終了'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{training.applicants} / {training.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adminDashboardLoading && (
        <p className="mt-4 text-sm text-slate-500">研修サマリーを読み込み中です...</p>
      )}
      {!adminDashboardLoading && !adminDashboardData?.trainingRows.length && (
        <p className="mt-4 text-sm text-slate-500">表示できる研修データがありません。</p>
      )}
    </div>
  );

  const renderAdminPage = () => {
    const d = adminDashboardData;
    const loading = adminDashboardLoading;
    const val = (v: number | undefined) => loading ? '...' : (v ?? 0);
    const refreshAdminMembers = async () => {
      await Promise.all([
        loadAdminDashboardData({ force: true }),
        loadAppData({ includeAdminSettings: true, force: true }),
      ]);
    };
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">管理コンソール（会員管理）</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            会員の入会・退会・編集を管理します。年会費は年会費管理コンソールで管理します。
          </p>
        </div>
        {adminDashboardError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{adminDashboardError}</div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs text-emerald-700 font-medium mb-1">在籍会員数</p>
            <p className="text-2xl font-bold text-emerald-800">{val(d?.memberCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">個人会員（在籍）</p>
            <p className="text-2xl font-bold text-primary-600">{val(d?.individualCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">事業所会員（在籍）</p>
            <p className="text-2xl font-bold text-indigo-600">{val(d?.businessCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">事業所職員（在籍）</p>
            <p className="text-2xl font-bold text-purple-600">{val(d?.businessStaffCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">{d?.currentFiscalYearLabel || '今年度'} 入会数</p>
            <p className="text-2xl font-bold text-green-600">{val(d?.currentYearJoinedCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">{d?.currentFiscalYearLabel || '今年度'} 退会数</p>
            <p className="text-2xl font-bold text-red-500">{val(d?.currentYearWithdrawnCount)}</p>
          </div>
        </div>
        {renderMemberList()}
        <MemberBatchEditor
          onOpenDetail={(memberId) => {
            void openMemberDetail(memberId);
          }}
        />
        {renderTrainingSummary()}
      </div>
    );
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="max-w-lg mx-auto mt-20 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">ログイン</h1>
          <p className="text-sm text-slate-600 mb-5">会員はログインID/パスワード、管理者のみGoogle認証を使用します。</p>
          <fieldset disabled={authBusy} className={authBusy ? 'opacity-60' : ''}>
            <div className="flex gap-2 mb-4">
              <button type="button" className={`px-3 py-2 rounded ${authTab === 'member' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} onClick={() => setAuthTab('member')}>
                会員ログイン
              </button>
              <button type="button" className={`px-3 py-2 rounded ${authTab === 'admin' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} onClick={() => setAuthTab('admin')}>
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
                <button className="w-full bg-slate-800 text-white rounded px-3 py-2 flex items-center justify-center gap-2 disabled:opacity-50" type="submit">
                  {authBusy ? (<><span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>ログイン中...</>) : 'ログイン'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full bg-slate-800 text-white rounded px-3 py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={handleAdminSessionLogin}
                >
                  {authBusy ? (<><span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>認証中...</>) : 'Googleアカウントで管理者ログイン'}
                </button>
              </div>
            )}
          </fieldset>
          {authBusy && <p className="mt-3 text-sm text-slate-500 text-center" role="status" aria-live="assertive">認証処理を実行しています...</p>}
          {authError && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2" role="alert">{authError}</div>}
        </div>
      );
    }

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

    if ((currentView === 'training-apply' || currentView === 'profile') && !memberPortalLoaded) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4"></div>
          <p>必要なデータを読み込み中です...</p>
        </div>
      );
    }

    if (currentView === 'admin') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return renderAdminPage();
    }

    if (currentView === 'member-detail') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      if (!selectedMemberForDetail) {
        return <div className="text-red-500 p-4">会員データが見つかりません。</div>;
      }
      return (
        <MemberDetailAdmin
          member={selectedMemberForDetail}
          businessMembers={adminMemberRows.filter(r => r.memberType === MemberType.BUSINESS)}
          onBack={() => {
            setSelectedStaffForDetail(null);
            setSelectedMemberForDetailId(null);
            setCurrentView('admin');
          }}
          onSaved={async () => {
            loadAdminDashboardData({ force: true }).catch(() => undefined);
            loadAppData({ force: true, silent: true }).catch(() => undefined);
          }}
          onOpenStaffDetail={(mId, sId) => {
            setStaffSaveToast(null);
            setSelectedMemberForDetailId(mId);
            setSelectedStaffForDetail({ memberId: mId, staffId: sId });
            setCurrentView('staff-detail');
          }}
          staffSaveToast={staffSaveToast}
          onDismissStaffSaveToast={() => setStaffSaveToast(null)}
        />
      );
    }

    if (currentView === 'staff-detail') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      const parentMember = selectedStaffForDetail
        ? members.find(m => m.id === selectedStaffForDetail.memberId)
        : undefined;
      const targetStaff = parentMember?.staff?.find(s => s.id === selectedStaffForDetail?.staffId);
      return (
        <StaffDetailAdmin
          staff={targetStaff}
          memberId={selectedStaffForDetail?.memberId || ''}
          officeName={parentMember?.officeName || ''}
          onBack={() => {
            setSelectedStaffForDetail(null);
            setCurrentView('member-detail');
          }}
          onSaved={async () => {
            setStaffSaveToast('職員情報を保存しました');
            loadAdminDashboardData({ force: true }).catch(() => undefined);
            try {
              await loadAppData({ force: true, silent: true });
            } catch {
              // Keep the current detail view visible even if the background refresh fails.
            }
          }}
        />
      );
    }

    if (currentView === 'admin-settings') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">設定</h2>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">事業所会員メンバー上限設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">全体デフォルト上限</label>
                <input type="number" min={1} max={200} value={globalLimitInput} onChange={(e) => setGlobalLimitInput(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">研修履歴の表示期間（月）</label>
                <input type="number" min={1} max={60} value={historyLookbackInput} onChange={(e) => setHistoryLookbackInput(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
              <div>
                <button
                  type="button"
                  disabled={settingsBusy || !systemSettingsLoaded}
                  onClick={async () => {
                    try {
                      setSettingsBusy(true);
                      const saved = await api.updateSystemSettings({
                        defaultBusinessStaffLimit: Number(globalLimitInput || 10),
                        trainingHistoryLookbackMonths: Number(historyLookbackInput || 18),
                      });
                      setDefaultBusinessStaffLimit(saved.defaultBusinessStaffLimit);
                      setGlobalLimitInput(String(saved.defaultBusinessStaffLimit));
                      setTrainingHistoryLookbackMonths(saved.trainingHistoryLookbackMonths);
                      setHistoryLookbackInput(String(saved.trainingHistoryLookbackMonths));
                      alert('設定を保存しました。');
                    } catch (e) {
                      alert(e instanceof Error ? e.message : '設定の保存に失敗しました。');
                    } finally {
                      setSettingsBusy(false);
                    }
                  }}
                  className="px-4 py-2 rounded bg-slate-800 text-white disabled:opacity-50"
                >全体設定を保存</button>
              </div>
            </div>
            {!systemSettingsLoaded && <p className="text-sm text-slate-500">システム設定を読み込み中です...</p>}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">事業所ごとの個別上限</h4>
                  <p className="text-sm text-slate-600 mt-1">個別上限の編集は会員データ全件が必要です。</p>
                </div>
                {!fullDataLoaded && (
                  <button type="button" className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-sm" onClick={() => loadAppData({ includeAdminSettings: true, force: true }).catch(() => undefined)}>読み込む</button>
                )}
              </div>
              {fullDataLoaded && (
                <div className="space-y-2 mt-4">
                  {members.filter((m) => m.type === MemberType.BUSINESS).map((m) => {
                    const effective = m.staffLimit ?? defaultBusinessStaffLimit;
                    return (
                      <div key={m.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border border-slate-200 rounded p-3">
                        <div className="md:col-span-2">
                          <p className="text-sm font-semibold text-slate-800">{m.officeName}</p>
                          <p className="text-xs text-slate-500">会員ID: {m.id} / 現在有効上限: {effective}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">個別上限（空で全体適用）</label>
                          <input type="number" min={1} max={200} defaultValue={m.staffLimit ?? ''} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" onBlur={(e) => {
                            const raw = e.target.value.trim();
                            const nextMember: Member = { ...m, staffLimit: raw ? Math.floor(Number(raw)) : undefined };
                            setMembers((prev) => prev.map((x) => (x.id === m.id ? nextMember : x)));
                          }} />
                        </div>
                        <div>
                          <button type="button" className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 text-sm" onClick={async () => {
                            const target = members.find((x) => x.id === m.id) || m;
                            await handleMemberSave(target);
                            alert('事業所個別上限を保存しました。');
                          }}>個別設定を保存</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'system-permissions') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return renderSystemPermissionPage();
    }

    if (currentView === 'annual-fee-manage') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return <AnnualFeeManagement onChanged={refreshAllData} onDirtyChange={setAnnualFeeHasUnsavedChanges} onOpenMember={(memberId) => { setSelectedMemberForDetailId(memberId); setCurrentView('member-detail'); }} />;
    }

    if (currentView === 'training-manage') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN', 'TRAINING_MANAGER', 'TRAINING_REGISTRAR'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      if (trainingManagementLoading && !trainingManagementLoaded) {
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4"></div>
            <p>研修管理データを読み込み中です...</p>
          </div>
        );
      }
      if (trainingManagementError && !trainingManagementLoaded) {
        return <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded">{trainingManagementError}</div>;
      }
      return <TrainingManagement trainings={trainings} onSave={handleTrainingSave} />;
    }

    if (currentView === 'training-apply') {
      if (!currentUser) {
        return <div className="p-8 text-center text-slate-500">会員データが見つかりません。</div>;
      }
      return (
        <TrainingApply
          member={currentUser}
          activeStaffId={currentIdentity?.staffId}
          trainings={trainings}
          historyLookbackMonths={trainingHistoryLookbackMonths}
          onApply={handleTrainingApply}
          onCancel={handleTrainingCancel}
        />
      );
    }

    if (!currentUser) {
      return <div className="p-8 text-center text-slate-500">会員データが見つかりません。</div>;
    }

    return (
      <MemberForm
        initialMember={currentUser}
        activeStaffId={currentIdentity?.staffId}
        activeStaffRole={currentIdentity?.staffRole}
        loginId={memberLoginId}
        isAdmin={userRole === 'ADMIN'}
        defaultBusinessStaffLimit={defaultBusinessStaffLimit}
        historyLookbackMonths={trainingHistoryLookbackMonths}
        trainings={trainings}
        onSave={handleMemberSave}
        onLogout={logout}
      />
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {isAuthenticated && (
        <Sidebar
          currentView={currentView}
          onChangeView={handleViewChange}
          role={userRole}
          currentUser={currentUser}
          currentStaffName={
            currentIdentity?.staffId && currentUser?.staff
              ? (currentUser.staff.find(s => s.id === currentIdentity.staffId)?.name || '')
              : ''
          }
          memberPageTypeLabel={memberPageTypeLabel}
          showAdminPage={userRole === 'ADMIN'}
          adminPermissionLevel={adminPermissionLevel}
        />
      )}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto relative overscroll-contain">
                <div className="absolute top-4 right-8 bg-white p-2 rounded-lg shadow border border-slate-200 z-10 flex space-x-2 items-center">
          <>
            <span className="text-xs text-slate-500 px-2">{isAuthenticated ? 'ログイン中' : '未ログイン'}</span>
            {isAuthenticated && (
              <button className="text-sm border border-slate-300 rounded px-2 py-1 bg-slate-50" onClick={handleLogoutClick}>
                ログアウト
              </button>
            )}
          </>
        </div>
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
        <dialog
          ref={annualFeeLeaveDialogRef}
          onClose={() => {
            if (pendingAnnualFeeAction && annualFeeLeaveDialogRef.current?.returnValue !== 'confirm') {
              setPendingAnnualFeeAction(null);
            }
          }}
          className="w-full max-w-md rounded-2xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-900/30"
        >
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">未保存の変更があります</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                年会費一覧の変更が保存されていません。このまま移動すると未保存の入力は破棄されます。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelPendingAnnualFeeAction}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmPendingAnnualFeeAction}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                破棄して移動
              </button>
            </div>
          </div>
        </dialog>
      </main>
    </div>
  );
};

export default App;
