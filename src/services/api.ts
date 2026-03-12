import { Member, Training } from '../types';
import { TrainingApplicantRow } from '../shared/types';
import { MOCK_MEMBERS, MOCK_TRAININGS } from '../constants';

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
  updateMember(member: Member): Promise<void>;
  changePassword(loginId: string, newPassword: string): Promise<void>;
  getSystemSettings(): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }>;
  updateSystemSettings(settings: { defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }>;
  memberLogin(loginId: string, password: string): Promise<{
    authMethod: 'PASSWORD';
    loginId: string;
    memberId: string;
    staffId?: string;
    roleCode: string;
    canAccessAdminPage: boolean;
    authenticatedAt: string;
  }>;
  adminGoogleLogin(idToken: string): Promise<{
    authMethod: 'GOOGLE';
    loginId: string;
    memberId: string;
    staffId?: string;
    roleCode: string;
    canAccessAdminPage: boolean;
    displayName?: string;
    authenticatedAt: string;
  }>;
  checkAdminBySession(): Promise<{
    authMethod: 'GOOGLE';
    loginId: string;
    memberId: string;
    staffId?: string;
    roleCode: string;
    canAccessAdminPage: boolean;
    displayName?: string;
    authenticatedAt: string;
  }>;
  getAuthConfig(): Promise<{ adminGoogleClientId: string }>;
  saveTraining(training: Training): Promise<Training>;
  uploadTrainingFile(base64: string, filename: string, mimeType: string): Promise<{ url: string }>;
  applyTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ applicationId: string; applicants: number; duplicate?: boolean }>;
  cancelTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ canceled: boolean; applicants: number }>;
  getTrainingApplicants(trainingId: string): Promise<TrainingApplicantRow[]>;
  getAdminEmailAliases(): Promise<string[]>;
  sendTrainingMail(payload: TrainingMailPayload): Promise<{ sent: number; errors: string[] }>;
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

// --- Mock Implementation (Local Development) ---
class MockApiClient implements ApiClient {
  private members: Member[] = normalizeMemberLoginIds(JSON.parse(JSON.stringify(MOCK_MEMBERS)));
  private trainings: Training[] = JSON.parse(JSON.stringify(MOCK_TRAININGS));
  private defaultBusinessStaffLimit = 10;
  private trainingHistoryLookbackMonths = 18;

  async fetchAllData(): Promise<{ members: Member[], trainings: Training[] }> {
    console.log('[Mock API] fetchAllData called');
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      members: JSON.parse(JSON.stringify(this.members)),
      trainings: JSON.parse(JSON.stringify(this.trainings))
    };
  }

  async updateMember(member: Member): Promise<void> {
    console.log('[Mock API] updateMember called', member);
    await new Promise(resolve => setTimeout(resolve, 500));
    this.members = this.members.map((m) => (m.id === member.id ? JSON.parse(JSON.stringify(member)) : m));
  }

  async changePassword(loginId: string, newPassword: string): Promise<void> {
    console.log('[Mock API] changePassword called');
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!loginId) {
      throw new Error('ログインIDが取得できませんでした。');
    }
    if (newPassword.length < 8) {
      throw new Error('新しいパスワードは8文字以上で入力してください。');
    }
  }

  async getSystemSettings(): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }> {
    return {
      defaultBusinessStaffLimit: this.defaultBusinessStaffLimit,
      trainingHistoryLookbackMonths: this.trainingHistoryLookbackMonths,
    };
  }

  async updateSystemSettings(settings: { defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }> {
    const next = Number(settings.defaultBusinessStaffLimit || 10);
    if (!Number.isFinite(next) || next < 1 || next > 200) {
      throw new Error('事業所メンバー上限（全体）は 1〜200 の範囲で設定してください。');
    }
    const lookback = Number(settings.trainingHistoryLookbackMonths || 18);
    if (!Number.isFinite(lookback) || lookback < 1 || lookback > 60) {
      throw new Error('履歴表示期間（月）は 1〜60 の範囲で設定してください。');
    }
    this.defaultBusinessStaffLimit = Math.floor(next);
    this.trainingHistoryLookbackMonths = Math.floor(lookback);
    return {
      defaultBusinessStaffLimit: this.defaultBusinessStaffLimit,
      trainingHistoryLookbackMonths: this.trainingHistoryLookbackMonths,
    };
  }

  async memberLogin(loginId: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 400));
    if (!loginId || !password) {
      throw new Error('ログインIDとパスワードを入力してください。');
    }
    if (password !== 'demo1234') {
      throw new Error('ログインIDまたはパスワードが正しくありません。');
    }
    const all = await this.fetchAllData();
    const identity = all.members.flatMap(m => {
      if (m.type !== 'BUSINESS') return [{ memberId: m.id, staffId: undefined, loginId: m.loginId || '' }];
      return (m.staff || []).map(s => ({ memberId: m.id, staffId: s.id, loginId: s.loginId || '' }));
    }).find(x => x.loginId === loginId);
    if (!identity) {
      throw new Error('ログインIDまたはパスワードが正しくありません。');
    }
    return {
      authMethod: 'PASSWORD' as const,
      loginId,
      memberId: identity.memberId,
      staffId: identity.staffId,
      roleCode: 'MEMBER',
      canAccessAdminPage: false,
      authenticatedAt: new Date().toISOString(),
    };
  }

  async adminGoogleLogin(idToken: string) {
    await new Promise(resolve => setTimeout(resolve, 400));
    if (!idToken) {
      throw new Error('Google認証に失敗しました。');
    }
    return this.checkAdminBySession();
  }

  async checkAdminBySession() {
    await new Promise(resolve => setTimeout(resolve, 400));
    const all = await this.fetchAllData();
    const businessAdmin = all.members.find(m => m.type === 'BUSINESS' && (m.staff || []).some(s => s.role === 'ADMIN'));
    const adminStaff = businessAdmin?.staff?.find(s => s.role === 'ADMIN');
    if (!businessAdmin || !adminStaff) {
      throw new Error('管理者デモユーザーが見つかりません。');
    }
    return {
      authMethod: 'GOOGLE' as const,
      loginId: 'admin@mock.local',
      memberId: businessAdmin.id,
      staffId: adminStaff.id,
      roleCode: 'OFFICE_ADMIN',
      canAccessAdminPage: true,
      displayName: 'Mock Admin',
      authenticatedAt: new Date().toISOString(),
    };
  }

  async getAuthConfig() {
    return { adminGoogleClientId: '' };
  }

  async saveTraining(training: Training): Promise<Training> {
    console.log('[Mock API] saveTraining called', training);
    await new Promise(resolve => setTimeout(resolve, 500));
    const normalized = normalizeInquiryContactForTraining(training);
    if (!normalized.id) {
      const created = { ...normalized, id: 'T' + Date.now().toString(36).toUpperCase() };
      this.trainings = [...this.trainings, created];
      return created;
    }
    this.trainings = this.trainings.map((t) => (t.id === normalized.id ? { ...normalized } : t));
    return normalized;
  }

  async uploadTrainingFile(_base64: string, filename: string, _mimeType: string): Promise<{ url: string }> {
    console.log('[Mock API] uploadTrainingFile called', filename);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { url: 'https://example.com/mock-upload/' + encodeURIComponent(filename) };
  }

  async applyTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ applicationId: string; applicants: number; duplicate?: boolean }> {
    const { trainingId, memberId, staffId } = request;
    await new Promise(resolve => setTimeout(resolve, 600));

    const training = this.trainings.find((t) => t.id === trainingId);
    if (!training) {
      throw new Error('対象研修が見つかりません。');
    }
    if (deriveTrainingStatusByCloseDate(training.applicationCloseDate) !== 'OPEN') {
      throw new Error('この研修は受付期間外です。');
    }

    const member = this.members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('会員情報が見つかりません。');
    }

    if (staffId) {
      const staff = (member.staff || []).find((s) => s.id === staffId);
      if (!staff) {
        throw new Error('職員情報が見つかりません。');
      }
      const ids = new Set(staff.participatedTrainingIds || []);
      if (ids.has(trainingId)) {
        return { applicationId: `AP-MOCK-${Date.now()}`, applicants: training.applicants, duplicate: true };
      }
      ids.add(trainingId);
      staff.participatedTrainingIds = Array.from(ids);
    } else {
      const ids = new Set(member.participatedTrainingIds || []);
      if (ids.has(trainingId)) {
        return { applicationId: `AP-MOCK-${Date.now()}`, applicants: training.applicants, duplicate: true };
      }
      ids.add(trainingId);
      member.participatedTrainingIds = Array.from(ids);
    }

    training.applicants = (training.applicants || 0) + 1;
    return { applicationId: `AP-MOCK-${Date.now()}`, applicants: training.applicants };
  }

  async cancelTraining(request: { trainingId: string; memberId: string; staffId?: string }): Promise<{ canceled: boolean; applicants: number }> {
    const { trainingId, memberId, staffId } = request;
    await new Promise(resolve => setTimeout(resolve, 500));

    const training = this.trainings.find((t) => t.id === trainingId);
    if (!training) throw new Error('対象研修が見つかりません。');
    if (!training.cancelAllowed) throw new Error('この研修はキャンセルできません。');

    const member = this.members.find((m) => m.id === memberId);
    if (!member) throw new Error('会員情報が見つかりません。');

    let canceled = false;
    if (staffId) {
      const staff = (member.staff || []).find((s) => s.id === staffId);
      if (!staff) throw new Error('職員情報が見つかりません。');
      const ids = new Set(staff.participatedTrainingIds || []);
      if (ids.has(trainingId)) {
        ids.delete(trainingId);
        staff.participatedTrainingIds = Array.from(ids);
        canceled = true;
      }
    } else {
      const ids = new Set(member.participatedTrainingIds || []);
      if (ids.has(trainingId)) {
        ids.delete(trainingId);
        member.participatedTrainingIds = Array.from(ids);
        canceled = true;
      }
    }

    if (!canceled) throw new Error('キャンセル対象の申込が見つかりません。');
    training.applicants = Math.max(0, (training.applicants || 0) - 1);
    return { canceled: true, applicants: training.applicants };
  }

  async getTrainingApplicants(trainingId: string): Promise<TrainingApplicantRow[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const rows: TrainingApplicantRow[] = [];
    this.members.forEach((m) => {
      const ids = m.type === 'BUSINESS'
        ? (m.staff || []).flatMap((s) => (s.participatedTrainingIds || []).includes(trainingId)
            ? [{ name: s.name, email: `${s.id}@mock.local`, officeName: m.officeName || '', id: `${m.id}-${s.id}` }]
            : [])
        : ((m.participatedTrainingIds || []).includes(trainingId)
            ? [{ name: `${m.lastName} ${m.firstName}`, email: `${m.id}@mock.local`, officeName: '', id: m.id }]
            : []);
      ids.forEach((item, idx) => {
        rows.push({
          applyId: `AP-MOCK-${trainingId}-${item.id}-${idx}`,
          trainingId,
          applicantType: 'MEMBER',
          applicantId: item.id,
          name: item.name,
          email: item.email,
          officeName: item.officeName,
          status: 'APPLIED',
          applyDate: new Date().toISOString(),
        });
      });
    });
    return rows;
  }

  async getAdminEmailAliases(): Promise<string[]> {
    return ['admin@mock.local', 'training@mock.local'];
  }

  async sendTrainingMail(payload: TrainingMailPayload): Promise<{ sent: number; errors: string[] }> {
    console.log('[Mock API] sendTrainingMail', payload);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { sent: payload.targetApplyIds.length, errors: [] };
  }
}

// --- GAS Implementation (Production) ---
class GasApiClient implements ApiClient {
  async fetchAllData(): Promise<{ members: Member[], trainings: Training[] }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run is not available. Are you running this in GAS?'));
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

  async updateMember(member: Member): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run is not available.'));
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

  async changePassword(loginId: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run is not available.'));
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
        .processApiRequest('changePassword', JSON.stringify({ loginId, newPassword }));
    });
  }

  async getSystemSettings(): Promise<{ defaultBusinessStaffLimit: number; trainingHistoryLookbackMonths: number }> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        resolve({ defaultBusinessStaffLimit: 10, trainingHistoryLookbackMonths: 18 });
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
        reject(new Error('google.script.run is not available.'));
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

  async memberLogin(loginId: string, password: string) {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run is not available.'));
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

  async adminGoogleLogin(idToken: string) {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run is not available.'));
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

  async checkAdminBySession() {
    return new Promise<any>((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run is not available.'));
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
        resolve({ adminGoogleClientId: '' });
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

  async saveTraining(training: Training): Promise<Training> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run is not available.'));
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
        reject(new Error('google.script.run is not available.'));
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
        reject(new Error('google.script.run is not available.'));
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
        reject(new Error('google.script.run is not available.'));
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
        reject(new Error('google.script.run is not available.'));
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
        reject(new Error('google.script.run is not available.'));
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
        reject(new Error('google.script.run is not available.'));
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
}

// 開発環境（Viteのローカルサーバー）か、本番環境（GAS）かを判定してクライアントを切り替える
// import.meta.env.DEV が true の場合、または google.script が存在しない場合はモックを使用
const isDev = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true' || typeof google === 'undefined';

export const api: ApiClient = isDev ? new MockApiClient() : new GasApiClient();
