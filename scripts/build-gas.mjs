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

// 会員ポータル（会員専用モード: 管理者ログインタブを非表示）
run('npx vite build', { VITE_APP: 'member' });

// 公開ポータル
run('npx vite build', { VITE_APP: 'public' });

// 管理者ポータル（管理者専用モード）
run('npx vite build', { VITE_APP: 'admin' });

// 圧縮: deflate-raw + base64 でインライン JS を圧縮（new Function() で実行、GAS CSP 互換）
run('node scripts/compress-html.mjs', {});

copyFileSync(join(root, 'dist', 'index.html'), join(backendDir, 'index.html'));
console.log('Copied dist/index.html → backend/index.html');

copyFileSync(join(root, 'dist-public', 'index_public.html'), join(backendDir, 'index_public.html'));
console.log('Copied dist-public/index_public.html → backend/index_public.html');

copyFileSync(join(root, 'dist-admin', 'index_admin.html'), join(backendDir, 'index_admin.html'));
console.log('Copied dist-admin/index_admin.html → backend/index_admin.html');

// gas/admin/index.html も同期（admin split は gas/admin/ 以下を push するため）
copyFileSync(join(root, 'dist-admin', 'index_admin.html'), join(root, 'gas', 'admin', 'index.html'));
console.log('Copied dist-admin/index_admin.html → gas/admin/index.html');

console.log('\nbuild:gas complete.');
