// メニュー単位 RBAC のフロント側判定を集約する単一情報源（docs/248 DRY 是正・2026-07-05）。
// server 側の強制は isActionAllowedForSession_（menu-registry 注入）が正本であり、
// ここは「UI 可視性・ルーティング」の判定のみを担う（二重防御の UI 層）。
// App.tsx / Sidebar.tsx にインライン再実装しないこと（v376.45/.51 で散在した反省）。

/** checkAdminBySession / ロール視点プレビューが供給する RBAC ビュー */
export interface RbacView {
  isMaster: boolean;
  allowedMenus: string[];
}

/** menuId へのアクセス可否（MASTER は常に許可）。rbac 未取得(null)は不許可。 */
export function canAccessMenu(rbac: RbacView | null | undefined, menuId: string): boolean {
  if (!rbac) return false;
  if (rbac.isMaster) return true;
  return (rbac.allowedMenus || []).indexOf(menuId) !== -1;
}

/** 公式LINE投稿依頼: 閲覧・作成（line-post メニュー） */
export function canUseLinePost(rbac: RbacView | null | undefined): boolean {
  return canAccessMenu(rbac, 'line-post');
}

/** 公式LINE投稿依頼: 全件閲覧・投稿済みマーク（line-post-manage メニュー） */
export function canManageLinePost(rbac: RbacView | null | undefined): boolean {
  return canAccessMenu(rbac, 'line-post-manage');
}
