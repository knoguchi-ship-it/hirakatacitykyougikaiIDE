/** 入会申込フォームの型定義 */

export type ApplicationMemberType = 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';

/** 事業所職員の区分（3種類） */
export type StaffRoleType = 'REPRESENTATIVE' | 'ADMIN' | 'STAFF';

/** 事業所職員エントリ */
export interface ApplicationStaffEntry {
  tempId: string;
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  careManagerNumber: string; // 必須、ログインIDとなる
  email: string;
  role: StaffRoleType;
  receiveEmail: boolean; // メール配信の有無
}

/** フォーム全体の状態 */
export interface ApplicationFormData {
  memberType: ApplicationMemberType | '';

  // 基本情報（個人/賛助: 本人、事業所: 不使用）
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  careManagerNumber: string; // 個人のみ必須

  // 勤務先情報
  officeName: string;
  officeNumber: string; // 事業所会員のみ必須
  officePostCode: string;
  officePrefecture: string;
  officeCity: string;
  officeAddressLine: string;
  phone: string;
  fax: string;

  // 自宅情報（個人/賛助のみ）
  homePostCode: string;
  homePrefecture: string;
  homeCity: string;
  homeAddressLine: string;
  mobilePhone: string;

  // 連絡設定（個人/賛助のみ）
  email: string;
  mailingPreference: 'EMAIL' | 'POST';
  preferredMailDestination: 'HOME' | 'OFFICE';

  // 事業所職員（事業所のみ）
  staff: ApplicationStaffEntry[];
}

/** 申込結果 */
export interface ApplicationResult {
  created: boolean;
  memberId: string;
  loginId?: string; // 個人/賛助の場合
  staffCredentials?: Array<{
    name: string;
    loginId: string;
    email: string;
  }>; // 事業所の場合
  emailsSent: number;
  converted?: boolean;
  transitionSummary?: string[];
}

/** バリデーションエラーマップ */
export type ValidationErrors = Record<string, string>;

export const EMPTY_STAFF_ENTRY = (): ApplicationStaffEntry => ({
  tempId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + String(Math.random()),
  lastName: '',
  firstName: '',
  lastKana: '',
  firstKana: '',
  careManagerNumber: '',
  email: '',
  role: 'STAFF',
  receiveEmail: true,
});

export const INITIAL_FORM_DATA: ApplicationFormData = {
  memberType: '',
  lastName: '',
  firstName: '',
  lastKana: '',
  firstKana: '',
  careManagerNumber: '',
  officeName: '',
  officeNumber: '',
  officePostCode: '',
  officePrefecture: '',
  officeCity: '',
  officeAddressLine: '',
  phone: '',
  fax: '',
  homePostCode: '',
  homePrefecture: '',
  homeCity: '',
  homeAddressLine: '',
  mobilePhone: '',
  email: '',
  mailingPreference: 'EMAIL',
  preferredMailDestination: 'OFFICE',
  staff: [],
};
