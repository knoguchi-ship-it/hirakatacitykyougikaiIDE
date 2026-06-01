// v376.32: 公開ポータルのディープリンク。
// サーバ doGet が URL パラメータを許可制で window.__DEEPLINK__ に注入する。
//   ?t=<研修ID> → 該当研修の申込画面へ直行
//   ?p=<page>   → 指定画面へ直行
// GAS の二重 iframe では window.location が内側 iframe（script.googleusercontent.com）を
// 指すため、外側 exec URL のパラメータ/ハッシュを内側から直接読むことはできない。
// よってサーバ注入（__DEEPLINK__）を正本とする。
// （旧 v363 の window.location.hash 直読みは内側 iframe では常に空で機能しなかったため撤去）。

declare global {
  interface Window {
    __APP_URL__?: string;
    __DEEPLINK__?: { t?: string; p?: string };
  }
}

export type DeepLink = { trainingId?: string; page?: string };

/** サーバが注入した exec URL を返す。未注入時（開発時など）は空文字。 */
export const getAppUrl = (): string =>
  (typeof window !== 'undefined' && window.__APP_URL__) || '';

/** boot 時にディープリンク指定を読み取る。 */
export const readDeepLink = (): DeepLink => {
  if (typeof window === 'undefined' || !window.__DEEPLINK__) return {};
  const { t, p } = window.__DEEPLINK__;
  return { trainingId: t || undefined, page: p || undefined };
};

/** 適用後に消去し、再レンダーでの二重適用を防ぐ。 */
export const consumeDeepLink = (): void => {
  if (typeof window !== 'undefined') window.__DEEPLINK__ = undefined;
};

const withParam = (key: string, value: string): string => {
  const base = getAppUrl();
  if (!base) return '';
  const sep = base.indexOf('?') === -1 ? '?' : '&';
  return base + sep + key + '=' + encodeURIComponent(value);
};

/** 特定研修の申込画面への共有リンク（…/exec?t=<研修ID>）。 */
export const buildTrainingApplyUrl = (trainingId: string): string => withParam('t', trainingId);

/** 指定ページへの共有リンク（…/exec?p=<page>）。 */
export const buildPageUrl = (page: string): string => withParam('p', page);
