import React, { useState, useCallback, useEffect } from 'react';
import {
  ApplicationFormData,
  ApplicationStaffEntry,
  ApplicationResult,
  ValidationErrors,
  INITIAL_FORM_DATA,
  EMPTY_STAFF_ENTRY,
} from './types';
import type { ApplicationMemberType } from './types';
import { api } from '../../services/api';
import PostalCodeInput from '../PostalCodeInput';

interface MemberApplicationFormProps {
  onBack: () => void;
  onComplete: () => void;
  title?: string;
  backLabel?: string;
  completeLabel?: string;
  showCompletionLoginInfo?: boolean;
  credentialEmailEnabled?: boolean;
  completionNoCredentialNotice?: string;
}

const STEPS_INDIVIDUAL = ['会員種別', '基本情報', '住所・連絡情報', '入力確認'];
const STEPS_BUSINESS = ['会員種別', '事業所情報', '職員登録', '入力確認'];
const STEPS_SUPPORT = ['会員種別', '基本情報', '住所・連絡情報', '入力確認'];

function getStepLabels(type: ApplicationMemberType | ''): string[] {
  if (type === 'BUSINESS') return STEPS_BUSINESS;
  if (type === 'SUPPORT') return STEPS_SUPPORT;
  return STEPS_INDIVIDUAL;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARE_MANAGER_RE = /^\d{8}$/;
const KATAKANA_RE = /^[ァ-ヶー－・\s　]+$/u;
const DIGITS_RE = /^\d+$/;
const POST_CODE_RE = /^\d{3}-\d{4}$/;
const PHONE_RE = /^[0-9-]+$/;
const BUSINESS_OFFICE_DEFAULTS = {
  officePostCode: '573-',
  officePrefecture: '大阪府',
  officeCity: '枚方市',
};
const INDIVIDUAL_ADDRESS_DEFAULTS = {
  postCode: '573-',
  prefecture: '大阪府',
  city: '枚方市',
};
const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];
const MEMBERSHIP_GUIDE_URL = 'https://sites.google.com/view/starhirakata/%E5%85%A5%E4%BC%9A%E9%80%80%E4%BC%9A?authuser=0';
const INCORPORATION_URL = 'https://sites.google.com/view/starhirakata/incorporation';
const MEMBERSHIP_NOTICE_HIGHLIGHTS = [
  {
    title: '会費の返還について',
    body: '納入後の会費は、いかなる理由があっても返還できません。',
  },
  {
    title: '個人情報の利用目的',
    body: '登録情報は、台帳管理、定例会・研修会等の周知、受付確認、広報発送など、協議会運営に必要な範囲でのみ利用します。',
  },
  {
    title: '変更・退会の手続き',
    body: '登録情報の変更や退会は、協議会ホームページからお手続きください。',
    actionLabel: '入会・退会案内を開く',
    actionHref: MEMBERSHIP_GUIDE_URL,
  },
  {
    title: '退会の締切',
    body: '退会は年度切替前の3月末までに完了してください。手続きがない場合は継続扱いとなり、当該年度の会費納入が必要です。',
  },
] as const;

// ─── バリデーション ───────────────────────────────────
function createDefaultBusinessStaff(): ApplicationStaffEntry[] {
  return [
    { ...EMPTY_STAFF_ENTRY(), role: 'REPRESENTATIVE' },
    EMPTY_STAFF_ENTRY(),
    EMPTY_STAFF_ENTRY(),
  ];
}

function createBusinessFormData(): ApplicationFormData {
  return {
    ...INITIAL_FORM_DATA,
    memberType: 'BUSINESS',
    ...BUSINESS_OFFICE_DEFAULTS,
    staff: createDefaultBusinessStaff(),
  };
}

function createIndividualFormData(): ApplicationFormData {
  return {
    ...INITIAL_FORM_DATA,
    memberType: 'INDIVIDUAL',
    officePrefecture: INDIVIDUAL_ADDRESS_DEFAULTS.prefecture,
    officeCity: INDIVIDUAL_ADDRESS_DEFAULTS.city,
    homePrefecture: INDIVIDUAL_ADDRESS_DEFAULTS.prefecture,
    homeCity: INDIVIDUAL_ADDRESS_DEFAULTS.city,
  };
}

function stripUnusedAddressDefaults(form: ApplicationFormData): ApplicationFormData {
  if (form.memberType === 'BUSINESS') return form;
  const next = { ...form };
  const def = INDIVIDUAL_ADDRESS_DEFAULTS;
  // 勤務先: 住所行が空でデフォルト値のみなら除去
  if (
    !form.officeAddressLine.trim() &&
    (!form.officePostCode.trim() || form.officePostCode.trim() === def.postCode) &&
    (!form.officePrefecture.trim() || form.officePrefecture.trim() === def.prefecture) &&
    (!form.officeCity.trim() || form.officeCity.trim() === def.city)
  ) {
    next.officePostCode = '';
    next.officePrefecture = '';
    next.officeCity = '';
  }
  // 自宅: 住所行が空でデフォルト値のみなら除去
  if (
    !form.homeAddressLine.trim() &&
    (!form.homePostCode.trim() || form.homePostCode.trim() === def.postCode) &&
    (!form.homePrefecture.trim() || form.homePrefecture.trim() === def.prefecture) &&
    (!form.homeCity.trim() || form.homeCity.trim() === def.city)
  ) {
    next.homePostCode = '';
    next.homePrefecture = '';
    next.homeCity = '';
  }
  return next;
}

function validateKanaValue(value: string, key: string, label: string, errs: ValidationErrors) {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!KATAKANA_RE.test(trimmed)) errs[key] = `${label}はカタカナで入力してください。`;
}

function validateDigitsValue(value: string, key: string, label: string, errs: ValidationErrors) {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!DIGITS_RE.test(trimmed)) errs[key] = `${label}は数字で入力してください。`;
}

function validatePostCodeValue(value: string, key: string, errs: ValidationErrors) {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!POST_CODE_RE.test(trimmed)) errs[key] = '郵便番号は 123-4567 形式で入力してください。';
}

function validatePhoneValue(value: string, key: string, label: string, errs: ValidationErrors) {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!PHONE_RE.test(trimmed)) errs[key] = `${label}は数字とハイフンで入力してください。`;
}

function validateStep(step: number, form: ApplicationFormData): ValidationErrors {
  const errs: ValidationErrors = {};
  const t = form.memberType;

  if (step === 0) {
    if (!t) errs.memberType = '会員種別を選択してください。';
    return errs;
  }

  if (t === 'BUSINESS') {
    if (step === 1) return validateBusinessOffice(form, errs);
    if (step === 2) return validateBusinessStaff(form, errs);
    if (step === 3) return validateConfirmation(form, errs);
  } else {
    if (step === 1) return validatePersonalInfo(form, errs);
    if (step === 2) return validateAddressAndContact(form, errs);
    if (step === 3) return validateConfirmation(form, errs);
  }
  return errs;
}

function validatePersonalInfo(form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  if (!form.lastName.trim()) errs.lastName = '姓は必須です。';
  if (!form.firstName.trim()) errs.firstName = '名は必須です。';
  if (!form.lastKana.trim()) errs.lastKana = 'セイは必須です。';
  if (!form.firstKana.trim()) errs.firstKana = 'メイは必須です。';
  validateKanaValue(form.lastKana, 'lastKana', 'セイ', errs);
  validateKanaValue(form.firstKana, 'firstKana', 'メイ', errs);
  if (form.memberType === 'INDIVIDUAL') {
    if (!form.careManagerNumber.trim()) errs.careManagerNumber = '介護支援専門員番号は必須です。';
    else if (!CARE_MANAGER_RE.test(form.careManagerNumber.trim())) errs.careManagerNumber = '8桁の数字で入力してください。';
  }
  return errs;
}

function validateAddressAndContact(form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  const dest = form.preferredMailDestination;

  // 選択した郵送先の住所を必須チェック
  if (dest === 'OFFICE') {
    if (!form.officeName.trim()) errs.officeName = '勤務先を郵送先にする場合は事業所名を入力してください。';
    if (!form.officePostCode.trim()) errs.officePostCode = '郵便番号は必須です。';
    if (!form.officePrefecture.trim()) errs.officePrefecture = '都道府県は必須です。';
    if (!form.officeCity.trim()) errs.officeCity = '市区町村は必須です。';
    if (!form.officeAddressLine.trim()) errs.officeAddressLine = '住所は必須です。';
    validatePostCodeValue(form.officePostCode, 'officePostCode', errs);
    // 自宅は任意: 入力があれば形式チェック
    if (form.homePostCode.trim()) validatePostCodeValue(form.homePostCode, 'homePostCode', errs);
  } else {
    if (!form.homePostCode.trim()) errs.homePostCode = '郵便番号は必須です。';
    if (!form.homePrefecture.trim()) errs.homePrefecture = '都道府県は必須です。';
    if (!form.homeCity.trim()) errs.homeCity = '市区町村は必須です。';
    if (!form.homeAddressLine.trim()) errs.homeAddressLine = '住所は必須です。';
    validatePostCodeValue(form.homePostCode, 'homePostCode', errs);
    // 勤務先は任意: 入力があれば形式チェック
    if (form.officePostCode.trim()) validatePostCodeValue(form.officePostCode, 'officePostCode', errs);
  }

  // 電話番号または携帯電話番号のどちらか必須
  const hasPhone = !!form.phone.trim();
  const hasMobile = !!form.mobilePhone.trim();
  if (!hasPhone && !hasMobile) {
    errs._phone = '電話番号または携帯電話番号のどちらか一方を入力してください。';
  }
  if (hasPhone) validatePhoneValue(form.phone, 'phone', '電話番号', errs);
  if (hasMobile) validatePhoneValue(form.mobilePhone, 'mobilePhone', '携帯電話番号', errs);
  if (form.fax.trim()) validatePhoneValue(form.fax, 'fax', 'FAX番号', errs);

  // メールアドレス必須
  if (!form.email.trim()) errs.email = 'メールアドレスは必須です。';
  else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'メールアドレスの形式が正しくありません。';

  return errs;
}

function validateBusinessOffice(form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  if (!form.officeName.trim()) errs.officeName = '事業所名は必須です。';
  if (!form.officeNumber.trim()) errs.officeNumber = '事業所番号は必須です。';
  if (!form.officePostCode.trim()) errs.officePostCode = '郵便番号は必須です。';
  if (!form.officePrefecture.trim()) errs.officePrefecture = '都道府県は必須です。';
  if (!form.officeCity.trim()) errs.officeCity = '市区町村は必須です。';
  if (!form.officeAddressLine.trim()) errs.officeAddressLine = '住所は必須です。';
  if (!form.phone.trim()) errs.phone = '電話番号は必須です。';
  validateDigitsValue(form.officeNumber, 'officeNumber', '事業所番号', errs);
  validatePostCodeValue(form.officePostCode, 'officePostCode', errs);
  validatePhoneValue(form.phone, 'phone', '電話番号', errs);
  validatePhoneValue(form.fax, 'fax', 'FAX番号', errs);
  return errs;
}

function validateBusinessStaff(form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  if (form.staff.length === 0) {
    errs._staff = '最低1名の職員登録が必要です。';
    return errs;
  }
  const repCount = form.staff.filter(s => s.role === 'REPRESENTATIVE').length;
  if (repCount === 0) errs._staffRep = '代表者は必ず1名登録してください。';
  if (repCount > 1) errs._staffRep = '代表者は1名のみ指定できます。';

  const cmNums = new Set<string>();
  const emails = new Set<string>();
  form.staff.forEach((s, i) => {
    const prefix = `staff_${i}_`;
    if (!s.lastName.trim()) errs[prefix + 'lastName'] = '姓は必須です。';
    if (!s.firstName.trim()) errs[prefix + 'firstName'] = '名は必須です。';
    if (!s.lastKana.trim()) errs[prefix + 'lastKana'] = 'セイは必須です。';
    if (!s.firstKana.trim()) errs[prefix + 'firstKana'] = 'メイは必須です。';
    validateKanaValue(s.lastKana, prefix + 'lastKana', 'セイ', errs);
    validateKanaValue(s.firstKana, prefix + 'firstKana', 'メイ', errs);
    if (!s.careManagerNumber.trim()) errs[prefix + 'careManagerNumber'] = '介護支援専門員番号は必須です。';
    else if (!CARE_MANAGER_RE.test(s.careManagerNumber.trim())) errs[prefix + 'careManagerNumber'] = '8桁の数字で入力してください。';
    else if (cmNums.has(s.careManagerNumber.trim())) errs[prefix + 'careManagerNumber'] = '他の職員と重複しています。';
    else cmNums.add(s.careManagerNumber.trim());
    if (!s.email.trim()) errs[prefix + 'email'] = 'メールアドレスは必須です。';
    else if (!EMAIL_RE.test(s.email.trim())) errs[prefix + 'email'] = 'メールアドレスの形式が正しくありません。';
    else if (emails.has(s.email.trim().toLowerCase())) errs[prefix + 'email'] = '他の職員と重複しています。';
    else emails.add(s.email.trim().toLowerCase());
  });
  return errs;
}

function validateConfirmation(_form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  return errs;
}

// ─── メインコンポーネント ────────────────────────────────
const MemberApplicationForm: React.FC<MemberApplicationFormProps> = ({
  onBack,
  onComplete,
  title = '入会申込',
  backLabel = '戻る',
  completeLabel = '閉じる',
  showCompletionLoginInfo = true,
  credentialEmailEnabled = true,
  completionNoCredentialNotice = 'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
}) => {
  const [form, setForm] = useState<ApplicationFormData>({ ...INITIAL_FORM_DATA });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);

  const stepLabels = getStepLabels(form.memberType);
  const totalSteps = stepLabels.length;

  useEffect(() => {
    if (!noticeDialogOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNoticeDialogOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [noticeDialogOpen]);

  const set = useCallback(<K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key as string];
      // 電話番号複合エラーをクリア
      if (key === 'phone' || key === 'mobilePhone') delete next._phone;
      if (key === 'preferredMailDestination') {
        delete next.officeName;
        delete next.officePostCode;
        delete next.officePrefecture;
        delete next.officeCity;
        delete next.officeAddressLine;
        delete next.homePostCode;
        delete next.homePrefecture;
        delete next.homeCity;
        delete next.homeAddressLine;
      }
      return next;
    });
  }, []);

  const updateStaff = useCallback((index: number, field: keyof ApplicationStaffEntry, value: any) => {
    setForm(prev => {
      const newStaff = [...prev.staff];
      newStaff[index] = { ...newStaff[index], [field]: value };
      if (field === 'role' && value === 'REPRESENTATIVE') {
        for (let i = 0; i < newStaff.length; i++) {
          if (i !== index && newStaff[i].role === 'REPRESENTATIVE') {
            newStaff[i] = { ...newStaff[i], role: 'ADMIN' };
          }
        }
      }
      return { ...prev, staff: newStaff };
    });
    setErrors(prev => {
      const next = { ...prev };
      delete next[`staff_${index}_${field}`];
      delete next._staff;
      delete next._staffRep;
      return next;
    });
  }, []);

  const addStaff = useCallback(() => {
    setForm(prev => ({ ...prev, staff: [...prev.staff, EMPTY_STAFF_ENTRY()] }));
  }, []);

  const removeStaff = useCallback((index: number) => {
    setForm(prev => ({ ...prev, staff: prev.staff.filter((_, i) => i !== index) }));
  }, []);

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    if (form.memberType === 'BUSINESS' && step === 1 && form.staff.length === 0) {
      setForm(prev => ({ ...prev, staff: createDefaultBusinessStaff() }));
    }
    setStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setErrors({});
    if (step === 0) { onBack(); return; }
    setStep(prev => prev - 1);
  };

  const handleSelectType = (t: ApplicationMemberType) => {
    if (!noticeAccepted) {
      setErrors(prev => ({ ...prev, memberType: '事務局からのお願いをご確認のうえ、チェックを入れてください。' }));
      return;
    }
    setForm(
      t === 'BUSINESS'
        ? createBusinessFormData()
        : t === 'INDIVIDUAL'
          ? createIndividualFormData()
        : {
            ...INITIAL_FORM_DATA,
            memberType: t,
            staff: [],
          },
    );
    setErrors({});
    setStep(1);
  };

  const handleSubmit = async () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const submitPayload = stripUnusedAddressDefaults(form);
      const res = await api.submitMemberApplication(submitPayload as any);
      setResult(res);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '申込処理に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 完了画面 ────────────────────────────────────────
  if (result) {
    const isBusinessCompletion = form.memberType === 'BUSINESS';
    const showLoginInfoCard = showCompletionLoginInfo && (
      (!isBusinessCompletion && !!result.loginId) ||
      (isBusinessCompletion && !!result.staffCredentials?.length)
    );
    const loginInfoNotice = credentialEmailEnabled
      ? (isBusinessCompletion
        ? '各職員のメールアドレスにログイン情報を送信しました。'
        : 'ログイン情報は登録メールアドレスに送信しました。')
      : completionNoCredentialNotice;
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">入会申込が完了しました</h2>
          <p className="text-slate-600">会員番号: <span className="font-mono font-bold text-lg">{result.memberId}</span></p>
          {!!result.transitionSummary?.length && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-amber-900 mb-2">登録時の切り替え結果</p>
              <div className="space-y-1 text-sm text-amber-800">
                {result.transitionSummary.map((message, index) => (
                  <p key={`${message}-${index}`}>{message}</p>
                ))}
              </div>
            </div>
          )}
          <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 text-left">
            <p className="text-sm text-sky-900 font-medium mb-2">今後のご案内</p>
            <div className="space-y-1 text-sm text-sky-800">
              <p>{loginInfoNotice}</p>
              <p>年会費や振込先などのご案内は、登録メールアドレスをご確認ください。</p>
              <p>申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。</p>
            </div>
          </div>
          {!isBusinessCompletion && showLoginInfoCard && result.loginId && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-left">
              <p className="text-sm text-primary-900 font-medium mb-2">ログイン情報</p>
              <p className="text-sm">ログインID: <span className="font-mono font-bold">{result.loginId}</span></p>
              <p className="text-sm text-primary-600 mt-1">
                {credentialEmailEnabled ? '初期パスワードは登録メールアドレスに送信しました。' : '初期パスワードは現在送信していません。公開準備後にご案内します。'}
              </p>
            </div>
          )}
          {!showLoginInfoCard && ((isBusinessCompletion && !!result.staffCredentials?.length) || (!isBusinessCompletion && !!result.loginId)) && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-left">
              <p className="text-sm text-primary-900 font-medium mb-2">ログイン情報</p>
              <p className="text-sm text-primary-700">
                {credentialEmailEnabled
                  ? 'ログイン情報は画面に表示していません。登録済みのメールをご確認ください。'
                  : completionNoCredentialNotice}
              </p>
            </div>
          )}
          {isBusinessCompletion && showLoginInfoCard && result.staffCredentials && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-left">
              <p className="text-sm text-primary-900 font-medium mb-2">職員ログイン情報</p>
              {result.staffCredentials.map((sc, i) => (
                <p key={i} className="text-sm">{sc.name}: <span className="font-mono">{sc.loginId}</span> → {sc.email}</p>
              ))}
              <p className="text-sm text-primary-600 mt-2">
                {credentialEmailEnabled ? '各職員のメールアドレスにログイン情報を送信しました。' : 'ログイン情報メールは現在送信していません。公開準備後にご案内します。'}
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-center pt-4">
            <button onClick={() => { onComplete(); }} className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
              {completeLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fieldClass = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-white';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
  const errorClass = 'text-xs text-red-600 mt-1';
  const requiredBadge = <span className="text-red-500 ml-0.5">*</span>;
  const optionalBadge = <span className="ml-1.5 text-xs font-normal text-slate-400">（任意）</span>;

  // ─── ステップ描画 ──────────────────────────────────────
  const renderStep = () => {
    // Step 0: 会員種別選択
    if (step === 0) {
      return (
        <div className="space-y-6">
          <section className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_68%)] px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">事務局からのお願い（ご入会にあたって）</h3>
                <p className="mt-1 text-sm text-slate-600">
                  入会手続きの前に、重要事項をご確認ください。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNoticeDialogOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-50"
              >
                重要事項を確認する
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className={`inline-flex items-center rounded-full px-3 py-1 font-medium ${
                noticeAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {noticeAccepted ? '確認済み' : '未確認'}
              </span>
              <p className="text-slate-600">
                会員種別の選択前に、ダイアログ内の内容をご確認ください。
              </p>
            </div>
          </section>

          {noticeDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="membership-notice-title"
                className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                  <div>
                    <h4 id="membership-notice-title" className="text-xl font-bold text-slate-900">
                      事務局からのお願い（ご入会にあたって）
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      重要事項をご確認のうえ、内容を理解された場合のみ入会申込へお進みください。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNoticeDialogOpen(false)}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                  >
                    閉じる
                  </button>
                </div>

                <div className="max-h-[calc(90vh-168px)] overflow-y-auto px-6 py-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {MEMBERSHIP_NOTICE_HIGHLIGHTS.map(item => (
                      <div key={item.title} className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
                        {'actionHref' in item && item.actionHref && (
                          <a
                            href={item.actionHref}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-100"
                          >
                            {item.actionLabel}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">協議会の定款</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          入会前に、協議会の基本規程も確認できます。
                        </p>
                      </div>
                      <a
                        href={INCORPORATION_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                      >
                        定款を確認する
                      </a>
                    </div>
                  </div>

                  <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <input
                      type="checkbox"
                      checked={noticeAccepted}
                      onChange={e => {
                        setNoticeAccepted(e.target.checked);
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.memberType;
                          return next;
                        });
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm leading-6 text-slate-700">
                      上記のお願いを確認し、会費の返還条件、個人情報の利用目的、変更・退会手続き、退会期限、定款確認導線を理解しました。
                    </span>
                  </label>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setNoticeDialogOpen(false)}
                    className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNoticeAccepted(true);
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.memberType;
                        return next;
                      });
                      setNoticeDialogOpen(false);
                    }}
                    className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    内容を確認して閉じる
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2">会員種別を選択してください</h3>
            <p className="text-sm text-slate-500">
              ご自身に該当する種別をお選びください。{!noticeAccepted && '先に上記の確認チェックをお願いします。'}
            </p>
          </div>
          {errors.memberType && <p className={errorClass + ' text-center'}>{errors.memberType}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { type: 'INDIVIDUAL' as const, label: '個人会員', desc: '介護支援専門員として個人で入会される方', icon: '👤' },
              { type: 'BUSINESS' as const, label: '事業所会員', desc: '事業所単位で入会される方（複数名登録可）', icon: '🏢' },
              { type: 'SUPPORT' as const, label: '賛助会員', desc: '当協議会の活動を支援してくださる方', icon: '🤝' },
            ]).map(item => (
              <button
                key={item.type}
                onClick={() => handleSelectType(item.type)}
                disabled={!noticeAccepted}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  !noticeAccepted
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : form.memberType === item.type
                      ? 'border-primary-500 bg-primary-50 hover:shadow-md'
                      : 'border-slate-200 hover:border-primary-500 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className={`font-bold mb-1 ${noticeAccepted ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</h4>
                <p className={`text-xs ${noticeAccepted ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // ── 個人 / 賛助: Step 1 = 基本情報 ──────────────────────
    if (form.memberType !== 'BUSINESS' && step === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">基本情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>姓{requiredBadge}</label>
              <input className={fieldClass} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="例: 山田" />
              {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
            </div>
            <div>
              <label className={labelClass}>名{requiredBadge}</label>
              <input className={fieldClass} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="例: 太郎" />
              {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
            </div>
            <div>
              <label className={labelClass}>セイ{requiredBadge}</label>
              <input className={fieldClass} value={form.lastKana} onChange={e => set('lastKana', e.target.value)} placeholder="例: ヤマダ" />
              {errors.lastKana && <p className={errorClass}>{errors.lastKana}</p>}
            </div>
            <div>
              <label className={labelClass}>メイ{requiredBadge}</label>
              <input className={fieldClass} value={form.firstKana} onChange={e => set('firstKana', e.target.value)} placeholder="例: タロウ" />
              {errors.firstKana && <p className={errorClass}>{errors.firstKana}</p>}
            </div>
            {form.memberType === 'INDIVIDUAL' && (
              <div className="md:col-span-2">
                <label className={labelClass}>介護支援専門員番号（8桁）{requiredBadge}</label>
                <input className={fieldClass} inputMode="numeric" value={form.careManagerNumber} onChange={e => set('careManagerNumber', e.target.value)} placeholder="例: 12345678" maxLength={8} />
                <p className="text-xs text-slate-400 mt-1">この番号がログインIDとなります。</p>
                {errors.careManagerNumber && <p className={errorClass}>{errors.careManagerNumber}</p>}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── 個人 / 賛助: Step 2 = 住所・連絡情報 ──────────────────────
    if (form.memberType !== 'BUSINESS' && step === 2) {
      const dest = form.preferredMailDestination;
      const isOfficeDest = dest === 'OFFICE';
      const isHomeDest = dest === 'HOME';

      return (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">住所・連絡情報</h3>
            <p className="text-sm text-slate-500 mt-1">郵送先を選択し、選択した住所を必ず入力してください。</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-700">🏢 勤務先・所属情報</h4>
              <p className="text-sm text-slate-500 mt-1">勤務先を郵送先にする場合、この事業所名を送付先名として使用します。</p>
            </div>
            <div>
              <label className={labelClass}>
                事業所名{isOfficeDest ? requiredBadge : optionalBadge}
              </label>
              <input
                className={fieldClass}
                value={form.officeName}
                onChange={e => set('officeName', e.target.value)}
                placeholder="例: ひらかた介護ステーション"
                aria-required={isOfficeDest}
                aria-invalid={!!errors.officeName}
              />
              {errors.officeName && <p className={errorClass} role="alert">{errors.officeName}</p>}
            </div>
          </div>

          {/* ── 郵送先選択 ── */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-700">郵送先{requiredBadge}</span>
              <span className="text-xs text-slate-500">広報誌・お知らせ等をお届けする住所を選択してください</span>
            </div>
            <div
              role="radiogroup"
              aria-label="郵送先の選択"
              className="grid grid-cols-2 gap-3"
            >
              {([
                { value: 'OFFICE' as const, label: '勤務先', sub: '事業所の住所に郵送', icon: '🏢' },
                { value: 'HOME' as const, label: '自宅', sub: '自宅の住所に郵送', icon: '🏠' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={dest === opt.value}
                  onClick={() => set('preferredMailDestination', opt.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    dest === opt.value
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    dest === opt.value ? 'border-primary-500 bg-primary-500' : 'border-slate-300 bg-white'
                  }`}>
                    {dest === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-800 flex items-center gap-1">
                      <span>{opt.icon}</span><span>{opt.label}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-tight">{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── 勤務先住所 ── */}
          <div className={`rounded-xl border-2 p-5 transition-colors ${
            isOfficeDest ? 'border-primary-300 bg-primary-50/20' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-semibold text-slate-700">🏢 勤務先住所</h4>
              {isOfficeDest
                ? <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 rounded-full">郵送先・必須</span>
                : <span className="px-2 py-0.5 text-xs text-slate-400 bg-slate-100 rounded-full">任意</span>
              }
            </div>
            <div className="space-y-4">
              {isOfficeDest && (
                <div className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      参照専用
                    </span>
                    <span className="text-sm font-semibold text-slate-700">送付先事業所名</span>
                  </div>
                  <div className="mt-2 rounded-lg border border-slate-300 bg-slate-200/70 px-3 py-2 text-sm text-slate-700">
                    {form.officeName.trim() || '勤務先・所属情報で入力した内容がここに表示されます。'}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    送付先事業所名は上の「勤務先・所属情報」で入力してください。
                  </p>
                </div>
              )}
              {/* 郵便番号・都道府県 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    郵便番号{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <PostalCodeInput
                    value={form.officePostCode}
                    onChange={value => set('officePostCode', value)}
                    required={isOfficeDest}
                    invalid={!!errors.officePostCode}
                    inputClassName={fieldClass}
                  />
                  {errors.officePostCode && <p className={errorClass} role="alert">{errors.officePostCode}</p>}
                </div>
                <div>
                  <label className={labelClass}>
                    都道府県{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <select
                    className={fieldClass}
                    value={form.officePrefecture}
                    onChange={e => set('officePrefecture', e.target.value)}
                    aria-required={isOfficeDest}
                    aria-invalid={!!errors.officePrefecture}
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.officePrefecture && <p className={errorClass} role="alert">{errors.officePrefecture}</p>}
                </div>
              </div>
              {/* 市区町村・住所 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    市区町村{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <input
                    className={fieldClass}
                    value={form.officeCity}
                    onChange={e => set('officeCity', e.target.value)}
                    placeholder="例: 枚方市"
                    aria-required={isOfficeDest}
                    aria-invalid={!!errors.officeCity}
                  />
                  {errors.officeCity && <p className={errorClass} role="alert">{errors.officeCity}</p>}
                </div>
                <div>
                  <label className={labelClass}>
                    住所（番地）{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <input
                    className={fieldClass}
                    value={form.officeAddressLine}
                    onChange={e => set('officeAddressLine', e.target.value)}
                    placeholder="例: 津田元町1-1-1"
                    aria-required={isOfficeDest}
                    aria-invalid={!!errors.officeAddressLine}
                  />
                  {errors.officeAddressLine && <p className={errorClass} role="alert">{errors.officeAddressLine}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ── 自宅住所 ── */}
          <div className={`rounded-xl border-2 p-5 transition-colors ${
            isHomeDest ? 'border-primary-300 bg-primary-50/20' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-semibold text-slate-700">🏠 自宅住所</h4>
              {isHomeDest
                ? <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 rounded-full">郵送先・必須</span>
                : <span className="px-2 py-0.5 text-xs text-slate-400 bg-slate-100 rounded-full">任意</span>
              }
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  郵便番号{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <PostalCodeInput
                  value={form.homePostCode}
                  onChange={value => set('homePostCode', value)}
                  required={isHomeDest}
                  invalid={!!errors.homePostCode}
                  inputClassName={fieldClass}
                />
                {errors.homePostCode && <p className={errorClass} role="alert">{errors.homePostCode}</p>}
              </div>
              <div>
                <label className={labelClass}>
                  都道府県{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <select
                  className={fieldClass}
                  value={form.homePrefecture}
                  onChange={e => set('homePrefecture', e.target.value)}
                  aria-required={isHomeDest}
                  aria-invalid={!!errors.homePrefecture}
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.homePrefecture && <p className={errorClass} role="alert">{errors.homePrefecture}</p>}
              </div>
              <div>
                <label className={labelClass}>
                  市区町村{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <input
                  className={fieldClass}
                  value={form.homeCity}
                  onChange={e => set('homeCity', e.target.value)}
                  placeholder="例: 枚方市"
                  aria-required={isHomeDest}
                  aria-invalid={!!errors.homeCity}
                />
                {errors.homeCity && <p className={errorClass} role="alert">{errors.homeCity}</p>}
              </div>
              <div>
                <label className={labelClass}>
                  住所（番地）{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <input
                  className={fieldClass}
                  value={form.homeAddressLine}
                  onChange={e => set('homeAddressLine', e.target.value)}
                  placeholder="例: 津田元町1-1-1"
                  aria-required={isHomeDest}
                  aria-invalid={!!errors.homeAddressLine}
                />
                {errors.homeAddressLine && <p className={errorClass} role="alert">{errors.homeAddressLine}</p>}
              </div>
            </div>
          </div>

          {/* ── 連絡先 ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h4 className="font-semibold text-slate-700">📞 連絡先</h4>

            {/* 電話番号グループ */}
            {errors._phone && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-xs text-red-600" role="alert">{errors._phone}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  電話番号
                  <span className="ml-1.5 text-xs font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">どちらか一方必須</span>
                </label>
                <input
                  className={fieldClass}
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="例: 072-000-0000"
                  inputMode="tel"
                  aria-invalid={!!errors.phone || !!errors._phone}
                />
                {errors.phone && <p className={errorClass} role="alert">{errors.phone}</p>}
              </div>
              <div>
                <label className={labelClass}>
                  携帯電話番号
                  <span className="ml-1.5 text-xs font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">どちらか一方必須</span>
                </label>
                <input
                  className={fieldClass}
                  value={form.mobilePhone}
                  onChange={e => set('mobilePhone', e.target.value)}
                  placeholder="例: 090-0000-0000"
                  inputMode="tel"
                  aria-invalid={!!errors.mobilePhone || !!errors._phone}
                />
                {errors.mobilePhone && <p className={errorClass} role="alert">{errors.mobilePhone}</p>}
              </div>
              <div>
                <label className={labelClass}>FAX番号{optionalBadge}</label>
                <input
                  className={fieldClass}
                  value={form.fax}
                  onChange={e => set('fax', e.target.value)}
                  inputMode="tel"
                  aria-invalid={!!errors.fax}
                />
                {errors.fax && <p className={errorClass} role="alert">{errors.fax}</p>}
              </div>
            </div>

            {/* メールアドレス — 目立つカード */}
            <div className="border-t border-slate-100 pt-4">
              <div className="rounded-xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-4">
                <label className="block text-sm font-semibold text-primary-900 mb-1.5">
                  メールアドレス{requiredBadge}
                </label>
                <input
                  className="w-full border border-primary-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-white"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="例: taro@example.com"
                  inputMode="email"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                />
                <p className="text-xs text-primary-700 mt-1.5 flex items-center gap-1">
                  <span>📨</span>
                  <span>ログイン情報・各種お知らせの送付先です</span>
                </p>
                {errors.email && <p className={errorClass} role="alert">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* ── 発送方法 ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-700 mb-3">📬 広報・通知の発送方法</h4>
            <div
              role="radiogroup"
              aria-label="発送方法の選択"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {([
                { value: 'EMAIL' as const, label: 'メール配信', sub: 'メールアドレスに送信します', icon: '📧' },
                { value: 'POST' as const, label: '郵送希望', sub: '選択した住所に郵送します', icon: '✉️' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={form.mailingPreference === opt.value}
                  onClick={() => set('mailingPreference', opt.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    form.mailingPreference === opt.value
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    form.mailingPreference === opt.value ? 'border-primary-500 bg-primary-500' : 'border-slate-300 bg-white'
                  }`}>
                    {form.mailingPreference === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-800 flex items-center gap-1">
                      <span>{opt.icon}</span><span>{opt.label}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── 事業所: Step 1 = 事業所情報 ─────────────────────────
    if (form.memberType === 'BUSINESS' && step === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">事業所情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>事業所名{requiredBadge}</label>
              <input className={fieldClass} value={form.officeName} onChange={e => set('officeName', e.target.value)} placeholder="例: ひらかた介護ステーション" />
              {errors.officeName && <p className={errorClass}>{errors.officeName}</p>}
            </div>
            <div>
              <label className={labelClass}>事業所番号{requiredBadge}</label>
              <input className={fieldClass} inputMode="numeric" value={form.officeNumber} onChange={e => set('officeNumber', e.target.value)} placeholder="例: 2770100001" />
              {errors.officeNumber && <p className={errorClass}>{errors.officeNumber}</p>}
            </div>
            <div>
              <label className={labelClass}>郵便番号{requiredBadge}</label>
              <PostalCodeInput
                value={form.officePostCode}
                onChange={value => set('officePostCode', value)}
                required
                invalid={!!errors.officePostCode}
                inputClassName={fieldClass}
              />
              {errors.officePostCode && <p className={errorClass}>{errors.officePostCode}</p>}
            </div>
            <div>
              <label className={labelClass}>都道府県{requiredBadge}</label>
              <select className={fieldClass} value={form.officePrefecture} onChange={e => set('officePrefecture', e.target.value)}>
                <option value="">選択してください</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.officePrefecture && <p className={errorClass}>{errors.officePrefecture}</p>}
            </div>
            <div>
              <label className={labelClass}>市区町村{requiredBadge}</label>
              <input className={fieldClass} value={form.officeCity} onChange={e => set('officeCity', e.target.value)} />
              {errors.officeCity && <p className={errorClass}>{errors.officeCity}</p>}
            </div>
            <div>
              <label className={labelClass}>住所{requiredBadge}</label>
              <input className={fieldClass} value={form.officeAddressLine} onChange={e => set('officeAddressLine', e.target.value)} />
              {errors.officeAddressLine && <p className={errorClass}>{errors.officeAddressLine}</p>}
            </div>
            <div>
              <label className={labelClass}>電話番号{requiredBadge}</label>
              <input className={fieldClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="例: 072-000-0000" />
              {errors.phone && <p className={errorClass}>{errors.phone}</p>}
            </div>
            <div>
              <label className={labelClass}>FAX番号（任意）</label>
              <input className={fieldClass} value={form.fax} onChange={e => set('fax', e.target.value)} />
            </div>
          </div>
        </div>
      );
    }

    // ── 事業所: Step 2 = 職員登録 ──────────────────────────
    if (form.memberType === 'BUSINESS' && step === 2) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">職員登録</h3>
              <p className="text-sm text-slate-500 mt-1">最低1名の登録が必要です。代表者は必ず1名指定してください。</p>
            </div>
            <button onClick={addStaff} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700" disabled={form.staff.length >= 10}>
              + 職員追加
            </button>
          </div>
          {errors._staff && <p className={errorClass}>{errors._staff}</p>}
          {errors._staffRep && <p className={errorClass}>{errors._staffRep}</p>}

          {form.staff.map((s, i) => (
            <div key={s.tempId} className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">職員 {i + 1}</span>
                  {s.role === 'REPRESENTATIVE' && <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded">代表者</span>}
                  {s.role === 'ADMIN' && <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 rounded">管理者</span>}
                </div>
                {form.staff.length > 1 && (
                  <button onClick={() => removeStaff(i)} className="text-xs text-red-500 hover:text-red-700">削除</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>姓{requiredBadge}</label>
                  <input className={fieldClass} value={s.lastName} onChange={e => updateStaff(i, 'lastName', e.target.value)} placeholder="例: 山田" />
                  {errors[`staff_${i}_lastName`] && <p className={errorClass}>{errors[`staff_${i}_lastName`]}</p>}
                </div>
                <div>
                  <label className={labelClass}>名{requiredBadge}</label>
                  <input className={fieldClass} value={s.firstName} onChange={e => updateStaff(i, 'firstName', e.target.value)} />
                  {errors[`staff_${i}_firstName`] && <p className={errorClass}>{errors[`staff_${i}_firstName`]}</p>}
                </div>
                <div>
                  <label className={labelClass}>区分{requiredBadge}</label>
                  <select className={fieldClass} value={s.role} onChange={e => updateStaff(i, 'role', e.target.value)}>
                    <option value="REPRESENTATIVE">代表者</option>
                    <option value="ADMIN">管理者</option>
                    <option value="STAFF">メンバー</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>セイ{requiredBadge}</label>
                  <input className={fieldClass} value={s.lastKana} onChange={e => updateStaff(i, 'lastKana', e.target.value)} placeholder="例: ヤマダ" />
                  {errors[`staff_${i}_lastKana`] && <p className={errorClass}>{errors[`staff_${i}_lastKana`]}</p>}
                </div>
                <div>
                  <label className={labelClass}>メイ{requiredBadge}</label>
                  <input className={fieldClass} value={s.firstKana} onChange={e => updateStaff(i, 'firstKana', e.target.value)} />
                  {errors[`staff_${i}_firstKana`] && <p className={errorClass}>{errors[`staff_${i}_firstKana`]}</p>}
                </div>
                <div>
                  <label className={labelClass}>介護支援専門員番号（8桁）{requiredBadge}</label>
                  <input className={fieldClass} inputMode="numeric" value={s.careManagerNumber} onChange={e => updateStaff(i, 'careManagerNumber', e.target.value)} maxLength={8} />
                  <p className="text-xs text-slate-400 mt-0.5">この番号がログインIDとなります。</p>
                  {errors[`staff_${i}_careManagerNumber`] && <p className={errorClass}>{errors[`staff_${i}_careManagerNumber`]}</p>}
                </div>
                <div>
                  <label className={labelClass}>メールアドレス{requiredBadge}</label>
                  <input className={fieldClass} type="email" value={s.email} onChange={e => updateStaff(i, 'email', e.target.value)} />
                  {errors[`staff_${i}_email`] && <p className={errorClass}>{errors[`staff_${i}_email`]}</p>}
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={s.receiveEmail} onChange={e => updateStaff(i, 'receiveEmail', e.target.checked)} className="rounded border-slate-300" />
                    <span className="text-sm text-slate-700">メール配信を受け取る</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // ── 入力確認（全種別共通: 最終ステップ）─────────────────────
    const isConfirmStep = step === totalSteps - 1;
    if (isConfirmStep) {
      const roleLabel = (r: string) => r === 'REPRESENTATIVE' ? '代表者' : r === 'ADMIN' ? '管理者' : 'メンバー';
      const typeLabel = form.memberType === 'INDIVIDUAL' ? '個人会員' : form.memberType === 'BUSINESS' ? '事業所会員' : '賛助会員';
      const destLabel = form.preferredMailDestination === 'HOME' ? '自宅' : '勤務先';
      const hasOfficeAddress = !!form.officeAddressLine.trim();
      const hasHomeAddress = !!form.homeAddressLine.trim();
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">入力内容の確認</h3>
          <p className="text-sm text-slate-500">以下の内容で入会申込を行います。内容をご確認ください。</p>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-700">会員種別</h4>
            <p className="text-sm">{typeLabel}</p>
          </div>

          {form.memberType !== 'BUSINESS' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">基本情報</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">氏名:</span> {form.lastName} {form.firstName}</div>
                <div><span className="text-slate-500">カナ:</span> {form.lastKana} {form.firstKana}</div>
                {form.memberType === 'INDIVIDUAL' && <div><span className="text-slate-500">専門員番号:</span> {form.careManagerNumber}</div>}
              </div>
            </div>
          )}

          {(hasOfficeAddress || form.officeName.trim() || form.memberType === 'BUSINESS') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">
                {form.memberType === 'BUSINESS' ? '事業所情報' : '勤務先・所属情報'}
                {form.memberType !== 'BUSINESS' && form.preferredMailDestination === 'OFFICE' && (
                  <span className="ml-2 text-xs font-normal text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">郵送先</span>
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {form.officeName.trim() && <div><span className="text-slate-500">事業所名:</span> {form.officeName}</div>}
                {form.officeNumber && <div><span className="text-slate-500">事業所番号:</span> {form.officeNumber}</div>}
                {hasOfficeAddress && <div className="sm:col-span-2"><span className="text-slate-500">{form.memberType === 'BUSINESS' ? '住所:' : '勤務先住所:'}</span> 〒{form.officePostCode} {form.officePrefecture}{form.officeCity}{form.officeAddressLine}</div>}
                {form.phone && <div><span className="text-slate-500">電話:</span> {form.phone}</div>}
                {form.fax && <div><span className="text-slate-500">FAX:</span> {form.fax}</div>}
              </div>
            </div>
          )}

          {form.memberType !== 'BUSINESS' && hasHomeAddress && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">
                自宅情報
                {form.preferredMailDestination === 'HOME' && (
                  <span className="ml-2 text-xs font-normal text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">郵送先</span>
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="sm:col-span-2"><span className="text-slate-500">住所:</span> 〒{form.homePostCode} {form.homePrefecture}{form.homeCity}{form.homeAddressLine}</div>
                {form.mobilePhone && <div><span className="text-slate-500">携帯:</span> {form.mobilePhone}</div>}
              </div>
            </div>
          )}

          {form.memberType !== 'BUSINESS' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">連絡先・発送設定</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="sm:col-span-2"><span className="text-slate-500">メール:</span> {form.email}</div>
                <div><span className="text-slate-500">発送方法:</span> {form.mailingPreference === 'EMAIL' ? 'メール配信' : '郵送希望'}</div>
                <div><span className="text-slate-500">郵送先:</span> {destLabel}</div>
              </div>
            </div>
          )}

          {form.memberType === 'BUSINESS' && form.staff.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">登録職員（{form.staff.length}名）</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead><tr className="border-b">
                    <th className="text-left py-1 text-slate-500 font-medium">氏名</th>
                    <th className="text-left py-1 text-slate-500 font-medium">区分</th>
                    <th className="text-left py-1 text-slate-500 font-medium">専門員番号</th>
                    <th className="text-left py-1 text-slate-500 font-medium">メール</th>
                  </tr></thead>
                  <tbody>
                    {form.staff.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1">{s.lastName} {s.firstName}</td>
                        <td className="py-1">{roleLabel(s.role)}</td>
                        <td className="py-1 font-mono">{s.careManagerNumber}</td>
                        <td className="py-1">{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {submitError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{submitError}</div>}
        </div>
      );
    }

    return null;
  };

  // ─── レイアウト ─────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <button onClick={handleBack} className="text-sm text-primary-600 hover:underline">&larr; {step === 0 ? backLabel : '前のステップ'}</button>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>

      {/* プログレスバー */}
      {form.memberType && (
        <div className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 ${i <= step ? 'text-primary-600' : 'text-slate-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < step ? 'bg-primary-600 text-white border-primary-600' :
                  i === step ? 'border-primary-600 text-primary-600' :
                  'border-slate-300 text-slate-400'
                }`}>{i + 1}</div>
                <span className="text-xs font-medium hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ステップ内容 */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        {renderStep()}
      </div>

      {/* ナビゲーションボタン */}
      {step > 0 && (
        <div className="flex justify-between">
          <button onClick={handleBack} className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
            前へ
          </button>
          {step < totalSteps - 1 ? (
            <button onClick={handleNext} className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
              次へ
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
              {submitting ? '送信中...' : '入会申込を送信'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberApplicationForm;
