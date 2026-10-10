/**
 * 2026-10-10 回帰テスト: 最初の読み込みが返らないときの自動再試行（docs/302 §2）。
 *
 * デプロイ直後に管理画面が「認証を確認しています…」のまま 3 分以上止まった。
 * 最初の呼び出しが返らず、画面側に待ち時間の上限が無かった。
 *
 *   1. 返らない呼び出しは打ち切って呼び直す。上限に達したら案内を出す（実行）
 *   2. サーバーが返したエラーは呼び直さない（実行）
 *   3. 打ち切った呼び出しが後から返っても使わない（実行）
 *   4. 管理・会員・公開の 3 画面が同じ仕組み・同じ表示を使う。設定値は 1 か所だけ（配線）
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONNECTION_RETRY_POLICY,
  ConnectionGaveUpError,
  callWithConnectionRetry,
  getConnectionRetryStatus,
  subscribeConnectionRetryStatus,
  resetConnectionRetryStatusForTest,
} from '../src/shared/connectionRetry.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAST = { timeoutMs: 30, maxAttempts: 5 };
const never = <T,>() => new Promise<T>(() => {});
const later = <T,>(ms: number, value: T) => new Promise<T>((r) => setTimeout(() => r(value), ms));

beforeEach(() => resetConnectionRetryStatusForTest());

test('本番の設定は 15 秒 × 最大 5 回', () => {
  assert.deepEqual({ ...CONNECTION_RETRY_POLICY }, { timeoutMs: 15000, maxAttempts: 5 });
});

test('すぐ返れば 1 回で終わり、再試行の表示も出ない', async () => {
  let calls = 0;
  const seen: string[] = [];
  const off = subscribeConnectionRetryStatus(() => seen.push(getConnectionRetryStatus().kind));
  assert.equal(await callWithConnectionRetry(() => { calls += 1; return Promise.resolve('ok'); }, FAST), 'ok');
  off();
  assert.equal(calls, 1);
  assert.ok(!seen.includes('retrying'));
  assert.equal(getConnectionRetryStatus().kind, 'idle');
});

test('1 回目が返らなければ打ち切って呼び直し、2 回目の結果を使う。途中で「2/5」を表示する', async () => {
  let calls = 0;
  const seen: string[] = [];
  const off = subscribeConnectionRetryStatus(() => {
    const s = getConnectionRetryStatus();
    if (s.kind === 'retrying') seen.push(`${s.attempt}/${s.maxAttempts}`);
  });
  const value = await callWithConnectionRetry(() => { calls += 1; return calls === 1 ? never<string>() : Promise.resolve('second'); }, FAST);
  off();
  assert.equal(value, 'second');
  assert.equal(calls, 2);
  assert.deepEqual(seen, ['2/5']);
  assert.equal(getConnectionRetryStatus().kind, 'idle');
});

test('5 回とも返らなければあきらめ、案内の状態になる（再読み込みまで消えない）', async () => {
  let calls = 0;
  await assert.rejects(callWithConnectionRetry(() => { calls += 1; return never(); }, FAST), ConnectionGaveUpError);
  assert.equal(calls, 5);
  assert.equal(getConnectionRetryStatus().kind, 'gaveUp');
  await callWithConnectionRetry(() => Promise.resolve(1), FAST);
  assert.equal(getConnectionRetryStatus().kind, 'gaveUp');
});

test('サーバーが返したエラーは呼び直さない（権限なし等は「答え」）', async () => {
  let calls = 0;
  await assert.rejects(
    callWithConnectionRetry(() => { calls += 1; return Promise.reject(new Error('insufficient_permission')); }, FAST),
    /insufficient_permission/,
  );
  assert.equal(calls, 1);
  assert.equal(getConnectionRetryStatus().kind, 'idle');
});

test('打ち切った呼び出しが後から返っても、その結果は使わない', async () => {
  let calls = 0;
  const value = await callWithConnectionRetry(() => {
    calls += 1;
    return calls === 1 ? later(60, 'late-first') : later(5, 'second');
  }, FAST);
  assert.equal(value, 'second');
});

// ── 配線（配置の確認なので文字列照合でよい）──────────────────────────
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('管理・会員（App.tsx）と公開ポータルが同じ表示部品を置いている', () => {
  for (const p of ['src/App.tsx', 'src/public-portal/App.tsx']) {
    const src = read(p);
    assert.match(src, /import ConnectionRetryNotice from '\.\.?\/components\/ConnectionRetryNotice';/, p);
    assert.match(src, /<ConnectionRetryNotice \/>/, p);
  }
});

test('最初の読み込みはすべて callWithConnectionRetry を通る', () => {
  const app = read('src/App.tsx');
  for (const call of [
    'api.getMemberPortalData(lookup)',
    'api.getAdminInitData()',
    'api.checkAdminBySession()',
  ]) {
    const all = app.split(call).length - 1;
    const wrapped = app.split(`callWithConnectionRetry(() => ${call})`).length - 1;
    assert.ok(all > 0, `${call} が見つからない`);
    assert.equal(wrapped, all, `${call} に包まれていない呼び出しがある`);
  }
  const pub = read('src/public-portal/App.tsx');
  assert.match(pub, /callWithConnectionRetry\(\(\) => callApi<PublicTraining\[\]>\('getPublicTrainings'\)\)/);
  assert.match(pub, /callWithConnectionRetry\(\(\) => callApi<[^>]+>\('getPublicPortalSettings'\)\)/);
});

test('待ち時間と回数、案内文は shared/connectionRetry.ts にしか無い（単一情報源）', () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !p.endsWith(path.join('shared', 'connectionRetry.ts'))) {
        const src = read(p);
        if (/時間をおいてアクセスしてみてください|maxAttempts:\s*5\b/.test(src)) offenders.push(p);
      }
    }
  };
  walk('src');
  assert.deepEqual(offenders, []);
});
