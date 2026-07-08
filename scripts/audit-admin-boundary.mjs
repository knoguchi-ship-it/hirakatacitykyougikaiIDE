import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  collectFunctionDeclarations,
  ADMIN_TOP_LEVEL_FUNCTIONS,
  ADMIN_OPERATOR_TOOL_FUNCTIONS,
  ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS,
  ADMIN_LOGIN_ACTIONS_LIST,
  ADMIN_ALLOWED_ACTIONS_LIST,
} from './gas-boundary-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const codePath = join(root, 'gas', 'admin', 'Code.gs');
// v376.55: operator ツールは dryrun.gs に分離（GAS は全 .gs がグローバルスコープ共有）。
// 監査は「結合コード」に対して従来通り行い、加えてファイルごとの分離状態も検査する。
const dryrunPath = join(root, 'gas', 'admin', 'dryrun.gs');
const htmlPath = join(root, 'gas', 'admin', 'index.html');

// v376.18: 許可 top-level リストは gas-boundary-utils.mjs の ADMIN_TOP_LEVEL_FUNCTIONS に
// 単一情報源化（build-admin-gas.mjs の seed / assertAllowed と共有）。
const allowedTopLevelFunctions = ADMIN_TOP_LEVEL_FUNCTIONS;
// v376.23: action 許可リストは gas-boundary-utils.mjs に単一情報源化（build-admin-gas.mjs と共有）。
const allowedAdminLoginActions = ADMIN_LOGIN_ACTIONS_LIST;
const allowedAdminActions = ADMIN_ALLOWED_ACTIONS_LIST;
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
if (!existsSync(dryrunPath)) fail('gas/admin/dryrun.gs is missing');
if (!existsSync(htmlPath)) fail('gas/admin/index.html is missing');

const mainCode = existsSync(codePath) ? readFileSync(codePath, 'utf8') : '';
const dryrunCode = existsSync(dryrunPath) ? readFileSync(dryrunPath, 'utf8') : '';
const code = `${mainCode}\n${dryrunCode}`;
const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';

const topLevelFunctions = collectFunctionDeclarations(code)
  .map((decl) => decl.name)
  .filter((name) => !name.endsWith('_'));
compareSets(topLevelFunctions, allowedTopLevelFunctions, 'admin top-level functions');

// v376.55: ファイル分離の検査 — Code.gs は doGet/processApiRequest のみ、dryrun.gs はツールのみ
const mainPublic = collectFunctionDeclarations(mainCode)
  .map((decl) => decl.name)
  .filter((name) => !name.endsWith('_'));
compareSets(mainPublic, ['doGet', 'processApiRequest'], 'Code.gs public top-level (operator tools must live in dryrun.gs)');
const dryrunPublic = collectFunctionDeclarations(dryrunCode)
  .map((decl) => decl.name)
  .filter((name) => !name.endsWith('_'));
compareSets(dryrunPublic, ADMIN_OPERATOR_TOOL_FUNCTIONS, 'dryrun.gs operator tools');

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
