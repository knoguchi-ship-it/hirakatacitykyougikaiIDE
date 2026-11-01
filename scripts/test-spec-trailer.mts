/**
 * 仕様書の追従確認（Spec: 行）— prerelease の拾い直し（2026-11-01 operator 指示・Skill /spec-sync）。
 *
 * hook（guard-bash H8）はコミットの直前に止めるが、hook の外（別の端末・hook を通らない道具）で作られた
 * コミットは止められない。リリースの前に、基点以降で機能のコード（gas-src/・src/）を変えたコミットが
 * すべて `Spec:` 行を持つか（または後のコミットの `Spec-For:` で補われているか）を確かめる。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = await import(pathToFileURL(path.join(ROOT, 'scripts', 'spec-trailer.mjs')).href);

test('Spec 行の書式: 仕様書のパスか「不要（理由）」だけを通す', () => {
  assert.equal(spec.findSpecLine('fix\n\nSpec: docs/spec/02_RD.md §2-4 を更新').problem, null);
  assert.equal(spec.findSpecLine('fix\n\nSpec: 不要（検査の追加だけで動きは変えていない）').problem, null);
  assert.equal(spec.findSpecLine('fix\r\n\r\nSpec: 不要(内部の関数名の変更のみ)').problem, null);
  assert.equal(spec.findSpecLine('git commit -m "fix\n\nSpec: docs/spec/04_UIUX.md を更新"').problem, null, '-m の引用符の中');
  assert.match(spec.findSpecLine('fix').problem, /Spec:` 行がありません/);
  assert.match(spec.findSpecLine('fix\n\nSpec:').problem, /空/);
  assert.match(spec.findSpecLine('fix\n\nSpec: 不要').problem, /理由/);
  assert.match(spec.findSpecLine('fix\n\nSpec: 不要（）').problem, /理由/);
  assert.match(spec.findSpecLine('fix\n\nSpec: 直した').problem, /docs\/spec/);
  assert.match(spec.findSpecLine('fix\n\nSpec: docs/316 を更新').problem, /docs\/spec/, '設計書だけでは仕様書を直したことにならない');
});

test('機能のコードの範囲: gas-src/・src/ だけ（生成物・検査・文書は対象外）', () => {
  for (const f of ['gas-src/Code.full.gs', 'src/components/TrainingManagement.tsx', 'src\\shared\\memberTenure.ts', './src/App.tsx']) {
    assert.equal(spec.isFunctionalPath(f), true, f);
  }
  for (const f of ['backend/Code.gs', 'gas/admin/Code.gs', 'scripts/test-guards.mts', 'docs/spec/02_RD.md', 'HANDOVER.md', 'srcx/a.ts']) {
    assert.equal(spec.isFunctionalPath(f), false, f);
  }
});

test('Spec-For: で過去のコミットを補える（書式が正しいときだけ）', () => {
  assert.deepEqual(spec.findSpecForHashes('docs\n\nSpec-For: 1a2b3c4 docs/spec/02_RD.md を直した\nSpec-For: ABCDEF0 不要（理由あり）'), ['1a2b3c4', 'abcdef0']);
  assert.deepEqual(spec.findSpecForHashes('Spec-For: 1a2b3c4 不要'), [], '理由の無い「不要」は補いにならない');
});

test('基点以降で機能のコードを変えたコミットは、すべて Spec 行を持つか Spec-For で補われている', async () => {
  const missing = await spec.findCommitsMissingSpec(ROOT);
  assert.deepEqual(missing, [], '仕様書の追従確認が済んでいないコミットがあります。Skill /spec-sync を実行し、'
    + '後のコミットに `Spec-For: <短縮ハッシュ> docs/spec/…` または `Spec-For: <短縮ハッシュ> 不要（理由）` を書いて補ってください。');
});
