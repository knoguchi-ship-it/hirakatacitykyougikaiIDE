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
import { MEMBER_ALLOWED_ACTIONS_LIST, injectMenuRegistryPlaceholders, injectMemberFiscalStatusPlaceholders,
  injectMemberTypesPlaceholders, maskCommentsAndStrings } from './gas-boundary-utils.mjs';
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
      if (openBraceIndex === -1) {
        throw new Error(`Could not find function body for ${name}`);
      }
      const end = findBlockEnd(source, openBraceIndex);
      const afterEnd = source[end] === '\r' && source[end + 1] === '\n'
        ? end + 2
        : source[end] === '\n'
        ? end + 1
        : end;
      declarations.push({
        name,
        start,
        end: afterEnd,
        body: source.slice(openBraceIndex + 1, end - 1),
      });
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

  function isInsideDeclaration(index) {
    return declarationRanges.some(([start, end]) => index >= start && index < end);
  }

  for (let i = 0; i < source.length; i += 1) {
    if (isInsideDeclaration(i)) {
      const range = declarationRanges.find(([start, end]) => i >= start && i < end);
      if (range) {
        if (statementStart < range[0] && source.slice(statementStart, range[0]).trim()) {
          statements.push({ start: statementStart, end: range[0], text: source.slice(statementStart, range[0]) });
        }
        statementStart = range[1];
        i = range[1] - 1;
        continue;
      }
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
  // AGENTS DRY note: this pruner is duplicated in build-admin-gas.mjs /
  // build-member-gas.mjs / gas-boundary-utils.mjs. Keep the three in step.
  // A function used as a value (e.g. rows.map(recordFromRow_)) is a real
  // reference too. Counting only call syntax pruned such helpers out of every
  // split and broke listMailTemplates in production from v376.42 to v376.61.
  const callPattern = /\b([A-Za-z0-9_]+)\s*\(/g;
  const referencePattern = /(^|[^.\w$])([A-Za-z0-9_]+)\b(?!\s*\()/g;

  while (queue.length) {
    const name = queue.shift();
    const declaration = declarationByName.get(name);
    if (!declaration) continue;
    // Comments and string literals must not create reachability: a function name
    // mentioned in a comment used to keep dead code alive (and, with reference
    // scanning, could retain a forbidden top-level callable).
    const body = maskCommentsAndStrings(declaration.body);
    const visit = (callee) => {
      if (declaredNames.has(callee) && !reachable.has(callee)) {
        reachable.add(callee);
        queue.push(callee);
      }
    };
    callPattern.lastIndex = 0;
    let match;
    while ((match = callPattern.exec(body)) !== null) visit(match[1]);
    referencePattern.lastIndex = 0;
    let reference;
    while ((reference = referencePattern.exec(body)) !== null) visit(reference[2]);
  }
  return { declarations, reachable };
}

function pruneUnreachableFunctionDeclarations(source, seedNames, label) {
  const { declarations, reachable } = collectReachableFunctions(source, seedNames);
  const removable = declarations.filter((decl) => !reachable.has(decl.name));
  const removableNames = new Set(removable.map((decl) => decl.name));
  const topLevelStatements = collectTopLevelStatements(source, declarations);
  // 文字列リテラルを除去してからマッチ:
  // - 'getDbInfo' のような文字列キーへの誤マッチを防ぐ（v292 修正）
  // - = addPublicStaffMember_ のような値参照も正しく検出する（v296 修正）
  const removableTopLevelStatements = topLevelStatements.filter((statement) => {
    const stripped = statement.text.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '``');
    return [...removableNames].some((name) => new RegExp(`\\b${name}\\b`).test(stripped));
  });
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

function removeTopLevelFunctionDeclarations(source, namesToRemove, label) {
  const declarations = collectFunctionDeclarations(source);
  const removeNames = new Set(namesToRemove);
  const rangesToRemove = declarations
    .filter((decl) => removeNames.has(decl.name))
    .map((decl) => ({ start: decl.start, end: decl.end, name: decl.name }))
    .sort((a, b) => a.start - b.start);

  let result = '';
  let cursor = 0;
  const removed = [];
  for (const range of rangesToRemove) {
    if (range.start < cursor) continue;
    result += source.slice(cursor, range.start);
    cursor = range.end;
    removed.push(range.name);
  }
  result += source.slice(cursor);
  if (removed.length) {
    console.log(`[${label}] Removed top-level functions: ${removed.join(', ')}`);
  }
  return result;
}

function assertAllowedTopLevelFunctions(source, allowedNames, label) {
  const allowed = new Set(allowedNames);
  const topLevelFunctions = collectFunctionDeclarations(source)
    .map((decl) => decl.name)
    .filter((name) => !name.endsWith('_'));
  const disallowed = topLevelFunctions.filter((name) => !allowed.has(name));
  if (disallowed.length) {
    throw new Error(`[${label}] Disallowed top-level callable functions: ${disallowed.join(', ')}`);
  }
  console.log(`[${label}] Top-level callable functions: ${topLevelFunctions.join(', ')}`);
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
