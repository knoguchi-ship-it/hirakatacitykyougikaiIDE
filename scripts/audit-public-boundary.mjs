import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectFunctionDeclarations } from './gas-boundary-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const backendDir = join(root, 'backend');
const codePath = join(backendDir, 'Code.gs');
const publicHtmlPath = join(backendDir, 'index_public.html');
const publicSourceDir = join(root, 'src', 'public-portal');

const allowedTopLevelFunctions = ['doGet', 'healthCheck', 'processApiRequest'];
const allowedPublicActions = [
  'submitMemberApplication',
  'getPublicTrainings',
  'getFileThumbnail',
  'getPublicPortalSettings',
  'applyTrainingExternal',
  'cancelTrainingExternal',
  'sendPublicOtp',
  'verifyPublicOtp',
  'lookupMemberForPublicUpdate',
  'submitPublicMemberUpdate',
  'submitPublicBusinessUpdate',
  'addPublicStaffMember',
  'removePublicStaffByCmNumber',
  'submitPublicWithdrawalRequest',
  'verifyMemberIdentityForPublic',
  'submitPublicChangeRequest',
  'getPublicAvailableStaffSlots',
];

const forbiddenTopLevelFunctions = [
  'rebuildDatabaseSchema',
  'getDbInfo',
  'seedDemoData',
  'memberLogin',
  'memberLoginWithData',
  'adminLoginWithData',
  'checkAdminBySession',
  'getMemberPortalData',
  'updateMemberSelf',
  'getAdminDashboardData',
  'getAdminInitData',
  'getSystemSettings',
  'updateSystemSettings',
];

const forbiddenPrivateFunctions = [
  'getAdminDashboardCacheKey_',
  'getTrainingManagementCacheKey_',
  'clearAdminDashboardCache_',
  'clearTrainingManagementCache_',
  'clearRecentAnnualFeeAdminCaches_',
  'getAnnualFeeAdminCacheKey_',
  'clearAnnualFeeAdminCache_',
  'appendAdminAuditLog_',
  'validateBusinessStaffRoleTransition_',
];

const forbiddenHtmlTokens = [
  'memberLogin',
  'memberLoginWithData',
  'adminLoginWithData',
  'checkAdminBySession',
  'getMemberPortalData',
  'updateMemberSelf',
  'getAdminDashboardData',
  'getAdminInitData',
  'getSystemSettings',
  'updateSystemSettings',
  'getAdminChangeRequests',
  'approveAdminChangeRequest',
  'fetchAllData',
];

const forbiddenCodeTokens = [
  'rebuildDatabaseSchema',
  'getDbInfo',
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function compareSets(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const extra = sorted([...actualSet].filter((value) => !expectedSet.has(value)));
  const missing = sorted([...expectedSet].filter((value) => !actualSet.has(value)));
  if (extra.length || missing.length) {
    fail(`${label} mismatch. extra=[${extra.join(', ')}] missing=[${missing.join(', ')}]`);
  }
}

if (!existsSync(codePath)) fail('backend/Code.gs is missing');
if (!existsSync(publicHtmlPath)) fail('backend/index_public.html is missing');
if (existsSync(join(backendDir, 'index.html'))) fail('backend/index.html must not exist in public artifact');
if (existsSync(join(backendDir, 'index_admin.html'))) fail('backend/index_admin.html must not exist in public artifact');

const code = existsSync(codePath) ? readFileSync(codePath, 'utf8') : '';
const publicHtml = existsSync(publicHtmlPath) ? readFileSync(publicHtmlPath, 'utf8') : '';
const publicSource = existsSync(publicSourceDir) ? readFilesRecursive(publicSourceDir).join('\n') : '';

function readFilesRecursive(dir) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const filePath = join(dir, entry);
      const stat = statSync(filePath);
      if (stat.isDirectory()) return readFilesRecursive(filePath);
      if (!/\.(ts|tsx|js|jsx|html)$/.test(entry)) return [];
      return [readFileSync(filePath, 'utf8')];
    });
}

const topLevelFunctions = collectFunctionDeclarations(code)
  .map((decl) => decl.name)
  .filter((name) => !name.endsWith('_'));
compareSets(topLevelFunctions, allowedTopLevelFunctions, 'public top-level functions');

for (const name of forbiddenTopLevelFunctions) {
  if (new RegExp(`^function\\s+${name}\\s*\\(`, 'm').test(code)) {
    fail(`forbidden public top-level function remains: ${name}`);
  }
}

for (const token of forbiddenCodeTokens) {
  if (code.includes(token)) {
    fail(`forbidden public code token remains: ${token}`);
  }
}

for (const name of forbiddenPrivateFunctions) {
  if (new RegExp(`^function\\s+${name}\\s*\\(`, 'm').test(code)) {
    fail(`forbidden admin private helper remains in public artifact: ${name}`);
  }
  if (new RegExp(`\\b${name}\\s*\\(`).test(code)) {
    fail(`forbidden admin private helper call remains in public artifact: ${name}`);
  }
}

const publicAllowedBlock = code.match(/var PUBLIC_ALLOWED_ACTIONS = \{([\s\S]*?)\n\};/);
if (!publicAllowedBlock) {
  fail('PUBLIC_ALLOWED_ACTIONS block not found');
} else {
  const keys = [...publicAllowedBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map((match) => match[1]);
  compareSets(keys, allowedPublicActions, 'PUBLIC_ALLOWED_ACTIONS');
}

const actionHandlers = [...code.matchAll(/if \(action === '([^']+)'\) \{/g)].map((match) => match[1]);
compareSets(actionHandlers, allowedPublicActions, 'processApiRequest action handlers');

const registryMatch = code.match(/function getActionRegistryForCurrentApp_\(\) \{[\s\S]*?return \{([\s\S]*?)\};\s*\}/);
if (!registryMatch) {
  fail('getActionRegistryForCurrentApp_ not found');
} else {
  const registry = registryMatch[1];
  if (!/publicActions:\s*PUBLIC_ALLOWED_ACTIONS/.test(registry)) fail('registry must use PUBLIC_ALLOWED_ACTIONS');
  if (!/memberActions:\s*\{\}/.test(registry)) fail('registry memberActions must be empty');
  if (!/adminLoginActions:\s*\{\}/.test(registry)) fail('registry adminLoginActions must be empty');
  if (!/adminPermissions:\s*\{\}/.test(registry)) fail('registry adminPermissions must be empty');
}

if (/createHtmlOutputFromFile\(['"]index['"]\)/.test(code)) fail('doGet can return member index.html');
if (/createHtmlOutputFromFile\(['"]index_admin['"]\)/.test(code)) fail('doGet can return admin index_admin.html');
if (!/createHtmlOutputFromFile\(route\.file\)/.test(code)) fail('doGet route output not found');
if (!/file:\s*'index_public'/.test(code)) fail('doGet must route to index_public');

for (const token of forbiddenHtmlTokens) {
  if (publicHtml.includes(token)) {
    fail(`forbidden token appears in backend/index_public.html: ${token}`);
  }
}

const publicSourceActions = [
  ...publicSource.matchAll(/callApi(?:<[^>]+>)?\(\s*['"]([^'"]+)['"]/g),
].map((match) => match[1]);
const publicSourceActionSet = new Set(publicSourceActions);
for (const action of publicSourceActionSet) {
  if (!allowedPublicActions.includes(action)) {
    fail(`src/public-portal calls non-public action: ${action}`);
  }
}
for (const action of publicSourceActionSet) {
  if (!actionHandlers.includes(action)) {
    fail(`src/public-portal action has no backend handler: ${action}`);
  }
}
if (publicSourceActionSet.size === 0) {
  fail('src/public-portal has no callApi action calls');
}

if (failures.length) {
  console.error('[audit-public-boundary] FAIL');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('[audit-public-boundary] PASS');
console.log(`top-level functions: ${topLevelFunctions.join(', ')}`);
console.log(`public actions: ${allowedPublicActions.join(', ')}`);
