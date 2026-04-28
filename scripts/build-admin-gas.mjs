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

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const adminGasDir = join(root, 'gas', 'admin');
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

function replaceObjectLiteral(source, name, replacement) {
  const pattern = new RegExp(`var ${name} = \\{[\\s\\S]*?\\n\\};`);
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${name} object literal in Code.gs`);
  }
  return source.replace(pattern, `var ${name} = ${replacement};`);
}

function findBlockEnd(source, openBraceIndex) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openBraceIndex; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error('Could not find action handler block end');
}

function collectFunctionDeclarations(source) {
  const declarations = [];
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }

    if (depth === 0 && source.startsWith('function ', i)) {
      const header = source.slice(i).match(/^function\s+([A-Za-z0-9_]+)\s*\(/);
      if (!header) continue;
      const name = header[1];
      const start = i;
      const openBraceIndex = source.indexOf('{', i + header[0].length);
      if (openBraceIndex === -1) throw new Error(`Could not find function body for ${name}`);
      const end = findBlockEnd(source, openBraceIndex);
      const afterEnd = source[end] === '\r' && source[end + 1] === '\n'
        ? end + 2
        : source[end] === '\n'
        ? end + 1
        : end;
      declarations.push({ name, start, end: afterEnd, body: source.slice(openBraceIndex + 1, end - 1) });
      i = afterEnd - 1;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
  }
  return declarations;
}

function collectTopLevelStatements(source, declarations) {
  const declarationRanges = declarations.map((decl) => [decl.start, decl.end]);
  const statements = [];
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let statementStart = 0;

  function declarationRangeAt(index) {
    return declarationRanges.find(([start, end]) => index >= start && index < end);
  }

  for (let i = 0; i < source.length; i += 1) {
    const range = declarationRangeAt(i);
    if (range) {
      if (statementStart < range[0] && source.slice(statementStart, range[0]).trim()) {
        statements.push({ start: statementStart, end: range[0], text: source.slice(statementStart, range[0]) });
      }
      statementStart = range[1];
      i = range[1] - 1;
      continue;
    }

    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '{' || ch === '[' || ch === '(') depth += 1;
    if (ch === '}' || ch === ']' || ch === ')') depth -= 1;
    if (depth === 0 && ch === ';') {
      const end = source[i + 1] === '\r' && source[i + 2] === '\n'
        ? i + 3
        : source[i + 1] === '\n'
        ? i + 2
        : i + 1;
      const text = source.slice(statementStart, end);
      if (text.trim()) statements.push({ start: statementStart, end, text });
      statementStart = end;
    }
  }
  if (statementStart < source.length && source.slice(statementStart).trim()) {
    statements.push({ start: statementStart, end: source.length, text: source.slice(statementStart) });
  }
  return statements;
}

function collectReachableFunctions(source, seedNames) {
  const declarations = collectFunctionDeclarations(source);
  const declarationByName = new Map(declarations.map((decl) => [decl.name, decl]));
  const declaredNames = new Set(declarationByName.keys());
  const reachable = new Set(seedNames.filter((name) => declaredNames.has(name)));
  const queue = [...reachable];
  const callPattern = /\b([A-Za-z0-9_]+)\s*\(/g;

  while (queue.length) {
    const name = queue.shift();
    const declaration = declarationByName.get(name);
    if (!declaration) continue;
    let match;
    while ((match = callPattern.exec(declaration.body)) !== null) {
      const callee = match[1];
      if (declaredNames.has(callee) && !reachable.has(callee)) {
        reachable.add(callee);
        queue.push(callee);
      }
    }
  }
  return { declarations, reachable };
}

function pruneUnreachableFunctionDeclarations(source, seedNames, label) {
  const { declarations, reachable } = collectReachableFunctions(source, seedNames);
  const removable = declarations.filter((decl) => !reachable.has(decl.name));
  const removableNames = new Set(removable.map((decl) => decl.name));
  const removableTopLevelStatements = collectTopLevelStatements(source, declarations).filter((statement) => (
    [...removableNames].some((name) => new RegExp(`\\b${name}\\b`).test(statement.text))
  ));
  const rangesToRemove = [
    ...removable.map((decl) => ({ start: decl.start, end: decl.end })),
    ...removableTopLevelStatements.map((statement) => ({ start: statement.start, end: statement.end })),
  ].sort((a, b) => a.start - b.start);
  let result = '';
  let cursor = 0;

  for (const range of rangesToRemove) {
    if (range.start < cursor) continue;
    result += source.slice(cursor, range.start);
    cursor = range.end;
  }
  result += source.slice(cursor);
  console.log(`[${label}] Pruned ${removable.length} unreachable function declarations and ${removableTopLevelStatements.length} dependent top-level statements`);
  return result;
}

function removeDisallowedActionHandlers(source, allowedActions) {
  const allowed = new Set(allowedActions);
  const actionPattern = /[ \t]*if \(action === '([^']+)'\) \{/g;
  let result = '';
  let cursor = 0;
  let match;

  while ((match = actionPattern.exec(source)) !== null) {
    const action = match[1];
    const blockStart = match.index;
    const openBraceIndex = actionPattern.lastIndex - 1;
    const blockEnd = findBlockEnd(source, openBraceIndex);
    const afterBlock = source[blockEnd] === '\r' && source[blockEnd + 1] === '\n'
      ? blockEnd + 2
      : source[blockEnd] === '\n'
      ? blockEnd + 1
      : blockEnd;

    if (allowed.has(action)) {
      result += source.slice(cursor, afterBlock);
    } else {
      result += source.slice(cursor, blockStart);
    }
    cursor = afterBlock;
    actionPattern.lastIndex = afterBlock;
  }
  return result + source.slice(cursor);
}

function removeIfBlock(source, conditionText) {
  const marker = `if (${conditionText}) {`;
  const start = source.indexOf(marker);
  if (start === -1) return source;
  const openBraceIndex = start + marker.length - 1;
  const end = findBlockEnd(source, openBraceIndex);
  const afterEnd = source[end] === '\r' && source[end + 1] === '\n'
    ? end + 2
    : source[end] === '\n'
    ? end + 1
    : end;
  return source.slice(0, start) + source.slice(afterEnd);
}

function buildAdminCode(source) {
  let code = source.replace("var APP_SECURITY_BOUNDARY = 'public';", "var APP_SECURITY_BOUNDARY = 'admin';");
  code = replaceObjectLiteral(code, 'PUBLIC_ALLOWED_ACTIONS', '{}');
  code = replaceObjectLiteral(code, 'MEMBER_ALLOWED_ACTIONS', '{}');
  code = removeDisallowedActionHandlers(code, [
    'checkAdminBySession',
    'adminLoginWithData',
    'getDbInfo',
    'getSystemSettings',
    'updateSystemSettings',
    'getAdminPermissionData',
    'saveAdminPermission',
    'deleteAdminPermission',
    'seedDemoData',
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
    'generateRosterZip',
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
    'generateMailingListExcel',
    'getAdminChangeRequests',
    'approveAdminChangeRequest',
    'rejectAdminChangeRequest',
  ]);
  code = removeIfBlock(code, "isMemberAction && !LOGIN_ONLY_MEMBER_ACTIONS[action]");
  code = pruneUnreachableFunctionDeclarations(code, ['doGet', 'processApiRequest'], 'build-admin-gas');
  return code;
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

const backendCode = readFileSync(join(root, 'backend', 'Code.gs'), 'utf8');
writeFileSync(
  join(adminGasDir, 'Code.gs'),
  buildAdminCode(backendCode),
  'utf8',
);
console.log('Copied backend/Code.gs -> gas/admin/Code.gs with admin boundary, registry, and action handlers');

// appsscript.json は gas/admin/ の固有設定ファイルを使用（backend からコピーしない）
console.log('Kept gas/admin/appsscript.json (project-specific, not overwritten)');

copyFileSync(join(root, 'dist-admin', 'index_admin.html'), join(adminGasDir, 'index.html'));
console.log('Copied dist-admin/index_admin.html -> gas/admin/index.html');

console.log('\nbuild:gas:admin complete.');
