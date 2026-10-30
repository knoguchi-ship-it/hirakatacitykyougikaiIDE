import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRevealOnChange, FIRST_ERROR_SELECTOR } from '../../shared/useRevealOnChange';
import { formatAnnualFee } from '../../shared/memberTypes.mjs';
import { useMemberTypeMaster, memberTypeMasterLabel } from '../../shared/memberTypeMaster';
import { masterLabel, useMasterOptions } from '../../shared/masterOptions';
import MasterOptionList from '../MasterOptionList';
import { EMAIL_PATTERN, CARE_MANAGER_NO_PATTERN, OFFICE_NO_PATTERN, POSTAL_CODE_PATTERN, PHONE_PATTERN } from '../../shared/validators';
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
import { normalizeKana, normalizeAndValidateKana } from '../../utils/kanaNormalize';
import { renderRegulationBody } from '../../shared/regulationText';

interface MemberApplicationFormProps {
  // v376.65: 規程・重要事項（正本は T_規程。空配列のときは従来のハードコード文面へフォールバック）
  regulations?: import('../../types').Regulation[];
  showMemberTypeFees?: boolean;
  memberTypeFeeNote?: string;
  onBack: () => void;
  onComplete: () => void;
  title?: string;
  backLabel?: string;
  completeLabel?: string;
  showCompletionGuidance?: boolean;
  completionGuidanceBodyWhenCredentialSent?: string;
  completionGuidanceBodyWhenCredentialNotSent?: string;
  showCompletionLoginInfoBlock?: boolean;
  showCompletionLoginInfo?: boolean;
  credentialEmailEnabled?: boolean;
  completionLoginInfoBodyWhenCredentialSent?: string;
  completionLoginInfoBodyWhenCredentialNotSent?: string;
}

// v376.74: 会員種別を選んだ直後に「注意事項」ステップを置く。
// 種別ごとの案内（T_規程 の 対象会員種別）は、種別が決まらないと出せないため。
const STEPS_INDIVIDUAL = ['会員種別', '注意事項', '基本情報', '住所・連絡情報', '入力確認'];
const STEPS_BUSINESS = ['会員種別', '注意事項', '事業所情報', '職員登録', '入力確認'];
const STEPS_SUPPORT = ['会員種別', '注意事項', '基本情報', '住所・連絡情報', '入力確認'];

function getStepLabels(type: ApplicationMemberType | ''): string[] {
  if (type === 'BUSINESS') return STEPS_BUSINESS;
  if (type === 'SUPPORT') return STEPS_SUPPORT;
  return STEPS_INDIVIDUAL;
}

// 2026-10-19: 種別カードの並び・名称・年会費は M_会員種別（src/shared/memberTypeMaster.ts）。
// 説明文とアイコンは、この画面が入力の流れを持っている種別の分だけ持つ（種別ごとの入力項目は仕様でありマスタに移せない）。
// マスタで無効にした種別はカードに出ない。マスタに足しても、ここに流れが無い種別は申し込めないので出さない。
// 郵送先・発送方法のカードの説明文とアイコン（見た目）。並び・名称は M_郵送先区分 / M_発送方法
const MAIL_DESTINATION_UI: Record<string, { sub: string; icon: string }> = {
  OFFICE: { sub: '事業所の住所に郵送', icon: '🏢' },
  HOME: { sub: '自宅の住所に郵送', icon: '🏠' },
};
const MAILING_METHOD_UI: Record<string, { sub: string; icon: string }> = {
  EMAIL: { sub: 'メールアドレスに送信します', icon: '📧' },
  POST: { sub: '選択した住所に郵送します', icon: '✉️' },
};
const NO_UI = { sub: '', icon: '' };

const APPLICATION_TYPE_UI: Record<ApplicationMemberType, { desc: string; icon: string }> = {
  INDIVIDUAL: { desc: '介護支援専門員として個人で入会される方', icon: '👤' },
  BUSINESS: { desc: '事業所単位で入会される方（複数名登録可）', icon: '🏢' },
  SUPPORT: { desc: '当協議会の活動を支援してくださる方', icon: '🤝' },
};
const formatFeeAmount = (amount: number): string => formatAnnualFee(amount) || '—';

// v376.67 DRY 是正: 検証パターンは src/shared/validators.ts が単一情報源。
// 以前はこの 3 画面がそれぞれ独自定義しており、郵便番号（公開はハイフン必須／管理は任意）と
// 電話（共有は 6 桁以上・+ 許容／ローカルは桁数無制限・+ 不可）で実挙動が食い違っていた。
const EMAIL_RE = EMAIL_PATTERN;
const CARE_MANAGER_RE = CARE_MANAGER_NO_PATTERN;
const OFFICE_NUMBER_RE = OFFICE_NO_PATTERN;
const POST_CODE_RE = POSTAL_CODE_PATTERN;
const PHONE_RE = PHONE_PATTERN;
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
// v376.65: 規程・重要事項の正本は GAS の T_規程。ここは **フォールバック専用**
// （初回スキーマ同期前や通信失敗で規程を取得できないときだけ表示する）。
// 文面を直したいときはソースではなく 管理画面 設定 → 規程・重要事項 で編集する。
const FALLBACK_REGULATIONS: import('../../types').Regulation[] = [
  { id: 'FB-001', kind: 'NOTICE', title: '会費の返還について', body: '納入後の会費は、いかなる理由があっても返還できません。', linkUrl: '', linkLabel: '', target: 'ALL', version: 1, effectiveDate: '', sortOrder: 1, published: true },
  { id: 'FB-002', kind: 'NOTICE', title: '個人情報の利用目的', body: '登録情報は、台帳管理、定例会・研修会等の周知、受付確認、広報発送など、協議会運営に必要な範囲でのみ利用します。', linkUrl: '', linkLabel: '', target: 'ALL', version: 1, effectiveDate: '', sortOrder: 2, published: true },
  { id: 'FB-003', kind: 'NOTICE', title: '変更・退会の手続き', body: '登録情報の変更や退会は、協議会ホームページからお手続きください。', linkUrl: MEMBERSHIP_GUIDE_URL, linkLabel: '入会・退会案内を開く', target: 'ALL', version: 1, effectiveDate: '', sortOrder: 3, published: true },
  { id: 'FB-004', kind: 'NOTICE', title: '退会の締切', body: '退会は年度切替前の3月末までに完了してください。手続きがない場合は継続扱いとなり、当該年度の会費納入が必要です。', linkUrl: '', linkLabel: '', target: 'ALL', version: 1, effectiveDate: '', sortOrder: 4, published: true },
  { id: 'FB-005', kind: 'REGULATION', title: '協議会の定款', body: '入会前に、協議会の基本規程も確認できます。', linkUrl: INCORPORATION_URL, linkLabel: '定款を確認する', target: 'ALL', version: 1, effectiveDate: '', sortOrder: 5, published: true },
];
// 2026-10-25 docs/313: 完了画面の案内文はここに持たない（T_画面文テンプレート が正本。空なら枠を出さない）。

// ─── バリデーション ───────────────────────────────────
const BUSINESS_STAFF_LIMIT = 10;

function createDefaultBusinessStaff(): ApplicationStaffEntry[] {
  return [
    { ...EMPTY_STAFF_ENTRY(), role: 'REPRESENTATIVE' },
    ...Array.from({ length: BUSINESS_STAFF_LIMIT - 1 }, () => EMPTY_STAFF_ENTRY()),
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

function isBlankBusinessStaffEntry(entry: ApplicationStaffEntry): boolean {
  return [
    entry.lastName,
    entry.firstName,
    entry.lastKana,
    entry.firstKana,
    entry.careManagerNumber,
    entry.email,
  ].every(value => !String(value || '').trim());
}

function getEffectiveBusinessStaff(staff: ApplicationStaffEntry[]): ApplicationStaffEntry[] {
  return staff.filter(entry => !isBlankBusinessStaffEntry(entry));
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
  if (form.memberType === 'BUSINESS') {
    return {
      ...form,
      staff: getEffectiveBusinessStaff(form.staff),
    };
  }
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

// v376.73: ひらがな・半角カナでの入力を許可する（operator 決定・2026-09-05）。
// 判定は「正規化してから」行う。保存形式は全角カタカナで、その変換は
// utils/kanaNormalize.ts の normalizeKana が担う（送信直前と、ステップ移動時に適用）。
// GAS 側 normalizeAndValidateKana_ と受理範囲を一致させるための変更でもある
// （従来は画面が全角カタカナのみ通し、サーバだけが寛容という食い違いがあった）。
function validateKanaValue(value: string, key: string, label: string, errs: ValidationErrors) {
  const result = normalizeAndValidateKana(value);
  if (!result.valid && result.reason === 'invalid_chars') {
    errs[key] = `${label}はカタカナ・ひらがな・半角カナで入力してください（漢字・英数字・記号は使用できません）。`;
  }
}

function validateOfficeNumberValue(value: string, key: string, errs: ValidationErrors) {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!OFFICE_NUMBER_RE.test(trimmed)) errs[key] = '事業所番号は半角英数字10文字で入力してください。';
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

  // step 1 = 注意事項。入力値ではなく画面の状態（チェックの有無）なので handleNext 側で判定する
  if (step === 1) return errs;

  if (t === 'BUSINESS') {
    if (step === 2) return validateBusinessOffice(form, errs);
    if (step === 3) return validateBusinessStaff(form, errs);
    if (step === 4) return validateConfirmation(form, errs);
  } else {
    if (step === 2) return validatePersonalInfo(form, errs);
    if (step === 3) return validateAddressAndContact(form, errs);
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
  validateOfficeNumberValue(form.officeNumber, 'officeNumber', errs);
  validatePostCodeValue(form.officePostCode, 'officePostCode', errs);
  validatePhoneValue(form.phone, 'phone', '電話番号', errs);
  validatePhoneValue(form.fax, 'fax', 'FAX番号', errs);
  return errs;
}

function validateBusinessStaff(form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  const effectiveStaff = getEffectiveBusinessStaff(form.staff);
  if (effectiveStaff.length === 0) {
    errs._staff = '最低1名の職員登録が必要です。';
    return errs;
  }
  const repCount = effectiveStaff.filter(s => s.role === 'REPRESENTATIVE').length;
  if (repCount === 0) errs._staffRep = '代表者は必ず1名登録してください。';
  if (repCount > 1) errs._staffRep = '代表者は1名のみ指定できます。';

  const cmNums = new Set<string>();
  form.staff.forEach((s, i) => {
    if (isBlankBusinessStaffEntry(s)) return;
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
  });
  return errs;
}

function validateConfirmation(_form: ApplicationFormData, errs: ValidationErrors): ValidationErrors {
  return errs;
}

// ─── メインコンポーネント ────────────────────────────────
const MemberApplicationForm: React.FC<MemberApplicationFormProps> = ({
  regulations,
  showMemberTypeFees = true,
  memberTypeFeeNote = '',
  onBack,
  onComplete,
  title = '入会申込',
  backLabel = '戻る',
  completeLabel = '閉じる',
  showCompletionGuidance = true,
  completionGuidanceBodyWhenCredentialSent = '',
  completionGuidanceBodyWhenCredentialNotSent = '',
  showCompletionLoginInfoBlock = true,
  showCompletionLoginInfo = true,
  credentialEmailEnabled = true,
  completionLoginInfoBodyWhenCredentialSent = '',
  completionLoginInfoBodyWhenCredentialNotSent = '',
}) => {
  const mailDestinationMaster = useMasterOptions('M_郵送先区分');
  const mailingMethodMaster = useMasterOptions('M_発送方法');
  const applicationTypes = useMemberTypeMaster()
    .filter((t) => Object.prototype.hasOwnProperty.call(APPLICATION_TYPE_UI, t.code))
    .map((t) => ({ ...t, type: t.code as ApplicationMemberType, ...APPLICATION_TYPE_UI[t.code as ApplicationMemberType] }));
  // 規程は T_規程 が正本。取得できないとき（初回同期前・通信失敗）だけ従来の文面を出す。
  const regulationList = (regulations && regulations.length > 0)
    ? regulations
    : FALLBACK_REGULATIONS;
  const noticeItems = regulationList.filter((r) => r.kind !== 'REGULATION');
  const regulationItems = regulationList.filter((r) => r.kind === 'REGULATION');
  const [form, setForm] = useState<ApplicationFormData>({ ...INITIAL_FORM_DATA });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  // v376.77: 種別ごとの案内は初期状態を「閉じる」にする（operator 決定・2026-09-05）。
  // v376.75 で折りたたみを入れた時点では、読まれないままチェックされる懸念から開いた状態にしていた。
  // 実物を見て、共通項目だけでも縦に長く、開いたままでは②全体が読み飛ばされやすいと判断した。
  const [memberTypeNoticeOpen, setMemberTypeNoticeOpen] = useState(false);
  // ラベル・補足文・エラー文を入力欄に結び付ける id。見えているだけで結び付いていないと
  // 支援技術には「名前の無い入力欄」になる。同じ画面に 2 つ出ても衝突しないよう useId を使う。
  const uid = React.useId();
  const fid = (key: string) => `${uid}-${key}`;
  const eid = (key: string) => `${uid}-${key}-err`;
  // aria-describedby は「補足文 → エラー文」の順。エラーが無いときは存在しない id を指さない
  const desc = (key: string, ...extra: (string | false | undefined)[]) =>
    [...extra, errors[key] ? eid(key) : ''].filter(Boolean).join(' ') || undefined;
  // 「次へ」は画面下、エラーは上（職員カード 10 枚の上など）に出るため、押しても何も起きないように見える。
  // 検証で止めたら最初の誤り項目へスクロールしてフォーカスを移す。
  const stepRef = useRef<HTMLDivElement>(null);
  const [errorRevealSeq, setErrorRevealSeq] = useState(0);
  useRevealOnChange(errorRevealSeq, stepRef, { selector: FIRST_ERROR_SELECTOR });
  // v376.74: 注意事項ステップは 2 段構成。
  //   上段 = 全種別共通（対象 ALL）… 従来の重要事項ダイアログと同じ見せ方
  //   下段 = 選んだ種別あて（対象 INDIVIDUAL / BUSINESS / SUPPORT）
  // 並び順はいずれも T_規程.表示順（管理画面から並べ替えられる）。
  const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) =>
    (a.sortOrder || 0) - (b.sortOrder || 0);
  const commonNoticeItems = noticeItems.filter((r) => r.target === 'ALL').sort(bySortOrder);
  const commonRegulationItems = regulationItems.filter((r) => r.target === 'ALL').sort(bySortOrder);
  const memberTypeNoticeItems = regulationList
    .filter((r) => r.target !== 'ALL' && r.target === form.memberType)
    .sort(bySortOrder);

  const stepLabels = getStepLabels(form.memberType);
  const totalSteps = stepLabels.length;

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
    // v376.74: 注意事項ステップはチェックが入るまで先へ進めない。
    // 旧実装は会員種別カードを disabled にして止めていたが、種別ごとの案内は
    // 種別が決まった後にしか出せないため、ゲートをこのステップへ移した。
    if (step === 1 && !noticeAccepted) {
      errs._notice = '注意事項を確認し、チェックを入れてください。';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setErrorRevealSeq(n => n + 1);
      return;
    }
    setErrors({});
    // v376.73: 入力はひらがな・半角カナも許可するが、保存形式は全角カタカナ。
    // ステップを進めた時点で入力欄の表示も変換後に揃え、確認画面と保存値が一致するようにする
    // （送信直前だけ変換すると、利用者は自分が入力した形のまま確認して別の形で保存される）。
    setForm(prev => ({
      ...prev,
      lastKana: normalizeKana(prev.lastKana),
      firstKana: normalizeKana(prev.firstKana),
      staff: Array.isArray(prev.staff)
        ? prev.staff.map(s => ({ ...s, lastKana: normalizeKana(s.lastKana), firstKana: normalizeKana(s.firstKana) }))
        : prev.staff,
    }));
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
    // v376.74: 種別選択のゲート（重要事項の事前確認）は撤去した。
    // 確認は次の「注意事項」ステップで行う（種別ごとの案内を含めて読ませるため）。
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
    if (Object.keys(errs).length > 0) { setErrors(errs); setErrorRevealSeq(n => n + 1); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const stripped = stripUnusedAddressDefaults(form);
      // v376: kana 列を全角カタカナに正規化（半角カナ/ひらがな入力も受け付け）
      const submitPayload = {
        ...stripped,
        lastKana: normalizeKana(stripped.lastKana),
        firstKana: normalizeKana(stripped.firstKana),
        staff: Array.isArray(stripped.staff)
          ? stripped.staff.map((s: ApplicationStaffEntry) => ({
              ...s,
              lastKana: normalizeKana(s.lastKana),
              firstKana: normalizeKana(s.firstKana),
            }))
          : stripped.staff,
      };
      const res = await api.submitMemberApplication(submitPayload as any);
      setResult(res);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '申込処理に失敗しました。');
      setErrorRevealSeq(n => n + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 完了画面 ────────────────────────────────────────
  if (result) {
    const isQueuedApplication = !!result.queued || (!!result.requestId && !result.memberId);
    const isBusinessCompletion = form.memberType === 'BUSINESS';
    const canResolveLoginInfo = (!isBusinessCompletion && !!result.loginId) ||
      (isBusinessCompletion && !!result.staffCredentials?.length);
    const showLoginInfoCard = !isQueuedApplication && showCompletionLoginInfo && canResolveLoginInfo;
    const showLoginInfoSection = !isQueuedApplication && showCompletionLoginInfoBlock && canResolveLoginInfo;
    const completionGuidanceBody = credentialEmailEnabled
      ? completionGuidanceBodyWhenCredentialSent
      : completionGuidanceBodyWhenCredentialNotSent;
    const completionLoginInfoBody = credentialEmailEnabled
      ? completionLoginInfoBodyWhenCredentialSent
      : completionLoginInfoBodyWhenCredentialNotSent;
    // 2026-10-25 docs/313: 以前は空なら旧い 1 行の案内で補っていた。空（定型文が見つからない）なら出さない
    const effectiveCompletionGuidanceBody = completionGuidanceBody.trim() ? completionGuidanceBody : '';
    const effectiveCompletionLoginInfoBody = completionLoginInfoBody.trim() ? completionLoginInfoBody : '';
    const renderMultilineText = (text: string, className: string) => (
      text ? <p className={className} style={{ whiteSpace: 'pre-line' }}>{text}</p> : null
    );
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isQueuedApplication ? '入会申込を受け付けました' : '入会申込が完了しました'}
          </h2>
          {isQueuedApplication ? (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 text-left">
              <p className="text-sm text-sky-900 font-medium mb-2">受付番号</p>
              <p className="text-sm text-sky-800 font-mono break-all">{result.requestId}</p>
              <p className="text-sm text-sky-800 mt-2">事務局が内容を確認し、承認後に会員登録を反映します。</p>
            </div>
          ) : (
            <p className="text-slate-600">会員番号: <span className="font-mono font-bold text-lg">{result.memberId}</span></p>
          )}
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
          {showCompletionGuidance && effectiveCompletionGuidanceBody && (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 text-left">
              <p className="text-sm text-sky-900 font-medium mb-2">今後のご案内</p>
              {renderMultilineText(effectiveCompletionGuidanceBody, 'text-sm text-sky-800')}
            </div>
          )}
          {!isBusinessCompletion && showLoginInfoSection && showLoginInfoCard && result.loginId && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-left">
              <p className="text-sm text-primary-900 font-medium mb-2">ログイン情報</p>
              <p className="text-sm">ログインID: <span className="font-mono font-bold">{result.loginId}</span></p>
              {renderMultilineText(effectiveCompletionLoginInfoBody, 'text-sm text-primary-600 mt-1')}
            </div>
          )}
          {showLoginInfoSection && !showLoginInfoCard && canResolveLoginInfo && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-left">
              <p className="text-sm text-primary-900 font-medium mb-2">ログイン情報</p>
              {renderMultilineText(effectiveCompletionLoginInfoBody, 'text-sm text-primary-700')}
            </div>
          )}
          {isBusinessCompletion && showLoginInfoSection && showLoginInfoCard && result.staffCredentials && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-left">
              <p className="text-sm text-primary-900 font-medium mb-2">職員ログイン情報</p>
              {result.staffCredentials.map((sc, i) => (
                <p key={i} className="text-sm">{sc.name}: <span className="font-mono">{sc.loginId}</span> → {sc.email}</p>
              ))}
              {renderMultilineText(effectiveCompletionLoginInfoBody, 'text-sm text-primary-600 mt-2')}
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
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2">会員種別を選択してください</h3>
            <p className="text-sm text-slate-500">
              ご自身に該当する種別をお選びください。選択すると、種別ごとのご案内が表示されます。
            </p>
          </div>
          {errors.memberType && <p data-reveal-error tabIndex={-1} role="alert" className={errorClass + ' text-center'}>{errors.memberType}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {applicationTypes.map(item => (
              <button
                key={item.type}
                onClick={() => handleSelectType(item.type)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  form.memberType === item.type
                    ? 'border-primary-500 bg-primary-50 hover:shadow-md'
                    : 'border-slate-200 hover:border-primary-500 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-bold mb-1 text-slate-800">{item.label}</h4>
                <p className="text-xs text-slate-500">{item.desc}</p>
                {showMemberTypeFees && (
                  <p className="mt-3 border-t border-slate-200 pt-2 text-sm font-semibold text-primary-700">
                    <span className="mr-1 text-xs font-medium text-slate-500">年会費</span>
                    {formatFeeAmount(item.annualFee)}
                  </p>
                )}
              </button>
            ))}
          </div>
          {showMemberTypeFees && (
            <p className="mt-4 text-center text-xs text-slate-500">
              {memberTypeFeeNote
                ? memberTypeFeeNote
                : '年会費は入会後、事務局からのご案内にしたがってお納めください。'}
            </p>
          )}
        </div>
      );
    }

    // ── Step 1 = 注意事項（v376.74 新設・全種別共通）────────────────
    // 上段は従来の「重要事項ダイアログ」の中身をそのまま移したもの（全種別共通＝対象 ALL）。
    // 下段に、選んだ種別あての案内（対象 = INDIVIDUAL / BUSINESS / SUPPORT）を足す。
    // 文面の追加・編集・削除は 管理 → 設定 → 規程・重要事項 から行う（コードに文面を持たない）。
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">事務局からのお願い（ご入会にあたって）</h3>
            <p className="mt-1 text-sm text-slate-600">
              ご入会にあたって大切な内容です。最後までお読みください。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {commonNoticeItems.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {renderRegulationBody(item.body, form.memberType, applicationTypes)}
                </p>
                {item.effectiveDate && (
                  <p className="mt-2 text-xs text-slate-400">{item.effectiveDate} 施行（第 {item.version} 版）</p>
                )}
                {item.linkUrl && (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
                  >
                    {item.linkLabel || 'くわしく見る'}
                  </a>
                )}
              </div>
            ))}
          </div>

          {commonRegulationItems.map(item => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {renderRegulationBody(item.body, form.memberType, applicationTypes)}
                  </p>
                  {item.effectiveDate && (
                    <p className="mt-2 text-xs text-slate-400">{item.effectiveDate} 施行（第 {item.version} 版）</p>
                  )}
                </div>
                {item.linkUrl && (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {item.linkLabel || '内容を確認する'}
                  </a>
                )}
              </div>
            </div>
          ))}

          {memberTypeNoticeItems.length > 0 && (
            <div className="space-y-4 border-t border-slate-200 pt-6">
              {/* v376.75: 種別ごとの案内は折りたためるようにする（②が縦に長くなるため）。
                  ただし初期状態は開いたまま。閉じて始めると読まれないままチェックされる懸念があるため。 */}
              <button
                type="button"
                onClick={() => setMemberTypeNoticeOpen(prev => !prev)}
                aria-expanded={memberTypeNoticeOpen}
                className="flex w-full min-h-[44px] items-center justify-between rounded-xl px-1 py-2 text-left hover:bg-slate-50"
              >
                <span className="text-base font-bold text-slate-900">
                  {form.memberType ? `${memberTypeMasterLabel(form.memberType)}について` : '会員種別ごとのご案内'}
                </span>
                <span className="ml-3 shrink-0 text-sm font-medium text-primary-700">
                  {memberTypeNoticeOpen ? '閉じる ▲' : '開く ▼'}
                </span>
              </button>
              {memberTypeNoticeOpen && memberTypeNoticeItems.map(item => (
                <section key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {renderRegulationBody(item.body, form.memberType, applicationTypes)}
                  </p>
                  {item.effectiveDate && (
                    <p className="mt-2 text-xs text-slate-400">{item.effectiveDate} 施行（第 {item.version} 版）</p>
                  )}
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                    >
                      {item.linkLabel || '内容を確認する'}
                    </a>
                  )}
                </section>
              ))}
            </div>
          )}

          <label className="flex items-start gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-4">
            <input
              type="checkbox"
              checked={noticeAccepted}
              aria-invalid={!!errors._notice}
              aria-describedby={desc('_notice')}
              onChange={e => {
                setNoticeAccepted(e.target.checked);
                setErrors(prev => {
                  const next = { ...prev };
                  delete next._notice;
                  return next;
                });
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm leading-6 text-slate-700">
              {/* v376.76: 旧文言は共通項目の名前を列挙していたが、v376.75 の再編で
                  「変更・退会手続き」「退会期限」が無くなり実態と合わなくなったため、
                  項目名を並べずに範囲だけを示す形にした（文面を変えても追随不要になる）。 */}
              上記の注意事項（全体および会員種別ごと）を確認し、内容を理解しました。
            </span>
          </label>
          {errors._notice && <p id={eid('_notice')} role="alert" className={errorClass}>{errors._notice}</p>}
        </div>
      );
    }

    // ── 個人 / 賛助: Step 2 = 基本情報 ──────────────────────
    if (form.memberType !== 'BUSINESS' && step === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">基本情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={fid('lastName')} className={labelClass}>姓{requiredBadge}</label>
              <input id={fid('lastName')} aria-invalid={!!errors.lastName} aria-describedby={desc('lastName')} className={fieldClass} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="例: 山田" />
              {errors.lastName && <p id={eid('lastName')} className={errorClass}>{errors.lastName}</p>}
            </div>
            <div>
              <label htmlFor={fid('firstName')} className={labelClass}>名{requiredBadge}</label>
              <input id={fid('firstName')} aria-invalid={!!errors.firstName} aria-describedby={desc('firstName')} className={fieldClass} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="例: 太郎" />
              {errors.firstName && <p id={eid('firstName')} className={errorClass}>{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor={fid('lastKana')} className={labelClass}>セイ{requiredBadge}</label>
              <input id={fid('lastKana')} aria-invalid={!!errors.lastKana} aria-describedby={desc('lastKana')} className={fieldClass} value={form.lastKana} onChange={e => set('lastKana', e.target.value)} placeholder="例: ヤマダ" />
              {errors.lastKana && <p id={eid('lastKana')} className={errorClass}>{errors.lastKana}</p>}
            </div>
            <div>
              <label htmlFor={fid('firstKana')} className={labelClass}>メイ{requiredBadge}</label>
              <input id={fid('firstKana')} aria-invalid={!!errors.firstKana} aria-describedby={desc('firstKana')} className={fieldClass} value={form.firstKana} onChange={e => set('firstKana', e.target.value)} placeholder="例: タロウ" />
              {errors.firstKana && <p id={eid('firstKana')} className={errorClass}>{errors.firstKana}</p>}
            </div>
            {form.memberType === 'INDIVIDUAL' && (
              <div className="md:col-span-2">
                <label htmlFor={fid('careManagerNumber')} className={labelClass}>介護支援専門員番号（8桁）{requiredBadge}</label>
                <input id={fid('careManagerNumber')} aria-invalid={!!errors.careManagerNumber} aria-describedby={desc('careManagerNumber', fid('careManagerNumber-hint'))} className={fieldClass} inputMode="numeric" value={form.careManagerNumber} onChange={e => set('careManagerNumber', e.target.value)} placeholder="例: 12345678" maxLength={8} />
                <p id={fid('careManagerNumber-hint')} className="text-xs text-slate-400 mt-1">この番号がログインIDとなります。</p>
                {errors.careManagerNumber && <p id={eid('careManagerNumber')} className={errorClass}>{errors.careManagerNumber}</p>}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── 個人 / 賛助: Step 3 = 住所・連絡情報 ──────────────────────
    if (form.memberType !== 'BUSINESS' && step === 3) {
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
              <label htmlFor={fid('officeName')} className={labelClass}>
                事業所名{isOfficeDest ? requiredBadge : optionalBadge}
              </label>
              <input
                id={fid('officeName')}
                className={fieldClass}
                value={form.officeName}
                onChange={e => set('officeName', e.target.value)}
                placeholder="例: ひらかた介護ステーション"
                aria-required={isOfficeDest}
                aria-invalid={!!errors.officeName}
                aria-describedby={desc('officeName')}
              />
              {errors.officeName && <p id={eid('officeName')} className={errorClass} role="alert">{errors.officeName}</p>}
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
              {mailDestinationMaster.map((o) => ({ value: o.code as ApplicationFormData['preferredMailDestination'], label: o.label, ...(MAIL_DESTINATION_UI[o.code] || NO_UI) })).map(opt => (
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
                  <label htmlFor={fid('officePostCode')} className={labelClass}>
                    郵便番号{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <PostalCodeInput
                    id={fid('officePostCode')}
                    firstInputLabel="勤務先 郵便番号 上3桁"
                    secondInputLabel="勤務先 郵便番号 下4桁"
                    value={form.officePostCode}
                    onChange={value => set('officePostCode', value)}
                    required={isOfficeDest}
                    invalid={!!errors.officePostCode}
                    describedBy={desc('officePostCode')}
                    inputClassName={fieldClass}
                  />
                  {errors.officePostCode && <p id={eid('officePostCode')} className={errorClass} role="alert">{errors.officePostCode}</p>}
                </div>
                <div>
                  <label htmlFor={fid('officePrefecture')} className={labelClass}>
                    都道府県{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <select
                    id={fid('officePrefecture')}
                    className={fieldClass}
                    value={form.officePrefecture}
                    onChange={e => set('officePrefecture', e.target.value)}
                    aria-required={isOfficeDest}
                    aria-invalid={!!errors.officePrefecture}
                    aria-describedby={desc('officePrefecture')}
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.officePrefecture && <p id={eid('officePrefecture')} className={errorClass} role="alert">{errors.officePrefecture}</p>}
                </div>
              </div>
              {/* 市区町村・住所 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={fid('officeCity')} className={labelClass}>
                    市区町村{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <input
                    id={fid('officeCity')}
                    className={fieldClass}
                    value={form.officeCity}
                    onChange={e => set('officeCity', e.target.value)}
                    placeholder="例: 枚方市"
                    aria-required={isOfficeDest}
                    aria-invalid={!!errors.officeCity}
                    aria-describedby={desc('officeCity')}
                  />
                  {errors.officeCity && <p id={eid('officeCity')} className={errorClass} role="alert">{errors.officeCity}</p>}
                </div>
                <div>
                  <label htmlFor={fid('officeAddressLine')} className={labelClass}>
                    住所（番地）{isOfficeDest ? requiredBadge : optionalBadge}
                  </label>
                  <input
                    id={fid('officeAddressLine')}
                    className={fieldClass}
                    value={form.officeAddressLine}
                    onChange={e => set('officeAddressLine', e.target.value)}
                    placeholder="例: 津田元町1-1-1"
                    aria-required={isOfficeDest}
                    aria-invalid={!!errors.officeAddressLine}
                    aria-describedby={desc('officeAddressLine')}
                  />
                  {errors.officeAddressLine && <p id={eid('officeAddressLine')} className={errorClass} role="alert">{errors.officeAddressLine}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={fid('officeAddressLine2')} className={labelClass}>建物名・部屋番号{optionalBadge}</label>
                  <input
                    id={fid('officeAddressLine2')}
                    className={fieldClass}
                    value={form.officeAddressLine2}
                    onChange={e => set('officeAddressLine2', e.target.value)}
                    placeholder="例: ○○ビル 3F"
                  />
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
                <label htmlFor={fid('homePostCode')} className={labelClass}>
                  郵便番号{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <PostalCodeInput
                  id={fid('homePostCode')}
                  firstInputLabel="自宅 郵便番号 上3桁"
                  secondInputLabel="自宅 郵便番号 下4桁"
                  value={form.homePostCode}
                  onChange={value => set('homePostCode', value)}
                  required={isHomeDest}
                  invalid={!!errors.homePostCode}
                  describedBy={desc('homePostCode')}
                  inputClassName={fieldClass}
                />
                {errors.homePostCode && <p id={eid('homePostCode')} className={errorClass} role="alert">{errors.homePostCode}</p>}
              </div>
              <div>
                <label htmlFor={fid('homePrefecture')} className={labelClass}>
                  都道府県{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <select
                  id={fid('homePrefecture')}
                  className={fieldClass}
                  value={form.homePrefecture}
                  onChange={e => set('homePrefecture', e.target.value)}
                  aria-required={isHomeDest}
                  aria-invalid={!!errors.homePrefecture}
                  aria-describedby={desc('homePrefecture')}
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.homePrefecture && <p id={eid('homePrefecture')} className={errorClass} role="alert">{errors.homePrefecture}</p>}
              </div>
              <div>
                <label htmlFor={fid('homeCity')} className={labelClass}>
                  市区町村{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <input
                  id={fid('homeCity')}
                  className={fieldClass}
                  value={form.homeCity}
                  onChange={e => set('homeCity', e.target.value)}
                  placeholder="例: 枚方市"
                  aria-required={isHomeDest}
                  aria-invalid={!!errors.homeCity}
                  aria-describedby={desc('homeCity')}
                />
                {errors.homeCity && <p id={eid('homeCity')} className={errorClass} role="alert">{errors.homeCity}</p>}
              </div>
              <div>
                <label htmlFor={fid('homeAddressLine')} className={labelClass}>
                  住所（番地）{isHomeDest ? requiredBadge : optionalBadge}
                </label>
                <input
                  id={fid('homeAddressLine')}
                  className={fieldClass}
                  value={form.homeAddressLine}
                  onChange={e => set('homeAddressLine', e.target.value)}
                  placeholder="例: 津田元町1-1-1"
                  aria-required={isHomeDest}
                  aria-invalid={!!errors.homeAddressLine}
                  aria-describedby={desc('homeAddressLine')}
                />
                {errors.homeAddressLine && <p id={eid('homeAddressLine')} className={errorClass} role="alert">{errors.homeAddressLine}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={fid('homeAddressLine2')} className={labelClass}>建物名・部屋番号{optionalBadge}</label>
                <input
                  id={fid('homeAddressLine2')}
                  className={fieldClass}
                  value={form.homeAddressLine2}
                  onChange={e => set('homeAddressLine2', e.target.value)}
                  placeholder="例: ○○マンション 101号室"
                />
              </div>
            </div>
          </div>

          {/* ── 連絡先 ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h4 className="font-semibold text-slate-700">📞 連絡先</h4>

            {/* 電話番号グループ */}
            {errors._phone && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p id={eid('_phone')} className="text-xs text-red-600" role="alert">{errors._phone}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={fid('phone')} className={labelClass}>
                  電話番号
                  <span className="ml-1.5 text-xs font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">どちらか一方必須</span>
                </label>
                <input
                  id={fid('phone')}
                  className={fieldClass}
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="例: 072-000-0000"
                  inputMode="tel"
                  aria-invalid={!!errors.phone || !!errors._phone}
                  aria-describedby={desc('phone', !!errors._phone && eid('_phone'))}
                />
                {errors.phone && <p id={eid('phone')} className={errorClass} role="alert">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor={fid('mobilePhone')} className={labelClass}>
                  携帯電話番号
                  <span className="ml-1.5 text-xs font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">どちらか一方必須</span>
                </label>
                <input
                  id={fid('mobilePhone')}
                  className={fieldClass}
                  value={form.mobilePhone}
                  onChange={e => set('mobilePhone', e.target.value)}
                  placeholder="例: 090-0000-0000"
                  inputMode="tel"
                  aria-invalid={!!errors.mobilePhone || !!errors._phone}
                  aria-describedby={desc('mobilePhone', !!errors._phone && eid('_phone'))}
                />
                {errors.mobilePhone && <p id={eid('mobilePhone')} className={errorClass} role="alert">{errors.mobilePhone}</p>}
              </div>
              <div>
                <label htmlFor={fid('fax')} className={labelClass}>FAX番号{optionalBadge}</label>
                <input
                  id={fid('fax')}
                  className={fieldClass}
                  value={form.fax}
                  onChange={e => set('fax', e.target.value)}
                  inputMode="tel"
                  aria-invalid={!!errors.fax}
                  aria-describedby={desc('fax')}
                />
                {errors.fax && <p id={eid('fax')} className={errorClass} role="alert">{errors.fax}</p>}
              </div>
            </div>

            {/* メールアドレス — 目立つカード */}
            <div className="border-t border-slate-100 pt-4">
              <div className="rounded-xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-4">
                <label htmlFor={fid('email')} className="block text-sm font-semibold text-primary-900 mb-1.5">
                  メールアドレス{requiredBadge}
                </label>
                <input
                  id={fid('email')}
                  className="w-full border border-primary-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-white"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="例: taro@example.com"
                  inputMode="email"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={desc('email', fid('email-hint'))}
                />
                <p id={fid('email-hint')} className="text-xs text-primary-700 mt-1.5 flex items-center gap-1">
                  <span aria-hidden="true">📨</span>
                  <span>ログイン情報・各種お知らせの送付先です</span>
                </p>
                {errors.email && <p id={eid('email')} className={errorClass} role="alert">{errors.email}</p>}
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
              {mailingMethodMaster.map((o) => ({ value: o.code as ApplicationFormData['mailingPreference'], label: o.label, ...(MAILING_METHOD_UI[o.code] || NO_UI) })).map(opt => (
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

    // ── 事業所: Step 2 = 事業所情報 ─────────────────────────
    if (form.memberType === 'BUSINESS' && step === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">事業所情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor={fid('officeName')} className={labelClass}>事業所名{requiredBadge}</label>
              <input id={fid('officeName')} aria-invalid={!!errors.officeName} aria-describedby={desc('officeName')} className={fieldClass} value={form.officeName} onChange={e => set('officeName', e.target.value)} placeholder="例: ひらかた介護ステーション" />
              {errors.officeName && <p id={eid('officeName')} className={errorClass}>{errors.officeName}</p>}
            </div>
            <div>
              <label htmlFor={fid('officeNumber')} className={labelClass}>事業所番号{requiredBadge}</label>
              <p id={fid('officeNumber-hint')} className="mb-1 text-xs text-slate-500">半角英数字10文字で入力してください。</p>
              <input
                id={fid('officeNumber')}
                aria-invalid={!!errors.officeNumber}
                aria-describedby={desc('officeNumber', fid('officeNumber-hint'))}
                className={fieldClass}
                inputMode="text"
                maxLength={10}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={form.officeNumber}
                onChange={e => set('officeNumber', e.target.value)}
                placeholder="例: 2770100001"
              />
              {errors.officeNumber && <p id={eid('officeNumber')} className={errorClass}>{errors.officeNumber}</p>}
            </div>
            <div>
              <label htmlFor={fid('officePostCode')} className={labelClass}>郵便番号{requiredBadge}</label>
              <PostalCodeInput
                id={fid('officePostCode')}
                value={form.officePostCode}
                onChange={value => set('officePostCode', value)}
                required
                invalid={!!errors.officePostCode}
                describedBy={desc('officePostCode')}
                inputClassName={fieldClass}
              />
              {errors.officePostCode && <p id={eid('officePostCode')} className={errorClass}>{errors.officePostCode}</p>}
            </div>
            <div>
              <label htmlFor={fid('officePrefecture')} className={labelClass}>都道府県{requiredBadge}</label>
              <select id={fid('officePrefecture')} aria-invalid={!!errors.officePrefecture} aria-describedby={desc('officePrefecture')} className={fieldClass} value={form.officePrefecture} onChange={e => set('officePrefecture', e.target.value)}>
                <option value="">選択してください</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.officePrefecture && <p id={eid('officePrefecture')} className={errorClass}>{errors.officePrefecture}</p>}
            </div>
            <div>
              <label htmlFor={fid('officeCity')} className={labelClass}>市区町村{requiredBadge}</label>
              <input id={fid('officeCity')} aria-invalid={!!errors.officeCity} aria-describedby={desc('officeCity')} className={fieldClass} value={form.officeCity} onChange={e => set('officeCity', e.target.value)} />
              {errors.officeCity && <p id={eid('officeCity')} className={errorClass}>{errors.officeCity}</p>}
            </div>
            <div>
              <label htmlFor={fid('officeAddressLine')} className={labelClass}>住所{requiredBadge}</label>
              <input id={fid('officeAddressLine')} aria-invalid={!!errors.officeAddressLine} aria-describedby={desc('officeAddressLine')} className={fieldClass} value={form.officeAddressLine} onChange={e => set('officeAddressLine', e.target.value)} placeholder="例: 津田元町1-1-1" />
              {errors.officeAddressLine && <p id={eid('officeAddressLine')} className={errorClass}>{errors.officeAddressLine}</p>}
            </div>
            <div>
              <label htmlFor={fid('officeAddressLine2')} className={labelClass}>建物名・部屋番号{optionalBadge}</label>
              <input id={fid('officeAddressLine2')} className={fieldClass} value={form.officeAddressLine2} onChange={e => set('officeAddressLine2', e.target.value)} placeholder="例: ○○ビル 3F" />
            </div>
            <div>
              <label htmlFor={fid('phone')} className={labelClass}>電話番号{requiredBadge}</label>
              <input id={fid('phone')} aria-invalid={!!errors.phone} aria-describedby={desc('phone')} className={fieldClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="例: 072-000-0000" />
              {errors.phone && <p id={eid('phone')} className={errorClass}>{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor={fid('fax')} className={labelClass}>FAX番号（任意）</label>
              {/* validateBusinessOffice は FAX の形式も検査するのに、従来はエラー文を出していなかった
                  （「次へ」を押しても何も表示されず先へ進めない）。他の欄と同じく表示する。 */}
              <input id={fid('fax')} aria-invalid={!!errors.fax} aria-describedby={desc('fax')} className={fieldClass} value={form.fax} onChange={e => set('fax', e.target.value)} />
              {errors.fax && <p id={eid('fax')} className={errorClass}>{errors.fax}</p>}
            </div>
          </div>
        </div>
      );
    }

    // ── 事業所: Step 3 = 職員登録 ──────────────────────────
    if (form.memberType === 'BUSINESS' && step === 3) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">職員登録</h3>
            <p className="text-sm text-slate-500 mt-1">最低1名の登録が必要です。代表者は必ず1名指定してください。</p>
            <p className="text-sm text-slate-500 mt-1">登録は{BUSINESS_STAFF_LIMIT}名までです。{BUSINESS_STAFF_LIMIT + 1}名以上職員登録を希望の方は、別途事務局までお問い合わせください。</p>
          </div>
          {errors._staff && <p data-reveal-error tabIndex={-1} role="alert" className={errorClass}>{errors._staff}</p>}
          {errors._staffRep && <p data-reveal-error tabIndex={-1} role="alert" className={errorClass}>{errors._staffRep}</p>}

          {form.staff.map((s, i) => (
            <div key={s.tempId} className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">職員 {i + 1}</span>
                  {s.role === 'REPRESENTATIVE' && <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded">{masterLabel('M_職員権限', s.role)}</span>}
                  {s.role === 'ADMIN' && <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 rounded">{masterLabel('M_職員権限', s.role)}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* id は errors のキー（staff_{i}_項目）と同じ形にして、エラー文との対応を取り違えないようにする */}
                <div>
                  <label htmlFor={fid(`staff_${i}_lastName`)} className={labelClass}>姓{requiredBadge}</label>
                  <input id={fid(`staff_${i}_lastName`)} aria-invalid={!!errors[`staff_${i}_lastName`]} aria-describedby={desc(`staff_${i}_lastName`)} className={fieldClass} value={s.lastName} onChange={e => updateStaff(i, 'lastName', e.target.value)} placeholder="例: 山田" />
                  {errors[`staff_${i}_lastName`] && <p id={eid(`staff_${i}_lastName`)} className={errorClass}>{errors[`staff_${i}_lastName`]}</p>}
                </div>
                <div>
                  <label htmlFor={fid(`staff_${i}_firstName`)} className={labelClass}>名{requiredBadge}</label>
                  <input id={fid(`staff_${i}_firstName`)} aria-invalid={!!errors[`staff_${i}_firstName`]} aria-describedby={desc(`staff_${i}_firstName`)} className={fieldClass} value={s.firstName} onChange={e => updateStaff(i, 'firstName', e.target.value)} />
                  {errors[`staff_${i}_firstName`] && <p id={eid(`staff_${i}_firstName`)} className={errorClass}>{errors[`staff_${i}_firstName`]}</p>}
                </div>
                <div>
                  <label htmlFor={fid(`staff_${i}_role`)} className={labelClass}>区分{requiredBadge}</label>
                  <select id={fid(`staff_${i}_role`)} className={fieldClass} value={s.role} onChange={e => updateStaff(i, 'role', e.target.value)}>
                    <MasterOptionList master="M_職員権限" current={s.role} />
                  </select>
                </div>
                <div>
                  <label htmlFor={fid(`staff_${i}_lastKana`)} className={labelClass}>セイ{requiredBadge}</label>
                  <input id={fid(`staff_${i}_lastKana`)} aria-invalid={!!errors[`staff_${i}_lastKana`]} aria-describedby={desc(`staff_${i}_lastKana`)} className={fieldClass} value={s.lastKana} onChange={e => updateStaff(i, 'lastKana', e.target.value)} placeholder="例: ヤマダ" />
                  {errors[`staff_${i}_lastKana`] && <p id={eid(`staff_${i}_lastKana`)} className={errorClass}>{errors[`staff_${i}_lastKana`]}</p>}
                </div>
                <div>
                  <label htmlFor={fid(`staff_${i}_firstKana`)} className={labelClass}>メイ{requiredBadge}</label>
                  <input id={fid(`staff_${i}_firstKana`)} aria-invalid={!!errors[`staff_${i}_firstKana`]} aria-describedby={desc(`staff_${i}_firstKana`)} className={fieldClass} value={s.firstKana} onChange={e => updateStaff(i, 'firstKana', e.target.value)} />
                  {errors[`staff_${i}_firstKana`] && <p id={eid(`staff_${i}_firstKana`)} className={errorClass}>{errors[`staff_${i}_firstKana`]}</p>}
                </div>
                <div>
                  <label htmlFor={fid(`staff_${i}_careManagerNumber`)} className={labelClass}>介護支援専門員番号（8桁）{requiredBadge}</label>
                  <input id={fid(`staff_${i}_careManagerNumber`)} aria-invalid={!!errors[`staff_${i}_careManagerNumber`]} aria-describedby={desc(`staff_${i}_careManagerNumber`, fid(`staff_${i}_careManagerNumber-hint`))} className={fieldClass} inputMode="numeric" value={s.careManagerNumber} onChange={e => updateStaff(i, 'careManagerNumber', e.target.value)} maxLength={8} />
                  <p id={fid(`staff_${i}_careManagerNumber-hint`)} className="text-xs text-slate-400 mt-0.5">この番号がログインIDとなります。</p>
                  {errors[`staff_${i}_careManagerNumber`] && <p id={eid(`staff_${i}_careManagerNumber`)} className={errorClass}>{errors[`staff_${i}_careManagerNumber`]}</p>}
                </div>
                <div>
                  <label htmlFor={fid(`staff_${i}_email`)} className={labelClass}>メールアドレス{requiredBadge}</label>
                  <input id={fid(`staff_${i}_email`)} aria-invalid={!!errors[`staff_${i}_email`]} aria-describedby={desc(`staff_${i}_email`)} className={fieldClass} type="email" value={s.email} onChange={e => updateStaff(i, 'email', e.target.value)} />
                  {errors[`staff_${i}_email`] && <p id={eid(`staff_${i}_email`)} className={errorClass}>{errors[`staff_${i}_email`]}</p>}
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    {/* 職員カード 10 枚とも同じ文言なので、読み上げでは何番目の職員かを区別する */}
                    <input type="checkbox" aria-label={`職員 ${i + 1} のメール配信を受け取る`} checked={s.receiveEmail} onChange={e => updateStaff(i, 'receiveEmail', e.target.checked)} className="rounded border-slate-300" />
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
      const roleLabel = (r: string) => masterLabel('M_職員権限', r);
      const typeLabel = memberTypeMasterLabel(form.memberType);
      const destLabel = masterLabel('M_郵送先区分', form.preferredMailDestination);
      const confirmedForm = stripUnusedAddressDefaults(form);
      const hasOfficeAddress = !!(form.officeAddressLine.trim() || form.officeAddressLine2.trim());
      const hasHomeAddress = !!(form.homeAddressLine.trim() || form.homeAddressLine2.trim());
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
                {hasOfficeAddress && <div className="sm:col-span-2"><span className="text-slate-500">{form.memberType === 'BUSINESS' ? '住所:' : '勤務先住所:'}</span> {confirmedForm.officePostCode && <>〒{confirmedForm.officePostCode} </>}{confirmedForm.officePrefecture}{confirmedForm.officeCity}{confirmedForm.officeAddressLine}{confirmedForm.officeAddressLine2 && <> {confirmedForm.officeAddressLine2}</>}</div>}
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
                <div className="sm:col-span-2"><span className="text-slate-500">住所:</span> {confirmedForm.homePostCode && <>〒{confirmedForm.homePostCode} </>}{confirmedForm.homePrefecture}{confirmedForm.homeCity}{confirmedForm.homeAddressLine}{confirmedForm.homeAddressLine2 && <> {confirmedForm.homeAddressLine2}</>}</div>
                {form.mobilePhone && <div><span className="text-slate-500">携帯:</span> {form.mobilePhone}</div>}
              </div>
            </div>
          )}

          {form.memberType !== 'BUSINESS' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">連絡先・発送設定</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="sm:col-span-2"><span className="text-slate-500">メール:</span> {form.email}</div>
                <div><span className="text-slate-500">発送方法:</span> {masterLabel('M_発送方法', form.mailingPreference)}</div>
                <div><span className="text-slate-500">郵送先:</span> {destLabel}</div>
              </div>
            </div>
          )}

          {form.memberType === 'BUSINESS' && getEffectiveBusinessStaff(form.staff).length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700">登録職員（{getEffectiveBusinessStaff(form.staff).length}名）</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead><tr className="border-b">
                    <th className="text-left py-1 text-slate-500 font-medium">氏名</th>
                    <th className="text-left py-1 text-slate-500 font-medium">区分</th>
                    <th className="text-left py-1 text-slate-500 font-medium">専門員番号</th>
                    <th className="text-left py-1 text-slate-500 font-medium">メール</th>
                  </tr></thead>
                  <tbody>
                    {getEffectiveBusinessStaff(form.staff).map((s, i) => (
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

          {submitError && <div data-reveal-error tabIndex={-1} role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 focus:outline-none">{submitError}</div>}
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
        <button onClick={handleBack} className="inline-flex min-h-[44px] items-center rounded-md px-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50 hover:underline">&larr; {step === 0 ? backLabel : '前のステップ'}</button>
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
      <div ref={stepRef} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
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
