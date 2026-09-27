import { execSync } from 'child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  MEMBER_ALLOWED_ACTIONS_LIST,
  collectFunctionDeclarations,
  injectMenuRegistryPlaceholders,
  injectMemberFiscalStatusPlaceholders,
  injectMemberTypesPlaceholders,
  // 2026-09-27: pruner とコード変形は gas-boundary-utils.mjs に一本化（3 箇所の複製を解消）。
  assertAllowedTopLevelFunctions,
  pruneUnreachableFunctionDeclarations,
  removeDisallowedActionHandlers,
  removeIfBlock,
  removeTopLevelFunctionDeclarations,
  replaceObjectLiteral,
} from './gas-boundary-utils.mjs';
import { serializeMenuRegistryForGas } from './menu-registry.mjs';
import { serializeMemberFiscalStatusForGas } from '../src/shared/memberFiscalStatus.mjs';
import { serializeMemberTypesForGas } from '../src/shared/memberTypes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const memberGasDir = join(root, 'gas', 'member');
const fullSourcePath = join(root, 'gas-src', 'Code.full.gs');
const preserveFiles = {
  '.clasp.json': true,
  '.clasp.json.example': true,
  'appsscript.json': true,
  'README.md': true,
};

function run(cmd, env = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}











function buildMemberCode(source) {
  let code = injectMenuRegistryPlaceholders(source, serializeMenuRegistryForGas());
  code = injectMemberFiscalStatusPlaceholders(code, serializeMemberFiscalStatusForGas());
  code = injectMemberTypesPlaceholders(code, serializeMemberTypesForGas());
  code = code.replace("var APP_SECURITY_BOUNDARY = 'public';", "var APP_SECURITY_BOUNDARY = 'member';");
  code = replaceObjectLiteral(code, 'PUBLIC_ALLOWED_ACTIONS', '{}');
  code = replaceObjectLiteral(code, 'ADMIN_LOGIN_ACTIONS', '{}');
  code = replaceObjectLiteral(code, 'ADMIN_ACTION_PERMISSIONS', '{}');
  code = removeDisallowedActionHandlers(code, MEMBER_ALLOWED_ACTIONS_LIST);
  code = removeIfBlock(code, 'requiredPerms');
  code = pruneUnreachableFunctionDeclarations(code, ['doGet', 'processApiRequest'], 'build-member-gas');
  code = removeTopLevelFunctionDeclarations(code, [
    'rebuildDatabaseSchema',
    'cleanupDatabaseSheets',
    'buildDefinedScopeOnly',
    'getDbInfo',
    'seedDemoData',
  ], 'build-member-gas');
  assertAllowedTopLevelFunctions(code, ['doGet', 'processApiRequest'], 'build-member-gas');
  return code;
}

function ensureMemberGasDir() {
  if (!existsSync(memberGasDir)) {
    mkdirSync(memberGasDir, { recursive: true });
    return;
  }
  var entries = readdirSync(memberGasDir, { withFileTypes: true });
  entries.forEach((entry) => {
    if (preserveFiles[entry.name]) {
      return;
    }
    rmSync(join(memberGasDir, entry.name), { recursive: true, force: true });
  });
}

ensureMemberGasDir();

run('npx vite build', { VITE_APP: 'member' });
run('node scripts/compress-html.mjs');

const backendCode = readFileSync(fullSourcePath, 'utf8');
writeFileSync(
  join(memberGasDir, 'Code.gs'),
  buildMemberCode(backendCode),
  'utf8',
);
console.log('Generated gas/member/Code.gs from gas-src/Code.full.gs with member boundary, registry, and action handlers');

// appsscript.json は gas/member/ の固有設定ファイルを使用（backend からコピーしない）
console.log('Kept gas/member/appsscript.json (project-specific, not overwritten)');

copyFileSync(join(root, 'dist', 'index.html'), join(memberGasDir, 'index.html'));
console.log('Copied dist/index.html -> gas/member/index.html');

console.log('\nbuild:gas:member complete.');
