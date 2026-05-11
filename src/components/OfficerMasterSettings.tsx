import React, { useCallback, useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import {
  Organization,
  OfficerMasterData,
  OfficerRole,
  PaymentType,
  WorkCategory,
} from '../shared/types';

interface OfficerMasterSettingsProps {
  api: ApiClient;
}

// ── 共通 UI ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50';

const btnPrimary =
  'rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50';

const btnSecondary =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

const btnDanger =
  'rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50';

const btnEdit =
  'rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100';

const SubSectionHeader: React.FC<{ title: string; count: number; onAdd: () => void; addLabel?: string }> = ({
  title, count, onAdd, addLabel = '＋ 追加',
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        {count} 件
      </span>
    </div>
    <button type="button" onClick={onAdd} className={btnSecondary}>{addLabel}</button>
  </div>
);

// ── メインコンポーネント ────────────────────────────────────────────────────

const OfficerMasterSettings: React.FC<OfficerMasterSettingsProps> = ({ api }) => {
  const [data, setData] = useState<OfficerMasterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await api.getOfficerMasterData();
      setData(d);
    } catch (e: any) {
      setLoadError(e?.message || '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) {
    return <p className="text-sm text-slate-500 py-4 text-center">読み込み中…</p>;
  }
  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {loadError}
        <button onClick={() => void loadData()} className="ml-3 underline hover:no-underline">再読み込み</button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <OrganizationSection data={data} setData={setData} api={api} />
      <hr className="border-slate-200" />
      <RoleSection data={data} setData={setData} api={api} />
      <hr className="border-slate-200" />
      <PaymentTypeSection data={data} setData={setData} api={api} />
      <hr className="border-slate-200" />
      <WorkCategorySection data={data} setData={setData} api={api} />
    </div>
  );
};

// ── M_組織マスタ ──────────────────────────────────────────────────────────

interface OrgForm {
  code: string;
  name: string;
  type: string;
  order: string;
  allOfficerVisible: boolean;
  enabled: boolean;
}

const ORG_TYPES = ['本部', '理事会', '委員会', '事務局', 'その他'];

const OrganizationSection: React.FC<{
  data: OfficerMasterData;
  setData: React.Dispatch<React.SetStateAction<OfficerMasterData | null>>;
  api: ApiClient;
}> = ({ data, setData, api }) => {
  const empty: OrgForm = { code: '', name: '', type: '委員会', order: '', allOfficerVisible: false, enabled: true };
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState<OrgForm>(empty);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setForm(empty); setFormVisible(true); setError(null); };
  const openEdit = (org: Organization) => {
    setEditing(org);
    setForm({
      code: org.組織コード,
      name: org.組織名,
      type: org.組織種別,
      order: String(org.表示順 || ''),
      allOfficerVisible: !!org.全役員表示フラグ,
      enabled: !!org.有効フラグ,
    });
    setFormVisible(true);
    setError(null);
  };
  const closeForm = () => { setFormVisible(false); setEditing(null); setForm(empty); setError(null); };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('組織コードと組織名は必須です。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.saveOrganization({
        organizationCode: form.code.trim().toUpperCase(),
        organizationName: form.name.trim(),
        organizationType: form.type,
        displayOrder: form.order ? Number(form.order) : 0,
        allOfficerVisible: form.allOfficerVisible,
        enabled: form.enabled,
      });
      const updated = await api.getOfficerMasterData();
      setData(updated);
      closeForm();
    } catch (e: any) {
      setError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (org: Organization) => {
    if (!window.confirm(`「${org.組織名}」を削除しますか？\n役職が登録されている場合は削除できません。`)) return;
    setDeleting(org.組織コード);
    try {
      await api.deleteOrganization({ organizationCode: org.組織コード });
      const updated = await api.getOfficerMasterData();
      setData(updated);
    } catch (e: any) {
      alert(e?.message || '削除に失敗しました。');
    } finally {
      setDeleting(null);
    }
  };

  const orgs = data.organizations.filter(o => !o.削除フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));

  return (
    <div className="space-y-3">
      <SubSectionHeader title="組織マスタ" count={orgs.length} onAdd={openAdd} />
      <p className="text-xs text-slate-500">本部・委員会などの組織単位を管理します。役職はこの組織に紐づきます。</p>

      {formVisible && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-primary-800">{editing ? '組織を編集' : '新しい組織を追加'}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">組織コード *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editing}
                placeholder="例: COMMITTEE_A"
                maxLength={30}
                className={inputCls}
              />
              {!editing && <p className="mt-0.5 text-[10px] text-slate-400">英大文字・数字・アンダースコアのみ。変更不可。</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">組織名 *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例: 新設委員会"
                maxLength={50}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">組織種別</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className={inputCls}
              >
                {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">表示順</label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                min={0}
                max={999}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.allOfficerVisible}
                onChange={e => setForm(f => ({ ...f, allOfficerVisible: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-primary-600"
              />
              すべての役員に活動部として表示
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-primary-600"
              />
              有効
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" onClick={closeForm} className={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {orgs.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">組織が登録されていません。</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">コード</th>
                <th className="px-3 py-2">組織名</th>
                <th className="px-3 py-2">種別</th>
                <th className="px-3 py-2">全役員</th>
                <th className="px-3 py-2">順</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {orgs.map(org => (
                <tr key={org.組織コード} className={!org.有効フラグ ? 'opacity-50' : undefined}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{org.組織コード}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{org.組織名}</td>
                  <td className="px-3 py-2 text-slate-600">{org.組織種別}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{org.全役員表示フラグ ? '表示' : '所属者のみ'}</td>
                  <td className="px-3 py-2 text-slate-500">{org.表示順}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${org.有効フラグ ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {org.有効フラグ ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(org)} className={btnEdit}>編集</button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(org)}
                        disabled={deleting === org.組織コード}
                        className={btnDanger}
                      >
                        {deleting === org.組織コード ? '…' : '削除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── M_役職マスタ ──────────────────────────────────────────────────────────

interface RoleForm {
  code: string;
  name: string;
  orgCode: string;
  isChairman: boolean;
  order: string;
  enabled: boolean;
}

const RoleSection: React.FC<{
  data: OfficerMasterData;
  setData: React.Dispatch<React.SetStateAction<OfficerMasterData | null>>;
  api: ApiClient;
}> = ({ data, setData, api }) => {
  const activeOrgs = data.organizations.filter(o => !o.削除フラグ && o.有効フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));
  const defaultOrg = activeOrgs[0]?.組織コード ?? '';
  const empty: RoleForm = { code: '', name: '', orgCode: defaultOrg, isChairman: false, order: '', enabled: true };

  const [editing, setEditing] = useState<OfficerRole | null>(null);
  const [form, setForm] = useState<RoleForm>(empty);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setForm({ ...empty, orgCode: defaultOrg }); setFormVisible(true); setError(null); };
  const openEdit = (role: OfficerRole) => {
    setEditing(role);
    setForm({ code: role.役職コード, name: role.役職名, orgCode: role.組織コード, isChairman: !!role.委員長フラグ, order: String(role.表示順 || ''), enabled: !!role.有効フラグ });
    setFormVisible(true);
    setError(null);
  };
  const closeForm = () => { setFormVisible(false); setEditing(null); setForm(empty); setError(null); };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.orgCode) {
      setError('役職コード・役職名・組織は必須です。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.saveOfficerRole({
        roleCode: form.code.trim().toUpperCase(),
        roleName: form.name.trim(),
        organizationCode: form.orgCode,
        isChairman: form.isChairman,
        displayOrder: form.order ? Number(form.order) : 0,
        enabled: form.enabled,
      });
      const updated = await api.getOfficerMasterData();
      setData(updated);
      closeForm();
    } catch (e: any) {
      setError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: OfficerRole) => {
    if (!window.confirm(`「${role.役職名}」を削除しますか？\n役員割当て中の場合は削除できません。`)) return;
    setDeleting(role.役職コード);
    try {
      await api.deleteOfficerRole({ roleCode: role.役職コード });
      const updated = await api.getOfficerMasterData();
      setData(updated);
    } catch (e: any) {
      alert(e?.message || '削除に失敗しました。');
    } finally {
      setDeleting(null);
    }
  };

  // 組織コードで役職をグループ化して表示
  const orgMap = Object.fromEntries(data.organizations.map(o => [o.組織コード, o.組織名]));
  const roles = data.roles.filter(r => !r.削除フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));

  return (
    <div className="space-y-3">
      <SubSectionHeader title="役職マスタ" count={roles.length} onAdd={openAdd} />
      <p className="text-xs text-slate-500">各組織に属する役職を定義します。委員長フラグは将来の承認ワークフローで使用します。</p>

      {formVisible && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-primary-800">{editing ? '役職を編集' : '新しい役職を追加'}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">役職コード *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editing}
                placeholder="例: NEW_ROLE"
                maxLength={30}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">役職名 *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例: 新設委員"
                maxLength={50}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">組織 *</label>
              <select
                value={form.orgCode}
                onChange={e => setForm(f => ({ ...f, orgCode: e.target.value }))}
                className={inputCls}
              >
                <option value="">-- 選択してください --</option>
                {activeOrgs.map(o => <option key={o.組織コード} value={o.組織コード}>{o.組織名}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">表示順</label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                min={0}
                max={999}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.isChairman}
                onChange={e => setForm(f => ({ ...f, isChairman: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-primary-600"
              />
              委員長（将来の承認権限に使用）
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-primary-600"
              />
              有効
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" onClick={closeForm} className={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {roles.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">役職が登録されていません。</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">コード</th>
                <th className="px-3 py-2">役職名</th>
                <th className="px-3 py-2">組織</th>
                <th className="px-3 py-2">委員長</th>
                <th className="px-3 py-2">順</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {roles.map(role => (
                <tr key={role.役職コード} className={!role.有効フラグ ? 'opacity-50' : undefined}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{role.役職コード}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{role.役職名}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{orgMap[role.組織コード] ?? role.組織コード}</td>
                  <td className="px-3 py-2">
                    {role.委員長フラグ && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">委員長</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{role.表示順}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${role.有効フラグ ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {role.有効フラグ ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(role)} className={btnEdit}>編集</button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(role)}
                        disabled={deleting === role.役職コード}
                        className={btnDanger}
                      >
                        {deleting === role.役職コード ? '…' : '削除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── M_支払い種別マスタ ────────────────────────────────────────────────────

interface PaymentTypeForm {
  code: string;
  name: string;
  scope: string;
  order: string;
  enabled: boolean;
}

const SCOPE_OPTIONS = [
  { value: '両方', label: '支払い・請求 両方' },
  { value: '支払い', label: '支払いのみ' },
  { value: '請求', label: '請求のみ' },
];

const PaymentTypeSection: React.FC<{
  data: OfficerMasterData;
  setData: React.Dispatch<React.SetStateAction<OfficerMasterData | null>>;
  api: ApiClient;
}> = ({ data, setData, api }) => {
  const empty: PaymentTypeForm = { code: '', name: '', scope: '両方', order: '', enabled: true };

  const [editing, setEditing] = useState<PaymentType | null>(null);
  const [form, setForm] = useState<PaymentTypeForm>(empty);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setForm(empty); setFormVisible(true); setError(null); };
  const openEdit = (pt: PaymentType) => {
    setEditing(pt);
    setForm({ code: pt.種別コード, name: pt.種別名, scope: pt.対象区分, order: String(pt.表示順 || ''), enabled: !!pt.有効フラグ });
    setFormVisible(true);
    setError(null);
  };
  const closeForm = () => { setFormVisible(false); setEditing(null); setForm(empty); setError(null); };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('種別コードと種別名は必須です。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.savePaymentType({
        typeCode: form.code.trim().toUpperCase(),
        typeName: form.name.trim(),
        scope: form.scope,
        displayOrder: form.order ? Number(form.order) : 0,
        enabled: form.enabled,
      });
      const updated = await api.getOfficerMasterData();
      setData(updated);
      closeForm();
    } catch (e: any) {
      setError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pt: PaymentType) => {
    if (!window.confirm(`「${pt.種別名}」を削除しますか？\n使用中の場合は削除できません。`)) return;
    setDeleting(pt.種別コード);
    try {
      await api.deletePaymentType({ typeCode: pt.種別コード });
      const updated = await api.getOfficerMasterData();
      setData(updated);
    } catch (e: any) {
      alert(e?.message || '削除に失敗しました。');
    } finally {
      setDeleting(null);
    }
  };

  const types = data.paymentTypes.filter(t => !t.削除フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));

  return (
    <div className="space-y-3">
      <SubSectionHeader title="支払い種別マスタ" count={types.length} onAdd={openAdd} />
      <p className="text-xs text-slate-500">役員報酬・活動費などの支払い・請求種別を管理します。</p>

      {formVisible && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-primary-800">{editing ? '種別を編集' : '新しい種別を追加'}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">種別コード *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editing}
                placeholder="例: MEAL"
                maxLength={30}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">種別名 *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例: 食事代"
                maxLength={50}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">対象区分</label>
              <select
                value={form.scope}
                onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
                className={inputCls}
              >
                {SCOPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">表示順</label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                min={0}
                max={999}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 accent-primary-600"
            />
            有効
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" onClick={closeForm} className={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {types.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">支払い種別が登録されていません。</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">コード</th>
                <th className="px-3 py-2">種別名</th>
                <th className="px-3 py-2">対象区分</th>
                <th className="px-3 py-2">順</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {types.map(pt => (
                <tr key={pt.種別コード} className={!pt.有効フラグ ? 'opacity-50' : undefined}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{pt.種別コード}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{pt.種別名}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{pt.対象区分}</td>
                  <td className="px-3 py-2 text-slate-500">{pt.表示順}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${pt.有効フラグ ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {pt.有効フラグ ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(pt)} className={btnEdit}>編集</button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(pt)}
                        disabled={deleting === pt.種別コード}
                        className={btnDanger}
                      >
                        {deleting === pt.種別コード ? '…' : '削除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── M_業務分類 ────────────────────────────────────────────────────────────

interface WorkCategoryForm {
  code: string;
  name: string;
  orgCode: string;
  unitPrice: string;
  order: string;
  enabled: boolean;
}

const WorkCategorySection: React.FC<{
  data: OfficerMasterData;
  setData: React.Dispatch<React.SetStateAction<OfficerMasterData | null>>;
  api: ApiClient;
}> = ({ data, setData, api }) => {
  const activeOrgs = data.organizations.filter(o => !o.削除フラグ && o.有効フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));
  const defaultOrg = activeOrgs[0]?.組織コード ?? '';
  const empty: WorkCategoryForm = { code: '', name: '', orgCode: defaultOrg, unitPrice: '', order: '', enabled: true };

  const [editing, setEditing] = useState<WorkCategory | null>(null);
  const [form, setForm] = useState<WorkCategoryForm>(empty);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setForm({ ...empty, orgCode: defaultOrg }); setFormVisible(true); setError(null); };
  const openEdit = (category: WorkCategory) => {
    setEditing(category);
    setForm({
      code: category.業務分類コード,
      name: category.業務分類名,
      orgCode: category.組織コード,
      unitPrice: String(category.単価 ?? ''),
      order: String(category.表示順 || ''),
      enabled: !!category.有効フラグ,
    });
    setFormVisible(true);
    setError(null);
  };
  const closeForm = () => { setFormVisible(false); setEditing(null); setForm(empty); setError(null); };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.orgCode) {
      setError('業務分類コード・分類名・組織は必須です。');
      return;
    }
    const unitPrice = Number(form.unitPrice || 0);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError('単価は0円以上の数値で入力してください。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.saveWorkCategory({
        categoryCode: form.code.trim().toUpperCase(),
        categoryName: form.name.trim(),
        organizationCode: form.orgCode,
        unitPrice,
        displayOrder: form.order ? Number(form.order) : 0,
        enabled: form.enabled,
      });
      const updated = await api.getOfficerMasterData();
      setData(updated);
      closeForm();
    } catch (e: any) {
      setError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: WorkCategory) => {
    if (!window.confirm(`「${category.業務分類名}」を削除しますか？\n使用中の場合は削除できません。`)) return;
    setDeleting(category.業務分類コード);
    try {
      await api.deleteWorkCategory({ categoryCode: category.業務分類コード });
      const updated = await api.getOfficerMasterData();
      setData(updated);
    } catch (e: any) {
      alert(e?.message || '削除に失敗しました。');
    } finally {
      setDeleting(null);
    }
  };

  const orgMap = Object.fromEntries(data.organizations.map(o => [o.組織コード, o.組織名]));
  const categories = (data.workCategories ?? []).filter(c => !c.削除フラグ).sort((a, b) => {
    const orgSort = String(a.組織コード || '').localeCompare(String(b.組織コード || ''), 'ja');
    return orgSort || (a.表示順 || 0) - (b.表示順 || 0);
  });

  return (
    <div className="space-y-3">
      <SubSectionHeader title="業務分類マスタ" count={categories.length} onAdd={openAdd} />
      <p className="text-xs text-slate-500">活動報告の業務内容と単価を管理します。会員側では選択した業務分類の単価が自動で請求金額になります。</p>

      {formVisible && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-primary-800">{editing ? '業務分類を編集' : '新しい業務分類を追加'}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">分類コード *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editing}
                placeholder="例: MEETING"
                maxLength={30}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">分類名 *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例: 会議出席"
                maxLength={50}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">組織 *</label>
              <select value={form.orgCode} onChange={e => setForm(f => ({ ...f, orgCode: e.target.value }))} className={inputCls}>
                {activeOrgs.map(o => <option key={o.組織コード} value={o.組織コード}>{o.組織名}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">単価 *</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.unitPrice}
                onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value.replace(/[^\d]/g, '') }))}
                placeholder="例: 3000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">表示順</label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                min={0}
                max={999}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 accent-primary-600"
            />
            有効
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" onClick={closeForm} className={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">業務分類が登録されていません。</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">コード</th>
                <th className="px-3 py-2">分類名</th>
                <th className="px-3 py-2">組織</th>
                <th className="px-3 py-2 text-right">単価</th>
                <th className="px-3 py-2">順</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {categories.map(category => (
                <tr key={category.業務分類コード} className={!category.有効フラグ ? 'opacity-50' : undefined}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{category.業務分類コード}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{category.業務分類名}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{orgMap[category.組織コード] ?? category.組織コード}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">¥{Number(category.単価 || 0).toLocaleString('ja-JP')}</td>
                  <td className="px-3 py-2 text-slate-500">{category.表示順}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${category.有効フラグ ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {category.有効フラグ ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(category)} className={btnEdit}>編集</button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(category)}
                        disabled={deleting === category.業務分類コード}
                        className={btnDanger}
                      >
                        {deleting === category.業務分類コード ? '…' : '削除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OfficerMasterSettings;
