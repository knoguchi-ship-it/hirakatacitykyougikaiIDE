import React, { useState, useEffect } from 'react';
import { Member, MemberType, Staff, AdminDashboardMemberRow, ConvertMemberTypePayload } from '../types';
import { api } from '../services/api';

interface MemberDetailAdminProps {
  member?: Member;
  /** BUSINESS 事業所のリスト（個人→事業所転籍時の選択用） */
  businessMembers?: AdminDashboardMemberRow[];
  onBack: () => void;
  onSaved: () => void;
  /** v126: 職員詳細へのDrilldown遷移 */
  onOpenStaffDetail?: (memberId: string, staffId: string) => void;
  /** 職員詳細からの保存成功トースト */
  staffSaveToast?: string | null;
  onDismissStaffSaveToast?: () => void;
}

const MemberDetailAdmin: React.FC<MemberDetailAdminProps> = ({ member, businessMembers, onBack, onSaved, onOpenStaffDetail, staffSaveToast, onDismissStaffSaveToast }) => {
  if (!member) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm text-primary-600 hover:underline">&larr; 会員一覧に戻る</button>
        <p className="mt-4 text-slate-500">会員が選択されていません。</p>
      </div>
    );
  }

  const [form, setForm] = useState<Record<string, any>>({ ...member });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // v126: blur バリデーション用 touched 状態
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // 職員保存トーストの自動消去
  useEffect(() => {
    if (staffSaveToast) {
      const timer = setTimeout(() => onDismissStaffSaveToast?.(), 4000);
      return () => clearTimeout(timer);
    }
  }, [staffSaveToast]);

  // 転籍モーダル状態
  const [showConvertToStaffModal, setShowConvertToStaffModal] = useState(false);
  const [convertTargetOfficeId, setConvertTargetOfficeId] = useState('');
  const [convertStaffRole, setConvertStaffRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  // 職員→個人転換モーダル
  const [showConvertToIndividualModal, setShowConvertToIndividualModal] = useState(false);
  const [convertSourceStaffId, setConvertSourceStaffId] = useState('');
  const [convertNewRepStaffId, setConvertNewRepStaffId] = useState('');

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const isBusiness = form.type === MemberType.BUSINESS;

  // ── v126: 事業所会員の必須フィールド定義 ──
  const businessRequiredFields: Record<string, string> = {
    officeName: '事業所名',
    officeNumber: '事業所番号',
    officePostCode: '郵便番号',
    officePrefecture: '都道府県',
    officeCity: '市区町村',
    officeAddressLine: '住所',
    phone: '電話番号',
    email: 'メールアドレス',
  };

  // v127: 個人会員の介護支援専門員番号必須（賛助会員は任意）
  const isIndividual = form.type === MemberType.INDIVIDUAL;
  const individualRequiredFields: Record<string, string> = {
    careManagerNumber: '介護支援専門員番号',
  };

  const validateField = (key: string, value: string): string => {
    if (isBusiness && businessRequiredFields[key] && !value.trim()) {
      return `${businessRequiredFields[key]}は必須です`;
    }
    if (isIndividual && individualRequiredFields[key] && !value.trim()) {
      return `${individualRequiredFields[key]}は必須です`;
    }
    if (key === 'officePostCode' && value.trim() && !/^\d{3}-?\d{4}$/.test(value.trim())) {
      return '郵便番号の形式が正しくありません（例: 573-0084）';
    }
    return '';
  };

  const handleBlur = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const err = validateField(key, String(form[key] || ''));
    setValidationErrors(prev => ({ ...prev, [key]: err }));
  };

  const validateAllRequired = (): boolean => {
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    if (isBusiness) {
      for (const key of Object.keys(businessRequiredFields)) {
        const err = validateField(key, String(form[key] || ''));
        if (err) errors[key] = err;
        allTouched[key] = true;
      }
    }
    if (isIndividual) {
      for (const key of Object.keys(individualRequiredFields)) {
        const err = validateField(key, String(form[key] || ''));
        if (err) errors[key] = err;
        allTouched[key] = true;
      }
    }
    setValidationErrors(errors);
    setTouched(prev => ({ ...prev, ...allTouched }));
    return Object.keys(errors).length === 0;
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
    if (!validateAllRequired()) {
      setError('必須項目を入力してください。');
      return;
    }
    // 事業所会員は郵送先区分を固定OFFICE
    const payload = { ...form };
    if (isBusiness) {
      payload.preferredMailDestination = 'OFFICE';
    }
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await api.updateMember(payload as Member);
      setSuccessMsg('会員情報を更新しました。');
      onSaved();
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

  // ── 個人→事業所メンバー転籍 ──
  const handleConvertToStaff = async () => {
    if (!convertTargetOfficeId) { setError('転籍先の事業所を選択してください。'); return; }
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
      await api.updateStaff({
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
      // 楽観的UI更新: ローカル state を即反映
      setForm(prev => ({
        ...prev,
        staff: ((prev.staff as Staff[]) || []).map(s =>
          s.id === staff.id ? { ...s, [field]: newValue } : s
        ),
      }));
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${staff.name}の更新に失敗しました。`);
    } finally {
      setInlineSaving(prev => ({ ...prev, [saveKey]: false }));
    }
  };

  const staffList = (form.staff as Staff[]) || [];
  const enrolledStaff = staffList.filter(s => s.status !== 'LEFT');
  const convertSourceStaff = staffList.find(s => s.id === convertSourceStaffId);
  const isConvertSourceRep = convertSourceStaff?.role === 'REPRESENTATIVE';

  const isRequired = (key: string) => (isBusiness && !!businessRequiredFields[key]) || (isIndividual && !!individualRequiredFields[key]);

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
                <input className={fieldClass()} value={form.lastKana || ''} onChange={e => set('lastKana', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>メイ</label>
                <input className={fieldClass()} value={form.firstKana || ''} onChange={e => set('firstKana', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>介護支援専門員番号{isIndividual && <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>}</label>
                <input
                  className={fieldClass(isIndividual ? 'careManagerNumber' : undefined)}
                  value={form.careManagerNumber || ''}
                  onChange={e => set('careManagerNumber', e.target.value)}
                  onBlur={isIndividual ? () => handleBlur('careManagerNumber') : undefined}
                  aria-required={isIndividual || undefined}
                  aria-invalid={isIndividual && touched['careManagerNumber'] && !!validationErrors['careManagerNumber'] || undefined}
                  aria-describedby={isIndividual && touched['careManagerNumber'] && validationErrors['careManagerNumber'] ? 'err-careManagerNumber' : undefined}
                />
                {isIndividual && touched['careManagerNumber'] && validationErrors['careManagerNumber'] && (
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
            <input
              className={fieldClass('officePostCode')}
              value={form.officePostCode || ''}
              onChange={e => set('officePostCode', e.target.value)}
              onBlur={() => handleBlur('officePostCode')}
              aria-required={isRequired('officePostCode')}
              aria-invalid={touched.officePostCode && !!validationErrors.officePostCode}
              aria-describedby={validationErrors.officePostCode ? 'err-officePostCode' : undefined}
              placeholder="例: 573-0084"
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
            <label className={labelClass}>住所{isRequired('officeAddressLine') && <RequiredMark />}</label>
            <input
              className={fieldClass('officeAddressLine')}
              value={form.officeAddressLine || ''}
              onChange={e => set('officeAddressLine', e.target.value)}
              onBlur={() => handleBlur('officeAddressLine')}
              aria-required={isRequired('officeAddressLine')}
              aria-invalid={touched.officeAddressLine && !!validationErrors.officeAddressLine}
              aria-describedby={validationErrors.officeAddressLine ? 'err-officeAddressLine' : undefined}
            />
            <FieldError fieldKey="officeAddressLine" />
          </div>
          <div>
            <label className={labelClass}>電話番号{isRequired('phone') && <RequiredMark />}</label>
            <input
              className={fieldClass('phone')}
              value={form.phone || ''}
              onChange={e => set('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              aria-required={isRequired('phone')}
              aria-invalid={touched.phone && !!validationErrors.phone}
              aria-describedby={validationErrors.phone ? 'err-phone' : undefined}
            />
            <FieldError fieldKey="phone" />
          </div>
          <div>
            <label className={labelClass}>FAX番号</label>
            <input className={fieldClass()} value={form.fax || ''} onChange={e => set('fax', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 自宅情報（個人/賛助のみ） */}
      {!isBusiness && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">自宅情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>郵便番号</label>
              <input className={fieldClass()} value={form.homePostCode || ''} onChange={e => set('homePostCode', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>都道府県</label>
              <input className={fieldClass()} value={form.homePrefecture || ''} onChange={e => set('homePrefecture', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>市区町村</label>
              <input className={fieldClass()} value={form.homeCity || ''} onChange={e => set('homeCity', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>住所</label>
              <input className={fieldClass()} value={form.homeAddressLine || ''} onChange={e => set('homeAddressLine', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>携帯電話番号</label>
              <input className={fieldClass()} value={form.mobilePhone || ''} onChange={e => set('mobilePhone', e.target.value)} />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>会員状態</label>
            <select className={fieldClass()} value={form.status || 'ACTIVE'} onChange={e => set('status', e.target.value)} disabled={isBusiness}>
              <option value="ACTIVE">在籍中</option>
              <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
              <option value="WITHDRAWN">退会済</option>
            </select>
            {isBusiness && <p className="text-xs text-slate-400 mt-1">事業所会員の状態変更は会員アクションから行います</p>}
          </div>
          <div>
            <label className={labelClass}>入会日</label>
            <input className={fieldClass()} type="date" value={form.joinedDate || ''} onChange={e => set('joinedDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>退会日</label>
            <input className={fieldClass()} type="date" value={form.withdrawnDate || ''} disabled readOnly />
          </div>
        </div>
      </div>

      {/* 事業所職員一覧 */}
      {isBusiness && staffList.length > 0 && (
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
              {staffList.map((s: Staff, idx: number) => (
                <tr key={s.id || idx} className={s.status === 'LEFT' ? 'bg-slate-50 text-slate-400' : ''}>
                  <td className="px-4 py-2 text-sm">{s.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{s.kana}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{s.email}</td>
                  <td className="px-4 py-2 text-sm">
                    <select
                      value={s.role}
                      onChange={e => handleInlineStaffUpdate(s, 'role', e.target.value)}
                      disabled={!!inlineSaving[`${s.id}-role`]}
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
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
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

      {/* ── 転籍モーダル: 個人→事業所 ── */}
      {showConvertToStaffModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-800">事業所メンバーに転籍</h3>
            <p className="text-sm text-slate-600">
              {form.lastName} {form.firstName} を事業所のメンバーとして登録します。個人会員としてのステータスは退会になります。
            </p>
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
              <button onClick={() => setShowConvertToStaffModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
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
