// SOW Section 3: Database Design Definitions

export enum MemberType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS'
}

export enum MailingPreference {
  EMAIL = 'EMAIL',
  POST = 'POST'
}

export enum MailDestination {
  HOME = 'HOME',
  OFFICE = 'OFFICE'
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID'
}

export interface TransferAccountInfo {
  bankName: string;
  branchName: string;
  accountType: '普通' | '当座';
  accountNumber: string;
  accountName: string;
  note?: string;
}

export interface AnnualFeeRecord {
  year: number;
  status: PaymentStatus;
  transferAccount?: TransferAccountInfo;
}

export type StaffRole = 'ADMIN' | 'STAFF';

export interface Staff {
  id: string; // Internal ID for UI keys
  loginId?: string;
  name: string;
  kana: string;
  email: string; // Individual email
  role: StaffRole; // Permission level
  participatedTrainingIds?: string[]; // Track training per staff
}

// Master_Billing & Master_Person merged logic for UI
export interface Member {
  id: string; // 8-digit registration number
  loginId?: string;
  
  // Name Split (For Individual: The Person / For Business: The Representative)
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  
  type: MemberType;
  
  // Business Logic: List of associated staff
  staff?: Staff[];
  
  // Office Info
  officeName: string; // Mandatory (Common Matter 2)
  officePostCode: string;
  officePrefecture: string;
  officeCity: string;
  officeAddressLine: string;
  phone: string;     // Office Phone
  fax: string;       // Mandatory (Common Matter 1)

  // Home Info
  homePostCode: string;
  homePrefecture: string;
  homeCity: string;
  homeAddressLine: string;
  mobilePhone?: string; // Personal/Mobile

  // Mailing Logic
  mailingPreference: MailingPreference; // For Notifications/Newsletter
  preferredMailDestination: MailDestination; // For mandatory physical mail (3x/year)
  email?: string; // Main Contact Email (Rep)
  
  status: 'ACTIVE' | 'WITHDRAWN';
  
  // Annual Fee History (Past 2 years)
  annualFeeHistory: AnnualFeeRecord[];

  // History (For Individuals. For Business, see Staff)
  participatedTrainingIds?: string[];
}

export interface Training {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  guidePdfUrl?: string;
  date: string;
  capacity: number;
  applicants: number;
  location: string;
  isOnline: boolean;
  status: 'OPEN' | 'CLOSED';
}
