import React, { useRef, useState } from 'react';
import { useRevealOnChange } from '../../shared/useRevealOnChange';
import { PublicTraining, ExternalApplyPayload } from '../../shared/types';
import { callApi } from '../../shared/api-base';

interface Props {
  training: PublicTraining;
  onSuccess: (applyId: string) => void;
  onCancel: () => void;
  /** プライバシーポリシーの掲載先。空ならリンクを出さない（設定: T_システム設定）。 */
  privacyPolicyUrl?: string;
}

const CONSENT_ERROR = '個人情報の取り扱いへの同意が必要です。';

const ExternalApplyForm: React.FC<Props> = ({ training, onSuccess, onCancel, privacyPolicyUrl }) => {
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [careManagerNumber, setCareManagerNumber] = useState('');
  const askMemberNumber = training.askMemberNumber === true;
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // ラベルと入力欄を結び付ける id（見えているだけでは支援技術に名前が伝わらない）
  const uid = React.useId();
  // エラーはフォームの上に出るが「申込する」は下にあるため、出たら見える位置へ移す
  const errorRef = useRef<HTMLDivElement>(null);
  useRevealOnChange(error, errorRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError(CONSENT_ERROR);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: ExternalApplyPayload = {
        trainingId: training.id,
        name,
        furigana,
        email,
        phone,
        officeName,
        // 尋ねない研修では送らない（サーバーも受け取らない）
        careManagerNumber: askMemberNumber ? careManagerNumber : '',
        consent,
        honeypot,
      };
      const result = await callApi<{ applyId: string }>('applyTrainingExternal', payload);
      onSuccess(result.applyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || '申込に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-1">研修申込</h2>
      <p className="text-sm text-gray-600 mb-4">{training.name}</p>

      <div className="bg-primary-50 border border-primary-100 rounded p-3 mb-4 text-sm text-primary-900">
        収集した個人情報は研修申込の受付・確認連絡{askMemberNumber && '・会員かどうかの確認'}のみに使用します。第三者への提供は行いません。
        {privacyPolicyUrl && (
          <>
            {' '}詳しくは
            <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-violet-700">
              プライバシーポリシー
            </a>
            をご確認ください。
          </>
        )}
      </div>

      {error && (
        <div ref={errorRef} id={`${uid}-error`} tabIndex={-1} role="alert" className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700 focus:outline-none">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot フィールド（ボット対策・非表示） */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-name`} className="block text-sm font-medium text-gray-700 mb-1">
            氏名 <span className="text-red-500">*</span>
          </label>
          <input
            id={`${uid}-name`}
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="山田 太郎"
          />
        </div>

        {/* 2026-10-18 BR-21: 会員と非会員で扱いが違う研修だけ尋ねる。照合の結果はここには出さない */}
        {askMemberNumber && (
          <div>
            <label htmlFor={`${uid}-cmNumber`} className="block text-sm font-medium text-gray-700 mb-1">
              介護支援専門員番号（会員の方）
            </label>
            <input
              id={`${uid}-cmNumber`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              value={careManagerNumber}
              onChange={(e) => setCareManagerNumber(e.target.value)}
              aria-describedby={`${uid}-cmNumber-help`}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="12345678"
            />
            <p id={`${uid}-cmNumber-help`} className="mt-1 text-xs text-gray-500">
              会員の方は、登録している氏名と介護支援専門員番号を入力してください。空欄の場合は非会員としてお受けします。
            </p>
          </div>
        )}

        <div>
          <label htmlFor={`${uid}-furigana`} className="block text-sm font-medium text-gray-700 mb-1">
            フリガナ
          </label>
          <input
            id={`${uid}-furigana`}
            type="text"
            maxLength={100}
            value={furigana}
            onChange={(e) => setFurigana(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="ヤマダ タロウ（任意）"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-email`} className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            id={`${uid}-email`}
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="example@example.com"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-phone`} className="block text-sm font-medium text-gray-700 mb-1">
            電話番号 <span className="text-red-500">*</span>
          </label>
          <input
            id={`${uid}-phone`}
            type="tel"
            required
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="072-000-0000"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-officeName`} className="block text-sm font-medium text-gray-700 mb-1">
            事業所名
          </label>
          <input
            id={`${uid}-officeName`}
            type="text"
            maxLength={100}
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="（任意）"
          />
        </div>

        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={error === CONSENT_ERROR}
              aria-describedby={error === CONSENT_ERROR ? `${uid}-error` : undefined}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-700">
              上記の個人情報の取り扱いに同意します（必須）
            </span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            戻る
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? '送信中...' : '申込する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExternalApplyForm;
