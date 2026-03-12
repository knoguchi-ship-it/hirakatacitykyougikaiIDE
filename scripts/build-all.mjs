// scripts/build-all.mjs
// 会員ポータルと公開ポータルを順番にビルドする

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

// 公開ポータル
run('npx vite build', { VITE_APP: 'public' });

console.log('\nBuild complete.');
