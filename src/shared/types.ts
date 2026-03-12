// src/shared/types.ts
// 公開ポータル向け型定義（src/types.ts の拡張・補完）

export interface PublicTraining {
  id: string;
  name: string;
  date: string;
  capacity: number;
  applicantCount: number;
  location: string;
  summary: string;
  content: string;
  cost: string;
  startDate: string;
  endDate: string;
  instructor: string;
  fileUrl: string;
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
