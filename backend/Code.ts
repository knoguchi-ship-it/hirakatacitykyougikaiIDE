/**
 * WebアプリへのGETリクエストを処理し、Reactのフロントエンド（index.html）を返却する
 */
function doGet(e: GoogleAppsScript.Events.DoGet) {
  // Viteでビルドされた単一のindex.htmlを評価して返す
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('枚方市介護支援専門員連絡協議会 会員システム')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * フロントエンドからのAPIリクエストを処理する
 * @param {string} action - 実行するアクション名
 * @param {string} payload - 送信されるデータ(JSON文字列)
 * @returns {string} - 結果のJSON文字列
 */
function processApiRequest(action: string, payload: string): string {
  try {
    switch (action) {
      case 'fetchAllData':
        // TODO: スプレッドシートから会員データと研修データを取得する処理
        // 現在はGAS側でもモックの空配列を返すようにしています
        const data = {
          members: [],
          trainings: []
        };
        return JSON.stringify({ success: true, data: data });
        
      case 'updateMember':
        // TODO: スプレッドシートの会員データを更新する処理
        const member = payload ? JSON.parse(payload) : null;
        return JSON.stringify({ success: true, data: member });
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
