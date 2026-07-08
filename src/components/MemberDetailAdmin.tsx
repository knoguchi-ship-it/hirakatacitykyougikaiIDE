import React, { useEffect, useMemo, useState } from 'react';
import { AnnualFeeRecord, Member, MemberType, PaymentStatus, Staff, StaffRole, AdminDashboardMemberRow, ConvertMemberTypePayload } from '../types';
import { api } from '../services/api';
import PostalCodeInput from './PostalCodeInput';
import { matchesSearchQuery } from '../utils/search';
import { normalizeKana } from '../utils/kanaNormalize';

type EditableStaff = Staff & { isNew?: boolean };
type EditableMemberForm = Record<string, any> & { staff?: EditableStaff[] };
type DraftStaffFieldKey = 'lastName' | 'firstName' | 'lastKana' | 'firstKana' | 'email' | 'careManagerNumber';
type DraftStaffFieldErrors = Partial<Record<DraftStaffFieldKey, string>>;
type AnnualFeeEditDraft = {
  id?: string;
  year: number;
  status: PaymentStatus;
  confirmedDate: string;
  amount: number;
  note: string;
  updatedAt?: string;
};

const EDITABLE_MEMBER_FIELDS = [
  'id',
  'type',
  'lastName',
  'firstName',
  'lastKana',
  'firstKana',
  'careManagerNumber',
  'staffLimit',
  'officeName',
  'officeNumber',
  'officePostCode',
  'officePrefecture',
  'officeCity',
  'officeAddressLine',
  'officeAddressLine2',
  'phone',
  'fax',
  'homePostCode',
  'homePrefecture',
  'homeCity',
  'homeAddressLine',
  'homeAddressLine2',
  'mobilePhone',
  'mailingPreference',
  'preferredMailDestination',
  'email',
  'status',
  'joinedDate',
  'withdrawnDate',
  'withdrawalProcessDate',
  'statusNote',
] as const;

const HALF_WIDTH_KANA_RE = /^[ｦ-ﾟ\s]+$/u;
// v372.4: admin 例外運用 — 厳格 (8 桁半角数字) または 緩和 (1〜10 桁半角英数字) を許容
const CARE_MANAGER_RE = /^\d{8}$/;
const CARE_MANAGER_RELAXED_RE = /^[A-Za-z0-9]{1,10}$/;
const POST_CODE_RE = /^\d{3}-?\d{4}$/;
const PHONE_RE = /^[0-9-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_NOTE_MAX_LENGTH = 2000;

// 全角カナ・ひらがな → 半角カナ変換（保存時に適用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toHalfWidthKana_DEPRECATED_v376 = (value: string): string => {
  // ひらがな → 全角カナ
  let s = value.replace(/[\u3041-\u3096]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
  // 全角カナ → 半角カナ
  const fullToHalf: Record<string, string> = {
    'ア':'ｱ','イ':'ｲ','ウ':'ｳ','エ':'ｴ','オ':'ｵ',
    'カ':'ｶ','キ':'ｷ','ク':'ｸ','ケ':'ｹ','コ':'ｺ',
    'サ':'ｻ','シ':'ｼ','ス':'ｽ','セ':'ｾ','ソ':'ｿ',
    'タ':'ﾀ','チ':'ﾁ','ツ':'ﾂ','テ':'ﾃ','ト':'ﾄ',
    'ナ':'ﾅ','ニ':'ﾆ','ヌ':'ﾇ','ネ':'ﾈ','ノ':'ﾉ',
    'ハ':'ﾊ','ヒ':'ﾋ','フ':'ﾌ','ヘ':'ﾍ','ホ':'ﾎ',
    'マ':'ﾏ','ミ':'ﾐ','ム':'ﾑ','メ':'ﾒ','モ':'ﾓ',
    'ヤ':'ﾔ','ユ':'ﾕ','ヨ':'ﾖ',
    'ラ':'ﾗ','リ':'ﾘ','ル':'ﾙ','レ':'ﾚ','ロ':'ﾛ',
    'ワ':'ﾜ','ヲ':'ｦ','ン':'ﾝ',
    'ァ':'ｧ','ィ':'ｨ','ゥ':'ｩ','ェ':'ｪ','ォ':'ｫ',
    'ッ':'ｯ','ャ':'ｬ','ュ':'ｭ','ョ':'ｮ',
    'ガ':'ｶﾞ','ギ':'ｷﾞ','グ':'ｸﾞ','ゲ':'ｹﾞ','ゴ':'ｺﾞ',
    'ザ':'ｻﾞ','ジ':'ｼﾞ','ズ':'ｽﾞ','ゼ':'ｾﾞ','ゾ':'ｿﾞ',
    'ダ':'ﾀﾞ','ヂ':'ﾁﾞ','ヅ':'ﾂﾞ','デ':'ﾃﾞ','ド':'ﾄﾞ',
    'バ':'ﾊﾞ','ビ':'ﾋﾞ','ブ':'ﾌﾞ','ベ':'ﾍﾞ','ボ':'ﾎﾞ',
    'パ':'ﾊﾟ','ピ':'ﾋﾟ','プ':'ﾌﾟ','ペ':'ﾍﾟ','ポ':'ﾎﾟ',
    'ヴ':'ｳﾞ','ヰ':'ｲ','ヱ':'ｴ','ー':'ｰ','。':'｡','「':'｢','」':'｣','、':'､','・':'･',
  };
  return s.replace(/[ァ-ヶー。「」、・]/g, (c) => fullToHalf[c] || c);
};
// v372.4: admin 例外運用 — 半角英数字を許容 (10 桁まで切詰、大文字化)
const normalizeCareManagerInput = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase();
const validateHalfWidthKana = (value: string) => !value.trim() || HALF_WIDTH_KANA_RE.test(value.trim());
// v372.4: admin 画面は厳格 (8 桁数字) または緩和 (1〜10 桁英数字) のどちらかを許容
const validateCareManagerNumber = (value: string) => {
  const s = value.trim();
  return !s || CARE_MANAGER_RE.test(s) || CARE_MANAGER_RELAXED_RE.test(s);
};
const CARE_MANAGER_NUMBER_ERROR_MSG = '介護支援専門員番号は 8 桁の半角数字、または例外として 1〜10 桁の半角英数字で入力してください。';
const validatePostCode = (value: string) => !value.trim() || POST_CODE_RE.test(value.trim());
const validatePhone = (value: string) => !value.trim() || PHONE_RE.test(value.trim());
const validateEmail = (value: string) => !value.trim() || EMAIL_RE.test(value.trim());
const joinNameParts = (lastName?: string, firstName?: string, fallback?: string) => {
  const joined = `${String(lastName || '').trim()} ${String(firstName || '').trim()}`.trim();
  return joined || String(fallback || '').trim();
};
const getFiscalYearForDate = (date: Date) => (date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear());
const formatCurrency = (amount?: number) => `${Number(amount || 0).toLocaleString('ja-JP')}円`;
const annualFeeStatusLabel = (status: PaymentStatus) => (status === PaymentStatus.PAID ? '納入済み' : '未納');
const normalizeAnnualFeeDrafts = (records: AnnualFeeRecord[] = []): AnnualFeeEditDraft[] => {
  const source = records.length > 0
    ? records
    : [{
      year: getFiscalYearForDate(new Date()),
      status: PaymentStatus.UNPAID,
      confirmedDate: '',
      amount: 0,
      note: '',
    }];
  return source
    .map((record) => ({
      id: record.id || '',
      year: Number(record.year || getFiscalYearForDate(new Date())),
      status: record.status === PaymentStatus.PAID ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      confirmedDate: record.confirmedDate || '',
      amount: Number(record.amount || 0),
      note: record.note || '',
      updatedAt: record.updatedAt || '',
    }))
    .sort((a, b) => b.year - a.year);
};
const normalizeAnnualFeeSnapshot = (records: AnnualFeeEditDraft[]) => records.map((record) => ({
  id: record.id || '',
  year: record.year,
  status: record.status,
  confirmedDate: record.status === PaymentStatus.PAID ? record.confirmedDate || '' : '',
  note: record.note || '',
}));

const normalizeEditableStaff = (staff: Partial<EditableStaff> | undefined): EditableStaff => ({
  id: String(staff?.id || ''),
  name: joinNameParts(staff?.lastName, staff?.firstName, staff?.name),
  kana: joinNameParts(staff?.lastKana, staff?.firstKana, staff?.kana),
  email: String(staff?.email || '').trim(),
  role: (staff?.role || 'STAFF') as StaffRole,
  status: (staff?.status || 'ENROLLED') as 'ENROLLED' | 'LEFT',
  joinedDate: String(staff?.joinedDate || ''),
  withdrawnDate: String(staff?.withdrawnDate || ''),
  careManagerNumber: String(staff?.careManagerNumber || '').trim(),
  mailingPreference: String(staff?.mailingPreference || 'YES'),
  lastName: String(staff?.lastName || '').trim(),
  firstName: String(staff?.firstName || '').trim(),
  lastKana: String(staff?.lastKana || '').trim(),
  firstKana: String(staff?.firstKana || '').trim(),
  isNew: staff?.isNew === true,
});

const isBlankDraftStaff = (staff: Partial<EditableStaff> | undefined) =>
  !String(staff?.name || '').trim()
  && !String(staff?.kana || '').trim()
  && !String(staff?.email || '').trim()
  && !String(staff?.careManagerNumber || '').trim()
  && !String(staff?.lastName || '').trim()
  && !String(staff?.firstName || '').trim()
  && !String(staff?.lastKana || '').trim()
  && !String(staff?.firstKana || '').trim();

const sanitizeStaffList = (staffList: EditableStaff[] = []): Staff[] =>
  staffList
    .filter((staff) => !(staff.isNew && isBlankDraftStaff(staff)))
    .map(({ isNew, ...staff }) => ({
      ...staff,
      id: String(staff.id || ''),
      name: joinNameParts(staff.lastName, staff.firstName, staff.name),
      kana: joinNameParts(staff.lastKana, staff.firstKana, staff.kana),
      email: String(staff.email || '').trim(),
      careManagerNumber: String(staff.careManagerNumber || '').trim(),
      lastName: String(staff.lastName || '').trim(),
      firstName: String(staff.firstName || '').trim(),
      lastKana: String(staff.lastKana || '').trim(),
      firstKana: String(staff.firstKana || '').trim(),
    }));

const normalizeDraftStaffList = (staffList: EditableStaff[] = []): EditableStaff[] =>
  staffList
    .map(normalizeEditableStaff)
    .filter((staff) => !(staff.isNew && isBlankDraftStaff(staff)));

const normalizeEditableMember = (value: Partial<EditableMemberForm> | undefined) => {
  const normalized: Record<string, unknown> = {};
  for (const field of EDITABLE_MEMBER_FIELDS) {
    normalized[field] = String(value?.[field] ?? '');
  }
  normalized.staff = sanitizeStaffList((value?.staff as EditableStaff[] | undefined) || [])
    .map(normalizeEditableStaff)
    .sort((a, b) => a.id.localeCompare(b.id));
  return normalized;
};

const snapshotsEqual = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const generateStaffDraftId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `staff-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const createEmptyStaffDraft = (): EditableStaff => ({
  id: generateStaffDraftId(),
  name: '',
  kana: '',
  email: '',
  role: 'STAFF',
  status: 'ENROLLED',
  joinedDate: new Date().toISOString().slice(0, 10),
  careManagerNumber: '',
  mailingPreference: 'YES',
  lastName: '',
  firstName: '',
  lastKana: '',
  firstKana: '',
  isNew: true,
});

interface MemberDetailAdminProps {
  member?: Member;
  /** BUSINESS 事業所のリスト（個人→事業所転籍時の選択用） */
  businessMembers?: AdminDashboardMemberRow[];
  /** 個人/賛助会員のリスト（事業所詳細画面での既存会員転籍用） */
  individualMembers?: AdminDashboardMemberRow[];
  onBack: () => void;
  onSaved: (updatedMember?: Member) => void;
  /** v126: 職員詳細へのDrilldown遷移 */
  onOpenStaffDetail?: (memberId: string, staffId: string) => void;
  /** 職員詳細からの保存成功トースト */
  staffSaveToast?: string | null;
  onDismissStaffSaveToast?: () => void;
}

const MemberDetailAdmin: React.FC<MemberDetailAdminProps> = ({ member, businessMembers, individualMembers, onBack, onSaved, onOpenStaffDetail, staffSaveToast, onDismissStaffSaveToast }) => {
  if (!member) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm text-primary-600 hover:underline">&larr; 会員一覧に戻る</button>
        <p className="mt-4 text-slate-500">会員が選択されていません。</p>
      </div>
    );
  }

  const [form, setForm] = useState<EditableMemberForm>({ ...(member as EditableMemberForm) });
  const [initialSnapshot, setInitialSnapshot] = useState(() => normalizeEditableMember(member as EditableMemberForm));
  const [annualFeeDrafts, setAnnualFeeDrafts] = useState<AnnualFeeEditDraft[]>(() => normalizeAnnualFeeDrafts(member.annualFeeHistory || []));
  const [initialAnnualFeeSnapshot, setInitialAnnualFeeSnapshot] = useState(() => normalizeAnnualFeeSnapshot(normalizeAnnualFeeDrafts(member.annualFeeHistory || [])));
  const [annualFeeSavingYear, setAnnualFeeSavingYear] = useState<number | null>(null);
  const [annualFeeErrors, setAnnualFeeErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // v376.55: パスワードリセット — 認証アカウント一覧 / 結果モーダル
  const [authAccounts, setAuthAccounts] = useState<Array<{ authId: string; loginId: string; method: string; active: boolean; locked: boolean; unit: 'MEMBER' | 'STAFF'; personName: string }> | null>(null);
  const [authAccountsLoading, setAuthAccountsLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ loginId: string; newPassword: string } | null>(null);
  // v126: blur バリデーション用 touched 状態
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [draftStaffErrors, setDraftStaffErrors] = useState<Record<string, DraftStaffFieldErrors>>({});

  // member props が変更されたら form を再同期（インライン編集後のリロード対応）
  useEffect(() => {
    const nextForm = { ...(member as EditableMemberForm) };
    setForm(nextForm);
    setInitialSnapshot(normalizeEditableMember(nextForm));
    const nextAnnualFeeDrafts = normalizeAnnualFeeDrafts(member.annualFeeHistory || []);
    setAnnualFeeDrafts(nextAnnualFeeDrafts);
    setInitialAnnualFeeSnapshot(normalizeAnnualFeeSnapshot(nextAnnualFeeDrafts));
    setAnnualFeeErrors({});
    setAnnualFeeSavingYear(null);
    setTouched({});
    setValidationErrors({});
    setDraftStaffErrors({});
  }, [member]);

  // 職員保存トーストの自動消去
  useEffect(() => {
    if (staffSaveToast) {
      const timer = setTimeout(() => onDismissStaffSaveToast?.(), 4000);
      return () => clearTimeout(timer);
    }
  }, [staffSaveToast]);

  // 転籍モーダル状態（個人→事業所：個人会員ページから）
  const [showConvertToStaffModal, setShowConvertToStaffModal] = useState(false);
  const [convertTargetOfficeId, setConvertTargetOfficeId] = useState('');
  const [convertStaffRole, setConvertStaffRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  // 賛助会員転籍時の介護支援専門員番号入力
  const [convertCareManagerNumber, setConvertCareManagerNumber] = useState('');
  const [convertCareManagerNumberError, setConvertCareManagerNumberError] = useState('');

  // 既存個人会員を転籍モーダル（事業所会員ページから）
  const [showConvertFromIndividualModal, setShowConvertFromIndividualModal] = useState(false);
  const [convertFromIndividualId, setConvertFromIndividualId] = useState('');
  const [convertFromIndividualRole, setConvertFromIndividualRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [convertFromIndividualCareNum, setConvertFromIndividualCareNum] = useState('');
  const [convertFromIndividualCareNumError, setConvertFromIndividualCareNumError] = useState('');
  const [convertFromIndividualSearch, setConvertFromIndividualSearch] = useState('');

  // 職員→個人転換モーダル
  const [showConvertToIndividualModal, setShowConvertToIndividualModal] = useState(false);
  const [convertSourceStaffId, setConvertSourceStaffId] = useState('');
  const [convertNewRepStaffId, setConvertNewRepStaffId] = useState('');

  const set = (key: string, value: any) => {
    let nextValue = value;
    if (key === 'careManagerNumber') {
      nextValue = normalizeCareManagerInput(String(value || ''));
    }
    setForm(prev => ({ ...prev, [key]: nextValue }));
  };
  const isBusiness = form.type === MemberType.BUSINESS;
  const isSupport = form.type === MemberType.SUPPORT;
  const isIndividualLike = !isBusiness;
  const preferredMailDestination = String(form.preferredMailDestination || 'OFFICE');
  const currentSnapshot = useMemo(() => normalizeEditableMember(form), [form]);
  const isDirty = useMemo(() => !snapshotsEqual(currentSnapshot, initialSnapshot), [currentSnapshot, initialSnapshot]);
  const currentAnnualFeeSnapshot = useMemo(() => normalizeAnnualFeeSnapshot(annualFeeDrafts), [annualFeeDrafts]);
  const isAnnualFeeDirty = useMemo(
    () => !snapshotsEqual(currentAnnualFeeSnapshot, initialAnnualFeeSnapshot),
    [currentAnnualFeeSnapshot, initialAnnualFeeSnapshot],
  );
  const isStaffDirty = useMemo(
    () => !snapshotsEqual(currentSnapshot.staff, initialSnapshot.staff),
    [currentSnapshot, initialSnapshot],
  );

  // ── v126: 事業所会員の必須フィールド定義 ──
  const businessRequiredFields: Record<string, string> = {
    officeName: '事業所名',
    officeNumber: '事業所番号',
    officePostCode: '郵便番号',
    officePrefecture: '都道府県',
    officeCity: '市区町村',
    officeAddressLine: '番地',
    phone: '電話番号',
    email: 'メールアドレス',
  };

  // v127: 個人会員の介護支援専門員番号必須（賛助会員は任意）
  const individualRequiredFields: Record<string, string> = {
    lastKana: 'セイ',
    firstKana: 'メイ',
    ...(isSupport ? {} : { careManagerNumber: '介護支援専門員番号' }),
  };
  const fieldLabels: Record<string, string> = {
    lastKana: 'セイ',
    firstKana: 'メイ',
    careManagerNumber: '介護支援専門員番号',
    officeName: '事業所名',
    officePostCode: '郵便番号',
    officePrefecture: '都道府県',
    officeCity: '市区町村',
    officeAddressLine: '番地',
    homePostCode: '郵便番号',
    homePrefecture: '都道府県',
    homeCity: '市区町村',
    homeAddressLine: '番地',
    phone: '勤務先電話番号',
    mobilePhone: '携帯電話番号',
    fax: 'FAX番号',
  };
  const getFieldAnchorId = (fieldKey: string) => `admin-member-${fieldKey}`;
  const focusField = (fieldKey: string) => {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(getFieldAnchorId(fieldKey));
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if ('focus' in element && typeof (element as HTMLElement).focus === 'function') {
      (element as HTMLElement).focus();
    }
  };

  const validateField = (key: string, value: string): string => {
    if (isBusiness && businessRequiredFields[key] && !value.trim()) {
      const originalValue = String((member as any)[key] || '').trim();
      if (!originalValue) return '';
      return `${businessRequiredFields[key]}は必須です。`;
    }
    if (isIndividualLike && individualRequiredFields[key] && !value.trim()) {
      return `${individualRequiredFields[key]}は必須です。`;
    }
    if ((key === 'lastKana' || key === 'firstKana') && value.trim() && !validateHalfWidthKana(value)) {
      return `${fieldLabels[key]}は半角ｶﾅで入力してください。`;
    }
    if (key === 'email' && value.trim() && !validateEmail(value)) {
      return 'メールアドレスの形式が不正です。';
    }
    if (key === 'careManagerNumber') {
      if (!isSupport && !value.trim()) return '介護支援専門員番号は必須です。';
      if (value.trim() && !validateCareManagerNumber(value)) {
        return CARE_MANAGER_NUMBER_ERROR_MSG;
      }
    }
    if (isIndividualLike && preferredMailDestination === 'OFFICE' && key === 'officeName' && !value.trim()) {
      return '郵送先を勤務先にする場合、事業所名は必須です。';
    }
    if (isIndividualLike && preferredMailDestination === 'HOME' && ['homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine'].includes(key) && !value.trim()) {
      return `郵送先を自宅にする場合、${fieldLabels[key]}は必須です。`;
    }
    if (isIndividualLike && (key === 'phone' || key === 'mobilePhone')) {
      const officePhone = String(key === 'phone' ? value : form.phone || '').trim();
      const mobilePhone = String(key === 'mobilePhone' ? value : form.mobilePhone || '').trim();
      if (!officePhone && !mobilePhone) {
        return '勤務先電話番号または携帯電話番号のどちらか1つを入力してください。';
      }
    }
    if ((key === 'officePostCode' || key === 'homePostCode') && value.trim() && !validatePostCode(value)) {
      return '郵便番号は 573-0084 の形式で入力してください。';
    }
    if ((key === 'phone' || key === 'mobilePhone' || key === 'fax') && value.trim() && !validatePhone(value)) {
      return `${fieldLabels[key]}は半角数字とハイフンのみで入力してください。`;
    }
    return '';
  };

  const handleBlur = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const err = validateField(key, String(form[key] || ''));
    setValidationErrors(prev => ({ ...prev, [key]: err }));
  };

  const validateAllRequired = (overrideForm?: Partial<EditableMemberForm>): Record<string, string> => {
    const src = overrideForm ? { ...form, ...overrideForm } : form;
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    if (isBusiness) {
      for (const key of Object.keys(businessRequiredFields)) {
        const err = validateField(key, String((src as any)[key] || ''));
        if (err) errors[key] = err;
        allTouched[key] = true;
      }
    }
    if (isIndividualLike) {
      for (const key of [
        ...Object.keys(individualRequiredFields),
        'officeName',
        'officePostCode',
        'homePostCode',
        'homePrefecture',
        'homeCity',
        'homeAddressLine',
        'phone',
        'mobilePhone',
        'fax',
      ]) {
        const err = validateField(key, String((src as any)[key] || ''));
        if (err) errors[key] = err;
        allTouched[key] = true;
      }
    }
    setValidationErrors(errors);
    setTouched(prev => ({ ...prev, ...allTouched }));
    return errors;
  };

  const validateDraftStaff = (staff: Partial<EditableStaff> | undefined): DraftStaffFieldErrors => {
    if (!staff || isBlankDraftStaff(staff)) return {};
    const errors: DraftStaffFieldErrors = {};
    const lastName = String(staff.lastName || '').trim();
    const firstName = String(staff.firstName || '').trim();
    const lastKana = String(staff.lastKana || '').trim();
    const firstKana = String(staff.firstKana || '').trim();
    const email = String(staff.email || '').trim();
    const careManagerNumber = String(staff.careManagerNumber || '').trim();
    if (!lastName) errors.lastName = '氏は必須です。';
    if (!firstName) errors.firstName = '名は必須です。';
    if (!lastKana) errors.lastKana = 'セイは必須です。';
    else if (!validateHalfWidthKana(lastKana)) errors.lastKana = 'セイは半角ｶﾅで入力してください。';
    if (!firstKana) errors.firstKana = 'メイは必須です。';
    else if (!validateHalfWidthKana(firstKana)) errors.firstKana = 'メイは半角ｶﾅで入力してください。';
    if (!email) {
      errors.email = 'メールアドレスは必須です。';
    } else if (!validateEmail(email)) {
      errors.email = 'メールアドレスの形式が不正です。';
    }
    if (!careManagerNumber) {
      errors.careManagerNumber = '介護支援専門員番号は必須です。';
    } else if (!validateCareManagerNumber(careManagerNumber)) {
      errors.careManagerNumber = CARE_MANAGER_NUMBER_ERROR_MSG;
    }
    return errors;
  };

  const collectDraftStaffErrors = (staffList: EditableStaff[] = []): Record<string, DraftStaffFieldErrors> => {
    const nextErrors: Record<string, DraftStaffFieldErrors> = {};
    for (const staff of staffList) {
      if (!staff.isNew) continue;
      const staffErrors = validateDraftStaff(staff);
      if (Object.keys(staffErrors).length > 0) {
        nextErrors[staff.id] = staffErrors;
      }
    }
    return nextErrors;
  };

  const getFirstDraftStaffErrorMessage = (staffList: EditableStaff[] = []) => {
    const fieldOrder: DraftStaffFieldKey[] = ['lastName', 'firstName', 'lastKana', 'firstKana', 'email', 'careManagerNumber'];
    const labelMap: Record<DraftStaffFieldKey, string> = {
      lastName: '氏',
      firstName: '名',
      lastKana: 'セイ',
      firstKana: 'メイ',
      email: 'メールアドレス',
      careManagerNumber: '介護支援専門員番号',
    };
    for (let i = 0; i < staffList.length; i += 1) {
      const staff = staffList[i];
      if (!staff.isNew) continue;
      const errors = validateDraftStaff(staff);
      for (const field of fieldOrder) {
        if (errors[field]) {
          return `職員 ${i + 1} 行目の${labelMap[field]}を確認してください。`;
        }
      }
    }
    return '職員追加行の入力内容を確認してください。';
  };

  const getDraftStaffFieldClass = (staffId: string, field: DraftStaffFieldKey) => {
    const base = 'w-full min-w-0 border rounded px-3 py-2 text-sm';
    return draftStaffErrors[staffId]?.[field]
      ? `${base} border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500`
      : `${base} border-slate-300`;
  };

  // ── フィールド描画ヘルパー ──
  const fieldClass = (key?: string) => {
    const base = 'w-full border rounded px-3 py-2 text-sm';
    const hasError = key && touched[key] && validationErrors[key];
    return hasError
      ? `${base} border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500`
      : `${base} border-slate-300`;
  };
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

  const RequiredMark = () => <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;
  const errorSummaryEntries = Object.entries(validationErrors).filter(([fieldKey, message]) => touched[fieldKey] && !!message);

  const FieldError = ({ fieldKey }: { fieldKey: string }) => {
    if (!touched[fieldKey] || !validationErrors[fieldKey]) return null;
    return (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1" id={`err-${fieldKey}`} role="alert">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        {validationErrors[fieldKey]}
      </p>
    );
  };

  const handleSave = async () => {
    // v376: 保存前にセイ・メイを全角カタカナに正規化（半角カナ・ひらがな・全角カナを受け付け）
    const convertedStaff = form.staff
      ? (form.staff as any[]).map(s => ({
          ...s,
          lastKana: normalizeKana(s.lastKana),
          firstKana: normalizeKana(s.firstKana),
        }))
      : form.staff;
    const normalizedStaff = normalizeDraftStaffList((convertedStaff as EditableStaff[]) || []);
    const convertedForm: EditableMemberForm = {
      ...form,
      lastKana: normalizeKana(form.lastKana),
      firstKana: normalizeKana(form.firstKana),
      staff: normalizedStaff,
    };
    setForm(convertedForm);
    const nextDraftStaffErrors = collectDraftStaffErrors(normalizedStaff);
    setDraftStaffErrors(nextDraftStaffErrors);
    if (Object.keys(nextDraftStaffErrors).length > 0) {
      setError(getFirstDraftStaffErrorMessage(normalizedStaff));
      return;
    }
    const nextErrors = validateAllRequired(convertedForm);
    if (Object.keys(nextErrors).length > 0) {
      focusField(Object.keys(nextErrors)[0]);
      setError('入力内容を確認し、エラー項目を修正してください。');
      return;
    }
    // 事業所会員: 新規追加ドラフトの介護支援専門員番号必須チェック
    if (isBusiness) {
      const draftStaff = ((convertedForm.staff as EditableStaff[]) || []).filter(s => s.isNew);
      for (let i = 0; i < draftStaff.length; i++) {
        const s = draftStaff[i];
        if (isBlankDraftStaff(s)) continue;
        if (!String(s.lastName || '').trim()) {
          setError(`職員 ${i + 1} 行目の氏が未入力です。`);
          return;
        }
        if (!String(s.firstName || '').trim()) {
          setError(`職員 ${i + 1} 行目の名が未入力です。`);
          return;
        }
        if (!String(s.lastKana || '').trim()) {
          setError(`職員 ${i + 1} 行目のセイが未入力です。`);
          return;
        }
        if (!validateHalfWidthKana(String(s.lastKana || '').trim())) {
          setError(`職員 ${i + 1} 行目のセイは半角ｶﾅで入力してください。`);
          return;
        }
        if (!String(s.firstKana || '').trim()) {
          setError(`職員 ${i + 1} 行目のメイが未入力です。`);
          return;
        }
        if (!validateHalfWidthKana(String(s.firstKana || '').trim())) {
          setError(`職員 ${i + 1} 行目のメイは半角ｶﾅで入力してください。`);
          return;
        }
        const email = String(s.email || '').trim();
        if (!email) {
          setError(`職員 ${i + 1} 行目のメールアドレスが未入力です。`);
          return;
        }
        if (!validateEmail(email)) {
          setError(`職員 ${i + 1} 行目のメールアドレスの形式が不正です。`);
          return;
        }
        if (!String(s.careManagerNumber || '').trim()) {
          setError(`職員 ${i + 1} 番目の介護支援専門員番号が未入力です。`);
          return;
        }
        if (!validateCareManagerNumber(String(s.careManagerNumber || ''))) {
          setError(`職員 ${i + 1} 番目の介護支援専門員番号は 8 桁の半角数字、または例外として 1〜10 桁の半角英数字で入力してください。`);
          return;
        }
      }
    }
    // 事業所会員は郵送先区分を固定OFFICE
    const sanitizedStaff = sanitizeStaffList((convertedForm.staff as EditableStaff[]) || []);
    const nextForm = { ...convertedForm, staff: sanitizedStaff } as Member;
    const payload: EditableMemberForm = { ...nextForm };
    const statusNote = String(payload.statusNote || '');
    if (statusNote.length > STATUS_NOTE_MAX_LENGTH) {
      setError(`ステータスメモは ${STATUS_NOTE_MAX_LENGTH} 文字以内で入力してください。`);
      return;
    }
    if (isBusiness) {
      payload.preferredMailDestination = 'OFFICE';
    }
    if (!isStaffDirty) {
      delete payload.staff;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await api.updateMember(payload as Member);
      setForm(nextForm as EditableMemberForm);
      setInitialSnapshot(normalizeEditableMember(nextForm as EditableMemberForm));
      setDraftStaffErrors({});
      setSuccessMsg('会員情報を更新しました。');
      onSaved(nextForm);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const updateAnnualFeeDraft = (year: number, patch: Partial<AnnualFeeEditDraft>) => {
    setAnnualFeeDrafts((prev) => prev.map((record) => {
      if (record.year !== year) return record;
      const next = { ...record, ...patch };
      if (patch.status === PaymentStatus.UNPAID) {
        next.confirmedDate = '';
      }
      return next;
    }));
    setAnnualFeeErrors((prev) => {
      if (!prev[year]) return prev;
      const { [year]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleAnnualFeeSave = async (draft: AnnualFeeEditDraft) => {
    if (draft.status === PaymentStatus.PAID && !draft.confirmedDate) {
      setAnnualFeeErrors((prev) => ({ ...prev, [draft.year]: '納入済みにする場合は納入確認日を入力してください。' }));
      return;
    }
    if ((draft.note || '').length > 2000) {
      setAnnualFeeErrors((prev) => ({ ...prev, [draft.year]: '備考は 2000 文字以内で入力してください。' }));
      return;
    }
    try {
      setAnnualFeeSavingYear(draft.year);
      setError(null);
      setSuccessMsg(null);
      const saved = await api.saveAnnualFeeRecord({
        id: draft.id || undefined,
        memberId: String(form.id),
        year: draft.year,
        status: draft.status,
        confirmedDate: draft.status === PaymentStatus.PAID ? draft.confirmedDate : '',
        note: draft.note,
      });
      const nextAnnualFeeDrafts = annualFeeDrafts
        .map((record) => record.year === saved.year
          ? {
            id: saved.id,
            year: saved.year,
            status: saved.status,
            confirmedDate: saved.confirmedDate || '',
            amount: saved.amount,
            note: saved.note || '',
            updatedAt: saved.updatedAt || '',
          }
          : record)
        .sort((a, b) => b.year - a.year);
      setAnnualFeeDrafts(nextAnnualFeeDrafts);
      setInitialAnnualFeeSnapshot(normalizeAnnualFeeSnapshot(nextAnnualFeeDrafts));
      setAnnualFeeErrors((prev) => {
        const { [draft.year]: _removed, ...rest } = prev;
        return rest;
      });
      const nextMember = {
        ...(form as Member),
        annualFeeHistory: nextAnnualFeeDrafts.map((record) => ({
          id: record.id,
          year: record.year,
          status: record.status,
          confirmedDate: record.confirmedDate,
          amount: record.amount,
          note: record.note,
          updatedAt: record.updatedAt,
        })),
      };
      setForm(nextMember as EditableMemberForm);
      setInitialSnapshot(normalizeEditableMember(nextMember as EditableMemberForm));
      setSuccessMsg(`${saved.year}年度の年会費情報を保存しました。`);
      onSaved(nextMember);
    } catch (e) {
      setAnnualFeeErrors((prev) => ({ ...prev, [draft.year]: e instanceof Error ? e.message : '年会費情報の保存に失敗しました。' }));
    } finally {
      setAnnualFeeSavingYear(null);
    }
  };

  // ── v376.55: パスワード管理（認証アカウント一覧の遅延読込 → 認証IDでリセット） ──
  const handleLoadAuthAccounts = async () => {
    try {
      setAuthAccountsLoading(true);
      setError(null);
      const accounts = await api.getMemberAuthAccounts(String(form.id));
      setAuthAccounts(accounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : '認証アカウントの取得に失敗しました。');
    } finally {
      setAuthAccountsLoading(false);
    }
  };

  const handleResetPassword = async (authId: string, loginId: string) => {
    if (!confirm(`ログインID「${loginId}」のパスワードをリセットしますか？\n\n新しいパスワードが発行され、現在のパスワードは無効になります。ロックも解除されます。`)) return;
    try {
      setActionLoading('reset-' + authId);
      setError(null);
      const res = await api.adminResetMemberPassword(authId);
      setResetResult({ loginId: res.loginId, newPassword: res.newPassword });
      // 一覧のロック状態表示を更新（再取得）
      await handleLoadAuthAccounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'パスワードリセットに失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 退会処理（個人/賛助 即時退会） ──
  const handleWithdraw = async () => {
    if (!confirm('会員を退会処理しますか？この操作は会員の状態を「退会済」に変更し、ログインアカウントを無効化します。')) return;
    try {
      setActionLoading('withdraw');
      setError(null);
      await api.withdrawMember(String(form.id));
      setSuccessMsg('退会処理が完了しました。');
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '退会処理に失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // ── v126: 事業所会員の予約退会（翌年度4/1無効化） ──
  const handleScheduleWithdraw = async () => {
    // 翌年度4/1をフロント側でも算出（確認ダイアログ用）
    const now = new Date();
    const fy = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
    const nextFyDate = `${fy + 1}年4月1日`;
    if (!confirm(
      `事業所会員の退会を予約します。\n\n` +
      `・退会予定日: ${nextFyDate}\n` +
      `・退会日まではログイン・サービス利用が可能です\n` +
      `・退会日に全職員のアカウントが無効化されます\n` +
      `・年度末までキャンセル可能です\n\n` +
      `よろしいですか？`
    )) return;
    try {
      setActionLoading('scheduleWithdraw');
      setError(null);
      await api.scheduleWithdrawMember(String(form.id));
      setSuccessMsg(`退会を予約しました（${nextFyDate}に無効化されます）。`);
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '退会予約に失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // ── v126: 予約退会キャンセル ──
  const handleCancelScheduledWithdraw = async () => {
    if (!confirm('退会予定をキャンセルしますか？会員状態が「在籍中」に戻ります。')) return;
    try {
      setActionLoading('cancelWithdraw');
      setError(null);
      await api.cancelScheduledWithdraw(String(form.id));
      setSuccessMsg('退会予定をキャンセルしました。');
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '退会キャンセルに失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 除籍処理 ──
  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`${staffName} を事業所から除籍しますか？ログインアカウントは無効化されます。`)) return;
    try {
      setActionLoading('remove-' + staffId);
      setError(null);
      await api.removeStaffFromOffice(String(form.id), staffId);
      setSuccessMsg(`${staffName} を除籍しました。`);
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '除籍処理に失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 個人→事業所メンバー転籍（個人会員ページから） ──
  const handleConvertToStaff = async () => {
    if (!convertTargetOfficeId) { setError('転籍先の事業所を選択してください。'); return; }
    // 賛助会員で介護支援専門員番号がない場合は入力必須
    if (isSupport && !String(form.careManagerNumber || '').trim()) {
      const cm = String(convertCareManagerNumber || '').trim();
      if (!cm) { setConvertCareManagerNumberError('介護支援専門員番号は必須です。'); return; }
      if (!validateCareManagerNumber(cm)) { setConvertCareManagerNumberError(CARE_MANAGER_NUMBER_ERROR_MSG); return; }
      setConvertCareManagerNumberError('');
    }
    const targetName = businessMembers?.find(b => b.memberId === convertTargetOfficeId)?.displayName || convertTargetOfficeId;
    if (!confirm(`${form.lastName || ''} ${form.firstName || ''} を ${targetName} のメンバーとして登録します。個人会員としてのステータスは退会になります。よろしいですか？`)) return;
    try {
      setActionLoading('convertToStaff');
      setError(null);
      const payload: ConvertMemberTypePayload = {
        direction: 'INDIVIDUAL_TO_STAFF',
        sourceMemberId: String(form.id),
        targetOfficeMemberId: convertTargetOfficeId,
        staffRole: convertStaffRole,
        ...(isSupport && !String(form.careManagerNumber || '').trim()
          ? { careManagerNumber: convertCareManagerNumber.trim() }
          : {}),
      };
      await api.convertMemberType(payload);
      setSuccessMsg('事業所メンバーへの転籍が完了しました。');
      setShowConvertToStaffModal(false);
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '転籍処理に失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 既存個人会員を転籍（事業所会員ページから） ──
  const handleConvertFromIndividualToThisOffice = async () => {
    if (!convertFromIndividualId) { setError('転籍する会員を選択してください。'); return; }
    const srcMember = individualMembers?.find(m => m.memberId === convertFromIndividualId);
    const isSelectedSupport = srcMember?.memberType === MemberType.SUPPORT;
    if (isSelectedSupport) {
      const cm = String(convertFromIndividualCareNum || '').trim();
      if (!cm) { setConvertFromIndividualCareNumError('介護支援専門員番号は必須です。'); return; }
      if (!validateCareManagerNumber(cm)) { setConvertFromIndividualCareNumError(CARE_MANAGER_NUMBER_ERROR_MSG); return; }
      setConvertFromIndividualCareNumError('');
    }
    const memberName = srcMember?.displayName || convertFromIndividualId;
    if (!confirm(`${memberName} をこの事業所の職員として転籍します。個人会員としてのステータスは退会になります。よろしいですか？`)) return;
    try {
      setActionLoading('convertFromIndividual');
      setError(null);
      const payload: ConvertMemberTypePayload = {
        direction: 'INDIVIDUAL_TO_STAFF',
        sourceMemberId: convertFromIndividualId,
        targetOfficeMemberId: String(form.id),
        staffRole: convertFromIndividualRole,
        ...(isSelectedSupport ? { careManagerNumber: convertFromIndividualCareNum.trim() } : {}),
      };
      await api.convertMemberType(payload);
      setSuccessMsg(`${memberName} を職員として転籍しました。`);
      setShowConvertFromIndividualModal(false);
      setConvertFromIndividualId('');
      setConvertFromIndividualCareNum('');
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '転籍処理に失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 事業所職員→個人会員転換（v127: 最後の1名は自動退会）──
  const handleConvertToIndividual = async () => {
    if (!convertSourceStaffId) return;
    const allStaff = (form.staff as Staff[]) || [];
    const staff = allStaff.find(s => s.id === convertSourceStaffId);
    const isRep = staff?.role === 'REPRESENTATIVE';
    const otherEnrolled = allStaff.filter(s => s.id !== convertSourceStaffId && s.status !== 'LEFT');
    const isLastEnrolled = isRep && otherEnrolled.length === 0;

    if (isRep && !isLastEnrolled && !convertNewRepStaffId) {
      setError('代表者を転換する場合は後任代表者を選択してください。');
      return;
    }
    const confirmMsg = isLastEnrolled
      ? `${staff?.name || ''} は事業所の最後の在籍職員です。個人会員に転換すると、事業所は自動的に退会扱いになります。よろしいですか？`
      : `${staff?.name || ''} を個人会員として独立させます。事業所からは除籍されます。よろしいですか？`;
    if (!confirm(confirmMsg)) return;
    try {
      setActionLoading('convertToIndividual');
      setError(null);
      const payload: ConvertMemberTypePayload = {
        direction: 'STAFF_TO_INDIVIDUAL',
        sourceMemberId: String(form.id),
        sourceStaffId: convertSourceStaffId,
        ...(isRep && !isLastEnrolled && convertNewRepStaffId ? { newRepresentativeStaffId: convertNewRepStaffId } : {}),
      };
      const result = await api.convertMemberType(payload);
      const officeMsg = (result as any).officeWithdrawn ? '（事業所は退会しました）' : '';
      setSuccessMsg(`${staff?.name || ''} を個人会員に転換しました。${officeMsg}`);
      setShowConvertToIndividualModal(false);
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '転換処理に失敗しました。');
    } finally {
      setActionLoading(null);
    }
  };

  const openConvertToIndividual = (staffId: string) => {
    setConvertSourceStaffId(staffId);
    setConvertNewRepStaffId('');
    setShowConvertToIndividualModal(true);
  };

  const roleLabel = (role: string) => {
    if (role === 'REPRESENTATIVE') return '代表者';
    if (role === 'ADMIN') return '管理者';
    return 'メンバー';
  };

  // ── インライン職員更新（区分・状態の即時保存） ──
  const [inlineSaving, setInlineSaving] = useState<Record<string, boolean>>({});

  const handleInlineStaffUpdate = async (staff: Staff, field: 'role' | 'status', newValue: string) => {
    if ((field === 'role' && newValue === staff.role) || (field === 'status' && newValue === staff.status)) return;

    // 状態変更は確認ダイアログ
    if (field === 'status') {
      const msg = newValue === 'LEFT'
        ? `${staff.name} を除籍しますか？ログインアカウントは無効化されます。`
        : `${staff.name} を在籍に復帰しますか？ログインアカウントが再有効化されます。`;
      if (!confirm(msg)) return;
    }

    const saveKey = `${staff.id}-${field}`;
    setInlineSaving(prev => ({ ...prev, [saveKey]: true }));
    try {
      const result = await api.updateStaff({
        staffId: staff.id,
        memberId: String(form.id),
        lastName: staff.lastName || '',
        firstName: staff.firstName || '',
        lastKana: staff.lastKana || '',
        firstKana: staff.firstKana || '',
        name: staff.name || '',
        kana: staff.kana || '',
        email: staff.email || '',
        careManagerNumber: staff.careManagerNumber || '',
        role: field === 'role' ? newValue : staff.role,
        status: field === 'status' ? newValue : staff.status,
        joinedDate: staff.joinedDate || '',
        mailingPreference: staff.mailingPreference || 'YES',
      });
      // サーバー応答を反映（除籍時の権限強制降格を即時反映）
      const nextForm = {
        ...form,
        staff: ((form.staff as Staff[]) || []).map(s =>
          s.id === staff.id ? {
            ...s,
            [field]: newValue,
            ...(result.role != null ? { role: result.role } : {}),
            ...(result.status != null ? { status: result.status } : {}),
          } : s
        ),
      } as EditableMemberForm;
      setForm(nextForm);
      setInitialSnapshot(normalizeEditableMember(nextForm));
      onSaved({ ...(nextForm as Member), staff: sanitizeStaffList((nextForm.staff as EditableStaff[]) || []) });
    } catch (e) {
      setError(e instanceof Error ? e.message : `${staff.name}の更新に失敗しました。`);
    } finally {
      setInlineSaving(prev => ({ ...prev, [saveKey]: false }));
    }
  };

  const staffList = ((form.staff as EditableStaff[]) || []);
  const enrolledStaff = staffList.filter(s => s.status !== 'LEFT');
  const convertSourceStaff = staffList.find(s => s.id === convertSourceStaffId);
  const isConvertSourceRep = convertSourceStaff?.role === 'REPRESENTATIVE';

  const updateDraftStaff = (staffId: string, patch: Partial<EditableStaff>) => {
    let nextStaff: EditableStaff[] = [];
    setForm(prev => ({
      ...prev,
      staff: (nextStaff = (((prev.staff as EditableStaff[]) || []).map(staff =>
        staff.id === staffId
          ? normalizeEditableStaff({ ...staff, ...patch })
          : staff
      ))),
    }));
    setDraftStaffErrors(prev => {
      if (!prev[staffId]) return prev;
      const nextRowErrors = validateDraftStaff(nextStaff.find(staff => staff.id === staffId));
      if (Object.keys(nextRowErrors).length === 0) {
        const { [staffId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [staffId]: nextRowErrors };
    });
  };

  const handleAddStaff = () => {
    const nextDraft = createEmptyStaffDraft();
    setForm(prev => ({
      ...prev,
      staff: [...(((prev.staff as EditableStaff[]) || [])), nextDraft],
    }));
    setDraftStaffErrors(prev => {
      const { [nextDraft.id]: _removed, ...rest } = prev;
      return rest;
    });
    setSuccessMsg(null);
    setError(null);
  };

  const handleRemoveDraftStaff = (staffId: string) => {
    setForm(prev => ({
      ...prev,
      staff: (((prev.staff as EditableStaff[]) || []).filter(staff => staff.id !== staffId)),
    }));
    setDraftStaffErrors(prev => {
      const { [staffId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const isRequired = (key: string) => {
    if (isBusiness && businessRequiredFields[key]) {
      const originalValue = String((member as any)[key] || '').trim();
      return !!originalValue;
    }
    if (!isIndividualLike) return false;
    if (individualRequiredFields[key]) return true;
    if (key === 'officeName') return preferredMailDestination === 'OFFICE';
    if (['homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine'].includes(key)) {
      return preferredMailDestination === 'HOME';
    }
    if (key === 'phone' || key === 'mobilePhone') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-sm text-primary-600 hover:underline">&larr; 会員一覧に戻る</button>
        <h2 className="text-2xl font-bold text-slate-800">会員詳細編集</h2>
        <span className="text-sm text-slate-500">会員ID: {form.id}</span>
      </div>

      {staffSaveToast && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center justify-between transition-opacity" role="status">
          <p className="text-sm text-green-700 font-medium">{staffSaveToast}</p>
          <button onClick={() => onDismissStaffSaveToast?.()} className="text-green-500 hover:text-green-700 ml-4" aria-label="閉じる">&times;</button>
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>}
      {errorSummaryEntries.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
          <p className="text-sm font-semibold text-red-700">修正が必要な項目があります。</p>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {errorSummaryEntries.map(([fieldKey, message]) => (
              <li key={fieldKey}>
                <button type="button" onClick={() => focusField(fieldKey)} className="text-left underline underline-offset-2 hover:text-red-800">
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {successMsg && <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">{successMsg}</div>}

      {/* 退会予定バナー（事業所会員 WITHDRAWAL_SCHEDULED 時） */}
      {isBusiness && form.status === 'WITHDRAWAL_SCHEDULED' && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <div>
            <p className="text-sm font-medium text-amber-800">
              この事業所は {form.withdrawnDate} に退会予定です
            </p>
            <p className="text-xs text-amber-700 mt-1">退会日までは通常通りご利用いただけます。年度末までキャンセル可能です。</p>
          </div>
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>会員種別</label>
            <select className={fieldClass()} value={form.type || 'INDIVIDUAL'} disabled>
              <option value="INDIVIDUAL">個人会員</option>
              <option value="BUSINESS">事業所会員</option>
              <option value="SUPPORT">賛助会員</option>
            </select>
          </div>
          {/* v131: 事業所会員は姓/名/セイ/メイ/介護支援専門員番号を非表示 */}
          {!isBusiness && (
            <>
              <div>
                <label className={labelClass}>姓</label>
                <input className={fieldClass()} value={form.lastName || ''} onChange={e => set('lastName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>名</label>
                <input className={fieldClass()} value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>セイ</label>
                <input
                  id={getFieldAnchorId('lastKana')}
                  className={fieldClass('lastKana')}
                  value={form.lastKana || ''}
                  onChange={e => set('lastKana', e.target.value)}
                  onBlur={() => handleBlur('lastKana')}
                  aria-required={isRequired('lastKana')}
                  aria-invalid={touched.lastKana && !!validationErrors.lastKana}
                  aria-describedby={validationErrors.lastKana ? 'err-lastKana' : undefined}
                />
                <FieldError fieldKey="lastKana" />
              </div>
              <div>
                <label className={labelClass}>メイ</label>
                <input
                  id={getFieldAnchorId('firstKana')}
                  className={fieldClass('firstKana')}
                  value={form.firstKana || ''}
                  onChange={e => set('firstKana', e.target.value)}
                  onBlur={() => handleBlur('firstKana')}
                  aria-required={isRequired('firstKana')}
                  aria-invalid={touched.firstKana && !!validationErrors.firstKana}
                  aria-describedby={validationErrors.firstKana ? 'err-firstKana' : undefined}
                />
                <FieldError fieldKey="firstKana" />
              </div>
              <div>
                <label className={labelClass}>介護支援専門員番号{!isSupport && <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>}</label>
                <input
                  id={getFieldAnchorId('careManagerNumber')}
                  className={fieldClass('careManagerNumber')}
                  value={form.careManagerNumber || ''}
                  onChange={e => set('careManagerNumber', e.target.value)}
                  onBlur={() => handleBlur('careManagerNumber')}
                  maxLength={10}
                  aria-required={!isSupport || undefined}
                  aria-invalid={touched['careManagerNumber'] && !!validationErrors['careManagerNumber'] || undefined}
                  aria-describedby={`cm-help${validationErrors['careManagerNumber'] ? ' err-careManagerNumber' : ''}`}
                />
                {/* v372.4: admin 例外運用の注意書き */}
                <p id="cm-help" className="mt-1 text-xs text-slate-500 leading-relaxed">
                  ※ 通常は 8 桁半角数字。例外的に介護支援専門員以外を登録する場合のみ、半角英数字 10 桁まで入力可。<br />
                  看護師・保健師等は <code className="bg-slate-100 px-1 rounded">HN</code> + 事業所番号下 8 桁、社会福祉士は <code className="bg-slate-100 px-1 rounded">HS</code> + 事業所番号下 8 桁。
                </p>
                {touched['careManagerNumber'] && validationErrors['careManagerNumber'] && (
                  <p id="err-careManagerNumber" role="alert" className="mt-1 text-sm text-red-600">{validationErrors['careManagerNumber']}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 勤務先情報 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          勤務先情報
          {isBusiness && <span className="text-xs font-normal text-slate-500 ml-2"><span className="text-red-500">*</span> は必須項目</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>事業所名{isRequired('officeName') && <RequiredMark />}</label>
            <input
              id={getFieldAnchorId('officeName')}
              className={fieldClass('officeName')}
              value={form.officeName || ''}
              onChange={e => set('officeName', e.target.value)}
              onBlur={() => handleBlur('officeName')}
              aria-required={isRequired('officeName')}
              aria-invalid={touched.officeName && !!validationErrors.officeName}
              aria-describedby={validationErrors.officeName ? 'err-officeName' : undefined}
            />
            <FieldError fieldKey="officeName" />
          </div>
          {isBusiness && (
            <div>
              <label className={labelClass}>事業所番号{isRequired('officeNumber') && <RequiredMark />}</label>
              <input
                className={fieldClass('officeNumber')}
                value={form.officeNumber || ''}
                onChange={e => set('officeNumber', e.target.value)}
                onBlur={() => handleBlur('officeNumber')}
                aria-required={isRequired('officeNumber')}
                aria-invalid={touched.officeNumber && !!validationErrors.officeNumber}
                aria-describedby={validationErrors.officeNumber ? 'err-officeNumber' : undefined}
              />
              <FieldError fieldKey="officeNumber" />
            </div>
          )}
          <div>
            <label className={labelClass}>郵便番号{isRequired('officePostCode') && <RequiredMark />}</label>
            <PostalCodeInput
              id={getFieldAnchorId('officePostCode')}
              value={form.officePostCode || ''}
              onChange={value => set('officePostCode', value)}
              onBlur={() => handleBlur('officePostCode')}
              required={isRequired('officePostCode')}
              invalid={touched.officePostCode && !!validationErrors.officePostCode}
              describedBy={validationErrors.officePostCode ? 'err-officePostCode' : undefined}
              inputClassName={fieldClass('officePostCode')}
            />
            <FieldError fieldKey="officePostCode" />
          </div>
          <div>
            <label className={labelClass}>都道府県{isRequired('officePrefecture') && <RequiredMark />}</label>
            <input
              className={fieldClass('officePrefecture')}
              value={form.officePrefecture || ''}
              onChange={e => set('officePrefecture', e.target.value)}
              onBlur={() => handleBlur('officePrefecture')}
              aria-required={isRequired('officePrefecture')}
              aria-invalid={touched.officePrefecture && !!validationErrors.officePrefecture}
              aria-describedby={validationErrors.officePrefecture ? 'err-officePrefecture' : undefined}
            />
            <FieldError fieldKey="officePrefecture" />
          </div>
          <div>
            <label className={labelClass}>市区町村{isRequired('officeCity') && <RequiredMark />}</label>
            <input
              className={fieldClass('officeCity')}
              value={form.officeCity || ''}
              onChange={e => set('officeCity', e.target.value)}
              onBlur={() => handleBlur('officeCity')}
              aria-required={isRequired('officeCity')}
              aria-invalid={touched.officeCity && !!validationErrors.officeCity}
              aria-describedby={validationErrors.officeCity ? 'err-officeCity' : undefined}
            />
            <FieldError fieldKey="officeCity" />
          </div>
          <div>
            <label className={labelClass}>番地{isRequired('officeAddressLine') && <RequiredMark />}</label>
            <input
              className={fieldClass('officeAddressLine')}
              value={form.officeAddressLine || ''}
              onChange={e => set('officeAddressLine', e.target.value)}
              onBlur={() => handleBlur('officeAddressLine')}
              aria-required={isRequired('officeAddressLine')}
              aria-invalid={touched.officeAddressLine && !!validationErrors.officeAddressLine}
              aria-describedby={validationErrors.officeAddressLine ? 'err-officeAddressLine' : undefined}
              placeholder="例: 1-2-3"
            />
            <FieldError fieldKey="officeAddressLine" />
          </div>
          <div>
            <label className={labelClass}>建物名・部屋番号（任意）</label>
            <input
              className={fieldClass()}
              value={form.officeAddressLine2 || ''}
              onChange={e => set('officeAddressLine2', e.target.value)}
              placeholder="例: ○○ビル 3F"
            />
          </div>
          <div>
            <label className={labelClass}>{isBusiness ? '電話番号' : '勤務先電話番号'}{isRequired('phone') && <RequiredMark />}</label>
            <input
              id={getFieldAnchorId('phone')}
              className={fieldClass('phone')}
              value={form.phone || ''}
              onChange={e => set('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              inputMode="tel"
              aria-required={isRequired('phone')}
              aria-invalid={touched.phone && !!validationErrors.phone}
              aria-describedby={validationErrors.phone ? 'err-phone' : undefined}
            />
            <FieldError fieldKey="phone" />
          </div>
          <div>
            <label className={labelClass}>FAX番号（任意）</label>
            <input
              id={getFieldAnchorId('fax')}
              className={fieldClass('fax')}
              value={form.fax || ''}
              onChange={e => set('fax', e.target.value)}
              onBlur={() => handleBlur('fax')}
              inputMode="tel"
              aria-invalid={touched.fax && !!validationErrors.fax}
              aria-describedby={validationErrors.fax ? 'err-fax' : undefined}
            />
            <FieldError fieldKey="fax" />
          </div>
        </div>
      </div>

      {/* 自宅情報（個人/賛助のみ） */}
      {!isBusiness && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">自宅情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>郵便番号{isRequired('homePostCode') && <RequiredMark />}</label>
              <PostalCodeInput
                id={getFieldAnchorId('homePostCode')}
                value={form.homePostCode || ''}
                onChange={value => set('homePostCode', value)}
                onBlur={() => handleBlur('homePostCode')}
                required={isRequired('homePostCode')}
                invalid={touched.homePostCode && !!validationErrors.homePostCode}
                describedBy={validationErrors.homePostCode ? 'err-homePostCode' : undefined}
                inputClassName={fieldClass('homePostCode')}
              />
              <FieldError fieldKey="homePostCode" />
            </div>
            <div>
              <label className={labelClass}>都道府県{isRequired('homePrefecture') && <RequiredMark />}</label>
              <input
                id={getFieldAnchorId('homePrefecture')}
                className={fieldClass('homePrefecture')}
                value={form.homePrefecture || ''}
                onChange={e => set('homePrefecture', e.target.value)}
                onBlur={() => handleBlur('homePrefecture')}
                aria-required={isRequired('homePrefecture')}
                aria-invalid={touched.homePrefecture && !!validationErrors.homePrefecture}
                aria-describedby={validationErrors.homePrefecture ? 'err-homePrefecture' : undefined}
              />
              <FieldError fieldKey="homePrefecture" />
            </div>
            <div>
              <label className={labelClass}>市区町村{isRequired('homeCity') && <RequiredMark />}</label>
              <input
                id={getFieldAnchorId('homeCity')}
                className={fieldClass('homeCity')}
                value={form.homeCity || ''}
                onChange={e => set('homeCity', e.target.value)}
                onBlur={() => handleBlur('homeCity')}
                aria-required={isRequired('homeCity')}
                aria-invalid={touched.homeCity && !!validationErrors.homeCity}
                aria-describedby={validationErrors.homeCity ? 'err-homeCity' : undefined}
              />
              <FieldError fieldKey="homeCity" />
            </div>
            <div>
              <label className={labelClass}>番地{isRequired('homeAddressLine') && <RequiredMark />}</label>
              <input
                id={getFieldAnchorId('homeAddressLine')}
                className={fieldClass('homeAddressLine')}
                value={form.homeAddressLine || ''}
                onChange={e => set('homeAddressLine', e.target.value)}
                onBlur={() => handleBlur('homeAddressLine')}
                aria-required={isRequired('homeAddressLine')}
                aria-invalid={touched.homeAddressLine && !!validationErrors.homeAddressLine}
                aria-describedby={validationErrors.homeAddressLine ? 'err-homeAddressLine' : undefined}
                placeholder="例: 1-2-3"
              />
              <FieldError fieldKey="homeAddressLine" />
            </div>
            <div>
              <label className={labelClass}>建物名・部屋番号（任意）</label>
              <input className={fieldClass()} value={form.homeAddressLine2 || ''} onChange={e => set('homeAddressLine2', e.target.value)} placeholder="例: ○○マンション 101号室" />
            </div>
            <div>
              <label className={labelClass}>携帯電話番号{isRequired('mobilePhone') && <RequiredMark />}</label>
              <input
                id={getFieldAnchorId('mobilePhone')}
                className={fieldClass('mobilePhone')}
                value={form.mobilePhone || ''}
                onChange={e => set('mobilePhone', e.target.value)}
                onBlur={() => handleBlur('mobilePhone')}
                inputMode="tel"
                aria-required={isRequired('mobilePhone')}
                aria-invalid={touched.mobilePhone && !!validationErrors.mobilePhone}
                aria-describedby={validationErrors.mobilePhone ? 'err-mobilePhone' : undefined}
              />
              <FieldError fieldKey="mobilePhone" />
            </div>
          </div>
        </div>
      )}

      {/* 連絡設定 — 事業所会員はセクション全体を非表示（v133） */}
      {!isBusiness && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">連絡設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>メールアドレス</label>
              <input
                className={fieldClass('email')}
                type="email"
                value={form.email || ''}
                onChange={e => set('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={touched.email && !!validationErrors.email}
                aria-describedby={validationErrors.email ? 'err-email' : undefined}
              />
              <FieldError fieldKey="email" />
            </div>
            <div>
              <label className={labelClass}>発送方法</label>
              <select className={fieldClass()} value={form.mailingPreference || 'EMAIL'} onChange={e => set('mailingPreference', e.target.value)}>
                <option value="EMAIL">メール配信</option>
                <option value="POST">郵送希望</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>郵送先区分</label>
              <select className={fieldClass()} value={form.preferredMailDestination || 'OFFICE'} onChange={e => set('preferredMailDestination', e.target.value)}>
                <option value="OFFICE">勤務先</option>
                <option value="HOME">自宅</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ステータス */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">ステータス</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>会員状態</label>
            <select className={fieldClass()} value={form.status || 'ACTIVE'} onChange={e => set('status', e.target.value)}>
              <option value="ACTIVE">在籍中</option>
              <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
              <option value="WITHDRAWN">退会済</option>
              <option value="TRANSFERRED">移行済み</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>入会日</label>
            <input className={fieldClass()} type="date" value={form.joinedDate || ''} onChange={e => set('joinedDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>退会日</label>
            <input className={fieldClass()} type="date" value={form.withdrawnDate || ''} onChange={e => set('withdrawnDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>退会処理日</label>
            <input className={fieldClass()} type="date" value={form.withdrawalProcessDate || ''} onChange={e => set('withdrawalProcessDate', e.target.value)} />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <label className={labelClass}>ステータスメモ（管理者のみ）</label>
            <textarea
              className={`${fieldClass()} h-auto min-h-[112px] resize-y leading-relaxed`}
              value={form.statusNote || ''}
              maxLength={STATUS_NOTE_MAX_LENGTH}
              onChange={e => set('statusNote', e.target.value)}
              placeholder="退会処理、退会予定、移行済み等の管理者向けメモ"
              aria-describedby="status-note-help"
            />
            <div id="status-note-help" className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>会員マイページには表示されません。</span>
              <span>{String(form.statusNote || '').length}/{STATUS_NOTE_MAX_LENGTH}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 年会費 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">年会費</h3>
            <p className="mt-1 text-sm text-slate-500">対象年度ごとに納入状況、納入確認日、備考を確認・編集できます。</p>
          </div>
          {isAnnualFeeDirty && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              未保存の年会費変更があります
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">年度</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">会費</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">納入ステータス</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">納入確認日</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">備考</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {annualFeeDrafts.map((record) => {
                const rowDirty = !snapshotsEqual(
                  normalizeAnnualFeeSnapshot([record])[0],
                  initialAnnualFeeSnapshot.find((initial) => initial.year === record.year),
                );
                const rowError = annualFeeErrors[record.year];
                const rowBusy = annualFeeSavingYear === record.year;
                const statusTone = record.status === PaymentStatus.PAID
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200';
                return (
                  <tr key={record.year} className={rowDirty ? 'bg-amber-50/50' : 'bg-white'}>
                    <td className="px-4 py-3 align-top text-sm font-medium text-slate-800">{record.year}年度</td>
                    <td className="px-4 py-3 align-top text-sm tabular-nums text-slate-700">{formatCurrency(record.amount)}</td>
                    <td className="px-4 py-3 align-top text-sm">
                      <div className="space-y-2">
                        <select
                          className="w-full min-w-[120px] rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={record.status}
                          disabled={rowBusy}
                          aria-label={`${record.year}年度の納入ステータス`}
                          onChange={(e) => {
                            const nextStatus = e.target.value as PaymentStatus;
                            updateAnnualFeeDraft(record.year, {
                              status: nextStatus,
                              confirmedDate: nextStatus === PaymentStatus.PAID
                                ? record.confirmedDate || new Date().toISOString().slice(0, 10)
                                : '',
                            });
                          }}
                        >
                          <option value={PaymentStatus.UNPAID}>未納</option>
                          <option value={PaymentStatus.PAID}>納入済み</option>
                        </select>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone}`}>
                          {annualFeeStatusLabel(record.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm">
                      <input
                        type="date"
                        className="w-full min-w-[150px] rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={record.confirmedDate}
                        disabled={rowBusy || record.status !== PaymentStatus.PAID}
                        aria-label={`${record.year}年度の納入確認日`}
                        onChange={(e) => updateAnnualFeeDraft(record.year, { confirmedDate: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-sm">
                      <textarea
                        className="min-h-[72px] w-full min-w-[240px] rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={record.note}
                        disabled={rowBusy}
                        maxLength={2000}
                        aria-label={`${record.year}年度の年会費備考`}
                        onChange={(e) => updateAnnualFeeDraft(record.year, { note: e.target.value })}
                        placeholder="確認メモ"
                      />
                      <p className="mt-1 text-xs text-slate-400">{record.note.length}/2000</p>
                    </td>
                    <td className="px-4 py-3 align-top text-sm">
                      <button
                        type="button"
                        onClick={() => void handleAnnualFeeSave(record)}
                        disabled={rowBusy || !rowDirty}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {rowBusy ? '保存中...' : rowDirty ? '保存' : '変更なし'}
                      </button>
                      {rowError && (
                        <p className="mt-2 max-w-[220px] text-xs text-red-600" role="alert">{rowError}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 事業所職員一覧 */}
      {isBusiness && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-lg font-bold text-slate-800">職員追加</h3>
              <p className="mt-1 text-xs text-slate-500">追加内容は保存ボタンでまとめて反映します。介護支援専門員番号は必須です。</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowConvertFromIndividualModal(true); setConvertFromIndividualId(''); setConvertFromIndividualCareNum(''); setConvertFromIndividualCareNumError(''); }}
                className="px-3 py-2 rounded-lg border border-purple-300 text-purple-700 text-sm font-medium hover:bg-purple-50"
              >
                既存会員を転籍
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                className="px-3 py-2 rounded-lg border border-primary-300 text-primary-700 text-sm font-medium hover:bg-primary-50"
              >
                + 新規職員追加
              </button>
            </div>
          </div>
          {staffList.filter((staff) => staff.isNew).length > 0 && (
            <div className="mt-4 space-y-3">
              {staffList.filter((staff) => staff.isNew).map((staff) => (
                <div key={staff.id} className="rounded-lg border border-primary-200 bg-primary-50/30 p-4 space-y-3">
                  {/* 行1: 氏名・カナ・メール */}
                  <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_2fr] gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">姓<span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        value={staff.lastName || ''}
                        onChange={(e) => updateDraftStaff(staff.id, { lastName: e.target.value })}
                        className={getDraftStaffFieldClass(staff.id, 'lastName')}
                        placeholder="例: 山田"
                        aria-label="姓"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">名<span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        value={staff.firstName || ''}
                        onChange={(e) => updateDraftStaff(staff.id, { firstName: e.target.value })}
                        className={getDraftStaffFieldClass(staff.id, 'firstName')}
                        placeholder="例: 太郎"
                        aria-label="名"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">セイ<span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        value={staff.lastKana || ''}
                        onChange={(e) => updateDraftStaff(staff.id, { lastKana: e.target.value })}
                        className={getDraftStaffFieldClass(staff.id, 'lastKana')}
                        placeholder="例: ヤマダ"
                        aria-label="セイ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">メイ<span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        value={staff.firstKana || ''}
                        onChange={(e) => updateDraftStaff(staff.id, { firstKana: e.target.value })}
                        className={getDraftStaffFieldClass(staff.id, 'firstKana')}
                        placeholder="例: タロウ"
                        aria-label="メイ"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">メールアドレス<span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        type="email"
                        value={staff.email || ''}
                        onChange={(e) => updateDraftStaff(staff.id, { email: e.target.value })}
                        className={getDraftStaffFieldClass(staff.id, 'email')}
                        placeholder="例: taro@example.com"
                        aria-label="メールアドレス"
                      />
                    </div>
                  </div>
                  {/* 行2: 介護支援専門員番号・役割・取消 */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        介護支援専門員番号<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        value={staff.careManagerNumber || ''}
                        onChange={(e) => updateDraftStaff(staff.id, { careManagerNumber: normalizeCareManagerInput(e.target.value) })}
                        className={getDraftStaffFieldClass(staff.id, 'careManagerNumber')}
                        placeholder="例: 12345678 / HN12345678"
                        maxLength={10}
                        aria-label="介護支援専門員番号（必須・通常8桁数字、例外的にHN/HS等の英数字10桁可）"
                        aria-required="true"
                        aria-describedby={`draft-cm-help-${staff.id}`}
                      />
                      <p id={`draft-cm-help-${staff.id}`} className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                        ※ 通常 8 桁半角数字。例外: <code className="bg-slate-100 px-1 rounded">HN</code>+事業所番号下8桁（看護師等）/ <code className="bg-slate-100 px-1 rounded">HS</code>+事業所番号下8桁（社会福祉士）
                      </p>
                    </div>
                    <div className="min-w-[140px]">
                      <label className="block text-xs font-medium text-slate-600 mb-1">役割</label>
                      <select
                        value={staff.role}
                        onChange={(e) => updateDraftStaff(staff.id, { role: e.target.value as Staff['role'] })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      >
                        <option value="REPRESENTATIVE">代表者</option>
                        <option value="ADMIN">管理者</option>
                        <option value="STAFF">メンバー</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftStaff(staff.id)}
                      className="px-4 py-2.5 rounded-lg border-2 border-red-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50 hover:border-red-400 transition-colors"
                    >
                      追加を取消
                    </button>
                  </div>
                  {draftStaffErrors[staff.id] && (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {Object.values(draftStaffErrors[staff.id]).join(' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {staffList.length === 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              職員はまだ登録されていません。`+ 職員追加` から追加してください。
            </div>
          )}
        </div>
      )}

      {isBusiness && staffList.some((staff) => !staff.isNew) && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">事業所職員一覧</h3>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">氏名</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">カナ</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">メール</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">区分</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">状態</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {staffList.filter((staff) => !staff.isNew).map((s: EditableStaff, idx: number) => (
                <tr key={s.id || idx} className={s.status === 'LEFT' ? 'bg-slate-50 text-slate-400' : ''}>
                  <td className="px-4 py-2 text-sm">{s.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{s.kana}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{s.email}</td>
                  <td className="px-4 py-2 text-sm">
                    <select
                      value={s.role}
                      onChange={e => handleInlineStaffUpdate(s, 'role', e.target.value)}
                      disabled={!!inlineSaving[`${s.id}-role`] || s.status === 'LEFT'}
                      className="border border-slate-300 rounded px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50"
                      aria-label={`${s.name} の区分`}
                    >
                      <option value="REPRESENTATIVE">代表者</option>
                      <option value="ADMIN">管理者</option>
                      <option value="STAFF">メンバー</option>
                    </select>
                    {inlineSaving[`${s.id}-role`] && <span className="ml-1 text-xs text-primary-500">保存中...</span>}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <select
                      value={s.status}
                      onChange={e => handleInlineStaffUpdate(s, 'status', e.target.value)}
                      disabled={!!inlineSaving[`${s.id}-status`]}
                      className={`border rounded px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50 ${
                        s.status === 'LEFT' ? 'border-red-300 text-red-600' : 'border-green-300 text-green-700'
                      }`}
                      aria-label={`${s.name} の状態`}
                    >
                      <option value="ENROLLED">在籍</option>
                      <option value="LEFT">除籍</option>
                    </select>
                    {inlineSaving[`${s.id}-status`] && <span className="ml-1 text-xs text-primary-500">保存中...</span>}
                  </td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    {onOpenStaffDetail && (
                      <button
                        onClick={() => onOpenStaffDetail(String(form.id), s.id)}
                        className="px-2 py-1 rounded border border-primary-500 text-primary-600 text-xs hover:bg-primary-50"
                      >
                        詳細
                      </button>
                    )}
                    {s.status !== 'LEFT' && s.role !== 'REPRESENTATIVE' && (
                      <button
                        onClick={() => handleRemoveStaff(s.id, s.name)}
                        disabled={actionLoading === 'remove-' + s.id}
                        className="px-2 py-1 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50 disabled:opacity-50"
                      >
                        {actionLoading === 'remove-' + s.id ? '処理中...' : '除籍'}
                      </button>
                    )}
                    <button
                      onClick={() => openConvertToIndividual(s.id)}
                      className="px-2 py-1 rounded border border-purple-300 text-purple-600 text-xs hover:bg-purple-50"
                    >
                      個人会員に転換
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 保存 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : isDirty ? '保存' : '変更なし'}
        </button>
        <button onClick={onBack} className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
          キャンセル
        </button>
      </div>

      {/* ── 会員アクション ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">会員アクション</h3>
        <div className="space-y-4">
          {/* 事業所会員: 予約退会 */}
          {isBusiness && form.status === 'ACTIVE' && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleScheduleWithdraw}
                disabled={actionLoading === 'scheduleWithdraw'}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading === 'scheduleWithdraw' ? '処理中...' : '事業所会員を退会する'}
              </button>
              <span className="text-xs text-slate-500">翌年度4月1日にアカウントが無効化されます（年度末までキャンセル可能）</span>
            </div>
          )}

          {/* 事業所会員: 退会キャンセル */}
          {isBusiness && form.status === 'WITHDRAWAL_SCHEDULED' && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancelScheduledWithdraw}
                disabled={actionLoading === 'cancelWithdraw'}
                className="px-4 py-2 rounded-lg border border-green-300 text-green-700 font-medium hover:bg-green-50 disabled:opacity-50"
              >
                {actionLoading === 'cancelWithdraw' ? '処理中...' : '退会をキャンセルする'}
              </button>
              <span className="text-xs text-slate-500">退会予定を取り消し、在籍中に戻します</span>
            </div>
          )}

          {/* 事業所会員: 退会済み表示 */}
          {isBusiness && form.status === 'WITHDRAWN' && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">
              この事業所は退会済みです（{form.withdrawnDate}）
            </div>
          )}

          {/* 個人/賛助: 即時退会 */}
          {!isBusiness && (form.status === 'ACTIVE' || form.status === 'WITHDRAWAL_SCHEDULED') && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleWithdraw}
                disabled={actionLoading === 'withdraw'}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading === 'withdraw' ? '処理中...' : '退会処理'}
              </button>
              <span className="text-xs text-slate-500">アカウントが無効化されログインできなくなります</span>
            </div>
          )}

          {/* 個人会員→事業所メンバーに転籍 */}
          {!isBusiness && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowConvertToStaffModal(true)}
                className="px-4 py-2 rounded-lg border border-purple-300 text-purple-600 font-medium hover:bg-purple-50"
              >
                事業所メンバーに転籍
              </button>
              <span className="text-xs text-slate-500">既存の事業所にメンバーとして移動します</span>
            </div>
          )}

          {/* v376.55: パスワード管理（認証アカウント一覧を read してから認証IDでリセット・会員種別からの推測はしない） */}
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-700">🔑 パスワード管理</span>
              {authAccounts === null ? (
                <button
                  onClick={handleLoadAuthAccounts}
                  disabled={authAccountsLoading}
                  className="px-3 py-2 min-h-[44px] rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  {authAccountsLoading ? '読込中...' : '認証アカウントを表示'}
                </button>
              ) : (
                <button
                  onClick={handleLoadAuthAccounts}
                  disabled={authAccountsLoading}
                  className="text-xs text-primary-600 hover:underline disabled:opacity-50"
                >
                  {authAccountsLoading ? '更新中...' : '再読込'}
                </button>
              )}
            </div>
            {authAccounts !== null && authAccounts.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">この会員に紐づく認証アカウントはありません。</p>
            )}
            {authAccounts !== null && authAccounts.length > 0 && (
              <div className="mt-2 space-y-2">
                {authAccounts.map((acc) => (
                  <div key={acc.authId} className="flex items-center justify-between gap-3 flex-wrap border-t border-slate-100 pt-2">
                    <div className="text-sm text-slate-700 break-all">
                      <span className="font-medium">{acc.loginId || '(ログインID未設定)'}</span>
                      <span className="ml-2 text-xs text-slate-500">{acc.personName}{acc.unit === 'STAFF' ? '（職員）' : '（会員本人）'}</span>
                      <span className="ml-2 text-xs text-slate-400">{acc.method}</span>
                      {acc.locked && <span className="ml-2 text-xs text-red-600">ロック中</span>}
                      {!acc.active && <span className="ml-2 text-xs text-amber-600">無効</span>}
                    </div>
                    <button
                      onClick={() => handleResetPassword(acc.authId, acc.loginId)}
                      disabled={actionLoading === 'reset-' + acc.authId || acc.method !== 'PASSWORD'}
                      className="px-3 py-2 min-h-[44px] rounded-lg border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
                      title={acc.method !== 'PASSWORD' ? 'パスワード認証以外はリセットできません' : ''}
                    >
                      {actionLoading === 'reset-' + acc.authId ? '処理中...' : 'パスワードリセット'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* v376.55: リセット結果モーダル（新パスワードは一度だけ表示） */}
          {resetResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4">
                <h3 className="text-lg font-bold text-slate-800">パスワードをリセットしました</h3>
                <p className="text-sm text-slate-600">この新しいパスワードは<strong>この画面でしか確認できません</strong>。会員へ安全な方法でお伝えください。</p>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-1 break-all">
                  <div><span className="text-slate-500">ログインID:</span> <span className="font-mono font-medium">{resetResult.loginId}</span></div>
                  <div><span className="text-slate-500">新しいパスワード:</span> <span className="font-mono font-medium">{resetResult.newPassword}</span></div>
                </div>
                <div className="flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => { if (navigator.clipboard) void navigator.clipboard.writeText(resetResult.newPassword); }}
                    className="px-3 py-2 min-h-[44px] rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    パスワードをコピー
                  </button>
                  <button
                    onClick={() => setResetResult(null)}
                    className="px-4 py-2 min-h-[44px] rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 転籍モーダル: 個人→事業所（個人会員ページから） ── */}
      {showConvertToStaffModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-800">事業所メンバーに転籍</h3>
            <p className="text-sm text-slate-600">
              {form.lastName} {form.firstName} を事業所のメンバーとして登録します。個人会員としてのステータスは退会になります。
            </p>
            {/* 賛助会員で介護支援専門員番号がない場合は入力必須 */}
            {isSupport && !String(form.careManagerNumber || '').trim() && (
              <div>
                <label className={labelClass}>
                  介護支援専門員番号
                  <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                  <span className="ml-2 text-xs text-amber-600">賛助会員のため転籍前に入力が必要です</span>
                </label>
                <input
                  value={convertCareManagerNumber}
                  onChange={e => { setConvertCareManagerNumber(normalizeCareManagerInput(e.target.value)); setConvertCareManagerNumberError(''); }}
                  className={`w-full border rounded px-3 py-2 text-sm ${convertCareManagerNumberError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  placeholder="8桁の半角数字"
                  maxLength={8}
                  inputMode="numeric"
                  aria-required="true"
                  aria-invalid={!!convertCareManagerNumberError}
                />
                {convertCareManagerNumberError && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{convertCareManagerNumberError}</p>
                )}
              </div>
            )}
            <div>
              <label className={labelClass}>転籍先の事業所</label>
              <select className={fieldClass()} value={convertTargetOfficeId} onChange={e => setConvertTargetOfficeId(e.target.value)}>
                <option value="">-- 選択してください --</option>
                {(businessMembers || [])
                  .filter(b => b.memberType === MemberType.BUSINESS && b.status !== 'WITHDRAWN' && b.status !== 'TRANSFERRED')
                  .map(b => (
                    <option key={b.memberId} value={b.memberId}>{b.displayName} ({b.memberId})</option>
                  ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>権限</label>
              <select className={fieldClass()} value={convertStaffRole} onChange={e => setConvertStaffRole(e.target.value as 'ADMIN' | 'STAFF')}>
                <option value="STAFF">メンバー</option>
                <option value="ADMIN">管理者</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConvertToStaff}
                disabled={actionLoading === 'convertToStaff'}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading === 'convertToStaff' ? '処理中...' : '転籍実行'}
              </button>
              <button onClick={() => { setShowConvertToStaffModal(false); setConvertCareManagerNumber(''); setConvertCareManagerNumberError(''); }} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 既存個人会員を転籍モーダル（事業所会員ページから） ── */}
      {showConvertFromIndividualModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-800">既存個人会員を職員として転籍</h3>
            <p className="text-sm text-slate-600">
              登録済みの個人会員または賛助会員を、この事業所の職員として転籍します。転籍元は退会扱いになります。
            </p>
            <div>
              <label className={labelClass}>
                転籍する会員
                <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                placeholder="名前・会員番号で検索..."
                value={convertFromIndividualSearch}
                onChange={e => setConvertFromIndividualSearch(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-2"
              />
              <select
                className={fieldClass()}
                value={convertFromIndividualId}
                onChange={e => { setConvertFromIndividualId(e.target.value); setConvertFromIndividualCareNum(''); setConvertFromIndividualCareNumError(''); }}
                size={6}
              >
                <option value="">-- 選択してください --</option>
                {(individualMembers || [])
                  .filter(m => m.status !== 'WITHDRAWN' && m.status !== 'TRANSFERRED')
                  .filter(m => {
                    return matchesSearchQuery(convertFromIndividualSearch, [m.displayName, m.memberId]);
                  })
                  .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'))
                  .map(m => (
                    <option key={m.memberId} value={m.memberId}>
                      {m.displayName}（{m.memberType === MemberType.SUPPORT ? '賛助' : '個人'}・{m.memberId}）
                    </option>
                  ))}
              </select>
            </div>
            {/* 賛助会員選択時は介護支援専門員番号入力必須 */}
            {convertFromIndividualId && individualMembers?.find(m => m.memberId === convertFromIndividualId)?.memberType === MemberType.SUPPORT && (
              <div>
                <label className={labelClass}>
                  介護支援専門員番号
                  <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                  <span className="ml-2 text-xs text-amber-600">賛助会員のため転籍前に入力が必要です</span>
                </label>
                <input
                  value={convertFromIndividualCareNum}
                  onChange={e => { setConvertFromIndividualCareNum(normalizeCareManagerInput(e.target.value)); setConvertFromIndividualCareNumError(''); }}
                  className={`w-full border rounded px-3 py-2 text-sm ${convertFromIndividualCareNumError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  placeholder="8桁の半角数字"
                  maxLength={8}
                  inputMode="numeric"
                  aria-required="true"
                  aria-invalid={!!convertFromIndividualCareNumError}
                />
                {convertFromIndividualCareNumError && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{convertFromIndividualCareNumError}</p>
                )}
              </div>
            )}
            <div>
              <label className={labelClass}>権限</label>
              <select className={fieldClass()} value={convertFromIndividualRole} onChange={e => setConvertFromIndividualRole(e.target.value as 'ADMIN' | 'STAFF')}>
                <option value="STAFF">メンバー</option>
                <option value="ADMIN">管理者</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConvertFromIndividualToThisOffice}
                disabled={actionLoading === 'convertFromIndividual'}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading === 'convertFromIndividual' ? '処理中...' : '転籍実行'}
              </button>
              <button
                onClick={() => { setShowConvertFromIndividualModal(false); setConvertFromIndividualId(''); setConvertFromIndividualCareNum(''); setConvertFromIndividualCareNumError(''); setConvertFromIndividualSearch(''); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 転換モーダル: 事業所職員→個人（v127: 最後の1名は自動退会）── */}
      {showConvertToIndividualModal && convertSourceStaff && (() => {
        const otherEnrolledInModal = enrolledStaff.filter(s => s.id !== convertSourceStaffId);
        const isLastEnrolledInModal = isConvertSourceRep && otherEnrolledInModal.length === 0;
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-bold text-slate-800">個人会員に転換</h3>
              {isLastEnrolledInModal ? (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium">
                    {convertSourceStaff.name} は事業所の最後の在籍職員です。
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    個人会員に転換すると、事業所は自動的に退会扱いになります。
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  {convertSourceStaff.name} を個人会員として独立させます。事業所からは除籍され、新しい会員IDが発行されます。
                </p>
              )}
              {isConvertSourceRep && !isLastEnrolledInModal && (
                <div>
                  <label className={labelClass}>後任の代表者（必須）</label>
                  <select className={fieldClass()} value={convertNewRepStaffId} onChange={e => setConvertNewRepStaffId(e.target.value)}>
                    <option value="">-- 選択してください --</option>
                    {otherEnrolledInModal.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({roleLabel(s.role)})</option>
                    ))}
                  </select>
                  <p className="text-xs text-amber-600 mt-1">代表者を転換するため、後任の代表者を指定する必要があります。</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConvertToIndividual}
                  disabled={actionLoading === 'convertToIndividual'}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading === 'convertToIndividual' ? '処理中...' : '個人会員に転換'}
                </button>
                <button onClick={() => setShowConvertToIndividualModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MemberDetailAdmin;
