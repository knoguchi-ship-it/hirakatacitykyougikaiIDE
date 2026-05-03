/**
 * OfficerStatusCard — 役員ステータスと振込口座の自己登録カード（会員マイページ用）
 *
 * - 役員でない会員には表示しない（isOfficer=false ならレンダリングなし）
 * - 役員の場合: 現在の役職一覧 + 振込口座の確認・登録・編集
 * - sessionToken は api シングルトンが自動付与（呼び出し元は意識不要）
 */
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import ClaimCard from './ClaimCard';
import {
  BankAccount,
  MemberActiveRole,
  MemberOfficerStatus,
  SaveBankAccountPayload,
} from '../shared/types';

// ── バリデーション ───────────────────────────────────────────────────────────

type BankFormFields = Omit<SaveBankAccountPayload, 'memberId'>;
type BankFormErrors = Partial<Record<keyof BankFormFields, string>>;

function validateKana(v: string): boolean {
  return /^[ァ-ヶー\s　]+$/.test(v);
}

function validateBankForm(f: BankFormFields): BankFormErrors {
  const errs: BankFormErrors = {};
  if (!f.bankName.trim())
    errs.bankName = '金融機関名は必須です。';
  else if (f.bankName.trim().length > 50)
    errs.bankName = '50文字以内で入力してください。';

  if (!f.bankCode.trim())
    errs.bankCode = '金融機関コードは必須です。';
  else if (!/^\d{4}$/.test(f.bankCode.trim()))
    errs.bankCode = '4桁の半角数字で入力してください。';

  if (!f.branchName.trim())
    errs.branchName = '支店名は必須です。';
  else if (f.branchName.trim().length > 50)
    errs.branchName = '50文字以内で入力してください。';

  if (!f.branchCode.trim())
    errs.branchCode = '支店コードは必須です。';
  else if (!/^\d{3}$/.test(f.branchCode.trim()))
    errs.branchCode = '3桁の半角数字で入力してください。';

  if (!f.accountType)
    errs.accountType = '口座種別を選択してください。';

  if (!f.accountNumber.trim())
    errs.accountNumber = '口座番号は必須です。';
  else if (!/^\d{1,7}$/.test(f.accountNumber.trim()))
    errs.accountNumber = '1〜7桁の半角数字で入力してください。';

  if (!f.accountHolderKana.trim())
    errs.accountHolderKana = '口座名義カナは必須です。';
  else if (!validateKana(f.accountHolderKana.trim()))
    errs.accountHolderKana = '全角カタカナで入力してください（例: ヤマダ タロウ）。';
  else if (f.accountHolderKana.trim().length > 30)
    errs.accountHolderKana = '30文字以内で入力してください。';

  return errs;
}

const BLANK: BankFormFields = {
  bankName: '', bankCode: '', branchName: '', branchCode: '',
  accountType: '普通', accountNumber: '', accountHolderKana: '', note: '',
};

function formFromAccount(acc: BankAccount): BankFormFields {
  return {
    bankName: acc.金融機関名 ?? '',
    bankCode: acc.金融機関コード ?? '',
    branchName: acc.支店名 ?? '',
    branchCode: acc.支店コード ?? '',
    accountType: acc.口座種別 || '普通',
    accountNumber: acc.口座番号 ?? '',
    accountHolderKana: acc.口座名義カナ ?? '',
    note: acc.備考 ?? '',
  };
}

// ── スタイル定数 ──────────────────────────────────────────────────────────────

const fieldCls = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const fieldErrCls = 'w-full rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400';
const fi = (e?: string) => (e ? fieldErrCls : fieldCls);

const btnPrimary = 'rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50';
const btnSec = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50';

const ACCOUNT_TYPES = ['普通', '当座', '貯蓄'];

// ── メインコンポーネント ──────────────────────────────────────────────────────

const OfficerStatusCard: React.FC = () => {
  const [status, setStatus] = useState<MemberOfficerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const s = await api.getMyOfficerStatus();
      setStatus(s);
    } catch (e: any) {
      setLoadError(e?.message || '役員ステータスの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ローディング中・エラー・役員でない場合は非表示
  if (loading || loadError || !status?.isOfficer) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* カードヘッダー */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h2 className="text-lg font-bold text-slate-800">役員情報</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* 役職一覧 */}
        <RoleList roles={status.activeRoles} />

        {/* 振込口座 */}
        <BankAccountSection
          initialAccount={status.bankAccount}
          onSaved={(updated) => setStatus(s => s ? { ...s, bankAccount: updated } : s)}
        />

        <hr className="border-slate-200" />

        {/* 請求 */}
        <ClaimCard activeRoles={status.activeRoles} />
      </div>
    </div>
  );
};

// ── 役職一覧サブコンポーネント ────────────────────────────────────────────────

const RoleList: React.FC<{ roles: MemberActiveRole[] }> = ({ roles }) => (
  <div>
    <h3 className="mb-3 text-sm font-semibold text-slate-700">現在の役職</h3>
    {roles.length === 0 ? (
      <p className="text-sm text-slate-400">現職の役職はありません。</p>
    ) : (
      <ul className="space-y-2">
        {roles.map(r => (
          <li
            key={r.officerId}
            className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{r.roleName}</p>
              <p className="text-xs text-slate-500">
                {r.organizationName}
                {r.appointedDate && <span className="ml-2">就任日: {r.appointedDate}</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// ── 振込口座サブコンポーネント ────────────────────────────────────────────────

const BankAccountSection: React.FC<{
  initialAccount: BankAccount | null;
  onSaved: (updated: BankAccount) => void;
}> = ({ initialAccount, onSaved }) => {
  const [account, setAccount] = useState<BankAccount | null>(initialAccount);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<BankFormFields>(BLANK);
  const [errors, setErrors] = useState<BankFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const openEdit = () => {
    setForm(account ? formFromAccount(account) : BLANK);
    setErrors({});
    setServerError(null);
    setSuccess(false);
    setFormVisible(true);
  };

  const handleSave = async () => {
    const errs = validateBankForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setServerError(null);
    try {
      await api.saveMyBankAccount({
        bankName: form.bankName.trim(),
        bankCode: form.bankCode.trim(),
        branchName: form.branchName.trim(),
        branchCode: form.branchCode.trim(),
        accountType: form.accountType,
        accountNumber: form.accountNumber.trim(),
        accountHolderKana: form.accountHolderKana.trim(),
        note: form.note.trim(),
      });
      // 保存後は画面表示用に楽観的更新（実際の口座IDは不要）
      const updated: BankAccount = {
        口座ID: account?.口座ID ?? '',
        会員ID: '',
        金融機関名: form.bankName.trim(),
        金融機関コード: form.bankCode.trim(),
        支店名: form.branchName.trim(),
        支店コード: form.branchCode.trim(),
        口座種別: form.accountType,
        口座番号: form.accountNumber.trim(),
        口座名義カナ: form.accountHolderKana.trim(),
        備考: form.note.trim(),
        削除フラグ: false,
        作成日時: account?.作成日時 ?? '',
        更新日時: new Date().toISOString(),
      };
      setAccount(updated);
      onSaved(updated);
      setFormVisible(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setServerError(e?.message || '保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const Field: React.FC<{ label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }> = ({
    label, required, hint, error, children,
  }) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-0.5 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">振込口座情報</h3>
        {!formVisible && (
          <button type="button" onClick={openEdit} className={btnPrimary}>
            {account ? '口座情報を変更' : '口座を登録する'}
          </button>
        )}
      </div>

      {/* 保存成功メッセージ */}
      {success && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700" role="status">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          口座情報を保存しました。
        </div>
      )}

      {/* 登録済み口座表示 */}
      {!formVisible && account && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ['金融機関', `${account.金融機関名}（${account.金融機関コード}）`],
            ['支店', `${account.支店名}（${account.支店コード}）`],
            ['口座種別', account.口座種別],
            ['口座番号', account.口座番号],
            ['口座名義カナ', account.口座名義カナ],
            ...(account.備考 ? [['備考', account.備考]] : []),
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* 未登録 */}
      {!formVisible && !account && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-6 text-center">
          <p className="text-sm text-slate-500">振込口座がまだ登録されていません。</p>
          <p className="mt-1 text-xs text-slate-400">役員報酬や活動費のお支払いに使用します。</p>
        </div>
      )}

      {/* 入力フォーム */}
      {formVisible && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">
            {account ? '振込口座情報を変更' : '振込口座を登録'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="金融機関名" required error={errors.bankName}>
              <input
                value={form.bankName}
                onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                maxLength={50}
                placeholder="例: ゆうちょ銀行"
                aria-describedby={errors.bankName ? 'err-bankName' : undefined}
                className={fi(errors.bankName)}
              />
            </Field>

            <Field
              label="金融機関コード（4桁）"
              required
              hint="半角数字4桁で入力してください。"
              error={errors.bankCode}
            >
              <input
                value={form.bankCode}
                onChange={e => setForm(f => ({ ...f, bankCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                maxLength={4}
                placeholder="例: 9900"
                inputMode="numeric"
                className={fi(errors.bankCode)}
              />
            </Field>

            <Field label="支店名" required error={errors.branchName}>
              <input
                value={form.branchName}
                onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
                maxLength={50}
                placeholder="例: 四〇八支店"
                className={fi(errors.branchName)}
              />
            </Field>

            <Field
              label="支店コード（3桁）"
              required
              hint="半角数字3桁で入力してください。"
              error={errors.branchCode}
            >
              <input
                value={form.branchCode}
                onChange={e => setForm(f => ({ ...f, branchCode: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                maxLength={3}
                placeholder="例: 408"
                inputMode="numeric"
                className={fi(errors.branchCode)}
              />
            </Field>

            <Field label="口座種別" required error={errors.accountType}>
              <select
                value={form.accountType}
                onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}
                className={fi(errors.accountType)}
              >
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field
              label="口座番号（7桁以内）"
              required
              hint="半角数字で入力してください（例: 1234567）。"
              error={errors.accountNumber}
            >
              <input
                value={form.accountNumber}
                onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 7) }))}
                maxLength={7}
                placeholder="例: 1234567"
                inputMode="numeric"
                className={fi(errors.accountNumber)}
              />
            </Field>

            <Field
              label="口座名義カナ"
              required
              hint="全角カタカナで入力してください（例: ヤマダ タロウ）。30文字以内。"
              error={errors.accountHolderKana}
            >
              <input
                value={form.accountHolderKana}
                onChange={e => setForm(f => ({ ...f, accountHolderKana: e.target.value }))}
                maxLength={30}
                placeholder="例: ヒラカタ ハナコ"
                lang="ja"
                className={fi(errors.accountHolderKana)}
              />
            </Field>

            <Field label="備考">
              <input
                value={form.note ?? ''}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                maxLength={200}
                placeholder="任意（銀行への特記事項など）"
                className={fieldCls}
              />
            </Field>
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? '保存中…' : '保存する'}
            </button>
            <button
              type="button"
              onClick={() => { setFormVisible(false); setErrors({}); setServerError(null); }}
              className={btnSec}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerStatusCard;
