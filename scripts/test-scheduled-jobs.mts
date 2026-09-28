/**
 * 定期ジョブのハンドラが生成物から消えていないことを固定する。
 *
 * 背景（2026-09-27）: `warmUp` と `dailyWithdrawalPolicyTrigger` は build の
 * pruning で 3 split すべての生成物から消えていた。トリガーだけが本番に残り、
 * 存在しない関数を 5 分ごとに叩き続けていた。退会予定→退会確定の昇格が
 * 動いていなかったが、失敗がどこにも出ないので誰も気づけなかった。
 *
 * 同じことを二度起こさないための検査:
 *   1. gas-src で `ScriptApp.newTrigger('X')` と書いたら、X は登録簿か廃止簿にある
 *   2. 登録簿のジョブは管理者 split の生成物に必ず存在する
 *   3. 定期ジョブを公開・会員 split に置かない（公開は匿名アクセスで、
 *      トップレベル関数は google.script.run から誰でも呼べてしまう）
 *   4. 廃止したジョブはどの生成物にも残っていない
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), ...p.split('/')), 'utf8');

const gasSrc = read('gas-src/Code.full.gs');
const artifacts = {
  public: read('backend/Code.gs'),
  member: read('gas/member/Code.gs'),
  // 役割でファイルを分けている（同一プロジェクトのグローバルなので動作は同じ）:
  //   jobs.gs = 本番の定期ジョブ / maintenance.gs = 本番データを変える保守 / dryrun.gs = 試すだけ
  admin: ['Code.gs', 'jobs.gs', 'maintenance.gs', 'dryrun.gs']
    .map((file) => read(`gas/admin/${file}`)).join('\n'),
};

/** 廃止したトリガーハンドラ。生成物に残っていてはいけない。 */
const RETIRED_HANDLERS = [
  // 5 分間隔のキャッシュ暖機。暖める CacheService はプロジェクトごとに別で、
  // 公開プロジェクトにしか置けないが、そこは匿名アクセスなので置けない。
  'warmUp',
  // v351 の processPendingThumbnails に置き換わった旧世代。作成元の
  // setupThumbnailGenerationTrigger_ は rebuildDatabaseSchema からしか呼ばれず、
  // その rebuildDatabaseSchema はどの生成物にも入っていない。
  'runThumbnailGeneration',
];

/** gas-src の SCHEDULED_JOBS_ 登録簿から name を読む（正本は gas-src 側）。 */
function registeredJobNames(): string[] {
  const start = gasSrc.indexOf('var SCHEDULED_JOBS_ = [');
  assert.notEqual(start, -1, 'SCHEDULED_JOBS_ の登録簿が gas-src に見つからない');
  const end = gasSrc.indexOf('\n];', start);
  assert.notEqual(end, -1, 'SCHEDULED_JOBS_ の終端が見つからない');
  const block = gasSrc.slice(start, end);
  return [...block.matchAll(/name:\s*'([A-Za-z0-9_]+)'/g)].map((m) => m[1]);
}

/** gas-src で ScriptApp.newTrigger('X') と宣言されているハンドラ名。 */
function declaredTriggerHandlers(): string[] {
  return [...new Set([...gasSrc.matchAll(/ScriptApp\.newTrigger\('([A-Za-z0-9_]+)'\)/g)].map((m) => m[1]))];
}

const hasFunction = (source: string, name: string) => source.includes(`function ${name}(`);

test('トリガー宣言はすべて登録簿か廃止簿に載っている', () => {
  const known = new Set([...registeredJobNames(), ...RETIRED_HANDLERS]);
  const unknown = declaredTriggerHandlers().filter((h) => !known.has(h));
  assert.deepEqual(
    unknown,
    [],
    `未登録のトリガーハンドラ: ${unknown.join(', ')}。gas-src の SCHEDULED_JOBS_ に足すか、このテストの RETIRED_HANDLERS に廃止として書くこと`,
  );
});

test('登録簿のジョブは gas-src に実体がある', () => {
  for (const name of registeredJobNames()) {
    assert.ok(hasFunction(gasSrc, name), `${name} の実体が gas-src に無い`);
  }
});

test('登録簿のジョブは管理者 split の生成物に残っている（pruning で消えない）', () => {
  for (const name of registeredJobNames()) {
    assert.ok(
      hasFunction(artifacts.admin, name),
      `${name} が gas/admin の生成物から消えている。scripts/gas-boundary-utils.mjs の ADMIN_TOP_LEVEL_FUNCTIONS へ追加すること`,
    );
  }
});

test('定期ジョブを公開・会員 split に置かない（匿名から google.script.run で呼べてしまう）', () => {
  for (const name of registeredJobNames()) {
    assert.ok(!hasFunction(artifacts.public, name), `${name} が公開 split に入っている`);
    assert.ok(!hasFunction(artifacts.member, name), `${name} が会員 split に入っている`);
  }
});

test('廃止したハンドラはどの生成物にも残っていない', () => {
  for (const name of RETIRED_HANDLERS) {
    for (const [surface, source] of Object.entries(artifacts)) {
      assert.ok(!hasFunction(source, name), `廃止した ${name} が ${surface} に残っている`);
    }
  }
});

test('setupScheduledTriggers は廃止ハンドラのトリガーも掃除し、日次ジョブを作り直す', () => {
  // 文字列一致ではなく実際に動かして確かめる。ハンドラ名は pruner 対策で
  // 分割して書いてあるので（'warm' + 'Up'）、ソースを grep しても出てこない。
  const start = gasSrc.indexOf('function setupScheduledTriggers()');
  assert.notEqual(start, -1);
  const source = gasSrc.slice(start, gasSrc.indexOf('\n}\n', start) + 2);

  let triggers = [...RETIRED_HANDLERS, 'dailyWithdrawalPolicyTrigger', 'onOpenSomethingElse']
    .map((name) => ({ getHandlerFunction: () => name }));
  const deleted: string[] = [];
  const created: string[] = [];
  const chain = (name: string) => {
    const node = {
      timeBased: () => node,
      everyDays: () => node,
      atHour: () => node,
      create: () => { created.push(name); triggers.push({ getHandlerFunction: () => name }); },
    };
    return node;
  };
  const ScriptApp = {
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger: (t: { getHandlerFunction: () => string }) => {
      deleted.push(t.getHandlerFunction());
      triggers = triggers.filter((x) => x !== t);
    },
    newTrigger: chain,
  };
  const fn = new Function('ScriptApp', 'Logger', `${source}; return setupScheduledTriggers;`)(
    ScriptApp, { log: () => {} },
  ) as () => string;
  fn();

  for (const name of RETIRED_HANDLERS) {
    assert.ok(deleted.includes(name), `廃止した ${name} のトリガーを消していない（本番に残り続ける）`);
  }
  assert.deepEqual(created, ['dailyWithdrawalPolicyTrigger'], '日次ジョブを作り直していない');
  assert.ok(!deleted.includes('onOpenSomethingElse'), '無関係なトリガーまで消している');
});

test('ジョブの失敗と遅れが Chat へ流れる配線がある', () => {
  assert.ok(gasSrc.includes('function runScheduledJob_('), '共通ラッパーが無い');
  assert.ok(gasSrc.includes('notifyScheduledJobFailureToChat_'), '失敗通知が無い');
  assert.ok(gasSrc.includes('function reportOverdueScheduledJobs_('), '遅れ通知が無い');
  // 見張りをトリガーに置くと、見張り自身が死んだときに誰も気づけない。
  // 人が管理画面を開く経路（getAdminInitData）で評価していることを固定する。
  const start = gasSrc.indexOf("if (action === 'getAdminInitData')");
  assert.notEqual(start, -1);
  const block = gasSrc.slice(start, start + 800);
  assert.ok(block.includes('reportOverdueScheduledJobs_()'), '管理画面の初期読み込みで死活を評価していない');
});

test('死活確認は管理者 split の生成物から引数なしで実行できる', () => {
  assert.ok(hasFunction(artifacts.admin, 'checkScheduledJobHealth'), 'operator 用の入口が admin に無い');
  assert.ok(hasFunction(artifacts.admin, 'setupScheduledTriggers'), 'トリガー再作成の入口が admin に無い');
});
