import React from 'react';
import { RoleDefinition } from '../types';

/**
 * ロール視点プレビューバー（MASTER 専用デバッグ機能 / docs/246 View-as-role）
 *
 * MASTER が「各ロール/権限ごとの見え方」に切り替えて確認するための上部固定バー。
 * - サーバー権限は MASTER のまま不変（フロント描画のみ模擬＝なりすましではない）。
 * - プレビュー中は API 書込が遮断され「閲覧のみ」（src/services/api.ts setApiPreviewReadOnly）。
 * - ベストプラクティス準拠: 常時表示バナー / ワンクリック退出 / 可視・非表示サマリー /
 *   閲覧のみ明示 / a11y(role=status, aria-live) / レスポンシブ(360px〜) / 44px タップtarget。
 */
export interface RolePreviewBarProps {
  /** 選択可能ロール（null = 未ロード）。MASTER 行は内部で除外する。 */
  roles: RoleDefinition[] | null;
  loading: boolean;
  /** プレビュー中のロールID（null = MASTER 自身＝通常表示）。 */
  previewRoleId: string | null;
  /** ロール一覧の遅延読込（ドロップダウン初回操作時に呼ぶ）。 */
  onRequestRoles: () => void;
  /** ロール選択（null で MASTER に復帰＝プレビュー終了）。 */
  onSelectRole: (roleId: string | null) => void;
  /** メニュー総数（非表示件数の算出用・任意）。 */
  menuRegistryCount?: number;
}

const RolePreviewBar: React.FC<RolePreviewBarProps> = ({
  roles,
  loading,
  previewRoleId,
  onRequestRoles,
  onSelectRole,
  menuRegistryCount,
}) => {
  const selectable = (roles || [])
    .filter((r) => !r.isMaster)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const activeRole = previewRoleId && roles
    ? roles.find((r) => r.roleId === previewRoleId) || null
    : null;
  const active = !!activeRole;

  const visibleCount = activeRole ? activeRole.allowedMenus.length : 0;
  const hiddenCount =
    active && typeof menuRegistryCount === 'number' && menuRegistryCount > 0
      ? Math.max(0, menuRegistryCount - visibleCount)
      : null;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelectRole(value === '' ? null : value);
  };

  // ロール未ロード時にフォーカス/クリックで遅延ロード。
  const ensureRoles = () => {
    if (roles === null && !loading) onRequestRoles();
  };

  return (
    <div
      className={`shrink-0 w-full border-b ${
        active
          ? 'bg-amber-400 border-amber-600 text-amber-950'
          : 'bg-slate-800 border-slate-700 text-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
        {/* ラベル */}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-tight">
          <span aria-hidden="true" className="text-sm">👁</span>
          <span className="whitespace-nowrap">ロール視点プレビュー</span>
        </span>

        {/* ロール選択 */}
        <label className="inline-flex items-center gap-1.5 text-xs">
          <span className="sr-only">プレビューするロール</span>
          <select
            value={previewRoleId ?? ''}
            onChange={handleSelectChange}
            onMouseDown={ensureRoles}
            onFocus={ensureRoles}
            className={`min-h-[44px] rounded-md border px-2 py-1 text-xs font-medium ${
              active
                ? 'border-amber-700 bg-amber-50 text-amber-950'
                : 'border-slate-600 bg-slate-900 text-slate-100'
            }`}
          >
            <option value="">MASTER（自分・通常表示）</option>
            {loading && roles === null && <option disabled>読込中…</option>}
            {selectable.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {r.roleName}
                {r.isBuiltIn ? '（組込）' : '（カスタム）'}
              </option>
            ))}
          </select>
        </label>

        {/* ステータス（aria-live で読み上げ） */}
        <span role="status" aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {active ? (
            <>
              <span className="inline-flex items-center rounded-full bg-amber-950 px-2 py-0.5 text-[11px] font-bold text-amber-50">
                プレビュー中: {activeRole?.roleName}
              </span>
              <span className="font-medium">
                表示メニュー {visibleCount} 件
                {hiddenCount !== null && <span className="opacity-80">／非表示 {hiddenCount} 件</span>}
              </span>
              <span className="inline-flex items-center rounded border border-amber-700 bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                閲覧のみ（保存・送信は無効）
              </span>
            </>
          ) : (
            <span className="text-[11px] text-slate-400">
              MASTER のみ表示・ロールを選ぶと見え方を切替（閲覧のみ）
            </span>
          )}
        </span>

        {/* 退出ボタン（プレビュー中のみ・右寄せ） */}
        {active && (
          <button
            type="button"
            onClick={() => onSelectRole(null)}
            className="ml-auto inline-flex min-h-[44px] items-center justify-center gap-1 rounded-md bg-amber-950 px-3 py-1.5 text-xs font-bold text-amber-50 hover:bg-amber-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
          >
            <span aria-hidden="true">✕</span>
            プレビューを終了
          </button>
        )}
      </div>
    </div>
  );
};

export default RolePreviewBar;
