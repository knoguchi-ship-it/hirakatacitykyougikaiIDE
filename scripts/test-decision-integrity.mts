/**
 * 2026-10-14: docs/307 §4-1 の 3 件（データ・権限に直結するもの）の回帰テスト。
 *
 * - SX 変更申請の承認・却下に排他が無く、同時に承認すると二重に反映しえた
 * - S37 退会の確定で、認証の表・列が無いと黙って戻り、退会したのにログインが残った
 * - E1 公開トークンの署名を !== で比べていた（時間一定でない）
 *
 * 判定は build 後の生成物から関数を取り出して実行する（ミラー実装を書かない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const gas = read('gas-src/Code.full.gs');
const adminArtifact = read('gas/admin/Code.gs');
const publicArtifact = read('backend/Code.gs');

function extractFunction(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} の終端が見つからない`);
}

const codeOnly = (s: string) => s.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

// ── SX 承認・却下の排他 ────────────────────────────────────────────
function makeLockRunner(tryLockResult: boolean) {
  const calls: string[] = [];
  const LockService = {
    getScriptLock: () => ({
      tryLock: (ms: number) => { calls.push('tryLock:' + ms); return tryLockResult; },
      releaseLock: () => { calls.push('release'); },
    }),
  };
  const run = new Function('LockService', `${extractFunction(adminArtifact, 'withChangeRequestDecisionLock_')}
    return withChangeRequestDecisionLock_;`)(LockService) as (fn: () => unknown) => any;
  return { run, calls };
}

test('★承認・却下: ロックが取れなければ処理せず、理由を返す', () => {
  const { run, calls } = makeLockRunner(false);
  let called = false;
  const result = run(() => { called = true; return { success: true }; });
  assert.equal(called, false, 'ロックが取れないのに承認を進めた');
  assert.equal(result.success, false);
  assert.match(result.error, /ほかの承認・却下を処理しています/);
  assert.deepEqual(calls, ['tryLock:30000']);
});

test('★承認・却下: ロックの中で処理し、失敗しても必ず解放する', () => {
  const ok = makeLockRunner(true);
  assert.deepEqual(ok.run(() => ({ success: true, requestId: 'CR1' })), { success: true, requestId: 'CR1' });
  assert.deepEqual(ok.calls, ['tryLock:30000', 'release']);
  const ng = makeLockRunner(true);
  assert.throws(() => ng.run(() => { throw new Error('途中で失敗'); }), /途中で失敗/);
  assert.deepEqual(ng.calls, ['tryLock:30000', 'release'], '例外のときにロックを解放していない');
});

test('★承認・却下の入口は必ずロックを通す（状態の確認もロックの中）', () => {
  for (const action of ['approveAdminChangeRequest', 'rejectAdminChangeRequest']) {
    const at = gas.indexOf(`if (action === '${action}') {`);
    assert.notEqual(at, -1, `${action} の分岐が無い`);
    const branch = gas.slice(at, gas.indexOf('}', gas.indexOf('return JSON.stringify({ success: true', at)));
    assert.match(branch, new RegExp(`withChangeRequestDecisionLock_\\(function\\(\\) \\{ return ${action}_\\(parsedPayload\\); \\}\\)`),
      `${action} がロックを通らずに呼ばれている`);
  }
  // 承認・却下を直接呼ぶのは、入口と dryRun（ロック付き）だけ
  const direct = [...codeOnly(gas).matchAll(/(?<!function )\b(approveAdminChangeRequest_|rejectAdminChangeRequest_)\(/g)].length;
  assert.equal(direct, 3, '承認・却下を直接呼ぶ箇所が増えた（ロックを通しているか確かめること）');
});

// ── S37 退会の確定とログインの停止 ──────────────────────────────────
type Cell = unknown;
function makeSheet(rows: Cell[][]) {
  const data = rows.map((r) => r.slice());
  const writes: number[] = [];
  return {
    data, writes,
    getLastRow: () => data.length,
    getLastColumn: () => (data[0] ? data[0].length : 0),
    getRange: (r: number, c: number, nr: number, nc: number) => ({
      getValues: () => data.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
      setValues: (vals: Cell[][]) => { vals.forEach((v, i) => { data[r - 1 + i] = v.slice(); writes.push(r + i); }); },
    }),
  };
}

const promote = new Function('Utilities', `
  ${extractFunction(adminArtifact, 'toBoolean_')}
  ${extractFunction(adminArtifact, 'normalizeDateInput_')}
  ${extractFunction(adminArtifact, 'promoteScheduledWithdrawals_')}
  return promoteScheduledWithdrawals_;
`)({ formatDate: (d: Date) => d.toISOString().slice(0, 10) }) as (ss: unknown, now: Date) => void;

const MEMBER_HEADER = ['会員ID', '会員状態コード', '退会日', '削除フラグ', '更新日時'];
const memberRows = () => [MEMBER_HEADER, ['M1', 'WITHDRAWAL_SCHEDULED', '2026-03-31', false, ''], ['M2', 'ACTIVE', '', false, '']];
const now = new Date('2026-04-01T03:00:00Z');

test('★退会の確定: 会員を退会にし、その会員のログインを止める', () => {
  const members = makeSheet(memberRows());
  const auth = makeSheet([['会員ID', 'アカウント有効フラグ', '更新日時'], ['M1', true, ''], ['M2', true, '']]);
  promote({ getSheetByName: (n: string) => (n === 'T_会員' ? members : n === 'T_認証アカウント' ? auth : null) }, now);
  assert.equal(members.data[1][1], 'WITHDRAWN');
  assert.equal(auth.data[1][1], false, '退会した会員のログインが残っている');
  assert.equal(auth.data[2][1], true, '退会していない会員のログインまで止めた');
});

test('★退会の確定: 認証の表が無ければ、会員を書き換えずに止めて知らせる', () => {
  const members = makeSheet(memberRows());
  assert.throws(() => promote({ getSheetByName: (n: string) => (n === 'T_会員' ? members : null) }, now), /退会の確定を止めました（1 名）/);
  assert.equal(members.data[1][1], 'WITHDRAWAL_SCHEDULED', '止めたのに会員を退会にした（ログインが残る）');
  assert.deepEqual(members.writes, []);
});

test('★退会の確定: 認証の表に列が無ければ、会員を書き換えずに止めて知らせる', () => {
  const members = makeSheet(memberRows());
  const auth = makeSheet([['会員ID', '更新日時'], ['M1', '']]);
  assert.throws(() => promote({ getSheetByName: (n: string) => (n === 'T_会員' ? members : n === 'T_認証アカウント' ? auth : null) }, now), /アカウント有効フラグ/);
  assert.deepEqual(members.writes, []);
});

test('退会の確定: 対象が 0 名なら、認証の表が無くても何もしない', () => {
  const members = makeSheet([MEMBER_HEADER, ['M2', 'ACTIVE', '', false, '']]);
  assert.doesNotThrow(() => promote({ getSheetByName: (n: string) => (n === 'T_会員' ? members : null) }, now));
});

// ── E1 公開トークンの署名 ───────────────────────────────────────────
test('★公開トークンの署名は時間一定で比べる', () => {
  const body = codeOnly(extractFunction(publicArtifact, 'verifyPublicIdentityToken_'));
  assert.match(body, /secureCompareString_\(sig, expectedSig\)/);
  assert.doesNotMatch(body, /sig !== expectedSig|sig != expectedSig|sig === expectedSig/);
  const cmp = new Function(`${extractFunction(publicArtifact, 'secureCompareString_')} return secureCompareString_;`)() as (a: string, b: string) => boolean;
  assert.equal(cmp('abc', 'abc'), true);
  assert.equal(cmp('abc', 'abd'), false);
  assert.equal(cmp('abc', 'abcd'), false);
  assert.equal(cmp('', ''), true);
});
