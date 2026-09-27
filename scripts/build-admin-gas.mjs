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
  ADMIN_TOP_LEVEL_FUNCTIONS,
  ADMIN_OPERATOR_TOOL_FUNCTIONS,
  ADMIN_SCHEDULED_JOB_FUNCTIONS,
  ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS,
  ADMIN_LOGIN_ACTIONS_LIST,
  ADMIN_ALLOWED_ACTIONS_LIST,
  collectFunctionDeclarations,
  collectFunctionDeclarations as collectFunctionDeclarationsShared,
  injectMenuRegistryPlaceholders,
  injectMemberFiscalStatusPlaceholders,
  injectMemberTypesPlaceholders,
  // 2026-09-27: pruner とコード変形は gas-boundary-utils.mjs に一本化した。
  // 以前は同じ実装がこの 2 つの build と utils の 3 箇所にあり、
  // 「Keep the three in step」と申し送られていたが実際には揃っておらず、
  // 公開ビルドだけ v292/v296 の修正が入っていなかった。
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
const adminGasDir = join(root, 'gas', 'admin');
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











function buildAdminCode(source) {
  let code = injectMenuRegistryPlaceholders(source, serializeMenuRegistryForGas());
  code = injectMemberFiscalStatusPlaceholders(code, serializeMemberFiscalStatusForGas());
  code = injectMemberTypesPlaceholders(code, serializeMemberTypesForGas());
  code = code.replace("var APP_SECURITY_BOUNDARY = 'public';", "var APP_SECURITY_BOUNDARY = 'admin';");
  code = replaceObjectLiteral(code, 'PUBLIC_ALLOWED_ACTIONS', '{}');
  code = replaceObjectLiteral(code, 'MEMBER_ALLOWED_ACTIONS', '{}');
  // v376.23: action 許可リストを gas-boundary-utils.mjs に単一情報源化（audit と共有）。
  // 以前ここに残っていた撤去済 action の stale entry（getMembersForRoster / initRosterExport /
  // v316 テンプレート群など）は実体ハンドラが無く no-op だったため、共有定数化で自然に解消。
  code = removeDisallowedActionHandlers(code, [
    ...ADMIN_LOGIN_ACTIONS_LIST,
    ...ADMIN_ALLOWED_ACTIONS_LIST,
  ]);
  code = removeIfBlock(code, "isMemberAction && !LOGIN_ONLY_MEMBER_ACTIONS[action]");
  // v376.18: seed（保持する根）と assertAllowed（許可 whitelist）は同一集合なので
  // gas-boundary-utils.mjs の ADMIN_TOP_LEVEL_FUNCTIONS に単一情報源化した。
  code = pruneUnreachableFunctionDeclarations(code, ADMIN_TOP_LEVEL_FUNCTIONS, 'build-admin-gas');
  code = removeTopLevelFunctionDeclarations(code, ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS, 'build-admin-gas');
  assertAllowedTopLevelFunctions(code, ADMIN_TOP_LEVEL_FUNCTIONS, 'build-admin-gas');
  return code;
}

// v376.55: operator ツール（editor ▶ 実行用）を Code.gs から抽出して dryrun.gs へ分離する。
// GAS は同一プロジェクト内の全 .gs がグローバルスコープを共有するため、
// dryrun.gs の関数は Code.gs 内の helper / 定数をそのまま参照できる（実行時挙動不変）。
// 2026-09-27: 切り出し先を 2 つに増やした（dryrun.gs / jobs.gs）。
// 本番のトリガーが叩く関数が「dryrun」という名前のファイルに居ると、役割を誤解する。
const ADMIN_GAS_BUCKETS = [
  {
    file: 'jobs.gs',
    names: ADMIN_SCHEDULED_JOB_FUNCTIONS,
    listName: 'ADMIN_SCHEDULED_JOB_FUNCTIONS',
    title: 'jobs.gs — 本番の定期ジョブと、その設定・死活確認（自動生成・手編集禁止）',
    lines: [
      '// 時間主導トリガーが叩くハンドラと、トリガーを作り直す設定関数、死活確認。',
      '// **これらは本番で動く。診断ツール（dryrun.gs）と混ぜないこと。**',
      '// トリガーを足すときは gas-src の SCHEDULED_JOBS_ 登録簿にも足す',
      '// （足さないと npm run test:scheduled-jobs が落ちる）。',
    ],
  },
  {
    file: 'dryrun.gs',
    names: ADMIN_OPERATOR_TOOL_FUNCTIONS,
    listName: 'ADMIN_OPERATOR_TOOL_FUNCTIONS',
    title: 'dryrun.gs — operator ツール集（自動生成・手編集禁止）',
    lines: [
      '// Apps Script editor の関数ドロップダウンから ▶ 実行する診断 / dryRun / backfill ツール。',
      '// 本番で定期実行されるものはここではなく jobs.gs にある。',
    ],
  },
];

function splitAdminBuckets(code) {
  const owner = new Map();
  for (const bucket of ADMIN_GAS_BUCKETS) {
    for (const name of bucket.names) owner.set(name, bucket.file);
  }
  const decls = collectFunctionDeclarationsShared(code).filter((decl) => owner.has(decl.name));
  const foundNames = new Set(decls.map((decl) => decl.name));
  for (const bucket of ADMIN_GAS_BUCKETS) {
    const missing = bucket.names.filter((name) => !foundNames.has(name));
    if (missing.length) {
      throw new Error(`[build-admin-gas] ${bucket.file} functions missing from generated code: ${missing.join(', ')}`);
    }
  }
  const sortedDecls = [...decls].sort((a, b) => a.start - b.start);
  const chunks = new Map(ADMIN_GAS_BUCKETS.map((b) => [b.file, []]));
  let main = '';
  let cursor = 0;
  for (const decl of sortedDecls) {
    main += code.slice(cursor, decl.start);
    chunks.get(owner.get(decl.name)).push(code.slice(decl.start, decl.end));
    cursor = decl.end;
  }
  main += code.slice(cursor);

  const files = {};
  for (const bucket of ADMIN_GAS_BUCKETS) {
    const header = [
      '// ============================================================',
      '// ' + bucket.title,
      ...bucket.lines,
      '// helper / 定数は Code.gs 側に残っており、同一プロジェクトのグローバルスコープで参照される。',
      '// 許可リストの正本: scripts/gas-boundary-utils.mjs ' + bucket.listName,
      '// ============================================================',
      '',
    ].join('\n');
    files[bucket.file] = header + chunks.get(bucket.file).join('\n');
  }
  return { main, files };
}

function ensureAdminGasDir() {
  if (!existsSync(adminGasDir)) {
    mkdirSync(adminGasDir, { recursive: true });
    return;
  }
  const entries = readdirSync(adminGasDir, { withFileTypes: true });
  entries.forEach((entry) => {
    if (preserveFiles[entry.name]) {
      return;
    }
    rmSync(join(adminGasDir, entry.name), { recursive: true, force: true });
  });
}

ensureAdminGasDir();

run('npx vite build', { VITE_APP: 'admin' });
run('node scripts/compress-html.mjs');

const backendCode = readFileSync(fullSourcePath, 'utf8');
const { main: adminMainCode, files: adminSplitFiles } = splitAdminBuckets(buildAdminCode(backendCode));
writeFileSync(join(adminGasDir, 'Code.gs'), adminMainCode, 'utf8');
for (const [fileName, contents] of Object.entries(adminSplitFiles)) {
  writeFileSync(join(adminGasDir, fileName), contents, 'utf8');
}
console.log('Generated gas/admin/Code.gs + jobs.gs + dryrun.gs from gas-src/Code.full.gs with admin boundary, registry, and action handlers');
console.log(`Scheduled jobs in jobs.gs: ${ADMIN_SCHEDULED_JOB_FUNCTIONS.join(', ')}`);
console.log(`Operator tools in dryrun.gs: ${ADMIN_OPERATOR_TOOL_FUNCTIONS.join(', ')}`);

// appsscript.json は gas/admin/ の固有設定ファイルを使用（backend からコピーしない）
console.log('Kept gas/admin/appsscript.json (project-specific, not overwritten)');

copyFileSync(join(root, 'dist-admin', 'index_admin.html'), join(adminGasDir, 'index.html'));
console.log('Copied dist-admin/index_admin.html -> gas/admin/index.html');

console.log('\nbuild:gas:admin complete.');
