import React, { useState } from 'react';
import { callApi } from '../../shared/api-base';

interface Props {
  onBack: () => void;
}

type MemberType = 'INDIVIDUAL' | 'BUSINESS';
type Step = 'member-type' | 'verify' | 'select-fields' | 'input-fields' | 'complete';

// ── フィールドグループ定義 ─────────────────────────────────────────────────────

type FieldGroup =
  | 'name'            // 氏・名・フリガナ
  | 'contact'         // メール・携帯電話
  | 'officeContact'   // 勤務先電話・FAX
  | 'officeAddress'   // 勤務先住所
  | 'homeAddress'     // 自宅住所
  | 'careManagerNumber' // CM番号（ログインIDに影響）
  | 'mailingPreference'
  | 'preferredMailDestination'
  | 'officeBasic'     // 事業所基本情報（名称・メール・電話・FAX）
  | 'bizAddress'      // 事業所住所
  | 'officeNumber'    // 事業所番号（ログインIDに影響）
  | 'staffAdd'        // 職員追加
  | 'staffRemove';    // 職員除籍

interface AddressValue {
  postCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  addressLine2: string;
}
const EMPTY_ADDRESS: AddressValue = { postCode: '', prefecture: '', city: '', addressLine: '', addressLine2: '' };

interface StaffAddCard {
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  careManagerNumber: string;
  email: string;
}
const EMPTY_STAFF_ADD: StaffAddCard = { lastName: '', firstName: '', lastKana: '', firstKana: '', careManagerNumber: '', email: '' };

interface StaffRemoveCard {
  lastName: string;
  firstName: string;
  careManagerNumber: string;
}
const EMPTY_STAFF_REMOVE: StaffRemoveCard = { lastName: '', firstName: '', careManagerNumber: '' };

interface IndividualFields {
  lastName: string; firstName: string; lastKana: string; firstKana: string;
  email: string; mobilePhone: string;
  phone: string; fax: string;
  officeAddress: AddressValue;
  homeAddress: AddressValue;
  careManagerNumber: string;
  mailingPreference: string;
  preferredMailDestination: string;
}
const INITIAL_INDIVIDUAL: IndividualFields = {
  lastName: '', firstName: '', lastKana: '', firstKana: '',
  email: '', mobilePhone: '',
  phone: '', fax: '',
  officeAddress: { ...EMPTY_ADDRESS },
  homeAddress: { ...EMPTY_ADDRESS },
  careManagerNumber: '',
  mailingPreference: '',
  preferredMailDestination: '',
};

interface BusinessFields {
  officeName: string;
  email: string; phone: string; fax: string;
  bizAddress: AddressValue;
  officeNumber: string;
}
const INITIAL_BUSINESS: BusinessFields = {
  officeName: '', email: '', phone: '', fax: '',
  bizAddress: { ...EMPTY_ADDRESS },
  officeNumber: '',
};

// ── スタイル ──────────────────────────────────────────────────────────────────
const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
const req = <span className="text-red-500"> *</span>;

// ── 住所入力コンポーネント ─────────────────────────────────────────────────────
const AddressInput: React.FC<{
  label: string; value: AddressValue; onChange: (v: AddressValue) => void;
}> = ({ label, value, onChange }) => {
  const up = (f: keyof AddressValue) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [f]: e.target.value });
  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">{label}</legend>
      <div><label className={labelClass}>郵便番号{req}</label>
        <input type="text" value={value.postCode} onChange={up('postCode')} placeholder="123-4567" maxLength={8} className={inputClass} required /></div>
      <div><label className={labelClass}>都道府県{req}</label>
        <input type="text" value={value.prefecture} onChange={up('prefecture')} placeholder="大阪府" maxLength={10} className={inputClass} required /></div>
      <div><label className={labelClass}>市区町村{req}</label>
        <input type="text" value={value.city} onChange={up('city')} placeholder="枚方市" className={inputClass} required /></div>
      <div><label className={labelClass}>番地{req}</label>
        <input type="text" value={value.addressLine} onChange={up('addressLine')} placeholder="○○町1-2-3" className={inputClass} required /></div>
      <div><label className={labelClass}>建物名・部屋番号（任意）</label>
        <input type="text" value={value.addressLine2} onChange={up('addressLine2')} placeholder="○○ビル101" className={inputClass} /></div>
    </fieldset>
  );
};

// ── ステップインジケーター ─────────────────────────────────────────────────────
const StepIndicator: React.FC<{ labels: string[]; current: number }> = ({ labels, current }) => (
  <nav aria-label="手続きの進行状況" className="mb-8">
    <ol className="flex flex-wrap items-center gap-1">
      {labels.map((label, i) => (
        <li key={i} className="flex items-center gap-1">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
            i < current ? 'bg-violet-600 text-white' :
            i === current ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-400' :
            'bg-slate-100 text-slate-400'}`}
            aria-current={i === current ? 'step' : undefined}>
            {i < current ? '✓' : i + 1}
          </span>
          <span className={`hidden text-xs sm:inline ${i === current ? 'font-semibold text-violet-700' : 'text-slate-400'}`}>{label}</span>
          {i < labels.length - 1 && <span className="mx-1 text-slate-300" aria-hidden>›</span>}
        </li>
      ))}
    </ol>
  </nav>
);

// ── メインコンポーネント ───────────────────────────────────────────────────────
const MemberUpdateForm: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>('member-type');
  const [memberType, setMemberType] = useState<MemberType>('INDIVIDUAL');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  // verify 入力
  const [cmNumber, setCmNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [officeNumber, setOfficeNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // フィールド選択
  const [selected, setSelected] = useState<Set<FieldGroup>>(new Set());
  const toggle = (g: FieldGroup) => setSelected(prev => {
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });

  // 個人会員フィールド値
  const [indFields, setIndFields] = useState<IndividualFields>(INITIAL_INDIVIDUAL);
  // 事業所会員フィールド値
  const [bizFields, setBizFields] = useState<BusinessFields>(INITIAL_BUSINESS);
  // スタッフ追加カード
  const [availableSlots, setAvailableSlots] = useState(1);
  const [staffAddCards, setStaffAddCards] = useState<StaffAddCard[]>([{ ...EMPTY_STAFF_ADD }]);
  // スタッフ除籍カード
  const [staffRemoveCards, setStaffRemoveCards] = useState<StaffRemoveCard[]>([{ ...EMPTY_STAFF_REMOVE }]);

  // ── Step 1: 会員種別選択 ─────────────────────────────────────────────────────
  const handleSelectType = (t: MemberType) => {
    setMemberType(t);
    setSelected(new Set());
    setStep('verify');
    clearError();
  };

  // ── Step 2: 本人確認 ─────────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    clearError();
    try {
      const payload: Record<string, string> = { memberType, purpose: 'update', contactEmail };
      if (memberType === 'INDIVIDUAL') {
        payload.cmNumber = cmNumber;
        payload.lastName = lastName;
        payload.firstName = firstName;
      } else {
        payload.officeNumber = officeNumber;
      }
      const res = await callApi<{ verified: boolean; token: string; error?: string }>('verifyMemberIdentityForPublic', payload);
      if (!res.verified) {
        setError(res.error || '入力内容と一致する会員情報が見つかりませんでした。');
        return;
      }
      setToken(res.token);
      setStep('select-fields');
    } catch (err) {
      setError(err instanceof Error ? err.message : '確認に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3 → Step 4: フィールド選択確定 ─────────────────────────────────────
  const handleSelectConfirm = async () => {
    if (selected.size === 0) { setError('変更する項目を1つ以上選択してください。'); return; }
    clearError();
    // 事業所会員でスタッフ追加選択時: 追加可能数を取得してカード枚数を決める
    if (memberType === 'BUSINESS' && selected.has('staffAdd')) {
      setBusy(true);
      try {
        const res = await callApi<{ availableSlots: number; error?: string }>('getPublicAvailableStaffSlots', { token });
        const slots = res.availableSlots ?? 1;
        setAvailableSlots(Math.max(1, slots));
        setStaffAddCards(Array.from({ length: Math.max(1, slots) }, () => ({ ...EMPTY_STAFF_ADD })));
      } catch {
        setAvailableSlots(1);
        setStaffAddCards([{ ...EMPTY_STAFF_ADD }]);
      } finally {
        setBusy(false);
      }
    }
    setStep('input-fields');
  };

  // ── Step 4 → 送信 ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    clearError();
    try {
      const fields: Record<string, string> = {};
      if (memberType === 'INDIVIDUAL') {
        if (selected.has('name')) {
          if (indFields.lastName) fields.lastName = indFields.lastName;
          if (indFields.firstName) fields.firstName = indFields.firstName;
          if (indFields.lastKana) fields.lastKana = indFields.lastKana;
          if (indFields.firstKana) fields.firstKana = indFields.firstKana;
        }
        if (selected.has('contact')) {
          if (indFields.email) fields.email = indFields.email;
          if (indFields.mobilePhone) fields.mobilePhone = indFields.mobilePhone;
        }
        if (selected.has('officeContact')) {
          if (indFields.phone) fields.phone = indFields.phone;
          if (indFields.fax) fields.fax = indFields.fax;
        }
        if (selected.has('officeAddress')) {
          const a = indFields.officeAddress;
          if (a.postCode) fields.officePostCode = a.postCode;
          if (a.prefecture) fields.officePrefecture = a.prefecture;
          if (a.city) fields.officeCity = a.city;
          if (a.addressLine) fields.officeAddressLine = a.addressLine;
          if (a.addressLine2) fields.officeAddressLine2 = a.addressLine2;
        }
        if (selected.has('homeAddress')) {
          const a = indFields.homeAddress;
          if (a.postCode) fields.homePostCode = a.postCode;
          if (a.prefecture) fields.homePrefecture = a.prefecture;
          if (a.city) fields.homeCity = a.city;
          if (a.addressLine) fields.homeAddressLine = a.addressLine;
          if (a.addressLine2) fields.homeAddressLine2 = a.addressLine2;
        }
        if (selected.has('careManagerNumber') && indFields.careManagerNumber) {
          fields.careManagerNumber = indFields.careManagerNumber;
        }
        if (selected.has('mailingPreference') && indFields.mailingPreference) {
          fields.mailingPreference = indFields.mailingPreference;
        }
        if (selected.has('preferredMailDestination') && indFields.preferredMailDestination) {
          fields.preferredMailDestination = indFields.preferredMailDestination;
        }
      } else {
        if (selected.has('officeBasic')) {
          if (bizFields.officeName) fields.officeName = bizFields.officeName;
          if (bizFields.email) fields.email = bizFields.email;
          if (bizFields.phone) fields.phone = bizFields.phone;
          if (bizFields.fax) fields.fax = bizFields.fax;
        }
        if (selected.has('bizAddress')) {
          const a = bizFields.bizAddress;
          if (a.postCode) fields.officePostCode = a.postCode;
          if (a.prefecture) fields.officePrefecture = a.prefecture;
          if (a.city) fields.officeCity = a.city;
          if (a.addressLine) fields.officeAddressLine = a.addressLine;
          if (a.addressLine2) fields.officeAddressLine2 = a.addressLine2;
        }
        if (selected.has('officeNumber') && bizFields.officeNumber) {
          fields.officeNumber = bizFields.officeNumber;
        }
      }

      const staffAdd = (selected.has('staffAdd') && memberType === 'BUSINESS')
        ? staffAddCards.filter(c => c.lastName && c.firstName && c.lastKana && c.firstKana && /^\d{8}$/.test(c.careManagerNumber) && c.email)
        : [];
      const staffRemove = (selected.has('staffRemove') && memberType === 'BUSINESS')
        ? staffRemoveCards.filter(c => c.lastName && c.firstName && /^\d{8}$/.test(c.careManagerNumber))
        : [];

      const res = await callApi<{ success: boolean; requestId?: string; error?: string }>('submitPublicChangeRequest', {
        token,
        requestType: 'MEMBER_UPDATE',
        fields,
        staffAdd,
        staffRemove,
      });
      if (!res.success) {
        const e = res.error || '';
        if (e === 'token_expired') {
          setError('セッションの有効期限が切れました（30分）。最初からやり直してください。');
        } else {
          setError(e || '申請の送信に失敗しました。');
        }
        return;
      }
      setStep('complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'token_expired') {
        setError('セッションの有効期限が切れました（30分）。最初からやり直してください。');
      } else {
        setError(msg || '申請の送信に失敗しました。');
      }
    } finally {
      setBusy(false);
    }
  };

  const INDIVIDUAL_GROUPS = [
    { key: 'name' as FieldGroup, label: '氏名', desc: '氏・名・フリガナ（氏）・フリガナ（名）' },
    { key: 'contact' as FieldGroup, label: '連絡先メール・携帯電話番号', desc: '' },
    { key: 'officeContact' as FieldGroup, label: '勤務先電話番号・FAX番号', desc: '' },
    { key: 'officeAddress' as FieldGroup, label: '勤務先住所', desc: '〒・都道府県・市区町村・番地・建物名' },
    { key: 'homeAddress' as FieldGroup, label: '自宅住所', desc: '〒・都道府県・市区町村・番地・建物名' },
    { key: 'careManagerNumber' as FieldGroup, label: '介護支援専門員番号', desc: '⚠ 変更するとログインIDも変わります', warn: true },
    { key: 'mailingPreference' as FieldGroup, label: '通知方法', desc: 'メール通知 / 郵送通知の切り替え' },
    { key: 'preferredMailDestination' as FieldGroup, label: '郵送先区分', desc: '勤務先宛 / 自宅宛の切り替え' },
  ];
  const BUSINESS_GROUPS = [
    { key: 'officeBasic' as FieldGroup, label: '事業所基本情報', desc: '名称・メール・電話・FAX' },
    { key: 'bizAddress' as FieldGroup, label: '事業所住所', desc: '〒・都道府県・市区町村・番地・建物名' },
    { key: 'officeNumber' as FieldGroup, label: '事業所番号', desc: '⚠ 変更するとログインIDも変わります', warn: true },
    { key: 'staffAdd' as FieldGroup, label: '職員を追加する', desc: '追加可能な枠数分のカードを表示します' },
    { key: 'staffRemove' as FieldGroup, label: '職員を除籍する', desc: '氏・名・介護支援専門員番号で照合します' },
  ];
  const groups = memberType === 'INDIVIDUAL' ? INDIVIDUAL_GROUPS : BUSINESS_GROUPS;

  const stepLabels = ['会員種別', '本人確認', '変更項目の選択', '変更内容の入力', '完了'];
  const stepIndex = (['member-type', 'verify', 'select-fields', 'input-fields', 'complete'] as Step[]).indexOf(step);

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-violet-700 hover:underline">
        ← ポータルトップへ戻る
      </button>
      <h2 className="mb-2 text-2xl font-bold text-slate-900">会員登録情報を変更する</h2>
      <p className="mb-6 text-sm text-slate-600">
        ご本人確認の後、変更申請を送信します。担当者が内容を確認後に反映します。
      </p>

      <StepIndicator labels={stepLabels} current={stepIndex} />

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: 会員種別選択 */}
      {step === 'member-type' && (
        <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-slate-800">会員の種別を選択してください</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => handleSelectType('INDIVIDUAL')}
              className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-violet-200 bg-violet-50 p-6 text-center transition hover:border-violet-400 hover:bg-violet-100">
              <span className="text-3xl">👤</span>
              <div>
                <p className="font-bold text-slate-900">個人会員</p>
                <p className="mt-1 text-xs text-slate-500">介護支援専門員番号・氏名で確認</p>
              </div>
            </button>
            <button type="button" onClick={() => handleSelectType('BUSINESS')}
              className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-violet-200 bg-violet-50 p-6 text-center transition hover:border-violet-400 hover:bg-violet-100">
              <span className="text-3xl">🏢</span>
              <div>
                <p className="font-bold text-slate-900">事業所会員</p>
                <p className="mt-1 text-xs text-slate-500">事業所番号で確認</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 本人確認 */}
      {step === 'verify' && (
        <form onSubmit={handleVerify} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            {memberType === 'INDIVIDUAL' ? '個人会員の本人確認' : '事業所会員の本人確認'}
          </h3>
          <p className="mb-5 text-sm text-slate-600">
            ご登録情報と照合して本人確認を行います。入力内容はDBに保存されません。
          </p>

          {memberType === 'INDIVIDUAL' ? (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>介護支援専門員番号{req}</label>
                <input type="text" inputMode="numeric" pattern="\d{8}" maxLength={8} required
                  value={cmNumber} onChange={e => setCmNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345678" className={inputClass} />
                <p className="mt-1 text-xs text-slate-500">半角数字8桁</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>氏（姓）{req}</label>
                  <input type="text" required value={lastName}
                    onChange={e => setLastName(e.target.value)} placeholder="山田" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>名{req}</label>
                  <input type="text" required value={firstName}
                    onChange={e => setFirstName(e.target.value)} placeholder="太郎" className={inputClass} />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>事業所番号{req}</label>
              <input type="text" required value={officeNumber}
                onChange={e => setOfficeNumber(e.target.value.trim())} placeholder="事業所番号を入力" className={inputClass} />
            </div>
          )}

          <div className="mt-4">
            <label className={labelClass}>返信用メールアドレス{req}</label>
            <input type="email" required value={contactEmail}
              onChange={e => setContactEmail(e.target.value.trim())} placeholder="example@email.com" className={inputClass} />
            <p className="mt-1 text-xs text-slate-500">
              申請受付・処理結果の通知に使用します。会員登録情報とは紐づきません。
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => { setStep('member-type'); clearError(); }}
              className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400">
              ← 戻る
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {busy ? '確認中...' : '確認して次へ'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: 変更項目選択 */}
      {step === 'select-fields' && (
        <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-slate-800">変更する項目を選択</h3>
          <p className="mb-5 text-sm text-slate-600">変更したい項目にチェックを入れてください。複数選択できます。</p>
          <fieldset>
            <legend className="sr-only">変更する項目</legend>
            <div className="space-y-2">
              {groups.map(g => (
                <label key={g.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    selected.has(g.key) ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}>
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-violet-600"
                    checked={selected.has(g.key)} onChange={() => toggle(g.key)} />
                  <div>
                    <span className="text-sm font-medium text-slate-800">{g.label}</span>
                    {g.desc && (
                      <p className={`mt-0.5 text-xs ${'warn' in g && g.warn ? 'font-semibold text-amber-600' : 'text-slate-500'}`}>
                        {g.desc}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => { clearError(); setStep('verify'); }}
              className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400">
              ← 戻る
            </button>
            <button type="button" disabled={busy} onClick={handleSelectConfirm}
              className="flex-1 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {busy ? '確認中...' : '次へ進む →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 変更内容入力 */}
      {step === 'input-fields' && (
        <form onSubmit={handleSubmit} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-slate-800">新しい情報を入力</h3>
          <p className="mb-5 text-sm text-slate-600">
            変更後の情報を入力してください。空欄の項目は変更対象になりません。
          </p>
          <div className="space-y-6">
            {/* ── 個人会員フィールド ──────────────────────────────────── */}
            {memberType === 'INDIVIDUAL' && (
              <>
                {selected.has('name') && (
                  <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-slate-700">氏名</legend>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>氏（姓）</label>
                        <input type="text" value={indFields.lastName}
                          onChange={e => setIndFields(f => ({ ...f, lastName: e.target.value }))}
                          placeholder="" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>名</label>
                        <input type="text" value={indFields.firstName}
                          onChange={e => setIndFields(f => ({ ...f, firstName: e.target.value }))}
                          placeholder="" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>フリガナ（氏）</label>
                        <input type="text" value={indFields.lastKana}
                          onChange={e => setIndFields(f => ({ ...f, lastKana: e.target.value }))}
                          placeholder="" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>フリガナ（名）</label>
                        <input type="text" value={indFields.firstKana}
                          onChange={e => setIndFields(f => ({ ...f, firstKana: e.target.value }))}
                          placeholder="" className={inputClass} />
                      </div>
                    </div>
                  </fieldset>
                )}
                {selected.has('contact') && (
                  <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-slate-700">連絡先</legend>
                    <div>
                      <label className={labelClass}>メールアドレス</label>
                      <input type="email" value={indFields.email}
                        onChange={e => setIndFields(f => ({ ...f, email: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>携帯電話番号</label>
                      <input type="tel" value={indFields.mobilePhone}
                        onChange={e => setIndFields(f => ({ ...f, mobilePhone: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                  </fieldset>
                )}
                {selected.has('officeContact') && (
                  <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-slate-700">勤務先電話・FAX</legend>
                    <div>
                      <label className={labelClass}>勤務先電話番号</label>
                      <input type="tel" value={indFields.phone}
                        onChange={e => setIndFields(f => ({ ...f, phone: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>勤務先FAX番号</label>
                      <input type="tel" value={indFields.fax}
                        onChange={e => setIndFields(f => ({ ...f, fax: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                  </fieldset>
                )}
                {selected.has('officeAddress') && (
                  <AddressInput label="勤務先住所" value={indFields.officeAddress}
                    onChange={a => setIndFields(f => ({ ...f, officeAddress: a }))} />
                )}
                {selected.has('homeAddress') && (
                  <AddressInput label="自宅住所" value={indFields.homeAddress}
                    onChange={a => setIndFields(f => ({ ...f, homeAddress: a }))} />
                )}
                {selected.has('careManagerNumber') && (
                  <div>
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      <strong>注意:</strong> 介護支援専門員番号を変更すると、ログインIDも変更されます。
                    </div>
                    <label className={labelClass}>新しい介護支援専門員番号</label>
                    <input type="text" inputMode="numeric" pattern="\d{8}" maxLength={8}
                      value={indFields.careManagerNumber}
                      onChange={e => setIndFields(f => ({ ...f, careManagerNumber: e.target.value.replace(/\D/g, '') }))}
                      placeholder="" className={inputClass} />
                    <p className="mt-1 text-xs text-slate-500">半角数字8桁</p>
                  </div>
                )}
                {selected.has('mailingPreference') && (
                  <div>
                    <label className={labelClass}>通知方法</label>
                    <select value={indFields.mailingPreference}
                      onChange={e => setIndFields(f => ({ ...f, mailingPreference: e.target.value }))}
                      className={inputClass}>
                      <option value="">-- 選択してください --</option>
                      <option value="EMAIL">メール</option>
                      <option value="MAIL">郵送</option>
                    </select>
                  </div>
                )}
                {selected.has('preferredMailDestination') && (
                  <div>
                    <label className={labelClass}>郵送先区分</label>
                    <select value={indFields.preferredMailDestination}
                      onChange={e => setIndFields(f => ({ ...f, preferredMailDestination: e.target.value }))}
                      className={inputClass}>
                      <option value="">-- 選択してください --</option>
                      <option value="OFFICE">勤務先</option>
                      <option value="HOME">自宅</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* ── 事業所会員フィールド ───────────────────────────────── */}
            {memberType === 'BUSINESS' && (
              <>
                {selected.has('officeBasic') && (
                  <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-slate-700">事業所基本情報</legend>
                    <div>
                      <label className={labelClass}>事業所名</label>
                      <input type="text" value={bizFields.officeName}
                        onChange={e => setBizFields(f => ({ ...f, officeName: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>メールアドレス</label>
                      <input type="email" value={bizFields.email}
                        onChange={e => setBizFields(f => ({ ...f, email: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>電話番号</label>
                      <input type="tel" value={bizFields.phone}
                        onChange={e => setBizFields(f => ({ ...f, phone: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>FAX番号</label>
                      <input type="tel" value={bizFields.fax}
                        onChange={e => setBizFields(f => ({ ...f, fax: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                  </fieldset>
                )}
                {selected.has('bizAddress') && (
                  <AddressInput label="事業所住所" value={bizFields.bizAddress}
                    onChange={a => setBizFields(f => ({ ...f, bizAddress: a }))} />
                )}
                {selected.has('officeNumber') && (
                  <div>
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      <strong>注意:</strong> 事業所番号を変更すると、ログインIDも変更されます。
                    </div>
                    <label className={labelClass}>新しい事業所番号</label>
                    <input type="text" value={bizFields.officeNumber}
                      onChange={e => setBizFields(f => ({ ...f, officeNumber: e.target.value.trim() }))}
                      placeholder="" className={inputClass} />
                  </div>
                )}

                {/* 職員追加カード */}
                {selected.has('staffAdd') && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">
                      職員追加（追加可能: {availableSlots}名）
                    </h4>
                    <p className="mb-4 text-xs text-slate-500">
                      追加する職員の情報をすべて入力してください。空欄のカードは無視されます。
                    </p>
                    <div className="space-y-4">
                      {staffAddCards.map((card, idx) => (
                        <fieldset key={idx} className="rounded-lg border border-violet-200 p-4 bg-violet-50">
                          <legend className="px-1 text-xs font-semibold text-violet-700">追加職員 {idx + 1}</legend>
                          <div className="mt-2 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>氏（姓）{req}</label>
                                <input type="text" value={card.lastName}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, lastName: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>名{req}</label>
                                <input type="text" value={card.firstName}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, firstName: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>フリガナ（氏）{req}</label>
                                <input type="text" value={card.lastKana}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, lastKana: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>フリガナ（名）{req}</label>
                                <input type="text" value={card.firstKana}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, firstKana: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                            </div>
                            <div>
                              <label className={labelClass}>介護支援専門員番号{req}</label>
                              <input type="text" inputMode="numeric" pattern="\d{8}" maxLength={8}
                                value={card.careManagerNumber}
                                onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, careManagerNumber: e.target.value.replace(/\D/g, '') } : c))}
                                placeholder="" className={inputClass} />
                              <p className="mt-1 text-xs text-slate-500">半角数字8桁</p>
                            </div>
                            <div>
                              <label className={labelClass}>メールアドレス{req}</label>
                              <input type="email" value={card.email}
                                onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, email: e.target.value } : c))}
                                placeholder="" className={inputClass} />
                            </div>
                          </div>
                        </fieldset>
                      ))}
                    </div>
                  </div>
                )}

                {/* 職員除籍カード */}
                {selected.has('staffRemove') && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">職員除籍</h4>
                    <p className="mb-4 text-xs text-slate-500">
                      除籍する職員の氏・名・介護支援専門員番号を入力してください。
                    </p>
                    <div className="space-y-3">
                      {staffRemoveCards.map((card, idx) => (
                        <fieldset key={idx} className="rounded-lg border border-amber-200 p-4 bg-amber-50">
                          <legend className="px-1 text-xs font-semibold text-amber-700">除籍職員 {idx + 1}</legend>
                          <div className="mt-2 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>氏（姓）{req}</label>
                                <input type="text" value={card.lastName}
                                  onChange={e => setStaffRemoveCards(cards => cards.map((c, i) => i === idx ? { ...c, lastName: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>名{req}</label>
                                <input type="text" value={card.firstName}
                                  onChange={e => setStaffRemoveCards(cards => cards.map((c, i) => i === idx ? { ...c, firstName: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                            </div>
                            <div>
                              <label className={labelClass}>介護支援専門員番号{req}</label>
                              <input type="text" inputMode="numeric" pattern="\d{8}" maxLength={8}
                                value={card.careManagerNumber}
                                onChange={e => setStaffRemoveCards(cards => cards.map((c, i) => i === idx ? { ...c, careManagerNumber: e.target.value.replace(/\D/g, '') } : c))}
                                placeholder="" className={inputClass} />
                              <p className="mt-1 text-xs text-slate-500">半角数字8桁</p>
                            </div>
                          </div>
                          {staffRemoveCards.length > 1 && (
                            <button type="button"
                              onClick={() => setStaffRemoveCards(cards => cards.filter((_, i) => i !== idx))}
                              className="mt-3 text-xs text-red-600 hover:underline">
                              このカードを削除
                            </button>
                          )}
                        </fieldset>
                      ))}
                      <button type="button"
                        onClick={() => setStaffRemoveCards(cards => [...cards, { ...EMPTY_STAFF_REMOVE }])}
                        className="w-full rounded-lg border-2 border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400">
                        + 除籍職員を追加
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => { clearError(); setStep('select-fields'); }}
              className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400">
              ← 項目選択に戻る
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {busy ? '送信中...' : '変更を申請する'}
            </button>
          </div>
        </form>
      )}

      {/* Step 5: 完了 */}
      {step === 'complete' && (
        <div className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-3xl text-violet-600">
            ✓
          </div>
          <h3 className="text-xl font-bold text-slate-900">変更申請を受け付けました</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            ご入力の返信用メールアドレスに受付確認をお送りしました。<br />
            担当者が内容を確認後、変更が反映されます。<br />
            ご不明な点は事務局までお問い合わせください。
          </p>
          <button onClick={onBack}
            className="mt-6 rounded-full bg-violet-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
            ポータルトップへ戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberUpdateForm;
