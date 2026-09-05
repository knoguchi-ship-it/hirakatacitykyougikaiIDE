/**
 * v376.71 回帰テスト: ログイン失敗の時限解除（docs/261 T-04）。
 *
 * 背景: ログイン ID が介護支援専門員番号で推測できるため、以前の「5 回で無期限ロック」は
 * 第三者が故意に他人のアカウントを止められる状態だった。連続失敗を段階的な待機に置き換える。
 *
 * 壊れると実害が大きいのは次の 4 点。実ソースから関数を切り出して評価する。
 *   1. 成功したら失敗回数が 0 に戻ること（連続失敗のカウントであること）
 *   2. 待機を過ぎたロックが自動で解けること（利用者を締め出したままにしない）
 *   3. 恒久ロックが時間では解けないこと
 *   4. ロック中の文言がパスワード不一致と同じであること（ロック状態を攻撃者に教えない）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

/** 実ソースから関数定義を切り出して評価する（ミラー実装を書かない・AGENTS.md §3） */
function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  let i = gas.indexOf('{', start);
  const from = i;
  for (; i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない (from=${from})`);
}

function extractPolicy(): string {
  const start = gas.indexOf('var LOGIN_LOCKOUT_POLICY = {');
  assert.notEqual(start, -1, 'LOGIN_LOCKOUT_POLICY が見つからない');
  const end = gas.indexOf('\n};', start);
  return gas.slice(start, end + 3);
}

const sandbox = `
${extractPolicy()}
${extractFunction('loginLockoutWaitMinutes_')}
${extractFunction('isLoginLockoutPermanent_')}
${extractFunction('evaluateLoginLockState_')}
return { LOGIN_LOCKOUT_POLICY, loginLockoutWaitMinutes_, isLoginLockoutPermanent_, evaluateLoginLockState_ };
`;
const api = new Function(sandbox)() as {
  LOGIN_LOCKOUT_POLICY: { steps: Array<{ failures: number; waitMinutes: number }>; permanentAtFailures: number };
  loginLockoutWaitMinutes_: (n: number) => number;
  isLoginLockoutPermanent_: (n: number) => boolean;
  evaluateLoginLockState_: (locked: boolean, failed: number, until: string, nowMs: number) =>
    { locked: boolean; permanent: boolean; expired: boolean };
};

const NOW = Date.UTC(2026, 8, 4, 12, 0, 0);
const FUTURE = new Date(NOW + 60_000).toISOString();
const PAST = new Date(NOW - 60_000).toISOString();

// ── 待機時間の段階 ───────────────────────────────────────
test('2 回目まではロックしない（打ち間違いで締め出さない）', () => {
  assert.equal(api.loginLockoutWaitMinutes_(0), 0);
  assert.equal(api.loginLockoutWaitMinutes_(1), 0);
  assert.equal(api.loginLockoutWaitMinutes_(2), 0);
});

test('確定仕様どおりに待機が伸びる（3→1 / 4→5 / 5→15 / 6→60 分）', () => {
  assert.equal(api.loginLockoutWaitMinutes_(3), 1);
  assert.equal(api.loginLockoutWaitMinutes_(4), 5);
  assert.equal(api.loginLockoutWaitMinutes_(5), 15);
  assert.equal(api.loginLockoutWaitMinutes_(6), 60);
});

test('待機は 60 分で頭打ち', () => {
  assert.equal(api.loginLockoutWaitMinutes_(7), 60);
  assert.equal(api.loginLockoutWaitMinutes_(19), 60);
  assert.equal(api.loginLockoutWaitMinutes_(999), 60);
});

test('★連続 20 回で恒久ロックへ移行する', () => {
  assert.equal(api.isLoginLockoutPermanent_(19), false);
  assert.equal(api.isLoginLockoutPermanent_(20), true);
  assert.equal(api.LOGIN_LOCKOUT_POLICY.permanentAtFailures, 20);
});

// ── 解除の判定 ──────────────────────────────────────────
test('待機中は解除しない（待ち時間の短縮を許さない）', () => {
  const st = api.evaluateLoginLockState_(true, 3, FUTURE, NOW);
  assert.equal(st.locked, true);
  assert.equal(st.expired, false);
});

test('★待機を過ぎたら自動解除の対象になる', () => {
  assert.equal(api.evaluateLoginLockState_(true, 3, PAST, NOW).expired, true);
});

test('★恒久ロックは時間では解けない（管理者対応が要る）', () => {
  const st = api.evaluateLoginLockState_(true, 20, PAST, NOW);
  assert.equal(st.permanent, true);
  assert.equal(st.expired, false);
  assert.equal(st.locked, true);
});

test('★解除予定が空の旧データ（v376.70 以前の無期限ロック）は解除対象', () => {
  // これが false だと、移行前にロックされた会員が永久に入れない
  assert.equal(api.evaluateLoginLockState_(true, 5, '', NOW).expired, true);
});

test('壊れた日時でも締め出しを残さない', () => {
  assert.equal(api.evaluateLoginLockState_(true, 5, 'not-a-date', NOW).expired, true);
});

test('ロックしていなければ locked=false', () => {
  assert.equal(api.evaluateLoginLockState_(false, 2, '', NOW).locked, false);
});

// ── 実装側の結線 ────────────────────────────────────────
test('★成功時は失敗回数・ロック・解除予定をすべて戻す', () => {
  const fn = extractFunction('clearLoginLockout_');
  for (const col of ['ログイン失敗回数', 'ロック状態', 'ロック解除予定日時']) {
    assert.ok(fn.includes(col), `${col} をリセットしていない`);
  }
  // 会員ログインの成功経路で呼ばれていること
  const login = extractFunction('memberLogin_');
  assert.ok(login.includes('clearLoginLockout_'), 'ログイン成功時にリセットしていない');
});

test('★ロック中の文言はパスワード不一致と同じ（ロック状態を教えない）', () => {
  const login = extractFunction('memberLogin_');
  assert.ok(!login.includes("throw new Error('アカウントがロックされています。')"),
    'ログイン画面でロック状態を明かしている');
  const occurrences = login.split('ログインIDまたはパスワードが正しくありません。').length - 1;
  assert.ok(occurrences >= 3, `統一文言の使用箇所が少ない: ${occurrences}`);
});

test('★閾値がベタ書きで残っていない（単一情報源）', () => {
  const login = extractFunction('memberLogin_');
  assert.ok(!/failedCount\s*>=\s*5/.test(login), 'ログインに 5 のベタ書きが残っている');
  const change = extractFunction('changePassword_');
  assert.ok(!/failedCount\s*>=\s*5/.test(change), 'パスワード変更に 5 のベタ書きが残っている');
});

test('スキーマに ロック解除予定日時 があり、スキーマ版数が上がっている', () => {
  assert.ok(gas.includes("'ロック解除予定日時',"), 'テーブル定義に列が無い');
  assert.match(gas, /DB_SCHEMA_VERSION = '2026-09-04-login-lockout-v376\.71'/);
});

// ── v376.78: 管理画面からのロック解除（SOW U-26）──────────────
function codeOnly(source: string): string {
  return source.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
}

test('ロック解除はロック状態・失敗回数・解除予定日時を戻す', () => {
  const body = codeOnly(extractFunction('adminUnlockMemberAccount_'));
  assert.ok(/clearLoginLockout_\(/.test(body),
    'ログイン成功時と同じ clearLoginLockout_ を通していない（判定を 2 箇所で持たない）');
  const clear = codeOnly(extractFunction('clearLoginLockout_'));
  for (const col of ['ログイン失敗回数', 'ロック状態', 'ロック解除予定日時']) {
    assert.ok(clear.includes(col), `${col} を戻していない`);
  }
});

test('ロック解除はパスワードを変えない', () => {
  const body = codeOnly(extractFunction('adminUnlockMemberAccount_'));
  for (const forbidden of ['パスワードハッシュ', 'パスワードソルト', 'generateCredentialTempPassword_', 'hashPasswordCurrent_']) {
    assert.ok(!body.includes(forbidden),
      `パスワードに触れている（${forbidden}）。解除はロックだけを戻す機能である`);
  }
});

test('ロック解除は管理者認証と排他制御を通す', () => {
  const body = codeOnly(extractFunction('adminUnlockMemberAccount_'));
  assert.ok(/checkAdminBySession_\(\)/.test(body), '管理者認証を確認していない');
  assert.ok(/getScriptLock/.test(body), 'ロックを取得していない');
  assert.ok(/削除済みの認証アカウント/.test(body), '削除済みアカウントを弾いていない');
  assert.ok(/パスワード認証のアカウントではありません/.test(body), 'PASSWORD 以外を弾いていない');
});

test('ロック解除は監査ログに残す（秘密値は書かない）', () => {
  const body = codeOnly(extractFunction('adminUnlockMemberAccount_'));
  assert.ok(/ACCOUNT_UNLOCK/.test(body), '監査ログの操作種別が無い');
  assert.ok(!/パスワード['"]?\s*[:+]/.test(body.replace(/パスワードは変更していない/g, '')),
    '監査ログにパスワードを書いている');
});