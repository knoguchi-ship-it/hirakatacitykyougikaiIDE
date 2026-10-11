// 固定 deployment 4 本の向き先を本番から読み、HANDOVER.md の「本番」行と突き合わせる（2026-10-11 新設）。
//
// 確かめること:
//   1. 4 本とも存在する（ID が変わっていない）
//   2. public の 2 本が同じ版を向いている
//   3. HANDOVER.md の「本番: public @N×2 / member @M / admin @K」と一致する（文書の更新漏れ）
//
// Apps Script API を読むだけで何も変えない。clasp の認証が要るので prerelease には入れない。
// 使い方: npm run release:verify（リリースの redeploy と HANDOVER 更新の後）
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CLASP_PROJECTS } from './release-config.mjs';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const problems = [];
const actual = {};

for (const project of CLASP_PROJECTS) {
  const r = spawnSync('npx', ['clasp', 'list-deployments'], {
    cwd: path.join(root, project.dir), encoding: 'utf8', shell: process.platform === 'win32', timeout: 120000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  if (r.status !== 0) {
    console.error(out);
    console.error(`✗ ${project.key} の deployment を読めませんでした。認証切れなら operator が \`! npx clasp login\`。`);
    process.exit(1);
  }
  const versions = project.deployments.map((id) => {
    const m = out.match(new RegExp(id.replace(/[-]/g, '\\-') + ' @(\\d+)'));
    if (!m) problems.push(`${project.key}: 固定 deployment ${id.slice(0, 12)}… が見つからない（ID が変わった？）`);
    return m ? Number(m[1]) : null;
  });
  if (new Set(versions).size > 1) problems.push(`${project.key}: 固定 deployment の版がそろっていない（${versions.join(' / ')}）`);
  actual[project.key] = versions[0];
  console.log(`${project.key.padEnd(7)} @${versions.join(', @')}`);
}

const handover = fs.readFileSync(path.join(root, 'HANDOVER.md'), 'utf8');
const line = handover.match(/本番\*\*: public \*\*@(\d+)×2\*\* \/ member \*\*@(\d+)\*\* \/ admin \*\*@(\d+)\*\*/);
if (!line) {
  problems.push('HANDOVER.md に「本番: public @N×2 / member @M / admin @K」の行が見つからない');
} else {
  const written = { public: Number(line[1]), member: Number(line[2]), admin: Number(line[3]) };
  for (const key of Object.keys(written)) {
    if (written[key] !== actual[key]) {
      problems.push(`HANDOVER.md の ${key} は @${written[key]}、本番は @${actual[key]}（文書の更新漏れ、または切り替え漏れ）`);
    }
  }
}

if (problems.length) {
  console.error('\n✗ ' + problems.join('\n✗ '));
  process.exit(1);
}
console.log('\n✓ 固定 deployment 4 本と HANDOVER.md が一致しています。');
