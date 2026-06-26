// 宛名リスト出力の発送対象分類。
// GAS レスポンスの分類済み値を優先し、旧レスポンスでも同じ判定へフォールバックする。

export const MAILING_DELIVERY_SCOPE = {
  OSHIRASE: 'OSHIRASE',
  KOHOUSHI_ONLY: 'KOHOUSHI_ONLY',
};

export function resolveMailingDeliveryScope(target) {
  if (target && target.mailingDeliveryScope) {
    return String(target.mailingDeliveryScope);
  }
  var memberType = String((target && target.memberType) || '');
  var mailingPreference = String((target && target.mailingPreference) || 'EMAIL');
  return memberType === 'BUSINESS' || mailingPreference === 'POST'
    ? MAILING_DELIVERY_SCOPE.OSHIRASE
    : MAILING_DELIVERY_SCOPE.KOHOUSHI_ONLY;
}
