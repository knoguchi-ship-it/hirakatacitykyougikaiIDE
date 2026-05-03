import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectFunctionDeclarations } from './gas-boundary-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const codePath = join(root, 'gas', 'member', 'Code.gs');
const htmlPath = join(root, 'gas', 'member', 'index.html');

const allowedTopLevelFunctions = ['doGet', 'processApiRequest'];
const allowedMemberActions = [
  'memberLogin',
  'memberLoginWithData',
  'getMemberPortalData',
  'updateMemberSelf',
  'changePassword',
  'applyTraining',
  'cancelTraining',
  'withdrawSelf',
  'cancelWithdrawalSelf',
  // v295: 役員自己サービス（役員のみ — サーバー側で isActiveOfficer_ を追加検証）
  'getMyOfficerStatus',
  'saveMyBankAccount',
  // v296: 請求（役員のみ）
  'getMyClaims',
  'submitClaim',
  'deleteMyClaim',
  'uploadClaimAttachment',
  'removeClaimAttachment',
];
const forbiddenTopLevelFunctions = [
  'rebuildDatabaseSchema',
  'cleanupDatabaseSheets',
  'buildDefinedScopeOnly',
  'getDbInfo',
  'seedDemoData',
  'addDeleteLogSheet',
];
const forbiddenCodeTokens = [
  'ADMIN_ACTION_PERMISSIONS = {',
  'ADMIN_LOGIN_ACTIONS = {',
  'PUBLIC_ALLOWED_ACTIONS = {',
];
const forbiddenHtmlTokens = [
  'adminLoginWithData',
  'checkAdminBySession',
  'getAdminDashboardData',
  'fetchAllData',
  'getPublicTrainings',
  'submitMemberApplication',
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

if (!existsSync(codePath)) fail('gas/member/Code.gs is missing');
if (!existsSync(htmlPath)) fail('gas/member/index.html is missing');

const code = existsSync(codePath) ? readFileSync(codePath, 'utf8') : '';
const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';

const topLevelFunctions = collectFunctionDeclarations(code)
  .map((decl) => decl.name)
  .filter((name) => !name.endsWith('_'));
compareSets(topLevelFunctions, allowedTopLevelFunctions, 'member top-level functions');

for (const name of forbiddenTopLevelFunctions) {
  if (new RegExp(`^function\\s+${name}\\s*\\(`, 'm').test(code)) {
    fail(`forbidden member top-level function remains: ${name}`);
  }
}

if (!/var APP_SECURITY_BOUNDARY = 'member';/.test(code)) {
  fail('APP_SECURITY_BOUNDARY must be member');
}
if (!/var PUBLIC_ALLOWED_ACTIONS = \{\};/.test(code)) {
  fail('PUBLIC_ALLOWED_ACTIONS must be empty');
}
if (!/var ADMIN_LOGIN_ACTIONS = \{\};/.test(code)) {
  fail('ADMIN_LOGIN_ACTIONS must be empty');
}
if (!/var ADMIN_ACTION_PERMISSIONS = \{\};/.test(code)) {
  fail('ADMIN_ACTION_PERMISSIONS must be empty');
}
for (const token of forbiddenCodeTokens) {
  if (code.includes(token) && !code.includes(`${token}};`)) {
    fail(`forbidden non-empty registry token appears: ${token}`);
  }
}

const memberAllowedBlock = code.match(/var MEMBER_ALLOWED_ACTIONS = \{([\s\S]*?)\n\};/);
if (!memberAllowedBlock) {
  fail('MEMBER_ALLOWED_ACTIONS block not found');
} else {
  const keys = [...memberAllowedBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map((match) => match[1]);
  compareSets(keys, allowedMemberActions, 'MEMBER_ALLOWED_ACTIONS');
}

const actionHandlers = [...code.matchAll(/if \(action === '([^']+)'\) \{/g)].map((match) => match[1]);
compareSets(actionHandlers, allowedMemberActions, 'member processApiRequest action handlers');

if (!/sessionToken/.test(code) || !/member_session_expired/.test(code)) {
  fail('member actions must enforce server-side sessionToken principal binding');
}
for (const token of forbiddenHtmlTokens) {
  if (html.includes(token)) {
    fail(`forbidden token appears in gas/member/index.html: ${token}`);
  }
}

if (failures.length) {
  console.error('[audit-member-boundary] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit-member-boundary] PASS');
console.log(`top-level functions: ${topLevelFunctions.join(', ')}`);
console.log(`member actions: ${allowedMemberActions.join(', ')}`);
