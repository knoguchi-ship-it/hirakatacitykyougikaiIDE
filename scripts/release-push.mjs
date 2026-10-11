// 3 プロジェクト（public / member / admin）を順に clasp push し、
// **全部成功したときだけ** 記録（.tmp/clasp-push-ok.json）を残す（2026-10-11 新設）。
//
// なぜ要るか: 2026-10-10 の v376.118 で、admin の push が失敗したのに気づかず
// create-version を打ち、古いコードの版 @287 ができた（使わない版として HANDOVER に残っている）。
// PreToolUse hook（.claude/hooks/guard-bash.mjs）がこの記録を見て、
// 記録と一致しないファイルでの `clasp create-version` と、直接の `clasp push` を止める。
//
// 前提として、この HEAD で prerelease が通っていること・生成物がコミット済みであることを確かめる。
// 使い方: npm run release:push
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CLASP_PROJECTS, PUSH_MARKER, PRERELEASE_MARKER, projectFilesHash } from './release-config.mjs';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const markerPath = path.join(root, PUSH_MARKER);

function fail(message) {
  try { fs.rmSync(markerPath, { force: true }); } catch { /* 記録が無ければそれでよい */ }
  console.error('\n✗ ' + message);
  console.error('  create-version へ進まないこと（hook も止める）。');
  process.exit(1);
}

// 1. この HEAD で prerelease が通っている
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
let prerelease = null;
try { prerelease = JSON.parse(fs.readFileSync(path.join(root, PRERELEASE_MARKER), 'utf8')); } catch { /* 下で判定 */ }
if (!prerelease || prerelease.head !== head) {
  fail(`この HEAD（${head.slice(0, 8)}）で prerelease が通っていません。先に npm run prerelease。`);
}

// 2. push するものがコミット済み（本番に出したものを git で再現できるように）
const dirty = execFileSync('git', ['status', '--porcelain', '--', 'backend', 'gas', 'gas-src', 'src'],
  { cwd: root, encoding: 'utf8' }).trim();
if (dirty) fail('push 対象に未コミットの変更があります:\n' + dirty);

// 3. 順に push。1 つでも失敗したらそこで止める
const projects = {};
for (const project of CLASP_PROJECTS) {
  console.log(`\n▶ ${project.key}（${project.dir}）を push しています…`);
  const r = spawnSync('npx', ['clasp', 'push', '-f'], {
    cwd: path.join(root, project.dir), encoding: 'utf8', shell: process.platform === 'win32', timeout: 300000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  process.stdout.write(out.split('\n').slice(-3).join('\n') + '\n');
  // 終了コード 0 だけでは信用しない。clasp の成功文言まで確かめる
  if (r.status !== 0 || !/Pushed (\d+ files|one file) at /.test(out)) {
    if (/invalid_rapt|invalid_grant|login/i.test(out)) {
      fail(`${project.key} の push に失敗しました（認証切れ）。operator が \`! npx clasp login\` を実行してから再実行。`);
    }
    fail(`${project.key} の push に失敗しました（終了コード ${r.status}）。`);
  }
  projects[project.key] = { hash: projectFilesHash(root, project) };
}

fs.mkdirSync(path.dirname(markerPath), { recursive: true });
fs.writeFileSync(markerPath, JSON.stringify({ head, at: new Date().toISOString(), projects }, null, 2) + '\n', 'utf8');
console.log(`\n✓ 3 プロジェクトとも push しました（HEAD ${head.slice(0, 8)}）。create-version へ進めます。`);
