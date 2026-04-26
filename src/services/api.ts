import { Member, Training, AdminPermissionLevel, AdminPersonRow, ConvertMemberTypePayload, ConvertMemberTypeResult, SystemSettings } from '../types';
import { TrainingApplicantRow, BulkMailRecipient, EmailSendLog, RosterTarget, TemplateValidationResult, TemplateValidationKind, MailingListFilterType, MailingListExcelResult } from '../shared/types';
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
  uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string; thumbnailUrl?: string }>;
  applyTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ applicationId: string; applicants: number; duplicate?: boolean }>;
  cancelTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ canceled: boolean; applicants: number }>;
  getTrainingApplicants(trainingId: string): Promise<TrainingApplicantRow[]>;
  getAdminEmailAliases(): Promise<AdminEmailAliasesResult>;
  sendTrainingMail(payload: TrainingMailPayload): Promise<{ sent: number; errors: string[] }>;
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
  updateStaff(payload: { staffId: string; memberId: string; lastName?: string; firstName?: string; lastKana?: string; firstKana?: string; name?: string; kana?: string; email?: string; careManagerNumber?: string; role?: string; status?: string; joinedDate?: string; mailingPreference?: string }): Promise<{ updated: boolean; staffId: string; memberId: string; status?: string; role?: string }>;
  // v188: AI案内メール生成（GASサーバー側でGemini APIを呼ぶ）
  generateTrainingEmail(payload: { training: Training; recipientName?: string }): Promise<{ ok: boolean; text: string }>;
  // v196: PDF名簿出力（対象取得）
  getMembersForRoster(payload: {
    memberTypes?: string[];
    memberStatus?: string;
    annualFeeStatus?: string;
    year?: number;
  }): Promise<RosterTarget[]>;
  // v205: チャンク分割 PDF 出力 API（1000件対応）
  initRosterExport(payload: { year: number }): Promise<{ folderId: string }>;
  processRosterChunk(payload: {
    folderId: string;
    chunkIndex: number;
    memberIds: string[];
    year: number;
  }): Promise<{ ok: boolean; count?: number; errors?: string[] }>;
  finalizeRosterExport(payload: {
    folderId: string;
    year: number;
  }): Promise<{ downloadUrl: string; fileId: string; zipName: string; count: number }>;
  cleanupRosterExport(payload: { folderId: string }): Promise<{ ok: boolean }>;
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
  validateTemplateSpreadsheet(payload: {
    spreadsheetId: string;
    kind: TemplateValidationKind;
  }): Promise<TemplateValidationResult>;
  // v207: 宛名リスト Excel 出力
  generateMailingListExcel(payload: { filterType: MailingListFilterType }): Promise<MailingListExcelResult>;
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

  async validateTemplateSpreadsheet(payload: {
    spreadsheetId: string;
    kind: TemplateValidationKind;
  }): Promise<TemplateValidationResult> {
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
        .processApiRequest('validateTemplateSpreadsheet', JSON.stringify(payload));
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
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('saveTraining', JSON.stringify(training));
    });
  }

  async uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string; thumbnailUrl?: string }> {
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
  async updateStaff(payload: { staffId: string; memberId: string; lastName?: string; firstName?: string; lastKana?: string; firstKana?: string; name?: string; kana?: string; email?: string; careManagerNumber?: string; role?: string; status?: string; joinedDate?: string; mailingPreference?: string }): Promise<{ updated: boolean; staffId: string; memberId: string; status?: string; role?: string }> {
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

  // v196: PDF名簿出力（対象取得）
  async getMembersForRoster(payload: {
    memberTypes?: string[];
    memberStatus?: string;
    annualFeeStatus?: string;
    year?: number;
  }): Promise<RosterTarget[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getMembersForRoster', JSON.stringify(payload));
    });
  }

  // v205: チャンク分割 PDF 出力 API（1000件対応）
  async initRosterExport(payload: { year: number }): Promise<{ folderId: string }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('initRosterExport', JSON.stringify(payload));
    });
  }

  async processRosterChunk(payload: {
    folderId: string;
    chunkIndex: number;
    memberIds: string[];
    year: number;
  }): Promise<{ ok: boolean; count?: number; errors?: string[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('processRosterChunk', JSON.stringify(payload));
    });
  }

  async finalizeRosterExport(payload: {
    folderId: string;
    year: number;
  }): Promise<{ downloadUrl: string; fileId: string; zipName: string; count: number }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('finalizeRosterExport', JSON.stringify(payload));
    });
  }

  async cleanupRosterExport(payload: { folderId: string }): Promise<{ ok: boolean }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) { reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE)); return; }
      google.script.run
        .withSuccessHandler((result: string) => {
          try { const p = JSON.parse(result); if (p.success) resolve(p.data); else reject(new Error(p.error || 'API Error')); }
          catch { reject(new Error('Failed to parse response from GAS')); }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('cleanupRosterExport', JSON.stringify(payload));
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

  // v207: 宛名リスト Excel 出力
  async generateMailingListExcel(payload: { filterType: MailingListFilterType }): Promise<MailingListExcelResult> {
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
}

// API クライアントは GAS 実行環境専用とする。
// ローカルモック運用は廃止したため、常に GAS クライアントを使用する。
export const api: ApiClient = new GasApiClient();
