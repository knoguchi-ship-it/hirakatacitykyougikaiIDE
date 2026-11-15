/**
 * 生成物の鮮度検査（2026-10-02 新設 / docs/296 §4.1）
 *
 * **2026-10-02 に実際に踏んだ穴。** `gas-src/Code.full.gs` を編集した状態で
 * `npm run prerelease` が exit 0 で通り、`backend/Code.gs` などは古いままだった。
 * その生成物を push していれば、直したはずのコードが本番に入らない。
 *
 * 既存の `test:gas-artifact-refs` は「生成物の内部で参照が解決するか」を見ており、
 * **入力とのずれ**は誰も見ていなかった。
 *
 * 方式: ビルドスクリプトが生成物の先頭に入力のハッシュを刻む。ここで再計算して突き合わせる。
 *
 * 検出できる範囲（正直に書いておく）:
 *   ✅ gas-src を編集して build を忘れた
 *   ✅ ビルドスクリプト本体 / gas-boundary-utils を変えて build を忘れた
 *   ❌ menu-registry や src/shared の build 注入元だけを変えた場合
 *      （入力に含めていない。含めすぎると誤検知で信用を失うため意図的に絞った）
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { buildInputFingerprint, readBuildFingerprint } from './gas-boundary-utils.mjs';
import { readGasSource } from './lib/gas-source.mjs';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, ...p.split('/')), 'utf8');

const SOURCE = 'gas-src/*.gs';
const HELPER = 'scripts/gas-boundary-utils.mjs';

const SPLITS = [
  { label: '公開（統合）', builder: 'scripts/build-gas.mjs', output: 'backend/Code.gs', npm: 'build:gas' },
  { label: '会員', builder: 'scripts/build-member-gas.mjs', output: 'gas/member/Code.gs', npm: 'build:gas:member' },
  { label: '管理者', builder: 'scripts/build-admin-gas.mjs', output: 'gas/admin/Code.gs', npm: 'build:gas:admin' },
];

for (const split of SPLITS) {
  test(`${split.label} split の生成物が gas-src と同期している`, () => {
    const expected = buildInputFingerprint(createHash, [
      readGasSource(),
      read(split.builder),
      read(HELPER),
    ]);
    const actual = readBuildFingerprint(read(split.output));

    assert.notEqual(actual, null,
      `${split.output} に入力ハッシュが刻まれていない。`
      + `\`npm run ${split.npm}\` を実行してください`);

    assert.equal(actual, expected,
      `${split.output} が古い。\`${SOURCE}\` か \`${split.builder}\` か \`${HELPER}\` を`
      + `編集したあと \`npm run ${split.npm}\` を実行していません。`
      + '\n  この状態で push すると、直したはずのコードが本番に入りません。');
  });
}

test('3 split すべてが同じ gas-src から作られている', () => {
  // 1 つだけ再ビルドして他を忘れる、という半端な状態を検出する。
  // 指紋はビルドスクリプトごとに違うので、gas-src の部分だけを別途突き合わせる。
  const sourceHash = buildInputFingerprint(createHash, [readGasSource()]);
  const stale: string[] = [];
  for (const split of SPLITS) {
    const expected = buildInputFingerprint(createHash, [readGasSource(), read(split.builder), read(HELPER)]);
    if (readBuildFingerprint(read(split.output)) !== expected) stale.push(`${split.label}（${split.npm}）`);
  }
  assert.deepEqual(stale, [],
    `古い生成物があります: ${stale.join(' / ')}。gas-src のハッシュは ${sourceHash.slice(0, 8)}`);
});

test('gas-src は領域ごとのファイルで、つなげる順の先頭は 00_core_env（2026-11-15 に Code.full.gs から分けた）', () => {
  const files = fs.readdirSync(path.join(root, 'gas-src')).filter((f) => f.endsWith('.gs')).sort();
  assert.ok(!files.includes('Code.full.gs'), 'Code.full.gs が戻っている（元は領域ごとのファイル。二重の元になる）');
  assert.ok(files.length >= 20, `gas-src の .gs が少ない: ${files.join(', ')}`);
  assert.equal(files[0], '00_core_env.gs', '先頭は 00_core_env（読み込み時に使う定数・本番の判定が先）');
  for (const f of files) assert.match(f, /^\d\d_[a-z0-9_]+\.gs$/, `${f}: 名前は「2 桁の番号_領域.gs」（つなげる順が名前で決まる）`);
  // 読み込み時に他の定数を使う文は、使う定数より後（並べ替えの事故を防ぐ）
  const src = readGasSource();
  const at = (s: string) => src.indexOf(s);
  for (const [later, earlier] of [
    ['var DB_SPREADSHEET_ID_FIXED =', 'var PRODUCTION_DB_SPREADSHEET_ID_ ='],
    ['var ARCHIVE_SOURCE_TABLES =', 'var テーブル定義 ='],
    ['var DRYRUN_PREFIX =', 'var TEST_DATA_NAME_PREFIX ='],
    ['var PUBLIC_UPDATE_ALLOWLIST_BY_TYPE_ =', 'var PUBLIC_SUPPORT_UPDATE_ALLOWLIST_ ='],
  ]) {
    assert.ok(at(earlier) >= 0 && at(later) > at(earlier), `${later} が ${earlier} より前にある`);
  }
  assert.ok(src.trimStart().replace(/^(\/\/[^\n]*\n|\s)+/, '').startsWith('var API_PROFILE_EVAL_STARTED_AT_MS_'), '最初の文は読み込み開始の計測');
});
