import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MemberBatchEditor from './MemberBatchEditor';
import MemberForm from './components/MemberForm';
import TrainingManagement from './components/TrainingManagement';
import TrainingApply from './components/TrainingApply';
import AnnualFeeManagement from './components/AnnualFeeManagement';
import BulkMailSender from './components/BulkMailSender';
import RosterExport from './components/RosterExport';
import MailingListExport from './components/MailingListExport';
import TemplateHelpPage from './components/TemplateHelpPage';
import TemplateValidationPanel from './components/TemplateValidationPanel';
import MemberDeleteConsole from './components/MemberDeleteConsole';
import ChangeRequestConsole from './components/ChangeRequestConsole';
import MemberDetailAdmin from './components/MemberDetailAdmin';
import StaffDetailAdmin from './components/StaffDetailAdmin';
import { AdminDashboardData, AdminDashboardMemberRow, AdminPermissionData, AdminPermissionEntry, AdminPermissionLevel, Member, MemberType, SystemSettings, Training, TrainingFieldConfig, DEFAULT_FIELD_CONFIG } from './types';
import { TRAINING_OPTIONAL_FIELD_DEFS } from './components/TrainingManagement';
import { api, type AdminLoginResult, type MemberLoginResult, type MemberPortalLookup } from './services/api';
import { EmailCard, MasterOffBanner, MergeTags, ToggleSwitch } from './components/EmailSettingsCard';

type Role = 'ADMIN' | 'MEMBER';
type View = 'profile' | 'training-apply' | 'admin' | 'annual-fee-manage' | 'training-manage' | 'bulk-mail' | 'roster-export' | 'mailing-list-export' | 'template-help' | 'member-detail' | 'staff-detail' | 'system-permissions' | 'admin-settings' | 'member-delete' | 'change-requests';
type AuthTab = 'member' | 'admin';
type PendingAnnualFeeAction = { type: 'view'; view: View } | { type: 'logout' } | null;
type MemberListFilter = 'ALL' | MemberType;
type MemberStatusFilter = 'ALL' | 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN';
type MemberSortKey = 'memberId' | 'displayName' | 'memberType' | 'trainingCount' | 'tenure' | 'status';
type MemberSortDir = 'asc' | 'desc';
type DisplayMemberStatus = Exclude<MemberStatusFilter, 'ALL'>;
type AppShellMode = 'integrated' | 'member' | 'admin';
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

const getMemberStatusAtFiscalYear = (
  member: AdminDashboardMemberRow,
  fiscalYear: number | null,
  currentFiscalYear: number,
): DisplayMemberStatus | null => {
  if (fiscalYear === null) return member.status;

  const joined = parseDateString(member.joinedDate);
  // joinedDate が空の会員はデータ不備扱いにせず在籍扱いとする（宛名リストとの整合）
  const { start, end } = getFiscalYearBounds(fiscalYear);
  if (joined && joined > end) return null;

  const withdrawn = parseDateString(member.withdrawnDate);
  if (withdrawn) {
    if (withdrawn < start) return null;
    if (withdrawn <= end) return 'WITHDRAWN';
  }

  if (member.status === 'WITHDRAWAL_SCHEDULED' && fiscalYear >= currentFiscalYear) {
    return 'WITHDRAWAL_SCHEDULED';
  }

  if (member.status === 'WITHDRAWN' && !withdrawn) {
    return 'WITHDRAWN';
  }

  return 'ACTIVE';
};

const getStaffStatusAtFiscalYear = (
  staff: NonNullable<Member['staff']>[number],
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

const isActiveMemberIdentity = (member: Member): boolean => member.status !== 'WITHDRAWN';

const isActiveStaffIdentity = (staff: NonNullable<Member['staff']>[number]): boolean => staff.status !== 'LEFT';

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
        label: `${member.type === MemberType.SUPPORT ? '賛助会員' : '個人会員'}: ${member.lastName} ${member.firstName}`,
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
  trainingBadgeLabel: 'TRAINING',
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
  const [authTab, setAuthTab] = useState<AuthTab>(defaultAuthTab);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [memberLoginId, setMemberLoginId] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  // 管理者 shell 自動認証: ページロード時にセッション確認を自動実行
  const [adminAutoAuthDone, setAdminAutoAuthDone] = useState(false);
  const [adminAutoAuthFailed, setAdminAutoAuthFailed] = useState(false);
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
  const [trainingDefaultFieldConfig, setTrainingDefaultFieldConfig] = useState<TrainingFieldConfig>({ ...DEFAULT_FIELD_CONFIG });
  const [trainingDefaultFieldConfigInput, setTrainingDefaultFieldConfigInput] = useState<TrainingFieldConfig>({ ...DEFAULT_FIELD_CONFIG });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsIsDirty, setSettingsIsDirty] = useState(false);
  // v194: PDF名簿出力 & 一括メール送信設定
  const [rosterTemplateSsIdInput, setRosterTemplateSsIdInput] = useState('');
  const [reminderTemplateSsIdInput, setReminderTemplateSsIdInput] = useState('');
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
  const [bizStaffEmailEnabledInput, setBizStaffEmailEnabledInput] = useState(true);
  const [bizStaffEmailSubjectInput, setBizStaffEmailSubjectInput] = useState(BIZ_STAFF_SUBJECT_DEFAULT);
  const [bizStaffEmailBodyInput, setBizStaffEmailBodyInput] = useState('');
  const [staffAddStaffEmailEnabledInput, setStaffAddStaffEmailEnabledInput] = useState(true);
  const [staffAddStaffEmailSubjectInput, setStaffAddStaffEmailSubjectInput] = useState(STAFF_ADD_STAFF_SUBJECT_DEFAULT);
  const [staffAddStaffEmailBodyInput, setStaffAddStaffEmailBodyInput] = useState('');
  const [staffAddRepEmailEnabledInput, setStaffAddRepEmailEnabledInput] = useState(true);
  const [staffAddRepEmailSubjectInput, setStaffAddRepEmailSubjectInput] = useState(STAFF_ADD_REP_SUBJECT_DEFAULT);
  const [staffAddRepEmailBodyInput, setStaffAddRepEmailBodyInput] = useState('');
  const [memberListQuery, setMemberListQuery] = useState('');
  const [memberListFilter, setMemberListFilter] = useState<MemberListFilter>('ALL');
  const [memberListStatusFilter, setMemberListStatusFilter] = useState<MemberStatusFilter>(DEFAULT_MEMBER_STATUS_FILTER);
  const [memberListFiscalYearFilter, setMemberListFiscalYearFilter] = useState<string>(DEFAULT_MEMBER_FISCAL_YEAR_FILTER);
  const [memberListPage, setMemberListPage] = useState(1);
  const [memberListPageSize, setMemberListPageSize] = useState(DEFAULT_MEMBER_PAGE_SIZE);
  const [memberSortKey, setMemberSortKey] = useState<MemberSortKey>('displayName');
  const [memberSortDir, setMemberSortDir] = useState<MemberSortDir>('asc');
  const [selectedMemberForDetailId, setSelectedMemberForDetailId] = useState<string | null>(null);
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<{ memberId: string; staffId: string } | null>(null);
  const [staffSaveToast, setStaffSaveToast] = useState<string | null>(null);
  const [withdrawingMemberId, setWithdrawingMemberId] = useState<string | null>(null);

  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('');
  const [authenticatedContext, setAuthenticatedContext] = useState<AuthenticatedContext | null>(null);

  const applySystemSettings = (systemSettings: SystemSettings) => {
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
    const tdfConfig = systemSettings.trainingDefaultFieldConfig ?? { ...DEFAULT_FIELD_CONFIG };
    setTrainingDefaultFieldConfig(tdfConfig);
    setTrainingDefaultFieldConfigInput(tdfConfig);
    // v194
    setRosterTemplateSsIdInput(systemSettings.rosterTemplateSsId ?? '');
    setReminderTemplateSsIdInput(systemSettings.reminderTemplateSsId ?? '');
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
    setBizStaffEmailEnabledInput(systemSettings.bizStaffEmailEnabled ?? true);
    setBizStaffEmailSubjectInput(systemSettings.bizStaffEmailSubject ?? BIZ_STAFF_SUBJECT_DEFAULT);
    setBizStaffEmailBodyInput(systemSettings.bizStaffEmailBody ?? '');
    setStaffAddStaffEmailEnabledInput(systemSettings.staffAddStaffEmailEnabled ?? true);
    setStaffAddStaffEmailSubjectInput(systemSettings.staffAddStaffEmailSubject ?? STAFF_ADD_STAFF_SUBJECT_DEFAULT);
    setStaffAddStaffEmailBodyInput(systemSettings.staffAddStaffEmailBody ?? '');
    setStaffAddRepEmailEnabledInput(systemSettings.staffAddRepEmailEnabled ?? true);
    setStaffAddRepEmailSubjectInput(systemSettings.staffAddRepEmailSubject ?? STAFF_ADD_REP_SUBJECT_DEFAULT);
    setStaffAddRepEmailBodyInput(systemSettings.staffAddRepEmailBody ?? '');
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
    if (portalLookup && memberPortalLoaded) {
      tasks.push(loadMemberPortalData(portalLookup, { force: true }));
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

    if (currentView === 'annual-fee-manage' || currentView === 'member-detail' || currentView === 'staff-detail') {
      return;
    }

    if (userRole === 'ADMIN' && (currentView === 'admin-settings' || currentView === 'bulk-mail' || currentView === 'roster-export' || currentView === 'mailing-list-export')) {
      loadSystemSettings(false).catch(() => undefined);
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
  const currentFiscalYear = adminDashboardData?.currentFiscalYear ?? getFiscalYearForDate(new Date());
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
    const normalizedQuery = memberListQuery.trim().toLowerCase();
    return adminMemberRows.filter((member) => {
      if (memberListFilter !== 'ALL' && member.memberType !== memberListFilter) return false;
      const displayStatus = getMemberStatusAtFiscalYear(member, selectedFiscalYear, currentFiscalYear);
      if (selectedFiscalYear !== null && !displayStatus) return false;
      if (memberListStatusFilter !== 'ALL' && displayStatus !== memberListStatusFilter) return false;
      if (!normalizedQuery) return true;
      return [member.memberId, member.displayName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [adminMemberRows, currentFiscalYear, memberListFilter, memberListQuery, memberListStatusFilter, selectedFiscalYear]);

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

  const openMemberDetail = async (memberId: string) => {
    try {
      // B-05: fullDataLoaded かつ members state に対象が存在する場合は再取得しない
      // （React state は次レンダーまで反映されないため、state 参照は同期的に行う）
      if (fullDataLoaded && members.find(m => m.id === memberId)) {
        setSelectedMemberForDetailId(memberId);
        setCurrentView('member-detail');
        return;
      }
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
      label = currentIdentity.staffRole === 'REPRESENTATIVE' ? '事業所会員（代表者）' : currentIdentity.staffRole === 'ADMIN' ? '事業所会員（管理者）' : '事業所会員（メンバー）';
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
    ctx: Pick<MemberLoginResult | AdminLoginResult, 'authMethod' | 'memberId' | 'staffId' | 'loginId' | 'canAccessAdminPage'> & { adminPermissionLevel?: AdminPermissionLevel; sessionToken?: string },
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
        if (permLevel === 'GENERAL' || !auth.canAccessAdminPage) {
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
      } catch {
        if (!cancelled) setAdminAutoAuthFailed(true);
      } finally {
        if (!cancelled) setAdminAutoAuthDone(true);
      }
    };
    attemptAutoAuth();
    return () => { cancelled = true; };
  }, [isAdminShell]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // v150: 会員ログイン（統合API: 認証+ポータルデータを1回のround-tripで取得）
  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthBusy(true);
      setAuthError(null);
      const { auth, portal } = await api.memberLoginWithData(memberLoginId.trim(), memberPassword);
      setMembers(portal.members);
      setTrainings(portal.trainings);
      setMemberPortalLoaded(true);
      applyAuthContext(auth, portal.members);
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
                <td className="px-4 py-3 text-sm">{(() => {
                  const displayStatus = getDisplayMemberStatus(member) || member.status;
                  return displayStatus === 'WITHDRAWN'
                    ? <span className="text-red-500">退会済</span>
                    : displayStatus === 'WITHDRAWAL_SCHEDULED'
                      ? <span className="text-amber-600">退会予定</span>
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
      const loginTitle = isAdminShell ? 'Admin Login' : isMemberShell ? 'Member Login' : 'Login';
      const loginDescription = isAdminShell
        ? 'Admin uses Google sign-in only.'
        : isMemberShell
        ? 'Member uses login ID and password only.'
        : 'Member uses login ID/password. Admin uses Google sign-in only.';
      const showMemberAuth = !isAdminShell;
      const showAdminAuth = !isMemberShell;
      return (
        <div className="max-w-lg mx-auto mt-20 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">ログイン</h1>
          <p className="text-sm text-slate-600 mb-5">会員はログインID/パスワード、管理者のみGoogle認証を使用します。</p>
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

            {showMemberAuth && authTab === 'member' ? (
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
            setCurrentView('admin');
          }}
          onSaved={(updatedMember) => {
            if (updatedMember) {
              setMembers((prev) => prev.map((member) => (member.id === updatedMember.id ? updatedMember : member)));
            }
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

    if (currentView === 'template-help') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理コンソールへのアクセス権限がありません。</div>;
      }
      return (
        <TemplateHelpPage
          onBack={() => setCurrentView('roster-export')}
          onOpenSettings={() => setCurrentView('admin-settings')}
        />
      );
    }

    if (currentView === 'admin-settings') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return (
        <div className="space-y-6 pb-24">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-sky-700">System Settings</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">設定</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  利用頻度の高い設定を上位に、運用担当者しか触らない設定を下位に整理しています。関連項目はセクション単位でまとめ、長文編集やテンプレート管理は折りたたんで扱える構成にしています。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">保存状態</p>
                  <p className={`mt-1 text-sm font-semibold ${settingsIsDirty ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {settingsIsDirty ? '未保存の変更あり' : '保存済み'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">設定読込</p>
                  <p className={`mt-1 text-sm font-semibold ${systemSettingsLoaded ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {systemSettingsLoaded ? '読み込み済み' : '読み込み中'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500">会員個別上限</p>
                  <p className={`mt-1 text-sm font-semibold ${fullDataLoaded ? 'text-slate-900' : 'text-slate-500'}`}>
                    {fullDataLoaded ? '編集可能' : '未読込'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ['settings-core', '基本設定'],
                ['settings-mail-assets', '帳票・一括メール'],
                ['settings-portal', '公開ポータル'],
                ['settings-membership-mail', '入会通知メール'],
                ['settings-business-limits', '事業所個別上限'],
              ].map(([target, label]) => (
                <a
                  key={target}
                  href={`#${target}`}
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {!systemSettingsLoaded && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              システム設定を読み込み中です...
            </div>
          )}

          <AdminSettingsSection
            id="settings-core"
            title="基本設定"
            description="日常運用で使う共通値です。全体上限、研修履歴の表示期間、研修フォームの既定項目をここで管理します。"
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
          </AdminSettingsSection>

          <AdminSettingsSection
            id="settings-mail-assets"
            title="帳票・一括メール"
            description="名簿出力、一括メール、自動添付に使う外部リソースや閲覧権限を管理します。頻度は低めですが、誤設定の影響が大きい領域です。"
            badge="管理者向け"
          >
            {/* v194: PDF名簿出力 & 一括メール送信設定 */}
            <TemplateValidationPanel
              api={api}
              rosterTemplateSsId={rosterTemplateSsIdInput}
              reminderTemplateSsId={reminderTemplateSsIdInput}
              onRosterTemplateChange={(v) => { setRosterTemplateSsIdInput(v); setSettingsIsDirty(true); }}
              onReminderTemplateChange={(v) => { setReminderTemplateSsIdInput(v); setSettingsIsDirty(true); }}
              onOpenHelp={() => setCurrentView('template-help')}
            />
            <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-slate-800">名簿出力・一括メール送信設定</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">名簿テンプレートスプレッドシートID</label>
                <input
                  type="text"
                  value={rosterTemplateSsIdInput}
                  onChange={(e) => { setRosterTemplateSsIdInput(e.target.value); setSettingsIsDirty(true); }}
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-sm"
                  placeholder="スプレッドシートID（URLの /d/〜/edit の部分）"
                />
                <p className="mt-1 text-xs text-slate-500">PDF名簿出力で使用するテンプレートSSのIDを入力してください。</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">一括メール 個別自動添付フォルダID</label>
                <input
                  type="text"
                  value={reminderTemplateSsIdInput}
                  onChange={(e) => { setReminderTemplateSsIdInput(e.target.value); setSettingsIsDirty(true); }}
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-sm"
                  placeholder="スプレッドシートID（名簿と同じIDでも可）"
                />
                <p className="mt-1 text-xs text-slate-500">未納者向け催促用紙で使用するテンプレートSSのIDです。同じブックを使う場合は名簿と同じIDを設定できます。</p>
              </div>
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
          </AdminSettingsSection>

          <AdminSettingsSection
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
                    <span className="inline-flex rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">TRAINING</span>
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
                      <input type="text" value={publicPortalTrainingBadgeLabelInput} onChange={(e) => { setPublicPortalTrainingBadgeLabelInput(e.target.value); setSettingsIsDirty(true); }} className="w-full border border-slate-300 rounded px-3 py-2" placeholder="例: TRAINING" />
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

          </AdminSettingsSection>

          {/* v266: 入会・登録メール設定（全5種統合・再設計） */}
          <AdminSettingsSection
            id="settings-all-email"
            title="入会・登録メール設定"
            description="全体マスタースイッチで一括停止、その下で種別ごとに ON/OFF・件名・本文を個別設定します。事業所会員と個人・賛助会員でテンプレートを使い分けできます。"
            badge="メール設定"
            defaultOpen
          >
            {/* EmailCard / ToggleSwitch / MasterOffBanner / MergeTags は
                EmailSettingsCard.tsx に定義。App 内 IIFE での定義は
                毎レンダーで新型が生成されフォーカスが失われるため禁止。 */}
            <div className="space-y-6">
                {/* ─── 全体マスタースイッチ ─── */}
                <div className="rounded-xl border-2 border-slate-300 bg-white p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">全体マスタースイッチ</p>
                  <p className="text-xs text-slate-500">OFF にすると以下の全メール設定に関わらず、すべての入会・登録メールが停止されます。</p>
                  <ToggleSwitch color="emerald"
                    enabled={credentialEmailEnabledInput}
                    onToggle={() => { setCredentialEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    onLabel="入会・登録メールを送信する（ON）"
                    offLabel="全メール停止中（OFF）— 準備が整ったら ON へ戻してください" />
                  {!credentialEmailEnabledInput && (
                    <p className="text-xs text-red-600">現在 OFF です。全ての入会・登録メールが送信されません。</p>
                  )}
                </div>

                {/* ─── 送信元アドレス（共通） ─── */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">送信元アドレス（全メール共通）</p>
                    <button type="button" onClick={() => { void loadCredentialEmailAliases(); }}
                      disabled={credentialEmailAliasLoading}
                      className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                      {credentialEmailAliasLoading ? '読込中...' : '更新'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Gmail「Send mail as」に登録済みのアドレスから選択します。</p>
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
                  <MergeTags items={[['{{氏名}}','氏名'],['{{ログインID}}','ログインID'],['{{パスワード}}','初期パスワード'],['{{会員マイページURL}}','マイページURL'],['{{会員種別}}','個人会員など'],['{{年会費}}','3,000円など']]} />
                  <EmailCard badge="個人・賛助会員" title="個人会員・賛助会員向け"
                    enabled={indSuppEmailEnabledInput}
                    onToggle={() => { setIndSuppEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={credentialEmailSubjectInput}
                    onSubjectChange={v => { setCredentialEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={CREDENTIAL_EMAIL_DEFAULT_SUBJECT}
                    body={credentialEmailBodyInput}
                    onBodyChange={v => { setCredentialEmailBodyInput(v); setSettingsIsDirty(true); }}
                    extra={
                      <div className="mt-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700">テンプレート管理</span>
                          <button type="button"
                            className="text-xs px-2 py-1 rounded bg-primary-50 border border-primary-300 text-primary-700 hover:bg-primary-100"
                            onClick={() => { setShowTemplateSaveForm(f => !f); setTemplateSaveNameInput(''); }}>
                            ＋ 現在の内容を保存
                          </button>
                        </div>
                        {showTemplateSaveForm && (
                          <div className="flex gap-2 mb-2">
                            <input type="text" value={templateSaveNameInput} onChange={e => setTemplateSaveNameInput(e.target.value)}
                              placeholder="テンプレート名" className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs" maxLength={50} />
                            <button type="button" disabled={templateSaving || !templateSaveNameInput.trim()}
                              className="px-3 py-1 text-xs rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                              onClick={async () => {
                                if (!templateSaveNameInput.trim()) return;
                                setTemplateSaving(true);
                                try {
                                  const saved = await api.saveCredentialEmailTemplate({ name: templateSaveNameInput.trim(), subject: credentialEmailSubjectInput, body: credentialEmailBodyInput });
                                  setEmailTemplates(prev => { const idx = prev.findIndex(t => t.id === saved.id); return idx >= 0 ? prev.map(t => t.id === saved.id ? saved : t) : [...prev, saved]; });
                                  setShowTemplateSaveForm(false); setTemplateSaveNameInput('');
                                } catch { alert('保存に失敗しました'); } finally { setTemplateSaving(false); }
                              }}>{templateSaving ? '保存中…' : '保存'}</button>
                            <button type="button" className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500"
                              onClick={() => { setShowTemplateSaveForm(false); setTemplateSaveNameInput(''); }}>キャンセル</button>
                          </div>
                        )}
                        {emailTemplates.length === 0 ? <p className="text-xs text-slate-400">保存済みテンプレートはありません</p> : (
                          <ul className="space-y-1">
                            {emailTemplates.map(t => (
                              <li key={t.id} className="flex items-center gap-2 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white">
                                <span className="flex-1 font-medium text-slate-700 truncate">{t.name}</span>
                                <span className="text-slate-400 shrink-0">{t.savedAt.slice(0, 10)}</span>
                                <button type="button" className="px-2 py-0.5 rounded border border-primary-300 text-primary-700 hover:bg-primary-50"
                                  onClick={() => { if (!window.confirm(`「${t.name}」を読み込みますか？`)) return; setCredentialEmailSubjectInput(t.subject); setCredentialEmailBodyInput(t.body); setSettingsIsDirty(true); }}>読み込む</button>
                                <button type="button" disabled={templateDeleting === t.id}
                                  className="px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  onClick={async () => { if (!window.confirm(`「${t.name}」を削除しますか？`)) return; setTemplateDeleting(t.id); try { await api.deleteCredentialEmailTemplate(t.id); setEmailTemplates(prev => prev.filter(x => x.id !== t.id)); } catch { alert('削除に失敗しました'); } finally { setTemplateDeleting(null); } }}
                                >{templateDeleting === t.id ? '…' : '削除'}</button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex justify-end mt-1">
                          <button type="button" onClick={() => { setCredentialEmailBodyInput(CREDENTIAL_EMAIL_DEFAULT_BODY); setSettingsIsDirty(true); }}
                            className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-50">デフォルトに戻す</button>
                        </div>
                      </div>
                    } />

                  {/* 事業所 代表者 */}
                  <MergeTags items={[['{{氏名}}','氏名'],['{{ログインID}}','ログインID'],['{{パスワード}}','初期パスワード'],['{{会員マイページURL}}','マイページURL'],['{{事業所名}}','事業所名']]} />
                  <EmailCard badge="事業所・代表者" title="事業所会員 代表者向け"
                    enabled={bizRepEmailEnabledInput}
                    onToggle={() => { setBizRepEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={bizRepEmailSubjectInput}
                    onSubjectChange={v => { setBizRepEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={BIZ_REP_SUBJECT_DEFAULT}
                    body={bizRepEmailBodyInput}
                    onBodyChange={v => { setBizRepEmailBodyInput(v); setSettingsIsDirty(true); }} />
                  <EmailCard badge="事業所・メンバー" title="事業所会員 メンバー（代表者以外）向け"
                    enabled={bizStaffEmailEnabledInput}
                    onToggle={() => { setBizStaffEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={bizStaffEmailSubjectInput}
                    onSubjectChange={v => { setBizStaffEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={BIZ_STAFF_SUBJECT_DEFAULT}
                    body={bizStaffEmailBodyInput}
                    onBodyChange={v => { setBizStaffEmailBodyInput(v); setSettingsIsDirty(true); }} />
                </div>

                {/* ─── 職員追加承認時のメール ─── */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">▍職員追加申請 承認時のメール</h4>
                  <MergeTags items={[['{{氏名}}','氏名'],['{{ログインID}}','ログインID'],['{{パスワード}}','初期パスワード'],['{{会員マイページURL}}','マイページURL'],['{{事業所名}}','事業所名'],['{{追加職員氏名}}','追加職員名（代表者通知用）']]} />
                  <EmailCard badge="追加職員" title="追加された職員へのメール"
                    enabled={staffAddStaffEmailEnabledInput}
                    onToggle={() => { setStaffAddStaffEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={staffAddStaffEmailSubjectInput}
                    onSubjectChange={v => { setStaffAddStaffEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={STAFF_ADD_STAFF_SUBJECT_DEFAULT}
                    body={staffAddStaffEmailBodyInput}
                    onBodyChange={v => { setStaffAddStaffEmailBodyInput(v); setSettingsIsDirty(true); }} />
                  <EmailCard badge="代表者通知" title="事業所代表者への追加通知メール"
                    enabled={staffAddRepEmailEnabledInput}
                    onToggle={() => { setStaffAddRepEmailEnabledInput(v => !v); setSettingsIsDirty(true); }}
                    subject={staffAddRepEmailSubjectInput}
                    onSubjectChange={v => { setStaffAddRepEmailSubjectInput(v); setSettingsIsDirty(true); }}
                    defaultSubject={STAFF_ADD_REP_SUBJECT_DEFAULT}
                    body={staffAddRepEmailBodyInput}
                    onBodyChange={v => { setStaffAddRepEmailBodyInput(v); setSettingsIsDirty(true); }} />
                </div>
              </div>
          </AdminSettingsSection>

          {/* 入会完了画面の文言設定（メール設定から分離） */}
          <AdminSettingsSection
            id="settings-portal-completion"
            title="入会完了画面の文言設定"
            description="公開ポータルで入会申込完了後に表示される「今後のご案内」とログイン情報カードの文言を設定します。メール送信設定とは独立しています。"
            badge="完了画面"
          >
            <div className="space-y-4">
              <div>
                {/* ① 入会完了画面 - 今後のご案内 */}
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">② 入会完了画面 — 今後のご案内</p>
                  <p className="text-xs text-slate-500">完了画面の「今後のご案内」ブロック全体の表示有無と本文を設定します。本文はメール送信 ON/OFF で分けて管理します。</p>
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
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">③ ログイン情報カードの表示・非表示</p>
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
          </AdminSettingsSection>

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

          <AdminSettingsSection
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
          </AdminSettingsSection>

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
                        defaultBusinessStaffLimit: Number(globalLimitInput || 10),
                        trainingHistoryLookbackMonths: Number(historyLookbackInput || 18),
                        annualFeePaymentGuidance: annualFeePaymentGuidanceInput,
                        annualFeeTransferAccount: annualFeeTransferAccountInput,
                        trainingDefaultFieldConfig: trainingDefaultFieldConfigInput,
                        rosterTemplateSsId: rosterTemplateSsIdInput,
                        reminderTemplateSsId: reminderTemplateSsIdInput,
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
                      });
                      setDefaultBusinessStaffLimit(saved.defaultBusinessStaffLimit);
                      setGlobalLimitInput(String(saved.defaultBusinessStaffLimit));
                      setTrainingHistoryLookbackMonths(saved.trainingHistoryLookbackMonths);
                      setHistoryLookbackInput(String(saved.trainingHistoryLookbackMonths));
                      setAnnualFeePaymentGuidance(saved.annualFeePaymentGuidance);
                      setAnnualFeePaymentGuidanceInput(saved.annualFeePaymentGuidance);
                      setAnnualFeeTransferAccount(saved.annualFeeTransferAccount);
                      setAnnualFeeTransferAccountInput(saved.annualFeeTransferAccount);
                      const tdfSaved = saved.trainingDefaultFieldConfig ?? { ...DEFAULT_FIELD_CONFIG };
                      setTrainingDefaultFieldConfig(tdfSaved);
                      setTrainingDefaultFieldConfigInput(tdfSaved);
                      setRosterTemplateSsIdInput(saved.rosterTemplateSsId ?? '');
                      setReminderTemplateSsIdInput(saved.reminderTemplateSsId ?? '');
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
      return <TrainingManagement trainings={trainings} onSave={handleTrainingSave} defaultFieldConfig={trainingDefaultFieldConfig} />;
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
        rosterTemplateSsId: rosterTemplateSsIdInput,
        bulkMailAutoAttachFolderId: bulkMailAutoAttachFolderIdInput,
        emailLogViewerRole: emailLogViewerRoleInput,
      };
      return (
        <BulkMailSender
          api={api}
          settings={bulkMailSettings}
          adminPermissionLevel={adminPermissionLevel}
        />
      );
    }

    if (currentView === 'roster-export') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      const rosterSettings = {
        rosterTemplateSsId: rosterTemplateSsIdInput,
      };
      return (
        <RosterExport
          api={api}
          settings={rosterSettings}
          onOpenHelp={() => setCurrentView('template-help')}
          onOpenSettings={() => setCurrentView('admin-settings')}
        />
      );
    }

    if (currentView === 'mailing-list-export') {
      if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) {
        return <div className="text-red-500 p-4">管理者ページへのアクセス権限がありません。</div>;
      }
      return <MailingListExport api={api} />;
    }

    if (currentView === 'member-delete') {
      if (userRole !== 'ADMIN' || adminPermissionLevel !== 'MASTER') {
        return <div className="text-red-500 p-4">この機能はMASTER権限専用です。</div>;
      }
      return <MemberDeleteConsole />;
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
          showMemberPages={!isAdminShell}
          adminPermissionLevel={adminPermissionLevel}
          onLogout={handleLogoutClick}
        />
      )}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto relative overscroll-contain">
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
