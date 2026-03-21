import React, { useState, useCallback } from 'react';
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

interface MemberApplicationFormProps {
  onBack: () => void;
  onComplete: () => void;
  title?: string;
  backLabel?: string;
  completeLabel?: string;
}

const STEPS_INDIVIDUAL = ['会員種別', '基本情報', '住所情報', '連絡設定', '入力確認'];
const STEPS_BUSINESS = ['会員種別', '事業所情報', '職員登録', '入力確認'];
const STEPS_SUPPORT = ['会員種別', '基本情報', '住所情報', '連絡設定', '入力確認'];

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
    officePostCode: INDIVIDUAL_ADDRESS_DEFAULTS.postCode,
    officePrefecture: INDIVIDUAL_ADDRESS_DEFAULTS.prefecture,
    officeCity: INDIVIDUAL_ADDRESS_DEFAULTS.city,
    homePostCode: INDIVIDUAL_ADDRESS_DEFAULTS.postCode,
    homePrefecture: INDIVIDUAL_ADDRESS_DEFAULTS.prefecture,
    homeCity: INDIVIDUAL_ADDRESS_DEFAULTS.city,
  };
}

function hasMeaningfulIndividualOfficeInput(form: ApplicationFormData): boolean {
  return !!(
    form.officeName.trim() ||
    form.officeAddressLine.trim() ||
    form.phone.trim() ||
    form.fax.trim() ||
    (form.officePostCode.trim() && form.officePostCode.trim() !== INDIVIDUAL_ADDRESS_DEFAULTS.postCode) ||
    (form.officePrefecture.trim() && form.officePrefecture.trim() !== INDIVIDUAL_ADDRESS_DEFAULTS.prefecture) ||
    (form.officeCity.trim() && form.officeCity.trim() !== INDIVIDUAL_ADDRESS_DEFAULTS.city)
  );
}

function hasMeaningfulIndividualHomeInput(form: ApplicationFormData): boolean {
  return !!(
    form.homeAddressLine.trim() ||
    form.mobilePhone.trim() ||
    (form.homePostCode.trim() && form.homePostCode.trim() !== INDIVIDUAL_ADDRESS_DEFAULTS.postCode) ||
    (form.homePrefecture.trim() && form.homePrefecture.trim() !== INDIVIDUAL_ADDRESS_DEFAULTS.prefecture) ||
    (form.homeCity.trim() && form.homeCity.trim() !== INDIVIDUAL_ADDRESS_DEFAULTS.city)
  );
}

function hasOfficeAddressInput(form: ApplicationFormData): boolean {
  if (form.memberType === 'INDIVIDUAL') return hasMeaningfulIndividualOfficeInput(form);
  return !!(
    form.officeName.trim() ||
    form.officePostCode.trim() ||
    form.officePrefecture.trim() ||
    form.officeCity.trim() ||
    form.officeAddressLine.trim() ||
    form.phone.trim() ||
    form.fax.trim()
  );
}

function hasHomeAddressInput(form: ApplicationFormData): boolean {
  if (form.memberType === 'INDIVIDUAL') return hasMeaningfulIndividualHomeInput(form);
  return !!(
    form.homePostCode.trim() ||
    form.homePrefecture.trim() ||
    form.homeCity.trim() ||
    form.homeAddressLine.trim() ||
    form.mobilePhone.trim()
  );
}

function stripUnusedIndividualAddressDefaults(form: ApplicationFormData): ApplicationFormData {
  if (form.memberType !== 'INDIVIDUAL') return form;
  const next = { ...form };
  if (!hasMeaningfulIndividualOfficeInput(form)) {
    next.officePostCode = '';
    next.officePrefecture = '';
    next.officeCity = '';
  }
  if (!hasMeaningfulIndividualHomeInput(form)) {
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
    if (step === 2) return validateAddress(form, errs);
    if (step === 3) return validateContact(form, errs);
    if (step === 4) return validateConfirmation(form, errs);
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

function validateAddress(form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  const hasOffice = hasOfficeAddressInput(form);
  const hasHome = hasHomeAddressInput(form);

  if (!hasOffice && !hasHome) {
    errs._address = '勤務先または自宅のどちらか一方は必須です。';
  }
  if (hasOffice) {
    if (!form.officeName.trim()) errs.officeName = '事業所名は必須です。';
    if (!form.officePostCode.trim()) errs.officePostCode = '郵便番号は必須です。';
    if (!form.officePrefecture.trim()) errs.officePrefecture = '都道府県は必須です。';
    if (!form.officeCity.trim()) errs.officeCity = '市区町村は必須です。';
    if (!form.officeAddressLine.trim()) errs.officeAddressLine = '住所は必須です。';
    if (!form.phone.trim()) errs.phone = '電話番号は必須です。';
    validatePostCodeValue(form.officePostCode, 'officePostCode', errs);
    validatePhoneValue(form.phone, 'phone', '電話番号', errs);
    validatePhoneValue(form.fax, 'fax', 'FAX番号', errs);
  }
  if (hasHome) {
    if (!form.homePostCode.trim()) errs.homePostCode = '郵便番号は必須です。';
    if (!form.homePrefecture.trim()) errs.homePrefecture = '都道府県は必須です。';
    if (!form.homeCity.trim()) errs.homeCity = '市区町村は必須です。';
    if (!form.homeAddressLine.trim()) errs.homeAddressLine = '住所は必須です。';
    validatePostCodeValue(form.homePostCode, 'homePostCode', errs);
    validatePhoneValue(form.mobilePhone, 'mobilePhone', '携帯電話番号', errs);
  }
  return errs;
}

function validateContact(form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  if (!form.email.trim()) errs.email = 'メールアドレスは必須です。';
  else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'メールアドレスの形式が正しくありません。';
  if (form.preferredMailDestination === 'HOME') {
    const hasHome = !!(form.homePostCode.trim() || form.homeCity.trim());
    if (!hasHome) errs.preferredMailDestination = '郵送先を自宅にする場合は住所情報の入力が必要です。';
  }
  if (form.preferredMailDestination === 'OFFICE') {
    const hasOffice = !!(form.officeName.trim() || form.officeCity.trim());
    if (!hasOffice) errs.preferredMailDestination = '郵送先を勤務先にする場合は勤務先情報の入力が必要です。';
  }
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
}) => {
  const [form, setForm] = useState<ApplicationFormData>({ ...INITIAL_FORM_DATA });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);

  const stepLabels = getStepLabels(form.memberType);
  const totalSteps = stepLabels.length;

  const set = useCallback(<K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const updateStaff = useCallback((index: number, field: keyof ApplicationStaffEntry, value: any) => {
    setForm(prev => {
      const newStaff = [...prev.staff];
      newStaff[index] = { ...newStaff[index], [field]: value };
      // 代表者は1名のみ — 他の代表者を解除
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
    // 事業所の場合、Step1(種別)→Step1(事業所情報)に進むとき職員が空なら1名追加
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
      const submitPayload = stripUnusedIndividualAddressDefaults(form);
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
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">入会申込が完了しました</h2>
          <p className="text-slate-600">会員番号: <span className="font-mono font-bold text-lg">{result.memberId}</span></p>
          {form.memberType !== 'BUSINESS' && result.loginId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800 font-medium mb-2">ログイン情報</p>
              <p className="text-sm">ログインID: <span className="font-mono font-bold">{result.loginId}</span></p>
              <p className="text-sm text-blue-600 mt-1">初期パスワードは登録メールアドレスに送信しました。</p>
            </div>
          )}
          {form.memberType === 'BUSINESS' && result.staffCredentials && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800 font-medium mb-2">職員ログイン情報</p>
              {result.staffCredentials.map((sc, i) => (
                <p key={i} className="text-sm">{sc.name}: <span className="font-mono">{sc.loginId}</span> → {sc.email}</p>
              ))}
              <p className="text-sm text-blue-600 mt-2">各職員のメールアドレスにログイン情報を送信しました。</p>
            </div>
          )}
          <div className="flex gap-3 justify-center pt-4">
            <button onClick={() => { onComplete(); }} className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
              {completeLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fieldClass = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
  const errorClass = 'text-xs text-red-600 mt-1';
  const requiredBadge = <span className="text-red-500 ml-0.5">*</span>;

  // ─── ステップ描画 ──────────────────────────────────────
  const renderStep = () => {
    // Step 0: 会員種別選択
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2">会員種別を選択してください</h3>
            <p className="text-sm text-slate-500">ご自身に該当する種別をお選びください。</p>
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
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                  form.memberType === item.type ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-bold text-slate-800 mb-1">{item.label}</h4>
                <p className="text-xs text-slate-500">{item.desc}</p>
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

    // ── 個人 / 賛助: Step 2 = 住所情報 ──────────────────────
    if (form.memberType !== 'BUSINESS' && step === 2) {
      const hasOffice = hasOfficeAddressInput(form);
      const hasHome = hasHomeAddressInput(form);
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">住所情報</h3>
          <p className="text-sm text-slate-500">勤務先と自宅のうち、少なくともどちらか一方を入力してください。</p>
          {errors._address && <p className={errorClass}>{errors._address}</p>}

          {/* 勤務先 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-700 mb-3">勤務先情報 {!hasHome && <span className="text-xs text-red-500">（自宅未入力の場合は必須）</span>}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>事業所名</label>
                <input className={fieldClass} value={form.officeName} onChange={e => set('officeName', e.target.value)} />
                {errors.officeName && <p className={errorClass}>{errors.officeName}</p>}
              </div>
              <div>
                <label className={labelClass}>郵便番号</label>
                <input className={fieldClass} value={form.officePostCode} onChange={e => set('officePostCode', e.target.value)} placeholder="例: 573-0000" />
                {errors.officePostCode && <p className={errorClass}>{errors.officePostCode}</p>}
              </div>
              <div>
                <label className={labelClass}>都道府県</label>
                <select className={fieldClass} value={form.officePrefecture} onChange={e => set('officePrefecture', e.target.value)}>
                  <option value="">選択してください</option>
                  {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.officePrefecture && <p className={errorClass}>{errors.officePrefecture}</p>}
              </div>
              <div>
                <label className={labelClass}>市区町村</label>
                <input className={fieldClass} value={form.officeCity} onChange={e => set('officeCity', e.target.value)} />
                {errors.officeCity && <p className={errorClass}>{errors.officeCity}</p>}
              </div>
              <div>
                <label className={labelClass}>住所</label>
                <input className={fieldClass} value={form.officeAddressLine} onChange={e => set('officeAddressLine', e.target.value)} />
                {errors.officeAddressLine && <p className={errorClass}>{errors.officeAddressLine}</p>}
              </div>
              <div>
                <label className={labelClass}>電話番号</label>
                <input className={fieldClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="例: 072-000-0000" />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelClass}>FAX番号（任意）</label>
                <input className={fieldClass} value={form.fax} onChange={e => set('fax', e.target.value)} />
              </div>
            </div>
          </div>

          {/* 自宅 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-700 mb-3">自宅情報 {!hasOffice && <span className="text-xs text-red-500">（勤務先未入力の場合は必須）</span>}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>郵便番号</label>
                <input className={fieldClass} value={form.homePostCode} onChange={e => set('homePostCode', e.target.value)} placeholder="例: 573-0000" />
                {errors.homePostCode && <p className={errorClass}>{errors.homePostCode}</p>}
              </div>
              <div>
                <label className={labelClass}>都道府県</label>
                <select className={fieldClass} value={form.homePrefecture} onChange={e => set('homePrefecture', e.target.value)}>
                  <option value="">選択してください</option>
                  {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.homePrefecture && <p className={errorClass}>{errors.homePrefecture}</p>}
              </div>
              <div>
                <label className={labelClass}>市区町村</label>
                <input className={fieldClass} value={form.homeCity} onChange={e => set('homeCity', e.target.value)} />
                {errors.homeCity && <p className={errorClass}>{errors.homeCity}</p>}
              </div>
              <div>
                <label className={labelClass}>住所</label>
                <input className={fieldClass} value={form.homeAddressLine} onChange={e => set('homeAddressLine', e.target.value)} />
                {errors.homeAddressLine && <p className={errorClass}>{errors.homeAddressLine}</p>}
              </div>
              <div>
                <label className={labelClass}>携帯電話番号</label>
                <input className={fieldClass} value={form.mobilePhone} onChange={e => set('mobilePhone', e.target.value)} placeholder="例: 090-0000-0000" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── 個人 / 賛助: Step 3 = 連絡設定 ──────────────────────
    if (form.memberType !== 'BUSINESS' && step === 3) {
      const hasOffice = hasOfficeAddressInput(form);
      const hasHome = hasHomeAddressInput(form);
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">連絡設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>メールアドレス{requiredBadge}</label>
              <input className={fieldClass} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="例: taro@example.com" />
              <p className="text-xs text-slate-400 mt-1">このメールアドレスにログイン情報を送信します。</p>
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>
            <div>
              <label className={labelClass}>発送方法{requiredBadge}</label>
              <select className={fieldClass} value={form.mailingPreference} onChange={e => set('mailingPreference', e.target.value as 'EMAIL' | 'POST')}>
                <option value="EMAIL">メール配信</option>
                <option value="POST">郵送希望</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>郵送先{requiredBadge}</label>
              <select className={fieldClass} value={form.preferredMailDestination} onChange={e => set('preferredMailDestination', e.target.value as 'HOME' | 'OFFICE')}>
                {hasOffice && <option value="OFFICE">勤務先</option>}
                {hasHome && <option value="HOME">自宅</option>}
                {!hasOffice && !hasHome && <>
                  <option value="OFFICE">勤務先</option>
                  <option value="HOME">自宅</option>
                </>}
              </select>
              {errors.preferredMailDestination && <p className={errorClass}>{errors.preferredMailDestination}</p>}
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
              <input className={fieldClass} inputMode="numeric" value={form.officePostCode} onChange={e => set('officePostCode', e.target.value)} placeholder="例: 573-0000" maxLength={8} />
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
            <button onClick={addStaff} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" disabled={form.staff.length >= 10}>
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
                  {s.role === 'ADMIN' && <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded">管理者</span>}
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

          {(form.officeName.trim() || form.memberType === 'BUSINESS') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">{form.memberType === 'BUSINESS' ? '事業所情報' : '勤務先情報'}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">事業所名:</span> {form.officeName}</div>
                {form.officeNumber && <div><span className="text-slate-500">事業所番号:</span> {form.officeNumber}</div>}
                <div><span className="text-slate-500">住所:</span> 〒{form.officePostCode} {form.officePrefecture}{form.officeCity}{form.officeAddressLine}</div>
                <div><span className="text-slate-500">電話:</span> {form.phone}</div>
                {form.fax && <div><span className="text-slate-500">FAX:</span> {form.fax}</div>}
              </div>
            </div>
          )}

          {form.memberType !== 'BUSINESS' && hasHomeAddressInput(form) && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">自宅情報</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">住所:</span> 〒{form.homePostCode} {form.homePrefecture}{form.homeCity}{form.homeAddressLine}</div>
                {form.mobilePhone && <div><span className="text-slate-500">携帯:</span> {form.mobilePhone}</div>}
              </div>
            </div>
          )}

          {form.memberType !== 'BUSINESS' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">連絡設定</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">メール:</span> {form.email}</div>
                <div><span className="text-slate-500">発送方法:</span> {form.mailingPreference === 'EMAIL' ? 'メール配信' : '郵送希望'}</div>
                <div><span className="text-slate-500">郵送先:</span> {form.preferredMailDestination === 'HOME' ? '自宅' : '勤務先'}</div>
              </div>
            </div>
          )}

          {form.memberType === 'BUSINESS' && form.staff.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">登録職員（{form.staff.length}名）</h4>
              <table className="w-full text-sm">
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
        <button onClick={handleBack} className="text-sm text-blue-600 hover:underline">&larr; {step === 0 ? backLabel : '前のステップ'}</button>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>

      {/* プログレスバー */}
      {form.memberType && (
        <div className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 ${i <= step ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < step ? 'bg-blue-600 text-white border-blue-600' :
                  i === step ? 'border-blue-600 text-blue-600' :
                  'border-slate-300 text-slate-400'
                }`}>{i + 1}</div>
                <span className="text-xs font-medium hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
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
            <button onClick={handleNext} className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
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
