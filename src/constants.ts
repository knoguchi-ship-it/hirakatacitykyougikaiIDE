import { Member, MemberType, MailingPreference, MailDestination, PaymentStatus, Training } from './types';

export const MOCK_MEMBERS: Member[] = [
  {
    id: '12345678',
    lastName: '山田',
    firstName: '太郎',
    lastKana: 'ヤマダ',
    firstKana: 'タロウ',
    type: MemberType.INDIVIDUAL,
    
    // Office
    officeName: '枚方ケアプランセンター',
    officePostCode: '573-0027',
    officePrefecture: '大阪府',
    officeCity: '枚方市',
    officeAddressLine: '大垣内町1-1-1',
    phone: '072-000-0000',
    fax: '072-000-0001',
    
    // Home
    homePostCode: '573-0000',
    homePrefecture: '大阪府',
    homeCity: '枚方市',
    homeAddressLine: '自宅町1-2-3',
    mobilePhone: '090-0000-0000',
    
    // Settings
    mailingPreference: MailingPreference.EMAIL,
    preferredMailDestination: MailDestination.OFFICE,
    email: 'yamada@example.com',
    
    status: 'ACTIVE',
    annualFeeHistory: [
      { year: 2025, status: PaymentStatus.PAID },
      { year: 2024, status: PaymentStatus.PAID }
    ],
    participatedTrainingIds: ['T002']
  },
  {
    id: '87654321',
    lastName: '鈴木',
    firstName: '花子',
    lastKana: 'スズキ',
    firstKana: 'ハナコ',
    type: MemberType.INDIVIDUAL,
    
    // Office
    officeName: '勤務なし',
    officePostCode: '',
    officePrefecture: '',
    officeCity: '',
    officeAddressLine: '',
    phone: '',
    fax: '', // Will prompt to enter or use home fax if applicable in real scenario, keeping mock simple
    
    // Home
    homePostCode: '573-0121',
    homePrefecture: '大阪府',
    homeCity: '枚方市',
    homeAddressLine: '津田北町2-2-2',
    mobilePhone: '090-1111-1111',
    
    // Settings
    mailingPreference: MailingPreference.POST,
    preferredMailDestination: MailDestination.HOME,
    email: '',
    
    status: 'ACTIVE',
    annualFeeHistory: [
      { year: 2025, status: PaymentStatus.UNPAID },
      { year: 2024, status: PaymentStatus.PAID }
    ],
    participatedTrainingIds: []
  },
  {
    id: '99999999',
    lastName: '佐藤', // Representative
    firstName: '次郎', 
    lastKana: 'サトウ',
    firstKana: 'ジロウ',
    type: MemberType.BUSINESS,
    
    // Business Members Logic: Staff List
    staff: [
      { 
        id: 'S1', 
        name: '佐藤 次郎', 
        kana: 'サトウ ジロウ', 
        email: 'sato@hirakata-station.com', 
        role: 'ADMIN',
        participatedTrainingIds: ['T001', 'T002'] // Admin has attended both
      },
      { 
        id: 'S2', 
        name: '田中 三郎', 
        kana: 'タナカ サブロウ', 
        email: 'tanaka@hirakata-station.com', 
        role: 'STAFF',
        participatedTrainingIds: ['T001'] // Staff attended only T001
      },
      { 
        id: 'S3', 
        name: '伊藤 四郎', 
        kana: 'イトウ シロウ', 
        email: 'ito@hirakata-station.com', 
        role: 'STAFF',
        participatedTrainingIds: [] // New staff
      }
    ],

    // Office
    officeName: 'ひらかた介護ステーション',
    officePostCode: '573-0084',
    officePrefecture: '大阪府',
    officeCity: '枚方市',
    officeAddressLine: '香里ケ丘3-3-3',
    phone: '072-222-2222',
    fax: '072-222-2223',
    
    // Home (Ignored for Business)
    homePostCode: '',
    homePrefecture: '',
    homeCity: '',
    homeAddressLine: '',
    mobilePhone: '080-8888-8888',
    
    // Settings
    mailingPreference: MailingPreference.EMAIL,
    preferredMailDestination: MailDestination.OFFICE,
    email: 'info@hirakata-station.com', // Representative Email
    
    status: 'ACTIVE',
    annualFeeHistory: [
      { year: 2025, status: PaymentStatus.PAID },
      { year: 2024, status: PaymentStatus.PAID }
    ],
    participatedTrainingIds: [] // Cleared, as data is now in staff
  }
];

export const MOCK_TRAININGS: Training[] = [
  {
    id: 'T001',
    title: '令和8年度 介護報酬改定に伴う実務研修',
    date: '2026-02-15',
    capacity: 100,
    applicants: 85,
    location: 'オンライン (Zoom)',
    isOnline: true,
    status: 'OPEN'
  },
  {
    id: 'T002',
    title: '認知症ケア実践リーダー研修',
    date: '2026-03-10',
    capacity: 40,
    applicants: 40,
    location: '枚方市市民会館 会議室A',
    isOnline: false,
    status: 'CLOSED'
  }
];