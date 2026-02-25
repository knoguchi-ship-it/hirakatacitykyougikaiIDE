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
}

// 開発環境（Viteのローカルサーバー）か、本番環境（GAS）かを判定してクライアントを切り替える
// import.meta.env.DEV が true の場合、または google.script が存在しない場合はモックを使用
const isDev = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true' || typeof google === 'undefined';

export const api: ApiClient = isDev ? new MockApiClient() : new GasApiClient();