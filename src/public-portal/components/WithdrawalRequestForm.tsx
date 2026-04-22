import React, { useState } from 'react';
import { callApi } from '../../shared/api-base';

interface Props {
  onBack: () => void;
}

type Step = 'lookup' | 'otp' | 'confirm' | 'complete';

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

const WithdrawalRequestForm: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>('lookup');
  const [cmNumber, setCmNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [withdrawnDate, setWithdrawnDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const clearError = () => setError(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    clearError();
    try {
      await callApi('sendPublicOtp', { cmNumber, purpose: 'withdrawal' });
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
      const res = await callApi<{ token: string }>('verifyPublicOtp', { cmNumber, otp, purpose: 'withdrawal' });
      setToken(res.token);
      setStep('confirm');
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
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) { setError('退会に同意するチェックを入れてください。'); return; }
    setBusy(true);
    clearError();
    try {
      const res = await callApi<{ withdrawnDate: string }>('submitPublicWithdrawalRequest', { token });
      setWithdrawnDate(res.withdrawnDate);
      setStep('complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'token_expired') {
        setError('セッションの有効期限が切れました。最初からやり直してください。');
      } else if (msg.includes('既に退会申請済み')) {
        setError('既に退会申請済みです。会員マイページでご確認ください。');
      } else if (msg.includes('既に退会済み')) {
        setError('この会員番号は既に退会済みです。');
      } else {
        setError(msg || '申請の送信に失敗しました。');
      }
    } finally {
      setBusy(false);
    }
  };

  const stepLabels = ['CM番号入力', 'コード認証', '退会確認', '完了'];
  const stepIndex = ['lookup', 'otp', 'confirm', 'complete'].indexOf(step);

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-amber-700 hover:underline">
        ← ポータルトップへ戻る
      </button>
      <h2 className="mb-2 text-2xl font-bold text-slate-900">退会を申し込む</h2>
      <p className="mb-6 text-sm text-slate-600">
        介護支援専門員番号で本人確認を行い、退会申請を行います。
        退会は当年度末（3月31日）に適用されます。
      </p>

      {/* ステップインジケーター */}
      <nav aria-label="手続きの進行状況" className="mb-8">
        <ol className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <li key={i} className="flex items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i < stepIndex ? 'bg-amber-500 text-white' :
                  i === stepIndex ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' :
                  'bg-slate-100 text-slate-400'
                }`}
                aria-current={i === stepIndex ? 'step' : undefined}
              >
                {i < stepIndex ? '✓' : i + 1}
              </span>
              <span className={`hidden text-xs sm:inline ${i === stepIndex ? 'font-semibold text-amber-700' : 'text-slate-400'}`}>
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

          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">退会前にご確認ください</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-700">
              <li>退会は当年度末（3月31日）に適用されます</li>
              <li>退会予定日までは会員マイページをご利用いただけます</li>
              <li>退会を取り消す場合は会員マイページからお手続きください</li>
              <li>事業所会員の退会は代表者のみ、会員マイページからお手続きください</li>
            </ul>
          </div>

          <div className="mb-5">
            <label htmlFor="cm-number-wd" className={labelClass}>
              介護支援専門員番号 <span className="text-red-500">*</span>
            </label>
            <input
              id="cm-number-wd"
              type="text"
              inputMode="numeric"
              pattern="\d{8}"
              maxLength={8}
              required
              value={cmNumber}
              onChange={e => setCmNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="12345678"
              className={inputClass}
              aria-describedby="cm-hint-wd"
            />
            <p id="cm-hint-wd" className="mt-1 text-xs text-slate-500">半角数字8桁</p>
          </div>
          <button
            type="submit"
            disabled={busy || cmNumber.length !== 8}
            className="w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
            <label htmlFor="otp-input-wd" className={labelClass}>
              確認コード <span className="text-red-500">*</span>
            </label>
            <input
              id="otp-input-wd"
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
            className="w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? '確認中...' : '確認する'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('lookup'); setOtp(''); clearError(); }}
            className="mt-3 w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            最初からやり直す
          </button>
        </form>
      )}

      {/* Step 3: 退会確認 */}
      {step === 'confirm' && (
        <form onSubmit={handleWithdraw} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">退会内容の確認</h3>

          <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">退会方式</span>
              <span className="font-medium text-slate-800">年度末退会（自動計算）</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">適用タイミング</span>
              <span className="font-medium text-slate-800">当年度末 3月31日</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">マイページ利用</span>
              <span className="font-medium text-slate-800">退会予定日まで可能</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">取消</span>
              <span className="font-medium text-slate-800">会員マイページから年度末前まで可能</span>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-amber-600"
              checked={confirmed}
              onChange={e => { setConfirmed(e.target.checked); clearError(); }}
              required
            />
            <span className="text-sm text-slate-700">
              上記の内容を確認し、退会を申し込むことに同意します。
            </span>
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => { clearError(); setConfirmed(false); setStep('otp'); }}
              className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              ← 戻る
            </button>
            <button
              type="submit"
              disabled={busy || !confirmed}
              className="flex-1 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {busy ? '送信中...' : '退会を申し込む'}
            </button>
          </div>
        </form>
      )}

      {/* Step 4: 完了 */}
      {step === 'complete' && (
        <div className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">
            ✓
          </div>
          <h3 className="text-xl font-bold text-slate-900">退会申請を受け付けました</h3>
          {withdrawnDate && (
            <p className="mt-3 text-sm font-semibold text-amber-700">
              退会予定日: {withdrawnDate.replace(/-/g, '/')}
            </p>
          )}
          <p className="mt-2 text-sm leading-7 text-slate-600">
            ご登録のメールアドレスに確認メールをお送りしました。<br />
            退会予定日まで会員マイページをご利用いただけます。<br />
            退会を取り消す場合は会員マイページからお手続きください。
          </p>
          <button
            onClick={onBack}
            className="mt-6 rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            ポータルトップへ戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequestForm;
