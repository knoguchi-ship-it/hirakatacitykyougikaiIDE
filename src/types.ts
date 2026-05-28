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

// v372: 名簿出力 Visual Template Designer
export type RosterFieldType = 'string' | 'number' | 'date' | 'enum' | 'boolean' | 'array';
// v372.2: グループ細分化 — individual / office / staff / fee / auto（統合フィールド）
export type RosterFieldGroup = 'auto' | 'member' | 'individual' | 'office' | 'staff' | 'fee' | 'computed';

export interface RosterFieldDef {
  key: string;
  label: string;
  group: RosterFieldGroup;
  type: RosterFieldType;
  enumLabels?: Record<string, string>;
  sample: string;
  description?: string;
  // v372.2: どの出力単位で意味があるか（'MEMBER' = 会員行に値あり / 'STAFF' = 職員行に値あり）
  applicableUnits?: Array<'MEMBER' | 'STAFF'>;
  // v372.3: 値ピッカーの種類（'year' なら availableYears から select 表示）
  valuePicker?: 'year';
}

// v373.2: 構造化条件ルール（Airtable 風）+ legacy `when` 後方互換
export interface ConditionalRule {
  // v372 legacy: 自由記述式（v373.2 で UI からは廃止、評価のみ後方互換）
  when?: string;
  // v373.2+ 構造化条件: 同一行の指定フィールドに対する filter 評価
  fieldKey?: string;
  operator?: RowFilterOperator;
  value?: string;
  values?: string[];
  value2?: string;
  negate?: boolean;
  style: { color?: string; bgColor?: string; bold?: boolean };
}

// v372 S1.5: 列ごとの行フィルタ
export type RowFilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'isEmpty' | 'isNotEmpty'
  | 'gt' | 'lt' | 'gte' | 'lte' | 'between'
  | 'in' | 'notIn'
  | 'before' | 'after';

export interface RowFilterDef {
  operator: RowFilterOperator;
  // v372.3: 否定トグル（true で結果を反転）
  negate?: boolean;
  value?: string;
  value2?: string;   // between/range 用
  values?: string[]; // in/notIn 用
}

export interface RosterColumnDef {
  id: string;
  source: 'field' | 'formula' | 'literal';
  fieldKey?: string;
  formula?: string;
  literal?: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string;
  conditionalStyle?: ConditionalRule[];
  rowFilter?: RowFilterDef;
}

export interface RosterLayoutDef {
  paperSize?: 'A4' | 'A3' | 'B5';
  orientation?: 'portrait' | 'landscape';
  fontSize?: number;
  rowsPerPage?: number;
  showRecordCount?: boolean;
  recordCountPosition?: 'header' | 'footer' | 'both';
  recordCountFormat?: string; // 例: '出力対象: {{count}} 名'
}

export type RosterOutputUnit = 'MEMBER' | 'STAFF' | 'MIXED';

export interface RosterTemplateV2 {
  id: string;
  name: string;
  description?: string;
  target?: 'PERSONAL_SUPPORT' | 'BUSINESS' | 'ALL';
  outputUnit?: RosterOutputUnit;
  columns: RosterColumnDef[];
  layout?: RosterLayoutDef;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RosterDesignerRow {
  // raw fields (string keys from getRosterFieldDictionary)
  [key: string]: string | number | undefined | Record<number, 'PAID' | 'UNPAID'>;
}

// v219: 入会メールテンプレート
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  savedAt: string;
}

// v373.6 (S5): RosterTemplate interface 撤去（旧 RosterExport 削除に伴う）。
// SystemSettings.rosterTemplates は型からは外したが、GAS 側 T_システム設定 行は次セッションで撤去予定。

export interface SystemSettings {
  defaultBusinessStaffLimit: number;
  trainingHistoryLookbackMonths: number;
  annualFeePaymentGuidance: string;
  annualFeeTransferAccount: TransferAccountInfo;
  trainingDefaultFieldConfig?: TrainingFieldConfig | null;
  // v194: PDF名簿出力 & 一括メール送信設定
  // v373.7 (S5 Phase 2): rosterTemplateSsId / reminderTemplateSsId / rosterTemplates 撤去
  // （旧 RosterExport 関連は front-end / GAS 両側から削除済み、T_システム設定 行のみ保全）
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
  trainingFileFolderId?: string;
  claimAttachmentFolderId?: string;
  // v265: 個人・賛助会員入会時メール ON/OFF
  indSuppEmailEnabled?: boolean;
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
  // v368: 変更申請ワークフローのテンプレ化
  applicationReceiptEnabled?: boolean;
  applicationReceiptSubject?: string;
  applicationReceiptBody?: string;
  approvalNotificationEnabled?: boolean;
  approvalNotificationSubject?: string;
  approvalNotificationBody?: string;
  rejectionNotificationEnabled?: boolean;
  rejectionNotificationSubject?: string;
  rejectionNotificationBody?: string;
  // v371: メール送信 4 階層ガード（GLOBAL / MODE / ALLOWLIST / CATEGORY）
  mailGlobalEnabled?: boolean;
  mailDeliveryMode?: 'LIVE' | 'REDIRECT' | 'SUPPRESS';
  mailRedirectAllowlist?: string; // カンマ区切り
  trainingApplyReceiptEnabled?: boolean;
  trainingReminderEnabled?: boolean;
  bulkMailEnabled?: boolean;
  authOtpEnabled?: boolean;
  memberUpdateConfirmEnabled?: boolean;
  withdrawalConfirmEnabled?: boolean;
  passwordResetEnabled?: boolean;
}

export interface AnnualFeeAdminRecord {
  id: string;
  exists: boolean;
  memberId: string;
  memberType: MemberType;
  displayName: string;
  /** v362: 検索用フリガナ（T_会員 セイ + メイ）。事業所会員は空 */
  kana?: string;
  officeName: string; // 事業所会員=事業所名 / 個人・賛助会員=勤務先事業所名
  year: number;
  /** v364: 前年度（year - 1）の納入状況。NOT_ELIGIBLE=前年度に有効会員でなかった */
  previousYear?: number;
  previousYearEligible?: boolean;
  previousYearStatus?: 'PAID' | 'UNPAID' | 'NOT_ELIGIBLE';
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
  /** v364: 前年度未納者数（前年度有効 かつ UNPAID/未記録） */
  previousYearUnpaidCount?: number;
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
  /** v362: 検索用フリガナ（T_会員 セイ + メイ）。事業所会員は空 */
  kana?: string;
  memberType: MemberType;
  officeName: string; // 事業所会員=事業所名 / 個人・賛助会員=勤務先事業所名（キーワード検索の対象）
  latestFeeStatus: PaymentStatus;
  trainingCount: number;
  joinedDate: string;
  status: 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN' | 'TRANSFERRED';
  withdrawnDate?: string;
  enrolledStaffCount?: number; // BUSINESS type only: number of ENROLLED staff in this organization
}

export interface AdminDashboardStaffRow {
  memberId: string;
  officeName: string;
  officeNumber: string;
  staffId: string;
  careManagerNumber: string;
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  name: string;
  kana: string;
  email: string;
  role: StaffRole;
  status: 'ENROLLED' | 'LEFT';
  joinedDate: string;
  withdrawnDate: string;
  mailingPreference: string;
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
  staffRows: AdminDashboardStaffRow[];
  trainingRows: AdminDashboardTrainingRow[];
}

export interface SharedMemo {
  key: string;
  content: string;
  updatedByEmail: string;
  updatedByName: string;
  updatedAt: string;
  version: number;
}

export interface SharedMemoSaveResult {
  conflict?: boolean;
  current?: SharedMemo;
  key?: string;
  content?: string;
  updatedByEmail?: string;
  updatedByName?: string;
  updatedAt?: string;
  version?: number;
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
  roleId?: string; // docs/246 Phase 2-A: 新 RBAC のロールID（legacy permissionLevel と並行）
  enabled: boolean;
  updatedAt: string;
  updatedByEmail?: string;
  updatedByAt?: string;
}

// docs/246 Phase 2: メニュー単位 RBAC
export interface MenuRegistryEntry {
  id: string;
  label: string;
  group: string;
  masterOnly?: boolean;
}

export interface RoleDefinition {
  roleId: string;
  roleName: string;
  description: string;
  allowedMenus: string[];
  trainingEditScope: 'ALL' | 'OWN';
  isBuiltIn: boolean;
  isMaster: boolean;
  sortOrder: number;
  assignedCount: number;
}

export interface AdminPermissionData {
  entries: AdminPermissionEntry[];
  identityOptions: AdminPermissionIdentityOption[];
  currentSessionEmail: string;
  currentSessionPermissionLevel: AdminPermissionLevel;
  // docs/246 Phase 2-A 追加（後方互換 — 旧 UI は無視可）
  roles?: RoleDefinition[];
  menuRegistry?: MenuRegistryEntry[];
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
  
  status: 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN' | 'TRANSFERRED';
  joinedDate?: string;
  withdrawnDate?: string;
  withdrawalProcessDate?: string;
  statusNote?: string;
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

export type TrainingLifecycleStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED';
export type TrainingApplicationStatus = 'OPEN' | 'NOT_STARTED' | 'CLOSED' | 'FULL' | 'UNAVAILABLE';

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
  // v376.30: 外部申込フォーム URL（Google フォーム等）
  applicationUrl: boolean;
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
  applicationUrl: true,
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
  thumbnailUrl?: string;
  /** v376.7: admin 一覧で削除済を識別。公開ポータルは backend 側で除外済のため常に false。 */
  isDeleted?: boolean;
  date: string;
  endTime?: string;
  capacity: number;
  applicants: number;
  location: string;
  /** @deprecated Use lifecycleStatus + applicationStatus/isApplicationOpen for new logic. */
  status: 'OPEN' | 'CLOSED';
  lifecycleStatus?: TrainingLifecycleStatus;
  applicationStatus?: TrainingApplicationStatus;
  applicationStatusReason?: string;
  isApplicationOpen?: boolean;
  organizer?: string;
  isNonMandatory?: boolean;
  fees?: TrainingFee[];
  applicationOpenDate?: string;
  applicationCloseDate?: string;
  instructor?: string;
  // v376.30: 外部申込フォーム URL（Google フォーム等、optional）
  applicationUrl?: string;
  fieldConfig?: TrainingFieldConfig;
  cancelAllowed?: boolean;
  inquiryPerson?: string;
  inquiryContactType?: 'PHONE' | 'EMAIL';
  inquiryContactValue?: string;
  inquiryPhone?: string;
  inquiryEmail?: string;
  registrarEmail?: string;
}
