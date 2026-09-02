// v376.62 release gate: no generated split may reference a gas-src function it
// does not declare.
//
// Why this exists: the build pruner treated only `name(` as a reference, so a
// function passed as a value (`rows.map(mailTemplateRecordFromRow_)`) looked
// unreachable and was deleted from every split. listMailTemplates therefore
// failed in production with "mailTemplateRecordFromRow_ is not defined" from
// v376.42 until it was found on 2026-09-02. Boundary audits did not catch it:
// they check top-level callables and action allowlists, not helper resolution.
//
// The check: for every generated bundle, take the identifiers it actually uses
// that are known gas-src function names, and assert the bundle declares them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFunctionDeclarations, maskCommentsAndStrings } from './gas-boundary-utils.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAS_SRC = path.join(ROOT, 'gas-src', 'Code.full.gs');

// admin ships Code.gs + dryrun.gs into one Apps Script project, so they share
// a global scope and must be validated together.
const BUNDLES = [
  { label: 'public', files: ['backend/Code.gs'] },
  { label: 'member', files: ['gas/member/Code.gs'] },
  { label: 'admin', files: ['gas/admin/Code.gs', 'gas/admin/dryrun.gs'] },
];

const DECLARATION = /(?:^|\n)\s*function\s+([A-Za-z0-9_$]+)\s*\(/g;
const REFERENCE = /(^|[^.\w$])([A-Za-z0-9_$]+)\b/g;

function declaredNames(source) {
  const names = new Set();
  DECLARATION.lastIndex = 0;
  let match;
  while ((match = DECLARATION.exec(source)) !== null) names.add(match[1]);
  return names;
}

const gasSource = fs.readFileSync(GAS_SRC, 'utf8');
// Only top-level declarations matter: names of nested helpers (e.g. the inner
// `record` / `safe` of a dry-run) are local and would be false positives.
const gasSrcFunctions = new Set(collectFunctionDeclarations(gasSource).map((decl) => decl.name));

let failed = false;
for (const bundle of BUNDLES) {
  const sources = bundle.files.map((file) => fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const combined = sources.join('\n');
  const declared = declaredNames(combined);
  const masked = maskCommentsAndStrings(combined);

  const missing = new Map();
  REFERENCE.lastIndex = 0;
  let match;
  while ((match = REFERENCE.exec(masked)) !== null) {
    const name = match[2];
    if (!gasSrcFunctions.has(name) || declared.has(name)) continue;
    missing.set(name, (missing.get(name) || 0) + 1);
  }

  if (missing.size) {
    failed = true;
    console.error(`[test-gas-artifact-refs] FAIL ${bundle.label} (${bundle.files.join(', ')})`);
    for (const [name, count] of [...missing].sort((a, b) => b[1] - a[1])) {
      console.error(`  - ${name} is referenced ${count}x but not declared in this bundle`);
    }
  } else {
    console.log(`[test-gas-artifact-refs] PASS ${bundle.label} (declared ${declared.size} of ${gasSrcFunctions.size} gas-src functions)`);
  }
}

if (failed) {
  console.error('[test-gas-artifact-refs] A split would hit ReferenceError at runtime. Rebuild after fixing reachability.');
  process.exit(1);
}
