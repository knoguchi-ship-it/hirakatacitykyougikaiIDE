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

copyFileSync(join(root, 'backend', 'Code.gs'), join(adminGasDir, 'Code.gs'));
console.log('Copied backend/Code.gs -> gas/admin/Code.gs');

// appsscript.json は gas/admin/ の固有設定ファイルを使用（backend からコピーしない）
console.log('Kept gas/admin/appsscript.json (project-specific, not overwritten)');

copyFileSync(join(root, 'dist-admin', 'index_admin.html'), join(adminGasDir, 'index.html'));
console.log('Copied dist-admin/index_admin.html -> gas/admin/index.html');

console.log('\nbuild:gas:admin complete.');
