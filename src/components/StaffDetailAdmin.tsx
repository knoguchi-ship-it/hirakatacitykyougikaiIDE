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

// WCAG: aria-hidden の必須マーク
const RequiredMark: React.FC = () => (
  <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>
);

// WCAG: role="alert" のエラーメッセージ
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

const StaffDetailAdmin: React.FC<StaffDetailAdminProps> = ({ staff, memberId, officeName, onBack, onSaved }) => {
  if (!staff) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline">&larr; 事業所詳細に戻る</button>
        <p className="mt-4 text-slate-500">職員が選択されていません。</p>
      </div>
    );
  }

  const [form, setForm] = useState({
    name: staff.name || '',
    kana: staff.kana || '',
    email: staff.email || '',
    careManagerNumber: staff.careManagerNumber || '',
    role: staff.role || 'STAFF' as StaffRole,
    joinedDate: staff.joinedDate || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const requiredFields: Record<string, string> = {
    name: '氏名',
    kana: 'フリガナ',
    email: 'メールアドレス',
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
    const err = validateField(key, (form as any)[key] || '');
    setValidationErrors(prev => ({ ...prev, [key]: err }));
  };

  const validateAll = (): boolean => {
    const allTouched: Record<string, boolean> = {};
    const errors: Record<string, string> = {};
    let valid = true;
    for (const key of Object.keys(requiredFields)) {
      allTouched[key] = true;
      const err = validateField(key, (form as any)[key] || '');
      if (err) { errors[key] = err; valid = false; }
    }
    // email format check even if not required
    const emailErr = validateField('email', form.email);
    if (emailErr) { errors['email'] = emailErr; valid = false; }
    allTouched['email'] = true;

    setTouched(prev => ({ ...prev, ...allTouched }));
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return valid;
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!validateAll()) {
      setError('入力エラーがあります。各項目を確認してください。');
      return;
    }
    setSaving(true);
    try {
      await api.updateStaff({
        staffId: staff.id,
        memberId,
        name: form.name.trim(),
        kana: form.kana.trim(),
        email: form.email.trim(),
        careManagerNumber: form.careManagerNumber.trim(),
        role: form.role,
        joinedDate: form.joinedDate,
      });
      setSuccessMsg('保存しました');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const isLeft = staff.status === 'LEFT';
  const fieldClass = (hasError?: boolean) =>
    `w-full border rounded px-3 py-2 text-sm ${hasError ? 'border-red-500 bg-red-50' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-blue-400`;
  const readOnlyClass = 'w-full border border-slate-200 bg-slate-100 rounded px-3 py-2 text-sm text-slate-500';
  const hasError = (key: string) => touched[key] && !!validationErrors[key];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back navigation */}
      <nav aria-label="パンくず">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          &larr; 事業所詳細に戻る
        </button>
      </nav>

      <h2 className="text-2xl font-bold text-slate-800">職員詳細編集</h2>

      {/* Read-only info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">所属情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">所属事業所</label>
            <input className={readOnlyClass} value={officeName} disabled readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">職員ID</label>
            <input className={readOnlyClass} value={staff.id} disabled readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">状態</label>
            <input
              className={readOnlyClass}
              value={isLeft ? '退職' : '在籍'}
              disabled
              readOnly
            />
          </div>
          {staff.withdrawnDate && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">退職日</label>
              <input className={readOnlyClass} value={staff.withdrawnDate} disabled readOnly />
            </div>
          )}
        </div>
      </div>

      {/* LEFT banner */}
      {isLeft && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4" role="status">
          <p className="text-sm text-amber-800 font-medium">
            この職員は退職済みです。編集内容は保存できますが、アカウントは無効化されています。
          </p>
        </div>
      )}

      {/* Editable fields */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 氏名 */}
          <div>
            <label htmlFor="staff-name" className="block text-sm font-medium text-slate-700 mb-1">
              氏名<RequiredMark />
            </label>
            <input
              id="staff-name"
              className={fieldClass(hasError('name'))}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              aria-required="true"
              aria-invalid={hasError('name')}
              aria-describedby={hasError('name') ? 'err-name' : undefined}
            />
            <FieldError id="err-name" message={touched['name'] ? validationErrors['name'] || '' : ''} />
          </div>
          {/* フリガナ */}
          <div>
            <label htmlFor="staff-kana" className="block text-sm font-medium text-slate-700 mb-1">
              フリガナ<RequiredMark />
            </label>
            <input
              id="staff-kana"
              className={fieldClass(hasError('kana'))}
              value={form.kana}
              onChange={e => set('kana', e.target.value)}
              onBlur={() => handleBlur('kana')}
              aria-required="true"
              aria-invalid={hasError('kana')}
              aria-describedby={hasError('kana') ? 'err-kana' : undefined}
            />
            <FieldError id="err-kana" message={touched['kana'] ? validationErrors['kana'] || '' : ''} />
          </div>
          {/* メールアドレス */}
          <div>
            <label htmlFor="staff-email" className="block text-sm font-medium text-slate-700 mb-1">
              メールアドレス<RequiredMark />
            </label>
            <input
              id="staff-email"
              type="email"
              className={fieldClass(hasError('email'))}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={hasError('email')}
              aria-describedby={hasError('email') ? 'err-email' : undefined}
            />
            <FieldError id="err-email" message={touched['email'] ? validationErrors['email'] || '' : ''} />
          </div>
          {/* 介護支援専門員番号 */}
          <div>
            <label htmlFor="staff-cm" className="block text-sm font-medium text-slate-700 mb-1">
              介護支援専門員番号
            </label>
            <input
              id="staff-cm"
              className={fieldClass()}
              value={form.careManagerNumber}
              onChange={e => set('careManagerNumber', e.target.value)}
            />
          </div>
          {/* 職員権限 */}
          <div>
            <label htmlFor="staff-role" className="block text-sm font-medium text-slate-700 mb-1">
              職員権限
            </label>
            <select
              id="staff-role"
              className={fieldClass()}
              value={form.role}
              onChange={e => set('role', e.target.value)}
              disabled={staff.role === 'REPRESENTATIVE'}
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {staff.role === 'REPRESENTATIVE' && (
              <p className="mt-1 text-xs text-slate-500">代表者の権限変更はできません。先に別の代表者を指定してください。</p>
            )}
          </div>
          {/* 入会日 */}
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

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4" role="status">
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default StaffDetailAdmin;
