// scripts/build-gas.mjs
// GAS デプロイ用ビルド: 会員ポータルと公開ポータルを順番にビルドし backend/ にコピー

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const backendDir = join(root, 'backend');

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

// 会員ポータル
run('npx vite build', {});
copyFileSync(join(root, 'dist', 'index.html'), join(backendDir, 'index.html'));
console.log('Copied dist/index.html → backend/index.html');

// 公開ポータル
run('npx vite build', { VITE_APP: 'public' });
copyFileSync(join(root, 'dist-public', 'index_public.html'), join(backendDir, 'index_public.html'));
console.log('Copied dist-public/index_public.html → backend/index_public.html');

console.log('\nbuild:gas complete.');
