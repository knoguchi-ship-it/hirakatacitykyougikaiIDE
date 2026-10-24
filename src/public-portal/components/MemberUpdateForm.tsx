import React, { useEffect, useMemo, useRef, useState } from 'react';
import { callApi } from '../../shared/api-base';
import MasterOptionList from '../../components/MasterOptionList';
import { IdentityVerifyStep, type IdentityPayload } from './IdentityVerifyStep';
import { publicIdentityErrorMessage, type PublicIdentityMemberType } from '../../shared/publicIdentity';
import { normalizeKana } from '../../utils/kanaNormalize';
// 入力書式の正本（AGENTS §3）。ここで独自に正規表現を書かない —
// v376.101 は MemberForm が独自のカナ正規表現を持っていたせいで賛助会員が保存できなくなった。
import { CARE_MANAGER_NO_PATTERN, EMAIL_PATTERN } from '../../shared/validators';
// 勤務先なしの判定・予約語の正本（docs/spec/02_RD.md §479）
import { NO_OFFICE_AFFILIATION_LABEL } from '../../shared/officeAffiliation';

interface Props {
  onBack: () => void;
}

type MemberType = PublicIdentityMemberType;
type Step = 'member-type' | 'verify' | 'select-fields' | 'input-fields' | 'complete';

// ── フィールドグループ定義 ─────────────────────────────────────────────────────

type FieldGroup =
  | 'name'            // 氏・名・フリガナ
  | 'contact'         // メール・携帯電話
  // 2026-10-02: 勤務先住所をここへ統合した。別グループだと「名称だけ変えて住所は前職のまま」
  // という行が作れてしまう（v376.107 で直した「前職の名称 ＋ 現職の住所」の裏返し）。
  | 'officeContact'   // 勤務先: 事業所名・電話・FAX・住所
  | 'homeAddress'     // 自宅住所
  | 'careManagerNumber' // CM番号（ログインIDに影響）
  | 'mailingPreference'
  | 'preferredMailDestination'
  | 'officeBasic'     // 事業所基本情報（名称・メール・電話・FAX）
  | 'bizAddress'      // 事業所住所
  | 'officeNumber'    // 事業所番号（ログインIDに影響）
  | 'staffAdd'        // 職員追加
  | 'staffRemove'     // 職員除籍
  | 'staffUpdate';    // v372.5: 既存職員情報の変更

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

// 2026-10-13: 公開ポータルは登録済みの個人情報を一切表示しない（operator 判断）。
// 除籍・情報変更の対象職員は、申請者が「今の氏名と介護支援専門員番号」を入力して特定する。
// サーバは一致したかどうかだけを返す（checkPublicStaffMatch）。
type StaffMatchState = 'idle' | 'checking' | 'matched' | 'unmatched';
interface StaffIdentity {
  lastName: string;
  firstName: string;
  careManagerNumber: string;
  match: StaffMatchState;
}
const EMPTY_STAFF_IDENTITY: StaffIdentity = { lastName: '', firstName: '', careManagerNumber: '', match: 'idle' };
const staffIdentityFilled = (s: StaffIdentity) =>
  !!s.lastName.trim() || !!s.firstName.trim() || !!s.careManagerNumber.trim();
const staffIdentityComplete = (s: StaffIdentity) =>
  !!s.lastName.trim() && !!s.firstName.trim() && CARE_MANAGER_NO_PATTERN.test(s.careManagerNumber);

/** 職員追加カードの 6 項目がそろっているか（サーバの受付条件と同じ） */
const staffAddComplete = (c: StaffAddCard) =>
  !!c.lastName.trim() && !!c.firstName.trim() && !!c.lastKana.trim() && !!c.firstKana.trim()
  && CARE_MANAGER_NO_PATTERN.test(c.careManagerNumber) && EMAIL_PATTERN.test(c.email.trim());

type StaffRemoveCard = StaffIdentity;
const EMPTY_STAFF_REMOVE: StaffRemoveCard = { ...EMPTY_STAFF_IDENTITY };

// v372.5: 既存職員情報の変更カード。特定（StaffIdentity）→ 変更する項目を選ぶ → 変更後の値を入力。
type StaffUpdateField = 'name' | 'kana' | 'email' | 'careManagerNumber';
const STAFF_UPDATE_FIELDS: { key: StaffUpdateField; label: string }[] = [
  { key: 'name', label: '氏名' },
  { key: 'kana', label: 'フリガナ' },
  { key: 'email', label: 'メールアドレス' },
  { key: 'careManagerNumber', label: '介護支援専門員番号' },
];
interface StaffUpdateCard extends StaffIdentity {
  changes: StaffUpdateField[];
  // 変更後の値（選んだ項目だけ使う）
  newLastName: string;
  newFirstName: string;
  newLastKana: string;
  newFirstKana: string;
  newEmail: string;
  newCareManagerNumber: string;
}
const EMPTY_STAFF_UPDATE: StaffUpdateCard = {
  ...EMPTY_STAFF_IDENTITY, changes: [],
  newLastName: '', newFirstName: '', newLastKana: '', newFirstKana: '', newEmail: '', newCareManagerNumber: '',
};
/** 選んだ項目のうち、変更後の値が入っているもの（空欄は送らない） */
function staffUpdateEntry(c: StaffUpdateCard): Record<string, string> {
  const e: Record<string, string> = {};
  const has = (k: StaffUpdateField) => c.changes.includes(k);
  if (has('name') && c.newLastName.trim()) e.lastName = c.newLastName.trim();
  if (has('name') && c.newFirstName.trim()) e.firstName = c.newFirstName.trim();
  if (has('kana') && c.newLastKana.trim()) e.lastKana = normalizeKana(c.newLastKana);
  if (has('kana') && c.newFirstKana.trim()) e.firstKana = normalizeKana(c.newFirstKana);
  if (has('email') && c.newEmail.trim()) e.email = c.newEmail.trim();
  if (has('careManagerNumber') && CARE_MANAGER_NO_PATTERN.test(c.newCareManagerNumber)) e.careManagerNumber = c.newCareManagerNumber;
  return e;
}
/** docs/307 F22（2026-10-24）: 選んだのに空欄・形式違いの項目。以前は黙って送信から外していた */
function staffUpdateProblems(c: StaffUpdateCard): string[] {
  const out: string[] = [];
  const has = (k: StaffUpdateField) => c.changes.includes(k);
  if (has('name') && (!c.newLastName.trim() || !c.newFirstName.trim())) out.push('変更後の氏名');
  if (has('kana') && (!c.newLastKana.trim() || !c.newFirstKana.trim())) out.push('変更後のフリガナ');
  if (has('email') && !EMAIL_PATTERN.test(c.newEmail.trim())) out.push('変更後のメールアドレス');
  if (has('careManagerNumber') && !CARE_MANAGER_NO_PATTERN.test(c.newCareManagerNumber)) out.push('変更後の介護支援専門員番号（8 桁の半角数字）');
  return out;
}

interface IndividualFields {
  lastName: string; firstName: string; lastKana: string; firstKana: string;
  email: string; mobilePhone: string;
  officeName: string;
  noOffice: boolean;   // 「現在は勤務していない」
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
  officeName: '', noOffice: false,
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
// v372.6: 「空欄=変更なし」モデルに統一。required 属性 + * マークを除去し、
// プレースホルダーを「例:」プレフィックス統一。グローバルガイダンス参照。
const AddressInput: React.FC<{
  label: string; value: AddressValue; onChange: (v: AddressValue) => void;
}> = ({ label, value, onChange }) => {
  const fid = React.useId();
  const up = (f: keyof AddressValue) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [f]: e.target.value });
  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">{label}</legend>
      <div><label htmlFor={`${fid}-postCode`} className={labelClass}>郵便番号</label>
        <input id={`${fid}-postCode`} type="text" value={value.postCode} onChange={up('postCode')} placeholder="例: 123-4567" maxLength={8} className={inputClass} /></div>
      <div><label htmlFor={`${fid}-prefecture`} className={labelClass}>都道府県</label>
        <input id={`${fid}-prefecture`} type="text" value={value.prefecture} onChange={up('prefecture')} placeholder="例: 大阪府" maxLength={10} className={inputClass} /></div>
      <div><label htmlFor={`${fid}-city`} className={labelClass}>市区町村</label>
        <input id={`${fid}-city`} type="text" value={value.city} onChange={up('city')} placeholder="例: 枚方市" className={inputClass} /></div>
      <div><label htmlFor={`${fid}-addressLine`} className={labelClass}>番地</label>
        <input id={`${fid}-addressLine`} type="text" value={value.addressLine} onChange={up('addressLine')} placeholder="例: ○○町1-2-3" className={inputClass} /></div>
      <div><label htmlFor={`${fid}-addressLine2`} className={labelClass}>建物名・部屋番号</label>
        <input id={`${fid}-addressLine2`} type="text" value={value.addressLine2} onChange={up('addressLine2')} placeholder="例: ○○ビル101" className={inputClass} /></div>
    </fieldset>
  );
};

// ── ステップインジケーター ─────────────────────────────────────────────────────
// 職員の特定欄（今の氏名と介護支援専門員番号 ＋ 照合ボタン）。除籍と情報変更で共通。
// 照合結果は「一致した／しない」だけを示す。登録内容は表示しない。
const StaffIdentityFields: React.FC<{
  value: StaffIdentity;
  onChange: (patch: Partial<StaffIdentity>) => void;
  onCheck: () => void;
}> = ({ value, onChange, onCheck }) => {
  const id = React.useId();
  return (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor={`${id}-last`} className={labelClass}>氏（姓）{req}</label>
        <input id={`${id}-last`} type="text" value={value.lastName} onChange={e => onChange({ lastName: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${id}-first`} className={labelClass}>名{req}</label>
        <input id={`${id}-first`} type="text" value={value.firstName} onChange={e => onChange({ firstName: e.target.value })} className={inputClass} />
      </div>
    </div>
    <div>
      <label htmlFor={`${id}-cm`} className={labelClass}>介護支援専門員番号{req}</label>
      <input id={`${id}-cm`} type="text" inputMode="numeric" pattern="\d{8}" maxLength={8} value={value.careManagerNumber}
        onChange={e => onChange({ careManagerNumber: e.target.value.replace(/\D/g, '') })} className={inputClass} />
      <p className="mt-1 text-xs text-slate-500">半角数字8桁</p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={onCheck}
        disabled={!staffIdentityComplete(value) || value.match === 'checking' || value.match === 'matched'}
        className="min-h-[44px] rounded-full border border-violet-300 bg-white px-5 text-sm font-medium text-violet-700 transition hover:border-violet-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
        {value.match === 'checking' ? '照合中...' : '職員を照合する'}
      </button>
      <span aria-live="polite" className="text-sm">
        {value.match === 'matched' && <span className="font-semibold text-green-700">✓ 在籍職員と一致しました</span>}
        {value.match === 'unmatched' && (
          <span className="text-red-700">一致する在籍職員が見つかりません。氏名と番号を確かめてください。</span>
        )}
      </span>
    </div>
  </div>
  );
};

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
  // ラベルと入力欄を結び付ける id の接頭辞（支援技術が項目名を読めるように）
  const uid = React.useId();
  const [step, setStep] = useState<Step>('member-type');
  const [memberType, setMemberType] = useState<MemberType>('INDIVIDUAL');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);
  // 2026-10-13: エラーは画面上端に出る。スマホ幅で下端の送信ボタンを押すと見えなかったため、
  // 出たときに画面内へ移してフォーカスを当てる（支援技術にも届く）。
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error || !errorRef.current) return;
    errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    errorRef.current.focus({ preventScroll: true });
  }, [error]);

  // verify 入力
  const [cmNumber, setCmNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [officeNumber, setOfficeNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // フィールド選択
  const [selected, setSelected] = useState<Set<FieldGroup>>(new Set());
  // 退職（勤務なし）を選んでいる間は、連絡先と自宅住所を外させない。
  // 外せると入力欄が消え、必須の値を入れられないまま送信しようとして詰まる。
  const [indNoOffice, setIndNoOffice] = useState(false);
  const toggle = (g: FieldGroup) => setSelected(prev => {
    if (indNoOffice && (g === 'contact' || g === 'homeAddress') && prev.has(g)) return prev;
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });

  // 個人会員フィールド値
  const [indFields, setIndFields] = useState<IndividualFields>(INITIAL_INDIVIDUAL);
  // 事業所会員フィールド値
  const [bizFields, setBizFields] = useState<BusinessFields>(INITIAL_BUSINESS);
  // スタッフ追加カード（上限は承認時に事務局が確かめる。在籍人数は公開ポータルに出さない）
  const [staffAddCards, setStaffAddCards] = useState<StaffAddCard[]>([{ ...EMPTY_STAFF_ADD }]);
  // スタッフ除籍カード
  const [staffRemoveCards, setStaffRemoveCards] = useState<StaffRemoveCard[]>([{ ...EMPTY_STAFF_REMOVE }]);
  // v372.5: 職員情報変更カード（2026-10-13: 一覧は出さず、今の氏名と番号で特定する）
  const [staffUpdateCards, setStaffUpdateCards] = useState<StaffUpdateCard[]>([{ ...EMPTY_STAFF_UPDATE }]);

  // ── Step 1: 会員種別選択 ─────────────────────────────────────────────────────
  const handleSelectType = (t: MemberType) => {
    setMemberType(t);
    setSelected(new Set());
    setStep('verify');
    clearError();
  };

  // ── Step 2: 本人確認 ─────────────────────────────────────────────────────────
  const handleVerify = async (payload: IdentityPayload) => {
    setBusy(true);
    clearError();
    try {
      const res = await callApi<{ verified: boolean; token: string; error?: string }>(
        'verifyMemberIdentityForPublic', { ...payload, purpose: 'update' });
      if (!res.verified) {
        setError(publicIdentityErrorMessage(res.error));
        return;
      }
      setToken(res.token);
      setStep('select-fields');
    } catch (err) {
      setError(publicIdentityErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3 → Step 4: フィールド選択確定 ─────────────────────────────────────
  // 2026-10-13: 以前はここで在籍職員一覧と追加可能人数を取得していた。登録内容を返さない方針で廃止。
  const handleSelectConfirm = () => {
    if (selected.size === 0) { setError('変更する項目を1つ以上選択してください。'); return; }
    clearError();
    setStep('input-fields');
  };

  // 職員の照合。返ってくるのは一致したかどうかだけ。
  const checkStaffMatch = async (who: StaffIdentity): Promise<StaffMatchState> => {
    const expired = 'セッションの有効期限が切れました（30分）。最初からやり直してください。';
    try {
      const res = await callApi<{ matched?: boolean; error?: string }>('checkPublicStaffMatch', {
        token, lastName: who.lastName.trim(), firstName: who.firstName.trim(), careManagerNumber: who.careManagerNumber,
      });
      if (res.error) {
        setError(res.error === 'token_expired' ? expired : res.error);
        return 'idle';
      }
      return res.matched ? 'matched' : 'unmatched';
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg === 'token_expired' ? expired : '照合できませんでした。時間をおいてもう一度お試しください。');
      return 'idle';
    }
  };
  const runRemoveMatch = async (idx: number) => {
    const card = staffRemoveCards[idx];
    if (!card || !staffIdentityComplete(card)) return;
    clearError();
    setStaffRemoveCards((cards) => cards.map((c, i) => i === idx ? { ...c, match: 'checking' } : c));
    const result = await checkStaffMatch(card);
    setStaffRemoveCards((cards) => cards.map((c, i) => i === idx ? { ...c, match: result } : c));
  };
  const runUpdateMatch = async (idx: number) => {
    const card = staffUpdateCards[idx];
    if (!card || !staffIdentityComplete(card)) return;
    clearError();
    setStaffUpdateCards((cards) => cards.map((c, i) => i === idx ? { ...c, match: 'checking' } : c));
    const result = await checkStaffMatch(card);
    setStaffUpdateCards((cards) => cards.map((c, i) => i === idx ? { ...c, match: result } : c));
  };
  // 照合済みのあとで氏名・番号を書き換えたら、照合をやり直してもらう。
  const patchRemoveIdentity = (idx: number, patch: Partial<StaffIdentity>) =>
    setStaffRemoveCards((cards) => cards.map((c, i) => i === idx ? { ...c, ...patch, match: 'idle' } : c));
  const patchUpdateIdentity = (idx: number, patch: Partial<StaffIdentity>) =>
    setStaffUpdateCards((cards) => cards.map((c, i) => i === idx ? { ...c, ...patch, match: 'idle' } : c));
  const patchUpdateCard = (idx: number, patch: Partial<StaffUpdateCard>) =>
    setStaffUpdateCards((cards) => cards.map((c, i) => i === idx ? { ...c, ...patch } : c));

  // 入力を始めたのに済んでいない職員カード（送信前に止める）。
  // 2026-10-13: 職員追加カードは、途中まで入力したものが申請から**黙って外れていた**
  // （送信時の絞り込みで落ちる）。申請者は追加を申請したつもりになるため、ここで名指しして止める。
  const pendingStaffCards = useMemo(() => {
    if (memberType !== 'BUSINESS') return [] as string[];
    const out: string[] = [];
    if (selected.has('staffAdd')) {
      staffAddCards.forEach((c, i) => {
        const filled = !!(c.lastName.trim() || c.firstName.trim() || c.lastKana.trim() || c.firstKana.trim() || c.careManagerNumber.trim() || c.email.trim());
        if (filled && !staffAddComplete(c)) out.push('追加職員 ' + (i + 1) + '：未入力または形式が正しくない項目があります');
      });
    }
    if (selected.has('staffRemove')) {
      staffRemoveCards.forEach((c, i) => { if (staffIdentityFilled(c) && c.match !== 'matched') out.push('除籍する職員 ' + (i + 1) + '：照合が済んでいません'); });
    }
    if (selected.has('staffUpdate')) {
      staffUpdateCards.forEach((c, i) => {
        if (staffIdentityFilled(c) && c.match !== 'matched') out.push('変更する職員 ' + (i + 1) + '：照合が済んでいません');
        const bad = c.match === 'matched' ? staffUpdateProblems(c) : [];
        if (bad.length) out.push('変更する職員 ' + (i + 1) + '：' + bad.join('・') + 'を確かめてください');
      });
    }
    return out;
  }, [memberType, selected, staffAddCards, staffRemoveCards, staffUpdateCards]);

  // ── Step 4 → 送信 ────────────────────────────────────────────────────────────
  // v372.6: 変更内容ゼロを send 前に検出（送信ボタン disable に使う）
  // 個人会員と賛助会員は入力欄の構成が同じ（賛助は CM番号を持たないだけ）。
  // ここを memberType === 'INDIVIDUAL' で書くと賛助会員の入力が拾われない。
  const isPersonType = memberType !== 'BUSINESS';

  // 退職（勤務なし）を選ぶと、勤務先の電話を消し郵送先を自宅へ切り替える。
  // サーバはそのとき次を必須にする（gas-src の validateMemberPayload_）:
  //   - 勤務先電話番号または携帯電話番号のどちらか  → 勤務先を消すので携帯が要る
  //   - 郵送先＝自宅なら 自宅の 〒・都道府県・市区町村・番地
  // 連絡先メールはサーバ必須ではないが、勤務先が無くなると連絡手段が携帯とメールだけに
  // なるため必須にする（operator 判断・2026-10-02）。
  //
  // **ここで止めないと、管理者に「承認できない申請」が届く。** 承認時に落ちると
  // 申請は PENDING のまま残り、会員へ連絡して出し直してもらうことになる。
  const retirementMissing = useMemo(() => {
    if (!isPersonType || !selected.has('officeContact') || !indFields.noOffice) return [];
    const missing: string[] = [];
    if (!indFields.mobilePhone.trim()) missing.push('携帯電話番号');
    if (!indFields.email.trim()) missing.push('連絡先メールアドレス');
    const a = indFields.homeAddress;
    if (!a.postCode.trim()) missing.push('自宅の郵便番号');
    if (!a.prefecture.trim()) missing.push('自宅の都道府県');
    if (!a.city.trim()) missing.push('自宅の市区町村');
    if (!a.addressLine.trim()) missing.push('自宅の番地');
    return missing;
  }, [isPersonType, selected, indFields]);

  // 空白だけの入力は受け付けない（operator 判断・2026-10-02）。
  // 空欄は「現在の登録内容を据え置く」意味なので、空白だけの入力も結果は同じ据え置きになる。
  // ただし本人は「入力した」つもりでいるため、黙って無視せず名指しで差し戻す。
  const blankOnlyFields = useMemo(() => {
    const blankOnly = (v: string) => v !== '' && v.trim() === '';
    const found: string[] = [];
    const check = (label: string, v: string) => { if (blankOnly(v)) found.push(label); };
    const checkAddress = (prefix: string, a: AddressValue) => {
      check(prefix + 'の郵便番号', a.postCode);
      check(prefix + 'の都道府県', a.prefecture);
      check(prefix + 'の市区町村', a.city);
      check(prefix + 'の番地', a.addressLine);
      check(prefix + 'の建物名', a.addressLine2);
    };
    if (isPersonType) {
      if (selected.has('name')) {
        check('姓', indFields.lastName); check('名', indFields.firstName);
        check('フリガナ（氏）', indFields.lastKana); check('フリガナ（名）', indFields.firstKana);
      }
      if (selected.has('contact')) {
        check('連絡先メールアドレス', indFields.email); check('携帯電話番号', indFields.mobilePhone);
      }
      if (selected.has('officeContact') && !indFields.noOffice) {
        check('事業所名', indFields.officeName);
        check('勤務先電話番号', indFields.phone); check('勤務先FAX番号', indFields.fax);
        checkAddress('勤務先住所', indFields.officeAddress);
      }
      if (selected.has('homeAddress')) checkAddress('自宅住所', indFields.homeAddress);
      if (selected.has('careManagerNumber')) check('介護支援専門員番号', indFields.careManagerNumber);
    }
    if (memberType === 'BUSINESS') {
      if (selected.has('officeBasic')) {
        check('事業所名', bizFields.officeName); check('メールアドレス', bizFields.email);
        check('電話番号', bizFields.phone); check('FAX番号', bizFields.fax);
      }
      if (selected.has('bizAddress')) checkAddress('事業所住所', bizFields.bizAddress);
      if (selected.has('officeNumber')) check('事業所番号', bizFields.officeNumber);
    }
    return found;
  }, [memberType, isPersonType, selected, indFields, bizFields]);

  // 事業所名を入力したのに、勤務先の電話・FAX・住所を空欄のまま出そうとしている項目。
  // 公開ポータルは会員データを返さないため「変更前の事業所名」を知らない。
  // そこで「事業所名を入力した＝勤務先を変えるつもり」と見なし、据え置きになる項目を
  // 送信前に読み上げて確認してもらう（必須にはしない。正式名称へ直すだけの用途があるため）。
  const officeCarryOver = useMemo(() => {
    if (!isPersonType || !selected.has('officeContact')) return [];
    if (indFields.noOffice || !indFields.officeName.trim()) return [];
    const a = indFields.officeAddress;
    const carry: string[] = [];
    if (!indFields.phone.trim()) carry.push('勤務先電話番号');
    if (!indFields.fax.trim()) carry.push('勤務先FAX番号');
    if (!a.postCode.trim()) carry.push('勤務先の郵便番号');
    if (!a.prefecture.trim()) carry.push('勤務先の都道府県');
    if (!a.city.trim()) carry.push('勤務先の市区町村');
    if (!a.addressLine.trim()) carry.push('勤務先の番地');
    return carry;
  }, [isPersonType, selected, indFields]);

  const [confirmCarryOver, setConfirmCarryOver] = useState(false);

  const hasAnyInput = useMemo(() => {
    // 個人会員・賛助会員
    if (isPersonType) {
      if (selected.has('name') && (indFields.lastName.trim() || indFields.firstName.trim() || indFields.lastKana.trim() || indFields.firstKana.trim())) return true;
      if (selected.has('contact') && (indFields.email.trim() || indFields.mobilePhone.trim())) return true;
      if (selected.has('officeContact')) {
        const a = indFields.officeAddress;
        if (indFields.noOffice || indFields.officeName.trim() || indFields.phone.trim() || indFields.fax.trim()) return true;
        if (a.postCode.trim() || a.prefecture.trim() || a.city.trim() || a.addressLine.trim() || a.addressLine2.trim()) return true;
      }
      if (selected.has('homeAddress')) {
        const a = indFields.homeAddress;
        if (a.postCode.trim() || a.prefecture.trim() || a.city.trim() || a.addressLine.trim() || a.addressLine2.trim()) return true;
      }
      if (selected.has('careManagerNumber') && indFields.careManagerNumber.trim()) return true;
      if (selected.has('mailingPreference') && indFields.mailingPreference.trim()) return true;
      if (selected.has('preferredMailDestination') && indFields.preferredMailDestination.trim()) return true;
    }
    // 事業所会員
    if (memberType === 'BUSINESS') {
      if (selected.has('officeBasic') && (bizFields.officeName.trim() || bizFields.email.trim() || bizFields.phone.trim() || bizFields.fax.trim())) return true;
      if (selected.has('bizAddress')) {
        const a = bizFields.bizAddress;
        if (a.postCode.trim() || a.prefecture.trim() || a.city.trim() || a.addressLine.trim() || a.addressLine2.trim()) return true;
      }
      if (selected.has('officeNumber') && bizFields.officeNumber.trim()) return true;
      if (selected.has('staffAdd') && staffAddCards.some(staffAddComplete)) return true;
      if (selected.has('staffRemove') && staffRemoveCards.some((c) => c.match === 'matched')) return true;
      if (selected.has('staffUpdate') && staffUpdateCards.some((c) => c.match === 'matched' && Object.keys(staffUpdateEntry(c)).length > 0)) return true;
    }
    return false;
  }, [memberType, isPersonType, selected, indFields, bizFields, staffAddCards, staffRemoveCards, staffUpdateCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ボタンの disabled だけに頼らない（Enter キー・支援技術・将来の改修）。
    if (retirementMissing.length > 0) {
      setError('退職（勤務なし）の手続きには ' + retirementMissing.join('・') + ' の入力が必要です。');
      return;
    }
    if (pendingStaffCards.length > 0) {
      setError('入力が済んでいない職員カードがあります（' + pendingStaffCards.join('・')
        + '）。使わないカードは、削除するか入力を消してください。');
      return;
    }
    if (blankOnlyFields.length > 0) {
      setError('空白だけが入力されている項目があります（' + blankOnlyFields.join('・')
        + '）。変更後の内容を入力するか、空欄にしてください。空欄の項目は現在の登録内容のまま変わりません。');
      return;
    }
    // 勤務先を変えるのに住所・電話が空欄のまま。据え置きでよいか確認してから送る。
    if (officeCarryOver.length > 0) {
      clearError();
      setConfirmCarryOver(true);
      return;
    }
    await doSubmit();
  };

  const doSubmit = async () => {
    setConfirmCarryOver(false);
    setBusy(true);
    clearError();
    try {
      const fields: Record<string, string> = {};
      if (isPersonType) {
        if (selected.has('name')) {
          if (indFields.lastName) fields.lastName = indFields.lastName;
          if (indFields.firstName) fields.firstName = indFields.firstName;
          // v376: kana 列を全角カタカナに正規化
          if (indFields.lastKana) fields.lastKana = normalizeKana(indFields.lastKana);
          if (indFields.firstKana) fields.firstKana = normalizeKana(indFields.firstKana);
        }
        if (selected.has('contact')) {
          if (indFields.email) fields.email = indFields.email;
          if (indFields.mobilePhone) fields.mobilePhone = indFields.mobilePhone;
        }
        if (selected.has('officeContact')) {
          if (indFields.noOffice) {
            // 退職した人。勤務先の連絡先も残さない。
            // 郵送先が勤務先のままだと宛名が「勤務なし」の郵便が出るため、自宅へ寄せる
            // （サーバ側 saveMemberCore_ もこの組み合わせを拒否する）。
            // 勤務先の電話・FAX・住所はここで消さない。承認は空文字を適用しないので、
            // 空文字を送っても消えなかった（2026-10-02 に発覚）。勤務先名が「勤務なし」なら
            // サーバの saveMemberCore_ が不変条件として消す。
            fields.officeName = NO_OFFICE_AFFILIATION_LABEL;
            fields.preferredMailDestination = 'HOME';
          } else {
            // 空欄＝現在の登録内容を据え置く（サーバの承認も空文字は適用しない）。
            // 空白だけの入力は trim すると空になるので、ここでは据え置き扱いになる。
            // 「空白だけ」をそのまま通さないのは blankOnlyFields が送信前に弾くため。
            if (indFields.officeName.trim()) fields.officeName = indFields.officeName.trim();
            if (indFields.phone.trim()) fields.phone = indFields.phone.trim();
            if (indFields.fax.trim()) fields.fax = indFields.fax.trim();
            const a = indFields.officeAddress;
            if (a.postCode.trim()) fields.officePostCode = a.postCode.trim();
            if (a.prefecture.trim()) fields.officePrefecture = a.prefecture.trim();
            if (a.city.trim()) fields.officeCity = a.city.trim();
            if (a.addressLine.trim()) fields.officeAddressLine = a.addressLine.trim();
            if (a.addressLine2.trim()) fields.officeAddressLine2 = a.addressLine2.trim();
          }
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
        ? staffAddCards
            .filter(staffAddComplete)
            // v376: kana 列を全角カタカナに正規化
            .map(c => ({ ...c, lastKana: normalizeKana(c.lastKana), firstKana: normalizeKana(c.firstKana) }))
        : [];
      const staffRemove = (selected.has('staffRemove') && memberType === 'BUSINESS')
        ? staffRemoveCards.filter((c) => c.match === 'matched')
            .map((c) => ({ lastName: c.lastName.trim(), firstName: c.firstName.trim(), careManagerNumber: c.careManagerNumber }))
        : [];
      // v372.5: 職員情報変更 — 照合できた職員について、選んだ項目の変更後の値だけ送る。
      // 対象は target（今の氏名・番号）で示し、職員IDはサーバが引く。
      const staffUpdate = (selected.has('staffUpdate') && memberType === 'BUSINESS')
        ? staffUpdateCards
            .filter((c) => c.match === 'matched')
            .map((c) => ({
              target: { lastName: c.lastName.trim(), firstName: c.firstName.trim(), careManagerNumber: c.careManagerNumber },
              ...staffUpdateEntry(c),
            }))
            .filter((e) => Object.keys(e).length > 1) // target 以外に何か変更がある場合のみ
        : [];

      // v372.6 fix: 全空チェック（フロント側でも弾く・WCAG SC 3.3.1/3.3.3 inline validation）
      const hasAnyChange =
        Object.keys(fields).length > 0 ||
        staffAdd.length > 0 ||
        staffRemove.length > 0 ||
        staffUpdate.length > 0;
      if (!hasAnyChange) {
        setError('変更したい項目を 1 つ以上入力してください。空欄のままでは申請できません。');
        setBusy(false);
        return;
      }

      const res = await callApi<{ success: boolean; requestId?: string; error?: string }>('submitPublicChangeRequest', {
        token,
        requestType: 'MEMBER_UPDATE',
        fields,
        staffAdd,
        staffRemove,
        staffUpdate,
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
    // 2026-10-01: 勤務先名をここへ入れた。別グループにすると、転職した人が
    // 「名称」と「電話」を別々にチェックして片方を忘れる。
    // 2026-10-02: 住所も同じ理由でここへ統合した（旧「勤務先住所」グループは廃止）。
    { key: 'officeContact' as FieldGroup, label: '勤務先（事業所）', desc: '事業所名・電話番号・FAX番号・住所' },
    { key: 'homeAddress' as FieldGroup, label: '自宅住所', desc: '〒・都道府県・市区町村・番地・建物名' },
    { key: 'careManagerNumber' as FieldGroup, label: '介護支援専門員番号', desc: '' },
    { key: 'mailingPreference' as FieldGroup, label: '通知方法', desc: 'メール通知 / 郵送通知の切り替え' },
    { key: 'preferredMailDestination' as FieldGroup, label: '郵送先区分', desc: '勤務先宛 / 自宅宛の切り替え' },
  ];
  const BUSINESS_GROUPS = [
    { key: 'officeBasic' as FieldGroup, label: '事業所基本情報', desc: '名称・メール・電話・FAX' },
    { key: 'bizAddress' as FieldGroup, label: '事業所住所', desc: '〒・都道府県・市区町村・番地・建物名' },
    { key: 'officeNumber' as FieldGroup, label: '事業所番号', desc: '' },
    { key: 'staffAdd' as FieldGroup, label: '職員を追加する', desc: '追加する職員の氏名・フリガナ・介護支援専門員番号・メールを入力します' },
    { key: 'staffRemove' as FieldGroup, label: '職員を除籍する', desc: '氏名と介護支援専門員番号で職員を照合します' },
    { key: 'staffUpdate' as FieldGroup, label: '職員情報を変更する', desc: '氏名と介護支援専門員番号で職員を照合し、変更する項目を選びます（HN・HS 等の特殊な番号の職員は事務局へご連絡ください）' },
  ];
  // 賛助会員は個人会員と同じ構成から、持っていない介護支援専門員番号だけを外す。
  // 「INDIVIDUAL 以外＝事業所」と書くと賛助会員に職員追加の欄が出てしまう。
  const SUPPORT_GROUPS = INDIVIDUAL_GROUPS.filter(g => g.key !== 'careManagerNumber');
  const groups = memberType === 'BUSINESS'
    ? BUSINESS_GROUPS
    : memberType === 'SUPPORT' ? SUPPORT_GROUPS : INDIVIDUAL_GROUPS;

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

      {/* 本人確認の段では IdentityVerifyStep がボタンの直前に同じエラーを出す。ここでも出すと二重表示になり、
          上へスクロールさせると入力欄から目線が離れるため、その段では上の枠を出さない（退会申込と同じ扱い）。 */}
      {error && step !== 'verify' && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-line focus:outline-none">
          {error}
        </div>
      )}

      {/* Step 1-2: 会員種別選択と本人確認（退会申込と共通） */}
      {(step === 'member-type' || step === 'verify') && (
        <IdentityVerifyStep
          purpose="update"
          step={step}
          memberType={memberType}
          busy={busy}
          error={error}
          onSelectType={handleSelectType}
          onBackToTypeSelect={() => { setStep('member-type'); clearError(); }}
          onSubmit={handleVerify}
        />
      )}

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
          {/* v372.6: 「空欄=変更なし」モデルを強調するガイダンスバナー */}
          <div className="mb-5 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900" role="note">
            <p className="font-semibold mb-1">📝 変更したい項目のみ入力してください</p>
            <ul className="ml-5 list-disc text-xs leading-relaxed">
              <li><strong>空欄 = 変更なし</strong>（現在の登録内容がそのまま維持されます）</li>
              <li>少なくとも 1 項目以上の入力が必要です（全て空欄のままでは送信できません）</li>
              <li>空白（スペース）だけの入力は受け付けません。変更しない項目は空欄にしてください</li>
              <li>職員追加 / 職員除籍欄は、追加・除籍を行う場合のみ全項目入力してください</li>
            </ul>
          </div>
          <div className="space-y-6">
            {/* ── 個人会員フィールド ──────────────────────────────────── */}
            {isPersonType && (
              <>
                {selected.has('name') && (
                  <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-slate-700">氏名</legend>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`${uid}-ind-lastName`} className={labelClass}>氏（姓）</label>
                        <input id={`${uid}-ind-lastName`} type="text" value={indFields.lastName}
                          onChange={e => setIndFields(f => ({ ...f, lastName: e.target.value }))}
                          placeholder="" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-ind-firstName`} className={labelClass}>名</label>
                        <input id={`${uid}-ind-firstName`} type="text" value={indFields.firstName}
                          onChange={e => setIndFields(f => ({ ...f, firstName: e.target.value }))}
                          placeholder="" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-ind-lastKana`} className={labelClass}>フリガナ（氏）</label>
                        <input id={`${uid}-ind-lastKana`} type="text" value={indFields.lastKana}
                          onChange={e => setIndFields(f => ({ ...f, lastKana: e.target.value }))}
                          placeholder="" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-ind-firstKana`} className={labelClass}>フリガナ（名）</label>
                        <input id={`${uid}-ind-firstKana`} type="text" value={indFields.firstKana}
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
                      <label htmlFor={`${uid}-ind-email`} className={labelClass}>メールアドレス</label>
                      <input id={`${uid}-ind-email`} type="email" value={indFields.email}
                        onChange={e => setIndFields(f => ({ ...f, email: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-ind-mobilePhone`} className={labelClass}>携帯電話番号</label>
                      <input id={`${uid}-ind-mobilePhone`} type="tel" value={indFields.mobilePhone}
                        onChange={e => setIndFields(f => ({ ...f, mobilePhone: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                  </fieldset>
                )}
                {selected.has('officeContact') && (
                  <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-slate-700">勤務先（事業所）</legend>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-violet-600"
                        checked={indFields.noOffice}
                        onChange={e => {
                          const checked = e.target.checked;
                          setIndFields(f => ({ ...f, noOffice: checked }));
                          setIndNoOffice(checked);
                          // 郵送先が自宅へ切り替わるので、自宅住所の入力欄を出しておく。
                          // 自宅住所が未登録のまま承認すると「自宅郵便番号が必須です」で
                          // 承認が落ちる。会員側は自分の登録状況を見られない（公開ポータルは
                          // 会員データを返さない）ので、ここで入力の機会を作る。
                          // 既に登録済みなら空欄のままでよい（空欄＝変更なし）。
                          if (checked) setSelected(prev => new Set(prev).add('homeAddress').add('contact'));
                        }} />
                      <span>
                        <span className="text-sm font-medium text-slate-800">現在は勤務していない</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          退職された場合はこちら。勤務先の情報を消し、郵送先を自宅へ切り替えます。
                          自宅住所の入力欄を下に表示しますので、<strong>未登録の方はご入力ください</strong>
                          （登録済みであれば空欄のままで構いません）。
                        </span>
                      </span>
                    </label>
                    <div>
                      <label htmlFor={`${uid}-ind-officeName`} className={labelClass}>事業所名</label>
                      <input id={`${uid}-ind-officeName`} type="text" value={indFields.officeName} disabled={indFields.noOffice}
                        onChange={e => setIndFields(f => ({ ...f, officeName: e.target.value }))}
                        placeholder="例: ひらかた介護ステーション"
                        className={indFields.noOffice ? inputClass + ' bg-slate-100 text-slate-400' : inputClass} />
                      <p className="mt-1 text-xs text-slate-500">
                        転職された場合は、下の電話番号・住所もあわせてご入力ください。
                      </p>
                    </div>
                    <div>
                      <label htmlFor={`${uid}-ind-phone`} className={labelClass}>勤務先電話番号</label>
                      <input id={`${uid}-ind-phone`} type="tel" value={indFields.phone} disabled={indFields.noOffice}
                        onChange={e => setIndFields(f => ({ ...f, phone: e.target.value }))}
                        placeholder="" className={indFields.noOffice ? inputClass + ' bg-slate-100 text-slate-400' : inputClass} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-ind-fax`} className={labelClass}>勤務先FAX番号</label>
                      <input id={`${uid}-ind-fax`} type="tel" value={indFields.fax} disabled={indFields.noOffice}
                        onChange={e => setIndFields(f => ({ ...f, fax: e.target.value }))}
                        placeholder="" className={indFields.noOffice ? inputClass + ' bg-slate-100 text-slate-400' : inputClass} />
                    </div>
                    {!indFields.noOffice && (
                      <AddressInput label="勤務先住所" value={indFields.officeAddress}
                        onChange={a => setIndFields(f => ({ ...f, officeAddress: a }))} />
                    )}
                  </fieldset>
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
                    <label htmlFor={`${uid}-ind-careManagerNumber`} className={labelClass}>新しい介護支援専門員番号</label>
                    <input id={`${uid}-ind-careManagerNumber`} type="text" inputMode="numeric" pattern="\d{8}" maxLength={8}
                      value={indFields.careManagerNumber}
                      onChange={e => setIndFields(f => ({ ...f, careManagerNumber: e.target.value.replace(/\D/g, '') }))}
                      placeholder="" className={inputClass} />
                    <p className="mt-1 text-xs text-slate-500">半角数字8桁</p>
                  </div>
                )}
                {selected.has('mailingPreference') && (
                  <div>
                    <label htmlFor={`${uid}-ind-mailingPreference`} className={labelClass}>通知方法</label>
                    <select id={`${uid}-ind-mailingPreference`} value={indFields.mailingPreference}
                      onChange={e => setIndFields(f => ({ ...f, mailingPreference: e.target.value }))}
                      className={inputClass}>
                      <option value="">-- 選択してください --</option>
                      <MasterOptionList master="M_発送方法" />
                    </select>
                  </div>
                )}
                {selected.has('preferredMailDestination') && (
                  <div>
                    <label htmlFor={`${uid}-ind-preferredMailDestination`} className={labelClass}>郵送先区分</label>
                    <select id={`${uid}-ind-preferredMailDestination`} value={indFields.preferredMailDestination}
                      onChange={e => setIndFields(f => ({ ...f, preferredMailDestination: e.target.value }))}
                      className={inputClass}>
                      <option value="">-- 選択してください --</option>
                      <MasterOptionList master="M_郵送先区分" />
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
                      <label htmlFor={`${uid}-biz-officeName`} className={labelClass}>事業所名</label>
                      <input id={`${uid}-biz-officeName`} type="text" value={bizFields.officeName}
                        onChange={e => setBizFields(f => ({ ...f, officeName: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-biz-email`} className={labelClass}>メールアドレス</label>
                      <input id={`${uid}-biz-email`} type="email" value={bizFields.email}
                        onChange={e => setBizFields(f => ({ ...f, email: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-biz-phone`} className={labelClass}>電話番号</label>
                      <input id={`${uid}-biz-phone`} type="tel" value={bizFields.phone}
                        onChange={e => setBizFields(f => ({ ...f, phone: e.target.value }))}
                        placeholder="" className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-biz-fax`} className={labelClass}>FAX番号</label>
                      <input id={`${uid}-biz-fax`} type="tel" value={bizFields.fax}
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
                    <label htmlFor={`${uid}-biz-officeNumber`} className={labelClass}>新しい事業所番号</label>
                    <input id={`${uid}-biz-officeNumber`} type="text" value={bizFields.officeNumber}
                      onChange={e => setBizFields(f => ({ ...f, officeNumber: e.target.value.trim() }))}
                      placeholder="" className={inputClass} />
                  </div>
                )}

                {/* 職員追加カード */}
                {selected.has('staffAdd') && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">職員追加</h4>
                    <p className="mb-4 text-xs text-slate-500">
                      追加する職員の情報をすべて入力してください。空欄のカードは無視されます。
                      事業所の職員数の上限を超える場合は、事務局の確認で差し戻しとなります。
                    </p>
                    <div className="space-y-4">
                      {staffAddCards.map((card, idx) => (
                        <fieldset key={idx} className="rounded-lg border border-violet-200 p-4 bg-violet-50">
                          <legend className="px-1 text-xs font-semibold text-violet-700">追加職員 {idx + 1}</legend>
                          <div className="mt-2 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label htmlFor={`${uid}-add-${idx}-lastName`} className={labelClass}>氏（姓）{req}</label>
                                <input id={`${uid}-add-${idx}-lastName`} type="text" value={card.lastName}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, lastName: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                              <div>
                                <label htmlFor={`${uid}-add-${idx}-firstName`} className={labelClass}>名{req}</label>
                                <input id={`${uid}-add-${idx}-firstName`} type="text" value={card.firstName}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, firstName: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                              <div>
                                <label htmlFor={`${uid}-add-${idx}-lastKana`} className={labelClass}>フリガナ（氏）{req}</label>
                                <input id={`${uid}-add-${idx}-lastKana`} type="text" value={card.lastKana}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, lastKana: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                              <div>
                                <label htmlFor={`${uid}-add-${idx}-firstKana`} className={labelClass}>フリガナ（名）{req}</label>
                                <input id={`${uid}-add-${idx}-firstKana`} type="text" value={card.firstKana}
                                  onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, firstKana: e.target.value } : c))}
                                  placeholder="" className={inputClass} />
                              </div>
                            </div>
                            <div>
                              <label htmlFor={`${uid}-add-${idx}-careManagerNumber`} className={labelClass}>介護支援専門員番号{req}</label>
                              <input id={`${uid}-add-${idx}-careManagerNumber`} type="text" inputMode="numeric" pattern="\d{8}" maxLength={8}
                                value={card.careManagerNumber}
                                onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, careManagerNumber: e.target.value.replace(/\D/g, '') } : c))}
                                placeholder="" className={inputClass} />
                              <p className="mt-1 text-xs text-slate-500">半角数字8桁</p>
                            </div>
                            <div>
                              <label htmlFor={`${uid}-add-${idx}-email`} className={labelClass}>メールアドレス{req}</label>
                              <input id={`${uid}-add-${idx}-email`} type="email" value={card.email}
                                onChange={e => setStaffAddCards(cards => cards.map((c, i) => i === idx ? { ...c, email: e.target.value } : c))}
                                placeholder="" className={inputClass} />
                            </div>
                          </div>
                          {staffAddCards.length > 1 && (
                            <button type="button"
                              onClick={() => setStaffAddCards(cards => cards.filter((_, i) => i !== idx))}
                              className="mt-3 text-xs text-red-600 hover:underline">
                              このカードを削除
                            </button>
                          )}
                        </fieldset>
                      ))}
                      <button type="button"
                        onClick={() => setStaffAddCards(cards => [...cards, { ...EMPTY_STAFF_ADD }])}
                        className="w-full rounded-lg border-2 border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400">
                        + 追加する職員を増やす
                      </button>
                    </div>
                  </div>
                )}

                {/* 職員除籍カード */}
                {selected.has('staffRemove') && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">職員除籍</h4>
                    <p className="mb-4 text-xs text-slate-500">
                      除籍する職員の氏・名・介護支援専門員番号を入力し、「職員を照合する」を押してください。
                      一致した職員だけが申請に含まれます。
                    </p>
                    <div className="space-y-3">
                      {staffRemoveCards.map((card, idx) => (
                        <fieldset key={idx} className="rounded-lg border border-amber-200 p-4 bg-amber-50">
                          <legend className="px-1 text-xs font-semibold text-amber-700">除籍する職員 {idx + 1}</legend>
                          <div className="mt-2">
                            <StaffIdentityFields value={card}
                              onChange={(patch) => patchRemoveIdentity(idx, patch)}
                              onCheck={() => { void runRemoveMatch(idx); }} />
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
                        + 除籍する職員を増やす
                      </button>
                    </div>
                  </div>
                )}

                {/* v372.5: 職員情報変更（2026-10-13: 一覧は出さず、今の氏名と番号で特定する） */}
                {selected.has('staffUpdate') && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">職員情報の変更</h4>
                    <p className="mb-4 text-xs text-slate-500">
                      変更したい職員の氏・名・介護支援専門員番号を入力して照合し、一致したら変更する項目を選んで変更後の内容を入力してください。
                      HN・HS 等の特殊な番号の職員は、事務局へご連絡ください。
                    </p>
                    <div className="space-y-3">
                      {staffUpdateCards.map((card, idx) => {
                        const has = (k: StaffUpdateField) => card.changes.includes(k);
                        const toggleChange = (k: StaffUpdateField) => patchUpdateCard(idx, {
                          changes: has(k) ? card.changes.filter((x) => x !== k) : [...card.changes, k],
                        });
                        return (
                          <fieldset key={idx} className={`rounded-lg border p-4 ${card.match === 'matched' ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'}`}>
                            <legend className="px-1 text-xs font-semibold text-slate-700">変更する職員 {idx + 1}</legend>
                            <div className="mt-2 space-y-4">
                              <StaffIdentityFields value={card}
                                onChange={(patch) => patchUpdateIdentity(idx, patch)}
                                onCheck={() => { void runUpdateMatch(idx); }} />
                              {card.match === 'matched' && (
                                <div className="space-y-3 border-t border-violet-200 pt-4">
                                  <p className="text-sm font-medium text-slate-700">変更する項目</p>
                                  <div className="flex flex-wrap gap-x-5">
                                    {STAFF_UPDATE_FIELDS.map((f) => (
                                      <label key={f.key} className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={has(f.key)} onChange={() => toggleChange(f.key)} />
                                        {f.label}
                                      </label>
                                    ))}
                                  </div>
                                  {has('name') && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label htmlFor={`staff-update-${idx}-newLastName`} className={labelClass}>新しい氏（姓）<span className="text-xs text-slate-400">（空欄=変更なし）</span></label>
                                        <input id={`staff-update-${idx}-newLastName`} type="text" value={card.newLastName} onChange={(e) => patchUpdateCard(idx, { newLastName: e.target.value })} className={inputClass} />
                                      </div>
                                      <div>
                                        <label htmlFor={`staff-update-${idx}-newFirstName`} className={labelClass}>新しい名<span className="text-xs text-slate-400">（空欄=変更なし）</span></label>
                                        <input id={`staff-update-${idx}-newFirstName`} type="text" value={card.newFirstName} onChange={(e) => patchUpdateCard(idx, { newFirstName: e.target.value })} className={inputClass} />
                                      </div>
                                    </div>
                                  )}
                                  {has('kana') && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label htmlFor={`staff-update-${idx}-newLastKana`} className={labelClass}>新しいフリガナ（姓）<span className="text-xs text-slate-400">（空欄=変更なし）</span></label>
                                        <input id={`staff-update-${idx}-newLastKana`} type="text" value={card.newLastKana} onChange={(e) => patchUpdateCard(idx, { newLastKana: e.target.value })} className={inputClass} />
                                      </div>
                                      <div>
                                        <label htmlFor={`staff-update-${idx}-newFirstKana`} className={labelClass}>新しいフリガナ（名）<span className="text-xs text-slate-400">（空欄=変更なし）</span></label>
                                        <input id={`staff-update-${idx}-newFirstKana`} type="text" value={card.newFirstKana} onChange={(e) => patchUpdateCard(idx, { newFirstKana: e.target.value })} className={inputClass} />
                                      </div>
                                    </div>
                                  )}
                                  {has('email') && (
                                    <div>
                                      <label htmlFor={`staff-update-${idx}-newEmail`} className={labelClass}>新しいメールアドレス</label>
                                      <input id={`staff-update-${idx}-newEmail`} type="email" value={card.newEmail} onChange={(e) => patchUpdateCard(idx, { newEmail: e.target.value })} className={inputClass} />
                                    </div>
                                  )}
                                  {has('careManagerNumber') && (
                                    <div>
                                      <label htmlFor={`staff-update-${idx}-newCareManagerNumber`} className={labelClass}>新しい介護支援専門員番号</label>
                                      <input id={`staff-update-${idx}-newCareManagerNumber`} type="text" inputMode="numeric" pattern="\d{8}" maxLength={8} value={card.newCareManagerNumber}
                                        onChange={(e) => patchUpdateCard(idx, { newCareManagerNumber: e.target.value.replace(/\D/g, '') })} className={inputClass} />
                                      <p className="mt-1 text-xs text-slate-500">半角数字 8 桁</p>
                                      <p className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                                        ⚠ 番号を変更すると、この職員の<strong>会員マイページのログインID</strong>も新しい番号に変わります。
                                        変更後は新しい番号でログインしてください。
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {staffUpdateCards.length > 1 && (
                              <button type="button"
                                onClick={() => setStaffUpdateCards(cards => cards.filter((_, i) => i !== idx))}
                                className="mt-3 text-xs text-red-600 hover:underline">
                                このカードを削除
                              </button>
                            )}
                          </fieldset>
                        );
                      })}
                      <button type="button"
                        onClick={() => setStaffUpdateCards(cards => [...cards, { ...EMPTY_STAFF_UPDATE }])}
                        className="w-full rounded-lg border-2 border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400">
                        + 変更する職員を増やす
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
            <div className="flex-1">
              <button type="submit" disabled={busy || !hasAnyInput || retirementMissing.length > 0 || blankOnlyFields.length > 0 || pendingStaffCards.length > 0}
                aria-disabled={busy || !hasAnyInput || retirementMissing.length > 0 || blankOnlyFields.length > 0 || pendingStaffCards.length > 0}
                title={retirementMissing.length > 0
                  ? '退職（勤務なし）の場合は、連絡先と自宅住所の入力が必要です'
                  : blankOnlyFields.length > 0
                    ? '空白だけが入力されている項目があります'
                    : pendingStaffCards.length > 0
                      ? '入力が済んでいない職員カードがあります'
                      : (!hasAnyInput ? '変更したい項目に入力してください（全て空欄では申請できません）' : '')}
                className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
                {busy ? '送信中...' : '変更を申請する'}
              </button>
              {retirementMissing.length > 0 ? (
                <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">
                  <p className="font-semibold">退職（勤務なし）の手続きには、次の入力が必要です</p>
                  <ul className="mt-1 list-inside list-disc">
                    {retirementMissing.map(label => <li key={label}>{label}</li>)}
                  </ul>
                  <p className="mt-1">
                    勤務先の情報が無くなるため、ご連絡とお届け物の宛先として必要です。
                    すでにご登録済みの内容と同じでも、お手数ですがご入力ください。
                  </p>
                </div>
              ) : blankOnlyFields.length > 0 ? (
                <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">
                  <p className="font-semibold">空白だけが入力されている項目があります</p>
                  <ul className="mt-1 list-inside list-disc">
                    {blankOnlyFields.map(label => <li key={label}>{label}</li>)}
                  </ul>
                  <p className="mt-1">
                    変更後の内容をご入力いただくか、空欄にしてください。
                    空欄の項目は、現在ご登録の内容のまま変わりません。
                  </p>
                </div>
              ) : pendingStaffCards.length > 0 ? (
                <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">
                  <p className="font-semibold">入力が済んでいない職員カードがあります</p>
                  <ul className="mt-1 list-inside list-disc">
                    {pendingStaffCards.map(label => <li key={label}>{label}</li>)}
                  </ul>
                  <p className="mt-1">
                    追加する職員は全項目を入力してください。除籍・変更する職員は「職員を照合する」を押して一致を確かめてください。
                    使わないカードは、削除するか入力を消してください。
                  </p>
                </div>
              ) : !hasAnyInput && (
                <p className="mt-2 text-center text-xs text-slate-500" role="status">
                  変更したい項目に入力すると送信できます
                </p>
              )}
            </div>
          </div>
        </form>
      )}

      {/* 勤務先を変えるのに住所・電話が空欄のとき、据え置きでよいか確認する。
          焦点を奪う useEffect は置かない（v376.33: onClose 依存の effect で入力不能になった）。
          確認ボタンの autoFocus だけで足りる。 */}
      {confirmCarryOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          role="dialog" aria-modal="true" aria-labelledby="carryover-title">
          <div className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="carryover-title" className="text-base font-semibold text-slate-900">
              勤務先の次の項目は、変更されません
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              事業所名を変更されますが、下の項目は空欄のため
              <strong>現在ご登録の内容のまま</strong>になります。
            </p>
            <ul className="mt-3 list-inside list-disc rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {officeCarryOver.map(label => <li key={label}>{label}</li>)}
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              事業所名の表記を直すだけでしたら、このまま申請してください。
              <strong>転職など勤務先そのものが変わった場合</strong>は、戻って住所・電話番号もご入力ください。
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button type="button" autoFocus onClick={() => { void doSubmit(); }}
                className="flex-1 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
                このまま申請する
              </button>
              <button type="button" onClick={() => setConfirmCarryOver(false)}
                className="flex-1 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400">
                戻って入力する
              </button>
            </div>
          </div>
        </div>
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
