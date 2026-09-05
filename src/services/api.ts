import { Member, Training, AdminPermissionLevel, AdminPersonRow, ConvertMemberTypePayload, ConvertMemberTypeResult, SystemSettings, SharedMemo, SharedMemoSaveResult } from '../types';
import {
  TrainingApplicantRow,
  BulkMailRecipient,
  EmailSendLog,
  MailingListFilterType,
  MailingListExcelResult,
  MailingListTargetsResult,
  // v360
  TrainingRosterRow,
  TrainingStats,
  AttendanceStatus,
  // v374.1: 公式LINE投稿依頼
  LinePostRequest,
  LinePostStatus,
  LinePostTargetType,
  LinePostAttachmentKind,
  LinePostAttachmentUploadResult,
} from '../shared/types';
import { EMAIL_PATTERN, PHONE_PATTERN, CARE_MANAGER_NO_PATTERN } from '../shared/validators';
import { callGcpApi } from '../shared/api-base';
import { AdminDashboardData, AdminPermissionData, AnnualFeeAdminData, AnnualFeeAdminRecord, RoleDefinition, MenuRegistryEntry } from '../types';

export interface TrainingMailPayload {
  trainingId: string;
  targetApplyIds: string[];
  from: string;
  subject: string;
  body: string;
  commonAttachBase64?: string;
  commonAttachFilename?: string;
  commonAttachMime?: string;
  individualFolderUrl?: string;
}

export interface MemberLoginResult {
  authMethod: 'PASSWORD';
  loginId: string;
  memberId: string;
  staffId?: string;
  roleCode: string;
  canAccessAdminPage: boolean;
  sessionToken: string;
  authenticatedAt: string;
}

export interface AdminLoginResult {
  authMethod: 'GOOGLE';
  loginId: string;
  memberId: string;
  staffId?: string;
  roleCode: string;
  canAccessAdminPage: boolean;
  adminPermissionLevel?: AdminPermissionLevel;
  // docs/246 Phase 1-B 以降: ロール解決後の RBAC 情報（後方互換のため optional）
  roleId?: string;
  roleName?: string;
  isMaster?: boolean;
  allowedMenus?: string[];
  trainingEditScope?: 'ALL' | 'OWN';
  displayName?: string;
  authenticatedAt: string;
}

export interface AdminEmailAliasesResult {
  aliases: string[];
  warning?: string;
}

export interface MemberPortalLookup {
  loginId?: string;
  memberId?: string;
}

// GAS環境で提供される google.script.run の型定義（簡易版）
declare const google: {
  script: {
    run: {
      withSuccessHandler(callback: (result: any) => void): any;
      withFailureHandler(callback: (error: Error) => void): any;
      [functionName: string]: any;
    };
  };
};

export interface ApiClient {
  setMemberSessionToken(token: string | null): void;
  fetchAllData(): Promise<{ members: Member[], trainings: Training[] }>;
  getMemberPortalData(lookup: MemberPortalLookup): Promise<{ members: Member[], trainings: Training[], resolvedMemberId?: string, resolvedStaffId?: string }>;
  getAdminDashboardData(): Promise<AdminDashboardData>;
  getAdminInitData(): Promise<{ dashboard: AdminDashboardData; settings: SystemSettings }>;
  getTrainingManagementData(): Promise<Training[]>;
  updateMember(member: Member): Promise<void>;
  updateMemberSelf(member: Member, loginId: string): Promise<void>;
  changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void>;
  getMemberAuthAccounts(memberId: string): Promise<Array<{ issued: boolean; authId: string; loginId: string; method: string; active: boolean; locked: boolean; unit: 'MEMBER' | 'STAFF'; memberId: string; staffId: string; personName: string }>>;
  adminResetMemberPassword(authId: string): Promise<{ loginId: string; newPassword: string; resetAt: string }>;
  // v376.78: ログインロックの解除（パスワードは変えない）
  adminUnlockMemberAccount(authId: string): Promise<{ authId: string; loginId: string; wasLocked: boolean; failedCountBefore: number; unlockedAt: string }>;
  adminIssueMemberCredential(memberId: string, staffId?: string): Promise<{ authId: string; loginId: string; newPassword: string; issuedAt: string; personName: string }>;
  requestPasswordReset(loginId: string, email: string): Promise<{ message: string; expiresInMinutes: number }>;
  completePasswordReset(loginId: string, code: string, newPassword: string): Promise<{ message: string; updatedAt: string }>;
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: SystemSettings): Promise<SystemSettings>;
  getAnnualFeeAdminData(year?: number): Promise<AnnualFeeAdminData>;
  saveAnnualFeeRecord(record: {
    id?: string;
    memberId: string;
    year: number;
    status: 'PAID' | 'UNPAID';
    confirmedDate?: string;
    note?: string;
  }): Promise<AnnualFeeAdminRecord>;
  saveAnnualFeeRecordsBatch(records: Array<{
    id?: string;
    memberId: string;
    year: number;
    status: 'PAID' | 'UNPAID' | 'WITHDRAW';
    confirmedDate?: string;
    note?: string;
  }>): Promise<{ savedRecords: AnnualFeeAdminRecord[]; withdrawnMemberIds: string[] }>;
  memberLogin(loginId: string, password: string): Promise<MemberLoginResult>;
  checkAdminBySession(): Promise<AdminLoginResult>;
  getAdminPermissionData(): Promise<AdminPermissionData>;
  saveAdminPermission(payload: {
    id?: string;
    googleEmail: string;
    linkedAuthId: string;
    permissionLevel: AdminPermissionLevel;
    roleId?: string; // docs/246 Phase 2-A: 新 RBAC ロールID（後方互換）
    enabled: boolean;
  }): Promise<void>;
  deleteAdminPermission(id: string): Promise<void>;
  // docs/246 Phase 2-A: ロール CRUD
  listRoles(): Promise<{ roles: RoleDefinition[]; menuRegistry: MenuRegistryEntry[] }>;
  saveRole(payload: {
    roleId?: string;
    roleName: string;
    description?: string;
    allowedMenus: string[];
    trainingEditScope: 'ALL' | 'OWN';
  }): Promise<{ saved: true; roleId: string; isNew: boolean }>;
  deleteRole(roleId: string): Promise<{ deleted: true; roleId: string }>;
  duplicateRole(payload: { sourceRoleId: string; newRoleName?: string }): Promise<{ saved: true; roleId: string; isNew: boolean }>;
  saveTraining(training: Training): Promise<Training>;
  // v376.7: 研修 soft delete / restore
  softDeleteTraining(trainingId: string): Promise<{ trainingId: string; applicantCount: number; deleted: true; alreadyDeleted?: boolean }>;
  restoreTraining(trainingId: string): Promise<{ trainingId: string; restored: true; alreadyActive?: boolean }>;
  uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string; driveFileId?: string; thumbnailUrl?: string; thumbnailGenerationStatus?: 'generated' | 'pending' | 'failed' | 'skipped' }>;
  // v344: 案内PDF サムネイルを GAS proxy 経由で base64 data URL として取得（hotlink 制限回避）
  // v358: 第2引数 size を渡すと高解像度版（Drive thumbnailLink を w<size> で再取得）を返す
  getFileThumbnail(fileUrl: string, size?: number): Promise<string | null>;
  // v350: 案内PDF サムネイル手動再生成（編集モーダルから 1 クリック）
  regenerateThumbnailForTraining(trainingId: string): Promise<{ trainingId: string; thumbnailUrl: string; thumbnailGenerationStatus: 'generated' | 'pending' | 'failed' | 'skipped'; reason?: string }>;
  applyTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ applicationId: string; applicants: number; duplicate?: boolean }>;
  cancelTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ canceled: boolean; applicants: number }>;
  getTrainingApplicants(trainingId: string): Promise<TrainingApplicantRow[]>;
  getAdminEmailAliases(): Promise<AdminEmailAliasesResult>;
  sendTrainingMail(payload: TrainingMailPayload): Promise<{ sent: number; errors: string[] }>;
  // ── v360: 研修名簿・出欠・受講履歴・一括メール明細 ────────────────
  getTrainingRosterDetail(trainingId: string): Promise<{ applicants: TrainingRosterRow[] }>;
  saveAttendance(payload: { applyId: string; status: AttendanceStatus }): Promise<{ ok: boolean; recordedAt?: string; error?: string }>;
  saveAttendanceBatch(entries: Array<{ applyId: string; status: AttendanceStatus }>): Promise<{ results: any[] }>;
  addRosterEntry(payload: { trainingId: string; memberId?: string; staffId?: string; memo?: string }): Promise<{ ok: boolean; applyId?: string; error?: string }>;
  addGuestRosterEntry(payload: { trainingId: string; guest: { name: string; kana?: string; email?: string; phone?: string; officeName?: string }; memo?: string }): Promise<{ ok: boolean; applyId?: string; externalId?: string; error?: string }>;
  cancelRosterEntry(payload: { applyId: string; reason?: string }): Promise<{ ok: boolean; error?: string }>;
  updateRosterEntry(payload: { applyId: string; adminMemo?: string }): Promise<{ ok: boolean; error?: string }>;
  getTrainingStats(trainingId: string): Promise<TrainingStats>;
  withdrawMember(memberId: string, withdrawnDate?: string, midYearWithdrawal?: boolean): Promise<{ withdrawn: boolean; memberId: string; withdrawnDate: string }>;
  withdrawSelf(loginId: string, password: string, memberId: string): Promise<{ scheduled: boolean; memberId: string; withdrawnDate: string }>;
  cancelWithdrawalSelf(loginId: string, password: string, memberId: string): Promise<{ canceled: boolean; memberId: string }>;
  submitMemberApplication(payload: any): Promise<any>;
  // v125: 除籍・フラット人物リスト・種別変更
  removeStaffFromOffice(memberId: string, staffId: string): Promise<{ removed: boolean; staffId: string }>;
  getAdminPersonList(): Promise<{ persons: AdminPersonRow[] }>;
  updatePersonsBatch(records: Array<Record<string, any>>): Promise<Array<Record<string, any>>>;
  convertMemberType(payload: ConvertMemberTypePayload): Promise<ConvertMemberTypeResult>;
  // v126: 予約退会・キャンセル・職員個別更新
  scheduleWithdrawMember(memberId: string): Promise<{ scheduled: boolean; memberId: string; withdrawnDate: string }>;
  cancelScheduledWithdraw(memberId: string): Promise<{ cancelled: boolean; memberId: string }>;
  updateStaff(payload: { staffId: string; memberId: string; lastName?: string; firstName?: string; lastKana?: string; firstKana?: string; name?: string; kana?: string; email?: string; careManagerNumber?: string; role?: string; status?: string; joinedDate?: string; withdrawnDate?: string; mailingPreference?: string }): Promise<{ updated: boolean; staffId: string; memberId: string; status?: string; role?: string }>;
  // v188: AI案内メール生成（GASサーバー側でGemini APIを呼ぶ）
  generateTrainingEmail(payload: { training: Training; recipientName?: string }): Promise<{ ok: boolean; text: string }>;
  // v194: 会員一括メール送信
  getMembersForBulkMail(payload: {
    memberTypes?: string[];
    memberStatus?: string;
    staffStatus?: string;
    mailingFilter?: string;
    excludeNoEmail?: boolean;
  }): Promise<BulkMailRecipient[]>;
  sendBulkMemberMail(payload: {
    recipientKeys: string[];
    from: string;
    subject: string;
    body: string;
    commonAttachments?: Array<{ name: string; mimeType: string; base64: string }>;
    individualAttachments?: Record<string, { name: string; mimeType: string; base64: string }>;
    useAutoAttach?: boolean;
    memberTypes?: string[];
    memberStatus?: string;
    staffStatus?: string;
    mailingFilter?: string;
    excludeNoEmail?: boolean;
  }): Promise<{ sent: number; total: number; errors: string[]; autoAttachMissed: string[]; logId: string; deliveryMode?: string; suppressedCount?: number }>;
  getEmailSendLog(): Promise<EmailSendLog[]>;
  // v207: 宛名リスト Excel 出力
  getMailingListTargets(payload: { filterType: MailingListFilterType; year?: number }): Promise<MailingListTargetsResult>;
  generateMailingListExcel(payload: { filterType: MailingListFilterType; year?: number; targetKeys?: string[] }): Promise<MailingListExcelResult>;
  // v219: 入会メール テンプレート管理
  getCredentialEmailTemplates(): Promise<import('../types').EmailTemplate[]>;
  saveCredentialEmailTemplate(payload: { id?: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate>;
  deleteCredentialEmailTemplate(id: string): Promise<{ deletedId: string }>;
  // v376.42: 全メール種別 テンプレート管理（汎用・カテゴリ別）
  // v376.68: 汎用データエクスポート（CSV）
  listExportableTables(): Promise<{ tables: Array<{ name: string; kind: 'TABLE' | 'MASTER'; masterOnly: boolean; exists: boolean }>; maxRows: number }>;
  exportTableCsv(tableName: string, includeDeleted: boolean): Promise<{ tableName: string; filename: string; csv: string; rowCount: number; skippedDeleted: number; truncated: boolean; maxRows: number }>;
  // v376.65: 規程・重要事項マスタ
  listRegulations(): Promise<import('../types').Regulation[]>;
  saveRegulation(payload: Partial<import('../types').Regulation>): Promise<{ id: string; version: number; created: boolean }>;
  deleteRegulation(id: string): Promise<{ id: string; deleted: boolean }>;
  listMailTemplates(category: string): Promise<{ templates: import('../types').EmailTemplate[] }>;
  saveMailTemplate(payload: { id?: string; category: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate>;
  deleteMailTemplate(id: string): Promise<{ deletedId: string }>;
  // v224: 一括メール テンプレート管理
  getBulkMailTemplates(): Promise<import('../types').EmailTemplate[]>;
  saveBulkMailTemplate(payload: { id?: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate>;
  deleteBulkMailTemplate(id: string): Promise<{ deletedId: string }>;
  // v258: 論理削除コンソール（MASTER専用）
  searchMembersForDelete(query: string): Promise<MemberDeleteSearchResult[]>;
  previewDeleteMember(targetKeys: string[]): Promise<MemberDeletePreview>;
  executeDeleteMember(targetKeys: string[], confirmText: string): Promise<MemberDeleteResult>;
  getDeleteLogs(limit?: number): Promise<DeleteLogEntry[]>;
  // v233: 重複職員レコード修復（MASTER専用）
  repairDuplicateStaffRecords(): Promise<{ repaired: number }>;
  // v234: 研修申込の申込者ID不整合修復（MASTER専用）
  repairTrainingApplicationApplicantIds(): Promise<{ repaired: number; skipped: number }>;
  // v237: 会員CM番号重複修復（MASTER専用）
  repairMemberCareManagerDuplicates(): Promise<{ repaired: number; details: { memberId: string; careManagerNumber: string }[] }>;
  // v295: 役員管理マスタ
  getOfficerMasterData(): Promise<import('../shared/types').OfficerMasterData>;
  saveOrganization(payload: { organizationCode: string; organizationName: string; organizationType?: string; displayOrder?: number; allOfficerVisible?: boolean; enabled?: boolean }): Promise<{ organizationCode: string }>;
  deleteOrganization(payload: { organizationCode: string }): Promise<{ deleted: boolean; organizationCode: string }>;
  saveOfficerRole(payload: { roleCode: string; roleName: string; organizationCode: string; isChairman?: boolean; displayOrder?: number; enabled?: boolean }): Promise<{ roleCode: string }>;
  deleteOfficerRole(payload: { roleCode: string }): Promise<{ deleted: boolean; roleCode: string }>;
  savePaymentType(payload: { typeCode: string; typeName: string; scope?: string; displayOrder?: number; enabled?: boolean }): Promise<{ typeCode: string }>;
  deletePaymentType(payload: { typeCode: string }): Promise<{ deleted: boolean; typeCode: string }>;
  saveWorkCategory(payload: { categoryCode: string; categoryName: string; organizationCode: string; unitPrice: number; displayOrder?: number; enabled?: boolean }): Promise<{ categoryCode: string }>;
  deleteWorkCategory(payload: { categoryCode: string }): Promise<{ deleted: boolean; categoryCode: string }>;
  // v295: 役員割当て管理
  getOfficerManagementData(): Promise<import('../shared/types').OfficerManagementData>;
  assignOfficer(payload: { memberId?: string; staffId?: string; roleCode: string; appointedDate?: string; note?: string }): Promise<{ officerId: string }>;
  resignOfficer(payload: { officerId: string; resignationDate?: string }): Promise<{ resigned: boolean; officerId: string }>;
  updateOfficerLinkage(payload: { officerId: string; newMemberId?: string; newStaffId?: string }): Promise<{ updated: boolean; officerId: string }>;
  updateOfficerRecord(payload: { officerId: string; roleCode?: string; appointedDate?: string; resignationDate?: string; note?: string }): Promise<{ updated: boolean; officerId: string }>;
  // v295: 振込口座管理（管理者用）
  getAdminBankAccount(payload: { memberId?: string; staffId?: string }): Promise<import('../shared/types').BankAccount | null>;
  saveAdminBankAccount(payload: import('../shared/types').SaveBankAccountPayload): Promise<{ accountId: string }>;
  deleteAdminBankAccount(payload: { memberId?: string; staffId?: string }): Promise<{ deleted: boolean }>;
  // v295: 支払い履歴管理
  getPaymentHistory(payload?: { memberId?: string }): Promise<import('../shared/types').PaymentRecord[]>;
  savePayment(payload: import('../shared/types').SavePaymentPayload): Promise<{ paymentId: string; totalAmount: number }>;
  deletePayment(payload: { paymentId: string }): Promise<{ deleted: boolean; paymentId: string }>;
  // v295: 会員自己サービス（役員のみ）— sessionToken は API クライアントが自動付与
  getMyOfficerStatus(): Promise<import('../shared/types').MemberOfficerStatus>;
  saveMyBankAccount(payload: Omit<import('../shared/types').SaveBankAccountPayload, 'memberId'>): Promise<{ accountId: string }>;
  // v296: 請求（会員自己サービス）
  getMyClaims(): Promise<import('../shared/types').ClaimRecord[]>;
  submitClaim(payload: import('../shared/types').SaveClaimPayload): Promise<{ claimId: string }>;
  deleteMyClaim(payload: { claimId: string }): Promise<{ deleted: boolean; claimId: string }>;
  uploadClaimAttachment(payload: { claimId?: string; base64: string; filename: string; mimeType: string }): Promise<import('../shared/types').ClaimAttachment>;
  removeClaimAttachment(payload: { claimId: string; fileId: string }): Promise<{ removed: boolean; fileId: string }>;
  // v296: 請求管理（管理者）
  getClaims(payload?: { status?: string; memberId?: string }): Promise<import('../shared/types').ClaimRecord[]>;
  approveClaim(payload: { claimId: string }): Promise<{ approved: boolean; claimId: string }>;
  rejectClaim(payload: { claimId: string; reason: string }): Promise<{ rejected: boolean; claimId: string }>;
  adminDeleteClaim(payload: { claimId: string }): Promise<{ deleted: boolean; claimId: string }>;
  // v309: 共有メモ（申し送りホワイトボード）
  getSharedMemo(key: string): Promise<SharedMemo>;
  saveSharedMemo(key: string, content: string, version: number): Promise<SharedMemoSaveResult>;
  // v372: 名簿出力 Visual Template Designer
  getRosterFieldDictionary(): Promise<import('../types').RosterFieldDef[]>;
  getRosterDesignerData(payload: { memberTypes?: string[]; memberStatus?: string; year?: number; outputUnit?: import('../types').RosterOutputUnit }): Promise<{ rows: import('../types').RosterDesignerRow[]; years: number[]; year: number; outputUnit?: import('../types').RosterOutputUnit }>;
  loadRosterTemplatesV2(): Promise<{ templates: import('../types').RosterTemplateV2[] }>;
  saveRosterTemplateV2(template: import('../types').RosterTemplateV2): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }>;
  deleteRosterTemplateV2(id: string): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }>;
  duplicateRosterTemplateV2(id: string): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }>;
  // v374.1: 公式LINE投稿依頼
  listLinePostRequests(payload: { status?: LinePostStatus | ''; targetType?: LinePostTargetType | ''; keyword?: string; limit?: number }): Promise<{ items: LinePostRequest[]; total: number; canManage?: boolean }>;
  getLinePostRequest(id: string): Promise<{ item: LinePostRequest }>;
  saveLinePostRequest(payload: {
    id?: string;
    text: string;
    trainingApplyUrl?: string;
    attachmentUrl?: string;
    attachmentKind?: LinePostAttachmentKind;
    attachmentName?: string;
    targetType: LinePostTargetType;
    targetId?: string;
    memo?: string;
    clearAttachment?: boolean;
    submitRequest?: boolean;
  }): Promise<{ item: LinePostRequest }>;
  uploadLinePostAttachment(payload: { base64: string; mimeType: string; fileName: string }): Promise<LinePostAttachmentUploadResult>;
  transitionLinePostRequest(payload: { id: string; action: 'request' | 'post' | 'withdraw' }): Promise<{ item: LinePostRequest }>;
  deleteLinePostRequest(id: string): Promise<{ ok: boolean; id: string }>;
}

export interface MemberDeleteSearchResult {
  targetKey: string;
  targetKind: 'MEMBER' | 'STAFF';
  memberId: string;
  staffId?: string;
  displayName: string;
  memberType: string;
  memberStatus: string;
  staffRole?: string;
  staffStatus?: string;
  loginId: string;
  isDeleted: boolean;
}

export interface MemberDeletePreview {
  targets: Array<{
    targetKey: string;
    targetKind: 'MEMBER' | 'STAFF';
    memberId: string;
    staffId?: string;
    displayName: string;
    memberType: string;
    memberStatus: string;
    staffRole?: string;
    staffStatus?: string;
    loginId?: string;
  }>;
  counts: Record<string, number>;
  retainedCounts: Record<string, number>;
  totalRows: number;
  totalUpdatedRows: number;
}

export interface MemberDeleteResult {
  logId: string;
  archivedTargetKeys: string[];
  affectedCounts: Record<string, number>;
  retainedCounts: Record<string, number>;
}

export interface DeleteLogEntry {
  logId: string;
  operatedAt: string;
  operatorEmail: string;
  memberIdList: string;
  totalAffectedRows: number;
}


const seedToDigit = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return String(hash % 100000000).padStart(8, '0');
};

const buildSupportLoginId = (seed: string): string => `9${seedToDigit(seed)}`;

const resolveLoginIdByRule = (candidate: string | undefined, fallbackSeed: string): string => {
  const normalized = String(candidate || '').trim();
  if (CARE_MANAGER_NO_PATTERN.test(normalized)) return normalized;
  if (/^9\d{8}$/.test(normalized)) return normalized;
  return buildSupportLoginId(fallbackSeed);
};

const normalizeMemberLoginIds = (members: Member[]): Member[] =>
  members.map((member) => {
    const baseLoginId = resolveLoginIdByRule(member.careManagerNumber || member.loginId || member.id, `member-${member.id}`);
    if (member.type !== 'BUSINESS') {
      return { ...member, loginId: baseLoginId };
    }
    const normalizedStaff = (member.staff || []).map((staff) => ({
      ...staff,
      loginId: resolveLoginIdByRule(staff.careManagerNumber || staff.loginId, `staff-${member.id}-${staff.id}`),
    }));
    return { ...member, loginId: baseLoginId, staff: normalizedStaff };
  });

const deriveTrainingStatusByCloseDate = (applicationCloseDate?: string): 'OPEN' | 'CLOSED' => {
  const raw = String(applicationCloseDate || '').trim();
  if (!raw) return 'OPEN';
  const close = new Date(raw);
  if (Number.isNaN(close.getTime())) return 'OPEN';
  close.setHours(23, 59, 59, 999);
  return Date.now() > close.getTime() ? 'CLOSED' : 'OPEN';
};

const normalizeInquiryContactForTraining = (training: Training): Training => {
  const organizer = String(training.organizer || '').trim();
  if (!organizer) {
    throw new Error('主催者を入力してください。');
  }
  const location = String(training.location || '').trim();
  if (!location) {
    throw new Error('開催場所を入力してください。');
  }
  const summary = String(training.summary || '').trim();
  if (!summary) {
    throw new Error('研修概要を入力してください。');
  }

  const inquiryPerson = String(training.inquiryPerson || '').trim();
  if (!inquiryPerson) {
    throw new Error('問い合わせ窓口の担当者を入力してください。');
  }
  const contactValue = String(training.inquiryContactValue || '').trim();
  if (!contactValue) {
    throw new Error('問い合わせ窓口の連絡先を入力してください。');
  }
  if (!EMAIL_PATTERN.test(contactValue) && !PHONE_PATTERN.test(contactValue)) {
    throw new Error('問い合わせ窓口の連絡先は電話番号またはメールアドレス形式で入力してください。');
  }
  return {
    ...training,
    organizer,
    location,
    summary,
    status: deriveTrainingStatusByCloseDate(training.applicationCloseDate),
    inquiryPerson,
    inquiryContactValue: contactValue,
    inquiryContactType: EMAIL_PATTERN.test(contactValue) ? 'EMAIL' : 'PHONE',
  };
};

const GAS_RUNTIME_REQUIRED_MESSAGE = 'この画面は Google Apps Script Web アプリ上でのみ利用できます。ローカルのモック運用は廃止しました。';

// --- GAS Implementation (Production) ---
class GasApiClient implements ApiClient {
  private memberSessionToken: string | null = null;

  setMemberSessionToken(token: string | null): void {
    this.memberSessionToken = token;
  }

  private memberSessionPayload(): { sessionToken?: string } {
    return this.memberSessionToken ? { sessionToken: this.memberSessionToken } : {};
  }

  async fetchAllData(): Promise<{ members: Member[], trainings: Training[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              const data = parsed.data || { members: [], trainings: [] };
              resolve({
                members: normalizeMemberLoginIds(data.members || []),
                trainings: data.trainings || [],
              });
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch (e) {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => {
          reject(error);
        })
        .processApiRequest('fetchAllData', null);
    });
  }

  async getMemberPortalData(lookup: MemberPortalLookup): Promise<{ members: Member[], trainings: Training[], resolvedMemberId?: string, resolvedStaffId?: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }

      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              const data = parsed.data || { members: [], trainings: [] };
              resolve({
                members: normalizeMemberLoginIds(data.members || []),
                trainings: data.trainings || [],
                resolvedMemberId: data.resolvedMemberId,
                resolvedStaffId: data.resolvedStaffId,
              });
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getMemberPortalData', JSON.stringify({ ...lookup, ...this.memberSessionPayload() }));
    });
  }

  async getAdminDashboardData(): Promise<AdminDashboardData> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }

      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              resolve(parsed.data || {
                memberCount: 0,
                paidCount: 0,
                unpaidCount: 0,
                emailCount: 0,
                postCount: 0,
                openTrainingCount: 0,
                memberRows: [],
                trainingRows: [],
              });
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAdminDashboardData', null);
    });
  }

  // v150: 管理者初期データ統合API（1回のround-tripでdashboard+settingsを取得）
  async getAdminInitData(): Promise<{ dashboard: AdminDashboardData; settings: SystemSettings }> {
    return this.callAction('getAdminInitData', null);
  }

  async getTrainingManagementData(): Promise<Training[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }

      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              resolve(parsed.data || []);
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getTrainingManagementData', null);
    });
  }

  async updateMember(member: Member): Promise<void> {
    return this.callAction('updateMember', member);
  }

  async updateMemberSelf(member: Member, loginId: string): Promise<void> {
    return this.callAction('updateMemberSelf', { ...member, loginId, ...this.memberSessionPayload() });
  }

  async changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void> {
    return this.callAction('changePassword', { loginId, currentPassword, newPassword, ...this.memberSessionPayload() });
  }

  async getMemberAuthAccounts(memberId: string): Promise<Array<{ issued: boolean; authId: string; loginId: string; method: string; active: boolean; locked: boolean; unit: 'MEMBER' | 'STAFF'; memberId: string; staffId: string; personName: string }>> {
    return this.callAction('getMemberAuthAccounts', { memberId });
  }

  async adminResetMemberPassword(authId: string): Promise<{ loginId: string; newPassword: string; resetAt: string }> {
    return this.callAction('adminResetMemberPassword', { authId });
  }

  async adminUnlockMemberAccount(authId: string): Promise<{ authId: string; loginId: string; wasLocked: boolean; failedCountBefore: number; unlockedAt: string }> {
    return this.callAction('adminUnlockMemberAccount', { authId });
  }

  async adminIssueMemberCredential(memberId: string, staffId?: string): Promise<{ authId: string; loginId: string; newPassword: string; issuedAt: string; personName: string }> {
    return this.callAction('adminIssueMemberCredential', { memberId, staffId: staffId || '' });
  }

  async getSystemSettings(): Promise<SystemSettings> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || { defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18, annualFeePaymentGuidance: '' });
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getSystemSettings', null);
    });
  }

  async updateSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || { defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18, annualFeePaymentGuidance: '' });
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('updateSystemSettings', JSON.stringify(settings));
    });
  }

  async getAnnualFeeAdminData(year?: number): Promise<AnnualFeeAdminData> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              resolve(parsed.data || { selectedYear: new Date().getFullYear(), records: [], years: [], auditLogs: [], summary: { eligibleCount: 0, paidCount: 0, unpaidCount: 0, paidAmount: 0, unpaidAmount: 0, memberTypeBreakdown: [] } });
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAnnualFeeAdminData', JSON.stringify({ year }));
    });
  }

  async saveAnnualFeeRecord(record: {
    id?: string;
    memberId: string;
    year: number;
    status: 'PAID' | 'UNPAID';
    confirmedDate?: string;
    note?: string;
  }): Promise<AnnualFeeAdminRecord> {
    return this.callAction('saveAnnualFeeRecord', record);
  }

  async saveAnnualFeeRecordsBatch(records: Array<{
    id?: string;
    memberId: string;
    year: number;
    status: 'PAID' | 'UNPAID' | 'WITHDRAW';
    confirmedDate?: string;
    note?: string;
  }>): Promise<{ savedRecords: AnnualFeeAdminRecord[]; withdrawnMemberIds: string[] }> {
    return this.callAction('saveAnnualFeeRecordsBatch', { records });
  }

  async memberLogin(loginId: string, password: string): Promise<MemberLoginResult> {
    return this.callAction('memberLogin', { loginId, password });
  }

  async requestPasswordReset(loginId: string, email: string): Promise<{ message: string; expiresInMinutes: number }> {
    return this.callAction('requestPasswordReset', { loginId, email });
  }

  async completePasswordReset(loginId: string, code: string, newPassword: string): Promise<{ message: string; updatedAt: string }> {
    return this.callAction('completePasswordReset', { loginId, code, newPassword });
  }

  async checkAdminBySession(): Promise<AdminLoginResult> {
    return this.callAction('checkAdminBySession', null);
  }

  async getAdminPermissionData(): Promise<AdminPermissionData> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              resolve(parsed.data || { entries: [], identityOptions: [], currentSessionEmail: '' });
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAdminPermissionData', null);
    });
  }

  async saveAdminPermission(payload: {
    id?: string;
    googleEmail: string;
    linkedAuthId: string;
    permissionLevel: AdminPermissionLevel;
    enabled: boolean;
  }): Promise<void> {
    return this.callAction('saveAdminPermission', payload);
  }

  async deleteAdminPermission(id: string): Promise<void> {
    return this.callAction('deleteAdminPermission', { id });
  }

  // docs/246 Phase 2-A: ロール CRUD（汎用 dispatcher で簡潔に）
  // callAction と同一実装だった重複 helper を委譲に一本化（2026-07-05 DRY 是正・docs/248 行5）
  private async runAction<T>(action: string, payload: object | null): Promise<T> {
    return this.callAction<T>(action, payload);
  }

  async listRoles(): Promise<{ roles: RoleDefinition[]; menuRegistry: MenuRegistryEntry[] }> {
    return this.runAction('listRoles', {});
  }

  async saveRole(payload: {
    roleId?: string;
    roleName: string;
    description?: string;
    allowedMenus: string[];
    trainingEditScope: 'ALL' | 'OWN';
  }): Promise<{ saved: true; roleId: string; isNew: boolean }> {
    return this.runAction('saveRole', payload);
  }

  async deleteRole(roleId: string): Promise<{ deleted: true; roleId: string }> {
    return this.runAction('deleteRole', { roleId });
  }

  async duplicateRole(payload: { sourceRoleId: string; newRoleName?: string }): Promise<{ saved: true; roleId: string; isNew: boolean }> {
    return this.runAction('duplicateRole', payload);
  }

  async saveTraining(training: Training): Promise<Training> {
    return this.callAction('saveTraining', training);
  }

  // v376.7: 研修 soft delete
  async softDeleteTraining(trainingId: string): Promise<{ trainingId: string; applicantCount: number; deleted: true; alreadyDeleted?: boolean }> {
    return this.callAction('softDeleteTraining', { trainingId });
  }

  // v376.7: 研修 restore（削除取消）
  async restoreTraining(trainingId: string): Promise<{ trainingId: string; restored: true; alreadyActive?: boolean }> {
    return this.callAction('restoreTraining', { trainingId });
  }

  async uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string; driveFileId?: string; thumbnailUrl?: string; thumbnailGenerationStatus?: 'generated' | 'pending' | 'failed' | 'skipped' }> {
    return this.callAction('uploadTrainingFile', { base64, filename, mimeType });
  }

  async regenerateThumbnailForTraining(trainingId: string): Promise<{ trainingId: string; thumbnailUrl: string; thumbnailGenerationStatus: 'generated' | 'pending' | 'failed' | 'skipped'; reason?: string }> {
    return this.callAction('regenerateThumbnailForTraining', { trainingId });
  }

  async getFileThumbnail(fileUrl: string, size?: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              resolve((parsed.data && parsed.data.thumbnail) || null);
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getFileThumbnail', JSON.stringify({ fileUrl, size: size || 0, ...this.memberSessionPayload() }));
    });
  }

  async applyTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ applicationId: string; applicants: number; duplicate?: boolean }> {
    return this.callAction('applyTraining', { ...request, ...this.memberSessionPayload() });
  }

  async cancelTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ canceled: boolean; applicants: number }> {
    return this.callAction('cancelTraining', { ...request, ...this.memberSessionPayload() });
  }

  async getTrainingApplicants(trainingId: string): Promise<TrainingApplicantRow[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || []);
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getTrainingApplicants', JSON.stringify({ trainingId }));
    });
  }

  async getAdminEmailAliases(): Promise<AdminEmailAliasesResult> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || { aliases: [], warning: '' });
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAdminEmailAliases', null);
    });
  }

  async sendTrainingMail(payload: TrainingMailPayload): Promise<{ sent: number; errors: string[] }> {
    return this.callAction('sendTrainingMail', payload);
  }

  // ── v360: 研修名簿管理 API ──────────────────────────────────────
  private callAction<T>(action: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data);
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest(action, payload === null ? null : JSON.stringify(payload));
    });
  }

  getTrainingRosterDetail(trainingId: string) {
    return this.callAction<{ applicants: TrainingRosterRow[] }>('getTrainingRosterDetail', { trainingId });
  }
  saveAttendance(payload: { applyId: string; status: AttendanceStatus }) {
    return this.callAction<{ ok: boolean; recordedAt?: string; error?: string }>('saveAttendance', payload);
  }
  saveAttendanceBatch(entries: Array<{ applyId: string; status: AttendanceStatus }>) {
    return this.callAction<{ results: any[] }>('saveAttendanceBatch', { entries });
  }
  addRosterEntry(payload: { trainingId: string; memberId?: string; staffId?: string; memo?: string }) {
    return this.callAction<{ ok: boolean; applyId?: string; error?: string }>('addRosterEntry', payload);
  }
  addGuestRosterEntry(payload: { trainingId: string; guest: { name: string; kana?: string; email?: string; phone?: string; officeName?: string }; memo?: string }) {
    return this.callAction<{ ok: boolean; applyId?: string; externalId?: string; error?: string }>('addGuestRosterEntry', payload);
  }
  cancelRosterEntry(payload: { applyId: string; reason?: string }) {
    return this.callAction<{ ok: boolean; error?: string }>('cancelRosterEntry', payload);
  }
  updateRosterEntry(payload: { applyId: string; adminMemo?: string }) {
    return this.callAction<{ ok: boolean; error?: string }>('updateRosterEntry', payload);
  }
  getTrainingStats(trainingId: string) {
    return this.callAction<TrainingStats>('getTrainingStats', { trainingId });
  }
  async submitMemberApplication(payload: any): Promise<any> {
    return this.callAction('submitMemberApplication', payload);
  }

  async withdrawMember(memberId: string, withdrawnDate?: string, midYearWithdrawal?: boolean): Promise<{ withdrawn: boolean; memberId: string; withdrawnDate: string }> {
    return this.callAction('withdrawMember', { memberId, withdrawnDate, midYearWithdrawal });
  }

  async withdrawSelf(loginId: string, password: string, memberId: string): Promise<{ scheduled: boolean; memberId: string; withdrawnDate: string }> {
    return this.callAction('withdrawSelf', { loginId, password, memberId, ...this.memberSessionPayload() });
  }

  async cancelWithdrawalSelf(loginId: string, password: string, memberId: string): Promise<{ canceled: boolean; memberId: string }> {
    return this.callAction('cancelWithdrawalSelf', { loginId, password, memberId, ...this.memberSessionPayload() });
  }

  // v125: 事業所職員の除籍
  async removeStaffFromOffice(memberId: string, staffId: string): Promise<{ removed: boolean; staffId: string }> {
    return this.callAction('removeStaffFromOffice', { memberId, staffId });
  }

  // v125: フラット人物リスト取得
  async getAdminPersonList(): Promise<{ persons: AdminPersonRow[] }> {
    return this.callAction('getAdminPersonList', {});
  }

  // v125: フラット人物一括更新
  async updatePersonsBatch(records: Array<Record<string, any>>): Promise<Array<Record<string, any>>> {
    return this.callAction('updatePersonsBatch', { records });
  }

  // v125: 会員種別変更
  async convertMemberType(payload: ConvertMemberTypePayload): Promise<ConvertMemberTypeResult> {
    return this.callAction('convertMemberType', payload);
  }

  // v126: 事業所会員の予約退会
  async scheduleWithdrawMember(memberId: string): Promise<{ scheduled: boolean; memberId: string; withdrawnDate: string }> {
    return this.callAction('scheduleWithdrawMember', { memberId });
  }

  // v126: 予約退会キャンセル
  async cancelScheduledWithdraw(memberId: string): Promise<{ cancelled: boolean; memberId: string }> {
    return this.callAction('cancelScheduledWithdraw', { memberId });
  }

  // v127: 職員個別更新（status 対応追加）/ v133: mailingPreference 追加
  async updateStaff(payload: { staffId: string; memberId: string; lastName?: string; firstName?: string; lastKana?: string; firstKana?: string; name?: string; kana?: string; email?: string; careManagerNumber?: string; role?: string; status?: string; joinedDate?: string; withdrawnDate?: string; mailingPreference?: string }): Promise<{ updated: boolean; staffId: string; memberId: string; status?: string; role?: string }> {
    return this.callAction('updateStaff', payload);
  }

  // v188: AI案内メール生成（GASサーバー側でGemini APIを呼ぶ）
  async generateTrainingEmail(payload: { training: Training; recipientName?: string }): Promise<{ ok: boolean; text: string }> {
    return this.callAction('generateTrainingEmail', payload);
  }

  // v194: 会員一括メール送信
  async getMembersForBulkMail(payload: {
    memberTypes?: string[];
    memberStatus?: string;
    staffStatus?: string;
    mailingFilter?: string;
    excludeNoEmail?: boolean;
  }): Promise<BulkMailRecipient[]> {
    return this.callAction('getMembersForBulkMail', payload);
  }

  async sendBulkMemberMail(payload: {
    recipientKeys: string[];
    from: string;
    subject: string;
    body: string;
    commonAttachments?: Array<{ name: string; mimeType: string; base64: string }>;
    individualAttachments?: Record<string, { name: string; mimeType: string; base64: string }>;
    useAutoAttach?: boolean;
    memberTypes?: string[];
    memberStatus?: string;
    staffStatus?: string;
    mailingFilter?: string;
    excludeNoEmail?: boolean;
  }): Promise<{ sent: number; total: number; errors: string[]; autoAttachMissed: string[]; logId: string }> {
    return this.callAction('sendBulkMemberMail', payload);
  }

  async getEmailSendLog(): Promise<EmailSendLog[]> {
    return this.callAction('getEmailSendLog', {});
  }

  // v207/v291: 宛名リスト対象取得・Excel 出力
  async getMailingListTargets(payload: { filterType: MailingListFilterType; year?: number }): Promise<MailingListTargetsResult> {
    return this.callAction('getMailingListTargets', payload);
  }

  async generateMailingListExcel(payload: { filterType: MailingListFilterType; year?: number; targetKeys?: string[] }): Promise<MailingListExcelResult> {
    return this.callAction('generateMailingListExcel', payload);
  }

  // v219: 入会メール テンプレート管理
  async getCredentialEmailTemplates(): Promise<import('../types').EmailTemplate[]> {
    return this.callAction('getCredentialEmailTemplates', {});
  }

  async saveCredentialEmailTemplate(payload: { id?: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate> {
    return this.callAction('saveCredentialEmailTemplate', payload);
  }

  async deleteCredentialEmailTemplate(id: string): Promise<{ deletedId: string }> {
    return this.callAction('deleteCredentialEmailTemplate', { id });
  }

  // v376.42: 全メール種別 テンプレート管理（汎用・カテゴリ別）
  async listExportableTables(): Promise<{ tables: Array<{ name: string; kind: 'TABLE' | 'MASTER'; masterOnly: boolean; exists: boolean }>; maxRows: number }> {
    return this.callAction('listExportableTables', {});
  }

  async exportTableCsv(tableName: string, includeDeleted: boolean): Promise<{ tableName: string; filename: string; csv: string; rowCount: number; skippedDeleted: number; truncated: boolean; maxRows: number }> {
    return this.callAction('exportTableCsv', { tableName, includeDeleted });
  }

  async listRegulations(): Promise<import('../types').Regulation[]> {
    return this.callAction('listRegulations', {});
  }

  async saveRegulation(payload: Partial<import('../types').Regulation>): Promise<{ id: string; version: number; created: boolean }> {
    return this.callAction('saveRegulation', payload);
  }

  async deleteRegulation(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.callAction('deleteRegulation', { id });
  }

  async listMailTemplates(category: string): Promise<{ templates: import('../types').EmailTemplate[] }> {
    return this.callAction('listMailTemplates', { category });
  }

  async saveMailTemplate(payload: { id?: string; category: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate> {
    return this.callAction('saveMailTemplate', payload);
  }

  async deleteMailTemplate(id: string): Promise<{ deletedId: string }> {
    return this.callAction('deleteMailTemplate', { id });
  }

  // v224: 一括メール テンプレート管理
  async getBulkMailTemplates(): Promise<import('../types').EmailTemplate[]> {
    return this.callAction('getBulkMailTemplates', {});
  }

  async saveBulkMailTemplate(payload: { id?: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate> {
    return this.callAction('saveBulkMailTemplate', payload);
  }

  async deleteBulkMailTemplate(id: string): Promise<{ deletedId: string }> {
    return this.callAction('deleteBulkMailTemplate', { id });
  }

  // v258: 論理削除
  async searchMembersForDelete(query: string): Promise<import('./api').MemberDeleteSearchResult[]> {
    return this.callAction('searchMembersForDelete', { query });
  }

  async previewDeleteMember(targetKeys: string[]): Promise<import('./api').MemberDeletePreview> {
    return this.callAction('previewDeleteMember', { targetKeys });
  }

  async executeDeleteMember(targetKeys: string[], confirmText: string): Promise<import('./api').MemberDeleteResult> {
    return this.callAction('executeDeleteMember', { targetKeys, confirmText });
  }

  async getDeleteLogs(limit = 20): Promise<import('./api').DeleteLogEntry[]> {
    return this.callAction('getDeleteLogs', { limit });
  }

  async repairDuplicateStaffRecords(): Promise<{ repaired: number }> {
    return this.callAction('repairDuplicateStaffRecords', {});
  }

  async repairTrainingApplicationApplicantIds(): Promise<{ repaired: number; skipped: number }> {
    return this.callAction('repairTrainingApplicationApplicantIds', {});
  }

  async repairMemberCareManagerDuplicates(): Promise<{ repaired: number; details: { memberId: string; careManagerNumber: string }[] }> {
    return this.callAction('repairMemberCareManagerDuplicates', {});
  }

  // ---- v295: 役員管理マスタ ----

  async getOfficerMasterData(): Promise<import('../shared/types').OfficerMasterData> {
    return this.callAction('getOfficerMasterData', this.memberSessionPayload());
  }

  async saveOrganization(payload: { organizationCode: string; organizationName: string; organizationType?: string; displayOrder?: number; allOfficerVisible?: boolean; enabled?: boolean }): Promise<{ organizationCode: string }> {
    return this.callAction('saveOrganization', payload);
  }

  async deleteOrganization(payload: { organizationCode: string }): Promise<{ deleted: boolean; organizationCode: string }> {
    return this.callAction('deleteOrganization', payload);
  }

  async saveOfficerRole(payload: { roleCode: string; roleName: string; organizationCode: string; isChairman?: boolean; displayOrder?: number; enabled?: boolean }): Promise<{ roleCode: string }> {
    return this.callAction('saveOfficerRole', payload);
  }

  async deleteOfficerRole(payload: { roleCode: string }): Promise<{ deleted: boolean; roleCode: string }> {
    return this.callAction('deleteOfficerRole', payload);
  }

  async savePaymentType(payload: { typeCode: string; typeName: string; scope?: string; displayOrder?: number; enabled?: boolean }): Promise<{ typeCode: string }> {
    return this.callAction('savePaymentType', payload);
  }

  async deletePaymentType(payload: { typeCode: string }): Promise<{ deleted: boolean; typeCode: string }> {
    return this.callAction('deletePaymentType', payload);
  }

  async saveWorkCategory(payload: { categoryCode: string; categoryName: string; organizationCode: string; unitPrice: number; displayOrder?: number; enabled?: boolean }): Promise<{ categoryCode: string }> {
    return this.callAction('saveWorkCategory', payload);
  }

  async deleteWorkCategory(payload: { categoryCode: string }): Promise<{ deleted: boolean; categoryCode: string }> {
    return this.callAction('deleteWorkCategory', payload);
  }

  // ---- v295: 役員割当て管理 ----

  async getOfficerManagementData(): Promise<import('../shared/types').OfficerManagementData> {
    return this.callAction('getOfficerManagementData', {});
  }

  async updateOfficerLinkage(payload: { officerId: string; newMemberId?: string; newStaffId?: string }): Promise<{ updated: boolean; officerId: string }> {
    return this.callAction('updateOfficerLinkage', payload);
  }

  async assignOfficer(payload: { memberId?: string; staffId?: string; roleCode: string; appointedDate?: string; note?: string }): Promise<{ officerId: string }> {
    return this.callAction('assignOfficer', payload);
  }

  async resignOfficer(payload: { officerId: string; resignationDate?: string }): Promise<{ resigned: boolean; officerId: string }> {
    return this.callAction('resignOfficer', payload);
  }

  async updateOfficerRecord(payload: { officerId: string; roleCode?: string; appointedDate?: string; resignationDate?: string; note?: string }): Promise<{ updated: boolean; officerId: string }> {
    return this.callAction('updateOfficerRecord', payload);
  }

  // ---- v295: 振込口座管理（管理者用）----

  async getAdminBankAccount(payload: { memberId?: string; staffId?: string }): Promise<import('../shared/types').BankAccount | null> {
    return this.callAction('getAdminBankAccount', payload);
  }

  async saveAdminBankAccount(payload: import('../shared/types').SaveBankAccountPayload): Promise<{ accountId: string }> {
    return this.callAction('saveAdminBankAccount', payload);
  }

  async deleteAdminBankAccount(payload: { memberId?: string; staffId?: string }): Promise<{ deleted: boolean }> {
    return this.callAction('deleteAdminBankAccount', payload);
  }

  // ---- v295: 支払い履歴管理 ----

  async getPaymentHistory(payload?: { memberId?: string }): Promise<import('../shared/types').PaymentRecord[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getPaymentHistory', JSON.stringify(payload || {}));
    });
  }

  async savePayment(payload: import('../shared/types').SavePaymentPayload): Promise<{ paymentId: string; totalAmount: number }> {
    return this.callAction('savePayment', payload);
  }

  async deletePayment(payload: { paymentId: string }): Promise<{ deleted: boolean; paymentId: string }> {
    return this.callAction('deletePayment', payload);
  }

  // ---- v295: 会員自己サービス（役員のみ）----

  async getMyOfficerStatus(): Promise<import('../shared/types').MemberOfficerStatus> {
    return this.callAction('getMyOfficerStatus', this.memberSessionPayload());
  }

  async getMyClaims(): Promise<import('../shared/types').ClaimRecord[]> {
    return this.callAction('getMyClaims', this.memberSessionPayload());
  }

  async submitClaim(payload: import('../shared/types').SaveClaimPayload): Promise<{ claimId: string }> {
    return this.callAction('submitClaim', { ...payload, ...this.memberSessionPayload() });
  }

  async deleteMyClaim(payload: { claimId: string }): Promise<{ deleted: boolean; claimId: string }> {
    return this.callAction('deleteMyClaim', { ...payload, ...this.memberSessionPayload() });
  }

  async uploadClaimAttachment(payload: { claimId?: string; base64: string; filename: string; mimeType: string }): Promise<import('../shared/types').ClaimAttachment> {
    return this.callAction('uploadClaimAttachment', { ...payload, ...this.memberSessionPayload() });
  }

  async removeClaimAttachment(payload: { claimId: string; fileId: string }): Promise<{ removed: boolean; fileId: string }> {
    return this.callAction('removeClaimAttachment', { ...payload, ...this.memberSessionPayload() });
  }

  async getClaims(payload?: { status?: string; memberId?: string }): Promise<import('../shared/types').ClaimRecord[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('getClaims', JSON.stringify(payload || {}));
    });
  }

  async approveClaim(payload: { claimId: string }): Promise<{ approved: boolean; claimId: string }> {
    return this.callAction('approveClaim', payload);
  }

  async rejectClaim(payload: { claimId: string; reason: string }): Promise<{ rejected: boolean; claimId: string }> {
    return this.callAction('rejectClaim', payload);
  }

  async adminDeleteClaim(payload: { claimId: string }): Promise<{ deleted: boolean; claimId: string }> {
    return this.callAction('adminDeleteClaim', payload);
  }

  // v372: 名簿出力 Visual Template Designer
  async getRosterFieldDictionary(): Promise<import('../types').RosterFieldDef[]> {
    return this.callAction('getRosterFieldDictionary', {});
  }

  async getRosterDesignerData(payload: { memberTypes?: string[]; memberStatus?: string; year?: number; outputUnit?: import('../types').RosterOutputUnit }): Promise<{ rows: import('../types').RosterDesignerRow[]; years: number[]; year: number; outputUnit?: import('../types').RosterOutputUnit }> {
    return this.callAction('getRosterDesignerData', payload);
  }

  async loadRosterTemplatesV2(): Promise<{ templates: import('../types').RosterTemplateV2[] }> {
    return this.callAction('loadRosterTemplatesV2', {});
  }

  async saveRosterTemplateV2(template: import('../types').RosterTemplateV2): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }> {
    return this.callAction('saveRosterTemplateV2', { template });
  }

  async deleteRosterTemplateV2(id: string): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }> {
    return this.callAction('deleteRosterTemplateV2', { id });
  }

  async duplicateRosterTemplateV2(id: string): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }> {
    return this.callAction('duplicateRosterTemplateV2', { id });
  }

  // v374.1: 公式LINE投稿依頼
  async listLinePostRequests(payload: { status?: LinePostStatus | ''; targetType?: LinePostTargetType | ''; keyword?: string; limit?: number }) {
    return this.callAction<{ items: LinePostRequest[]; total: number; canManage?: boolean }>('listLinePostRequests', payload);
  }
  async getLinePostRequest(id: string) {
    return this.callAction<{ item: LinePostRequest }>('getLinePostRequest', { id });
  }
  async saveLinePostRequest(payload: {
    id?: string;
    text: string;
    trainingApplyUrl?: string;
    attachmentUrl?: string;
    attachmentKind?: LinePostAttachmentKind;
    attachmentName?: string;
    targetType: LinePostTargetType;
    targetId?: string;
    memo?: string;
    clearAttachment?: boolean;
    submitRequest?: boolean;
  }) {
    return this.callAction<{ item: LinePostRequest }>('saveLinePostRequest', payload);
  }
  async uploadLinePostAttachment(payload: { base64: string; mimeType: string; fileName: string }) {
    return this.callAction<LinePostAttachmentUploadResult>('uploadLinePostAttachment', payload);
  }
  async transitionLinePostRequest(payload: { id: string; action: 'request' | 'post' | 'withdraw' }) {
    return this.callAction<{ item: LinePostRequest }>('transitionLinePostRequest', payload);
  }
  async deleteLinePostRequest(id: string) {
    return this.callAction<{ ok: boolean; id: string }>('deleteLinePostRequest', { id });
  }

  async getSharedMemo(key: string): Promise<SharedMemo> {
    return this.callAction('getSharedMemo', { key });
  }

  async saveSharedMemo(key: string, content: string, version: number): Promise<SharedMemoSaveResult> {
    return this.callAction('saveSharedMemo', { key, content, version });
  }

  async saveMyBankAccount(payload: Omit<import('../shared/types').SaveBankAccountPayload, 'memberId'>): Promise<{ accountId: string }> {
    return this.callAction('saveMyBankAccount', { ...payload, ...this.memberSessionPayload() });
  }
}

// --- GCP Implementation (docs/250 Phase 1: transport の器のみ・実 API 接続は Phase 2) ---
const GCP_RUNTIME_NOT_IMPLEMENTED_MESSAGE =
  'GCP API runtime は未実装です（docs/250 Phase 2 で接続予定）。現行の GAS 版をご利用ください。';

// declaration merging: 実装本体は下の stub 導出ループが張るため、型面だけ ApiClient を満たす。
interface GcpApiClient extends ApiClient {}
class GcpApiClient {
  /** Phase 2 で Cloud Run API への Authorization 付与に使用する（現段階では保持のみ） */
  memberSessionToken: string | null = null;
  /** GCP runtime 専用の API base URL（Phase 2 で fetch 先として使用） */
  readonly apiBaseUrl: string;

  // parameter property は Node --experimental-strip-types 非対応構文のため使わない（unit test で import するため）
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  setMemberSessionToken(token: string | null): void {
    this.memberSessionToken = token;
  }

  // docs/250 Phase 3: read-only action に限る fetch transport（PHASE3_DESIGN §3）。
  // allowlist（GCP_READ_ACTIONS）外は callGcpApi 側で deny-by-default reject するため、
  // ApiClient interface の各 method は下の stub 導出ループの「未実装」reject のまま変わらない。
  // member read 拡張（PHASE3_DESIGN §6）はこの呼び口に Authorization を差し替えて使う。
  callAction<T>(action: string, payload: unknown): Promise<T> {
    return callGcpApi<T>(action, payload, {
      apiRuntime: 'gcp',
      apiBaseUrl: this.apiBaseUrl,
      apiAuthToken: typeof window !== 'undefined' ? window.__APP_CONFIG__?.apiAuthToken : undefined,
    });
  }
}
// ApiClient 全 method の stub を GasApiClient の prototype から導出して張る。
// 手書きの写経をしないことで、interface へ method が増えても GCP 側が型ごと追随し
// keep-list ドリフト（feedback_admin_editor_keep_list と同種）を起こさない。
for (const name of Object.getOwnPropertyNames(GasApiClient.prototype)) {
  if (name === 'constructor') continue;
  if (Object.prototype.hasOwnProperty.call(GcpApiClient.prototype, name)) continue;
  (GcpApiClient.prototype as unknown as Record<string, unknown>)[name] =
    function gcpRuntimeNotImplemented(): Promise<never> {
      return Promise.reject(new Error(GCP_RUNTIME_NOT_IMPLEMENTED_MESSAGE));
    };
}

// --- Runtime selection (docs/250 Phase 1: GAS / GCP transport 分離) ---
export type ApiRuntime = 'gas' | 'gcp';

export interface AppRuntimeConfig {
  apiRuntime?: ApiRuntime;
  /** GCP runtime 専用の API base URL。GAS 配信では設定しない */
  apiBaseUrl?: string;
  /** GCP runtime のローカル検証専用 Bearer token。build 生成物には決して注入しない（PHASE3_DESIGN §3） */
  apiAuthToken?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppRuntimeConfig;
  }
}

// 既定は 'gas'（現行本番）。'gcp' は config で明示された場合のみ選択する。
export function createApiClient(config?: AppRuntimeConfig): ApiClient {
  if (config?.apiRuntime === 'gcp') {
    return new GcpApiClient(config.apiBaseUrl || '');
  }
  return new GasApiClient();
}

// GAS 配信時は build 時に window.__APP_CONFIG__={apiRuntime:'gas'} が注入される（scripts/compress-html.mjs）。
// 未注入の環境（vite dev 等）でも既定 'gas' に fallback するため従来挙動と同一。
// ローカルモック運用は廃止済みのため、GAS 実行環境外では従来どおり実行時エラーとなる。
export const api: ApiClient = createApiClient(typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined);

// ── ロール視点プレビュー（MASTER 専用）の閲覧専用ガード ───────────────────────
// docs/246 View-as-role: MASTER が他ロールの見え方をプレビュー中は、サーバー権限は
// MASTER のまま（フロント描画のみ模擬）だが、ベストプラクティス「誤操作防止＝閲覧優先」に
// 従い、書込系 API をクライアント側で遮断して "閲覧のみ" を担保する。
//
// 方式: 読取接頭辞（get/list/search/fetch/check/load/preview）以外の API メソッドを
// preview 中ブロックする deny-by-default。新規追加された書込 API も自動的にブロックされ、
// keep-list 的なドリフト（feedback_admin_editor_keep_list）を起こさない。
// private dispatch / 同期ヘルパーだけは決して包まない（読取系も巻き添えにしないため）。
let previewReadOnlyActive = false;
export function setApiPreviewReadOnly(on: boolean): void { previewReadOnlyActive = on; }
export function isApiPreviewReadOnly(): boolean { return previewReadOnlyActive; }
export const PREVIEW_READONLY_MESSAGE =
  'ロール視点プレビュー中は閲覧のみです（保存・送信・削除は実行されません）。プレビューを終了してから操作してください。';

const PREVIEW_READ_PREFIXES = ['get', 'list', 'search', 'fetch', 'check', 'load', 'preview'];
// 包んではいけない非書込メンバー（同期 setter / private dispatch / private ヘルパー）。
const PREVIEW_NEVER_GUARD = new Set([
  'constructor',
  'setMemberSessionToken',
  'memberSessionPayload',
  'runAction',
  'callAction',
]);

(function installPreviewWriteGuard(): void {
  const proto = Object.getPrototypeOf(api) as Record<string, unknown>;
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (PREVIEW_NEVER_GUARD.has(name)) continue;
    const original = proto[name];
    if (typeof original !== 'function') continue;
    // 読取系（get/list/... 接頭辞）は preview 中も常に許可。
    if (PREVIEW_READ_PREFIXES.some((p) => name.startsWith(p))) continue;
    const fn = original as (...args: unknown[]) => unknown;
    (api as unknown as Record<string, unknown>)[name] = function previewGuardedApiMethod(this: unknown, ...args: unknown[]) {
      if (previewReadOnlyActive) {
        return Promise.reject(new Error(PREVIEW_READONLY_MESSAGE));
      }
      return fn.apply(this, args);
    };
  }
})();
