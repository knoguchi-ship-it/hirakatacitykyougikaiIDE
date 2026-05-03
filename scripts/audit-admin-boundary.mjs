import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectFunctionDeclarations } from './gas-boundary-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const codePath = join(root, 'gas', 'admin', 'Code.gs');
const htmlPath = join(root, 'gas', 'admin', 'index.html');

const allowedTopLevelFunctions = ['doGet', 'processApiRequest'];
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
  'uploadTrainingFile',
  'setupTrainingFileFolder',
  'getTrainingManagementData',
  'getTrainingApplicants',
  'sendTrainingReminder',
  'getAdminEmailAliases',
  'sendTrainingMail',
  'generateTrainingEmail',
  'getMembersForRoster',
  'validateTemplateSpreadsheet',
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
  'initRosterExport',
  'processRosterChunk',
  'finalizeRosterExport',
  'cleanupRosterExport',
  'getMailingListTargets',
  'generateMailingListExcel',
  'getAdminChangeRequests',
  'approveAdminChangeRequest',
  'rejectAdminChangeRequest',
  // v295: 役員管理マスタ
  'getOfficerMasterData',
  'saveOrganization',
  'deleteOrganization',
  'saveOfficerRole',
  'deleteOfficerRole',
  'savePaymentType',
  'deletePaymentType',
  // v295: 役員割当て管理
  'getOfficerManagementData',
  'assignOfficer',
  'resignOfficer',
  // v295: 振込口座管理
  'getAdminBankAccount',
  'saveAdminBankAccount',
  'deleteAdminBankAccount',
  // v295: 支払い履歴管理
  'getPaymentHistory',
  'savePayment',
  'deletePayment',
];
const forbiddenTopLevelFunctions = [
  'rebuildDatabaseSchema',
  'cleanupDatabaseSheets',
  'buildDefinedScopeOnly',
  'getDbInfo',
  'seedDemoData',
  'addDeleteLogSheet',
];
const forbiddenActions = [
  'memberLogin',
  'memberLoginWithData',
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
