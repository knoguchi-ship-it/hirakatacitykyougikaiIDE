/**
 * 機能一覧（docs/288）が実装からドリフトしていないことを固定する。
 *
 * 狙いは「一覧が古くなること」そのものを CI で止めること。
 * 一覧が古いと「有るのか分からないからもう一度作る」＝二重実装になる。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const inv = await import('./feature-inventory.mjs');

test('許可リストの action がすべてドメイン分類されている', () => {
  const { unclassified } = inv.checkClassification(inv.buildSurfaceMap());
  assert.deepEqual(
    unclassified,
    [],
    `未分類の action がある。scripts/feature-inventory.mjs の DOMAINS へ追加すること: ${unclassified.join(', ')}`,
  );
});

test('存在しない action を分類に書いていない', () => {
  const { unknown } = inv.checkClassification(inv.buildSurfaceMap());
  assert.deepEqual(unknown, [], `許可リストに無い action を分類している（撤去済み？）: ${unknown.join(', ')}`);
});

test('docs/288 の生成ブロックが最新（npm run generate:inventory 済み）', () => {
  const doc = fs.readFileSync(inv.DOC_PATH, 'utf8');
  const expected = inv.applyToDoc(doc, inv.renderInventory(inv.readGasSource()));
  assert.equal(doc, expected, `${inv.DOC_PATH} が古い。npm run generate:inventory を実行すること`);
});

test('3 面それぞれに action が登録されている（許可リストの取り違え検知）', () => {
  const surface = inv.buildSurfaceMap();
  const count = (name: string) => [...surface.values()].filter((s) => s.has(name)).length;
  assert.ok(count('公開') > 0, '公開の action が 0');
  assert.ok(count('会員') > 0, '会員の action が 0');
  assert.ok(count('管理') > 0, '管理の action が 0');
  // 公開が管理と同程度に膨らんだら境界が壊れている
  assert.ok(count('公開') < count('管理') / 3, '公開に許可した action が多すぎる（境界を確認）');
});
