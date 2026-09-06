import React, { useState } from 'react';
import { callApi } from '../../shared/api-base';
import { IdentityVerifyStep, type IdentityPayload } from './IdentityVerifyStep';
import type { PublicIdentityMemberType } from '../../shared/publicIdentity';

interface Props {
  onBack: () => void;
}

type MemberType = PublicIdentityMemberType;
type Step = 'member-type' | 'verify' | 'confirm' | 'complete';

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
const req = <span className="text-red-500"> *</span>;

const WithdrawalRequestForm: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>('member-type');
  const [memberType, setMemberType] = useState<MemberType>('INDIVIDUAL');
  const [token, setToken] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  const handleSelectType = (t: MemberType) => {
    setMemberType(t);
    setStep('verify');
    clearError();
  };

  const handleVerify = async (payload: IdentityPayload) => {
    setBusy(true);
    clearError();
    try {
      const res = await callApi<{ verified: boolean; token: string; error?: string }>(
        'verifyMemberIdentityForPublic', { ...payload, purpose: 'withdrawal' });
      if (!res.verified) {
        setError(res.error || '入力内容と一致する会員情報が見つかりませんでした。');
        return;
      }
      setToken(res.token);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '確認に失敗しました。');
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
      const res = await callApi<{ success: boolean; requestId?: string; error?: string }>('submitPublicChangeRequest', {
        token,
        requestType: 'WITHDRAWAL',
        fields: {},
        staffAdd: [],
        staffRemove: [],
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

  const stepLabels = ['会員種別', '本人確認', '退会確認', '完了'];
  const stepIndex = (['member-type', 'verify', 'confirm', 'complete'] as Step[]).indexOf(step);

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-amber-700 hover:underline">
        ← ポータルトップへ戻る
      </button>
      <h2 className="mb-2 text-2xl font-bold text-slate-900">退会を申し込む</h2>
      <p className="mb-6 text-sm text-slate-600">
        ご本人確認の後、退会申請を送信します。担当者が内容を確認後に処理します。
        退会は当年度末（3月31日）に適用されます。
      </p>

      {/* ステップインジケーター */}
      <nav aria-label="手続きの進行状況" className="mb-8">
        <ol className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < stepIndex ? 'bg-amber-500 text-white' :
                i === stepIndex ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' :
                'bg-slate-100 text-slate-400'}`}
                aria-current={i === stepIndex ? 'step' : undefined}>
                {i < stepIndex ? '✓' : i + 1}
              </span>
              <span className={`hidden text-xs sm:inline ${i === stepIndex ? 'font-semibold text-amber-700' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <span className="mx-1 text-slate-300" aria-hidden>›</span>}
            </li>
          ))}
        </ol>
      </nav>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1-2: 会員種別選択と本人確認（登録情報変更と共通） */}
      {step === 'member-type' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">退会前にご確認ください</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-700">
            <li>退会は当年度末（3月31日）に適用されます</li>
            <li>退会予定日までは会員マイページをご利用いただけます</li>
            <li>退会を取り消す場合は会員マイページからお手続きください</li>
          </ul>
        </div>
      )}

      {(step === 'member-type' || step === 'verify') && (
        <IdentityVerifyStep
          purpose="withdrawal"
          step={step}
          memberType={memberType}
          busy={busy}
          error={error}
          onSelectType={handleSelectType}
          onBackToTypeSelect={() => { setStep('member-type'); clearError(); }}
          onSubmit={handleVerify}
        />
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
            <div className="flex justify-between">
              <span className="text-slate-500">承認</span>
              <span className="font-medium text-slate-800">管理者が申請を確認後に反映</span>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-amber-600"
              checked={confirmed} onChange={e => { setConfirmed(e.target.checked); clearError(); }} required />
            <span className="text-sm text-slate-700">
              上記の内容を確認し、退会を申し込むことに同意します。
            </span>
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => { clearError(); setConfirmed(false); setStep('verify'); }}
              className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400">
              ← 戻る
            </button>
            <button type="submit" disabled={busy || !confirmed}
              className="flex-1 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300">
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
          <p className="mt-3 text-sm leading-7 text-slate-600">
            ご入力の返信用メールアドレスに受付確認をお送りしました。<br />
            担当者が申請を確認後に処理いたします。<br />
            退会予定日まで会員マイページをご利用いただけます。<br />
            退会を取り消す場合は会員マイページからお手続きください。
          </p>
          <button onClick={onBack}
            className="mt-6 rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-amber-700">
            ポータルトップへ戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequestForm;
