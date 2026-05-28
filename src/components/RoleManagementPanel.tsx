// docs/246 Phase 2-B: メニュー単位カスタムロール RBAC の権限管理コンソール UI
//
// 親 (App.tsx の system-permissions view) から roles / menuRegistry / currentSessionPermissionLevel を
// 受け取り、ロール一覧 + 編集モーダル + 権限マトリクス + 監査用ガードレールを提供する。
//
// ガードレール:
//   - MASTER built-in は read-only（編集・削除・複製の操作ボタンを抑制）
//   - masterOnly メニューはチェックボックス非活性（assistive tooltip + UI で防御 + server-side 二重防御）
//   - 削除時 assignedCount>0 は無効化（再割当を促す）
//   - server-side でも requireMasterForRoleWrite_ により MASTER 限定（特権昇格防止）

import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { RoleDefinition, MenuRegistryEntry, AdminPermissionLevel } from '../types';

interface Props {
  initialRoles?: RoleDefinition[];
  initialMenuRegistry?: MenuRegistryEntry[];
  currentPermissionLevel: AdminPermissionLevel | null;
  onChanged?: () => void; // ロール一覧変更後、親に通知（getAdminPermissionData 再取得など）
}

interface EditorState {
  mode: 'create' | 'edit';
  roleId?: string;
  roleName: string;
  description: string;
  allowedMenus: Set<string>;
  trainingEditScope: 'ALL' | 'OWN';
}

function emptyEditor(): EditorState {
  return { mode: 'create', roleName: '', description: '', allowedMenus: new Set(), trainingEditScope: 'ALL' };
}

export function RoleManagementPanel({ initialRoles, initialMenuRegistry, currentPermissionLevel, onChanged }: Props) {
  const [roles, setRoles] = useState<RoleDefinition[]>(initialRoles || []);
  const [menuRegistry, setMenuRegistry] = useState<MenuRegistryEntry[]>(initialMenuRegistry || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);

  const isMasterCaller = currentPermissionLevel === 'MASTER';

  useEffect(() => {
    // 親が initialRoles を渡さない（または空）の場合に独自で listRoles を呼ぶ
    if (!initialRoles || initialRoles.length === 0) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listRoles();
      setRoles(result.roles);
      setMenuRegistry(result.menuRegistry);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ロール一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  // メニューをグループ単位で表示
  const menusByGroup = useMemo(() => {
    const groups: { group: string; menus: MenuRegistryEntry[] }[] = [];
    const map: Record<string, MenuRegistryEntry[]> = {};
    for (const m of menuRegistry) {
      if (!map[m.group]) map[m.group] = [];
      map[m.group].push(m);
    }
    for (const g of Object.keys(map)) groups.push({ group: g, menus: map[g] });
    return groups;
  }, [menuRegistry]);

  function openCreate() {
    setEditor(emptyEditor());
  }

  function openEdit(role: RoleDefinition) {
    if (role.isBuiltIn) {
      setError('組込ロール（MASTER）は編集できません。');
      return;
    }
    setEditor({
      mode: 'edit',
      roleId: role.roleId,
      roleName: role.roleName,
      description: role.description,
      allowedMenus: new Set(role.allowedMenus),
      trainingEditScope: role.trainingEditScope,
    });
  }

  async function handleSave() {
    if (!editor) return;
    if (!editor.roleName.trim()) {
      setError('ロール名は必須です。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.saveRole({
        roleId: editor.mode === 'edit' ? editor.roleId : undefined,
        roleName: editor.roleName.trim(),
        description: editor.description.trim(),
        allowedMenus: Array.from(editor.allowedMenus),
        trainingEditScope: editor.trainingEditScope,
      });
      setEditor(null);
      await refresh();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ロール保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: RoleDefinition) {
    if (role.isBuiltIn) return;
    if (role.assignedCount > 0) {
      alert(`このロールは ${role.assignedCount} 件のアカウントに割当中のため削除できません。先に再割当を行ってください。`);
      return;
    }
    if (!confirm(`ロール「${role.roleName}」を削除しますか？この操作は取り消せません。`)) return;
    try {
      await api.deleteRole(role.roleId);
      await refresh();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ロール削除に失敗しました。');
    }
  }

  async function handleDuplicate(role: RoleDefinition) {
    const newName = prompt(`「${role.roleName}」を複製します。新しいロール名を入力してください。`, role.roleName + ' (コピー)');
    if (!newName || !newName.trim()) return;
    try {
      await api.duplicateRole({ sourceRoleId: role.roleId, newRoleName: newName.trim() });
      await refresh();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ロール複製に失敗しました。');
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">ロール管理（権限マトリクス）</h3>
          <p className="text-sm text-slate-600 mt-1">
            メニュー単位でアクセス権を定義します。MASTER は全権・編集削除不可。masterOnly メニュー（権限管理 / データ管理）はカスタムロールに付与できません。
          </p>
          {!isMasterCaller && (
            <p className="text-xs text-amber-700 mt-1">※ ロールの作成・編集・削除はマスター権限者のみ実行できます（参照のみ可）。</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? '読込中...' : '再読み込み'}
          </button>
          {isMasterCaller && (
            <button
              type="button"
              className="px-3 py-2 bg-slate-800 text-white rounded text-sm hover:bg-slate-700"
              onClick={openCreate}
            >
              + 新規ロール
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-600 uppercase tracking-wider">
              <th className="px-3 py-2 border-b border-slate-200">ロール名</th>
              <th className="px-3 py-2 border-b border-slate-200">説明</th>
              <th className="px-3 py-2 border-b border-slate-200 text-center">許可メニュー数</th>
              <th className="px-3 py-2 border-b border-slate-200 text-center">研修編集</th>
              <th className="px-3 py-2 border-b border-slate-200 text-center">割当数</th>
              <th className="px-3 py-2 border-b border-slate-200">操作</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-500">ロールが登録されていません。</td></tr>
            )}
            {roles.map((role) => (
              <tr key={role.roleId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium">
                  {role.roleName}
                  {role.isBuiltIn && <span className="ml-2 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">組込</span>}
                  {role.isMaster && <span className="ml-1 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">MASTER</span>}
                </td>
                <td className="px-3 py-2 text-slate-600">{role.description || <span className="text-slate-400">—</span>}</td>
                <td className="px-3 py-2 text-center">{role.isMaster ? '全' : role.allowedMenus.length}</td>
                <td className="px-3 py-2 text-center text-xs">{role.trainingEditScope === 'OWN' ? '自登録のみ' : '全研修'}</td>
                <td className="px-3 py-2 text-center">{role.assignedCount}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={role.isBuiltIn || !isMasterCaller}
                      onClick={() => openEdit(role)}
                    >編集</button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!isMasterCaller}
                      onClick={() => handleDuplicate(role)}
                    >複製</button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={role.isBuiltIn || role.assignedCount > 0 || !isMasterCaller}
                      onClick={() => handleDelete(role)}
                      title={role.assignedCount > 0 ? `${role.assignedCount} 件に割当中のため削除不可` : ''}
                    >削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-800">
                {editor.mode === 'create' ? '新規ロール作成' : `ロール編集: ${editor.roleName || '(無題)'}`}
              </h4>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => setEditor(null)}>✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ロール名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editor.roleName}
                  onChange={(e) => setEditor({ ...editor, roleName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  placeholder="例: 経理担当"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">説明</label>
                <input
                  type="text"
                  value={editor.description}
                  onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  placeholder="例: 年会費・支払い履歴のみ閲覧"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">研修編集スコープ</label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="scope"
                      checked={editor.trainingEditScope === 'ALL'}
                      onChange={() => setEditor({ ...editor, trainingEditScope: 'ALL' })}
                    /> 全研修を編集可
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="scope"
                      checked={editor.trainingEditScope === 'OWN'}
                      onChange={() => setEditor({ ...editor, trainingEditScope: 'OWN' })}
                    /> 自分が登録した研修のみ
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">※ training-manage メニューを付与した場合のみ意味を持ちます。</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">許可メニュー</label>
                <div className="space-y-3">
                  {menusByGroup.map((g) => (
                    <div key={g.group} className="border border-slate-200 rounded p-3">
                      <div className="text-xs font-semibold text-slate-600 mb-2">{g.group}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {g.menus.map((m) => (
                          <label
                            key={m.id}
                            className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${m.masterOnly ? 'text-slate-400 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}`}
                            title={m.masterOnly ? 'MASTER 専用メニュー（カスタムロールに付与できません）' : ''}
                          >
                            <input
                              type="checkbox"
                              disabled={m.masterOnly}
                              checked={editor.allowedMenus.has(m.id)}
                              onChange={(e) => {
                                const next = new Set(editor.allowedMenus);
                                if (e.target.checked) next.add(m.id); else next.delete(m.id);
                                setEditor({ ...editor, allowedMenus: next });
                              }}
                            />
                            <span>{m.label}</span>
                            {m.masterOnly && <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">MASTER専用</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
                onClick={() => setEditor(null)}
                disabled={saving}
              >キャンセル</button>
              <button
                type="button"
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || !editor.roleName.trim()}
              >{saving ? '保存中...' : (editor.mode === 'create' ? '作成' : '保存')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
