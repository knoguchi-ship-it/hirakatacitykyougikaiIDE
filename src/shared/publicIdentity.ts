/**
 * 公開ポータルの本人確認で使える照合項目の単一ソース（AGENTS.md §3）。
 *
 * サーバ側の正本は `gas-src/Code.full.gs` の `PUBLIC_IDENTITY_CREDENTIALS_`。
 * 2 つが食い違うと「画面には出るのにサーバが弾く」事故になるため、
 * `npm run test:public-identity` で両者の一致を検査している。
 *
 * 設計の経緯（2026-09-06 実データ調査）:
 *   会員 347 名の充足率は 氏名 347 / CM番号 322 / 電話 157 / 携帯 106 / メール 144。
 *   照合項目を 1 つに固定すると必ず取りこぼす（個人会員は CM番号が 20 名分空、
 *   賛助会員は CM番号を持たない）。そこで「氏名（事業所名）＋ 手元にある番号を 1 つ」とし、
 *   種別ごとの違いは “選べる番号の顔ぶれ” だけに閉じ込める。
 */

export type PublicIdentityMemberType = 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';

/** 照合に使う番号の種類。サーバの payload キーと一致させること。 */
export type PublicIdentityCredentialKey = 'cmNumber' | 'officeNumber' | 'phone' | 'mobilePhone';

export interface PublicIdentityCredential {
  key: PublicIdentityCredentialKey;
  label: string;
  /** 入力欄の下に出す補足。何を入れればよいかが一目で分かる文言にする。 */
  hint: string;
  placeholder: string;
}

const CM_NUMBER: PublicIdentityCredential = {
  key: 'cmNumber',
  label: '介護支援専門員番号',
  hint: '半角数字 8 桁',
  placeholder: '例: 12345678',
};
const OFFICE_NUMBER: PublicIdentityCredential = {
  key: 'officeNumber',
  label: '事業所番号',
  hint: '半角英数字 10 文字',
  placeholder: '例: 2700123456',
};
const PHONE: PublicIdentityCredential = {
  key: 'phone',
  label: '電話番号',
  hint: 'ご登録の勤務先電話番号。ハイフンは有無どちらでも構いません',
  placeholder: '例: 072-000-0000',
};
const MOBILE_PHONE: PublicIdentityCredential = {
  key: 'mobilePhone',
  label: '携帯電話番号',
  hint: 'ご登録の携帯電話番号。ハイフンは有無どちらでも構いません',
  placeholder: '例: 090-0000-0000',
};

/** 種別ごとに選べる照合項目。並び順がそのまま画面の選択肢の順になる。 */
export const PUBLIC_IDENTITY_CREDENTIALS: Record<PublicIdentityMemberType, PublicIdentityCredential[]> = {
  INDIVIDUAL: [CM_NUMBER, PHONE, MOBILE_PHONE],
  BUSINESS: [OFFICE_NUMBER, PHONE],
  SUPPORT: [PHONE, MOBILE_PHONE],
};

/** 名義の照合方法。事業所会員だけ事業所名、ほかは姓名。 */
export const PUBLIC_IDENTITY_NAME_KIND: Record<PublicIdentityMemberType, 'person' | 'office'> = {
  INDIVIDUAL: 'person',
  BUSINESS: 'office',
  SUPPORT: 'person',
};

export interface PublicIdentityTypeCard {
  type: PublicIdentityMemberType;
  icon: string;
  label: string;
  /** カードの説明。何で確認されるのかを選ぶ前に伝える。 */
  desc: string;
}

export const PUBLIC_IDENTITY_TYPE_CARDS: PublicIdentityTypeCard[] = [
  { type: 'INDIVIDUAL', icon: '👤', label: '個人会員', desc: '氏名と、専門員番号または電話番号で確認' },
  { type: 'BUSINESS', icon: '🏢', label: '事業所会員', desc: '事業所名と、事業所番号または電話番号で確認' },
  { type: 'SUPPORT', icon: '🤝', label: '賛助会員', desc: '氏名と、電話番号または携帯番号で確認' },
];

/** 電話番号の比較キー。全角を半角に寄せ、数字だけを残す（サーバと同じ規則）。 */
export function normalizePhoneForKey(value: string): string {
  return String(value ?? '')
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '');
}

/** 番号系の比較キー（CM番号・事業所番号）。空白を除き大文字へ寄せる。 */
export function normalizeNumberForKey(value: string): string {
  return String(value ?? '').trim().replace(/\s/g, '').toUpperCase();
}

export function normalizeCredentialForKey(key: PublicIdentityCredentialKey, value: string): string {
  return key === 'phone' || key === 'mobilePhone'
    ? normalizePhoneForKey(value)
    : normalizeNumberForKey(value);
}
