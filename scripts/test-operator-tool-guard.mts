/**
 * 2026-10-10 回帰テスト: 管理 split の保守ツールは MASTER しか実行できない（docs/302 §2）。
 *
 * 背景: Apps Script は名前が `_` で終わらないトップレベル関数を google.script.run へすべて公開する。
 * 管理 web app は DOMAIN 公開・デプロイした人の権限で動くため、管理者リストに無い組織アカウントでも
 * ページを開いて開発者ツールから保守ツールを実行できていた。認可は processApiRequest の入口にしか無かった。
 * 既存の dryRun_assertAdminOperator_ は名前に反して何も止めていなかった。
 *
 *   1. 公開されるトップレベル関数（doGet / processApiRequest 以外）はすべて、先頭で実行者を確かめる（配線）
 *   2. 確かめる関数そのものが、外部者・MASTER 以外を止め、MASTER とトリガーを通す（実行）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_TOP_LEVEL_FUNCTIONS, ADMIN_SCHEDULED_JOB_FUNCTIONS } from './gas-boundary-utils.mjs';
import { readGasSource } from './lib/gas-source.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = readGasSource();

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

/** 本体の最初の文（コメント・空行を除く） */
function firstStatement(name: string): string {
  const fn = extractFunction(name);
  const body = fn.slice(fn.indexOf('{') + 1);
  const line = body.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('//'));
  return line || '';
}

// トリガーが叩くハンドラ（設定関数・死活確認はエディタから人が実行するので MASTER 判定）
const TRIGGER_HANDLERS = ['dailyWithdrawalPolicyTrigger', 'processPendingThumbnails', 'refreshSnapshotsJob'];
// ステージングの最初の用意（DB がまだ無いので管理者リストで確かめられない）。本番では止まり、持ち主がエディタで動かすときだけ通す
// （2026-11-15・docs/334 §10.4）。この一覧の外で assertStagingOwnerOperator_ を使ったら落とす。
const STAGING_BOOTSTRAP_TOOLS = ['setupStagingStores_APPLY', 'seedStagingTestData_APPLY'];

// ── 1. 配線 ─────────────────────────────────────────────
test('公開されるトップレベル関数は、doGet と processApiRequest 以外すべて先頭で実行者を確かめる', () => {
  const exposed = ADMIN_TOP_LEVEL_FUNCTIONS.filter((n: string) => n !== 'doGet' && n !== 'processApiRequest');
  // 一覧が空になる事故を防ぐ下限。2026-10-11 に後片付けの 7 本を物理削除の 2 本へ統合し、22 → 17 本になった。
  assert.ok(exposed.length >= 10, '一覧が想定より少ない');
  const missing: string[] = [];
  for (const name of exposed) {
    const first = firstStatement(name);
    const ok = STAGING_BOOTSTRAP_TOOLS.includes(name)
      ? first === `assertStagingOwnerOperator_('${name}');` || first === `var operatorEmail = assertStagingOwnerOperator_('${name}');`
      : TRIGGER_HANDLERS.includes(name)
      ? first === `assertTriggerOrMasterOperator_(e, '${name}');`
      // 判定の結果（実行者のセッション）を変数に受ける形も、先頭で確かめていることに変わりはない
      : first === `assertMasterOperator_('${name}');`
        || first === `var session = assertMasterOperator_('${name}');`
        || /^(var \w+ = )?dryRun_assertAdminOperator_\(\);$/.test(first);
    if (!ok) missing.push(`${name}: ${first}`);
  }
  assert.deepEqual(missing, [], '先頭に実行者確認が無い関数がある');
});

test('トリガーのハンドラはイベント引数 e を受け取る（triggerUid で本物のトリガーかを確かめるため）', () => {
  for (const name of TRIGGER_HANDLERS) {
    assert.ok(ADMIN_SCHEDULED_JOB_FUNCTIONS.includes(name), `${name} が定期ジョブの一覧に無い`);
    assert.match(extractFunction(name), new RegExp(`^function ${name}\\(e\\) \\{`));
  }
});

// ── 2. 実行 ─────────────────────────────────────────────
type Session = { loginId: string; isMaster: boolean; adminPermissionLevel: string; displayName: string };

function buildGuard(opts: { session?: Session; whitelisted?: boolean; triggerIds?: string[] }) {
  const history: string[] = [];
  let sessionCalls = 0;
  const api = new Function('deps', `
    function checkAdminBySession_() {
      deps.onSession();
      if (!deps.whitelisted) throw new Error('管理者権限がありません。');
      return deps.session;
    }
    function appendLoginHistory_(ss, authId, loginId, method, result, reason) { deps.history.push(result + ':' + reason); }
    var ScriptApp = { getProjectTriggers: function() {
      return deps.triggerIds.map(function(id) { return { getUniqueId: function() { return id; } }; });
    } };
    ${extractFunction('assertMasterOperator_')}
    ${extractFunction('assertTriggerOrMasterOperator_')}
    ${extractFunction('dryRun_assertAdminOperator_')}
    return { assertMasterOperator_, assertTriggerOrMasterOperator_, dryRun_assertAdminOperator_ };
  `)({
    history,
    whitelisted: opts.whitelisted !== false,
    session: opts.session,
    triggerIds: opts.triggerIds || [],
    onSession: () => { sessionCalls += 1; },
  }) as {
    assertMasterOperator_: (n: string) => Session;
    assertTriggerOrMasterOperator_: (e: unknown, n: string) => Session | null;
    dryRun_assertAdminOperator_: () => { loginId: string };
  };
  return { api, history, sessionCalls: () => sessionCalls };
}

const MASTER: Session = { loginId: 'master@example.org', isMaster: true, adminPermissionLevel: 'MASTER', displayName: 'M' };
const ADMIN: Session = { loginId: 'admin@example.org', isMaster: false, adminPermissionLevel: 'ADMIN', displayName: 'A' };

test('管理者リスト外の組織アカウントは止まる', () => {
  const { api } = buildGuard({ whitelisted: false });
  assert.throws(() => api.assertMasterOperator_('executeTestDataPurge_APPLY'), /管理者権限がありません/);
});

test('MASTER 以外の管理者は止まり、拒否がログイン履歴に残る', () => {
  const { api, history } = buildGuard({ session: ADMIN });
  assert.throws(() => api.assertMasterOperator_('restoreLastArchiveBatch_APPLY'), /MASTER のみ実行できます/);
  assert.equal(history.length, 1);
  assert.match(history[0], /^FAILURE:.*restoreLastArchiveBatch_APPLY/);
});

test('MASTER は通る', () => {
  const { api, history } = buildGuard({ session: MASTER });
  assert.equal(api.assertMasterOperator_('listArchiveBatches_LOG').loginId, 'master@example.org');
  assert.equal(history.length, 0);
});

test('本物のトリガーからの起動は、人の確認なしで通る', () => {
  const g = buildGuard({ whitelisted: false, triggerIds: ['111', '222'] });
  assert.equal(g.api.assertTriggerOrMasterOperator_({ triggerUid: '222' }, 'dailyWithdrawalPolicyTrigger'), null);
  assert.equal(g.sessionCalls(), 0);
});

test('このプロジェクトに無い triggerUid は拒否する（クライアントは引数を偽れる）', () => {
  const { api } = buildGuard({ session: MASTER, triggerIds: ['111'] });
  assert.throws(() => api.assertTriggerOrMasterOperator_({ triggerUid: '999' }, 'processPendingThumbnails'), /無いトリガー/);
});

test('トリガー以外（エディタ・google.script.run）からの起動は MASTER に限る', () => {
  assert.throws(() => buildGuard({ session: ADMIN }).api.assertTriggerOrMasterOperator_(undefined, 'processPendingThumbnails'), /MASTER のみ/);
  assert.throws(() => buildGuard({ whitelisted: false }).api.assertTriggerOrMasterOperator_({}, 'processPendingThumbnails'), /管理者権限がありません/);
  assert.equal(buildGuard({ session: MASTER }).api.assertTriggerOrMasterOperator_({}, 'processPendingThumbnails')?.loginId, 'master@example.org');
});

test('dryRun_assertAdminOperator_ も MASTER 以外を止める（以前は何も止めていなかった）', () => {
  assert.throws(() => buildGuard({ session: ADMIN }).api.dryRun_assertAdminOperator_(), /MASTER のみ/);
  assert.throws(() => buildGuard({ whitelisted: false }).api.dryRun_assertAdminOperator_(), /管理者権限がありません/);
  assert.equal(buildGuard({ session: MASTER }).api.dryRun_assertAdminOperator_().loginId, 'master@example.org');
});

// ── 3. ステージングの最初の用意（docs/334 §10.4） ───────────────────
function buildStagingGuard(opts: { production: boolean; active: string; effective: string }) {
  return new Function('deps', `
    function isProductionScript_() { return deps.production; }
    var Session = {
      getActiveUser: function() { return { getEmail: function() { return deps.active; } }; },
      getEffectiveUser: function() { return { getEmail: function() { return deps.effective; } }; },
    };
    ${extractFunction('assertStagingOwnerOperator_')}
    return assertStagingOwnerOperator_;
  `)(opts) as (n: string) => string;
}

test('ステージングの用意: 本番のプロジェクトでは持ち主でも止まる', () => {
  const g = buildStagingGuard({ production: true, active: 'owner@example.org', effective: 'owner@example.org' });
  assert.throws(() => g('setupStagingStores_APPLY'), /本番/);
});

test('ステージングの用意: web app 経由（実行者とデプロイした人が違う）・匿名は止まる', () => {
  assert.throws(() => buildStagingGuard({ production: false, active: 'other@example.org', effective: 'owner@example.org' })('setupStagingStores_APPLY'), /持ち主/);
  assert.throws(() => buildStagingGuard({ production: false, active: '', effective: 'owner@example.org' })('setupStagingStores_APPLY'), /持ち主/);
});

test('ステージングの用意: 本番でないプロジェクトで持ち主がエディタから動かすと通る', () => {
  assert.equal(buildStagingGuard({ production: false, active: 'Owner@Example.org', effective: 'owner@example.org' })('setupStagingStores_APPLY'), 'owner@example.org');
});

test('assertStagingOwnerOperator_ を使う関数は STAGING_BOOTSTRAP_TOOLS だけ', () => {
  // 定義（function assertStagingOwnerOperator_）以外で呼んでいる関数を、呼んでいる位置から遡って求める
  const users: string[] = [];
  let at = gas.indexOf('assertStagingOwnerOperator_(');
  while (at >= 0) {
    const def = gas.lastIndexOf('\nfunction ', at);
    const name = gas.slice(def + 10, gas.indexOf('(', def + 10));
    if (name !== 'assertStagingOwnerOperator_') users.push(name);
    at = gas.indexOf('assertStagingOwnerOperator_(', at + 1);
  }
  assert.deepEqual(users.sort(), [...STAGING_BOOTSTRAP_TOOLS].sort());
});
