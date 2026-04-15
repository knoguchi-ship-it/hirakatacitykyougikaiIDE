// src/shared/types.ts
// 公開ポータル向け型定義（src/types.ts の拡張・補完）

export interface PublicTraining {
  id: string;
  name: string;
  date: string;
  endTime: string;
  capacity: number;
  location: string;
  summary: string;
  content: string;
  cost: string;
  startDate: string;
  endDate: string;
  instructor: string;
  fileUrl: string;
  organizer: string;
  fieldConfig: string;
}

export interface ExternalApplicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  officeName: string;
  consentAt: string;
}

export interface ExternalApplyPayload {
  trainingId: string;
  name: string;
  furigana?: string;
  email: string;
  phone: string;
  officeName: string;
  consent: boolean;
  honeypot?: string;
}

export interface TrainingApplicantRow {
  applyId: string;
  trainingId: string;
  applicantType: 'MEMBER' | 'EXTERNAL';
  applicantId: string;
  name: string;
  email: string;
  officeName: string;
  status: string;
  applyDate: string;
}

// v196: PDF名簿出力
export interface RosterTarget {
  memberId: string;
  memberType: 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';
  displayName: string;
  kana: string;
  officeName: string;
  memberStatus: string;
  joinedDate: string;
  annualFeeStatus: 'PAID' | 'UNPAID' | 'NONE';
  annualFeeYear: number;
  enrolledStaffCount?: number; // BUSINESS のみ
}

// v194: 会員一括メール送信
export interface BulkMailRecipient {
  recipientKey: string;       // INDIVIDUAL/SUPPORT: memberId, BUSINESS: staffId
  memberType: 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';
  memberId: string;           // 親会員ID（BUSINESS staff の場合は事業所の会員ID）
  staffId: string | null;
  lastName: string;
  firstName: string;
  name: string;               // 姓名（スペースなし、Drive照合キー）
  displayName: string;        // 姓 + ' ' + 名（表示用）
  email: string;
  officeName: string;
  memberStatus: string;
  staffStatus: string | null;
  mailingOptOut: boolean;     // メール配信希望コード='NO' の場合 true
}

export interface EmailSendLog {
  logId: string;
  sentAt: string;
  senderEmail: string;
  subjectTemplate: string;
  totalCount: number;
  successCount: number;
  errorCount: number;
  sendType: string;
}

export type TemplateValidationKind = 'ROSTER' | 'REMINDER';
export type TemplateValidationStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface TemplateValidationCheck {
  key: string;
  label: string;
  status: TemplateValidationStatus;
  detail: string;
}

export interface TemplateValidationResult {
  kind: TemplateValidationKind;
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetName: string;
  summaryStatus: 'pass' | 'warn' | 'fail';
  visibleSheets: string[];
  hiddenSheets: string[];
  checks: TemplateValidationCheck[];
  recommendedActions: string[];
}

// v207: 宛名リスト Excel 出力
export type MailingListFilterType = 'KOHOUSHI' | 'OSHIRASE';

export interface MailingListExcelResult {
  base64: string;
  filename: string;
  counts: {
    business: number;
    individual: number;
    support: number;
    invalid: number;
  };
}
