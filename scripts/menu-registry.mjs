// docs/246 メニュー単位カスタムロール RBAC — Phase 1-A 単一情報源
//
// 用途:
//   (a) Sidebar 描画（Phase 3 で動的化）
//   (b) 権限マトリクス UI（Phase 2）
//   (c) backend の action→menu 認可判定（Phase 1-A から有効）
//
// v376.23 の単一情報源パターン（scripts/gas-boundary-utils.mjs）を踏襲。
// build:gas:{admin,member,gas} がここから GAS 側に MENU_REGISTRY / ACTION_TO_MENU /
// LEGACY_ROLE_TO_MENUS / LEGACY_ROLE_TRAINING_SCOPE を埋め込む。frontend も同モジュールを import する。
//
// Phase 1-A の認可規則:
//   action 許可 ⟺ role.isMaster || ACTION_TO_MENU[action] ∈ role.allowedMenus
//   研修編集スコープ: role.trainingEditScope === 'OWN' のとき
//     saveTraining_ 内で T_研修.登録者メール == adminSession.loginId を強制
//
// 既知デルタ（旧 ADMIN_ACTION_PERMISSIONS との差分）は scripts/test-menu-registry.mjs が
// 列挙し、許容 delta は LEGACY_ROLE_DELTA_ACCEPTED に明示して合意ベースで管理する。

// ── メニュー定義（docs/246 §3）────────────────────────────────────
// masterOnly=true: 新モデルでカスタムロールに付与不可。Phase 1-A では legacy ADMIN が
// 引き続き保持するため masterOnly enforcement は server で行わず、Phase 2 の権限管理
// コンソールでの付与制限としてのみ機能する（挙動完全維持優先）。
export const MENU_REGISTRY = [
  // 会員管理
  { id: 'members-list',         label: '会員一覧',          group: '会員管理' },
  { id: 'change-requests',      label: '変更申請管理',      group: '会員管理' },
  // 財務・帳票
  { id: 'annual-fee',           label: '年会費管理',        group: '財務・帳票' },
  { id: 'payment-history',      label: '支払い履歴管理',    group: '財務・帳票' },
  { id: 'claim-management',     label: '請求管理',          group: '財務・帳票' },
  { id: 'roster-export',        label: '名簿出力',          group: '財務・帳票' },
  { id: 'mailing-list-export',  label: '宛名リスト出力',    group: '財務・帳票' },
  // 研修・通知
  { id: 'training-manage',      label: '研修管理',          group: '研修・通知' },
  { id: 'bulk-mail',            label: '一括メール送信',    group: '研修・通知' },
  { id: 'line-post',            label: '公式LINE投稿依頼',  group: '研修・通知' },
  // v376.45: LINE投稿「管理」capability（全件閲覧・投稿済みマーク・状態変更）。nav item は持たず権限マトリクス専用。
  { id: 'line-post-manage',     label: '公式LINE投稿 管理（全件閲覧・投稿済みマーク）', group: '研修・通知' },
  // 組織管理
  { id: 'officer-management',   label: '役員管理',          group: '組織管理' },
  // システム
  { id: 'admin-settings',       label: 'システム設定',      group: 'システム' },
  { id: 'system-permissions',   label: '権限管理',          group: 'システム', masterOnly: true },
  { id: 'data-management',      label: 'データ管理',        group: 'システム', masterOnly: true },
  // 共通（任意のadmin role に付与）— 横断 read 系（共有メモ参照・PDFサムネ・全データ取得）
  { id: 'common-shared',        label: '共通機能（共有メモ参照・PDFサムネ・データ取得）', group: '共通' },
];

// ── action → menu マッピング（docs/246 §3 + 実コード照合）────────
// 旧 ADMIN_ACTION_PERMISSIONS (gas-src/Code.full.gs:1487-1607) の全 action を網羅。
// 漏れがあると Phase 1-A の認可で deny-by-default になるので、scripts/test-menu-registry.mjs で
// 「ADMIN_ACTION_PERMISSIONS のキー集合 ≡ ACTION_TO_MENU のキー集合」を assert する。
export const ACTION_TO_MENU = {
  // members-list
  updateMember: 'members-list',
  getMemberAuthAccounts: 'members-list', // v376.55: 会員認証アカウント一覧（read）
  adminResetMemberPassword: 'members-list', // v376.55: 会員パスワードリセット
  withdrawMember: 'members-list',
  scheduleWithdrawMember: 'members-list',
  cancelScheduledWithdraw: 'members-list',
  removeStaffFromOffice: 'members-list',
  updateStaff: 'members-list',
  getAdminPersonList: 'members-list',
  updatePersonsBatch: 'members-list',
  convertMemberType: 'members-list',
  // change-requests
  getAdminChangeRequests: 'change-requests',
  approveAdminChangeRequest: 'change-requests',
  rejectAdminChangeRequest: 'change-requests',
  // annual-fee
  getAnnualFeeAdminData: 'annual-fee',
  saveAnnualFeeRecord: 'annual-fee',
  saveAnnualFeeRecordsBatch: 'annual-fee',
  // payment-history（振込口座管理を含む — 同一画面の関連サブ機能）
  getPaymentHistory: 'payment-history',
  savePayment: 'payment-history',
  deletePayment: 'payment-history',
  getAdminBankAccount: 'payment-history',
  saveAdminBankAccount: 'payment-history',
  deleteAdminBankAccount: 'payment-history',
  // claim-management
  getClaims: 'claim-management',
  approveClaim: 'claim-management',
  rejectClaim: 'claim-management',
  adminDeleteClaim: 'claim-management',
  // roster-export
  getRosterFieldDictionary: 'roster-export',
  getRosterDesignerData: 'roster-export',
  loadRosterTemplatesV2: 'roster-export',
  saveRosterTemplateV2: 'roster-export',
  deleteRosterTemplateV2: 'roster-export',
  duplicateRosterTemplateV2: 'roster-export',
  // mailing-list-export
  getMailingListTargets: 'mailing-list-export',
  generateMailingListExcel: 'mailing-list-export',
  // training-manage（メール送信・soft delete・サブ機能含む — 1メニュー＝1業務領域）
  saveTraining: 'training-manage',
  softDeleteTraining: 'training-manage',
  restoreTraining: 'training-manage',
  uploadTrainingFile: 'training-manage',
  regenerateThumbnailForTraining: 'training-manage',
  setupTrainingFileFolder: 'training-manage',
  getTrainingManagementData: 'training-manage',
  getTrainingApplicants: 'training-manage',
  sendTrainingReminder: 'training-manage',
  getAdminEmailAliases: 'training-manage',
  sendTrainingMail: 'training-manage',
  generateTrainingEmail: 'training-manage',
  getTrainingRosterDetail: 'training-manage',
  saveAttendance: 'training-manage',
  saveAttendanceBatch: 'training-manage',
  addRosterEntry: 'training-manage',
  addGuestRosterEntry: 'training-manage',
  cancelRosterEntry: 'training-manage',
  updateRosterEntry: 'training-manage',
  getTrainingStats: 'training-manage',
  // bulk-mail
  getMembersForBulkMail: 'bulk-mail',
  sendBulkMemberMail: 'bulk-mail',
  getEmailSendLog: 'bulk-mail',
  getCredentialEmailTemplates: 'bulk-mail',
  saveCredentialEmailTemplate: 'bulk-mail',
  deleteCredentialEmailTemplate: 'bulk-mail',
  // v376.42: 全メール種別テンプレート管理（システム設定→メール通知 画面）
  listMailTemplates: 'admin-settings',
  saveMailTemplate: 'admin-settings',
  deleteMailTemplate: 'admin-settings',
  getBulkMailTemplates: 'bulk-mail',
  saveBulkMailTemplate: 'bulk-mail',
  deleteBulkMailTemplate: 'bulk-mail',
  // line-post
  listLinePostRequests: 'line-post',
  getLinePostRequest: 'line-post',
  saveLinePostRequest: 'line-post',
  uploadLinePostAttachment: 'line-post',
  transitionLinePostRequest: 'line-post',
  deleteLinePostRequest: 'line-post',
  // officer-management
  getOfficerMasterData: 'officer-management',
  saveOrganization: 'officer-management',
  deleteOrganization: 'officer-management',
  saveOfficerRole: 'officer-management',
  deleteOfficerRole: 'officer-management',
  savePaymentType: 'officer-management',
  deletePaymentType: 'officer-management',
  saveWorkCategory: 'officer-management',
  deleteWorkCategory: 'officer-management',
  getOfficerManagementData: 'officer-management',
  assignOfficer: 'officer-management',
  resignOfficer: 'officer-management',
  updateOfficerLinkage: 'officer-management',
  updateOfficerRecord: 'officer-management',
  // admin-settings（MA 専有: write 系 + 設定系 read）
  getDbInfo: 'admin-settings',
  getSystemSettings: 'admin-settings',
  updateSystemSettings: 'admin-settings',
  getAdminDashboardData: 'admin-settings',
  getAdminInitData: 'admin-settings',
  // system-permissions（MASTER 専用メニュー — Phase 1-A では legacy ADMIN も継続アクセス）
  getAdminPermissionData: 'system-permissions',
  saveAdminPermission: 'system-permissions',
  deleteAdminPermission: 'system-permissions',
  // docs/246 Phase 2-A: ロール CRUD API
  listRoles: 'system-permissions',
  saveRole: 'system-permissions',
  deleteRole: 'system-permissions',
  duplicateRole: 'system-permissions',
  // data-management（MASTER 専用メニュー — 削除/repair/backup/seed）
  seedDemoData: 'data-management',
  searchMembersForDelete: 'data-management',
  previewDeleteMember: 'data-management',
  executeDeleteMember: 'data-management',
  getDeleteLogs: 'data-management',
  repairDuplicateStaffRecords: 'data-management',
  repairTrainingApplicationApplicantIds: 'data-management',
  repairMemberCareManagerDuplicates: 'data-management',
  backupMigrationTargets: 'data-management',
  // common-shared（admin role 共通の read 系）
  fetchAllData: 'common-shared',
  getSharedMemo: 'common-shared',
  getFileThumbnail: 'common-shared',
  // 共有メモ書込は admin-settings 配下（write は MA に限定）
  saveSharedMemo: 'admin-settings',
};

// ── legacy ロール → 許可メニュー（Phase 1-A 現状互換マッピング）──
// Phase 1-B で T_権限ロール に DB 永続化される際の初期値もこれに準拠。
// MASTER は明示列挙しない（isMaster による全許可）。
export const LEGACY_ROLE_TO_MENUS = {
  ADMIN: [
    'members-list', 'change-requests',
    'annual-fee', 'payment-history', 'claim-management',
    'roster-export', 'mailing-list-export',
    'training-manage', 'bulk-mail', 'line-post', 'line-post-manage',
    'officer-management',
    'admin-settings',
    // Phase 1-A: ADMIN は現状 system-permissions / data-management(一部) にアクセス可。
    // 完全挙動維持のため legacy 列挙では含めるが、Phase 1-B 初期ロール定義で外す方針。
    'system-permissions',
    'common-shared',
  ],
  TRAINING_MANAGER: [
    'training-manage',
    'common-shared', // fetchAllData / getSharedMemo / getFileThumbnail
  ],
  TRAINING_REGISTRAR: [
    'training-manage', // OWN scope（下記 LEGACY_ROLE_TRAINING_SCOPE）
    'common-shared',
  ],
  GENERAL: [
    // 現実装では checkAdminBySession_ が GENERAL を弾くため到達不能だが、
    // legacy ADMIN_ACTION_PERMISSIONS の GENERAL エントリ（getSharedMemo / getFileThumbnail）と
    // 機械的整合を取るため列挙。Phase 1-B で legacy code 自体を撤去予定。
    'common-shared',
  ],
};

// 研修編集スコープ（OWN: 自分が登録した研修のみ編集可）
// 旧 gas-src/Code.full.gs:11631-11637 のハードコード TRAINING_REGISTRAR 判定を置換するための値。
export const LEGACY_ROLE_TRAINING_SCOPE = {
  MASTER: 'ALL',
  ADMIN: 'ALL',
  TRAINING_MANAGER: 'ALL',
  TRAINING_REGISTRAR: 'OWN',
  GENERAL: 'ALL', // 到達不能だが defensive default
};

// ── 既知デルタ（旧 ADMIN_ACTION_PERMISSIONS との差分の許容リスト）─
// scripts/test-menu-registry.mjs が delta を機械検出した際、ここに列挙された組合せのみ
// 「許容済 delta」として PASS とする。それ以外の delta は test FAIL でリリースを止める。
//
// 形式: { action, role, oldAllow, newAllow, reason }
//   oldAllow: 旧 ADMIN_ACTION_PERMISSIONS による判定（true/false）
//   newAllow: 新 menu-based 判定（true/false）
//
// 現状（Phase 1-A 着手時点）の許容 delta:
//   - TRAINING_REGISTRAR が training-manage menu 経由で softDeleteTraining / restoreTraining /
//     sendTrainingReminder / getAdminEmailAliases / sendTrainingMail / setupTrainingFileFolder
//     にアクセス可能になる。旧モデルでは TR 不可だった。
//     → 補償: OWN scope は saveTraining_ 等に適用済。新ロール定義で TR は initial training-manage
//       OWN として継続。softDelete 等の追加権限は運用上の問題に直結しないため許容。
//       Phase 2 で UI から細粒度調整可能。
//   - TRAINING_MANAGER が setupTrainingFileFolder にアクセス可能になる（旧: M/A のみ）。
//     → 設定操作だが冪等で危険度低。許容。
//   - TRAINING_MANAGER / TRAINING_REGISTRAR が fetchAllData / getAdminInitData /
//     getAdminDashboardData / getDbInfo にアクセス可能になる（admin-settings menu 経由）。
//     → 旧: M/A のみ（fetchAllData は TM/TR も可）。core 系 read API のため許容。
export const LEGACY_ROLE_DELTA_ACCEPTED = [
  // TR が training-manage menu で旧不許可 action にアクセス可能になる
  { action: 'softDeleteTraining',         role: 'TRAINING_REGISTRAR', oldAllow: false, newAllow: true,  reason: 'menu 粒度簡素化 + OWN scope で補償（Phase 1-A 設計合意）' },
  { action: 'restoreTraining',            role: 'TRAINING_REGISTRAR', oldAllow: false, newAllow: true,  reason: 'menu 粒度簡素化 + OWN scope で補償' },
  { action: 'sendTrainingReminder',       role: 'TRAINING_REGISTRAR', oldAllow: false, newAllow: true,  reason: 'menu 粒度簡素化（運用上問題低）' },
  { action: 'getAdminEmailAliases',       role: 'TRAINING_REGISTRAR', oldAllow: false, newAllow: true,  reason: 'menu 粒度簡素化' },
  { action: 'sendTrainingMail',           role: 'TRAINING_REGISTRAR', oldAllow: false, newAllow: true,  reason: 'menu 粒度簡素化' },
  { action: 'setupTrainingFileFolder',    role: 'TRAINING_REGISTRAR', oldAllow: false, newAllow: true,  reason: 'menu 粒度簡素化（冪等操作）' },
  // TM が setupTrainingFileFolder にアクセス可能になる
  { action: 'setupTrainingFileFolder',    role: 'TRAINING_MANAGER',   oldAllow: false, newAllow: true,  reason: 'menu 粒度簡素化（冪等操作）' },
  // GENERAL は checkAdminBySession_ で弾かれて到達不能。common-shared 経由で fetchAllData が見える形になるが影響なし
  { action: 'fetchAllData',               role: 'GENERAL',            oldAllow: false, newAllow: true,  reason: 'GENERAL は admin login 不可（到達不能）' },
];

// ── Phase 1-B: 初期ロール定義（T_権限ロール の seed データ）─────────
// docs/246 §8 (Migration step 3) の「編集可能な初期カスタムロール」生成元。
// **完全挙動維持のため Phase 1-A LEGACY_ROLE_TO_MENUS の集合をそのまま採用**する
// （docs/246 §8 #3 で示唆される masterOnly 除外案より conservative）。
// MASTER 以外のロールは Phase 2 の権限管理コンソール UI から編集可能。
//
// 各エントリ:
//   roleId         — 決定論的 ID（再投入冪等性のため UUID 非採用）。MASTER と初期4ロールは予約。
//   roleName       — 人間可読名。"MASTER" は予約語
//   description    — 説明
//   legacyCode     — 旧 ADMIN_ACTION_PERMISSIONS の権限コード（whitelist 移行用 mapping key）
//   allowedMenus   — 許可メニューid 配列（isBuiltIn=true かつ isMaster は無視され全許可）
//   trainingEditScope — 'ALL' | 'OWN'
//   isBuiltIn      — true = MASTER（編集・削除不可）/ false = カスタム（編集可）
//   isMaster       — true のとき全メニュー許可（allowedMenus は無視）
//   sortOrder      — 表示順
export const INITIAL_ROLE_DEFINITIONS = [
  {
    roleId: 'role-master-builtin',
    roleName: 'MASTER',
    description: 'マスター（全権・組込・編集削除不可）',
    legacyCode: 'MASTER',
    allowedMenus: [],
    trainingEditScope: 'ALL',
    isBuiltIn: true,
    isMaster: true,
    sortOrder: 1,
  },
  {
    roleId: 'role-admin-initial',
    roleName: '管理者',
    description: '管理者（Phase 1-A 互換マッピング — 権限管理含む全機能）',
    legacyCode: 'ADMIN',
    allowedMenus: LEGACY_ROLE_TO_MENUS.ADMIN.slice(),
    trainingEditScope: 'ALL',
    isBuiltIn: false,
    isMaster: false,
    sortOrder: 10,
  },
  {
    roleId: 'role-training-manager-initial',
    roleName: '研修管理者',
    description: '研修管理者（研修管理 + 共通機能）',
    legacyCode: 'TRAINING_MANAGER',
    allowedMenus: LEGACY_ROLE_TO_MENUS.TRAINING_MANAGER.slice(),
    trainingEditScope: 'ALL',
    isBuiltIn: false,
    isMaster: false,
    sortOrder: 20,
  },
  {
    roleId: 'role-training-registrar-initial',
    roleName: '研修登録者',
    description: '研修登録者（自登録研修のみ編集可・OWN scope）',
    legacyCode: 'TRAINING_REGISTRAR',
    allowedMenus: LEGACY_ROLE_TO_MENUS.TRAINING_REGISTRAR.slice(),
    trainingEditScope: 'OWN',
    isBuiltIn: false,
    isMaster: false,
    sortOrder: 30,
  },
  {
    roleId: 'role-general-initial',
    roleName: '一般',
    description: '一般（admin login 不可・予約）',
    legacyCode: 'GENERAL',
    allowedMenus: LEGACY_ROLE_TO_MENUS.GENERAL.slice(),
    trainingEditScope: 'ALL',
    isBuiltIn: false,
    isMaster: false,
    sortOrder: 90,
  },
];

// legacy 権限コード → 初期ロールID マッピング（whitelist 移行用）
export const LEGACY_CODE_TO_INITIAL_ROLE_ID = Object.freeze(
  INITIAL_ROLE_DEFINITIONS.reduce((acc, def) => {
    if (def.legacyCode) acc[def.legacyCode] = def.roleId;
    return acc;
  }, {}),
);

// ── 認可判定（共通ロジック — GAS / Node 双方で同一）───────────────
// Phase 1-A: legacy 権限コードからの判定（snapshot test 用に保持）。
export function isActionAllowedByMenu(action, roleCode, opts) {
  const isMaster = roleCode === 'MASTER';
  if (isMaster) return true;
  const menuId = ACTION_TO_MENU[action];
  if (!menuId) return false; // 未マップ action は deny（fail-closed）
  const allowedMenus = LEGACY_ROLE_TO_MENUS[roleCode] || [];
  return allowedMenus.indexOf(menuId) !== -1;
}

// Phase 2 hotfix v376.28.2: session resolved ロールベースの判定（GAS の isActionAllowedForSession_ と同一実装）。
// session: { isMaster: boolean, allowedMenus: string[] }
export function isActionAllowedForSession(action, session) {
  if (!session) return false;
  if (session.isMaster) return true;
  const menuId = ACTION_TO_MENU[action];
  if (!menuId) return false;
  const allowed = session.allowedMenus || [];
  return allowed.indexOf(menuId) !== -1;
}

// ── GAS 埋め込み用シリアライザ ────────────────────────────────────
// build-{admin,member,gas}-gas.mjs から呼び、Code.full.gs 内の placeholder
// (var MENU_REGISTRY = []; var ACTION_TO_MENU = {}; ... ) を本物に置換する。
export function serializeMenuRegistryForGas() {
  const json = (v) => JSON.stringify(v, null, 2);
  return [
    `var MENU_REGISTRY = ${json(MENU_REGISTRY)};`,
    `var ACTION_TO_MENU = ${json(ACTION_TO_MENU)};`,
    `var LEGACY_ROLE_TO_MENUS = ${json(LEGACY_ROLE_TO_MENUS)};`,
    `var LEGACY_ROLE_TRAINING_SCOPE = ${json(LEGACY_ROLE_TRAINING_SCOPE)};`,
    `var INITIAL_ROLE_DEFINITIONS = ${json(INITIAL_ROLE_DEFINITIONS)};`,
    `var LEGACY_CODE_TO_INITIAL_ROLE_ID = ${json(LEGACY_CODE_TO_INITIAL_ROLE_ID)};`,
  ].join('\n');
}
