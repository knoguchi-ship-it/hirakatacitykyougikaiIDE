export function replaceObjectLiteral(source, name, replacement) {
  const pattern = new RegExp(`var ${name} = \\{[\\s\\S]*?\\n\\};`);
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${name} object literal in Code.gs`);
  }
  return source.replace(pattern, `var ${name} = ${replacement};`);
}

export function findBlockEnd(source, openBraceIndex) {
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
  throw new Error('Could not find block end');
}

export function collectFunctionDeclarations(source) {
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

export function collectTopLevelStatements(source, declarations) {
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

export function collectReachableFunctions(source, seedNames) {
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
    const bodyForCalls = maskCommentsAndStrings(declaration.body);
    let match;
    while ((match = callPattern.exec(bodyForCalls)) !== null) {
      const callee = match[1];
      if (declaredNames.has(callee) && !reachable.has(callee)) {
        reachable.add(callee);
        queue.push(callee);
      }
    }
  }
  return { declarations, reachable };
}

export function maskCommentsAndStrings(source) {
  let result = '';
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') {
        lineComment = false;
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        result += '  ';
        i += 1;
      } else {
        result += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        result += ' ';
      } else if (ch === '\\') {
        escaped = true;
        result += ' ';
      } else if (ch === quote) {
        quote = '';
        result += ' ';
      } else {
        result += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      result += '  ';
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      result += '  ';
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      result += ' ';
      continue;
    }
    result += ch;
  }
  return result;
}

export function pruneUnreachableFunctionDeclarations(source, seedNames, label) {
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

export function assertAllowedTopLevelFunctions(source, allowedNames, label) {
  const allowed = new Set(allowedNames);
  const publicTopLevel = collectFunctionDeclarations(source)
    .map((decl) => decl.name)
    .filter((name) => !name.endsWith('_'));
  const disallowed = publicTopLevel.filter((name) => !allowed.has(name));
  if (disallowed.length) {
    throw new Error(`[${label}] Disallowed public top-level functions: ${disallowed.join(', ')}`);
  }
  console.log(`[${label}] Public top-level functions: ${publicTopLevel.join(', ')}`);
}

export function removeDisallowedActionHandlers(source, allowedActions) {
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

export function removeIfBlock(source, conditionText) {
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

export function replaceScriptRoutesWithPublicOnly(source) {
  const pattern = /var SCRIPT_ID_ROUTES = \{[\s\S]*?\n  \};/;
  const replacement = "var SCRIPT_ID_ROUTES = {\n    '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL': { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' },\n  };";
  if (!pattern.test(source)) {
    throw new Error('Could not find SCRIPT_ID_ROUTES object literal in Code.gs');
  }
  return source.replace(pattern, replacement);
}
