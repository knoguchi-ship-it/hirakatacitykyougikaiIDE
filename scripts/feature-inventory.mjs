/**
 * 機能一覧（面 × ドメイン）の正本。
 *
 * 表そのものは手で書かない。許可リスト（gas-boundary-utils.mjs）と
 * dispatcher（gas-src/Code.full.gs）から組み立てる。手書きにすると
 * action を足したときに必ず表だけ古くなり、「実装済みか分からないから
 * もう一度作る」＝二重実装を招く。
 *
 * ここで手で持つのは **ドメイン分類だけ**。新しい action を足したのに
 * ここへ分類を書かないと test:feature-inventory が落ちる。
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_ALLOWED_ACTIONS_LIST,
  MEMBER_ALLOWED_ACTIONS_LIST,
  ADMIN_ALLOWED_ACTIONS_LIST,
} from './gas-boundary-utils.mjs';

/** ドメイン分類。新しい action はここへ足す。 */
export const DOMAINS = [
  ['入会・申込受付', ['submitMemberApplication', 'getAdminChangeRequests', 'approveAdminChangeRequest', 'rejectAdminChangeRequest']],
  ['会員情報の照会・更新', ['getMemberPortalData', 'updateMemberSelf', 'updateMember', 'fetchAllData', 'getAdminPersonList', 'updatePersonsBatch', 'convertMemberType', 'submitPublicChangeRequest', 'verifyMemberIdentityForPublic', 'sendPublicOtp', 'verifyPublicOtp']],
  ['退会', ['withdrawSelf', 'cancelWithdrawalSelf', 'withdrawMember', 'scheduleWithdrawMember', 'cancelScheduledWithdraw']],
  ['事業所職員', ['updateStaff', 'removeStaffFromOffice', 'getPublicAvailableStaffSlots', 'getPublicEnrolledStaffList', 'repairDuplicateStaffRecords']],
  ['認証・パスワード', ['memberLogin', 'changePassword', 'requestPasswordReset', 'completePasswordReset', 'getMemberAuthAccounts', 'adminResetMemberPassword', 'adminUnlockMemberAccount', 'adminIssueMemberCredential']],
  ['研修（公開・申込）', ['getPublicTrainings', 'applyTrainingExternal', 'cancelTrainingExternal', 'applyTraining', 'cancelTraining']],
  ['研修（管理）', ['saveTraining', 'softDeleteTraining', 'restoreTraining', 'uploadTrainingFile', 'setupTrainingFileFolder', 'getTrainingManagementData', 'getTrainingApplicants', 'getTrainingStats', 'repairTrainingApplicationApplicantIds']],
  ['研修 名簿・出欠', ['getTrainingRosterDetail', 'saveAttendance', 'saveAttendanceBatch', 'addRosterEntry', 'addGuestRosterEntry', 'cancelRosterEntry', 'updateRosterEntry', 'getRosterFieldDictionary', 'getRosterDesignerData', 'loadRosterTemplatesV2', 'saveRosterTemplateV2', 'deleteRosterTemplateV2', 'duplicateRosterTemplateV2']],
  ['メール送信・文面', ['sendTrainingReminder', 'sendTrainingMail', 'generateTrainingEmail', 'getAdminEmailAliases', 'getMembersForBulkMail', 'sendBulkMemberMail', 'getEmailSendLog', 'getCredentialEmailTemplates', 'saveCredentialEmailTemplate', 'deleteCredentialEmailTemplate', 'listMailTemplates', 'saveMailTemplate', 'deleteMailTemplate', 'getBulkMailTemplates', 'saveBulkMailTemplate', 'deleteBulkMailTemplate', 'getMailingListTargets', 'generateMailingListExcel']],
  ['年会費・請求・入出金', ['getAnnualFeeAdminData', 'saveAnnualFeeRecord', 'saveAnnualFeeRecordsBatch', 'getMyClaims', 'submitClaim', 'deleteMyClaim', 'uploadClaimAttachment', 'removeClaimAttachment', 'getClaims', 'approveClaim', 'rejectClaim', 'adminDeleteClaim', 'saveMyBankAccount', 'getAdminBankAccount', 'saveAdminBankAccount', 'deleteAdminBankAccount', 'getPaymentHistory', 'savePayment', 'deletePayment']],
  ['役員', ['getMyOfficerStatus', 'getOfficerMasterData', 'getOfficerManagementData', 'assignOfficer', 'resignOfficer', 'updateOfficerLinkage', 'updateOfficerRecord', 'saveOrganization', 'deleteOrganization', 'saveOfficerRole', 'deleteOfficerRole', 'savePaymentType', 'deletePaymentType', 'saveWorkCategory', 'deleteWorkCategory']],
  ['権限・ロール', ['getAdminPermissionData', 'saveAdminPermission', 'deleteAdminPermission', 'listRoles', 'saveRole', 'deleteRole', 'duplicateRole']],
  ['システム設定・ダッシュボード', ['getDbInfo', 'getSystemSettings', 'updateSystemSettings', 'getAdminDashboardData', 'getAdminInitData', 'getPublicPortalSettings', 'getSharedMemo', 'saveSharedMemo']],
  ['規程', ['listRegulations', 'saveRegulation', 'saveRegulationsBatch', 'deleteRegulation']],
  ['データ書出・削除', ['listExportableTables', 'exportTableCsv', 'searchMembersForDelete', 'previewDeleteMember', 'executeDeleteMember', 'getDeleteLogs', 'backupMigrationTargets', 'repairMemberCareManagerDuplicates']],
  ['ファイル・サムネイル', ['getFileThumbnail', 'regenerateThumbnailForTraining']],
  ['LINE 投稿依頼', ['listLinePostRequests', 'getLinePostRequest', 'saveLinePostRequest', 'uploadLinePostAttachment', 'transitionLinePostRequest', 'deleteLinePostRequest']],
];

export const BEGIN_MARKER = '<!-- BEGIN GENERATED: feature-inventory -->';
export const END_MARKER = '<!-- END GENERATED: feature-inventory -->';
export const DOC_PATH = path.join('docs', '288_FEATURE_INVENTORY.md');

/** action → 公開／会員／管理 の集合 */
export function buildSurfaceMap() {
  const surface = new Map();
  const mark = (list, name) => list.forEach((a) => surface.set(a, (surface.get(a) || new Set()).add(name)));
  mark(PUBLIC_ALLOWED_ACTIONS_LIST, '公開');
  mark(MEMBER_ALLOWED_ACTIONS_LIST, '会員');
  mark(ADMIN_ALLOWED_ACTIONS_LIST, '管理');
  return surface;
}

/** dispatcher の `action === 'X'` 分岐から、その中で呼ぶ内部関数を拾う */
export function buildImplMap(gasSource) {
  const start = gasSource.indexOf('function processApiRequest(action, payload) {');
  if (start === -1) throw new Error('processApiRequest が見つからない');
  const dispatcher = gasSource.slice(start, gasSource.indexOf('\n}\n', start));
  const marks = [];
  for (const m of dispatcher.matchAll(/action === '([A-Za-z0-9_]+)'/g)) marks.push({ action: m[1], at: m.index });
  // 全 action に共通で出る配線は表の情報量を下げるだけなので落とす
  const NOISE = new Set(['parsePayload_', 'checkAdminBySession_', 'isActionAllowedForSession_', 'getOrCreateDatabase_', 'clearAllDataCache_']);
  const implOf = new Map();
  for (let i = 0; i < marks.length; i++) {
    const body = dispatcher.slice(marks[i].at, i + 1 < marks.length ? marks[i + 1].at : dispatcher.length);
    const called = [...new Set([...body.matchAll(/\b([A-Za-z][A-Za-z0-9]*_)\s*\(/g)].map((x) => x[1]))].filter((f) => !NOISE.has(f));
    implOf.set(marks[i].action, called);
  }
  return implOf;
}

/** 分類漏れ・存在しない action の二方向チェック */
export function checkClassification(surface) {
  const classified = new Set(DOMAINS.flatMap(([, list]) => list));
  return {
    unclassified: [...surface.keys()].filter((a) => !classified.has(a)),
    unknown: [...classified].filter((a) => !surface.has(a)),
  };
}

/** 生成ブロックの中身（マーカーは含まない） */
export function renderInventory(gasSource) {
  const surface = buildSurfaceMap();
  const implOf = buildImplMap(gasSource);
  const { unclassified, unknown } = checkClassification(surface);
  if (unclassified.length) throw new Error(`未分類の action: ${unclassified.join(', ')}（scripts/feature-inventory.mjs の DOMAINS へ追加すること）`);
  if (unknown.length) throw new Error(`許可リストに無い action を分類している: ${unknown.join(', ')}`);

  const cell = (a, s) => (surface.get(a)?.has(s) ? '●' : '');
  const lines = [];
  lines.push(`> この節は \`npm run generate:inventory\` の生成物。**手で編集しない。**`);
  lines.push(`> 出典: 許可リスト \`scripts/gas-boundary-utils.mjs\` ＋ dispatcher \`gas-src/Code.full.gs\`。`);
  lines.push(`> action 合計 **${surface.size}** 件（公開 ${PUBLIC_ALLOWED_ACTIONS_LIST.length} / 会員 ${MEMBER_ALLOWED_ACTIONS_LIST.length} / 管理 ${ADMIN_ALLOWED_ACTIONS_LIST.length}、重複含む）。`);
  lines.push('');
  for (const [domain, actions] of DOMAINS) {
    lines.push(`### ${domain}`);
    lines.push('');
    lines.push('| action | 公開 | 会員 | 管理 | GAS 実装 |');
    lines.push('|---|:--:|:--:|:--:|---|');
    for (const a of actions) {
      const impl = (implOf.get(a) || []).map((f) => '`' + f + '`').join('<br>') || '(dispatcher に直書き)';
      lines.push(`| \`${a}\` | ${cell(a, '公開')} | ${cell(a, '会員')} | ${cell(a, '管理')} | ${impl} |`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

/** 既存ドキュメントの生成ブロックを差し替えた全文を返す */
export function applyToDoc(docText, rendered) {
  const b = docText.indexOf(BEGIN_MARKER);
  const e = docText.indexOf(END_MARKER);
  if (b === -1 || e === -1 || e < b) throw new Error(`${DOC_PATH} に生成ブロックのマーカーが無い`);
  return docText.slice(0, b + BEGIN_MARKER.length) + '\n\n' + rendered + '\n\n' + docText.slice(e);
}

export function readGasSource() {
  return readFileSync(path.join('gas-src', 'Code.full.gs'), 'utf8');
}
