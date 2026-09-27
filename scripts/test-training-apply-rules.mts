/**
 * 研修申込のルールが 3 経路で同じであることを固定する。
 *
 * 背景（2026-09-27）: 申込の入口は 会員マイページ / 公開ポータル / 管理画面の名簿追加
 * の 3 つで、それぞれが別々に判定していた。
 *   - 管理画面の名簿追加には重複検査も定員検査も無かった
 *   - 公開申込は同じメールの人でも申込のたびに T_外部申込者 を作り直していた
 *     （1 人が申込のたびに増え、名簿でも宛先でも複数人に見えた）
 * operator 判断: 「どこから登録しようとも 1 人の申し込みは 1 人」。
 * 定員だけは管理画面から意図的に超過できるが、超えたことは画面に返す
 * （運用の基本は定員そのものを広げること）。
 *
 * 実ソースを gas-src から切り出して評価する（ミラー実装を書かない）。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.join(process.cwd(), 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

type Row = Record<string, unknown>;

/** 共通ルールを、必要な依存だけ差し替えて読み込む */
function loadRules(applicationRows: Row[]) {
  const names = [
    'normalizeApplicantEmailKey_',
    'findExistingTrainingApplication_',
    'evaluateTrainingCapacity_',
    'countAppliedApplicants_',
  ];
  const body = names.map(extractFunction).join('\n') + '\n' + extractFunction('isMemberApplicationRecord_')
    + '\n' + extractFunction('getApplicationApplicantType_') + '\n' + extractFunction('getApplicationApplicantId_');
  return new Function(
    'getTrainingApplicationRows_',
    `${body}; return { normalizeApplicantEmailKey_, findExistingTrainingApplication_, evaluateTrainingCapacity_, countAppliedApplicants_ };`,
  )((_ss: unknown, opts: { trainingId?: string }) =>
    applicationRows.filter((r) => !opts.trainingId || String(r['研修ID']) === opts.trainingId));
}

test('メールの同一性は大文字小文字と前後空白を無視する', () => {
  const { normalizeApplicantEmailKey_ } = loadRules([]);
  assert.equal(normalizeApplicantEmailKey_('  Taro@Example.ORG '), 'taro@example.org');
  assert.equal(normalizeApplicantEmailKey_(''), '');
  assert.equal(normalizeApplicantEmailKey_(null), '');
});

test('会員の重複申込を見つける', () => {
  const rows: Row[] = [
    { '研修ID': 'T1', '申込ID': 'A1', '申込者区分コード': 'MEMBER', '申込者ID': 'M1', '職員ID': '', '会員ID': 'M1' },
  ];
  const { findExistingTrainingApplication_ } = loadRules(rows);
  const hit = findExistingTrainingApplication_({}, 'T1', { kind: 'MEMBER', memberId: 'M1', staffId: '' });
  assert.equal(hit && hit['申込ID'], 'A1');
  assert.equal(findExistingTrainingApplication_({}, 'T1', { kind: 'MEMBER', memberId: 'M2', staffId: '' }), null);
});

test('外部申込者の重複は 申込者ID / 外部申込者ID のどちらに入っていても見つける', () => {
  // 経路によってどちらの列を使うかが違う（申込者解決の 2 モデル）。片方しか見ないと重複を作る。
  const viaApplicantId = loadRules([
    { '研修ID': 'T1', '申込ID': 'A1', '申込者区分コード': 'EXTERNAL', '申込者ID': 'EXT-1', '外部申込者ID': '' },
  ]);
  assert.ok(viaApplicantId.findExistingTrainingApplication_({}, 'T1', { kind: 'EXTERNAL', externalId: 'EXT-1' }));

  const viaExternalId = loadRules([
    { '研修ID': 'T1', '申込ID': 'A2', '申込者区分コード': 'EXTERNAL', '申込者ID': '', '外部申込者ID': 'EXT-1' },
  ]);
  assert.ok(viaExternalId.findExistingTrainingApplication_({}, 'T1', { kind: 'EXTERNAL', externalId: 'EXT-1' }));
});

test('外部申込者IDが空なら重複扱いにしない（空同士で一致させない）', () => {
  const { findExistingTrainingApplication_ } = loadRules([
    { '研修ID': 'T1', '申込ID': 'A1', '申込者区分コード': 'EXTERNAL', '申込者ID': '', '外部申込者ID': '' },
  ]);
  assert.equal(findExistingTrainingApplication_({}, 'T1', { kind: 'EXTERNAL', externalId: '' }), null);
});

test('定員の数え方は 1 つ（実際の申込行を数える）', () => {
  const rows: Row[] = [1, 2, 3].map((n) => ({ '研修ID': 'T1', '申込ID': 'A' + n, '申込者区分コード': 'MEMBER', '申込者ID': 'M' + n, '職員ID': '' }));
  const { evaluateTrainingCapacity_ } = loadRules(rows);
  assert.deepEqual(evaluateTrainingCapacity_({}, 'T1', 3), { capacity: 3, applicants: 3, isFull: true });
  assert.deepEqual(evaluateTrainingCapacity_({}, 'T1', 4), { capacity: 4, applicants: 3, isFull: false });
  // 定員 0 / 未設定は「上限なし」
  assert.equal(evaluateTrainingCapacity_({}, 'T1', 0).isFull, false);
  assert.equal(evaluateTrainingCapacity_({}, 'T1', '').isFull, false);
});

/** 入口ごとの本体が共通ルールを呼んでいることを固定する */
function entryPoint(name: string): string {
  return extractFunction(name);
}

test('3 経路すべてが重複判定を通る', () => {
  for (const fn of ['applyTraining_', 'applyTrainingExternal_', 'addRosterEntry_', 'addGuestRosterEntry_']) {
    assert.ok(
      entryPoint(fn).includes('findExistingTrainingApplication_('),
      `${fn} が重複判定を通っていない（どこから登録しても 1 人の申込は 1 人）`,
    );
  }
});

test('外部申込者は毎回作り直さず、同一人物を再利用する', () => {
  for (const fn of ['applyTrainingExternal_', 'addGuestRosterEntry_']) {
    const body = entryPoint(fn);
    assert.ok(body.includes('resolveOrCreateExternalApplicant_('), `${fn} が同一人物の解決を通っていない`);
    assert.ok(
      !/Utilities\.getUuid\(\)/.test(body),
      `${fn} が外部申込者IDを直接発行している（同じ人が増える）`,
    );
  }
});

test('定員判定も 3 経路で共通ルールを使う', () => {
  assert.ok(entryPoint('applyTraining_').includes('evaluateTrainingCapacity_('));
  assert.ok(entryPoint('applyTrainingExternal_').includes('evaluateTrainingCapacity_('));
  for (const fn of ['addRosterEntry_', 'addGuestRosterEntry_']) {
    assert.ok(entryPoint(fn).includes('evaluateTrainingCapacityForTraining_('), `${fn} が定員を見ていない`);
  }
});

test('管理画面からは定員を超えられるが、超えたことを返す', () => {
  for (const fn of ['addRosterEntry_', 'addGuestRosterEntry_']) {
    const body = entryPoint(fn);
    assert.ok(body.includes('capacityExceeded:'), `${fn} が超過を返していない（画面で気づけない）`);
    assert.ok(
      !/定員に達した/.test(body),
      `${fn} が定員で弾いている（管理画面からの意図的な追加は許可する運用）`,
    );
  }
});

test('会員・公開経路は定員で弾く', () => {
  assert.ok(entryPoint('applyTraining_').includes('定員に達したため'));
  assert.ok(entryPoint('applyTrainingExternal_').includes('定員に達しています'));
});
