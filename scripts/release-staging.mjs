// ステージングへ出す（2026-11-15・docs/334 §10.3）。
//   本番と同じ生成物を .tmp/staging/<key>/ に写し、ステージングのスクリプト ID で push → 版 → deployment を向け替える。
//   本番の .clasp.json・本番の deployment には一切触れない（本番の ID が定義に混ざっていたら最初に止まる）。
//   リポジトリの .clasp.json は本番を指すので使わない。clasp 3.4.1 は rootDir がプロジェクトの外を指すと拒むため、参照ではなく写す。
//
// 前提: この HEAD で prerelease が通っている・push の対象にコミットしていない変更が無い（本番の release:push と同じ）。
// 使い方: npm run release:staging
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  CLASP_PROJECTS, PRERELEASE_MARKER, STAGING_PROJECTS, STAGING_WORK_ROOT, STAGING_MARKER,
  productionScriptIds, stagingConfigProblems, stagingPushFiles, stagingClaspJson, projectFilesHash,
} from './release-config.mjs';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const markerPath = path.join(root, STAGING_MARKER);

function fail(message) {
  try { fs.rmSync(markerPath, { force: true }); } catch { /* 無ければよい */ }
  console.error('\n✖ ' + message);
  process.exit(1);
}

function clasp(args, cwd) {
  const r = spawnSync('npx', ['clasp', ...args], {
    cwd, encoding: 'utf8', shell: process.platform === 'win32', timeout: 300000,
  });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

function authHint(out) {
  return /invalid_rapt|invalid_grant|login/i.test(out) ? '（認証切れ。operator が `! npx clasp login` を実行してから再実行）' : '';
}

// 0. 定義（本番の ID が混ざっていない・3 つとも ID がある）
const prodDeployments = CLASP_PROJECTS.flatMap((p) => p.deployments);
const problems = stagingConfigProblems(STAGING_PROJECTS, productionScriptIds(root), prodDeployments);
if (problems.length) fail('ステージングの定義（scripts/release-config.mjs の STAGING_PROJECTS）に問題があります:\n  - ' + problems.join('\n  - '));

// 1. この HEAD で prerelease が通っている
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
let prerelease = null;
try { prerelease = JSON.parse(fs.readFileSync(path.join(root, PRERELEASE_MARKER), 'utf8')); } catch { /* 下で判定 */ }
if (!prerelease || prerelease.head !== head) fail(`この HEAD（${head.slice(0, 8)}）で prerelease が通っていません。先に npm run prerelease。`);

// 2. push の対象がコミット済み
const dirty = execFileSync('git', ['status', '--porcelain', '--', 'backend', 'gas', 'gas-src', 'src'], { cwd: root, encoding: 'utf8' }).trim();
if (dirty) fail('push の対象にコミットしていない変更があります:\n' + dirty);

// 3. 写す → push（1 つでも失敗したら止める）
// Windows では shell 経由で渡すため、空白を含むと引数が割れる（2026-11-15 に create-version が "too many arguments"）
const desc = `staging-${head.slice(0, 8)}`;
const result = {};
for (const p of STAGING_PROJECTS) {
  const work = path.join(root, STAGING_WORK_ROOT, p.key);
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  for (const f of stagingPushFiles(root, p.sourceDir)) fs.copyFileSync(path.join(root, p.sourceDir, f), path.join(work, f));
  fs.writeFileSync(path.join(work, '.clasp.json'), stagingClaspJson(p.scriptId), 'utf8');
  console.log(`\n▶ ステージングの ${p.key} を push しています…`);
  const r = clasp(['push', '-f'], work);
  process.stdout.write(r.out.split('\n').slice(-3).join('\n') + '\n');
  if (r.status !== 0 || !/Pushed (\d+ files|one file) at /.test(r.out)) fail(`${p.key} の push に失敗しました${authHint(r.out)}。`);
  result[p.key] = { scriptId: p.scriptId, hash: projectFilesHash(root, { filesDir: p.sourceDir }) };
}

// 4. 版（3 つとも push できてから）
for (const p of STAGING_PROJECTS) {
  const r = clasp(['create-version', desc], path.join(root, STAGING_WORK_ROOT, p.key));
  const m = r.out.match(/Created version (\d+)/);
  if (r.status !== 0 || !m) fail(`${p.key} の版の作成に失敗しました${authHint(r.out)}。\n${r.out.trim()}`);
  result[p.key].version = Number(m[1]);
  console.log(`  ${p.key}: 版 ${m[1]}`);
}

// 5. deployment の向け替え（まだ無い split は飛ばす。最初の 1 本は operator が画面で作る・S-1）
const skipped = [];
for (const p of STAGING_PROJECTS) {
  if (!p.deployment) { skipped.push(p.key); continue; }
  const r = clasp(['redeploy', p.deployment, '-V', String(result[p.key].version), '-d', desc], path.join(root, STAGING_WORK_ROOT, p.key));
  if (r.status !== 0) fail(`${p.key} の deployment の向け替えに失敗しました${authHint(r.out)}。\n${r.out.trim()}`);
  result[p.key].deployment = p.deployment;
}

fs.mkdirSync(path.dirname(markerPath), { recursive: true });
fs.writeFileSync(markerPath, JSON.stringify({ head, at: new Date().toISOString(), projects: result }, null, 2) + '\n', 'utf8');
console.log(`\n✔ ステージングへ出しました（HEAD ${head.slice(0, 8)}）。`);
if (skipped.length) {
  console.log(`  deployment が未設定のため向け替えていない split: ${skipped.join(' / ')}`
    + '（operator が Apps Script の画面で作り、ID を STAGING_PROJECTS に書く・docs/334 §10.5 O1）');
}
