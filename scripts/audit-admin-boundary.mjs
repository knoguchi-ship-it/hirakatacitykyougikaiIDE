import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  collectFunctionDeclarations,
  ADMIN_TOP_LEVEL_FUNCTIONS,
  ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS,
} from './gas-boundary-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const codePath = join(root, 'gas', 'admin', 'Code.gs');
const htmlPath = join(root, 'gas', 'admin', 'index.html');

// v376.18: 許可 top-level リストは gas-boundary-utils.mjs の ADMIN_TOP_LEVEL_FUNCTIONS に
// 単一情報源化（build-admin-gas.mjs の seed / assertAllowed と共有）。
const allowedTopLevelFunctions = ADMIN_TOP_LEVEL_FUNCTIONS;
const allowedAdminLoginActions = ['checkAdminBySession', 'adminLoginWithData'];
const allowedAdminActions = [
  'getDbInfo',
  'getSystemSettings',
  'updateSystemSettings',
  'getAdminPermissionData',
  'saveAdminPermission',
  'deleteAdminPermission',
  'getAdminDashboardData',
  'getAdminInitData',
  'updateMember',
  'updateMembersBatch',
  'createMember',
  'withdrawMember',
  'scheduleWithdrawMember',
  'cancelScheduledWithdraw',
  'removeStaffFromOffice',
  'updateStaff',
  'getAdminPersonList',
  'updatePersonsBatch',
  'convertMemberType',
  'getAnnualFeeAdminData',
  'saveAnnualFeeRecord',
  'saveAnnualFeeRecordsBatch',
  'saveTraining',
  // v376.7: 研修 soft delete / restore
  'softDeleteTraining',
  'restoreTraining',
  'uploadTrainingFile',
  'setupTrainingFileFolder',
  'getTrainingManagementData',
  'getTrainingApplicants',
  'sendTrainingReminder',
  'getAdminEmailAliases',
  'sendTrainingMail',
  'generateTrainingEmail',
  // v373.7 (S5 Phase 2): getMembersForRoster / validateTemplateSpreadsheet 撤去
  'getMembersForBulkMail',
  'sendBulkMemberMail',
  'getEmailSendLog',
  'getCredentialEmailTemplates',
  'saveCredentialEmailTemplate',
  'deleteCredentialEmailTemplate',
  'getBulkMailTemplates',
  'saveBulkMailTemplate',
  'deleteBulkMailTemplate',
  'searchMembersForDelete',
  'previewDeleteMember',
  'executeDeleteMember',
  'getDeleteLogs',
  'repairDuplicateStaffRecords',
  'repairTrainingApplicationApplicantIds',
  'repairMemberCareManagerDuplicates',
  'fetchAllData',
  // v373.7 (S5 Phase 2): initRosterExport / processRosterChunk / finalizeRosterExport / cleanupRosterExport 撤去
  'getMailingListTargets',
  'generateMailingListExcel',
  'getAdminChangeRequests',
  'approveAdminChangeRequest',
  'rejectAdminChangeRequest',
  // v296: 請求管理
  'getClaims',
  'approveClaim',
  'rejectClaim',
  'adminDeleteClaim',
  // v295: 役員管理マスタ
  'getOfficerMasterData',
  'saveOrganization',
  'deleteOrganization',
  'saveOfficerRole',
  'deleteOfficerRole',
  'savePaymentType',
  'deletePaymentType',
  'saveWorkCategory',
  'deleteWorkCategory',
  'backupMigrationTargets',
  // v295: 役員割当て管理
  'getOfficerManagementData',
  'assignOfficer',
  'resignOfficer',
  'updateOfficerLinkage',
  'updateOfficerRecord',
  // v295: 振込口座管理
  'getAdminBankAccount',
  'saveAdminBankAccount',
  'deleteAdminBankAccount',
  // v295: 支払い履歴管理
  'getPaymentHistory',
  'savePayment',
  'deletePayment',
  // v309: 共有メモ（申し送りホワイトボード）
  'getSharedMemo',
  'saveSharedMemo',
  // v373.7 (S5 Phase 2): v316 テンプレートライブラリ ACTION 群撤去
  // v372: 名簿出力 Visual Template Designer
  'getRosterFieldDictionary',
  'getRosterDesignerData',
  'loadRosterTemplatesV2',
  'saveRosterTemplateV2',
  'deleteRosterTemplateV2',
  'duplicateRosterTemplateV2',
  // v374.1: 公式LINE投稿依頼
  'listLinePostRequests',
  'getLinePostRequest',
  'saveLinePostRequest',
  'uploadLinePostAttachment',
  'transitionLinePostRequest',
  'deleteLinePostRequest',
  // v344: 案内PDFサムネイル Drive proxy
  'getFileThumbnail',
  // v350: 失敗時の手動サムネイル再生成
  'regenerateThumbnailForTraining',
  // v357: PDF lightbox 用 bytes proxy
  'getFileBytes',
  // v360: 研修名簿・出欠・受講履歴・一括メール明細
  'getTrainingRosterDetail',
  'saveAttendance',
  'saveAttendanceBatch',
  'addRosterEntry',
  'addGuestRosterEntry',
  'cancelRosterEntry',
  'updateRosterEntry',
  'getTrainingStats',
  'getMemberTrainingHistory',
];
// v376.18: ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS（build-admin-gas.mjs と共有）に単一情報源化。
const forbiddenTopLevelFunctions = ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS;
const forbiddenActions = [
  'memberLogin',
  'memberLoginWithData',
  'requestPasswordReset',
  'completePasswordReset',
  'getMemberPortalData',
  'updateMemberSelf',
  'changePassword',
  'applyTraining',
  'cancelTraining',
  'withdrawSelf',
  'cancelWithdrawalSelf',
  'submitMemberApplication',
  'getPublicTrainings',
  'getPublicPortalSettings',
  'applyTrainingExternal',
  'cancelTrainingExternal',
  'seedDemoData',
];
const forbiddenHtmlTokens = [
  'memberLoginWithData',
  'submitMemberApplication',
  'getPublicTrainings',
  'applyTrainingExternal',
];

const failures = [];
const fail = (message) => failures.push(message);
const sorted = (values) => [...values].sort((a, b) => a.localeCompare(b));

function compareSets(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const extra = sorted([...actualSet].filter((value) => !expectedSet.has(value)));
  const missing = sorted([...expectedSet].filter((value) => !actualSet.has(value)));
  if (extra.length || missing.length) {
    fail(`${label} mismatch. extra=[${extra.join(', ')}] missing=[${missing.join(', ')}]`);
  }
}

if (!existsSync(codePath)) fail('gas/admin/Code.gs is missing');
if (!existsSync(htmlPath)) fail('gas/admin/index.html is missing');

const code = existsSync(codePath) ? readFileSync(codePath, 'utf8') : '';
const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';

const topLevelFunctions = collectFunctionDeclarations(code)
  .map((decl) => decl.name)
  .filter((name) => !name.endsWith('_'));
compareSets(topLevelFunctions, allowedTopLevelFunctions, 'admin top-level functions');

for (const name of forbiddenTopLevelFunctions) {
  if (new RegExp(`^function\\s+${name}\\s*\\(`, 'm').test(code)) {
    fail(`forbidden admin top-level function remains: ${name}`);
  }
}

if (!/var APP_SECURITY_BOUNDARY = 'admin';/.test(code)) {
  fail('APP_SECURITY_BOUNDARY must be admin');
}
if (!/var PUBLIC_ALLOWED_ACTIONS = \{\};/.test(code)) {
  fail('PUBLIC_ALLOWED_ACTIONS must be empty');
}
if (!/var MEMBER_ALLOWED_ACTIONS = \{\};/.test(code)) {
  fail('MEMBER_ALLOWED_ACTIONS must be empty');
}

const adminLoginBlock = code.match(/var ADMIN_LOGIN_ACTIONS = \{([\s\S]*?)\n\};/);
if (!adminLoginBlock) {
  fail('ADMIN_LOGIN_ACTIONS block not found');
} else {
  const keys = [...adminLoginBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map((match) => match[1]);
  compareSets(keys, allowedAdminLoginActions, 'ADMIN_LOGIN_ACTIONS');
}

const actionHandlers = [...code.matchAll(/if \(action === '([^']+)'\) \{/g)].map((match) => match[1]);
compareSets(actionHandlers, [...allowedAdminLoginActions, ...allowedAdminActions], 'admin processApiRequest action handlers');

for (const action of forbiddenActions) {
  if (new RegExp(`if \\(action === '${action}'\\) \\{`).test(code)) {
    fail(`forbidden admin action handler remains: ${action}`);
  }
}
if (!/if \(requiredPerms\) \{/.test(code) || !/checkAdminBySession_\(\)/.test(code)) {
  fail('admin permission actions must enforce checkAdminBySession_');
}
for (const token of forbiddenHtmlTokens) {
  if (html.includes(token)) {
    fail(`forbidden token appears in gas/admin/index.html: ${token}`);
  }
}

if (failures.length) {
  console.error('[audit-admin-boundary] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit-admin-boundary] PASS');
console.log(`top-level functions: ${topLevelFunctions.join(', ')}`);
console.log(`admin login actions: ${allowedAdminLoginActions.join(', ')}`);
