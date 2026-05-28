// docs/246 Phase 1-A snapshot/delta test
//
// 目的:
//   旧 ADMIN_ACTION_PERMISSIONS（gas-src/Code.full.gs:1487-1607）と新 menu-based 認可判定
//   （scripts/menu-registry.mjs）を全 action × 全 role で比較し、差分を列挙する。
//   許容済デルタ（LEGACY_ROLE_DELTA_ACCEPTED）以外の差分があれば test FAIL でリリースを止める。
//
// 実行: node --test scripts/test-menu-registry.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ACTION_TO_MENU,
  LEGACY_ROLE_TO_MENUS,
  LEGACY_ROLE_TRAINING_SCOPE,
  LEGACY_ROLE_DELTA_ACCEPTED,
  INITIAL_ROLE_DEFINITIONS,
  LEGACY_CODE_TO_INITIAL_ROLE_ID,
  isActionAllowedByMenu,
  isActionAllowedForSession,
} from './menu-registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(__dirname, '..', 'gas-src', 'Code.full.gs');

const ALL_ROLES = ['MASTER', 'ADMIN', 'TRAINING_MANAGER', 'TRAINING_REGISTRAR', 'GENERAL'];

// gas-src/Code.full.gs から ADMIN_ACTION_PERMISSIONS をテキスト抽出する。
// 形式: 'actionName': ['ROLE1','ROLE2',...],
function parseLegacyActionPermissions() {
  const src = readFileSync(sourcePath, 'utf8');
  const startMarker = 'var ADMIN_ACTION_PERMISSIONS = {';
  const startIdx = src.indexOf(startMarker);
  if (startIdx === -1) throw new Error('ADMIN_ACTION_PERMISSIONS 開始マーカー未検出');
  const endIdx = src.indexOf('\n};', startIdx);
  if (endIdx === -1) throw new Error('ADMIN_ACTION_PERMISSIONS 終端未検出');
  const body = src.slice(startIdx + startMarker.length, endIdx);

  const result = {};
  const lineRegex = /^\s*'([^']+)'\s*:\s*\[([^\]]+)\]\s*,/gm;
  let m;
  while ((m = lineRegex.exec(body)) !== null) {
    const action = m[1];
    const roles = m[2]
      .split(',')
      .map((s) => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);
    result[action] = roles;
  }
  if (Object.keys(result).length === 0) throw new Error('ADMIN_ACTION_PERMISSIONS パース失敗');
  return result;
}

function legacyAllow(legacyPerms, action, role) {
  const perms = legacyPerms[action];
  if (!perms) return false;
  return perms.indexOf(role) !== -1;
}

function deltaAccepted(action, role, oldAllow, newAllow) {
  return LEGACY_ROLE_DELTA_ACCEPTED.some(
    (d) => d.action === action && d.role === role && d.oldAllow === oldAllow && d.newAllow === newAllow,
  );
}

test('ACTION_TO_MENU が ADMIN_ACTION_PERMISSIONS の全 action を網羅する', () => {
  const legacy = parseLegacyActionPermissions();
  const legacyActions = Object.keys(legacy);
  const missing = legacyActions.filter((a) => !(a in ACTION_TO_MENU));
  assert.deepEqual(
    missing,
    [],
    `ACTION_TO_MENU に未マップの action があります: ${missing.join(', ')}`,
  );
});

test('ACTION_TO_MENU に旧 ADMIN_ACTION_PERMISSIONS に無い action が混入していない', () => {
  const legacy = parseLegacyActionPermissions();
  const legacyActions = new Set(Object.keys(legacy));
  const extra = Object.keys(ACTION_TO_MENU).filter((a) => !legacyActions.has(a));
  assert.deepEqual(
    extra,
    [],
    `ACTION_TO_MENU に旧マップ外の action が含まれています: ${extra.join(', ')}`,
  );
});

test('全 (action × role) で legacy ≡ menu-based、または LEGACY_ROLE_DELTA_ACCEPTED に列挙済', () => {
  const legacy = parseLegacyActionPermissions();
  const unexpectedDeltas = [];

  for (const action of Object.keys(legacy)) {
    for (const role of ALL_ROLES) {
      const oldAllow = legacyAllow(legacy, action, role);
      const newAllow = isActionAllowedByMenu(action, role);
      if (oldAllow !== newAllow) {
        if (!deltaAccepted(action, role, oldAllow, newAllow)) {
          unexpectedDeltas.push({ action, role, oldAllow, newAllow });
        }
      }
    }
  }

  if (unexpectedDeltas.length > 0) {
    const summary = unexpectedDeltas
      .map((d) => `  - ${d.action} / ${d.role}: legacy=${d.oldAllow} new=${d.newAllow}`)
      .join('\n');
    assert.fail(
      `${unexpectedDeltas.length} 件の未許容デルタを検出しました。\n` +
        `LEGACY_ROLE_DELTA_ACCEPTED への追加（明示承認）または menu mapping/ロール定義の修正が必要です:\n${summary}`,
    );
  }
});

test('LEGACY_ROLE_DELTA_ACCEPTED の各エントリが実際に発生するデルタである', () => {
  const legacy = parseLegacyActionPermissions();
  const stale = [];
  for (const d of LEGACY_ROLE_DELTA_ACCEPTED) {
    if (!(d.action in legacy)) {
      stale.push(`${d.action} (legacy にこの action なし)`);
      continue;
    }
    const oldAllow = legacyAllow(legacy, d.action, d.role);
    const newAllow = isActionAllowedByMenu(d.action, d.role);
    if (oldAllow === newAllow) {
      stale.push(`${d.action}/${d.role} (実際にはデルタなし — old=${oldAllow} new=${newAllow})`);
      continue;
    }
    if (oldAllow !== d.oldAllow || newAllow !== d.newAllow) {
      stale.push(`${d.action}/${d.role} (期待 old=${d.oldAllow} new=${d.newAllow} だが実際 old=${oldAllow} new=${newAllow})`);
    }
  }
  assert.deepEqual(stale, [], `LEGACY_ROLE_DELTA_ACCEPTED に古い/誤りエントリがあります:\n  ${stale.join('\n  ')}`);
});

test('MASTER は全 action 許可', () => {
  const legacy = parseLegacyActionPermissions();
  for (const action of Object.keys(legacy)) {
    assert.equal(isActionAllowedByMenu(action, 'MASTER'), true, `MASTER が ${action} を許可しない`);
  }
});

test('LEGACY_ROLE_TRAINING_SCOPE は全 role を網羅', () => {
  for (const role of ALL_ROLES) {
    assert.ok(
      LEGACY_ROLE_TRAINING_SCOPE[role] === 'ALL' || LEGACY_ROLE_TRAINING_SCOPE[role] === 'OWN',
      `${role} の trainingEditScope が未定義`,
    );
  }
  assert.equal(LEGACY_ROLE_TRAINING_SCOPE.TRAINING_REGISTRAR, 'OWN');
});

test('INITIAL_ROLE_DEFINITIONS: roleId 一意性 + MASTER 組込 + legacy mapping', () => {
  const ids = new Set();
  for (const d of INITIAL_ROLE_DEFINITIONS) {
    assert.ok(d.roleId && typeof d.roleId === 'string', 'roleId 空');
    assert.ok(!ids.has(d.roleId), `roleId 重複: ${d.roleId}`);
    ids.add(d.roleId);
  }
  const master = INITIAL_ROLE_DEFINITIONS.find((d) => d.roleName === 'MASTER');
  assert.ok(master, 'MASTER 定義が見つからない');
  assert.equal(master.isBuiltIn, true, 'MASTER は isBuiltIn=true');
  assert.equal(master.isMaster, true, 'MASTER は isMaster=true');
  // legacy mapping: 5 ロール全て legacyCode が埋まり、LEGACY_CODE_TO_INITIAL_ROLE_ID と一致
  for (const d of INITIAL_ROLE_DEFINITIONS) {
    assert.ok(d.legacyCode, `${d.roleName} に legacyCode が無い`);
    assert.equal(LEGACY_CODE_TO_INITIAL_ROLE_ID[d.legacyCode], d.roleId);
  }
});

test('INITIAL_ROLE_DEFINITIONS: 各 role の allowedMenus は LEGACY_ROLE_TO_MENUS と完全一致（挙動完全維持）', () => {
  for (const d of INITIAL_ROLE_DEFINITIONS) {
    if (d.roleName === 'MASTER') continue; // MASTER は isMaster で全許可
    const legacy = LEGACY_ROLE_TO_MENUS[d.legacyCode] || [];
    assert.deepEqual(d.allowedMenus.slice().sort(), legacy.slice().sort(),
      `${d.roleName} (legacy=${d.legacyCode}) の allowedMenus が LEGACY_ROLE_TO_MENUS と不一致`);
    assert.equal(d.trainingEditScope, LEGACY_ROLE_TRAINING_SCOPE[d.legacyCode],
      `${d.roleName} の trainingEditScope が LEGACY と不一致`);
  }
});

test('isActionAllowedForSession: INITIAL_ROLE_DEFINITIONS の各 session で legacy 等価', () => {
  const legacy = parseLegacyActionPermissions();
  const unexpected = [];
  for (const role of INITIAL_ROLE_DEFINITIONS) {
    // session を作って action 全件で legacy === resolved を確認（INITIAL ロール = legacy 完全等価）
    const session = {
      isMaster: role.isMaster,
      allowedMenus: role.allowedMenus,
    };
    for (const action of Object.keys(legacy)) {
      const resolvedAllow = isActionAllowedForSession(action, session);
      const legacyAllow = legacy[action].indexOf(role.legacyCode) !== -1;
      if (resolvedAllow !== legacyAllow) {
        // 許容デルタリストに含まれていれば OK
        const accepted = LEGACY_ROLE_DELTA_ACCEPTED.some(
          (d) => d.action === action && d.role === role.legacyCode && d.oldAllow === legacyAllow && d.newAllow === resolvedAllow,
        );
        if (!accepted) {
          unexpected.push({ action, role: role.legacyCode, legacy: legacyAllow, resolved: resolvedAllow });
        }
      }
    }
  }
  assert.deepEqual(unexpected, [], `INITIAL ロール session 経路の判定が legacy と乖離（許容デルタ外）: ${JSON.stringify(unexpected)}`);
});

test('LEGACY_ROLE_TO_MENUS の menu id が MENU_REGISTRY に存在する', async () => {
  const { MENU_REGISTRY } = await import('./menu-registry.mjs');
  const known = new Set(MENU_REGISTRY.map((m) => m.id));
  for (const [role, menus] of Object.entries(LEGACY_ROLE_TO_MENUS)) {
    for (const id of menus) {
      assert.ok(known.has(id), `${role} の allowedMenus に未知 menu id: ${id}`);
    }
  }
});
