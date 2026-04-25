// SOW Section 3: Database Design Definitions

export enum MemberType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
  SUPPORT = 'SUPPORT'
}

export enum MailingPreference {
  EMAIL = 'EMAIL',
  POST = 'POST'
}

export enum MailDestination {
  HOME = 'HOME',
  OFFICE = 'OFFICE'
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID'
}

export interface TransferAccountInfo {
  bankName: string;
  branchName: string;
  accountType: '普通' | '当座';
  accountNumber: string;
  accountName: string;
  note?: string;
}

export interface AnnualFeeRecord {
  id?: string;
  year: number;
  status: PaymentStatus;
  confirmedDate?: string;
  amount?: number;
  note?: string;
  updatedAt?: string;
  transferAccount?: TransferAccountInfo;
}

// v219: 入会メールテンプレート
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  savedAt: string;
}

export interface SystemSettings {
  defaultBusinessStaffLimit: number;
  trainingHistoryLookbackMonths: number;
  annualFeePaymentGuidance: string;
  annualFeeTransferAccount: TransferAccountInfo;
  trainingDefaultFieldConfig?: TrainingFieldConfig | null;
  // v194: PDF名簿出力 & 一括メール送信設定
  rosterTemplateSsId?: string;
  reminderTemplateSsId?: string;
  bulkMailAutoAttachFolderId?: string;
  emailLogViewerRole?: string;
  // v209: 入会時認証情報メール設定
  credentialEmailEnabled?: boolean;
  credentialEmailFrom?: string;
  credentialEmailSubject?: string;
  credentialEmailBody?: string;
  // v210: 公開ポータル メニュー表示設定
  publicPortalTrainingMenuEnabled?: boolean;
  publicPortalMembershipMenuEnabled?: boolean;
  publicPortalHeroBadgeEnabled?: boolean;
  publicPortalHeroBadgeLabel?: string;
  publicPortalHeroTitle?: string;
  publicPortalHeroDescriptionEnabled?: boolean;
  publicPortalHeroDescription?: string;
  publicPortalMembershipBadgeEnabled?: boolean;
  publicPortalMembershipBadgeLabel?: string;
  publicPortalMembershipTitleEnabled?: boolean;
  publicPortalMembershipTitle?: string;
  publicPortalMembershipDescriptionEnabled?: boolean;
  publicPortalMembershipDescription?: string;
  publicPortalMembershipCtaLabel?: string;
  publicPortalCompletionGuidanceVisible?: boolean;
  publicPortalCompletionGuidanceBodyWhenCredentialSent?: string;
  publicPortalCompletionGuidanceBodyWhenCredentialNotSent?: string;
  publicPortalCompletionLoginInfoBlockVisible?: boolean;
  publicPortalCompletionLoginInfoVisible?: boolean;
  publicPortalCompletionLoginInfoBodyWhenCredentialSent?: string;
  publicPortalCompletionLoginInfoBodyWhenCredentialNotSent?: string;
  publicPortalCompletionNoCredentialNotice?: string;
  publicPortalCompletionCredentialNotice?: string;
  publicPortalCredentialEmailEnabled?: boolean;
  publicPortalTrainingBadgeEnabled?: boolean;
  publicPortalTrainingBadgeLabel?: string;
  publicPortalTrainingTitleEnabled?: boolean;
  publicPortalTrainingTitle?: string;
  publicPortalTrainingDescriptionEnabled?: boolean;
  publicPortalTrainingDescription?: string;
  publicPortalTrainingCtaLabel?: string;
  publicPortalMemberUpdateMenuEnabled?: boolean;
  publicPortalMemberUpdateBadgeEnabled?: boolean;
  publicPortalMemberUpdateBadgeLabel?: string;
  publicPortalMemberUpdateTitleEnabled?: boolean;
  publicPortalMemberUpdateTitle?: string;
  publicPortalMemberUpdateDescriptionEnabled?: boolean;
  publicPortalMemberUpdateDescription?: string;
  publicPortalMemberUpdateCtaLabel?: string;
  publicPortalWithdrawalMenuEnabled?: boolean;
  publicPortalWithdrawalBadgeEnabled?: boolean;
  publicPortalWithdrawalBadgeLabel?: string;
  publicPortalWithdrawalTitleEnabled?: boolean;
  publicPortalWithdrawalTitle?: string;
  publicPortalWithdrawalDescriptionEnabled?: boolean;
  publicPortalWithdrawalDescription?: string;
  publicPortalWithdrawalCtaLabel?: string;
  // v265: 事業所入会・職員追加メール設定
  bizRepEmailEnabled?: boolean;
  bizRepEmailSubject?: string;
  bizRepEmailBody?: string;
  bizStaffEmailEnabled?: boolean;
  bizStaffEmailSubject?: string;
  bizStaffEmailBody?: string;
  staffAddStaffEmailEnabled?: boolean;
  staffAddStaffEmailSubject?: string;
  staffAddStaffEmailBody?: string;
  staffAddRepEmailEnabled?: boolean;
  staffAddRepEmailSubject?: string;
  staffAddRepEmailBody?: string;
}

export interface AnnualFeeAdminRecord {
  id: string;
  exists: boolean;
  memberId: string;
  memberType: MemberType;
  displayName: string;
  year: number;
  status: PaymentStatus;
  confirmedDate?: string;
  amount: number;
  note: string;
  updatedAt?: string;
}

export interface AnnualFeeAuditLog {
  id: string;
  annualFeeRecordId: string;
  memberId: string;
  displayName: string;
  year: number;
  action: 'CREATE' | 'UPDATE' | 'WITHDRAW';
  actorEmail: string;
  actorDisplayName?: string;
  executedAt: string;
  beforeJson: string;
  afterJson: string;
}

export interface AnnualFeeAdminSummaryByType {
  memberType: MemberType;
  eligibleCount: number;
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface AnnualFeeAdminSummary {
  eligibleCount: number;
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
  memberTypeBreakdown: AnnualFeeAdminSummaryByType[];
}

export interface AnnualFeeAdminData {
  selectedYear: number;
  records: AnnualFeeAdminRecord[];
  years: number[];
  auditLogs: AnnualFeeAuditLog[];
  summary: AnnualFeeAdminSummary;
}

export interface AdminDashboardMemberRow {
  memberId: string;
  displayName: string;
  memberType: MemberType;
  latestFeeStatus: PaymentStatus;
  trainingCount: number;
  joinedDate: string;
  status: 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN';
  withdrawnDate?: string;
  enrolledStaffCount?: number; // BUSINESS type only: number of ENROLLED staff in this organization
}

export interface AdminDashboardTrainingRow {
  trainingId: string;
  title: string;
  date: string;
  status: 'OPEN' | 'CLOSED';
  applicants: number;
  capacity: number;
}

export interface AdminDashboardData {
  memberCount: number;
  individualCount: number;
  businessCount: number;
  businessStaffCount: number;
  currentFiscalYear: number;
  currentFiscalYearLabel: string;
  currentYearJoinedCount: number;
  currentYearWithdrawnCount: number;
  paidCount: number;
  unpaidCount: number;
  emailCount: number;
  postCount: number;
  openTrainingCount: number;
  memberRows: AdminDashboardMemberRow[];
  trainingRows: AdminDashboardTrainingRow[];
}

export interface AdminPermissionIdentityOption {
  authId: string;
  authMethod: 'PASSWORD' | 'GOOGLE';
  loginId: string;
  memberId: string;
  staffId?: string;
  roleCode: string;
  label: string;
}

export type AdminPermissionLevel = 'MASTER' | 'ADMIN' | 'TRAINING_MANAGER' | 'TRAINING_REGISTRAR' | 'GENERAL';

export interface AdminPermissionEntry {
  id: string;
  googleEmail: string;
  displayName: string;
  linkedAuthId: string;
  linkedMemberId: string;
  linkedStaffId?: string;
  linkedRoleCode: string;
  linkedIdentityLabel: string;
  permissionLevel: AdminPermissionLevel;
  enabled: boolean;
  updatedAt: string;
  updatedByEmail?: string;
  updatedByAt?: string;
}

export interface AdminPermissionData {
  entries: AdminPermissionEntry[];
  identityOptions: AdminPermissionIdentityOption[];
  currentSessionEmail: string;
  currentSessionPermissionLevel: AdminPermissionLevel;
}

export type StaffRole = 'REPRESENTATIVE' | 'ADMIN' | 'STAFF';

export interface Staff {
  id: string; // Internal ID for UI keys
  loginId?: string;
  careManagerNumber?: string;
  lastName?: string;
  firstName?: string;
  lastKana?: string;
  firstKana?: string;
  name: string;
  kana: string;
  email: string; // Individual email
  role: StaffRole; // Permission level
  status?: 'ENROLLED' | 'LEFT';
  joinedDate?: string;
  withdrawnDate?: string;
  mailingPreference?: string; // メール配信希望コード: YES | NO
  midYearWithdrawal?: boolean;
  participatedTrainingIds?: string[]; // Track training per staff
}

// Master_Billing & Master_Person merged logic for UI
export interface Member {
  id: string; // 8-digit registration number
  loginId?: string;
  careManagerNumber?: string;
  staffLimit?: number;
  
  // Name Split (For Individual: The Person / For Business: The Representative)
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  
  type: MemberType;
  
  // Business Logic: List of associated staff
  staff?: Staff[];
  
  // Office Info
  officeName: string; // Mandatory (Common Matter 2)
  officeNumber?: string; // 事業所番号（事業所会員のみ必須）
  officePostCode: string;
  officePrefecture: string;
  officeCity: string;
  officeAddressLine: string;
  officeAddressLine2?: string; // 建物名・部屋番号（任意）
  phone: string;     // Office Phone
  fax: string;       // Mandatory (Common Matter 1)

  // Home Info
  homePostCode: string;
  homePrefecture: string;
  homeCity: string;
  homeAddressLine: string;
  homeAddressLine2?: string; // 建物名・部屋番号（任意）
  mobilePhone?: string; // Personal/Mobile

  // Mailing Logic
  mailingPreference: MailingPreference; // For Notifications/Newsletter
  preferredMailDestination: MailDestination; // For mandatory physical mail (3x/year)
  email?: string; // Main Contact Email (Rep)
  
  status: 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN';
  joinedDate?: string;
  withdrawnDate?: string;
  withdrawalProcessDate?: string;
  midYearWithdrawal?: boolean;
  
  // Annual Fee History (Past 2 years)
  annualFeeHistory: AnnualFeeRecord[];

  // History (For Individuals. For Business, see Staff)
  participatedTrainingIds?: string[];
}

// v125: フラット人物リスト（管理コンソール一括編集用）
export type AdminPersonType = 'INDIVIDUAL' | 'SUPPORT' | 'OFFICE_STAFF';

export interface AdminPersonRow {
  personKey: string;
  personType: AdminPersonType;
  displayName: string;
  kana: string;
  email: string;
  officeName: string;
  memberId: string;
  staffId: string | null;
  status: string;
  joinedDate: string;
  withdrawnDate: string;
  mailingPreference: string;
  preferredMailDestination: string;
  staffRole: string | null;
  careManagerNumber: string;
  accountEnabled: boolean;
}

// v125: 会員種別変更
export interface ConvertMemberTypePayload {
  direction: 'STAFF_TO_INDIVIDUAL' | 'INDIVIDUAL_TO_STAFF';
  sourceMemberId: string;
  sourceStaffId?: string;
  targetOfficeMemberId?: string;
  staffRole?: 'ADMIN' | 'STAFF';
  newRepresentativeStaffId?: string;
  /** 賛助会員転籍時に新たに入力する介護支援専門員番号 */
  careManagerNumber?: string;
}

export interface ConvertMemberTypeResult {
  converted: boolean;
  direction: string;
  newMemberId?: string;
  newStaffId?: string;
  sourceStaffId?: string;
  sourceMemberId?: string;
  targetOfficeMemberId?: string;
}

export interface TrainingFee {
  label: string;   // 例: "会員", "非会員", "学生"
  amount: number;  // 円
}

export interface TrainingFieldConfig {
  organizer: boolean;
  isNonMandatory: boolean;
  summary: boolean;
  description: boolean;
  location: boolean;
  instructor: boolean;
  applicationOpenDate: boolean;
  applicationCloseDate: boolean;
  fees: boolean;
  guidePdfUrl: boolean;
}

export const DEFAULT_FIELD_CONFIG: TrainingFieldConfig = {
  organizer: true,
  isNonMandatory: true,
  summary: true,
  description: true,
  location: true,
  instructor: true,
  applicationOpenDate: true,
  applicationCloseDate: true,
  fees: true,
  guidePdfUrl: true,
};

export const DEFAULT_FEES: TrainingFee[] = [
  { label: '会員', amount: 0 },
  { label: '非会員', amount: 0 },
];

export interface Training {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  guidePdfUrl?: string;
  date: string;
  endTime?: string;
  capacity: number;
  applicants: number;
  location: string;
  status: 'OPEN' | 'CLOSED';
  organizer?: string;
  isNonMandatory?: boolean;
  fees?: TrainingFee[];
  applicationOpenDate?: string;
  applicationCloseDate?: string;
  instructor?: string;
  fieldConfig?: TrainingFieldConfig;
  cancelAllowed?: boolean;
  inquiryPerson?: string;
  inquiryContactType?: 'PHONE' | 'EMAIL';
  inquiryContactValue?: string;
  inquiryPhone?: string;
  inquiryEmail?: string;
  registrarEmail?: string;
}
