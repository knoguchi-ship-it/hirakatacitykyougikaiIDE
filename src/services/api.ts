import { Member, Training } from '../types';
import { TrainingApplicantRow } from '../shared/types';
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
  authenticatedAt: string;
}

export interface AdminLoginResult {
  authMethod: 'GOOGLE';
  loginId: string;
  memberId: string;
  staffId?: string;
  roleCode: string;
  canAccessAdminPage: boolean;
  displayName?: string;
  authenticatedAt: string;
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
  fetchAllData(): Promise<{ members: Member[], trainings: Training[] }>;
  getMemberPortalData(memberId: string): Promise<{ members: Member[], trainings: Training[] }>;
  getAdminDashboardData(): Promise<AdminDashboardData>;
  getTrainingManagementData(): Promise<Training[]>;
  updateMember(member: Member): Promise<void>;
  updateMembersBatch(members: Array<Partial<Member> & Pick<Member, 'id'>>): Promise<Array<{ updated: boolean; memberId: string }>>;
  updateMemberSelf(member: Member, loginId: string): Promise<void>;
  changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void>;
  getSystemSettings(): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }>;
  updateSystemSettings(settings: { defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }>;
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
    status: 'PAID' | 'UNPAID';
    confirmedDate?: string;
    note?: string;
  }>): Promise<AnnualFeeAdminRecord[]>;
  memberLogin(loginId: string, password: string): Promise<MemberLoginResult>;
  adminGoogleLogin(idToken: string): Promise<AdminLoginResult>;
  checkAdminBySession(): Promise<AdminLoginResult>;
  getAuthConfig(): Promise<{ adminGoogleClientId: string }>;
  getAdminPermissionData(): Promise<AdminPermissionData>;
  saveAdminPermission(payload: {
    id?: string;
    googleUserId?: string;
    googleEmail: string;
    displayName?: string;
    linkedAuthId: string;
    enabled: boolean;
  }): Promise<void>;
  deleteAdminPermission(id: string): Promise<void>;
  saveTraining(training: Training): Promise<Training>;
  uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string }>;
  applyTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ applicationId: string; applicants: number; duplicate?: boolean }>;
  cancelTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ canceled: boolean; applicants: number }>;
  getTrainingApplicants(trainingId: string): Promise<TrainingApplicantRow[]>;
  getAdminEmailAliases(): Promise<string[]>;
  sendTrainingMail(payload: TrainingMailPayload): Promise<{ sent: number; errors: string[] }>;
  createMember(payload: Partial<Member> & { type: string }): Promise<{ created: boolean; memberId: string; loginId: string; defaultPassword: string }>;
  withdrawMember(memberId: string, withdrawnDate?: string, midYearWithdrawal?: boolean): Promise<{ withdrawn: boolean; memberId: string; withdrawnDate: string }>;
  withdrawSelf(loginId: string, password: string, memberId: string): Promise<{ scheduled: boolean; memberId: string; withdrawnDate: string }>;
  cancelWithdrawalSelf(loginId: string, password: string, memberId: string): Promise<{ canceled: boolean; memberId: string }>;
  submitMemberApplication(payload: any): Promise<any>;
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

  async getMemberPortalData(memberId: string): Promise<{ members: Member[], trainings: Training[] }> {
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
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getMemberPortalData', JSON.stringify({ memberId }));
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
        .processApiRequest('updateMemberSelf', JSON.stringify({ ...member, loginId }));
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
        .processApiRequest('changePassword', JSON.stringify({ loginId, currentPassword, newPassword }));
    });
  }

  async getSystemSettings(): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || { defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18 });
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getSystemSettings', null);
    });
  }

  async updateSystemSettings(settings: { defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || { defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18 });
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
              resolve(parsed.data || { selectedYear: new Date().getFullYear(), records: [], years: [], auditLogs: [] });
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
    status: 'PAID' | 'UNPAID';
    confirmedDate?: string;
    note?: string;
  }>): Promise<AnnualFeeAdminRecord[]> {
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

  async adminGoogleLogin(idToken: string): Promise<AdminLoginResult> {
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
        .processApiRequest('adminGoogleLogin', JSON.stringify({ idToken }));
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

  async getAuthConfig() {
    return new Promise<{ adminGoogleClientId: string }>((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error(GAS_RUNTIME_REQUIRED_MESSAGE));
        return;
      }
      google.script.run
        .withSuccessHandler((result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data || { adminGoogleClientId: '' });
            else reject(new Error(parsed.error || 'API Error'));
          } catch {
            reject(new Error('Failed to parse response from GAS'));
          }
        })
        .withFailureHandler((error: Error) => reject(error))
        .processApiRequest('getAuthConfig', null);
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
    googleUserId?: string;
    googleEmail: string;
    displayName?: string;
    linkedAuthId: string;
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

  async uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string }> {
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
        .processApiRequest('applyTraining', JSON.stringify(request));
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
        .processApiRequest('cancelTraining', JSON.stringify(request));
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

  async getAdminEmailAliases(): Promise<string[]> {
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
        .processApiRequest('withdrawSelf', JSON.stringify({ loginId, password, memberId }));
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
        .processApiRequest('cancelWithdrawalSelf', JSON.stringify({ loginId, password, memberId }));
    });
  }
}

// API クライアントは GAS 実行環境専用とする。
// ローカルモック運用は廃止したため、常に GAS クライアントを使用する。
export const api: ApiClient = new GasApiClient();


