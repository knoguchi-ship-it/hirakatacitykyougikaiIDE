// scripts/build-gas.mjs
// GAS デプロイ用ビルド: 会員ポータルと公開ポータルを順番にビルドし backend/ にコピー

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  pruneUnreachableFunctionDeclarations,
  removeDisallowedActionHandlers,
  removeIfBlock,
  replaceObjectLiteral,
  replaceScriptRoutesWithPublicOnly,
} from './gas-boundary-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const backendDir = join(root, 'backend');
const fullSourcePath = join(root, 'gas-src', 'Code.full.gs');

if (!existsSync(backendDir)) {
  mkdirSync(backendDir, { recursive: true });
}

function run(cmd, env = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

function buildPublicCode(source) {
  let code = source.replace("var APP_SECURITY_BOUNDARY = 'public';", "var APP_SECURITY_BOUNDARY = 'public';");
  code = replaceScriptRoutesWithPublicOnly(code);
  code = replaceObjectLiteral(code, 'MEMBER_ALLOWED_ACTIONS', '{}');
  code = replaceObjectLiteral(code, 'ADMIN_LOGIN_ACTIONS', '{}');
  code = replaceObjectLiteral(code, 'ADMIN_ACTION_PERMISSIONS', '{}');
  code = code
    .replace(/\nvar MEMBER_ALLOWED_ACTIONS = \{\};\n/, '\n')
    .replace(/\nvar ADMIN_LOGIN_ACTIONS = \{\};\n/, '\n')
    .replace(/\nvar ADMIN_ACTION_PERMISSIONS = \{\};\n/, '\n');
  code = code.replace(
    /function getActionRegistryForCurrentApp_\(\) \{[\s\S]*?\n\}/,
    "function getActionRegistryForCurrentApp_() {\n  return {\n    publicActions: PUBLIC_ALLOWED_ACTIONS,\n    memberActions: {},\n    adminLoginActions: {},\n    adminPermissions: {},\n  };\n}",
  );
  code = removeDisallowedActionHandlers(code, [
    'getPublicTrainings',
    'getPublicPortalSettings',
    'getFileThumbnail',
    'applyTrainingExternal',
    'cancelTrainingExternal',
    'submitMemberApplication',
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
  ]);
  code = removeIfBlock(code, 'requiredPerms');
  code = removeIfBlock(code, "isMemberAction && !LOGIN_ONLY_MEMBER_ACTIONS[action]");
  code = code.replace(
    /\n\s*\/\/ 会員セッショントークン検証:[\s\S]*?var LOGIN_ONLY_MEMBER_ACTIONS = \{ memberLogin: true, memberLoginWithData: true \};\n/,
    '\n',
  );
  code = removeIfBlock(code, '!adminSession && !skipAdminCheck');
  code = pruneUnreachableFunctionDeclarations(code, ['doGet', 'processApiRequest'], 'build-gas-public');
  return code;
}

// 会員ポータル（会員専用モード: 管理者ログインタブを非表示）
run('npx vite build', { VITE_APP: 'member' });

// 公開ポータル
run('npx vite build', { VITE_APP: 'public' });

// 管理者ポータル（管理者専用モード）
run('npx vite build', { VITE_APP: 'admin' });

// 圧縮: deflate-raw + base64 でインライン JS を圧縮（new Function() で実行、GAS CSP 互換）
run('node scripts/compress-html.mjs', {});

const fullSource = readFileSync(fullSourcePath, 'utf8');
writeFileSync(join(backendDir, 'Code.gs'), buildPublicCode(fullSource), 'utf8');
console.log('Generated backend/Code.gs from gas-src/Code.full.gs with public-only boundary');

copyFileSync(join(root, 'dist-public', 'index_public.html'), join(backendDir, 'index_public.html'));
console.log('Copied dist-public/index_public.html → backend/index_public.html');

rmSync(join(backendDir, 'index.html'), { force: true });
rmSync(join(backendDir, 'index_admin.html'), { force: true });
console.log('Removed backend/index.html and backend/index_admin.html from public-only artifact');

// gas/admin/index.html も同期（admin split は gas/admin/ 以下を push するため）
copyFileSync(join(root, 'dist-admin', 'index_admin.html'), join(root, 'gas', 'admin', 'index.html'));
console.log('Copied dist-admin/index_admin.html → gas/admin/index.html');

// gas/member/index.html も同期（member split は gas/member/ 以下を push するため）
copyFileSync(join(root, 'dist', 'index.html'), join(root, 'gas', 'member', 'index.html'));
console.log('Copied dist/index.html → gas/member/index.html');

console.log('\nbuild:gas complete.');
