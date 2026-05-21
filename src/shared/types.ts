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
  thumbnailUrl: string;
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

// v360: 研修名簿（出欠・事務局メモ込み）
export type AttendanceStatus = 'UNRECORDED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'SAMEDAY_CANCEL';
export type ApplicantType = 'MEMBER' | 'STAFF' | 'EXTERNAL';

export interface TrainingRosterRow {
  applyId: string;
  trainingId: string;
  applicantType: ApplicantType;
  applicantId: string;
  name: string;
  email: string;
  officeName: string;
  phone: string;
  status: string;
  applyDate: string;
  cancelDate: string;
  attendanceStatus: AttendanceStatus;
  attendanceRecordedAt: string;
  attendanceRecordedBy: string;
  adminMemo: string;
  remarks: string;
}

export interface TrainingStats {
  trainingId: string;
  capacity: number;
  applicantCount: number;
  canceledCount: number;
  remainingSlots: number;
  typeBreakdown: Record<ApplicantType, number>;
  attendanceBreakdown: Record<AttendanceStatus, number>;
  attendanceRate: number | null;
  cancellationRate: number | null;
  officeBreakdown: Array<{ officeName: string; count: number }>;
}

export interface TrainingHistoryEntry {
  applyId: string;
  trainingId: string;
  trainingName: string;
  trainingDate: string;
  location: string;
  status: string;
  attendanceStatus: AttendanceStatus;
  applyDate: string;
}

export interface TrainingMailSegment {
  attendance?: AttendanceStatus[];
  applicantTypes?: ApplicantType[];
  officeNames?: string[];
  applyIds?: string[];
}

export interface TrainingMailSegmentedPayload {
  trainingId: string;
  subject: string;
  body: string;
  from: string;
  fromName?: string;
  segment: TrainingMailSegment;
}

export interface TrainingMailLogHeader {
  logId: string;
  sentAt: string;
  senderEmail: string;
  subjectTemplate: string;
  recipients: number;
  succeeded: number;
  failed: number;
  type: string;
}

export interface TrainingMailLogDetail {
  detailId: string;
  logId: string;
  recipientType: ApplicantType;
  recipientId: string;
  recipientEmail: string;
  result: 'SENT' | 'FAILED';
  errorDetail: string;
  createdAt: string;
}

// v373.6 (S5): RosterTarget interface 撤去（旧 RosterExport 削除に伴う、新 Roster Designer は RosterDesignerRow を使用）

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
  /** v362: 検索用フリガナ（姓カナ + 名カナ）。フリガナ検索対応 */
  kana?: string;
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

// v373.6 (S5): TemplateValidationKind / TemplateValidationResult / TemplateValidationCheck 撤去
// （旧 TemplateValidationPanel 削除に伴う）

// v207: 宛名リスト Excel 出力
export type MailingListFilterType = 'KOHOUSHI' | 'OSHIRASE';

export interface MailingListTarget {
  targetKey: string;
  memberId: string;
  displayName: string;
  /** v362: 検索用フリガナ */
  kana?: string;
  memberType: 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';
  memberStatus: string;
  annualFeeStatus: 'PAID' | 'UNPAID'; // NONE は廃止済み（v314〜 記録なし=UNPAID扱い）
  annualFeeYear: number;
  /** v310: 利用可能な全年度の納入状況。未記録年度は UNPAID として返る */
  annualFeeHistories: Record<number, 'PAID' | 'UNPAID'>;
  officeName: string;
  mailingPreference: string;
  mailingDestination: string;
  addressInvalidItems: string[];
}

export interface MailingListTargetsResult {
  selectedYear: number;
  years: number[];
  targets: MailingListTarget[];
  counts: {
    business: number;
    individual: number;
    support: number;
    invalid: number;
  };
}

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

// ============================================================
// v295: 役員管理 型定義
// ============================================================

export interface Organization {
  組織コード: string;
  組織名: string;
  組織種別: string;
  表示順: number;
  全役員表示フラグ?: boolean;
  有効フラグ: boolean;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
}

export interface OfficerRole {
  役職コード: string;
  役職名: string;
  組織コード: string;
  委員長フラグ: boolean;
  表示順: number;
  有効フラグ: boolean;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
}

export interface PaymentType {
  種別コード: string;
  種別名: string;
  対象区分: '支払い' | '請求' | '両方';
  表示順: number;
  有効フラグ: boolean;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
}

export interface WorkCategory {
  業務分類コード: string;
  業務分類名: string;
  組織コード: string;
  単価: number;
  表示順: number;
  有効フラグ: boolean;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
}

export interface OfficerMasterData {
  organizations: Organization[];
  roles: OfficerRole[];
  paymentTypes: PaymentType[];
  workCategories: WorkCategory[];
}

export interface OfficerRecord {
  役員ID: string;
  会員ID: string;
  職員ID: string;         // 事業所職員の場合のみ non-empty（個人/賛助は空）
  表示名: string;
  所属名: string;         // 事業所名 or 所属先
  会員種別コード: string; // 個人/賛助は MemberType、事業所職員は 'BUSINESS_STAFF'
  役職コード: string;
  組織コード: string;
  就任日: string;
  退任日: string;
  備考: string;
  作成日時: string;
  更新日時: string;
}

export interface OfficerCandidate {
  key: string;
  memberId: string;
  staffId: string;
  label: string;
  displayName: string;
  officeName: string;
}

export interface OfficerManagementData {
  organizations: Organization[];
  roles: OfficerRole[];
  officers: OfficerRecord[];
  candidates: OfficerCandidate[];
}

export interface BankAccount {
  口座ID: string;
  会員ID: string;
  職員ID?: string;
  金融機関名: string;
  金融機関コード: string;
  支店名: string;
  支店コード: string;
  口座種別: string;
  口座番号: string;
  口座名義カナ: string;
  備考: string;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
}

export interface SaveBankAccountPayload {
  memberId?: string;
  staffId?: string;
  bankName: string;
  bankCode: string;
  branchName: string;
  branchCode: string;
  accountType: string;
  accountNumber: string;
  accountHolderKana: string;
  note?: string;
}

export interface PaymentLine {
  明細ID: string;
  支払いID: string;
  請求ID: string;
  役職コード: string;
  組織コード: string;
  種別コード: string;
  金額: number;
  対象期間FROM: string;
  対象期間TO: string;
  摘要: string;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
}

export interface PaymentRecord {
  支払いID: string;
  会員ID: string;
  表示名: string;
  支払い日: string;
  支払い方法: string;
  合計金額: number;
  振込先口座JSON: string;
  登録者メール: string;
  備考: string;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
  明細: PaymentLine[];
}

export interface SavePaymentLinePayload {
  roleCode?: string;
  organizationCode?: string;
  typeCode: string;
  amount: number;
  periodFrom?: string;
  periodTo?: string;
  note?: string;
  claimId?: string;
}

export interface SavePaymentPayload {
  memberId: string;
  paymentDate: string;
  paymentMethod: string;
  totalAmount: number;
  note?: string;
  lines: SavePaymentLinePayload[];
}

export interface MemberActiveRole {
  officerId: string;
  roleCode: string;
  roleName: string;
  organizationCode: string;
  organizationName: string;
  appointedDate: string;
}

export interface MemberOfficerStatus {
  isOfficer: boolean;
  activeRoles: MemberActiveRole[];
  bankAccount: BankAccount | null;
}

/** Drive に保存された添付ファイル1件（T_請求.添付ファイルURL に JSON 配列として保存） */
export interface ClaimAttachment {
  name: string;
  url: string;
  fileId: string;
  mimeType: string;
  uploadedAt: string;
}

export interface SaveClaimPayload {
  claimId?: string;           // 更新時のみ
  claimType: 'ACTIVITY_REPORT' | 'EXPENSE_CLAIM';
  roleCode?: string;
  organizationCode?: string;
  typeCode?: string;
  workCategoryCode?: string;
  amount: number;
  activityDate: string;       // YYYY-MM-DD
  activityDescription: string;
  attachmentsJson?: ClaimAttachment[];
}

/** T_請求 の型定義 */
export interface ClaimRecord {
  請求ID: string;
  会員ID: string;
  表示名?: string;            // getClaims_ で付与
  役職コード: string;
  組織コード: string;
  種別コード: string;
  請求種別: 'ACTIVITY_REPORT' | 'EXPENSE_CLAIM';
  業務分類コード: string;
  単価: number;
  数量: number;
  請求金額: number;
  活動日: string;
  活動内容: string;
  添付ファイルURL: string;   // JSON 配列文字列 ClaimAttachment[]
  請求状態: '申請中' | '承認済み' | '支払い済み' | '却下';
  却下理由: string;
  承認者メール: string;
  承認日時: string;
  削除フラグ: boolean;
  作成日時: string;
  更新日時: string;
}

// v374.1: 公式LINE投稿依頼
export type LinePostStatus = 'DRAFT' | 'REQUESTED' | 'POSTED';
export type LinePostTargetType = 'GENERAL' | 'TRAINING';
export type LinePostAttachmentKind = '' | 'IMAGE' | 'PDF';

export interface LinePostRequest {
  id: string;
  status: LinePostStatus;
  text: string;
  trainingApplyUrl: string;
  attachmentUrl: string;
  attachmentKind: LinePostAttachmentKind;
  attachmentName: string;
  targetType: LinePostTargetType;
  targetId: string;
  targetLabel?: string;       // backend が getLinePostRequest_ で同送（targetType=TRAINING 時）
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
  requestedAt: string;
  postedAt: string;
  postedByEmail: string;
  memo: string;
}

export interface LinePostAttachmentUploadResult {
  url: string;
  fileId: string;
  fileName: string;
  kind: LinePostAttachmentKind;
  mimeType: string;
  sizeBytes: number;
}
