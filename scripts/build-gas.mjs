// scripts/build-gas.mjs
// GAS デプロイ用ビルド: 会員ポータルと公開ポータルを順番にビルドし backend/ にコピー

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  assertAllowedTopLevelFunctions,
  injectMenuRegistryPlaceholders,
  injectMemberFiscalStatusPlaceholders,
  injectMemberTypesPlaceholders,
  pruneUnreachableFunctionDeclarations,
  removeDisallowedActionHandlers,
  removeIfBlock,
  replaceObjectLiteral,
  replaceScriptRoutesWithPublicOnly,
  PUBLIC_ALLOWED_ACTIONS_LIST,
  buildInputFingerprint,
  stampBuildFingerprint,
} from './gas-boundary-utils.mjs';
import { createHash } from 'node:crypto';
import { serializeMenuRegistryForGas } from './menu-registry.mjs';
import { serializeMemberFiscalStatusForGas } from '../src/shared/memberFiscalStatus.mjs';
import { serializeMemberTypesForGas } from '../src/shared/memberTypes.mjs';

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
  // 2026-09-27: 公開側はメニュー登録簿を空で注入する。登録簿は admin の権限判定用で、
  // 公開の action registry は adminPermissions: {} なので一切使わない。
  // admin 専用の action 名を公開の生成物に残さない（audit-public-boundary の禁止トークン検査）。
  //
  // v376.105 まではこれが要らなかった。壊れていた pruner が「文字列 'getDbInfo' を含む
  // top-level 文」を誤って丸ごと削除しており、結果として登録簿ごと消えていたため（v292 の誤マッチ）。
  // pruner を正しくしたら登録簿が残るようになり、本来必要だった処理が表に出た。
  let code = injectMenuRegistryPlaceholders(source, [
    'var MENU_REGISTRY = [];',
    'var ACTION_TO_MENU = {};',
    'var LEGACY_ROLE_TO_MENUS = {};',
    'var LEGACY_ROLE_TRAINING_SCOPE = {};',
    'var INITIAL_ROLE_DEFINITIONS = [];',
    'var LEGACY_CODE_TO_INITIAL_ROLE_ID = {};',
  ].join('\n'));
  code = injectMemberFiscalStatusPlaceholders(code, serializeMemberFiscalStatusForGas());
  code = injectMemberTypesPlaceholders(code, serializeMemberTypesForGas());
  code = code.replace("var APP_SECURITY_BOUNDARY = 'public';", "var APP_SECURITY_BOUNDARY = 'public';");
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
  code = removeDisallowedActionHandlers(code, PUBLIC_ALLOWED_ACTIONS_LIST);
  code = removeIfBlock(code, 'requiredPerms');
  code = removeIfBlock(code, "isMemberAction && !LOGIN_ONLY_MEMBER_ACTIONS[action]");
  code = code.replace(
    /\n\s*\/\/ 会員セッショントークン検証:[\s\S]*?var LOGIN_ONLY_MEMBER_ACTIONS = \{ memberLogin: true, memberLoginWithData: true \};\n/,
    '\n',
  );
  code = removeIfBlock(code, '!adminSession && !skipAdminCheck');
  code = removeIfBlock(code, "enableAdminRoleValidation && memberTypeCode === 'BUSINESS' && currentMemberStatus !== 'WITHDRAWN' && Object.prototype.hasOwnProperty.call(payload, 'staff')");
  code = removeIfBlock(code, 'enableAdminAudit && effectiveAdminSession && effectiveAdminSession.email');
  code = code
    .replace(/\n\s*clearAdminDashboardCache_\(\);\n/g, '\n')
    .replace(/\n\s*clearTrainingManagementCache_\(\);\n/g, '\n')
    .replace(/\n\s*clearRecentAnnualFeeAdminCaches_\(\);\n/g, '\n');
  code = code.replace(/rebuildDatabaseSchema\(\)/g, 'schema maintenance');
  code = code.replace(/[ \t]+$/gm, '');
  code = pruneUnreachableFunctionDeclarations(code, ['doGet', 'processApiRequest', 'healthCheck'], 'build-gas-public');
  assertAllowedTopLevelFunctions(code, ['doGet', 'processApiRequest', 'healthCheck'], 'build-gas-public');
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


// 生成物の鮮度を刻む（docs/296 §4.1）。入力は gas-src 本体・このビルドスクリプト・共通変形ヘルパ。
// test:gas-build-sync が同じ入力を再ハッシュして突き合わせ、build 忘れを検出する。
const buildFingerprint = buildInputFingerprint(createHash, [
  readFileSync(fullSourcePath, 'utf8'),
  readFileSync(new URL(import.meta.url), 'utf8'),
  readFileSync(new URL('./gas-boundary-utils.mjs', import.meta.url), 'utf8'),
]);

const fullSource = readFileSync(fullSourcePath, 'utf8');
writeFileSync(join(backendDir, 'Code.gs'), stampBuildFingerprint(buildPublicCode(fullSource), buildFingerprint), 'utf8');
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
