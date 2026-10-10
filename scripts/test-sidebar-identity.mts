/**
 * 2026-10-10 回帰テスト: サイドバーに本人の名前を出す（docs/302 §2）。
 *
 * 管理画面は会員データを読まないため、サイドバーは管理者を常に「システム管理者」「A」と
 * 固定表記していた。誰としてログインしているかが画面から分からない。
 * 認証が返す personName（名前だけ）を使い、アイコンには名前の 1 文字目を出す。
 * 部品を実際に描画して確かめる（esbuild で JSX を変換し react-dom/server で文字列化）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const out = await esbuild.build({
  stdin: {
    contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import Sidebar from './src/components/Sidebar';
      export function render(props) {
        return renderToStaticMarkup(React.createElement(Sidebar, {
          currentView: 'admin', onChangeView() {}, onLogout() {}, memberPageTypeLabel: '',
          showAdminPage: true, ...props,
        }));
      }`,
    resolveDir: ROOT,
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  jsx: 'automatic',
  logLevel: 'silent',
  alias: { '@': ROOT, '@shared': path.join(ROOT, 'src', 'shared') },
});
const mod = { exports: {} as { render: (p: Record<string, unknown>) => string } };
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
const render = mod.exports.render;

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('管理者は本人の名前と、名前の 1 文字目のアイコンを出す。権限は下の行のまま', () => {
  const t = text(render({ role: 'ADMIN', adminPermissionLevel: 'MASTER', isMaster: true, allowedMenus: [], adminPersonName: '野口 健太' }));
  assert.match(t, /野口 健太/);
  assert.doesNotMatch(t, /システム管理者/);
  assert.match(t, / 野 /, 'アイコンが名前の 1 文字目');
  assert.match(t, /管理者権限: マスター/);
});

test('名前が取れない管理者だけ、従来の汎用表記にする', () => {
  const t = text(render({ role: 'ADMIN', adminPermissionLevel: 'MASTER', isMaster: true, allowedMenus: [] }));
  assert.match(t, /システム管理者/);
  assert.match(t, / A /);
});

test('会員は会員の名前と、その 1 文字目のアイコン', () => {
  const t = text(render({
    role: 'MEMBER', showAdminPage: false, showMemberPages: true, memberPageTypeLabel: '個人会員',
    currentUser: { lastName: '山田', firstName: '花子', type: 'INDIVIDUAL' },
  }));
  assert.match(t, /山田 花子/);
  assert.match(t, / 山 /);
});
