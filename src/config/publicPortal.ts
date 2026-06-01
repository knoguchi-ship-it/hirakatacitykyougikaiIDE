// v376.32: 公開ポータル（正式）の exec URL。研修ディープリンク共有用。
//
// 固定デプロイ運用（clasp deploy 禁止・URL 不変）のため、この値は安定。
// HANDOVER §1 / docs/09 の「統合 public 正式」fixed deployment と一致させること。
// 再デプロイ等で URL が変わった場合は本定数も同ターンで更新する。
//
// ※ AGENTS.md §3 ハードコード禁止に対しては「定数化」で対応（許可された方式）。
//    本値は公開 URL であり秘密値ではない（§0 シークレット保管の対象外）。
export const PUBLIC_PORTAL_BASE_URL =
  'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

/** 特定研修の公開申込ページへのディープリンク（…/exec?t=<研修ID>）。 */
export const buildPublicTrainingApplyUrl = (trainingId: string): string =>
  `${PUBLIC_PORTAL_BASE_URL}?t=${encodeURIComponent(trainingId)}`;
