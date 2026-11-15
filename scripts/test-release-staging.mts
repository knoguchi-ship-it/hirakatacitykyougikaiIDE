/**
 * 2026-11-15 ステージングへ出す仕組み（docs/334 §10.3・scripts/release-staging.mjs）。
 *   ステージングの定義に本番の ID が混ざったら止まること、写す元が本番の生成物と同じ場所であること、
 *   release:staging が本番の .clasp.json・本番の deployment を使わないことを確かめる。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = await import(pathToFileURL(path.join(ROOT, 'scripts', 'release-config.mjs')).href);
const PROD_IDS: string[] = cfg.productionScriptIds(ROOT);
const PROD_DEPLOYMENTS: string[] = cfg.CLASP_PROJECTS.flatMap((p: { deployments: string[] }) => p.deployments);

const good = () => [
  { key: 'public', sourceDir: 'backend', scriptId: 'S_PUB', deployment: 'D_PUB' },
  { key: 'member', sourceDir: 'gas/member', scriptId: 'S_MEM', deployment: 'D_MEM' },
  { key: 'admin', sourceDir: 'gas/admin', scriptId: 'S_ADM', deployment: '' },
];

test('本番のスクリプト ID は本番の .clasp.json の 3 つ', () => {
  assert.equal(PROD_IDS.length, 3);
  assert.ok(PROD_IDS.every((id) => typeof id === 'string' && id.length > 20));
});

test('正しい定義は問題なし（deployment が空の split はあってよい）', () => {
  assert.deepEqual(cfg.stagingConfigProblems(good(), PROD_IDS, PROD_DEPLOYMENTS), []);
});

test('本番のスクリプト ID・本番の deployment が混ざったら止まる', () => {
  for (const id of PROD_IDS) {
    const s = good(); s[2].scriptId = id;
    assert.ok(cfg.stagingConfigProblems(s, PROD_IDS, PROD_DEPLOYMENTS).some((m: string) => m.includes('本番')), id);
  }
  for (const d of PROD_DEPLOYMENTS) {
    const s = good(); s[0].deployment = d;
    assert.ok(cfg.stagingConfigProblems(s, PROD_IDS, PROD_DEPLOYMENTS).some((m: string) => m.includes('本番')), d);
  }
});

test('ID の未設定・重複・split の欠け・写す元の違いは止まる', () => {
  const a = good(); a[1].scriptId = '';
  assert.ok(cfg.stagingConfigProblems(a, PROD_IDS, PROD_DEPLOYMENTS).some((m: string) => m.includes('未設定')));
  const b = good(); b[1].scriptId = 'S_PUB';
  assert.ok(cfg.stagingConfigProblems(b, PROD_IDS, PROD_DEPLOYMENTS).some((m: string) => m.includes('重複')));
  const c = good().slice(0, 2);
  assert.ok(cfg.stagingConfigProblems(c, PROD_IDS, PROD_DEPLOYMENTS).some((m: string) => m.includes('一覧')));
  const d = good(); d[2].sourceDir = 'gas/member';
  assert.ok(cfg.stagingConfigProblems(d, PROD_IDS, PROD_DEPLOYMENTS).some((m: string) => m.includes('写す元')));
});

test('いまの STAGING_PROJECTS に本番の ID は無い（未設定は作る前なので許す）', () => {
  const problems = cfg.stagingConfigProblems(cfg.STAGING_PROJECTS, PROD_IDS, PROD_DEPLOYMENTS)
    .filter((m: string) => !m.includes('未設定'));
  assert.deepEqual(problems, []);
});

test('写した先の .clasp.json はそのフォルダ自身を rootDir にする', () => {
  const j = JSON.parse(cfg.stagingClaspJson('S_X'));
  assert.equal(j.scriptId, 'S_X');
  assert.equal(j.rootDir, '');
});

test('写すファイルは本番の push と同じ選び方（.clasp で始まるものを除く）', () => {
  for (const p of cfg.STAGING_PROJECTS) {
    const files: string[] = cfg.pushedFiles(ROOT, p.sourceDir);
    assert.ok(files.includes('Code.gs') && files.includes('appsscript.json'), `${p.key}: ${files.join(',')}`);
    assert.ok(!files.some((f) => f.startsWith('.clasp')));
  }
});

test('写すファイルは本番の .claspignore が除くもの（古い Code.js）を含まない', () => {
  const ignore = fs.readFileSync(path.join(ROOT, '.claspignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
  for (const f of cfg.STAGING_EXCLUDED_FILES) assert.ok(ignore.includes(f), `本番の .claspignore に ${f} が無い（除く理由が無くなった）`);
  for (const p of cfg.STAGING_PROJECTS) {
    const files: string[] = cfg.stagingPushFiles(ROOT, p.sourceDir);
    assert.ok(!files.includes('Code.js'), `${p.key}: Code.js を写している`);
    const scripts = files.filter((f) => /\.(gs|js)$/.test(f)).map((f) => f.replace(/\.(gs|js)$/, ''));
    assert.equal(new Set(scripts).size, scripts.length, `${p.key}: 同じ名前のスクリプトが 2 つある（clasp が衝突で止まる）`);
  }
});

test('release:staging は本番の deployment・本番のフォルダで clasp を動かさない', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'release-staging.mjs'), 'utf8');
  // clasp を動かす場所は写した先（STAGING_WORK_ROOT）だけ
  for (const m of src.matchAll(/clasp\(\[[^\]]*\],\s*([^)]+)\)/g)) {
    assert.ok(/STAGING_WORK_ROOT|work\b/.test(m[1]), `clasp を写した先以外で動かしている: ${m[0]}`);
  }
  for (const d of PROD_DEPLOYMENTS) assert.ok(!src.includes(d), '本番の deployment ID を直書きしている');
  assert.ok(src.includes('stagingConfigProblems('), '最初に定義を確かめていない');
  assert.ok(/clasp\(\['push'/.test(src) && !/['"]deploy['"]/.test(src), 'clasp deploy を使っている（H1）');
});
