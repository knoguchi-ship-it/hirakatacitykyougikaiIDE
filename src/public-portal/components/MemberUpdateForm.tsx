import React, { useState } from 'react';
import { callApi } from '../../shared/api-base';

interface Props {
  onBack: () => void;
}

type Step = 'lookup' | 'otp' | 'select-fields' | 'input-fields' | 'complete';

interface AddressValue {
  postCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  addressLine2: string;
}

interface FieldValues {
  email: string;
  mobilePhone: string;
  phone: string;
  fax: string;
  officeAddress: AddressValue;
  homeAddress: AddressValue;
  mailingPreference: string;
  preferredMailDestination: string;
}

const EMPTY_ADDRESS: AddressValue = { postCode: '', prefecture: '', city: '', addressLine: '', addressLine2: '' };

const INITIAL_VALUES: FieldValues = {
  email: '',
  mobilePhone: '',
  phone: '',
  fax: '',
  officeAddress: { ...EMPTY_ADDRESS },
  homeAddress: { ...EMPTY_ADDRESS },
  mailingPreference: 'EMAIL',
  preferredMailDestination: 'OFFICE',
};

interface CheckboxItem {
  key: string;
  label: string;
  description: string;
}

const FIELD_ITEMS: CheckboxItem[] = [
  { key: 'email', label: '代表メールアドレス', description: '連絡用メールアドレス' },
  { key: 'mobilePhone', label: '携帯電話番号', description: '' },
  { key: 'phone', label: '勤務先電話番号', description: '' },
  { key: 'fax', label: '勤務先FAX番号', description: '' },
  { key: 'officeAddress', label: '勤務先住所', description: '郵便番号・都道府県・市区町村・番地を含む' },
  { key: 'homeAddress', label: '自宅住所', description: '郵便番号・都道府県・市区町村・番地を含む' },
  { key: 'mailingPreference', label: '通知方法', description: 'メール通知 / 郵送通知の切り替え' },
  { key: 'preferredMailDestination', label: '郵送先区分', description: '勤務先宛 / 自宅宛の切り替え' },
];

function buildApiPayload(selected: Set<string>, values: FieldValues): Record<string, string> {
  const out: Record<string, string> = {};
  if (selected.has('email')) out.email = values.email;
  if (selected.has('mobilePhone')) out.mobilePhone = values.mobilePhone;
  if (selected.has('phone')) out.phone = values.phone;
  if (selected.has('fax')) out.fax = values.fax;
  if (selected.has('officeAddress')) {
    const a = values.officeAddress;
    out.officePostCode = a.postCode;
    out.officePrefecture = a.prefecture;
    out.officeCity = a.city;
    out.officeAddressLine = a.addressLine;
    out.officeAddressLine2 = a.addressLine2;
  }
  if (selected.has('homeAddress')) {
    const a = values.homeAddress;
    out.homePostCode = a.postCode;
    out.homePrefecture = a.prefecture;
    out.homeCity = a.city;
    out.homeAddressLine = a.addressLine;
    out.homeAddressLine2 = a.addressLine2;
  }
  if (selected.has('mailingPreference')) out.mailingPreference = values.mailingPreference;
  if (selected.has('preferredMailDestination')) out.preferredMailDestination = values.preferredMailDestination;
  return out;
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

interface AddressInputProps {
  label: string;
  value: AddressValue;
  onChange: (v: AddressValue) => void;
}

const AddressInput: React.FC<AddressInputProps> = ({ label, value, onChange }) => {
  const up = (field: keyof AddressValue) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value });
  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">{label}</legend>
      <div>
        <label className={labelClass}>郵便番号 <span className="text-red-500">*</span></label>
        <input type="text" value={value.postCode} onChange={up('postCode')} placeholder="123-4567" maxLength={8} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>都道府県 <span className="text-red-500">*</span></label>
        <input type="text" value={value.prefecture} onChange={up('prefecture')} placeholder="大阪府" maxLength={10} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>市区町村 <span className="text-red-500">*</span></label>
        <input type="text" value={value.city} onChange={up('city')} placeholder="枚方市" className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>番地 <span className="text-red-500">*</span></label>
        <input type="text" value={value.addressLine} onChange={up('addressLine')} placeholder="○○町1-2-3" className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>建物名・部屋番号（任意）</label>
        <input type="text" value={value.addressLine2} onChange={up('addressLine2')} placeholder="○○ビル101" className={inputClass} />
      </div>
    </fieldset>
  );
};

const MemberUpdateForm: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>('lookup');
  const [cmNumber, setCmNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<FieldValues>(INITIAL_VALUES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpRemaining, setOtpRemaining] = useState<number | null>(null);

  const clearError = () => setError(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    clearError();
    try {
      await callApi('sendPublicOtp', { cmNumber, purpose: 'update' });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    clearError();
    try {
      const res = await callApi<{ token: string }>('verifyPublicOtp', { cmNumber, otp, purpose: 'update' });
      setToken(res.token);
      setStep('select-fields');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'invalid_otp') {
        setError('認証コードが正しくありません。');
      } else if (msg === 'otp_expired') {
        setError('認証コードの有効期限が切れました。最初からやり直してください。');
      } else if (msg === 'too_many_attempts') {
        setError('試行回数が上限を超えました。最初からやり直してください。');
      } else {
        setError(msg || '認証に失敗しました。');
      }
      if (typeof (err as {remaining?: number}).remaining === 'number') {
        setOtpRemaining((err as {remaining?: number}).remaining ?? null);
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleField = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size === 0) { setError('変更する項目を1つ以上選択してください。'); return; }
    setBusy(true);
    clearError();
    try {
      await callApi('submitPublicMemberUpdate', { token, fields: buildApiPayload(selected, values) });
      setStep('complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'token_expired') {
        setError('セッションの有効期限が切れました。最初からやり直してください。');
      } else {
        setError(msg || '変更の送信に失敗しました。');
      }
    } finally {
      setBusy(false);
    }
  };

  const stepLabels = ['CM番号入力', 'コード認証', '変更項目の選択', '新しい情報を入力', '完了'];
  const stepIndex = ['lookup', 'otp', 'select-fields', 'input-fields', 'complete'].indexOf(step);

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-violet-700 hover:underline">
        ← ポータルトップへ戻る
      </button>
      <h2 className="mb-2 text-2xl font-bold text-slate-900">会員登録情報を変更する</h2>
      <p className="mb-6 text-sm text-slate-600">
        介護支援専門員番号で本人確認を行い、変更したい項目をお選びください。
      </p>

      {/* ステップインジケーター */}
      <nav aria-label="手続きの進行状況" className="mb-8">
        <ol className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <li key={i} className="flex items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i < stepIndex ? 'bg-violet-600 text-white' :
                  i === stepIndex ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-400' :
                  'bg-slate-100 text-slate-400'
                }`}
                aria-current={i === stepIndex ? 'step' : undefined}
              >
                {i < stepIndex ? '✓' : i + 1}
              </span>
              <span className={`hidden text-xs sm:inline ${i === stepIndex ? 'font-semibold text-violet-700' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <span className="mx-1 text-slate-300" aria-hidden>›</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {otpRemaining !== null && <> （残り {otpRemaining} 回）</>}
        </div>
      )}

      {/* Step 1: CM番号入力 */}
      {step === 'lookup' && (
        <form onSubmit={handleSendOtp} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">介護支援専門員番号を入力</h3>
          <p className="mb-5 text-sm text-slate-600">
            ご登録の介護支援専門員番号（8桁）を入力してください。<br />
            登録メールアドレスに確認コードを送信します。
          </p>
          <div className="mb-5">
            <label htmlFor="cm-number" className={labelClass}>
              介護支援専門員番号 <span className="text-red-500">*</span>
            </label>
            <input
              id="cm-number"
              type="text"
              inputMode="numeric"
              pattern="\d{8}"
              maxLength={8}
              required
              value={cmNumber}
              onChange={e => setCmNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="12345678"
              className={inputClass}
              aria-describedby="cm-hint"
            />
            <p id="cm-hint" className="mt-1 text-xs text-slate-500">半角数字8桁</p>
          </div>
          <button
            type="submit"
            disabled={busy || cmNumber.length !== 8}
            className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? '送信中...' : '確認コードを送信する'}
          </button>
        </form>
      )}

      {/* Step 2: OTP 入力 */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">確認コードを入力</h3>
          <p className="mb-5 text-sm text-slate-600">
            ご登録のメールアドレスに6桁の確認コードを送信しました。<br />
            メールが届かない場合は、迷惑メールフォルダをご確認ください。<br />
            コードの有効期限は10分です。
          </p>
          <div className="mb-5">
            <label htmlFor="otp-input" className={labelClass}>
              確認コード <span className="text-red-500">*</span>
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); clearError(); }}
              placeholder="123456"
              className={`${inputClass} text-center text-xl tracking-[0.5em]`}
            />
          </div>
          <button
            type="submit"
            disabled={busy || otp.length !== 6}
            className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? '確認中...' : '確認する'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('lookup'); setOtp(''); clearError(); setOtpRemaining(null); }}
            className="mt-3 w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            最初からやり直す
          </button>
        </form>
      )}

      {/* Step 3: フィールド選択 */}
      {step === 'select-fields' && (
        <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-slate-800">変更する項目を選択</h3>
          <p className="mb-5 text-sm text-slate-600">変更したい項目にチェックを入れてください。複数選択できます。</p>
          <fieldset>
            <legend className="sr-only">変更する項目</legend>
            <div className="space-y-2">
              {FIELD_ITEMS.map(item => (
                <label
                  key={item.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    selected.has(item.key)
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-violet-600"
                    checked={selected.has(item.key)}
                    onChange={() => toggleField(item.key)}
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800">{item.label}</span>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            onClick={() => {
              if (selected.size === 0) { setError('変更する項目を1つ以上選択してください。'); return; }
              clearError();
              setStep('input-fields');
            }}
            className="mt-6 w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            次へ進む →
          </button>
        </div>
      )}

      {/* Step 4: 新しい値を入力 */}
      {step === 'input-fields' && (
        <form onSubmit={handleSubmitUpdate} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-slate-800">新しい情報を入力</h3>
          <p className="mb-5 text-sm text-slate-600">選択した項目の新しい情報を入力してください。</p>
          <div className="space-y-5">
            {selected.has('email') && (
              <div>
                <label htmlFor="new-email" className={labelClass}>
                  代表メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-email"
                  type="email"
                  required
                  value={values.email}
                  onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
                  className={inputClass}
                  placeholder="example@email.com"
                />
              </div>
            )}
            {selected.has('mobilePhone') && (
              <div>
                <label htmlFor="new-mobile" className={labelClass}>
                  携帯電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-mobile"
                  type="tel"
                  required
                  value={values.mobilePhone}
                  onChange={e => setValues(v => ({ ...v, mobilePhone: e.target.value }))}
                  className={inputClass}
                  placeholder="090-1234-5678"
                />
              </div>
            )}
            {selected.has('phone') && (
              <div>
                <label htmlFor="new-phone" className={labelClass}>
                  勤務先電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-phone"
                  type="tel"
                  required
                  value={values.phone}
                  onChange={e => setValues(v => ({ ...v, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="072-123-4567"
                />
              </div>
            )}
            {selected.has('fax') && (
              <div>
                <label htmlFor="new-fax" className={labelClass}>勤務先FAX番号</label>
                <input
                  id="new-fax"
                  type="tel"
                  value={values.fax}
                  onChange={e => setValues(v => ({ ...v, fax: e.target.value }))}
                  className={inputClass}
                  placeholder="072-123-4568"
                />
              </div>
            )}
            {selected.has('officeAddress') && (
              <AddressInput
                label="勤務先住所"
                value={values.officeAddress}
                onChange={a => setValues(v => ({ ...v, officeAddress: a }))}
              />
            )}
            {selected.has('homeAddress') && (
              <AddressInput
                label="自宅住所"
                value={values.homeAddress}
                onChange={a => setValues(v => ({ ...v, homeAddress: a }))}
              />
            )}
            {selected.has('mailingPreference') && (
              <div>
                <label htmlFor="mailing-pref" className={labelClass}>
                  通知方法 <span className="text-red-500">*</span>
                </label>
                <select
                  id="mailing-pref"
                  value={values.mailingPreference}
                  onChange={e => setValues(v => ({ ...v, mailingPreference: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="EMAIL">メール</option>
                  <option value="MAIL">郵送</option>
                </select>
              </div>
            )}
            {selected.has('preferredMailDestination') && (
              <div>
                <label htmlFor="mail-dest" className={labelClass}>
                  郵送先区分 <span className="text-red-500">*</span>
                </label>
                <select
                  id="mail-dest"
                  value={values.preferredMailDestination}
                  onChange={e => setValues(v => ({ ...v, preferredMailDestination: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="OFFICE">勤務先</option>
                  <option value="HOME">自宅</option>
                </select>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => { clearError(); setStep('select-fields'); }}
              className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              ← 項目選択に戻る
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {busy ? '送信中...' : '変更を申し込む'}
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
            ご登録のメールアドレスに確認メールをお送りしました。<br />
            内容を確認の上、反映されない場合は事務局へお問い合わせください。
          </p>
          <button
            onClick={onBack}
            className="mt-6 rounded-full bg-violet-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            ポータルトップへ戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberUpdateForm;
