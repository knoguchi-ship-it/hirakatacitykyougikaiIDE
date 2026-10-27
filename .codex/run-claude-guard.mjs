#!/usr/bin/env node
/** Run the canonical guard with Codex-specific, fail-closed behavior enabled. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const guard = process.argv[2];
if (!['guard-bash.mjs', 'guard-browser.mjs'].includes(guard)) {
  throw new Error('Unsupported Codex guard');
}

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
process.env.CODEX_HOOK_RUNTIME = '1';
process.env.CODEX_GUARD_KIND = guard;
await import(pathToFileURL(path.join(root, '.claude', 'hooks', guard)).href);
