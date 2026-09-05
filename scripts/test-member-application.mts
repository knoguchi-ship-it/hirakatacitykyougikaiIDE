/**
 * v376.73 回帰テスト: 入会申込フロー（個人 / 賛助 / 事業所）。
 *
 * 公開前確認で見つかった 5 件を固定する。いずれも「同じ判定を別ルートで決めていた」ことが原因。
 *   1. ログインID採番が承認経路だけ重複を検査していなかった
 *      → 退会者が同じ介護支援専門員番号で再入会すると、認証行が重複し
 *        findRowByColumnValue_ が古い無効行を先に返して新会員がログインできない
 *   2. 賛助会員のログインIDが会員ID（8桁）で、仕様（9+8桁）と食い違っていた
 *   3. 事業所職員のカナだけ正規化されず、不正文字が入ると読み取り側で例外になった
 *   4. 職員数上限が 10 のリテラルで、システム設定を無視していた
 *   5. 申込時にサーバ側検証が無く、認証不要の経路から不正な申請を作れた
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

/**
 * 行コメントを除いたコードだけを返す。
 * 「直書きに戻していないか」を見る検査は、変更理由を書いたコメントの中の
 * 旧コードを拾ってしまうため（実際に一度そうなった）、コード本体だけを対象にする。
 */
function codeOnly(source: string): string {
  return source.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
}

/** 実ソースから関数定義を切り出す（ミラー実装を書かない・AGENTS.md §3） */
function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  for (let i = gas.indexOf('{', start); i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

// ── 採番（重大1・#4）────────────────────────────────────────────
const idApi = new Function(`
  ${extractFunction('generateAutoLoginId_')}
  ${extractFunction('generateCmBasedLoginId_')}
  return { generateAutoLoginId_, generateCmBasedLoginId_ };
`)() as {
  generateAutoLoginId_: (existing: string[]) => string;
  generateCmBasedLoginId_: (cm: string, existing: string[]) => string;
};

test('個人会員: 専門員番号がそのままログインIDになる', () => {
  assert.equal(idApi.generateCmBasedLoginId_('12345678', []), '12345678');
});

test('重複時は先頭に数字を足して回避する（退会者の認証行が残っていても衝突しない）', () => {
  const id = idApi.generateCmBasedLoginId_('12345678', ['12345678']);
  assert.notEqual(id, '12345678');
  assert.match(id, /^\d9?12345678$|^\d{9}$/);
});

test('賛助会員: 専門員番号が無ければ 9 で始まる 9 桁（RD BR-01）', () => {
  const id = idApi.generateCmBasedLoginId_('', []);
  assert.match(id, /^9\d{8}$/, `想定外の形式: ${id}`);
});

test('承認経路が採番関数を通している（会員ID直書きに戻していない）', () => {
  const body = codeOnly(extractFunction('createMemberApplicationDirectLocked_'));
  assert.ok(
    !/var loginId = memberTypeCode === 'INDIVIDUAL'/.test(body),
    '個人/賛助のログインIDが会員IDの直書きに戻っている'
  );
  assert.ok(!/var loginId = cmNumber;/.test(body), '事業所職員のログインIDが直書きに戻っている');
  const calls = body.match(/generateCmBasedLoginId_\(/g) || [];
  assert.equal(calls.length, 2, '採番関数の呼び出しは個人/賛助と事業所職員の 2 箇所');
  assert.ok(/existingLoginIds\.push\(loginId\)/.test(body), '払い出したIDを既存一覧へ追加していない');
});

// ── 排他制御と部分書き込み（重大2）──────────────────────────────
test('承認は ScriptLock で直列化する', () => {
  const wrapper = codeOnly(extractFunction('createMemberApplicationDirect_'));
  assert.ok(/LockService\.getScriptLock\(\)/.test(wrapper), 'ロックを取得していない');
  assert.ok(/releaseLock\(\)/.test(wrapper), 'ロックを解放していない');
});

test('事業所は全職員を検証してから書き込む（部分書き込みを避ける）', () => {
  const body = codeOnly(extractFunction('createMemberApplicationDirectLocked_'));
  // 事前検証ループ（書き込みを伴わない）が、最初の職員行の書き込みより前にあること。
  // コメント文ではなくコードで位置を見る。
  const validateAt = body.search(/for \(var v = 0; v < staffList\.length; v\+\+\)/);
  const appendAt = body.indexOf('staffSheet.appendRow');
  assert.notEqual(validateAt, -1, '事前検証のループが無い');
  assert.notEqual(appendAt, -1, '職員行の書き込みが見つからない');
  assert.ok(validateAt < appendAt, '検証が書き込みより後になっている');
});

// ── カナ正規化（#3）────────────────────────────────────────────
test('事業所職員のカナも全角カタカナへ正規化して保存する', () => {
  const body = codeOnly(extractFunction('createMemberApplicationDirectLocked_'));
  assert.ok(
    !/case 'セイ': return String\(s\.lastKana \|\| ''\)\.trim\(\);/.test(body),
    '職員のセイが素通しに戻っている'
  );
  assert.ok(
    /case 'セイ': return normalizeAndValidateKana_\(s\.lastKana/.test(body),
    '職員のセイが normalizeAndValidateKana_ を通っていない'
  );
  assert.ok(
    /case 'メイ': return normalizeAndValidateKana_\(s\.firstKana/.test(body),
    '職員のメイが normalizeAndValidateKana_ を通っていない'
  );
});

// ── 職員数上限（#5）────────────────────────────────────────────
test('職員数上限はシステム設定から取る（10 のリテラルに戻していない）', () => {
  const body = codeOnly(extractFunction('createMemberApplicationDirectLocked_'));
  assert.ok(!/isBusiness \? 10 : ''/.test(body), '職員数上限が 10 の直書きに戻っている');
  assert.ok(/isBusiness \? businessStaffLimit : ''/.test(body), '設定値を使っていない');
  assert.ok(/staffList\.length > businessStaffLimit/.test(body), '上限超過の検査が無い');

  const limitFn = extractFunction('resolveDefaultBusinessStaffLimit_');
  assert.ok(/DEFAULT_BUSINESS_STAFF_LIMIT/.test(limitFn), '設定キーを読んでいない');
});

// ── 申込時のサーバ側検証（#5・AGENTS.md §6）──────────────────────
const validate = new Function(`
  ${extractFunction('normalizeKana_')}
  ${extractFunction('isValidFullwidthKatakana_')}
  ${extractFunction('normalizeAndValidateKana_')}
  ${extractFunction('validateMemberApplicationPayload_')}
  return validateMemberApplicationPayload_;
`)() as (payload: Record<string, unknown>, memberType: string) => void;

const individual = (over: Record<string, unknown> = {}) => ({
  lastName: '山田', firstName: '太郎',
  lastKana: 'ヤマダ', firstKana: 'タロウ',
  careManagerNumber: '12345678',
  email: 'taro@example.invalid',
  ...over,
});

test('個人会員: 正しい申込は通る', () => {
  assert.doesNotThrow(() => validate(individual(), 'INDIVIDUAL'));
});

test('個人会員: 専門員番号が 8 桁でなければ申込を受け付けない', () => {
  assert.throws(() => validate(individual({ careManagerNumber: '123' }), 'INDIVIDUAL'), /8桁/);
});

test('賛助会員: 専門員番号は任意（空でも通る）', () => {
  assert.doesNotThrow(() => validate(individual({ careManagerNumber: '' }), 'SUPPORT'));
});

test('カナはひらがな・半角カナでも受け付ける（保存時に全角化する前提）', () => {
  assert.doesNotThrow(() => validate(individual({ lastKana: 'やまだ', firstKana: 'ﾀﾛｳ' }), 'INDIVIDUAL'));
});

test('カナに漢字が混じる申込は受け付けない（会員一覧が開けなくなるため）', () => {
  assert.throws(() => validate(individual({ lastKana: '山田' }), 'INDIVIDUAL'), /セイ/);
});

test('メールアドレスの形式を検証する', () => {
  assert.throws(() => validate(individual({ email: 'not-an-email' }), 'INDIVIDUAL'), /メールアドレス/);
});

test('事業所会員: 職員 0 名の申込は受け付けない', () => {
  assert.throws(() => validate({ staff: [] }, 'BUSINESS'), /最低1名/);
});

test('事業所会員: 職員のカナ・番号・メールを検証する', () => {
  const staff = (over: Record<string, unknown> = {}) => ([{
    lastName: '枚方', firstName: '花子', lastKana: 'ヒラカタ', firstKana: 'ハナコ',
    careManagerNumber: '87654321', email: 'hanako@example.invalid', role: 'REPRESENTATIVE',
    ...over,
  }]);
  assert.doesNotThrow(() => validate({ staff: staff() }, 'BUSINESS'));
  assert.throws(() => validate({ staff: staff({ careManagerNumber: 'abc' }) }, 'BUSINESS'), /8桁/);
  assert.throws(() => validate({ staff: staff({ email: '' }) }, 'BUSINESS'), /メールアドレス/);
  assert.throws(() => validate({ staff: staff({ firstKana: '花子' }) }, 'BUSINESS'), /メイ/);
});
