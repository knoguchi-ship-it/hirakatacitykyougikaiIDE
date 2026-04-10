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
