import { Member, Training } from '../types';
import { MOCK_MEMBERS, MOCK_TRAININGS } from '../constants';

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
  changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void>;
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
  getAuthConfig(): Promise<{ adminGoogleClientId: string }>;
}

// --- Mock Implementation (Local Development) ---
class MockApiClient implements ApiClient {
  async fetchAllData(): Promise<{ members: Member[], trainings: Training[] }> {
    console.log('[Mock API] fetchAllData called');
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      members: JSON.parse(JSON.stringify(MOCK_MEMBERS)),
      trainings: JSON.parse(JSON.stringify(MOCK_TRAININGS))
    };
  }

  async updateMember(member: Member): Promise<void> {
    console.log('[Mock API] updateMember called', member);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void> {
    console.log('[Mock API] changePassword called');
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!loginId) {
      throw new Error('ログインIDが取得できませんでした。');
    }
    if (currentPassword !== 'demo1234') {
      throw new Error('現在のパスワードが正しくありません。');
    }
    if (newPassword.length < 8) {
      throw new Error('新しいパスワードは8文字以上で入力してください。');
    }
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
      if (m.type === 'INDIVIDUAL') return [{ memberId: m.id, staffId: undefined, loginId: m.loginId || '' }];
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
              resolve(parsed.data);
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

  async changePassword(loginId: string, currentPassword: string, newPassword: string): Promise<void> {
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
        .processApiRequest('changePassword', JSON.stringify({ loginId, currentPassword, newPassword }));
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
}

// 開発環境（Viteのローカルサーバー）か、本番環境（GAS）かを判定してクライアントを切り替える
// import.meta.env.DEV が true の場合、または google.script が存在しない場合はモックを使用
const isDev = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true' || typeof google === 'undefined';

export const api: ApiClient = isDev ? new MockApiClient() : new GasApiClient();
