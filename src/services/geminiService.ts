import { GoogleGenAI } from "@google/genai";
import { Training } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTrainingEmail = async (training: Training, recipientName: string = "会員各位"): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API key not configured.";

  const prompt = `
    あなたは枚方市介護支援専門員連絡協議会の事務局スタッフです。
    以下の研修に参加申し込みをした会員に向けて、開催3日前のリマインドメールを作成してください。
    
    【研修情報】
    研修名: ${training.title}
    開催日: ${training.date}
    場所: ${training.location}
    形式: ${training.isOnline ? 'オンライン' : '現地開催'}
    
    【要件】
    - 件名は分かりやすく簡潔に。
    - 宛名は「${recipientName}」としてください。
    - オンラインの場合は、「当日のZoom IDと資料は本メールの添付、または以下のURLからご確認ください」という旨を含めてください。
    - 現地開催の場合は、公共交通機関の利用を促す文言を入れてください。
    - 丁寧でプロフェッショナルなトーンで記述してください。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "メールの生成に失敗しました。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "エラーが発生しました。しばらく経ってから再試行してください。";
  }
};

export const analyzeSurveyComments = async (comments: string[]): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API key not configured.";

  const prompt = `
    以下の研修アンケートの自由記述回答を分析し、主な要望や改善点を3つの箇条書きで要約してください。

    ${comments.join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "分析に失敗しました。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析中にエラーが発生しました。";
  }
};