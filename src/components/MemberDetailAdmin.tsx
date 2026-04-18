import React, { useEffect, useMemo, useState } from 'react';
import { Member, MemberType, Staff, AdminDashboardMemberRow, ConvertMemberTypePayload } from '../types';
import { api } from '../services/api';
import PostalCodeInput from './PostalCodeInput';

type EditableStaff = Staff & { isNew?: boolean };
type EditableMemberForm = Record<string, any> & { staff?: EditableStaff[] };

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
] as const;

const HALF_WIDTH_KANA_RE = /^[ｦ-ﾟ\s]+$/u;
const CARE_MANAGER_RE = /^\d{8}$/;
const POST_CODE_RE = /^\d{3}-?\d{4}$/;
const PHONE_RE = /^[0-9-]+$/;

// 全角カナ・ひらがな → 半角カナ変換（保存時に適用）
const toHalfWidthKana = (value: string): string => {
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
const normalizeCareManagerInput = (value: string) => value.replace(/\D/g, '').slice(0, 8);
const validateHalfWidthKana = (value: string) => !value.trim() || HALF_WIDTH_KANA_RE.test(value.trim());
const validateCareManagerNumber = (value: string) => !value.trim() || CARE_MANAGER_RE.test(value.trim());
const validatePostCode = (value: string) => !value.trim() || POST_CODE_RE.test(value.trim());
const validatePhone = (value: string) => !value.trim() || PHONE_RE.test(value.trim());

const normalizeEditableStaff = (staff: Partial<EditableStaff> | undefined) => ({
  id: String(staff?.id || ''),
  name: String(staff?.name || '').trim(),
  kana: String(staff?.kana || '').trim(),
  email: String(staff?.email || '').trim(),
  role: String(staff?.role || 'STAFF'),
  status: String(staff?.status || 'ENROLLED'),
  joinedDate: String(staff?.joinedDate || ''),
  withdrawnDate: String(staff?.withdrawnDate || ''),
  careManagerNumber: String(staff?.careManagerNumber || '').trim(),
  mailingPreference: String(staff?.mailingPreference || 'YES'),
  lastName: String(staff?.lastName || '').trim(),
  firstName: String(staff?.firstName || '').trim(),
  lastKana: String(staff?.lastKana || '').trim(),
  firstKana: String(staff?.firstKana || '').trim(),
});

const sanitizeStaffList = (staffList: EditableStaff[] = []): Staff[] =>
  staffList.map(({ isNew, ...staff }) => ({
    ...staff,
    id: String(staff.id || ''),
    name: String(staff.name || '').trim(),
    kana: String(staff.kana || '').trim(),
    email: String(staff.email || '').trim(),
    careManagerNumber: String(staff.careManagerNumber || '').trim(),
    lastName: String(staff.lastName || '').trim(),
    firstName: String(staff.firstName || '').trim(),
    lastKana: String(staff.lastKana || '').trim(),
    firstKana: String(staff.firstKana || '').trim(),
  }));

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // v126: blur バリデーション用 touched 状態
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // member props が変更されたら form を再同期（インライン編集後のリロード対応）
  useEffect(() => {
    const nextForm = { ...(member as EditableMemberForm) };
    setForm(nextForm);
    setInitialSnapshot(normalizeEditableMember(nextForm));
    setTouched({});
    setValidationErrors({});
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
    if (key === 'careManagerNumber') {
      if (!isSupport && !value.trim()) return '介護支援専門員番号は必須です。';
      if (value.trim() && !validateCareManagerNumber(value)) {
        return '介護支援専門員番号は8桁の半角数字で入力してください。';
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
    // 保存前にセイ・メイを半角カナに変換（全角カナ・ひらがな → 半角カナ）
    const convertedStaff = form.staff
      ? (form.staff as any[]).map(s => ({
          ...s,
          lastKana: s.lastKana ? toHalfWidthKana(String(s.lastKana)) : s.lastKana,
          firstKana: s.firstKana ? toHalfWidthKana(String(s.firstKana)) : s.firstKana,
        }))
      : form.staff;
    const convertedForm: EditableMemberForm = {
      ...form,
      lastKana: form.lastKana ? toHalfWidthKana(String(form.lastKana)) : form.lastKana,
      firstKana: form.firstKana ? toHalfWidthKana(String(form.firstKana)) : form.firstKana,
      staff: convertedStaff as any,
    };
    setForm(convertedForm);
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
        if (!String(s.careManagerNumber || '').trim()) {
          setError(`職員 ${i + 1} 番目の介護支援専門員番号が未入力です。`);
          return;
        }
        if (!/^\d{8}$/.test(String(s.careManagerNumber || '').trim())) {
          setError(`職員 ${i + 1} 番目の介護支援専門員番号は8桁の半角数字で入力してください。`);
          return;
        }
      }
    }
    // 事業所会員は郵送先区分を固定OFFICE
    const sanitizedStaff = sanitizeStaffList((convertedForm.staff as EditableStaff[]) || []);
    const nextForm = { ...convertedForm, staff: sanitizedStaff } as Member;
    const payload: EditableMemberForm = { ...nextForm };
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
      setSuccessMsg('会員情報を更新しました。');
      onSaved(nextForm);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました。');
    } finally {
      setSaving(false);
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
      if (!/^\d{8}$/.test(cm)) { setConvertCareManagerNumberError('8桁の半角数字で入力してください。'); return; }
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
      if (!/^\d{8}$/.test(cm)) { setConvertFromIndividualCareNumError('8桁の半角数字で入力してください。'); return; }
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
    setForm(prev => ({
      ...prev,
      staff: (((prev.staff as EditableStaff[]) || []).map(staff =>
        staff.id === staffId ? { ...staff, ...patch } : staff
      )),
    }));
  };

  const handleAddStaff = () => {
    setForm(prev => ({
      ...prev,
      staff: [...(((prev.staff as EditableStaff[]) || [])), createEmptyStaffDraft()],
    }));
    setSuccessMsg(null);
    setError(null);
  };

  const handleRemoveDraftStaff = (staffId: string) => {
    setForm(prev => ({
      ...prev,
      staff: (((prev.staff as EditableStaff[]) || []).filter(staff => staff.id !== staffId)),
    }));
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
                  inputMode="numeric"
                  maxLength={8}
                  aria-required={!isSupport || undefined}
                  aria-invalid={touched['careManagerNumber'] && !!validationErrors['careManagerNumber'] || undefined}
                  aria-describedby={validationErrors['careManagerNumber'] ? 'err-careManagerNumber' : undefined}
                />
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
                <div key={staff.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1.4fr_1fr_1fr_1fr_auto] gap-3 rounded-lg border border-slate-200 p-4">
                  <input
                    value={staff.name || ''}
                    onChange={(e) => updateDraftStaff(staff.id, { name: e.target.value })}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                    placeholder="氏名"
                    aria-label="氏名"
                    required
                  />
                  <input
                    value={staff.kana || ''}
                    onChange={(e) => updateDraftStaff(staff.id, { kana: e.target.value })}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                    placeholder="カナ"
                    aria-label="カナ"
                  />
                  <input
                    type="email"
                    value={staff.email || ''}
                    onChange={(e) => updateDraftStaff(staff.id, { email: e.target.value })}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                    placeholder="メール"
                    aria-label="メールアドレス"
                    required
                  />
                  <input
                    value={staff.careManagerNumber || ''}
                    onChange={(e) => updateDraftStaff(staff.id, { careManagerNumber: normalizeCareManagerInput(e.target.value) })}
                    className={`border rounded px-3 py-2 text-sm ${!String(staff.careManagerNumber || '').trim() ? 'border-orange-300 bg-orange-50' : 'border-slate-300'}`}
                    placeholder="介護支援専門員番号*"
                    maxLength={8}
                    inputMode="numeric"
                    aria-label="介護支援専門員番号（必須）"
                    aria-required="true"
                  />
                  <select
                    value={staff.role}
                    onChange={(e) => updateDraftStaff(staff.id, { role: e.target.value as Staff['role'] })}
                    className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="REPRESENTATIVE">代表者</option>
                    <option value="ADMIN">管理者</option>
                    <option value="STAFF">メンバー</option>
                  </select>
                  <select
                    value={staff.status}
                    onChange={(e) => updateDraftStaff(staff.id, { status: e.target.value as Staff['status'] })}
                    className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="ENROLLED">在籍</option>
                    <option value="LEFT">除籍</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveDraftStaff(staff.id)}
                    className="px-3 py-2 rounded border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                  >
                    取消
                  </button>
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
                  .filter(b => b.memberType === MemberType.BUSINESS && b.status !== 'WITHDRAWN')
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
              <select
                className={fieldClass()}
                value={convertFromIndividualId}
                onChange={e => { setConvertFromIndividualId(e.target.value); setConvertFromIndividualCareNum(''); setConvertFromIndividualCareNumError(''); }}
              >
                <option value="">-- 選択してください --</option>
                {(individualMembers || [])
                  .filter(m => m.status !== 'WITHDRAWN')
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
                onClick={() => { setShowConvertFromIndividualModal(false); setConvertFromIndividualId(''); setConvertFromIndividualCareNum(''); setConvertFromIndividualCareNumError(''); }}
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
