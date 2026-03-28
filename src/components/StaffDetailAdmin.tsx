import React, { useState } from 'react';
import { Staff, StaffRole } from '../types';
import { api } from '../services/api';

interface StaffDetailAdminProps {
  staff?: Staff;
  memberId: string;
  officeName: string;
  onBack: () => void;
  onSaved: () => void;
}

const RequiredMark: React.FC = () => (
  <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>
);

const FieldError: React.FC<{ id: string; message: string }> = ({ id, message }) => {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
};

const roleOptions: { value: StaffRole; label: string }[] = [
  { value: 'REPRESENTATIVE', label: '代表者' },
  { value: 'ADMIN', label: '管理者' },
  { value: 'STAFF', label: '一般職員' },
];

const statusOptions: { value: string; label: string }[] = [
  { value: 'ENROLLED', label: '在籍' },
  { value: 'LEFT', label: '除籍' },
];

const joinNameParts = (lastName: string, firstName: string) => {
  const last = lastName.trim();
  const first = firstName.trim();
  if (last && first) return `${last} ${first}`;
  return last || first;
};

const StaffDetailAdmin: React.FC<StaffDetailAdminProps> = ({ staff, memberId, officeName, onBack, onSaved }) => {
  if (!staff) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm text-primary-600 hover:underline">&larr; 事業所詳細に戻る</button>
        <p className="mt-4 text-slate-500">職員が選択されていません。</p>
      </div>
    );
  }

  const [form, setForm] = useState({
    lastName: staff.lastName || '',
    firstName: staff.firstName || '',
    lastKana: staff.lastKana || '',
    firstKana: staff.firstKana || '',
    email: staff.email || '',
    careManagerNumber: staff.careManagerNumber || '',
    role: staff.role || 'STAFF' as StaffRole,
    status: staff.status || 'ENROLLED',
    joinedDate: staff.joinedDate || '',
    mailingPreference: staff.mailingPreference || 'YES',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [statusConfirmPending, setStatusConfirmPending] = useState<string | null>(null);

  const requiredFields: Record<string, string> = {
    lastName: '姓',
    firstName: '名',
    lastKana: 'セイ',
    firstKana: 'メイ',
    email: 'メールアドレス',
    careManagerNumber: '介護支援専門員番号',
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const validateField = (key: string, value: string): string => {
    if (key in requiredFields && !value.trim()) {
      return `${requiredFields[key]}は必須です`;
    }
    if (key === 'email' && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return 'メールアドレスの形式が正しくありません';
    }
    return '';
  };

  const handleBlur = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const err = validateField(key, (form as Record<string, string>)[key] || '');
    setValidationErrors(prev => ({ ...prev, [key]: err }));
  };

  const validateAll = (): boolean => {
    const allTouched: Record<string, boolean> = {};
    const errors: Record<string, string> = {};
    let valid = true;
    for (const key of Object.keys(requiredFields)) {
      allTouched[key] = true;
      const err = validateField(key, (form as Record<string, string>)[key] || '');
      if (err) {
        errors[key] = err;
        valid = false;
      }
    }

    setTouched(prev => ({ ...prev, ...allTouched }));
    setValidationErrors(errors);
    return valid;
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === form.status) return;
    setStatusConfirmPending(newStatus);
  };

  const confirmStatusChange = () => {
    if (statusConfirmPending) {
      set('status', statusConfirmPending);
      setStatusConfirmPending(null);
    }
  };

  const cancelStatusChange = () => {
    setStatusConfirmPending(null);
  };

  const handleSave = async () => {
    setError(null);
    if (!validateAll()) {
      setError('入力エラーがあります。各項目を確認してください。');
      return;
    }
    setSaving(true);
    try {
      await api.updateStaff({
        staffId: staff.id,
        memberId,
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        lastKana: form.lastKana.trim(),
        firstKana: form.firstKana.trim(),
        name: joinNameParts(form.lastName, form.firstName),
        kana: joinNameParts(form.lastKana, form.firstKana),
        email: form.email.trim(),
        careManagerNumber: form.careManagerNumber.trim(),
        role: form.role,
        status: form.status,
        joinedDate: form.joinedDate,
        mailingPreference: form.mailingPreference,
      });
      onSaved();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const isLeft = form.status === 'LEFT';
  const fieldClass = (hasErr?: boolean) =>
    `w-full border rounded px-3 py-2 text-sm ${hasErr ? 'border-red-500 bg-red-50' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-primary-500`;
  const readOnlyClass = 'w-full border border-slate-200 bg-slate-100 rounded px-3 py-2 text-sm text-slate-500';
  const hasErr = (key: string) => touched[key] && !!validationErrors[key];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <nav aria-label="パンくず">
        <button
          onClick={onBack}
          className="text-sm text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          &larr; 事業所詳細に戻る
        </button>
      </nav>

      <h2 className="text-2xl font-bold text-slate-800">職員詳細編集</h2>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">所属情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">所属事業所</label>
            <input className={readOnlyClass} value={officeName} disabled readOnly />
          </div>
          <div>
            <label htmlFor="staff-role" className="block text-sm font-medium text-slate-700 mb-1">
              職員権限
            </label>
            <select
              id="staff-role"
              className={fieldClass()}
              value={form.role}
              onChange={e => set('role', e.target.value)}
              disabled={isLeft}
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {form.role !== staff.role && staff.role === 'REPRESENTATIVE' && (
              <p className="mt-1 text-xs text-amber-600">
                代表者を変更すると、他の在籍職員から新しい代表者を選ぶ必要があります。
              </p>
            )}
          </div>
          <div>
            <label htmlFor="staff-status" className="block text-sm font-medium text-slate-700 mb-1">
              会員状態
            </label>
            <select
              id="staff-status"
              className={fieldClass()}
              value={form.status}
              onChange={e => handleStatusChange(e.target.value)}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {staff.status === 'LEFT' && staff.withdrawnDate && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">除籍日</label>
              <input className={readOnlyClass} value={staff.withdrawnDate} disabled readOnly />
            </div>
          )}
        </div>
      </div>

      {isLeft && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4" role="status">
          <p className="text-sm text-amber-800 font-medium">
            この職員は除籍済みです。権限はメンバーに固定されており、アカウントは無効化されています。
          </p>
        </div>
      )}

      {statusConfirmPending && (
        <div className="bg-white border-2 border-primary-500 rounded-lg p-4 shadow-md" role="alertdialog" aria-labelledby="status-confirm-title">
          <h4 id="status-confirm-title" className="font-bold text-slate-800 mb-2">状態変更の確認</h4>
          <p className="text-sm text-slate-600 mb-4">
            {statusConfirmPending === 'LEFT'
              ? 'この職員を除籍しますか？ログインアカウントは無効化されます。'
              : 'この職員を在籍に復帰させますか？ログインアカウントが再有効化されます。'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={confirmStatusChange}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusConfirmPending === 'LEFT' ? '除籍する' : '復帰する'}
            </button>
            <button
              onClick={cancelStatusChange}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="staff-last-name" className="block text-sm font-medium text-slate-700 mb-1">
              姓<RequiredMark />
            </label>
            <input
              id="staff-last-name"
              className={fieldClass(hasErr('lastName'))}
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              aria-required="true"
              aria-invalid={hasErr('lastName')}
              aria-describedby={hasErr('lastName') ? 'err-last-name' : undefined}
            />
            <FieldError id="err-last-name" message={touched['lastName'] ? validationErrors['lastName'] || '' : ''} />
          </div>
          <div>
            <label htmlFor="staff-first-name" className="block text-sm font-medium text-slate-700 mb-1">
              名<RequiredMark />
            </label>
            <input
              id="staff-first-name"
              className={fieldClass(hasErr('firstName'))}
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              aria-required="true"
              aria-invalid={hasErr('firstName')}
              aria-describedby={hasErr('firstName') ? 'err-first-name' : undefined}
            />
            <FieldError id="err-first-name" message={touched['firstName'] ? validationErrors['firstName'] || '' : ''} />
          </div>
          <div>
            <label htmlFor="staff-last-kana" className="block text-sm font-medium text-slate-700 mb-1">
              セイ<RequiredMark />
            </label>
            <input
              id="staff-last-kana"
              className={fieldClass(hasErr('lastKana'))}
              value={form.lastKana}
              onChange={e => set('lastKana', e.target.value)}
              onBlur={() => handleBlur('lastKana')}
              aria-required="true"
              aria-invalid={hasErr('lastKana')}
              aria-describedby={hasErr('lastKana') ? 'err-last-kana' : undefined}
            />
            <FieldError id="err-last-kana" message={touched['lastKana'] ? validationErrors['lastKana'] || '' : ''} />
          </div>
          <div>
            <label htmlFor="staff-first-kana" className="block text-sm font-medium text-slate-700 mb-1">
              メイ<RequiredMark />
            </label>
            <input
              id="staff-first-kana"
              className={fieldClass(hasErr('firstKana'))}
              value={form.firstKana}
              onChange={e => set('firstKana', e.target.value)}
              onBlur={() => handleBlur('firstKana')}
              aria-required="true"
              aria-invalid={hasErr('firstKana')}
              aria-describedby={hasErr('firstKana') ? 'err-first-kana' : undefined}
            />
            <FieldError id="err-first-kana" message={touched['firstKana'] ? validationErrors['firstKana'] || '' : ''} />
          </div>
          <div>
            <label htmlFor="staff-email" className="block text-sm font-medium text-slate-700 mb-1">
              メールアドレス<RequiredMark />
            </label>
            <input
              id="staff-email"
              type="email"
              className={fieldClass(hasErr('email'))}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={hasErr('email')}
              aria-describedby={hasErr('email') ? 'err-email' : undefined}
            />
            <FieldError id="err-email" message={touched.email ? validationErrors.email || '' : ''} />
          </div>
          <div>
            <label htmlFor="staff-cm" className="block text-sm font-medium text-slate-700 mb-1">
              介護支援専門員番号<RequiredMark />
            </label>
            <input
              id="staff-cm"
              className={fieldClass(hasErr('careManagerNumber'))}
              value={form.careManagerNumber}
              onChange={e => set('careManagerNumber', e.target.value)}
              onBlur={() => handleBlur('careManagerNumber')}
              aria-required="true"
              aria-invalid={hasErr('careManagerNumber')}
              aria-describedby={hasErr('careManagerNumber') ? 'err-cm' : undefined}
            />
            <FieldError id="err-cm" message={touched.careManagerNumber ? validationErrors.careManagerNumber || '' : ''} />
          </div>
          <div>
            <label htmlFor="staff-joined" className="block text-sm font-medium text-slate-700 mb-1">
              入会日
            </label>
            <input
              id="staff-joined"
              type="date"
              className={fieldClass()}
              value={form.joinedDate}
              onChange={e => set('joinedDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">メールの配信</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="staff-mailing-pref" className="block text-sm font-medium text-slate-700 mb-1">
              メール配信希望<RequiredMark />
            </label>
            <select
              id="staff-mailing-pref"
              className={fieldClass()}
              value={form.mailingPreference}
              onChange={e => set('mailingPreference', e.target.value)}
              aria-required="true"
            >
              <option value="YES">希望する</option>
              <option value="NO">希望しない</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              研修案内等のメール配信を希望するかどうかを選択してください。
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}


      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default StaffDetailAdmin;
