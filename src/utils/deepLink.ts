// v363: 新タブで会員詳細を開くための deep link ユーティリティ。
// GAS HtmlService の iframe 内では window.location が iframe 内部 URL になるため、
// サーバー側 doGet が window.__APP_URL__ に exec URL を注入する仕組みを利用する。

declare global {
  interface Window {
    __APP_URL__?: string;
  }
}

const MEMBER_HASH_PREFIX = 'member=';
const TRAINING_HASH_PREFIX = 'training=';

/**
 * 注入された exec URL を返す。未注入時（開発時など）は空文字。
 */
export const getAppUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return window.__APP_URL__ || '';
};

/**
 * 会員詳細用の deep link URL を返す。新タブで開いた際に React が hash を読み取って遷移する。
 * 例: https://script.google.com/.../exec#member=ABC123
 */
export const buildMemberDetailUrl = (memberId: string): string => {
  const base = getAppUrl();
  if (!base) return ''; // URL 不明時は空。<a> 表示側で同一タブ navigation にフォールバック
  return base + '#' + MEMBER_HASH_PREFIX + encodeURIComponent(memberId);
};

/**
 * 現在の location.hash から会員 ID を抽出する。boot 時に呼んで初期遷移用。
 * 戻り値: 'ABC123' or null
 */
export const readMemberIdFromHash = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith(MEMBER_HASH_PREFIX)) return null;
  const raw = hash.slice(MEMBER_HASH_PREFIX.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/**
 * hash を消去する（deep link で開いた後、ユーザーが他画面に移った時の URL クリーンアップ用）。
 */
export const clearMemberHash = (): void => {
  if (typeof window === 'undefined') return;
  if (window.location.hash) {
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      window.location.hash = '';
    }
  }
};

export const buildTrainingDetailUrl = (trainingId: string): string => {
  const base = getAppUrl();
  if (!base) return '';
  return base + '#' + TRAINING_HASH_PREFIX + encodeURIComponent(trainingId);
};
