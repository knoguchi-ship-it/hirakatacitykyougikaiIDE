import { execSync } from 'child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const memberGasDir = join(root, 'gas', 'member');
const preserveFiles = {
  '.clasp.json.example': true,
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

copyFileSync(join(root, 'backend', 'Code.gs'), join(memberGasDir, 'Code.gs'));
console.log('Copied backend/Code.gs -> gas/member/Code.gs');

copyFileSync(join(root, 'backend', 'appsscript.json'), join(memberGasDir, 'appsscript.json'));
console.log('Copied backend/appsscript.json -> gas/member/appsscript.json');

copyFileSync(join(root, 'dist', 'index.html'), join(memberGasDir, 'index.html'));
console.log('Copied dist/index.html -> gas/member/index.html');

console.log('\nbuild:gas:member complete.');
