// v188: AI機能はGASサーバー側（generateTrainingEmailWithAI_）に移動。
// @google/genai パッケージはフロントエンドバンドルから除外し、
// APIキーをサーバーサイドのScript Propertiesで管理する。
import { api } from './api';
import { Training } from '../types';

export const generateTrainingEmail = async (training: Training, recipientName: string = '会員各位'): Promise<string> => {
  try {
    const result = await api.generateTrainingEmail({ training, recipientName });
    return result.text;
  } catch (e) {
    console.error('generateTrainingEmail error:', e);
    return 'エラーが発生しました。しばらく経ってから再試行してください。';
  }
};
