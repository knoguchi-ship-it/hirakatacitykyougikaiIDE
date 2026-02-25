import { Member, Training } from '../types';
import { MOCK_MEMBERS, MOCK_TRAININGS } from '../constants';

// デプロイしたGoogle Apps ScriptのWebアプリURLをここに設定してください
// 例: 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxx/exec'
const GAS_API_URL = process.env.REACT_APP_GAS_API_URL || '';

interface ApiResponse {
  status: string;
  data: {
    members: Member[];
    trainings: Training[];
  };
}

export const api = {
  /**
   * GASから初期データを全取得する
   * URL未設定時やエラー時はモックデータを返す
   */
  fetchAllData: async (): Promise<{ members: Member[], trainings: Training[] }> => {
    if (!GAS_API_URL) {
      console.warn('GAS_API_URL is not set. Using MOCK data.');
      // ネットワーク遅延のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        members: JSON.parse(JSON.stringify(MOCK_MEMBERS)),
        trainings: JSON.parse(JSON.stringify(MOCK_TRAININGS))
      };
    }

    try {
      const response = await fetch(GAS_API_URL);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const json: ApiResponse = await response.json();
      
      if (json.status !== 'success') {
        throw new Error('API returned error status');
      }

      // データが空の場合（初回起動時など）はモックを返すなど、運用の柔軟性を持たせる
      const members = json.data.members && json.data.members.length > 0 
        ? json.data.members 
        : JSON.parse(JSON.stringify(MOCK_MEMBERS));

      const trainings = json.data.trainings && json.data.trainings.length > 0
        ? json.data.trainings
        : JSON.parse(JSON.stringify(MOCK_TRAININGS));

      return { members, trainings };

    } catch (error) {
      console.error('Failed to fetch data from GAS:', error);
      // エラー時はフォールバックとしてモックを使用（本番ではエラー表示すべき）
      return {
        members: JSON.parse(JSON.stringify(MOCK_MEMBERS)),
        trainings: JSON.parse(JSON.stringify(MOCK_TRAININGS))
      };
    }
  },

  /**
   * メンバー情報を更新する (POST)
   */
  updateMember: async (member: Member): Promise<void> => {
    if (!GAS_API_URL) {
      console.log('Mock update member:', member);
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    try {
      // GASの doPost はリダイレクト挙動やCORSの制約があるため
      // no-corsモードで送るのが一般的（ただしレスポンスの中身は読めない）
      // 厳密なエラーハンドリングが必要な場合は、GAS側で JSONP を実装するか
      // プロキシを通す必要がありますが、ここでは簡易的な fire-and-forget 方式を採用します。
      await fetch(GAS_API_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain', // GASの仕様上、application/jsonだとOPTIONSプリフライトが飛んで失敗しやすい
        },
        body: JSON.stringify({
          action: 'UPDATE_MEMBER',
          member: member
        })
      });
      
      console.log('Member update sent to GAS');
    } catch (error) {
      console.error('Failed to update member:', error);
      throw error;
    }
  }
};