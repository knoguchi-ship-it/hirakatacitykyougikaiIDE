/**
 * 2026-10-10 回帰テスト: ロール視点プレビューは、そのロールの権限で実際に操作する（docs/246 改訂・docs/302 §2）。
 *
 * 背景: 以前はクライアントで書き込みを止める「閲覧のみ」だった。それではそのロールで本当に
 * 操作できるかを確かめられず、しかも callApi を直接使う画面（変更申請の承認・却下）は止まらず、
 * 「閲覧のみ」と表示しながら実データを書き換えていた。サーバー上は MASTER として通っていた。
 *
 *   1. なりすましは実際の操作者が MASTER のときだけ。権限はそのロールのものになる（実行）
 *   2. 処理の途中で checkAdminBySession_ を呼び直しても、そのロールの権限のまま（実行）
 *   3. そのロールで許されない操作はサーバーが止める（実行）
 *   4. ブラウザのすべての呼び出しがロールIDを載せる（配線）／載せ方そのもの（実行）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MENU_REGISTRY, ACTION_TO_MENU, LEGACY_CODE_TO_INITIAL_ROLE_ID } from './menu-registry.mjs';
import { withPreviewRole, setApiPreviewRole } from '../src/shared/api-base.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  let i = gas.indexOf('{', start);
  for (; i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

type Role = { roleId: string; roleName: string; isMaster: boolean; allowedMenus: string[]; trainingEditScope: string };
type Session = {
  loginId: string; isMaster: boolean; allowedMenus: string[]; adminPermissionLevel: string;
  displayName: string; roleName: string; previewRoleId?: string; previewActorLoginId?: string;
  canAccessAdminPage: boolean; trainingEditScope: string;
};

const ROLES: Record<string, Role> = {
  'role-master-builtin': { roleId: 'role-master-builtin', roleName: 'マスター', isMaster: true, allowedMenus: [], trainingEditScope: 'ALL' },
  'role-training-manager-initial': { roleId: 'role-training-manager-initial', roleName: '研修管理者', isMaster: false, allowedMenus: ['training-manage', 'bulk-mail'], trainingEditScope: 'ALL' },
  'role-general-initial': { roleId: 'role-general-initial', roleName: '一般', isMaster: false, allowedMenus: ['common-shared'], trainingEditScope: 'OWN' },
  'role-custom-acct': { roleId: 'role-custom-acct', roleName: '会計', isMaster: false, allowedMenus: ['members-list', 'annual-fee'], trainingEditScope: 'ALL' },
};

const REAL_MASTER: Session = {
  loginId: 'master@example.org', isMaster: true, allowedMenus: MENU_REGISTRY.map((m: { id: string }) => m.id),
  adminPermissionLevel: 'MASTER', displayName: '事務局（マスター）', roleName: 'マスター', canAccessAdminPage: true, trainingEditScope: 'ALL',
};
const REAL_ADMIN: Session = { ...REAL_MASTER, loginId: 'admin@example.org', isMaster: false, adminPermissionLevel: 'ADMIN', allowedMenus: ['members-list'] };

function buildServer(real: Session) {
  return new Function('deps', `
    var MENU_REGISTRY = deps.MENU_REGISTRY;
    var ACTION_TO_MENU = deps.ACTION_TO_MENU;
    var LEGACY_CODE_TO_INITIAL_ROLE_ID = deps.LEGACY_CODE_TO_INITIAL_ROLE_ID;
    var _previewAdminSession = null;
    function getOrCreateDatabase_() { return {}; }
    function getRoleByIdCached_(ss, id) { return deps.ROLES[id] || null; }
    // checkAdminBySession_ の先頭（なりすましの返却）だけを本物で動かし、以降の照合は偽物にする
    function realLookup_() { return deps.real; }
    ${extractFunction('checkAdminBySession_').replace(/\n\s*\/\/ options\.recordLogin[\s\S]*$/, '\n  return realLookup_();\n}')}
    ${extractFunction('previewLegacyLevelForRole_')}
    ${extractFunction('buildPreviewAdminSession_')}
    ${extractFunction('isActionAllowedForSession_')}
    return {
      build: buildPreviewAdminSession_,
      check: checkAdminBySession_,
      allowed: isActionAllowedForSession_,
      setPreview: function(s) { _previewAdminSession = s; },
    };
  `)({ MENU_REGISTRY, ACTION_TO_MENU, LEGACY_CODE_TO_INITIAL_ROLE_ID, ROLES, real }) as {
    build: (id: string) => Session;
    check: (o?: { recordLogin?: boolean }) => Session;
    allowed: (action: string, s: Session) => boolean;
    setPreview: (s: Session | null) => void;
  };
}

// ── 1. なりすましの成立条件と中身 ─────────────────────────────
test('MASTER 以外はプレビューできない（権限を上げる方向には使えない）', () => {
  assert.throws(() => buildServer(REAL_ADMIN).build('role-training-manager-initial'), /MASTER のみ/);
});

test('存在しないロールは拒否する', () => {
  assert.throws(() => buildServer(REAL_MASTER).build('role-nope'), /見つかりません/);
});

test('研修管理者として: 権限はそのロールのもの、記録上の操作者は MASTER 本人のまま', () => {
  const s = buildServer(REAL_MASTER).build('role-training-manager-initial');
  assert.equal(s.isMaster, false);
  assert.deepEqual(s.allowedMenus, ['training-manage', 'bulk-mail']);
  assert.equal(s.adminPermissionLevel, 'TRAINING_MANAGER');
  assert.equal(s.loginId, 'master@example.org');
  assert.equal(s.previewActorLoginId, 'master@example.org');
  assert.match(s.displayName, /研修管理者としてプレビュー/);
});

test('旧来の権限コードは初期ロールの対応表から引く。カスタムロールは ADMIN、マスターは MASTER', () => {
  const srv = buildServer(REAL_MASTER);
  assert.equal(srv.build('role-custom-acct').adminPermissionLevel, 'ADMIN');
  const m = srv.build('role-master-builtin');
  assert.equal(m.adminPermissionLevel, 'MASTER');
  assert.equal(m.isMaster, true);
  const g = srv.build('role-general-initial');
  assert.equal(g.adminPermissionLevel, 'GENERAL');
  assert.equal(g.canAccessAdminPage, false);
});

// ── 2. 処理の途中で呼び直しても権限が戻らない ───────────────────────
test('なりすまし中は checkAdminBySession_ がそのロールのセッションを返す。ログイン操作では返さない', () => {
  const srv = buildServer(REAL_MASTER);
  const preview = srv.build('role-training-manager-initial');
  srv.setPreview(preview);
  assert.equal(srv.check().adminPermissionLevel, 'TRAINING_MANAGER');
  assert.equal(srv.check({ recordLogin: true }).adminPermissionLevel, 'MASTER');
  srv.setPreview(null);
  assert.equal(srv.check().adminPermissionLevel, 'MASTER');
});

// ── 3. そのロールで許されない操作は止まる ──────────────────────────
test('研修管理者としては研修メールを送れるが、変更申請の承認はできない', () => {
  const srv = buildServer(REAL_MASTER);
  const s = srv.build('role-training-manager-initial');
  assert.equal(srv.allowed('sendTrainingMail', s), true);
  assert.equal(srv.allowed('approveAdminChangeRequest', s), false);
  assert.equal(srv.allowed('approveAdminChangeRequest', REAL_MASTER), true);
});

test('入口の配線: requiredPerms の内側で毎回リセットしてからなりすましを作り、業務処理へロールIDを渡さない', () => {
  const fn = extractFunction('processApiRequest');
  assert.match(fn, /delete parsedPayload\.__previewRoleId;/);
  assert.match(fn, /if \(requiredPerms\) \{[\s\S]*?_previewAdminSession = null;\s*if \(previewRoleId\) \{\s*_previewAdminSession = buildPreviewAdminSession_\(previewRoleId\);[\s\S]*?var sessionResult = checkAdminBySession_\(\);/);
});

// ── 4. ブラウザ側 ────────────────────────────────────────
test('ブラウザのすべての processApiRequest 呼び出しがロールIDを載せる（withPreviewRole を通す）', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
    }
  };
  walk(path.join(ROOT, 'src'));
  const offenders: string[] = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const re = /\.processApiRequest\(\s*[^,]+,\s*(\S)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      if (!src.startsWith('withPreviewRole(', m.index + m[0].length - 1)) {
        offenders.push(`${path.relative(ROOT, f)}:${src.slice(0, m.index).split('\n').length}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('書き込みを止める「閲覧のみ」の仕組みは残っていない', () => {
  const apiTs = fs.readFileSync(path.join(ROOT, 'src', 'services', 'api.ts'), 'utf8');
  assert.doesNotMatch(apiTs, /installPreviewWriteGuard|setApiPreviewReadOnly/);
});

test('withPreviewRole: プレビュー中だけロールIDを足し、元の項目は保つ', () => {
  setApiPreviewRole(null);
  assert.equal(withPreviewRole(null), null);
  assert.equal(withPreviewRole('{"a":1}'), '{"a":1}');
  setApiPreviewRole('role-training-manager-initial');
  assert.deepEqual(JSON.parse(withPreviewRole(null) as string), { __previewRoleId: 'role-training-manager-initial' });
  assert.deepEqual(JSON.parse(withPreviewRole('{"a":1}') as string), { a: 1, __previewRoleId: 'role-training-manager-initial' });
  setApiPreviewRole(null);
});

// ── 2026-10-11: 開ける管理画面が無いロール（一般・画面メニューを外したロール）─────────────
// 以前は行き先が 'profile'（会員マイページ）になり、会員データを読まない管理画面で
// 「必要なデータを読み込み中です...」のまま止まっていた。
import { stripTypeScriptTypes } from 'node:module';
import { canAccessMenu } from '../src/shared/rbac-util.ts';

const APP = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

function extractTsxFunction(src: string, signature: string): string {
  const start = src.indexOf(signature);
  assert.notEqual(start, -1, `${signature} が見つからない`);
  let depth = 0;
  let i = src.indexOf('{', src.indexOf(')', start));
  for (; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`${signature} の終端が見つからない`);
}

const pickInitialAdminView = new Function(
  'canAccessMenu',
  `${stripTypeScriptTypes(extractTsxFunction(APP, 'function pickInitialAdminView('))}; return pickInitialAdminView;`,
)(canAccessMenu) as (isMaster: boolean, menus: string[], level: string | null) => string;

test('開ける管理画面が無いロールの行き先は「使える画面なし」（会員マイページへ落とさない）', () => {
  assert.equal(pickInitialAdminView(false, ['common-shared'], 'GENERAL'), 'no-admin-access');
  assert.equal(pickInitialAdminView(false, [], 'ADMIN'), 'no-admin-access');
  assert.equal(pickInitialAdminView(false, ['training-manage', 'bulk-mail'], 'TRAINING_MANAGER'), 'training-manage');
  assert.equal(pickInitialAdminView(true, [], 'MASTER'), 'admin');
});

test('「使える画面なし」は読み込み中表示より先に扱い、読み込み中表示は会員マイページの中にだけある', () => {
  const render = extractTsxFunction(APP, 'const renderContent = () =>');
  assert.match(render, /if \(currentView === 'no-admin-access'\) \{\s*return renderNoAdminAccess\(\);/);
  assert.doesNotMatch(render, /必要なデータを読み込み中です/);
  const member = extractTsxFunction(APP, 'const renderMemberView = () =>');
  assert.match(member, /if \(import\.meta\.env\.VITE_APP === 'admin'\) \{\s*return renderNoAdminAccess\(\);\s*\}\s*if \(!memberPortalLoaded\)/);
});

test('管理 shell は管理画面を使えない人を会員マイページへ落とさない', () => {
  assert.match(APP, /setCurrentView\(isAdminShell \? 'no-admin-access' : 'profile'\);/);
  assert.match(APP, /permLevel === 'GENERAL' \|\| !auth\.canAccessAdminPage\s*\?\s*'no-admin-access'/);
});

test('プレビューの切り替え: 「使える画面なし」から別ロール・終了のどちらでも画面を選び直す', () => {
  const fn = extractTsxFunction(APP, 'const handleSelectPreviewRole = (roleId: string | null) =>');
  assert.match(fn, /if \(onNoAccess \|\| \(menuId && role\.allowedMenus\.indexOf\(menuId\) === -1\)\)/);
  assert.match(fn, /else if \(!roleId && onNoAccess && adminSessionRbac\)/);
});
