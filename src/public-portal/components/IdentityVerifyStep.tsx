/**
 * 公開ポータルの「会員種別の選択」と「本人確認」を担う共通ステップ。
 *
 * 登録情報変更と退会申込が同じことを別々に書いていたため、種別を増やすたびに
 * 2 箇所を直す必要があった（実際に賛助会員がどちらからも漏れていた）。
 * ここに寄せて、画面の見た目も文言も 1 箇所で決まるようにする。
 */
import React, { useState } from 'react';
import {
  PUBLIC_IDENTITY_CREDENTIALS,
  PUBLIC_IDENTITY_NAME_KIND,
  PUBLIC_IDENTITY_TYPE_CARDS,
  normalizeCredentialForKey,
  type PublicIdentityCredentialKey,
  type PublicIdentityMemberType,
} from '../../shared/publicIdentity';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

// Tailwind は静的な文字列しか拾わない。`bg-${tone}-50` のように組み立てると
// クラスが生成されず、無地の画面になる。用途ごとに完成形を持たせる。
const TONE = {
  update: {
    card: 'border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100',
    chipOn: 'border-violet-500 bg-violet-100 font-semibold text-slate-900',
    submit: 'bg-violet-600 hover:bg-violet-700',
  },
  withdrawal: {
    card: 'border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100',
    chipOn: 'border-amber-500 bg-amber-100 font-semibold text-slate-900',
    submit: 'bg-amber-600 hover:bg-amber-700',
  },
} as const;

export interface IdentityPayload {
  memberType: PublicIdentityMemberType;
  contactEmail: string;
  lastName?: string;
  firstName?: string;
  officeName?: string;
  cmNumber?: string;
  officeNumber?: string;
  phone?: string;
  mobilePhone?: string;
}

interface Props {
  /** 'update' か 'withdrawal'。配色と見出しの語をこれで変える。 */
  purpose: 'update' | 'withdrawal';
  /** 種別選択の段か、本人確認の段か。 */
  step: 'member-type' | 'verify';
  memberType: PublicIdentityMemberType;
  busy: boolean;
  error: string | null;
  onSelectType: (t: PublicIdentityMemberType) => void;
  onBackToTypeSelect: () => void;
  onSubmit: (payload: IdentityPayload) => void;
}

export const IdentityVerifyStep: React.FC<Props> = ({
  purpose, step, memberType, busy, error, onSelectType, onBackToTypeSelect, onSubmit,
}) => {
  const tone = TONE[purpose];
  const req = <span className="ml-1 text-xs font-semibold text-rose-600">必須</span>;

  const [name, setName] = useState({ lastName: '', firstName: '', officeName: '' });
  // 照合に使う番号は 1 つだけ選ばせる。複数欄を同時に開けると、どれを入れれば
  // よいのか伝わらず、サーバ側も「ちょうど 1 つ」を要求しているため食い違う。
  const credentials = PUBLIC_IDENTITY_CREDENTIALS[memberType];
  const [credentialKey, setCredentialKey] = useState<PublicIdentityCredentialKey>(credentials[0].key);
  const [credentialValue, setCredentialValue] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const nameKind = PUBLIC_IDENTITY_NAME_KIND[memberType];
  const credential = credentials.find((c) => c.key === credentialKey) ?? credentials[0];
  const nameFilled = nameKind === 'office'
    ? name.officeName.trim() !== ''
    : name.lastName.trim() !== '' && name.firstName.trim() !== '';
  const canSubmit = nameFilled
    && normalizeCredentialForKey(credentialKey, credentialValue) !== ''
    && contactEmail.trim() !== ''
    && !busy;

  const handleSelectType = (t: PublicIdentityMemberType) => {
    // 種別が変わると選べる番号も変わる。前の種別の入力を持ち越さない。
    setCredentialKey(PUBLIC_IDENTITY_CREDENTIALS[t][0].key);
    setCredentialValue('');
    setName({ lastName: '', firstName: '', officeName: '' });
    onSelectType(t);
  };

  if (step === 'member-type') {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-slate-800">会員の種別を選択してください</h3>
        <p className="mb-5 text-sm text-slate-600">
          種別によって、ご本人確認に使える番号が変わります。
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PUBLIC_IDENTITY_TYPE_CARDS.map((card) => (
            <button key={card.type} type="button" onClick={() => handleSelectType(card.type)}
              className={`group flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition ${tone.card}`}>
              <span className="text-3xl" aria-hidden>{card.icon}</span>
              <div>
                <p className="font-bold text-slate-900">{card.label}</p>
                <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const payload: IdentityPayload = { memberType, contactEmail: contactEmail.trim() };
        if (nameKind === 'office') payload.officeName = name.officeName.trim();
        else { payload.lastName = name.lastName.trim(); payload.firstName = name.firstName.trim(); }
        payload[credentialKey] = credentialValue.trim();
        onSubmit(payload);
      }}
      className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="mb-4 text-lg font-semibold text-slate-800">ご本人の確認</h3>
      <p className="mb-5 text-sm text-slate-600">
        ご登録情報と照合します。入力内容は保存されません。
      </p>

      <div className="space-y-4">
        {nameKind === 'office' ? (
          <div>
            <label className={labelClass} htmlFor="iv-office-name">事業所名{req}</label>
            <input id="iv-office-name" type="text" required value={name.officeName}
              onChange={(e) => setName((v) => ({ ...v, officeName: e.target.value }))}
              placeholder="例: ひらかた介護ステーション" className={inputClass} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="iv-last-name">氏（姓）{req}</label>
              <input id="iv-last-name" type="text" required value={name.lastName}
                onChange={(e) => setName((v) => ({ ...v, lastName: e.target.value }))}
                placeholder="例: 山田" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="iv-first-name">名{req}</label>
              <input id="iv-first-name" type="text" required value={name.firstName}
                onChange={(e) => setName((v) => ({ ...v, firstName: e.target.value }))}
                placeholder="例: 太郎" className={inputClass} />
            </div>
          </div>
        )}

        <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">
            ご登録の番号を 1 つ{req}
          </legend>
          <p className="mb-3 text-xs text-slate-500">
            お手元にあるものを 1 つ選んでご入力ください。どれか 1 つで確認できます。
          </p>
          <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="照合に使う番号の種類">
            {credentials.map((c) => (
              <button key={c.key} type="button" role="radio" aria-checked={c.key === credentialKey}
                onClick={() => { setCredentialKey(c.key); setCredentialValue(''); }}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition ${
                  c.key === credentialKey ? tone.chipOn : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
          <label className={labelClass} htmlFor="iv-credential">{credential.label}</label>
          <input id="iv-credential" type="text" required value={credentialValue}
            onChange={(e) => setCredentialValue(e.target.value)}
            placeholder={credential.placeholder} className={inputClass} />
          <p className="mt-1 text-xs text-slate-500">{credential.hint}</p>
        </fieldset>

        <div>
          <label className={labelClass} htmlFor="iv-email">返信用メールアドレス{req}</label>
          <input id="iv-email" type="email" required value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value.trim())}
            placeholder="例: example@email.com" className={inputClass} />
          <p className="mt-1 text-xs text-slate-500">
            申請受付・処理結果の通知に使用します。会員登録情報とは紐づきません。
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onBackToTypeSelect}
          className="min-h-[44px] flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400">
          ← 戻る
        </button>
        <button type="submit" disabled={!canSubmit}
          className={`min-h-[44px] flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${tone.submit}`}>
          {busy ? '確認中...' : '確認して次へ'}
        </button>
      </div>
    </form>
  );
};
