import React, { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue } from 'react';
import { MEMBER_TYPE_LABELS, MEMBER_TYPE_ANNUAL_FEE_DEFAULTS, memberTypeLabel as sharedMemberTypeLabel } from './shared/memberTypes.mjs';
import Sidebar from './components/Sidebar';
import RolePreviewBar from './components/RolePreviewBar';
import MemberBatchEditor from './MemberBatchEditor';
import MemberForm from './components/MemberForm';
import TrainingManagement from './components/TrainingManagement';
import TrainingApply from './components/TrainingApply';
import AnnualFeeManagement from './components/AnnualFeeManagement';
import BulkMailSender from './components/BulkMailSender';
import RosterDesigner from './components/RosterDesigner';
import MailingListExport from './components/MailingListExport';
import LinePostConsole from './components/LinePostConsole';
import OfficerMasterSettings from './components/OfficerMasterSettings';
import OfficerManagement from './components/OfficerManagement';
import PaymentHistoryConsole from './components/PaymentHistoryConsole';
import ClaimManagementConsole from './components/ClaimManagementConsole';
import MemberDeleteConsole from './components/MemberDeleteConsole';
import DataExportConsole from './components/DataExportConsole';
import ChangeRequestConsole from './components/ChangeRequestConsole';
import { RoleManagementPanel } from './components/RoleManagementPanel';
import MemberDetailAdmin from './components/MemberDetailAdmin';
import StaffDetailAdmin from './components/StaffDetailAdmin';
import { AdminDashboardData, AdminDashboardMemberRow, AdminDashboardStaffRow, AdminPermissionData, AdminPermissionEntry, AdminPermissionLevel, Member, MemberType, Staff, StaffRole, SystemSettings, Training, TrainingFieldConfig, DEFAULT_FIELD_CONFIG, RoleDefinition, MenuRegistryEntry, Regulation } from './types';
import { TRAINING_OPTIONAL_FIELD_DEFS } from './components/TrainingManagement';
import { api, setApiPreviewReadOnly, type AdminLoginResult, type MemberLoginResult, type MemberPortalLookup } from './services/api';
import { canAccessMenu, canUseLinePost, canManageLinePost } from './shared/rbac-util';
import { callApi } from './shared/api-base';
import { EmailCard, MasterOffBanner, MergeTags, ToggleSwitch } from './components/EmailSettingsCard';
import MailTemplateManager from './components/MailTemplateManager';
import { MAIL_TEMPLATE_MERGE_TAGS } from './shared/mailTemplates';
import { computeMemberFiscalStatus } from './shared/memberFiscalStatus.mjs';
import { matchesSearchQuery } from './utils/search';

type Role = 'ADMIN' | 'MEMBER';
type View = 'profile' | 'training-apply' | 'admin' | 'annual-fee-manage' | 'training-manage' | 'bulk-mail' | 'roster-export' | 'mailing-list-export' | 'template-help' | 'member-detail' | 'staff-detail' | 'system-permissions' | 'admin-settings' | 'member-delete' | 'change-requests' | 'officer-management' | 'payment-history' | 'claim-management' | 'line-post' | 'data-export';
type AuthTab = 'member' | 'admin';
type PendingAnnualFeeAction = { type: 'view'; view: View } | { type: 'logout' } | null;
type MemberListFilter = 'ALL' | MemberType;
type MemberStatusFilter = 'ALL' | 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN' | 'TRANSFERRED';
type MemberSortKey = 'memberId' | 'displayName' | 'memberType' | 'trainingCount' | 'tenure' | 'status';
type MemberSortDir = 'asc' | 'desc';
type DisplayMemberStatus = Exclude<MemberStatusFilter, 'ALL'>;
type AppShellMode = 'integrated' | 'member' | 'admin';
type AdminMemberViewMode = 'all' | 'business';
type StaffStatus = 'ENROLLED' | 'LEFT';
type BusinessStaffRoleFilter = 'ALL' | StaffRole;
type BusinessStaffStatusFilter = 'ALL' | StaffStatus;
type BusinessStaffDraft = {
  name: string;
  kana: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  mailingPreference: string;
};
type BusinessStaffDirectoryMember = Pick<Member, 'id' | 'officeName' | 'officeNumber'>;
type BusinessStaffDirectoryRow = {
  member: BusinessStaffDirectoryMember;
  staff: Staff;
  dashboardRow?: AdminDashboardMemberRow;
  draft: BusinessStaffDraft;
  original: BusinessStaffDraft;
  fiscalStatus: StaffStatus | null;
  searchableValues: unknown[];
};
const DEFAULT_MEMBER_PAGE_SIZE = 50;
const getFiscalYearForDate = (date: Date) => (date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear());
const DEFAULT_MEMBER_FISCAL_YEAR_FILTER = getFiscalYearForDate(new Date()).toString();
const DEFAULT_MEMBER_STATUS_FILTER: MemberStatusFilter = 'ACTIVE';

const parseDateString = (value?: string): Date | null => {
  const text = String(value || '').trim();
  if (!text) return null;

  const ymdMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0, 0);
};

const getFiscalYearBounds = (fiscalYear: number) => ({
  start: new Date(fiscalYear, 3, 1, 12, 0, 0, 0),
  end: new Date(fiscalYear + 1, 2, 31, 12, 0, 0, 0),
});

// 日付文字列を 'YYYY-MM-DD'（不正/空は ''）へ正規化。単一情報源 computeMemberFiscalStatus 入力用。
const toIsoDateString = (value?: string): string => {
  const d = parseDateString(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// v376.46: 会計年度ステータス判定は単一情報源 computeMemberFiscalStatus に委譲（宛先リストと同一ロジック）。
const getMemberStatusAtFiscalYear = (
  member: AdminDashboardMemberRow,
  fiscalYear: number | null,
  currentFiscalYear: number,
): DisplayMemberStatus | null => {
  if (fiscalYear === null) return member.status;
  const r = computeMemberFiscalStatus(
    { status: member.status, joinedDate: toIsoDateString(member.joinedDate), withdrawnDate: toIsoDateString(member.withdrawnDate) },
    fiscalYear,
    currentFiscalYear,
  );
  return r.status === 'NOT_IN_YEAR' ? null : (r.status as DisplayMemberStatus);
};

const getStaffStatusAtFiscalYear = (
  staff: Staff,
  fiscalYear: number | null,
  currentFiscalYear: number,
): 'ENROLLED' | 'LEFT' | null => {
  if (fiscalYear === null) return staff.status === 'LEFT' ? 'LEFT' : 'ENROLLED';

  const joined = parseDateString(staff.joinedDate);
  const { start, end } = getFiscalYearBounds(fiscalYear);
  if (joined && joined > end) return null;

  const withdrawn = parseDateString(staff.withdrawnDate);
  if (withdrawn) {
    if (withdrawn < start) return null;
    if (withdrawn <= end) return 'LEFT';
  }

  if (staff.status === 'LEFT' && !withdrawn) {
    return 'LEFT';
  }

  return 'ENROLLED';
};

interface LoginIdentity {
  id: string;
  label: string;
  memberId: string;
  staffId?: string;
  type: MemberType;
  staffRole?: 'REPRESENTATIVE' | 'ADMIN' | 'STAFF';
}

interface AuthenticatedContext {
  memberId: string;
  staffId?: string;
  memberPortalLoginId?: string;
}

const isActiveMemberIdentity = (member: Member): boolean => member.status !== 'WITHDRAWN' && member.status !== 'TRANSFERRED';

const isActiveStaffIdentity = (staff: NonNullable<Member['staff']>[number]): boolean => staff.status !== 'LEFT';

const businessStaffRoleLabel = (role: StaffRole): string => {
  if (role === 'REPRESENTATIVE') return '代表者';
  if (role === 'ADMIN') return '管理者';
  return 'メンバー';
};

const businessStaffStatusLabel = (status: StaffStatus): string => (status === 'LEFT' ? '除籍' : '在籍');
const businessStaffMailingPreferenceLabel = (preference: string): string => (preference === 'NO' ? '配信しない' : '配信する');

const normalizeBusinessStaffDraft = (staff: Staff): BusinessStaffDraft => ({
  name: staff.name || [staff.lastName, staff.firstName].filter(Boolean).join(' '),
  kana: staff.kana || [staff.lastKana, staff.firstKana].filter(Boolean).join(' '),
  email: staff.email || '',
  role: (staff.role || 'STAFF') as StaffRole,
  status: (staff.status === 'LEFT' ? 'LEFT' : 'ENROLLED') as StaffStatus,
  mailingPreference: staff.mailingPreference === 'NO' ? 'NO' : 'YES',
});

const mapAdminDashboardStaffRow = (row: AdminDashboardStaffRow): { member: BusinessStaffDirectoryMember; staff: Staff } => ({
  member: {
    id: row.memberId,
    officeName: row.officeName || '',
    officeNumber: row.officeNumber || '',
  },
  staff: {
    id: row.staffId,
    careManagerNumber: row.careManagerNumber || '',
    lastName: row.lastName || '',
    firstName: row.firstName || '',
    lastKana: row.lastKana || '',
    firstKana: row.firstKana || '',
    name: row.name || [row.lastName, row.firstName].filter(Boolean).join(' '),
    kana: row.kana || [row.lastKana, row.firstKana].filter(Boolean).join(' '),
    email: row.email || '',
    role: (row.role || 'STAFF') as StaffRole,
    status: row.status === 'LEFT' ? 'LEFT' : 'ENROLLED',
    joinedDate: row.joinedDate || '',
    withdrawnDate: row.withdrawnDate || '',
    mailingPreference: row.mailingPreference || 'YES',
  },
});

const businessStaffDraftEquals = (a: BusinessStaffDraft, b: BusinessStaffDraft): boolean => (
  a.name.trim() === b.name.trim()
  && a.kana.trim() === b.kana.trim()
  && a.email.trim() === b.email.trim()
  && a.role === b.role
  && a.status === b.status
  && a.mailingPreference === b.mailingPreference
);

declare global {
  interface Window {
    google?: any;
  }
}

const buildLoginIdentities = (members: Member[]): LoginIdentity[] =>
  members.flatMap((member): LoginIdentity[] => {
    if (!isActiveMemberIdentity(member)) {
      return [];
    }
    if (member.type !== MemberType.BUSINESS) {
      return [{
        id: member.id,
        label: `${sharedMemberTypeLabel(member.type)}: ${member.lastName} ${member.firstName}`,
        memberId: member.id,
        type: member.type,
      }];
    }
    return (member.staff || []).filter(isActiveStaffIdentity).map((staff) => ({
      id: `${member.id}-${staff.id}`,
      label: `事業所会員: ${member.officeName} - ${staff.name} (${staff.role === 'REPRESENTATIVE' ? '代表者' : staff.role === 'ADMIN' ? '管理者' : 'メンバー'})`,
      memberId: member.id,
      staffId: staff.id,
      staffRole: staff.role,
      type: MemberType.BUSINESS,
    }));
  });

// v376.64: 会費設定（画面入力の初期値。実値は GAS の M_会員種別.年会費金額 が正本）
// v376.67: 複数カードで 1 つの凡例を共有する箇所用。カタログを結合して重複タグを除く。
// UI はマージタグを直書きしない（単一情報源は src/shared/mailTemplates.ts）。
const mergeTagUnion = (...lists: [string, string][][]): [string, string][] => {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const list of lists) {
    for (const item of list) {
      if (seen.has(item[0])) continue;
      seen.add(item[0]);
      out.push(item);
    }
  }
  return out;
};

// v376.67: 会費既定値・種別ラベルは src/shared/memberTypes.mjs が単一情報源
const MEMBER_TYPE_ANNUAL_FEE_FALLBACK = MEMBER_TYPE_ANNUAL_FEE_DEFAULTS;
const MEMBER_TYPE_FEE_FIELDS = (['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] as const)
  .map((code) => ({ code, label: MEMBER_TYPE_LABELS[code] }));

const PUBLIC_PORTAL_DEFAULTS = {
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
  completionGuidanceVisible: true,
  completionGuidanceBodyWhenCredentialSent: [
    'ログイン情報をご登録のメールアドレスに送信しました。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。',
  ].join('\n'),
  completionGuidanceBodyWhenCredentialNotSent: [
    'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。',
  ].join('\n'),
  completionLoginInfoBlockVisible: true,
  completionLoginInfoVisible: true,
  completionLoginInfoBodyWhenCredentialSent: 'ログイン情報は画面に表示していません。登録済みのメールをご確認ください。',
  completionLoginInfoBodyWhenCredentialNotSent: 'ログイン情報メールは現在送信していません。公開準備後にご案内します。',
  completionNoCredentialNotice: 'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
  completionCredentialNotice: 'ログイン情報をご登録のメールアドレスに送信しました。',
  trainingBadgeEnabled: true,
  trainingBadgeLabel: '研修申込',
  trainingTitleEnabled: true,
  trainingTitle: '研修を申し込む',
  trainingDescriptionEnabled: true,
  trainingDescription: '受付中の研修一覧を確認し、そのまま申込できます。申込後の取消も研修ページから行えます。',
  trainingCtaLabel: '進む',
  memberUpdateMenuEnabled: true,
  memberUpdateBadgeEnabled: true,
  memberUpdateBadgeLabel: '登録情報変更',
  memberUpdateTitleEnabled: true,
  memberUpdateTitle: '会員登録情報を変更する',
  memberUpdateDescriptionEnabled: true,
  memberUpdateDescription: '住所・電話番号・メールアドレスなど、ご登録情報の変更を申し込めます。介護支援専門員番号でご本人確認を行います。',
  memberUpdateCtaLabel: '変更手続きへ進む',
  withdrawalMenuEnabled: true,
  withdrawalBadgeEnabled: true,
  withdrawalBadgeLabel: '退会',
  withdrawalTitleEnabled: true,
  withdrawalTitle: '退会を申し込む',
  withdrawalDescriptionEnabled: true,
  withdrawalDescription: '退会申請を行います。退会は当年度末（3月31日）に適用されます。介護支援専門員番号でご本人確認を行います。',
  withdrawalCtaLabel: '退会手続きへ進む',
} as const;

const ADMIN_SETTINGS_SECTION_CLASS = 'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden';

// v319: パンくずマップ（グループ名 › コンソール名）
const BREADCRUMB_MAP: Record<string, { group: string; label: string }> = {
  'admin':              { group: '会員管理',   label: '会員一覧' },
  'member-detail':      { group: '会員管理',   label: '会員詳細' },
  'staff-detail':       { group: '会員管理',   label: '事業所職員詳細' },
  'change-requests':    { group: '会員管理',   label: '変更申請管理' },
  'annual-fee-manage':  { group: '財務・帳票', label: '年会費管理' },
  'payment-history':    { group: '財務・帳票', label: '支払い履歴管理' },
  'claim-management':   { group: '財務・帳票', label: '請求管理' },
  'roster-export':      { group: '財務・帳票', label: '名簿出力' },
  'mailing-list-export':{ group: '財務・帳票', label: '宛名リスト出力' },
  'template-help':      { group: '財務・帳票', label: 'テンプレートヘルプ' },
  'training-manage':    { group: '研修・通知', label: '研修管理' },
  'bulk-mail':          { group: '研修・通知', label: '一括メール送信' },
  'line-post':          { group: '研修・通知', label: '📱 公式LINE投稿依頼' },
  'officer-management': { group: '組織管理',   label: '役員管理' },
  'admin-settings':     { group: 'システム',   label: 'システム設定' },
  'system-permissions': { group: 'システム',   label: '権限管理' },
  'member-delete':      { group: 'システム',   label: 'データ管理' },
  'data-export':        { group: 'システム',   label: 'データ出力（CSV）' },
};

type AdminSettingsSectionProps = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

const AdminSettingsSection: React.FC<AdminSettingsSectionProps> = ({
  id,
  title,
  description,
  badge,
  defaultOpen = false,
  children,
}) => (
  <details id={id} open={defaultOpen} className={`${ADMIN_SETTINGS_SECTION_CLASS} group scroll-mt-24`}>
    <summary className="list-none cursor-pointer px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition group-open:rotate-180">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </summary>
    <div className="border-t border-slate-200 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
  </details>
);

const App: React.FC = () => {
  const appShellMode: AppShellMode = import.meta.env.VITE_APP === 'admin'
    ? 'admin'
    : import.meta.env.VITE_APP === 'member'
    ? 'member'
    : 'integrated';
  const isMemberShell = appShellMode === 'member';
  const isAdminShell = appShellMode === 'admin';
  const defaultAuthTab: AuthTab = isAdminShell ? 'admin' : 'member';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminPermissionDrafts, setAdminPermissionDrafts] = useState<Record<string, {
    googleEmail: string;
    linkedAuthId: string;
    permissionLevel: AdminPermissionLevel;
    roleId?: string; // docs/246 Phase 2-C
    enabled: boolean;
  }>>({});
  const [newAdminPermission, setNewAdminPermission] = useState({
    googleEmail: '',
    linkedAuthId: '',
    permissionLevel: 'ADMIN' as AdminPermissionLevel,
    roleId: '' as string, // docs/246 Phase 2-C: 新 RBAC ロール選択
    enabled: true,
  });
  const [adminPermissionLevel, setAdminPermissionLevel] = useState<AdminPermissionLevel | null>(null);
  // docs/246 Phase 3: 動的 Sidebar / routing 用に session の RBAC 情報を保持
  const [adminSessionRbac, setAdminSessionRbac] = useState<{
    isMaster: boolean;
    allowedMenus: string[];
    roleName?: string;
    trainingEditScope?: 'ALL' | 'OWN';
  } | null>(null);
  // docs/246 View-as-role: MASTER 専用「ロール視点プレビュー」。サーバー権限は MASTER のまま、
  // フロント描画（Sidebar / routing / 機能可視）だけを選択ロールの見え方に切替える。
  const [previewRoleId, setPreviewRoleId] = useState<string | null>(null);
  const [previewRoles, setPreviewRoles] = useState<RoleDefinition[] | null>(null);
  const [previewMenuRegistry, setPreviewMenuRegistry] = useState<MenuRegistryEntry[] | null>(null);
  const [previewRolesLoading, setPreviewRolesLoading] = useState(false);
  // プレビュー中はこのロールの見え方を実効値として使う（未選択時は実セッション）。
  const previewedRole = previewRoleId && previewRoles
    ? (previewRoles.find((r) => r.roleId === previewRoleId && !r.isMaster) || null)
    : null;
  const effectiveRbac = previewedRole
    ? {
        isMaster: false,
        allowedMenus: previewedRole.allowedMenus,
        roleName: previewedRole.roleName,
        trainingEditScope: previewedRole.trainingEditScope,
      }
    : adminSessionRbac;
  const [systemSettingsLoaded, setSystemSettingsLoaded] = useState(false);
  const annualFeeLeaveDialogRef = useRef<HTMLDialogElement | null>(null);
  const appDataRequestRef = useRef<Promise<{ members: Member[]; trainings: Training[] }> | null>(null);
  const memberPortalRequestRef = useRef<Promise<{ members: Member[]; trainings: Training[] }> | null>(null);
  const adminDashboardRequestRef = useRef<Promise<AdminDashboardData> | null>(null);
  const trainingManagementRequestRef = useRef<Promise<Training[]> | null>(null);
  const adminPermissionRequestRef = useRef<Promise<AdminPermissionData> | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<AuthTab>(defaultAuthTab);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [memberLoginId, setMemberLoginId] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [rememberLoginId, setRememberLoginId] = useState(false);
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetLoginId, setResetLoginId] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'complete'>('request');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  // 管理者 shell 自動認証: ページロード時にセッション確認を自動実行
  const [adminAutoAuthDone, setAdminAutoAuthDone] = useState(false);
  const [adminAutoAuthFailed, setAdminAutoAuthFailed] = useState(false);
  const [trainingFileFolderIdInput, setTrainingFileFolderIdInput] = useState('');
  const [claimAttachmentFolderIdInput, setClaimAttachmentFolderIdInput] = useState('');
  const [folderSetupBusy, setFolderSetupBusy] = useState(false);
  const [folderSetupResult, setFolderSetupResult] = useState<{ folderId: string; folderUrl: string } | null>(null);
  const [defaultBusinessStaffLimit, setDefaultBusinessStaffLimit] = useState(10);
  const [globalLimitInput, setGlobalLimitInput] = useState('10');
  const [trainingHistoryLookbackMonths, setTrainingHistoryLookbackMonths] = useState(18);
  const [historyLookbackInput, setHistoryLookbackInput] = useState('18');
  const [annualFeePaymentGuidance, setAnnualFeePaymentGuidance] = useState('');
  const [annualFeePaymentGuidanceInput, setAnnualFeePaymentGuidanceInput] = useState('');
  const emptyAnnualFeeTransferAccount: SystemSettings['annualFeeTransferAccount'] = {
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountName: '',
    note: '',
  };
  const [annualFeeTransferAccount, setAnnualFeeTransferAccount] = useState<SystemSettings['annualFeeTransferAccount']>(emptyAnnualFeeTransferAccount);
  const [annualFeeTransferAccountInput, setAnnualFeeTransferAccountInput] = useState<SystemSettings['annualFeeTransferAccount']>(emptyAnnualFeeTransferAccount);
  // v376.65（案C Phase 1）: 規程・重要事項（正本は T_規程）。一括保存バーではなく行単位で保存する。
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [regulationsLoading, setRegulationsLoading] = useState(false);
  const [regulationsError, setRegulationsError] = useState<string | null>(null);
  const [regulationDraft, setRegulationDraft] = useState<Regulation | null>(null);
  const [regulationBusy, setRegulationBusy] = useState(false);
  const loadRegulations = React.useCallback(async () => {
    setRegulationsLoading(true);
    setRegulationsError(null);
    try {
      const list = await api.listRegulations();
      setRegulations(Array.isArray(list) ? list : []);
    } catch (e) {
      setRegulationsError(e instanceof Error ? e.message : '規程の取得に失敗しました。');
    } finally {
      setRegulationsLoading(false);
    }
  }, []);
  // v376.64: 会費設定（金額の正本は M_会員種別.年会費金額）
  const [memberTypeAnnualFeesInput, setMemberTypeAnnualFeesInput] = useState<Record<'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT', string>>({ INDIVIDUAL: '', BUSINESS: '', SUPPORT: '' });
  const [membershipFeePublicVisibleInput, setMembershipFeePublicVisibleInput] = useState(true);
  const [membershipFeeNoteInput, setMembershipFeeNoteInput] = useState('');
  const [trainingDefaultFieldConfig, setTrainingDefaultFieldConfig] = useState<TrainingFieldConfig>({ ...DEFAULT_FIELD_CONFIG });
  const [trainingDefaultFieldConfigInput, setTrainingDefaultFieldConfigInput] = useState<TrainingFieldConfig>({ ...DEFAULT_FIELD_CONFIG });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsIsDirty, setSettingsIsDirty] = useState(false);
  // v317: システム設定サブナビ
  const applyMemberTypeAnnualFeesToInputs = React.useCallback((fees: SystemSettings['memberTypeAnnualFees']) => {
    setMemberTypeAnnualFeesInput({
      INDIVIDUAL: String(fees?.INDIVIDUAL ?? MEMBER_TYPE_ANNUAL_FEE_FALLBACK.INDIVIDUAL),
      BUSINESS: String(fees?.BUSINESS ?? MEMBER_TYPE_ANNUAL_FEE_FALLBACK.BUSINESS),
      SUPPORT: String(fees?.SUPPORT ?? MEMBER_TYPE_ANNUAL_FEE_FALLBACK.SUPPORT),
    });
  }, []);
  const [settingsSub, setSettingsSub] = useState<'basic' | 'fees' | 'regulations' | 'output' | 'email' | 'portal' | 'masters'>('basic');
  // v376.65: 規程タブを開いたときに一覧を取得する（初回のみ・失敗時は再読込ボタン）
  React.useEffect(() => {
    if (settingsSub !== 'regulations') return;
    if (regulations.length > 0 || regulationsLoading || regulationsError) return;
    void loadRegulations();
  }, [settingsSub, regulations.length, regulationsLoading, regulationsError, loadRegulations]);
  // v319: 変更申請 PENDING バッジカウント
  const [pendingChangeRequestCount, setPendingChangeRequestCount] = useState<number>(0);
  // v194: PDF名簿出力 & 一括メール送信設定
  // v373.7 (S5 Phase 2): rosterTemplateSsIdInput / reminderTemplateSsIdInput state 撤去
  // v373.6 (S5): 旧 RosterExport テンプレートライブラリ state は撤去。
  // GAS 側の T_システム設定.ROSTER_TEMPLATE_LIST は次セッションで撤去予定。
  const [bulkMailAutoAttachFolderIdInput, setBulkMailAutoAttachFolderIdInput] = useState('');
  const [emailLogViewerRoleInput, setEmailLogViewerRoleInput] = useState('MASTER');
  // v209: 入会時認証情報メール設定
  const CREDENTIAL_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】会員登録完了のお知らせ';
  const CREDENTIAL_EMAIL_DEFAULT_BODY = '{{氏名}} 様\n\n会員登録が完了しました。\n以下のログイン情報で会員マイページにアクセスできます。\n\nログインID: {{ログインID}}\n初期パスワード: {{パスワード}}\n\n会員マイページURL:\n{{会員マイページURL}}\n\n初回ログイン後、パスワードの変更をお勧めします。\n\n※このメールに心当たりがない場合は、お手数ですが削除してください。\n─────────────────────────────\n枚方市介護支援専門員連絡協議会\n';
  const [credentialEmailEnabledInput, setCredentialEmailEnabledInput] = useState(true);
  const [credentialEmailFromInput, setCredentialEmailFromInput] = useState('');
  const [credentialEmailSubjectInput, setCredentialEmailSubjectInput] = useState(CREDENTIAL_EMAIL_DEFAULT_SUBJECT);
  const [credentialEmailBodyInput, setCredentialEmailBodyInput] = useState(CREDENTIAL_EMAIL_DEFAULT_BODY);
  const [credentialEmailAliases, setCredentialEmailAliases] = useState<string[]>([]);
  const [credentialEmailAliasWarning, setCredentialEmailAliasWarning] = useState<string | null>(null);
  const [credentialEmailAliasLoading, setCredentialEmailAliasLoading] = useState(false);
  // v219: 入会メール テンプレート管理
  const [emailTemplates, setEmailTemplates] = useState<import('./types').EmailTemplate[]>([]);
  const [templateListLoaded, setTemplateListLoaded] = useState(false);
  const [templateSaveNameInput, setTemplateSaveNameInput] = useState('');
  const [showTemplateSaveForm, setShowTemplateSaveForm] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateDeleting, setTemplateDeleting] = useState<string | null>(null);
  // v210: 公開ポータル メニュー表示設定
  const [publicPortalTrainingMenuEnabledInput, setPublicPortalTrainingMenuEnabledInput] = useState(true);
  const [publicPortalMembershipMenuEnabledInput, setPublicPortalMembershipMenuEnabledInput] = useState(true);
  const [publicPortalHeroBadgeEnabledInput, setPublicPortalHeroBadgeEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled);
  const [publicPortalHeroBadgeLabelInput, setPublicPortalHeroBadgeLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.heroBadgeLabel);
  const [publicPortalHeroTitleInput, setPublicPortalHeroTitleInput] = useState(PUBLIC_PORTAL_DEFAULTS.heroTitle);
  const [publicPortalHeroDescriptionEnabledInput, setPublicPortalHeroDescriptionEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled);
  const [publicPortalHeroDescriptionInput, setPublicPortalHeroDescriptionInput] = useState(PUBLIC_PORTAL_DEFAULTS.heroDescription);
  const [publicPortalMembershipBadgeEnabledInput, setPublicPortalMembershipBadgeEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled);
  const [publicPortalMembershipBadgeLabelInput, setPublicPortalMembershipBadgeLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.membershipBadgeLabel);
  const [publicPortalMembershipTitleEnabledInput, setPublicPortalMembershipTitleEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled);
  const [publicPortalMembershipTitleInput, setPublicPortalMembershipTitleInput] = useState(PUBLIC_PORTAL_DEFAULTS.membershipTitle);
  const [publicPortalMembershipDescriptionEnabledInput, setPublicPortalMembershipDescriptionEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled);
  const [publicPortalMembershipDescriptionInput, setPublicPortalMembershipDescriptionInput] = useState(PUBLIC_PORTAL_DEFAULTS.membershipDescription);
  const [publicPortalMembershipCtaLabelInput, setPublicPortalMembershipCtaLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel);
  const [publicPortalCompletionGuidanceVisibleInput, setPublicPortalCompletionGuidanceVisibleInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible);
  const [publicPortalCompletionGuidanceBodyWhenCredentialSentInput, setPublicPortalCompletionGuidanceBodyWhenCredentialSentInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialSent);
  const [publicPortalCompletionGuidanceBodyWhenCredentialNotSentInput, setPublicPortalCompletionGuidanceBodyWhenCredentialNotSentInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialNotSent);
  const [publicPortalCompletionLoginInfoBlockVisibleInput, setPublicPortalCompletionLoginInfoBlockVisibleInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible);
  const [publicPortalCompletionLoginInfoVisibleInput, setPublicPortalCompletionLoginInfoVisibleInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible);
  const [publicPortalCompletionLoginInfoBodyWhenCredentialSentInput, setPublicPortalCompletionLoginInfoBodyWhenCredentialSentInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialSent);
  const [publicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput, setPublicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent);
  const [publicPortalCompletionNoCredentialNoticeInput, setPublicPortalCompletionNoCredentialNoticeInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice);
  const [publicPortalCompletionCredentialNoticeInput, setPublicPortalCompletionCredentialNoticeInput] = useState(PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice);
  const [publicPortalTrainingBadgeEnabledInput, setPublicPortalTrainingBadgeEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled);
  const [publicPortalTrainingBadgeLabelInput, setPublicPortalTrainingBadgeLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.trainingBadgeLabel);
  const [publicPortalTrainingTitleEnabledInput, setPublicPortalTrainingTitleEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled);
  const [publicPortalTrainingTitleInput, setPublicPortalTrainingTitleInput] = useState(PUBLIC_PORTAL_DEFAULTS.trainingTitle);
  const [publicPortalTrainingDescriptionEnabledInput, setPublicPortalTrainingDescriptionEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled);
  const [publicPortalTrainingDescriptionInput, setPublicPortalTrainingDescriptionInput] = useState(PUBLIC_PORTAL_DEFAULTS.trainingDescription);
  const [publicPortalTrainingCtaLabelInput, setPublicPortalTrainingCtaLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.trainingCtaLabel);
  const [publicPortalMemberUpdateMenuEnabledInput, setPublicPortalMemberUpdateMenuEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled);
  const [publicPortalMemberUpdateBadgeEnabledInput, setPublicPortalMemberUpdateBadgeEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled);
  const [publicPortalMemberUpdateBadgeLabelInput, setPublicPortalMemberUpdateBadgeLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeLabel);
  const [publicPortalMemberUpdateTitleEnabledInput, setPublicPortalMemberUpdateTitleEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled);
  const [publicPortalMemberUpdateTitleInput, setPublicPortalMemberUpdateTitleInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateTitle);
  const [publicPortalMemberUpdateDescriptionEnabledInput, setPublicPortalMemberUpdateDescriptionEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled);
  const [publicPortalMemberUpdateDescriptionInput, setPublicPortalMemberUpdateDescriptionInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateDescription);
  const [publicPortalMemberUpdateCtaLabelInput, setPublicPortalMemberUpdateCtaLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.memberUpdateCtaLabel);
  const [publicPortalWithdrawalMenuEnabledInput, setPublicPortalWithdrawalMenuEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled);
  const [publicPortalWithdrawalBadgeEnabledInput, setPublicPortalWithdrawalBadgeEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled);
  const [publicPortalWithdrawalBadgeLabelInput, setPublicPortalWithdrawalBadgeLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeLabel);
  const [publicPortalWithdrawalTitleEnabledInput, setPublicPortalWithdrawalTitleEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled);
  const [publicPortalWithdrawalTitleInput, setPublicPortalWithdrawalTitleInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalTitle);
  const [publicPortalWithdrawalDescriptionEnabledInput, setPublicPortalWithdrawalDescriptionEnabledInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled);
  const [publicPortalWithdrawalDescriptionInput, setPublicPortalWithdrawalDescriptionInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalDescription);
  const [publicPortalWithdrawalCtaLabelInput, setPublicPortalWithdrawalCtaLabelInput] = useState(PUBLIC_PORTAL_DEFAULTS.withdrawalCtaLabel);
  // v265: 個人・賛助会員メール ON/OFF
  const [indSuppEmailEnabledInput, setIndSuppEmailEnabledInput] = useState(true);
  // v265: 事業所メール設定
  const BIZ_REP_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】事業所会員登録完了のお知らせ（代表者）';
  const BIZ_STAFF_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】事業所会員登録完了のお知らせ';
  const STAFF_ADD_STAFF_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】事業所会員メンバー追加のお知らせ';
  const STAFF_ADD_REP_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】新メンバー追加のお知らせ';
  const [bizRepEmailEnabledInput, setBizRepEmailEnabledInput] = useState(true);
  const [bizRepEmailSubjectInput, setBizRepEmailSubjectInput] = useState(BIZ_REP_SUBJECT_DEFAULT);
  const [bizRepEmailBodyInput, setBizRepEmailBodyInput] = useState('');
  // v369: 変更申請ワークフローメール（受付確認・承認通知・却下通知）
  const APPLICATION_RECEIPT_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}を受け付けました';
  const APPROVAL_NOTIFICATION_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}が承認されました';
  const REJECTION_NOTIFICATION_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}について';
  const [applicationReceiptEnabledInput, setApplicationReceiptEnabledInput] = useState(true);
  const [applicationReceiptSubjectInput, setApplicationReceiptSubjectInput] = useState(APPLICATION_RECEIPT_SUBJECT_DEFAULT);
  const [applicationReceiptBodyInput, setApplicationReceiptBodyInput] = useState('');
  const [approvalNotificationEnabledInput, setApprovalNotificationEnabledInput] = useState(true);
  const [approvalNotificationSubjectInput, setApprovalNotificationSubjectInput] = useState(APPROVAL_NOTIFICATION_SUBJECT_DEFAULT);
  const [approvalNotificationBodyInput, setApprovalNotificationBodyInput] = useState('');
  const [rejectionNotificationEnabledInput, setRejectionNotificationEnabledInput] = useState(true);
  const [rejectionNotificationSubjectInput, setRejectionNotificationSubjectInput] = useState(REJECTION_NOTIFICATION_SUBJECT_DEFAULT);
  const [rejectionNotificationBodyInput, setRejectionNotificationBodyInput] = useState('');
  // v371: メール送信 4 階層ガード（GLOBAL / MODE / ALLOWLIST / CATEGORY）
  // 初期値は false（safe-stop）— サーバ側設定が読み込まれるまでメール送信を止めて見せる
  const [mailGlobalEnabledInput, setMailGlobalEnabledInput] = useState(false);
  const [mailDeliveryModeInput, setMailDeliveryModeInput] = useState<'LIVE' | 'REDIRECT' | 'SUPPRESS'>('LIVE');
  const [mailRedirectAllowlistInput, setMailRedirectAllowlistInput] = useState('');
  const [trainingApplyReceiptEnabledInput, setTrainingApplyReceiptEnabledInput] = useState(true);
  const [trainingReminderEnabledInput, setTrainingReminderEnabledInput] = useState(true);
  const [bulkMailEnabledInput, setBulkMailEnabledInput] = useState(true);
  const [authOtpEnabledInput, setAuthOtpEnabledInput] = useState(true);
  const [memberUpdateConfirmEnabledInput, setMemberUpdateConfirmEnabledInput] = useState(true);
  const [withdrawalConfirmEnabledInput, setWithdrawalConfirmEnabledInput] = useState(true);
  const [passwordResetEnabledInput, setPasswordResetEnabledInput] = useState(true);
  // v376.43 (Phase B): 従来ハードコード6メールの件名/本文（差し込みタグ対応）。既定件名はサーバ既定と一致。
  const TRAINING_APPLY_RECEIPT_SUBJECT_DEFAULT = '【研修申込確認】{{研修名}}';
  const TRAINING_REMINDER_SUBJECT_DEFAULT = '【研修リマインド】{{研修名}}';
  const AUTH_OTP_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】{{用途}} 確認コード';
  const MEMBER_UPDATE_CONFIRM_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】会員登録情報変更のご確認';
  const WITHDRAWAL_CONFIRM_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】退会申請受付のご確認';
  const PASSWORD_RESET_SUBJECT_DEFAULT = '【枚方市介護支援専門員連絡協議会】パスワード再設定手続き';
  const [trainingApplyReceiptSubjectInput, setTrainingApplyReceiptSubjectInput] = useState(TRAINING_APPLY_RECEIPT_SUBJECT_DEFAULT);
  const [trainingApplyReceiptBodyInput, setTrainingApplyReceiptBodyInput] = useState('');
  const [trainingReminderSubjectInput, setTrainingReminderSubjectInput] = useState(TRAINING_REMINDER_SUBJECT_DEFAULT);
  const [trainingReminderBodyInput, setTrainingReminderBodyInput] = useState('');
  const [authOtpSubjectInput, setAuthOtpSubjectInput] = useState(AUTH_OTP_SUBJECT_DEFAULT);
  const [authOtpBodyInput, setAuthOtpBodyInput] = useState('');
  const [memberUpdateConfirmSubjectInput, setMemberUpdateConfirmSubjectInput] = useState(MEMBER_UPDATE_CONFIRM_SUBJECT_DEFAULT);
  const [memberUpdateConfirmBodyInput, setMemberUpdateConfirmBodyInput] = useState('');
  const [withdrawalConfirmSubjectInput, setWithdrawalConfirmSubjectInput] = useState(WITHDRAWAL_CONFIRM_SUBJECT_DEFAULT);
  const [withdrawalConfirmBodyInput, setWithdrawalConfirmBodyInput] = useState('');
  const [passwordResetSubjectInput, setPasswordResetSubjectInput] = useState(PASSWORD_RESET_SUBJECT_DEFAULT);
  const [passwordResetBodyInput, setPasswordResetBodyInput] = useState('');
  const [bizStaffEmailEnabledInput, setBizStaffEmailEnabledInput] = useState(true);
  const [bizStaffEmailSubjectInput, setBizStaffEmailSubjectInput] = useState(BIZ_STAFF_SUBJECT_DEFAULT);
  const [bizStaffEmailBodyInput, setBizStaffEmailBodyInput] = useState('');
  const [staffAddStaffEmailEnabledInput, setStaffAddStaffEmailEnabledInput] = useState(true);
  const [staffAddStaffEmailSubjectInput, setStaffAddStaffEmailSubjectInput] = useState(STAFF_ADD_STAFF_SUBJECT_DEFAULT);
  const [staffAddStaffEmailBodyInput, setStaffAddStaffEmailBodyInput] = useState('');
  const [staffAddRepEmailEnabledInput, setStaffAddRepEmailEnabledInput] = useState(true);
  const [staffAddRepEmailSubjectInput, setStaffAddRepEmailSubjectInput] = useState(STAFF_ADD_REP_SUBJECT_DEFAULT);
  const [staffAddRepEmailBodyInput, setStaffAddRepEmailBodyInput] = useState('');
  const [adminMemberViewMode, setAdminMemberViewMode] = useState<AdminMemberViewMode>('all');
  const [memberListQuery, setMemberListQuery] = useState('');
  const [memberListFilter, setMemberListFilter] = useState<MemberListFilter>('ALL');
  const [memberListStatusFilter, setMemberListStatusFilter] = useState<MemberStatusFilter>(DEFAULT_MEMBER_STATUS_FILTER);
  const [memberListFiscalYearFilter, setMemberListFiscalYearFilter] = useState<string>(DEFAULT_MEMBER_FISCAL_YEAR_FILTER);
  const [memberListPage, setMemberListPage] = useState(1);
  const [memberListPageSize, setMemberListPageSize] = useState(DEFAULT_MEMBER_PAGE_SIZE);
  const [memberSortKey, setMemberSortKey] = useState<MemberSortKey>('displayName');
  const [memberSortDir, setMemberSortDir] = useState<MemberSortDir>('asc');
  const [businessMemberQuery, setBusinessMemberQuery] = useState('');
  const [businessMemberPage, setBusinessMemberPage] = useState(1);
  const [businessStaffRoleFilter, setBusinessStaffRoleFilter] = useState<BusinessStaffRoleFilter>('ALL');
  const [businessStaffStatusFilter, setBusinessStaffStatusFilter] = useState<BusinessStaffStatusFilter>('ALL');
  const [businessStaffDrafts, setBusinessStaffDrafts] = useState<Record<string, BusinessStaffDraft>>({});
  const [businessStaffSaving, setBusinessStaffSaving] = useState(false);
  const [businessStaffSaveMessage, setBusinessStaffSaveMessage] = useState<string | null>(null);
  const [businessStaffSaveError, setBusinessStaffSaveError] = useState<string | null>(null);
  const [selectedMemberForDetailId, setSelectedMemberForDetailId] = useState<string | null>(null);
  const [selectedMemberForDetailSnapshot, setSelectedMemberForDetailSnapshot] = useState<Member | null>(null);
  // v363.2: 会員詳細をモーダル表示するためのフラグ。trueなら overlay 表示、currentView は元のまま維持
  const [memberDetailModalOpen, setMemberDetailModalOpen] = useState(false);
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<{ memberId: string; staffId: string } | null>(null);
  const [staffSaveToast, setStaffSaveToast] = useState<string | null>(null);
  const [withdrawingMemberId, setWithdrawingMemberId] = useState<string | null>(null);

  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('');
  const [authenticatedContext, setAuthenticatedContext] = useState<AuthenticatedContext | null>(null);

  const applySystemSettings = (systemSettings: SystemSettings) => {
    setTrainingFileFolderIdInput(systemSettings.trainingFileFolderId || '');
    setClaimAttachmentFolderIdInput(systemSettings.claimAttachmentFolderId || '');
    const limit = Number(systemSettings.defaultBusinessStaffLimit || 10);
    const lookback = Number(systemSettings.trainingHistoryLookbackMonths || 18);
    const guidance = String(systemSettings.annualFeePaymentGuidance || '');
    const transferAccount = systemSettings.annualFeeTransferAccount || emptyAnnualFeeTransferAccount;
    const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
    const normalizedLookback = Number.isFinite(lookback) && lookback > 0 ? Math.floor(lookback) : 18;
    setDefaultBusinessStaffLimit(normalizedLimit);
    setGlobalLimitInput(String(normalizedLimit));
    setTrainingHistoryLookbackMonths(normalizedLookback);
    setHistoryLookbackInput(String(normalizedLookback));
    setAnnualFeePaymentGuidance(guidance);
    setAnnualFeePaymentGuidanceInput(guidance);
    setAnnualFeeTransferAccount(transferAccount);
    setAnnualFeeTransferAccountInput(transferAccount);
    applyMemberTypeAnnualFeesToInputs(systemSettings.memberTypeAnnualFees);
    setMembershipFeePublicVisibleInput(systemSettings.membershipFeePublicVisible ?? true);
    setMembershipFeeNoteInput(systemSettings.membershipFeeNote ?? '');
    const tdfConfig = systemSettings.trainingDefaultFieldConfig ?? { ...DEFAULT_FIELD_CONFIG };
    setTrainingDefaultFieldConfig(tdfConfig);
    setTrainingDefaultFieldConfigInput(tdfConfig);
    // v194
    setBulkMailAutoAttachFolderIdInput(systemSettings.bulkMailAutoAttachFolderId ?? '');
    setEmailLogViewerRoleInput(systemSettings.emailLogViewerRole ?? 'MASTER');
    // v209
    setCredentialEmailEnabledInput(systemSettings.credentialEmailEnabled ?? true);
    setCredentialEmailFromInput(systemSettings.credentialEmailFrom ?? '');
    setCredentialEmailSubjectInput(systemSettings.credentialEmailSubject ?? CREDENTIAL_EMAIL_DEFAULT_SUBJECT);
    setCredentialEmailBodyInput(systemSettings.credentialEmailBody ?? CREDENTIAL_EMAIL_DEFAULT_BODY);
    // v219: テンプレート一覧をバックグラウンド取得（設定ロード時に並行）
    if (!templateListLoaded) {
      api.getCredentialEmailTemplates().then(ts => {
        setEmailTemplates(ts);
        setTemplateListLoaded(true);
      }).catch(() => {});
    }
    // v210
    setPublicPortalTrainingMenuEnabledInput(systemSettings.publicPortalTrainingMenuEnabled ?? true);
    setPublicPortalMembershipMenuEnabledInput(systemSettings.publicPortalMembershipMenuEnabled ?? true);
    setPublicPortalHeroBadgeEnabledInput(systemSettings.publicPortalHeroBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled);
    setPublicPortalHeroBadgeLabelInput(systemSettings.publicPortalHeroBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.heroBadgeLabel);
    setPublicPortalHeroTitleInput(systemSettings.publicPortalHeroTitle ?? PUBLIC_PORTAL_DEFAULTS.heroTitle);
    setPublicPortalHeroDescriptionEnabledInput(systemSettings.publicPortalHeroDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled);
    setPublicPortalHeroDescriptionInput(systemSettings.publicPortalHeroDescription ?? PUBLIC_PORTAL_DEFAULTS.heroDescription);
    setPublicPortalMembershipBadgeEnabledInput(systemSettings.publicPortalMembershipBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled);
    setPublicPortalMembershipBadgeLabelInput(systemSettings.publicPortalMembershipBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.membershipBadgeLabel);
    setPublicPortalMembershipTitleEnabledInput(systemSettings.publicPortalMembershipTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled);
    setPublicPortalMembershipTitleInput(systemSettings.publicPortalMembershipTitle ?? PUBLIC_PORTAL_DEFAULTS.membershipTitle);
    setPublicPortalMembershipDescriptionEnabledInput(systemSettings.publicPortalMembershipDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled);
    setPublicPortalMembershipDescriptionInput(systemSettings.publicPortalMembershipDescription ?? PUBLIC_PORTAL_DEFAULTS.membershipDescription);
    setPublicPortalMembershipCtaLabelInput(systemSettings.publicPortalMembershipCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel);
    setPublicPortalCompletionGuidanceVisibleInput(systemSettings.publicPortalCompletionGuidanceVisible ?? PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible);
    setPublicPortalCompletionGuidanceBodyWhenCredentialSentInput(systemSettings.publicPortalCompletionGuidanceBodyWhenCredentialSent ?? PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialSent);
    setPublicPortalCompletionGuidanceBodyWhenCredentialNotSentInput(systemSettings.publicPortalCompletionGuidanceBodyWhenCredentialNotSent ?? PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialNotSent);
    setPublicPortalCompletionLoginInfoBlockVisibleInput(systemSettings.publicPortalCompletionLoginInfoBlockVisible ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible);
    setPublicPortalCompletionLoginInfoVisibleInput(systemSettings.publicPortalCompletionLoginInfoVisible ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible);
    setPublicPortalCompletionLoginInfoBodyWhenCredentialSentInput(systemSettings.publicPortalCompletionLoginInfoBodyWhenCredentialSent ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialSent);
    setPublicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput(systemSettings.publicPortalCompletionLoginInfoBodyWhenCredentialNotSent ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent);
    setPublicPortalCompletionNoCredentialNoticeInput(systemSettings.publicPortalCompletionNoCredentialNotice ?? PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice);
    setPublicPortalCompletionCredentialNoticeInput(systemSettings.publicPortalCompletionCredentialNotice ?? PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice);
    setPublicPortalTrainingBadgeEnabledInput(systemSettings.publicPortalTrainingBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled);
    setPublicPortalTrainingBadgeLabelInput(systemSettings.publicPortalTrainingBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.trainingBadgeLabel);
    setPublicPortalTrainingTitleEnabledInput(systemSettings.publicPortalTrainingTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled);
    setPublicPortalTrainingTitleInput(systemSettings.publicPortalTrainingTitle ?? PUBLIC_PORTAL_DEFAULTS.trainingTitle);
    setPublicPortalTrainingDescriptionEnabledInput(systemSettings.publicPortalTrainingDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled);
    setPublicPortalTrainingDescriptionInput(systemSettings.publicPortalTrainingDescription ?? PUBLIC_PORTAL_DEFAULTS.trainingDescription);
    setPublicPortalTrainingCtaLabelInput(systemSettings.publicPortalTrainingCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.trainingCtaLabel);
    setPublicPortalMemberUpdateMenuEnabledInput(systemSettings.publicPortalMemberUpdateMenuEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled);
    setPublicPortalMemberUpdateBadgeEnabledInput(systemSettings.publicPortalMemberUpdateBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled);
    setPublicPortalMemberUpdateBadgeLabelInput(systemSettings.publicPortalMemberUpdateBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeLabel);
    setPublicPortalMemberUpdateTitleEnabledInput(systemSettings.publicPortalMemberUpdateTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled);
    setPublicPortalMemberUpdateTitleInput(systemSettings.publicPortalMemberUpdateTitle ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitle);
    setPublicPortalMemberUpdateDescriptionEnabledInput(systemSettings.publicPortalMemberUpdateDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled);
    setPublicPortalMemberUpdateDescriptionInput(systemSettings.publicPortalMemberUpdateDescription ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescription);
    setPublicPortalMemberUpdateCtaLabelInput(systemSettings.publicPortalMemberUpdateCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateCtaLabel);
    setPublicPortalWithdrawalMenuEnabledInput(systemSettings.publicPortalWithdrawalMenuEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled);
    setPublicPortalWithdrawalBadgeEnabledInput(systemSettings.publicPortalWithdrawalBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled);
    setPublicPortalWithdrawalBadgeLabelInput(systemSettings.publicPortalWithdrawalBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeLabel);
    setPublicPortalWithdrawalTitleEnabledInput(systemSettings.publicPortalWithdrawalTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled);
    setPublicPortalWithdrawalTitleInput(systemSettings.publicPortalWithdrawalTitle ?? PUBLIC_PORTAL_DEFAULTS.withdrawalTitle);
    setPublicPortalWithdrawalDescriptionEnabledInput(systemSettings.publicPortalWithdrawalDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled);
    setPublicPortalWithdrawalDescriptionInput(systemSettings.publicPortalWithdrawalDescription ?? PUBLIC_PORTAL_DEFAULTS.withdrawalDescription);
    setPublicPortalWithdrawalCtaLabelInput(systemSettings.publicPortalWithdrawalCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.withdrawalCtaLabel);
    // v265: 個人・賛助会員メール ON/OFF
    setIndSuppEmailEnabledInput(systemSettings.indSuppEmailEnabled ?? true);
    // v265: 事業所メール設定ロード
    setBizRepEmailEnabledInput(systemSettings.bizRepEmailEnabled ?? true);
    setBizRepEmailSubjectInput(systemSettings.bizRepEmailSubject ?? BIZ_REP_SUBJECT_DEFAULT);
    setBizRepEmailBodyInput(systemSettings.bizRepEmailBody ?? '');
    // v369: 変更申請ワークフローメール
    setApplicationReceiptEnabledInput(systemSettings.applicationReceiptEnabled ?? true);
    setApplicationReceiptSubjectInput(systemSettings.applicationReceiptSubject ?? APPLICATION_RECEIPT_SUBJECT_DEFAULT);
    setApplicationReceiptBodyInput(systemSettings.applicationReceiptBody ?? '');
    setApprovalNotificationEnabledInput(systemSettings.approvalNotificationEnabled ?? true);
    setApprovalNotificationSubjectInput(systemSettings.approvalNotificationSubject ?? APPROVAL_NOTIFICATION_SUBJECT_DEFAULT);
    setApprovalNotificationBodyInput(systemSettings.approvalNotificationBody ?? '');
    setRejectionNotificationEnabledInput(systemSettings.rejectionNotificationEnabled ?? true);
    setRejectionNotificationSubjectInput(systemSettings.rejectionNotificationSubject ?? REJECTION_NOTIFICATION_SUBJECT_DEFAULT);
    setRejectionNotificationBodyInput(systemSettings.rejectionNotificationBody ?? '');
    // v376.43 (Phase B): 従来ハードコード6メールの件名/本文ロード
    setTrainingApplyReceiptSubjectInput(systemSettings.trainingApplyReceiptSubject ?? TRAINING_APPLY_RECEIPT_SUBJECT_DEFAULT);
    setTrainingApplyReceiptBodyInput(systemSettings.trainingApplyReceiptBody ?? '');
    setTrainingReminderSubjectInput(systemSettings.trainingReminderSubject ?? TRAINING_REMINDER_SUBJECT_DEFAULT);
    setTrainingReminderBodyInput(systemSettings.trainingReminderBody ?? '');
    setAuthOtpSubjectInput(systemSettings.authOtpSubject ?? AUTH_OTP_SUBJECT_DEFAULT);
    setAuthOtpBodyInput(systemSettings.authOtpBody ?? '');
    setMemberUpdateConfirmSubjectInput(systemSettings.memberUpdateConfirmSubject ?? MEMBER_UPDATE_CONFIRM_SUBJECT_DEFAULT);
    setMemberUpdateConfirmBodyInput(systemSettings.memberUpdateConfirmBody ?? '');
    setWithdrawalConfirmSubjectInput(systemSettings.withdrawalConfirmSubject ?? WITHDRAWAL_CONFIRM_SUBJECT_DEFAULT);
    setWithdrawalConfirmBodyInput(systemSettings.withdrawalConfirmBody ?? '');
    setPasswordResetSubjectInput(systemSettings.passwordResetSubject ?? PASSWORD_RESET_SUBJECT_DEFAULT);
    setPasswordResetBodyInput(systemSettings.passwordResetBody ?? '');
    setBizStaffEmailEnabledInput(systemSettings.bizStaffEmailEnabled ?? true);
    setBizStaffEmailSubjectInput(systemSettings.bizStaffEmailSubject ?? BIZ_STAFF_SUBJECT_DEFAULT);
    setBizStaffEmailBodyInput(systemSettings.bizStaffEmailBody ?? '');
    setStaffAddStaffEmailEnabledInput(systemSettings.staffAddStaffEmailEnabled ?? true);
    setStaffAddStaffEmailSubjectInput(systemSettings.staffAddStaffEmailSubject ?? STAFF_ADD_STAFF_SUBJECT_DEFAULT);
    setStaffAddStaffEmailBodyInput(systemSettings.staffAddStaffEmailBody ?? '');
    setStaffAddRepEmailEnabledInput(systemSettings.staffAddRepEmailEnabled ?? true);
    setStaffAddRepEmailSubjectInput(systemSettings.staffAddRepEmailSubject ?? STAFF_ADD_REP_SUBJECT_DEFAULT);
    setStaffAddRepEmailBodyInput(systemSettings.staffAddRepEmailBody ?? '');
    // v371: メール送信 4 階層ガード ロード
    setMailGlobalEnabledInput(systemSettings.mailGlobalEnabled ?? false);
    setMailDeliveryModeInput((systemSettings.mailDeliveryMode as 'LIVE' | 'REDIRECT' | 'SUPPRESS') ?? 'LIVE');
    setMailRedirectAllowlistInput(systemSettings.mailRedirectAllowlist ?? '');
    setTrainingApplyReceiptEnabledInput(systemSettings.trainingApplyReceiptEnabled ?? true);
    setTrainingReminderEnabledInput(systemSettings.trainingReminderEnabled ?? true);
    setBulkMailEnabledInput(systemSettings.bulkMailEnabled ?? true);
    setAuthOtpEnabledInput(systemSettings.authOtpEnabled ?? true);
    setMemberUpdateConfirmEnabledInput(systemSettings.memberUpdateConfirmEnabled ?? true);
    setWithdrawalConfirmEnabledInput(systemSettings.withdrawalConfirmEnabled ?? true);
    setPasswordResetEnabledInput(systemSettings.passwordResetEnabled ?? true);
    setSettingsIsDirty(false);
    setSystemSettingsLoaded(true);
  };

  const loadCredentialEmailAliases = useCallback(async () => {
    setCredentialEmailAliasLoading(true);
    try {
      const { aliases, warning } = await api.getAdminEmailAliases();
      setCredentialEmailAliases(Array.from(new Set((aliases || []).map((value) => String(value || '').trim()).filter(Boolean))));
      setCredentialEmailAliasWarning(warning || null);
    } catch (error) {
      setCredentialEmailAliasWarning(error instanceof Error ? error.message : '送信元アドレス一覧の取得に失敗しました。');
    } finally {
      setCredentialEmailAliasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'ADMIN' || currentView !== 'admin-settings') return;
    if (credentialEmailAliases.length > 0 || credentialEmailAliasLoading) return;
    void loadCredentialEmailAliases();
  }, [isAuthenticated, userRole, currentView, credentialEmailAliases.length, credentialEmailAliasLoading, loadCredentialEmailAliases]);

  const credentialEmailFromOptions = useMemo(() => {
    return Array.from(new Set([credentialEmailFromInput, ...credentialEmailAliases].map((value) => String(value || '').trim()).filter(Boolean)));
  }, [credentialEmailFromInput, credentialEmailAliases]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedLoginId = window.localStorage.getItem('hcmn.member.loginId') || '';
      if (savedLoginId) {
        setMemberLoginId(savedLoginId);
        setResetLoginId(savedLoginId);
        setRememberLoginId(true);
      }
    } catch {
      // ローカル保存が使えない環境では通常入力にフォールバックする。
    }
  }, []);

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
            ? api.getSystemSettings().catch(() => ({ defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18, annualFeePaymentGuidance: '', annualFeeTransferAccount: emptyAnnualFeeTransferAccount }))
            : Promise.resolve(null),
        ]);
        setMembers(nextMembers);
        setTrainings(nextTrainings);
        setFullDataLoaded(true);
        if (userRole !== 'ADMIN') {
          setMemberPortalLoaded(true);
        }
        setTrainingManagementLoaded(true);
        if (systemSettings) {
          applySystemSettings(systemSettings);
        }
        return { members: nextMembers, trainings: nextTrainings };
      } catch (error) {
        console.error('Initialization failed:', error);
        if (!silent) {
          setInitError(error instanceof Error ? error.message : 'データの読み込みに失敗しました。');
        }
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
    lookup: MemberPortalLookup,
    options: { force?: boolean } = {},
  ): Promise<{ members: Member[]; trainings: Training[] }> => {
    const { force = false } = options;
    if (!lookup.loginId && !lookup.memberId) {
      throw new Error('loginId または memberId が未指定です。');
    }
    if (!force && memberPortalRequestRef.current) {
      return memberPortalRequestRef.current;
    }

    const request = (async () => {
      try {
        setIsLoading(true);
        setInitError(null);
        const next = await api.getMemberPortalData(lookup);
        setMembers(next.members);
        setTrainings(next.trainings);
        setMemberPortalLoaded(true);
        // v235: バックエンドが解決した memberId/staffId がセッションと異なる場合（ロール変換後など）
        // authenticatedContext を自動補正してマイページが正しい種別で表示されるようにする
        if (next.resolvedMemberId) {
          setAuthenticatedContext(prev => {
            if (!prev) return prev;
            if (prev.memberId === next.resolvedMemberId && (prev.staffId || '') === (next.resolvedStaffId || '')) return prev;
            return { ...prev, memberId: next.resolvedMemberId!, staffId: next.resolvedStaffId || undefined };
          });
          // selectedIdentityId も更新（ロール変換後に正しい Identity が選択されるよう）
          const newIdentityId = next.resolvedStaffId
            ? `${next.resolvedMemberId}-${next.resolvedStaffId}`
            : next.resolvedMemberId;
          setSelectedIdentityId(newIdentityId);
        }
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
      annualFeePaymentGuidance: '',
      annualFeeTransferAccount: emptyAnnualFeeTransferAccount,
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
    const portalLookup = authenticatedContext?.memberPortalLoginId
      ? { loginId: authenticatedContext.memberPortalLoginId }
      : authenticatedContext?.memberId
        ? { memberId: authenticatedContext.memberId }
        : null;
    if (userRole !== 'ADMIN' && portalLookup && memberPortalLoaded) {
      tasks.push(loadMemberPortalData(portalLookup, { force: true }));
    }
    if (fullDataLoaded) {
      tasks.push(loadAppData({ includeAdminSettings: userRole === 'ADMIN', force: true, silent: userRole === 'ADMIN' }));
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
      // v150: 統合APIで1回のround-tripでdashboard+settingsを取得
      (async () => {
        try {
          setAdminDashboardLoading(true);
          setAdminDashboardError(null);
          const { dashboard, settings } = await api.getAdminInitData();
          setAdminDashboardData(dashboard);
          applySystemSettings(settings);
        } catch (error) {
          console.error('Admin init failed:', error);
          setAdminDashboardError(error instanceof Error ? error.message : '管理コンソールの読み込みに失敗しました。');
        } finally {
          setAdminDashboardLoading(false);
        }
      })();
      return;
    }

    if (userRole === 'ADMIN' && currentView === 'training-manage') {
      loadTrainingManagementData().catch(() => undefined);
      return;
    }

    if (userRole === 'ADMIN' && !systemSettingsLoaded) {
      loadSystemSettings(false).catch(() => undefined);
    }

    if (currentView === 'annual-fee-manage' || currentView === 'member-detail' || currentView === 'staff-detail' || currentView === 'officer-management') {
      return;
    }

    if (userRole === 'ADMIN' && (currentView === 'admin-settings' || currentView === 'bulk-mail' || currentView === 'roster-export' || currentView === 'mailing-list-export')) {
      loadSystemSettings(false).catch(() => undefined);
      return;
    }

    // v376.41: 公式LINE投稿依頼コンソールは「研修の投稿」ピッカーに T_研修 が必要なため、
    // systemSettings に加えて loadAppData（trainings）も読み込む（早期 return しない）。
    if (userRole === 'ADMIN' && currentView === 'line-post') {
      loadSystemSettings(false).catch(() => undefined);
      if (!fullDataLoaded) {
        loadAppData({ includeAdminSettings: false, force: true, silent: true }).catch(() => undefined);
      }
      return;
    }

    if (userRole === 'ADMIN' && currentView === 'system-permissions') {
      loadAdminPermissionData().catch(() => undefined);
      return;
    }

    if (!isAdminShell && (currentView === 'profile' || currentView === 'training-apply')) {
      const portalLookup = authenticatedContext?.memberPortalLoginId
        ? { loginId: authenticatedContext.memberPortalLoginId }
        : authenticatedContext?.memberId
          ? { memberId: authenticatedContext.memberId }
          : null;
      if (portalLookup && !memberPortalLoaded) {
        loadMemberPortalData(portalLookup, { force: true }).catch(() => undefined);
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
  const deferredMemberListQuery = useDeferredValue(memberListQuery);
  const deferredBusinessMemberQuery = useDeferredValue(businessMemberQuery);
  const currentFiscalYear = adminDashboardData?.currentFiscalYear ?? getFiscalYearForDate(new Date());
  const adminMemberRowById = useMemo(() => {
    const map = new Map<string, AdminDashboardMemberRow>();
    adminMemberRows.forEach(row => map.set(row.memberId, row));
    return map;
  }, [adminMemberRows]);
  const selectedFiscalYear = useMemo(() => {
    if (memberListFiscalYearFilter === 'ALL') return null;
    const fiscalYear = Number(memberListFiscalYearFilter);
    return Number.isFinite(fiscalYear) ? fiscalYear : null;
  }, [memberListFiscalYearFilter]);
  const getDisplayMemberStatus = useCallback((member: AdminDashboardMemberRow) => (
    getMemberStatusAtFiscalYear(member, selectedFiscalYear, currentFiscalYear)
  ), [currentFiscalYear, selectedFiscalYear]);

  const computeTenure = useCallback((joinedDate: string): number => {
    const joined = parseDateString(joinedDate);
    if (!joined) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - joined.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, []);

  const filteredAdminMemberRows = useMemo(() => {
    return adminMemberRows.filter((member) => {
      if (memberListFilter !== 'ALL' && member.memberType !== memberListFilter) return false;
      const displayStatus = getMemberStatusAtFiscalYear(member, selectedFiscalYear, currentFiscalYear);
      if (selectedFiscalYear !== null && !displayStatus) return false;
      if (memberListStatusFilter !== 'ALL' && displayStatus !== memberListStatusFilter) return false;
      return matchesSearchQuery(deferredMemberListQuery, [
        member.memberId,
        member.displayName,
        member.kana || '', // v362: フリガナ検索（ひらがな/全角カナ/半角カナ いずれもヒット）
        member.officeName,
      ]);
    });
  }, [adminMemberRows, currentFiscalYear, deferredMemberListQuery, memberListFilter, memberListStatusFilter, selectedFiscalYear]);

  const businessMemberDirectoryRows = useMemo((): BusinessStaffDirectoryRow[] => {
    const dashboardStaffRows = adminDashboardData?.staffRows || [];
    const sourceRows = dashboardStaffRows.length > 0
      ? dashboardStaffRows.map(mapAdminDashboardStaffRow)
      : members
        .filter(member => member.type === MemberType.BUSINESS)
        .flatMap(member => (member.staff || []).map(staff => ({
          member: {
            id: member.id,
            officeName: member.officeName,
            officeNumber: member.officeNumber,
          },
          staff,
        })));

    return sourceRows
      .map(({ member, staff }) => {
        const dashboardRow = adminMemberRowById.get(member.id);
        const key = `${member.id}:${staff.id}`;
        const original = normalizeBusinessStaffDraft(staff);
        const draft = businessStaffDrafts[key] || original;
        const fiscalStatus = getStaffStatusAtFiscalYear(staff, selectedFiscalYear, currentFiscalYear);
        return {
          member,
          staff,
          dashboardRow,
          draft,
          original,
          fiscalStatus,
          searchableValues: [
            member.id,
            member.officeNumber,
            member.officeName,
            staff.id,
            staff.name,
            staff.lastName,
            staff.firstName,
            staff.kana,
            staff.lastKana,
            staff.firstKana,
            staff.email,
            staff.careManagerNumber,
            businessStaffRoleLabel(draft.role),
            businessStaffStatusLabel(draft.status),
            businessStaffMailingPreferenceLabel(draft.mailingPreference),
          ],
        };
      })
      .sort((a, b) => (
        (a.member.officeName || '').localeCompare(b.member.officeName || '', 'ja')
        || a.draft.name.localeCompare(b.draft.name, 'ja')
        || a.staff.id.localeCompare(b.staff.id)
      ));
  }, [adminDashboardData?.staffRows, adminMemberRowById, businessStaffDrafts, currentFiscalYear, members, selectedFiscalYear]);

  const filteredBusinessMemberRows = useMemo(() => {
    return businessMemberDirectoryRows.filter((row) => {
      if (selectedFiscalYear !== null && !row.fiscalStatus) return false;
      if (businessStaffRoleFilter !== 'ALL' && row.draft.role !== businessStaffRoleFilter) return false;
      const effectiveStatus = row.fiscalStatus || row.draft.status;
      if (businessStaffStatusFilter !== 'ALL' && effectiveStatus !== businessStaffStatusFilter) return false;
      return matchesSearchQuery(deferredBusinessMemberQuery, row.searchableValues);
    });
  }, [businessMemberDirectoryRows, businessStaffRoleFilter, businessStaffStatusFilter, deferredBusinessMemberQuery, selectedFiscalYear]);

  const dirtyBusinessStaffRows = useMemo(() => (
    businessMemberDirectoryRows.filter(row => !businessStaffDraftEquals(row.draft, row.original))
  ), [businessMemberDirectoryRows]);

  const businessMemberTotalPages = Math.max(1, Math.ceil(filteredBusinessMemberRows.length / memberListPageSize));
  const pagedBusinessMemberRows = useMemo(() => {
    const start = (businessMemberPage - 1) * memberListPageSize;
    return filteredBusinessMemberRows.slice(start, start + memberListPageSize);
  }, [businessMemberPage, filteredBusinessMemberRows, memberListPageSize]);

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
        case 'status': return dir * (getDisplayMemberStatus(a) || a.status).localeCompare(getDisplayMemberStatus(b) || b.status);
        default: return 0;
      }
    });
    return rows;
  }, [computeTenure, filteredAdminMemberRows, getDisplayMemberStatus, memberSortDir, memberSortKey]);

  const memberListTotalPages = Math.max(1, Math.ceil(sortedAdminMemberRows.length / memberListPageSize));
  const pagedAdminMemberRows = useMemo(() => {
    const start = (memberListPage - 1) * memberListPageSize;
    return sortedAdminMemberRows.slice(start, start + memberListPageSize);
  }, [sortedAdminMemberRows, memberListPage, memberListPageSize]);

  const filteredDashboardBusinessStaffCount = useMemo(() => {
    return filteredAdminMemberRows
      .filter((member) => member.memberType === MemberType.BUSINESS)
      .reduce((sum, member) => sum + (member.enrolledStaffCount ?? 0), 0);
  }, [filteredAdminMemberRows]);

  const filteredDashboardMetrics = useMemo(() => {
    const joinedCount = filteredAdminMemberRows.filter((member) => {
      const joined = parseDateString(member.joinedDate);
      if (!joined) return false;
      if (selectedFiscalYear === null) return true;
      const { start, end } = getFiscalYearBounds(selectedFiscalYear);
      return joined >= start && joined <= end;
    }).length;

    const withdrawnCount = filteredAdminMemberRows.filter((member) => {
      const withdrawn = parseDateString(member.withdrawnDate);
      if (!withdrawn) return false;
      if (selectedFiscalYear === null) return true;
      const { start, end } = getFiscalYearBounds(selectedFiscalYear);
      return withdrawn >= start && withdrawn <= end;
    }).length;

    return {
      memberCount: filteredAdminMemberRows.length,
      individualCount: filteredAdminMemberRows.filter((member) =>
        member.memberType === MemberType.INDIVIDUAL || member.memberType === MemberType.SUPPORT,
      ).length,
      businessCount: filteredAdminMemberRows.filter((member) => member.memberType === MemberType.BUSINESS).length,
      businessStaffCount: filteredDashboardBusinessStaffCount,
      currentYearJoinedCount: joinedCount,
      currentYearWithdrawnCount: withdrawnCount,
      fiscalYearLabel: selectedFiscalYear === null ? '全期間' : `${selectedFiscalYear}年度`,
      hasFilteredView:
        memberListFilter !== 'ALL' ||
        memberListStatusFilter !== DEFAULT_MEMBER_STATUS_FILTER ||
        memberListFiscalYearFilter !== DEFAULT_MEMBER_FISCAL_YEAR_FILTER ||
        memberListQuery.trim().length > 0,
    };
  }, [
    filteredAdminMemberRows,
    filteredDashboardBusinessStaffCount,
    memberListFilter,
    memberListFiscalYearFilter,
    memberListQuery,
    memberListStatusFilter,
    selectedFiscalYear,
  ]);

  const availableFiscalYears = useMemo(() => {
    // 会計年度（4月〜翌3月）の範囲を算出
    const toFiscalYear = (d: Date) => d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
    let minFY = Infinity;
    adminMemberRows.forEach(m => {
      if (m.joinedDate) {
        const d = parseDateString(m.joinedDate);
        if (d) {
          const fy = toFiscalYear(d);
          if (fy < minFY) minFY = fy;
        }
      }
    });
    if (!isFinite(minFY)) return [currentFiscalYear];
    const years: number[] = [];
    for (let y = currentFiscalYear; y >= minFY; y--) years.push(y);
    return years;
  }, [adminMemberRows, currentFiscalYear]);

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

  // v363.2: 会員詳細をモーダル overlay で表示する。currentView は変更せず元画面を維持。
  // 新タブ方式（v363）は GAS DOMAIN 認証で毎回ログイン画面に戻る問題のため廃止。
  const openMemberDetail = async (memberId: string) => {
    try {
      const loadedMember = members.find(m => m.id === memberId);
      if (fullDataLoaded && loadedMember) {
        setSelectedMemberForDetailId(memberId);
        setSelectedMemberForDetailSnapshot(loadedMember);
        setMemberDetailModalOpen(true);
        return;
      }
      // v376.9 perf: 会員詳細を開くだけなので getSystemSettings は不要（initial load 時に取得済み）
      const { members: freshMembers } = await loadAppData({ force: true });
      const found = freshMembers.find(m => m.id === memberId);
      if (!found) {
        alert('会員データの取得に失敗しました。');
        return;
      }
      setSelectedMemberForDetailId(found.id);
      setSelectedMemberForDetailSnapshot(found);
      setMemberDetailModalOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : '会員データの読み込みに失敗しました。');
    }
  };

  // v363.2: モーダル閉じる処理
  const closeMemberDetailModal = () => {
    setMemberDetailModalOpen(false);
    setSelectedMemberForDetailId(null);
    setSelectedMemberForDetailSnapshot(null);
    setSelectedStaffForDetail(null);
  };

  // ESC キーでモーダルを閉じる
  useEffect(() => {
    if (!memberDetailModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMemberDetailModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberDetailModalOpen]);

  useEffect(() => {
    setMemberListPage(1);
  }, [memberListFilter, memberListStatusFilter, memberListFiscalYearFilter, memberListQuery, memberListPageSize]);

  useEffect(() => {
    setBusinessMemberPage(1);
  }, [businessMemberQuery, businessStaffRoleFilter, businessStaffStatusFilter, memberListFiscalYearFilter, memberListPageSize]);

  useEffect(() => {
    if (memberListPage > memberListTotalPages) {
      setMemberListPage(memberListTotalPages);
    }
  }, [memberListPage, memberListTotalPages]);

  useEffect(() => {
    if (businessMemberPage > businessMemberTotalPages) {
      setBusinessMemberPage(businessMemberTotalPages);
    }
  }, [businessMemberPage, businessMemberTotalPages]);

  const updateBusinessStaffDraft = (memberId: string, staff: Staff, patch: Partial<BusinessStaffDraft>) => {
    const key = `${memberId}:${staff.id}`;
    setBusinessStaffSaveMessage(null);
    setBusinessStaffSaveError(null);
    setBusinessStaffDrafts((prev) => {
      const original = normalizeBusinessStaffDraft(staff);
      const nextDraft = { ...(prev[key] || original), ...patch };
      const next = { ...prev };
      if (businessStaffDraftEquals(nextDraft, original)) {
        delete next[key];
      } else {
        next[key] = nextDraft;
      }
      return next;
    });
  };

  const openBusinessStaffDetail = (memberId: string, staffId: string) => {
    setStaffSaveToast(null);
    setSelectedMemberForDetailId(memberId);
    setSelectedMemberForDetailSnapshot(members.find(m => m.id === memberId) || null);
    setSelectedStaffForDetail({ memberId, staffId });
    setCurrentView('staff-detail');
  };

  const saveBusinessStaffDrafts = async () => {
    if (dirtyBusinessStaffRows.length === 0 || businessStaffSaving) return;
    const invalidRow = dirtyBusinessStaffRows.find(row => (
      !row.draft.name.trim()
      || !row.draft.kana.trim()
      || (!!row.draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.draft.email.trim()))
    ));
    if (invalidRow) {
      setBusinessStaffSaveMessage(null);
      setBusinessStaffSaveError('未入力またはメール形式が不正な行があります。氏名、カナ、メールを確認してください。');
      return;
    }
    setBusinessStaffSaving(true);
    setBusinessStaffSaveMessage(null);
    setBusinessStaffSaveError(null);
    let savedCount = 0;
    try {
      for (const row of dirtyBusinessStaffRows) {
        await api.updateStaff({
          staffId: row.staff.id,
          memberId: row.member.id,
          name: row.draft.name.trim(),
          kana: row.draft.kana.trim(),
          email: row.draft.email.trim(),
          role: row.draft.role,
          status: row.draft.status,
          mailingPreference: row.draft.mailingPreference,
        });
        savedCount += 1;
      }
      setBusinessStaffDrafts({});
      setBusinessStaffSaveMessage(`${savedCount}件の職員情報を保存しました。`);
      loadAdminDashboardData({ force: true }).catch(() => undefined);
      // v376.9 perf: 職員情報保存では SystemSettings は不変。getSystemSettings の往復を省略
      await loadAppData({ force: true, silent: true });
    } catch (e) {
      setBusinessStaffSaveError(e instanceof Error ? e.message : '職員情報の保存に失敗しました。');
      if (savedCount > 0) {
        setBusinessStaffSaveMessage(`${savedCount}件は保存済みです。未保存の行を確認してください。`);
      }
      loadAdminDashboardData({ force: true }).catch(() => undefined);
      // v376.9 perf: 同上（保存失敗パスでも settings は不変）
      loadAppData({ force: true, silent: true }).catch(() => undefined);
    } finally {
      setBusinessStaffSaving(false);
    }
  };

  const memberPageTypeLabel = useMemo(() => {
    if (!currentIdentity) return '未選択';
    let label = sharedMemberTypeLabel(currentIdentity.type);
    if (currentIdentity.type === MemberType.BUSINESS) {
      label = currentIdentity.staffRole === 'REPRESENTATIVE' ? '事業所会員（代表者）' : currentIdentity.staffRole === 'ADMIN' ? '事業所会員（管理者）' : '事業所会員（メンバー）';
    }
    return label;
  }, [currentIdentity]);

  const selectedMemberForDetail = selectedMemberForDetailId
    ? members.find(m => m.id === selectedMemberForDetailId)
      || (selectedMemberForDetailSnapshot?.id === selectedMemberForDetailId ? selectedMemberForDetailSnapshot : undefined)
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
    ctx: Pick<MemberLoginResult | AdminLoginResult, 'authMethod' | 'memberId' | 'staffId' | 'loginId' | 'canAccessAdminPage'> & {
      adminPermissionLevel?: AdminPermissionLevel;
      sessionToken?: string;
      // docs/246 Phase 3: ロール解決後の RBAC 情報（admin session のみ）
      isMaster?: boolean;
      allowedMenus?: string[];
      roleName?: string;
      trainingEditScope?: 'ALL' | 'OWN';
    },
    availableMembers: Member[] = members,
  ) => {
    const identities = buildLoginIdentities(availableMembers);
    setAuthenticatedContext({
      memberId: ctx.memberId,
      staffId: ctx.staffId,
      memberPortalLoginId: ctx.authMethod === 'PASSWORD' ? ctx.loginId : undefined,
    });
    if (ctx.authMethod === 'PASSWORD' && ctx.sessionToken) {
      api.setMemberSessionToken(ctx.sessionToken);
    }
    setSelectedIdentityId(resolveIdentityId(ctx, identities));
    const permLevel = ctx.adminPermissionLevel || null;
    setAdminPermissionLevel(permLevel);
    // docs/246 Phase 3: RBAC 情報を session state へ
    if (ctx.allowedMenus && typeof ctx.isMaster === 'boolean') {
      setAdminSessionRbac({
        isMaster: ctx.isMaster,
        allowedMenus: ctx.allowedMenus,
        roleName: ctx.roleName,
        trainingEditScope: ctx.trainingEditScope,
      });
    } else {
      setAdminSessionRbac(null);
    }
    // docs/246 Phase 3-B: 初期 view を allowedMenus に基づいて選択（許可されないと profile fallback）
    if (permLevel === 'GENERAL' || !ctx.canAccessAdminPage) {
      setUserRole('MEMBER');
      setCurrentView('profile');
    } else {
      setUserRole('ADMIN');
      const initial = pickInitialAdminView(ctx.isMaster, ctx.allowedMenus, permLevel);
      setCurrentView(initial);
    }
    setIsAuthenticated(true);
    setAuthError(null);
  };

  // docs/246 Phase 3-B: ログイン直後の初期 view 選択。
  // 優先度: members-list（admin） → training-manage → admin-settings → 最初の許可メニュー → 'profile'。
  // session に allowedMenus が無い場合は legacy 二択 fallback。
  function pickInitialAdminView(
    isMaster: boolean | undefined,
    allowedMenus: string[] | undefined,
    legacyLevel: AdminPermissionLevel | null,
  ): string {
    if (allowedMenus && typeof isMaster === 'boolean') {
      const rbacView = { isMaster, allowedMenus };
      const ok = (menuId: string) => canAccessMenu(rbacView, menuId);
      const preferred: Array<[string, string]> = [
        ['members-list', 'admin'],
        ['training-manage', 'training-manage'],
        ['annual-fee', 'annual-fee-manage'],
        ['admin-settings', 'admin-settings'],
      ];
      for (const [menu, view] of preferred) {
        if (ok(menu)) return view;
      }
      // 上記いずれも無い場合、allowedMenus 最初のものから view 解決
      const menuToView: Record<string, string> = {
        'members-list': 'admin', 'change-requests': 'change-requests',
        'annual-fee': 'annual-fee-manage', 'payment-history': 'payment-history',
        'claim-management': 'claim-management', 'roster-export': 'roster-export',
        'mailing-list-export': 'mailing-list-export',
        'training-manage': 'training-manage', 'bulk-mail': 'bulk-mail', 'line-post': 'line-post',
        'officer-management': 'officer-management',
        'admin-settings': 'admin-settings', 'system-permissions': 'system-permissions',
        'data-management': 'member-delete',
        'data-export': 'data-export',
      };
      for (const m of allowedMenus) {
        if (menuToView[m]) return menuToView[m];
      }
      return 'profile';
    }
    // legacy fallback
    if (legacyLevel === 'TRAINING_MANAGER' || legacyLevel === 'TRAINING_REGISTRAR') return 'training-manage';
    return 'admin';
  }

  // 管理者 shell: ページロード時にGoogle セッションを自動確認し認証を試みる。
  // 成功 → 管理ダッシュボードへ即遷移。失敗 → 404 表示（管理機能の存在を隠蔽）。
  useEffect(() => {
    if (!isAdminShell) return;
    let cancelled = false;
    const attemptAutoAuth = async () => {
      try {
        const auth = await api.checkAdminBySession();
        if (cancelled) return;
        setFullDataLoaded(false);
        setMemberPortalLoaded(false);
        setAdminDashboardData(null);
        setTrainingManagementLoaded(false);
        setTrainingManagementError(null);
        setAdminPermissionData(null);
        setAdminPermissionError(null);
        setSystemSettingsLoaded(false);
        // applyAuthContext はこの effect 内で直接呼べないため、個々の setter を呼ぶ
        const identities = buildLoginIdentities([]);
        setAuthenticatedContext({ memberId: auth.memberId, staffId: auth.staffId, memberPortalLoginId: undefined });
        setSelectedIdentityId(resolveIdentityId(auth, identities));
        const permLevel = auth.adminPermissionLevel || null;
        setAdminPermissionLevel(permLevel);
        // docs/246 Phase 3: RBAC 情報も保存
        if (auth.allowedMenus && typeof auth.isMaster === 'boolean') {
          setAdminSessionRbac({
            isMaster: auth.isMaster,
            allowedMenus: auth.allowedMenus,
            roleName: auth.roleName,
            trainingEditScope: auth.trainingEditScope,
          });
        } else {
          setAdminSessionRbac(null);
        }
        if (permLevel === 'GENERAL' || !auth.canAccessAdminPage) {
          setUserRole('MEMBER');
          setCurrentView('profile');
        } else {
          setUserRole('ADMIN');
          setCurrentView(pickInitialAdminView(auth.isMaster, auth.allowedMenus, permLevel));
        }
        setIsAuthenticated(true);
        setAuthError(null);
      } catch {
        if (!cancelled) setAdminAutoAuthFailed(true);
      } finally {
        if (!cancelled) setAdminAutoAuthDone(true);
      }
    };
    attemptAutoAuth();
    return () => { cancelled = true; };
  }, [isAdminShell]); // eslint-disable-line react-hooks/exhaustive-deps

  // v319: 管理者ログイン後に変更申請 PENDING カウントを取得
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'ADMIN') return;
    callApi<{ status: string }[]>('getAdminChangeRequests', { status: 'PENDING' })
      .then((reqs) => setPendingChangeRequestCount(reqs.filter((r) => r.status === 'PENDING').length))
      .catch(() => { /* サイレント失敗 */ });
  }, [isAuthenticated, userRole]);

  // v192: 管理者ログインをセッション認証のみに分離（getMemberPortalData_ を呼ばない）
  // adminLoginWithData は checkAdminBySession + getMemberPortalData を1呼び出しで実行していたため
  // 管理者ログインに 15〜18 秒かかっていた。checkAdminBySession のみに変更し即時遷移。
  const handleAdminSessionLogin = async () => {
    try {
      setAuthBusy(true);
      setAuthError(null);
      const auth = await api.checkAdminBySession();
      setFullDataLoaded(false);
      setMemberPortalLoaded(false);
      setAdminDashboardData(null);
      setTrainingManagementLoaded(false);
      setTrainingManagementError(null);
      setAdminPermissionData(null);
      setAdminPermissionError(null);
      setSystemSettingsLoaded(false);
      applyAuthContext(auth, []);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google認証に失敗しました。');
    } finally {
      setAuthBusy(false);
    }
  };

  // v359: 会員ログインは認証だけ先に完了し、ポータルデータは遅延ロードして体感待ち時間を短縮する。
  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthBusy(true);
      setAuthError(null);
      const loginId = memberLoginId.trim();
      const auth = await api.memberLogin(loginId, memberPassword);
      if (typeof window !== 'undefined') {
        try {
          if (rememberLoginId) {
            window.localStorage.setItem('hcmn.member.loginId', loginId);
          } else {
            window.localStorage.removeItem('hcmn.member.loginId');
          }
        } catch {
          // 保存に失敗してもログイン自体は継続する。
        }
      }
      setMembers([]);
      setTrainings([]);
      setMemberPortalLoaded(false);
      applyAuthContext(auth, []);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'ログインに失敗しました。');
    } finally {
      setAuthBusy(false);
    }
  };

  const openPasswordReset = () => {
    setResetModalOpen(true);
    setResetStep('request');
    setResetLoginId(memberLoginId.trim());
    setResetEmail('');
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetMessage(null);
    setResetError(null);
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResetBusy(true);
      setResetError(null);
      setResetMessage(null);
      const result = await api.requestPasswordReset(resetLoginId.trim(), resetEmail.trim());
      setResetStep('complete');
      setResetMessage(result.message || `手続き用メールを送信しました。${result.expiresInMinutes}分以内に確認コードを入力してください。`);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'パスワード再設定メールの送信に失敗しました。');
    } finally {
      setResetBusy(false);
    }
  };

  const handlePasswordResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('新しいパスワードと確認用パスワードが一致しません。');
      return;
    }
    try {
      setResetBusy(true);
      setResetError(null);
      setResetMessage(null);
      const result = await api.completePasswordReset(resetLoginId.trim(), resetCode.trim(), resetNewPassword);
      setMemberLoginId(resetLoginId.trim());
      setMemberPassword('');
      setResetMessage(result.message || 'パスワードを再設定しました。新しいパスワードでログインしてください。');
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'パスワード再設定に失敗しました。');
    } finally {
      setResetBusy(false);
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

  // v376.7: 研修 soft delete / restore（admin のみ）
  const handleTrainingDelete = async (trainingId: string): Promise<void> => {
    await api.softDeleteTraining(trainingId);
    setTrainings((prev) => prev.map((t) => (t.id === trainingId ? { ...t, isDeleted: true } : t)));
    if (userRole === 'ADMIN') {
      loadAdminDashboardData({ force: true }).catch(() => undefined);
    }
  };
  const handleTrainingRestore = async (trainingId: string): Promise<void> => {
    await api.restoreTraining(trainingId);
    setTrainings((prev) => prev.map((t) => (t.id === trainingId ? { ...t, isDeleted: false } : t)));
    if (userRole === 'ADMIN') {
      loadAdminDashboardData({ force: true }).catch(() => undefined);
    }
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
        const memberPortalLoginId = authenticatedContext?.memberPortalLoginId || memberLoginId;
        if (!memberPortalLoginId) {
          throw new Error('会員マイページのログインIDを解決できません。');
        }
        await api.updateMemberSelf(updatedMember, memberPortalLoginId);
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
    setAuthTab(defaultAuthTab);
    setAuthError(null);
    setMemberPassword('');
    setSelectedIdentityId('');
    api.setMemberSessionToken(null);
    setAuthenticatedContext(null);
    setSelectedMemberForDetailId(null);
    setSelectedMemberForDetailSnapshot(null);
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
    setAdminSessionRbac(null); // docs/246 Phase 3
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

  // docs/246 Phase 3-B: view id → menu id 逆引き（permission-aware routing で使用）
  const viewToMenuId: Record<string, string> = {
    'admin': 'members-list', 'member-detail': 'members-list', 'staff-detail': 'members-list',
    'change-requests': 'change-requests',
    'annual-fee-manage': 'annual-fee', 'payment-history': 'payment-history',
    'claim-management': 'claim-management',
    'roster-export': 'roster-export', 'mailing-list-export': 'mailing-list-export',
    'training-manage': 'training-manage', 'bulk-mail': 'bulk-mail', 'line-post': 'line-post',
    'officer-management': 'officer-management',
    'admin-settings': 'admin-settings', 'system-permissions': 'system-permissions',
    'member-delete': 'data-management',
    'data-export': 'data-export',
    // member-side views（admin role でも触れる）は menuId 無しで素通り
    'profile': '', 'training-apply': '',
  };

  const isViewAllowed = (view: string): boolean => {
    if (!effectiveRbac) return true; // session 未取得時は素通り（legacy 互換）
    const menuId = viewToMenuId[view];
    if (!menuId) return true; // mapping 無しは常に許可（member ページや未定義 view）
    return canAccessMenu(effectiveRbac, menuId);
  };

  // docs/246 View-as-role: ロール一覧の遅延ロード（プレビューバーの初回操作時）。
  const loadPreviewRoles = () => {
    if (previewRoles !== null || previewRolesLoading) return;
    setPreviewRolesLoading(true);
    api.listRoles()
      .then((res) => {
        setPreviewRoles(res.roles || []);
        setPreviewMenuRegistry(res.menuRegistry || null);
      })
      .catch((e) => {
        console.warn('[RolePreview] listRoles failed', e);
        setPreviewRoles([]); // 再フェッチループ回避（必要なら再読込）
      })
      .finally(() => setPreviewRolesLoading(false));
  };

  // ロール選択（null=MASTER 復帰＝プレビュー終了）。書込ガードの ON/OFF と、
  // 許可外 view にいた場合の許可内 view への退避を行う。
  const handleSelectPreviewRole = (roleId: string | null) => {
    setPreviewRoleId(roleId);
    setApiPreviewReadOnly(!!roleId);
    if (roleId && previewRoles) {
      const role = previewRoles.find((r) => r.roleId === roleId && !r.isMaster);
      if (role) {
        const menuId = viewToMenuId[currentView];
        if (menuId && role.allowedMenus.indexOf(menuId) === -1) {
          setCurrentView(pickInitialAdminView(false, role.allowedMenus, adminPermissionLevel) as View);
        }
      }
    }
  };

  // ログアウト・非 MASTER 化でプレビューと書込ガードを必ず解除（module フラグの取り残し防止）。
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'ADMIN' || !adminSessionRbac?.isMaster) {
      if (previewRoleId !== null) setPreviewRoleId(null);
      setApiPreviewReadOnly(false);
    }
  }, [isAuthenticated, userRole, adminSessionRbac?.isMaster, previewRoleId]);

  const handleViewChange = (view: string) => {
    const nextView = view as View;
    if (currentView === 'annual-fee-manage' && annualFeeHasUnsavedChanges && nextView !== currentView) {
      setPendingAnnualFeeAction({ type: 'view', view: nextView });
      return;
    }
    // docs/246 Phase 3-B: 許可外 view への遷移を弾く（Sidebar からは届かないが念のため）
    if (userRole === 'ADMIN' && !isViewAllowed(view)) {
      console.warn('[Phase 3-B] denied view change to', view, '(not in allowedMenus)');
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

  // v376.67: 会員種別ラベルの単一情報源（src/shared/memberTypes.mjs）
  const memberTypeLabel = (type: string) => sharedMemberTypeLabel(type);

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
    patch: Partial<{ googleEmail: string; linkedAuthId: string; permissionLevel: AdminPermissionLevel; roleId: string; enabled: boolean }>,
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
    roleId?: string; // docs/246 Phase 2-C
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
    return opts.filter((o) => matchesSearchQuery(query, [o.label, o.loginId, o.memberId, o.staffId || '']));
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

      {/* docs/246 Phase 2-B: ロール管理（権限マトリクス） */}
      <RoleManagementPanel
        initialRoles={adminPermissionData?.roles}
        initialMenuRegistry={adminPermissionData?.menuRegistry}
        currentPermissionLevel={adminPermissionLevel}
        onChanged={() => loadAdminPermissionData({ force: true }).catch(() => undefined)}
      />

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
            <label className="block text-sm font-medium text-slate-700 mb-1">ロール</label>
            {adminPermissionData?.roles && adminPermissionData.roles.length > 0 ? (
              <select
                value={newAdminPermission.roleId || ''}
                onChange={(e) => {
                  const roleId = e.target.value;
                  // ロール選択時、対応する legacy permissionLevel を逆引きして同期（後方互換）
                  const role = adminPermissionData?.roles?.find((r) => r.roleId === roleId);
                  const legacyMap: Record<string, AdminPermissionLevel> = {
                    'role-master-builtin': 'MASTER',
                    'role-admin-initial': 'ADMIN',
                    'role-training-manager-initial': 'TRAINING_MANAGER',
                    'role-training-registrar-initial': 'TRAINING_REGISTRAR',
                    'role-general-initial': 'GENERAL',
                  };
                  const fallbackLevel: AdminPermissionLevel = legacyMap[roleId] || (role?.isMaster ? 'MASTER' : 'ADMIN');
                  setNewAdminPermission((prev) => ({ ...prev, roleId, permissionLevel: fallbackLevel }));
                }}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                <option value="">— ロールを選択 —</option>
                {adminPermissionData.roles
                  .filter((r) => r.roleId !== 'role-general-initial') // GENERAL は admin login 不可
                  .map((r) => (
                    <option key={r.roleId} value={r.roleId}>
                      {r.roleName}{r.isBuiltIn ? ' [組込]' : ''}{r.description ? ` — ${r.description}` : ''}
                    </option>
                  ))}
              </select>
            ) : (
              // Phase 1-A 互換 fallback: roles データが取得できない場合は legacy permissionLevel ドロップダウン
              <select
                value={newAdminPermission.permissionLevel}
                onChange={(e) => setNewAdminPermission((prev) => ({ ...prev, permissionLevel: e.target.value as AdminPermissionLevel }))}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                {permissionLevelOptions.map((level) => (
                  <option key={level} value={level}>{permissionLevelLabel(level)}</option>
                ))}
              </select>
            )}
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
            disabled={!newAdminPermission.googleEmail.trim() || !newAdminPermission.linkedAuthId
              || (adminPermissionData?.roles && adminPermissionData.roles.length > 0 && !newAdminPermission.roleId)}
            onClick={async () => {
              try {
                await saveAdminPermission({
                  googleEmail: newAdminPermission.googleEmail.trim(),
                  linkedAuthId: newAdminPermission.linkedAuthId,
                  permissionLevel: newAdminPermission.permissionLevel,
                  roleId: newAdminPermission.roleId || undefined, // Phase 2-C: 選択されていれば送信
                  enabled: newAdminPermission.enabled,
                });
                setNewAdminPermission({
                  googleEmail: '',
                  linkedAuthId: '',
                  permissionLevel: 'ADMIN' as AdminPermissionLevel,
                  roleId: '',
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
                <tr className="bg-slate-50 text-left text-xs text-slate-600 tracking-wider">
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
                    roleId: entry.roleId || '',
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">ロール</label>
                                {adminPermissionData?.roles && adminPermissionData.roles.length > 0 ? (
                                  <select
                                    value={draft.roleId || ''}
                                    onChange={(e) => {
                                      const roleId = e.target.value;
                                      const legacyMap: Record<string, AdminPermissionLevel> = {
                                        'role-master-builtin': 'MASTER',
                                        'role-admin-initial': 'ADMIN',
                                        'role-training-manager-initial': 'TRAINING_MANAGER',
                                        'role-training-registrar-initial': 'TRAINING_REGISTRAR',
                                        'role-general-initial': 'GENERAL',
                                      };
                                      const role = adminPermissionData?.roles?.find((r) => r.roleId === roleId);
                                      const fallbackLevel: AdminPermissionLevel = legacyMap[roleId] || (role?.isMaster ? 'MASTER' : 'ADMIN');
                                      updateAdminPermissionDraft(entry.id, { roleId, permissionLevel: fallbackLevel });
                                    }}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                  >
                                    <option value="">— ロールを選択 —</option>
                                    {adminPermissionData.roles
                                      .filter((r) => r.roleId !== 'role-general-initial')
                                      .map((r) => (
                                        <option key={r.roleId} value={r.roleId}>
                                          {r.roleName}{r.isBuiltIn ? ' [組込]' : ''}
                                        </option>
                                      ))}
                                  </select>
                                ) : (
                                  <select
                                    value={draft.permissionLevel}
                                    onChange={(e) => updateAdminPermissionDraft(entry.id, { permissionLevel: e.target.value as AdminPermissionLevel })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                  >
                                    {permissionLevelOptions.map((level) => (
                                      <option key={level} value={level}>{permissionLevelLabel(level)}</option>
                                    ))}
                                  </select>
                                )}
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
                                        roleId: draft.roleId || undefined, // Phase 2-C
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
      <div className="mb-4 inline-flex rounded border border-slate-300 bg-white p-1">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm rounded ${adminMemberViewMode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          onClick={() => setAdminMemberViewMode('all')}
        >
          会員一覧
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-sm rounded ${adminMemberViewMode === 'business' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          onClick={() => setAdminMemberViewMode('business')}
        >
          事業所職員
        </button>
      </div>

      {/* フィルタエリア */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        {adminMemberViewMode === 'all' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">会員種別</label>
            <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={memberListFilter} onChange={(e) => setMemberListFilter(e.target.value as MemberListFilter)}>
              <option value="ALL">全種別</option>
              <option value={MemberType.INDIVIDUAL}>個人会員</option>
              <option value={MemberType.BUSINESS}>事業所会員</option>
              <option value={MemberType.SUPPORT}>賛助会員</option>
            </select>
          </div>
        )}
        {adminMemberViewMode === 'business' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">区分</label>
              <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={businessStaffRoleFilter} onChange={(e) => setBusinessStaffRoleFilter(e.target.value as BusinessStaffRoleFilter)}>
                <option value="ALL">全区分</option>
                <option value="REPRESENTATIVE">代表者</option>
                <option value="ADMIN">管理者</option>
                <option value="STAFF">メンバー</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">在籍状況</label>
              <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={businessStaffStatusFilter} onChange={(e) => setBusinessStaffStatusFilter(e.target.value as BusinessStaffStatusFilter)}>
                <option value="ALL">全状態</option>
                <option value="ENROLLED">在籍</option>
                <option value="LEFT">除籍</option>
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">会員状態</label>
            <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={memberListStatusFilter} onChange={(e) => setMemberListStatusFilter(e.target.value as MemberStatusFilter)}>
              <option value="ALL">全状態</option>
              <option value="ACTIVE">在籍中</option>
              <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
              <option value="WITHDRAWN">退会済</option>
              <option value="TRANSFERRED">移行済み</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">対象年度</label>
          <select className="border border-slate-300 rounded px-3 py-2 bg-white text-sm" value={memberListFiscalYearFilter} onChange={(e) => setMemberListFiscalYearFilter(e.target.value)}>
            <option value="ALL">全年度</option>
            {availableFiscalYears.map(y => <option key={y} value={String(y)}>{y}年度</option>)}
          </select>
        </div>
        <div className="min-w-[240px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">キーワード検索</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            value={adminMemberViewMode === 'business' ? businessMemberQuery : memberListQuery}
            onChange={(e) => adminMemberViewMode === 'business' ? setBusinessMemberQuery(e.target.value) : setMemberListQuery(e.target.value)}
            placeholder={adminMemberViewMode === 'business' ? '事業所名・氏名・フリガナ・メール・CM番号' : '会員番号・氏名・フリガナ・事業所名（勤務先含む）'}
          />
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
      {(adminMemberViewMode === 'all' ? (memberListFilter !== 'ALL' || memberListStatusFilter !== 'ALL' || memberListFiscalYearFilter !== 'ALL' || memberListQuery) : (businessStaffRoleFilter !== 'ALL' || businessStaffStatusFilter !== 'ALL' || memberListFiscalYearFilter !== 'ALL' || businessMemberQuery)) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-slate-500">適用中:</span>
          {adminMemberViewMode === 'all' && memberListFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {memberTypeLabel(memberListFilter)}
              <button onClick={() => setMemberListFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {adminMemberViewMode === 'all' && memberListStatusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {memberListStatusFilter === 'ACTIVE'
                ? '在籍中'
                : memberListStatusFilter === 'WITHDRAWAL_SCHEDULED'
                  ? '退会予定'
                  : memberListStatusFilter === 'TRANSFERRED'
                    ? '移行済み'
                    : '退会済'}
              <button onClick={() => setMemberListStatusFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {adminMemberViewMode === 'business' && businessStaffRoleFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {businessStaffRoleLabel(businessStaffRoleFilter)}
              <button onClick={() => setBusinessStaffRoleFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {adminMemberViewMode === 'business' && businessStaffStatusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {businessStaffStatusLabel(businessStaffStatusFilter)}
              <button onClick={() => setBusinessStaffStatusFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {memberListFiscalYearFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              {memberListFiscalYearFilter}年度
              <button onClick={() => setMemberListFiscalYearFilter('ALL')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {adminMemberViewMode === 'all' && memberListQuery && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              &quot;{memberListQuery}&quot;
              <button onClick={() => setMemberListQuery('')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
          {adminMemberViewMode === 'business' && businessMemberQuery && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
              &quot;{businessMemberQuery}&quot;
              <button onClick={() => setBusinessMemberQuery('')} className="hover:text-primary-900">&times;</button>
            </span>
          )}
        </div>
      )}

      {adminMemberViewMode === 'business' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">事業所職員一覧</h3>
              <p className="text-sm text-slate-500 mt-1">
                {filteredBusinessMemberRows.length === 0
                  ? '該当データなし'
                  : `${(businessMemberPage - 1) * memberListPageSize + 1} - ${Math.min(businessMemberPage * memberListPageSize, filteredBusinessMemberRows.length)} 件を表示 / 全 ${filteredBusinessMemberRows.length} 件`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <button type="button" disabled={businessMemberPage <= 1} onClick={() => setBusinessMemberPage(1)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&laquo;</button>
                <button type="button" disabled={businessMemberPage <= 1} onClick={() => setBusinessMemberPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">前へ</button>
                <span className="text-sm text-slate-600">{businessMemberPage} / {businessMemberTotalPages}</span>
                <button type="button" disabled={businessMemberPage >= businessMemberTotalPages} onClick={() => setBusinessMemberPage(p => Math.min(businessMemberTotalPages, p + 1))} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">次へ</button>
                <button type="button" disabled={businessMemberPage >= businessMemberTotalPages} onClick={() => setBusinessMemberPage(businessMemberTotalPages)} className="px-2 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">&raquo;</button>
              </div>
              <button
                type="button"
                onClick={() => void saveBusinessStaffDrafts()}
                disabled={businessStaffSaving || dirtyBusinessStaffRows.length === 0}
                aria-busy={businessStaffSaving}
                className="min-w-[150px] rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {businessStaffSaving ? '保存中...' : dirtyBusinessStaffRows.length > 0 ? `変更を保存（${dirtyBusinessStaffRows.length}件）` : '変更なし'}
              </button>
            </div>
          </div>

          <div aria-live="polite" className="mb-3 min-h-[1.5rem]">
            {businessStaffSaveMessage && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{businessStaffSaveMessage}</p>
            )}
            {businessStaffSaveError && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{businessStaffSaveError}</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">事業所名</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">氏名</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">カナ</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">メール</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">区分</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">在籍状況</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">メール配信</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pagedBusinessMemberRows.map(({ member, staff, draft, original }) => {
                  const rowKey = `${member.id}:${staff.id}`;
                  const isDirty = !businessStaffDraftEquals(draft, original);
                  const inputClass = `w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${isDirty ? 'border-amber-300 bg-amber-50' : 'border-slate-300 bg-white'}`;
                  return (
                    <tr
                      key={rowKey}
                      className={`hover:bg-slate-50 ${isDirty ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          className="text-left font-semibold text-primary-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                          onClick={() => openBusinessStaffDetail(member.id, staff.id)}
                        >
                          {member.officeName || '（事業所名未設定）'}
                        </button>
                        <div className="mt-1 text-xs text-slate-500">
                          <span>事業所番号: {member.officeNumber || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[160px]">
                        <div className="font-medium text-slate-900">{draft.name || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[150px]">
                        <div className="text-slate-700">{draft.kana || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[220px]">
                        <input
                          className={inputClass}
                          type="email"
                          value={draft.email}
                          aria-label={`${member.officeName || '事業所'} ${staff.id} メール`}
                          onChange={(e) => updateBusinessStaffDraft(member.id, staff, { email: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[130px]">
                        <select
                          className={inputClass}
                          value={draft.role}
                          aria-label={`${member.officeName || '事業所'} ${staff.id} 区分`}
                          onChange={(e) => updateBusinessStaffDraft(member.id, staff, { role: e.target.value as StaffRole })}
                        >
                          <option value="REPRESENTATIVE">代表者</option>
                          <option value="ADMIN">管理者</option>
                          <option value="STAFF">メンバー</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[120px]">
                        <select
                          className={inputClass}
                          value={draft.status}
                          aria-label={`${member.officeName || '事業所'} ${staff.id} 在籍状況`}
                          onChange={(e) => updateBusinessStaffDraft(member.id, staff, { status: e.target.value as StaffStatus })}
                        >
                          <option value="ENROLLED">在籍</option>
                          <option value="LEFT">除籍</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[140px]">
                        <select
                          className={inputClass}
                          value={draft.mailingPreference}
                          aria-label={`${member.officeName || '事業所'} ${staff.id} メール配信`}
                          onChange={(e) => updateBusinessStaffDraft(member.id, staff, { mailingPreference: e.target.value })}
                        >
                          <option value="YES">配信する</option>
                          <option value="NO">配信しない</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!adminDashboardLoading && filteredBusinessMemberRows.length === 0 && <p className="mt-4 text-sm text-slate-500">条件に一致する事業所職員がありません。</p>}
        </>
      ) : (
        <>
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
                <td className="px-4 py-3 text-sm">{(() => {
                  const displayStatus = getDisplayMemberStatus(member) || member.status;
                  return displayStatus === 'WITHDRAWN'
                    ? <span className="text-red-500">退会済</span>
                    : displayStatus === 'WITHDRAWAL_SCHEDULED'
                      ? <span className="text-amber-600">退会予定</span>
                      : displayStatus === 'TRANSFERRED'
                        ? <span className="text-slate-500">移行済み</span>
                      : <span className="text-green-600">在籍中</span>;
                })()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adminDashboardLoading && (
        <div className="mt-4 space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded"></div>
          ))}
        </div>
      )}
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
        </>
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
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">研修名</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">開催日</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">状態</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">申込数</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {(adminDashboardData?.trainingRows || []).map((training) => (
              <tr key={training.trainingId}>
                <td className="px-4 py-3 text-sm text-slate-900">{training.title}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{training.date || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{(training.isApplicationOpen ?? training.status === 'OPEN') ? '受付中' : '受付終了'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{training.applicants} / {training.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adminDashboardLoading && (
        <div className="mt-4 space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded"></div>
          ))}
        </div>
      )}
      {!adminDashboardLoading && !adminDashboardData?.trainingRows.length && (
        <p className="mt-4 text-sm text-slate-500">表示できる研修データがありません。</p>
      )}
    </div>
  );

  const renderAdminPage = () => {
    const d = filteredDashboardMetrics;
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
          <p className="text-sm text-slate-500 mt-3">
            ダッシュボードの数値は会員一覧の抽出条件と連動します。基準年度は <span className="font-medium text-slate-700">{d.fiscalYearLabel}</span> です。
            {d.hasFilteredView ? ' 現在は絞り込み結果を表示しています。' : d.fiscalYearLabel === '全期間' ? ' 現在は全期間の全件を表示しています。' : ' 現在は当該年度の全件を表示しています。'}
          </p>
        </div>
        {adminDashboardError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{adminDashboardError}</div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs text-emerald-700 font-medium mb-1">{d.fiscalYearLabel} 対象会員数</p>
            <p className="text-2xl font-bold text-emerald-800">{val(d?.memberCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">{d.fiscalYearLabel} 個人会員</p>
            <p className="text-2xl font-bold text-primary-600">{val(d?.individualCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">{d.fiscalYearLabel} 事業所会員</p>
            <p className="text-2xl font-bold text-indigo-600">{val(d?.businessCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">{d.fiscalYearLabel} 事業所職員</p>
            <p className="text-2xl font-bold text-purple-600">{val(d?.businessStaffCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">{d.fiscalYearLabel} 入会数</p>
            <p className="text-2xl font-bold text-green-600">{val(d?.currentYearJoinedCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-xs text-slate-500 mb-1">{d.fiscalYearLabel} 退会数</p>
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
    // ── 管理者 shell 専用: 自動認証フロー ────────────────────────────────────
    if (isAdminShell && !isAuthenticated) {
      // 自動認証中: フルスクリーンスケルトン（ログインフォームは表示しない）
      if (!adminAutoAuthDone) {
        return (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 gap-6" aria-live="polite" aria-label="認証確認中">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-10 h-10 text-slate-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-sm text-slate-400 tracking-wide">認証を確認しています…</p>
            </div>
          </div>
        );
      }
      // 自動認証失敗: 404 ページ（管理機能の存在を隠蔽）
      if (adminAutoAuthFailed) {
        return (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-white select-none">
            <div className="text-center space-y-4 px-6 max-w-sm">
              <p className="text-8xl font-black text-slate-100 tracking-tight leading-none">404</p>
              <h1 className="text-xl font-bold text-slate-700">ページが見つかりません</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                お探しのページは存在しないか、移動した可能性があります。
              </p>
              <a
                href="/"
                className="inline-block mt-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                トップへ戻る
              </a>
            </div>
          </div>
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!isAuthenticated) {
      const showMemberAuth = !isAdminShell;
      const showAdminAuth = !isMemberShell;
      return (
        <div className="max-w-lg mx-auto mt-20 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">ログイン</h1>
          <p className="text-sm text-slate-600 mb-5">
            {isAdminShell
              ? '管理者はGoogle認証を使用します。'
              : isMemberShell
              ? '会員はログインIDとパスワードを使用します。'
              : '会員はログインID/パスワード、管理者のみGoogle認証を使用します。'}
          </p>
          <fieldset disabled={authBusy} className={authBusy ? 'opacity-60' : ''}>
            {showMemberAuth && showAdminAuth && (
            <div className="flex gap-2 mb-4">
              <button type="button" className={`px-3 py-2 rounded ${authTab === 'member' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} onClick={() => setAuthTab('member')}>
                会員ログイン
              </button>
              <button type="button" className={`px-3 py-2 rounded ${authTab === 'admin' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} onClick={() => setAuthTab('admin')}>
                管理者ログイン
              </button>
            </div>
            )}

            {showMemberAuth && (isMemberShell || authTab === 'member') && (
              <form className="space-y-3" onSubmit={handleMemberLogin}>
                <div>
                  <label className="sr-only" htmlFor="member-login-id">ログインID</label>
                  <input
                    id="member-login-id"
                    className="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2"
                    placeholder="ログインID"
                    value={memberLoginId}
                    onChange={(e) => setMemberLoginId(e.target.value)}
                    autoComplete="username"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="member-password">パスワード</label>
                  <div className="relative">
                    <input
                      id="member-password"
                      className="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 pr-20"
                      type={showMemberPassword ? 'text' : 'password'}
                      placeholder="パスワード"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-1 min-h-[44px] min-w-[64px] rounded px-3 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      onClick={() => setShowMemberPassword((value) => !value)}
                      aria-label={showMemberPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    >
                      {showMemberPassword ? '隠す' : '表示'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300"
                      checked={rememberLoginId}
                      onChange={(e) => setRememberLoginId(e.target.checked)}
                    />
                    ログインIDを保存する
                  </label>
                  <button
                    type="button"
                    className="min-h-[44px] rounded px-2 text-left text-sm font-bold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    onClick={openPasswordReset}
                  >
                    パスワードを忘れた方
                  </button>
                </div>
                <button className="w-full min-h-[44px] bg-slate-800 text-white rounded px-3 py-2 inline-flex items-center justify-center gap-2 disabled:opacity-50" type="submit">
                  {authBusy ? (<><span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>ログイン中...</>) : 'ログイン'}
                </button>
                {/* v376.71: 時限ロックの案内。ロック中かどうかは伝えない（docs/261 T-04 #6）。 */}
                <p className="text-xs text-slate-500 leading-relaxed">
                  パスワードを続けて間違えると、しばらくの間ログインできなくなります。
                  時間をおくと自動で解除されます。
                </p>
              </form>
            )}
            {showAdminAuth && (isAdminShell || authTab === 'admin') && (
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full min-h-[44px] bg-slate-800 text-white rounded px-3 py-2 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={handleAdminSessionLogin}
                >
                  {authBusy ? (<><span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>認証中...</>) : 'Googleアカウントで管理者ログイン'}
                </button>
              </div>
            )}
          </fieldset>
          {authBusy && <p className="mt-3 text-sm text-slate-500 text-center" role="status" aria-live="assertive">認証処理を実行しています...</p>}
          {authError && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2" role="alert">{authError}</div>}
          {resetModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
              <div role="dialog" aria-modal="true" aria-labelledby="password-reset-title" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 id="password-reset-title" className="text-lg font-bold text-slate-900">パスワード再設定</h2>
                    <p className="mt-1 text-sm text-slate-600">ログインIDと登録メールアドレスを確認し、手続き用メールを送信します。</p>
                  </div>
                  <button
                    type="button"
                    className="min-h-[44px] min-w-[44px] rounded text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    onClick={() => setResetModalOpen(false)}
                    aria-label="閉じる"
                  >
                    ×
                  </button>
                </div>
                {resetError && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{resetError}</div>}
                {resetMessage && <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{resetMessage}</div>}

                {resetStep === 'request' ? (
                  <form className="space-y-3" onSubmit={handlePasswordResetRequest}>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="reset-login-id">ログインID</label>
                      <input
                        id="reset-login-id"
                        className="w-full min-h-[44px] rounded border border-slate-300 px-3 py-2"
                        value={resetLoginId}
                        onChange={(e) => setResetLoginId(e.target.value)}
                        autoComplete="username"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="reset-email">登録メールアドレス</label>
                      <input
                        id="reset-email"
                        className="w-full min-h-[44px] rounded border border-slate-300 px-3 py-2"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <button type="submit" disabled={resetBusy} className="w-full min-h-[44px] rounded bg-slate-800 px-3 py-2 font-bold text-white disabled:opacity-50">
                      {resetBusy ? '送信中...' : '手続きメールを送信'}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-3" onSubmit={handlePasswordResetComplete}>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="reset-code">確認コード</label>
                      <input
                        id="reset-code"
                        className="w-full min-h-[44px] rounded border border-slate-300 px-3 py-2 tracking-[0.25em]"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="reset-new-password">新しいパスワード</label>
                      <input
                        id="reset-new-password"
                        className="w-full min-h-[44px] rounded border border-slate-300 px-3 py-2"
                        type="password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="reset-confirm-password">新しいパスワード（確認）</label>
                      <input
                        id="reset-confirm-password"
                        className="w-full min-h-[44px] rounded border border-slate-300 px-3 py-2"
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <button type="submit" disabled={resetBusy} className="w-full min-h-[44px] rounded bg-slate-800 px-3 py-2 font-bold text-white disabled:opacity-50">
                      {resetBusy ? '再設定中...' : 'パスワードを再設定'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="space-y-6 animate-pulse" role="status" aria-live="polite" aria-label="データを読み込み中です">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="h-7 bg-slate-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-72 mb-6"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-slate-100 rounded-lg"></div>
              <div className="h-20 bg-slate-100 rounded-lg"></div>
              <div className="h-20 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 mb-3">
                <div className="h-4 bg-slate-100 rounded w-20"></div>
                <div className="h-4 bg-slate-100 rounded w-40"></div>
                <div className="h-4 bg-slate-100 rounded w-24"></div>
              </div>
            ))}
          </div>
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
          individualMembers={adminMemberRows.filter(r => r.memberType !== MemberType.BUSINESS)}
          onBack={() => {
            setSelectedStaffForDetail(null);
            setSelectedMemberForDetailId(null);
            setSelectedMemberForDetailSnapshot(null);
            setCurrentView('admin');
          }}
          onSaved={(updatedMember) => {
            if (updatedMember) {
              setMembers((prev) => prev.map((member) => (member.id === updatedMember.id ? updatedMember : member)));
              setSelectedMemberForDetailSnapshot(updatedMember);
            }
            loadAdminDashboardData({ force: true }).catch(() => undefined);
            loadAppData({ force: true, silent: true }).catch(() => undefined);
          }}
          onOpenStaffDetail={(mId, sId) => {
            setStaffSaveToast(null);
            setSelectedMemberForDetailId(mId);
            setSelectedMemberForDetailSnapshot(members.find((member) => member.id === mId) || null);
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
      const directoryRow = selectedStaffForDetail
        ? businessMemberDirectoryRows.find(row => row.member.id === selectedStaffForDetail.memberId && row.staff.id === selectedStaffForDetail.staffId)
        : undefined;
      const targetStaff = parentMember?.staff?.find(s => s.id === selectedStaffForDetail?.staffId) || directoryRow?.staff;
      return (
        <StaffDetailAdmin
          staff={targetStaff}
          memberId={selectedStaffForDetail?.memberId || ''}
          officeName={parentMember?.officeName || directoryRow?.member.officeName || ''}
          onBack={() => {
            setSelectedStaffForDetail(null);
            setSelectedMemberForDetailId(null);
            setSelectedMemberForDetailSnapshot(null);
            setAdminMemberViewMode('business');
            setCurrentView('admin');
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

    // v373.6 (S5): template-help view 撤去（旧 TemplateHelpPage 削除に伴う）

    if (currentView === 'admin-settings') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      // v317: 設定ページ サブナビ定義
      const settingsSubNav: { id: typeof settingsSub; label: string; desc: string }[] = [
        { id: 'basic',   label: '基本設定',     desc: '上限・研修フォーム既定' },
        { id: 'fees',    label: '会費設定',     desc: '種別ごとの年会費・納入案内' },
        { id: 'regulations', label: '規程・重要事項', desc: '入会申込画面の掲載文' },
        { id: 'output',  label: '帳票出力',     desc: 'テンプレート・Drive' },
        { id: 'email',   label: 'メール通知',   desc: '入会メール・事業所メール' },
        { id: 'portal',  label: '公開ポータル', desc: 'カード設定・文言' },
        { id: 'masters', label: 'マスタ管理',   desc: '役員・事業所個別上限' },
      ];
      return (
        <div className="pb-24">
          {/* ページヘッダー */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">設定</h2>
              <p className="mt-0.5 text-xs text-slate-500">運用で使う共通値・メール・公開ポータル・マスタをここでまとめて管理します。</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settingsIsDirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {settingsIsDirty ? '未保存の変更あり' : '保存済み'}
              </span>
              {!systemSettingsLoaded && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">読み込み中...</span>
              )}
            </div>
          </div>

          {/* 2カラムレイアウト（モバイルでは縦積み） */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            {/* 左サブナビ（モバイル時は横スクロールのタブバー） */}
            <nav className="w-full md:w-44 md:shrink-0 md:sticky md:top-4 flex md:flex-col gap-2 md:gap-0 md:space-y-1 overflow-x-auto md:overflow-x-visible -mx-1 px-1 md:mx-0 md:px-0">
              {settingsSubNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSettingsSub(item.id)}
                  className={`shrink-0 md:w-full md:shrink text-left px-3 py-2.5 rounded-lg transition-colors ${
                    settingsSub === item.id
                      ? 'bg-primary-50 border border-primary-200 text-primary-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <p className={`text-sm font-semibold whitespace-nowrap md:whitespace-normal ${settingsSub === item.id ? 'text-primary-700' : 'text-slate-700'}`}>{item.label}</p>
                  <p className="hidden md:block text-[11px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </nav>

            {/* 右コンテンツ */}
            <div className="flex-1 min-w-0 space-y-5">

          {!systemSettingsLoaded && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              システム設定を読み込み中です...
            </div>
          )}

          {/* ── 基本設定 ── */}
          {settingsSub === 'basic' && <AdminSettingsSection
            id="settings-core"
            title="基本設定"
            description="日常運用で使う共通値です。全体上限、研修履歴の表示期間、研修フォームの既定項目をここで管理します。年会費は「会費設定」にあります。"
            badge="頻出"
            defaultOpen
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">全体デフォルト上限</label>
                <input type="number" min={1} max={200} value={globalLimitInput} onChange={(e) => { setGlobalLimitInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">研修履歴の表示期間（月）</label>
                <input type="number" min={1} max={60} value={historyLookbackInput} onChange={(e) => { setHistoryLookbackInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">研修フォーム　項目表示デフォルト設定</h4>
              <p className="text-sm text-slate-600 mb-3">新規研修登録時に表示する項目のデフォルトを設定します。研修ごとに個別変更可能です。</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRAINING_OPTIONAL_FIELD_DEFS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={trainingDefaultFieldConfigInput[key] !== false}
                      onChange={(e) => { setTrainingDefaultFieldConfigInput((prev) => ({ ...prev, [key]: e.target.checked })); setSettingsIsDirty(true); }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </AdminSettingsSection>}

          {/* ── 規程・重要事項（v376.65・案C Phase 1） ── */}
          {settingsSub === 'regulations' && <AdminSettingsSection
            id="settings-regulations"
            title="規程・重要事項"
            description="公開ポータルの入会申込画面「事務局からのお願い」に出る文面と、定款などの規程リンクをここで管理します。ここが文面の正本です（従来はソースに直接書かれていました）。"
            badge="公開文面"
            defaultOpen
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  区分「重要事項」はカードとして並び、「規程・定款」は下部のリンク枠として表示されます。表示順の小さいものが先に出ます。
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { void loadRegulations(); }}
                    disabled={regulationsLoading}
                    className="min-h-[44px] rounded border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {regulationsLoading ? '読込中...' : '再読込'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegulationDraft({
                      id: '', kind: 'NOTICE', title: '', body: '', linkUrl: '', linkLabel: '',
                      target: 'ALL', version: 1, effectiveDate: '', sortOrder: (regulations.length + 1) * 1, published: true,
                    })}
                    className="min-h-[44px] rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    ＋ 新規追加
                  </button>
                </div>
              </div>

              {regulationsError && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{regulationsError}</p>
              )}

              {regulations.length === 0 && !regulationsLoading && !regulationsError && (
                <p className="rounded border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  規程がまだ登録されていません。「再読込」を押すか、管理画面を開き直すと初期文面が自動登録されます。
                </p>
              )}

              <div className="space-y-3">
                {regulations.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.kind === 'REGULATION' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                            {item.kind === 'REGULATION' ? '規程・定款' : '重要事項'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${item.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {item.published ? '公開中' : '非公開'}
                          </span>
                          <span className="text-xs text-slate-500">第 {item.version} 版</span>
                          <span className="text-xs text-slate-400">表示順 {item.sortOrder}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{item.body}</p>
                        {item.linkUrl && (
                          <p className="mt-1 break-all text-xs text-slate-500">{item.linkLabel || 'リンク'}: {item.linkUrl}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegulationDraft({ ...item })}
                          className="min-h-[44px] rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          disabled={regulationBusy}
                          onClick={async () => {
                            if (!window.confirm(`「${item.title}」を削除します。よろしいですか。`)) return;
                            try {
                              setRegulationBusy(true);
                              await api.deleteRegulation(item.id);
                              await loadRegulations();
                            } catch (e) {
                              setRegulationsError(e instanceof Error ? e.message : '削除に失敗しました。');
                            } finally {
                              setRegulationBusy(false);
                            }
                          }}
                          className="min-h-[44px] rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {regulationDraft && (
                <div className="rounded-lg border-2 border-primary-200 bg-primary-50/40 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-800">
                    {regulationDraft.id ? '規程を編集' : '規程を追加'}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">区分</label>
                      <select
                        value={regulationDraft.kind}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, kind: e.target.value as Regulation['kind'] })}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="NOTICE">重要事項（カード表示）</option>
                        <option value="REGULATION">規程・定款（リンク枠）</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">対象会員種別</label>
                      <select
                        value={regulationDraft.target}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, target: e.target.value as Regulation['target'] })}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="ALL">すべての会員</option>
                        <option value="INDIVIDUAL">個人会員</option>
                        <option value="BUSINESS">事業所会員</option>
                        <option value="SUPPORT">賛助会員</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">タイトル</label>
                      <input
                        type="text"
                        value={regulationDraft.title}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, title: e.target.value })}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder="例: 会費の返還について"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">本文</label>
                      <textarea
                        value={regulationDraft.body}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, body: e.target.value })}
                        rows={5}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder="申込者に伝える内容を入力します。改行はそのまま表示されます。"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">外部リンク（任意・https のみ）</label>
                      <input
                        type="text"
                        value={regulationDraft.linkUrl}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, linkUrl: e.target.value })}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">リンクのボタン文言</label>
                      <input
                        type="text"
                        value={regulationDraft.linkLabel}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, linkLabel: e.target.value })}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder="例: 定款を確認する"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">施行日（任意）</label>
                      <input
                        type="date"
                        value={regulationDraft.effectiveDate}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, effectiveDate: e.target.value })}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">表示順</label>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={regulationDraft.sortOrder}
                        onChange={(e) => setRegulationDraft({ ...regulationDraft, sortOrder: Number(e.target.value || 0) })}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex cursor-pointer select-none items-center gap-2">
                        <input
                          type="checkbox"
                          checked={regulationDraft.published}
                          onChange={(e) => setRegulationDraft({ ...regulationDraft, published: e.target.checked })}
                          className="accent-primary-600"
                        />
                        <span className="text-sm text-slate-700">公開ポータルの入会申込画面に表示する</span>
                      </label>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    タイトル・本文・リンクを変更して保存すると版数が 1 つ上がります（どの版を掲示していたかを追えるようにするため）。
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={regulationBusy}
                      onClick={async () => {
                        try {
                          setRegulationBusy(true);
                          setRegulationsError(null);
                          await api.saveRegulation(regulationDraft);
                          setRegulationDraft(null);
                          await loadRegulations();
                        } catch (e) {
                          setRegulationsError(e instanceof Error ? e.message : '保存に失敗しました。');
                        } finally {
                          setRegulationBusy(false);
                        }
                      }}
                      className="min-h-[44px] rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {regulationBusy ? '保存中...' : 'この規程を保存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegulationDraft(null)}
                      className="min-h-[44px] rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          </AdminSettingsSection>}

          {/* ── 会費設定（v376.64） ── */}
          {settingsSub === 'fees' && <AdminSettingsSection
            id="settings-fees"
            title="会費設定"
            description="会員種別ごとの年会費と、未納会員向けの納入案内・振込先をここで管理します。年会費は入会申込画面の会員種別カードにも表示されます。"
            badge="会費"
            defaultOpen
          >
            <div className="mb-4 rounded-lg border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-1">会員種別ごとの年会費</h4>
              <p className="text-sm text-slate-600 mb-3">
                ここで保存した金額が、公開ポータルの入会申込画面・年会費請求・メール差し込みのすべてで使われます（保存先はマスタ「M_会員種別」の年会費金額）。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MEMBER_TYPE_FEE_FIELDS.map(({ code, label }) => (
                  <div key={code}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={1000000}
                        step={100}
                        value={memberTypeAnnualFeesInput[code]}
                        onChange={(e) => { setMemberTypeAnnualFeesInput((prev) => ({ ...prev, [code]: e.target.value })); setSettingsIsDirty(true); }}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                      <span className="shrink-0 text-sm text-slate-600">円</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <ToggleSwitch
                  color="emerald"
                  enabled={membershipFeePublicVisibleInput}
                  onToggle={() => { setMembershipFeePublicVisibleInput((v) => !v); setSettingsIsDirty(true); }}
                  onLabel="入会申込画面に年会費を表示する"
                  offLabel="入会申込画面に年会費を表示しない"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">入会申込画面に添える補足</label>
                  <input
                    type="text"
                    value={membershipFeeNoteInput}
                    onChange={(e) => { setMembershipFeeNoteInput(e.target.value); setSettingsIsDirty(true); }}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                    placeholder="例: 年会費は入会後、事務局からのご案内にしたがってお納めください。"
                  />
                  <p className="mt-2 text-sm text-slate-600">空欄のときは既定の案内文が表示されます。</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">年会費の納入案内</label>
              <textarea
                value={annualFeePaymentGuidanceInput}
                onChange={(e) => { setAnnualFeePaymentGuidanceInput(e.target.value); setSettingsIsDirty(true); }}
                rows={5}
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder={'例:\n年会費が未納の場合は、下記口座へお振り込みください。\n振込名義は会員番号と氏名を記載してください。'}
              />
              <p className="mt-2 text-sm text-slate-600">
                会員マイページで未納会員にだけ表示する共通案内です。改行はそのまま反映されます。
              </p>
            </div>
            <div className="mb-4 border border-slate-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">年会費の共通振込先</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">銀行名</label>
                  <input
                    type="text"
                    value={annualFeeTransferAccountInput.bankName}
                    onChange={(e) => { setAnnualFeeTransferAccountInput((prev) => ({ ...prev, bankName: e.target.value })); setSettingsIsDirty(true); }}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">支店名</label>
                  <input
                    type="text"
                    value={annualFeeTransferAccountInput.branchName}
                    onChange={(e) => { setAnnualFeeTransferAccountInput((prev) => ({ ...prev, branchName: e.target.value })); setSettingsIsDirty(true); }}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">口座種別</label>
                  <select
                    value={annualFeeTransferAccountInput.accountType}
                    onChange={(e) => { setAnnualFeeTransferAccountInput((prev) => ({ ...prev, accountType: e.target.value as '普通' | '当座' })); setSettingsIsDirty(true); }}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  >
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">口座番号</label>
                  <input
                    type="text"
                    value={annualFeeTransferAccountInput.accountNumber}
                    onChange={(e) => { setAnnualFeeTransferAccountInput((prev) => ({ ...prev, accountNumber: e.target.value })); setSettingsIsDirty(true); }}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">口座名義</label>
                  <input
                    type="text"
                    value={annualFeeTransferAccountInput.accountName}
                    onChange={(e) => { setAnnualFeeTransferAccountInput((prev) => ({ ...prev, accountName: e.target.value })); setSettingsIsDirty(true); }}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">補足</label>
                  <textarea
                    value={annualFeeTransferAccountInput.note || ''}
                    onChange={(e) => { setAnnualFeeTransferAccountInput((prev) => ({ ...prev, note: e.target.value })); setSettingsIsDirty(true); }}
                    rows={3}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                    placeholder="例: 振込手数料は会員負担です。"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                `T_システム設定.ANNUAL_FEE_TRANSFER_ACCOUNT` に保存され、未納会員の納入方法表示に利用されます。
              </p>
            </div>
          </AdminSettingsSection>}

          {/* ── 帳票出力 ── */}
          {settingsSub === 'output' && <AdminSettingsSection
            id="settings-mail-assets"
            title="帳票・一括メール"
            description="名簿出力、一括メール、自動添付に使う外部リソースや閲覧権限を管理します。頻度は低めですが、誤設定の影響が大きい領域です。"
            badge="管理者向け"
          >
            {/* v373.6 (S5): 旧テンプレートライブラリ UI 撤去（外部 Google Sheets テンプレ依存型）。新名簿 Visual Designer に統合済み。 */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">一括メール自動添付DriveフォルダID</label>
                <input
                  type="text"
                  value={bulkMailAutoAttachFolderIdInput}
                  onChange={(e) => { setBulkMailAutoAttachFolderIdInput(e.target.value); setSettingsIsDirty(true); }}
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-sm"
                  placeholder="DriveフォルダID（URLの /folders/〜 の部分）"
                />
                <p className="mt-1 text-xs text-slate-500">ファイル名に姓名（スペースなし）が含まれるファイルを受信者へ自動添付します。</p>
              </div>
              {adminPermissionLevel === 'MASTER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">メール送信ログ閲覧権限</label>
                  <select
                    value={emailLogViewerRoleInput}
                    onChange={(e) => { setEmailLogViewerRoleInput(e.target.value); setSettingsIsDirty(true); }}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="MASTER">マスターのみ</option>
                    <option value="MASTER,ADMIN">マスター・管理者</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">この設定はマスター権限のみ変更できます。</p>
                </div>
              )}
            </div>
          </AdminSettingsSection>}

          {/* ── 公開ポータル ── */}
          {settingsSub === 'portal' && <AdminSettingsSection
            id="settings-portal"
            title="公開ポータル"
            description="匿名利用者に見せる導線と文言をまとめて管理します。トップ表示、入会カード、完了画面の見え方をここで調整します。"
            badge="公開導線"
            defaultOpen
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">公開ポータル メニュー表示設定</h4>
                <p className="text-sm text-slate-600 mb-3">
                  公開ポータルのトップページに表示するメニューカードを選択します。
                  OFF にしたカードは完全に非表示となり、利用者はそのページへ進めません。
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={publicPortalTrainingMenuEnabledInput}
                        onChange={(e) => { setPublicPortalTrainingMenuEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${publicPortalTrainingMenuEnabledInput ? 'bg-sky-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publicPortalTrainingMenuEnabledInput ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      研修申込メニュー（「研修を申し込む」カード）を表示する
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={publicPortalMembershipMenuEnabledInput}
                        onChange={(e) => { setPublicPortalMembershipMenuEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${publicPortalMembershipMenuEnabledInput ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publicPortalMembershipMenuEnabledInput ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      入会申込メニュー（「新規入会を申し込む」カード）を表示する
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={publicPortalMemberUpdateMenuEnabledInput}
                        onChange={(e) => { setPublicPortalMemberUpdateMenuEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${publicPortalMemberUpdateMenuEnabledInput ? 'bg-violet-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publicPortalMemberUpdateMenuEnabledInput ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      登録情報変更メニュー（「会員登録情報を変更する」カード）を表示する
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={publicPortalWithdrawalMenuEnabledInput}
                        onChange={(e) => { setPublicPortalWithdrawalMenuEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${publicPortalWithdrawalMenuEnabledInput ? 'bg-amber-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publicPortalWithdrawalMenuEnabledInput ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      退会申込メニュー（「退会を申し込む」カード）を表示する
                    </span>
                  </label>
                </div>
                {(!publicPortalTrainingMenuEnabledInput || !publicPortalMembershipMenuEnabledInput || !publicPortalMemberUpdateMenuEnabledInput || !publicPortalWithdrawalMenuEnabledInput) && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    {[
                      !publicPortalTrainingMenuEnabledInput && '研修申込',
                      !publicPortalMembershipMenuEnabledInput && '入会申込',
                      !publicPortalMemberUpdateMenuEnabledInput && '登録情報変更',
                      !publicPortalWithdrawalMenuEnabledInput && '退会申込',
                    ].filter(Boolean).join('・') + ' メニューが OFF です。該当カードは公開ポータルに表示されません。'}
                  </p>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                <div>
                  <h5 className="text-sm font-semibold text-slate-800 mb-1">公開ポータル文言設定</h5>
                  <p className="text-sm text-slate-600">
                    トップの案内文と入会申込カードの見出し・説明文・ボタン文言を変更できます。不要な補助文言は非表示にできます。
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicPortalHeroBadgeEnabledInput}
                      onChange={(e) => { setPublicPortalHeroBadgeEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-slate-700">トップ補助ラベルを表示する</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicPortalHeroDescriptionEnabledInput}
                      onChange={(e) => { setPublicPortalHeroDescriptionEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-slate-700">トップ説明文を表示する</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">トップ補助ラベル</label>
                    <input
                      type="text"
                      value={publicPortalHeroBadgeLabelInput}
                      onChange={(e) => { setPublicPortalHeroBadgeLabelInput(e.target.value); setSettingsIsDirty(true); }}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      placeholder="例: お申込みポータル"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">トップ見出し</label>
                    <input
                      type="text"
                      value={publicPortalHeroTitleInput}
                      onChange={(e) => { setPublicPortalHeroTitleInput(e.target.value); setSettingsIsDirty(true); }}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      placeholder="例: 研修申込・申込取消・新規入会申込を受け付けています"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">トップ説明文</label>
                  <textarea
                    value={publicPortalHeroDescriptionInput}
                    onChange={(e) => { setPublicPortalHeroDescriptionInput(e.target.value); setSettingsIsDirty(true); }}
                    rows={3}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                    placeholder="例: ご希望の手続きを選択し、そのまま申込画面へ進んでください。"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicPortalMembershipBadgeEnabledInput}
                      onChange={(e) => { setPublicPortalMembershipBadgeEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-slate-700">入会カードの補助ラベルを表示する</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicPortalMembershipTitleEnabledInput}
                      onChange={(e) => { setPublicPortalMembershipTitleEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-slate-700">入会カードの見出しを表示する</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicPortalMembershipDescriptionEnabledInput}
                      onChange={(e) => { setPublicPortalMembershipDescriptionEnabledInput(e.target.checked); setSettingsIsDirty(true); }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-slate-700">入会カードの説明文を表示する</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">入会カードの補助ラベル</label>
                    <input
                      type="text"
                      value={publicPortalMembershipBadgeLabelInput}
                      onChange={(e) => { setPublicPortalMembershipBadgeLabelInput(e.target.value); setSettingsIsDirty(true); }}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      placeholder="例: 入会申込"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">入会カードの見出し</label>
                    <input
                      type="text"
                      value={publicPortalMembershipTitleInput}
                      onChange={(e) => { setPublicPortalMembershipTitleInput(e.target.value); setSettingsIsDirty(true); }}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      placeholder="例: 新規入会を申し込む"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">入会カードの説明文</label>
                    <textarea
                      value={publicPortalMembershipDescriptionInput}
                      onChange={(e) => { setPublicPortalMembershipDescriptionInput(e.target.value); setSettingsIsDirty(true); }}
                      rows={3}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      placeholder="例: 個人会員・事業所会員・賛助会員の入会申込を受け付けています。"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">入会カードのボタン文言</label>
                    <input
                      type="text"
                      value={publicPortalMembershipCtaLabelInput}
                      onChange={(e) => { setPublicPortalMembershipCtaLabelInput(e.target.value); setSettingsIsDirty(true); }}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      placeholder="例: 入会申込へ進む"
                    />
                  </div>
                </div>

                {/* 研修カード文言設定 */}
                <div className="border-t border-slate-200 pt-4">
                  <h6 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">研修</span>
                    研修カードの文言
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalTrainingBadgeEnabledInput} onChange={(e) => { setPublicPortalTrainingBadgeEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">補助ラベルを表示する</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalTrainingTitleEnabledInput} onChange={(e) => { setPublicPortalTrainingTitleEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">見出しを表示する</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalTrainingDescriptionEnabledInput} onChange={(e) => { setPublicPortalTrainingDescriptionEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">説明文を表示する</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">補助ラベル</label>
                      <input type="text" value={publicPortalTrainingBadgeLabelInput} onChange={(e) => { setPublicPortalTrainingBadgeLabelInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 研修申込" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">見出し</label>
                      <input type="text" value={publicPortalTrainingTitleInput} onChange={(e) => { setPublicPortalTrainingTitleInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 研修を申し込む" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">説明文</label>
                      <textarea value={publicPortalTrainingDescriptionInput} onChange={(e) => { setPublicPortalTrainingDescriptionInput(e.target.value); setSettingsIsDirty(true); }} rows={3} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 受付中の研修一覧を確認し、そのまま申込できます。" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ボタン文言</label>
                      <input type="text" value={publicPortalTrainingCtaLabelInput} onChange={(e) => { setPublicPortalTrainingCtaLabelInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 進む" />
                    </div>
                  </div>
                </div>

                {/* 登録情報変更カード文言設定 */}
                <div className="border-t border-slate-200 pt-4">
                  <h6 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">登録情報変更</span>
                    登録情報変更カードの文言
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalMemberUpdateBadgeEnabledInput} onChange={(e) => { setPublicPortalMemberUpdateBadgeEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">補助ラベルを表示する</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalMemberUpdateTitleEnabledInput} onChange={(e) => { setPublicPortalMemberUpdateTitleEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">見出しを表示する</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalMemberUpdateDescriptionEnabledInput} onChange={(e) => { setPublicPortalMemberUpdateDescriptionEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">説明文を表示する</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">補助ラベル</label>
                      <input type="text" value={publicPortalMemberUpdateBadgeLabelInput} onChange={(e) => { setPublicPortalMemberUpdateBadgeLabelInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 登録情報変更" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">見出し</label>
                      <input type="text" value={publicPortalMemberUpdateTitleInput} onChange={(e) => { setPublicPortalMemberUpdateTitleInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 会員登録情報を変更する" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">説明文</label>
                      <textarea value={publicPortalMemberUpdateDescriptionInput} onChange={(e) => { setPublicPortalMemberUpdateDescriptionInput(e.target.value); setSettingsIsDirty(true); }} rows={3} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 住所・電話番号・メールアドレスなど、ご登録情報の変更を申し込めます。" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ボタン文言</label>
                      <input type="text" value={publicPortalMemberUpdateCtaLabelInput} onChange={(e) => { setPublicPortalMemberUpdateCtaLabelInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 変更手続きへ進む" />
                    </div>
                  </div>
                </div>

                {/* 退会カード文言設定 */}
                <div className="border-t border-slate-200 pt-4">
                  <h6 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">退会</span>
                    退会カードの文言
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalWithdrawalBadgeEnabledInput} onChange={(e) => { setPublicPortalWithdrawalBadgeEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">補助ラベルを表示する</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalWithdrawalTitleEnabledInput} onChange={(e) => { setPublicPortalWithdrawalTitleEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">見出しを表示する</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={publicPortalWithdrawalDescriptionEnabledInput} onChange={(e) => { setPublicPortalWithdrawalDescriptionEnabledInput(e.target.checked); setSettingsIsDirty(true); }} className="accent-primary-600" />
                      <span className="text-sm text-slate-700">説明文を表示する</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">補助ラベル</label>
                      <input type="text" value={publicPortalWithdrawalBadgeLabelInput} onChange={(e) => { setPublicPortalWithdrawalBadgeLabelInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 退会" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">見出し</label>
                      <input type="text" value={publicPortalWithdrawalTitleInput} onChange={(e) => { setPublicPortalWithdrawalTitleInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 退会を申し込む" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">説明文</label>
                      <textarea value={publicPortalWithdrawalDescriptionInput} onChange={(e) => { setPublicPortalWithdrawalDescriptionInput(e.target.value); setSettingsIsDirty(true); }} rows={3} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 退会申請を行います。退会は当年度末（3月31日）に適用されます。" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ボタン文言</label>
                      <input type="text" value={publicPortalWithdrawalCtaLabelInput} onChange={(e) => { setPublicPortalWithdrawalCtaLabelInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: 退会手続きへ進む" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </AdminSettingsSection>}

          {/* ── v371: メール送信制御（4 階層ガード）── */}
          {settingsSub === 'email' && <AdminSettingsSection
            id="settings-mail-control"
            title="メール送信制御（4段階の安全装置）"
            description="全体停止スイッチ＋配信方法＋転送先の許可リスト＋種別ごとの有効／無効の 4 段階で守ります。テスト時は転送先を自分のメールアドレスに固定すると、全メールが自分宛にだけ集まります。"
            badge="メール制御"
            defaultOpen
          >
            <div className="space-y-6">
              {/* ─── [1] グローバルキルスイッチ ─── */}
              <div className={`rounded-xl border-2 p-4 space-y-3 ${mailGlobalEnabledInput ? 'border-emerald-300 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
                <p className="text-xs font-semibold tracking-wide text-slate-600">[1] 全体停止スイッチ</p>
                <p className="text-xs text-slate-600">無効にすると、種別・配信方法に関わらず<strong>全メール送信を即時停止</strong>します。テスト環境では無効にしておくことを推奨します。</p>
                <ToggleSwitch color={mailGlobalEnabledInput ? 'emerald' : 'slate'}
                  enabled={mailGlobalEnabledInput}
                  onToggle={() => { setMailGlobalEnabledInput(v => !v); setSettingsIsDirty(true); }}
                  onLabel="メール送信を有効にする"
                  offLabel="全メール停止中（無効）— 安全状態" />
                {!mailGlobalEnabledInput && (
                  <p className="text-xs text-red-700 font-semibold">⚠️ 現在すべてのメール送信が停止されています。動作確認や本番運用に必要なときだけ有効に切り替えてください。</p>
                )}
              </div>

              {/* ─── [2] 配信モード ─── */}
              <div className="rounded-xl border-2 border-slate-300 bg-white p-4 space-y-3">
                <p className="text-xs font-semibold tracking-wide text-slate-600">[2] 配信方法</p>
                <p className="text-xs text-slate-500">全体停止スイッチが有効なときの、メールの扱い方を選びます。</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['LIVE', 'REDIRECT', 'SUPPRESS'] as const).map((modeOpt) => (
                    <label key={modeOpt} className={`flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors min-h-[44px] ${mailDeliveryModeInput === modeOpt ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <input type="radio" name="mailDeliveryMode" value={modeOpt} checked={mailDeliveryModeInput === modeOpt}
                        onChange={() => { setMailDeliveryModeInput(modeOpt); setSettingsIsDirty(true); }}
                        className="mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{
                          modeOpt === 'LIVE' ? '通常送信'
                          : modeOpt === 'REDIRECT' ? 'テスト集約'
                          : '送信抑止'
                        }<span className="ml-1 text-[11px] font-normal text-slate-400">{modeOpt}</span></p>
                        <p className="text-xs text-slate-500">{
                          modeOpt === 'LIVE' ? '実際の宛先へ送信します（種別ごとの設定に従う）'
                          : modeOpt === 'REDIRECT' ? '全メールを下の転送先へ集約します（テスト用）'
                          : '全種別の送信を止めます（記録だけ残す）'
                        }</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ─── [3] Redirect Allowlist ─── */}
              <div className={`rounded-xl border-2 p-4 space-y-3 ${mailDeliveryModeInput === 'REDIRECT' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-xs font-semibold tracking-wide text-slate-600">[3] 転送先の許可リスト（テスト集約用）</p>
                <p className="text-xs text-slate-600">「テスト集約」を選んでいるとき、全メールがここに書いた宛先（複数可・カンマ区切り）へ集約されます。「通常送信」「送信抑止」のときは使われません。空欄のまま「テスト集約」にすると、実質「送信抑止」と同じ動きになります。</p>
                <input type="text" value={mailRedirectAllowlistInput}
                  onChange={(e) => { setMailRedirectAllowlistInput(e.target.value); setSettingsIsDirty(true); }}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  placeholder="例: kenta-noguchi@tadakayo.jp, test@example.com" />
                {mailDeliveryModeInput === 'REDIRECT' && !mailRedirectAllowlistInput.trim() && (
                  <p className="text-xs text-red-600">⚠️「テスト集約」を選んでいますが、転送先が空です。このままだとメールは送信されません。</p>
                )}
              </div>

              {/* ─── [4] カテゴリ別 ON/OFF ─── */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <p className="text-xs font-semibold tracking-wide text-slate-600">[4] 種別ごとの有効／無効（補完分）</p>
                <p className="text-xs text-slate-500">認証情報メール／事業所メール／変更申請の通知以外の種別です。1 件ずつ有効・無効を切り替えられます。</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <ToggleSwitch color="emerald" enabled={trainingApplyReceiptEnabledInput}
                    onToggle={() => { setTrainingApplyReceiptEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="研修申込確認メール（有効）" offLabel="研修申込確認メール（無効）" />
                  <ToggleSwitch color="emerald" enabled={trainingReminderEnabledInput}
                    onToggle={() => { setTrainingReminderEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="研修リマインダーメール（有効）" offLabel="研修リマインダーメール（無効）" />
                  <ToggleSwitch color="emerald" enabled={bulkMailEnabledInput}
                    onToggle={() => { setBulkMailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="一括メール送信（有効）" offLabel="一括メール送信（無効）" />
                  <ToggleSwitch color="emerald" enabled={authOtpEnabledInput}
                    onToggle={() => { setAuthOtpEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="公開ポータル 本人確認コード（OTP）メール（有効）" offLabel="公開ポータル 本人確認コード（OTP）メール（無効）" />
                  <ToggleSwitch color="emerald" enabled={memberUpdateConfirmEnabledInput}
                    onToggle={() => { setMemberUpdateConfirmEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="会員情報変更確認メール（有効）" offLabel="会員情報変更確認メール（無効）" />
                  <ToggleSwitch color="emerald" enabled={withdrawalConfirmEnabledInput}
                    onToggle={() => { setWithdrawalConfirmEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="退会申請受付確認メール（有効）" offLabel="退会申請受付確認メール（無効）" />
                  <ToggleSwitch color="emerald" enabled={passwordResetEnabledInput}
                    onToggle={() => { setPasswordResetEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="パスワード再設定コードメール（有効）" offLabel="パスワード再設定コードメール（無効）" />
                </div>
                <p className="text-xs text-slate-500 mt-2">※既存の認証情報・事業所・変更申請ワークフローのメール設定は下の「入会・登録メール設定」セクションを使用してください。</p>
              </div>
            </div>
          </AdminSettingsSection>}

          {/* ── メール通知 ── */}
          {settingsSub === 'email' && <AdminSettingsSection
            id="settings-all-email"
            title="入会・登録メール設定"
            description="上部のメール送信制御が全メールの安全停止です。ここでは入会・登録と変更申請の通知ごとに、送信の有無・宛先ルール・件名・本文・テンプレートを設定します。"
            badge="メール設定"
            defaultOpen
          >
            {/* EmailCard / ToggleSwitch / MasterOffBanner / MergeTags は
                EmailSettingsCard.tsx に定義。App 内 IIFE での定義は
                毎レンダーで新型が生成されフォーカスが失われるため禁止。 */}
            <div className="space-y-6">
                {/* ─── 入会・登録情報メールの共通スイッチ ─── */}
                <div className="rounded-xl border-2 border-slate-300 bg-white p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 tracking-wide">入会・登録情報メールの共通スイッチ</p>
                  <p className="text-xs text-slate-500">無効にすると、下の入会完了・事業所登録・職員追加メールが停止されます。受付・承認・却下などの変更申請通知は、それぞれのカードで設定します。全メールを止める場合は上部の「メール送信制御」を使用してください。</p>
                  <ToggleSwitch color="emerald"
                    enabled={credentialEmailEnabledInput}
                    onToggle={() => { setCredentialEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="入会・登録メールを送信する（有効）"
                    offLabel="入会・登録情報メール停止中（無効）— 準備が整ったら有効へ戻してください" />
                  {!credentialEmailEnabledInput && (
                    <p className="text-xs text-red-600">現在は無効です。このグループの入会・登録情報メールは送信されません。</p>
                  )}
                </div>

                {/* ─── 送信元アドレス（共通） ─── */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 tracking-wide">自動通知の送信元アドレス（共通）</p>
                    <button type="button" onClick={() => { void loadCredentialEmailAliases(); }}
                      disabled={credentialEmailAliasLoading}
                      className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                      {credentialEmailAliasLoading ? '読込中...' : '更新'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">受付・承認・却下・入会完了・本人確認コードなどの自動通知に共通で使います。Gmail の「送信元アドレス（Send mail as）」に登録済みのアドレスから選べます。一括メールは送信画面で個別に選択します。</p>
                  <select value={credentialEmailFromInput}
                    onChange={(e) => { setCredentialEmailFromInput(e.target.value); setSettingsIsDirty(true); }}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                    disabled={credentialEmailAliasLoading && credentialEmailFromOptions.length === 0}>
                    {credentialEmailFromOptions.length > 0
                      ? credentialEmailFromOptions.map(a => <option key={a} value={a}>{a}</option>)
                      : <option value="">{credentialEmailAliasLoading ? '取得中...' : '利用可能なアドレスがありません'}</option>}
                  </select>
                  {credentialEmailAliasWarning && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">{credentialEmailAliasWarning}</p>
                  )}
                </div>

                <MasterOffBanner masterEnabled={credentialEmailEnabledInput} />

                {/* ─── 入会申し込み時のメール ─── */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">▍入会申し込み時のメール</h4>

                  {/* 個人・賛助会員 */}
                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.CREDENTIAL} />
                  <EmailCard badge="個人・賛助会員" title="個人会員・賛助会員向け"
                    enabled={indSuppEmailEnabledInput}
                    onToggle={() => { setIndSuppEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={credentialEmailSubjectInput}
                    onSubjectChange={v => { setCredentialEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={CREDENTIAL_EMAIL_DEFAULT_SUBJECT}
                    body={credentialEmailBodyInput}
                    onBodyChange={v => { setCredentialEmailBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager
                        api={api}
                        category="CREDENTIAL"
                        subject={credentialEmailSubjectInput}
                        body={credentialEmailBodyInput}
                        onLoad={(s, b) => { setCredentialEmailSubjectInput(s); setCredentialEmailBodyInput(b); setSettingsIsDirty(true); }}
                        defaultBody={CREDENTIAL_EMAIL_DEFAULT_BODY}
                      />
                    } />

                  {/* 事業所 代表者 */}
                  {/* v376.66: 事業所メールも 会員種別 / 年会費 の差し込みに対応 */}
                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.BIZ_REP} />
                  <EmailCard badge="事業所・代表者" title="事業所会員 代表者向け"
                    enabled={bizRepEmailEnabledInput}
                    onToggle={() => { setBizRepEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={bizRepEmailSubjectInput}
                    onSubjectChange={v => { setBizRepEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={BIZ_REP_SUBJECT_DEFAULT}
                    body={bizRepEmailBodyInput}
                    onBodyChange={v => { setBizRepEmailBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="BIZ_REP"
                        subject={bizRepEmailSubjectInput} body={bizRepEmailBodyInput}
                        onLoad={(s, b) => { setBizRepEmailSubjectInput(s); setBizRepEmailBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                  <EmailCard badge="事業所・メンバー" title="事業所会員 メンバー（代表者以外）向け"
                    enabled={bizStaffEmailEnabledInput}
                    onToggle={() => { setBizStaffEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={bizStaffEmailSubjectInput}
                    onSubjectChange={v => { setBizStaffEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={BIZ_STAFF_SUBJECT_DEFAULT}
                    body={bizStaffEmailBodyInput}
                    onBodyChange={v => { setBizStaffEmailBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="BIZ_STAFF"
                        subject={bizStaffEmailSubjectInput} body={bizStaffEmailBodyInput}
                        onLoad={(s, b) => { setBizStaffEmailSubjectInput(s); setBizStaffEmailBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                </div>

                {/* ─── 職員追加承認時のメール ─── */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">▍職員追加申請 承認時のメール</h4>
                  <MergeTags items={mergeTagUnion(MAIL_TEMPLATE_MERGE_TAGS.STAFF_ADD_STAFF, MAIL_TEMPLATE_MERGE_TAGS.STAFF_ADD_REP)} />
                  <EmailCard badge="追加職員" title="追加された職員へのメール"
                    enabled={staffAddStaffEmailEnabledInput}
                    onToggle={() => { setStaffAddStaffEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={staffAddStaffEmailSubjectInput}
                    onSubjectChange={v => { setStaffAddStaffEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={STAFF_ADD_STAFF_SUBJECT_DEFAULT}
                    body={staffAddStaffEmailBodyInput}
                    onBodyChange={v => { setStaffAddStaffEmailBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="STAFF_ADD_STAFF"
                        subject={staffAddStaffEmailSubjectInput} body={staffAddStaffEmailBodyInput}
                        onLoad={(s, b) => { setStaffAddStaffEmailSubjectInput(s); setStaffAddStaffEmailBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                  <EmailCard badge="代表者通知" title="事業所代表者への追加通知メール"
                    enabled={staffAddRepEmailEnabledInput}
                    onToggle={() => { setStaffAddRepEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={staffAddRepEmailSubjectInput}
                    onSubjectChange={v => { setStaffAddRepEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={STAFF_ADD_REP_SUBJECT_DEFAULT}
                    body={staffAddRepEmailBodyInput}
                    onBodyChange={v => { setStaffAddRepEmailBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="STAFF_ADD_REP"
                        subject={staffAddRepEmailSubjectInput} body={staffAddRepEmailBodyInput}
                        onLoad={(s, b) => { setStaffAddRepEmailSubjectInput(s); setStaffAddRepEmailBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                </div>

                {/* v369: ─── 変更申請ワークフロー (受付・承認・却下) のメール ─── */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">▍変更申請ワークフロー（受付・承認・却下）のメール</h4>
                  <p className="text-xs text-slate-500">公開ポータルからの入会・変更・退会・職員追加/除籍の申請受付時、および管理者の承認/却下時に申請者へ送信されるメールです。差込変数: <code>{`{{氏名}}`}</code> <code>{`{{会員種別ラベル}}`}</code> <code>{`{{申請種別}}`}</code> <code>{`{{申請ID}}`}</code> <code>{`{{受付日時}}`}</code> <code>{`{{処理日時}}`}</code> <code>{`{{処理者名}}`}</code> <code>{`{{変更内容サマリー}}`}</code> <code>{`{{処理備考}}`}</code></p>
                  <MergeTags items={mergeTagUnion(MAIL_TEMPLATE_MERGE_TAGS.APPLICATION_RECEIPT, MAIL_TEMPLATE_MERGE_TAGS.APPROVAL_NOTIFICATION, MAIL_TEMPLATE_MERGE_TAGS.REJECTION_NOTIFICATION)} />
                  <EmailCard badge="①受付確認" title="申請受付時：受付確認メール（申請者へ）"
                    enabled={applicationReceiptEnabledInput}
                    onToggle={() => { setApplicationReceiptEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={applicationReceiptSubjectInput}
                    onSubjectChange={v => { setApplicationReceiptSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={APPLICATION_RECEIPT_SUBJECT_DEFAULT}
                    body={applicationReceiptBodyInput}
                    onBodyChange={v => { setApplicationReceiptBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="APPLICATION_RECEIPT"
                        subject={applicationReceiptSubjectInput} body={applicationReceiptBodyInput}
                        onLoad={(s, b) => { setApplicationReceiptSubjectInput(s); setApplicationReceiptBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                  <EmailCard badge="②承認通知" title="管理者承認時：承認通知メール（申請者へ）"
                    enabled={approvalNotificationEnabledInput}
                    onToggle={() => { setApprovalNotificationEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={approvalNotificationSubjectInput}
                    onSubjectChange={v => { setApprovalNotificationSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={APPROVAL_NOTIFICATION_SUBJECT_DEFAULT}
                    body={approvalNotificationBodyInput}
                    onBodyChange={v => { setApprovalNotificationBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="APPROVAL_NOTIFICATION"
                        subject={approvalNotificationSubjectInput} body={approvalNotificationBodyInput}
                        onLoad={(s, b) => { setApprovalNotificationSubjectInput(s); setApprovalNotificationBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                  <EmailCard badge="③却下通知" title="管理者却下時：却下通知メール（申請者へ）"
                    enabled={rejectionNotificationEnabledInput}
                    onToggle={() => { setRejectionNotificationEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={rejectionNotificationSubjectInput}
                    onSubjectChange={v => { setRejectionNotificationSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={REJECTION_NOTIFICATION_SUBJECT_DEFAULT}
                    body={rejectionNotificationBodyInput}
                    onBodyChange={v => { setRejectionNotificationBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="REJECTION_NOTIFICATION"
                        subject={rejectionNotificationSubjectInput} body={rejectionNotificationBodyInput}
                        onLoad={(s, b) => { setRejectionNotificationSubjectInput(s); setRejectionNotificationBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                </div>

                {/* v376.43 (Phase B): その他の自動通知メール（従来ハードコード→差し込み化） */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">▍その他の自動通知メール（研修・本人確認コード・変更／退会確認・パスワード再設定）</h4>
                  <p className="text-xs text-slate-500">送信の有無は上部「メール送信制御 → 種別ごとの有効／無効」と連動します。件名・本文を差し込みタグ付きで編集でき、テンプレート管理（上書き保存／新規保存）に対応します。<strong>本人確認コード・パスワード再設定コードは、本文から該当タグを消しても安全装置により既定の文面で必ず送信されます。</strong></p>

                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.TRAINING_APPLY_RECEIPT} />
                  <EmailCard badge="研修申込確認" title="研修申込確認メール（外部申込者へ）"
                    enabled={trainingApplyReceiptEnabledInput}
                    onToggle={() => { setTrainingApplyReceiptEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={trainingApplyReceiptSubjectInput}
                    onSubjectChange={v => { setTrainingApplyReceiptSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={TRAINING_APPLY_RECEIPT_SUBJECT_DEFAULT}
                    body={trainingApplyReceiptBodyInput}
                    onBodyChange={v => { setTrainingApplyReceiptBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="TRAINING_APPLY_RECEIPT"
                        subject={trainingApplyReceiptSubjectInput} body={trainingApplyReceiptBodyInput}
                        onLoad={(s, b) => { setTrainingApplyReceiptSubjectInput(s); setTrainingApplyReceiptBodyInput(b); setSettingsIsDirty(true); }} />
                    } />

                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.TRAINING_REMINDER} />
                  <EmailCard badge="研修リマインダー" title="研修リマインダーメール（申込者へ）"
                    enabled={trainingReminderEnabledInput}
                    onToggle={() => { setTrainingReminderEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={trainingReminderSubjectInput}
                    onSubjectChange={v => { setTrainingReminderSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={TRAINING_REMINDER_SUBJECT_DEFAULT}
                    body={trainingReminderBodyInput}
                    onBodyChange={v => { setTrainingReminderBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="TRAINING_REMINDER"
                        subject={trainingReminderSubjectInput} body={trainingReminderBodyInput}
                        onLoad={(s, b) => { setTrainingReminderSubjectInput(s); setTrainingReminderBodyInput(b); setSettingsIsDirty(true); }} />
                    } />

                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.AUTH_OTP} />
                  <EmailCard badge="公開ポータルOTP" title="公開ポータル 本人確認コード（OTP）メール"
                    enabled={authOtpEnabledInput}
                    onToggle={() => { setAuthOtpEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={authOtpSubjectInput}
                    onSubjectChange={v => { setAuthOtpSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={AUTH_OTP_SUBJECT_DEFAULT}
                    body={authOtpBodyInput}
                    onBodyChange={v => { setAuthOtpBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="AUTH_OTP"
                        subject={authOtpSubjectInput} body={authOtpBodyInput}
                        onLoad={(s, b) => { setAuthOtpSubjectInput(s); setAuthOtpBodyInput(b); setSettingsIsDirty(true); }} />
                    } />

                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.MEMBER_UPDATE_CONFIRM} />
                  <EmailCard badge="会員情報変更確認" title="会員情報変更確認メール（個人会員の自己変更時）"
                    enabled={memberUpdateConfirmEnabledInput}
                    onToggle={() => { setMemberUpdateConfirmEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={memberUpdateConfirmSubjectInput}
                    onSubjectChange={v => { setMemberUpdateConfirmSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={MEMBER_UPDATE_CONFIRM_SUBJECT_DEFAULT}
                    body={memberUpdateConfirmBodyInput}
                    onBodyChange={v => { setMemberUpdateConfirmBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="MEMBER_UPDATE_CONFIRM"
                        subject={memberUpdateConfirmSubjectInput} body={memberUpdateConfirmBodyInput}
                        onLoad={(s, b) => { setMemberUpdateConfirmSubjectInput(s); setMemberUpdateConfirmBodyInput(b); setSettingsIsDirty(true); }} />
                    } />

                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.WITHDRAWAL_CONFIRM} />
                  <EmailCard badge="退会申請受付" title="退会申請受付確認メール（申請会員へ）"
                    enabled={withdrawalConfirmEnabledInput}
                    onToggle={() => { setWithdrawalConfirmEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={withdrawalConfirmSubjectInput}
                    onSubjectChange={v => { setWithdrawalConfirmSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={WITHDRAWAL_CONFIRM_SUBJECT_DEFAULT}
                    body={withdrawalConfirmBodyInput}
                    onBodyChange={v => { setWithdrawalConfirmBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="WITHDRAWAL_CONFIRM"
                        subject={withdrawalConfirmSubjectInput} body={withdrawalConfirmBodyInput}
                        onLoad={(s, b) => { setWithdrawalConfirmSubjectInput(s); setWithdrawalConfirmBodyInput(b); setSettingsIsDirty(true); }} />
                    } />

                  <MergeTags items={MAIL_TEMPLATE_MERGE_TAGS.PASSWORD_RESET} />
                  <EmailCard badge="パスワード再設定" title="パスワード再設定コードメール（会員へ）"
                    enabled={passwordResetEnabledInput}
                    onToggle={() => { setPasswordResetEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={passwordResetSubjectInput}
                    onSubjectChange={v => { setPasswordResetSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={PASSWORD_RESET_SUBJECT_DEFAULT}
                    body={passwordResetBodyInput}
                    onBodyChange={v => { setPasswordResetBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <MailTemplateManager api={api} category="PASSWORD_RESET"
                        subject={passwordResetSubjectInput} body={passwordResetBodyInput}
                        onLoad={(s, b) => { setPasswordResetSubjectInput(s); setPasswordResetBodyInput(b); setSettingsIsDirty(true); }} />
                    } />
                </div>
              </div>
          </AdminSettingsSection>}

          {settingsSub === 'portal' && <AdminSettingsSection
            id="settings-portal-completion"
            title="入会完了画面の文言設定"
            description="公開ポータルで入会申込完了後に表示される「今後のご案内」とログイン情報カードの文言を設定します。メール送信設定とは独立しています。"
            badge="完了画面"
          >
            <div className="space-y-4">
              <div>
                {/* ① 入会完了画面 - 今後のご案内 */}
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 tracking-wide">② 入会完了画面 — 今後のご案内</p>
                  <p className="text-xs text-slate-500">完了画面の「今後のご案内」ブロック全体の表示有無と本文を設定します。本文はメール送信の有効時・無効時で分けて管理します。</p>
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={publicPortalCompletionGuidanceVisibleInput}
                        onChange={(e) => { setPublicPortalCompletionGuidanceVisibleInput(e.target.checked); setSettingsIsDirty(true); }}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${publicPortalCompletionGuidanceVisibleInput ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publicPortalCompletionGuidanceVisibleInput ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">「今後のご案内」ブロックを表示する</span>
                  </label>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary-500 inline-block"></span>
                        送信ON時の案内文
                      </span>
                    </label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={publicPortalCompletionGuidanceBodyWhenCredentialSentInput}
                        onChange={(e) => { setPublicPortalCompletionGuidanceBodyWhenCredentialSentInput(e.target.value); setSettingsIsDirty(true); }}
                        rows={4}
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm resize-y"
                        placeholder="送信済みの場合に表示する本文"
                      />
                      <button
                        type="button"
                        onClick={() => { setPublicPortalCompletionGuidanceBodyWhenCredentialSentInput(PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialSent); setSettingsIsDirty(true); }}
                        className="px-2 py-2 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 whitespace-nowrap"
                      >デフォルトに戻す</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                        送信OFF時の案内文
                      </span>
                    </label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={publicPortalCompletionGuidanceBodyWhenCredentialNotSentInput}
                        onChange={(e) => { setPublicPortalCompletionGuidanceBodyWhenCredentialNotSentInput(e.target.value); setSettingsIsDirty(true); }}
                        rows={4}
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm resize-y"
                        placeholder="未送信の場合に表示する本文"
                      />
                      <button
                        type="button"
                        onClick={() => { setPublicPortalCompletionGuidanceBodyWhenCredentialNotSentInput(PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialNotSent); setSettingsIsDirty(true); }}
                        className="px-2 py-2 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 whitespace-nowrap"
                      >デフォルトに戻す</button>
                    </div>
                  </div>
                </div>

                {/* ③ ログイン情報カードの表示・非表示 */}
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 space-y-4">
                  <p className="text-xs font-semibold text-slate-500 tracking-wide mb-3">③ ログイン情報カードの表示・非表示</p>
                  <p className="text-xs text-slate-500">ログイン情報ブロック全体の表示有無、ログインID自体を画面に出すか、補足本文を設定します。</p>
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={publicPortalCompletionLoginInfoBlockVisibleInput}
                        onChange={(e) => { setPublicPortalCompletionLoginInfoBlockVisibleInput(e.target.checked); setSettingsIsDirty(true); }}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${publicPortalCompletionLoginInfoBlockVisibleInput ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publicPortalCompletionLoginInfoBlockVisibleInput ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">ログイン情報ブロックを表示する</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={publicPortalCompletionLoginInfoVisibleInput}
                        onChange={(e) => { setPublicPortalCompletionLoginInfoVisibleInput(e.target.checked); setSettingsIsDirty(true); }}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${publicPortalCompletionLoginInfoVisibleInput ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publicPortalCompletionLoginInfoVisibleInput ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      入会申込完了画面でログイン情報を表示する
                    </span>
                  </label>
                  <p className="mt-2 text-xs text-slate-500">
                    OFF の場合はログインID・パスワードを画面に表示せず、メール送信状況のみ案内します。会員ページ公開時に ON へ戻してください。
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">メール送信ON時の補足本文</label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={publicPortalCompletionLoginInfoBodyWhenCredentialSentInput}
                        onChange={(e) => { setPublicPortalCompletionLoginInfoBodyWhenCredentialSentInput(e.target.value); setSettingsIsDirty(true); }}
                        rows={3}
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm resize-y"
                        placeholder="ログイン情報ブロック内の補足本文"
                      />
                      <button
                        type="button"
                        onClick={() => { setPublicPortalCompletionLoginInfoBodyWhenCredentialSentInput(PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialSent); setSettingsIsDirty(true); }}
                        className="px-2 py-2 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 whitespace-nowrap"
                      >デフォルトに戻す</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">メール送信OFF時の補足本文</label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={publicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput}
                        onChange={(e) => { setPublicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput(e.target.value); setSettingsIsDirty(true); }}
                        rows={3}
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm resize-y"
                        placeholder="ログイン情報未送信時の補足本文"
                      />
                      <button
                        type="button"
                        onClick={() => { setPublicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput(PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent); setSettingsIsDirty(true); }}
                        className="px-2 py-2 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 whitespace-nowrap"
                      >デフォルトに戻す</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="block text-sm font-medium text-slate-700">送信元メールアドレス</label>
                  <button
                    type="button"
                    onClick={() => { void loadCredentialEmailAliases(); }}
                    disabled={credentialEmailAliasLoading}
                    className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {credentialEmailAliasLoading ? '読込中...' : '更新'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Gmail の「メールアドレスを追加」「Send mail as」に登録済みの主メールアドレス・送信エイリアスから選択します。
                </p>
                <select
                  value={credentialEmailFromInput}
                  onChange={(e) => { setCredentialEmailFromInput(e.target.value); setSettingsIsDirty(true); }}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                  disabled={credentialEmailAliasLoading && credentialEmailFromOptions.length === 0}
                >
                  {credentialEmailFromOptions.length > 0 ? (
                    credentialEmailFromOptions.map((address) => (
                      <option key={address} value={address}>{address}</option>
                    ))
                  ) : (
                    <option value="">{credentialEmailAliasLoading ? '送信元アドレスを取得中...' : '利用可能な送信元アドレスがありません'}</option>
                  )}
                </select>
                {credentialEmailAliasWarning && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    {credentialEmailAliasWarning}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">メール件名</label>
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={credentialEmailSubjectInput}
                    onChange={(e) => { setCredentialEmailSubjectInput(e.target.value); setSettingsIsDirty(true); }}
                    className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                    placeholder="メール件名を入力"
                  />
                  <button
                    type="button"
                    onClick={() => { setCredentialEmailSubjectInput(CREDENTIAL_EMAIL_DEFAULT_SUBJECT); setSettingsIsDirty(true); }}
                    className="px-2 py-2 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 whitespace-nowrap"
                  >デフォルトに戻す</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">メール本文</label>
                <p className="text-xs text-slate-500 mb-2">
                  利用可能なマージタグ：
                  {[
                    ['{{氏名}}', '会員氏名'],
                    ['{{ログインID}}', 'ログインID'],
                    ['{{パスワード}}', '初期パスワード'],
                    ['{{会員マイページURL}}', '会員マイページURL'],
                    ['{{会員種別}}', '個人会員・事業所会員など'],
                    ['{{年会費}}', '3,000円など'],
                  ].map(([tag, desc]) => (
                    <span key={tag} className="inline-flex items-center gap-0.5 mx-0.5">
                      <button
                        type="button"
                        title={`クリックで本文に挿入（${desc}）`}
                        className="bg-slate-100 hover:bg-primary-100 border border-slate-300 px-1 rounded text-xs font-mono transition-colors cursor-pointer"
                        onClick={() => {
                          setCredentialEmailBodyInput(prev => prev + tag);
                          setSettingsIsDirty(true);
                        }}
                      >{tag}</button>
                    </span>
                  ))}
                  <span className="text-slate-400 ml-1">（クリックで本文末尾に挿入）</span>
                </p>
                <textarea
                  value={credentialEmailBodyInput}
                  onChange={(e) => { setCredentialEmailBodyInput(e.target.value); setSettingsIsDirty(true); }}
                  rows={12}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono leading-relaxed resize-y"
                  placeholder="メール本文を入力（マージタグを使用可能）"
                />
                {/* v219: テンプレート保存・読み込み */}
                <div className="mt-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">テンプレート管理</span>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-primary-50 border border-primary-300 text-primary-700 hover:bg-primary-100 transition-colors"
                      onClick={() => { setShowTemplateSaveForm(f => !f); setTemplateSaveNameInput(''); }}
                    >＋ 現在の内容を保存</button>
                  </div>
                  {showTemplateSaveForm && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={templateSaveNameInput}
                        onChange={e => setTemplateSaveNameInput(e.target.value)}
                        placeholder="テンプレート名（例：基本テンプレート）"
                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                        maxLength={50}
                      />
                      <button
                        type="button"
                        disabled={templateSaving || !templateSaveNameInput.trim()}
                        className="px-3 py-1 text-xs rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap"
                        onClick={async () => {
                          if (!templateSaveNameInput.trim()) return;
                          setTemplateSaving(true);
                          try {
                            const saved = await api.saveCredentialEmailTemplate({
                              name: templateSaveNameInput.trim(),
                              subject: credentialEmailSubjectInput,
                              body: credentialEmailBodyInput,
                            });
                            setEmailTemplates(prev => {
                              const idx = prev.findIndex(t => t.id === saved.id);
                              return idx >= 0 ? prev.map(t => t.id === saved.id ? saved : t) : [...prev, saved];
                            });
                            setShowTemplateSaveForm(false);
                            setTemplateSaveNameInput('');
                          } catch { alert('保存に失敗しました'); }
                          finally { setTemplateSaving(false); }
                        }}
                      >{templateSaving ? '保存中…' : '保存'}</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-100"
                        onClick={() => { setShowTemplateSaveForm(false); setTemplateSaveNameInput(''); }}
                      >キャンセル</button>
                    </div>
                  )}
                  {emailTemplates.length === 0 ? (
                    <p className="text-xs text-slate-400">保存済みテンプレートはありません</p>
                  ) : (
                    <ul className="space-y-1">
                      {emailTemplates.map(t => (
                        <li key={t.id} className="flex items-center gap-2 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white">
                          <span className="flex-1 font-medium text-slate-700 truncate">{t.name}</span>
                          <span className="text-slate-400 shrink-0">{t.savedAt.slice(0, 10)}</span>
                          <button
                            type="button"
                            className="px-2 py-0.5 rounded border border-primary-300 text-primary-700 hover:bg-primary-50 whitespace-nowrap"
                            onClick={() => {
                              if (!window.confirm(`「${t.name}」を読み込みますか？\n現在の件名・本文が上書きされます。`)) return;
                              setCredentialEmailSubjectInput(t.subject);
                              setCredentialEmailBodyInput(t.body);
                              setSettingsIsDirty(true);
                            }}
                          >読み込む</button>
                          <button
                            type="button"
                            disabled={templateDeleting === t.id}
                            className="px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 whitespace-nowrap disabled:opacity-50"
                            onClick={async () => {
                              if (!window.confirm(`「${t.name}」を削除しますか？`)) return;
                              setTemplateDeleting(t.id);
                              try {
                                await api.deleteCredentialEmailTemplate(t.id);
                                setEmailTemplates(prev => prev.filter(x => x.id !== t.id));
                              } catch { alert('削除に失敗しました'); }
                              finally { setTemplateDeleting(null); }
                            }}
                          >{templateDeleting === t.id ? '…' : '削除'}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => { setCredentialEmailBodyInput(CREDENTIAL_EMAIL_DEFAULT_BODY); setSettingsIsDirty(true); }}
                    className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50"
                  >デフォルトに戻す</button>
                </div>
              </div>
            </div>
          </AdminSettingsSection>}

          {/* v266: 事業所メール設定は settings-all-email に統合済み - このセクションは非表示 */}
          <div className="hidden">
          <AdminSettingsSection
            id="settings-biz-email"
            title="事業所会員メール設定（統合済み）"
            description=""
            badge=""
          >
            {(() => {
              const tagDesc = [
                ['{{氏名}}', '受信者の氏名'], ['{{ログインID}}', 'ログインID'], ['{{パスワード}}', '初期パスワード'],
                ['{{会員マイページURL}}', '会員マイページURL'], ['{{事業所名}}', '事業所名'],
              ];
              const tagDescWithStaff = [...tagDesc, ['{{追加職員氏名}}', '追加された職員の氏名（複数の場合は読点区切り）']];
              const TagList = ({ tags }: { tags: string[][] }) => (
                <p className="text-xs text-slate-500 mb-2">
                  利用可能なマージタグ：
                  {tags.map(([tag, desc]) => (
                    <span key={tag} className="inline-flex items-center gap-0.5 mx-0.5">
                      <code className="bg-slate-100 text-violet-700 px-1 rounded text-[11px]">{tag}</code>
                      <span className="text-slate-400 text-[11px]">({desc})</span>
                    </span>
                  ))}
                </p>
              );
              const ToggleRow = ({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative inline-block w-11 h-6 flex-shrink-0">
                    <input type="checkbox" className="sr-only" checked={enabled} onChange={onToggle} />
                    <div className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-violet-600' : 'bg-slate-300'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              );
              const EmailBlock = ({ title, badge, enabled, onToggle, subject, onSubjectChange, body, onBodyChange, defaultSubject }: {
                title: string; badge: string; enabled: boolean; onToggle: () => void;
                subject: string; onSubjectChange: (v: string) => void;
                body: string; onBodyChange: (v: string) => void; defaultSubject: string;
                tags?: string[][];
              }) => (
                <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{badge}</span>
                    <span className="text-sm font-semibold text-slate-800">{title}</span>
                  </div>
                  <ToggleRow label={enabled ? 'メールを送信する（ON）' : '送信しない（OFF）'} enabled={enabled} onToggle={onToggle} />
                  {enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">件名</label>
                        <div className="flex gap-2">
                          <input type="text" value={subject} onChange={e => onSubjectChange(e.target.value)}
                            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm" placeholder="メール件名" />
                          <button type="button" onClick={() => onSubjectChange(defaultSubject)}
                            className="px-2 py-2 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 whitespace-nowrap">デフォルト</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">本文</label>
                        <textarea value={body} onChange={e => onBodyChange(e.target.value)} rows={8}
                          className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono leading-relaxed resize-y"
                          placeholder="メール本文（マージタグ使用可能）" />
                      </div>
                    </>
                  )}
                </div>
              );
              return (
                <div className="space-y-6 mt-4">
                  {!credentialEmailEnabledInput && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      全体フラグ「入会時ログイン情報メール」が OFF のため、以下の設定に関わらず全メールが停止されます。
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">▍入会申し込み時のメール</h4>
                    <TagList tags={tagDesc} />
                    <div className="space-y-4">
                      <EmailBlock title="代表者向けメール" badge="代表者" enabled={bizRepEmailEnabledInput}
                        onToggle={() => { setBizRepEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                        subject={bizRepEmailSubjectInput} onSubjectChange={v => { setBizRepEmailSubjectInput(v); setSettingsIsDirty(true); }}
                        body={bizRepEmailBodyInput} onBodyChange={v => { setBizRepEmailBodyInput(v); setSettingsIsDirty(true); }}
                        defaultSubject={BIZ_REP_SUBJECT_DEFAULT} />
                      <EmailBlock title="メンバー（代表者以外）向けメール" badge="メンバー" enabled={bizStaffEmailEnabledInput}
                        onToggle={() => { setBizStaffEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                        subject={bizStaffEmailSubjectInput} onSubjectChange={v => { setBizStaffEmailSubjectInput(v); setSettingsIsDirty(true); }}
                        body={bizStaffEmailBodyInput} onBodyChange={v => { setBizStaffEmailBodyInput(v); setSettingsIsDirty(true); }}
                        defaultSubject={BIZ_STAFF_SUBJECT_DEFAULT} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">▍職員追加申請が承認されたときのメール</h4>
                    <TagList tags={tagDescWithStaff} />
                    <div className="space-y-4">
                      <EmailBlock title="追加された職員へのメール" badge="追加職員" enabled={staffAddStaffEmailEnabledInput}
                        onToggle={() => { setStaffAddStaffEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                        subject={staffAddStaffEmailSubjectInput} onSubjectChange={v => { setStaffAddStaffEmailSubjectInput(v); setSettingsIsDirty(true); }}
                        body={staffAddStaffEmailBodyInput} onBodyChange={v => { setStaffAddStaffEmailBodyInput(v); setSettingsIsDirty(true); }}
                        defaultSubject={STAFF_ADD_STAFF_SUBJECT_DEFAULT} />
                      <EmailBlock title="代表者への追加通知メール" badge="代表者通知" enabled={staffAddRepEmailEnabledInput}
                        onToggle={() => { setStaffAddRepEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                        subject={staffAddRepEmailSubjectInput} onSubjectChange={v => { setStaffAddRepEmailSubjectInput(v); setSettingsIsDirty(true); }}
                        body={staffAddRepEmailBodyInput} onBodyChange={v => { setStaffAddRepEmailBodyInput(v); setSettingsIsDirty(true); }}
                        defaultSubject={STAFF_ADD_REP_SUBJECT_DEFAULT} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </AdminSettingsSection>
          </div>

          {settingsSub === 'output' && <AdminSettingsSection
            id="settings-training-folder"
            title="研修ファイル保存先フォルダ"
            description="研修案内PDFなどのアップロード先 Google Drive フォルダを設定します。未設定の場合は初回アップロード時にマイドライブ直下に「研修案内状」フォルダが自動作成されます。"
            badge="Drive設定"
          >
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">保存先フォルダ ID</label>
                <p className="text-xs text-slate-500 mb-2">
                  Google Drive のフォルダURLの末尾の文字列（例: <code className="bg-slate-100 px-1 rounded">1abc...xyz</code>）を入力、または下のボタンで自動作成してください。
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trainingFileFolderIdInput}
                    onChange={e => { setTrainingFileFolderIdInput(e.target.value); setSettingsIsDirty(true); }}
                    placeholder="Drive フォルダ ID（空の場合は自動作成）"
                    className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <button
                  type="button"
                  disabled={folderSetupBusy}
                  onClick={async () => {
                    setFolderSetupBusy(true);
                    setFolderSetupResult(null);
                    try {
                      const result = await callApi<{ folderId: string; folderUrl: string }>('setupTrainingFileFolder', {});
                      setTrainingFileFolderIdInput(result.folderId);
                      setFolderSetupResult(result);
                      setSettingsIsDirty(true);
                    } catch (e) {
                      alert('フォルダ作成に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
                    } finally {
                      setFolderSetupBusy(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {folderSetupBusy ? '作成中...' : 'マイドライブに「研修案内状」フォルダを作成して設定する'}
                </button>
                {folderSetupResult && (
                  <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
                    <p className="font-medium text-green-800">フォルダを作成・設定しました</p>
                    <p className="text-green-700 mt-1">ID: <code className="bg-green-100 px-1 rounded">{folderSetupResult.folderId}</code></p>
                    <a href={folderSetupResult.folderUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 underline text-xs">
                      Drive でフォルダを開く →
                    </a>
                    <p className="text-green-600 text-xs mt-1">「設定を保存」を押してIDを確定してください。</p>
                  </div>
                )}
                {trainingFileFolderIdInput && !folderSetupResult && (
                  <p className="mt-2 text-xs text-slate-500">
                    設定済みフォルダID: <code className="bg-slate-100 px-1 rounded">{trainingFileFolderIdInput}</code>
                    {' '}
                    <a href={'https://drive.google.com/drive/folders/' + trainingFileFolderIdInput} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Drive で確認 →</a>
                  </p>
                )}
              </div>

              {/* v296: 請求添付ファイルフォルダ */}
              <div className="mt-6 border-t border-slate-200 pt-5">
                <h4 className="mb-2 text-sm font-semibold text-slate-800">請求添付ファイル保存先（v296）</h4>
                <p className="mb-3 text-xs text-slate-500">
                  役員が請求時にアップロードする領収書・明細書の保存先フォルダです。
                  未設定の場合、最初のアップロード時に「請求添付ファイル」フォルダが自動作成されます。
                </p>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="claim-folder-id">フォルダ ID（空白 = 自動作成）</label>
                <input
                  id="claim-folder-id"
                  type="text"
                  value={claimAttachmentFolderIdInput}
                  onChange={(e) => { setClaimAttachmentFolderIdInput(e.target.value); setSettingsIsDirty(true); }}
                  placeholder="Drive フォルダ ID（URLの /folders/〜 の部分）"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {claimAttachmentFolderIdInput && (
                  <p className="mt-1 text-xs text-slate-500">
                    <a href={`https://drive.google.com/drive/folders/${claimAttachmentFolderIdInput}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Drive で確認 →</a>
                  </p>
                )}
              </div>
            </div>
          </AdminSettingsSection>}

          {/* ── マスタ管理 ── */}
          {settingsSub === 'masters' && <AdminSettingsSection
            id="settings-business-limits"
            title="事業所ごとの個別上限"
            description="通常は全体デフォルト上限を使い、特定事業所だけ例外設定する場合に利用します。全件読込が必要なため単独セクションに分けています。"
            badge="個別調整"
          >
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
          </AdminSettingsSection>}

          {settingsSub === 'masters' && <AdminSettingsSection
            id="settings-officer-masters"
            title="役員マスタ管理"
            description="役員管理で使用する組織・役職・支払い種別を定義します。追加・編集・削除はこのセクションから行えます。"
            badge="役員管理"
          >
            <OfficerMasterSettings api={api} />
          </AdminSettingsSection>}

          {/* 保存ボタン */}
          <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">一括保存</p>
                <p className="text-xs text-slate-500">変更はセクションをまたいでまとめて保存されます。保存前に各セクションを閉じても入力値は保持されます。</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className={`text-xs font-medium ${settingsIsDirty ? 'text-amber-700' : 'text-slate-500'}`}>
                  {settingsIsDirty ? '未保存の変更があります' : '変更はありません'}
                </span>
                <button
                  type="button"
                  disabled={settingsBusy || !systemSettingsLoaded || !settingsIsDirty}
                  onClick={async () => {
                    try {
                      setSettingsBusy(true);
                      const saved = await api.updateSystemSettings({
                        trainingFileFolderId: trainingFileFolderIdInput,
                        claimAttachmentFolderId: claimAttachmentFolderIdInput,
                        defaultBusinessStaffLimit: Number(globalLimitInput || 10),
                        trainingHistoryLookbackMonths: Number(historyLookbackInput || 18),
                        annualFeePaymentGuidance: annualFeePaymentGuidanceInput,
                        annualFeeTransferAccount: annualFeeTransferAccountInput,
                        memberTypeAnnualFees: {
                          INDIVIDUAL: Number(memberTypeAnnualFeesInput.INDIVIDUAL || 0),
                          BUSINESS: Number(memberTypeAnnualFeesInput.BUSINESS || 0),
                          SUPPORT: Number(memberTypeAnnualFeesInput.SUPPORT || 0),
                        },
                        membershipFeePublicVisible: membershipFeePublicVisibleInput,
                        membershipFeeNote: membershipFeeNoteInput,
                        trainingDefaultFieldConfig: trainingDefaultFieldConfigInput,
                        bulkMailAutoAttachFolderId: bulkMailAutoAttachFolderIdInput,
                        emailLogViewerRole: emailLogViewerRoleInput,
                        credentialEmailEnabled: credentialEmailEnabledInput,
                        credentialEmailFrom: credentialEmailFromInput,
                        credentialEmailSubject: credentialEmailSubjectInput,
                        credentialEmailBody: credentialEmailBodyInput,
                        publicPortalTrainingMenuEnabled: publicPortalTrainingMenuEnabledInput,
                        publicPortalMembershipMenuEnabled: publicPortalMembershipMenuEnabledInput,
                        publicPortalHeroBadgeEnabled: publicPortalHeroBadgeEnabledInput,
                        publicPortalHeroBadgeLabel: publicPortalHeroBadgeLabelInput,
                        publicPortalHeroTitle: publicPortalHeroTitleInput,
                        publicPortalHeroDescriptionEnabled: publicPortalHeroDescriptionEnabledInput,
                        publicPortalHeroDescription: publicPortalHeroDescriptionInput,
                        publicPortalMembershipBadgeEnabled: publicPortalMembershipBadgeEnabledInput,
                        publicPortalMembershipBadgeLabel: publicPortalMembershipBadgeLabelInput,
                        publicPortalMembershipTitleEnabled: publicPortalMembershipTitleEnabledInput,
                        publicPortalMembershipTitle: publicPortalMembershipTitleInput,
                        publicPortalMembershipDescriptionEnabled: publicPortalMembershipDescriptionEnabledInput,
                        publicPortalMembershipDescription: publicPortalMembershipDescriptionInput,
                        publicPortalMembershipCtaLabel: publicPortalMembershipCtaLabelInput,
                        publicPortalCompletionGuidanceVisible: publicPortalCompletionGuidanceVisibleInput,
                        publicPortalCompletionGuidanceBodyWhenCredentialSent: publicPortalCompletionGuidanceBodyWhenCredentialSentInput,
                        publicPortalCompletionGuidanceBodyWhenCredentialNotSent: publicPortalCompletionGuidanceBodyWhenCredentialNotSentInput,
                        publicPortalCompletionLoginInfoBlockVisible: publicPortalCompletionLoginInfoBlockVisibleInput,
                        publicPortalCompletionLoginInfoVisible: publicPortalCompletionLoginInfoVisibleInput,
                        publicPortalCompletionLoginInfoBodyWhenCredentialSent: publicPortalCompletionLoginInfoBodyWhenCredentialSentInput,
                        publicPortalCompletionLoginInfoBodyWhenCredentialNotSent: publicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput,
                        publicPortalCompletionNoCredentialNotice: publicPortalCompletionNoCredentialNoticeInput,
                        publicPortalCompletionCredentialNotice: publicPortalCompletionCredentialNoticeInput,
                        publicPortalTrainingBadgeEnabled: publicPortalTrainingBadgeEnabledInput,
                        publicPortalTrainingBadgeLabel: publicPortalTrainingBadgeLabelInput,
                        publicPortalTrainingTitleEnabled: publicPortalTrainingTitleEnabledInput,
                        publicPortalTrainingTitle: publicPortalTrainingTitleInput,
                        publicPortalTrainingDescriptionEnabled: publicPortalTrainingDescriptionEnabledInput,
                        publicPortalTrainingDescription: publicPortalTrainingDescriptionInput,
                        publicPortalTrainingCtaLabel: publicPortalTrainingCtaLabelInput,
                        publicPortalMemberUpdateMenuEnabled: publicPortalMemberUpdateMenuEnabledInput,
                        publicPortalMemberUpdateBadgeEnabled: publicPortalMemberUpdateBadgeEnabledInput,
                        publicPortalMemberUpdateBadgeLabel: publicPortalMemberUpdateBadgeLabelInput,
                        publicPortalMemberUpdateTitleEnabled: publicPortalMemberUpdateTitleEnabledInput,
                        publicPortalMemberUpdateTitle: publicPortalMemberUpdateTitleInput,
                        publicPortalMemberUpdateDescriptionEnabled: publicPortalMemberUpdateDescriptionEnabledInput,
                        publicPortalMemberUpdateDescription: publicPortalMemberUpdateDescriptionInput,
                        publicPortalMemberUpdateCtaLabel: publicPortalMemberUpdateCtaLabelInput,
                        publicPortalWithdrawalMenuEnabled: publicPortalWithdrawalMenuEnabledInput,
                        publicPortalWithdrawalBadgeEnabled: publicPortalWithdrawalBadgeEnabledInput,
                        publicPortalWithdrawalBadgeLabel: publicPortalWithdrawalBadgeLabelInput,
                        publicPortalWithdrawalTitleEnabled: publicPortalWithdrawalTitleEnabledInput,
                        publicPortalWithdrawalTitle: publicPortalWithdrawalTitleInput,
                        publicPortalWithdrawalDescriptionEnabled: publicPortalWithdrawalDescriptionEnabledInput,
                        publicPortalWithdrawalDescription: publicPortalWithdrawalDescriptionInput,
                        publicPortalWithdrawalCtaLabel: publicPortalWithdrawalCtaLabelInput,
                        // v265: 個人・賛助会員メール ON/OFF
                        indSuppEmailEnabled: indSuppEmailEnabledInput,
                        // v265: 事業所メール設定
                        bizRepEmailEnabled: bizRepEmailEnabledInput,
                        bizRepEmailSubject: bizRepEmailSubjectInput,
                        bizRepEmailBody: bizRepEmailBodyInput,
                        bizStaffEmailEnabled: bizStaffEmailEnabledInput,
                        bizStaffEmailSubject: bizStaffEmailSubjectInput,
                        bizStaffEmailBody: bizStaffEmailBodyInput,
                        staffAddStaffEmailEnabled: staffAddStaffEmailEnabledInput,
                        staffAddStaffEmailSubject: staffAddStaffEmailSubjectInput,
                        staffAddStaffEmailBody: staffAddStaffEmailBodyInput,
                        staffAddRepEmailEnabled: staffAddRepEmailEnabledInput,
                        staffAddRepEmailSubject: staffAddRepEmailSubjectInput,
                        staffAddRepEmailBody: staffAddRepEmailBodyInput,
                        // v369: 変更申請ワークフローメール
                        applicationReceiptEnabled: applicationReceiptEnabledInput,
                        applicationReceiptSubject: applicationReceiptSubjectInput,
                        applicationReceiptBody: applicationReceiptBodyInput,
                        approvalNotificationEnabled: approvalNotificationEnabledInput,
                        approvalNotificationSubject: approvalNotificationSubjectInput,
                        approvalNotificationBody: approvalNotificationBodyInput,
                        rejectionNotificationEnabled: rejectionNotificationEnabledInput,
                        rejectionNotificationSubject: rejectionNotificationSubjectInput,
                        rejectionNotificationBody: rejectionNotificationBodyInput,
                        // v376.43 (Phase B): 従来ハードコード6メールの件名/本文
                        trainingApplyReceiptSubject: trainingApplyReceiptSubjectInput,
                        trainingApplyReceiptBody: trainingApplyReceiptBodyInput,
                        trainingReminderSubject: trainingReminderSubjectInput,
                        trainingReminderBody: trainingReminderBodyInput,
                        authOtpSubject: authOtpSubjectInput,
                        authOtpBody: authOtpBodyInput,
                        memberUpdateConfirmSubject: memberUpdateConfirmSubjectInput,
                        memberUpdateConfirmBody: memberUpdateConfirmBodyInput,
                        withdrawalConfirmSubject: withdrawalConfirmSubjectInput,
                        withdrawalConfirmBody: withdrawalConfirmBodyInput,
                        passwordResetSubject: passwordResetSubjectInput,
                        passwordResetBody: passwordResetBodyInput,
                        // v371: メール送信 4 階層ガード
                        mailGlobalEnabled: mailGlobalEnabledInput,
                        mailDeliveryMode: mailDeliveryModeInput,
                        mailRedirectAllowlist: mailRedirectAllowlistInput,
                        trainingApplyReceiptEnabled: trainingApplyReceiptEnabledInput,
                        trainingReminderEnabled: trainingReminderEnabledInput,
                        bulkMailEnabled: bulkMailEnabledInput,
                        authOtpEnabled: authOtpEnabledInput,
                        memberUpdateConfirmEnabled: memberUpdateConfirmEnabledInput,
                        withdrawalConfirmEnabled: withdrawalConfirmEnabledInput,
                        passwordResetEnabled: passwordResetEnabledInput,
                      });
                      setDefaultBusinessStaffLimit(saved.defaultBusinessStaffLimit);
                      setGlobalLimitInput(String(saved.defaultBusinessStaffLimit));
                      setTrainingHistoryLookbackMonths(saved.trainingHistoryLookbackMonths);
                      setHistoryLookbackInput(String(saved.trainingHistoryLookbackMonths));
                      setAnnualFeePaymentGuidance(saved.annualFeePaymentGuidance);
                      setAnnualFeePaymentGuidanceInput(saved.annualFeePaymentGuidance);
                      setAnnualFeeTransferAccount(saved.annualFeeTransferAccount);
                      setAnnualFeeTransferAccountInput(saved.annualFeeTransferAccount);
                      applyMemberTypeAnnualFeesToInputs(saved.memberTypeAnnualFees);
                      setMembershipFeePublicVisibleInput(saved.membershipFeePublicVisible ?? true);
                      setMembershipFeeNoteInput(saved.membershipFeeNote ?? '');
                      const tdfSaved = saved.trainingDefaultFieldConfig ?? { ...DEFAULT_FIELD_CONFIG };
                      setTrainingDefaultFieldConfig(tdfSaved);
                      setTrainingDefaultFieldConfigInput(tdfSaved);
                      setBulkMailAutoAttachFolderIdInput(saved.bulkMailAutoAttachFolderId ?? '');
                      setEmailLogViewerRoleInput(saved.emailLogViewerRole ?? 'MASTER');
                      setCredentialEmailEnabledInput(saved.credentialEmailEnabled ?? true);
                      setCredentialEmailFromInput(saved.credentialEmailFrom ?? '');
                      setCredentialEmailSubjectInput(saved.credentialEmailSubject ?? CREDENTIAL_EMAIL_DEFAULT_SUBJECT);
                      setCredentialEmailBodyInput(saved.credentialEmailBody ?? CREDENTIAL_EMAIL_DEFAULT_BODY);
                      setPublicPortalTrainingMenuEnabledInput(saved.publicPortalTrainingMenuEnabled ?? true);
                      setPublicPortalMembershipMenuEnabledInput(saved.publicPortalMembershipMenuEnabled ?? true);
                      setPublicPortalHeroBadgeEnabledInput(saved.publicPortalHeroBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled);
                      setPublicPortalHeroBadgeLabelInput(saved.publicPortalHeroBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.heroBadgeLabel);
                      setPublicPortalHeroTitleInput(saved.publicPortalHeroTitle ?? PUBLIC_PORTAL_DEFAULTS.heroTitle);
                      setPublicPortalHeroDescriptionEnabledInput(saved.publicPortalHeroDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled);
                      setPublicPortalHeroDescriptionInput(saved.publicPortalHeroDescription ?? PUBLIC_PORTAL_DEFAULTS.heroDescription);
                      setPublicPortalMembershipBadgeEnabledInput(saved.publicPortalMembershipBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled);
                      setPublicPortalMembershipBadgeLabelInput(saved.publicPortalMembershipBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.membershipBadgeLabel);
                      setPublicPortalMembershipTitleEnabledInput(saved.publicPortalMembershipTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled);
                      setPublicPortalMembershipTitleInput(saved.publicPortalMembershipTitle ?? PUBLIC_PORTAL_DEFAULTS.membershipTitle);
                      setPublicPortalMembershipDescriptionEnabledInput(saved.publicPortalMembershipDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled);
                      setPublicPortalMembershipDescriptionInput(saved.publicPortalMembershipDescription ?? PUBLIC_PORTAL_DEFAULTS.membershipDescription);
                      setPublicPortalMembershipCtaLabelInput(saved.publicPortalMembershipCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.membershipCtaLabel);
                      setPublicPortalCompletionGuidanceVisibleInput(saved.publicPortalCompletionGuidanceVisible ?? PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible);
                      setPublicPortalCompletionGuidanceBodyWhenCredentialSentInput(saved.publicPortalCompletionGuidanceBodyWhenCredentialSent ?? PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialSent);
                      setPublicPortalCompletionGuidanceBodyWhenCredentialNotSentInput(saved.publicPortalCompletionGuidanceBodyWhenCredentialNotSent ?? PUBLIC_PORTAL_DEFAULTS.completionGuidanceBodyWhenCredentialNotSent);
                      setPublicPortalCompletionLoginInfoBlockVisibleInput(saved.publicPortalCompletionLoginInfoBlockVisible ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible);
                      setPublicPortalCompletionLoginInfoVisibleInput(saved.publicPortalCompletionLoginInfoVisible ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible);
                      setPublicPortalCompletionLoginInfoBodyWhenCredentialSentInput(saved.publicPortalCompletionLoginInfoBodyWhenCredentialSent ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialSent);
                      setPublicPortalCompletionLoginInfoBodyWhenCredentialNotSentInput(saved.publicPortalCompletionLoginInfoBodyWhenCredentialNotSent ?? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBodyWhenCredentialNotSent);
                      setPublicPortalCompletionNoCredentialNoticeInput(saved.publicPortalCompletionNoCredentialNotice ?? PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice);
                      setPublicPortalCompletionCredentialNoticeInput(saved.publicPortalCompletionCredentialNotice ?? PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice);
                      setPublicPortalTrainingBadgeEnabledInput(saved.publicPortalTrainingBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled);
                      setPublicPortalTrainingBadgeLabelInput(saved.publicPortalTrainingBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.trainingBadgeLabel);
                      setPublicPortalTrainingTitleEnabledInput(saved.publicPortalTrainingTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled);
                      setPublicPortalTrainingTitleInput(saved.publicPortalTrainingTitle ?? PUBLIC_PORTAL_DEFAULTS.trainingTitle);
                      setPublicPortalTrainingDescriptionEnabledInput(saved.publicPortalTrainingDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled);
                      setPublicPortalTrainingDescriptionInput(saved.publicPortalTrainingDescription ?? PUBLIC_PORTAL_DEFAULTS.trainingDescription);
                      setPublicPortalTrainingCtaLabelInput(saved.publicPortalTrainingCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.trainingCtaLabel);
                      setPublicPortalMemberUpdateMenuEnabledInput(saved.publicPortalMemberUpdateMenuEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled);
                      setPublicPortalMemberUpdateBadgeEnabledInput(saved.publicPortalMemberUpdateBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled);
                      setPublicPortalMemberUpdateBadgeLabelInput(saved.publicPortalMemberUpdateBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeLabel);
                      setPublicPortalMemberUpdateTitleEnabledInput(saved.publicPortalMemberUpdateTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled);
                      setPublicPortalMemberUpdateTitleInput(saved.publicPortalMemberUpdateTitle ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitle);
                      setPublicPortalMemberUpdateDescriptionEnabledInput(saved.publicPortalMemberUpdateDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled);
                      setPublicPortalMemberUpdateDescriptionInput(saved.publicPortalMemberUpdateDescription ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescription);
                      setPublicPortalMemberUpdateCtaLabelInput(saved.publicPortalMemberUpdateCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.memberUpdateCtaLabel);
                      setPublicPortalWithdrawalMenuEnabledInput(saved.publicPortalWithdrawalMenuEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled);
                      setPublicPortalWithdrawalBadgeEnabledInput(saved.publicPortalWithdrawalBadgeEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled);
                      setPublicPortalWithdrawalBadgeLabelInput(saved.publicPortalWithdrawalBadgeLabel ?? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeLabel);
                      setPublicPortalWithdrawalTitleEnabledInput(saved.publicPortalWithdrawalTitleEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled);
                      setPublicPortalWithdrawalTitleInput(saved.publicPortalWithdrawalTitle ?? PUBLIC_PORTAL_DEFAULTS.withdrawalTitle);
                      setPublicPortalWithdrawalDescriptionEnabledInput(saved.publicPortalWithdrawalDescriptionEnabled ?? PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled);
                      setPublicPortalWithdrawalDescriptionInput(saved.publicPortalWithdrawalDescription ?? PUBLIC_PORTAL_DEFAULTS.withdrawalDescription);
                      setPublicPortalWithdrawalCtaLabelInput(saved.publicPortalWithdrawalCtaLabel ?? PUBLIC_PORTAL_DEFAULTS.withdrawalCtaLabel);
                      // v371: メール送信 4 階層ガード
                      setMailGlobalEnabledInput(saved.mailGlobalEnabled ?? false);
                      setMailDeliveryModeInput((saved.mailDeliveryMode as 'LIVE' | 'REDIRECT' | 'SUPPRESS') ?? 'LIVE');
                      setMailRedirectAllowlistInput(saved.mailRedirectAllowlist ?? '');
                      setTrainingApplyReceiptEnabledInput(saved.trainingApplyReceiptEnabled ?? true);
                      setTrainingReminderEnabledInput(saved.trainingReminderEnabled ?? true);
                      setBulkMailEnabledInput(saved.bulkMailEnabled ?? true);
                      setAuthOtpEnabledInput(saved.authOtpEnabled ?? true);
                      setMemberUpdateConfirmEnabledInput(saved.memberUpdateConfirmEnabled ?? true);
                      setWithdrawalConfirmEnabledInput(saved.withdrawalConfirmEnabled ?? true);
                      setPasswordResetEnabledInput(saved.passwordResetEnabled ?? true);
                      setSettingsIsDirty(false);
                      alert('設定を保存しました。');
                    } catch (e) {
                      alert(e instanceof Error ? e.message : '設定の保存に失敗しました。');
                    } finally {
                      setSettingsBusy(false);
                    }
                  }}
                  className="px-8 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold text-base disabled:opacity-50 transition-colors shadow-sm"
                >{settingsBusy ? '保存中...' : settingsIsDirty ? '設定を保存' : '変更なし'}</button>
              </div>
            </div>
          </div>
        </div>{/* /右コンテンツ */}
      </div>{/* /2カラム */}
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
      return <AnnualFeeManagement onChanged={refreshAllData} onDirtyChange={setAnnualFeeHasUnsavedChanges} onOpenMember={(memberId) => { void openMemberDetail(memberId); }} adminPermissionLevel={adminPermissionLevel} />;
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
      return <TrainingManagement trainings={trainings} onSave={handleTrainingSave} onDelete={handleTrainingDelete} onRestore={handleTrainingRestore} defaultFieldConfig={trainingDefaultFieldConfig} />;
    }

    if (currentView === 'bulk-mail') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      const bulkMailSettings = {
        defaultBusinessStaffLimit: defaultBusinessStaffLimit,
        trainingHistoryLookbackMonths: trainingHistoryLookbackMonths,
        annualFeePaymentGuidance: annualFeePaymentGuidance,
        annualFeeTransferAccount: annualFeeTransferAccount,
        bulkMailAutoAttachFolderId: bulkMailAutoAttachFolderIdInput,
        emailLogViewerRole: emailLogViewerRoleInput,
        // v376.53.2: REDIRECT/停止 警告バナー用（v376.53.1 で settings に含め漏れ → バナー不点灯バグ）。
        // loadSystemSettings 時に保存値で初期化される state を渡す（bulk-mail 画面では編集されない）
        mailGlobalEnabled: mailGlobalEnabledInput,
        mailDeliveryMode: mailDeliveryModeInput,
        mailRedirectAllowlist: mailRedirectAllowlistInput,
      };
      return (
        <BulkMailSender
          api={api}
          settings={bulkMailSettings}
          adminPermissionLevel={adminPermissionLevel}
          onOpenMailSettings={() => handleViewChange('admin-settings')}
        />
      );
    }

    if (currentView === 'roster-export') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      // v372 S1: 新 Visual Designer 採用。旧 RosterExport は S5 で削除予定（コード保持）。
      return <RosterDesigner api={api} />;
    }

    // v373.6 (S5): roster-export-legacy view 撤去（旧 RosterExport 削除に伴う）

    if (currentView === 'mailing-list-export') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return <MailingListExport api={api} />;
    }

    // v374.1: 公式LINE投稿依頼
    if (currentView === 'line-post') {
      // v376.45: メニュー単位 RBAC に整合（isMaster or allowedMenus に line-post / legacy MASTER・ADMIN）
      const lineAllowed = effectiveRbac
        ? canUseLinePost(effectiveRbac)
        : ['MASTER', 'ADMIN'].includes(adminPermissionLevel || '');
      if (userRole !== 'ADMIN' || !lineAllowed) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      const canManageLine = effectiveRbac
        ? canManageLinePost(effectiveRbac)
        : ['MASTER', 'ADMIN'].includes(adminPermissionLevel || '');
      return <LinePostConsole api={api} trainings={trainings} canManage={canManageLine} />;
    }

    if (currentView === 'officer-management') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return <OfficerManagement api={api} />;
    }

    if (currentView === 'payment-history') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return <PaymentHistoryConsole api={api} />;
    }

    if (currentView === 'claim-management') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return (
        <ClaimManagementConsole
          api={api}
          onOpenPaymentConsole={() => setCurrentView('payment-history')}
        />
      );
    }

    if (currentView === 'member-delete') {
      if (userRole !== 'ADMIN' || adminPermissionLevel !== 'MASTER') {
        return <div className="text-red-500 p-4">この機能はMASTER権限専用です。</div>;
      }
      return <MemberDeleteConsole />;
    }

    // v376.68: 汎用データエクスポート（CSV）。既定は MASTER のみで、
    // 事務局へ渡す場合は MASTER が 権限管理 から data-export メニューを付与する。
    if (currentView === 'data-export') {
      if (userRole !== 'ADMIN' || !isViewAllowed('data-export')) {
        return <div className="text-red-500 p-4">この機能を利用する権限がありません。</div>;
      }
      return <DataExportConsole />;
    }

    if (currentView === 'change-requests') {
      if (userRole !== 'ADMIN') {
        return <div className="text-red-500 p-4">この機能は管理者専用です。</div>;
      }
      return <ChangeRequestConsole />;
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
          onRefresh={refreshAllData}
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
        loginId={authenticatedContext?.memberPortalLoginId || memberLoginId}
        isAdmin={userRole === 'ADMIN'}
        defaultBusinessStaffLimit={defaultBusinessStaffLimit}
        historyLookbackMonths={trainingHistoryLookbackMonths}
        annualFeePaymentGuidance={annualFeePaymentGuidance}
        annualFeeTransferAccount={annualFeeTransferAccount}
        trainings={trainings}
        onSave={handleMemberSave}
        onLogout={logout}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans">
      {/* docs/246 View-as-role: MASTER 本人のみ表示（プレビュー中も実 isMaster を見るので退出可能） */}
      {isAuthenticated && isAdminShell && userRole === 'ADMIN' && !!adminSessionRbac?.isMaster && (
        <RolePreviewBar
          roles={previewRoles}
          loading={previewRolesLoading}
          previewRoleId={previewRoleId}
          onRequestRoles={loadPreviewRoles}
          onSelectRole={handleSelectPreviewRole}
          menuRegistryCount={previewMenuRegistry?.length}
        />
      )}
      <div className="flex flex-1 min-h-0 overflow-hidden">
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
          showMemberPages={!isAdminShell}
          adminPermissionLevel={adminPermissionLevel}
          isMaster={effectiveRbac?.isMaster}
          allowedMenus={effectiveRbac?.allowedMenus}
          roleName={effectiveRbac?.roleName}
          pendingChangeRequestCount={pendingChangeRequestCount}
          onLogout={handleLogoutClick}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}
      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto relative overscroll-contain">
        {/* Mobile hamburger — only shown when authenticated and sidebar is closed */}
        {isAuthenticated && (
          <button
            type="button"
            aria-label="メニューを開く"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden mb-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="ml-2 text-sm font-medium">メニュー</span>
          </button>
        )}
        {/* v319: パンくずリスト（管理者ビューのみ） */}
        {isAuthenticated && userRole === 'ADMIN' && BREADCRUMB_MAP[currentView] && (
          <nav aria-label="パンくず" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span>{BREADCRUMB_MAP[currentView].group}</span>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-600">{BREADCRUMB_MAP[currentView].label}</span>
          </nav>
        )}
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
        {/* v363.2: 会員詳細モーダル（新タブ方式は GAS DOMAIN 認証で動かないため dialog 方式に変更） */}
        {memberDetailModalOpen && (() => {
          const targetMember = selectedMemberForDetailId
            ? (members.find(m => m.id === selectedMemberForDetailId) || selectedMemberForDetailSnapshot)
            : null;
          if (!targetMember) {
            return (
              <div
                className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
                onClick={closeMemberDetailModal}
              >
                <div className="bg-white rounded-xl p-6 max-w-md text-red-600" onClick={(e) => e.stopPropagation()}>
                  会員データが見つかりません。
                  <button onClick={closeMemberDetailModal} className="ml-4 px-3 py-1 border rounded">閉じる</button>
                </div>
              </div>
            );
          }
          return (
            <div
              className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
              onClick={closeMemberDetailModal}
              role="dialog"
              aria-modal="true"
              aria-label={`${(targetMember.lastName || '') + (targetMember.firstName || '') || targetMember.officeName || '会員'} の詳細`}
            >
              <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                    会員詳細 — {(targetMember.lastName || '') + (targetMember.firstName || '') || targetMember.officeName || '(未設定)'}
                  </h2>
                  <button
                    type="button"
                    onClick={closeMemberDetailModal}
                    aria-label="閉じる"
                    className="ml-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 sm:p-6">
                  <MemberDetailAdmin
                    member={targetMember}
                    businessMembers={adminMemberRows.filter(r => r.memberType === MemberType.BUSINESS)}
                    individualMembers={adminMemberRows.filter(r => r.memberType !== MemberType.BUSINESS)}
                    onBack={closeMemberDetailModal}
                    onSaved={(updatedMember) => {
                      if (updatedMember) {
                        setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
                        setSelectedMemberForDetailSnapshot(updatedMember);
                      }
                      loadAdminDashboardData({ force: true }).catch(() => undefined);
                      loadAppData({ force: true, silent: true }).catch(() => undefined);
                    }}
                    onOpenStaffDetail={(mId, sId) => {
                      setStaffSaveToast(null);
                      setSelectedMemberForDetailId(mId);
                      setSelectedMemberForDetailSnapshot(members.find((member) => member.id === mId) || null);
                      setSelectedStaffForDetail({ memberId: mId, staffId: sId });
                      setMemberDetailModalOpen(false);
                      setCurrentView('staff-detail');
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
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
    </div>
  );
};

export default App;
