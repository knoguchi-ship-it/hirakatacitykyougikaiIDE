import React, { useState } from 'react';
import { Member, MemberType } from '../types';
import { api } from '../services/api';

interface MemberDetailAdminProps {
  member?: Member;
  onBack: () => void;
  onSaved: () => void;
}

const MemberDetailAdmin: React.FC<MemberDetailAdminProps> = ({ member, onBack, onSaved }) => {
  if (!member) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline">&larr; 会員一覧に戻る</button>
        <p className="mt-4 text-slate-500">会員が選択されていません。</p>
      </div>
    );
  }

  const [form, setForm] = useState<Record<string, any>>({ ...member });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const isBusiness = form.type === MemberType.BUSINESS;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await api.updateMember(form as Member);
      setSuccessMsg('会員情報を更新しました。');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full border border-slate-300 rounded px-3 py-2 text-sm';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

  const roleLabel = (role: string) => {
    if (role === 'REPRESENTATIVE') return '代表者';
    if (role === 'ADMIN') return '管理者';
    return 'メンバー';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline">&larr; 会員一覧に戻る</button>
        <h2 className="text-2xl font-bold text-slate-800">会員詳細編集</h2>
        <span className="text-sm text-slate-500">会員ID: {form.id}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">{successMsg}</div>}

      {/* 基本情報 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>会員種別</label>
            <select className={fieldClass} value={form.type || 'INDIVIDUAL'} disabled>
              <option value="INDIVIDUAL">個人会員</option>
              <option value="BUSINESS">事業所会員</option>
              <option value="SUPPORT">賛助会員</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>姓</label>
            <input className={fieldClass} value={form.lastName || ''} onChange={e => set('lastName', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>名</label>
            <input className={fieldClass} value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>セイ</label>
            <input className={fieldClass} value={form.lastKana || ''} onChange={e => set('lastKana', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>メイ</label>
            <input className={fieldClass} value={form.firstKana || ''} onChange={e => set('firstKana', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>介護支援専門員番号</label>
            <input className={fieldClass} value={form.careManagerNumber || ''} onChange={e => set('careManagerNumber', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 勤務先情報 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">勤務先情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>事業所名</label>
            <input className={fieldClass} value={form.officeName || ''} onChange={e => set('officeName', e.target.value)} />
          </div>
          {isBusiness && (
            <div>
              <label className={labelClass}>事業所番号</label>
              <input className={fieldClass} value={form.officeNumber || ''} onChange={e => set('officeNumber', e.target.value)} />
            </div>
          )}
          <div>
            <label className={labelClass}>郵便番号</label>
            <input className={fieldClass} value={form.officePostCode || ''} onChange={e => set('officePostCode', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>都道府県</label>
            <input className={fieldClass} value={form.officePrefecture || ''} onChange={e => set('officePrefecture', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>市区町村</label>
            <input className={fieldClass} value={form.officeCity || ''} onChange={e => set('officeCity', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>住所</label>
            <input className={fieldClass} value={form.officeAddressLine || ''} onChange={e => set('officeAddressLine', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>電話番号</label>
            <input className={fieldClass} value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>FAX番号</label>
            <input className={fieldClass} value={form.fax || ''} onChange={e => set('fax', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 自宅情報 */}
      {!isBusiness && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">自宅情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>郵便番号</label>
              <input className={fieldClass} value={form.homePostCode || ''} onChange={e => set('homePostCode', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>都道府県</label>
              <input className={fieldClass} value={form.homePrefecture || ''} onChange={e => set('homePrefecture', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>市区町村</label>
              <input className={fieldClass} value={form.homeCity || ''} onChange={e => set('homeCity', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>住所</label>
              <input className={fieldClass} value={form.homeAddressLine || ''} onChange={e => set('homeAddressLine', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>携帯電話番号</label>
              <input className={fieldClass} value={form.mobilePhone || ''} onChange={e => set('mobilePhone', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* 連絡設定 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">連絡設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>メールアドレス</label>
            <input className={fieldClass} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>発送方法</label>
            <select className={fieldClass} value={form.mailingPreference || 'EMAIL'} onChange={e => set('mailingPreference', e.target.value)}>
              <option value="EMAIL">メール配信</option>
              <option value="POST">郵送希望</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>郵送先区分</label>
            <select className={fieldClass} value={form.preferredMailDestination || 'OFFICE'} onChange={e => set('preferredMailDestination', e.target.value)}>
              <option value="OFFICE">勤務先</option>
              <option value="HOME">自宅</option>
            </select>
          </div>
        </div>
      </div>

      {/* ステータス */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">ステータス</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>会員状態</label>
            <select className={fieldClass} value={form.status || 'ACTIVE'} onChange={e => set('status', e.target.value)}>
              <option value="ACTIVE">在籍中</option>
              <option value="WITHDRAWAL_SCHEDULED">退会予定</option>
              <option value="WITHDRAWN">退会済</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>入会日</label>
            <input className={fieldClass} type="date" value={form.joinedDate || ''} onChange={e => set('joinedDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>退会日</label>
            <input className={fieldClass} type="date" value={form.withdrawnDate || ''} onChange={e => set('withdrawnDate', e.target.value)} disabled={form.status !== 'WITHDRAWN' && form.status !== 'WITHDRAWAL_SCHEDULED'} />
          </div>
        </div>
      </div>

      {/* 事業所職員一覧 */}
      {isBusiness && form.staff && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">事業所職員一覧</h3>
          <p className="text-sm text-slate-500 mb-3">職員の詳細編集は会員マイページから行えます。</p>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">氏名</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">カナ</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">メール</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">区分</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(form.staff as any[]).map((s: any, idx: number) => (
                <tr key={s.id || idx}>
                  <td className="px-4 py-2 text-sm">{s.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{s.kana}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{s.email}</td>
                  <td className="px-4 py-2 text-sm">{roleLabel(s.role)}</td>
                  <td className="px-4 py-2 text-sm">{s.status === 'LEFT' ? '退職' : '在籍'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 保存 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button onClick={onBack} className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default MemberDetailAdmin;
