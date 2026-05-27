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
  TrainingHistoryEntry,
  AttendanceStatus,
  // v374.1: 公式LINE投稿依頼
  LinePostRequest,
  LinePostStatus,
  LinePostTargetType,
  LinePostAttachmentKind,
  LinePostAttachmentUploadResult,
} from '../shared/types';
import { AdminDashboardData, AdminPermissionData, AnnualFeeAdminData, AnnualFeeAdminRecord } from '../types';

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
  adminLoginWithData(): Promise<{ auth: AdminLoginResult; portal: { members: Member[]; trainings: Training[] } }>;
  memberLoginWithData(loginId: string, password: string): Promise<{ auth: MemberLoginResult; portal: { members: Member[]; trainings: Training[] } }>;
  getTrainingManagementData(): Promise<Training[]>;
  updateMember(member: Member): Promise<void>;
  updateMembersBatch(members: Array<Partial<Member> & Pick<Member, 'id'>>): Promise<Array<{ updated: boolean; memberId: string }>>;
  updateMemberSelf(member: Member, loginId: string): Promise<void>;
  changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void>;
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
    enabled: boolean;
  }): Promise<void>;
  deleteAdminPermission(id: string): Promise<void>;
  saveTraining(training: Training): Promise<Training>;
  // v376.7: 研修 soft delete / restore
  softDeleteTraining(trainingId: string): Promise<{ trainingId: string; applicantCount: number; deleted: true; alreadyDeleted?: boolean }>;
  restoreTraining(trainingId: string): Promise<{ trainingId: string; restored: true; alreadyActive?: boolean }>;
  uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string; driveFileId?: string; thumbnailUrl?: string; thumbnailGenerationStatus?: 'generated' | 'pending' | 'failed' | 'skipped' }>;
  // v344: 案内PDF サムネイルを GAS proxy 経由で base64 data URL として取得（hotlink 制限回避）
  // v358: 第2引数 size を渡すと高解像度版（Drive thumbnailLink を w<size> で再取得）を返す
  getFileThumbnail(fileUrl: string, size?: number): Promise<string | null>;
  // v357: PDF 本体 bytes を GAS proxy 経由で base64 として取得（lightbox 内 iframe 用、10MB 上限）
  getFileBytes(fileUrl: string): Promise<{ base64: string | null; mimeType?: string; name?: string; size?: number; error?: string }>;
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
  getMemberTrainingHistory(payload: { memberId?: string; staffId?: string; externalId?: string }): Promise<{ history: TrainingHistoryEntry[] }>;
  createMember(payload: Partial<Member> & { type: string }): Promise<{ created: boolean; memberId: string; loginId: string; defaultPassword: string }>;
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
  }): Promise<{ sent: number; total: number; errors: string[]; autoAttachMissed: string[]; logId: string }>;
  getEmailSendLog(): Promise<EmailSendLog[]>;
  // v207: 宛名リスト Excel 出力
  getMailingListTargets(payload: { filterType: MailingListFilterType; year?: number }): Promise<MailingListTargetsResult>;
  generateMailingListExcel(payload: { filterType: MailingListFilterType; year?: number; targetKeys?: string[] }): Promise<MailingListExcelResult>;
  // v219: 入会メール テンプレート管理
  getCredentialEmailTemplates(): Promise<import('../types').EmailTemplate[]>;
  saveCredentialEmailTemplate(payload: { id?: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate>;
  deleteCredentialEmailTemplate(id: string): Promise<{ deletedId: string }>;
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
  listLinePostRequests(payload: { status?: LinePostStatus | ''; targetType?: LinePostTargetType | ''; keyword?: string; limit?: number }): Promise<{ items: LinePostRequest[]; total: number }>;
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-() ー−]{6,}$/;
const CARE_MANAGER_NO_PATTERN = /^\d{8}$/;

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
              resolve(parsed.data);
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAdminInitData', null);
    });
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
              resolve();
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch (e) {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('updateMember', JSON.stringify(member));
    });
  }

  async updateMembersBatch(members: Array<Partial<Member> & Pick<Member, 'id'>>): Promise<Array<{ updated: boolean; memberId: string }>> {
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
        .processApiRequest('updateMembersBatch', JSON.stringify({ records: members }));
    });
  }

  async updateMemberSelf(member: Member, loginId: string): Promise<void> {
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
              resolve();
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch (e) {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('updateMemberSelf', JSON.stringify({ ...member, loginId, ...this.memberSessionPayload() }));
    });
  }

  async changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void> {
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
              resolve();
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch (e) {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('changePassword', JSON.stringify({ loginId, currentPassword, newPassword, ...this.memberSessionPayload() }));
    });
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
              resolve(parsed.data);
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveAnnualFeeRecord', JSON.stringify(record));
    });
  }

  async saveAnnualFeeRecordsBatch(records: Array<{
    id?: string;
    memberId: string;
    year: number;
    status: 'PAID' | 'UNPAID' | 'WITHDRAW';
    confirmedDate?: string;
    note?: string;
  }>): Promise<{ savedRecords: AnnualFeeAdminRecord[]; withdrawnMemberIds: string[] }> {
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
              resolve(parsed.data);
            } else {
              reject(new Error(parsed.error || 'API Error'));
            }
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveAnnualFeeRecordsBatch', JSON.stringify({ records }));
    });
  }

  async memberLogin(loginId: string, password: string): Promise<MemberLoginResult> {
    return new Promise<MemberLoginResult>((resolve, reject) => {
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
        .processApiRequest('memberLogin', JSON.stringify({ loginId, password }));
    });
  }

  async requestPasswordReset(loginId: string, email: string): Promise<{ message: string; expiresInMinutes: number }> {
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
        .processApiRequest('requestPasswordReset', JSON.stringify({ loginId, email }));
    });
  }

  async completePasswordReset(loginId: string, code: string, newPassword: string): Promise<{ message: string; updatedAt: string }> {
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
        .processApiRequest('completePasswordReset', JSON.stringify({ loginId, code, newPassword }));
    });
  }

  // v150: ログイン+ポータルデータ統合API
  async memberLoginWithData(loginId: string, password: string): Promise<{ auth: MemberLoginResult; portal: { members: Member[]; trainings: Training[] } }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const parsed = JSON.parse(result); if (parsed.success) resolve(parsed.data); else reject(new Error(parsed.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('memberLoginWithData', JSON.stringify({ loginId, password }));
    });
  }

  async checkAdminBySession(): Promise<AdminLoginResult> {
    return new Promise<AdminLoginResult>((resolve, reject) => {
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
        .processApiRequest('checkAdminBySession', null);
    });
  }

  // v150: 管理者ログイン+ポータルデータ統合API
  async adminLoginWithData(): Promise<{ auth: AdminLoginResult; portal: { members: Member[]; trainings: Training[] } }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const parsed = JSON.parse(result); if (parsed.success) resolve(parsed.data); else reject(new Error(parsed.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('adminLoginWithData', null);
    });
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
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve();
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveAdminPermission', JSON.stringify(payload));
    });
  }

  async deleteAdminPermission(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve();
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deleteAdminPermission', JSON.stringify({ id }));
    });
  }

  async saveTraining(training: Training): Promise<Training> {
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
        .withFailureHandler((error: unknown) => {
          const msg = error instanceof Error ? error.message
            : (typeof error === 'object' && error !== null && 'message' in error)
              ? String((error as { message: unknown }).message)
              : String(error);
          reject(new Error('[GAS] ' + msg));
        })
        .processApiRequest('saveTraining', JSON.stringify(training));
    });
  }

  // v376.7: 研修 soft delete
  async softDeleteTraining(trainingId: string): Promise<{ trainingId: string; applicantCount: number; deleted: true; alreadyDeleted?: boolean }> {
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
          } catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('softDeleteTraining', JSON.stringify({ trainingId }));
    });
  }

  // v376.7: 研修 restore（削除取消）
  async restoreTraining(trainingId: string): Promise<{ trainingId: string; restored: true; alreadyActive?: boolean }> {
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
          } catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('restoreTraining', JSON.stringify({ trainingId }));
    });
  }

  async uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string; driveFileId?: string; thumbnailUrl?: string; thumbnailGenerationStatus?: 'generated' | 'pending' | 'failed' | 'skipped' }> {
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
        .processApiRequest('uploadTrainingFile', JSON.stringify({ base64, filename, mimeType }));
    });
  }

  async regenerateThumbnailForTraining(trainingId: string): Promise<{ trainingId: string; thumbnailUrl: string; thumbnailGenerationStatus: 'generated' | 'pending' | 'failed' | 'skipped'; reason?: string }> {
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
        .processApiRequest('regenerateThumbnailForTraining', JSON.stringify({ trainingId }));
    });
  }

  async getFileBytes(fileUrl: string): Promise<{ base64: string | null; mimeType?: string; name?: string; size?: number; error?: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || { base64: null });
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getFileBytes', JSON.stringify({ fileUrl, ...this.memberSessionPayload() }));
    });
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
        .processApiRequest('applyTraining', JSON.stringify({ ...request, ...this.memberSessionPayload() }));
    });
  }

  async cancelTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ canceled: boolean; applicants: number }> {
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
        .processApiRequest('cancelTraining', JSON.stringify({ ...request, ...this.memberSessionPayload() }));
    });
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
        .processApiRequest('sendTrainingMail', JSON.stringify(payload));
    });
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
  getMemberTrainingHistory(payload: { memberId?: string; staffId?: string; externalId?: string }) {
    return this.callAction<{ history: TrainingHistoryEntry[] }>('getMemberTrainingHistory', payload);
  }

  async createMember(payload: Partial<Member> & { type: string }): Promise<{ created: boolean; memberId: string; loginId: string; defaultPassword: string }> {
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
        .processApiRequest('createMember', JSON.stringify(payload));
    });
  }

  async submitMemberApplication(payload: any): Promise<any> {
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
        .processApiRequest('submitMemberApplication', JSON.stringify(payload));
    });
  }

  async withdrawMember(memberId: string, withdrawnDate?: string, midYearWithdrawal?: boolean): Promise<{ withdrawn: boolean; memberId: string; withdrawnDate: string }> {
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
        .processApiRequest('withdrawMember', JSON.stringify({ memberId, withdrawnDate, midYearWithdrawal }));
    });
  }

  async withdrawSelf(loginId: string, password: string, memberId: string): Promise<{ scheduled: boolean; memberId: string; withdrawnDate: string }> {
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
        .processApiRequest('withdrawSelf', JSON.stringify({ loginId, password, memberId, ...this.memberSessionPayload() }));
    });
  }

  async cancelWithdrawalSelf(loginId: string, password: string, memberId: string): Promise<{ canceled: boolean; memberId: string }> {
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
        .processApiRequest('cancelWithdrawalSelf', JSON.stringify({ loginId, password, memberId, ...this.memberSessionPayload() }));
    });
  }

  // v125: 事業所職員の除籍
  async removeStaffFromOffice(memberId: string, staffId: string): Promise<{ removed: boolean; staffId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('removeStaffFromOffice', JSON.stringify({ memberId, staffId }));
    });
  }

  // v125: フラット人物リスト取得
  async getAdminPersonList(): Promise<{ persons: AdminPersonRow[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAdminPersonList', JSON.stringify({}));
    });
  }

  // v125: フラット人物一括更新
  async updatePersonsBatch(records: Array<Record<string, any>>): Promise<Array<Record<string, any>>> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('updatePersonsBatch', JSON.stringify({ records }));
    });
  }

  // v125: 会員種別変更
  async convertMemberType(payload: ConvertMemberTypePayload): Promise<ConvertMemberTypeResult> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('convertMemberType', JSON.stringify(payload));
    });
  }

  // v126: 事業所会員の予約退会
  async scheduleWithdrawMember(memberId: string): Promise<{ scheduled: boolean; memberId: string; withdrawnDate: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('scheduleWithdrawMember', JSON.stringify({ memberId }));
    });
  }

  // v126: 予約退会キャンセル
  async cancelScheduledWithdraw(memberId: string): Promise<{ cancelled: boolean; memberId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('cancelScheduledWithdraw', JSON.stringify({ memberId }));
    });
  }

  // v127: 職員個別更新（status 対応追加）/ v133: mailingPreference 追加
  async updateStaff(payload: { staffId: string; memberId: string; lastName?: string; firstName?: string; lastKana?: string; firstKana?: string; name?: string; kana?: string; email?: string; careManagerNumber?: string; role?: string; status?: string; joinedDate?: string; withdrawnDate?: string; mailingPreference?: string }): Promise<{ updated: boolean; staffId: string; memberId: string; status?: string; role?: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('updateStaff', JSON.stringify(payload));
    });
  }

  // v188: AI案内メール生成（GASサーバー側でGemini APIを呼ぶ）
  async generateTrainingEmail(payload: { training: Training; recipientName?: string }): Promise<{ ok: boolean; text: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('generateTrainingEmail', JSON.stringify(payload));
    });
  }

  // v194: 会員一括メール送信
  async getMembersForBulkMail(payload: {
    memberTypes?: string[];
    memberStatus?: string;
    staffStatus?: string;
    mailingFilter?: string;
    excludeNoEmail?: boolean;
  }): Promise<BulkMailRecipient[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getMembersForBulkMail', JSON.stringify(payload));
    });
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
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('sendBulkMemberMail', JSON.stringify(payload));
    });
  }

  async getEmailSendLog(): Promise<EmailSendLog[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getEmailSendLog', JSON.stringify({}));
    });
  }

  // v207/v291: 宛名リスト対象取得・Excel 出力
  async getMailingListTargets(payload: { filterType: MailingListFilterType; year?: number }): Promise<MailingListTargetsResult> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getMailingListTargets', JSON.stringify(payload));
    });
  }

  async generateMailingListExcel(payload: { filterType: MailingListFilterType; year?: number; targetKeys?: string[] }): Promise<MailingListExcelResult> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('generateMailingListExcel', JSON.stringify(payload));
    });
  }

  // v219: 入会メール テンプレート管理
  async getCredentialEmailTemplates(): Promise<import('../types').EmailTemplate[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getCredentialEmailTemplates', JSON.stringify({}));
    });
  }

  async saveCredentialEmailTemplate(payload: { id?: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveCredentialEmailTemplate', JSON.stringify(payload));
    });
  }

  async deleteCredentialEmailTemplate(id: string): Promise<{ deletedId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deleteCredentialEmailTemplate', JSON.stringify({ id }));
    });
  }

  // v224: 一括メール テンプレート管理
  async getBulkMailTemplates(): Promise<import('../types').EmailTemplate[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getBulkMailTemplates', JSON.stringify({}));
    });
  }

  async saveBulkMailTemplate(payload: { id?: string; name: string; subject: string; body: string }): Promise<import('../types').EmailTemplate> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveBulkMailTemplate', JSON.stringify(payload));
    });
  }

  async deleteBulkMailTemplate(id: string): Promise<{ deletedId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deleteBulkMailTemplate', JSON.stringify({ id }));
    });
  }

  // v258: 論理削除
  async searchMembersForDelete(query: string): Promise<import('./api').MemberDeleteSearchResult[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('searchMembersForDelete', JSON.stringify({ query }));
    });
  }

  async previewDeleteMember(targetKeys: string[]): Promise<import('./api').MemberDeletePreview> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('previewDeleteMember', JSON.stringify({ targetKeys }));
    });
  }

  async executeDeleteMember(targetKeys: string[], confirmText: string): Promise<import('./api').MemberDeleteResult> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('executeDeleteMember', JSON.stringify({ targetKeys, confirmText }));
    });
  }

  async getDeleteLogs(limit = 20): Promise<import('./api').DeleteLogEntry[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getDeleteLogs', JSON.stringify({ limit }));
    });
  }

  async repairDuplicateStaffRecords(): Promise<{ repaired: number }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('repairDuplicateStaffRecords', JSON.stringify({}));
    });
  }

  async repairTrainingApplicationApplicantIds(): Promise<{ repaired: number; skipped: number }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('repairTrainingApplicationApplicantIds', JSON.stringify({}));
    });
  }

  async repairMemberCareManagerDuplicates(): Promise<{ repaired: number; details: { memberId: string; careManagerNumber: string }[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('repairMemberCareManagerDuplicates', JSON.stringify({}));
    });
  }

  // ---- v295: 役員管理マスタ ----

  async getOfficerMasterData(): Promise<import('../shared/types').OfficerMasterData> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        // v331: 会員側からも呼ばれるため sessionToken を必ず付与（admin shell では空オブジェクト）
        .processApiRequest('getOfficerMasterData', JSON.stringify(this.memberSessionPayload()));
    });
  }

  async saveOrganization(payload: { organizationCode: string; organizationName: string; organizationType?: string; displayOrder?: number; allOfficerVisible?: boolean; enabled?: boolean }): Promise<{ organizationCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveOrganization', JSON.stringify(payload));
    });
  }

  async deleteOrganization(payload: { organizationCode: string }): Promise<{ deleted: boolean; organizationCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deleteOrganization', JSON.stringify(payload));
    });
  }

  async saveOfficerRole(payload: { roleCode: string; roleName: string; organizationCode: string; isChairman?: boolean; displayOrder?: number; enabled?: boolean }): Promise<{ roleCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveOfficerRole', JSON.stringify(payload));
    });
  }

  async deleteOfficerRole(payload: { roleCode: string }): Promise<{ deleted: boolean; roleCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deleteOfficerRole', JSON.stringify(payload));
    });
  }

  async savePaymentType(payload: { typeCode: string; typeName: string; scope?: string; displayOrder?: number; enabled?: boolean }): Promise<{ typeCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('savePaymentType', JSON.stringify(payload));
    });
  }

  async deletePaymentType(payload: { typeCode: string }): Promise<{ deleted: boolean; typeCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deletePaymentType', JSON.stringify(payload));
    });
  }

  async saveWorkCategory(payload: { categoryCode: string; categoryName: string; organizationCode: string; unitPrice: number; displayOrder?: number; enabled?: boolean }): Promise<{ categoryCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveWorkCategory', JSON.stringify(payload));
    });
  }

  async deleteWorkCategory(payload: { categoryCode: string }): Promise<{ deleted: boolean; categoryCode: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deleteWorkCategory', JSON.stringify(payload));
    });
  }

  // ---- v295: 役員割当て管理 ----

  async getOfficerManagementData(): Promise<import('../shared/types').OfficerManagementData> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getOfficerManagementData', JSON.stringify({}));
    });
  }

  async updateOfficerLinkage(payload: { officerId: string; newMemberId?: string; newStaffId?: string }): Promise<{ updated: boolean; officerId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('updateOfficerLinkage', JSON.stringify(payload));
    });
  }

  async assignOfficer(payload: { memberId?: string; staffId?: string; roleCode: string; appointedDate?: string; note?: string }): Promise<{ officerId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('assignOfficer', JSON.stringify(payload));
    });
  }

  async resignOfficer(payload: { officerId: string; resignationDate?: string }): Promise<{ resigned: boolean; officerId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('resignOfficer', JSON.stringify(payload));
    });
  }

  async updateOfficerRecord(payload: { officerId: string; roleCode?: string; appointedDate?: string; resignationDate?: string; note?: string }): Promise<{ updated: boolean; officerId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('updateOfficerRecord', JSON.stringify(payload));
    });
  }

  // ---- v295: 振込口座管理（管理者用）----

  async getAdminBankAccount(payload: { memberId?: string; staffId?: string }): Promise<import('../shared/types').BankAccount | null> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAdminBankAccount', JSON.stringify(payload));
    });
  }

  async saveAdminBankAccount(payload: import('../shared/types').SaveBankAccountPayload): Promise<{ accountId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveAdminBankAccount', JSON.stringify(payload));
    });
  }

  async deleteAdminBankAccount(payload: { memberId?: string; staffId?: string }): Promise<{ deleted: boolean }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deleteAdminBankAccount', JSON.stringify(payload));
    });
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
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('savePayment', JSON.stringify(payload));
    });
  }

  async deletePayment(payload: { paymentId: string }): Promise<{ deleted: boolean; paymentId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('deletePayment', JSON.stringify(payload));
    });
  }

  // ---- v295: 会員自己サービス（役員のみ）----

  async getMyOfficerStatus(): Promise<import('../shared/types').MemberOfficerStatus> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getMyOfficerStatus', JSON.stringify(this.memberSessionPayload()));
    });
  }

  async getMyClaims(): Promise<import('../shared/types').ClaimRecord[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('getMyClaims', JSON.stringify(this.memberSessionPayload()));
    });
  }

  async submitClaim(payload: import('../shared/types').SaveClaimPayload): Promise<{ claimId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('submitClaim', JSON.stringify({ ...payload, ...this.memberSessionPayload() }));
    });
  }

  async deleteMyClaim(payload: { claimId: string }): Promise<{ deleted: boolean; claimId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('deleteMyClaim', JSON.stringify({ ...payload, ...this.memberSessionPayload() }));
    });
  }

  async uploadClaimAttachment(payload: { claimId?: string; base64: string; filename: string; mimeType: string }): Promise<import('../shared/types').ClaimAttachment> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('uploadClaimAttachment', JSON.stringify({ ...payload, ...this.memberSessionPayload() }));
    });
  }

  async removeClaimAttachment(payload: { claimId: string; fileId: string }): Promise<{ removed: boolean; fileId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('removeClaimAttachment', JSON.stringify({ ...payload, ...this.memberSessionPayload() }));
    });
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
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('approveClaim', JSON.stringify(payload));
    });
  }

  async rejectClaim(payload: { claimId: string; reason: string }): Promise<{ rejected: boolean; claimId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('rejectClaim', JSON.stringify(payload));
    });
  }

  async adminDeleteClaim(payload: { claimId: string }): Promise<{ deleted: boolean; claimId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('adminDeleteClaim', JSON.stringify(payload));
    });
  }

  // v372: 名簿出力 Visual Template Designer
  async getRosterFieldDictionary(): Promise<import('../types').RosterFieldDef[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('getRosterFieldDictionary', '{}');
    });
  }

  async getRosterDesignerData(payload: { memberTypes?: string[]; memberStatus?: string; year?: number; outputUnit?: import('../types').RosterOutputUnit }): Promise<{ rows: import('../types').RosterDesignerRow[]; years: number[]; year: number; outputUnit?: import('../types').RosterOutputUnit }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('getRosterDesignerData', JSON.stringify(payload));
    });
  }

  async loadRosterTemplatesV2(): Promise<{ templates: import('../types').RosterTemplateV2[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('loadRosterTemplatesV2', '{}');
    });
  }

  async saveRosterTemplateV2(template: import('../types').RosterTemplateV2): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('saveRosterTemplateV2', JSON.stringify({ template }));
    });
  }

  async deleteRosterTemplateV2(id: string): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('deleteRosterTemplateV2', JSON.stringify({ id }));
    });
  }

  async duplicateRosterTemplateV2(id: string): Promise<{ ok: boolean; templates: import('../types').RosterTemplateV2[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((r: string) => { try { const p = JSON.parse(r); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); } catch { reject(new Error('Failed to parse response from GAS')); } })
        .withFailureHandler((e: Error) => reject(e))
        .processApiRequest('duplicateRosterTemplateV2', JSON.stringify({ id }));
    });
  }

  // v374.1: 公式LINE投稿依頼
  async listLinePostRequests(payload: { status?: LinePostStatus | ''; targetType?: LinePostTargetType | ''; keyword?: string; limit?: number }) {
    return this.callAction<{ items: LinePostRequest[]; total: number }>('listLinePostRequests', payload);
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
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getSharedMemo', JSON.stringify({ key }));
    });
  }

  async saveSharedMemo(key: string, content: string, version: number): Promise<SharedMemoSaveResult> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveSharedMemo', JSON.stringify({ key, content, version }));
    });
  }

  async saveMyBankAccount(payload: Omit<import('../shared/types').SaveBankAccountPayload, 'memberId'>): Promise<{ accountId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveMyBankAccount', JSON.stringify({ ...payload, ...this.memberSessionPayload() }));
    });
  }
}

// API クライアントは GAS 実行環境専用とする。
// ローカルモック運用は廃止したため、常に GAS クライアントを使用する。
export const api: ApiClient = new GasApiClient();
